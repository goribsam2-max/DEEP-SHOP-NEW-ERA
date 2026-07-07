import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

export const PullToRefresh: React.FC<{
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
}> = ({ children, onRefresh }) => {
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullHeight = useRef(0);
  const controls = useAnimation();
  const maxPull = 120;
  const triggerHeight = 60;

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      let target = e.target as HTMLElement | null;
      let isAtTop = true;
      let hasScrollableParent = false;

      while (target && target !== document.documentElement && target !== document.body) {
        const style = window.getComputedStyle(target);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
          hasScrollableParent = true;
          if (target.scrollTop > 0) {
            isAtTop = false;
            break;
          }
        }
        target = target.parentElement;
      }

      // Do not trigger pull-to-refresh if we are inside a scrollable modal/popup
      // that is handled separately, but if we do, insist it must be at the very top.
      // Easiest is to only allow it if we are at the top of the page.
      if (window.scrollY <= 0 && isAtTop && !hasScrollableParent) {
        setStartY(e.touches[0].clientY);
        setIsPulling(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return;
      
      const currentY = window.scrollY;
      if (currentY > 0) {
          setIsPulling(false);
          return;
      }

      const y = e.touches[0].clientY;
      const dy = y - startY;

      if (dy > 0) {
        // Prevent default scrolling when pulling down at top
        if (e.cancelable) e.preventDefault();
        pullHeight.current = Math.min(dy * 0.5, maxPull);
        controls.set({ y: pullHeight.current });
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling || isRefreshing) return;
      setIsPulling(false);

      if (pullHeight.current >= triggerHeight) {
        setIsRefreshing(true);
        controls.start({ y: 50, transition: { type: 'spring', bounce: 0, duration: 0.3 } });
        
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          pullHeight.current = 0;
          controls.start({ y: 0, transition: { type: 'spring', bounce: 0, duration: 0.3 } });
        }
      } else {
        pullHeight.current = 0;
        controls.start({ y: 0, transition: { type: 'spring', bounce: 0, duration: 0.3 } });
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    // Use non-passive for move so we can preventDefault
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [startY, isPulling, isRefreshing, onRefresh, controls]);

  return (
    <div className="relative w-full h-full min-h-screen">
      <motion.div
        className="fixed top-safe left-0 right-0 flex justify-center items-center z-[99999] pointer-events-none"
        style={{ height: '50px', top: '-60px' }}
        animate={controls}
      >
        <div className="bg-white dark:bg-zinc-800 shadow-md rounded-full w-12 h-12 flex items-center justify-center transform-gpu">
          <RefreshCw 
            size={24} 
            className={`text-indigo-500 ${isRefreshing ? 'animate-spin' : ''}`} 
            style={{
               transform: isRefreshing ? 'none' : `rotate(${pullHeight.current * 3}deg)`
            }}
          />
        </div>
      </motion.div>
      <div className="w-full h-full min-h-screen">
        {children}
      </div>
    </div>
  );
};
