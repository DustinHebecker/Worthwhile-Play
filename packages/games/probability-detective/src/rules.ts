/**
 * Probability Detective: pure rules (design § 6, § 9, § 10, § 12, § 14). No DOM, no clock, no `Math.random`.
 *
 * The state holds integers only; exact probabilities are recomputed on demand as BigInt fractions.
 */
import { isArrayOf, isInt, isOneOf, isRecord, isUint32, type Rng } from '@wp/game-core';
import { DIFFICULTIES, clueSpec, hypsFor, templateById, type Difficulty } from './templates';

export type { Difficulty } from './templates';

/* ---------- Exact fractions (BigInt, always reduced, d > 0) ---------- */

export interface Frac {
  readonly n: bigint;
  readonly d: bigint;
}

const babs = (x: bigint): bigint => (x < 0n ? -x : x);
export const gcd = (a: bigint, b: bigint): bigint => {
  let x = babs(a);
  let y = babs(b);
  while (y) [x, y] = [y, x % y];
  return x;
};

export function frac(n: bigint | number, d: bigint | number = 1n): Frac {
  let nn = BigInt(n);
  let dd = BigInt(d);
  if (dd === 0n) throw new RangeError('zero denominator');
  if (dd < 0n) {
    nn = -nn;
    dd = -dd;
  }
  const g = gcd(nn, dd) || 1n;
  return { n: nn / g, d: dd / g };
}

export const add = (a: Frac, b: Frac): Frac => frac(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Frac, b: Frac): Frac => frac(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Frac, b: Frac): Frac => frac(a.n * b.n, a.d * b.d);
export const div = (a: Frac, b: Frac): Frac => frac(a.n * b.d, a.d * b.n);
export const cmp = (a: Frac, b: Frac): number => {
  const x = a.n * b.d - b.n * a.d;
  return x < 0n ? -1 : x > 0n ? 1 : 0;
};
export const toNumber = (a: Frac): number => Number(a.n) / Number(a.d);
export const ZERO = frac(0);
export const ONE = frac(1);

/** Weights → exact probabilities summing to exactly 1 (all-zero weights give an even split). */
export function normalise(weights: readonly (bigint | number)[]): Frac[] {
  const w = weights.map((x) => BigInt(x));
  const total = w.reduce((s, x) => s + x, 0n);
  if (total === 0n) return w.map(() => frac(1, w.length));
  return w.map((x) => frac(x, total));
}

/* ---------- Exact draws (design § 9.2) ---------- */

const TWO32 = 0x1_0000_0000;
const word = (rng: Rng): number => Math.floor(rng.next() * TWO32) >>> 0;

/** A uniform integer in [0, total) by rejection sampling on 32-bit words (53 bits above 2³²). */
export function uniformBelow(total: number, rng: Rng): number {
  if (!Number.isSafeInteger(total) || total < 1) throw new RangeError('total must be a positive safe integer');
  if (total <= TWO32) {
    const limit = Math.floor(TWO32 / total) * total;
    for (;;) {
      const x = word(rng);
      if (x < limit) return x % total;
    }
  }
  const span = 2 ** 53;
  const limit = Math.floor(span / total) * total;
  for (;;) {
    const x = (word(rng) & 0x1f_ffff) * TWO32 + word(rng);
    if (x < limit) return x % total;
  }
}

/** Index i with probability weights[i] / Σ weights, exactly. Weights are non-negative integers, not all 0. */
export function drawIndex(weights: readonly number[], rng: Rng): number {
  const total = weights.reduce((s, x) => s + x, 0);
  const u = uniformBelow(total, rng);
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i]!;
    if (u < acc) return i;
  }
  return weights.length - 1;
}

/* ---------- Cases and the posterior chain (design § 6.2) ---------- */

export interface Clue {
  id: string;
  den: number;
  num: number[];
  result: 0 | 1;
}

/** The evidence of a clue case: everything except the truth (what the filters may read). */
export interface ClueEvidence {
  template: string;
  hyps: number;
  priorDen: number;
  prior: number[];
  clues: Clue[];
}

export type Belief = number[];
export type Answer = Belief | 'skip';

