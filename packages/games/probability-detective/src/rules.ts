/**
 * Probability Detective: pure rules (design § 6, § 9, § 10, § 12, § 14). No DOM, no clock, no `Math.random`.
 *
 * The state holds integers only; exact probabilities are recomputed on demand as BigInt fractions.
 */
import { isArrayOf, isInt, isOneOf, isRecord, isUint32 } from '@wp/game-core';
import { ONE, ZERO, add, cmp, div, frac, gcd, mul, normalise, sub, toNumber, type Frac } from './frac';
import { DIFFICULTIES, checkTemplateById, clueSpec, hypsFor, optionsFor, templateById, type Difficulty } from './templates';
import { trapById, trapValid, type TrapQuestion } from './traps';

export type { Difficulty } from './templates';

export * from './frac';

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

/**
 * The smallest population M = 10^k ≤ max at which every step's counts are whole numbers; if there is none, the
 * smallest M at which at least the first clue's counts are (the board then stops at the last whole step).
 */
export function countingBoard(c: ClueEvidence, maxPopulation = 100_000): Board | null {
  let partial: Board | null = null;
  for (let m = 10; m <= maxPopulation; m *= 10) {
    const b = boardAt(c, m);
    if (b && b.levels.length === c.clues.length + 1) return b;
    partial ??= b;
  }
  return partial;
}

function boardAt(c: ClueEvidence, m: number): Board | null {
  const levels: bigint[][] = [];
  let den = BigInt(c.priorDen);
  let w = c.prior.map((x) => BigInt(x));
  const at = (): bigint[] | null => (w.every((x) => (x * BigInt(m)) % den === 0n) ? w.map((x) => (x * BigInt(m)) / den) : null);
  const base = at();
  if (!base) return null;
  levels.push(base);
  for (const clue of c.clues) {
    const l = likelihood(clue);
    w = w.map((x, h) => x * BigInt(l[h]!));
    den *= BigInt(clue.den);
    const next = at();
    if (!next) break;
    levels.push(next);
  }
  return levels.length >= 2 ? { population: m, levels } : null;
}

/* ---------- "Choose the checks": exact analysis (design § 7.3) ---------- */

/** The parameters of a checks case: everything the filters may read (no results, no truth). */
export interface CheckParams {
  priorDen: number;
  prior: number[];
  checks: { den: number; num: number[]; cost: number }[];
  options: { pay: number[] }[];
}

/** Observed (check, result) pairs. */
export type Obs = readonly (readonly [number, 0 | 1])[];
export type Action = { kind: 'run'; check: number } | { kind: 'decide'; option: number };

const checkLikelihood = (c: CheckParams['checks'][number], r: 0 | 1): number[] => c.num.map((x) => (r === 1 ? x : c.den - x));

/** Unnormalised weights after the observations: prior[h] · Π L. */
export function checkWeights(p: CheckParams, s: Obs): bigint[] {
  const w = p.prior.map((x) => BigInt(x));
  for (const [c, r] of s) {
    const l = checkLikelihood(p.checks[c]!, r);
    for (let h = 0; h < w.length; h++) w[h] = w[h]! * BigInt(l[h]!);
  }
  return w;
}

export const checkPosterior = (p: CheckParams, s: Obs): Frac[] => normalise(checkWeights(p, s));

/** Expected points of option d under a posterior. */
export const expectedValue = (p: CheckParams, post: readonly Frac[], d: number): Frac =>
  post.reduce((acc, x, h) => add(acc, mul(x, frac(p.options[d]!.pay[h]!))), ZERO);

const maxFrac = (xs: readonly Frac[]): Frac => xs.reduce((m, x) => (cmp(x, m) > 0 ? x : m));

/** The value of deciding now: the best expected points. */
export const decideNow = (p: CheckParams, s: Obs): Frac => {
  const post = checkPosterior(p, s);
  return maxFrac(p.options.map((_, d) => expectedValue(p, post, d)));
};

/** P(result r | observations, check c). */
export function resultProbability(p: CheckParams, s: Obs, c: number, r: 0 | 1): Frac {
  const w = checkWeights(p, s);
  const total = w.reduce((a, x) => a + x, 0n);
  if (total === 0n) return ZERO;
  const l = checkLikelihood(p.checks[c]!, r);
  const hit = w.reduce((a, x, h) => a + x * BigInt(l[h]!), 0n);
  return frac(hit, total * BigInt(p.checks[c]!.den));
}

