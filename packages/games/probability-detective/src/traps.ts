/**
 * Trap templates of mode "Thinking traps" (design § 8, content doc § 5). Pure and language-neutral: each template
 * draws integer parameters from its grid, validates them (also for `isValidState`), and derives its questions with the
 * exact answers, the numbers for the story placeholders and the data of its explanation visual. Texts live in
 * `content/<locale>.ts` under `traps[id]`.
 */
import type { Rng } from '@wp/game-core';
import { ONE, cmp, frac, mul, sub, type Frac } from './frac';
import type { Difficulty } from './templates';

/** A number for a text placeholder; the view formats it per locale. */
export type Token =
  | { readonly t: 'int'; readonly v: number }
  /** A stated share num/den: "3 in 10", "1 in 50" or a percent (as the clue rows). */
  | { readonly t: 'share'; readonly num: number; readonly den: number }
  | { readonly t: 'pct'; readonly v: Frac }
  /** A coin sequence (1 = heads ●, 0 = tails ○). */
  | { readonly t: 'seq'; readonly bits: readonly number[] };

export type TrapQuestion =
  | { readonly id: string; readonly kind: 'choice'; readonly options: readonly string[]; readonly correct: number }
  | { readonly id: string; readonly kind: 'count'; readonly values: readonly number[]; readonly correct: number }
  | { readonly id: string; readonly kind: 'prob'; readonly exact: Frac };

export type ExplainSpec =
  /** Natural frequencies: of `total` imagined cases, each group's count and how many of them fit (`fit`). */
  | { readonly kind: 'board'; readonly total: number; readonly groups: readonly { readonly id: string; readonly count: number; readonly fit: number }[] }
  /** Two dice: the 6 × 6 outcomes with the two sums marked. */
  | { readonly kind: 'grid'; readonly sums: readonly [number, number] }
  /** A table: rows × columns of tokens; `best` marks the better column per row (Simpson). */
  | {
      readonly kind: 'table';
      readonly cols: readonly string[];
      readonly rows: readonly { readonly id: string; readonly cells: readonly Token[]; readonly best?: number }[];
    }
  /** Exact distributions (share of days per count) with the tail beyond `cut` (strictly greater). */
  | { readonly kind: 'bars'; readonly series: readonly { readonly n: number; readonly cut: number; readonly dist: readonly Frac[]; readonly tail: Frac }[] }
  /** Rows of outcomes (1 hit, 0 miss, −1 the open next one) with the chance of the row. */
  | { readonly kind: 'sequence'; readonly rows: readonly { readonly id: string; readonly bits: readonly number[]; readonly p: Frac }[] }
  /** A running product, one share per step. */
  | { readonly kind: 'product'; readonly steps: readonly Frac[] };

export interface TrapTemplate {
  readonly id: string;
  readonly levels: readonly Difficulty[];
  draw(rng: Rng, difficulty: Difficulty): number[];
  valid(params: readonly number[], difficulty: Difficulty): boolean;
  questions(params: readonly number[]): readonly TrapQuestion[];
  /** Numbers for the placeholders of the story, the questions and their options. */
  tokens(params: readonly number[]): Readonly<Record<string, Token>>;
  explain(params: readonly number[]): ExplainSpec;
  /** Numbers for the placeholders of the explanation text. */
  explainTokens(params: readonly number[]): Readonly<Record<string, Token>>;
  readonly retired?: boolean;
}

