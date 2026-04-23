const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** Format an ISO timestamp to HH:MM in JST. Returns "—" for null/undefined. */
export function formatTimeJST(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
}

/** Get today's start/end boundaries in JST as ISO strings (UTC). */
export function todayRangeJST(): { start: string; end: string } {
  const now = new Date();
  const jstNow = new Date(now.getTime() + JST_OFFSET_MS);
  const y = jstNow.getUTCFullYear();
  const m = String(jstNow.getUTCMonth() + 1).padStart(2, "0");
  const d = String(jstNow.getUTCDate()).padStart(2, "0");
  const start = new Date(`${y}-${m}-${d}T00:00:00+09:00`).toISOString();
  const startDate = new Date(start);
  const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
  return { start, end: endDate.toISOString() };
}

/** Get current year-month in JST as "YYYY-MM". */
export function currentYearMonthJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + JST_OFFSET_MS);
  return `${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Format a YYYY-MM-DD string in JST as a date part for display. */
export function formatDateJST(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
