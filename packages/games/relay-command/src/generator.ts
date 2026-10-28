import { createRng, type Rng } from '@wp/game-core';
import { archetypeOf, cellOf, computeNetwork, createWorld, findPath, flowField, passable, STRATEGY_RULESET as RULESET, type GameMap } from '@wp/strategy-engine';
import { isFair, isValidMap, MAP_HEIGHTS, MAP_WIDTHS, mapIssues, MAX_NAME, toScenario, type EditMap, type MapDeposit, type MapUnit } from './maps';

/**
 * Seeded map generator (I6c, owner decisions 2026-10-16): point-symmetric two-side maps of every
 * editor size. Only the top half is generated (side 1); the bottom half and side 0 are its point
 * mirror, so both sides start equal. Deposits grow with the map's area (about two per side on
 * 12×10, five on 24×16), and maps from 200 cells up get a pair of rich deposits in the contested
 * middle: each about as far from one post as from the other, by ground path cost. Every map is
 * checked by `generatedMapProblems`, an independent validator; a candidate that fails is thrown
 * away and the next one drawn from the same seed, so a seed always gives the same map. The seed is
 * taken as an unsigned 32-bit integer (`seed >>> 0`: wraps modulo 2^32, drops fractions, NaN → 0);
 * callers that show it should normalise it the same way. Pure: no DOM, no Math.random.
 */

/** Deposits per side for a map of `w`×`h` cells (the map rule: more ground, more Supply). */
export const depositsPerSide = (w: number, h: number): number => Math.max(2, Math.min(5, Math.round((w * h) / 75)));
/** From this many cells, the contested middle holds a pair of rich deposits. */
export const RICH_MIDDLE_FROM = 200;
/** Command Posts stand at least this share of the map's longer side apart. */
export const POST_DISTANCE_SHARE = 0.5;
/** A rich deposit's ground path cost from the farther post is at most this multiple of the nearer one's. */
export const RICH_BALANCE = 1.25;
/** Deposits per base on a map with four (about two on 12×10 to three on 24×16; Four Corners has two). */
export const depositsPerSeat = (w: number, h: number): number => Math.max(2, Math.min(3, Math.round((w * h) / 120)));
/** Candidates drawn per seed before the plain fallback (which always passes). */
const ATTEMPTS = 40;
/**
 * Asymmetric maps (owner request 2026-10-27, "Beides": generated asymmetric maps besides the
 * hand-built ones): the ground path cost from a post to its own deposits, summed, is at most this
 * multiple of the other side's; so is the cost to the nearest of them.
 */
export const ASYM_BALANCE = 1.3;
/** On an asymmetric map the posts stand at least this many columns off each other's mirror image. */
export const ASYM_OFFSET_SHARE = 1 / 8;

/** The pieces each side starts with, by map size (small maps: Field Exercise's set; large: Ridge Valley's). */
function startingKinds(area: number): string[] {
  const base = ['command-post', 'muster', 'mast-truck', 'rifles', 'rifles', 'lancer', 'warden', 'jammer', 'tracer', 'howitzer'];
  if (area < 200) return base;
  return [...base, 'field-post', 'mast-truck', 'rifles', 'lancer', 'outrider'];
}

/** The pieces each base starts with on a map with four, by the size of its quarter (Four Corners' set from 48 cells). */
function seatKinds(quarter: number): string[] {
  const base = ['command-post', 'muster', 'mast-truck', 'rifles', 'rifles', 'lancer', 'howitzer'];
  if (quarter < 40) return base;
  if (quarter < 60) return [...base, 'warden', 'outrider'];
  return [...base, 'warden', 'outrider', 'jammer', 'tracer'];
}

/**
 * A generated map: the same `w`, `h`, `seed` and `bases` always give the same map. Two bases: point
 * symmetric (above). Four bases (owner decision 2026-10-18): one in each corner, the map the same
 * mirrored left to right and top to bottom; only the bottom-left quarter (seat 0) is generated.
 */
