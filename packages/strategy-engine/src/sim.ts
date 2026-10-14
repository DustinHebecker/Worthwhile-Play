import { isRecord } from '@wp/game-core';
import { cellOf, dirsFor, dist2, frameCell, frameDirs, frameIndexIn, frameOf, maxStepCost, passable, stepCost, terrainAt } from './grid';
import { canReach, costGrid, findPath, NumberHeap, regions } from './path';
import { DEFAULT_DOCTRINE, MAX_SUPPLY, NEUTRAL, type Archetype, type Command, type Doctrine, type Entity, type Order, type OrderEndReason, type Report, type Ruleset, type SimEvent, type Status, type TargetPriority, type WeaponSpec, type World } from './types';
import { computeNetwork, isEmitter, type Network } from './network';
import { initialIntel, updateIntel } from './vision';
import { archetypeOf, findEntity, hostile, needsDeploy, normalizeDoctrine, normalizeOrder, spawn, validateCommand } from './world';
import { depositAt, incomeOf, isReady, repairPrice, sellRefund, spawnCell } from './economy';

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
  // Placements of different sides on one cell in one batch: both refused (no side wins a tie by
  // the order in which the plans were handed in).
  // Only placements that pass the rules count (a refused command must not block the other side).
  const placedBy = new Map<number, Set<number>>();
  for (const c of commands) {
    const o = isRecord(c) && isRecord(c.order) ? (c.order as Order) : undefined;
    if (o?.type !== 'build' || !validateCommand(w, rs, c, networks).ok) continue;
    const key = o.y * w.map.w + o.x;
    (placedBy.get(key) ?? placedBy.set(key, new Set()).get(key)!).add(c.side);
  }
  // Structures sold in this batch: torn down after every command of the batch is applied, so
  // neither the order of the plans nor a sale decides whether another side's command applies
  // (an attack on it, a placement on its cell). Reported to the intel like losses.
  const selling: Entity[] = [];
  const sold: Entity[] = [];
  // Sites placed in this batch: paid in the loop, set down after it with ids by each site's cell in
  // its side's own frame, so the order in which the plans were handed in never decides the ids.
  const placing: { unit: Entity; kind: string; x: number; y: number }[] = [];
  for (const c of commands) {
    if (!validateCommand(w, rs, c, networks).ok) continue;
    // A placement the side's knowledge allowed may still find the cell taken: refused unpaid.
    if (c.order.type === 'build') {
      const o = c.order;
      const structure = arch({ kind: o.kind } as Entity);
      const deposit = depositAt(w.map, o.x, o.y);
      const blocked =
        (placedBy.get(o.y * w.map.w + o.x)?.size ?? 0) > 1 ||
        w.entities.some((e) => e.x === o.x && e.y === o.y && arch(e).layer === structure.layer) ||
        placing.some((p) => p.x === o.x && p.y === o.y && arch({ kind: p.kind } as Entity).layer === structure.layer) ||
        (structure.extractor && (deposit?.left ?? 0) <= 0 && !deposit?.endless);
      if (blocked) {
        events.push({ t: 'site-blocked', tick: t, side: c.side, kind: o.kind, x: o.x, y: o.y });
        continue;
      }
    }
    if (rs.commandNetwork) {
      const left = slotsLeft.get(c.side) ?? 0;
      if (left <= 0) continue;
      slotsLeft.set(c.side, left - 1);
    }
    const unit = findEntity(w, c.unit) as Entity;
    const order = normalizeOrder(c.order);
    // Economy: production and placement are one-shot and paid at once; the standing order stays.
    if (order.type === 'produce') {
      const product = arch({ kind: order.kind } as Entity);
      const supply = (w.supply ??= Array.from({ length: w.sides }, () => 0));
      supply[unit.side] = (supply[unit.side] ?? 0) - product.cost;
      (unit.queue ??= []).push({ kind: order.kind, left: product.buildTurns });
      events.push({ t: 'queued', tick: t, id: unit.id, kind: order.kind });
      continue;
    }
    if (order.type === 'repair') {
      const target = findEntity(w, order.target) as Entity;
      const supply = (w.supply ??= Array.from({ length: w.sides }, () => 0));
      const healed = arch(target).hp - target.hp;
      supply[unit.side] = (supply[unit.side] ?? 0) - repairPrice(arch(target), target.hp);
      target.hp = arch(target).hp;
      events.push({ t: 'repaired', tick: t, id: target.id, by: unit.id, hp: healed });
      continue;
    }
    if (order.type === 'sell') {
      if (!selling.includes(unit)) selling.push(unit);
      continue;
    }
    if (order.type === 'build') {
      const structure = arch({ kind: order.kind } as Entity);
      const supply = (w.supply ??= Array.from({ length: w.sides }, () => 0));
      supply[unit.side] = (supply[unit.side] ?? 0) - structure.cost;
      placing.push({ unit, kind: order.kind, x: order.x, y: order.y });
      continue;
    }
    unit.order = order;
    if (c.doctrine) unit.doctrine = normalizeDoctrine(c.doctrine);
    // A new order starts with fresh counters (a dead end of the old order says nothing about it).
    delete unit.bumps;
    delete unit.stuck;
    delete unit.stall;
    delete unit.prev;
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

  // Ids by the cell in the placing side's own frame (mirror-consistent, P4), then side (a pair of
  // mirror-image placements by both sides in one batch is the one tie: side 0's site comes first).
  placing.sort((a, b) => frameIndexIn(w.map, frameOf(w, a.unit.side), cellOf(w.map, a.x, a.y)) - frameIndexIn(w.map, frameOf(w, b.unit.side), cellOf(w.map, b.x, b.y)) || a.unit.side - b.unit.side);
  for (const p of placing) {
    const structure = arch({ kind: p.kind } as Entity);
    const site = spawn(w.nextId++, p.unit.side, structure, p.x, p.y);
    site.build = structure.buildTurns;
    if (p.unit.doctrine) site.doctrine = normalizeDoctrine(p.unit.doctrine);
    w.entities.push(site);
    if (w.intel) w.intel[p.unit.side]?.push({ id: site.id, side: site.side, kind: site.kind, x: site.x, y: site.y, hp: site.hp, tick: t, live: false });
    events.push({ t: 'site', tick: t, id: site.id, side: site.side, kind: site.kind, x: site.x, y: site.y });
  }
  for (const unit of selling) {
    const supply = (w.supply ??= Array.from({ length: w.sides }, () => 0));
    const refund = sellRefund(rs, unit);
    supply[unit.side] = Math.min(MAX_SUPPLY, (supply[unit.side] ?? 0) + refund);
    w.entities = w.entities.filter((e) => e !== unit);
    sold.push(unit);
    events.push({ t: 'sold', tick: t, id: unit.id, side: unit.side, kind: unit.kind, x: unit.x, y: unit.y, refund });
  }

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
  // Attackers: the cell they aim at (target or its last report), the key for their progress.
  const aims = new Map<number, number>();
  const intent: Intent = { w, rs, occupied, permanent, coverageOf, end, visible, spottedBy, regionsOf, aims };
  // Doctrine 'lostContact': a mobile unit that spent a whole turn outside its side's coverage
  // returns into it (unless it is a node at work or already on its way back): 'regroup' at once,
  // 'finish' once its order is done (it holds) and no enemy is in its own sight, 'keep' never.
  if (rs.commandNetwork) {
    for (const e of w.entities) {
      const a = arch(e);
      if (a.speed === 0) continue;
      const covered = coverageOf(e.side)?.[cellOf(w.map, e.x, e.y)] === 1;
      if (covered) {
        delete e.noContact;
        continue;
      }
      e.noContact = Math.min(rs.ticksPerTurn, (e.noContact ?? 0) + 1);
      const atWork = needsDeploy(a) && (e.order.type === 'deploy' || (e.deploy ?? 0) >= rs.ticksPerTurn);
      // 'finish': carry on out of contact, and return once the unit only holds with no enemy in its own sight.
      const lost = doctrineOf(e).lostContact;
      const done = lost === 'finish' && e.order.type === 'hold' && !w.entities.some((o) => o.side !== NEUTRAL && hostile(w, e.side, o.side) && dist2(e.x, e.y, o.x, o.y) <= a.vision * a.vision);
      if (e.noContact >= rs.ticksPerTurn && (lost === 'regroup' || done) && e.order.type !== 'regroup' && !atWork) {
        e.order = { type: 'regroup' };
        delete e.bumps;
        delete e.stuck;
        delete e.stall;
        delete e.prev;
        // 'regroup' turns back after a fixed time, which the side is always told ('lost-contact').
        // When a 'finish' unit turns back depends on what it sees out of contact: its own reason
        // travels by normal visibility only, so it reveals no enemy the side does not know of
        // (review of PR #29); out of sight, its side learns of it when the unit is back in contact.
        events.push({ t: 'order-ended', tick: t, id: e.id, reason: lost === 'regroup' ? 'lost-contact' : 'turned-back' });
      }
    }
  }
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
      delete e.stall;
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
    const step = nextStepTowards(intent, e, a, goal);
    if (!step) continue; // cannot happen: the goal is reachable (checked above)
    // No progress along the route for three turns (e.g. stepping aside and back around a
    // patrol, or waiting for a cell that is never free): end the order.
    if (e.order.type !== 'patrol' && e.order.type !== 'escort' && trackProgress(e, aims.get(e.id) ?? goal, step.remaining) >= STALL_TICKS) {
      // An attacker that cannot close in (its target as fast as it, firing cells always taken)
      // is told apart from a unit blocked on its way.
      end(e, e.order.type === 'attack' ? 'outpaced' : 'blocked');
      continue;
    }
    const next = step.next;
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
  // Entities by cell and layer: an escort at rest is looked up when a friendly unit wants its cell.
  const standing = new Map<number, Entity>();
  for (const e of w.entities) standing.set(cellOf(w.map, e.x, e.y) + (arch(e).layer === 'air' ? cells : 0), e);
  for (const [key, list] of claims) {
    const air = key >= cells;
    const cell = air ? key - cells : key;
    let winner = (air ? occupied.air : occupied.ground).has(cell) ? undefined : contestWinner(list);
    // An escort standing beside its charge yields to a friendly unit that wants its cell: the
    // two swap places (it follows its charge again from there). Counted as passable for routes
    // but never moving, it would otherwise hold a crowd in a narrow pass for good.
    const resting = winner ? undefined : standing.get(key);
    if (resting && !moved.has(resting.id) && !claimed.has(resting.id) && escortAtRest(w, rs, resting)) {
      // Passing through only: a unit whose destination is the escort's cell still finds it taken ('occupied').
      const passing = list.filter((c) => c.e.side === resting.side && !moved.has(c.e.id) && !(c.e.order.type === 'move' && cellOf(w.map, c.e.order.x, c.e.order.y) === cell));
      const swap = passing.length > 0 ? contestWinner(passing) : undefined;
      if (swap && passable(w.map, rs, swap.e.x, swap.e.y, arch(resting).layer)) {
        winner = swap;
        events.push({ t: 'move', tick: t, id: resting.id, x: swap.e.x, y: swap.e.y });
        standing.set(cellOf(w.map, swap.e.x, swap.e.y) + (air ? cells : 0), resting);
        resting.prev = cell;
        resting.x = swap.e.x;
        resting.y = swap.e.y;
        moved.add(resting.id);
      }
    }
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
      e.prev = cellOf(w.map, e.x, e.y);
      if (standing.get(e.prev + (air ? cells : 0)) === e) standing.delete(e.prev + (air ? cells : 0));
      standing.set(key, e);
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
      if (!hostile(w, p.side, target.side) || dist2(p.x, p.y, target.x, target.y) > weapon.splash * weapon.splash) continue;
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
      const settled = (): boolean => e.order.type === 'hold' && (coverageOf(e.side)?.[cellOf(w.map, e.x, e.y)] ?? 1) === 1;
      if (below > 0 && a.speed > 0 && e.hp > 0 && e.hp * 100 < a.hp * below && e.order.type !== 'regroup' && !settled()) {
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
  const gone: Entity[] = [...sold];
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
  // 9 + 10. Economy and production (D8): on the last tick of a turn only (strategy mode).
  if (rs.economy && t % rs.ticksPerTurn === 0) {
    networkCache.clear();
    const network = (side: number): Network => {
      let n = networkCache.get(side);
      if (!n) networkCache.set(side, (n = computeNetwork(w, rs, side)));
      return n;
    };
    const supply = (w.supply ??= Array.from({ length: w.sides }, () => 0));
    // Income from connected posts and from Extractors on deposits (which run down).
    for (let side = 0; side < w.sides; side++) {
      let amount = 0;
      for (const e of w.entities) {
        if (e.side !== side) continue;
        const yield_ = incomeOf(w, rs, e, network(side));
        if (yield_ <= 0) continue;
        amount += yield_;
        const deposit = arch(e).extractor ? depositAt(w.map, e.x, e.y) : undefined;
        if (deposit && !deposit.endless) deposit.left -= yield_;
      }
      supply[side] = Math.min(MAX_SUPPLY, (supply[side] ?? 0) + amount);
      if (amount > 0) events.push({ t: 'income', tick: t, side, amount });
    }
    // Construction sites finish; yards work on the head of their queue and set the unit down
    // on a free neighbouring cell (a blocked yard waits).
    for (const e of [...w.entities]) {
      if (e.build !== undefined) {
        e.build -= 1;
        if (e.build <= 0) {
          delete e.build;
          events.push({ t: 'built', tick: t, id: e.id });
        }
        continue;
      }
      const head = e.queue?.[0];
      if (!head || !isReady(e)) continue;
      if (head.left > 0) head.left -= 1;
      if (head.left > 0) continue;
      const product = arch({ kind: head.kind } as Entity);
      const cell = spawnCell(w, rs, e, product);
      if (!cell) continue;
      e.queue?.shift();
      if (e.queue?.length === 0) delete e.queue;
      const unit = spawn(w.nextId++, e.side, product, cell.x, cell.y);
      if (e.doctrine) unit.doctrine = normalizeDoctrine(e.doctrine);
      w.entities.push(unit);
      // The side knows its own new unit (as a ghost until a reporting unit sees it).
      if (w.intel) w.intel[e.side]?.push({ id: unit.id, side: unit.side, kind: unit.kind, x: unit.x, y: unit.y, hp: unit.hp, tick: t, live: false });
      events.push({ t: 'produced', tick: t, id: unit.id, side: unit.side, kind: unit.kind, x: unit.x, y: unit.y, by: e.id });
    }
    w.entities.sort((a, b) => a.id - b.id);
    for (const list of w.intel ?? []) list.sort((a, b) => a.id - b.id);
  }
  // 10b. Capture and elimination (several sides): at the end of a turn, after everything else.
  if (rs.capture && t % rs.ticksPerTurn === 0) captureAndEliminate(w, rs, t, events);
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
  /** Per attacking unit: its progress key, cells + target id (progress is kept per target). */
  readonly aims: Map<number, number>;
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
/** Ticks without getting any closer to an unchanged goal before an order ends ('blocked'): three turns. */
export const STALL_TICKS = 18;

/**
 * Updates the unit's progress record and returns the ticks (with a route search) since its
 * remaining route cost to `goal` last fell (a new goal starts a new record). Measured along the
 * route past walls, so long detours count as progress. Patrols and escorts move back and forth
 * by design and are not ended by it.
 */
function trackProgress(e: Entity, goal: number, remaining: number): number {
  const s = e.stall;
  // A route that got much longer (a unit settled in a gap, a forced detour) starts a new record:
  // walking the detour is progress, even before it gets below the old best.
  if (!s || s.goal !== goal || remaining < s.best || remaining > s.best + DETOUR) e.stall = { goal, best: remaining, ticks: 0 };
  else s.ticks = Math.min(STALL_TICKS, s.ticks + 1);
  return e.stall?.ticks ?? 0;
}

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
  delete e.stall;
  delete e.prev;
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
function nextStepTowards(ctx: Intent, e: Entity, a: Archetype, goal: number): { next: number; remaining: number } | undefined {
  const { w, rs } = ctx;
  const start = cellOf(w.map, e.x, e.y);
  const base = findPath(w.map, rs, start, goal, { layer: a.layer, side: e.side, frame: frameOf(w, e.side), blocked: ctx.permanent[a.layer] });
  if (!base || base.length === 0) return undefined;
  // Route cost past walls only: the progress measure (it does not depend on who is in the way).
  const remaining = pathCost(ctx, e, a, base);
  // The usual case: nobody stands on the route, so there is nothing to walk around (one search).
  // (Checking only the next cell is not enough: a unit could then step aside, see a free route,
  // step back, and so on for ever.)
  const occupied = ctx.occupied[a.layer];
  let next = base[0] as number;
  let aroundUnits = false;
  if (base.some((c) => occupied.has(c))) {
    // A route around the units in the way, if it costs at most DETOUR more (bounded search).
    const around = findPath(w.map, rs, start, goal, { layer: a.layer, side: e.side, frame: frameOf(w, e.side), blocked: occupied, maxCost: remaining + DETOUR });
    if (around && around.length > 0) {
      next = around[0] as number;
      aroundUnits = true;
    }
  }
  // No stepping straight back to the cell just left when another way within DETOUR exists: two
  // routes that are free in turn (a patrol between them) would otherwise make it pace for ever.
  // The other way must avoid what the chosen one avoided (units, when it went around them);
  // without such a way the unit steps back after all.
  if (next === e.prev && next !== goal) {
    const blocked = new Set(aroundUnits ? occupied : ctx.permanent[a.layer]).add(e.prev);
    const other = findPath(w.map, rs, start, goal, { layer: a.layer, side: e.side, frame: frameOf(w, e.side), blocked, maxCost: remaining + DETOUR });
    if (other && other.length > 0) next = other[0] as number;
  }
  return { next, remaining };
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
  if (goal === undefined && e.order.type === 'hold' && doctrineOf(e).seekCover && !needsDeploy(archetypeOf(rs, e.kind))) {
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
  // A target that turned friendly (a captured post): the order ends once the unit sees it (with
  // fog an ally learns of the capture only by looking; it holds fire meanwhile, see pickTarget).
  if (target && (seen || !rs.fog) && !hostile(w, e.side, target.side)) return 'lost';
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
  // Progress is kept per target (not per cell it stands on or firing cell): two attackers pacing
  // in step around each other out of range, or firing cells taken in turn, still end in time.
  ctx.aims.set(e.id, w.map.w * w.map.h + id);
  const firing = (c: number): boolean => {
    const d = dist2(c % w.map.w, Math.floor(c / w.map.w), p.x, p.y);
    return d >= min * min && d <= max * max;
  };
  const start = cellOf(w.map, e.x, e.y);
  if (firing(start)) return undefined;
  // Far away: head for the target (one A* search); the firing position is chosen when close. Only
  // if the target's cell can be reached at all (not for a post ringed by holding units or one
  // across a river): otherwise search a firing position right away.
  const aim = cellOf(w.map, p.x, p.y);
  if (dist2(e.x, e.y, p.x, p.y) > (max + FIRING_SEARCH) ** 2 && canReach(w.map, rs, a.layer, ctx.regionsOf(a.layer), start, aim)) return aim;
  // No firing position reachable now: keep the order (counted as 'stuck', ends as 'unreachable').
  return nearestCell(ctx, e, a, firing) ?? start;
}

/** Within this many cells beyond its range an attacker looks for a firing position. */
const FIRING_SEARCH = 3;

/** Escort / guard keeps within this many cells of its charge. */
const ESCORT_RANGE = 2;

/**
 * An escort within ESCORT_RANGE of its (own-side) charge that could move this tick: it has no
 * goal and stands, so it may step aside. Never a unit that cannot move (disabled, immobile, a site).
 */
function escortAtRest(w: World, rs: Ruleset, e: Entity): boolean {
  if (e.order.type !== 'escort' || has(e, 'disabled') || e.build !== undefined || (archetypeOf(rs, e.kind)?.speed ?? 0) === 0) return false;
  const target = findEntity(w, e.order.target);
  return !!target && target.side === e.side && dist2(e.x, e.y, target.x, target.y) <= ESCORT_RANGE * ESCORT_RANGE;
}

/**
 * The free cell other than its own that the unit can reach most cheaply among those `accept`
 * allows (Dijkstra over step costs, past walls only; ties in the side's frame), or `undefined`.
 */
function nearestCell(ctx: Intent, e: Entity, a: Archetype, accept: (cell: number) => boolean): number | undefined {
  const { w, rs, occupied } = ctx;
  const width = w.map.w;
  const cells = width * w.map.h;
  const grid = costGrid(w.map, rs, a.layer);
  const air = a.layer === 'air';
  const start = cellOf(w.map, e.x, e.y);
  const dist = new Int32Array(cells).fill(-1);
  // Ordering key (distance, cell index in the side's frame) packed into one number.
  const sideFrame = frameOf(w, e.side);
  const frame = (c: number): number => frameIndexIn(w.map, sideFrame, c);
  const heap = new NumberHeap();
  dist[start] = 0;
  heap.push(frame(start));
  while (heap.size > 0) {
    const k = heap.pop();
    const f = k % FRAME;
    const d = (k - f) / FRAME;
    const c = frameCell(w.map, sideFrame, f);
    if (d !== dist[c]) continue;
    if (c !== start && accept(c) && !occupied[a.layer].has(c)) return c;
    const cx = c % width;
    const cy = (c - cx) / width;
    for (const [dx, dy] of frameDirs(sideFrame)) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= w.map.h) continue;
      const n = ny * width + nx;
      const base = grid[n] as number;
      if (base < 0 || ctx.permanent[a.layer].has(n)) continue;
      const diagonal = dx !== 0 && dy !== 0;
      if (diagonal && !air && ((grid[cy * width + nx] as number) < 0 || (grid[ny * width + cx] as number) < 0)) continue;
      const nd = d + (diagonal ? (base * 3) / 2 : base);
      const old = dist[n] as number;
      if (old !== -1 && nd >= old) continue;
      dist[n] = nd;
      heap.push(nd * FRAME + frame(n));
    }
  }
  return undefined;
}

/** Packing base for (distance, frame index) keys: frame indices stay below 2^14 (maps up to 128×128). */
const FRAME = 2 ** 14;

/** A free neighbouring cell with cover, if the unit is not already in cover (side-frame order). */
function adjacentCover(ctx: Intent, e: Entity, a: Archetype): number | undefined {
  const { w, rs, occupied } = ctx;
  if (a.layer !== 'ground' || terrainAt(w.map, rs, e.x, e.y).cover > 0) return undefined;
  for (const [dx, dy] of frameDirs(frameOf(w, e.side))) {
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
  if (priority === 'emitters') return isEmitter(rs, target);
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
    // Never at a friendly target (a post captured by the own side or an ally keeps no attack on it).
    if (ordered && hostile(w, e.side, ordered.side) && visible(ordered) && inWeaponRange(w, rs, e, a, ordered)) return ordered;
  }
  if (doctrine.holdFire && (e.hitAt === undefined || tick - e.hitAt > rs.ticksPerTurn)) return undefined;
  const classed = doctrine.priority !== 'weakest' && doctrine.priority !== 'nearest';
  let best: Entity | undefined;
  for (const target of w.entities) {
    if (!hostile(w, e.side, target.side) || !visible(target) || !inWeaponRange(w, rs, e, a, target)) continue;
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


/** A post is captured below this share of its health (owned posts; neutral ones at any health). */
export const CAPTURE_BELOW = 0.25;

/** Whether an entity is a Command Post in the sense of capture and elimination (an immobile command source). */
export const isCommandPost = (rs: Ruleset, e: Entity): boolean => {
  const a = archetypeOf(rs, e.kind);
  return !!a && a.speed === 0 && a.comms?.role === 'source';
};

/**
 * Capture and elimination at the end of a turn (docs/design/strategy.md § 9.4). All claims are
 * judged on the world as it stands before any capture of this turn, then applied, so neither the
 * order of the posts nor of the sides decides anything:
 * - the claimants of a post are the hostile sides with a living, not disabled infantry unit next
 *   to it; an owned post must also be below a quarter of its health with none of its owner's
 *   (or allies') units next to it; a neutral post has no health condition;
 * - exactly one claimant takes it (it keeps its damage); two or more: contested, nobody does.
 * Then every side that owns no post is out: its pieces are removed and every side is told.
 */
function captureAndEliminate(w: World, rs: Ruleset, t: number, events: SimEvent[]): void {
  const out = new Set(w.out ?? []);
  const takes: { post: Entity; to: number }[] = [];
  for (const post of w.entities) {
    if (!isCommandPost(rs, post)) continue;
    const max = archetypeOf(rs, post.kind)?.hp ?? 0;
    const next = (e: Entity) => e.id !== post.id && Math.max(Math.abs(e.x - post.x), Math.abs(e.y - post.y)) <= 1;
    if (post.side !== NEUTRAL) {
      if (post.hp >= max * CAPTURE_BELOW) continue;
      // Defenders are units of the owner or an ally that can move (not structures or sites next to it).
      if (w.entities.some((e) => next(e) && !hostile(w, post.side, e.side) && (archetypeOf(rs, e.kind)?.speed ?? 0) > 0 && e.build === undefined)) continue;
    }
    const claimants = new Set<number>();
    for (const e of w.entities) {
      if (!next(e) || out.has(e.side) || !hostile(w, e.side, post.side)) continue;
      const a = archetypeOf(rs, e.kind);
      if (a?.armor !== 'infantry' || a.layer !== 'ground' || has(e, 'disabled')) continue;
      claimants.add(e.side);
    }
    if (claimants.size === 1) takes.push({ post, to: [...claimants][0] as number });
  }
  for (const { post, to } of takes) {
    const from = post.side;
    post.side = to;
    post.order = { type: 'hold' };
    delete post.doctrine;
    delete post.queue;
    events.push({ t: 'captured', tick: t, id: post.id, kind: post.kind, x: post.x, y: post.y, from, to });
    // The new owner knows it took the post: its attack orders on it end at once (allies end theirs
    // when they see it, attackAim).
    for (const e of w.entities) if (e.side === to && e.order.type === 'attack' && e.order.target === post.id) endOrder(e, 'lost-target', t, events);
    // The old owner is told (its report now names the new owner); the new owner knows its post.
    if (w.intel) {
      const report = { id: post.id, side: to, kind: post.kind, x: post.x, y: post.y, hp: post.hp, tick: t, live: false };
      for (const side of from === NEUTRAL ? [to] : [from, to]) {
        const list: Report[] | undefined = w.intel[side];
        if (!list) continue;
        const i = list.findIndex((r) => r.id === post.id);
        if (i >= 0) list[i] = { ...(list[i] as Report), side: to };
        else {
          list.push(report);
          list.sort((a, b) => a.id - b.id);
        }
      }
    }
  }
  // Elimination: after all captures (a side that lost its own post but took another plays on).
  const owners = new Set(w.entities.filter((e) => isCommandPost(rs, e)).map((e) => e.side));
  const eliminated: number[] = [];
  for (let side = 0; side < w.sides; side++) if (!out.has(side) && !owners.has(side)) eliminated.push(side);
  if (eliminated.length > 0) removeSides(w, eliminated, t, events);
}

/**
 * The elimination step: the sides are out, their pieces and projectiles are removed, and every
 * side is told (`eliminated`). Reports of the removed pieces go, and so do old reports that still
 * name such a side as owner of a post it lost unseen (nobody can hold it for a side that is out;
 * who holds it now is learned only by looking again). A side that is out has no reports.
 */
function removeSides(w: World, sides: readonly number[], t: number, events: SimEvent[]): void {
  const removed = new Set(sides);
  const out = new Set(w.out ?? []);
  const ids = new Set(w.entities.filter((e) => removed.has(e.side)).map((e) => e.id));
  w.entities = w.entities.filter((e) => !removed.has(e.side));
  w.projectiles = w.projectiles.filter((p) => !removed.has(p.side));
  for (const side of sides) {
    out.add(side);
    events.push({ t: 'eliminated', tick: t, side });
  }
  w.out = [...out].sort((a, b) => a - b);
  if (w.intel) w.intel = w.intel.map((list, side) => (removed.has(side) ? [] : list.filter((r) => !ids.has(r.id) && !removed.has(r.side))));
}

/**
 * A side gives up (retires) between turns: exactly the elimination step, applied at once — its
 * pieces and projectiles are removed, it is out, and every side is told `eliminated` (nothing
 * else: no positions or plans of the retiring side are revealed). For games with capture rules
 * (several sides); the game decides what follows (docs/design/strategy.md § 9.4, hot-seat).
 * A side that is out already, or not a playing side, is refused (RangeError).
 */
export function retire(world: World, side: number): { world: World; events: SimEvent[] } {
  if (!Number.isInteger(side) || side < 0 || side >= world.sides || world.out?.includes(side)) throw new RangeError('Not a side in the game.');
  const w = structuredClone(world);
  const events: SimEvent[] = [];
  removeSides(w, [side], w.tick, events);
  return { world: w, events };
}