const ALL: readonly Difficulty[] = ['easy', 'medium', 'hard'];
const MH: readonly Difficulty[] = ['medium', 'hard'];
const range = (lo: number, hi: number, step = 1): number[] => {
  const out: number[] = [];
  for (let x = lo; x <= hi; x += step) out.push(x);
  return out;
};
const isIntIn = (x: unknown, lo: number, hi: number): x is number => typeof x === 'number' && Number.isInteger(x) && x >= lo && x <= hi;
const oneOf = (x: number | undefined, values: readonly number[]) => x !== undefined && values.includes(x);
const int = (v: number): Token => ({ t: 'int', v });
const share = (num: number, den: number): Token => ({ t: 'share', num, den });
const pct = (v: Frac): Token => ({ t: 'pct', v });
const choice = (id: string, options: readonly string[], correct: number): TrapQuestion => ({ id, kind: 'choice', options, correct });
const prob = (id: string, exact: Frac): TrapQuestion => ({ id, kind: 'prob', exact });
const pow = (f: Frac, k: number): Frac => {
  let r = ONE;
  for (let i = 0; i < k; i++) r = mul(r, f);
  return r;
};
/** Binomial coefficient (multiplicative formula, BigInt). */
export function choose(n: number, k: number): bigint {
  if (k < 0 || k > n) return 0n;
  let r = 1n;
  for (let i = 1; i <= k; i++) r = (r * BigInt(n - k + i)) / BigInt(i);
  return r;
}
/** P(X > cut) for X ~ Binomial(n, 1/2), exactly. */
export function binomialTail(n: number, cut: number): Frac {
  let s = 0n;
  for (let k = Math.floor(cut) + 1; k <= n; k++) s += choose(n, k);
  return frac(s, 2n ** BigInt(n));
}
/** The smallest power of ten (≤ 10⁷) at which every product count/den is a whole number. */
function population(parts: readonly [number, number][]): number {
  for (let m = 10; m <= 10_000_000; m *= 10) if (parts.every(([num, den]) => (m * num) % den === 0)) return m;
  return 10_000_000;
}

/* ---------- T1 The lamp sensor (base-rate neglect) ---------- */

const SENSOR = {
  easy: { fDen: 10, f: [1, 2], den: 10, s: [8, 9], q: [1, 2] },
  medium: { fDen: 100, f: [2, 5, 10], den: 100, s: [80, 90, 95], q: [5, 10, 20] },
  hard: { fDen: 1000, f: [5, 10, 20], den: 100, s: range(90, 99), q: range(2, 10) }
} as const;
const sensorWeights = ([f, fDen, s, q]: readonly number[]): [number, number] => [f! * s!, (fDen! - f!) * q!];

const tSensor: TrapTemplate = {
  id: 't-sensor',
  levels: ALL,
  draw(rng, d) {
    const g = SENSOR[d];
    for (;;) {
      const p = [rng.pick(g.f), g.fDen, rng.pick(g.s), rng.pick(g.q), g.den, rng.int(100, 999)];
      // A tie ("equally likely") would make the first question ambiguous.
      const [a, b] = sensorWeights(p);
      if (a !== b) return p;
    }
  },
  valid(p, d) {
    const g = SENSOR[d];
    if (p.length !== 6 || p[1] !== g.fDen || p[4] !== g.den || !oneOf(p[0], g.f) || !oneOf(p[2], g.s) || !oneOf(p[3], g.q) || !isIntIn(p[5], 100, 999)) return false;
    const [a, b] = sensorWeights(p);
    return a !== b;
  },
  questions(p) {
    const [a, b] = sensorWeights(p);
    return [choice('q1', ['faulty', 'working'], a > b ? 0 : 1), prob('q2', frac(a, a + b))];
  },
  tokens: (p) => ({ f: share(p[0]!, p[1]!), s: share(p[2]!, p[4]!), q: share(p[3]!, p[4]!), lamp: int(p[5]!) }),
  explain(p) {
    const [f, fDen, s, q, den] = p as [number, number, number, number, number];
    const m = population([[f, fDen], [f * s, fDen * den], [(fDen - f) * q, fDen * den]]);
    const faulty = (m * f) / fDen;
    return {
      kind: 'board',
      total: m,
      groups: [
        { id: 'faulty', count: faulty, fit: (faulty * s) / den },
        { id: 'working', count: m - faulty, fit: ((m - faulty) * q) / den }
      ]
    };
  },
  explainTokens(p) {
    const spec = tSensor.explain(p) as Extract<ExplainSpec, { kind: 'board' }>;
    const [a, b] = spec.groups as unknown as [{ fit: number }, { fit: number }];
    return { k: int(a.fit), n: int(a.fit + b.fit), p: pct(frac(a.fit, a.fit + b.fit)) };
  }
};

