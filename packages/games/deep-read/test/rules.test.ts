import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { TEXTS } from '../src/content/structure';
import {
  DIFFICULTIES,
  PHASES,
  SELF_CHECK_ITEMS,
  SUMMARY_MAX,
  answer,
  clampSummary,
  correctCount,
  createInitialState,
  currentQuestion,
  findText,
  finish,
  finishReading,
  isAnswered,
  isCorrect,
  isDeepReadState,
  lookedBackCount,
  next,
  questionCount,
  restart,
  resultStats,
  selfCheckCount,
  setSummary,
  setTextOpen,
  skipSummary,
  submitSummary,
  textOf,
  textsFor,
  toDifficulty,
  toggleSelfCheck,
  type DeepReadState,
  type Difficulty
} from '../src/rules';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** Seed whose text is `textId` (searches deterministically). */
function seedFor(textId: string): { seed: number; difficulty: Difficulty } {
  const text = findText(textId)!;
  for (let seed = 0; seed < 1000; seed++) if (createInitialState(seed, text.difficulty).textId === textId) return { seed, difficulty: text.difficulty };
  throw new Error(`no seed for ${textId}`);
}

function start(textId = 'city-trees'): DeepReadState {
  const { seed, difficulty } = seedFor(textId);
  return finishReading(createInitialState(seed, difficulty));
}

const goldOf = (s: DeepReadState, i: number) => textOf(s).questions[i]!.gold;
const wrongOf = (s: DeepReadState, i: number) => textOf(s).questions[i]!.options.find((o) => o !== goldOf(s, i))!;

/** Answers every question (gold where `right(i)`), ending in the summary phase. */
function answerAll(s: DeepReadState, right: (i: number) => boolean = () => true): DeepReadState {
  let state = s;
  for (let i = 0; i < questionCount(state); i++) {
    state = answer(state, right(i) ? goldOf(state, i) : wrongOf(state, i));
    state = next(state);
  }
  return state;
}

/** One reachable state per phase (and per feedback/no-feedback in the questions phase). */
function statesAtEveryPhase(textId = 'bees'): Record<string, DeepReadState> {
  const { seed, difficulty } = seedFor(textId);
  const reading = createInitialState(seed, difficulty);
  const asking = finishReading(reading);
  const feedback = answer(setTextOpen(asking, true), goldOf(asking, 0));
  const summary = setSummary(answerAll(asking, (i) => i % 2 === 0), 'Bees dance to share where food is.');
  const compare = toggleSelfCheck(submitSummary(summary), 1);
  const done = finish(toggleSelfCheck(compare, 0));
  const skipped = skipSummary(summary);
  return { reading, asking, feedback, summary, compare, done, skipped };
}

describe('setup', () => {
  it('normalises difficulties and defaults to easy', () => {
    expect(toDifficulty('hard')).toBe('hard');
    expect(toDifficulty('medium')).toBe('medium');
    expect(toDifficulty('easy')).toBe('easy');
    expect(toDifficulty('extreme')).toBe('easy');
    expect(toDifficulty(undefined)).toBe('easy');
    expect(toDifficulty(2)).toBe('easy');
  });

  it('selects texts by difficulty', () => {
    expect(textsFor('easy').map((t) => t.id)).toEqual(['city-trees', 'bees', 'paperback', 'bridges']);
    expect(textsFor('medium').map((t) => t.id)).toEqual(['lighthouse', 'time-zones', 'longitude', 'tree-rings']);
    expect(textsFor('hard').map((t) => t.id)).toEqual(['repair', 'library', 'car-free', 'hiring']);
  });

  it('finds texts by id and rejects unknown ids', () => {
    expect(findText('bees')?.paragraphs).toBe(4);
    expect(findText('nope')).toBeUndefined();
    expect(findText(42)).toBeUndefined();
    expect(() => textOf({ textId: 'nope' })).toThrow(RangeError);
    expect(questionCount({ textId: 'repair' })).toBe(6);
  });

  it('starts in the reading phase with an empty, consistent state', () => {
    const s = createInitialState(7, 'medium');
    expect(s).toEqual({
      seed: 7,
      difficulty: 'medium',
      textId: s.textId,
      phase: 'reading',
      cursor: 0,
      answers: [],
      lookedBack: [],
      textOpen: false,
      peeked: false,
      summary: '',
      selfCheck: [false, false, false]
    });
    expect(['lighthouse', 'time-zones']).toContain(s.textId);
    expect(createInitialState(1).difficulty).toBe('easy');
  });

  it('stores the seed as an unsigned 32-bit integer', () => {
    expect(createInitialState(-1).seed).toBe(0xffffffff);
    expect(isDeepReadState(createInitialState(-1))).toBe(true);
  });

  it('is deterministic and every text of a pool is reachable', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.constantFrom(...DIFFICULTIES), (seed, d) => {
        const a = createInitialState(seed, d);
        expect(createInitialState(seed, d)).toEqual(a);
        expect(findText(a.textId)?.difficulty).toBe(d);
      })
    );
    for (const text of TEXTS) expect(seedFor(text.id).difficulty).toBe(text.difficulty);
  });
});

