import { cellOf, dirsFor, dist2, frameIndex, maxStepCost, passable, stepCost, terrainAt } from './grid';
import { TupleHeap } from './heap';
import { canReach, findPath, regions } from './path';
import { DEFAULT_DOCTRINE, type Archetype, type Command, type Doctrine, type Entity, type OrderEndReason, type Ruleset, type SimEvent, type Status, type TargetPriority, type WeaponSpec, type World } from './types';
import { computeNetwork, type Network } from './network';
import { initialIntel, updateIntel } from './vision';
import { archetypeOf, findEntity, normalizeDoctrine, normalizeOrder, validateCommand } from './world';

export interface SimResult {
  world: World;
  /** Everything that happened (ground truth, for tests and replays). */
  events: SimEvent[];
  /** Fog rulesets only: per side, the events that side could know about (D7). */
  reported?: SimEvent[][];
}

/**
 * Run `ticks` simulation ticks. `commands` are applied at the start of the first tick
 * (invalid ones are skipped). Pure: the input world is never mutated.
 */
export function runTicks(world: World, ruleset: Ruleset, commands: readonly Command[], ticks: number): SimResult {
  const w = structuredClone(world);
  const events: SimEvent[] = [];
  const reported = ruleset.fog ? Array.from({ length: w.sides }, (): SimEvent[] => []) : undefined;
  for (let i = 0; i < ticks; i++) tick(w, ruleset, i === 0 ? commands : [], events, reported);
  return reported ? { world: w, events, reported } : { world: w, events };
}

/** Strategy turn: both sides' locked plans execute simultaneously over `ruleset.ticksPerTurn` ticks. */
export function resolveTurn(world: World, ruleset: Ruleset, plans: readonly (readonly Command[])[]): SimResult {
  const result = runTicks(world, ruleset, plans.flat(), ruleset.ticksPerTurn);
  result.world.turn += 1;
  return result;
}

const has = (e: Entity, kind: Status['kind']): boolean => e.status.some((s) => s.kind === kind && s.ticks > 0);

/** Integer damage after the armor matrix and cover; at least 1 if the class can be engaged at all. */
export function computeDamage(base: number, weapon: WeaponSpec, target: Archetype, cover: number): number {
  const pct = weapon.vs[target.armor];
  if (pct <= 0) return 0;
  return Math.max(1, Math.floor((base * pct * (100 - cover)) / 10000));
}

/** Whether `shooter` (with archetype `arch`) can currently reach `target` with its weapon. */
export function inWeaponRange(world: World, ruleset: Ruleset, shooter: Entity, arch: Archetype, target: Entity): boolean {
  const weapon = arch.weapon;
  if (!weapon) return false;
  const targetArch = archetypeOf(ruleset, target.kind);
  if (!targetArch || weapon.vs[targetArch.armor] <= 0) return false;
  const bonus = weapon.delivery === 'ballistic' ? 0 : terrainAt(world.map, ruleset, shooter.x, shooter.y).rangeBonus;
  const d = dist2(shooter.x, shooter.y, target.x, target.y);
  const range = weapon.range + bonus;
  return d <= range * range && d >= weapon.minRange * weapon.minRange;
}

interface Hit {
  damage: number;
  effect: WeaponSpec['effect'];
}

