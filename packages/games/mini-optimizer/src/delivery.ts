/**
 * Delivery — "Deliver the parcels": a van with limited capacity leaves the depot, visits customers and returns;
 * it may reload as often as needed. Distances are city blocks (Manhattan). Pure logic: generator, score, solver.
 */
import { isArrayOf, isInt, isRecord, type Rng } from '@wp/game-core';
import { MAX_ATTEMPTS, type Difficulty } from './common';

export interface GridPoint {
  x: number;
  y: number;
}
export interface Stop extends GridPoint {
  parcels: number;
}
export interface DeliveryProblem {
  kind: 'delivery';
  /** Intersections per side. */
  size: number;
  depot: GridPoint;
  stops: Stop[];
  capacity: number;
}
export interface DeliveryPlan {
  /** Trips in order; each stop at most once overall. Only the last trip may be empty (a new trip just started). */
  trips: number[][];
}

export const DEL_MAX_STOPS = 7;

const isGridPoint = (v: unknown, size: number): v is GridPoint => isRecord(v) && isInt(v.x, 0, size - 1) && isInt(v.y, 0, size - 1);
const isStop = (size: number) => (v: unknown): v is Stop => isGridPoint(v, size) && isInt((v as unknown as Record<string, unknown>).parcels, 1, 9);

export function isDeliveryProblem(v: unknown): v is DeliveryProblem {
  if (!isRecord(v) || v.kind !== 'delivery' || !isInt(v.size, 5, 9)) return false;
  const size = v.size;
  if (!isGridPoint(v.depot, size) || !isArrayOf(v.stops, isStop(size)) || v.stops.length < 1 || v.stops.length > DEL_MAX_STOPS) return false;
  if (!isInt(v.capacity, 1, 60) || v.stops.some((s) => s.parcels > (v.capacity as number))) return false;
  const seen = new Set([`${v.depot.x},${v.depot.y}`]);
  for (const s of v.stops) {
    const key = `${s.x},${s.y}`;
    if (seen.has(key)) return false;
    seen.add(key);
  }
  return true;
}

export function isDeliveryPlan(v: unknown, p: DeliveryProblem): v is DeliveryPlan {
  if (!isRecord(v) || !Array.isArray(v.trips) || v.trips.length > p.stops.length) return false;
  const seen = new Set<number>();
  return v.trips.every((trip: unknown, i: number, all: unknown[]) => {
    if (!isArrayOf(trip, (s): s is number => isInt(s, 0, p.stops.length - 1))) return false;
    if (trip.length === 0 && i !== all.length - 1) return false;
    for (const s of trip) {
      if (seen.has(s)) return false;
      seen.add(s);
    }
    return true;
  });
}

export const emptyDeliveryPlan = (): DeliveryPlan => ({ trips: [] });

/* ---------- Score and constraints ---------- */

export const blocks = (a: GridPoint, b: GridPoint): number => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

/** Length of one round trip depot → stops → depot (0 for an empty trip). */
export function tripLength(p: DeliveryProblem, trip: readonly number[]): number {
  let length = 0;
  let at: GridPoint = p.depot;
  for (const s of trip) {
    length += blocks(at, p.stops[s]!);
    at = p.stops[s]!;
  }
  return length + blocks(at, p.depot);
}

export const tripLoad = (p: DeliveryProblem, trip: readonly number[]): number => trip.reduce((sum, s) => sum + p.stops[s]!.parcels, 0);
export const deliveryDistance = (p: DeliveryProblem, plan: DeliveryPlan): number => plan.trips.reduce((sum, trip) => sum + tripLength(p, trip), 0);
export const unvisited = (p: DeliveryProblem, plan: DeliveryPlan): number[] => {
  const visited = new Set(plan.trips.flat());
  return p.stops.map((_, i) => i).filter((i) => !visited.has(i));
};
export const overloaded = (p: DeliveryProblem, plan: DeliveryPlan): number[] =>
  plan.trips.flatMap((trip, i) => (tripLoad(p, trip) > p.capacity ? [i] : []));
export const deliveryFeasible = (p: DeliveryProblem, plan: DeliveryPlan): boolean => unvisited(p, plan).length === 0 && overloaded(p, plan).length === 0;

/* ---------- Plan edits ---------- */

/** The trip a stop is in, or −1. */
export const tripOf = (plan: DeliveryPlan, stop: number): number => plan.trips.findIndex((trip) => trip.includes(stop));

export function addStop(p: DeliveryProblem, plan: DeliveryPlan, stop: number): DeliveryPlan {
  if (!Number.isInteger(stop) || stop < 0 || stop >= p.stops.length || tripOf(plan, stop) >= 0) return plan;
  if (plan.trips.length === 0) return { trips: [[stop]] };
  return { trips: plan.trips.map((trip, i) => (i === plan.trips.length - 1 ? [...trip, stop] : trip)) };
}

