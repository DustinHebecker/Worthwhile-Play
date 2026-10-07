import { createRng, isArrayOf, isInt, isOneOf, isRecord, isUint32, normalizeSeed, type Rng } from '@wp/game-core';

/*
 * Minimal Proof ("Proof Chain"): pure, DOM-free game logic.
 *
 * Logic used (sound and deliberately small):
 * - Atoms are literals: a letter (A, B, …) or, on "hard", the negation of a letter (¬C).
 *   A negated literal is simply a separate statement; there is no contrapositive, no
 *   "ex falso", and the generator guarantees that no puzzle can ever derive both C and ¬C.
 * - Rules: `imp` X → Y, `and` X ∧ Y → Z (both needed) and `or` X ∨ Y → Z (either suffices:
 *   proof by cases, the combination of X → Z and Y → Z).
 * - One step = applying one rule whose premises are known and whose conclusion is new.
 *   Every step adds exactly one statement, so the shortest proof is the smallest number of
 *   applications after which the goal is known (found by breadth-first search over the
 *   sets of known statements).
 */

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'easy';

export const OPS = ['imp', 'and', 'or'] as const;
export type Op = (typeof OPS)[number];

/** Themed nouns; translated as `vocab.<id>` and `vocab.<id>.not`. */
export const VOCAB = ['key', 'coin', 'lamp', 'map', 'boat', 'bridge', 'torch', 'rope', 'ladder', 'compass'] as const;
export const MAX_ATOMS = 12;
export const MAX_RULES = 16;

export interface Atom {
  /** Letter index: 0 = A, 1 = B, … */
  letter: number;
  /** True for the negated statement ¬letter. */
  neg: boolean;
  /** Index into `VOCAB`; the same for a letter and its negation. */
  label: number;
}

export interface Rule {
  op: Op;
  /** One premise for `imp`, two for `and`/`or`. */
  premises: number[];
  conclusion: number;
}

export interface Puzzle {
  atoms: Atom[];
  facts: number[];
  rules: Rule[];
  goal: number;
  /** Length of a shortest proof of `goal`. */
  minimal: number;
}

export interface MinimalProofState {
  seed: number;
  difficulty: Difficulty;
  puzzle: Puzzle;
  /** Rule indices in the order they were applied. */
  applied: number[];
}

export interface Profile {
  /** Number of letters (positive statements). */
  atoms: number;
  rules: number;
  facts: number;
  /** Extra negated statements ¬X for some of the letters. */
  negated: number;
  ops: readonly Op[];
  /** Inclusive range for the shortest proof length. */
  minimal: readonly [number, number];
}

export const PROFILES: Readonly<Record<Difficulty, Profile>> = {
  easy: { atoms: 5, rules: 4, facts: 1, negated: 0, ops: ['imp'], minimal: [2, 3] },
  medium: { atoms: 7, rules: 7, facts: 2, negated: 0, ops: ['imp', 'and'], minimal: [3, 5] },
  hard: { atoms: 9, rules: 10, facts: 2, negated: 2, ops: ['imp', 'and', 'or'], minimal: [5, 7] }
};

export const toDifficulty = (value: unknown): Difficulty => (isOneOf(value, DIFFICULTIES) ? value : DEFAULT_DIFFICULTY);

export const premiseCount = (op: Op): number => (op === 'imp' ? 1 : 2);

// --- Knowledge -------------------------------------------------------------------------------

/** Whether the rule's premises are satisfied by the set of known atoms. */
export function premisesMet(rule: Rule, known: ReadonlySet<number>): boolean {
  return rule.op === 'or' ? rule.premises.some((p) => known.has(p)) : rule.premises.every((p) => known.has(p));
}

/** Premises still missing (for `or`: all of them when none is known, otherwise none). */
export function missingPremises(rule: Rule, known: ReadonlySet<number>): number[] {
  if (premisesMet(rule, known)) return [];
  return rule.premises.filter((p) => !known.has(p));
}

/** Facts plus every conclusion in `applied`, in order. */
export function knownList(puzzle: Puzzle, applied: readonly number[]): number[] {
  return [...puzzle.facts, ...applied.map((r) => (puzzle.rules[r] as Rule).conclusion)];
}

export const knownSet = (puzzle: Puzzle, applied: readonly number[]): Set<number> => new Set(knownList(puzzle, applied));