/** One tick in the fixed system order of ADR 0009 (systems not yet implemented are no-ops). */
export function tick(w: World, rs: Ruleset, commands: readonly Command[], events: SimEvent[], reported?: SimEvent[][]): void {
  const firstEvent = events.length;
  // Worlds from before fog (or built by hand) start with what each side sees and owns.
  if (rs.fog && !w.intel) w.intel = initialIntel(w, rs);
  w.tick += 1;
  const t = w.tick;
  const arch = (e: Entity): Archetype => {
    const a = archetypeOf(rs, e.kind);
    if (!a) throw new RangeError(`Unknown archetype '${e.kind}'.`);
    return a;
  };

  // 1. Orders (with a command network: only units in coverage, at most the side's order slots)
  // Coverage and slots come from one snapshot taken before any order of this batch applies,
  // so the order of commands within a batch never changes which of them get through.
  const networks = rs.commandNetwork && commands.length > 0 ? Array.from({ length: w.sides }, (_, side) => computeNetwork(w, rs, side)) : undefined;
  const slotsLeft = new Map<number, number>(networks?.map((n, side) => [side, n.slots]));
  for (const c of commands) {
    if (!validateCommand(w, rs, c, networks).ok) continue;
    if (rs.commandNetwork) {
      const left = slotsLeft.get(c.side) ?? 0;
      if (left <= 0) continue;
      slotsLeft.set(c.side, left - 1);
    }
    const unit = findEntity(w, c.unit) as Entity;
    unit.order = normalizeOrder(c.order);
    if (c.doctrine) unit.doctrine = normalizeDoctrine(c.doctrine);
    // A new order starts with fresh counters (a dead end of the old order says nothing about it).
    delete unit.bumps;
    delete unit.stuck;
    events.push({ t: 'order', tick: t, id: unit.id });
  }

  // With fog, weapons engage only targets the own side has spotted (reports from the end of the
  // previous tick) or that the shooter sees itself.
  const spotted = rs.fog ? w.intel?.map((list) => new Set(list.filter((r) => r.live).map((r) => r.id))) : undefined;
  const spottedBy = (side: number, id: number): boolean => !rs.fog || (spotted?.[side]?.has(id) ?? false);
  const visible = (e: Entity, target: Entity): boolean => {
    if (!rs.fog) return true;
    const vision = arch(e).vision;
    return spottedBy(e.side, target.id) || dist2(e.x, e.y, target.x, target.y) <= vision * vision;
  };

  // 2 + 3. Intent (standing order + doctrine) and simultaneous movement
  const cells = w.map.w * w.map.h;
  const occupied = { ground: new Set<number>(), air: new Set<number>() };
  // Units that will not leave their cell unless ordered: structures, holding and deploying
  // units. Only these count as walls; moving or briefly stopped units are waited for.
  const permanent = { ground: new Set<number>(), air: new Set<number>() };
  for (const e of w.entities) {
    const a = arch(e);
    const c = cellOf(w.map, e.x, e.y);
    occupied[a.layer].add(c);
    if (a.speed === 0 || e.order.type === 'hold' || e.order.type === 'deploy') permanent[a.layer].add(c);
  }
  // Networks are only needed for regrouping units; computed lazily, once per side and tick.
  const networkCache = new Map<number, Network>();
  const coverageOf = (side: number): Uint8Array | undefined => {
    if (!rs.commandNetwork) return undefined;
    let n = networkCache.get(side);
    if (!n) networkCache.set(side, (n = computeNetwork(w, rs, side)));
    return n.coverage;
  };
  const end = (e: Entity, reason: OrderEndReason): void => endOrder(e, reason, t, events);
  // Regions between permanent walls, computed lazily once per layer and tick: a search that
  // cannot succeed is answered without exploring the whole map.
  const regionCache = new Map<string, Int32Array>();
  const regionsOf = (layer: 'ground' | 'air'): Int32Array => {
    let r = regionCache.get(layer);
    if (!r) regionCache.set(layer, (r = regions(w.map, rs, layer, permanent[layer])));
    return r;
  };
  const intent: Intent = { w, rs, occupied, permanent, coverageOf, end, visible, spottedBy, regionsOf };
  const goals = new Map<number, number>();
  for (const e of w.entities) {
    const a = arch(e);
    const goal = a.speed === 0 || has(e, 'disabled') ? undefined : goalOf(intent, e, a);
    if (goal !== undefined) goals.set(e.id, goal);
  }
  const claims = new Map<number, { e: Entity; cost: number }[]>();
  for (const e of w.entities) {
    const a = arch(e);
    if (a.speed === 0) continue;
    const goal = goals.get(e.id);
    if (goal === undefined) {
      e.mp = 0;
      delete e.stuck;
      continue;
    }
    const start = cellOf(w.map, e.x, e.y);
    if (goal === start || !canReach(w.map, rs, a.layer, regionsOf(a.layer), start, goal)) {
      // No way even past moving units: only a lasting dead end ends the order.
      e.mp = 0;
      e.stuck = (e.stuck ?? 0) + 1;
      // Say 'occupied' when it is the destination itself that is held (e.g. a convoy whose
      // destination a unit that will not leave has taken).
      if (e.stuck >= UNREACHABLE_TICKS) end(e, destinationHeld(intent, e, a) ? 'occupied' : 'unreachable');
      continue;
    }
    delete e.stuck;
    const speed = has(e, 'slowed') ? Math.max(1, a.speed >> 1) : a.speed;
    e.mp = Math.min(e.mp + speed, Math.max(speed, maxStepCost(rs, a.layer)));
    // Not enough movement points for even the cheapest step: no need to search a route yet.
    if (e.mp < cheapestStep(w, rs, e, a)) continue;
    const next = nextStepTowards(intent, e, a, goal) as number;
    const cost = stepCost(w.map, rs, e.x, e.y, next % w.map.w, Math.floor(next / w.map.w), a.layer) as number;
    if (e.mp < cost) continue;
    const key = a.layer === 'air' ? next + cells : next;
    const list = claims.get(key) ?? [];
    list.push({ e, cost });
    claims.set(key, list);
  }
  const moved = new Set<number>();
  // Units that did not try to move this tick start a fresh bump count.
  const claimed = new Set([...claims.values()].flat().map((c) => c.e.id));
  for (const e of w.entities) if (!claimed.has(e.id)) delete e.bumps;
  for (const [key, list] of claims) {
    const air = key >= cells;
    const cell = air ? key - cells : key;
    const winner = (air ? occupied.air : occupied.ground).has(cell) ? undefined : contestWinner(list);
    for (const claim of list) {
      const e = claim.e;
      if (claim !== winner) {
        events.push({ t: 'bump', tick: t, id: e.id });
        e.bumps = (e.bumps ?? 0) + 1;
        // Waiting behind moving units is normal; only a lasting mutual block ends the order. A
        // destination that stays taken (by a unit escorting, attacking, ...) is 'occupied'.
        const order = e.order;
        if (order.type === 'move' && cellOf(w.map, order.x, order.y) === cell && e.bumps >= OCCUPIED_BUMPS) end(e, 'occupied');
        else if (e.bumps >= DEADLOCK_TICKS) end(e, 'blocked');
        continue;
      }
      delete e.bumps;
      e.x = cell % w.map.w;
      e.y = Math.floor(cell / w.map.w);
      e.mp -= claim.cost;
      delete e.deploy;
      moved.add(e.id);
      events.push({ t: 'move', tick: t, id: e.id, x: e.x, y: e.y });
    }
  }

  // 4 + 5. Targeting, fire and projectiles
  const hits = new Map<number, Hit[]>();
  const addHit = (id: number, hit: Hit): void => {
    const list = hits.get(id) ?? [];
    list.push(hit);
    hits.set(id, list);
  };
  const landed = w.projectiles.filter((p) => --p.ticks <= 0);
  w.projectiles = w.projectiles.filter((p) => p.ticks > 0);
  for (const p of landed) {
    const weapon = archetypeOf(rs, p.kind)?.weapon;
    events.push({ t: 'land', tick: t, x: p.x, y: p.y });
    if (!weapon) continue;
    for (const target of w.entities) {
      if (target.side === p.side || dist2(p.x, p.y, target.x, target.y) > weapon.splash * weapon.splash) continue;
      const damage = computeDamage(weapon.damage, weapon, arch(target), 0);
      if (damage > 0) addHit(target.id, { damage, effect: weapon.effect });
    }
  }
  for (const e of w.entities) {
    const a = arch(e);
    const weapon = a.weapon;
    if (!weapon || e.cooldown > 0 || has(e, 'disabled') || (weapon.stationary && moved.has(e.id))) continue;
    const target = pickTarget(w, rs, e, a, t, (other) => visible(e, other));
    if (!target) {
      e.beam = null;
      continue;
    }
    e.cooldown = weapon.cooldown;
    const cover = terrainAt(w.map, rs, target.x, target.y).cover;
    if (weapon.delivery === 'ballistic') {
      w.projectiles.push({ id: w.nextId++, side: e.side, kind: e.kind, x: target.x, y: target.y, ticks: Math.max(1, weapon.flight) });
      events.push({ t: 'launch', tick: t, id: e.id, x: target.x, y: target.y });
      continue;
    }
    let base = weapon.damage;
    if (weapon.delivery === 'beam') {
      const stacks = e.beam && e.beam.target === target.id ? Math.min(e.beam.stacks + 1, weapon.beamMaxStacks) : 0;
      e.beam = { target: target.id, stacks };
      base += weapon.beamRamp * stacks;
    }
    events.push({ t: 'fire', tick: t, id: e.id, target: target.id });
    addHit(target.id, { damage: computeDamage(base, weapon, arch(target), cover), effect: weapon.effect });
  }

  // 6. Damage, applied simultaneously
  const pendingEffects = new Map<number, Status[]>();
  for (const e of w.entities) {
    const list = hits.get(e.id);
    if (!list) continue;
    const damage = list.reduce((sum, h) => sum + h.damage, 0);
    e.hp -= damage;
    if (damage > 0) {
      e.hitAt = t;
      // Retreat doctrine: a hit that leaves the unit below its threshold sends it back to regroup.
      // (Checked on hits only, so fresh orders to an already damaged unit are obeyed.)
      const a = arch(e);
      const below = doctrineOf(e).retreatBelow;
      // A unit already holding inside its coverage has nowhere to retreat to: no new order, no
      // repeated 'retreat' → 'regrouped' on every further hit.
      const settled = e.order.type === 'hold' && (coverageOf(e.side)?.[cellOf(w.map, e.x, e.y)] ?? 1) === 1;
      if (below > 0 && a.speed > 0 && e.hp > 0 && e.hp * 100 < a.hp * below && e.order.type !== 'regroup' && !settled) {
        e.order = { type: 'regroup' };
        events.push({ t: 'order-ended', tick: t, id: e.id, reason: 'retreat' });
      }
    }
    events.push({ t: 'hit', tick: t, id: e.id, side: e.side, damage });
    const effects = list.flatMap((h) => (h.effect ? [{ kind: h.effect.kind, ticks: h.effect.ticks }] : []));
    if (effects.length > 0) pendingEffects.set(e.id, effects);
  }

  // 7. Status effects and cooldowns: existing effects count down, new ones start next tick.
  for (const e of w.entities) {
    if (e.order.type === 'deploy' && !has(e, 'disabled')) e.deploy = Math.min(rs.ticksPerTurn, (e.deploy ?? 0) + 1);
    // A set-up node stays set up only while deploying or holding; any other order packs it up.
    if (e.deploy !== undefined && e.order.type !== 'deploy' && e.order.type !== 'hold') delete e.deploy;
    if (e.cooldown > 0) e.cooldown -= 1;
    e.status = e.status.map((s) => ({ kind: s.kind, ticks: s.ticks - 1 })).filter((s) => s.ticks > 0);
    for (const effect of pendingEffects.get(e.id) ?? []) {
      const existing = e.status.find((s) => s.kind === effect.kind);
      if (existing) existing.ticks = Math.max(existing.ticks, effect.ticks);
      else e.status.push(effect);
    }
    e.status.sort((a, b) => (a.kind < b.kind ? -1 : a.kind > b.kind ? 1 : 0));
  }

  // 8. Removal
  const alive: Entity[] = [];
  const gone: Entity[] = [];
  for (const e of w.entities) {
    if (e.hp > 0) alive.push(e);
    else {
      gone.push(e);
      events.push({ t: 'destroyed', tick: t, id: e.id, side: e.side, kind: e.kind, x: e.x, y: e.y });
    }
  }
  w.entities = alive;
  for (const e of alive) {
    // With fog an attacker only learns of the loss through its side's reports or its own sight
    // (handled when it next plans its move); without fog the target is gone at once.
    if (!rs.fog && e.order.type === 'attack' && !findEntity(w, e.order.target)) endOrder(e, 'lost-target', t, events);
  }
  // 9 + 10 (economy, production, research) arrive with later increments; the network is
  // derived data, recomputed where needed.
  // 11. Vision (fog rulesets): reports and per-side event filter (D7)
  if (rs.fog) updateIntel(w, rs, gone, events, firstEvent, reported);
  // 12. Victory is decided by the mode (game rules).
}

