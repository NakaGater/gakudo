import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock } from "@/test/supabase-mock-factory";

const mockUpdateUser = vi.fn();

const holder = vi.hoisted(() => ({
  current: null as ReturnType<typeof createSupabaseMock> | null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      ...holder.current!.client,
      auth: {
        ...holder.current!.client.auth,
        updateUser: (...args: unknown[]) => mockUpdateUser(...args),
      },
    }),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

import { resetPassword } from "./actions";

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("resetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
  });

  it("rejects passwords shorter than 8 characters", async () => {
    const result = await resetPassword(null, form({ password: "short", confirmPassword: "short" }));
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/8文字/);
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("rejects when password and confirmPassword differ", async () => {
    const result = await resetPassword(
      null,
      form({ password: "pw12345678", confirmPassword: "pw_different" }),
    );
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/一致/);
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("returns generic error when Supabase update fails", async () => {
    mockUpdateUser.mockResolvedValue({ error: { message: "internal token detail" } });

    const result = await resetPassword(
      null,
      form({ password: "pw12345678", confirmPassword: "pw12345678" }),
    );

    expect(result.success).toBe(false);
    expect(result.message).not.toContain("token detail");
  });

  it("redirects to /login with success message on update success", async () => {
    mockUpdateUser.mockResolvedValue({ error: null });

    await expect(
      resetPassword(null, form({ password: "pw12345678", confirmPassword: "pw12345678" })),
    ).rejects.toThrow(/NEXT_REDIRECT:\/login\?message=password_reset_success/);
    expect(mockUpdateUser).toHaveBeenCalledWith({ password: "pw12345678" });
  });
});
