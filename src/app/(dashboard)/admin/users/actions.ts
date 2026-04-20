"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUser } from "@/lib/auth/get-user";

const VALID_ROLES = ["parent", "teacher", "admin"] as const;
type Role = (typeof VALID_ROLES)[number];

export type ActionState = {
  success: boolean;
  message: string;
} | null;

export async function inviteUser(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getUser();
  if (user.role !== "admin") {
    return { success: false, message: "管理者権限が必要です" };
  }

  const email = formData.get("email");
  const name = formData.get("name");
  const role = formData.get("role");

  if (typeof email !== "string" || !email.trim()) {
    return { success: false, message: "メールアドレスを入力してください" };
  }
  if (typeof name !== "string" || !name.trim()) {
    return { success: false, message: "名前を入力してください" };
  }
  if (typeof role !== "string" || !VALID_ROLES.includes(role as Role)) {
    return { success: false, message: "有効な役割を選択してください" };
  }

  const adminClient = createAdminClient();

  const { data: inviteData, error: inviteError } =
    await adminClient.auth.admin.inviteUserByEmail(email.trim(), {
      data: { name: name.trim(), role },
    });

  if (inviteError) {
    return {
      success: false,
      message: `招待に失敗しました: ${inviteError.message}`,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profileError } = await (adminClient.from("profiles") as any).upsert({
    id: inviteData.user.id,
    email: email.trim(),
    name: name.trim(),
    role,
  });

  if (profileError) {
    return {
      success: false,
      message: `プロフィールの作成に失敗しました: ${profileError.message}`,
    };
  }

  revalidatePath("/admin/users");

  return { success: true, message: "招待メールを送信しました" };
}
