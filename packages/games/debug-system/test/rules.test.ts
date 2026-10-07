import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  CMPS,
  DIFFICULTIES,
  DIFFICULTY_SPEC,
  OPTION_COUNT,
  checkFix,
  chooseFix,
  compare,
  conditionHolds,
  createInitialState,
  currentMachine,
  execRule,
  formatRegs,
  formatRule,
  generatePuzzle,
  isDebugState,
  isRule,
  isSolved,
  isWellFormedRule,
  mutations,
  output,
  passingFixes,
  pickRule,
  runMachine,
  sameRule,
  selectTest,
  step,
  testResults,
  toDifficulty,
  withRule,
  type DebugState,
  type Difficulty,
  type Regs,
  type Rule,
  type TestCase
} from '../src/rules';

const r = (rule: Partial<Rule> & Pick<Rule, 't' | 'op' | 'a'>): Rule => ({ c: null, ...rule });
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/** Independent oracle interpreter (object-based registers, no shared code). */
function oracleRun(rules: readonly Rule[], input: Readonly<Regs>): Regs {
  const regs: Record<string, number> = { x: input[0], y: input[1], z: input[2] };
  for (const rule of rules) {
    if (rule.c) {
      const left = regs[rule.c[0]] as number;
      const k = rule.c[2];
      const ok = { '>': left > k, '≥': left >= k, '<': left < k, '≤': left <= k, '=': left === k, '≠': left !== k }[rule.c[1]];
      if (!ok) continue;
    }
    const arg = typeof rule.a === 'number' ? rule.a : (regs[rule.a] as number);
    if (rule.op === '=') regs[rule.t] = arg;
    else if (rule.op === '+=') regs[rule.t] = (regs[rule.t] as number) + arg;
    else regs[rule.t] = (regs[rule.t] as number) - arg;
  }
  return [regs.x as number, regs.y as number, regs.z as number];
}

const oraclePasses = (rules: readonly Rule[], tests: readonly TestCase[]) =>
  tests.every((test) => JSON.stringify(oracleRun(rules, test.input)) === JSON.stringify(test.expected));

/** Oracle: every (rule, option) pair that makes all tests pass. */
function oracleFixes(state: DebugState): [number, number][] {
  const found: [number, number][] = [];
  for (let i = 0; i < state.rules.length; i++) {
    for (let j = 0; j < (state.options[i]?.length ?? 0); j++) {
      const machine = state.rules.map((rule, k) => (k === i ? (state.options[i]?.[j] as Rule) : rule));
      if (oraclePasses(machine, state.tests)) found.push([i, j]);
    }
  }
  return found;
}

const arbDifficulty = fc.constantFrom<Difficulty>(...DIFFICULTIES);
const arbSeed = fc.integer({ min: 0, max: 0xffff_ffff });

