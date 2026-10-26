import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { DIFFICULTIES, MODES, SPANS, type Difficulty, type RoundMode, type Span } from '../src/generate';
import {
  MAX_TEXT, checkFirst, checkOrder, checkTogether, checkWhen, chooseFirst, chooseGap, chooseOption, correctOrder, createRound, currentItem, earlierOf, firstRight, gapResult,
  isSummary, isTimelineState, markReported, move, next, phase, restartRound, setWhenDraft, settingsOf, skip, startChoice, summarize, tendencyKey, togetherRight,
  type FirstItem, type OrderItem, type TimelineState, type TogetherItem, type WhenItem
} from '../src/rules';
import { Y_MAX, Y_MIN } from '../src/time';
import * as O from './oracle';

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const item = <T>(s: TimelineState) => currentItem(s) as T;

/** A round whose current item is of `kind` (searching seeds), for focused tests. */
function roundWith(kind: string, d: Difficulty = 'medium', mode: RoundMode = 'mixed', span: Span = 'all', pred: (s: TimelineState) => boolean = () => true): TimelineState {
  for (let seed = 1; seed < 500; seed++) {
    let s = createRound(seed, d, mode, span);
    while (!isSummary(s) && currentItem(s)!.kind !== kind) s = next(skip(s));
    if (!isSummary(s) && pred(s)) return s;
  }
  throw new Error(`no ${kind} item`);
}

describe('creating a round', () => {
  it('starts at item 0 with empty drafts and a valid state', () => {
    for (const mode of MODES)
      for (const d of DIFFICULTIES) {
        const s = createRound(123, d, mode, 'all');
        expect(s.index).toBe(0);
        expect(s.reported).toBe(false);
        expect(isTimelineState(s)).toBe(true);
        expect(phase(s)).toBe('question');
        expect(s.items.every((i) => i.answer === null)).toBe(true);
      }
  });

  it('treats start-screen settings as untrusted', () => {
    expect(startChoice('hard', { mode: 'order', span: 'deep' })).toEqual({ difficulty: 'hard', mode: 'order', span: 'deep' });
    expect(startChoice('nonsense', { mode: 'x', span: 7 })).toEqual({ difficulty: 'easy', mode: 'mixed', span: 'all' });
    expect(startChoice(undefined, null)).toEqual({ difficulty: 'easy', mode: 'mixed', span: 'all' });
  });

  it('round-trips the settings through settingsOf (5 × 5 × 3)', () => {
    for (const mode of MODES)
      for (const span of SPANS)
        for (const d of DIFFICULTIES) {
          const s = createRound(9, d, mode, span);
          const back = settingsOf(s);
          const c = startChoice(back.difficulty, back);
          expect(createRound(9, c.difficulty, c.mode, c.span)).toEqual(s);
        }
  });

  it('restarts the same round', () => {
    const s = next(skip(createRound(5, 'easy', 'mixed', 'all')));
    expect(restartRound(s)).toEqual(createRound(5, 'easy', 'mixed', 'all'));
  });
});

describe('"when" items', () => {
  it('sets the draft (one value) and checks with the stored band and distance', () => {
    const s0 = roundWith('when');
    const w = item<WhenItem>(s0);
    const [lo, hi] = O.ends(w.event);
    const s1 = setWhenDraft(s0, { y: lo, unit: 'ce', text: 'x' });
    expect(item<WhenItem>(s1).draft).toEqual({ y: lo, unit: 'ce', text: 'x' });
    // Same draft again: same object.
    expect(setWhenDraft(s1, { y: lo, unit: 'ce', text: 'x' })).toBe(s1);
    const s2 = checkWhen(s1);
    expect(item<WhenItem>(s2)).toMatchObject({ answer: lo, milli: 0, band: 0 });
    // Outside the range.
    const g = Math.max(Y_MIN, hi < 1000 ? hi - 5000 : hi - 300);
    const s3 = checkWhen(setWhenDraft(s0, { y: g, unit: 'ce', text: '' }));
    expect(item<WhenItem>(s3).milli).toBe(O.milli(w.event, g));
    expect(phase(s3)).toBe('review');
  });

  it('refuses invalid drafts and checking without an answer', () => {
    const s0 = roundWith('when');
    expect(checkWhen(s0)).toBe(s0);
    expect(setWhenDraft(s0, { y: Y_MAX + 1, unit: 'ce', text: '' })).toBe(s0);
    expect(setWhenDraft(s0, { y: 1.5, unit: 'ce', text: '' })).toBe(s0);
    expect(setWhenDraft(s0, { y: 1, unit: 'xx' as 'ce', text: '' })).toBe(s0);
    const long = setWhenDraft(s0, { y: null, unit: 'ce', text: 'x'.repeat(60) });
    expect(item<WhenItem>(long).draft.text.length).toBe(MAX_TEXT);
  });
});

