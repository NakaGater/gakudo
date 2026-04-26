import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/cache
const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

// Mock next/navigation
const mockRedirect = vi.fn<(url: string) => never>();
vi.mock("next/navigation", () => ({
  redirect: (...args: Parameters<typeof mockRedirect>) => {
    mockRedirect(...args);
    throw new Error(`NEXT_REDIRECT:${args[0]}`);
  },
}));

// Mock getUser
const mockGetUser = vi.fn();
vi.mock("@/lib/auth/get-user", () => ({
  getUser: () => mockGetUser(),
}));

// Mock uploadAttachment
const mockUploadAttachment = vi.fn();
vi.mock("@/lib/attachments/actions", () => ({
  uploadAttachment: (...args: unknown[]) => mockUploadAttachment(...args),
}));

// Mock Supabase - chainable query builder
const mockSingle = vi.fn();
const mockSelect = vi.fn(() => ({ single: mockSingle }));
const mockInsert = vi.fn(() => ({ select: mockSelect }));
const mockFrom = vi.fn();
mockFrom.mockReturnValue({ insert: mockInsert });
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: mockFrom,
    }),
  ),
}));

import { createNews, deleteNews } from "./actions";

describe("deleteNews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects non-admin with UNAUTHORIZED (Phase 2-C: redirect → ActionResult)", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "teacher" });
    const result = await deleteNews("news-1");
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/権限/);
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("deletes news successfully", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockDelete = vi.fn(() => ({ eq: mockEq }));
    mockFrom.mockReturnValue({ delete: mockDelete });

    const result = await deleteNews("news-1");
    expect(result).toEqual({ success: true, message: "削除しました" });
    expect(mockFrom).toHaveBeenCalledWith("site_news");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/news");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/site/news");
  });

  it("returns error on DB failure", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const mockEq = vi.fn().mockResolvedValue({ error: { message: "FK violation" } });
    const mockDelete = vi.fn(() => ({ eq: mockEq }));
    mockFrom.mockReturnValue({ delete: mockDelete });

    const result = await deleteNews("news-1");
    expect(result?.success).toBe(false);
    expect(result?.message).not.toContain("FK violation");
    expect(result?.success).toBe(false);
  });
});

describe("createNews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore the chainable mock for createNews
    mockFrom.mockImplementation(() => ({ insert: mockInsert }));
  });

  it("rejects non-admin with UNAUTHORIZED (Phase 2-C: redirect → ActionResult)", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "teacher" });

    const result = await createNews(null, new FormData());
    expect(result?.success).toBe(false);
    expect(result?.message).toMatch(/権限/);
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("validates title is required", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const fd = new FormData();
    fd.set("title", "");
    fd.set("body", "Some body");

    const result = await createNews(null, fd);
    expect(result?.success).toBe(false);
    expect(result?.message).toContain("タイトル");
  });

  it("validates body is required", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const fd = new FormData();
    fd.set("title", "Test Title");
    fd.set("body", "");

    const result = await createNews(null, fd);
    expect(result?.success).toBe(false);
    expect(result?.message).toContain("本文");
  });

  it("creates news and handles file uploads", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    mockSingle.mockResolvedValue({ data: { id: "news-1" }, error: null });
    mockUploadAttachment.mockResolvedValue({ success: true });

    const fd = new FormData();
    fd.set("title", "ニュースタイトル");
    fd.set("body", "ニュース本文");
    fd.append("files", new File(["pdf"], "doc.pdf", { type: "application/pdf" }));

    // createNews calls redirect on success, which throws
    await expect(createNews(null, fd)).rejects.toThrow("NEXT_REDIRECT");
    expect(mockFrom).toHaveBeenCalledWith("site_news");
    expect(mockUploadAttachment).toHaveBeenCalledWith("news", "news-1", expect.any(FormData));
    expect(mockRevalidatePath).toHaveBeenCalledWith("/news");
  });

  it("returns error on DB failure", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    mockSingle.mockResolvedValue({ data: null, error: { message: "DB error" } });

    const fd = new FormData();
    fd.set("title", "Test");
    fd.set("body", "Body");

    const result = await createNews(null, fd);
    expect(result?.success).toBe(false);
    expect(result?.message).not.toContain("DB error");
    expect(result?.success).toBe(false);
  });
});
