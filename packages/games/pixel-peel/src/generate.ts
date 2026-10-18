import { createRng, normalizeSeed, type Rng } from '@wp/game-core';
import { decodeRows } from './art/bake';
import { heightOf, rasterise, type Tier } from './art/raster';
import { ART_DIFFICULTIES, widthFor } from './art/sizes';
import type { Motif } from './art/types';
import { engineOf, exposedCounts, fullCells, hitsOf, launch, replayCursor, tableOf, type Cells, type Engine } from './engine';
import { BAKED } from './motifs/baked';
import { MOTIFS, findMotif } from './motifs/index';
import { POLICIES, runPolicy, type Budget, type PolicyId } from './policies';
import { toDifficulty, type Difficulty, type Move, type PeelState, type Picture, type Shooter } from './rules';

/**
 * The v2 generator (design v2 § 3): solvable by construction, hard by verification. `construct` plays a valid game
 * forward and records the lane order it needs (with deliberate early "decoy" shooters that must wait); `verdict`
 * runs the five reference policies; `generate` keeps the first candidate its level accepts, else the best one. All
 * randomness comes from one `createRng(seed)` in a fixed draw order; budgets count launches, never time.
 */

export interface Level {
  /** Palette tier (the width comes from the motif, `widthFor`). */
  tier: Tier;
  lanes: number;
  slots: number;
  /** Shots aimed for by a fitting shooter. */
  pack: readonly [number, number];
  /** Chance per construction step of a decoy (a shooter launched early that must wait). */
  decoy: number;
  decoyPack: readonly [number, number];
  /** Minimum shots of a fitting shooter (except a colour's last cells). */
  minShots: number;
  candidates: number;
  /** Counted launches for construction and verification together. */
  budget: number;
  /**
   * Dealing penalty for a shooter behind one of the same colour in its lane (owner feedback 2026-10-18: colour runs
   * in a lane make the game easy). Three in a row and a lane far longer than the shortest cost far more.
   */
  sameColour: number;
}

export const LEVELS: Readonly<Record<Difficulty, Level>> = {
  easy: { tier: 1, lanes: 4, slots: 5, pack: [10, 40], decoy: 0.06, decoyPack: [8, 30], minShots: 4, candidates: 3, budget: 6000, sameColour: 10 },
  medium: { tier: 2, lanes: 4, slots: 5, pack: [10, 60], decoy: 0.16, decoyPack: [10, 40], minShots: 4, candidates: 4, budget: 8000, sameColour: 40 },
  hard: { tier: 3, lanes: 4, slots: 4, pack: [12, 90], decoy: 0.3, decoyPack: [24, 90], minShots: 4, candidates: 4, budget: 10000, sameColour: 100 }
};

const decoded = new Map<string, string[]>();

/**
 * The played picture of a motif at a difficulty (a fresh copy): the baked picture when it is there and fits, else
 * the rasteriser (memoised).
 */
export function pictureFor(motif: Motif, difficulty: Difficulty): Picture {
  const w = widthFor(motif, difficulty);
  const h = heightOf(motif, w);
  const key = `${motif.id}|${difficulty}`;
  let rows = decoded.get(key);
  if (!rows) {
    const data = BAKED[motif.id]?.[ART_DIFFICULTIES.indexOf(difficulty)];
    const baked = data ? decodeRows(data) : undefined;
    rows = baked && baked.length === h && baked.every((r) => r.length === w) ? baked : rasterise(motif, w, LEVELS[difficulty].tier).rows;
    decoded.set(key, rows);
  }
  const used = new Set(rows.join(''));
  const palette = Object.entries(motif.palette)
    .filter(([k]) => used.has(k))
    .map(([k, spec]) => ({ key: k, hex: spec[0], name: spec[1] as string }));
  return { w, h, rows: [...rows], palette, backdrop: motif.backdrop };
}

interface Draw {
  c: number;
  n: number;
}
type Event = { kind: 'L'; draw: number } | { kind: 'S'; slot: number };

