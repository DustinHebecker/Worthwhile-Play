import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { BULLETS, GOLD_BULLETS, PIECES, SUMMARIES, VERSIONS, pieceById, type BulletId, type SummaryId, type VersionId } from '../src/pieces';
import {
  BULLET_PICKS,
  DIFFICULTIES,
  MAX_DRAFT,
  SELF_CHECKS,
  bulletIdsFor,
  canCheck,
  canWrite,
  check,
  chooseSummary,
  chooseVersion,
  countWords,
  createInitialState,
  isChecked,
  isCompressionState,
  isFinished,
  isGoldBullet,
  isNeededDetail,
  kindOf,
  next,
  pieceOf,
  scoreBullets,
  scoreCore,
  scoreDetails,
  sentenceIdsFor,
  setDraft,
  summarize,
  summaryIdsFor,
  toDifficulty,
  toggleBullet,
  toggleCheck,
  toggleDetail,
  toggleSentence,
  verdictOf,
  type CompressionState,
  type Difficulty
} from '../src/rules';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function seedFor(piece: string, difficulty: Difficulty = 'medium'): number {
  for (let seed = 1; seed < 2000; seed++) if (createInitialState(seed, difficulty).piece === piece) return seed;
  throw new Error(`no seed for ${piece}`);
}

/** Independent oracle: counts straight from the piece definition, filtered to what is shown. */
function oracleCore(state: CompressionState) {
  const def = PIECES.find((p) => p.id === state.piece)!;
  const shown = def.sentences.filter((s) => state.sentences.includes(s.id));
  const core = shown.filter((s) => s.kind === 'core').map((s) => s.id);
  return {
    gold: core.length,
    hits: core.filter((id) => state.core.includes(id)).length,
    extras: state.core.filter((id) => !core.includes(id)).length
  };
}

function oracleDetails(state: CompressionState) {
  const def = PIECES.find((p) => p.id === state.piece)!;
  const needed = def.details.filter((d) => d.needed).map((d) => d.id);
  return {
    gold: needed.length,
    hits: needed.filter((id) => state.needs.includes(id)).length,
    extras: state.needs.filter((id) => !needed.includes(id)).length
  };
}

/** Plays a whole game with the given answers. */
function playAll(state: CompressionState, a: { core: string[]; picks: BulletId[]; summary: SummaryId; needs: string[]; version: VersionId }) {
  let s = state;
  for (const id of a.core) s = toggleSentence(s, id);
  s = next(check(s));
  for (const id of a.picks) s = toggleBullet(s, id);
  s = next(check(s));
  s = next(check(chooseSummary(s, a.summary)));
  for (const id of a.needs) s = toggleDetail(s, id);
  s = next(check(s));
  return next(check(chooseVersion(s, a.version)));
}

const coreIds = (s: CompressionState) => s.sentences.filter((id) => kindOf(pieceOf(s), id) === 'core');

type Action =
  | { type: 'sentence'; i: number }
  | { type: 'bullet'; i: number }
  | { type: 'summary'; i: number }
  | { type: 'detail'; i: number }
  | { type: 'version'; i: number }
  | { type: 'check' }
  | { type: 'next' }
  | { type: 'draft'; text: string }
  | { type: 'selfCheck'; i: number };

const actionArb: fc.Arbitrary<Action> = fc.oneof(
  fc.record({ type: fc.constant('sentence' as const), i: fc.nat(13) }),
  fc.record({ type: fc.constant('bullet' as const), i: fc.nat(7) }),
  fc.record({ type: fc.constant('summary' as const), i: fc.nat(4) }),
  fc.record({ type: fc.constant('detail' as const), i: fc.nat(6) }),
  fc.record({ type: fc.constant('version' as const), i: fc.nat(3) }),
  fc.constant({ type: 'check' as const }),
  fc.constant({ type: 'next' as const }),
  fc.record({ type: fc.constant('draft' as const), text: fc.string({ maxLength: 40 }) }),
  fc.record({ type: fc.constant('selfCheck' as const), i: fc.integer({ min: -1, max: 3 }) })
);

