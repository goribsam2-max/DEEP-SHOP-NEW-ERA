import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, Share2 } from "lucide-react";

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageLightbox({ images, initialIndex, isOpen, onClose }: ImageLightboxProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(0);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setActiveIndex(initialIndex);
      setScale(1);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') paginate(1);
      if (e.key === 'ArrowLeft') paginate(-1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeIndex]);

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setScale(1); // Reset zoom on change
    setActiveIndex((prev) => {
      let nextIndex = prev + newDirection;
      if (nextIndex < 0) nextIndex = images.length - 1;
      if (nextIndex >= images.length) nextIndex = 0;
      return nextIndex;
    });
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(images[activeIndex]);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `product-image-${activeIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download image", error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Product Image",
          url: images[activeIndex],
        });
      } catch (error) {
        console.error("Error sharing", error);
      }
    }
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/95 backdrop-blur-xl"
        >
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-[100001] bg-gradient-to-b from-black/80 to-transparent">
            <div className="text-white font-medium text-sm pl-2">
              {activeIndex + 1} / {images.length}
            </div>
            <div className="flex gap-4">
              <button onClick={() => setScale(s => Math.min(s + 0.5, 3))} className="text-white hover:text-zinc-300 transition-colors">
                <ZoomIn className="w-5 h-5" />
              </button>
              <button onClick={() => setScale(s => Math.max(s - 0.5, 1))} className="text-white hover:text-zinc-300 transition-colors">
                <ZoomOut className="w-5 h-5" />
              </button>
              <button onClick={handleShare} className="text-white hover:text-zinc-300 transition-colors hidden sm:block">
                <Share2 className="w-5 h-5" />
              </button>
              <button onClick={handleDownload} className="text-white hover:text-zinc-300 transition-colors">
                <Download className="w-5 h-5" />
              </button>
              <button onClick={onClose} className="text-white hover:text-zinc-300 transition-colors ml-4">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all z-[100001]"
                onClick={(e) => {
                  e.stopPropagation();
                  paginate(-1);
                }}
              >
                <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
              </button>
              <button
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-all z-[100001]"
                onClick={(e) => {
                  e.stopPropagation();
                  paginate(1);
                }}
              >
                <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
              </button>
            </>
          )}

          {/* Main Image */}
          <div className="relative w-full h-full flex items-center justify-center p-4 md:p-12" onClick={onClose}>
            <AnimatePresence initial={false} custom={direction}>
              <motion.img
                key={activeIndex}
                src={images[activeIndex]}
                custom={direction}
                initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
                animate={{ opacity: 1, x: 0, scale }}
                exit={{ opacity: 0, x: direction < 0 ? 100 : -100 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                drag={scale === 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = swipePower(offset.x, velocity.x);
                  if (swipe < -swipeConfidenceThreshold) {
                    paginate(1);
                  } else if (swipe > swipeConfidenceThreshold) {
                    paginate(-1);
                  }
                }}
                className="absolute max-w-full max-h-[85vh] object-contain rounded-2xl md:rounded-3xl cursor-grab active:cursor-grabbing"
                onClick={(e) => e.stopPropagation()}
                alt={`Product full view ${activeIndex + 1}`}
              />
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
