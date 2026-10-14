import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  MAX_CANDIDATES,
  MAX_LOG,
  MAX_VALUE,
  MIN_CANDIDATES,
  MIN_VALUE,
  RULE_IDS,
  aliveCandidates,
  allTriples,
  canTest,
  consistentOthers,
  createInitialState,
  currentHypothesis,
  distinguishingTriple,
  exampleChoices,
  findLogIndex,
  fits,
  guess,
  guessCount,
  insightFor,
  isRuleDiscoveryState,
  ruledOutCounts,
  rulePool,
  runTest,
  sameTriple,
  setDraft,
  testCount,
  toDifficulty,
  type RuleDiscoveryState,
  type RuleId,
  type Triple
} from '../src/rules';

/** Independent reference implementations, written differently from the rule table. */
const reference: Record<RuleId, (t: Triple) => boolean> = {
  ascending: (t) => t[0] < t[1] && t[1] < t[2],
  descending: (t) => [...t].reverse().every((v, i, a) => i === 0 || v > (a[i - 1] as number)),
  allEven: (t) => t.every((v) => v % 2 === 0),
  allOdd: (t) => t.every((v) => v % 2 === 1),
  allDifferent: (t) => new Set(t).size === 3,
  firstSmallest: (t) => t[0] < Math.min(t[1], t[2]),
  firstLargest: (t) => t[0] > Math.max(t[1], t[2]),
  lastLargest: (t) => t[2] > Math.max(t[0], t[1]),
  allBelow10: (t) => Math.max(...t) <= 9,
  sum12: (t) => t.reduce((s, v) => s + v, 0) === 12,
  sumEven: (t) => t.filter((v) => v % 2 === 1).length % 2 === 0,
  middleLargest: (t) => t[1] > Math.max(t[0], t[2]),
  stepTwo: (t) => t[1] - t[0] === 2 && t[2] - t[1] === 2,
  equalSteps: (t) => t[0] + t[2] === 2 * t[1],
  lastIsSum: (t) => t[2] - t[1] === t[0],
  sumMultipleOf3: (t) => t.reduce((s, v) => s + (v % 3), 0) % 3 === 0,
  nonDecreasing: (t) => !(t[1] < t[0]) && !(t[2] < t[1])
};

const value = fc.integer({ min: MIN_VALUE, max: MAX_VALUE });
const triple = fc.tuple(value, value, value) as fc.Arbitrary<Triple>;
const ruleId = fc.constantFrom(...(Object.keys(reference) as RuleId[]));
const difficulty = fc.constantFrom(...DIFFICULTIES);
const seed = fc.integer({ min: 0, max: 0xffff_ffff });

const solve = (s: RuleDiscoveryState) => guess(s, s.rule).state;
const firstWrong = (s: RuleDiscoveryState) => s.candidates.find((id) => id !== s.rule) as RuleId;
const withDraft = (s: RuleDiscoveryState, t: Triple) => setDraft(setDraft(setDraft(s, 0, t[0]), 1, t[1]), 2, t[2]);

