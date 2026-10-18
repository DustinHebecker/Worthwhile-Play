import { describe, expect, it } from 'vitest';
import { createRng } from '@wp/game-core';
import { LEVELS, peelPlan, pictureOf } from '../src/generate';
import { messages } from '../src/messages';
import { MOTIFS } from '../src/motifs/index';
import { COLOUR_NAMES, LOCALES } from '../src/motifs/types';
import { exposedCells, launch } from './reference';

/** CIE76 ΔE between two #rrggbb colours (sRGB → XYZ (D65) → Lab). */
export function deltaE(a: string, b: string): number {
  const lab = (hex: string) => {
    const lin = (i: number) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    const [r, g, bl] = [lin(1), lin(3), lin(5)];
    const x = (0.4124 * r + 0.3576 * g + 0.1805 * bl) / 0.95047;
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * bl;
    const z = (0.0193 * r + 0.1192 * g + 0.9505 * bl) / 1.08883;
    const f = (v: number) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116);
    return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
  };
  const p = lab(a);
  const q = lab(b);
  return Math.hypot(p[0]! - q[0]!, p[1]! - q[1]!, p[2]! - q[2]!);
}

const MIN_DELTA_E = 20;

describe('motif data (design § 6.2)', () => {
  it('has 12 motifs: seasons, then landscapes, then animals; unique ids that are not "any"', () => {
    expect(MOTIFS.length).toBeGreaterThanOrEqual(12);
    const ids = MOTIFS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain('any');
    const rank = { season: 0, landscape: 1, animal: 2 } as const;
    const groups = MOTIFS.map((m) => rank[m.group]);
    expect(groups).toEqual([...groups].sort((a, b) => a - b));
  });

  for (const motif of MOTIFS) {
    describe(motif.id, () => {
      const keys = Object.keys(motif.palette);
      const flat = motif.rows.join('');

      it('has a valid id, 12–24 × 12–24 cells and only palette keys or "."', () => {
        expect(motif.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        expect(motif.id.length).toBeLessThanOrEqual(32);
        const w = motif.rows[0]!.length;
        expect(w).toBeGreaterThanOrEqual(12);
        expect(w).toBeLessThanOrEqual(24);
        expect(motif.rows.length).toBeGreaterThanOrEqual(12);
        expect(motif.rows.length).toBeLessThanOrEqual(24);
        for (const row of motif.rows) expect(row).toHaveLength(w);
        for (const ch of flat) expect(ch === '.' || keys.includes(ch), `character "${ch}"`).toBe(true);
      });

      it('has 3–8 colours, each used by at least 4 pixels, with known and unique names', () => {
        expect(keys.length).toBeGreaterThanOrEqual(3);
        expect(keys.length).toBeLessThanOrEqual(8);
        for (const key of keys) {
          expect(key).toMatch(/^[a-z]$/);
          expect(flat.split(key).length - 1, `pixels of ${key}`).toBeGreaterThanOrEqual(4);
        }
        const names = Object.values(motif.palette).map(([, name]) => name);
        for (const name of names) expect(COLOUR_NAMES).toContain(name);
        expect(new Set(names).size).toBe(names.length);
        for (const [hex] of Object.values(motif.palette)) expect(hex).toMatch(/^#[0-9a-f]{6}$/);
        expect(motif.backdrop).toMatch(/^#[0-9a-f]{6}$/);
      });

      it(`keeps colours distinguishable (ΔE ≥ ${MIN_DELTA_E}) and the backdrop apart from every colour`, () => {
        const hexes = Object.values(motif.palette).map(([hex]) => hex);
        for (let i = 0; i < hexes.length; i++) {
          expect(deltaE(hexes[i]!, motif.backdrop), `backdrop vs ${hexes[i]}`).toBeGreaterThanOrEqual(MIN_DELTA_E);
          for (let j = i + 1; j < hexes.length; j++) expect(deltaE(hexes[i]!, hexes[j]!), `${hexes[i]} vs ${hexes[j]}`).toBeGreaterThanOrEqual(MIN_DELTA_E);
        }
      });

      it('has 80–480 filled pixels, and its first position allows a launch that hits', () => {
        const filled = flat.replace(/\./g, '').length;
        expect(filled).toBeGreaterThanOrEqual(80);
        expect(filled).toBeLessThanOrEqual(480);
        const w = motif.rows[0]!.length;
        const cells = flat.split('');
        const onEdge = new Set(exposedCells(cells, w, motif.rows.length).map((i) => cells[i]));
        expect([...onEdge].some((c) => launch(cells, w, motif.rows.length, { c: c!, n: 99 }).hits.length > 0)).toBe(true);
      });

      it('has a title (≤ 32 characters) and a place in all 16 locales', () => {
        for (const locale of LOCALES) {
          expect(motif.title[locale].trim(), `${locale} title`).not.toBe('');
          expect(motif.title[locale].length, `${locale} title`).toBeLessThanOrEqual(32);
          expect(motif.place[locale].trim(), `${locale} place`).not.toBe('');
        }
      });

      it('has a start-screen label "motif.<id>" in every locale, with the colour count', () => {
        for (const locale of LOCALES) {
          const label = messages[locale]![`motif.${motif.id}`];
          expect(label, locale).toContain(motif.title[locale]);
          expect(label, locale).toContain(String(keys.length));
        }
      });

      it('gives few tiny shooters on easy (at most 40 % below 3 shots)', () => {
        const plan = peelPlan(pictureOf(motif), LEVELS.easy.pack, createRng(1));
        const tiny = plan.filter((s) => s.n < 3).length;
        expect(tiny / plan.length).toBeLessThanOrEqual(0.4);
      });
    });
  }
});
