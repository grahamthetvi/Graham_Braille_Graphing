"use client";

import type { CSSProperties, RefObject } from "react";
import { Eraser, Redo2, Settings, Undo2 } from "lucide-react";

type RadialToolMenuProps = {
  hostRef: RefObject<HTMLDivElement | null>;
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onClearBoard: () => void;
  onUndo: () => void;
  onRedo: () => void;
};

/** Fan-out actions anchored near the bottom-left corner */
export function RadialToolMenu({
  hostRef,
  open,
  onOpenChange,
  onClearBoard,
  onUndo,
  onRedo,
}: RadialToolMenuProps) {
  return (
    <div className="contents">
      <div
        ref={hostRef}
        className="fixed z-40"
        style={{
          left: "32px",
          bottom: "40px",
          transform: "translate(-50%, 50%)",
        }}
      >
        <div className="menu-tooltip">
          <input
            type="checkbox"
            id="wb-radial-toggle"
            checked={open}
            onChange={(e) => onOpenChange(e.target.checked)}
          />
          <label htmlFor="wb-radial-toggle" className="toggle">
            <Settings className="w-4 h-4" />
          </label>

          <div className="circle-box" style={{ "--i": 1 } as CSSProperties}>
            <div
              className="anchor"
              onClick={(e) => {
                e.stopPropagation();
                onClearBoard();
              }}
              title="清除画布"
            >
              <Eraser className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="circle-box" style={{ "--i": 2 } as CSSProperties}>
            <div
              className="anchor"
              onClick={(e) => {
                e.stopPropagation();
                onUndo();
              }}
              title="撤销 (上一步)"
            >
              <Undo2 className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="circle-box" style={{ "--i": 3 } as CSSProperties}>
            <div
              className="anchor"
              onClick={(e) => {
                e.stopPropagation();
                onRedo();
              }}
              title="重做 (下一步)"
            >
              <Redo2 className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .menu-tooltip {
          --toggle-color: hsl(var(--background));
          --item-1-gradient: linear-gradient(45deg, #ef4444, #dc2626);
          --item-2-gradient: linear-gradient(45deg, #3b82f6, #2563eb);
          --item-3-gradient: linear-gradient(45deg, #10b981, #059669);
          width: 140px;
          height: 140px;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 14px;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }

        .toggle {
          width: 44px;
          height: 44px;
          background: #ffffff;
          border: 2px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 1.1em;
          z-index: 999;
          position: absolute;
          transition: all 0.3s ease-in-out;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          color: #374151;
        }

        .toggle:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
          transform: scale(1.05);
        }

        #wb-radial-toggle {
          appearance: none;
          visibility: hidden;
        }

        #wb-radial-toggle:checked + .toggle {
          transform: rotate(315deg);
        }

        #wb-radial-toggle:checked ~ .circle-box {
          opacity: 1;
          pointer-events: auto;
        }

        #wb-radial-toggle:checked ~ .circle-box:nth-child(3) {
          transform: translateX(65px) translateY(0px);
          transition-delay: 0.1s;
        }

        #wb-radial-toggle:checked ~ .circle-box:nth-child(4) {
          transform: translateX(46px) translateY(-46px);
          transition-delay: 0.2s;
        }

        #wb-radial-toggle:checked ~ .circle-box:nth-child(5) {
          transform: translateX(0px) translateY(-65px);
          transition-delay: 0.3s;
        }

        .circle-box {
          position: absolute;
          left: 50%;
          top: 50%;
          margin-left: -18px;
          margin-top: -18px;
          list-style-type: none;
          transition: all 0.3s ease;
          transform: translateX(0px) translateY(0px);
          opacity: 0;
          pointer-events: none;
        }

        .circle-box:nth-child(3) {
          transition-delay: 0.3s;
        }

        .circle-box:nth-child(4) {
          transition-delay: 0.2s;
        }

        .circle-box:nth-child(5) {
          transition-delay: 0.1s;
        }

        .circle-box:nth-child(3) .anchor {
          background: var(--item-3-gradient);
        }

        .circle-box:nth-child(4) .anchor {
          background: var(--item-2-gradient);
        }

        .circle-box:nth-child(5) .anchor {
          background: var(--item-1-gradient);
        }

        .anchor {
          width: 36px;
          height: 36px;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.2);
          font-size: 1em;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .anchor:hover {
          transform: rotate(calc(360deg / -8 * var(--i))) scale(1.1);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }

        .anchor:before {
          content: "";
          position: absolute;
          inset: 0px;
          background-image: inherit;
          border-radius: inherit;
          z-index: -1;
          filter: blur(20px) saturate(120%) opacity(0.6);
          transition: all 0.3s ease;
        }

        .anchor:hover:before {
          filter: blur(25px) saturate(150%) opacity(0.8);
        }
      `}</style>
    </div>
  );
}
