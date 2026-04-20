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
      <h1 className="text-2xl font-bold text-fg mb-6">サイトページ管理</h1>

      <div className="flex flex-col gap-4">
        {pages && pages.length > 0 ? (
          pages.map((page) => (
            <Card key={page.slug}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-fg">{page.title}</p>
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
