import { createRng, isArrayOf, isInt, isOneOf, isRecord, isUint32, type Rng } from '@wp/game-core';

/**
 * Fix the Machine — pure game logic.
 *
 * A machine is a list of rules over three integer registers x, y, z. The rules run once each,
 * from top to bottom. A rule optionally has a condition (`x > 4 ⇒ …`) and an action that
 * changes one register (`y += 2`, `z -= x`, `y = 3`). A puzzle is created from a seeded correct
 * machine plus test cases (start values → expected end values) by injecting exactly one bug
 * into one rule. Each rule offers four replacement options; exactly one (rule, option) pair —
 * the original rule at the bug position — makes every test case pass.
 */

export const VARS = ['x', 'y', 'z'] as const;
export type Var = (typeof VARS)[number];
export const CMPS = ['>', '≥', '<', '≤', '=', '≠'] as const;
export type Cmp = (typeof CMPS)[number];
export const OPS = ['+=', '-=', '='] as const;
export type Op = (typeof OPS)[number];

/** Registers [x, y, z]. */
export type Regs = [number, number, number];

export interface Rule {
  /** Optional condition: register, comparison, constant. */
  c: [Var, Cmp, number] | null;
  /** Target register. */
  t: Var;
  op: Op;
  /** Argument: a constant or another register. */
  a: number | Var;
}

export interface TestCase {
  input: Regs;
  expected: Regs;
}

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const DIFFICULTY_SPEC: Readonly<Record<Difficulty, { rules: readonly [number, number]; tests: number }>> = {
  easy: { rules: [3, 4], tests: 1 },
  medium: { rules: [5, 6], tests: 2 },
  hard: { rules: [7, 8], tests: 3 }
};

/** Number of replacement options offered per rule. */
export const OPTION_COUNT = 4;
/** Constants stay within this range (conditions and arguments). */
export const CONST_MIN = 0;
export const CONST_MAX = 9;
/** Register values are bounded in saves to reject absurd data. */
export const VALUE_LIMIT = 9999;

export interface DebugState {
  v: 1;
  seed: number;
  difficulty: Difficulty;
  /** The faulty machine as shown to the player. */
  rules: Rule[];
  tests: TestCase[];
  /** Replacement options per rule (OPTION_COUNT each). */
  options: Rule[][];
  /** Selected test case for the step-by-step run. */
  test: number;
  /** Number of rules executed in the step-by-step run (0 … rules.length). */
  cursor: number;
  /** Rule the player suspects (index) or null. */
  picked: number | null;
  /** Chosen replacement option for the picked rule, or null. */
  chosen: number | null;
  /** Options already checked without success, as [rule, option] pairs. */
  tried: [number, number][];
  /** Result of the last unsuccessful check: number of passing test cases. */
  lastPassed: number | null;
  stepsViewed: number;
  wrongPicks: number;
  /** The applied fix once solved. */
  fix: [number, number] | null;
}

// --- Interpreter -------------------------------------------------------------------------------

const index = (v: Var): number => VARS.indexOf(v);

export function compare(left: number, cmp: Cmp, right: number): boolean {
  switch (cmp) {
    case '>':
      return left > right;
    case '≥':
      return left >= right;
    case '<':
      return left < right;
    case '≤':
      return left <= right;
    case '=':
      return left === right;
    case '≠':
      return left !== right;
  }
}

/** True when the rule's condition holds (or it has none). */
export function conditionHolds(rule: Rule, regs: Readonly<Regs>): boolean {
  if (rule.c === null) return true;
  const [v, cmp, k] = rule.c;
  return compare(regs[index(v)] as number, cmp, k);
}

/** Executes one rule; returns the new registers and whether the action fired. */
export function execRule(rule: Rule, regs: Readonly<Regs>): { regs: Regs; fired: boolean } {
  const next: Regs = [regs[0], regs[1], regs[2]];
  if (!conditionHolds(rule, regs)) return { regs: next, fired: false };
  const arg = typeof rule.a === 'number' ? rule.a : (regs[index(rule.a)] as number);
  const i = index(rule.t);
  const current = next[i] as number;
  next[i] = rule.op === '+=' ? current + arg : rule.op === '-=' ? current - arg : arg;
  return { regs: next, fired: true };
}

export interface Trace {
  /** trace[0] = start values, trace[i] = values after i steps. */
  states: Regs[];
  /** fired[i] = whether rule i's action ran. */
  fired: boolean[];
  /** True when every rule ran within the step limit. */
  halted: boolean;
}

