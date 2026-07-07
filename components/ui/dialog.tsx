"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { cn } from "../../lib/utils";

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "bg-black/50 dark:bg-black/80 fixed inset-0 z-[200] backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-white dark:bg-zinc-950 fixed top-[50%] left-[50%] z-[201] w-full max-h-[calc(100vh-2rem)] overflow-y-auto max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl duration-200 sm:max-w-xl flex flex-col",
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn("px-6 py-6 pb-8", className)}
      {...props}
    />
  );
}

function DialogHeader({
  className,
  children,
  hideCloseButton = false,
  ...props
}: React.ComponentProps<"div"> & { hideCloseButton?: boolean }) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "bg-zinc-50 dark:bg-zinc-900/50 flex flex-col gap-2 rounded-t-2xl border-b border-zinc-100 dark:border-zinc-800 p-6 text-center sm:text-left shrink-0 relative",
        className
      )}
      {...props}
    >
      {children}
      {!hideCloseButton && (
        <DialogPrimitive.Close className="ring-offset-background md:hover:bg-zinc-200 dark:md:hover:bg-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 absolute top-4 right-4 rounded-full p-2 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <XIcon className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "bg-zinc-50 dark:bg-zinc-900/50 flex flex-col gap-2 rounded-b-2xl border-t border-zinc-100 dark:border-zinc-800 p-6 sm:flex-row sm:justify-end shrink-0",
        className
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-xl leading-none font-semibold text-zinc-900 dark:text-zinc-100",
        className
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-zinc-500 dark:text-zinc-400 text-sm mt-1.5",
        className
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
