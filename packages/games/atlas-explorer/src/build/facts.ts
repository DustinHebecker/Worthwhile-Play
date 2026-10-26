/**
 * Data script only: facts computed from the full-resolution (quantised, unsimplified) data (design § 11.3, § 12.3):
 * spherical areas, border and line lengths, the hatched-border test and the land-border rule, sampled areas.
 */
import { EARTH_RADIUS_KM, POLAR_CIRCLE, TROPIC, distanceKm, pointInRings, type Flat } from '../geo';
import type { Path, Polygon } from './geojson';

const RAD = Math.PI / 180;

/**
 * Area (km², unsigned) of a ring on the sphere, by the line-integral formula for spherical polygons with
 * great-circle-free edges approximated per segment (as in common GIS tools); accurate to well under 1 % for
 * country-sized rings with dense vertices.
 */
export function ringAreaKm2(ring: Path): number {
  let sum = 0;
  for (let i = 0; i + 1 < ring.length; i++) {
    const [l1, p1] = ring[i]!;
    const [l2, p2] = ring[i + 1]!;
    sum += (l2 - l1) * RAD * (2 + Math.sin(p1 * RAD) + Math.sin(p2 * RAD));
  }
  const [l0, p0] = ring[0]!;
  const [ln, pn] = ring[ring.length - 1]!;
  if (l0 !== ln || p0 !== pn) sum += (l0 - ln) * RAD * (2 + Math.sin(pn * RAD) + Math.sin(p0 * RAD));
  return Math.abs((sum * EARTH_RADIUS_KM * EARTH_RADIUS_KM) / 2);
}

/** Area (km²) of a polygon: outer ring minus holes. */
export const polygonAreaKm2 = (poly: Polygon): number => Math.max(0, ringAreaKm2(poly[0]!) - poly.slice(1).reduce((s, h) => s + ringAreaKm2(h), 0));

/** Keeps polygons of at least `minKm2`, and always the largest one (so no country disappears). */
export function dropSmallParts(polys: readonly Polygon[], minKm2: number): Polygon[] {
  if (polys.length === 0) return [];
  const areas = polys.map(polygonAreaKm2);
  const largest = areas.indexOf(Math.max(...areas));
  return polys.filter((_, i) => i === largest || areas[i]! >= minKm2);
}

/** Length (km) of a flat lon/lat line (degrees). */
export function lineLengthKm(flat: Flat): number {
  let km = 0;
  for (let i = 2; i < flat.length; i += 2) km += distanceKm(flat[i - 2]!, flat[i - 1]!, flat[i]!, flat[i + 1]!);
  return km;
}

/**
 * True when either side of the segment A–B (degrees) lies in a hatched area (design § 12.3): the two points offset
 * from the segment's middle by `offsetKm` perpendicular to it are tested with `inHatch`.
 */
export function segmentHatched(ax: number, ay: number, bx: number, by: number, inHatch: (lon: number, lat: number) => boolean, offsetKm = 1.5): boolean {
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const k = Math.cos(my * RAD);
  // Direction in a local east/north frame (km per degree ≈ 111.2, longitude shrinks with cos φ).
  const ex = (bx - ax) * k;
  const ny = by - ay;
  const len = Math.hypot(ex, ny);
  if (len === 0) return inHatch(mx, my);
  const d = offsetKm / 111.195;
  const ox = (-ny / len) * d;
  const oy = (ex / len) * d;
  return inHatch(mx + ox / Math.max(k, 1e-6), my + oy) || inHatch(mx - ox / Math.max(k, 1e-6), my - oy);
}

/** Length (km) of a flat border line outside hatched areas (segment by segment). */
export function unhatchedLengthKm(flat: Flat, inHatch: (lon: number, lat: number) => boolean): number {
  let km = 0;
  for (let i = 2; i < flat.length; i += 2) {
    const ax = flat[i - 2]!;
    const ay = flat[i - 1]!;
    const bx = flat[i]!;
    const by = flat[i + 1]!;
    if (!segmentHatched(ax, ay, bx, by, inHatch)) km += distanceKm(ax, ay, bx, by);
  }
  return km;
}

/** The land-border rule (design § 12.3): at least `minKm` (5) of shared border outside hatched areas. */
export const areNeighbours = (unhatchedKm: number, minKm = 5): boolean => unhatchedKm >= minKm;

