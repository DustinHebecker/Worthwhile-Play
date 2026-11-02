import { archetypeOf, runTicks, spawn, type Command, type Entity, type Layer, type SimEvent, type World } from '@wp/strategy-engine';
import { ENEMIES, isDefenderKind, isEnemyKind, TD_RULESET, type DefenderKind, type EnemyKind } from './ruleset';

/**
 * Wave lanes on the shared engine (docs/design/tower-defense.md § 15.2–15.3), used by Tower Defense
 * and the strategy/TD hybrid: units spawn on the first point of a route when it is due and free,
 * follow its waypoints by `move` orders, and leave the map at its last point (a leak). One call
 * advances one engine tick. Pure: inputs are never mutated.
 *
 * Defenders (Hold the Line, § 18.3) are walkers too: they follow their route (the incoming road,
 * reversed) but hold wherever a hostile wave unit is within their reach, and at its end; they never
 * leak. Wave units held up next to a defender wear it down by contact (CONTACT_EVERY, CONTACT_DAMAGE).
 * Without defenders in the world none of this does anything.
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

/** A defender still to set off (§ 18.3): as a wave unit's spawn, on its own route. */
export interface GuardSpawn {
  at: number;
  kind: DefenderKind;
  route: number;
  side: number;
}

export interface LaneRun {
  tick: number;
  /** Not yet spawned, by `at` (ties keep authoring order). */
  pending: PendingSpawn[];
  walkers: Walker[];
  /** Defenders not yet set off (absent: none, as in Tower Defense). */
  guards?: GuardSpawn[];
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

/** Contact (§ 18.3): every this many ticks, each wave unit next to a hostile defender on its layer hits it. */
export const CONTACT_EVERY = 4;
/** Damage of one contact hit per point of the unit's threat (a Brute: 3 × this). */
export const CONTACT_DAMAGE = 4;
/** A defender holds once a hostile wave unit is this close (cells), whatever its reach: the hold line. */
export const HOLD_LINE = 3;
/** A defender holds wherever it is once a unit of the force is this close (cells, in a straight line). */
export const CLOSE = 2;
/** A defender never holds within this many cells of its start (unless the force is CLOSE). */
export const SPAWN_CLEAR = 2;
/** How far a defender looks for the force when it has no weapon (a Medic stays with the others). */
const UNARMED_REACH = 2;

export const chebyshev = (ax: number, ay: number, bx: number, by: number): number => Math.max(Math.abs(ax - bx), Math.abs(ay - by));

export interface LaneTick {
  world: World;
  run: LaneRun;
  events: SimEvent[];
  /** Units that reached the end of their route this tick (already removed from the world). */
  leaks: Leak[];
}

/**
 * Advances the lanes by one engine tick: spawns, route orders, leaks, the tick itself, the stop budget.
 * Pure by default; `owned: true` lets a caller that owns `world` and `run` (a planner's private
 * simulation) skip the copies, and then both may be changed.
 */
export function tickLanes(world: World, run: LaneRun, routes: readonly Route[], owned = false): LaneTick {
  const w = owned ? world : structuredClone(world);
  const r = owned ? run : structuredClone(run);
  // 1. Spawns that are due and whose spawn cell is free on their layer (in order per route); then defenders.
  const due = <T extends { at: number; kind: string; route: number; side?: number }>(list: readonly T[]): T[] => {
    const waiting: T[] = [];
    for (const p of list) {
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
    return waiting;
  };
  r.pending = due(r.pending);
  if (r.guards) r.guards = due(r.guards);
  // 2. Route following: a unit within one cell of its waypoint heads for the next; at the goal it leaks.
  const commands: Command[] = [];
  const leaks: Leak[] = [];
  const gone = new Set<number>();
  const guarded = w.entities.some((e) => isDefenderKind(e.kind));
  for (const walker of r.walkers) {
    const unit = w.entities.find((e) => e.id === walker.id);
    if (!unit) continue;
    const points = routes[walker.route]!.points;
    while (walker.leg < points.length - 1 && chebyshev(unit.x, unit.y, ...points[walker.leg]!) <= 1) walker.leg++;
    const [gx, gy] = points[walker.leg]!;
    if (isDefenderKind(unit.kind)) {
      // A defender holds where a unit of the force is close ahead *along its road* (its reach or the
      // hold line, whichever is more; measured along the road, not across a bend: review of PR #111,
      // M2), or CLOSE to it, and at the end of its route. It never holds near its start, so the
      // defenders behind it can set off.
      const reach = Math.max(HOLD_LINE, archetypeOf(TD_RULESET, unit.kind)?.weapon?.range ?? UNARMED_REACH);
      const at = along(points, unit.x, unit.y) ?? 0;
      const hostile = w.entities.filter((e) => e.side !== unit.side && isEnemyKind(e.kind));
      // Very close (CLOSE cells) it holds wherever it is: walking into each other, the two would block one another out of reach.
      const adjacent = hostile.some((e) => chebyshev(e.x, e.y, unit.x, unit.y) <= CLOSE);
      const ahead = hostile.some((e) => {
        const p = along(points, e.x, e.y);
        return p !== null && p >= at && p - at <= reach;
      });
      const end = walker.leg === points.length - 1 && chebyshev(unit.x, unit.y, gx, gy) <= 1;
      if (adjacent || (at > SPAWN_CLEAR && (ahead || end))) {
        if (unit.order.type !== 'hold') commands.push({ side: unit.side, unit: unit.id, order: { type: 'hold' } });
      } else if (unit.order.type !== 'move' || unit.order.x !== gx || unit.order.y !== gy) commands.push({ side: unit.side, unit: unit.id, order: { type: 'move', x: gx, y: gy } });
      continue;
    }
    if (walker.leg === points.length - 1 && chebyshev(unit.x, unit.y, gx, gy) <= 1) {
      if (isEnemyKind(unit.kind)) leaks.push({ id: unit.id, kind: unit.kind, hp: unit.hp, side: unit.side });
      gone.add(unit.id);
      continue;
    }
    // A hostile defender on its road ahead: head for the cell just before it (the engine finds no
    // way past it to the waypoint, and would not even close in), so the two meet (§ 18.3).
    const [tx, ty] = guarded ? frontOf(points, unit, w.entities, [gx, gy]) : [gx, gy];
    if (unit.order.type !== 'move' || unit.order.x !== tx || unit.order.y !== ty) commands.push({ side: unit.side, unit: unit.id, order: { type: 'move', x: tx, y: ty } });
  }
  w.entities = w.entities.filter((e) => !gone.has(e.id));
  r.walkers = r.walkers.filter((x) => !gone.has(x.id));
  // 3. One engine tick.
  const result = runTicks(w, TD_RULESET, commands, 1);
  const next = result.world;
  // 3b. Contact: wave units held up next to a hostile defender wear it down (fixed order: by id).
  if (r.tick % CONTACT_EVERY === 0 && next.entities.some((e) => isDefenderKind(e.kind))) contact(next, result.events);
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

/**
 * Contact damage (§ 18.3, engine-free extension E5b): each wave unit (by id) next to a hostile
 * defender on its own layer hits the defender with the lowest id among them, by its threat ×
 * CONTACT_DAMAGE, the shield first. A defender brought to 0 is removed with a `destroyed` event.
 */
function contact(w: World, events: SimEvent[]): void {
  // The world's own clock, as the engine's hits use it (a shield returns `regenDelay` after its last hit).
  const tick = w.tick - 1;
  const layerOf = (kind: string) => archetypeOf(TD_RULESET, kind)?.layer;
  const attackers = w.entities.filter((e) => isEnemyKind(e.kind)).sort((a, b) => a.id - b.id);
  for (const unit of attackers) {
    const target = w.entities
      .filter((d) => isDefenderKind(d.kind) && d.side !== unit.side && d.hp > 0 && layerOf(d.kind) === layerOf(unit.kind) && chebyshev(d.x, d.y, unit.x, unit.y) <= 1)
      .sort((a, b) => a.id - b.id)[0];
    if (!target) continue;
    let damage = ENEMIES[unit.kind as EnemyKind].threat * CONTACT_DAMAGE;
    const soaked = Math.min(target.shield ?? 0, damage);
    if (soaked > 0) target.shield = (target.shield ?? 0) - soaked;
    damage -= soaked;
    target.hp = Math.max(0, target.hp - damage);
    if (archetypeOf(TD_RULESET, target.kind)?.shield) target.shieldAt = tick;
    target.hitAt = tick;
    events.push({ t: 'hit', tick, id: target.id, side: target.side, damage, ...(soaked > 0 && { shield: soaked }) });
    if (target.hp === 0) events.push({ t: 'destroyed', tick, id: target.id, side: target.side, kind: target.kind, x: target.x, y: target.y });
  }
  w.entities = w.entities.filter((e) => !(isDefenderKind(e.kind) && e.hp === 0));
}

/**
 * Where (x, y) lies along a route of straight (or diagonal) legs, in cells from its start
 * (Chebyshev steps), or null when it is not on the route.
 */
export function along(points: Route['points'], x: number, y: number): number | null {
  let done = 0;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1]!;
    const [bx, by] = points[i]!;
    const length = chebyshev(ax, ay, bx, by);
    const k = chebyshev(ax, ay, x, y);
    // On this leg when stepping k cells from its start towards its end lands on (x, y).
    if (k <= length && length > 0 && ax + Math.round(((bx - ax) * k) / length) === x && ay + Math.round(((by - ay) * k) / length) === y) return done + k;
    done += length;
  }
  return points.length === 1 && points[0]![0] === x && points[0]![1] === y ? 0 : null;
}

/** The cell `k` steps along a route from its start (clamped to its ends). */
export function cellAt(points: Route['points'], k: number): [number, number] {
  let left = Math.max(0, k);
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1]!;
    const [bx, by] = points[i]!;
    const length = chebyshev(ax, ay, bx, by);
    if (left <= length && length > 0) return [ax + Math.round(((bx - ax) * left) / length), ay + Math.round(((by - ay) * left) / length)];
    left -= length;
  }
  const [x, y] = points[points.length - 1]!;
  return [x, y];
}

/**
 * Where a wave unit heads: its waypoint, or, when a hostile defender on its layer stands on its road
 * between it and that waypoint, the cell just before the nearest such defender.
 */
function frontOf(points: Route['points'], unit: Entity, entities: readonly Entity[], goal: readonly [number, number]): [number, number] {
  const at = along(points, unit.x, unit.y);
  const target = along(points, goal[0], goal[1]);
  if (at === null || target === null) return [goal[0], goal[1]];
  const layer = archetypeOf(TD_RULESET, unit.kind)?.layer;
  let nearest = Infinity;
  for (const d of entities) {
    if (!isDefenderKind(d.kind) || d.side === unit.side || archetypeOf(TD_RULESET, d.kind)?.layer !== layer) continue;
    const p = along(points, d.x, d.y);
    if (p !== null && p > at && p <= target && p < nearest) nearest = p;
  }
  return nearest === Infinity ? [goal[0], goal[1]] : cellAt(points, nearest - 1);
}

