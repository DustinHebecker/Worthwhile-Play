/**
 * The Web Audio engine (design § 9.2, § 9.5–9.7): a thin wrapper that applies the numbers of `schedule.ts` to an
 * `AudioContextLike`. The context is created lazily, only inside a user gesture (`ensureContext`, which also calls
 * `resume()` synchronously, as iOS requires), and never while muted. No `AudioWorklet`, no media element, no network.
 *
 * Graph: oscillator (PeriodicWave) → envelope gain → bus gain (one per playback) → low-pass 5 kHz → master gain
 * (≤ 0.5) → compressor (safety limiter only, threshold 0 dB, so no makeup gain) → destination.
 */
import { BUS_FADE, LEAD, LOWPASS_HZ, VOLUME_RAMP, envelope, master, schedule, type NoteEvent, type Voice } from './schedule';
import { waveTables } from './voices';

/* ---------- The subset of Web Audio the engine uses ---------- */

export interface AudioParamLike {
  value: number;
  setValueAtTime(value: number, time: number): unknown;
  linearRampToValueAtTime(value: number, time: number): unknown;
  setTargetAtTime(target: number, time: number, timeConstant: number): unknown;
}
export interface AudioNodeLike {
  connect(destination: AudioNodeLike): unknown;
  disconnect(): void;
}
export interface OscillatorLike extends AudioNodeLike {
  readonly frequency: AudioParamLike;
  setPeriodicWave(wave: unknown): void;
  start(when: number): void;
  stop(when: number): void;
  onended: (() => void) | null;
}
export interface GainLike extends AudioNodeLike {
  readonly gain: AudioParamLike;
}
export interface BiquadLike extends AudioNodeLike {
  type: string;
  readonly frequency: AudioParamLike;
  readonly Q: AudioParamLike;
}
export interface CompressorLike extends AudioNodeLike {
  readonly threshold: AudioParamLike;
  readonly knee: AudioParamLike;
  readonly ratio: AudioParamLike;
  readonly attack: AudioParamLike;
  readonly release: AudioParamLike;
}
export interface AudioContextLike {
  readonly currentTime: number;
  readonly state: string;
  readonly baseLatency?: number;
  readonly outputLatency?: number;
  readonly destination: AudioNodeLike;
  createOscillator(): OscillatorLike;
  createGain(): GainLike;
  createPeriodicWave(real: Float32Array, imag: Float32Array, constraints?: { disableNormalization?: boolean }): unknown;
  createBiquadFilter(): BiquadLike;
  createDynamicsCompressor(): CompressorLike;
  resume(): Promise<void>;
  suspend(): Promise<void>;
  close(): Promise<void>;
  addEventListener(type: 'statechange', listener: () => void): void;
}
export type AudioContextCtor = new (options?: { latencyHint?: string }) => AudioContextLike;

/** The browser's constructor (standard or prefixed), or undefined. Never constructs anything. */
export function audioConstructor(win: unknown): AudioContextCtor | undefined {
  const w = win as { AudioContext?: unknown; webkitAudioContext?: unknown } | undefined;
  const ctor = w?.AudioContext ?? w?.webkitAudioContext;
  return typeof ctor === 'function' ? (ctor as AudioContextCtor) : undefined;
}

/** Design § 9.6: whether Web Audio exists here (a constructor that throws is found out on the first gesture). */
export const audioSupport = (win: unknown): 'available' | 'unavailable' => (audioConstructor(win) ? 'available' : 'unavailable');

export type EngineState = 'idle' | 'playing' | 'blocked' | 'unavailable';

/** The safety limiter's threshold in dBFS (design § 9.4 and its implementation note). */
export const LIMITER_THRESHOLD = 0;

export interface EngineOptions {
  readonly ctor: AudioContextCtor | undefined;
  readonly onState?: (state: EngineState) => void;
  /** Delayed clean-up (disconnecting a faded bus); never used for musical timing. */
  readonly later?: (fn: () => void, ms: number) => void;
  readonly volume?: number;
  readonly muted?: boolean;
}

export interface Engine {
  /** Creates (or re-creates after `close`) and resumes the context; call synchronously inside a gesture handler. */
  ensureContext(): boolean;
  /** Plays a whole playback scheduled up front on the audio clock; false when muted or unavailable. */
  play(events: readonly NoteEvent[]): boolean;
  stopAll(): void;
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  isPlaying(): boolean;
  /** Seconds since the current playback started (for the cosmetic highlight), or undefined. */
  elapsed(): number | undefined;
  suspendForHidden(): void;
  dispose(): void;
}

interface Graph {
  ctx: AudioContextLike;
  input: BiquadLike;
  masterGain: GainLike;
  waves: Record<Voice, unknown>;
}

interface Playback {
  bus: GainLike;
  oscillators: OscillatorLike[];
  pending: number;
  t0: number;
}

