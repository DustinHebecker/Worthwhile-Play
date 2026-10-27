/**
 * A recording fake of the Web Audio subset the engine uses (design § 20.2): nodes, connections, every AudioParam
 * call with its time, a controllable `state`, resume/suspend/close spies and `statechange` dispatch.
 */
import type { AudioContextLike, AudioNodeLike, AudioParamLike, BiquadLike, CompressorLike, GainLike, OscillatorLike } from '../src/audio/engine';

export interface ParamCallRecord {
  fn: 'setValueAtTime' | 'linearRampToValueAtTime' | 'setTargetAtTime';
  v: number;
  t: number;
  tc?: number;
}

export class FakeParam implements AudioParamLike {
  value: number;
  calls: ParamCallRecord[] = [];
  constructor(value = 0) {
    this.value = value;
  }
  setValueAtTime(v: number, t: number) {
    this.calls.push({ fn: 'setValueAtTime', v, t });
    this.value = v;
  }
  linearRampToValueAtTime(v: number, t: number) {
    this.calls.push({ fn: 'linearRampToValueAtTime', v, t });
    this.value = v;
  }
  setTargetAtTime(v: number, t: number, tc: number) {
    this.calls.push({ fn: 'setTargetAtTime', v, t, tc });
  }
}

export class FakeNode implements AudioNodeLike {
  connections: AudioNodeLike[] = [];
  disconnected = false;
  constructor(readonly kind: string) {}
  connect(d: AudioNodeLike) {
    this.connections.push(d);
    return d;
  }
  disconnect() {
    this.disconnected = true;
  }
}

export class FakeGain extends FakeNode implements GainLike {
  gain = new FakeParam(1);
  constructor() {
    super('gain');
  }
}

export class FakeOscillator extends FakeNode implements OscillatorLike {
  frequency = new FakeParam(440);
  wave: unknown = null;
  started: number | null = null;
  stops: number[] = [];
  onended: (() => void) | null = null;
  constructor() {
    super('oscillator');
  }
  setPeriodicWave(w: unknown) {
    this.wave = w;
  }
  start(t: number) {
    this.started = t;
  }
  stop(t: number) {
    this.stops.push(t);
  }
  end() {
    this.onended?.();
  }
}

export class FakeContext implements AudioContextLike {
  static instances: FakeContext[] = [];
  static initialState = 'suspended';
  static resumeTo = 'running';
  currentTime = 1;
  state: string = FakeContext.initialState;
  destination = new FakeNode('destination');
  nodes: FakeNode[] = [];
  waves: { real: Float32Array; imag: Float32Array; disableNormalization?: boolean }[] = [];
  resumes = 0;
  suspends = 0;
  closes = 0;
  listeners: (() => void)[] = [];
  options: unknown;
  constructor(options?: unknown) {
    this.options = options;
    FakeContext.instances.push(this);
  }
  private add<T extends FakeNode>(n: T): T {
    this.nodes.push(n);
    return n;
  }
  createOscillator() {
    return this.add(new FakeOscillator());
  }
  createGain() {
    return this.add(new FakeGain());
  }
  createPeriodicWave(real: Float32Array, imag: Float32Array, c?: { disableNormalization?: boolean }) {
    const w = { real, imag, ...c };
    this.waves.push(w);
    return w;
  }
  createBiquadFilter(): BiquadLike {
    return Object.assign(this.add(new FakeNode('biquad')), { type: '', frequency: new FakeParam(350), Q: new FakeParam(1) });
  }
  createDynamicsCompressor(): CompressorLike {
    return Object.assign(this.add(new FakeNode('compressor')), {
      threshold: new FakeParam(-24),
      knee: new FakeParam(30),
      ratio: new FakeParam(12),
      attack: new FakeParam(0.003),
      release: new FakeParam(0.25)
    });
  }
  resume() {
    this.resumes++;
    this.state = FakeContext.resumeTo;
    return Promise.resolve();
  }
  suspend() {
    this.suspends++;
    this.setState('suspended');
    return Promise.resolve();
  }
  close() {
    this.closes++;
    this.setState('closed');
    return Promise.resolve();
  }
  addEventListener(_type: 'statechange', l: () => void) {
    this.listeners.push(l);
  }
  setState(s: string) {
    this.state = s;
    for (const l of this.listeners) l();
  }
  oscillators() {
    return this.nodes.filter((n): n is FakeOscillator => n instanceof FakeOscillator);
  }
  gains() {
    return this.nodes.filter((n): n is FakeGain => n instanceof FakeGain);
  }
  static reset() {
    FakeContext.instances = [];
    FakeContext.initialState = 'suspended';
    FakeContext.resumeTo = 'running';
  }
}
