import { cosDeg, sinDeg } from './trig';
import type { Direction, Fill, Layer, Motif, PaletteSpec, Point, Shade, Shape } from './types';

/**
 * The deterministic rasteriser (design v2 § 1.3). It turns a vector motif into a grid of palette keys at width
 * W ∈ {32, 40, 48} with the difficulty's palette tier. Pure and synchronous; only + − × ÷, comparisons,
 * `Math.floor`/`Math.round`, `Math.sqrt` and integer hashing; trigonometry from a table. The same motif, width and
 * tier give bit-identical grids on every device. There is no colour quantisation: every cell gets a palette key
 * chosen by a rule.
 */

export interface RasterPicture {
  w: number;
  h: number;
  rows: string[];
  palette: { key: string; hex: string; name: string }[];
  backdrop: string;
}

export interface RasterReport {
  picture: RasterPicture;
  /** Cells changed by the despeckle pass. */
  despeckled: number;
  /** Keys replaced because they had fewer than `minPixels(W)` cells (an authoring problem when not empty). */
  mergedForSize: string[];
  /** Keys that fell below the minimum without a merge target (an authoring error). */
  orphans: string[];
  /** Per layer (in order): its mask after level of detail, clip and keep (for the debug render). */
  masks: (Uint8Array | null)[];
}

export type Tier = 1 | 2 | 3;

export const minPixels = (w: number): number => Math.floor(w / 4);
export const heightOf = (motif: Pick<Motif, 'aspect'>, w: number): number => (motif.aspect === 'wide' ? (w * 3) / 4 : w);

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

const STEP: Readonly<Record<Direction, readonly [number, number]>> = {
  n: [0, -1],
  ne: [1, -1],
  e: [1, 0],
  se: [1, 1],
  s: [0, 1],
  sw: [-1, 1],
  w: [-1, 0],
  nw: [-1, -1]
};

/** A fixed 32-bit integer mixer (scatter fills). */
export function hash32(x: number, y: number, w: number, salt: number): number {
  let h = Math.imul(x + 1, 0x9e3779b1) ^ Math.imul(y + 1, 0x85ebca77) ^ Math.imul(w, 0xc2b2ae3d) ^ Math.imul(salt + 1, 0x27d4eb2f);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39);
  h ^= h >>> 15;
  return h >>> 0;
}

/** One round of Chaikin corner cutting on a closed polygon. */
function chaikin(points: readonly Point[]): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i] as Point;
    const q = points[(i + 1) % points.length] as Point;
    out.push([0.75 * p[0] + 0.25 * q[0], 0.75 * p[1] + 0.25 * q[1]], [0.25 * p[0] + 0.75 * q[0], 0.25 * p[1] + 0.75 * q[1]]);
  }
  return out;
}

/** Even–odd crossing test with the half-open edge rule. */
function insidePoly(points: readonly Point[], px: number, py: number): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i] as Point;
    const [xj, yj] = points[j] as Point;
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function starPoints(cx: number, cy: number, outer: number, inner: number, points: number, rot: number): Point[] {
  const out: Point[] = [];
  for (let k = 0; k < 2 * points; k++) {
    const r = k % 2 === 0 ? outer : inner;
    const a = rot - 90 + (k * 180) / points;
    out.push([cx + r * cosDeg(a), cy + r * sinDeg(a)]);
  }
  return out;
}

function segmentDistance2(px: number, py: number, a: Point, b: Point): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  let t = len2 > 0 ? ((px - a[0]) * dx + (py - a[1]) * dy) / len2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const ex = a[0] + t * dx - px;
  const ey = a[1] + t * dy - py;
  return ex * ex + ey * ey;
}

interface Grid {
  w: number;
  h: number;
  u: number;
}

const clampCell = (v: number, max: number) => (v < 0 ? 0 : v > max - 1 ? max - 1 : v);

