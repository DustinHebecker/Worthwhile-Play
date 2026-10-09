import { createRng, isArrayOf, isInt, isOneOf, isRecord, isUint32, type Rng } from '@wp/game-core';

/**
 * N-back: a stream of items (a position in a 3×3 grid and/or a shape). For every item the
 * person decides whether it matches the item N steps back.
 *
 * The whole block is derived from the seed and N, so the logical state only stores the
 * options, the current item index and the answers given so far. Pace "timed" is an opt-in
 * presentation detail of the view; it never changes what a correct answer is.
 */

export const DIFFICULTIES = ['n1', 'n2', 'n3'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'n1';
export const N_OF: Readonly<Record<Difficulty, number>> = { n1: 1, n2: 2, n3: 3 };

export const VARIANTS = ['position', 'symbol', 'dual'] as const;
export type Variant = (typeof VARIANTS)[number];
export const DEFAULT_VARIANT: Variant = 'position';

export const PACES = ['self', 'timed'] as const;
export type Pace = (typeof PACES)[number];
export const DEFAULT_PACE: Pace = 'self';
/** Calm opt-in pace: one item about every three seconds. */
export const TIMED_ITEM_MS = 3000;

export const PHASES = ['ready', 'running', 'finished'] as const;
export type Phase = (typeof PHASES)[number];

/** Items that can be compared (index >= N). The block has N more items in front of them. */
export const SCORED_ITEMS = 20;
/** Exactly this many of the scored items match, per stream (30 %). */
export const MATCHES_PER_STREAM = 6;
/** "Look-alikes" (same as N-1 or N+1 steps back, but not N) per stream; only at 3-back. */
export const LURES_PER_STREAM: Readonly<Record<Difficulty, number>> = { n1: 0, n2: 0, n3: 3 };

export const POSITIONS = 9;
export const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'star', 'cross'] as const;
export type Shape = (typeof SHAPES)[number];
/** Text-presentation glyphs; each shape also has a translated name. */
export const GLYPHS: Readonly<Record<Shape, string>> = {
  circle: '●',
  square: '■',
  triangle: '▲',
  diamond: '◆',
  star: '★',
  cross: '✚'
};

/** Answer bits: which streams the person called a match for an item. */
export const POSITION_BIT = 1;
export const SYMBOL_BIT = 2;
export const VARIANT_MASK: Readonly<Record<Variant, number>> = { position: POSITION_BIT, symbol: SYMBOL_BIT, dual: POSITION_BIT | SYMBOL_BIT };

export interface Item {
  /** Grid cell 0..8, row by row. */
  readonly position: number;
  /** Index into SHAPES. */
  readonly symbol: number;
}

export interface NBackState {
  seed: number;
  difficulty: Difficulty;
  variant: Variant;
  pace: Pace;
  phase: Phase;
  /** Current item while running; 0 when ready; the block length when finished. */
  index: number;
  /** One answer bit mask per closed item (`answers.length === index`); 0 = no match claimed. */
  answers: number[];
  /** Dual variant only: the claims toggled for the current item, not yet confirmed. */
  pending: number;
}

export interface StreamScore {
  /** Scored items that matched. */
  targets: number;
  hits: number;
  misses: number;
  falseAlarms: number;
  correctRejections: number;
}

export const toDifficulty = (value: unknown): Difficulty => (isOneOf(value, DIFFICULTIES) ? value : DEFAULT_DIFFICULTY);
export const toVariant = (value: unknown): Variant => (isOneOf(value, VARIANTS) ? value : DEFAULT_VARIANT);
export const toPace = (value: unknown): Pace => (isOneOf(value, PACES) ? value : DEFAULT_PACE);

export const nOf = (difficulty: Difficulty): number => N_OF[difficulty];
export const blockLength = (difficulty: Difficulty): number => SCORED_ITEMS + nOf(difficulty);

/** Whether item `i` of a stream equals the item `n` steps back. */
export const isMatchAt = (values: readonly number[], i: number, n: number): boolean => i >= n && values[i] === values[i - n];

/** A look-alike: not a match, but equal to the item N-1 (N >= 2) or N+1 steps back. */
export function isLureAt(values: readonly number[], i: number, n: number): boolean {
  if (i < n || isMatchAt(values, i, n)) return false;
  const v = values[i];
  return (n >= 2 && values[i - n + 1] === v) || (i - n - 1 >= 0 && values[i - n - 1] === v);
}

/** Values item `i` must avoid unless it is meant to be a match or a look-alike. */
function lureSources(values: readonly number[], i: number, n: number): number[] {
  const sources: number[] = [];
  if (n >= 2) sources.push(values[i - n + 1] as number);
  if (i - n - 1 >= 0) sources.push(values[i - n - 1] as number);
  return sources;
}

