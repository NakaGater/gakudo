import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/cache
const mockRevalidatePath = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

// Mock getUser
const mockGetUser = vi.fn();
vi.mock("@/lib/auth/get-user", () => ({
  getUser: () => mockGetUser(),
}));

// Mock notification
const mockSendNotification = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/notifications/send", () => ({
  sendAttendanceNotification: (...args: unknown[]) => mockSendNotification(...args),
}));

// Queue-based mock: each from(table) call returns next result in queue
const callQueues = new Map<string, Array<Record<string, unknown>>>();

function enqueue(table: string, result: Record<string, unknown>) {
  if (!callQueues.has(table)) callQueues.set(table, []);
  callQueues.get(table)!.push(result);
}

function dequeue(table: string): Record<string, unknown> {
  const q = callQueues.get(table);
  if (q && q.length > 0) return q.shift()!;
  return { data: null, error: null };
}

const createChain = (table: string): Record<string, unknown> => {
  const handler = (): Record<string, unknown> =>
    new Proxy({} as Record<string, unknown>, {
      get: (_target, prop) => {
        if (prop === "then") {
          // Make proxy thenable so `await chain` dequeues
          return (resolve: (v: unknown) => void) => resolve(dequeue(table));
        }
        if (prop === "single") {
          return () => Promise.resolve(dequeue(table));
        }
        return () => handler();
      },
    });
  return handler();
};
const mockFrom = vi.fn((table: string) => createChain(table));
const mockRpc = vi.fn().mockResolvedValue({ data: { entered: 5, exited: 2, none: 3, total: 10 } });
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: (...args: [string]) => mockFrom(...args),
      rpc: (...args: unknown[]) => mockRpc(...args),
    }),
  ),
}));

import {
  recordManualAttendance,
  recordAttendance,
  getTodayAttendanceStatus,
  getDashboardAttendanceStatus,
  getParentAttendanceStatus,
} from "./actions";

describe("recordManualAttendance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callQueues.clear();
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
    // 1st children call: find child
    enqueue("children", { data: { id: "c1", name: "太郎" }, error: null });
    // 1st attendances call: no previous → null
    enqueue("attendances", { data: null, error: null });
    // 2nd attendances call: insert result
    enqueue("attendances", { data: { id: "a1", type: "enter", recorded_at: "2025-01-01T10:00:00Z" }, error: null });

    const result = await recordManualAttendance("c1");
    expect(result.success).toBe(true);
    expect(result.childName).toBe("太郎");
    expect(result.type).toBe("enter");
    expect(result.message).toContain("入室");
  });

  it("records exit when last record is enter", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "entrance" });
    enqueue("children", { data: { id: "c1", name: "花子" }, error: null });
    // Previous record was enter
    enqueue("attendances", { data: { id: "a0", type: "enter", recorded_at: "2025-01-01T08:00:00Z" }, error: null });
    // Insert returns exit
    enqueue("attendances", { data: { id: "a1", type: "exit", recorded_at: "2025-01-01T17:00:00Z" }, error: null });

    const result = await recordManualAttendance("c1");
    expect(result.success).toBe(true);
    expect(result.type).toBe("exit");
    expect(result.message).toContain("退室");
  });

  it("returns error on insert failure", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "entrance" });
    enqueue("children", { data: { id: "c1", name: "太郎" }, error: null });
    enqueue("attendances", { data: null, error: null }); // no previous
    enqueue("attendances", { data: null, error: { message: "insert failed" } }); // insert error

    const result = await recordManualAttendance("c1");
    expect(result.success).toBe(false);
    expect(result.message).toContain("insert failed");
  });

  it("sends notification after recording", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "entrance" });
    enqueue("children", { data: { id: "c1", name: "太郎" }, error: null });
    enqueue("attendances", { data: null, error: null });
    enqueue("attendances", { data: { id: "a1", type: "enter", recorded_at: "2025-01-01T10:00:00Z" }, error: null });

    await recordManualAttendance("c1");
    expect(mockSendNotification).toHaveBeenCalledWith("c1", "enter", "2025-01-01T10:00:00Z");
  });
});

describe("recordAttendance (QR)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callQueues.clear();
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
    enqueue("attendances", { data: null, error: null }); // no previous
    enqueue("attendances", { data: { id: "a1", type: "enter", recorded_at: "2025-01-01T10:00:00Z" }, error: null });

    const result = await recordAttendance("GK-ABC");
    expect(result.success).toBe(true);
    expect(result.childName).toBe("太郎");
    expect(result.type).toBe("enter");
  });

  it("records exit when previous is enter", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "entrance" });
    enqueue("children", { data: { id: "c1", name: "太郎", qr_active: true }, error: null });
    enqueue("attendances", { data: { id: "a0", type: "enter" }, error: null }); // previous enter
    enqueue("attendances", { data: { id: "a1", type: "exit", recorded_at: "2025-01-01T17:00:00Z" }, error: null });

    const result = await recordAttendance("GK-ABC");
    expect(result.success).toBe(true);
    expect(result.type).toBe("exit");
  });

  it("returns error on insert failure", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "entrance" });
    enqueue("children", { data: { id: "c1", name: "太郎", qr_active: true }, error: null });
    enqueue("attendances", { data: null, error: null });
    enqueue("attendances", { data: null, error: { message: "DB error" } });

    const result = await recordAttendance("GK-ABC");
    expect(result.success).toBe(false);
    expect(result.message).toContain("DB error");
  });

  it("sends notification after QR recording", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "entrance" });
    enqueue("children", { data: { id: "c1", name: "太郎", qr_active: true }, error: null });
    enqueue("attendances", { data: null, error: null });
    enqueue("attendances", { data: { id: "a1", type: "enter", recorded_at: "2025-01-01T10:00:00Z" }, error: null });

    await recordAttendance("GK-ABC");
    expect(mockSendNotification).toHaveBeenCalledWith("c1", "enter", "2025-01-01T10:00:00Z");
  });
});

