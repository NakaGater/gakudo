import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock } from "@/test/supabase-mock-factory";

const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

const mockGetUser = vi.fn();
vi.mock("@/lib/auth/get-user", () => ({
  getUser: () => mockGetUser(),
}));

const mockSendNotification = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/notifications/send", () => ({
  sendAttendanceNotification: (...args: unknown[]) => mockSendNotification(...args),
}));

// Shared mock holder. Re-built fresh in each `beforeEach` so per-test
// `enqueue` and `setRpc` calls stay isolated.
const holder = vi.hoisted(() => ({
  current: null as ReturnType<typeof createSupabaseMock> | null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => Promise.resolve(holder.current!.client),
}));

import {
  recordManualAttendance,
  recordAttendance,
  getTodayAttendanceStatus,
  getDashboardAttendanceStatus,
  getParentAttendanceStatus,
} from "./actions";

const enqueue = (table: string, resolved: { data: unknown; error: unknown }) =>
  holder.current!.enqueue(table, resolved);

const buildMock = () =>
  createSupabaseMock({
    rpc: {
      get_attendance_summary: {
        data: { entered: 5, exited: 2, none: 3, total: 10 },
        error: null,
      },
    },
  });

describe("recordManualAttendance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = buildMock();
  });

  it("rejects non-entrance users", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
    const result = await recordManualAttendance("c1");
    expect(result.success).toBe(false);
    expect(result.message).toContain("権限");
  });

  it("rejects admin from recording", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const result = await recordManualAttendance("c1");
    expect(result.success).toBe(false);
    expect(result.message).toContain("権限");
  });

  it("rejects teacher from recording", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "teacher" });
    const result = await recordManualAttendance("c1");
    expect(result.success).toBe(false);
    expect(result.message).toContain("権限");
  });

  it("returns error when child not found", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "entrance" });
    enqueue("children", { data: null, error: null });

    const result = await recordManualAttendance("c1");
    expect(result.success).toBe(false);
    expect(result.message).toContain("児童");
  });

  it("records enter when no previous attendance today", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "entrance" });
    enqueue("children", { data: { id: "c1", name: "太郎" }, error: null });
    enqueue("attendances", { data: null, error: null });
    enqueue("attendances", {
      data: { id: "a1", type: "enter", recorded_at: "2025-01-01T10:00:00Z" },
      error: null,
    });

    const result = await recordManualAttendance("c1");
    expect(result.success).toBe(true);
    expect(result.childName).toBe("太郎");
    expect(result.type).toBe("enter");
    expect(result.message).toContain("入室");
  });

  it("records exit when last record is enter", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "entrance" });
    enqueue("children", { data: { id: "c1", name: "花子" }, error: null });
    enqueue("attendances", {
      data: { id: "a0", type: "enter", recorded_at: "2025-01-01T08:00:00Z" },
      error: null,
    });
    enqueue("attendances", {
      data: { id: "a1", type: "exit", recorded_at: "2025-01-01T17:00:00Z" },
      error: null,
    });

    const result = await recordManualAttendance("c1");
    expect(result.success).toBe(true);
    expect(result.type).toBe("exit");
    expect(result.message).toContain("退室");
  });

  it("returns error on insert failure", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "entrance" });
    enqueue("children", { data: { id: "c1", name: "太郎" }, error: null });
    enqueue("attendances", { data: null, error: null });
    enqueue("attendances", {
      data: null,
      error: { message: "constraint attendances_pkey violated" },
    });

    const result = await recordManualAttendance("c1");
    expect(result.success).toBe(false);
    // Phase 2-B: sanitized — DB error never reaches the user.
    expect(result.message).toMatch(/記録に失敗/);
    expect(result.message).not.toContain("constraint");
  });

  it("sends notification after recording", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "entrance" });
    enqueue("children", { data: { id: "c1", name: "太郎" }, error: null });
    enqueue("attendances", { data: null, error: null });
    enqueue("attendances", {
      data: { id: "a1", type: "enter", recorded_at: "2025-01-01T10:00:00Z" },
      error: null,
    });

    await recordManualAttendance("c1");
    expect(mockSendNotification).toHaveBeenCalledWith("c1", "enter", "2025-01-01T10:00:00Z");
  });
});

