import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createRng } from '@wp/game-core';
import { answerSequence, generateRound, generationStats } from '../src/generate';
import { LEVELS, QUIZ_TOPICS } from '../src/levels';
import { CONTOURS_3, changedIndex, contourOf, specProblem, type Spec } from '../src/spec';
import { midiOf } from '../src/spelling';
import { fairnessProblems } from './fairness';

const seed = fc.integer({ min: 0, max: 0xffffffff });

describe('answerSequence', () => {
  it('keeps every value ≤ ⌈n/k⌉ times and never three in a row', () => {
    fc.assert(
      fc.property(seed, fc.integer({ min: 2, max: 12 }), fc.integer({ min: 1, max: 12 }), (s, k, n) => {
        const pool = Array.from({ length: k }, (_, i) => i);
        const seq = answerSequence(createRng(s), pool, n);
        expect(seq).toHaveLength(n);
        for (const v of pool) expect(seq.filter((x) => x === v).length).toBeLessThanOrEqual(Math.ceil(n / k));
        for (let i = 2; i < n; i++) expect(seq[i] === seq[i - 1] && seq[i] === seq[i - 2]).toBe(false);
      })
    );
  });
});

describe('generateRound (design § 7)', () => {
  it('is deterministic', () => {
    for (const topic of QUIZ_TOPICS) for (const level of LEVELS) expect(generateRound(7, topic, level)).toEqual(generateRound(7, topic, level));
    expect(generateRound(7, 'intervals', 'easy')).not.toEqual(generateRound(8, 'intervals', 'easy'));
  });

  it('is fair for every topic and level (property over seeds)', () => {
    const before = { ...generationStats };
    fc.assert(
      fc.property(seed, fc.constantFrom(...QUIZ_TOPICS), fc.constantFrom(...LEVELS), (s, topic, level) => {
        expect(fairnessProblems(generateRound(s, topic, level), topic, level)).toEqual([]);
      }),
      { numRuns: 150 }
    );
    expect(generationStats.fixed - before.fixed).toBe(0);
  });

  it('keeps register and level rules per kind', () => {
    for (let s = 0; s < 30; s++) {
      for (const level of LEVELS) {
        for (const spec of generateRound(s, 'intervals', level) as Extract<Spec, { k: 'interval' }>[]) {
          if (level === 'easy') expect(spec.dir).toBe('up');
          if (level === 'medium') expect(spec.dir).not.toBe('down');
        }
        for (const spec of generateRound(s, 'melody', level)) {
          if (spec.k === 'contour') {
            expect(spec.options).toContain(contourOf(spec.notes));
            if (level === 'easy') expect(spec.options).toEqual(CONTOURS_3);
            else {
              const leaps = spec.notes.slice(1).map((n, i) => Math.abs(midiOf(n) - midiOf(spec.notes[i]!)));
              expect(Math.max(...leaps)).toBeGreaterThanOrEqual(4);
            }
          } else if (spec.k === 'changed') {
            const i = changedIndex(spec.a, spec.b);
            expect(i).toBeGreaterThanOrEqual(1);
            const moved = Math.abs(midiOf(spec.a[i]!) - midiOf(spec.b[i]!));
            expect(moved).toBeGreaterThanOrEqual(1);
            expect(moved).toBeLessThanOrEqual(3);
          } else throw new Error('wrong kind');
        }
        const kinds = generateRound(s, 'chords', level).map((x) => x.k);
        expect(kinds.filter((k) => k === 'scale').length).toBe(level === 'easy' ? 0 : 3);
        const stab = generateRound(s, 'stability', level).map((x) => x.k);
        expect(stab.filter((k) => k === 'cadence').length).toBe(level === 'hard' ? 4 : 0);
      }
    }
  });

  it('specProblem catches tampering', () => {
    const [interval] = generateRound(1, 'intervals', 'easy') as Extract<Spec, { k: 'interval' }>[];
    expect(specProblem(interval, 'easy')).toBeUndefined();
    expect(specProblem({ ...interval!, ivl: 'TT' }, 'easy')).toBeDefined();
    expect(specProblem({ ...interval!, options: ['M2', 'M3', 'P5'] }, 'easy')).toBeDefined();
    expect(specProblem({ ...interval!, options: ['M2', 'M2', 'P5', 'P8'] }, 'easy')).toBeDefined();
    expect(specProblem({ ...interval!, root: { l: 0, a: 0, o: 6 } }, 'easy')).toBeDefined();
    expect(specProblem({ ...interval!, dir: 'down' }, 'easy')).toBeDefined();
    const [rhythm] = generateRound(1, 'rhythm', 'easy') as Extract<Spec, { k: 'rhythm' }>[];
    expect(specProblem({ ...rhythm!, options: [[2, 2, 2], ...rhythm!.options.slice(1)] }, 'easy')).toBeDefined();
    expect(specProblem({ ...rhythm!, answer: 5 }, 'easy')).toBeDefined();
    expect(specProblem({ k: 'pair', first: { root: { l: 0, a: 0, o: 4 }, ivl: 'P4' }, second: { root: { l: 0, a: 0, o: 4 }, ivl: 'm2' } }, 'hard')).toBeDefined();
    expect(specProblem({ k: 'pair', first: { root: { l: 0, a: 0, o: 4 }, ivl: 'P5' }, second: { root: { l: 0, a: 0, o: 4 }, ivl: 'm2' } }, 'hard')).toBeUndefined();
    expect(specProblem({ k: 'cadence', key: { l: 0, a: 0, o: 4 }, c: 'open', options: ['finished', 'open', 'surprise'] }, 'medium')).toBeDefined();
    fc.assert(fc.property(fc.anything(), (v) => { expect(() => specProblem(v, 'hard')).not.toThrow(); }));
  });
});
