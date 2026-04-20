import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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

// Mock Supabase — chainable query builder
const mockSingle = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockGte = vi.fn();
const mockLt = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: (...args: unknown[]) => mockFrom(...args),
    }),
  ),
}));

import { recordAttendance } from "./actions";

function setupChain() {
  // Reset chain mocks
  mockSingle.mockReset();
  mockOrder.mockReset();
  mockLimit.mockReset();
  mockGte.mockReset();
  mockLt.mockReset();
  mockEq.mockReset();
  mockSelect.mockReset();
  mockInsert.mockReset();

  // Default chain: .select().eq().eq().single() for child lookup
  // and .select().eq().gte().lt().order().limit().single() for attendance lookup
  // and .insert().select().single() for insert
  const chain = {
    select: mockSelect,
    eq: mockEq,
    gte: mockGte,
    lt: mockLt,
    order: mockOrder,
    limit: mockLimit,
    single: mockSingle,
    insert: mockInsert,
  };

  mockSelect.mockReturnValue(chain);
  mockEq.mockReturnValue(chain);
  mockGte.mockReturnValue(chain);
  mockLt.mockReturnValue(chain);
  mockOrder.mockReturnValue(chain);
  mockLimit.mockReturnValue(chain);
  mockInsert.mockReturnValue(chain);

  return chain;
}

describe("recordAttendance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Use a fixed date for deterministic tests
    vi.useFakeTimers();
    // Set to 2024-06-15 10:00:00 JST (= 2024-06-15 01:00:00 UTC)
    vi.setSystemTime(new Date("2024-06-15T01:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects non-staff users (parent role)", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "parent" });

    const result = await recordAttendance("GK-TESTCODE");
    expect(result).toMatchObject({
      success: false,
      message: expect.stringContaining("権限"),
    });
  });

  it("returns error for unknown QR code", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "teacher" });
    setupChain();

    // Child lookup returns null
    mockSingle.mockResolvedValueOnce({ data: null, error: null });

    const result = await recordAttendance("GK-UNKNOWN");
    expect(result).toMatchObject({
      success: false,
      message: expect.stringContaining("見つかりません"),
    });
  });

  it("returns error for inactive QR code", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "teacher" });
    setupChain();

    // Child lookup returns inactive child
    mockSingle.mockResolvedValueOnce({
      data: { id: "child-1", name: "テスト太郎", qr_active: false },
      error: null,
    });

    const result = await recordAttendance("GK-INACTIVE");
    expect(result).toMatchObject({
      success: false,
      message: expect.stringContaining("無効"),
    });
  });

  it("records 'enter' on first scan of the day", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "teacher" });
    setupChain();

    // Child lookup
    mockSingle.mockResolvedValueOnce({
      data: { id: "child-1", name: "テスト太郎", qr_active: true },
      error: null,
    });

    // Latest attendance today → none
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    // Insert attendance
    mockSingle.mockResolvedValueOnce({
      data: { id: "att-1", type: "enter", recorded_at: "2024-06-15T01:00:00Z" },
      error: null,
    });

    const result = await recordAttendance("GK-TESTCODE");
    expect(result).toMatchObject({
      success: true,
      childName: "テスト太郎",
      type: "enter",
    });

    // Verify insert was called with enter type
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        child_id: "child-1",
        type: "enter",
        method: "qr",
        recorded_by: "u1",
      }),
    );
  });

  it("records 'exit' when last record is 'enter'", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    setupChain();

    // Child lookup
    mockSingle.mockResolvedValueOnce({
      data: { id: "child-1", name: "テスト花子", qr_active: true },
      error: null,
    });

    // Latest attendance today → enter
    mockSingle.mockResolvedValueOnce({
      data: { id: "att-prev", type: "enter", recorded_at: "2024-06-15T00:00:00Z" },
      error: null,
    });

    // Insert attendance
    mockSingle.mockResolvedValueOnce({
      data: { id: "att-2", type: "exit", recorded_at: "2024-06-15T01:00:00Z" },
      error: null,
    });

    const result = await recordAttendance("GK-TESTCODE");
    expect(result).toMatchObject({
      success: true,
      childName: "テスト花子",
      type: "exit",
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        child_id: "child-1",
        type: "exit",
        method: "qr",
      }),
    );
  });

  it("records 'enter' again when last record is 'exit'", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "teacher" });
    setupChain();

    // Child lookup
    mockSingle.mockResolvedValueOnce({
      data: { id: "child-1", name: "テスト次郎", qr_active: true },
      error: null,
    });

    // Latest attendance today → exit
    mockSingle.mockResolvedValueOnce({
      data: { id: "att-prev", type: "exit", recorded_at: "2024-06-15T00:30:00Z" },
      error: null,
    });

    // Insert attendance
    mockSingle.mockResolvedValueOnce({
      data: { id: "att-3", type: "enter", recorded_at: "2024-06-15T01:00:00Z" },
      error: null,
    });

    const result = await recordAttendance("GK-TESTCODE");
    expect(result).toMatchObject({
      success: true,
      childName: "テスト次郎",
      type: "enter",
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        child_id: "child-1",
        type: "enter",
      }),
    );
  });

  it("allows admin role", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "admin" });
    setupChain();

    mockSingle.mockResolvedValueOnce({
      data: { id: "child-1", name: "テスト太郎", qr_active: true },
      error: null,
    });
    mockSingle.mockResolvedValueOnce({ data: null, error: null });
    mockSingle.mockResolvedValueOnce({
      data: { id: "att-1", type: "enter", recorded_at: "2024-06-15T01:00:00Z" },
      error: null,
    });

    const result = await recordAttendance("GK-TESTCODE");
    expect(result).toMatchObject({ success: true });
  });
});
