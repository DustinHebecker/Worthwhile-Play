import { createRng, type Rng } from '@wp/game-core';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { accept, createRound, eligible, generateCase } from '../src/generate';
import {
  ROUND_LENGTH,
  add,
  bandOf,
  baseRateFlag,
  caseNotes,
  cmp,
  commitStep,
  countingBoard,
  div,
  drawIndex,
  forecastExact,
  forecastScore,
  frac,
  gapPp,
  isPdState,
  isReview,
  justified,
  markReported,
  movement,
  mul,
  nextCase,
  normalise,
  notebookAdd,
  notebookBins,
  posteriorAfter,
  posteriors,
  ratioClass,
  readNotebook,
  resetDraft,
  restartRound,
  roundPercents,
  setDraft,
  setShare,
  settingsOf,
  shareDraft,
  sub,
  summarize,
  toNumber,
  uniformBelow,
  type Clue,
  type ClueEvidence,
  type Frac,
  type PdState
} from '../src/rules';
import { CLUE_TEMPLATES, DIFFICULTIES, templateById } from '../src/templates';

const F = (n: number, d = 1) => frac(n, d);
const eq = (a: Frac, b: Frac) => cmp(a, b) === 0;
const smallFrac = fc.tuple(fc.integer({ min: -50, max: 50 }), fc.integer({ min: 1, max: 30 })).map(([n, d]) => frac(n, d));

/** A stub RNG that returns the given 32-bit words in turn. */
const stub = (words: number[]): Rng => {
  let i = 0;
  const next = () => (words[i++ % words.length]! >>> 0) / 0x1_0000_0000;
  return { next, int: () => 0, pick: (x) => x[0]!, shuffle: (x) => [...x], state: () => i };
};

describe('fractions', () => {
  it('are reduced with a positive denominator', () => {
    expect(frac(6, -4)).toEqual({ n: -3n, d: 2n });
    expect(frac(0, 7)).toEqual({ n: 0n, d: 1n });
    expect(() => frac(1, 0)).toThrow();
  });
  it('obey the field laws', () => {
    fc.assert(
      fc.property(smallFrac, smallFrac, smallFrac, (a, b, c) => {
        expect(eq(add(a, b), add(b, a))).toBe(true);
        expect(eq(add(add(a, b), c), add(a, add(b, c)))).toBe(true);
        expect(eq(mul(a, add(b, c)), add(mul(a, b), mul(a, c)))).toBe(true);
        expect(eq(sub(add(a, b), b), a)).toBe(true);
        if (b.n !== 0n) expect(eq(div(mul(a, b), b), a)).toBe(true);
        const g = (x: Frac) => (x.n < 0n ? -x.n : x.n);
        const r = mul(a, b);
        expect(r.d > 0n).toBe(true);
        let x = g(r);
        let y = r.d;
        while (y) [x, y] = [y, x % y];
        expect(r.n === 0n ? r.d === 1n : x === 1n).toBe(true);
      })
    );
  });
  it('cmp agrees with toNumber on non-ties', () => {
    fc.assert(fc.property(smallFrac, smallFrac, (a, b) => (toNumber(a) === toNumber(b) ? true : Math.sign(toNumber(a) - toNumber(b)) === cmp(a, b))));
  });
  it('normalise sums to exactly one', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 10 ** 9 }), { minLength: 1, maxLength: 4 }), (w) => {
        expect(eq(normalise(w).reduce(add, F(0)), F(1))).toBe(true);
      })
    );
  });
});

describe('exact draws', () => {
  it('uniformBelow is exact on every word for a small total (rejection zone discarded)', () => {
    // total 3: limit = floor(2^32 / 3) * 3 = 4294967295; the word 4294967295 is rejected.
    expect(uniformBelow(3, stub([0xffffffff, 7]))).toBe(1);
    const counts = [0, 0, 0];
    for (let w = 0; w < 3 * 1000; w++) counts[uniformBelow(3, stub([w]))]!++;
    expect(counts).toEqual([1000, 1000, 1000]);
  });
  it('drawIndex returns index i for u in its cumulative band and never a zero weight', () => {
    expect(drawIndex([3, 7], stub([0]))).toBe(0);
    expect(drawIndex([3, 7], stub([2]))).toBe(0);
    expect(drawIndex([3, 7], stub([3]))).toBe(1);
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 50 }), { minLength: 1, maxLength: 5 }).filter((w) => w.some((x) => x > 0)), fc.integer(), (w, seed) => {
        const i = drawIndex(w, createRng(seed));
        expect(i).toBeGreaterThanOrEqual(0);
        expect(w[i]).toBeGreaterThan(0);
      })
    );
  });
  it('works for totals above 2^32', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2 ** 32 + 1, max: 2 ** 53 - 1 }), fc.integer(), (total, seed) => {
        const u = uniformBelow(total, createRng(seed));
        return Number.isInteger(u) && u >= 0 && u < total;
      })
    );
  });
});

