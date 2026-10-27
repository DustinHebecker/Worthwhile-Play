/**
 * Music theory facts used by Tones & Chords (design § 7, Appendix C): intervals, chords, scales, reference ratios,
 * consonance classes, `recognise` for the free keyboard and the pitch ↔ frequency mapping of 12-tone equal temperament
 * (A4 = 440 Hz). Pure; no game state, no DOM.
 */

export const INTERVALS = ['m2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'] as const;
export type IntervalId = (typeof INTERVALS)[number];

export const CHORDS = ['maj', 'min', 'dim', 'aug', 'dom7', 'maj7', 'min7'] as const;
export type ChordId = (typeof CHORDS)[number];

export const SCALES = ['major', 'natural-minor', 'harmonic-minor', 'major-pentatonic'] as const;
export type ScaleId = (typeof SCALES)[number];

export const CADENCES = ['finished', 'open', 'surprise'] as const;
export type CadenceId = (typeof CADENCES)[number];

/** Size in semitones (the tritone is 6). */
export const SEMITONES: Readonly<Record<IntervalId, number>> = { m2: 1, M2: 2, m3: 3, M3: 4, P4: 5, TT: 6, P5: 7, m6: 8, M6: 9, m7: 10, M7: 11, P8: 12 };

/** Letter steps (the interval number − 1); the tritone is spelled as an augmented fourth (design § 7.8). */
export const LETTER_STEPS: Readonly<Record<IntervalId, number>> = { m2: 1, M2: 1, m3: 2, M3: 2, P4: 3, TT: 3, P5: 4, m6: 5, M6: 5, m7: 6, M7: 6, P8: 7 };

/** The interval of a size in semitones (1…12), or undefined. */
export const intervalOfSemitones = (semitones: number): IntervalId | undefined => INTERVALS.find((id) => SEMITONES[id] === semitones);

/** Chord tones in semitones above the root, in stacked-third order. */
export const CHORD_TONES: Readonly<Record<ChordId, readonly number[]>> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  dom7: [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10]
};

/** Scale degrees in semitones above the tonic (without the octave). */
export const SCALE_TONES: Readonly<Record<ScaleId, readonly number[]>> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  'natural-minor': [0, 2, 3, 5, 7, 8, 10],
  'harmonic-minor': [0, 2, 3, 5, 7, 8, 11],
  'major-pentatonic': [0, 2, 4, 7, 9]
};

/** Letter steps of each scale degree above the tonic (one letter per degree; pentatonic = degrees 1 2 3 5 6). */
export const SCALE_STEPS: Readonly<Record<ScaleId, readonly number[]>> = {
  major: [0, 1, 2, 3, 4, 5, 6],
  'natural-minor': [0, 1, 2, 3, 4, 5, 6],
  'harmonic-minor': [0, 1, 2, 3, 4, 5, 6],
  'major-pentatonic': [0, 1, 2, 4, 5]
};

/** Third sizes in semitones of a chord in root position ("4 + 3" for major). */
export const thirdSizes = (q: ChordId): number[] => CHORD_TONES[q].slice(1).map((v, i) => v - CHORD_TONES[q][i]!);

/** Step sizes in semitones between neighbouring scale degrees, the octave included (2 2 1 2 2 2 1 for major). */
export const scaleStepSizes = (s: ScaleId): number[] => {
  const tones = [...SCALE_TONES[s], 12];
  return tones.slice(1).map((v, i) => v - tones[i]!);
};

/** Pitch class 0…11 of a MIDI note (C = 0). */
export const pitchClass = (midi: number): number => ((midi % 12) + 12) % 12;

/** Frequency in Hz of a MIDI note in 12-tone equal temperament, A4 (MIDI 69) = 440 Hz. */
export const midiToFreq = (midi: number): number => 440 * 2 ** ((midi - 69) / 12);

/** Cents of a frequency ratio (1200 · log2). */
export const cents = (ratio: number): number => 1200 * Math.log2(ratio);

/**
 * Reference ("pure") ratio of each interval for explanations (Appendix C). The tritone has no simple ratio; 45 : 32 is
 * shown as an approximation.
 */
