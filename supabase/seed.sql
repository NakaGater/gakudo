-- ============================================================
-- 開発用シードデータ
-- ============================================================
-- 管理者ユーザーは db reset 後に自動作成されます（下記参照）。
-- seed.sql 実行後、supabase/seed-auth.sh を手動実行してください。

-- ストレージバケット作成
INSERT INTO storage.buckets (id, name, public) VALUES
  ('photos', 'photos', true),
  ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- 固定ページ（ホーム・概要・アクセス）
INSERT INTO site_pages (slug, title, content, metadata) VALUES
  ('home', 'ホーム', 'ようこそ、学童保育管理システムへ。こちらはトップページのサンプルコンテンツです。', '{"subtitle":"星ヶ丘こどもクラブは、保護者の手で運営する学童保育施設です。","features_heading":"施設の特徴","features_subtitle":"デジタルの力で、保護者の安心と運営の効率化を両立します。","features":[{"icon":"QrCode","title":"安全管理（QR入退場）","description":"専用QRコードで入室・退室をワンタッチ記録。保護者のスマホにリアルタイムで通知が届きます。"},{"icon":"Megaphone","title":"連絡配信","description":"行事予定やお知らせをアプリから配信。紙のプリントをなくし、既読確認も可能です。"},{"icon":"Camera","title":"写真共有","description":"施設での活動写真を保護者限定で安全に共有。行事の様子をいつでも振り返れます。"},{"icon":"Receipt","title":"請求管理","description":"延長保育の料金を退室時間から自動計算。月次の請求書をオンラインで確認できます。"}]}'::jsonb),
  ('about', '学童について', '当学童保育では、放課後の子どもたちが安心して過ごせる環境を提供しています。', '{"subtitle":"子どもたちが「ただいま！」と駆け込んでくる、あたたかい居場所です。","vision_heading":"私たちの想い","vision_emoji":"🏠","vision_tagline":"家庭のようなあたたかさ","schedule":[{"time":"14:00","label":"入室・宿題タイム","emoji":"📝"},{"time":"15:30","label":"おやつ","emoji":"🍪"},{"time":"16:00","label":"自由遊び・活動","emoji":"⚽"},{"time":"18:00","label":"お迎え・退室","emoji":"👋"}],"facility_info":[{"label":"施設名","value":"星ヶ丘こどもクラブ"},{"label":"運営形態","value":"父母運営型 学童保育"},{"label":"対象","value":"小学1〜6年生"},{"label":"定員","value":"約30名"},{"label":"開所時間","value":"平日 放課後〜19:00 / 土曜・長期休暇 8:00〜19:00"},{"label":"休所日","value":"日曜・祝日・年末年始"}]}'::jsonb),
  ('access', 'アクセス', '〒000-0000 東京都○○区△△ 1-2-3　最寄り駅：○○駅 徒歩5分', '{"subtitle":"お気軽にお越しください。見学も随時受け付けております。","phone":"03-1234-5678","phone_hours":"受付: 平日 9:00〜18:00","opening_hours":"平日: 放課後〜19:00\n土曜・長期休暇: 8:00〜19:00","visit_heading":"見学のお申し込み","visit_text":"入所をご検討中の方は、お気軽にお電話ください。\n施設の見学は随時受け付けております。"}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- 延長保育料金ルール（17:00以降、30分あたり500円）
-- created_by は Auth ユーザーが必要なため、シードでは挿入しません。
-- Supabase Dashboard から管理者ユーザー作成後に手動で挿入してください。
-- 以下はローカル開発でダミー UUID を使う場合の参考例です:
--
-- INSERT INTO billing_rules (regular_end_time, rate_per_unit, unit_minutes, effective_from, created_by)
-- VALUES ('17:00', 500, 30, '2025-04-01', '<admin-user-uuid>');
