import { describe, expect, it } from 'vitest';
import { CURATED } from '../src/events';
import {
  DIFFICULTIES, FILL, MAX_CURATED, MODES, ORDER_SIZE, PAIR_K, ROUND_KINDS, SPANS, TIERS, TOGETHER_K, generateRound, spanWidth, subjects, type Difficulty, type NewItem, type Span
} from '../src/generate';
import { tauFor } from '../src/score';
import * as O from './oracle';

/** Checks one generated item against the oracle (design § 11.4). */
function checkItem(item: NewItem, span: Span, d: Difficulty) {
  const pairMin = O.width(span) / PAIR_K[d];
  const inSpan = (id: string) => span === 'all' || O.era(id) === span;
  switch (item.kind) {
    case 'when':
      expect(inSpan(item.event)).toBe(true);
      expect(item.anchors.length).toBe(d === 'hard' ? 0 : d === 'medium' ? 1 : 3);
      for (const a of item.anchors) {
        expect(a).not.toBe(item.event);
        expect(O.gapDecades(O.ends(a), O.ends(item.event))).toBeGreaterThan(0);
      }
      break;
    case 'order': {
      expect(item.events.length).toBeGreaterThanOrEqual(3);
      expect(item.events.length).toBeLessThanOrEqual(ORDER_SIZE[d]);
      for (const id of item.events) expect(inSpan(id)).toBe(true);
      for (let i = 0; i < item.events.length; i++)
        for (let j = i + 1; j < item.events.length; j++) expect(O.gapDecades(O.ends(item.events[i]!), O.ends(item.events[j]!))).toBeGreaterThanOrEqual(pairMin - 1e-9);
      // Never already sorted.
      expect(O.sortOldestFirst(item.events)).not.toEqual(item.events);
      break;
    }
    case 'first': {
      expect(item.a).not.toBe(item.b);
      expect(O.gapDecades(O.ends(item.a), O.ends(item.b))).toBeGreaterThanOrEqual(pairMin - 1e-9);
      if (item.pair) {
        const p = CURATED.find((c) => c.id === item.pair)!;
        expect([p.older, p.newer].sort()).toEqual([item.a, item.b].sort());
      }
      if (d === 'easy') expect(item.gaps).toEqual([]);
      else {
        const right = O.fairGap(d, item.a, item.b);
        if (right === null) {
          expect(item.gaps).toEqual([]);
          expect(item.gapIndex).toBe(-1);
        } else {
          expect(item.gaps.length).toBe(4);
          expect(item.gaps[item.gapIndex]).toBe(right);
        }
      }
      break;
    }
    case 'together': {
      expect(item.tau).toBe(tauFor(O.position(item.focus)));
      const w = O.windowOf(item.focus, item.tau);
      const inside = item.options.filter((id) => O.overlaps(id, w));
      expect(inside).toEqual([item.options[item.correct]]);
      const delta = O.width(span) / TOGETHER_K[d];
      item.options.forEach((id, i) => {
        expect(id).not.toBe(item.focus);
        if (i !== item.correct) expect(O.gapDecades(O.ends(id), w)).toBeGreaterThanOrEqual(delta - 1e-9);
      });
      break;
    }
  }
}

describe('round generator (design § 11)', () => {
  it('is deterministic per seed', () => {
    for (const mode of MODES) expect(generateRound(42, 'medium', mode, 'all')).toEqual(generateRound(42, 'medium', mode, 'all'));
    expect(generateRound(1, 'easy', 'mixed', 'all').items).not.toEqual(generateRound(2, 'easy', 'mixed', 'all').items);
  });

  it('pins the round shapes and the difficulty tables', () => {
    expect(ROUND_KINDS.mixed).toEqual(['when', 'first', 'order', 'together', 'when', 'first']);
    expect([ROUND_KINDS.when.length, ROUND_KINDS.order.length, ROUND_KINDS.first.length, ROUND_KINDS.together.length]).toEqual([8, 4, 8, 6]);
    expect(TIERS).toEqual({ easy: [1], medium: [1, 2], hard: [1, 2, 3] });
    expect(FILL).toEqual({ easy: [2, 3], medium: [3], hard: [] });
    expect(ORDER_SIZE).toEqual({ easy: 4, medium: 5, hard: 6 });
    expect(PAIR_K).toEqual({ easy: 8, medium: 16, hard: 48 });
    expect(TOGETHER_K).toEqual({ easy: 8, medium: 16, hard: 32 });
  });

  it('computes the span widths like the oracle', () => {
    for (const s of SPANS) expect(spanWidth(s)).toBeCloseTo(O.width(s), 9);
  });

  it('satisfies every rule for 40 seeds × 5 modes × 5 spans × 3 difficulties (checked by the oracle)', () => {
    for (let seed = 0; seed < 40; seed++)
      for (const mode of MODES)
        for (const span of SPANS)
          for (const d of DIFFICULTIES) {
            const g = generateRound(seed * 7919 + 13, d, mode, span);
            expect(g.items.map((i) => i.kind).length).toBe(ROUND_KINDS[mode].length);
            g.items.forEach((item, i) => {
              if (!g.fallbacks.some((f) => f.index === i && f.level === 3)) expect(item.kind).toBe(ROUND_KINDS[mode][i]);
              checkItem(item, span, d);
            });
            // No event is the subject twice, unless fallback (1) or (2) was used.
            if (!g.fallbacks.length) {
              const all = g.items.flatMap(subjects);
              expect(new Set(all).size).toBe(all.length);
            }
            expect(g.items.filter((i) => i.kind === 'first' && i.pair).length).toBeLessThanOrEqual(MAX_CURATED);
          }
  });

  it('uses curated pairs in some rounds', () => {
    let used = 0;
    for (let seed = 0; seed < 50; seed++) used += generateRound(seed, 'hard', 'first', 'all').items.filter((i) => i.kind === 'first' && i.pair).length;
    expect(used).toBeGreaterThan(0);
  });
});
