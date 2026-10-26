/**
 * Dev-only data script of Atlas Explorer (design § 11.4). Never run in CI or at runtime.
 *
 *   pnpm --filter @wp/game-atlas-explorer build-atlas [--download] [--cache <dir>] [--no-worldviews]
 *
 * Reads the pinned Natural Earth v5.1.2 GeoJSON files from the cache directory (default `.cache/natural-earth-5.1.2/`,
 * git-ignored; `--download` fetches missing files from the official repository tag), verifies their SHA-256 hashes
 * (abort on mismatch), builds the shared-border topology, computes the facts at full resolution, simplifies, encodes
 * and writes `src/data/atlas.gen.ts`, `src/data/manifest.json` and `test/fixtures/boundary-samples.json`. It prints a
 * report (sizes, tiers, neighbours, the worldview check of § 12.4) and writes a name draft for translators into the
 * cache directory. Downloaded files are untrusted data: they are only parsed as JSON.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodeInts } from '../src/codec';
import { EE_X_MAX, POLAR_CIRCLE, TROPIC, boundaryDistanceKm, distanceKm, pointInRings } from '../src/geo';
import { UN_MEMBERS } from '../src/data/un-members';
import { readCollection, num, str, type Feature, type Path, type Polygon } from '../src/build/geojson';
import {
  areNeighbours,
  dropSmallParts,
  flatRings,
  interiorPoint,
  lengthInsideKm,
  lineLengthKm,
  LINE_BITS,
  linesCrossed,
  makeLocator,
  polygonAreaKm2,
  sampledAreaKm2,
  unhatchedLengthKm
} from '../src/build/facts';
import { compareViews, floodFill, makeGrid, near, paintPolygon, rasterize, type Disagreement } from '../src/build/raster';
import { simplify } from '../src/build/simplify';
import { arcUsers, buildTopology, dissolve, quantizeRing, ringPoints, type Topology } from '../src/build/topology';

/* ---------- Arguments, config, files ---------- */

const here = dirname(fileURLToPath(import.meta.url));
const pkg = resolve(here, '..');
const argv = process.argv.slice(2);
const flag = (name: string) => argv.includes(name);
const option = (name: string) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const config = JSON.parse(readFileSync(join(here, 'atlas-config.json'), 'utf8')) as Config;
const cache = resolve(option('--cache') ?? join(pkg, '.cache', 'natural-earth-5.1.2'));
const started = Date.now();
const log = (...parts: unknown[]) => console.log(...parts);

interface CityConfig {
  id: string;
  ne: number;
  country: string;
  tz: string;
  capital: boolean;
  tier: number;
}
interface Config {
  dataId: string;
  source: Record<string, string>;
  files: Record<string, string>;
  worldviews: { pattern: string; povs: string[]; resolution: number; pairMinKm2: number; exceptions: { pov: string; from: string; to: string; why: string }[]; excusedTypes: string[] };
  params: Record<string, number> & { hatchTypes: string[] };
  mergeUnits: Record<string, string>;
  notCountryTypes: string[];
  homeUnits: string[];
  noRegionClue: string[];
  mostlyIn: string[];
  countryTiers: Record<string, string[]>;
  cities: CityConfig[];
  rivers: { id: string; names: string[]; tier: number }[];
  lakes: { id: string; ne?: number; marine?: number; tier: number }[];
  regions: { id: string; ne: number; kind: string; tier: number }[];
  seas: { id: string; at: [number, number][] }[];
  oceanSeeds: [number, number][];
  insightPairs: Record<string, string[][]>;
  retired: string[];
}

const sha256 = (data: Buffer | string) => createHash('sha256').update(data).digest('hex');

