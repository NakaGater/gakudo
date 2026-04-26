"use client";

import { useState, useEffect, useCallback } from "react";

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
        i !== null ? (i - 1 + flatPhotos.length) % flatPhotos.length : null,
      ),
    [flatPhotos.length],
  );
  const next = useCallback(
    () => setLightboxIndex((i) => (i !== null ? (i + 1) % flatPhotos.length : null)),
    [flatPhotos.length],
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

  const tapeVariants = [
    "polaroid--tape",
    "",
    "polaroid--tape-pink",
    "",
    "polaroid--tape-green",
    "",
  ];

  return (
    <>
      {groups.map((group) => (
        <div key={group.event_name} className="gallery-event">
          <div className="gallery-event__hdr">
            <span className="ge-emoji" style={{ marginRight: 6 }}>
              {group.event_name === "その他" ? "📷" : "🎨"}
            </span>
            {group.event_name}
          </div>
          <div className="gallery-grid">
            {group.photos.map((photo, i) => {
              const flatIndex = flatPhotos.findIndex((p) => p.id === photo.id);
              const tape = tapeVariants[i % tapeVariants.length];
              return (
                <div
                  key={photo.id}
                  role="button"
                  tabIndex={0}
                  className={`polaroid${tape ? ` ${tape}` : ""}`}
                  onClick={() => setLightboxIndex(flatIndex)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setLightboxIndex(flatIndex);
                  }}
                  aria-label={photo.caption ?? "写真を拡大表示"}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.caption ?? ""}
                    className="polaroid__img"
                    loading="lazy"
                  />
                  {photo.caption && <span className="polaroid__caption">{photo.caption}</span>}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Lightbox */}
      {lightboxIndex !== null && flatPhotos[lightboxIndex] && (
        <div
          className="gal-lb"
          role="dialog"
          aria-modal="true"
          aria-label="写真ギャラリー"
          onClick={close}
        >
          <div className="gal-lb__inner" onClick={(e) => e.stopPropagation()}>
            <button className="gal-lb__close" onClick={close} aria-label="閉じる">
              ✕
            </button>

            {flatPhotos.length > 1 && (
              <button className="gal-lb__nav gal-lb__nav--prev" onClick={prev} aria-label="前へ">
                ‹
              </button>
            )}
            {flatPhotos.length > 1 && (
              <button className="gal-lb__nav gal-lb__nav--next" onClick={next} aria-label="次へ">
                ›
              </button>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={flatPhotos[lightboxIndex].url}
              alt={flatPhotos[lightboxIndex].caption ?? ""}
              className="gal-lb__img"
            />

            {flatPhotos[lightboxIndex].caption && (
              <div className="gal-lb__caption">{flatPhotos[lightboxIndex].caption}</div>
            )}
            <div className="gal-lb__counter">
              {lightboxIndex + 1} / {flatPhotos.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
