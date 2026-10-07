/**
 * River Crossing rules: pure, DOM-free logic and the serializable state.
 *
 * A puzzle is declarative data (see `puzzles.ts`): entities, a boat with a number of seats and
 * an optional weight limit, who can row, optional trip limits per entity and an optional limit
 * on the total number of crossings, plus "company" rules that every bank must satisfy:
 *   - `apart`:     `a` may share a bank with any of `b` only while one of `unless` is there too;
 *   - `needs`:     a bank holding any of `who` must also hold at least one of `any`;
 *   - `outnumber`: on a bank with at least one of `group`, `by` must not outnumber `group`;
 *   - `boatApart`: `a` and `b` never travel in the same crossing.
 * The boat always lies at one bank, and its passengers count as being on that bank. Bank rules
 * are therefore checked once per crossing, on the position after it. Everybody starts on the
 * left bank ("start bank"); the puzzle is solved when everybody is on the right ("goal bank").
 *
 * A crossing that would break a rule is never applied: the checker returns a structured
 * violation that the view explains in plain language (no fail state, no lives).
 *
 * The saved state is the puzzle identity, the action history and the current boat load.
 * The position is always derived by replaying the history, which gives unlimited undo and
 * exactly reproducible saves. History entries: a crossing (ascending entity indices) or
 * `RESTART`. Restarting is recorded rather than erasing the history, so it can be undone.
 */
import { isInt, isOneOf, isRecord, isUint32, normalizeSeed } from '@wp/game-core';
import { PUZZLES } from './puzzles';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'easy';

export const SIDES = ['left', 'right'] as const;
export type Side = (typeof SIDES)[number];

/** Every entity kind; each has a translated name `entity.<kind>` and an icon. */
export const ENTITY_KINDS = [
  'courier', 'parcel', 'keeper', 'parrot', 'crackers', 'scout', 'coach', 'teacher', 'child',
  'ranger', 'monkey', 'robot', 'crate', 'gardener', 'dog', 'goose', 'seeds', 'hiker', 'backpack',
  'researcher', 'assistant', 'cat', 'mouse', 'cheese', 'chef', 'apprentice', 'navigator', 'sailor',
  'magnet', 'compass', 'puppy', 'map', 'rooster', 'fox', 'hay', 'owl'
] as const;
export type EntityKind = (typeof ENTITY_KINDS)[number];

/** History marker for "restart puzzle". */
export const RESTART = 'restart';
/** Upper bound on the number of history entries — keeps untrusted saves small. */
export const MAX_HISTORY = 10_000;

export interface EntityDef {
  /** Unique within the puzzle, kebab-case (used for `data-testid="entity-<id>"`). */
  readonly id: string;
  readonly kind: EntityKind;
  /** Shown after the name ("Ranger 2") when a puzzle has several entities of one kind. */
  readonly n?: number;
  readonly rower?: boolean;
  /** Kilograms; only meaningful when the puzzle has `maxWeight`. */
  readonly weight?: number;
  /** Maximum number of crossings this entity can take part in (e.g. a robot's battery). */
  readonly trips?: number;
}

export interface ApartRule {
  readonly kind: 'apart';
  readonly a: string;
  readonly b: readonly string[];
  readonly unless: readonly string[];
}
export interface NeedsRule {
  readonly kind: 'needs';
  readonly who: readonly string[];
  readonly any: readonly string[];
}
export interface OutnumberRule {
  readonly kind: 'outnumber';
  readonly group: readonly string[];
  readonly by: readonly string[];
}
export interface BoatApartRule {
  readonly kind: 'boatApart';
  readonly a: string;
  readonly b: string;
}
export type RuleDef = ApartRule | NeedsRule | OutnumberRule | BoatApartRule;

export interface PuzzleDef {
  /** Translated title: `puzzle.<id>`. */
  readonly id: string;
  readonly entities: readonly EntityDef[];
  /** Seats in the boat. */
  readonly capacity: number;
  /** Maximum total weight in the boat (kg). */
  readonly maxWeight?: number;
  /** Maximum number of crossings per attempt. */
  readonly maxCrossings?: number;
  readonly rules: readonly RuleDef[];
  /** Fewest crossings that solve the puzzle (verified by the test suite's independent solver). */
  readonly minCrossings: number;
}

