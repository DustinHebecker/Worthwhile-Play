import { describe, expect, it } from 'vitest';
import { ART_DIFFICULTIES, ASPECTS, heightOf, MAX_CELLS, MAX_HEIGHT, MAX_WIDTH, MIN_WIDTH, sizeClass, sizeProblems, widthFor, WIDTHS } from '../src/art/sizes';
import { GROUPS, type Aspect } from '../src/art/types';

describe('picture sizes (docs/design/pixel-peel-motifs.md § 3)', () => {
  it('the size table is usable for every aspect and size class, and keeps the v2 sizes of square and wide pictures', () => {
    for (const aspect of Object.keys(ASPECTS) as Aspect[]) for (const cls of ['other', 'large'] as const) expect(sizeProblems(aspect, WIDTHS[aspect][cls]), `${aspect} ${cls}`).toEqual([]);
    // v2 § 15.1: the 20 motifs keep their pictures.
    expect(WIDTHS.square).toEqual({ other: [32, 40, 48], large: [36, 44, 56] });
    expect(WIDTHS.wide).toEqual({ other: [36, 44, 56], large: [40, 48, 64] });
  });

  it('heights follow the aspect: 1:1, 4:3, 3:4 and 2:1', () => {
    expect(heightOf({ aspect: 'square' }, 48)).toBe(48);
    expect(heightOf({ aspect: 'wide' }, 64)).toBe(48);
    expect(heightOf({ aspect: 'tall' }, 45)).toBe(60);
    expect(heightOf({ aspect: 'panorama' }, 64)).toBe(32);
  });

  it('seasons, landscapes and landmarks are large-area pictures; animals and scenes are not', () => {
    expect(GROUPS.filter((g) => sizeClass(g) === 'large')).toEqual(['season', 'landscape', 'landmark']);
  });

  it('a size override is used only when it is usable', () => {
    const tower = { group: 'landmark', aspect: 'tall' } as const;
    expect(ART_DIFFICULTIES.map((d) => widthFor(tower, d))).toEqual([33, 39, 45]);
    expect(ART_DIFFICULTIES.map((d) => widthFor({ ...tower, size: [30, 36, 42] }, d))).toEqual([30, 36, 42]);
    // Not a multiple of 3, too tall, not increasing: the table wins.
    for (const size of [[31, 36, 42], [36, 42, 48], [36, 36, 42]] as const) expect(ART_DIFFICULTIES.map((d) => widthFor({ ...tower, size }, d))).toEqual([33, 39, 45]);
  });

  it('sizeProblems names every broken rule', () => {
    expect(sizeProblems('tall', [31, 36, 48]).join('\n')).toMatch(/multiple of 3[\s\S]*height 64 is above 60/);
    expect(sizeProblems('square', [20, 40, 48])).toEqual([`easy: width 20 is outside ${MIN_WIDTH}–${MAX_WIDTH}`]);
    expect(sizeProblems('wide', [40, 40, 44]).join('\n')).toContain('not larger than the one before');
    expect(sizeProblems('panorama', [48, 56])).toEqual(['three widths are needed: easy, medium, hard']);
    expect(sizeProblems('square', [32, 40, 48.5]).join('\n')).toContain('not a whole number');
    expect(sizeProblems('square', [32, 40, 60])).toEqual([`hard: 60 × 60 is more than ${MAX_CELLS} cells`]);
    expect(MAX_HEIGHT).toBe(60);
  });
});
