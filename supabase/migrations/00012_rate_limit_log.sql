-- ============================================================
-- Phase 2-A.4: Self-hosted rate limit ledger
-- ============================================================
--
-- Stores one row per "hit" for a given key (e.g. an IP address, an
-- email, or a composite of both). Callers count hits within a sliding
-- window via lib/ratelimit/check.ts to decide allow/deny.
--
-- Why a table instead of an external service:
--   - The plan explicitly favors self-hosted over @upstash/ratelimit.
--   - Supabase Postgres is the single source of truth we already trust
--     for everything else; we don't have to deploy or pay for another
--     piece of infra.
--   - Volume is low for the call sites we'll wire up (contact form,
--     password reset). A B-tree on (key, hit_at) handles them comfortably.
--
-- Hygiene:
--   - rate_limit_log_cleanup() drops rows older than 24 hours.
--   - Called best-effort from check.ts on a small percentage of
--     requests so we don't need pg_cron in the dev stack. Production
--     can also schedule it explicitly via Supabase scheduled jobs.

CREATE TABLE IF NOT EXISTS rate_limit_log (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL,
  hit_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_log_key_hit_at
  ON rate_limit_log (key, hit_at DESC);

-- Service-role-only access; this table is internal plumbing and must
-- not be exposed to anon/authenticated traffic via PostgREST.
ALTER TABLE rate_limit_log ENABLE ROW LEVEL SECURITY;

-- No CREATE POLICY → with RLS enabled, only the service-role bypass
-- can read/write. This is intentional.

CREATE OR REPLACE FUNCTION public.rate_limit_log_cleanup()
RETURNS void AS $$
  DELETE FROM rate_limit_log
   WHERE hit_at < now() - INTERVAL '24 hours'
$$ LANGUAGE sql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.rate_limit_log_cleanup() FROM PUBLIC;