export interface ClueCase extends ClueEvidence {
  kind: 'clues';
  truth: number;
  /** Committed steps, one per revealed clue; the review starts when every clue is answered. */
  answers: Answer[];
  /** Belief being edited for the current step. */
  draft: Belief;
}

/** Likelihood of a clue's observed result under each hypothesis (numerators over `den`). */
export const likelihood = (clue: Clue): number[] => clue.num.map((x) => (clue.result === 1 ? x : clue.den - x));

/** Unnormalised weights after k clues: prior[h] · Π L_j[h]. */
export function weightsAfter(c: ClueEvidence, k: number): bigint[] {
  const w = c.prior.map((x) => BigInt(x));
  for (const clue of c.clues.slice(0, k)) {
    const l = likelihood(clue);
    for (let h = 0; h < w.length; h++) w[h] = w[h]! * BigInt(l[h]!);
  }
  return w;
}

/** Exact posterior after k clues (k = 0: the base rate). */
export const posteriorAfter = (c: ClueEvidence, k: number): Frac[] => normalise(weightsAfter(c, k));

/** Every step: [base rate, after clue 1, …, after clue n]. */
export const posteriors = (c: ClueEvidence): Frac[][] => Array.from({ length: c.clues.length + 1 }, (_, k) => posteriorAfter(c, k));

/** Weights reduced by their gcd (the evidence chain's small integers). */
export function reduced(w: readonly bigint[]): bigint[] {
  const g = w.reduce((s, x) => gcd(s, x), 0n);
  return g === 0n ? [...w] : w.map((x) => x / g);
}

/** Integer percentages with Σ = 100 by largest remainder (ties to the lower index). */
export function roundPercents(p: readonly Frac[]): Belief {
  const scaled = p.map((x) => frac(x.n * 100n, x.d));
  const floors = scaled.map((x) => Number(x.n / x.d));
  let rest = 100 - floors.reduce((s, x) => s + x, 0);
  const order = scaled.map((x, i) => ({ i, r: sub(x, frac(floors[i]!)) })).sort((a, b) => cmp(b.r, a.r) || a.i - b.i);
  for (const { i } of order) {
    if (rest <= 0) break;
    floors[i]! += 1;
    rest--;
  }
  return floors;
}

/** Belief as exact fractions. */
export const beliefFrac = (b: Belief): Frac[] => b.map((x) => frac(x, 100));

/* ---------- Belief editing (design § 12) ---------- */

/** Largest-remainder split of `total` in proportion to `weights` (equal split when all are 0). */
function apportion(total: number, weights: readonly number[]): number[] {
  const sum = weights.reduce((s, x) => s + x, 0);
  const w = sum === 0 ? weights.map(() => 1) : weights;
  const ws = w.reduce((s, x) => s + x, 0);
  const exact = w.map((x) => (x * total) / ws);
  const out = exact.map((x) => Math.floor(x));
  let rest = total - out.reduce((s, x) => s + x, 0);
  const order = exact.map((x, i) => ({ i, r: x - Math.floor(x) })).sort((a, b) => b.r - a.r || a.i - b.i);
  for (const { i } of order) {
    if (rest <= 0) break;
    out[i]! += 1;
    rest--;
  }
  return out;
}

/** Hypothesis i takes v; the rest is shared by the others in proportion to their current values. */
export function setShare(b: Belief, i: number, v: number): Belief {
  const value = Math.min(100, Math.max(0, Math.round(v)));
  if (b.length === 2) return i === 0 ? [value, 100 - value] : [100 - value, value];
  const others = b.map((x, j) => ({ x, j })).filter((o) => o.j !== i);
  const split = apportion(100 - value, others.map((o) => o.x));
  const out = [...b];
  out[i] = value;
  others.forEach((o, k) => (out[o.j] = split[k]!));
  return out;
}

export const evenly = (hyps: number): Belief => (hyps === 2 ? [50, 50] : [34, 33, 33]);

export const isBelief = (x: unknown, hyps: number): x is Belief =>
  isArrayOf(x, (v): v is number => isInt(v, 0, 100), hyps) && (x as number[]).reduce((s, v) => s + v, 0) === 100;

/* ---------- Scoring and feedback (design § 10) ---------- */

