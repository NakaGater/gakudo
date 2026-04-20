-- ============================================================
-- Row Level Security ポリシー
-- ============================================================

-- ============================================================
-- ヘルパー関数
-- ============================================================

-- ユーザーロール取得
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 管理者判定
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- スタッフ判定（教員または管理者）
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 全テーブル RLS 有効化
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- profiles（プロフィール）
-- ============================================================

-- 認証済みユーザーは全プロフィールを閲覧可能（名前表示等に必要）
CREATE POLICY "profiles_select_authenticated"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- 挿入はトリガーまたは管理者（service role）のみ
-- RLS ポリシーなし = デフォルト拒否

-- 自分のプロフィールを更新可能、管理者は全員分を更新可能
CREATE POLICY "profiles_update_own_or_admin"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR is_admin())
  WITH CHECK (id = auth.uid() OR is_admin());

-- ============================================================
-- children（児童）
-- ============================================================

-- スタッフは全児童を閲覧可能、保護者は自分の子どものみ
CREATE POLICY "children_select"
  ON children FOR SELECT
  TO authenticated
  USING (
    is_staff()
    OR id IN (SELECT child_id FROM child_parents WHERE parent_id = auth.uid())
  );

-- 登録・更新・削除はスタッフのみ
CREATE POLICY "children_insert_staff"
  ON children FOR INSERT
  TO authenticated
  WITH CHECK (is_staff());

CREATE POLICY "children_update_staff"
  ON children FOR UPDATE
  TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff());

CREATE POLICY "children_delete_staff"
  ON children FOR DELETE
  TO authenticated
  USING (is_staff());

-- ============================================================
-- child_parents（児童と保護者のリレーション）
-- ============================================================

-- スタッフは全件閲覧可能、保護者は自分の行のみ
CREATE POLICY "child_parents_select"
  ON child_parents FOR SELECT
  TO authenticated
  USING (
    is_staff()
    OR parent_id = auth.uid()
  );

-- 登録・削除はスタッフのみ
CREATE POLICY "child_parents_insert_staff"
  ON child_parents FOR INSERT
  TO authenticated
  WITH CHECK (is_staff());

CREATE POLICY "child_parents_delete_staff"
  ON child_parents FOR DELETE
  TO authenticated
  USING (is_staff());

-- ============================================================
-- attendances（入退室記録）
-- ============================================================

-- スタッフは全件閲覧可能、保護者は自分の子どもの記録のみ
CREATE POLICY "attendances_select"
  ON attendances FOR SELECT
  TO authenticated
  USING (
    is_staff()
    OR child_id IN (SELECT child_id FROM child_parents WHERE parent_id = auth.uid())
  );

-- 登録はスタッフのみ（教員・管理者が記録）
CREATE POLICY "attendances_insert_staff"
  ON attendances FOR INSERT
  TO authenticated
  WITH CHECK (is_staff());

-- 更新・削除は管理者のみ
CREATE POLICY "attendances_update_admin"
  ON attendances FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "attendances_delete_admin"
  ON attendances FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================
-- announcements（お知らせ）
-- ============================================================

-- 認証済みユーザーは全件閲覧可能
CREATE POLICY "announcements_select_authenticated"
  ON announcements FOR SELECT
  TO authenticated
  USING (true);

-- 投稿はスタッフのみ
CREATE POLICY "announcements_insert_staff"
  ON announcements FOR INSERT
  TO authenticated
  WITH CHECK (is_staff());

-- 更新は管理者または投稿者本人（スタッフに限る）
CREATE POLICY "announcements_update"
  ON announcements FOR UPDATE
  TO authenticated
  USING (is_admin() OR (posted_by = auth.uid() AND is_staff()))
  WITH CHECK (is_admin() OR (posted_by = auth.uid() AND is_staff()));

-- 削除は管理者または投稿者本人（スタッフに限る）
CREATE POLICY "announcements_delete"
  ON announcements FOR DELETE
  TO authenticated
  USING (is_admin() OR (posted_by = auth.uid() AND is_staff()));

-- ============================================================
-- announcement_reads（お知らせ既読管理）
-- ============================================================

-- 自分の既読またはスタッフは全件閲覧可能
CREATE POLICY "announcement_reads_select"
  ON announcement_reads FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_staff()
  );

-- 自分の既読のみ登録可能
CREATE POLICY "announcement_reads_insert_own"
  ON announcement_reads FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 削除は管理者のみ
CREATE POLICY "announcement_reads_delete_admin"
  ON announcement_reads FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================
-- photos（写真）
-- ============================================================

-- スタッフは全件閲覧可能、認証済みユーザーはプライベート写真を閲覧可能、公開写真は全員閲覧可能
CREATE POLICY "photos_select_authenticated"
  ON photos FOR SELECT
  TO authenticated
  USING (
    is_staff()
    OR visibility = 'public'
    OR visibility = 'private'
  );