describe('rule predicates', () => {
  it('cover exactly the reference rules', () => {
    expect([...RULE_IDS].sort()).toEqual(Object.keys(reference).sort());
  });

  it('match the reference implementations (property)', () => {
    fc.assert(fc.property(ruleId, triple, (id, t) => fits(id, t) === reference[id](t)), { numRuns: 3000 });
  });

  it('agree with hand-picked examples', () => {
    expect(fits('ascending', [2, 4, 6])).toBe(true);
    expect(fits('ascending', [2, 2, 6])).toBe(false);
    expect(fits('nonDecreasing', [2, 2, 6])).toBe(true);
    expect(fits('stepTwo', [2, 4, 6])).toBe(true);
    expect(fits('stepTwo', [1, 4, 7])).toBe(false);
    expect(fits('equalSteps', [1, 4, 7])).toBe(true);
    expect(fits('equalSteps', [7, 4, 1])).toBe(true);
    expect(fits('lastIsSum', [2, 4, 6])).toBe(true);
    expect(fits('lastIsSum', [4, 2, 7])).toBe(false);
    expect(fits('sum12', [2, 4, 6])).toBe(true);
    expect(fits('sum12', [2, 4, 7])).toBe(false);
    expect(fits('sumMultipleOf3', [1, 1, 1])).toBe(true);
    expect(fits('sumMultipleOf3', [1, 1, 2])).toBe(false);
    expect(fits('allBelow10', [9, 9, 9])).toBe(true);
    expect(fits('allBelow10', [9, 10, 9])).toBe(false);
    expect(fits('middleLargest', [1, 5, 5])).toBe(false);
    expect(fits('firstSmallest', [3, 3, 5])).toBe(false);
    expect(fits('firstLargest', [5, 3, 5])).toBe(false);
    expect(fits('lastLargest', [1, 2, 3])).toBe(true);
    expect(fits('allOdd', [1, 3, 5])).toBe(true);
    expect(fits('allEven', [2, 3, 4])).toBe(false);
    expect(fits('allDifferent', [1, 2, 1])).toBe(false);
    expect(fits('descending', [3, 2, 1])).toBe(true);
    expect(fits('sumEven', [1, 1, 2])).toBe(true);
    expect(fits('nope' as RuleId, [1, 2, 3])).toBe(false);
  });

  it('are pairwise different on the domain (so every pair can be told apart)', () => {
    const triples = allTriples();
    for (const a of RULE_IDS) for (const b of RULE_IDS) {
      if (a === b) continue;
      expect(triples.some((t) => fits(a, t) !== fits(b, t)), `${a} vs ${b}`).toBe(true);
    }
  });
});

describe('domain and pools', () => {
  it('enumerates every triple of the domain once, in order', () => {
    const triples = allTriples();
    const size = MAX_VALUE - MIN_VALUE + 1;
    expect(triples).toHaveLength(size ** 3);
    expect(triples[0]).toEqual([MIN_VALUE, MIN_VALUE, MIN_VALUE]);
    expect(triples[1]).toEqual([MIN_VALUE, MIN_VALUE, MIN_VALUE + 1]);
    expect(triples[triples.length - 1]).toEqual([MAX_VALUE, MAX_VALUE, MAX_VALUE]);
    expect(new Set(triples.map((t) => t.join())).size).toBe(triples.length);
  });

  it('pools grow with difficulty', () => {
    expect(rulePool('easy')).toHaveLength(9);
    expect(rulePool('medium')).toHaveLength(13);
    expect(rulePool('hard')).toEqual([...RULE_IDS]);
    expect(rulePool('easy').every((id) => rulePool('medium').includes(id))).toBe(true);
    expect(rulePool('easy')).not.toContain('sum12');
    expect(rulePool('medium')).toContain('sum12');
    expect(rulePool('medium')).not.toContain('equalSteps');
  });

  it('maps unknown difficulties to the default', () => {
    expect(toDifficulty('hard')).toBe('hard');
    expect(toDifficulty('medium')).toBe('medium');
    expect(toDifficulty('nightmare')).toBe(DEFAULT_DIFFICULTY);
    expect(toDifficulty(undefined)).toBe('easy');
  });

  it('every rule of every pool has example triples with a full candidate list', () => {
    for (const d of DIFFICULTIES) {
      const pool = rulePool(d);
      for (const id of pool) {
        const choices = exampleChoices(id, pool);
        expect(choices.length, `${d}/${id}`).toBeGreaterThan(0);
        for (const t of choices.slice(0, 20)) {
          expect(fits(id, t)).toBe(true);
          expect(consistentOthers(id, t, pool).length).toBeGreaterThanOrEqual(MIN_CANDIDATES - 1);
        }
      }
    }
  });

  it('consistentOthers excludes the rule itself and rules outside the pool', () => {
    const others = consistentOthers('ascending', [2, 4, 6], rulePool('easy'));
    expect(others).not.toContain('ascending');
    expect(others).toContain('allEven');
    expect(others).not.toContain('sum12');
    expect(others).not.toContain('descending');
  });
});

