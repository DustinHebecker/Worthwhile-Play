import { archetypeOf, runTicks, spawn, type Command, type Layer, type SimEvent, type World } from '@wp/strategy-engine';
import { isEnemyKind, TD_RULESET, type EnemyKind } from './ruleset';

/**
 * Wave lanes on the shared engine (docs/design/tower-defense.md § 15.2–15.3), used by Tower Defense
 * and the strategy/TD hybrid: units spawn on the first point of a route when it is due and free,
 * follow its waypoints by `move` orders, and leave the map at its last point (a leak). One call
 * advances one engine tick. Pure: inputs are never mutated.
 */

/** A route: a spawn cell followed by waypoints; the last point is the goal (reaching it = a leak). */
export interface Route {
  readonly layer: Layer;
  readonly points: readonly (readonly [number, number])[];
}

export interface PendingSpawn {
  at: number;
  kind: EnemyKind;
  route: number;
  /** Side the unit fights for (absent: 1, the waves of Tower Defense). */
  side?: number;
}

/** A wave unit and the index of the route point it is heading for. */
export interface Walker {
  id: number;
  route: number;
  leg: number;
  /** Ticks this unit has spent stopped (EMP) in this wave; absent = 0. */
  stun?: number;
}

export interface LaneRun {
  tick: number;
  /** Not yet spawned, by `at` (ties keep authoring order). */
  pending: PendingSpawn[];
  walkers: Walker[];
}

/** A unit that got through: its kind, side and the health it still had. */
export interface Leak {
  id: number;
  kind: EnemyKind;
  hp: number;
  side: number;
}

/**
 * Most ticks a unit can be stopped per wave (6 s at 1×). Without it, several EMP towers could hold
 * a unit for good and stall the wave until the safety bound.
 */
export const STUN_BUDGET = 48;

export const chebyshev = (ax: number, ay: number, bx: number, by: number): number => Math.max(Math.abs(ax - bx), Math.abs(ay - by));

export interface LaneTick {
  world: World;
  run: LaneRun;
  events: SimEvent[];
  /** Units that reached the end of their route this tick (already removed from the world). */
  leaks: Leak[];
}

/** Advances the lanes by one engine tick: spawns, route orders, leaks, the tick itself, the stop budget. */
export function tickLanes(world: World, run: LaneRun, routes: readonly Route[]): LaneTick {
  const w = structuredClone(world);
  const r = structuredClone(run);
  // 1. Spawns that are due and whose spawn cell is free on their layer (in order per route).
  const waiting: PendingSpawn[] = [];
  for (const p of r.pending) {
    const [x, y] = routes[p.route]!.points[0]!;
    const arch = archetypeOf(TD_RULESET, p.kind)!;
    const blocked = w.entities.some((e) => e.x === x && e.y === y && archetypeOf(TD_RULESET, e.kind)?.layer === arch.layer);
    if (p.at > r.tick || blocked || waiting.some((q) => q.route === p.route && q.at <= r.tick)) {
      waiting.push(p);
      continue;
    }
    const id = w.nextId++;
    w.entities.push(spawn(id, p.side ?? 1, arch, x, y));
    r.walkers.push({ id, route: p.route, leg: 1 });
  }
  r.pending = waiting;
  // 2. Route following: a unit within one cell of its waypoint heads for the next; at the goal it leaks.
  const commands: Command[] = [];
  const leaks: Leak[] = [];
  const gone = new Set<number>();
  for (const walker of r.walkers) {
    const unit = w.entities.find((e) => e.id === walker.id);
    if (!unit) continue;
    const points = routes[walker.route]!.points;
    while (walker.leg < points.length - 1 && chebyshev(unit.x, unit.y, ...points[walker.leg]!) <= 1) walker.leg++;
    const [gx, gy] = points[walker.leg]!;
    if (walker.leg === points.length - 1 && chebyshev(unit.x, unit.y, gx, gy) <= 1) {
      if (isEnemyKind(unit.kind)) leaks.push({ id: unit.id, kind: unit.kind, hp: unit.hp, side: unit.side });
      gone.add(unit.id);
      continue;
    }
    if (unit.order.type !== 'move' || unit.order.x !== gx || unit.order.y !== gy) commands.push({ side: unit.side, unit: unit.id, order: { type: 'move', x: gx, y: gy } });
  }
  w.entities = w.entities.filter((e) => !gone.has(e.id));
  r.walkers = r.walkers.filter((x) => !gone.has(x.id));
  // 3. One engine tick.
  const result = runTicks(w, TD_RULESET, commands, 1);
  const next = result.world;
  const alive = new Set(next.entities.map((e) => e.id));
  r.walkers = r.walkers.filter((x) => alive.has(x.id));
  // 4. Stop budget: a unit that has been stopped long enough shakes every further stop off.
  for (const walker of r.walkers) {
    const unit = next.entities.find((e) => e.id === walker.id);
    if (!unit?.status.some((st) => st.kind === 'disabled' && st.ticks > 0)) continue;
    const stun = (walker.stun ?? 0) + 1;
    if (stun > STUN_BUDGET) unit.status = unit.status.filter((st) => st.kind !== 'disabled');
    else walker.stun = stun;
  }
  r.tick++;
  return { world: next, run: r, events: result.events, leaks };
}

/** Removes units (e.g. at the safety bound or when a game ends mid-wave) and reports them as leaks. */
export function removeWalkers(world: World, run: LaneRun, ids: ReadonlySet<number>): { world: World; run: LaneRun; leaks: Leak[] } {
  const leaks: Leak[] = [];
  for (const e of world.entities) if (ids.has(e.id) && isEnemyKind(e.kind)) leaks.push({ id: e.id, kind: e.kind, hp: e.hp, side: e.side });
  return {
    world: { ...world, entities: world.entities.filter((e) => !ids.has(e.id)) },
    run: { ...run, walkers: run.walkers.filter((x) => !ids.has(x.id)) },
    leaks
  };
}
