import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  check,
  chooseReply,
  createInitialState,
  currentItem,
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  DIMENSIONS,
  dimensionsFor,
  EASY_DIMENSIONS,
  isAmbiguityState,
  itemById,
  ITEMS,
  itemsFor,
  next,
  NOTE_MAX,
  phaseOf,
  replyOrder,
  REPLY_KINDS,
  ROUND_SIZE,
  sanitizeNote,
  score,
  scoreAt,
  setNote,
  summarize,
  toDifficulty,
  toggleDimension,
  type AmbiguityState,
  type DimId,
  type Difficulty,
  type ReplyKind
} from '../src/rules';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const goldOf = (state: AmbiguityState, index = state.index) => itemById(state.items[index] as string)!.missing;

/** Ticks the given dimensions, checks, picks a reply and moves on. */
function play(state: AmbiguityState, dims: readonly DimId[], reply: ReplyKind = 'clear'): AmbiguityState {
  let s = state;
  for (const dim of dims) s = toggleDimension(s, dim);
  s = check(s);
  s = chooseReply(s, reply);
  return next(s);
}

/** Plays a whole round answering every item perfectly. */
function playPerfect(seed: number, difficulty: Difficulty): AmbiguityState {
  let s = createInitialState(seed, difficulty);
  while (phaseOf(s) !== 'summary') s = play(s, goldOf(s));
  return s;
}

/** Independent oracle: set arithmetic with plain arrays. */
function oracle(ticked: readonly DimId[], gold: readonly DimId[]) {
  const hits = DIMENSIONS.filter((d) => ticked.indexOf(d) !== -1 && gold.indexOf(d) !== -1);
  const misses = DIMENSIONS.filter((d) => gold.indexOf(d) !== -1 && ticked.indexOf(d) === -1);
  const extra = DIMENSIONS.filter((d) => ticked.indexOf(d) !== -1 && gold.indexOf(d) === -1);
  return { hits, misses, extra };
}

const dimSubset = fc.subarray([...DIMENSIONS]);
const seedArb = fc.integer({ min: 0, max: 0xffff_ffff });
const difficultyArb = fc.constantFrom(...DIFFICULTIES);

describe('content specification', () => {
  it('has 24 items, eight per difficulty, with unique ids', () => {
    expect(ITEMS).toHaveLength(24);
    expect(new Set(ITEMS.map((item) => item.id)).size).toBe(24);
    for (const difficulty of DIFFICULTIES) expect(itemsFor(difficulty)).toHaveLength(8);
  });

  it('keeps missing and given disjoint, non-empty gold and valid reply kinds', () => {
    for (const item of ITEMS) {
      expect(item.missing.length).toBeGreaterThan(0);
      expect(item.missing.filter((dim) => item.given.includes(dim))).toEqual([]);
      expect(new Set(item.missing).size).toBe(item.missing.length);
      expect(new Set(item.given).size).toBe(item.given.length);
      expect(['assume', 'rude', 'redundant']).toContain(item.third);
    }
  });

  it('uses only the five everyday dimensions with one or two gaps on easy', () => {
    expect(EASY_DIMENSIONS).toEqual(['what', 'when', 'who', 'where', 'format']);
    for (const item of itemsFor('easy')) {
      expect(item.missing.length).toBeGreaterThanOrEqual(1);
      expect(item.missing.length).toBeLessThanOrEqual(2);
      for (const dim of [...item.missing, ...item.given]) expect(EASY_DIMENSIONS).toContain(dim);
    }
  });

  it('has three or four gaps on medium', () => {
    for (const item of itemsFor('medium')) {
      expect(item.missing.length).toBeGreaterThanOrEqual(3);
      expect(item.missing.length).toBeLessThanOrEqual(4);
    }
  });

  it('has context traps on hard: at least two given dimensions and a reply asking for known things', () => {
    for (const item of itemsFor('hard')) {
      expect(item.given.length).toBeGreaterThanOrEqual(2);
      expect(item.third).toBe('redundant');
    }
  });

  it('lists the dimensions per difficulty', () => {
    expect(dimensionsFor('easy')).toEqual(EASY_DIMENSIONS);
    expect(dimensionsFor('medium')).toEqual(DIMENSIONS);
    expect(dimensionsFor('hard')).toEqual(DIMENSIONS);
    expect(DIMENSIONS).toHaveLength(10);
    expect(REPLY_KINDS).toEqual(['clear', 'vague', 'assume', 'rude', 'redundant']);
  });

  it('looks up items by id', () => {
    expect(itemById('finish-tomorrow')?.missing).toEqual(['what']);
    expect(itemById('nope')).toBeUndefined();
  });
});

