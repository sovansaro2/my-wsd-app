import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SLIDE_IMAGES = [
  { id: 1, src: '/slide/slide1.jpg', alt: 'Slide 1' },
  { id: 2, src: '/slide/slide2.jpg', alt: 'Slide 2' },
  { id: 3, src: '/slide/slide3.jpg', alt: 'Slide 3' },
  { id: 4, src: '/slide/slide4.jpg', alt: 'Slide 4' },
  { id: 5, src: '/slide/slide5.jpg', alt: 'Slide 5' },
  { id: 6, src: '/slide/slide6.jpg', alt: 'Slide 6' },
  { id: 7, src: '/slide/slide7.jpg', alt: 'Slide 7' },
  { id: 8, src: '/slide/slide8.jpg', alt: 'Slide 8' },
];

export default function ImageSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % SLIDE_IMAGES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + SLIDE_IMAGES.length) % SLIDE_IMAGES.length);
  }, []);

  // 3-second auto slide interval
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

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

  return (
    <div 
      className="relative w-full overflow-hidden rounded-2xl shadow-sm border border-gray-200/80 dark:border-slate-800 bg-gray-900 group select-none aspect-[16/9] sm:aspect-[21/9]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full"
        >
          <img
            src={SLIDE_IMAGES[currentIndex].src}
            alt={SLIDE_IMAGES[currentIndex].alt}
            referrerPolicy="no-referrer"
            onError={(e) => {
              // Try uppercase / lowercase fallback
              const target = e.currentTarget;
              const currentSrc = target.src;
              if (currentSrc.endsWith('.jpg')) {
                target.src = currentSrc.replace(/\.jpg$/, '.JPG');
              } else if (currentSrc.endsWith('.JPG')) {
                target.src = currentSrc.replace(/\.JPG$/, '.jpg');
              }
            }}
            className="w-full h-full object-cover object-center"
          />
          {/* Subtle gradient overlay at the bottom for dot visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />
        </motion.div>
      </AnimatePresence>

      {/* Prev / Next Navigation Arrows */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          prevSlide();
        }}
        aria-label="Previous Slide"
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          nextSlide();
        }}
        aria-label="Next Slide"
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Indicator dots & Counter */}
      <div className="absolute bottom-2.5 left-0 right-0 flex items-center justify-between px-3 z-10 pointer-events-none">
        <div className="flex items-center gap-1.5 pointer-events-auto bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full">
          {SLIDE_IMAGES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentIndex === idx 
                  ? 'w-5 bg-orange-500' 
                  : 'w-1.5 bg-white/60 hover:bg-white/90'
              }`}
            />
          ))}
        </div>

        <div className="text-[11px] font-medium text-white/90 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full tracking-wider">
          {currentIndex + 1} / {SLIDE_IMAGES.length}
        </div>
      </div>
    </div>
  );
}
