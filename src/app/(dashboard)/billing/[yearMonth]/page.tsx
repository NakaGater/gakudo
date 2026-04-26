import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, Badge } from "@/components/ui";
import { getUser } from "@/lib/auth/get-user";
import { isStaff } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import {
  buildDailyBreakdown,
  formatAmount,
  formatDate,
  formatMinutes,
  formatTime,
  type AttendanceRow,
} from "./breakdown";
import { CalculateSingleButton } from "./calculate-single-button";
import { ConfirmButton } from "./confirm-button";
import type { BillingRule } from "../types";

type Props = {
  params: Promise<{ yearMonth: string }>;
  searchParams: Promise<{ child?: string }>;
};

export default async function BillingDetailPage({ params, searchParams }: Props) {
  const { yearMonth } = await params;
  const { child: childId } = await searchParams;
  const user = await getUser();
  const supabase = await createClient();
  const staff = isStaff(user.role);

  if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
    redirect("/billing");
  }

  // Determine child to show
  let targetChildId = childId;
  let childName = "";

  if (!targetChildId) {
    // For parents, default to first child
    if (!staff) {
      const { data } = await supabase
        .from("child_parents")
        .select("child_id, children(id, name)")
        .eq("parent_id", user.id)
        .limit(1);
      const row = (data ?? [])[0] as
        | { child_id: string; children: { id: string; name: string } }
        | undefined;
      if (row) {
        targetChildId = row.children.id;
        childName = row.children.name;
      }
    }
    if (!targetChildId) {
      redirect("/billing");
    }
  } else {
    // Verify access: parents can only see their children
    if (!staff) {
      const { data } = await supabase
        .from("child_parents")
        .select("child_id, children(id, name)")
        .eq("parent_id", user.id)
        .eq("child_id", targetChildId)
        .single();
      if (!data) redirect("/billing");
      childName = (data as { children: { name: string } }).children.name;
    }
  }

  // Get child name for staff
  if (staff && !childName) {
    const { data } = await supabase
      .from("children")
      .select("name")
      .eq("id", targetChildId)
      .single();
    childName = (data as { name: string } | null)?.name ?? "不明";
  }

  // 請求データ・ルール・出退勤を並列取得
  const ymParts = yearMonth.split("-");
  const year = Number(ymParts[0]);
  const month = Number(ymParts[1]);
  const lastDayOfMonth = new Date(year, month, 0).toISOString().slice(0, 10);
  const monthStartUTC = `${yearMonth}-01T00:00:00+09:00`;
  const nextMonth =
    month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthEndUTC = `${nextMonth}-01T00:00:00+09:00`;

  const [{ data: bill }, { data: ruleData }, { data: attendances }] = await Promise.all([
    supabase
      .from("monthly_bills")
      .select("id, child_id, year_month, total_extended_minutes, total_amount, status")
      .eq("child_id", targetChildId)
      .eq("year_month", yearMonth)
      .single(),
    supabase
      .from("billing_rules")
      .select("id, regular_end_time, rate_per_unit, unit_minutes, effective_from, created_at")
      .lte("effective_from", lastDayOfMonth)
      .order("effective_from", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("attendances")
      .select("type, recorded_at")
      .eq("child_id", targetChildId)
      .eq("type", "exit")
      .gte("recorded_at", monthStartUTC)
      .lt("recorded_at", monthEndUTC)
      .order("recorded_at", { ascending: true }),
  ]);

  const monthlyBill = bill as {
    id: string;
    child_id: string;
    year_month: string;
    total_extended_minutes: number;
    total_amount: number;
    status: "draft" | "confirmed";
  } | null;

  const billingRule = ruleData as BillingRule | null;
  const exitRecords = (attendances ?? []) as AttendanceRow[];

  const dailyBreakdown =
    billingRule && exitRecords.length > 0 ? buildDailyBreakdown(exitRecords, billingRule) : [];

  // Summary totals from breakdown
  const totalExtMinutes = dailyBreakdown.reduce((s, d) => s + d.extendedMinutes, 0);
  const totalUnits = dailyBreakdown.reduce((s, d) => s + d.units, 0);
  const totalAmt = dailyBreakdown.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/billing?month=${yearMonth}`}
          className="text-accent hover:text-accent-hv text-sm"
        >
          ← 一覧に戻る
        </Link>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-fg">
          請求詳細 — {childName} ({yearMonth.replace("-", "年")}月)
        </h1>
        {monthlyBill && (
          <Badge variant={monthlyBill.status === "confirmed" ? "success" : "warning"}>
            {monthlyBill.status === "confirmed" ? "確定済" : "下書き"}
          </Badge>
        )}
      </div>

      {/* Empty state: no bill calculated yet */}
      {!monthlyBill && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-fg-muted mb-4">この月の請求はまだ計算されていません</p>
            {staff && <CalculateSingleButton childId={targetChildId} yearMonth={yearMonth} />}
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {monthlyBill && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-fg">サマリー</h2>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-fg-muted">延長時間合計</dt>
                <dd className="font-medium text-fg">
                  {formatMinutes(monthlyBill.total_extended_minutes)}
                </dd>
              </div>
              <div>
                <dt className="text-fg-muted">単位数合計</dt>
                <dd className="font-medium text-fg">{totalUnits}</dd>
              </div>
              <div>
                <dt className="text-fg-muted">金額合計</dt>
                <dd className="font-medium text-fg text-lg">
                  {formatAmount(monthlyBill.total_amount)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Admin: confirm button */}
      {staff && monthlyBill && monthlyBill.status === "draft" && (
        <ConfirmButton billId={monthlyBill.id} />
      )}

      {/* Daily breakdown */}
      {dailyBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-fg">日別内訳</h2>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 font-medium text-fg-muted">日付</th>
                  <th className="px-4 py-3 font-medium text-fg-muted">退室時刻</th>
                  <th className="px-4 py-3 font-medium text-fg-muted">延長時間</th>
                  <th className="px-4 py-3 font-medium text-fg-muted text-right">単位数</th>
                  <th className="px-4 py-3 font-medium text-fg-muted text-right">金額</th>
                </tr>
              </thead>
              <tbody>
                {dailyBreakdown.map((row, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-fg">{formatDate(row.date)}</td>
                    <td className="px-4 py-3 text-fg">{row.exitTime}</td>
                    <td className="px-4 py-3 text-fg">
                      {row.extendedMinutes > 0 ? formatMinutes(row.extendedMinutes) : "—"}
                    </td>
                    <td className="px-4 py-3 text-fg text-right">{row.units}</td>
                    <td className="px-4 py-3 text-fg text-right">{formatAmount(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border font-medium">
                  <td className="px-4 py-3 text-fg" colSpan={2}>
                    合計
                  </td>
                  <td className="px-4 py-3 text-fg">{formatMinutes(totalExtMinutes)}</td>
                  <td className="px-4 py-3 text-fg text-right">{totalUnits}</td>
                  <td className="px-4 py-3 text-fg text-right">{formatAmount(totalAmt)}</td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>
      )}

      {/* No exit records */}
      {monthlyBill && dailyBreakdown.length === 0 && (
        <Card>
          <CardContent>
            <p className="text-fg-muted text-center py-4">この月の退室記録がありません</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