export interface Construction {
  lanes: Shooter[][];
  witness: Move[];
  /** Decoys launched (shooters deliberately early). */
  decoys: number;
  /** Launches spent. */
  launches: number;
}

/** Weighted pick by integer weights (one rng draw). */
function weighted<T>(rng: Rng, items: readonly T[], weight: (t: T) => number): T {
  let total = 0;
  for (const it of items) total += weight(it);
  let r = rng.int(1, Math.max(1, total));
  for (const it of items) {
    r -= weight(it);
    if (r <= 0) return it;
  }
  return items[items.length - 1] as T;
}

/**
 * Plays a game forward (design v2 § 3.2). It may choose which shooter comes next and how many shots it gets; that
 * choice becomes the lane order. Never stuck: per colour `reserved ≤ remaining`, so an exposed colour always has
 * either a parked shooter or room for a fitting one; slots never overflow.
 */
export function construct(engine: Engine, level: Level, rng: Rng): Construction {
  const colours = engine.keys.length;
  const cells: Cells = fullCells(engine);
  const remaining = new Int32Array(colours + 1);
  for (const c of engine.colour) remaining[c] = (remaining[c] as number) + 1;
  remaining[0] = 0;
  const reserved = new Int32Array(colours + 1);
  const slots: ({ c: number; n: number } | null)[] = Array.from({ length: level.slots }, () => null);
  const draws: Draw[] = [];
  const events: Event[] = [];
  let launches = 0;
  let decoys = 0;
  const hitsOn = (c: number, n: number) => {
    launches++;
    return hitsOf(engine, cells, c, n);
  };
  const relaunch = (j: number) => {
    const s = slots[j] as { c: number; n: number };
    launches++;
    const h = launch(engine, cells, s.c, s.n);
    remaining[s.c] = (remaining[s.c] as number) - h;
    reserved[s.c] = (reserved[s.c] as number) - h;
    s.n -= h;
    if (s.n === 0) slots[j] = null;
    events.push({ kind: 'S', slot: j });
  };
  for (let guard = 0; cells.left > 0 && guard < 20000; guard++) {
    const exposed = exposedCounts(engine, cells);
    const free = slots.indexOf(null);
    const ready: number[] = [];
    slots.forEach((s, j) => s && (exposed[s.c] as number) > 0 && ready.push(j));
    if (ready.length > 0 && (free < 0 || rng.next() < 0.6)) {
      relaunch(rng.pick(ready));
      continue;
    }
    if (free >= 0 && rng.next() < level.decoy) {
      const candidates: number[] = [];
      for (let c = 1; c <= colours; c++) if ((remaining[c] as number) - (reserved[c] as number) >= level.decoyPack[0]) candidates.push(c);
      if (candidates.length > 0) {
        // Weighted towards colours exposed least: those wait longest.
        const c = weighted(rng, candidates, (x) => ((exposed[x] as number) === 0 ? 6 : (exposed[x] as number) < 4 ? 3 : 1));
        const a = Math.min(rng.int(level.decoyPack[0], level.decoyPack[1]), (remaining[c] as number) - (reserved[c] as number));
        const h = hitsOn(c, a);
        if (h < a) {
          launches++;
          launch(engine, cells, c, a);
          remaining[c] = (remaining[c] as number) - h;
          reserved[c] = (reserved[c] as number) + a - h;
          slots[free] = { c, n: a - h };
          draws.push({ c, n: a });
          events.push({ kind: 'L', draw: draws.length - 1 });
          decoys++;
          continue;
        }
      }
    }
    // A fitting shooter, used up exactly.
    const target = rng.int(level.pack[0], level.pack[1]);
    const options: { c: number; h: number; cap: number }[] = [];
    for (let c = 1; c <= colours; c++) {
      const cap = (remaining[c] as number) - (reserved[c] as number);
      if ((exposed[c] as number) === 0 || cap <= 0) continue;
      const h = hitsOn(c, Math.min(target, cap));
      if (h > 0) options.push({ c, h, cap });
    }
    if (options.length === 0) {
      // Every exposed colour is reserved by a parked shooter, which can therefore hit.
      if (ready.length === 0) throw new Error('construct: no move (unreachable)');
      relaunch(rng.pick(ready));
      continue;
    }
    const enough = Math.max(level.minShots, level.pack[0]);
    const good = options.filter((o) => o.h >= enough || o.h === o.cap);
    const chosen = good.length > 0 ? weighted(rng, good, (o) => o.h) : options.reduce((x, o) => (o.h > x.h ? o : x));
    // Tiny shooters make dull play: a shooter that would hit fewer than `minShots`, or leave a remainder of fewer
    // than `minShots` cells of its colour, takes more shots and waits in a free slot with the rest instead.
    let n = chosen.h;
    const rest = chosen.cap - chosen.h;
    const freeNow = slots.indexOf(null);
    if (freeNow >= 0 && chosen.h < level.minShots && chosen.cap >= level.minShots) n = Math.min(chosen.cap, Math.max(level.minShots, target));
    else if (freeNow >= 0 && rest > 0 && rest < level.minShots) n = chosen.cap;
    launches++;
    const hit = launch(engine, cells, chosen.c, n);
    remaining[chosen.c] = (remaining[chosen.c] as number) - hit;
    if (n > hit) {
      reserved[chosen.c] = (reserved[chosen.c] as number) + n - hit;
      slots[freeNow] = { c: chosen.c, n: n - hit };
    }
    draws.push({ c: chosen.c, n });
    events.push({ kind: 'L', draw: draws.length - 1 });
  }
  // Deal the draws into lanes in draw order. Any lane keeps the witness valid (a lane is launched in draw order), so
  // the lane is chosen to interleave colours: not behind the same colour (never three in a row), not beside the
  // same colour at the same depth in a neighbouring lane, and keeping the lanes about equally long.
  const lanes: number[][] = Array.from({ length: level.lanes }, () => []);
  const laneOf: number[] = [];
  for (const d of draws) {
    const shortest = Math.min(...lanes.map((l) => l.length));
    let best = Infinity;
    let pool: number[] = [];
    lanes.forEach((lane, i) => {
      if (lane.length > shortest + 3) return;
      const depth = lane.length;
      let score = (lane.length - shortest) * 4;
      if (lane[depth - 1] === d.c) score += level.sameColour * (lane[depth - 2] === d.c ? 20 : 1);
      if (lanes[i - 1]?.[depth] === d.c) score += 3;
      if (lanes[i + 1]?.[depth] === d.c) score += 3;
      if (score < best) {
        best = score;
        pool = [i];
      } else if (score === best) pool.push(i);
    });
    const lane = rng.pick(pool);
    (lanes[lane] as number[]).push(d.c);
    laneOf.push(lane);
  }
  const shooters: Shooter[][] = lanes.map(() => []);
  draws.forEach((d, k) => (shooters[laneOf[k] as number] as Shooter[]).push({ c: engine.keys[d.c - 1] as string, n: d.n }));
  const witness = events.map((e) => (e.kind === 'L' ? `L${laneOf[e.draw]}` : `S${e.slot}`));
  return { lanes: shooters, witness, decoys, launches };
}

