import {
  archetypeOf,
  cellOf,
  computeNetwork,
  DEFAULT_DOCTRINE,
  dist2,
  frameIndex,
  inWeaponRange,
  observedCells,
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
const RELAY_FORWARD = 5;

/** Value of the Command Post in the lookahead score (it has no build cost). */
const POST_VALUE = 300;

/** How much a loss of own value weighs against the same damage dealt (normal / hard). */
const CAUTION: Record<Difficulty, number> = { easy: 1, normal: 1.2, hard: 1.1 };
/** Lookahead breadth per level: fighters planned per turn beyond the slots, attack targets tried. */
/** Hard: bonus for attacking a target other own units already attack (focus fire). */
const FOCUS_BONUS = 12;
/** Hard: engaged fighters outweighed locally by this factor pull back to the rally point. */
const OUTWEIGHED = 0.8;
const BREADTH: Record<Difficulty, { fighters: number; targets: number; turns: number }> = {
  easy: { fighters: 0, targets: 0, turns: 0 },
  normal: { fighters: 0, targets: 1, turns: 1 },
  hard: { fighters: 4, targets: 3, turns: 1 }
};

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

  // Fighters below the retreat threshold are left to regroup and hold; ordering them back into
  // the fight would only spend a slot on an order the doctrine is meant to prevent.
  const retreating = (u: Entity) => u.hp * 100 < (archetypeOf(ruleset, u.kind)?.hp ?? 0) * AI_DOCTRINE.retreatBelow;
  const known = enemiesOf(obs);
  const fighters = own
    .filter((u) => archetypeOf(ruleset, u.kind)?.weapon && (archetypeOf(ruleset, u.kind)?.speed ?? 0) > 0 && !retreating(u))
    .map((u) => ({ u, d: nearestDistance(u, known) }))
    .sort((a, b) => a.d - b.d || frame(obs, a.u) - frame(obs, b.u))
    .map((x) => x.u);

  // Strategic layer (normal / hard): mass at a rally point in front of the enemy post, then
  // storm it together. The jammer joins in once the storm is on (hard); idle EW units follow
  // the relay truck so they neither box in their own post nor get lost.
  const plan = difficulty === 'easy' ? undefined : assaultPlan(obs, ruleset, difficulty);
  commands.push(...electronicWarfare(obs, ruleset, own, difficulty === 'hard' && (plan?.storming ?? false)));

  const networks: Network[] = [];
  networks[side] = network;
  const valid = (c: Command) => validateCommand(world, ruleset, c, networks).ok;
  const fixed = commands.filter(valid);
  const spotted = known.filter((e) => !obs.ghosts.has(e.id));
  // Engaged fighters (a spotted enemy within reach) fight by the lookahead; the others follow the plan.
  const engaged = (u: Entity): boolean => {
    const reach = (archetypeOf(ruleset, u.kind)?.weapon?.range ?? 0) + 1;
    return spotted.some((e) => dist2(u.x, u.y, e.x, e.y) <= reach * reach);
  };
  let fighting: Command[];
  if (difficulty === 'easy' || !plan) fighting = simpleFighters(obs, ruleset, fighters);
  else {
    const tactical = lookaheadFighters(obs, ruleset, fighters.filter(engaged), fixed, budget - fixed.length, difficulty, plan);
    const strategic = assault(obs, ruleset, plan, fighters.filter((u) => !engaged(u)));
    fighting = [...tactical, ...strategic];
  }
  // Spend order slots only on orders the engine will accept.
  return [...fixed, ...fighting.filter(valid)].slice(0, budget);
}

/** Fighters within this many cells count as company; a unit never advances on its own. */
const COMPANY_RANGE = 3;
/** Share of a unit's value charged for ending a turn where no own unit can see (ambush risk). */
const UNSEEN_RISK = 0.15;

