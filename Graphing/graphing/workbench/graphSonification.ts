import type { SonificationCue, ToneTimbre } from "./audioEngine";

/** Logarithmic pitch mapping: 4 octaves from 220 Hz to 3520 Hz across [yMin, yMax]. */
export function yToFreq(y: number, yMin: number, yMax: number): number {
  if (!Number.isFinite(y)) return 440;
  if (yMax === yMin) return 880;
  const t = (y - yMin) / (yMax - yMin);
  const hz = 220 * Math.pow(2, t * 4);
  return Math.max(30, Math.min(8000, hz));
}

/** Map x in [xMin, xMax] to stereo pan [-1, 1]. */
export function xToPan(x: number, xMin: number, xMax: number): number {
  if (xMax === xMin) return 0;
  const t = (x - xMin) / (xMax - xMin);
  return Math.max(-1, Math.min(1, 2 * t - 1));
}

export function derivativeStep(xMin: number, xMax: number): number {
  const span = xMax - xMin;
  return Math.max(1e-9, span * 1e-6);
}

export function evaluateDy(
  getY: (x: number) => number,
  x: number,
  h: number
): number {
  return (getY(x + h) - getY(x - h)) / (2 * h);
}

export function evaluateD2y(getY: (x: number) => number, x: number, h: number): number {
  return (getY(x + h) - 2 * getY(x) + getY(x - h)) / (h * h);
}

export type SonifySample = {
  x: number;
  y: number;
  dy: number;
  d2y: number;
  valid: boolean;
};

export function buildSample(
  x: number,
  getY: (x: number) => number,
  xMin: number,
  xMax: number
): SonifySample {
  const h = derivativeStep(xMin, xMax);
  let y: number;
  let valid = true;
  try {
    y = getY(x);
    if (!Number.isFinite(y)) valid = false;
  } catch {
    y = NaN;
    valid = false;
  }
  if (!valid) {
    return { x, y: NaN, dy: NaN, d2y: NaN, valid: false };
  }
  let dy: number;
  let d2y: number;
  try {
    dy = evaluateDy(getY, x, h);
    d2y = evaluateD2y(getY, x, h);
    if (!Number.isFinite(dy)) dy = 0;
    if (!Number.isFinite(d2y)) d2y = 0;
  } catch {
    dy = 0;
    d2y = 0;
  }
  return { x, y, dy, d2y, valid: true };
}

const CUE_EPS = 1e-7;

/** Priority-ordered cues for the transition prev → next (discrete probe steps). */
export function detectSonificationCues(
  prev: SonifySample | null,
  next: SonifySample,
  ySpan: number
): SonificationCue[] {
  const out: SonificationCue[] = [];
  if (!prev) return out;

  const span = Math.max(1e-9, ySpan);
  const jumpThresh = 0.2 * span;

  const prevV = prev.valid && Number.isFinite(prev.y);
  const nextV = next.valid && Number.isFinite(next.y);

  if (prevV !== nextV) {
    out.push("asymptote");
    return out;
  }

  if (prevV && nextV && Math.abs(next.y - prev.y) > jumpThresh) {
    out.push("asymptote");
    return out;
  }

  if (prevV && nextV) {
    if (prev.y !== 0 && next.y !== 0 && prev.y * next.y < 0) {
      out.push("zero");
    } else if (
      (Math.abs(prev.y) < CUE_EPS && Math.abs(next.y) > CUE_EPS) ||
      (Math.abs(next.y) < CUE_EPS && Math.abs(prev.y) > CUE_EPS)
    ) {
      out.push("zero");
    }

    if (Number.isFinite(prev.dy) && Number.isFinite(next.dy)) {
      if (prev.dy > 0 && next.dy < 0) out.push("extremum");
      else if (prev.dy < 0 && next.dy > 0) out.push("extremum");
    }

    if (Number.isFinite(prev.d2y) && Number.isFinite(next.d2y)) {
      const mag = Math.min(Math.abs(prev.d2y), Math.abs(next.d2y));
      if (mag > 1e-12 && prev.d2y * next.d2y < 0) {
        out.push("inflection");
      }
    }
  }

  return out;
}

/** Waveform cycle for multi-graph differentiation. */
export function timbreForCurveIndex(index: number): ToneTimbre {
  const t: ToneTimbre[] = ["sine", "triangle", "sawtooth"];
  return t[index % 3]!;
}

/** Narrow stereo range per curve when layering (solo uses full ×0.6 + bias). */
export function panSpreadForCurveIndex(index: number): number {
  return ([-0.25, 0, 0.25] as const)[index % 3];
}

/**
 * Map first derivative to Hz for slope mode (positive slope → higher pitch).
 */
export function slopeToFreq(
  dy: number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number
): number {
  const xSpan = Math.max(1e-9, xMax - xMin);
  const ySpan = Math.max(1e-9, yMax - yMin);
  const charSlope = ySpan / xSpan;
  const ratio = dy / (charSlope * 4 || 1e-9);
  const t = Math.max(-1, Math.min(1, ratio / 3));
  const hz = 220 * Math.pow(2, (t + 1) * 2);
  return Math.max(30, Math.min(8000, hz));
}

export function isNearZeroSlope(dy: number, xMin: number, xMax: number): boolean {
  const xSpan = Math.max(1e-9, xMax - xMin);
  const scale = 1 / xSpan;
  return Math.abs(dy) < scale * 1e-4;
}
