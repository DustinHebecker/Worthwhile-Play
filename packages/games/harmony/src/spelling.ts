/**
 * Spelled pitches (design § 7.8): a letter, one accidental at most and a scientific octave (C4 = middle C = MIDI 60).
 * Intervals, chords and scales are spelled by letter steps from the root, so the letter distance always matches the
 * interval number. Pure.
 */
import { CADENCE_PROGRESSIONS, CADENCE_STEPS, CHORD_TONES, LETTER_STEPS, SCALE_STEPS, SCALE_TONES, SEMITONES, cadenceVoices, pitchClass, recognise, type CadenceChord, type CadenceId, type ChordId, type IntervalId, type ScaleId } from './theory';

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

/** A letter and accidental placed at a MIDI note (the octave follows from the note). */
export const placeAt = (la: Pick<Spelled, 'l' | 'a'>, midi: number): Spelled => ({ l: la.l, a: la.a, o: Math.floor((midi - NATURAL[la.l]! - la.a) / 12) - 1 });

/** Lexicographic comparison of cost vectors of equal length. */
const cheaper = (x: readonly number[], y: readonly number[]): boolean => {
  const i = x.findIndex((v, k) => v !== y[k]);
  return i >= 0 && x[i]! < y[i]!;
};

/** The accidental each letter carries in the major key of `tonic` (its key signature), indexed by letter 0…6. */
export function keySignature(tonic: Pick<Spelled, 'l' | 'a'>): (-1 | 0 | 1)[] | undefined {
  const scale = spellScale({ ...tonic, o: 4 }, 'major');
  if (!scale) return undefined;
  const sig: (-1 | 0 | 1)[] = [0, 0, 0, 0, 0, 0, 0];
  for (const n of scale) sig[n.l] = n.a;
  return sig;
}

/**
 * The spelling of `midi` in the major key of `tonic` (used for the moved note of "which note changed?"): the key's own
 * spelling when the pitch belongs to the key (C♯ in E major, never D♭); otherwise, among the single-accidental
 * spellings, the one that departs least from the key signature, then not a rare spelling (E♯, F♭, B♯, C♭; a natural
 * sign reads better), then one not on the staff position of a neighbouring note (`neighbours`), then raised when the
 * note moved up (`move` > 0) and lowered when it moved down. Never a double accidental. Pure.
 */
export function spellInKey(tonic: Pick<Spelled, 'l' | 'a'>, midi: number, neighbours: readonly Spelled[] = [], move = 0): Spelled {
  const sig = keySignature(tonic);
  if (!sig) return defaultSpelling(midi);
  const pc = ((midi % 12) + 12) % 12;
  let best: { s: Spelled; cost: number[] } | undefined;
  for (let l = 0; l < 7; l++)
    for (const a of [-1, 0, 1] as const) {
      if ((((NATURAL[l]! + a) % 12) + 12) % 12 !== pc) continue;
      const s = placeAt({ l, a }, midi);
      if (a === sig[l]) return s;
      const cost = [
        Math.abs(a - sig[l]!),
        isRare(s) ? 1 : 0,
        neighbours.some((n) => diatonic(n) === diatonic(s) && midiOf(n) !== midi) ? 1 : 0,
        move !== 0 && Math.sign(a - sig[l]!) !== Math.sign(move) ? 1 : 0
      ];
      if (!best || cheaper(cost, best.cost)) best = { s, cost };
    }
  return best?.s ?? defaultSpelling(midi);
}

/* ---------- Spelling what is held on the free keyboard (design § 7.7) ---------- */

/** The other usual single-accidental spelling of the black keys (C♯/D♭ …); naturals have none here. */
const ALTERNATIVE: Readonly<Record<number, Pick<Spelled, 'l' | 'a'>>> = { 1: { l: 0, a: 1 }, 3: { l: 1, a: 1 }, 6: { l: 4, a: -1 }, 8: { l: 4, a: 1 }, 10: { l: 5, a: 1 } };
const spellingsOf = (pc: number): Pick<Spelled, 'l' | 'a'>[] => [ROOT_POOL[pc]!, ...(ALTERNATIVE[pc] ? [ALTERNATIVE[pc]] : [])];


