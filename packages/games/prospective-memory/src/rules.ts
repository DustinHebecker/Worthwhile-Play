import { createRng, isArrayOf, isInt, isOneOf, isRecord, isUint32, type Rng } from '@wp/game-core';

/**
 * Keep in Mind (prospective memory practice): sort a calm, self-paced stream of shapes as
 * "round" or "with corners" (the ongoing task) while keeping one or two intentions in mind
 * that were set before the block:
 *
 * - event-based: when the cue appears (a star on easy, a small dot inside an ordinary shape
 *   otherwise), press "Note" instead of sorting that shape;
 * - activity-based (hard only): after a given number of shapes, press "Check in" once.
 *
 * Everything is counted in items, never in wall-clock time. The whole block is derived from
 * the seed; the logical state stores only the seed, the current item, the responses and the
 * items at which "Check in" was pressed.
 */

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'easy';

/** Fixed block: 40 shapes, about 3 minutes at the player's own pace. */
export const ITEM_COUNT = 40;
export const BLOCK_MINUTES = 3;
/** A "Note" given on one of the next LATE_WINDOW shapes after a missed cue counts as late. */
export const LATE_WINDOW = 2;
/** "Check in" counts as on time on the target shape or the CHECK_IN_WINDOW - 1 shapes after it. */
export const CHECK_IN_WINDOW = 2;

export const CUE_KINDS = ['star', 'dot'] as const;
export type CueKind = (typeof CUE_KINDS)[number];

export interface DifficultyConfig {
  /** star: a distinct shape (salient); dot: a small dot inside an ordinary shape (subtle). */
  readonly cueKind: CueKind;
  /** Exact number of cue items per block. */
  readonly cues: number;
  /** Minimum distance between two cue items (index difference). */
  readonly minGap: number;
  /** The first `leadIn` items never carry a cue. */
  readonly leadIn: number;
  /** Activity-based intention: press "Check in" after this many shapes (index of the target item), or null. */
  readonly checkIn: number | null;
}

export const CONFIGS: Readonly<Record<Difficulty, DifficultyConfig>> = {
  easy: { cueKind: 'star', cues: 5, minGap: 5, leadIn: 4, checkIn: null },
  medium: { cueKind: 'dot', cues: 4, minGap: 7, leadIn: 6, checkIn: null },
  hard: { cueKind: 'dot', cues: 3, minGap: 10, leadIn: 8, checkIn: 20 }
};

export const ROUND_SHAPES = ['circle', 'oval'] as const;
export const ANGULAR_SHAPES = ['square', 'triangle', 'diamond', 'hexagon'] as const;
export const SHAPES = [...ROUND_SHAPES, ...ANGULAR_SHAPES, 'star'] as const;
export type Shape = (typeof SHAPES)[number];

export const CATEGORIES = ['round', 'angular'] as const;
export type Category = (typeof CATEGORIES)[number];

export const RESPONSES = ['round', 'angular', 'note'] as const;
export type Response = (typeof RESPONSES)[number];

export interface Item {
  readonly shape: Shape;
  readonly filled: boolean;
  /** Small dot in the middle of the shape (the subtle cue). */
  readonly dot: boolean;
  /** This item is a cue for the event-based intention ("Note"). */
  readonly cue: boolean;
}

export const PHASES = ['ready', 'running', 'finished'] as const;
export type Phase = (typeof PHASES)[number];

export interface ProspectiveState {
  seed: number;
  difficulty: Difficulty;
  phase: Phase;
  /** Current item while running; 0 when ready; ITEM_COUNT when finished. */
  index: number;
  /** answers[i] is the response given to item i (length === index). */
  answers: Response[];
  /** Item indices at which "Check in" was pressed, strictly increasing (hard only). */
  checkIns: number[];
}

export const CHECK_IN_STATUSES = ['none', 'onTime', 'late', 'missed'] as const;
export type CheckInStatus = (typeof CHECK_IN_STATUSES)[number];

export interface ProspectiveScore {
  /** Non-cue items answered so far and how many of them were sorted correctly. */
  ongoingTotal: number;
  ongoingCorrect: number;
  /** Cue items answered so far, split into on time / late / missed. */
  cues: number;
  onTime: number;
  late: number;
  missed: number;
  /** "Note" on a non-cue item that is not a late response to a cue. */
  falseAlarms: number;
  /** Outcome of the activity-based intention ('none' when the difficulty has none). */
  checkIn: CheckInStatus;
  /** Item index of the scored check-in press, or null. */
  checkInAt: number | null;
  /** Check-in presses that were not the scored one (too early, or repeated). */
  extraCheckIns: number;
}

export const toDifficulty = (value: unknown): Difficulty => (isOneOf(value, DIFFICULTIES) ? value : DEFAULT_DIFFICULTY);

export const categoryOf = (shape: Shape): Category | null =>
  shape === 'star' ? null : (ROUND_SHAPES as readonly string[]).includes(shape) ? 'round' : 'angular';

/** The response the instructions ask for: "Note" on a cue, otherwise the shape's category. */
export function expectedResponse(item: Item): Response {
  return item.cue ? 'note' : (categoryOf(item.shape) ?? 'note');
}

/**
 * Uniformly places `count` cue indices in [leadIn, itemCount - 1] with pairwise distance >= minGap.
 * Picks `count` distinct values from 0..slack+count-1 (slack = free room), which maps one-to-one
 * onto valid placements. Returns the indices in increasing order.
 */
export function placeCues(rng: Rng, count: number, minGap: number, leadIn: number, itemCount: number): number[] {
  const slack = itemCount - 1 - leadIn - (count - 1) * minGap;
  if (count <= 0) return [];
  if (slack < 0) throw new RangeError('Cues do not fit into the block.');
  const picked = rng
    .shuffle(Array.from({ length: slack + count }, (_, i) => i))
    .slice(0, count)
    .sort((a, b) => a - b);
  return picked.map((z, i) => leadIn + z - i + i * minGap);
}