function apply(s: CompressionState, a: Action): CompressionState {
  switch (a.type) {
    case 'sentence':
      return toggleSentence(s, s.sentences[a.i] ?? `s${a.i + 1}`);
    case 'bullet':
      return toggleBullet(s, (s.bullets[a.i] ?? 'subtle') as BulletId);
    case 'summary':
      return chooseSummary(s, (s.summaries[a.i] ?? 'vague') as SummaryId);
    case 'detail':
      return toggleDetail(s, s.details[a.i] ?? 'd9');
    case 'version':
      return chooseVersion(s, (s.versions[a.i] ?? 'vague') as VersionId);
    case 'check':
      return check(s);
    case 'next':
      return next(s);
    case 'draft':
      return setDraft(s, a.text);
    case 'selfCheck':
      return toggleCheck(s, a.i);
  }
}

describe('content definition', () => {
  it('has six pieces with unique ids, 4–5 core sentences each, and three needed details', () => {
    expect(PIECES).toHaveLength(6);
    expect(new Set(PIECES.map((p) => p.id)).size).toBe(6);
    for (const p of PIECES) {
      const core = p.sentences.filter((s) => s.kind === 'core');
      expect(core.length, p.id).toBeGreaterThanOrEqual(4);
      expect(core.length, p.id).toBeLessThanOrEqual(7);
      // Core sentences are part of the text on every difficulty.
      expect(core.every((s) => s.level === 0), p.id).toBe(true);
      // Every difficulty has at least one detail and one side remark.
      for (const level of [0, 1, 2]) {
        const shown = p.sentences.filter((s) => s.level <= level);
        expect(shown.some((s) => s.kind === 'detail'), `${p.id}/${level}`).toBe(true);
        expect(shown.some((s) => s.kind === 'noise'), `${p.id}/${level}`).toBe(true);
      }
      expect(p.sentences.map((s) => s.id)).toEqual(p.sentences.map((_, i) => `s${i + 1}`));
      expect(p.details.filter((d) => d.needed).map((d) => d.id)).toEqual(['d1', 'd2', 'd3']);
      expect(p.details).toHaveLength(6);
    }
    expect(pieceById('launch')?.id).toBe('launch');
    expect(pieceById('nope')).toBeUndefined();
  });

  it('parses the sentence layout into kinds and levels', () => {
    const launch = pieceById('launch')!;
    expect(launch.sentences[0]).toEqual({ id: 's1', kind: 'noise', level: 0 });
    expect(launch.sentences[1]).toEqual({ id: 's2', kind: 'core', level: 0 });
    expect(launch.sentences[5]).toEqual({ id: 's6', kind: 'detail', level: 1 });
    expect(launch.sentences[6]).toEqual({ id: 's7', kind: 'noise', level: 2 });
    expect(launch.sentences).toHaveLength(12);
  });
});

describe('difficulty', () => {
  it('normalises unknown difficulties to easy', () => {
    expect(toDifficulty('hard')).toBe('hard');
    expect(toDifficulty('medium')).toBe('medium');
    expect(toDifficulty('extreme')).toBe('easy');
    expect(toDifficulty(undefined)).toBe('easy');
  });

  it('makes the text longer from easy to hard, keeping text order', () => {
    const launch = pieceById('launch')!;
    expect(sentenceIdsFor(launch, 'easy')).toEqual(['s1', 's2', 's3', 's4', 's5', 's8', 's9', 's11']);
    expect(sentenceIdsFor(launch, 'medium')).toEqual(['s1', 's2', 's3', 's4', 's5', 's6', 's8', 's9', 's11', 's12']);
    expect(sentenceIdsFor(launch, 'hard')).toEqual(launch.sentences.map((s) => s.id));
  });

  it('offers more and subtler bullet candidates on harder levels', () => {
    expect(bulletIdsFor('easy')).toEqual(['gold1', 'gold2', 'gold3', 'minor', 'distort']);
    expect(bulletIdsFor('medium')).toEqual(['gold1', 'gold2', 'gold3', 'minor', 'distort', 'dup']);
    expect(bulletIdsFor('hard')).toEqual([...BULLETS]);
    expect(bulletIdsFor('hard')).toContain('subtle');
  });

  it('offers summary sentences with exactly one faithful option on every level', () => {
    expect(summaryIdsFor('easy')).toEqual(['faithful', 'vague', 'adds']);
    expect(summaryIdsFor('medium')).toEqual(['faithful', 'vague', 'drops', 'adds']);
    expect(summaryIdsFor('hard')).toEqual(['faithful', 'drops', 'adds', 'subtle']);
    for (const d of DIFFICULTIES) expect(summaryIdsFor(d).filter((id) => id === 'faithful')).toHaveLength(1);
  });
});

