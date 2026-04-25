"use client";

import Image from "next/image";
import { useState, useEffect, type ReactNode } from "react";

const INTERVAL_MS = 5000;

type Props = {
  photoUrls: string[];
  children: ReactNode;
};

export function HeroSlideshow({ photoUrls, children }: Props) {
  const totalSlides = 1 + photoUrls.length; // illustration + photos
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (photoUrls.length === 0) return;

    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalSlides);
    }, INTERVAL_MS);

    return () => clearInterval(id);
  }, [photoUrls.length, totalSlides]);

  return (
    <div className="hero-slideshow">
      {/* Slide 0: Illustration (children) */}
      <div
        data-testid="slide-0"
        data-active={String(activeIndex === 0)}
        className="hero-slideshow__slide"
        style={{ opacity: activeIndex === 0 ? 1 : 0 }}
      >
        {children}
      </div>

      {/* Slides 1+: Photos */}
      {photoUrls.map((url, i) => (
        <div
          key={url}
          data-testid={`slide-${i + 1}`}
          data-active={String(activeIndex === i + 1)}
          className="hero-slideshow__slide"
          style={{ opacity: activeIndex === i + 1 ? 1 : 0 }}
        >
          <Image
            src={url}
            alt={`写真 ${i + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="hero-slideshow__img object-cover"
            loading={i === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}
    </div>
  );
}
