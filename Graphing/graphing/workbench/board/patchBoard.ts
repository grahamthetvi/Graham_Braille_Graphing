/** Imperative JSXGraph board patches (selection + viewport-driven updates). */

export function patchBoardCreateForSelection(
  board: { create: (...args: unknown[]) => unknown; on?: (ev: string, fn: (...args: unknown[]) => void) => void },
  selectObject: (obj: unknown) => void,
) {
  const b = board as { _selectPatched?: boolean; create: (...a: unknown[]) => unknown };
  if (b._selectPatched) return;
  const origCreate = b.create.bind(b);
  b.create = function (...args: unknown[]) {
    const obj = origCreate(...args) as { on?: (ev: string, fn: () => void) => void };
    if (obj && typeof obj.on === "function") {
      obj.on("down", () => selectObject(obj));
    }
    return obj;
  } as typeof b.create;
  b._selectPatched = true;
}

export function attachViewportChangeHooks(
  board: {
    on: (ev: string, fn: () => void) => void;
    zoomIn: (...args: unknown[]) => unknown;
    zoomOut: (...args: unknown[]) => unknown;
    setBoundingBox: (...args: unknown[]) => unknown;
  },
  scheduleUpdate: () => void,
): () => void {
  const updateHandler = () => {
    setTimeout(() => scheduleUpdate(), 100);
  };

  board.on("up", updateHandler);
  board.on("mouseup", updateHandler);
  board.on("touchend", updateHandler);

  const originalZoomIn = board.zoomIn.bind(board);
  const originalZoomOut = board.zoomOut.bind(board);
  const originalSetBoundingBox = board.setBoundingBox.bind(board);

  board.zoomIn = function (...args: unknown[]) {
    const result = originalZoomIn(...args);
    updateHandler();
    return result;
  };

  board.zoomOut = function (...args: unknown[]) {
    const result = originalZoomOut(...args);
    updateHandler();
    return result;
  };

  board.setBoundingBox = function (...args: unknown[]) {
    const result = originalSetBoundingBox(...args);
    updateHandler();
    return result;
  };

  const b = board as { off?: (ev: string, fn: () => void) => void };
  return () => {
    try {
      b.off?.("up", updateHandler);
      b.off?.("mouseup", updateHandler);
      b.off?.("touchend", updateHandler);
    } catch {
      /* noop */
    }
  };
}
