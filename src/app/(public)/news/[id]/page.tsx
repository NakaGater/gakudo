import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import { getAttachments, getAttachmentUrl } from "@/lib/attachments/actions";
import { AttachmentList } from "@/components/attachments/attachment-list";

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

  // 添付ファイル取得
  const attachments = await getAttachments("news", id);
  const downloadUrls: Record<string, string> = {};
  for (const att of attachments) {
    const url = await getAttachmentUrl(att.file_path);
    if (url) downloadUrls[att.id] = url;
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-cr-orange hover:underline transition-colors font-story"
      >
        <ArrowLeft size={16} />
        トップページへ戻る
      </Link>

      <h1 className="mt-6 font-story font-black text-ink ink-bleed" style={{ fontSize: "24px" }}>
        <span className="crayon-underline">{news.title}</span>
      </h1>
      <p className="mt-2 text-xs text-ink-light font-hand">
        {dateFormat.format(new Date(news.published_at))}
      </p>

      <div className="mt-8 whitespace-pre-wrap text-sm leading-relaxed text-ink-mid">
        {news.body}
      </div>

      {attachments.length > 0 && (
        <div className="mt-8">
          <AttachmentList
            attachments={attachments}
            downloadUrls={downloadUrls}
          />
        </div>
      )}
    </article>
  );
}
