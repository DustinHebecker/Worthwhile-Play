import type { View } from './icons';

/**
 * The terrain of a whole map (owner choice 2026-10-27). Pass 1 lays the ground colours with soft,
 * slightly irregular blends at cell borders. Pass 2 places the features on map-wide lattices (trees,
 * houses, humps, peaks), so a forest, a town or a mountain chain runs on across cell borders and its
 * edges fray instead of ending in a square. Every type keeps its own pattern (trees, houses, humps or
 * contour lines, peaks or rock, reeds, waves, a road band), so it is never told apart by colour alone.
 * In the profile view hills are humps, towns houses seen from the side and ridges a mountain chain;
 * in the top view hills and ridges are one relief with contour lines and towns roofs seen from above.
 * Deterministic: the same map always looks the same.
 */

export interface TerrainColours {
  /** The ground colour of a terrain (#rrggbb). */
  base(name: string): string;
  /** The dark theme: tree crowns are lit a little less. */
  readonly dark: boolean;
}

export interface TerrainMap {
  readonly w: number;
  readonly h: number;
  /** One code per cell, row by row ('.', '=', 'f', 'h', 'u', 's', '~', '^'). */
  readonly terrain: string;
}

/** `fine` for the game; `coarse` (fewer samples) where the map is redrawn on every edit. */
export type TerrainDetail = 'fine' | 'coarse';

const NAMES: Readonly<Record<string, string>> = { '.': 'plain', '=': 'road', f: 'forest', h: 'hill', u: 'urban', s: 'swamp', '~': 'water', '^': 'ridge' };
/** The ground under a cell: a road lies on plain ground, a hill rises from it. */
const GROUND: Readonly<Record<string, string>> = { plain: 'plain', road: 'plain', forest: 'forest', hill: 'plain', urban: 'urban', swamp: 'swamp', water: 'water', ridge: 'ridge' };

type Rgb = readonly [number, number, number];
type Pt = readonly [number, number];
const BLACK: Rgb = [0, 0, 0];
const WHITE: Rgb = [255, 255, 255];
const ORTHOGONAL: readonly Pt[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** A small deterministic hash in [0, 1). */
function rnd(x: number, y: number, k: number): number {
  let n = (Math.round(x) * 374761393 + Math.round(y) * 668265263 + k * 2147483647) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
const smooth = (t: number): number => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
/** Smooth value noise on a grid of `scale` per cell (u, v in cells). */
function vnoise(u: number, v: number, scale: number, seed: number): number {
  const gx = u * scale;
  const gy = v * scale;
  const ix = Math.floor(gx);
  const iy = Math.floor(gy);
  const fx = smooth(gx - ix);
  const fy = smooth(gy - iy);
  const a = rnd(ix, iy, seed) * (1 - fx) + rnd(ix + 1, iy, seed) * fx;
  const b = rnd(ix, iy + 1, seed) * (1 - fx) + rnd(ix + 1, iy + 1, seed) * fx;
  return a * (1 - fy) + b * fy;
}
const rgb = (hex: string): Rgb => {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  const s = m ? m[1]! : 'dddddd';
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
};
const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (c: Rgb): string => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;
const shade = (hex: string, t: number): string => css(mixRgb(rgb(hex), t >= 0 ? WHITE : BLACK, Math.abs(t)));

/** Line segments where `field` crosses `level` on an n×n grid over the cell at (x, y) (marching squares). */
function contour(g: CanvasRenderingContext2D, field: (i: number, j: number) => number, n: number, x0: number, y0: number, step: number, level: number): void {
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const cs: readonly Pt[] = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]];
      const pts: Pt[] = [];
      for (let e = 0; e < 4; e++) {
        const [ai, aj] = cs[e]!;
        const [bi, bj] = cs[(e + 1) % 4]!;
        const va = field(ai, aj) - level;
        const vb = field(bi, bj) - level;
        if (va * vb < 0) {
          const t = va / (va - vb);
          pts.push([x0 + (ai + (bi - ai) * t) * step, y0 + (aj + (bj - aj) * t) * step]);
        }
      }
      for (let q = 0; q + 1 < pts.length; q += 2) {
        g.moveTo(pts[q]![0], pts[q]![1]);
        g.lineTo(pts[q + 1]![0], pts[q + 1]![1]);
      }
    }
}

/**
 * Colour samples on a grid of `n` per cell. Where a bitmap can be made they go into one small image
 * that is drawn scaled up smoothly over the map (one draw instead of a square per sample, and the
 * blends come out soft); elsewhere each sample is a square of its own.
 */
function sampler(g: CanvasRenderingContext2D, map: TerrainMap, cell: number, n: number): { set(i: number, j: number, c: Rgb, a?: number): void; done(): void } {
  const W = map.w * n;
  const H = map.h * n;
  const step = cell / n;
  let image: ImageData | null = null;
  let bitmap: HTMLCanvasElement | null = null;
  let bg: CanvasRenderingContext2D | null = null;
  try {
    const doc = (g.canvas as HTMLCanvasElement | undefined)?.ownerDocument;
    if (doc && W > 0 && H > 0) {
      bitmap = doc.createElement('canvas');
      bitmap.width = W;
      bitmap.height = H;
      bg = bitmap.getContext('2d');
      image = bg ? bg.createImageData(W, H) : null;
    }
  } catch {
    image = null;
  }
  return {
    set(i, j, c, a = 1) {
      if (image) {
        const o = (j * W + i) * 4;
        image.data[o] = c[0];
        image.data[o + 1] = c[1];
        image.data[o + 2] = c[2];
        image.data[o + 3] = a * 255;
        return;
      }
      g.globalAlpha = a;
      g.fillStyle = css(c);
      g.fillRect(i * step, j * step, step + 0.6, step + 0.6);
    },
    done() {
      g.globalAlpha = 1;
      if (!image || !bg || !bitmap) return;
      bg.putImageData(image, 0, 0);
      g.save();
      g.imageSmoothingEnabled = true;
      g.drawImage(bitmap, 0, 0, map.w * cell, map.h * cell);
      g.restore();
    }
  };
}

