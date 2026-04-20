import type { Metadata } from "next";
import { Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GalleryGrid, type GalleryPhoto } from "./gallery-grid";

export const revalidate = 3600;

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

  const { data: rows } = await supabase
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
    >();

  const photos: GalleryPhoto[] = (rows ?? []).map((row) => ({
    id: row.id,
    url: buildPublicUrl(row.storage_path),
    caption: row.caption,
    event_name: row.event_name,
  }));

  return (
    <section className="bg-bg py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h1 className="text-center text-2xl font-bold text-fg sm:text-3xl">
          フォトギャラリー
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-center text-fg-muted">
          子どもたちの活動風景やイベントの様子をご覧いただけます。
        </p>

        <div className="mt-10">
          {photos.length > 0 ? (
            <GalleryGrid photos={photos} />
          ) : (
            <div className="flex flex-col items-center gap-3 py-20 text-fg-muted">
              <Camera size={48} strokeWidth={1.5} className="text-accent/40" />
              <p className="text-base">公開中の写真はまだありません</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
