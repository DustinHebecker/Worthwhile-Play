import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  CADENCE_PROGRESSIONS,
  CHORDS,
  CHORD_TONES,
  CLASS_MEMBERS,
  INTERVALS,
  PAIR_COMBOS,
  RATIOS,
  SCALES,
  SEMITONES,
  cadenceVoices,
  cents,
  chordPcs,
  classOf,
  etDeviation,
  intervalOfSemitones,
  isAllowedPair,
  midiToFreq,
  pitchClass,
  pureRatio,
  recognise,
  repeatPeriods,
  scalePcs,
  scaleStepSizes,
  thirdSizes
} from '../src/theory';

describe('intervals', () => {
  it('have the standard sizes', () => {
    expect(INTERVALS.map((i) => SEMITONES[i])).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    for (const i of INTERVALS) expect(intervalOfSemitones(SEMITONES[i])).toBe(i);
    expect(intervalOfSemitones(0)).toBeUndefined();
    expect(intervalOfSemitones(13)).toBeUndefined();
  });

  it('reference ratios and cents match Appendix C to 0.1 cent', () => {
    const pure: Record<string, number> = { m2: 111.7, M2: 203.9, m3: 315.6, M3: 386.3, P4: 498.0, TT: 590.2, P5: 702.0, m6: 813.7, M6: 884.4, m7: 996.1, M7: 1088.3, P8: 1200.0 };
    const dev: Record<string, number> = { m2: -11.7, M2: -3.9, m3: -15.6, M3: 13.7, P4: 2.0, TT: 9.8, P5: -2.0, m6: -13.7, M6: 15.6, m7: 3.9, M7: 11.7, P8: 0 };
    for (const i of INTERVALS) {
      const [p, q] = RATIOS[i];
      expect(Math.round(cents(p / q) * 10) / 10, i).toBe(pure[i]);
      expect(Math.round(etDeviation(i) * 10) / 10 + 0, i).toBe(dev[i]);
    }
  });

  it('consonance classes follow common practice; P4 and m6 are never asked', () => {
    expect(classOf('P4')).toBeUndefined();
    expect(classOf('m6')).toBeUndefined();
    expect(classOf('P5')).toBe('perfect');
    expect(classOf('M6')).toBe('imperfect');
    expect(classOf('m7')).toBe('mild');
    expect(classOf('TT')).toBe('sharp');
    const all = Object.values(CLASS_MEMBERS).flat();
    expect(new Set(all).size).toBe(10);
  });

  it('allows only uncontested pairs (never adjacent classes)', () => {
    for (const level of ['easy', 'medium', 'hard'] as const) {
      for (const [s, t] of PAIR_COMBOS[level]) expect(['perfect-imperfect', 'imperfect-mild', 'mild-sharp']).not.toContain(`${s}-${t}`);
    }
    expect(isAllowedPair('P5', 'm2', 'easy')).toBe(true);
    expect(isAllowedPair('m2', 'P8', 'easy')).toBe(true);
    expect(isAllowedPair('M3', 'm2', 'easy')).toBe(false);
    expect(isAllowedPair('M3', 'm2', 'medium')).toBe(true);
    expect(isAllowedPair('P5', 'M3', 'hard')).toBe(false);
    expect(isAllowedPair('P4', 'm2', 'hard')).toBe(false);
    expect(isAllowedPair('m6', 'TT', 'hard')).toBe(false);
    expect(isAllowedPair('M2', 'm2', 'hard')).toBe(false);
  });
});

describe('chords and scales', () => {
  it('have the textbook pitch-class sets', () => {
    expect(chordPcs(0, 'maj')).toEqual([0, 4, 7]);
    expect(chordPcs(9, 'min')).toEqual([0, 4, 9]);
    expect(chordPcs(11, 'dim')).toEqual([2, 5, 11]);
    expect(chordPcs(0, 'aug')).toEqual([0, 4, 8]);
    expect(chordPcs(7, 'dom7')).toEqual([2, 5, 7, 11]);
    expect(chordPcs(0, 'maj7')).toEqual([0, 4, 7, 11]);
    expect(chordPcs(2, 'min7')).toEqual([0, 2, 5, 9]);
    expect(scalePcs(0, 'major')).toEqual([0, 2, 4, 5, 7, 9, 11]);
    expect(scalePcs(9, 'natural-minor')).toEqual([0, 2, 4, 5, 7, 9, 11]);
    expect(scalePcs(9, 'harmonic-minor')).toEqual([0, 2, 4, 5, 8, 9, 11]);
    expect(scalePcs(0, 'major-pentatonic')).toEqual([0, 2, 4, 7, 9]);
  });

  it('third sizes and step sizes', () => {
    expect(thirdSizes('maj')).toEqual([4, 3]);
    expect(thirdSizes('min')).toEqual([3, 4]);
    expect(thirdSizes('dim')).toEqual([3, 3]);
    expect(thirdSizes('aug')).toEqual([4, 4]);
    expect(thirdSizes('dom7')).toEqual([4, 3, 3]);
    expect(scaleStepSizes('major')).toEqual([2, 2, 1, 2, 2, 2, 1]);
    expect(scaleStepSizes('harmonic-minor')).toEqual([2, 1, 2, 2, 1, 3, 1]);
    expect(scaleStepSizes('major-pentatonic')).toEqual([2, 2, 3, 2, 3]);
    for (const s of SCALES) expect(scaleStepSizes(s).reduce((a, b) => a + b)).toBe(12);
  });
});

