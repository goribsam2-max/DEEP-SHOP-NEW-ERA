import { formatPrice } from "@/lib/utils";
import React, { useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface FlashSaleItem {
  id: string | number;
  imageUrl: string;
  name: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
}

interface FlashSaleCarouselProps {
  items: FlashSaleItem[];
  onItemClick: (item: FlashSaleItem) => void;
  onSeeAll: () => void;
  timeStatus?: string;
}

export function FlashSaleCarousel({ items, onItemClick, onSeeAll, timeStatus = "Flash sale has ended" }: FlashSaleCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: true,
    dragFree: true,
  });

  // Auto scroll
  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 3000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  return (
    <div className="relative w-full overflow-hidden bg-emerald-600 py-4 rounded-xl shadow-lg border border-emerald-500 mb-10 overflow-hidden">
      {/* Background Graphic elements mimicking lighting bolts */}
      <div className="absolute top-0 right-10 w-32 h-[200%] bg-yellow-400 rotate-[35deg] transform -translate-y-1/4 opacity-90 blur-[1px]"></div>
      <div className="absolute top-10 right-0 w-8 h-[200%] bg-white rotate-[35deg] transform -translate-y-1/4 opacity-60 blur-[1px]"></div>
      <div className="absolute bottom-0 right-[40%] w-16 h-[100%] bg-yellow-400 rotate-[-50deg] transform translate-y-1/2 opacity-90 blur-[1px]"></div>
      
      {/* Overlay to dim the background lightning slightly so text is readable */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-emerald-600/90 to-emerald-600/50 pointer-events-none"></div>

      <div className="px-4 relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="text-yellow-400 font-black text-2xl relative z-10">⚡</span>
              <span className="absolute -bottom-1 -right-1 text-white bg-black/50 text-[8px] font-black italic px-0.5 leading-none rounded">SALE</span>
            </div>
            <h2 className="text-white font-bold text-xl flex items-center gap-3" style={{ fontFamily: "'Comfortaa', cursive", letterSpacing: '-0.02em' }}>
              Flash Sale
              <span className="text-white/90 text-sm font-sans font-normal hidden sm:inline-block tracking-normal">{timeStatus}</span>
            </h2>
          </div>
        </div>
        <button
          onClick={onSeeAll}
          className="border border-white/80 text-white rounded-full px-4 py-1.5 text-sm hover:bg-white hover:text-emerald-600 transition-colors bg-white/10 backdrop-blur-sm"
        >
          See All
        </button>
      </div>

      <div className="overflow-hidden px-4 relative z-10" ref={emblaRef}>
        <div className="flex -ml-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="pl-4 flex-[0_0_160px] sm:flex-[0_0_180px] md:flex-[0_0_200px]"
            >
              <div
                className="bg-white rounded-xl overflow-hidden cursor-pointer group shadow-sm flex flex-col justify-between h-full"
                onClick={() => onItemClick(item)}
              >
                <div className="w-full aspect-[4/5] p-3 relative bg-white flex items-center justify-center">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="w-full relative overflow-hidden bg-[#00c5a2] flex items-center h-[52px]">
                  <div className="absolute inset-0 bg-[#00c5a2] flex items-center justify-end px-3">
                    <span className="text-white font-bold text-base md:text-lg tracking-tight">
                      -{item.discountPercentage || 0}%
                    </span>
                  </div>
                  <div className="absolute inset-y-0 left-0 w-[70%] bg-[#e6fbf7] flex items-center px-3" style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0 100%)' }}>
                    <span className="text-[#00c5a2] font-bold text-lg md:text-xl">{formatPrice(item.price)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