describe('interpreter', () => {
  it('compares with every operator', () => {
    expect([compare(5, '>', 4), compare(4, '>', 4), compare(3, '>', 4)]).toEqual([true, false, false]);
    expect([compare(5, '≥', 4), compare(4, '≥', 4), compare(3, '≥', 4)]).toEqual([true, true, false]);
    expect([compare(5, '<', 4), compare(4, '<', 4), compare(3, '<', 4)]).toEqual([false, false, true]);
    expect([compare(5, '≤', 4), compare(4, '≤', 4), compare(3, '≤', 4)]).toEqual([false, true, true]);
    expect([compare(5, '=', 4), compare(4, '=', 4)]).toEqual([false, true]);
    expect([compare(5, '≠', 4), compare(4, '≠', 4)]).toEqual([true, false]);
  });

  it('executes += , -= and = with constants and registers', () => {
    expect(execRule(r({ t: 'y', op: '+=', a: 2 }), [1, 3, 5])).toEqual({ regs: [1, 5, 5], fired: true });
    expect(execRule(r({ t: 'z', op: '-=', a: 'x' }), [4, 0, 1])).toEqual({ regs: [4, 0, -3], fired: true });
    expect(execRule(r({ t: 'x', op: '=', a: 'z' }), [4, 0, 7])).toEqual({ regs: [7, 0, 7], fired: true });
    expect(execRule(r({ t: 'x', op: '=', a: 0 }), [4, 2, 7])).toEqual({ regs: [0, 2, 7], fired: true });
    expect(execRule(r({ t: 'y', op: '+=', a: 'z' }), [1, 1, 3])).toEqual({ regs: [1, 4, 3], fired: true });
  });

  it('only fires when the condition holds and never mutates its input', () => {
    const rule = r({ c: ['x', '>', 4], t: 'y', op: '+=', a: 2 });
    const regs: Regs = [4, 0, 0];
    expect(execRule(rule, regs)).toEqual({ regs: [4, 0, 0], fired: false });
    expect(execRule(rule, [5, 0, 0])).toEqual({ regs: [5, 2, 0], fired: true });
    expect(conditionHolds(r({ c: ['z', '=', 0], t: 'y', op: '+=', a: 1 }), [9, 9, 0])).toBe(true);
    expect(conditionHolds(r({ c: ['y', '=', 0], t: 'x', op: '+=', a: 1 }), [0, 9, 0])).toBe(false);
    expect(conditionHolds(r({ t: 'x', op: '+=', a: 1 }), [0, 0, 0])).toBe(true);
    const out = execRule(r({ t: 'x', op: '+=', a: 1 }), regs);
    expect(regs).toEqual([4, 0, 0]);
    expect(out.regs).not.toBe(regs);
  });

  it('runs top to bottom and records a full trace', () => {
    const rules = [r({ t: 'y', op: '+=', a: 'x' }), r({ c: ['y', '>', 5], t: 'z', op: '=', a: 1 }), r({ t: 'x', op: '-=', a: 2 })];
    const trace = runMachine(rules, [4, 3, 0]);
    expect(trace.states).toEqual([[4, 3, 0], [4, 7, 0], [4, 7, 1], [2, 7, 1]]);
    expect(trace.fired).toEqual([true, true, true]);
    expect(trace.halted).toBe(true);
    expect(output(rules, [1, 0, 0])).toEqual([-1, 1, 0]);
    expect(runMachine(rules, [1, 0, 0]).fired).toEqual([true, false, true]);
  });

  it('respects the step limit', () => {
    const rules = [r({ t: 'x', op: '+=', a: 1 }), r({ t: 'x', op: '+=', a: 1 }), r({ t: 'x', op: '+=', a: 1 })];
    expect(runMachine(rules, [0, 0, 0], 0)).toEqual({ states: [[0, 0, 0]], fired: [], halted: false });
    const two = runMachine(rules, [0, 0, 0], 2);
    expect(two.states).toEqual([[0, 0, 0], [1, 0, 0], [2, 0, 0]]);
    expect(two.halted).toBe(false);
    expect(runMachine(rules, [0, 0, 0], 99).states).toHaveLength(4);
    expect(runMachine(rules, [0, 0, 0], 99).halted).toBe(true);
    expect(runMachine(rules, [0, 0, 0], -3).states).toHaveLength(1);
    expect(runMachine(rules, [0, 0, 0], 1.7).states).toHaveLength(2);
    expect(runMachine([], [1, 2, 3])).toEqual({ states: [[1, 2, 3]], fired: [], halted: true });
  });

  it('agrees with the independent oracle on random machines', () => {
    const arbRule = fc
      .record({
        c: fc.option(fc.tuple(fc.constantFrom('x', 'y', 'z' as const), fc.constantFrom(...CMPS), fc.integer({ min: 0, max: 9 })), { nil: null }),
        t: fc.constantFrom('x', 'y', 'z' as const),
        op: fc.constantFrom('+=', '-=', '=' as const),
        a: fc.oneof(fc.integer({ min: 0, max: 9 }), fc.constantFrom('x', 'y', 'z' as const))
      })
      .filter((rule) => rule.a !== rule.t) as fc.Arbitrary<Rule>;
    const arbRegs = fc.tuple(fc.integer({ min: -20, max: 20 }), fc.integer({ min: -20, max: 20 }), fc.integer({ min: -20, max: 20 }));
    fc.assert(
      fc.property(fc.array(arbRule, { maxLength: 8 }), arbRegs, (rules, input) => {
        expect(output(rules, input)).toEqual(oracleRun(rules, input));
        const limit = Math.floor(rules.length / 2);
        const partial = runMachine(rules, input, limit);
        expect(partial.states[limit]).toEqual(oracleRun(rules.slice(0, limit), input));
      }),
      { numRuns: 300 }
    );
  });

  it('reports per-test results and replaces single rules', () => {
    const rules = [r({ t: 'y', op: '+=', a: 2 })];
    const tests: TestCase[] = [{ input: [0, 0, 0], expected: [0, 2, 0] }, { input: [0, 1, 0], expected: [0, 1, 0] }];
    expect(testResults(rules, tests)).toEqual([true, false]);
    const replaced = withRule(rules, 0, r({ t: 'y', op: '+=', a: 0 }));
    expect(replaced[0]).toEqual(r({ t: 'y', op: '+=', a: 0 }));
    expect(rules[0]).toEqual(r({ t: 'y', op: '+=', a: 2 }));
  });
});

