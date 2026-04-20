import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

type Props = { params: Promise<{ id: string }> };

const dateFormat = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

// generateStaticParams removed — createClient() uses cookies() which is
// unavailable at build time. Pages are rendered dynamically instead.

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_news")
    .select("title")
    .eq("id", id)
    .single<{ title: string }>();

  return {
    title: data
      ? `${data.title} | お知らせ | 星ヶ丘こどもクラブ`
      : "お知らせ | 星ヶ丘こどもクラブ",
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: news } = await supabase
    .from("site_news")
    .select("id, title, body, published_at")
    .eq("id", id)
    .single<{
      id: string;
      title: string;
      body: string;
      published_at: string;
    }>();

  if (!news) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <Link
        href="/news"
        className="inline-flex items-center gap-1 text-sm text-accent hover:text-accent-hv transition-colors"
      >
        <ArrowLeft size={16} />
        お知らせ一覧へ戻る
      </Link>

      <h1 className="mt-6 text-2xl font-bold text-fg sm:text-3xl">
        {news.title}
      </h1>
      <p className="mt-2 text-sm text-fg-muted">
        {dateFormat.format(new Date(news.published_at))}
      </p>

      <div className="mt-8 whitespace-pre-wrap text-base leading-relaxed text-fg">
        {news.body}
      </div>
    </article>
  );
}
