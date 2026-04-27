/** Demo bar series for statistics / draggable charts */
export function sampleSubjectBarRows(): Array<{ label: string; value: number }> {
  return [
    { label: "Math", value: 85 },
    { label: "Physics", value: 78 },
    { label: "Chemistry", value: 92 },
    { label: "Biology", value: 88 },
    { label: "English", value: 76 },
  ];
}

export function sampleGradePieSlices(): Array<{ label: string; value: number }> {
  return [
    { label: "Excellent", value: 35 },
    { label: "Good", value: 28 },
    { label: "Average", value: 25 },
    { label: "Pass", value: 12 },
  ];
}

export type ScatterDatum = { label: string; value: number; x: number; y: number };

/** Synthetic scatter rows for the stats overlay */
export function sampleScatterCloud(count = 20, rng = Math.random): ScatterDatum[] {
  const rows: ScatterDatum[] = [];
  for (let i = 0; i < count; i++) {
    rows.push({
      label: `Point ${i + 1}`,
      value: rng() * 100,
      x: rng() * 10 - 5,
      y: rng() * 10 - 5,
    });
  }
  return rows;
}
