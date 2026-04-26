import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AttachmentList } from "@/components/attachments/attachment-list";
import { getAttachments, getAttachmentUrl } from "@/lib/attachments/actions";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

const dateFormat = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

// News content rarely changes within an hour. ISR caches the rendered
// page (and its generateMetadata response) per id and refreshes lazily.
// Background refresh keeps stale-while-revalidate semantics; staff can
// trigger immediate refresh via revalidatePath in the news editor.
//
// Build-time pre-rendering via generateStaticParams stays disabled
// because createClient() depends on cookies() which is not available
// during `next build`. Per-request ISR still gives us the cache hit.
export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_news")
    .select("title")
    .eq("id", id)
    .single<{ title: string }>();

  return {
    title: data ? `${data.title} | お知らせ | 星ヶ丘こどもクラブ` : "お知らせ | 星ヶ丘こどもクラブ",
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

  // 添付ファイル取得（URL生成を並列化）
  const attachments = await getAttachments("news", id);
  const urls = await Promise.all(attachments.map((att) => getAttachmentUrl(att.file_path)));
  const downloadUrls: Record<string, string> = {};
  attachments.forEach((att, i) => {
    if (urls[i]) downloadUrls[att.id] = urls[i];
  });

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
          <AttachmentList attachments={attachments} downloadUrls={downloadUrls} />
        </div>
      )}
    </article>
  );
}
