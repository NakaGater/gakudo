"use server";

import { createClient } from "@/lib/supabase/server";

export async function exchangeCodeForSession(code: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return { error: error.message };
  }
  return { success: true };
}

export async function setSessionFromTokens(
  accessToken: string,
  refreshToken: string,
) {
  const supabase = await createClient();
  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) {
    return { error: error.message };
  }
  // getUser() を呼んでセッションcookieの書き込みを確実にする
  await supabase.auth.getUser();
  return { success: true };
}
