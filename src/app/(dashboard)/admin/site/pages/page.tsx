import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";

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
    <>
      <div className="main__hdr">
        <h1 className="main__title font-story">🌐 HP管理</h1>
      </div>

      <div className="flex gap-4 border-b border-border mb-6">
        <span className="pb-2 border-b-2 border-cr-orange text-cr-orange font-medium text-sm">
          ページ管理
        </span>
        <Link
          href="/admin/site/news"
          className="pb-2 border-b-2 border-transparent text-ink-mid hover:text-ink text-sm transition-colors"
        >
          お知らせ管理
        </Link>
      </div>

      <div className="control-board flex flex-col gap-4">
        {pages && pages.length > 0 ? (
          pages.map((page) => (
            <div key={page.slug} className="cms-card flex items-center justify-between">
              <div>
                <p className="cms-card__title">{page.title}</p>
                <p className="cms-card__slug">/{page.slug}</p>
                <p className="cms-card__date mt-1">
                  最終更新:{" "}
                  {new Date(page.updated_at).toLocaleDateString("ja-JP")}
                </p>
              </div>
              <Link
                href={`/admin/site/pages/${page.slug}/edit`}
                className="cms-card__edit"
              >
                編集
              </Link>
            </div>
          ))
        ) : (
          <p className="text-ink-mid">ページがありません</p>
        )}
      </div>
    </>
  );
}
