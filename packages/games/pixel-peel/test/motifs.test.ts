import { describe, expect, it } from 'vitest';
import { decodeRows } from '../src/art/bake';
import { minPixels, rasteriseReport, type Tier } from '../src/art/raster';
import { colourStats, isLandscape, widthFor, type ArtDifficulty } from '../src/art/sizes';
import { COLOUR_NAMES, GROUPS, LOCALES, type PaletteSpec } from '../src/art/types';
import { pictureFor } from '../src/generate';
import { messages } from '../src/messages';
import { BAKED } from '../src/motifs/baked';
import { MOTIFS } from '../src/motifs/index';
import { deltaE } from '../src/symbols';

/** The authoring rules of design v2 § 1.4 that are tests, at every difficulty with its width and tier. */
const LEVELS: readonly { d: ArtDifficulty; tier: Tier; colours: [number, number]; minDeltaE: number }[] = [
  { d: 'easy', tier: 1, colours: [10, 12], minDeltaE: 18 },
  { d: 'medium', tier: 2, colours: [13, 16], minDeltaE: 12 },
  { d: 'hard', tier: 3, colours: [15, 20], minDeltaE: 12 }
];
const BACKDROP_DELTA_E = 15;

describe('motif collection (design v2 § 9)', () => {
  it('has at least 16 motifs (20 planned): seasons, landscapes, animals, scenes; unique ids that are not "any"', () => {
    expect(MOTIFS.length).toBeGreaterThanOrEqual(16);
    const ids = MOTIFS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain('any');
    const ranks = MOTIFS.map((m) => GROUPS.indexOf(m.group));
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    for (const group of GROUPS) expect(MOTIFS.some((m) => m.group === group), group).toBe(true);
  });

  it('keeps every v1 motif id, so v1 saves keep their titles', () => {
    for (const id of ['cherry-blossom', 'summer-meadow', 'autumn-forest', 'winter-village', 'desert-dunes', 'fjord', 'rice-terraces', 'red-fox', 'elephant', 'koala', 'llama', 'tiger']) {
      expect(MOTIFS.some((m) => m.id === id), id).toBe(true);
    }
  });
});

