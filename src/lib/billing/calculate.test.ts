import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase — track from() calls to route to table-specific mocks
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: (...args: unknown[]) => mockFrom(...args),
    }),
  ),
}));

import { calculateMonthlyBill } from "./calculate";

// Helper: billing rule with regular_end_time 18:00, 100 yen per 30 min
const defaultRule = {
  id: "rule-1",
  regular_end_time: "18:00:00",
  rate_per_unit: 100,
  unit_minutes: 30,
  effective_from: "2025-01-01",
  created_at: "2025-01-01T00:00:00Z",
};

/** Build a mock chain for billing_rules that resolves .single() to the given rule */
function billingRulesChain(rule: typeof defaultRule | null) {
  const single = vi.fn().mockResolvedValue({ data: rule, error: null });
  const limit = vi.fn().mockReturnValue({ single });
  const order = vi.fn().mockReturnValue({ limit });
  const lte = vi.fn().mockReturnValue({ order });
  const select = vi.fn().mockReturnValue({ lte });
  return { select, lte, order, limit, single };
}

/** Build a mock chain for attendances that resolves to the given records */
function attendancesChain(records: { child_id: string; type: string; recorded_at: string }[]) {
  const lt = vi.fn().mockResolvedValue({ data: records, error: null });
  const gte = vi.fn().mockReturnValue({ lt });
  const eq = vi.fn().mockReturnValue({ gte });
  const select = vi.fn().mockReturnValue({ eq });
  return { select, eq, gte, lt };
}

/** Build a mock chain for monthly_bills upsert */
function monthlyBillsChain() {
  const upsert = vi.fn().mockResolvedValue({ error: null });
  return { upsert };
}

function setupMocks(
  rule: typeof defaultRule | null,
  records: { child_id: string; type: string; recorded_at: string }[] = [],
) {
  const billsChain = monthlyBillsChain();

  mockFrom.mockImplementation((table: string) => {
    if (table === "billing_rules") return billingRulesChain(rule);
    if (table === "attendances") return attendancesChain(records);
    if (table === "monthly_bills") return billsChain;
    return {};
  });

  return { billsChain };
}

describe("calculateMonthlyBill", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 0 amount when no extended time (退室が通常終了時刻以前)", async () => {
    setupMocks(defaultRule, [
      // exit at 17:30 JST (08:30 UTC) — before regular end 18:00
      { child_id: "child-1", type: "exit", recorded_at: "2025-01-10T08:30:00Z" },
    ]);

    const result = await calculateMonthlyBill("child-1", "2025-01");
    expect(result.totalExtendedMinutes).toBe(0);
    expect(result.totalAmount).toBe(0);
  });

  it("calculates 1 unit for 30 min extended (30分延長 → 1単位 × 単価)", async () => {
    setupMocks(defaultRule, [
      // exit at 18:30 JST (09:30 UTC) — 30 min after 18:00
      { child_id: "child-1", type: "exit", recorded_at: "2025-01-10T09:30:00Z" },
    ]);

    const result = await calculateMonthlyBill("child-1", "2025-01");
    expect(result.totalExtendedMinutes).toBe(30);
    expect(result.totalAmount).toBe(100); // 1 unit × 100
  });

  it("rounds up to next unit for 45 min (45分延長 → ceil(45/30) = 2単位)", async () => {
    setupMocks(defaultRule, [
      // exit at 18:45 JST (09:45 UTC) — 45 min after 18:00
      { child_id: "child-1", type: "exit", recorded_at: "2025-01-10T09:45:00Z" },
    ]);

    const result = await calculateMonthlyBill("child-1", "2025-01");
    expect(result.totalExtendedMinutes).toBe(45);
    expect(result.totalAmount).toBe(200); // ceil(45/30) = 2 units × 100
  });

  it("accumulates extended minutes across multiple days (複数日の合計)", async () => {
    setupMocks(defaultRule, [
      // Day 1: exit at 18:30 JST → 30 min extended
      { child_id: "child-1", type: "exit", recorded_at: "2025-01-10T09:30:00Z" },
      // Day 2: exit at 19:00 JST → 60 min extended
      { child_id: "child-1", type: "exit", recorded_at: "2025-01-11T10:00:00Z" },
      // Day 3: exit at 17:50 JST → 0 min extended (before regular end)
      { child_id: "child-1", type: "exit", recorded_at: "2025-01-12T08:50:00Z" },
    ]);

    const result = await calculateMonthlyBill("child-1", "2025-01");
    expect(result.totalExtendedMinutes).toBe(90); // 30 + 60 + 0
    expect(result.totalAmount).toBe(300); // ceil(90/30) = 3 units × 100
  });

  it("throws error when no billing rule found (料金ルール未設定)", async () => {
    setupMocks(null);

    await expect(calculateMonthlyBill("child-1", "2025-01")).rejects.toThrow(
      "料金ルールが見つかりません",
    );
  });

  it("skips enter-only records (退室記録なしの日はスキップ)", async () => {
    setupMocks(defaultRule, [
      { child_id: "child-1", type: "enter", recorded_at: "2025-01-10T00:00:00Z" },
    ]);

    const result = await calculateMonthlyBill("child-1", "2025-01");
    expect(result.totalExtendedMinutes).toBe(0);
    expect(result.totalAmount).toBe(0);
  });

  it("upserts monthly_bills with draft status", async () => {
    const { billsChain } = setupMocks(defaultRule, [
      { child_id: "child-1", type: "exit", recorded_at: "2025-01-10T09:30:00Z" },
    ]);

    await calculateMonthlyBill("child-1", "2025-01");

    expect(mockFrom).toHaveBeenCalledWith("monthly_bills");
    expect(billsChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        child_id: "child-1",
        year_month: "2025-01",
        total_extended_minutes: 30,
        total_amount: 100,
        status: "draft",
      }),
      expect.objectContaining({ onConflict: "child_id,year_month" }),
    );
  });
});
