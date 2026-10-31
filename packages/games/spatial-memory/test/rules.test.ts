import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng, createRngFromState } from '@wp/game-core';
import { metadata } from '../src/metadata';
import {
  beginRecall,
  canSubmit,
  cellMarks,
  countHits,
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  expectedCells,
  generatePattern,
  gridSide,
  isRecallCorrect,
  isValidPatternState,
  MAX_SIDE,
  MAX_SIZE,
  MIN_SIDE,
  MIN_SIZE,
  newSession,
  nextRound,
  nextSize,
  PHASES,
  PRESENTATIONS,
  rotateCell,
  ROUNDS,
  setPresentation,
  sizeSchedule,
  START_SIZE,
  submit,
  summarize,
  toDifficulty,
  toggleCell,
  toPresentation,
  upcomingSize,
  type Difficulty,
  type PatternState
} from '../src/rules';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const expectedOf = (state: PatternState) => expectedCells(state.pattern, gridSide(state.size), state.difficulty);

/** Marks `cells` one by one. */
const mark = (state: PatternState, cells: readonly number[]) => cells.reduce((s, cell) => toggleCell(s, cell), state);

/** A wrong but well-formed answer: the expected cells with the first one replaced by a non-expected cell. */
const wrongAnswer = (state: PatternState) => {
  const expected = expectedOf(state);
  const outsider = Array.from({ length: gridSide(state.size) ** 2 }, (_, i) => i).find((c) => !expected.includes(c)) as number;
  return [outsider, ...expected.slice(1)];
};

/** Plays one round from "showing" to its evaluation. */
const playRound = (state: PatternState, correct: boolean) => {
  const recalling = beginRecall(state);
  return submit(mark(recalling, correct ? expectedOf(recalling) : wrongAnswer(recalling)));
};

/** Plays a whole session; returns every intermediate state. */
const playSession = (seed: number, difficulty: Difficulty, answers: readonly boolean[]) => {
  const states: PatternState[] = [];
  let state = newSession(seed, difficulty, 'step');
  states.push(state);
  answers.forEach((correct, i) => {
    state = playRound(state, correct);
    states.push(state);
    if (i < answers.length - 1) {
      state = nextRound(state);
      states.push(state);
    }
  });
  return { state, states };
};

/** Independent oracle for the staircase. */
const oracleSizes = (answers: readonly boolean[]) => {
  const sizes: number[] = [];
  let size = 3;
  for (const correct of answers) {
    sizes.push(size);
    if (correct && size < 16) size += 1;
    if (!correct && size > 2) size -= 1;
  }
  sizes.push(size);
  return sizes;
};

/** Independent oracle for the clockwise quarter turn, via (x, y) coordinates. */
const oracleRotate = (cell: number, side: number) => {
  const x = cell % side;
  const y = Math.floor(cell / side);
  // Clockwise in screen coordinates (y grows downwards): (x, y) → (side − 1 − y, x).
  const nx = side - 1 - y;
  const ny = x;
  return ny * side + nx;
};

const answersArb = fc.array(fc.boolean(), { minLength: ROUNDS, maxLength: ROUNDS });
const seedArb = fc.integer({ min: 0, max: 0xffff_ffff });
const difficultyArb = fc.constantFrom(...DIFFICULTIES);
const sizeArb = fc.integer({ min: MIN_SIZE, max: MAX_SIZE });

