import Link from "next/link";
import { redirect } from "next/navigation";
import { Button, Card, CardContent } from "@/components/ui";
import { getUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { DeleteNewsButton } from "./delete-news-button";

export default async function AdminNewsListPage() {
  const user = await getUser();
  if (user.role !== "admin") redirect("/");

  const supabase = await createClient();
  const { data: newsList } = await supabase
    .from("site_news")
    .select("id, title, published_at")
    .order("published_at", { ascending: false })
    .returns<{ id: string; title: string; published_at: string }[]>();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-fg mb-6 font-story ink-bleed">⚙️ HP管理</h1>

      <div className="flex gap-4 border-b border-border mb-6">
        <Link
          href="/admin/site/pages"
          className="pb-2 border-b-2 border-transparent text-fg-muted hover:text-fg text-sm transition-colors"
        >
          ページ管理
        </Link>
        <span className="pb-2 border-b-2 border-accent text-accent font-medium text-sm">
          お知らせ管理
        </span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-fg">お知らせ一覧</h2>
        <Link href="/admin/site/news/new">
          <Button>新規作成</Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {newsList && newsList.length > 0 ? (
          newsList.map((news) => (
            <Card key={news.id}>
              <CardContent className="flex items-center justify-between gap-3">
                <Link
                  href={`/admin/site/news/${news.id}/edit`}
                  className="flex-1 min-w-0 hover:opacity-80 transition-opacity"
                >
                  <p className="font-medium text-fg truncate">{news.title}</p>
                  <p className="text-xs text-fg-muted mt-1">
                    {new Date(news.published_at).toLocaleDateString("ja-JP")}
                  </p>
                </Link>
                <Link
                  href={`/admin/site/news/${news.id}/edit`}
                  className="shrink-0 rounded-md border border-border bg-bg-elev px-3 py-1.5 text-xs text-fg hover:border-accent hover:text-accent transition-colors"
                >
                  編集
                </Link>
                <DeleteNewsButton id={news.id} />
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-fg-muted">お知らせはまだありません。</p>
        )}
      </div>
    </div>
  );
}
