import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import { metadata } from '../src/metadata';
import {
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  MAX_ATOMS,
  MAX_RULES,
  PROFILES,
  VOCAB,
  applyRule,
  closure,
  createInitialState,
  fallbackPuzzle,
  generatePuzzle,
  isConsistent,
  isMinimalProofState,
  isPuzzle,
  isSolved,
  knownList,
  knownSet,
  minimalSteps,
  missingPremises,
  premiseCount,
  premisesMet,
  resetProof,
  shortestDistances,
  toDifficulty,
  undo,
  verdict,
  type Atom,
  type MinimalProofState,
  type Puzzle,
  type Rule
} from '../src/rules';
import { oracleMinimal, oracleReachable } from './oracle';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const imp = (a: number, c: number): Rule => ({ op: 'imp', premises: [a], conclusion: c });
const and = (a: number, b: number, c: number): Rule => ({ op: 'and', premises: [a, b], conclusion: c });
const or = (a: number, b: number, c: number): Rule => ({ op: 'or', premises: [a, b], conclusion: c });
const letters = (n: number): Atom[] => Array.from({ length: n }, (_, i) => ({ letter: i, neg: false, label: i % VOCAB.length }));

/**
 * Hand-made puzzle: facts A; rules
 *   0: A → B, 1: B → C, 2: A ∧ C → D, 3: E ∨ C → D, 4: D → E, 5: F → D
 * Goal D: shortest proof A→B, B→C, (A∧C→D or C∨E→D) = 3 steps.
 */
const sample = (): MinimalProofState => ({
  seed: 5,
  difficulty: 'medium',
  puzzle: {
    atoms: letters(6),
    facts: [0],
    rules: [imp(0, 1), imp(1, 2), and(0, 2, 3), or(4, 2, 3), imp(3, 4), imp(5, 3)],
    goal: 3,
    minimal: 3
  },
  applied: []
});

/** Small random rule systems for oracle comparisons. */
const arbSystem = fc.integer({ min: 2, max: 6 }).chain((n) =>
  fc.record({
    n: fc.constant(n),
    facts: fc.uniqueArray(fc.integer({ min: 0, max: n - 1 }), { minLength: 1, maxLength: 2 }),
    raw: fc.array(
      fc.record({
        op: fc.constantFrom<Rule['op']>('imp', 'and', 'or'),
        a: fc.integer({ min: 0, max: n - 1 }),
        b: fc.integer({ min: 0, max: n - 1 }),
        c: fc.integer({ min: 0, max: n - 1 })
      }),
      { minLength: 1, maxLength: 7 }
    )
  }).map(({ n, facts, raw }) => ({
    n,
    facts,
    rules: raw
      .map(({ op, a, b, c }): Rule => ({ op, premises: op === 'imp' ? [a] : [a, b], conclusion: c }))
      .filter((r) => new Set(r.premises).size === r.premises.length && !r.premises.includes(r.conclusion))
  }))
);

