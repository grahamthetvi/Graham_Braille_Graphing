import { describe, expect, it } from "vitest";
import { pieSlicesFromData } from "./pieChartLayout";

describe("pieSlicesFromData", () => {
  it("splits full circle by weights", () => {
    const slices = pieSlicesFromData([
      { label: "a", value: 50 },
      { label: "b", value: 50 },
    ]);
    expect(slices).toHaveLength(2);
    expect(slices[0].percentage).toBeCloseTo(50);
    expect(slices[1].percentage).toBeCloseTo(50);
    expect(slices[0].endAngle - slices[0].startAngle).toBeCloseTo(Math.PI);
    expect(slices[1].endAngle - slices[1].startAngle).toBeCloseTo(Math.PI);
  });

  it("handles zero total", () => {
    const slices = pieSlicesFromData([
      { label: "a", value: 0 },
      { label: "b", value: 0 },
    ]);
    expect(slices[0].percentage).toBe(0);
  });
});