-- 公開写真は匿名ユーザーも閲覧可能
CREATE POLICY "photos_select_anon"
  ON photos FOR SELECT
  TO anon
  USING (visibility = 'public');

-- アップロードはスタッフのみ
CREATE POLICY "photos_insert_staff"
  ON photos FOR INSERT
  TO authenticated
  WITH CHECK (is_staff());

-- 更新は管理者またはアップロード者
CREATE POLICY "photos_update"
  ON photos FOR UPDATE
  TO authenticated
  USING (is_admin() OR uploaded_by = auth.uid())
  WITH CHECK (is_admin() OR uploaded_by = auth.uid());

-- 削除は管理者またはアップロード者
CREATE POLICY "photos_delete"
  ON photos FOR DELETE
  TO authenticated
  USING (is_admin() OR uploaded_by = auth.uid());

-- ============================================================
-- documents（書類・ドキュメント）
-- ============================================================

-- 認証済みユーザーは全件閲覧可能
CREATE POLICY "documents_select_authenticated"
  ON documents FOR SELECT
  TO authenticated
  USING (true);

-- アップロードはスタッフのみ
CREATE POLICY "documents_insert_staff"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (is_staff());

-- 更新は管理者またはアップロード者
CREATE POLICY "documents_update"
  ON documents FOR UPDATE
  TO authenticated
  USING (is_admin() OR uploaded_by = auth.uid())
  WITH CHECK (is_admin() OR uploaded_by = auth.uid());

-- 削除は管理者またはアップロード者
CREATE POLICY "documents_delete"
  ON documents FOR DELETE
  TO authenticated
  USING (is_admin() OR uploaded_by = auth.uid());

-- ============================================================
-- billing_rules（延長保育料金ルール）
-- ============================================================

-- 認証済みユーザーは閲覧可能（料金表示に必要）
CREATE POLICY "billing_rules_select_authenticated"
  ON billing_rules FOR SELECT
  TO authenticated
  USING (true);

-- 登録・更新は管理者のみ
CREATE POLICY "billing_rules_insert_admin"
  ON billing_rules FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "billing_rules_update_admin"
  ON billing_rules FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================
-- monthly_bills（月次請求）
-- ============================================================

-- スタッフは全件閲覧可能、保護者は自分の子どもの請求のみ
CREATE POLICY "monthly_bills_select"
  ON monthly_bills FOR SELECT
  TO authenticated
  USING (
    is_staff()
    OR child_id IN (SELECT child_id FROM child_parents WHERE parent_id = auth.uid())
  );

-- 登録・更新はスタッフのみ（システム計算）
CREATE POLICY "monthly_bills_insert_staff"
  ON monthly_bills FOR INSERT
  TO authenticated
  WITH CHECK (is_staff());

CREATE POLICY "monthly_bills_update_staff"
  ON monthly_bills FOR UPDATE
  TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff());

-- ============================================================
-- site_pages（公開サイト固定ページ）
-- ============================================================

-- 匿名・認証済みユーザーともに閲覧可能（公開ホームページ用）
CREATE POLICY "site_pages_select_public"
  ON site_pages FOR SELECT
  TO anon, authenticated
  USING (true);

-- 登録・更新は管理者のみ
CREATE POLICY "site_pages_insert_admin"
  ON site_pages FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "site_pages_update_admin"
  ON site_pages FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================================
-- site_news（公開サイトニュース）
-- ============================================================

-- 匿名・認証済みユーザーともに閲覧可能（公開ホームページ用）
CREATE POLICY "site_news_select_public"
  ON site_news FOR SELECT
  TO anon, authenticated
  USING (true);

-- 登録・更新・削除は管理者のみ
CREATE POLICY "site_news_insert_admin"
  ON site_news FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "site_news_update_admin"
  ON site_news FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "site_news_delete_admin"
  ON site_news FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================================
-- notification_preferences（通知設定）
-- ============================================================

-- 自分の設定のみ閲覧可能
CREATE POLICY "notification_preferences_select_own"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 自分の設定のみ登録可能
CREATE POLICY "notification_preferences_insert_own"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 自分の設定のみ更新可能
CREATE POLICY "notification_preferences_update_own"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- push_subscriptions（プッシュ通知サブスクリプション）
-- ============================================================

-- 自分のサブスクリプションのみ閲覧可能
CREATE POLICY "push_subscriptions_select_own"
  ON push_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 自分のサブスクリプションのみ登録可能
CREATE POLICY "push_subscriptions_insert_own"
  ON push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 自分のサブスクリプションまたは管理者が削除可能
CREATE POLICY "push_subscriptions_delete"
  ON push_subscriptions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());
