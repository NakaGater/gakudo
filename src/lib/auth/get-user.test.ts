import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRedirect = vi.fn<(url: string) => never>();
vi.mock("next/navigation", () => ({
  redirect: (...args: Parameters<typeof mockRedirect>) => {
    mockRedirect(...args);
    throw new Error(`NEXT_REDIRECT:${args[0]}`);
  },
}));

const controller = vi.hoisted(() => ({
  authUser: null as { id: string; email: string } | null,
  profile: null as { id: string; email: string; name: string; role: string } | null,
  profileError: null as unknown,
}));

vi.mock("@/lib/supabase/server", async () => {
  const { createSupabaseMock } = await import("@/test/supabase-mock-factory");
  return {
    createClient: () => {
      const { client } = createSupabaseMock({
        authUser: controller.authUser,
        tableResolver: (table: string) => {
          if (table !== "profiles") return undefined;
          return { data: controller.profile, error: controller.profileError };
        },
      });
      return Promise.resolve(client);
    },
  };
});

import { getUser } from "./get-user";

describe("getUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    controller.authUser = null;
    controller.profile = null;
    controller.profileError = null;
  });

  it("returns user profile when authenticated", async () => {
    controller.authUser = { id: "user-123", email: "test@example.com" };
    controller.profile = {
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      role: "parent",
    };

    const result = await getUser();

    expect(result).toEqual({
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      role: "parent",
    });
  });

  it("redirects to /login when not authenticated", async () => {
    await expect(getUser()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("redirects to /login when profile not found", async () => {
    controller.authUser = { id: "user-123", email: "test@example.com" };
    controller.profileError = { message: "Not found" };

    await expect(getUser()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });
});
