import { beforeEach, describe, expect, it, vi } from "vitest";

// I/O 境界 (Supabase) のみモック。請求計算ロジックは calculate.helpers.test.ts でカバー。
const controller = vi.hoisted(() => ({
  rule: null as null | {
    id: string;
    regular_end_time: string;
    rate_per_unit: number;
    unit_minutes: number;
    effective_from: string;
    created_at: string;
  },
  attendances: [] as { type: string; recorded_at: string | null }[],
}));

vi.mock("@/lib/supabase/server", async () => {
  const { createSupabaseMock } = await import("@/test/supabase-mock-factory");
  return {
    createClient: () => {
      const { client, spies } = createSupabaseMock({
        tableResolver: (table: string) => {
          if (table === "billing_rules") return { data: controller.rule, error: null };
          if (table === "attendances") return { data: controller.attendances, error: null };
          return undefined;
        },
      });
      // Tests inspect monthly_bills upsert payloads via spies.mutations.
      lastSpies = spies;
      return Promise.resolve(client);
    },
  };
});

// Tests reach into this through the mock factory above.
let lastSpies: { mutations: Array<{ table: string; op: string; payload: unknown }> };

import { calculateMonthlyBill } from "./calculate";

const defaultRule = {
  id: "rule-1",
  regular_end_time: "18:00:00",
  rate_per_unit: 100,
  unit_minutes: 30,
  effective_from: "2025-01-01",
  created_at: "2025-01-01T00:00:00Z",
};

describe("calculateMonthlyBill (orchestrator)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    controller.rule = null;
    controller.attendances = [];
  });

  it("throws when no billing rule is found", async () => {
    controller.attendances = [];
    await expect(calculateMonthlyBill("child-1", "2025-01")).rejects.toThrow(
      "料金ルールが見つかりません",
    );
  });

  it("upserts monthly_bills with the totals computed by summarizeBill", async () => {
    controller.rule = defaultRule;
    controller.attendances = [
      // 18:30 JST exit → +30 min
      { type: "exit", recorded_at: "2025-01-10T09:30:00Z" },
    ];

    const result = await calculateMonthlyBill("child-1", "2025-01");

    expect(result).toEqual({ totalExtendedMinutes: 30, totalAmount: 100 });
    // 境界契約: monthly_bills へ正しい payload で upsert される
    expect(lastSpies.mutations).toContainEqual({
      table: "monthly_bills",
      op: "upsert",
      payload: {
        child_id: "child-1",
        year_month: "2025-01",
        total_extended_minutes: 30,
        total_amount: 100,
        status: "draft",
      },
      options: { onConflict: "child_id,year_month" },
    });
  });
});