const obsKey = (s: Obs): string =>
  s
    .map(([c, r]) => `${c}${r}`)
    .sort()
    .join(',');

export interface CheckAnalysis {
  /** Best plan value V(s) (expectimax over checks, then the best decision). */
  value(s: Obs): Frac;
  /** Value of an action at s: deciding d, or running check c and then playing best. */
  q(s: Obs, a: Action): Frac;
  /** All best actions at s (ties included). */
  best(s: Obs): Action[];
}

/**
 * Exact expectimax on integer weights. With wt_s[h] = prior[h] · Π_{(c,r)∈s} L_{c,r}[h] · Π_{c∉s} den_c, every state
 * shares one denominator, a check's two outcomes split wt_s exactly (Σ_r wt_{s+(c,r)} = wt_s), and the scaled value
 * U(s) = V(s) · Σ_h wt_s[h] satisfies U(s) = max(max_d Σ_h wt_s[h]·pay[d][h], max_c [−cost_c·Σwt_s + U(s,c,0) + U(s,c,1)])
 * — integers only. V(s) = U(s) / Σ wt_s.
 */
export function analyseChecks(p: CheckParams): CheckAnalysis {
  const n = p.checks.length;
  const pay = p.options.map((o) => o.pay.map((x) => BigInt(x)));
  const cost = p.checks.map((c) => BigInt(c.cost));
  const lik = p.checks.map((c) => [c.num.map((x) => BigInt(c.den - x)), c.num.map((x) => BigInt(x))] as const);
  const dens = p.checks.map((c) => BigInt(c.den));
  const wtOf = (s: Obs): bigint[] => {
    const w = p.prior.map((x) => BigInt(x));
    const used = new Set(s.map(([c]) => c));
    for (let h = 0; h < w.length; h++) {
      for (const [c, r] of s) w[h] = w[h]! * lik[c]![r]![h]!;
      for (let c = 0; c < n; c++) if (!used.has(c)) w[h] = w[h]! * dens[c]!;
    }
    return w;
  };
  const sum = (w: readonly bigint[]) => w.reduce((a, x) => a + x, 0n);
  const decideU = (w: readonly bigint[], d: number) => w.reduce((a, x, h) => a + x * pay[d]![h]!, 0n);
  const memo = new Map<string, bigint>();
  const runU = (s: Obs, w: readonly bigint[], c: number): bigint => {
    let u = -cost[c]! * sum(w);
    for (const r of [0, 1] as const) {
      const s2: Obs = [...s, [c, r]];
      const w2 = wtOf(s2);
      if (sum(w2) > 0n) u += U(s2, w2);
    }
    return u;
  };
  const actions = (s: Obs): Action[] => [
    ...p.options.map((_, option): Action => ({ kind: 'decide', option })),
    ...p.checks.flatMap((_, check): Action[] => (s.some(([c]) => c === check) ? [] : [{ kind: 'run', check }]))
  ];
  const qU = (s: Obs, w: readonly bigint[], a: Action): bigint => (a.kind === 'decide' ? decideU(w, a.option) : runU(s, w, a.check));
  function U(s: Obs, w: readonly bigint[]): bigint {
    const key = obsKey(s);
    const hit = memo.get(key);
    if (hit !== undefined) return hit;
    let best: bigint | null = null;
    for (const a of actions(s)) {
      const u = qU(s, w, a);
      if (best === null || u > best) best = u;
    }
    memo.set(key, best!);
    return best!;
  }
  const scaled = (s: Obs, u: bigint): Frac => {
    const total = sum(wtOf(s));
    return total === 0n ? ZERO : frac(u, total);
  };
  return {
    value: (s) => scaled(s, U(s, wtOf(s))),
    q: (s, a) => scaled(s, qU(s, wtOf(s), a)),
    best(s) {
      const w = wtOf(s);
      const v = U(s, w);
      return actions(s).filter((a) => qU(s, w, a) === v);
    }
  };
}

