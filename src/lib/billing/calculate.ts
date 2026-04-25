import { createClient } from "@/lib/supabase/server";
import type { BillingRule } from "@/app/(dashboard)/billing/types";
import { summarizeBill, type BillCalculationResult } from "./calculate.helpers";

export type { BillCalculationResult } from "./calculate.helpers";

/**
 * 月次請求計算 — 指定した子どもの延長時間と合計金額を計算し monthly_bills へ upsert する。
 * 計算ロジック (JST 換算 / 単位切り上げ / 合計) は calculate.helpers.ts の純粋関数に委譲。
 */
export async function calculateMonthlyBill(
  childId: string,
  yearMonth: string,
): Promise<BillCalculationResult> {
  const supabase = await createClient();

  const [year, month] = yearMonth.split("-").map(Number);
  const lastDayOfMonth = new Date(year, month, 0).toISOString().slice(0, 10);

  const { data: rule } = await supabase.from("billing_rules")
    .select("id, regular_end_time, rate_per_unit, unit_minutes, effective_from, created_at")
    .lte("effective_from", lastDayOfMonth)
    .order("effective_from", { ascending: false })
    .limit(1)
    .single();

  if (!rule) {
    throw new Error("料金ルールが見つかりません");
  }

  const billingRule = rule as BillingRule;

  // 対象月の出退席データを取得 (UTC range for JST month)
  const monthStartUTC = `${yearMonth}-01T00:00:00+09:00`;
  const nextMonth = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthEndUTC = `${nextMonth}-01T00:00:00+09:00`;

  const { data: attendances } = await supabase.from("attendances")
    .select("child_id, type, recorded_at")
    .eq("child_id", childId)
    .gte("recorded_at", monthStartUTC)
    .lt("recorded_at", monthEndUTC);

  const result = summarizeBill(
    (attendances ?? []) as { type: string; recorded_at: string | null }[],
    billingRule,
  );

  await supabase.from("monthly_bills").upsert(
    {
      child_id: childId,
      year_month: yearMonth,
      total_extended_minutes: result.totalExtendedMinutes,
      total_amount: result.totalAmount,
      status: "draft",
    },
    { onConflict: "child_id,year_month" },
  );

  return result;
}