/* ---------- T2 The spinner (gambler's fallacy) ---------- */

const tWheel: TrapTemplate = {
  id: 't-wheel',
  levels: ALL,
  draw(rng, d) {
    const k = rng.pick([3, 4, 5, 6, 8]);
    return [k, rng.int(1, k - 1), rng.int(4, d === 'easy' ? 5 : 7)];
  },
  valid: (p, d) => p.length === 3 && oneOf(p[0], [3, 4, 5, 6, 8]) && isIntIn(p[1], 1, p[0]! - 1) && isIntIn(p[2], 4, d === 'easy' ? 5 : 7),
  questions: (p) => [choice('q1', ['more', 'less', 'same'], 2), prob('q2', frac(p[1]!, p[0]!))],
  tokens: (p) => ({ k: int(p[0]!), r: int(p[1]!), s: int(p[2]!) }),
  explain: (p) => ({ kind: 'sequence', rows: [{ id: 'spins', bits: [...Array(p[2]!).fill(0), -1], p: frac(p[1]!, p[0]!) }] }),
  explainTokens: (p) => ({ p: pct(frac(p[1]!, p[0]!)) })
};

/* ---------- T3 Which sequence is more likely? (representativeness) ---------- */

const bitsOf = (mask: number, n: number): number[] => Array.from({ length: n }, (_, i) => (mask >> (n - 1 - i)) & 1);
const changes = (bits: readonly number[]) => bits.slice(1).filter((b, i) => b !== bits[i]).length;
const mixedEnough = (bits: readonly number[]) => changes(bits) >= 2 && changes(bits) < bits.length - 1;

const tSequence: TrapTemplate = {
  id: 't-sequence',
  levels: ALL,
  draw(rng, d) {
    const n = rng.pick(d === 'easy' ? [5, 6] : [6, 8]);
    for (;;) {
      const mask = rng.int(0, 2 ** n - 1);
      if (mixedEnough(bitsOf(mask, n))) return [n, mask];
    }
  },
  valid: (p, d) => p.length === 2 && oneOf(p[0], d === 'easy' ? [5, 6] : [6, 8]) && isIntIn(p[1], 0, 2 ** p[0]! - 1) && mixedEnough(bitsOf(p[1]!, p[0]!)),
  questions: (p) => [choice('q1', ['a', 'b', 'same'], 2), prob('q2', frac(1, 2 ** p[0]!))],
  tokens: (p) => ({ n: int(p[0]!), a: { t: 'seq', bits: Array(p[0]!).fill(1) }, b: { t: 'seq', bits: bitsOf(p[1]!, p[0]!) } }),
  explain: (p) => ({
    kind: 'sequence',
    rows: [
      { id: 'a', bits: Array(p[0]!).fill(1), p: frac(1, 2 ** p[0]!) },
      { id: 'b', bits: bitsOf(p[1]!, p[0]!), p: frac(1, 2 ** p[0]!) }
    ]
  }),
  explainTokens: (p) => ({ total: int(2 ** p[0]!), p: pct(frac(1, 2 ** p[0]!)) })
};

/* ---------- T4 Rain and wind (conjunction) ---------- */

