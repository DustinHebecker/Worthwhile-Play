import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { hash32, minPixels, rasterise, rasteriseReport, shapeMask } from '../src/art/raster';
import { cosDeg, sinDeg } from '../src/art/trig';
import type { Layer, Motif, PaletteSpec } from '../src/art/types';

const TEXT = { de: 'x', en: 'x', nl: 'x', es: 'x', fr: 'x', ru: 'x', 'zh-Hans': 'x', ko: 'x', ja: 'x', ar: 'x', pt: 'x', it: 'x', pl: 'x', tr: 'x', uk: 'x', hi: 'x' };

const motif = (layers: Layer[], palette: Record<string, PaletteSpec> = { a: ['#000000', 'black', 1], b: ['#ffffff', 'white', 1], c: ['#ff0000', 'red', 1], d: ['#00ff00', 'green', 1] }, extra: Partial<Motif> = {}): Motif => ({
  id: 'test',
  group: 'scene',
  title: TEXT,
  place: TEXT,
  aspect: 'square',
  backdrop: '#808080',
  palette,
  layers,
  ...extra
});

const grid = (w: number) => ({ w, h: w, u: 100 / w });
const count = (mask: Uint8Array) => mask.reduce((n, v) => n + v, 0);
const cellsOf = (rows: string[]) => rows.join('');

/** Small fixture motifs for the golden hashes (one per shape and fill kind). */
const FIXTURES: Motif[] = [
  motif([
    { shape: { all: true }, fill: { gradient: ['a', 'b', 'c'], from: [0, 0], to: [0, 100], soft: 0.5 } },
    { shape: { ellipse: [50, 50, 30, 20], rot: 30 }, fill: 'd', shade: { light: 'b', dark: 'a', dir: 'nw', width: 2 }, outline: 'a' },
    { shape: { star: [30, 30, 15, 6, 5] }, fill: 'c', shade: { light: 'b', dark: 'a', dir: 'n', mode: 'band', amount: 0.3 } },
    { shape: { line: [[5, 95], [60, 70], [95, 90]], width: 1 }, fill: 'a' },
    { shape: { line: [[10, 10], [90, 20]], width: 6 }, fill: 'b' },
    { shape: { rect: [60, 60, 30, 30], round: 6 }, fill: { stripes: ['a', 'c'], width: 5, angle: 45 } },
    { shape: { poly: [[10, 60], [40, 55], [35, 90], [5, 85]], smooth: 2 }, fill: { scatter: 'b', density: 0.3, salt: 7 } },
    { shape: { ellipse: [80, 20, 1, 1] }, fill: 'c', keep: true }
  ])
];

/** FNV-1a over the rows (a stable number to commit). */
const fnv = (rows: string[]) => {
  let h = 0x811c9dc5;
  for (const ch of rows.join('|')) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
};

