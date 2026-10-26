import { createRng } from '@wp/game-core';
import { describe, expect, it } from 'vitest';
import { add, cmp, frac, mul, ONE, sub, ZERO, type Frac } from '../src/frac';
import { allDifferent, binomialTail, choose, diceCount, TRAP_TEMPLATES, trapById, trapValid, type TrapQuestion } from '../src/traps';
import type { Difficulty } from '../src/templates';

const DIFFS: Difficulty[] = ['easy', 'medium', 'hard'];
const samples = (id: string, n = 50): { d: Difficulty; p: number[] }[] => {
  const t = trapById(id)!;
  const out: { d: Difficulty; p: number[] }[] = [];
  for (const d of t.levels) for (let s = 0; s < n; s++) out.push({ d, p: t.draw(createRng(s * 31 + d.length), d) });
  return out;
};
const q = (id: string, p: number[], i: number): TrapQuestion => trapById(id)!.questions(p)[i]!;
const exact = (x: TrapQuestion): Frac => (x.kind === 'prob' ? x.exact : ZERO);
const correct = (x: TrapQuestion): number => (x.kind === 'prob' ? -1 : x.correct);

describe('trap templates (content doc § 5)', () => {
  it('draw always gives valid parameters, and valid never throws on junk', () => {
    for (const t of TRAP_TEMPLATES)
      for (const d of t.levels)
        for (let s = 0; s < 100; s++) {
          const p = t.draw(createRng(s), d);
          expect(trapValid(t, p, d), `${t.id} ${d} ${p}`).toBe(true);
          expect(p.length).toBeLessThanOrEqual(12);
          for (const question of t.questions(p)) {
            if (question.kind === 'choice') expect(question.correct).toBeLessThan(question.options.length);
            if (question.kind === 'count') expect(new Set(question.values).size).toBe(question.values.length);
          }
        }
    for (const t of TRAP_TEMPLATES) for (const d of DIFFS) for (const junk of [null, 'x', [1.5], [-1, -1, -1, -1, -1, -1], Array(13).fill(1)]) expect(trapValid(t, junk, d)).toBe(false);
  });
  it('levels match the content doc (easy has seven templates)', () => {
    expect(TRAP_TEMPLATES.filter((t) => t.levels.includes('easy')).map((t) => t.id).sort()).toEqual(
      ['t-conjunction', 't-dice', 't-sensor', 't-sequence', 't-tyres', 't-week', 't-wheel'].sort()
    );
    expect(TRAP_TEMPLATES).toHaveLength(12);
  });

  it('t-sensor: answer equals an explicit population of lamps', () => {
    for (const { p } of samples('t-sensor', 20)) {
      const [f, fDen, s, qq, den] = p as [number, number, number, number, number];
      let faultyFlagged = 0;
      let flagged = 0;
      for (let lamp = 0; lamp < fDen; lamp++)
        for (let slot = 0; slot < den; slot++) {
          const faulty = lamp < f;
          if (faulty ? slot < s : slot < qq) {
            flagged++;
            if (faulty) faultyFlagged++;
          }
        }
      expect(exact(q('t-sensor', p, 1))).toEqual(frac(faultyFlagged, flagged));
      expect(correct(q('t-sensor', p, 0))).toBe(faultyFlagged * 2 > flagged ? 0 : 1);
    }
    // Worked example: f = 2 %, s = 90 %, q = 5 % → 18/67.
    expect(exact(q('t-sensor', [2, 100, 90, 5, 100, 214], 1))).toEqual(frac(18, 67));
  });
  it('t-wheel: enumeration conditioned on the misses gives r/k', () => {
    for (const k of [3, 4]) for (let r = 1; r < k; r++) {
      const s = 4;
      let cond = 0;
      let hit = 0;
      for (let x = 0; x < k ** (s + 1); x++) {
        const digits = Array.from({ length: s + 1 }, (_, i) => Math.floor(x / k ** i) % k);
        if (digits.slice(0, s).every((v) => v >= r)) {
          cond++;
          if (digits[s]! < r) hit++;
        }
      }
      expect(exact(q('t-wheel', [k, r, s], 1))).toEqual(frac(hit, cond));
    }
  });
  it('t-sequence: every exact sequence has chance 1/2^n (enumeration)', () => {
    for (const { p } of samples('t-sequence', 20)) {
      const n = p[0]!;
      let count = 0;
      for (let x = 0; x < 2 ** n; x++) if (x === p[1]) count++;
      expect(exact(q('t-sequence', p, 1))).toEqual(frac(count, 2 ** n));
      expect(correct(q('t-sequence', p, 0))).toBe(2);
    }
  });
  it('t-conjunction: a 10,000-cell table; windy is always more likely than rainy and windy', () => {
    for (const { p } of samples('t-conjunction', 30)) {
      const [a, b, w] = p as [number, number, number];
      let both = 0;
      let windy = 0;
      for (let rain = 0; rain < 100; rain++)
        for (let wind = 0; wind < 100; wind++) {
          const rainy = rain < a;
          const isWindy = wind < (rainy ? b : w);
          if (isWindy) windy++;
          if (rainy && isWindy) both++;
        }
      expect(exact(q('t-conjunction', p, 1))).toEqual(frac(both, 10_000));
      expect(windy).toBeGreaterThan(both);
      expect(correct(q('t-conjunction', p, 0))).toBe(0);
    }
  });
  it('t-simpson: A better in both groups, B better overall (direct counts)', () => {
    for (const { p } of samples('t-simpson', 50)) {
      const [aSn, aSk, aLn, aLk, bSn, bSk, bLn, bLk] = p as number[] as [number, number, number, number, number, number, number, number];
      expect(aSk / aSn).toBeGreaterThan(bSk / bSn);
      expect(aLk / aLn).toBeGreaterThan(bLk / bLn);
      expect(bSk + bLk).toBeGreaterThan(aSk + aLk);
      expect(correct(q('t-simpson', p, 0))).toBe(1);
      expect(correct(q('t-simpson', p, 1))).toBe(0);
    }
    // The worked example of the content doc.
    expect(trapValid(trapById('t-simpson')!, [20, 18, 80, 48, 80, 68, 20, 11], 'medium')).toBe(true);
  });
  it('t-paw: an explicit population of nights', () => {
    for (const { p } of samples('t-paw', 20)) {
      const [n, r] = p as [number, number];
      // N·r equally likely visits: the neighbour's cat on r of them (always matching), other cats on (N−1)·r,
      // of which one in r matches.
      let match = 0;
      let neighbour = 0;
      for (let visit = 0; visit < n * r; visit++) {
        const isNeighbour = visit < r;
        const matches = isNeighbour || (visit - r) % r === 0;
        if (matches) {
          match++;
          if (isNeighbour) neighbour++;
        }
      }
      expect(exact(q('t-paw', p, 1))).toEqual(frac(neighbour, match));
      expect(cmp(exact(q('t-paw', p, 1)), frac(34, 100))).toBeLessThanOrEqual(0);
    }
    expect(exact(q('t-paw', [400, 50], 1))).toEqual(frac(50, 449));
  });
  it('t-bakery: binomial tails equal Pascal’s triangle; the small bakery always has more such days', () => {
    const pascal = (n: number): bigint[] => {
      let row = [1n];
      for (let i = 0; i < n; i++) row = [...row, 0n].map((x, k) => x + (k > 0 ? row[k - 1]! : 0n));
      return row;
    };
    for (const n of [10, 12, 20, 40, 50, 100]) {
      const row = pascal(n);
      for (let k = 0; k <= n; k++) expect(choose(n, k)).toBe(row[k]);
    }
    expect(binomialTail(10, 7)).toEqual(frac(7, 128));
    expect(binomialTail(10, 6)).toEqual(frac(11, 64));
    for (const { p } of samples('t-bakery', 30)) expect(correct(q('t-bakery', p, 0))).toBe(0);
  });
  it('t-drawers: enumeration over key, first pick and the caretaker’s choices', () => {
    for (const n of [3, 4, 5]) {
      let win = ZERO;
      for (let key = 0; key < n; key++)
        for (let pick = 0; pick < n; pick++) {
          // The caretaker leaves one other drawer closed: the key's when you missed it, else any other (uniformly).
          const left = key !== pick ? [key] : Array.from({ length: n }, (_, i) => i).filter((i) => i !== pick);
          for (const other of left) if (other === key) win = add(win, frac(1, n * n * left.length));
        }
      expect(exact(q('t-drawers', [n], 1))).toEqual(win);
    }
  });
  it('t-week: enumeration of all day patterns', () => {
    for (const { p } of samples('t-week', 20)) {
      const [m, qq] = p as [number, number];
      let any = ZERO;
      for (let mask = 1; mask < 2 ** m; mask++) {
        let pr = ONE;
        for (let d = 0; d < m; d++) pr = mul(pr, mask & (1 << d) ? frac(qq, 100) : frac(100 - qq, 100));
        any = add(any, pr);
      }
      expect(exact(q('t-week', p, 0))).toEqual(any);
    }
    expect(exact(q('t-week', [7, 20], 0))).toEqual(frac(61_741, 78_125));
  });
  it('t-numbers: brute force for small cases, and a recursion for the real ones', () => {
    for (const r of [5, 10, 20])
      for (let g = 1; g <= 3; g++) {
        let distinct = 0;
        for (let x = 0; x < r ** g; x++) {
          const picks = Array.from({ length: g }, (_, i) => Math.floor(x / r ** i) % r);
          if (new Set(picks).size === g) distinct++;
        }
        expect(allDifferent(g, r)).toEqual(frac(distinct, r ** g));
      }
    for (const { p } of samples('t-numbers', 30)) {
      const [g, r] = p as [number, number];
      let rec = ONE;
      for (let i = 1; i <= g; i++) rec = mul(rec, frac(r - i + 1, r));
      expect(exact(q('t-numbers', p, 1))).toEqual(sub(ONE, rec));
      const v = Number(exact(q('t-numbers', p, 1)).n) / Number(exact(q('t-numbers', p, 1)).d);
      expect(correct(q('t-numbers', p, 0))).toBe(v < 0.25 ? 0 : v > 0.75 ? 2 : 1);
    }
    expect(exact(q('t-numbers', [12, 100], 1))).toEqual(frac(194_080_717_127_425_363n, 390_625_000_000_000_000n));
  });
  it('t-tyres: four distinct options, the right one counts over a thousand rides', () => {
    for (const { p } of samples('t-tyres', 30)) {
      const question = q('t-tyres', p, 0);
      if (question.kind !== 'count') throw new Error('count expected');
      let fewer = 0;
      for (let ride = 0; ride < 1000; ride++) if (ride % 100 < p[0]! && !(ride % 100 < p[1]!)) fewer++;
      expect(question.values[question.correct]).toBe(fewer);
      expect(new Set(question.values).size).toBe(4);
    }
  });
  it('t-dice: enumeration of the 36 ordered pairs', () => {
    for (let s = 2; s <= 12; s++) {
      let count = 0;
      for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b === s) count++;
      expect(diceCount(s)).toBe(count);
    }
    for (const { d, p } of samples('t-dice', 30)) {
      const [s1, s2] = p as [number, number];
      expect(exact(q('t-dice', p, 1))).toEqual(frac(diceCount(s1), 36));
      const c = diceCount(s1) - diceCount(s2);
      expect(correct(q('t-dice', p, 0))).toBe(c > 0 ? 0 : c < 0 ? 1 : 2);
      if (d === 'easy') expect(Math.abs(c)).toBeGreaterThanOrEqual(2);
    }
  });
});
