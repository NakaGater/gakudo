import type { Metadata } from "next";
import {
  QrCode,
  Megaphone,
  Camera,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "星ヶ丘こどもクラブ — 子どもたちの笑顔あふれる放課後を",
  description:
    "星ヶ丘こどもクラブは、保護者が運営する学童保育施設です。安心・安全な放課後の居場所を提供します。",
};

const DEFAULT_HERO_TITLE = "子どもたちの\n笑顔あふれる放課後を";
const DEFAULT_HERO_TEXT =
  "星ヶ丘こどもクラブは、保護者の手で運営する学童保育施設です。約30名の児童が、宿題・遊び・おやつの時間を通じて、のびのびと放課後を過ごしています。";

type FeatureItem = { icon: string; title: string; description: string };

const DEFAULT_FEATURES: FeatureItem[] = [
  {
    icon: "QrCode",
    title: "安全管理（QR入退場）",
    description:
      "専用QRコードで入室・退室をワンタッチ記録。保護者のスマホにリアルタイムで通知が届きます。",
  },
  {
    icon: "Megaphone",
    title: "連絡配信",
    description:
      "行事予定やお知らせをアプリから配信。紙のプリントをなくし、既読確認も可能です。",
  },
  {
    icon: "Camera",
    title: "写真共有",
    description:
      "施設での活動写真を保護者限定で安全に共有。行事の様子をいつでも振り返れます。",
  },
  {
    icon: "Receipt",
    title: "請求管理",
    description:
      "延長保育の料金を退室時間から自動計算。月次の請求書をオンラインで確認できます。",
  },
];

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  QrCode, Megaphone, Camera, Receipt,
};

/* Crayon color per feature index */
const CRAYON_COLORS = [
  { bg: "bg-cr-green/10", text: "text-cr-green", border: "border-cr-green/30" },
  { bg: "bg-cr-blue/10", text: "text-cr-blue", border: "border-cr-blue/30" },
  { bg: "bg-cr-purple/10", text: "text-cr-purple", border: "border-cr-purple/30" },
  { bg: "bg-cr-pink/10", text: "text-cr-pink", border: "border-cr-pink/30" },
];