/** Runs the machine top to bottom, executing at most `maxSteps` rules. */
export function runMachine(rules: readonly Rule[], input: Readonly<Regs>, maxSteps: number = rules.length): Trace {
  const states: Regs[] = [[input[0], input[1], input[2]]];
  const fired: boolean[] = [];
  const limit = Math.max(0, Math.min(rules.length, Math.floor(maxSteps)));
  for (let i = 0; i < limit; i++) {
    const step = execRule(rules[i] as Rule, states[i] as Regs);
    states.push(step.regs);
    fired.push(step.fired);
  }
  return { states, fired, halted: limit === rules.length };
}

/** Final register values after running the whole machine. */
export function output(rules: readonly Rule[], input: Readonly<Regs>): Regs {
  const { states } = runMachine(rules, input);
  return states[states.length - 1] as Regs;
}

export const sameRegs = (a: Readonly<Regs>, b: Readonly<Regs>): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

/** Pass/fail per test case for a machine. */
export function testResults(rules: readonly Rule[], tests: readonly TestCase[]): boolean[] {
  return tests.map((test) => sameRegs(output(rules, test.input), test.expected));
}

/** The machine with rule `ruleIndex` replaced. */
export function withRule(rules: readonly Rule[], ruleIndex: number, replacement: Rule): Rule[] {
  return rules.map((rule, i) => (i === ruleIndex ? replacement : rule));
}

export const sameRule = (a: Rule, b: Rule): boolean =>
  a.t === b.t && a.op === b.op && a.a === b.a && (a.c === null ? b.c === null : b.c !== null && a.c[0] === b.c[0] && a.c[1] === b.c[1] && a.c[2] === b.c[2]);

// --- Mutations ---------------------------------------------------------------------------------

/** Comparison swaps used for "wrong comparison" bugs (each relation is symmetric). */
const CMP_SWAPS: Readonly<Record<Cmp, readonly Cmp[]>> = {
  '>': ['≥', '<'],
  '≥': ['>', '≤'],
  '<': ['≤', '>'],
  '≤': ['<', '≥'],
  '=': ['≠'],
  '≠': ['=']
};

const inConst = (k: number) => k >= CONST_MIN && k <= CONST_MAX;

/**
 * All single-change variants of a rule: off-by-one constants, wrong comparison,
 * wrong target register, wrong operation. The relation is symmetric: if B is a mutation
 * of A, then A is a mutation of B.
 */
export function mutations(rule: Rule): Rule[] {
  const out: Rule[] = [];
  const add = (candidate: Rule) => {
    if (!sameRule(candidate, rule) && !out.some((r) => sameRule(r, candidate)) && isWellFormedRule(candidate)) out.push(candidate);
  };
  if (rule.c !== null) {
    const [v, cmp, k] = rule.c;
    for (const d of [-1, 1]) if (inConst(k + d)) add({ ...rule, c: [v, cmp, k + d] });
    for (const swap of CMP_SWAPS[cmp]) add({ ...rule, c: [v, swap, k] });
  }
  if (typeof rule.a === 'number') {
    for (const d of [-1, 1]) if (inConst(rule.a + d)) add({ ...rule, a: rule.a + d });
  }
  for (const t of VARS) if (t !== rule.t) add({ ...rule, t });
  for (const op of OPS) if (op !== rule.op && (op === '=') === (rule.op === '=')) add({ ...rule, op });
  return out;
}

/** A rule never uses its own target as argument (`y += y` is not used). */
export function isWellFormedRule(rule: Rule): boolean {
  return rule.a !== rule.t;
}

// --- Generation --------------------------------------------------------------------------------

function randomRule(rng: Rng, conditional: boolean): Rule {
  const t = rng.pick(VARS);
  const op = rng.pick(['+=', '+=', '-=', '='] as const);
  const others = VARS.filter((v) => v !== t);
  const useVar = rng.int(0, 2) === 0;
  const a: number | Var = useVar ? rng.pick(others) : rng.int(op === '=' ? 0 : 1, op === '=' ? CONST_MAX : 5);
  const c: Rule['c'] = conditional ? [rng.pick(VARS), rng.pick(CMPS.slice(0, 5)), rng.int(1, 8)] : null;
  return { c, t, op, a };
}

function randomInput(rng: Rng): Regs {
  return [rng.int(0, 9), rng.int(0, 5), 0];
}

export interface Puzzle {
  correct: Rule[];
  rules: Rule[];
  tests: TestCase[];
  options: Rule[][];
  bug: number;
}

