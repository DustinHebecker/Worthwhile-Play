/**
 * Rule Hunt — pure game logic (no DOM).
 *
 * A hidden rule says which triples of whole numbers "fit". The player sees one example
 * that fits, tests own triples (Yes/No) and finally picks the rule from a short list of
 * candidates that are all consistent with the example (the classic "2-4-6" task).
 */
import { createRng, isArrayOf, isInt, isOneOf, isRecord, isUint32 } from '@wp/game-core';

export const MIN_VALUE = 1;
export const MAX_VALUE = 20;
/** Upper bound for the log so persisted states stay small and validation is cheap. */
export const MAX_LOG = 300;
export const MIN_CANDIDATES = 5;
export const MAX_CANDIDATES = 8;

export type Triple = [number, number, number];

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'easy';

const even = (n: number) => n % 2 === 0;

/** Every rule as data: id, the difficulty that introduces it and a pure predicate. */
export const RULES = [
  { id: 'ascending', level: 0, test: ([a, b, c]: Triple) => a < b && b < c },
  { id: 'descending', level: 0, test: ([a, b, c]: Triple) => a > b && b > c },
  { id: 'allEven', level: 0, test: ([a, b, c]: Triple) => even(a) && even(b) && even(c) },
  { id: 'allOdd', level: 0, test: ([a, b, c]: Triple) => !even(a) && !even(b) && !even(c) },
  { id: 'allDifferent', level: 0, test: ([a, b, c]: Triple) => a !== b && b !== c && a !== c },
  { id: 'firstSmallest', level: 0, test: ([a, b, c]: Triple) => a < b && a < c },
  { id: 'firstLargest', level: 0, test: ([a, b, c]: Triple) => a > b && a > c },
  { id: 'lastLargest', level: 0, test: ([a, b, c]: Triple) => c > a && c > b },
  { id: 'allBelow10', level: 0, test: ([a, b, c]: Triple) => a < 10 && b < 10 && c < 10 },
  { id: 'sum12', level: 1, test: ([a, b, c]: Triple) => a + b + c === 12 },
  { id: 'sumEven', level: 1, test: ([a, b, c]: Triple) => even(a + b + c) },
  { id: 'middleLargest', level: 1, test: ([a, b, c]: Triple) => b > a && b > c },
  { id: 'stepTwo', level: 1, test: ([a, b, c]: Triple) => b === a + 2 && c === b + 2 },
  { id: 'equalSteps', level: 2, test: ([a, b, c]: Triple) => b - a === c - b },
  { id: 'lastIsSum', level: 2, test: ([a, b, c]: Triple) => c === a + b },
  { id: 'sumMultipleOf3', level: 2, test: ([a, b, c]: Triple) => (a + b + c) % 3 === 0 },
  { id: 'nonDecreasing', level: 2, test: ([a, b, c]: Triple) => a <= b && b <= c }
] as const;

export type RuleId = (typeof RULES)[number]['id'];
export const RULE_IDS: readonly RuleId[] = RULES.map((r) => r.id);

export interface LogEntry {
  triple: Triple;
  fits: boolean;
  /** `test`: the player's own test. `counter`: shown after a wrong guess. */
  source: 'test' | 'counter';
}

export interface RuleDiscoveryState {
  seed: number;
  difficulty: Difficulty;
  rule: RuleId;
  example: Triple;
  candidates: RuleId[];
  log: LogEntry[];
  draft: Triple;
  /** Candidates guessed wrongly, in order. */
  wrong: RuleId[];
  solved: boolean;
}

export const toDifficulty = (value: unknown): Difficulty => (isOneOf(value, DIFFICULTIES) ? value : DEFAULT_DIFFICULTY);

export function fits(rule: RuleId, triple: Triple): boolean {
  const def = RULES.find((r) => r.id === rule);
  return def ? def.test(triple) : false;
}

/** Rules available at a difficulty (cumulative: harder levels add rule families). */
export function rulePool(difficulty: Difficulty): RuleId[] {
  const level = DIFFICULTIES.indexOf(difficulty);
  return RULES.filter((r) => r.level <= level).map((r) => r.id);
}

