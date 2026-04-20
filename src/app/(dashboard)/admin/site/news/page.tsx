import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { Button, Card, CardContent } from "@/components/ui";
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-fg">お知らせ管理</h1>
        <Link href="/admin/site/news/new">
          <Button>新規作成</Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {newsList && newsList.length > 0 ? (
          newsList.map((news) => (
            <Card key={news.id}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-fg">{news.title}</p>
                  <p className="text-xs text-fg-muted mt-1">
                    {new Date(news.published_at).toLocaleDateString("ja-JP")}
                  </p>
                </div>
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