/** The mask of a shape: cells whose centre lies inside it. Returns the mask and the anchor cell. */
export function shapeMask(shape: Shape, g: Grid): { mask: Uint8Array; anchor: number } {
  const { w, h, u } = g;
  const mask = new Uint8Array(w * h);
  const cellOf = (x: number, y: number) => clampCell(Math.floor(y / u), h) * w + clampCell(Math.floor(x / u), w);
  const scan = (minX: number, minY: number, maxX: number, maxY: number, test: (px: number, py: number) => boolean) => {
    const x0 = Math.max(0, Math.floor(minX / u) - 1);
    const x1 = Math.min(w - 1, Math.ceil(maxX / u) + 1);
    const y0 = Math.max(0, Math.floor(minY / u) - 1);
    const y1 = Math.min(h - 1, Math.ceil(maxY / u) + 1);
    for (let y = y0; y <= y1; y++) {
      const py = (y + 0.5) * u;
      for (let x = x0; x <= x1; x++) if (test((x + 0.5) * u, py)) mask[y * w + x] = 1;
    }
  };
  if ('all' in shape) {
    mask.fill(1);
    return { mask, anchor: 0 };
  }
  if ('rect' in shape) {
    const [x, y, rw, rh] = shape.rect;
    const r = Math.min(shape.round ?? 0, rw / 2, rh / 2);
    scan(x, y, x + rw, y + rh, (px, py) => {
      if (px < x || px >= x + rw || py < y || py >= y + rh) return false;
      if (r <= 0) return true;
      const cx = px < x + r ? x + r : px > x + rw - r ? x + rw - r : px;
      const cy = py < y + r ? y + r : py > y + rh - r ? y + rh - r : py;
      return (px - cx) * (px - cx) + (py - cy) * (py - cy) <= r * r;
    });
    return { mask, anchor: cellOf(x + rw / 2, y + rh / 2) };
  }
  if ('ellipse' in shape) {
    const [cx, cy, rx, ry] = shape.ellipse;
    const rot = shape.rot ?? 0;
    const c = cosDeg(rot);
    const s = sinDeg(rot);
    const m = rx > ry ? rx : ry;
    scan(cx - m, cy - m, cx + m, cy + m, (px, py) => {
      const dx = px - cx;
      const dy = py - cy;
      const ux = (dx * c + dy * s) / rx;
      const uy = (-dx * s + dy * c) / ry;
      return ux * ux + uy * uy <= 1;
    });
    return { mask, anchor: cellOf(cx, cy) };
  }
  if ('poly' in shape || 'star' in shape) {
    let points: Point[];
    if ('poly' in shape) {
      points = [...shape.poly];
      for (let k = 0; k < (shape.smooth ?? 0); k++) points = chaikin(points);
    } else {
      const [cx, cy, outer, inner, n] = shape.star;
      points = starPoints(cx, cy, outer, inner, n, shape.rot ?? 0);
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let sx = 0;
    let sy = 0;
    for (const [px, py] of points) {
      minX = px < minX ? px : minX;
      minY = py < minY ? py : minY;
      maxX = px > maxX ? px : maxX;
      maxY = py > maxY ? py : maxY;
      sx += px;
      sy += py;
    }
    scan(minX, minY, maxX, maxY, (px, py) => insidePoly(points, px, py));
    const anchor = 'star' in shape ? cellOf(shape.star[0], shape.star[1]) : cellOf(sx / points.length, sy / points.length);
    return { mask, anchor };
  }
  // line
  const pts = shape.line;
  const first = pts[0] ?? ([0, 0] as Point);
  if (shape.width <= u) {
    for (let k = 0; k + 1 < pts.length || (k === 0 && pts.length === 1); k++) {
      const a = pts[k] as Point;
      const b = (pts[k + 1] ?? a) as Point;
      let x0 = clampCell(Math.floor(a[0] / u), w);
      let y0 = clampCell(Math.floor(a[1] / u), h);
      const x1 = clampCell(Math.floor(b[0] / u), w);
      const y1 = clampCell(Math.floor(b[1] / u), h);
      const dx = Math.abs(x1 - x0);
      const dy = -Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1;
      const sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) {
        mask[y0 * w + x0] = 1;
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) {
          err += dy;
          x0 += sx;
        }
        if (e2 <= dx) {
          err += dx;
          y0 += sy;
        }
      }
      if (pts.length === 1) break;
    }
  } else {
    const r = shape.width / 2;
    for (let k = 0; k + 1 < pts.length || (k === 0 && pts.length === 1); k++) {
      const a = pts[k] as Point;
      const b = (pts[k + 1] ?? a) as Point;
      scan(Math.min(a[0], b[0]) - r, Math.min(a[1], b[1]) - r, Math.max(a[0], b[0]) + r, Math.max(a[1], b[1]) + r, (px, py) => segmentDistance2(px, py, a, b) <= r * r);
      if (pts.length === 1) break;
    }
  }
  return { mask, anchor: cellOf(first[0], first[1]) };
}

