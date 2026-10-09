import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { metadata } from '../src/metadata';
import {
  allowsNotThere,
  answerTrial,
  CONFIGS,
  currentTrial,
  DEFAULT_DIFFICULTY,
  differingDimensions,
  DIFFICULTIES,
  DIMENSIONS,
  FILLS,
  generateRound,
  isCorrectOutcome,
  isValidSearchState,
  ITEM_DIAMETER,
  MAX_JITTER,
  MAX_MS,
  median,
  navigate,
  newRound,
  NOT_THERE,
  outcomeOf,
  SHAPES,
  startRound,
  summarize,
  TILTS,
  toDifficulty,
  TRIALS,
  type Difficulty,
  type Features,
  type Round,
  type SearchState,
  type Trial
} from '../src/rules';

const seedArb = fc.integer({ min: 0, max: 0xffff_ffff });
const difficultyArb = fc.constantFrom(...DIFFICULTIES);
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const features = (f: Features): Features => ({ shape: f.shape, fill: f.fill, tilt: f.tilt });
const key = (f: Features) => `${f.shape}/${f.fill}/${f.tilt}`;

/** Plays a whole round; `choose` returns the pick for each board. */
function play(seed: number, difficulty: Difficulty, choose: (trial: Trial, i: number) => number, ms: (i: number) => number | null = () => 1000) {
  const round = generateRound(seed, difficulty);
  let state = startRound(newRound(seed, difficulty));
  const states: SearchState[] = [state];
  for (let i = 0; i < TRIALS; i++) {
    state = answerTrial(state, round, choose(round.trials[i] as Trial, i), ms(i));
    states.push(state);
  }
  return { round, state, states };
}

const perfect = (trial: Trial) => (trial.present ? trial.targetIndex : NOT_THERE);

describe('configuration', () => {
  it('lists the difficulties easy → hard in metadata and rules', () => {
    expect(metadata.difficulties).toEqual([...DIFFICULTIES]);
    expect(DIFFICULTIES).toEqual(['feature', 'conjunction', 'similar']);
    expect(DEFAULT_DIFFICULTY).toBe('feature');
    expect(toDifficulty('similar')).toBe('similar');
    expect(toDifficulty('conjunction')).toBe('conjunction');
    expect(toDifficulty('nope')).toBe('feature');
    expect(toDifficulty(undefined)).toBe('feature');
  });

  it('keeps grids phone-sized, set sizes growing with difficulty, and items inside their cells', () => {
    expect(TRIALS).toBe(12);
    for (const d of DIFFICULTIES) {
      const c = CONFIGS[d];
      expect(c.cols).toBeLessThanOrEqual(5);
      expect(c.setSizes[0]).toBeLessThan(c.setSizes[1]);
      expect(c.setSizes[1]).toBeLessThanOrEqual(c.cols * c.rows);
      expect(TRIALS % c.setSizes.length).toBe(0);
      expect(c.absentPerSize).toBeLessThan(TRIALS / c.setSizes.length);
    }
    expect(CONFIGS.feature.setSizes[1]).toBeLessThan(CONFIGS.conjunction.setSizes[1]);
    expect(CONFIGS.conjunction.setSizes[1]).toBeLessThan(CONFIGS.similar.setSizes[1]);
    expect(ITEM_DIAMETER / 2 + MAX_JITTER).toBeLessThan(50);
    expect(allowsNotThere('feature')).toBe(false);
    expect(allowsNotThere('conjunction')).toBe(true);
    expect(allowsNotThere('similar')).toBe(true);
  });

  it('differingDimensions lists exactly the differing features', () => {
    const a: Features = { shape: 'bar', fill: 'solid', tilt: 'upright' };
    expect(differingDimensions(a, a)).toEqual([]);
    expect(differingDimensions(a, { ...a, fill: 'striped' })).toEqual(['fill']);
    expect(differingDimensions(a, { shape: 'cross', fill: 'outline', tilt: 'tilted' })).toEqual(['shape', 'fill', 'tilt']);
    expect(differingDimensions(a, { ...a, shape: 'triangle', tilt: 'tilted' })).toEqual(['shape', 'tilt']);
  });
});

