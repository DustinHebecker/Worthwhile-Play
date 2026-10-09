import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import { FIRST_WORDS } from '@wp/learning-content';
import { metadata } from '../src/metadata';
import {
  answerFiller,
  answerOf,
  answerQuestion,
  answersByPair,
  CATEGORIES,
  categoryOf,
  CONFIGS,
  countOf,
  cueOf,
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  FILLER_MAX_COUNT,
  FILLER_MIN_COUNT,
  FILLER_SHAPES,
  FILLER_SIZE,
  generateFiller,
  generatePairs,
  isItemId,
  isValidAssociationState,
  ITEM_CATEGORIES,
  ITEM_IDS,
  newRound,
  nextPair,
  NOTE_MAX,
  pickDistractors,
  previousPair,
  sanitizeNote,
  score,
  setNote,
  toDifficulty,
  type AssociationState,
  type Difficulty,
  type Question
} from '../src/rules';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const seedArb = fc.integer({ min: 0, max: 0xffff_ffff });
const difficultyArb = fc.constantFrom(...DIFFICULTIES);

/** Advances through learning and the counting breaks (answering each break with `count`). */
function toRecall(state: AssociationState, count = 3): AssociationState {
  let s = state;
  while (s.phase === 'learn') s = nextPair(s);
  while (s.phase === 'filler') s = answerFiller(s, count);
  return s;
}

/** Plays a whole round; `pick(question, i)` returns the chosen option index. */
function play(seed: number, difficulty: Difficulty, pick: (q: Question, i: number, s: AssociationState) => number): AssociationState {
  let s = toRecall(newRound(seed, difficulty));
  while (s.phase === 'recall') {
    const q = s.questions[s.index] as Question;
    s = answerQuestion(s, q.options[pick(q, s.index, s)] as string);
  }
  return s;
}

/** Independent oracle: counts answers equal to the partner of the cue, by scanning pairs. */
function oracleCorrect(s: AssociationState): number {
  let correct = 0;
  for (let i = 0; i < s.answers.length; i++) {
    const q = s.questions[i] as Question;
    const pair = s.pairs[q.pair] as [string, string];
    const shown = q.cueSide === 0 ? pair[0] : pair[1];
    const partner = pair.find((id) => id !== shown);
    if (s.answers[i] === partner) correct++;
  }
  return correct;
}

describe('content', () => {
  it('uses only pictures of the built-in First words deck, each with a category', () => {
    const deckIds = new Set(FIRST_WORDS.map((w) => w.id));
    expect(ITEM_IDS.length).toBe(60);
    for (const id of ITEM_IDS) {
      expect(deckIds.has(id), id).toBe(true);
      expect(CATEGORIES).toContain(ITEM_CATEGORIES[id]);
    }
    expect(new Set(ITEM_IDS).size).toBe(ITEM_IDS.length);
  });

  it('every category has enough members for similar distractors', () => {
    for (const category of CATEGORIES) expect(ITEM_IDS.filter((id) => categoryOf(id) === category).length).toBeGreaterThanOrEqual(8);
  });

  it('isItemId and categoryOf reject unknown and inherited names', () => {
    expect(isItemId('apple')).toBe(true);
    expect(isItemId('toString')).toBe(false);
    expect(isItemId('constructor')).toBe(false);
    expect(isItemId(5)).toBe(false);
    expect(categoryOf('dog')).toBe('animal');
    expect(categoryOf('toString')).toBeUndefined();
  });

  it('metadata difficulties match the rules, easy first', () => {
    expect(metadata.difficulties).toEqual([...DIFFICULTIES]);
    expect(DEFAULT_DIFFICULTY).toBe('easy');
    expect(CONFIGS.easy.pairs).toBeLessThan(CONFIGS.medium.pairs);
    expect(CONFIGS.medium.pairs).toBeLessThan(CONFIGS.hard.pairs);
    expect([CONFIGS.easy.pairs, CONFIGS.medium.pairs, CONFIGS.hard.pairs]).toEqual([5, 8, 12]);
    expect([CONFIGS.easy.fillers, CONFIGS.medium.fillers, CONFIGS.hard.fillers]).toEqual([0, 2, 3]);
    expect([CONFIGS.easy.options, CONFIGS.medium.options, CONFIGS.hard.options]).toEqual([3, 4, 5]);
  });

  it('toDifficulty falls back to easy', () => {
    expect(toDifficulty('hard')).toBe('hard');
    expect(toDifficulty('medium')).toBe('medium');
    expect(toDifficulty('extreme')).toBe('easy');
    expect(toDifficulty(undefined)).toBe('easy');
  });
});

