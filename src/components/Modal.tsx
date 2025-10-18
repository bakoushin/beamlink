"use client";

import * as React from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
  title?: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
  drawerContentClassName?: string;
  dialogContentClassName?: string;
  repositionInputs?: boolean;
}

export function Modal({
  open,
  onOpenChange,
  trigger,
  title,
  children,
  contentClassName,
  drawerContentClassName,
  dialogContentClassName,
  repositionInputs = false,
}: ModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className={dialogContentClassName || contentClassName}>
          {title && (
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
          )}
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      repositionInputs={repositionInputs}
    >
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent className={drawerContentClassName || contentClassName}>
        {title && (
          <DrawerHeader>
            <DrawerTitle className="text-left">{title}</DrawerTitle>
          </DrawerHeader>
        )}
        {children}
      </DrawerContent>
    </Drawer>
  );
}
