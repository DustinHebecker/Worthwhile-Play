import { createRng, isArrayOf, isInt, isOneOf, isRecord, isUint32, type Rng } from '@wp/game-core';

/**
 * Visual Search: find one target shape among distractors, or decide that it is not there.
 *
 * Shapes differ only in non-colour features: outline shape, fill pattern (solid / outline /
 * striped) and orientation (upright / tilted 45°). A round has a fixed target and TRIALS
 * boards, all derived from the seed, so the logical state only stores the seed, the
 * difficulty, the phase and the answers given so far (the trial index is `answers.length`).
 *
 * Search types (difficulty, easy → hard):
 * - feature:     all distractors are identical and differ from the target in exactly one
 *                feature, so the target "pops out". The target is always present.
 * - conjunction: every distractor shares the target's shape OR its fill (never both), with
 *                both groups present and the same orientation everywhere, so no single
 *                feature identifies the target. Some boards have no target.
 * - similar:     every distractor differs from the target in exactly one of the three
 *                features, with all three kinds present. Some boards have no target.
 *
 * Search times are information only and never needed for correctness: each answer stores the
 * measured time or `null`. The view measures from the moment a board is shown; a board that
 * was interrupted by a pause is stored without a time, and a board shown again after closing
 * and reopening the game is timed from that moment on (the earlier part is simply not counted).
 */

