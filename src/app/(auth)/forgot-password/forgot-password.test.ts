import { describe, it, expect, vi, beforeEach } from "vitest";
import { forgotPassword } from "./actions";

// Mock next/cache
const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

// Mock next/navigation
const mockRedirect = vi.fn().mockImplementation((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

// Mock Supabase client
const mockResetPasswordForEmail = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  })),
}));

describe("forgotPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when email is empty", async () => {
    const formData = new FormData();

    const result = await forgotPassword(null, formData);

    expect(result).toEqual({ success: false, message: "メールアドレスを入力してください" });
  });

  it("returns error when Supabase resetPasswordForEmail fails", async () => {
    mockResetPasswordForEmail.mockResolvedValueOnce({
      data: null,
      error: { message: "Email not found" },
    });

    const formData = new FormData();
    formData.append("email", "nonexistent@example.com");

    const result = await forgotPassword(null, formData);

    expect(result).toEqual({
      success: false,
      message: "リセットメールの送信に失敗しました。もう一度お試しください。",
    });
  });

  it("returns success on successful reset email", async () => {
    mockResetPasswordForEmail.mockResolvedValueOnce({
      data: { message: "Email sent" },
      error: null,
    });

    const formData = new FormData();
    formData.append("email", "user@example.com");

    const result = await forgotPassword(null, formData);

    expect(result).toEqual({ success: true, message: "リセットメールを送信しました" });
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      "user@example.com",
      expect.objectContaining({
        redirectTo: expect.stringContaining("/auth/callback"),
      }),
    );
  });
});
