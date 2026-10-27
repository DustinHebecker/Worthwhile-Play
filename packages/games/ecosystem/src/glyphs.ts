/**
 * Species glyphs (design § 13): small code-drawn SVG shapes, one per species, so that every species is told apart by
 * shape and name, never by colour alone. Each glyph is drawn around (0, 0) in a box of about 20 × 20 units.
 */
import { idiv } from './model';

const SVG = 'http://www.w3.org/2000/svg';

export function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, ...children: (Node | null | false | undefined)[]): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  for (const c of children) if (c) el.appendChild(c);
  return el;
}

const P = (d: string, cls: string) => svg('path', { d, class: cls });
const C = (cx: number, cy: number, r: number, cls: string) => svg('circle', { cx, cy, r, class: cls });
const E = (cx: number, cy: number, rx: number, ry: number, cls: string) => svg('ellipse', { cx, cy, rx, ry, class: cls });

/** The glyph of a species, as a group (class `eco-g-<id>` for its palette). */
export function glyph(id: string): SVGGElement {
  const g = svg('g', { class: `eco-glyph eco-g-${id}` });
  const add = (...els: SVGElement[]) => els.forEach((e) => g.appendChild(e));
  switch (id) {
    case 'algae':
      add(C(-4, -2, 2.6, 'f'), C(3, -4, 2.2, 'f'), C(1, 3, 2.8, 'f'), C(-5, 5, 1.8, 'f'), C(6, 3, 1.6, 'f'));
      break;
    case 'bluegreen':
      add(C(-6, 0, 2.6, 'f'), C(-1.5, 1.5, 2.6, 'f'), C(3, 0, 2.6, 'f'), C(7.5, -1.5, 2.6, 'f'));
      break;
    case 'duckweed':
      add(E(-3, 0, 6, 2.6, 'f s'), E(5, 1, 4, 2, 'f s'));
      break;
    case 'pondweed':
      add(P('M0 10C-4 5 4 2 0 -3S-3 -8 1 -11', 'l'), P('M0 4c3 -1 5 -3 5 -5M0 -4c-3 -1 -5 -3 -5 -5', 'l'));
      break;
    case 'fleas':
      add(P('M0 -6C5 -6 5 4 0 7C-5 4 -5 -6 0 -6Z', 'f s'), P('M-1 -6L-6 -10M1 -6L5 -10', 'l'), C(0, -2, 1, 'k'));
      break;
    case 'snails':
      add(C(0, 0, 7, 'f s'), P('M0 0m-3 0a3 3 0 1 1 3 3a5 5 0 0 1 -5 -5', 'l'), P('M-8 7H8', 'l'));
      break;
    case 'minnows':
      add(E(-1, 0, 7, 3.6, 'f s'), P('M5 0L10 -4V4Z', 'f s'), C(-5, -1, 0.9, 'k'));
      break;
    case 'pike':
      add(E(-1, 0, 10, 3.2, 'f s'), P('M8 0L12 -3.5V3.5Z', 'f s'), P('M-5 -2.5v5M-1 -3v6M3 -2.5v5', 'l'), C(-8, -0.8, 0.9, 'k'));
      break;
    case 'grass':
      add(P('M-4 9C-4 2 -6 -4 -8 -9M0 9C0 1 1 -5 0 -10M4 9C4 2 6 -3 8 -8', 'l'));
      break;
    case 'flowers':
      for (let k = 0; k < 5; k++) {
        const a = (k * 2 * Math.PI) / 5 - Math.PI / 2;
        add(C(Math.round(Math.cos(a) * 50) / 10, Math.round(Math.sin(a) * 50) / 10, 3, 'f s'));
      }
      add(C(0, 0, 2.2, 'k'));
      break;
    case 'clover':
      add(C(0, -4, 3.6, 'f s'), C(-4, 2, 3.6, 'f s'), C(4, 2, 3.6, 'f s'), P('M0 3V10', 'l'));
      break;
    case 'aphids':
      add(P('M-8 8L8 -8', 'l'), E(0, 0, 4, 2.6, 'f s'));
      break;
    case 'ladybirds':
      add(P('M-7 3A7 7 0 0 1 7 3Z', 'f s'), P('M0 -4V3', 'l'), C(-3, 0, 1.2, 'k'), C(3, 0, 1.2, 'k'), C(0, -6, 2, 'k'));
      break;
    case 'rabbits':
      add(E(1, 3, 7, 5, 'f s'), C(-5, -1, 3.5, 'f s'), P('M-6 -4L-8 -12M-4 -4L-3 -12', 'l'));
      break;
    case 'foxes':
      add(P('M-9 2Q-1 -4 6 2Q-1 7 -9 2Z', 'f s'), P('M6 0L11 -4L10 3Z', 'f s'), P('M6 -2L7 -7L9 -3', 'l'), P('M-9 2Q-15 -3 -12 6', 'l'));
      break;
    case 'worms':
      add(P('M-10 2C-6 -4 -3 6 0 0S6 -4 10 2', 'l w'));
      break;
    default:
      add(C(0, 0, 5, 'f s'));
  }
  return g;
}

/** ⌊log2 x⌋ for integers x ≥ 1 (0 below). */
export function ilog2(x: number): number {
  let k = 0;
  let v = Math.floor(x);
  while (v >= 2) {
    v = idiv(v, 2);
    k++;
  }
  return k;
}

/** Amount per glyph doubling, by species (data; § 13). */
export const GLYPH_SCALE: Readonly<Record<string, number>> = {
  algae: 1000,
  bluegreen: 1000,
  duckweed: 1000,
  pondweed: 3000,
  fleas: 600,
  snails: 700,
  minnows: 300,
  pike: 200,
  grass: 1000,
  flowers: 1600,
  clover: 600,
  aphids: 200,
  ladybirds: 50,
  rabbits: 120,
  foxes: 50,
  worms: 1200
};

/** How many glyphs a species shows: min(12, ⌊log2(1 + amount / scale)⌋), at least 1 while present, so three orders of magnitude stay readable. */
export const glyphCount = (id: string, amount: number): number => (amount > 0 ? Math.max(1, Math.min(12, ilog2(1 + idiv(amount, GLYPH_SCALE[id] ?? 1000)))) : 0);
