// @ts-nocheck
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  CONFIGS,
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  MAX_GUESSES,
  MAX_SYMBOLS,
  canSubmit,
  checkDraft,
  clearDraft,
  clearSlot,
  countConsistent,
  createInitialState,
  firstContradiction,
  forEachCode,
  gameStatus,
  generateSecret,
  historyOf,
  isCodeAllowed,
  isConsistent,
  isDifficulty,
  isDraftComplete,
  isMastermindState,
  placeSymbol,
  sameCode,
  sameFeedback,
  scoreGuess,
  setCursor,
  submitGuess,
  toDifficulty,
  type Code,
  type CodeConfig,
  type Difficulty,
  type Feedback,
  type HistoryEntry,
  type MastermindState
} from '../src/rules';

// --- Independent oracles ------------------------------------------------------------------

/** Classic peg-matching procedure: mark exact pegs, then greedily pair remaining pegs. */
function oracleScore(secret: Code, guess: Code): Feedback {
  const usedS = secret.map(() => false);
  const usedG = guess.map(() => false);
  let exact = 0;
  let partial = 0;
  for (let i = 0; i < secret.length; i++) {
    if (secret[i] === guess[i]) {
      exact++;
      usedS[i] = usedG[i] = true;
    }
  }
  for (let i = 0; i < guess.length; i++) {
    if (usedG[i]) continue;
    for (let j = 0; j < secret.length; j++) {
      if (!usedS[j] && secret[j] === guess[i]) {
        usedS[j] = true;
        partial++;
        break;
      }
    }
  }
  return { exact, partial };
}

/** Recursive enumeration of the code space (independent of `forEachCode`). */
function oracleCodes(config: CodeConfig): number[][] {
  const out: number[][] = [];
  const rec = (prefix: number[]) => {
    if (prefix.length === config.positions) {
      out.push(prefix);
      return;
    }
    for (let s = 0; s < config.symbols; s++) {
      if (!config.repeats && prefix.includes(s)) continue;
      rec([...prefix, s]);
    }
  };
  rec([]);
  return out;
}

const oracleCount = (config: CodeConfig, history: readonly HistoryEntry[]) =>
  oracleCodes(config).filter((c) => history.every((h) => { const f = oracleScore(c, h.code); return f.exact === h.feedback.exact && f.partial === h.feedback.partial; })).length;

const codeArb = (positions: number, symbols: number) => fc.array(fc.integer({ min: 0, max: symbols - 1 }), { minLength: positions, maxLength: positions });
const pairArb = fc
  .record({ positions: fc.integer({ min: 1, max: 6 }), symbols: fc.integer({ min: 1, max: 8 }) })
  .chain(({ positions, symbols }) => fc.tuple(codeArb(positions, symbols), codeArb(positions, symbols)));
const difficultyArb = fc.constantFrom(...DIFFICULTIES);
const seedArb = fc.integer({ min: 0, max: 0xffff_ffff });

const play = (state: MastermindState, ...codes: number[][]): MastermindState => {
  let s = state;
  for (const code of codes) {
    for (const symbol of code) s = placeSymbol(s, symbol);
    s = submitGuess(s);
  }
  return s;
};

/** A guess that is guaranteed to differ from the secret. */
const wrongGuess = (state: MastermindState): number[] => {
  const config = CONFIGS[state.difficulty];
  const code = [...state.secret];
  if (config.repeats) code[0] = ((code[0] as number) + 1) % config.symbols;
  else [code[0], code[1]] = [code[1] as number, code[0] as number];
  return code;
};

// --- Configuration ------------------------------------------------------------------------

