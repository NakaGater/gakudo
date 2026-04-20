"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export type GalleryPhoto = {
  id: string;
  url: string;
  caption: string | null;
  event_name: string | null;
};

type GroupedPhotos = {
  event_name: string;
  photos: GalleryPhoto[];
};

function groupByEvent(photos: GalleryPhoto[]): GroupedPhotos[] {
  const map = new Map<string, GalleryPhoto[]>();
  for (const photo of photos) {
    const key = photo.event_name ?? "その他";
    const group = map.get(key);
    if (group) {
      group.push(photo);
    } else {
      map.set(key, [photo]);
    }
  }
  return Array.from(map, ([event_name, photos]) => ({ event_name, photos }));
}

export function GalleryGrid({ photos }: { photos: GalleryPhoto[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const flatPhotos = photos;

  const close = useCallback(() => setLightboxIndex(null), []);
  const prev = useCallback(
    () =>
      setLightboxIndex((i) =>
        i !== null ? (i - 1 + flatPhotos.length) % flatPhotos.length : null
      ),
    [flatPhotos.length]
  );
  const next = useCallback(
    () =>
      setLightboxIndex((i) =>
        i !== null ? (i + 1) % flatPhotos.length : null
      ),
    [flatPhotos.length]
  );

  useEffect(() => {
    if (lightboxIndex === null) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, close, prev, next]);

  const groups = groupByEvent(photos);

  return (
    <>
      {groups.map((group) => (
        <section key={group.event_name} className="mb-12">
          <h2 className="mb-4 text-xl font-bold text-fg">{group.event_name}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.photos.map((photo) => {
              const flatIndex = flatPhotos.findIndex((p) => p.id === photo.id);
              return (
                <button
                  key={photo.id}
                  type="button"
                  className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-accent-light/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  onClick={() => setLightboxIndex(flatIndex)}
                  aria-label={photo.caption ?? "写真を拡大表示"}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.caption ?? ""}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  {photo.caption && (
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2 text-sm text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {photo.caption}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {/* Lightbox */}
      {lightboxIndex !== null && flatPhotos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="写真拡大表示"
          onClick={close}
        >
          <div
            className="relative flex max-h-[90vh] max-w-5xl flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-[70vh] w-[90vw] max-w-5xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={flatPhotos[lightboxIndex].url}
                alt={flatPhotos[lightboxIndex].caption ?? ""}
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>

            {flatPhotos[lightboxIndex].caption && (
              <p className="mt-3 text-center text-sm text-white/90">
                {flatPhotos[lightboxIndex].caption}
              </p>
            )}

            {/* Close */}
            <button
              type="button"
              className="absolute -top-2 right-0 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
              onClick={close}
              aria-label="閉じる"
            >
              <X size={24} />
            </button>

            {/* Prev */}
            {flatPhotos.length > 1 && (
              <button
                type="button"
                className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                onClick={prev}
                aria-label="前へ"
              >
                <ChevronLeft size={28} />
              </button>
            )}

            {/* Next */}
            {flatPhotos.length > 1 && (
              <button
                type="button"
                className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                onClick={next}
                aria-label="次へ"
              >
                <ChevronRight size={28} />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
