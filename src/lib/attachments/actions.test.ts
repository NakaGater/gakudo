import { describe, it, expect, vi, beforeEach } from "vitest";

// I/O 境界のみモック (getUser, Supabase storage / table)。
// ファイル検証 (空ファイル、サイズ上限、mime) は files/validation.test.ts でカバー。
const mockGetUser = vi.fn();
vi.mock("@/lib/auth/get-user", () => ({
  getUser: () => mockGetUser(),
}));

const mockUpload = vi.fn();
const mockRemove = vi.fn();
const mockCreateSignedUrl = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      storage: {
        from: () => ({
          upload: mockUpload,
          remove: mockRemove,
          createSignedUrl: mockCreateSignedUrl,
        }),
      },
      from: (...args: unknown[]) => mockFrom(...args),
    }),
  ),
}));

import {
  uploadAttachment,
  deleteAttachment,
  getAttachments,
  getAttachmentUrl,
} from "./actions";

describe("uploadAttachment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects non-staff users", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
    const fd = new FormData();
    fd.set("file", new File(["x"], "test.pdf", { type: "application/pdf" }));

    const result = await uploadAttachment("announcement", "ann-1", fd);
    expect(result).toMatchObject({ success: false, message: expect.stringContaining("権限") });
  });

  it("propagates the validator's error message for invalid files", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const fd = new FormData(); // no file → validateFile rejects

    const result = await uploadAttachment("announcement", "ann-1", fd);
    expect(result).toEqual({ success: false, message: "ファイルを選択してください" });
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("rejects disallowed mime types via validateFileType", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const fd = new FormData();
    fd.set("file", new File(["x"], "bad.exe", { type: "application/x-msdownload" }));

    const result = await uploadAttachment("announcement", "ann-1", fd);
    expect(result.success).toBe(false);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("uploads PDF and returns the inserted attachment row on success", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    mockUpload.mockResolvedValue({ error: null });
    const inserted = {
      id: "att-1",
      file_name: "doc.pdf",
      file_path: "announcement/ann-1/123-doc.pdf",
      file_size: 3,
      mime_type: "application/pdf",
      created_at: "2025-01-01T00:00:00Z",
    };
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: inserted, error: null }),
        }),
      }),
    });

    const fd = new FormData();
    fd.set("file", new File(["pdf"], "doc.pdf", { type: "application/pdf" }));

    const result = await uploadAttachment("announcement", "ann-1", fd);
    expect(result).toMatchObject({ success: true, attachment: inserted });
    expect(mockUpload).toHaveBeenCalledTimes(1);
  });

  it("returns error when storage upload fails", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    mockUpload.mockResolvedValue({ error: { message: "Storage full" } });

    const fd = new FormData();
    fd.set("file", new File(["x"], "test.pdf", { type: "application/pdf" }));

    const result = await uploadAttachment("announcement", "ann-1", fd);
    expect(result).toMatchObject({ success: false, message: expect.stringContaining("Storage full") });
  });

  it("removes the uploaded blob on DB insert failure (cleanup)", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    mockUpload.mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
        }),
      }),
    });

    const fd = new FormData();
    fd.set("file", new File(["x"], "test.pdf", { type: "application/pdf" }));

    const result = await uploadAttachment("announcement", "ann-1", fd);
    expect(result.success).toBe(false);
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });
});

describe("deleteAttachment", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects non-staff users", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
    const result = await deleteAttachment("att-1");
    expect(result).toMatchObject({ success: false, message: expect.stringContaining("権限") });
  });

  it("returns 'not found' when attachment does not exist", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { message: "x" } }),
        }),
      }),
    });

    const result = await deleteAttachment("nonexistent");
    expect(result).toMatchObject({
      success: false,
      message: expect.stringContaining("見つかりません"),
    });
  });

  it("removes the blob and deletes the DB row on success", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: { id: "att-1", file_path: "test/path.pdf" },
              error: null,
            }),
        }),
      }),
      delete: () => ({ eq: deleteEq }),
    });

    const result = await deleteAttachment("att-1");
    expect(result).toMatchObject({ success: true });
    expect(mockRemove).toHaveBeenCalledWith(["test/path.pdf"]);
  });
});

describe("getAttachments", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the attachment list when present", async () => {
    const data = [
      {
        id: "a1",
        file_name: "f1.pdf",
        file_path: "p1",
        file_size: 100,
        mime_type: "application/pdf",
        created_at: "2025-01-01",
      },
    ];
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({ eq: () => ({ order: vi.fn().mockResolvedValue({ data }) }) }),
      }),
    });
    expect(await getAttachments("announcement", "ann-1")).toEqual(data);
  });

  it("returns an empty array when there are no rows", async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({ eq: () => ({ order: vi.fn().mockResolvedValue({ data: null }) }) }),
      }),
    });
    expect(await getAttachments("news", "n-1")).toEqual([]);
  });
});

describe("getAttachmentUrl", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the signed URL on success", async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://example.com/signed" },
    });
    expect(await getAttachmentUrl("test/path.pdf")).toBe("https://example.com/signed");
  });

  it("returns null when Supabase returns no data", async () => {
    mockCreateSignedUrl.mockResolvedValue({ data: null });
    expect(await getAttachmentUrl("bad/path.pdf")).toBeNull();
  });
});
