import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MapPin, Clock, Phone } from "lucide-react";

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

  // 汎用ページ
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-fg mb-6">{page.title}</h1>
      <div className="prose prose-stone max-w-none text-fg-muted leading-relaxed whitespace-pre-wrap">
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
      {/* ヒーロー */}
      <section className="bg-gradient-to-b from-amber-50 to-bg py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h1 className="text-3xl font-bold text-fg sm:text-4xl">{title}</h1>
          <p className="mt-4 text-lg text-fg-muted max-w-2xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>
      </section>

      {/* 理念 */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="grid gap-10 md:grid-cols-2 items-center">
            <div>
              <h2 className="text-2xl font-bold text-fg mb-4">{visionHeading}</h2>
              <div className="text-fg-muted leading-relaxed whitespace-pre-wrap">
                {content}
              </div>
            </div>
            <div className="rounded-2xl bg-amber-50 p-10 text-center">
              <p className="text-6xl mb-4">{visionEmoji}</p>
              <p className="text-sm font-medium text-amber-700">
                {visionTagline}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 1日の流れ */}
      {schedule.length > 0 && (
        <section className="bg-amber-50/50 py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-fg text-center mb-10">1日の流れ</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {schedule.map((item) => (
                <div key={item.time} className="rounded-lg border border-border bg-bg p-5 text-center shadow-sm">
                  <p className="text-3xl mb-2">{item.emoji}</p>
                  <p className="text-sm font-bold text-accent">{item.time}</p>
                  <p className="text-sm text-fg-muted mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 概要 */}
      {facilityInfo.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-fg text-center mb-8">施設概要</h2>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <tbody>
                  {facilityInfo.map((item) => (
                    <tr key={item.label} className="border-b border-border last:border-b-0">
                      <th className="bg-amber-50 px-4 py-3 text-left font-medium text-fg w-1/3">{item.label}</th>
                      <td className="px-4 py-3 text-fg-muted">{item.value}</td>
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

function AccessPage({ title, content, metadata }: { title: string; content: string; metadata: Record<string, unknown> }) {
  const subtitle = (metadata?.subtitle as string) || "お気軽にお越しください。見学も随時受け付けております。";
  const phone = (metadata?.phone as string) || "03-1234-5678";
  const phoneHours = (metadata?.phone_hours as string) || "受付: 平日 9:00〜18:00";
  const openingHours = (metadata?.opening_hours as string) || "平日: 放課後〜19:00\n土曜・長期休暇: 8:00〜19:00";
  const visitHeading = (metadata?.visit_heading as string) || "見学のお申し込み";
  const visitText = (metadata?.visit_text as string) || "入所をご検討中の方は、お気軽にお電話ください。\n施設の見学は随時受け付けております。";

  return (
    <>
      {/* ヒーロー */}
      <section className="bg-gradient-to-b from-amber-50 to-bg py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h1 className="text-3xl font-bold text-fg sm:text-4xl">{title}</h1>
          <p className="mt-4 text-lg text-fg-muted">
            {subtitle}
          </p>
        </div>
      </section>

      {/* 地図 + 情報 */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="grid gap-8 md:grid-cols-2">
            {/* 地図プレースホルダー */}
            <div className="rounded-2xl bg-stone-100 flex items-center justify-center aspect-square md:aspect-auto">
              <div className="text-center p-8">
                <MapPin size={48} className="mx-auto mb-3 text-accent" strokeWidth={1.5} />
                <p className="text-sm text-fg-muted">
                  Google Maps 埋め込みエリア
                  <br />
                  （本番環境で設定）
                </p>
              </div>
            </div>

            {/* アクセス情報 */}
            <div className="space-y-6">
              <div className="flex gap-3">
                <MapPin size={20} className="mt-1 text-accent shrink-0" />
                <div>
                  <h3 className="font-bold text-fg mb-1">所在地</h3>
                  <p className="text-fg-muted text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Phone size={20} className="mt-1 text-accent shrink-0" />
                <div>
                  <h3 className="font-bold text-fg mb-1">お電話</h3>
                  <p className="text-fg-muted text-sm">TEL: {phone}</p>
                  <p className="text-fg-muted text-xs mt-1">{phoneHours}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Clock size={20} className="mt-1 text-accent shrink-0" />
                <div>
                  <h3 className="font-bold text-fg mb-1">開所時間</h3>
                  <p className="text-fg-muted text-sm whitespace-pre-wrap">
                    {openingHours}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 見学申し込み */}
      <section className="bg-amber-50/50 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-fg mb-4">{visitHeading}</h2>
          <p className="text-fg-muted mb-6 whitespace-pre-wrap">
            {visitText}
          </p>
          <a
            href={`tel:${phone.replace(/-/g, "")}`}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hv"
          >
            <Phone size={16} />
            {phone} に電話する
          </a>
        </div>
      </section>
    </>
  );
}
