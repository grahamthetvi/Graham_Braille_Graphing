import * as React from "react";
import { cn } from "@/lib/utils";

type DivAttributes = React.HTMLAttributes<HTMLDivElement>;

const shell =
  "rounded-lg border bg-card text-card-foreground shadow-sm";
const contentPad = "p-4";

export const Card = React.forwardRef<HTMLDivElement, DivAttributes>(
  ({ className, ...divProps }, forwardedRef) => (
    <div
      ref={forwardedRef}
      className={cn(shell, className)}
      {...divProps}
    />
  )
);
Card.displayName = "Card";

export const CardContent = React.forwardRef<HTMLDivElement, DivAttributes>(
  ({ className, ...divProps }, forwardedRef) => (
    <div
      ref={forwardedRef}
      className={cn(contentPad, className)}
      {...divProps}
    />
  )
);
CardContent.displayName = "CardContent";
