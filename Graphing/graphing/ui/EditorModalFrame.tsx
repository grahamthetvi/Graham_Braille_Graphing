"use client";

import type { ReactNode } from "react";
import { Button } from "@/graphing/ui/button";

type EditorModalFrameProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  onApply?: () => void;
  applyLabel?: string;
  /** When false, only Cancel is shown (e.g. BarChartEditor uses custom footer). */
  showApply?: boolean;
};

/**
 * Shared backdrop + card shell for small numeric editors (sine, ellipse, etc.).
 */
export function EditorModalFrame({
  open,
  title,
  subtitle,
  children,
  onClose,
  onApply,
  applyLabel = "Apply",
  showApply = true,
}: EditorModalFrameProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-background rounded-md shadow-lg p-4 w-80 space-y-4">
        <h3 className="text-sm font-medium">{title}</h3>
        {subtitle ? <p className="text-xs text-muted-foreground -mt-2">{subtitle}</p> : null}
        <div className="flex flex-col gap-3 text-sm">{children}</div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          {showApply && onApply ? (
            <Button size="sm" onClick={onApply}>
              {applyLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