describe('restart', () => {
  it('returns to the seeded start of the same text', () => {
    const s = setSummary(answerAll(start('library')), 'x');
    const r = restart(s);
    expect(r).toEqual(createInitialState(s.seed, s.difficulty));
    expect(r.textId).toBe('library');
  });

  it('keeps the saved text even when the seed now picks another one (saves from before more texts were added)', () => {
    const s = createInitialState(1, 'easy');
    const other = textsFor('easy').find((t) => t.id !== s.textId)!.id;
    const saved: DeepReadState = { ...answer(finishReading(s), 'a'), textId: other, answers: [] };
    const r = restart(saved);
    expect(r.textId).toBe(other);
    expect(r).toEqual({ ...createInitialState(1, 'easy'), textId: other });
    expect(isDeepReadState(r)).toBe(true);
  });
});

describe('reading → questions', () => {
  it('"done reading" shows the first question with the text closed', () => {
    const s = start('bees');
    expect(s.phase).toBe('questions');
    expect(s.cursor).toBe(0);
    expect(s.textOpen).toBe(false);
    expect(isAnswered(s)).toBe(false);
    expect(currentQuestion(s).id).toBe('q1');
  });

  it('finishReading only acts in the reading phase', () => {
    const s = start();
    expect(finishReading(s)).toBe(s);
  });

  it('ignores every other action while reading', () => {
    const r = createInitialState(3);
    expect(setTextOpen(r, true)).toBe(r);
    expect(answer(r, 'a')).toBe(r);
    expect(next(r)).toBe(r);
    expect(setSummary(r, 'x')).toBe(r);
    expect(submitSummary(r)).toBe(r);
    expect(skipSummary(r)).toBe(r);
    expect(toggleSelfCheck(r, 0)).toBe(r);
    expect(finish(r)).toBe(r);
  });
});

