import fc from 'fast-check';
import { beforeEach, describe, expect, it } from 'vitest';
import { audioConstructor, audioSupport, createEngine, type AudioContextCtor, type EngineState } from '../src/audio/engine';
import { BUS_FADE, LEAD, MASTER_MAX, TAIL, master, type NoteEvent } from '../src/audio/schedule';
import { FakeContext, FakeGain, FakeOscillator } from './fake-audio';

const ctor = FakeContext as unknown as AudioContextCtor;
const chord: NoteEvent[] = [60, 64, 67].map((m, i) => ({ freq: 261.6 * 2 ** ((m - 60) / 12), start: 0, dur: 1 + i * 0 }));
const flush = () => new Promise((r) => setTimeout(r, 0));

function setup(extra: { muted?: boolean; volume?: number } = {}) {
  const states: EngineState[] = [];
  const later: (() => void)[] = [];
  const engine = createEngine({ ctor, onState: (s) => states.push(s), later: (fn) => later.push(fn), ...extra });
  return { engine, states, later };
}

beforeEach(() => FakeContext.reset());

describe('context lifecycle (design § 9.5)', () => {
  it('constructs nothing before ensureContext, and nothing when muted', () => {
    const { engine } = setup({ muted: true });
    expect(FakeContext.instances).toHaveLength(0);
    expect(engine.play(chord)).toBe(false);
    expect(engine.ensureContext()).toBe(false);
    expect(FakeContext.instances).toHaveLength(0);
    engine.setMuted(false);
    expect(engine.play(chord)).toBe(true);
    expect(FakeContext.instances).toHaveLength(1);
  });

  it('resumes synchronously inside ensureContext with an interactive latency hint', () => {
    const { engine } = setup();
    expect(engine.ensureContext()).toBe(true);
    const ctx = FakeContext.instances[0]!;
    expect(ctx.resumes).toBe(1);
    expect(ctx.options).toEqual({ latencyHint: 'interactive' });
    engine.ensureContext();
    expect(FakeContext.instances).toHaveLength(1);
  });

  it('reports "blocked" when the browser leaves the context suspended', async () => {
    FakeContext.resumeTo = 'suspended';
    const { engine, states } = setup();
    engine.play(chord);
    await flush();
    expect(states).toContain('blocked');
    expect(engine.isPlaying()).toBe(false);
  });

  it('reports "unavailable" when the constructor throws', () => {
    const states: EngineState[] = [];
    const throwing = function () {
      throw new Error('no audio');
    } as unknown as AudioContextCtor;
    const engine = createEngine({ ctor: throwing, onState: (s) => states.push(s) });
    expect(engine.play(chord)).toBe(false);
    expect(states).toEqual(['unavailable']);
    expect(createEngine({ ctor: undefined }).play(chord)).toBe(false);
  });

  it('ends the playing state on "interrupted" or "suspended"; a closed context is rebuilt on the next gesture', () => {
    const { engine, states } = setup();
    engine.play(chord);
    const ctx = FakeContext.instances[0]!;
    expect(engine.isPlaying()).toBe(true);
    ctx.setState('interrupted');
    expect(engine.isPlaying()).toBe(false);
    expect(states.at(-1)).toBe('idle');
    ctx.setState('closed');
    engine.play(chord);
    expect(FakeContext.instances).toHaveLength(2);
  });

  it('suspends when hidden and closes on dispose', () => {
    const { engine } = setup();
    engine.play(chord);
    const ctx = FakeContext.instances[0]!;
    engine.suspendForHidden();
    expect(ctx.suspends).toBe(1);
    expect(engine.isPlaying()).toBe(false);
    engine.dispose();
    expect(ctx.closes).toBe(1);
  });

  it('finds the constructor without constructing', () => {
    expect(audioSupport({})).toBe('unavailable');
    expect(audioSupport(undefined)).toBe('unavailable');
    expect(audioSupport({ AudioContext: FakeContext })).toBe('available');
    expect(audioConstructor({ webkitAudioContext: FakeContext })).toBe(FakeContext);
    expect(FakeContext.instances).toHaveLength(0);
  });
});