export const RATIOS: Readonly<Record<IntervalId, readonly [number, number]>> = {
  m2: [16, 15],
  M2: [9, 8],
  m3: [6, 5],
  M3: [5, 4],
  P4: [4, 3],
  TT: [45, 32],
  P5: [3, 2],
  m6: [8, 5],
  M6: [5, 3],
  m7: [16, 9],
  M7: [15, 8],
  P8: [2, 1]
};

/** Equal temperament minus the pure ratio, in cents (positive: equal temperament is wider). */
export const etDeviation = (ivl: IntervalId): number => 100 * SEMITONES[ivl] - cents(RATIOS[ivl][0] / RATIOS[ivl][1]);

/** Consonance classes of common-practice theory (design § 7.3). P4 and m6 are never asked. */
export const CLASSES = ['perfect', 'imperfect', 'mild', 'sharp'] as const;
export type ConsonanceClass = (typeof CLASSES)[number];

export const CLASS_MEMBERS: Readonly<Record<ConsonanceClass, readonly IntervalId[]>> = {
  perfect: ['P8', 'P5'],
  imperfect: ['M3', 'm3', 'M6'],
  mild: ['M2', 'm7'],
  sharp: ['m2', 'M7', 'TT']
};

/** The class of an interval, or undefined for the perfect fourth and the minor sixth (not asked). */
export const classOf = (ivl: IntervalId): ConsonanceClass | undefined => CLASSES.find((c) => CLASS_MEMBERS[c].includes(ivl));

/**
 * Class combinations that may be compared, as [more stable, less stable], per level. Never adjacent classes
 * (perfect vs imperfect, imperfect vs mild, mild vs sharp), never P4 or m6 (design § 7.3).
 */
export const PAIR_COMBOS = {
  easy: [['perfect', 'sharp']],
  medium: [
    ['perfect', 'sharp'],
    ['imperfect', 'sharp'],
    ['perfect', 'mild']
  ],
  hard: [
    ['perfect', 'sharp'],
    ['imperfect', 'sharp'],
    ['perfect', 'mild']
  ]
} as const satisfies Record<string, readonly (readonly [ConsonanceClass, ConsonanceClass])[]>;

/** Rank of a class (0 = most stable); used only for the allowed, uncontested combinations above. */
export const classRank = (c: ConsonanceClass): number => CLASSES.indexOf(c);

/** Whether two intervals may be asked as a stability pair at a level (an allowed combination, either order). */
export function isAllowedPair(a: IntervalId, b: IntervalId, level: keyof typeof PAIR_COMBOS): boolean {
  const ca = classOf(a);
  const cb = classOf(b);
  if (!ca || !cb) return false;
  return PAIR_COMBOS[level].some(([s, t]) => (s === ca && t === cb) || (s === cb && t === ca));
}

/** Pitch-class set (sorted, distinct) of MIDI notes. */
export const pcSet = (midis: readonly number[]): number[] => [...new Set(midis.map(pitchClass))].sort((x, y) => x - y);

export const sameSet = (a: readonly number[], b: readonly number[]): boolean => a.length === b.length && a.every((v, i) => v === b[i]);

/** Pitch classes of a chord on a root pitch class. */
export const chordPcs = (rootPc: number, q: ChordId): number[] => pcSet(CHORD_TONES[q].map((v) => rootPc + v));

/** Pitch classes of a scale on a tonic pitch class. */
export const scalePcs = (tonicPc: number, s: ScaleId): number[] => pcSet(SCALE_TONES[s].map((v) => tonicPc + v));

/** What the free keyboard can name for the held notes (design § 7.7). */
export type Recognition =
  | { kind: 'empty' }
  | { kind: 'note'; midi: number }
  | { kind: 'interval'; low: number; high: number; ivl: IntervalId | undefined; semitones: number }
  | { kind: 'chord'; rootPc: number; q: ChordId; inversion: number; bass: number }
  | { kind: 'unnamed'; bass: number; above: number[] };

/**
 * Names held notes: one note, an interval (two distinct notes; sizes above an octave are reduced, an exact octave
 * multiple counts as an octave), a chord with its inversion (3–4 distinct pitch classes, doubled notes allowed), or
 * "no common name" with the semitones above the lowest note. The bass is tried first as the root, so the symmetric
 * augmented triad is named from its lowest note.
 */