describe('configuration', () => {
  it('uses 10 rounds, a 3-cell start within 2..16 and 4×4..6×6 grids', () => {
    expect([ROUNDS, START_SIZE, MIN_SIZE, MAX_SIZE, MIN_SIDE, MAX_SIDE]).toEqual([10, 3, 2, 16, 4, 6]);
    expect(PHASES).toEqual(['showing', 'recalling', 'feedback', 'finished']);
    expect(PRESENTATIONS).toEqual(['auto', 'step']);
  });

  it('matches metadata difficulties (easy → hard)', () => {
    expect(metadata.difficulties).toEqual([...DIFFICULTIES]);
    expect(DIFFICULTIES).toEqual(['standard', 'rotated']);
    expect(DEFAULT_DIFFICULTY).toBe('standard');
    expect(metadata.skills).toEqual(['memory', 'spatial']);
  });

  it('maps unknown option values to defaults', () => {
    expect(toDifficulty('rotated')).toBe('rotated');
    expect(toDifficulty('standard')).toBe('standard');
    expect(toDifficulty('mirrored')).toBe('standard');
    expect(toDifficulty(undefined)).toBe('standard');
    expect(toPresentation('auto', 'step')).toBe('auto');
    expect(toPresentation('step', 'auto')).toBe('step');
    expect(toPresentation('fast', 'step')).toBe('step');
    expect(toPresentation(undefined, 'auto')).toBe('auto');
  });

  it('grows the grid with the pattern size', () => {
    expect([2, 3, 4, 5].map(gridSide)).toEqual([4, 4, 4, 4]);
    expect([6, 7, 8, 9, 10].map(gridSide)).toEqual([5, 5, 5, 5, 5]);
    expect([11, 12, 15, 16].map(gridSide)).toEqual([6, 6, 6, 6]);
    for (let size = MIN_SIZE; size <= MAX_SIZE; size++) {
      const side = gridSide(size);
      expect(side >= MIN_SIDE && side <= MAX_SIDE).toBe(true);
      // Never more than about half of the grid is part of the pattern.
      expect(size / side ** 2).toBeLessThanOrEqual(0.45);
      if (size > MIN_SIZE) expect(side).toBeGreaterThanOrEqual(gridSide(size - 1));
    }
  });
});

describe('staircase', () => {
  it('goes one up after a correct answer and one down after a mistake', () => {
    expect(nextSize(3, true)).toBe(4);
    expect(nextSize(3, false)).toBe(2);
    expect(nextSize(10, false)).toBe(9);
    expect(nextSize(15, true)).toBe(16);
  });

  it('stays within 2..16', () => {
    expect(nextSize(2, false)).toBe(2);
    expect(nextSize(16, true)).toBe(16);
    expect(nextSize(2, true)).toBe(3);
    expect(nextSize(16, false)).toBe(15);
  });

  it('schedules sizes from the start size', () => {
    expect(sizeSchedule([])).toEqual([3]);
    expect(sizeSchedule([true, true, false, false, false, false])).toEqual([3, 4, 5, 4, 3, 2, 2]);
    expect(sizeSchedule(Array<boolean>(15).fill(true))).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 16, 16]);
  });

  it('property: bounded, step size ≤ 1, in the direction of the answer, equal to an oracle', () => {
    fc.assert(
      fc.property(fc.array(fc.boolean(), { maxLength: 40 }), (answers) => {
        const sizes = sizeSchedule(answers);
        expect(sizes).toEqual(oracleSizes(answers));
        expect(sizes).toHaveLength(answers.length + 1);
        expect(sizes[0]).toBe(START_SIZE);
        for (const size of sizes) expect(size >= MIN_SIZE && size <= MAX_SIZE).toBe(true);
        answers.forEach((correct, i) => {
          const before = sizes[i] as number;
          const after = sizes[i + 1] as number;
          if (correct) expect(after).toBe(before === MAX_SIZE ? MAX_SIZE : before + 1);
          else expect(after).toBe(before === MIN_SIZE ? MIN_SIZE : before - 1);
        });
      })
    );
  });

  it('property: more correct answers never lead to a smaller final size', () => {
    fc.assert(
      fc.property(fc.array(fc.boolean(), { minLength: 1, maxLength: 20 }), fc.nat(), (answers, index) => {
        const i = index % answers.length;
        const better = answers.map((a, j) => (j === i ? true : a));
        const last = (a: boolean[]) => sizeSchedule(a)[a.length] as number;
        expect(last(better)).toBeGreaterThanOrEqual(last(answers));
      })
    );
  });
});

