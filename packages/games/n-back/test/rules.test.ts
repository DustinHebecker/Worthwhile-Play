import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import { metadata } from '../src/metadata';
import {
  answer,
  blockLength,
  canCompare,
  DEFAULT_DIFFICULTY,
  DEFAULT_PACE,
  DEFAULT_VARIANT,
  DIFFICULTIES,
  dPrime,
  generateBlock,
  generateStream,
  GLYPHS,
  inverseNormal,
  isLureAt,
  isMatchAt,
  isValidNBackState,
  LURES_PER_STREAM,
  matchMask,
  MATCHES_PER_STREAM,
  newBlock,
  nOf,
  PACES,
  POSITION_BIT,
  POSITIONS,
  positionsOf,
  SCORED_ITEMS,
  scoreBlock,
  scoreStream,
  setPace,
  setVariant,
  SHAPES,
  startBlock,
  SYMBOL_BIT,
  symbolsOf,
  togglePending,
  toDifficulty,
  toPace,
  toVariant,
  VARIANT_MASK,
  VARIANTS,
  type Difficulty,
  type NBackState,
  type StreamScore,
  type Variant
} from '../src/rules';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const seedArb = fc.integer({ min: 0, max: 0xffff_ffff });
const difficultyArb = fc.constantFrom(...DIFFICULTIES);
const variantArb = fc.constantFrom(...VARIANTS);

/** Plays a whole block; `claims(i)` is the answer bit mask given for item i. */
function play(seed: number, difficulty: Difficulty, variant: Variant, claims: (i: number) => number) {
  let state = startBlock(newBlock(seed, difficulty, variant));
  const states: NBackState[] = [state];
  while (state.phase === 'running') {
    state = answer(state, claims(state.index));
    states.push(state);
  }
  return { state, states };
}

/** Independent oracle: classify every scored answer by brute force. */
function oracle(values: readonly number[], claimed: readonly boolean[], n: number): StreamScore {
  const out = { targets: 0, hits: 0, misses: 0, falseAlarms: 0, correctRejections: 0 };
  claimed.forEach((c, i) => {
    if (i < n) return;
    const match = values[i] === values[i - n];
    if (match) out.targets += 1;
    if (match && c) out.hits += 1;
    if (match && !c) out.misses += 1;
    if (!match && c) out.falseAlarms += 1;
    if (!match && !c) out.correctRejections += 1;
  });
  return out;
}

const count = (length: number, test: (i: number) => boolean) => Array.from({ length }, (_, i) => i).filter(test).length;

describe('options and constants', () => {
  it('keeps metadata difficulties in sync with the rules, easy to hard', () => {
    expect(metadata.difficulties).toEqual([...DIFFICULTIES]);
    expect(DIFFICULTIES.map(nOf)).toEqual([1, 2, 3]);
    expect(DEFAULT_DIFFICULTY).toBe('n1');
  });

  it('has a block of 20 scored items plus N lead-in items and a 30 % match rate', () => {
    expect(SCORED_ITEMS).toBe(20);
    expect(DIFFICULTIES.map(blockLength)).toEqual([21, 22, 23]);
    expect(MATCHES_PER_STREAM / SCORED_ITEMS).toBe(0.3);
    expect(LURES_PER_STREAM).toEqual({ n1: 0, n2: 0, n3: 3 });
  });

  it('maps unknown option values to defaults', () => {
    expect(toDifficulty('n3')).toBe('n3');
    expect(toDifficulty('n4')).toBe('n1');
    expect(toDifficulty(undefined)).toBe('n1');
    expect(toVariant('dual')).toBe('dual');
    expect(toVariant('letters')).toBe(DEFAULT_VARIANT);
    expect(DEFAULT_VARIANT).toBe('position');
    expect(toPace('timed')).toBe('timed');
    expect(toPace(3)).toBe(DEFAULT_PACE);
    expect(DEFAULT_PACE).toBe('self');
  });

  it('has distinct glyphs for every shape and masks per variant', () => {
    expect(new Set(SHAPES.map((s) => GLYPHS[s])).size).toBe(SHAPES.length);
    expect(VARIANT_MASK).toEqual({ position: 1, symbol: 2, dual: 3 });
    expect([POSITION_BIT, SYMBOL_BIT]).toEqual([1, 2]);
    expect(POSITIONS).toBe(9);
  });
});

