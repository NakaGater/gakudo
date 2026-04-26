import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock NextResponse
const mockHeaders = new Map<string, string>();
const mockNext = vi.fn().mockImplementation(() => ({
  cookies: { set: vi.fn() },
  headers: {
    set: (key: string, value: string) => mockHeaders.set(key, value),
    get: (key: string) => mockHeaders.get(key),
  },
}));

vi.mock("next/server", () => ({
  NextResponse: {
    next: (...args: unknown[]) => mockNext(...args),
  },
}));

// Mock supabase auth
const mockSupabaseGetSession = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getSession: () => mockSupabaseGetSession() },
  }),
}));

import { updateSession } from "./middleware";

function makeNextRequest(pathname: string) {
  return {
    cookies: {
      getAll: () => [],
      set: vi.fn(),
    },
    nextUrl: {
      pathname,
    },
  } as unknown as import("next/server").NextRequest;
}

describe("updateSession middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.clear();
    mockSupabaseGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  it("calls getSession to refresh session cookie", async () => {
    const req = makeNextRequest("/attendance");
    await updateSession(req);

    expect(mockSupabaseGetSession).toHaveBeenCalledOnce();
  });

  it("returns next response for any path", async () => {
    const req = makeNextRequest("/children");
    await updateSession(req);

    expect(mockNext).toHaveBeenCalled();
  });

  it("sets x-pathname header on response", async () => {
    const req = makeNextRequest("/attendance/dashboard");
    await updateSession(req);

    expect(mockHeaders.get("x-pathname")).toBe("/attendance/dashboard");
  });

  it("sets x-pathname for nested paths", async () => {
    const req = makeNextRequest("/admin/users");
    await updateSession(req);

    expect(mockHeaders.get("x-pathname")).toBe("/admin/users");
  });

  it("sets x-pathname for root path", async () => {
    const req = makeNextRequest("/");
    await updateSession(req);

    expect(mockHeaders.get("x-pathname")).toBe("/");
  });
});
