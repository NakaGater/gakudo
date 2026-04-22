import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { HeroSlideshow } from "./components/hero-slideshow";
import { getFeatureIcon } from "@/config/feature-icons";
import { MapPin, Clock, Phone, Send } from "lucide-react";
import { InquiryForm } from "@/app/(public)/access/inquiry-form";

export const metadata: Metadata = {
  title: "星ヶ丘こどもクラブ — 子どもたちの笑顔あふれる放課後を",
  description:
    "星ヶ丘こどもクラブは、保護者が運営する学童保育施設です。安心・安全な放課後の居場所を提供します。",
};

const DEFAULT_HERO_TEXT =
  "星ヶ丘こどもクラブは、保護者の手で運営する学童保育施設です。約30名の児童が、宿題・遊び・おやつの時間を通じて、のびのびと放課後を過ごしています。";

const DEFAULT_HERO_TITLE = "子どもたちの\n笑顔あふれる\n放課後を";
const DEFAULT_HERO_EMPHASIS = "笑顔あふれる";

type FeatureItem = { icon: string; title: string; description: string };

const DEFAULT_FEATURES: FeatureItem[] = [
  {
    icon: "Users",
    title: "父母運営のあたたかさ",
    description:
      "保護者が運営に参加することで、家庭とクラブが一体となってお子さまの成長を見守ります。",
  },
  {
    icon: "Heart",
    title: "異年齢の交流",
    description:
      "1年生から6年生まで一緒に過ごすことで、思いやりやリーダーシップが自然と育まれます。",
  },
  {
    icon: "Calendar",
    title: "季節の行事",
    description:
      "お花見、七夕、クリスマス会など四季折々の行事を通じて、豊かな思い出を育みます。",
  },
  {
    icon: "Apple",
    title: "食育・おやつ",
    description:
      "栄養バランスを考えたおやつで、旬の味覚を楽しみます。みんなで食べる時間も大切にしています。",
  },
];

/* Crayon color per feature index — reserved for future theming */