async function load(file: string, expected: string | null): Promise<{ features: Feature[]; hash: string }> {
  const path = join(cache, file);
  if (!existsSync(path)) {
    if (!flag('--download')) throw new Error(`missing ${path}: run with --download (or --cache <dir>)`);
    mkdirSync(cache, { recursive: true });
    const url = config.source.base + file;
    log(`downloading ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`download failed: ${res.status} ${url}`);
    writeFileSync(path, Buffer.from(await res.arrayBuffer()));
  }
  const raw = readFileSync(path);
  const hash = sha256(raw);
  if (expected && hash !== expected) throw new Error(`SHA-256 mismatch for ${file}: ${hash}, expected ${expected}`);
  return { features: readCollection(JSON.parse(raw.toString('utf8'))), hash };
}

/* ---------- Helpers ---------- */

const P = config.params;
// `--set name=value` overrides a numeric parameter for experiments (the manifest records the values used).
argv.forEach((a, i) => {
  if (a !== '--set') return;
  const [k, v] = (argv[i + 1] ?? '').split('=');
  if (k && v !== undefined && Number.isFinite(Number(v))) (P as Record<string, number>)[k] = Number(v);
});
const UNIT = P.unit;
const CELL = (2 * EE_X_MAX) / P.grid;
const simplifyOpts = (threshold: number) => ({ threshold, cell: CELL, unit: UNIT, maxSpan: P.maxSpanDeg * UNIT, maxDeviation: P.maxDeviationCells! });
const round100 = (v: number) => Math.round(v * 100);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
const boxOf = (polys: readonly Polygon[]): [number, number, number, number] => {
  let a = Infinity;
  let b = Infinity;
  let c = -Infinity;
  let d = -Infinity;
  for (const p of polys)
    for (const [x, y] of p[0]!) {
      a = Math.min(a, x);
      c = Math.max(c, x);
      b = Math.min(b, y);
      d = Math.max(d, y);
    }
  return [a, b, c, d];
};
const overlapBox = (p: readonly number[], q: readonly number[]): [number, number, number, number] | null => {
  const a = Math.max(p[0]!, q[0]!);
  const b = Math.max(p[1]!, q[1]!);
  const c = Math.min(p[2]!, q[2]!);
  const d = Math.min(p[3]!, q[3]!);
  return a < c && b < d ? [a, b, c, d] : null;
};
const areaOf = (polys: readonly Polygon[]) => polys.reduce((s, p) => s + polygonAreaKm2(p), 0);

/* ---------- Main ---------- */

async function main() {
  const hashes: Record<string, string> = {};
  const layer = async (file: string) => {
    const r = await load(file, config.files[file] ?? null);
    hashes[file] = r.hash;
    return r.features;
  };
  const units = await layer('ne_10m_admin_0_map_units.geojson');
  const countries = await layer('ne_10m_admin_0_countries.geojson');
  const disputed = await layer('ne_10m_admin_0_disputed_areas.geojson');
  const land = await layer('ne_10m_land.geojson');
  const lakesLayer = await layer('ne_50m_lakes.geojson');
  const riversLayer = await layer('ne_50m_rivers_lake_centerlines.geojson');
  const regionsLayer = await layer('ne_50m_geography_regions_polys.geojson');
  const marineLayer = await layer('ne_50m_geography_marine_polys.geojson');
  const placesLayer = await layer('ne_50m_populated_places.geojson');
  log(`read ${Object.keys(hashes).length} layers in ${((Date.now() - started) / 1000).toFixed(1)} s`);

  /* --- Entities: map units grouped by country (merged units), UN membership --- */
  const unSet = new Set<string>(UN_MEMBERS);
  const attrs = new Map<string, Feature>();
  for (const f of countries) attrs.set(str(f.props, 'ADM0_A3'), f);
  interface Entity {
    key: string;
    iso: string;
    un: boolean;
    attrs: Feature;
    units: { gu: string; home: boolean; polys: Polygon[] }[];
  }
  const entities = new Map<string, Entity>();
  for (const f of units) {
    const a3 = str(f.props, 'ADM0_A3');
    const key = config.mergeUnits[a3] ?? a3;
    const at = attrs.get(key);
    if (!at) throw new Error(`no country attributes for ${key}`);
    const iso = str(at.props, 'ISO_A2_EH');
    let e = entities.get(key);
    if (!e) {
      // A UN member's own unit, not one of its dependencies or leases that share its ISO code (e.g. Clipperton I.).
      const un = unSet.has(iso) && !config.notCountryTypes.includes(str(at.props, 'TYPE'));
      e = { key, iso: /^[A-Z]{2}$/.test(iso) ? iso : '', un, attrs: at, units: [] };
      entities.set(key, e);
    }
    const gu = str(f.props, 'GU_A3');
    e.units.push({ gu, home: num(f.props, 'HOMEPART') === 1 || config.homeUnits.includes(gu) || config.homeUnits.includes(a3), polys: f.polygons });
  }
  for (const e of entities.values()) if (!e.units.some((u) => u.home)) for (const u of e.units) u.home = true;
  const unEntities = [...entities.values()].filter((e) => e.un);
  const missing = UN_MEMBERS.filter((c) => !unEntities.some((e) => e.iso === c));
  if (missing.length || unEntities.length !== UN_MEMBERS.length) throw new Error(`UN members missing or duplicated: ${missing.join(' ')} (${unEntities.length})`);
  // Countries first (sorted by code), then other entities (sorted by key): stable ids and order.
  const ordered = [...unEntities.sort((a, b) => a.iso.localeCompare(b.iso)), ...[...entities.values()].filter((e) => !e.un).sort((a, b) => a.key.localeCompare(b.key))];
  const idOf = (e: Entity) => (e.un ? e.iso : e.key);

  // Small islands dropped per entity (largest part kept), remembering which unit each polygon came from.
  // One shape per ring: holes are flagged, as a hole (a lake or an enclave) is never a sea coast.
  const unitShapes: { entity: number; home: boolean; poly: Polygon; hole: boolean }[] = [];
  ordered.forEach((e, ei) => {
    const all = e.units.flatMap((u) => u.polys.map((poly) => ({ home: u.home, poly })));
    const kept = new Set(dropSmallParts(all.map((x) => x.poly), P.minIslandKm2));
    for (const x of all) if (kept.has(x.poly)) x.poly.forEach((ring, k) => unitShapes.push({ entity: ei, home: x.home, poly: [ring], hole: k > 0 }));
  });

  /* --- Disputed overlay (policy A, § 12.2) --- */
  const entityLocators = ordered.map((e) => makeLocator(e.units.flatMap((u) => u.polys.map(flatRings))));
  const entityBoxes = ordered.map((e) => boxOf(e.units.flatMap((u) => u.polys)));
  const entityAreas = ordered.map((e) => areaOf(e.units.flatMap((u) => u.polys)));
  const hatchFeatures = disputed.filter((f) => P.hatchTypes.includes(str(f.props, 'TYPE')));
  const wholeState: { brk: string; country: string; share: number }[] = [];
  const overlays: { id: string; brk: string; type: string; polys: Polygon[]; area: number }[] = [];
  for (const f of hatchFeatures) {
    const brk = str(f.props, 'BRK_A3');
    const box = boxOf(f.polygons);
    const loc = makeLocator(f.polygons.map(flatRings));
    let whole: { country: string; share: number } | null = null;
    ordered.forEach((e, ei) => {
      if (!e.un || whole) return;
      const ov = overlapBox(box, entityBoxes[ei]!);
      if (!ov) return;
      const step = Math.max(0.01, Math.min(0.1, Math.sqrt(entityAreas[ei]!) / 111 / 60));
      const inside = sampledAreaKm2(ov, step, (x, y) => loc(x, y) >= 0 && entityLocators[ei]!(x, y) >= 0);
      const share = inside / entityAreas[ei]!;
      if (share >= P.wholeStateShare) whole = { country: e.iso, share };
    });
    if (whole) {
      wholeState.push({ brk, ...(whole as { country: string; share: number }) });
      continue;
    }
    const polys = dropSmallParts(f.polygons, P.minIslandKm2);
    overlays.push({ id: `d-${brk.toLowerCase()}`, brk, type: str(f.props, 'TYPE'), polys, area: areaOf(f.polygons) });
  }
  log(`overlay: ${overlays.length} hatched features; not drawn (whole UN member): ${wholeState.map((w) => `${w.brk} ${w.country} ${(w.share * 100).toFixed(0)} %`).join(', ')}`);
  const hatchLocator = makeLocator(overlays.flatMap((o) => o.polys.map(flatRings)));
  const inHatch = (x: number, y: number) => hatchLocator(x, y) >= 0;
  const hatchRings = overlays.map((o) => {
    const rings = o.polys.flatMap(flatRings);
    return { rings, box: boxOf(o.polys) };
  });
  /** On or within 4 km of a hatched area's edge (for border segments, design § 12.3). */
  const nearHatch = (x: number, y: number) =>
    hatchRings.some((h) => x >= h.box[0] - 0.1 && x <= h.box[2] + 0.1 && y >= h.box[1] - 0.1 && y <= h.box[3] + 0.1 && boundaryDistanceKm(x, y, h.rings) <= 4);

  /* --- Topology at unit level (facts), then dissolved (drawing) --- */
  const shapes = [
    ...unitShapes.map((s, i) => ({ owner: i, rings: s.poly })),
    ...overlays.flatMap((o, oi) => o.polys.map((poly) => ({ owner: unitShapes.length + oi, rings: poly })))
  ];
  const topo = buildTopology(shapes, UNIT, P.maxStepDeg * UNIT);
  log(`topology: ${topo.arcs.length} arcs, ${topo.rings.length} rings, ${topo.arcs.reduce((s, a) => s + a.length / 2, 0)} points`);
  const users = arcUsers(topo);
  const ownerEntity = (owner: number) => (owner < unitShapes.length ? unitShapes[owner]!.entity : -1);
  const toDeg = (a: readonly number[]) => a.map((v) => v / UNIT);

  // Curated lakes (incl. the Caspian Sea, a sea in the marine layer).
  const lakeById = new Map<string, Polygon[]>();
  for (const l of config.lakes) {
    const f = l.marine ? marineLayer.find((m) => num(m.props, 'ne_id') === l.marine) : lakesLayer.find((m) => num(m.props, 'ne_id') === l.ne);
    if (!f) throw new Error(`lake ${l.id} not found`);
    lakeById.set(l.id, f.polygons);
  }

  // The world ocean on a 0.05° land mask, flood-filled from seeds in every ocean and in seas with narrow straits:
  // a coast is a border to this ocean, never to a lake, the Caspian Sea, the Aral Sea or a hole (design § 11.3).
  const oceanGrid = makeGrid(0.05);
  const landMask = new Uint8Array(oceanGrid.w * oceanGrid.h);
  for (const s of unitShapes) paintPolygon(oceanGrid, landMask, s.poly, 1);
  const oceanCells = floodFill(oceanGrid, landMask, config.oceanSeeds, 0, 2);
  log(`ocean mask: ${oceanCells} of ${landMask.length} cells`);
  const pairKm = new Map<string, { raw: number; free: number }>();
  const coastKm = new Map<number, number>();
  topo.arcs.forEach((arc, ai) => {
    const us = users[ai]!;
    const ents = us.map(([ri]) => ownerEntity(topo.rings[ri]!.owner)).filter((e) => e >= 0);
    const distinct = [...new Set(ents)];
    const deg = toDeg(arc);
    if (distinct.length === 2) {
      const [a, b] = distinct.sort((x, y) => x - y) as [number, number];
      const key = `${a}:${b}`;
      const r = pairKm.get(key) ?? { raw: 0, free: 0 };
      r.raw += lineLengthKm(deg);
      r.free += unhatchedLengthKm(deg, inHatch, [1.5, 4], nearHatch);
      pairKm.set(key, r);
    } else if (distinct.length === 1 && ents.length === 1) {
      const ring = us.find(([ri]) => topo.rings[ri]!.owner < unitShapes.length)!;
      const shape = unitShapes[topo.rings[ring[0]]!.owner]!;
      if (!shape.home || shape.hole) return;
      let km = 0;
      for (let i = 2; i < deg.length; i += 2) {
        const ax = deg[i - 2]!;
        const ay = deg[i - 1]!;
        const bx = deg[i]!;
        const by = deg[i + 1]!;
        if (Math.abs(ax) === 180 && Math.abs(bx) === 180) continue; // the antimeridian cut is not a coast
        // A coast: the world ocean within about 10 km (two cells) of the segment's middle.
        if (!near(oceanGrid, landMask, (ax + bx) / 2, (ay + by) / 2, 2, 2)) continue;
        km += distanceKm(ax, ay, bx, by);
      }
      coastKm.set(distinct[0]!, (coastKm.get(distinct[0]!) ?? 0) + km);
    }
  });
  const neighbours = new Map<number, Set<number>>();
  const lostPairs: string[] = [];
  for (const [key, r] of pairKm) {
    const [a, b] = key.split(':').map(Number) as [number, number];
    if (!ordered[a]!.un || !ordered[b]!.un) continue;
    if (areNeighbours(r.free, P.neighbourMinKm)) {
      if (!neighbours.has(a)) neighbours.set(a, new Set());
      if (!neighbours.has(b)) neighbours.set(b, new Set());
      neighbours.get(a)!.add(b);
      neighbours.get(b)!.add(a);
    } else lostPairs.push(`${idOf(ordered[a]!)}–${idOf(ordered[b]!)} (${r.raw.toFixed(0)} km, ${r.free.toFixed(1)} km outside hatched areas)`);
  }
  const close = [...pairKm].filter(([k, r]) => ordered[Number(k.split(':')[0])]!.un && ordered[Number(k.split(':')[1])]!.un && r.free < r.raw - 1 && r.free < 80);
  log(`borders partly in hatched areas: ${close.map(([k, r]) => `${k.split(':').map((i) => idOf(ordered[Number(i)]!)).join('–')} ${r.free.toFixed(1)}/${r.raw.toFixed(0)} km`).join(', ')}`);
  log(`neighbours: ${[...neighbours.values()].reduce((s, n) => s + n.size, 0) / 2} pairs of UN members; not neighbours under the 5 km rule: ${lostPairs.join('; ')}`);

  /* --- Continents for the island fact --- */
  const continents = land.flatMap((f) => f.polygons).filter((p) => polygonAreaKm2(p) >= P.continentMinKm2);
  const continentLocator = makeLocator(continents.map(flatRings));
  log(`continental landmasses: ${continents.length} (${continents.map((p) => (polygonAreaKm2(p) / 1e6).toFixed(1)).join(', ')} million km²)`);

  /* --- Rivers and physical regions (raw geometry for facts) --- */
  const riverLines = config.rivers.map((r) => {
    const fs = riversLayer.filter((f) => r.names.includes(str(f.props, 'name')));
    if (!fs.length) throw new Error(`river ${r.id} not found`);
    return { ...r, lines: fs.flatMap((f) => f.lines) };
  });
  const regionPolys = config.regions.map((r) => {
    const f = regionsLayer.find((x) => num(x.props, 'NE_ID') === r.ne);
    if (!f) throw new Error(`region ${r.id} not found`);
    return { ...r, polys: f.polygons, area: areaOf(f.polygons) };
  });

  /* --- Country facts --- */
  const tierOne = new Set(config.countryTiers['1'] ?? []);
  const factsOf = (e: Entity, ei: number) => {
    const home = unitShapes.filter((s) => s.entity === ei && s.home && !s.hole).map((s) => s.poly);
    const homeAll = e.units.filter((u) => u.home).flatMap((u) => u.polys);
    const homeLoc = makeLocator(homeAll.map(flatRings));
    const inHome = (x: number, y: number) => homeLoc(x, y) >= 0 && !inHatch(x, y);
    const rawBox = boxOf(homeAll);
    const all = e.units.flatMap((u) => u.polys);
    const box = boxOf(all);
    // Areas: core without hatched areas, max with every hatched area that touches the country.
    let hatchedInside = 0;
    let touching = 0;
    const touchList: string[] = [];
    overlays.forEach((o, oi) => {
      const ov = overlapBox(boxOf(o.polys), [box[0] - 0.1, box[1] - 0.1, box[2] + 0.1, box[3] + 0.1]);
      if (!ov) return;
      const oloc = makeLocator(o.polys.map(flatRings));
      const step = Math.max(0.01, Math.min(0.05, Math.sqrt(o.area) / 111 / 80));
      const inside = sampledAreaKm2(ov, step, (x, y) => oloc(x, y) >= 0 && entityLocators[ei]!(x, y) >= 0);
      const shares = topo.rings.some((ring, ri) => ring.owner === unitShapes.length + oi && ring.arcs.some((ref) => users[ref < 0 ? ~ref : ref]!.some(([rj]) => ownerEntity(topo.rings[rj]!.owner) === ei)) && ri >= 0);
      if (inside > 0 || shares) {
        hatchedInside += inside;
        touching += o.area;
        touchList.push(o.brk);
      }
    });
    const area = entityAreas[ei]!;
    const areaCore = Math.max(0, area - hatchedInside);
    const areaMax = areaCore + touching;
    const island = !home.some((p) => {
      const pt = interiorPoint(p);
      return pt !== null && continentLocator(pt[0], pt[1]) >= 0;
    });
    const rivers = riverLines.filter((r) => lengthInsideKm(r.lines.map((l) => l.flat()), inHome) >= P.riverMinKm).map((r) => r.id);
    // Extent and special lines of the home territory outside hatched areas: facts never rest on a disputed area.
    let hbox = rawBox;
    let lines = linesCrossed(homeAll);
    if (hatchedInside > 0) {
      // Extent: home vertices with no hatched area within 0.03° (a vertex on a hatched area's edge does not count).
      const near = [-0.03, 0, 0.03];
      let a = Infinity;
      let b = Infinity;
      let c = -Infinity;
      let d = -Infinity;
      for (const poly of homeAll)
        for (const [x, y] of poly[0]!)
          if (!near.some((dx) => near.some((dy) => inHatch(x + dx, y + dy)))) {
            a = Math.min(a, x);
            c = Math.max(c, x);
            b = Math.min(b, y);
            d = Math.max(d, y);
          }
      hbox = [a, b, c, d];
      const along = (fixed: number, lat: boolean) => {
        const [from, to] = lat ? [rawBox[0], rawBox[2]] : [rawBox[1], rawBox[3]];
        for (let v = from; v <= to; v += 0.02) if (lat ? inHome(v, fixed) : inHome(fixed, v)) return true;
        return false;
      };
      lines = 0;
      const special: [number, boolean, number][] = [[0, true, LINE_BITS.equator], [TROPIC, true, LINE_BITS.cancer], [-TROPIC, true, LINE_BITS.capricorn], [POLAR_CIRCLE, true, LINE_BITS.arctic], [-POLAR_CIRCLE, true, LINE_BITS.antarctic], [0, false, LINE_BITS.meridian]];
      for (const [v, isLat, bit] of special) if ((isLat ? v > rawBox[1] && v < rawBox[3] : v > rawBox[0] && v < rawBox[2]) && along(v, isLat)) lines |= bit;
      if (lines !== linesCrossed(homeAll) || hbox.some((v, i) => Math.abs(v - rawBox[i]!) > 0.5)) log(`  ${e.iso}: facts without hatched areas: lines ${linesCrossed(homeAll)} → ${lines}, extent ${rawBox.map((v) => v.toFixed(1)).join(' ')} → ${hbox.map((v) => v.toFixed(1)).join(' ')}`);
    }
    const regions = regionPolys
      .filter((r) => {
        const ov = overlapBox(boxOf(r.polys), rawBox);
        if (!ov) return false;
        const rloc = makeLocator(r.polys.map(flatRings));
        const km2 = sampledAreaKm2(ov, 0.1, (x, y) => rloc(x, y) >= 0 && inHome(x, y));
        return km2 >= P.regionMinKm2 || km2 >= P.regionMinShare * r.area;
      })
      .map((r) => r.id);
    const labelRank = num(e.attrs.props, 'LABELRANK');
    const tier = tierOne.has(e.iso) ? 1 : labelRank <= 4 ? 2 : 3;
    return {
      id: e.iso,
      tier,
      region: slug(str(e.attrs.props, 'REGION_UN')),
      sub: slug(str(e.attrs.props, 'SUBREGION')),
      label: [round100(num(e.attrs.props, 'LABEL_X')), round100(num(e.attrs.props, 'LABEL_Y'))],
      hb: hbox.map(round100),
      pop: Math.round(num(e.attrs.props, 'POP_EST')),
      popYear: num(e.attrs.props, 'POP_YEAR'),
      areaCore: Math.round(areaCore),
      areaMax: Math.round(areaMax),
      nb: [...(neighbours.get(ei) ?? [])].map((j) => ordered[j]!.iso).sort(),
      coast: (coastKm.get(ei) ?? 0) >= P.coastMinKm,
      island,
      lines,
      rivers,
      regions,
      ...(config.noRegionClue.includes(e.iso) ? { noRegion: true } : {}),
      ...(config.mostlyIn.includes(e.iso) ? { mostly: true } : {}),
      touch: touchList
    };
  };
  const countryFacts = ordered.filter((e) => e.un).map((e) => factsOf(e, ordered.indexOf(e)));
  log(`facts computed (${((Date.now() - started) / 1000).toFixed(1)} s)`);

  /* --- Dissolve and simplify for drawing --- */
  const groupOf = (owner: number) => (owner < unitShapes.length ? unitShapes[owner]!.entity : null);
  // Dissolving units whose quantised borders do not match exactly can leave spurs and slivers: rings with fewer than
  // three distinct points, or under 1 km² when the owner has a larger ring, are dropped.
  const dissolved = dissolve(topo, groupOf);
  const ringArea = (ring: number[]) => {
    const pts = toDeg(ringPoints(topo.arcs, ring));
    const path: Path = [];
    for (let i = 0; i < pts.length; i += 2) path.push([pts[i]!, pts[i + 1]!]);
    return { distinct: new Set(path.map((p) => p.join())).size, km2: polygonAreaKm2([path]) };
  };
  const measured = dissolved.rings.map((r) => ({ r, ...ringArea(r.arcs) }));
  const largest = new Map<number, number>();
  for (const m of measured) largest.set(m.r.owner, Math.max(largest.get(m.r.owner) ?? 0, m.km2));
  const dropped = measured.filter((m) => m.distinct < 3 || (m.km2 < 1 && largest.get(m.r.owner)! > m.km2));
  if (dropped.length) log(`dropped ${dropped.length} degenerate rings after dissolving`);
  const drawn: Topology = { arcs: topo.arcs, rings: measured.filter((m) => !dropped.includes(m)).map((m) => m.r) };
  const usedArcs = [...new Set(drawn.rings.flatMap((r) => r.arcs.map((ref) => (ref < 0 ? ~ref : ref))))].sort((a, b) => a - b);
  const protect = new Set<number>();
  // Edges of hatched areas follow the data more closely (policy A, § 12.2): with the general deviation limit a narrow
  // area such as the Gaza Strip lost a third of its width to a neighbouring country.
  const hatchArcs = new Set(drawn.rings.filter((r) => r.owner >= unitShapes.length).flatMap((r) => r.arcs.map((ref) => (ref < 0 ? ~ref : ref))));
  const arcOpts = (ai: number) => (hatchArcs.has(ai) ? { ...simplifyOpts(P.threshold), maxDeviation: P.hatchMaxDeviationCells! } : simplifyOpts(P.threshold));
  let simple = new Map<number, number[]>();
  for (let round = 0; round < 5; round++) {
    simple = new Map(usedArcs.map((ai) => [ai, protect.has(ai) ? topo.arcs[ai]! : simplify(topo.arcs[ai]!, arcOpts(ai))]));
    let added = 0;
    for (const ring of drawn.rings) {
      const pts = ringPoints(
        topo.arcs.map((a, i) => simple.get(i) ?? a),
        ring.arcs
      );
      if (pts.length / 2 - 1 < 3)
        for (const ref of ring.arcs) {
          const ai = ref < 0 ? ~ref : ref;
          if (!protect.has(ai)) {
            protect.add(ai);
            added++;
          }
        }
    }
    if (!added) break;
  }
  const arcIndex = new Map(usedArcs.map((ai, i) => [ai, i]));
  const arcsOut = usedArcs.map((ai) => simple.get(ai)!);
  const totalPoints = arcsOut.reduce((s, a) => s + a.length / 2, 0);
  log(`drawing: ${arcsOut.length} arcs, ${totalPoints} points after simplification (${protect.size} arcs kept unsimplified, ${hatchArcs.size} edges of hatched areas)`);

  // Arcs: count, then per arc its point count and delta-encoded points (the first point relative to the previous arc's first).
  const arcInts: number[] = [arcsOut.length];
  let lastX = 0;
  let lastY = 0;
  for (const a of arcsOut) {
    arcInts.push(a.length / 2, a[0]! - lastX, a[1]! - lastY);
    lastX = a[0]!;
    lastY = a[1]!;
    for (let i = 2; i < a.length; i += 2) arcInts.push(a[i]! - a[i - 2]!, a[i + 1]! - a[i - 1]!);
  }
  const ringsOf = (owner: (o: number) => boolean) => {
    const rings = drawn.rings.filter((r) => owner(r.owner));
    const ints: number[] = [rings.length];
    for (const r of rings) {
      ints.push(r.arcs.length);
      let prev = 0;
      for (const ref of r.arcs) {
        const i = arcIndex.get(ref < 0 ? ~ref : ref)!;
        const signed = ref < 0 ? -(i + 1) : i;
        ints.push(signed - prev);
        prev = signed;
      }
    }
    return encodeInts(ints);
  };
  // After dissolve, entity rings have owner = entity index; overlay rings keep owner = unitShapes.length + overlay index.
  const entityRings = (ei: number) => ringsOf((o) => o === ei);
  const overlayRings = (oi: number) => {
    const owner = unitShapes.length + oi;
    return ringsOf((o) => o === owner);
  };

  /* --- Lakes, rivers, regions: own simplified paths --- */
  const encodePaths = (paths: number[][]) => {
    const ints: number[] = [paths.length];
    for (const p of paths) {
      ints.push(p.length / 2, p[0]!, p[1]!);
      for (let i = 2; i < p.length; i += 2) ints.push(p[i]! - p[i - 2]!, p[i + 1]! - p[i - 1]!);
    }
    return encodeInts(ints);
  };
  const polygonPaths = (polys: Polygon[], threshold: number) =>
    polys.flatMap((poly) => poly.map((ring) => quantizeRing(ring, UNIT, P.maxStepDeg * UNIT)).filter((r): r is number[] => r !== null).map((r) => simplify(r, simplifyOpts(threshold))).filter((r) => r.length >= 8));
  const linePath = (line: Path) => {
    const pts: number[] = [];
    for (const [x, y] of line) {
      const qx = Math.round(x * UNIT);
      const qy = Math.round(y * UNIT);
      if (pts.length && pts[pts.length - 2] === qx && pts[pts.length - 1] === qy) continue;
      pts.push(qx, qy);
    }
    return pts;
  };
  const labelOf = (polys: Polygon[]): number[] => {
    const largest = [...polys].sort((a, b) => polygonAreaKm2(b) - polygonAreaKm2(a))[0]!;
    const pt = interiorPoint(largest) ?? largest[0]![0]!;
    return [round100(pt[0]), round100(pt[1])];
  };
  const lakesOut = config.lakes.map((l) => {
    const polys = lakeById.get(l.id)!;
    return { id: l.id, tier: l.tier, rings: encodePaths(polygonPaths(polys, P.lakeThreshold)), label: labelOf(polys), area: Math.round(areaOf(polys)) };
  });
  const riversOut = riverLines.map((r) => {
    const paths = r.lines.map(linePath).filter((p) => p.length >= 4).map((p) => simplify(p, simplifyOpts(P.riverThreshold)));
    const longest = [...r.lines].sort((a, b) => lineLengthKm(b.flat()) - lineLengthKm(a.flat()))[0]!;
    const mid = longest[Math.floor(longest.length / 2)]!;
    return { id: r.id, tier: r.tier, lines: encodePaths(paths), label: [round100(mid[0]), round100(mid[1])], km: Math.round(r.lines.reduce((s, l) => s + lineLengthKm(l.flat()), 0)) };
  });
  const regionsOut = regionPolys.map((r) => ({
    id: r.id,
    kind: r.kind,
    tier: r.tier,
    rings: encodePaths(polygonPaths(dropSmallParts(r.polys, 2000), P.featureThreshold)),
    label: labelOf(r.polys),
    area: Math.round(r.area)
  }));

  /* --- Cities and standard time offsets (IANA tz data via Node's ICU) --- */
  const offsetMinutes = (tz: string, iso: string) => {
    const part = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' }).formatToParts(new Date(iso)).find((p) => p.type === 'timeZoneName')!.value;
    const m = /GMT(?:([+-])(\d{2}):(\d{2}))?/.exec(part);
    if (!m) throw new Error(`cannot read offset ${part}`);
    return m[1] ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
  };
  const citiesOut = config.cities.map((c) => {
    const f = placesLayer.find((p) => num(p.props, 'NE_ID') === c.ne);
    if (!f) throw new Error(`city ${c.id} not found`);
    const lon = num(f.props, 'LONGITUDE');
    const lat = num(f.props, 'LATITUDE');
    const tz = Math.min(offsetMinutes(c.tz, '2026-01-15T12:00:00Z'), offsetMinutes(c.tz, '2026-07-15T12:00:00Z'));
    if (!unSet.has(c.country)) throw new Error(`city ${c.id}: ${c.country} is not a UN member`);
    return { id: c.id, country: c.country, ...(c.capital ? { capital: true } : {}), tier: c.tier, lon: round100(lon), lat: round100(lat), tz };
  });

  /* --- Boundary samples (test fixture for the 25 km tolerance, § 21.3) --- */
  const samples: Record<string, number[][]> = {};
  ordered.forEach((e, ei) => {
    if (!e.un) return;
    const rings = drawn.rings.filter((r) => r.owner === ei).map((r) => ringPoints(topo.arcs, r.arcs));
    const all: number[][] = rings.flatMap((r) => Array.from({ length: r.length / 2 }, (_, i) => [r[2 * i]!, r[2 * i + 1]!]));
    const n = Math.min(20, all.length);
    samples[e.iso] = Array.from({ length: n }, (_, k) => {
      const p = all[Math.floor((k * all.length) / n)]!;
      return [p[0]! * 2, p[1]! * 2]; // 1/50° → 1/100°
    });
  });
  // Report the worst simplification error now (the slow test re-checks it from the committed data).
  let worst = 0;
  let worstAt = '';
  ordered.forEach((e, ei) => {
    if (!e.un) return;
    const rings = drawn.rings.filter((r) => r.owner === ei).map((r) => toDeg(ringPoints(arcsOut.length ? topo.arcs.map((a, i) => simple.get(i) ?? a) : [], r.arcs)));
    for (const [x, y] of samples[e.iso]!) {
      const d = boundaryDistanceKm(x! / 100, y! / 100, rings);
      if (d > worst) {
        worst = d;
        worstAt = e.iso;
      }
    }
  });
  log(`largest simplification error at the boundary samples: ${worst.toFixed(1)} km (${worstAt})`);

  /* --- Label points inside their simplified country? --- */
  const outside: string[] = [];
  ordered.forEach((e, ei) => {
    if (!e.un) return;
    const rings = drawn.rings.filter((r) => r.owner === ei).map((r) => toDeg(ringPoints(topo.arcs.map((a, i) => simple.get(i) ?? a), r.arcs)));
    const f = countryFacts.find((c) => c.id === e.iso)!;
    if (!pointInRings(f.label[0]! / 100, f.label[1]! / 100, rings)) outside.push(e.iso);
  });
  if (outside.length) log(`label points outside their simplified country: ${outside.join(' ')}`);

  /* --- Output module --- */
  const out = {
    id: config.dataId,
    unit: UNIT,
    arcs: encodeInts(arcInts),
    // Numeric facts packed into one encoded string per country (decoded by src/atlas.ts, `unpackFacts`):
    // tier, label lon/lat, home extent (4), population, its year, area core/max, lines, flags (coast 1, island 2,
    // no region clue 4, "lies mostly in" 8). Lists are space-separated ids.
    countries: countryFacts.map((c, i) => ({
      id: c.id,
      region: c.region,
      sub: c.sub,
      f: encodeInts([c.tier, ...c.label, ...c.hb, c.pop, c.popYear, c.areaCore, c.areaMax, c.lines, (c.coast ? 1 : 0) | (c.island ? 2 : 0) | ('noRegion' in c ? 4 : 0) | ('mostly' in c ? 8 : 0)]),
      nb: c.nb.join(' '),
      ft: [...c.rivers, ...c.regions].join(' '),
      // Hatched areas touching the country: a tap inside one counts as on target (design § 12.3).
      dz: c.touch.map((b) => `d-${b.toLowerCase()}`).join(' '),
      rings: entityRings(i)
    })),
    others: ordered
      .map((e, ei) => ({ e, ei }))
      .filter(({ e }) => !e.un)
      .map(({ e, ei }) => ({ id: e.key, iso: e.iso, label: [round100(num(e.attrs.props, 'LABEL_X')), round100(num(e.attrs.props, 'LABEL_Y'))], rings: entityRings(ei) })),
    disputed: overlays.map((o, oi) => ({ id: o.id, rings: overlayRings(oi) })),
    lakes: lakesOut,
    rivers: riversOut,
    regions: regionsOut,
    cities: citiesOut,
    seas: config.seas.map((s) => ({ id: s.id, at: s.at.map(([x, y]) => [round100(x), round100(y)]) })),
    pairs: config.insightPairs,
    retired: config.retired
  };
  const json = JSON.stringify(out);
  const body = `// Generated by scripts/build-atlas.ts from Natural Earth ${config.source.version} (public domain) — do not edit.\n// Sources, hashes and parameters: ./manifest.json\nimport type { AtlasData } from './types';\n\nexport const ATLAS_DATA: AtlasData = ${json};\n`;
  const outFile = join(pkg, 'src', 'data', 'atlas.gen.ts');
  writeFileSync(outFile, body);
  writeFileSync(join(pkg, 'test', 'fixtures', 'boundary-samples.json'), JSON.stringify(samples) + '\n');

  /* --- Worldview check (§ 12.4) --- */
  let worldview: { checked: string[]; reported: (Disagreement & { pov: string; status: string })[] } | null = null;
  if (!flag('--no-worldviews')) worldview = await worldviewCheck(countries, overlays, wholeState, disputed, hashes);

  /* --- Manifest and report --- */
  const prevPath = join(pkg, 'src', 'data', 'manifest.json');
  const previous = existsSync(prevPath) ? (JSON.parse(readFileSync(prevPath, 'utf8')) as { neighbours?: Record<string, string[]> }) : {};
  const nbNow = Object.fromEntries(countryFacts.map((c) => [c.id, c.nb]));
  const factsNow = Object.fromEntries(countryFacts.map((c) => [c.id, { tier: c.tier, coast: c.coast, island: c.island, lines: c.lines, areaCore: c.areaCore, areaMax: c.areaMax, features: [...c.rivers, ...c.regions], hatchedTouching: c.touch }]));
  const changes: string[] = [];
  for (const [id, nb] of Object.entries(nbNow)) {
    const before = previous.neighbours?.[id];
    if (before && before.join() !== nb.join()) changes.push(`${id}: ${before.join(' ')} → ${nb.join(' ')}`);
  }
  if (changes.length) log(`neighbour changes against the previous manifest:\n  ${changes.join('\n  ')}`);
  const manifest = {
    generated: 'scripts/build-atlas.ts',
    dataId: config.dataId,
    source: config.source,
    files: Object.fromEntries(Object.entries(hashes).sort()),
    params: config.params,
    node: process.versions.node,
    tz: process.versions.tz,
    unicodeCldr: process.versions.cldr,
    counts: {
      countries: out.countries.length,
      others: out.others.length,
      disputed: out.disputed.length,
      arcs: arcsOut.length,
      points: totalPoints,
      lakes: out.lakes.length,
      rivers: out.rivers.length,
      regions: out.regions.length,
      cities: out.cities.length
    },
    notDrawnWholeState: wholeState,
    notNeighboursUnderTheRule: lostPairs,
    neighbours: nbNow,
    facts: factsNow,
    worldviews: worldview,
    output: { file: 'src/data/atlas.gen.ts', bytes: Buffer.byteLength(body), sha256: sha256(body) }
  };
  writeFileSync(prevPath, JSON.stringify(manifest, null, 2) + '\n');
  writeFileSync(join(cache, 'names-draft.json'), JSON.stringify(nameDraft(placesLayer, riversLayer, lakesLayer, regionsLayer, marineLayer), null, 1));

  const tiers = [1, 2, 3].map((t) => `tier ${t} (${countryFacts.filter((c) => c.tier === t).length}): ${countryFacts.filter((c) => c.tier === t).map((c) => c.id).join(' ')}`);
  log(tiers.join('\n'));
  log(`coast km (small): ${countryFacts.filter((c) => (coastKm.get(ordered.findIndex((e) => e.iso === c.id)) ?? 0) < 200).map((c) => `${c.id} ${(coastKm.get(ordered.findIndex((e) => e.iso === c.id)) ?? 0).toFixed(1)}`).join(', ')}`);
  log(`landlocked: ${countryFacts.filter((c) => !c.coast).map((c) => c.id).join(' ')}`);
  log(`islands: ${countryFacts.filter((c) => c.island).map((c) => c.id).join(' ')}`);
  log(`output ${outFile}: ${(Buffer.byteLength(body) / 1024).toFixed(1)} KB, sha256 ${manifest.output.sha256} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
  if (worldview && worldview.reported.some((r) => r.status === 'unexplained')) {
    console.error('worldview check FAILED: unexplained disagreements (see manifest.worldviews)');
    process.exit(1);
  }
}

/** Natural Earth name fields of the curated features, for translators (never shipped). */
function nameDraft(places: Feature[], rivers: Feature[], lakes: Feature[], regions: Feature[], marine: Feature[]) {
  const langs = ['de', 'en', 'nl', 'es', 'fr', 'ru', 'zh', 'ko', 'ja', 'ar', 'pt', 'it', 'pl', 'tr', 'uk', 'hi'];
  const pick = (f: Feature | undefined, upper: boolean) => (f ? Object.fromEntries(langs.map((l) => [l, str(f.props, upper ? `NAME_${l.toUpperCase()}` : `name_${l}`)])) : null);
  return {
    cities: Object.fromEntries(config.cities.map((c) => [c.id, pick(places.find((p) => num(p.props, 'NE_ID') === c.ne), true)])),
    rivers: Object.fromEntries(config.rivers.map((r) => [r.id, pick(rivers.find((f) => r.names.includes(str(f.props, 'name'))), false)])),
    lakes: Object.fromEntries(config.lakes.map((l) => [l.id, pick(l.marine ? marine.find((f) => num(f.props, 'ne_id') === l.marine) : lakes.find((f) => num(f.props, 'ne_id') === l.ne), false)])),
    regions: Object.fromEntries(config.regions.map((r) => [r.id, pick(regions.find((f) => num(f.props, 'NE_ID') === r.ne), true)]))
  };
}

/** § 12.4: rasterise the default view and every point-of-view file and explain each disagreement. */
async function worldviewCheck(
  countries: Feature[],
  overlays: { brk: string; polys: Polygon[] }[],
  wholeState: { brk: string; country: string }[],
  disputed: Feature[],
  hashes: Record<string, string>
) {
  const W = config.worldviews;
  const g = makeGrid(W.resolution);
  const codesOf = (fs: Feature[]) => fs.map((f) => str(f.props, 'ADM0_A3'));
  const base = rasterize(g, countries.map((f) => f.polygons));
  const baseCodes = codesOf(countries);
  // Masks: hatched areas (drawn), the whole-state feature (not drawn, documented) and the excused types.
  const mask = new Uint8Array(g.w * g.h);
  const paint = (polys: Polygon[], value: number) => {
    const r = rasterize(g, [polys]);
    for (let k = 0; k < r.length; k++) if (r[k] && !mask[k]) mask[k] = value;
  };
  for (const o of overlays) paint(o.polys, 1);
  for (const w of wholeState) paint(disputed.find((f) => str(f.props, 'BRK_A3') === w.brk)!.polygons, 2);
  for (const f of disputed) if (W.excusedTypes.includes(str(f.props, 'TYPE'))) paint(f.polygons, 3);
  const hatchedOnly = new Uint8Array(mask.length);
  for (let k = 0; k < mask.length; k++) hatchedOnly[k] = mask[k] === 1 ? 1 : 0;
  const reported: (Disagreement & { pov: string; status: string })[] = [];
  for (const pov of W.povs) {
    const file = W.pattern.replace('{pov}', pov);
    const r = await load(file, null);
    hashes[file] = r.hash;
    const view = rasterize(g, r.features.map((f) => f.polygons));
    for (const d of compareViews(g, base, baseCodes, view, codesOf(r.features), mask)) {
      const ex = W.exceptions.find((x) => x.pov === pov && x.from === d.from && x.to === d.to);
      const status = ex ? `exception: ${ex.why}` : d.km2 < W.pairMinKm2 ? 'artefact (< 5,000 km²)' : 'unexplained';
      if (d.km2 >= 1000 || status === 'unexplained' || ex) reported.push({ pov, ...d, km2: Math.round(d.km2), status });
    }
    // Disagreements inside the excused areas (leases, overlays, sub-units, the whole-state feature) are listed for the record.
    const excused = compareViews(g, base, baseCodes, view, codesOf(r.features), hatchedOnly).filter((d) => d.km2 >= 1000);
    for (const d of excused)
      if (!reported.some((x) => x.pov === pov && x.from === d.from && x.to === d.to)) reported.push({ pov, ...d, km2: Math.round(d.km2), status: 'inside excused areas (lease, overlay, sub-unit or the whole-state feature)' });
  }
  for (const r of reported) console.log(`worldview ${r.pov}: ${r.from || '—'} → ${r.to || '—'} ${r.km2} km² — ${r.status}`);
  return { checked: W.povs, reported };
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