describe('toDifficulty', () => {
  it('accepts known difficulties and falls back to easy', () => {
    expect(toDifficulty('hard')).toBe('hard');
    expect(toDifficulty('medium')).toBe('medium');
    expect(toDifficulty('extreme')).toBe('easy');
    expect(toDifficulty(undefined)).toBe('easy');
    expect(DEFAULT_DIFFICULTY).toBe('easy');
  });
});

describe('createInitialState', () => {
  it('picks six distinct items of the difficulty, deterministically per seed', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, (seed, difficulty) => {
        const a = createInitialState(seed, difficulty);
        const b = createInitialState(seed, difficulty);
        expect(a).toEqual(b);
        expect(a.items).toHaveLength(ROUND_SIZE);
        expect(new Set(a.items).size).toBe(ROUND_SIZE);
        for (const id of a.items) expect(itemById(id)?.difficulty).toBe(difficulty);
        expect(a.seed).toBe(seed);
        expect(a.difficulty).toBe(difficulty);
        expect(a.index).toBe(0);
        expect(a.answers).toEqual(Array.from({ length: ROUND_SIZE }, () => ({ ticked: [], note: '', checked: false, reply: null })));
        expect(isAmbiguityState(a)).toBe(true);
        expect(phaseOf(a)).toBe('tick');
      }),
      { numRuns: 200 }
    );
  });

  it('varies the selection with the seed and defaults to easy', () => {
    const selections = new Set<string>();
    for (let seed = 0; seed < 30; seed++) selections.add(createInitialState(seed, 'medium').items.join());
    expect(selections.size).toBeGreaterThan(10);
    expect(createInitialState(5).difficulty).toBe('easy');
  });

  it('normalises the seed to an unsigned integer', () => {
    expect(createInitialState(-1, 'easy').seed).toBe(0xffff_ffff);
    expect(createInitialState(3.7, 'easy').seed).toBe(3);
  });
});

describe('score (set arithmetic)', () => {
  it('matches an independent oracle', () => {
    fc.assert(
      fc.property(dimSubset, dimSubset, (ticked, gold) => {
        const result = score(ticked, gold);
        expect(result).toEqual(oracle(ticked, gold));
        expect(result.hits.length + result.misses.length).toBe(new Set(gold).size);
        expect(result.hits.length + result.extra.length).toBe(new Set(ticked).size);
      }),
      { numRuns: 500 }
    );
  });

  it('handles the classic examples', () => {
    expect(score(['what', 'when'], ['what', 'format'])).toEqual({ hits: ['what'], misses: ['format'], extra: ['when'] });
    expect(score([], ['who'])).toEqual({ hits: [], misses: ['who'], extra: [] });
    expect(score(['purpose', 'what'], ['what', 'purpose'])).toEqual({ hits: ['what', 'purpose'], misses: [], extra: [] });
  });
});

describe('ticking', () => {
  it('toggles dimensions and keeps them unique and in display order', () => {
    let s = createInitialState(1, 'medium');
    s = toggleDimension(s, 'purpose');
    s = toggleDimension(s, 'what');
    s = toggleDimension(s, 'scope');
    expect(s.answers[0]?.ticked).toEqual(['what', 'scope', 'purpose']);
    s = toggleDimension(s, 'scope');
    expect(s.answers[0]?.ticked).toEqual(['what', 'purpose']);
    expect(isAmbiguityState(s)).toBe(true);
  });

  it('does not change the original state object', () => {
    const s = createInitialState(1, 'easy');
    const before = clone(s);
    toggleDimension(s, 'what');
    expect(s).toEqual(before);
  });

  it('refuses dimensions not offered at the difficulty', () => {
    const s = createInitialState(1, 'easy');
    expect(toggleDimension(s, 'purpose')).toBe(s);
    expect(toggleDimension(s, 'priority')).toBe(s);
    expect(toggleDimension(s, 'format')).not.toBe(s);
  });

  it('is locked after checking', () => {
    const s = check(toggleDimension(createInitialState(1, 'easy'), 'what'));
    expect(toggleDimension(s, 'when')).toBe(s);
    expect(setNote(s, 'x')).toBe(s);
    expect(check(s)).toBe(s);
  });

  it('only touches the current answer', () => {
    const s = toggleDimension(play(createInitialState(9, 'hard'), ['what']), 'who');
    expect(s.answers[0]?.ticked).toEqual(['what']);
    expect(s.answers[1]?.ticked).toEqual(['who']);
    expect(s.answers[2]?.ticked).toEqual([]);
  });
});

