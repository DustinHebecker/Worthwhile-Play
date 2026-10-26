/**
 * Round generation (design § 5): a fixed list of items created at `newGame`, all randomness spent here. Each item gets
 * its own sub-seed (`seed:index`), so a retry inside one item never shifts another. Within a round no place is the
 * main target twice and no compare template appears more than twice; across rounds there is no memory.
 */
import { createRng, seedFromString, type Rng } from '@wp/game-core';
import { inside, type Atlas, type Feature, type Region } from './atlas';
import { drawMystery } from './clues';
import { TEMPLATE_GROUPS, cityPool, countryPool, drawTemplate, maxTier, templateAllowed, type Area, type CompareQuestion, type Difficulty, type TemplateId } from './compare';
import { boundaryDistanceKm, distanceKm } from './geo';
import { drawRoute } from './route';
import { POINT_MAX_LAT, kindsOf, pointStep, type AtlasState, type CompareItem, type FindItem, type Item, type ItemKind, type Mode, type MysteryItem, type Place, type RouteItem } from './state';

/* ---------- Regions of features and grid points (cached per atlas) ---------- */

const featureRegionCache = new WeakMap<Atlas, Map<string, Set<Region>>>();

/** The regions a feature lies in: of the countries listing it, or, for lakes, of the countries around it. */
export function featureRegions(atlas: Atlas, f: Feature): ReadonlySet<Region> {
  let cache = featureRegionCache.get(atlas);
  if (!cache) {
    cache = new Map();
    featureRegionCache.set(atlas, cache);
  }
  let set = cache.get(f.id);
  if (!set) {
    set = new Set(atlas.countries.filter((c) => c.features.includes(f.id)).map((c) => c.region));
    if (f.kind === 'lake') {
      // The countries on its shore: a shore point inside the country or within 30 km of its border.
      for (const c of atlas.countries) {
        if (c.box[0] > f.box[2] + 1 || c.box[2] < f.box[0] - 1 || c.box[1] > f.box[3] + 1 || c.box[3] < f.box[1] - 1) continue;
        const shore = f.rings.some((r) => {
          for (let i = 0; i < r.length; i += 2) if (inside(c, r[i]!, r[i + 1]!) || boundaryDistanceKm(r[i]!, r[i + 1]!, c.rings) < 30) return true;
          return false;
        });
        if (shore) set.add(c.region);
      }
    }
    cache.set(f.id, set);
  }
  return set;
}

/** Point targets of a difficulty (hundredths), each with the region of the nearest country centre (≤ 2,500 km). */
const pointCache = new WeakMap<Atlas, Map<number, { at: [number, number]; region: Region | null }[]>>();
export function pointTargets(atlas: Atlas, d: Difficulty): readonly { at: [number, number]; region: Region | null }[] {
  const step = pointStep(d);
  let byStep = pointCache.get(atlas);
  if (!byStep) {
    byStep = new Map();
    pointCache.set(atlas, byStep);
  }
  let list = byStep.get(step);
  if (!list) {
    list = [];
    const maxLat = d === 'easy' ? 6000 : POINT_MAX_LAT;
    for (let lat = -maxLat; lat <= maxLat; lat += step)
      for (let lon = -18000; lon < 18000; lon += step) {
        let best: { km: number; region: Region } | null = null;
        for (const c of atlas.countries) {
          const km = distanceKm(lon / 100, lat / 100, c.label[0], c.label[1]);
          if (!best || km < best.km) best = { km, region: c.region };
        }
        list.push({ at: [lon, lat], region: best && best.km <= 2500 ? best.region : null });
      }
    byStep.set(step, list);
  }
  return list;
}

/* ---------- Find ---------- */

const FIND_WEIGHTS: readonly [Place['t'], number][] = [
  ['country', 4],
  ['city', 3],
  ['feature', 2],
  ['point', 1]
];

function weighted<T>(rng: Rng, items: readonly (readonly [T, number])[]): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = rng.next() * total;
  for (const [v, w] of items) {
    r -= w;
    if (r < 0) return v;
  }
  return items[items.length - 1]![0];
}

const placeKey = (p: Place) => (p.t === 'point' ? `point:${p.at.join(',')}` : `${p.t}:${p.id}`);

