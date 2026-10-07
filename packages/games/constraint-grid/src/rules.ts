// @ts-nocheck
import { createRng, isInt, isOneOf, isRecord, isUint32, type Rng } from '@wp/game-core';
import { ATTRIBUTE_KINDS, CLUE_TYPES, NAME_COUNT, VOCABULARY, type AttributeKind, type ClueType } from './vocabulary';

/**
 * Pure, DOM-free rules for Constraint Grid ("Logic Grid"), an Einstein/zebra-style puzzle.
 *
 * K categories (always a name and a floor, plus attributes such as pets or drinks) with N
 * items each. Every person has exactly one item of every category and no two people share
 * one, so each category is a permutation of the people. The player marks the pairwise grids
 * with ✗/✓ until every ✓ matches the hidden solution.
 *
 * Generation (spec "Puzzle generation"): seeded random solution → all true candidate clues of
 * six types → clues added greedily (weighted by type) while they help the propagation solver
 * below → redundant clues removed while the solver still deduces the whole solution. Sound
 * deduction of a complete assignment proves uniqueness; the tests re-check uniqueness with an
 * independent brute-force oracle (`test/oracle.ts`) that shares no code with this file.
 *
 * The state stores the full puzzle, so restoring a save never depends on regenerating it.
 */

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'easy';

/** Categories × items per difficulty. 4 × 5 keeps every pair grid at 5 × 5 (fits a 360 px phone). */
export const SHAPES: Readonly<Record<Difficulty, { readonly categories: number; readonly items: number }>> = {
  easy: { categories: 3, items: 3 },
  medium: { categories: 3, items: 4 },
  hard: { categories: 4, items: 5 }
};

/** Category index of the names (the people themselves). */
export const PERSON = 0;
/** Category index of the floors (the only ordered category; floor 0 is the lowest). */
export const FLOOR = 1;

export { ATTRIBUTE_KINDS, CLUE_TYPES, NAME_COUNT, VOCABULARY, type AttributeKind, type ClueType };
export type CategoryKind = 'person' | 'floor' | AttributeKind;

/** Clue types that compare floors (their references never name a floor). */
export const ORDINAL_TYPES = ['directlyAbove', 'above', 'nextTo'] as const;

/** Relative weights for picking clue types during generation. */
export const TYPE_WEIGHTS: Readonly<Record<Difficulty, Readonly<Record<ClueType, number>>>> = {
  easy: { same: 3, notSame: 3, directlyAbove: 2, above: 2, nextTo: 2, eitherOr: 1 },
  medium: { same: 2, notSame: 3, directlyAbove: 2, above: 2, nextTo: 2, eitherOr: 2 },
  hard: { same: 2, notSame: 3, directlyAbove: 2, above: 2, nextTo: 2, eitherOr: 3 }
};

export const MARK_UNKNOWN = 0;
export const MARK_NO = 1;
export const MARK_YES = 2;
export type Mark = typeof MARK_UNKNOWN | typeof MARK_NO | typeof MARK_YES;

/** Undo depth kept in the save. */
export const MAX_HISTORY = 300;
/** Upper bound for counters in untrusted saves (far beyond any real game). */
export const MAX_COUNTER = 1_000_000;
/** Upper bound for clue lists in untrusted saves. */
export const MAX_CLUES = 80;

/** "The person who has item `item` of category `cat`" (for `PERSON`, the person `item` itself). */
export interface Ref {
  cat: number;
  item: number;
}

export type Clue =
  | { type: 'same' | 'notSame' | 'directlyAbove' | 'above' | 'nextTo'; a: Ref; b: Ref }
  | { type: 'eitherOr'; a: Ref; b: Ref; c: Ref };

export interface Puzzle {
  /** Items per category (N). */
  size: number;
  /** Category kinds; always `['person', 'floor', ...attributes]`. */
  kinds: CategoryKind[];
  /**
   * Vocabulary index of each item slot per category: name index for `person`, `VOCABULARY`
   * index for attributes, and simply `0..N-1` for floors (slot = floor, 0 = lowest).
   */
  vocab: number[][];
  /** `solution[c][p]` = item slot of category `c` held by person `p`; `solution[0]` is the identity. */
  solution: number[][];
  clues: Clue[];
}