describe('notes', () => {
  it('stores the own question and leaves it ungraded', () => {
    const s = setNote(createInitialState(2, 'easy'), 'Which report do you mean?');
    expect(s.answers[0]?.note).toBe('Which report do you mean?');
    const checked = check(s);
    expect(scoreAt(checked, 0)).toEqual(score([], goldOf(checked, 0)));
  });

  it('returns the same state when the note does not change', () => {
    const s = setNote(createInitialState(2, 'easy'), 'abc');
    expect(setNote(s, 'abc')).toBe(s);
  });

  it('sanitises control characters and length', () => {
    expect(sanitizeNote('a\u0000b\u0007c\nd\te')).toBe('abc\nde');
    expect(sanitizeNote('x'.repeat(NOTE_MAX + 20))).toHaveLength(NOTE_MAX);
    expect(sanitizeNote('\u007f')).toBe('');
    expect(sanitizeNote('Ünïcode ✓ 你好')).toBe('Ünïcode ✓ 你好');
    const s = setNote(createInitialState(2, 'easy'), 'y'.repeat(NOTE_MAX + 1));
    expect(s.answers[0]?.note).toHaveLength(NOTE_MAX);
    expect(isAmbiguityState(s)).toBe(true);
  });
});

describe('phases and replies', () => {
  it('walks tick → feedback → replied → next item', () => {
    let s = createInitialState(4, 'medium');
    expect(phaseOf(s)).toBe('tick');
    expect(chooseReply(s, 'clear')).toBe(s);
    expect(next(s)).toBe(s);
    s = check(s);
    expect(phaseOf(s)).toBe('feedback');
    expect(next(s)).toBe(s);
    s = chooseReply(s, 'vague');
    expect(phaseOf(s)).toBe('replied');
    expect(chooseReply(s, 'clear')).toBe(s);
    expect(s.answers[0]?.reply).toBe('vague');
    s = next(s);
    expect(s.index).toBe(1);
    expect(phaseOf(s)).toBe('tick');
  });

  it('only accepts the three replies offered for the item', () => {
    let s = check(createInitialState(4, 'hard'));
    const item = currentItem(s)!;
    for (const kind of REPLY_KINDS) {
      const chosen = chooseReply(s, kind);
      const offered = kind === 'clear' || kind === 'vague' || kind === item.third;
      expect(chosen === s).toBe(!offered);
    }
    s = chooseReply(s, 'redundant');
    expect(s.answers[0]?.reply).toBe('redundant');
  });

  it('orders the replies stably per seed and item, always offering clear, vague and the third kind', () => {
    fc.assert(
      fc.property(seedArb, fc.constantFrom(...ITEMS), (seed, item) => {
        const order = replyOrder(seed, item.id);
        expect(order).toEqual(replyOrder(seed, item.id));
        expect([...order].sort()).toEqual(['clear', 'vague', item.third].sort());
      }),
      { numRuns: 200 }
    );
    const orders = new Set<string>();
    for (let seed = 0; seed < 40; seed++) orders.add(replyOrder(seed, 'airport').join());
    expect(orders.size).toBeGreaterThan(3);
    expect(() => replyOrder(1, 'nope')).toThrow(RangeError);
  });

  it('reaches the summary after six items', () => {
    const s = playPerfect(11, 'hard');
    expect(s.index).toBe(ROUND_SIZE);
    expect(phaseOf(s)).toBe('summary');
    expect(currentItem(s)).toBeUndefined();
    expect(next(s)).toBe(s);
    expect(check(s)).toBe(s);
    expect(toggleDimension(s, 'what')).toBe(s);
    expect(chooseReply(s, 'clear')).toBe(s);
    expect(isAmbiguityState(s)).toBe(true);
  });
});