/** Removes a stop from its trip; a trip left empty disappears unless it is the last (current) one. */
export function removeStop(plan: DeliveryPlan, stop: number): DeliveryPlan {
  const at = tripOf(plan, stop);
  if (at < 0) return plan;
  const trips = plan.trips.map((trip) => trip.filter((s) => s !== stop));
  return { trips: trips.filter((trip, i) => trip.length > 0 || i === trips.length - 1) };
}

/** Closes the current trip (back to the depot): the next stop starts a new trip. No-op when the current trip is empty. */
export function newTrip(p: DeliveryProblem, plan: DeliveryPlan): DeliveryPlan {
  const last = plan.trips[plan.trips.length - 1];
  if (!last || last.length === 0 || plan.trips.length >= p.stops.length) return plan;
  return { trips: [...plan.trips, []] };
}

/* ---------- Exact solver ---------- */

/**
 * Held–Karp gives the shortest round trip for every subset of customers; a partition DP then splits all customers
 * into trips that fit the van. Both are exact; n ≤ 7 keeps it far below a millisecond.
 */
export function solveDelivery(p: DeliveryProblem): { score: number; plan: DeliveryPlan } {
  const n = p.stops.length;
  const full = (1 << n) - 1;
  const INF = Number.MAX_SAFE_INTEGER;
  const dp: number[][] = Array.from({ length: 1 << n }, () => new Array<number>(n).fill(INF));
  const parent: number[][] = Array.from({ length: 1 << n }, () => new Array<number>(n).fill(-1));
  for (let s = 0; s < n; s++) dp[1 << s]![s] = blocks(p.depot, p.stops[s]!);
  for (let mask = 1; mask <= full; mask++) {
    for (let last = 0; last < n; last++) {
      const here = dp[mask]![last]!;
      if (here === INF || !(mask & (1 << last))) continue;
      for (let next = 0; next < n; next++) {
        if (mask & (1 << next)) continue;
        const m2 = mask | (1 << next);
        const value = here + blocks(p.stops[last]!, p.stops[next]!);
        if (value < dp[m2]![next]!) {
          dp[m2]![next] = value;
          parent[m2]![next] = last;
        }
      }
    }
  }
  const tour = new Array<number>(full + 1).fill(INF);
  const tourEnd = new Array<number>(full + 1).fill(-1);
  const load = new Array<number>(full + 1).fill(0);
  for (let mask = 1; mask <= full; mask++) {
    for (let s = 0; s < n; s++) if (mask & (1 << s)) load[mask] = load[mask]! + p.stops[s]!.parcels;
    for (let last = 0; last < n; last++) {
      if (dp[mask]![last]! === INF) continue;
      const value = dp[mask]![last]! + blocks(p.stops[last]!, p.depot);
      if (value < tour[mask]!) {
        tour[mask] = value;
        tourEnd[mask] = last;
      }
    }
  }
  const best = new Array<number>(full + 1).fill(INF);
  const choice = new Array<number>(full + 1).fill(0);
  best[0] = 0;
  for (let mask = 1; mask <= full; mask++) {
    const low = mask & -mask;
    for (let sub = mask; sub > 0; sub = (sub - 1) & mask) {
      if (!(sub & low) || load[sub]! > p.capacity || best[mask ^ sub]! === INF) continue;
      const value = tour[sub]! + best[mask ^ sub]!;
      if (value < best[mask]!) {
        best[mask] = value;
        choice[mask] = sub;
      }
    }
  }
  const trips: number[][] = [];
  for (let mask = full; mask > 0; mask ^= choice[mask]!) {
    const sub = choice[mask]!;
    const order: number[] = [];
    for (let m = sub, last = tourEnd[sub]!; m > 0 && last >= 0; ) {
      order.unshift(last);
      const prev = parent[m]![last]!;
      m ^= 1 << last;
      last = prev;
    }
    trips.push(order);
  }
  return { score: best[full]!, plan: { trips } };
}

/** "Nearest next stop that still fits, else back to the depot" — the obvious plan the filters compare against. */
export function nearestFitPlan(p: DeliveryProblem): DeliveryPlan {
  const left = new Set(p.stops.map((_, i) => i));
  const trips: number[][] = [];
  let trip: number[] = [];
  let at: GridPoint = p.depot;
  let room = p.capacity;
  while (left.size > 0) {
    let next = -1;
    for (const s of left) {
      if (p.stops[s]!.parcels > room) continue;
      if (next < 0 || blocks(at, p.stops[s]!) < blocks(at, p.stops[next]!)) next = s;
    }
    if (next < 0) {
      trips.push(trip);
      trip = [];
      at = p.depot;
      room = p.capacity;
      continue;
    }
    trip.push(next);
    left.delete(next);
    at = p.stops[next]!;
    room -= p.stops[next]!.parcels;
  }
  trips.push(trip);
  return { trips };
}