describe('sanitizeNote', () => {
  it('keeps ordinary text, including emoji, RTL text and inner spaces', () => {
    expect(sanitizeNote('the cat  wears the hat 🎩')).toBe('the cat  wears the hat 🎩');
    expect(sanitizeNote('القطة ترتدي القبعة')).toBe('القطة ترتدي القبعة');
    expect(sanitizeNote('')).toBe('');
  });

  it('turns control characters and line breaks into spaces and treats markup as plain text', () => {
    expect(sanitizeNote('a\nb\tc\u0000d\u007fe\u2028f')).toBe('a b c d e f');
    expect(sanitizeNote('<b>x</b>')).toBe('<b>x</b>');
  });

  it('limits the length in code points without splitting characters', () => {
    expect(Array.from(sanitizeNote('x'.repeat(NOTE_MAX + 20)))).toHaveLength(NOTE_MAX);
    expect(sanitizeNote('x'.repeat(NOTE_MAX))).toBe('x'.repeat(NOTE_MAX));
    const emoji = sanitizeNote('🐈'.repeat(NOTE_MAX + 1));
    expect(Array.from(emoji)).toHaveLength(NOTE_MAX);
    expect(emoji).toBe('🐈'.repeat(NOTE_MAX));
  });

  it('returns an empty string for non-strings', () => {
    expect(sanitizeNote(undefined)).toBe('');
    expect(sanitizeNote(42)).toBe('');
  });

  it('is idempotent and never longer than NOTE_MAX (property)', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'binary', maxLength: 300 }), (text) => {
        const once = sanitizeNote(text);
        expect(sanitizeNote(once)).toBe(once);
        expect(Array.from(once).length).toBeLessThanOrEqual(NOTE_MAX);
        expect([...once].some((c) => c.charCodeAt(0) < 0x20 || (c.charCodeAt(0) >= 0x7f && c.charCodeAt(0) <= 0x9f))).toBe(false);
      })
    );
  });
});

