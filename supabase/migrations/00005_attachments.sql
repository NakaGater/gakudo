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
