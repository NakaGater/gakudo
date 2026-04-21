import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock getUser
const mockGetUser = vi.fn();
vi.mock("@/lib/auth/get-user", () => ({
  getUser: () => mockGetUser(),
}));

// Mock Supabase
const mockUpload = vi.fn();
const mockRemove = vi.fn();
const mockCreateSignedUrl = vi.fn();
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();
const mockDelete = vi.fn();
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

  it("rejects non-staff users (parent)", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
    const fd = new FormData();
    fd.set("file", new File(["x"], "test.pdf", { type: "application/pdf" }));

    const result = await uploadAttachment("announcement", "ann-1", fd);
    expect(result.success).toBe(false);
    expect(result.message).toContain("権限");
  });

  it("rejects empty file", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const fd = new FormData();
    fd.set("file", new File([], "empty.pdf", { type: "application/pdf" }));

    const result = await uploadAttachment("announcement", "ann-1", fd);
    expect(result.success).toBe(false);
    expect(result.message).toContain("ファイルを選択");
  });

  it("rejects missing file", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const fd = new FormData();

    const result = await uploadAttachment("announcement", "ann-1", fd);
    expect(result.success).toBe(false);
    expect(result.message).toContain("ファイルを選択");
  });

  it("rejects files over 10MB", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const largeContent = new Uint8Array(11 * 1024 * 1024);
    const fd = new FormData();
    fd.set("file", new File([largeContent], "big.pdf", { type: "application/pdf" }));

    const result = await uploadAttachment("announcement", "ann-1", fd);
    expect(result.success).toBe(false);
    expect(result.message).toContain("10MB");
  });

  it("rejects disallowed file types", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "teacher" });
    const fd = new FormData();
    fd.set("file", new File(["x"], "bad.exe", { type: "application/x-msdownload" }));

    const result = await uploadAttachment("news", "n-1", fd);
    expect(result.success).toBe(false);
    expect(result.message).toContain("PDF");
  });

  it("allows PDF files", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    mockUpload.mockResolvedValue({ error: null });
    const mockData = {
      id: "att-1",
      file_name: "doc.pdf",
      file_path: "announcement/ann-1/123-doc.pdf",
      file_size: 3,
      mime_type: "application/pdf",
      created_at: "2025-01-01T00:00:00Z",
    };
    mockSingle.mockResolvedValue({ data: mockData, error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: () => ({ single: mockSingle }) });
    mockFrom.mockReturnValue({ insert: mockInsert });

    const fd = new FormData();
    fd.set("file", new File(["pdf"], "doc.pdf", { type: "application/pdf" }));

    const result = await uploadAttachment("announcement", "ann-1", fd);
    expect(result.success).toBe(true);
    expect(result.attachment).toEqual(mockData);
    expect(mockUpload).toHaveBeenCalledTimes(1);
  });

  it("allows image files (jpeg, png, gif, webp)", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "teacher" });
    mockUpload.mockResolvedValue({ error: null });
    mockSingle.mockResolvedValue({
      data: { id: "att-2", file_name: "photo.jpg", file_path: "p", file_size: 3, mime_type: "image/jpeg", created_at: "" },
      error: null,
    });
    mockInsert.mockReturnValue({ select: () => ({ single: mockSingle }) });
    mockFrom.mockReturnValue({ insert: mockInsert });

    const fd = new FormData();
    fd.set("file", new File(["img"], "photo.jpg", { type: "image/jpeg" }));

    const result = await uploadAttachment("news", "n-1", fd);
    expect(result.success).toBe(true);
  });

  it("returns error on storage upload failure", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    mockUpload.mockResolvedValue({ error: { message: "Storage full" } });

    const fd = new FormData();
    fd.set("file", new File(["x"], "test.pdf", { type: "application/pdf" }));

    const result = await uploadAttachment("announcement", "ann-1", fd);
    expect(result.success).toBe(false);
    expect(result.message).toContain("Storage full");
  });

  it("cleans up storage on DB insert failure", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    mockUpload.mockResolvedValue({ error: null });
    mockSingle.mockResolvedValue({ data: null, error: { message: "DB error" } });
    mockInsert.mockReturnValue({ select: () => ({ single: mockSingle }) });
    mockFrom.mockReturnValue({ insert: mockInsert });

    const fd = new FormData();
    fd.set("file", new File(["x"], "test.pdf", { type: "application/pdf" }));

    const result = await uploadAttachment("announcement", "ann-1", fd);
    expect(result.success).toBe(false);
    expect(result.message).toContain("DB error");
    expect(mockRemove).toHaveBeenCalledTimes(1);
  });
});

describe("deleteAttachment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects non-staff users", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
    const result = await deleteAttachment("att-1");
    expect(result.success).toBe(false);
    expect(result.message).toContain("権限");
  });

  it("returns error when attachment not found", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    mockFrom.mockReturnValue({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: "Not found" } }) }) }),
      delete: () => ({ eq: mockEq }),
    });

    const result = await deleteAttachment("nonexistent");
    expect(result.success).toBe(false);
    expect(result.message).toContain("見つかりません");
  });

  it("deletes attachment from storage and DB", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { id: "att-1", file_path: "test/path.pdf" }, error: null }),
        }),
      }),
      delete: () => ({ eq: mockDeleteEq }),
    });

    const result = await deleteAttachment("att-1");
    expect(result.success).toBe(true);
    expect(result.message).toContain("削除");
    expect(mockRemove).toHaveBeenCalledWith(["test/path.pdf"]);
  });
});

describe("getAttachments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns attachment list for entity", async () => {
    const mockData = [
      { id: "a1", file_name: "f1.pdf", file_path: "p1", file_size: 100, mime_type: "application/pdf", created_at: "2025-01-01" },
      { id: "a2", file_name: "f2.png", file_path: "p2", file_size: 200, mime_type: "image/png", created_at: "2025-01-02" },
    ];
    mockOrder.mockResolvedValue({ data: mockData });
    mockFrom.mockReturnValue({
      select: () => ({ eq: () => ({ eq: () => ({ order: mockOrder }) }) }),
    });

    const result = await getAttachments("announcement", "ann-1");
    expect(result).toHaveLength(2);
    expect(result[0].file_name).toBe("f1.pdf");
  });

  it("returns empty array when no attachments", async () => {
    mockOrder.mockResolvedValue({ data: null });
    mockFrom.mockReturnValue({
      select: () => ({ eq: () => ({ eq: () => ({ order: mockOrder }) }) }),
    });

    const result = await getAttachments("news", "n-1");
    expect(result).toEqual([]);
  });
});

describe("getAttachmentUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns signed URL", async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://example.com/signed" },
    });

    const result = await getAttachmentUrl("test/path.pdf");
    expect(result).toBe("https://example.com/signed");
    expect(mockCreateSignedUrl).toHaveBeenCalledWith("test/path.pdf", 3600);
  });

  it("returns null on error", async () => {
    mockCreateSignedUrl.mockResolvedValue({ data: null });

    const result = await getAttachmentUrl("bad/path.pdf");
    expect(result).toBeNull();
  });
});