describe('createInitialState', { timeout: 60_000 }, () => {
  it('is deterministic per seed and difficulty', () => {
    fc.assert(fc.property(seed, difficulty, (s, d) => {
      expect(createInitialState(s, d)).toEqual(createInitialState(s, d));
    }), { numRuns: 30 });
  });

  it('produces valid states whose candidates all fit the example (property)', () => {
    fc.assert(fc.property(seed, difficulty, (s, d) => {
      const state = createInitialState(s, d);
      expect(isRuleDiscoveryState(state)).toBe(true);
      expect(state.seed).toBe(s >>> 0);
      expect(state.difficulty).toBe(d);
      expect(rulePool(d)).toContain(state.rule);
      expect(fits(state.rule, state.example)).toBe(true);
      expect(state.candidates.length).toBeGreaterThanOrEqual(MIN_CANDIDATES);
      expect(state.candidates.length).toBeLessThanOrEqual(MAX_CANDIDATES);
      expect(new Set(state.candidates).size).toBe(state.candidates.length);
      expect(state.candidates).toContain(state.rule);
      for (const id of state.candidates) {
        expect(fits(id, state.example)).toBe(true);
        expect(rulePool(d)).toContain(id);
      }
      expect(state.draft).toEqual(state.example);
      expect(state.log).toEqual([]);
      expect(state.wrong).toEqual([]);
      expect(state.solved).toBe(false);
    }), { numRuns: 40 });
  });

  it('varies with the seed and defaults to easy', () => {
    const states = Array.from({ length: 12 }, (_, i) => createInitialState(i));
    expect(new Set(states.map((s) => s.rule)).size).toBeGreaterThan(2);
    expect(new Set(states.map((s) => s.example.join())).size).toBeGreaterThan(2);
    expect(states.every((s) => s.difficulty === 'easy')).toBe(true);
  });
});

describe('testing triples', () => {
  const base = () => createInitialState(42);

  it('setDraft changes one position and ignores invalid input', () => {
    const s = base();
    const next = setDraft(s, 1, 17);
    expect(next.draft).toEqual([s.draft[0], 17, s.draft[2]]);
    expect(s.draft).toEqual(s.example);
    expect(setDraft(s, 3, 5)).toBe(s);
    expect(setDraft(s, -1, 5)).toBe(s);
    expect(setDraft(s, 0, MIN_VALUE - 1)).toBe(s);
    expect(setDraft(s, 0, MAX_VALUE + 1)).toBe(s);
    expect(setDraft(s, 0, 2.5)).toBe(s);
    expect(setDraft(s, 0, s.draft[0])).toBe(s);
    expect(setDraft(s, 0, MAX_VALUE).draft[0]).toBe(MAX_VALUE);
    expect(setDraft(s, 2, MIN_VALUE).draft[2]).toBe(MIN_VALUE);
    expect(setDraft(solve(s), 0, s.draft[0] === 1 ? 2 : 1).draft).toEqual(s.draft);
  });

  it('runTest logs the truthful answer and refuses duplicates (property)', () => {
    fc.assert(fc.property(seed, triple, (sd, t) => {
      const s = withDraft(createInitialState(sd, 'hard'), t);
      const next = runTest(s);
      expect(next.log).toHaveLength(1);
      expect(next.log[0]).toEqual({ triple: t, fits: fits(s.rule, t), source: 'test' });
      expect(findLogIndex(next, t)).toBe(0);
      expect(canTest(next)).toBe(false);
      expect(runTest(next)).toBe(next);
      expect(testCount(next)).toBe(1);
      expect(guessCount(next)).toBe(0);
    }), { numRuns: 200 });
  });

  it('refuses tests once solved or when the log is full', () => {
    const s = base();
    expect(canTest(s)).toBe(true);
    expect(runTest(solve(s))).toEqual(solve(s));
    const full = { ...s, log: Array.from({ length: MAX_LOG }, () => ({ triple: [1, 1, 1] as Triple, fits: fits(s.rule, [1, 1, 1]), source: 'test' as const })) };
    const fresh = withDraft(full, [20, 20, 19]);
    expect(canTest(fresh)).toBe(false);
    expect(runTest(fresh)).toBe(fresh);
    const almost = { ...fresh, log: fresh.log.slice(1) };
    expect(canTest(almost)).toBe(true);
  });
});

