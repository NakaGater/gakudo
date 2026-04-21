import { getUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button } from "@/components/ui";
import { setPhotoVisibility, deletePhoto } from "./actions";
import { UploadForm } from "./upload-form";
import type { Database } from "@/lib/supabase/types";

type Photo = Database["public"]["Tables"]["photos"]["Row"];

export default async function PhotosPage() {
  const user = await getUser();
  const supabase = await createClient();
  const isStaff = user.role === "admin" || user.role === "teacher";
  const isAdmin = user.role === "admin";

  const { data: photos } = await (supabase.from("photos") as any)
    .select("*")
    .order("created_at", { ascending: false });

  const photoList: Photo[] = photos ?? [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  function getPublicUrl(storagePath: string) {
    return `${supabaseUrl}/storage/v1/object/public/photos/${storagePath}`;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-fg font-story ink-bleed">📷 写真一覧</h1>
      </div>

      {isStaff && (
        <details className="rounded-lg border border-border bg-bg-elev p-4">
          <summary className="cursor-pointer font-medium text-fg">
            アップロード
          </summary>
          <div className="mt-4">
            <UploadForm isAdmin={isAdmin} />
          </div>
        </details>
      )}

      {photoList.length === 0 ? (
        <p className="text-fg-muted text-center py-12">写真がありません</p>
      ) : (
        <div className="corkboard">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {photoList.map((photo, i) => (
            <div
              key={photo.id}
              className="polaroid polaroid--tape"
              style={{ transform: `rotate(${(i % 5 - 2) * 1.5}deg)` }}
            >
              <div className="relative aspect-[4/3] rounded-sm overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getPublicUrl(photo.storage_path)}
                  alt={photo.caption ?? "写真"}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-2 pt-3 space-y-1">
                {photo.event_name && (
                  <p className="text-sm font-medium text-fg">
                    {photo.event_name}
                  </p>
                )}
                {photo.caption && (
                  <p className="text-xs text-fg-muted">{photo.caption}</p>
                )}
                <div className="flex items-center justify-between pt-1">
                  <Badge
                    variant={
                      photo.visibility === "public" ? "success" : "default"
                    }
                  >
                    {photo.visibility === "public" ? "公開" : "非公開"}
                  </Badge>

                  {isAdmin && (
                    <div className="flex gap-1">
                      <form
                        action={async () => {
                          "use server";
                          await setPhotoVisibility(
                            photo.id,
                            photo.visibility === "public"
                              ? "private"
                              : "public",
                          );
                        }}
                      >
                        <Button variant="ghost" size="sm" type="submit">
                          {photo.visibility === "public"
                            ? "非公開にする"
                            : "公開する"}
                        </Button>
                      </form>
                      <form
                        action={async () => {
                          "use server";
                          await deletePhoto(photo.id);
                        }}
                      >
                        <Button
                          variant="destructive"
                          size="sm"
                          type="submit"
                        >
                          削除
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>
      )}
    </div>
  );
}
