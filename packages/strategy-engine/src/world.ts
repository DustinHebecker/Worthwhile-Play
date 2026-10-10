import { isRecord, normalizeSeed } from '@wp/game-core';
import { cellOf, inBounds, passable } from './grid';
import { depositAt, isReady } from './economy';
import { MAX_QUEUE } from './types';
import { computeNetwork, isCommandable, type Network } from './network';
import { initialIntel, isSpotted, observedCells } from './vision';
import { LOST_CONTACT, RETREAT_THRESHOLDS, TARGET_PRIORITIES, type Archetype, type Command, type Doctrine, type Entity, type Order, type Ruleset, type Scenario, type World } from './types';

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
  const deposits = (map.deposits ?? []).map((d) => ({ x: d.x, y: d.y, left: d.left }));
  for (const d of deposits) {
    if (!inBounds(map, d.x, d.y) || !passable(map, ruleset, d.x, d.y, 'ground') || !Number.isInteger(d.left) || d.left < 0) throw new RangeError(`Invalid deposit at ${d.x},${d.y}.`);
  }
  deposits.sort((a, b) => cellOf(map, a.x, a.y) - cellOf(map, b.x, b.y));
  for (let i = 1; i < deposits.length; i++) if (cellOf(map, deposits[i]!.x, deposits[i]!.y) === cellOf(map, deposits[i - 1]!.x, deposits[i - 1]!.y)) throw new RangeError('Duplicate deposit.');
  const world: World = {
    v: 1,
    ruleset: ruleset.id,
    tick: 0,
    turn: 0,
    rng: normalizeSeed(scenario.seed),
    map: { w: map.w, h: map.h, terrain: map.terrain, ...(deposits.length > 0 && { deposits }) },
    sides: scenario.sides,
    entities,
    projectiles: [],
    nextId: entities.length + 1
  };
  if (ruleset.economy) {
    const supply = scenario.supply ?? Array.from({ length: scenario.sides }, () => ruleset.startSupply);
    if (supply.length !== scenario.sides || supply.some((v) => !Number.isInteger(v) || v < 0)) throw new RangeError('Invalid starting supply.');
    world.supply = [...supply];
  }
  if (ruleset.fog) world.intel = initialIntel(world, ruleset);
  return world;
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

/** Whether the archetype only works after a full turn of deploying in place (relays, posts, jammers). */
export const needsDeploy = (arch: Archetype | undefined): boolean => !!(arch?.comms?.needsDeploy || arch?.ew?.needsDeploy);

/** Structural check of a doctrine. Never throws. */
export const isValidDoctrine = (v: unknown): v is Doctrine =>
  isRecord(v) &&
  (RETREAT_THRESHOLDS as readonly unknown[]).includes(v.retreatBelow) &&
  (TARGET_PRIORITIES as readonly unknown[]).includes(v.priority) &&
  typeof v.seekCover === 'boolean' &&
  typeof v.holdFire === 'boolean' &&
  (LOST_CONTACT as readonly unknown[]).includes(v.lostContact);

/** Copy of a validated doctrine without foreign fields. */
export const normalizeDoctrine = (d: Doctrine): Doctrine => ({
  retreatBelow: d.retreatBelow,
  priority: d.priority,
  seekCover: d.seekCover,
  holdFire: d.holdFire,
  lostContact: d.lostContact
});

export const findEntity = (world: World, id: number): Entity | undefined => world.entities.find((e) => e.id === id);

export type CommandCheck =
  | { ok: true }
  | { ok: false; reason: CommandRefusal };

/**
 * Why a command is refused. Economy (I6a): `no-supply` (cannot pay), `cannot-produce` (not a
 * yard for that kind, or the yard is still a site), `queue-full`, `cannot-build` (not a finished
 * command source, or the kind is no buildable structure), `not-buildable` (cell not free,
 * passable, inside own coverage, or an Extractor off a deposit / another structure on one).
 */