/** Deterministically generates the cue positions and the complete item stream for a block. */
export function generateBlock(seed: number, difficulty: Difficulty): { cues: number[]; items: Item[] } {
  const config = CONFIGS[difficulty];
  const rng = createRng(seed);
  const cues = placeCues(rng, config.cues, config.minGap, config.leadIn, ITEM_COUNT);
  const cueSet = new Set(cues);
  const items: Item[] = [];
  let previous: Shape | undefined;
  for (let i = 0; i < ITEM_COUNT; i++) {
    const pool = rng.int(0, 1) === 0 ? ROUND_SHAPES : ANGULAR_SHAPES;
    let shape: Shape = rng.pick(pool.filter((s) => s !== previous));
    const filled = rng.int(0, 1) === 1;
    const cue = cueSet.has(i);
    if (cue && config.cueKind === 'star') shape = 'star';
    items.push({ shape, filled, dot: cue && config.cueKind === 'dot', cue });
    previous = shape;
  }
  return { cues, items };
}

export const generateItems = (seed: number, difficulty: Difficulty): Item[] => generateBlock(seed, difficulty).items;

export function newBlock(seed: number, difficulty: Difficulty): ProspectiveState {
  return { seed: seed >>> 0, difficulty, phase: 'ready', index: 0, answers: [], checkIns: [] };
}

/** Starts the block at the first item. */
export function startBlock(state: ProspectiveState): ProspectiveState {
  if (state.phase !== 'ready') return state;
  return { ...state, phase: 'running', index: 0 };
}

/** Responds to the current item ("round", "angular" or "note") and moves on (or finishes). */
export function respond(state: ProspectiveState, response: Response): ProspectiveState {
  if (state.phase !== 'running' || !isOneOf(response, RESPONSES)) return state;
  const index = state.index + 1;
  return { ...state, index, answers: [...state.answers, response], phase: index >= ITEM_COUNT ? 'finished' : 'running' };
}

/** Whether "Check in" is offered at all on this difficulty. */
export const hasCheckIn = (difficulty: Difficulty): boolean => CONFIGS[difficulty].checkIn !== null;

/** Records "Check in" at the current item (at most once per item; the item itself stays). */
export function checkIn(state: ProspectiveState): ProspectiveState {
  if (state.phase !== 'running' || !hasCheckIn(state.difficulty)) return state;
  if (state.checkIns[state.checkIns.length - 1] === state.index) return state;
  return { ...state, checkIns: [...state.checkIns, state.index] };
}

/** Factual summary of the answered part of a block (complete once the block is finished). */
export function score(state: ProspectiveState, items: readonly Item[]): ProspectiveScore {
  const { answers } = state;
  let ongoingTotal = 0;
  let ongoingCorrect = 0;
  let cues = 0;
  let onTime = 0;
  let late = 0;
  const attributed = new Set<number>();
  answers.forEach((response, i) => {
    const item = items[i];
    if (!item) return;
    if (!item.cue) {
      ongoingTotal++;
      if (response === expectedResponse(item)) ongoingCorrect++;
      return;
    }
    cues++;
    if (response === 'note') {
      onTime++;
      return;
    }
    for (let j = i + 1; j <= i + LATE_WINDOW && j < answers.length; j++) {
      if (answers[j] === 'note' && !items[j]?.cue) {
        late++;
        attributed.add(j);
        return;
      }
    }
  });
  let falseAlarms = 0;
  answers.forEach((response, i) => {
    if (response === 'note' && items[i] && !items[i].cue && !attributed.has(i)) falseAlarms++;
  });

  const target = CONFIGS[state.difficulty].checkIn;
  let checkIn: CheckInStatus = 'none';
  let checkInAt: number | null = null;
  let extraCheckIns = state.checkIns.length;
  if (target !== null) {
    const first = state.checkIns.find((i) => i >= target);
    if (first === undefined) checkIn = 'missed';
    else {
      checkIn = first < target + CHECK_IN_WINDOW ? 'onTime' : 'late';
      checkInAt = first;
      extraCheckIns--;
    }
  }
  return { ongoingTotal, ongoingCorrect, cues, onTime, late, missed: cues - onTime - late, falseAlarms, checkIn, checkInAt, extraCheckIns };
}

const isResponse = (value: unknown): value is Response => isOneOf(value, RESPONSES);
const isIndex = (value: unknown): value is number => isInt(value, 0, ITEM_COUNT - 1);

/** Structural validation of untrusted persisted data. Never throws. */
export function isValidProspectiveState(value: unknown): value is ProspectiveState {
  if (!isRecord(value)) return false;
  if (!isUint32(value.seed) || !isOneOf(value.difficulty, DIFFICULTIES) || !isOneOf(value.phase, PHASES)) return false;
  if (!isInt(value.index, 0, ITEM_COUNT) || !isArrayOf(value.answers, isResponse) || !isArrayOf(value.checkIns, isIndex)) return false;
  const { index, phase, answers, checkIns, difficulty } = value;
  if (answers.length !== index) return false;
  if (phase === 'ready' && index !== 0) return false;
  if (phase === 'running' && index >= ITEM_COUNT) return false;
  if (phase === 'finished' && index !== ITEM_COUNT) return false;
  if (checkIns.length === 0) return true;
  if (phase === 'ready' || !hasCheckIn(difficulty)) return false;
  let last = -1;
  for (const i of checkIns) {
    if (i <= last || i > index) return false;
    last = i;
  }
  return true;
}
