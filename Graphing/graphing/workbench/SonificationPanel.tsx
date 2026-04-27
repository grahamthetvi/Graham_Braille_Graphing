"use client";

import type { CSSProperties, MutableRefObject } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/graphing/ui/button";
import { Slider } from "@/graphing/ui/slider";
import { Pause, Play, Volume2 } from "lucide-react";
import { AudioGraphEngine } from "./audioEngine";
import {
  buildSample,
  detectSonificationCues,
  isNearZeroSlope,
  panSpreadForCurveIndex,
  slopeToFreq,
  timbreForCurveIndex,
  xToPan,
  yToFreq,
} from "./graphSonification";
import type { SketchEntry } from "./types";

const MACRO_DEFAULT_S = 5;
const CUE_DEBOUNCE_MS = 140;
const PROBE_STEPS = 200;

const liveRegionStyle: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

type Props = {
  boardRef: MutableRefObject<any>;
  sketchEntries: SketchEntry[];
  focusedSheetId: string;
  sonifyTargetId: string | null;
  onSonifyTargetIdChange: (id: string | null) => void;
};

export function SonificationPanel({
  boardRef,
  sketchEntries,
  focusedSheetId,
  sonifyTargetId,
  onSonifyTargetIdChange,
}: Props) {
  const engineRef = useRef(new AudioGraphEngine());
  const probePointRef = useRef<any>(null);
  const prevSampleRef = useRef<ReturnType<typeof buildSample> | null>(null);
  const lastCueAtRef = useRef(0);
  const lastWasFlatRef = useRef(false);
  const macroRafRef = useRef<number | null>(null);
  const macroPlayingRef = useRef(false);
  const macroStartMsRef = useRef(0);
  const macroBboxRef = useRef<[number, number, number, number] | null>(null);
  const announceIdRef = useRef(0);

  const [sonifyEnabled, setSonifyEnabled] = useState(false);
  const [probeX, setProbeX] = useState(0);
  const [probePct, setProbePct] = useState(50);
  const [sonifyMode, setSonifyMode] = useState<"value" | "slope">("value");
  const [macroPlaying, setMacroPlaying] = useState(false);
  const [volumePct, setVolumePct] = useState(70);
  const [liveText, setLiveText] = useState("");

  const announce = useCallback((msg: string) => {
    announceIdRef.current += 1;
    setLiveText(`${msg} (${announceIdRef.current})`);
  }, []);

  const visibleEntries = useMemo(
    () => sketchEntries.filter((e) => e.visible),
    [sketchEntries]
  );
  const soloEntry: SketchEntry | null =
    visibleEntries.find((e) => e.id === sonifyTargetId) ?? visibleEntries[0] ?? null;
  const soloIndex = soloEntry ? visibleEntries.findIndex((e) => e.id === soloEntry.id) : 0;

  useEffect(() => {
    if (sonifyTargetId && !visibleEntries.some((e) => e.id === sonifyTargetId)) {
      onSonifyTargetIdChange(null);
    }
  }, [sonifyTargetId, visibleEntries, onSonifyTargetIdChange]);

  const getY = useCallback(
    (x: number) => {
      if (!soloEntry) return NaN;
      return soloEntry.compiled.evaluate({ x }) as number;
    },
    [soloEntry]
  );

  const readBbox = useCallback((): [number, number, number, number] | null => {
    const b = boardRef.current;
    if (!b?.getBoundingBox) return null;
    return b.getBoundingBox() as [number, number, number, number];
  }, [boardRef]);

  const syncProbePctFromX = useCallback(
    (x: number, bb: [number, number, number, number]) => {
      const [left, , right] = bb;
      if (right === left) setProbePct(50);
      else setProbePct(Math.max(0, Math.min(100, ((x - left) / (right - left)) * 100)));
    },
    []
  );

  useEffect(() => {
    const bb = readBbox();
    if (!bb) return;
    const [left, , right] = bb;
    setProbeX((px) => Math.max(left, Math.min(right, px)));
  }, [readBbox, focusedSheetId, soloEntry?.id]);

  const syncProbePoint = useCallback(() => {
    const board = boardRef.current;
    const bb = readBbox();
    if (!board || !bb || !board.renderer) return;
    const [left, top, right, bottom] = bb;
    const x = Math.max(left, Math.min(right, probeX));
    let y = 0;
    let ok = false;
    if (soloEntry) {
      try {
        y = getY(x);
        ok = Number.isFinite(y);
      } catch {
        ok = false;
      }
    }
    if (!probePointRef.current) {
      probePointRef.current = board.create("point", [x, ok ? y : 0], {
        name: "",
        size: 4,
        strokeColor: "#a855f7",
        fillColor: "#c084fc",
        fixed: true,
      });
    } else {
      try {
        probePointRef.current.moveTo([x, ok ? y : 0], 0);
      } catch {
        probePointRef.current = null;
      }
    }
    board.update?.();
  }, [boardRef, readBbox, probeX, soloEntry, getY]);

  useEffect(() => {
    syncProbePoint();
  }, [syncProbePoint, probeX, soloEntry?.id]);

  useEffect(() => {
    probePointRef.current = null;
  }, [focusedSheetId]);

  const applyToneAtX = useCallback(
    (x: number, playCues: boolean) => {
      const bb = readBbox();
      if (!bb || !sonifyEnabled) return;
      const [left, top, right, bottom] = bb;
      const yMin = bottom;
      const yMax = top;
      const ySpan = yMax - yMin;
      const eng = engineRef.current;

      const clampedX = Math.max(left, Math.min(right, x));
      const sample = buildSample(clampedX, getY, left, right);
      const timbre = timbreForCurveIndex(Math.max(0, soloIndex));
      const panBias = panSpreadForCurveIndex(Math.max(0, soloIndex));
      const xPan = xToPan(clampedX, left, right);
      const pan = Math.max(-1, Math.min(1, panBias + xPan * 0.6));

      if (playCues && prevSampleRef.current) {
        const cues = detectSonificationCues(prevSampleRef.current, sample, ySpan);
        const now = performance.now();
        if (now - lastCueAtRef.current > CUE_DEBOUNCE_MS) {
          for (const c of cues) {
            eng.playCue(c);
            lastCueAtRef.current = now;
            break;
          }
        }
      }
      prevSampleRef.current = sample;

      let freq: number;
      let harsh = false;
      if (sonifyMode === "value") {
        freq = sample.valid ? yToFreq(sample.y, yMin, yMax) : 220;
      } else {
        if (!sample.valid) {
          freq = 220;
          lastWasFlatRef.current = false;
        } else {
          freq = slopeToFreq(sample.dy, left, right, yMin, yMax);
          harsh = sample.dy < 0;
          const flat = isNearZeroSlope(sample.dy, left, right);
          if (flat && !lastWasFlatRef.current) {
            const now = performance.now();
            if (now - lastCueAtRef.current > CUE_DEBOUNCE_MS) {
              eng.playCue("flatSlope");
              lastCueAtRef.current = now;
            }
          }
          lastWasFlatRef.current = flat;
        }
      }

      const audible = sample.valid;
      eng.updateTone(freq, pan, {
        waveform: timbre,
        harsh: sonifyMode === "slope" && harsh,
        audible,
      });
    },
    [readBbox, getY, sonifyEnabled, sonifyMode, soloIndex]
  );

  useEffect(() => {
    engineRef.current.setVolume(volumePct / 100);
  }, [volumePct]);

  useEffect(() => {
    lastWasFlatRef.current = false;
  }, [sonifyMode]);

  useEffect(() => {
    if (!sonifyEnabled || !soloEntry) {
      engineRef.current.stopTone();
      return;
    }
    if (macroPlaying) return;
    applyToneAtX(probeX, true);
  }, [probeX, sonifyEnabled, soloEntry, sonifyMode, applyToneAtX, macroPlaying]);

  const haltMacroOnly = useCallback(() => {
    macroPlayingRef.current = false;
    setMacroPlaying(false);
    if (macroRafRef.current != null) {
      cancelAnimationFrame(macroRafRef.current);
      macroRafRef.current = null;
    }
    engineRef.current.stopTone();
  }, []);

  const stopMacro = useCallback(() => {
    haltMacroOnly();
    announce("Graph playback stopped");
  }, [announce, haltMacroOnly]);

  const startMacro = useCallback(async () => {
    const eng = engineRef.current;
    await eng.ensureRunning();
    const bb = readBbox();
    if (!bb || !soloEntry) {
      announce("Add a visible formula to play graph audio");
      return;
    }
    if (macroRafRef.current != null) {
      cancelAnimationFrame(macroRafRef.current);
      macroRafRef.current = null;
    }
    macroBboxRef.current = bb;
    macroPlayingRef.current = true;
    setMacroPlaying(true);
    macroStartMsRef.current = performance.now();
    prevSampleRef.current = null;
    lastWasFlatRef.current = false;
    announce("Playing graph");

    const step = (t: number) => {
      if (!macroPlayingRef.current) return;
      const bb0 = macroBboxRef.current;
      if (!bb0) {
        haltMacroOnly();
        announce("Graph playback stopped");
        return;
      }
      const [L, , R] = bb0;
      const elapsed = (t - macroStartMsRef.current) / 1000;
      if (elapsed >= MACRO_DEFAULT_S) {
        macroPlayingRef.current = false;
        setMacroPlaying(false);
        macroRafRef.current = null;
        engineRef.current.stopTone();
        announce("Graph playback finished");
        return;
      }
      const u = elapsed / MACRO_DEFAULT_S;
      const x = L + u * (R - L);
      setProbeX(x);
      syncProbePctFromX(x, bb0);
      applyToneAtX(x, true);
      macroRafRef.current = requestAnimationFrame(step);
    };
    macroRafRef.current = requestAnimationFrame(step);
  }, [readBbox, soloEntry, applyToneAtX, syncProbePctFromX, haltMacroOnly, announce]);

  const toggleMacro = useCallback(() => {
    if (macroPlayingRef.current) stopMacro();
    else void startMacro();
  }, [startMacro, stopMacro]);

  useEffect(() => {
    return () => {
      macroPlayingRef.current = false;
      if (macroRafRef.current != null) cancelAnimationFrame(macroRafRef.current);
      engineRef.current.stopTone();
    };
  }, []);

  const initAudio = useCallback(async () => {
    await engineRef.current.ensureRunning();
    engineRef.current.setVolume(volumePct / 100);
    if (soloEntry) {
      applyToneAtX(probeX, false);
    }
    announce("Value sonification on");
  }, [volumePct, soloEntry, applyToneAtX, probeX, announce]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const bb = readBbox();
    if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      void (async () => {
        await engineRef.current.ensureRunning();
        toggleMacro();
      })();
      return;
    }
    if (e.key === "m" || e.key === "M") {
      e.preventDefault();
      setSonifyMode((m) => {
        const next = m === "value" ? "slope" : "value";
        announce(next === "value" ? "Value sonification mode" : "Slope sonification mode");
        return next;
      });
      return;
    }
    if (!macroPlayingRef.current && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      setVolumePct((v) => {
        const next = e.key === "ArrowUp" ? Math.min(100, v + 5) : Math.max(0, v - 5);
        announce(`Volume ${next} percent`);
        return next;
      });
      return;
    }
    if (!macroPlayingRef.current && bb && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      const [L, , R] = bb;
      const step = (R - L) / PROBE_STEPS;
      setProbeX((px) => {
        const nx = e.key === "ArrowLeft" ? px - step : px + step;
        const cx = Math.max(L, Math.min(R, nx));
        syncProbePctFromX(cx, bb);
        return cx;
      });
    }
  };

  const onProbeSlider = (v: number[]) => {
    const pct = v[0] ?? 0;
    setProbePct(pct);
    const bb = readBbox();
    if (!bb) return;
    const [L, , R] = bb;
    const x = L + ((R - L) * pct) / 100;
    setProbeX(x);
  };

  const yLabel = (() => {
    const bb = readBbox();
    if (!bb || !soloEntry) return "no curve";
    const s = buildSample(Math.max(bb[0], Math.min(bb[2], probeX)), getY, bb[0], bb[2]);
    if (!s.valid) return "undefined";
    return s.y.toPrecision(4);
  })();

  return (
    <div
      className="pointer-events-auto fixed bottom-4 left-4 z-30 w-[min(100%,22rem)] rounded-lg border bg-background/95 p-3 text-sm shadow-lg backdrop-blur"
      role="group"
      aria-label="Graph sonification"
      aria-keyshortcuts="Space Play or pause graph sweep M Toggle value or slope mode ArrowLeft ArrowRight Move probe ArrowUp ArrowDown Volume"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <div aria-live="polite" aria-atomic="true" style={liveRegionStyle}>
        {liveText}
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={sonifyEnabled ? "default" : "secondary"}
          aria-pressed={sonifyEnabled}
          aria-label={sonifyEnabled ? "Disable graph sonification" : "Enable graph sonification"}
          onClick={async () => {
            const next = !sonifyEnabled;
            setSonifyEnabled(next);
            if (next) {
              await initAudio();
            } else {
              haltMacroOnly();
              engineRef.current.stopTone();
              announce("Sonification off");
            }
          }}
        >
          Audio {sonifyEnabled ? "on" : "off"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-label={macroPlaying ? "Pause graph sweep" : "Play graph sweep across the visible window"}
          onClick={async () => {
            await engineRef.current.ensureRunning();
            toggleMacro();
          }}
        >
          {macroPlaying ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" />}
          <span className="ml-1">{macroPlaying ? "Pause" : "Play graph"}</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-pressed={sonifyMode === "slope"}
          aria-label={`Sonification mode: ${sonifyMode === "value" ? "value maps to pitch" : "slope maps to pitch"}. Press to toggle.`}
          onClick={() => {
            setSonifyMode((m) => {
              const next = m === "value" ? "slope" : "value";
              announce(next === "value" ? "Value mode" : "Slope mode");
              return next;
            });
          }}
        >
          Mode: {sonifyMode === "value" ? "Value" : "Slope"}
        </Button>
      </div>

      <div className="mb-2 flex items-center gap-2">
        <Volume2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <Slider
          className="flex-1"
          min={0}
          max={100}
          step={1}
          value={[volumePct]}
          onValueChange={(v) => {
            setVolumePct(v[0] ?? 0);
            void engineRef.current.ensureRunning();
          }}
          aria-label="Sonification volume"
          aria-valuetext={`${volumePct} percent`}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="sonify-probe-slider">
          X probe (y ≈ {yLabel})
        </label>
        <Slider
          id="sonify-probe-slider"
          min={0}
          max={100}
          step={0.5}
          value={[probePct]}
          onValueChange={onProbeSlider}
          disabled={macroPlaying}
          aria-label="Move probe along the x axis of the graph"
          aria-valuetext={`X probe, y equals ${yLabel}`}
        />
      </div>
    </div>
  );
}
