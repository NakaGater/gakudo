import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase
const { mockInsert, mockFrom } = vi.hoisted(() => {
  const mockInsert = vi.fn().mockResolvedValue({ error: null });
  const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
  return { mockInsert, mockFrom };
});

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn().mockReturnValue({ from: mockFrom }),
}));

// Mock email (dynamic import in the action)
vi.mock("@/lib/email/send", () => ({
  sendEmail: vi.fn().mockResolvedValue({ id: "test" }),
}));

// next/headers — return a Headers-like object the action can read.
vi.mock("next/headers", () => ({
  headers: () =>
    Promise.resolve({
      get: (key: string) => (key.toLowerCase() === "x-forwarded-for" ? "1.2.3.4" : null),
    }),
}));

// Rate limiter — default to allow; individual tests override per-case.
const { mockCheckRateLimit } = vi.hoisted(() => ({
  mockCheckRateLimit: vi.fn().mockResolvedValue({ ok: true }),
}));
vi.mock("@/lib/ratelimit/check", () => ({
  checkRateLimit: (...a: unknown[]) => mockCheckRateLimit(...a),
}));

import { submitInquiry } from "./actions";

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    fd.set(k, v);
  }
  return fd;
}

describe("submitInquiry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({ insert: mockInsert });
    mockInsert.mockResolvedValue({ error: null });
  });

  it("requires type field", async () => {
    const result = await submitInquiry(
      null,
      makeFormData({ name: "太郎", email: "a@b.c", message: "test" }),
    );
    expect(result?.success).toBe(false);
    expect(result?.message).toContain("種別");
  });

  it("requires name field", async () => {
    const result = await submitInquiry(
      null,
      makeFormData({ type: "visit", email: "a@b.c", message: "test" }),
    );
    expect(result?.success).toBe(false);
    expect(result?.message).toContain("お名前");
  });

  it("requires valid email", async () => {
    const result = await submitInquiry(
      null,
      makeFormData({ type: "visit", name: "太郎", email: "invalid", message: "test" }),
    );
    expect(result?.success).toBe(false);
    expect(result?.message).toContain("メールアドレス");
  });

  it("requires message field", async () => {
    const result = await submitInquiry(
      null,
      makeFormData({ type: "visit", name: "太郎", email: "a@b.c" }),
    );
    expect(result?.success).toBe(false);
    expect(result?.message).toContain("メッセージ");
  });

  it("requires preferred_date for visit type", async () => {
    const result = await submitInquiry(
      null,
      makeFormData({
        type: "visit",
        name: "太郎",
        email: "a@b.c",
        message: "見学希望",
      }),
    );
    expect(result?.success).toBe(false);
    expect(result?.message).toContain("希望日時");
  });

  it("does not require preferred_date for general type", async () => {
    const result = await submitInquiry(
      null,
      makeFormData({
        type: "general",
        name: "太郎",
        email: "a@b.c",
        message: "質問です",
      }),
    );
    expect(result?.success).toBe(true);
  });

  it("succeeds with valid visit data", async () => {
    const result = await submitInquiry(
      null,
      makeFormData({
        type: "visit",
        name: "太郎",
        email: "a@b.c",
        message: "見学希望",
        preferred_date: "12月15日",
      }),
    );
    expect(result?.success).toBe(true);
    expect(result?.message).toContain("受け付けました");
    expect(mockFrom).toHaveBeenCalledWith("inquiries");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "visit",
        name: "太郎",
        email: "a@b.c",
        preferred_date: "12月15日",
      }),
    );
  });

  it("returns error when DB insert fails", async () => {
    mockInsert.mockResolvedValue({ error: { message: "DB error" } });
    const result = await submitInquiry(
      null,
      makeFormData({
        type: "general",
        name: "太郎",
        email: "a@b.c",
        message: "質問",
      }),
    );
    expect(result?.success).toBe(false);
    expect(result?.message).toContain("失敗");
  });

  it("rejects invalid type values", async () => {
    const result = await submitInquiry(
      null,
      makeFormData({
        type: "invalid",
        name: "太郎",
        email: "a@b.c",
        message: "test",
      }),
    );
    expect(result?.success).toBe(false);
    expect(result?.message).toContain("種別");
  });

  it("uses (ip, email) as the rate limit key", async () => {
    await submitInquiry(
      null,
      makeFormData({
        type: "general",
        name: "太郎",
        email: "user@example.com",
        message: "ok",
      }),
    );
    expect(mockCheckRateLimit).toHaveBeenCalledWith(
      "inquiry|1.2.3.4|user@example.com",
      expect.any(Number),
      expect.any(Number),
    );
  });

  it("returns a friendly retry message when rate limit is exceeded", async () => {
    mockCheckRateLimit.mockResolvedValueOnce({
      ok: false,
      retryAfterSeconds: 1234,
      limit: 10,
      windowMs: 3_600_000,
    });
    const result = await submitInquiry(
      null,
      makeFormData({
        type: "general",
        name: "太郎",
        email: "spammer@example.com",
        message: "ok",
      }),
    );
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/上限|もう一度/);
    // Important: when denied, do NOT touch the database.
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
