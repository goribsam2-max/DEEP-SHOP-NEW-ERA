import React from 'react';
import { motion } from 'framer-motion';
import Icon from './Icon';

export const Skeleton = ({ className = '', style = {} }) => {
  return (
    <div 
      className={`bg-zinc-200/50 dark:bg-zinc-800/50 animate-pulse rounded-lg ${className}`}
      style={style}
    ></div>
  );
};

export const ProductSkeleton = () => {
  return (
    <div className="relative hover-tilt overflow-hidden">
      <div className="bg-zinc-100 dark:bg-zinc-800/30 rounded-2xl mb-4 aspect-[4/5] relative flex items-center justify-center p-4">
        <Skeleton className="w-full h-full rounded-xl" />
      </div>
      <div className="px-2 pb-2">
        <Skeleton className="h-4 w-3/4 mb-2 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
      </div>
    </div>
  );
};

export const OrderSkeleton = () => {
  return (
    <div className="bg-white dark:bg-[#121212] rounded-2xl border border-zinc-100 dark:border-zinc-800/80 p-6 flex flex-col xl:flex-row gap-8 mb-4">
       <div className="xl:w-[320px] shrink-0 border-b xl:border-b-0 xl:border-r border-zinc-100 dark:border-zinc-800/80 pb-6 xl:pb-0 xl:pr-6">
          <div className="flex justify-between mb-8">
             <Skeleton className="h-4 w-1/3" />
             <Skeleton className="h-6 w-1/4 rounded-full" />
          </div>
          <div className="space-y-2">
             <Skeleton className="h-5 w-2/3" />
             <Skeleton className="h-4 w-1/2" />
             <Skeleton className="h-3 w-full mt-2" />
          </div>
       </div>
       <div className="flex-1">
          <div className="flex gap-4 mb-6">
             <Skeleton className="w-12 h-12 rounded-full" />
             <div className="space-y-2 py-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
             </div>
          </div>
          <Skeleton className="h-10 w-full rounded-full" />
       </div>
       <div className="xl:w-[200px] xl:text-right pt-6 xl:pt-0 border-t xl:border-t-0 xl:border-l border-zinc-100 dark:border-zinc-800/80 xl:pl-6">
          <Skeleton className="h-3 w-24 mb-2 xl:ml-auto" />
          <Skeleton className="h-8 w-32 xl:ml-auto mb-8" />
          <Skeleton className="h-3 w-24 xl:ml-auto mb-1" />
          <Skeleton className="h-3 w-16 xl:ml-auto" />
       </div>
    </div>
  );
};