export interface Position {
  /** Bank of each entity (index-aligned with the puzzle's entities). */
  sides: Side[];
  boat: Side;
  /** Crossings each entity has taken part in during this attempt. */
  trips: number[];
  /** Crossings in this attempt. */
  crossings: number;
}

export type BankViolation =
  | { kind: 'apart'; bank: Side; rule: number; a: number; b: number }
  | { kind: 'needs'; bank: Side; rule: number; who: number[] }
  | { kind: 'outnumber'; bank: Side; rule: number; group: number; by: number };

export type BoatViolation =
  | { kind: 'empty' }
  | { kind: 'full'; capacity: number }
  | { kind: 'noRower' }
  | { kind: 'weight'; weight: number; max: number }
  | { kind: 'boatApart'; rule: number; a: number; b: number };

export type CrossViolation =
  | BoatViolation
  | BankViolation
  | { kind: 'solved' }
  | { kind: 'notHere'; entity: number }
  | { kind: 'trips'; entity: number; max: number }
  | { kind: 'limit'; max: number };

export type HistoryEntry = number[] | typeof RESTART;

export interface RiverState {
  seed: number;
  difficulty: Difficulty;
  /** Index of the puzzle within its difficulty. */
  puzzle: number;
  history: HistoryEntry[];
  /** Entities currently in the boat (ascending indices, all on the boat's bank). */
  boat: number[];
}

export interface Progress {
  position: Position;
  solved: boolean;
  /** Passengers of the last crossing of the current attempt ([] if none). */
  last: number[];
}

export const toDifficulty = (value: unknown): Difficulty => (isOneOf(value, DIFFICULTIES) ? value : DEFAULT_DIFFICULTY);

export const otherSide = (side: Side): Side => (side === 'left' ? 'right' : 'left');

const ascending = (a: number, b: number) => a - b;

/* ---------- Puzzle set ---------- */

export const puzzleCount = (difficulty: Difficulty): number => PUZZLES[difficulty].length;

/** Puzzle `index` of a difficulty. Throws for an index out of range. */
export function getPuzzle(difficulty: Difficulty, index: number): PuzzleDef {
  const puzzle = PUZZLES[difficulty][index];
  if (!puzzle) throw new RangeError(`No puzzle ${index} in ${difficulty}`);
  return puzzle;
}

/** Index of the entity with `id`, or -1. */
export const entityIndex = (puzzle: PuzzleDef, id: string): number => puzzle.entities.findIndex((e) => e.id === id);

/** Entity ids a rule refers to. */
export function ruleRefs(rule: RuleDef): string[] {
  switch (rule.kind) {
    case 'apart':
      return [rule.a, ...rule.b, ...rule.unless];
    case 'needs':
      return [...rule.who, ...rule.any];
    case 'outnumber':
      return [...rule.group, ...rule.by];
    case 'boatApart':
      return [rule.a, rule.b];
  }
}

/** Every list in the rule is non-empty. */
export function ruleComplete(rule: RuleDef): boolean {
  switch (rule.kind) {
    case 'apart':
      return rule.b.length > 0 && rule.unless.length > 0;
    case 'needs':
      return rule.who.length > 0 && rule.any.length > 0;
    case 'outnumber':
      return rule.group.length > 0 && rule.by.length > 0;
    case 'boatApart':
      return true;
  }
}

/**
 * Human-readable problems with a puzzle definition (empty when valid): ids, entity numbers,
 * boat settings, rule references and a legal starting position.
 */
