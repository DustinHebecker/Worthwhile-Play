import { cellOf, dirsFor, inBounds, passable } from './grid';
import { computeNetwork, isActiveNode, type Network } from './network';
import type { Archetype, Deposit, Entity, GameMap, Ruleset, World } from './types';
import { archetypeOf } from './world';

/**
 * Economy (docs/design/strategy.md § 8, D8): one resource, Supply, per side. Income arrives on
 * the last tick of a turn from connected posts and from Extractors standing on deposits inside
 * the own coverage; deposits are finite. Yards produce units into an adjacent free cell, command
 * sources place structure sites that work once built. Everything is integer and deterministic.
 */

/** Whether `e` is finished and able to work (not a site under construction, not disabled). */
export const isReady = (e: Entity): boolean => (e.build ?? 0) === 0 && !e.status.some((s) => s.kind === 'disabled' && s.ticks > 0);

export const depositAt = (map: GameMap, x: number, y: number): Deposit | undefined => map.deposits?.find((d) => d.x === x && d.y === y);

/** The Supply `e` would yield this turn (0 when not connected, not ready, or on an exhausted deposit). */
export function incomeOf(world: World, ruleset: Ruleset, e: Entity, network: Network): number {
  const arch = archetypeOf(ruleset, e.kind);
  if (!arch || arch.income <= 0 || !isReady(e)) return 0;
  // Posts and relays yield when they are part of the network; an Extractor when it stands in coverage.
  const connected = arch.comms ? network.nodes.includes(e.id) && isActiveNode(ruleset, e) : network.coverage[cellOf(world.map, e.x, e.y)] === 1;
  if (!connected) return 0;
  if (!arch.extractor) return arch.income;
  const deposit = depositAt(world.map, e.x, e.y);
  return deposit ? Math.min(arch.income, deposit.left) : 0;
}

/** Supply `side` will receive at the end of this turn from the world as it is now. */
export function incomeOfSide(world: World, ruleset: Ruleset, side: number, network = computeNetwork(world, ruleset, side)): number {
  let total = 0;
  for (const e of world.entities) if (e.side === side) total += incomeOf(world, ruleset, e, network);
  return total;
}

/** Offsets two cells out, in side 0's frame (side 1 uses them point-mirrored). */
const RING2: readonly (readonly [number, number])[] = (() => {
  const out: [number, number][] = [];
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === 2) out.push([dx, dy]);
  return out;
})();

/**
 * The free cell near `yard` where a produced unit of `arch` appears: the first free passable
 * neighbour, else a cell two out, in the side's own frame (mirrored sides choose mirrored cells), or `undefined`.
 */
export function spawnCell(world: World, ruleset: Ruleset, yard: Entity, arch: Archetype): { x: number; y: number } | undefined {
  const taken = new Set(world.entities.filter((e) => archetypeOf(ruleset, e.kind)?.layer === arch.layer).map((e) => cellOf(world.map, e.x, e.y)));
  // Neighbours first, then the ring two cells out (a yard ringed by its own units still delivers).
  const ring2 = RING2.map(([dx, dy]) => (yard.side === 1 ? ([-dx, -dy] as const) : ([dx, dy] as const)));
  // A cell two out only when a passable neighbour of the yard leads to it (never across a barrier).
  const bridged = (x: number, y: number): boolean =>
    dirsFor(yard.side).some(([dx, dy]) => {
      const nx = yard.x + dx;
      const ny = yard.y + dy;
      return inBounds(world.map, nx, ny) && passable(world.map, ruleset, nx, ny, arch.layer) && Math.max(Math.abs(nx - x), Math.abs(ny - y)) <= 1;
    });
  for (const [dx, dy] of [...dirsFor(yard.side), ...ring2]) {
    const x = yard.x + dx;
    const y = yard.y + dy;
    if (!inBounds(world.map, x, y) || !passable(world.map, ruleset, x, y, arch.layer) || taken.has(cellOf(world.map, x, y))) continue;
    if (Math.max(Math.abs(dx), Math.abs(dy)) === 2 && !bridged(x, y)) continue;
    return { x, y };
  }
  return undefined;
}
