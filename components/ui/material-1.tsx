import React from "react";
import clsx from "clsx";

const types = {
  base: "rounded-md shadow-border",
  small: "rounded-md shadow-border-small",
  medium: "rounded-xl shadow-border-medium",
  large: "rounded-xl shadow-border-large",
  tooltip: "rounded-md shadow-tooltip",
  menu: "rounded-xl shadow-menu",
  modal: "rounded-xl shadow-modal dark:border dark:border-zinc-800",
  fullscreen: "rounded-2xl shadow-fullscreen dark:border dark:border-zinc-800"
};

interface MaterialProps {
  type: keyof typeof types;
  children: React.ReactNode;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
  style?: React.CSSProperties;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

export const Material = ({ type, children, className, ref, style, onClick }: MaterialProps) => {
  return (
    <div
      className={clsx(
        "bg-background-100 dark:bg-zinc-900",
        types[type],
        className
      )}
      ref={ref}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