export function generateMap(w: number, h: number, seed: number, name = '', bases: 2 | 4 = 2, asymmetric = false): EditMap {
  if (!(MAP_WIDTHS as readonly number[]).includes(w) || !(MAP_HEIGHTS as readonly number[]).includes(h) || h % 2 !== 0) throw new RangeError(`No editor size: ${w}×${h}.`);
  if (name.length > MAX_NAME) throw new RangeError(`Map name longer than ${MAX_NAME} characters.`);
  if (bases !== 2 && bases !== 4) throw new RangeError(`No map with ${String(bases)} bases.`);
  if (asymmetric && bases !== 2) throw new RangeError('Asymmetric maps have two bases.');
  // Four bases and asymmetric maps draw from streams of their own, so the kinds of map of one number are unrelated.
  const rng = createRng(((seed >>> 0) ^ Math.imul(w * 64 + h + (bases === 4 ? 0x10000 : 0) + (asymmetric ? 0x20000 : 0), 0x9e3779b1)) >>> 0);
  const draw = bases === 4 ? candidateFour : asymmetric ? candidateAsymmetric : candidate;
  const ok = (map: EditMap | undefined): map is EditMap => !!map && generatedMapProblems(map, asymmetric).length === 0;
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const map = draw(w, h, rng, name, true);
    if (ok(map)) return map;
  }
  // Open ground with the bases only (always passes when mirrored): the rare seed whose candidates all failed.
  for (let attempt = 0; attempt < (asymmetric ? ATTEMPTS : 1); attempt++) {
    const plain = draw(w, h, rng, name, false);
    if (ok(plain)) return plain;
  }
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
    // The cell near the middle whose ground path costs from the two posts are closest to equal.
    const map: GameMap = { w, h, terrain: terrain.join('') };
    const fromOwn = flowField(map, RULESET, [cellOf(map, post.x, post.y)], 'ground');
    const m = mirror(post.x, post.y);
    const fromOther = flowField(map, RULESET, [cellOf(map, m.x, m.y)], 'ground');
    const balance = (c: { x: number; y: number }) => {
      const a = fromOwn[cellOf(map, c.x, c.y)] ?? -1;
      const b = fromOther[cellOf(map, c.x, c.y)] ?? -1;
      return a <= 0 || b <= 0 ? Infinity : Math.max(a, b) / Math.min(a, b);
    };
    const middle = near(Math.floor(w / 2), half - 1, 3)
      .filter((c) => spaced(c.x, c.y) && balance(c) <= RICH_BALANCE)
      .sort((p, q) => balance(p) - balance(q));
    if (!middle[0]) return undefined;
    deposits.push({ x: middle[0].x, y: middle[0].y, size: 'rich' });
  }

  const all: MapUnit[] = [...units.map((u) => ({ ...u, side: 0, ...mirror(u.x, u.y) })), ...units];
  const allDeposits: MapDeposit[] = deposits.flatMap((d) => [d, { ...d, ...mirror(d.x, d.y) }]);
  return { name, w, h, terrain: terrain.join(''), deposits: allDeposits, units: all.sort((a, b) => a.side - b.side || a.y - b.y || a.x - b.x) };
}

/**
 * An asymmetric two-side candidate (owner request 2026-10-27): terrain over the whole map without a
 * mirror, side 1's post near the top edge and side 0's near the bottom, each anywhere along its edge
 * but not where the other's mirror image would be; each side's starting pieces and deposits on its
 * own half. Fairness comes from the validator (`generatedMapProblems(map, true)`): as many deposits
 * per side, their ground path costs within ASYM_BALANCE, rich deposits in the contested middle.
 */
