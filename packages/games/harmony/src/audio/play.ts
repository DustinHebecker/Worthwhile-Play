/**
 * What each item plays (design § 7, § 9.3): the question, an option ("hear this option" on easy), the answer and
 * the player's own choice in the review ("Listen: yours / the answer", always from the same starting note). Pure.
 */
import { CHANGED_POSITIONS, buildAnswerNotes, changedIndex, intervalNotes, type Spec } from '../spec';
import { midiOf, spellCadence, spellChordVoicing, spellScale } from '../spelling';
import { CHORD_TONES, SCALE_TONES, SEMITONES, type ChordId, type ScaleId } from '../theory';
import { block, cadenceEvents, chordEvents, changedEvents, intervalEvents, melodyEvents, pairEvents, rhythmEvents, scaleEvents, sequence, slower, togetherThenApart, type NoteEvent } from './schedule';

export type Variant =
  | { readonly kind: 'question' }
  /** Option i played from the same root (also "yours" in the review). */
  | { readonly kind: 'option'; readonly i: number }
  | { readonly kind: 'together-apart' }
  /** "Which note changed?": melody A or B alone. */
  | { readonly kind: 'A' }
  | { readonly kind: 'B' }
  /** A build task's selection (root included) or its correct answer. */
  | { readonly kind: 'keys'; readonly keys: readonly number[] }
  | { readonly kind: 'target' };

export interface PlayOptions {
  readonly slow?: boolean;
  readonly countIn?: boolean;
}

/** Moves a note group by octaves into C3–C6 (an option heard from a high root could otherwise leave the range). */
export function fit(midis: readonly number[]): number[] {
  let shift = 0;
  while (Math.max(...midis) + shift > 84) shift -= 12;
  while (Math.min(...midis) + shift < 48) shift += 12;
  return midis.map((m) => m + shift);
}

const chordFrom = (root: number, q: ChordId) => fit(CHORD_TONES[q].map((v) => root + v));
const scaleFrom = (tonic: number, s: ScaleId) => fit([...SCALE_TONES[s].map((v) => tonic + v), tonic + 12]);

/** A melody with the same step sizes as `midis` but the directions of `contour` (the player's chosen shape). */
export function withContour(midis: readonly number[], contour: string): number[] {
  const out = [midis[0]!];
  for (let i = 1; i < midis.length; i++) {
    const size = Math.abs(midis[i]! - midis[i - 1]!);
    out.push(out[i - 1]! + (contour[i - 1] === 'u' ? size : -size));
  }
  return out;
}

function events(spec: Spec, v: Variant, countIn: boolean, slow: boolean): NoteEvent[] {
  switch (spec.k) {
    case 'interval': {
      const notes = intervalNotes(spec.root, spec.ivl, spec.dir)!.map(midiOf);
      const first = notes[0]!;
      if (v.kind === 'together-apart') return togetherThenApart(Math.min(...notes), Math.max(...notes));
      const ivl = v.kind === 'option' ? (spec.options[v.i] ?? spec.ivl) : spec.ivl;
      const [a, b] = fit([first, spec.dir === 'down' ? first - SEMITONES[ivl] : first + SEMITONES[ivl]]);
      return intervalEvents(a!, b!, spec.dir === 'together');
    }
    case 'chord': {
      if (v.kind === 'option') return chordEvents(chordFrom(midiOf(spec.root), spec.options[v.i] ?? spec.q));
      return chordEvents(spellChordVoicing(spec.root, spec.q, spec.inv)!.map(midiOf));
    }
    case 'scale': {
      if (v.kind === 'option') return scaleEvents(scaleFrom(midiOf(spec.tonic), spec.options[v.i] ?? spec.s));
      return scaleEvents(spellScale(spec.tonic, spec.s)!.map(midiOf));
    }
    case 'pair': {
      const dyad = (d: typeof spec.first) => [midiOf(d.root), midiOf(d.root) + SEMITONES[d.ivl]];
      if (v.kind === 'option') return block(dyad(v.i === 0 ? spec.first : spec.second), 1.5);
      return pairEvents(dyad(spec.first), dyad(spec.second));
    }
    case 'cadence': {
      const c = v.kind === 'option' ? (spec.options[v.i] ?? spec.c) : spec.c;
      return cadenceEvents(spellCadence(spec.key, c)!.map((ch) => ch.map(midiOf)));
    }
    case 'contour': {
      const midis = spec.notes.map(midiOf);
      return melodyEvents(v.kind === 'option' && spec.options[v.i] ? fit(withContour(midis, spec.options[v.i]!)) : midis);
    }
    case 'changed': {
      const a = spec.a.map(midiOf);
      const b = spec.b.map(midiOf);
      if (v.kind === 'A') return melodyEvents(a);
      if (v.kind === 'B') return melodyEvents(b);
      if (v.kind === 'option') {
        // "Yours": melody B as it would be if the chosen note had changed by the same amount instead.
        const i = changedIndex(spec.a, spec.b);
        const pos = CHANGED_POSITIONS[v.i] ?? i;
        const mine = a.map((m, k) => (k === pos ? m + (b[i]! - a[i]!) : m));
        return changedEvents(a, fit(mine));
      }
      return changedEvents(a, b);
    }
    case 'rhythm': {
      const i = v.kind === 'option' ? v.i : spec.answer;
      return rhythmEvents(spec.options[i] ?? spec.options[spec.answer]!, countIn, slow);
    }
    case 'build': {
      const root = midiOf(spec.root);
      const notes = v.kind === 'keys' ? [...new Set([root, ...v.keys])].sort((x, y) => x - y) : (buildAnswerNotes(spec) ?? [spec.root]).map(midiOf);
      if (spec.task === 'scale') return scaleEvents(v.kind === 'keys' ? notes : [...notes, root + 12]);
      if (spec.task === 'interval') return sequence(notes, 0.9, 0.85);
      return chordEvents(notes);
    }
  }
}

/** The note events for an item and a variant; "Slower" stretches (rhythm: a slower tempo instead). */
export function itemEvents(spec: Spec, variant: Variant, options: PlayOptions = {}): NoteEvent[] {
  const slow = options.slow === true;
  const out = events(spec, variant, options.countIn !== false, slow);
  return slow && spec.k !== 'rhythm' ? slower(out) : out;
}