describe('distinguishingTriple', { timeout: 60_000 }, () => {
  it('always distinguishes two different rules (property)', () => {
    fc.assert(fc.property(ruleId, ruleId, triple, (a, b, near) => {
      fc.pre(a !== b);
      const t = distinguishingTriple(a, b, near);
      expect(t).not.toBeNull();
      expect(fits(a, t as Triple)).not.toBe(fits(b, t as Triple));
    }), { numRuns: 150 });
  });

  it('returns null for identical rules', () => {
    expect(distinguishingTriple('ascending', 'ascending', [2, 4, 6])).toBeNull();
  });

  it('picks the closest distinguishing triple to the reference, lexicographically first on ties', () => {
    // ascending vs stepTwo near 2,4,6: distance 1 candidates; first lexicographic one that differs.
    const t = distinguishingTriple('ascending', 'stepTwo', [2, 4, 6]) as Triple;
    const dist = (x: Triple) => Math.abs(x[0] - 2) + Math.abs(x[1] - 4) + Math.abs(x[2] - 6);
    expect(dist(t)).toBe(1);
    expect(t).toEqual([1, 4, 6]);
    // The triple itself distinguishes the two rules at distance 0.
    expect(distinguishingTriple('ascending', 'descending', [1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('avoids already known triples when possible', () => {
    const t = distinguishingTriple('ascending', 'descending', [1, 2, 3], [[1, 2, 3]]) as Triple;
    expect(sameTriple(t, [1, 2, 3])).toBe(false);
    expect(fits('ascending', t)).not.toBe(fits('descending', t));
    expect(Math.abs(t[0] - 1) + Math.abs(t[1] - 2) + Math.abs(t[2] - 3)).toBe(1);
    const two = distinguishingTriple('ascending', 'descending', [1, 2, 3], [[20, 20, 20], [1, 2, 3]]) as Triple;
    expect(sameTriple(two, [1, 2, 3])).toBe(false);
  });

  it('is minimal: no strictly closer distinguishing triple exists (property)', () => {
    const triples = allTriples();
    fc.assert(fc.property(ruleId, ruleId, triple, (a, b, near) => {
      fc.pre(a !== b);
      const t = distinguishingTriple(a, b, near) as Triple;
      const d = (x: Triple) => Math.abs(x[0] - near[0]) + Math.abs(x[1] - near[1]) + Math.abs(x[2] - near[2]);
      const best = Math.min(...triples.filter((x) => fits(a, x) !== fits(b, x)).map(d));
      expect(d(t)).toBe(best);
    }), { numRuns: 25 });
  });
});

describe('guessing', { timeout: 60_000 }, () => {
  it('the true rule solves the game; repeated guesses are ignored', () => {
    const s = createInitialState(7, 'medium');
    const { state, outcome } = guess(s, s.rule);
    expect(outcome).toBe('correct');
    expect(state.solved).toBe(true);
    expect(state.log).toEqual([]);
    expect(guessCount(state)).toBe(1);
    expect(guess(state, s.rule)).toEqual({ state, outcome: 'ignored' });
    expect(guess(state, firstWrong(s)).outcome).toBe('ignored');
  });

  it('a wrong guess adds a counter-example that tells the two rules apart (property)', () => {
    fc.assert(fc.property(seed, difficulty, fc.nat(), (sd, d, pick) => {
      const s = createInitialState(sd, d);
      const wrongs = s.candidates.filter((id) => id !== s.rule);
      const g = wrongs[pick % wrongs.length] as RuleId;
      const { state, outcome } = guess(s, g);
      expect(outcome).toBe('wrong');
      expect(state.solved).toBe(false);
      expect(state.wrong).toEqual([g]);
      expect(state.log).toHaveLength(1);
      const entry = state.log[0];
      expect(entry?.source).toBe('counter');
      expect(entry?.fits).toBe(fits(s.rule, entry?.triple as Triple));
      expect(fits(g, entry?.triple as Triple)).not.toBe(fits(s.rule, entry?.triple as Triple));
      expect(sameTriple(entry?.triple as Triple, s.example)).toBe(false);
      expect(testCount(state)).toBe(0);
      expect(guessCount(state)).toBe(1);
      expect(isRuleDiscoveryState(state)).toBe(true);
      expect(guess(state, g).outcome).toBe('ignored');
      expect(aliveCandidates(state)).not.toContain(g);
      expect(aliveCandidates(state)).toContain(s.rule);
    }), { numRuns: 40 });
  });

  it('ignores rules that are not candidates', () => {
    const s = createInitialState(3);
    const outsider = RULE_IDS.find((id) => !s.candidates.includes(id)) as RuleId;
    expect(guess(s, outsider)).toEqual({ state: s, outcome: 'ignored' });
  });

  it('does not grow the log beyond its limit on a wrong guess', () => {
    const s = createInitialState(9);
    const full = { ...s, log: Array.from({ length: MAX_LOG }, () => ({ triple: [1, 1, 1] as Triple, fits: fits(s.rule, [1, 1, 1]), source: 'test' as const })) };
    const { state, outcome } = guess(full, firstWrong(s));
    expect(outcome).toBe('wrong');
    expect(state.log).toHaveLength(MAX_LOG);
    expect(state.wrong).toHaveLength(1);
  });

  it('counts guesses and tests separately through a full game', () => {
    let s = createInitialState(11, 'hard');
    s = runTest(withDraft(s, [1, 2, 3]));
    s = runTest(withDraft(s, [3, 2, 1]));
    const wrong = guess(s, firstWrong(s));
    s = wrong.state;
    s = solve(s);
    expect(testCount(s)).toBe(2);
    expect(guessCount(s)).toBe(2);
    expect(s.solved).toBe(true);
  });
});

describe('value of information and confirmation-bias feedback', () => {
  const scenario = (): RuleDiscoveryState => ({
    seed: 1,
    difficulty: 'easy',
    rule: 'ascending',
    example: [2, 4, 6],
    candidates: ['ascending', 'allEven', 'allDifferent', 'firstSmallest', 'lastLargest'],
    log: [],
    draft: [2, 4, 6],
    wrong: [],
    solved: false
  });

  it('counts how many still-possible candidates each test ruled out', () => {
    let s = scenario();
    s = runTest(withDraft(s, [4, 6, 8])); // fits all five: rules out nothing
    s = runTest(withDraft(s, [1, 3, 5])); // Yes: rules out allEven
    s = runTest(withDraft(s, [3, 2, 5])); // No: rules out allDifferent and lastLargest (firstSmallest says No too)
    expect(s.log.map((e) => e.fits)).toEqual([true, true, false]);
    expect(aliveCandidates(s, 0)).toEqual(s.candidates);
    expect(ruledOutCounts(s)).toEqual([0, 1, 2]);
    expect(aliveCandidates(s)).toEqual(['ascending', 'firstSmallest']);
  });

  it('insight: untested, confirm-only and falsifying tests', () => {
    let s = scenario();
    expect(insightFor(s, 'allEven')).toEqual({ kind: 'untested' });
    s = runTest(withDraft(s, [4, 6, 8]));
    s = runTest(withDraft(s, [8, 10, 12]));
    expect(insightFor(s, 'allEven')).toEqual({ kind: 'confirmOnly', tests: 2 });
    s = runTest(withDraft(s, [1, 3, 5]));
    expect(insightFor(s, 'allEven')).toEqual({ kind: 'falsifying', tests: 3, falsifying: 1 });
    expect(insightFor(s, 'ascending')).toEqual({ kind: 'confirmOnly', tests: 3 });
    // Counter-examples are not the player's tests.
    const afterWrong = guess(s, 'allEven').state;
    expect(insightFor(afterWrong, 'allEven')).toEqual({ kind: 'falsifying', tests: 3, falsifying: 1 });
  });

  it('currentHypothesis: last wrong guess right after it, the true rule once solved, otherwise none', () => {
    let s = scenario();
    expect(currentHypothesis(s)).toBeNull();
    s = guess(s, 'allEven').state;
    expect(currentHypothesis(s)).toBe('allEven');
    s = guess(s, 'lastLargest').state;
    expect(currentHypothesis(s)).toBe('lastLargest');
    s = runTest(withDraft(s, [5, 6, 7]));
    expect(currentHypothesis(s)).toBeNull();
    s = solve(s);
    expect(currentHypothesis(s)).toBe('ascending');
  });
});

describe('isRuleDiscoveryState', () => {
  const valid = () => runTest(withDraft(createInitialState(5, 'medium'), [1, 2, 3]));

  it('accepts generated and played states', () => {
    const s = valid();
    expect(isRuleDiscoveryState(s)).toBe(true);
    expect(isRuleDiscoveryState(JSON.parse(JSON.stringify(guess(s, firstWrong(s)).state)))).toBe(true);
    expect(isRuleDiscoveryState(solve(s))).toBe(true);
  });

  it('rejects inconsistent or malformed fields', () => {
    const s = valid();
    const bad: unknown[] = [
      null, [], 'x', {},
      { ...s, seed: -1 },
      { ...s, seed: 1.5 },
      { ...s, difficulty: 'extreme' },
      { ...s, rule: 'nope' },
      { ...s, solved: 'yes' },
      { ...s, example: [1, 2] },
      { ...s, example: [0, 1, 2] },
      { ...s, draft: [1, 2, 21] },
      { ...s, candidates: s.candidates.filter((id) => id !== s.rule) },
      { ...s, candidates: s.candidates.slice(0, MIN_CANDIDATES - 1) },
      { ...s, candidates: [...s.candidates, s.candidates[0]] },
      { ...s, candidates: [...s.candidates, 'x'] },
      { ...s, wrong: [s.rule] },
      { ...s, wrong: ['x'] },
      { ...s, wrong: [firstWrong(s), firstWrong(s)] },
      { ...s, log: [{ ...s.log[0], fits: !s.log[0]?.fits }] },
      { ...s, log: [{ ...s.log[0], source: 'other' }] },
      { ...s, log: [{ ...s.log[0], triple: [1, 2] }] },
      { ...s, log: [{ triple: [9, 9, 9], fits: fits(s.rule, [9, 9, 9]), source: 'counter' }] },
      { ...s, log: 'none' },
      { ...s, log: Array.from({ length: MAX_LOG + 1 }, () => s.log[0]) }
    ];
    for (const value of bad) expect(isRuleDiscoveryState(value)).toBe(false);
  });

  it('rejects a rule outside the pool, an example that does not fit, and inconsistent candidates', () => {
    const easy = createInitialState(5, 'easy');
    expect(isRuleDiscoveryState({ ...easy, rule: 'sum12', candidates: ['sum12', ...easy.candidates.slice(1)] })).toBe(false);
    const misfit = RULE_IDS.find((id) => !fits(id, easy.example)) as RuleId;
    const swap = firstWrong(easy);
    expect(isRuleDiscoveryState({ ...easy, candidates: easy.candidates.map((id) => (id === swap ? misfit : id)) })).toBe(false);
    const nonFitting = allTriples().find((t) => !fits(easy.rule, t)) as Triple;
    expect(isRuleDiscoveryState({ ...easy, example: nonFitting })).toBe(false);
  });

  it('never throws on arbitrary data (property)', () => {
    fc.assert(fc.property(fc.anything(), (v) => {
      expect(() => isRuleDiscoveryState(v)).not.toThrow();
    }), { numRuns: 300 });
  });
});
