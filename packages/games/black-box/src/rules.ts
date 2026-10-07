/**
 * Pure, DOM-free rules for "Black Box" (id `black-box`).
 *
 * A hidden rule maps inputs to outputs. The player runs experiments (chooses an input,
 * sees the output) and, when ready, tests a hypothesis by predicting the outputs of a few
 * challenge inputs. Rules come from small, explicit *families* (data + pure evaluators)
 * with bounded parameter sets and bounded input domains.
 *
 * Every input is encoded as `number[]`: `[x]`, `[x, y]`, a bit vector or a digit list.
 * Outputs are integers, bits (0/1) or digit lists.
 *
 * All transitions are immutable and return the very same object when nothing changed.
 */
import { createRng, createRngFromState, isArrayOf, isInt, isOneOf, isRecord, isUint32, normalizeSeed, type Rng } from '@wp/game-core';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'easy';

/** Usual number of challenge inputs in a hypothesis test. */
export const CHALLENGE_SIZE = 5;
/** Upper bound on challenge inputs (only reached if more are needed to rule out every alternative). */
export const MAX_CHALLENGE_SIZE = 10;
/** Number of seeded sample lists used as challenge candidates for list rules (domain too large to enumerate). */
export const LIST_POOL_SIZE = 400;
/** Domains up to this size are enumerated completely when building a challenge. */
export const ENUMERABLE_LIMIT = 4096;
/** Bound for integer predictions typed by the player. */
export const PREDICTION_LIMIT = 1_000_000_000;

// --- Domains -------------------------------------------------------------------------------

export type InputSpec =
  | { readonly kind: 'int'; readonly min: number; readonly max: number }
  | { readonly kind: 'pair'; readonly min: number; readonly max: number }
  | { readonly kind: 'bits'; readonly count: number }
  | { readonly kind: 'list'; readonly length: number; readonly min: number; readonly max: number };

export type OutputKind = 'int' | 'bool' | 'list';
export type Input = readonly number[];
export type Output = number | readonly number[];

/** Number of numbers in an encoded input. */
export function arity(spec: InputSpec): number {
  switch (spec.kind) {
    case 'int':
      return 1;
    case 'pair':
      return 2;
    case 'bits':
      return spec.count;
    case 'list':
      return spec.length;
  }
}

/** Inclusive bounds of each number of an input. */
export function valueBounds(spec: InputSpec): readonly [number, number] {
  return spec.kind === 'bits' ? [0, 1] : [spec.min, spec.max];
}

export function isValidInput(spec: InputSpec, value: unknown): value is number[] {
  const [min, max] = valueBounds(spec);
  return isArrayOf(value, (v): v is number => isInt(v, min, max), arity(spec));
}

export function domainSize(spec: InputSpec): number {
  const [min, max] = valueBounds(spec);
  return (max - min + 1) ** arity(spec);
}

/** All inputs of a domain in lexicographic order (only sensible for small domains). */
export function enumerateDomain(spec: InputSpec): number[][] {
  const [min, max] = valueBounds(spec);
  let result: number[][] = [[]];
  for (let i = 0; i < arity(spec); i++) {
    const next: number[][] = [];
    for (const prefix of result) for (let v = min; v <= max; v++) next.push([...prefix, v]);
    result = next;
  }
  return result;
}

export function randomInput(spec: InputSpec, rng: Rng): number[] {
  const [min, max] = valueBounds(spec);
  return Array.from({ length: arity(spec) }, () => rng.int(min, max));
}

export const inputKey = (input: Input): string => input.join(',');

// --- Rule families -------------------------------------------------------------------------

export const FAMILY_IDS = [
  'linear',
  'square',
  'mod',
  'step',
  'parity',
  'digitsum',
  'affinemod',
  'pairselect',
  'pairproduct',
  'gate',
  'gates2',
  'majority',
  'filterref',
  'filterconst',
  'sorttake'
] as const;
export type FamilyId = (typeof FAMILY_IDS)[number];

