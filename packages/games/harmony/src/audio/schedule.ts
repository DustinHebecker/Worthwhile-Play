/**
 * Pure audio scheduling (design § 9.3, § 9.4): what to play for an item, as note events, and the envelope numbers
 * that keep the level bounded. Nothing here touches Web Audio; `engine.ts` applies these numbers to an
 * `AudioContextLike`.
 *
 * Safety bounds (binding, property-tested in test/schedule.test.ts):
 * - `master(volume) = 0.5 · (volume/100)²`, clamped to [0, 0.5] (≤ −6 dBFS); default volume 50 → 0.125 (≈ −18 dBFS).
 * - Each note peaks at `1/M`, M = the most notes sounding at once **including release tails**, so the sum of all
 *   voices stays ≤ 1 before the master gain. The timbre's waveform is normalised to a peak of 1.
 * - Attack 20 ms (≥ 15 ms); every envelope starts and ends at 0.
 * - Fundamentals 65–1,400 Hz; anything outside is dropped. Longest playback ≤ 8 s. ≤ 40 notes per playback.
 */
import { midiToFreq } from '../theory';

export const ATTACK = 0.02;
export const DECAY_TC = 0.4;
export const TICK_DECAY_TC = 0.04;
export const SUSTAIN = 0.35;
export const RELEASE_TC = 0.05;
/** Oscillators stop this long after the note's end (the release is below −60 dB by then). */
export const TAIL = 0.35;
/** Scheduling lead on the audio clock. */
export const LEAD = 0.06;
/** Bus fade-in at every playback start and fade-out on stop. */
export const BUS_FADE = 0.03;
export const VOLUME_RAMP = 0.05;
export const MASTER_MAX = 0.5;
export const DEFAULT_VOLUME = 50;
export const FREQ_MIN = 65;
export const FREQ_MAX = 1400;
export const MAX_LENGTH = 8;
export const MAX_NOTES = 40;
export const LOWPASS_HZ = 5000;

export type Voice = 'soft' | 'tick';

/** A note relative to the playback start (seconds). `level` ≤ 1 scales it down (count-in ticks: 0.5). */
export interface NoteEvent {
  readonly freq: number;
  readonly start: number;
  readonly dur: number;
  readonly level?: number | undefined;
  readonly voice?: Voice | undefined;
}

export interface ScheduledNote {
  readonly freq: number;
  readonly voice: Voice;
  readonly start: number;
  readonly end: number;
  readonly stop: number;
  readonly peak: number;
}

/** One automation call on a note's gain. */
export type ParamCall =
  | { readonly fn: 'setValueAtTime'; readonly v: number; readonly t: number }
  | { readonly fn: 'linearRampToValueAtTime'; readonly v: number; readonly t: number }
  | { readonly fn: 'setTargetAtTime'; readonly v: number; readonly t: number; readonly tc: number };

/** Volume 0…100 (junk → default) as the master gain: quadratic, ≤ 0.5. */
export function master(volume: unknown): number {
  const v = typeof volume === 'number' && Number.isFinite(volume) ? Math.min(100, Math.max(0, volume)) : DEFAULT_VOLUME;
  return Math.min(MASTER_MAX, MASTER_MAX * (v / 100) ** 2);
}

/** A volume preference read from storage: an integer 0…100 in steps of 5, else the default. */
export const readVolume = (v: unknown): number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 100 && v % 5 === 0 ? v : DEFAULT_VOLUME;

/** The most notes sounding at the same instant, counting each note until its oscillator stops (end + TAIL). */
export function maxOverlap(events: readonly Pick<NoteEvent, 'start' | 'dur'>[]): number {
  const edges: [number, number][] = [];
  for (const e of events) edges.push([e.start, 1], [e.start + e.dur + TAIL, -1]);
  // Ends before starts at the same instant would undercount; count starts first (conservative).
  edges.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  let now = 0;
  let max = 0;
  for (const [, d] of edges) {
    now += d;
    max = Math.max(max, now);
  }
  return max;
}

const inRange = (e: NoteEvent) => Number.isFinite(e.freq) && e.freq >= FREQ_MIN && e.freq <= FREQ_MAX && Number.isFinite(e.start) && e.start >= 0 && Number.isFinite(e.dur) && e.dur > 0;

/** Absolute times and the bounded peak per note; events outside the range are dropped, at most 40 notes are kept. */
export function schedule(events: readonly NoteEvent[], t0: number): ScheduledNote[] {
  const kept = events.filter(inRange).slice(0, MAX_NOTES);
  const peak = 1 / Math.max(1, maxOverlap(kept));
  return kept
    .map((e) => {
      const dur = Math.max(e.dur, ATTACK + 0.01);
      const level = Math.min(1, Math.max(0, e.level ?? 1));
      return { freq: e.freq, voice: e.voice ?? 'soft', start: t0 + e.start, end: t0 + e.start + dur, stop: t0 + e.start + dur + TAIL, peak: peak * level };
    })
    .sort((a, b) => a.start - b.start);
}

/** The gain automation of one note: from 0, a 20 ms ramp to the peak, a piano-like decay, a release to 0. */
export function envelope(n: ScheduledNote): ParamCall[] {
  const tc = n.voice === 'tick' ? TICK_DECAY_TC : DECAY_TC;
  return [
    { fn: 'setValueAtTime', v: 0, t: n.start },
    { fn: 'linearRampToValueAtTime', v: n.peak, t: n.start + ATTACK },
    { fn: 'setTargetAtTime', v: SUSTAIN * n.peak, t: n.start + ATTACK, tc },
    { fn: 'setTargetAtTime', v: 0, t: n.end, tc: RELEASE_TC }
  ];
}