/** Per-cell fill: a code (0 = erase), or -1 to leave the cell untouched. `protect` marks scatter cells. */
function fillCode(fill: Fill, code: (key: string) => number, x: number, y: number, g: Grid, out: { protect: boolean }): number {
  out.protect = false;
  if (typeof fill === 'string') return fill === '.' ? 0 : code(fill);
  const px = (x + 0.5) * g.u;
  const py = (y + 0.5) * g.u;
  if ('gradient' in fill) {
    const keys = fill.gradient;
    const n = keys.length;
    const dx = fill.to[0] - fill.from[0];
    const dy = fill.to[1] - fill.from[1];
    const len2 = dx * dx + dy * dy;
    let t = len2 > 0 ? ((px - fill.from[0]) * dx + (py - fill.from[1]) * dy) / len2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    // n equal bands; the last `soft` share of each band is ordered-dithered into the next key.
    const p = t * n;
    let i = Math.floor(p);
    if (i >= n - 1) return code(keys[n - 1] as string);
    const f = p - i;
    const s = fill.soft ?? 0.5;
    if (s > 0 && f > 1 - s && (f - (1 - s)) / s > ((BAYER[(y % 4) * 4 + (x % 4)] as number) + 0.5) / 16) {
      // A dithered cell is intentional texture: protected from the despeckle pass, like scatter.
      i += 1;
      out.protect = true;
    }
    return code(keys[i] as string);
  }
  if ('stripes' in fill) {
    const a = fill.angle ?? 0;
    const width = fill.width > g.u ? fill.width : g.u;
    const n = fill.stripes.length;
    let k = Math.floor((px * cosDeg(a) + py * sinDeg(a)) / width) % n;
    if (k < 0) k += n;
    return code(fill.stripes[k] as string);
  }
  if (hash32(x, y, g.w, fill.salt) / 4294967296 < fill.density) {
    out.protect = true;
    return code(fill.scatter);
  }
  return -1;
}

function applyShade(shade: Shade, mask: Uint8Array, values: Int16Array, code: (key: string) => number, g: Grid): void {
  const [dx, dy] = STEP[shade.dir];
  const { w, h } = g;
  const light = shade.light ? code(shade.light) : -1;
  const dark = shade.dark ? code(shade.dark) : -1;
  if ((shade.mode ?? 'rim') === 'band') {
    let min = Infinity;
    let max = -Infinity;
    for (let c = 0; c < mask.length; c++) {
      if (!mask[c] || values[c]! <= 0 || values[c]! >= 1000) continue;
      const p = (c % w) * dx + Math.floor(c / w) * dy;
      min = p < min ? p : min;
      max = p > max ? p : max;
    }
    const amount = shade.amount ?? 0.25;
    const span = max - min;
    for (let c = 0; c < mask.length; c++) {
      if (!mask[c] || values[c]! <= 0 || values[c]! >= 1000) continue;
      const p = (c % w) * dx + Math.floor(c / w) * dy;
      if (light > 0 && p > max - amount * span - 1e-9 && span > 0) values[c] = light;
      else if (dark > 0 && p < min + amount * span + 1e-9 && span > 0) values[c] = dark;
    }
    return;
  }
  const width = Math.max(1, Math.round(((shade.width ?? 1) * w) / 48));
  const outside = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && !mask[y * w + x];
  for (let c = 0; c < mask.length; c++) {
    if (!mask[c] || values[c]! <= 0 || values[c]! >= 1000) continue;
    const x = c % w;
    const y = (c - x) / w;
    let lit = false;
    for (let k = 1; k <= width && !lit; k++) if (outside(x + k * dx, y + k * dy)) lit = true;
    if (lit) {
      if (light > 0) values[c] = light;
      continue;
    }
    if (dark > 0) for (let k = 1; k <= width; k++) if (outside(x - k * dx, y - k * dy)) {
      values[c] = dark;
      break;
    }
  }
}