describe('answering questions', () => {
  it('asks the questions in their fixed order, one at a time', () => {
    let s = start('repair');
    const seen: string[] = [];
    while (s.phase === 'questions') {
      seen.push(currentQuestion(s).id);
      s = next(answer(s, 'a'));
    }
    expect(seen).toEqual(['q1', 'q2', 'q3', 'q4', 'q5', 'q6']);
    expect(s.phase).toBe('summary');
  });

  it('records the chosen option and shows feedback until "next"', () => {
    const s = answer(start(), 'b');
    expect(s.answers).toEqual(['b']);
    expect(s.cursor).toBe(0);
    expect(isAnswered(s)).toBe(true);
    const n = next(s);
    expect(n.cursor).toBe(1);
    expect(isAnswered(n)).toBe(false);
  });

  it('does not allow changing or repeating an answer', () => {
    const s = answer(start(), 'b');
    expect(answer(s, 'a')).toBe(s);
    expect(answer(s, 'b')).toBe(s);
  });

  it('rejects options that the question does not have', () => {
    const s = start('city-trees'); // q1 has a, b, c
    expect(answer(s, 'd')).toBe(s);
    expect(answer(s, '')).toBe(s);
    expect(answer(s, 'A')).toBe(s);
    expect(answer(s, 'gold')).toBe(s);
    const lib = start('library'); // q1 has four options
    expect(answer(lib, 'd').answers).toEqual(['d']);
  });

  it('needs an answer before moving on', () => {
    const s = start();
    expect(next(s)).toBe(s);
  });

  it('scores against the gold option', () => {
    let s = start('city-trees'); // gold: a, b, c, b
    s = next(answer(s, 'a'));
    s = next(answer(s, 'a'));
    s = next(answer(s, 'c'));
    s = answer(s, 'c');
    expect(s.answers).toEqual(['a', 'a', 'c', 'c']);
    expect([0, 1, 2, 3].map((i) => isCorrect(s, i))).toEqual([true, false, true, false]);
    expect(correctCount(s)).toBe(2);
    expect(isCorrect(s, 4)).toBe(false);
    expect(isCorrect(s, -1)).toBe(false);
  });

  it('counts a perfect and an all-wrong run', () => {
    expect(correctCount(answerAll(start('library')))).toBe(6);
    expect(correctCount(answerAll(start('library'), () => false))).toBe(0);
  });

  it('moves to the summary step after the last question, closing the text', () => {
    let s = answerAll(start('bees'));
    expect(s.phase).toBe('summary');
    expect(s.cursor).toBe(3);
    expect(s.textOpen).toBe(false);
    expect(s.peeked).toBe(false);
    s = start('bees');
    for (let i = 0; i < 3; i++) s = next(answer(s, 'a'));
    s = answer(setTextOpen(s, true), 'a');
    expect(s.textOpen).toBe(true);
    const after = next(s);
    expect(after.phase).toBe('summary');
    expect(after.textOpen).toBe(false);
    expect(after.peeked).toBe(false);
  });
});

describe('looking back at the text', () => {
  it('marks an answer given with the text open', () => {
    const s = answer(setTextOpen(start(), true), 'a');
    expect(s.lookedBack).toEqual([true]);
    expect(lookedBackCount(s)).toBe(1);
  });

  it('marks an answer when the text was opened and closed again before answering', () => {
    const s = answer(setTextOpen(setTextOpen(start(), true), false), 'a');
    expect(s.textOpen).toBe(false);
    expect(s.lookedBack).toEqual([true]);
  });

  it('does not mark an answer given without opening the text', () => {
    expect(answer(start(), 'a').lookedBack).toEqual([false]);
  });

  it('does not mark when the text is only opened after answering (to see the supporting paragraph)', () => {
    let s = setTextOpen(answer(start(), 'a'), true);
    expect(s.peeked).toBe(false);
    s = setTextOpen(s, false);
    s = answer(next(s), 'a');
    expect(s.lookedBack).toEqual([false, false]);
  });

  it('carries an open text into the next question as looking back', () => {
    let s = setTextOpen(answer(start(), 'a'), true);
    s = next(s);
    expect(s.textOpen).toBe(true);
    expect(s.peeked).toBe(true);
    s = answer(s, 'a');
    expect(s.lookedBack).toEqual([false, true]);
  });

  it('ignores redundant toggles and toggles outside the questions phase', () => {
    const s = start();
    expect(setTextOpen(s, false)).toBe(s);
    const open = setTextOpen(s, true);
    expect(setTextOpen(open, true)).toBe(open);
    const summary = answerAll(start());
    expect(setTextOpen(summary, true)).toBe(summary);
  });

  it('matches an independent oracle for random open/close/answer sequences', () => {
    fc.assert(
      fc.property(fc.array(fc.constantFrom('open', 'close', 'answer', 'next'), { maxLength: 40 }), (actions) => {
        let s = start('library');
        const expected: boolean[] = [];
        let open = false;
        let seen = false;
        for (const action of actions) {
          if (s.phase !== 'questions') break;
          if (action === 'open') {
            s = setTextOpen(s, true);
            if (s.answers.length === s.cursor) seen = true;
            open = true;
          } else if (action === 'close') {
            s = setTextOpen(s, false);
            open = false;
          } else if (action === 'answer') {
            if (s.answers.length === s.cursor) expected.push(seen);
            s = answer(s, 'a');
          } else if (s.answers.length > s.cursor) {
            s = next(s);
            seen = open;
            if (s.phase !== 'questions') open = false;
          }
          expect(s.textOpen).toBe(open);
        }
        expect(s.lookedBack).toEqual(expected);
      })
    );
  });
});