function candidateAsymmetric(w: number, h: number, rng: Rng, name: string, features: boolean): EditMap | undefined {
  const terrain: string[] = Array.from({ length: w * h }, () => '.');
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h;
  const set = (x: number, y: number, code: string) => {
    if (inside(x, y)) terrain[y * w + x] = code;
  };
  const at = (x: number, y: number) => terrain[y * w + x] ?? '^';
  const blocked = (x: number, y: number) => at(x, y) === '~' || at(x, y) === '^';
  const area = w * h;
  const half = h / 2;
  // Side 1's half is the top one (rows < half), side 0's the bottom one.
  const ownHalf = (side: number, y: number) => (side === 1 ? y < half : y >= half);

  const minDistance = POST_DISTANCE_SHARE * Math.max(w, h);
  const offset = Math.max(2, Math.round(w * ASYM_OFFSET_SHARE));
  let posts: [{ x: number; y: number }, { x: number; y: number }] | undefined;
  for (let k = 0; k < 30 && !posts; k++) {
    const top = { x: rng.int(2, w - 3), y: rng.int(1, Math.min(2, half - 2)) };
    const bottom = { x: rng.int(2, w - 3), y: h - 1 - rng.int(1, Math.min(2, half - 2)) };
    if (Math.hypot(top.x - bottom.x, top.y - bottom.y) >= minDistance && Math.abs(bottom.x - (w - 1 - top.x)) >= offset) posts = [bottom, top];
  }
  if (!posts) return undefined;

  if (features) {
    // Blobs of forest, hills, buildings and swamp; a few walls of water or ridge, anywhere on the map.
    const blob = (code: string, size: number) => {
      let x = rng.int(0, w - 1);
      let y = rng.int(0, h - 1);
      for (let i = 0; i < size; i++) {
        set(x, y, code);
        x = Math.max(0, Math.min(w - 1, x + rng.int(-1, 1)));
        y = Math.max(0, Math.min(h - 1, y + rng.int(-1, 1)));
      }
    };
    // Twice the blobs of half a symmetric map (it draws them on one half and mirrors them).
    for (let i = 0; i < 2 * Math.round(area / 40); i++) blob('f', rng.int(3, 7));
    for (let i = 0; i < 2 * Math.round(area / 90); i++) blob('h', rng.int(2, 4));
    for (let i = 0; i < 2 * Math.round(area / 120); i++) blob('u', rng.int(2, 4));
    for (let i = 0; i < 2 * Math.round(area / 150); i++) blob('s', rng.int(2, 4));
    const walls = area >= 160 ? rng.int(2, 6) : rng.int(0, 2);
    for (let i = 0; i < walls; i++) {
      const code = rng.int(0, 1) === 0 ? '~' : '^';
      const vertical = rng.int(0, 1) === 0;
      let x = rng.int(1, w - 2);
      let y = rng.int(1, h - 2);
      for (let k = 0, n = rng.int(3, Math.max(3, Math.round(Math.min(w, h) / 2))); k < n; k++) {
        set(x, y, code);
        if (vertical) y = Math.min(h - 2, y + 1);
        else x = Math.min(w - 2, x + 1);
      }
    }
    // A road from each post towards the middle.
    const cx = Math.floor(w / 2);
    for (const [side, post] of posts.entries()) {
      let x = post.x;
      let y = post.y;
      const goal = side === 1 ? half - 1 : half;
      for (let k = 0; k < w + h && (x !== cx || y !== goal); k++) {
        if (y !== goal && (rng.int(0, 2) > 0 || x === cx)) y += Math.sign(goal - y);
        else x += Math.sign(cx - x);
        if (!blocked(x, y)) set(x, y, '=');
      }
    }
  }
  // Each base area is open ground (the starting pieces must fit and move off).
  for (const [side, post] of posts.entries()) {
    for (let dy = -2; dy <= 2; dy++) for (let dx = -3; dx <= 3; dx++) if (inside(post.x + dx, post.y + dy) && ownHalf(side, post.y + dy)) set(post.x + dx, post.y + dy, '.');
  }

  const units: MapUnit[] = [];
  const taken = new Set<number>();
  const free = (side: number, x: number, y: number) => inside(x, y) && ownHalf(side, y) && !blocked(x, y) && !taken.has(y * w + x);
  const near = (side: number, cx: number, cy: number, r: number) => {
    const cells: { x: number; y: number; d: number; t: number }[] = [];
    for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) if (free(side, x, y)) cells.push({ x, y, d: (x - cx) ** 2 + (y - cy) ** 2, t: rng.int(0, 1000) });
    return cells.sort((a, b) => a.d - b.d || a.t - b.t);
  };
  for (const [side, post] of posts.entries()) {
    for (const kind of startingKinds(area)) {
      const spot = kind === 'command-post' ? { x: post.x, y: post.y } : near(side, post.x, post.y, 4)[kind === 'muster' ? 2 : 0];
      if (!spot) return undefined;
      taken.add(spot.y * w + spot.x);
      units.push({ side, kind, x: spot.x, y: spot.y });
    }
  }

  // Deposits: per side one behind the post (in its cover) and the others spread over its half; a
  // rich pair near the middle on larger maps, each about as far from both posts.
  const deposits: MapDeposit[] = [];
  const spaced = (x: number, y: number) => deposits.every((d) => Math.max(Math.abs(d.x - x), Math.abs(d.y - y)) >= 3);
  const own = depositsPerSide(w, h);
  for (const [side, post] of posts.entries()) {
    const first = near(side, post.x, post.y, 4).filter((c) => c.d >= 4 && spaced(c.x, c.y));
    if (!first[0]) return undefined;
    deposits.push({ x: first[0].x, y: first[0].y });
    taken.add(first[0].y * w + first[0].x);
    let placed = 1;
    for (let tries = 0; placed < own && tries < 200; tries++) {
      const x = rng.int(0, w - 1);
      const y = side === 1 ? rng.int(0, half - 1) : rng.int(half, h - 1);
      if (!free(side, x, y) || !spaced(x, y)) continue;
      deposits.push({ x, y });
      taken.add(y * w + x);
      placed++;
    }
    if (placed < own) return undefined;
  }
  if (area >= RICH_MIDDLE_FROM) {
    const map: GameMap = { w, h, terrain: terrain.join('') };
    const fields = posts.map((p) => flowField(map, RULESET, [cellOf(map, p.x, p.y)], 'ground'));
    const balance = (c: { x: number; y: number }) => {
      const [a, b] = fields.map((f) => f[cellOf(map, c.x, c.y)] ?? -1) as [number, number];
      return a <= 0 || b <= 0 ? Infinity : Math.max(a, b) / Math.min(a, b);
    };
    // One rich deposit in each half's middle rows, the most contested first.
    for (const side of [1, 0]) {
      const middle = near(side, Math.floor(w / 2), side === 1 ? half - 1 : half, 4)
        .filter((c) => spaced(c.x, c.y) && balance(c) <= RICH_BALANCE)
        .sort((p, q) => balance(p) - balance(q));
      if (!middle[0]) return undefined;
      deposits.push({ x: middle[0].x, y: middle[0].y, size: 'rich' });
      taken.add(middle[0].y * w + middle[0].x);
    }
  }

  return { name, w, h, terrain: terrain.join(''), deposits, units: units.sort((a, b) => a.side - b.side || a.y - b.y || a.x - b.x) };
}