/** Myopic net value of a check at the start: Σ_r P(r)·Decide({(c,r)}) − Decide(∅) − cost. */
export function myopicValue(p: CheckParams, c: number): Frac {
  let v = frac(-p.checks[c]!.cost);
  for (const r of [0, 1] as const) {
    const pr = resultProbability(p, [], c, r);
    if (pr.n !== 0n) v = add(v, mul(pr, decideNow(p, [[c, r]])));
  }
  return sub(v, decideNow(p, []));
}

/* ---------- Round state (design § 14) ---------- */

export type Mode = 'clues' | 'checks' | 'traps' | 'mixed';
export const MODES: readonly Mode[] = ['clues', 'checks', 'traps', 'mixed'];
export type CaseKind = 'clues' | 'checks' | 'trap';
export const MAX_CLUES = 4;

/** The kinds of the cases of a round, per mode (design § 5). */
export const roundKinds = (mode: Mode): readonly CaseKind[] =>
  mode === 'clues' ? Array(5).fill('clues') : mode === 'checks' ? Array(3).fill('checks') : mode === 'traps' ? Array(5).fill('trap') : ['clues', 'trap', 'checks', 'trap', 'clues'];

export interface CheckCase {
  kind: 'checks';
  template: string;
  priorDen: number;
  prior: number[];
  checks: { id: string; den: number; num: number[]; cost: number; result: 0 | 1 }[];
  options: { id: string; pay: number[] }[];
  truth: number;
  /** Indices of the checks run, in order. */
  done: number[];
  /** On the decision screen. */
  deciding: boolean;
  draft: Belief;
  /** The option selected on the decision screen (not yet committed). */
  choice: number | null;
  answer: Answer | null;
  /** The committed option; non-null ⇔ review. */
  decision: number | null;
}

export interface TrapCase {
  kind: 'trap';
  template: string;
  params: number[];
  /** Per question: option index, or a percent for a probability question; null = not answered yet. */
  drafts: (number | null)[];
  /** Committed ⇔ review. */
  answers: (number | 'skip')[] | null;
}

export type CaseState = ClueCase | CheckCase | TrapCase;

export interface PdState {
  v: 1;
  seed: number;
  difficulty: Difficulty;
  mode: Mode;
  cases: CaseState[];
  /** Current case 0..len−1; len = summary. */
  index: number;
  /** finished() was called (never twice, also after restore). */
  reported: boolean;
}

export const checkParams = (c: CheckCase): CheckParams => ({ priorDen: c.priorDen, prior: c.prior, checks: c.checks, options: c.options });
export const observed = (c: CheckCase): Obs => c.done.map((i) => [i, c.checks[i]!.result] as const);

export function isReview(c: CaseState): boolean {
  if (c.kind === 'clues') return c.answers.length >= c.clues.length;
  if (c.kind === 'checks') return c.decision !== null;
  return c.answers !== null;
}
/** Clues visible to the player: one more than answered, at most all. */
export const revealed = (c: ClueCase): number => Math.min(c.answers.length + 1, c.clues.length);
export const isSummary = (s: PdState): boolean => s.index >= s.cases.length;
export const currentCase = (s: PdState): CaseState | null => s.cases[s.index] ?? null;

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

const replaceCase = (s: PdState, c: CaseState): PdState => ({ ...s, cases: s.cases.map((x, i) => (i === s.index ? c : x)) });

const hypsOf = (c: ClueCase | CheckCase): number => (c.kind === 'clues' ? c.hyps : 2);
/** Whether the belief panel of the current case is open for editing. */
const editable = (c: CaseState | null): c is ClueCase | CheckCase =>
  !!c && !isReview(c) && (c.kind === 'clues' || (c.kind === 'checks' && c.deciding));

export function setDraft(s: PdState, b: Belief): PdState {
  const c = currentCase(s);
  if (!editable(c) || !isBelief(b, hypsOf(c)) || b.every((x, i) => x === c.draft[i])) return s;
  return replaceCase(s, { ...c, draft: [...b] });
}

export const shareDraft = (s: PdState, i: number, v: number): PdState => {
  const c = currentCase(s);
  return editable(c) && i >= 0 && i < hypsOf(c) ? setDraft(s, setShare(c.draft, i, v)) : s;
};

/** "Back to my last estimate" (clue cases). */
export const resetDraft = (s: PdState): PdState => {
  const c = currentCase(s);
  return c?.kind === 'clues' && !isReview(c) ? setDraft(s, startDraft(c, c.answers.length)) : s;
};