describe('one-sentence summary and self-check', () => {
  it('stores the draft and clamps it to the maximum length', () => {
    const s = answerAll(start());
    expect(setSummary(s, 'Trees cool cities.').summary).toBe('Trees cool cities.');
    const long = 'x'.repeat(SUMMARY_MAX + 10);
    expect(setSummary(s, long).summary).toHaveLength(SUMMARY_MAX);
    expect(clampSummary('x'.repeat(SUMMARY_MAX))).toHaveLength(SUMMARY_MAX);
    expect(clampSummary('abc')).toBe('abc');
    expect(setSummary(s, '')).toBe(s);
  });

  it('needs a non-blank sentence to compare', () => {
    const s = answerAll(start());
    expect(submitSummary(s)).toBe(s);
    expect(submitSummary(setSummary(s, '   \n'))).toEqual(setSummary(s, '   \n'));
    expect(submitSummary(setSummary(s, 'A sentence.')).phase).toBe('compare');
  });

  it('skipping ends the exercise without a sentence', () => {
    const s = skipSummary(setSummary(answerAll(start()), 'half-written'));
    expect(s.phase).toBe('done');
    expect(s.summary).toBe('');
    expect(selfCheckCount(s)).toBe(0);
  });

  it('ticks and unticks self-check items only in the compare phase', () => {
    const summary = setSummary(answerAll(start()), 'A sentence.');
    expect(toggleSelfCheck(summary, 0)).toBe(summary);
    let s = submitSummary(summary);
    s = toggleSelfCheck(s, 2);
    expect(s.selfCheck).toEqual([false, false, true]);
    s = toggleSelfCheck(s, 0);
    expect(s.selfCheck).toEqual([true, false, true]);
    expect(selfCheckCount(s)).toBe(2);
    s = toggleSelfCheck(s, 2);
    expect(s.selfCheck).toEqual([true, false, false]);
    expect(toggleSelfCheck(s, 3)).toBe(s);
    expect(toggleSelfCheck(s, -1)).toBe(s);
    expect(toggleSelfCheck(s, 0.5)).toBe(s);
  });

  it('finishes from the compare phase only and keeps the sentence', () => {
    const summary = setSummary(answerAll(start()), 'A sentence.');
    expect(finish(summary)).toBe(summary);
    const done = finish(submitSummary(summary));
    expect(done.phase).toBe('done');
    expect(done.summary).toBe('A sentence.');
    expect(finish(done)).toBe(done);
    expect(skipSummary(done)).toBe(done);
    expect(setSummary(done, 'changed')).toBe(done);
  });

  it('reports factual stats (self-check is reported, never mixed into the score)', () => {
    let s = start('city-trees');
    // Closing the text before moving on: the next question starts without looking back.
    s = setTextOpen(answer(setTextOpen(s, true), 'a'), false);
    s = next(s);
    s = next(answer(s, 'a'));
    s = next(answer(s, 'c'));
    s = next(answer(s, 'b'));
    s = finish(toggleSelfCheck(submitSummary(setSummary(s, 'x')), 1));
    expect(resultStats(s)).toEqual({ correct: 3, questions: 4, lookedBack: 1, selfCheck: 1 });
  });
});

