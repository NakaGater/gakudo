'use client'

import { useState } from 'react'

type Photo = {
  id: string
  thumbnailUrl: string | null
  fullUrl: string | null
}

export function PhotoViewer({ photos }: { photos: Photo[] }) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            className="aspect-square rounded-lg overflow-hidden border border-[#F0E6D3] hover:border-[#F59F0A] transition-colors bg-gray-100"
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
          </button>
        ))}
      </div>

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 text-white text-2xl hover:opacity-80"
              aria-label="閉じる"
            >
              &times;
            </button>
            {selectedPhoto.fullUrl ? (
              <img
                src={selectedPhoto.fullUrl}
                alt="写真（フルサイズ）"
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />
            ) : (
              <p className="text-white">画像を読み込めません</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
