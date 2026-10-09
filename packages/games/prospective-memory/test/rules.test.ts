import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import { metadata } from '../src/metadata';
import {
  ANGULAR_SHAPES,
  categoryOf,
  CHECK_IN_WINDOW,
  checkIn,
  CONFIGS,
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  expectedResponse,
  generateBlock,
  generateItems,
  hasCheckIn,
  isValidProspectiveState,
  ITEM_COUNT,
  LATE_WINDOW,
  newBlock,
  placeCues,
  respond,
  RESPONSES,
  ROUND_SHAPES,
  score,
  startBlock,
  toDifficulty,
  type Difficulty,
  type Item,
  type ProspectiveScore,
  type ProspectiveState,
  type Response
} from '../src/rules';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const seedArb = fc.integer({ min: 0, max: 0xffff_ffff });
const difficultyArb = fc.constantFrom(...DIFFICULTIES);
const responseArb = fc.constantFrom(...RESPONSES);

/** Plays a whole block with the given responses and check-in indices. */
function play(seed: number, difficulty: Difficulty, responses: (i: number) => Response, checkIns: readonly number[] = []): ProspectiveState {
  let state = startBlock(newBlock(seed, difficulty));
  while (state.phase === 'running') {
    if (checkIns.includes(state.index)) state = checkIn(state);
    state = respond(state, responses(state.index));
  }
  return state;
}

/**
 * Independent oracle: written from the instructions, with explicit per-cue windows rather than
 * the single pass in rules.ts.
 */
function oracle(items: readonly Item[], answers: readonly Response[], checkIns: readonly number[], target: number | null): ProspectiveScore {
  const cueIdx = items.map((item, i) => (item.cue ? i : -1)).filter((i) => i >= 0 && i < answers.length);
  const lateUsed: number[] = [];
  let onTime = 0;
  let late = 0;
  for (const c of cueIdx) {
    if (answers[c] === 'note') onTime += 1;
    else {
      const window = [c + 1, c + 2].filter((j) => j < answers.length && !items[j]?.cue && answers[j] === 'note');
      if (window.length > 0) {
        late += 1;
        lateUsed.push(window[0] as number);
      }
    }
  }
  const nonCue = answers.map((a, i) => ({ a, i })).filter(({ i }) => !items[i]?.cue);
  const ongoingCorrect = nonCue.filter(({ a, i }) => {
    const shape = items[i]?.shape;
    const round = shape === 'circle' || shape === 'oval';
    return a === (round ? 'round' : 'angular');
  }).length;
  const falseAlarms = nonCue.filter(({ a, i }) => a === 'note' && !lateUsed.includes(i)).length;
  let checkInStatus: ProspectiveScore['checkIn'] = 'none';
  let checkInAt: number | null = null;
  let extra = checkIns.length;
  if (target !== null) {
    const scored = checkIns.filter((i) => i >= target)[0];
    checkInStatus = scored === undefined ? 'missed' : scored <= target + 1 ? 'onTime' : 'late';
    checkInAt = scored ?? null;
    if (scored !== undefined) extra -= 1;
  }
  return {
    ongoingTotal: nonCue.length,
    ongoingCorrect,
    cues: cueIdx.length,
    onTime,
    late,
    missed: cueIdx.length - onTime - late,
    falseAlarms,
    checkIn: checkInStatus,
    checkInAt,
    extraCheckIns: extra
  };
}

describe('configuration', () => {
  it('metadata difficulties match the rules, easy first', () => {
    expect(metadata.difficulties).toEqual([...DIFFICULTIES]);
    expect(DEFAULT_DIFFICULTY).toBe('easy');
    expect(metadata.id).toBe('prospective-memory');
  });

  it('gets harder: fewer, subtler cues with longer gaps, and a second intention on hard', () => {
    expect(CONFIGS.easy).toEqual({ cueKind: 'star', cues: 5, minGap: 5, leadIn: 4, checkIn: null });
    expect(CONFIGS.medium).toEqual({ cueKind: 'dot', cues: 4, minGap: 7, leadIn: 6, checkIn: null });
    expect(CONFIGS.hard).toEqual({ cueKind: 'dot', cues: 3, minGap: 10, leadIn: 8, checkIn: 20 });
    expect([ITEM_COUNT, LATE_WINDOW, CHECK_IN_WINDOW]).toEqual([40, 2, 2]);
    expect(hasCheckIn('easy')).toBe(false);
    expect(hasCheckIn('medium')).toBe(false);
    expect(hasCheckIn('hard')).toBe(true);
  });

  it('toDifficulty accepts only known ids', () => {
    expect(toDifficulty('hard')).toBe('hard');
    expect(toDifficulty('medium')).toBe('medium');
    expect(toDifficulty('extreme')).toBe('easy');
    expect(toDifficulty(undefined)).toBe('easy');
  });

  it('categorises shapes', () => {
    for (const s of ROUND_SHAPES) expect(categoryOf(s)).toBe('round');
    for (const s of ANGULAR_SHAPES) expect(categoryOf(s)).toBe('angular');
    expect(categoryOf('star')).toBeNull();
    expect(expectedResponse({ shape: 'circle', filled: true, dot: false, cue: false })).toBe('round');
    expect(expectedResponse({ shape: 'hexagon', filled: false, dot: false, cue: false })).toBe('angular');
    expect(expectedResponse({ shape: 'square', filled: false, dot: true, cue: true })).toBe('note');
    expect(expectedResponse({ shape: 'star', filled: true, dot: false, cue: true })).toBe('note');
  });
});