describe("recordAttendance (QR)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = buildMock();
  });

  it("rejects non-entrance users", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
    const result = await recordAttendance("GK-ABC");
    expect(result.success).toBe(false);
    expect(result.message).toContain("権限");
  });

  it("rejects admin from QR recording", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    const result = await recordAttendance("GK-ABC");
    expect(result.success).toBe(false);
    expect(result.message).toContain("権限");
  });

  it("returns error when child not found by QR", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "entrance" });
    enqueue("children", { data: null, error: null });

    const result = await recordAttendance("GK-INVALID");
    expect(result.success).toBe(false);
    expect(result.message).toContain("児童");
  });

  it("returns error when QR is inactive", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "entrance" });
    enqueue("children", { data: { id: "c1", name: "太郎", qr_active: false }, error: null });

    const result = await recordAttendance("GK-ABC");
    expect(result.success).toBe(false);
    expect(result.message).toContain("無効");
  });

  it("records enter with active QR and no previous record", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "entrance" });
    enqueue("children", { data: { id: "c1", name: "太郎", qr_active: true }, error: null });
    enqueue("attendances", { data: null, error: null });
    enqueue("attendances", {
      data: { id: "a1", type: "enter", recorded_at: "2025-01-01T10:00:00Z" },
      error: null,
    });

    const result = await recordAttendance("GK-ABC");
    expect(result.success).toBe(true);
    expect(result.childName).toBe("太郎");
    expect(result.type).toBe("enter");
  });

  it("records exit when previous is enter", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "entrance" });
    enqueue("children", { data: { id: "c1", name: "太郎", qr_active: true }, error: null });
    enqueue("attendances", { data: { id: "a0", type: "enter" }, error: null });
    enqueue("attendances", {
      data: { id: "a1", type: "exit", recorded_at: "2025-01-01T17:00:00Z" },
      error: null,
    });

    const result = await recordAttendance("GK-ABC");
    expect(result.success).toBe(true);
    expect(result.type).toBe("exit");
  });

  it("returns error on insert failure", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "entrance" });
    enqueue("children", { data: { id: "c1", name: "太郎", qr_active: true }, error: null });
    enqueue("attendances", { data: null, error: null });
    enqueue("attendances", { data: null, error: { message: "schema_internal_xyz" } });

    const result = await recordAttendance("GK-ABC");
    expect(result.success).toBe(false);
    // Phase 2-B: DB error must not leak.
    expect(result.message).not.toContain("schema_internal_xyz");
    expect(result.message).toMatch(/記録に失敗/);
  });

  it("sends notification after QR recording", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "entrance" });
    enqueue("children", { data: { id: "c1", name: "太郎", qr_active: true }, error: null });
    enqueue("attendances", { data: null, error: null });
    enqueue("attendances", {
      data: { id: "a1", type: "enter", recorded_at: "2025-01-01T10:00:00Z" },
      error: null,
    });

    await recordAttendance("GK-ABC");
    expect(mockSendNotification).toHaveBeenCalledWith("c1", "enter", "2025-01-01T10:00:00Z");
  });
});