export type CommandRefusal =
  | 'unknown-unit'
  | 'not-yours'
  | 'out-of-contact'
  | 'immobile'
  | 'out-of-bounds'
  | 'impassable'
  | 'no-weapon'
  | 'bad-target'
  | 'not-visible'
  | 'bad-order'
  | 'no-supply'
  | 'cannot-produce'
  | 'queue-full'
  | 'cannot-build'
  | 'not-buildable';

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
  if (command.doctrine !== undefined && !isValidDoctrine(command.doctrine)) return { ok: false, reason: 'bad-order' };
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
      return needsDeploy(arch) ? { ok: true } : { ok: false, reason: 'bad-order' };
    case 'regroup':
      return arch.speed > 0 ? { ok: true } : { ok: false, reason: 'immobile' };
    case 'patrol':
      if (arch.speed <= 0) return { ok: false, reason: 'immobile' };
      for (const [x, y] of [[order.x, order.y], [order.rx, order.ry]] as const) {
        if (!Number.isInteger(x) || !Number.isInteger(y) || !inBounds(world.map, x, y)) return { ok: false, reason: 'out-of-bounds' };
        if (!passable(world.map, ruleset, x, y, arch.layer)) return { ok: false, reason: 'impassable' };
      }
      return { ok: true };
    case 'escort': {
      if (arch.speed <= 0) return { ok: false, reason: 'immobile' };
      const target = findEntity(world, order.target);
      if (!target || target.side !== unit.side || target.id === unit.id) return { ok: false, reason: 'bad-target' };
      return { ok: true };
    }
    case 'attack': {
      if (!arch.weapon) return { ok: false, reason: 'no-weapon' };
      const target = findEntity(world, order.target);
      // Fog (D7): only a target the side has spotted can be ordered. Anything else, also an id
      // that no longer exists, is 'not-visible', so the answer reveals nothing the side does not know.
      if (ruleset.fog && target?.side !== unit.side && !isSpotted(world, ruleset, unit.side, order.target)) return { ok: false, reason: 'not-visible' };
      if (!target || target.side === unit.side) return { ok: false, reason: 'bad-target' };
      const armor = archetypeOf(ruleset, target.kind)?.armor;
      if (!armor || arch.weapon.vs[armor] <= 0) return { ok: false, reason: 'bad-target' };
      return { ok: true };
    }
    case 'produce': {
      if (!ruleset.economy || typeof order.kind !== 'string') return { ok: false, reason: 'bad-order' };
      const product = archetypeOf(ruleset, order.kind);
      if (!product || product.buildTurns <= 0 || !arch.production?.includes(order.kind) || !isReady(unit)) return { ok: false, reason: 'cannot-produce' };
      if ((unit.queue?.length ?? 0) >= MAX_QUEUE) return { ok: false, reason: 'queue-full' };
      if ((world.supply?.[unit.side] ?? 0) < product.cost) return { ok: false, reason: 'no-supply' };
      return { ok: true };
    }
    case 'build': {
      if (!ruleset.economy || typeof order.kind !== 'string') return { ok: false, reason: 'bad-order' };
      const structure = archetypeOf(ruleset, order.kind);
      // A source places structures once it works: a Field Post only when set up.
      const working = !arch.comms?.needsDeploy || (unit.deploy ?? 0) >= ruleset.ticksPerTurn;
      if (arch.comms?.role !== 'source' || !working || !isReady(unit) || !structure || structure.speed !== 0 || structure.buildTurns <= 0) return { ok: false, reason: 'cannot-build' };
      if (!Number.isInteger(order.x) || !Number.isInteger(order.y) || !inBounds(world.map, order.x, order.y)) return { ok: false, reason: 'out-of-bounds' };
      if (!passable(world.map, ruleset, order.x, order.y, structure.layer)) return { ok: false, reason: 'impassable' };
      const cell = cellOf(world.map, order.x, order.y);
      // Judged by what the side knows (fog, D7): its own units, enemies it sees, and enemy
      // structures it knows of. A hidden unit on the cell is found only when the order is carried
      // out (the site is then refused unpaid), so a refusal here reveals nothing.
      const taken = knownAt(world, ruleset, unit.side, order.x, order.y).some((e) => archetypeOf(ruleset, e.kind)?.layer === structure.layer);
      const coverage = (networks?.[unit.side] ?? computeNetwork(world, ruleset, unit.side)).coverage;
      // Deposits are for Extractors, an Extractor only for a deposit that still yields (as far as
      // the side knows: an unobserved deposit's remainder is unknown, `UNKNOWN_LEFT` in observations).
      const deposit = depositAt(world.map, order.x, order.y);
      const observed = ruleset.fog ? observedCells(world, ruleset, unit.side, networks?.[unit.side])[cell] === 1 : true;
      const fits = structure.extractor ? deposit !== undefined && (deposit.left > 0 || !observed) : deposit === undefined;
      if (taken || coverage[cell] !== 1 || !fits) return { ok: false, reason: 'not-buildable' };
      if ((world.supply?.[unit.side] ?? 0) < structure.cost) return { ok: false, reason: 'no-supply' };
      return { ok: true };
    }
    default:
      return { ok: false, reason: 'bad-order' };
  }
}

/**
 * Entities on (x, y) as `side` knows them: own units always; with fog, other sides' units only
 * while they are spotted, and their structures from any report (structures do not move).
 */
export function knownAt(world: World, ruleset: Ruleset, side: number, x: number, y: number): Pick<Entity, 'id' | 'side' | 'kind' | 'x' | 'y'>[] {
  if (!ruleset.fog) return world.entities.filter((e) => e.x === x && e.y === y);
  // Other sides only from the side's reports (a structure destroyed unseen still stands as a ghost).
  const own = world.entities.filter((e) => e.side === side && e.x === x && e.y === y);
  const reported = (world.intel?.[side] ?? []).filter((r) => r.side !== side && r.x === x && r.y === y && (r.live || (archetypeOf(ruleset, r.kind)?.speed ?? 1) === 0));
  return [...own, ...reported];
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
    case 'regroup':
      return { type: 'regroup' };
    case 'escort':
      return { type: 'escort', target: order.target };
    case 'patrol':
      return { type: 'patrol', x: order.x, y: order.y, rx: order.rx, ry: order.ry };
    case 'produce':
      return { type: 'produce', kind: order.kind };
    case 'build':
      return { type: 'build', kind: order.kind, x: order.x, y: order.y };
    default:
      return { type: 'hold' };
  }
}