const CONJ = { a: [40, 50, 60, 70, 80], b: [30, 40, 50, 60, 70], w: [10, 20, 30, 40] };
const tConjunction: TrapTemplate = {
  id: 't-conjunction',
  levels: ALL,
  draw: (rng) => [rng.pick(CONJ.a), rng.pick(CONJ.b), rng.pick(CONJ.w)],
  valid: (p) => p.length === 3 && oneOf(p[0], CONJ.a) && oneOf(p[1], CONJ.b) && oneOf(p[2], CONJ.w),
  questions: (p) => [choice('q1', ['windy', 'both', 'same'], 0), prob('q2', frac(p[0]! * p[1]!, 10_000))],
  tokens: (p) => ({ a: share(p[0]!, 100), b: share(p[1]!, 100), w: share(p[2]!, 100) }),
  explain(p) {
    const [a, b, w] = p as [number, number, number];
    const rw = (a * b) / 100;
    const dw = ((100 - a) * w) / 100;
    return { kind: 'table', cols: ['windy', 'calm'], rows: [{ id: 'rainy', cells: [int(rw), int(a - rw)] }, { id: 'dry', cells: [int(dw), int(100 - a - dw)] }] };
  },
  explainTokens(p) {
    const [a, b, w] = p as [number, number, number];
    const rw = (a * b) / 100;
    return { days: int(100), both: int(rw), windy: int(rw + ((100 - a) * w) / 100) };
  }
};

/* ---------- T5 Two delivery services (Simpson's paradox) ---------- */

const simpsonHolds = ([aSn, aSk, aLn, aLk, bSn, bSk, bLn, bLk]: readonly number[]) =>
  aSk! * bSn! > bSk! * aSn! && aLk! * bLn! > bLk! * aLn! && aSk! + aLk! < bSk! + bLk!;

const tSimpson: TrapTemplate = {
  id: 't-simpson',
  levels: MH,
  draw(rng) {
    for (;;) {
      const aSn = rng.pick([10, 20, 25]);
      const bSn = rng.pick([75, 80, 90]);
      const aLn = 100 - aSn;
      const bLn = 100 - bSn;
      const p = [
        aSn,
        rng.int(Math.ceil(aSn * 0.7), aSn),
        aLn,
        rng.int(Math.ceil(aLn * 0.35), Math.floor(aLn * 0.7)),
        bSn,
        rng.int(Math.ceil(bSn * 0.7), bSn),
        bLn,
        rng.int(Math.ceil(bLn * 0.35), Math.floor(bLn * 0.7))
      ];
      if (simpsonHolds(p)) return p;
    }
  },
  valid: (p) =>
    p.length === 8 &&
    oneOf(p[0], [10, 20, 25]) &&
    p[2] === 100 - p[0]! &&
    oneOf(p[4], [75, 80, 90]) &&
    p[6] === 100 - p[4]! &&
    [1, 3, 5, 7].every((i) => isIntIn(p[i], 0, p[i - 1]!)) &&
    simpsonHolds(p),
  questions: () => [choice('q1', ['a', 'b', 'same'], 1), choice('q2', ['a', 'b', 'same'], 0)],
  tokens: (p) => ({ aSk: int(p[1]!), aSn: int(p[0]!), aLk: int(p[3]!), aLn: int(p[2]!), bSk: int(p[5]!), bSn: int(p[4]!), bLk: int(p[7]!), bLn: int(p[6]!) }),
  explain: (p) => ({
    kind: 'table',
    cols: ['a', 'b'],
    rows: [
      { id: 'short', cells: [share(p[1]!, p[0]!), share(p[5]!, p[4]!)], best: 0 },
      { id: 'long', cells: [share(p[3]!, p[2]!), share(p[7]!, p[6]!)], best: 0 },
      { id: 'overall', cells: [share(p[1]! + p[3]!, 100), share(p[5]! + p[7]!, 100)], best: 1 }
    ]
  }),
  explainTokens: (p) => ({ a: int(p[1]! + p[3]!), b: int(p[5]! + p[7]!) })
};

/* ---------- T6 The paw print (confusing the two directions) ---------- */