describe('premises and knowledge', () => {
  it('imp and and need every premise, or needs one', () => {
    const known = new Set([0, 1]);
    expect(premisesMet(imp(0, 3), known)).toBe(true);
    expect(premisesMet(imp(2, 3), known)).toBe(false);
    expect(premisesMet(and(0, 1, 3), known)).toBe(true);
    expect(premisesMet(and(0, 2, 3), known)).toBe(false);
    expect(premisesMet(and(2, 0, 3), known)).toBe(false);
    expect(premisesMet(or(0, 2, 3), known)).toBe(true);
    expect(premisesMet(or(2, 0, 3), known)).toBe(true);
    expect(premisesMet(or(2, 4, 3), known)).toBe(false);
  });

  it('lists the missing premises', () => {
    const known = new Set([0]);
    expect(missingPremises(and(0, 1, 3), known)).toEqual([1]);
    expect(missingPremises(and(2, 1, 3), known)).toEqual([2, 1]);
    expect(missingPremises(and(0, 0, 3), known)).toEqual([]);
    expect(missingPremises(or(2, 1, 3), known)).toEqual([2, 1]);
    expect(missingPremises(or(0, 1, 3), known)).toEqual([]);
    expect(missingPremises(imp(4, 3), known)).toEqual([4]);
  });

  it('premise counts per operator', () => {
    expect(premiseCount('imp')).toBe(1);
    expect(premiseCount('and')).toBe(2);
    expect(premiseCount('or')).toBe(2);
  });

  it('known statements are the facts followed by the conclusions in order', () => {
    const s = sample();
    expect(knownList(s.puzzle, [])).toEqual([0]);
    expect(knownList(s.puzzle, [0, 1, 3])).toEqual([0, 1, 2, 3]);
    expect([...knownSet(s.puzzle, [0, 1])].sort()).toEqual([0, 1, 2]);
  });

  it('closure chains rules to a fixpoint, regardless of rule order', () => {
    const rules = [imp(2, 3), imp(1, 2), imp(0, 1), and(3, 5, 4)];
    expect([...closure(rules, [0])].sort()).toEqual([0, 1, 2, 3]);
    expect([...closure(rules, [0, 5])].sort()).toEqual([0, 1, 2, 3, 4, 5]);
    expect([...closure([or(7, 0, 6)], [0])].sort()).toEqual([0, 6]);
    expect([...closure([], [3])]).toEqual([3]);
  });

  it('closure equals the set of reachable statements (oracle) and is closed under every rule', () => {
    fc.assert(
      fc.property(arbSystem, ({ n, facts, rules }) => {
        const c = closure(rules, facts);
        const reach = oracleReachable(n, rules, facts);
        for (let i = 0; i < n; i++) expect(c.has(i)).toBe(reach[i]);
        for (const r of rules) if (premisesMet(r, c)) expect(c.has(r.conclusion)).toBe(true);
      }),
      { numRuns: 300 }
    );
  });

  it('detects a letter together with its negation', () => {
    const atoms: Atom[] = [...letters(3), { letter: 1, neg: true, label: 1 }];
    expect(isConsistent(atoms, new Set([0, 1, 2]))).toBe(true);
    expect(isConsistent(atoms, new Set([0, 3]))).toBe(true);
    expect(isConsistent(atoms, new Set([1, 3]))).toBe(false);
    expect(isConsistent(atoms, new Set([3, 1]))).toBe(false);
    expect(isConsistent(atoms, new Set([9]))).toBe(true);
    // The same letter twice with the same polarity is no contradiction.
    expect(isConsistent([...atoms, { letter: 1, neg: true, label: 1 }], new Set([3, 4]))).toBe(true);
  });
});

describe('solver (shortest proof)', () => {
  it('finds the shortest proof of the sample', () => {
    const { puzzle } = sample();
    expect(shortestDistances(6, puzzle.rules, puzzle.facts)).toEqual([0, 1, 2, 3, 4, null]);
    expect(minimalSteps(6, puzzle.rules, puzzle.facts, 3)).toBe(3);
    expect(minimalSteps(6, puzzle.rules, puzzle.facts, 0)).toBe(0);
    expect(minimalSteps(6, puzzle.rules, puzzle.facts, 5)).toBeNull();
  });

  it('counts side derivations needed by a conjunction', () => {
    // A; A→B, A→C, C→D, B∧D→E: E needs B, C, D, E = 4 steps.
    const rules = [imp(0, 1), imp(0, 2), imp(2, 3), and(1, 3, 4)];
    expect(minimalSteps(5, rules, [0], 4)).toBe(4);
    // A shortcut via "or" is taken: B ∨ X → E makes it 2.
    expect(minimalSteps(5, [...rules, or(1, 3, 4)], [0], 4)).toBe(2);
  });

  it('shares premises: deriving one statement used twice counts once', () => {
    // A; A→B, B∧A→C, B∧C→D: B, C, D = 3.
    expect(minimalSteps(4, [imp(0, 1), and(1, 0, 2), and(1, 2, 3)], [0], 3)).toBe(3);
  });

  it('agrees with the brute-force oracle on random rule systems', () => {
    fc.assert(
      fc.property(arbSystem, ({ n, facts, rules }) => {
        const dist = shortestDistances(n, rules, facts);
        for (let target = 0; target < n; target++) {
          expect(dist[target]).toBe(oracleMinimal(n, rules, facts, target, n));
          expect(minimalSteps(n, rules, facts, target)).toBe(dist[target]);
        }
      }),
      { numRuns: 300 }
    );
  });
});

