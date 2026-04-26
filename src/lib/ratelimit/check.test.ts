import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock, type Op } from "@/test/supabase-mock-factory";

// Hoisted single supabase mock per test. Tests configure
// `insertResult` and `selectHits` on the controller to drive each
// call independently.
const controller = vi.hoisted(() => ({
  insertResult: { data: null, error: null } as { data: unknown; error: unknown },
  selectHits: [] as Array<{ hit_at: string }>,
  selectError: null as unknown,
}));

vi.mock("@/lib/supabase/admin", async () => {
  const { createSupabaseMock: factory } = await import("@/test/supabase-mock-factory");
  const { client } = factory({
    tableResolver: (table: string, op: Op) => {
      if (table !== "rate_limit_log") return undefined;
      if (op === "insert") return controller.insertResult;
      return { data: controller.selectHits, error: controller.selectError };
    },
  });
  return { createAdminClient: () => client };
});

import { checkRateLimit } from "./check";

beforeEach(() => {
  vi.clearAllMocks();
  controller.insertResult = { data: null, error: null };
  controller.selectHits = [];
  controller.selectError = null;
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-04-25T10:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("checkRateLimit", () => {
  it("allows the first hit", async () => {
    controller.selectHits = [{ hit_at: new Date().toISOString() }];

    const result = await checkRateLimit("user@example.com", 3, 60_000);
    expect(result).toEqual({ ok: true });
  });

  it("allows up to `max` hits inside the window", async () => {
    const now = Date.now();
    controller.selectHits = [
      { hit_at: new Date(now - 30_000).toISOString() },
      { hit_at: new Date(now - 20_000).toISOString() },
      { hit_at: new Date(now).toISOString() },
    ];

    const result = await checkRateLimit("user@example.com", 3, 60_000);
    expect(result).toEqual({ ok: true });
  });

  it("denies the (max+1)th hit and reports retryAfter based on oldest in window", async () => {
    const now = Date.now();
    const oldestMsAgo = 30_000;
    controller.selectHits = [
      { hit_at: new Date(now - oldestMsAgo).toISOString() },
      { hit_at: new Date(now - 20_000).toISOString() },
      { hit_at: new Date(now - 10_000).toISOString() },
      { hit_at: new Date(now).toISOString() },
    ];

    const result = await checkRateLimit("user@example.com", 3, 60_000);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.retryAfterSeconds).toBe(30);
      expect(result.limit).toBe(3);
      expect(result.windowMs).toBe(60_000);
    }
  });

  it("fails open on insert error (availability over correctness)", async () => {
    controller.insertResult = { data: null, error: { message: "table missing" } };
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await checkRateLimit("user@example.com", 3, 60_000);
    expect(result).toEqual({ ok: true });
    errSpy.mockRestore();
  });

  it("fails open on count error", async () => {
    controller.selectError = { message: "boom" };
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await checkRateLimit("user@example.com", 3, 60_000);
    expect(result).toEqual({ ok: true });
    errSpy.mockRestore();
  });

  it("treats different keys independently", async () => {
    const now = Date.now();
    controller.selectHits = [{ hit_at: new Date(now).toISOString() }];

    const a = await checkRateLimit("ip:1.2.3.4|email:a@x.y", 1, 60_000);
    const b = await checkRateLimit("ip:1.2.3.4|email:b@x.y", 1, 60_000);
    expect(a).toEqual({ ok: true });
    expect(b).toEqual({ ok: true });
  });
});
