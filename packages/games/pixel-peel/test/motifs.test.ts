import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { decodeRows } from '../src/art/bake';
import { minPixels, type Tier } from '../src/art/raster';
import { ART_DIFFICULTIES, colourStats, heightOf, sizeClass, sizeProblems, widthFor, type ArtDifficulty } from '../src/art/sizes';
import { COLOUR_NAMES, GROUPS, LOCALES, type BakedArt, type PaletteSpec } from '../src/art/types';
import { artOf, CATALOGUE, findCard, loadAllArt } from '../src/catalogue';
import { pictureFor } from '../src/generate';
import { messages } from '../src/messages';
import { MOTIFS } from '../src/motifs/index';
import { deltaE } from '../src/symbols';

/**
 * The motif data (docs/design/pixel-peel-motifs.md § 6): every motif of every batch, automatically. The authoring
 * rules of design v2 § 1.4 and § 15.3 are checked on the baked pictures a game plays (cheap: no rasterising);
 * motifs.slow.test.ts checks that the baked pictures equal the rasteriser's output.
 */
const LEVELS: readonly { d: ArtDifficulty; tier: Tier; colours: [number, number]; minDeltaE: number }[] = [
  { d: 'easy', tier: 1, colours: [10, 12], minDeltaE: 18 },
  { d: 'medium', tier: 2, colours: [13, 16], minDeltaE: 12 },
  { d: 'hard', tier: 3, colours: [15, 20], minDeltaE: 12 }
];
const BACKDROP_DELTA_E = 15;
const dir = (path: string) => fileURLToPath(new URL(path, import.meta.url));
const filesIn = (path: string) => readdirSync(dir(path)).filter((f) => f.endsWith('.ts')).map((f) => f.slice(0, -3)).sort();

await loadAllArt();

