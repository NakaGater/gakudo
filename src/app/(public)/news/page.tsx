import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";


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
    <section className="news-section" style={{ maxWidth: "720px", margin: "0 auto", padding: "32px 24px", width: "100%", position: "relative" }}>
      <div className="font-hand text-xs text-cr-orange mb-2">📖 だい２しょう</div>
      <h1 className="font-story font-black text-ink" style={{ fontSize: "28px" }}>
        <span className="crayon-underline">お知らせ</span>一覧
      </h1>
      <p className="text-sm text-ink-mid mt-2 font-story">
        星ヶ丘こどもクラブからの最新情報をお届けします。
      </p>

      <div className="flex flex-col gap-4 mt-6">
        {newsList && newsList.length > 0 ? (
          newsList.map((news) => (
            <Link key={news.id} href={`/news/${news.id}`} className="news-card">
              <p className="news-card__date">
                {dateFormat.format(new Date(news.published_at))}
              </p>
              <h2 className="news-card__title">{news.title}</h2>
              <p className="news-card__body">
                {news.body.length > 100 ? `${news.body.slice(0, 100)}…` : news.body}
              </p>
            </Link>
          ))
        ) : (
          <div className="gallery-empty">
            <div className="gallery-empty__icon">📢</div>
            <div className="gallery-empty__text">お知らせはまだないよ</div>
            <div className="gallery-empty__sub">あたらしいニュースをまっててね ⭐</div>
          </div>
        )}
      </div>
    </section>
  );
}
