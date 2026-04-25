import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockCapture = vi.fn();
vi.mock("@sentry/nextjs", () => ({
  captureException: (...a: unknown[]) => mockCapture(...a),
}));

import { sanitizeError } from "./sanitize";

const originalEnv = process.env.NODE_ENV;

afterEach(() => {
  vi.unstubAllEnvs();
  process.env.NODE_ENV = originalEnv;
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("sanitizeError", () => {
  it("returns the original message in development for fast feedback", () => {
    vi.stubEnv("NODE_ENV", "development");
    const result = sanitizeError(new Error("RAW_DEBUG_DETAIL"), "保存に失敗しました");
    expect(result).toBe("RAW_DEBUG_DETAIL");
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it("returns the fallback (and only the fallback) in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = sanitizeError(
      new Error("constraint 'profiles_email_key' violated"),
      "保存に失敗しました",
    );
    expect(result).toBe("保存に失敗しました");
    expect(result).not.toContain("constraint");
    expect(result).not.toContain("profiles_email_key");
    errSpy.mockRestore();
  });

  it("forwards Error objects to Sentry in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const err = new Error("boom");
    sanitizeError(err, "ng");
    expect(mockCapture).toHaveBeenCalledWith(err);
    errSpy.mockRestore();
  });

  it("forwards non-Error values too (string thrown by Postgres etc.)", () => {
    vi.stubEnv("NODE_ENV", "production");
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    sanitizeError({ message: "schema xyz missing" }, "ng");
    expect(mockCapture).toHaveBeenCalledWith({ message: "schema xyz missing" });
    errSpy.mockRestore();
  });

  it("ignores Sentry capture failures (defensive)", () => {
    vi.stubEnv("NODE_ENV", "production");
    mockCapture.mockImplementationOnce(() => {
      throw new Error("Sentry not initialised");
    });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => sanitizeError(new Error("x"), "ng")).not.toThrow();
    expect(sanitizeError(new Error("x"), "ng")).toBe("ng");
    errSpy.mockRestore();
  });

  it("treats test environment like production (sanitized output)", () => {
    vi.stubEnv("NODE_ENV", "test");
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(sanitizeError(new Error("internal"), "ng")).toBe("ng");
    errSpy.mockRestore();
  });
});
