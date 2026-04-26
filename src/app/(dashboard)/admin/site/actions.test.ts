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

const holder = vi.hoisted(() => ({
  current: null as ReturnType<typeof createSupabaseMock> | null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(holder.current!.client),
}));

import { updateSitePage } from "./actions";

describe("updateSitePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
  });

  it("rejects non-admin users with UNAUTHORIZED (Phase 2-C: redirect → ActionResult)", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "teacher" });

    const result = await updateSitePage("home", null, new FormData());
    expect(result?.success).toBe(false);
    expect(result?.message).toMatch(/権限/);
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("validates title is required", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const fd = new FormData();
    fd.set("title", "");
    fd.set("content", "some content");

    const result = await updateSitePage("home", null, fd);
    expect(result?.success).toBe(false);
    expect(result?.message).toContain("タイトル");
  });

  it("validates content is required", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const fd = new FormData();
    fd.set("title", "ホーム");
    // content not set at all

    const result = await updateSitePage("home", null, fd);
    expect(result?.success).toBe(false);
    expect(result?.message).toContain("コンテンツ");
  });

  it("validates metadata JSON format", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const fd = new FormData();
    fd.set("title", "ホーム");
    fd.set("content", "コンテンツ");
    fd.set("metadata", "{invalid json}");

    const result = await updateSitePage("home", null, fd);
    expect(result?.success).toBe(false);
    expect(result?.message).toContain("JSON");
  });

  it("updates page successfully", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });

    const fd = new FormData();
    fd.set("title", "ホーム");
    fd.set("content", "新しいコンテンツ");
    fd.set("metadata", '{"heroText":"テスト"}');

    const result = await updateSitePage("home", null, fd);
    expect(result?.success).toBe(true);
    expect(result?.message).toContain("保存");
    expect(holder.current!.spies.fromCalls).toContain("site_pages");
    expect(holder.current!.spies.mutations).toContainEqual(
      expect.objectContaining({ table: "site_pages", op: "update" }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });

  it("updates page without metadata", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });

    const fd = new FormData();
    fd.set("title", "アクセス");
    fd.set("content", "内容");

    const result = await updateSitePage("access", null, fd);
    expect(result?.success).toBe(true);
  });

  it("returns error on DB failure", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    holder.current = createSupabaseMock({
      tables: { site_pages: { data: null, error: { message: "DB error" } } },
    });

    const fd = new FormData();
    fd.set("title", "ホーム");
    fd.set("content", "コンテンツ");

    const result = await updateSitePage("home", null, fd);
    expect(result?.success).toBe(false);
    expect(result?.message).not.toContain("DB error");
  });
});
