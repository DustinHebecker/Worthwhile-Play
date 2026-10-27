import { expect } from 'vitest';
import { CURATED } from '../src/events';
import { ORDER_SIZE, PAIR_K, TOGETHER_K, type Difficulty, type NewItem, type Span } from '../src/generate';
import { tauFor } from '../src/score';
import * as O from './oracle';

/** Checks one generated item against the oracle (design § 11.4). */
export function checkItem(item: NewItem, span: Span, d: Difficulty) {
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