describe('generateRound', { timeout: 60_000 }, () => {
  it('is deterministic per seed and difficulty, and seeds differ', () => {
    expect(generateRound(5, 'similar')).toEqual(generateRound(5, 'similar'));
    expect(generateRound(5, 'similar')).not.toEqual(generateRound(6, 'similar'));
    expect(generateRound(5, 'feature').difficulty).toBe('feature');
  });

  it('plans 12 boards: each set size on half of them, absent boards only where allowed, always a mix on medium/hard', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, (seed, difficulty) => {
        const round = generateRound(seed, difficulty);
        const config = CONFIGS[difficulty];
        expect(round.trials).toHaveLength(TRIALS);
        for (const size of config.setSizes) {
          const ofSize = round.trials.filter((t) => t.setSize === size);
          expect(ofSize).toHaveLength(TRIALS / 2);
          expect(ofSize.filter((t) => !t.present)).toHaveLength(config.absentPerSize);
        }
        const absent = round.trials.filter((t) => !t.present).length;
        if (difficulty === 'feature') expect(absent).toBe(0);
        else {
          expect(absent).toBeGreaterThan(0);
          expect(absent).toBeLessThan(TRIALS);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('has exactly one target when present (the round target) and none when absent', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, (seed, difficulty) => {
        const round = generateRound(seed, difficulty);
        expect(SHAPES).toContain(round.target.shape);
        expect(FILLS).toContain(round.target.fill);
        expect(TILTS).toContain(round.target.tilt);
        for (const trial of round.trials) {
          expect(trial.items).toHaveLength(trial.setSize);
          const flagged = trial.items.filter((item) => item.target);
          const lookalikes = trial.items.filter((item) => key(item) === key(round.target));
          if (trial.present) {
            expect(flagged).toHaveLength(1);
            expect(lookalikes).toHaveLength(1);
            expect(trial.items[trial.targetIndex]?.target).toBe(true);
            expect(features(trial.items[trial.targetIndex] as Features)).toEqual(round.target);
          } else {
            expect(flagged).toHaveLength(0);
            expect(lookalikes).toHaveLength(0);
            expect(trial.targetIndex).toBe(NOT_THERE);
          }
        }
      }),
      { numRuns: 200 }
    );
  });

  it('places items in distinct grid cells, sorted, with bounded jitter and no overlaps (geometric oracle)', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, (seed, difficulty) => {
        const { cols, rows } = CONFIGS[difficulty];
        for (const trial of generateRound(seed, difficulty).trials) {
          const cells = trial.items.map((item) => item.cell);
          expect(cells).toEqual([...cells].sort((a, b) => a - b));
          expect(new Set(cells).size).toBe(cells.length);
          const circles = trial.items.map((item) => {
            expect(Number.isInteger(item.cell) && item.cell >= 0 && item.cell < cols * rows).toBe(true);
            expect(Math.abs(item.dx)).toBeLessThanOrEqual(MAX_JITTER);
            expect(Math.abs(item.dy)).toBeLessThanOrEqual(MAX_JITTER);
            const col = item.cell % cols;
            const row = Math.floor(item.cell / cols);
            const x = col + 0.5 + item.dx / 100;
            const y = row + 0.5 + item.dy / 100;
            const r = ITEM_DIAMETER / 200;
            // The bounding circle stays inside its own cell.
            expect(x - r).toBeGreaterThanOrEqual(col);
            expect(x + r).toBeLessThanOrEqual(col + 1);
            expect(y - r).toBeGreaterThanOrEqual(row);
            expect(y + r).toBeLessThanOrEqual(row + 1);
            return { x, y, r };
          });
          for (let i = 0; i < circles.length; i++) {
            for (let j = i + 1; j < circles.length; j++) {
              const a = circles[i] as { x: number; y: number; r: number };
              const b = circles[j] as { x: number; y: number; r: number };
              expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(a.r + b.r);
            }
          }
        }
      }),
      { numRuns: 150 }
    );
  });

  it('uses jitter in both directions (not always centred)', () => {
    const items = generateRound(11, 'similar').trials.flatMap((t) => t.items);
    expect(items.some((i) => i.dx < 0)).toBe(true);
    expect(items.some((i) => i.dx > 0)).toBe(true);
    expect(items.some((i) => i.dy < 0)).toBe(true);
    expect(items.some((i) => i.dy > 0)).toBe(true);
    expect(items.some((i) => i.dx === MAX_JITTER || i.dx === -MAX_JITTER || i.dy === MAX_JITTER || i.dy === -MAX_JITTER)).toBe(true);
  });

  it('feature search: identical distractors differing from the target in exactly one feature, each feature equally often', () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        const round = generateRound(seed, 'feature');
        const counts: Record<string, number> = { shape: 0, fill: 0, tilt: 0 };
        for (const trial of round.trials) {
          const distractors = trial.items.filter((item) => !item.target);
          expect(new Set(distractors.map(key)).size).toBe(1);
          const dims = differingDimensions(round.target, distractors[0] as Features);
          expect(dims).toHaveLength(1);
          counts[dims[0] as string]!++;
          // Pop-out: the target's value in that dimension is unique on the board.
          const dim = dims[0] as keyof Features;
          expect(trial.items.filter((item) => item[dim] === round.target[dim])).toHaveLength(1);
        }
        expect(counts).toEqual({ shape: 4, fill: 4, tilt: 4 });
      }),
      { numRuns: 200 }
    );
  });

  it('conjunction search: every distractor shares the shape or the fill (not both), both groups present, same tilt', () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        const round = generateRound(seed, 'conjunction');
        for (const trial of round.trials) {
          const distractors = trial.items.filter((item) => !item.target);
          const groups = new Set<string>();
          for (const d of distractors) {
            const dims = differingDimensions(round.target, d);
            expect(dims).toHaveLength(1);
            expect(['shape', 'fill']).toContain(dims[0]);
            groups.add(dims[0] as string);
          }
          expect(groups.size).toBe(2);
          // Group sizes differ by at most one, and each group is homogeneous.
          const shapeGroup = distractors.filter((d) => d.shape !== round.target.shape);
          const fillGroup = distractors.filter((d) => d.fill !== round.target.fill);
          expect(Math.abs(shapeGroup.length - fillGroup.length)).toBeLessThanOrEqual(1);
          expect(new Set(shapeGroup.map(key)).size).toBe(1);
          expect(new Set(fillGroup.map(key)).size).toBe(1);
          // No single feature identifies the target.
          for (const dim of DIMENSIONS) expect(distractors.some((d) => d[dim] === round.target[dim])).toBe(true);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('similar search: every distractor differs in exactly one feature, all three kinds present', () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        const round = generateRound(seed, 'similar');
        for (const trial of round.trials) {
          const distractors = trial.items.filter((item) => !item.target);
          const counts = new Map<string, number>();
          for (const d of distractors) {
            const dims = differingDimensions(round.target, d);
            expect(dims).toHaveLength(1);
            counts.set(dims[0] as string, (counts.get(dims[0] as string) ?? 0) + 1);
          }
          expect([...counts.keys()].sort()).toEqual(['fill', 'shape', 'tilt']);
          const sizes = [...counts.values()];
          expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
          expect(new Set(distractors.map(key)).size).toBe(3);
          for (const dim of DIMENSIONS) expect(distractors.some((d) => d[dim] === round.target[dim])).toBe(true);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('distributes the target position uniformly over the grid cells', () => {
    for (const difficulty of DIFFICULTIES) {
      const { cols, rows } = CONFIGS[difficulty];
      const counts = new Array<number>(cols * rows).fill(0);
      let total = 0;
      for (let seed = 1; seed <= 1500; seed++) {
        for (const trial of generateRound(seed, difficulty).trials) {
          if (!trial.present) continue;
          counts[(trial.items[trial.targetIndex] as { cell: number }).cell]!++;
          total++;
        }
      }
      const expected = total / counts.length;
      // Chi-square goodness of fit; generous bound (df <= 24, p ≈ 0.0001 at ~56).
      const chi2 = counts.reduce((sum, c) => sum + (c - expected) ** 2 / expected, 0);
      expect(chi2).toBeLessThan(56);
      for (const c of counts) expect(c).toBeGreaterThan(expected * 0.8);
      // The target is also spread over its position in reading order.
      const firsts = generateRound(3, difficulty).trials.filter((t) => t.present).map((t) => t.targetIndex);
      expect(new Set(firsts).size).toBeGreaterThan(1);
    }
  });
});

describe('answers', () => {
  it('ignores answers before the start and after the end', () => {
    const round = generateRound(1, 'conjunction');
    const ready = newRound(1, 'conjunction');
    expect(currentTrial(ready, round)).toBeUndefined();
    expect(answerTrial(ready, round, 0, 100)).toBe(ready);
    const { state } = play(1, 'conjunction', perfect);
    expect(state.phase).toBe('finished');
    expect(currentTrial(state, round)).toBeUndefined();
    expect(answerTrial(state, round, 0, 100)).toBe(state);
  });

  it('newRound and startRound', () => {
    expect(newRound(-1, 'similar')).toEqual({ seed: 0xffff_ffff, difficulty: 'similar', phase: 'ready', answers: [] });
    const started = startRound(newRound(3, 'feature'));
    expect(started).toEqual({ seed: 3, difficulty: 'feature', phase: 'running', answers: [] });
    expect(startRound(started)).toBe(started);
    const round = generateRound(3, 'feature');
    expect(currentTrial(started, round)).toBe(round.trials[0]);
  });

  it('accepts item indices in range, and "Not there" only where boards can lack the target', () => {
    const round = generateRound(9, 'feature');
    const s = startRound(newRound(9, 'feature'));
    const size = round.trials[0]?.setSize as number;
    expect(answerTrial(s, round, NOT_THERE, 5)).toBe(s);
    expect(answerTrial(s, round, size, 5)).toBe(s);
    expect(answerTrial(s, round, -2, 5)).toBe(s);
    expect(answerTrial(s, round, 0.5, 5)).toBe(s);
    expect(answerTrial(s, round, Number.NaN, 5)).toBe(s);
    expect(answerTrial(s, round, size - 1, 5).answers).toEqual([{ pick: size - 1, ms: 5 }]);
    expect(answerTrial(s, round, 0, 5).answers).toEqual([{ pick: 0, ms: 5 }]);
    const r2 = generateRound(9, 'similar');
    const s2 = startRound(newRound(9, 'similar'));
    expect(answerTrial(s2, r2, NOT_THERE, null)).toEqual({ ...s2, answers: [{ pick: NOT_THERE, ms: null }] });
  });

  it('normalizes times: rounded, clamped to [0, MAX_MS], non-finite → null', () => {
    const round = generateRound(2, 'conjunction');
    const s = startRound(newRound(2, 'conjunction'));
    const ms = (value: number | null) => answerTrial(s, round, 0, value).answers[0]?.ms;
    expect(ms(1234.4)).toBe(1234);
    expect(ms(1234.6)).toBe(1235);
    expect(ms(-50)).toBe(0);
    expect(ms(MAX_MS + 1)).toBe(MAX_MS);
    expect(ms(MAX_MS)).toBe(MAX_MS);
    expect(ms(Number.POSITIVE_INFINITY)).toBeNull();
    expect(ms(Number.NaN)).toBeNull();
    expect(ms(null)).toBeNull();
    expect(ms(0)).toBe(0);
  });

  it('advances one board per answer and finishes exactly after the last board', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, (seed, difficulty) => {
        const { states } = play(seed, difficulty, (trial, i) => i % trial.setSize);
        states.slice(1).forEach((s, i) => {
          expect(s.answers).toHaveLength(i + 1);
          expect(s.phase).toBe(i + 1 === TRIALS ? 'finished' : 'running');
          expect(isValidSearchState(clone(s))).toBe(true);
        });
      }),
      { numRuns: 60 }
    );
  });

  it('classifies outcomes', () => {
    const present = { setSize: 3, present: true, items: [], targetIndex: 1 } as unknown as Trial;
    const absent = { setSize: 3, present: false, items: [], targetIndex: NOT_THERE } as unknown as Trial;
    expect(outcomeOf(present, 1)).toBe('found');
    expect(outcomeOf(present, 0)).toBe('wrongItem');
    expect(outcomeOf(present, NOT_THERE)).toBe('missed');
    expect(outcomeOf(absent, NOT_THERE)).toBe('rejected');
    expect(outcomeOf(absent, 0)).toBe('falseFind');
    expect(isCorrectOutcome('found')).toBe(true);
    expect(isCorrectOutcome('rejected')).toBe(true);
    expect(isCorrectOutcome('wrongItem')).toBe(false);
    expect(isCorrectOutcome('missed')).toBe(false);
    expect(isCorrectOutcome('falseFind')).toBe(false);
  });
});

