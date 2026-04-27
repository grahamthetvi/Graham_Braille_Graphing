import type { ChartDatum } from "./chartTypes";

export const DEFAULT_BAR_SCALE_HEIGHT = 3;

export function chartMaxValue(data: ChartDatum[]): number {
  if (!data.length) return 1;
  return Math.max(...data.map((d) => d.value), 1e-9);
}

export function barHeightForValue(value: number, maxValue: number, scaleHeight = DEFAULT_BAR_SCALE_HEIGHT): number {
  if (maxValue <= 0) return 0;
  return (value / maxValue) * scaleHeight;
}

export function barCenterX(
  baseX: number,
  index: number,
  count: number,
  barSpacing: number,
): number {
  return baseX + (index - (count - 1) / 2) * barSpacing;
}

/** Ease-out cubic, matches DraggableBarChart animation curve. */
export function easeOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - x, 3);
}

export function animatedBarHeights(
  targetHeights: number[],
  progress: number,
): number[] {
  const e = easeOutCubic(progress);
  return targetHeights.map((h) => h * e);
}