describe('summarize', () => {
  it('reports a perfect round', () => {
    const s = playPerfect(3, 'medium');
    const summary = summarize(s);
    const gaps = s.items.reduce((sum, id) => sum + itemById(id)!.missing.length, 0);
    expect(summary.gaps).toBe(gaps);
    expect(summary.hits).toBe(gaps);
    expect(summary.misses).toBe(0);
    expect(summary.extra).toBe(0);
    expect(summary.bestReplies).toBe(ROUND_SIZE);
    expect(summary.answered).toBe(ROUND_SIZE);
    expect(summary.mostOverlooked).toEqual([]);
  });

  it('counts per-dimension accuracy like an oracle over random play', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, fc.array(fc.tuple(dimSubset, fc.constantFrom<ReplyKind>('clear', 'vague')), { minLength: ROUND_SIZE, maxLength: ROUND_SIZE }), (seed, difficulty, moves) => {
        let s = createInitialState(seed, difficulty);
        const offered = dimensionsFor(difficulty);
        const expected = new Map<DimId, { missing: number; found: number; overlooked: number; extra: number }>();
        let best = 0;
        moves.forEach(([dims, reply], i) => {
          const ticked = dims.filter((d) => offered.includes(d));
          const gold = goldOf(s, i);
          const o = oracle(ticked, gold);
          for (const dim of DIMENSIONS) {
            const row = expected.get(dim) ?? { missing: 0, found: 0, overlooked: 0, extra: 0 };
            if (gold.includes(dim)) row.missing++;
            if (o.hits.includes(dim)) row.found++;
            if (o.misses.includes(dim)) row.overlooked++;
            if (o.extra.includes(dim)) row.extra++;
            expected.set(dim, row);
          }
          if (reply === 'clear') best++;
          s = play(s, ticked, reply);
          expect(isAmbiguityState(s)).toBe(true);
        });
        const summary = summarize(s);
        for (const row of summary.dimensions) expect(expected.get(row.dim)).toEqual({ missing: row.missing, found: row.found, overlooked: row.overlooked, extra: row.extra });
        const listed = new Set(summary.dimensions.map((row) => row.dim));
        for (const [dim, row] of expected) expect(listed.has(dim)).toBe(row.missing > 0 || row.extra > 0);
        expect(summary.bestReplies).toBe(best);
        const worst = Math.max(...[...expected.values()].map((row) => row.overlooked));
        const overlooked = DIMENSIONS.filter((dim) => worst > 0 && expected.get(dim)!.overlooked === worst);
        expect(summary.mostOverlooked).toEqual(overlooked);
        expect(summary.misses).toBe([...expected.values()].reduce((sum, row) => sum + row.overlooked, 0));
      }),
      { numRuns: 150 }
    );
  });

  it('ignores items that are not checked yet', () => {
    let s = createInitialState(8, 'easy');
    expect(summarize(s)).toMatchObject({ answered: 0, gaps: 0, hits: 0, dimensions: [] });
    s = check(s);
    expect(summarize(s).answered).toBe(1);
    expect(summarize(s).bestReplies).toBe(0);
    expect(summarize(s).misses).toBe(goldOf(s, 0).length);
  });

  it('lists ties of the most overlooked dimensions', () => {
    let s = createInitialState(8, 'easy');
    while (phaseOf(s) !== 'summary') s = play(s, []);
    const summary = summarize(s);
    const worst = Math.max(...summary.dimensions.map((row) => row.overlooked));
    expect(summary.mostOverlooked).toEqual(summary.dimensions.filter((row) => row.overlooked === worst).map((row) => row.dim));
    expect(summary.hits).toBe(0);
  });
});