/** Independent oracle: an explicit population of priorDen · Π den cases, filtered by each clue result. */
function populationOracle(c: ClueEvidence): number[] {
  // Each hypothesis h has prior[h] · Π den members; a member "shows" clue j for the first num[h] of den slots.
  const counts = c.prior.map(() => 0);
  const dens = c.clues.map((x) => x.den);
  const total = dens.reduce((a, b) => a * b, 1);
  for (let h = 0; h < c.hyps; h++) {
    for (let idx = 0; idx < total; idx++) {
      let rest = idx;
      let fits = true;
      for (const clue of c.clues) {
        const slot = rest % clue.den;
        rest = Math.floor(rest / clue.den);
        const shows = slot < clue.num[h]!;
        if (shows !== (clue.result === 1)) fits = false;
      }
      if (fits) counts[h]! += c.prior[h]!;
    }
  }
  return counts;
}

const evidenceArb = fc.integer({ min: 2, max: 3 }).chain((hyps) =>
  fc.record({
    template: fc.constant('c-parcel'),
    hyps: fc.constant(hyps),
    priorDen: fc.constant(10),
    prior: fc.array(fc.integer({ min: 1, max: 6 }), { minLength: hyps, maxLength: hyps }),
    clues: fc.array(
      fc.record({ id: fc.constant('x'), den: fc.constant(10), num: fc.array(fc.integer({ min: 0, max: 10 }), { minLength: hyps, maxLength: hyps }), result: fc.constantFrom<0 | 1>(0, 1) }),
      { minLength: 1, maxLength: 3 }
    )
  })
).map((c) => ({ ...c, priorDen: c.prior.reduce((a, b) => a + b, 0) }) as ClueEvidence);

describe('posterior chain', () => {
  it('equals the population oracle', () => {
    fc.assert(
      fc.property(evidenceArb, (c) => {
        const oracle = populationOracle(c);
        const p = posteriorAfter(c, c.clues.length);
        expect(p.map((x) => x)).toEqual(normalise(oracle));
      }),
      { numRuns: 120 }
    );
  });
  it('is independent of the clue order', () => {
    fc.assert(
      fc.property(evidenceArb, (c) => {
        const rev = { ...c, clues: [...c.clues].reverse() };
        expect(posteriorAfter(rev, rev.clues.length)).toEqual(posteriorAfter(c, c.clues.length));
      })
    );
  });
  it('a neutral clue changes nothing and a zero likelihood gives exactly 0', () => {
    const c: ClueEvidence = { template: 'c-parcel', hyps: 2, priorDen: 10, prior: [3, 7], clues: [{ id: 'a', den: 10, num: [5, 5], result: 1 }, { id: 'b', den: 10, num: [0, 4], result: 1 }] };
    expect(posteriorAfter(c, 1)).toEqual(posteriorAfter(c, 0));
    expect(posteriorAfter(c, 2)).toEqual([F(0), F(1)]);
  });
  it('reproduces the worked example c-parcel easy (60 %, then 21/29)', () => {
    const c: ClueEvidence = {
      template: 'c-parcel',
      hyps: 2,
      priorDen: 10,
      prior: [3, 7],
      clues: [{ id: 'blue', den: 10, num: [7, 2], result: 1 }, { id: 'brown-tape', den: 10, num: [3, 6], result: 0 }]
    };
    const p = posteriors(c);
    expect(p[1]).toEqual([F(3, 5), F(2, 5)]);
    expect(p[2]).toEqual([F(21, 29), F(8, 29)]);
    const board = countingBoard(c)!;
    expect(board.population).toBe(100);
    expect(board.levels.map((l) => l.map(Number))).toEqual([[30, 70], [21, 14]]);
    expect(countingBoard(c, 1000)!.population).toBe(100);
  });
  it('reproduces the worked example c-garden hard (three hypotheses)', () => {
    const c: ClueEvidence = {
      template: 'c-garden',
      hyps: 3,
      priorDen: 100,
      prior: [30, 50, 20],
      clues: [
        { id: 'slime', den: 100, num: [5, 70, 40], result: 1 },
        { id: 'pecks', den: 100, num: [60, 10, 5], result: 0 },
        { id: 'droppings', den: 100, num: [20, 20, 85], result: 1 }
      ]
    };
    expect(posteriorAfter(c, 3)).toEqual([F(3, 322), F(45, 92), F(323, 644)]);
  });
  it('roundPercents sums to 100 and is within one of the exact value', () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 1000 }), { minLength: 2, maxLength: 3 }).filter((w) => w.some((x) => x > 0)), (w) => {
        const p = normalise(w);
        const r = roundPercents(p);
        expect(r.reduce((a, b) => a + b, 0)).toBe(100);
        r.forEach((x, i) => expect(Math.abs(x - toNumber(p[i]!) * 100)).toBeLessThan(1));
      })
    );
  });
});