describe('notation', () => {
  it('formats rules and registers language-neutrally', () => {
    expect(formatRule(r({ c: ['x', '>', 4], t: 'y', op: '+=', a: 2 }))).toBe('x > 4 ⇒ y += 2');
    expect(formatRule(r({ t: 'z', op: '=', a: 'x' }))).toBe('z = x');
    expect(formatRule(r({ c: ['y', '≠', 0], t: 'x', op: '-=', a: 'z' }))).toBe('y ≠ 0 ⇒ x -= z');
    expect(formatRegs([1, -2, 3])).toBe('x = 1, y = -2, z = 3');
  });
});

describe('mutations', () => {
  it('produces off-by-one, comparison, target and operation changes', () => {
    const rule = r({ c: ['x', '>', 4], t: 'y', op: '+=', a: 2 });
    const codes = mutations(rule).map(formatRule).sort();
    expect(codes).toEqual(
      [
        'x > 3 ⇒ y += 2', 'x > 5 ⇒ y += 2', 'x ≥ 4 ⇒ y += 2', 'x < 4 ⇒ y += 2',
        'x > 4 ⇒ y += 1', 'x > 4 ⇒ y += 3', 'x > 4 ⇒ x += 2', 'x > 4 ⇒ z += 2', 'x > 4 ⇒ y -= 2'
      ].sort()
    );
  });

  it('keeps constants in range and never produces ill-formed rules', () => {
    const codes = mutations(r({ c: ['y', '=', 0], t: 'x', op: '=', a: 'y' })).map(formatRule).sort();
    expect(codes).toEqual(['y = 1 ⇒ x = y', 'y ≠ 0 ⇒ x = y', 'y = 0 ⇒ z = y'].sort());
    expect(mutations(r({ t: 'x', op: '-=', a: 9 })).map(formatRule).sort()).toEqual(['x -= 8', 'y -= 9', 'z -= 9', 'x += 9'].sort());
    expect(isWellFormedRule(r({ t: 'x', op: '+=', a: 'x' }))).toBe(false);
    expect(isWellFormedRule(r({ t: 'x', op: '+=', a: 'y' }))).toBe(true);
  });

  it('is symmetric, duplicate-free and never returns the rule itself', () => {
    fc.assert(
      fc.property(arbSeed, arbDifficulty, (seed, difficulty) => {
        const puzzle = generatePuzzle(seed, difficulty);
        for (const rule of puzzle.rules) {
          const ms = mutations(rule);
          for (const m of ms) {
            expect(sameRule(m, rule)).toBe(false);
            expect(isRule(m)).toBe(true);
            expect(mutations(m).some((back) => sameRule(back, rule))).toBe(true);
          }
          for (let a = 0; a < ms.length; a++) for (let b = a + 1; b < ms.length; b++) expect(sameRule(ms[a] as Rule, ms[b] as Rule)).toBe(false);
        }
      }),
      { numRuns: 40 }
    );
  });

  it('compares rules structurally', () => {
    expect(sameRule(r({ t: 'x', op: '+=', a: 1 }), r({ t: 'x', op: '+=', a: 1 }))).toBe(true);
    expect(sameRule(r({ t: 'x', op: '+=', a: 1 }), r({ c: ['x', '>', 1], t: 'x', op: '+=', a: 1 }))).toBe(false);
    expect(sameRule(r({ c: ['x', '>', 1], t: 'x', op: '+=', a: 1 }), r({ t: 'x', op: '+=', a: 1 }))).toBe(false);
    expect(sameRule(r({ c: ['x', '>', 1], t: 'y', op: '+=', a: 1 }), r({ c: ['z', '>', 1], t: 'y', op: '+=', a: 1 }))).toBe(false);
    expect(sameRule(r({ c: ['x', '>', 1], t: 'y', op: '+=', a: 1 }), r({ c: ['x', '<', 1], t: 'y', op: '+=', a: 1 }))).toBe(false);
    expect(sameRule(r({ c: ['x', '>', 1], t: 'y', op: '+=', a: 1 }), r({ c: ['x', '>', 2], t: 'y', op: '+=', a: 1 }))).toBe(false);
    expect(sameRule(r({ t: 'x', op: '+=', a: 1 }), r({ t: 'y', op: '+=', a: 1 }))).toBe(false);
    expect(sameRule(r({ t: 'x', op: '+=', a: 1 }), r({ t: 'x', op: '-=', a: 1 }))).toBe(false);
    expect(sameRule(r({ t: 'x', op: '+=', a: 1 }), r({ t: 'x', op: '+=', a: 2 }))).toBe(false);
  });
});

