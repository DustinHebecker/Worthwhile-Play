import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng, createRngFromState } from '@wp/game-core';
import { metadata } from '../src/metadata';
import {
  beginRecall,
  COLUMNS,
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  enterTile,
  expectedAnswer,
  generateSequence,
  isRecallCorrect,
  isValidSequenceState,
  MAX_SPAN,
  MIN_SPAN,
  newSession,
  nextRound,
  nextSpan,
  PHASES,
  PRESENTATIONS,
  ROUNDS,
  setPresentation,
  spanSchedule,
  START_SPAN,
  summarize,
  tileMarks,
  TILES,
  toDifficulty,
  toPresentation,
  undoInput,
  upcomingSpan,
  type Difficulty,
  type SequenceState
} from '../src/rules';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** Enters `tiles` one by one. */
const enter = (state: SequenceState, tiles: readonly number[]) => tiles.reduce((s, tile) => enterTile(s, tile).state, state);

/** A wrong but well-formed answer: the expected order with the first two tiles swapped. */
const wrongAnswer = (state: SequenceState) => {
  const answer = expectedAnswer(state.sequence, state.difficulty);
  [answer[0], answer[1]] = [answer[1] as number, answer[0] as number];
  return answer;
};

/** Plays one round from "showing" to its evaluation. */
const playRound = (state: SequenceState, correct: boolean) => {
  const recalling = beginRecall(state);
  return enter(recalling, correct ? expectedAnswer(recalling.sequence, recalling.difficulty) : wrongAnswer(recalling));
};

