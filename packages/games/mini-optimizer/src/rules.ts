/**
 * Best Plan — shared state, validation and actions. The three problem types live in network.ts, delivery.ts and
 * production.ts; this module dispatches on `problem.kind`. Pure: no DOM, no timers, randomness only from the seed.
 */
import { createRng, isInt, isOneOf, isRecord, normalizeSeed, type SettingValue } from '@wp/game-core';
import { DIFFICULTIES, type Difficulty } from './common';
import * as del from './delivery';
import * as net from './network';
import * as prod from './production';
import type { DeliveryPlan, DeliveryProblem } from './delivery';
import type { NetworkPlan, NetworkProblem } from './network';
import type { ProductionPlan, ProductionProblem } from './production';

export { DIFFICULTIES, type Difficulty } from './common';
export type { DeliveryPlan, DeliveryProblem } from './delivery';
export type { NetworkPlan, NetworkProblem } from './network';
export type { ProductionPlan, ProductionProblem } from './production';

export const KINDS = ['network', 'delivery', 'production'] as const;
export type Kind = (typeof KINDS)[number];
export const CHOICES = [...KINDS, 'any'] as const;
export type Choice = (typeof CHOICES)[number];

export type Problem = NetworkProblem | DeliveryProblem | ProductionProblem;
export type Plan = NetworkPlan | DeliveryPlan | ProductionPlan;
export type Phase = 'planning' | 'checked';

export interface MoState {
  seed: number;
  difficulty: Difficulty;
  /** What the start screen said (for settingsOf); `problem.kind` is what was generated. */
  choice: Choice;
  /** Stored in full, so generator changes never break saves. */
  problem: Problem;
  plan: Plan;
  /** Earlier plans, oldest first (at most UNDO_LIMIT). */
  undo: Plan[];
  /** Feasible plans checked. */
  checks: number;
  last: { score: number; plan: Plan } | null;
  bestScore: number | null;
  /** 'checked' while the plan is the one last checked; any edit returns to 'planning'. */
  phase: Phase;
  /** "Show a best plan" was used. */
  revealed: boolean;
  /** finished() was called (on the first feasible check). */
  reported: boolean;
}

export const UNDO_LIMIT = 40;
export const DEFAULT_CHOICE: Choice = 'network';

export const toDifficulty = (v: unknown): Difficulty => (isOneOf(v, DIFFICULTIES) ? v : 'easy');
export const toChoice = (v: unknown): Choice => (isOneOf(v, CHOICES) ? v : DEFAULT_CHOICE);

/** Lower is better for cost and distance, higher for value. */
export const minimises = (kind: Kind): boolean => kind !== 'production';
export const isBetter = (kind: Kind, a: number, b: number): boolean => (minimises(kind) ? a < b : a > b);

/* ---------- Dispatch ---------- */

export function emptyPlan(problem: Problem): Plan {
  switch (problem.kind) {
    case 'network':
      return net.emptyNetworkPlan();
    case 'delivery':
      return del.emptyDeliveryPlan();
    case 'production':
      return prod.emptyProductionPlan(problem);
  }
}

export function score(problem: Problem, plan: Plan): number {
  switch (problem.kind) {
    case 'network':
      return net.networkCost(problem, plan as NetworkPlan);
    case 'delivery':
      return del.deliveryDistance(problem, plan as DeliveryPlan);
    case 'production':
      return prod.productionValue(problem, plan as ProductionPlan);
  }
}

export type Violation =
  | { code: 'groups'; groups: number[][] }
  | { code: 'unvisited'; stops: number[] }
  | { code: 'overload'; trip: number; load: number; capacity: number }
  | { code: 'overStock'; resource: number; use: number; stock: number };

/** Every unmet constraint of a plan (empty exactly when the plan is feasible). */
export function violations(problem: Problem, plan: Plan): Violation[] {
  switch (problem.kind) {
    case 'network': {
      const groups = net.groupsOf(problem, (plan as NetworkPlan).built);
      return groups.length > 1 ? [{ code: 'groups', groups }] : [];
    }
    case 'delivery': {
      const p = plan as DeliveryPlan;
      const out: Violation[] = del.overloaded(problem, p).map((trip) => ({ code: 'overload', trip, load: del.tripLoad(problem, p.trips[trip]!), capacity: problem.capacity }));
      const stops = del.unvisited(problem, p);
      if (stops.length) out.push({ code: 'unvisited', stops });
      return out;
    }
    case 'production': {
      const use = prod.resourceUse(problem, (plan as ProductionPlan).qty);
      return prod.overStock(problem, plan as ProductionPlan).map((r) => ({ code: 'overStock', resource: r, use: use[r]!, stock: problem.resources[r]!.stock }));
    }
  }
}