describe('createInitialState', () => {
  it('is deterministic and normalises the seed', () => {
    expect(createInitialState(42, 'hard')).toEqual(createInitialState(42, 'hard'));
    expect(createInitialState(-1).seed).toBe(0xffffffff);
    expect(createInitialState(2 ** 32 + 5).seed).toBe(5);
  });

  it('starts at step 1 with empty answers', () => {
    const s = createInitialState(7, 'medium');
    expect(s.version).toBe(1);
    expect(s.difficulty).toBe('medium');
    expect(s.step).toBe('core');
    expect(s.checked).toBe(false);
    expect(s.core).toEqual([]);
    expect(s.picks).toEqual([]);
    expect(s.summary).toBeNull();
    expect(s.needs).toEqual([]);
    expect(s.expanded).toBeNull();
    expect(s.draft).toBe('');
    expect(s.checks).toEqual([false, false, false]);
    expect(isFinished(s)).toBe(false);
  });

  it('reaches every piece and shuffles the candidates', () => {
    const pieces = new Set<string>();
    const firstBullets = new Set<string>();
    for (let seed = 0; seed < 200; seed++) {
      const s = createInitialState(seed, 'hard');
      pieces.add(s.piece);
      firstBullets.add(s.bullets[0]!);
    }
    expect(pieces.size).toBe(PIECES.length);
    expect(firstBullets.size).toBeGreaterThan(3);
  });

  it('builds valid states with the right candidate sets for every seed and difficulty', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.constantFrom(...DIFFICULTIES), (seed, difficulty) => {
        const s = createInitialState(seed, difficulty);
        const def = pieceById(s.piece)!;
        expect(s.sentences).toEqual(sentenceIdsFor(def, difficulty));
        expect([...s.bullets].sort()).toEqual([...bulletIdsFor(difficulty)].sort());
        expect([...s.summaries].sort()).toEqual([...summaryIdsFor(difficulty)].sort());
        expect([...s.details].sort()).toEqual(['d1', 'd2', 'd3', 'd4', 'd5', 'd6']);
        expect([...s.versions].sort()).toEqual([...VERSIONS].sort());
        expect(isCompressionState(s)).toBe(true);
      }),
      { numRuns: 200 }
    );
  });
});

describe('step 1: core sentences', () => {
  it('toggles shown sentences and ignores hidden or unknown ones', () => {
    const s0 = createInitialState(seedFor('launch', 'easy'), 'easy');
    const s1 = toggleSentence(s0, 's2');
    expect(s1.core).toEqual(['s2']);
    expect(toggleSentence(s1, 's3').core).toEqual(['s2', 's3']);
    expect(toggleSentence(s1, 's2').core).toEqual([]);
    // s7 is part of the text only on hard.
    expect(toggleSentence(s0, 's7')).toBe(s0);
    expect(toggleSentence(s0, 'x')).toBe(s0);
  });

  it('needs at least one ticked sentence before checking, then locks the answer', () => {
    const s0 = createInitialState(3);
    expect(canCheck(s0)).toBe(false);
    expect(check(s0)).toBe(s0);
    const s1 = toggleSentence(s0, s0.sentences[0]!);
    expect(canCheck(s1)).toBe(true);
    const s2 = check(s1);
    expect(s2.checked).toBe(true);
    expect(s2.step).toBe('core');
    expect(canCheck(s2)).toBe(false);
    expect(check(s2)).toBe(s2);
    expect(toggleSentence(s2, s0.sentences[1]!)).toBe(s2);
    expect(isChecked(s2, 'core')).toBe(true);
    expect(isChecked(s1, 'core')).toBe(false);
  });

  it('moves on only after checking', () => {
    const s0 = toggleSentence(createInitialState(3), 's2');
    expect(next(s0)).toBe(s0);
    const s1 = next(check(s0));
    expect(s1.step).toBe('bullets');
    expect(s1.checked).toBe(false);
    expect(toggleSentence(s1, 's3')).toBe(s1);
  });

  it('scores against the core sentences shown', () => {
    const s = createInitialState(seedFor('library', 'hard'), 'hard');
    // Core: s2 s4 s6 s7. Ticked: two core sentences, one detail, one side remark.
    const ticked = ['s2', 's4', 's3', 's1'].reduce(toggleSentence, s);
    expect(scoreCore(ticked)).toEqual({ gold: 4, hits: 2, extras: 2 });
    const all = ['s2', 's4', 's6', 's7'].reduce(toggleSentence, s);
    expect(scoreCore(all)).toEqual({ gold: 4, hits: 4, extras: 0 });
  });
});