describe('puzzle generation', { timeout: 60_000 }, () => {
  it('respects the difficulty sizes', () => {
    for (const difficulty of DIFFICULTIES) {
      for (let seed = 0; seed < 20; seed++) {
        const s = createInitialState(seed, difficulty);
        const spec = DIFFICULTY_SPEC[difficulty];
        expect(s.rules.length).toBeGreaterThanOrEqual(spec.rules[0]);
        expect(s.rules.length).toBeLessThanOrEqual(spec.rules[1]);
        expect(s.tests).toHaveLength(spec.tests);
        expect(s.options).toHaveLength(s.rules.length);
        for (const list of s.options) expect(list).toHaveLength(OPTION_COUNT);
      }
    }
  });

  it('injects exactly one bug that is the unique offered fix (checked by the oracle)', () => {
    fc.assert(
      fc.property(arbSeed, arbDifficulty, (seed, difficulty) => {
        const puzzle = generatePuzzle(seed, difficulty);
        const state = createInitialState(seed, difficulty);
        // Exactly one rule differs from the correct machine, by a single mutation.
        const diffs = puzzle.rules.map((rule, i) => !sameRule(rule, puzzle.correct[i] as Rule));
        expect(diffs.filter(Boolean)).toHaveLength(1);
        expect(diffs.indexOf(true)).toBe(puzzle.bug);
        expect(mutations(puzzle.correct[puzzle.bug] as Rule).some((m) => sameRule(m, puzzle.rules[puzzle.bug] as Rule))).toBe(true);
        // The correct machine passes, the faulty one fails at least one test.
        expect(oraclePasses(puzzle.correct, puzzle.tests)).toBe(true);
        expect(oraclePasses(puzzle.rules, puzzle.tests)).toBe(false);
        // The oracle finds exactly one fix among all offered options: the original rule at the bug position.
        const fixes = oracleFixes(state);
        expect(fixes).toHaveLength(1);
        const [i, j] = fixes[0] as [number, number];
        expect(i).toBe(puzzle.bug);
        expect(sameRule(state.options[i]?.[j] as Rule, puzzle.correct[i] as Rule)).toBe(true);
        expect(passingFixes(state.rules, state.tests, state.options)).toEqual(fixes);
        // Options are distinct real changes of the shown rule.
        state.options.forEach((list, k) => {
          for (const option of list) expect(mutations(state.rules[k] as Rule).some((m) => sameRule(m, option))).toBe(true);
          for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) expect(sameRule(list[a] as Rule, list[b] as Rule)).toBe(false);
        });
        // Test inputs are distinct.
        const inputs = new Set(state.tests.map((test) => test.input.join(',')));
        expect(inputs.size).toBe(state.tests.length);
      }),
      { numRuns: 120 }
    );
  });

  it('makes every rule of the correct machine matter for some test', () => {
    fc.assert(
      fc.property(arbSeed, arbDifficulty, (seed, difficulty) => {
        const puzzle = generatePuzzle(seed, difficulty);
        puzzle.correct.forEach((_, i) => {
          expect(oraclePasses(puzzle.correct.filter((__, k) => k !== i), puzzle.tests)).toBe(false);
        });
      }),
      { numRuns: 60 }
    );
  });

  it('is deterministic per seed and difficulty and varies between seeds', () => {
    fc.assert(
      fc.property(arbSeed, arbDifficulty, (seed, difficulty) => {
        expect(createInitialState(seed, difficulty)).toEqual(createInitialState(seed, difficulty));
      }),
      { numRuns: 30 }
    );
    const machines = new Set(Array.from({ length: 10 }, (_, seed) => JSON.stringify(createInitialState(seed, 'medium').rules)));
    expect(machines.size).toBeGreaterThan(5);
  });

  it('starts in a clean, valid state', () => {
    const s = createInitialState(42, 'hard');
    expect(s).toMatchObject({ v: 1, seed: 42, difficulty: 'hard', test: 0, cursor: 0, picked: null, chosen: null, tried: [], lastPassed: null, stepsViewed: 0, wrongPicks: 0, fix: null });
    expect(isDebugState(s)).toBe(true);
    expect(createInitialState(-1).seed).toBe(0xffff_ffff);
    expect(createInitialState(1, 'nope').difficulty).toBe('easy');
    expect(createInitialState(1).difficulty).toBe('easy');
    expect(toDifficulty('medium')).toBe('medium');
    expect(toDifficulty(3)).toBe('easy');
  });
});