export function createEngine(options: EngineOptions): Engine {
  const onState = options.onState ?? (() => undefined);
  const later = options.later ?? ((fn: () => void, ms: number) => void setTimeout(fn, ms));
  let volume = options.volume ?? 50;
  let muted = options.muted ?? false;
  let graph: Graph | null = null;
  let current: Playback | null = null;
  let broken = false;

  const build = (ctx: AudioContextLike): Graph => {
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = LOWPASS_HZ;
    lowpass.Q.value = 0.7;
    const masterGain = ctx.createGain();
    masterGain.gain.value = master(volume);
    const limiter = ctx.createDynamicsCompressor();
    // Threshold 0 dB: no automatic makeup gain (Web Audio applies (1 / full-range gain)^0.6, which at −10 dB raised a
    // single note from −6 to −3.3 dBFS); the node only catches anything that would reach full scale.
    limiter.threshold.value = LIMITER_THRESHOLD;
    limiter.knee.value = 6;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.25;
    lowpass.connect(masterGain);
    masterGain.connect(limiter);
    limiter.connect(ctx.destination);
    const wave = (voice: Voice) => {
      const { real, imag } = waveTables(voice);
      return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
    };
    ctx.addEventListener('statechange', () => {
      if (graph?.ctx !== ctx) return;
      if (ctx.state === 'closed') {
        graph = null;
        current = null;
        onState('idle');
      } else if (ctx.state !== 'running' && current) {
        // Suspended or Safari's "interrupted" (a call, another app): the playback indicator ends.
        stopAll();
      }
    });
    return { ctx, input: lowpass, masterGain, waves: { soft: wave('soft'), tick: wave('tick') } };
  };

  function ensureContext(): boolean {
    if (muted || broken || !options.ctor) return false;
    if (!graph || graph.ctx.state === 'closed') {
      try {
        graph = build(new options.ctor({ latencyHint: 'interactive' }));
      } catch {
        broken = true;
        graph = null;
        onState('unavailable');
        return false;
      }
    }
    const ctx = graph.ctx;
    // Always, synchronously inside the gesture (iOS needs it; harmless when already running). If the browser still
    // refuses, the next gesture asks again.
    ctx.resume().then(
      () => {
        if (ctx.state === 'suspended' && graph?.ctx === ctx) {
          stopAll();
          onState('blocked');
        }
      },
      () => onState('blocked')
    );
    return true;
  }

  function stopAll(): void {
    const p = current;
    current = null;
    if (!p || !graph) return;
    const now = graph.ctx.currentTime;
    try {
      p.bus.gain.setValueAtTime(p.bus.gain.value, now);
      p.bus.gain.linearRampToValueAtTime(0, now + BUS_FADE);
      for (const osc of p.oscillators) osc.stop(now + BUS_FADE + 0.02);
    } catch {
      /* already stopped */
    }
    later(() => p.bus.disconnect(), 100);
    onState('idle');
  }

  function play(events: readonly NoteEvent[]): boolean {
    if (!ensureContext() || !graph) return false;
    stopAll();
    const { ctx } = graph;
    const t0 = ctx.currentTime + LEAD;
    const notes = schedule(events, t0);
    if (!notes.length) return false;
    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0, t0 - LEAD);
    bus.gain.linearRampToValueAtTime(1, t0 - LEAD + BUS_FADE);
    bus.connect(graph.input);
    const playback: Playback = { bus, oscillators: [], pending: notes.length, t0 };
    for (const n of notes) {
      const osc = ctx.createOscillator();
      osc.setPeriodicWave(graph.waves[n.voice]);
      osc.frequency.setValueAtTime(n.freq, n.start);
      const env = ctx.createGain();
      for (const call of envelope(n)) {
        if (call.fn === 'setTargetAtTime') env.gain.setTargetAtTime(call.v, call.t, call.tc);
        else env.gain[call.fn](call.v, call.t);
      }
      osc.connect(env);
      env.connect(bus);
      osc.onended = () => {
        osc.disconnect();
        env.disconnect();
        playback.pending--;
        if (playback.pending === 0 && current === playback) {
          current = null;
          bus.disconnect();
          onState('idle');
        }
      };
      osc.start(n.start);
      osc.stop(n.stop);
      playback.oscillators.push(osc);
    }
    current = playback;
    onState('playing');
    return true;
  }

  function setVolume(v: number): void {
    volume = v;
    if (!graph) return;
    const now = graph.ctx.currentTime;
    const g = graph.masterGain.gain;
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(master(v), now + VOLUME_RAMP);
  }

  return {
    ensureContext,
    play,
    stopAll,
    setVolume,
    setMuted(m) {
      muted = m;
      if (m) stopAll();
    },
    isMuted: () => muted,
    isPlaying: () => current !== null,
    elapsed() {
      if (!graph || !current) return undefined;
      const latency = graph.ctx.outputLatency ?? graph.ctx.baseLatency ?? 0;
      return graph.ctx.currentTime - latency - current.t0;
    },
    suspendForHidden() {
      stopAll();
      if (graph && graph.ctx.state === 'running') void graph.ctx.suspend().catch(() => undefined);
    },
    dispose() {
      stopAll();
      const g = graph;
      graph = null;
      if (g && g.ctx.state !== 'closed') void g.ctx.close().catch(() => undefined);
    }
  };
}
