-- ============================================================
-- お知らせの送信対象（全員／個別ユーザー）
-- ============================================================
--
-- これまで announcements は全認証ユーザーへ一斉公開されていた。
-- 先生・管理者が「全員」または「個別ユーザー」を選んで送れるよう、
-- 対象テーブルを追加する。
--
-- recipient_type:
--   'all'  : 全保護者向け（recipient_user_id は NULL）
--   'user' : 個別ユーザー（recipient_user_id に profiles.id を格納）
--
-- 1つの announcement に対して 'user' 行を複数挿入することで
-- 「保護者A・Bだけ」のような個別宛先を表現できる。
-- 'all' と 'user' の併用は不要なため 'all' は1行に限定する。

CREATE TABLE IF NOT EXISTS announcement_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('all', 'user')),
  recipient_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT announcement_recipients_value_check CHECK (
    (recipient_type = 'all'  AND recipient_user_id IS NULL)
    OR (recipient_type = 'user' AND recipient_user_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_announcement_recipients_announcement
  ON announcement_recipients (announcement_id);

CREATE INDEX IF NOT EXISTS idx_announcement_recipients_user
  ON announcement_recipients (recipient_user_id)
  WHERE recipient_user_id IS NOT NULL;

-- 同一お知らせ内での重複行を防止
CREATE UNIQUE INDEX IF NOT EXISTS uniq_announcement_recipients_all
  ON announcement_recipients (announcement_id)
  WHERE recipient_type = 'all';

CREATE UNIQUE INDEX IF NOT EXISTS uniq_announcement_recipients_user
  ON announcement_recipients (announcement_id, recipient_user_id)
  WHERE recipient_type = 'user';

-- ============================================================
-- 既存お知らせのバックフィル（全件 'all' 扱い）
-- ============================================================
INSERT INTO announcement_recipients (announcement_id, recipient_type)
  SELECT a.id, 'all'
  FROM announcements a
  WHERE NOT EXISTS (
    SELECT 1 FROM announcement_recipients ar WHERE ar.announcement_id = a.id
  );

-- ============================================================
-- 閲覧権限ヘルパー
-- ============================================================
-- announcement_recipients の RLS が announcements の SELECT 内で再帰的に
-- 効くと厄介なので、SECURITY DEFINER の関数で対象判定を一括化する。
CREATE OR REPLACE FUNCTION public.can_view_announcement(p_announcement_id UUID)
RETURNS BOOLEAN AS $$
  SELECT public.is_staff()
    OR EXISTS (
      SELECT 1
      FROM public.announcement_recipients ar
      WHERE ar.announcement_id = p_announcement_id
        AND (
          ar.recipient_type = 'all'
          OR (ar.recipient_type = 'user' AND ar.recipient_user_id = auth.uid())
        )
    )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- announcements の SELECT を「対象判定」ベースに差し替え
-- ============================================================
DROP POLICY IF EXISTS "announcements_select_authenticated" ON announcements;

CREATE POLICY "announcements_select_targeted"
  ON announcements FOR SELECT
  TO authenticated
  USING (public.can_view_announcement(id));

-- ============================================================
-- announcement_recipients の RLS
-- ============================================================
ALTER TABLE announcement_recipients ENABLE ROW LEVEL SECURITY;

-- スタッフは全件、保護者は自分が閲覧可能なお知らせの行だけ閲覧可
CREATE POLICY "announcement_recipients_select"
  ON announcement_recipients FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    OR public.can_view_announcement(announcement_id)
  );

-- 登録・更新・削除はスタッフのみ
CREATE POLICY "announcement_recipients_insert_staff"
  ON announcement_recipients FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff());

CREATE POLICY "announcement_recipients_update_staff"
  ON announcement_recipients FOR UPDATE
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

CREATE POLICY "announcement_recipients_delete_staff"
  ON announcement_recipients FOR DELETE
  TO authenticated
  USING (public.is_staff());
