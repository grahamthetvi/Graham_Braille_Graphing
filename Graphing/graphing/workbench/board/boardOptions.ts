/** Single source of truth for JSXGraph board construction (Workbench). */

export const DEFAULT_BOUNDING_BOX: [number, number, number, number] = [-12, 12, 12, -12];

export function defaultAxesOptions() {
  return {
    x: {
      strokeColor: "#666666",
      strokeWidth: 1,
      ticks: {
        strokeColor: "#666666",
        strokeWidth: 1,
        majorHeight: 10,
        minorHeight: 5,
        minorTicks: 4,
        drawLabels: true,
        label: {
          fontSize: 12,
          color: "#666666",
        },
      },
    },
    y: {
      strokeColor: "#666666",
      strokeWidth: 1,
      ticks: {
        strokeColor: "#666666",
        strokeWidth: 1,
        majorHeight: 10,
        minorHeight: 5,
        minorTicks: 4,
        drawLabels: true,
        label: {
          fontSize: 12,
          color: "#666666",
        },
      },
    },
  } as const;
}

/** Primary mount: matches original Workbench init (axis on, zoom, copyright off). */
export function buildPrimaryInitBoardOptions() {
  return {
    boundingbox: [...DEFAULT_BOUNDING_BOX] as number[],
    axis: true,
    defaultAxes: defaultAxesOptions(),
    grid: true,
    pan: {
      enabled: true,
      needShift: false,
      needTwoFingers: false,
    },
    zoom: {
      factorX: 1.25,
      factorY: 1.25,
      wheel: true,
    },
    showCopyright: false,
  };
}

/** clearAll() recreation: respects axis visibility; no zoom block (legacy behavior). */
export function buildClearAllBoardOptions(axisGuidesVisible: boolean) {
  return {
    boundingbox: [...DEFAULT_BOUNDING_BOX] as number[],
    axis: axisGuidesVisible,
    defaultAxes: defaultAxesOptions(),
    grid: true,
    pan: {
      enabled: true,
      needShift: false,
      needTwoFingers: false,
    },
  };
}

/** resetBoard(): minimal re-init preserving bounding box. */
export function buildResetBoardOptions(boundingbox: number[]) {
  return {
    boundingbox: [...boundingbox] as number[],
    axis: true,
  };
}