/** True when the option set has exactly one passing (rule, option) pair: (bug, original). */
export function passingFixes(rules: readonly Rule[], tests: readonly TestCase[], options: readonly (readonly Rule[])[]): [number, number][] {
  const found: [number, number][] = [];
  options.forEach((list, i) => {
    list.forEach((option, j) => {
      if (testResults(withRule(rules, i, option), tests).every(Boolean)) found.push([i, j]);
    });
  });
  return found;
}

function tryGenerate(rng: Rng, difficulty: Difficulty): Puzzle | null {
  const spec = DIFFICULTY_SPEC[difficulty];
  const n = rng.int(spec.rules[0], spec.rules[1]);
  const correct: Rule[] = [];
  for (let i = 0; i < n; i++) correct.push(randomRule(rng, i > 0 && rng.int(0, 2) > 0));
  const tests: TestCase[] = [];
  for (let k = 0; k < spec.tests; k++) {
    const input = randomInput(rng);
    if (tests.some((test) => sameRegs(test.input, input))) return null;
    tests.push({ input, expected: output(correct, input) });
  }
  // Every rule should matter for at least one test, so no rule is dead weight.
  for (let i = 0; i < n; i++) {
    const skipped = correct.filter((_, j) => j !== i);
    if (testResults(skipped, tests).every(Boolean)) return null;
  }
  const bug = rng.int(0, n - 1);
  const bugCandidates = mutations(correct[bug] as Rule).filter((m) => !testResults(withRule(correct, bug, m), tests).every(Boolean));
  if (bugCandidates.length === 0) return null;
  const buggyRule = rng.pick(bugCandidates);
  const rules = withRule(correct, bug, buggyRule);

  const options: Rule[][] = [];
  for (let i = 0; i < n; i++) {
    const rule = rules[i] as Rule;
    const failing = mutations(rule).filter((m) => !(i === bug && sameRule(m, correct[bug] as Rule)) && !testResults(withRule(rules, i, m), tests).every(Boolean));
    const need = i === bug ? OPTION_COUNT - 1 : OPTION_COUNT;
    if (failing.length < need) return null;
    const chosen = rng.shuffle(failing).slice(0, need);
    if (i === bug) chosen.push(correct[bug] as Rule);
    options.push(rng.shuffle(chosen));
  }
  if (passingFixes(rules, tests, options).length !== 1) return null;
  return { correct, rules, tests, options, bug };
}

export function generatePuzzle(seed: number, difficulty: Difficulty): Puzzle {
  const rng = createRng(seed);
  for (let attempt = 0; attempt < 5000; attempt++) {
    const puzzle = tryGenerate(rng, difficulty);
    if (puzzle) return puzzle;
  }
  /* c8 ignore next */
  throw new Error('Could not generate a puzzle.');
}

export const toDifficulty = (value: unknown): Difficulty => (isOneOf(value, DIFFICULTIES) ? value : 'easy');

export function createInitialState(seed: number, difficulty: unknown = 'easy'): DebugState {
  const d = toDifficulty(difficulty);
  const s = seed >>> 0;
  const puzzle = generatePuzzle(s, d);
  return {
    v: 1,
    seed: s,
    difficulty: d,
    rules: puzzle.rules,
    tests: puzzle.tests,
    options: puzzle.options,
    test: 0,
    cursor: 0,
    picked: null,
    chosen: null,
    tried: [],
    lastPassed: null,
    stepsViewed: 0,
    wrongPicks: 0,
    fix: null
  };
}

// --- Player actions (pure; return the same object when nothing changes) -----------------------

export const isSolved = (s: DebugState): boolean => s.fix !== null;

/** The machine currently in effect (with the fix applied once solved). */
export function currentMachine(s: DebugState): Rule[] {
  if (s.fix === null) return s.rules;
  const [i, j] = s.fix;
  return withRule(s.rules, i, s.options[i]?.[j] as Rule);
}

/** Executes the next rule of the step-by-step run, or starts over after the last rule. */
export function step(s: DebugState): DebugState {
  if (s.cursor >= s.rules.length) return { ...s, cursor: 0 };
  return { ...s, cursor: s.cursor + 1, stepsViewed: s.stepsViewed + 1 };
}

export function selectTest(s: DebugState, k: number): DebugState {
  if (!Number.isInteger(k) || k < 0 || k >= s.tests.length || k === s.test) return s;
  return { ...s, test: k, cursor: 0 };
}

export function pickRule(s: DebugState, i: number): DebugState {
  if (isSolved(s) || !Number.isInteger(i) || i < 0 || i >= s.rules.length || i === s.picked) return s;
  return { ...s, picked: i, chosen: null, lastPassed: null };
}

export function chooseFix(s: DebugState, j: number): DebugState {
  if (isSolved(s) || s.picked === null || !Number.isInteger(j) || j < 0 || j >= OPTION_COUNT || j === s.chosen) return s;
  return { ...s, chosen: j };
}