export function validatePuzzle(puzzle: PuzzleDef): string[] {
  const problems: string[] = [];
  const count = puzzle.entities.length;
  if (count < 2 || count > 12) problems.push('a puzzle needs 2–12 entities');
  if (new Set(puzzle.entities.map((e) => e.id)).size !== count) problems.push('entity ids must be unique');
  for (const e of puzzle.entities) {
    if (!/^[a-z]+(?:-[a-z0-9]+)*$/.test(e.id)) problems.push(`entity id "${e.id}" must be kebab-case`);
    if (!isOneOf(e.kind, ENTITY_KINDS)) problems.push(`unknown kind "${e.kind}"`);
    if (e.trips !== undefined && !(isInt(e.trips, 1, 99) && e.rower === true)) problems.push(`trip limit of "${e.id}" needs a rower and 1–99 trips`);
    if (e.weight !== undefined && !(isInt(e.weight, 1, 999) && puzzle.maxWeight !== undefined)) problems.push(`weight of "${e.id}" needs a weight limit and 1–999 kg`);
  }
  if (!puzzle.entities.some((e) => e.rower === true)) problems.push('nobody can row');
  if (!isInt(puzzle.capacity, 1, count)) problems.push('capacity must be 1…entities');
  if (puzzle.maxWeight !== undefined && !isInt(puzzle.maxWeight, 1, 9999)) problems.push('maxWeight must be a positive integer');
  if (puzzle.maxCrossings !== undefined && !isInt(puzzle.maxCrossings, 1, 999)) problems.push('maxCrossings must be a positive integer');
  puzzle.rules.forEach((rule, i) => {
    const refs = ruleRefs(rule);
    if (refs.some((id) => entityIndex(puzzle, id) < 0)) problems.push(`rule ${i + 1} refers to an unknown entity`);
    if (new Set(refs).size !== refs.length) problems.push(`rule ${i + 1} repeats an entity`);
    if (!ruleComplete(rule)) problems.push(`rule ${i + 1} is incomplete`);
  });
  if (problems.length === 0 && positionViolation(puzzle, startPosition(puzzle).sides) !== null) problems.push('the starting position breaks a rule');
  return problems;
}

/* ---------- Constraint checker ---------- */

export const startPosition = (puzzle: PuzzleDef): Position => ({
  sides: puzzle.entities.map((): Side => 'left'),
  boat: 'left',
  trips: puzzle.entities.map(() => 0),
  crossings: 0
});

/** The first rule broken on `bank` (in rule order), or null. */
export function bankViolation(puzzle: PuzzleDef, sides: readonly Side[], bank: Side): BankViolation | null {
  const here = (id: string) => sides[entityIndex(puzzle, id)] === bank;
  for (let rule = 0; rule < puzzle.rules.length; rule++) {
    const def = puzzle.rules[rule] as RuleDef;
    if (def.kind === 'apart') {
      const b = def.b.find(here);
      if (here(def.a) && b !== undefined && !def.unless.some(here)) {
        return { kind: 'apart', bank, rule, a: entityIndex(puzzle, def.a), b: entityIndex(puzzle, b) };
      }
    } else if (def.kind === 'needs') {
      const who = def.who.filter(here);
      if (who.length > 0 && !def.any.some(here)) return { kind: 'needs', bank, rule, who: who.map((id) => entityIndex(puzzle, id)) };
    } else if (def.kind === 'outnumber') {
      const group = def.group.filter(here).length;
      const by = def.by.filter(here).length;
      if (group > 0 && by > group) return { kind: 'outnumber', bank, rule, group, by };
    }
  }
  return null;
}

/** The first broken bank rule, checking bank `first` before the other one; null if both are fine. */
export function positionViolation(puzzle: PuzzleDef, sides: readonly Side[], first: Side = 'left'): BankViolation | null {
  return bankViolation(puzzle, sides, first) ?? bankViolation(puzzle, sides, otherSide(first));
}

export const weightOf = (puzzle: PuzzleDef, passengers: readonly number[]): number =>
  passengers.reduce((sum, i) => sum + (puzzle.entities[i]?.weight ?? 0), 0);

/** Can exactly these passengers make one crossing together (seats, rower, weight, boat rules)? */
export function boatViolation(puzzle: PuzzleDef, passengers: readonly number[]): BoatViolation | null {
  if (passengers.length === 0) return { kind: 'empty' };
  if (passengers.length > puzzle.capacity) return { kind: 'full', capacity: puzzle.capacity };
  if (!passengers.some((i) => puzzle.entities[i]?.rower === true)) return { kind: 'noRower' };
  const weight = weightOf(puzzle, passengers);
  const maxWeight = puzzle.maxWeight ?? Infinity;
  if (weight > maxWeight) return { kind: 'weight', weight, max: maxWeight };
  for (let rule = 0; rule < puzzle.rules.length; rule++) {
    const def = puzzle.rules[rule] as RuleDef;
    if (def.kind !== 'boatApart') continue;
    const a = entityIndex(puzzle, def.a);
    const b = entityIndex(puzzle, def.b);
    if (passengers.includes(a) && passengers.includes(b)) return { kind: 'boatApart', rule, a, b };
  }
  return null;
}

