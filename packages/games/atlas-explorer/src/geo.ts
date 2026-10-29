/**
 * Pure geometry of Atlas Explorer (design § 10): the Equal Earth projection, great-circle distances and bearings,
 * compass words, point-in-polygon and point-to-boundary distances on the sphere, day length and sun time.
 *
 * Coordinates are degrees (longitude, latitude) unless a name says otherwise. Rings are flat arrays
 * `[lon0, lat0, lon1, lat1, …]` (closed: the last point repeats the first); Natural Earth splits polygons at ±180°,
 * so plain lon/lat tests are valid. Nothing here depends on the DOM or on game state.
 */

/** Mean Earth radius (km), IUGG. Distances are "on a sphere, about" (design § 10.2). */
export const EARTH_RADIUS_KM = 6371.0088;
const RAD = Math.PI / 180;

/* ---------- Equal Earth (Šavrič, Patterson & Jenny 2019; own implementation of the published formulas) ---------- */

const A1 = 1.340264;
const A2 = -0.081106;
const A3 = 0.000893;
const A4 = 0.003796;
const M = Math.sqrt(3) / 2;

/** The projected half-width (x at ±180° on the Equator) and half-height (y at ±90°) on the unit sphere. */
export const EE_X_MAX = Math.PI / (M * A1);
export const EE_Y_MAX = equalEarthY(Math.PI / 3);

function equalEarthY(theta: number): number {
  const t2 = theta * theta;
  const t6 = t2 * t2 * t2;
  return theta * (A1 + A2 * t2 + t6 * (A3 + A4 * t2));
}

function equalEarthDy(theta: number): number {
  const t2 = theta * theta;
  const t6 = t2 * t2 * t2;
  return A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2);
}

/** Equal Earth forward projection on the unit sphere: x grows eastwards, y northwards. */
export function project(lon: number, lat: number): [x: number, y: number] {
  const lambda = lon * RAD;
  const theta = Math.asin(M * Math.sin(lat * RAD));
  return [(lambda * Math.cos(theta)) / (M * equalEarthDy(theta)), equalEarthY(theta)];
}

/**
 * Inverse projection (Newton's method on θ, ≤ 12 iterations). `null` for a point outside the map outline
 * ("off the map", |λ| > 180° or |y| beyond the poles).
 */
export function unproject(x: number, y: number): [lon: number, lat: number] | null {
  if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(y) > EE_Y_MAX + 1e-12) return null;
  let theta = y / A1;
  for (let i = 0; i < 12; i++) {
    const delta = (equalEarthY(theta) - y) / equalEarthDy(theta);
    theta -= delta;
    if (Math.abs(delta) < 1e-12) break;
  }
  theta = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, theta));
  const lambda = (M * x * equalEarthDy(theta)) / Math.cos(theta);
  if (Math.abs(lambda) > Math.PI + 1e-9) return null;
  const s = Math.max(-1, Math.min(1, Math.sin(theta) / M));
  return [Math.max(-180, Math.min(180, lambda / RAD)), Math.asin(s) / RAD];
}

/* ---------- Distances and bearings ---------- */

