import { isRecord, normalizeSeed } from '@wp/game-core';
import { inBounds, passable } from './grid';
import { isCommandable, type Network } from './network';
import type { Archetype, Command, Entity, Order, Ruleset, Scenario, World } from './types';

/** Build the initial world for a scenario. Throws on invalid authored content (programmer error). */
export function createWorld(scenario: Scenario, ruleset: Ruleset): World {
  const { map } = scenario;
  if (!Number.isInteger(map.w) || !Number.isInteger(map.h) || map.w < 1 || map.h < 1 || map.terrain.length !== map.w * map.h) {
    throw new RangeError('Invalid map dimensions.');
  }
  for (const ch of map.terrain) if (!Object.hasOwn(ruleset.terrain, ch)) throw new RangeError(`Unknown terrain '${ch}'.`);
  const occupied = new Set<string>();
  const entities: Entity[] = scenario.entities.map((spec, i) => {
    const arch = archetypeOf(ruleset, spec.kind);
    if (!arch) throw new RangeError(`Unknown archetype '${spec.kind}'.`);
    if (!Number.isInteger(spec.side) || spec.side < 0 || spec.side >= scenario.sides) throw new RangeError('Invalid side.');
    if (!passable(map, ruleset, spec.x, spec.y, arch.layer)) throw new RangeError(`Cannot place ${spec.kind} at ${spec.x},${spec.y}.`);
    const key = `${arch.layer}:${spec.x},${spec.y}`;
    if (occupied.has(key)) throw new RangeError(`Cell ${spec.x},${spec.y} is occupied.`);
    occupied.add(key);
    return spawn(i + 1, spec.side, arch, spec.x, spec.y, spec.order ?? { type: 'hold' });
  });
  return {
    v: 1,
    ruleset: ruleset.id,
    tick: 0,
    turn: 0,
    rng: normalizeSeed(scenario.seed),
    map: { w: map.w, h: map.h, terrain: map.terrain },
    sides: scenario.sides,
    entities,
    projectiles: [],
    nextId: entities.length + 1
  };
}

export function spawn(id: number, side: number, arch: Archetype, x: number, y: number, order: Order = { type: 'hold' }): Entity {
  return { id, side, kind: arch.id, x, y, hp: arch.hp, mp: 0, cooldown: 0, order, status: [], beam: null };
}

/**
 * Own-property lookup of an archetype. Kinds can come from untrusted saves, so a plain index
 * (`ruleset.archetypes[kind]`) would also find prototype members such as `constructor`.
 */
export const archetypeOf = (ruleset: Ruleset, kind: string): Archetype | undefined =>
  Object.hasOwn(ruleset.archetypes, kind) ? ruleset.archetypes[kind] : undefined;

export const findEntity = (world: World, id: number): Entity | undefined => world.entities.find((e) => e.id === id);

export type CommandCheck =
  | { ok: true }
  | { ok: false; reason: 'unknown-unit' | 'not-yours' | 'out-of-contact' | 'immobile' | 'out-of-bounds' | 'impassable' | 'no-weapon' | 'bad-target' | 'bad-order' };

/**
 * Rule check for a single command against the current world. Never throws. Pass `networks`
 * (indexed by side) to judge coverage against a fixed snapshot, e.g. the start of a batch.
 */
export function validateCommand(world: World, ruleset: Ruleset, command: Command, networks?: readonly Network[]): CommandCheck {
  if (!isRecord(command) || !isRecord(command.order)) return { ok: false, reason: 'bad-order' };
  const unit = findEntity(world, command.unit);
  if (!unit) return { ok: false, reason: 'unknown-unit' };
  if (unit.side !== command.side) return { ok: false, reason: 'not-yours' };
  const arch = archetypeOf(ruleset, unit.kind);
  if (!arch) return { ok: false, reason: 'unknown-unit' };
  if (!isCommandable(world, ruleset, unit, networks?.[unit.side])) return { ok: false, reason: 'out-of-contact' };
  const order = command.order;
  switch (order.type) {
    case 'hold':
      return { ok: true };
    case 'move':
      if (arch.speed <= 0) return { ok: false, reason: 'immobile' };
      if (!Number.isInteger(order.x) || !Number.isInteger(order.y) || !inBounds(world.map, order.x, order.y)) {
        return { ok: false, reason: 'out-of-bounds' };
      }
      if (!passable(world.map, ruleset, order.x, order.y, arch.layer)) return { ok: false, reason: 'impassable' };
      return { ok: true };
    case 'deploy':
      return arch.comms?.needsDeploy ? { ok: true } : { ok: false, reason: 'bad-order' };
    case 'attack': {
      if (!arch.weapon) return { ok: false, reason: 'no-weapon' };
      const target = findEntity(world, order.target);
      if (!target || target.side === unit.side) return { ok: false, reason: 'bad-target' };
      return { ok: true };
    }
    default:
      return { ok: false, reason: 'bad-order' };
  }
}

/** Copy of a validated order without foreign fields (commands may come from untrusted saves). */
export function normalizeOrder(order: Order): Order {
  switch (order.type) {
    case 'move':
      return { type: 'move', x: order.x, y: order.y };
    case 'attack':
      return { type: 'attack', target: order.target };
    case 'deploy':
      return { type: 'deploy' };
    default:
      return { type: 'hold' };
  }
}