describe('generators', () => {
  it('generatePairs draws distinct pictures, two per pair', () => {
    fc.assert(
      fc.property(seedArb, fc.integer({ min: 1, max: 30 }), (seed, count) => {
        const pairs = generatePairs(createRng(seed), count);
        expect(pairs).toHaveLength(count);
        const flat = pairs.flat();
        expect(new Set(flat).size).toBe(count * 2);
        for (const id of flat) expect(isItemId(id)).toBe(true);
      })
    );
    expect(() => generatePairs(createRng(1), 31)).toThrow(RangeError);
  });

  it('generateFiller places the target MIN..MAX times among FILLER_SIZE shapes', () => {
    const counts = new Set<number>();
    fc.assert(
      fc.property(seedArb, (seed) => {
        const round = generateFiller(createRng(seed));
        expect(round.shapes).toHaveLength(FILLER_SIZE);
        expect(FILLER_SHAPES).toContain(round.target);
        for (const shape of round.shapes) expect(FILLER_SHAPES).toContain(shape);
        const count = countOf(round);
        expect(count).toBeGreaterThanOrEqual(FILLER_MIN_COUNT);
        expect(count).toBeLessThanOrEqual(FILLER_MAX_COUNT);
        counts.add(count);
      }),
      { numRuns: 300 }
    );
    // Every count in the range actually occurs.
    expect([...counts].sort()).toEqual([2, 3, 4, 5, 6]);
  });

  it('countOf counts only the target shape', () => {
    expect(countOf({ shapes: ['circle', 'square', 'circle', 'triangle'], target: 'circle' })).toBe(2);
    expect(countOf({ shapes: ['circle', 'square', 'circle', 'triangle'], target: 'triangle' })).toBe(1);
  });

  describe('pickDistractors', () => {
    const pairs: [string, string][] = [
      ['apple', 'dog'],
      ['banana', 'car'],
      ['cat', 'tree'],
      ['pear', 'horse'],
      ['sun', 'book']
    ];

    it('unstudied: only pictures outside the round', () => {
      fc.assert(
        fc.property(seedArb, fc.constantFrom(0, 1) as fc.Arbitrary<0 | 1>, (seed, side) => {
          const picked = pickDistractors(createRng(seed), pairs, 2, side, 'unstudied', 4);
          expect(picked).toHaveLength(4);
          expect(new Set(picked).size).toBe(4);
          for (const id of picked) {
            expect(pairs.flat()).not.toContain(id);
            expect(isItemId(id)).toBe(true);
          }
        })
      );
    });

    it('studied: partners of other pairs on the same side as the answer', () => {
      fc.assert(
        fc.property(seedArb, (seed) => {
          const forward = pickDistractors(createRng(seed), pairs, 1, 0, 'studied', 3);
          expect(new Set(forward).size).toBe(3);
          for (const id of forward) expect(['dog', 'tree', 'horse', 'book']).toContain(id);
          const backward = pickDistractors(createRng(seed), pairs, 1, 1, 'studied', 4);
          expect([...backward].sort()).toEqual(['apple', 'cat', 'pear', 'sun']);
        })
      );
      expect(() => pickDistractors(createRng(1), pairs, 1, 0, 'studied', 5)).toThrow(RangeError);
    });

    it('similar: other studied pictures, same category as the answer first', () => {
      fc.assert(
        fc.property(seedArb, (seed) => {
          // Answer 'horse' (animal): the other animals are dog and cat.
          const picked = pickDistractors(createRng(seed), pairs, 3, 0, 'similar', 4);
          expect(new Set(picked.slice(0, 2))).toEqual(new Set(['dog', 'cat']));
          for (const id of picked) {
            expect(pairs.flat()).toContain(id);
            expect(['pear', 'horse']).not.toContain(id);
          }
          // Answer 'pear' (food), cue 'horse': apple and banana come first.
          const back = pickDistractors(createRng(seed), pairs, 3, 1, 'similar', 3);
          expect(new Set(back.slice(0, 2))).toEqual(new Set(['apple', 'banana']));
          expect(back).not.toContain('horse');
          expect(back).not.toContain('pear');
        })
      );
    });
  });
});

describe('newRound', () => {
  it('is deterministic for a seed and differs between seeds', () => {
    expect(newRound(7, 'hard')).toEqual(newRound(7, 'hard'));
    expect(newRound(7, 'hard').pairs).not.toEqual(newRound(8, 'hard').pairs);
  });

  it('starts at the first pair of learning with empty notes and no answers', () => {
    const s = newRound(0x1_0000_0005, 'medium');
    expect(s).toMatchObject({ seed: 5, difficulty: 'medium', phase: 'learn', index: 0, fillerAnswers: [], answers: [] });
    expect(s.notes).toEqual(Array(8).fill(''));
    expect(s.fillers).toHaveLength(2);
  });

  it('every pair is asked exactly once; options contain the answer, never the cue, all distinct (property)', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, (seed, difficulty) => {
        const s = newRound(seed, difficulty);
        const config = CONFIGS[difficulty];
        expect(isValidAssociationState(s)).toBe(true);
        expect(s.pairs).toHaveLength(config.pairs);
        expect(s.fillers).toHaveLength(config.fillers);
        expect(s.questions.map((q) => q.pair).sort((a, b) => a - b)).toEqual(s.pairs.map((_, i) => i));
        const studied = new Set(s.pairs.flat());
        for (const q of s.questions) {
          const answer = answerOf(s, q);
          const cue = cueOf(s, q);
          expect(answer).not.toBe(cue);
          expect(q.options).toHaveLength(config.options);
          expect(new Set(q.options).size).toBe(config.options);
          expect(q.options.filter((o) => o === answer)).toHaveLength(1);
          expect(q.options).not.toContain(cue);
          if (!config.bothDirections) expect(q.cueSide).toBe(0);
          const distractors = q.options.filter((o) => o !== answer);
          if (config.distractors === 'unstudied') for (const d of distractors) expect(studied.has(d)).toBe(false);
          else for (const d of distractors) expect(studied.has(d)).toBe(true);
          if (config.distractors === 'studied') {
            const sameSide = s.pairs.map((p) => p[1 - q.cueSide]);
            for (const d of distractors) expect(sameSide).toContain(d);
          }
        }
      }),
      { numRuns: 200 }
    );
  });

  it('hard prefers distractors from the answer’s category (property)', () => {
    fc.assert(
      fc.property(seedArb, (seed) => {
        const s = newRound(seed, 'hard');
        for (const q of s.questions) {
          const answer = answerOf(s, q);
          const own = s.pairs[q.pair] as [string, string];
          const available = s.pairs.flat().filter((id) => !own.includes(id) && categoryOf(id) === categoryOf(answer)).length;
          const used = q.options.filter((o) => o !== answer && categoryOf(o) === categoryOf(answer)).length;
          expect(used).toBe(Math.min(available, CONFIGS.hard.options - 1));
        }
      }),
      { numRuns: 100 }
    );
  });

  it('medium and hard ask in both directions, the answer position varies', () => {
    const sides = new Set<number>();
    const positions = new Set<number>();
    for (let seed = 1; seed <= 20; seed++) {
      for (const q of newRound(seed, 'medium').questions) {
        sides.add(q.cueSide);
        positions.add(q.options.indexOf(answerOf(newRound(seed, 'medium'), q)));
      }
    }
    expect([...sides].sort()).toEqual([0, 1]);
    expect([...positions].sort()).toEqual([0, 1, 2, 3]);
  });

  it('asks in a different order than studied for at least some seeds', () => {
    let reordered = 0;
    for (let seed = 1; seed <= 10; seed++) {
      const order = newRound(seed, 'hard').questions.map((q) => q.pair);
      if (order.some((p, i) => p !== i)) reordered++;
    }
    expect(reordered).toBeGreaterThan(5);
  });
});

