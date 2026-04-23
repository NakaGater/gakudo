export type BillForCSV = {
  child_name: string;
  year_month: string;
  total_extended_minutes: number;
  total_amount: number;
  status: string;
};

const STATUS_MAP: Record<string, string> = {
  draft: "未確定",
  confirmed: "確定済み",
};

/**
 * 請求データを CSV 文字列に変換する（UTF-8 BOM 付き）
 */
export function generateBillingCSV(bills: BillForCSV[]): string {
  const header = "児童名,対象月,延長時間(分),合計金額,ステータス";
  const rows = bills.map(
    (b) =>
      `${b.child_name},${b.year_month},${b.total_extended_minutes},${b.total_amount},${STATUS_MAP[b.status] ?? b.status}`,
  );
  return "\uFEFF" + [header, ...rows].join("\n") + "\n";
}
