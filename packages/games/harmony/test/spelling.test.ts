import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  ROOT_POOL,
  defaultSpelling,
  diatonic,
  isRare,
  isSpelled,
  keySignature,
  midiOf,
  spellAt,
  spellCadence,
  spellChord,
  spellChordVoicing,
  spellDown,
  spellInKey,
  spellScale,
  spellHeld,
  spellUp,
  type Spelled
} from '../src/spelling';
import { CHORDS, CHORD_TONES, INTERVALS, LETTER_STEPS, SCALES, SCALE_TONES, SEMITONES, intervalOfSemitones, pitchClass } from '../src/theory';

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

  it('spellInKey spells a moved note in its key: the key\'s own spelling, else the least departure from the signature', () => {
    const E = { l: 2, a: 0 } as const;
    const C = { l: 0, a: 0 } as const;
    expect(keySignature(E)).toEqual([1, 1, 0, 1, 1, 0, 0]);
    expect(keySignature({ l: 2, a: -1 })).toEqual([0, 0, -1, 0, 0, -1, -1]);
    // The reviewer's example: in E major, D♯5 moved down two semitones is C♯5 (diatonic), not D♭5.
    expect(name(spellInKey(E, 73, [s(1, 1, 5)], -2))).toBe('C#5');
    // Not in the key: a single departure from the signature (D♮ in E major, C♮ rather than B♯).
    expect(name(spellInKey(E, 74, [], 1))).toBe('D5');
    expect(name(spellInKey(E, 72, [], -1))).toBe('C5');
    expect(name(spellInKey({ l: 3, a: 1 }, 72, [], 1))).toBe('C5');
    expect(name(spellInKey({ l: 2, a: -1 }, 64, [], 1))).toBe('E4');
    // Raised when moving up, lowered when moving down …
    expect(name(spellInKey(C, 61, [], 1))).toBe('C#4');
    expect(name(spellInKey(C, 61, [], -1))).toBe('Db4');
    // … unless that puts it on the staff position of a neighbouring note (C4 C♯4 → C4 D♭4) …
    expect(name(spellInKey(C, 61, [s(0, 0, 4)], 1))).toBe('Db4');
    // … but a natural sign beats E♯, F♭, B♯ and C♭ (B major: F♮4 before F♯4, not E♯4; E♭ major: B♮4 after B♭4, not C♭5).
    expect(name(spellInKey({ l: 6, a: 0 }, 65, [s(3, 1, 4)], -1))).toBe('F4');
    expect(name(spellInKey({ l: 2, a: -1 }, 71, [s(6, -1, 4)], 1))).toBe('B4');
    // spellAt refuses double accidentals (four semitones above C on the next letter would be D𝄪).
    expect(spellAt(s(0, 0, 4), 1, 4)).toBeUndefined();
  });

  it('spellInKey: diatonic when the pitch is in the key, else at most one step from the signature; never a double accidental', () => {
    const spelled = fc.integer({ min: 60, max: 81 }).map(defaultSpelling);
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 11 }), fc.integer({ min: 60, max: 81 }), fc.array(spelled, { maxLength: 2 }), fc.constantFrom(-3, -2, -1, 1, 2, 3), (pc, m, neighbours, move) => {
        const key = ROOT_POOL[pc]!;
        const sig = keySignature(key)!;
        const scale = spellScale({ ...key, o: 4 }, 'major')!;
        const n = spellInKey(key, m, neighbours, move);
        expect(midiOf(n)).toBe(m);
        expect(isSpelled(n)).toBe(true);
        if (scale.some((x) => pitchClass(midiOf(x)) === pitchClass(m))) expect(n.a).toBe(sig[n.l]);
        else expect(Math.abs(n.a - sig[n.l]!)).toBe(1);
      })
    );
  });
});

describe('spellHeld (free keyboard)', () => {
  const names = (held: number[]) => spellHeld(held).notes.map(name).join(' ');

  it('spells an interval by letter steps from the lower note: a major third above E is G♯, never A♭', () => {
    expect(names([64, 68])).toBe('E4 G#4');
    expect(names([71, 75])).toBe('B4 D#5');
    expect(names([66, 70])).toBe('F#4 A#4');
    expect(names([60, 63])).toBe('C4 Eb4');
    expect(names([65, 66])).toBe('F4 Gb4');
    expect(names([70, 71])).toBe('A#4 B4');
    expect(names([61, 64])).toBe('C#4 E4');
    expect(names([60, 72])).toBe('C4 C5');
    // Every two-note set: the letter distance matches the interval number (the tritone as a fourth or a fifth).
    fc.assert(
      fc.property(fc.integer({ min: 36, max: 82 }), fc.integer({ min: 1, max: 11 }), (low, size) => {
        const [a, b] = spellHeld([low, low + size]).notes;
        expect(midiOf(a!)).toBe(low);
        expect(midiOf(b!)).toBe(low + size);
        const steps = diatonic(b!) - diatonic(a!);
        const ivl = intervalOfSemitones(size)!;
        expect(ivl === 'TT' ? [3, 4] : [LETTER_STEPS[ivl]]).toContain(steps);
      })
    );
  });

  it('spells chords in stacked thirds from the usual root, never with a double accidental', () => {
    expect(names([61, 64, 68])).toBe('C#4 E4 G#4');
    expect(names([68, 71, 75])).toBe('G#4 B4 D#5');
    expect(names([61, 64, 67])).toBe('C#4 E4 G4');
    expect(names([63, 66, 69])).toBe('D#4 F#4 A4');
    expect(names([61, 65, 68])).toBe('Db4 F4 Ab4');
    // E augmented would need B♯; the symmetric triad is named from a tone that needs no rare spelling.
    expect(names([64, 68, 72])).toBe('E4 Ab4 C5');
    expect(spellHeld([64, 68, 72]).chord).toEqual({ root: { l: 5, a: -1 }, q: 'aug', inversion: 2 });
    expect(names([59, 63, 67])).toBe('B3 Eb4 G4');
    expect(spellHeld([61, 64, 68]).chord).toEqual({ root: { l: 0, a: 1 }, q: 'min', inversion: 0 });
    for (const q of CHORDS)
      for (let root = 48; root < 60; root++)
        for (let inv = 0; inv < CHORD_TONES[q].length; inv++) {
          const midis = CHORD_TONES[q].map((v, i) => root + v + (i < inv ? 12 : 0)).sort((x, y) => x - y);
          const { notes, chord } = spellHeld(midis);
          expect(notes.map(midiOf)).toEqual(midis);
          expect(notes.every((n) => Math.abs(n.a) <= 1)).toBe(true);
          expect(chord?.q).toBe(q);
          // Stacked thirds (and the seventh): every tone is an even number of letters above the named root.
          const r = chord!.root;
          for (const n of notes) expect((((n.l - r.l) % 7) + 7) % 7 % 2).toBe(0);
        }
  });

  it('keeps other sets on the usual spellings and avoids two notes on one letter', () => {
    expect(names([65, 66, 70])).toBe('F4 Gb4 Bb4');
    expect(names([60])).toBe('C4');
    expect(spellHeld([]).notes).toEqual([]);
  });
});
