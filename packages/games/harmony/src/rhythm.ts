/**
 * Rhythm model (design § 7.5): one bar of 4/4 on an eighth-note grid (8 slots). A pattern is a list of durations in
 * eighths, positive for notes and negative for rests, summing to 8, composed from beat cells. Pure.
 */
import type { Level } from './levels';

export const SLOTS = 8;

/** One-beat cells (2 eighths) and two-beat cells (4 eighths) per level. Two-beat cells start on beat 1 or 3. */
export const CELLS: Readonly<Record<Level, { one: readonly (readonly number[])[]; two: readonly (readonly number[])[] }>> = {
  easy: { one: [[2], [1, 1]], two: [[4]] },
  medium: { one: [[2], [1, 1]], two: [[4], [3, 1], [1, 2, 1]] },
  hard: { one: [[2], [1, 1], [-1, 1], [-2]], two: [[4], [3, 1], [1, 2, 1], [-2, 2], [2, -2]] }
};

/** Number of options and the minimum slot distance between any two of them. */
export const RHYTHM_OPTIONS: Readonly<Record<Level, { count: number; distance: number }>> = {
  easy: { count: 3, distance: 2 },
  medium: { count: 4, distance: 2 },
  hard: { count: 4, distance: 1 }
};

export type Slot = 'onset' | 'held' | 'silent';

/** The slot vector of a pattern: each eighth is an onset, a held continuation or silent. */
export function slots(pattern: readonly number[]): Slot[] {
  const out: Slot[] = [];
  for (const d of pattern) {
    if (d > 0) {
      out.push('onset');
      for (let i = 1; i < d; i++) out.push('held');
    } else for (let i = 0; i < -d; i++) out.push('silent');
  }
  return out;
}

/** Number of differing slots. */
export const distance = (a: readonly number[], b: readonly number[]): number => {
  const sa = slots(a);
  const sb = slots(b);
  let n = 0;
  for (let i = 0; i < SLOTS; i++) if (sa[i] !== sb[i]) n++;
  return n;
};

export const onsets = (pattern: readonly number[]): number => pattern.filter((d) => d > 0).length;

const key = (p: readonly number[]) => p.join(',');

/**
 * Every pattern of a level (distinct durations), in a fixed order: each half bar is one two-beat cell or two one-beat
 * cells. Patterns need at least two notes; on easy and medium they start with a note on beat 1.
 */
export function allPatterns(level: Level): readonly (readonly number[])[] {
  return (PATTERNS[level] ??= buildPatterns(level));
}

const PATTERNS: Partial<Record<Level, readonly (readonly number[])[]>> = {};

function buildPatterns(level: Level): number[][] {
  const { one, two } = CELLS[level];
  const halves: number[][] = [...two.map((c) => [...c]), ...one.flatMap((a) => one.map((b) => [...a, ...b]))];
  const seen = new Set<string>();
  const out: number[][] = [];
  for (const h1 of halves) {
    for (const h2 of halves) {
      const p = [...h1, ...h2];
      if (onsets(p) < 2) continue;
      if (level !== 'hard' && p[0]! < 0) continue;
      const k = key(p);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(p);
    }
  }
  return out;
}

const PATTERN_KEYS: Readonly<Record<Level, ReadonlySet<string>>> = {
  easy: new Set(allPatterns('easy').map(key)),
  medium: new Set(allPatterns('medium').map(key)),
  hard: new Set(allPatterns('hard').map(key))
};

/** Whether a value is a pattern of the level (made from its cells). Never throws. */
export const isPattern = (value: unknown, level: Level): value is number[] =>
  Array.isArray(value) && value.length <= SLOTS && value.every((d) => Number.isInteger(d)) && PATTERN_KEYS[level].has(key(value as number[]));

/** Notation symbols for durations (design § 14.3). */
export type RhythmGlyph = 'eighth' | 'quarter' | 'dotted-quarter' | 'half' | 'rest-eighth' | 'rest-quarter' | 'rest-half';

export interface NotationEvent {
  readonly slot: number;
  readonly glyph: RhythmGlyph;
  /** Index of the beam group (two eighth notes within one beat), or −1 for a lone eighth (flag) and other glyphs. */
  readonly beam: number;
}

const GLYPH: Readonly<Record<number, RhythmGlyph>> = { 1: 'eighth', 2: 'quarter', 3: 'dotted-quarter', 4: 'half', [-1]: 'rest-eighth', [-2]: 'rest-quarter' };

/**
 * Notation layout: one event per duration (two quarter rests on beats 1–2 or 3–4 become a half rest); two eighth
 * notes on the same beat (slots 2k and 2k+1) share a beam.
 */
export function notation(pattern: readonly number[]): NotationEvent[] {
  const events: { slot: number; glyph: RhythmGlyph; beam: number }[] = [];
  let slot = 0;
  for (const d of pattern) {
    const last = events[events.length - 1];
    // Two quarter rests filling beats 1–2 or 3–4 are written as one half rest (common practice in 4/4).
    if (d === -2 && last?.glyph === 'rest-quarter' && last.slot % 4 === 0 && slot === last.slot + 2) last.glyph = 'rest-half';
    else events.push({ slot, glyph: GLYPH[d] ?? 'quarter', beam: -1 });
    slot += Math.abs(d);
  }
  let group = 0;
  for (let i = 0; i + 1 < events.length; i++) {
    const a = events[i]!;
    const b = events[i + 1]!;
    if (a.glyph === 'eighth' && b.glyph === 'eighth' && a.slot % 2 === 0 && b.slot === a.slot + 1 && a.beam === -1) {
      a.beam = group;
      b.beam = group;
      group++;
    }
  }
  return events;
}