describe('pattern generation', () => {
  it('rejects sizes outside 2..16', () => {
    const rng = createRng(1);
    expect(() => generatePattern(rng, 1)).toThrow(RangeError);
    expect(() => generatePattern(rng, 1)).toThrow('size must be 2..16');
    expect(() => generatePattern(rng, 17)).toThrow(RangeError);
    expect(() => generatePattern(rng, 2.5)).toThrow(RangeError);
    expect(generatePattern(createRng(1), 2)).toHaveLength(2);
    expect(generatePattern(createRng(1), 16)).toHaveLength(16);
  });

  it('property: distinct cells within the grid, ascending, deterministic per rng state', () => {
    fc.assert(
      fc.property(seedArb, sizeArb, (seed, size) => {
        const a = generatePattern(createRng(seed), size);
        const b = generatePattern(createRng(seed), size);
        expect(a).toEqual(b);
        expect(a).toHaveLength(size);
        expect(new Set(a).size).toBe(size);
        const cells = gridSide(size) ** 2;
        for (const cell of a) expect(Number.isInteger(cell) && cell >= 0 && cell < cells).toBe(true);
        expect(a).toEqual([...a].sort((x, y) => x - y));
      })
    );
  });

  it('uses every cell of the grid (including the last one) across seeds', () => {
    const seen4 = new Set(Array.from({ length: 300 }, (_, seed) => generatePattern(createRng(seed), 3)).flat());
    expect([...seen4].sort((a, b) => a - b)).toEqual(Array.from({ length: 16 }, (_, i) => i));
    const seen6 = new Set(Array.from({ length: 100 }, (_, seed) => generatePattern(createRng(seed), 16)).flat());
    expect(seen6.size).toBe(36);
    const seen5 = new Set(Array.from({ length: 100 }, (_, seed) => generatePattern(createRng(seed), 6)).flat());
    expect(seen5.size).toBe(25);
  });

  it('advances the rng, and different seeds give different patterns', () => {
    const rng = createRng(5);
    const before = rng.state();
    generatePattern(rng, 3);
    expect(rng.state()).not.toBe(before);
    expect(generatePattern(createRng(1), 8)).not.toEqual(generatePattern(createRng(2), 8));
  });
});

describe('rotation', () => {
  it('turns a 4×4 grid a quarter turn clockwise', () => {
    // Corners: top left → top right → bottom right → bottom left → top left.
    expect([0, 3, 15, 12].map((c) => rotateCell(c, 4))).toEqual([3, 15, 12, 0]);
    // Row 0, column 1 → row 1, column 3.
    expect(rotateCell(1, 4)).toBe(7);
    // Row 1, column 0 → row 0, column 2.
    expect(rotateCell(4, 4)).toBe(2);
    expect(rotateCell(5, 4)).toBe(6);
  });

  it('keeps the centre of an odd grid and moves 5×5 and 6×6 corners clockwise', () => {
    expect(rotateCell(12, 5)).toBe(12);
    expect([0, 4, 24, 20].map((c) => rotateCell(c, 5))).toEqual([4, 24, 20, 0]);
    expect([0, 5, 35, 30].map((c) => rotateCell(c, 6))).toEqual([5, 35, 30, 0]);
    expect(rotateCell(7, 6)).toBe(10); // row 1, column 1 → row 1, column 4
  });

  it('property: matches an oracle, is a bijection and has order 4', () => {
    fc.assert(
      fc.property(fc.integer({ min: MIN_SIDE, max: MAX_SIDE }), fc.nat(), (side, n) => {
        const cell = n % (side * side);
        expect(rotateCell(cell, side)).toBe(oracleRotate(cell, side));
        let c = cell;
        for (let i = 0; i < 4; i++) c = rotateCell(c, side);
        expect(c).toBe(cell);
        const image = new Set(Array.from({ length: side * side }, (_, i) => rotateCell(i, side)));
        expect(image.size).toBe(side * side);
      })
    );
  });

  it('expects the rotated cells in the Rotated variant, sorted, without mutating the pattern', () => {
    const pattern = [0, 1, 4];
    expect(expectedCells(pattern, 4, 'standard')).toEqual([0, 1, 4]);
    expect(expectedCells(pattern, 4, 'standard')).not.toBe(pattern);
    expect(expectedCells(pattern, 4, 'rotated')).toEqual([2, 3, 7]);
    expect(pattern).toEqual([0, 1, 4]);
    expect(expectedCells([3, 15], 4, 'rotated')).toEqual([12, 15]);
  });
});

