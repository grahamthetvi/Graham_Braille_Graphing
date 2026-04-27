/**
 * Web Audio sonification for graph exploration: continuous tone path + short cues.
 * Call `ensureRunning()` after a user gesture before starting audio.
 */

const RAMP_S = 0.008;
const VIBRATO_HZ = 6;
const VIBRATO_DEPTH_CENTS = 5; // ~±0.5% pitch variation
const VIBRATO_DELAY_S = 1;
const FREQ_MIN = 30;
const FREQ_MAX = 8000;

export type SonificationCue =
  | "extremum"
  | "zero"
  | "inflection"
  | "asymptote"
  | "flatSlope";

export type ToneTimbre = "sine" | "triangle" | "sawtooth";

export type UpdateToneOptions = {
  waveform?: ToneTimbre;
  /** Stronger timbre for negative slope (saw + waveshaper). */
  harsh?: boolean;
  /** When false, ramp main tone gain toward 0 (invalid / off-graph y). */
  audible?: boolean;
};

/**
 * Manages AudioContext, probe tone (oscillator + panner + master gain), and cue playback.
 */
export class AudioGraphEngine {
  private ctx: AudioContext | null = null;

  private masterGain: GainNode | null = null;
  private panner: StereoPannerNode | null = null;
  private waveShaper: WaveShaperNode | null = null;
  private toneGain: GainNode | null = null;
  private mainOsc: OscillatorNode | null = null;
  private vibratoOsc: OscillatorNode | null = null;
  private vibratoDepth: GainNode | null = null;

  private toneActive = false;
  private vibratoScheduled = false;
  private harshCurves: { soft: Float32Array; hard: Float32Array } | null = null;

  private volumeLinear = 0.7;

  private now(): number {
    return this.ctx?.currentTime ?? 0;
  }

  private getOrCreateContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volumeLinear;
      this.masterGain.connect(this.ctx.destination);

      this.panner = this.ctx.createStereoPanner();
      this.panner.connect(this.masterGain);

      this.waveShaper = this.ctx.createWaveShaper();
      this.waveShaper.oversample = "2x";
      this.waveShaper.connect(this.panner);

      this.toneGain = this.ctx.createGain();
      this.toneGain.gain.value = 0;
      this.toneGain.connect(this.waveShaper);