const PAW = { n: [100, 200, 400, 1000], r: [20, 50, 100, 200] };
const tPaw: TrapTemplate = {
  id: 't-paw',
  levels: MH,
  draw(rng) {
    for (;;) {
      const p = [rng.pick(PAW.n), rng.pick(PAW.r)];
      if (p[1]! <= p[0]! / 2) return p;
    }
  },
  valid: (p) => p.length === 2 && oneOf(p[0], PAW.n) && oneOf(p[1], PAW.r) && p[1]! <= p[0]! / 2,
  questions: (p) => [choice('q1', ['yes', 'no'], 1), prob('q2', frac(p[1]!, p[1]! + p[0]! - 1))],
  tokens: (p) => ({ n: int(p[0]!), r: share(1, p[1]!), sure: pct(sub(ONE, frac(1, p[1]!))) }),
  explain: (p) => ({
    kind: 'board',
    total: p[0]! * p[1]!,
    groups: [
      { id: 'neighbour', count: p[1]!, fit: p[1]! },
      { id: 'others', count: (p[0]! - 1) * p[1]!, fit: p[0]! - 1 }
    ]
  }),
  explainTokens: (p) => ({ n: int(p[0]!), others: int(Math.round((p[0]! - 1) / p[1]!)), p: pct(frac(p[1]!, p[1]! + p[0]! - 1)) })
};

/* ---------- T7 The small and the large bakery (sample size) ---------- */

const BAKERY = { n1: [10, 12, 20], n2: [40, 50, 100], t: [60, 70, 75] };
const dist = (n: number): Frac[] => Array.from({ length: n + 1 }, (_, k) => frac(choose(n, k), 2n ** BigInt(n)));
const cutOf = (n: number, t: number) => (t * n) / 100;
const tBakery: TrapTemplate = {
  id: 't-bakery',
  levels: MH,
  draw: (rng) => [rng.pick(BAKERY.n1), rng.pick(BAKERY.n2), rng.pick(BAKERY.t)],
  valid: (p) => p.length === 3 && oneOf(p[0], BAKERY.n1) && oneOf(p[1], BAKERY.n2) && oneOf(p[2], BAKERY.t),
  questions(p) {
    const small = binomialTail(p[0]!, cutOf(p[0]!, p[2]!));
    const large = binomialTail(p[1]!, cutOf(p[1]!, p[2]!));
    const c = cmp(small, large);
    return [choice('q1', ['small', 'large', 'same'], c > 0 ? 0 : c < 0 ? 1 : 2), prob('q2', small)];
  },
  tokens: (p) => ({ n1: int(p[0]!), n2: int(p[1]!), t: share(p[2]!, 100) }),
  explain: (p) => ({
    kind: 'bars',
    series: [p[0]!, p[1]!].map((n) => ({ n, cut: cutOf(n, p[2]!), dist: dist(n), tail: binomialTail(n, cutOf(n, p[2]!)) }))
  }),
  explainTokens: (p) => ({ small: pct(binomialTail(p[0]!, cutOf(p[0]!, p[2]!))), large: pct(binomialTail(p[1]!, cutOf(p[1]!, p[2]!))) })
};

/* ---------- T8 The helper who knows (drawers) ---------- */

const tDrawers: TrapTemplate = {
  id: 't-drawers',
  levels: MH,
  draw: (rng, d) => [rng.pick(d === 'hard' ? [3, 4, 5] : [3, 4])],
  valid: (p, d) => p.length === 1 && oneOf(p[0], d === 'hard' ? [3, 4, 5] : [3, 4]),
  questions: (p) => [choice('q1', ['switch', 'keep', 'same'], 0), prob('q2', frac(p[0]! - 1, p[0]!))],
  tokens: (p) => ({ n: int(p[0]!), opened: int(p[0]! - 2) }),
  explain: (p) => ({
    kind: 'board',
    total: 100 * p[0]!,
    groups: [
      { id: 'right', count: 100, fit: 0 },
      { id: 'wrong', count: 100 * (p[0]! - 1), fit: 100 * (p[0]! - 1) }
    ]
  }),
  explainTokens: (p) => ({ total: int(100 * p[0]!), wins: int(100 * (p[0]! - 1)), p: pct(frac(p[0]! - 1, p[0]!)) })
};

/* ---------- T9 At least one rainy day ---------- */