describe('graph and levels (design § 9.2, § 9.4)', () => {
  it('connects source → envelope → bus → low-pass → master → limiter → destination', () => {
    const { engine } = setup();
    engine.play(chord);
    const ctx = FakeContext.instances[0]!;
    const lowpass = ctx.nodes.find((n) => n.kind === 'biquad')! as unknown as { type: string; frequency: { value: number }; connections: unknown[] };
    const comp = ctx.nodes.find((n) => n.kind === 'compressor')! as unknown as { threshold: { value: number }; ratio: { value: number }; connections: unknown[] };
    const masterGain = lowpass.connections[0] as FakeGain;
    expect(lowpass.type).toBe('lowpass');
    expect(lowpass.frequency.value).toBe(5000);
    expect(masterGain.connections[0]).toBe(comp);
    expect(comp.connections[0]).toBe(ctx.destination);
    expect(comp.threshold.value).toBe(-10);
    expect(comp.ratio.value).toBe(12);
    const oscs = ctx.oscillators();
    expect(oscs).toHaveLength(3);
    const env = oscs[0]!.connections[0] as FakeGain;
    const bus = env.connections[0] as FakeGain;
    expect(bus.connections[0]).toBe(lowpass);
    expect(ctx.waves[0]!.disableNormalization).toBe(false);
    expect(masterGain.gain.value).toBe(master(50));
  });

  it('every note starts at 0 at its start time, targets 0 at its end and stops after the tail', () => {
    const { engine } = setup();
    engine.play(chord);
    const ctx = FakeContext.instances[0]!;
    for (const osc of ctx.oscillators()) {
      const env = osc.connections[0] as FakeGain;
      const [first, , , last] = env.gain.calls;
      expect(first).toEqual({ fn: 'setValueAtTime', v: 0, t: osc.started });
      expect(last).toMatchObject({ fn: 'setTargetAtTime', v: 0, t: osc.started! + 1 });
      expect(osc.stops).toEqual([osc.started! + 1 + TAIL]);
      expect(osc.started).toBeCloseTo(ctx.currentTime + LEAD, 10);
      expect(Math.max(...env.gain.calls.map((c) => c.v))).toBeLessThanOrEqual(1 / 3 + 1e-12);
    }
  });

  it('master gain values stay ≤ 0.5 for any volume, and changes ramp over 50 ms', () => {
    const { engine } = setup();
    engine.play(chord);
    const ctx = FakeContext.instances[0]!;
    const masterGain = ctx.gains().find((g) => g.connections[0] && (g.connections[0] as unknown as { kind: string }).kind === 'compressor')!;
    fc.assert(
      fc.property(fc.oneof(fc.double(), fc.integer()), (v) => {
        engine.setVolume(v);
        const last = masterGain.gain.calls.at(-1)!;
        expect(last.fn).toBe('linearRampToValueAtTime');
        expect(last.v).toBeLessThanOrEqual(MASTER_MAX);
        expect(last.t - ctx.currentTime).toBeCloseTo(0.05, 10);
      })
    );
  });

  it('stopAll fades the bus over 30 ms, disconnects it later, and the next play uses a new bus', () => {
    const { engine, later } = setup();
    engine.play(chord);
    const ctx = FakeContext.instances[0]!;
    const bus = (ctx.oscillators()[0]!.connections[0] as FakeGain).connections[0] as FakeGain;
    engine.stopAll();
    expect(bus.gain.calls.at(-1)).toEqual({ fn: 'linearRampToValueAtTime', v: 0, t: ctx.currentTime + BUS_FADE });
    expect(bus.disconnected).toBe(false);
    later.forEach((fn) => fn());
    expect(bus.disconnected).toBe(true);
    engine.play(chord);
    const bus2 = (ctx.oscillators()[3]!.connections[0] as FakeGain).connections[0] as FakeGain;
    expect(bus2).not.toBe(bus);
    expect(bus2.gain.calls[0]).toMatchObject({ fn: 'setValueAtTime', v: 0 });
    expect(bus2.gain.calls[1]).toMatchObject({ fn: 'linearRampToValueAtTime', v: 1 });
    expect(bus2.gain.calls[1]!.t - bus2.gain.calls[0]!.t).toBeCloseTo(BUS_FADE, 10);
  });

  it('returns to idle when every note has ended, and disconnects them', () => {
    const { engine, states } = setup();
    engine.play(chord);
    const ctx = FakeContext.instances[0]!;
    for (const o of ctx.oscillators()) (o as FakeOscillator).end();
    expect(engine.isPlaying()).toBe(false);
    expect(states.at(-1)).toBe('idle');
    expect(ctx.oscillators().every((o) => o.disconnected)).toBe(true);
  });

  it('muting stops the sound', () => {
    const { engine } = setup();
    engine.play(chord);
    engine.setMuted(true);
    expect(engine.isPlaying()).toBe(false);
    expect(engine.isMuted()).toBe(true);
  });
});