describe('isAmbiguityState', () => {
  const valid = () => createInitialState(42, 'medium');

  it('accepts states from every phase', () => {
    let s = valid();
    expect(isAmbiguityState(s)).toBe(true);
    s = setNote(toggleDimension(s, 'what'), 'q?');
    expect(isAmbiguityState(s)).toBe(true);
    s = check(s);
    expect(isAmbiguityState(s)).toBe(true);
    s = chooseReply(s, 'clear');
    expect(isAmbiguityState(s)).toBe(true);
    expect(isAmbiguityState(playPerfect(1, 'easy'))).toBe(true);
  });

  it('rejects junk without throwing', () => {
    for (const junk of [null, undefined, 1, 'x', [], {}, { seed: 1 }]) expect(isAmbiguityState(junk)).toBe(false);
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(() => isAmbiguityState(value)).not.toThrow();
      })
    );
  });

  it('survives hostile getters', () => {
    const hostile = { ...valid() };
    Object.defineProperty(hostile, 'answers', { get: () => { throw new Error('boom'); }, enumerable: true });
    expect(isAmbiguityState(hostile)).toBe(false);
  });

  const broken: Record<string, (s: AmbiguityState) => unknown> = {
    'seed negative': (s) => ({ ...s, seed: -1 }),
    'seed float': (s) => ({ ...s, seed: 1.5 }),
    'seed too large': (s) => ({ ...s, seed: 2 ** 32 }),
    'unknown difficulty': (s) => ({ ...s, difficulty: 'expert' }),
    'too few items': (s) => ({ ...s, items: s.items.slice(1) }),
    'duplicate item': (s) => ({ ...s, items: [s.items[0], ...s.items.slice(0, 5)] }),
    'unknown item': (s) => ({ ...s, items: ['nope', ...s.items.slice(1)] }),
    'item of another difficulty': (s) => ({ ...s, items: ['finish-tomorrow', ...s.items.slice(1)] }),
    'numeric item': (s) => ({ ...s, items: [1, ...s.items.slice(1)] }),
    'index negative': (s) => ({ ...s, index: -1 }),
    'index too large': (s) => ({ ...s, index: ROUND_SIZE + 1 }),
    'index float': (s) => ({ ...s, index: 0.5 }),
    'answers missing one': (s) => ({ ...s, answers: s.answers.slice(1) }),
    'answers not array': (s) => ({ ...s, answers: {} }),
    'answer not object': (s) => ({ ...s, answers: [null, ...s.answers.slice(1)] }),
    'unknown dimension': (s) => ({ ...s, answers: [{ ...s.answers[0], ticked: ['colour'] }, ...s.answers.slice(1)] }),
    'duplicate dimension': (s) => ({ ...s, answers: [{ ...s.answers[0], ticked: ['what', 'what'] }, ...s.answers.slice(1)] }),
    'unordered dimensions': (s) => ({ ...s, answers: [{ ...s.answers[0], ticked: ['when', 'what'] }, ...s.answers.slice(1)] }),
    'ticked not array': (s) => ({ ...s, answers: [{ ...s.answers[0], ticked: 'what' }, ...s.answers.slice(1)] }),
    'note not string': (s) => ({ ...s, answers: [{ ...s.answers[0], note: 5 }, ...s.answers.slice(1)] }),
    'note too long': (s) => ({ ...s, answers: [{ ...s.answers[0], note: 'x'.repeat(NOTE_MAX + 1) }, ...s.answers.slice(1)] }),
    'note with control chars': (s) => ({ ...s, answers: [{ ...s.answers[0], note: 'a\u0000' }, ...s.answers.slice(1)] }),
    'checked not boolean': (s) => ({ ...s, answers: [{ ...s.answers[0], checked: 'yes' }, ...s.answers.slice(1)] }),
    'reply without check': (s) => ({ ...s, answers: [{ ...s.answers[0], reply: 'clear' }, ...s.answers.slice(1)] }),
    'unknown reply': (s) => ({ ...s, answers: [{ ...s.answers[0], checked: true, reply: 'shout' }, ...s.answers.slice(1)] }),
    'future answer touched': (s) => ({ ...s, answers: [s.answers[0], { ...s.answers[1], ticked: ['what'] }, ...s.answers.slice(2)] }),
    'future answer with note': (s) => ({ ...s, answers: [s.answers[0], { ...s.answers[1], note: 'x' }, ...s.answers.slice(2)] }),
    'future answer checked': (s) => ({ ...s, answers: [s.answers[0], { ...s.answers[1], checked: true }, ...s.answers.slice(2)] }),
    'past answer unfinished': (s) => ({ ...s, index: 1 })
  };

  for (const [name, mutate] of Object.entries(broken)) {
    it(`rejects: ${name}`, () => {
      expect(isAmbiguityState(mutate(valid()))).toBe(false);
    });
  }

  it('rejects an easy state ticking a dimension easy does not offer', () => {
    const s = createInitialState(1, 'easy');
    expect(isAmbiguityState({ ...s, answers: [{ ...s.answers[0], ticked: ['scope'] }, ...s.answers.slice(1)] })).toBe(false);
    expect(isAmbiguityState({ ...s, answers: [{ ...s.answers[0], ticked: ['format'] }, ...s.answers.slice(1)] })).toBe(true);
  });

  it('rejects a reply kind not offered for that item', () => {
    let s = check(createInitialState(1, 'hard'));
    s = { ...s, answers: [{ ...s.answers[0]!, reply: 'assume' }, ...s.answers.slice(1)] };
    expect(isAmbiguityState(s)).toBe(false);
  });

  it('accepts a past answer that was replied and a pristine future', () => {
    const s = play(createInitialState(1, 'hard'), ['what']);
    expect(isAmbiguityState(s)).toBe(true);
    expect(isAmbiguityState({ ...s, answers: [{ ...s.answers[0]!, reply: null }, ...s.answers.slice(1)] })).toBe(false);
  });

  it('survives a JSON round trip in any reachable state', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, fc.array(dimSubset, { maxLength: ROUND_SIZE }), fc.boolean(), (seed, difficulty, rounds, stopMid) => {
        let s = createInitialState(seed, difficulty);
        for (const dims of rounds) s = play(s, dims.filter((d) => dimensionsFor(difficulty).includes(d)), 'vague');
        if (stopMid && phaseOf(s) !== 'summary') s = check(setNote(s, 'Why?'));
        expect(isAmbiguityState(clone(s))).toBe(true);
      }),
      { numRuns: 150 }
    );
  });
});