describe('match and look-alike detection', () => {
  it('detects matches exactly N back', () => {
    const v = [4, 1, 4, 4, 2];
    expect(isMatchAt(v, 0, 2)).toBe(false);
    expect(isMatchAt(v, 1, 2)).toBe(false);
    expect(isMatchAt(v, 2, 2)).toBe(true);
    expect(isMatchAt(v, 3, 2)).toBe(false);
    expect(isMatchAt(v, 3, 1)).toBe(true);
    expect(isMatchAt(v, 4, 1)).toBe(false);
  });

  it('detects look-alikes at N-1 and N+1, never for matches or the lead-in', () => {
    // n = 3: i = 4 compares with 1 (match), 2 (N-1) and 0 (N+1).
    expect(isLureAt([7, 0, 0, 0, 7], 4, 3)).toBe(true); // N+1
    expect(isLureAt([0, 0, 7, 0, 7], 4, 3)).toBe(true); // N-1
    expect(isLureAt([7, 7, 7, 0, 7], 4, 3)).toBe(false); // a match is not a look-alike
    expect(isLureAt([1, 2, 3, 4, 5], 4, 3)).toBe(false);
    expect(isLureAt([5, 5, 5], 2, 3)).toBe(false); // lead-in
    // n = 3, i = 3: no item N+1 back, only N-1 counts.
    expect(isLureAt([0, 9, 9, 9], 3, 3)).toBe(true);
    expect(isLureAt([9, 0, 1, 9], 3, 3)).toBe(false);
    // n = 1: "N-1 back" is the item itself and never counts.
    expect(isLureAt([3, 4, 5], 2, 1)).toBe(false);
    expect(isLureAt([5, 4, 5], 2, 1)).toBe(true);
    expect(isLureAt([5, 4], 1, 1)).toBe(false);
  });
});

describe('sequence generator', { timeout: 60_000 }, () => {
  it('is deterministic per seed and difficulty', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, (seed, difficulty) => {
        expect(generateBlock(seed, difficulty)).toEqual(generateBlock(seed, difficulty));
      }),
      { numRuns: 50 }
    );
    expect(generateBlock(1, 'n2')).not.toEqual(generateBlock(2, 'n2'));
  });

  it('produces exactly 30 % matches and the planned look-alikes in both streams', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, (seed, difficulty) => {
        const block = generateBlock(seed, difficulty);
        const n = nOf(difficulty);
        expect(block).toHaveLength(blockLength(difficulty));
        for (const values of [positionsOf(block), symbolsOf(block)]) {
          expect(count(values.length, (i) => isMatchAt(values, i, n))).toBe(MATCHES_PER_STREAM);
          expect(count(values.length, (i) => isLureAt(values, i, n))).toBe(LURES_PER_STREAM[difficulty]);
        }
        for (const item of block) {
          expect(Number.isInteger(item.position) && item.position >= 0 && item.position < POSITIONS).toBe(true);
          expect(Number.isInteger(item.symbol) && item.symbol >= 0 && item.symbol < SHAPES.length).toBe(true);
        }
      }),
      { numRuns: 300 }
    );
  });

  it('uses the whole value range over many blocks', () => {
    const positions = new Set<number>();
    const symbols = new Set<number>();
    for (let seed = 0; seed < 20; seed++) {
      for (const item of generateBlock(seed, 'n2')) {
        positions.add(item.position);
        symbols.add(item.symbol);
      }
    }
    expect(positions.size).toBe(POSITIONS);
    expect(symbols.size).toBe(SHAPES.length);
  });

  it('generates single streams with arbitrary parameters', () => {
    fc.assert(
      fc.property(seedArb, fc.integer({ min: 1, max: 3 }), fc.integer({ min: 0, max: 4 }), fc.integer({ min: 5, max: 9 }), (seed, n, lures, valueCount) => {
        const length = n + 20;
        const values = generateStream(createRng(seed), length, n, valueCount, lures);
        expect(values).toHaveLength(length);
        expect(values.every((v) => Number.isInteger(v) && v >= 0 && v < valueCount)).toBe(true);
        expect(count(length, (i) => isMatchAt(values, i, n))).toBe(MATCHES_PER_STREAM);
        // Look-alikes need an N-1 or N+1 item; with N = 1 only N+1 exists.
        expect(count(length, (i) => isLureAt(values, i, n))).toBe(lures);
      }),
      { numRuns: 200 }
    );
  });

  it('reports the match mask of an item', () => {
    const block = generateBlock(5, 'n2');
    const n = 2;
    block.forEach((_, i) => {
      const expected = (isMatchAt(positionsOf(block), i, n) ? 1 : 0) | (isMatchAt(symbolsOf(block), i, n) ? 2 : 0);
      expect(matchMask(block, i, n)).toBe(expected);
    });
    expect(matchMask([{ position: 1, symbol: 2 }, { position: 1, symbol: 2 }], 1, 1)).toBe(3);
    expect(matchMask([{ position: 1, symbol: 2 }, { position: 1, symbol: 3 }], 1, 1)).toBe(1);
    expect(matchMask([{ position: 1, symbol: 2 }, { position: 0, symbol: 2 }], 1, 1)).toBe(2);
    expect(matchMask([{ position: 1, symbol: 2 }], 0, 1)).toBe(0);
  });
});

