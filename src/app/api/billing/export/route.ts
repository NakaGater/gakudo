import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateBillingCSV } from "@/lib/billing/csv";

export async function GET(request: Request) {
  const supabase = await createClient();

  // 認証チェック
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  // 権限チェック (admin/teacher のみ)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from("profiles") as any)
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "teacher")) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  // クエリパラメータ取得
  const { searchParams } = new URL(request.url);
  const yearMonth = searchParams.get("yearMonth");

  if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
    return NextResponse.json(
      { error: "yearMonth は YYYY-MM 形式で指定してください" },
      { status: 400 },
    );
  }

  // monthly_bills を children と結合して取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bills, error: billsError } = await (supabase.from("monthly_bills") as any)
    .select("total_extended_minutes, total_amount, status, year_month, children(name)")
    .eq("year_month", yearMonth);

  if (billsError) {
    return NextResponse.json(
      { error: `データ取得に失敗しました: ${billsError.message}` },
      { status: 500 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = ((bills ?? []) as any[]).map((b) => ({
    child_name: b.children?.name ?? "",
    year_month: b.year_month,
    total_extended_minutes: b.total_extended_minutes,
    total_amount: b.total_amount,
    status: b.status,
  }));

  const csv = generateBillingCSV(rows);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gakudo-billing-${yearMonth}.csv"`,
    },
  });
}
