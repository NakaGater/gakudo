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
