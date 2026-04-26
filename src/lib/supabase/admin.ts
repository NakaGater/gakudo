import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";
import type { Database } from "./types";

/**
 * Service-role Supabase client. Bypasses RLS — use only in server
 * code that has authenticated/authorized the caller via withAuth or
 * withApiAuth (Phase 2-C / 2-E). Never import this from client code.
 */
export function createAdminClient() {
  return createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY", "service role"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