describe('block flow', () => {
  it('starts ready with the given options and normalized seed', () => {
    expect(newBlock(-1, 'n2', 'dual', 'timed')).toEqual({
      seed: 0xffff_ffff,
      difficulty: 'n2',
      variant: 'dual',
      pace: 'timed',
      phase: 'ready',
      index: 0,
      answers: [],
      pending: 0
    });
    expect(newBlock(3, 'n1')).toMatchObject({ variant: 'position', pace: 'self' });
  });

  it('changes options only before the start', () => {
    const ready = newBlock(1, 'n1');
    expect(setVariant(ready, 'symbol').variant).toBe('symbol');
    expect(setPace(ready, 'timed').pace).toBe('timed');
    const running = startBlock(ready);
    expect(setVariant(running, 'symbol')).toBe(running);
    expect(setPace(running, 'timed')).toBe(running);
    expect(startBlock(running)).toBe(running);
  });

  it('forces "nothing to compare" during the lead-in and masks claims by variant', () => {
    let s = startBlock(newBlock(1, 'n2', 'position'));
    expect(s).toMatchObject({ phase: 'running', index: 0 });
    expect(canCompare(s)).toBe(false);
    s = answer(s, 3);
    expect(canCompare(s)).toBe(false);
    s = answer(s, 1);
    expect(s.answers).toEqual([0, 0]);
    expect(canCompare(s)).toBe(true);
    s = answer(s, 3);
    expect(s.answers).toEqual([0, 0, 1]);
    const sym = answer(answer(startBlock(newBlock(1, 'n1', 'symbol')), 0), 3);
    expect(sym.answers).toEqual([0, 2]);
    const dual = answer(answer(startBlock(newBlock(1, 'n1', 'dual')), 0), 3);
    expect(dual.answers).toEqual([0, 3]);
  });

  it('finishes after the last item and then ignores answers', () => {
    const { state, states } = play(9, 'n3', 'position', () => 1);
    expect(state.phase).toBe('finished');
    expect(state.index).toBe(23);
    expect(state.answers).toHaveLength(23);
    expect(states).toHaveLength(24);
    expect(states[states.length - 2]?.phase).toBe('running');
    expect(answer(state, 1)).toBe(state);
    const ready = newBlock(1, 'n1');
    expect(answer(ready, 1)).toBe(ready);
    expect(canCompare(state)).toBe(false);
  });

  it('toggles pending dual claims only where they can apply and clears them on answer', () => {
    let s = startBlock(newBlock(2, 'n1', 'dual'));
    expect(togglePending(s, POSITION_BIT)).toBe(s); // lead-in
    s = answer(s, 0);
    s = togglePending(s, POSITION_BIT);
    expect(s.pending).toBe(1);
    s = togglePending(s, SYMBOL_BIT);
    expect(s.pending).toBe(3);
    s = togglePending(s, POSITION_BIT);
    expect(s.pending).toBe(2);
    expect(togglePending(s, 3)).toBe(s);
    expect(togglePending(s, 4)).toBe(s);
    s = answer(s, s.pending);
    expect(s.answers).toEqual([0, 2]);
    expect(s.pending).toBe(0);
    const single = answer(startBlock(newBlock(2, 'n1', 'position')), 0);
    expect(togglePending(single, SYMBOL_BIT)).toBe(single);
    expect(togglePending(single, POSITION_BIT).pending).toBe(1);
    expect(togglePending(newBlock(2, 'n1', 'dual'), POSITION_BIT).pending).toBe(0);
  });

  it('keeps every intermediate state valid', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, variantArb, fc.array(fc.integer({ min: 0, max: 3 }), { minLength: 23, maxLength: 23 }), (seed, d, v, claims) => {
        const { states } = play(seed, d, v, (i) => claims[i] ?? 0);
        for (const s of states) expect(isValidNBackState(clone(s))).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

describe('scoring', () => {
  it('matches an independent oracle for random answers', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, variantArb, fc.array(fc.integer({ min: 0, max: 3 }), { minLength: 23, maxLength: 23 }), fc.integer({ min: 0, max: 23 }), (seed, d, v, claims, stop) => {
        let state = startBlock(newBlock(seed, d, v));
        while (state.phase === 'running' && state.index < stop) state = answer(state, claims[state.index] ?? 0);
        const block = generateBlock(seed, d);
        const n = nOf(d);
        const score = scoreBlock(state, block);
        const pos = oracle(positionsOf(block), state.answers.map((a) => (a & 1) === 1), n);
        const sym = oracle(symbolsOf(block), state.answers.map((a) => (a & 2) === 2), n);
        expect(score.position).toEqual(v === 'symbol' ? undefined : pos);
        expect(score.symbol).toEqual(v === 'position' ? undefined : sym);
        const parts = [v === 'symbol' ? undefined : pos, v === 'position' ? undefined : sym].filter((x) => x !== undefined);
        const total = parts.reduce(
          (acc, p) => ({
            targets: acc.targets + p.targets,
            hits: acc.hits + p.hits,
            misses: acc.misses + p.misses,
            falseAlarms: acc.falseAlarms + p.falseAlarms,
            correctRejections: acc.correctRejections + p.correctRejections
          }),
          { targets: 0, hits: 0, misses: 0, falseAlarms: 0, correctRejections: 0 }
        );
        expect(score.total).toEqual(total);
        expect(total.hits + total.misses + total.falseAlarms + total.correctRejections).toBe(Math.max(0, state.index - n) * parts.length);
      }),
      { numRuns: 200 }
    );
  });

  it('scores a perfect and an always-"no match" block exactly', () => {
    const seed = 77;
    const block = generateBlock(seed, 'n2');
    const perfect = play(seed, 'n2', 'dual', (i) => matchMask(block, i, 2)).state;
    const s = scoreBlock(perfect, block);
    expect(s.position).toEqual({ targets: 6, hits: 6, misses: 0, falseAlarms: 0, correctRejections: 14 });
    expect(s.symbol).toEqual({ targets: 6, hits: 6, misses: 0, falseAlarms: 0, correctRejections: 14 });
    expect(s.total).toEqual({ targets: 12, hits: 12, misses: 0, falseAlarms: 0, correctRejections: 28 });
    const passive = play(seed, 'n2', 'position', () => 0).state;
    expect(scoreBlock(passive, block)).toEqual({ position: { targets: 6, hits: 0, misses: 6, falseAlarms: 0, correctRejections: 14 }, total: { targets: 6, hits: 0, misses: 6, falseAlarms: 0, correctRejections: 14 } });
    const always = play(seed, 'n2', 'symbol', () => 3).state;
    expect(scoreBlock(always, block)).toEqual({ symbol: { targets: 6, hits: 6, misses: 0, falseAlarms: 14, correctRejections: 0 }, total: { targets: 6, hits: 6, misses: 0, falseAlarms: 14, correctRejections: 0 } });
  });

  it('scores a hand-made stream', () => {
    // n = 1: items 1..4 are scored; matches at 2 and 4.
    const values = [0, 1, 1, 2, 2];
    expect(scoreStream(values, [0, 1, 1, 0, 0], 1, 1)).toEqual({ targets: 2, hits: 1, misses: 1, falseAlarms: 1, correctRejections: 1 });
    expect(scoreStream(values, [0, 0, 2, 0], 2, 1)).toEqual({ targets: 1, hits: 1, misses: 0, falseAlarms: 0, correctRejections: 2 });
    expect(scoreStream(values, [0], 1, 1)).toEqual({ targets: 0, hits: 0, misses: 0, falseAlarms: 0, correctRejections: 0 });
  });
});

describe('d′', () => {
  it('inverts the standard normal CDF at known quantiles', () => {
    expect(inverseNormal(0.5)).toBeCloseTo(0, 9);
    expect(inverseNormal(0.975)).toBeCloseTo(1.959964, 6);
    expect(inverseNormal(0.025)).toBeCloseTo(-1.959964, 6);
    expect(inverseNormal(0.01)).toBeCloseTo(-2.326348, 6);
    expect(inverseNormal(0.999)).toBeCloseTo(3.090232, 6);
    expect(inverseNormal(0.02)).toBeCloseTo(-2.053749, 6);
    expect(inverseNormal(0.98)).toBeCloseTo(2.053749, 6);
    expect(inverseNormal(0.8413447)).toBeCloseTo(1, 5);
    expect(inverseNormal(0.3)).toBeCloseTo(-0.5244005, 6);
    expect(inverseNormal(0)).toBe(-Infinity);
    expect(inverseNormal(1)).toBe(Infinity);
    expect(inverseNormal(-0.5)).toBe(-Infinity);
    expect(inverseNormal(2)).toBe(Infinity);
  });

  it('is antisymmetric and increasing', () => {
    fc.assert(
      fc.property(fc.double({ min: 0.0001, max: 0.4999, noNaN: true }), fc.double({ min: 0.0001, max: 0.4999, noNaN: true }), (p, q) => {
        expect(inverseNormal(p) + inverseNormal(1 - p)).toBeCloseTo(0, 6);
        if (q - p > 1e-9) expect(inverseNormal(p)).toBeLessThan(inverseNormal(q));
      })
    );
  });

  it('is 0 at chance, positive when matches are told apart and uses the log-linear correction', () => {
    expect(dPrime({ targets: 6, hits: 3, misses: 3, falseAlarms: 7, correctRejections: 7 })).toBe(0);
    // H = 6.5 / 7, F = 0.5 / 15
    expect(dPrime({ targets: 6, hits: 6, misses: 0, falseAlarms: 0, correctRejections: 14 })).toBe(3.3);
    expect(dPrime({ targets: 6, hits: 0, misses: 6, falseAlarms: 14, correctRejections: 0 })).toBe(-3.3);
    // H = 4.5 / 7, F = 2.5 / 15
    expect(dPrime({ targets: 6, hits: 4, misses: 2, falseAlarms: 2, correctRejections: 12 })).toBe(1.33);
    expect(dPrime({ targets: 0, hits: 0, misses: 0, falseAlarms: 0, correctRejections: 0 })).toBe(0);
  });
});

describe('isValidNBackState', () => {
  const running = () => {
    let s = startBlock(newBlock(4, 'n2', 'dual', 'timed'));
    s = answer(answer(s, 0), 0);
    s = answer(s, 3);
    return togglePending(s, POSITION_BIT);
  };

  it('accepts ready, running and finished states', () => {
    expect(isValidNBackState(newBlock(1, 'n1'))).toBe(true);
    expect(isValidNBackState(running())).toBe(true);
    expect(isValidNBackState(play(1, 'n1', 'symbol', () => 2).state)).toBe(true);
  });

  it('rejects inconsistent or malformed data', () => {
    const base = running();
    const bad: unknown[] = [
      null,
      [],
      { ...base, seed: -1 },
      { ...base, seed: 2 ** 32 },
      { ...base, difficulty: 'n4' },
      { ...base, variant: 'letters' },
      { ...base, pace: 'fast' },
      { ...base, phase: 'paused' },
      { ...base, index: 2 },
      { ...base, index: -1 },
      { ...base, index: 1.5 },
      { ...base, answers: [0, 0, 3, 0] },
      { ...base, answers: [0, 0, 4] },
      { ...base, answers: [0, 0, -1] },
      { ...base, answers: [0, 0, '3'] },
      { ...base, answers: 'x' },
      { ...base, answers: [1, 0, 3] },
      { ...base, answers: [0, 2, 3] },
      { ...base, pending: 4 },
      { ...base, pending: 0.5 },
      { ...base, pending: undefined },
      { ...base, variant: 'position' },
      { ...base, variant: 'position', answers: [0, 0, 1], pending: 2 },
      { ...base, phase: 'ready' },
      { ...base, phase: 'finished' },
      { ...newBlock(1, 'n1'), pending: 1 },
      { ...newBlock(1, 'n1'), index: 1, answers: [0] },
      { ...play(1, 'n1', 'dual', () => 0).state, pending: 1 },
      { ...play(1, 'n1', 'dual', () => 0).state, phase: 'running' },
      { ...startBlock(newBlock(1, 'n3', 'dual')), pending: 1 }
    ];
    for (const value of bad) expect(isValidNBackState(value), JSON.stringify(value)).toBe(false);
    const { seed: _seed, ...missing } = base;
    expect(isValidNBackState(missing)).toBe(false);
  });

  it('accepts a running state exactly up to the last item', () => {
    let s = startBlock(newBlock(1, 'n1', 'position'));
    while (s.index < blockLength('n1') - 1) s = answer(s, 0);
    expect(isValidNBackState(s)).toBe(true);
    expect(isValidNBackState({ ...s, index: s.index + 1, answers: [...s.answers, 0] })).toBe(false);
    expect(PACES).toEqual(['self', 'timed']);
  });

  it('never throws on arbitrary input', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(() => isValidNBackState(value)).not.toThrow();
      }),
      { numRuns: 300 }
    );
  });
});