export function recognise(midis: readonly number[]): Recognition {
  const notes = [...new Set(midis)].sort((a, b) => a - b);
  if (notes.length === 0) return { kind: 'empty' };
  const bass = notes[0]!;
  if (notes.length === 1) return { kind: 'note', midi: bass };
  const pcs = pcSet(notes);
  if (notes.length === 2 || pcs.length === 1) {
    const high = notes[notes.length - 1]!;
    const diff = high - bass;
    const reduced = diff % 12 === 0 ? 12 : diff % 12;
    return { kind: 'interval', low: bass, high, ivl: intervalOfSemitones(reduced), semitones: diff };
  }
  if (pcs.length === 2) {
    // Doubled notes of a two-pitch-class set: name the interval above the bass.
    const other = notes.find((m) => pitchClass(m) !== pitchClass(bass))!;
    const reduced = (other - bass) % 12 || 12;
    return { kind: 'interval', low: bass, high: other, ivl: intervalOfSemitones(reduced), semitones: other - bass };
  }
  if (pcs.length <= 4) {
    const bassPc = pitchClass(bass);
    const roots = [bassPc, ...pcs.filter((p) => p !== bassPc)];
    for (const rootPc of roots) {
      for (const q of CHORDS) {
        if (CHORD_TONES[q].length !== pcs.length) continue;
        if (!sameSet(chordPcs(rootPc, q), pcs)) continue;
        const inversion = CHORD_TONES[q].findIndex((v) => pitchClass(rootPc + v) === bassPc);
        return { kind: 'chord', rootPc, q, inversion, bass };
      }
    }
  }
  return { kind: 'unnamed', bass, above: notes.slice(1).map((m) => m - bass) };
}

/** Greatest common divisor and least common multiple of positive integers. */
export const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
export const lcm = (a: number, b: number): number => (a / gcd(a, b)) * b;

/** The pure ratio [num, den] (reduced) of a size in semitones ≥ 0, octaves included (e.g. 19 → 3 : 1). */
export function pureRatio(semitones: number): [number, number] {
  const octaves = Math.floor(semitones / 12);
  const rest = semitones % 12;
  let [p, q] = rest === 0 ? [1, 1] : (RATIOS[intervalOfSemitones(rest)!] as [number, number]);
  p *= 2 ** octaves;
  const g = gcd(p, q);
  return [p / g, q / g];
}

/**
 * How many periods of the lowest note the sum of the fundamentals takes to repeat, for pure ratios relative to the
 * lowest note (design § 11.3): the lcm of the ratio denominators. 1 for a single note.
 */
export const repeatPeriods = (semitonesAboveLowest: readonly number[]): number =>
  semitonesAboveLowest.reduce((acc, s) => lcm(acc, pureRatio(s)[1]), 1);

/** Repeats up to this many lower-note periods count as a "short repeat" in the wave caption. */
export const SHORT_REPEAT = 5;

/** Cadence chords as voicings relative to the tonic T (design § 7.3): bass and three upper voices, in semitones. */
export const CADENCE_CHORDS = {
  I: { bass: -12, upper: [4, 7, 12] },
  IV: { bass: -7, upper: [5, 9, 12] },
  V: { bass: -5, upper: [2, 7, 11] },
  vi: { bass: -3, upper: [0, 4, 12] }
} as const;
export type CadenceChord = keyof typeof CADENCE_CHORDS;

/** Letter steps of the same voices relative to the tonic letter (for spelling). */
export const CADENCE_STEPS: Readonly<Record<CadenceChord, { bass: number; upper: readonly number[] }>> = {
  I: { bass: -7, upper: [2, 4, 7] },
  IV: { bass: -4, upper: [3, 5, 7] },
  V: { bass: -3, upper: [1, 4, 6] },
  vi: { bass: -2, upper: [0, 2, 7] }
};

export const CADENCE_PROGRESSIONS: Readonly<Record<CadenceId, readonly CadenceChord[]>> = {
  finished: ['I', 'IV', 'V', 'I'],
  open: ['I', 'IV', 'I', 'V'],
  surprise: ['I', 'IV', 'V', 'vi']
};

/** The four voices (bass first) of a cadence chord on a tonic MIDI note. */
export const cadenceVoices = (tonic: number, chord: CadenceChord): number[] => [
  tonic + CADENCE_CHORDS[chord].bass,
  ...CADENCE_CHORDS[chord].upper.map((u) => tonic + u)
];
