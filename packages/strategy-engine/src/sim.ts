import { cellOf, dirsFor, dist2, frameIndex, maxStepCost, passable, stepCost, terrainAt } from './grid';
import { findPath } from './path';
import { DEFAULT_DOCTRINE, type Archetype, type Command, type Doctrine, type Entity, type Ruleset, type SimEvent, type Status, type TargetPriority, type WeaponSpec, type World } from './types';
import { computeNetwork, type Network } from './network';
import { archetypeOf, findEntity, normalizeDoctrine, normalizeOrder, validateCommand } from './world';

export interface SimResult {
  world: World;
  events: SimEvent[];
}

/**
 * Run `ticks` simulation ticks. `commands` are applied at the start of the first tick
 * (invalid ones are skipped). Pure: the input world is never mutated.
 */
export function runTicks(world: World, ruleset: Ruleset, commands: readonly Command[], ticks: number): SimResult {
  const w = structuredClone(world);
  const events: SimEvent[] = [];
  for (let i = 0; i < ticks; i++) tick(w, ruleset, i === 0 ? commands : [], events);
  return { world: w, events };
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
export function tick(w: World, rs: Ruleset, commands: readonly Command[], events: SimEvent[]): void {
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
    // Orders that make the unit travel pack a set-up node up; hold keeps it standing.
    if (unit.order.type === 'move' || unit.order.type === 'attack') delete unit.deploy;
    events.push({ t: 'order', tick: t, id: unit.id });
  }

  // 2 + 3. Intent (standing order + doctrine) and simultaneous movement
  const cells = w.map.w * w.map.h;
  const occupied = { ground: new Set<number>(), air: new Set<number>() };
  for (const e of w.entities) occupied[arch(e).layer].add(cellOf(w.map, e.x, e.y));
  // Networks are only needed for regrouping units; computed lazily, once per side and tick.
  const networkCache = new Map<number, Network>();
  const coverageOf = (side: number): Uint8Array | undefined => {
    if (!rs.commandNetwork) return undefined;
    let n = networkCache.get(side);
    if (!n) networkCache.set(side, (n = computeNetwork(w, rs, side)));
    return n.coverage;
  };
  const intent: Intent = { w, rs, occupied, coverageOf };
  // Cells of units that will not move this tick (structures, holding or arrived units):
  // paths go around them instead of queueing behind them forever.
  const settled = { ground: new Set<number>(), air: new Set<number>() };
  const goals = new Map<number, number>();
  for (const e of w.entities) {
    const a = arch(e);
    const c = cellOf(w.map, e.x, e.y);
    const goal = a.speed === 0 || has(e, 'disabled') ? undefined : goalOf(intent, e, a);
    if (goal === undefined) settled[a.layer].add(c);
    else goals.set(e.id, goal);
  }
  const claims = new Map<number, { e: Entity; cost: number }[]>();
  for (const e of w.entities) {
    const a = arch(e);
    if (a.speed === 0) continue;
    const goal = goals.get(e.id);
    if (goal === undefined) {
      e.mp = 0;
      continue;
    }
    const path = findPath(w.map, rs, cellOf(w.map, e.x, e.y), goal, { layer: a.layer, side: e.side, blocked: settled[a.layer] });
    const next = path?.[0];
    if (next === undefined) {
      e.mp = 0;
      continue;
    }
    const speed = has(e, 'slowed') ? Math.max(1, a.speed >> 1) : a.speed;
    e.mp = Math.min(e.mp + speed, Math.max(speed, maxStepCost(rs, a.layer)));
    const cost = stepCost(w.map, rs, e.x, e.y, next % w.map.w, Math.floor(next / w.map.w), a.layer) as number;
    if (e.mp < cost) continue;
    const key = a.layer === 'air' ? next + cells : next;
    const list = claims.get(key) ?? [];
    list.push({ e, cost });
    claims.set(key, list);
  }
  const moved = new Set<number>();
  for (const [key, list] of claims) {
    const air = key >= cells;
    const cell = air ? key - cells : key;
    const winner = (air ? occupied.air : occupied.ground).has(cell) ? undefined : contestWinner(list);
    for (const claim of list) {
      const e = claim.e;
      if (claim !== winner) {
        events.push({ t: 'bump', tick: t, id: e.id });
        continue;
      }
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
    const target = pickTarget(w, rs, e, a, t);
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
    if (damage > 0) e.hitAt = t;
    events.push({ t: 'hit', tick: t, id: e.id, side: e.side, damage });
    const effects = list.flatMap((h) => (h.effect ? [{ kind: h.effect.kind, ticks: h.effect.ticks }] : []));
    if (effects.length > 0) pendingEffects.set(e.id, effects);
  }

  // 7. Status effects and cooldowns: existing effects count down, new ones start next tick.
  for (const e of w.entities) {
    if (e.order.type === 'deploy' && !has(e, 'disabled')) e.deploy = Math.min(rs.ticksPerTurn, (e.deploy ?? 0) + 1);
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
  for (const e of w.entities) {
    if (e.hp > 0) alive.push(e);
    else events.push({ t: 'destroyed', tick: t, id: e.id, side: e.side, kind: e.kind, x: e.x, y: e.y });
  }
  w.entities = alive;
  for (const e of alive) {
    if (e.order.type === 'attack' && !findEntity(w, e.order.target)) e.order = { type: 'hold' };
  }
  // 9–12 (economy, production, research, network, vision, victory) arrive with later increments.
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
  /** The side's command coverage, or `undefined` when the ruleset has no command network. */
  readonly coverageOf: (side: number) => Uint8Array | undefined;
}

const doctrineOf = (e: Entity): Doctrine => e.doctrine ?? DEFAULT_DOCTRINE;

/**
 * Movement goal for the unit's standing order and doctrine, or `undefined` to stay. May update
 * the standing order (retreat → regroup, regroup → hold on arrival, patrol legs, lost escorts).
 */
function goalOf(ctx: Intent, e: Entity, a: Archetype): number | undefined {
  const { w, rs } = ctx;
  const doctrine = doctrineOf(e);
  const coverage = ctx.coverageOf(e.side);
  const covered = (x: number, y: number) => coverage?.[cellOf(w.map, x, y)] === 1;
  // Doctrine: retreat below a health threshold (only meaningful with a network to return to).
  if (coverage && doctrine.retreatBelow > 0 && e.hp * 100 < a.hp * doctrine.retreatBelow) {
    const settled = e.order.type === 'regroup' || (e.order.type === 'hold' && covered(e.x, e.y));
    if (!settled) e.order = { type: 'regroup' };
  }
  const order = e.order;
  let goal: number | undefined;
  switch (order.type) {
    case 'move':
      goal = order.x === e.x && order.y === e.y ? undefined : cellOf(w.map, order.x, order.y);
      break;
    case 'attack': {
      const target = findEntity(w, order.target);
      if (!target || inWeaponRange(w, rs, e, a, target)) break;
      // Too close for a weapon with a minimum range: stay rather than walk into the target.
      const minRange = a.weapon?.minRange ?? 0;
      if (dist2(e.x, e.y, target.x, target.y) < minRange * minRange) break;
      goal = cellOf(w.map, target.x, target.y);
      break;
    }
    case 'escort': {
      const target = findEntity(w, order.target);
      if (!target || target.side !== e.side) {
        e.order = { type: 'hold' };
        break;
      }
      if (dist2(e.x, e.y, target.x, target.y) > ESCORT_RANGE * ESCORT_RANGE) goal = cellOf(w.map, target.x, target.y);
      break;
    }
    case 'patrol':
      if (order.x === e.x && order.y === e.y) e.order = { type: 'patrol', x: order.rx, y: order.ry, rx: order.x, ry: order.y };
      if (e.order.type === 'patrol' && (e.order.x !== e.x || e.order.y !== e.y)) goal = cellOf(w.map, e.order.x, e.order.y);
      break;
    case 'regroup':
      if (!coverage || covered(e.x, e.y)) {
        e.order = { type: 'hold' };
        break;
      }
      goal = nearestCovered(ctx, e, a, coverage);
      if (goal === undefined) e.order = { type: 'hold' };
      break;
    default:
      break;
  }
  if (goal === undefined && doctrine.seekCover && (e.order.type === 'hold' || e.order.type === 'move')) goal = adjacentCover(ctx, e, a);
  return goal;
}

/** Escort / guard keeps within this many cells of its charge. */
const ESCORT_RANGE = 2;

/** Nearest passable covered cell (squared distance; ties in the side's frame). */
function nearestCovered(ctx: Intent, e: Entity, a: Archetype, coverage: Uint8Array): number | undefined {
  const { w, rs } = ctx;
  const cells = w.map.w * w.map.h;
  let best: number | undefined;
  let bestD = Infinity;
  let bestF = Infinity;
  for (let c = 0; c < cells; c++) {
    if (coverage[c] !== 1) continue;
    const x = c % w.map.w;
    const y = Math.floor(c / w.map.w);
    if (!passable(w.map, rs, x, y, a.layer)) continue;
    const d = dist2(e.x, e.y, x, y);
    const f = frameIndex(c, e.side, cells);
    if (d < bestD || (d === bestD && f < bestF)) {
      best = c;
      bestD = d;
      bestF = f;
    }
  }
  return best;
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
 * within the last turn.
 */
function pickTarget(w: World, rs: Ruleset, e: Entity, a: Archetype, tick: number): Entity | undefined {
  const doctrine = doctrineOf(e);
  if (e.order.type === 'attack') {
    const ordered = findEntity(w, e.order.target);
    if (ordered && inWeaponRange(w, rs, e, a, ordered)) return ordered;
  }
  if (doctrine.holdFire && (e.hitAt === undefined || tick - e.hitAt > rs.ticksPerTurn)) return undefined;
  const classed = doctrine.priority !== 'weakest' && doctrine.priority !== 'nearest';
  let best: Entity | undefined;
  for (const target of w.entities) {
    if (target.side === e.side || !inWeaponRange(w, rs, e, a, target)) continue;
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

