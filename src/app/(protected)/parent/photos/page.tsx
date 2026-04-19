import { createClient } from '@/lib/supabase/server'
import { PhotoViewer } from '@/components/photo-viewer'

export default async function ParentPhotosPage() {
  const supabase = await createClient()
  const { data: photos, error } = await supabase
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  // Generate signed URLs for thumbnails and full-size
  const photosWithUrls = await Promise.all(
    (photos ?? []).map(async (photo: { id: string; storage_path: string; thumbnail_path: string }) => {
      const { data: thumbData } = await supabase.storage
        .from('photos')
        .createSignedUrl(photo.thumbnail_path, 3600)

      const { data: fullData } = await supabase.storage
        .from('photos')
        .createSignedUrl(photo.storage_path, 3600)

      return {
        id: photo.id,
        thumbnailUrl: thumbData?.signedUrl ?? null,
        fullUrl: fullData?.signedUrl ?? null,
      }
    })
  )

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">写真</h1>

      {photosWithUrls.length > 0 ? (
        <PhotoViewer photos={photosWithUrls} />
      ) : (
        <p className="text-gray-500 text-sm">写真はまだありません</p>
      )}
    </div>
  )
}