/**
 * Conflict rule for a free cell claimed in the same tick (D15, refined): claimants from
 * different sides all bump (symmetric between sides); among claimants of one side the lowest id
 * enters, so friendly units queue instead of blocking each other forever.
 */
function contestWinner<T extends { e: Entity }>(list: readonly T[]): T | undefined {
  const first = list[0];
  if (!first || list.some((c) => c.e.side !== first.e.side)) return undefined;
  return list.reduce((best, c) => (c.e.id < best.e.id ? c : best), first);
}

interface Intent {
  readonly w: World;
  readonly rs: Ruleset;
  readonly occupied: { ground: Set<number>; air: Set<number> };
  /** Cells of units that will not leave unless ordered (structures, holding, deploying). */
  readonly permanent: { ground: Set<number>; air: Set<number> };
  readonly end: (e: Entity, reason: OrderEndReason) => void;
  /** The side's command coverage, or `undefined` when the ruleset has no command network. */
  readonly coverageOf: (side: number) => Uint8Array | undefined;
  /** Regions between permanent walls (see `regions`). */
  readonly regionsOf: (layer: 'ground' | 'air') => Int32Array;
  /** Whether `e` may fire at `target` (fog: spotted by its side or seen by itself). */
  readonly visible: (e: Entity, target: Entity) => boolean;
  /** Whether `side` has a live report on entity `id` (always true without fog). */
  readonly spottedBy: (side: number, id: number) => boolean;
}

