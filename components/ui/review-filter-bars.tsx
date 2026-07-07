import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as React from "react";
import { RiStarFill } from "@remixicon/react";
import { cn } from "@/lib/utils";

const ReviewFilterGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn("flex flex-col gap-2 w-full max-w-md", className)}
    {...props}
  />
));
ReviewFilterGroup.displayName = RadioGroupPrimitive.Root.displayName;

const ReviewFilterItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> & {
    stars: number;
    count: number;
    total: number;
  }
>(({ className, stars, count, total, ...props }, ref) => {
  const percentage = total === 0 ? 0 : Math.round((count / total) * 100);

  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex items-center gap-3 rounded-md border border-input p-2 transition-colors",
        "hover:border-primary/60 hover:bg-zinc-100 dark:hover:bg-zinc-800",
        "data-[state=checked]:border-zinc-500 data-[state=checked]:bg-zinc-100 dark:data-[state=checked]:bg-zinc-800",
        className
      )}
      {...props}
    >
      {/* Star rating */}
      <div className="flex items-center gap-0.5 min-w-[72px]">
        {Array.from({ length: 5 }).map((_, i) => (
          <RiStarFill
            key={i}
            size={16}
            className={i < stars ? "text-amber-500" : "text-muted-foreground/30"}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="flex-1 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-2 rounded-full bg-yellow-400"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Count */}
      <span className="text-xs font-medium text-muted-foreground w-12 text-right">
        {count.toLocaleString()}
      </span>
    </RadioGroupPrimitive.Item>
  );
});
ReviewFilterItem.displayName = "ReviewFilterItem";

export { ReviewFilterGroup, ReviewFilterItem };
