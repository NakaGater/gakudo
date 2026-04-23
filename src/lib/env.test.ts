/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateEnv } from "./env";

describe("validateEnv", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Set all required vars to valid values by default
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  });

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("throws when NEXT_PUBLIC_SUPABASE_URL is missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    expect(() => validateEnv()).toThrow("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("throws when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    expect(() => validateEnv()).toThrow("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  });

  it("throws when SUPABASE_SERVICE_ROLE_KEY is missing (server context)", () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(() => validateEnv()).toThrow("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("passes when all required vars are present", () => {
    expect(() => validateEnv()).not.toThrow();
  });

  it("warns when optional vars are missing but does not throw", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Ensure optional vars are not set
    delete process.env.RESEND_API_KEY;
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    delete process.env.NEXT_PUBLIC_APP_URL;

    expect(() => validateEnv()).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("RESEND_API_KEY"),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("NEXT_PUBLIC_VAPID_PUBLIC_KEY"),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("VAPID_PRIVATE_KEY"),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("NEXT_PUBLIC_APP_URL"),
    );
  });
});