/** Great-circle distance (km) by the haversine formula. */
export function distanceKm(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const p1 = lat1 * RAD;
  const p2 = lat2 * RAD;
  const dp = p2 - p1;
  const dl = (lon2 - lon1) * RAD;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Initial bearing (degrees clockwise from north, 0 ≤ b < 360) of the great circle from point 1 to point 2. */
export function bearing(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const p1 = lat1 * RAD;
  const p2 = lat2 * RAD;
  const dl = (lon2 - lon1) * RAD;
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  const b = Math.atan2(y, x) / RAD;
  const r = ((b % 360) + 360) % 360;
  return r >= 360 ? 0 : r;
}

/**
 * Direction as read off this map (degrees clockwise from north, 0 ≤ b < 360): the constant compass direction of the
 * rhumb line from point 1 to point 2 that stays on the map, i.e. with the plain longitude difference. The map is
 * centred on 0° and does not wrap, so from Alaska the Russian Far East lies west along the shortest way but east on
 * the map; the words follow the map (design § 10.3), and `crossesDateLine` tells when the shortest way runs the other
 * way round. The initial great-circle bearing can differ a lot over long distances (from France, the great circle to
 * Papua New Guinea starts towards the north-east), so direction words use this bearing.
 */
export function mapBearing(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const clamp = (v: number) => Math.max(-89.9, Math.min(89.9, v)) * RAD;
  const dpsi = Math.log(Math.tan(Math.PI / 4 + clamp(lat2) / 2) / Math.tan(Math.PI / 4 + clamp(lat1) / 2));
  const b = Math.atan2((lon2 - lon1) * RAD, dpsi) / RAD;
  const r = ((b % 360) + 360) % 360;
  return r >= 360 ? 0 : r;
}

/**
 * Whether the shortest way between two longitudes crosses the date line (±180°): then it leaves the map at one edge
 * and comes back at the other, the opposite way to the direction read off the map.
 */
export const crossesDateLine = (lon1: number, lon2: number): boolean => Math.abs(lon2 - lon1) > 180;

/** The 16 compass words (message keys `dir.<id>`), clockwise from north. */
export const COMPASS = ['n', 'nne', 'ne', 'ene', 'e', 'ese', 'se', 'sse', 's', 'ssw', 'sw', 'wsw', 'w', 'wnw', 'nw', 'nnw'] as const;
export type CompassWord = (typeof COMPASS)[number];

/** Compass word of a bearing: 16 sectors (boundaries at 11.25° + k·22.5°), or 8 (boundaries at 22.5° + k·45°). */
export function compassWord(b: number, sectors: 8 | 16 = 16): CompassWord {
  const norm = ((b % 360) + 360) % 360;
  if (sectors === 8) return COMPASS[(Math.floor(((norm + 22.5) % 360) / 45) * 2) % 16]!;
  return COMPASS[Math.floor(((norm + 11.25) % 360) / 22.5) % 16]!;
}

/** Points along the great circle from 1 to 2 (both included), `n` ≥ 2 points, for drawing. */
export function greatCircle(lon1: number, lat1: number, lon2: number, lat2: number, n: number): [number, number][] {
  const a = toVec(lon1, lat1);
  const b = toVec(lon2, lat2);
  const omega = angle(a, b);
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const f = n === 1 ? 0 : i / (n - 1);
    if (omega < 1e-12) {
      out.push([lon1, lat1]);
      continue;
    }
    const s = Math.sin(omega);
    const ka = Math.sin((1 - f) * omega) / s;
    const kb = Math.sin(f * omega) / s;
    out.push(toLonLat([ka * a[0] + kb * b[0], ka * a[1] + kb * b[1], ka * a[2] + kb * b[2]]));
  }
  return out;
}

/* ---------- Vectors (unit sphere) ---------- */

type Vec = [number, number, number];

function toVec(lon: number, lat: number): Vec {
  const l = lon * RAD;
  const p = lat * RAD;
  const c = Math.cos(p);
  return [c * Math.cos(l), c * Math.sin(l), Math.sin(p)];
}

function toLonLat(v: Vec): [number, number] {
  return [Math.atan2(v[1], v[0]) / RAD, Math.atan2(v[2], Math.hypot(v[0], v[1])) / RAD];
}

const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm3 = (a: Vec) => Math.hypot(a[0], a[1], a[2]);
/** Angle (radians) between two unit vectors, robust for tiny and near-antipodal angles. */
const angle = (a: Vec, b: Vec) => Math.atan2(norm3(cross(a, b)), dot(a, b));

/**
 * Distance (km) from P to the great-circle segment A–B, clamped to the segment ends (cross-track distance when the
 * foot of the perpendicular lies on the segment, else the distance to the nearer end).
 */
export function segmentDistanceKm(lon: number, lat: number, lonA: number, latA: number, lonB: number, latB: number): number {
  return segmentAngle(toVec(lon, lat), toVec(lonA, latA), toVec(lonB, latB)) * EARTH_RADIUS_KM;
}

function segmentAngle(p: Vec, a: Vec, b: Vec): number {
  const n = cross(a, b);
  const len = norm3(n);
  const toA = angle(p, a);
  // A very short (or near-antipodal, ill-defined) segment: the nearer end is within its length of the answer.
  if (len < 1e-6) return Math.min(toA, angle(p, b));
  const u: Vec = [n[0] / len, n[1] / len, n[2] / len];
  const s = dot(p, u);
  const foot: Vec = [p[0] - s * u[0], p[1] - s * u[1], p[2] - s * u[2]];
  // The foot lies on the minor arc A–B when it is on the A→B side of A and on the A→B side of B.
  if (norm3(foot) > 1e-15 && dot(cross(a, foot), u) >= 0 && dot(cross(foot, b), u) >= 0) return Math.atan2(Math.abs(s), norm3(foot));
  return Math.min(toA, angle(p, b));
}

/* ---------- Polygons and lines ---------- */

/** A ring or line as a flat array `[lon0, lat0, lon1, lat1, …]` (degrees). */
export type Flat = ArrayLike<number>;

