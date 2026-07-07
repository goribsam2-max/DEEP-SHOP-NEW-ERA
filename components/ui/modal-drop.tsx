"use client"

import React from "react";
import { Modal as ShugarModal } from "./modal";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  allowEasyClose?: boolean;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  type?: "blur" | "overlay" | "none";
  showCloseButton?: boolean;
  showEscText?: boolean;
  borderBottom?: boolean;
  className?: string;
  animationType?: "drop" | "scale";
  position?: number;
  disablePadding?: boolean;
  zIndex?: number;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  allowEasyClose = true,
  title,
  subtitle,
  type = "overlay",
  showCloseButton = true,
  showEscText = true,
  borderBottom = true,
  className,
  animationType = "scale",
  position = 0,
  disablePadding = false,
  zIndex
}) => {
  return (
    <ShugarModal.Modal zIndex={zIndex} active={isOpen} onClickOutside={() => {
      if (allowEasyClose) onClose();
    }}>
      <ShugarModal.Body className={cn(className, disablePadding && "p-0")}>
        {(title || subtitle) && (
          <ShugarModal.Header>
            {title && <ShugarModal.Title>{title}</ShugarModal.Title>}
            {subtitle && <ShugarModal.Subtitle>{subtitle}</ShugarModal.Subtitle>}
          </ShugarModal.Header>
        )}
        
        {/* We wrap the content without inset for backward compatibility, except you can also use Inset if needed. We just pass children down. */}
        {children}
      </ShugarModal.Body>
    </ShugarModal.Modal>
  );
};

export default Modal;
