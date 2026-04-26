import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const controller = vi.hoisted(() => ({
  authUser: null as { id: string } | null,
  profileRow: null as { role: string } | null,
}));

vi.mock("@/lib/supabase/server", async () => {
  const { createSupabaseMock } = await import("@/test/supabase-mock-factory");
  return {
    createClient: () => {
      const { client } = createSupabaseMock({
        authUser: controller.authUser,
        tableResolver: (table: string) => {
          if (table !== "profiles") return undefined;
          return { data: controller.profileRow, error: null };
        },
      });
      return Promise.resolve(client);
    },
  };
});

import { withApiAuth } from "./auth";

beforeEach(() => {
  vi.clearAllMocks();
  controller.authUser = null;
  controller.profileRow = null;
});

describe("withApiAuth", () => {
  it("returns 401 JSON when no session is present", async () => {
    const handler = vi.fn();
    const wrapped = withApiAuth("staff", handler);

    const res = (await wrapped(new Request("http://x"))) as NextResponse;
    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 403 when role does not match the guard", async () => {
    controller.authUser = { id: "u1" };
    controller.profileRow = { role: "parent" };
    const handler = vi.fn();
    const wrapped = withApiAuth("admin", handler);

    const res = (await wrapped(new Request("http://x"))) as NextResponse;
    expect(res.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("invokes the handler with ctx when authorization passes", async () => {
    controller.authUser = { id: "u1" };
    controller.profileRow = { role: "admin" };
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withApiAuth("admin", handler);

    const req = new Request("http://x");
    const res = (await wrapped(req)) as NextResponse;
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ role: "admin" }), req);
  });

  it("supports the adminOrTeacher convenience guard", async () => {
    controller.authUser = { id: "u1" };
    controller.profileRow = { role: "teacher" };
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withApiAuth("adminOrTeacher", handler);

    const res = (await wrapped(new Request("http://x"))) as NextResponse;
    expect(res.status).toBe(200);
  });

  it("supports an allow-list guard", async () => {
    controller.authUser = { id: "u1" };
    controller.profileRow = { role: "entrance" };
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withApiAuth(["admin", "entrance"], handler);

    const res = (await wrapped(new Request("http://x"))) as NextResponse;
    expect(res.status).toBe(200);
  });
});