describe('learning', () => {
  it('moves forward and back through the pairs; the last Next starts the break or recall', () => {
    let s = newRound(3, 'easy');
    expect(previousPair(s)).toBe(s);
    s = nextPair(s);
    expect(s.index).toBe(1);
    s = previousPair(s);
    expect(s.index).toBe(0);
    for (let i = 0; i < 4; i++) s = nextPair(s);
    expect(s).toMatchObject({ phase: 'learn', index: 4 });
    s = nextPair(s);
    expect(s).toMatchObject({ phase: 'recall', index: 0 });

    let m = newRound(3, 'medium');
    for (let i = 0; i < 8; i++) m = nextPair(m);
    expect(m).toMatchObject({ phase: 'filler', index: 0 });
  });

  it('notes are stored per pair, sanitized, and only while learning', () => {
    let s = newRound(3, 'easy');
    s = setNote(s, 'cat\nin a hat');
    expect(s.notes[0]).toBe('cat in a hat');
    expect(setNote(s, 'cat\nin a hat')).toBe(s);
    s = nextPair(s);
    s = setNote(s, 'x'.repeat(500));
    expect(s.notes[1]).toHaveLength(NOTE_MAX);
    expect(s.notes.slice(2)).toEqual(['', '', '']);
    const recall = toRecall(s);
    expect(setNote(recall, 'late')).toBe(recall);
    expect(nextPair(recall)).toBe(recall);
    expect(previousPair(recall)).toBe(recall);
  });

  it('setNote does not mutate the original state', () => {
    const s = newRound(3, 'easy');
    const before = clone(s);
    setNote(s, 'hello');
    expect(s).toEqual(before);
  });
});

describe('counting break', () => {
  it('records each count and moves to recall after the last break', () => {
    let s = newRound(4, 'hard');
    while (s.phase === 'learn') s = nextPair(s);
    expect(answerFiller(s, 0)).toBe(s);
    expect(answerFiller(s, FILLER_MAX_COUNT + 1)).toBe(s);
    expect(answerFiller(s, 2.5)).toBe(s);
    s = answerFiller(s, 1);
    expect(s).toMatchObject({ phase: 'filler', index: 1, fillerAnswers: [1] });
    s = answerFiller(s, FILLER_MAX_COUNT);
    expect(s).toMatchObject({ phase: 'filler', index: 2, fillerAnswers: [1, FILLER_MAX_COUNT] });
    s = answerFiller(s, 4);
    expect(s).toMatchObject({ phase: 'recall', index: 0, fillerAnswers: [1, 6, 4] });
    expect(answerFiller(s, 3)).toBe(s);
    expect(answerFiller(newRound(4, 'hard'), 3).fillerAnswers).toEqual([]);
  });
});

