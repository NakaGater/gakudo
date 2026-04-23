-- ============================================================
-- 学童保育管理システム 初期スキーマ
-- ============================================================

-- updated_at 自動更新トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- プロフィール（Supabase Auth と連携）
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'teacher', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 児童
-- ============================================================
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  grade INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 6),
  qr_code TEXT UNIQUE NOT NULL,
  qr_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER trg_children_updated_at
  BEFORE UPDATE ON children
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 児童と保護者の多対多リレーション
-- ============================================================
CREATE TABLE IF NOT EXISTS child_parents (
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (child_id, parent_id)
);

-- ============================================================
-- 入退室記録
-- ============================================================
CREATE TABLE IF NOT EXISTS attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('enter', 'exit')),
  method TEXT NOT NULL CHECK (method IN ('qr', 'manual')),
  recorded_at TIMESTAMPTZ DEFAULT now(),
  recorded_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_attendances_child_date
  ON attendances (child_id, recorded_at);

-- ============================================================
-- お知らせ
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  posted_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- お知らせ既読管理
-- ============================================================
CREATE TABLE IF NOT EXISTS announcement_reads (
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (announcement_id, user_id)
);

-- ============================================================
-- 写真
-- ============================================================
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  caption TEXT,
  event_name TEXT,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 書類・ドキュメント
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  category TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 延長保育料金ルール
-- ============================================================
CREATE TABLE IF NOT EXISTS billing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regular_end_time TIME NOT NULL,
  rate_per_unit INTEGER NOT NULL,
  unit_minutes INTEGER NOT NULL DEFAULT 30,
  effective_from DATE NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 月次請求
-- ============================================================
CREATE TABLE IF NOT EXISTS monthly_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id),
  year_month TEXT NOT NULL,
  total_extended_minutes INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed')),
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (child_id, year_month)
);

-- ============================================================
-- 公開サイト 固定ページ
-- ============================================================
CREATE TABLE IF NOT EXISTS site_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES profiles(id)
);

CREATE TRIGGER trg_site_pages_updated_at
  BEFORE UPDATE ON site_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 公開サイト ニュース
-- ============================================================
CREATE TABLE IF NOT EXISTS site_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  published_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

-- ============================================================
-- 通知設定
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  method TEXT NOT NULL DEFAULT 'email' CHECK (method IN ('push', 'email', 'both', 'off'))
);

-- ============================================================
-- プッシュ通知サブスクリプション
-- ============================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
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
-- ============================================================
-- Storage バケット RLS ポリシー
-- ============================================================

-- photos バケット: 認証済みユーザーが読み取り、admin/teacher がアップロード・削除
CREATE POLICY "photos_select" ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'photos');

CREATE POLICY "photos_insert" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'photos'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "photos_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'photos'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- documents バケット: 認証済みユーザーが読み取り、admin がアップロード・削除
CREATE POLICY "documents_select" ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "documents_insert" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "documents_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
-- site_pages に metadata JSONB カラムを追加
-- ページ種別ごとの構造化データ（サブタイトル、スケジュール、施設概要など）を格納
ALTER TABLE site_pages
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 既存の about ページにデフォルトメタデータを設定
UPDATE site_pages SET metadata = '{
  "subtitle": "子どもたちが「ただいま！」と駆け込んでくる、あたたかい居場所です。",
  "vision_heading": "私たちの想い",
  "vision_emoji": "🏠",
  "vision_tagline": "家庭のようなあたたかさ",
  "schedule": [
    { "time": "14:00", "label": "入室・宿題タイム", "emoji": "📝" },
    { "time": "15:30", "label": "おやつ", "emoji": "🍪" },
    { "time": "16:00", "label": "自由遊び・活動", "emoji": "⚽" },
    { "time": "18:00", "label": "お迎え・退室", "emoji": "👋" }
  ],
  "facility_info": [
    { "label": "施設名", "value": "星ヶ丘こどもクラブ" },
    { "label": "運営形態", "value": "父母運営型 学童保育" },
    { "label": "対象", "value": "小学1〜6年生" },
    { "label": "定員", "value": "約30名" },
    { "label": "開所時間", "value": "平日 放課後〜19:00 / 土曜・長期休暇 8:00〜19:00" },
    { "label": "休所日", "value": "日曜・祝日・年末年始" }
  ]
}'::jsonb WHERE slug = 'about';

-- 既存の access ページにデフォルトメタデータを設定
UPDATE site_pages SET metadata = '{
  "subtitle": "お気軽にお越しください。見学も随時受け付けております。",
  "phone": "03-1234-5678",
  "phone_hours": "受付: 平日 9:00〜18:00",
  "opening_hours": "平日: 放課後〜19:00\n土曜・長期休暇: 8:00〜19:00",
  "visit_heading": "見学のお申し込み",
  "visit_text": "入所をご検討中の方は、お気軽にお電話ください。\n施設の見学は随時受け付けております。"
}'::jsonb WHERE slug = 'access';