const doctrineOf = (e: Entity): Doctrine => e.doctrine ?? DEFAULT_DOCTRINE;

/** Ticks a unit may be blocked by other units in a row before its order ends ('blocked'): three turns. */
export const DEADLOCK_TICKS = 18;
/** Bumps in a row against a taken destination before a move ends as 'occupied'. */
export const OCCUPIED_BUMPS = 3;
/** Ticks without any way to the goal (walls and holding units only) before the order ends ('unreachable'). */
export const UNREACHABLE_TICKS = 6;
/** Extra path cost accepted to walk around moving units instead of waiting behind them. */
const DETOUR = 8;

/** Cheapest single step out of the unit's cell (terrain only), `Infinity` if there is none. */
function cheapestStep(w: World, rs: Ruleset, e: Entity, a: Archetype): number {
  let min = Number.POSITIVE_INFINITY;
  for (const [dx, dy] of dirsFor(0)) {
    const cost = stepCost(w.map, rs, e.x, e.y, e.x + dx, e.y + dy, a.layer);
    if (cost !== undefined && cost < min) min = cost;
  }
  return min;
}

/** Ends a standing order: the unit holds, and an event says why. */
function endOrder(e: Entity, reason: OrderEndReason, tick: number, events: SimEvent[]): void {
  e.order = { type: 'hold' };
  delete e.bumps;
  delete e.stuck;
  events.push({ t: 'order-ended', tick, id: e.id, reason });
}