function attemptStream(rng: Rng, length: number, n: number, valueCount: number, lures: number): number[] {
  const order = rng.shuffle(Array.from({ length: length - n }, (_, k) => k + n));
  const matches = new Set(order.slice(0, MATCHES_PER_STREAM));
  // With N = 1 the only look-alike source is the item two back; it needs to exist and must
  // differ from the item one back, which a match there would copy.
  const canLure = (i: number): boolean => n >= 2 || (i >= 2 && !matches.has(i - 1));
  const lureSet = new Set(order.slice(MATCHES_PER_STREAM).filter(canLure).slice(0, lures));
  const values: number[] = [];
  for (let i = 0; i < length; i++) {
    if (matches.has(i)) {
      values.push(values[i - n] as number);
      continue;
    }
    const back = i >= n ? values[i - n] : undefined;
    const sources = i >= n ? lureSources(values, i, n) : [];
    if (lureSet.has(i)) {
      const options = [...new Set(sources)].filter((v) => v !== back);
      if (options.length > 0) {
        values.push(rng.pick(options));
        continue;
      }
    }
    const banned = new Set(back === undefined ? sources : [back, ...sources]);
    values.push(rng.pick(Array.from({ length: valueCount }, (_, v) => v).filter((v) => !banned.has(v))));
  }
  return values;
}

const countWhere = (length: number, test: (i: number) => boolean): number => {
  let count = 0;
  for (let i = 0; i < length; i++) if (test(i)) count++;
  return count;
};

/**
 * One stream of `length` values in [0, valueCount): exactly MATCHES_PER_STREAM matches among
 * the scored items and exactly `lures` look-alikes (a rare dead end is redrawn).
 */
export function generateStream(rng: Rng, length: number, n: number, valueCount: number, lures: number): number[] {
  let values = attemptStream(rng, length, n, valueCount, lures);
  for (let attempt = 1; attempt < 50; attempt++) {
    if (countWhere(length, (i) => isLureAt(values, i, n)) === lures) break;
    values = attemptStream(rng, length, n, valueCount, lures);
  }
  return values;
}

/** Deterministic block for a seed and difficulty (both streams; the variant picks which count). */
export function generateBlock(seed: number, difficulty: Difficulty): Item[] {
  const rng = createRng(seed);
  const length = blockLength(difficulty);
  const n = nOf(difficulty);
  const lures = LURES_PER_STREAM[difficulty];
  const positions = generateStream(rng, length, n, POSITIONS, lures);
  const symbols = generateStream(rng, length, n, SHAPES.length, lures);
  return positions.map((position, i) => ({ position, symbol: symbols[i] as number }));
}

export const positionsOf = (block: readonly Item[]): number[] => block.map((item) => item.position);
export const symbolsOf = (block: readonly Item[]): number[] => block.map((item) => item.symbol);

/** Bit mask of the streams in which item `i` matches the item N steps back. */
export function matchMask(block: readonly Item[], i: number, n: number): number {
  let mask = 0;
  if (isMatchAt(positionsOf(block), i, n)) mask |= POSITION_BIT;
  if (isMatchAt(symbolsOf(block), i, n)) mask |= SYMBOL_BIT;
  return mask;
}

export function newBlock(seed: number, difficulty: Difficulty, variant: Variant = DEFAULT_VARIANT, pace: Pace = DEFAULT_PACE): NBackState {
  return { seed: seed >>> 0, difficulty, variant, pace, phase: 'ready', index: 0, answers: [], pending: 0 };
}

/** Options can be changed before the block starts. */
export function setVariant(state: NBackState, variant: Variant): NBackState {
  return state.phase === 'ready' ? { ...state, variant } : state;
}

export function setPace(state: NBackState, pace: Pace): NBackState {
  return state.phase === 'ready' ? { ...state, pace } : state;
}

export function startBlock(state: NBackState): NBackState {
  return state.phase === 'ready' ? { ...state, phase: 'running', index: 0, answers: [], pending: 0 } : state;
}

/** Whether the current item can be compared (there is an item N steps back). */
export const canCompare = (state: NBackState): boolean => state.phase === 'running' && state.index >= nOf(state.difficulty);

/** Dual variant: toggles a pending claim for the current item. */
export function togglePending(state: NBackState, bit: number): NBackState {
  if (!canCompare(state) || (VARIANT_MASK[state.variant] & bit) === 0 || (bit !== POSITION_BIT && bit !== SYMBOL_BIT)) return state;
  return { ...state, pending: state.pending ^ bit };
}

