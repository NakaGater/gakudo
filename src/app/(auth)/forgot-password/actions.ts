"use server";

import { createClient } from "@/lib/supabase/server";

export type ForgotPasswordState = {
  success?: boolean;
  error?: string;
};

export async function forgotPassword(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "メールアドレスを入力してください" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  if (error) {
    return { error: "リセットメールの送信に失敗しました。もう一度お試しください。" };
  }

  return { success: true };
}
