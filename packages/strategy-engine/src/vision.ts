import { cellOf, dist2 } from './grid';
import { computeNetwork, isActiveEw, isEmitter, type Network } from './network';
import type { Entity, Report, Ruleset, SimEvent, World } from './types';
import { archetypeOf } from './world';

/**
 * Information model D7 (docs/design/strategy.md § 5.3). Units still see when out of contact,
 * but only units inside the own command coverage report what they see (every unit when the
 * ruleset has no command network). A side therefore knows:
 * - entities its reporting units observe now (`live` reports, exact and current);
 * - enemies it saw earlier, as ghosts at their last reported position, until a reporting unit
 *   looks at that cell again and finds it empty;
 * - its own out-of-contact units, as ghosts at their last reported position, until they report
 *   again or their destruction is observed.
 */

/** Units of `side` whose sightings reach the side. */
export function reportingUnits(world: World, ruleset: Ruleset, side: number, network?: Network): Entity[] {
  const own = world.entities.filter((e) => e.side === side);
  if (!ruleset.commandNetwork) return own;
  const coverage = (network ?? computeNetwork(world, ruleset, side)).coverage;
  return own.filter((e) => coverage[cellOf(world.map, e.x, e.y)] === 1);
}

/** Cells `side` observes now: the union of its reporting units' vision discs (row-major, 1 = observed). */
export function observedCells(world: World, ruleset: Ruleset, side: number, network?: Network): Uint8Array {
  const { w, h } = world.map;
  const observed = new Uint8Array(w * h);
  for (const e of reportingUnits(world, ruleset, side, network)) {
    const r = archetypeOf(ruleset, e.kind)?.vision ?? 0;
    for (let y = Math.max(0, e.y - r); y <= Math.min(h - 1, e.y + r); y++) {
      for (let x = Math.max(0, e.x - r); x <= Math.min(w - 1, e.x + r); x++) {
        if (dist2(e.x, e.y, x, y) <= r * r) observed[cellOf(world.map, x, y)] = 1;
      }
    }
  }
  return observed;
}

/** Distance within which a working jammer gives itself away to any reporting enemy unit (§ 6). */
export const EMITTER_EXPOSURE = 8;

/**
 * Enemy emitters `side` locates without seeing them (§ 6): working jammers within
 * EMITTER_EXPOSURE of one of its reporting units, and every emitter (working node or jammer)
 * within the radius of one of its reporting, working Tracers.
 */
export function revealedEmitters(world: World, ruleset: Ruleset, side: number, network?: Network): Set<number> {
  const reporting = reportingUnits(world, ruleset, side, network);
  const tracers = reporting.filter((e) => archetypeOf(ruleset, e.kind)?.ew?.role === 'tracer' && isActiveEw(ruleset, e));
  const near = (list: readonly Entity[], e: Entity, r: (u: Entity) => number): boolean => list.some((u) => dist2(u.x, u.y, e.x, e.y) <= r(u) ** 2);
  const out = new Set<number>();
  for (const e of world.entities) {
    if (e.side === side || !isEmitter(ruleset, e)) continue;
    const jammer = archetypeOf(ruleset, e.kind)?.ew?.role === 'jammer';
    if ((jammer && near(reporting, e, () => EMITTER_EXPOSURE)) || near(tracers, e, (u) => archetypeOf(ruleset, u.kind)?.ew?.radius ?? 0)) out.add(e.id);
  }
  return out;
}

const reportOf = (e: Entity, tick: number): Report => ({ id: e.id, side: e.side, kind: e.kind, x: e.x, y: e.y, hp: e.hp, tick, live: true });

/**
 * One side's reports after a vision update. `previous` are its reports before, `gone` the
 * entities removed since (their destruction is known only where it was observed).
 */
function updatedReports(
  world: World,
  side: number,
  observed: Uint8Array,
  previous: readonly Report[],
  gone: readonly Entity[],
  knownLoss: (e: Entity) => boolean = () => false,
  revealed: ReadonlySet<number> = new Set()
): Report[] {
  const seen = (x: number, y: number): boolean => observed[cellOf(world.map, x, y)] === 1;
  const next = new Map<number, Report>();
  for (const e of world.entities) if (seen(e.x, e.y) || revealed.has(e.id)) next.set(e.id, reportOf(e, world.tick));
  const goneAt = new Map(gone.map((e) => [e.id, e]));
  for (const r of previous) {
    if (next.has(r.id)) continue;
    const dead = goneAt.get(r.id);
    if (dead && (seen(dead.x, dead.y) || knownLoss(dead))) continue; // destruction observed
    // An enemy ghost disappears once its cell is observed empty, also when it died elsewhere
    // unseen (it is gone from the cell all the same); own units are never forgotten while they
    // may still exist.
    if (r.side !== side && seen(r.x, r.y)) continue;
    next.set(r.id, r.live ? { ...r, live: false } : r);
  }
  return [...next.values()].sort((a, b) => a.id - b.id);
}