describe('scoring', () => {
  it('gap bands have inclusive upper bounds at 5, 12 and 25 points', () => {
    expect(bandOf(F(5))).toBe('spot');
    expect(bandOf(F(501, 100))).toBe('close');
    expect(bandOf(F(12))).toBe('close');
    expect(bandOf(F(1201, 100))).toBe('off');
    expect(bandOf(F(25))).toBe('off');
    expect(bandOf(F(2501, 100))).toBe('far');
  });
  it('the binary gap is |b0 − 100 p0| and symmetric under swapping', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), fc.integer({ min: 0, max: 1000 }), (b0, p0) => {
        const b = [F(b0, 100), F(100 - b0, 100)];
        const p = [F(p0, 1000), F(1000 - p0, 1000)];
        expect(toNumber(gapPp(b, p))).toBeCloseTo(Math.abs(b0 - p0 / 10), 9);
        expect(gapPp([b[1]!, b[0]!], [p[1]!, p[0]!])).toEqual(gapPp(b, p));
      })
    );
  });
  it('classifies the movement ratio at its boundaries', () => {
    expect(ratioClass(-0.01)).toBe('other');
    expect(ratioClass(0)).toBe('muchLess');
    expect(ratioClass(0.5)).toBe('less');
    expect(ratioClass(0.8)).toBe('right');
    expect(ratioClass(1.25)).toBe('right');
    expect(ratioClass(1.26)).toBe('further');
    expect(ratioClass(2)).toBe('further');
    expect(ratioClass(2.01)).toBe('muchFurther');
  });
  it('movement: exact Bayes from the previous belief is "about right"; neutral and decisive branches', () => {
    const clue: Clue = { id: 'x', den: 10, num: [7, 2], result: 1 };
    const prev = [F(3, 10), F(7, 10)];
    expect(justified(prev, clue)).toEqual([F(3, 5), F(2, 5)]);
    expect(movement(prev, [60, 40], clue)).toMatchObject({ kind: 'ratio', cls: 'right' });
    expect(movement(prev, [30, 70], clue)).toMatchObject({ kind: 'ratio', cls: 'muchLess' });
    expect(movement(prev, [20, 80], clue)).toMatchObject({ kind: 'ratio', cls: 'other' });
    expect(movement(prev, [31, 69], { ...clue, num: [4, 4] })).toMatchObject({ kind: 'neutral', stayed: true });
    expect(movement(prev, [40, 60], { ...clue, num: [4, 4] })).toMatchObject({ kind: 'neutral', stayed: false, moved: 10 });
    expect(movement(prev, [1, 99], { ...clue, num: [0, 4] })).toMatchObject({ kind: 'decisive', excluded: 0, ok: true });
    expect(movement([F(1, 3), F(1, 3), F(1, 3)], [60, 20, 20], { id: 'y', den: 10, num: [6, 2, 2], result: 1 })).toMatchObject({ kind: 'three', band: 'spot' });
  });
  it('flags base-rate neglect at step one', () => {
    const c: ClueEvidence = { template: 'c-parcel', hyps: 2, priorDen: 10, prior: [3, 7], clues: [{ id: 'blue', den: 10, num: [7, 2], result: 1 }] };
    expect(baseRateFlag(c, [78, 22])).toBe(true);
    expect(baseRateFlag(c, [60, 40])).toBe(false);
  });
  it('forecast score: hand values and properness on a grid', () => {
    expect(forecastScore([50, 50], 0)).toBe(75);
    expect(forecastScore([100, 0], 0)).toBe(100);
    expect(forecastScore([100, 0], 1)).toBe(0);
    expect(toNumber(forecastExact([F(1, 3), F(1, 3), F(1, 3)], 2))).toBeCloseTo(66.667, 2);
    for (let q = 0; q <= 20; q++) {
      const p = q / 20;
      let best = -1;
      let arg = -1;
      for (let b = 0; b <= 100; b++) {
        const e = p * toNumber(forecastExact([F(b, 100), F(100 - b, 100)], 0)) + (1 - p) * toNumber(forecastExact([F(b, 100), F(100 - b, 100)], 1));
        if (e > best + 1e-12) [best, arg] = [e, b];
      }
      expect(arg).toBe(Math.round(100 * p));
    }
  });
  it('setShare keeps the sum, the set value and the order of the others', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), fc.integer({ min: 0, max: 100 }), fc.integer({ min: 0, max: 2 }), fc.integer({ min: -10, max: 110 }), (a, b, i, v) => {
        const start = [a, Math.min(b, 100 - a), 100 - a - Math.min(b, 100 - a)];
        const out = setShare(start, i, v);
        expect(out.reduce((s, x) => s + x, 0)).toBe(100);
        expect(out.every((x) => x >= 0)).toBe(true);
        expect(out[i]).toBe(Math.min(100, Math.max(0, v)));
        const others = [0, 1, 2].filter((j) => j !== i);
        if (start[others[0]!]! > start[others[1]!]!) expect(out[others[0]!]!).toBeGreaterThanOrEqual(out[others[1]!]!);
      })
    );
    expect(setShare([0, 0, 100], 2, 40)).toEqual([30, 30, 40]);
    expect(setShare([30, 70], 1, 20)).toEqual([80, 20]);
  });
});