describe('scoring', () => {
  it('requires exactly the expected set, in any order', () => {
    expect(isRecallCorrect([1, 5, 9], [1, 5, 9])).toBe(true);
    expect(isRecallCorrect([1, 5, 9], [9, 1, 5])).toBe(true);
    expect(isRecallCorrect([1, 5, 9], [1, 5])).toBe(false);
    expect(isRecallCorrect([1, 5, 9], [1, 5, 9, 2])).toBe(false);
    expect(isRecallCorrect([1, 5, 9], [1, 5, 2])).toBe(false);
    expect(isRecallCorrect([1, 5], [])).toBe(false);
  });

  it('counts hits', () => {
    expect(countHits([1, 5, 9], [1, 5, 9])).toBe(3);
    expect(countHits([1, 5, 9], [0, 5, 7])).toBe(1);
    expect(countHits([1, 5, 9], [])).toBe(0);
    expect(countHits([1, 5, 9], [2, 3])).toBe(0);
  });

  it('property: correct exactly when hits equal both sizes', () => {
    fc.assert(
      fc.property(fc.uniqueArray(fc.nat(15), { minLength: 1, maxLength: 8 }), fc.uniqueArray(fc.nat(15), { maxLength: 8 }), (expected, marks) => {
        const hits = countHits(expected, marks);
        expect(hits).toBe(marks.filter((m) => expected.includes(m)).length);
        expect(isRecallCorrect(expected, marks)).toBe(hits === expected.length && marks.length === expected.length);
      })
    );
  });
});

