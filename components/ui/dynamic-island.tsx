import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ShoppingBag, Bell, X, Info } from 'lucide-react';

export type IslandState = 'idle' | 'cart_add' | 'notification' | 'success' | 'alert';

export interface IslandData {
  title: string;
  subtitle?: string;
  image?: string;
  state: IslandState;
  duration?: number;
}

class IslandController {
  private static listeners: ((data: IslandData | null) => void)[] = [];

  static subscribe(listener: (data: IslandData | null) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  static call(data: IslandData) {
    this.listeners.forEach(l => l(data));
  }

  static close() {
      this.listeners.forEach(l => l(null));
  }
}

export const useIsland = () => {
  const [active, setActive] = useState(false);
  useEffect(() => {
    return IslandController.subscribe((newData) => {
      setActive(newData !== null);
    });
  }, []);
  return active;
};

export const showIsland = (data: IslandData) => {
  IslandController.call(data);
};

export const hideIsland = () => {
  IslandController.close();
};

export const DynamicIsland = () => {
  const [data, setData] = useState<IslandData | null>(null);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    return IslandController.subscribe((newData) => {
      setData(newData);
      if (timeout) clearTimeout(timeout);
      
      if (newData && newData.state !== 'idle') {
        timeout = setTimeout(() => {
           hideIsland();
        }, newData.duration || 4000);
      }
    });
  }, []);

  return (
    <div className="fixed top-2 md:top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none flex justify-center items-start">
      <AnimatePresence>
        {data && (
          <motion.div
            layout
            key="island-container"
            initial={{ width: 16, height: 16, opacity: 0, borderRadius: 16 }}
            animate={{ 
              width: 'auto',
              height: 'auto',
              opacity: 1,
              borderRadius: 36,
            }}
            exit={{ width: 16, height: 16, opacity: 0, borderRadius: 16, transition: { duration: 0.2, ease: "easeInOut" } }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
            className="bg-black backdrop-blur-md overflow-hidden pointer-events-auto border border-white/10 origin-center flex items-center justify-center shadow-2xl min-w-[16px] min-h-[16px]"
          >
            <AnimatePresence mode="wait">
              <motion.div
                layout
                key={data.state + data.title}
                initial={{ opacity: 0, filter: 'blur(8px)', scale: 0.8 }}
                animate={{ opacity: 1, filter: 'blur(0px)', scale: 1, transition: { delay: 0.1, duration: 0.3 } }}
                exit={{ opacity: 0, filter: 'blur(8px)', scale: 0.8, transition: { duration: 0.15 } }}
                className="px-2.5 py-1.5 flex items-center gap-2.5 w-max max-w-[90vw] md:max-w-[400px]"
              >
                <motion.div layout className="flex-shrink-0">
                  {data.image ? (
                    <img src={data.image} alt="" className="w-6 h-6 rounded-full object-cover border border-white/10" />
                  ) : data.state === 'cart_add' ? (
                    <div className="w-6 h-6 rounded-full bg-[#1cdb5e]/20 flex items-center justify-center text-[#1cdb5e]">
                       <ShoppingBag className="w-3.5 h-3.5" />
                    </div>
                  ) : data.state === 'success' ? (
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                      <CheckCircle className="w-3.5 h-3.5" />
                    </div>
                  ) : data.state === 'alert' ? (
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                      <Info className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                      <Bell className="w-3.5 h-3.5" />
                    </div>
                  )}
                </motion.div>
                
                <motion.div layout className="flex flex-col flex-1 overflow-hidden mr-1">
                  <motion.span layout className="text-white text-[13px] font-semibold tracking-tight truncate leading-tight">
                    {data.title}
                  </motion.span>
                  {data.subtitle && (
                    <motion.span layout className="text-white/60 text-[11px] font-medium tracking-tight truncate mt-0.5">
                      {data.subtitle}
                    </motion.span>
                  )}
                </motion.div>

                <motion.button 
                  layout 
                  onClick={() => hideIsland()} 
                  className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors shrink-0"
                >
                    <X className="w-3.5 h-3.5" />
                </motion.button>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