describe("getTodayAttendanceStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callQueues.clear();
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
    enqueue("children", { data: [
      { id: "c1", name: "太郎", grade: 1 },
      { id: "c2", name: "花子", grade: 2 },
    ], error: null });
    enqueue("attendances", { data: [
      { child_id: "c1", type: "enter", recorded_at: "2025-01-01T08:00:00Z" },
      { child_id: "c2", type: "enter", recorded_at: "2025-01-01T08:30:00Z" },
      { child_id: "c2", type: "exit", recorded_at: "2025-01-01T17:00:00Z" },
    ], error: null });

    const result = await getTodayAttendanceStatus();
    expect(result).toHaveLength(2);
    expect(result[0].status).toBe("entered");
    expect(result[0].lastRecordedAt).toBe("2025-01-01T08:00:00Z");
    expect(result[1].status).toBe("exited");
    expect(result[1].lastRecordedAt).toBe("2025-01-01T17:00:00Z");
  });

  it("handles null attendances data gracefully", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    enqueue("children", { data: [{ id: "c1", name: "太郎", grade: 1 }], error: null });
    enqueue("attendances", { data: null, error: null });

    const result = await getTodayAttendanceStatus();
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("none");
  });
});

describe("getDashboardAttendanceStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callQueues.clear();
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
    enqueue("children", { data: [
      { id: "c1", name: "太郎", grade: 1 },
      { id: "c2", name: "花子", grade: 2 },
    ], error: null });
    // Records sorted ascending
    enqueue("attendances", { data: [
      { child_id: "c1", type: "enter", recorded_at: "2025-01-01T08:00:00Z" },
      { child_id: "c2", type: "enter", recorded_at: "2025-01-01T08:30:00Z" },
      { child_id: "c1", type: "exit", recorded_at: "2025-01-01T17:00:00Z" },
    ], error: null });

    const result = await getDashboardAttendanceStatus();
    expect(result).toHaveLength(2);
    // c1: exited (latest is exit)
    expect(result[0]).toMatchObject({
      childId: "c1",
      status: "exited",
      enterTime: "2025-01-01T08:00:00Z",
      exitTime: "2025-01-01T17:00:00Z",
    });
    // c2: entered (latest is enter)
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
    expect(result[0].status).toBe("none");
  });
});

describe("getParentAttendanceStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callQueues.clear();
    mockRpc.mockResolvedValue({ data: { entered: 5, exited: 2, none: 3, total: 10 } });
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
    mockRpc.mockResolvedValue({ data: null });
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
      childId: "c1", name: "太郎", status: "none",
      enterTime: null, exitTime: null,
    });
  });

  it("returns entered status when latest record is enter", async () => {
    mockGetUser.mockResolvedValue({ id: "p1", role: "parent" });
    enqueue("children", { data: [{ id: "c1", name: "太郎", grade: 1 }], error: null });
    enqueue("attendances", { data: [
      { child_id: "c1", type: "enter", recorded_at: "2025-01-01T08:00:00Z" },
    ], error: null });

    const result = await getParentAttendanceStatus();
    expect(result.myChildren[0]).toMatchObject({
      status: "entered", enterTime: "2025-01-01T08:00:00Z", exitTime: null,
    });
  });

  it("returns exited status when latest record is exit", async () => {
    mockGetUser.mockResolvedValue({ id: "p1", role: "parent" });
    enqueue("children", { data: [{ id: "c1", name: "太郎", grade: 1 }], error: null });
    enqueue("attendances", { data: [
      { child_id: "c1", type: "enter", recorded_at: "2025-01-01T08:00:00Z" },
      { child_id: "c1", type: "exit", recorded_at: "2025-01-01T17:00:00Z" },
    ], error: null });

    const result = await getParentAttendanceStatus();
    expect(result.myChildren[0]).toMatchObject({
      status: "exited", enterTime: "2025-01-01T08:00:00Z", exitTime: "2025-01-01T17:00:00Z",
    });
  });

  it("handles null attendances data gracefully", async () => {
    mockGetUser.mockResolvedValue({ id: "p1", role: "parent" });
    enqueue("children", { data: [{ id: "c1", name: "太郎", grade: 1 }], error: null });
    enqueue("attendances", { data: null, error: null });

    const result = await getParentAttendanceStatus();
    expect(result.myChildren).toHaveLength(1);
    expect(result.myChildren[0].status).toBe("none");
  });

  it("handles multiple children with different statuses", async () => {
    mockGetUser.mockResolvedValue({ id: "p1", role: "parent" });
    enqueue("children", { data: [
      { id: "c1", name: "太郎", grade: 1 },
      { id: "c2", name: "花子", grade: 3 },
    ], error: null });
    enqueue("attendances", { data: [
      { child_id: "c1", type: "enter", recorded_at: "2025-01-01T08:00:00Z" },
      { child_id: "c2", type: "enter", recorded_at: "2025-01-01T08:30:00Z" },
      { child_id: "c2", type: "exit", recorded_at: "2025-01-01T17:00:00Z" },
    ], error: null });

    const result = await getParentAttendanceStatus();
    expect(result.myChildren).toHaveLength(2);
    expect(result.myChildren[0].status).toBe("entered");
    expect(result.myChildren[1].status).toBe("exited");
  });
});