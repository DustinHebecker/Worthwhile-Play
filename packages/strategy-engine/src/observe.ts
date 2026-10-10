import { cellOf, dist2 } from './grid';
import { computeNetwork, jammedCells, nodeRadius, type Network } from './network';
import type { Entity, Report, Ruleset, World } from './types';
import { observedCells } from './vision';

/** `Deposit.left` in an observation for a deposit no reporting unit observes now. */
export const UNKNOWN_LEFT = -1;

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
  /**
   * Cells where the side's own radio is jammed (1), limited to the reach of its connected
   * nodes: a side feels the silence where it expects contact, not the jammer's whole disc.
   */
  readonly jammed: Uint8Array;
}

/** Builds the observation of `side`. Without fog every enemy is known as it is (orders hidden). */
export function observe(world: World, ruleset: Ruleset, side: number): Observation {
  const ghosts = new Map<number, number>();
  const entities: Entity[] = [];
  const hide = (e: Entity): Entity => {
    // Enemies: position, health and visible effects only; their orders and set-up are unknown.
    const { id, side: s, kind, x, y, hp, status, build } = e;
    // A site under construction looks like one; the queue inside a yard does not show.
    return { id, side: s, kind, x, y, hp, mp: 0, cooldown: 0, order: { type: 'hold' }, status: structuredClone(status), beam: null, ...(build !== undefined && { build }) };
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
    // Only ids the side knows: the true counter would reveal every unseen enemy shot.
    nextId: Math.max(0, ...entities.map((e) => e.id), ...world.projectiles.filter((p) => p.side === side).map((p) => p.id)) + 1,
    ...(intel && { intel })
  };
  const network = computeNetwork(world, ruleset, side);
  // Economy: only the own Supply is known; deposits are map knowledge, but how much is left in
  // one is known only while a reporting unit observes it (UNKNOWN_LEFT otherwise).
  if (world.supply) known.supply = world.supply.map((v, s) => (s === side ? v : 0));
  if (world.map.deposits) {
    const observed = ruleset.fog ? observedCells(world, ruleset, side, network) : undefined;
    known.map = { ...world.map, deposits: world.map.deposits.map((d) => ({ x: d.x, y: d.y, left: !observed || observed[cellOf(world.map, d.x, d.y)] === 1 ? d.left : UNKNOWN_LEFT })) };
  }
  return { side, ruleset: ruleset.id, world: known, ghosts, network, jammed: feltJamming(world, ruleset, side, network) };
}

/** Jammed cells within the reach of the side's connected nodes (what the side can tell apart from plain lack of coverage). */
function feltJamming(world: World, ruleset: Ruleset, side: number, network: Network): Uint8Array {
  const { w, h } = world.map;
  const jam = jammedCells(world, ruleset, side);
  const felt = new Uint8Array(w * h);
  if (jam.every((c) => c === 0)) return felt;
  for (const id of network.nodes) {
    const node = world.entities.find((e) => e.id === id);
    if (!node) continue;
    const r = nodeRadius(world, ruleset, node);
    for (let y = Math.max(0, node.y - r); y <= Math.min(h - 1, node.y + r); y++) {
      for (let x = Math.max(0, node.x - r); x <= Math.min(w - 1, node.x + r); x++) {
        const c = cellOf(world.map, x, y);
        if (dist2(node.x, node.y, x, y) <= r * r && jam[c] === 1) felt[c] = 1;
      }
    }
  }
  return felt;
}
