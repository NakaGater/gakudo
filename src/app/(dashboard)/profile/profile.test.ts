import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateProfile } from "./actions";

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

describe("profile actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callQueues.clear();
  });

  describe("updateProfile", () => {
    it("returns error for empty name", async () => {
      mockGetUser.mockResolvedValue({ id: "user1" });

      const fd = new FormData();
      fd.append("name", "");

      const result = await updateProfile(null as any, fd);
      expect(result.success).toBe(false);
    });

    it("returns error for name > 50 chars", async () => {
      mockGetUser.mockResolvedValue({ id: "user1" });

      const longName = "a".repeat(51);
      const fd = new FormData();
      fd.append("name", longName);

      const result = await updateProfile(null as any, fd);
      expect(result.success).toBe(false);
    });

    it("returns error on DB failure", async () => {
      mockGetUser.mockResolvedValue({ id: "user1" });
      enqueue("profiles", { error: { message: "DB error" } });

      const fd = new FormData();
      fd.append("name", "Valid Name");

      const result = await updateProfile(null as any, fd);
      expect(result.success).toBe(false);
    });

    it("succeeds with valid name", async () => {
      mockGetUser.mockResolvedValue({ id: "user1" });
      enqueue("profiles", { data: { id: "user1", name: "Valid Name" } });

      const fd = new FormData();
      fd.append("name", "Valid Name");

      const result = await updateProfile(null as any, fd);
      expect(result.success).toBe(true);
      expect(mockRevalidatePath).toHaveBeenCalled();
    });
  });
});