describe('difficulty configuration', () => {
  it('matches the specification', () => {
    expect(DIFFICULTIES).toEqual(['easy', 'standard', 'hard']);
    expect(CONFIGS.easy).toEqual({ positions: 4, symbols: 6, repeats: false });
    expect(CONFIGS.standard).toEqual({ positions: 4, symbols: 6, repeats: true });
    expect(CONFIGS.hard).toEqual({ positions: 5, symbols: 8, repeats: true });
    expect(MAX_GUESSES).toBe(10);
    expect(MAX_SYMBOLS).toBe(8);
    expect(DEFAULT_DIFFICULTY).toBe('standard');
    for (const d of DIFFICULTIES) expect(CONFIGS[d].symbols).toBeLessThanOrEqual(MAX_SYMBOLS);
  });

  it('recognises difficulties and falls back to the default', () => {
    for (const d of DIFFICULTIES) {
      expect(isDifficulty(d)).toBe(true);
      expect(toDifficulty(d)).toBe(d);
    }
    expect(isDifficulty('medium')).toBe(false);
    expect(isDifficulty(undefined)).toBe(false);
    expect(toDifficulty(undefined)).toBe('standard');
    expect(toDifficulty('EASY')).toBe('standard');
  });
});

// --- Feedback -----------------------------------------------------------------------------

describe('scoreGuess', () => {
  // A=0, B=1, C=2, D=3
  it.each([
    ['AABB vs ABAB', [0, 0, 1, 1], [0, 1, 0, 1], 2, 2],
    ['AABB vs BBAA', [0, 0, 1, 1], [1, 1, 0, 0], 0, 4],
    ['AABB vs AAAA', [0, 0, 1, 1], [0, 0, 0, 0], 2, 0],
    ['ABCD vs AAAA', [0, 1, 2, 3], [0, 0, 0, 0], 1, 0],
    ['AAAA vs ABCD', [0, 0, 0, 0], [0, 1, 2, 3], 1, 0],
    ['ABCD vs DCBA', [0, 1, 2, 3], [3, 2, 1, 0], 0, 4],
    ['ABCD vs ABCD', [0, 1, 2, 3], [0, 1, 2, 3], 4, 0],
    ['ABCD vs EEEE', [0, 1, 2, 3], [4, 4, 4, 4], 0, 0],
    ['AAAB vs BAAA', [0, 0, 0, 1], [1, 0, 0, 0], 2, 2],
    ['ABBB vs BAAA', [0, 1, 1, 1], [1, 0, 0, 0], 0, 2],
    ['AABC vs CAAA', [0, 0, 1, 2], [2, 0, 0, 0], 1, 2],
    ['ABCDE vs EABCD', [0, 1, 2, 3, 4], [4, 0, 1, 2, 3], 0, 5],
    ['AABBC vs ABABE', [0, 0, 1, 1, 2], [0, 1, 0, 1, 4], 2, 2],
    ['single exact', [5], [5], 1, 0],
    ['single miss', [5], [6], 0, 0]
  ])('%s', (_name, secret, guess, exact, partial) => {
    expect(scoreGuess(secret, guess)).toEqual({ exact, partial });
  });

  it('rejects codes of different lengths', () => {
    expect(() => scoreGuess([0, 1], [0, 1, 2])).toThrow(RangeError);
    expect(() => scoreGuess([0, 1, 2], [0, 1])).toThrow(RangeError);
  });

  it('agrees with an independent peg-matching oracle', () => {
    fc.assert(fc.property(pairArb, ([secret, guess]) => {
      expect(scoreGuess(secret, guess)).toEqual(oracleScore(secret, guess));
    }), { numRuns: 2000 });
  });

  it('never reports more pegs than positions and is non-negative', () => {
    fc.assert(fc.property(pairArb, ([secret, guess]) => {
      const { exact, partial } = scoreGuess(secret, guess);
      expect(exact).toBeGreaterThanOrEqual(0);
      expect(partial).toBeGreaterThanOrEqual(0);
      expect(exact + partial).toBeLessThanOrEqual(secret.length);
    }));
  });

  it('is symmetric', () => {
    fc.assert(fc.property(pairArb, ([a, b]) => {
      expect(scoreGuess(a, b)).toEqual(scoreGuess(b, a));
    }));
  });

  it('gives a perfect score exactly for identical codes', () => {
    fc.assert(fc.property(pairArb, ([a, b]) => {
      expect(scoreGuess(a, a)).toEqual({ exact: a.length, partial: 0 });
      expect(scoreGuess(a, b).exact === a.length).toBe(sameCode(a, b));
    }));
  });

  it('is invariant under a shared position permutation and symbol relabelling', () => {
    const arb = pairArb.chain(([a, b]) =>
      fc.tuple(fc.constant(a), fc.constant(b), fc.shuffledSubarray([...a.keys()], { minLength: a.length, maxLength: a.length }), fc.shuffledSubarray([0, 1, 2, 3, 4, 5, 6, 7], { minLength: 8, maxLength: 8 }))
    );
    fc.assert(fc.property(arb, ([a, b, perm, relabel]) => {
      const pa = perm.map((i) => relabel[a[i] as number] as number);
      const pb = perm.map((i) => relabel[b[i] as number] as number);
      expect(scoreGuess(pa, pb)).toEqual(scoreGuess(a, b));
    }));
  });

  it('total pegs equal the multiset intersection size', () => {
    fc.assert(fc.property(pairArb, ([a, b]) => {
      let common = 0;
      for (let s = 0; s < 8; s++) common += Math.min(a.filter((x) => x === s).length, b.filter((x) => x === s).length);
      const { exact, partial } = scoreGuess(a, b);
      expect(exact + partial).toBe(common);
      expect(exact).toBe(a.filter((x, i) => x === b[i]).length);
    }));
  });

  it('compares feedback and codes structurally', () => {
    expect(sameFeedback({ exact: 1, partial: 2 }, { exact: 1, partial: 2 })).toBe(true);
    expect(sameFeedback({ exact: 1, partial: 2 }, { exact: 2, partial: 2 })).toBe(false);
    expect(sameFeedback({ exact: 1, partial: 2 }, { exact: 1, partial: 1 })).toBe(false);
    expect(sameCode([1, 2], [1, 2])).toBe(true);
    expect(sameCode([1, 2], [2, 1])).toBe(false);
    expect(sameCode([1, 2], [1, 2, 3])).toBe(false);
    expect(sameCode([], [])).toBe(true);
  });
});