export interface FamilyDef {
  readonly id: FamilyId;
  readonly difficulty: Difficulty;
  readonly input: InputSpec;
  readonly output: OutputKind;
  /** Allowed values for each parameter, in parameter order. */
  readonly ranges: readonly (readonly number[])[];
  /** Excludes degenerate or duplicate combinations of the ranges. */
  readonly allowed?: (params: readonly number[]) => boolean;
  readonly evaluate: (params: readonly number[], input: Input) => Output;
}

const span = (from: number, to: number): number[] => Array.from({ length: to - from + 1 }, (_, i) => from + i);
const at = (values: readonly number[], index: number): number => values[index] as number;

/** Two-input logic gates, by index. */
export const GATES = ['AND', 'OR', 'XOR', 'NAND', 'NOR', 'XNOR'] as const;

export function gate(op: number, a: number, b: number): number {
  switch (op) {
    case 0:
      return a & b;
    case 1:
      return a | b;
    case 2:
      return a ^ b;
    case 3:
      return 1 - (a & b);
    case 4:
      return 1 - (a | b);
    default:
      return 1 - (a ^ b);
  }
}

/** Comparison operators used by list filters: 0 `>`, 1 `<`, 2 `≥`, 3 `≤`. */
export const COMPARATORS = ['>', '<', '≥', '≤'] as const;

export function compare(op: number, a: number, b: number): boolean {
  switch (op) {
    case 0:
      return a > b;
    case 1:
      return a < b;
    case 2:
      return a >= b;
    default:
      return a <= b;
  }
}

export function digitSum(x: number): number {
  let sum = 0;
  for (let rest = Math.abs(x); rest > 0; rest = Math.floor(rest / 10)) sum += rest % 10;
  return sum;
}

/** Mathematical modulo (result in [0, m)). */
export const modulo = (value: number, m: number): number => ((value % m) + m) % m;

const INT_EASY: InputSpec = { kind: 'int', min: 0, max: 20 };
const LIST: InputSpec = { kind: 'list', length: 5, min: 0, max: 9 };
const PAIR: InputSpec = { kind: 'pair', min: 0, max: 9 };

