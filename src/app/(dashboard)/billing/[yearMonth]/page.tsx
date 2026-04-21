import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { isStaff } from "@/lib/auth/roles";
import { Card, CardContent, CardHeader, Badge } from "@/components/ui";
import { ConfirmButton } from "./confirm-button";
import { CalculateSingleButton } from "./calculate-single-button";
import type { BillingRule } from "../actions";

type AttendanceRow = {
  type: "enter" | "exit";
  recorded_at: string;
};

type DailyBreakdown = {
  date: string;
  exitTime: string;
  extendedMinutes: number;
  units: number;
  amount: number;
};

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
  }).format(amount);
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return `${String(jst.getUTCHours()).padStart(2, "0")}:${String(jst.getUTCMinutes()).padStart(2, "0")}`;
}

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)}`;
}

/**
 * Build daily breakdown from exit records + billing rule
 */
function buildDailyBreakdown(
  exitRecords: AttendanceRow[],
  rule: BillingRule,
): DailyBreakdown[] {
  const [endH, endM] = rule.regular_end_time.split(":").map(Number);
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from("child_parents") as any)
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from("child_parents") as any)
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from("children") as any)
      .select("name")
      .eq("id", targetChildId)
      .single();
    childName = (data as { name: string } | null)?.name ?? "不明";
  }

  // Fetch monthly bill
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bill } = await (supabase.from("monthly_bills") as any)
    .select("id, child_id, year_month, total_extended_minutes, total_amount, status")
    .eq("child_id", targetChildId)
    .eq("year_month", yearMonth)
    .single();

  const monthlyBill = bill as {
    id: string;
    child_id: string;
    year_month: string;
    total_extended_minutes: number;
    total_amount: number;
    status: "draft" | "confirmed";
  } | null;

  // Fetch billing rule for breakdown calculation
  const [year, month] = yearMonth.split("-").map(Number);
  const lastDayOfMonth = new Date(year, month, 0).toISOString().slice(0, 10);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ruleData } = await (supabase.from("billing_rules") as any)
    .select("id, regular_end_time, rate_per_unit, unit_minutes, effective_from, created_at")
    .lte("effective_from", lastDayOfMonth)
    .order("effective_from", { ascending: false })
    .limit(1)
    .single();

  const billingRule = ruleData as BillingRule | null;

  // Fetch exit records for daily breakdown
  const monthStartUTC = `${yearMonth}-01T00:00:00+09:00`;
  const nextMonth =
    month === 12
      ? `${year + 1}-01`
      : `${year}-${String(month + 1).padStart(2, "0")}`;
  const monthEndUTC = `${nextMonth}-01T00:00:00+09:00`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: attendances } = await (supabase.from("attendances") as any)
    .select("type, recorded_at")
    .eq("child_id", targetChildId)
    .eq("type", "exit")
    .gte("recorded_at", monthStartUTC)
    .lt("recorded_at", monthEndUTC)
    .order("recorded_at", { ascending: true });

  const exitRecords = (attendances ?? []) as AttendanceRow[];

  const dailyBreakdown =
    billingRule && exitRecords.length > 0
      ? buildDailyBreakdown(exitRecords, billingRule)
      : [];

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
            <p className="text-fg-muted mb-4">
              この月の請求はまだ計算されていません
            </p>
            {staff && (
              <CalculateSingleButton
                childId={targetChildId}
                yearMonth={yearMonth}
              />
            )}
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
                  <tr
                    key={i}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 text-fg">{formatDate(row.date)}</td>
                    <td className="px-4 py-3 text-fg">{row.exitTime}</td>
                    <td className="px-4 py-3 text-fg">
                      {row.extendedMinutes > 0
                        ? formatMinutes(row.extendedMinutes)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-fg text-right">{row.units}</td>
                    <td className="px-4 py-3 text-fg text-right">
                      {formatAmount(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border font-medium">
                  <td className="px-4 py-3 text-fg" colSpan={2}>
                    合計
                  </td>
                  <td className="px-4 py-3 text-fg">
                    {formatMinutes(totalExtMinutes)}
                  </td>
                  <td className="px-4 py-3 text-fg text-right">{totalUnits}</td>
                  <td className="px-4 py-3 text-fg text-right">
                    {formatAmount(totalAmt)}
                  </td>
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
            <p className="text-fg-muted text-center py-4">
              この月の退室記録がありません
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
