"use client";

import type { ReactNode } from "react";

type DepthButtonProps = {
  children: ReactNode;
  onClick: () => void;
  title: string;
  selected?: boolean;
  size?: "default" | "small" | "pill";
  "data-testid"?: string;
};

/** Raised circular control matching workbench depth styling */
export function DepthToggleButton({
  children,
  onClick,
  title,
  selected = false,
  size = "default",
  "data-testid": dataTestId,
}: DepthButtonProps) {
  return (
    <div className="wb-depth-wrap" title={title}>
      <div
        data-testid={dataTestId}
        role="button"
        aria-label={title}
        tabIndex={0}
        className={`wb-depth-hit ${selected ? "selected" : ""} ${size === "small" ? "small" : size === "pill" ? "pill" : ""}`}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <div className="wb-depth-outer">
          <div className="wb-depth-inner">
            <div className={`icon ${size === 'pill' ? 'flex items-center gap-2 px-4' : ''}`}>
              {children}
              {size === 'pill' && <span className="font-semibold">{title}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
