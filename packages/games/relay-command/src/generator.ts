import { createRng, type Rng } from '@wp/game-core';
import { cellOf, computeNetwork, createWorld, findPath, STRATEGY_RULESET as RULESET } from '@wp/strategy-engine';
import { isFair, isValidMap, mapIssues, toScenario, type EditMap, type MapDeposit, type MapUnit } from './maps';

/**
 * Seeded map generator (I6c, owner decisions 2026-10-16): point-symmetric two-side maps of every
 * editor size. Only the top half is generated (side 1); the bottom half and side 0 are its point
 * mirror, so both sides start equal. Deposits grow with the map's area (about two per side on
 * 12×10, five on 24×16), and maps from 200 cells up get a pair of rich deposits near the contested
 * middle. Every map is checked by `generatedMapProblems`, an independent validator; a candidate
 * that fails is thrown away and the next one drawn from the same seed, so a seed always gives the
 * same map. Pure: no DOM, no Math.random.
 */

/** Deposits per side for a map of `w`×`h` cells (the map rule: more ground, more Supply). */
export const depositsPerSide = (w: number, h: number): number => Math.max(2, Math.min(5, Math.round((w * h) / 75)));
/** From this many cells, the contested middle holds a pair of rich deposits. */
export const RICH_MIDDLE_FROM = 200;
/** Command Posts stand at least this share of the map's longer side apart. */
export const POST_DISTANCE_SHARE = 0.5;
/** Candidates drawn per seed before the plain fallback (which always passes). */
const ATTEMPTS = 40;

/** The pieces each side starts with, by map size (small maps: Field Exercise's set; large: Ridge Valley's). */
function startingKinds(area: number): string[] {
  const base = ['command-post', 'muster', 'mast-truck', 'rifles', 'rifles', 'lancer', 'warden', 'jammer', 'tracer', 'howitzer'];
  if (area < 200) return base;
  return [...base, 'field-post', 'mast-truck', 'rifles', 'lancer', 'outrider'];
}

/** A generated map: the same `w`, `h` and `seed` always give the same map. */
export function generateMap(w: number, h: number, seed: number, name = ''): EditMap {
  const rng = createRng(((seed >>> 0) ^ Math.imul(w * 64 + h, 0x9e3779b1)) >>> 0);
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const map = candidate(w, h, rng, name, true);
    if (map && generatedMapProblems(map).length === 0) return map;
  }
  // Open ground with the bases only (always passes): the rare seed whose candidates all failed.
  const plain = candidate(w, h, rng, name, false);
  if (plain && generatedMapProblems(plain).length === 0) return plain;
  throw new Error(`No valid map for ${w}×${h} seed ${seed}.`);
}

