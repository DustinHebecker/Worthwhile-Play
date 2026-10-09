import {
  archetypeOf,
  cellOf,
  computeNetwork,
  dist2,
  inWeaponRange,
  passable,
  type Command,
  type Entity,
  type Ruleset,
  type World
} from '@wp/strategy-engine';

/** How far ahead of its Command Post the opponent sets up its relay truck (cells per axis). */
const RELAY_FORWARD = 4;

/**
 * Scripted opponent (increment I3a). Deterministic. It receives only the world, never the
 * player's draft, so it cannot react to plans that are not yet locked. Like the player it may
 * only order units inside its command coverage and only as many as its order slots allow:
 * 1. a relay truck drives a few cells towards the enemy and sets up there;
 * 2. armed units engage the nearest enemy they can actually hit (closest units first).
 */
export function planAi(world: World, ruleset: Ruleset, side: number): Command[] {
  const network = computeNetwork(world, ruleset, side);
  const inContact = (e: Entity) => !ruleset.commandNetwork || network.coverage[cellOf(world.map, e.x, e.y)] === 1;
  const budget = ruleset.commandNetwork ? network.slots : Number.POSITIVE_INFINITY;
  const enemies = world.entities.filter((e) => e.side !== side);
  const own = world.entities.filter((e) => e.side === side && inContact(e));
  const commands: Command[] = [];

  for (const truck of own) {
    if (!archetypeOf(ruleset, truck.kind)?.comms?.needsDeploy || truck.order.type === 'deploy') continue;
    const spot = relaySpot(world, ruleset, side);
    if (!spot) continue;
    if (truck.x === spot.x && truck.y === spot.y) commands.push({ side, unit: truck.id, order: { type: 'deploy' } });
    else if (truck.order.type !== 'move' || truck.order.x !== spot.x || truck.order.y !== spot.y) {
      commands.push({ side, unit: truck.id, order: { type: 'move', x: spot.x, y: spot.y } });
    }
  }

  const fighters = own
    .filter((u) => archetypeOf(ruleset, u.kind)?.weapon && (archetypeOf(ruleset, u.kind)?.speed ?? 0) > 0)
    .map((u) => ({ u, d: nearestDistance(u, enemies) }))
    .sort((a, b) => a.d - b.d || a.u.id - b.u.id);
  for (const { u: unit } of fighters) {
    const arch = archetypeOf(ruleset, unit.kind);
    if (!arch?.weapon) continue;
    const minRange = arch.weapon.minRange;
    const reachable = enemies.filter((e) => dist2(unit.x, unit.y, e.x, e.y) >= minRange * minRange);
    const target = nearest(unit, reachable.length > 0 ? reachable : enemies);
    if (!target) continue;
    if (inWeaponRange(world, ruleset, unit, arch, target) && unit.order.type === 'hold') continue;
    if (unit.order.type === 'attack' && unit.order.target === target.id) continue;
    commands.push({ side, unit: unit.id, order: { type: 'attack', target: target.id } });
  }
  return commands.slice(0, budget);
}

/** A passable cell RELAY_FORWARD steps from the own Command Post towards the enemy's. */
function relaySpot(world: World, ruleset: Ruleset, side: number): { x: number; y: number } | undefined {
  const post = world.entities.find((e) => e.side === side && e.kind === 'command-post');
  const enemyPost = world.entities.find((e) => e.side !== side && e.kind === 'command-post');
  if (!post || !enemyPost) return undefined;
  const tx = post.x + Math.sign(enemyPost.x - post.x) * RELAY_FORWARD;
  const ty = post.y + Math.sign(enemyPost.y - post.y) * RELAY_FORWARD;
  // Nearest passable cell without a structure around the target, searched ring by ring in the
  // side's own frame (side 1 mirrored), so that mirrored positions give mirrored choices.
  const s = side === 1 ? -1 : 1;
  for (let r = 0; r <= 3; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = tx + s * dx;
        const y = ty + s * dy;
        const blocked = world.entities.some((e) => e.x === x && e.y === y && (archetypeOf(ruleset, e.kind)?.speed ?? 0) === 0);
        if (passable(world.map, ruleset, x, y, 'ground') && !blocked) return { x, y };
      }
    }
  }
  return undefined;
}

const nearestDistance = (unit: Entity, candidates: readonly Entity[]): number =>
  candidates.reduce((best, e) => Math.min(best, dist2(unit.x, unit.y, e.x, e.y)), Number.POSITIVE_INFINITY);

function nearest(unit: Entity, candidates: readonly Entity[]): Entity | undefined {
  let best: Entity | undefined;
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