export interface ConstraintGridState extends Puzzle {
  seed: number;
  difficulty: Difficulty;
  /** Player marks, one N×N block per category pair (see `pairs`), row-major. */
  marks: number[];
  /** Clues the player has ticked off. */
  used: boolean[];
  /** Placing ✓ also marks the rest of its row and column ✗ (a convenience, not a solver). */
  autoExclude: boolean;
  /** Undo stack; each entry is a flat list `[cell, previousMark, cell, previousMark, …]`. */
  history: number[][];
  /** Number of effective mark changes. */
  moves: number;
  /** Number of times "Check" was used. */
  checks: number;
  /** Contradicting marks found by the last check, or `null` once the marks changed since. */
  lastCheck: number | null;
}

export function toDifficulty(value: unknown): Difficulty {
  return isOneOf(value, DIFFICULTIES) ? value : DEFAULT_DIFFICULTY;
}

export const range = (n: number): number[] => Array.from({ length: n }, (_, i) => i);

// --- Solution helpers -------------------------------------------------------------------------

/** `inverse[c][slot]` = person holding item `slot` of category `c`. */
export function inverse(solution: readonly (readonly number[])[]): number[][] {
  return solution.map((perm) => {
    const inv: number[] = new Array<number>(perm.length).fill(-1);
    perm.forEach((slot, person) => {
      inv[slot] = person;
    });
    return inv;
  });
}

/** True when `values` is a permutation of `0..n-1`. */
export function isPermutation(values: unknown, n: number): values is number[] {
  if (!Array.isArray(values) || values.length !== n) return false;
  const seen = new Set<number>();
  for (const v of values) {
    if (!isInt(v, 0, n - 1) || seen.has(v)) return false;
    seen.add(v);
  }
  return true;
}

/** Floor relation of a clue type: does floor `fa` (of a) relate to floor `fb` (of b)? */
export function floorRelation(type: ClueType, fa: number, fb: number): boolean {
  if (type === 'directlyAbove') return fa === fb + 1;
  if (type === 'above') return fa > fb;
  if (type === 'nextTo') return Math.abs(fa - fb) === 1;
  return false;
}

export const isOrdinal = (type: ClueType): boolean => (ORDINAL_TYPES as readonly string[]).includes(type);

/** Whether `clue` is true for the complete assignment `solution`. */
export function clueHolds(clue: Clue, solution: readonly (readonly number[])[]): boolean {
  const inv = inverse(solution);
  const who = (r: Ref) => inv[r.cat]?.[r.item] ?? -1;
  const pa = who(clue.a);
  const pb = who(clue.b);
  switch (clue.type) {
    case 'same':
      return pa === pb;
    case 'notSame':
      return pa !== pb;
    case 'eitherOr':
      return pa === pb || pa === who(clue.c);
    default:
      return pa !== pb && floorRelation(clue.type, solution[FLOOR]?.[pa] ?? -1, solution[FLOOR]?.[pb] ?? -1);
  }
}

// --- Solver -----------------------------------------------------------------------------------

/** `cands[c][p]`: bit mask of item slots of category `c` still possible for person `p`. */
export type Candidates = number[][];

export type SolveStatus = 'solved' | 'stuck' | 'contradiction';

export interface SolveResult {
  status: SolveStatus;
  candidates: Candidates;
}

/** Population count of a 32-bit mask (branch- and loop-free). */
export const bitCount = (mask: number): number => {
  let n = mask - ((mask >>> 1) & 0x55555555);
  n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
  return (Math.imul((n + (n >>> 4)) & 0x0f0f0f0f, 0x01010101) >>> 24);
};

const isSingle = (mask: number): boolean => mask !== 0 && (mask & (mask - 1)) === 0;

/** Index of the lowest set bit (for single-bit masks: the item). */
export const lowestBit = (mask: number): number => 31 - Math.clz32(mask & -mask);

/** Everything open: each person may hold every item of every category (names are fixed). */
export function initialCandidates(categories: number, size: number): Candidates {
  const full = (1 << size) - 1;
  return range(categories).map((c) => range(size).map((p) => (c === PERSON ? 1 << p : full)));
}

class Contradiction extends Error {}