describe("getTodayAttendanceStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = buildMock();
  });

  it("returns empty for non-staff", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
    const result = await getTodayAttendanceStatus();
    expect(result).toEqual([]);
  });

  it("returns empty when no children exist", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    enqueue("children", { data: [], error: null });
    const result = await getTodayAttendanceStatus();
    expect(result).toEqual([]);
  });

  it("returns children with none status when no attendance records", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    enqueue("children", { data: [{ id: "c1", name: "太郎", grade: 1 }], error: null });
    enqueue("attendances", { data: [], error: null });

    const result = await getTodayAttendanceStatus();
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      childId: "c1",
      name: "太郎",
      grade: 1,
      status: "none",
      lastRecordedAt: null,
    });
  });

  it("returns entered status when latest record is enter", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "teacher" });
    enqueue("children", {
      data: [
        { id: "c1", name: "太郎", grade: 1 },
        { id: "c2", name: "花子", grade: 2 },
      ],
      error: null,
    });
    enqueue("attendances", {
      data: [
        { child_id: "c1", type: "enter", recorded_at: "2025-01-01T08:00:00Z" },
        { child_id: "c2", type: "enter", recorded_at: "2025-01-01T08:30:00Z" },
        { child_id: "c2", type: "exit", recorded_at: "2025-01-01T17:00:00Z" },
      ],
      error: null,
    });

    const result = await getTodayAttendanceStatus();
    expect(result).toHaveLength(2);
    expect(result[0]!.status).toBe("entered");
    expect(result[0]!.lastRecordedAt).toBe("2025-01-01T08:00:00Z");
    expect(result[1]!.status).toBe("exited");
    expect(result[1]!.lastRecordedAt).toBe("2025-01-01T17:00:00Z");
  });

  it("handles null attendances data gracefully", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    enqueue("children", { data: [{ id: "c1", name: "太郎", grade: 1 }], error: null });
    enqueue("attendances", { data: null, error: null });

    const result = await getTodayAttendanceStatus();
    expect(result).toHaveLength(1);
    expect(result[0]!.status).toBe("none");
  });
});

describe("getDashboardAttendanceStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = buildMock();
  });

  it("returns empty for non-staff", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
    const result = await getDashboardAttendanceStatus();
    expect(result).toEqual([]);
  });

  it("returns empty when no children", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    enqueue("children", { data: [], error: null });
    const result = await getDashboardAttendanceStatus();
    expect(result).toEqual([]);
  });

  it("returns children with enter/exit times", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    enqueue("children", {
      data: [
        { id: "c1", name: "太郎", grade: 1 },
        { id: "c2", name: "花子", grade: 2 },
      ],
      error: null,
    });
    enqueue("attendances", {
      data: [
        { child_id: "c1", type: "enter", recorded_at: "2025-01-01T08:00:00Z" },
        { child_id: "c2", type: "enter", recorded_at: "2025-01-01T08:30:00Z" },
        { child_id: "c1", type: "exit", recorded_at: "2025-01-01T17:00:00Z" },
      ],
      error: null,
    });

    const result = await getDashboardAttendanceStatus();
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      childId: "c1",
      status: "exited",
      enterTime: "2025-01-01T08:00:00Z",
      exitTime: "2025-01-01T17:00:00Z",
    });
    expect(result[1]).toMatchObject({
      childId: "c2",
      status: "entered",
      enterTime: "2025-01-01T08:30:00Z",
      exitTime: null,
    });
  });

  it("returns none status for children with no records", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    enqueue("children", { data: [{ id: "c1", name: "太郎", grade: 1 }], error: null });
    enqueue("attendances", { data: [], error: null });

    const result = await getDashboardAttendanceStatus();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      status: "none",
      enterTime: null,
      exitTime: null,
    });
  });

  it("handles null attendances gracefully", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    enqueue("children", { data: [{ id: "c1", name: "太郎", grade: 1 }], error: null });
    enqueue("attendances", { data: null, error: null });

    const result = await getDashboardAttendanceStatus();
    expect(result).toHaveLength(1);
    expect(result[0]!.status).toBe("none");
  });
});