export const DIFFICULTIES = ['feature', 'conjunction', 'similar'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'feature';

export const SHAPES = ['bar', 'triangle', 'cross'] as const;
export type Shape = (typeof SHAPES)[number];
export const FILLS = ['solid', 'outline', 'striped'] as const;
export type Fill = (typeof FILLS)[number];
export const TILTS = ['upright', 'tilted'] as const;
export type Tilt = (typeof TILTS)[number];
export const DIMENSIONS = ['shape', 'fill', 'tilt'] as const;
export type Dimension = (typeof DIMENSIONS)[number];

export interface Features {
  readonly shape: Shape;
  readonly fill: Fill;
  readonly tilt: Tilt;
}

/** Boards per round. */
export const TRIALS = 12;
/** "Not there" answer (instead of an item index). */
export const NOT_THERE = -1;

export interface DifficultyConfig {
  /** Grid of possible item positions. At most 5 columns, so cells stay >= 56 px wide on a 360 px screen. */
  readonly cols: number;
  readonly rows: number;
  /** The two set sizes; each is used on exactly half of the boards. */
  readonly setSizes: readonly [number, number];
  /** Boards without a target, per set size. */
  readonly absentPerSize: number;
}

export const CONFIGS: Readonly<Record<Difficulty, DifficultyConfig>> = {
  feature: { cols: 4, rows: 4, setSizes: [6, 12], absentPerSize: 0 },
  conjunction: { cols: 5, rows: 4, setSizes: [8, 16], absentPerSize: 2 },
  similar: { cols: 5, rows: 5, setSizes: [10, 20], absentPerSize: 2 }
};

/**
 * Geometry in percent of a grid cell: each item is drawn inside a circle of ITEM_DIAMETER
 * (so rotation never enlarges it) whose centre is jittered by at most MAX_JITTER from the
 * cell centre. 72 / 2 + 12 = 48 < 50, so an item never leaves its cell and never overlaps.
 */
export const ITEM_DIAMETER = 72;
export const MAX_JITTER = 12;

export interface Item extends Features {
  /** Grid cell (row-major). Items are sorted by cell. */
  readonly cell: number;
  /** Centre offset from the cell centre, in percent of the cell. */
  readonly dx: number;
  readonly dy: number;
  readonly target: boolean;
}

export interface Trial {
  readonly setSize: number;
  readonly present: boolean;
  /** Sorted by cell, i.e. reading order. */
  readonly items: readonly Item[];
  /** Index into `items`, or NOT_THERE. */
  readonly targetIndex: number;
}

export interface Round {
  readonly difficulty: Difficulty;
  readonly target: Features;
  readonly trials: readonly Trial[];
}

export const PHASES = ['ready', 'running', 'finished'] as const;
export type Phase = (typeof PHASES)[number];

export interface Answer {
  /** Index of the selected item, or NOT_THERE. */
  pick: number;
  /** Measured search time in whole milliseconds, or null when not timed. */
  ms: number | null;
}

export interface SearchState {
  seed: number;
  difficulty: Difficulty;
  phase: Phase;
  /** One answer per finished board; the current board is `answers.length`. */
  answers: Answer[];
}

/** Upper bound for stored times (10 minutes); longer searches are stored as this value. */
export const MAX_MS = 600_000;

export const toDifficulty = (value: unknown): Difficulty => (isOneOf(value, DIFFICULTIES) ? value : DEFAULT_DIFFICULTY);

export const allowsNotThere = (difficulty: Difficulty): boolean => CONFIGS[difficulty].absentPerSize > 0;

/** Feature dimensions in which two shapes differ. */
export function differingDimensions(a: Features, b: Features): Dimension[] {
  return DIMENSIONS.filter((d) => a[d] !== b[d]);
}

const VALUES: { readonly [D in Dimension]: readonly Features[D][] } = { shape: SHAPES, fill: FILLS, tilt: TILTS };

/** The target with one feature replaced by a different value. */
function variant(rng: Rng, target: Features, dimension: Dimension): Features {
  const others = (VALUES[dimension] as readonly string[]).filter((v) => v !== target[dimension]);
  return { ...target, [dimension]: rng.pick(others) };
}

/** Splits `total` into `parts` sizes that differ by at most one (the larger ones at random positions). */
function split(rng: Rng, total: number, parts: number): number[] {
  const base = Math.floor(total / parts);
  const extra = rng.shuffle(Array.from({ length: parts }, (_, i) => (i < total % parts ? 1 : 0)));
  return extra.map((e) => base + e);
}

/** The distractor kinds of one board (one fixed alternative per varied dimension). */
function distractorKinds(rng: Rng, difficulty: Difficulty, target: Features, featureDimension: Dimension): Features[] {
  if (difficulty === 'feature') return [variant(rng, target, featureDimension)];
  if (difficulty === 'conjunction') return [variant(rng, target, 'shape'), variant(rng, target, 'fill')];
  return DIMENSIONS.map((d) => variant(rng, target, d));
}

function buildTrial(rng: Rng, difficulty: Difficulty, target: Features, setSize: number, present: boolean, featureDimension: Dimension): Trial {
  const { cols, rows } = CONFIGS[difficulty];
  const kinds = distractorKinds(rng, difficulty, target, featureDimension);
  const distractorCount = present ? setSize - 1 : setSize;
  const sizes = split(rng, distractorCount, kinds.length);
  const looks: { features: Features; target: boolean }[] = [];
  if (present) looks.push({ features: target, target: true });
  kinds.forEach((kind, k) => {
    for (let i = 0; i < (sizes[k] as number); i++) looks.push({ features: kind, target: false });
  });
  // A uniformly random subset of cells, in random order: the target's cell is uniform over the grid.
  const cells = rng.shuffle(Array.from({ length: cols * rows }, (_, i) => i)).slice(0, setSize);
  const placed: Item[] = looks.map((look, i) => ({
    ...look.features,
    cell: cells[i] as number,
    dx: rng.int(-MAX_JITTER, MAX_JITTER),
    dy: rng.int(-MAX_JITTER, MAX_JITTER),
    target: look.target
  }));
  const items = placed.sort((a, b) => a.cell - b.cell);
  return { setSize, present, items, targetIndex: items.findIndex((item) => item.target) };
}

/** Deterministically generates the round (target and all boards) for a seed and difficulty. */
export function generateRound(seed: number, difficulty: Difficulty): Round {
  const rng = createRng(seed);
  const target: Features = { shape: rng.pick(SHAPES), fill: rng.pick(FILLS), tilt: rng.pick(TILTS) };
  const config = CONFIGS[difficulty];
  const perSize = TRIALS / config.setSizes.length;
  const plan: { setSize: number; present: boolean }[] = [];
  for (const setSize of config.setSizes) {
    for (let i = 0; i < perSize; i++) plan.push({ setSize, present: i >= config.absentPerSize });
  }
  const order = rng.shuffle(plan);
  // Feature search: each dimension is the differing one on an equal share of the boards.
  const featureDimensions = rng.shuffle(Array.from({ length: TRIALS }, (_, i) => DIMENSIONS[i % DIMENSIONS.length] as Dimension));
  const trials = order.map((p, i) => buildTrial(rng, difficulty, target, p.setSize, p.present, featureDimensions[i] as Dimension));
  return { difficulty, target, trials };
}

export function newRound(seed: number, difficulty: Difficulty): SearchState {
  return { seed: seed >>> 0, difficulty, phase: 'ready', answers: [] };
}

export function startRound(state: SearchState): SearchState {
  if (state.phase !== 'ready') return state;
  return { ...state, phase: 'running' };
}

export const currentTrial = (state: SearchState, round: Round): Trial | undefined =>
  state.phase === 'running' ? round.trials[state.answers.length] : undefined;

const normalizeMs = (ms: number | null): number | null =>
  ms === null || !Number.isFinite(ms) ? null : Math.min(MAX_MS, Math.max(0, Math.round(ms)));

/**
 * Records the answer for the current board: an item index or NOT_THERE ("Not there" only
 * where the difficulty has boards without target). Invalid answers return the same state.
 */
export function answerTrial(state: SearchState, round: Round, pick: number, ms: number | null): SearchState {
  const trial = currentTrial(state, round);
  if (!trial) return state;
  const valid = pick === NOT_THERE ? allowsNotThere(state.difficulty) : Number.isInteger(pick) && pick >= 0 && pick < trial.items.length;
  if (!valid) return state;
  const answers = [...state.answers, { pick, ms: normalizeMs(ms) }];
  return { ...state, answers, phase: answers.length >= round.trials.length ? 'finished' : 'running' };
}

export const OUTCOMES = ['found', 'rejected', 'wrongItem', 'missed', 'falseFind'] as const;
export type Outcome = (typeof OUTCOMES)[number];

/**
 * found: target selected; rejected: correctly "Not there"; wrongItem: another shape selected
 * while the target was there; missed: "Not there" although it was there; falseFind: a shape
 * selected although there was no target.
 */
export function outcomeOf(trial: Trial, pick: number): Outcome {
  if (trial.present) {
    if (pick === NOT_THERE) return 'missed';
    return pick === trial.targetIndex ? 'found' : 'wrongItem';
  }
  return pick === NOT_THERE ? 'rejected' : 'falseFind';
}

export const isCorrectOutcome = (outcome: Outcome): boolean => outcome === 'found' || outcome === 'rejected';

/** Median of a non-empty list (mean of the two middle values for even lengths), rounded. */
export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 === 1 ? (sorted[mid] as number) : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
  return Math.round(value);
}

