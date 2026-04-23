import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { isStaff } from "@/lib/auth/roles";
import { Button } from "@/components/ui";
import { InstagramAddForm } from "./instagram-add-form";
import { deleteInstagramPost, toggleInstagramPostVisibility } from "./actions";
import type { Database } from "@/lib/supabase/types";

type IgPost = Database["public"]["Tables"]["instagram_posts"]["Row"];

export default async function InstagramManagePage() {
  const user = await getUser();
  if (!isStaff(user.role)) {
    return <p className="text-center py-12 text-ink-mid">スタッフのみアクセスできます</p>;
  }

  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("instagram_posts")
    .select("*")
    .order("display_order", { ascending: true });

  const postList: IgPost[] = posts ?? [];

  return (
    <>
      <div className="main__hdr">
        <h1 className="main__title font-story">📷 写真管理</h1>
      </div>

      <div className="flex gap-4 border-b border-border mb-6">
        <Link
          href="/photos"
          className="pb-2 border-b-2 border-transparent text-ink-mid hover:text-ink text-sm transition-colors"
        >
          写真管理
        </Link>
        <span className="pb-2 border-b-2 border-cr-orange text-cr-orange font-medium text-sm">
          Instagram連携
        </span>
      </div>

      <p className="text-sm text-ink-mid mb-4">
        Instagram投稿のURLを登録すると、フォトギャラリーに埋め込み表示されます。
      </p>

      <InstagramAddForm />

      <div className="mt-8">
        <h2 className="text-sm font-bold text-ink mb-3">
          登録済み投稿（{postList.length}件）
        </h2>

        {postList.length === 0 ? (
          <p className="text-ink-mid text-center py-8">
            まだInstagram投稿が登録されていません
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {postList.map((post) => (
              <div
                key={post.id}
                className="ig-post-card"
              >
                <div className="ig-post-card__info">
                  <a
                    href={post.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-cr-blue hover:underline break-all"
                  >
                    {post.post_url}
                  </a>
                  {post.caption && (
                    <p className="text-xs text-ink-mid mt-1">📝 {post.caption}</p>
                  )}
                  <p className="text-[10px] text-ink-light mt-1">
                    登録: {post.created_at ? new Date(post.created_at).toLocaleDateString("ja-JP") : "不明"}
                  </p>
                </div>
                <div className="ig-post-card__actions">
                  <span className={`status-badge ${post.is_visible ? "status-badge--public" : "status-badge--private"}`}>
                    {post.is_visible ? "表示中" : "非表示"}
                  </span>
                  <form action={async () => {
                    "use server";
                    await toggleInstagramPostVisibility(post.id, post.is_visible ?? true);
                  }}>
                    <Button variant="ghost" size="sm" type="submit">
                      {post.is_visible ? "非表示にする" : "表示する"}
                    </Button>
                  </form>
                  <form action={async () => {
                    "use server";
                    await deleteInstagramPost(post.id);
                  }}>
                    <Button variant="destructive" size="sm" type="submit">
                      削除
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
