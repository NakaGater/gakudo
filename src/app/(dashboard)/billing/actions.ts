"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";

type FieldErrors = {
  regular_end_time?: string;
  rate_per_unit?: string;
  unit_minutes?: string;
  effective_from?: string;
};

export type BillingRuleActionState = {
  success: boolean;
  message: string;
  fieldErrors?: FieldErrors;
} | null;

export type BillingRule = {
  id: string;
  regular_end_time: string;
  rate_per_unit: number;
  unit_minutes: number;
  effective_from: string;
  created_at: string;
};

export async function getActiveBillingRule(): Promise<BillingRule | null> {
  const user = await getUser();
  if (user.role !== "admin") return null;

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from("billing_rules") as any)
    .select("id, regular_end_time, rate_per_unit, unit_minutes, effective_from, created_at")
    .lte("effective_from", today)
    .order("effective_from", { ascending: false })
    .limit(1)
    .single();

  return (data as BillingRule) ?? null;
}

export async function getBillingRules(): Promise<BillingRule[]> {
  const user = await getUser();
  if (user.role !== "admin") return [];

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from("billing_rules") as any)
    .select("id, regular_end_time, rate_per_unit, unit_minutes, effective_from, created_at")
    .order("effective_from", { ascending: false });

  return (data as BillingRule[]) ?? [];
}

export async function createBillingRule(
  _prev: BillingRuleActionState,
  formData: FormData,
): Promise<BillingRuleActionState> {
  const user = await getUser();
  if (user.role !== "admin") {
    return { success: false, message: "権限がありません" };
  }

  const regularEndTime = formData.get("regular_end_time");
  const ratePerUnit = formData.get("rate_per_unit");
  const unitMinutes = formData.get("unit_minutes");
  const effectiveFrom = formData.get("effective_from");

  const fieldErrors: FieldErrors = {};

  if (typeof regularEndTime !== "string" || !regularEndTime.trim()) {
    fieldErrors.regular_end_time = "通常終了時刻を入力してください";
  }

  if (typeof ratePerUnit !== "string" || !ratePerUnit.trim() || Number(ratePerUnit) <= 0) {
    fieldErrors.rate_per_unit = "有効な単価を入力してください";
  }

  if (typeof unitMinutes !== "string" || !unitMinutes.trim() || Number(unitMinutes) <= 0) {
    fieldErrors.unit_minutes = "有効な単位時間を入力してください";
  }

  if (typeof effectiveFrom !== "string" || !effectiveFrom.trim()) {
    fieldErrors.effective_from = "適用開始日を入力してください";
  }

  if (
    fieldErrors.regular_end_time ||
    fieldErrors.rate_per_unit ||
    fieldErrors.unit_minutes ||
    fieldErrors.effective_from
  ) {
    return { success: false, message: "入力内容を確認してください", fieldErrors };
  }

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("billing_rules") as any).insert({
    regular_end_time: (regularEndTime as string).trim(),
    rate_per_unit: Number(ratePerUnit),
    unit_minutes: Number(unitMinutes),
    effective_from: (effectiveFrom as string).trim(),
    created_by: user.id,
  });

  if (error) {
    return { success: false, message: `ルールの作成に失敗しました: ${error.message}` };
  }

  revalidatePath("/billing/rules");
  return { success: true, message: "料金ルールを作成しました" };
}

/**
 * 全児童の月次請求を一括計算する (admin/teacher のみ)
 */
export async function calculateAllBills(
  yearMonth: string,
): Promise<{ success: boolean; message: string; processed?: number; totalAmount?: number }> {
  const user = await getUser();
  if (user.role !== "admin" && user.role !== "teacher") {
    return { success: false, message: "権限がありません" };
  }

  if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
    return { success: false, message: "yearMonth は YYYY-MM 形式で指定してください" };
  }

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: children, error: childrenError } = await (supabase.from("children") as any)
    .select("id");

  if (childrenError || !children) {
    return { success: false, message: "児童データの取得に失敗しました" };
  }

  const { calculateMonthlyBill } = await import("@/lib/billing/calculate");

  let processed = 0;
  let totalAmount = 0;

  for (const child of children as { id: string }[]) {
    try {
      const result = await calculateMonthlyBill(child.id, yearMonth);
      totalAmount += result.totalAmount;
      processed++;
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "計算エラー",
      };
    }
  }

  revalidatePath("/billing");
  return {
    success: true,
    message: `${processed}名の月次請求計算が完了しました（合計金額: ¥${totalAmount.toLocaleString()}）`,
    processed,
    totalAmount,
  };
}

/**
 * 請求を確定する (admin/teacher のみ)
 */
export async function confirmBill(
  billId: string,
): Promise<{ success: boolean; message: string }> {
  const user = await getUser();
  if (user.role !== "admin" && user.role !== "teacher") {
    return { success: false, message: "権限がありません" };
  }

  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("monthly_bills") as any)
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      confirmed_by: user.id,
    })
    .eq("id", billId)
    .eq("status", "draft");

  if (error) {
    return { success: false, message: `確定に失敗しました: ${error.message}` };
  }

  revalidatePath("/billing");
  return { success: true, message: "請求を確定しました" };
}

/**
 * 単一の子供の月次請求を計算する (admin/teacher のみ)
 */
export async function calculateSingleBill(
  childId: string,
  yearMonth: string,
): Promise<{ success: boolean; message: string }> {
  const user = await getUser();
  if (user.role !== "admin" && user.role !== "teacher") {
    return { success: false, message: "権限がありません" };
  }

  if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
    return { success: false, message: "yearMonth は YYYY-MM 形式で指定してください" };
  }

  const { calculateMonthlyBill } = await import("@/lib/billing/calculate");

  try {
    await calculateMonthlyBill(childId, yearMonth);
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "計算エラー",
    };
  }

  revalidatePath("/billing");
  return { success: true, message: "計算が完了しました" };
}