const rgbOf = (hex: string): [number, number, number] => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];

/** Rasterises with all diagnostics (for tests and the render script). */
export function rasteriseReport(motif: Motif, w: number, tier: Tier): RasterReport {
  const h = heightOf(motif, w);
  const g: Grid = { w, h, u: 100 / w };
  const keys = Object.keys(motif.palette);
  const specs = keys.map((k) => motif.palette[k] as PaletteSpec);
  const codes = new Map(keys.map((k, i) => [k, i + 1] as const));
  const code = (key: string) => codes.get(key) ?? 0;
  const grid = new Uint8Array(w * h);
  const prot = new Uint8Array(w * h);
  const named = new Map<string, Uint8Array>();
  const masks: (Uint8Array | null)[] = [];
  const values = new Int16Array(w * h);
  const scratch = { protect: false };

  for (const layer of motif.layers as readonly Layer[]) {
    if (layer.min !== undefined && w < layer.min) {
      masks.push(null);
      if (layer.name) named.set(layer.name, new Uint8Array(w * h));
      continue;
    }
    const { mask, anchor } = shapeMask(layer.shape, g);
    if (layer.clip) {
      const parent = named.get(layer.clip);
      for (let c = 0; c < mask.length; c++) if (!parent || !parent[c]) mask[c] = 0;
    }
    let any = false;
    for (let c = 0; c < mask.length && !any; c++) if (mask[c]) any = true;
    const kept = !any && layer.keep === true;
    if (kept) mask[anchor] = 1;
    if (layer.name) named.set(layer.name, mask);
    masks.push(mask);
    for (let c = 0; c < mask.length; c++) {
      if (!mask[c]) {
        values[c] = -1;
        continue;
      }
      values[c] = fillCode(layer.fill, code, c % w, Math.floor(c / w), g, scratch);
      if (scratch.protect) values[c] = values[c]! + 1000;
    }
    // Shade and outline work on the written values (scatter cells keep their offset of 1000 and are skipped).
    // The outline ring: mask cells with a 4-neighbour outside the mask (grid edges excluded). With an outline, the
    // shade works on the mask inside the ring, so a rim shows just inside the outline.
    let ring: Uint8Array | null = null;
    if (layer.outline) {
      ring = new Uint8Array(mask.length);
      for (let c = 0; c < mask.length; c++) {
        if (!mask[c]) continue;
        const x = c % w;
        const y = (c - x) / w;
        if ((x > 0 && !mask[c - 1]) || (x < w - 1 && !mask[c + 1]) || (y > 0 && !mask[c - w]) || (y < h - 1 && !mask[c + w])) ring[c] = 1;
      }
    }
    if (layer.shade) {
      let inner = mask;
      if (ring) {
        inner = mask.slice();
        for (let c = 0; c < mask.length; c++) if (ring[c]) inner[c] = 0;
      }
      applyShade(layer.shade, inner, values, code, g);
    }
    if (ring) {
      const o = code(layer.outline ?? '');
      for (let c = 0; c < mask.length; c++) if (ring[c] && values[c]! > 0 && values[c]! < 1000) values[c] = o;
    }
    for (let c = 0; c < mask.length; c++) {
      const v = values[c]!;
      if (!mask[c] || v < 0) continue;
      if (v >= 1000) {
        grid[c] = v - 1000;
        prot[c] = 1;
      } else {
        grid[c] = v;
        prot[c] = kept ? 1 : 0;
      }
    }
  }

  // Silhouette.
  if (motif.silhouette) {
    const s = code(motif.silhouette);
    const copy = grid.slice();
    for (let c = 0; c < grid.length; c++) {
      if (!copy[c]) continue;
      const x = c % w;
      const y = (c - x) / w;
      if ((x > 0 && !copy[c - 1]) || (x < w - 1 && !copy[c + 1]) || (y > 0 && !copy[c - w]) || (y < h - 1 && !copy[c + w])) grid[c] = s;
    }
  }

  // Tier merge: follow each key's merge chain to a key of tier ≤ T.
  const target = (k: number, limit: Tier): number => {
    let cur = k;
    for (let guard = 0; guard < 20 && cur > 0 && (specs[cur - 1]![2] as number) > limit; guard++) cur = code(specs[cur - 1]![3] ?? '') || cur;
    return cur;
  };
  const tierMap = new Uint8Array(keys.length + 1);
  for (let k = 1; k <= keys.length; k++) tierMap[k] = target(k, tier);
  for (let c = 0; c < grid.length; c++) grid[c] = tierMap[grid[c]!]!;

  // Despeckle: a lone cell (no 8-neighbour of its own key) inside ≥ 6 neighbours of one key takes that key.
  const before = grid.slice();
  let despeckled = 0;
  const count = new Int32Array(keys.length + 1);
  for (let c = 0; c < grid.length; c++) {
    if (prot[c]) continue;
    const x = c % w;
    const y = (c - x) / w;
    const own = before[c]!;
    let alone = true;
    count.fill(0);
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        if (!ox && !oy) continue;
        const nx = x + ox;
        const ny = y + oy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const v = before[ny * w + nx]!;
        if (v === own) alone = false;
        count[v] = count[v]! + 1;
      }
    }
    if (!alone) continue;
    for (let k = 0; k <= keys.length; k++) {
      if (count[k]! >= 6) {
        grid[c] = k;
        despeckled++;
        break;
      }
    }
  }

  // Minimum pixels: replace keys below the minimum along their merge chain (repeat until stable).
  const min = minPixels(w);
  const mergedForSize: string[] = [];
  const orphans: string[] = [];
  // One key at a time, the smallest first (ties: palette order), recounting after each merge.
  const used = new Int32Array(keys.length + 1);
  for (const v of grid) used[v] = used[v]! + 1;
  for (let round = 0; round < keys.length; round++) {
    let k = 0;
    for (let j = 1; j <= keys.length; j++) if (used[j]! > 0 && used[j]! < min && (k === 0 || used[j]! < used[k]!)) k = j;
    if (k === 0) break;
    let to = code(specs[k - 1]![3] ?? '');
    if (to) to = target(to, tier);
    if (!to || to === k) {
      // Authoring error (the motif test fails); at runtime the nearest other used key by RGB distance.
      orphans.push(keys[k - 1] as string);
      const [r, gg, b] = rgbOf(specs[k - 1]![0]);
      let best = Infinity;
      to = 0;
      for (let j = 1; j <= keys.length; j++) {
        if (j === k || used[j] === 0) continue;
        const [r2, g2, b2] = rgbOf(specs[j - 1]![0]);
        const d = (r - r2) * (r - r2) + (gg - g2) * (gg - g2) + (b - b2) * (b - b2);
        if (d < best) {
          best = d;
          to = j;
        }
      }
      if (!to) break;
    } else mergedForSize.push(keys[k - 1] as string);
    for (let c = 0; c < grid.length; c++) if (grid[c] === k) grid[c] = to;
    used[to] = used[to]! + used[k]!;
    used[k] = 0;
  }

  // Compact: used keys in palette order.
  const rows: string[] = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) {
      const v = grid[y * w + x]!;
      row += v ? keys[v - 1] : '.';
    }
    rows.push(row);
  }
  const palette = keys.filter((_, i) => used[i + 1]! > 0).map((key) => ({ key, hex: motif.palette[key]![0], name: motif.palette[key]![1] as string }));
  return { picture: { w, h, rows, palette, backdrop: motif.backdrop }, despeckled, mergedForSize, orphans, masks };
}

const memo = new Map<string, RasterPicture>();

/** The played picture of a motif at width `w` and palette tier `tier` (memoised for the session). */
export function rasterise(motif: Motif, w: number, tier: Tier): RasterPicture {
  const key = `${motif.id}|${w}|${tier}`;
  const cached = memo.get(key);
  if (cached) return cached;
  const picture = rasteriseReport(motif, w, tier).picture;
  memo.set(key, picture);
  return picture;
}
