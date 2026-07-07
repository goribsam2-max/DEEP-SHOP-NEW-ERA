"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"

import { cn } from "../../lib/utils"

export interface LogoItem {
  /** The label text displayed next to the icon */
  label: string
  /** The icon name from the Icons object */
  icon: React.ReactNode
  /** Animation delay in seconds (use negative values for staggered effect) */
  animationDelay: number
  /** Animation duration in seconds */
  animationDuration: number
  /** The row number where this logo should appear (1-based) */
  row: number
}

export interface LogoTimelineProps {
  /** Array of logo items to display */
  items: LogoItem[]
  /** Optional title text to display in the center */
  title?: string
  /** Height of the timeline container */
  height?: string
  /** Additional className for the container */
  className?: string
  /** Icon size in pixels (default: 16) */
  iconSize?: number
  /** Whether to show separator lines between rows (default: true) */
  showRowSeparator?: boolean
  /** Whether to animate logos only on hover (default: false) */
  animateOnHover?: boolean
}

export function LogoTimeline({
  items,
  title,
  height = "h-[400px] sm:h-[800px]",
  className,
  iconSize = 16,
  showRowSeparator = true,
  animateOnHover = false,
}: LogoTimelineProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Group items by row
  const rowsMap = new Map<number, LogoItem[]>()
  items.forEach((item) => {
    if (!rowsMap.has(item.row)) {
      rowsMap.set(item.row, [])
    }
    rowsMap.get(item.row)?.push(item)
  })

  // Convert map to sorted array
  const rows = Array.from(rowsMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([, rowItems]) => rowItems)

  // Determine animation play state
  const animationPlayState = animateOnHover
    ? isHovered
      ? "running"
      : "paused"
    : "running"

  return (
    <section className={cn("w-full", height, className)}>
      <style>{`
        @keyframes move-x {
          from {
            transform: translateX(var(--move-x-from));
          }
          to {
            transform: translateX(var(--move-x-to));
          }
        }
      `}</style>
      <motion.div
        aria-hidden="true"
        className="bg-background relative h-full w-full overflow-hidden py-12 sm:py-24"
        onMouseEnter={() => animateOnHover && setIsHovered(true)}
        onMouseLeave={() => animateOnHover && setIsHovered(false)}
      >
        {title && (
          <div className="absolute top-1/2 left-1/2 mx-auto w-full max-w-[90%] -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <div className="relative z-10 flex flex-col items-center justify-center">
              <span className="text-zinc-900 dark:text-zinc-100 font-bold tracking-widest text-xs uppercase mb-2 block opacity-80 shadow-sm shadow-emerald-500/20 bg-zinc-100 dark:bg-zinc-8000/10 px-3 py-1 rounded-full">{title}</span>
              <h2 className="text-zinc-900 dark:text-zinc-100 mx-auto max-w-3xl text-4xl font-black tracking-tighter sm:text-5xl md:text-7xl bg-gradient-to-br from-zinc-800 to-zinc-400 dark:from-zinc-100 dark:to-zinc-600 bg-clip-text text-transparent drop-shadow-sm">
                {title}
              </h2>
            </div>
          </div>
        )}
        <div
          className="absolute inset-0 grid"
          style={{ gridTemplateRows: `repeat(${Math.max(rows.length, 1)}, 1fr)` }}
        >
          {rows.map((rowItems, index) => (
            <div className="group relative flex items-center" key={index}>
              <div className="from-foreground/15 dark:from-foreground/15 absolute inset-x-0 top-1/2 h-[1px] bg-gradient-to-r from-[2px] to-[2px] bg-[length:12px_100%]" />
              {showRowSeparator && (
                <div className="from-foreground/5 dark:from-foreground/5 absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-[2px] to-[2px] bg-[length:12px_100%] group-last:hidden" />
              )}
              {rowItems.map((logo) => {
                return (
                  <div
                    key={`${logo.row}-${logo.label}`}
                    className={cn(
                      "absolute top-1/2 flex -translate-y-1/2 items-center gap-2 px-3 py-1.5 whitespace-nowrap",
                      "ring-background/10 dark:ring-foreground/10 rounded-full bg-gradient-to-t from-white/50 from-50% to-white/50 ring-1 backdrop-blur-sm ring-inset dark:from-neutral-900 dark:to-gray-900",
                      "repeat-[infinite] [--move-x-from:-100%] [--move-x-to:calc(100%+100vw)] animate-[move-x_linear_infinite]",
                      "shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-none"
                    )}
                    style={{
                      animationDelay: `${logo.animationDelay}s`,
                      animationDuration: `${logo.animationDuration}s`,
                      animationPlayState: animationPlayState,
                    }}
                  >
                    {logo.icon}
                    <span className="text-foreground text-sm/6 font-medium">
                      {logo.label}
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