describe('"order" items', () => {
  it('moves cards (always a permutation) and counts pairs like the oracle', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 ** 31 }), fc.array(fc.tuple(fc.integer({ min: -1, max: 7 }), fc.integer({ min: -1, max: 7 })), { maxLength: 12 }), (seed, moves) => {
        let s = createRound(seed, 'hard', 'order', 'all');
        for (const [a, b] of moves) s = move(s, a, b);
        const o = item<OrderItem>(s);
        if ([...o.draft].sort().join() !== [...o.events].sort().join()) return false;
        const c = checkOrder(s);
        const r = item<OrderItem>(c);
        return r.pairs === O.concordant(o.draft) && isTimelineState(c);
      }),
      { numRuns: 60 }
    );
  });

  it('gives all pairs for the right order', () => {
    let s = roundWith('order', 'easy', 'order');
    const o = item<OrderItem>(s);
    const want = O.sortOldestFirst(o.events);
    expect(correctOrder(o.events)).toEqual(want);
    for (let i = 0; i < want.length; i++) s = move(s, item<OrderItem>(s).draft.indexOf(want[i]!), i);
    expect(item<OrderItem>(s).draft).toEqual(want);
    s = checkOrder(s);
    expect(item<OrderItem>(s).pairs).toBe((want.length * (want.length - 1)) / 2);
    expect(move(s, 0, 1)).toBe(s);
  });
});

describe('"first" items', () => {
  it('needs both answers when there is a gap question', () => {
    const s0 = roundWith('first', 'medium', 'first', 'all', (s) => item<FirstItem>(s).gaps.length === 4);
    const f = item<FirstItem>(s0);
    const s1 = chooseFirst(s0, earlierOf(f));
    expect(checkFirst(s1)).toBe(s1);
    const s2 = chooseGap(s1, f.gaps[f.gapIndex]!);
    expect(chooseGap(s2, 12345)).toBe(s2);
    const s3 = checkFirst(s2);
    const r = item<FirstItem>(s3);
    expect(firstRight(r)).toBe(true);
    expect(gapResult(r)).toBe('right');
    expect(earlierOf(r)).toBe(O.position(r.a) < O.position(r.b) ? 'a' : 'b');
  });

  it('grades the gap: one step off, further off', () => {
    const s0 = roundWith('first', 'hard', 'first', 'all', (s) => item<FirstItem>(s).gaps.length === 4);
    const f = item<FirstItem>(s0);
    const wrong = f.gapIndex === 0 ? 1 : f.gapIndex - 1;
    const r = item<FirstItem>(checkFirst(chooseGap(chooseFirst(s0, 'a'), f.gaps[wrong]!)));
    expect(gapResult(r)).toBe('near');
    const far = f.gapIndex <= 1 ? 3 : 0;
    expect(gapResult(item<FirstItem>(checkFirst(chooseGap(chooseFirst(s0, 'b'), f.gaps[far]!))))).toBe(Math.abs(far - f.gapIndex) === 1 ? 'near' : 'far');
  });

  it('works without a gap question (easy)', () => {
    const s0 = roundWith('first', 'easy', 'first');
    const f = item<FirstItem>(s0);
    expect(f.gaps).toEqual([]);
    const other = earlierOf(f) === 'a' ? 'b' : 'a';
    const r = item<FirstItem>(checkFirst(chooseFirst(s0, other)));
    expect(firstRight(r)).toBe(false);
    expect(gapResult(r)).toBeNull();
    expect(chooseFirst(s0, 'c' as 'a')).toBe(s0);
  });
});

