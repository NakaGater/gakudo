import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { Card, CardContent } from "@/components/ui";

export default async function SitePagesPage() {
  const user = await getUser();
  if (user.role !== "admin") redirect("/");

  const supabase = await createClient();
  const { data: pages } = await supabase
    .from("site_pages")
    .select("slug, title, updated_at")
    .order("slug")
    .returns<{ slug: string; title: string; updated_at: string }[]>();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-fg mb-6 font-story ink-bleed">⚙️ HP管理</h1>

      <div className="flex gap-4 border-b border-border mb-6">
        <span className="pb-2 border-b-2 border-accent text-accent font-medium text-sm">
          ページ管理
        </span>
        <Link
          href="/admin/site/news"
          className="pb-2 border-b-2 border-transparent text-fg-muted hover:text-fg text-sm transition-colors"
        >
          お知らせ管理
        </Link>
      </div>

      <div className="control-board flex flex-col gap-4">
        {pages && pages.length > 0 ? (
          pages.map((page) => (
            <Card key={page.slug}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-fg font-story">{page.title}</p>
                  <p className="text-sm text-fg-muted">/{page.slug}</p>
                  <p className="text-xs text-fg-muted mt-1">
                    最終更新:{" "}
                    {new Date(page.updated_at).toLocaleDateString("ja-JP")}
                  </p>
                </div>
                <Link
                  href={`/admin/site/pages/${page.slug}/edit`}
                  className="text-sm font-medium text-accent hover:text-accent-hv transition-colors"
                >
                  編集
                </Link>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-fg-muted">ページがありません</p>
        )}
      </div>
    </div>
  );
}