/** All triples of the domain in lexicographic order. */
export function allTriples(): Triple[] {
  const result: Triple[] = [];
  for (let a = MIN_VALUE; a <= MAX_VALUE; a++)
    for (let b = MIN_VALUE; b <= MAX_VALUE; b++) for (let c = MIN_VALUE; c <= MAX_VALUE; c++) result.push([a, b, c]);
  return result;
}

export const sameTriple = (x: Triple, y: Triple) => x[0] === y[0] && x[1] === y[1] && x[2] === y[2];

/** Other pool rules that the triple also satisfies. */
export function consistentOthers(rule: RuleId, triple: Triple, pool: readonly RuleId[]): RuleId[] {
  return pool.filter((id) => id !== rule && fits(id, triple));
}

/** Triples that fit `rule` and at least `MIN_CANDIDATES - 1` other pool rules (so a full candidate list exists). */
export function exampleChoices(rule: RuleId, pool: readonly RuleId[]): Triple[] {
  return allTriples().filter((t) => fits(rule, t) && consistentOthers(rule, t, pool).length >= MIN_CANDIDATES - 1);
}

export function createInitialState(seed: number, difficulty: Difficulty = DEFAULT_DIFFICULTY): RuleDiscoveryState {
  const rng = createRng(seed);
  const pool = rulePool(difficulty);
  const rule = rng.pick(pool);
  const example = rng.pick(exampleChoices(rule, pool));
  const others = rng.shuffle(consistentOthers(rule, example, pool)).slice(0, MAX_CANDIDATES - 1);
  const candidates = rng.shuffle([rule, ...others]);
  return {
    seed: seed >>> 0,
    difficulty,
    rule,
    example: [...example],
    candidates,
    log: [],
    draft: [...example],
    wrong: [],
    solved: false
  };
}

export const isValue = (n: unknown): n is number => isInt(n, MIN_VALUE, MAX_VALUE);
export const isTriple = (value: unknown): value is Triple => isArrayOf(value, isValue, 3);

export const playerTests = (state: RuleDiscoveryState) => state.log.filter((e) => e.source === 'test');
export const testCount = (state: RuleDiscoveryState) => playerTests(state).length;
export const guessCount = (state: RuleDiscoveryState) => state.wrong.length + (state.solved ? 1 : 0);

/** Index of the triple in the log, or -1. */
export const findLogIndex = (state: RuleDiscoveryState, triple: Triple) => state.log.findIndex((e) => sameTriple(e.triple, triple));

export const canTest = (state: RuleDiscoveryState) =>
  !state.solved && state.log.length < MAX_LOG && isTriple(state.draft) && findLogIndex(state, state.draft) < 0;

export function setDraft(state: RuleDiscoveryState, index: number, value: number): RuleDiscoveryState {
  if (state.solved || !isInt(index, 0, 2) || !isValue(value) || state.draft[index] === value) return state;
  const draft: Triple = [...state.draft];
  draft[index] = value;
  return { ...state, draft };
}

/** Tests the current draft triple. Returns the same state when the test is not allowed (solved, duplicate, full). */
export function runTest(state: RuleDiscoveryState): RuleDiscoveryState {
  if (!canTest(state)) return state;
  const triple: Triple = [...state.draft];
  return { ...state, log: [...state.log, { triple, fits: fits(state.rule, triple), source: 'test' }] };
}

/**
 * A triple on which `a` and `b` disagree: the one closest to `near` (L1 distance),
 * ties broken lexicographically, preferring triples not in `avoid`. `null` if the rules agree everywhere.
 */
export function distinguishingTriple(a: RuleId, b: RuleId, near: Triple, avoid: readonly Triple[] = []): Triple | null {
  let best: Triple | null = null;
  let bestScore = Infinity;
  for (const t of allTriples()) {
    if (fits(a, t) === fits(b, t)) continue;
    const distance = Math.abs(t[0] - near[0]) + Math.abs(t[1] - near[1]) + Math.abs(t[2] - near[2]);
    const score = distance + (avoid.some((x) => sameTriple(x, t)) ? 1000 : 0);
    if (score < bestScore) {
      best = t;
      bestScore = score;
    }
  }
  return best;
}

export type GuessOutcome = 'correct' | 'wrong' | 'ignored';

