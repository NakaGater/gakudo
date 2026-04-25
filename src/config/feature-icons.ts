/**
 * トップページ特徴カード用アイコン定義
 * page.tsx（表示）と edit-page-form.tsx（CMS選択）の両方で使用
 */
import {
  QrCode,
  Megaphone,
  Camera,
  Receipt,
  Shield,
  Heart,
  Users,
  BookOpen,
  Calendar,
  Bell,
  Clock,
  Star,
  Smile,
  Home,
  MapPin,
  Phone,
  Apple,
} from "lucide-react";

type IconEntry = {
  component: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
};

export const FEATURE_ICONS: Record<string, IconEntry> = {
  QrCode: { component: QrCode, label: "QRコード" },
  Megaphone: { component: Megaphone, label: "メガホン" },
  Camera: { component: Camera, label: "カメラ" },
  Receipt: { component: Receipt, label: "レシート" },
  Shield: { component: Shield, label: "シールド" },
  Heart: { component: Heart, label: "ハート" },
  Users: { component: Users, label: "ユーザー" },
  BookOpen: { component: BookOpen, label: "本" },
  Calendar: { component: Calendar, label: "カレンダー" },
  Bell: { component: Bell, label: "ベル" },
  Clock: { component: Clock, label: "時計" },
  Star: { component: Star, label: "星" },
  Smile: { component: Smile, label: "スマイル" },
  Home: { component: Home, label: "家" },
  MapPin: { component: MapPin, label: "地図ピン" },
  Phone: { component: Phone, label: "電話" },
  Apple: { component: Apple, label: "りんご" },
};

/** アイコン名の一覧（CMS選択用） */
export const FEATURE_ICON_KEYS = Object.keys(FEATURE_ICONS);

/** アイコン名からコンポーネントを取得 */
export function getFeatureIcon(name: string) {
  return FEATURE_ICONS[name]?.component ?? null;
}