/** Plays a whole session; returns every intermediate state. */
const playSession = (seed: number, difficulty: Difficulty, answers: readonly boolean[]) => {
  const states: SequenceState[] = [];
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
const oracleSpans = (answers: readonly boolean[]) => {
  const spans: number[] = [];
  let span = 3;
  for (const correct of answers) {
    spans.push(span);
    if (correct && span < 9) span += 1;
    if (!correct && span > 2) span -= 1;
  }
  spans.push(span);
  return spans;
};

const answersArb = fc.array(fc.boolean(), { minLength: ROUNDS, maxLength: ROUNDS });
const seedArb = fc.integer({ min: 0, max: 0xffff_ffff });
const difficultyArb = fc.constantFrom(...DIFFICULTIES);

describe('configuration', () => {
  it('uses a 3×3 grid, 12 rounds and a 3-tile start within 2..9', () => {
    expect([TILES, COLUMNS, ROUNDS, START_SPAN, MIN_SPAN, MAX_SPAN]).toEqual([9, 3, 12, 3, 2, 9]);
    expect(PHASES).toEqual(['showing', 'recalling', 'feedback', 'finished']);
    expect(PRESENTATIONS).toEqual(['auto', 'step']);
  });

  it('matches metadata difficulties (easy → hard)', () => {
    expect(metadata.difficulties).toEqual([...DIFFICULTIES]);
    expect(DIFFICULTIES).toEqual(['standard', 'backwards']);
    expect(DEFAULT_DIFFICULTY).toBe('standard');
  });

  it('maps unknown option values to defaults', () => {
    expect(toDifficulty('backwards')).toBe('backwards');
    expect(toDifficulty('standard')).toBe('standard');
    expect(toDifficulty('numbers')).toBe('standard');
    expect(toDifficulty(undefined)).toBe('standard');
    expect(toPresentation('auto', 'step')).toBe('auto');
    expect(toPresentation('step', 'auto')).toBe('step');
    expect(toPresentation('fast', 'step')).toBe('step');
    expect(toPresentation(undefined, 'auto')).toBe('auto');
  });
});

describe('staircase', () => {
  it('goes one up after a correct answer and one down after a mistake', () => {
    expect(nextSpan(3, true)).toBe(4);
    expect(nextSpan(3, false)).toBe(2);
    expect(nextSpan(5, false)).toBe(4);
    expect(nextSpan(8, true)).toBe(9);
  });

  it('stays within 2..9', () => {
    expect(nextSpan(2, false)).toBe(2);
    expect(nextSpan(9, true)).toBe(9);
    expect(nextSpan(2, true)).toBe(3);
    expect(nextSpan(9, false)).toBe(8);
  });

  it('schedules spans from the start span', () => {
    expect(spanSchedule([])).toEqual([3]);
    expect(spanSchedule([true, true, false, false, false, false])).toEqual([3, 4, 5, 4, 3, 2, 2]);
    expect(spanSchedule(Array<boolean>(8).fill(true))).toEqual([3, 4, 5, 6, 7, 8, 9, 9, 9]);
  });

  it('property: bounded, step size ≤ 1, monotonic in the direction of the answer, equal to an oracle', () => {
    fc.assert(
      fc.property(fc.array(fc.boolean(), { maxLength: 40 }), (answers) => {
        const spans = spanSchedule(answers);
        expect(spans).toEqual(oracleSpans(answers));
        expect(spans).toHaveLength(answers.length + 1);
        expect(spans[0]).toBe(START_SPAN);
        for (const span of spans) expect(span >= MIN_SPAN && span <= MAX_SPAN).toBe(true);
        answers.forEach((correct, i) => {
          const before = spans[i] as number;
          const after = spans[i + 1] as number;
          if (correct) expect(after).toBe(before === MAX_SPAN ? MAX_SPAN : before + 1);
          else expect(after).toBe(before === MIN_SPAN ? MIN_SPAN : before - 1);
        });
      })
    );
  });

  it('property: more correct answers never lead to a shorter final span', () => {
    fc.assert(
      fc.property(fc.array(fc.boolean(), { minLength: 1, maxLength: 20 }), fc.nat(), (answers, index) => {
        const i = index % answers.length;
        const better = answers.map((a, j) => (j === i ? true : a));
        const last = (a: boolean[]) => spanSchedule(a)[a.length] as number;
        expect(last(better)).toBeGreaterThanOrEqual(last(answers));
      })
    );
  });
});

describe('sequence generation', () => {
  it('rejects spans outside 1..9', () => {
    const rng = createRng(1);
    expect(() => generateSequence(rng, 0)).toThrow(RangeError);
    expect(() => generateSequence(rng, 0)).toThrow('span must be 1..9');
    expect(() => generateSequence(rng, 10)).toThrow(RangeError);
    expect(() => generateSequence(rng, 2.5)).toThrow(RangeError);
    expect(generateSequence(createRng(1), 1)).toHaveLength(1);
    expect(generateSequence(createRng(1), 9)).toHaveLength(9);
  });

  it('property: distinct tiles (hence no immediate repeats), in range, deterministic per rng state', () => {
    fc.assert(
      fc.property(seedArb, fc.integer({ min: 1, max: 9 }), (seed, span) => {
        const a = generateSequence(createRng(seed), span);
        const b = generateSequence(createRng(seed), span);
        expect(a).toEqual(b);
        expect(a).toHaveLength(span);
        expect(new Set(a).size).toBe(span);
        for (const tile of a) expect(Number.isInteger(tile) && tile >= 0 && tile < TILES).toBe(true);
        for (let i = 1; i < a.length; i++) expect(a[i]).not.toBe(a[i - 1]);
      })
    );
  });

  it('a full-length sequence is a permutation, and every tile can come first', () => {
    expect([...generateSequence(createRng(7), 9)].sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    const firsts = new Set(Array.from({ length: 200 }, (_, seed) => generateSequence(createRng(seed), 2)[0]));
    expect(firsts.size).toBe(9);
  });

  it('advances the rng', () => {
    const rng = createRng(5);
    const before = rng.state();
    generateSequence(rng, 3);
    expect(rng.state()).not.toBe(before);
  });
});

describe('answers', () => {
  it('expects the same order, or the reverse order backwards, without mutating the sequence', () => {
    const sequence = [4, 0, 8];
    expect(expectedAnswer(sequence, 'standard')).toEqual([4, 0, 8]);
    expect(expectedAnswer(sequence, 'backwards')).toEqual([8, 0, 4]);
    expect(sequence).toEqual([4, 0, 8]);
    expect(expectedAnswer(sequence, 'standard')).not.toBe(sequence);
  });

  it('checks recall exactly', () => {
    expect(isRecallCorrect([4, 0, 8], [4, 0, 8], 'standard')).toBe(true);
    expect(isRecallCorrect([4, 0, 8], [8, 0, 4], 'standard')).toBe(false);
    expect(isRecallCorrect([4, 0, 8], [8, 0, 4], 'backwards')).toBe(true);
    expect(isRecallCorrect([4, 0, 8], [4, 0, 8], 'backwards')).toBe(false);
    expect(isRecallCorrect([4, 0, 8], [4, 0], 'standard')).toBe(false);
    expect(isRecallCorrect([4, 0, 8], [4, 0, 8, 1], 'standard')).toBe(false);
    expect(isRecallCorrect([4, 0], [4, 1], 'standard')).toBe(false);
    expect(isRecallCorrect([4, 0], [1, 0], 'standard')).toBe(false);
  });
});

describe('session flow', () => {
  it('starts in "showing" with a seeded 3-tile sequence and persisted rng state', () => {
    const state = newSession(42, 'standard', 'auto');
    const rng = createRng(42);
    expect(state).toEqual({
      seed: 42,
      difficulty: 'standard',
      presentation: 'auto',
      sequence: generateSequence(rng, 3),
      rng: rng.state(),
      round: 0,
      span: 3,
      phase: 'showing',
      input: [],
      history: []
    });
    expect(newSession(42, 'standard', 'auto')).toEqual(state);
    expect(newSession(43, 'standard', 'auto').sequence).not.toEqual(state.sequence);
    expect(newSession(42, 'backwards', 'step')).toMatchObject({ difficulty: 'backwards', presentation: 'step', sequence: state.sequence });
  });

  it('normalizes the seed to an unsigned 32-bit integer', () => {
    expect(newSession(-1, 'standard', 'step').seed).toBe(0xffff_ffff);
    expect(newSession(3.9, 'standard', 'step').seed).toBe(3);
    expect(isValidSequenceState(newSession(-1, 'standard', 'step'))).toBe(true);
  });

  it('switches the presentation mode without touching anything else', () => {
    const state = newSession(1, 'standard', 'auto');
    expect(setPresentation(state, 'step')).toEqual({ ...state, presentation: 'step' });
    expect(state.presentation).toBe('auto');
  });

  it('begins recall only from "showing"', () => {
    const showing = newSession(1, 'standard', 'step');
    const recalling = beginRecall(showing);
    expect(recalling).toEqual({ ...showing, phase: 'recalling', input: [] });
    expect(beginRecall(recalling)).toBe(recalling);
    const feedback = playRound(showing, true);
    expect(beginRecall(feedback)).toBe(feedback);
  });

  it('records taps during recall, ignoring other phases, invalid tiles and repeated tiles', () => {
    const showing = newSession(9, 'standard', 'step');
    expect(enterTile(showing, 0)).toEqual({ state: showing, event: { kind: 'ignored' } });
    const recalling = beginRecall(showing);
    for (const bad of [-1, 9, 1.5, Number.NaN]) expect(enterTile(recalling, bad)).toEqual({ state: recalling, event: { kind: 'ignored' } });
    const [first] = recalling.sequence as [number];
    const once = enterTile(recalling, first);
    expect(once.event).toEqual({ kind: 'entered', tile: first, step: 1 });
    expect(once.state).toEqual({ ...recalling, input: [first] });
    expect(enterTile(once.state, first)).toEqual({ state: once.state, event: { kind: 'ignored' } });
    expect(recalling.input).toEqual([]);
  });

  it('accepts tiles 0 and 8 as entries', () => {
    const recalling = { ...beginRecall(newSession(1, 'standard', 'step')) };
    expect(enterTile(recalling, 0).event.kind).not.toBe('ignored');
    expect(enterTile(recalling, 8).event.kind).not.toBe('ignored');
  });

  it('evaluates a correct round, moving to feedback', () => {
    const recalling = beginRecall(newSession(3, 'standard', 'step'));
    const [a, b, c] = recalling.sequence as [number, number, number];
    const partial = enter(recalling, [a, b]);
    const result = enterTile(partial, c);
    expect(result.event).toEqual({ kind: 'completed', tile: c, step: 3, correct: true, finished: false });
    expect(result.state).toEqual({ ...recalling, input: [a, b, c], phase: 'feedback', history: [{ span: 3, correct: true }] });
    expect(upcomingSpan(result.state)).toBe(4);
  });

  it('evaluates a wrong round, moving to feedback', () => {
    const recalling = beginRecall(newSession(3, 'standard', 'step'));
    const answer = wrongAnswer(recalling);
    const result = enterTile(enter(recalling, answer.slice(0, -1)), answer[2] as number);
    expect(result.event).toEqual({ kind: 'completed', tile: answer[2], step: 3, correct: false, finished: false });
    expect(result.state.phase).toBe('feedback');
    expect(result.state.history).toEqual([{ span: 3, correct: false }]);
    expect(upcomingSpan(result.state)).toBe(2);
  });

  it('checks backwards mode in reverse order', () => {
    const recalling = beginRecall(newSession(11, 'backwards', 'step'));
    const forward = enter(recalling, recalling.sequence);
    expect(forward.history).toEqual([{ span: 3, correct: false }]);
    const reversed = enter(recalling, [...recalling.sequence].reverse());
    expect(reversed.history).toEqual([{ span: 3, correct: true }]);
  });

  it('undoes the last tap during recall only', () => {
    const showing = newSession(5, 'standard', 'step');
    expect(undoInput(showing)).toBe(showing);
    const recalling = beginRecall(showing);
    expect(undoInput(recalling)).toBe(recalling);
    const two = enter(recalling, [recalling.sequence[0] as number, recalling.sequence[1] as number]);
    expect(undoInput(two)).toEqual({ ...two, input: [recalling.sequence[0]] });
    const done = playRound(showing, true);
    expect(undoInput(done)).toBe(done);
  });

  it('starts the next round from feedback with the staircase span and the persisted rng', () => {
    const feedback = playRound(newSession(8, 'standard', 'step'), true);
    const rng = createRngFromState(feedback.rng);
    const expected = generateSequence(rng, 4);
    const next = nextRound(feedback);
    expect(next).toEqual({ ...feedback, round: 1, span: 4, sequence: expected, rng: rng.state(), phase: 'showing', input: [] });
    expect(nextRound(next)).toBe(next);
    const recalling = beginRecall(next);
    expect(nextRound(recalling)).toBe(recalling);
    const down = nextRound(playRound(newSession(8, 'standard', 'step'), false));
    expect(down.span).toBe(2);
    expect(down.sequence).toHaveLength(2);
  });

  it('finishes after round 12 with a summary', () => {
    const answers = [true, true, false, true, true, true, false, false, true, true, true, false];
    const { state } = playSession(77, 'standard', answers);
    expect(state.phase).toBe('finished');
    expect(state.round).toBe(ROUNDS - 1);
    expect(state.history.map((r) => r.span)).toEqual(spanSchedule(answers).slice(0, ROUNDS));
    expect(summarize(state)).toEqual({ maxSpan: 7, correctRounds: 8, rounds: 12 });
    expect(nextRound(state)).toBe(state);
    expect(enterTile(state, 0).event).toEqual({ kind: 'ignored' });
  });

  it('reports the finishing event on the last tap of round 12', () => {
    const { states } = playSession(5, 'standard', Array<boolean>(ROUNDS).fill(false));
    const lastShowing = beginRecall(states[states.length - 2] as SequenceState);
    const answer = expectedAnswer(lastShowing.sequence, lastShowing.difficulty);
    const result = enterTile(enter(lastShowing, answer.slice(0, -1)), answer[answer.length - 1] as number);
    expect(result.event).toEqual({ kind: 'completed', tile: answer[answer.length - 1], step: answer.length, correct: true, finished: true });
    expect(result.state.phase).toBe('finished');
  });

  it('summarizes without any correct round', () => {
    const { state } = playSession(5, 'backwards', Array<boolean>(ROUNDS).fill(false));
    expect(summarize(state)).toEqual({ maxSpan: 0, correctRounds: 0, rounds: 12 });
    expect(state.history.every((r) => r.span === (r === state.history[0] ? 3 : 2))).toBe(true);
    expect(summarize(newSession(1, 'standard', 'step'))).toEqual({ maxSpan: 0, correctRounds: 0, rounds: 0 });
  });

  it('property: whole sessions follow the staircase, stay valid and summarize like an oracle', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, answersArb, (seed, difficulty, answers) => {
        const { state, states } = playSession(seed, difficulty, answers);
        for (const s of states) {
          expect(isValidSequenceState(s)).toBe(true);
          expect(s.sequence).toHaveLength(s.span);
        }
        expect(state.phase).toBe('finished');
        expect(state.history).toEqual(answers.map((correct, i) => ({ correct, span: oracleSpans(answers)[i] })));
        const correctSpans = state.history.filter((r) => r.correct).map((r) => r.span);
        expect(summarize(state)).toEqual({ maxSpan: correctSpans.length ? Math.max(...correctSpans) : 0, correctRounds: correctSpans.length, rounds: ROUNDS });
        // Deterministic replay from the seed.
        expect(playSession(seed, difficulty, answers).state).toEqual(state);
      }),
      { numRuns: 60 }
    );
  });

  it('property: random command sequences never leave the valid state space', () => {
    const command = fc.oneof(
      fc.record({ kind: fc.constant('tap' as const), tile: fc.integer({ min: -1, max: 9 }) }),
      fc.constant({ kind: 'undo' as const }),
      fc.constant({ kind: 'recall' as const }),
      fc.constant({ kind: 'next' as const })
    );
    fc.assert(
      fc.property(seedArb, difficultyArb, fc.array(command, { maxLength: 150 }), (seed, difficulty, commands) => {
        let state = newSession(seed, difficulty, 'auto');
        for (const c of commands) {
          const before = state;
          if (c.kind === 'tap') state = enterTile(state, c.tile).state;
          else if (c.kind === 'undo') state = undoInput(state);
          else if (c.kind === 'recall') state = beginRecall(state);
          else state = nextRound(state);
          expect(isValidSequenceState(clone(state))).toBe(true);
          expect(state.history.length).toBeGreaterThanOrEqual(before.history.length);
          expect(state.round).toBeGreaterThanOrEqual(before.round);
        }
      }),
      { numRuns: 80 }
    );
  });
});