export const isFeasible = (problem: Problem, plan: Plan): boolean => violations(problem, plan).length === 0;

export interface Solution {
  score: number;
  plan: Plan;
}
const solved = new WeakMap<Problem, Solution>();

/** The proven optimum and one best plan (memoised per problem object). */
export function solve(problem: Problem): Solution {
  const known = solved.get(problem);
  if (known) return known;
  const solution: Solution =
    problem.kind === 'network' ? net.solveNetwork(problem) : problem.kind === 'delivery' ? del.solveDelivery(problem) : prod.solveProduction(problem);
  solved.set(problem, solution);
  return solution;
}

/** How far a score is from the optimum: absolute (≥ 0) and in percent of the optimum. */
export function gapOf(kind: Kind, yours: number, best: number): { gap: number; percent: number } {
  const gap = minimises(kind) ? yours - best : best - yours;
  return { gap, percent: best === 0 ? 0 : (100 * gap) / best };
}

/* ---------- Creation ---------- */

export function generate(seed: number, difficulty: Difficulty, choice: Choice): { problem: Problem; fallback: boolean } {
  const rng = createRng(seed);
  const kind: Kind = choice === 'any' ? KINDS[rng.int(0, KINDS.length - 1)]! : choice;
  if (kind === 'network') return net.generateNetwork(rng, difficulty);
  if (kind === 'delivery') return del.generateDelivery(rng, difficulty);
  return prod.generateProduction(rng, difficulty);
}

const fresh = (seed: number, difficulty: Difficulty, choice: Choice, problem: Problem): MoState => ({
  seed,
  difficulty,
  choice,
  problem,
  plan: emptyPlan(problem),
  undo: [],
  checks: 0,
  last: null,
  bestScore: null,
  phase: 'planning',
  revealed: false,
  reported: false
});

export function createInitial(seed: number, difficulty: unknown = 'easy', choice: unknown = DEFAULT_CHOICE): MoState {
  const s = normalizeSeed(Number.isFinite(seed) ? seed : 0);
  const d = toDifficulty(difficulty);
  const c = toChoice(choice);
  return fresh(s, d, c, generate(s, d, c).problem);
}

/** Same problem, empty plan, counters cleared. */
export const resetState = (state: MoState): MoState => fresh(state.seed, state.difficulty, state.choice, state.problem);

export const settingsOf = (state: MoState): Record<string, SettingValue> => ({ problem: state.choice, difficulty: state.difficulty });

/* ---------- Actions (each returns the same object when nothing changes) ---------- */

const samePlan = (a: Plan, b: Plan): boolean => JSON.stringify(a) === JSON.stringify(b);

function edit(state: MoState, plan: Plan): MoState {
  if (plan === state.plan || samePlan(plan, state.plan)) return state;
  const undo = [...state.undo, state.plan].slice(-UNDO_LIMIT);
  return { ...state, plan, undo, phase: 'planning' };
}

export function toggleLink(state: MoState, link: number): MoState {
  if (state.problem.kind !== 'network' || !Number.isInteger(link) || link < 0 || link >= state.problem.links.length) return state;
  const built = (state.plan as NetworkPlan).built;
  const next = built.includes(link) ? built.filter((i) => i !== link) : [...built, link].sort((a, b) => a - b);
  return edit(state, { built: next });
}

export function addStop(state: MoState, stop: number): MoState {
  if (state.problem.kind !== 'delivery') return state;
  return edit(state, del.addStop(state.problem, state.plan as DeliveryPlan, stop));
}

export function removeStop(state: MoState, stop: number): MoState {
  if (state.problem.kind !== 'delivery') return state;
  return edit(state, del.removeStop(state.plan as DeliveryPlan, stop));
}

