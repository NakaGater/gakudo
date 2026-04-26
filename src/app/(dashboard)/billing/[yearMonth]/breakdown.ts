import { formatTimeJST } from "@/lib/time/jst";
import type { BillingRule } from "../types";

export type AttendanceRow = {
  type: "enter" | "exit";
  recorded_at: string;
};

export type DailyBreakdown = {
  date: string;
  exitTime: string;
  extendedMinutes: number;
  units: number;
  amount: number;
};

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
  }).format(amount);
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

export function formatTime(isoString: string): string {
  return formatTimeJST(isoString);
}

export function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)}`;
}

/**
 * Build the per-day breakdown of extended-care fees from a list of
 * exit records and the active billing rule.
 *
 * Phase 3-B: extracted out of page.tsx so it stays pure and unit-
 * testable. JST conversion happens inline (the records are stored as
 * UTC ISO strings; regular_end_time is in JST clock time).
 */
export function buildDailyBreakdown(
  exitRecords: AttendanceRow[],
  rule: BillingRule,
): DailyBreakdown[] {
  const parts = rule.regular_end_time.split(":");
  const endH = Number(parts[0]);
  const endM = Number(parts[1]);
  const regularEndMinutes = endH * 60 + endM;

  return exitRecords.map((record) => {
    const d = new Date(record.recorded_at);
    const jstOffset = 9 * 60;
    const utcMinutes = d.getUTCHours() * 60 + d.getUTCMinutes();
    const jstMinutes = utcMinutes + jstOffset;
    const jstDate = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const dateStr = `${jstDate.getUTCFullYear()}-${String(jstDate.getUTCMonth() + 1).padStart(2, "0")}-${String(jstDate.getUTCDate()).padStart(2, "0")}`;

    const extended = Math.max(0, jstMinutes - regularEndMinutes);
    const units = extended > 0 ? Math.ceil(extended / rule.unit_minutes) : 0;
    const amount = units * rule.rate_per_unit;

    return {
      date: dateStr,
      exitTime: formatTime(record.recorded_at),
      extendedMinutes: extended,
      units,
      amount,
    };
  });
}