/** Finds the unique fix of a state (via the oracle). */
const solutionOf = (s: DebugState) => oracleFixes(s)[0] as [number, number];
const wrongOption = (s: DebugState): [number, number] => {
  const [bi, bj] = solutionOf(s);
  return bi === 0 ? [0, (bj + 1) % OPTION_COUNT] : [0, 0];
};

describe('player actions', () => {
  it('steps through the machine, counting viewed steps, and starts over at the end', () => {
    let s = createInitialState(5, 'easy');
    const n = s.rules.length;
    for (let i = 1; i <= n; i++) {
      s = step(s);
      expect(s.cursor).toBe(i);
      expect(s.stepsViewed).toBe(i);
    }
    s = step(s);
    expect(s.cursor).toBe(0);
    expect(s.stepsViewed).toBe(n);
    expect(step(s).cursor).toBe(1);
  });

  it('selects test cases and restarts the run', () => {
    let s = createInitialState(9, 'hard');
    s = step(step(s));
    const sel = selectTest(s, 2);
    expect(sel.test).toBe(2);
    expect(sel.cursor).toBe(0);
    expect(selectTest(sel, 2)).toBe(sel);
    expect(selectTest(sel, 3)).toBe(sel);
    expect(selectTest(sel, -1)).toBe(sel);
    expect(selectTest(sel, 0.5)).toBe(sel);
    expect(selectTest(sel, 0).test).toBe(0);
  });

  it('picks rules and chooses fixes within bounds', () => {
    const s = createInitialState(3, 'medium');
    expect(chooseFix(s, 0)).toBe(s);
    const p = pickRule(s, 1);
    expect(p.picked).toBe(1);
    expect(pickRule(p, 1)).toBe(p);
    expect(pickRule(p, -1)).toBe(p);
    expect(pickRule(p, s.rules.length)).toBe(p);
    expect(pickRule(p, 1.5)).toBe(p);
    expect(pickRule(p, s.rules.length - 1).picked).toBe(s.rules.length - 1);
    const c = chooseFix(p, 3);
    expect(c.chosen).toBe(3);
    expect(chooseFix(c, 3)).toBe(c);
    expect(chooseFix(c, 4)).toBe(c);
    expect(chooseFix(c, -1)).toBe(c);
    expect(chooseFix(c, 0.5)).toBe(c);
    expect(chooseFix(c, 0).chosen).toBe(0);
    expect(pickRule(c, 2).chosen).toBeNull();
    expect(checkFix(p)).toBe(p);
    expect(checkFix(s)).toBe(s);
  });

  it('counts wrong picks, remembers tried options and solves with the unique fix', () => {
    let s = createInitialState(11, 'medium');
    const [wi, wj] = wrongOption(s);
    s = chooseFix(pickRule(s, wi), wj);
    const wrong = checkFix(s);
    expect(isSolved(wrong)).toBe(false);
    expect(wrong.wrongPicks).toBe(1);
    expect(wrong.tried).toEqual([[wi, wj]]);
    expect(wrong.chosen).toBeNull();
    expect(wrong.picked).toBe(wi);
    const expectedPassed = testResults(withRule(s.rules, wi, s.options[wi]?.[wj] as Rule), s.tests).filter(Boolean).length;
    expect(wrong.lastPassed).toBe(expectedPassed);
    expect(wrong.lastPassed).toBeLessThan(s.tests.length);
    const again = checkFix(chooseFix(wrong, wj));
    expect(again.wrongPicks).toBe(2);
    expect(again.tried).toEqual([[wi, wj]]);

    const [bi, bj] = solutionOf(s);
    const stepped = step(again);
    const solved = checkFix(chooseFix(pickRule(stepped, bi), bj));
    expect(isSolved(solved)).toBe(true);
    expect(solved.fix).toEqual([bi, bj]);
    expect(solved.cursor).toBe(0);
    expect(solved.lastPassed).toBeNull();
    expect(solved.chosen).toBeNull();
    expect(solved.wrongPicks).toBe(2);
    expect(testResults(currentMachine(solved), solved.tests)).toEqual(solved.tests.map(() => true));
    expect(testResults(currentMachine(s), s.tests).every(Boolean)).toBe(false);
    expect(currentMachine(s)).toBe(s.rules);
    expect(isDebugState(solved)).toBe(true);
    // Solved games ignore further picks and checks.
    expect(pickRule(solved, 0)).toBe(solved);
    expect(chooseFix(solved, 0)).toBe(solved);
    expect(checkFix(solved)).toBe(solved);
  });

  it('keeps the state valid under random action sequences', () => {
    fc.assert(
      fc.property(
        arbSeed,
        arbDifficulty,
        fc.array(fc.tuple(fc.integer({ min: 0, max: 4 }), fc.integer({ min: -1, max: 8 })), { maxLength: 30 }),
        (seed, difficulty, actions) => {
          let s = createInitialState(seed, difficulty);
          let wasSolved = false;
          for (const [kind, arg] of actions) {
            const before = s;
            s = kind === 0 ? step(s) : kind === 1 ? selectTest(s, arg) : kind === 2 ? pickRule(s, arg) : kind === 3 ? chooseFix(s, arg) : checkFix(s);
            expect(isDebugState(clone(s))).toBe(true);
            expect(s.wrongPicks).toBeGreaterThanOrEqual(before.wrongPicks);
            expect(s.stepsViewed).toBeGreaterThanOrEqual(before.stepsViewed);
            if (wasSolved) expect(s.fix).toEqual(before.fix);
            wasSolved = isSolved(s);
          }
        }
      ),
      { numRuns: 80 }
    );
  });
});

