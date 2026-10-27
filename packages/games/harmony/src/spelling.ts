/**
 * Spelled pitches (design § 7.8): a letter, one accidental at most and a scientific octave (C4 = middle C = MIDI 60).
 * Intervals, chords and scales are spelled by letter steps from the root, so the letter distance always matches the
 * interval number. Pure.
 */
import { CADENCE_PROGRESSIONS, CADENCE_STEPS, CHORD_TONES, LETTER_STEPS, SCALE_STEPS, SCALE_TONES, SEMITONES, cadenceVoices, type CadenceChord, type CadenceId, type ChordId, type IntervalId, type ScaleId } from './theory';

export interface Spelled {
  /** Letter 0…6 = C D E F G A B. */
  readonly l: number;
  /** Accidental: −1 flat, 0 natural, 1 sharp. */
  readonly a: -1 | 0 | 1;
  /** Scientific octave. */
  readonly o: number;
}

/** Semitones of the natural letters above C. */
export const NATURAL = [0, 2, 4, 5, 7, 9, 11] as const;

export const midiOf = (s: Spelled): number => 12 * (s.o + 1) + NATURAL[s.l]! + s.a;

/** Diatonic index (letter + 7 · octave); its difference is the letter distance. */
export const diatonic = (s: Spelled): number => s.l + 7 * s.o;

export const sameSpelled = (x: Spelled, y: Spelled): boolean => x.l === y.l && x.a === y.a && x.o === y.o;

/** E♯, F♭, B♯ and C♭: correct spellings that are avoided below the hard level (design § 7). */
export const isRare = (s: Pick<Spelled, 'l' | 'a'>): boolean =>
  (s.a === 1 && (s.l === 2 || s.l === 6)) || (s.a === -1 && (s.l === 3 || s.l === 0));

/** Well-formed: integer letter 0…6, accidental −1/0/1, octave 1…7. Never throws. */
export const isSpelled = (v: unknown): v is Spelled => {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  const r = v as Record<string, unknown>;
  const keys = Object.keys(r);
  return (
    keys.length === 3 &&
    Number.isInteger(r.l) && (r.l as number) >= 0 && (r.l as number) <= 6 &&
    (r.a === -1 || r.a === 0 || r.a === 1) &&
    Number.isInteger(r.o) && (r.o as number) >= 1 && (r.o as number) <= 7
  );
};

/**
 * The pitch `semitones` above (or below, for negative values) `from`, spelled `steps` letters away; undefined when
 * that would need a double accidental.
 */
export function spellAt(from: Spelled, steps: number, semitones: number): Spelled | undefined {
  const d = diatonic(from) + steps;
  const l = ((d % 7) + 7) % 7;
  const o = Math.floor(d / 7);
  const natural = 12 * (o + 1) + NATURAL[l]!;
  const a = midiOf(from) + semitones - natural;
  if (a !== -1 && a !== 0 && a !== 1) return undefined;
  return { l, a, o };
}

/** The upper note of an interval above `root` (tritone = augmented fourth). */
export const spellUp = (root: Spelled, ivl: IntervalId): Spelled | undefined => spellAt(root, LETTER_STEPS[ivl], SEMITONES[ivl]);

/** The lower note of an interval below `top` (written down a fourth for the tritone: C down to G♭). */
export const spellDown = (top: Spelled, ivl: IntervalId): Spelled | undefined => spellAt(top, -LETTER_STEPS[ivl], -SEMITONES[ivl]);

/** Chord tones from the root in stacked thirds (letter + 2 each), in root position. */
export function spellChord(root: Spelled, q: ChordId): Spelled[] | undefined {
  const out: Spelled[] = [];
  for (let i = 0; i < CHORD_TONES[q].length; i++) {
    const s = spellAt(root, 2 * i, CHORD_TONES[q][i]!);
    if (!s) return undefined;
    out.push(s);
  }
  return out;
}

/** Chord tones in an inversion: the lowest `inv` tones move up an octave (the order is then low to high). */
export function spellChordVoicing(root: Spelled, q: ChordId, inv: number): Spelled[] | undefined {
  const tones = spellChord(root, q);
  if (!tones) return undefined;
  const raised = tones.slice(0, inv).map((s) => ({ ...s, o: s.o + 1 }));
  return [...tones.slice(inv), ...raised];
}

/** Scale from the tonic up to the tonic an octave higher, one letter per degree. */
export function spellScale(tonic: Spelled, s: ScaleId): Spelled[] | undefined {
  const out: Spelled[] = [];
  for (let i = 0; i < SCALE_TONES[s].length; i++) {
    const n = spellAt(tonic, SCALE_STEPS[s][i]!, SCALE_TONES[s][i]!);
    if (!n) return undefined;
    out.push(n);
  }
  out.push({ ...tonic, o: tonic.o + 1 });
  return out;
}

/** Voices of one cadence chord, bass first, spelled relative to the key's tonic. */
export function spellCadenceChord(tonic: Spelled, chord: CadenceChord): Spelled[] | undefined {
  const midis = cadenceVoices(midiOf(tonic), chord);
  const steps = [CADENCE_STEPS[chord].bass, ...CADENCE_STEPS[chord].upper];
  const out: Spelled[] = [];
  for (let i = 0; i < steps.length; i++) {
    const n = spellAt(tonic, steps[i]!, midis[i]! - midiOf(tonic));
    if (!n) return undefined;
    out.push(n);
  }
  return out;
}

/** All chords of a cadence, spelled. */
export function spellCadence(tonic: Spelled, c: CadenceId): Spelled[][] | undefined {
  const chords = CADENCE_PROGRESSIONS[c].map((ch) => spellCadenceChord(tonic, ch));
  return chords.every((x): x is Spelled[] => x !== undefined) ? chords : undefined;
}

/**
 * The twelve usual key spellings of the root pool (design § 7): C, D♭, D, E♭, E, F, F♯, G, A♭, A, B♭, B, as letter and
 * accidental, indexed by pitch class.
 */
export const ROOT_POOL: readonly Pick<Spelled, 'l' | 'a'>[] = [
  { l: 0, a: 0 },
  { l: 1, a: -1 },
  { l: 1, a: 0 },
  { l: 2, a: -1 },
  { l: 2, a: 0 },
  { l: 3, a: 0 },
  { l: 3, a: 1 },
  { l: 4, a: 0 },
  { l: 5, a: -1 },
  { l: 5, a: 0 },
  { l: 6, a: -1 },
  { l: 6, a: 0 }
];

/** The usual spelling of a MIDI note (the root pool's spelling of its pitch class). */
export function defaultSpelling(midi: number): Spelled {
  const pc = ((midi % 12) + 12) % 12;
  const { l, a } = ROOT_POOL[pc]!;
  const o = Math.floor((midi - NATURAL[l]! - a) / 12) - 1;
  return { l, a, o };
}

/** A pool root (by pitch class) placed at a MIDI note of that pitch class. */
export const rootAt = (midi: number): Spelled => defaultSpelling(midi);

/**
 * A chromatic spelling of `midi` near `from` (used for the moved note of "which note changed?"): the same letter when
 * a single accidental suffices and it is not a rare spelling, else the neighbouring letter in the direction of the move.
 */
export function spellNear(from: Spelled, midi: number): Spelled {
  const diff = midi - midiOf(from);
  const candidates = [0, Math.sign(diff), -Math.sign(diff), 2 * Math.sign(diff)];
  for (const allowRare of [false, true]) {
    for (const steps of candidates) {
      const s = spellAt(from, steps, diff);
      if (s && (allowRare || !isRare(s))) return s;
    }
  }
  return defaultSpelling(midi);
}