// --- Secret generation --------------------------------------------------------------------

describe('generateSecret', () => {
  it('respects the difficulty constraints for many seeds', () => {
    fc.assert(fc.property(seedArb, difficultyArb, (seed, difficulty) => {
      const config = CONFIGS[difficulty];
      const secret = generateSecret(seed, difficulty);
      expect(secret).toHaveLength(config.positions);
      for (const s of secret) {
        expect(Number.isInteger(s)).toBe(true);
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThan(config.symbols);
      }
      if (!config.repeats) expect(new Set(secret).size).toBe(secret.length);
      expect(isCodeAllowed(config, secret)).toBe(true);
    }), { numRuns: 1000 });
  });

  it('is deterministic per seed and difficulty', () => {
    fc.assert(fc.property(seedArb, difficultyArb, (seed, difficulty) => {
      expect(generateSecret(seed, difficulty)).toEqual(generateSecret(seed, difficulty));
    }));
    expect(generateSecret(1, 'standard')).not.toEqual(generateSecret(2, 'standard'));
  });

  it('uses the whole alphabet and produces repeats only where allowed', () => {
    for (const difficulty of DIFFICULTIES) {
      const config = CONFIGS[difficulty];
      const seen = new Set<number>();
      const perPosition = Array.from({ length: config.positions }, () => new Set<number>());
      let withRepeats = 0;
      for (let seed = 0; seed < 400; seed++) {
        const secret = generateSecret(seed, difficulty);
        secret.forEach((s, i) => { seen.add(s); perPosition[i]?.add(s); });
        if (new Set(secret).size < secret.length) withRepeats++;
      }
      expect([...seen].sort((a, b) => a - b)).toEqual(Array.from({ length: config.symbols }, (_, i) => i));
      for (const set of perPosition) expect(set.size).toBe(config.symbols);
      if (config.repeats) expect(withRepeats).toBeGreaterThan(0);
      else expect(withRepeats).toBe(0);
    }
  });
});

