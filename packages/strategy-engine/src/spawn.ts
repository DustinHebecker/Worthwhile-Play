import { isRecord } from '@wp/game-core';
import { inBounds, passable } from './grid';
import { isOneShotOrder, isValidOrder } from './serialize';
import { archetypeOf, normalizeOrder, spawn } from './world';
import type { Entity, Order, Ruleset, World } from './types';

/** One unit to set down with `spawnUnits`. */
export interface SpawnSpec {
  readonly side: number;
  readonly kind: string;
  readonly x: number;
  readonly y: number;
  /** Standing order (default `hold`). */
  readonly order?: Order;
}

/**
 * Why `spawnUnits` refused a spec: `bad-spec` (not a record), `bad-side` (not a playing side, or
 * one that is out), `unknown-kind`, `out-of-bounds`, `impassable` (for the kind's layer), `occupied`
 * (an entity of the same layer stands there, also one spawned earlier in the same call),
 * `bad-order` (not a valid standing order on this map).
 */
export type SpawnRefusal = 'bad-spec' | 'bad-side' | 'unknown-kind' | 'out-of-bounds' | 'impassable' | 'occupied' | 'bad-order';

export interface SpawnResult {
  world: World;
  /** Ids of the new entities, in spec order (taken from `world.nextId`). */
  spawned: number[];
  /** Specs that were refused (by index into `specs`), with the reason. */
  refused: { index: number; reason: SpawnRefusal }[];
}

/**
 * Sets units down between ticks (Tower Defense extension E0: waves). Each accepted spec gets the
 * next id from `world.nextId`, in spec order, full health (and a full shield) and its order; a
 * refused spec uses no id. With fog its own side learns of it (a report like a produced unit), so
 * the result stays a valid world. Pure (the input world is never mutated); never throws.
 */
export function spawnUnits(world: World, ruleset: Ruleset, specs: readonly SpawnSpec[]): SpawnResult {
  const w = structuredClone(world);
  const spawned: number[] = [];
  const refused: SpawnResult['refused'] = [];
  const taken = new Set(w.entities.map((e) => `${archetypeOf(ruleset, e.kind)?.layer}:${e.x},${e.y}`));
  specs.forEach((spec, index) => {
    const reason = refusal(w, ruleset, spec, taken);
    if (reason) {
      refused.push({ index, reason });
      return;
    }
    const arch = archetypeOf(ruleset, spec.kind)!;
    const unit: Entity = spawn(w.nextId++, spec.side, arch, spec.x, spec.y, normalizeOrder(spec.order ?? { type: 'hold' }));
    taken.add(`${arch.layer}:${spec.x},${spec.y}`);
    w.entities.push(unit);
    w.intel?.[spec.side]?.push({ id: unit.id, side: unit.side, kind: unit.kind, x: unit.x, y: unit.y, hp: unit.hp, tick: w.tick, live: false });
    spawned.push(unit.id);
  });
  return { world: w, spawned, refused };
}

function refusal(w: World, ruleset: Ruleset, spec: SpawnSpec, taken: ReadonlySet<string>): SpawnRefusal | undefined {
  if (!isRecord(spec)) return 'bad-spec';
  if (!Number.isInteger(spec.side) || spec.side < 0 || spec.side >= w.sides || w.out?.includes(spec.side)) return 'bad-side';
  const arch = typeof spec.kind === 'string' ? archetypeOf(ruleset, spec.kind) : undefined;
  if (!arch) return 'unknown-kind';
  if (!Number.isInteger(spec.x) || !Number.isInteger(spec.y) || !inBounds(w.map, spec.x, spec.y)) return 'out-of-bounds';
  if (!passable(w.map, ruleset, spec.x, spec.y, arch.layer)) return 'impassable';
  if (taken.has(`${arch.layer}:${spec.x},${spec.y}`)) return 'occupied';
  if (spec.order !== undefined && (!isValidOrder(spec.order, w.map.w, w.map.h) || isOneShotOrder(spec.order))) return 'bad-order';
  return undefined;
}

/**
 * Removes entities between ticks (Tower Defense extension E0: leaks). Unknown ids are ignored. A
 * carrier takes its drone along; a removed drone counts as aboard its carrier again. With fog,
 * every side drops its reports of the removed entities (as for an eliminated side's pieces), so
 * the result stays a valid world; the caller decides what the removal means. Projectiles in flight
 * stay (they belong to their shooter's kind, not to an entity). Pure: the input is never mutated.
 */
export function removeEntities(world: World, ids: readonly number[]): World {
  const w = structuredClone(world);
  const gone = new Set(ids);
  for (const e of w.entities) if (gone.has(e.id) && e.drone !== undefined) gone.add(e.drone);
  w.entities = w.entities.filter((e) => !gone.has(e.id));
  for (const e of w.entities) if (e.drone !== undefined && gone.has(e.drone)) delete e.drone;
  if (w.intel) w.intel = w.intel.map((list) => list.filter((r) => !gone.has(r.id)));
  return w;
}
