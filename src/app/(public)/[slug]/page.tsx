import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MapPin, Clock, Phone, Send } from "lucide-react";
import { InquiryForm } from "@/app/(public)/access/inquiry-form";
import { FaqAccordion } from "@/app/(public)/components/faq-accordion";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_pages")
      .select("title")
      .eq("slug", slug)
      .single() as { data: { title: string } | null };

    if (!data) return { title: "ページが見つかりません" };
    return { title: `${data.title} — 星ヶ丘こどもクラブ` };
  } catch {
    return { title: "ページが見つかりません" };
  }
}

export default async function SitePage({ params }: PageProps) {
  const { slug } = await params;

  // news と gallery は専用ページがあるためスキップ
  if (slug === "news" || slug === "gallery") notFound();

  let page: { title: string; content: string; updated_at: string; metadata: Record<string, unknown> } | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("site_pages")
      .select("title, content, updated_at, metadata")
      .eq("slug", slug)
      .single() as { data: { title: string; content: string; updated_at: string; metadata: Record<string, unknown> } | null };
    page = data;
  } catch {
    notFound();
  }

  if (!page) notFound();

  if (slug === "access") {
    return <AccessPage title={page.title} content={page.content} metadata={page.metadata} />;
  }

  if (slug === "about") {
    return <AboutPage title={page.title} content={page.content} metadata={page.metadata} />;
  }

  if (slug === "faq") {
    return <FaqPage title={page.title} content={page.content} metadata={page.metadata} />;
  }

  if (slug === "daily-life") {
    return <DailyLifePage title={page.title} content={page.content} metadata={page.metadata} />;
  }

  // 汎用ページ
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-story font-black text-ink ink-bleed mb-4" style={{ fontSize: "28px" }}>
        <span className="crayon-underline">{page.title}</span>
      </h1>
      <div className="text-sm text-ink-mid leading-relaxed whitespace-pre-wrap">
        {page.content}
      </div>
    </div>
  );
}