/** Whether a unit that will not leave (structure, holding, deploying) stands on (x, y). */
const heldBy = (ctx: Intent, e: Entity, a: Archetype, x: number, y: number): boolean =>
  (x !== e.x || y !== e.y) && ctx.permanent[a.layer].has(cellOf(ctx.w.map, x, y));

/** Whether any other unit (on the unit's layer) stands on (x, y). */
const takenBy = (ctx: Intent, e: Entity, a: Archetype, x: number, y: number): boolean =>
  (x !== e.x || y !== e.y) && ctx.occupied[a.layer].has(cellOf(ctx.w.map, x, y));

/** Whether a move order's destination is held by a unit that will not leave. */
const destinationHeld = (ctx: Intent, e: Entity, a: Archetype): boolean =>
  e.order.type === 'move' && heldBy(ctx, e, a, e.order.x, e.order.y);

const adjacent = (e: Entity, x: number, y: number): boolean => Math.max(Math.abs(e.x - x), Math.abs(e.y - y)) <= 1;

const pathCost = (ctx: Intent, e: Entity, a: Archetype, path: readonly number[]): number => {
  let cost = 0;
  let x = e.x;
  let y = e.y;
  for (const c of path) {
    const nx = c % ctx.w.map.w;
    const ny = Math.floor(c / ctx.w.map.w);
    cost += stepCost(ctx.w.map, ctx.rs, x, y, nx, ny, a.layer) ?? 0;
    x = nx;
    y = ny;
  }
  return cost;
};