describe('session flow', () => {
  it('starts in "showing" with a seeded 3-cell pattern and persisted rng state', () => {
    const state = newSession(42, 'standard', 'auto');
    const rng = createRng(42);
    expect(state).toEqual({
      seed: 42,
      difficulty: 'standard',
      presentation: 'auto',
      pattern: generatePattern(rng, 3),
      rng: rng.state(),
      round: 0,
      size: 3,
      phase: 'showing',
      marks: [],
      history: []
    });
    expect(newSession(42, 'standard', 'auto')).toEqual(state);
    expect(newSession(43, 'standard', 'auto').pattern).not.toEqual(state.pattern);
    expect(newSession(42, 'rotated', 'step')).toMatchObject({ difficulty: 'rotated', presentation: 'step', pattern: state.pattern });
  });

  it('normalizes the seed to an unsigned 32-bit integer', () => {
    expect(newSession(-1, 'standard', 'step').seed).toBe(0xffff_ffff);
    expect(newSession(3.9, 'standard', 'step').seed).toBe(3);
    expect(isValidPatternState(newSession(-1, 'standard', 'step'))).toBe(true);
  });

  it('switches the presentation mode without touching anything else', () => {
    const state = newSession(1, 'standard', 'auto');
    expect(setPresentation(state, 'step')).toEqual({ ...state, presentation: 'step' });
    expect(state.presentation).toBe('auto');
  });

  it('begins recall only from "showing"', () => {
    const showing = newSession(1, 'standard', 'step');
    const recalling = beginRecall(showing);
    expect(recalling).toEqual({ ...showing, phase: 'recalling', marks: [] });
    expect(beginRecall(recalling)).toBe(recalling);
    const feedback = playRound(showing, true);
    expect(beginRecall(feedback)).toBe(feedback);
  });

  it('toggles cells during recall only, keeping marks sorted, ignoring invalid cells', () => {
    const showing = newSession(9, 'standard', 'step');
    expect(toggleCell(showing, 0)).toBe(showing);
    const recalling = beginRecall(showing);
    for (const bad of [-1, 16, 1.5, Number.NaN]) expect(toggleCell(recalling, bad)).toBe(recalling);
    const a = toggleCell(recalling, 7);
    expect(a.marks).toEqual([7]);
    const b = toggleCell(a, 2);
    expect(b.marks).toEqual([2, 7]);
    expect(toggleCell(b, 7).marks).toEqual([2]);
    expect(toggleCell(toggleCell(b, 7), 2).marks).toEqual([]);
    expect(recalling.marks).toEqual([]);
    expect(toggleCell(recalling, 0).marks).toEqual([0]);
    expect(toggleCell(recalling, 15).marks).toEqual([15]);
  });

  it('caps the marks at the pattern size', () => {
    const recalling = beginRecall(newSession(9, 'standard', 'step'));
    const full = mark(recalling, [0, 1, 2]);
    expect(full.marks).toEqual([0, 1, 2]);
    expect(toggleCell(full, 3)).toBe(full);
    expect(toggleCell(full, 1).marks).toEqual([0, 2]);
  });

  it('submits only while recalling with at least one mark', () => {
    const showing = newSession(3, 'standard', 'step');
    expect(canSubmit(showing)).toBe(false);
    expect(submit(showing)).toBe(showing);
    const recalling = beginRecall(showing);
    expect(canSubmit(recalling)).toBe(false);
    expect(submit(recalling)).toBe(recalling);
    const one = toggleCell(recalling, 0);
    expect(canSubmit(one)).toBe(true);
    const evaluated = submit(one);
    expect(canSubmit(evaluated)).toBe(false);
    expect(submit(evaluated)).toBe(evaluated);
  });

  it('evaluates a correct round, moving to feedback', () => {
    const recalling = beginRecall(newSession(3, 'standard', 'step'));
    const marked = mark(recalling, [...recalling.pattern].reverse());
    const result = submit(marked);
    expect(result).toEqual({ ...recalling, marks: recalling.pattern, phase: 'feedback', history: [{ size: 3, correct: true }] });
    expect(upcomingSize(result)).toBe(4);
  });

  it('evaluates a wrong or incomplete round, moving to feedback', () => {
    const recalling = beginRecall(newSession(3, 'standard', 'step'));
    const wrong = submit(mark(recalling, wrongAnswer(recalling)));
    expect(wrong.phase).toBe('feedback');
    expect(wrong.history).toEqual([{ size: 3, correct: false }]);
    expect(upcomingSize(wrong)).toBe(2);
    const partial = submit(mark(recalling, recalling.pattern.slice(0, 2)));
    expect(partial.history).toEqual([{ size: 3, correct: false }]);
  });

  it('checks the rotated pattern in the Rotated variant', () => {
    const recalling = beginRecall(newSession(11, 'rotated', 'step'));
    const asShown = submit(mark(recalling, recalling.pattern));
    const rotated = submit(mark(recalling, recalling.pattern.map((c) => rotateCell(c, 4))));
    expect(rotated.history).toEqual([{ size: 3, correct: true }]);
    // A pattern can be symmetric under rotation only if it is a union of rotation orbits; seed 11 is not.
    expect(asShown.history).toEqual([{ size: 3, correct: false }]);
  });

  it('starts the next round from feedback with the staircase size and the persisted rng', () => {
    const feedback = playRound(newSession(8, 'standard', 'step'), true);
    const rng = createRngFromState(feedback.rng);
    const expected = generatePattern(rng, 4);
    const next = nextRound(feedback);
    expect(next).toEqual({ ...feedback, round: 1, size: 4, pattern: expected, rng: rng.state(), phase: 'showing', marks: [] });
    expect(nextRound(next)).toBe(next);
    const recalling = beginRecall(next);
    expect(nextRound(recalling)).toBe(recalling);
    const down = nextRound(playRound(newSession(8, 'standard', 'step'), false));
    expect(down.size).toBe(2);
    expect(down.pattern).toHaveLength(2);
  });

  it('finishes after round 10 with a summary', () => {
    const answers = [true, true, false, true, true, true, false, false, true, true];
    const { state } = playSession(77, 'standard', answers);
    expect(state.phase).toBe('finished');
    expect(state.round).toBe(ROUNDS - 1);
    expect(state.history.map((r) => r.size)).toEqual(sizeSchedule(answers).slice(0, ROUNDS));
    expect(summarize(state)).toEqual({ maxSize: 6, correctRounds: 7, rounds: 10 });
    expect(nextRound(state)).toBe(state);
    expect(toggleCell(state, 0)).toBe(state);
  });

  it('enters "finished" exactly on the last submit', () => {
    const { states } = playSession(5, 'standard', Array<boolean>(ROUNDS).fill(false));
    const lastShowing = states[states.length - 2] as PatternState;
    expect(lastShowing.round).toBe(ROUNDS - 1);
    expect(submit(mark(beginRecall(lastShowing), expectedOf(lastShowing))).phase).toBe('finished');
    const ninth = states[states.length - 4] as PatternState;
    expect(ninth.round).toBe(ROUNDS - 2);
    expect(submit(mark(beginRecall(ninth), expectedOf(ninth))).phase).toBe('feedback');
  });

  it('summarizes without any correct round', () => {
    const { state } = playSession(5, 'rotated', Array<boolean>(ROUNDS).fill(false));
    expect(summarize(state)).toEqual({ maxSize: 0, correctRounds: 0, rounds: 10 });
    expect(state.history.map((r) => r.size)).toEqual([3, 2, 2, 2, 2, 2, 2, 2, 2, 2]);
    expect(summarize(newSession(1, 'standard', 'step'))).toEqual({ maxSize: 0, correctRounds: 0, rounds: 0 });
  });

  it('property: whole sessions follow the staircase, stay valid and summarize like an oracle', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, answersArb, (seed, difficulty, answers) => {
        const { state, states } = playSession(seed, difficulty, answers);
        for (const s of states) {
          expect(isValidPatternState(s)).toBe(true);
          expect(s.pattern).toHaveLength(s.size);
        }
        expect(state.phase).toBe('finished');
        expect(state.history).toEqual(answers.map((correct, i) => ({ correct, size: oracleSizes(answers)[i] })));
        const correctSizes = state.history.filter((r) => r.correct).map((r) => r.size);
        expect(summarize(state)).toEqual({ maxSize: correctSizes.length ? Math.max(...correctSizes) : 0, correctRounds: correctSizes.length, rounds: ROUNDS });
        expect(playSession(seed, difficulty, answers).state).toEqual(state);
      }),
      { numRuns: 60 }
    );
  });

  it('property: random command sequences never leave the valid state space', () => {
    const command = fc.oneof(
      fc.record({ kind: fc.constant('tap' as const), cell: fc.integer({ min: -1, max: 36 }) }),
      fc.constant({ kind: 'submit' as const }),
      fc.constant({ kind: 'recall' as const }),
      fc.constant({ kind: 'next' as const })
    );
    fc.assert(
      fc.property(seedArb, difficultyArb, fc.array(command, { maxLength: 150 }), (seed, difficulty, commands) => {
        let state = newSession(seed, difficulty, 'auto');
        for (const c of commands) {
          if (c.kind === 'tap') state = toggleCell(state, c.cell);
          else if (c.kind === 'submit') state = submit(state);
          else if (c.kind === 'recall') state = beginRecall(state);
          else state = nextRound(state);
          expect(isValidPatternState(clone(state))).toBe(true);
          expect(state.marks.length).toBeLessThanOrEqual(state.size);
        }
      }),
      { numRuns: 60 }
    );
  });
});

