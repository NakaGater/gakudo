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
        if (prop === "then") return undefined;
        if (prop === "single") {
          return () => Promise.resolve(dequeue(table));
        }
        return (..._args: unknown[]) => handler();
      },
    });
  return handler();
};
const mockFrom = vi.fn((table: string) => createChain(table));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: (...args: [string]) => mockFrom(...args),
    }),
  ),
}));

import {
  recordManualAttendance,
  recordAttendance,
  getTodayAttendanceStatus,
  getDashboardAttendanceStatus,
} from "./actions";

describe("recordManualAttendance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callQueues.clear();
  });

  it("rejects non-staff users", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
    const result = await recordManualAttendance("c1");
    expect(result.success).toBe(false);
    expect(result.message).toContain("権限");
  });

  it("returns error when child not found", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    enqueue("children", { data: null, error: null });

    const result = await recordManualAttendance("c1");
    expect(result.success).toBe(false);
    expect(result.message).toContain("児童");
  });

  it("records enter when no previous attendance today", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
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
    mockGetUser.mockResolvedValue({ id: "u1", role: "teacher" });
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
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    enqueue("children", { data: { id: "c1", name: "太郎" }, error: null });
    enqueue("attendances", { data: null, error: null }); // no previous
    enqueue("attendances", { data: null, error: { message: "insert failed" } }); // insert error

    const result = await recordManualAttendance("c1");
    expect(result.success).toBe(false);
    expect(result.message).toContain("insert failed");
  });

  it("sends notification after recording", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
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

  it("rejects non-staff users", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
    const result = await recordAttendance("GK-ABC");
    expect(result.success).toBe(false);
    expect(result.message).toContain("権限");
  });

  it("returns error when child not found by QR", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    enqueue("children", { data: null, error: null });

    const result = await recordAttendance("GK-INVALID");
    expect(result.success).toBe(false);
    expect(result.message).toContain("児童");
  });

  it("returns error when QR is inactive", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    enqueue("children", { data: { id: "c1", name: "太郎", qr_active: false }, error: null });

    const result = await recordAttendance("GK-ABC");
    expect(result.success).toBe(false);
    expect(result.message).toContain("無効");
  });

  it("records enter with active QR and no previous record", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    enqueue("children", { data: { id: "c1", name: "太郎", qr_active: true }, error: null });
    enqueue("attendances", { data: null, error: null }); // no previous
    enqueue("attendances", { data: { id: "a1", type: "enter", recorded_at: "2025-01-01T10:00:00Z" }, error: null });

    const result = await recordAttendance("GK-ABC");
    expect(result.success).toBe(true);
    expect(result.childName).toBe("太郎");
    expect(result.type).toBe("enter");
  });

  it("records exit when previous is enter", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    enqueue("children", { data: { id: "c1", name: "太郎", qr_active: true }, error: null });
    enqueue("attendances", { data: { id: "a0", type: "enter" }, error: null }); // previous enter
    enqueue("attendances", { data: { id: "a1", type: "exit", recorded_at: "2025-01-01T17:00:00Z" }, error: null });

    const result = await recordAttendance("GK-ABC");
    expect(result.success).toBe(true);
    expect(result.type).toBe("exit");
  });

  it("returns error on insert failure", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    enqueue("children", { data: { id: "c1", name: "太郎", qr_active: true }, error: null });
    enqueue("attendances", { data: null, error: null });
    enqueue("attendances", { data: null, error: { message: "DB error" } });

    const result = await recordAttendance("GK-ABC");
    expect(result.success).toBe(false);
    expect(result.message).toContain("DB error");
  });

  it("sends notification after QR recording", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
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
    // children query returns via the chain's non-single terminal
    // We need the proxy to handle the non-single case
    // Since our proxy returns { data: null } for everything,
    // the function checks !children || children.length === 0 → []
    const result = await getTodayAttendanceStatus();
    expect(result).toEqual([]);
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
    const result = await getDashboardAttendanceStatus();
    expect(result).toEqual([]);
  });
});
