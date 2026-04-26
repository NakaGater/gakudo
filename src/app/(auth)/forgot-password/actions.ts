"use server";

import { createClient } from "@/lib/supabase/server";
import { getString } from "@/lib/validation/form";
import type { ActionResult, ActionState } from "@/lib/actions/types";

export async function forgotPassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionResult> {
  // Phase 2-D: existing tests assert the exact wording, so the
  // helper's `message` option preserves it verbatim.
  const emailR = getString(formData, "email", {
    message: "メールアドレスを入力してください",
  });
  if (!emailR.ok) return { success: false, message: emailR.error };
  const email = emailR.value;

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000"}/auth/callback`,
  });

  if (error) {
    return {
      success: false,
      message: "リセットメールの送信に失敗しました。もう一度お試しください。",
    };
  }

  return { success: true, message: "リセットメールを送信しました" };
}
