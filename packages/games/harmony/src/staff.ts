/**
 * Staff layout (design § 11.1), pure and tested: staff positions of spelled pitches for the treble and bass clefs,
 * ledger lines, stem direction, notehead displacement in seconds and accidental columns in chords.
 *
 * Positions count half spaces from the bottom line (0 = bottom line, 8 = top line); the treble clef's bottom line is
 * E4, the bass clef's bottom line is G2.
 */
import { diatonic, type Spelled } from './spelling';

export type Clef = 'treble' | 'bass';

const BOTTOM: Readonly<Record<Clef, number>> = { treble: diatonic({ l: 2, a: 0, o: 4 }), bass: diatonic({ l: 4, a: 0, o: 2 }) };

export const staffPosition = (s: Spelled, clef: Clef): number => diatonic(s) - BOTTOM[clef];

/** Ledger-line positions a note at position p needs (even positions outside 0…8). */
export function ledgerLines(p: number): number[] {
  const out: number[] = [];
  for (let q = -2; q >= p; q -= 2) out.push(q);
  for (let q = 10; q <= p; q += 2) out.push(q);
  return out;
}

/** Stem up when the note farthest from the middle line lies below it (ties: down, by convention). */
export function stemUp(positions: readonly number[]): boolean {
  let far = 4;
  for (const p of positions) if (Math.abs(p - 4) > Math.abs(far - 4) || (Math.abs(p - 4) === Math.abs(far - 4) && p > far)) far = p;
  return far < 4;
}

export interface HeadLayout {
  readonly p: number;
  readonly a: -1 | 0 | 1;
  /** A natural sign is drawn (a natural note after or beside the same letter with an accidental). */
  readonly natural: boolean;
  /** 0 = on the normal side; 1 = displaced to the right (stem up), −1 = to the left (stem down). */
  readonly side: -1 | 0 | 1;
  /** Accidental column, 0 nearest to the notehead; −1 without accidental. */
  readonly accCol: number;
}

/** Whether a note needs a sign: ♯/♭ always (no key signatures), ♮ only when `natural` is set. */
const signed = (n: { a: -1 | 0 | 1; natural?: boolean | undefined }) => n.a !== 0 || n.natural === true;

/**
 * Heads of one chord: in a second (or on one position, as F and F♯), one note moves to the other side of the stem
 * (with the stem up the upper note goes right, with the stem down the lower note goes left). Accidentals take the
 * leftmost free column in which they keep at least six positions (a sixth) from the others, from the top note down.
 */
export function chordHeads(notes: readonly { p: number; a: -1 | 0 | 1; natural?: boolean | undefined }[], up: boolean): HeadLayout[] {
  const sorted = [...notes].sort((x, y) => x.p - y.p || x.a - y.a);
  const sides = new Array<-1 | 0 | 1>(sorted.length).fill(0);
  if (up) {
    for (let i = 1; i < sorted.length; i++) if (sorted[i]!.p - sorted[i - 1]!.p <= 1 && sides[i - 1] === 0) sides[i] = 1;
  } else {
    for (let i = sorted.length - 2; i >= 0; i--) if (sorted[i + 1]!.p - sorted[i]!.p <= 1 && sides[i + 1] === 0) sides[i] = -1;
  }
  const cols: number[][] = [];
  const accCol = new Array<number>(sorted.length).fill(-1);
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (!signed(sorted[i]!)) continue;
    let c = 0;
    while (cols[c]?.some((p) => Math.abs(p - sorted[i]!.p) < 6)) c++;
    (cols[c] ??= []).push(sorted[i]!.p);
    accCol[i] = c;
  }
  return sorted.map((n, i) => ({ p: n.p, a: n.a, natural: n.a === 0 && n.natural === true, side: sides[i]!, accCol: accCol[i]! }));
}

/**
 * Which notes of a staff need a natural sign (there is no key signature and an accidental holds for the rest of the
 * bar): a natural note on a letter and octave that an earlier note, or another note of the same chord, altered.
 * One flag per note, in the order given (events in time order, notes within each event).
 */
export function naturalSigns(events: readonly (readonly Spelled[])[]): boolean[][] {
  const state = new Map<number, number>();
  return events.map((notes) => {
    const flags = notes.map((n) => n.a === 0 && ((state.get(diatonic(n)) ?? 0) !== 0 || notes.some((m) => m !== n && diatonic(m) === diatonic(n) && m.a !== 0)));
    for (const n of notes) state.set(diatonic(n), n.a);
    return flags;
  });
}
