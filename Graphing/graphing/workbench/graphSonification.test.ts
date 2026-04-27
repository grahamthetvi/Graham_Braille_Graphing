import { describe, expect, it } from "vitest";
import {
  buildSample,
  detectSonificationCues,
  isNearZeroSlope,
  slopeToFreq,
  timbreForCurveIndex,
  xToPan,
  yToFreq,
} from "./graphSonification";

describe("yToFreq", () => {
  it("maps endpoints to 220 Hz and ~3520 Hz over four octaves", () => {
    expect(yToFreq(0, 0, 1)).toBeCloseTo(220, 5);
    expect(yToFreq(1, 0, 1)).toBeCloseTo(3520, -2);
  });

  it("returns mid band when y range is zero", () => {
    const f = yToFreq(3, 2, 2);
    expect(f).toBe(880);
  });

  it("clamps to safe hearing range", () => {
    expect(yToFreq(-1e9, 0, 1)).toBe(30);
    expect(yToFreq(1e9, 0, 1)).toBe(8000);
  });
});

describe("xToPan", () => {
  it("maps left to -1 and right to +1", () => {
    expect(xToPan(0, 0, 10)).toBeCloseTo(-1, 5);
    expect(xToPan(10, 0, 10)).toBeCloseTo(1, 5);
    expect(xToPan(5, 0, 10)).toBeCloseTo(0, 5);
  });
});

describe("slopeToFreq", () => {
  it("returns finite hz for typical slope", () => {
    const f = slopeToFreq(1, 0, 10, 0, 10);
    expect(f).toBeGreaterThan(30);
    expect(f).toBeLessThan(8000);
  });
});

describe("timbreForCurveIndex", () => {
  it("cycles waveforms", () => {
    expect(timbreForCurveIndex(0)).toBe("sine");
    expect(timbreForCurveIndex(1)).toBe("triangle");
    expect(timbreForCurveIndex(2)).toBe("sawtooth");
    expect(timbreForCurveIndex(3)).toBe("sine");
  });
});

describe("buildSample", () => {
  it("marks invalid when getY returns NaN", () => {
    const s = buildSample(0, () => NaN, -1, 1);
    expect(s.valid).toBe(false);
  });
});

describe("detectSonificationCues", () => {
  it("detects zero crossing", () => {
    const prev = { x: -0.1, y: -1, dy: 1, d2y: 0, valid: true };
    const next = { x: 0.1, y: 1, dy: 1, d2y: 0, valid: true };
    const cues = detectSonificationCues(prev, next, 10);
    expect(cues).toContain("zero");
  });

  it("detects extremum when derivative flips sign", () => {
    const prev = { x: 0, y: 1, dy: 0.1, d2y: -1, valid: true };
    const next = { x: 0.1, y: 0.9, dy: -0.1, d2y: -1, valid: true };
    const cues = detectSonificationCues(prev, next, 10);
    expect(cues).toContain("extremum");
  });

  it("prioritizes asymptote on validity flip", () => {
    const prev = { x: 0, y: 1, dy: 0, d2y: 0, valid: true };
    const next = { x: 0.1, y: NaN, dy: NaN, d2y: NaN, valid: false };
    const cues = detectSonificationCues(prev, next, 10);
    expect(cues[0]).toBe("asymptote");
  });

  it("detects inflection when second derivative changes sign", () => {
    const prev = { x: 0, y: 0, dy: 1, d2y: -0.5, valid: true };
    const next = { x: 0.1, y: 0, dy: 1, d2y: 0.5, valid: true };
    const cues = detectSonificationCues(prev, next, 10);
    expect(cues).toContain("inflection");
  });
});

describe("isNearZeroSlope", () => {
  it("is true for tiny dy", () => {
    expect(isNearZeroSlope(1e-12, 0, 10)).toBe(true);
  });
});