describe('recall and scoring', () => {
  it('only accepts offered options, only during recall', () => {
    const learn = newRound(5, 'easy');
    expect(answerQuestion(learn, learn.questions[0]?.options[0] as string)).toBe(learn);
    const s = toRecall(learn);
    const q = s.questions[0] as Question;
    expect(answerQuestion(s, cueOf(s, q))).toBe(s);
    expect(answerQuestion(s, 'not-a-picture')).toBe(s);
    const next = answerQuestion(s, q.options[1] as string);
    expect(next).toMatchObject({ phase: 'recall', index: 1, answers: [q.options[1]] });
  });

  it('finishes after the last question; nothing changes afterwards', () => {
    const s = play(6, 'easy', () => 0);
    expect(s.phase).toBe('finished');
    expect(s.index).toBe(5);
    expect(s.answers).toHaveLength(5);
    expect(isValidAssociationState(s)).toBe(true);
    expect(answerQuestion(s, s.answers[0] as string)).toBe(s);
  });

  it('all correct gives total; all wrong gives zero', () => {
    const right = play(9, 'medium', (q, _i, s) => q.options.indexOf(answerOf(s, q)));
    expect(score(right)).toEqual({ answered: 8, correct: 8, total: 8, fillerCorrect: 0, fillerTotal: 2 });
    const wrong = play(9, 'medium', (q, _i, s) => q.options.findIndex((o) => o !== answerOf(s, q)));
    expect(score(wrong).correct).toBe(0);
    expect(score(newRound(9, 'medium'))).toEqual({ answered: 0, correct: 0, total: 8, fillerCorrect: 0, fillerTotal: 2 });
  });

  it('counts exact counting-break answers', () => {
    let s = newRound(11, 'hard');
    while (s.phase === 'learn') s = nextPair(s);
    const [a, b, c] = s.fillers.map(countOf) as [number, number, number];
    s = answerFiller(s, a);
    s = answerFiller(s, b === 1 ? 2 : 1);
    s = answerFiller(s, c);
    expect(score(s)).toMatchObject({ fillerCorrect: 2, fillerTotal: 3 });
  });

  it('score matches an independent oracle for random answers (property)', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, fc.array(fc.nat(), { minLength: 12, maxLength: 12 }), fc.nat(12), (seed, difficulty, picks, stop) => {
        let s = toRecall(newRound(seed, difficulty));
        let i = 0;
        while (s.phase === 'recall' && i < stop) {
          const q = s.questions[s.index] as Question;
          s = answerQuestion(s, q.options[(picks[i] as number) % q.options.length] as string);
          i++;
        }
        const r = score(s);
        expect(r.correct).toBe(oracleCorrect(s));
        expect(r.answered).toBe(s.answers.length);
        expect(r.total).toBe(CONFIGS[difficulty].pairs);
        expect(isValidAssociationState(s)).toBe(true);
        expect(isValidAssociationState(clone(s))).toBe(true);
      }),
      { numRuns: 200 }
    );
  });

  it('answersByPair maps answers back to pair order', () => {
    const s = play(12, 'easy', (_q, i) => i % 3);
    const byPair = answersByPair(s);
    s.questions.forEach((q, i) => expect(byPair[q.pair]).toBe(s.answers[i]));
    const partial = answerQuestion(toRecall(newRound(12, 'easy')), toRecall(newRound(12, 'easy')).questions[0]?.options[0] as string);
    const partialByPair = answersByPair(partial);
    expect(partialByPair.filter((a) => a !== undefined)).toHaveLength(1);
    expect(partialByPair[partial.questions[0]?.pair as number]).toBe(partial.answers[0]);
  });
});

