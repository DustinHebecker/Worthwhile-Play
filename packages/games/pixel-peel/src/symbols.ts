/**
 * The 20 colour symbols (design v2 § 1.6), assigned by played-palette position. One geometry, filled with the
 * even-odd rule: the view turns it into SVG/canvas paths, the render script tests points against it. Never font
 * glyphs. Box: 24 × 24.
 */

export const SYMBOLS = [
  'dot', 'triangle', 'square', 'diamond', 'plus', 'ring', 'bar', 'star', 'cross', 'hexagon',
  'triangleDown', 'heart', 'crescent', 'squareRing', 'diamondRing', 'hourglass', 'halfDisc', 'twoDots', 'uprightBar', 'chevron'
] as const;
export type SymbolName = (typeof SYMBOLS)[number];

type Pt = readonly [number, number];
type Prim = { readonly poly: readonly Pt[] } | { readonly circle: readonly [number, number, number] };

const rect = (x0: number, y0: number, x1: number, y1: number): Prim => ({ poly: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]] });
const circle = (cx: number, cy: number, r: number): Prim => ({ circle: [cx, cy, r] });
const round2 = (v: number) => Math.round(v * 100) / 100;
/** Points on an arc (degrees, 0 = east, clockwise on screen). */
const arc = (cx: number, cy: number, r: number, from: number, to: number, steps: number): Pt[] => {
  const out: Pt[] = [];
  for (let k = 0; k <= steps; k++) {
    const a = ((from + ((to - from) * k) / steps) * Math.PI) / 180;
    out.push([round2(cx + r * Math.cos(a)), round2(cy + r * Math.sin(a))]);
  }
  return out;
};
const regular = (n: number, r: number, rot: number): Pt[] => arc(12, 12, r, rot, rot + 360, n).slice(0, n);

const star: Pt[] = Array.from({ length: 10 }, (_, k) => {
  const r = k % 2 === 0 ? 10 : 4.2;
  const a = ((-90 + k * 36) * Math.PI) / 180;
  return [round2(12 + r * Math.cos(a)), round2(12.8 + r * Math.sin(a))] as Pt;
});

const heart: Pt[] = (() => {
  const out: Pt[] = [];
  for (let k = 0; k < 36; k++) {
    const t = (k / 36) * 2 * Math.PI;
    const x = 16 * Math.sin(t) ** 3;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    out.push([round2(12 + x * 0.58), round2(11.2 - y * 0.58)]);
  }
  return out;
})();

/** Outer arc of radius 9.5 around (12, 12), inner arc of a circle shifted to the upper right. */
const crescent: Pt[] = [...arc(12, 12, 9.5, -60, 210, 18), ...arc(15.5, 9, 7, 200, -50, 14)];

export const SYMBOL_GEOMETRY: readonly (readonly Prim[])[] = [
  [circle(12, 12, 6.5)],
  [{ poly: [[12, 3], [21.5, 20], [2.5, 20]] }],
  [rect(5, 5, 19, 19)],
  [{ poly: [[12, 2], [22, 12], [12, 22], [2, 12]] }],
  [{ poly: [[9.25, 3], [14.75, 3], [14.75, 9.25], [21, 9.25], [21, 14.75], [14.75, 14.75], [14.75, 21], [9.25, 21], [9.25, 14.75], [3, 14.75], [3, 9.25], [9.25, 9.25]] }],
  [circle(12, 12, 9), circle(12, 12, 4.8)],
  [rect(2.5, 8.5, 21.5, 15.5)],
  [{ poly: star }],
  [{ poly: [[3.5, 7.4], [7.4, 3.5], [12, 8.1], [16.6, 3.5], [20.5, 7.4], [15.9, 12], [20.5, 16.6], [16.6, 20.5], [12, 15.9], [7.4, 20.5], [3.5, 16.6], [8.1, 12]] }],
  [{ poly: regular(6, 10, 0) }],
  [{ poly: [[2.5, 4], [21.5, 4], [12, 21]] }],
  [{ poly: heart }],
  [{ poly: crescent }],
  [rect(3, 3, 21, 21), rect(7.5, 7.5, 16.5, 16.5)],
  [{ poly: [[12, 1.5], [22.5, 12], [12, 22.5], [1.5, 12]] }, { poly: [[12, 7], [17, 12], [12, 17], [7, 12]] }],
  [{ poly: [[4.5, 2.5], [19.5, 2.5], [12, 11.5]] }, { poly: [[12, 12.5], [19.5, 21.5], [4.5, 21.5]] }],
  [{ poly: [...arc(12, 8, 10, 0, 180, 18)] }],
  [circle(6.5, 12, 4.6), circle(17.5, 12, 4.6)],
  [rect(8.5, 2.5, 15.5, 21.5)],
  [{ poly: [[2.5, 6.5], [12, 15], [21.5, 6.5], [21.5, 12.5], [12, 21], [2.5, 12.5]] }]
];

/** SVG path data of symbol `index` (even-odd). */
export function symbolPath(index: number): string {
  const prims = SYMBOL_GEOMETRY[index % SYMBOL_GEOMETRY.length] as readonly Prim[];
  return prims
    .map((p) => {
      if ('circle' in p) {
        const [cx, cy, r] = p.circle;
        return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
      }
      return `M${p.poly.map(([x, y]) => `${x} ${y}`).join('L')}Z`;
    })
    .join('');
}

/** Whether point (x, y) of the 24 × 24 box is inside symbol `index` (even-odd; for the render script). */
export function insideSymbol(index: number, x: number, y: number): boolean {
  const prims = SYMBOL_GEOMETRY[index % SYMBOL_GEOMETRY.length] as readonly Prim[];
  let inside = false;
  for (const p of prims) {
    if ('circle' in p) {
      const [cx, cy, r] = p.circle;
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) inside = !inside;
      continue;
    }
    let hit = false;
    const pts = p.poly;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i] as Pt;
      const [xj, yj] = pts[j] as Pt;
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
    }
    if (hit) inside = !inside;
  }
  return inside;
}

/** Black or white, whichever contrasts with the fill (WCAG relative luminance > 0.4 → black). */
export function inkFor(hex: string): string {
  const lin = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const lum = 0.2126 * lin(1) + 0.7152 * lin(3) + 0.0722 * lin(5);
  return lum > 0.4 ? '#000000' : '#ffffff';
}

/** CIE76 ΔE between two #rrggbb colours (sRGB → XYZ (D65) → Lab). Used by tests and the render script only. */
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
  return Math.hypot((p[0] as number) - (q[0] as number), (p[1] as number) - (q[1] as number), (p[2] as number) - (q[2] as number));
}