export type Verdict = Partial<Record<PolicyId, 'solved' | 'stuck' | 'unknown'>>;

const solvedCount = (v: Verdict) => POLICIES.filter((p) => v[p] === 'solved').length;

/** Whether a level accepts a verdict (design v2 § 2.1). Unknown counts as not accepted. */
export function accepts(difficulty: Difficulty, v: Verdict): boolean {
  if (POLICIES.some((p) => v[p] === undefined || v[p] === 'unknown')) {
    // Early exit leaves policies unrun; decide from what ran.
    if (difficulty === 'easy') return solvedCount(v) >= 3;
    if (difficulty === 'medium') return v.obvious === 'stuck' && solvedCount(v) >= 1;
    return false;
  }
  if (difficulty === 'easy') return solvedCount(v) >= 3;
  if (difficulty === 'medium') return v.obvious === 'stuck' && solvedCount(v) >= 1;
  return solvedCount(v) === 0;
}

/** Fallback ranking when no candidate is accepted (higher is better). */
function score(difficulty: Difficulty, v: Verdict): number {
  const solved = solvedCount(v);
  const failed = POLICIES.filter((p) => v[p] === 'stuck').length;
  if (difficulty === 'hard') return failed;
  if (difficulty === 'medium') return (v.obvious === 'stuck' ? 10 : 0) - Math.abs(solved - 2);
  return solved;
}

