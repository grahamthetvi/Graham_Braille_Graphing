import type { MutableRefObject } from "react";
import JXG from "jsxgraph";
import { buildPrimaryInitBoardOptions } from "./boardOptions";
import {
  applyBoardBackground,
  createDefaultMinorMajorGrid,
  ensurePlotHostId,
  freeBoardSafe,
} from "./boardLifecycle";
import { attachViewportChangeHooks, patchBoardCreateForSelection } from "./patchBoard";

export type MountWorkbenchBoardParams = {
  plotArea: HTMLDivElement;
  boardRef: MutableRefObject<unknown>;
  /** Latest handler when events fire (avoids stale closures). */
  getSelectObject: () => (obj: unknown) => void;
  getScheduleViewportUpdate: () => () => void;
};

/**
 * Creates the primary JSXGraph board, grid, selection patch, and zoom/viewport hooks.
 * Returns cleanup (frees board, detaches hooks).
 */
export function mountWorkbenchPrimaryBoard({
  plotArea,
  boardRef,
  getSelectObject,
  getScheduleViewportUpdate,
}: MountWorkbenchBoardParams): () => void {
  const divId = ensurePlotHostId(plotArea);
  freeBoardSafe(boardRef.current);

  boardRef.current = JXG.JSXGraph.initBoard(divId, buildPrimaryInitBoardOptions() as never);
  const board = boardRef.current as Parameters<typeof createDefaultMinorMajorGrid>[0];
  createDefaultMinorMajorGrid(board);

  patchBoardCreateForSelection(board as never, (obj) => getSelectObject()(obj));

  const detachViewport = attachViewportChangeHooks(board as never, () => getScheduleViewportUpdate()());

  return () => {
    detachViewport();
    try {
      freeBoardSafe(boardRef.current);
    } catch {
      /* noop */
    }
  };
}

export type PinchZoomParams = {
  plotArea: HTMLDivElement;
  boardRef: MutableRefObject<unknown>;
  getScheduleViewportUpdate: () => () => void;
  wheelHandlerRef: MutableRefObject<((e: WheelEvent) => void) | null>;
};

export function attachPinchZoomWheel({
  plotArea,
  boardRef,
  getScheduleViewportUpdate,
  wheelHandlerRef,
}: PinchZoomParams): () => void {
  const handler = (e: WheelEvent) => {
    const board = boardRef.current as {
      zoom?: (fx: number, fy: number, ux: number, uy: number) => void;
    } | null;
    if (!board?.zoom) return;
    if (!e.ctrlKey) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1 / 1.1 : 1.1;
    const Coords = (JXG as unknown as { Coords: new (...a: unknown[]) => { usrCoords: number[] } }).Coords;
    const COORDS_BY_SCREEN = (JXG as unknown as { COORDS_BY_SCREEN: unknown }).COORDS_BY_SCREEN;
    const coords = new Coords(COORDS_BY_SCREEN, [e.clientX, e.clientY], board);
    const usrX = coords.usrCoords[1];
    const usrY = coords.usrCoords[2];
    board.zoom(factor, factor, usrX, usrY);
    setTimeout(() => {
      getScheduleViewportUpdate()();
    }, 50);
  };

  wheelHandlerRef.current = handler;
  plotArea.addEventListener("wheel", handler, { passive: false });
  return () => {
    plotArea.removeEventListener("wheel", handler);
  };
}

export { applyBoardBackground, freeBoardSafe, ensurePlotHostId } from "./boardLifecycle";
export { buildClearAllBoardOptions, buildResetBoardOptions } from "./boardOptions";
