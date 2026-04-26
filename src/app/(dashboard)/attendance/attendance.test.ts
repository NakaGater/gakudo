import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock } from "@/test/supabase-mock-factory";

// I/O 境界 (next/cache, getUser, Supabase, 通知) のみモック。
// enter/exit 判定ロジックは actions.helpers.test.ts でカバー済み。
const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

const mockGetUser = vi.fn();
vi.mock("@/lib/auth/get-user", () => ({
  getUser: () => mockGetUser(),
}));

const mockSendAttendanceNotification = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/notifications/send", () => ({
  sendAttendanceNotification: (...args: unknown[]) => mockSendAttendanceNotification(...args),
}));

const holder = vi.hoisted(() => ({
  current: null as ReturnType<typeof createSupabaseMock> | null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(holder.current!.client),
}));

import { recordAttendance } from "./actions";

describe("recordAttendance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = createSupabaseMock();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T01:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects non-entrance users", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
    const result = await recordAttendance("GK-X");
    expect(result).toMatchObject({ success: false, message: expect.stringContaining("権限") });
  });

  it("returns 'not found' for an unknown QR code", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "entrance" });
    holder.current!.enqueue("children", { data: null, error: null });

    const result = await recordAttendance("GK-UNKNOWN");
    expect(result).toMatchObject({
      success: false,
      message: expect.stringContaining("見つかりません"),
    });
  });

  it("returns 'inactive' for a child whose QR is disabled", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "entrance" });
    holder.current!.enqueue("children", {
      data: { id: "c1", name: "太郎", qr_active: false },
      error: null,
    });

    const result = await recordAttendance("GK-INACTIVE");
    expect(result).toMatchObject({ success: false, message: expect.stringContaining("無効") });
  });

  it("inserts an 'enter' record on first scan of the day", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "entrance" });
    holder.current!.enqueue("children", {
      data: { id: "c1", name: "太郎", qr_active: true },
      error: null,
    });
    holder.current!.enqueue("attendances", { data: null, error: null });
    holder.current!.enqueue("attendances", {
      data: { id: "att-1", type: "enter", recorded_at: "2024-06-15T01:00:00Z" },
      error: null,
    });

    const result = await recordAttendance("GK-TESTCODE");

    expect(result).toMatchObject({ success: true, childName: "太郎", type: "enter" });
    // 境界契約: insert payload が child_id / type / method / recorded_by を持つ
    expect(holder.current!.spies.mutations).toContainEqual({
      table: "attendances",
      op: "insert",
      payload: { child_id: "c1", type: "enter", method: "qr", recorded_by: "u1" },
      options: undefined,
    });
  });

  it("returns sanitized error when insert fails", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "entrance" });
    holder.current!.enqueue("children", {
      data: { id: "c1", name: "太郎", qr_active: true },
      error: null,
    });
    holder.current!.enqueue("attendances", { data: null, error: null });
    holder.current!.enqueue("attendances", {
      data: null,
      error: { message: "internal_pg_detail" },
    });

    const result = await recordAttendance("GK-TESTCODE");
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/記録に失敗/);
    expect(result.message).not.toContain("internal_pg_detail");
  });
});