for (const motif of MOTIFS) {
  describe(`motif ${motif.id}`, () => {
    const entries = Object.entries(motif.palette) as [string, PaletteSpec][];

    it('has valid data: id, palette keys and names, tiers with merge chains ending in tier 1', () => {
      expect(motif.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(motif.id.length).toBeLessThanOrEqual(32);
      expect(motif.backdrop).toMatch(/^#[0-9a-f]{6}$/);
      expect(entries.length).toBeGreaterThanOrEqual(15);
      expect(entries.length).toBeLessThanOrEqual(20);
      const names = entries.map(([, spec]) => spec[1]);
      expect(new Set(names).size, 'names unique').toBe(names.length);
      for (const [key, [hex, name, tier, merge]] of entries) {
        expect(key).toMatch(/^[a-z]$/);
        expect(hex).toMatch(/^#[0-9a-f]{6}$/);
        expect(COLOUR_NAMES).toContain(name);
        expect([1, 2, 3]).toContain(tier);
        if (tier > 1) {
          // The chain ends in tier 1 within a few steps.
          let cur: string | undefined = key;
          for (let k = 0; k < 5 && cur && (motif.palette[cur] as PaletteSpec)[2] > 1; k++) cur = (motif.palette[cur] as PaletteSpec)[3];
          expect(cur && (motif.palette[cur] as PaletteSpec)[2], `${key} merges to tier 1`).toBe(1);
          expect(merge).toBeDefined();
        }
      }
      expect(motif.layers.length).toBeGreaterThan(5);
    });

    for (const level of LEVELS) {
      const w = widthFor(motif, level.d);
      it(`${level.d} at ${w} cells: ${level.colours[0]}–${level.colours[1]} colours, each ≥ ${minPixels(w)} pixels, distinguishable, mostly filled, little despeckle; the baked picture matches`, () => {
        const t0 = performance.now();
        const r = rasteriseReport(motif, w, level.tier);
        const ms = performance.now() - t0;
        const { picture } = r;
        // The baked picture (what a game uses) is exactly the rasteriser's output.
        const baked = BAKED[motif.id]?.[LEVELS.indexOf(level)];
        expect(baked, 'baked (run scripts/render-motifs.ts --bake)').toBeDefined();
        expect(decodeRows(baked!), 'baked rows equal the rasteriser (run scripts/render-motifs.ts --bake)').toEqual(picture.rows);
        expect(pictureFor(motif, level.d).rows).toEqual(picture.rows);
        // Exactly the palette's keys of this tier are played: no colour merged away (the start-screen label relies on it).
        const tierKeys = entries.filter(([, spec]) => spec[2] <= level.tier).map(([k]) => k);
        expect(picture.palette.map((p) => p.key)).toEqual(tierKeys);
        expect(r.mergedForSize).toEqual([]);
        expect(r.orphans).toEqual([]);
        expect(picture.palette.length).toBeGreaterThanOrEqual(level.colours[0]);
        expect(picture.palette.length).toBeLessThanOrEqual(level.colours[1]);
        const flat = picture.rows.join('');
        for (const p of picture.palette) expect(flat.split(p.key).length - 1, `pixels of ${p.key}`).toBeGreaterThanOrEqual(minPixels(w));
        for (let i = 0; i < picture.palette.length; i++) {
          const a = picture.palette[i]!;
          expect(deltaE(a.hex, picture.backdrop), `${a.key} vs backdrop`).toBeGreaterThanOrEqual(BACKDROP_DELTA_E);
          for (let j = i + 1; j < picture.palette.length; j++) {
            const b = picture.palette[j]!;
            expect(deltaE(a.hex, b.hex), `${a.key} vs ${b.key}`).toBeGreaterThanOrEqual(level.minDeltaE);
          }
        }
        const filled = flat.replace(/\./g, '').length;
        expect(filled / flat.length).toBeGreaterThanOrEqual(0.5);
        expect(r.despeckled / flat.length).toBeLessThanOrEqual(0.02);
        // Supersampled rasterising runs only when baking and in this test; a game reads the baked picture.
        expect(ms).toBeLessThan(3000);
        // Colours must really matter (owner feedback 2026-10-18): the effective number of colours 1 / Σ p², and on
        // hard at least 12 colours with ≥ 2 % of the picture each and no colour above 25 %.
        const stats = colourStats(picture.rows);
        if (level.d === 'medium') expect(stats.effective, 'effective colours').toBeGreaterThanOrEqual(6);
        if (level.d === 'hard') {
          expect(stats.effective, 'effective colours').toBeGreaterThanOrEqual(8);
          expect(stats.atLeast2, 'colours with ≥ 2 %').toBeGreaterThanOrEqual(12);
          expect(stats.largest, 'largest colour share').toBeLessThanOrEqual(0.25);
        }
      });
    }

    it('uses more pixels on hard: at least 48 wide, landscapes at least 56', () => {
      expect(widthFor(motif, 'hard')).toBeGreaterThanOrEqual(isLandscape(motif) ? 56 : 48);
      expect(widthFor(motif, 'medium')).toBeLessThan(widthFor(motif, 'hard'));
      expect(widthFor(motif, 'easy')).toBeLessThan(widthFor(motif, 'medium'));
      if (motif.aspect === 'wide') for (const d of ['easy', 'medium', 'hard'] as const) expect(widthFor(motif, d) % 4, d).toBe(0);
    });

    it('has a title (≤ 32 characters) and a place in all 16 locales; the start-screen label is the title', () => {
      for (const locale of LOCALES) {
        expect(motif.title[locale].trim(), `${locale} title`).not.toBe('');
        expect(motif.title[locale].length, `${locale} title`).toBeLessThanOrEqual(32);
        expect(motif.place[locale].trim(), `${locale} place`).not.toBe('');
        expect(messages[locale]![`motif.${motif.id}`], locale).toBe(motif.title[locale]);
      }
    });
  });
}

describe('baked pictures (design v2 § 1.7)', () => {
  it('a game reads every picture from the baked data in well under a millisecond each', () => {
    const t0 = performance.now();
    for (const motif of MOTIFS) for (const d of ['easy', 'medium', 'hard'] as const) pictureFor(motif, d);
    expect(performance.now() - t0).toBeLessThan(500);
    expect(Object.keys(BAKED).sort()).toEqual(MOTIFS.map((m) => m.id).sort());
  });
});