describe('recognise (free keyboard)', () => {
  it('names single notes, intervals and empties', () => {
    expect(recognise([])).toEqual({ kind: 'empty' });
    expect(recognise([60])).toEqual({ kind: 'note', midi: 60 });
    expect(recognise([64, 60])).toMatchObject({ kind: 'interval', ivl: 'M3', low: 60, high: 64, semitones: 4 });
    expect(recognise([60, 72])).toMatchObject({ kind: 'interval', ivl: 'P8' });
    expect(recognise([60, 79])).toMatchObject({ kind: 'interval', ivl: 'P5', semitones: 19 });
    expect(recognise([60, 72, 84])).toMatchObject({ kind: 'interval', ivl: 'P8' });
    expect(recognise([60, 67, 72])).toMatchObject({ kind: 'interval', ivl: 'P5' });
  });

  it('names every chord quality in every inversion on every root (exhaustive)', () => {
    for (let root = 48; root < 60; root++) {
      for (const q of CHORDS) {
        const tones = CHORD_TONES[q].map((v) => root + v);
        for (let inv = 0; inv < tones.length; inv++) {
          const voicing = [...tones.slice(inv), ...tones.slice(0, inv).map((m) => m + 12)];
          const r = recognise(voicing);
          if (q === 'aug') {
            // Symmetric: named from its lowest note, always in root position.
            expect(r).toMatchObject({ kind: 'chord', q: 'aug', inversion: 0, rootPc: pitchClass(voicing[0]!) });
          } else {
            expect(r, `${q} ${root} ${inv}`).toMatchObject({ kind: 'chord', q, inversion: inv, rootPc: pitchClass(root) });
          }
        }
      }
    }
  });

  it('says "no common name" for clusters and other sets', () => {
    expect(recognise([60, 61, 62])).toEqual({ kind: 'unnamed', bass: 60, above: [1, 2] });
    expect(recognise([60, 62, 64, 65, 67])).toMatchObject({ kind: 'unnamed' });
    expect(recognise([60, 64, 67, 72])).toMatchObject({ kind: 'chord', q: 'maj', inversion: 0 });
  });
});

describe('pitch and frequency', () => {
  it('A4 = 440 Hz; an octave doubles', () => {
    expect(midiToFreq(69)).toBe(440);
    expect(midiToFreq(60)).toBeCloseTo(261.626, 3);
    fc.assert(fc.property(fc.integer({ min: 0, max: 120 }), (m) => Math.abs(midiToFreq(m + 12) / midiToFreq(m) - 2) < 1e-12));
  });

  it('pure ratios with octaves and the repeat of the summed wave', () => {
    expect(pureRatio(7)).toEqual([3, 2]);
    expect(pureRatio(19)).toEqual([3, 1]);
    expect(pureRatio(24)).toEqual([4, 1]);
    expect(pureRatio(0)).toEqual([1, 1]);
    expect(repeatPeriods([])).toBe(1);
    expect(repeatPeriods([7])).toBe(2);
    expect(repeatPeriods([4, 7])).toBe(4);
    expect(repeatPeriods([12])).toBe(1);
    expect(repeatPeriods([1])).toBe(15);
    expect(repeatPeriods([6])).toBe(32);
  });
});

describe('cadences', () => {
  /** Pairs of voices moving in parallel perfect fifths or octaves (both move, same interval class 0 or 7). */
  const parallels = (a: number[], b: number[]) => {
    const found: string[] = [];
    for (let i = 0; i < a.length; i++)
      for (let j = i + 1; j < a.length; j++) {
        const before = Math.abs(a[j]! - a[i]!) % 12;
        const after = Math.abs(b[j]! - b[i]!) % 12;
        const moved = a[i] !== b[i] && a[j] !== b[j];
        if (moved && before === after && (before === 0 || before === 7)) found.push(`${i}-${j}`);
      }
    return found;
  };

  it('upper voices move by ≤ 3 semitones without parallel fifths or octaves, in every key', () => {
    for (let tonic = 60; tonic <= 67; tonic++) {
      for (const prog of Object.values(CADENCE_PROGRESSIONS)) {
        for (let k = 1; k < prog.length; k++) {
          const a = cadenceVoices(tonic, prog[k - 1]!);
          const b = cadenceVoices(tonic, prog[k]!);
          for (let v = 1; v < 4; v++) expect(Math.abs(b[v]! - a[v]!)).toBeLessThanOrEqual(3);
          expect(parallels(a, b), `${prog.join('-')} at ${k}`).toEqual([]);
        }
      }
    }
  });
});