describe('summary', () => {
  it('median', () => {
    expect(median([])).toBeNull();
    expect(median([5])).toBe(5);
    expect(median([9, 1, 5])).toBe(5);
    expect(median([4, 1, 3, 2])).toBe(3); // (2 + 3) / 2 = 2.5 → 3
    expect(median([10, 20])).toBe(15);
    expect(median([1, 2, 100])).toBe(2);
    expect(median([3, 1, 2])).toBe(2);
  });

  it('a perfect round counts every board as correct', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, (seed, difficulty) => {
        const { state, round } = play(seed, difficulty, perfect, () => 800);
        const sum = summarize(state, round);
        expect(sum).toEqual({
          total: TRIALS,
          correct: TRIALS,
          wrongItem: 0,
          missed: 0,
          falseFind: 0,
          medians: [...CONFIGS[difficulty].setSizes].map((setSize) => ({ setSize, ms: 800 }))
        });
      }),
      { numRuns: 40 }
    );
  });

  it('counts each kind of error and takes medians over correct, timed answers only', () => {
    const difficulty: Difficulty = 'conjunction';
    const round = generateRound(21, difficulty);
    // Board i: absent → pick 0 on even boards (false find), "Not there" on odd boards;
    // present → "Not there" on board 0..2 type cases, wrong item or target otherwise.
    let missed = 0;
    let wrong = 0;
    let falseFind = 0;
    let correct = 0;
    const times = new Map<number, number[]>();
    const choose = (trial: Trial, i: number) => {
      let pick: number;
      if (!trial.present) pick = i % 2 === 0 ? 0 : NOT_THERE;
      else if (i % 3 === 0) pick = NOT_THERE;
      else if (i % 3 === 1) pick = (trial.targetIndex + 1) % trial.setSize;
      else pick = trial.targetIndex;
      const outcome = outcomeOf(trial, pick);
      if (outcome === 'missed') missed++;
      if (outcome === 'wrongItem') wrong++;
      if (outcome === 'falseFind') falseFind++;
      if (isCorrectOutcome(outcome)) {
        correct++;
        if (i !== 5) times.set(trial.setSize, [...(times.get(trial.setSize) ?? []), (i + 1) * 100]);
      }
      return pick;
    };
    const { state } = play(21, difficulty, choose, (i) => (i === 5 ? null : (i + 1) * 100));
    const sum = summarize(state, round);
    expect(sum.total).toBe(TRIALS);
    expect(sum.correct).toBe(correct);
    expect(sum.missed).toBe(missed);
    expect(sum.wrongItem).toBe(wrong);
    expect(sum.falseFind).toBe(falseFind);
    expect(missed + wrong + falseFind + correct).toBe(TRIALS);
    expect(missed).toBeGreaterThan(0);
    expect(wrong).toBeGreaterThan(0);
    expect(sum.medians).toEqual([8, 16].map((setSize) => ({ setSize, ms: median(times.get(setSize) ?? []) })));
  });

  it('summarizes a partial round and reports missing times as null', () => {
    const round = generateRound(4, 'similar');
    let state = startRound(newRound(4, 'similar'));
    expect(summarize(state, round)).toEqual({
      total: 0,
      correct: 0,
      wrongItem: 0,
      missed: 0,
      falseFind: 0,
      medians: [
        { setSize: 10, ms: null },
        { setSize: 20, ms: null }
      ]
    });
    const first = round.trials[0] as Trial;
    state = answerTrial(state, round, perfect(first), 1500);
    const sum = summarize(state, round);
    expect(sum.total).toBe(1);
    expect(sum.correct).toBe(1);
    expect(sum.medians.find((m) => m.setSize === first.setSize)?.ms).toBe(1500);
    expect(sum.medians.find((m) => m.setSize !== first.setSize)?.ms).toBeNull();
  });
});