describe('placeCues', () => {
  it('fills the whole room when there is no slack', () => {
    expect(placeCues(createRng(1), 3, 5, 2, 13)).toEqual([2, 7, 12]);
    expect(placeCues(createRng(9), 1, 5, 4, 5)).toEqual([4]);
  });

  it('returns nothing for zero cues and rejects impossible layouts', () => {
    expect(placeCues(createRng(1), 0, 5, 2, 10)).toEqual([]);
    expect(() => placeCues(createRng(1), 3, 5, 2, 12)).toThrow(new RangeError('Cues do not fit into the block.'));
  });

  it('always respects lead-in, range and minimum gap, and can reach both ends', () => {
    fc.assert(
      fc.property(seedArb, fc.integer({ min: 1, max: 6 }), fc.integer({ min: 1, max: 8 }), fc.integer({ min: 0, max: 6 }), (seed, count, gap, lead) => {
        const n = lead + (count - 1) * gap + 1 + (seed % 7);
        const cues = placeCues(createRng(seed), count, gap, lead, n);
        expect(cues).toHaveLength(count);
        expect(cues[0]).toBeGreaterThanOrEqual(lead);
        expect(cues[count - 1]).toBeLessThanOrEqual(n - 1);
        for (let i = 1; i < count; i++) expect((cues[i] as number) - (cues[i - 1] as number)).toBeGreaterThanOrEqual(gap);
      })
    );
    const firsts = new Set<number>();
    const lasts = new Set<number>();
    for (let seed = 0; seed < 400; seed++) {
      const cues = placeCues(createRng(seed), 2, 3, 1, 8);
      firsts.add(cues[0] as number);
      lasts.add(cues[1] as number);
    }
    // Slack 3: the first cue ranges over 1..4, the second over 4..7.
    expect([...firsts].sort()).toEqual([1, 2, 3, 4]);
    expect([...lasts].sort()).toEqual([4, 5, 6, 7]);
  });

  it('places every valid layout (uniform over all placements)', () => {
    // count 2, gap 2, positions 0..4 → valid pairs (a, b) with b - a >= 2: 6 layouts.
    const seen = new Map<string, number>();
    for (let seed = 0; seed < 3000; seed++) {
      const key = placeCues(createRng(seed), 2, 2, 0, 5).join(',');
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    expect([...seen.keys()].sort()).toEqual(['0,2', '0,3', '0,4', '1,3', '1,4', '2,4']);
    for (const n of seen.values()) expect(n).toBeGreaterThan(350);
  });
});

describe('generateBlock', () => {
  it('has the exact number of cues, spacing and lead-in for every difficulty', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, (seed, difficulty) => {
        const config = CONFIGS[difficulty];
        const { cues, items } = generateBlock(seed, difficulty);
        expect(items).toHaveLength(ITEM_COUNT);
        const cueIdx = items.map((item, i) => (item.cue ? i : -1)).filter((i) => i >= 0);
        expect(cueIdx).toEqual(cues);
        expect(cueIdx).toHaveLength(config.cues);
        expect(cueIdx[0]).toBeGreaterThanOrEqual(config.leadIn);
        for (let i = 1; i < cueIdx.length; i++) expect((cueIdx[i] as number) - (cueIdx[i - 1] as number)).toBeGreaterThanOrEqual(config.minGap);
      }),
      { numRuns: 300 }
    );
  });

  it('marks cues by a star (easy) or a dot inside an ordinary shape (medium, hard) and nowhere else', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, (seed, difficulty) => {
        const star = CONFIGS[difficulty].cueKind === 'star';
        generateItems(seed, difficulty).forEach((item) => {
          expect(item.shape === 'star').toBe(item.cue && star);
          expect(item.dot).toBe(item.cue && !star);
          if (!item.cue) expect(categoryOf(item.shape)).not.toBeNull();
        });
      }),
      { numRuns: 200 }
    );
  });

  it('never shows the same shape twice in a row and uses both categories and fills', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, (seed, difficulty) => {
        const items = generateItems(seed, difficulty);
        for (let i = 1; i < items.length; i++) expect(items[i]?.shape).not.toBe(items[i - 1]?.shape);
        const nonCue = items.filter((item) => !item.cue);
        expect(nonCue.some((item) => categoryOf(item.shape) === 'round')).toBe(true);
        expect(nonCue.some((item) => categoryOf(item.shape) === 'angular')).toBe(true);
        expect(items.some((item) => item.filled)).toBe(true);
        expect(items.some((item) => !item.filled)).toBe(true);
      }),
      { numRuns: 200 }
    );
  });

  it('is pinned for a known seed (saves stay meaningful across versions)', () => {
    const { cues, items } = generateBlock(1, 'easy');
    expect(cues).toEqual(GOLDEN_CUES);
    expect(items.slice(0, 6)).toEqual(GOLDEN_ITEMS);
  });

  it('is deterministic per seed and differs between seeds', () => {
    fc.assert(
      fc.property(seedArb, difficultyArb, (seed, difficulty) => {
        expect(generateBlock(seed, difficulty)).toEqual(generateBlock(seed, difficulty));
      }),
      { numRuns: 50 }
    );
    expect(generateItems(1, 'easy')).not.toEqual(generateItems(2, 'easy'));
    expect(generateBlock(1, 'easy').cues).not.toEqual(generateBlock(1, 'hard').cues);
  });

  it('roughly balances the two categories over many blocks', () => {
    let round = 0;
    let total = 0;
    for (let seed = 0; seed < 50; seed++) {
      for (const item of generateItems(seed, 'medium')) {
        total += 1;
        if (categoryOf(item.shape) === 'round') round += 1;
      }
    }
    expect(round / total).toBeGreaterThan(0.4);
    expect(round / total).toBeLessThan(0.6);
  });
});

