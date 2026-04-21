import type { Metadata } from "next";
import {
  QrCode,
  Megaphone,
  Camera,
  Receipt,
  ArrowRight,
  MapPin,
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
      {/* Hero — storybook gradient */}
      <section className="bg-gradient-to-b from-page-deep via-page to-page py-16 sm:py-24 relative overflow-hidden">
        {/* Ambient stars */}
        <span className="star-ambient absolute top-8 right-12 text-4xl pointer-events-none select-none" aria-hidden="true">✦</span>
        <span className="star-ambient absolute top-24 left-8 text-2xl pointer-events-none select-none" style={{ animationDelay: "2s" }} aria-hidden="true">✦</span>
        <span className="star-ambient absolute bottom-16 right-32 text-xl pointer-events-none select-none" style={{ animationDelay: "4s" }} aria-hidden="true">✦</span>

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="animate-slide-in">
              <p className="mb-3 text-sm font-hand text-cr-orange tracking-wide">
                ✎ 父母運営型 学童保育
              </p>
              <h1 className="text-3xl font-story font-black leading-tight text-ink sm:text-4xl lg:text-5xl whitespace-pre-wrap">
                {heroTitle}
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-mid sm:text-lg whitespace-pre-wrap">
                {heroText}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 rounded-lg bg-accent border-2 border-[#92400E] shadow-[0_3px_0_#92400E] px-5 py-2.5 text-sm font-bold font-story text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_0_#92400E] active:translate-y-0.5 active:shadow-[0_1px_0_#92400E]"
                >
                  施設について詳しく
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/access"
                  className="inline-flex items-center gap-2 rounded-lg border-2 border-page-edge bg-bg-elev shadow-[0_2px_0_var(--page-edge)] px-5 py-2.5 text-sm font-bold font-story text-ink transition-all hover:border-cr-orange hover:text-cr-orange hover:-translate-y-0.5"
                >
                  <MapPin size={16} />
                  見学のお申し込み
                </Link>
              </div>
            </div>

            {/* Hero illustration — craft card with gradient landscape */}
            <div className="animate-pop-in flex items-center justify-center rounded-2xl bg-gradient-to-b from-[#FFF9E6] via-[#FDEBD0] to-[#D5F5E3] p-12 lg:aspect-[4/3] border-2 border-page-edge shadow-[4px_4px_0_var(--page-edge)] relative overflow-hidden paper-grain">
              <div className="text-center text-ink-mid relative z-10">
                <div className="mx-auto mb-4 text-5xl animate-float">⭐</div>
                <Camera size={36} strokeWidth={1.5} className="mx-auto mb-3 text-cr-green" />
                <p className="text-sm font-bold font-story">
                  子どもたちの笑顔があふれる
                  <br />
                  放課後の風景
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features — crayon-colored cards */}
      <section className="bg-page py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-story font-black text-ink sm:text-3xl">
            {featuresHeading}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-ink-mid">
            {featuresSubtitle}
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {featureItems.map((feature, i) => {
              const IconComponent = ICON_MAP[feature.icon];
              const crayon = CRAYON_COLORS[i % CRAYON_COLORS.length];
              return (
                <div
                  key={feature.title}
                  className={`animate-card-in stagger-${i + 1} rounded-xl border-2 ${crayon.border} bg-bg-elev p-6 shadow-sm hover-lift paper-grain`}
                >
                  <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${crayon.bg} ${crayon.text}`}>
                    {IconComponent ? (
                      <IconComponent size={22} strokeWidth={1.75} />
                    ) : (
                      <span className="text-lg">{feature.icon}</span>
                    )}
                  </div>
                  <h3 className="text-base font-bold font-story text-ink">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-mid">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA — warm accent */}
      <section className="bg-gradient-to-b from-page to-page-deep py-16 sm:py-20 relative">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="mx-auto mb-4 text-3xl">🏠</div>
          <h2 className="text-2xl font-story font-black text-ink sm:text-3xl">
            見学・お問い合わせ
          </h2>
          <p className="mt-3 text-ink-mid">
            入所をご検討の方は、お気軽にお電話またはお問い合わせください。
            <br />
            施設の見学も随時受け付けております。
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/access"
              className="inline-flex items-center gap-2 rounded-lg bg-accent border-2 border-[#92400E] shadow-[0_3px_0_#92400E] px-6 py-3 text-sm font-bold font-story text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_0_#92400E] active:translate-y-0.5 active:shadow-[0_1px_0_#92400E]"
            >
              <MapPin size={16} />
              アクセス・お問い合わせ
            </Link>
            <span className="text-sm text-ink-light font-hand">
              TEL: 03-1234-5678（平日 9:00〜18:00）
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
