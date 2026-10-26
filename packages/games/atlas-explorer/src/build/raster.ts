/**
 * Data script only: the worldview check of design § 12.4. Each view (Natural Earth's default countries layer and its
 * point-of-view variants) is rasterised on a regular lon/lat grid (cell centres, even–odd scanlines); cells where a
 * view disagrees with the default view, outside the hatched areas and outside documented exceptions, are reported.
 */
import { EARTH_RADIUS_KM } from '../geo';
import type { Polygon } from './geojson';

const RAD = Math.PI / 180;

export interface Grid {
  readonly res: number;
  readonly w: number;
  readonly h: number;
}

export const makeGrid = (res: number): Grid => ({ res, w: Math.round(360 / res), h: Math.round(180 / res) });

/** Area (km²) of one cell in row `j`. */
export const cellAreaKm2 = (g: Grid, j: number): number => {
  const top = 90 - j * g.res;
  return EARTH_RADIUS_KM * EARTH_RADIUS_KM * g.res * RAD * Math.abs(Math.sin(top * RAD) - Math.sin((top - g.res) * RAD));
};

/** Paints `value` into `cells` (row-major, row 0 at 90° N) for every cell centre inside the polygon (holes respected). */
export function paintPolygon(g: Grid, cells: Int32Array | Uint8Array, poly: Polygon, value: number): void {
  const rows = new Map<number, number[]>();
  for (const ring of poly)
    for (let k = 0; k + 1 < ring.length; k++) {
      const [x1, y1] = ring[k]!;
      const [x2, y2] = ring[k + 1]!;
      if (y1 === y2) continue;
      const lo = Math.min(y1, y2);
      const hi = Math.max(y1, y2);
      // Rows whose centre latitude c satisfies lo <= c < hi (half-open, so shared vertices count once).
      const jStart = Math.max(0, Math.ceil((90 - hi) / g.res - 0.5));
      const jEnd = Math.min(g.h - 1, Math.floor((90 - lo) / g.res - 0.5));
      for (let j = jStart; j <= jEnd; j++) {
        const c = 90 - (j + 0.5) * g.res;
        if (!(c >= lo && c < hi)) continue;
        const x = x1 + ((c - y1) * (x2 - x1)) / (y2 - y1);
        const list = rows.get(j) ?? [];
        list.push(x);
        rows.set(j, list);
      }
    }
  for (const [j, xs] of rows) {
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const iStart = Math.max(0, Math.ceil((xs[k]! + 180) / g.res - 0.5));
      const iEnd = Math.min(g.w - 1, Math.floor((xs[k + 1]! + 180) / g.res - 0.5));
      for (let i = iStart; i <= iEnd; i++) cells[j * g.w + i] = value;
    }
  }
}

/** Rasterises features (value = index + 1; 0 = no feature). */
export function rasterize(g: Grid, features: readonly (readonly Polygon[])[]): Int32Array {
  const cells = new Int32Array(g.w * g.h);
  features.forEach((polys, i) => {
    for (const p of polys) paintPolygon(g, cells, p, i + 1);
  });
  return cells;
}

/** One disagreement between the default view and another view: default code → view code, with its area. */
export interface Disagreement {
  readonly from: string;
  readonly to: string;
  km2: number;
  cells: number;
}

/**
 * Compares a view raster with the default raster outside `mask` (cells to ignore), grouping disagreements by the
 * pair of codes (`''` = no country). Codes are looked up by value − 1.
 */
export function compareViews(g: Grid, base: Int32Array, baseCodes: readonly string[], view: Int32Array, viewCodes: readonly string[], mask: Uint8Array): Disagreement[] {
  const pairs = new Map<string, Disagreement>();
  for (let j = 0; j < g.h; j++) {
    const area = cellAreaKm2(g, j);
    for (let i = 0; i < g.w; i++) {
      const k = j * g.w + i;
      if (mask[k]) continue;
      const a = base[k] ? baseCodes[base[k]! - 1]! : '';
      const b = view[k] ? viewCodes[view[k]! - 1]! : '';
      if (a === b) continue;
      const key = `${a}>${b}`;
      const d = pairs.get(key) ?? { from: a, to: b, km2: 0, cells: 0 };
      d.km2 += area;
      d.cells += 1;
      pairs.set(key, d);
    }
  }
  return [...pairs.values()].sort((x, y) => y.km2 - x.km2);
}

/**
 * Marks with `to` every cell of value `from` that is 4-connected (wrapping around the antimeridian) to one of the
 * seed points: e.g. the world ocean on a land mask, seeded in each ocean and in seas whose straits are narrower than
 * a cell. Returns the number of cells marked.
 */
export function floodFill(g: Grid, cells: Uint8Array, seeds: readonly (readonly [number, number])[], from: number, to: number): number {
  const queue = new Int32Array(g.w * g.h);
  let head = 0;
  let tail = 0;
  const visit = (k: number) => {
    if (cells[k] !== from) return;
    cells[k] = to;
    queue[tail++] = k;
  };
  for (const [lon, lat] of seeds) {
    const i = Math.min(g.w - 1, Math.max(0, Math.floor((lon + 180) / g.res)));
    const j = Math.min(g.h - 1, Math.max(0, Math.floor((90 - lat) / g.res)));
    visit(j * g.w + i);
  }
  while (head < tail) {
    const k = queue[head++]!;
    const j = Math.floor(k / g.w);
    const i = k - j * g.w;
    visit(j * g.w + ((i + 1) % g.w));
    visit(j * g.w + ((i + g.w - 1) % g.w));
    if (j > 0) visit(k - g.w);
    if (j < g.h - 1) visit(k + g.w);
  }
  return tail;
}

/** Whether any cell within `radius` cells of the point has the value `v`. */
export function near(g: Grid, cells: Uint8Array, lon: number, lat: number, radius: number, v: number): boolean {
  const i0 = Math.floor((lon + 180) / g.res);
  const j0 = Math.floor((90 - lat) / g.res);
  for (let dj = -radius; dj <= radius; dj++) {
    const j = j0 + dj;
    if (j < 0 || j >= g.h) continue;
    for (let di = -radius; di <= radius; di++) if (cells[j * g.w + (((i0 + di) % g.w) + g.w) % g.w] === v) return true;
  }
  return false;
}
