import { createBrowserClient } from "@supabase/ssr";
import { requireEnv } from "@/lib/env";
import type { Database } from "./types";

/**
 * Browser-side Supabase client. Anon key only; RLS protects access.
 * Phase 2-F: env keys flow through requireEnv() so a missing value
 * fails loudly with a single consistent message.
 */
export function createClient() {
  return createBrowserClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}
