import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock } from "@/test/supabase-mock-factory";

const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

const mockRedirect = vi.fn<(url: string) => never>();
vi.mock("next/navigation", () => ({
  redirect: (...args: Parameters<typeof mockRedirect>) => {
    mockRedirect(...args);
    throw new Error(`NEXT_REDIRECT:${args[0]}`);
  },
}));

const mockGetUser = vi.fn();
vi.mock("@/lib/auth/get-user", () => ({
  getUser: () => mockGetUser(),
}));

const mockUploadAttachment = vi.fn();
vi.mock("@/lib/attachments/actions", () => ({
  uploadAttachment: (...args: unknown[]) => mockUploadAttachment(...args),
}));

const holder = vi.hoisted(() => ({
  current: null as ReturnType<typeof createSupabaseMock> | null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(holder.current!.client),
}));

import { createNews, deleteNews } from "./actions";

describe("deleteNews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
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

    const result = await deleteNews("news-1");
    expect(result).toEqual({ success: true, message: "削除しました" });
    expect(holder.current!.spies.fromCalls).toContain("site_news");
    expect(holder.current!.spies.mutations).toContainEqual(
      expect.objectContaining({ table: "site_news", op: "delete" }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/news");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/site/news");
  });

  it("returns error on DB failure", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    holder.current = createSupabaseMock({
      tables: { site_news: { data: null, error: { message: "FK violation" } } },
    });

    const result = await deleteNews("news-1");
    expect(result?.success).toBe(false);
    expect(result?.message).not.toContain("FK violation");
  });
});

describe("createNews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
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
    holder.current = createSupabaseMock({
      tables: { site_news: { data: { id: "news-1" }, error: null } },
    });
    mockUploadAttachment.mockResolvedValue({ success: true });

    const fd = new FormData();
    fd.set("title", "ニュースタイトル");
    fd.set("body", "ニュース本文");
    fd.append("files", new File(["pdf"], "doc.pdf", { type: "application/pdf" }));

    // createNews calls redirect on success, which throws
    await expect(createNews(null, fd)).rejects.toThrow("NEXT_REDIRECT");
    expect(holder.current!.spies.fromCalls).toContain("site_news");
    expect(mockUploadAttachment).toHaveBeenCalledWith("news", "news-1", expect.any(FormData));
    expect(mockRevalidatePath).toHaveBeenCalledWith("/news");
  });

  it("returns error on DB failure", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    holder.current = createSupabaseMock({
      tables: { site_news: { data: null, error: { message: "DB error" } } },
    });

    const fd = new FormData();
    fd.set("title", "Test");
    fd.set("body", "Body");

    const result = await createNews(null, fd);
    expect(result?.success).toBe(false);
    expect(result?.message).not.toContain("DB error");
  });
});
