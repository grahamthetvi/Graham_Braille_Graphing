import type { ChartDatum } from "./chartTypes";

export const DEFAULT_PIE_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#84cc16",
] as const;

export type PieSlice = {
  index: number;
  label: string;
  value: number;
  percentage: number;
  startAngle: number;
  endAngle: number;
  midAngle: number;
  color: string;
};

export function pieSlicesFromData(data: ChartDatum[]): PieSlice[] {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total <= 0) {
    return data.map((d, i) => ({
      index: i,
      label: d.label,
      value: d.value,
      percentage: 0,
      startAngle: 0,
      endAngle: 0,
      midAngle: 0,
      color: DEFAULT_PIE_COLORS[i % DEFAULT_PIE_COLORS.length],
    }));
  }
  let current = 0;
  return data.map((d, i) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const startAngle = current;
    const endAngle = current + angle;
    const midAngle = (startAngle + endAngle) / 2;
    current = endAngle;
    return {
      index: i,
      label: d.label,
      value: d.value,
      percentage: (d.value / total) * 100,
      startAngle,
      endAngle,
      midAngle,
      color: DEFAULT_PIE_COLORS[i % DEFAULT_PIE_COLORS.length],
    };
  });
}
