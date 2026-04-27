"use client";

import * as React from "react";
import * as D from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

export const Sheet = D.Root;
export const SheetTrigger = D.Trigger;
export const SheetTitle = D.Title;

const Port = D.Portal;

const dimLayer =
  "fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0";
const mainPanel =
  "fixed top-0 z-50 h-full w-80 bg-background shadow-xl flex flex-col border";
const openRight =
  "right-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right-10 data-[state=closed]:slide-out-to-right-10";
const openLeft =
  "left-0 data-[state=open]:slide-in-from-left-10 data-[state=closed]:slide-out-to-left-10";

export const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof D.Overlay>,
  React.ComponentPropsWithoutRef<typeof D.Overlay>
>(({ className, ...p }, ref) => (
  <D.Overlay ref={ref} className={cn(dimLayer, className)} {...p} />
));
SheetOverlay.displayName = "SheetOverlay";

interface SheetBoxProps extends React.ComponentPropsWithoutRef<typeof D.Content> {
  side?: "right" | "left";
}

type CRef = React.ElementRef<typeof D.Content>;
export const SheetContent = React.forwardRef<CRef, SheetBoxProps>(
  ({ className, side = "right", children, ...p }, ref) => (
    <Port>
      <SheetOverlay />
      <D.Content
        ref={ref}
        className={cn(mainPanel, side === "right" ? openRight : openLeft, className)}
        {...p}
      >
        {children}
      </D.Content>
    </Port>
  )
);
SheetContent.displayName = "SheetContent";
