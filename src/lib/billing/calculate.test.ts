import { describe, it, expect, vi, beforeEach } from "vitest";

// I/O 境界 (Supabase) のみモック。請求計算ロジックは calculate.helpers.test.ts でカバー。
const mockFrom = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      from: (...args: unknown[]) => mockFrom(...args),
    }),
  ),
}));

import { calculateMonthlyBill } from "./calculate";

const defaultRule = {
  id: "rule-1",
  regular_end_time: "18:00:00",
  rate_per_unit: 100,
  unit_minutes: 30,
  effective_from: "2025-01-01",
  created_at: "2025-01-01T00:00:00Z",
};

function billingRulesChain(rule: typeof defaultRule | null) {
  return {
    select: vi.fn().mockReturnValue({
      lte: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: rule, error: null }),
          }),
        }),
      }),
    }),
  };
}

function attendancesChain(records: { type: string; recorded_at: string | null }[]) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lt: vi.fn().mockResolvedValue({ data: records, error: null }),
        }),
      }),
    }),
  };
}

describe("calculateMonthlyBill (orchestrator)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when no billing rule is found", async () => {
    mockFrom.mockImplementation((table: string) =>
      table === "billing_rules" ? billingRulesChain(null) : attendancesChain([]),
    );

    await expect(calculateMonthlyBill("child-1", "2025-01")).rejects.toThrow(
      "料金ルールが見つかりません",
    );
  });

  it("upserts monthly_bills with the totals computed by summarizeBill", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === "billing_rules") return billingRulesChain(defaultRule);
      if (table === "attendances") {
        return attendancesChain([
          // 18:30 JST exit → +30 min
          { type: "exit", recorded_at: "2025-01-10T09:30:00Z" },
        ]);
      }
      if (table === "monthly_bills") return { upsert };
      return {};
    });

    const result = await calculateMonthlyBill("child-1", "2025-01");

    expect(result).toEqual({ totalExtendedMinutes: 30, totalAmount: 100 });
    // 境界契約: monthly_bills へ正しい payload で upsert される
    expect(upsert).toHaveBeenCalledWith(
      {
        child_id: "child-1",
        year_month: "2025-01",
        total_extended_minutes: 30,
        total_amount: 100,
        status: "draft",
      },
      { onConflict: "child_id,year_month" },
    );
  });
});
