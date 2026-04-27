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
const mockDeleteAttachment = vi.fn();
vi.mock("@/lib/attachments/actions", () => ({
  uploadAttachment: (...args: unknown[]) => mockUploadAttachment(...args),
  deleteAttachment: (...args: unknown[]) => mockDeleteAttachment(...args),
}));

const holder = vi.hoisted(() => ({
  current: null as ReturnType<typeof createSupabaseMock> | null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(holder.current!.client),
}));

import { createNews, deleteNews, getNewsRevisions, updateNews } from "./actions";

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

describe("updateNews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock({
      tables: {
        site_news: {
          // First select: current row before update.
          // Second mutation: update.
          data: { id: "news-1", title: "旧タイトル", body: "旧本文" },
          error: null,
        },
        attachments: { data: [], error: null },
        site_news_revisions: { data: { id: "rev-1" }, error: null },
      },
    });
    mockUploadAttachment.mockResolvedValue({ success: true });
    mockDeleteAttachment.mockResolvedValue({ success: true });
  });

  it("rejects non-admin with UNAUTHORIZED", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "teacher" });
    const fd = new FormData();
    fd.set("title", "T");
    fd.set("body", "B");

    const result = await updateNews("news-1", null, fd);
    expect(result?.success).toBe(false);
    expect(result?.message).toMatch(/権限/);
  });

  it("validates title and body are required", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });

    const fdNoTitle = new FormData();
    fdNoTitle.set("title", "");
    fdNoTitle.set("body", "B");
    const r1 = await updateNews("news-1", null, fdNoTitle);
    expect(r1?.success).toBe(false);
    expect(r1?.message).toContain("タイトル");

    const fdNoBody = new FormData();
    fdNoBody.set("title", "T");
    fdNoBody.set("body", "");
    const r2 = await updateNews("news-1", null, fdNoBody);
    expect(r2?.success).toBe(false);
    expect(r2?.message).toContain("本文");
  });

  it("snapshots the current row into site_news_revisions before updating", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });

    const fd = new FormData();
    fd.set("title", "新タイトル");
    fd.set("body", "新本文");

    const result = await updateNews("news-1", null, fd);
    expect(result).toEqual({ success: true, message: "保存しました" });

    // Revision write happens BEFORE the live update so the snapshot
    // captures the pre-edit state.
    expect(holder.current!.spies.fromCalls).toContain("site_news_revisions");
    const revisionInsert = holder.current!.spies.mutations.find(
      (m) => m.table === "site_news_revisions" && m.op === "insert",
    );
    expect(revisionInsert).toBeDefined();

    // Live row gets the new title/body and updated_by.
    const newsUpdate = holder.current!.spies.mutations.find(
      (m) => m.table === "site_news" && m.op === "update",
    );
    expect(newsUpdate).toBeDefined();

    // Public + admin caches invalidated (but NOT the current edit page —
    // see the CMS save action's drop-self-revalidate fix; same rationale).
    expect(mockRevalidatePath).toHaveBeenCalledWith("/news");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/news/news-1");
    expect(mockRevalidatePath).not.toHaveBeenCalledWith(
      expect.stringMatching(/^\/admin\/site\/news\/.+\/edit/),
    );
  });

  it("removes attachments listed in removed_attachment_ids", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });

    const fd = new FormData();
    fd.set("title", "T");
    fd.set("body", "B");
    fd.append("removed_attachment_ids", "att-1");
    fd.append("removed_attachment_ids", "att-2");

    const result = await updateNews("news-1", null, fd);
    expect(result?.success).toBe(true);
    expect(mockDeleteAttachment).toHaveBeenCalledTimes(2);
    expect(mockDeleteAttachment).toHaveBeenCalledWith("att-1");
    expect(mockDeleteAttachment).toHaveBeenCalledWith("att-2");
  });

  it("uploads new files passed via formData", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });

    const fd = new FormData();
    fd.set("title", "T");
    fd.set("body", "B");
    fd.append("files", new File(["pdf"], "doc.pdf", { type: "application/pdf" }));

    const result = await updateNews("news-1", null, fd);
    expect(result?.success).toBe(true);
    expect(mockUploadAttachment).toHaveBeenCalledWith("news", "news-1", expect.any(FormData));
  });

  it("returns error on DB failure during update", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    holder.current = createSupabaseMock({
      tables: {
        site_news: { data: null, error: { message: "DB error" } },
        attachments: { data: [], error: null },
        site_news_revisions: { data: { id: "rev-1" }, error: null },
      },
    });

    const fd = new FormData();
    fd.set("title", "T");
    fd.set("body", "B");

    const result = await updateNews("news-1", null, fd);
    expect(result?.success).toBe(false);
    // sanitizeError replaces the raw message in non-dev environments
    expect(result?.message).not.toContain("DB error");
  });
});

describe("getNewsRevisions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
  });

  it("rejects non-admin with empty list", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "teacher" });
    const result = await getNewsRevisions("news-1");
    expect(result).toEqual([]);
  });

  it("returns the revisions for a news id", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    holder.current = createSupabaseMock({
      tables: {
        site_news_revisions: {
          data: [
            {
              id: "rev-2",
              title: "v2 title",
              body: "v2 body",
              attachments: [],
              edited_at: "2026-01-02T00:00:00Z",
              edited_by: "u1",
            },
            {
              id: "rev-1",
              title: "v1 title",
              body: "v1 body",
              attachments: [],
              edited_at: "2026-01-01T00:00:00Z",
              edited_by: "u1",
            },
          ],
          error: null,
        },
      },
    });

    const result = await getNewsRevisions("news-1");
    expect(result).toHaveLength(2);
    expect(result[0]?.title).toBe("v2 title");
  });
});
