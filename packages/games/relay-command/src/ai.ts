import { dist2, inWeaponRange, type Command, type Entity, type Ruleset, type World } from '@wp/strategy-engine';

/**
 * Scripted opponent for the first playable version (increment I2): every armed mobile unit
 * engages the nearest enemy it can actually hit (ballistic weapons skip targets inside their
 * minimum range). Deterministic. It receives only the world, never the player's draft, so the
 * opponent cannot react to plans that are not yet locked.
 */
export function planAi(world: World, ruleset: Ruleset, side: number): Command[] {
  const enemies = world.entities.filter((e) => e.side !== side);
  const commands: Command[] = [];
  for (const unit of world.entities) {
    if (unit.side !== side) continue;
    const arch = ruleset.archetypes[unit.kind];
    if (!arch?.weapon || arch.speed === 0) continue;
    const minRange = arch.weapon.minRange;
    const reachable = enemies.filter((e) => dist2(unit.x, unit.y, e.x, e.y) >= minRange * minRange);
    const target = nearest(unit, reachable.length > 0 ? reachable : enemies);
    if (!target) continue;
    if (inWeaponRange(world, ruleset, unit, arch, target) && unit.order.type === 'hold') continue;
    if (unit.order.type === 'attack' && unit.order.target === target.id) continue;
    commands.push({ side, unit: unit.id, order: { type: 'attack', target: target.id } });
  }
  return commands;
}

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