/** Tap on a customer: add it to the current trip, or remove it when it is already planned. */
export function tapStop(state: MoState, stop: number): MoState {
  if (state.problem.kind !== 'delivery') return state;
  return del.tripOf(state.plan as DeliveryPlan, stop) >= 0 ? removeStop(state, stop) : addStop(state, stop);
}

export function newTrip(state: MoState): MoState {
  if (state.problem.kind !== 'delivery') return state;
  return edit(state, del.newTrip(state.problem, state.plan as DeliveryPlan));
}

export function setQty(state: MoState, product: number, q: number): MoState {
  if (state.problem.kind !== 'production') return state;
  return edit(state, prod.setQty(state.problem, state.plan as ProductionPlan, product, q));
}

export function undo(state: MoState): MoState {
  const previous = state.undo[state.undo.length - 1];
  if (!previous) return state;
  return { ...state, plan: previous, undo: state.undo.slice(0, -1), phase: 'planning' };
}

export function clearPlan(state: MoState): MoState {
  return edit(state, emptyPlan(state.problem));
}

/** Checks a feasible plan; `first` is true exactly once per game (then the view reports the natural end). */
export function check(state: MoState): { state: MoState; first: boolean } {
  if (state.phase === 'checked' || !isFeasible(state.problem, state.plan)) return { state, first: false };
  const value = score(state.problem, state.plan);
  const kind = state.problem.kind;
  const bestScore = state.bestScore === null || isBetter(kind, value, state.bestScore) ? value : state.bestScore;
  const next: MoState = { ...state, checks: state.checks + 1, last: { score: value, plan: state.plan }, bestScore, phase: 'checked', reported: true };
  return { state: next, first: !state.reported };
}

/** "Show a best plan" (only after a check). The player's plan is not changed. */
export function reveal(state: MoState): MoState {
  if (state.revealed || state.checks === 0) return state;
  return { ...state, revealed: true };
}

/* ---------- Validation of untrusted saves (never throws) ---------- */

export function isProblem(v: unknown): v is Problem {
  if (!isRecord(v)) return false;
  if (v.kind === 'network') return net.isNetworkProblem(v);
  if (v.kind === 'delivery') return del.isDeliveryProblem(v);
  if (v.kind === 'production') return prod.isProductionProblem(v);
  return false;
}

export function isPlanFor(v: unknown, problem: Problem): v is Plan {
  switch (problem.kind) {
    case 'network':
      return net.isNetworkPlan(v, problem);
    case 'delivery':
      return del.isDeliveryPlan(v, problem);
    case 'production':
      return prod.isProductionPlan(v, problem);
  }
}

export function isMoState(v: unknown): v is MoState {
  try {
    if (!isRecord(v)) return false;
    if (!isInt(v.seed, 0, 0xffff_ffff) || !isOneOf(v.difficulty, DIFFICULTIES) || !isOneOf(v.choice, CHOICES)) return false;
    if (!isProblem(v.problem)) return false;
    const problem = v.problem;
    if (v.choice !== 'any' && v.choice !== problem.kind) return false;
    if (!isPlanFor(v.plan, problem)) return false;
    if (!Array.isArray(v.undo) || v.undo.length > UNDO_LIMIT || !v.undo.every((p) => isPlanFor(p, problem))) return false;
    if (!isInt(v.checks, 0, 1_000_000) || !isOneOf(v.phase, ['planning', 'checked'] as const)) return false;
    if (typeof v.revealed !== 'boolean' || typeof v.reported !== 'boolean') return false;
    if (v.reported !== v.checks > 0 || (v.revealed && v.checks === 0)) return false;
    if (v.checks === 0) {
      if (v.last !== null || v.bestScore !== null || v.phase !== 'planning') return false;
    } else {
      const last = v.last;
      if (!isRecord(last) || !isPlanFor(last.plan, problem) || !isFeasible(problem, last.plan) || last.score !== score(problem, last.plan)) return false;
      if (!isInt(v.bestScore, -1000, 1000)) return false;
      if (isBetter(problem.kind, last.score, v.bestScore)) return false;
      if (v.phase === 'checked' && !samePlan(v.plan, last.plan)) return false;
    }
    return true;
  } catch {
    return false;
  }
}
