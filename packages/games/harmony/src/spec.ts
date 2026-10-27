/**
 * Question specs (design § 13): what one item asks, stored in the save once generated. Derived facts (the notes, the
 * answer index, the option count) are computed here; `specProblem` checks an untrusted spec against the level. Pure.
 */
import { isArrayOf, isOneOf, isRecord } from '@wp/game-core';
import { CADENCE_TONIC_HIGH, DYAD_ROOT_HIGH, KEYS_HIGH, KEYS_LOW, TREBLE_HIGH, TREBLE_LOW, BUILD_ROOT_HIGH, type Level } from './levels';
import { isPattern, RHYTHM_OPTIONS, distance } from './rhythm';
import { isRare, isSpelled, midiOf, spellCadence, spellChordVoicing, spellDown, spellScale, spellUp, type Spelled } from './spelling';
import { CADENCES, CHORDS, CHORD_TONES, INTERVALS, SCALES, SCALE_TONES, SEMITONES, classOf, classRank, isAllowedPair, pitchClass, type CadenceId, type ChordId, type IntervalId, type ScaleId } from './theory';

export type Dir = 'up' | 'down' | 'together';
export interface Dyad { readonly root: Spelled; readonly ivl: IntervalId }

export type Spec =
  | { readonly k: 'interval'; readonly root: Spelled; readonly ivl: IntervalId; readonly dir: Dir; readonly options: readonly IntervalId[] }
  | { readonly k: 'chord'; readonly root: Spelled; readonly q: ChordId; readonly inv: 0 | 1 | 2; readonly options: readonly ChordId[] }
  | { readonly k: 'scale'; readonly tonic: Spelled; readonly s: ScaleId; readonly options: readonly ScaleId[] }
  | { readonly k: 'pair'; readonly first: Dyad; readonly second: Dyad }
  | { readonly k: 'cadence'; readonly key: Spelled; readonly c: CadenceId; readonly options: readonly CadenceId[] }
  | { readonly k: 'contour'; readonly notes: readonly Spelled[]; readonly options: readonly string[] }
  | { readonly k: 'changed'; readonly a: readonly Spelled[]; readonly b: readonly Spelled[] }
  | { readonly k: 'rhythm'; readonly options: readonly (readonly number[])[]; readonly answer: number }
  | { readonly k: 'build'; readonly task: 'interval'; readonly root: Spelled; readonly target: IntervalId }
  | { readonly k: 'build'; readonly task: 'chord'; readonly root: Spelled; readonly target: ChordId }
  | { readonly k: 'build'; readonly task: 'scale'; readonly root: Spelled; readonly target: ScaleId };

export type ChoiceSpec = Exclude<Spec, { k: 'build' }>;
export type BuildSpec = Extract<Spec, { k: 'build' }>;

/* ---------- Pools per level (design § 7) ---------- */

export const INTERVAL_POOL: Readonly<Record<Level, readonly IntervalId[]>> = {
  easy: ['M2', 'M3', 'P5', 'P8'],
  medium: ['m2', 'M2', 'm3', 'M3', 'P4', 'P5', 'M6', 'P8'],
  hard: INTERVALS
};
export const CHORD_POOL: Readonly<Record<Level, readonly ChordId[]>> = {
  easy: ['maj', 'min'],
  medium: ['maj', 'min', 'dim', 'aug'],
  hard: CHORDS
};
export const SCALE_POOL: Readonly<Record<Level, readonly ScaleId[]>> = {
  easy: [],
  medium: ['major', 'natural-minor'],
  hard: SCALES
};
export const BUILD_INTERVALS = INTERVAL_POOL.medium;
export const BUILD_CHORDS: readonly ChordId[] = ['maj', 'min', 'dim', 'aug'];
export const BUILD_SEVENTHS: readonly ChordId[] = ['dom7', 'maj7', 'min7'];
export const BUILD_SCALES: readonly ScaleId[] = ['major', 'natural-minor', 'harmonic-minor'];
/** The four contours of three notes (u = up, d = down). */
export const CONTOURS_3 = ['uu', 'dd', 'ud', 'du'] as const;
/** Positions offered by "which note changed?" (indices 1…4 = notes 2…5). */
export const CHANGED_POSITIONS = [1, 2, 3, 4] as const;

