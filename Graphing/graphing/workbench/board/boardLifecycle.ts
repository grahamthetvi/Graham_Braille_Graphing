import JXG from "jsxgraph";

export function freeBoardSafe(board: unknown) {
  if (!board) return;
  try {
    JXG.JSXGraph.freeBoard(board as never);
  } catch {
    /* ignore */
  }
}

export function applyBoardBackground(el: HTMLElement | null, color: string) {
  if (el) el.style.backgroundColor = color;
}

export function ensurePlotHostId(plotArea: HTMLDivElement): string {
  if (!plotArea.id) {
    plotArea.id = "jxg-workspace-" + Math.random().toString(36).slice(2);
  }
  return plotArea.id;
}

export function createDefaultMinorMajorGrid(board: { create: (...args: unknown[]) => unknown }) {
  board.create("grid", [], {
    major: {
      face: "line",
      strokeColor: "#e0e0e0",
      strokeWidth: 1,
      strokeOpacity: 0.8,
    },
    minor: {
      face: "line",
      strokeColor: "#e8e8e8",
      strokeWidth: 0.8,
      strokeOpacity: 0.8,
    },
    minorElements: 4,
    majorStep: 1,
  });
}
