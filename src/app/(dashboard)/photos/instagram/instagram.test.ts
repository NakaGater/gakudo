import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  addInstagramPost,
  deleteInstagramPost,
  toggleInstagramPostVisibility,
} from "./actions";

// Mock revalidatePath
const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

// Mock getUser
const mockGetUser = vi.fn();
vi.mock("@/lib/auth/get-user", () => ({
  getUser: () => mockGetUser(),
}));

// Mock isStaff
vi.mock("@/lib/auth/roles", () => ({
  isStaff: (role: string) => role === "staff" || role === "admin",
}));

// Mock constants
vi.mock("@/config/constants", () => ({
  ERROR_MESSAGES: {
    UNAUTHORIZED: "権限がありません",
  },
}));

// Mock supabase with queue-based pattern
const callQueues = new Map<string, Array<Record<string, unknown>>>();
function enqueue(table: string, result: Record<string, unknown>) {
  if (!callQueues.has(table)) callQueues.set(table, []);
  callQueues.get(table)!.push(result);
}
function dequeue(table: string): Record<string, unknown> {
  const q = callQueues.get(table);
  if (q && q.length > 0) return q.shift()!;
  return { data: null, error: null };
}

const createChain = (table: string): Record<string, unknown> => {
  const handler = (): Record<string, unknown> =>
    new Proxy({} as Record<string, unknown>, {
      get: (_target, prop) => {
        if (prop === "then") {
          return (resolve: (v: unknown) => void) => resolve(dequeue(table));
        }
        if (prop === "single") {
          return () => Promise.resolve(dequeue(table));
        }
        return (..._: unknown[]) => handler();
      },
    });
  return handler();
};
const mockFrom = vi.fn((table: string) => createChain(table));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: (...args: [string]) => mockFrom(...args),
    }),
  ),
}));

describe("instagram actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callQueues.clear();
  });

  describe("addInstagramPost", () => {
    it("rejects non-staff", async () => {
      mockGetUser.mockResolvedValue({ role: "parent" });

      const fd = new FormData();
      fd.append("post_url", "https://www.instagram.com/p/ABC123/");

      const result = await addInstagramPost(null as any, fd);
      expect(result.success).toBe(false);
    });

    it("returns error for empty URL", async () => {
      mockGetUser.mockResolvedValue({ role: "staff" });

      const fd = new FormData();
      fd.append("post_url", "");

      const result = await addInstagramPost(null as any, fd);
      expect(result.success).toBe(false);
    });

    it("returns error for invalid URL (not Instagram)", async () => {
      mockGetUser.mockResolvedValue({ role: "staff" });

      const fd = new FormData();
      fd.append("post_url", "https://www.twitter.com/some/post");

      const result = await addInstagramPost(null as any, fd);
      expect(result.success).toBe(false);
    });

    it("returns error on DB failure", async () => {
      mockGetUser.mockResolvedValue({ id: "user1", role: "staff" });
      enqueue("instagram_posts", { data: [{ display_order: 0 }] });
      enqueue("instagram_posts", { error: { message: "DB error" } });

      const fd = new FormData();
      fd.append("post_url", "https://www.instagram.com/p/ABC123/");

      const result = await addInstagramPost(null as any, fd);
      expect(result.success).toBe(false);
    });

    it("succeeds with valid Instagram post URL", async () => {
      mockGetUser.mockResolvedValue({ id: "user1", role: "staff" });
      enqueue("instagram_posts", { data: [{ display_order: 5 }] });
      enqueue("instagram_posts", {
        data: { id: "post1", post_url: "https://www.instagram.com/p/ABC123/" },
      });

      const fd = new FormData();
      fd.append("post_url", "https://www.instagram.com/p/ABC123/");

      const result = await addInstagramPost(null as any, fd);
      expect(result.success).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalled();
    });

    it("succeeds with reel URL", async () => {
      mockGetUser.mockResolvedValue({ id: "user1", role: "staff" });
      enqueue("instagram_posts", { data: [{ display_order: 3 }] });
      enqueue("instagram_posts", {
        data: { id: "post1", post_url: "https://www.instagram.com/reel/ABC123/" },
      });

      const fd = new FormData();
      fd.append("post_url", "https://www.instagram.com/reel/ABC123/");

      const result = await addInstagramPost(null as any, fd);
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
      mockGetUser.mockResolvedValue({ role: "staff" });
      enqueue("instagram_posts", { error: { message: "DB error" } });

      const result = await deleteInstagramPost("post1");
      expect(result.success).toBe(false);
    });

    it("succeeds", async () => {
      mockGetUser.mockResolvedValue({ role: "staff" });
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
      mockGetUser.mockResolvedValue({ role: "staff" });
      enqueue("instagram_posts", { error: { message: "DB error" } });

      const result = await toggleInstagramPostVisibility("post1", true);
      expect(result.success).toBe(false);
    });

    it("succeeds", async () => {
      mockGetUser.mockResolvedValue({ role: "staff" });
      enqueue("instagram_posts", {
        data: { id: "post1", is_visible: false },
      });

      const result = await toggleInstagramPostVisibility("post1", true);
      expect(result.success).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalled();
    });
  });
});
