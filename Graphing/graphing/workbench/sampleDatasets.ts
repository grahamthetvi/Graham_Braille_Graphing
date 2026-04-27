/** Demo bar series for statistics / draggable charts */
export function sampleSubjectBarRows(): Array<{ label: string; value: number }> {
  return [
    { label: "数学", value: 85 },
    { label: "物理", value: 78 },
    { label: "化学", value: 92 },
    { label: "生物", value: 88 },
    { label: "英语", value: 76 },
  ];
}

export function sampleGradePieSlices(): Array<{ label: string; value: number }> {
  return [
    { label: "优秀", value: 35 },
    { label: "良好", value: 28 },
    { label: "中等", value: 25 },
    { label: "及格", value: 12 },
  ];
}

export type ScatterDatum = { label: string; value: number; x: number; y: number };

/** Synthetic scatter rows for the stats overlay */
export function sampleScatterCloud(count = 20, rng = Math.random): ScatterDatum[] {
  const rows: ScatterDatum[] = [];
  for (let i = 0; i < count; i++) {
    rows.push({
      label: `点${i + 1}`,
      value: rng() * 100,
      x: rng() * 10 - 5,
      y: rng() * 10 - 5,
    });
  }
  return rows;
}