const FAMILY_LIST: readonly FamilyDef[] = [
  // easy -------------------------------------------------------------
  {
    id: 'linear',
    difficulty: 'easy',
    input: INT_EASY,
    output: 'int',
    // f(x) = a·x + b
    ranges: [[-3, -2, 2, 3, 4, 5], span(-5, 10)],
    evaluate: (p, [x]) => at(p, 0) * (x as number) + at(p, 1)
  },
  {
    id: 'square',
    difficulty: 'easy',
    input: INT_EASY,
    output: 'int',
    // f(x) = x² + c
    ranges: [span(-5, 10)],
    evaluate: (p, [x]) => (x as number) * (x as number) + at(p, 0)
  },
  {
    id: 'mod',
    difficulty: 'easy',
    input: INT_EASY,
    output: 'int',
    // f(x) = x mod k
    ranges: [span(2, 9)],
    evaluate: (p, [x]) => modulo(x as number, at(p, 0))
  },
  {
    id: 'step',
    difficulty: 'easy',
    input: INT_EASY,
    output: 'int',
    // f(x) = lo for x < t, hi for x ≥ t
    ranges: [span(2, 18), span(0, 9), span(0, 9)],
    allowed: (p) => at(p, 1) !== at(p, 2),
    evaluate: (p, [x]) => ((x as number) >= at(p, 0) ? at(p, 2) : at(p, 1))
  },
  // medium -----------------------------------------------------------
  {
    id: 'parity',
    difficulty: 'medium',
    input: { kind: 'int', min: 0, max: 30 },
    output: 'int',
    // even x: x / 2; odd x: a·x + b
    ranges: [[2, 3, 4, 5], span(-3, 5)],
    evaluate: (p, [x]) => ((x as number) % 2 === 0 ? (x as number) / 2 : at(p, 0) * (x as number) + at(p, 1))
  },
  {
    id: 'digitsum',
    difficulty: 'medium',
    input: { kind: 'int', min: 0, max: 99 },
    output: 'int',
    // f(x) = m·S(x) + c, S = digit sum
    ranges: [[1, 2, 3], span(0, 5)],
    evaluate: (p, [x]) => at(p, 0) * digitSum(x as number) + at(p, 1)
  },
  {
    id: 'affinemod',
    difficulty: 'medium',
    input: { kind: 'int', min: 0, max: 30 },
    output: 'int',
    // f(x) = (a·x + b) mod m
    ranges: [span(1, 8), span(0, 8), span(3, 9)],
    allowed: (p) => at(p, 0) < at(p, 2) && at(p, 1) < at(p, 2),
    evaluate: (p, [x]) => modulo(at(p, 0) * (x as number) + at(p, 1), at(p, 2))
  },
  {
    id: 'pairselect',
    difficulty: 'medium',
    input: PAIR,
    output: 'int',
    // f(x, y) = op(x, y) + c, op ∈ {max, min, |x − y|}
    ranges: [[0, 1, 2], span(0, 5)],
    evaluate: (p, [x, y]) => {
      const a = x as number;
      const b = y as number;
      const base = at(p, 0) === 0 ? Math.max(a, b) : at(p, 0) === 1 ? Math.min(a, b) : Math.abs(a - b);
      return base + at(p, 1);
    }
  },
  {
    id: 'pairproduct',
    difficulty: 'medium',
    input: PAIR,
    output: 'int',
    // f(x, y) = x·y + a·x + b·y + c
    ranges: [span(-2, 2), span(-2, 2), span(0, 3)],
    evaluate: (p, [x, y]) => (x as number) * (y as number) + at(p, 0) * (x as number) + at(p, 1) * (y as number) + at(p, 2)
  },
  // hard -------------------------------------------------------------
  {
    id: 'gate',
    difficulty: 'hard',
    input: { kind: 'bits', count: 4 },
    output: 'bool',
    // f = b_i OP b_j
    ranges: [span(0, 5), span(0, 3), span(0, 3)],
    allowed: (p) => at(p, 1) < at(p, 2),
    evaluate: (p, bits) => gate(at(p, 0), at(bits, at(p, 1)), at(bits, at(p, 2)))
  },
  {
    id: 'gates2',
    difficulty: 'hard',
    input: { kind: 'bits', count: 3 },
    output: 'bool',
    // f = (b_i OP1 b_j) OP2 b_k, where k is a parameter and i < j are the other two bits
    ranges: [span(0, 2), span(0, 2), span(0, 2)],
    evaluate: (p, bits) => {
      const k = at(p, 2);
      const [i, j] = otherBits(k);
      return gate(at(p, 1), gate(at(p, 0), at(bits, i), at(bits, j)), at(bits, k));
    }
  },
  {
    id: 'majority',
    difficulty: 'hard',
    input: { kind: 'bits', count: 4 },
    output: 'bool',
    // f = majority of the three bits other than b_skip, optionally inverted
    ranges: [span(0, 3), [0, 1]],
    evaluate: (p, bits) => {
      let ones = 0;
      for (let i = 0; i < bits.length; i++) if (i !== at(p, 0)) ones += at(bits, i);
      const majority = ones >= 2 ? 1 : 0;
      return at(p, 1) === 1 ? 1 - majority : majority;
    }
  },
  {
    id: 'filterref',
    difficulty: 'hard',
    input: LIST,
    output: 'list',
    // keep every element e with compare(e, reference), reference = first (0) or last (1) element
    ranges: [span(0, 3), [0, 1]],
    evaluate: (p, list) => {
      const ref = at(list, at(p, 1) === 0 ? 0 : list.length - 1);
      return list.filter((e) => compare(at(p, 0), e, ref));
    }
  },
  {
    id: 'filterconst',
    difficulty: 'hard',
    input: LIST,
    output: 'list',
    // keep every element e with e > t (0) or e < t (1)
    ranges: [[0, 1], span(1, 8)],
    evaluate: (p, list) => list.filter((e) => compare(at(p, 0), e, at(p, 1)))
  },
  {
    id: 'sorttake',
    difficulty: 'hard',
    input: LIST,
    output: 'list',
    // sort ascending (0) or descending (1), keep the first m elements
    ranges: [[0, 1], span(1, 5)],
    evaluate: (p, list) => [...list].sort((a, b) => (at(p, 0) === 0 ? a - b : b - a)).slice(0, at(p, 1))
  }
];