describe('moves', () => {
  it('applies a rule whose premises are known, adding exactly its conclusion', () => {
    const s = sample();
    expect(verdict(s, 0)).toBe('ok');
    const next = applyRule(s, 0);
    expect(next).not.toBe(s);
    expect(next.applied).toEqual([0]);
    expect(s.applied).toEqual([]);
    expect(knownList(next.puzzle, next.applied)).toEqual([0, 1]);
  });

  it('refuses rules with unknown premises, known conclusions, bad indices and moves after the goal', () => {
    let s = sample();
    expect(verdict(s, 1)).toBe('missing');
    expect(applyRule(s, 1)).toBe(s);
    expect(verdict(s, 3)).toBe('missing');
    expect(verdict(s, 6)).toBe('invalid');
    expect(verdict(s, -1)).toBe('invalid');
    expect(verdict(s, 0.5)).toBe('invalid');
    expect(applyRule(s, 6)).toBe(s);
    s = applyRule(s, 0);
    expect(verdict(s, 0)).toBe('known');
    expect(applyRule(s, 0)).toBe(s);
    s = applyRule(s, 1);
    expect(verdict(s, 3)).toBe('ok');
    expect(isSolved(s)).toBe(false);
    s = applyRule(s, 3);
    expect(isSolved(s)).toBe(true);
    expect(verdict(s, 4)).toBe('solved');
    expect(applyRule(s, 4)).toBe(s);
  });

  it('undo and reset proof take steps back, but not after the goal is proved', () => {
    const s0 = sample();
    expect(undo(s0)).toBe(s0);
    expect(resetProof(s0)).toBe(s0);
    const s2 = applyRule(applyRule(s0, 0), 1);
    expect(undo(s2).applied).toEqual([0]);
    expect(resetProof(s2).applied).toEqual([]);
    expect(s2.applied).toEqual([0, 1]);
    const solved = applyRule(s2, 2);
    expect(isSolved(solved)).toBe(true);
    expect(undo(solved)).toBe(solved);
    expect(resetProof(solved)).toBe(solved);
  });

  it('every accepted move is sound and adds exactly one new statement', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffff }), fc.constantFrom(...DIFFICULTIES), fc.array(fc.nat(20), { maxLength: 30 }), (seed, d, taps) => {
        let s = createInitialState(seed, d);
        const all = closure(s.puzzle.rules, s.puzzle.facts);
        for (const tap of taps) {
          const before = knownSet(s.puzzle, s.applied);
          const rule = s.puzzle.rules[tap];
          const next = applyRule(s, tap);
          if (next === s) {
            if (rule && !isSolved(s) && !before.has(rule.conclusion)) expect(premisesMet(rule, before)).toBe(false);
            continue;
          }
          expect(rule && premisesMet(rule, before)).toBe(true);
          const after = knownSet(next.puzzle, next.applied);
          expect(after.size).toBe(before.size + 1);
          expect(after.has((rule as Rule).conclusion)).toBe(true);
          for (const k of after) expect(all.has(k)).toBe(true);
          expect(isConsistent(next.puzzle.atoms, after)).toBe(true);
          expect(isMinimalProofState(next)).toBe(true);
          s = next;
        }
        if (isSolved(s)) expect(s.applied.length).toBeGreaterThanOrEqual(s.puzzle.minimal);
      }),
      { numRuns: 60 }
    );
  }, 60_000);
});

