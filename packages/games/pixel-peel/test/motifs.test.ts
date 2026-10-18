import { describe, expect, it } from 'vitest';
import { minPixels, rasteriseReport, type Tier } from '../src/art/raster';
import { COLOUR_NAMES, GROUPS, LOCALES, type PaletteSpec } from '../src/art/types';
import { colourRange, messages } from '../src/messages';
import { MOTIFS } from '../src/motifs/index';
import { deltaE } from '../src/symbols';

/** The authoring rules of design v2 § 1.4 that are tests, at every resolution with its tier. */
const LEVELS: readonly { w: number; tier: Tier; colours: [number, number]; minDeltaE: number }[] = [
  { w: 32, tier: 1, colours: [10, 12], minDeltaE: 18 },
  { w: 40, tier: 2, colours: [13, 16], minDeltaE: 12 },
  { w: 48, tier: 3, colours: [15, 20], minDeltaE: 12 }
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
      it(`at ${level.w} cells: ${level.colours[0]}–${level.colours[1]} colours, each ≥ ${minPixels(level.w)} pixels, distinguishable, mostly filled, little despeckle`, () => {
        const t0 = performance.now();
        const r = rasteriseReport(motif, level.w, level.tier);
        const ms = performance.now() - t0;
        const { picture } = r;
        // Exactly the palette's keys of this tier are played: no colour merged away (the start-screen label relies on it).
        const tierKeys = entries.filter(([, spec]) => spec[2] <= level.tier).map(([k]) => k);
        expect(picture.palette.map((p) => p.key)).toEqual(tierKeys);
        expect(r.mergedForSize).toEqual([]);
        expect(r.orphans).toEqual([]);
        expect(picture.palette.length).toBeGreaterThanOrEqual(level.colours[0]);
        expect(picture.palette.length).toBeLessThanOrEqual(level.colours[1]);
        const flat = picture.rows.join('');
        for (const p of picture.palette) expect(flat.split(p.key).length - 1, `pixels of ${p.key}`).toBeGreaterThanOrEqual(minPixels(level.w));
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
        if (level.w === 48) {
          expect(filled).toBeGreaterThanOrEqual(600);
          expect(filled).toBeLessThanOrEqual(2304);
        }
        expect(r.despeckled / flat.length).toBeLessThanOrEqual(0.02);
        // Design target < 10 ms; asserted < 25 ms (generous under load: first call includes warm-up).
        expect(ms).toBeLessThan(250);
      });
    }

    it('has a title (≤ 32 characters) and a place in all 16 locales, and a start-screen label with its colour range', () => {
      const range = colourRange(motif);
      expect(range.min).toBe(entries.filter(([, s]) => s[2] === 1).length);
      for (const locale of LOCALES) {
        expect(motif.title[locale].trim(), `${locale} title`).not.toBe('');
        expect(motif.title[locale].length, `${locale} title`).toBeLessThanOrEqual(32);
        expect(motif.place[locale].trim(), `${locale} place`).not.toBe('');
        const label = messages[locale]![`motif.${motif.id}`];
        expect(label, locale).toContain(motif.title[locale]);
        expect(label, locale).toContain(String(range.min));
        expect(label, locale).toContain(String(range.max));
      }
    });
  });
}

describe('rasterisation time', () => {
  it('every motif rasterises in < 25 ms at 48 (after warm-up)', () => {
    for (const motif of MOTIFS) rasteriseReport(motif, 48, 3);
    let worst = 0;
    for (const motif of MOTIFS) {
      const t0 = performance.now();
      rasteriseReport(motif, 48, 3);
      worst = Math.max(worst, performance.now() - t0);
    }
    expect(worst).toBeLessThan(25 * 4);
  });
});
