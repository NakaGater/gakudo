"use server";

import { revalidatePath } from "next/cache";
import { withAuth } from "@/lib/actions/middleware";
import { getUser } from "@/lib/auth/get-user";
import { sanitizeError } from "@/lib/errors/sanitize";
import { createClient } from "@/lib/supabase/server";
import type { BillingRule } from "./types";
import type { ActionResult, ActionState } from "@/lib/actions/types";

type FieldErrors = Record<string, string>;

// Read-only queries: kept on raw getUser() since they return [] / null
// instead of an ActionResult-shaped failure (no withAuth fit).

export async function getActiveBillingRule(): Promise<BillingRule | null> {
  const user = await getUser();
  if (user.role !== "admin") return null;

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("billing_rules")
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

  const { data } = await supabase
    .from("billing_rules")
    .select("id, regular_end_time, rate_per_unit, unit_minutes, effective_from, created_at")
    .order("effective_from", { ascending: false });

  return (data as BillingRule[]) ?? [];
}

// Phase 2-C: write actions migrated to withAuth.

export const createBillingRule = withAuth(
  "admin",
  async ({ user, supabase }, _prev: ActionState, formData: FormData): Promise<ActionResult> => {
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

    const { error } = await supabase.from("billing_rules").insert({
      regular_end_time: (regularEndTime as string).trim(),
      rate_per_unit: Number(ratePerUnit),
      unit_minutes: Number(unitMinutes),
      effective_from: (effectiveFrom as string).trim(),
      created_by: user.id,
    });

    if (error) {
      return { success: false, message: sanitizeError(error, "ルールの作成に失敗しました") };
    }

    revalidatePath("/billing/rules");
    return { success: true, message: "料金ルールを作成しました" };
  },
);

type CalculateAllResult = ActionResult & { processed?: number; totalAmount?: number };

/**
 * 全児童の月次請求を一括計算する (admin/teacher のみ)
 */
export const calculateAllBills = withAuth(
  ["admin", "teacher"],
  async ({ supabase }, yearMonth: string): Promise<CalculateAllResult> => {
    if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
      return { success: false, message: "yearMonth は YYYY-MM 形式で指定してください" };
    }

    const { data: children, error: childrenError } = await supabase.from("children").select("id");

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
        return { success: false, message: sanitizeError(err, "計算エラー") };
      }
    }

    revalidatePath("/billing");
    return {
      success: true,
      message: `${processed}名の月次請求計算が完了しました（合計金額: ¥${totalAmount.toLocaleString()}）`,
      processed,
      totalAmount,
    };
  },
);

/**
 * 請求を確定する (admin/teacher のみ)
 */
export const confirmBill = withAuth(
  ["admin", "teacher"],
  async ({ user, supabase }, billId: string): Promise<ActionResult> => {
    const { error } = await supabase
      .from("monthly_bills")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
        confirmed_by: user.id,
      })
      .eq("id", billId)
      .eq("status", "draft");

    if (error) {
      return { success: false, message: sanitizeError(error, "確定に失敗しました") };
    }

    revalidatePath("/billing");
    return { success: true, message: "請求を確定しました" };
  },
);

type ConfirmAllResult = ActionResult & { confirmed?: number };

/**
 * 対象月の未確定請求をすべて確定する (admin/teacher のみ)
 */
export const confirmAllBills = withAuth(
  ["admin", "teacher"],
  async ({ user, supabase }, yearMonth: string): Promise<ConfirmAllResult> => {
    if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
      return { success: false, message: "yearMonth は YYYY-MM 形式で指定してください" };
    }

    const { data, error } = await supabase
      .from("monthly_bills")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
        confirmed_by: user.id,
      })
      .eq("year_month", yearMonth)
      .eq("status", "draft")
      .select("id");

    if (error) {
      return { success: false, message: sanitizeError(error, "一括確定に失敗しました") };
    }

    const confirmed = (data as { id: string }[] | null)?.length ?? 0;

    revalidatePath("/billing");
    return {
      success: true,
      message: `${confirmed}件の請求を確定しました`,
      confirmed,
    };
  },
);

/**
 * 単一の子供の月次請求を計算する (admin/teacher のみ)
 */
export const calculateSingleBill = withAuth(
  ["admin", "teacher"],
  async (_ctx, childId: string, yearMonth: string): Promise<ActionResult> => {
    if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
      return { success: false, message: "yearMonth は YYYY-MM 形式で指定してください" };
    }

    const { calculateMonthlyBill } = await import("@/lib/billing/calculate");

    try {
      await calculateMonthlyBill(childId, yearMonth);
    } catch (err) {
      return { success: false, message: sanitizeError(err, "計算エラー") };
    }

    revalidatePath("/billing");
    return { success: true, message: "計算が完了しました" };
  },
);