/** The two bit indices of a 3-bit input other than `k`, ascending. */
export function otherBits(k: number): [number, number] {
  const rest = [0, 1, 2].filter((i) => i !== k);
  return [rest[0] as number, rest[1] as number];
}

export const FAMILIES: Readonly<Record<FamilyId, FamilyDef>> = Object.fromEntries(FAMILY_LIST.map((f) => [f.id, f])) as Record<FamilyId, FamilyDef>;

export function familiesFor(difficulty: Difficulty): FamilyId[] {
  return FAMILY_LIST.filter((f) => f.difficulty === difficulty).map((f) => f.id);
}

function cartesian(ranges: readonly (readonly number[])[]): number[][] {
  let result: number[][] = [[]];
  for (const range of ranges) result = result.flatMap((prefix) => range.map((v) => [...prefix, v]));
  return result;
}

const PARAMS: Readonly<Record<FamilyId, readonly (readonly number[])[]>> = Object.fromEntries(
  FAMILY_LIST.map((f) => [f.id, cartesian(f.ranges).filter((p) => f.allowed?.(p) ?? true)])
) as Record<FamilyId, number[][]>;

/** Every allowed parameterization of a family, in a fixed order. */
export function familyParams(id: FamilyId): readonly (readonly number[])[] {
  return PARAMS[id];
}

export const sameNumbers = (a: readonly number[], b: readonly number[]): boolean => a.length === b.length && a.every((v, i) => v === b[i]);

export function isFamilyId(value: unknown): value is FamilyId {
  return isOneOf(value, FAMILY_IDS);
}

export function isValidParams(id: FamilyId, value: unknown): value is number[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'number') && PARAMS[id].some((p) => sameNumbers(p, value as number[]));
}

export function sameOutput(a: Output | null, b: Output | null): boolean {
  if (typeof a === 'number' || typeof b === 'number' || a === null || b === null) return a === b;
  return sameNumbers(a, b);
}

export interface Rule {
  readonly family: FamilyId;
  readonly params: readonly number[];
}

export function evaluate(rule: Rule, input: Input): Output {
  return FAMILIES[rule.family].evaluate(rule.params, input);
}

/** Picks a family of the difficulty and one of its parameterizations. */
export function generateRule(rng: Rng, difficulty: Difficulty): Rule {
  const family = rng.pick(familiesFor(difficulty));
  return { family, params: [...rng.pick(PARAMS[family])] };
}

// --- Predictions ---------------------------------------------------------------------------

export type Prediction = number | number[];

export function isValidPrediction(family: FamilyId, value: unknown): value is Prediction {
  const def = FAMILIES[family];
  switch (def.output) {
    case 'int':
      return isInt(value, -PREDICTION_LIMIT, PREDICTION_LIMIT);
    case 'bool':
      return isInt(value, 0, 1);
    case 'list': {
      if (def.input.kind !== 'list' || !Array.isArray(value) || value.length > def.input.length) return false;
      const { min, max } = def.input;
      return value.every((v) => isInt(v, min, max));
    }
  }
}

// --- Challenge construction ----------------------------------------------------------------

/** Candidate challenge inputs: the whole domain when small, otherwise a seeded sample. */
export function candidatePool(spec: InputSpec, rng: Rng): number[][] {
  if (domainSize(spec) <= ENUMERABLE_LIMIT) return enumerateDomain(spec);
  const seen = new Set<string>();
  const pool: number[][] = [];
  for (let i = 0; i < LIST_POOL_SIZE; i++) {
    const input = randomInput(spec, rng);
    const key = inputKey(input);
    if (seen.has(key)) continue;
    seen.add(key);
    pool.push(input);
  }
  return pool;
}