export default async function HomePage() {
  let heroText = DEFAULT_HERO_TEXT;
  let heroTitle = DEFAULT_HERO_TITLE;
  let heroEmphasis = DEFAULT_HERO_EMPHASIS;
  let featuresHeading = "施設の特徴";
  let featuresSubtitle = "デジタルの力で、保護者の安心と運営の効率化を両立します。";
  let featureItems: FeatureItem[] = DEFAULT_FEATURES;
  let photoUrls: string[] = [];
  let newsItems: { id: string; title: string; body: string; published_at: string }[] = [];
  let accessContent = "";
  let accessMeta: Record<string, unknown> = {};
  try {
    const supabase = await createClient();
    const { data: homePage } = await supabase
      .from("site_pages")
      .select("title, content, metadata")
      .eq("slug", "home")
      .single() as { data: { title: string; content: string; metadata: Record<string, unknown> } | null };

    if (homePage?.content) {
      heroText = homePage.content;
    }
    if (homePage?.metadata) {
      const m = homePage.metadata;
      if (m.hero_title) heroTitle = m.hero_title as string;
      if (m.hero_emphasis) heroEmphasis = m.hero_emphasis as string;
      if (m.features_heading) featuresHeading = m.features_heading as string;
      if (m.features_subtitle) featuresSubtitle = m.features_subtitle as string;
      if (Array.isArray(m.features) && m.features.length > 0) {
        featureItems = m.features as FeatureItem[];
      }
    }

    // 公開写真を取得（スライドショー用、最大10枚）
    const { data: photos } = await supabase
      .from("photos")
      .select("storage_path")
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(10);

    if (photos && photos.length > 0) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      photoUrls = photos.map(
        (p) => `${supabaseUrl}/storage/v1/object/public/photos/${p.storage_path}`,
      );
    }

    // 最新お知らせを取得（全件）
    const { data: news } = await supabase
      .from("site_news")
      .select("id, title, body, published_at")
      .order("published_at", { ascending: false }) as { data: { id: string; title: string; body: string; published_at: string }[] | null };

    if (news && news.length > 0) {
      newsItems = news;
    }

    // アクセスページデータ取得
    const { data: accessPage } = await supabase
      .from("site_pages")
      .select("content, metadata")
      .eq("slug", "access")
      .single() as { data: { content: string; metadata: Record<string, unknown> } | null };

    if (accessPage) {
      accessContent = accessPage.content;
      accessMeta = accessPage.metadata || {};
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
              {heroTitle.split("\n").map((line, i, arr) => (
                <span key={i}>
                  {line.includes(heroEmphasis) ? (
                    <>
                      {line.split(heroEmphasis)[0]}
                      <span className="crayon-underline">{heroEmphasis}</span>
                      {line.split(heroEmphasis)[1]}
                    </>
                  ) : (
                    line
                  )}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
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
                href="#inquiry"
                className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border-2 border-page-edge bg-white px-[22px] py-[10px] text-sm font-bold font-story text-ink shadow-[0_2px_0_var(--page-edge)] transition-all hover:border-cr-orange hover:text-cr-orange hover:-translate-y-px"
              >
                🗺️ 見学のお申し込み
              </Link>
            </div>
          </div>

          {/* Hero illustration — craft landscape with 星ちゃん + slideshow */}
          <HeroSlideshow photoUrls={photoUrls}>
            <div className="relative overflow-hidden"
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
          </HeroSlideshow>
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
            const IconComponent = getFeatureIcon(feature.icon);
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

      {/* News — お知らせ一覧 */}
      <section
        className="relative rounded-xl border-2 border-page-edge"
        style={{
          padding: "28px 36px",
          margin: "0 40px 32px",
          background: "var(--page-deep)",
        }}
      >
        <span className="absolute -top-2 left-8 z-[2] rounded-sm px-6 py-0.5 text-[11px] font-hand text-ink-mid"
          style={{ background: "rgba(200,110,138,.25)" }}
        >
          📢 おしらせ
        </span>
        <h2 className="font-story font-black text-ink mb-4 text-center" style={{ fontSize: "20px" }}>
          <span className="crayon-underline">お知らせ</span>
        </h2>
        {newsItems.length > 0 ? (
          <div className="flex flex-col gap-3 max-w-2xl mx-auto">
            {newsItems.map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.id}`}
                className="news-card"
              >
                <p className="news-card__date">
                  {new Date(item.published_at).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
                </p>
                <h3 className="news-card__title">{item.title}</h3>
                <p className="news-card__body">
                  {item.body.length > 100 ? `${item.body.slice(0, 100)}…` : item.body}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-mid text-center">現在お知らせはありません。</p>
        )}
      </section>

      {/* Access — アクセス・お問い合わせ */}
      <section id="access" style={{ padding: "32px 40px 0" }}>
        <div className="text-center mb-5">
          <h2 className="font-story font-black text-ink inline-block" style={{ fontSize: "22px" }}>
            <span className="crayon-underline">アクセス</span>
          </h2>
          <p className="text-[13px] text-ink-mid mt-1.5">
            {(accessMeta?.subtitle as string) || "お気軽にお越しください。見学も随時受け付けております。"}
          </p>
        </div>
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-xl bg-page-deep border-2 border-page-edge flex items-center justify-center aspect-square md:aspect-auto shadow-[4px_4px_0_var(--page-edge)] overflow-hidden">
              {(accessMeta?.map_embed_url as string) ? (
                <iframe
                  src={accessMeta.map_embed_url as string}
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: "300px" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Google Maps"
                />
              ) : (
                <div className="text-center p-8">
                  <MapPin size={48} className="mx-auto mb-3 text-cr-orange" strokeWidth={1.5} />
                  <p className="text-xs text-ink-mid font-story">
                    Google Maps 埋め込みエリア
                    <br />
                    （管理画面で設定）
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-5">
              <div className="flex gap-3">
                <MapPin size={20} className="mt-1 text-cr-orange shrink-0" />
                <div>
                  <h3 className="font-bold font-story text-ink mb-1">所在地</h3>
                  <p className="text-ink-mid text-sm leading-relaxed whitespace-pre-wrap">{accessContent || "住所未設定"}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone size={20} className="mt-1 text-cr-orange shrink-0" />
                <div>
                  <h3 className="font-bold font-story text-ink mb-1">お電話</h3>
                  <p className="text-ink-mid text-sm">TEL: {(accessMeta?.phone as string) || "03-1234-5678"}</p>
                  <p className="text-ink-light text-xs mt-1">{(accessMeta?.phone_hours as string) || "受付: 平日 9:00〜18:00"}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock size={20} className="mt-1 text-cr-orange shrink-0" />
                <div>
                  <h3 className="font-bold font-story text-ink mb-1">開所時間</h3>
                  <p className="text-ink-mid text-sm whitespace-pre-wrap">{(accessMeta?.opening_hours as string) || "平日: 放課後〜19:00\n土曜・長期休暇: 8:00〜19:00"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Inquiry — 見学申し込み・お問い合わせフォーム（折りたたみ） */}
      <details id="inquiry" className="group" style={{
        margin: "24px 40px 32px",
        background: "var(--page-deep)",
        border: "2px dashed var(--cr-yellow)",
        borderRadius: "12px",
        overflow: "hidden",
      }}>
        <summary className="cursor-pointer list-none text-center" style={{ padding: "28px 36px" }}>
          <div className="text-2xl mb-2"><Send size={24} className="inline text-cr-orange" /></div>
          <h2 className="font-story font-black text-ink" style={{ fontSize: "20px" }}>
            {(accessMeta?.visit_heading as string) || "見学のお申し込み"}
          </h2>
          <p className="text-sm text-ink-mid mt-2 whitespace-pre-wrap leading-relaxed">
            {(accessMeta?.visit_text as string) || "入所をご検討中の方は、お気軽にお電話ください。\n施設の見学は随時受け付けております。"}
          </p>
          <p className="mt-3 text-xs font-bold font-story text-cr-orange group-open:hidden">
            ▼ フォームを開く
          </p>
        </summary>
        <div style={{ padding: "0 36px 28px" }}>
          <div className="mx-auto max-w-lg">
            <InquiryForm />
          </div>
        </div>
      </details>
    </>
  );
}
