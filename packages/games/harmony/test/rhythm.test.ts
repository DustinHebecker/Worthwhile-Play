import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { LEVELS } from '../src/levels';
import { CELLS, SLOTS, allPatterns, distance, isPattern, notation, onsets, slots } from '../src/rhythm';

describe('rhythm model (design § 7.5)', () => {
  it('slot vectors and distance', () => {
    expect(slots([2, 1, 1, 4])).toEqual(['onset', 'held', 'onset', 'onset', 'onset', 'held', 'held', 'held']);
    expect(slots([-1, 1, -2, 2, -2])).toEqual(['silent', 'onset', 'silent', 'silent', 'onset', 'held', 'silent', 'silent']);
    expect(distance([2, 2, 2, 2], [2, 2, 2, 2])).toBe(0);
    expect(distance([2, 2, 2, 2], [4, 2, 2])).toBe(1);
    expect(distance([2, 2, 2, 2], [-2, 2, 4])).toBe(3);
    expect(distance([2, 2, 2, 2], [1, 1, 2, 2, 2])).toBe(1);
  });

  it('every pattern sums to 8, comes from its level cells, is distinct and has ≥ 2 notes', () => {
    for (const level of LEVELS) {
      const all = allPatterns(level);
      expect(new Set(all.map((p) => p.join())).size).toBe(all.length);
      for (const p of all) {
        expect(p.reduce((a, d) => a + Math.abs(d), 0)).toBe(SLOTS);
        expect(onsets(p)).toBeGreaterThanOrEqual(2);
        if (level !== 'hard') expect(p[0]).toBeGreaterThan(0);
        expect(isPattern(p, level)).toBe(true);
      }
    }
    expect(allPatterns('easy')).toHaveLength(25);
    expect(allPatterns('medium')).toHaveLength(49);
    expect(allPatterns('hard').length).toBeGreaterThan(300);
    // Every medium pattern is a hard pattern, every easy one a medium one.
    for (const p of allPatterns('easy')) expect(isPattern(p, 'medium')).toBe(true);
    for (const p of allPatterns('medium')) expect(isPattern(p, 'hard')).toBe(true);
    expect(CELLS.easy.two).toEqual([[4]]);
  });

  it('rejects junk patterns without throwing', () => {
    expect(isPattern([2, 2, 2], 'easy')).toBe(false);
    expect(isPattern([3, 1, 2, 2], 'easy')).toBe(false);
    expect(isPattern([-2, 2, 4], 'medium')).toBe(false);
    expect(isPattern([-2, 2, 4], 'hard')).toBe(true);
    expect(isPattern([1.5, 1.5, 1, 4], 'hard')).toBe(false);
    fc.assert(fc.property(fc.anything(), (v) => { expect(() => isPattern(v, 'hard')).not.toThrow(); }));
  });

  it('notation: glyphs per duration, eighths beamed in pairs within a beat, lone eighths flagged', () => {
    expect(notation([1, 1, 2, 3, 1])).toEqual([
      { slot: 0, glyph: 'eighth', beam: 0 },
      { slot: 1, glyph: 'eighth', beam: 0 },
      { slot: 2, glyph: 'quarter', beam: -1 },
      { slot: 4, glyph: 'dotted-quarter', beam: -1 },
      { slot: 7, glyph: 'eighth', beam: -1 }
    ]);
    expect(notation([1, 2, 1, -1, 1, -2]).map((e) => `${e.glyph}:${e.beam}`)).toEqual(['eighth:-1', 'quarter:-1', 'eighth:-1', 'rest-eighth:-1', 'eighth:-1', 'rest-quarter:-1']);
    expect(notation([1, 1, 1, 1, 4]).map((e) => e.beam)).toEqual([0, 0, 1, 1, -1]);
    expect(notation([4, 4]).map((e) => e.glyph)).toEqual(['half', 'half']);
    // A half rest fills beats 1–2 or 3–4; quarter rests on beats 2–3 stay two quarter rests.
    expect(notation([-2, -2, 2, 1, 1]).map((e) => `${e.slot}:${e.glyph}`)).toEqual(['0:rest-half', '4:quarter', '6:eighth', '7:eighth']);
    expect(notation([1, 1, 2, -2, -2]).map((e) => e.glyph)).toEqual(['eighth', 'eighth', 'quarter', 'rest-half']);
    expect(notation([2, -2, -2, 2]).map((e) => e.glyph)).toEqual(['quarter', 'rest-quarter', 'rest-quarter', 'quarter']);
    // Every pattern of every level is notated without a gap or overlap: the glyph lengths fill the bar.
    const LEN: Record<string, number> = { eighth: 1, quarter: 2, 'dotted-quarter': 3, half: 4, 'rest-eighth': 1, 'rest-quarter': 2, 'rest-half': 4 };
    for (const level of LEVELS)
      for (const p of allPatterns(level)) {
        const ev = notation(p);
        ev.forEach((e, i) => expect(e.slot + LEN[e.glyph]!, p.join()).toBe(ev[i + 1]?.slot ?? SLOTS));
      }
  });
});