/** Crossings `entity` may still take part in during this attempt (Infinity without a limit). */
export function tripsLeft(puzzle: PuzzleDef, position: Position, entity: number): number {
  const limit = puzzle.entities[entity]?.trips;
  return limit === undefined ? Infinity : limit - (position.trips[entity] ?? 0);
}

export const isSolvedPosition = (position: Position): boolean => position.sides.every((side) => side === 'right');

/** Moves the boat with `passengers` to the other bank. No checks — see `crossingViolation`. */
export function applyCrossing(position: Position, passengers: readonly number[]): Position {
  const to = otherSide(position.boat);
  return {
    sides: position.sides.map((side, i) => (passengers.includes(i) ? to : side)),
    boat: to,
    trips: position.trips.map((n, i) => (passengers.includes(i) ? n + 1 : n)),
    crossings: position.crossings + 1
  };
}

/**
 * Why `passengers` cannot cross from `position`, or null when the crossing is legal. Checks, in
 * this order: solved, boat on the passengers' bank, seats, rower, weight, boat rules, trip
 * limits, crossing limit, then the bank left behind and finally the bank arrived at.
 */
export function crossingViolation(puzzle: PuzzleDef, position: Position, passengers: readonly number[]): CrossViolation | null {
  if (isSolvedPosition(position)) return { kind: 'solved' };
  const away = passengers.find((i) => position.sides[i] !== position.boat);
  if (away !== undefined) return { kind: 'notHere', entity: away };
  const boat = boatViolation(puzzle, passengers);
  if (boat) return boat;
  for (const i of passengers) {
    // Every passenger is a real entity here: an unknown index is never on the boat's bank.
    const limit = (puzzle.entities[i] as EntityDef).trips;
    if (limit !== undefined && (position.trips[i] ?? 0) >= limit) return { kind: 'trips', entity: i, max: limit };
  }
  const maxCrossings = puzzle.maxCrossings ?? Infinity;
  if (position.crossings >= maxCrossings) return { kind: 'limit', max: maxCrossings };
  return positionViolation(puzzle, applyCrossing(position, passengers).sides, position.boat);
}

/* ---------- History ---------- */

const isCrossingEntry = (entry: unknown): entry is number[] =>
  Array.isArray(entry) && entry.every((i, k) => Number.isInteger(i) && (k === 0 || (i as number) > (entry[k - 1] as number)));

/**
 * Replays a history from the puzzle start. Returns null if the history is not one the rules can
 * produce: an illegal crossing, anything after the puzzle was solved, or a restart with nothing
 * to restart.
 */
export function replay(puzzle: PuzzleDef, history: readonly HistoryEntry[]): Progress | null {
  let position = startPosition(puzzle);
  let attempt: number[][] = [];
  for (const entry of history) {
    if (isSolvedPosition(position)) return null;
    if (entry === RESTART) {
      if (position.crossings === 0) return null;
      position = startPosition(puzzle);
      attempt = [];
      continue;
    }
    if (!isCrossingEntry(entry) || crossingViolation(puzzle, position, entry) !== null) return null;
    position = applyCrossing(position, entry);
    attempt.push(entry);
  }
  return { position, solved: isSolvedPosition(position), last: [...(attempt[attempt.length - 1] ?? [])] };
}

/* ---------- Game state ---------- */

export function createInitialState(seed: number, difficulty: Difficulty = DEFAULT_DIFFICULTY): RiverState {
  const normalized = normalizeSeed(seed);
  return { seed: normalized, difficulty, puzzle: normalized % puzzleCount(difficulty), history: [], boat: [] };
}

/** The seeded starting state again (the seed's puzzle, empty history, empty boat). */
export const resetState = (state: RiverState): RiverState => createInitialState(state.seed, state.difficulty);

