import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { useClickOutside } from "./use-click-outside";
import { Material } from "./material-1";

interface DrawerProps {
  height?: number;
  onDismiss: () => void;
  show: boolean;
  children: React.ReactNode;
  zIndexOverlay?: string;
  zIndexContent?: string;
  zIndex?: number;
}

export const Drawer: React.FC<DrawerProps> = ({ height, onDismiss, show, children, zIndexOverlay = "z-[99999]", zIndexContent = "z-[999999]", zIndex }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useClickOutside(ref, onDismiss);

  if (!mounted) return null;

  return createPortal(
    <>
      <div 
        className={clsx(
          `fixed top-0 left-0 w-full h-full bg-overlay duration-300`,
          !zIndex ? zIndexOverlay : "",
          show ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        style={{ zIndex: zIndex ? zIndex : undefined }}
      ></div>
      <Material
        type="menu"
        className={clsx(
          `fixed bottom-0 left-0 w-full max-h-[85vh] overflow-y-auto hide-scrollbar bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 shadow-lg transition-transform duration-300 rounded-t-[20px] rounded-b-none`,
          !zIndex ? zIndexContent : "",
          show ? "translate-y-0" : "translate-y-full"
        )}
        style={{ 
          height, 
          zIndex: zIndex ? zIndex + 1 : undefined 
        }}
        ref={ref}
      >
        <div>{children}</div>
      </Material>
    </>,
    document.body
  );
};