describe('generator', () => {
  it('is deterministic by seed and never repeats a template', () => {
    for (const d of DIFFICULTIES) {
      const a = createRound(1234, d);
      expect(createRound(1234, d)).toEqual(a);
      expect(new Set(a.cases.map((c) => c.template)).size).toBe(ROUND_LENGTH);
      expect(isPdState(a)).toBe(true);
    }
    expect(createRound(1, 'easy')).not.toEqual(createRound(2, 'easy'));
  });
  it('respects the grids per difficulty', () => {
    for (let seed = 0; seed < 30; seed++) {
      for (const c of createRound(seed, 'easy').cases) {
        expect(c.priorDen).toBe(10);
        expect(c.clues).toHaveLength(2);
        expect(c.hyps).toBe(2);
      }
      for (const c of createRound(seed, 'medium').cases) {
        expect(c.prior.every((x) => x % 5 === 0)).toBe(true);
        expect(c.clues).toHaveLength(3);
      }
      for (const c of createRound(seed, 'hard').cases) {
        expect(c.clues).toHaveLength(c.hyps === 3 ? 3 : 4);
        const special = c.clues.filter((x) => x.num.every((v) => v === x.num[0]));
        expect(special.length).toBeGreaterThanOrEqual(1);
        expect(c.hyps).toBe(templateById(c.template)!.hyps.length >= 3 ? 3 : 2);
      }
    }
  });
  it('a favoured hypothesis always gets the larger number (two hypotheses)', () => {
    for (let seed = 0; seed < 40; seed++)
      for (const d of DIFFICULTIES)
        for (const c of createRound(seed, d).cases) {
          if (c.hyps !== 2) continue;
          const t = templateById(c.template)!;
          for (const clue of c.clues) {
            const spec = t.clues.find((x) => x.id === clue.id)!;
            if (spec.kind === 'normal') expect(clue.num[spec.fav]!).toBeGreaterThan(clue.num[1 - spec.fav]!);
          }
        }
  });
  it('accepted cases pass the filters, and the filter never sees the truth', () => {
    for (let seed = 0; seed < 20; seed++)
      for (const d of DIFFICULTIES)
        for (const t of eligible(d)) {
          const c = generateCase(seed, t, d);
          const { truth: _truth, answers: _a, draft: _d, kind: _k, attempts, ...evidence } = c;
          if (attempts <= 200) expect(accept(evidence, d)).toBe(true);
          expect(() => accept(c as never, d)).toThrow();
        }
  });
  it('the truth always has positive weight', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 ** 32 - 1 }), fc.constantFrom(...DIFFICULTIES), (seed, d) => {
        for (const c of createRound(seed, d).cases) expect(posteriorAfter(c, c.clues.length)[c.truth]!.n > 0n).toBe(true);
      }),
      { numRuns: 30 }
    );
  });
});