describe('step 2: three bullets', () => {
  const atBullets = (difficulty: Difficulty = 'hard') => next(check(toggleSentence(createInitialState(11, difficulty), 's2')));

  it('allows at most three picks and needs exactly three to check', () => {
    const s0 = atBullets();
    let s = s0;
    for (const id of ['minor', 'gold1', 'dup'] as const) {
      expect(canCheck(s)).toBe(false);
      s = toggleBullet(s, id);
    }
    expect(s.picks).toEqual(['minor', 'gold1', 'dup']);
    expect(canCheck(s)).toBe(true);
    expect(toggleBullet(s, 'gold2')).toBe(s);
    const fewer = toggleBullet(s, 'minor');
    expect(fewer.picks).toEqual(['gold1', 'dup']);
    expect(canCheck(fewer)).toBe(false);
    expect(toggleBullet(fewer, 'gold2').picks).toEqual(['gold1', 'dup', 'gold2']);
  });

  it('ignores bullets that are not offered on this level', () => {
    const s = atBullets('easy');
    expect(toggleBullet(s, 'subtle')).toBe(s);
    expect(toggleBullet(s, 'dup')).toBe(s);
    expect(toggleBullet(s, 'distort').picks).toEqual(['distort']);
  });

  it('scores the gold bullets', () => {
    const s = ['gold1', 'subtle', 'gold3'].reduce((acc, id) => toggleBullet(acc, id as BulletId), atBullets());
    expect(scoreBullets(s)).toEqual({ gold: 3, hits: 2, extras: 1 });
    expect(GOLD_BULLETS.every(isGoldBullet)).toBe(true);
    expect(isGoldBullet('dup')).toBe(false);
    expect(isGoldBullet('subtle')).toBe(false);
  });
});

describe('step 3: one sentence and the own version', () => {
  const atSentence = (difficulty: Difficulty = 'medium') => {
    let s = next(check(toggleSentence(createInitialState(5, difficulty), 's2')));
    for (const id of ['gold1', 'gold2', 'gold3'] as const) s = toggleBullet(s, id);
    return next(check(s));
  };

  it('chooses only offered summaries and needs a choice before checking', () => {
    const s = atSentence('hard');
    expect(s.step).toBe('sentence');
    expect(canCheck(s)).toBe(false);
    expect(chooseSummary(s, 'vague')).toBe(s);
    const chosen = chooseSummary(s, 'subtle');
    expect(chosen.summary).toBe('subtle');
    expect(chooseSummary(chosen, 'subtle')).toBe(chosen);
    expect(chooseSummary(chosen, 'faithful').summary).toBe('faithful');
    expect(canCheck(chosen)).toBe(true);
    const easy = atSentence('easy');
    expect(chooseSummary(easy, 'subtle')).toBe(easy);
    expect(chooseSummary(easy, 'drops')).toBe(easy);
  });

  it('lets the player write and self-check only after checking, and keeps it afterwards', () => {
    const s0 = chooseSummary(atSentence(), 'faithful');
    expect(canWrite(s0)).toBe(false);
    expect(setDraft(s0, 'x')).toBe(s0);
    expect(toggleCheck(s0, 0)).toBe(s0);
    const s1 = check(s0);
    expect(canWrite(s1)).toBe(true);
    const s2 = setDraft(s1, 'My short version.');
    expect(s2.draft).toBe('My short version.');
    expect(setDraft(s2, 'My short version.')).toBe(s2);
    expect(setDraft(s1, 'y'.repeat(MAX_DRAFT + 50)).draft).toHaveLength(MAX_DRAFT);
    const s3 = toggleCheck(s2, 2);
    expect(s3.checks).toEqual([false, false, true]);
    expect(toggleCheck(s3, 2).checks).toEqual([false, false, false]);
    expect(toggleCheck(s3, -1)).toBe(s3);
    expect(toggleCheck(s3, SELF_CHECKS)).toBe(s3);
    expect(toggleCheck(s3, 0.5)).toBe(s3);
    const s4 = next(s3);
    expect(s4.step).toBe('details');
    expect(s4.draft).toBe('My short version.');
    expect(s4.checks).toEqual([false, false, true]);
    expect(setDraft(s4, 'changed')).toBe(s4);
    expect(toggleCheck(s4, 0)).toBe(s4);
  });
});