describe('generator', { timeout: 120_000 }, () => {
  it('meets every difficulty profile', () => {
    for (const d of DIFFICULTIES) {
      const profile = PROFILES[d];
      const minimals = new Set<number>();
      const ops = new Set<string>();
      for (let seed = 0; seed < 60; seed++) {
        const p = generatePuzzle(seed, d);
        expect(isPuzzle(p)).toBe(true);
        expect(p.atoms.filter((a) => !a.neg)).toHaveLength(profile.atoms);
        expect(p.atoms.filter((a) => a.neg)).toHaveLength(profile.negated);
        expect(new Set(p.atoms.map((a) => a.letter)).size).toBe(profile.atoms);
        expect(p.rules).toHaveLength(profile.rules);
        expect(p.facts).toHaveLength(profile.facts);
        expect(p.facts.includes(p.goal)).toBe(false);
        expect(p.minimal).toBeGreaterThanOrEqual(profile.minimal[0]);
        expect(p.minimal).toBeLessThanOrEqual(profile.minimal[1]);
        expect(minimalSteps(p.atoms.length, p.rules, p.facts, p.goal)).toBe(p.minimal);
        expect(isConsistent(p.atoms, closure(p.rules, p.facts))).toBe(true);
        const keys = p.rules.map((r) => `${r.op}:${[...r.premises].sort((a, b) => a - b).join(',')}>${r.conclusion}`);
        expect(new Set(keys).size).toBe(p.rules.length);
        expect(p.facts).toEqual([...p.facts].sort((a, b) => a - b));
        // The goal is the hardest statement within the allowed range.
        const dist = shortestDistances(p.atoms.length, p.rules, p.facts);
        for (const d of dist) if (d !== null && d <= profile.minimal[1]) expect(d).toBeLessThanOrEqual(p.minimal);
        for (const r of p.rules) {
          expect(profile.ops).toContain(r.op);
          expect(r.premises).toHaveLength(premiseCount(r.op));
          expect(p.facts).not.toContain(r.conclusion);
          const lettersUsed = [...r.premises, r.conclusion].map((i) => (p.atoms[i] as Atom).letter);
          expect(new Set(lettersUsed).size).toBe(lettersUsed.length);
          ops.add(r.op);
        }
        for (const a of p.atoms.filter((x) => x.neg)) {
          const positive = p.atoms.find((x) => !x.neg && x.letter === a.letter);
          expect(positive?.label).toBe(a.label);
        }
        minimals.add(p.minimal);
      }
      // Variety: every operator of the profile and both ends of the length range occur.
      expect([...ops].sort()).toEqual([...profile.ops].sort());
      expect(minimals.has(profile.minimal[0])).toBe(true);
      expect(minimals.has(profile.minimal[1])).toBe(true);
    }
  });

  it('minimal proof length agrees with the brute-force oracle', () => {
    for (const d of DIFFICULTIES) {
      for (let seed = 100; seed < (d === 'hard' ? 108 : 130); seed++) {
        const p = generatePuzzle(seed, d);
        expect(oracleMinimal(p.atoms.length, p.rules, p.facts, p.goal, p.minimal)).toBe(p.minimal);
        expect(oracleMinimal(p.atoms.length, p.rules, p.facts, p.goal, p.minimal - 1)).toBeNull();
      }
    }
  });

  it('is deterministic per seed and varies between seeds', () => {
    for (const d of DIFFICULTIES) {
      expect(generatePuzzle(77, d)).toEqual(generatePuzzle(77, d));
      const distinct = new Set(Array.from({ length: 8 }, (_, s) => JSON.stringify(generatePuzzle(s, d))));
      expect(distinct.size).toBe(8);
    }
  });

  it('the fallback construction is valid with the shortest allowed proof', () => {
    for (const d of DIFFICULTIES) {
      for (let seed = 0; seed < 20; seed++) {
        const profile = PROFILES[d];
        const p = fallbackPuzzle(createRng(seed), profile);
        expect(isPuzzle(p)).toBe(true);
        expect(p.minimal).toBe(profile.minimal[0]);
        expect(p.rules).toHaveLength(profile.rules);
        expect(p.facts).toHaveLength(profile.facts);
        expect(p.atoms).toHaveLength(profile.atoms + profile.negated);
        expect(oracleMinimal(p.atoms.length, p.rules, p.facts, p.goal, p.minimal)).toBe(p.minimal);
        for (const r of p.rules) expect(new Set([...r.premises, r.conclusion].map((i) => (p.atoms[i] as Atom).letter)).size).toBe(2);
      }
    }
  });
});

