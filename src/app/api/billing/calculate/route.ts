import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { isAdminOrTeacher } from "@/lib/auth/roles";
import { calculateMonthlyBill } from "@/lib/billing/calculate";
import { sanitizeError } from "@/lib/errors/sanitize";

export async function POST(request: Request) {
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

  // リクエストボディ解析
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    console.error("[billing/calculate] Failed to parse request body:", error);
    return NextResponse.json({ error: "リクエストボディが不正です" }, { status: 400 });
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
  const { data: children, error: childrenError } = await supabase.from("children").select("id");

  if (childrenError || !children) {
    return NextResponse.json({ error: "児童データの取得に失敗しました" }, { status: 500 });
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
      return NextResponse.json({ error: sanitizeError(err, "計算エラー") }, { status: 500 });
    }
  }

  return NextResponse.json({
    processed,
    total_amount: totalAmount,
  });
}