      this.harshCurves = {
        soft: this.makeDistortionCurve(8),
        hard: this.makeDistortionCurve(24),
      };
      this.waveShaper.curve = this.harshCurves.soft;
    }
    return this.ctx;
  }

  private makeDistortionCurve(amount: number): Float32Array {
    const n = 441;
    const curve = new Float32Array(n);
    const deg = Math.PI / 180;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / (n - 1) - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  /** Resume AudioContext if suspended (required after user gesture in most browsers). */
  async ensureRunning(): Promise<void> {
    const c = this.getOrCreateContext();
    if (c.state === "suspended") {
      await c.resume();
    }
  }

  setVolume(linear: number): void {
    this.volumeLinear = Math.max(0, Math.min(1, linear));
    const c = this.ctx;
    const g = this.masterGain;
    if (!c || !g) return;
    const t = c.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.linearRampToValueAtTime(this.volumeLinear, t + RAMP_S);
  }

  getVolume(): number {
    return this.volumeLinear;
  }

  private scheduleVibrato(): void {
    if (!this.ctx || !this.mainOsc || this.vibratoScheduled) return;
    this.vibratoScheduled = true;
    const c = this.ctx;
    const t0 = c.currentTime;

    this.vibratoOsc = c.createOscillator();
    this.vibratoOsc.type = "sine";
    this.vibratoOsc.frequency.value = VIBRATO_HZ + Math.random() * 2;

    this.vibratoDepth = c.createGain();
    this.vibratoDepth.gain.value = 0;
    this.vibratoOsc.connect(this.vibratoDepth);
    this.vibratoDepth.connect(this.mainOsc.detune);

    this.vibratoOsc.start(t0);
    this.vibratoDepth.gain.setValueAtTime(0, t0 + VIBRATO_DELAY_S);
    this.vibratoDepth.gain.linearRampToValueAtTime(VIBRATO_DEPTH_CENTS, t0 + VIBRATO_DELAY_S + 0.02);
  }

  private teardownOsc(): void {
    const c = this.ctx;
    if (this.vibratoOsc && c) {
      try {
        this.vibratoOsc.stop(c.currentTime + 0.02);
      } catch {
        /* noop */
      }
      this.vibratoOsc.disconnect();
      this.vibratoOsc = null;
    }
    if (this.vibratoDepth) {
      this.vibratoDepth.disconnect();
      this.vibratoDepth = null;
    }
    if (this.mainOsc && c) {
      try {
        this.mainOsc.stop(c.currentTime + 0.02);
      } catch {
        /* noop */
      }
      this.mainOsc.disconnect();
      this.mainOsc = null;
    }
    this.vibratoScheduled = false;
    this.toneActive = false;
  }

  startTone(freq: number, pan: number, opts: UpdateToneOptions = {}): void {
    this.ensureRunning().catch(() => {});
    const c = this.getOrCreateContext();
    const t = c.currentTime;
    const f = Math.max(FREQ_MIN, Math.min(FREQ_MAX, freq));

    if (this.mainOsc) {
      this.updateTone(freq, pan, opts);
      return;
    }

    this.mainOsc = c.createOscillator();
    this.mainOsc.type = opts.waveform ?? "sine";
    this.mainOsc.frequency.setValueAtTime(f, t);
    this.mainOsc.connect(this.toneGain!);

    this.mainOsc.start(t);
    this.toneActive = true;
    this.vibratoScheduled = false;
    this.scheduleVibrato();

    const panner = this.panner!;
    panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), t);

    const ws = this.waveShaper!;
    ws.curve = opts.harsh ? this.harshCurves!.hard : this.harshCurves!.soft;

    const tg = this.toneGain!;
    const target = opts.audible === false ? 0 : 0.22;
    tg.gain.cancelScheduledValues(t);
    tg.gain.setValueAtTime(0, t);
    tg.gain.linearRampToValueAtTime(target, t + RAMP_S);
  }

  updateTone(freq: number, pan: number, opts: UpdateToneOptions = {}): void {
    if (!this.ctx || !this.mainOsc || !this.panner || !this.toneGain || !this.waveShaper) {
      this.startTone(freq, pan, opts);
      return;
    }
    const c = this.ctx;
    const t = c.currentTime;
    const f = Math.max(FREQ_MIN, Math.min(FREQ_MAX, freq));
    const p = Math.max(-1, Math.min(1, pan));

    if (opts.waveform && opts.waveform !== this.mainOsc.type) {
      this.mainOsc.type = opts.waveform;
    }

    this.waveShaper.curve = opts.harsh ? this.harshCurves!.hard : this.harshCurves!.soft;

    this.mainOsc.frequency.cancelScheduledValues(t);
    this.mainOsc.frequency.setValueAtTime(this.mainOsc.frequency.value, t);
    this.mainOsc.frequency.linearRampToValueAtTime(f, t + RAMP_S);

    this.panner.pan.cancelScheduledValues(t);
    this.panner.pan.setValueAtTime(this.panner.pan.value, t);
    this.panner.pan.linearRampToValueAtTime(p, t + RAMP_S);

    const target = opts.audible === false ? 0 : 0.22;
    this.toneGain.gain.cancelScheduledValues(t);
    this.toneGain.gain.setValueAtTime(this.toneGain.gain.value, t);
    this.toneGain.gain.linearRampToValueAtTime(target, t + RAMP_S);
  }

  stopTone(): void {
    const c = this.ctx;
    const tg = this.toneGain;
    if (!c || !tg || !this.mainOsc) {
      this.teardownOsc();
      return;
    }
    const t = c.currentTime;
    tg.gain.cancelScheduledValues(t);
    tg.gain.setValueAtTime(tg.gain.value, t);
    tg.gain.linearRampToValueAtTime(0, t + RAMP_S);
    const osc = this.mainOsc;
    osc.stop(t + RAMP_S + 0.05);
    this.mainOsc = null;
    if (this.vibratoOsc) {
      try {
        this.vibratoOsc.stop(t + RAMP_S + 0.05);
      } catch {
        /* noop */
      }
      this.vibratoOsc.disconnect();
      this.vibratoOsc = null;
    }
    if (this.vibratoDepth) {
      this.vibratoDepth.disconnect();
      this.vibratoDepth = null;
    }
    this.vibratoScheduled = false;
    this.toneActive = false;
  }

  isToneActive(): boolean {
    return this.toneActive;
  }

  /**
   * Short non-speech cues (do not interrupt context; uses one-shot buffer sources).
   */
  playCue(kind: SonificationCue): void {
    const c = this.getOrCreateContext();
    this.ensureRunning().catch(() => {});
    const t = c.currentTime;
    const cueGain = c.createGain();
    cueGain.gain.value = 0.35;
    cueGain.connect(this.masterGain!);

    const sr = c.sampleRate;
    let pending = 0;
    const doneOne = () => {
      pending -= 1;
      if (pending <= 0) {
        try {
          cueGain.disconnect();
        } catch {
          /* noop */
        }
      }
    };

    const playBuf = (start: number, freq: number, dur: number, type: OscillatorType) => {
      pending += 1;
      const buf = this.makeToneBuffer(c, freq, dur, type);
      const src = c.createBufferSource();
      src.buffer = buf;
      src.connect(cueGain);
      src.onended = () => doneOne();
      src.start(start);
      src.stop(start + dur + 0.005);
    };

    if (kind === "extremum") {
      playBuf(t, 800, 0.08, "sine");
    } else if (kind === "zero") {
      playBuf(t, 1000, 0.03, "sine");
    } else if (kind === "flatSlope") {
      playBuf(t, 440, 0.04, "triangle");
    } else if (kind === "inflection") {
      playBuf(t, 500, 0.05, "sine");
      playBuf(t + 0.066, 1200, 0.05, "sine");
    } else if (kind === "asymptote") {
      pending += 1;
      const dur = 0.1;
      const buf = c.createBuffer(1, Math.ceil(sr * dur), sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.9;
      }
      const src = c.createBufferSource();
      src.buffer = buf;
      src.connect(cueGain);
      src.onended = () => doneOne();
      src.start(t);
      src.stop(t + dur + 0.01);
    }

    if (pending === 0) {
      try {
        cueGain.disconnect();
      } catch {
        /* noop */
      }
    }
  }

  private makeToneBuffer(
    c: AudioContext,
    freq: number,
    dur: number,
    type: OscillatorType
  ): AudioBuffer {
    const sr = c.sampleRate;
    const n = Math.max(1, Math.ceil(sr * dur));
    const buf = c.createBuffer(1, n, sr);
    const d = buf.getChannelData(0);
    const twoPiF = 2 * Math.PI * freq;
    for (let i = 0; i < n; i++) {
      const env = n <= 1 ? 1 : Math.sin((Math.PI * i) / (n - 1));
      const ph = (twoPiF * i) / sr;
      const s =
        type === "sine"
          ? Math.sin(ph)
          : type === "triangle"
            ? (2 / Math.PI) * Math.asin(Math.sin(ph))
            : 2 * (ph / (2 * Math.PI) - Math.floor(ph / (2 * Math.PI) + 0.5));
      d[i] = s * env * 0.85;
    }
    return buf;
  }
}
