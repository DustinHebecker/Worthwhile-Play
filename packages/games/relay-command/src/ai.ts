import {
  archetypeOf,
  cellOf,
  computeNetwork,
  DEFAULT_DOCTRINE,
  dist2,
  frameIndex,
  inWeaponRange,
  isSpotted,
  passable,
  validateCommand,
  type Command,
  type Doctrine,
  type Entity,
  type Network,
  type Report,
  type Ruleset,
  type World
} from '@wp/strategy-engine';

/** Squared-distance slack within which a truck's current spot counts as good enough. */
const SPOT_TOLERANCE = 8;

/** Standing doctrine the opponent gives its fighters. */
const AI_DOCTRINE: Doctrine = { ...DEFAULT_DOCTRINE, retreatBelow: 25 };

/** How far ahead of its Command Post the opponent may set up its relay truck (cells per axis). */
const RELAY_FORWARD = 4;

/**
 * Scripted opponent (increment I3a). Deterministic. It receives only the world, never the
 * player's draft, so it cannot react to plans that are not yet locked. Like the player it may
 * only order units inside its command coverage and only as many as its order slots allow, and
 * like the player it knows only what its side has reported (fog, D7):
 * 1. a relay truck drives to the most forward cell it can reach while staying in contact, and sets up there;
 * 2. armed units engage the nearest spotted enemy they can actually hit (closest units first),
 *    or advance towards the nearest enemy position on record when none is spotted.
 */
export function planAi(world: World, ruleset: Ruleset, side: number): Command[] {
  const network = computeNetwork(world, ruleset, side);
  const inContact = (e: Entity) => !ruleset.commandNetwork || network.coverage[cellOf(world.map, e.x, e.y)] === 1;
  const budget = ruleset.commandNetwork ? network.slots : Number.POSITIVE_INFINITY;
  const known = knownEnemies(world, ruleset, side);
  const enemies = world.entities.filter((e) => e.side !== side && isSpotted(world, ruleset, side, e.id));
  const own = world.entities.filter((e) => e.side === side && inContact(e));
  const commands: Command[] = [];

  for (const truck of own) {
    if (!archetypeOf(ruleset, truck.kind)?.comms?.needsDeploy || truck.order.type === 'deploy') continue;
    if ((truck.deploy ?? 0) >= ruleset.ticksPerTurn) continue; // already set up: leave it standing
    const spot = relaySpot(world, ruleset, side, truck);
    if (!spot) continue;
    if (truck.x === spot.x && truck.y === spot.y) commands.push({ side, unit: truck.id, order: { type: 'deploy' } });
    else if (truck.order.type !== 'move' || truck.order.x !== spot.x || truck.order.y !== spot.y) {
      commands.push({ side, unit: truck.id, order: { type: 'move', x: spot.x, y: spot.y } });
    }
  }

  // Fighters below the retreat threshold are left to regroup and hold; ordering them back into
  // the fight would only spend a slot on an order the doctrine is meant to prevent.
  const retreating = (u: Entity) => u.hp * 100 < (archetypeOf(ruleset, u.kind)?.hp ?? 0) * AI_DOCTRINE.retreatBelow;
  const fighters = own
    .filter((u) => archetypeOf(ruleset, u.kind)?.weapon && (archetypeOf(ruleset, u.kind)?.speed ?? 0) > 0 && !retreating(u))
    .map((u) => ({ u, d: nearestDistance(u, known) }))
    .sort((a, b) => a.d - b.d || a.u.id - b.u.id);
  for (const { u: unit } of fighters) {
    const arch = archetypeOf(ruleset, unit.kind);
    if (!arch?.weapon) continue;
    const minRange = arch.weapon.minRange;
    const reachable = enemies.filter((e) => dist2(unit.x, unit.y, e.x, e.y) >= minRange * minRange);
    const target = nearest(unit, reachable.length > 0 ? reachable : enemies);
    if (!target) {
      // Nothing spotted: advance on the nearest enemy position on record (e.g. a structure).
      const goal = nearest(unit, known);
      if (goal && (unit.order.type !== 'move' || unit.order.x !== goal.x || unit.order.y !== goal.y) && unit.order.type !== 'attack') {
        commands.push({ side, unit: unit.id, order: { type: 'move', x: goal.x, y: goal.y }, doctrine: AI_DOCTRINE });
      }
      continue;
    }
    if (inWeaponRange(world, ruleset, unit, arch, target) && unit.order.type === 'hold') continue;
    if (unit.order.type === 'attack' && unit.order.target === target.id) continue;
    // Fighters pull back to regroup when badly damaged, also once out of contact.
    commands.push({ side, unit: unit.id, order: { type: 'attack', target: target.id }, doctrine: AI_DOCTRINE });
  }
  // Spend order slots only on orders the engine will accept.
  const networks: Network[] = [];
  networks[side] = network;
  return commands.filter((c) => validateCommand(world, ruleset, c, networks).ok).slice(0, budget);
}