describe('steps 4 and 5: expansion', () => {
  const atDetails = () => {
    let s = next(check(toggleSentence(createInitialState(9), 's2')));
    for (const id of ['gold1', 'minor', 'gold3'] as const) s = toggleBullet(s, id);
    return next(check(chooseSummary(next(check(s)), 'vague')));
  };

  it('ticks details, scores them and needs one before checking', () => {
    const s0 = atDetails();
    expect(s0.step).toBe('details');
    expect(canCheck(s0)).toBe(false);
    expect(toggleDetail(s0, 'd7')).toBe(s0);
    const s1 = ['d1', 'd5', 'd3'].reduce(toggleDetail, s0);
    expect(s1.needs).toEqual(['d1', 'd5', 'd3']);
    expect(scoreDetails(s1)).toEqual({ gold: 3, hits: 2, extras: 1 });
    expect(toggleDetail(s1, 'd5').needs).toEqual(['d1', 'd3']);
    expect(isNeededDetail(pieceOf(s1), 'd2')).toBe(true);
    expect(isNeededDetail(pieceOf(s1), 'd4')).toBe(false);
    expect(isNeededDetail(pieceOf(s1), 'zz')).toBe(false);
  });

  it('finishes after the expanded version is checked', () => {
    const s0 = next(check(toggleDetail(atDetails(), 'd2')));
    expect(s0.step).toBe('expand');
    expect(canCheck(s0)).toBe(false);
    const s1 = chooseVersion(s0, 'invented');
    expect(chooseVersion(s1, 'invented')).toBe(s1);
    expect(chooseVersion(s1, 'nope' as VersionId)).toBe(s1);
    const s2 = check(s1);
    expect(isFinished(s2)).toBe(false);
    expect(chooseVersion(s2, 'actionable')).toBe(s2);
    const done = next(s2);
    expect(done.step).toBe('done');
    expect(done.checked).toBe(true);
    expect(isFinished(done)).toBe(true);
    expect(next(done)).toBe(done);
    expect(check(done)).toBe(done);
    expect(canCheck(done)).toBe(false);
    expect(isCompressionState(done)).toBe(true);
  });
});

describe('summary', () => {
  it('reports only checked steps', () => {
    const s0 = createInitialState(1);
    expect(summarize(s0)).toEqual({ core: null, bullets: null, sentence: null, details: null, version: null });
    const s1 = check(toggleSentence(s0, s0.sentences[1]!));
    expect(summarize(s1).core).toEqual(scoreCore(s1));
    expect(summarize(s1).bullets).toBeNull();
  });

  it('gives full marks for the gold answers and none for a poor game', () => {
    const s = createInitialState(seedFor('bikes'), 'medium');
    const best = playAll(s, { core: coreIds(s), picks: ['gold1', 'gold2', 'gold3'], summary: 'faithful', needs: ['d1', 'd2', 'd3'], version: 'actionable' });
    expect(isFinished(best)).toBe(true);
    expect(summarize(best)).toEqual({
      core: { gold: 4, hits: 4, extras: 0 },
      bullets: { gold: 3, hits: 3, extras: 0 },
      sentence: true,
      details: { gold: 3, hits: 3, extras: 0 },
      version: true
    });
    const poor = playAll(s, { core: ['s1'], picks: ['minor', 'distort', 'dup'], summary: 'vague', needs: ['d4', 'd5'], version: 'vague' });
    expect(summarize(poor)).toEqual({
      core: { gold: 4, hits: 0, extras: 1 },
      bullets: { gold: 3, hits: 0, extras: 3 },
      sentence: false,
      details: { gold: 3, hits: 0, extras: 2 },
      version: false
    });
  });

  it('matches the independent oracle for random answers', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 0xffffffff }),
        fc.constantFrom(...DIFFICULTIES),
        fc.array(fc.nat(13), { maxLength: 14 }),
        fc.array(fc.nat(6), { maxLength: 6 }),
        (seed, difficulty, sentenceIdx, detailIdx) => {
          let s = createInitialState(seed, difficulty);
          for (const i of sentenceIdx) s = toggleSentence(s, s.sentences[i % s.sentences.length]!);
          expect(scoreCore(s)).toEqual(oracleCore(s));
          s = next(check(s.core.length > 0 ? s : toggleSentence(s, s.sentences[0]!)));
          expect(s.step).toBe('bullets');
          for (const id of s.bullets.slice(0, 3)) s = toggleBullet(s, id);
          const bulletHits = s.picks.filter((id) => ['gold1', 'gold2', 'gold3'].includes(id)).length;
          expect(scoreBullets(s)).toEqual({ gold: 3, hits: bulletHits, extras: 3 - bulletHits });
          s = next(check(chooseSummary(next(check(s)), s.summaries[0]!)));
          for (const i of detailIdx) s = toggleDetail(s, s.details[i]!);
          expect(scoreDetails(s)).toEqual(oracleDetails(s));
        }
      ),
      { numRuns: 200 }
    );
  });
});

