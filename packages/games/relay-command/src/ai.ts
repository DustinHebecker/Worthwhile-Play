import {
  archetypeOf,
  cellOf,
  computeNetwork,
  DEFAULT_DOCTRINE,
  dist2,
  frameIndex,
  inWeaponRange,
  passable,
  runTicks,
  validateCommand,
  type Command,
  type Doctrine,
  type Entity,
  type Network,
  type Observation,
  type Order,
  type Ruleset,
  type World
} from '@wp/strategy-engine';

export const DIFFICULTIES = ['easy', 'normal', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/** Squared-distance slack within which a truck's current spot counts as good enough. */
const SPOT_TOLERANCE = 8;

/** Standing doctrine the opponent gives its fighters. */
const AI_DOCTRINE: Doctrine = { ...DEFAULT_DOCTRINE, retreatBelow: 25, lostContact: 'keep' };

/** How far ahead of its Command Post the opponent may set up its relay truck (cells per axis). */
const RELAY_FORWARD = 4;

/** Value of the Command Post in the lookahead score (it has no build cost). */
const POST_VALUE = 300;

/** How much a loss of own value weighs against the same damage dealt (normal / hard). */
const CAUTION: Record<Difficulty, number> = { easy: 1, normal: 1.2, hard: 1 };

/** A new order must beat keeping the current one by this much to be worth an order slot. */
const SLOT_MARGIN = 2;

/**
 * Scripted opponent (docs/design/strategy.md § 11). Deterministic, and honest by construction:
 * it receives only its side's observation (own units, its own radio net, enemies as reported),
 * never the world or the player's draft. Like the player it may only order units in contact
 * and only as many as its order slots allow.
 * - all levels: the relay truck drives to the most forward covered cell and sets up there;
 * - easy: fighters engage the nearest spotted enemy they can hit, or advance on a known position;
 * - normal: fighters choose among candidate orders by a one-turn lookahead (spotted enemies are
 *   assumed to hold), spending a slot only where it pays;
 * - hard: as normal, plus electronic warfare (jammer set up near known enemy relays and posts,
 *   tracer with the relay truck) and a bolder weighting of damage dealt against damage taken.
 */
export function planAi(obs: Observation, ruleset: Ruleset, difficulty: Difficulty = 'normal'): Command[] {
  const { world, side, network } = obs;
  const inContact = (e: Entity) => !ruleset.commandNetwork || network.coverage[cellOf(world.map, e.x, e.y)] === 1;
  const budget = ruleset.commandNetwork ? network.slots : Number.POSITIVE_INFINITY;
  const own = world.entities.filter((e) => e.side === side && inContact(e));
  const commands: Command[] = [];

  for (const truck of own) {
    if (!archetypeOf(ruleset, truck.kind)?.comms?.needsDeploy || truck.order.type === 'deploy') continue;
    if ((truck.deploy ?? 0) >= ruleset.ticksPerTurn) continue; // already set up: leave it standing
    const spot = relaySpot(obs, ruleset, truck);
    if (!spot) continue;
    if (truck.x === spot.x && truck.y === spot.y) commands.push({ side, unit: truck.id, order: { type: 'deploy' } });
    else if (truck.order.type !== 'move' || truck.order.x !== spot.x || truck.order.y !== spot.y) {
      commands.push({ side, unit: truck.id, order: { type: 'move', x: spot.x, y: spot.y } });
    }
  }

  if (difficulty === 'hard') commands.push(...electronicWarfare(obs, ruleset, own));

  // Fighters below the retreat threshold are left to regroup and hold; ordering them back into
  // the fight would only spend a slot on an order the doctrine is meant to prevent.
  const retreating = (u: Entity) => u.hp * 100 < (archetypeOf(ruleset, u.kind)?.hp ?? 0) * AI_DOCTRINE.retreatBelow;
  const known = enemiesOf(obs);
  const fighters = own
    .filter((u) => archetypeOf(ruleset, u.kind)?.weapon && (archetypeOf(ruleset, u.kind)?.speed ?? 0) > 0 && !retreating(u))
    .map((u) => ({ u, d: nearestDistance(u, known) }))
    .sort((a, b) => a.d - b.d || a.u.id - b.u.id)
    .map((x) => x.u);

  const networks: Network[] = [];
  networks[side] = network;
  const valid = (c: Command) => validateCommand(world, ruleset, c, networks).ok;
  const fixed = commands.filter(valid);
  const fighting = difficulty === 'easy' ? simpleFighters(obs, ruleset, fighters) : lookaheadFighters(obs, ruleset, fighters, fixed, budget - fixed.length, difficulty);
  // Spend order slots only on orders the engine will accept.
  return [...fixed, ...fighting.filter(valid)].slice(0, budget);
}

/** Easy: the nearest spotted enemy the unit can hit, else advance on the nearest known position. */
function simpleFighters(obs: Observation, ruleset: Ruleset, fighters: readonly Entity[]): Command[] {
  const { world, side } = obs;
  const known = enemiesOf(obs);
  const enemies = known.filter((e) => !obs.ghosts.has(e.id));
  const commands: Command[] = [];
  for (const unit of fighters) {
    const arch = archetypeOf(ruleset, unit.kind);
    if (!arch?.weapon) continue;
    const minRange = arch.weapon.minRange;
    const reachable = enemies.filter((e) => dist2(unit.x, unit.y, e.x, e.y) >= minRange * minRange);
    const target = nearest(unit, reachable.length > 0 ? reachable : enemies);
    if (!target) {
      const goal = nearest(unit, known);
      if (goal && (unit.order.type !== 'move' || unit.order.x !== goal.x || unit.order.y !== goal.y) && unit.order.type !== 'attack') {
        commands.push({ side, unit: unit.id, order: { type: 'move', x: goal.x, y: goal.y }, doctrine: AI_DOCTRINE });
      }
      continue;
    }
    if (inWeaponRange(world, ruleset, unit, arch, target) && unit.order.type === 'hold') continue;
    if (unit.order.type === 'attack' && unit.order.target === target.id) continue;
    commands.push({ side, unit: unit.id, order: { type: 'attack', target: target.id }, doctrine: AI_DOCTRINE });
  }
  return commands;
}

/**
 * Normal / hard: greedy one-turn lookahead. Fighters are taken nearest to the enemy first; for
 * each, every candidate order is simulated for one turn together with the orders chosen so far
 * (spotted enemies assumed to hold, ghosts left out), and the best one is kept if it beats
 * keeping the current order by SLOT_MARGIN and a slot is left.
 */
function lookaheadFighters(obs: Observation, ruleset: Ruleset, fighters: readonly Entity[], fixed: readonly Command[], slots: number, difficulty: Difficulty): Command[] {
  const { world, side } = obs;
  // Prediction: no fog (only what the side knows is in the world anyway) and orders always arrive.
  const predict: Ruleset = { ...ruleset, fog: false, commandNetwork: false };
  const base: World = { ...world, entities: world.entities.filter((e) => !obs.ghosts.has(e.id)) };
  delete base.intel;
  const known = enemiesOf(obs);
  const spotted = known.filter((e) => !obs.ghosts.has(e.id));
  const objective = known.find((e) => e.kind === 'command-post') ?? known[0];
  const value = (w: World, s: number): number =>
    w.entities.reduce((sum, e) => {
      if (e.side !== s) return sum;
      const arch = archetypeOf(ruleset, e.kind);
      if (!arch) return sum;
      return sum + ((e.kind === 'command-post' ? POST_VALUE : arch.cost) * e.hp) / arch.hp;
    }, 0);
  const ownBefore = value(base, side);
  const enemyBefore = base.entities.filter((e) => e.side !== side).length > 0 ? sumEnemies(base, side, value) : 0;
  const caution = CAUTION[difficulty];
  /** Score of one simulated turn: value taken from the enemy minus own value lost, plus progress. */
  const score = (commands: readonly Command[], unit: Entity): number => {
    const after = runTicks(base, predict, commands, ruleset.ticksPerTurn).world;
    const dealt = enemyBefore - sumEnemies(after, side, value);
    const taken = ownBefore - value(after, side);
    const moved = after.entities.find((e) => e.id === unit.id);
    // Without a fight in reach, getting closer to the enemy's post (or last known unit) counts.
    const progress = objective && moved ? (dist2(unit.x, unit.y, objective.x, objective.y) - dist2(moved.x, moved.y, objective.x, objective.y)) / 20 : 0;
    return dealt - caution * taken + progress;
  };

  const chosen: Command[] = [...fixed];
  const out: Command[] = [];
  for (const unit of fighters) {
    if (out.length >= slots) break;
    const candidates = candidateOrders(ruleset, unit, spotted, objective);
    const keep = score(chosen, unit);
    let best: { order: Order; s: number } | undefined;
    for (const order of candidates) {
      const command: Command = { side, unit: unit.id, order, doctrine: AI_DOCTRINE };
      const s = score([...chosen, command], unit);
      if (!best || s > best.s) best = { order, s };
    }
    if (best && best.s > keep + SLOT_MARGIN && !sameOrder(unit.order, best.order)) {
      const command: Command = { side, unit: unit.id, order: best.order, doctrine: AI_DOCTRINE };
      chosen.push(command);
      out.push(command);
    }
  }
  return out;
}

const sumEnemies = (w: World, side: number, value: (w: World, s: number) => number): number => {
  let total = 0;
  for (let s = 0; s < w.sides; s++) if (s !== side) total += value(w, s);
  return total;
};

/** Orders worth trying for one fighter: hold, attack one of the three nearest spotted enemies, advance, regroup. */
function candidateOrders(ruleset: Ruleset, unit: Entity, spotted: readonly Entity[], objective: Entity | undefined): Order[] {
  const orders: Order[] = [{ type: 'hold' }];
  const byDistance = [...spotted].sort((a, b) => dist2(unit.x, unit.y, a.x, a.y) - dist2(unit.x, unit.y, b.x, b.y) || a.id - b.id);
  for (const t of byDistance.slice(0, 3)) orders.push({ type: 'attack', target: t.id });
  if (objective) orders.push({ type: 'move', x: objective.x, y: objective.y });
  const arch = archetypeOf(ruleset, unit.kind);
  if (arch && unit.hp * 2 < arch.hp && ruleset.commandNetwork) orders.push({ type: 'regroup' });
  return orders;
}

const sameOrder = (a: Order, b: Order): boolean => JSON.stringify(a) === JSON.stringify(b);

/**
 * Hard: the jammer sets up where it cuts off a known enemy relay or post while staying in
 * contact; the tracer escorts the relay truck (burn-through and direction finding).
 */
function electronicWarfare(obs: Observation, ruleset: Ruleset, own: readonly Entity[]): Command[] {
  const { world, side } = obs;
  const commands: Command[] = [];
  for (const unit of own) {
    const ew = archetypeOf(ruleset, unit.kind)?.ew;
    if (!ew) continue;
    if (ew.role === 'tracer') {
      const truck = own.find((u) => u.kind === 'mast-truck') ?? world.entities.find((u) => u.side === side && u.kind === 'mast-truck');
      if (truck && (unit.order.type !== 'escort' || unit.order.target !== truck.id)) commands.push({ side, unit: unit.id, order: { type: 'escort', target: truck.id } });
      continue;
    }
    if (unit.order.type === 'deploy' || (unit.deploy ?? 0) >= ruleset.ticksPerTurn) continue;
    const spot = jamSpot(obs, ruleset, unit, ew.radius);
    if (!spot) continue;
    if (unit.x === spot.x && unit.y === spot.y) commands.push({ side, unit: unit.id, order: { type: 'deploy' } });
    else if (unit.order.type !== 'move' || unit.order.x !== spot.x || unit.order.y !== spot.y) commands.push({ side, unit: unit.id, order: { type: 'move', x: spot.x, y: spot.y } });
  }
  return commands;
}

/**
 * Where to set up a relay truck: the passable cell closest to the enemy Command Post that is
 * covered by the network *without* this truck (so the truck is still in contact when it
 * arrives and can be told to set up), at most RELAY_FORWARD cells from the own post along each
 * axis. Ties are broken in the side's own frame, so mirrored positions give mirrored choices.
 */
function relaySpot(obs: Observation, ruleset: Ruleset, truck: Entity): { x: number; y: number } | undefined {
  const { world, side } = obs;
  const post = world.entities.find((e) => e.side === side && e.kind === 'command-post');
  const known = enemiesOf(obs);
  const enemyPost = known.find((e) => e.kind === 'command-post');
  if (!post || !enemyPost) return undefined;
  const without = { ...world, entities: world.entities.filter((e) => e.id !== truck.id) };
  const coverage = computeNetwork(without, ruleset, side).coverage;
  const cells = world.map.w * world.map.h;
  // Cells to avoid: own units that stay put, and enemies the side knows to stand there (spotted
  // units, reported structures). Enemy orders are unknown, so spotted enemies always count.
  const taken = (x: number, y: number): boolean =>
    world.entities.some((e) => e.side === side && e.id !== truck.id && e.x === x && e.y === y && staysPut(ruleset, e)) ||
    known.some((r) => r.x === x && r.y === y && (!obs.ghosts.has(r.id) || archetypeOf(ruleset, r.kind)?.speed === 0));
  let best: { x: number; y: number; d: number; f: number } | undefined;
  let here: number | undefined;
  for (let y = 0; y < world.map.h; y++) {
    for (let x = 0; x < world.map.w; x++) {
      const cell = cellOf(world.map, x, y);
      if (coverage[cell] !== 1 || Math.abs(x - post.x) > RELAY_FORWARD || Math.abs(y - post.y) > RELAY_FORWARD) continue;
      if (!passable(world.map, ruleset, x, y, 'ground')) continue;
      if (taken(x, y)) continue;
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

/**
 * Where to set up a jammer: a passable cell inside the own coverage (without the jammer itself)
 * within `radius` of a known enemy relay or post, closest to the jammer (ties in the side's
 * frame). Only reports are used, so positions out of sight are the last known ones.
 */
function jamSpot(obs: Observation, ruleset: Ruleset, jammer: Entity, radius: number): { x: number; y: number } | undefined {
  const { world, side } = obs;
  const known = enemiesOf(obs);
  const targets = known.filter((r) => archetypeOf(ruleset, r.kind)?.comms);
  if (targets.length === 0) return undefined;
  const without = { ...world, entities: world.entities.filter((e) => e.id !== jammer.id) };
  const coverage = computeNetwork(without, ruleset, side).coverage;
  const cells = world.map.w * world.map.h;
  let best: { x: number; y: number; d: number; f: number } | undefined;
  for (let y = 0; y < world.map.h; y++) {
    for (let x = 0; x < world.map.w; x++) {
      const cell = cellOf(world.map, x, y);
      if (coverage[cell] !== 1 || !passable(world.map, ruleset, x, y, 'ground')) continue;
      if (!targets.some((r) => dist2(x, y, r.x, r.y) <= radius * radius)) continue;
      const taken =
        world.entities.some((e) => e.side === side && e.id !== jammer.id && e.x === x && e.y === y && staysPut(ruleset, e)) ||
        known.some((r) => r.x === x && r.y === y);
      if (taken) continue;
      const d = dist2(x, y, jammer.x, jammer.y);
      const f = frameIndex(cell, side, cells);
      if (!best || d < best.d || (d === best.d && f < best.f)) best = { x, y, d, f };
    }
  }
  return best && { x: best.x, y: best.y };
}

const staysPut = (ruleset: Ruleset, e: Entity): boolean => {
  const arch = archetypeOf(ruleset, e.kind);
  return arch?.layer === 'ground' && (arch.speed === 0 || e.order.type === 'hold' || e.order.type === 'deploy');
};

/** Enemies the side knows of: current sightings and last reports. */
const enemiesOf = (obs: Observation): Entity[] => obs.world.entities.filter((e) => e.side !== obs.side);

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