describe('block flow', () => {
  it('starts ready and only responds while running', () => {
    const ready = newBlock(7, 'medium');
    expect(ready).toEqual({ seed: 7, difficulty: 'medium', phase: 'ready', index: 0, answers: [], checkIns: [] });
    expect(respond(ready, 'round')).toBe(ready);
    expect(checkIn(ready)).toBe(ready);
    const running = startBlock(ready);
    expect(running).toMatchObject({ phase: 'running', index: 0 });
    expect(startBlock(running)).toBe(running);
    const after = respond(running, 'note');
    expect(after).toMatchObject({ phase: 'running', index: 1, answers: ['note'] });
    expect(respond(running, 'maybe' as Response)).toBe(running);
    expect(newBlock(-1, 'easy').seed).toBe(0xffff_ffff);
  });

  it('finishes after exactly ITEM_COUNT responses and then ignores input', () => {
    const done = play(3, 'easy', () => 'round');
    expect(done.phase).toBe('finished');
    expect(done.index).toBe(ITEM_COUNT);
    expect(done.answers).toHaveLength(ITEM_COUNT);
    expect(respond(done, 'round')).toBe(done);
    expect(checkIn({ ...done, difficulty: 'hard' })).toEqual({ ...done, difficulty: 'hard' });
    let s = startBlock(newBlock(3, 'easy'));
    for (let i = 0; i < ITEM_COUNT - 1; i++) s = respond(s, 'angular');
    expect(s.phase).toBe('running');
    expect(respond(s, 'angular').phase).toBe('finished');
  });

  it('check-in is offered only on hard, records the current item once and does not advance', () => {
    const easy = startBlock(newBlock(1, 'easy'));
    expect(checkIn(easy)).toBe(easy);
    let hard = startBlock(newBlock(1, 'hard'));
    hard = respond(hard, 'round');
    const once = checkIn(hard);
    expect(once).toMatchObject({ index: 1, checkIns: [1], answers: ['round'] });
    expect(checkIn(once)).toBe(once);
    const later = checkIn(respond(once, 'angular'));
    expect(later.checkIns).toEqual([1, 2]);
  });
});