/** Everything derivable from `start` (forward chaining to a fixpoint). */
export function closure(rules: readonly Rule[], start: Iterable<number>): Set<number> {
  const known = new Set(start);
  let changed = true;
  while (changed) {
    changed = false;
    for (const rule of rules) {
      if (!known.has(rule.conclusion) && premisesMet(rule, known)) {
        known.add(rule.conclusion);
        changed = true;
      }
    }
  }
  return known;
}

/** True when no derivable set contains both a letter and its negation. */
export function isConsistent(atoms: readonly Atom[], known: ReadonlySet<number>): boolean {
  const seen = new Map<number, boolean>();
  for (const i of known) {
    const atom = atoms[i];
    if (!atom) continue;
    const other = seen.get(atom.letter);
    if (other !== undefined && other !== atom.neg) return false;
    seen.set(atom.letter, atom.neg);
  }
  return true;
}

/**
 * Shortest number of rule applications after which each atom is known (0 for facts, null when
 * unreachable). Breadth-first search over the sets of known atoms (bitmasks).
 */
export function shortestDistances(atomCount: number, rules: readonly Rule[], facts: readonly number[]): (number | null)[] {
  const result: (number | null)[] = Array.from({ length: atomCount }, () => null);
  let start = 0;
  for (const f of facts) start |= 1 << f;
  const seen = new Set<number>([start]);
  let frontier = [start];
  for (let depth = 0; frontier.length > 0; depth++) {
    const next: number[] = [];
    for (const mask of frontier) {
      for (let a = 0; a < atomCount; a++) if (mask & (1 << a) && result[a] === null) result[a] = depth;
      for (const rule of rules) {
        const bit = 1 << rule.conclusion;
        if (mask & bit) continue;
        const has = (p: number) => (mask & (1 << p)) !== 0;
        const ok = rule.op === 'or' ? rule.premises.some(has) : rule.premises.every(has);
        if (!ok) continue;
        const grown = mask | bit;
        if (!seen.has(grown)) {
          seen.add(grown);
          next.push(grown);
        }
      }
    }
    frontier = next;
  }
  return result;
}

/** The game's solver: length of a shortest proof of `goal`, or null if it cannot be proved. */
export function minimalSteps(atomCount: number, rules: readonly Rule[], facts: readonly number[], goal: number): number | null {
  return shortestDistances(atomCount, rules, facts)[goal] ?? null;
}

// --- Moves -----------------------------------------------------------------------------------

export type Verdict = 'ok' | 'missing' | 'known' | 'solved' | 'invalid';

export const isSolved = (state: MinimalProofState): boolean => knownSet(state.puzzle, state.applied).has(state.puzzle.goal);

/** Why a rule can or cannot be applied right now. */
export function verdict(state: MinimalProofState, ruleIndex: number): Verdict {
  const rule = state.puzzle.rules[ruleIndex];
  if (!rule || !Number.isInteger(ruleIndex)) return 'invalid';
  const known = knownSet(state.puzzle, state.applied);
  if (known.has(state.puzzle.goal)) return 'solved';
  if (known.has(rule.conclusion)) return 'known';
  return premisesMet(rule, known) ? 'ok' : 'missing';
}

/** Applies a rule; returns the same object when the move is refused. */
export function applyRule(state: MinimalProofState, ruleIndex: number): MinimalProofState {
  if (verdict(state, ruleIndex) !== 'ok') return state;
  return { ...state, applied: [...state.applied, ruleIndex] };
}

/** Takes back the last step (not after the goal is proved). */
export function undo(state: MinimalProofState): MinimalProofState {
  if (state.applied.length === 0 || isSolved(state)) return state;
  return { ...state, applied: state.applied.slice(0, -1) };
}

/** Clears all steps (not after the goal is proved). */
export function resetProof(state: MinimalProofState): MinimalProofState {
  if (state.applied.length === 0 || isSolved(state)) return state;
  return { ...state, applied: [] };
}

// --- Generation ------------------------------------------------------------------------------

const ruleKey = (rule: Rule): string => `${rule.op}:${[...rule.premises].sort((a, b) => a - b).join(',')}>${rule.conclusion}`;

/** Atoms for a profile: positive letters first, then negations of distinct letters. */
function makeAtoms(rng: Rng, profile: Profile): Atom[] {
  const positives = profile.atoms;
  const labels = rng.shuffle(VOCAB.map((_, i) => i));
  const atoms: Atom[] = [];
  for (let i = 0; i < positives; i++) atoms.push({ letter: i, neg: false, label: labels[i] as number });
  const negatedLetters = rng.shuffle(atoms.map((a) => a.letter)).slice(0, profile.negated);
  for (const letter of negatedLetters) atoms.push({ letter, neg: true, label: (atoms[letter] as Atom).label });
  return atoms;
}

