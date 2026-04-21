import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { Card, CardContent, Badge } from "@/components/ui";
import { MonthSelector } from "./month-selector";
import { CalculateAllButton } from "./calculate-all-button";

type BillRow = {
  id: string;
  child_id: string;
  year_month: string;
  total_extended_minutes: number;
  total_amount: number;
  status: "draft" | "confirmed";
  child_name: string;
};

function isStaff(role: string): boolean {
  return role === "admin" || role === "teacher";
}

function currentYearMonth(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return `${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, "0")}`;
}

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

type Props = {
  searchParams: Promise<{ month?: string }>;
};

export default async function BillingListPage({ searchParams }: Props) {
  const params = await searchParams;
  const user = await getUser();
  const supabase = await createClient();
  const staff = isStaff(user.role);

  const yearMonth = params.month || currentYearMonth();

  // Build child ID list and name map
  let childIds: string[] = [];
  const childNames = new Map<string, string>();

  if (staff) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from("children") as any)
      .select("id, name")
      .order("name");
    for (const c of (data ?? []) as { id: string; name: string }[]) {
      childIds.push(c.id);
      childNames.set(c.id, c.name);
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from("child_parents") as any)
      .select("child_id, children(id, name)")
      .eq("parent_id", user.id);
    for (const row of (data ?? []) as {
      child_id: string;
      children: { id: string; name: string };
    }[]) {
      childIds.push(row.children.id);
      childNames.set(row.children.id, row.children.name);
    }
  }

  // Fetch monthly bills for the selected month
  let bills: BillRow[] = [];
  if (childIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from("monthly_bills") as any)
      .select("id, child_id, year_month, total_extended_minutes, total_amount, status")
      .eq("year_month", yearMonth)
      .order("child_id");

    if (childIds.length === 1) {
      query = query.eq("child_id", childIds[0]);
    } else {
      query = query.in("child_id", childIds);
    }

    const { data } = await query;

    bills = ((data ?? []) as {
      id: string;
      child_id: string;
      year_month: string;
      total_extended_minutes: number;
      total_amount: number;
      status: "draft" | "confirmed";
    }[]).map((b) => ({
      ...b,
      child_name: childNames.get(b.child_id) ?? "不明",
    }));
  }

  // Generate month selector options (current month ± 6 months)
  const monthOptions: string[] = [];
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  for (let offset = -6; offset <= 1; offset++) {
    const d = new Date(jst);
    d.setUTCMonth(d.getUTCMonth() + offset);
    const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    monthOptions.push(ym);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-fg font-story ink-bleed">📒 月次請求一覧</h1>
        {staff && (
          <div className="flex items-center gap-3">
            <Link
              href="/billing/rules"
              className="text-sm text-accent hover:text-accent-hv"
            >
              料金ルール →
            </Link>
          </div>
        )}
      </div>

      {/* Month filter */}
      <Card>
        <CardContent>
          <MonthSelector options={monthOptions} current={yearMonth} />
        </CardContent>
      </Card>

      {/* Admin: Calculate all button */}
      {staff && <CalculateAllButton yearMonth={yearMonth} />}

      {/* Bills table */}
      {bills.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-fg-muted text-center py-4">
              {yearMonth.replace("-", "年")}月の請求データはありません
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <div className="ledger-wrap">
              <Card className="border-0 shadow-none bg-transparent">
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-4 py-3 font-medium text-fg-muted">年月</th>
                      <th className="px-4 py-3 font-medium text-fg-muted">児童名</th>
                      <th className="px-4 py-3 font-medium text-fg-muted">延長時間</th>
                      <th className="px-4 py-3 font-medium text-fg-muted text-right">金額</th>
                      <th className="px-4 py-3 font-medium text-fg-muted">状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((bill) => (
                      <tr key={bill.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 text-fg">
                          {bill.year_month.replace("-", "年")}月
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/billing/${bill.year_month}?child=${bill.child_id}`}
                            className="font-medium text-accent hover:text-accent-hv transition-colors"
                          >
                            {bill.child_name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-fg">
                          {formatMinutes(bill.total_extended_minutes)}
                        </td>
                        <td className="px-4 py-3 text-fg text-right font-medium">
                          {formatAmount(bill.total_amount)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={bill.status === "confirmed" ? "success" : "warning"}>
                            {bill.status === "confirmed" ? "確定済" : "下書き"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            </div>
          </div>

          {/* Mobile card list */}
          <div className="flex flex-col gap-3 md:hidden">
            {bills.map((bill) => (
              <Link
                key={bill.id}
                href={`/billing/${bill.year_month}?child=${bill.child_id}`}
              >
                <Card>
                  <CardContent className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-fg">{bill.child_name}</p>
                      <p className="text-sm text-fg-muted">
                        {formatMinutes(bill.total_extended_minutes)} ・{" "}
                        {formatAmount(bill.total_amount)}
                      </p>
                    </div>
                    <Badge variant={bill.status === "confirmed" ? "success" : "warning"}>
                      {bill.status === "confirmed" ? "確定済" : "下書き"}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
