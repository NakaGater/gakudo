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

// Mock Supabase - flexible chainable query builder
const mockFromResults = new Map<string, unknown>();
const createChain = (table: string) => {
  const handler = (): Record<string, unknown> =>
    new Proxy({} as Record<string, unknown>, {
      get: (_target, prop) => {
        if (prop === "then") return undefined;
        if (prop === "single") {
          return () => {
            const result = mockFromResults.get(table);
            return Promise.resolve(result ?? { data: null, error: null });
          };
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
    mockFromResults.clear();
  });

  it("rejects non-staff users", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
    const result = await recordManualAttendance("c1");
    expect(result.success).toBe(false);
    expect(result.message).toContain("権限");
  });

  it("returns error when child not found", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    mockFromResults.set("children", { data: null, error: null });

    const result = await recordManualAttendance("c1");
    expect(result.success).toBe(false);
    expect(result.message).toContain("児童");
  });

  it("records enter when no previous attendance", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    mockFromResults.set("children", { data: { id: "c1", name: "太郎" }, error: null });
    // No previous attendance → single returns null → enter
    mockFromResults.set("attendances", { data: { id: "a1", type: "enter", recorded_at: "2025-01-01T10:00:00Z" }, error: null });

    const result = await recordManualAttendance("c1");
    expect(result.success).toBe(true);
    expect(result.childName).toBe("太郎");
  });

  it("allows teacher users", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "teacher" });
    mockFromResults.set("children", { data: { id: "c1", name: "花子" }, error: null });
    mockFromResults.set("attendances", { data: { id: "a1", type: "enter", recorded_at: "2025-01-01T10:00:00Z" }, error: null });

    const result = await recordManualAttendance("c1");
    expect(result.success).toBe(true);
  });
});

describe("recordAttendance (QR)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFromResults.clear();
  });

  it("rejects non-staff users", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
    const result = await recordAttendance("GK-ABC");
    expect(result.success).toBe(false);
    expect(result.message).toContain("権限");
  });

  it("returns error when child not found by QR", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    mockFromResults.set("children", { data: null, error: null });

    const result = await recordAttendance("GK-INVALID");
    expect(result.success).toBe(false);
    expect(result.message).toContain("児童");
  });

  it("returns error when QR is inactive", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    mockFromResults.set("children", { data: { id: "c1", name: "太郎", qr_active: false }, error: null });

    const result = await recordAttendance("GK-ABC");
    expect(result.success).toBe(false);
    expect(result.message).toContain("無効");
  });

  it("records attendance with active QR", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    mockFromResults.set("children", { data: { id: "c1", name: "太郎", qr_active: true }, error: null });
    mockFromResults.set("attendances", { data: { id: "a1", type: "enter", recorded_at: "2025-01-01T10:00:00Z" }, error: null });

    const result = await recordAttendance("GK-ABC");
    expect(result.success).toBe(true);
    expect(result.childName).toBe("太郎");
  });
});

describe("getTodayAttendanceStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFromResults.clear();
  });

  it("returns empty for non-staff", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
    const result = await getTodayAttendanceStatus();
    expect(result).toEqual([]);
  });
});

describe("getDashboardAttendanceStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFromResults.clear();
  });

  it("returns empty for non-staff", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });
    const result = await getDashboardAttendanceStatus();
    expect(result).toEqual([]);
  });
});
