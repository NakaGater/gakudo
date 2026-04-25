import { describe, it, expect, vi, beforeEach } from "vitest";
import { login } from "./actions";

// I/O 境界のみモック: next/cache, next/navigation, Supabase client.
// ロール → リダイレクト先のマッピングは actions.helpers.test.ts で純粋にカバー済み。
const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

const mockRedirect = vi.fn().mockImplementation((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

const mockSignInWithPassword = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { signInWithPassword: mockSignInWithPassword },
    from: mockFrom,
  })),
}));

describe("login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /login?error=invalid_credentials on auth error", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: null,
      error: { message: "Invalid credentials" },
    });

    const formData = new FormData();
    formData.append("email", "user@example.com");
    formData.append("password", "wrongpassword");

    await expect(login(formData)).rejects.toThrow("NEXT_REDIRECT:/login?error=invalid_credentials");
    expect(mockRedirect).toHaveBeenCalledWith("/login?error=invalid_credentials");
  });

  it("redirects authenticated user to the path returned by getRedirectPathForRole", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: "u1" } },
      error: null,
    });

    // role=admin → /attendance/dashboard (per pure helper test)
    const single = vi.fn().mockResolvedValue({ data: { role: "admin" }, error: null });
    const eq = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq });
    mockFrom.mockReturnValue({ select });

    const formData = new FormData();
    formData.append("email", "admin@example.com");
    formData.append("password", "password123");

    await expect(login(formData)).rejects.toThrow("NEXT_REDIRECT:/attendance/dashboard");
    expect(mockRedirect).toHaveBeenCalledWith("/attendance/dashboard");
  });

  it("redirects users without a profile row to /announcements (default branch)", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: "u2" } },
      error: null,
    });

    const single = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq });
    mockFrom.mockReturnValue({ select });

    const formData = new FormData();
    formData.append("email", "parent@example.com");
    formData.append("password", "password123");

    await expect(login(formData)).rejects.toThrow("NEXT_REDIRECT:/announcements");
    expect(mockRedirect).toHaveBeenCalledWith("/announcements");
  });
});
