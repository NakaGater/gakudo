"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getString } from "@/lib/validation/form";
import { getRedirectPathForRole } from "./actions.helpers";

export async function login(formData: FormData) {
  // Phase 2-D: getString centralizes the typeof / trim plumbing.
  // Empty values fall through to invalid_credentials below — Supabase
  // will reject the same way a wrong password would, so the user sees
  // one consistent error.
  const emailR = getString(formData, "email", { required: false });
  const passwordR = getString(formData, "password", { required: false, trim: false });
  const email = emailR.ok ? emailR.value : "";
  const password = passwordR.ok ? passwordR.value : "";

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=invalid_credentials");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const role = (profile as { role: string } | null)?.role;
  redirect(getRedirectPathForRole(role));
}
