import { createAdminClient } from "@/lib/supabase/admin";

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number; limit: number; windowMs: number };

// Until `npm run db:types` regenerates the Supabase Database type to
// include the migration-added rate_limit_log table and
// rate_limit_log_cleanup RPC, surface them through a narrow local
// type. Once types.ts is regenerated this cast can be removed; the
// shape is identical to what gen-types will produce.
type RateLimitLogClient = {
  from(table: "rate_limit_log"): {
    insert(value: { key: string }): Promise<{ error: { message: string } | null }>;
    select(
      columns: string,
      opts?: { count?: "exact" | "planned" | "estimated" },
    ): {
      eq(
        column: "key",
        value: string,
      ): {
        gte(
          column: "hit_at",
          value: string,
        ): {
          order(
            column: "hit_at",
            opts: { ascending: boolean },
          ): {
            limit(n: number): Promise<{
              data: Array<{ hit_at: string }> | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
    };
  };
  rpc(name: "rate_limit_log_cleanup"): Promise<{ error: { message: string } | null }>;
};

/**
 * Sliding-window rate limit backed by the rate_limit_log table.
 *
 * Returns ok=true when the caller may proceed; otherwise returns
 * retryAfterSeconds (best estimate; never negative) so the caller can
 * surface a useful 429 / form error.
 *
 * Notes:
 * - Uses the admin (service-role) client because rate_limit_log has
 *   RLS enabled with no policies — only the service role can touch it.
 * - Records the current hit *before* counting so concurrent callers
 *   converge on the same view. There is a benign race where two
 *   simultaneous requests can both observe count == max-1 and both
 *   succeed; for the call sites we use it on (contact form, password
 *   reset) this is acceptable.
 * - Best-effort cleanup of >24h-old rows runs on ~1% of calls so we
 *   don't need pg_cron in the dev stack.
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const admin = createAdminClient() as unknown as RateLimitLogClient;
  const windowStart = new Date(Date.now() - windowMs).toISOString();

  // Insert this hit. We insert first so concurrent callers see each
  // other's contributions; counting a stale window then writing would
  // open a tighter race.
  const { error: insertError } = await admin.from("rate_limit_log").insert({ key });
  if (insertError) {
    // Fail open: if the ledger is unreachable we'd rather let the user
    // through than turn an availability blip into a denial of service.
    // The admin's audit log will surface the problem.
    console.error("[ratelimit] insert failed, failing open:", insertError.message);
    return { ok: true };
  }

  const { data, error: countError } = await admin
    .from("rate_limit_log")
    .select("hit_at", { count: "exact" })
    .eq("key", key)
    .gte("hit_at", windowStart)
    .order("hit_at", { ascending: true })
    .limit(max + 1);

  if (countError || !data) {
    console.error("[ratelimit] count failed, failing open:", countError?.message);
    return { ok: true };
  }

  // Probabilistic cleanup so the table doesn't grow unbounded in dev.
  if (Math.random() < 0.01) {
    void admin.rpc("rate_limit_log_cleanup").then(({ error }) => {
      if (error) console.error("[ratelimit] cleanup failed:", error.message);
    });
  }

  if (data.length <= max) {
    return { ok: true };
  }

  // Oldest hit in the window dictates how soon we can let the next one
  // in: retry once `windowMs` has elapsed since that hit.
  const oldestIso = (data[0] as { hit_at: string }).hit_at;
  const retryAfterMs = Math.max(0, new Date(oldestIso).getTime() + windowMs - Date.now());
  return {
    ok: false,
    retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    limit: max,
    windowMs,
  };
}