/**
 * Builds the inputs of a hypothesis test.
 *
 * Guarantee (for enumerable domains; for list rules relative to a seeded sample of
 * {@link LIST_POOL_SIZE} lists): every other parameterization of the hidden rule's family
 * that agrees with all logged inputs, yet differs from the hidden rule somewhere in the
 * domain, gives a different output than the hidden rule on at least one challenge input —
 * so a player whose hypothesis is such an alternative cannot pass. This needs at most
 * {@link MAX_CHALLENGE_SIZE} inputs (greedy set cover, verified by tests for all families).
 * Remaining slots up to {@link CHALLENGE_SIZE} first rule out other family members too,
 * then are filled with random untried inputs, and only when the domain is exhausted with
 * already logged ones.
 */
export function buildChallenge(rule: Rule, logged: readonly Input[], rng: Rng): number[][] {
  const def = FAMILIES[rule.family];
  const tried = new Set(logged.map(inputKey));
  const pool = candidatePool(def.input, rng).filter((input) => !tried.has(inputKey(input)));
  const truth = pool.map((input) => evaluate(rule, input));

  const consistent: boolean[] = [];
  const differs: number[][] = [];
  for (const params of PARAMS[rule.family]) {
    if (sameNumbers(params, rule.params)) continue;
    const alt: Rule = { family: rule.family, params };
    const indices: number[] = [];
    pool.forEach((input, i) => {
      if (!sameOutput(evaluate(alt, input), truth[i] as Output)) indices.push(i);
    });
    if (indices.length === 0) continue;
    differs.push(indices);
    consistent.push(logged.every((input) => sameOutput(evaluate(alt, input), evaluate(rule, input))));
  }

  const chosen: number[] = [];
  const cover = (targets: number[][], limit: number) => {
    let open = targets.map((indices) => new Set(indices));
    while (open.length > 0 && chosen.length < limit) {
      const counts = new Map<number, number>();
      for (const set of open) for (const i of set) counts.set(i, (counts.get(i) ?? 0) + 1);
      let best = 0;
      for (const count of counts.values()) best = Math.max(best, count);
      const ties = [...counts.keys()].filter((i) => counts.get(i) === best).sort((a, b) => a - b);
      const pick = rng.pick(ties);
      chosen.push(pick);
      open = open.filter((set) => !set.has(pick));
    }
  };
  cover(differs.filter((_, i) => consistent[i]), MAX_CHALLENGE_SIZE);
  cover(differs.filter((indices, i) => !consistent[i] && !indices.some((index) => chosen.includes(index))), CHALLENGE_SIZE);

  const rest = rng.shuffle(pool.map((_, i) => i).filter((i) => !chosen.includes(i)));
  while (chosen.length < CHALLENGE_SIZE && rest.length > 0) chosen.push(rest.shift() as number);

  const inputs = chosen.map((i) => [...(pool[i] as number[])]);
  const fallback = rng.shuffle(logged.map((input) => [...input]));
  while (inputs.length < CHALLENGE_SIZE && fallback.length > 0) inputs.push(fallback.shift() as number[]);
  return rng.shuffle(inputs);
}

// --- State ---------------------------------------------------------------------------------

export type LogSource = 'experiment' | 'test';

export interface LogEntry {
  input: number[];
  /** `experiment`: run by the player; `test`: revealed by a failed hypothesis test. */
  source: LogSource;
}

export interface Challenge {
  inputs: number[][];
  /** The player's predictions so far; `null` = not answered yet. */
  predictions: (Prediction | null)[];
}

export interface Attempt {
  inputs: number[][];
  predictions: Prediction[];
}

export interface BlackBoxState {
  seed: number;
  difficulty: Difficulty;
  family: FamilyId;
  params: number[];
  /** PRNG state used for challenge construction. */
  rng: number;
  log: LogEntry[];
  /** Input currently set up in the experiment panel. */
  draft: number[];
  /** Open hypothesis test, if any. */
  challenge: Challenge | null;
  /** The most recent submitted test, shown until the next one starts. */
  lastAttempt: Attempt | null;
  attempts: number;
  hintUsed: boolean;
  solved: boolean;
}

export type Phase = 'experimenting' | 'testing' | 'solved';

export function isDifficulty(value: unknown): value is Difficulty {
  return isOneOf(value, DIFFICULTIES);
}

