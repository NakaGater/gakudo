import type { BillingRule } from "@/app/(dashboard)/billing/types";

export type BillCalculationResult = {
  totalExtendedMinutes: number;
  totalAmount: number;
};

export type AttendanceRecordLike = {
  type: string;
  recorded_at: string | null;
};

const JST_OFFSET_MINUTES = 9 * 60;

/** "HH:MM[:SS]" → JST midnight からの分数 */
export function parseEndTimeToMinutes(hhmmss: string): number {
  const [h, m] = hhmmss.split(":").map(Number);
  return h * 60 + m;
}

/**
 * UTC ISO timestamp → JST 換算の "UTC 同日 00:00 からの分数"。
 * UTC 23:30 なら 23.5h + 9h = 32.5h → 1950 を返す (1440 を超えうる)。
 * 日跨ぎ退室を「閉所時刻からの累積分数」として扱うための仕様で、
 * これを保つことで `extended = jstMinutes - regularEndMinutes` が
 * 単純な差分として正しく機能する。
 */
export function jstMinutesFromUTC(recordedAtIso: string): number {
  const date = new Date(recordedAtIso);
  const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();
  return utcMinutes + JST_OFFSET_MINUTES;
}

/** 退室時刻と通常終了時刻から延長分 (負値は 0) を返す */
export function calculateExtendedMinutes(
  jstExitMinutes: number,
  regularEndMinutes: number,
): number {
  const extended = jstExitMinutes - regularEndMinutes;
  return extended > 0 ? extended : 0;
}

/**
 * 月内の出退席レコードと料金ルールから合計延長分・合計金額を計算する純粋関数。
 * - "exit" レコードのみを対象とする
 * - 単位 (unit_minutes) で切り上げて課金
 */
export function summarizeBill(
  records: AttendanceRecordLike[],
  rule: BillingRule,
): BillCalculationResult {
  const regularEndMinutes = parseEndTimeToMinutes(rule.regular_end_time);

  const totalExtendedMinutes = records
    .filter((r) => r.type === "exit" && r.recorded_at)
    .reduce((sum, r) => {
      const exitMinutes = jstMinutesFromUTC(r.recorded_at!);
      return sum + calculateExtendedMinutes(exitMinutes, regularEndMinutes);
    }, 0);

  const units = totalExtendedMinutes > 0 ? Math.ceil(totalExtendedMinutes / rule.unit_minutes) : 0;
  const totalAmount = units * rule.rate_per_unit;

  return { totalExtendedMinutes, totalAmount };
}
