"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, ActionState } from "@/lib/actions/types";

export async function resetPassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionResult> {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || password.length < 8) {
    return { success: false, message: "パスワードは8文字以上で入力してください" };
  }

  if (password !== confirmPassword) {
    return { success: false, message: "パスワードが一致しません" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { success: false, message: "パスワードの更新に失敗しました。もう一度お試しください。" };
  }

  redirect("/login?message=password_reset_success");
}