/**
 * Constraint propagation to a fixpoint (mutates `cands`). Every rule only removes candidates
 * that cannot be part of any assignment satisfying the clues (soundness), so the true
 * solution always survives. Returns `false` on a contradiction.
 *
 * Rules: (1) each category is a permutation (naked and hidden singles); (2) per clue, with
 * "p can be / surely is the person of ref r" reasoning; floor clues keep only floors that have
 * a supporting partner floor for some other possible person.
 */
export function propagate(cands: Candidates, size: number, clues: readonly Clue[]): boolean {
  const categories = cands.length;
  let changed = true;

  const setMask = (c: number, p: number, mask: number) => {
    const row = cands[c] as number[];
    const old = row[p] as number;
    const next = old & mask;
    if (next === 0) throw new Contradiction();
    if (next !== old) {
      row[p] = next;
      changed = true;
    }
  };
  const canBe = (p: number, r: Ref) => r.cat === PERSON ? p === r.item : (((cands[r.cat]?.[p] ?? 0) >> r.item) & 1) === 1;
  const isCertain = (p: number, r: Ref) => r.cat === PERSON ? p === r.item : cands[r.cat]?.[p] === 1 << r.item;
  const exclude = (p: number, r: Ref) => {
    if (r.cat === PERSON) {
      if (p === r.item) throw new Contradiction();
    } else setMask(r.cat, p, ~(1 << r.item));
  };
  const assign = (p: number, r: Ref) => {
    if (r.cat === PERSON) {
      if (p !== r.item) throw new Contradiction();
    } else setMask(r.cat, p, 1 << r.item);
  };

  const applySame = (a: Ref, b: Ref) => {
    for (let p = 0; p < size; p++) {
      if (!canBe(p, a)) exclude(p, b);
      if (!canBe(p, b)) exclude(p, a);
      if (isCertain(p, a)) assign(p, b);
      if (isCertain(p, b)) assign(p, a);
    }
  };

  const applyNotSame = (a: Ref, b: Ref) => {
    for (let p = 0; p < size; p++) {
      if (isCertain(p, a)) exclude(p, b);
      if (isCertain(p, b)) exclude(p, a);
    }
  };

  const someone = (a: Ref, b: Ref) => {
    for (let p = 0; p < size; p++) if (canBe(p, a) && canBe(p, b)) return true;
    return false;
  };

  const applyEitherOr = (a: Ref, b: Ref, c: Ref) => {
    const withB = someone(a, b);
    const withC = someone(a, c);
    if (!withB && !withC) throw new Contradiction();
    if (!withB) applySame(a, c);
    if (!withC) applySame(a, b);
    for (let p = 0; p < size; p++) {
      if (canBe(p, a) && !canBe(p, b) && !canBe(p, c)) exclude(p, a);
      if (!isCertain(p, a)) continue;
      if (!canBe(p, b)) assign(p, c);
      if (!canBe(p, c)) assign(p, b);
      if (b.cat === c.cat && b.cat !== PERSON) setMask(b.cat, p, (1 << b.item) | (1 << c.item));
    }
  };

  /** Floors of `p` (as subject `self`) that have a partner `q ≠ p` (as `other`) on a related floor. */
  const supported = (type: ClueType, p: number, other: Ref, selfIsA: boolean): number => {
    const floors = cands[FLOOR] as number[];
    let support = 0;
    for (let f = 0; f < size; f++) {
      if (!(((floors[p] as number) >> f) & 1)) continue;
      search: for (let q = 0; q < size; q++) {
        if (q === p || !canBe(q, other)) continue;
        for (let g = 0; g < size; g++) {
          if (!(((floors[q] as number) >> g) & 1)) continue;
          if (selfIsA ? floorRelation(type, f, g) : floorRelation(type, g, f)) {
            support |= 1 << f;
            break search;
          }
        }
      }
    }
    return support;
  };

  const applyOrdinal = (type: ClueType, a: Ref, b: Ref) => {
    for (const [self, other, selfIsA] of [[a, b, true], [b, a, false]] as const) {
      for (let p = 0; p < size; p++) {
        if (!canBe(p, self)) continue;
        const support = supported(type, p, other, selfIsA);
        if (support === 0) exclude(p, self);
        else if (isCertain(p, self)) setMask(FLOOR, p, support);
      }
    }
  };

  const applyPermutations = () => {
    for (let c = 1; c < categories; c++) {
      const row = cands[c] as number[];
      for (let p = 0; p < size; p++) {
        const m = row[p] as number;
        if (!isSingle(m)) continue;
        for (let q = 0; q < size; q++) if (q !== p) setMask(c, q, ~m);
      }
      for (let item = 0; item < size; item++) {
        let holder = -1;
        let count = 0;
        for (let p = 0; p < size; p++) {
          if (((row[p] as number) >> item) & 1) {
            holder = p;
            count++;
          }
        }
        if (count === 0) throw new Contradiction();
        if (count === 1) setMask(c, holder, 1 << item);
      }
    }
  };

  // Every round that changes something removes at least one candidate, so the fixpoint is
  // reached within `candidateCount` rounds; the bound only makes termination explicit.
  let rounds = candidateCount(cands) + 1;
  try {
    while (changed && rounds-- > 0) {
      changed = false;
      applyPermutations();
      for (const clue of clues) {
        if (clue.type === 'same') applySame(clue.a, clue.b);
        else if (clue.type === 'notSame') applyNotSame(clue.a, clue.b);
        else if (clue.type === 'eitherOr') applyEitherOr(clue.a, clue.b, clue.c);
        else applyOrdinal(clue.type, clue.a, clue.b);
      }
    }
    return true;
  } catch (error) {
    if (error instanceof Contradiction) return false;
    throw error;
  }
}

