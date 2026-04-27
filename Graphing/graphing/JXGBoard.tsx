"use client";

import { useEffect, useRef } from "react";
import JXG from "jsxgraph";

const VIEW_BOX = [-12, 12, 12, -12] as const;
const CURVE_COLOR = "#6366f1";
const STROKE = 2;

/** Minimal demo board: axes plus `sin(x)` (client-only). */
export default function JXGBoard() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    if (!el.id) {
      el.id = `jxg-demo-${Math.random().toString(36).slice(2)}`;
    }

    const board = JXG.JSXGraph.initBoard(el.id, {
      boundingbox: [...VIEW_BOX],
      axis: true,
    });

    board.create(
      "functiongraph",
      [
        function sineWave(x: number) {
          return Math.sin(x);
        },
      ],
      { strokeColor: CURVE_COLOR, strokeWidth: STROKE }
    );

    return () => {
      try {
        JXG.JSXGraph.freeBoard(board);
      } catch {
        /* ignore */
      }
    };
  }, []);

  return <div ref={host} className="h-[400px] w-full" />;
}
