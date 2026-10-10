import { computeNetwork, type Network } from './network';
import type { Entity, Report, Ruleset, World } from './types';

/**
 * What one side may base its decisions on (docs/design/strategy.md § 11): its own units as they
 * are, its own radio net as it works (enemy jamming included: a side feels it), and the enemy
 * only as its reports have it. An AI planner receives this, never the world, so it cannot read
 * anything the side does not know (property P8).
 */
export interface Observation {
  readonly side: number;
  readonly ruleset: string;
  /** The known world: same map, tick and turn; entities as the side knows them; only its own intel. */
  readonly world: World;
  /** Enemy ids shown at their last reported position (not seen now), with the report tick. */
  readonly ghosts: ReadonlyMap<number, number>;
  /** The side's own command network right now. */
  readonly network: Network;
}

/** Builds the observation of `side`. Without fog every enemy is known as it is (orders hidden). */
export function observe(world: World, ruleset: Ruleset, side: number): Observation {
  const ghosts = new Map<number, number>();
  const entities: Entity[] = [];
  const hide = (e: Entity): Entity => {
    // Enemies: position, health and visible effects only; their orders and set-up are unknown.
    const { id, side: s, kind, x, y, hp, status } = e;
    return { id, side: s, kind, x, y, hp, mp: 0, cooldown: 0, order: { type: 'hold' }, status: structuredClone(status), beam: null };
  };
  for (const e of world.entities) if (e.side === side) entities.push(structuredClone(e));
  if (!ruleset.fog) {
    for (const e of world.entities) if (e.side !== side) entities.push(hide(e));
  } else {
    const reports: readonly Report[] = world.intel?.[side] ?? [];
    for (const r of reports) {
      if (r.side === side) continue;
      const actual = world.entities.find((e) => e.id === r.id);
      if (r.live && actual) {
        entities.push(hide(actual));
        continue;
      }
      ghosts.set(r.id, r.tick);
      entities.push({ id: r.id, side: r.side, kind: r.kind, x: r.x, y: r.y, hp: r.hp, mp: 0, cooldown: 0, order: { type: 'hold' }, status: [], beam: null });
    }
  }
  entities.sort((a, b) => a.id - b.id);
  const intel = world.intel ? world.intel.map((list, s) => (s === side ? structuredClone(list) : [])) : undefined;
  const known: World = {
    v: 1,
    ruleset: world.ruleset,
    tick: world.tick,
    turn: world.turn,
    rng: world.rng,
    map: world.map,
    sides: world.sides,
    entities,
    projectiles: world.projectiles.filter((p) => p.side === side).map((p) => ({ ...p })),
    nextId: world.nextId,
    ...(intel && { intel })
  };
  return { side, ruleset: ruleset.id, world: known, ghosts, network: computeNetwork(world, ruleset, side) };
}