function candidate(w: number, h: number, rng: Rng, name: string, features: boolean): EditMap | undefined {
  const terrain: string[] = Array.from({ length: w * h }, () => '.');
  const mirror = (x: number, y: number) => ({ x: w - 1 - x, y: h - 1 - y });
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h;
  const set = (x: number, y: number, code: string) => {
    if (!inside(x, y)) return;
    const m = mirror(x, y);
    terrain[y * w + x] = code;
    terrain[m.y * w + m.x] = code;
  };
  const at = (x: number, y: number) => terrain[y * w + x] ?? '^';
  const blocked = (x: number, y: number) => at(x, y) === '~' || at(x, y) === '^';
  const area = w * h;
  const half = h / 2;

  // Side 1's Command Post: near the top edge, far enough from its mirror image.
  const minDistance = POST_DISTANCE_SHARE * Math.max(w, h);
  let post: { x: number; y: number } | undefined;
  for (let k = 0; k < 20 && !post; k++) {
    const p = { x: rng.int(2, w - 3), y: rng.int(1, Math.min(2, half - 2)) };
    const m = mirror(p.x, p.y);
    if (Math.hypot(p.x - m.x, p.y - m.y) >= minDistance) post = p;
  }
  if (!post) return undefined;

  if (features) {
    // Blobs of forest, hills, buildings and swamp; a few short walls of water or ridge.
    const blob = (code: string, size: number) => {
      let x = rng.int(0, w - 1);
      let y = rng.int(0, half - 1);
      for (let i = 0; i < size; i++) {
        set(x, y, code);
        x = Math.max(0, Math.min(w - 1, x + rng.int(-1, 1)));
        y = Math.max(0, Math.min(half - 1, y + rng.int(-1, 1)));
      }
    };
    for (let i = 0; i < Math.round(area / 40); i++) blob('f', rng.int(3, 7));
    for (let i = 0; i < Math.round(area / 90); i++) blob('h', rng.int(2, 4));
    for (let i = 0; i < Math.round(area / 120); i++) blob('u', rng.int(2, 4));
    for (let i = 0; i < Math.round(area / 150); i++) blob('s', rng.int(2, 4));
    const walls = area >= 160 ? rng.int(1, 3) : rng.int(0, 1);
    for (let i = 0; i < walls; i++) {
      const code = rng.int(0, 1) === 0 ? '~' : '^';
      const vertical = rng.int(0, 1) === 0;
      let x = rng.int(1, w - 2);
      let y = rng.int(1, half - 1);
      for (let k = 0, n = rng.int(3, Math.max(3, Math.round(Math.min(w, h) / 2))); k < n; k++) {
        set(x, y, code);
        if (vertical) y = Math.min(half - 1, y + 1);
        else x = Math.min(w - 1, x + 1);
      }
    }
    // A road from the post towards the middle.
    let x = post.x;
    let y = post.y;
    const cx = Math.floor(w / 2);
    for (let k = 0; k < w + h && (Math.abs(x - cx) > 0 || y < half - 1); k++) {
      if (y < half - 1 && (rng.int(0, 2) > 0 || x === cx)) y++;
      else x += Math.sign(cx - x);
      if (!blocked(x, y)) set(x, y, '=');
    }
  }
  // The base area is open ground (the starting pieces must fit and move off).
  for (let dy = -2; dy <= 2; dy++) for (let dx = -3; dx <= 3; dx++) if (inside(post.x + dx, post.y + dy) && post.y + dy < half) set(post.x + dx, post.y + dy, '.');

  // Starting pieces: nearest free cells to the post (within its radio cover), in the rng's order of ties.
  const units: MapUnit[] = [];
  const taken = new Set<number>();
  const free = (x: number, y: number) => inside(x, y) && y < half && !blocked(x, y) && !taken.has(y * w + x);
  const near = (cx: number, cy: number, r: number) => {
    const cells: { x: number; y: number; d: number; t: number }[] = [];
    for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) if (free(x, y)) cells.push({ x, y, d: (x - cx) ** 2 + (y - cy) ** 2, t: rng.int(0, 1000) });
    return cells.sort((a, b) => a.d - b.d || a.t - b.t);
  };
  for (const kind of startingKinds(area)) {
    const spot = kind === 'command-post' ? { x: post.x, y: post.y } : near(post.x, post.y, 4)[kind === 'muster' ? 2 : 0];
    if (!spot) return undefined;
    taken.add(spot.y * w + spot.x);
    units.push({ side: 1, kind, x: spot.x, y: spot.y });
  }

  // Deposits: one behind the post (in its cover), the others spread over the side's half; a rich
  // pair near the middle on larger maps.
  const deposits: MapDeposit[] = [];
  const spaced = (x: number, y: number) => deposits.every((d) => Math.max(Math.abs(d.x - x), Math.abs(d.y - y)) >= 3);
  const own = depositsPerSide(w, h);
  const first = near(post.x, post.y, 4).filter((c) => c.d >= 4 && spaced(c.x, c.y));
  if (!first[0]) return undefined;
  deposits.push({ x: first[0].x, y: first[0].y });
  taken.add(first[0].y * w + first[0].x);
  for (let tries = 0; deposits.length < own && tries < 200; tries++) {
    const x = rng.int(0, w - 1);
    const y = rng.int(0, half - 1);
    if (!free(x, y) || !spaced(x, y)) continue;
    deposits.push({ x, y });
    taken.add(y * w + x);
  }
  if (deposits.length < own) return undefined;
  if (area >= RICH_MIDDLE_FROM) {
    const middle = near(Math.floor(w / 2), half - 1, 3).filter((c) => spaced(c.x, c.y));
    if (!middle[0]) return undefined;
    deposits.push({ x: middle[0].x, y: middle[0].y, size: 'rich' });
  }

  const all: MapUnit[] = [...units.map((u) => ({ ...u, side: 0, ...mirror(u.x, u.y) })), ...units];
  const allDeposits: MapDeposit[] = deposits.flatMap((d) => [d, { ...d, ...mirror(d.x, d.y) }]);
  return { name, w, h, terrain: terrain.join(''), deposits: allDeposits, units: all.sort((a, b) => a.side - b.side || a.y - b.y || a.x - b.x) };
}

/**
 * Independent validator of a generated map (P9): written against the map only, not the generator.
 * Empty when the map is fair and playable: a valid editor map with no issues, point-symmetric,
 * posts far enough apart, every deposit reachable over ground from both posts, the map rule's
 * deposits per side, every starting unit inside its side's radio cover, no unit on a deposit.
 */
export function generatedMapProblems(map: EditMap): string[] {
  const problems: string[] = [];
  if (!isValidMap(map)) return ['invalid map'];
  if (mapIssues(map).length > 0) problems.push('not playable');
  if (!isFair(map)) problems.push('not symmetric');
  const posts = [0, 1].map((side) => map.units.find((u) => u.side === side && u.kind === 'command-post'));
  const [a, b] = posts;
  if (!a || !b) return [...problems, 'no posts'];
  if (Math.hypot(a.x - b.x, a.y - b.y) < POST_DISTANCE_SHARE * Math.max(map.w, map.h)) problems.push('posts too close');
  const scenario = toScenario(map);
  const reach = (from: MapUnit, x: number, y: number) =>
    findPath(scenario.map, RULESET, cellOf(scenario.map, from.x, from.y), cellOf(scenario.map, x, y), { layer: 'ground', side: from.side }) !== undefined;
  for (const d of map.deposits) if (!reach(a, d.x, d.y) || !reach(b, d.x, d.y)) problems.push(`deposit ${d.x},${d.y} unreachable`);
  const perSide = map.deposits.filter((d) => d.y < map.h / 2).length;
  const rich = map.deposits.filter((d) => d.size === 'rich').length;
  if (perSide - rich / 2 < depositsPerSide(map.w, map.h)) problems.push('too few deposits');
  if (map.w * map.h >= RICH_MIDDLE_FROM && rich < 2) problems.push('no rich middle');
  if (map.units.some((u) => map.deposits.some((d) => d.x === u.x && d.y === u.y))) problems.push('unit on a deposit');
  const world = createWorld({ ...scenario, seed: 1 }, RULESET);
  for (const side of [0, 1]) {
    const cover = computeNetwork(world, RULESET, side).coverage;
    if (world.entities.some((e) => e.side === side && cover[cellOf(world.map, e.x, e.y)] !== 1)) problems.push(`side ${side} unit out of cover`);
  }
  return problems;
}