export interface Summary {
  total: number;
  correct: number;
  wrongItem: number;
  missed: number;
  falseFind: number;
  /** Median time of correct, timed answers per set size (ascending set size). */
  medians: { setSize: number; ms: number | null }[];
}

/** Factual summary of the answered boards. */
export function summarize(state: SearchState, round: Round): Summary {
  const counts: Record<Outcome, number> = { found: 0, rejected: 0, wrongItem: 0, missed: 0, falseFind: 0 };
  const times = new Map<number, number[]>();
  state.answers.forEach((answer, i) => {
    const trial = round.trials[i];
    if (!trial) return;
    const outcome = outcomeOf(trial, answer.pick);
    counts[outcome]++;
    if (isCorrectOutcome(outcome) && answer.ms !== null) times.set(trial.setSize, [...(times.get(trial.setSize) ?? []), answer.ms]);
  });
  const sizes = [...CONFIGS[round.difficulty].setSizes].sort((a, b) => a - b);
  return {
    total: state.answers.length,
    correct: counts.found + counts.rejected,
    wrongItem: counts.wrongItem,
    missed: counts.missed,
    falseFind: counts.falseFind,
    medians: sizes.map((setSize) => ({ setSize, ms: median(times.get(setSize) ?? []) }))
  };
}

export const MOVES = ['prev', 'next', 'up', 'down', 'first', 'last'] as const;
export type Move = (typeof MOVES)[number];

/**
 * Keyboard navigation between items (empty cells are skipped). `cells` are the occupied cells
 * in ascending order; returns the new position in `cells` (unchanged at the edges).
 * prev/next follow reading order; up/down go to the nearest row above/below that has items,
 * to the item with the closest column (the lower column on ties).
 */
export function navigate(cells: readonly number[], cols: number, from: number, move: Move): number {
  const last = cells.length - 1;
  if (last < 0) return from;
  if (move === 'first') return 0;
  if (move === 'last') return last;
  if (move === 'prev') return Math.max(0, from - 1);
  if (move === 'next') return Math.min(last, from + 1);
  const cell = cells[from];
  if (cell === undefined) return from;
  const row = Math.floor(cell / cols);
  const col = cell % cols;
  const step = move === 'up' ? -1 : 1;
  const rows = cells.map((c) => Math.floor(c / cols));
  for (let r = row + step; r >= 0 && r <= (rows[last] as number); r += step) {
    let best = -1;
    let bestDistance = Infinity;
    cells.forEach((c, i) => {
      if (rows[i] !== r) return;
      const distance = Math.abs((c % cols) - col);
      if (distance < bestDistance) {
        best = i;
        bestDistance = distance;
      }
    });
    if (best >= 0) return best;
  }
  return from;
}

const isAnswer = (value: unknown): value is Answer =>
  isRecord(value) && isInt(value.pick, NOT_THERE, 1000) && (value.ms === null || isInt(value.ms, 0, MAX_MS));

/** Structural validation of untrusted persisted data. Never throws. */
export function isValidSearchState(value: unknown): value is SearchState {
  if (!isRecord(value)) return false;
  if (!isUint32(value.seed) || !isOneOf(value.difficulty, DIFFICULTIES) || !isOneOf(value.phase, PHASES)) return false;
  if (!isArrayOf(value.answers, isAnswer) || value.answers.length > TRIALS) return false;
  const { phase, answers, difficulty } = value;
  if (phase === 'ready' && answers.length !== 0) return false;
  if (phase === 'running' && answers.length >= TRIALS) return false;
  if (phase === 'finished' && answers.length !== TRIALS) return false;
  if (answers.length === 0) return true;
  try {
    const round = generateRound(value.seed, difficulty);
    return answers.every((answer, i) =>
      answer.pick === NOT_THERE ? allowsNotThere(difficulty) : answer.pick < (round.trials[i]?.items.length ?? 0)
    );
  } catch {
    return false;
  }
}