/** Total variation distance in percentage points (exact). */
export function gapPp(b: readonly Frac[], p: readonly Frac[]): Frac {
  let s = ZERO;
  for (let h = 0; h < p.length; h++) {
    const d = sub(b[h]!, p[h]!);
    s = add(s, d.n < 0n ? frac(-d.n, d.d) : d);
  }
  return mul(s, frac(50));
}

export type Band = 'spot' | 'close' | 'off' | 'far';
export function bandOf(gap: Frac): Band {
  if (cmp(gap, frac(5)) <= 0) return 'spot';
  if (cmp(gap, frac(12)) <= 0) return 'close';
  if (cmp(gap, frac(25)) <= 0) return 'off';
  return 'far';
}

/** What a clue justified from a previous belief: normalise(prev[h] · L[h]). */
export function justified(prev: readonly Frac[], clue: Clue): Frac[] {
  const l = likelihood(clue);
  const w = prev.map((p, h) => mul(p, frac(l[h]!)));
  const total = w.reduce(add, ZERO);
  if (total.n === 0n) return [...prev];
  return w.map((x) => div(x, total));
}

export type Movement =
  | { kind: 'neutral'; stayed: boolean; moved: number }
  | { kind: 'decisive'; excluded: number; ok: boolean }
  | { kind: 'ratio'; r: number; cls: 'other' | 'muchLess' | 'less' | 'right' | 'further' | 'muchFurther' }
  | { kind: 'three'; target: Frac[]; band: Band };

export function ratioClass(r: number): Extract<Movement, { kind: 'ratio' }>['cls'] {
  if (r < 0) return 'other';
  if (r < 0.5) return 'muchLess';
  if (r < 0.8) return 'less';
  if (r <= 1.25) return 'right';
  if (r <= 2) return 'further';
  return 'muchFurther';
}

const clampP = (x: number) => Math.min(Math.max(x, 0.005), 0.995);
const logit = (x: number) => Math.log(x / (1 - x));

/** How far the belief moved compared with what the clue justified from `prev` (design § 10.2). */
export function movement(prev: readonly Frac[], b: Belief, clue: Clue): Movement {
  const l = likelihood(clue);
  const bf = beliefFrac(b);
  if (l.every((x) => x === l[0])) {
    const moved = Math.round(toNumber(gapPp(bf, prev)));
    return { kind: 'neutral', stayed: cmp(gapPp(bf, prev), frac(2)) <= 0, moved };
  }
  if (prev.length === 2) {
    const zero = l.indexOf(0);
    if (zero >= 0) return { kind: 'decisive', excluded: zero, ok: b[zero]! <= 2 };
    const m = logit(clampP(b[0]! / 100)) - logit(clampP(toNumber(prev[0]!)));
    const j = Math.log(l[0]! / l[1]!);
    const r = m / j;
    return { kind: 'ratio', r, cls: ratioClass(r) };
  }
  const target = justified(prev, clue);
  return { kind: 'three', target, band: bandOf(gapPp(bf, target)) };
}

/** The base-rate neglect flag at step 1 (design § 10.2). */
export function baseRateFlag(c: ClueEvidence, b1: Belief): boolean {
  const n = normalise(likelihood(c.clues[0]!));
  const p1 = posteriorAfter(c, 1);
  const bf = beliefFrac(b1);
  return cmp(gapPp(n, p1), frac(10)) >= 0 && cmp(gapPp(bf, n), gapPp(bf, p1)) < 0;
}

/** Forecast score 0…100 from the Brier score (design § 10.3); exact before rounding. */
export function forecastExact(p: readonly Frac[], truth: number): Frac {
  let brier = ZERO;
  for (let h = 0; h < p.length; h++) {
    const d = sub(p[h]!, h === truth ? ONE : ZERO);
    brier = add(brier, mul(d, d));
  }
  return mul(frac(100), sub(ONE, div(brier, frac(2))));
}
export const forecastScore = (b: Belief, truth: number): number => Math.round(toNumber(forecastExact(beliefFrac(b), truth)));

/* ---------- Counting board (design § 11.1) ---------- */

export interface Board {
  /** Population M = 10^k. */
  population: number;
  /** Counts per hypothesis: [after base rate, after clue 1, …] for as many steps as stay integral. */
  levels: bigint[][];
}

