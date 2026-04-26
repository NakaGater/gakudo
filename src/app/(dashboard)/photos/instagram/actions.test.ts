import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock } from "@/test/supabase-mock-factory";

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

const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

import { addInstagramPost, deleteInstagramPost, toggleInstagramPostVisibility } from "./actions";

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("addInstagramPost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
    mockGetUser.mockResolvedValue({ id: "u-admin", role: "admin" });
  });

  it("rejects non-staff users", async () => {
    mockGetUser.mockResolvedValue({ id: "u-parent", role: "parent" });
    const result = await addInstagramPost(
      null,
      form({ post_url: "https://www.instagram.com/p/abc123/" }),
    );
    expect(result.success).toBe(false);
    expect(holder.current!.spies.mutations.filter((m) => m.op === "insert")).toHaveLength(0);
  });

  it("rejects empty URL", async () => {
    const result = await addInstagramPost(null, form({ post_url: "  " }));
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/URL/);
  });

  it.each([
    "https://example.com/p/abc",
    "ftp://www.instagram.com/p/abc",
    "https://instagram.com/user/abc",
    "not a url",
  ])("rejects non-Instagram URL: %s", async (url) => {
    const result = await addInstagramPost(null, form({ post_url: url }));
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Instagram投稿URL/);
  });

  it.each([
    "https://www.instagram.com/p/abc123/",
    "https://instagram.com/reel/xyz_456",
    "http://www.instagram.com/tv/CdEf-Gh",
  ])("accepts well-formed Instagram URL: %s", async (url) => {
    holder.current!.enqueue("instagram_posts", {
      data: { display_order: 4 },
      error: null,
    });
    const result = await addInstagramPost(null, form({ post_url: url, caption: "" }));
    expect(result.success).toBe(true);
    expect(holder.current!.spies.mutations).toContainEqual(
      expect.objectContaining({ table: "instagram_posts", op: "insert" }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith("/photos/instagram");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/gallery");
  });

  it("uses display_order = max + 1 (handles initial empty state)", async () => {
    holder.current!.enqueue("instagram_posts", { data: null, error: null });
    await addInstagramPost(
      null,
      form({ post_url: "https://www.instagram.com/p/abc/", caption: "x" }),
    );
    expect(holder.current!.spies.mutations).toContainEqual(
      expect.objectContaining({
        table: "instagram_posts",
        op: "insert",
        payload: expect.objectContaining({
          display_order: 0,
          caption: "x",
          created_by: "u-admin",
        }),
      }),
    );
  });

  // Phase 2-A: regex anchored with `\/?$` so trailing junk is rejected.
  it.each([
    "https://www.instagram.com/p/abc123/<script>",
    "https://instagram.com/p/abc123/?utm=foo",
    "https://www.instagram.com/p/abc123/extra",
    "https://instagram.com/p/abc123/#",
  ])("rejects URLs with trailing junk after the post id: %s", async (url) => {
    const result = await addInstagramPost(null, form({ post_url: url }));
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/Instagram投稿URL/);
  });
});

describe("deleteInstagramPost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
    mockGetUser.mockResolvedValue({ id: "u-admin", role: "admin" });
  });

  it("rejects non-staff users", async () => {
    mockGetUser.mockResolvedValue({ id: "u-parent", role: "parent" });
    const result = await deleteInstagramPost("post-1");
    expect(result.success).toBe(false);
    expect(holder.current!.spies.mutations.filter((m) => m.op === "delete")).toHaveLength(0);
  });

  it("deletes when staff", async () => {
    const result = await deleteInstagramPost("post-1");
    expect(result.success).toBe(true);
    expect(holder.current!.spies.mutations).toContainEqual(
      expect.objectContaining({ table: "instagram_posts", op: "delete" }),
    );
  });
});

describe("toggleInstagramPostVisibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
    mockGetUser.mockResolvedValue({ id: "u-admin", role: "admin" });
  });

  it("rejects non-staff users", async () => {
    mockGetUser.mockResolvedValue({ id: "u-parent", role: "parent" });
    const result = await toggleInstagramPostVisibility("post-1", true);
    expect(result.success).toBe(false);
    expect(holder.current!.spies.mutations.filter((m) => m.op === "update")).toHaveLength(0);
  });

  it("flips visibility when staff", async () => {
    const result = await toggleInstagramPostVisibility("post-1", true);
    expect(result.success).toBe(true);
    expect(holder.current!.spies.mutations).toContainEqual(
      expect.objectContaining({ table: "instagram_posts", op: "update" }),
    );
  });
});
