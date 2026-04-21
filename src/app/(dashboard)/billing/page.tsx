import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
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
    <>
      <div className="main__hdr flex-wrap gap-3">
        <h1 className="main__title font-story">💰 月次請求一覧</h1>
        {staff && (
          <div className="flex items-center gap-3">
            <Link
              href="/billing/rules"
              className="text-sm text-cr-orange hover:underline"
            >
              料金ルール →
            </Link>
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl p-4 text-center" style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}>
          <p className="text-2xl font-bold text-ink">{bills.length}</p>
          <p className="text-sm text-ink-mid">対象児童</p>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: "linear-gradient(135deg, #dbeafe, #bfdbfe)" }}>
          <p className="text-2xl font-bold text-ink">{formatMinutes(bills.reduce((s, b) => s + b.total_extended_minutes, 0))}</p>
          <p className="text-sm text-ink-mid">延長合計</p>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: "linear-gradient(135deg, #fce7f3, #fbcfe8)" }}>
          <p className="text-2xl font-bold text-ink">{formatAmount(bills.reduce((s, b) => s + b.total_amount, 0))}</p>
          <p className="text-sm text-ink-mid">合計金額</p>
        </div>
      </div>

      {/* Month filter */}
      <div className="flex items-center gap-3">
        <MonthSelector options={monthOptions} current={yearMonth} />
      </div>

      {/* Admin: Calculate all button */}
      {staff && <CalculateAllButton yearMonth={yearMonth} />}

      {/* Bills table */}
      {bills.length === 0 ? (
        <p className="text-ink-mid text-center py-4">
          {yearMonth.replace("-", "年")}月の請求データはありません
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <div className="ledger-wrap">
              <div className="ledger-stamp" />
              <div className="overflow-x-auto">
                <table className="billing-table w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-4 py-3 font-medium text-ink-mid">年月</th>
                      <th className="px-4 py-3 font-medium text-ink-mid">児童名</th>
                      <th className="px-4 py-3 font-medium text-ink-mid">延長時間</th>
                      <th className="px-4 py-3 font-medium text-ink-mid text-right">金額</th>
                      <th className="px-4 py-3 font-medium text-ink-mid">状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((bill) => (
                      <tr key={bill.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 text-ink">
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
                        <td className="px-4 py-3 text-ink">
                          {formatMinutes(bill.total_extended_minutes)}
                        </td>
                        <td className="px-4 py-3 amt text-right font-medium">
                          {formatAmount(bill.total_amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`status-badge ${bill.status === "confirmed" ? "status-badge--confirmed" : "status-badge--draft"}`}>
                            {bill.status === "confirmed" ? "確定済" : "下書き"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="billing-total">
                合計: {formatAmount(bills.reduce((s, b) => s + b.total_amount, 0))}
              </div>
            </div>
          </div>

          {/* Mobile card list */}
          <div className="flex flex-col gap-3 md:hidden">
            {bills.map((bill) => (
              <Link
                key={bill.id}
                href={`/billing/${bill.year_month}?child=${bill.child_id}`}
              >
                <div className="rounded-lg border border-border p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink">{bill.child_name}</p>
                    <p className="text-sm text-ink-mid">
                      {formatMinutes(bill.total_extended_minutes)} ・{" "}
                      <span className="amt">{formatAmount(bill.total_amount)}</span>
                    </p>
                  </div>
                  <span className={`status-badge ${bill.status === "confirmed" ? "status-badge--confirmed" : "status-badge--draft"}`}>
                    {bill.status === "confirmed" ? "確定済" : "下書き"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
