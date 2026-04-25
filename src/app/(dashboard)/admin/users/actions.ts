"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth/get-user";
import { sanitizeError } from "@/lib/errors/sanitize";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActionResult, ActionState } from "@/lib/actions/types";

const VALID_ROLES = ["parent", "teacher", "admin", "entrance"] as const;
type Role = (typeof VALID_ROLES)[number];

export async function inviteUser(_prev: ActionState, formData: FormData): Promise<ActionResult> {
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

  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    email.trim(),
    {
      data: { name: name.trim(), role },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000"}/auth/callback?type=invite`,
    },
  );

  if (inviteError) {
    return {
      success: false,
      message: sanitizeError(inviteError, "招待に失敗しました"),
    };
  }

  const { error: profileError } = await adminClient.from("profiles").upsert({
    id: inviteData.user.id,
    email: email.trim(),
    name: name.trim(),
    role: role as Role,
  });

  if (profileError) {
    return {
      success: false,
      message: sanitizeError(profileError, "プロフィールの作成に失敗しました"),
    };
  }

  revalidatePath("/admin/users");

  return { success: true, message: "招待メールを送信しました" };
}

export async function updateUser(_prev: ActionState, formData: FormData): Promise<ActionResult> {
  const user = await getUser();
  if (user.role !== "admin") {
    return { success: false, message: "管理者権限が必要です" };
  }

  const targetId = formData.get("id");
  const name = formData.get("name");
  const role = formData.get("role");

  if (typeof targetId !== "string" || !targetId.trim()) {
    return { success: false, message: "ユーザーIDが不正です" };
  }
  if (typeof name !== "string" || !name.trim()) {
    return { success: false, message: "名前を入力してください" };
  }
  if (typeof role !== "string" || !VALID_ROLES.includes(role as Role)) {
    return { success: false, message: "有効な役割を選択してください" };
  }

  if (targetId === user.id) {
    return { success: false, message: "自分自身の役割は変更できません" };
  }

  const adminClient = createAdminClient();

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({ name: name.trim(), role: role as Role })
    .eq("id", targetId);

  if (profileError) {
    return {
      success: false,
      message: sanitizeError(profileError, "更新に失敗しました"),
    };
  }

  const { error: authError } = await adminClient.auth.admin.updateUserById(targetId, {
    user_metadata: { name: name.trim(), role },
  });

  if (authError) {
    return {
      success: false,
      message: sanitizeError(authError, "Auth更新に失敗しました"),
    };
  }

  revalidatePath("/admin/users");
  return { success: true, message: "ユーザー情報を更新しました" };
}

export async function deleteUser(_prev: ActionState, formData: FormData): Promise<ActionResult> {
  const user = await getUser();
  if (user.role !== "admin") {
    return { success: false, message: "管理者権限が必要です" };
  }

  const targetId = formData.get("id");
  if (typeof targetId !== "string" || !targetId.trim()) {
    return { success: false, message: "ユーザーIDが不正です" };
  }

  if (targetId === user.id) {
    return { success: false, message: "自分自身は削除できません" };
  }

  const adminClient = createAdminClient();

  const { error: profileError } = await adminClient.from("profiles").delete().eq("id", targetId);

  if (profileError) {
    return {
      success: false,
      message: sanitizeError(profileError, "プロフィール削除に失敗しました"),
    };
  }

  const { error: authError } = await adminClient.auth.admin.deleteUser(targetId);

  if (authError) {
    return {
      success: false,
      message: sanitizeError(authError, "Auth削除に失敗しました"),
    };
  }

  revalidatePath("/admin/users");
  return { success: true, message: "ユーザーを削除しました" };
}
