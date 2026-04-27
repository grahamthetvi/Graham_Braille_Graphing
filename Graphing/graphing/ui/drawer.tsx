"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

export const Drawer = Dialog.Root;
export const DrawerTrigger = Dialog.Trigger;
export const DrawerTitle = Dialog.Title;

type RadixPortal = Dialog.DialogPortalProps & { className?: string };

export const DrawerPortal = (props: RadixPortal) => {
  const { className: _dropped, ...rest } = props;
  return <Dialog.Portal {...rest} />;
};

const bottomSheetOverlay = [
  "fixed",
  "inset-0",
  "z-50",
  "bg-black/50",
  "data-[state=open]:animate-in",
  "data-[state=closed]:animate-out",
  "data-[state=closed]:fade-out-0",
  "data-[state=open]:fade-in-0",
].join(" ");

export const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof Dialog.Overlay>,
  React.ComponentPropsWithoutRef<typeof Dialog.Overlay>
>(({ className, ...rest }, ref) => (
  <Dialog.Overlay
    ref={ref}
    className={cn(bottomSheetOverlay, className)}
    {...rest}
  />
));
DrawerOverlay.displayName = Dialog.Overlay.displayName;

type DrawerContentEl = React.ElementRef<typeof Dialog.Content>;
type DrawerContentProps = React.ComponentPropsWithoutRef<typeof Dialog.Content>;

const bottomSheetContent = [
  "fixed",
  "bottom-0",
  "left-0",
  "right-0",
  "z-50",
  "mt-24",
  "flex",
  "h-auto",
  "flex-col",
  "rounded-t-lg",
  "border",
  "bg-background",
  "p-4",
  "shadow-lg",
  "data-[state=open]:animate-in",
  "data-[state=closed]:animate-out",
  "data-[state=open]:slide-in-from-bottom-10",
  "data-[state=closed]:slide-out-to-bottom-10",
].join(" ");

export const DrawerContent = React.forwardRef<DrawerContentEl, DrawerContentProps>(
  ({ className, children, ...rest }, ref) => (
    <DrawerPortal>
      <DrawerOverlay />
      <Dialog.Content
        ref={ref}
        className={cn(bottomSheetContent, className)}
        {...rest}
      >
        {children}
      </Dialog.Content>
    </DrawerPortal>
  )
);
DrawerContent.displayName = "DrawerContent";
