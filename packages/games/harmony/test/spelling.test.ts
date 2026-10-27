import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  ROOT_POOL,
  defaultSpelling,
  diatonic,
  isRare,
  isSpelled,
  midiOf,
  spellAt,
  spellCadence,
  spellChord,
  spellChordVoicing,
  spellDown,
  spellNear,
  spellScale,
  spellUp,
  type Spelled
} from '../src/spelling';
import { CHORDS, CHORD_TONES, INTERVALS, LETTER_STEPS, SCALES, SCALE_TONES, SEMITONES, pitchClass } from '../src/theory';

const s = (l: number, a: -1 | 0 | 1, o: number): Spelled => ({ l, a, o });
const name = (n: Spelled | undefined) => (n ? `${'CDEFGAB'[n.l]}${n.a === 1 ? '#' : n.a === -1 ? 'b' : ''}${n.o}` : 'none');
const poolRoot = fc.integer({ min: 0, max: 11 }).map((pc) => ({ ...ROOT_POOL[pc]!, o: 4 }));

describe('spelled pitches', () => {
  it('maps to MIDI with C4 = 60', () => {
    expect(midiOf(s(0, 0, 4))).toBe(60);
    expect(midiOf(s(5, 0, 4))).toBe(69);
    expect(midiOf(s(6, 1, 3))).toBe(60);
    expect(midiOf(s(0, -1, 4))).toBe(59);
    expect(defaultSpelling(61)).toEqual(s(1, -1, 4));
    expect(defaultSpelling(66)).toEqual(s(3, 1, 4));
    expect(defaultSpelling(83)).toEqual(s(6, 0, 5));
    for (let m = 36; m <= 96; m++) expect(midiOf(defaultSpelling(m))).toBe(m);
  });

  it('rare spellings are E♯, F♭, B♯, C♭', () => {
    expect([s(2, 1, 4), s(3, -1, 4), s(6, 1, 4), s(0, -1, 4)].every(isRare)).toBe(true);
    expect(ROOT_POOL.some(isRare)).toBe(false);
  });

  it('validates untrusted values without throwing', () => {
    expect(isSpelled(s(0, 0, 4))).toBe(true);
    for (const junk of [null, 1, [], {}, { l: 7, a: 0, o: 4 }, { l: 0, a: 2, o: 4 }, { l: 0, a: 0, o: 4.5 }, { l: 0, a: 0, o: 4, x: 1 }]) expect(isSpelled(junk)).toBe(false);
    fc.assert(fc.property(fc.anything(), (v) => { expect(() => isSpelled(v)).not.toThrow(); }));
  });
});

describe('interval spelling (design § 7.8)', () => {
  it('spells the textbook examples', () => {
    expect(name(spellUp(s(0, 0, 4), 'TT'))).toBe('F#4');
    expect(name(spellUp(s(1, -1, 4), 'TT'))).toBe('G4');
    expect(name(spellUp(s(2, -1, 4), 'TT'))).toBe('A4');
    expect(name(spellUp(s(6, -1, 4), 'TT'))).toBe('E5');
    expect(name(spellDown(s(0, 0, 5), 'TT'))).toBe('Gb4');
    expect(name(spellUp(s(3, 1, 4), 'TT'))).toBe('B#4');
    expect(name(spellUp(s(6, 0, 4), 'TT'))).toBe('E#5');
    expect(name(spellUp(s(2, 0, 4), 'm3'))).toBe('G4');
    expect(name(spellUp(s(5, -1, 4), 'M7'))).toBe('G5');
    expect(spellUp(s(3, 1, 4), 'M7')).toEqual(s(2, 1, 5));
  });

  it('pitch class matches MIDI, letter distance matches the interval number, no double accidentals (property)', () => {
    fc.assert(
      fc.property(poolRoot, fc.constantFrom(...INTERVALS), (root, ivl) => {
        const up = spellUp(root, ivl);
        if (up) {
          expect(midiOf(up) - midiOf(root)).toBe(SEMITONES[ivl]);
          expect(diatonic(up) - diatonic(root)).toBe(LETTER_STEPS[ivl]);
          expect(Math.abs(up.a)).toBeLessThanOrEqual(1);
        }
        const down = spellDown(root, ivl);
        if (down) {
          expect(midiOf(root) - midiOf(down)).toBe(SEMITONES[ivl]);
          expect(diatonic(root) - diatonic(down)).toBe(LETTER_STEPS[ivl]);
        }
      })
    );
  });

  it('descending mirrors ascending', () => {
    for (const pc of ROOT_POOL)
      for (const ivl of INTERVALS) {
        const root = { ...pc, o: 4 };
        const up = spellUp(root, ivl);
        if (up) expect(spellDown(up, ivl)).toEqual(root);
      }
  });

  it('every interval and chord quality has ≥ 6 roots in the pool with plain spellings', () => {
    for (const ivl of INTERVALS) {
      const ok = ROOT_POOL.filter((r) => {
        const up = spellUp({ ...r, o: 4 }, ivl);
        return up && !isRare(up);
      });
      expect(ok.length, ivl).toBeGreaterThanOrEqual(6);
    }
    for (const q of CHORDS) {
      const ok = ROOT_POOL.filter((r) => spellChord({ ...r, o: 4 }, q)?.every((n) => !isRare(n)));
      expect(ok.length, q).toBeGreaterThanOrEqual(6);
    }
  });
});

