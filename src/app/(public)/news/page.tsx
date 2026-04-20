import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "お知らせ | 星ヶ丘こどもクラブ",
};

const dateFormat = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default async function NewsListPage() {
  const supabase = await createClient();
  const { data: newsList } = await supabase
    .from("site_news")
    .select("id, title, body, published_at")
    .order("published_at", { ascending: false })
    .returns<
      { id: string; title: string; body: string; published_at: string }[]
    >();

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="text-2xl font-bold text-fg sm:text-3xl">お知らせ一覧</h1>

      <div className="mt-8 flex flex-col gap-4">
        {newsList && newsList.length > 0 ? (
          newsList.map((news) => (
            <Link key={news.id} href={`/news/${news.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent>
                  <p className="text-xs text-fg-muted">
                    {dateFormat.format(new Date(news.published_at))}
                  </p>
                  <h2 className="mt-1 text-base font-bold text-fg">
                    {news.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                    {news.body.length > 100
                      ? `${news.body.slice(0, 100)}…`
                      : news.body}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <p className="text-fg-muted">お知らせはまだありません。</p>
        )}
      </div>
    </section>
  );
}
