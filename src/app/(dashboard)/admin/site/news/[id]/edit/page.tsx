import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui";
import { getAttachments } from "@/lib/attachments/actions";
import { getUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { EditNewsForm } from "./edit-news-form";
import { getNewsRevisions, type NewsRevision } from "../../actions";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default async function EditNewsPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getUser();
  if (user.role !== "admin") redirect("/");

  const supabase = await createClient();

  // Fetch the news entry, its current attachments, and its revision
  // history in parallel — these are independent reads.
  const [newsRes, attachments, revisions] = await Promise.all([
    supabase.from("site_news").select("id, title, body, published_at").eq("id", id).single(),
    getAttachments("news", id),
    getNewsRevisions(id),
  ]);

  if (newsRes.error || !newsRes.data) {
    notFound();
  }

  const news = newsRes.data;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4">
        <Link href="/admin/site/news" className="text-sm text-fg-muted hover:text-fg">
          ← お知らせ一覧に戻る
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-fg mb-2 font-story ink-bleed">📝 お知らせを編集</h1>
      <p className="text-xs text-fg-muted mb-6">
        投稿日: {news.published_at ? formatTimestamp(news.published_at) : "—"}
      </p>

      <EditNewsForm id={id} title={news.title} body={news.body} attachments={attachments} />

      {revisions.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-fg mb-4">📜 修正履歴 ({revisions.length})</h2>
          <p className="text-xs text-fg-muted mb-4">
            保存ごとに 1 件追加されます。各履歴は編集 <em>前</em> の内容です。
          </p>
          <ol className="flex flex-col gap-3">
            {revisions.map((rev) => (
              <RevisionItem key={rev.id} rev={rev} />
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function RevisionItem({ rev }: { rev: NewsRevision }) {
  return (
    <li className="rounded-md border border-border bg-bg-elev p-4">
      <details>
        <summary className="cursor-pointer list-none flex items-center justify-between text-sm">
          <span className="font-medium text-fg">{formatTimestamp(rev.edited_at)} 編集</span>
          <span className="text-xs text-fg-muted">展開 ▼</span>
        </summary>
        <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3">
          <div>
            <p className="text-xs text-fg-muted mb-1">タイトル</p>
            <p className="text-sm text-fg">{rev.title}</p>
          </div>
          <div>
            <p className="text-xs text-fg-muted mb-1">本文</p>
            <p className="text-sm text-fg whitespace-pre-wrap">{rev.body}</p>
          </div>
          {rev.attachments.length > 0 && (
            <div>
              <p className="text-xs text-fg-muted mb-1">添付ファイル ({rev.attachments.length})</p>
              <ul className="flex flex-col gap-1 text-sm text-fg">
                {rev.attachments.map((a) => (
                  <li key={a.id} className="text-xs">
                    {a.file_name}
                    <span className="ml-2 text-fg-muted">{formatBytes(a.file_size)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </details>
      <div className="mt-2 flex justify-end">
        <Link href={`#`} aria-hidden className="hidden">
          {/* placeholder to satisfy structure; revert action lives in a
              follow-up PR per the user's stated scope. */}
        </Link>
        <Button type="button" variant="ghost" size="sm" disabled aria-disabled>
          履歴から復元（後日）
        </Button>
      </div>
    </li>
  );
}