/**
 * Initial reports: everything observed, plus every own unit and every structure (a side knows
 * its starting positions and, from prior reconnaissance, where the enemy's fixed installations stand).
 */
export function initialIntel(world: World, ruleset: Ruleset): Report[][] {
  return Array.from({ length: world.sides }, (_, side) => {
    const observed = observedCells(world, ruleset, side);
    const reports = updatedReports(world, side, observed, [], [], undefined, revealedEmitters(world, ruleset, side));
    const known = new Set(reports.map((r) => r.id));
    for (const e of world.entities) {
      const structure = archetypeOf(ruleset, e.kind)?.speed === 0;
      if ((e.side === side || structure) && !known.has(e.id)) reports.push({ ...reportOf(e, world.tick), live: false });
    }
    return reports.sort((a, b) => a.id - b.id);
  });
}

/** Whether `side` observes entity `id` right now (fog rulesets; always true without fog). */
export function isSpotted(world: World, ruleset: Ruleset, side: number, id: number): boolean {
  if (!ruleset.fog) return true;
  return world.intel?.[side]?.some((r) => r.id === id && r.live) ?? false;
}

/**
 * Vision step (system 11) at the end of a tick: refreshes `world.intel` and, when `reported`
 * is given, appends to `reported[side]` the events of this tick that side could know about
 * (events from `events[from]` on): those involving an entity it observes now, a removed entity
 * whose cell it observes, an observed cell, or the loss of one of its own command sources.
 */
export function updateIntel(world: World, ruleset: Ruleset, gone: readonly Entity[], events?: readonly SimEvent[], from = 0, reported?: SimEvent[][]): void {
  const intel: Report[][] = [];
  for (let side = 0; side < world.sides; side++) {
    const network = ruleset.commandNetwork ? computeNetwork(world, ruleset, side) : undefined;
    const observed = observedCells(world, ruleset, side, network);
    // A side always learns of losing one of its own command sources: its network goes dark.
    const knownLoss = (e: Entity): boolean => e.side === side && archetypeOf(ruleset, e.kind)?.comms?.role === 'source';
    const reports = updatedReports(world, side, observed, world.intel?.[side] ?? [], gone, knownLoss, revealedEmitters(world, ruleset, side, network));
    intel.push(reports);
    const list = reported?.[side];
    if (!events || !list) continue;
    const seen = (x: number, y: number): boolean => observed[cellOf(world.map, x, y)] === 1;
    const live = new Set(reports.filter((r) => r.live).map((r) => r.id));
    const lost = new Set<number>();
    for (const e of gone) {
      if (seen(e.x, e.y)) live.add(e.id);
      else if (knownLoss(e)) lost.add(e.id);
    }
    // A side knows which of its own units fell silent: their return by doctrine is reported too.
    const own = new Set(world.entities.filter((e) => e.side === side).map((e) => e.id));
    for (let i = from; i < events.length; i++) {
      const ev = events[i] as SimEvent;
      const knownAnyway = (ev.t === 'destroyed' && lost.has(ev.id)) || (ev.t === 'order-ended' && ev.reason === 'lost-contact' && own.has(ev.id));
      if (eventVisible(ev, live, seen, side, own) || knownAnyway) list.push(ev);
    }
  }
  world.intel = intel;
}

function eventVisible(ev: SimEvent, live: ReadonlySet<number>, seen: (x: number, y: number) => boolean, side: number, ownIds: ReadonlySet<number>): boolean {
  switch (ev.t) {
    case 'land':
      return seen(ev.x, ev.y);
    // Economy: a side's income and what it queued are its own; new units and sites are reported
    // like anything else standing on an observed cell (own ones are always known to their side).
    case 'income':
    case 'site-blocked':
      return ev.side === side;
    // What a yard queued is its owner's business, even when the yard is in sight.
    case 'queued':
      return ownIds.has(ev.id);
    case 'produced':
    case 'site':
      return ev.side === side || seen(ev.x, ev.y);
    // A shot is reported only when the shooter is observed (its id would reveal it otherwise);
    // hits and landing shells on observed units and cells are reported on their own.
    case 'launch':
    case 'fire':
      return live.has(ev.id);
    case 'destroyed':
      return seen(ev.x, ev.y);
    default:
      return live.has(ev.id);
  }
}