describe('isDeepReadState', () => {
  it('accepts a reachable state at every phase', () => {
    const states = statesAtEveryPhase();
    expect(Object.values(states).map((s) => s.phase)).toEqual(['reading', 'questions', 'questions', 'summary', 'compare', 'done', 'done']);
    for (const [name, s] of Object.entries(states)) expect(isDeepReadState(clone(s)), name).toBe(true);
    expect(new Set(Object.values(states).map((s) => s.phase))).toEqual(new Set(PHASES));
  });

  it('rejects junk without throwing', () => {
    for (const junk of [null, undefined, 0, 'x', [], {}, { phase: 'reading' }]) expect(isDeepReadState(junk)).toBe(false);
    const evil = { get seed() { throw new Error('boom'); } };
    expect(isDeepReadState(evil)).toBe(false);
    fc.assert(fc.property(fc.anything(), (v) => void expect(isDeepReadState(v)).toBe(false)));
  });

  const base = () => statesAtEveryPhase();
  const variants: Array<[string, keyof ReturnType<typeof statesAtEveryPhase>, (s: Record<string, unknown>) => void]> = [
    ['negative seed', 'reading', (s) => void (s.seed = -1)],
    ['fractional seed', 'reading', (s) => void (s.seed = 1.5)],
    ['huge seed', 'reading', (s) => void (s.seed = 2 ** 32)],
    ['unknown difficulty', 'reading', (s) => void (s.difficulty = 'expert')],
    ['difficulty not matching the text', 'reading', (s) => void (s.difficulty = 'hard')],
    ['unknown text id', 'reading', (s) => void (s.textId = 'moon')],
    ['text id of another type', 'reading', (s) => void (s.textId = 3)],
    ['unknown phase', 'reading', (s) => void (s.phase = 'quiz')],
    ['reading with an answer', 'reading', (s) => void (s.answers = ['a'], s.lookedBack = [false])],
    ['reading with the text open', 'reading', (s) => void (s.textOpen = true)],
    ['reading with peeked', 'reading', (s) => void (s.peeked = true)],
    ['reading with a summary', 'reading', (s) => void (s.summary = 'x')],
    ['reading with a tick', 'reading', (s) => void (s.selfCheck = [true, false, false])],
    ['reading at cursor 1', 'reading', (s) => void (s.cursor = 1)],
    ['negative cursor', 'asking', (s) => void (s.cursor = -1)],
    ['cursor beyond the questions', 'asking', (s) => void (s.cursor = 4)],
    ['fractional cursor', 'asking', (s) => void (s.cursor = 0.5)],
    ['answers not an array', 'asking', (s) => void (s.answers = 'a')],
    ['unknown option id', 'feedback', (s) => void (s.answers = ['z'])],
    ['option id of another type', 'feedback', (s) => void (s.answers = [1])],
    ['option the question lacks', 'feedback', (s) => void (s.answers = ['d'])],
    ['answers ahead of the cursor', 'feedback', (s) => void (s.answers = ['a', 'a'], s.lookedBack = [false, false])],
    ['answers behind the cursor', 'feedback', (s) => void (s.cursor = 2)],
    ['lookedBack length mismatch', 'feedback', (s) => void (s.lookedBack = [])],
    ['lookedBack not boolean', 'feedback', (s) => void (s.lookedBack = [1])],
    ['textOpen not boolean', 'feedback', (s) => void (s.textOpen = 'yes')],
    ['peeked not boolean', 'feedback', (s) => void (s.peeked = 0)],
    ['open text while unanswered without peeked', 'asking', (s) => void (s.textOpen = true, s.peeked = false)],
    ['questions with a summary', 'asking', (s) => void (s.summary = 'x')],
    ['questions with a tick', 'asking', (s) => void (s.selfCheck = [false, true, false])],
    ['summary not a string', 'summary', (s) => void (s.summary = 5)],
    ['summary too long', 'summary', (s) => void (s.summary = 'x'.repeat(SUMMARY_MAX + 1))],
    ['summary with an unanswered question', 'summary', (s) => void ((s.answers as string[]).pop(), (s.lookedBack as boolean[]).pop())],
    ['too many answers', 'summary', (s) => void ((s.answers as string[]).push('a'), (s.lookedBack as boolean[]).push(false))],
    ['summary with a wrong cursor', 'summary', (s) => void (s.cursor = 0)],
    ['summary with the text open', 'summary', (s) => void (s.textOpen = true)],
    ['summary with peeked', 'summary', (s) => void (s.peeked = true)],
    ['summary with a tick', 'summary', (s) => void (s.selfCheck = [true, false, false])],
    ['self-check wrong length', 'compare', (s) => void (s.selfCheck = [true, false])],
    ['self-check not boolean', 'compare', (s) => void (s.selfCheck = [1, 0, 0])],
    ['compare with a blank sentence', 'compare', (s) => void (s.summary = '  ')],
    ['done without a sentence but with ticks', 'done', (s) => void (s.summary = '')],
    ['done with a blank sentence', 'skipped', (s) => void (s.summary = ' ')]
  ];

  it.each(variants)('rejects %s', (_name, phase, mutate) => {
    const s = clone(base()[phase]) as unknown as Record<string, unknown>;
    expect(isDeepReadState(s)).toBe(true);
    mutate(s);
    expect(isDeepReadState(s)).toBe(false);
  });

  it('accepts an open text after answering without peeked (looking at the support)', () => {
    const s = setTextOpen(answer(start(), 'a'), true);
    expect(s.peeked).toBe(false);
    expect(isDeepReadState(clone(s))).toBe(true);
  });

  it('accepts a skipped run and the maximum summary length', () => {
    const states = statesAtEveryPhase();
    expect(isDeepReadState(states.skipped)).toBe(true);
    const s = setSummary(answerAll(start()), 'y'.repeat(SUMMARY_MAX));
    expect(isDeepReadState(s)).toBe(true);
  });
});