/**
 * A four-base candidate: seat 0's quarter (bottom left: x < w/2, y ≥ h/2) is drawn, every change
 * is copied to its three mirror images. Seats as in EditMap: 1 top left, 2 top right, 3 bottom right.
 */
function candidateFour(w: number, h: number, rng: Rng, name: string, features: boolean): EditMap | undefined {
  const qw = w / 2;
  const qh = h / 2;
  const terrain: string[] = Array.from({ length: w * h }, () => '.');
  // The images of a cell of seat 0's quarter, in seat order.
  const images = (x: number, y: number) => [
    { x, y },
    { x, y: h - 1 - y },
    { x: w - 1 - x, y: h - 1 - y },
    { x: w - 1 - x, y }
  ];
  const inQuarter = (x: number, y: number) => x >= 0 && x < qw && y >= qh && y < h;
  const set = (x: number, y: number, code: string) => {
    if (!inQuarter(x, y)) return;
    for (const p of images(x, y)) terrain[p.y * w + p.x] = code;
  };
  const at = (x: number, y: number) => terrain[y * w + x] ?? '^';
  const blocked = (x: number, y: number) => at(x, y) === '~' || at(x, y) === '^';
  const quarter = qw * qh;

  // Seat 0's Command Post: near its corner, far enough from its two nearest images.
  const minDistance = POST_DISTANCE_SHARE * Math.min(w, h);
  let post: { x: number; y: number } | undefined;
  for (let k = 0; k < 20 && !post; k++) {
    const p = { x: rng.int(1, Math.max(1, Math.floor(qw / 2) - 1)), y: h - 1 - rng.int(1, Math.max(1, Math.floor(qh / 2) - 1)) };
    if (w - 1 - 2 * p.x >= minDistance && 2 * p.y - (h - 1) >= minDistance) post = p;
  }
  if (!post) return undefined;

  if (features) {
    // Blobs and short walls as on two-side maps, each drawn once per quarter.
    const blob = (code: string, size: number) => {
      let x = rng.int(0, qw - 1);
      let y = rng.int(qh, h - 1);
      for (let i = 0; i < size; i++) {
        set(x, y, code);
        x = Math.max(0, Math.min(qw - 1, x + rng.int(-1, 1)));
        y = Math.max(qh, Math.min(h - 1, y + rng.int(-1, 1)));
      }
    };
    for (let i = 0; i < Math.round(quarter / 20); i++) blob('f', rng.int(2, 5));
    for (let i = 0; i < Math.round(quarter / 45); i++) blob('h', rng.int(2, 3));
    for (let i = 0; i < Math.round(quarter / 60); i++) blob('u', rng.int(2, 3));
    for (let i = 0; i < Math.round(quarter / 75); i++) blob('s', rng.int(2, 3));
    const walls = quarter >= 60 ? rng.int(1, 2) : rng.int(0, 1);
    for (let i = 0; i < walls; i++) {
      const code = rng.int(0, 1) === 0 ? '~' : '^';
      const vertical = rng.int(0, 1) === 0;
      let x = rng.int(1, qw - 1);
      let y = rng.int(qh, h - 2);
      for (let k = 0, n = rng.int(2, Math.max(2, Math.round(Math.min(qw, qh) / 2))); k < n; k++) {
        set(x, y, code);
        if (vertical) y = Math.max(qh, y - 1);
        else x = Math.min(qw - 1, x + 1);
      }
    }
    // A road from the post towards the middle of the map.
    let x = post.x;
    let y = post.y;
    for (let k = 0; k < w + h && (x < qw - 1 || y > qh); k++) {
      if (y > qh && (rng.int(0, 2) > 0 || x === qw - 1)) y--;
      else x++;
      if (!blocked(x, y)) set(x, y, '=');
    }
  }
  // The post's surroundings are open ground (the quarter is small: the rest keeps its features).
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) set(post.x + dx, post.y + dy, '.');

  // Starting pieces: nearest free cells of the quarter to the post.
  const units: MapUnit[] = [];
  const taken = new Set<number>();
  const free = (x: number, y: number) => inQuarter(x, y) && !blocked(x, y) && !taken.has(y * w + x);
  const near = (cx: number, cy: number, r: number) => {
    const cells: { x: number; y: number; d: number; t: number }[] = [];
    for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) if (free(x, y)) cells.push({ x, y, d: (x - cx) ** 2 + (y - cy) ** 2, t: rng.int(0, 1000) });
    return cells.sort((a, b) => a.d - b.d || a.t - b.t);
  };
  // The cells next to the post stay free but for the yard: a post ringed by its own pieces cannot
  // be reached by a storm that only learns of the ring on arrival (measured: an opponent that never
  // moved against a passive player for 120 turns).
  const off = (c: { x: number; y: number }) => Math.max(Math.abs(c.x - post.x), Math.abs(c.y - post.y)) >= 2;
  for (const kind of seatKinds(quarter)) {
    const spot = kind === 'command-post' ? { x: post.x, y: post.y } : kind === 'muster' ? near(post.x, post.y, 1)[0] : near(post.x, post.y, 4).filter(off)[0];
    if (!spot) return undefined;
    taken.add(spot.y * w + spot.x);
    units.push({ side: 0, kind, x: spot.x, y: spot.y });
  }

  // Deposits: one in the post's cover, the others spread over the quarter, three cells from every
  // deposit and its images; on larger maps a rich one by the middle (four, one per quarter).
  const deposits: MapDeposit[] = [];
  const spaced = (x: number, y: number) => deposits.every((d) => images(d.x, d.y).every((p) => Math.max(Math.abs(p.x - x), Math.abs(p.y - y)) >= 3)) && images(x, y).slice(1).every((p) => Math.max(Math.abs(p.x - x), Math.abs(p.y - y)) >= 3);
  const first = near(post.x, post.y, 3).filter((c) => c.d >= 4 && spaced(c.x, c.y));
  if (!first[0]) return undefined;
  deposits.push({ x: first[0].x, y: first[0].y });
  taken.add(first[0].y * w + first[0].x);
  for (let tries = 0; deposits.length < depositsPerSeat(w, h) && tries < 200; tries++) {
    const x = rng.int(0, qw - 1);
    const y = rng.int(qh, h - 1);
    if (!free(x, y) || !spaced(x, y)) continue;
    deposits.push({ x, y });
    taken.add(y * w + x);
  }
  if (deposits.length < depositsPerSeat(w, h)) return undefined;
  if (w * h >= RICH_MIDDLE_FROM) {
    // The cell by the middle whose ground path costs from the four posts are closest to equal.
    const map: GameMap = { w, h, terrain: terrain.join('') };
    const fields = images(post.x, post.y).map((p) => flowField(map, RULESET, [cellOf(map, p.x, p.y)], 'ground'));
    const balance = (c: { x: number; y: number }) => {
      const costs = fields.map((f) => f[cellOf(map, c.x, c.y)] ?? -1);
      return costs.some((x) => x <= 0) ? Infinity : Math.max(...costs) / Math.min(...costs);
    };
    const middle = near(qw - 1, qh, 2)
      .filter((c) => deposits.every((d) => images(d.x, d.y).every((p) => Math.max(Math.abs(p.x - c.x), Math.abs(p.y - c.y)) >= 3)) && balance(c) <= RICH_BALANCE)
      .sort((p, q) => balance(p) - balance(q));
    if (!middle[0]) return undefined;
    deposits.push({ x: middle[0].x, y: middle[0].y, size: 'rich' });
  }

  const all: MapUnit[] = units.flatMap((u) => images(u.x, u.y).map((p, seat) => ({ ...u, side: seat, ...p })));
  const allDeposits: MapDeposit[] = deposits.flatMap((d) => images(d.x, d.y).map((p) => ({ ...d, ...p })));
  return { name, w, h, terrain: terrain.join(''), deposits: allDeposits, units: all.sort((a, b) => a.side - b.side || a.y - b.y || a.x - b.x), seats: 4 };
}