describe('tile marks', () => {
  it('lights only the presented tile while showing', () => {
    const state = newSession(2, 'standard', 'step');
    expect(tileMarks(state).every((m) => m.kind === 'idle')).toBe(true);
    const marks = tileMarks(state, 4);
    expect(marks[4]).toEqual({ kind: 'lit' });
    expect(marks.filter((m) => m.kind === 'idle')).toHaveLength(8);
    expect(tileMarks(state, 9).every((m) => m.kind === 'idle')).toBe(true);
    expect(tileMarks(beginRecall(state), 4)[4]).toEqual({ kind: 'idle' });
  });

  it('numbers the entries while recalling', () => {
    const recalling = beginRecall(newSession(2, 'standard', 'step'));
    const marks = tileMarks(enter(recalling, [7, 0]));
    expect(marks[7]).toEqual({ kind: 'entered', step: 1 });
    expect(marks[0]).toEqual({ kind: 'entered', step: 2 });
    expect(marks.filter((m) => m.kind === 'idle')).toHaveLength(7);
  });

  it('shows the correct order with ✓ for matching steps and marks extra entries after a round', () => {
    const base = newSession(2, 'backwards', 'step');
    const state: SequenceState = { ...base, sequence: [1, 4, 6], phase: 'feedback', input: [6, 2, 1], history: [{ span: 3, correct: false }] };
    const marks = tileMarks(state);
    // Backwards: expected order is 6, 4, 1.
    expect(marks[6]).toEqual({ kind: 'ok', step: 1 });
    expect(marks[4]).toEqual({ kind: 'miss', step: 2 });
    expect(marks[1]).toEqual({ kind: 'ok', step: 3 });
    expect(marks[2]).toEqual({ kind: 'extra' });
    expect(marks.filter((m) => m.kind === 'idle')).toHaveLength(5);
    expect(tileMarks({ ...state, phase: 'finished' })).toEqual(marks);
  });
});