describe('isCodeAllowed', () => {
  it('checks length, range and the repeat rule', () => {
    expect(isCodeAllowed(CONFIGS.easy, [0, 1, 2, 5])).toBe(true);
    expect(isCodeAllowed(CONFIGS.easy, [0, 1, 1, 5])).toBe(false);
    expect(isCodeAllowed(CONFIGS.standard, [0, 1, 1, 5])).toBe(true);
    expect(isCodeAllowed(CONFIGS.standard, [0, 1, 1, 6])).toBe(false);
    expect(isCodeAllowed(CONFIGS.standard, [-1, 1, 1, 5])).toBe(false);
    expect(isCodeAllowed(CONFIGS.standard, [0, 1, 1])).toBe(false);
    expect(isCodeAllowed(CONFIGS.standard, [0, 1, 1, 2, 3])).toBe(false);
    expect(isCodeAllowed(CONFIGS.standard, [0, 1.5, 1, 2])).toBe(false);
    expect(isCodeAllowed(CONFIGS.standard, [0, '1', 1, 2])).toBe(false);
    expect(isCodeAllowed(CONFIGS.hard, [7, 7, 7, 7, 7])).toBe(true);
    expect(isCodeAllowed(CONFIGS.hard, [7, 7, 7, 7, 8])).toBe(false);
  });
});

// --- Code space & consistency -------------------------------------------------------------

describe('forEachCode', () => {
  it.each(DIFFICULTIES.map((d) => [d] as const))('enumerates exactly the allowed codes for %s in lexicographic order', (difficulty) => {
    const config = CONFIGS[difficulty];
    const codes: number[][] = [];
    forEachCode(config, (c) => codes.push([...c]));
    expect(codes).toEqual(oracleCodes(config));
  });

  it('has the expected code-space sizes', () => {
    const size = (config: CodeConfig) => { let n = 0; forEachCode(config, () => n++); return n; };
    expect(size(CONFIGS.easy)).toBe(360);
    expect(size(CONFIGS.standard)).toBe(1296);
    expect(size(CONFIGS.hard)).toBe(32768);
    expect(size({ positions: 2, symbols: 3, repeats: false })).toBe(6);
    expect(size({ positions: 1, symbols: 1, repeats: true })).toBe(1);
  });
});

describe('consistency', () => {
  const small: CodeConfig = { positions: 3, symbols: 4, repeats: true };
  const historyArb = (config: CodeConfig) =>
    fc.tuple(codeArb(config.positions, config.symbols), fc.array(codeArb(config.positions, config.symbols), { maxLength: 4 }))
      .filter(([secret]) => isCodeAllowed(config, secret))
      .map(([secret, guesses]) => ({ secret, history: guesses.map((code) => ({ code, feedback: scoreGuess(secret, code) })) }));

  it('the secret always remains consistent with its own feedback', () => {
    for (const config of [small, CONFIGS.easy, CONFIGS.standard]) {
      fc.assert(fc.property(historyArb(config), ({ secret, history }) => {
        expect(isConsistent(secret, history)).toBe(true);
        expect(firstContradiction(secret, history)).toBe(-1);
        expect(countConsistent(config, history)).toBeGreaterThanOrEqual(1);
      }), { numRuns: 60 });
    }
  });

  it('counts match a brute-force oracle', () => {
    for (const config of [small, { positions: 3, symbols: 5, repeats: false }, CONFIGS.easy]) {
      fc.assert(fc.property(historyArb(config), ({ history }) => {
        expect(countConsistent(config, history)).toBe(oracleCount(config, history));
      }), { numRuns: 40 });
    }
  });

  it('never grows when more feedback is added', () => {
    fc.assert(fc.property(historyArb(small), ({ history }) => {
      let previous = Infinity;
      for (let i = 0; i <= history.length; i++) {
        const n = countConsistent(small, history.slice(0, i));
        expect(n).toBeLessThanOrEqual(previous);
        previous = n;
      }
    }));
  });

  it('leaves exactly one candidate after the winning guess', () => {
    fc.assert(fc.property(seedArb, difficultyArb, (seed, difficulty) => {
      const secret = generateSecret(seed, difficulty);
      expect(countConsistent(CONFIGS[difficulty], [{ code: secret, feedback: { exact: secret.length, partial: 0 } }])).toBe(1);
    }), { numRuns: 10 });
  });

  it('counts the whole space without feedback', () => {
    expect(countConsistent(CONFIGS.easy, [])).toBe(360);
    expect(countConsistent(CONFIGS.standard, [])).toBe(1296);
  });

  it('reports the first contradicted guess', () => {
    const history: HistoryEntry[] = [
      { code: [0, 1, 2, 3], feedback: { exact: 0, partial: 0 } },
      { code: [4, 4, 5, 5], feedback: { exact: 2, partial: 0 } }
    ];
    expect(firstContradiction([4, 4, 4, 4], history)).toBe(-1);
    expect(firstContradiction([0, 4, 4, 4], history)).toBe(0);
    expect(firstContradiction([4, 5, 4, 4], history)).toBe(1);
    expect(isConsistent([4, 5, 4, 4], history)).toBe(false);
    expect(isConsistent([5, 5, 5, 5], history)).toBe(true);
    expect(firstContradiction([1, 1, 1, 1], [])).toBe(-1);
  });
});