describe('verdicts and word counts', () => {
  it('maps gold and ticked to a verdict', () => {
    expect(verdictOf(true, true)).toBe('hit');
    expect(verdictOf(true, false)).toBe('miss');
    expect(verdictOf(false, true)).toBe('extra');
    expect(verdictOf(false, false)).toBe('skipped');
  });

  it('counts words, ignoring punctuation and extra spaces', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   ')).toBe(0);
    expect(countWords('one')).toBe(1);
    expect(countWords('one two  three')).toBe(3);
    expect(countWords('Hello, world!')).toBe(2);
    expect(countWords(' The launch moves to 14 May. ')).toBe(6);
    expect(countWords('Сбор — в 8 утра.', 'ru')).toBe(4);
    // Scripts without spaces are segmented into words, not counted as one.
    expect(countWords('图书馆从六月三日起关闭八周。', 'zh-Hans')).toBeGreaterThan(3);
  });

  it('falls back to splitting on spaces without Intl.Segmenter', () => {
    const original = Intl.Segmenter;
    try {
      (Intl as { Segmenter?: unknown }).Segmenter = undefined;
      expect(countWords(' a b,  c ')).toBe(3);
      expect(countWords(' ')).toBe(0);
    } finally {
      (Intl as { Segmenter?: unknown }).Segmenter = original;
    }
  });
});

