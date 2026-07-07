import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-x-2.5 rounded-tremor-full bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-tremor-label font-semibold border border-zinc-200 dark:border-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-sm",
  {
    variants: {
      variant: {
        default:
          "text-zinc-900 dark:text-zinc-50",
        secondary:
          "text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900",
        destructive:
          "text-red-600 dark:text-red-500",
        outline: "text-zinc-950 dark:text-zinc-50",
      },
      size: {
        default: "",
        sm: "px-1.5 py-0.5 text-[10px]",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