const WEEK = { easy: { m: [2, 3], q: [10, 20, 50] }, other: { m: [3, 5, 7, 10], q: [10, 20, 25, 30] } };
const weekGrid = (d: Difficulty) => (d === 'easy' ? WEEK.easy : WEEK.other);
const dryRun = (m: number, q: number): Frac[] => Array.from({ length: m }, (_, i) => pow(frac(100 - q, 100), i + 1));
const tWeek: TrapTemplate = {
  id: 't-week',
  levels: ALL,
  draw: (rng, d) => [rng.pick(weekGrid(d).m), rng.pick(weekGrid(d).q)],
  valid: (p, d) => p.length === 2 && oneOf(p[0], weekGrid(d).m) && oneOf(p[1], weekGrid(d).q),
  questions: (p) => [prob('q1', sub(ONE, pow(frac(100 - p[1]!, 100), p[0]!)))],
  tokens: (p) => ({ m: int(p[0]!), q: share(p[1]!, 100) }),
  explain: (p) => ({ kind: 'product', steps: dryRun(p[0]!, p[1]!) }),
  explainTokens: (p) => {
    const none = pow(frac(100 - p[1]!, 100), p[0]!);
    return { none: pct(none), p: pct(sub(ONE, none)), sum: share(p[0]! * p[1]!, 100) };
  }
};

/* ---------- T10 Two people, the same number (coincidence) ---------- */

/** P(all g picks from 1..R differ) = Π (R − i)/R. */
export const allDifferent = (g: number, r: number): Frac => {
  let p = ONE;
  for (let i = 0; i < g; i++) p = mul(p, frac(r - i, r));
  return p;
};
const NUMBERS = { medium: { r: [100], g: [5, 8, 10, 12, 15] }, hard: { r: [100, 365], g: [10, 12, 15, 20, 23, 30] } };
const numbersGrid = (d: Difficulty) => (d === 'hard' ? NUMBERS.hard : NUMBERS.medium);
const binOf = (p: Frac): number => (cmp(p, frac(1, 4)) < 0 ? 0 : cmp(p, frac(3, 4)) > 0 ? 2 : 1);
const nearEdge = (p: Frac) => [frac(1, 4), frac(3, 4)].some((e) => {
  const d = sub(p, e);
  return cmp(d.n < 0n ? frac(-d.n, d.d) : d, frac(3, 100)) <= 0;
});
const match = (p: readonly number[]) => sub(ONE, allDifferent(p[0]!, p[1]!));
const tNumbers: TrapTemplate = {
  id: 't-numbers',
  levels: MH,
  draw(rng, d) {
    for (;;) {
      const p = [rng.pick(numbersGrid(d).g), rng.pick(numbersGrid(d).r)];
      if (!nearEdge(match(p))) return p;
    }
  },
  valid: (p, d) => p.length === 2 && oneOf(p[0], numbersGrid(d).g) && oneOf(p[1], numbersGrid(d).r) && !nearEdge(match(p)),
  questions: (p) => [choice('q1', ['low', 'even', 'high'], binOf(match(p))), prob('q2', match(p))],
  tokens: (p) => ({ g: int(p[0]!), r: int(p[1]!) }),
  explain: (p) => ({ kind: 'product', steps: Array.from({ length: p[0]! }, (_, i) => allDifferent(i + 1, p[1]!)) }),
  explainTokens: (p) => ({ pairs: int((p[0]! * (p[0]! - 1)) / 2), g: int(p[0]!), p: pct(match(p)) })
};

/* ---------- T11 Fewer punctures (relative versus absolute) ---------- */

