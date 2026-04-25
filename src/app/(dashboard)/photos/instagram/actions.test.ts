import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockSelectMaxOrder = vi.fn();
const mockInsert = vi.fn();
const mockDeleteEq = vi.fn();
const mockUpdateEq = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("@/lib/auth/get-user", () => ({
  getUser: () => mockGetUser(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: (table: string) => {
        if (table !== "instagram_posts") throw new Error(`unexpected table ${table}`);
        return {
          select: () => ({
            order: () => ({
              limit: () => ({
                single: () => mockSelectMaxOrder(),
              }),
            }),
          }),
          insert: (...args: unknown[]) => mockInsert(...args),
          delete: () => ({
            eq: (...e: unknown[]) => mockDeleteEq(...e),
          }),
          update: () => ({
            eq: (...e: unknown[]) => mockUpdateEq(...e),
          }),
        };
      },
    }),
  ),
}));

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
    mockGetUser.mockResolvedValue({ id: "u-admin", role: "admin" });
  });

  it("rejects non-staff users", async () => {
    mockGetUser.mockResolvedValue({ id: "u-parent", role: "parent" });
    const result = await addInstagramPost(
      null,
      form({ post_url: "https://www.instagram.com/p/abc123/" }),
    );
    expect(result.success).toBe(false);
    expect(mockInsert).not.toHaveBeenCalled();
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
    mockSelectMaxOrder.mockResolvedValue({ data: { display_order: 4 }, error: null });
    mockInsert.mockResolvedValue({ error: null });
    const result = await addInstagramPost(null, form({ post_url: url, caption: "" }));
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/photos/instagram");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/gallery");
  });

  it("uses display_order = max + 1 (handles initial empty state)", async () => {
    mockSelectMaxOrder.mockResolvedValue({ data: null, error: null });
    mockInsert.mockResolvedValue({ error: null });
    await addInstagramPost(
      null,
      form({ post_url: "https://www.instagram.com/p/abc/", caption: "x" }),
    );
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ display_order: 0, caption: "x", created_by: "u-admin" }),
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
    mockGetUser.mockResolvedValue({ id: "u-admin", role: "admin" });
  });

  it("rejects non-staff users", async () => {
    mockGetUser.mockResolvedValue({ id: "u-parent", role: "parent" });
    const result = await deleteInstagramPost("post-1");
    expect(result.success).toBe(false);
    expect(mockDeleteEq).not.toHaveBeenCalled();
  });

  it("deletes when staff", async () => {
    mockDeleteEq.mockResolvedValue({ error: null });
    const result = await deleteInstagramPost("post-1");
    expect(result.success).toBe(true);
    expect(mockDeleteEq).toHaveBeenCalledWith("id", "post-1");
  });
});

describe("toggleInstagramPostVisibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ id: "u-admin", role: "admin" });
  });

  it("rejects non-staff users", async () => {
    mockGetUser.mockResolvedValue({ id: "u-parent", role: "parent" });
    const result = await toggleInstagramPostVisibility("post-1", true);
    expect(result.success).toBe(false);
    expect(mockUpdateEq).not.toHaveBeenCalled();
  });

  it("flips visibility when staff", async () => {
    mockUpdateEq.mockResolvedValue({ error: null });
    const result = await toggleInstagramPostVisibility("post-1", true);
    expect(result.success).toBe(true);
    expect(mockUpdateEq).toHaveBeenCalledWith("id", "post-1");
  });
});