/** Commit the draft (or a skip) for the current step of a clue case. */
export function commitStep(s: PdState, skip = false): PdState {
  const c = currentCase(s);
  if (!c || c.kind !== 'clues' || isReview(c)) return s;
  const answers: Answer[] = [...c.answers, skip ? 'skip' : [...c.draft]];
  const next: ClueCase = { ...c, answers };
  if (answers.length < c.clues.length) next.draft = startDraft(next, answers.length);
  return replaceCase(s, next);
}

/** Run check i of a checks case (once; not on the decision screen; not after deciding). */
export function runCheck(s: PdState, i: number): PdState {
  const c = currentCase(s);
  if (!c || c.kind !== 'checks' || isReview(c) || c.deciding || !Number.isInteger(i) || i < 0 || i >= c.checks.length || c.done.includes(i)) return s;
  return replaceCase(s, { ...c, done: [...c.done, i] });
}

/** Open ("Ready to decide") or leave ("Back to the checks") the decision screen. */
export function toDeciding(s: PdState, on: boolean): PdState {
  const c = currentCase(s);
  if (!c || c.kind !== 'checks' || isReview(c) || c.deciding === on) return s;
  return replaceCase(s, { ...c, deciding: on });
}

/** Select an option on the decision screen. */
export function setChoice(s: PdState, d: number): PdState {
  const c = currentCase(s);
  if (!c || c.kind !== 'checks' || isReview(c) || !c.deciding || !Number.isInteger(d) || d < 0 || d >= c.options.length || c.choice === d) return s;
  return replaceCase(s, { ...c, choice: d });
}

/** Commit the decision (needs a selected option) with the belief or a skip. */
export function decide(s: PdState, skip = false): PdState {
  const c = currentCase(s);
  if (!c || c.kind !== 'checks' || isReview(c) || !c.deciding || c.choice === null) return s;
  return replaceCase(s, { ...c, deciding: false, decision: c.choice, answer: skip ? 'skip' : [...c.draft] });
}

/** Set the draft answer of question q of a trap case (null clears it). */
export function setTrapDraft(s: PdState, q: number, v: number | null): PdState {
  const c = currentCase(s);
  if (!c || c.kind !== 'trap' || isReview(c)) return s;
  const question = trapQuestions(c)[q];
  if (!question || (v !== null && !draftFits(question, v)) || c.drafts[q] === v) return s;
  return replaceCase(s, { ...c, drafts: c.drafts.map((x, i) => (i === q ? v : x)) });
}

/** "Check my answers" (unanswered questions count as skipped), or skip them all. */
export function checkTrap(s: PdState, skipAll = false): PdState {
  const c = currentCase(s);
  if (!c || c.kind !== 'trap' || isReview(c)) return s;
  return replaceCase(s, { ...c, answers: c.drafts.map((x) => (skipAll || x === null ? 'skip' : x)) });
}

export function nextCase(s: PdState): PdState {
  const c = currentCase(s);
  if (!c || !isReview(c)) return s;
  return { ...s, index: s.index + 1 };
}

export const markReported = (s: PdState): PdState => (isSummary(s) && !s.reported ? { ...s, reported: true } : s);

/** A case as it was before the player touched it. */
export function freshCase(c: CaseState): CaseState {
  if (c.kind === 'clues') {
    const fresh: ClueCase = { ...c, answers: [] };
    fresh.draft = startDraft(fresh, 0);
    return fresh;
  }
  if (c.kind === 'checks') return { ...c, done: [], deciding: false, draft: roundPercents(normalise(c.prior)), choice: null, answer: null, decision: null };
  return { ...c, drafts: c.drafts.map(() => null), answers: null };
}

/** The same round from its start (`reset`). */
export const restartRound = (s: PdState): PdState => ({ ...s, index: 0, reported: false, cases: s.cases.map(freshCase) });

/* ---------- Traps ---------- */

export const trapQuestions = (c: TrapCase): readonly TrapQuestion[] => trapById(c.template)?.questions(c.params) ?? [];

function draftFits(q: TrapQuestion, v: number): boolean {
  if (!Number.isInteger(v)) return false;
  if (q.kind === 'prob') return v >= 0 && v <= 100;
  return v >= 0 && v < (q.kind === 'choice' ? q.options.length : q.values.length);
}