export function countingBoard(c: ClueEvidence, maxPopulation = 100_000): Board | null {
  for (let m = 10; m <= maxPopulation; m *= 10) {
    const levels: bigint[][] = [];
    let den = BigInt(c.priorDen);
    let w = c.prior.map((x) => BigInt(x));
    const at = (): bigint[] | null => (w.every((x) => (x * BigInt(m)) % den === 0n) ? w.map((x) => (x * BigInt(m)) / den) : null);
    const base = at();
    if (!base) continue;
    levels.push(base);
    for (const clue of c.clues) {
      const l = likelihood(clue);
      w = w.map((x, h) => x * BigInt(l[h]!));
      den *= BigInt(clue.den);
      const next = at();
      if (!next) break;
      levels.push(next);
    }
    if (levels.length >= 2) return { population: m, levels };
  }
  return null;
}

/* ---------- Round state (design § 14) ---------- */

export type Mode = 'clues';
export const MODES: readonly Mode[] = ['clues'];
export const ROUND_LENGTH = 5;
export const MAX_CLUES = 4;

export interface PdState {
  v: 1;
  seed: number;
  difficulty: Difficulty;
  mode: Mode;
  cases: ClueCase[];
  /** Current case 0..len−1; len = summary. */
  index: number;
  /** finished() was called (never twice, also after restore). */
  reported: boolean;
}

export const isReview = (c: ClueCase): boolean => c.answers.length >= c.clues.length;
/** Clues visible to the player: one more than answered, at most all. */
export const revealed = (c: ClueCase): number => Math.min(c.answers.length + 1, c.clues.length);
export const isSummary = (s: PdState): boolean => s.index >= s.cases.length;
export const currentCase = (s: PdState): ClueCase | null => s.cases[s.index] ?? null;

/** The belief the player held before step k (0-based): the committed one, or the exact one after a skip / at the start. */
export function previousBelief(c: ClueCase, k: number): Frac[] {
  if (k === 0) return posteriorAfter(c, 0);
  const a = c.answers[k - 1];
  return a && a !== 'skip' ? beliefFrac(a) : posteriorAfter(c, k);
}

/** The draft a new step starts from (design § 6.1): the previous belief, rounded. */
export function startDraft(c: ClueCase, k: number): Belief {
  const a = k > 0 ? c.answers[k - 1] : undefined;
  return a && a !== 'skip' ? [...a] : roundPercents(posteriorAfter(c, k));
}

const replaceCase = (s: PdState, c: ClueCase): PdState => ({ ...s, cases: s.cases.map((x, i) => (i === s.index ? c : x)) });

export function setDraft(s: PdState, b: Belief): PdState {
  const c = currentCase(s);
  if (!c || isReview(c) || !isBelief(b, c.hyps) || b.every((x, i) => x === c.draft[i])) return s;
  return replaceCase(s, { ...c, draft: [...b] });
}

export const shareDraft = (s: PdState, i: number, v: number): PdState => {
  const c = currentCase(s);
  return c && !isReview(c) && i >= 0 && i < c.hyps ? setDraft(s, setShare(c.draft, i, v)) : s;
};

/** "Back to my last estimate". */
export const resetDraft = (s: PdState): PdState => {
  const c = currentCase(s);
  return c && !isReview(c) ? setDraft(s, startDraft(c, c.answers.length)) : s;
};

/** Commit the draft (or a skip) for the current step. */
export function commitStep(s: PdState, skip = false): PdState {
  const c = currentCase(s);
  if (!c || isReview(c)) return s;
  const answers: Answer[] = [...c.answers, skip ? 'skip' : [...c.draft]];
  const next: ClueCase = { ...c, answers };
  if (answers.length < c.clues.length) next.draft = startDraft(next, answers.length);
  return replaceCase(s, next);
}

export function nextCase(s: PdState): PdState {
  const c = currentCase(s);
  if (!c || !isReview(c)) return s;
  return { ...s, index: s.index + 1 };
}

export const markReported = (s: PdState): PdState => (isSummary(s) && !s.reported ? { ...s, reported: true } : s);

/** The same round from its start (`reset`). */
export const restartRound = (s: PdState): PdState => ({
  ...s,
  index: 0,
  reported: false,
  cases: s.cases.map((c) => {
    const fresh: ClueCase = { ...c, answers: [] };
    fresh.draft = startDraft(fresh, 0);
    return fresh;
  })
});