describe('cell marks', () => {
  it('shows the pattern only while revealed', () => {
    const showing = newSession(4, 'rotated', 'step');
    expect(cellMarks(showing)).toEqual(Array<string>(16).fill('idle'));
    const revealed = cellMarks(showing, true);
    expect(revealed).toHaveLength(16);
    revealed.forEach((m, i) => expect(m).toBe(showing.pattern.includes(i) ? 'shown' : 'idle'));
  });

  it('shows marks while recalling, regardless of `revealed`', () => {
    const recalling = mark(beginRecall(newSession(4, 'standard', 'step')), [0, 15]);
    const marks = cellMarks(recalling, true);
    expect(marks[0]).toBe('marked');
    expect(marks[15]).toBe('marked');
    expect(marks.filter((m) => m !== 'idle')).toHaveLength(2);
  });

  it('shows hits, misses and wrong marks after a round', () => {
    const recalling = beginRecall(newSession(4, 'standard', 'step'));
    const [a, b, c] = recalling.pattern as [number, number, number];
    const outsider = [0, 1, 2, 3, 4].find((x) => !recalling.pattern.includes(x)) as number;
    const evaluated = submit(mark(recalling, [a, outsider]));
    const marks = cellMarks(evaluated);
    expect(marks[a]).toBe('hit');
    expect(marks[b]).toBe('miss');
    expect(marks[c]).toBe('miss');
    expect(marks[outsider]).toBe('wrong');
    expect(marks.filter((m) => m === 'idle')).toHaveLength(12);
  });

  it('marks the rotated cells after a Rotated round', () => {
    const recalling = beginRecall(newSession(4, 'rotated', 'step'));
    const evaluated = submit(mark(recalling, expectedOf(recalling)));
    const marks = cellMarks(evaluated);
    for (const cell of expectedOf(recalling)) expect(marks[cell]).toBe('hit');
    expect(marks.filter((m) => m === 'hit')).toHaveLength(3);
    expect(marks.filter((m) => m !== 'hit' && m !== 'idle')).toHaveLength(0);
  });

  it('uses the grid of the current size (25 and 36 cells)', () => {
    const { states } = playSession(2, 'standard', Array<boolean>(9).fill(true));
    const big = states[states.length - 1] as PatternState;
    expect(big.size).toBe(11);
    expect(cellMarks(big)).toHaveLength(36);
    const mid = states.find((s) => s.size === 6) as PatternState;
    expect(cellMarks(mid)).toHaveLength(25);
  });
});

