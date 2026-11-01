import { describe, expect, it } from 'vitest';
import { PROFILE, TOP } from '@wp/strategy-art';
import { ENEMY_ICON, TOWER_ICON } from '../src/draw';
import { ENEMY_KINDS, FAMILIES } from '../src/ruleset';

describe('pictures in the strategy look', () => {
  it('every tower family has a strategy picture in both views, and the families look different', () => {
    for (const family of FAMILIES) {
      expect(PROFILE[TOWER_ICON[family]], family).toBeDefined();
      expect(TOP[TOWER_ICON[family]], family).toBeDefined();
    }
    expect(new Set(Object.values(TOWER_ICON)).size).toBe(FAMILIES.length);
  });

  it('every wave unit has a picture; units sharing one differ in size', () => {
    const seen = new Map<string, number[]>();
    for (const kind of ENEMY_KINDS) {
      const [icon, size] = ENEMY_ICON[kind]!;
      expect(PROFILE[icon], kind).toBeDefined();
      const sizes = seen.get(icon) ?? [];
      expect(sizes, `${kind} needs its own size`).not.toContain(size);
      seen.set(icon, [...sizes, size]);
    }
  });
});
