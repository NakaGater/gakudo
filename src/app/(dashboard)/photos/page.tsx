import Image from "next/image";
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

  function getPublicUrl(storagePath: string) {
    return supabase.storage.from("photos").getPublicUrl(storagePath).data
      .publicUrl;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-fg">写真一覧</h1>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {photoList.map((photo) => (
            <div
              key={photo.id}
              className="overflow-hidden rounded-lg border border-border bg-bg-elev"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={getPublicUrl(photo.storage_path)}
                  alt={photo.caption ?? "写真"}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                  loading="lazy"
                  unoptimized
                />
              </div>
              <div className="p-3 space-y-1">
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
      )}
    </div>
  );
}
