import { describe, expect, it } from 'vitest';
import { archetypeOf, needsDeploy } from '@wp/strategy-engine';
import { drawIcon, mix, PROFILE, TOP, VIEWS } from '../src/icons';
import { RULESET } from '../src/rules';
import { recorder, withPath2D } from './canvas';

withPath2D();

const style = { own: true, colour: '#24508f', surface: '#ffffff' };
const draw = (kind: string, extra: Partial<Parameters<typeof drawIcon>[5]> = {}) => {
  const { g, calls } = recorder();
  const drawn = drawIcon(g, kind, 0, 0, 1, { ...style, ...extra });
  return { drawn, calls };
};

describe('unit pictures', () => {
  const kinds = Object.keys(RULESET.archetypes);

  it('every kind of the ruleset has its own picture from the side and from above', () => {
    for (const set of [PROFILE, TOP]) {
      for (const kind of kinds) expect(set[kind]?.parts.length, kind).toBeGreaterThan(0);
      // No two kinds look alike (the shared fallback dot is gone).
      for (let i = 0; i < kinds.length; i++)
        for (let j = i + 1; j < kinds.length; j++) expect(JSON.stringify(set[kinds[i]!]), `${kinds[i]} and ${kinds[j]}`).not.toBe(JSON.stringify(set[kinds[j]!]));
    }
  });

  it('every kind that is set up in place stands on outrigger legs, in both views', () => {
    for (const kind of kinds.filter((k) => needsDeploy(archetypeOf(RULESET, k)))) {
      expect(PROFILE[kind]?.legs, kind).toBe(true);
      expect(TOP[kind]?.legs, kind).toBe(true);
    }
  });

  it('draws every kind in both views, and nothing for an unknown kind', () => {
    for (const view of VIEWS) for (const kind of kinds) expect(draw(kind, { view }).drawn, `${kind} ${view}`).toBe(true);
    expect(draw('no-such-kind').drawn).toBe(false);
  });

  it('without Path2D it draws nothing (the caller falls back to a token)', () => {
    (globalThis as { Path2D?: unknown }).Path2D = undefined;
    expect(draw('rifles').drawn).toBe(false);
  });

  it('the enemy faces the other way: mirrored from the side, turned round from above', () => {
    expect(draw('outrider', { own: false }).calls).toContain('scale(-1,1)');
    expect(draw('outrider').calls).not.toContain('scale(-1,1)');
    expect(draw('outrider', { own: false, view: 'top' }).calls).toContain(`rotate(${Math.round(Math.PI * 100) / 100})`);
    expect(draw('outrider', { view: 'top' }).calls.some((c) => c.startsWith('rotate('))).toBe(false);
  });

  it('own units are filled in the side colour, enemies in a pale tint of it (not colour alone)', () => {
    expect(draw('rifles').calls).toContain('fillStyle=#24508f');
    expect(draw('rifles', { own: false }).calls).not.toContain('fillStyle=#24508f');
    expect(draw('rifles', { own: false }).calls).toContain(`fillStyle=${mix('#24508f', '#ffffff', 0.8)}`);
  });

  it('a set-up vehicle stands on legs instead of wheels', () => {
    const rolling = draw('mast-truck').calls.filter((c) => c.startsWith('arc(')).length;
    const setUp = draw('mast-truck', { deployed: true }).calls.filter((c) => c.startsWith('arc(')).length;
    expect(rolling).toBeGreaterThan(setUp);
  });

  it('a site is dashed and shows the turns left; a ghost is dashed', () => {
    const site = draw('muster', { site: 3 }).calls;
    expect(site).toContain('fillText(3,22,27)');
    expect(site.some((c) => c.startsWith('setLineDash(obj') || c === 'setLineDash(obj)')).toBe(true);
    expect(draw('rifles', { ghost: true }).calls).not.toContain('fillStyle=#24508f');
  });

  it('mix blends two colours', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mix('#24508f', '#24508f', 0.3)).toBe('#24508f');
    expect(mix('#ff0000', '#0000ff', 0)).toBe('#ff0000');
    expect(mix('#ff0000', '#0000ff', 1)).toBe('#0000ff');
    // Anything but #rrggbb is left as it is.
    expect(mix('red', '#0000ff', 0.5)).toBe('red');
    expect(mix('#ff0000', 'blue', 0.5)).toBe('#ff0000');
  });
});
