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

const features = [
  {
    icon: QrCode,
    title: "安全管理（QR入退場）",
    description:
      "専用QRコードで入室・退室をワンタッチ記録。保護者のスマホにリアルタイムで通知が届きます。",
  },
  {
    icon: Megaphone,
    title: "連絡配信",
    description:
      "行事予定やお知らせをアプリから配信。紙のプリントをなくし、既読確認も可能です。",
  },
  {
    icon: Camera,
    title: "写真共有",
    description:
      "施設での活動写真を保護者限定で安全に共有。行事の様子をいつでも振り返れます。",
  },
  {
    icon: Receipt,
    title: "請求管理",
    description:
      "延長保育の料金を退室時間から自動計算。月次の請求書をオンラインで確認できます。",
  },
] as const;

const DEFAULT_HERO_TEXT =
  "星ヶ丘こどもクラブは、保護者の手で運営する学童保育施設です。約30名の児童が、宿題・遊び・おやつの時間を通じて、のびのびと放課後を過ごしています。";

export default async function HomePage() {
  let heroText = DEFAULT_HERO_TEXT;
  try {
    const supabase = await createClient();
    const { data: homePage } = await supabase
      .from("site_pages")
      .select("content")
      .eq("slug", "home")
      .single() as { data: { content: string } | null };

    if (homePage?.content) {
      heroText = homePage.content;
    }
  } catch {
    // DB接続エラー時はデフォルトテキストを使用
  }
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-accent-light/60 to-bg py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-semibold tracking-wide text-accent">
                父母運営型 学童保育
              </p>
              <h1 className="text-3xl font-bold leading-tight text-fg sm:text-4xl lg:text-5xl">
                子どもたちの
                <br />
                笑顔あふれる放課後を
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-fg-muted sm:text-lg whitespace-pre-wrap">
                {heroText}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hv"
                >
                  施設について詳しく
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/access"
                  className="inline-flex items-center gap-2 rounded-md border border-border bg-bg-elev px-5 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-accent-light"
                >
                  <MapPin size={16} />
                  見学のお申し込み
                </Link>
              </div>
            </div>

            {/* Hero image placeholder */}
            <div className="flex items-center justify-center rounded-2xl bg-accent-light/50 p-12 lg:aspect-[4/3]">
              <div className="text-center text-accent/60">
                <Camera size={48} strokeWidth={1.5} className="mx-auto mb-3" />
                <p className="text-sm font-medium">
                  子どもたちの笑顔があふれる
                  <br />
                  放課後の風景
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-bg py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-fg sm:text-3xl">
            施設の特徴
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-fg-muted">
            デジタルの力で、保護者の安心と運営の効率化を両立します。
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border border-border bg-bg-elev p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent-light text-accent">
                  <feature.icon size={22} strokeWidth={1.75} />
                </div>
                <h3 className="text-base font-bold text-fg">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-accent-light/40 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-fg sm:text-3xl">
            見学・お問い合わせ
          </h2>
          <p className="mt-3 text-fg-muted">
            入所をご検討の方は、お気軽にお電話またはお問い合わせください。
            <br />
            施設の見学も随時受け付けております。
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/access"
              className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hv"
            >
              <MapPin size={16} />
              アクセス・お問い合わせ
            </Link>
            <span className="text-sm text-fg-muted">
              TEL: 03-1234-5678（平日 9:00〜18:00）
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