/** The envelope's value at time t (Web Audio semantics of the calls above; 0 after the oscillator stops). */
export function gainAt(n: ScheduledNote, t: number): number {
  if (t < n.start || t >= n.stop) return 0;
  const a = n.start + ATTACK;
  if (t < a) return (n.peak * (t - n.start)) / ATTACK;
  const tc = n.voice === 'tick' ? TICK_DECAY_TC : DECAY_TC;
  const s = SUSTAIN * n.peak;
  const decay = (x: number) => s + (n.peak - s) * Math.exp(-(x - a) / tc);
  if (t < n.end) return decay(t);
  return decay(n.end) * Math.exp(-(t - n.end) / RELEASE_TC);
}

/** Length of a playback: the end of its last note (tails excluded). */
export const lengthOf = (events: readonly NoteEvent[]): number => events.reduce((m, e) => Math.max(m, e.start + e.dur), 0);

/* ---------- What to play (design § 7) ---------- */

const f = midiToFreq;

/** Notes one after another, `step` seconds apart, each `dur` long (the last one `last` long). */
export function sequence(midis: readonly number[], step: number, dur: number, at = 0, last = dur): NoteEvent[] {
  return midis.map((m, i) => ({ freq: f(m), start: at + i * step, dur: i === midis.length - 1 ? last : dur }));
}

/** Notes together. */
export const block = (midis: readonly number[], dur: number, at = 0): NoteEvent[] => midis.map((m) => ({ freq: f(m), start: at, dur }));

/** Two notes of an interval: one after the other, or together. */
export const intervalEvents = (first: number, second: number, together: boolean): NoteEvent[] =>
  together ? block([first, second], 1.2) : sequence([first, second], 0.9, 0.85);

/** "Together, then apart" (one press). */
export const togetherThenApart = (low: number, high: number): NoteEvent[] => [...block([low, high], 1.1), ...sequence([low, high], 0.9, 0.85, 1.5)];

/** A chord: block, broken (one note after another), block again. */
export function chordEvents(midis: readonly number[]): NoteEvent[] {
  const broken = 1.4;
  const again = broken + midis.length * 0.35 + 0.25;
  return [...block(midis, 1.2), ...sequence(midis, 0.35, 0.33, broken), ...block(midis, 1.2, again)];
}

/** A scale, ascending, 0.35 s per note. */
export const scaleEvents = (midis: readonly number[]): NoteEvent[] => sequence(midis, 0.35, 0.33, 0, 0.7);

/** Two dyads: "first", a pause, "second". */
export const pairEvents = (a: readonly number[], b: readonly number[]): NoteEvent[] => [...block(a, 1.5), ...block(b, 1.5, 2)];

/** Four block chords, 1.1 s each. */
export const cadenceEvents = (chords: readonly (readonly number[])[]): NoteEvent[] => chords.flatMap((c, i) => block(c, i === chords.length - 1 ? 1.5 : 1.05, i * 1.1));

/** A melody, 0.5 s per note. */
export const melodyEvents = (midis: readonly number[], at = 0): NoteEvent[] => sequence(midis, 0.5, 0.45, at, 0.8);

/** Melody A, a 1 s pause, melody B. */
export const changedEvents = (a: readonly number[], b: readonly number[]): NoteEvent[] => [...melodyEvents(a), ...melodyEvents(b, a.length * 0.5 + 1)];

export const RHYTHM_BPM = 80;
export const RHYTHM_SLOW_BPM = 60;
/** Rhythm notes sound on G4; count-in ticks an octave higher, at half level. */
export const RHYTHM_MIDI = 67;
export const TICK_MIDI = 79;

/** Eighth length in seconds at a tempo. */
export const eighth = (bpm: number) => 60 / bpm / 2;

/** One bar of a rhythm pattern, optionally after a count-in of four soft ticks; notes sustain 85 % of their value. */
export function rhythmEvents(pattern: readonly number[], countIn: boolean, slow: boolean): NoteEvent[] {
  const e = eighth(slow ? RHYTHM_SLOW_BPM : RHYTHM_BPM);
  const offset = countIn ? 8 * e : 0;
  const ticks: NoteEvent[] = countIn ? [0, 1, 2, 3].map((b) => ({ freq: f(TICK_MIDI), start: b * 2 * e, dur: 0.08, level: 0.5, voice: 'tick' as const })) : [];
  const notes: NoteEvent[] = [];
  let slot = 0;
  for (const d of pattern) {
    if (d > 0) notes.push({ freq: f(RHYTHM_MIDI), start: offset + slot * e, dur: 0.85 * d * e });
    slot += Math.abs(d);
  }
  return [...ticks, ...notes];
}

/** "Slower": everything stretched by up to 2×, never beyond the 8 s bound. */
export function slower(events: readonly NoteEvent[]): NoteEvent[] {
  const len = lengthOf(events);
  const k = len > 0 ? Math.min(2, (MAX_LENGTH - 0.1) / len) : 1;
  return events.map((e) => ({ ...e, start: e.start * k, dur: e.dur * k }));
}

/** One key press (0.8 s). */
export const keyEvents = (freq: number): NoteEvent[] => [{ freq, start: 0, dur: 0.8 }];

/** Held notes of the free keyboard, as frequencies, together for 1.5 s. */
export const heldEvents = (freqs: readonly number[]): NoteEvent[] => freqs.map((freq) => ({ freq, start: 0, dur: 1.5 }));

/** The soft preview tone after the volume slider is released (A4). */
export const previewEvents = (): NoteEvent[] => [{ freq: 440, start: 0, dur: 0.4 }];