interface Hump {
  readonly cx: number;
  readonly cy: number;
  readonly W: number;
  readonly Hh: number;
  readonly lean: number;
}

/** Draws the terrain of `map` with cells of `cell` px into `g` (from (0, 0)). */
export function drawTerrainMap(g: CanvasRenderingContext2D, map: TerrainMap, cell: number, colours: TerrainColours, view: View = 'profile', detail: TerrainDetail = 'fine'): void {
  const k = cell / 44;
  const fine = detail === 'fine';
  const name = (x: number, y: number): string | null => (x < 0 || y < 0 || x >= map.w || y >= map.h ? null : (NAMES[map.terrain[y * map.w + x] ?? '.'] ?? 'plain'));
  const is = (x: number, y: number, n: string) => name(x, y) === n;
  const base = (n: string) => colours.base(n);
  const at = (u: number, v: number): Pt => [u * cell, v * cell];
  /** Distance (in cells, at most 2) from (u, v) to the nearest cell that is not `n`. */
  const distOut = (u: number, v: number, n: string): number => {
    let best = 2;
    const fx = Math.floor(u);
    const fy = Math.floor(v);
    for (let cy = fy - 2; cy <= fy + 2; cy++)
      for (let cx = fx - 2; cx <= fx + 2; cx++) {
        const c = name(cx, cy);
        if (c === n || c === null) continue;
        best = Math.min(best, Math.hypot(Math.max(cx - u, 0, u - (cx + 1)), Math.max(cy - v, 0, v - (cy + 1))));
      }
    return best;
  };
  const cellsOf = (n: string): Pt[] => {
    const list: Pt[] = [];
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) if (is(x, y, n)) list.push([x, y]);
    return list;
  };
  g.save();

  // ---- Pass 1: ground with soft, slightly ragged borders.
  const R = Math.max(6, Math.round(cell / (fine ? 2.75 : 6)));
  const ground = sampler(g, map, cell, R);
  const BLEND = 0.24;
  for (let y = 0; y < map.h; y++)
    for (let x = 0; x < map.w; x++) {
      const own = GROUND[name(x, y) ?? 'plain'] ?? 'plain';
      const ownRgb = rgb(base(own));
      const others: (readonly [number, number, Rgb])[] = [];
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const n = name(x + dx, y + dy);
          if ((!dx && !dy) || !n || GROUND[n] === own) continue;
          others.push([dx, dy, rgb(base(GROUND[n] ?? 'plain'))]);
        }
      if (!others.length) {
        for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) ground.set(x * R + i, y * R + j, ownRgb);
        continue;
      }
      for (let j = 0; j < R; j++)
        for (let i = 0; i < R; i++) {
          const u = (i + 0.5) / R;
          const v = (j + 0.5) / R;
          let c = ownRgb;
          for (const [dx, dy, col] of others) {
            const ddx = dx < 0 ? u : dx > 0 ? 1 - u : 0;
            const ddy = dy < 0 ? v : dy > 0 ? 1 - v : 0;
            if (dx && dy && (ddx > BLEND || ddy > BLEND)) continue;
            const d = Math.hypot(ddx, ddy) + (vnoise(x + u, y + v, 4, 5) - 0.5) * 0.16;
            const t = 0.5 * smooth(1 - d / BLEND);
            if (t > 0) c = mixRgb(c, col, t);
          }
          ground.set(x * R + i, y * R + j, c);
        }
    }
  ground.done();

  g.lineCap = 'round';
  g.lineJoin = 'round';

  // ---- Water: a smoothed water field decides the bank (round, a little ragged, never the cell's
  // square), deeper and darker away from it, shallow near it, a faint line of foam along it.
  const wb = rgb(base('water'));
  const shallow = mixRgb(mixRgb(wb, [140, 205, 200], 0.15), WHITE, 0.06);
  const deep = mixRgb(wb, [10, 30, 60], 0.26);
  const bank = mixRgb(rgb(base('plain')), wb, 0.22);
  const wet = (cx: number, cy: number) => (name(Math.min(map.w - 1, Math.max(0, cx)), Math.min(map.h - 1, Math.max(0, cy))) === 'water' ? 1 : 0);
  const S2W = 2 * 0.36 * 0.36;
  const waterField = (u: number, v: number): number => {
    let sum = 0;
    let all = 0;
    const fx = Math.floor(u);
    const fy = Math.floor(v);
    for (let cy = fy - 2; cy <= fy + 2; cy++)
      for (let cx = fx - 2; cx <= fx + 2; cx++) {
        const w = Math.exp(-((u - cx - 0.5) ** 2 + (v - cy - 0.5) ** 2) / S2W);
        all += w;
        sum += w * wet(cx, cy);
      }
    return sum / all + (vnoise(u, v, 3, 81) - 0.5) * 0.16;
  };
  const WN = Math.max(6, Math.round(cell / (fine ? 3 : 6)));
  const ws = cell / WN;
  const water = sampler(g, map, cell, WN);
  const shores: (readonly [number, number, (i: number, j: number) => number])[] = [];
  const wetCells = new Set<string>();
  for (const [x, y] of cellsOf('water')) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (name(x + dx, y + dy)) wetCells.add(`${x + dx},${y + dy}`);
  for (const id of wetCells) {
    const [x, y] = id.split(',').map(Number) as [number, number];
    const own = is(x, y, 'water');
    // Land takes water only where the field reaches into it, never over a ridge or a town.
    if (!own && !['plain', 'road', 'hill', 'swamp', 'forest'].includes(name(x, y) ?? '')) continue;
    const F: number[] = [];
    for (let j = 0; j <= WN; j++) for (let i = 0; i <= WN; i++) F.push(waterField(x + i / WN, y + j / WN));
    const f = (i: number, j: number) => F[j * (WN + 1) + i]!;
    for (let j = 0; j < WN; j++)
      for (let i = 0; i < WN; i++) {
        const m = (f(i, j) + f(i + 1, j) + f(i, j + 1) + f(i + 1, j + 1)) / 4;
        // Inside a water cell but beyond the bank: the shore shows; on land nothing changes.
        if (m < 0.5) {
          if (own) water.set(x * WN + i, y * WN + j, bank);
        } else water.set(x * WN + i, y * WN + j, mixRgb(shallow, deep, smooth((m - 0.52) / 0.42)));
      }
    shores.push([x, y, f]);
  }
  water.done();
  for (const [x, y, f] of shores) {
    g.strokeStyle = 'rgba(255,255,255,0.32)';
    g.lineWidth = k;
    g.beginPath();
    contour(g, f, WN, x * cell, y * cell, ws, 0.55);
    g.stroke();
  }
  // Glints on open water: short arcs on a map-wide lattice.
  for (let gy = 0; gy < map.h / 0.2; gy++)
    for (let gx = 0; gx < map.w / 0.2; gx++) {
      const u = (gx + 0.5 + (rnd(gx, gy, 91) - 0.5) * 0.9) * 0.2;
      const v = (gy + 0.5 + (rnd(gx, gy, 92) - 0.5) * 0.9) * 0.2;
      if (!is(Math.floor(u), Math.floor(v), 'water') || rnd(gx, gy, 93) < 0.45 || waterField(u, v) < 0.68) continue;
      const [cx, cy] = at(u, v);
      const len = (2.5 + rnd(gx, gy, 94) * 4) * k;
      g.strokeStyle = `rgba(255,255,255,${(0.3 + rnd(gx, gy, 95) * 0.4).toFixed(2)})`;
      g.lineWidth = 1.1 * k;
      g.beginPath();
      g.moveTo(cx - len, cy);
      g.quadraticCurveTo(cx, cy - 1.8 * k, cx + len, cy);
      g.stroke();
    }

  // ---- Swamp: pools and reeds.
  const sb = base('swamp');
  for (const [x, y] of cellsOf('swamp')) {
    g.fillStyle = css(mixRgb(rgb(sb), wb, 0.55));
    for (const [ex, ey, rx, ry] of [[0.3, 0.3, 0.18, 0.09], [0.7, 0.7, 0.2, 0.1]] as const) {
      const [cx, cy] = at(x + ex + (rnd(x, y, ex * 10) - 0.5) * 0.15, y + ey);
      g.beginPath();
      g.ellipse(cx, cy, rx * cell, ry * cell, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = shade(sb, -0.38);
    g.lineWidth = 1.1 * k;
    g.beginPath();
    for (const [rx, ry] of [[0.68, 0.3], [0.22, 0.68], [0.5, 0.5], [0.85, 0.92]] as const) {
      const [cx, cy] = at(x + rx, y + ry);
      for (const d of [-2.5, 0, 2.5]) {
        g.moveTo(cx + d * k, cy);
        g.lineTo(cx + d * 1.6 * k, cy - 6 * k);
      }
    }
    g.stroke();
  }

  // ---- Plain: grass tufts.
  g.strokeStyle = shade(base('plain'), -0.16);
  g.lineWidth = 1.1 * k;
  g.beginPath();
  for (const [x, y] of cellsOf('plain'))
    for (let i = 0; i < 4; i++) {
      const [tx, ty] = at(x + 0.12 + rnd(x, y, i) * 0.76, y + 0.15 + rnd(x, y, i + 9) * 0.75);
      g.moveTo(tx - 2 * k, ty);
      g.lineTo(tx - k, ty - 3 * k);
      g.moveTo(tx + 0.5 * k, ty);
      g.lineTo(tx + 1.5 * k, ty - 3.5 * k);
    }
  g.stroke();

  // ---- Roads: a band that joins neighbouring road cells.
  const rdb = base('road');
  for (const [x, y] of cellsOf('road')) {
    const links = ORTHOGONAL.filter(([dx, dy]) => is(x + dx, y + dy, 'road'));
    const [cx, cy] = at(x + 0.5, y + 0.5);
    const ends = (links.length ? links : ORTHOGONAL.slice(0, 2)).map(([dx, dy]): Pt => [cx + (dx * cell) / 2, cy + (dy * cell) / 2]);
    const band = (colour: string, width: number, dashes: number[] = []) => {
      g.strokeStyle = colour;
      g.lineWidth = width;
      g.setLineDash(dashes);
      g.beginPath();
      for (const [ex, ey] of ends) {
        g.moveTo(cx, cy);
        g.lineTo(ex, ey);
      }
      g.stroke();
    };
    g.lineCap = 'butt';
    band(shade(rdb, -0.25), 19 * k);
    g.lineCap = 'round';
    band(rdb, 16 * k);
    g.lineCap = 'butt';
    band(shade(rdb, 0.55), 1.4 * k, [4 * k, 4 * k]);
    g.setLineDash([]);
    g.lineCap = 'round';
  }

  // ---- Hills (and, seen from above, ridges): one height field of round summits that merge.
  const hillCells = cellsOf('hill');
  const ridgeTop = view === 'top' ? cellsOf('ridge') : [];
  const humpList: Hump[] = [];
  let drawHump: (h: Hump) => void = () => undefined;
  if (hillCells.length || ridgeTop.length) {
    const S2 = 2 * 0.42 * 0.42;
    const bumps: (readonly [number, number, number, number])[] = hillCells.map(([x, y]) => [x + 0.5 + (rnd(x, y, 11) - 0.5) * 0.3, y + 0.5 + (rnd(x, y, 12) - 0.5) * 0.3, 0.8 + rnd(x, y, 13) * 0.4, S2]);
    // Seen from above, ridges rise steep and high from the same field, so contour lines run on from
    // the hills into the mountains; peaks vary, saddles lie between them, foothills beside them.
    const seen = new Set<string>();
    for (const [x, y] of ridgeTop) {
      const links = ORTHOGONAL.filter(([dx, dy]) => is(x + dx, y + dy, 'ridge'));
      for (const [dx, dy] of links.length ? links : ORTHOGONAL.slice(0, 2))
        for (const t of links.length ? [0, 0.5] : [0, 0.25]) {
          const kx = Math.round((x + 0.5 + dx * t) * 12);
          const ky = Math.round((y + 0.5 + dy * t) * 12);
          if (seen.has(`${kx},${ky}`)) continue;
          seen.add(`${kx},${ky}`);
          const sg = 0.24 + rnd(kx, ky, 4) * 0.24;
          bumps.push([kx / 12 + (rnd(kx, ky, 1) - 0.5) * 0.4, ky / 12 + (rnd(kx, ky, 2) - 0.5) * 0.4, 0.9 + rnd(kx, ky, 3) * 2.4, 2 * sg * sg]);
          if (rnd(kx, ky, 5) < 0.65) {
            const off = (0.3 + rnd(kx, ky, 7) * 0.3) * (rnd(kx, ky, 6) < 0.5 ? -1 : 1);
            bumps.push([kx / 12 + (dy ? off : 0) + (rnd(kx, ky, 9) - 0.5) * 0.3, ky / 12 + (dy ? 0 : off) + (rnd(kx, ky, 10) - 0.5) * 0.3, 0.6 + rnd(kx, ky, 8) * 0.9, 2 * 0.32 * 0.32]);
          }
        }
    }
    // Bumps by cell, so a sample only looks at those within reach (2 cells).
    const bumpsNear = new Map<number, (typeof bumps)[number][]>();
    const bucket = (cx: number, cy: number) => (cy + 4) * (map.w + 8) + cx + 4;
    for (const b of bumps) {
      const id = bucket(Math.floor(b[0]), Math.floor(b[1]));
      const list = bumpsNear.get(id);
      if (list) list.push(b);
      else bumpsNear.set(id, [b]);
    }
    const height = (u: number, v: number): number => {
      let s = 0;
      const fx = Math.floor(u);
      const fy = Math.floor(v);
      for (let cy = fy - 2; cy <= fy + 2; cy++)
        for (let cx = fx - 2; cx <= fx + 2; cx++)
          for (const [bx, by, a, s2] of bumpsNear.get(bucket(cx, cy)) ?? []) {
            const d2 = (u - bx) ** 2 + (v - by) ** 2;
            if (d2 < 4) s += a * Math.exp(-d2 / s2);
          }
      // High ground is rugged: noise growing with the height breaks up the contour lines.
      if (ridgeTop.length && s > 0.25) s += (vnoise(u, v, 2.2, 63) - 0.5) * 0.8 * smooth((s - 0.25) / 0.8);
      if (ridgeTop.length && s > 0.9) s += (vnoise(u, v, 7, 61) - 0.5) * 0.9 * smooth((s - 0.9) / 1.2) + (vnoise(u, v, 15, 62) - 0.5) * 0.35 * smooth((s - 1.4) / 1);
      return s;
    };
    const hb = rgb(base('hill'));
    if (view === 'top') {
      const N = Math.max(8, Math.round(cell / (fine ? 2 : 5)));
      const st = cell / N;
      const rock = rgb(base('ridge'));
      const near = new Set<string>();
      for (const [x, y] of [...hillCells, ...ridgeTop]) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) near.add(`${x + dx},${y + dy}`);
      const relief = sampler(g, map, cell, N);
      const lines: (readonly [number, number, (i: number, j: number) => number])[] = [];
      for (const id of near) {
        const [x, y] = id.split(',').map(Number) as [number, number];
        if (!['hill', 'plain', 'road', 'ridge'].includes(name(x, y) ?? '')) continue; // never over a forest, town, swamp or water
        const H: number[] = [];
        for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) H.push(height(x + i / N, y + j / N));
        const h = (i: number, j: number) => H[j * (N + 1) + i]!;
        for (let j = 0; j < N; j++)
          for (let i = 0; i < N; i++) {
            const m = (h(i, j) + h(i + 1, j) + h(i, j + 1) + h(i + 1, j + 1)) / 4;
            const a = smooth((m - 0.12) / 0.4) * (is(x, y, 'hill') || is(x, y, 'ridge') ? 1 : 0.85);
            if (a <= 0.01) continue;
            // Lit where the ground rises towards the lower right (it faces the light at the top left).
            const sx = (h(i + 1, j) + h(i + 1, j + 1) - h(i, j) - h(i, j + 1)) * N * 0.5;
            const sy = (h(i, j + 1) + h(i + 1, j + 1) - h(i, j) - h(i + 1, j)) * N * 0.5;
            const lit = Math.max(-1, Math.min(1, (sx + sy) * 0.3));
            // Hill colour low down, bare rock high up.
            let c = mixRgb(hb, rock, smooth((m - 1.1) / 0.9));
            c = mixRgb(c, WHITE, 0.2 * smooth((m - 0.5) / 0.9));
            c = mixRgb(c, lit >= 0 ? WHITE : BLACK, Math.abs(lit) * 0.32);
            relief.set(x * N + i, y * N + j, c, a);
          }
        lines.push([x, y, h]);
      }
      relief.done();
      for (const [x, y, h] of lines) {
        // Contours every 0.3; every fourth (an index line) a little stronger.
        const levels = Array.from({ length: 12 }, (_, i) => 0.3 * (i + 1));
        g.strokeStyle = css(mixRgb(hb, BLACK, 0.32));
        g.lineWidth = k;
        g.beginPath();
        levels.forEach((level, i) => i % 4 !== 3 && contour(g, h, N, x * cell, y * cell, st, level));
        g.stroke();
        g.strokeStyle = css(mixRgb(rock, BLACK, 0.42));
        g.lineWidth = 1.3 * k;
        g.beginPath();
        levels.forEach((level, i) => i % 4 === 3 && contour(g, h, N, x * cell, y * cell, st, level));
        g.stroke();
        // Rock on the steep slopes: short strokes running downhill.
        g.strokeStyle = css(mixRgb(rock, BLACK, 0.45));
        g.lineWidth = k;
        g.beginPath();
        for (let j = 0; j < N; j += 2)
          for (let i = 0; i < N; i += 2) {
            const sx = (h(Math.min(N, i + 1), j) - h(Math.max(0, i - 1), j)) * N * 0.5;
            const sy = (h(i, Math.min(N, j + 1)) - h(i, Math.max(0, j - 1))) * N * 0.5;
            const slope = Math.hypot(sx, sy);
            if (h(i, j) < 1.2 || slope < 3 || rnd(x * N + i, y * N + j, 97) > 0.65) continue;
            const l = Math.min(5, 1.5 + slope * 0.3) * k;
            g.moveTo(x * cell + i * st, y * cell + j * st);
            g.lineTo(x * cell + i * st - (sx / slope) * l, y * cell + j * st - (sy / slope) * l);
          }
        g.stroke();
      }
    } else {
      // Humps: big rounded grassy domes seen from the side (dark outline, lit from above, a ground shadow) on
      // a map-wide lattice where the field is high, biggest in the middle of a group. A soft tint
      // under them, never over a forest, a town, a swamp or water.
      g.save();
      const open = new Path2D();
      for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) if (['hill', 'plain', 'road'].includes(name(x, y) ?? '')) open.rect(x * cell, y * cell, cell, cell);
      g.clip(open);
      for (const [x, y] of hillCells) {
        const [cx, cy] = at(x + 0.5, y + 0.5);
        const grad = g.createRadialGradient(cx, cy, 0, cx, cy, cell * 0.7);
        grad.addColorStop(0, css(hb));
        grad.addColorStop(0.55, `rgba(${hb.map(Math.round).join(',')},0.7)`);
        grad.addColorStop(1, `rgba(${hb.map(Math.round).join(',')},0)`);
        g.fillStyle = grad;
        g.fillRect(cx - cell, cy - cell, cell * 2, cell * 2);
      }
      g.restore();
      const sp = 0.56;
      for (let gy = -1; gy <= map.h / sp + 1; gy++)
        for (let gx = -1; gx <= map.w / sp + 1; gx++) {
          const u = (gx + (gy % 2) * 0.5 + (rnd(gx, gy, 21) - 0.5) * 0.45) * sp;
          const v = (gy + 0.6 + (rnd(gx, gy, 22) - 0.5) * 0.3) * sp;
          const hh = Math.min(1.3, height(u, v));
          if (hh < 0.5) continue;
          const [cx, cy] = at(u, v);
          const r2 = rnd(gx, gy, 24);
          humpList.push({ cx, cy, W: (13 + 7 * hh + rnd(gx, gy, 23) * 6) * k, Hh: (8 + 7 * hh + r2 * 4) * k, lean: (r2 - 0.5) * 0.3 });
        }
      const edge = css(mixRgb(hb, BLACK, 0.45));
      drawHump = ({ cx, cy, W, Hh, lean }) => {
        // A rolling hill: a bell that runs out softly at its foot and has a round crown (no peak), the
        // crown shifted by its lean.
        const top = cx + lean * W;
        const curve = () => {
          g.beginPath();
          g.moveTo(cx - W, cy);
          g.bezierCurveTo(cx - W * 0.86, cy - Hh * 0.42, top - W * 0.72, cy - Hh, top, cy - Hh);
          g.bezierCurveTo(top + W * 0.72, cy - Hh, cx + W * 0.86, cy - Hh * 0.42, cx + W, cy);
        };
        g.fillStyle = 'rgba(0,0,0,0.16)';
        g.beginPath();
        g.ellipse(cx + 2 * k, cy + 0.5 * k, W * 0.95, 2.4 * k, 0, 0, Math.PI * 2);
        g.fill();
        const grad = g.createLinearGradient(0, cy - Hh, 0, cy);
        grad.addColorStop(0, css(mixRgb(hb, WHITE, 0.4)));
        grad.addColorStop(0.5, css(hb));
        grad.addColorStop(1, css(mixRgb(hb, BLACK, 0.22)));
        g.fillStyle = grad;
        curve();
        g.closePath();
        g.fill();
        g.strokeStyle = edge;
        g.lineWidth = 1.3 * k;
        curve();
        g.stroke();
      };
    }
  }

  // ---- Forest: trees on a map-wide lattice, thinning out towards the edge; now and then a small
  // one just outside. From the side, humps and trees are drawn back to front, and a tree on a hump
  // stands on it (with a trunk down to its surface) instead of between the humps.
  const fb = base('forest');
  const trees: (readonly [number, number, number])[] = [];
  const ts = 0.25;
  for (let gy = 0; gy < map.h / ts; gy++)
    for (let gx = 0; gx < map.w / ts; gx++) {
      const u = (gx + 0.5 + (rnd(gx, gy, 31) - 0.5) * 0.7) * ts;
      const v = (gy + 0.5 + (rnd(gx, gy, 32) - 0.5) * 0.7) * ts;
      const cx = Math.floor(u);
      const cy = Math.floor(v);
      const r = rnd(gx, gy, 33);
      if (is(cx, cy, 'forest')) {
        const edge = smooth(distOut(u, v, 'forest') / 0.35);
        if (r < 0.12 + 0.3 * (1 - edge)) continue;
        trees.push([u, v, (6.3 + r * 2.6) * (0.72 + 0.28 * edge)]);
      } else if (is(cx, cy, 'plain') || is(cx, cy, 'hill') || is(cx, cy, 'swamp')) {
        const fx = u - cx;
        const fy = v - cy;
        const nearForest = (fx < 0.22 && is(cx - 1, cy, 'forest')) || (fx > 0.78 && is(cx + 1, cy, 'forest')) || (fy < 0.22 && is(cx, cy - 1, 'forest')) || (fy > 0.78 && is(cx, cy + 1, 'forest'));
        if (nearForest && r < 0.45) trees.push([u, v, 4 + r * 3]);
      }
    }
  type Item = { readonly key: number; readonly hump?: Hump; readonly tree?: readonly [number, number, number, number | null] };
  const items: Item[] = humpList.map((hump) => ({ key: hump.cy, hump }));
  for (const [u, v, r] of trees) {
    const [tx, ty] = at(u, v);
    let best: { y: number; key: number } | null = null;
    for (const hm of humpList) {
      const f = (tx - hm.cx) / hm.W;
      if (Math.abs(f) > 0.85 || hm.cy < ty - 2 * k || hm.cy > ty + 0.45 * cell) continue;
      const lift = hm.Hh * 0.95 * (1 - f * f);
      if (!best || hm.cy - lift < best.y) best = { y: hm.cy - lift, key: hm.cy + 0.5 };
    }
    items.push(best ? { key: best.key, tree: [tx, best.y - r * k * 0.75, r, best.y] } : { key: ty + r * k, tree: [tx, ty, r, null] });
  }
  items.sort((a, b) => a.key - b.key);
  const flat = view === 'top';
  for (const item of items) {
    if (item.hump) {
      drawHump(item.hump);
      continue;
    }
    if (!item.tree) continue;
    const [cx, cy, r, ground] = item.tree;
    const rr = r * k;
    if (ground !== null) {
      g.strokeStyle = shade(fb, -0.55);
      g.lineWidth = 1.6 * k;
      g.beginPath();
      g.moveTo(cx, cy + rr * 0.6);
      g.lineTo(cx, ground);
      g.stroke();
    }
    g.fillStyle = shade(fb, flat ? -0.2 : -0.38);
    g.beginPath();
    g.arc(cx + (flat ? 1.2 : 2) * k, cy + (flat ? 1.3 : 2.2) * k, rr, 0, Math.PI * 2);
    g.fill();
    const grad = g.createRadialGradient(cx - rr * 0.4, cy - rr * 0.4, rr * 0.1, cx, cy, rr);
    grad.addColorStop(0, shade(fb, flat ? 0.06 : colours.dark ? 0.12 : 0.18));
    grad.addColorStop(1, shade(fb, flat ? -0.08 : -0.2));
    g.fillStyle = grad;
    g.beginPath();
    g.arc(cx, cy, rr, 0, Math.PI * 2);
    g.fill();
  }

  // ---- Towns: houses on a map-wide lattice of lots; denser and bigger inside a town, smaller and
  // sparser at its edge, none on roads. From the side: walls, gable or flat roofs, windows, a door,
  // drawn like the units. From above: hipped roofs.
  const ub = base('urban');
  const edgeU = shade(ub, -0.6);
  const roofs: readonly (readonly [string, string])[] = [
    [shade(ub, -0.45), shade(ub, -0.25)],
    [css(mixRgb(rgb(ub), [94, 74, 60], 0.6)), css(mixRgb(rgb(ub), [111, 90, 74], 0.4))],
    [shade(ub, -0.58), shade(ub, -0.4)]
  ];
  const lots: (readonly [number, number, number, number, number, number])[] = [];
  for (let gy = 0; gy < map.h / 0.5 + 1; gy++)
    for (let gx = 0; gx < map.w / 0.5 + 1; gx++) {
      const u = (gx + 0.5 + (gy % 2) * 0.35 + (rnd(gx, gy, 41) - 0.5) * 0.3) * 0.5;
      const v = (gy + 0.85 + (rnd(gx, gy, 42) - 0.5) * 0.12) * 0.5;
      const cx = Math.floor(u);
      const cy = Math.floor(v - 0.1);
      if (!is(cx, cy, 'urban')) continue;
      const r = rnd(gx, gy, 43);
      const town = ORTHOGONAL.filter(([dx, dy]) => is(cx + dx, cy + dy, 'urban')).length;
      if (r < (town >= 2 ? 0.05 : 0.2)) continue;
      lots.push([u, v, r, rnd(gx, gy, 44), rnd(gx, gy, 45), town >= 3 ? 1.12 : town === 0 ? 0.85 : 1]);
    }
  lots.sort((a, b) => a[1] - b[1]);
  const vgrad = (top: string, bottom: string, y0: number, y1: number) => {
    const gr = g.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, top);
    gr.addColorStop(1, bottom);
    return gr;
  };
  for (const [u, v, r, r2, r3, big] of lots) {
    const [x0, gy0] = at(u, v);
    g.strokeStyle = edgeU;
    if (view === 'top') {
      const turn = r > 0.7;
      const L = (13 + r2 * 4) * big * k;
      const B = (9 + r3 * 2.5) * big * k;
      const fw = turn ? B : L;
      const fd = turn ? L : B;
      const x2 = x0 - fw / 2;
      const y2 = gy0 - fd;
      const tone: Rgb = ([[150, 120, 98], [122, 126, 132], [138, 110, 92]] as const)[Math.floor(r2 * 3) % 3]!;
      const parts: (readonly [number, number, number, number])[] = [[x2, y2, fw, fd]];
      if (r3 > 0.72) parts.push(turn ? [x2 + fw - k, y2 + fd * 0.5, fw * 0.95, B * 0.85] : [x2 + fw * 0.6, y2 + fd - k, B * 0.85, fd * 0.8]);
      g.fillStyle = 'rgba(0,0,0,0.26)';
      for (const [px2, py2, w2, d2] of parts) g.fillRect(px2 + 2.6 * k, py2 + 2.6 * k, w2, d2);
      const face = (pts: readonly Pt[], c: Rgb) => {
        g.fillStyle = css(c);
        g.beginPath();
        pts.forEach(([qx, qy], j) => (j ? g.lineTo(qx, qy) : g.moveTo(qx, qy)));
        g.closePath();
        g.fill();
        g.stroke();
      };
      // A hipped roof: four faces, the one towards the light (top left) lightest.
      const up = mixRgb(tone, WHITE, 0.38);
      const left = mixRgb(tone, WHITE, 0.15);
      const right = mixRgb(tone, BLACK, 0.18);
      const down = mixRgb(tone, BLACK, 0.34);
      for (const [px2, py2, w2, d2] of parts) {
        const inset = Math.min(w2, d2) / 2;
        g.lineWidth = 0.9 * k;
        if (w2 >= d2) {
          const a: Pt = [px2 + inset, py2 + d2 / 2];
          const b: Pt = [px2 + w2 - inset, py2 + d2 / 2];
          face([[px2, py2], [px2 + w2, py2], b, a], up);
          face([[px2, py2 + d2], [px2 + w2, py2 + d2], b, a], down);
          face([[px2, py2], [px2, py2 + d2], a], left);
          face([[px2 + w2, py2], [px2 + w2, py2 + d2], b], right);
        } else {
          const a: Pt = [px2 + w2 / 2, py2 + inset];
          const b: Pt = [px2 + w2 / 2, py2 + d2 - inset];
          face([[px2, py2], [px2, py2 + d2], b, a], left);
          face([[px2 + w2, py2], [px2 + w2, py2 + d2], b, a], right);
          face([[px2, py2], [px2 + w2, py2], a], up);
          face([[px2, py2 + d2], [px2 + w2, py2 + d2], b], down);
        }
        g.lineWidth = 1.2 * k;
        g.strokeRect(px2, py2, w2, d2);
      }
      if (r > 0.3) {
        const cx2 = x2 + fw * 0.68;
        const cy2 = y2 + fd * 0.22;
        g.fillStyle = 'rgba(0,0,0,0.3)';
        g.fillRect(cx2 + 1.4 * k, cy2 + 1.4 * k, 2.8 * k, 2.8 * k);
        g.fillStyle = css(mixRgb(tone, BLACK, 0.45));
        g.fillRect(cx2, cy2, 2.8 * k, 2.8 * k);
        g.lineWidth = 0.9 * k;
        g.strokeRect(cx2, cy2, 2.8 * k, 2.8 * k);
      }
      continue;
    }
    const w = (12 + r2 * 6) * big;
    const h = (9 + r3 * 4) * big + (r > 0.86 ? 5 : 0);
    const W = w * k;
    const x1 = x0 - W / 2;
    const y1 = gy0 - h * k;
    const [roofFront, roofSide] = roofs[Math.floor(r2 * 3) % 3]!;
    g.lineWidth = 1.2 * k;
    g.fillStyle = 'rgba(0,0,0,0.18)';
    g.beginPath();
    g.ellipse(x0 + 2 * k, gy0 + 0.6 * k, W * 0.66, 2.2 * k, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = vgrad(shade(ub, 0.62), shade(ub, 0.18), y1, gy0);
    g.fillRect(x1, y1, W, h * k);
    g.strokeRect(x1, y1, W, h * k);
    g.beginPath();
    if (r3 > 0.3) {
      const rh = (5 + r * 3) * k;
      g.moveTo(x1 - 1.5 * k, y1);
      g.lineTo(x1 + W / 2, y1 - rh);
      g.lineTo(x1 + W + 1.5 * k, y1);
      g.closePath();
      g.fillStyle = vgrad(roofSide, roofFront, y1 - rh, y1);
      g.fill();
      g.stroke();
      g.fillStyle = roofFront;
      g.fillRect(x1 + W * 0.68, y1 - rh * 0.85, 2.2 * k, 3.4 * k);
      g.strokeRect(x1 + W * 0.68, y1 - rh * 0.85, 2.2 * k, 3.4 * k);
    } else {
      g.rect(x1 - 0.8 * k, y1 - 2.4 * k, W + 1.6 * k, 2.6 * k);
      g.fillStyle = roofFront;
      g.fill();
      g.stroke();
    }
    g.fillStyle = shade(ub, -0.5);
    g.fillRect(x1 + W / 2 - 1.4 * k, gy0 - 4.6 * k, 2.8 * k, 4.6 * k);
    for (let wy = 2.4; wy < h - 6; wy += 4.6) {
      g.fillRect(x1 + 2 * k, y1 + wy * k, 2.4 * k, 2.4 * k);
      g.fillRect(x1 + W - 4.4 * k, y1 + wy * k, 2.4 * k, 2.4 * k);
    }
  }

  // ---- Ridges from the side: a chain along the links between ridge cells, irregular as real
  // mountains (peaks shifted across the chain, some set forward or back, sizes spread wide, now and
  // then a foothill) on a foot of rubble mounds and scree. Shared points are alike for both cells.
  const rb = base('ridge');
  if (view !== 'top') {
    type Point = { u: number; v: number; kx: number; ky: number; kind: 'front' | 'back' | 'foot' };
    const points = new Map<string, Point>();
    for (const [x, y] of cellsOf('ridge')) {
      const links = ORTHOGONAL.filter(([dx, dy]) => is(x + dx, y + dy, 'ridge'));
      for (const [dx, dy] of links.length ? links : ORTHOGONAL.slice(0, 2))
        for (const t of links.length ? [0, 0.25, 0.5] : [0, 0.25]) {
          const bu = x + 0.5 + dx * t;
          const bv = y + 0.5 + dy * t;
          const kx = Math.round(bu * 12);
          const ky = Math.round(bv * 12);
          const id = `${kx},${ky}`;
          if (points.has(id)) continue;
          const across = (rnd(kx, ky, 9) - 0.5) * 0.36;
          const along = (rnd(kx, ky, 10) - 0.5) * 0.12;
          const u = bu + dx * along + (dy ? across : 0);
          const v = bv + dy * along + (dy ? 0 : across);
          points.set(id, { u, v, kx, ky, kind: rnd(kx, ky, 11) < 0.38 ? 'back' : 'front' });
          if (rnd(kx, ky, 12) < 0.3) points.set(`${id}f`, { u: u + (rnd(kx, ky, 13) - 0.5) * 0.2, v: v + 0.22, kx: kx + 100, ky, kind: 'foot' });
        }
    }
    for (const p of points.values()) {
      const [cx, cy] = at(p.u, p.v + 0.24);
      g.fillStyle = shade(rb, -0.2);
      g.beginPath();
      g.ellipse(cx, cy, (0.26 + rnd(p.kx, p.ky, 14) * 0.12) * cell, (0.1 + rnd(p.kx, p.ky, 15) * 0.05) * cell, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = shade(rb, -0.45);
      for (let i = 0; i < 3; i++) {
        g.beginPath();
        g.arc(cx + (rnd(p.kx, p.ky, 50 + i) - 0.5) * 0.4 * cell, cy + (rnd(p.kx, p.ky, 60 + i) - 0.3) * 0.12 * cell, (0.8 + rnd(p.kx, p.ky, 70 + i)) * k, 0, Math.PI * 2);
        g.fill();
      }
    }
    const peaks = [...points.values()].map((p) => {
      const q = (i: number) => rnd(p.kx, p.ky, i);
      if (p.kind === 'foot') return { ...p, v: p.v + 0.26, w: 0.14 + q(2) * 0.08, h: 0.2 + q(3) * 0.14, lift: 0.05 };
      if (p.kind === 'back') return { ...p, v: p.v + 0.12, w: 0.2 + q(2) * 0.14, h: 0.32 + q(3) * 0.3, lift: 0.16 };
      return { ...p, v: p.v + 0.26, w: 0.24 + q(2) * 0.18, h: 0.42 + q(3) * 0.42, lift: 0 };
    });
    peaks.sort((a, b) => a.v - b.v || a.u - b.u);
    for (const p of peaks) {
      const q = (i: number) => rnd(p.kx, p.ky, i + 20);
      const [bx, by] = at(p.u, p.v);
      const hw = p.w * cell;
      const hh = p.h * cell;
      const tx = bx + (q(1) - 0.5) * 0.7 * hw;
      const ty = by - hh;
      // Shoulders at random heights on both flanks, a facet from the tip to the foot.
      const ls: Pt = [tx - hw * (0.3 + q(2) * 0.25), ty + hh * (0.3 + q(3) * 0.3)];
      const rs: Pt = [tx + hw * (0.3 + q(4) * 0.25), ty + hh * (0.35 + q(5) * 0.3)];
      const mx = tx + (q(6) - 0.4) * 0.4 * hw;
      g.fillStyle = shade(rb, 0.32 + p.lift);
      g.beginPath();
      g.moveTo(bx - hw, by);
      g.lineTo(ls[0], ls[1]);
      g.lineTo(tx, ty);
      g.lineTo(mx, by);
      g.closePath();
      g.fill();
      g.fillStyle = shade(rb, -0.34 + p.lift);
      g.beginPath();
      g.moveTo(tx, ty);
      g.lineTo(rs[0], rs[1]);
      g.lineTo(bx + hw, by);
      g.lineTo(mx, by);
      g.closePath();
      g.fill();
      g.strokeStyle = shade(rb, 0.05 + p.lift);
      g.lineWidth = k;
      g.beginPath();
      g.moveTo(ls[0], ls[1]);
      g.lineTo(ls[0] + hw * 0.25, by);
      g.stroke();
      if (p.h > 0.3) {
        g.fillStyle = shade(rb, 0.72);
        g.beginPath();
        g.moveTo(tx, ty);
        g.lineTo(tx - hw * 0.24, ty + hh * 0.24);
        g.lineTo(tx - hw * 0.08, ty + hh * (0.16 + q(7) * 0.08));
        g.lineTo(tx + hw * 0.03, ty + hh * 0.28);
        g.lineTo(tx + hw * 0.13, ty + hh * (0.15 + q(8) * 0.08));
        g.lineTo(tx + hw * 0.22, ty + hh * 0.25);
        g.closePath();
        g.fill();
      }
      g.strokeStyle = shade(rb, -0.5);
      g.lineWidth = 1.2 * k;
      g.beginPath();
      g.moveTo(bx - hw, by);
      g.lineTo(ls[0], ls[1]);
      g.lineTo(tx, ty);
      g.lineTo(rs[0], rs[1]);
      g.lineTo(bx + hw, by);
      g.stroke();
    }
  }
  g.restore();
}
