import { formatPrice } from "@/lib/utils";
import * as React from "react";
import { motion, useAnimation } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, Gift } from "lucide-react";

import { cn } from "../../lib/utils";
import { Button } from "./button";

// TypeScript interface for each item in the carousel
export interface CarouselItem {
  id: number | string;
  imageUrl: string;
  title: string;
  subtitle: string;
  rating: number;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  link?: string;
  isOffer?: boolean;
}

// Props for the main OffersCarousel component
export interface OffersCarouselProps {
  offerIcon?: React.ReactNode;
  offerTitle: string;
  offerSubtitle: string;
  ctaText: string;
  onCtaClick: () => void;
  items: CarouselItem[];
  className?: string;
  onItemClick?: (item: CarouselItem) => void;
}

// Sub-component for individual item cards in the carousel
const ItemCard = ({ item, onClick }: { item: CarouselItem, onClick?: () => void }) => (
  <motion.div
    className="group w-64 flex-shrink-0 cursor-pointer"
    whileHover={{ y: -5 }}
    transition={{ type: "spring", stiffness: 300 }}
    onClick={onClick}
  >
    <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm transition-all hover:shadow-md h-full flex flex-col">
      <div className="relative">
        <img
          src={item.imageUrl}
          alt={item.title}
          width={256}
          height={160}
          className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {item.discountPercentage && (
          <div className="absolute bottom-2 right-2 rounded-md bg-orange-500 px-2 py-1 text-xs font-semibold text-white">
            {item.discountPercentage}% OFF
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-start justify-between">
          <h3 className="text-base font-semibold leading-tight line-clamp-1">{item.title}</h3>
          {(item.rating > 0) && (
            <div className="ml-2 flex flex-shrink-0 items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-600 dark:bg-orange-900/50 dark:text-orange-400">
              <Star className="h-3 w-3" />
              <span>{item.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 flex-1">{item.subtitle}</p>
        <div className="mt-3 flex items-end gap-2">
          <p className="text-lg font-bold text-zinc-900 dark:text-white">{formatPrice(item.price.toLocaleString('en-IN'))}</p>
          {item.originalPrice && item.originalPrice > item.price && (
            <p className="text-sm text-zinc-400 dark:text-zinc-500 line-through">
              {formatPrice(item.originalPrice.toLocaleString('en-IN'))}
            </p>
          )}
        </div>
      </div>
    </div>
  </motion.div>
);

// Main OffersCarousel component
export const OffersCarousel = React.forwardRef<HTMLDivElement, OffersCarouselProps>(
  ({ offerIcon, offerTitle, offerSubtitle, ctaText, onCtaClick, items, className, onItemClick }, ref) => {
    const carouselRef = React.useRef<HTMLDivElement>(null);
    const controls = useAnimation();
    const [isAtStart, setIsAtStart] = React.useState(true);
    const [isAtEnd, setIsAtEnd] = React.useState(false);

    // Function to scroll the carousel
    const scroll = (direction: "left" | "right") => {
      if (carouselRef.current) {
        const scrollAmount = carouselRef.current.clientWidth * 0.8;
        const newScrollLeft =
          carouselRef.current.scrollLeft + (direction === "right" ? scrollAmount : -scrollAmount);
        controls.start({
          x: -newScrollLeft,
          transition: { type: "spring", stiffness: 300, damping: 30 },
        });
        carouselRef.current.scrollTo({ left: newScrollLeft, behavior: "smooth" });
      }
    };
    
    // Check scroll position to enable/disable navigation buttons
    const checkScrollPosition = React.useCallback(() => {
        if (carouselRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
            setIsAtStart(scrollLeft < 10);
            setIsAtEnd(scrollWidth - scrollLeft - clientWidth < 10);
        }
    }, [items]);

    React.useEffect(() => {
        const currentCarousel = carouselRef.current;
        if (currentCarousel) {
            currentCarousel.addEventListener("scroll", checkScrollPosition, { passive: true });
            checkScrollPosition(); // Initial check
        }
        return () => {
            if (currentCarousel) {
                currentCarousel.removeEventListener("scroll", checkScrollPosition);
            }
        };
    }, [checkScrollPosition]);

    return (
      <div
        ref={ref}
        className={cn("w-full rounded-3xl border border-orange-200 dark:border-orange-900/30 bg-orange-50/50 dark:bg-orange-900/10 p-4 shadow-sm md:p-6 relative", className)}
      >
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
          {/* Left: Offer Section */}
          <div className="flex flex-col items-center text-center lg:col-span-3 lg:items-start lg:text-left h-full justify-center px-4">
            <div className="flex items-center gap-3">
              {offerIcon || <Gift className="h-6 w-6 text-orange-500" />}
               <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Exclusive Deals!</p>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-white">{offerTitle}</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{offerSubtitle}</p>
            <Button className="mt-6 w-full max-w-xs lg:w-auto bg-orange-500 hover:bg-orange-600 text-white rounded-full" onClick={onCtaClick}>
              {ctaText}
            </Button>
          </div>

          {/* Right: Carousel Section */}
          <div className="relative lg:col-span-9">
            <div ref={carouselRef} className="overflow-x-auto scrollbar-hide py-4 px-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div className="flex gap-4">
                {items.map((item) => (
                  <ItemCard key={item.id} item={item} onClick={() => onItemClick && onItemClick(item)} />
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            {!isAtStart && (
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 -translate-x-4 -translate-y-1/2 rounded-full h-10 w-10 shadow-md z-10 hidden lg:flex bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                onClick={() => scroll("left")}
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            {!isAtEnd && items.length > 3 && (
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 translate-x-4 -translate-y-1/2 rounded-full h-10 w-10 shadow-md z-10 hidden lg:flex bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                onClick={() => scroll("right")}
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
);
OffersCarousel.displayName = "OffersCarousel";