function finish(rng: Rng, atoms: Atom[], facts: number[], rules: Rule[], goal: number, minimal: number): Puzzle {
  return { atoms, facts: [...facts].sort((a, b) => a - b), rules: rng.shuffle(rules), goal, minimal };
}

/** Accepts a candidate rule set when it is consistent and some atom's shortest proof is in range. */
function pickGoal(rng: Rng, profile: Profile, atoms: Atom[], facts: number[], rules: Rule[]): { goal: number; minimal: number } | null {
  if (!isConsistent(atoms, closure(rules, facts))) return null;
  const dist = shortestDistances(atoms.length, rules, facts);
  const [lo, hi] = profile.minimal;
  let best = -1;
  for (const d of dist) if (d !== null && d >= lo && d <= hi && d > best) best = d;
  if (best < 0) return null;
  const candidates = dist.flatMap((d, i) => (d === best ? [i] : []));
  return { goal: rng.pick(candidates), minimal: best };
}

/** One random attempt: a hidden chain of derivations plus distractor rules. */
function attempt(rng: Rng, profile: Profile): Puzzle | null {
  const atoms = makeAtoms(rng, profile);
  // A consistent order: never both a letter and its negation.
  const order: number[] = [];
  for (const i of rng.shuffle(atoms.map((_, k) => k))) {
    if (!order.some((o) => (atoms[o] as Atom).letter === (atoms[i] as Atom).letter)) order.push(i);
  }
  const facts = order.slice(0, profile.facts);
  const [, hi] = profile.minimal;
  const chainLength = Math.min(hi, profile.rules, order.length - profile.facts);
  const rules: Rule[] = [];
  const keys = new Set<string>();
  const add = (rule: Rule) => {
    const key = ruleKey(rule);
    const premiseLetters = rule.premises.map((p) => (atoms[p] as Atom).letter);
    // No rule mentions a letter twice (e.g. ¬I ∨ I → C): such rules read as trick questions.
    if (keys.has(key) || new Set([...premiseLetters, (atoms[rule.conclusion] as Atom).letter]).size !== rule.premises.length + 1) return;
    keys.add(key);
    rules.push(rule);
  };
  const known = [...facts];
  let previous = facts[facts.length - 1] as number;
  for (let s = 0; s < chainLength; s++) {
    const conclusion = order[profile.facts + s] as number;
    const op = rng.pick(profile.ops);
    const premises = [previous];
    if (op === 'and') {
      const others = known.filter((k) => k !== previous);
      if (others.length > 0) premises.push(rng.pick(others));
    } else if (op === 'or') {
      const used = [(atoms[previous] as Atom).letter, (atoms[conclusion] as Atom).letter];
      premises.push(rng.pick(atoms.flatMap((a, i) => (used.includes(a.letter) ? [] : [i]))));
    }
    add({ op: premises.length === 1 ? 'imp' : op, premises, conclusion });
    known.push(conclusion);
    previous = conclusion;
  }
  const notFacts = atoms.map((_, i) => i).filter((i) => !facts.includes(i));
  for (let guard = 0; rules.length < profile.rules && guard < 200; guard++) {
    const op = rng.pick(profile.ops);
    const conclusion = rng.pick(notFacts);
    const pool = atoms.map((_, i) => i).filter((i) => i !== conclusion);
    const premises = rng.shuffle(pool).slice(0, premiseCount(op));
    add({ op, premises, conclusion });
  }
  if (rules.length !== profile.rules) return null;
  const picked = pickGoal(rng, profile, atoms, facts, rules);
  return picked ? finish(rng, atoms, facts, rules, picked.goal, picked.minimal) : null;
}

/**
 * Guaranteed construction (used only if random attempts fail): a chain of `lo` implications over
 * positive letters, plus distractors whose premise is the goal or an atom nothing concludes, and
 * whose conclusion is a chain atom. Such distractors can never shorten the proof.
 */