/**
 * Where to set up a relay truck: the passable cell closest to the enemy Command Post that is
 * covered by the network *without* this truck (so the truck is still in contact when it
 * arrives and can be told to set up), at most RELAY_FORWARD cells from the own post along each
 * axis. Ties are broken in the side's own frame, so mirrored positions give mirrored choices.
 */
function relaySpot(world: World, ruleset: Ruleset, side: number, truck: Entity): { x: number; y: number } | undefined {
  const post = world.entities.find((e) => e.side === side && e.kind === 'command-post');
  const enemyPost = knownEnemies(world, ruleset, side).find((e) => e.kind === 'command-post');
  if (!post || !enemyPost) return undefined;
  const without = { ...world, entities: world.entities.filter((e) => e.id !== truck.id) };
  const coverage = computeNetwork(without, ruleset, side).coverage;
  const cells = world.map.w * world.map.h;
  let best: { x: number; y: number; d: number; f: number } | undefined;
  let here: number | undefined;
  for (let y = 0; y < world.map.h; y++) {
    for (let x = 0; x < world.map.w; x++) {
      const cell = cellOf(world.map, x, y);
      if (coverage[cell] !== 1 || Math.abs(x - post.x) > RELAY_FORWARD || Math.abs(y - post.y) > RELAY_FORWARD) continue;
      if (!passable(world.map, ruleset, x, y, 'ground')) continue;
      // Skip cells held by units that stay (structures, holding units); passing units move on.
      if (world.entities.some((e) => e.id !== truck.id && e.x === x && e.y === y && staysPut(ruleset, e))) continue;
      const d = dist2(x, y, enemyPost.x, enemyPost.y);
      const f = frameIndex(cell, side, cells);
      if (!best || d < best.d || (d === best.d && f < best.f)) best = { x, y, d, f };
      if (x === truck.x && y === truck.y) here = d;
    }
  }
  // A truck already standing on a valid spot nearly as good as the best sets up right there
  // instead of chasing a cell that another unit freed or took this turn.
  if (best && here !== undefined && truck.order.type !== 'move' && here <= best.d + SPOT_TOLERANCE) return { x: truck.x, y: truck.y };
  return best && { x: best.x, y: best.y };
}

const staysPut = (ruleset: Ruleset, e: Entity): boolean => {
  const arch = archetypeOf(ruleset, e.kind);
  return arch?.layer === 'ground' && (arch.speed === 0 || e.order.type === 'hold' || e.order.type === 'deploy');
};

/** Enemy positions the side knows: current sightings and last reports (all enemies without fog). */
const knownEnemies = (world: World, ruleset: Ruleset, side: number): readonly Pick<Report, 'id' | 'kind' | 'x' | 'y'>[] =>
  ruleset.fog ? (world.intel?.[side] ?? []).filter((r) => r.side !== side) : world.entities.filter((e) => e.side !== side);

type Positioned = Pick<Entity, 'id' | 'x' | 'y'>;

const nearestDistance = (unit: Entity, candidates: readonly Positioned[]): number =>
  candidates.reduce((best, e) => Math.min(best, dist2(unit.x, unit.y, e.x, e.y)), Number.POSITIVE_INFINITY);

function nearest<T extends Positioned>(unit: Entity, candidates: readonly T[]): T | undefined {
  let best: T | undefined;
  let bestD = Infinity;
  for (const e of candidates) {
    const d = dist2(unit.x, unit.y, e.x, e.y);
    if (d < bestD || (d === bestD && best !== undefined && e.id < best.id)) {
      best = e;
      bestD = d;
    }
  }
  return best;
}