export const wasTried = (s: DebugState, i: number, j: number): boolean => s.tried.some(([a, b]) => a === i && b === j);

/** Applies the chosen fix: solved when every test passes, otherwise counted as a wrong pick. */
export function checkFix(s: DebugState): DebugState {
  if (isSolved(s) || s.picked === null || s.chosen === null) return s;
  const i = s.picked;
  const j = s.chosen;
  const results = testResults(withRule(s.rules, i, s.options[i]?.[j] as Rule), s.tests);
  if (results.every(Boolean)) return { ...s, fix: [i, j], chosen: null, lastPassed: null, cursor: 0 };
  return {
    ...s,
    chosen: null,
    tried: wasTried(s, i, j) ? s.tried : [...s.tried, [i, j]],
    lastPassed: results.filter(Boolean).length,
    wrongPicks: s.wrongPicks + 1
  };
}

// --- Validation --------------------------------------------------------------------------------

const isValue = (v: unknown): v is number => isInt(v, -VALUE_LIMIT, VALUE_LIMIT);
const isRegs = (v: unknown): v is Regs => isArrayOf(v, isValue, 3);
const isConst = (v: unknown): v is number => isInt(v, CONST_MIN, CONST_MAX);

export function isRule(value: unknown): value is Rule {
  if (!isRecord(value)) return false;
  const { c, t, op, a } = value;
  if (!isOneOf(t, VARS) || !isOneOf(op, OPS)) return false;
  if (!(isConst(a) || isOneOf(a, VARS)) || a === t) return false;
  if (c === null) return true;
  return Array.isArray(c) && c.length === 3 && isOneOf(c[0], VARS) && isOneOf(c[1], CMPS) && isConst(c[2]);
}

const isNullableIndex = (v: unknown, size: number): v is number | null => v === null || isInt(v, 0, size - 1);
const isPair = (v: unknown, a: number, b: number): v is [number, number] => Array.isArray(v) && v.length === 2 && isInt(v[0], 0, a - 1) && isInt(v[1], 0, b - 1);

export function isDebugState(value: unknown): value is DebugState {
  try {
    if (!isRecord(value) || value.v !== 1 || !isUint32(value.seed) || !isOneOf(value.difficulty, DIFFICULTIES)) return false;
    const spec = DIFFICULTY_SPEC[value.difficulty];
    const { rules, tests, options } = value;
    if (!isArrayOf(rules, isRule) || rules.length < spec.rules[0] || rules.length > spec.rules[1]) return false;
    const n = rules.length;
    if (!Array.isArray(tests) || tests.length !== spec.tests) return false;
    if (!tests.every((test) => isRecord(test) && isRegs(test.input) && isRegs(test.expected))) return false;
    if (!Array.isArray(options) || options.length !== n || !options.every((list) => isArrayOf(list, isRule, OPTION_COUNT))) return false;
    if (!isInt(value.test, 0, spec.tests - 1) || !isInt(value.cursor, 0, n)) return false;
    if (!isNullableIndex(value.picked, n) || !isNullableIndex(value.chosen, OPTION_COUNT)) return false;
    if (value.chosen !== null && value.picked === null) return false;
    if (!Array.isArray(value.tried) || value.tried.length > n * OPTION_COUNT || !value.tried.every((p) => isPair(p, n, OPTION_COUNT))) return false;
    if (!(value.lastPassed === null || isInt(value.lastPassed, 0, spec.tests))) return false;
    if (!isInt(value.stepsViewed, 0, Number.MAX_SAFE_INTEGER) || !isInt(value.wrongPicks, 0, Number.MAX_SAFE_INTEGER)) return false;
    if (value.fix !== null) {
      if (!isPair(value.fix, n, OPTION_COUNT)) return false;
      const [i, j] = value.fix;
      const machine = withRule(rules, i, (options as Rule[][])[i]?.[j] as Rule);
      if (!testResults(machine, tests as TestCase[]).every(Boolean)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

// --- Notation ----------------------------------------------------------------------------------

/** Language-neutral notation, e.g. `x > 4 ⇒ y += 2` or `z = x`. */
export function formatRule(rule: Rule): string {
  const action = `${rule.t} ${rule.op} ${rule.a}`;
  return rule.c === null ? action : `${rule.c[0]} ${rule.c[1]} ${rule.c[2]} ⇒ ${action}`;
}

export const formatRegs = (regs: Readonly<Regs>): string => VARS.map((v, i) => `${v} = ${regs[i]}`).join(', ');