export function fallbackPuzzle(rng: Rng, profile: Profile): Puzzle {
  const atoms = makeAtoms(rng, profile);
  const positives = rng.shuffle(atoms.flatMap((a, i) => (a.neg ? [] : [i])));
  const facts = positives.slice(0, profile.facts);
  const length = profile.minimal[0];
  const chain = positives.slice(profile.facts, profile.facts + length);
  const rules: Rule[] = [];
  let previous = facts[facts.length - 1] as number;
  for (const c of chain) {
    rules.push({ op: 'imp', premises: [previous], conclusion: c });
    previous = c;
  }
  const goal = previous;
  const dead = atoms.map((_, i) => i).filter((i) => !facts.includes(i) && !chain.includes(i));
  const pairs = rng.shuffle([goal, ...dead].flatMap((p) => chain.filter((c) => (atoms[c] as Atom).letter !== (atoms[p] as Atom).letter).map((c) => [p, c] as const)));
  for (const [p, c] of pairs.slice(0, profile.rules - rules.length)) rules.push({ op: 'imp', premises: [p], conclusion: c });
  return finish(rng, atoms, facts, rules, goal, length);
}

export const MAX_ATTEMPTS = 400;

/** Seeded puzzle for a difficulty: random attempts first, the fallback construction last. */
export function generatePuzzle(seed: number, difficulty: Difficulty): Puzzle {
  const rng = createRng(seed);
  const profile = PROFILES[difficulty];
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const puzzle = attempt(rng, profile);
    if (puzzle) return puzzle;
  }
  return fallbackPuzzle(rng, profile);
}

export function createInitialState(seed: number, difficulty: Difficulty = DEFAULT_DIFFICULTY): MinimalProofState {
  const s = normalizeSeed(seed);
  return { seed: s, difficulty, puzzle: generatePuzzle(s, difficulty), applied: [] };
}

// --- Validation ------------------------------------------------------------------------------

const isBool = (value: unknown): value is boolean => typeof value === 'boolean';

function isAtom(value: unknown): value is Atom {
  return isRecord(value) && isInt(value.letter, 0, 25) && isBool(value.neg) && isInt(value.label, 0, VOCAB.length - 1);
}

const distinct = (list: readonly number[]): boolean => new Set(list).size === list.length;

function isRuleFor(value: unknown, atomCount: number): value is Rule {
  if (!isRecord(value) || !isOneOf(value.op, OPS)) return false;
  const inRange = (x: unknown): x is number => isInt(x, 0, atomCount - 1);
  if (!isArrayOf(value.premises, inRange, premiseCount(value.op)) || !inRange(value.conclusion)) return false;
  return distinct(value.premises) && !value.premises.includes(value.conclusion);
}

export function isPuzzle(value: unknown): value is Puzzle {
  if (!isRecord(value)) return false;
  const { atoms, facts, rules, goal, minimal } = value;
  if (!isArrayOf(atoms, isAtom) || atoms.length < 2 || atoms.length > MAX_ATOMS) return false;
  const pairs = atoms.map((a) => `${a.letter}${a.neg ? '-' : '+'}`);
  if (new Set(pairs).size !== pairs.length) return false;
  const n = atoms.length;
  const inRange = (x: unknown): x is number => isInt(x, 0, n - 1);
  if (!isArrayOf(facts, inRange) || facts.length === 0 || !distinct(facts)) return false;
  if (!Array.isArray(rules) || rules.length === 0 || rules.length > MAX_RULES) return false;
  if (!rules.every((r) => isRuleFor(r, n))) return false;
  if (!inRange(goal) || facts.includes(goal) || !isInt(minimal, 1, MAX_ATOMS)) return false;
  if (!isConsistent(atoms, closure(rules as Rule[], facts))) return false;
  return minimalSteps(n, rules as Rule[], facts, goal) === minimal;
}

export function isMinimalProofState(value: unknown): value is MinimalProofState {
  try {
    if (!isRecord(value) || !isUint32(value.seed) || !isOneOf(value.difficulty, DIFFICULTIES)) return false;
    if (!isPuzzle(value.puzzle)) return false;
    const puzzle = value.puzzle;
    if (!isArrayOf(value.applied, (x): x is number => isInt(x, 0, puzzle.rules.length - 1))) return false;
    // Replay: every step must have been legal, and nothing may follow the proof of the goal.
    let state: MinimalProofState = { seed: value.seed, difficulty: value.difficulty, puzzle, applied: [] };
    for (const r of value.applied) {
      const next = applyRule(state, r);
      if (next === state) return false;
      state = next;
    }
    return true;
  } catch {
    return false;
  }
}
