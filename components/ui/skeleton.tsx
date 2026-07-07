"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const skeletonVariants = cva(
  "animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800",
  {
    variants: {
      variant: {
        default: "bg-zinc-100 dark:bg-zinc-800",
        secondary: "bg-zinc-50 dark:bg-zinc-800/50",
        text: "bg-zinc-100 dark:bg-zinc-800 rounded-md",
        circle: "rounded-full",
        avatar: "rounded-full bg-zinc-100 dark:bg-zinc-800",
      },
      size: {
        sm: "h-4",
        default: "h-6",
        lg: "h-8",
        xl: "h-10",
        "2xl": "h-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  width?: string | number;
  height?: string | number;
  duration?: number;
  shimmer?: boolean;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      className,
      variant,
      size,
      width,
      height,
      duration = 2,
      shimmer = true,
      style,
      ...props
    },
    ref,
  ) => {
    const customStyle = {
      width: typeof width === "number" ? `${width}px` : width,
      height: typeof height === "number" ? `${height}px` : height,
      animationDuration: `${duration}s`,
      ...style,
    };

    return (
      <div
        ref={ref}
        className={cn(
          skeletonVariants({ variant, size }),
          shimmer && "relative overflow-hidden",
          shimmer &&
            "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
          className,
        )}
        style={customStyle}
        {...props}
      />
    );
  },
);
Skeleton.displayName = "Skeleton";

export { Skeleton, skeletonVariants };
