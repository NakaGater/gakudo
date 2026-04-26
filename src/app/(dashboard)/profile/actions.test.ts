import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockRevalidatePath = vi.fn();
const mockSignOut = vi.fn();
const mockRedirect = vi.fn<(url: string) => never>();

vi.mock("@/lib/auth/get-user", () => ({
  getUser: () => mockGetUser(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        signOut: (...args: unknown[]) => mockSignOut(...args),
      },
      from: () => ({
        update: (...args: unknown[]) => {
          mockUpdate(...args);
          return { eq: (...e: unknown[]) => mockEq(...e) };
        },
      }),
    }),
  ),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

vi.mock("next/navigation", () => ({
  redirect: (...args: Parameters<typeof mockRedirect>) => {
    mockRedirect(...args);
    throw new Error(`NEXT_REDIRECT:${args[0]}`);
  },
}));

import { logout, updateProfile } from "./actions";

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("updateProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ id: "u-1", role: "parent" });
  });

  it("rejects empty name", async () => {
    const result = await updateProfile(null, form({ name: "  " }));
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/名前/);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("rejects names longer than 50 characters", async () => {
    const result = await updateProfile(null, form({ name: "あ".repeat(51) }));
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/50/);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("updates the caller's own profile (uses session user id)", async () => {
    mockEq.mockResolvedValue({ error: null });
    const result = await updateProfile(null, form({ name: " 山田 " }));
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({ name: "山田" });
    expect(mockEq).toHaveBeenCalledWith("id", "u-1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/profile");
  });

  it("returns error when Supabase update fails", async () => {
    mockEq.mockResolvedValue({ error: { message: "internal db detail" } });
    const result = await updateProfile(null, form({ name: "山田" }));
    expect(result.success).toBe(false);
  });
});

describe("logout (Server Action)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignOut.mockResolvedValue({ error: null });
  });

  // Regression: client-side `supabase.auth.signOut() + window.location` is
  // unreliable because the browser client cannot reliably clear the
  // server-managed auth cookies. The Server Action runs on the request
  // that *sets* the cookies, so deletion is guaranteed before redirect.
  it("calls supabase.auth.signOut on the server", async () => {
    await expect(logout()).rejects.toThrow(/NEXT_REDIRECT/);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  // After logging out the user should land on the public homepage,
  // not the login screen. The middleware is now careful not to bounce
  // unauthenticated visitors at "/" anywhere — it only redirects
  // *authenticated* users from "/" into the dashboard.
  it("redirects to / (public homepage) after signing out", async () => {
    await expect(logout()).rejects.toThrow("NEXT_REDIRECT:/");
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("still redirects when signOut fails (best-effort logout)", async () => {
    // If signOut errors, we still want the user *off* the dashboard.
    // Staying on the page would imply they're still authenticated.
    mockSignOut.mockResolvedValue({ error: { message: "network" } });
    await expect(logout()).rejects.toThrow("NEXT_REDIRECT:/");
  });

  it("signs out before redirecting (order matters for cookie clearance)", async () => {
    const events: string[] = [];
    mockSignOut.mockImplementation(async () => {
      events.push("signOut");
      return { error: null };
    });
    mockRedirect.mockImplementation((url: string) => {
      events.push(`redirect:${url}`);
      throw new Error(`NEXT_REDIRECT:${url}`);
    });

    await expect(logout()).rejects.toThrow();
    expect(events).toEqual(["signOut", "redirect:/"]);
  });
});
