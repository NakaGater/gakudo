-- site_pages に metadata JSONB カラムを追加
-- ページ種別ごとの構造化データ（サブタイトル、スケジュール、施設概要など）を格納
ALTER TABLE site_pages
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 既存の about ページにデフォルトメタデータを設定
UPDATE site_pages SET metadata = '{
  "subtitle": "子どもたちが「ただいま！」と駆け込んでくる、あたたかい居場所です。",
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
