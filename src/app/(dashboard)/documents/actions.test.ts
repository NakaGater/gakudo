import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockStorageUpload = vi.fn();
const mockStorageRemove = vi.fn();
const mockInsert = vi.fn();
const mockSingle = vi.fn();
const mockDeleteEq = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("@/lib/auth/get-user", () => ({
  getUser: () => mockGetUser(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: () => ({
        insert: (...a: unknown[]) => mockInsert(...a),
        select: () => ({
          eq: () => ({
            single: () => mockSingle(),
          }),
        }),
        delete: () => ({
          eq: (...e: unknown[]) => mockDeleteEq(...e),
        }),
      }),
      storage: {
        from: () => ({
          upload: (...a: unknown[]) => mockStorageUpload(...a),
          remove: (...a: unknown[]) => mockStorageRemove(...a),
        }),
      },
    }),
  ),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

import { uploadDocument, deleteDocument } from "./actions";

function pdfFile(name = "guide.pdf", size = 64): File {
  // Real PDF magic bytes (%PDF) so validateFileMagicBytes accepts the
  // fixture; size is padded to keep the upload-size assertions happy.
  const bytes = new Uint8Array(size);
  bytes[0] = 0x25; // %
  bytes[1] = 0x50; // P
  bytes[2] = 0x44; // D
  bytes[3] = 0x46; // F
  return new File([bytes], name, { type: "application/pdf" });
}

function form(fields: Record<string, string | File>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v instanceof File) fd.set(k, v);
    else fd.set(k, v);
  }
  return fd;
}

describe("uploadDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ id: "u-staff", role: "teacher" });
  });

  it("rejects non-staff users", async () => {
    mockGetUser.mockResolvedValue({ id: "u-parent", role: "parent" });
    const result = await uploadDocument(
      null,
      form({ title: "x", category: "お便り", file: pdfFile() }),
    );
    expect(result.success).toBe(false);
    expect(mockStorageUpload).not.toHaveBeenCalled();
  });

  it("aggregates field errors when all required fields are missing", async () => {
    const fd = new FormData();
    fd.set("file", new File([new Blob()], "empty.pdf", { type: "application/pdf" }));
    const result = await uploadDocument(null, fd);
    expect(result.success).toBe(false);
    expect(result.fieldErrors?.title).toBeTruthy();
    expect(result.fieldErrors?.category).toBeTruthy();
    expect(result.fieldErrors?.file).toBeTruthy();
  });

  it("rejects an invalid category", async () => {
    const result = await uploadDocument(
      null,
      form({ title: "title", category: "未定義カテゴリ", file: pdfFile() }),
    );
    expect(result.success).toBe(false);
    expect(result.fieldErrors?.category).toBeTruthy();
  });

  it("rejects disallowed file types", async () => {
    const exe = new File([new Uint8Array(8)], "evil.exe", {
      type: "application/x-msdownload",
    });
    const result = await uploadDocument(null, form({ title: "t", category: "お便り", file: exe }));
    expect(result.success).toBe(false);
    expect(result.fieldErrors?.file).toBeTruthy();
  });

  it("rejects a renamed executable that claims application/pdf", async () => {
    // Browser-supplied MIME passes validateFileType, but the bytes are
    // a Windows executable. validateFileMagicBytes catches the spoof.
    const evil = new File([new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03])], "evil.pdf", {
      type: "application/pdf",
    });
    const result = await uploadDocument(null, form({ title: "t", category: "お便り", file: evil }));
    expect(result.success).toBe(false);
    expect(result.fieldErrors?.file).toBeTruthy();
    expect(mockStorageUpload).not.toHaveBeenCalled();
  });

  it("happy path: uploads and inserts a row", async () => {
    mockStorageUpload.mockResolvedValue({ error: null });
    mockInsert.mockResolvedValue({ error: null });
    const result = await uploadDocument(
      null,
      form({ title: " 計画書 ", category: "書類", file: pdfFile() }),
    );
    expect(result.success).toBe(true);
    expect(mockStorageUpload).toHaveBeenCalledOnce();
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "計画書",
        category: "書類",
        uploaded_by: "u-staff",
      }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/documents");
  });

  it("removes uploaded file on DB insert failure (cleanup)", async () => {
    mockStorageUpload.mockResolvedValue({ error: null });
    mockInsert.mockResolvedValue({ error: { message: "constraint" } });
    const result = await uploadDocument(
      null,
      form({ title: "t", category: "お便り", file: pdfFile() }),
    );
    expect(result.success).toBe(false);
    expect(mockStorageRemove).toHaveBeenCalledOnce();
  });
});

describe("deleteDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns not-found when the document does not exist", async () => {
    mockGetUser.mockResolvedValue({ id: "u-admin", role: "admin" });
    mockSingle.mockResolvedValue({ data: null, error: { message: "no rows" } });
    const result = await deleteDocument("missing");
    expect(result.success).toBe(false);
    expect(mockStorageRemove).not.toHaveBeenCalled();
  });

  it("teacher cannot delete a document uploaded by someone else", async () => {
    mockGetUser.mockResolvedValue({ id: "u-teacher", role: "teacher" });
    mockSingle.mockResolvedValue({
      data: { id: "d-1", file_path: "owner/x.pdf", uploaded_by: "u-other" },
      error: null,
    });
    const result = await deleteDocument("d-1");
    expect(result.success).toBe(false);
    expect(mockStorageRemove).not.toHaveBeenCalled();
  });

  it("admin can delete any document", async () => {
    mockGetUser.mockResolvedValue({ id: "u-admin", role: "admin" });
    mockSingle.mockResolvedValue({
      data: { id: "d-1", file_path: "owner/x.pdf", uploaded_by: "u-other" },
      error: null,
    });
    mockStorageRemove.mockResolvedValue({ error: null });
    mockDeleteEq.mockResolvedValue({ error: null });
    const result = await deleteDocument("d-1");
    expect(result.success).toBe(true);
    expect(mockStorageRemove).toHaveBeenCalledWith(["owner/x.pdf"]);
  });

  it("uploader can delete their own document", async () => {
    mockGetUser.mockResolvedValue({ id: "u-self", role: "teacher" });
    mockSingle.mockResolvedValue({
      data: { id: "d-1", file_path: "self/x.pdf", uploaded_by: "u-self" },
      error: null,
    });
    mockStorageRemove.mockResolvedValue({ error: null });
    mockDeleteEq.mockResolvedValue({ error: null });
    const result = await deleteDocument("d-1");
    expect(result.success).toBe(true);
  });
});
