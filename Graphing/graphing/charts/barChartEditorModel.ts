import type { ChartDatum } from "./chartTypes";

export const DEFAULT_BAR_CHART_ROWS: ChartDatum[] = [
  { label: "Math", value: 85 },
  { label: "Physics", value: 78 },
  { label: "Chemistry", value: 92 },
  { label: "Biology", value: 88 },
  { label: "English", value: 76 },
];

export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function updateBarRow(
  rows: ChartDatum[],
  index: number,
  field: keyof ChartDatum,
  value: string | number,
): ChartDatum[] {
  return rows.map((item, i) => {
    if (i !== index) return item;
    if (field === "value") {
      const n = typeof value === "number" ? value : Number(value);
      return { ...item, value: Number.isFinite(n) ? clampPercent(n) : item.value };
    }
    return { ...item, label: String(value) };
  });
}

export function addBarRow(rows: ChartDatum[]): ChartDatum[] {
  return [...rows, { label: `Item ${rows.length + 1}`, value: 50 }];
}

export function removeBarRow(rows: ChartDatum[], index: number): ChartDatum[] {
  if (rows.length <= 1) return rows;
  return rows.filter((_, i) => i !== index);
}
