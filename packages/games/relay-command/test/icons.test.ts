import { describe, expect, it } from 'vitest';
import { ICON_CATEGORY, MARKS, frameD } from '../src/icons';
import { RULESET } from '../src/rules';

describe('icon set A', () => {
  it('every kind of the ruleset has its own icon (no shared dot fallback)', () => {
    const kinds = Object.keys(RULESET.archetypes);
    for (const kind of kinds) {
      expect(ICON_CATEGORY[kind], kind).toBeDefined();
      expect(MARKS[kind]?.length, kind).toBeGreaterThan(0);
    }
    // Marks differ between kinds except where a function is deliberately shared (command source, artillery).
    const shared = new Set(['command-post|field-post', 'howitzer|tower-artillery']);
    for (let i = 0; i < kinds.length; i++) {
      for (let j = i + 1; j < kinds.length; j++) {
        const [a = '', b = ''] = [kinds[i]!, kinds[j]!].sort();
        const same = JSON.stringify(MARKS[a]) === JSON.stringify(MARKS[b]) && ICON_CATEGORY[a] === ICON_CATEGORY[b];
        if (same) expect(shared.has(`${a}|${b}`), `${a} and ${b} look alike`).toBe(true);
      }
    }
  });

  it('own and enemy frames differ for every category (side is told by shape, not colour alone)', () => {
    for (const cat of ['inf', 'veh', 'air', 'str', 'def'] as const) expect(frameD(cat, true)).not.toBe(frameD(cat, false));
  });
});