-- 既存の home ページにデフォルトメタデータを設定
UPDATE site_pages SET metadata = '{
  "subtitle": "星ヶ丘こどもクラブは、保護者の手で運営する学童保育施設です。"
}'::jsonb WHERE slug = 'home';
-- ============================================================
-- 添付ファイル管理テーブル + ストレージバケット
-- ============================================================

-- attachments ストレージバケット作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- attachments バケットのRLSポリシー
-- 読み取り: 認証済みユーザー
CREATE POLICY "attachments_select" ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'attachments');

-- 公開ページ向け（お知らせの添付ファイル）: anonでも読み取り可能
CREATE POLICY "attachments_select_anon" ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'attachments' AND (storage.foldername(name))[1] = 'news');

-- アップロード: staff (admin/teacher)
CREATE POLICY "attachments_insert" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'attachments'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- 削除: staff (admin/teacher)
CREATE POLICY "attachments_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'attachments'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- 添付ファイル管理テーブル
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('announcement', 'news')),
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_attachments_entity ON attachments(entity_type, entity_id);

-- RLS
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- 読み取り: 認証済みユーザー全員
CREATE POLICY "attachments_row_select" ON attachments FOR SELECT
  TO authenticated
  USING (true);

-- 公開お知らせの添付は匿名でも閲覧可能
CREATE POLICY "attachments_row_select_anon" ON attachments FOR SELECT
  TO anon
  USING (entity_type = 'news');

-- 挿入: staff
CREATE POLICY "attachments_row_insert" ON attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- 削除: staff
CREATE POLICY "attachments_row_delete" ON attachments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );
-- entranceロール追加（入口端末用）
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('parent', 'teacher', 'admin', 'entrance'));
-- 見学予約・お問い合わせテーブル
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('visit', 'general')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  preferred_date TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'replied')),
  admin_reply TEXT,
  replied_at TIMESTAMPTZ,
  replied_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- インデックス
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_created_at ON inquiries(created_at DESC);

-- RLS有効化
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- 匿名ユーザー（未認証含む）はINSERTのみ
CREATE POLICY "Anyone can submit inquiry"
  ON inquiries FOR INSERT
  WITH CHECK (true);

-- admin/teacherは全件閲覧可能
CREATE POLICY "Staff can view inquiries"
  ON inquiries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'teacher')
    )
  );

-- admin/teacherは更新可能（返信時のステータス更新用）
CREATE POLICY "Staff can update inquiries"
  ON inquiries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'teacher')
    )
  );
-- Instagram投稿の埋め込み管理テーブル
CREATE TABLE instagram_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_url TEXT NOT NULL,
  caption TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

-- RLS
ALTER TABLE instagram_posts ENABLE ROW LEVEL SECURITY;

-- 誰でも閲覧可（公開ギャラリー用）
CREATE POLICY "instagram_posts_select" ON instagram_posts
  FOR SELECT USING (true);

-- admin/teacher のみ INSERT/UPDATE/DELETE
CREATE POLICY "instagram_posts_insert" ON instagram_posts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

CREATE POLICY "instagram_posts_update" ON instagram_posts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

CREATE POLICY "instagram_posts_delete" ON instagram_posts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );
-- RPC function: returns anonymous attendance summary counts for today
-- Accessible by any authenticated user (parents can see how many children are present)
CREATE OR REPLACE FUNCTION get_attendance_summary()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_children INT;
  entered_count INT;
  exited_count INT;
  jst_start TIMESTAMPTZ;
  jst_end TIMESTAMPTZ;
BEGIN
  -- Calculate today's range in JST (UTC+9)
  jst_start := date_trunc('day', now() AT TIME ZONE 'Asia/Tokyo') AT TIME ZONE 'Asia/Tokyo';
  jst_end := jst_start + interval '1 day';

  SELECT COUNT(*) INTO total_children FROM children;

  -- Get latest attendance type per child today
  WITH latest AS (
    SELECT DISTINCT ON (child_id) child_id, type
    FROM attendances
    WHERE recorded_at >= jst_start AND recorded_at < jst_end
    ORDER BY child_id, recorded_at DESC
  )
  SELECT
    COUNT(*) FILTER (WHERE type = 'enter'),
    COUNT(*) FILTER (WHERE type = 'exit')
  INTO entered_count, exited_count
  FROM latest;

  RETURN json_build_object(
    'total', total_children,
    'entered', COALESCE(entered_count, 0),
    'exited', COALESCE(exited_count, 0),
    'none', total_children - COALESCE(entered_count, 0) - COALESCE(exited_count, 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_attendance_summary() TO authenticated;