/** Easy: the nearest spotted enemy the unit can hit, else advance on the nearest known position with company. */
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
    const target = nearest(unit, reachable.length > 0 ? reachable : enemies, obs);
    if (!target) {
      const objective = nearest(unit, known, obs);
      if (!objective || !hasCompany(unit, fighters, commands)) continue;
      const goal = standOff(obs, ruleset, unit, objective);
      if ((unit.order.type !== 'move' || unit.order.x !== goal.x || unit.order.y !== goal.y) && unit.order.type !== 'attack') {
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
 * each, every candidate order is simulated for one turn together with the orders chosen so far.
 * The prediction holds everything the side knows: spotted enemies and ghosts hold their cells
 * and fire (so a lone push into a held post is seen to fail), ending a turn where no own unit
 * can see costs a share of the unit's value, and a slot is spent only when the best order beats
 * keeping the current one by SLOT_MARGIN.
 */
function lookaheadFighters(obs: Observation, ruleset: Ruleset, fighters: readonly Entity[], fixed: readonly Command[], slots: number, difficulty: Difficulty, plan: AssaultPlan): Command[] {
  const { world, side } = obs;
  // Prediction: no fog (only what the side knows is in the world anyway) and orders always arrive.
  const predict: Ruleset = { ...ruleset, fog: false, commandNetwork: false };
  const base: World = { ...world };
  delete base.intel;
  const known = enemiesOf(obs);
  const spotted = known.filter((e) => !obs.ghosts.has(e.id));
  const objective = known.find((e) => e.kind === 'command-post') ?? known[0];
  const seen = observedCells(world, ruleset, side, obs.network);
  const value = (w: World, s: number): number =>
    w.entities.reduce((sum, e) => {
      if (e.side !== s) return sum;
      const arch = archetypeOf(ruleset, e.kind);
      if (!arch) return sum;
      return sum + ((e.kind === 'command-post' ? POST_VALUE : arch.cost) * e.hp) / arch.hp;
    }, 0);
  const unitValue = (e: Entity): number => {
    const arch = archetypeOf(ruleset, e.kind);
    return arch ? ((e.kind === 'command-post' ? POST_VALUE : arch.cost) * e.hp) / arch.hp : 0;
  };
  const ownBefore = value(base, side);
  const enemyBefore = sumEnemies(base, side, value);
  const caution = CAUTION[difficulty];
  /** Score of one simulated turn: value taken from the enemy minus own value lost, progress, risk. */
  const horizon = ruleset.ticksPerTurn * BREADTH[difficulty].turns;
  const score = (commands: readonly Command[], unit: Entity): number => {
    const after = runTicks(base, predict, commands, horizon).world;
    const dealt = enemyBefore - sumEnemies(after, side, value);
    const taken = ownBefore - value(after, side);
    const moved = after.entities.find((e) => e.id === unit.id);
    // Without a fight in reach, getting closer to the enemy's post (or last known unit) counts.
    const progress = objective && moved ? (dist2(unit.x, unit.y, objective.x, objective.y) - dist2(moved.x, moved.y, objective.x, objective.y)) / 20 : 0;
    const risk = moved && seen[cellOf(world.map, moved.x, moved.y)] !== 1 ? UNSEEN_RISK * unitValue(moved) : 0;
    return dealt - caution * taken + progress - risk;
  };

  const chosen: Command[] = [...fixed];
  const out: Command[] = [];
  const breadth = BREADTH[difficulty];
  const ownFighters = world.entities.filter((e) => e.side === side && archetypeOf(ruleset, e.kind)?.weapon);
  // Hard: targets other own units already attack (standing or chosen this turn) get a focus bonus.
  const focused = (target: number): boolean =>
    chosen.some((c) => c.order.type === 'attack' && c.order.target === target) || ownFighters.some((f) => f.order.type === 'attack' && f.order.target === target);
  // Hard: a fighter outweighed by the spotted enemies around it pulls back to the rally point.
  const outweighed = (unit: Entity): boolean => {
    const near = (a: Positioned, b: Positioned, r: number) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) <= r;
    const ours = ownFighters.filter((f) => near(f, unit, COMPANY_RANGE)).reduce((sum, f) => sum + unitValue(f), 0);
    const theirs = spotted.filter((e) => archetypeOf(ruleset, e.kind)?.weapon && near(e, unit, COMPANY_RANGE + 1)).reduce((sum, e) => sum + unitValue(e), 0);
    return ours < theirs * OUTWEIGHED;
  };
  for (const unit of fighters.slice(0, Math.max(slots, 0) + breadth.fighters)) {
    if (out.length >= slots) break;
    const candidates = candidateOrders(obs, ruleset, unit, fighters, chosen, spotted, objective, breadth.targets);
    if (difficulty === 'hard' && outweighed(unit) && (unit.x !== plan.rally.x || unit.y !== plan.rally.y)) candidates.push({ type: 'move', x: plan.rally.x, y: plan.rally.y });
    const keep = score(chosen, unit);
    let best: { order: Order; s: number } | undefined;
    for (const order of candidates) {
      const command: Command = { side, unit: unit.id, order, doctrine: AI_DOCTRINE };
      const bonus = difficulty === 'hard' && order.type === 'attack' && focused(order.target) ? FOCUS_BONUS : 0;
      const s = score([...chosen, command], unit) + bonus;
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

/** Distance of the rally point in front of the enemy post (outside its defenders' sight). */
const RALLY_DIST = 6;
/** Fighters within this many cells of the rally point count as rallied. */
const RALLY_RADIUS = 2;
/** Share of the fighters that must be rallied before the storm: hard waits for nearly all, normal storms earlier. */
const RALLY_SHARE: Record<Difficulty, number> = { easy: 0, normal: 0.8, hard: 0.9 };

interface AssaultPlan {
  readonly objective: Entity;
  readonly rally: { x: number; y: number };
  /** All own mobile fighters (in contact or not). */
  readonly all: readonly Entity[];
  /** Enough fighters have gathered: storm the post. */
  readonly storming: boolean;
}

/** The side's plan of attack from what it knows: rally point in front of the enemy post and whether to storm. */
function assaultPlan(obs: Observation, ruleset: Ruleset, difficulty: Difficulty): AssaultPlan | undefined {
  const { world, side } = obs;
  const objective = enemiesOf(obs).find((e) => e.kind === 'command-post');
  const home = world.entities.find((e) => e.side === side && e.kind === 'command-post');
  if (!objective || !home) return undefined;
  const dx = home.x - objective.x;
  const dy = home.y - objective.y;
  const len = Math.hypot(dx, dy) || 1;
  const rally = { x: Math.round(objective.x + (dx / len) * RALLY_DIST), y: Math.round(objective.y + (dy / len) * RALLY_DIST) };
  const all = world.entities.filter((e) => e.side === side && archetypeOf(ruleset, e.kind)?.weapon && (archetypeOf(ruleset, e.kind)?.speed ?? 0) > 0);
  const rallied = all.filter((f) => Math.max(Math.abs(f.x - rally.x), Math.abs(f.y - rally.y)) <= RALLY_RADIUS).length;
  // Once the storm has begun (fighters past the rally point) it goes on; a tiny force storms at once.
  const past = all.filter((f) => dist2(f.x, f.y, objective.x, objective.y) < dist2(rally.x, rally.y, objective.x, objective.y)).length;
  const storming = all.length <= 2 || rallied + past >= Math.ceil(all.length * RALLY_SHARE[difficulty]);
  return { objective, rally, all, storming };
}

/**
 * Rally, then storm: fighters move to free cells around a rally point RALLY_DIST in front of the
 * known enemy post (on the line to the own post); once RALLY_SHARE of them are there, all of
 * them advance on the post together (artillery to its stand-off). Piecemeal pushes into a held
 * post are what a one-turn lookahead cannot see through, so this layer plans the approach.
 */
function assault(obs: Observation, ruleset: Ruleset, plan: AssaultPlan, fighters: readonly Entity[]): Command[] {
  const { world, side } = obs;
  const { objective, rally, all } = plan;
  const commands: Command[] = [];
  if (plan.storming) {
    for (const unit of fighters) {
      if (unit.order.type === 'attack') continue;
      // Artillery shells the post itself: from its full range once the stormers report the post,
      // otherwise from as close as it can see (a stand-off with nothing spotted would hold forever).
      if ((archetypeOf(ruleset, unit.kind)?.weapon?.minRange ?? 0) > 0) {
        commands.push({ side, unit: unit.id, order: { type: 'attack', target: objective.id }, doctrine: AI_DOCTRINE });
        continue;
      }
      const goal = standOff(obs, ruleset, unit, objective);
      if (unit.order.type === 'move' && unit.order.x === goal.x && unit.order.y === goal.y) continue;
      commands.push({ side, unit: unit.id, order: { type: 'move', x: goal.x, y: goal.y }, doctrine: AI_DOCTRINE });
    }
    return commands;
  }
  // Rally cells: free passable cells nearest to the rally point, one per fighter, farthest fighters first.
  const taken = new Set(world.entities.map((e) => cellOf(world.map, e.x, e.y)));
  const spots: { x: number; y: number }[] = [];
  for (let r = 0; r <= RALLY_RADIUS + 1 && spots.length < all.length; r++) {
    // Ring by ring, in the side's own frame (mirrored sides pick mirrored cells).
    const ring: { x: number; y: number; f: number }[] = [];
    for (let y = rally.y - r; y <= rally.y + r; y++) {
      for (let x = rally.x - r; x <= rally.x + r; x++) {
        if (Math.max(Math.abs(x - rally.x), Math.abs(y - rally.y)) !== r) continue;
        if (x < 0 || y < 0 || x >= world.map.w || y >= world.map.h || !passable(world.map, ruleset, x, y, 'ground')) continue;
        const c = cellOf(world.map, x, y);
        if (taken.has(c)) continue;
        taken.add(c);
        ring.push({ x, y, f: frameIndex(c, side, world.map.w * world.map.h) });
      }
    }
    ring.sort((a, b) => a.f - b.f);
    for (const cell of ring) if (spots.length < all.length) spots.push({ x: cell.x, y: cell.y });
  }
  const order = [...fighters].sort((a, b) => dist2(b.x, b.y, rally.x, rally.y) - dist2(a.x, a.y, rally.x, rally.y) || frame(obs, a) - frame(obs, b));
  for (const unit of order) {
    if (Math.max(Math.abs(unit.x - rally.x), Math.abs(unit.y - rally.y)) <= RALLY_RADIUS) continue; // already there
    const spot = spots.shift();
    if (!spot) break;
    if (unit.order.type === 'move' && unit.order.x === spot.x && unit.order.y === spot.y) continue;
    commands.push({ side, unit: unit.id, order: { type: 'move', x: spot.x, y: spot.y }, doctrine: AI_DOCTRINE });
  }
  return commands;
}

/** Whether other fighters are close by, or are advancing with this turn's orders: no lone pushes. */
function hasCompany(unit: Entity, fighters: readonly Entity[], chosen: readonly Command[]): boolean {
  const near = fighters.some((f) => f.id !== unit.id && Math.max(Math.abs(f.x - unit.x), Math.abs(f.y - unit.y)) <= COMPANY_RANGE);
  const advancing = chosen.some((c) => c.unit !== unit.id && c.order.type === 'move');
  return near || advancing;
}

/**
 * Where to head when advancing on `objective`: a weapon with a minimum range stops short of it
 * (a Field Gun never drives onto the post it is to shell), at its range along the line from the
 * objective towards the unit, on the nearest passable cell.
 */
function standOff(obs: Observation, ruleset: Ruleset, unit: Entity, objective: Positioned): { x: number; y: number } {
  const arch = archetypeOf(ruleset, unit.kind);
  const weapon = arch?.weapon;
  if (!weapon || weapon.minRange <= 0) return { x: objective.x, y: objective.y };
  const dx = unit.x - objective.x;
  const dy = unit.y - objective.y;
  const len = Math.hypot(dx, dy) || 1;
  const keep = Math.max(weapon.minRange, weapon.range - 1);
  const want = { x: Math.round(objective.x + (dx / len) * keep), y: Math.round(objective.y + (dy / len) * keep) };
  const { w, h } = obs.world.map;
  let best: { x: number; y: number; d: number; f: number } | undefined;
  for (let y = Math.max(0, want.y - 2); y <= Math.min(h - 1, want.y + 2); y++) {
    for (let x = Math.max(0, want.x - 2); x <= Math.min(w - 1, want.x + 2); x++) {
      if (!passable(obs.world.map, ruleset, x, y, arch?.layer ?? 'ground')) continue;
      if (dist2(x, y, objective.x, objective.y) < weapon.minRange ** 2) continue;
      const d = dist2(x, y, want.x, want.y);
      const f = frameIndex(cellOf(obs.world.map, x, y), obs.side, w * h);
      if (!best || d < best.d || (d === best.d && f < best.f)) best = { x, y, d, f };
    }
  }
  return best ? { x: best.x, y: best.y } : { x: unit.x, y: unit.y };
}

/** Orders worth trying for one fighter: hold, attack one of the two nearest spotted enemies, advance with company, regroup when hurt. */
function candidateOrders(obs: Observation, ruleset: Ruleset, unit: Entity, fighters: readonly Entity[], chosen: readonly Command[], spotted: readonly Entity[], objective: Entity | undefined, targets: number): Order[] {
  const orders: Order[] = [{ type: 'hold' }];
  const byDistance = [...spotted].sort((a, b) => dist2(unit.x, unit.y, a.x, a.y) - dist2(unit.x, unit.y, b.x, b.y) || frame(obs, a) - frame(obs, b));
  for (const t of byDistance.slice(0, targets)) orders.push({ type: 'attack', target: t.id });
  if (objective && hasCompany(unit, fighters, chosen)) {
    const goal = standOff(obs, ruleset, unit, objective);
    if (goal.x !== unit.x || goal.y !== unit.y) orders.push({ type: 'move', x: goal.x, y: goal.y });
  }
  const arch = archetypeOf(ruleset, unit.kind);
  if (arch && unit.hp * 2 < arch.hp && ruleset.commandNetwork) orders.push({ type: 'regroup' });
  return orders;
}

const sameOrder = (a: Order, b: Order): boolean => JSON.stringify(a) === JSON.stringify(b);

/**
 * Hard: the jammer sets up where it cuts off a known enemy relay or post while staying in
 * contact; the tracer escorts the relay truck (burn-through and direction finding).
 */
function electronicWarfare(obs: Observation, ruleset: Ruleset, own: readonly Entity[], jamming: boolean): Command[] {
  const { world, side } = obs;
  const commands: Command[] = [];
  const truck = own.find((u) => u.kind === 'mast-truck') ?? world.entities.find((u) => u.side === side && u.kind === 'mast-truck');
  const follow = (unit: Entity) => {
    if (truck && (unit.order.type !== 'escort' || unit.order.target !== truck.id)) commands.push({ side, unit: unit.id, order: { type: 'escort', target: truck.id } });
  };
  for (const unit of own) {
    const ew = archetypeOf(ruleset, unit.kind)?.ew;
    if (!ew) continue;
    if (ew.role === 'tracer') {
      follow(unit);
      continue;
    }
    if (unit.order.type === 'deploy' || (unit.deploy ?? 0) >= ruleset.ticksPerTurn) continue;
    const spot = jamming ? jamSpot(obs, ruleset, unit, ew.radius) : undefined;
    if (!spot) {
      follow(unit);
      continue;
    }
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
      if (coverage[cell] !== 1 || obs.jammed[cell] === 1 || Math.abs(x - post.x) > RELAY_FORWARD || Math.abs(y - post.y) > RELAY_FORWARD) continue;
      if (!passable(world.map, ruleset, x, y, 'ground')) continue;
      if (taken(x, y)) continue;
      // Out of reach of known enemy fighters first (a relay lost to a Warden freezes the whole advance).
      const d = dangerAt(obs, ruleset, x, y) * 1000 + dist2(x, y, enemyPost.x, enemyPost.y);
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
      if (coverage[cell] !== 1 || obs.jammed[cell] === 1 || !passable(world.map, ruleset, x, y, 'ground')) continue;
      if (!targets.some((r) => dist2(x, y, r.x, r.y) <= radius * radius)) continue;
      const taken =
        world.entities.some((e) => e.side === side && e.id !== jammer.id && e.x === x && e.y === y && staysPut(ruleset, e)) ||
        known.some((r) => r.x === x && r.y === y);
      if (taken) continue;
      // Prefer cells out of reach of known enemy fighters, then the nearest to the jammer.
      const d = dangerAt(obs, ruleset, x, y) * 1000 + dist2(x, y, jammer.x, jammer.y);
      const f = frameIndex(cell, side, cells);
      if (!best || d < best.d || (d === best.d && f < best.f)) best = { x, y, d, f };
    }
  }
  // No spot out of reach of known enemy fighters: the jammer stays with the truck for now.
  return best && best.d < 1000 ? { x: best.x, y: best.y } : undefined;
}

/** How many known enemy fighters (sighted or last reported) could reach cell (x, y) within a step of their range. */
function dangerAt(obs: Observation, ruleset: Ruleset, x: number, y: number): number {
  return enemiesOf(obs).reduce((count, r) => {
    const range = archetypeOf(ruleset, r.kind)?.weapon?.range;
    if (range === undefined) return count;
    const reach = range + 1;
    return count + (dist2(x, y, r.x, r.y) <= reach * reach ? 1 : 0);
  }, 0);
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

/** Cell index of an entity in its side's own frame: tie-breaks that stay mirror-consistent. */
const frame = (obs: Observation, e: Positioned): number => frameIndex(cellOf(obs.world.map, e.x, e.y), obs.side, obs.world.map.w * obs.world.map.h);

function nearest<T extends Positioned>(unit: Entity, candidates: readonly T[], obs?: Observation): T | undefined {
  let best: T | undefined;
  let bestD = Infinity;
  for (const e of candidates) {
    const d = dist2(unit.x, unit.y, e.x, e.y);
    const earlier = best !== undefined && (obs ? frame(obs, e) < frame(obs, best) : e.id < best.id);
    if (d < bestD || (d === bestD && earlier)) {
      best = e;
      bestD = d;
    }
  }
  return best;
}
