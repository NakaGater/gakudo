import { getPhotos } from './actions'
import { PhotoUploader } from '@/components/photo-uploader'
import { PhotoGrid } from '@/components/photo-grid'

export default async function TeacherPhotosPage() {
  const photos = await getPhotos()

  const photosForGrid = photos.map((p: { id: string; thumbnailUrl: string | null }) => ({
    id: p.id,
    thumbnailUrl: p.thumbnailUrl,
  }))

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">写真管理</h1>

      <section className="mb-6">
        <PhotoUploader />
      </section>

      {photosForGrid.length > 0 ? (
        <PhotoGrid photos={photosForGrid} />
      ) : (
        <p className="text-gray-500 text-sm">写真はまだありません</p>
      )}
    </div>
  )
}
