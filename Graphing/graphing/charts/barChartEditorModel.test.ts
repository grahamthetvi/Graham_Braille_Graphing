import { describe, expect, it } from "vitest";
import {
  addBarRow,
  clampPercent,
  DEFAULT_BAR_CHART_ROWS,
  removeBarRow,
  updateBarRow,
} from "./barChartEditorModel";

describe("clampPercent", () => {
  it("clamps to 0–100", () => {
    expect(clampPercent(-5)).toBe(0);
    expect(clampPercent(120)).toBe(100);
  });
});

describe("updateBarRow", () => {
  it("updates label", () => {
    const next = updateBarRow(DEFAULT_BAR_CHART_ROWS, 0, "label", "X");
    expect(next[0].label).toBe("X");
  });
  it("clamps numeric value", () => {
    const next = updateBarRow(DEFAULT_BAR_CHART_ROWS, 0, "value", 200);
    expect(next[0].value).toBe(100);
  });
});

describe("addBarRow", () => {
  it("appends with default value", () => {
    const next = addBarRow([{ label: "a", value: 1 }]);
    expect(next).toHaveLength(2);
    expect(next[1].value).toBe(50);
  });
});

describe("removeBarRow", () => {
  it("keeps at least one row", () => {
    expect(removeBarRow([{ label: "a", value: 1 }], 0)).toHaveLength(1);
  });
});
