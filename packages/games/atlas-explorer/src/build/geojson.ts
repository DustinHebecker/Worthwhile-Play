/**
 * Data script only (never imported by runtime code): reading Natural Earth GeoJSON, which is untrusted input.
 * Only Point, Polygon, MultiPolygon, LineString and MultiLineString geometries with finite coordinates are accepted.
 */

export type Props = Readonly<Record<string, unknown>>;
/** A ring or line as `[lon, lat]` pairs (degrees). */
export type Path = [number, number][];
/** A polygon: outer ring first, then holes. */
export type Polygon = Path[];

export interface Feature {
  readonly props: Props;
  readonly polygons: Polygon[];
  readonly lines: Path[];
  readonly points: Path;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function path(v: unknown): Path {
  if (!Array.isArray(v)) throw new TypeError('path is not an array');
  return v.map((p) => {
    if (!Array.isArray(p) || p.length < 2 || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) throw new TypeError('bad coordinate');
    return [Number(p[0]), Number(p[1])] as [number, number];
  });
}

/** Parses a FeatureCollection; throws on anything malformed. Features without geometry are kept with no parts. */
export function readCollection(json: unknown): Feature[] {
  if (!isObj(json) || json.type !== 'FeatureCollection' || !Array.isArray(json.features)) throw new TypeError('not a FeatureCollection');
  return json.features.map((f: unknown) => {
    if (!isObj(f)) throw new TypeError('bad feature');
    const props: Props = isObj(f.properties) ? f.properties : {};
    const g = f.geometry;
    const polygons: Polygon[] = [];
    const lines: Path[] = [];
    const points: Path = [];
    if (isObj(g) && Array.isArray(g.coordinates)) {
      const c = g.coordinates as unknown[];
      if (g.type === 'Point') points.push(...path([c]));
      else if (g.type === 'Polygon') polygons.push(c.map(path));
      else if (g.type === 'MultiPolygon') for (const p of c) polygons.push((p as unknown[]).map(path));
      else if (g.type === 'LineString') lines.push(path(c));
      else if (g.type === 'MultiLineString') for (const l of c) lines.push(path(l));
      else throw new TypeError(`unsupported geometry ${String(g.type)}`);
    }
    return { props, polygons, lines, points };
  });
}

/** A string property (trimmed), or '' when missing. */
export const str = (props: Props, key: string): string => (typeof props[key] === 'string' ? (props[key] as string).trim() : '');
/** A numeric property, or NaN when missing. */
export const num = (props: Props, key: string): number => (typeof props[key] === 'number' ? (props[key] as number) : Number.NaN);