export function toDifficulty(value: string | undefined): Difficulty {
  return isDifficulty(value) ? value : DEFAULT_DIFFICULTY;
}

export const ruleOf = (state: Pick<BlackBoxState, 'family' | 'params'>): Rule => ({ family: state.family, params: state.params });
export const familyOf = (state: Pick<BlackBoxState, 'family'>): FamilyDef => FAMILIES[state.family];

export function phaseOf(state: BlackBoxState): Phase {
  if (state.solved) return 'solved';
  return state.challenge ? 'testing' : 'experimenting';
}

export function experimentCount(state: BlackBoxState): number {
  return state.log.filter((entry) => entry.source === 'experiment').length;
}

/** Index of the log entry with this input, or -1. */
export function findLogIndex(state: BlackBoxState, input: Input): number {
  const key = inputKey(input);
  return state.log.findIndex((entry) => inputKey(entry.input) === key);
}

export function createInitialState(seed: number, difficulty: Difficulty = DEFAULT_DIFFICULTY): BlackBoxState {
  const rng = createRng(seed);
  const rule = generateRule(rng, difficulty);
  const spec = FAMILIES[rule.family].input;
  const draft = spec.kind === 'list' ? randomInput(spec, rng) : Array.from({ length: arity(spec) }, () => valueBounds(spec)[0]);
  return {
    seed: normalizeSeed(seed),
    difficulty,
    family: rule.family,
    params: [...rule.params],
    rng: rng.state(),
    log: [],
    draft,
    challenge: null,
    lastAttempt: null,
    attempts: 0,
    hintUsed: false,
    solved: false
  };
}

/** Sets one number of the experiment input. Ignores out-of-range values. */
export function setDraftValue(state: BlackBoxState, index: number, value: number): BlackBoxState {
  if (phaseOf(state) !== 'experimenting' || !isInt(index, 0, state.draft.length - 1) || state.draft[index] === value) return state;
  const draft = [...state.draft];
  draft[index] = value;
  return isValidInput(familyOf(state).input, draft) ? { ...state, draft } : state;
}

/** Runs the drafted input. Inputs already in the log are not run again. */
export function runExperiment(state: BlackBoxState): BlackBoxState {
  if (phaseOf(state) !== 'experimenting' || findLogIndex(state, state.draft) >= 0) return state;
  return { ...state, log: [...state.log, { input: [...state.draft], source: 'experiment' }] };
}

export function useHint(state: BlackBoxState): BlackBoxState {
  return state.hintUsed || state.solved ? state : { ...state, hintUsed: true };
}

/** Opens a hypothesis test with seeded challenge inputs. */
export function startTest(state: BlackBoxState): BlackBoxState {
  if (phaseOf(state) !== 'experimenting') return state;
  const rng = createRngFromState(state.rng);
  const inputs = buildChallenge(ruleOf(state), state.log.map((entry) => entry.input), rng);
  return { ...state, rng: rng.state(), challenge: { inputs, predictions: inputs.map(() => null) }, lastAttempt: null };
}

/** Closes the open test without counting it. */
export function cancelTest(state: BlackBoxState): BlackBoxState {
  return phaseOf(state) === 'testing' ? { ...state, challenge: null } : state;
}

export function setPrediction(state: BlackBoxState, index: number, value: Prediction | null): BlackBoxState {
  const challenge = state.challenge;
  if (!challenge || state.solved || !isInt(index, 0, challenge.inputs.length - 1)) return state;
  if (value !== null && !isValidPrediction(state.family, value)) return state;
  if (sameOutput(challenge.predictions[index] ?? null, value)) return state;
  const predictions = [...challenge.predictions];
  predictions[index] = typeof value === 'number' || value === null ? value : [...value];
  return { ...state, challenge: { ...challenge, predictions } };
}

export function canSubmit(state: BlackBoxState): boolean {
  return phaseOf(state) === 'testing' && (state.challenge?.predictions.every((p) => p !== null) ?? false);
}