/**
 * Next cell towards the goal. Walls are terrain, structures and units that will not leave; a
 * route around all other units is preferred when it costs at most DETOUR more, otherwise the
 * unit queues behind them. `undefined` only if there is no way even past moving units.
 */
function nextStepTowards(ctx: Intent, e: Entity, a: Archetype, goal: number): number | undefined {
  const { w, rs } = ctx;
  const start = cellOf(w.map, e.x, e.y);
  const base = findPath(w.map, rs, start, goal, { layer: a.layer, side: e.side, blocked: ctx.permanent[a.layer] });
  if (!base || base.length === 0) return base?.[0];
  // The usual case: nobody stands on the route, so there is nothing to walk around (one search).
  // (Checking only the next cell is not enough: a unit could then step aside, see a free route,
  // step back, and so on for ever.)
  const occupied = ctx.occupied[a.layer];
  if (!base.some((c) => occupied.has(c))) return base[0];
  // A route around the units in the way, if it costs at most DETOUR more (bounded search).
  const maxCost = pathCost(ctx, e, a, base) + DETOUR;
  const around = findPath(w.map, rs, start, goal, { layer: a.layer, side: e.side, blocked: ctx.occupied[a.layer], maxCost });
  if (around && around.length > 0) return around[0];
  return base[0];
}

/**
 * Movement goal for the unit's standing order and doctrine, or `undefined` to stay. Ends orders
 * that are done or cannot be done (with an 'order-ended' event): arrived, destination held by a
 * unit that will not leave, lost target or charge, regroup completed.
 */
