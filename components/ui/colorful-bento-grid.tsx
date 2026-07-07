import { cn } from "../../lib/utils";
import { Gift } from "lucide-react";
import { Link } from "react-router-dom";

export const ColorfulBentoGrid = () => {
  return (
    <section id="free-tools" className="bg-white dark:bg-zinc-900 rounded-3xl p-6 lg:p-8 mt-2 max-w-6xl mx-auto shadow-sm border border-zinc-200 dark:border-zinc-800">
      <div className="flex w-full">
        <div className="flex flex-col w-full items-start justify-start gap-4">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center w-full justify-between">
            <h2 className="relative text-xl md:text-2xl lg:text-3xl font-sans font-semibold text-left leading-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2 whitespace-nowrap overflow-hidden text-ellipsis">
              Premium phones & devices
              <Gift
                className="inline-flex text-zinc-900 dark:text-zinc-100 fill-zinc-900/10 dark:fill-zinc-100/10 -rotate-12 shrink-0"
                size={28}
                strokeWidth={2}
              />
              delivered to your door.
            </h2>
            <p className="max-w-xs font-medium text-sm md:text-sm text-zinc-500 dark:text-zinc-400 text-left lg:text-right border-l-2 lg:border-l-0 lg:border-r-2 border-zinc-900 dark:border-zinc-100/30 pl-4 lg:pl-0 lg:pr-4">
              Explore our latest reviews, tips, and unbeatable offers on authentic tech accessories.
            </p>
          </div>

          <div className="flex flex-row text-zinc-800 dark:text-zinc-200 dark:text-zinc-700 dark:text-zinc-300 gap-6 items-center mt-2">
            <p className="text-xs md:text-sm whitespace-nowrap font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-100 dark:bg-zinc-8000 animate-pulse"></span>
              100% Authentic
            </p>
            <p className="text-xs md:text-sm whitespace-nowrap font-semibold">
              Rated 5/5 by 10k+ Customers
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