describe('score', () => {
  it('perfect play: everything on time, no false alarms', () => {
    for (const difficulty of DIFFICULTIES) {
      const items = generateItems(11, difficulty);
      const target = CONFIGS[difficulty].checkIn;
      const s = play(11, difficulty, (i) => expectedResponse(items[i] as Item), target === null ? [] : [target]);
      const r = score(s, items);
      expect(r).toEqual({
        ongoingTotal: ITEM_COUNT - CONFIGS[difficulty].cues,
        ongoingCorrect: ITEM_COUNT - CONFIGS[difficulty].cues,
        cues: CONFIGS[difficulty].cues,
        onTime: CONFIGS[difficulty].cues,
        late: 0,
        missed: 0,
        falseAlarms: 0,
        checkIn: target === null ? 'none' : 'onTime',
        checkInAt: target,
        extraCheckIns: 0
      });
    }
  });

  it('classifies late, missed and false-alarm notes around a cue', () => {
    const { items, cues } = generateBlock(5, 'easy');
    const c = cues[0] as number;
    const sort = (i: number): Response => (categoryOf((items[i] as Item).shape) ?? 'round') as Response;
    // Late by one: sorted the cue, noted on the next shape.
    const late1 = play(5, 'easy', (i) => (i === c ? 'round' : i === c + 1 ? 'note' : items[i]?.cue ? 'note' : sort(i)));
    expect(score(late1, items)).toMatchObject({ onTime: 4, late: 1, missed: 0, falseAlarms: 0, ongoingCorrect: ITEM_COUNT - 5 - 1 });
    // Late by two still counts as late; the first unrelated note after the cue is attributed only once.
    const late2 = play(5, 'easy', (i) => (i === c ? 'round' : i === c + 1 || i === c + 2 ? 'note' : items[i]?.cue ? 'note' : sort(i)));
    expect(score(late2, items)).toMatchObject({ onTime: 4, late: 1, missed: 0, falseAlarms: 1 });
    // Three shapes later is too late: a missed cue plus a false alarm.
    const tooLate = play(5, 'easy', (i) => (i === c ? 'round' : i === c + 3 ? 'note' : items[i]?.cue ? 'note' : sort(i)));
    expect(score(tooLate, items)).toMatchObject({ onTime: 4, late: 0, missed: 1, falseAlarms: 1 });
    // A note before the cue does not count for it.
    const early = play(5, 'easy', (i) => (i === c ? 'angular' : i === c - 1 ? 'note' : items[i]?.cue ? 'note' : sort(i)));
    expect(score(early, items)).toMatchObject({ onTime: 4, late: 0, missed: 1, falseAlarms: 1 });
    // Never noting anything: all cues missed, every shape sorted.
    const never = play(5, 'easy', (i) => sort(i));
    expect(score(never, items)).toMatchObject({ cues: 5, onTime: 0, late: 0, missed: 5, falseAlarms: 0, ongoingCorrect: 35, ongoingTotal: 35 });
  });

  it('scores the check-in: on time within the window, late after it, missed, early presses as extra', () => {
    const items = generateItems(8, 'hard');
    const sorter = (i: number) => expectedResponse(items[i] as Item);
    const at = (checkIns: number[]) => score(play(8, 'hard', sorter, checkIns), items);
    expect(at([20])).toMatchObject({ checkIn: 'onTime', checkInAt: 20, extraCheckIns: 0 });
    expect(at([21])).toMatchObject({ checkIn: 'onTime', checkInAt: 21, extraCheckIns: 0 });
    expect(at([22])).toMatchObject({ checkIn: 'late', checkInAt: 22, extraCheckIns: 0 });
    expect(at([39])).toMatchObject({ checkIn: 'late', checkInAt: 39 });
    expect(at([])).toMatchObject({ checkIn: 'missed', checkInAt: null, extraCheckIns: 0 });
    expect(at([19])).toMatchObject({ checkIn: 'missed', checkInAt: null, extraCheckIns: 1 });
    expect(at([5, 19, 20, 30])).toMatchObject({ checkIn: 'onTime', checkInAt: 20, extraCheckIns: 3 });
  });

  it('partial blocks count only what was answered', () => {
    const { items, cues } = generateBlock(4, 'medium');
    let s = startBlock(newBlock(4, 'medium'));
    expect(score(s, items)).toMatchObject({ ongoingTotal: 0, cues: 0, missed: 0 });
    for (let i = 0; i <= (cues[0] as number); i++) s = respond(s, 'round');
    expect(score(s, items)).toMatchObject({ cues: 1, missed: 1, ongoingTotal: cues[0] });
  });

  it('matches the independent oracle for arbitrary responses and check-ins', () => {
    fc.assert(
      fc.property(
        seedArb,
        difficultyArb,
        fc.array(responseArb, { minLength: ITEM_COUNT, maxLength: ITEM_COUNT }),
        fc.uniqueArray(fc.integer({ min: 0, max: ITEM_COUNT - 1 }), { maxLength: 4 }),
        fc.integer({ min: 0, max: ITEM_COUNT }),
        (seed, difficulty, responses, rawCheckIns, stopAt) => {
          const items = generateItems(seed, difficulty);
          let s = startBlock(newBlock(seed, difficulty));
          // Mix in "mostly correct" behaviour so on-time and late cases are frequent.
          const pick = (i: number) => (i % 3 === 0 ? expectedResponse(items[i] as Item) : (responses[i] as Response));
          while (s.phase === 'running' && s.index < stopAt) {
            if (rawCheckIns.includes(s.index)) s = checkIn(s);
            s = respond(s, pick(s.index));
          }
          expect(isValidProspectiveState(s)).toBe(true);
          const target = CONFIGS[difficulty].checkIn;
          expect(score(s, items)).toEqual(oracle(items, s.answers, s.checkIns, target));
        }
      ),
      { numRuns: 400 }
    );
  });
});