/** Even–odd point-in-polygon over all rings (holes and multiple parts included) in plain lon/lat. */
export function pointInRings(lon: number, lat: number, rings: readonly Flat[]): boolean {
  let inside = false;
  for (const r of rings) {
    const n = r.length;
    for (let i = 0, j = n - 2; i < n; j = i, i += 2) {
      const yi = r[i + 1]!;
      const yj = r[j + 1]!;
      if (yi > lat !== yj > lat) {
        const xi = r[i]!;
        const xj = r[j]!;
        if (lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
      }
    }
  }
  return inside;
}

/** Bounding box `[minLon, minLat, maxLon, maxLat]` of flat rings or lines. */
export function bbox(parts: readonly Flat[]): [number, number, number, number] {
  let a = Infinity;
  let b = Infinity;
  let c = -Infinity;
  let d = -Infinity;
  for (const r of parts)
    for (let i = 0; i < r.length; i += 2) {
      a = Math.min(a, r[i]!);
      c = Math.max(c, r[i]!);
      b = Math.min(b, r[i + 1]!);
      d = Math.max(d, r[i + 1]!);
    }
  return [a, b, c, d];
}

/** Minimum distance (km) from a point to the segments of flat rings or lines (never negative). */
export function boundaryDistanceKm(lon: number, lat: number, parts: readonly Flat[]): number {
  const p = toVec(lon, lat);
  let best = Infinity;
  // A cheap lower bound per segment (latitude difference, minus a slack for the bulge of a great circle between two
  // points; data segments are at most 3° long, design § 11.4) skips most far segments.
  for (const r of parts) {
    let prev = toVec(r[0]!, r[1]!);
    for (let i = 2; i < r.length; i += 2) {
      const lo = r[i]!;
      const la = r[i + 1]!;
      const cur = toVec(lo, la);
      const minLat = Math.min(la, r[i - 1]!);
      const maxLat = Math.max(la, r[i - 1]!);
      const gap = lat < minLat ? minLat - lat : lat > maxLat ? lat - maxLat : 0;
      if (gap * RAD - 0.002 < best) best = Math.min(best, segmentAngle(p, prev, cur));
      prev = cur;
    }
  }
  return best === Infinity ? Infinity : best * EARTH_RADIUS_KM;
}

/** Distance (km) from a point to a polygon: 0 inside, else the distance to its boundary. */
export function polygonDistanceKm(lon: number, lat: number, rings: readonly Flat[]): number {
  return pointInRings(lon, lat, rings) ? 0 : boundaryDistanceKm(lon, lat, rings);
}

/* ---------- Sun ---------- */

/** Solar declination on the solstices used by the game (degrees): 21 June and 21 December. */
export const DECLINATION = 23.44;
/** Standard altitude of sunrise and sunset (refraction and the sun's disk), degrees. */
const SUN_ALTITUDE = -0.833;

/**
 * Day length (hours, 0…24) at a latitude on 21 June (`month` 6) or 21 December (12), from the sunrise equation.
 * 24 means the sun does not set, 0 that it does not rise.
 */
export function dayLengthHours(lat: number, month: 6 | 12): number {
  const decl = (month === 6 ? DECLINATION : -DECLINATION) * RAD;
  const phi = lat * RAD;
  const c = (Math.sin(SUN_ALTITUDE * RAD) - Math.sin(phi) * Math.sin(decl)) / (Math.cos(phi) * Math.cos(decl));
  if (c <= -1) return 24;
  if (c >= 1) return 0;
  return (2 * Math.acos(c)) / RAD / 15;
}

/** Sun-time difference (hours) from a longitude to another: 15° per hour, east is later. */
export const sunTimeHours = (lonFrom: number, lonTo: number): number => (lonTo - lonFrom) / 15;

/** How much a Mercator map enlarges areas at a latitude (1 / cos² φ). */
export const mercatorFactor = (lat: number): number => 1 / Math.cos(lat * RAD) ** 2;

/** Latitudes of the special parallels (degrees north; the southern ones are their negatives). */
export const TROPIC = 23.44;
export const POLAR_CIRCLE = 66.56;

/**
 * Safety margin (degrees) around the Equator, the tropics, the polar circles and the Prime Meridian: a territory that
 * comes within it of a line neither clearly crosses the line nor clearly stays on one side (simplification could flip
 * it, e.g. Niger reaches 23.52° N against the Tropic of Cancer at 23.44°), so it is neither a clue nor ruled out by one.
 */
export const LINE_MARGIN = 0.5;