/* ---------- Validation (never throws) ---------- */

const isResult = (x: unknown): x is 0 | 1 => x === 0 || x === 1;

function isClueCase(x: unknown, difficulty: Difficulty): x is ClueCase {
  if (!isRecord(x) || x.kind !== 'clues' || typeof x.template !== 'string') return false;
  const template = templateById(x.template);
  if (!template || !template.levels.includes(difficulty)) return false;
  const hyps = x.hyps;
  if (hyps !== hypsFor(template, difficulty)) return false;
  if (!isOneOf(x.priorDen, [10, 100, 1000])) return false;
  if (!isArrayOf(x.prior, (v): v is number => isInt(v, 1, 1000), hyps)) return false;
  if ((x.prior as number[]).reduce((a, b) => a + b, 0) !== x.priorDen) return false;
  if (!Array.isArray(x.clues) || x.clues.length < 2 || x.clues.length > MAX_CLUES) return false;
  const ids = new Set<string>();
  for (const clue of x.clues as unknown[]) {
    if (!isRecord(clue) || typeof clue.id !== 'string' || ids.has(clue.id) || !clueSpec(template, clue.id)) return false;
    ids.add(clue.id);
    if (!isOneOf(clue.den, [10, 100]) || !isResult(clue.result)) return false;
    const den = clue.den;
    if (!isArrayOf(clue.num, (v): v is number => isInt(v, 0, den), hyps)) return false;
  }
  const evidence = x as unknown as ClueEvidence;
  if (!isInt(x.truth, 0, hyps - 1) || weightsAfter(evidence, evidence.clues.length)[x.truth]! <= 0n) return false;
  if (!Array.isArray(x.answers) || x.answers.length > evidence.clues.length) return false;
  if (!x.answers.every((a) => a === 'skip' || isBelief(a, hyps))) return false;
  return isBelief(x.draft, hyps);
}

export function isPdState(x: unknown): x is PdState {
  try {
    if (!isRecord(x) || x.v !== 1 || !isUint32(x.seed) || !isOneOf(x.difficulty, DIFFICULTIES) || !isOneOf(x.mode, MODES)) return false;
    const difficulty = x.difficulty;
    if (!Array.isArray(x.cases) || x.cases.length !== ROUND_LENGTH || !x.cases.every((c) => isClueCase(c, difficulty))) return false;
    if (new Set((x.cases as ClueCase[]).map((c) => c.template)).size !== x.cases.length) return false;
    if (!isInt(x.index, 0, x.cases.length) || typeof x.reported !== 'boolean') return false;
    const index = x.index;
    if (x.reported && index !== x.cases.length) return false;
    // Cases before the current one are reviewed; cases after it are untouched.
    return (x.cases as ClueCase[]).every((c, i) => (i < index ? isReview(c) : i > index ? c.answers.length === 0 : true));
  } catch {
    return false;
  }
}

export const settingsOf = (s: PdState): Record<string, string> => ({ difficulty: s.difficulty });

/* ---------- Review and summary (design § 10.5) ---------- */

export interface StepReview {
  step: number;
  answer: Answer;
  exact: Frac[];
  gap: Frac | null;
  band: Band | null;
  move: Movement | null;
}

export interface CaseReview {
  steps: StepReview[];
  final: Belief | null;
  finalBand: Band | null;
  score: number | null;
  exactScore: Frac;
  baseRate: boolean;
}

export function reviewCase(c: ClueCase): CaseReview {
  const steps: StepReview[] = c.answers.map((answer, k) => {
    const exact = posteriorAfter(c, k + 1);
    if (answer === 'skip') return { step: k, answer, exact, gap: null, band: null, move: null };
    const gap = gapPp(beliefFrac(answer), exact);
    return { step: k, answer, exact, gap, band: bandOf(gap), move: movement(previousBelief(c, k), answer, c.clues[k]!) };
  });
  const last = c.answers[c.clues.length - 1];
  const final = last && last !== 'skip' ? last : null;
  const first = c.answers[0];
  return {
    steps,
    final,
    finalBand: steps[c.clues.length - 1]?.band ?? null,
    score: final ? forecastScore(final, c.truth) : null,
    exactScore: forecastExact(posteriorAfter(c, c.clues.length), c.truth),
    baseRate: !!first && first !== 'skip' && baseRateFlag(c, first)
  };
}