describe('checkDraft', () => {
  const history: HistoryEntry[] = [{ code: [0, 1, 2, 3], feedback: { exact: 1, partial: 1 } }];
  const config = CONFIGS.standard;
  const remaining = oracleCount(config, history);

  it('reports the remaining count with every verdict', () => {
    expect(remaining).toBeGreaterThan(1);
    expect(checkDraft(config, history, [0, null, 2, 3])).toEqual({ verdict: 'incomplete', remaining });
    expect(checkDraft(config, history, [null, null, null, null])).toEqual({ verdict: 'incomplete', remaining });
    expect(checkDraft(config, history, [0, 2, 4, 4])).toEqual({ verdict: 'consistent', remaining });
    expect(checkDraft(config, history, [0, 1, 4, 4])).toEqual({ verdict: 'contradicts', remaining, guessIndex: 0, wouldGet: { exact: 2, partial: 0 } });
  });

  it('flags repeated symbols when the code cannot repeat', () => {
    const easyHistory: HistoryEntry[] = [{ code: [0, 1, 2, 3], feedback: { exact: 0, partial: 0 } }];
    expect(checkDraft(CONFIGS.easy, easyHistory, [4, 4, 5, 5])).toEqual({ verdict: 'repeats', remaining: oracleCount(CONFIGS.easy, easyHistory) });
    expect(checkDraft(CONFIGS.standard, easyHistory, [4, 4, 5, 5]).verdict).toBe('consistent');
  });

  it('with no history, every allowed draft is consistent', () => {
    fc.assert(fc.property(codeArb(4, 6), (draft) => {
      const result = checkDraft(CONFIGS.standard, [], draft);
      expect(result).toEqual({ verdict: 'consistent', remaining: 1296 });
    }), { numRuns: 20 });
  });

  it('agrees with isConsistent and never reports a contradiction for the secret', () => {
    fc.assert(fc.property(seedArb, fc.array(codeArb(4, 6), { maxLength: 3 }), codeArb(4, 6), (seed, guesses, draft) => {
      const secret = generateSecret(seed, 'standard');
      const h = guesses.map((code) => ({ code, feedback: scoreGuess(secret, code) }));
      expect(checkDraft(config, h, secret).verdict).toBe('consistent');
      const result = checkDraft(config, h, draft);
      expect(result.verdict === 'consistent').toBe(isConsistent(draft, h));
      if (result.verdict === 'contradicts') {
        const entry = h[result.guessIndex] as HistoryEntry;
        expect(result.guessIndex).toBe(firstContradiction(draft, h));
        expect(result.wouldGet).toEqual(scoreGuess(draft, entry.code));
        expect(sameFeedback(result.wouldGet, entry.feedback)).toBe(false);
      }
    }), { numRuns: 40 });
  });
});

// --- Game state transitions -----------------------------------------------------------------

