import { describe, expect, it } from 'vitest';
import { drawTerrainMap, type TerrainMap } from '@wp/strategy-art';
import { TERRAIN_NAMES } from '../src/draw';
import { recorder, withPath2D } from './canvas';

withPath2D();

const COLOURS = { plain: '#e7e3d4', road: '#cfc8b4', forest: '#b9d0ae', hill: '#ddcfa8', urban: '#d3d1cc', swamp: '#c4d3c2', water: '#a9c7dd', ridge: '#c4bfb3' } as Record<string, string>;
const colours = { base: (n: string) => COLOURS[n] ?? '#dddddd', dark: false };
const calls = (map: TerrainMap, view: 'profile' | 'top' = 'profile', detail: 'fine' | 'coarse' = 'coarse') => {
  const { g, calls: list } = recorder();
  drawTerrainMap(g, map, 44, colours, view, detail);
  return list;
};
/** A map with every terrain in clusters: a lake, a forest, a town, hills, a mountain chain, a road. */
const MIXED: TerrainMap = {
  w: 8,
  h: 6,
  terrain: ['..ff..hh', '.fff.hh.', '==========='.slice(0, 8), '~~..uu^^', '~~.uuu^.', 's...u.^^'].join('')
};

describe('terrain renderer', () => {
  it('is deterministic: the same map is drawn the same way every time', () => {
    for (const view of ['profile', 'top'] as const) expect(calls(MIXED, view)).toEqual(calls(MIXED, view));
  });

  it('gives every terrain its own pattern, not only its own colour', () => {
    // One cell of each terrain, all in the same colour: the drawings still differ.
    const grey = { base: () => '#bbbbbb', dark: false };
    const seen = new Map<string, string>();
    for (const view of ['profile', 'top'] as const)
      for (const code of Object.keys(TERRAIN_NAMES)) {
        const { g, calls: list } = recorder();
        drawTerrainMap(g, { w: 1, h: 1, terrain: code }, 44, grey, view, 'coarse');
        const shape = list.filter((c) => !c.includes('Style=')).join(';');
        for (const [other, s] of seen) if (other.endsWith(view)) expect(shape, `${code} vs ${other}`).not.toBe(s);
        seen.set(`${code} ${view}`, shape);
      }
  });

  it('draws hills and towns differently from the side and from above', () => {
    for (const terrain of ['hhhh', 'uuuu', '^^^^']) expect(calls({ w: 2, h: 2, terrain }, 'profile')).not.toEqual(calls({ w: 2, h: 2, terrain }, 'top'));
  });

  it('a feature runs on across a cell border: a road band joins its neighbour', () => {
    // Two road cells side by side: each draws its half band towards the other (to the shared border).
    const list = calls({ w: 2, h: 1, terrain: '==' });
    expect(list).toContain('lineTo(44,22)');
  });

  it('coarse detail draws fewer samples than fine detail', () => {
    expect(calls(MIXED, 'top', 'coarse').length).toBeLessThan(calls(MIXED, 'top', 'fine').length);
  });

  it('lets a lake reach into open ground beside it, never into a town or a mountain chain', () => {
    // Each cell the water pass works on ends with its line of foam.
    const foam = (terrain: string) => calls({ w: 2, h: 1, terrain }).filter((c) => c === 'strokeStyle=rgba(255,255,255,0.32)').length;
    expect(foam('~.')).toBe(2);
    expect(foam('~u')).toBe(1);
    expect(foam('~^')).toBe(1);
  });

  it('copes with unknown codes and an empty map', () => {
    expect(() => calls({ w: 2, h: 1, terrain: '?x' })).not.toThrow();
    expect(() => calls({ w: 0, h: 0, terrain: '' })).not.toThrow();
  });
});