export type Tip = 'baseRate' | 'conservative' | 'overreach' | 'general';

export interface Summary {
  rows: { template: string; band: Band | null; truth: number }[];
  scored: number;
  veryClose: number;
  close: number;
  /** Median movement ratio over informative two-hypothesis steps (null below 3 such steps). */
  habit: 'less' | 'more' | 'right' | null;
  baseRateCases: number;
  forecastAvg: number | null;
  exactAvg: number | null;
  tip: Tip;
}

export function summarize(s: PdState): Summary {
  const reviews = s.cases.map(reviewCase);
  const rows = s.cases.map((c, i) => ({ template: c.template, band: reviews[i]!.finalBand, truth: c.truth }));
  const ratios = reviews.flatMap((r) => r.steps.flatMap((st) => (st.move?.kind === 'ratio' ? [st.move.r] : []))).sort((a, b) => a - b);
  const median = ratios.length ? (ratios[(ratios.length - 1) >> 1]! + ratios[ratios.length >> 1]!) / 2 : 0;
  const habit = ratios.length < 3 ? null : median < 0.8 ? 'less' : median > 1.25 ? 'more' : 'right';
  const scoredCases = reviews.filter((r) => r.score !== null);
  const forecastAvg = scoredCases.length >= 2 ? Math.round(scoredCases.reduce((a, r) => a + r.score!, 0) / scoredCases.length) : null;
  const exactAvg = scoredCases.length >= 2 ? Math.round(scoredCases.reduce((a, r) => a + toNumber(r.exactScore), 0) / scoredCases.length) : null;
  const baseRateCases = reviews.filter((r) => r.baseRate).length;
  const tip: Tip = baseRateCases > 0 ? 'baseRate' : habit === 'less' ? 'conservative' : habit === 'more' ? 'overreach' : 'general';
  return {
    rows,
    scored: scoredCases.length,
    veryClose: rows.filter((r) => r.band === 'spot').length,
    close: rows.filter((r) => r.band === 'close').length,
    habit,
    baseRateCases,
    forecastAvg,
    exactAvg,
    tip
  };
}

/* ---------- Calibration notebook (owner decision 2026-10-24; device preferences, never state) ---------- */

/** One forecast: the stated percent for one hypothesis and whether it was the truth. */
export type NoteEntry = [number, 0 | 1];
export const NOTEBOOK_MAX = 400;
export const NOTEBOOK_MIN = 20;

/** Reads a stored notebook defensively (a damaged value becomes empty; never throws). */
export function readNotebook(x: unknown): NoteEntry[] {
  if (!Array.isArray(x)) return [];
  return x.filter((e): e is NoteEntry => Array.isArray(e) && e.length === 2 && isInt(e[0], 0, 100) && isResult(e[1])).slice(-NOTEBOOK_MAX);
}

/** The forecasts of a reviewed case with a final belief (one entry per hypothesis). */
export function caseNotes(c: ClueCase): NoteEntry[] {
  const last = c.answers[c.clues.length - 1];
  if (!isReview(c) || !last || last === 'skip') return [];
  return last.map((b, h) => [b, h === c.truth ? 1 : 0]);
}

export const notebookAdd = (book: readonly NoteEntry[], entries: readonly NoteEntry[]): NoteEntry[] => [...book, ...entries].slice(-NOTEBOOK_MAX);

export interface CalibrationBin {
  /** Bin centre in percent (5, 15, …, 95); 0–9 → 5, …, 90–100 → 95. */
  centre: number;
  count: number;
  hits: number;
}

export function notebookBins(book: readonly NoteEntry[]): CalibrationBin[] {
  const bins: CalibrationBin[] = Array.from({ length: 10 }, (_, i) => ({ centre: i * 10 + 5, count: 0, hits: 0 }));
  for (const [p, hit] of book) {
    const bin = bins[Math.min(9, Math.floor(p / 10))]!;
    bin.count++;
    bin.hits += hit;
  }
  return bins.filter((b) => b.count > 0);
}