export const isComplete = (cands: Candidates): boolean => cands.every((row) => row.every(isSingle));

/** Runs the propagation solver from scratch (or from `start`, which is copied). */
export function solve(categories: number, size: number, clues: readonly Clue[], start?: Candidates): SolveResult {
  const candidates = (start ?? initialCandidates(categories, size)).map((row) => [...row]);
  if (!propagate(candidates, size, clues)) return { status: 'contradiction', candidates };
  return { status: isComplete(candidates) ? 'solved' : 'stuck', candidates };
}

/** Total number of remaining candidates (a progress measure). */
export const candidateCount = (cands: Candidates): number => cands.reduce((sum, row) => sum + row.reduce((s, m) => s + bitCount(m), 0), 0);

/** Reads the assignment out of a complete candidate set. */
export const assignmentOf = (cands: Candidates): number[][] => cands.map((row) => row.map(lowestBit));

// --- Generation -------------------------------------------------------------------------------

/** All clues (of every type) that are true for `solution`, grouped by type, in a fixed order. */
export function candidateClues(solution: readonly (readonly number[])[]): Record<ClueType, Clue[]> {
  const categories = solution.length;
  const size = solution[0]?.length ?? 0;
  const inv = inverse(solution);
  const floorOf = solution[FLOOR] as readonly number[];
  const refs: Ref[] = [];
  for (let cat = 0; cat < categories; cat++) for (let item = 0; item < size; item++) refs.push({ cat, item });
  const who = (r: Ref) => inv[r.cat]?.[r.item] as number;
  const pool: Record<ClueType, Clue[]> = { same: [], notSame: [], directlyAbove: [], above: [], nextTo: [], eitherOr: [] };

  for (const a of refs) {
    for (const b of refs) {
      const pa = who(a);
      const pb = who(b);
      if (a.cat < b.cat) pool[pa === pb ? 'same' : 'notSame'].push({ type: pa === pb ? 'same' : 'notSame', a, b });
      if (a.cat === FLOOR || b.cat === FLOOR || pa === pb) continue;
      const fa = floorOf[pa] as number;
      const fb = floorOf[pb] as number;
      if (floorRelation('directlyAbove', fa, fb)) pool.directlyAbove.push({ type: 'directlyAbove', a, b });
      if (floorRelation('above', fa, fb)) pool.above.push({ type: 'above', a, b });
      if (refs.indexOf(a) < refs.indexOf(b) && floorRelation('nextTo', fa, fb)) pool.nextTo.push({ type: 'nextTo', a, b });
    }
    for (let cat = 0; cat < categories; cat++) {
      if (cat === a.cat) continue;
      const truth = solution[cat]?.[who(a)] as number;
      for (let other = 0; other < size; other++) {
        if (other === truth) continue;
        const [first, second] = truth < other ? [truth, other] : [other, truth];
        pool.eitherOr.push({ type: 'eitherOr', a, b: { cat, item: first }, c: { cat, item: second } });
      }
    }
  }
  return pool;
}

