import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock } from "@/test/supabase-mock-factory";

const mockSignInWithPassword = vi.fn();

const holder = vi.hoisted(() => ({
  current: null as ReturnType<typeof createSupabaseMock> | null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () =>
    Promise.resolve({
      ...holder.current!.client,
      auth: {
        ...holder.current!.client.auth,
        signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      },
    }),
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
    holder.current = createSupabaseMock();
  });

  it("redirects to /login with invalid_credentials when sign-in fails", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: null,
      error: { message: "Invalid login credentials" },
    });

    await expect(login(form({ email: "x@y.z", password: "bad" }))).rejects.toThrow(
      /NEXT_REDIRECT:\/login\?error=invalid_credentials/,
    );
    expect(holder.current!.spies.fromCalls).not.toContain("profiles");
  });

  it("redirects parents to /attendance/status after successful sign-in", async () => {
    // Parents land on the per-child attendance status page, not the
    // announcements list — that's the page they actually want first.
    // See actions.helpers.ts for the rationale.
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "u-parent" } },
      error: null,
    });
    holder.current = createSupabaseMock({
      tables: { profiles: { data: { role: "parent" }, error: null } },
    });

    await expect(login(form({ email: "p@example.com", password: "pw12345678" }))).rejects.toThrow(
      /NEXT_REDIRECT:\/attendance\/status/,
    );
  });

  it("redirects staff roles to /attendance/dashboard", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "u-admin" } },
      error: null,
    });
    holder.current = createSupabaseMock({
      tables: { profiles: { data: { role: "admin" }, error: null } },
    });

    await expect(login(form({ email: "a@example.com", password: "pw12345678" }))).rejects.toThrow(
      /NEXT_REDIRECT:\/attendance\/dashboard/,
    );
  });

  it("falls back to /announcements when profile is missing (no role escalation)", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "u-orphan" } },
      error: null,
    });
    holder.current = createSupabaseMock({
      tables: { profiles: { data: null, error: null } },
    });

    await expect(login(form({ email: "o@example.com", password: "pw12345678" }))).rejects.toThrow(
      /NEXT_REDIRECT:\/announcements/,
    );
  });
});
