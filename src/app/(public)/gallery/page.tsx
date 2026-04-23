import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { GalleryGrid, type GalleryPhoto } from "./gallery-grid";
import { InstagramEmbeds } from "./instagram-embeds";

export const metadata: Metadata = {
  title: "フォトギャラリー | 星ヶ丘こどもクラブ",
  description:
    "星ヶ丘こどもクラブの活動風景やイベントの写真をご覧いただけます。",
};

function buildPublicUrl(storagePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${supabaseUrl}/storage/v1/object/public/photos/${storagePath}`;
}

export default async function GalleryPage() {
  const supabase = await createClient();

  // 写真とInstagram投稿を並列取得
  const [{ data: rows }, { data: igRows }] = await Promise.all([
    supabase
      .from("photos")
      .select("id, storage_path, caption, event_name")
      .eq("visibility", "public")
      .order("event_name", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .returns<
        {
          id: string;
          storage_path: string;
          caption: string | null;
          event_name: string | null;
        }[]
      >(),
    supabase
      .from("instagram_posts")
      .select("id, post_url, caption")
      .eq("is_visible", true)
      .order("display_order", { ascending: true }),
  ]);

  const photos: GalleryPhoto[] = (rows ?? []).map((row) => ({
    id: row.id,
    url: buildPublicUrl(row.storage_path),
    caption: row.caption,
    event_name: row.event_name,
  }));

  const igPosts = (igRows ?? []).map((r) => ({
    id: r.id,
    post_url: r.post_url,
    caption: r.caption,
  }));

  const hasContent = photos.length > 0 || igPosts.length > 0;

  return (
    <section style={{ maxWidth: "960px", margin: "0 auto", padding: "32px 24px", width: "100%" }}>
      <h1 className="font-story font-black text-ink text-center" style={{ fontSize: "28px" }}>
        🖼️ <span className="crayon-underline">フォトギャラリー</span>
      </h1>
      <p className="text-center text-sm text-ink-mid mt-2">
        子どもたちの活動風景やイベントの様子をご覧いただけます。
      </p>

      <div className="mt-8">
        {hasContent ? (
          <>
            {photos.length > 0 && <GalleryGrid photos={photos} />}
            {igPosts.length > 0 && <InstagramEmbeds posts={igPosts} />}
          </>
        ) : (
          <div className="gallery-empty">
            <div className="gallery-empty__icon">📷</div>
            <div className="gallery-empty__text">まだ写真がないよ…</div>
            <div className="gallery-empty__sub">たのしい写真をまっててね ⭐</div>
          </div>
        )}
      </div>
    </section>
  );
}
