type Photo = {
  id: string
  thumbnailUrl: string | null
}

export function PhotoGrid({ photos }: { photos: Photo[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="aspect-square rounded-lg overflow-hidden border border-[#F0E6D3] bg-gray-100"
        >
          {photo.thumbnailUrl ? (
            <img
              src={photo.thumbnailUrl}
              alt="写真"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
              読み込めません
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