/**
 * Independent validator of a generated map (P9): written against the map only, not the generator.
 * Empty when the map is fair and playable: a valid editor map with no issues, the same for every
 * side (isFair), posts far enough apart, every deposit reachable over ground from every post, the
 * map rule's deposits per side (two sides: those in a side's half by row; four bases: those in a
 * base's quarter; by symmetry every side has as many), each rich deposit about as far from every
 * post by ground path cost (RICH_BALANCE), every starting unit inside its side's radio cover and
 * every mobile one able to step off its cell.
 */
export function generatedMapProblems(map: EditMap, asymmetric = false): string[] {
  const problems: string[] = [];
  if (!isValidMap(map)) return ['invalid map'];
  if (mapIssues(map).length > 0) problems.push('not playable');
  if (!asymmetric && !isFair(map)) problems.push('not symmetric');
  if (asymmetric && map.seats === 4) problems.push('asymmetric with four bases');
  const four = map.seats === 4;
  const sides = four ? [0, 1, 2, 3] : [0, 1];
  const posts = sides.map((side) => map.units.find((u) => u.side === side && u.kind === 'command-post'));
  if (posts.some((p) => !p)) return [...problems, 'no posts'];
  const all = posts as MapUnit[];
  // Two sides: across the longer side; four bases: each post from its neighbours, across the shorter.
  const minDistance = POST_DISTANCE_SHARE * (four ? Math.min(map.w, map.h) : Math.max(map.w, map.h));
  if (all.some((p, i) => all.some((q, j) => j > i && Math.hypot(p.x - q.x, p.y - q.y) < minDistance))) problems.push('posts too close');
  const scenario = toScenario(map);
  const reach = (from: MapUnit, x: number, y: number) =>
    findPath(scenario.map, RULESET, cellOf(scenario.map, from.x, from.y), cellOf(scenario.map, x, y), { layer: 'ground', side: from.side }) !== undefined;
  for (const d of map.deposits) if (all.some((p) => !reach(p, d.x, d.y))) problems.push(`deposit ${d.x},${d.y} unreachable`);
  // Side 0's own deposits: its half (two sides, the bottom one) or its quarter (bottom left).
  const own = map.deposits.filter((d) => d.y >= map.h / 2 && (!four || d.x < map.w / 2));
  const ownPlain = own.filter((d) => d.size !== 'rich').length;
  const rich = map.deposits.filter((d) => d.size === 'rich').length;
  if (ownPlain < (four ? depositsPerSeat(map.w, map.h) : depositsPerSide(map.w, map.h))) problems.push('too few deposits');
  // Without symmetry each side is counted: side 1's own deposits are those in the top half.
  const theirs = map.deposits.filter((d) => d.y < map.h / 2 && d.size !== 'rich').length;
  if (asymmetric && theirs !== ownPlain) problems.push('uneven deposits');
  if (map.w * map.h >= RICH_MIDDLE_FROM && rich < sides.length) problems.push('no rich middle');
  const fields = all.map((p) => flowField(scenario.map, RULESET, [cellOf(scenario.map, p.x, p.y)], 'ground'));
  for (const d of map.deposits.filter((x) => x.size === 'rich')) {
    const costs = fields.map((f) => f[cellOf(scenario.map, d.x, d.y)] ?? -1);
    if (costs.some((c) => c <= 0) || Math.max(...costs) > RICH_BALANCE * Math.min(...costs)) problems.push(`rich deposit ${d.x},${d.y} not contested`);
  }
  if (asymmetric && !four) {
    // Each side's own deposits (its half by row): their summed ground path cost from its post, and the nearest one's.
    const reachOf = (side: number) => {
      const field = fields[side]!;
      const costs = map.deposits.filter((d) => d.size !== 'rich' && (side === 0 ? d.y >= map.h / 2 : d.y < map.h / 2)).map((d) => field[cellOf(scenario.map, d.x, d.y)] ?? -1);
      return { sum: costs.reduce((a, b) => a + b, 0), nearest: Math.min(...costs), unreachable: costs.some((c) => c < 0) };
    };
    const [a, b] = [reachOf(0), reachOf(1)];
    const balanced = (x: number, y: number) => x > 0 && y > 0 && Math.max(x, y) <= ASYM_BALANCE * Math.min(x, y);
    if (a.unreachable || b.unreachable || !balanced(a.sum, b.sum) || !balanced(a.nearest, b.nearest)) problems.push('deposits not balanced');
    const [p0, p1] = all as [MapUnit, MapUnit];
    if (Math.abs(p0.x - (map.w - 1 - p1.x)) < Math.max(2, Math.round(map.w * ASYM_OFFSET_SHARE))) problems.push('posts mirrored');
  }
  // Every mobile starting unit can step off its cell (terrain only: the others move too).
  for (const u of map.units) {
    if ((archetypeOf(RULESET, u.kind)?.speed ?? 0) === 0) continue;
    let free = false;
    for (let dy = -1; dy <= 1 && !free; dy++) for (let dx = -1; dx <= 1 && !free; dx++) if ((dx || dy) && passable(scenario.map, RULESET, u.x + dx, u.y + dy, 'ground')) free = true;
    if (!free) problems.push(`unit ${u.x},${u.y} walled in`);
  }
  const world = createWorld({ ...scenario, seed: 1 }, RULESET);
  for (const side of sides) {
    const cover = computeNetwork(world, RULESET, side).coverage;
    if (world.entities.some((e) => e.side === side && cover[cellOf(world.map, e.x, e.y)] !== 1)) problems.push(`side ${side} unit out of cover`);
  }
  return problems;
}