const pickType = (rng: Rng, pool: Record<ClueType, Clue[]>, weights: Readonly<Record<ClueType, number>>): ClueType | null => {
  const open = CLUE_TYPES.filter((type) => (pool[type].length > 0 && weights[type] > 0));
  const total = open.reduce((sum, type) => sum + weights[type], 0);
  if (total === 0) return null;
  let ticket = rng.int(1, total);
  for (const type of open) {
    ticket -= weights[type];
    if (ticket <= 0) return type;
  }
  /* c8 ignore next */
  return null;
};

/** Removes every clue the solver does not need (in random order); the rest stays solvable. */
export function minimizeClues(rng: Rng, categories: number, size: number, clues: readonly Clue[]): Clue[] {
  let kept = [...clues];
  for (const clue of rng.shuffle(clues)) {
    const without = [...kept];
    without.splice(without.indexOf(clue), 1);
    if (solve(categories, size, without).status === 'solved') kept = without;
  }
  return kept;
}

/** Builds a seeded, uniquely solvable puzzle for the given difficulty. */
export function generatePuzzle(seed: number, difficulty: Difficulty = DEFAULT_DIFFICULTY): Puzzle {
  const rng = createRng(seed);
  const { categories, items: size } = SHAPES[difficulty];
  const attributes = rng.shuffle(ATTRIBUTE_KINDS).slice(0, categories - 2);
  const kinds: CategoryKind[] = ['person', 'floor', ...attributes];
  const sortedPick = (count: number) => rng.shuffle(range(count)).slice(0, size).sort((x, y) => x - y);
  const vocab = kinds.map((kind) => (kind === 'person' ? sortedPick(NAME_COUNT) : kind === 'floor' ? range(size) : sortedPick(VOCABULARY[kind].length)));
  const solution = kinds.map((kind) => (kind === 'person' ? range(size) : rng.shuffle(range(size))));

  const pool = candidateClues(solution);
  const weights = TYPE_WEIGHTS[difficulty];
  const chosen: Clue[] = [];
  let state = solve(categories, size, []);
  let remaining = candidateCount(state.candidates);
  for (;;) {
    if (state.status === 'solved') break;
    const type = pickType(rng, pool, weights);
    /* c8 ignore next -- the pool always contains every "same" clue, which together solve the puzzle */
    if (type === null) throw new Error('clue pool exhausted');
    const list = pool[type];
    const [clue] = list.splice(rng.int(0, list.length - 1), 1) as [Clue];
    const next = solve(categories, size, [...chosen, clue], state.candidates);
    const count = candidateCount(next.candidates);
    if (next.status === 'contradiction' || count >= remaining) continue;
    chosen.push(clue);
    state = next;
    remaining = count;
  }
  const clues = rng.shuffle(minimizeClues(rng, categories, size, chosen));
  return { size, kinds, vocab, solution, clues };
}

// --- Grid marks -------------------------------------------------------------------------------

/** Category pairs `[a, b]` with `a < b`, in block order. */
export function pairs(categories: number): [number, number][] {
  const out: [number, number][] = [];
  for (let a = 0; a < categories; a++) for (let b = a + 1; b < categories; b++) out.push([a, b]);
  return out;
}

export const markCount = (categories: number, size: number): number => pairs(categories).length * size * size;

/** Index into `marks` of cell (row item `i` of category `a`, column item `j` of category `b`). */
export function cellIndex(categories: number, size: number, a: number, b: number, i: number, j: number): number {
  const block = pairs(categories).findIndex(([x, y]) => x === a && y === b);
  if (block < 0 || !isInt(i, 0, size - 1) || !isInt(j, 0, size - 1)) return -1;
  return block * size * size + i * size + j;
}

export interface CellPosition {
  block: number;
  a: number;
  b: number;
  i: number;
  j: number;
}

export function cellPosition(categories: number, size: number, index: number): CellPosition {
  const per = size * size;
  const block = Math.floor(index / per);
  const [a, b] = pairs(categories)[block] ?? [0, 1];
  const within = index - block * per;
  return { block, a, b, i: Math.floor(within / size), j: within % size };
}

