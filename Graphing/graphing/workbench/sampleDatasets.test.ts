import { describe, expect, it } from "vitest";
import {
  sampleGradePieSlices,
  sampleScatterCloud,
  sampleSubjectBarRows,
} from "./sampleDatasets";

describe("sampleDatasets", () => {
  it("returns five subject bars", () => {
    expect(sampleSubjectBarRows()).toHaveLength(5);
    expect(sampleSubjectBarRows()[0]).toMatchObject({ label: "Math", value: 85 });
  });

  it("returns four pie slices", () => {
    expect(sampleGradePieSlices()).toHaveLength(4);
  });

  it("scatter uses deterministic rng", () => {
    const rng = () => 0.5;
    const pts = sampleScatterCloud(3, rng);
    expect(pts).toHaveLength(3);
    expect(pts[0].x).toBe(0);
    expect(pts[0].y).toBe(0);
  });
});
