import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api/auth";
import { sanitizeError } from "@/lib/errors/sanitize";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_ROLES = ["parent", "teacher", "admin"] as const;
type Role = (typeof VALID_ROLES)[number];

function isValidRole(value: unknown): value is Role {
  return typeof value === "string" && VALID_ROLES.includes(value as Role);
}

export const POST = withApiAuth("admin", async (_ctx, request: Request) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    console.error("[auth/invite] Failed to parse request body:", error);
    return NextResponse.json({ error: "リクエストボディが不正です" }, { status: 400 });
  }

  const { email, name, role } = body as Record<string, unknown>;

  if (typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ error: "メールアドレスを入力してください" }, { status: 400 });
  }
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "名前を入力してください" }, { status: 400 });
  }
  if (!isValidRole(role)) {
    return NextResponse.json({ error: "有効な役割を選択してください" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    email.trim(),
    {
      data: { name: name.trim(), role },
    },
  );

  if (inviteError) {
    return NextResponse.json(
      { error: sanitizeError(inviteError, "招待に失敗しました") },
      { status: 400 },
    );
  }

  const { error: profileError } = await adminClient.from("profiles").upsert({
    id: inviteData.user.id,
    email: email.trim(),
    name: name.trim(),
    role,
  });

  if (profileError) {
    return NextResponse.json(
      { error: sanitizeError(profileError, "プロフィールの作成に失敗しました") },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: "招待メールを送信しました" }, { status: 201 });
});