/** Rare spellings cost most, then accidentals, then two different notes written on the same letter and octave. */
const cost = (notes: readonly Spelled[]): number => {
  let c = 0;
  notes.forEach((n, i) => {
    c += (isRare(n) ? 10 : 0) + (n.a !== 0 ? 1 : 0);
    if (notes.some((m, k) => k < i && diatonic(m) === diatonic(n) && midiOf(m) !== midiOf(n))) c += 100;
  });
  return c;
};

export interface HeldSpelling {
  /** The held notes (ascending MIDI), spelled. */
  readonly notes: Spelled[];
  /** For a recognised chord: its root as spelled, the quality and the inversion (an augmented triad may be named from another tone). */
  readonly chord?: { readonly root: Pick<Spelled, 'l' | 'a'>; readonly q: ChordId; readonly inversion: number };
}

/**
 * Spells held notes by what they form (design § 7.8 applied to the free keyboard): an interval by letter steps from
 * the lower note (a major third above E is G♯, never A♭), a chord in stacked thirds from its root (C♯ minor rather than
 * D♭ minor with F♭; an augmented triad from the tone that needs no double sharp), anything else with the usual
 * spellings, avoiding two notes on one letter. Among correct spellings the one with fewest rare spellings and
 * accidentals wins. Pure.
 */
export function spellHeld(held: readonly number[]): HeldSpelling {
  const notes = [...new Set(held)].sort((a, b) => a - b);
  const r = recognise(notes);
  let best: { notes: Spelled[]; cost: number; chord?: HeldSpelling['chord'] } | undefined;
  const offer = (spelled: Spelled[], chord?: HeldSpelling['chord']) => {
    const c = cost(spelled);
    if (!best || c < best.cost) best = { notes: spelled, cost: c, ...(chord ? { chord } : {}) };
  };
  if (r.kind === 'chord') {
    const bassPc = pitchClass(r.bass);
    const roots = r.q === 'aug' ? [0, 4, 8].map((v) => pitchClass(r.rootPc + v)) : [r.rootPc];
    for (const rootPc of roots)
      for (const la of spellingsOf(rootPc)) {
        const tones = spellChord({ ...la, o: 4 }, r.q);
        if (!tones) continue;
        const byPc = new Map(tones.map((t) => [pitchClass(midiOf(t)), t] as const));
        const inversion = CHORD_TONES[r.q].findIndex((v) => pitchClass(rootPc + v) === bassPc);
        offer(notes.map((m) => placeAt(byPc.get(pitchClass(m))!, m)), { root: la, q: r.q, inversion });
      }
  } else if (r.kind === 'interval' && r.ivl && pitchClass(r.high) !== pitchClass(r.low)) {
    const lowPc = pitchClass(r.low);
    const steps = r.ivl === 'TT' ? [3, 4] : [LETTER_STEPS[r.ivl]];
    for (const la of spellingsOf(lowPc))
      for (const st of steps) {
        const up = spellAt(placeAt(la, r.low), st, pitchClass(r.high - r.low));
        if (up) offer(notes.map((m) => placeAt(pitchClass(m) === lowPc ? la : up, m)));
      }
  } else {
    const pcs = [...new Set(notes.map(pitchClass))];
    const choices = pcs.filter((pc) => ALTERNATIVE[pc]);
    for (let mask = 0; mask < 1 << choices.length; mask++) {
      const pick = (pc: number) => {
        const k = choices.indexOf(pc);
        return k >= 0 && mask & (1 << k) ? ALTERNATIVE[pc]! : ROOT_POOL[pc]!;
      };
      offer(notes.map((m) => placeAt(pick(pitchClass(m)), m)));
    }
  }
  return best ? { notes: best.notes, ...(best.chord ? { chord: best.chord } : {}) } : { notes: notes.map(defaultSpelling) };
}
