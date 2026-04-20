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
