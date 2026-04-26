"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getString } from "@/lib/validation/form";
import type { ActionResult, ActionState } from "@/lib/actions/types";

export async function resetPassword(_prev: ActionState, formData: FormData): Promise<ActionResult> {
  // Phase 2-D: trim:false because trailing whitespace in a password
  // is a deliberate user choice.
  const passwordR = getString(formData, "password", {
    min: 8,
    trim: false,
    message: "パスワードは8文字以上で入力してください",
  });
  if (!passwordR.ok) return { success: false, message: passwordR.error };
  const password = passwordR.value;

  const confirmR = getString(formData, "confirmPassword", { trim: false, required: false });
  const confirmPassword = confirmR.ok ? confirmR.value : "";

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
