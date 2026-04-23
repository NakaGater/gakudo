import Link from "next/link";
import { getUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui";
import { setPhotoVisibility, deletePhoto } from "./actions";
import { UploadForm } from "./upload-form";
import type { Database } from "@/lib/supabase/types";

type Photo = Database["public"]["Tables"]["photos"]["Row"];

export default async function PhotosPage() {
  const user = await getUser();
  const supabase = await createClient();
  const isStaff = user.role === "admin" || user.role === "teacher";
  const isAdmin = user.role === "admin";

  const { data: photos } = await supabase.from("photos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const photoList: Photo[] = photos ?? [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  function getPublicUrl(storagePath: string) {
    return `${supabaseUrl}/storage/v1/object/public/photos/${storagePath}`;
  }

  return (
    <>
      <div className="main__hdr">
        <h1 className="main__title font-story">📷 写真管理</h1>
      </div>

      {isStaff && (
        <div className="flex gap-4 border-b border-border mb-6">
          <span className="pb-2 border-b-2 border-cr-orange text-cr-orange font-medium text-sm">
            写真管理
          </span>
          <Link
            href="/photos/instagram"
            className="pb-2 border-b-2 border-transparent text-ink-mid hover:text-ink text-sm transition-colors"
          >
            Instagram連携
          </Link>
        </div>
      )}

      {isStaff && (
        <details className="gallery-upload">
          <summary className="cursor-pointer font-medium text-ink">
            📁 アップロード
          </summary>
          <div className="mt-4">
            <UploadForm isAdmin={isAdmin} />
          </div>
        </details>
      )}

      {photoList.length === 0 ? (
        <p className="text-ink-mid text-center py-12">写真がありません</p>
      ) : (
        <div className="corkboard">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {photoList.map((photo, i) => (
              <div
                key={photo.id}
                className="photo-mgmt"
                style={{ transform: `rotate(${(i % 5 - 2) * 1.5}deg)` }}
              >
                <div className="photo-mgmt__img relative aspect-[4/3] rounded-sm overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getPublicUrl(photo.storage_path)}
                    alt={photo.caption ?? "写真"}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="photo-mgmt__info">
                  {photo.event_name && (
                    <p className="photo-mgmt__title">
                      {photo.event_name}
                    </p>
                  )}
                  {photo.caption && (
                    <p className="photo-mgmt__caption">{photo.caption}</p>
                  )}
                  <div className="photo-mgmt__actions">
                    <span className={`status-badge ${photo.visibility === "public" ? "status-badge--public" : "status-badge--private"}`}>
                      {photo.visibility === "public" ? "公開" : "非公開"}
                    </span>

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
    </>
  );
}