describe('game state', () => {
  it('creates a deterministic initial state', () => {
    const state = createInitialState(42, 'hard');
    expect(state).toEqual({ seed: 42, difficulty: 'hard', secret: generateSecret(42, 'hard'), guesses: [], draft: [null, null, null, null, null], cursor: 0 });
    expect(createInitialState(42, 'hard')).toEqual(state);
    expect(createInitialState(7).difficulty).toBe('standard');
    expect(createInitialState(-1).seed).toBe(0xffff_ffff);
    expect(gameStatus(state)).toBe('playing');
    expect(isMastermindState(state)).toBe(true);
  });

  it('places symbols and advances the cursor to the next empty position', () => {
    let s = createInitialState(1, 'standard');
    s = placeSymbol(s, 3);
    expect(s.draft).toEqual([3, null, null, null]);
    expect(s.cursor).toBe(1);
    s = setCursor(s, 3);
    s = placeSymbol(s, 5);
    expect(s.draft).toEqual([3, null, null, 5]);
    expect(s.cursor).toBe(1); // wraps to the first empty position
    s = placeSymbol(s, 0);
    expect(s.cursor).toBe(2);
    expect(isDraftComplete(s)).toBe(false);
    expect(canSubmit(s)).toBe(false);
    s = placeSymbol(s, 0);
    expect(s.draft).toEqual([3, 0, 0, 5]);
    expect(s.cursor).toBe(3); // all filled: one step right
    expect(isDraftComplete(s)).toBe(true);
    expect(canSubmit(s)).toBe(true);
    s = placeSymbol(s, 1);
    expect(s.draft).toEqual([3, 0, 0, 1]);
    expect(s.cursor).toBe(3); // clamped at the last position
  });

  it('overwrites a filled position and keeps state immutable', () => {
    const a = placeSymbol(createInitialState(1), 2);
    const b = placeSymbol(setCursor(a, 0), 4);
    expect(a.draft).toEqual([2, null, null, null]);
    expect(b.draft).toEqual([4, null, null, null]);
    expect(b.cursor).toBe(1);
  });

  it('ignores invalid symbols and cursor positions', () => {
    const s = createInitialState(1, 'standard');
    expect(placeSymbol(s, 6)).toBe(s);
    expect(placeSymbol(s, -1)).toBe(s);
    expect(placeSymbol(s, 1.5)).toBe(s);
    expect(placeSymbol(s, 5)).not.toBe(s);
    expect(placeSymbol(createInitialState(1, 'hard'), 7).draft[0]).toBe(7);
    expect(setCursor(s, 4)).toBe(s);
    expect(setCursor(s, -1)).toBe(s);
    expect(setCursor(s, 0)).toBe(s);
    expect(setCursor(s, 3).cursor).toBe(3);
  });

  it('clears with backspace semantics', () => {
    let s = createInitialState(1);
    s = placeSymbol(placeSymbol(s, 1), 2); // [1,2,_,_] cursor 2
    expect(clearSlot(s)).toMatchObject({ draft: [1, null, null, null], cursor: 1 });
    const filled = setCursor(s, 0);
    expect(clearSlot(filled)).toMatchObject({ draft: [null, 2, null, null], cursor: 0 });
    const empty = createInitialState(1);
    expect(clearSlot(empty)).toBe(empty);
    expect(clearDraft(s)).toMatchObject({ draft: [null, null, null, null], cursor: 0 });
    expect(clearDraft(empty)).toBe(empty);
    expect(clearDraft(setCursor(empty, 2))).toMatchObject({ cursor: 0 });
  });

  it('only submits complete drafts and records the guess', () => {
    const start = createInitialState(9, 'standard');
    expect(submitGuess(start)).toBe(start);
    const partial = placeSymbol(start, 0);
    expect(submitGuess(partial)).toBe(partial);
    const guess = wrongGuess(start);
    const after = play(start, guess);
    expect(after.guesses).toEqual([guess]);
    expect(after.draft).toEqual([null, null, null, null]);
    expect(after.cursor).toBe(0);
    expect(gameStatus(after)).toBe('playing');
    expect(historyOf(after)).toEqual([{ code: guess, feedback: scoreGuess(start.secret, guess) }]);
  });

  it('is won by guessing the secret and then ignores input', () => {
    const start = createInitialState(5, 'easy');
    const won = play(start, wrongGuess(start), start.secret);
    expect(gameStatus(won)).toBe('won');
    expect(won.guesses).toHaveLength(2);
    expect(canSubmit(won)).toBe(false);
    expect(placeSymbol(won, 0)).toBe(won);
    expect(setCursor(won, 1)).toBe(won);
    expect(clearSlot(won)).toBe(won);
    expect(clearDraft(won)).toBe(won);
    expect(isMastermindState(won)).toBe(true);
  });

  it('is lost after ten wrong guesses; winning on the tenth still counts', () => {
    const start = createInitialState(11, 'hard');
    const wrong = wrongGuess(start);
    const nine = play(start, ...Array.from({ length: 9 }, () => wrong));
    expect(gameStatus(nine)).toBe('playing');
    expect(gameStatus(play(nine, wrong))).toBe('lost');
    expect(play(nine, wrong).guesses).toHaveLength(10);
    const lost = play(nine, wrong);
    const filled = { ...lost, draft: [...start.secret] };
    expect(canSubmit(filled)).toBe(false);
    expect(submitGuess(filled)).toBe(filled);
    expect(gameStatus(play(nine, start.secret))).toBe('won');
    expect(isMastermindState(lost)).toBe(true);
  });

  it('random play keeps every reachable state valid', () => {
    const action = fc.oneof(
      fc.record({ kind: fc.constant('place' as const), n: fc.integer({ min: -1, max: 8 }) }),
      fc.record({ kind: fc.constant('cursor' as const), n: fc.integer({ min: -1, max: 5 }) }),
      fc.record({ kind: fc.constantFrom('clear' as const, 'clearAll' as const, 'submit' as const), n: fc.constant(0) })
    );
    fc.assert(fc.property(seedArb, difficultyArb, fc.array(action, { maxLength: 80 }), (seed, difficulty, actions) => {
      let s = createInitialState(seed, difficulty);
      for (const a of actions) {
        const before = s;
        if (a.kind === 'place') s = placeSymbol(s, a.n);
        else if (a.kind === 'cursor') s = setCursor(s, a.n);
        else if (a.kind === 'clear') s = clearSlot(s);
        else if (a.kind === 'clearAll') s = clearDraft(s);
        else s = submitGuess(s);
        expect(isMastermindState(s)).toBe(true);
        expect(s.guesses.length - before.guesses.length).toBeLessThanOrEqual(1);
        expect(s.secret).toBe(before.secret);
      }
    }), { numRuns: 200 });
  });
});

