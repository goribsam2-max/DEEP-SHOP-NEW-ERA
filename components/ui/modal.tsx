import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button, ButtonProps } from "@/components/ui/button-1";
import clsx from "clsx";
import { Drawer } from "@/components/ui/drawer";
import { Material } from "@/components/ui/material-1";
import useBreakpoints from "@/components/ui/use-breakpoints";

interface ModalProps {
  active: boolean;
  onClickOutside: () => void;
  children: React.ReactNode;
  sticky?: boolean;
  initialFocusRef?: React.RefObject<HTMLButtonElement> | React.RefObject<null>;
  zIndexClass?: string;
  zIndex?: number;
}

interface ModalBodyProps {
  children: React.ReactNode;
  sticky?: boolean;
  className?: string;
}

interface ModalHeaderProps {
  children: React.ReactNode;
  sticky?: boolean;
}

const ModalModal = ({ active, onClickOutside, children, sticky, initialFocusRef, zIndexClass, zIndex }: ModalProps) => {
  const focusRef = useRef<HTMLButtonElement | null>(null);
  const { isMobile, isDesktop } = useBreakpoints();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (active) {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else {
        if (focusRef.current) {
          focusRef.current.focus();
        }
      }
    }
  }, [active, initialFocusRef?.current]);

  useEffect(() => {
    if (!active) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClickOutside();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, onClickOutside]);

  const childrenArray = React.Children.toArray(children);

  const footer = childrenArray.find(
    (child) =>
      React.isValidElement(child) &&
      child.type === ModalActions
  );

  const enhancedFooter = React.isValidElement<{ children: React.ReactNode }>(footer)
    ? React.cloneElement(footer, {
      children: React.Children.map(footer.props.children, (child, index) => {
        if (index === 0 && React.isValidElement<ButtonProps>(child)) {
          return React.cloneElement(child, {
            ref: focusRef
          });
        }
        return child;
      })
    })
    : null;

  if (!mounted) return null;

  return (
    <>
      {isMobile && (
        <Drawer onDismiss={onClickOutside} show={active} zIndexOverlay={zIndexClass} zIndexContent={zIndexClass} zIndex={zIndex}>
          {React.Children.map(children, (child) =>
            (child as React.ReactElement)?.type === ModalBody
              ? React.cloneElement(child as React.ReactElement<ModalBodyProps>, { sticky })
              : child
          )}
        </Drawer>
      )}
      {isDesktop && createPortal(
        <div
          className={clsx(
            "fixed inset-0 flex items-center justify-center duration-300",
            zIndexClass || (!zIndex ? "z-[100000]" : ""),
            active ? "bg-background-200-alpha-800" : "bg-transparent pointer-events-none"
          )}
          style={{ zIndex: zIndex ? zIndex : undefined }}
          onClick={onClickOutside}
        >
          <Material
            type="modal"
            className={clsx(
              "flex flex-col font-sans text-gray-1000 w-[540px] max-h-[min(800px,_80vh)] overflow-y-auto duration-300",
              active ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {React.Children.map(children, (child) =>
              (child as React.ReactElement)?.type === ModalBody
                ? React.cloneElement(child as React.ReactElement<ModalBodyProps>, { sticky })
                : ((child as React.ReactElement)?.type === ModalActions && !initialFocusRef) ? enhancedFooter : child
            )}
          </Material>
        </div>,
        document.body
      )}
    </>
  );
};

const ModalBody = ({ children, sticky, className }: ModalBodyProps) => (
  <div className={clsx("overflow-y-auto text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100", sticky ? "px-6 pb-6" : "p-6", className)}>
    {React.Children.map(children, (child) =>
      (child as React.ReactElement)?.type === ModalHeader
        ? React.cloneElement(child as React.ReactElement<ModalHeaderProps>, { sticky })
        : child
    )}
  </div>
);
const ModalHeader = ({ children, sticky }: ModalHeaderProps) => (
  <header className={clsx(
    "mb-6 rounded-t-xl", sticky && "sticky top-0 bg-background-200 dark:bg-zinc-900 border-b border-gray-alpha-400 pt-5 px-6 -mx-6"
  )}>
    {children}
  </header>
);
const ModalInset = ({ children }: { children: React.ReactNode }) => (
  <div className="-mx-6 p-6 border-b border-t border-accents-2 bg-accents-1 dark:bg-zinc-800">{children}</div>
);
const ModalTitle = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <h2 className={clsx("mb-6 text-2xl font-semibold tracking-[-0.029375rem] text-zinc-900 dark:text-white", className)}>{children}</h2>
);
const ModalSubtitle = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <p className={clsx("text-base text-zinc-500 dark:text-zinc-400", className)}>{children}</p>
);
const ModalActions = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <footer className={clsx("sticky bottom-0 p-4 flex flex-row items-center justify-between shrink-0 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 rounded-b-xl gap-3", className)}>
    {children}
  </footer>
);
const ModalAction = (props: ButtonProps) => {
  const { variant, className, ...rest } = props;
  if (variant === "unstyled") {
     return <Button {...rest} variant="styled" className={clsx("w-auto px-6 py-2.5 h-11 text-[13px] rounded-xl font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition-all flex items-center justify-center shrink-0 border-none", className)}>{props.children}</Button>;
  }
  return <Button {...rest} variant="styled" className={clsx("flex-1 h-11 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-[13px] rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center border-none", className)}>{props.children}</Button>;
};

export const Modal = {
  Modal: ModalModal,
  Header: ModalHeader,
  Inset: ModalInset,
  Body: ModalBody,
  Title: ModalTitle,
  Subtitle: ModalSubtitle,
  Actions: ModalActions,
  Action: ModalAction
};