describe('transitions and validation', () => {
  type Action = { kind: 'draft'; v: number } | { kind: 'share'; i: number; v: number } | { kind: 'commit'; skip: boolean } | { kind: 'reset' } | { kind: 'next' };
  const action: fc.Arbitrary<Action> = fc.oneof(
    fc.record({ kind: fc.constant('draft' as const), v: fc.integer({ min: -5, max: 105 }) }),
    fc.record({ kind: fc.constant('share' as const), i: fc.integer({ min: -1, max: 3 }), v: fc.integer({ min: -5, max: 105 }) }),
    fc.record({ kind: fc.constant('commit' as const), skip: fc.boolean() }),
    fc.constant({ kind: 'reset' as const }),
    fc.constant({ kind: 'next' as const })
  );
  const apply = (s: PdState, a: Action): PdState => {
    switch (a.kind) {
      case 'draft': {
        const c = s.cases[s.index];
        return c ? setDraft(s, c.hyps === 2 ? [a.v, 100 - a.v] : [a.v, 0, 100 - a.v]) : s;
      }
      case 'share':
        return shareDraft(s, a.i, a.v);
      case 'commit':
        return commitStep(s, a.skip);
      case 'reset':
        return resetDraft(s);
      case 'next':
        return markReported(nextCase(s));
    }
  };
  it('random action sequences keep the state valid', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 ** 32 - 1 }), fc.constantFrom(...DIFFICULTIES), fc.array(action, { maxLength: 60 }), (seed, d, actions) => {
        let s = createRound(seed, d);
        for (const a of actions) {
          s = apply(s, a);
          expect(isPdState(s)).toBe(true);
          expect(isPdState(JSON.parse(JSON.stringify(s)))).toBe(true);
        }
      }),
      { numRuns: 60 }
    );
  });
  it('commit is a no-op in review; next only after the review; reported flips once at the end', () => {
    let s = createRound(7, 'easy');
    expect(nextCase(s)).toBe(s);
    s = commitStep(s);
    s = commitStep(s, true);
    expect(isReview(s.cases[0]!)).toBe(true);
    expect(commitStep(s)).toBe(s);
    expect(markReported(s)).toBe(s);
    for (let i = 0; i < ROUND_LENGTH; i++) {
      while (!isReview(s.cases[s.index]!)) s = commitStep(s);
      s = nextCase(s);
    }
    expect(s.index).toBe(ROUND_LENGTH);
    const r = markReported(s);
    expect(r.reported).toBe(true);
    expect(markReported(r)).toBe(r);
    expect(isPdState(r)).toBe(true);
    const again = restartRound(r);
    expect(again.index).toBe(0);
    expect(again.cases.every((c) => c.answers.length === 0)).toBe(true);
    expect(isPdState(again)).toBe(true);
  });
  it('the draft of a new step starts at the previous belief', () => {
    let s = createRound(9, 'medium');
    s = setDraft(s, [42, 58]);
    s = commitStep(s);
    expect(s.cases[0]!.draft).toEqual([42, 58]);
    s = commitStep(s, true);
    expect(s.cases[0]!.draft).toEqual(roundPercents(posteriorAfter(s.cases[0]!, 2)));
  });
  it('isValidState never throws and rejects tampered saves', () => {
    fc.assert(fc.property(fc.anything(), (x) => isPdState(x) === false || isPdState(x) === true));
    const s = createRound(5, 'easy');
    const tamper = (f: (x: PdState) => void) => {
      const x = JSON.parse(JSON.stringify(s)) as PdState;
      f(x);
      return isPdState(x);
    };
    expect(tamper(() => undefined)).toBe(true);
    expect(tamper((x) => (x.cases[0]!.prior[0]! += 1))).toBe(false);
    expect(tamper((x) => (x.cases[0]!.clues[0]!.num[0] = 11))).toBe(false);
    expect(tamper((x) => (x.cases[0]!.clues[0]!.id = 'nope'))).toBe(false);
    expect(tamper((x) => (x.cases[0]!.clues[1]!.id = x.cases[0]!.clues[0]!.id))).toBe(false);
    expect(tamper((x) => (x.cases[0]!.draft = [50, 51]))).toBe(false);
    expect(tamper((x) => (x.cases[0]!.template = 'c-unknown'))).toBe(false);
    expect(tamper((x) => (x.cases[1]!.template = x.cases[0]!.template))).toBe(false);
    expect(tamper((x) => (x.reported = true))).toBe(false);
    expect(tamper((x) => (x.index = 2))).toBe(false);
    expect(tamper((x) => x.cases.pop())).toBe(false);
    expect(tamper((x) => (x.cases[0]!.answers = [[50, 50], [50, 50], [50, 50]]))).toBe(false);
    expect(
      tamper((x) => {
        // A truth with zero weight under the stored results.
        const c = x.cases[0]!;
        c.clues[0]!.num = c.clues[0]!.result === 1 ? [0, 5] : [10, 5];
        c.truth = 0;
      })
    ).toBe(false);
    expect(tamper((x) => ((x as { v: number }).v = 2))).toBe(false);
  });
  it('settingsOf reports the difficulty', () => {
    for (const d of DIFFICULTIES) expect(settingsOf(createRound(1, d))).toEqual({ difficulty: d });
  });
});