/**
 * Closes the current item with the claimed matches (a bit mask; bits outside the variant and
 * any claim on an item that cannot be compared are dropped) and moves on to the next item.
 */
export function answer(state: NBackState, claims: number): NBackState {
  if (state.phase !== 'running') return state;
  const value = canCompare(state) ? claims & VARIANT_MASK[state.variant] : 0;
  const index = state.index + 1;
  return {
    ...state,
    index,
    answers: [...state.answers, value],
    pending: 0,
    phase: index >= blockLength(state.difficulty) ? 'finished' : 'running'
  };
}

/** Factual counts for one stream over the closed scored items. */
export function scoreStream(values: readonly number[], answers: readonly number[], bit: number, n: number): StreamScore {
  const result: StreamScore = { targets: 0, hits: 0, misses: 0, falseAlarms: 0, correctRejections: 0 };
  for (let i = n; i < answers.length; i++) {
    const claimed = ((answers[i] as number) & bit) !== 0;
    if (isMatchAt(values, i, n)) {
      result.targets++;
      if (claimed) result.hits++;
      else result.misses++;
    } else if (claimed) result.falseAlarms++;
    else result.correctRejections++;
  }
  return result;
}

export interface BlockScore {
  position?: StreamScore;
  symbol?: StreamScore;
  total: StreamScore;
}

export function scoreBlock(state: NBackState, block: readonly Item[]): BlockScore {
  const n = nOf(state.difficulty);
  const position = state.variant !== 'symbol' ? scoreStream(positionsOf(block), state.answers, POSITION_BIT, n) : undefined;
  const symbol = state.variant !== 'position' ? scoreStream(symbolsOf(block), state.answers, SYMBOL_BIT, n) : undefined;
  const parts = [position, symbol].filter((s): s is StreamScore => s !== undefined);
  const total: StreamScore = { targets: 0, hits: 0, misses: 0, falseAlarms: 0, correctRejections: 0 };
  for (const part of parts) {
    total.targets += part.targets;
    total.hits += part.hits;
    total.misses += part.misses;
    total.falseAlarms += part.falseAlarms;
    total.correctRejections += part.correctRejections;
  }
  return { ...(position ? { position } : {}), ...(symbol ? { symbol } : {}), total };
}

/** Inverse of the standard normal CDF (Acklam's rational approximation, |error| < 1.2e-9). */
export function inverseNormal(p: number): number {
  if (!(p > 0 && p < 1)) return p <= 0 ? -Infinity : Infinity;
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const low = 0.02425;
  const tail = (q: number) =>
    (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) / ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
  if (p < low) return tail(Math.sqrt(-2 * Math.log(p)));
  if (p > 1 - low) return -tail(Math.sqrt(-2 * Math.log(1 - p)));
  const q = p - 0.5;
  const r = q * q;
  return (
    ((((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r + a[5]!) * q) /
    (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1)
  );
}

/**
 * Sensitivity d′ = z(hit rate) − z(false-alarm rate), with the log-linear correction
 * (add 0.5 to each count and 1 to each total) so that perfect rates stay finite.
 * Rounded to two decimals. 0 means chance level.
 */
export function dPrime(score: StreamScore): number {
  const nonTargets = score.falseAlarms + score.correctRejections;
  const hitRate = (score.hits + 0.5) / (score.targets + 1);
  const faRate = (score.falseAlarms + 0.5) / (nonTargets + 1);
  return Math.round((inverseNormal(hitRate) - inverseNormal(faRate)) * 100) / 100;
}

/** Structural validation of untrusted persisted data. Never throws. */
export function isValidNBackState(value: unknown): value is NBackState {
  if (!isRecord(value)) return false;
  const { seed, difficulty, variant, pace, phase, index, answers, pending } = value;
  if (!isUint32(seed) || !isOneOf(difficulty, DIFFICULTIES) || !isOneOf(variant, VARIANTS) || !isOneOf(pace, PACES) || !isOneOf(phase, PHASES)) return false;
  const length = blockLength(difficulty);
  const n = nOf(difficulty);
  const mask = VARIANT_MASK[variant];
  if (!isInt(index, 0, length) || !isInt(pending, 0, 3) || !isArrayOf(answers, (a): a is number => isInt(a, 0, 3))) return false;
  if (answers.length !== index || (pending & ~mask) !== 0) return false;
  if (answers.some((a, i) => (a & ~mask) !== 0 || (i < n && a !== 0))) return false;
  if (phase === 'ready') return index === 0 && pending === 0;
  if (phase === 'finished') return index === length && pending === 0;
  return index < length && (index >= n || pending === 0);
}
