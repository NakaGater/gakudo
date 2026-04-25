import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockInsert = vi.fn();
const mockSelectFinal = vi.fn();
const mockRpc = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      insert: (...a: unknown[]) => mockInsert(...a),
      select: () => ({
        eq: () => ({
          gte: () => ({
            order: () => ({
              limit: () => mockSelectFinal(),
            }),
          }),
        }),
      }),
    }),
    rpc: (...a: unknown[]) => mockRpc(...a),
  }),
}));

import { checkRateLimit } from "./check";

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-04-25T10:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("checkRateLimit", () => {
  it("allows the first hit", async () => {
    mockInsert.mockResolvedValue({ error: null });
    mockSelectFinal.mockResolvedValue({
      data: [{ hit_at: new Date().toISOString() }],
      error: null,
    });

    const result = await checkRateLimit("user@example.com", 3, 60_000);
    expect(result).toEqual({ ok: true });
    expect(mockInsert).toHaveBeenCalledWith({ key: "user@example.com" });
  });

  it("allows up to `max` hits inside the window", async () => {
    mockInsert.mockResolvedValue({ error: null });
    const now = Date.now();
    mockSelectFinal.mockResolvedValue({
      data: [
        { hit_at: new Date(now - 30_000).toISOString() },
        { hit_at: new Date(now - 20_000).toISOString() },
        { hit_at: new Date(now).toISOString() },
      ],
      error: null,
    });

    const result = await checkRateLimit("user@example.com", 3, 60_000);
    expect(result).toEqual({ ok: true });
  });

  it("denies the (max+1)th hit and reports retryAfter based on oldest in window", async () => {
    mockInsert.mockResolvedValue({ error: null });
    const now = Date.now();
    const oldestMsAgo = 30_000;
    mockSelectFinal.mockResolvedValue({
      data: [
        { hit_at: new Date(now - oldestMsAgo).toISOString() },
        { hit_at: new Date(now - 20_000).toISOString() },
        { hit_at: new Date(now - 10_000).toISOString() },
        { hit_at: new Date(now).toISOString() },
      ],
      error: null,
    });

    const result = await checkRateLimit("user@example.com", 3, 60_000);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      // 60s window, oldest hit was 30s ago → caller can retry in ~30s.
      expect(result.retryAfterSeconds).toBe(30);
      expect(result.limit).toBe(3);
      expect(result.windowMs).toBe(60_000);
    }
  });

  it("fails open on insert error (availability over correctness)", async () => {
    mockInsert.mockResolvedValue({ error: { message: "table missing" } });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await checkRateLimit("user@example.com", 3, 60_000);
    expect(result).toEqual({ ok: true });
    expect(mockSelectFinal).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("fails open on count error", async () => {
    mockInsert.mockResolvedValue({ error: null });
    mockSelectFinal.mockResolvedValue({ data: null, error: { message: "boom" } });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await checkRateLimit("user@example.com", 3, 60_000);
    expect(result).toEqual({ ok: true });
    errSpy.mockRestore();
  });

  it("treats different keys independently", async () => {
    mockInsert.mockResolvedValue({ error: null });
    const now = Date.now();
    mockSelectFinal.mockResolvedValue({
      data: [{ hit_at: new Date(now).toISOString() }],
      error: null,
    });

    const a = await checkRateLimit("ip:1.2.3.4|email:a@x.y", 1, 60_000);
    const b = await checkRateLimit("ip:1.2.3.4|email:b@x.y", 1, 60_000);
    expect(a).toEqual({ ok: true });
    expect(b).toEqual({ ok: true });
  });
});