describe('isValidSequenceState', () => {
  const recalling = enter(beginRecall(newSession(21, 'standard', 'step')), []);
  const partial = enterTile(recalling, recalling.sequence[0] as number).state;
  const feedback = playRound(newSession(21, 'standard', 'step'), true);
  const second = nextRound(feedback);
  const finished = playSession(21, 'backwards', Array<boolean>(ROUNDS).fill(true)).state;

  it('accepts states reached by play', () => {
    for (const s of [newSession(21, 'standard', 'step'), recalling, partial, feedback, second, finished]) expect(isValidSequenceState(clone(s))).toBe(true);
    expect(isValidSequenceState(newSession(0xffff_ffff, 'backwards', 'auto'))).toBe(true);
  });

  it('rejects non-objects and missing fields', () => {
    for (const junk of [null, undefined, 1, 'x', [], {}, [partial]]) expect(isValidSequenceState(junk)).toBe(false);
    for (const key of Object.keys(partial)) {
      const copy = clone(partial) as unknown as Record<string, unknown>;
      delete copy[key];
      expect(isValidSequenceState(copy), key).toBe(false);
    }
  });

  const corrupt = (base: SequenceState, patch: Record<string, unknown>) => isValidSequenceState({ ...clone(base), ...patch });

  it('rejects wrong field types and ranges', () => {
    expect(corrupt(partial, { seed: -1 })).toBe(false);
    expect(corrupt(partial, { seed: 2 ** 32 })).toBe(false);
    expect(corrupt(partial, { seed: '21' })).toBe(false);
    expect(corrupt(partial, { difficulty: 'numbers' })).toBe(false);
    expect(corrupt(partial, { presentation: 'fast' })).toBe(false);
    expect(corrupt(partial, { rng: -5 })).toBe(false);
    expect(corrupt(partial, { round: -1 })).toBe(false);
    expect(corrupt(partial, { round: ROUNDS })).toBe(false);
    expect(corrupt(partial, { phase: 'paused' })).toBe(false);
    expect(corrupt(partial, { span: 1 })).toBe(false);
    expect(corrupt(partial, { span: 10 })).toBe(false);
    expect(corrupt(partial, { input: [9] })).toBe(false);
    expect(corrupt(partial, { input: [-1] })).toBe(false);
    expect(corrupt(partial, { input: 'x' })).toBe(false);
    expect(corrupt(partial, { sequence: [...partial.sequence.slice(0, 2), 9] })).toBe(false);
    expect(corrupt(feedback, { history: [{ span: 3, correct: 'yes' }] })).toBe(false);
    expect(corrupt(feedback, { history: [{ span: 1, correct: true }] })).toBe(false);
    expect(corrupt(feedback, { history: [null] })).toBe(false);
    expect(corrupt(second, { history: [{ span: 3, correct: 1 }] })).toBe(false);
  });

  it('rejects sequences that are inconsistent with span, seed or rng', () => {
    const [a, b, c] = partial.sequence as [number, number, number];
    expect(corrupt(partial, { sequence: [a, b] })).toBe(false);
    expect(corrupt(partial, { sequence: [a, a, c] })).toBe(false);
    expect(corrupt(partial, { sequence: [c, b, a] })).toBe(false);
    const other = [0, 1, 2, 3, 4, 5, 6, 7, 8].find((tile) => !partial.sequence.includes(tile)) as number;
    expect(corrupt(partial, { sequence: [a, b, other] })).toBe(false);
    expect(corrupt(partial, { rng: (partial.rng + 1) >>> 0 })).toBe(false);
    expect(corrupt(partial, { seed: partial.seed + 1 })).toBe(false);
    expect(corrupt(second, { sequence: feedback.sequence.concat(second.sequence[3] as number), rng: feedback.rng })).toBe(false);
  });

  it('rejects inputs inconsistent with the phase', () => {
    expect(corrupt(partial, { input: [a0(partial), a0(partial)] })).toBe(false);
    expect(corrupt(partial, { input: [...partial.sequence, 8].slice(0, 4) })).toBe(false);
    expect(corrupt(newSession(21, 'standard', 'step'), { input: [partial.sequence[0]] })).toBe(false);
    expect(corrupt(recalling, { input: [...recalling.sequence] })).toBe(false);
    expect(corrupt(feedback, { input: feedback.input.slice(0, 2) })).toBe(false);
    expect(corrupt(finished, { input: finished.input.slice(0, -1) })).toBe(false);
    const wrong = playRound(newSession(21, 'standard', 'step'), false);
    expect(isValidSequenceState(wrong)).toBe(true);
    expect(corrupt(wrong, { input: wrong.input.slice(0, 2) })).toBe(false);
  });

  it('rejects histories inconsistent with round, phase, staircase or the answer', () => {
    expect(corrupt(feedback, { history: [] })).toBe(false);
    expect(corrupt(feedback, { phase: 'recalling' })).toBe(false);
    expect(corrupt(feedback, { history: [{ span: 3, correct: false }] })).toBe(false);
    expect(corrupt(feedback, { history: [{ span: 4, correct: true }] })).toBe(false);
    expect(corrupt(second, { history: [{ span: 3, correct: false }] })).toBe(false);
    expect(corrupt(second, { span: 3 })).toBe(false);
    expect(corrupt(second, { round: 0 })).toBe(false);
    expect(corrupt(second, { round: 2 })).toBe(false);
    expect(corrupt(feedback, { phase: 'finished' })).toBe(false);
    expect(corrupt(finished, { phase: 'feedback' })).toBe(false);
    expect(corrupt(finished, { history: finished.history.slice(1) })).toBe(false);
    // A 13th round would be consistent in every other respect.
    const thirteenth = nextRound({ ...finished, phase: 'feedback' });
    expect(thirteenth.round).toBe(ROUNDS);
    expect(isValidSequenceState(thirteenth)).toBe(false);
    expect(isValidSequenceState({ ...thirteenth, round: ROUNDS - 1 })).toBe(false);
  });

  it('never throws on arbitrary data', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(() => isValidSequenceState(value)).not.toThrow();
        expect(isValidSequenceState(value)).toBe(false);
      }),
      { numRuns: 300 }
    );
  });
});

function a0(state: SequenceState): number {
  return state.sequence[0] as number;
}
