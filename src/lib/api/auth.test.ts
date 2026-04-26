import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const mockGetUser = vi.fn();
const mockSingle = vi.fn();
const mockCreateClient = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

import { withApiAuth } from "./auth";

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateClient.mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => mockSingle(),
        }),
      }),
    }),
  });
});

describe("withApiAuth", () => {
  it("returns 401 JSON when no session is present", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const handler = vi.fn();
    const wrapped = withApiAuth("staff", handler);

    const res = (await wrapped(new Request("http://x"))) as NextResponse;
    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 403 when role does not match the guard", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockSingle.mockResolvedValue({ data: { role: "parent" }, error: null });
    const handler = vi.fn();
    const wrapped = withApiAuth("admin", handler);

    const res = (await wrapped(new Request("http://x"))) as NextResponse;
    expect(res.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("invokes the handler with ctx when authorization passes", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockSingle.mockResolvedValue({ data: { role: "admin" }, error: null });
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withApiAuth("admin", handler);

    const req = new Request("http://x");
    const res = (await wrapped(req)) as NextResponse;
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ role: "admin" }), req);
  });

  it("supports the adminOrTeacher convenience guard", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockSingle.mockResolvedValue({ data: { role: "teacher" }, error: null });
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withApiAuth("adminOrTeacher", handler);

    const res = (await wrapped(new Request("http://x"))) as NextResponse;
    expect(res.status).toBe(200);
  });

  it("supports an allow-list guard", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    mockSingle.mockResolvedValue({ data: { role: "entrance" }, error: null });
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withApiAuth(["admin", "entrance"], handler);

    const res = (await wrapped(new Request("http://x"))) as NextResponse;
    expect(res.status).toBe(200);
  });
});