function drawFind(rng: Rng, atlas: Atlas, area: Area, d: Difficulty, used: Set<string>): Place {
  const fresh = <T extends { id: string }>(list: T[], t: string) => list.filter((x) => !used.has(`${t}:${x.id}`));
  const pools: Record<Place['t'], () => Place[]> = {
    country: () => fresh(countryPool(atlas, area, d), 'country').map((c) => ({ t: 'country', id: c.id })),
    city: () => fresh(cityPool(atlas, area, d), 'city').map((c) => ({ t: 'city', id: c.id })),
    feature: () => {
      const inArea = atlas.features.filter((f) => !atlas.retired.has(f.id) && (area === 'world' || featureRegions(atlas, f).has(area)));
      const tiered = inArea.filter((f) => f.tier <= maxTier(d));
      return fresh(tiered.length >= 4 ? tiered : inArea, 'feature').map((f) => ({ t: 'feature', id: f.id }));
    },
    point: () =>
      pointTargets(atlas, d)
        .filter((p) => (area === 'world' || p.region === area) && !used.has(`point:${p.at.join(',')}`))
        .map((p) => ({ t: 'point', at: [p.at[0], p.at[1]] }))
  };
  let weights = [...FIND_WEIGHTS];
  while (weights.length) {
    const t = weighted(rng, weights);
    const pool = pools[t]();
    if (pool.length) {
      const p = rng.pick(pool);
      used.add(placeKey(p));
      return p;
    }
    weights = weights.filter(([k]) => k !== t);
  }
  // Every pool exhausted (impossible with the shipped data): the Equator at the Prime Meridian.
  return { t: 'point', at: [0, 0] };
}

/* ---------- Compare ---------- */

interface RoundMemory {
  readonly used: Set<string>;
  readonly templates: Map<TemplateId, number>;
  insightUsed: boolean;
}

function drawCompare(rng: Rng, atlas: Atlas, area: Area, d: Difficulty, memory: RoundMemory): CompareQuestion {
  const allowed = (t: TemplateId) => templateAllowed(t, d) && (memory.templates.get(t) ?? 0) < 2;
  const failed = new Set<TemplateId>();
  for (let attempt = 0; attempt < 40; attempt++) {
    const groups = TEMPLATE_GROUPS.map((g) => [g.templates.filter((t) => allowed(t) && !failed.has(t)), g.weight] as const).filter(([ts]) => ts.length > 0);
    if (!groups.length) break;
    const group = weighted(rng, groups);
    const template = rng.pick(group);
    // A curated insight pair (design § 7.2), at most once per round, only where it passes the threshold.
    const pairKey = template === 'south' ? 'north' : template === 'west' ? 'east' : template;
    const pairs = atlas.pairs[pairKey] ?? [];
    const insight = !memory.insightUsed && pairs.length && rng.next() < 0.35 ? rng.pick(pairs) : undefined;
    const q = drawTemplate(rng, template, { atlas, area, difficulty: d, insight });
    if (!q) {
      failed.add(template);
      continue;
    }
    if (insight && insight.every((id) => q.places.includes(id))) memory.insightUsed = true;
    memory.templates.set(template, (memory.templates.get(template) ?? 0) + 1);
    return q;
  }
  // Fallback that always exists: which of two cities of the whole world is further north.
  return drawTemplate(rng, 'north', { atlas, area: 'world', difficulty: 'easy' })!;
}

/* ---------- Round ---------- */

function drawItem(kind: ItemKind, rng: Rng, atlas: Atlas, area: Area, d: Difficulty, memory: RoundMemory): Item {
  switch (kind) {
    case 'find': {
      const target = drawFind(rng, atlas, area, d, memory.used);
      return { kind, target, draft: null, answer: null, km: null, band: null } satisfies FindItem;
    }
    case 'compare': {
      const q = drawCompare(rng, atlas, area, d, memory);
      return { kind, template: q.template, places: q.places, param: q.param, options: q.options, correct: q.correct, draft: null, answer: null } satisfies CompareItem;
    }
    case 'mystery': {
      const m = drawMystery(rng, atlas, area, d, memory.used) ?? drawMystery(rng, atlas, 'world', d, memory.used) ?? drawMystery(rng, atlas, 'world', 'hard', new Set());
      if (!m) throw new Error('no mystery country can be drawn');
      memory.used.add(`country:${m.target}`);
      return { kind, target: m.target, clues: m.clues, shown: 1, guesses: [], draft: null, end: null } satisfies MysteryItem;
    }
    case 'route': {
      const r = drawRoute(rng, atlas, area, d, memory.used) ?? drawRoute(rng, atlas, 'world', d, memory.used) ?? drawRoute(rng, atlas, 'world', d, new Set());
      if (!r) throw new Error('no route can be drawn');
      memory.used.add(`country:${r.from}`);
      memory.used.add(`country:${r.to}`);
      return { kind, from: r.from, to: r.to, best: r.best, ways: r.ways, path: [r.from], end: null } satisfies RouteItem;
    }
  }
}

/** A new round (pure and deterministic for its arguments). */
export function createRound(seed: number, difficulty: Difficulty, mode: Mode, area: Area, atlas: Atlas): AtlasState {
  const s = seed >>> 0;
  const memory: RoundMemory = { used: new Set(), templates: new Map(), insightUsed: false };
  const items = kindsOf(mode, area).map((kind, index) => drawItem(kind, createRng(seedFromString(`${s}:${index}`)), atlas, area, difficulty, memory));
  return { v: 1, data: atlas.id, seed: s, difficulty, mode, region: area, items, index: 0, reported: false };
}
