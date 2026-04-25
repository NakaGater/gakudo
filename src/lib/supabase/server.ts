import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireEnv } from "@/lib/env";
import type { Database } from "./types";

/**
 * Server-side Supabase client wired to the request's cookie store.
 * Anon key only — RLS still applies; the cookies provide the
 * authenticated session.
 *
 * Phase 2-F: env keys go through requireEnv so a missing value
 * fails loudly with a consistent message rather than via a non-null
 * assertion that pretends the value exists.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component read-only — ignore
          }
        },
      },
    },
  );
}
