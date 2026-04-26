"use server";

import { sanitizeError } from "@/lib/errors/sanitize";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/types";

export async function exchangeCodeForSession(code: string): Promise<NonNullable<ActionState>> {
  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return { success: false, message: sanitizeError(error, "セッションの確立に失敗しました") };
  }
  return { success: true, message: "" };
}

export async function setSessionFromTokens(
  accessToken: string,
  refreshToken: string,
): Promise<NonNullable<ActionState>> {
  const supabase = await createClient();
  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) {
    return { success: false, message: sanitizeError(error, "セッションの確立に失敗しました") };
  }
  // getUser() を呼んでセッションcookieの書き込みを確実にする
  await supabase.auth.getUser();
  return { success: true, message: "" };
}
