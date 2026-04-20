"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    redirect("/login?error=invalid_credentials");
  }

  // ロールに応じてリダイレクト先を変更
  const { data: profile } = await (supabase
    .from("profiles") as any)
    .select("role")
    .eq("id", data.user.id)
    .single();

  const role = (profile as { role: string } | null)?.role;
  if (role === "admin" || role === "teacher") {
    redirect("/attendance/dashboard");
  } else {
    redirect("/announcements");
  }
}