describe('"together" items', () => {
  it('chooses an option and checks it', () => {
    const s0 = roundWith('together', 'medium', 'together');
    const t = item<TogetherItem>(s0);
    expect(checkTogether(s0)).toBe(s0);
    expect(chooseOption(s0, 3)).toBe(s0);
    const r = item<TogetherItem>(checkTogether(chooseOption(s0, t.correct)));
    expect(togetherRight(r)).toBe(true);
    const w = item<TogetherItem>(checkTogether(chooseOption(s0, (t.correct + 1) % 3)));
    expect(togetherRight(w)).toBe(false);
  });
});

describe('flow, summary and finish', () => {
  it('blocks "next" before a review and skips without scoring', () => {
    const s0 = createRound(3, 'easy', 'mixed', 'all');
    expect(next(s0)).toBe(s0);
    const s1 = skip(s0);
    expect(currentItem(s1)!.answer).toBe('skip');
    expect(skip(s1)).toBe(s1);
    expect(next(s1).index).toBe(1);
  });

  it('reaches the summary and reports once', () => {
    let s = createRound(8, 'medium', 'mixed', 'all');
    while (!isSummary(s)) s = next(skip(s));
    expect(phase(s)).toBe('summary');
    const r = markReported(s);
    expect(r.reported).toBe(true);
    expect(markReported(r)).toBe(r);
    expect(isTimelineState(r)).toBe(true);
    expect(markReported(createRound(8, 'medium', 'mixed', 'all')).reported).toBe(false);
    expect(summarize(r)).toMatchObject({ items: 6, answered: 0, closeOrBetter: 0, tendency: null, tip: 'general' });
  });

  it('describes a tendency over at least three answered "when" items', () => {
    let s = createRound(77, 'easy', 'when', 'modern');
    // Always place far too early (further back): 1500 for modern events.
    for (let i = 0; i < 4; i++) s = next(checkWhen(setWhenDraft(s, { y: 1500, unit: 'ce', text: '1500' })));
    const sum = summarize(s);
    expect(sum.tendency).toBeGreaterThan(0.03);
    expect(tendencyKey(sum.tendency)).toBe('back');
    expect(sum.tip).toBe('recent');
    expect(tendencyKey(-0.1)).toBe('recent');
    expect(tendencyKey(0.01)).toBe('none');
    expect(tendencyKey(null)).toBeNull();
  });

  it('never throws on random action sequences and stays valid', () => {
    const action = fc.oneof(
      fc.record({ k: fc.constant('draft'), y: fc.integer({ min: Y_MIN, max: Y_MAX }) }),
      fc.record({ k: fc.constant('check') }),
      fc.record({ k: fc.constant('move'), a: fc.integer({ min: 0, max: 6 }), b: fc.integer({ min: 0, max: 6 }) }),
      fc.record({ k: fc.constant('first'), v: fc.constantFrom('a' as const, 'b' as const) }),
      fc.record({ k: fc.constant('gap'), i: fc.integer({ min: 0, max: 3 }) }),
      fc.record({ k: fc.constant('opt'), i: fc.integer({ min: 0, max: 2 }) }),
      fc.record({ k: fc.constant('skip') }),
      fc.record({ k: fc.constant('next') })
    );
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 ** 32 - 1 }), fc.constantFrom(...MODES), fc.constantFrom(...DIFFICULTIES), fc.array(action, { maxLength: 40 }), (seed, mode, d, acts) => {
        let s = createRound(seed, d, mode, 'all');
        for (const a of acts) {
          const it = currentItem(s);
          switch (a.k) {
            case 'draft':
              s = setWhenDraft(s, { y: a.y, unit: 'ce', text: String(a.y) });
              break;
            case 'check':
              s = checkTogether(checkFirst(checkOrder(checkWhen(s))));
              break;
            case 'move':
              s = move(s, a.a, a.b);
              break;
            case 'first':
              s = chooseFirst(s, a.v);
              break;
            case 'gap':
              s = it?.kind === 'first' && it.gaps.length ? chooseGap(s, it.gaps[a.i]!) : s;
              break;
            case 'opt':
              s = chooseOption(s, a.i);
              break;
            case 'skip':
              s = skip(s);
              break;
            case 'next':
              s = next(s);
              break;
          }
          if (!isTimelineState(clone(s))) return false;
        }
        return true;
      }),
      { numRuns: 120 }
    );
  });
});