/* ---------- Derived facts ---------- */

/** The contour of a note sequence: "u" or "d" per step (repeated notes never occur). */
export const contourOf = (notes: readonly Spelled[]): string =>
  notes.slice(1).map((n, i) => (midiOf(n) > midiOf(notes[i]!) ? 'u' : 'd')).join('');

/** The index of the changed note of A → B (−1 if none or several). */
export function changedIndex(a: readonly Spelled[], b: readonly Spelled[]): number {
  if (a.length !== b.length) return -1;
  const diff = a.map((n, i) => midiOf(n) !== midiOf(b[i]!));
  return diff.filter(Boolean).length === 1 ? diff.indexOf(true) : -1;
}

/** The notes of an interval item in playing order (the given note first). */
export function intervalNotes(root: Spelled, ivl: IntervalId, dir: Dir): Spelled[] | undefined {
  const other = dir === 'down' ? spellDown(root, ivl) : spellUp(root, ivl);
  return other ? [root, other] : undefined;
}

/** Number of options of a choice item. */
export function optionCount(spec: ChoiceSpec): number {
  switch (spec.k) {
    case 'pair':
      return 2;
    case 'changed':
      return CHANGED_POSITIONS.length;
    default:
      return spec.options.length;
  }
}

/** The index of the right option of a choice item (−1 when the spec is inconsistent). */
export function answerIndex(spec: ChoiceSpec): number {
  switch (spec.k) {
    case 'interval':
      return spec.options.indexOf(spec.ivl);
    case 'chord':
      return spec.options.indexOf(spec.q);
    case 'scale':
      return spec.options.indexOf(spec.s);
    case 'cadence':
      return spec.options.indexOf(spec.c);
    case 'contour':
      return spec.options.indexOf(contourOf(spec.notes));
    case 'rhythm':
      return spec.answer;
    case 'pair': {
      const a = classOf(spec.first.ivl);
      const b = classOf(spec.second.ivl);
      if (!a || !b) return -1;
      return classRank(a) < classRank(b) ? 0 : 1;
    }
    case 'changed':
      return CHANGED_POSITIONS.indexOf(changedIndex(spec.a, spec.b) as 1);
  }
}

/** A short key of what the right answer is (fairness: balance and runs, design § 7). */
export function answerKey(spec: Spec): string {
  switch (spec.k) {
    case 'interval':
      return spec.ivl;
    case 'chord':
      return spec.q;
    case 'scale':
      return spec.s;
    case 'cadence':
      return spec.c;
    case 'contour':
      return contourOf(spec.notes);
    case 'rhythm':
      return (spec.options[spec.answer] ?? []).join(',');
    case 'pair':
      return `pair${answerIndex(spec)}`;
    case 'changed':
      return `pos${changedIndex(spec.a, spec.b)}`;
    case 'build':
      return `${spec.task}:${spec.target}`;
  }
}

/** The root (or key, tonic, first note) of an item, for root variation; undefined for rhythm. */
export function rootOf(spec: Spec): Spelled | undefined {
  switch (spec.k) {
    case 'interval':
    case 'chord':
    case 'build':
      return spec.root;
    case 'scale':
      return spec.tonic;
    case 'cadence':
      return spec.key;
    case 'pair':
      return spec.first.root;
    case 'contour':
      return spec.notes[0];
    case 'changed':
      return spec.a[0];
    case 'rhythm':
      return undefined;
  }
}

/** MIDI notes the build task's answer must contain (as pitch classes for chords and scales). */
export function buildTargetPcs(spec: BuildSpec): number[] {
  const root = midiOf(spec.root);
  if (spec.task === 'interval') return [pitchClass(root + SEMITONES[spec.target])];
  const tones = spec.task === 'chord' ? CHORD_TONES[spec.target] : SCALE_TONES[spec.target];
  return [...new Set(tones.map((v) => pitchClass(root + v)))].sort((x, y) => x - y);
}