describe('navigate', () => {
  // 4 columns; occupied cells:   row 0: 0, 2   row 1: (none)   row 2: 9, 11   row 3: 12, 15
  const cells = [0, 2, 9, 11, 12, 15];

  it('moves in reading order with prev/next and clamps at the ends', () => {
    expect(navigate(cells, 4, 0, 'next')).toBe(1);
    expect(navigate(cells, 4, 1, 'next')).toBe(2);
    expect(navigate(cells, 4, 5, 'next')).toBe(5);
    expect(navigate(cells, 4, 3, 'prev')).toBe(2);
    expect(navigate(cells, 4, 0, 'prev')).toBe(0);
    expect(navigate(cells, 4, 3, 'first')).toBe(0);
    expect(navigate(cells, 4, 1, 'last')).toBe(5);
  });

  it('moves up/down to the nearest row with items and the closest column (lower on ties)', () => {
    expect(navigate(cells, 4, 0, 'down')).toBe(2); // cell 0 (col 0) → row 2: cells 9 (col 1), 11 (col 3) → 9
    expect(navigate(cells, 4, 1, 'down')).toBe(2); // col 2 → col 1 and col 3 tie → lower column 9
    expect(navigate(cells, 4, 3, 'down')).toBe(5); // cell 11 (col 3) → row 3: 12 (col 0), 15 (col 3) → 15
    expect(navigate(cells, 4, 2, 'down')).toBe(4); // cell 9 (col 1) → 12 (col 0, distance 1) vs 15 (distance 2)
    expect(navigate(cells, 4, 4, 'up')).toBe(2); // cell 12 (col 0) → row 2: 9 (col 1)
    expect(navigate(cells, 4, 5, 'up')).toBe(3);
    expect(navigate(cells, 4, 2, 'up')).toBe(0); // skips the empty row 1; col 1 → 0 (col 0) and 2 (col 2) tie → 0
    expect(navigate(cells, 4, 3, 'up')).toBe(1); // col 3 → cell 2 (col 2)
    expect(navigate(cells, 4, 0, 'up')).toBe(0);
    expect(navigate(cells, 4, 5, 'down')).toBe(5);
  });

  it('handles empty and inconsistent input without throwing', () => {
    expect(navigate([], 4, 0, 'next')).toBe(0);
    expect(navigate([], 4, 0, 'down')).toBe(0);
    expect(navigate([3], 4, 0, 'last')).toBe(0);
    expect(navigate([3], 4, 7, 'down')).toBe(7);
  });

  it('always lands on an item; up/down change the row in the right direction', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, fc.integer({ min: 0, max: TRIALS - 1 }), fc.nat(), (seed, difficulty, t, start) => {
        const { cols } = CONFIGS[difficulty];
        const trial = generateRound(seed, difficulty).trials[t] as Trial;
        const cs = trial.items.map((i) => i.cell);
        const from = start % cs.length;
        const row = (i: number) => Math.floor((cs[i] as number) / cols);
        for (const move of ['prev', 'next', 'up', 'down', 'first', 'last'] as const) {
          const to = navigate(cs, cols, from, move);
          expect(to).toBeGreaterThanOrEqual(0);
          expect(to).toBeLessThan(cs.length);
          if (move === 'up' && to !== from) expect(row(to)).toBeLessThan(row(from));
          if (move === 'down' && to !== from) expect(row(to)).toBeGreaterThan(row(from));
          if (move === 'up' && to === from) expect(cs.some((_, i) => row(i) < row(from))).toBe(false);
          if (move === 'down' && to === from) expect(cs.some((_, i) => row(i) > row(from))).toBe(false);
        }
      }),
      { numRuns: 200 }
    );
  });
});