function AboutPage({ title, content, metadata }: { title: string; content: string; metadata: Record<string, unknown> }) {
  const subtitle = (metadata?.subtitle as string) || "子どもたちが「ただいま！」と駆け込んでくる、あたたかい居場所です。";
  const visionHeading = (metadata?.vision_heading as string) || "私たちの想い";
  const visionEmoji = (metadata?.vision_emoji as string) || "🏠";
  const visionTagline = (metadata?.vision_tagline as string) || "家庭のようなあたたかさ";
  const schedule = (metadata?.schedule as Array<{ time: string; label: string; emoji: string }>) || [
    { time: "14:00", label: "入室・宿題タイム", emoji: "📝" },
    { time: "15:30", label: "おやつ", emoji: "🍪" },
    { time: "16:00", label: "自由遊び・活動", emoji: "⚽" },
    { time: "18:00", label: "お迎え・退室", emoji: "👋" },
  ];
  const facilityInfo = (metadata?.facility_info as Array<{ label: string; value: string }>) || [
    { label: "施設名", value: "星ヶ丘こどもクラブ" },
    { label: "運営形態", value: "父母運営型 学童保育" },
    { label: "対象", value: "小学1〜6年生" },
    { label: "定員", value: "約30名" },
    { label: "開所時間", value: "平日 放課後〜19:00 / 土曜・長期休暇 8:00〜19:00" },
    { label: "休所日", value: "日曜・祝日・年末年始" },
  ];

  return (
    <>
      <section style={{ padding: "32px 24px 0" }}>
        <div className="mx-auto max-w-4xl text-center">
          <div className="font-hand text-xs text-cr-orange mb-2">📖 だい３しょう</div>
          <h1 className="font-story font-black text-ink ink-bleed" style={{ fontSize: "28px" }}>
            <span className="crayon-underline">{title}</span>
          </h1>
          <p className="mt-3 text-sm text-ink-mid leading-relaxed max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>
      </section>

      <section style={{ padding: "24px 24px" }}>
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <h2 className="font-story font-bold text-ink text-lg mb-3">{visionHeading}</h2>
              <div className="text-sm text-ink-mid leading-relaxed whitespace-pre-wrap">
                {content}
              </div>
            </div>
            <div className="rounded-xl bg-page-deep border-2 border-page-edge p-8 text-center shadow-[4px_4px_0_var(--page-edge)]">
              <p className="text-5xl mb-3">{visionEmoji}</p>
              <p className="text-sm font-bold font-story text-cr-orange">
                {visionTagline}
              </p>
            </div>
          </div>
        </div>
      </section>

      {schedule.length > 0 && (
        <section style={{ padding: "24px 24px", background: "linear-gradient(180deg, transparent, rgba(255,217,61,.03), transparent)" }}>
          <div className="mx-auto max-w-4xl">
            <h2 className="font-story font-black text-ink text-center mb-6" style={{ fontSize: "20px" }}>
              <span className="crayon-underline">1日の流れ</span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {schedule.map((item, i) => {
                const rotations = ["-1deg", "0.8deg", "-0.5deg", "1.2deg"];
                const colors = ["#FFF8C5", "#D5F5E3", "#D6EEF8", "#FFE0E8"];
                return (
                  <div key={item.time} className="sticky-note p-5 text-center" style={{
                    background: colors[i % 4],
                    transform: `rotate(${rotations[i % 4]})`,
                  }}>
                    <p className="text-3xl mb-2">{item.emoji}</p>
                    <p className="text-sm font-bold font-story text-cr-orange">{item.time}</p>
                    <p className="text-xs text-ink-mid mt-1">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {facilityInfo.length > 0 && (
        <section style={{ padding: "24px 24px 32px" }}>
          <div className="mx-auto max-w-4xl">
            <h2 className="font-story font-black text-ink text-center mb-6" style={{ fontSize: "20px" }}>
              <span className="crayon-underline">施設概要</span>
            </h2>
            <div className="overflow-hidden rounded-xl border-2 border-page-edge shadow-[2px_2px_0_var(--page-edge)]">
              <table className="w-full text-sm">
                <tbody>
                  {facilityInfo.map((item) => (
                    <tr key={item.label} className="border-b border-page-edge last:border-b-0">
                      <th className="bg-page-deep px-4 py-3 text-left font-bold font-story text-ink w-1/3">{item.label}</th>
                      <td className="px-4 py-3 text-ink-mid">{item.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function FaqPage({ title, content, metadata }: { title: string; content: string; metadata: Record<string, unknown> }) {
  const subtitle = (metadata?.subtitle as string) || "はじめての方もご安心ください。";
  const questions = (metadata?.questions as Array<{ q: string; a: string }>) || [];

  return (
    <>
      <section style={{ padding: "32px 24px 0" }}>
        <div className="mx-auto max-w-4xl text-center">
          <div className="font-hand text-xs text-cr-orange mb-2">📖 だい５しょう</div>
          <h1 className="font-story font-black text-ink ink-bleed" style={{ fontSize: "28px" }}>
            <span className="crayon-underline">{title}</span>
          </h1>
          <p className="mt-3 text-sm text-ink-mid">{subtitle}</p>
          {content && (
            <p className="mt-2 text-sm text-ink-mid leading-relaxed max-w-2xl mx-auto">{content}</p>
          )}
        </div>
      </section>

      <section style={{ padding: "24px 24px 40px" }}>
        <div className="mx-auto max-w-3xl">
          {questions.length > 0 ? (
            <FaqAccordion questions={questions} />
          ) : (
            <p className="text-center text-ink-mid text-sm">質問はまだ登録されていません。</p>
          )}
        </div>
      </section>

      <section style={{ padding: "0 24px 40px" }}>
        <div className="mx-auto max-w-3xl text-center">
          <div className="rounded-xl bg-page-deep border-2 border-page-edge p-6 shadow-[2px_2px_0_var(--page-edge)]">
            <p className="text-sm text-ink font-story font-bold mb-2">
              💬 その他のご質問は
            </p>
            <p className="text-xs text-ink-mid leading-relaxed">
              お気軽に<a href="/access" className="text-cr-orange font-bold hover:underline">お問い合わせフォーム</a>からご連絡ください。
              <br />見学のお申し込みも随時受け付けております。
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function DailyLifePage({ title, content, metadata }: { title: string; content: string; metadata: Record<string, unknown> }) {
  const subtitle = (metadata?.subtitle as string) || "のびのび、すくすく。放課後の「もうひとつの家」";
  const activities = (metadata?.activities as Array<{ emoji: string; title: string; description: string }>) || [];
  const events = (metadata?.events as Array<{ emoji: string; title: string; season: string }>) || [];
  const philosophyHeading = (metadata?.philosophy_heading as string) || "親と子の「共育ち」";
  const philosophyEmoji = (metadata?.philosophy_emoji as string) || "🤝";
  const philosophyText = (metadata?.philosophy_text as string) || "";

  const seasonColors: Record<string, string> = {
    "春": "#FFE0F0",
    "夏": "#D6EEF8",
    "秋": "#FFF3CD",
    "冬": "#E8F0FE",
    "通年": "#D5F5E3",
  };

  return (
    <>
      <section style={{ padding: "32px 24px 0" }}>
        <div className="mx-auto max-w-4xl text-center">
          <div className="font-hand text-xs text-cr-orange mb-2">📖 だい４しょう</div>
          <h1 className="font-story font-black text-ink ink-bleed" style={{ fontSize: "28px" }}>
            <span className="crayon-underline">{title}</span>
          </h1>
          <p className="mt-3 text-sm text-ink-mid">{subtitle}</p>
          {content && (
            <p className="mt-2 text-sm text-ink-mid leading-relaxed max-w-2xl mx-auto">{content}</p>
          )}
        </div>
      </section>

      {activities.length > 0 && (
        <section style={{ padding: "24px 24px" }}>
          <div className="mx-auto max-w-4xl">
            <h2 className="font-story font-black text-ink text-center mb-6" style={{ fontSize: "20px" }}>
              <span className="crayon-underline">毎日の活動</span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activities.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border-2 border-page-edge p-5 bg-page shadow-[2px_2px_0_var(--page-edge)] hover:shadow-[3px_3px_0_var(--page-edge)] transition-shadow"
                >
                  <p className="text-3xl mb-2">{item.emoji}</p>
                  <h3 className="font-story font-bold text-ink text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-ink-mid leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {events.length > 0 && (
        <section style={{ padding: "24px 24px", background: "linear-gradient(180deg, transparent, rgba(255,217,61,.03), transparent)" }}>
          <div className="mx-auto max-w-4xl">
            <h2 className="font-story font-black text-ink text-center mb-6" style={{ fontSize: "20px" }}>
              <span className="crayon-underline">季節の行事</span>
            </h2>
            <div className="flex flex-wrap gap-3 justify-center">
              {events.map((item) => (
                <div
                  key={item.title}
                  className="sticky-note px-4 py-3 text-center"
                  style={{
                    background: seasonColors[item.season] || "#FFF8C5",
                    transform: `rotate(${(Math.random() * 3 - 1.5).toFixed(1)}deg)`,
                    minWidth: "120px",
                  }}
                >
                  <p className="text-2xl mb-1">{item.emoji}</p>
                  <p className="text-xs font-bold font-story text-ink">{item.title}</p>
                  <p className="text-[10px] text-ink-mid mt-0.5">{item.season}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {philosophyText && (
        <section style={{ padding: "24px 24px 40px" }}>
          <div className="mx-auto max-w-3xl">
            <div className="rounded-xl bg-page-deep border-2 border-page-edge p-8 shadow-[4px_4px_0_var(--page-edge)]">
              <div className="text-center mb-4">
                <p className="text-4xl mb-2">{philosophyEmoji}</p>
                <h2 className="font-story font-black text-ink" style={{ fontSize: "20px" }}>
                  <span className="crayon-underline">{philosophyHeading}</span>
                </h2>
              </div>
              <p className="text-sm text-ink-mid leading-relaxed whitespace-pre-wrap text-center">
                {philosophyText}
              </p>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function AccessPage({ title, content, metadata }: { title: string; content: string; metadata: Record<string, unknown> }) {
  const subtitle = (metadata?.subtitle as string) || "お気軽にお越しください。見学も随時受け付けております。";
  const phone = (metadata?.phone as string) || "03-1234-5678";
  const phoneHours = (metadata?.phone_hours as string) || "受付: 平日 9:00〜18:00";
  const openingHours = (metadata?.opening_hours as string) || "平日: 放課後〜19:00\n土曜・長期休暇: 8:00〜19:00";
  const visitHeading = (metadata?.visit_heading as string) || "見学のお申し込み";
  const visitText = (metadata?.visit_text as string) || "入所をご検討中の方は、お気軽にお電話ください。\n施設の見学は随時受け付けております。";
  const mapEmbedUrl = (metadata?.map_embed_url as string) || "";

  return (
    <>
      <section style={{ padding: "32px 24px 0" }}>
        <div className="mx-auto max-w-4xl text-center">
          <div className="font-hand text-xs text-cr-orange mb-2">📖 だい４しょう</div>
          <h1 className="font-story font-black text-ink ink-bleed" style={{ fontSize: "28px" }}>
            <span className="crayon-underline">{title}</span>
          </h1>
          <p className="mt-3 text-sm text-ink-mid">
            {subtitle}
          </p>
        </div>
      </section>

      <section style={{ padding: "24px 24px" }}>
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-xl bg-page-deep border-2 border-page-edge flex items-center justify-center aspect-square md:aspect-auto shadow-[4px_4px_0_var(--page-edge)] overflow-hidden">
              {mapEmbedUrl ? (
                <iframe
                  src={mapEmbedUrl}
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
                  <p className="text-ink-mid text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone size={20} className="mt-1 text-cr-orange shrink-0" />
                <div>
                  <h3 className="font-bold font-story text-ink mb-1">お電話</h3>
                  <p className="text-ink-mid text-sm">TEL: {phone}</p>
                  <p className="text-ink-light text-xs mt-1">{phoneHours}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock size={20} className="mt-1 text-cr-orange shrink-0" />
                <div>
                  <h3 className="font-bold font-story text-ink mb-1">開所時間</h3>
                  <p className="text-ink-mid text-sm whitespace-pre-wrap">{openingHours}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{
        padding: "28px 36px",
        margin: "0 24px 32px",
        background: "var(--page-deep)",
        border: "2px dashed var(--cr-yellow)",
        borderRadius: "12px",
      }}>
        <div className="text-center mb-5">
          <div className="text-2xl mb-2"><Send size={24} className="inline text-cr-orange" /></div>
          <h2 className="font-story font-black text-ink" style={{ fontSize: "20px" }}>{visitHeading}</h2>
          <p className="text-sm text-ink-mid mt-2 whitespace-pre-wrap leading-relaxed">
            {visitText}
          </p>
        </div>
        <div className="mx-auto max-w-lg">
          <InquiryForm />
        </div>
        <p className="text-center text-xs text-ink-light mt-4">
          お電話でも受付中: <a href={`tel:${phone.replace(/-/g, "")}`} className="text-cr-orange hover:underline">{phone}</a>（{phoneHours}）
        </p>
      </section>
    </>
  );
}