function goalOf(ctx: Intent, e: Entity, a: Archetype): number | undefined {
  const { w, rs } = ctx;
  let goal: number | undefined;
  const order = e.order;
  switch (order.type) {
    case 'move':
      if (order.x === e.x && order.y === e.y) ctx.end(e, 'arrived');
      else if (adjacent(e, order.x, order.y) && heldBy(ctx, e, a, order.x, order.y)) ctx.end(e, 'occupied');
      else goal = cellOf(w.map, order.x, order.y);
      break;
    case 'attack': {
      const aim = attackAim(ctx, e, a, order.target);
      if (aim === 'lost') ctx.end(e, 'lost-target');
      else goal = aim;
      break;
    }
    case 'escort': {
      const target = findEntity(w, order.target);
      if (!target || target.side !== e.side) {
        ctx.end(e, 'lost-target');
        break;
      }
      if (dist2(e.x, e.y, target.x, target.y) > ESCORT_RANGE * ESCORT_RANGE) goal = cellOf(w.map, target.x, target.y);
      break;
    }
    case 'patrol': {
      // Turn at the end, or right before it when any other unit stands on it (a patrol has no
      // reason to wait for the exact cell).
      if ((order.x === e.x && order.y === e.y) || (adjacent(e, order.x, order.y) && takenBy(ctx, e, a, order.x, order.y))) {
        e.order = { type: 'patrol', x: order.rx, y: order.ry, rx: order.x, ry: order.y };
      }
      const leg = e.order;
      if (leg.type === 'patrol' && (leg.x !== e.x || leg.y !== e.y) && !(adjacent(e, leg.x, leg.y) && takenBy(ctx, e, a, leg.x, leg.y))) {
        goal = cellOf(w.map, leg.x, leg.y);
      }
      break;
    }
    case 'regroup': {
      const coverage = ctx.coverageOf(e.side);
      if (!coverage || coverage[cellOf(w.map, e.x, e.y)] === 1) {
        ctx.end(e, 'regrouped');
        break;
      }
      // No free covered cell reachable right now: keep the order (counted as 'stuck' below).
      goal = nearestCell(ctx, e, a, (c) => coverage[c] === 1) ?? cellOf(w.map, e.x, e.y);
      break;
    }
    default:
      break;
  }
  // Doctrine: seek cover when holding (never for nodes that work only where they were set up).
  if (goal === undefined && e.order.type === 'hold' && doctrineOf(e).seekCover && !archetypeOf(rs, e.kind)?.comms?.needsDeploy) {
    goal = adjacentCover(ctx, e, a);
  }
  return goal;
}

/**
 * Where an attacking unit should go: `undefined` to stay (it can fire from here, or waits in a
 * firing position), a cell to head for, or 'lost' when the target is gone as far as the unit's
 * side knows. With fog the unit only uses what its side reports or what it sees itself: a target
 * out of sight is sought at its last reported cell, and the order ends once the unit sees that
 * cell without the target. It heads for the nearest firing position: a cell at least the weapon's
 * minimum range away and within its range (without a spotter also within its own sight).
 */
function attackAim(ctx: Intent, e: Entity, a: Archetype, id: number): number | 'lost' | undefined {
  const { w, rs } = ctx;
  const weapon = a.weapon;
  const target = findEntity(w, id);
  const seen = target !== undefined && ctx.visible(e, target);
  let at: { x: number; y: number; kind: string } | undefined;
  if (seen || !rs.fog) at = target;
  else at = w.intel?.[e.side]?.find((r) => r.id === id);
  if (!at || !weapon) return 'lost';
  const armor = archetypeOf(rs, at.kind)?.armor;
  if (!armor || weapon.vs[armor] <= 0) return 'lost';
  if (seen && target && inWeaponRange(w, rs, e, a, target)) return undefined;
  const vision = a.vision;
  // Fog: the unit looks at the last reported cell itself and the target is not there.
  if (rs.fog && !seen && dist2(e.x, e.y, at.x, at.y) <= vision * vision) return 'lost';
  const spotter = seen && ctx.spottedBy(e.side, id);
  const max = rs.fog && !spotter ? Math.min(weapon.range, vision) : weapon.range;
  const min = weapon.minRange;
  if (max < min) return 'lost'; // cannot see and hit it at the same time
  const p = at;
  const firing = (c: number): boolean => {
    const d = dist2(c % w.map.w, Math.floor(c / w.map.w), p.x, p.y);
    return d >= min * min && d <= max * max;
  };
  const start = cellOf(w.map, e.x, e.y);
  if (firing(start)) return undefined;
  // No firing position reachable now: keep the order (counted as 'stuck', ends as 'unreachable').
  return nearestCell(ctx, e, a, firing) ?? start;
}

/** Escort / guard keeps within this many cells of its charge. */
const ESCORT_RANGE = 2;

/**
 * The free cell other than its own that the unit can reach most cheaply among those `accept`
 * allows (Dijkstra over step costs, past walls only; ties in the side's frame), or `undefined`.
 */