export interface TrapAnswerReview {
  question: TrapQuestion;
  answer: number | 'skip';
  /** Choice/count: the right option was chosen; prob: within the "very close" band. */
  matches: boolean | null;
  band: Band | null;
}

export function reviewTrap(c: TrapCase): TrapAnswerReview[] {
  return trapQuestions(c).map((question, i) => {
    const answer = c.answers?.[i] ?? 'skip';
    if (answer === 'skip') return { question, answer, matches: null, band: null };
    if (question.kind === 'prob') {
      const gap = gapPp([frac(answer, 100), frac(100 - answer, 100)], [question.exact, sub(ONE, question.exact)]);
      const band = bandOf(gap);
      return { question, answer, matches: band === 'spot', band };
    }
    return { question, answer, matches: answer === question.correct, band: null };
  });
}

/* ---------- Validation (never throws) ---------- */

const isResult = (x: unknown): x is 0 | 1 => x === 0 || x === 1;

function isClueCase(x: Record<string, unknown>, difficulty: Difficulty): boolean {
  if (x.kind !== 'clues' || typeof x.template !== 'string') return false;
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

function isCheckCase(x: Record<string, unknown>, difficulty: Difficulty): boolean {
  if (x.kind !== 'checks' || typeof x.template !== 'string') return false;
  const t = checkTemplateById(x.template);
  if (!t || !t.levels.includes(difficulty)) return false;
  if (!isOneOf(x.priorDen, [10, 100]) || !isArrayOf(x.prior, (v): v is number => isInt(v, 1, 99), 2)) return false;
  if ((x.prior as number[])[0]! + (x.prior as number[])[1]! !== x.priorDen) return false;
  if (!Array.isArray(x.checks) || x.checks.length < 3 || x.checks.length > 4) return false;
  const ids = new Set<string>();
  for (const c of x.checks as unknown[]) {
    if (!isRecord(c) || typeof c.id !== 'string' || ids.has(c.id) || !t.checks.some((k) => k.id === c.id)) return false;
    ids.add(c.id);
    if (!isOneOf(c.den, [10, 100]) || !isResult(c.result) || !isInt(c.cost, 1, 4)) return false;
    const den = c.den;
    if (!isArrayOf(c.num, (v): v is number => isInt(v, 0, den), 2)) return false;
  }
  const allowed = optionsFor(t, difficulty).map((o) => o.id);
  if (!Array.isArray(x.options) || x.options.length !== allowed.length) return false;
  if (!(x.options as unknown[]).every((o, i) => isRecord(o) && o.id === allowed[i] && isArrayOf(o.pay, (v): v is number => isInt(v, -30, 30), 2))) return false;
  const cc = x as unknown as CheckCase;
  if (!isInt(x.truth, 0, 1)) return false;
  const truth = x.truth;
  if (cc.prior[truth]! <= 0 || cc.checks.some((c) => (c.result === 1 ? c.num[truth]! : c.den - c.num[truth]!) <= 0)) return false;
  if (!isArrayOf(x.done, (v): v is number => isInt(v, 0, cc.checks.length - 1)) || new Set(cc.done).size !== cc.done.length) return false;
  if (typeof x.deciding !== 'boolean' || !isBelief(x.draft, 2)) return false;
  if (!(x.choice === null || isInt(x.choice, 0, cc.options.length - 1))) return false;
  if (!(x.decision === null || isInt(x.decision, 0, cc.options.length - 1))) return false;
  if (!(x.answer === null || x.answer === 'skip' || isBelief(x.answer, 2))) return false;
  if (x.decision !== null && (x.answer === null || x.deciding)) return false;
  return x.decision !== null || x.answer === null;
}

function isTrapCase(x: Record<string, unknown>, difficulty: Difficulty): boolean {
  if (x.kind !== 'trap' || typeof x.template !== 'string') return false;
  const t = trapById(x.template);
  if (!t || !trapValid(t, x.params, difficulty)) return false;
  const qs = t.questions(x.params as number[]);
  if (!Array.isArray(x.drafts) || x.drafts.length !== qs.length) return false;
  if (!x.drafts.every((v, i) => v === null || (typeof v === 'number' && draftFits(qs[i]!, v)))) return false;
  if (x.answers === null) return true;
  return Array.isArray(x.answers) && x.answers.length === qs.length && x.answers.every((v, i) => v === 'skip' || (typeof v === 'number' && draftFits(qs[i]!, v)));
}

function isCase(x: unknown, kind: CaseKind, difficulty: Difficulty): x is CaseState {
  if (!isRecord(x)) return false;
  if (kind === 'clues') return isClueCase(x, difficulty);
  if (kind === 'checks') return isCheckCase(x, difficulty);
  return isTrapCase(x, difficulty);
}

const untouched = (c: CaseState): boolean =>
  c.kind === 'clues' ? c.answers.length === 0 : c.kind === 'checks' ? c.done.length === 0 && !c.deciding && c.choice === null && c.decision === null : c.answers === null;

export function isPdState(x: unknown): x is PdState {
  try {
    if (!isRecord(x) || x.v !== 1 || !isUint32(x.seed) || !isOneOf(x.difficulty, DIFFICULTIES) || !isOneOf(x.mode, MODES)) return false;
    const difficulty = x.difficulty;
    const kinds = roundKinds(x.mode);
    if (!Array.isArray(x.cases) || x.cases.length !== kinds.length || !x.cases.every((c, i) => isCase(c, kinds[i]!, difficulty))) return false;
    const cases = x.cases as CaseState[];
    // A round never repeats a template.
    if (new Set(cases.map((c) => c.template)).size !== cases.length) return false;
    if (!isInt(x.index, 0, cases.length) || typeof x.reported !== 'boolean') return false;
    const index = x.index;
    if (x.reported && index !== cases.length) return false;
    // Cases before the current one are reviewed; cases after it are untouched.
    return cases.every((c, i) => (i < index ? isReview(c) : i > index ? untouched(c) : true));
  } catch {
    return false;
  }
}

/** Unknown settings fall back to the defaults (design § 13). */
export const settingsOf = (s: PdState): Record<string, string> => ({ mode: s.mode, difficulty: s.difficulty });

/* ---------- Review and summary (design § 7.4, § 10.5) ---------- */

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

export interface InvestigationRow {
  /** What the player did at this point. */
  action: Action;
  /** Its value, and the best possible value here. */
  value: Frac;
  bestValue: Frac;
  best: Action[];
}

export interface ChecksReview {
  /** Points: the option's payoff under the truth minus the checks' costs. */
  points: number;
  spent: number;
  /** The decision was a best one given the final observations. */
  bestDecision: boolean;
  /** Expected points of every option at the final state. */
  evs: Frac[];
  decisionLoss: Frac;
  rows: InvestigationRow[];
  /** Myopic net value of every check at the start. */
  myopic: Frac[];
  startValue: Frac;
  decideValue: Frac;
  exact: Frac[];
  final: Belief | null;
  finalBand: Band | null;
  score: number | null;
  exactScore: Frac;
}

export function reviewChecks(c: CheckCase): ChecksReview {
  const p = checkParams(c);
  const a = analyseChecks(p);
  const rows: InvestigationRow[] = [];
  const obs: [number, 0 | 1][] = [];
  for (const i of c.done) {
    const action: Action = { kind: 'run', check: i };
    rows.push({ action, value: a.q(obs, action), bestValue: a.value(obs), best: a.best(obs) });
    obs.push([i, c.checks[i]!.result]);
  }
  const decision = c.decision ?? 0;
  const final: Action = { kind: 'decide', option: decision };
  rows.push({ action: final, value: a.q(obs, final), bestValue: a.value(obs), best: a.best(obs) });
  const post = checkPosterior(p, obs);
  const evs = p.options.map((_, d) => expectedValue(p, post, d));
  const best = maxFrac(evs);
  const spent = c.done.reduce((acc, i) => acc + c.checks[i]!.cost, 0);
  const belief = c.answer && c.answer !== 'skip' ? c.answer : null;
  return {
    points: c.options[decision]!.pay[c.truth]! - spent,
    spent,
    bestDecision: cmp(evs[decision]!, best) === 0,
    evs,
    decisionLoss: sub(best, evs[decision]!),
    rows,
    myopic: p.checks.map((_, i) => myopicValue(p, i)),
    startValue: a.value([]),
    decideValue: decideNow(p, []),
    exact: post,
    final: belief,
    finalBand: belief ? bandOf(gapPp(beliefFrac(belief), post)) : null,
    score: belief ? forecastScore(belief, c.truth) : null,
    exactScore: forecastExact(post, c.truth)
  };
}

export type Tip = 'baseRate' | 'conservative' | 'overreach' | 'traps' | 'general';

export interface SummaryRow {
  template: string;
  kind: CaseKind;
  /** Clue and checks cases: the band of the final estimate (null when skipped). */
  band: Band | null;
  /** Checks: the decision was a best one. */
  bestDecision: boolean | null;
  /** Traps: answers matching the exact answer, of the questions. */
  matches: number | null;
  questions: number | null;
}

export interface Summary {
  rows: SummaryRow[];
  scored: number;
  veryClose: number;
  close: number;
  /** Median movement ratio over informative two-hypothesis steps (null below 3 such steps). */
  habit: 'less' | 'more' | 'right' | null;
  baseRateCases: number;
  forecastAvg: number | null;
  exactAvg: number | null;
  checkCases: number;
  bestDecisions: number;
  trapQuestions: number;
  trapMatches: number;
  tip: Tip;
}

export function summarize(s: PdState): Summary {
  const rows: SummaryRow[] = [];
  const ratios: number[] = [];
  const forecasts: { score: number; exact: number }[] = [];
  let baseRateCases = 0;
  let bestDecisions = 0;
  let checkCases = 0;
  let trapQuestionsCount = 0;
  let trapMatches = 0;
  for (const c of s.cases) {
    if (c.kind === 'clues') {
      const r = reviewCase(c);
      for (const st of r.steps) if (st.move?.kind === 'ratio') ratios.push(st.move.r);
      if (r.score !== null) forecasts.push({ score: r.score, exact: toNumber(r.exactScore) });
      if (r.baseRate) baseRateCases++;
      rows.push({ template: c.template, kind: 'clues', band: r.finalBand, bestDecision: null, matches: null, questions: null });
    } else if (c.kind === 'checks') {
      checkCases++;
      const r = isReview(c) ? reviewChecks(c) : null;
      if (r?.bestDecision) bestDecisions++;
      if (r && r.score !== null) forecasts.push({ score: r.score, exact: toNumber(r.exactScore) });
      rows.push({ template: c.template, kind: 'checks', band: r?.finalBand ?? null, bestDecision: r ? r.bestDecision : null, matches: null, questions: null });
    } else {
      const r = reviewTrap(c);
      const answered = r.filter((x) => x.answer !== 'skip');
      trapQuestionsCount += answered.length;
      const m = answered.filter((x) => x.matches).length;
      trapMatches += m;
      rows.push({ template: c.template, kind: 'trap', band: null, bestDecision: null, matches: m, questions: answered.length });
    }
  }
  ratios.sort((a, b) => a - b);
  const median = ratios.length ? (ratios[(ratios.length - 1) >> 1]! + ratios[ratios.length >> 1]!) / 2 : 0;
  const habit = ratios.length < 3 ? null : median < 0.8 ? 'less' : median > 1.25 ? 'more' : 'right';
  const avg = (xs: number[]) => Math.round(xs.reduce((a, x) => a + x, 0) / xs.length);
  const enough = forecasts.length >= 2;
  const bands = rows.filter((r) => r.kind !== 'trap');
  const tip: Tip =
    baseRateCases > 0
      ? 'baseRate'
      : habit === 'less'
        ? 'conservative'
        : habit === 'more'
          ? 'overreach'
          : trapQuestionsCount > 0 && trapMatches * 2 < trapQuestionsCount
            ? 'traps'
            : 'general';
  return {
    rows,
    scored: bands.filter((r) => r.band !== null).length,
    veryClose: bands.filter((r) => r.band === 'spot').length,
    close: bands.filter((r) => r.band === 'close').length,
    habit,
    baseRateCases,
    forecastAvg: enough ? avg(forecasts.map((f) => f.score)) : null,
    exactAvg: enough ? avg(forecasts.map((f) => f.exact)) : null,
    checkCases,
    bestDecisions,
    trapQuestions: trapQuestionsCount,
    trapMatches,
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
export function caseNotes(c: CaseState): NoteEntry[] {
  if (!isReview(c) || c.kind === 'trap') return [];
  const last = c.kind === 'clues' ? c.answers[c.clues.length - 1] : c.answer;
  if (!last || last === 'skip') return [];
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