/** Runs the policies with early exit as soon as the level's rule is decided. */
export function verdict(table: ReturnType<typeof tableOf>, difficulty: Difficulty, seed: number, budget: Budget): Verdict {
  const v: Verdict = {};
  for (const id of POLICIES) {
    const r = runPolicy(table, id, seed, budget).result;
    v[id] = r;
    if (r === 'unknown') break;
    if (difficulty === 'hard' && r === 'solved') break;
    if (difficulty === 'medium' && ((id === 'obvious' && r === 'solved') || (id !== 'obvious' && r === 'solved'))) break;
    if (difficulty === 'easy' && solvedCount(v) >= 3) break;
  }
  return v;
}

export interface Generated {
  motif: Motif;
  picture: Picture;
  lanes: Shooter[][];
  slots: number;
  witness: Move[];
  verdict: Verdict;
  accepted: boolean;
  candidates: number;
  decoys: number;
  /** Counted launches spent (construction and verification). */
  launches: number;
}

/** Generates one game for a motif and difficulty (design v2 § 3.4). */
export function generate(motif: Motif, difficulty: Difficulty, rng: Rng, seed = 0): Generated {
  const level = LEVELS[difficulty];
  const picture = pictureFor(motif, difficulty);
  const engine = engineOf(picture);
  const budget: Budget = { left: level.budget };
  let best: (Generated & { score: number }) | undefined;
  for (let k = 1; k <= level.candidates; k++) {
    if (k > 1 && budget.left <= 0) break;
    const c = construct(engine, level, rng);
    budget.left -= c.launches;
    const table = tableOf(engine, c.lanes, level.slots);
    const v = budget.left > 0 ? verdict(table, difficulty, seed + k, budget) : {};
    const ok = budget.left >= 0 && accepts(difficulty, v);
    const s = score(difficulty, v);
    const g = { motif, picture, lanes: c.lanes, slots: level.slots, witness: c.witness, verdict: v, accepted: ok, candidates: k, decoys: c.decoys, launches: level.budget - budget.left, score: s };
    if (ok) return g;
    if (!best || s > best.score) best = g;
    best = { ...best, candidates: k, launches: level.budget - budget.left };
  }
  return best as Generated;
}

/** Checks that a witness solves the lanes (the generator's own assertion). */
export function witnessSolves(picture: Picture, lanes: Shooter[][], slots: number, witness: readonly Move[]): boolean {
  const table = tableOf(engineOf(picture), lanes, slots);
  return replayCursor(table, witness)?.cells.left === 0;
}

/** Resolves the start-screen choice: `any` or a known motif id; anything else counts as `any`. */
export const toChoice = (value: unknown): string => (typeof value === 'string' && findMotif(value) ? value : 'any');

export function createInitial(seed: number, difficulty: unknown = 'easy', choice: unknown = 'any'): PeelState {
  const s = normalizeSeed(seed);
  const d = toDifficulty(difficulty);
  const c = toChoice(choice);
  const rng = createRng(s);
  const motif = c === 'any' ? (MOTIFS[rng.int(0, MOTIFS.length - 1)] as Motif) : (findMotif(c) as Motif);
  const g = generate(motif, d, rng, s);
  // Solvable by construction; checked once more, so a generator bug can never ship an unsolvable game.
  if (!witnessSolves(g.picture, g.lanes, g.slots, g.witness)) throw new Error(`pixel-peel: the witness of ${motif.id}/${d}/${s} does not solve`);
  return {
    seed: s,
    difficulty: d,
    choice: c,
    motif: motif.id,
    picture: g.picture,
    lanes: g.lanes,
    slots: g.slots,
    witness: g.witness,
    moves: [],
    restartUndo: null,
    reported: false
  };
}
