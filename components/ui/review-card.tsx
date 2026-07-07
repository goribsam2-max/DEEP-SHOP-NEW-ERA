import * as React from "react";
import { Star, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ReviewCardProps {
  name: string;
  handle?: string;
  review: string;
  rating: number;
  imageUrl?: string;
  createdAt?: number;
  images?: string[];
  className?: string;
}

const ReviewCard = React.forwardRef<HTMLDivElement, ReviewCardProps>(
  ({ name, review, rating, createdAt, images, className }, ref) => {
    const cardVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.4,
          ease: "easeOut",
        },
      },
    };

    const dateOptions: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
    const formattedDate = new Date(createdAt || Date.now()).toLocaleDateString(undefined, dateOptions);

    return (
      <motion.div
        ref={ref}
        className={cn(
          "bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 py-6 w-full",
          className
        )}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        role="article"
      >
        <p className="text-sm text-zinc-500 mb-1">{formattedDate}</p>
        
        <div className="flex items-center justify-between mb-2">
           <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{name}</h3>
           <div className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400">
             <span>Verified purchase</span>
             <CheckCircle className="w-4 h-4" />
           </div>
        </div>

        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(
                "w-4 h-4",
                i < Math.round(rating)
                  ? "text-[#FF7D2B] fill-[#FF7D2B]"
                  : "text-zinc-300 dark:text-zinc-700"
              )}
            />
          ))}
        </div>

        <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed text-[15px]">
          {review}
        </p>

        {images && images.length > 0 && (
          <div className="flex gap-3 mt-4 overflow-x-auto pb-2 custom-scrollbar">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt="Review photo"
                className="w-28 h-28 object-cover rounded-xl border border-zinc-200 dark:border-zinc-700 shrink-0 shadow-sm"
              />
            ))}
          </div>
        )}
      </motion.div>
    );
  }
);

ReviewCard.displayName = "ReviewCard";

export { ReviewCard };
