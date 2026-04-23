import { describe, it, expect, vi, beforeEach } from "vitest";
import { resetPassword } from "./actions";

// Mock next/cache
const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

// Mock next/navigation with redirect that throws
const mockRedirect = vi.fn().mockImplementation((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

// Mock Supabase client
const mockUpdateUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      updateUser: mockUpdateUser,
    },
  })),
}));

describe("resetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error for empty password", async () => {
    const formData = new FormData();
    formData.append("password", "");
    formData.append("confirmPassword", "");

    const result = await resetPassword(null, formData);

    expect(result).toEqual({
      success: false,
      message: "パスワードは8文字以上で入力してください",
    });
  });

  it("returns error for short password (< 8 chars)", async () => {
    const formData = new FormData();
    formData.append("password", "short");
    formData.append("confirmPassword", "short");

    const result = await resetPassword(null, formData);

    expect(result).toEqual({
      success: false,
      message: "パスワードは8文字以上で入力してください",
    });
  });

  it("returns error when passwords don't match", async () => {
    const formData = new FormData();
    formData.append("password", "validpassword123");
    formData.append("confirmPassword", "differentpassword123");

    const result = await resetPassword(null, formData);

    expect(result).toEqual({ success: false, message: "パスワードが一致しません" });
  });

  it("returns error when updateUser fails", async () => {
    mockUpdateUser.mockResolvedValueOnce({
      data: null,
      error: { message: "Update failed" },
    });

    const formData = new FormData();
    formData.append("password", "validpassword123");
    formData.append("confirmPassword", "validpassword123");

    const result = await resetPassword(null, formData);

    expect(result).toEqual({
      success: false,
      message: "パスワードの更新に失敗しました。もう一度お試しください。",
    });
  });

  it("redirects on success", async () => {
    mockUpdateUser.mockResolvedValueOnce({
      data: { user: { id: "u1" } },
      error: null,
    });

    const formData = new FormData();
    formData.append("password", "validpassword123");
    formData.append("confirmPassword", "validpassword123");

    try {
      await resetPassword(null, formData);
    } catch {
      // Expected to throw due to redirect
    }

    expect(mockRedirect).toHaveBeenCalledWith(
      "/login?message=password_reset_success",
    );
  });
});