/** Guess a candidate. Wrong guesses add a distinguishing counter-example to the log. */
export function guess(state: RuleDiscoveryState, rule: RuleId): { state: RuleDiscoveryState; outcome: GuessOutcome } {
  if (state.solved || !state.candidates.includes(rule) || state.wrong.includes(rule)) return { state, outcome: 'ignored' };
  if (rule === state.rule) return { state: { ...state, solved: true }, outcome: 'correct' };
  const triple = distinguishingTriple(rule, state.rule, state.example, [state.example, ...state.log.map((e) => e.triple)]);
  const log = triple && state.log.length < MAX_LOG ? [...state.log, { triple, fits: fits(state.rule, triple), source: 'counter' as const }] : state.log;
  return { state: { ...state, log, wrong: [...state.wrong, rule] }, outcome: 'wrong' };
}

/** Candidates consistent with the example and the first `upTo` log entries. */
export function aliveCandidates(state: RuleDiscoveryState, upTo = state.log.length): RuleId[] {
  const evidence = state.log.slice(0, upTo);
  return state.candidates.filter((id) => fits(id, state.example) && evidence.every((e) => fits(id, e.triple) === e.fits));
}

/** For each log entry: how many still-possible candidates it ruled out (its value of information). */
export function ruledOutCounts(state: RuleDiscoveryState): number[] {
  return state.log.map((_, i) => aliveCandidates(state, i).length - aliveCandidates(state, i + 1).length);
}

export type Insight =
  | { kind: 'untested' }
  | { kind: 'confirmOnly'; tests: number }
  | { kind: 'falsifying'; tests: number; falsifying: number };

/**
 * Confirmation-bias feedback for a hypothesis: how many of the player's tests were triples the
 * hypothesis says "No" to — the only kind of test that could have proven it wrong.
 */
export function insightFor(state: RuleDiscoveryState, hypothesis: RuleId): Insight {
  const tests = playerTests(state);
  if (tests.length === 0) return { kind: 'untested' };
  const falsifying = tests.filter((e) => !fits(hypothesis, e.triple)).length;
  return falsifying === 0 ? { kind: 'confirmOnly', tests: tests.length } : { kind: 'falsifying', tests: tests.length, falsifying };
}

/** The hypothesis to reflect on right now: the true rule once solved, the last wrong guess right after it. */
export function currentHypothesis(state: RuleDiscoveryState): RuleId | null {
  if (state.solved) return state.rule;
  const last = state.log[state.log.length - 1];
  return last?.source === 'counter' ? (state.wrong[state.wrong.length - 1] ?? null) : null;
}

const isRuleId = (value: unknown): value is RuleId => isOneOf(value, RULE_IDS);
const unique = (items: readonly unknown[]) => new Set(items).size === items.length;

function isLogEntry(value: unknown): value is LogEntry {
  return isRecord(value) && isTriple(value.triple) && typeof value.fits === 'boolean' && isOneOf(value.source, ['test', 'counter'] as const);
}

/** Structural and cross-field validation of untrusted data. Never throws. */
export function isRuleDiscoveryState(value: unknown): value is RuleDiscoveryState {
  try {
    if (!isRecord(value)) return false;
    const { seed, difficulty, rule, example, candidates, log, draft, wrong, solved } = value;
    if (!isUint32(seed) || !isOneOf(difficulty, DIFFICULTIES) || !isRuleId(rule) || typeof solved !== 'boolean') return false;
    if (!isTriple(example) || !isTriple(draft) || !fits(rule, example)) return false;
    const pool = rulePool(difficulty);
    if (!pool.includes(rule)) return false;
    if (!isArrayOf(candidates, isRuleId) || candidates.length < MIN_CANDIDATES || candidates.length > MAX_CANDIDATES) return false;
    if (!unique(candidates) || !candidates.includes(rule) || !candidates.every((id) => pool.includes(id) && fits(id, example))) return false;
    if (!isArrayOf(wrong, isRuleId) || !unique(wrong) || wrong.includes(rule) || !wrong.every((id) => candidates.includes(id))) return false;
    if (!isArrayOf(log, isLogEntry) || log.length > MAX_LOG) return false;
    if (!log.every((e) => e.fits === fits(rule, e.triple))) return false;
    if (log.filter((e) => e.source === 'counter').length > wrong.length) return false;
    return true;
  } catch {
    return false;
  }
}