export const puzzleOf = (state: RiverState): PuzzleDef => getPuzzle(state.difficulty, state.puzzle);

/** Current progress of a valid state. Throws if the history cannot be replayed. */
export function progressOf(state: RiverState): Progress {
  const progress = replay(puzzleOf(state), state.history);
  if (!progress) throw new Error('Invalid history');
  return progress;
}

export type ToggleRefusal = 'solved' | 'notHere' | 'full';

export interface ToggleResult {
  state: RiverState;
  refused: ToggleRefusal | null;
}

/**
 * Puts an entity into the boat or takes it out. Boarding needs the entity on the boat's bank and
 * a free seat; otherwise the same state comes back with the reason.
 */
export function toggleBoat(state: RiverState, entity: number): ToggleResult {
  const { position, solved } = progressOf(state);
  if (solved) return { state, refused: 'solved' };
  if (state.boat.includes(entity)) return { state: { ...state, boat: state.boat.filter((i) => i !== entity) }, refused: null };
  if (position.sides[entity] !== position.boat) return { state, refused: 'notHere' };
  if (state.boat.length >= puzzleOf(state).capacity) return { state, refused: 'full' };
  return { state: { ...state, boat: [...state.boat, entity].sort(ascending) }, refused: null };
}

export interface CrossResult {
  state: RiverState;
  violation: CrossViolation | null;
}

/** Crosses with the current boat load. Passengers stay in the boat. Illegal crossings are not applied. */
export function cross(state: RiverState): CrossResult {
  const violation = crossingViolation(puzzleOf(state), progressOf(state).position, state.boat);
  if (violation) return { state, violation };
  if (state.history.length >= MAX_HISTORY) return { state, violation: { kind: 'limit', max: MAX_HISTORY } };
  return { state: { ...state, history: [...state.history, [...state.boat]], boat: [...state.boat] }, violation: null };
}

export const canUndo = (state: RiverState): boolean => state.history.length > 0 && !progressOf(state).solved;

/**
 * Takes back the last crossing (its passengers are back in the boat, as just before crossing)
 * or the last restart (the boat holds the passengers of that attempt's last crossing).
 * Same object if there is nothing to undo or the puzzle is solved.
 */
export function undo(state: RiverState): RiverState {
  if (!canUndo(state)) return state;
  const history = state.history.slice(0, -1);
  const undone = state.history[state.history.length - 1] as HistoryEntry;
  const boat = undone === RESTART ? progressOf({ ...state, history }).last : [...undone];
  return { ...state, history, boat };
}

export function canRestart(state: RiverState): boolean {
  const { position, solved } = progressOf(state);
  return position.crossings > 0 && !solved;
}

/** Back to the puzzle start with an empty boat; recorded in the history so it can be undone. */
export function restart(state: RiverState): RiverState {
  if (!canRestart(state) || state.history.length >= MAX_HISTORY) return state;
  return { ...state, history: [...state.history, RESTART], boat: [] };
}

/** Switches to puzzle `index` of the same difficulty, fresh. Same object if invalid or already fresh. */
export function choosePuzzle(state: RiverState, index: number): RiverState {
  if (!isInt(index, 0, puzzleCount(state.difficulty) - 1)) return state;
  if (index === state.puzzle && state.history.length === 0 && state.boat.length === 0) return state;
  return { ...state, puzzle: index, history: [], boat: [] };
}

/* ---------- Validation ---------- */

/** Structural and cross-field validation of untrusted saved data. Never throws. */
export function isRiverState(value: unknown): value is RiverState {
  try {
    if (!isRecord(value)) return false;
    const { seed, difficulty, puzzle, history, boat } = value;
    if (!isUint32(seed) || !isOneOf(difficulty, DIFFICULTIES)) return false;
    if (!isInt(puzzle) || !Array.isArray(history) || history.length > MAX_HISTORY) return false;
    // getPuzzle throws for an index out of range; replay rejects malformed entries.
    const def = getPuzzle(difficulty, puzzle);
    const progress = replay(def, history as HistoryEntry[]);
    if (!progress || !isCrossingEntry(boat) || boat.length > def.capacity) return false;
    return boat.every((i) => progress.position.sides[i] === progress.position.boat);
  } catch {
    return false;
  }
}
