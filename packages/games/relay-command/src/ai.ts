import {
  archetypeOf,
  cellOf,
  computeNetwork,
  DEFAULT_DOCTRINE,
  depositAt,
  dist2,
  droneState,
  flowField,
  incomeOfSide,
  MAX_QUEUE,
  frameIndexIn,
  frameOf,
  inWeaponRange,
  observedCells,
  passable,
  regions,
  canReach,
  runTicks,
  validateCommand,
  hostile,
  NEUTRAL,
  type Command,
  type Doctrine,
  type Entity,
  type Network,
  type Observation,
  type Order,
  type Ruleset,
  type World,
  UNKNOWN_LEFT
} from '@wp/strategy-engine';

export const DIFFICULTIES = ['easy', 'normal', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/** Squared-distance slack within which a truck's current spot counts as good enough. */
const SPOT_TOLERANCE = 8;

/** Standing doctrine the opponent gives its fighters. */
const AI_DOCTRINE: Doctrine = { ...DEFAULT_DOCTRINE, retreatBelow: 25, lostContact: 'keep' };

/** How far ahead of its Command Post the opponent may set up its relay truck (cells per axis). */
const RELAY_FORWARD = 8;

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
 * - several sides (normal / hard, docs/design/strategy.md § 9.4): the target post is chosen by
 *   distance, known defence and damage (`objectiveOf`), neutral posts are taken over by infantry,
 *   a damaged own post with raiders near gets a guard, and the relay truck moves to reconnect
 *   fighters cut off away from the objective;
 * - normal / hard: a Scout Car without an order puts its drone up (it escorts the car);
 * - hard: as normal, plus electronic warfare (jammer set up near known enemy relays and posts,
 *   tracer with the relay truck) and a bolder weighting of damage dealt against damage taken.
 */
export function planAi(observation: Observation, ruleset: Ruleset, difficulty: Difficulty = 'normal'): Command[] {
  const obs = withoutDrones(observation, ruleset);
  const { world, side, network } = obs;
  const inContact = (e: Entity) => !ruleset.commandNetwork || network.coverage[cellOf(world.map, e.x, e.y)] === 1;
  const budget = ruleset.commandNetwork ? network.slots : Number.POSITIVE_INFINITY;
  const own = world.entities.filter((e) => e.side === side && inContact(e));
  const commands: Command[] = [];

  // Economy (I6a): spend first, on at most half the slots, so the army still gets its orders.
  if (ruleset.economy) commands.push(...economyOrders(obs, ruleset, own, difficulty, Math.max(1, Math.floor(budget / 2))));

  // Fighters cut off from the net away from the current objective (left behind when a target
  // fell or the objective changed): the relay truck moves to bring them back into contact.
  // Capture rules only: two-side games keep their measured behaviour (PR #24 review).
  const cutOff = ruleset.capture ? strandedFighters(obs, ruleset) : [];
  for (const truck of own) {
    if (!archetypeOf(ruleset, truck.kind)?.comms?.needsDeploy) continue;
    const reconnect = cutOff.length >= STRANDED_MIN ? relaySpot(obs, ruleset, truck, cutOff) : undefined;
    const settled = truck.order.type === 'deploy' || (truck.deploy ?? 0) >= ruleset.ticksPerTurn;
    // Already set up (or setting up) where it is to stand: leave it standing.
    if (settled && (!reconnect || (reconnect.x === truck.x && reconnect.y === truck.y))) continue;
    const spot = reconnect ?? relaySpot(obs, ruleset, truck);
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
  // Damaged own posts with raiders near get a guard first (capture rule): it leaves the attack.
  const guarded = ruleset.capture ? guardPosts(obs, ruleset, own) : { commands: [], guards: new Set<number>() };
  commands.push(...guarded.commands);
  const fighters = own
    .filter((u) => archetypeOf(ruleset, u.kind)?.weapon && (archetypeOf(ruleset, u.kind)?.speed ?? 0) > 0 && !retreating(u) && !guarded.guards.has(u.id))
    .map((u) => ({ u, d: nearestDistance(u, known) }))
    .sort((a, b) => a.d - b.d || frame(obs, a.u) - frame(obs, b.u))
    .map((x) => x.u);

  // Strategic layer (normal / hard): mass at a rally point in front of the enemy post, then
  // storm it together. The jammer joins in once the storm is on (hard); idle EW units follow
  // the relay truck so they neither box in their own post nor get lost.
  const plan = difficulty === 'easy' ? undefined : assaultPlan(obs, ruleset, difficulty);
  commands.push(...electronicWarfare(obs, ruleset, own, difficulty === 'hard' && (plan?.storming ?? false) && !(plan?.besieging ?? false)));

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
  // Spare slots (normal / hard): a Scout Car without an order this turn puts its drone up. The drone
  // escorts it, a wider view and a relay above the car; it is never flown on its own (docs, § 4.1).
  const ordered = new Set([...fixed, ...fighting].map((c) => c.unit));
  const launches: Command[] = difficulty === 'easy' ? [] : own.filter((u) => droneState(ruleset, u) === 'aboard' && !ordered.has(u.id)).map((u) => ({ side, unit: u.id, order: { type: 'launch' } }));
  // Spend order slots only on orders the engine will accept.
  return [...fixed, ...fighting.filter(valid), ...launches.filter(valid)].slice(0, budget);
}

/**
 * The observation without drones (owner decision 2026-10-27). The opponent launches its own but
 * never flies them: no way of flying them measured a gain without letting a player who only digs
 * in win (docs); a launched drone escorts its car. In the air they take no ground cell (no wall, no taken building cell or deposit), the engine fires at
 * them only when nothing else is in reach, and one is replaced for free: nothing to plan around.
 */
function withoutDrones(obs: Observation, ruleset: Ruleset): Observation {
  const entities = obs.world.entities.filter((e) => archetypeOf(ruleset, e.kind)?.layer !== 'air');
  return entities.length === obs.world.entities.length ? obs : { ...obs, world: { ...obs.world, entities } };
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
  const objective = plan.objective;
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
  for (let s = 0; s < w.sides; s++) if (s !== side && hostile(w, side, s)) total += value(w, s);
  return total;
};

/** Distance of the rally point in front of the enemy post (outside its defenders' sight). */
const RALLY_DIST = 6;
/** Fighters within this many cells of the rally point count as rallied. */
const RALLY_RADIUS = 2;
/** Share of the fighters that must be rallied before the storm: hard waits for nearly all, normal storms earlier. */
const RALLY_SHARE: Record<Difficulty, number> = { easy: 0, normal: 0.8, hard: 0.9 };
/** Turn from which the storm goes ahead whatever has rallied (a stray fighter never stalls the game). */
const RALLY_DEADLINE = 6;
/** Known enemy fighters within this many cells of their post count as its defenders. */
const DEFENCE_RADIUS = 7;
/**
 * A known tower counts this many times its price among a post's defenders (it holds far more than
 * units of the same price: structure armour, and it is rebuilt where it stands). Measured against a
 * side that walls its post in with Gun Towers (owner review 2026-10-18): with the rally point kept
 * out of the towers' reach, units lost inside a tower wall on Field Exercise fell from 164 to 81.
 */
const TOWER_DEFENCE_WEIGHT = 2;
/** With yards to reinforce, the storm needs this much more value than the known defenders. */
const STORM_ODDS = 1.3;
/** Fewest fighters the deadline storm goes ahead with while yards keep producing. */
const MIN_STORM = 4;
/**
 * From this turn on the opponent stops waiting (open end, owner review of PR #13): no siege that
 * waits for a spotter, no odds to wait for; it storms with what it has. Against a player who
 * only holds, a waiting siege or a crowd that never reaches the odds would run to the turn cap.
 */
const ESCALATE_TURN = 60;
/**
 * Maps larger than this (cells; 24×16, the largest size before large maps) are large: there the own
 * cover is carried towards the objective by Radio Masts, and a far storm heads for the
 * outer rings around the objective from the start (see `approachCells`). Smaller maps keep their measured AI (a mast
 * chain there cost a storm through a ring of holding units on a 24×16 random map).
 */
const LARGE_MAP_CELLS = 24 * 16;
/** On the way to the rally point a fighter that loses contact comes back (the storm orders keep). */
const RALLY_DOCTRINE: Doctrine = { ...AI_DOCTRINE, lostContact: 'regroup' };

/** The passable cell inside the side's coverage nearest to `at` (ties in the side's frame), or `at` itself when nothing is covered. */
function coveredNear(obs: Observation, ruleset: Ruleset, at: { x: number; y: number }): { x: number; y: number } {
  const { world, network } = obs;
  if (!ruleset.commandNetwork) return at;
  let best: { x: number; y: number; d: number; f: number } | undefined;
  for (let y = 0; y < world.map.h; y++) {
    for (let x = 0; x < world.map.w; x++) {
      const cell = cellOf(world.map, x, y);
      if (network.coverage[cell] !== 1 || !passable(world.map, ruleset, x, y, 'ground')) continue;
      const d = dist2(x, y, at.x, at.y);
      const f = sideFrame(obs, cell);
      if (!best || d < best.d || (d === best.d && f < best.f)) best = { x, y, d, f };
    }
  }
  return best ? { x: best.x, y: best.y } : at;
}

export interface AssaultPlan {
  readonly objective: Entity;
  readonly rally: { x: number; y: number };
  /** All own mobile fighters (in contact or not). */
  readonly all: readonly Entity[];
  /** Enough fighters have gathered: storm the post. */
  readonly storming: boolean;
  /** A gun is in the force: the post is besieged rather than stormed (the jammer stays home). */
  readonly besieging: boolean;
}

/** Weight of the known defence of a post against the own army in the choice of target. */
const DEFENCE_WEIGHT = 1;
/** A post the side already goes for costs this share of its distance (no switching back and forth). */
const STICKY = 0.6;
/** A post's lost health lowers its cost by up to this share (a damaged post falls sooner). */
const DAMAGE_WEIGHT = 0.5;
/** Own fighters within this many cells of a post count as being at it (the attack is on). */
const AT_POST = 4;

/**
 * The Command Post the side goes for (docs/design/strategy.md § 9.4, increment 4): among the
 * hostile posts it knows of, and the neutral ones to take over, the one with the lowest cost:
 * the distance from its own post, raised by the known defence around the target against the
 * side's own army, lowered for a damaged post and for the target its fighters already attack.
 * Several opponents: each picks its own, with no coordination between them and no rule that
 * prefers the player.
 */
export function objectiveOf(obs: Observation, ruleset: Ruleset): Entity | undefined {
  const { world, side } = obs;
  const home = world.entities.find((e) => e.side === side && e.kind === 'command-post');
  if (!home) return undefined;
  const value = (e: Entity) => ((archetypeOf(ruleset, e.kind)?.cost ?? 0) * e.hp) / (archetypeOf(ruleset, e.kind)?.hp || 1);
  const mobile = (e: Entity) => archetypeOf(ruleset, e.kind)?.weapon && (archetypeOf(ruleset, e.kind)?.speed ?? 0) > 0;
  const army = world.entities.filter((e) => e.side === side && mobile(e));
  const ours = Math.max(1, army.reduce((sum, e) => sum + value(e), 0));
  const armed = enemiesOf(obs).filter((e) => archetypeOf(ruleset, e.kind)?.weapon);
  // A neutral post is taken over by infantry: without any, or a yard to train some, it is no target.
  const infantry = world.entities.some((e) => e.side === side && (isInfantry(ruleset, e) || (archetypeOf(ruleset, e.kind)?.production ?? []).some((k) => isInfantry(ruleset, { ...e, kind: k }))));
  let best: { post: Entity; cost: number; f: number } | undefined;
  for (const post of targetPosts(obs)) {
    if (post.side === NEUTRAL && !infantry) continue;
    const defence = armed.filter((e) => dist2(e.x, e.y, post.x, post.y) <= DEFENCE_RADIUS * DEFENCE_RADIUS).reduce((sum, e) => sum + value(e), 0);
    const health = post.hp / (archetypeOf(ruleset, post.kind)?.hp || 1);
    const engaged =
      army.some((f) => f.order.type === 'attack' && f.order.target === post.id) ||
      army.filter((f) => dist2(f.x, f.y, post.x, post.y) <= AT_POST * AT_POST).length * 2 >= Math.max(1, army.length);
    const cost = Math.sqrt(dist2(home.x, home.y, post.x, post.y)) * (1 + (DEFENCE_WEIGHT * defence) / ours) * (1 - DAMAGE_WEIGHT * (1 - health)) * (engaged ? STICKY : 1);
    const f = frame(obs, post);
    if (!best || cost < best.cost || (cost === best.cost && f < best.f)) best = { post, cost, f };
  }
  return best?.post;
}

/** Posts the side may go for: hostile ones it knows of, and neutral ones to take over. */
const targetPosts = (obs: Observation): Entity[] =>
  obs.world.entities.filter((e) => e.kind === 'command-post' && e.side !== obs.side && hostile(obs.world, obs.side, e.side));

/** The side's plan of attack from what it knows: rally point in front of the enemy post and whether to storm. */
export function assaultPlan(obs: Observation, ruleset: Ruleset, difficulty: Difficulty): AssaultPlan | undefined {
  const { world, side } = obs;
  const home = world.entities.find((e) => e.side === side && e.kind === 'command-post');
  const objective = objectiveOf(obs, ruleset);
  if (!objective || !home) return undefined;
  const dx = home.x - objective.x;
  const dy = home.y - objective.y;
  const len = Math.hypot(dx, dy) || 1;
  // Known towers around the post: the rally point stands back beyond their reach (fighters waiting
  // there for the others were shot to pieces by a tower wall they could see).
  const towerReach = enemiesOf(obs).flatMap((e) => {
    const a = archetypeOf(ruleset, e.kind);
    return a?.speed === 0 && a.weapon && e.id !== objective.id ? [{ x: e.x, y: e.y, r: a.weapon.range + 1 }] : [];
  });
  const reached = (x: number, y: number, margin: number) => towerReach.some((t) => dist2(x, y, t.x, t.y) <= (t.r + margin) ** 2);
  let back = RALLY_DIST;
  const at = (d: number) => ({ x: Math.max(0, Math.min(world.map.w - 1, Math.round(objective.x + (dx / len) * d))), y: Math.max(0, Math.min(world.map.h - 1, Math.round(objective.y + (dy / len) * d))) });
  while (back < len && reached(at(back).x, at(back).y, RALLY_RADIUS)) back++;
  const ideal = at(Math.min(back, Math.max(RALLY_DIST, Math.floor(len))));
  // The rally point lies inside the own coverage (the nearest covered cell to the ideal one):
  // fighters gather under radio cover and move up as the relay truck extends it, instead of
  // waiting out of contact where no order and no recall can reach them.
  const rally = coveredNear(obs, ruleset, ideal);
  const all = world.entities.filter((e) => e.side === side && archetypeOf(ruleset, e.kind)?.weapon && (archetypeOf(ruleset, e.kind)?.speed ?? 0) > 0);
  const rallied = all.filter((f) => Math.max(Math.abs(f.x - rally.x), Math.abs(f.y - rally.y)) <= RALLY_RADIUS).length;
  // Once the storm has begun (fighters past the rally point) it goes on; a tiny force storms at once.
  const past = all.filter((f) => dist2(f.x, f.y, objective.x, objective.y) < dist2(rally.x, rally.y, objective.x, objective.y)).length;
  // Only fighters that can be ordered count towards the share: one stuck out of contact never holds the storm up.
  const orderable = all.filter((f) => !ruleset.commandNetwork || obs.network.coverage[cellOf(world.map, f.x, f.y)] === 1);
  // A tiny force storms at once only when no yard can reinforce it (with an economy it waits).
  const reinforcing = ruleset.economy && world.entities.some((e) => e.side === side && archetypeOf(ruleset, e.kind)?.production && (e.build ?? 0) === 0);
  // The deadline sends what has gathered, but never a lone unit while yards can reinforce it.
  const gathered = (all.length <= 2 && !reinforcing) || (world.turn >= RALLY_DEADLINE && (orderable.length >= MIN_STORM || !reinforcing)) || rallied + past >= Math.ceil(orderable.length * RALLY_SHARE[difficulty]);
  // While yards can reinforce, go in only with clear odds against the known defenders of the post:
  // units sent in one by one only feed the defence (and keep a stalemate from ever ending).
  const value = (e: Entity) => ((archetypeOf(ruleset, e.kind)?.cost ?? 0) * e.hp) / (archetypeOf(ruleset, e.kind)?.hp || 1);
  const ours = orderable.reduce((sum, f) => sum + value(f), 0);
  const theirs = enemiesOf(obs)
    .filter((e) => archetypeOf(ruleset, e.kind)?.weapon && dist2(e.x, e.y, objective.x, objective.y) <= DEFENCE_RADIUS * DEFENCE_RADIUS)
    .reduce((sum, e) => sum + value(e) * (archetypeOf(ruleset, e.kind)?.speed === 0 ? TOWER_DEFENCE_WEIGHT : 1), 0);
  // A neutral post is taken over, not stormed: the infantry goes as soon as the known guards allow.
  const storming = objective.side === NEUTRAL ? ours >= theirs * STORM_ODDS : gathered && (!reinforcing || ours >= theirs * STORM_ODDS || world.turn >= ESCALATE_TURN);
  const besieging = all.some((f) => (archetypeOf(ruleset, f.kind)?.weapon?.minRange ?? 0) > 0 && (archetypeOf(ruleset, f.kind)?.weapon?.range ?? 0) > 3);
  // Alone against several: hold in front of the own post, never storm (see `outnumbered`).
  if (outnumbered(world, side)) {
    const guard = coveredNear(obs, ruleset, { x: Math.round(home.x - (dx / len) * HOLD_DIST), y: Math.round(home.y - (dy / len) * HOLD_DIST) });
    return { objective, rally: guard, all, storming: false, besieging };
  }
  return { objective, rally, all, storming, besieging };
}

/** How far in front of its own post an outnumbered side gathers its fighters. */
const HOLD_DIST = 3;

/**
 * Teams: the side stands alone (no ally still in) against two or more hostile sides. On strength a
 * team counts as its strongest side (owner decision 2026-10-25), so a lone side wins by holding
 * what it has; storming out against several, it was out at turn 48 on Bastion (measured). It
 * gathers in front of its own post and fights what comes into reach instead.
 */
export function outnumbered(world: World, side: number): boolean {
  if (!world.teams) return false;
  let allies = 0;
  let foes = 0;
  for (let s = 0; s < world.sides; s++) {
    if (s === side || world.out?.includes(s)) continue;
    if (hostile(world, side, s)) foes++;
    else allies++;
  }
  return allies === 0 && foes >= 2;
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
  if (plan.storming && objective.side === NEUTRAL) return occupy(obs, ruleset, plan, fighters);
  if (plan.storming) {
    // With a gun in the force the post is besieged, not stormed (artillery outranges a static
    // defence; a storm into one trades badly).
    const siegeOrders = world.turn < ESCALATE_TURN ? siege(obs, ruleset, plan, fighters) : undefined;
    if (siegeOrders) return siegeOrders;
    // Everyone goes for the post. Artillery attacks it from its range once the stormers report it
    // (only a spotted target can be attacked); a ghost it seeks within its own sight and then
    // fires on its own (a stand-off with nothing spotted would hold forever).
    const live = !obs.ghosts.has(objective.id);
    const approach = approachCells(obs, ruleset, objective);
    // Nearest first: the front of a crowd moves off first and the order slots go where they free the way.
    const byDistance = [...fighters].sort((a, b) => dist2(a.x, a.y, objective.x, objective.y) - dist2(b.x, b.y, objective.x, objective.y) || frame(obs, a) - frame(obs, b));
    for (const unit of byDistance) {
      if (unit.order.type === 'attack' && unit.order.target === objective.id) continue;
      const arch = archetypeOf(ruleset, unit.kind);
      if (!arch?.weapon) continue;
      const guns = arch.weapon.minRange > 0;
      if (live && guns) {
        commands.push({ side, unit: unit.id, order: { type: 'attack', target: objective.id }, doctrine: AI_DOCTRINE });
        continue;
      }
      const goal = guns ? standOff(obs, ruleset, unit, objective, Math.max(arch.weapon.minRange, Math.min(arch.weapon.range, arch.vision))) : approach(unit);
      if (unit.order.type === 'move' && unit.order.x === goal.x && unit.order.y === goal.y) continue;
      if (goal.x === unit.x && goal.y === unit.y) continue;
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
        ring.push({ x, y, f: sideFrame(obs, c) });
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
    commands.push({ side, unit: unit.id, order: { type: 'move', x: spot.x, y: spot.y }, doctrine: RALLY_DOCTRINE });
  }
  return commands;
}

/** Infantry units sent to take over a neutral post (one suffices; a second covers a loss on the way). */
const OCCUPIERS = 2;

const isInfantry = (ruleset: Ruleset, e: Entity): boolean => {
  const arch = archetypeOf(ruleset, e.kind);
  return arch?.armor === 'infantry' && arch.layer === 'ground' && arch.speed > 0;
};

/**
 * Taking over a neutral post (capture rule, docs/design/strategy.md § 9.4): the nearest infantry
 * moves next to it; the other fighters wait out of their weapons' reach of it, so their own fire
 * does not wear down the post they are about to own.
 */
function occupy(obs: Observation, ruleset: Ruleset, plan: AssaultPlan, fighters: readonly Entity[]): Command[] {
  const { side } = obs;
  const { objective } = plan;
  const approach = approachCells(obs, ruleset, objective);
  const byDistance = [...fighters].sort((a, b) => dist2(a.x, a.y, objective.x, objective.y) - dist2(b.x, b.y, objective.x, objective.y) || frame(obs, a) - frame(obs, b));
  const occupiers = byDistance.filter((u) => isInfantry(ruleset, u)).slice(0, OCCUPIERS);
  const commands: Command[] = [];
  for (const unit of byDistance) {
    const range = archetypeOf(ruleset, unit.kind)?.weapon?.range ?? 0;
    const goal = occupiers.includes(unit) ? approach(unit) : standOff(obs, ruleset, unit, objective, range + 1);
    if (dist2(unit.x, unit.y, objective.x, objective.y) > (range + 1) ** 2 || occupiers.includes(unit)) {
      if (goal.x === unit.x && goal.y === unit.y) continue;
      if (unit.order.type === 'move' && unit.order.x === goal.x && unit.order.y === goal.y) continue;
      commands.push({ side, unit: unit.id, order: { type: 'move', x: goal.x, y: goal.y }, doctrine: AI_DOCTRINE });
    }
  }
  return commands;
}

/** An own post below this share of its health is guarded against capture. */
const GUARD_BELOW = 0.5;
/** Known hostile infantry within this many cells of a damaged own post makes it guarded. */
const GUARD_RADIUS = 5;

/**
 * Guards for damaged own posts: a post below GUARD_BELOW of its health with known hostile
 * infantry near it gets one own mobile unit next to it (a mobile unit next to a post blocks its
 * capture, § 9.4). Returns the orders and the units that guard (left out of the attack).
 */
function guardPosts(obs: Observation, ruleset: Ruleset, own: readonly Entity[]): { commands: Command[]; guards: Set<number> } {
  const { world, side } = obs;
  const commands: Command[] = [];
  const guards = new Set<number>();
  const mobile = (e: Entity) => (archetypeOf(ruleset, e.kind)?.speed ?? 0) > 0 && e.build === undefined;
  const raiders = enemiesOf(obs).filter((e) => isInfantry(ruleset, e));
  const taken = new Set(world.entities.map((e) => cellOf(world.map, e.x, e.y)));
  for (const post of world.entities) {
    if (post.side !== side || post.kind !== 'command-post') continue;
    if (post.hp >= (archetypeOf(ruleset, post.kind)?.hp ?? 0) * GUARD_BELOW) continue;
    if (!raiders.some((e) => dist2(e.x, e.y, post.x, post.y) <= GUARD_RADIUS * GUARD_RADIUS)) continue;
    const next = (e: Positioned) => Math.max(Math.abs(e.x - post.x), Math.abs(e.y - post.y)) <= 1;
    const there = world.entities.find((e) => e.side === side && mobile(e) && next(e));
    if (there) {
      guards.add(there.id);
      if (own.includes(there) && there.order.type !== 'hold') commands.push({ side, unit: there.id, order: { type: 'hold' }, doctrine: AI_DOCTRINE });
      continue;
    }
    // The nearest unit that can be ordered, to the nearest free cell next to the post (in the side's frame).
    const cells: { x: number; y: number; f: number }[] = [];
    for (let y = post.y - 1; y <= post.y + 1; y++) {
      for (let x = post.x - 1; x <= post.x + 1; x++) {
        if (x < 0 || y < 0 || x >= world.map.w || y >= world.map.h || (x === post.x && y === post.y)) continue;
        const c = cellOf(world.map, x, y);
        if (taken.has(c) || !passable(world.map, ruleset, x, y, 'ground')) continue;
        cells.push({ x, y, f: sideFrame(obs, c) });
      }
    }
    const unit = nearest(post as Entity, own.filter((e) => mobile(e) && !guards.has(e.id) && archetypeOf(ruleset, e.kind)?.layer === 'ground' && e.kind !== 'mast-truck'), obs);
    if (!unit) continue;
    const cell = cells.sort((a, b) => dist2(a.x, a.y, unit.x, unit.y) - dist2(b.x, b.y, unit.x, unit.y) || a.f - b.f)[0];
    if (!cell) continue;
    guards.add(unit.id);
    taken.add(cellOf(world.map, cell.x, cell.y));
    if (!(unit.order.type === 'move' && unit.order.x === cell.x && unit.order.y === cell.y)) commands.push({ side, unit: unit.id, order: { type: 'move', x: cell.x, y: cell.y }, doctrine: AI_DOCTRINE });
  }
  return { commands, guards };
}

/** How far around the objective a storming fighter looks for a free cell it can reach. */
export const APPROACH_RADIUS = 4;

/**
 * Where a storming fighter heads: the post itself while it can be reached. But every unit that
 * holds is a wall to the engine's routes: defenders holding in a ring around their post wall it
 * off for good, and a move onto it would never start. Then the fighter heads for the nearest
 * free cell around the post that it can reach past every known unit that may not move
 * (structures, own holding units, all known enemies); there it fires on what it sees, and the
 * ring opens as defenders fall. Without such a cell: the post itself, as before.
 */
export function approachCells(obs: Observation, ruleset: Ruleset, objective: Entity): (unit: Entity) => { x: number; y: number } {
  const { world, side } = obs;
  const { w, h } = world.map;
  const walls = new Set<number>();
  const taken = new Set<number>();
  for (const e of world.entities) {
    const c = cellOf(world.map, e.x, e.y);
    taken.add(c);
    const arch = archetypeOf(ruleset, e.kind);
    if (e.side !== side || !arch || arch.speed === 0 || e.order.type === 'hold' || e.order.type === 'deploy') walls.add(c);
  }
  const region = regions(world.map, ruleset, 'ground', walls);
  // Candidate cells ring by ring around the objective, in the side's frame (mirrored sides pick mirrored cells).
  const rings: { x: number; y: number; r: number; f: number }[] = [];
  for (let y = Math.max(0, objective.y - APPROACH_RADIUS); y <= Math.min(h - 1, objective.y + APPROACH_RADIUS); y++) {
    for (let x = Math.max(0, objective.x - APPROACH_RADIUS); x <= Math.min(w - 1, objective.x + APPROACH_RADIUS); x++) {
      const c = cellOf(world.map, x, y);
      if (taken.has(c) || !passable(world.map, ruleset, x, y, 'ground')) continue;
      rings.push({ x, y, r: Math.max(Math.abs(x - objective.x), Math.abs(y - objective.y)), f: sideFrame(obs, c) });
    }
  }
  rings.sort((a, b) => a.r - b.r || a.f - b.f);
  const claimed = new Set<number>();
  const target = cellOf(world.map, objective.x, objective.y);
  // A post may be ringed by units the side has not seen (even with a free cell next to it in
  // sight, ringed in turn): a move onto it then finds no way and ends at once, turn after turn
  // (measured: a storm of 54 fighters that never set off). So from ESCALATE_TURN (a storm that has
  // not got through by then) a fighter beyond APPROACH_RADIUS heads for a free cell of the outer
  // rings instead: one the side sees (nearest first), else the farthest out (a ring may be two
  // deep); from there it sees what holds the post and fires on it. Earlier the storm heads for the
  // post as before (measured: doing so from the start cost hard its lead over normal on Ridge Valley).
  // On large maps from the start: the long march would otherwise only begin at ESCALATE_TURN
  // (measured on a 48×32 random map: 20 fighters stood at home from turn 10 to 60).
  const late = world.turn >= ESCALATE_TURN || world.map.w * world.map.h > LARGE_MAP_CELLS;
  const seen = late ? observedCells(world, ruleset, side, obs.network) : undefined;
  const watched = (cell: { x: number; y: number }) => seen?.[cellOf(world.map, cell.x, cell.y)] === 1;
  const outer = late ? [...rings.filter((c) => c.r >= 2 && watched(c)), ...rings.filter((c) => c.r >= 2 && !watched(c)).sort((a, b) => b.r - a.r || a.f - b.f)] : [];
  return (unit) => {
    const start = cellOf(world.map, unit.x, unit.y);
    const here = Math.max(Math.abs(unit.x - objective.x), Math.abs(unit.y - objective.y));
    const far = late && here > APPROACH_RADIUS;
    // The post can be reached (next to it): head for it, as always (late and far: the outer rings, above).
    if (!far && canReach(world.map, ruleset, 'ground', region, start, target)) return { x: objective.x, y: objective.y };
    // Already as close as the ring allows: stay (it fires on its own).
    for (const cell of far ? outer : rings) {
      if (cell.r >= here) continue;
      const c = cellOf(world.map, cell.x, cell.y);
      if (claimed.has(c) || !canReach(world.map, ruleset, 'ground', region, start, c)) continue;
      claimed.add(c);
      return { x: cell.x, y: cell.y };
    }
    return here <= APPROACH_RADIUS ? { x: unit.x, y: unit.y } : { x: objective.x, y: objective.y };
  };
}

/**
 * Siege (I6a): a gun shells the post from its full range while one spotter keeps the post in
 * sight from the cell farthest out of reach of the known defenders, and the rest guard the gun
 * (escort) or hold where they stand. Needs a gun with a minimum range and a spotter that can see
 * the post from beyond the defenders' reach; otherwise `undefined` and the force storms.
 */
function siege(obs: Observation, ruleset: Ruleset, plan: AssaultPlan, fighters: readonly Entity[]): Command[] | undefined {
  const { side } = obs;
  const { objective } = plan;
  const arch = (e: Entity) => archetypeOf(ruleset, e.kind);
  const guns = plan.all.filter((f) => (arch(f)?.weapon?.minRange ?? 0) > 0 && (arch(f)?.weapon?.range ?? 0) > 3);
  if (guns.length === 0) return undefined;
  const live = !obs.ghosts.has(objective.id);
  const commands: Command[] = [];
  const defenders = enemiesOf(obs).filter((e) => arch(e)?.weapon && arch(e)?.speed !== 0);
  // The spotter: the fighter that sees farthest (an Outrider sees the post from beyond its sight), then the cheapest.
  const spotters = fighters.filter((f) => !guns.includes(f)).sort((a, b) => (arch(b)?.vision ?? 0) - (arch(a)?.vision ?? 0) || (arch(a)?.cost ?? 0) - (arch(b)?.cost ?? 0) || frame(obs, a) - frame(obs, b));
  const spotter = spotters[0];
  // A spotter that the post itself would see is a spotter lost to the defenders' guns: without
  // one that sees farther than the post, the gun waits at its stand-off until there is one.
  const postVision = arch(objective)?.vision ?? 0;
  const safe = spotter && (arch(spotter)?.vision ?? 0) > postVision;
  const post = spotter && safe ? spottingCell(obs, ruleset, spotter, objective, defenders) : undefined;
  // Nobody reports the post and no spotter can watch it safely: the siege cannot work, storm instead.
  if (!live && !post) return undefined;
  if (spotter && safe) {
    if (post && !(spotter.x === post.x && spotter.y === post.y) && !(spotter.order.type === 'move' && spotter.order.x === post.x && spotter.order.y === post.y)) {
      commands.push({ side, unit: spotter.id, order: { type: 'move', x: post.x, y: post.y }, doctrine: AI_DOCTRINE });
    } else if (post && spotter.x === post.x && spotter.y === post.y && spotter.order.type !== 'hold') {
      commands.push({ side, unit: spotter.id, order: { type: 'hold' }, doctrine: AI_DOCTRINE });
    }
  }
  for (const gun of guns) {
    if (!fighters.includes(gun)) continue;
    const weapon = arch(gun)?.weapon;
    if (!weapon) continue;
    if (live) {
      if (!(gun.order.type === 'attack' && gun.order.target === objective.id)) commands.push({ side, unit: gun.id, order: { type: 'attack', target: objective.id }, doctrine: AI_DOCTRINE });
      continue;
    }
    // Nothing reports the post yet: wait at the gun's stand-off, out of the defenders' reach.
    const goal = standOff(obs, ruleset, gun, objective, Math.max(weapon.minRange, weapon.range - 1));
    if (gun.x === goal.x && gun.y === goal.y) continue;
    if (!(gun.order.type === 'move' && gun.order.x === goal.x && gun.order.y === goal.y)) commands.push({ side, unit: gun.id, order: { type: 'move', x: goal.x, y: goal.y }, doctrine: AI_DOCTRINE });
  }
  // The rest guard the nearest gun (two per gun), the others hold where they are.
  const guards = fighters.filter((f) => !(safe && f === spotter) && !guns.includes(f));
  const assigned = new Map<number, number>();
  for (const guard of guards) {
    const gun = guns.filter((g) => (assigned.get(g.id) ?? 0) < 2).sort((a, b) => dist2(a.x, a.y, guard.x, guard.y) - dist2(b.x, b.y, guard.x, guard.y) || frame(obs, a) - frame(obs, b))[0];
    if (gun) {
      assigned.set(gun.id, (assigned.get(gun.id) ?? 0) + 1);
      if (!(guard.order.type === 'escort' && guard.order.target === gun.id)) commands.push({ side, unit: guard.id, order: { type: 'escort', target: gun.id }, doctrine: AI_DOCTRINE });
    } else if (Math.max(Math.abs(guard.x - plan.rally.x), Math.abs(guard.y - plan.rally.y)) > RALLY_RADIUS && !(guard.order.type === 'move' && guard.order.x === plan.rally.x && guard.order.y === plan.rally.y)) {
      // Spare fighters wait at the rally point (not next to the yards they came from).
      commands.push({ side, unit: guard.id, order: { type: 'move', x: plan.rally.x, y: plan.rally.y }, doctrine: AI_DOCTRINE });
    }
  }
  return commands;
}

/**
 * Where `spotter` keeps `objective` in its own sight while standing as far beyond the known
 * defenders' reach as the map allows (ties: nearer to the spotter, then the side's frame).
 */
function spottingCell(obs: Observation, ruleset: Ruleset, spotter: Entity, objective: Positioned, defenders: readonly Entity[]): { x: number; y: number } | undefined {
  const arch = archetypeOf(ruleset, spotter.kind);
  if (!arch) return undefined;
  const vision = arch.vision;
  const { w, h } = obs.world.map;
  const taken = new Set(obs.world.entities.filter((e) => e.id !== spotter.id).map((e) => cellOf(obs.world.map, e.x, e.y)));
  let best: { x: number; y: number; margin: number; d: number; f: number } | undefined;
  for (let y = Math.max(0, objective.y - vision); y <= Math.min(h - 1, objective.y + vision); y++) {
    for (let x = Math.max(0, objective.x - vision); x <= Math.min(w - 1, objective.x + vision); x++) {
      if (dist2(x, y, objective.x, objective.y) > vision * vision || !passable(obs.world.map, ruleset, x, y, arch.layer)) continue;
      const c = cellOf(obs.world.map, x, y);
      // Only a reporting unit spots: the cell must lie inside the own coverage.
      if (taken.has(c) || (ruleset.commandNetwork && obs.network.coverage[c] !== 1)) continue;
      // Margin: distance beyond the nearest defender's reach and eyes (negative = inside it); a
      // spotter the defenders see is a spotter their guns can shell.
      let margin = Number.POSITIVE_INFINITY;
      for (const e of defenders) {
        const a = archetypeOf(ruleset, e.kind);
        const reach = Math.max((a?.weapon?.range ?? 0) + 1, a?.vision ?? 0);
        margin = Math.min(margin, Math.sqrt(dist2(x, y, e.x, e.y)) - reach);
      }
      margin = Math.min(margin, Math.sqrt(dist2(x, y, objective.x, objective.y)) - (archetypeOf(ruleset, (objective as Entity).kind)?.vision ?? 0));
      margin = Math.min(margin, 3); // beyond three cells of slack, nearer is better
      const d = dist2(x, y, spotter.x, spotter.y);
      const f = sideFrame(obs, c);
      if (!best || margin > best.margin || (margin === best.margin && (d < best.d || (d === best.d && f < best.f)))) best = { x, y, margin, d, f };
    }
  }
  // Only a cell beyond the defenders' eyes and reach is worth sending a spotter to.
  return best && best.margin > 0 ? best : undefined;
}

/** Build order of the levels: what to produce when Supply allows, in this order of need. */
const ARMY_TEMPLATE: Record<Difficulty, readonly string[]> = {
  easy: ['rifles'],
  normal: ['rifles', 'lancer', 'outrider', 'howitzer', 'rifles'],
  hard: ['lancer', 'rifles', 'outrider', 'howitzer', 'warden']
};
/** Turn from which a Motor Pool is built even with fewer than two Extractors. */
const POOL_TURN = 6;
/** Turns of income the opponent is willing to wait for the unit it needs most. */
const SAVE_TURNS = 3;
/** Banked Supply from which the yards evidently cannot spend the income: another yard is built. */
const SURPLUS = 800;
/** Most yards a side builds for itself (the starting Muster Yard included). */
const MAX_YARDS = 4;
/** The own cover ending this many cells short of the objective starts a chain of Radio Masts towards it. */
const MAST_GAP = 4;
/** Supply kept back when a Radio Mast of the chain is built. */
const MAST_RESERVE = 40;
/** Easy keeps a cushion before it produces or builds anything. */
const EASY_RESERVE = 150;
/** Extractors easy builds at most (one at a time). */
const EASY_EXTRACTORS = 2;
/** Turn from which easy builds a Vehicle Factory. */
const EASY_POOL_TURN = 10;
/** A known enemy fighter this close (cells) to the post or an Extractor threatens it: a tower goes up. */
const TOWER_THREAT = 7;
/**
 * Known enemy fighters near an asset before a tower goes up (and they must outnumber the own fighters
 * within `TOWER_GUARD_FIGHTERS`). Measured in docs/design/strategy.md ("Defence towers"): with these,
 * both levels beat the previous opponent on every two-side map and keep the level margins; towers on
 * any threat cost hard its edge over normal (0–12 on Field Exercise), Laser Towers against armour too.
 */
const TOWER_THREATS: Record<Difficulty, number> = { easy: Number.POSITIVE_INFINITY, normal: 3, hard: 1 };
/** Own fighters this close (cells) to an asset defend it themselves. */
const TOWER_GUARD_FIGHTERS = 4;
/** A tower this close (cells) to an asset already guards it. */
const TOWER_GUARD = 3;
/** Most towers a side builds: one, plus one per two Extractors, at most four. */
const maxTowers = (extractors: number): number => Math.min(4, 1 + Math.floor(extractors / 2));

/**
 * Strategic spending (I6a, § 11): Extractors on free covered deposits first (income compounds),
 * then a Motor Pool once two Extractors stand (hard, or normal from turn 6), then units from the
 * level's template as the yards allow; at most `slots` orders. Easy builds slowly (two Extractors,
 * a Vehicle Factory from turn 10, no towers) and produces Rifle Squads and Scout Cars, always with a
 * cushion. Everything is checked with validateCommand before it is spent.
 */
function economyOrders(obs: Observation, ruleset: Ruleset, own: readonly Entity[], difficulty: Difficulty, slots: number): Command[] {
  const { world, side, network } = obs;
  const commands: Command[] = [];
  let supply = world.supply?.[side] ?? 0;
  const arch = (e: Entity) => archetypeOf(ruleset, e.kind);
  const source = own.find((e) => arch(e)?.comms?.role === 'source' && (e.build ?? 0) === 0);
  const yards = own.filter((e) => arch(e)?.production && (e.build ?? 0) === 0);
  const ownAll = world.entities.filter((e) => e.side === side);
  const costOf = (kind: string) => archetypeOf(ruleset, kind)?.cost ?? Number.POSITIVE_INFINITY;
  const networks: Network[] = [];
  networks[side] = network;
  const tryOrder = (c: Command): boolean => {
    if (commands.length >= slots || !validateCommand(world, ruleset, c, networks).ok) return false;
    commands.push(c);
    const kind = c.order.type === 'produce' || c.order.type === 'build' ? c.order.kind : undefined;
    if (kind) supply -= costOf(kind);
    return true;
  };
  if (difficulty === 'easy') {
    // Easy builds too (owner review 2026-10-27), slowly and never towers: an Extractor at a time on
    // a covered deposit out of known enemy reach (at most EASY_EXTRACTORS), a Vehicle Factory from
    // EASY_POOL_TURN next to a standing Barracks (it adds to production); it always keeps its cushion.
    const free = source ? freeDeposits(obs, ruleset, source) : [];
    const extractorsNow = ownAll.filter((e) => arch(e)?.extractor).length;
    if (source && extractorsNow < EASY_EXTRACTORS && !ownAll.some((e) => arch(e)?.extractor && (e.build ?? 0) > 0) && supply >= EASY_RESERVE + costOf('extractor')) {
      for (const d of free) if (tryOrder({ side, unit: source.id, order: { type: 'build', kind: 'extractor', x: d.x, y: d.y } })) break;
    }
    if (source && world.turn >= EASY_POOL_TURN && yards.some((y) => y.kind === 'muster') && !ownAll.some((e) => e.kind === 'motor-pool') && supply >= EASY_RESERVE + costOf('motor-pool')) {
      const spot = buildSpot(obs, ruleset, source, 'motor-pool');
      if (spot) tryOrder({ side, unit: source.id, order: { type: 'build', kind: 'motor-pool', x: spot.x, y: spot.y } });
    }
    // Units from each idle yard: Rifle Squads, Scout Cars from the factory.
    for (const yard of yards) {
      const kind = yard.kind === 'motor-pool' ? 'outrider' : 'rifles';
      if (supply < EASY_RESERVE + costOf(kind) || (yard.queue?.length ?? 0) > 0) continue;
      tryOrder({ side, unit: yard.id, order: { type: 'produce', kind } });
    }
    return commands;
  }
  // 1. Extractors on free deposits inside coverage (nearest to the post first).
  if (source) {
    for (const d of freeDeposits(obs, ruleset, source)) {
      if (supply < costOf('extractor')) break;
      tryOrder({ side, unit: source.id, order: { type: 'build', kind: 'extractor', x: d.x, y: d.y } });
    }
  }
  // 1b. Defence towers (owner decision 2026-10-16) where known enemy fighters threaten the post or an
  // Extractor that is outnumbered on the spot and no tower guards yet: a Gun Tower.
  const extractors = ownAll.filter((e) => arch(e)?.extractor).length;
  if (source) {
    const towers = () => [...ownAll.filter((e) => e.kind.startsWith('tower-')), ...commands.flatMap((c) => (c.order.type === 'build' && c.order.kind.startsWith('tower-') ? [{ x: c.order.x, y: c.order.y }] : []))];
    const threats = enemiesOf(obs).filter((e) => arch(e)?.weapon && (arch(e)?.speed ?? 0) > 0);
    const assets = ownAll.filter((e) => e.id === source.id || (arch(e)?.extractor && (e.build ?? 0) === 0));
    for (const asset of assets) {
      if (towers().length >= maxTowers(extractors)) break;
      const near = threats.filter((e) => dist2(e.x, e.y, asset.x, asset.y) <= TOWER_THREAT * TOWER_THREAT);
      // Only where the asset is outnumbered: own fighters close by meet the threat themselves.
      const defenders = ownAll.filter((e) => arch(e)?.weapon && (arch(e)?.speed ?? 0) > 0 && dist2(e.x, e.y, asset.x, asset.y) <= TOWER_GUARD_FIGHTERS * TOWER_GUARD_FIGHTERS).length;
      if (near.length < TOWER_THREATS[difficulty] || defenders >= near.length || towers().some((t) => dist2(t.x, t.y, asset.x, asset.y) <= TOWER_GUARD * TOWER_GUARD)) continue;
      const kind = 'tower-gun';
      if (supply < costOf(kind)) continue;
      const planned = commands.flatMap((c) => (c.order.type === 'build' ? [{ x: c.order.x, y: c.order.y }] : []));
      const spot = towerSpot(obs, ruleset, asset, near, planned);
      if (spot) tryOrder({ side, unit: source.id, order: { type: 'build', kind, x: spot.x, y: spot.y } });
    }
  }
  // 1c. Large maps (2026-10-27, larger than LARGE_MAP_CELLS): an objective far beyond the own radio cover is out of reach of any
  // order, so the cover is carried towards it by a chain of Radio Masts: one at a time, on the covered
  // cell nearest the objective out of known enemy reach, once the cover ends MAST_GAP cells short.
  const objective = source && world.map.w * world.map.h > LARGE_MAP_CELLS ? objectiveOf(obs, ruleset) : undefined;
  if (source && objective && supply >= costOf('relay-mast') + MAST_RESERVE && !ownAll.some((e) => e.kind === 'relay-mast' && (e.build ?? 0) > 0)) {
    const spot = mastSpot(obs, ruleset, objective);
    if (spot) tryOrder({ side, unit: source.id, order: { type: 'build', kind: 'relay-mast', x: spot.x, y: spot.y } });
  }
  // 2. A Motor Pool next to the post once the economy runs (vehicles: scouts that spot from afar, guns).
  const hasPool = ownAll.some((e) => e.kind === 'motor-pool');
  if (source && !hasPool && (extractors >= 2 || world.turn >= POOL_TURN) && supply >= costOf('motor-pool')) {
    const spot = buildSpot(obs, ruleset, source, 'motor-pool');
    if (spot) tryOrder({ side, unit: source.id, order: { type: 'build', kind: 'motor-pool', x: spot.x, y: spot.y } });
  }
  // 2b. Supply piling up (the yards produce flat out): another yard, infantry and vehicles in turn.
  const yardCount = ownAll.filter((e) => arch(e)?.production).length;
  if (source && hasPool && supply >= SURPLUS && yardCount < MAX_YARDS) {
    const musters = ownAll.filter((e) => e.kind === 'muster').length;
    const pools = ownAll.filter((e) => e.kind === 'motor-pool').length;
    const kind = musters <= pools ? 'muster' : 'motor-pool';
    const spot = buildSpot(obs, ruleset, source, kind);
    if (spot) tryOrder({ side, unit: source.id, order: { type: 'build', kind, x: spot.x, y: spot.y } });
  }
  // 3. Units from the template: the first kind of the template that is short in the force.
  const counts = new Map<string, number>();
  for (const e of ownAll) counts.set(e.kind, (counts.get(e.kind) ?? 0) + 1);
  for (const yard of ownAll) for (const q of yard.queue ?? []) counts.set(q.kind, (counts.get(q.kind) ?? 0) + 1);
  const template = ARMY_TEMPLATE[difficulty];
  const wanted = template.filter((kind) => (counts.get(kind) ?? 0) < template.filter((k) => k === kind).length + (difficulty === 'hard' ? 1 : 0));
  // Keep a cushion for the next Extractor while a free deposit out of enemy reach remains.
  const reserve = (world.map.deposits ?? []).some((d) => (d.left > 0 || d.left === UNKNOWN_LEFT || d.endless) && !world.entities.some((e) => e.x === d.x && e.y === d.y) && dangerAt(obs, ruleset, d.x, d.y) === 0) ? costOf('extractor') : 0;
  const income = incomeOfSide(world, ruleset, side, network);
  const fighters = ownAll.filter((e) => arch(e)?.weapon && (arch(e)?.speed ?? 0) > 0).length;
  // Queue lengths including what this plan already put in (a yard never gets more than it holds).
  const queued = new Map(yards.map((y) => [y.id, y.queue?.length ?? 0]));
  for (const c of commands) if (c.order.type === 'produce') queued.set(c.unit, (queued.get(c.unit) ?? 0) + 1);
  for (const kind of [...wanted, ...template]) {
    if (commands.length >= slots) break;
    const yard = yards.find((y) => arch(y)?.production?.includes(kind) && (queued.get(y.id) ?? 0) < MAX_QUEUE);
    if (!yard) continue;
    if (supply - costOf(kind) < reserve) {
      // Save up for what is needed most (a gun, a scout) unless the force is too thin to wait.
      if (wanted.includes(kind) && (fighters >= MIN_STORM || supply + income * SAVE_TURNS >= costOf(kind) + reserve)) break;
      continue;
    }
    if (tryOrder({ side, unit: yard.id, order: { type: 'produce', kind } })) {
      counts.set(kind, (counts.get(kind) ?? 0) + 1);
      queued.set(yard.id, (queued.get(yard.id) ?? 0) + 1);
    }
  }
  return commands;
}

/**
 * Deposits left to build on, nearest to `source` first (ties in the side's frame), without those a
 * known enemy fighter can reach (an Extractor there would only be shelled).
 */
function freeDeposits(obs: Observation, ruleset: Ruleset, source: Entity): { x: number; y: number }[] {
  const { world } = obs;
  return (world.map.deposits ?? [])
    .filter((d) => (d.left > 0 || d.left === UNKNOWN_LEFT || d.endless) && !world.entities.some((e) => e.x === d.x && e.y === d.y))
    .sort((a, b) => dist2(a.x, a.y, source.x, source.y) - dist2(b.x, b.y, source.x, source.y) || sideFrame(obs, cellOf(world.map, a.x, a.y)) - sideFrame(obs, cellOf(world.map, b.x, b.y)))
    .filter((d) => dangerAt(obs, ruleset, d.x, d.y) === 0);
}

/**
 * Where the next Radio Mast of the chain goes (see economyOrders): the covered, free, passable cell
 * nearest to `objective`, away from deposits and out of reach of known enemy fighters; none while
 * the cover already ends within MAST_GAP cells of the objective.
 */
function mastSpot(obs: Observation, ruleset: Ruleset, objective: Positioned): { x: number; y: number } | undefined {
  const { world, network } = obs;
  const taken = new Set(world.entities.map((e) => cellOf(world.map, e.x, e.y)));
  const deposits = new Set((world.map.deposits ?? []).map((d) => cellOf(world.map, d.x, d.y)));
  // A mast next to an own mast adds nothing (measured: where an enemy jammer swallows the cover a
  // dozen masts went up side by side, turn after turn).
  const masts = world.entities.filter((e) => e.side === obs.side && e.kind === 'relay-mast');
  let nearest = Number.POSITIVE_INFINITY;
  // The best cell out of known enemy reach, and the best one at all (the last masts may have to stand in reach).
  let safe: { x: number; y: number; d: number; f: number } | undefined;
  let any: { x: number; y: number; d: number; f: number } | undefined;
  const better = (a: { d: number; f: number } | undefined, d: number, f: number) => !a || d < a.d || (d === a.d && f < a.f);
  for (let y = 0; y < world.map.h; y++) {
    for (let x = 0; x < world.map.w; x++) {
      const c = cellOf(world.map, x, y);
      if (network.coverage[c] !== 1) continue;
      const d = dist2(x, y, objective.x, objective.y);
      nearest = Math.min(nearest, d);
      if (taken.has(c) || deposits.has(c) || !passable(world.map, ruleset, x, y, 'ground')) continue;
      if (masts.some((m) => dist2(m.x, m.y, x, y) <= MAST_GAP * MAST_GAP)) continue;
      const f = sideFrame(obs, c);
      if (better(any, d, f)) any = { x, y, d, f };
      if (dangerAt(obs, ruleset, x, y) === 0 && better(safe, d, f)) safe = { x, y, d, f };
    }
  }
  if (nearest <= MAST_GAP * MAST_GAP) return undefined;
  // A safe cell that still brings the cover closer; else the closest cell (a mast in reach is shot at,
  // but the cover must reach the objective for the storm to be ordered at all).
  const pick = safe && (!any || safe.d < nearest) ? safe : any;
  return pick && { x: pick.x, y: pick.y };
}

/** A free covered cell for a structure near `source`, away from deposits, nearest first (ties in the side's frame). */
function buildSpot(obs: Observation, ruleset: Ruleset, source: Entity, kind: string): { x: number; y: number } | undefined {
  const { world, side, network } = obs;
  const layer = archetypeOf(ruleset, kind)?.layer ?? 'ground';
  const taken = new Set(world.entities.map((e) => cellOf(world.map, e.x, e.y)));
  let best: { x: number; y: number; d: number; f: number } | undefined;
  for (let y = Math.max(0, source.y - 3); y <= Math.min(world.map.h - 1, source.y + 3); y++) {
    for (let x = Math.max(0, source.x - 3); x <= Math.min(world.map.w - 1, source.x + 3); x++) {
      const c = cellOf(world.map, x, y);
      if (taken.has(c) || network.coverage[c] !== 1 || !passable(world.map, ruleset, x, y, layer) || depositAt(world.map, x, y)) continue;
      // Not adjacent to the post or a yard: their neighbours are where produced units appear.
      if (world.entities.some((e) => e.side === side && (archetypeOf(ruleset, e.kind)?.production || e.kind === source.kind) && Math.max(Math.abs(e.x - x), Math.abs(e.y - y)) <= 1)) continue;
      const d = dist2(x, y, source.x, source.y);
      const f = sideFrame(obs, c);
      if (!best || d < best.d || (d === best.d && f < best.f)) best = { x, y, d, f };
    }
  }
  return best;
}

/**
 * A free covered cell for a tower within 2 cells of `asset`, towards the threat (nearest to the
 * nearest threatening enemy), never on a deposit or next to the post or a yard (where produced units appear),
 * and never where it would lengthen the ground route from the own post to an enemy post: a tower in a
 * pass walls in the side's own army (found on Ridge Valley: a tower in the valley's pass stalled every storm).
 */
function towerSpot(obs: Observation, ruleset: Ruleset, asset: Entity, threats: readonly Entity[], planned: readonly { x: number; y: number }[] = []): { x: number; y: number } | undefined {
  const { world, side, network } = obs;
  // Sites ordered earlier in this plan stand there too (two towers in one turn must not close a pass between them).
  const sites = planned.map((p) => cellOf(world.map, p.x, p.y));
  const taken = new Set([...world.entities.map((e) => cellOf(world.map, e.x, e.y)), ...sites]);
  const home = world.entities.find((e) => e.side === side && e.kind === 'command-post');
  const goals = targetPosts(obs).map((p) => cellOf(world.map, p.x, p.y));
  const structures = new Set([...world.entities.filter((e) => archetypeOf(ruleset, e.kind)?.speed === 0).map((e) => cellOf(world.map, e.x, e.y)), ...sites]);
  const route = (extra?: number): number => {
    if (!home || goals.length === 0) return 0;
    const blocked = new Set(structures);
    for (const g of goals) blocked.delete(g);
    blocked.delete(cellOf(world.map, home.x, home.y));
    if (extra !== undefined) blocked.add(extra);
    const field = flowField(world.map, ruleset, goals, 'ground', blocked);
    // From the cells around the post (the post itself is a structure the army leaves from).
    let best = Number.POSITIVE_INFINITY;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = home.x + dx, y = home.y + dy;
        if (x < 0 || y < 0 || x >= world.map.w || y >= world.map.h) continue;
        const d = field[cellOf(world.map, x, y)] ?? -1;
        if (d >= 0 && d < best) best = d;
      }
    }
    return best;
  };
  const before = route();
  let best: { x: number; y: number; d: number; f: number } | undefined;
  for (let y = Math.max(0, asset.y - 2); y <= Math.min(world.map.h - 1, asset.y + 2); y++) {
    for (let x = Math.max(0, asset.x - 2); x <= Math.min(world.map.w - 1, asset.x + 2); x++) {
      const c = cellOf(world.map, x, y);
      if (taken.has(c) || network.coverage[c] !== 1 || !passable(world.map, ruleset, x, y, 'ground') || depositAt(world.map, x, y)) continue;
      if (world.entities.some((e) => e.side === side && (archetypeOf(ruleset, e.kind)?.production || archetypeOf(ruleset, e.kind)?.comms?.role === 'source') && Math.max(Math.abs(e.x - x), Math.abs(e.y - y)) <= 1)) continue;
      const d = threats.reduce((m, e) => Math.min(m, dist2(x, y, e.x, e.y)), Number.POSITIVE_INFINITY);
      const f = sideFrame(obs, c);
      if (best && (d > best.d || (d === best.d && f > best.f))) continue;
      if (route(c) > before) continue; // it would stand in the way of the own army
      best = { x, y, d, f };
    }
  }
  return best;
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
function standOff(obs: Observation, ruleset: Ruleset, unit: Entity, objective: Positioned, distance?: number): { x: number; y: number } {
  const arch = archetypeOf(ruleset, unit.kind);
  const weapon = arch?.weapon;
  if (!weapon || (weapon.minRange <= 0 && distance === undefined)) return { x: objective.x, y: objective.y };
  const dx = unit.x - objective.x;
  const dy = unit.y - objective.y;
  const len = Math.hypot(dx, dy) || 1;
  const keep = distance ?? Math.max(weapon.minRange, weapon.range - 1);
  // An explicit distance is a front (a gun's own sight of a ghost): the cell lies within it,
  // also inside a gun's minimum range (it backs off again when it attacks). The gun's own
  // stand-off keeps clear of the minimum range.
  const near = distance === undefined ? weapon.minRange : 0;
  const want = { x: Math.round(objective.x + (dx / len) * keep), y: Math.round(objective.y + (dy / len) * keep) };
  const { w, h } = obs.world.map;
  let best: { x: number; y: number; d: number; f: number } | undefined;
  for (let y = Math.max(0, want.y - 2); y <= Math.min(h - 1, want.y + 2); y++) {
    for (let x = Math.max(0, want.x - 2); x <= Math.min(w - 1, want.x + 2); x++) {
      if (!passable(obs.world.map, ruleset, x, y, arch?.layer ?? 'ground')) continue;
      const d2 = dist2(x, y, objective.x, objective.y);
      if (d2 < near * near || d2 > keep * keep) continue;
      const d = dist2(x, y, want.x, want.y);
      const f = sideFrame(obs, cellOf(obs.world.map, x, y));
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

/** Fewest cut-off fighters the relay truck moves for. */
const STRANDED_MIN = 3;

/**
 * Own mobile fighters outside the side's coverage and away from the objective (beyond its
 * DEFENCE_RADIUS, or with no objective at all): no order reaches them, and no storm needs them there.
 */
function strandedFighters(obs: Observation, ruleset: Ruleset): Entity[] {
  if (!ruleset.commandNetwork) return [];
  const { world, side, network } = obs;
  const objective = objectiveOf(obs, ruleset);
  return world.entities.filter((e) => {
    const arch = archetypeOf(ruleset, e.kind);
    if (e.side !== side || !arch?.weapon || arch.speed === 0 || network.coverage[cellOf(world.map, e.x, e.y)] === 1) return false;
    return !objective || dist2(e.x, e.y, objective.x, objective.y) > DEFENCE_RADIUS * DEFENCE_RADIUS;
  });
}

/**
 * Where to set up a relay truck: the passable cell closest to the enemy Command Post that is
 * covered by the network *without* this truck (so the truck is still in contact when it
 * arrives and can be told to set up), at most RELAY_FORWARD cells from the own post along each
 * axis. Ties are broken in the side's own frame, so mirrored positions give mirrored choices.
 */
function relaySpot(obs: Observation, ruleset: Ruleset, truck: Entity, toward?: readonly Positioned[]): { x: number; y: number } | undefined {
  const { world, side } = obs;
  const post = world.entities.find((e) => e.side === side && e.kind === 'command-post');
  const known = enemiesOf(obs);
  const objective = objectiveOf(obs, ruleset);
  const goals: readonly Positioned[] = toward ?? (objective ? [objective] : []);
  if (!post || goals.length === 0) return undefined;
  const without = { ...world, entities: world.entities.filter((e) => e.id !== truck.id) };
  const coverage = computeNetwork(without, ruleset, side).coverage;
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
      const d = dangerAt(obs, ruleset, x, y) * 1000 * goals.length + goals.reduce((sum, g) => sum + dist2(x, y, g.x, g.y), 0);
      const f = sideFrame(obs, cell);
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
      const f = sideFrame(obs, cell);
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

/**
 * Enemies the side knows of: current sightings and last reports of hostile sides. A neutral
 * post is no enemy (it never fires); it is a target to take over (`objectiveOf`, `occupy`).
 */
const enemiesOf = (obs: Observation): Entity[] => obs.world.entities.filter((e) => e.side !== NEUTRAL && hostile(obs.world, obs.side, e.side));

type Positioned = Pick<Entity, 'id' | 'x' | 'y'>;

const nearestDistance = (unit: Entity, candidates: readonly Positioned[]): number =>
  candidates.reduce((best, e) => Math.min(best, dist2(unit.x, unit.y, e.x, e.y)), Number.POSITIVE_INFINITY);

/** Cell index of an entity in its side's own frame: tie-breaks that stay mirror-consistent. */
/**
 * A cell's index in the side's own frame (ADR 0009): the map's frame for its seat on maps with
 * several sides (so every seat plans alike), the two-side default otherwise.
 */
const sideFrame = (obs: Observation, cell: number): number => frameIndexIn(obs.world.map, frameOf(obs.world, obs.side), cell);
const frame = (obs: Observation, e: Positioned): number => sideFrame(obs, cellOf(obs.world.map, e.x, e.y));

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