describe('initial state and validation', () => {
  it('creates a fresh, valid state', () => {
    const s = createInitialState(-1);
    expect(s.seed).toBe(0xffffffff);
    expect(s.difficulty).toBe(DEFAULT_DIFFICULTY);
    expect(s.applied).toEqual([]);
    expect(s.puzzle).toEqual(generatePuzzle(0xffffffff, 'easy'));
    expect(isMinimalProofState(s)).toBe(true);
    expect(createInitialState(3, 'hard').puzzle).toEqual(generatePuzzle(3, 'hard'));
  });

  it('maps unknown difficulties to the default', () => {
    expect(toDifficulty('hard')).toBe('hard');
    expect(toDifficulty('medium')).toBe('medium');
    expect(toDifficulty('extreme')).toBe('easy');
    expect(toDifficulty(undefined)).toBe('easy');
    expect(metadata.difficulties).toEqual([...DIFFICULTIES]);
  });

  it('accepts a played state and rejects tampered ones', () => {
    const good = applyRule(applyRule(sample(), 0), 1);
    expect(isMinimalProofState(good)).toBe(true);
    expect(isMinimalProofState(applyRule(good, 2))).toBe(true);
    const bad: ((s: MinimalProofState & { puzzle: Puzzle }) => unknown)[] = [
      (s) => ({ ...s, seed: -1 }),
      (s) => ({ ...s, seed: 1.5 }),
      (s) => ({ ...s, difficulty: 'extreme' }),
      (s) => ({ ...s, applied: [1] }),
      (s) => ({ ...s, applied: [0, 0] }),
      (s) => ({ ...s, applied: [0, 1, 2, 4] }),
      (s) => ({ ...s, applied: [0, 9] }),
      (s) => ({ ...s, applied: 'x' }),
      (s) => ({ ...s, puzzle: { ...s.puzzle, minimal: 2 } }),
      (s) => ({ ...s, puzzle: { ...s.puzzle, minimal: 0 } }),
      (s) => ({ ...s, puzzle: { ...s.puzzle, goal: 0 } }),
      (s) => ({ ...s, puzzle: { ...s.puzzle, goal: 6 } }),
      (s) => ({ ...s, puzzle: { ...s.puzzle, goal: 5 } }),
      (s) => ({ ...s, puzzle: { ...s.puzzle, facts: [] } }),
      (s) => ({ ...s, puzzle: { ...s.puzzle, facts: [0, 0] } }),
      (s) => ({ ...s, puzzle: { ...s.puzzle, facts: [7] } }),
      (s) => ({ ...s, puzzle: { ...s.puzzle, rules: [] } }),
      (s) => ({ ...s, puzzle: { ...s.puzzle, rules: Array.from({ length: MAX_RULES + 1 }, () => imp(0, 1)) } }),
      (s) => ({ ...s, puzzle: { ...s.puzzle, rules: [...s.puzzle.rules.slice(0, 5), { op: 'xor', premises: [5], conclusion: 3 }] } }),
      (s) => ({ ...s, puzzle: { ...s.puzzle, rules: [...s.puzzle.rules.slice(0, 5), { op: 'imp', premises: [5, 1], conclusion: 3 }] } }),
      (s) => ({ ...s, puzzle: { ...s.puzzle, rules: [...s.puzzle.rules.slice(0, 5), { op: 'and', premises: [5], conclusion: 3 }] } }),
      (s) => ({ ...s, puzzle: { ...s.puzzle, rules: [...s.puzzle.rules.slice(0, 5), { op: 'and', premises: [5, 5], conclusion: 3 }] } }),
      (s) => ({ ...s, puzzle: { ...s.puzzle, rules: [...s.puzzle.rules.slice(0, 5), { op: 'or', premises: [5, 3], conclusion: 3 }] } }),
      (s) => ({ ...s, puzzle: { ...s.puzzle, rules: [...s.puzzle.rules.slice(0, 5), { op: 'imp', premises: [9], conclusion: 3 }] } }),
      (s) => ({ ...s, puzzle: { ...s.puzzle, rules: [...s.puzzle.rules.slice(0, 5), { op: 'imp', premises: [5], conclusion: 6 }] } }),
      (s) => ({ ...s, puzzle: { ...s.puzzle, atoms: s.puzzle.atoms.slice(0, 1) } }),
      (s) => ({ ...s, puzzle: { ...s.puzzle, atoms: [...s.puzzle.atoms.slice(0, 5), { letter: 0, neg: false, label: 0 }] } }),
      (s) => ({ ...s, puzzle: { ...s.puzzle, atoms: [...s.puzzle.atoms.slice(0, 5), { letter: 26, neg: false, label: 0 }] } }),
      (s) => ({ ...s, puzzle: { ...s.puzzle, atoms: [...s.puzzle.atoms.slice(0, 5), { letter: 5, neg: 'no', label: 0 }] } }),
      (s) => ({ ...s, puzzle: { ...s.puzzle, atoms: [...s.puzzle.atoms.slice(0, 5), { letter: 5, neg: false, label: VOCAB.length }] } }),
      (s) => ({ ...s, puzzle: { ...s.puzzle, atoms: [...s.puzzle.atoms, ...letters(MAX_ATOMS).map((a) => ({ ...a, letter: a.letter + 6 }))] } }),
      // ¬E would make the derivable statements contradict each other (E is derivable).
      (s) => ({ ...s, puzzle: { ...s.puzzle, atoms: [...s.puzzle.atoms.slice(0, 5), { letter: 4, neg: true, label: 4 }], rules: [...s.puzzle.rules.slice(0, 5), imp(0, 5)], minimal: 3 } }),
      (s) => ({ ...s, puzzle: null }),
      () => null,
      () => 'state'
    ];
    for (const make of bad) expect(isMinimalProofState(make(clone(good)))).toBe(false);
  });

  it('validates puzzles directly, including size limits', () => {
    for (const junk of [null, 'x', 3, [], { atoms: 'x' }]) expect(isPuzzle(junk)).toBe(false);
    const base = sample().puzzle;
    expect(isPuzzle({ ...base, rules: [null] })).toBe(false);
    expect(isPuzzle({ ...base, rules: [...base.rules, 'rule'] })).toBe(false);
    expect(isPuzzle({ ...base, rules: 'rules' })).toBe(false);
    expect(isPuzzle({ ...base, facts: 'facts' })).toBe(false);
    expect(isPuzzle({ ...base, minimal: 'three' })).toBe(false);
    expect(isPuzzle({ ...base, goal: 'D' })).toBe(false);
    // Two atoms, one rule: the smallest puzzle.
    expect(isPuzzle({ atoms: letters(2), facts: [0], rules: [imp(0, 1)], goal: 1, minimal: 1 })).toBe(true);
    // Exactly MAX_ATOMS atoms and MAX_RULES rules are allowed (a chain of 11 steps).
    const chain = Array.from({ length: MAX_ATOMS - 1 }, (_, i) => imp(i, i + 1));
    const filler = Array.from({ length: MAX_RULES - chain.length }, (_, i) => imp(MAX_ATOMS - 1, i % 5));
    const uniqueFiller = filler.map((r, i) => (i < 5 ? r : and(MAX_ATOMS - 1, i - 4, (i % 3) + 6)));
    const big = { atoms: letters(MAX_ATOMS), facts: [0], rules: [...chain, ...uniqueFiller], goal: MAX_ATOMS - 1, minimal: MAX_ATOMS - 1 };
    expect(big.rules).toHaveLength(MAX_RULES);
    expect(isPuzzle(big)).toBe(true);
    expect(isPuzzle({ ...big, atoms: [...big.atoms, { letter: 20, neg: false, label: 0 }] })).toBe(false);
    expect(isPuzzle({ ...big, rules: [...big.rules, imp(0, 2)] })).toBe(false);
    expect(isPuzzle({ ...big, minimal: MAX_ATOMS })).toBe(false);
  });

  it('accepts a consistent negated statement', () => {
    const s = sample();
    s.puzzle.atoms[5] = { letter: 1, neg: true, label: 1 };
    expect(isMinimalProofState(s)).toBe(true);
    expect(isPuzzle(s.puzzle)).toBe(true);
  });

  it('never throws on junk', () => {
    fc.assert(fc.property(fc.anything(), (v) => void expect(isMinimalProofState(v)).toBe(false)), { numRuns: 300 });
    const getterBomb = { seed: 1, difficulty: 'easy', get puzzle() { throw new Error('boom'); } };
    expect(isMinimalProofState(getterBomb)).toBe(false);
  });
});