/** Which predictions of an attempt match the hidden rule. */
export function attemptResults(state: Pick<BlackBoxState, 'family' | 'params'>, attempt: Attempt): boolean[] {
  return attempt.inputs.map((input, i) => sameOutput(attempt.predictions[i] ?? null, evaluate(ruleOf(state), input)));
}

/**
 * Checks all predictions. All correct → solved. Otherwise every challenge input not yet in
 * the log is added to it together with its true output (extra information, no penalty).
 */
export function submitTest(state: BlackBoxState): BlackBoxState {
  if (!canSubmit(state) || !state.challenge) return state;
  const attempt: Attempt = { inputs: state.challenge.inputs.map((i) => [...i]), predictions: state.challenge.predictions as Prediction[] };
  const solved = attemptResults(state, attempt).every(Boolean);
  const log = [...state.log];
  if (!solved) {
    for (const input of attempt.inputs) {
      if (!log.some((entry) => sameNumbers(entry.input, input))) log.push({ input: [...input], source: 'test' });
    }
  }
  return { ...state, log, challenge: null, lastAttempt: attempt, attempts: state.attempts + 1, solved };
}

// --- Validation ----------------------------------------------------------------------------

const STATE_KEYS = ['seed', 'difficulty', 'family', 'params', 'rng', 'log', 'draft', 'challenge', 'lastAttempt', 'attempts', 'hintUsed', 'solved'];

function distinctInputs(inputs: readonly Input[]): boolean {
  return new Set(inputs.map(inputKey)).size === inputs.length;
}

/** Structural validation of untrusted data. Never throws. */
export function isBlackBoxState(value: unknown): value is BlackBoxState {
  try {
    return checkState(value);
  } catch {
    return false;
  }
}

function checkState(value: unknown): boolean {
  if (!isRecord(value) || !STATE_KEYS.every((key) => key in value)) return false;
  const v = value;
  if (!isUint32(v.seed) || !isDifficulty(v.difficulty) || !isFamilyId(v.family) || !isUint32(v.rng)) return false;
  const def = FAMILIES[v.family];
  if (def.difficulty !== v.difficulty || !isValidParams(v.family, v.params)) return false;
  if (typeof v.hintUsed !== 'boolean' || typeof v.solved !== 'boolean' || !isInt(v.attempts, 0, 1_000_000)) return false;
  if (!isValidInput(def.input, v.draft)) return false;

  if (!Array.isArray(v.log) || v.log.length > domainSize(def.input)) return false;
  for (const entry of v.log as unknown[]) {
    if (!isRecord(entry) || !isValidInput(def.input, entry.input) || !isOneOf(entry.source, ['experiment', 'test'] as const)) return false;
  }
  const log = v.log as LogEntry[];
  if (!distinctInputs(log.map((entry) => entry.input))) return false;

  const family = v.family;
  const inputsOk = (inputs: unknown): inputs is number[][] =>
    Array.isArray(inputs) && inputs.length >= 1 && inputs.length <= MAX_CHALLENGE_SIZE && inputs.every((i) => isValidInput(def.input, i)) && distinctInputs(inputs as number[][]);

  if (v.challenge !== null) {
    const c = v.challenge;
    if (v.solved || !isRecord(c) || !inputsOk(c.inputs) || !Array.isArray(c.predictions) || c.predictions.length !== c.inputs.length) return false;
    if (!c.predictions.every((p) => p === null || isValidPrediction(family, p))) return false;
  }

  if (v.lastAttempt === null) return !v.solved;
  const a = v.lastAttempt;
  if (!isRecord(a) || !inputsOk(a.inputs) || !Array.isArray(a.predictions) || a.predictions.length !== a.inputs.length) return false;
  if (!a.predictions.every((p) => isValidPrediction(family, p)) || v.attempts < 1 || v.challenge !== null) return false;
  const allCorrect = attemptResults({ family, params: v.params as number[] }, a as unknown as Attempt).every(Boolean);
  if (allCorrect !== v.solved) return false;
  // A failed test reveals its inputs: all of them must be in the log.
  return v.solved || a.inputs.every((input) => log.some((entry) => sameNumbers(entry.input, input)));
}
