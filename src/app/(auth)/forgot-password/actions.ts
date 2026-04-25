"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult, ActionState } from "@/lib/actions/types";

export async function forgotPassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionResult> {
  const email = formData.get("email") as string;

  if (!email) {
    return { success: false, message: "メールアドレスを入力してください" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000"}/auth/callback`,
  });

  if (error) {
    return { success: false, message: "リセットメールの送信に失敗しました。もう一度お試しください。" };
  }

  return { success: true, message: "リセットメールを送信しました" };
}
