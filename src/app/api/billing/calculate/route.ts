import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateMonthlyBill } from "@/lib/billing/calculate";

export async function POST(request: Request) {
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

  // リクエストボディ解析
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "リクエストボディが不正です" },
      { status: 400 },
    );
  }

  const yearMonth =
    body && typeof body === "object" && "yearMonth" in body
      ? (body as { yearMonth: unknown }).yearMonth
      : undefined;

  if (typeof yearMonth !== "string" || !/^\d{4}-\d{2}$/.test(yearMonth)) {
    return NextResponse.json(
      { error: "yearMonth は YYYY-MM 形式で指定してください" },
      { status: 400 },
    );
  }

  // 全児童を取得
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: children, error: childrenError } = await (supabase.from("children") as any)
    .select("id");

  if (childrenError || !children) {
    return NextResponse.json(
      { error: "児童データの取得に失敗しました" },
      { status: 500 },
    );
  }

  // 各児童の月次請求を計算
  let processed = 0;
  let totalAmount = 0;

  for (const child of children as { id: string }[]) {
    try {
      const result = await calculateMonthlyBill(child.id, yearMonth);
      totalAmount += result.totalAmount;
      processed++;
    } catch (err) {
      // 料金ルール未設定の場合はエラーを返す
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "計算エラー" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    processed,
    total_amount: totalAmount,
  });
}