describe('random play (property)', () => {
  type Action =
    | { t: 'read' }
    | { t: 'open'; v: boolean }
    | { t: 'answer'; o: string }
    | { t: 'next' }
    | { t: 'write'; s: string }
    | { t: 'submit' }
    | { t: 'skip' }
    | { t: 'tick'; i: number }
    | { t: 'finish' };

  const action: fc.Arbitrary<Action> = fc.oneof(
    fc.constant<Action>({ t: 'read' }),
    fc.boolean().map<Action>((v) => ({ t: 'open', v })),
    fc.constantFrom('a', 'b', 'c', 'd', 'x', '').map<Action>((o) => ({ t: 'answer', o })),
    fc.constant<Action>({ t: 'next' }),
    fc.string({ maxLength: 300 }).map<Action>((s) => ({ t: 'write', s })),
    fc.constant<Action>({ t: 'submit' }),
    fc.constant<Action>({ t: 'skip' }),
    fc.integer({ min: -1, max: 3 }).map<Action>((i) => ({ t: 'tick', i })),
    fc.constant<Action>({ t: 'finish' })
  );

  const apply = (s: DeepReadState, a: Action): DeepReadState => {
    switch (a.t) {
      case 'read': return finishReading(s);
      case 'open': return setTextOpen(s, a.v);
      case 'answer': return answer(s, a.o);
      case 'next': return next(s);
      case 'write': return setSummary(s, a.s);
      case 'submit': return submitSummary(s);
      case 'skip': return skipSummary(s);
      case 'tick': return toggleSelfCheck(s, a.i);
      case 'finish': return finish(s);
    }
  };

  it('always yields valid, JSON-stable states with monotonic progress', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.constantFrom(...DIFFICULTIES), fc.array(action, { maxLength: 60 }), (seed, d, actions) => {
        let s = createInitialState(seed, d);
        const initial = clone(s);
        for (const a of actions) {
          const before = s;
          s = apply(s, a);
          expect(isDeepReadState(s)).toBe(true);
          expect(clone(s)).toEqual(s);
          expect(PHASES.indexOf(s.phase)).toBeGreaterThanOrEqual(PHASES.indexOf(before.phase));
          expect(s.answers.length).toBeGreaterThanOrEqual(before.answers.length);
          expect(s.answers.slice(0, before.answers.length)).toEqual(before.answers);
          expect(s.cursor).toBeGreaterThanOrEqual(before.cursor);
          expect([s.seed, s.difficulty, s.textId]).toEqual([initial.seed, initial.difficulty, initial.textId]);
          expect(correctCount(s)).toBe(s.answers.filter((o, i) => o === textOf(s).questions[i]!.gold).length);
          expect(s.selfCheck).toHaveLength(SELF_CHECK_ITEMS);
          // Pure functions never mutate their input.
          expect(before).toEqual(clone(before));
        }
      }),
      { numRuns: 300 }
    );
  });
});
