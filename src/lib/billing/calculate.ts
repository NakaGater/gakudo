import { createClient } from "@/lib/supabase/server";
import type { BillingRule } from "@/app/(dashboard)/billing/types";

export type BillCalculationResult = {
  totalExtendedMinutes: number;
  totalAmount: number;
};

/**
 * 月次請求計算 — 指定した子どもの延長時間と合計金額を計算し monthly_bills へ upsert する
 */
export async function calculateMonthlyBill(
  childId: string,
  yearMonth: string,
): Promise<BillCalculationResult> {
  const supabase = await createClient();

  // 対象月の最終日を算出して有効な料金ルールを取得
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

  // exit レコードだけを抽出して延長時間を計算
  const exitRecords = (attendances ?? []).filter(
    (a: { type: string }) => a.type === "exit",
  );

  // regular_end_time を分に変換 (例: "18:00:00" → 1080)
  const [endH, endM] = billingRule.regular_end_time.split(":").map(Number);
  const regularEndMinutes = endH * 60 + endM;

  let totalExtendedMinutes = 0;

  for (const record of exitRecords) {
    // recorded_at を JST に変換して時刻部分を取得
    const exitDate = new Date(record.recorded_at);
    const jstOffset = 9 * 60; // JST = UTC+9
    const utcMinutes = exitDate.getUTCHours() * 60 + exitDate.getUTCMinutes();
    const jstMinutes = utcMinutes + jstOffset;

    const extended = jstMinutes - regularEndMinutes;
    if (extended > 0) {
      totalExtendedMinutes += extended;
    }
  }

  // 合計金額を計算 (延長分を単位で切り上げ)
  const units =
    totalExtendedMinutes > 0
      ? Math.ceil(totalExtendedMinutes / billingRule.unit_minutes)
      : 0;
  const totalAmount = units * billingRule.rate_per_unit;

  // monthly_bills へ upsert (child_id + year_month のユニーク制約で更新)
  await supabase.from("monthly_bills").upsert(
    {
      child_id: childId,
      year_month: yearMonth,
      total_extended_minutes: totalExtendedMinutes,
      total_amount: totalAmount,
      status: "draft",
    },
    { onConflict: "child_id,year_month" },
  );

  return { totalExtendedMinutes, totalAmount };
}