describe('isValidProspectiveState', () => {
  const valid = (): ProspectiveState => {
    let s = startBlock(newBlock(42, 'hard'));
    s = respond(s, 'round');
    s = checkIn(s);
    s = respond(s, 'note');
    return s;
  };

  it('accepts reachable states', () => {
    expect(isValidProspectiveState(newBlock(1, 'easy'))).toBe(true);
    expect(isValidProspectiveState(valid())).toBe(true);
    expect(isValidProspectiveState(play(2, 'hard', () => 'angular', [0, 39]))).toBe(true);
    fc.assert(
      fc.property(seedArb, difficultyArb, fc.array(responseArb, { maxLength: ITEM_COUNT }), (seed, difficulty, responses) => {
        let s = startBlock(newBlock(seed, difficulty));
        for (const r of responses) {
          s = checkIn(s);
          s = respond(s, r);
        }
        expect(isValidProspectiveState(clone(s))).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects malformed or inconsistent data', () => {
    const base = valid();
    const bad: unknown[] = [
      null,
      [],
      'state',
      { ...base, seed: -1 },
      { ...base, seed: 1.5 },
      { ...base, seed: 0x1_0000_0000 },
      { ...base, difficulty: 'extreme' },
      { ...base, phase: 'paused' },
      { ...base, index: -1 },
      { ...base, index: ITEM_COUNT + 1 },
      { ...base, index: 1.5 },
      { ...base, answers: ['round', 'maybe'] },
      { ...base, answers: 'round' },
      { ...base, answers: ['round'] },
      { ...base, checkIns: 'x' },
      { ...base, checkIns: [ITEM_COUNT] },
      { ...base, checkIns: [-1] },
      { ...base, checkIns: [1, 1] },
      { ...base, checkIns: [2, 1] },
      { ...base, checkIns: [3] },
      { ...base, difficulty: 'medium' },
      { ...newBlock(1, 'hard'), checkIns: [0] },
      { ...newBlock(1, 'easy'), index: 1, answers: ['round'] },
      { ...base, phase: 'finished' },
      { ...play(1, 'easy', () => 'round'), phase: 'running' },
      { ...base, seed: undefined },
      { ...base, checkIns: undefined }
    ];
    for (const value of bad) expect(isValidProspectiveState(value), JSON.stringify(value)).toBe(false);
  });

  it('accepts a check-in at the current item and at the last item of a finished block', () => {
    const base = valid();
    expect(isValidProspectiveState({ ...base, checkIns: [1, 2] })).toBe(true);
    expect(isValidProspectiveState({ ...play(1, 'hard', () => 'round'), checkIns: [39] })).toBe(true);
    expect(isValidProspectiveState({ ...base, checkIns: [] })).toBe(true);
    expect(isValidProspectiveState({ ...base, difficulty: 'medium', checkIns: [] })).toBe(true);
  });

  it('never throws on arbitrary input', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(() => isValidProspectiveState(value)).not.toThrow();
      })
    );
    fc.assert(
      fc.property(fc.record({ seed: fc.anything(), difficulty: fc.anything(), phase: fc.anything(), index: fc.anything(), answers: fc.anything(), checkIns: fc.anything() }), (value) => {
        expect(() => isValidProspectiveState(value)).not.toThrow();
      })
    );
  });
});