const tyreValues = (b: number, a: number): number[] => {
  const rel = ((b - a) * 100) / b;
  return [(b - a) * 10, rel, rel * 10, b - a];
};
const TYRES = { easy: [2, 4, 6, 8], hard: [4, 8] };
const tTyres: TrapTemplate = {
  id: 't-tyres',
  levels: ALL,
  draw(rng, d) {
    const b = rng.pick(d === 'hard' ? TYRES.hard : TYRES.easy);
    const a = d === 'hard' ? (3 * b) / 4 : b / 2;
    return [b, a, ...rng.shuffle(tyreValues(b, a))];
  },
  valid(p, d) {
    if (p.length !== 6 || !oneOf(p[0], d === 'hard' ? TYRES.hard : TYRES.easy)) return false;
    const b = p[0]!;
    if (p[1] !== (d === 'hard' ? (3 * b) / 4 : b / 2)) return false;
    const want = tyreValues(b, p[1]!);
    const got = p.slice(2);
    return new Set(want).size === 4 && [...want].sort((x, y) => x - y).join() === [...got].sort((x, y) => x - y).join();
  },
  questions: (p) => [{ id: 'q1', kind: 'count', values: p.slice(2), correct: p.slice(2).indexOf((p[0]! - p[1]!) * 10) }],
  tokens: (p) => ({ b: int(p[0]!), a: int(p[1]!), rel: pct(frac(p[0]! - p[1]!, p[0]!)), rides: int(1000) }),
  explain: (p) => ({
    kind: 'board',
    total: 1000,
    groups: [
      { id: 'old', count: 1000, fit: p[0]! * 10 },
      { id: 'new', count: 1000, fit: p[1]! * 10 }
    ]
  }),
  explainTokens: (p) => ({ rides: int(1000), old: int(p[0]! * 10), new: int(p[1]! * 10), fewer: int((p[0]! - p[1]!) * 10), rel: pct(frac(p[0]! - p[1]!, p[0]!)) })
};

/* ---------- T12 Two dice ---------- */

export const diceCount = (s: number): number => 6 - Math.abs(s - 7);
const diceOk = (s1: number, s2: number, d: Difficulty) => s1 < s2 && (d !== 'easy' || Math.abs(diceCount(s1) - diceCount(s2)) >= 2);
const tDice: TrapTemplate = {
  id: 't-dice',
  levels: ALL,
  draw(rng, d) {
    for (;;) {
      const s1 = rng.int(2, 11);
      const s2 = rng.int(s1 + 1, 12);
      if (diceOk(s1, s2, d)) return [s1, s2];
    }
  },
  valid: (p, d) => p.length === 2 && isIntIn(p[0], 2, 12) && isIntIn(p[1], 2, 12) && diceOk(p[0]!, p[1]!, d),
  questions(p) {
    const c1 = diceCount(p[0]!);
    const c2 = diceCount(p[1]!);
    return [choice('q1', ['first', 'second', 'same'], c1 > c2 ? 0 : c1 < c2 ? 1 : 2), prob('q2', frac(c1, 36))];
  },
  tokens: (p) => ({ s1: int(p[0]!), s2: int(p[1]!) }),
  explain: (p) => ({ kind: 'grid', sums: [p[0]!, p[1]!] }),
  explainTokens: (p) => ({ c1: int(diceCount(p[0]!)), c2: int(diceCount(p[1]!)), s1: int(p[0]!), s2: int(p[1]!) })
};

export const TRAP_TEMPLATES: readonly TrapTemplate[] = [tSensor, tWheel, tSequence, tConjunction, tSimpson, tPaw, tBakery, tDrawers, tWeek, tNumbers, tTyres, tDice];

const TRAPS_BY_ID: ReadonlyMap<string, TrapTemplate> = new Map(TRAP_TEMPLATES.map((t) => [t.id, t]));
export const trapById = (id: string): TrapTemplate | undefined => (typeof id === 'string' ? TRAPS_BY_ID.get(id) : undefined);

/** Never throws: a template's `valid` on untrusted input. */
export function trapValid(t: TrapTemplate, params: unknown, difficulty: Difficulty): params is number[] {
  try {
    return Array.isArray(params) && params.length <= 12 && params.every((x) => typeof x === 'number' && Number.isInteger(x)) && t.levels.includes(difficulty) && t.valid(params, difficulty);
  } catch {
    return false;
  }
}

