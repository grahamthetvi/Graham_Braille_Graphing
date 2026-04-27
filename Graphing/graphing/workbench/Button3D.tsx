"use client";

import type { ReactNode } from "react";

type DepthButtonProps = {
  children: ReactNode;
  onClick: () => void;
  title: string;
  selected?: boolean;
  size?: "default" | "small";
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
        className={`wb-depth-hit ${selected ? "selected" : ""} ${size === "small" ? "small" : ""}`}
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
            <div className="icon">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
