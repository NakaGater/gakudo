import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";

const PAGE_ORDER: Record<string, { order: number; icon: string; description: string }> = {
  home: { order: 1, icon: "🏠", description: "トップページ（アクセス情報含む）" },
  about: { order: 2, icon: "📖", description: "施設紹介・職員紹介・施設概要" },
  "daily-life": { order: 3, icon: "🌈", description: "活動内容・季節行事" },
  enrollment: { order: 4, icon: "📋", description: "料金・入所手続き" },
  faq: { order: 5, icon: "❓", description: "よくある質問" },
};

export default async function SitePagesPage() {
  const user = await getUser();
  if (user.role !== "admin") redirect("/");

  const supabase = await createClient();
  const { data: pages } = await supabase
    .from("site_pages")
    .select("slug, title, updated_at")
    .returns<{ slug: string; title: string; updated_at: string }[]>();

  const sorted = (pages ?? [])
    .filter((p) => p.slug in PAGE_ORDER)
    .sort((a, b) => PAGE_ORDER[a.slug]!.order - PAGE_ORDER[b.slug]!.order);

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
        {sorted.length > 0 ? (
          sorted.map((page) => {
            const info = PAGE_ORDER[page.slug];
            return (
              <div key={page.slug} className="cms-card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {info && <span className="text-2xl">{info.icon}</span>}
                  <div>
                    <p className="cms-card__title">{page.title}</p>
                    {info && <p className="text-xs text-ink-light mt-0.5">{info.description}</p>}
                    <p className="cms-card__date mt-1">
                      最終更新: {new Date(page.updated_at).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                </div>
                <Link href={`/admin/site/pages/${page.slug}/edit`} className="cms-card__edit">
                  編集
                </Link>
              </div>
            );
          })
        ) : (
          <p className="text-ink-mid">ページがありません</p>
        )}
      </div>
    </>
  );
}