describe("getParentAttendanceStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    holder.current = buildMock();
  });

  it("returns empty children with summary when parent has no children", async () => {
    mockGetUser.mockResolvedValue({ id: "p1", role: "parent" });
    enqueue("children", { data: [], error: null });

    const result = await getParentAttendanceStatus();
    expect(result.myChildren).toEqual([]);
    expect(result.summary.total).toBe(10);
  });

  it("returns summary with default zeros when RPC returns null", async () => {
    mockGetUser.mockResolvedValue({ id: "p1", role: "parent" });
    holder.current!.setRpc("get_attendance_summary", { data: null, error: null });
    enqueue("children", { data: [], error: null });

    const result = await getParentAttendanceStatus();
    expect(result.summary).toEqual({ entered: 0, exited: 0, none: 0, total: 0 });
  });

  it("returns children with none status when no attendance records", async () => {
    mockGetUser.mockResolvedValue({ id: "p1", role: "parent" });
    enqueue("children", { data: [{ id: "c1", name: "太郎", grade: 1 }], error: null });
    enqueue("attendances", { data: [], error: null });

    const result = await getParentAttendanceStatus();
    expect(result.myChildren).toHaveLength(1);
    expect(result.myChildren[0]).toMatchObject({
      childId: "c1",
      name: "太郎",
      status: "none",
      enterTime: null,
      exitTime: null,
    });
  });

  it("returns entered status when latest record is enter", async () => {
    mockGetUser.mockResolvedValue({ id: "p1", role: "parent" });
    enqueue("children", { data: [{ id: "c1", name: "太郎", grade: 1 }], error: null });
    enqueue("attendances", {
      data: [{ child_id: "c1", type: "enter", recorded_at: "2025-01-01T08:00:00Z" }],
      error: null,
    });

    const result = await getParentAttendanceStatus();
    expect(result.myChildren[0]).toMatchObject({
      status: "entered",
      enterTime: "2025-01-01T08:00:00Z",
      exitTime: null,
    });
  });

  it("returns exited status when latest record is exit", async () => {
    mockGetUser.mockResolvedValue({ id: "p1", role: "parent" });
    enqueue("children", { data: [{ id: "c1", name: "太郎", grade: 1 }], error: null });
    enqueue("attendances", {
      data: [
        { child_id: "c1", type: "enter", recorded_at: "2025-01-01T08:00:00Z" },
        { child_id: "c1", type: "exit", recorded_at: "2025-01-01T17:00:00Z" },
      ],
      error: null,
    });

    const result = await getParentAttendanceStatus();
    expect(result.myChildren[0]).toMatchObject({
      status: "exited",
      enterTime: "2025-01-01T08:00:00Z",
      exitTime: "2025-01-01T17:00:00Z",
    });
  });

  it("handles null attendances data gracefully", async () => {
    mockGetUser.mockResolvedValue({ id: "p1", role: "parent" });
    enqueue("children", { data: [{ id: "c1", name: "太郎", grade: 1 }], error: null });
    enqueue("attendances", { data: null, error: null });

    const result = await getParentAttendanceStatus();
    expect(result.myChildren).toHaveLength(1);
    expect(result.myChildren[0]!.status).toBe("none");
  });

  it("handles multiple children with different statuses", async () => {
    mockGetUser.mockResolvedValue({ id: "p1", role: "parent" });
    enqueue("children", {
      data: [
        { id: "c1", name: "太郎", grade: 1 },
        { id: "c2", name: "花子", grade: 3 },
      ],
      error: null,
    });
    enqueue("attendances", {
      data: [
        { child_id: "c1", type: "enter", recorded_at: "2025-01-01T08:00:00Z" },
        { child_id: "c2", type: "enter", recorded_at: "2025-01-01T08:30:00Z" },
        { child_id: "c2", type: "exit", recorded_at: "2025-01-01T17:00:00Z" },
      ],
      error: null,
    });

    const result = await getParentAttendanceStatus();
    expect(result.myChildren).toHaveLength(2);
    expect(result.myChildren[0]!.status).toBe("entered");
    expect(result.myChildren[1]!.status).toBe("exited");
  });
});
