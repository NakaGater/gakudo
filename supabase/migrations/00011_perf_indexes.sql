-- ============================================================
-- Phase 1-C: Performance indexes for hot lookup paths
-- ============================================================
--
-- Plain CREATE INDEX (not CONCURRENTLY) because Supabase migrations
-- run inside a transaction. For production rollout on a hot table,
-- run an ad-hoc CREATE INDEX CONCURRENTLY first, then this migration
-- becomes a no-op via IF NOT EXISTS.
--
-- Coverage rationale:
--
-- 1. child_parents(parent_id)
--    Backed query: src/lib/announcements/recipients-server.ts
--      .from("child_parents").select(...).in("parent_id", ids)
--    The PRIMARY KEY is (child_id, parent_id) so parent_id alone is
--    not indexable via the PK. Without this, IN-list lookups scan.
--
-- 2. push_subscriptions(user_id)
--    Backed query: src/lib/notifications/send.ts (sendPushNotifications)
--      .from("push_subscriptions").select(...).in("user_id", userIds)
--    Currently no user_id index — every fan-out scans the whole table.
--    With Phase 1-A's parallel push, this scan would be the new
--    bottleneck.
--
-- 3. monthly_bills(year_month, status)
--    Backed queries: src/app/(dashboard)/billing/actions.ts
--      .eq("year_month", ym).eq("status", "draft")
--    UNIQUE (child_id, year_month) covers (year_month) only as the
--    second column. Composite (year_month, status) speeds the
--    confirm/list flow.
--
-- 4. announcement_reads(user_id)
--    Backed query: src/components/nav/get-badge-counts.ts (unread)
--    Plus exists() lookups for unread badges.
--    PRIMARY KEY is (announcement_id, user_id) so user_id alone is
--    not indexable from the PK; this index covers per-user lookups.
--
-- Skipped (already covered):
--   - inquiries(status): created in 00007_inquiries.sql
--   - attendances(child_id, recorded_at): created in
--     00001_initial_schema.sql (the asc index also serves desc scans).
--   - announcement_recipients(*): created in
--     00010_announcement_recipients.sql.

CREATE INDEX IF NOT EXISTS idx_child_parents_parent
  ON child_parents (parent_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user
  ON push_subscriptions (user_id);

CREATE INDEX IF NOT EXISTS idx_monthly_bills_yearmonth_status
  ON monthly_bills (year_month, status);

CREATE INDEX IF NOT EXISTS idx_announcement_reads_user
  ON announcement_reads (user_id);