/** The correctly spelled answer of a build task (root included, low to high). */
export function buildAnswerNotes(spec: BuildSpec): Spelled[] | undefined {
  if (spec.task === 'interval') {
    const up = spellUp(spec.root, spec.target);
    return up ? [spec.root, up] : undefined;
  }
  if (spec.task === 'chord') return spellChordVoicing(spec.root, spec.target, 0);
  return spellScale(spec.root, spec.target)?.slice(0, -1);
}

/* ---------- Validation of untrusted specs ---------- */

const inRange = (notes: readonly Spelled[], low: number, high: number) => notes.every((n) => midiOf(n) >= low && midiOf(n) <= high);
const distinct = <T>(xs: readonly T[], key: (x: T) => string = String) => new Set(xs.map(key)).size === xs.length;
const spellingOk = (notes: readonly Spelled[], level: Level) => level === 'hard' || notes.every((n) => !isRare(n));
const sameList = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

/** Options of a level in the canonical order (the stored list must equal it). */
const isPoolList = <T extends string>(options: unknown, pool: readonly T[]): options is T[] =>
  Array.isArray(options) && sameList(options as string[], pool);

/** Steps between scale-degree notes of a melody in semitones. */
const melodyStepsOk = (notes: readonly Spelled[]) => notes.every((n, i) => i === 0 || midiOf(n) !== midiOf(notes[i - 1]!));

/**
 * Why an untrusted value is not a valid spec of `kind` at `level` (undefined when valid). Never throws. Checks shape,
 * ids, pools, spelling, registers, distinct options and that the answer is among them.
 */
export function specProblem(value: unknown, level: Level): string | undefined {
  try {
    return specProblemUnsafe(value, level);
  } catch {
    return 'throws';
  }
}