/** Length (km) of the parts of flat lines whose segment midpoints lie inside `inside`. */
export function lengthInsideKm(lines: readonly Flat[], inside: (lon: number, lat: number) => boolean): number {
  let km = 0;
  for (const l of lines)
    for (let i = 2; i < l.length; i += 2) {
      const ax = l[i - 2]!;
      const ay = l[i - 1]!;
      const bx = l[i]!;
      const by = l[i + 1]!;
      if (inside((ax + bx) / 2, (ay + by) / 2)) km += distanceKm(ax, ay, bx, by);
    }
  return km;
}

/** Area (km²) of the sample cells (`step` degrees) within a box whose centres satisfy `inside`. */
export function sampledAreaKm2(box: readonly [number, number, number, number], step: number, inside: (lon: number, lat: number) => boolean): number {
  let km2 = 0;
  const [x0, y0, x1, y1] = box;
  for (let y = Math.floor(y0 / step) * step; y < y1; y += step) {
    const cell = EARTH_RADIUS_KM * EARTH_RADIUS_KM * step * RAD * Math.abs(Math.sin(Math.min(90, y + step) * RAD) - Math.sin(Math.max(-90, y) * RAD));
    for (let x = Math.floor(x0 / step) * step; x < x1; x += step) if (inside(x + step / 2, y + step / 2)) km2 += cell;
  }
  return km2;
}

/** Bits of the `lines` fact: which special lines cross a territory. */
export const LINE_BITS = { equator: 1, cancer: 2, capricorn: 4, arctic: 8, antarctic: 16, meridian: 32 } as const;

/**
 * Which special lines cross at least one of the polygons (each polygon is connected, so a line crosses it exactly
 * when the polygon's latitude or longitude range strictly contains the line).
 */
export function linesCrossed(polys: readonly Polygon[]): number {
  let bits = 0;
  for (const poly of polys) {
    const outer = poly[0]!;
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLon = Infinity;
    let maxLon = -Infinity;
    for (const [lon, lat] of outer) {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
    }
    const crosses = (v: number, a: number, b: number) => a < v && v < b;
    if (crosses(0, minLat, maxLat)) bits |= LINE_BITS.equator;
    if (crosses(TROPIC, minLat, maxLat)) bits |= LINE_BITS.cancer;
    if (crosses(-TROPIC, minLat, maxLat)) bits |= LINE_BITS.capricorn;
    if (crosses(POLAR_CIRCLE, minLat, maxLat)) bits |= LINE_BITS.arctic;
    if (crosses(-POLAR_CIRCLE, minLat, maxLat)) bits |= LINE_BITS.antarctic;
    if (crosses(0, minLon, maxLon)) bits |= LINE_BITS.meridian;
  }
  return bits;
}

/** A point-in-polygon tester with a bounding-box prefilter over many polygons (flat rings per polygon). */
export function makeLocator(polys: readonly (readonly Flat[])[]): (lon: number, lat: number) => number {
  const boxes = polys.map((rings) => {
    let a = Infinity;
    let b = Infinity;
    let c = -Infinity;
    let d = -Infinity;
    for (const r of rings)
      for (let i = 0; i < r.length; i += 2) {
        a = Math.min(a, r[i]!);
        c = Math.max(c, r[i]!);
        b = Math.min(b, r[i + 1]!);
        d = Math.max(d, r[i + 1]!);
      }
    return [a, b, c, d] as const;
  });
  return (lon, lat) => {
    for (let i = 0; i < polys.length; i++) {
      const [a, b, c, d] = boxes[i]!;
      if (lon < a || lon > c || lat < b || lat > d) continue;
      if (pointInRings(lon, lat, polys[i]!)) return i;
    }
    return -1;
  };
}

/** A polygon's rings as flat arrays. */
export const flatRings = (poly: Polygon): number[][] => poly.map((r) => r.flat());

/** A representative point strictly inside a polygon (scanning its box), or null if none is found. */
export function interiorPoint(poly: Polygon): [number, number] | null {
  const rings = flatRings(poly);
  let a = Infinity;
  let b = Infinity;
  let c = -Infinity;
  let d = -Infinity;
  for (const [lon, lat] of poly[0]!) {
    a = Math.min(a, lon);
    c = Math.max(c, lon);
    b = Math.min(b, lat);
    d = Math.max(d, lat);
  }
  for (let k = 2; k <= 64; k *= 2)
    for (let j = 1; j < k; j += 2)
      for (let i = 1; i < k; i += 2) {
        const lon = a + ((c - a) * i) / k;
        const lat = b + ((d - b) * j) / k;
        if (pointInRings(lon, lat, rings)) return [lon, lat];
      }
  return null;
}
