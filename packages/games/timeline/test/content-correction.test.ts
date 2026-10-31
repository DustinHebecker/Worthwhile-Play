import { describe, expect, it, vi } from 'vitest';
import type * as EventsModule from '../src/events';
import type * as RulesModule from '../src/rules';
import type { EventData } from '../src/types';

type Rules = typeof RulesModule;
type Events = typeof EventsModule;

/** The rules over the content as it is, or over a copy of the content table changed by `edit`. */
async function rulesWith(edit?: (events: readonly EventData[]) => EventData[]): Promise<Rules> {
  vi.resetModules();
  vi.doUnmock('../src/events');
  if (edit)
    vi.doMock('../src/events', async (importOriginal) => {
      const orig = await importOriginal<Events>();
      return { ...orig, EVENTS: edit(orig.EVENTS) };
    });
  return import('../src/rules');
}

/** The dates of two events swapped (unit, kind, centre and range). */
const swapDates = (events: readonly EventData[], p: string, q: string): EventData[] => {
  const a = events.find((e) => e.id === p)!;
  const b = events.find((e) => e.id === q)!;
  const withDate = (e: EventData, d: EventData): EventData => {
    const { at: _at, ...rest } = e;
    const moved = { ...rest, unit: d.unit, kind: d.kind, lo: d.lo, hi: d.hi };
    return d.at === undefined ? moved : { ...moved, at: d.at };
  };
  return events.map((e) => (e.id === p ? withDate(e, b) : e.id === q ? withDate(e, a) : e));
};

/** Everything a review and the summary show as a result (not the current dates and notes). */
function results(R: Rules, s: ReturnType<Rules['createRound']>) {
  return {
    items: s.items.map((it) => {
      switch (it.kind) {
        case 'when':
          return { band: it.band, milli: it.milli };
        case 'order':
          return { pairs: it.pairs, solution: it.solution };
        case 'first':
          return { earlier: it.earlier, right: R.firstRight(it), gap: R.gapResult(it) };
        case 'together':
          return { right: R.togetherRight(it), correct: it.correct };
      }
    }),
    summary: R.summarize(s)
  };
}

describe('a later content correction (design § 14)', () => {
  it('never changes an old save: it still validates and reviews the same', async () => {
    const R0 = await rulesWith();
    // A medium mixed round (order and first items), every item answered.
    let s = R0.createRound(2024, 'medium', 'mixed', 'all');
    while (!R0.isSummary(s)) {
      const it = R0.currentItem(s)!;
      if (it.kind === 'when') s = R0.checkWhen(R0.setWhenDraft(s, { y: 1000, unit: 'ce', text: '1000' }));
      else if (it.kind === 'order') s = R0.checkOrder(R0.move(s, 0, 1));
      else if (it.kind === 'first') s = R0.checkFirst(R0.chooseGap(R0.chooseFirst(s, 'a'), it.gaps[0] ?? 0));
      else s = R0.checkTogether(R0.chooseOption(s, 0));
      s = R0.next(s);
    }
    const save = JSON.parse(JSON.stringify(s)) as typeof s;
    const before = results(R0, save);
    const first = save.items.find((i) => i.kind === 'first')!;
    const order = save.items.find((i) => i.kind === 'order')!;
    expect(first && order).toBeTruthy();
    if (first.kind !== 'first' || order.kind !== 'order') throw new Error('kinds');
    const oldest = order.solution[0]!;
    const newest = order.solution[order.solution.length - 1]!;
    // Correct the content: the two events of the "first" item and the ends of the order set swap their dates.
    const R1 = await rulesWith((events) => swapDates(swapDates(events, first.a, first.b), oldest, newest));
    // The corrected content really orders them the other way …
    expect(R1.earlierOf(first)).not.toBe(first.earlier);
    expect(R1.correctOrder(order.events)).not.toEqual(order.solution);
    // … yet the save is still valid and its results are unchanged.
    expect(R1.isTimelineState(save)).toBe(true);
    expect(results(R1, save)).toEqual(before);
  });
});
