import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { isAdminOrTeacher } from "@/lib/auth/roles";
import { generateBillingCSV } from "@/lib/billing/csv";
import { sanitizeError } from "@/lib/errors/sanitize";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  // 権限チェック (admin/teacher のみ)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !isAdminOrTeacher(profile.role)) {
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
  const { data: bills, error: billsError } = await supabase
    .from("monthly_bills")
    .select("total_extended_minutes, total_amount, status, year_month, children(name)")
    .eq("year_month", yearMonth);

  if (billsError) {
    return NextResponse.json(
      { error: sanitizeError(billsError, "データ取得に失敗しました") },
      { status: 500 },
    );
  }

  const rows = (bills ?? []).map((b: Record<string, unknown>) => ({
    child_name: (b.children as { name: string } | null)?.name ?? "",
    year_month: b.year_month as string,
    total_extended_minutes: b.total_extended_minutes as number,
    total_amount: b.total_amount as number,
    status: b.status as string,
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