describe('isValidPatternState', () => {
  const recallingWithMark = () => toggleCell(beginRecall(newSession(21, 'standard', 'step')), 0);
  const feedback = () => playRound(newSession(21, 'standard', 'step'), true);

  it('accepts reachable states', () => {
    expect(isValidPatternState(newSession(21, 'standard', 'step'))).toBe(true);
    expect(isValidPatternState(recallingWithMark())).toBe(true);
    expect(isValidPatternState(feedback())).toBe(true);
    expect(isValidPatternState(nextRound(feedback()))).toBe(true);
  });

  it('rejects junk without throwing', () => {
    for (const junk of [null, undefined, 0, 'x', [], {}, { pattern: 'nope' }]) expect(isValidPatternState(junk)).toBe(false);
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(() => isValidPatternState(value)).not.toThrow();
      }),
      { numRuns: 200 }
    );
  });

  it('rejects field-level corruption', () => {
    const base = recallingWithMark();
    const bad: Partial<Record<keyof PatternState, unknown>>[] = [
      { seed: -1 },
      { seed: 1.5 },
      { difficulty: 'mirrored' },
      { presentation: 'fast' },
      { rng: -1 },
      { rng: base.rng + 1 },
      { round: -1 },
      { round: ROUNDS },
      { size: 1 },
      { size: 17 },
      { size: 4 },
      { phase: 'over' },
      { pattern: base.pattern.slice(1) },
      { pattern: [...base.pattern].reverse() },
      { pattern: [base.pattern[0], base.pattern[0], base.pattern[2]] },
      { pattern: [0, 1, 16] },
      { marks: [16] },
      { marks: [-1] },
      { marks: [1, 0] },
      { marks: [0, 0] },
      { marks: [0, 1, 2, 3] },
      { marks: 'x' },
      { history: [{ size: 3, correct: true }] },
      { history: 'x' }
    ];
    for (const patch of bad) expect(isValidPatternState({ ...base, ...patch }), JSON.stringify(patch)).toBe(false);
    expect(isValidPatternState({ ...base, marks: [0, 1, 2] })).toBe(true);
  });

  it('rejects inconsistent phases and histories', () => {
    const showing = newSession(21, 'standard', 'step');
    expect(isValidPatternState({ ...showing, marks: [0] })).toBe(false);
    expect(isValidPatternState({ ...showing, phase: 'feedback' })).toBe(false);
    expect(isValidPatternState({ ...showing, phase: 'finished' })).toBe(false);
    const fb = feedback();
    expect(isValidPatternState({ ...fb, history: [{ size: 3, correct: false }] })).toBe(false);
    expect(isValidPatternState({ ...fb, history: [{ size: 4, correct: true }] })).toBe(false);
    expect(isValidPatternState({ ...fb, history: [{ size: 3, correct: 'yes' }] })).toBe(false);
    expect(isValidPatternState({ ...fb, phase: 'finished' })).toBe(false);
    expect(isValidPatternState({ ...fb, phase: 'recalling' })).toBe(false);
    expect(isValidPatternState({ ...fb, marks: [] })).toBe(false);
    expect(isValidPatternState({ ...fb, difficulty: 'rotated' })).toBe(false);
    const next = nextRound(fb);
    expect(isValidPatternState({ ...next, size: 2, pattern: next.pattern.slice(0, 2) })).toBe(false);
    const { state } = playSession(21, 'standard', Array<boolean>(ROUNDS).fill(true));
    expect(isValidPatternState(state)).toBe(true);
    expect(isValidPatternState({ ...state, phase: 'feedback' })).toBe(false);
  });

  it('rejects a pattern that does not follow from the seed', () => {
    const base = newSession(21, 'standard', 'step');
    const other = newSession(22, 'standard', 'step');
    expect(isValidPatternState({ ...base, pattern: other.pattern })).toBe(false);
    expect(isValidPatternState({ ...base, seed: 22 })).toBe(false);
    // Sharing only the first cell with the real pattern is not enough.
    const [first] = base.pattern as [number];
    const others = Array.from({ length: 16 }, (_, i) => i).filter((c) => c > first && !base.pattern.includes(c));
    expect(isValidPatternState({ ...base, pattern: [first, others[0], others[1]] })).toBe(false);
  });

  it('rejects malformed history entries and an empty answer after evaluation', () => {
    const fb = feedback();
    for (const entry of [null, 'x', { size: 3 }, { correct: true }, { size: '3', correct: true }, { size: 1, correct: true }, { size: 3, correct: 1 }]) {
      expect(isValidPatternState({ ...fb, history: [entry] }), JSON.stringify(entry)).toBe(false);
    }
    const wrong = playRound(newSession(21, 'standard', 'step'), false);
    expect(isValidPatternState(wrong)).toBe(true);
    expect(isValidPatternState({ ...wrong, marks: [] })).toBe(false);
  });
});