describe('isValidAssociationState', () => {
  const base = () => newRound(21, 'medium');
  const recall = () => toRecall(base());

  it('accepts states from every phase', () => {
    let s = base();
    expect(isValidAssociationState(s)).toBe(true);
    s = setNote(nextPair(s), 'a note');
    expect(isValidAssociationState(s)).toBe(true);
    while (s.phase === 'learn') s = nextPair(s);
    expect(isValidAssociationState(s)).toBe(true);
    s = answerFiller(s, 2);
    expect(isValidAssociationState(s)).toBe(true);
    s = answerFiller(s, 2);
    expect(s.phase).toBe('recall');
    expect(isValidAssociationState(s)).toBe(true);
    expect(isValidAssociationState(newRound(1, 'easy'))).toBe(true);
    expect(isValidAssociationState(toRecall(newRound(1, 'easy')))).toBe(true);
  });

  const mutations: [string, (s: AssociationState) => unknown][] = [
    ['seed out of range', (s) => ({ ...s, seed: -1 })],
    ['seed not integer', (s) => ({ ...s, seed: 1.5 })],
    ['unknown difficulty', (s) => ({ ...s, difficulty: 'extreme' })],
    ['unknown phase', (s) => ({ ...s, phase: 'done' })],
    ['too few pairs', (s) => ({ ...s, pairs: s.pairs.slice(1) })],
    ['unknown picture', (s) => ({ ...s, pairs: [['apple', 'unicorn'], ...s.pairs.slice(1)] })],
    ['pair of one picture', (s) => ({ ...s, pairs: [['apple', 'apple'], ...s.pairs.slice(1)] })],
    ['picture in two pairs', (s) => ({ ...s, pairs: [[s.pairs[1]?.[0], s.pairs[0]?.[1]], ...s.pairs.slice(1)] })],
    ['pair of three', (s) => ({ ...s, pairs: [[...(s.pairs[0] as string[]), 'zzz'], ...s.pairs.slice(1)] })],
    ['notes missing', (s) => ({ ...s, notes: s.notes.slice(1) })],
    ['note not sanitized', (s) => ({ ...s, notes: ['a\nb', ...s.notes.slice(1)] })],
    ['note too long', (s) => ({ ...s, notes: ['x'.repeat(NOTE_MAX + 1), ...s.notes.slice(1)] })],
    ['note not a string', (s) => ({ ...s, notes: [3, ...s.notes.slice(1)] })],
    ['filler missing', (s) => ({ ...s, fillers: s.fillers.slice(1) })],
    ['filler unknown target', (s) => ({ ...s, fillers: [{ ...s.fillers[0], target: 'star' }, ...s.fillers.slice(1)] })],
    ['filler wrong size', (s) => ({ ...s, fillers: [{ ...s.fillers[0], shapes: s.fillers[0]?.shapes.slice(1) }, ...s.fillers.slice(1)] })],
    ['filler target absent', (s) => ({ ...s, fillers: [{ shapes: Array(FILLER_SIZE).fill('circle'), target: 'square' }, ...s.fillers.slice(1)] })],
    ['filler target too often', (s) => ({ ...s, fillers: [{ shapes: Array(FILLER_SIZE).fill('circle'), target: 'circle' }, ...s.fillers.slice(1)] })],
    ['filler unknown shape', (s) => ({ ...s, fillers: [{ ...s.fillers[0], shapes: ['star', ...(s.fillers[0]?.shapes.slice(1) ?? [])] }, ...s.fillers.slice(1)] })],
    ['filler answer while learning', (s) => ({ ...s, fillerAnswers: [2] })],
    ['answer while learning', (s) => ({ ...s, answers: [s.questions[0]?.options[0]] })],
    ['index past last pair', (s) => ({ ...s, index: s.pairs.length })],
    ['negative index', (s) => ({ ...s, index: -1 })],
    ['question missing', (s) => ({ ...s, questions: s.questions.slice(1) })],
    ['pair asked twice', (s) => ({ ...s, questions: [s.questions[1], ...s.questions.slice(1)] })],
    ['question pair out of range', (s) => ({ ...s, questions: [{ ...s.questions[0], pair: 99 }, ...s.questions.slice(1)] })],
    ['question bad side', (s) => ({ ...s, questions: [{ ...s.questions[0], cueSide: 2 }, ...s.questions.slice(1)] })],
    ['options missing the answer', (s) => {
      const q = s.questions[0] as Question;
      const answer = answerOf(s, q);
      const unused = ITEM_IDS.find((id) => !s.pairs.flat().includes(id)) as string;
      return { ...s, questions: [{ ...q, options: q.options.map((o) => (o === answer ? unused : o)) }, ...s.questions.slice(1)] };
    }],
    ['options containing the cue', (s) => {
      const q = s.questions[0] as Question;
      const answer = answerOf(s, q);
      const options = q.options.map((o) => (o === answer ? o : o));
      const i = options.findIndex((o) => o !== answer);
      options[i] = cueOf(s, q);
      return { ...s, questions: [{ ...q, options }, ...s.questions.slice(1)] };
    }],
    ['duplicate options', (s) => {
      const q = s.questions[0] as Question;
      const answer = answerOf(s, q);
      return { ...s, questions: [{ ...q, options: q.options.map(() => answer) }, ...s.questions.slice(1)] };
    }],
    ['too few options', (s) => ({ ...s, questions: [{ ...s.questions[0], options: s.questions[0]?.options.slice(1) }, ...s.questions.slice(1)] })],
    ['questions not an array', (s) => ({ ...s, questions: {} })]
  ];

  it.each(mutations)('rejects %s', (_name, mutate) => {
    expect(isValidAssociationState(mutate(base()))).toBe(false);
  });

  it('rejects inconsistent phases and answers', () => {
    const r = recall();
    expect(isValidAssociationState({ ...r, fillerAnswers: [2] })).toBe(false);
    expect(isValidAssociationState({ ...r, fillerAnswers: [2, 2, 2] })).toBe(false);
    expect(isValidAssociationState({ ...r, fillerAnswers: [0, 2] })).toBe(false);
    expect(isValidAssociationState({ ...r, index: 1 })).toBe(false);
    const answered = answerQuestion(r, r.questions[0]?.options[0] as string);
    expect(isValidAssociationState(answered)).toBe(true);
    expect(isValidAssociationState({ ...answered, answers: ['unicorn'] })).toBe(false);
    expect(isValidAssociationState({ ...answered, answers: [r.questions[1]?.options.find((o) => !r.questions[0]?.options.includes(o))] })).toBe(false);
    expect(isValidAssociationState({ ...answered, answers: [7] })).toBe(false);
    expect(isValidAssociationState({ ...answered, index: 0 })).toBe(false);
    // A break phase with all breaks answered, or past the last break.
    let f = base();
    while (f.phase === 'learn') f = nextPair(f);
    expect(isValidAssociationState({ ...f, index: 1 })).toBe(false);
    expect(isValidAssociationState({ ...f, answers: [f.questions[0]?.options[0]] })).toBe(false);
    const f2 = answerFiller(answerFiller(f, 2), 2);
    expect(isValidAssociationState({ ...f2, phase: 'filler', index: 2 })).toBe(false);
    // Easy has no breaks and only forward questions.
    const easy = newRound(1, 'easy');
    expect(isValidAssociationState({ ...easy, phase: 'filler' })).toBe(false);
    expect(isValidAssociationState({ ...easy, questions: [{ ...easy.questions[0], cueSide: 1 }, ...easy.questions.slice(1)] })).toBe(false);
    // Finished must have every answer and index = pairs.
    const done = play(21, 'medium', () => 0);
    expect(isValidAssociationState(done)).toBe(true);
    expect(isValidAssociationState({ ...done, index: 7 })).toBe(false);
    expect(isValidAssociationState({ ...done, answers: done.answers.slice(1), index: 7 })).toBe(false);
    expect(isValidAssociationState({ ...done, fillerAnswers: [2] })).toBe(false);
    expect(isValidAssociationState({ ...done, phase: 'recall' })).toBe(false);
  });

  it('never throws on arbitrary data (property)', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(() => isValidAssociationState(value)).not.toThrow();
        expect(isValidAssociationState(value)).toBe(false);
      }),
      { numRuns: 300 }
    );
    expect(isValidAssociationState({ ...base(), pairs: null })).toBe(false);
    expect(isValidAssociationState({ ...base(), questions: [null, ...base().questions.slice(1)] })).toBe(false);
    expect(isValidAssociationState({ ...base(), fillers: [null, null] })).toBe(false);
  });
});