export default async function HomePage() {
  let heroTitle = DEFAULT_HERO_TITLE;
  let heroText = DEFAULT_HERO_TEXT;
  let featuresHeading = "施設の特徴";
  let featuresSubtitle = "デジタルの力で、保護者の安心と運営の効率化を両立します。";
  let featureItems: FeatureItem[] = DEFAULT_FEATURES;
  try {
    const supabase = await createClient();
    const { data: homePage } = await supabase
      .from("site_pages")
      .select("title, content, metadata")
      .eq("slug", "home")
      .single() as { data: { title: string; content: string; metadata: Record<string, unknown> } | null };

    if (homePage?.title) {
      heroTitle = homePage.title;
    }
    if (homePage?.content) {
      heroText = homePage.content;
    }
    if (homePage?.metadata) {
      const m = homePage.metadata;
      if (m.features_heading) featuresHeading = m.features_heading as string;
      if (m.features_subtitle) featuresSubtitle = m.features_subtitle as string;
      if (Array.isArray(m.features) && m.features.length > 0) {
        featureItems = m.features as FeatureItem[];
      }
    }
  } catch {
    // DB接続エラー時はデフォルトテキストを使用
  }
  return (
    <>
      {/* Hero */}
      <section className="relative" style={{ padding: "36px 40px 0" }}>
        {/* Ambient stars */}
        <span className="absolute top-[8%] right-[12%] text-[10px] opacity-30 animate-float pointer-events-none" style={{ color: "var(--cr-yellow)" }} aria-hidden="true">⭐</span>
        <span className="absolute top-[5%] left-[8%] text-[7px] opacity-30 animate-float pointer-events-none" style={{ color: "var(--cr-yellow)", animationDelay: "2s" }} aria-hidden="true">⭐</span>

        <div className="grid items-center gap-8" style={{ gridTemplateColumns: "1.1fr 0.9fr" }}>
          {/* Text side */}
          <div>
            <div className="mb-3 font-hand text-xs text-cr-orange">📖 だい１しょう</div>
            <h1 className="font-story font-black text-ink ink-bleed" style={{
              fontSize: "clamp(38px, 4.2vw, 46px)",
              lineHeight: "1.18",
              letterSpacing: "-.025em",
              textWrap: "balance",
            }}>
              子どもたちの
              <br />
              <span className="crayon-underline">笑顔あふれる</span>
              <br />
              放課後を
            </h1>
            <p className="mt-3 text-[13px] leading-[1.9] text-ink-mid" style={{ maxWidth: "420px" }}>
              {heroText}
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                href="/about"
                className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border-2 border-[#B5663A] bg-cr-orange px-[22px] py-[10px] text-sm font-bold font-story text-white shadow-[0_3px_0_#B5663A] transition-all hover:-translate-y-px hover:shadow-[0_4px_0_#B5663A] active:translate-y-px active:shadow-[0_1px_0_#B5663A]"
              >
                施設について詳しく →
              </Link>
              <Link
                href="/access"
                className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border-2 border-page-edge bg-white px-[22px] py-[10px] text-sm font-bold font-story text-ink shadow-[0_2px_0_var(--page-edge)] transition-all hover:border-cr-orange hover:text-cr-orange hover:-translate-y-px"
              >
                🗺️ 見学のお申し込み
              </Link>
            </div>
          </div>

          {/* Hero illustration — craft landscape with 星ちゃん */}
          <div className="relative overflow-hidden rounded-xl border-2 border-page-edge shadow-[4px_4px_0_var(--page-edge)]"
            style={{ height: "280px", background: "linear-gradient(180deg, #FFF9E6 0%, #FDEBD0 25%, #D5F5E3 65%, #3A8A64 100%)" }}
          >
            {/* Watercolor overlay */}
            <div className="absolute inset-0 z-[3] pointer-events-none" style={{
              background: "radial-gradient(ellipse at 30% 60%, rgba(255,217,61,.08) 0%, transparent 40%), radial-gradient(ellipse at 70% 30%, rgba(200,110,138,.06) 0%, transparent 35%), radial-gradient(ellipse at 50% 80%, rgba(58,138,100,.06) 0%, transparent 40%)",
              mixBlendMode: "multiply"
            }} />
            {/* Stars */}
            <span className="absolute top-[8%] left-[12%] text-[10px]" style={{ color: "var(--cr-yellow)", opacity: .3, animation: "starPulse 8s ease-in-out infinite" }} aria-hidden="true">⭐</span>
            <span className="absolute top-[5%] right-[18%] text-[7px]" style={{ color: "var(--cr-yellow)", opacity: .3, animation: "starPulse 8s ease-in-out infinite", animationDelay: "2s" }} aria-hidden="true">⭐</span>
            <span className="absolute top-[14%] left-[42%] text-[6px]" style={{ color: "var(--cr-yellow)", opacity: .3, animation: "starPulse 8s ease-in-out infinite", animationDelay: "4s" }} aria-hidden="true">⭐</span>
            <span className="absolute top-[10%] right-[30%] text-[8px]" style={{ color: "var(--cr-yellow)", opacity: .3, animation: "starPulse 8s ease-in-out infinite", animationDelay: "1s" }} aria-hidden="true">⭐</span>
            {/* Birds */}
            <span className="absolute top-[12%] right-[12%] text-sm opacity-45" aria-hidden="true">🐦</span>
            <span className="absolute top-[9%] right-[7%] text-xs opacity-35 -scale-x-100" aria-hidden="true">🐦</span>
            {/* Hills */}
            <svg className="absolute bottom-0 w-full z-[1]" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 80Q100 20 200 50T400 30V120H0Z" fill="#3A8A64" opacity=".25" />
              <path d="M0 90Q150 40 250 65T400 50V120H0Z" fill="#3A8A64" opacity=".18" />
            </svg>
            {/* Building */}
            <svg className="absolute bottom-[22%] left-1/2 -translate-x-1/2 w-[90px] z-[2]" viewBox="0 0 100 85" aria-hidden="true">
              <rect x="5" y="20" width="90" height="65" rx="3" fill="#D14B40" opacity=".2" />
              <rect x="15" y="36" width="16" height="16" rx="2" fill="white" opacity=".5" />
              <rect x="42" y="36" width="16" height="16" rx="2" fill="white" opacity=".5" />
              <rect x="69" y="36" width="16" height="16" rx="2" fill="white" opacity=".5" />
              <rect x="38" y="60" width="24" height="25" rx="2" fill="#D14B40" opacity=".25" />
              <polygon points="50,0 0,20 100,20" fill="#D14B40" opacity=".18" />
              <path d="M50 4l2.5 7.5h8l-6 4.5 2 7-6.5-5-6.5 5 2-7-6-4.5h8z" fill="#FFD93D" opacity=".9" />
            </svg>
            {/* 星ちゃん mascot on roof */}
            <div className="absolute bottom-[46%] left-1/2 -translate-x-1/2 z-[3]">
              <svg width="30" height="36" viewBox="0 0 32 38" aria-hidden="true">
                <path d="M16 2l3.5 10.5H30l-8.5 6.5 3.2 10L16 22.5 7.3 29l3.2-10L2 12.5h10.5z" fill="#FFD93D" stroke="#E8B830" strokeWidth="1.5"/>
                <circle cx="12" cy="14" r="1.5" fill="#3B2F20"/>
                <circle cx="20" cy="14" r="1.5" fill="#3B2F20"/>
                <circle cx="9" cy="17" r="2" fill="#FFB5C5" opacity=".55"/>
                <circle cx="23" cy="17" r="2" fill="#FFB5C5" opacity=".55"/>
                <path d="M12 18 Q16 22 20 18" fill="none" stroke="#3B2F20" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="27" y1="16" x2="31" y2="10" stroke="#E8B830" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="5" y1="16" x2="1" y2="18" stroke="#E8B830" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="10" y1="28" x2="9" y2="34" stroke="#E8B830" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="22" y1="28" x2="23" y2="34" stroke="#E8B830" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            {/* Colored balls */}
            <div className="absolute bottom-[10%] left-[18%] z-[2] flex gap-3.5" aria-hidden="true">
              <div className="w-4 h-4 rounded-full bg-cr-red opacity-35" />
              <div className="w-4 h-4 rounded-full bg-cr-blue opacity-35" />
              <div className="w-4 h-4 rounded-full bg-star opacity-35" />
            </div>
          </div>
        </div>
      </section>

      {/* Features — sticky note grid */}
      <section style={{ padding: "32px 40px", background: "linear-gradient(180deg, transparent 0%, rgba(255,217,61,.03) 50%, transparent 100%)" }}>
        <div className="text-center mb-5">
          <h2 className="font-story font-black text-ink inline-block" style={{ fontSize: "22px" }}>
            <span className="crayon-underline">{featuresHeading}</span>
          </h2>
          <p className="text-[13px] text-ink-mid mt-1.5">{featuresSubtitle}</p>
        </div>
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          {featureItems.map((feature, i) => {
            const IconComponent = ICON_MAP[feature.icon];
            const stickyColors = [
              { bg: "sticky-note--yellow", iconBg: "#FFE5D5", iconColor: "var(--cr-orange)", iconBorder: "var(--cr-orange)" },
              { bg: "sticky-note--green", iconBg: "#D5F5E3", iconColor: "var(--cr-green)", iconBorder: "var(--cr-green)" },
              { bg: "sticky-note--blue", iconBg: "#D6EEF8", iconColor: "var(--cr-blue)", iconBorder: "var(--cr-blue)" },
              { bg: "sticky-note--pink", iconBg: "#FFE0E8", iconColor: "var(--cr-pink)", iconBorder: "var(--cr-pink)" },
            ];
            const s = stickyColors[i % stickyColors.length];
            return (
              <div key={feature.title} className={`sticky-note ${s.bg}`}>
                <div
                  className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border-2"
                  style={{ background: s.iconBg, color: s.iconColor, borderColor: s.iconBorder }}
                >
                  {IconComponent ? (
                    <IconComponent size={18} strokeWidth={1.75} />
                  ) : (
                    <span className="text-lg">{feature.icon}</span>
                  )}
                </div>
                <h3 className="text-sm font-bold font-story text-ink mb-1">{feature.title}</h3>
                <p className="text-[11px] leading-[1.7] text-ink-mid font-sans">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
        {/* Flower decoration */}
        <div className="flex gap-1 justify-center text-sm opacity-30 mt-2.5" aria-hidden="true">
          🌸 🌼 🌷 🌻 🌸
        </div>
      </section>

      {/* CTA — dashed border with washi tape */}
      <section
        className="relative rounded-xl border-2 border-dashed border-cr-yellow text-center"
        style={{
          padding: "28px 36px",
          margin: "0 40px 32px",
          background: "linear-gradient(135deg, rgba(255,248,197,.4), rgba(213,245,227,.3), rgba(255,224,232,.2))",
        }}
      >
        {/* Washi tape label */}
        <span className="absolute -top-2 left-8 z-[2] rounded-sm px-6 py-0.5 text-[11px] font-hand text-ink-mid"
          style={{ background: "rgba(200,110,138,.25)" }}
        >
          ✉️ おしらせ
        </span>
        <div className="text-[32px] mb-2">⭐</div>
        <h2 className="font-story font-black text-ink" style={{ fontSize: "20px" }}>
          見学・お問い合わせ
        </h2>
        <p className="text-[13px] text-ink-mid leading-[1.8]" style={{ margin: "8px 0 20px" }}>
          入所をご検討の方は、お気軽にお電話またはお問い合わせください。
          <br />
          施設の見学も随時受け付けております。
        </p>
        <Link
          href="/access"
          className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border-2 border-[#B5663A] bg-cr-orange px-[22px] py-[10px] text-sm font-bold font-story text-white shadow-[0_3px_0_#B5663A] transition-all hover:-translate-y-px hover:shadow-[0_4px_0_#B5663A] active:translate-y-px active:shadow-[0_1px_0_#B5663A]"
        >
          🗺️ アクセス・お問い合わせ
        </Link>
        <div className="text-xs text-ink-light mt-2.5">
          TEL: 03-1234-5678（平日 9:00〜18:00）
        </div>
      </section>
    </>
  );
}
