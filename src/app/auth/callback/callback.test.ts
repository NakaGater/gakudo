import { describe, it, expect, vi, beforeEach } from "vitest";

const mockExchangeCodeForSession = vi.fn();
const mockSetSession = vi.fn();
const mockGetUser = vi.fn().mockResolvedValue({ data: { user: {} }, error: null });

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        exchangeCodeForSession: (...args: unknown[]) => mockExchangeCodeForSession(...args),
        setSession: (...args: unknown[]) => mockSetSession(...args),
        getUser: () => mockGetUser(),
      },
    }),
  ),
}));

import { exchangeCodeForSession, setSessionFromTokens } from "./actions";

describe("exchangeCodeForSession", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns success when code exchange succeeds", async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
    const result = await exchangeCodeForSession("valid-code");
    expect(result).toEqual({ success: true, message: "" });
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("valid-code");
  });

  it("returns error when code exchange fails", async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: { message: "Invalid code" } });
    const result = await exchangeCodeForSession("bad-code");
    // Phase 2-B: raw token-exchange error is sanitized away.
    expect(result.success).toBe(false);
    expect(result.message).not.toContain("Invalid code");
  });
});

describe("setSessionFromTokens", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns success when session is set", async () => {
    mockSetSession.mockResolvedValue({ error: null });
    const result = await setSessionFromTokens("access-token", "refresh-token");
    expect(result).toEqual({ success: true, message: "" });
    expect(mockSetSession).toHaveBeenCalledWith({
      access_token: "access-token",
      refresh_token: "refresh-token",
    });
    expect(mockGetUser).toHaveBeenCalled();
  });

  it("returns error when setSession fails", async () => {
    mockSetSession.mockResolvedValue({ error: { message: "Invalid token" } });
    const result = await setSessionFromTokens("bad", "bad");
    // Phase 2-B: raw token error is sanitized away.
    expect(result.success).toBe(false);
    expect(result.message).not.toContain("Invalid token");
    expect(mockGetUser).not.toHaveBeenCalled();
  });
});
