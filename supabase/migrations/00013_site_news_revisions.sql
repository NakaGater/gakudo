-- Edit history for site_news.
--
-- The HP管理 > お知らせ管理 (admin/site/news) screen previously only let
-- admins create and delete entries; once posted there was no way to fix
-- a typo without losing audit trail. This migration adds:
--
--   1. site_news.updated_at / updated_by — tracks the latest edit on
--      the live row. Auto-maintained by a BEFORE UPDATE trigger so the
--      app code only has to set updated_by.
--   2. site_news_revisions — append-only snapshot table written
--      whenever the live row is updated. Captures the title, body, and
--      attachment metadata as it was BEFORE the change so admins can
--      see what each edit replaced.
--
-- The attachment list is denormalized into a JSONB column on the
-- revision so the snapshot keeps showing the file names + sizes that
-- existed at the time of the edit, even after the underlying
-- attachment rows have been deleted from the live table. The actual
-- file objects in storage are removed when an admin deletes the
-- attachment from the live row, so the JSONB metadata is the only
-- record kept (file_path is preserved but signed URLs to it stop
-- working once the storage object is gone — that's an accepted
-- trade-off since the user explicitly chose to remove the file).

ALTER TABLE site_news
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id);

-- Auto-bump updated_at on every UPDATE. Existing rows get NOW() once
-- the trigger first fires; the DEFAULT above seeds them up front so
-- the column is sortable from day one.
CREATE OR REPLACE FUNCTION site_news_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS site_news_set_updated_at_trigger ON site_news;
CREATE TRIGGER site_news_set_updated_at_trigger
  BEFORE UPDATE ON site_news
  FOR EACH ROW
  EXECUTE FUNCTION site_news_set_updated_at();

-- Append-only revision history.
CREATE TABLE IF NOT EXISTS site_news_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES site_news(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  -- Snapshot of attachments at the time of the edit. Shape:
  --   [{ id, file_name, file_path, file_size, mime_type }]
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  edited_by UUID REFERENCES profiles(id),
  edited_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_news_revisions_news_id_idx
  ON site_news_revisions (news_id, edited_at DESC);

-- RLS: revisions are an admin-only audit trail. Public users and
-- non-admin staff have no business reading prior versions of news copy.
ALTER TABLE site_news_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_news_revisions_admin_select"
  ON site_news_revisions FOR SELECT
  TO authenticated
  USING (is_admin());

-- Inserts come exclusively from the updateNews server action which
-- runs with admin auth gated by withAuth + RLS; explicit policy keeps
-- the table append-only from the application side too.
CREATE POLICY "site_news_revisions_admin_insert"
  ON site_news_revisions FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());