describe('chords, scales and cadences', () => {
  it('chords stack thirds by letter', () => {
    expect(spellChord(s(3, 0, 4), 'maj')!.map(name)).toEqual(['F4', 'A4', 'C5']);
    expect(spellChord(s(6, 0, 4), 'dim')!.map(name)).toEqual(['B4', 'D5', 'F5']);
    expect(spellChord(s(0, 0, 4), 'aug')!.map(name)).toEqual(['C4', 'E4', 'G#4']);
    expect(spellChord(s(4, 0, 4), 'dom7')!.map(name)).toEqual(['G4', 'B4', 'D5', 'F5']);
    expect(spellChord(s(6, 0, 4), 'aug')).toBeUndefined();
    expect(spellChordVoicing(s(0, 0, 4), 'maj', 1)!.map(name)).toEqual(['E4', 'G4', 'C5']);
    expect(spellChordVoicing(s(0, 0, 4), 'maj', 2)!.map(name)).toEqual(['G4', 'C5', 'E5']);
    for (const pc of ROOT_POOL)
      for (const q of CHORDS) {
        const tones = spellChord({ ...pc, o: 4 }, q);
        if (tones) expect(tones.map((t) => pitchClass(midiOf(t)))).toEqual(CHORD_TONES[q].map((v) => pitchClass(midiOf({ ...pc, o: 4 }) + v)));
      }
  });

  it('scales use one letter per degree', () => {
    expect(spellScale(s(1, 0, 4), 'major')!.map(name)).toEqual(['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5', 'D5']);
    expect(spellScale(s(5, 0, 4), 'harmonic-minor')!.map(name)).toEqual(['A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G#5', 'A5']);
    expect(spellScale(s(0, 0, 4), 'major-pentatonic')!.map(name)).toEqual(['C4', 'D4', 'E4', 'G4', 'A4', 'C5']);
    for (const pc of ROOT_POOL)
      for (const sc of SCALES) {
        const notes = spellScale({ ...pc, o: 4 }, sc);
        if (!notes) continue;
        expect(notes.slice(0, -1).map((n) => midiOf(n) - midiOf(notes[0]!))).toEqual([...SCALE_TONES[sc]]);
        expect(new Set(notes.slice(0, -1).map((n) => n.l)).size).toBe(notes.length - 1);
      }
  });

  it('cadence voices are spelled in the key', () => {
    expect(spellCadence(s(0, 0, 4), 'surprise')!.map((c) => c.map(name).join(' '))).toEqual(['C3 E4 G4 C5', 'F3 F4 A4 C5', 'G3 D4 G4 B4', 'A3 C4 E4 C5']);
    expect(spellCadence(s(1, -1, 4), 'finished')![2]!.map(name)).toEqual(['Ab3', 'Eb4', 'Ab4', 'C5']);
  });

  it('spellNear keeps the letter when it can, never with a double accidental', () => {
    expect(spellNear(s(2, 0, 4), 63)).toEqual(s(2, -1, 4));
    expect(spellNear(s(2, 0, 4), 65)).toEqual(s(3, 0, 4));
    expect(spellNear(s(0, 0, 4), 62)).toEqual(s(1, 0, 4));
    fc.assert(
      fc.property(fc.integer({ min: 60, max: 81 }), fc.constantFrom(-3, -2, -1, 1, 2, 3), (m, d) => {
        const from = defaultSpelling(m);
        const near = spellNear(from, m + d);
        expect(midiOf(near)).toBe(m + d);
        expect(Math.abs(near.a)).toBeLessThanOrEqual(1);
      })
    );
    expect(spellAt(s(0, 0, 4), 1, 4)).toBeUndefined();
  });
});