describe('isValidSearchState', () => {
  const finished = (difficulty: Difficulty = 'similar') => play(13, difficulty, perfect).state;

  it('accepts states reached by play', () => {
    expect(isValidSearchState(newRound(1, 'feature'))).toBe(true);
    expect(isValidSearchState(startRound(newRound(1, 'feature')))).toBe(true);
    expect(isValidSearchState(clone(finished()))).toBe(true);
    expect(isValidSearchState(clone(finished('feature')))).toBe(true);
  });

  it('rejects malformed or inconsistent data', () => {
    const base = clone(finished());
    const round: Round = generateRound(13, 'similar');
    const running = { ...base, phase: 'running', answers: base.answers.slice(0, 3) };
    expect(isValidSearchState(running)).toBe(true);
    const bad: unknown[] = [
      null,
      [],
      { ...base, seed: -1 },
      { ...base, seed: 2 ** 32 },
      { ...base, seed: 1.5 },
      { ...base, difficulty: 'extreme' },
      { ...base, phase: 'done' },
      { ...base, answers: 'x' },
      { ...base, answers: [...base.answers, { pick: 0, ms: 1 }] },
      { ...base, answers: base.answers.slice(1) },
      { ...base, phase: 'running' },
      { ...base, phase: 'ready' },
      { ...base, phase: 'ready', answers: base.answers.slice(0, 1) },
      { ...running, answers: [{ pick: 0 }, ...running.answers.slice(1)] },
      { ...running, answers: [{ pick: 0, ms: -1 }, ...running.answers.slice(1)] },
      { ...running, answers: [{ pick: 0, ms: MAX_MS + 1 }, ...running.answers.slice(1)] },
      { ...running, answers: [{ pick: 0, ms: 1.5 }, ...running.answers.slice(1)] },
      { ...running, answers: [{ pick: -2, ms: 1 }, ...running.answers.slice(1)] },
      { ...running, answers: [{ pick: 0.5, ms: 1 }, ...running.answers.slice(1)] },
      { ...running, answers: [{ pick: round.trials[0]?.setSize, ms: 1 }, ...running.answers.slice(1)] },
      { ...running, answers: [null] },
      { seed: 1, difficulty: 'feature', phase: 'running', answers: [{ pick: NOT_THERE, ms: null }] }
    ];
    for (const value of bad) expect(isValidSearchState(value), JSON.stringify(value)).toBe(false);
    // Boundaries that are fine.
    const lastIndex = (round.trials[0]?.setSize as number) - 1;
    expect(isValidSearchState({ ...running, answers: [{ pick: lastIndex, ms: MAX_MS }, ...running.answers.slice(1)] })).toBe(true);
    expect(isValidSearchState({ ...running, answers: [{ pick: NOT_THERE, ms: 0 }, ...running.answers.slice(1)] })).toBe(true);
    expect(isValidSearchState({ seed: 0xffff_ffff, difficulty: 'conjunction', phase: 'ready', answers: [] })).toBe(true);
  });

  it('never throws on arbitrary input', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(() => isValidSearchState(value)).not.toThrow();
      }),
      { numRuns: 500 }
    );
    fc.assert(
      fc.property(
        fc.record({
          seed: fc.oneof(seedArb, fc.anything()),
          difficulty: fc.oneof(difficultyArb, fc.string()),
          phase: fc.constantFrom('ready', 'running', 'finished', 'x'),
          answers: fc.array(fc.record({ pick: fc.integer({ min: -3, max: 30 }), ms: fc.oneof(fc.constant(null), fc.integer({ min: -5, max: MAX_MS + 5 })) }), { maxLength: 14 })
        }),
        (value) => {
          expect(typeof isValidSearchState(value)).toBe('boolean');
        }
      ),
      { numRuns: 300 }
    );
  });
});