/** True cells of the solution, as a 0/1 array parallel to `marks`. */
export function truthTable(puzzle: Pick<Puzzle, 'size' | 'solution'>): boolean[] {
  const { size, solution } = puzzle;
  const inv = inverse(solution);
  const out: boolean[] = [];
  for (const [a, b] of pairs(solution.length)) {
    for (let i = 0; i < size; i++) for (let j = 0; j < size; j++) out.push(inv[a]?.[i] === inv[b]?.[j]);
  }
  return out;
}

export function isSolved(state: Pick<ConstraintGridState, 'size' | 'solution' | 'marks'>): boolean {
  const truth = truthTable(state);
  return truth.length === state.marks.length && truth.every((t, k) => t === (state.marks[k] === MARK_YES));
}

/** Marks that contradict the solution: ✓ on a false pair or ✗ on a true pair. */
export function contradictions(state: Pick<ConstraintGridState, 'size' | 'solution' | 'marks'>): number {
  const truth = truthTable(state);
  return state.marks.reduce((n, m, k) => n + ((m === MARK_YES && !truth[k]) || (m === MARK_NO && truth[k]) ? 1 : 0), 0);
}

export const confirmedCount = (marks: readonly number[]): number => marks.filter((m) => m === MARK_YES).length;

export const nextMark = (mark: number): Mark => (mark === MARK_UNKNOWN ? MARK_NO : mark === MARK_NO ? MARK_YES : MARK_UNKNOWN);

export function createInitialState(seed: number, difficulty: Difficulty = DEFAULT_DIFFICULTY, autoExclude = true): ConstraintGridState {
  const puzzle = generatePuzzle(seed, difficulty);
  return {
    seed: seed >>> 0,
    difficulty,
    ...puzzle,
    marks: new Array<number>(markCount(puzzle.kinds.length, puzzle.size)).fill(MARK_UNKNOWN),
    used: puzzle.clues.map(() => false),
    autoExclude,
    history: [],
    moves: 0,
    checks: 0,
    lastCheck: null
  };
}

/** Sets cell `index` to `mark` (plus auto-✗ of its row and column when placing ✓). */
export function setMark(state: ConstraintGridState, index: number, mark: number): ConstraintGridState {
  if (isSolved(state) || !isInt(index, 0, state.marks.length - 1) || !isInt(mark, 0, 2)) return state;
  if (state.marks[index] === mark) return state;
  const marks = [...state.marks];
  const entry: number[] = [index, marks[index] as number];
  marks[index] = mark;
  if (mark === MARK_YES && state.autoExclude) {
    const n = state.size;
    const { block, i, j } = cellPosition(state.kinds.length, n, index);
    const base = block * n * n;
    for (let k = 0; k < n; k++) {
      for (const other of [base + i * n + k, base + k * n + j]) {
        if (marks[other] === MARK_UNKNOWN) {
          entry.push(other, MARK_UNKNOWN);
          marks[other] = MARK_NO;
        }
      }
    }
  }
  const history = [...state.history, entry].slice(-MAX_HISTORY);
  return { ...state, marks, history, moves: state.moves + 1, lastCheck: null };
}

/** Cycles a cell: empty → ✗ → ✓ → empty. */
export const cycleMark = (state: ConstraintGridState, index: number): ConstraintGridState =>
  setMark(state, index, nextMark(state.marks[index] ?? MARK_UNKNOWN));

/** Reverts the last mark change (including its auto-✗ marks). */
export function undo(state: ConstraintGridState): ConstraintGridState {
  const entry = state.history[state.history.length - 1];
  if (!entry || isSolved(state)) return state;
  const marks = [...state.marks];
  for (let k = entry.length - 2; k >= 0; k -= 2) marks[entry[k] as number] = entry[k + 1] as number;
  return { ...state, marks, history: state.history.slice(0, -1), lastCheck: null };
}

export function toggleUsed(state: ConstraintGridState, clue: number): ConstraintGridState {
  if (!isInt(clue, 0, state.used.length - 1)) return state;
  const used = [...state.used];
  used[clue] = !used[clue];
  return { ...state, used };
}

export function setAutoExclude(state: ConstraintGridState, autoExclude: boolean): ConstraintGridState {
  return state.autoExclude === autoExclude ? state : { ...state, autoExclude };
}

