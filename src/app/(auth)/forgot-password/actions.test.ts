import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock } from "@/test/supabase-mock-factory";

const mockResetPasswordForEmail = vi.fn();

const holder = vi.hoisted(() => ({
  current: null as ReturnType<typeof createSupabaseMock> | null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      ...holder.current!.client,
      auth: {
        ...holder.current!.client.auth,
        resetPasswordForEmail: (...args: unknown[]) => mockResetPasswordForEmail(...args),
      },
    }),
}));

import { forgotPassword } from "./actions";

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("forgotPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example.com");
  });

  it("returns error when email is empty", async () => {
    const result = await forgotPassword(null, form({ email: "" }));
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/メールアドレス/);
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("returns success and uses NEXT_PUBLIC_APP_URL for redirectTo", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    const result = await forgotPassword(null, form({ email: "user@example.com" }));

    expect(result.success).toBe(true);
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith("user@example.com", {
      redirectTo: "https://app.example.com/auth/callback",
    });
  });

  it("returns generic error when Supabase fails (no message leakage)", async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: "PII-leak: user not found in db schema xyz" },
    });

    const result = await forgotPassword(null, form({ email: "user@example.com" }));

    expect(result.success).toBe(false);
    expect(result.message).not.toContain("PII-leak");
    expect(result.message).not.toContain("schema");
  });
});
