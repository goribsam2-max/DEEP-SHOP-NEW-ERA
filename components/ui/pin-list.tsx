'use client';

import * as React from 'react';
import { Pin } from 'lucide-react';
import {
  motion,
  LayoutGroup,
  AnimatePresence,
  type HTMLMotionProps,
  type Transition,
} from 'motion/react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

type PinListItem = {
  id: string;
  name: string;
  info: string;
  icon: React.ElementType;
  pinned: boolean;
  href?: string;
};

type PinListProps = {
  items: PinListItem[];
  labels?: {
    pinned?: string;
    unpinned?: string;
  };
  transition?: Transition;
  labelMotionProps?: HTMLMotionProps<'p'>;
  className?: string;
  labelClassName?: string;
  pinnedSectionClassName?: string;
  unpinnedSectionClassName?: string;
  zIndexResetDelay?: number;
} & HTMLMotionProps<'div'>;

function PinList({
  items,
  labels = { pinned: 'Pinned Items', unpinned: 'All Items' },
  transition = { stiffness: 320, damping: 20, mass: 0.8, type: 'spring' },
  labelMotionProps = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.22, ease: 'easeInOut' },
  },
  className,
  labelClassName,
  pinnedSectionClassName,
  unpinnedSectionClassName,
  zIndexResetDelay = 500,
  ...props
}: PinListProps) {
  const [listItems, setListItems] = React.useState(items);
  const [togglingGroup, setTogglingGroup] = React.useState<
    'pinned' | 'unpinned' | null
  >(null);
  const navigate = useNavigate();

  // Load pinned state from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('admin-pinned-items');
    if (saved) {
      const pinnedIds = JSON.parse(saved);
      setListItems((prev) =>
        prev.map((item) => ({
          ...item,
          pinned: pinnedIds.includes(item.id),
        }))
      );
    }
  }, []);

  const pinned = listItems.filter((u) => u.pinned);
  const unpinned = listItems.filter((u) => !u.pinned);

  const toggleStatus = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const item = listItems.find((u) => u.id === id);
    if (!item) return;

    setTogglingGroup(item.pinned ? 'pinned' : 'unpinned');
    setListItems((prev) => {
      const idx = prev.findIndex((u) => u.id === id);
      if (idx === -1) return prev;
      const updated = [...prev];
      const [movedItem] = updated.splice(idx, 1);
      if (!movedItem) return prev;
      const toggled = { ...movedItem, pinned: !movedItem.pinned };
      if (toggled.pinned) updated.push(toggled);
      else updated.unshift(toggled);
      
      // Save to localStorage
      const newPinnedIds = updated.filter(i => i.pinned).map(i => i.id);
      localStorage.setItem('admin-pinned-items', JSON.stringify(newPinnedIds));
      
      return updated;
    });
    // Reset group z-index after the animation duration (keep in sync with animation timing)
    setTimeout(() => setTogglingGroup(null), zIndexResetDelay);
  };

  const handleItemClick = (href?: string) => {
    if (href) {
      navigate(href);
    }
  };

  return (
    <motion.div className={cn('space-y-10', className)} {...props}>
      <LayoutGroup>
        <div>
          <AnimatePresence>
            {pinned.length > 0 && (
              <motion.p
                layout
                key="pinned-label"
                className={cn(
                  'font-medium px-3 text-neutral-500 dark:text-neutral-300 text-sm mb-2',
                  labelClassName,
                )}
                {...labelMotionProps}
              >
                {labels.pinned}
              </motion.p>
            )}
          </AnimatePresence>
          {pinned.length > 0 && (
            <div
              className={cn(
                'space-y-3 relative',
                togglingGroup === 'pinned' ? 'z-5' : 'z-10',
                pinnedSectionClassName,
              )}
            >
              {pinned.map((item) => (
                <motion.div
                  key={item.id}
                  layoutId={`item-${item.id}`}
                  onClick={() => handleItemClick(item.href)}
                  transition={transition}
                  className="flex items-center justify-between gap-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 shadow-sm cursor-pointer group hover:border-pink-300 dark:hover:border-pink-800 transition-colors"
                >
                  <div className="flex items-center gap-3 pl-2">
                    <div className="rounded-xl bg-pink-50 dark:bg-zinc-800 p-2.5 text-pink-600 dark:text-pink-400">
                      <item.icon className="size-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                        {item.info}
                      </div>
                    </div>
                  </div>
                  <div 
                    onClick={(e) => toggleStatus(e, item.id)}
                    className="flex items-center justify-center size-8 rounded-full bg-pink-500 dark:bg-pink-600 mr-2 hover:bg-pink-600 dark:hover:bg-pink-700 transition-colors"
                  >
                    <Pin className="size-4 text-white fill-white" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div>
          <AnimatePresence>
            {unpinned.length > 0 && (
              <motion.p
                layout
                key="all-label"
                className={cn(
                  'font-medium px-3 text-neutral-500 dark:text-neutral-300 text-sm mb-2 mt-6',
                  labelClassName,
                )}
                {...labelMotionProps}
              >
                {labels.unpinned}
              </motion.p>
            )}
          </AnimatePresence>
          {unpinned.length > 0 && (
            <div
              className={cn(
                'space-y-3 relative',
                togglingGroup === 'unpinned' ? 'z-5' : 'z-10',
                unpinnedSectionClassName,
              )}
            >
              {unpinned.map((item) => (
                <motion.div
                  key={item.id}
                  layoutId={`item-${item.id}`}
                  onClick={() => handleItemClick(item.href)}
                  transition={transition}
                  className="flex items-center justify-between gap-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 shadow-sm cursor-pointer group hover:border-pink-300 dark:hover:border-pink-800 transition-colors"
                >
                  <div className="flex items-center gap-3 pl-2">
                    <div className="rounded-xl bg-pink-50 dark:bg-zinc-800 p-2.5 text-pink-600 dark:text-pink-400">
                      <item.icon className="size-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                        {item.info}
                      </div>
                    </div>
                  </div>
                  <div 
                    onClick={(e) => toggleStatus(e, item.id)}
                    className="flex items-center justify-center size-8 rounded-full bg-zinc-200 dark:bg-zinc-700 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-250 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                  >
                    <Pin className="size-4 text-zinc-500 dark:text-zinc-300" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </LayoutGroup>
    </motion.div>
  );
}

export { PinList, type PinListProps, type PinListItem };