// --- Validation ---------------------------------------------------------------------------

describe('isMastermindState', () => {
  const base = (difficulty: Difficulty = 'standard'): MastermindState => {
    const s = createInitialState(123, difficulty);
    return play(placeSymbol(placeSymbol(s, 0), 1), wrongGuess(s)) as MastermindState;
  };
  const withDraft = (s: MastermindState) => placeSymbol(s, 2);

  it('accepts valid states for every difficulty', () => {
    for (const d of DIFFICULTIES) {
      expect(isMastermindState(createInitialState(0, d))).toBe(true);
      expect(isMastermindState(base(d))).toBe(true);
      expect(isMastermindState(withDraft(base(d)))).toBe(true);
      expect(isMastermindState(JSON.parse(JSON.stringify(withDraft(base(d)))))).toBe(true);
    }
  });

  it('rejects junk', () => {
    for (const junk of [null, undefined, 0, 'x', [], {}, [[1, 2]], { board: 'nope' }]) expect(isMastermindState(junk)).toBe(false);
  });

  it.each<[string, (s: MastermindState) => unknown]>([
    ['negative seed', (s) => ({ ...s, seed: -1 })],
    ['fractional seed', (s) => ({ ...s, seed: 1.5 })],
    ['seed too large', (s) => ({ ...s, seed: 0x1_0000_0000 })],
    ['unknown difficulty', (s) => ({ ...s, difficulty: 'medium' })],
    ['difficulty mismatching secret length', (s) => ({ ...s, difficulty: 'hard' })],
    ['difficulty mismatching seed', (s) => ({ ...s, difficulty: 'easy' })],
    ['tampered secret', (s) => ({ ...s, secret: s.secret.map((x, i) => (i === 0 ? (x + 1) % 6 : x)) })],
    ['short secret', (s) => ({ ...s, secret: s.secret.slice(1) })],
    ['secret not an array', (s) => ({ ...s, secret: 'abcd' })],
    ['other seed', (s) => ({ ...s, seed: s.seed + 1 })],
    ['guesses not an array', (s) => ({ ...s, guesses: {} })],
    ['guess too short', (s) => ({ ...s, guesses: [[0, 1, 2]] })],
    ['guess too long', (s) => ({ ...s, guesses: [[0, 1, 2, 3, 4]] })],
    ['guess symbol out of range', (s) => ({ ...s, guesses: [[0, 1, 2, 6]] })],
    ['guess symbol negative', (s) => ({ ...s, guesses: [[0, 1, 2, -1]] })],
    ['guess symbol non-integer', (s) => ({ ...s, guesses: [[0, 1, 2, 0.5]] })],
    ['guess with null', (s) => ({ ...s, guesses: [[0, 1, 2, null]] })],
    ['eleven guesses', (s) => ({ ...s, guesses: Array.from({ length: 11 }, () => wrongGuess(s)), draft: [null, null, null, null] })],
    ['play after a correct guess', (s) => ({ ...s, guesses: [s.secret, wrongGuess(s)] })],
    ['draft too short', (s) => ({ ...s, draft: [null, null, null] })],
    ['draft too long', (s) => ({ ...s, draft: [null, null, null, null, null] })],
    ['draft symbol out of range', (s) => ({ ...s, draft: [6, null, null, null] })],
    ['draft symbol wrong type', (s) => ({ ...s, draft: ['1', null, null, null] })],
    ['draft undefined entry', (s) => ({ ...s, draft: [undefined, null, null, null] })],
    ['cursor out of range', (s) => ({ ...s, cursor: 4 })],
    ['cursor negative', (s) => ({ ...s, cursor: -1 })],
    ['cursor missing', (s) => ({ ...s, cursor: undefined })],
    ['draft after win', (s) => ({ ...s, guesses: [s.secret], draft: [1, null, null, null] })],
    ['cursor moved after win', (s) => ({ ...s, guesses: [s.secret], cursor: 2 })],
    ['draft after loss', (s) => ({ ...s, guesses: Array.from({ length: 10 }, () => wrongGuess(s)), draft: [null, null, null, 1] })]
  ])('rejects %s', (_name, mutate) => {
    expect(isMastermindState(mutate(base()))).toBe(false);
  });

  it('accepts finished states', () => {
    const s = base();
    expect(isMastermindState({ ...s, guesses: [s.secret], draft: [null, null, null, null], cursor: 0 })).toBe(true);
    expect(isMastermindState({ ...s, guesses: Array.from({ length: 10 }, () => wrongGuess(s)), draft: [null, null, null, null], cursor: 0 })).toBe(true);
    expect(isMastermindState({ ...s, guesses: [...Array.from({ length: 9 }, () => wrongGuess(s)), s.secret], draft: [null, null, null, null], cursor: 0 })).toBe(true);
  });

  it('accepts repeats in guesses even on easy and rejects a tampered easy secret', () => {
    const s = createInitialState(3, 'easy');
    expect(isMastermindState({ ...s, guesses: [[0, 0, 0, 0]] })).toBe(true);
    expect(isMastermindState({ ...s, secret: [0, 0, 1, 2] })).toBe(false);
  });

  it('never throws on arbitrary input', () => {
    fc.assert(fc.property(fc.anything(), (v) => {
      expect(() => isMastermindState(v)).not.toThrow();
    }), { numRuns: 500 });
    const hostile = new Proxy({}, { get() { throw new Error('boom'); }, ownKeys() { throw new Error('boom'); } });
    expect(isMastermindState(hostile)).toBe(false);
  });
});