function nearestCell(ctx: Intent, e: Entity, a: Archetype, accept: (cell: number) => boolean): number | undefined {
  const { w, rs, occupied } = ctx;
  const cells = w.map.w * w.map.h;
  const start = cellOf(w.map, e.x, e.y);
  const dist = new Int32Array(cells).fill(-1);
  const heap = new TupleHeap();
  dist[start] = 0;
  heap.push([0, frameIndex(start, e.side, cells), start]);
  for (let item = heap.pop(); item; item = heap.pop()) {
    const c = item[2] as number;
    const d = item[0] as number;
    if (d !== dist[c]) continue;
    if (c !== start && accept(c) && !occupied[a.layer].has(c)) return c;
    const cx = c % w.map.w;
    const cy = Math.floor(c / w.map.w);
    for (const [dx, dy] of dirsFor(e.side)) {
      const cost = stepCost(w.map, rs, cx, cy, cx + dx, cy + dy, a.layer);
      if (cost === undefined) continue;
      const n = cellOf(w.map, cx + dx, cy + dy);
      if (ctx.permanent[a.layer].has(n)) continue;
      const nd = d + cost;
      const old = dist[n] as number;
      if (old !== -1 && nd >= old) continue;
      dist[n] = nd;
      heap.push([nd, frameIndex(n, e.side, cells), n]);
    }
  }
  return undefined;
}

/** A free neighbouring cell with cover, if the unit is not already in cover (side-frame order). */
function adjacentCover(ctx: Intent, e: Entity, a: Archetype): number | undefined {
  const { w, rs, occupied } = ctx;
  if (a.layer !== 'ground' || terrainAt(w.map, rs, e.x, e.y).cover > 0) return undefined;
  for (const [dx, dy] of dirsFor(e.side)) {
    const x = e.x + dx;
    const y = e.y + dy;
    if (!passable(w.map, rs, x, y, a.layer) || terrainAt(w.map, rs, x, y).cover === 0) continue;
    const c = cellOf(w.map, x, y);
    if (!occupied.ground.has(c)) return c;
  }
  return undefined;
}

/** Whether a target matches a doctrine's priority class. */
function matchesPriority(rs: Ruleset, target: Entity, priority: TargetPriority): boolean {
  const armor = archetypeOf(rs, target.kind)?.armor;
  if (priority === 'armor') return armor === 'heavy' || armor === 'light';
  if (priority === 'infantry') return armor === 'infantry';
  if (priority === 'structures') return armor === 'structure';
  return false;
}

/**
 * Target selection: an ordered target in range first. Otherwise, by doctrine priority: preferred
 * class first, then lowest health and nearest ('nearest': distance before health), then lowest
 * id. With return-fire doctrine the unit only shoots at an ordered target or after being hit
 * within the last turn. Only `visible` targets are engaged (fog).
 */
function pickTarget(w: World, rs: Ruleset, e: Entity, a: Archetype, tick: number, visible: (target: Entity) => boolean): Entity | undefined {
  const doctrine = doctrineOf(e);
  if (e.order.type === 'attack') {
    const ordered = findEntity(w, e.order.target);
    if (ordered && visible(ordered) && inWeaponRange(w, rs, e, a, ordered)) return ordered;
  }
  if (doctrine.holdFire && (e.hitAt === undefined || tick - e.hitAt > rs.ticksPerTurn)) return undefined;
  const classed = doctrine.priority !== 'weakest' && doctrine.priority !== 'nearest';
  let best: Entity | undefined;
  for (const target of w.entities) {
    if (target.side === e.side || !visible(target) || !inWeaponRange(w, rs, e, a, target)) continue;
    if (!best) {
      best = target;
      continue;
    }
    const cls = classed ? Number(matchesPriority(rs, best, doctrine.priority)) - Number(matchesPriority(rs, target, doctrine.priority)) : 0;
    const hp = target.hp - best.hp;
    const d = dist2(e.x, e.y, target.x, target.y) - dist2(e.x, e.y, best.x, best.y);
    const cmp = cls || (doctrine.priority === 'nearest' ? d || hp : hp || d) || target.id - best.id;
    if (cmp < 0) best = target;
  }
  return best;
}