/* ---------- Generator ---------- */

interface DelLevel {
  size: number;
  stops: number;
  parcels: [number, number];
}
const LEVELS: Record<Difficulty, DelLevel> = {
  easy: { size: 7, stops: 5, parcels: [1, 1] },
  medium: { size: 9, stops: 6, parcels: [1, 3] },
  hard: { size: 9, stops: 7, parcels: [1, 4] }
};

const chebyshev = (a: GridPoint, b: GridPoint) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

function attemptDelivery(rng: Rng, difficulty: Difficulty): DeliveryProblem | null {
  const level = LEVELS[difficulty];
  const centre = (level.size - 1) / 2;
  const depot = { x: centre + rng.int(-1, 1), y: centre + rng.int(-1, 1) };
  const stops: Stop[] = [];
  for (let tries = 0; stops.length < level.stops; tries++) {
    if (tries > 400) return null;
    const q = { x: rng.int(0, level.size - 1), y: rng.int(0, level.size - 1) };
    if (chebyshev(q, depot) >= 2 && stops.every((s) => chebyshev(s, q) >= 2)) stops.push({ ...q, parcels: rng.int(level.parcels[0], level.parcels[1]) });
  }
  // Customer letters follow reading order (A top left).
  stops.sort((u, v) => u.y - v.y || u.x - v.x);
  const total = stops.reduce((sum, s) => sum + s.parcels, 0);
  const largest = Math.max(...stops.map((s) => s.parcels));
  let capacity = total;
  if (difficulty === 'medium') capacity = rng.int(Math.max(largest, Math.ceil(total / 2)), total - 1);
  if (difficulty === 'hard') {
    const low = Math.max(largest, Math.ceil(total / 3));
    const high = Math.ceil(total / 2);
    if (low > high) return null;
    capacity = rng.int(low, high);
  }
  const problem: DeliveryProblem = { kind: 'delivery', size: level.size, depot, stops, capacity };
  return isDeliveryProblem(problem) ? problem : null;
}

/** Interest filter (§ 5.2): on medium/hard the nearest-stop habit is strictly worse than the optimum. */
export function deliveryIsInteresting(p: DeliveryProblem, difficulty: Difficulty): boolean {
  if (difficulty === 'easy') return true;
  return deliveryDistance(p, nearestFitPlan(p)) > solveDelivery(p).score;
}

/** Fixed instances (frozen generator output, seed 2026) for the rare case that 200 attempts find nothing; tests check them. */
export const DELIVERY_FALLBACK: Record<Difficulty, DeliveryProblem> = {
  easy: {
    kind: 'delivery',
    size: 7,
    depot: { x: 3, y: 2 },
    stops: [
      { x: 2, y: 0, parcels: 1 },
      { x: 0, y: 1, parcels: 1 },
      { x: 1, y: 4, parcels: 1 },
      { x: 4, y: 4, parcels: 1 },
      { x: 2, y: 6, parcels: 1 }
    ],
    capacity: 5
  },
  medium: {
    kind: 'delivery',
    size: 9,
    depot: { x: 4, y: 3 },
    stops: [
      { x: 2, y: 0, parcels: 1 },
      { x: 5, y: 0, parcels: 1 },
      { x: 2, y: 3, parcels: 3 },
      { x: 5, y: 5, parcels: 1 },
      { x: 1, y: 6, parcels: 3 },
      { x: 8, y: 8, parcels: 3 }
    ],
    capacity: 7
  },
  hard: {
    kind: 'delivery',
    size: 9,
    depot: { x: 4, y: 3 },
    stops: [
      { x: 2, y: 0, parcels: 1 },
      { x: 5, y: 0, parcels: 1 },
      { x: 2, y: 3, parcels: 4 },
      { x: 5, y: 5, parcels: 1 },
      { x: 1, y: 6, parcels: 4 },
      { x: 5, y: 7, parcels: 2 },
      { x: 8, y: 8, parcels: 4 }
    ],
    capacity: 9
  }
};

export function generateDelivery(rng: Rng, difficulty: Difficulty): { problem: DeliveryProblem; fallback: boolean } {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const problem = attemptDelivery(rng, difficulty);
    if (problem && deliveryIsInteresting(problem, difficulty)) return { problem, fallback: false };
  }
  return { problem: structuredClone(DELIVERY_FALLBACK[difficulty]), fallback: true };
}
