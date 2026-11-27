import React, { useState, useEffect, useCallback, useMemo } from 'react';

interface SlideImage {
  id: string;
  src: string;
  alt: string;
}

const SLIDE_INTERVAL_MS = 7500;

const slideModules = import.meta.glob<string>(
  '../assets/slides/*.{webp,jpg,jpeg,png,avif,WEBP,JPG,JPEG,PNG,AVIF}',
  { eager: true, import: 'default' }
);

const SLIDE_IMAGES: SlideImage[] = Object.entries(slideModules)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
  .map(([path, src], idx) => ({
    id: path,
    src,
    alt: `វត្តស្នាយដួច ${idx + 1}`,
  }));

export default function ImageSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setHasMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const total = SLIDE_IMAGES.length;

  const nextSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (isPaused || total <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, SLIDE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isPaused, nextSlide, total]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    setTouchStartX(null);
    setIsPaused(false);
  };

  // Mount previous, current, and next slides so smooth crossfades never flash blank while keeping memory low
  const activeIndices = useMemo(() => {
    if (total === 0) return new Set<number>();
    if (total <= 3) return new Set(SLIDE_IMAGES.map((_, idx) => idx));
    return new Set([
      (currentIndex - 1 + total) % total,
      currentIndex,
      (currentIndex + 1) % total,
    ]);
  }, [currentIndex, total]);

  // Compact sliding window of dots when there are many slides
  const visibleDotIndices = useMemo(() => {
    if (total <= 9) {
      return SLIDE_IMAGES.map((_, idx) => idx);
    }
    const maxDots = 7;
    const half = Math.floor(maxDots / 2);
    let start = currentIndex - half;
    let end = currentIndex + half;

    if (start < 0) {
      start = 0;
      end = maxDots - 1;
    } else if (end >= total) {
      end = total - 1;
      start = total - maxDots;
    }

    const indices: number[] = [];
    for (let i = start; i <= end; i++) {
      indices.push(i);
    }
    return indices;
  }, [currentIndex, total]);

  if (total === 0) {
    return (
      <div className="relative w-full overflow-hidden rounded-[24px] border border-[#EAE6DC] dark:border-teal-900/40 bg-[#163F48] dark:bg-[#0F2A31] select-none aspect-[16/10] sm:aspect-[16/9] max-h-[250px] sm:max-h-[300px] md:max-h-[340px] flex flex-col items-center justify-center text-center px-6">
        <img
          src="/logo.png"
          alt="វត្តស្នាយដួច"
          className="w-14 h-14 sm:w-16 sm:h-16 object-contain opacity-95 mb-2.5"
        />
        <p className="font-title text-lg sm:text-xl text-white leading-snug">
          វត្តវារីបាការាម · វត្តស្នាយដួច
        </p>
        <p className="text-xs text-teal-100/70 font-battambang mt-1">
          រង់ចាំបញ្ចូលរូបភាពស្លាយថ្មី
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative w-full overflow-hidden rounded-[24px] border border-[#EAE6DC] dark:border-teal-900/40 bg-[#12323A] select-none aspect-[16/10] sm:aspect-[16/9] max-h-[250px] sm:max-h-[300px] md:max-h-[340px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {SLIDE_IMAGES.map((image, idx) => {
        if (!activeIndices.has(idx)) return null;
        const isActive = currentIndex === idx;
        const isZooming = isActive && hasMounted;
        const driftClass =
          idx % 2 === 0
            ? isZooming
              ? 'scale-[1.07] translate-x-1'
              : 'scale-100 translate-x-0'
            : isZooming
              ? 'scale-[1.07] -translate-x-1'
              : 'scale-100 translate-x-0';

        return (
          <div
            key={image.id}
            className={`absolute inset-0 w-full h-full transition-opacity duration-[1300ms] ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img
              src={image.src}
              alt={image.alt}
              referrerPolicy="no-referrer"
              loading={idx === 0 ? 'eager' : 'lazy'}
              decoding="async"
              className={`w-full h-full object-cover object-center transform-gpu will-change-transform transition-transform duration-[7500ms] ease-out ${driftClass}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/5 pointer-events-none" />
          </div>
        );
      })}

      {/* Minimal tiny centered dots */}
      {total > 1 && (
        <div className="absolute bottom-2.5 left-0 right-0 flex items-center justify-center gap-1 z-20 pointer-events-none">
          {visibleDotIndices.map((idx, pos) => {
            const isActive = currentIndex === idx;
            const isEdge =
              total > 9 &&
              ((pos === 0 && idx > 0) ||
                (pos === visibleDotIndices.length - 1 && idx < total - 1));
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`rounded-full transition-all duration-500 ease-out cursor-pointer pointer-events-auto ${
                  isActive
                    ? 'w-3.5 h-1 bg-[#E2BD42]'
                    : isEdge
                      ? 'w-[3px] h-[3px] bg-white/45'
                      : 'w-1 h-1 bg-white/70 hover:bg-white'
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