/** Counts contradicting marks without revealing which they are. */
export function check(state: ConstraintGridState): ConstraintGridState {
  if (isSolved(state)) return state;
  return { ...state, checks: state.checks + 1, lastCheck: contradictions(state) };
}

// --- Validation of untrusted saves ------------------------------------------------------------

const isCounter = (value: unknown): value is number => isInt(value, 0, MAX_COUNTER);

const isRef = (value: unknown, categories: number, size: number): value is Ref =>
  isRecord(value) && isInt(value.cat, 0, categories - 1) && isInt(value.item, 0, size - 1);

export function isClue(value: unknown, categories: number, size: number): value is Clue {
  if (!isRecord(value) || !isOneOf(value.type, CLUE_TYPES)) return false;
  const { type, a, b } = value;
  if (!isRef(a, categories, size) || !isRef(b, categories, size)) return false;
  if (type === 'eitherOr') {
    const c = value.c;
    return isRef(c, categories, size) && b.cat === c.cat && b.cat !== a.cat && b.item !== c.item;
  }
  if (type === 'same' || type === 'notSame') return a.cat !== b.cat;
  return a.cat !== FLOOR && b.cat !== FLOOR && (a.cat !== b.cat || a.item !== b.item);
}

export function isKinds(value: unknown, categories: number): value is CategoryKind[] {
  if (!Array.isArray(value) || value.length !== categories || value[0] !== 'person' || value[1] !== 'floor') return false;
  const attributes = value.slice(2);
  return attributes.every((k) => isOneOf(k, ATTRIBUTE_KINDS)) && new Set(attributes).size === attributes.length;
}

export function isVocab(value: unknown, kinds: readonly CategoryKind[], size: number): value is number[][] {
  if (!Array.isArray(value) || value.length !== kinds.length) return false;
  return kinds.every((kind, c) => {
    const row: unknown = value[c];
    if (kind === 'floor') return Array.isArray(row) && row.length === size && row.every((v, i) => v === i);
    const max = kind === 'person' ? NAME_COUNT : VOCABULARY[kind].length;
    return Array.isArray(row) && row.length === size && row.every((v) => isInt(v, 0, max - 1)) && new Set(row).size === size;
  });
}

/** One permutation per category; the names (category 0) are the identity. */
export function isSolution(value: unknown, categories: number, size: number): value is number[][] {
  if (!Array.isArray(value) || value.length !== categories || !value.every((perm) => isPermutation(perm, size))) return false;
  return (value[PERSON] as number[]).every((slot, p) => slot === p);
}

export function isHistory(value: unknown, total: number): value is number[][] {
  if (!Array.isArray(value) || value.length > MAX_HISTORY) return false;
  return value.every((entry) =>
    Array.isArray(entry) && entry.length >= 2 && entry.length % 2 === 0 &&
    entry.every((v, k) => (k % 2 === 0 ? isInt(v, 0, total - 1) : isInt(v, 0, 2))));
}

export function isConstraintGridState(value: unknown): value is ConstraintGridState {
  try {
    if (!isRecord(value)) return false;
    const v = value;
    if (!isUint32(v.seed) || !isOneOf(v.difficulty, DIFFICULTIES)) return false;
    const { categories, items: size } = SHAPES[v.difficulty];
    if (v.size !== size || !isKinds(v.kinds, categories) || !isVocab(v.vocab, v.kinds, size)) return false;
    const solution = v.solution;
    if (!isSolution(solution, categories, size)) return false;
    const clues = v.clues;
    if (!Array.isArray(clues) || clues.length === 0 || clues.length > MAX_CLUES) return false;
    if (!clues.every((clue) => isClue(clue, categories, size) && clueHolds(clue, solution))) return false;
    const total = markCount(categories, size);
    if (!Array.isArray(v.marks) || v.marks.length !== total || !v.marks.every((m) => isInt(m, 0, 2))) return false;
    if (!Array.isArray(v.used) || v.used.length !== clues.length || !v.used.every((u) => typeof u === 'boolean')) return false;
    if (typeof v.autoExclude !== 'boolean' || !isHistory(v.history, total)) return false;
    if (!isCounter(v.moves) || !isCounter(v.checks)) return false;
    return v.lastCheck === null || isInt(v.lastCheck, 0, total);
  } catch {
    return false;
  }
}