function specProblemUnsafe(value: unknown, level: Level): string | undefined {
  if (!isRecord(value)) return 'not a record';
  const v = value as Record<string, unknown>;
  switch (v.k) {
    case 'interval': {
      if (!isSpelled(v.root) || !isOneOf(v.ivl, INTERVAL_POOL[level]) || !isOneOf(v.dir, ['up', 'down', 'together'] as const)) return 'interval fields';
      if (!isPoolList(v.options, INTERVAL_POOL[level])) return 'interval options';
      if (level === 'easy' && v.dir !== 'up') return 'interval dir';
      if (level === 'medium' && v.dir === 'down') return 'interval dir';
      const notes = intervalNotes(v.root, v.ivl, v.dir);
      if (!notes || !inRange(notes, TREBLE_LOW, TREBLE_HIGH) || !spellingOk(notes, level)) return 'interval notes';
      return undefined;
    }
    case 'chord': {
      if (!isSpelled(v.root) || !isOneOf(v.q, CHORD_POOL[level]) || !isOneOf(v.inv, [0, 1, 2] as const)) return 'chord fields';
      if (!isPoolList(v.options, CHORD_POOL[level])) return 'chord options';
      if (v.inv !== 0 && (level !== 'hard' || CHORD_TONES[v.q].length !== 3)) return 'chord inversion';
      const notes = spellChordVoicing(v.root, v.q, v.inv);
      if (!notes || !inRange(notes, TREBLE_LOW, TREBLE_HIGH) || !spellingOk(notes, level)) return 'chord notes';
      return undefined;
    }
    case 'scale': {
      if (!isSpelled(v.tonic) || !isOneOf(v.s, SCALE_POOL[level])) return 'scale fields';
      if (!isPoolList(v.options, SCALE_POOL[level])) return 'scale options';
      const notes = spellScale(v.tonic, v.s);
      if (!notes || !inRange(notes, TREBLE_LOW, TREBLE_HIGH) || !spellingOk(notes, level)) return 'scale notes';
      return undefined;
    }
    case 'pair': {
      const dyad = (d: unknown): d is Dyad => isRecord(d) && Object.keys(d).length === 2 && isSpelled(d.root) && isOneOf(d.ivl, INTERVALS);
      if (!dyad(v.first) || !dyad(v.second)) return 'pair fields';
      if (!isAllowedPair(v.first.ivl, v.second.ivl, level)) return 'pair combination';
      for (const d of [v.first, v.second]) {
        const up = spellUp(d.root, d.ivl);
        if (!up || midiOf(d.root) < TREBLE_LOW || midiOf(d.root) > DYAD_ROOT_HIGH || !spellingOk([d.root, up], level)) return 'pair notes';
      }
      return undefined;
    }
    case 'cadence': {
      if (level !== 'hard' || !isSpelled(v.key) || !isOneOf(v.c, CADENCES)) return 'cadence fields';
      if (!isPoolList(v.options, CADENCES)) return 'cadence options';
      if (midiOf(v.key) < TREBLE_LOW || midiOf(v.key) > CADENCE_TONIC_HIGH || !spellCadence(v.key, v.c)) return 'cadence key';
      return undefined;
    }
    case 'contour': {
      const len = level === 'easy' ? 3 : 5;
      if (level === 'hard' || !isArrayOf(v.notes, isSpelled, len)) return 'contour notes';
      const notes = v.notes;
      if (!inRange(notes, TREBLE_LOW, TREBLE_HIGH) || !melodyStepsOk(notes) || !spellingOk(notes, level)) return 'contour register';
      const options = v.options;
      if (!isArrayOf(options, (o): o is string => typeof o === 'string' && /^[ud]+$/.test(o) && o.length === len - 1, 4) || !distinct(options)) return 'contour options';
      if (level === 'easy' && !sameList(options, CONTOURS_3)) return 'contour options';
      if (!options.includes(contourOf(notes))) return 'contour answer';
      return undefined;
    }
    case 'changed': {
      if (level !== 'hard' || !isArrayOf(v.a, isSpelled, 5) || !isArrayOf(v.b, isSpelled, 5)) return 'changed notes';
      const { a, b } = v;
      if (!inRange([...a, ...b], TREBLE_LOW, TREBLE_HIGH) || !melodyStepsOk(a) || !melodyStepsOk(b)) return 'changed register';
      const i = changedIndex(a, b);
      if (i < 1) return 'changed position';
      const moved = Math.abs(midiOf(b[i]!) - midiOf(a[i]!));
      if (moved < 1 || moved > 3) return 'changed size';
      if (!a.every((n, k) => k === i || (n.l === b[k]!.l && n.a === b[k]!.a && n.o === b[k]!.o))) return 'changed spelling';
      return undefined;
    }
    case 'rhythm': {
      const { count, distance: min } = RHYTHM_OPTIONS[level];
      if (!Array.isArray(v.options) || v.options.length !== count || !v.options.every((p) => isPattern(p, level))) return 'rhythm options';
      const options = v.options as number[][];
      for (let x = 0; x < count; x++) for (let y = x + 1; y < count; y++) if (distance(options[x]!, options[y]!) < min) return 'rhythm distance';
      if (!Number.isInteger(v.answer) || (v.answer as number) < 0 || (v.answer as number) >= count) return 'rhythm answer';
      return undefined;
    }
    case 'build': {
      if (!isSpelled(v.root) || midiOf(v.root) < KEYS_LOW || midiOf(v.root) > BUILD_ROOT_HIGH) return 'build root';
      const task = v.task;
      const ok =
        (level === 'easy' && task === 'interval' && isOneOf(v.target, BUILD_INTERVALS)) ||
        (level === 'medium' && task === 'chord' && isOneOf(v.target, BUILD_CHORDS)) ||
        (level === 'hard' && ((task === 'chord' && isOneOf(v.target, BUILD_SEVENTHS)) || (task === 'scale' && isOneOf(v.target, BUILD_SCALES))));
      if (!ok) return 'build task';
      const notes = buildAnswerNotes(v as unknown as BuildSpec);
      if (!notes || !spellingOk(notes, level) || !inRange(notes, KEYS_LOW, KEYS_HIGH)) return 'build spelling';
      return undefined;
    }
    default:
      return 'unknown kind';
  }
}

/** A stable identity of an item (no two identical items in a round). */
export const specKey = (spec: Spec): string => JSON.stringify(spec);