describe('isCompressionState', () => {
  const finished = () => {
    const s = createInitialState(seedFor('trip'), 'hard');
    return playAll(s, { core: ['s2', 's3'], picks: ['gold1', 'subtle', 'minor'], summary: 'drops', needs: ['d1'], version: 'vague' });
  };
  const atSentenceChecked = () => {
    let s = next(check(toggleSentence(createInitialState(21, 'medium'), 's2')));
    for (const id of s.bullets.slice(0, 3)) s = toggleBullet(s, id);
    s = check(chooseSummary(next(check(s)), 'faithful'));
    return toggleCheck(setDraft(s, 'mine'), 1);
  };

  it('accepts states reached by any sequence of actions', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.constantFrom(...DIFFICULTIES), fc.array(actionArb, { maxLength: 60 }), (seed, difficulty, actions) => {
        let s = createInitialState(seed, difficulty);
        let lastStep = 0;
        for (const a of actions) {
          s = apply(s, a);
          expect(isCompressionState(clone(s))).toBe(true);
          expect(s.picks.length).toBeLessThanOrEqual(BULLET_PICKS);
          const step = ['core', 'bullets', 'sentence', 'details', 'expand', 'done'].indexOf(s.step);
          expect(step).toBeGreaterThanOrEqual(lastStep);
          lastStep = step;
        }
      }),
      { numRuns: 300 }
    );
  });

  it('finishes a game when every step is answered with a check and next', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffffffff }), fc.constantFrom(...DIFFICULTIES), (seed, difficulty) => {
        const s = createInitialState(seed, difficulty);
        const done = playAll(s, { core: [s.sentences[0]!], picks: s.bullets.slice(0, 3), summary: s.summaries[0]!, needs: [s.details[0]!], version: s.versions[0]! });
        expect(isFinished(done)).toBe(true);
        expect(isCompressionState(done)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects junk and broken fields', () => {
    for (const junk of [null, undefined, 0, 'x', [], {}, { version: 1 }]) expect(isCompressionState(junk)).toBe(false);
    const base = finished();
    expect(isCompressionState(base)).toBe(true);
    const broken: ((s: Record<string, unknown>) => void)[] = [
      (s) => (s.version = 2),
      (s) => (s.seed = -1),
      (s) => (s.seed = 1.5),
      (s) => (s.difficulty = 'extreme'),
      (s) => (s.difficulty = 'easy'),
      (s) => (s.piece = 'nope'),
      (s) => (s.piece = 3),
      (s) => (s.sentences = [...(s.sentences as string[])].reverse()),
      (s) => (s.sentences = (s.sentences as string[]).slice(1)),
      (s) => (s.bullets = (s.bullets as string[]).slice(1)),
      (s) => (s.bullets = [...(s.bullets as string[]).slice(1), (s.bullets as string[])[1]]),
      (s) => (s.summaries = ['faithful', 'vague', 'drops', 'adds']),
      (s) => (s.details = ['d1', 'd2', 'd3', 'd4', 'd5', 'd5']),
      (s) => (s.versions = ['actionable', 'vague']),
      (s) => (s.step = 'later'),
      (s) => (s.checked = false),
      (s) => (s.checked = 'yes'),
      (s) => (s.core = []),
      (s) => (s.core = ['s99']),
      (s) => (s.core = ['s2', 's2']),
      (s) => (s.picks = ['gold1', 'gold2']),
      (s) => (s.picks = ['gold1', 'gold2', 'gold3', 'minor']),
      (s) => (s.picks = ['gold1', 'gold2', 'nope']),
      (s) => (s.summary = null),
      (s) => (s.summary = 'nope'),
      (s) => (s.needs = []),
      (s) => (s.needs = ['d1', 'd1']),
      (s) => (s.expanded = null),
      (s) => (s.expanded = 'nope'),
      (s) => (s.draft = 5),
      (s) => (s.draft = 'x'.repeat(MAX_DRAFT + 1)),
      (s) => (s.checks = [true, false]),
      (s) => (s.checks = [true, false, 'no'])
    ];
    for (const breakIt of broken) {
      const copy = clone(base) as unknown as Record<string, unknown>;
      breakIt(copy);
      expect(isCompressionState(copy), JSON.stringify(copy)).toBe(false);
    }
  });

  it('rejects answers to steps that lie ahead and own text before it is allowed', () => {
    const s0 = createInitialState(4, 'medium');
    expect(isCompressionState({ ...clone(s0), picks: ['gold1'] })).toBe(false);
    expect(isCompressionState({ ...clone(s0), summary: 'faithful' })).toBe(false);
    expect(isCompressionState({ ...clone(s0), needs: ['d1'] })).toBe(false);
    expect(isCompressionState({ ...clone(s0), expanded: 'actionable' })).toBe(false);
    expect(isCompressionState({ ...clone(s0), draft: 'early' })).toBe(false);
    expect(isCompressionState({ ...clone(s0), checks: [true, false, false] })).toBe(false);
    expect(isCompressionState({ ...clone(s0), checked: true })).toBe(false);
    // A partly answered current step is fine.
    expect(isCompressionState({ ...clone(s0), core: [s0.sentences[0]] })).toBe(true);
    const own = atSentenceChecked();
    expect(isCompressionState(own)).toBe(true);
    expect(isCompressionState({ ...clone(own), checked: false })).toBe(false);
    expect(isCompressionState({ ...clone(own), checked: false, draft: '', checks: [false, false, false] })).toBe(true);
  });

  it('never throws on hostile input', () => {
    const hostile = { get version(): number { throw new Error('boom'); } };
    expect(isCompressionState(hostile)).toBe(false);
    fc.assert(fc.property(fc.anything(), (v) => { expect(() => isCompressionState(v)).not.toThrow(); }), { numRuns: 200 });
  });
});

describe('summary choices', () => {
  it('uses only known ids', () => {
    for (const d of DIFFICULTIES) expect(summaryIdsFor(d).every((id) => (SUMMARIES as readonly string[]).includes(id))).toBe(true);
  });
});
