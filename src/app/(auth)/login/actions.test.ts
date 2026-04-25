import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSignInWithPassword = vi.fn();
const mockSingle = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () => mockSingle(),
          }),
        }),
      }),
    }),
  ),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

import { login } from "./actions";

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /login with invalid_credentials when sign-in fails", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: null,
      error: { message: "Invalid login credentials" },
    });

    await expect(login(form({ email: "x@y.z", password: "bad" }))).rejects.toThrow(
      /NEXT_REDIRECT:\/login\?error=invalid_credentials/,
    );
    expect(mockSingle).not.toHaveBeenCalled();
  });

  it("redirects parents to /announcements after successful sign-in", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "u-parent" } },
      error: null,
    });
    mockSingle.mockResolvedValue({ data: { role: "parent" }, error: null });

    await expect(login(form({ email: "p@example.com", password: "pw12345678" }))).rejects.toThrow(
      /NEXT_REDIRECT:\/announcements/,
    );
  });

  it("redirects staff roles to /attendance/dashboard", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "u-admin" } },
      error: null,
    });
    mockSingle.mockResolvedValue({ data: { role: "admin" }, error: null });

    await expect(login(form({ email: "a@example.com", password: "pw12345678" }))).rejects.toThrow(
      /NEXT_REDIRECT:\/attendance\/dashboard/,
    );
  });

  it("falls back to /announcements when profile is missing (no role escalation)", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "u-orphan" } },
      error: null,
    });
    mockSingle.mockResolvedValue({ data: null, error: null });

    await expect(login(form({ email: "o@example.com", password: "pw12345678" }))).rejects.toThrow(
      /NEXT_REDIRECT:\/announcements/,
    );
  });
});
