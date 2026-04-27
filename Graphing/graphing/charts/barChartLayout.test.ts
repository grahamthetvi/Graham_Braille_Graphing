import { describe, expect, it } from "vitest";
import {
  animatedBarHeights,
  barCenterX,
  barHeightForValue,
  chartMaxValue,
  easeOutCubic,
} from "./barChartLayout";

describe("chartMaxValue", () => {
  it("returns max of values", () => {
    expect(chartMaxValue([{ label: "a", value: 2 }, { label: "b", value: 5 }])).toBe(5);
  });
  it("uses 1 for empty data max denominator", () => {
    expect(chartMaxValue([])).toBe(1);
  });
});

describe("barHeightForValue", () => {
  it("scales to scaleHeight at max", () => {
    expect(barHeightForValue(10, 10, 3)).toBe(3);
  });
  it("returns 0 when max is 0", () => {
    expect(barHeightForValue(5, 0, 3)).toBe(0);
  });
});

describe("barCenterX", () => {
  it("centers single bar at baseX", () => {
    expect(barCenterX(0, 0, 1, 1)).toBe(0);
  });
});

describe("easeOutCubic", () => {
  it("clamps and hits endpoints", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(-1)).toBe(0);
  });
});

describe("animatedBarHeights", () => {
  it("scales all heights by eased progress", () => {
    const out = animatedBarHeights([2, 4], 1);
    expect(out[0]).toBe(2);
    expect(out[1]).toBe(4);
  });
});
