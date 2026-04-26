import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock } from "@/test/supabase-mock-factory";
import { addInstagramPost, deleteInstagramPost, toggleInstagramPostVisibility } from "./actions";

const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

const mockGetUser = vi.fn();
vi.mock("@/lib/auth/get-user", () => ({
  getUser: () => mockGetUser(),
}));

vi.mock("@/lib/auth/roles", () => ({
  isStaff: (role: string) => role === "staff" || role === "admin",
}));

vi.mock("@/config/constants", () => ({
  ERROR_MESSAGES: {
    UNAUTHORIZED: "権限がありません",
  },
}));

const holder = vi.hoisted(() => ({
  current: null as ReturnType<typeof createSupabaseMock> | null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(holder.current!.client),
}));

const enqueue = (table: string, resolved: { data?: unknown; error?: unknown }) =>
  holder.current!.enqueue(table, {
    data: resolved.data ?? null,
    error: resolved.error ?? null,
  });

describe("instagram actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
  });

  describe("addInstagramPost", () => {
    it("rejects non-staff", async () => {
      mockGetUser.mockResolvedValue({ role: "parent" });

      const fd = new FormData();
      fd.append("post_url", "https://www.instagram.com/p/ABC123/");

      const result = await addInstagramPost(null, fd);
      expect(result.success).toBe(false);
    });

    it("returns error for empty URL", async () => {
      mockGetUser.mockResolvedValue({ role: "teacher" });

      const fd = new FormData();
      fd.append("post_url", "");

      const result = await addInstagramPost(null, fd);
      expect(result.success).toBe(false);
    });

    it("returns error for invalid URL (not Instagram)", async () => {
      mockGetUser.mockResolvedValue({ role: "teacher" });

      const fd = new FormData();
      fd.append("post_url", "https://www.twitter.com/some/post");

      const result = await addInstagramPost(null, fd);
      expect(result.success).toBe(false);
    });

    it("returns error on DB failure", async () => {
      mockGetUser.mockResolvedValue({ id: "user1", role: "teacher" });
      enqueue("instagram_posts", { data: [{ display_order: 0 }] });
      enqueue("instagram_posts", { error: { message: "DB error" } });

      const fd = new FormData();
      fd.append("post_url", "https://www.instagram.com/p/ABC123/");

      const result = await addInstagramPost(null, fd);
      expect(result.success).toBe(false);
    });

    it("succeeds with valid Instagram post URL", async () => {
      mockGetUser.mockResolvedValue({ id: "user1", role: "teacher" });
      enqueue("instagram_posts", { data: [{ display_order: 5 }] });
      enqueue("instagram_posts", {
        data: { id: "post1", post_url: "https://www.instagram.com/p/ABC123/" },
      });

      const fd = new FormData();
      fd.append("post_url", "https://www.instagram.com/p/ABC123/");

      const result = await addInstagramPost(null, fd);
      expect(result.success).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalled();
    });

    it("succeeds with reel URL", async () => {
      mockGetUser.mockResolvedValue({ id: "user1", role: "teacher" });
      enqueue("instagram_posts", { data: [{ display_order: 3 }] });
      enqueue("instagram_posts", {
        data: { id: "post1", post_url: "https://www.instagram.com/reel/ABC123/" },
      });

      const fd = new FormData();
      fd.append("post_url", "https://www.instagram.com/reel/ABC123/");

      const result = await addInstagramPost(null, fd);
      expect(result.success).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalled();
    });
  });

  describe("deleteInstagramPost", () => {
    it("rejects non-staff", async () => {
      mockGetUser.mockResolvedValue({ role: "parent" });

      const result = await deleteInstagramPost("post1");
      expect(result.success).toBe(false);
    });

    it("returns error on DB failure", async () => {
      mockGetUser.mockResolvedValue({ role: "teacher" });
      enqueue("instagram_posts", { error: { message: "DB error" } });

      const result = await deleteInstagramPost("post1");
      expect(result.success).toBe(false);
    });

    it("succeeds", async () => {
      mockGetUser.mockResolvedValue({ role: "teacher" });
      enqueue("instagram_posts", { data: null });

      const result = await deleteInstagramPost("post1");
      expect(result.success).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalled();
    });
  });

  describe("toggleInstagramPostVisibility", () => {
    it("rejects non-staff", async () => {
      mockGetUser.mockResolvedValue({ role: "parent" });

      const result = await toggleInstagramPostVisibility("post1", true);
      expect(result.success).toBe(false);
    });

    it("returns error on DB failure", async () => {
      mockGetUser.mockResolvedValue({ role: "teacher" });
      enqueue("instagram_posts", { error: { message: "DB error" } });

      const result = await toggleInstagramPostVisibility("post1", true);
      expect(result.success).toBe(false);
    });

    it("succeeds", async () => {
      mockGetUser.mockResolvedValue({ role: "teacher" });
      enqueue("instagram_posts", {
        data: { id: "post1", is_visible: false },
      });

      const result = await toggleInstagramPostVisibility("post1", true);
      expect(result.success).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalled();
    });
  });
});
