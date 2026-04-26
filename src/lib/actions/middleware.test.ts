import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetUser = vi.fn();
vi.mock("@/lib/auth/get-user", () => ({
  getUser: () => mockGetUser(),
}));

// Factory-built supabase mock: not actively used by withAuth-wrapped
// tests, but a real client is what production code receives in `ctx`,
// so the type compatibility check (`createClient: () => Promise<...>`)
// stays accurate.
const supabaseClientCreated = vi.hoisted(() => ({ count: 0 }));

vi.mock("@/lib/supabase/server", async () => {
  const { createSupabaseMock } = await import("@/test/supabase-mock-factory");
  return {
    createClient: () => {
      supabaseClientCreated.count += 1;
      const { client } = createSupabaseMock();
      return Promise.resolve(client);
    },
  };
});

import { withAuth } from "./middleware";

beforeEach(() => {
  vi.clearAllMocks();
  supabaseClientCreated.count = 0;
});

describe("withAuth", () => {
  it("rejects with UNAUTHORIZED when the user's role doesn't match a single-role guard", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
    const handler = vi.fn();
    const wrapped = withAuth("admin", handler);

    const result = await wrapped();
    expect(result).toEqual({ success: false, message: expect.stringContaining("権限") });
    expect(handler).not.toHaveBeenCalled();
  });

  it("admits a user matching a single-role guard", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const handler = vi.fn().mockResolvedValue({ success: true, message: "ok" });
    const wrapped = withAuth("admin", handler);

    const result = await wrapped();
    expect(result).toEqual({ success: true, message: "ok" });
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        user: { id: "u1", role: "admin" },
        supabase: expect.any(Object),
      }),
    );
  });

  it("admits any role in an allow-list guard", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "teacher" });
    const handler = vi.fn().mockResolvedValue("done");
    const wrapped = withAuth(["admin", "teacher"], handler);

    expect(await wrapped()).toBe("done");
  });

  it("rejects when none of the allow-listed roles match", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
    const handler = vi.fn();
    const wrapped = withAuth(["admin", "teacher"], handler);

    const result = await wrapped();
    expect(result).toEqual({ success: false, message: expect.stringContaining("権限") });
    expect(handler).not.toHaveBeenCalled();
  });

  it("supports an arbitrary predicate guard (admin or resource owner)", async () => {
    mockGetUser.mockResolvedValue({ id: "owner-1", role: "teacher" });
    const ownerOrAdmin = (u: { id: string; role: string }) =>
      u.role === "admin" || u.id === "owner-1";
    const handler = vi.fn().mockResolvedValue("ok");
    const wrapped = withAuth(ownerOrAdmin, handler);

    expect(await wrapped()).toBe("ok");
  });

  it("passes through additional arguments to the handler", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const handler = vi.fn().mockResolvedValue("ok");
    const wrapped = withAuth("admin", handler);

    await wrapped("first", 42);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ user: { id: "u1", role: "admin" } }),
      "first",
      42,
    );
  });

  it("does not create a Supabase client when authorization fails (saves a fetch)", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
    const wrapped = withAuth("admin", vi.fn());

    await wrapped();
    expect(supabaseClientCreated.count).toBe(0);
  });
});
