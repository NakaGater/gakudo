import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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

const mockFrom = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve({ from: (...a: unknown[]) => mockFrom(...a) })),
}));

import { recordAttendance } from "./actions";

/**
 * recordAttendance の query は (1) children lookup, (2) latest attendance, (3) insert
 * の 3 つ。それぞれに対応する終端 single() の resolved 値を順に返す chain を組み立てる。
 */
function makeRecordAttendanceChain(opts: {
  child: { id: string; name: string; qr_active: boolean } | null;
  latest: { type: string } | null;
  insertResult: { data: unknown; error: unknown };
}) {
  const childSingle = vi.fn().mockResolvedValue({ data: opts.child, error: null });
  const latestSingle = vi.fn().mockResolvedValue({ data: opts.latest, error: null });
  const insertSingle = vi.fn().mockResolvedValue(opts.insertResult);

  const insert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({ single: insertSingle }),
  });

  let call = 0;
  mockFrom.mockImplementation((table: string) => {
    if (table === "children") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ single: childSingle }),
        }),
      };
    }
    if (table === "attendances") {
      call++;
      if (call === 1) {
        // SELECT latest of today
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lt: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({ single: latestSingle }),
                  }),
                }),
              }),
            }),
          }),
        };
      }
      // INSERT
      return { insert };
    }
    return {};
  });

  return { insert };
}

describe("recordAttendance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });

    const result = await recordAttendance("GK-UNKNOWN");
    expect(result).toMatchObject({
      success: false,
      message: expect.stringContaining("見つかりません"),
    });
  });

  it("returns 'inactive' for a child whose QR is disabled", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "entrance" });
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: "c1", name: "太郎", qr_active: false },
            error: null,
          }),
        }),
      }),
    });

    const result = await recordAttendance("GK-INACTIVE");
    expect(result).toMatchObject({ success: false, message: expect.stringContaining("無効") });
  });

  it("inserts an 'enter' record on first scan of the day", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "entrance" });
    const { insert } = makeRecordAttendanceChain({
      child: { id: "c1", name: "太郎", qr_active: true },
      latest: null,
      insertResult: {
        data: { id: "att-1", type: "enter", recorded_at: "2024-06-15T01:00:00Z" },
        error: null,
      },
    });

    const result = await recordAttendance("GK-TESTCODE");

    expect(result).toMatchObject({ success: true, childName: "太郎", type: "enter" });
    // 境界契約: insert に渡された payload が child_id / type / method / recorded_by を持つ
    expect(insert).toHaveBeenCalledWith({
      child_id: "c1",
      type: "enter",
      method: "qr",
      recorded_by: "u1",
    });
  });

  it("returns DB error when insert fails", async () => {
    mockGetUser.mockResolvedValue({ id: "u1", role: "entrance" });
    makeRecordAttendanceChain({
      child: { id: "c1", name: "太郎", qr_active: true },
      latest: null,
      insertResult: { data: null, error: { message: "DB write failed" } },
    });

    const result = await recordAttendance("GK-TESTCODE");
    expect(result).toMatchObject({
      success: false,
      message: expect.stringContaining("DB write failed"),
    });
  });
});