describe('isTimelineState', () => {
  it('never throws on anything', () => {
    fc.assert(fc.property(fc.anything(), (x) => typeof isTimelineState(x) === 'boolean'));
  });

  it('accepts generated states and their JSON copies', () => {
    for (const mode of MODES) for (const span of SPANS) expect(isTimelineState(clone(createRound(31, 'hard', mode, span)))).toBe(true);
  });

  it('rejects tampered states', () => {
    const base = createRound(11, 'medium', 'mixed', 'all');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tampering reaches into arbitrary fields
    type Loose = Record<string, any>;
    const bad = (f: (s: Loose) => void) => {
      const s = clone(base) as unknown as Loose;
      f(s);
      return isTimelineState(s);
    };
    expect(bad(() => undefined)).toBe(true);
    expect(bad((s) => (s.v = 2))).toBe(false);
    expect(bad((s) => (s.content = 'events-0'))).toBe(false);
    expect(bad((s) => (s.seed = -1))).toBe(false);
    expect(bad((s) => (s.mode = 'when'))).toBe(false);
    expect(bad((s) => (s.items = s.items.slice(1)))).toBe(false);
    expect(bad((s) => (s.index = 99))).toBe(false);
    expect(bad((s) => (s.reported = true))).toBe(false);
    const whenAt = base.items.findIndex((i) => i.kind === 'when');
    const orderAt = base.items.findIndex((i) => i.kind === 'order');
    const firstAt = base.items.findIndex((i) => i.kind === 'first');
    const togetherAt = base.items.findIndex((i) => i.kind === 'together');
    expect(bad((s) => (s.items[whenAt].event = 'nope'))).toBe(false);
    expect(bad((s) => (s.items[whenAt].draft.y = Y_MAX + 1))).toBe(false);
    expect(bad((s) => (s.items[whenAt].draft.text = 'x'.repeat(MAX_TEXT + 1)))).toBe(false);
    expect(bad((s) => Object.assign(s.items[whenAt], { answer: 1969, milli: 5, band: 0 }))).toBe(false);
    expect(bad((s) => Object.assign(s.items[whenAt], { answer: 1969, milli: 30, band: 1 }))).toBe(false);
    expect(bad((s) => Object.assign(s.items[whenAt], { answer: Y_MIN - 1, milli: 30, band: 2 }))).toBe(false);
    expect(bad((s) => Object.assign(s.items[whenAt], { answer: 1969, milli: 0, band: 3 }))).toBe(false);
    expect(bad((s) => Object.assign(s.items[whenAt], { answer: 1969, milli: 0, band: 1 }))).toBe(true);
    expect(bad((s) => (s.items[orderAt].draft[0] = s.items[orderAt].draft[1]))).toBe(false);
    expect(bad((s) => (s.items[orderAt].events[0] = s.items[orderAt].events[1]))).toBe(false);
    expect(bad((s) => Object.assign(s.items[orderAt], { answer: s.items[orderAt].draft, pairs: 99 }))).toBe(false);
    expect(bad((s) => (s.items[firstAt].b = s.items[firstAt].a))).toBe(false);
    expect(bad((s) => (s.items[firstAt].gaps = [100, 10, 1000, 1e4]))).toBe(false);
    expect(bad((s) => (s.items[firstAt].gapIndex = 7))).toBe(false);
    expect(bad((s) => (s.items[firstAt].pair = 'unknown-pair'))).toBe(false);
    expect(bad((s) => (s.items[togetherAt].tau = 30))).toBe(false);
    expect(bad((s) => (s.items[togetherAt].correct = 3))).toBe(false);
    expect(bad((s) => (s.items[togetherAt].options = s.items[togetherAt].options.slice(0, 2)))).toBe(false);
    expect(bad((s) => (s.items[togetherAt].options[0] = s.items[togetherAt].focus))).toBe(false);
    // Later items must still be open; earlier ones answered.
    expect(bad((s) => (s.items[5].answer = 'skip'))).toBe(false);
    expect(bad((s) => (s.index = 1))).toBe(false);
  });
});