describe('summary and notebook', () => {
  it('counts closeness and picks the base-rate tip first', () => {
    let s = createRound(11, 'easy');
    for (let i = 0; i < ROUND_LENGTH; i++) {
      const c = s.cases[s.index]!;
      s = setDraft(s, roundPercents(posteriorAfter(c, 1)));
      s = commitStep(s);
      s = setDraft(s, roundPercents(posteriorAfter(c, 2)));
      s = commitStep(s);
      s = nextCase(s);
    }
    const sum = summarize(s);
    expect(sum.scored).toBe(ROUND_LENGTH);
    expect(sum.veryClose).toBe(ROUND_LENGTH);
    expect(sum.baseRateCases).toBe(0);
    expect(sum.forecastAvg).not.toBeNull();
    expect(['general', 'conservative', 'overreach']).toContain(sum.tip);
  });
  it('the notebook keeps the last 400 entries, reads damaged values as empty and bins by tenths', () => {
    expect(readNotebook('x')).toEqual([]);
    expect(readNotebook([[50, 1], [101, 0], ['a', 1], [20, 2], [30, 0]])).toEqual([[50, 1], [30, 0]]);
    const many = notebookAdd(Array.from({ length: 399 }, () => [10, 0] as [number, 0]), [[90, 1], [10, 0]]);
    expect(many).toHaveLength(400);
    expect(many.at(-2)).toEqual([90, 1]);
    expect(notebookBins([[0, 0], [9, 1], [10, 1], [100, 1]])).toEqual([
      { centre: 5, count: 2, hits: 1 },
      { centre: 15, count: 1, hits: 1 },
      { centre: 95, count: 1, hits: 1 }
    ]);
    let s = createRound(3, 'easy');
    expect(caseNotes(s.cases[0]!)).toEqual([]);
    s = commitStep(commitStep(s));
    const c = s.cases[0]!;
    expect(caseNotes(c)).toEqual(c.draft.length ? (c.answers[1] as number[]).map((b, h) => [b, h === c.truth ? 1 : 0]) : []);
  });
  it('every template has at least four informative clues and one neutral clue', () => {
    for (const t of CLUE_TEMPLATES) {
      expect(t.clues.filter((c) => c.kind === 'normal').length).toBeGreaterThanOrEqual(4);
      expect(t.clues.filter((c) => c.kind === 'neutral')).toHaveLength(1);
    }
  });
});