describe('rasteriser (design v2 § 1.3)', () => {
  it('is deterministic, and the golden hashes of the fixture motif match', () => {
    const fixture = FIXTURES[0]!;
    const hashes = [32, 40, 48].map((w) => fnv(rasteriseReport(fixture, w, 3).picture.rows));
    expect([32, 40, 48].map((w) => fnv(rasteriseReport(fixture, w, 3).picture.rows))).toEqual(hashes);
    // Changing these numbers needs a deliberate rasteriser change, named in its commit.
    expect(hashes).toEqual(GOLDEN);
  });

  it('table trigonometry is within 1e-9 of Math.sin at every integer degree', () => {
    for (let d = -720; d <= 720; d++) {
      expect(Math.abs(sinDeg(d) - Math.sin((d * Math.PI) / 180))).toBeLessThan(1e-9);
      expect(Math.abs(cosDeg(d) - Math.cos((d * Math.PI) / 180))).toBeLessThan(1e-9);
    }
  });

  it('half-open rects tile a grid without gaps or overlaps', () => {
    for (const w of [32, 40, 48]) {
      const total = new Uint8Array(w * w);
      for (let x = 0; x < 100; x += 12.5) for (let y = 0; y < 100; y += 25) shapeMask({ rect: [x, y, 12.5, 25] }, grid(w)).mask.forEach((v, i) => (total[i] = total[i]! + v));
      expect(total.every((v) => v === 1)).toBe(true);
    }
  });

  it('an ellipse with rx = ry is symmetric', () => {
    for (const w of [32, 40, 48]) {
      const { mask } = shapeMask({ ellipse: [50, 50, 23, 23], rot: 17 }, grid(w));
      for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
        expect(mask[y * w + x]).toBe(mask[y * w + (w - 1 - x)]);
        expect(mask[y * w + x]).toBe(mask[(w - 1 - y) * w + x]);
      }
    }
  });

  it('a thin line is 8-connected and one cell wide at all three resolutions', () => {
    fc.assert(
      fc.property(fc.array(fc.tuple(fc.integer({ min: 0, max: 99 }), fc.integer({ min: 0, max: 99 })), { minLength: 2, maxLength: 4 }), fc.constantFrom(32, 40, 48), (pts, w) => {
        const { mask } = shapeMask({ line: pts, width: 1 }, grid(w));
        // 8-connected: a flood fill from one cell reaches every cell.
        const cells = [...mask.keys()].filter((i) => mask[i]);
        const seen = new Set([cells[0]]);
        const stack = [cells[0]!];
        while (stack.length) {
          const c = stack.pop()!;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const x = (c % w) + dx;
            const y = Math.floor(c / w) + dy;
            const n = y * w + x;
            if (x >= 0 && y >= 0 && x < w && y < w && mask[n] && !seen.has(n)) {
              seen.add(n);
              stack.push(n);
            }
          }
        }
        expect(seen.size).toBe(cells.length);
        // One cell wide for a single straight segment: no 2 × 2 block of mask cells.
        if (pts.length === 2) for (let y = 0; y + 1 < w; y++) for (let x = 0; x + 1 < w; x++) expect(mask[y * w + x]! + mask[y * w + x + 1]! + mask[(y + 1) * w + x]! + mask[(y + 1) * w + x + 1]!).toBeLessThan(4);
      }),
      { numRuns: 120 }
    );
  });

  it('keep yields exactly one cell for a sub-cell shape', () => {
    const base: Layer[] = [{ shape: { all: true }, fill: 'a' }, { shape: { rect: [0, 0, 20, 20] }, fill: 'b' }];
    const bs = (rows: string[]) => cellsOf(rows).split('b').length - 1;
    const r = rasteriseReport(motif([...base, { shape: { ellipse: [51, 49, 0.4, 0.4] }, fill: 'b', keep: true }]), 32, 1);
    expect(count(r.masks[2]!)).toBe(1);
    const without = rasteriseReport(motif([...base, { shape: { ellipse: [51, 49, 0.4, 0.4] }, fill: 'b' }]), 32, 1);
    expect(count(without.masks[2]!)).toBe(0);
    expect(bs(r.picture.rows)).toBe(bs(without.picture.rows) + 1);
  });

  it('clip never paints outside its parent; level of detail skips small resolutions', () => {
    const m = motif([
      { shape: { all: true }, fill: 'a' },
      { name: 'disc', shape: { ellipse: [50, 50, 20, 20] }, fill: 'b' },
      { shape: { rect: [0, 40, 100, 20] }, fill: 'c', clip: 'disc' },
      { shape: { rect: [0, 0, 10, 10] }, fill: 'd', min: 48 }
    ]);
    for (const w of [32, 40, 48]) {
      const r = rasteriseReport(m, w, 1);
      const disc = r.masks[1]!;
      r.masks[2]!.forEach((v, i) => v && expect(disc[i]).toBe(1));
      expect(cellsOf(r.picture.rows).includes('d')).toBe(w >= 48);
    }
  });

  it('outline lies inside the mask; rim gives light cells only on the light side', () => {
    const m = motif([
      { shape: { all: true }, fill: 'a' },
      { shape: { rect: [20, 20, 60, 60] }, fill: 'b', shade: { light: 'c', dir: 'n' } },
      { shape: { rect: [30, 30, 40, 40] }, fill: 'b', outline: 'd' }
    ]);
    const r = rasteriseReport(m, 40, 1);
    const rows = r.picture.rows;
    const rect1 = r.masks[1]!;
    const rect2 = r.masks[2]!;
    for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) {
      const ch = rows[y]![x]!;
      if (ch === 'd') expect(rect2[y * 40 + x]).toBe(1);
      if (ch === 'c') {
        expect(rect1[y * 40 + x]).toBe(1);
        expect(rect1[(y - 1) * 40 + x]).toBe(0);
      }
    }
    expect(cellsOf(rows)).toContain('c');
    expect(cellsOf(rows)).toContain('d');
  });

  it('a gradient with soft 0 gives exactly n bands', () => {
    const m = motif([{ shape: { all: true }, fill: { gradient: ['a', 'b', 'c', 'd'], from: [0, 0], to: [0, 100], soft: 0 } }]);
    const r = rasteriseReport(m, 32, 1);
    const bands = r.picture.rows.map((row) => {
      expect(new Set(row).size).toBe(1);
      return row[0];
    });
    expect([...new Set(bands)]).toEqual(['a', 'b', 'c', 'd']);
  });

  it('Bayer dithering is balanced: a half-way band dithers about half its cells (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 3 }), fc.constantFrom(32, 40, 48), (shift, w) => {
        const m = motif([{ shape: { all: true }, fill: { gradient: ['a', 'b'], from: [-shift, 0], to: [200 - shift, 0], soft: 1 } }]);
        const r = rasteriseReport(m, w, 1);
        // Columns around the middle of the first half are dithered ~t of the way: count is monotone and balanced.
        // Share of b in the 4 columns from x (one full Bayer period).
        const share = (x: number) => r.picture.rows.reduce((n, row) => n + [0, 1, 2, 3].filter((k) => row[x + k] === 'b').length, 0) / (4 * w);
        let last = -1;
        for (let x = 0; x + 4 <= w; x += 4) {
          expect(share(x)).toBeGreaterThanOrEqual(last - 0.07);
          last = share(x);
        }
        // At x = 50 units, t ≈ 0.25, so half way through the first band: about half the cells are dithered.
        const mid = Math.round(w * 0.5) - 2;
        expect(Math.abs(share(mid) - 0.5)).toBeLessThan(0.15);
      }),
      { numRuns: 20 }
    );
  });

  it('tier merge follows the chains; the minimum-pixel merge terminates and leaves nothing below the minimum', () => {
    const palette: Record<string, PaletteSpec> = { a: ['#000000', 'black', 1], b: ['#ffffff', 'white', 1], c: ['#ff0000', 'red', 3, 'd'], d: ['#ee2222', 'darkRed', 2, 'b'] };
    const m = motif([{ shape: { all: true }, fill: 'a' }, { shape: { rect: [0, 0, 50, 50] }, fill: 'c' }, { shape: { rect: [50, 50, 50, 50] }, fill: 'd' }], palette);
    expect(new Set(cellsOf(rasterise(m, 32, 1).rows))).toEqual(new Set(['a', 'b']));
    expect(new Set(cellsOf(rasterise(m, 32, 2).rows))).toEqual(new Set(['a', 'd']));
    expect(new Set(cellsOf(rasterise(m, 32, 3).rows))).toEqual(new Set(['a', 'c', 'd']));
    // A 2-cell patch of c merges into d, then is fine.
    const tiny = motif([{ shape: { all: true }, fill: 'a' }, { shape: { rect: [0, 0, 5, 3] }, fill: 'c' }, { shape: { rect: [50, 50, 50, 50] }, fill: 'd' }], palette);
    const r = rasteriseReport(tiny, 32, 3);
    expect(r.mergedForSize).toEqual(['c']);
    for (const p of r.picture.palette) expect(cellsOf(r.picture.rows).split(p.key).length - 1).toBeGreaterThanOrEqual(minPixels(32));
    // Without a merge target: reported as an orphan, replaced by the nearest colour, never thrown.
    const orphan = rasteriseReport(motif([{ shape: { all: true }, fill: 'a' }, { shape: { rect: [0, 0, 5, 3] }, fill: 'b' }]), 32, 1);
    expect(orphan.orphans).toEqual(['b']);
    expect(cellsOf(orphan.picture.rows)).not.toContain('b');
  });

  it('despeckle removes lone cells but never touches protected (scatter, keep) cells', () => {
    const m = motif([
      { shape: { all: true }, fill: 'a' },
      { shape: { rect: [50, 50, 1, 1] }, fill: 'b' },
      { shape: { rect: [0, 0, 100, 40] }, fill: { scatter: 'c', density: 0.05, salt: 3 } },
      { shape: { rect: [0, 90, 30, 10] }, fill: 'd' },
      { shape: { ellipse: [80, 80, 0.3, 0.3] }, fill: 'd', keep: true }
    ]);
    const r = rasteriseReport(m, 32, 1);
    // The 1 × 1-unit rect is under one cell centre at most; if drawn, it was despeckled away.
    expect(cellsOf(r.picture.rows)).not.toContain('b');
    const scattered = r.masks[2]!;
    expect(count(scattered)).toBeGreaterThan(0);
    expect(r.picture.rows[Math.floor(80 / (100 / 32))]![Math.floor(80 / (100 / 32))]).toBe('d');
    const c = cellsOf(r.picture.rows).split('c').length - 1;
    expect(c).toBeGreaterThan(0);
  });

  it('erase makes cells transparent; silhouette outlines every non-transparent edge', () => {
    const m = motif([{ shape: { ellipse: [50, 50, 30, 30] }, fill: 'b' }, { shape: { rect: [45, 45, 10, 10] }, fill: '.' }], undefined, { silhouette: 'a' });
    const r = rasteriseReport(m, 40, 1);
    const rows = r.picture.rows;
    for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) {
      if (rows[y]![x] === '.') continue;
      const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => (rows[y + dy!]?.[x + dx!] ?? 'x') === '.');
      expect(rows[y]![x] === 'a').toBe(edge);
    }
  });

  it('hash32 is a fixed integer mixer', () => {
    expect(hash32(0, 0, 32, 0)).toBe(hash32(0, 0, 32, 0));
    expect(hash32(1, 0, 32, 0)).not.toBe(hash32(0, 1, 32, 0));
    expect(hash32(5, 7, 48, 3)).toBeLessThan(2 ** 32);
  });
});

const GOLDEN = [3375652871, 3933567990, 1137967727];
