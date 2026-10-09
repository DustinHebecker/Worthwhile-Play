import { cellOf, dist2, terrainAt } from './grid';
import type { Entity, Ruleset, World } from './types';
import { archetypeOf } from './world';

/** A side's command network at one moment (derived data, never serialized). */
export interface Network {
  /** Ids of active nodes connected to a source, ascending. */
  readonly nodes: readonly number[];
  /** 1 for every cell inside the coverage of a connected node (row-major). */
  readonly coverage: Uint8Array;
  /** Orders per turn: the sum of the connected sources' order slots. */
  readonly slots: number;
}

const isDisabled = (e: Entity): boolean => e.status.some((s) => s.kind === 'disabled' && s.ticks > 0);

/** Whether `e` currently works as a network node (has comms, is not disabled, is deployed if needed). */
export function isActiveNode(ruleset: Ruleset, e: Entity): boolean {
  const comms = archetypeOf(ruleset, e.kind)?.comms;
  if (!comms || isDisabled(e)) return false;
  return !comms.needsDeploy || (e.deploy ?? 0) >= ruleset.ticksPerTurn;
}

/** Whether `e` currently works as an EW unit (has an EW role, is not disabled, is set up if needed). */
export function isActiveEw(ruleset: Ruleset, e: Entity): boolean {
  const ew = archetypeOf(ruleset, e.kind)?.ew;
  if (!ew || isDisabled(e)) return false;
  return !ew.needsDeploy || (e.deploy ?? 0) >= ruleset.ticksPerTurn;
}

/** Emitters: working network nodes and working jammers (what a Tracer can locate). */
export const isEmitter = (ruleset: Ruleset, e: Entity): boolean =>
  isActiveNode(ruleset, e) || (archetypeOf(ruleset, e.kind)?.ew?.role === 'jammer' && isActiveEw(ruleset, e));

/**
 * Cells where `side`'s network is jammed (1): within the radius of an active enemy jammer and
 * not within the burn-through radius of one of the side's own active tracers.
 */
export function jammedCells(world: World, ruleset: Ruleset, side: number): Uint8Array {
  const { w, h } = world.map;
  const jam = new Uint8Array(w * h);
  const disc = (e: Entity, r: number, value: number, into: Uint8Array): void => {
    for (let y = Math.max(0, e.y - r); y <= Math.min(h - 1, e.y + r); y++) {
      for (let x = Math.max(0, e.x - r); x <= Math.min(w - 1, e.x + r); x++) {
        if (dist2(e.x, e.y, x, y) <= r * r) into[cellOf(world.map, x, y)] = value;
      }
    }
  };
  let any = false;
  for (const e of world.entities) {
    const ew = archetypeOf(ruleset, e.kind)?.ew;
    if (e.side !== side && ew?.role === 'jammer' && isActiveEw(ruleset, e)) {
      disc(e, ew.radius, 1, jam);
      any = true;
    }
  }
  if (!any) return jam;
  for (const e of world.entities) {
    const ew = archetypeOf(ruleset, e.kind)?.ew;
    if (e.side === side && ew?.role === 'tracer' && ew.burnThrough > 0 && isActiveEw(ruleset, e)) disc(e, ew.burnThrough, 0, jam);
  }
  return jam;
}

/** Node radius; static relays on terrain with a range bonus (hills) reach further. */
export function nodeRadius(world: World, ruleset: Ruleset, e: Entity): number {
  const arch = archetypeOf(ruleset, e.kind);
  const comms = arch?.comms;
  if (!arch || !comms) return 0;
  // Only static relays (masts) profit from height; command posts keep their fixed radius.
  const onHill = comms.role === 'relay' && arch.speed === 0 && terrainAt(world.map, ruleset, e.x, e.y).rangeBonus > 0;
  return comms.radius + (onHill ? ruleset.relayHillBonus : 0);
}

/**
 * Connected set by breadth-first search from all sources over links (distance ≤ the smaller
 * radius of both ends), then the union of the connected nodes' coverage discs. Nodes on jammed
 * cells take no part and jammed cells are never covered (§ 6). Iteration is in id order, so the
 * result does not depend on entity order.
 */
export function computeNetwork(world: World, ruleset: Ruleset, side: number): Network {
  // Electronic warfare: jammed nodes cannot relay, and jammed cells are not covered.
  const jam = jammedCells(world, ruleset, side);
  const nodes = world.entities
    .filter((e) => e.side === side && isActiveNode(ruleset, e) && jam[cellOf(world.map, e.x, e.y)] !== 1)
    .sort((a, b) => a.id - b.id);
  const radius = new Map(nodes.map((e) => [e.id, nodeRadius(world, ruleset, e)]));
  const connected = new Set<number>();
  const queue = nodes.filter((e) => archetypeOf(ruleset, e.kind)?.comms?.role === 'source');
  for (const e of queue) connected.add(e.id);
  for (let i = 0; i < queue.length; i++) {
    const a = queue[i] as Entity;
    for (const b of nodes) {
      if (connected.has(b.id)) continue;
      const r = Math.min(radius.get(a.id) ?? 0, radius.get(b.id) ?? 0);
      if (dist2(a.x, a.y, b.x, b.y) <= r * r) {
        connected.add(b.id);
        queue.push(b);
      }
    }
  }
  const { w, h } = world.map;
  const coverage = new Uint8Array(w * h);
  let slots = 0;
  for (const e of nodes) {
    if (!connected.has(e.id)) continue;
    slots += archetypeOf(ruleset, e.kind)?.comms?.orderSlots ?? 0;
    const r = radius.get(e.id) ?? 0;
    for (let y = Math.max(0, e.y - r); y <= Math.min(h - 1, e.y + r); y++) {
      for (let x = Math.max(0, e.x - r); x <= Math.min(w - 1, e.x + r); x++) {
        const c = cellOf(world.map, x, y);
        if (dist2(e.x, e.y, x, y) <= r * r && jam[c] !== 1) coverage[c] = 1;
      }
    }
  }
  return { nodes: [...connected].sort((a, b) => a - b), coverage, slots };
}

/** Whether a unit can receive orders now (always true when the ruleset has no command network). */
export function isCommandable(world: World, ruleset: Ruleset, unit: Entity, network?: Network): boolean {
  if (!ruleset.commandNetwork) return true;
  const net = network ?? computeNetwork(world, ruleset, unit.side);
  return net.coverage[cellOf(world.map, unit.x, unit.y)] === 1;
}