describe('state validation', () => {
  const base = () => clone(createInitialState(21, 'medium'));

  it('accepts generated and played states', () => {
    expect(isDebugState(base())).toBe(true);
    const s = base();
    s.picked = 0;
    s.chosen = 2;
    s.cursor = s.rules.length;
    s.tried = [[0, 1]];
    s.lastPassed = 0;
    expect(isDebugState(s)).toBe(true);
  });

  it('rejects junk without throwing', () => {
    for (const junk of [null, undefined, 1, 'x', [], {}, { v: 1 }]) expect(isDebugState(junk)).toBe(false);
    fc.assert(fc.property(fc.anything(), (value) => void expect(isDebugState(value)).toBe(false)), { numRuns: 200 });
  });

  it('rejects each kind of corruption', () => {
    const cases: [string, (s: Record<string, unknown> & DebugState) => void][] = [
      ['version', (s) => void ((s as Record<string, unknown>).v = 2)],
      ['seed', (s) => void (s.seed = -1)],
      ['difficulty', (s) => void ((s as Record<string, unknown>).difficulty = 'insane')],
      ['too few rules', (s) => void s.rules.splice(0, 3)],
      ['too many rules', (s) => void s.rules.push(...s.rules)],
      ['bad rule', (s) => void ((s.rules[0] as unknown as Record<string, unknown>).op = '*=')],
      ['self argument', (s) => void ((s.rules[0] as Rule).a = (s.rules[0] as Rule).t)],
      ['bad target', (s) => void ((s.rules[0] as unknown as Record<string, unknown>).t = 'w')],
      ['bad constant', (s) => void ((s.rules[0] as Rule).a = 10)],
      ['bad condition', (s) => void ((s.rules[0] as Rule).c = ['x', '>', 12])],
      ['bad cmp', (s) => void ((s.rules[0] as unknown as Record<string, unknown>).c = ['x', '>>', 1])],
      ['short condition', (s) => void ((s.rules[0] as unknown as Record<string, unknown>).c = ['x', '>'])],
      ['test count', (s) => void s.tests.pop()],
      ['test regs', (s) => void ((s.tests[0] as TestCase).input = [1, 2] as unknown as Regs)],
      ['test value', (s) => void ((s.tests[0] as TestCase).expected[0] = 1e9)],
      ['test record', (s) => void ((s.tests as unknown[])[0] = 5)],
      ['options length', (s) => void s.options.pop()],
      ['option count', (s) => void s.options[0]?.pop()],
      ['option rule', (s) => void ((s.options[0] as unknown[])[0] = { t: 'x' })],
      ['test index', (s) => void (s.test = 2)],
      ['cursor', (s) => void (s.cursor = s.rules.length + 1)],
      ['negative cursor', (s) => void (s.cursor = -1)],
      ['picked', (s) => void (s.picked = s.rules.length)],
      ['chosen', (s) => void ((s.picked = 0), (s.chosen = OPTION_COUNT))],
      ['chosen without pick', (s) => void (s.chosen = 1)],
      ['tried', (s) => void (s.tried = [[0, 9]])],
      ['tried shape', (s) => void (s.tried = [[0]] as unknown as [number, number][])],
      ['tried not array', (s) => void ((s as Record<string, unknown>).tried = 'x')],
      ['lastPassed', (s) => void (s.lastPassed = 3)],
      ['steps', (s) => void (s.stepsViewed = -1)],
      ['wrong', (s) => void (s.wrongPicks = 1.5)],
      ['fix shape', (s) => void (s.fix = [0, 5])],
      ['fix that does not pass', (s) => void (s.fix = wrongOption(s))]
    ];
    for (const [name, corrupt] of cases) {
      const s = base() as Record<string, unknown> & DebugState;
      corrupt(s);
      expect(isDebugState(s), name).toBe(false);
    }
  });

  it('validates rules on their own', () => {
    expect(isRule({ c: null, t: 'x', op: '+=', a: 'y' })).toBe(true);
    expect(isRule({ c: ['z', '≤', 0], t: 'x', op: '=', a: 9 })).toBe(true);
    expect(isRule({ c: null, t: 'x', op: '+=', a: -1 })).toBe(false);
    expect(isRule({ c: 'x', t: 'x', op: '+=', a: 1 })).toBe(false);
    expect(isRule({ t: 'x', op: '+=', a: 1 })).toBe(false);
    expect(isRule({ c: ['q', '>', 1], t: 'x', op: '+=', a: 1 })).toBe(false);
    expect(isRule([])).toBe(false);
  });
});