describe('motif collection (design v2 § 9, docs/design/pixel-peel-motifs.md)', () => {
  it('has at least 20 motifs in start-screen group order (seasons, landscapes, animals, scenes, landmarks); unique ids, none starting with "any"', () => {
    expect(MOTIFS.length).toBeGreaterThanOrEqual(20);
    const ids = MOTIFS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id.startsWith('any'), id).toBe(false);
    const ranks = MOTIFS.map((m) => GROUPS.indexOf(m.group));
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    for (const group of ['season', 'landscape', 'animal', 'scene'] as const) expect(MOTIFS.some((m) => m.group === group), group).toBe(true);
  });

  it('keeps every v1 and v2 motif id, so older saves keep their titles', () => {
    for (const id of ['cherry-blossom', 'summer-meadow', 'autumn-forest', 'winter-village', 'desert-dunes', 'fjord', 'rice-terraces', 'coral-reef', 'aurora', 'red-fox', 'elephant', 'koala', 'llama', 'tiger', 'polar-bear', 'hummingbird', 'emperor-penguin', 'reading-nook', 'market-stall', 'kitchen-window']) {
      expect(MOTIFS.some((m) => m.id === id), id).toBe(true);
    }
  });

  it('the cards a game knows are generated from the motifs: same order, ids, groups, aspects, titles and places (run the bake)', () => {
    expect(CATALOGUE.map((c) => c.id)).toEqual(MOTIFS.map((m) => m.id));
    for (const motif of MOTIFS) {
      const card = findCard(motif.id)!;
      expect({ group: card.group, aspect: card.aspect, title: card.title, place: card.place }, motif.id).toEqual({ group: motif.group, aspect: motif.aspect, title: motif.title, place: motif.place });
    }
  });

  it('one generated cards file per batch and one baked file per motif, nothing stale (run the full bake)', () => {
    expect(filesIn('../src/motifs/cards')).toEqual(filesIn('../src/motifs/batches'));
    expect(filesIn('../src/motifs/baked')).toEqual(MOTIFS.map((m) => m.id).sort());
    for (const name of filesIn('../src/motifs/batches')) expect(name, 'batch file name: two digits, a dash, a name').toMatch(/^\d\d-[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });
});

for (const motif of MOTIFS) {
  describe(`motif ${motif.id}`, () => {
    const entries = Object.entries(motif.palette) as [string, PaletteSpec][];
    const art = (): BakedArt => artOf(motif.id)!;

    it('has valid data: id, palette keys and names, tiers with merge chains ending in tier 1', () => {
      expect(motif.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(motif.id.length).toBeLessThanOrEqual(32);
      expect(GROUPS).toContain(motif.group);
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

    it('its baked art matches the motif: backdrop and palette in order', () => {
      expect(art(), 'baked art (run scripts/render-motifs.ts --bake)').toBeDefined();
      expect(art().backdrop).toBe(motif.backdrop);
      expect(art().palette).toEqual(entries.map(([k, spec]) => [k, spec[0], spec[1]]));
    });

    it('sizes: a usable size override (if any), more pixels with each difficulty, large-area pictures at least as large as the others', () => {
      if (motif.size) expect(sizeProblems(motif.aspect, motif.size)).toEqual([]);
      const widths = ART_DIFFICULTIES.map((d) => widthFor(motif, d));
      expect(sizeProblems(motif.aspect, widths)).toEqual([]);
      const cells = (w: number) => w * heightOf(motif, w);
      // Hard has at least as many cells as a 48 × 48 square for large-area pictures, as a 48 × 36 one for the rest.
      expect(cells(widths[2]!)).toBeGreaterThanOrEqual(sizeClass(motif.group) === 'large' ? 2048 : 1728);
    });

    for (const level of LEVELS) {
      const w = widthFor(motif, level.d);
      it(`${level.d} at ${w} × ${heightOf(motif, w)}: ${level.colours[0]}–${level.colours[1]} colours, each ≥ ${minPixels(w)} pixels, distinguishable, mostly filled, colours that matter`, () => {
        const rows = decodeRows(art().rows[LEVELS.indexOf(level)]!)!;
        expect(rows).toHaveLength(heightOf(motif, w));
        for (const row of rows) expect(row).toHaveLength(w);
        const picture = pictureFor(motif, level.d);
        expect(picture.rows).toEqual(rows);
        // Exactly the palette's keys of this tier are played: no colour merged away (the title line relies on it).
        const tierKeys = entries.filter(([, spec]) => spec[2] <= level.tier).map(([k]) => k);
        expect(picture.palette.map((p) => p.key)).toEqual(tierKeys);
        expect(picture.palette.length).toBeGreaterThanOrEqual(level.colours[0]);
        expect(picture.palette.length).toBeLessThanOrEqual(level.colours[1]);
        const flat = rows.join('');
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
        // Colours must really matter (owner feedback 2026-10-18): the effective number of colours 1 / Σ p², and on
        // hard at least 12 colours with ≥ 2 % of the picture each and no colour above 25 %.
        const stats = colourStats(rows);
        if (level.d === 'medium') expect(stats.effective, 'effective colours').toBeGreaterThanOrEqual(6);
        if (level.d === 'hard') {
          expect(stats.effective, 'effective colours').toBeGreaterThanOrEqual(8);
          expect(stats.atLeast2, 'colours with ≥ 2 %').toBeGreaterThanOrEqual(12);
          expect(stats.largest, 'largest colour share').toBeLessThanOrEqual(0.25);
        }
      });
    }

    it('has a title (≤ 32 characters) and a place (≤ 120 characters) in all 16 locales; the start-screen label is the title', () => {
      for (const locale of LOCALES) {
        expect(motif.title[locale].trim(), `${locale} title`).not.toBe('');
        expect(motif.title[locale].length, `${locale} title`).toBeLessThanOrEqual(32);
        expect(motif.place[locale].trim(), `${locale} place`).not.toBe('');
        expect(motif.place[locale].length, `${locale} place`).toBeLessThanOrEqual(120);
        expect(messages[locale]![`motif.${motif.id}`], locale).toBe(motif.title[locale]);
      }
    });
  });
}
