import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { isRecord } from '@wp/game-core';
import { BASE_RULESET, NEUTRAL, archetypeOf, canonicalJson, cellOf, findPath, observe, passable, DEFAULT_DOCTRINE, computeNetwork, createWorld, frameIndexIn, frameOf, teamOf, initialIntel, observedCells, resolveTurn, retire, validateCommand, worldHash, type Command, type Entity, type World } from '@wp/strategy-engine';
import { APPROACH_RADIUS, approachCells, assaultPlan, objectiveOf, outnumbered, planAi, type Difficulty } from '../src/ai';
import {
  cancelJob,
  cancelOrder,
  plannedJobs,
  canSettle,
  plannedSaleRefund,
  plannedSupply,
  settle,
  settleResult,
  doctrineFor,
  doctrineRefusal,
  lastSentOrder,
  planDoctrine,
  migrateState,
  orderRefusal,
  orderSlots,
  commandPost,
  concede,
  draftFor,
  isValidState,
  lockTurn,
  newGame,
  outcome,
  OPPONENT,
  picture,
  PLAYER,
  planOrder,
  replay,
  RULESET,
  sideValue,
  unitById,
  PLAYER_DOCTRINE,
  RANDOM_SIZES,
  MAX_TURNS,
  STALL_TURNS,
  STALL_MARGIN,
  CONTACT_TURN,
  stalled,
  stalemateTurns,
  type RcState,
  initialWorld,
  rulesetFor,
  SIDES_RULESET,
  strongestOpponent,
  confirmHandover,
  isHotSeat,
  personsLeft,
  rulesOf,
  type Seat,
  teamShapes,
  teamShapeOf,
  teamsOnly,
  winnersOf,
  teamValue,
  TEAM_LAYOUTS,
  opponentValue,
} from '../src/rules';
import { BASTION, FIELD_EXERCISE, opponentCounts, RIDGE_VALLEY, SCENARIOS } from '../src/scenarios';
import { customSpec, fromScenario } from '../src/maps';
import { generateMap } from '../src/generator';

/** A side's plan from its own observation (default: the game's default level). */
const ai = (world: World, side: number, difficulty: Difficulty = 'normal') => planAi(observe(world, RULESET, side), RULESET, difficulty);
const own = (s: RcState) => s.world.entities.filter((e) => e.side === PLAYER);
const enemy = (s: RcState) => s.world.entities.filter((e) => e.side === OPPONENT);
const validate = (world: World, c: Command) => validateCommand(world, RULESET, c).ok;
const withoutUnits = (world: World, ids: readonly number[]): World => ({ ...world, entities: world.entities.filter((e) => !ids.includes(e.id)) });

/** Plays a whole game with the scripted AI on both sides. */
function selfPlay(seed: number): RcState {
  let s = newGame(seed);
  for (let i = 0; i < 100 && s.phase === 'plan'; i++) {
    for (const c of ai(s.world, PLAYER)) s = planOrder(s, c.unit, c.order, c.doctrine) ?? s;
    s = lockTurn(s);
  }
  return s;
}

describe('Field Exercise scenario', () => {
  // Maps made for teams (Bastion) are asymmetric on purpose: they have tests of their own.
  for (const spec of SCENARIOS.filter((x) => !x.seats?.teams)) {
    it(`${spec.id} is symmetric in terrain and units, the Command Posts can reach each other, and every unit starts in radio cover (every opponent count)`, () => {
      const { map, entities } = spec.scenario;
      const key = (e: (typeof entities)[number]) => `${e.side}:${e.kind}:${e.x},${e.y}`;
      if (!spec.seats) {
        // Two sides: the point mirror with the sides swapped.
        expect(map.terrain).toBe([...map.terrain].reverse().join(''));
        const mirror = (e: (typeof entities)[number]) => `${1 - e.side}:${e.kind}:${map.w - 1 - e.x},${map.h - 1 - e.y}`;
        expect(new Set(entities.map(mirror))).toEqual(new Set(entities.map(key)));
      } else {
        // Four seats: a clockwise quarter turn carries seat k onto seat k+1, terrain and deposits onto themselves.
        const n = map.w;
        expect(map.h).toBe(n);
        const turn = (x: number, y: number) => [n - 1 - y, x] as const;
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
          const [tx, ty] = turn(x, y);
          expect(map.terrain[ty * n + tx]).toBe(map.terrain[y * n + x]);
        }
        const seats = spec.seats.frames.length;
        const turned = (e: (typeof entities)[number]) => {
          const [x, y] = turn(e.x, e.y);
          return `${(e.side + 1) % seats}:${e.kind}:${x},${y}`;
        };
        expect(new Set(entities.map(turned))).toEqual(new Set(entities.map(key)));
        const deposits = (map.deposits ?? []).map((d) => `${d.x},${d.y}`);
        expect(new Set((map.deposits ?? []).map((d) => turn(d.x, d.y).join(',')))).toEqual(new Set(deposits));
      }
      for (const opponents of opponentCounts(spec)) {
        const w = initialWorld(spec, 1, opponents);
        expect(w.sides).toBe(opponents + 1);
        const rules = rulesetFor(spec, opponents);
        const own = w.entities.find((e) => e.side === 0 && e.kind === 'command-post')!;
        for (let side = 1; side <= opponents; side++) {
          const post = w.entities.find((e) => e.side === side && e.kind === 'command-post')!;
          expect(findPath(w.map, rules, cellOf(w.map, own.x, own.y), cellOf(w.map, post.x, post.y), { layer: 'ground', side: 0 }), `${spec.id} ${opponents}: post of ${side}`).toBeDefined();
        }
        expect(isValidState(newGame(3, spec, 'normal', 12, false, null, opponents))).toBe(true);
        // Every unit starts inside its side's radio cover: all of them can be ordered on turn 1.
        for (let side = 0; side <= opponents; side++) {
          const cover = computeNetwork(w, rules, side).coverage;
          expect(w.entities.filter((e) => e.side === side && cover[cellOf(w.map, e.x, e.y)] !== 1).map((e) => `${e.kind}@${e.x},${e.y}`)).toEqual([]);
        }
      }
    });
  }

  it('an open-ended game is decided by the Command Posts, else by the stalemate rule or at MAX_TURNS', () => {
    const open = newGame(1, FIELD_EXERCISE, 'normal', null);
    expect(open.turnLimit).toBeNull();
    expect(open.lead).toEqual([]);
    const flat = Array.from({ length: STALL_TURNS + 1 }, () => 0);
    expect(outcome({ ...open.world, turn: 500 }, open.turnLimit)).toBeNull();
    expect(outcome({ ...open.world, turn: 500 }, null, flat.slice(1))).toBeNull();
    expect(outcome({ ...open.world, turn: 500 }, null, flat)).toBe('draw');
    expect(outcome(withoutUnits({ ...open.world, turn: 500 }, [enemy(open).find((e) => e.kind === 'warden')!.id]), null, flat)).toBe('won');
    expect(outcome({ ...open.world, turn: MAX_TURNS }, null)).toBe('draw');
    expect(outcome(withoutUnits(open.world, [commandPost(open.world, OPPONENT)!.id]), null)).toBe('won');
    // A turn limit ignores the stalemate record.
    expect(outcome({ ...open.world, turn: 5 }, 24, flat)).toBeNull();
    expect(isValidState(JSON.parse(JSON.stringify(open)))).toBe(true);
    expect(isValidState({ ...open, turnLimit: 0 })).toBe(false);
    // Several-sides data is not part of a v8 save (review of PR #21): a crafted save must not turn
    // the opponent's post neutral, or add teams or frames.
    const post = open.world.entities.find((e) => e.side === OPPONENT && e.kind === 'command-post')!;
    const neutral = structuredClone(open);
    neutral.world.entities.find((e) => e.id === post.id)!.side = NEUTRAL;
    for (const list of neutral.world.intel ?? []) for (const r of list) if (r.id === post.id) r.side = NEUTRAL;
    expect(isValidState(neutral)).toBe(false);
    expect(isValidState({ ...open, world: { ...open.world, teams: [0, 1] } })).toBe(false);
    expect(isValidState({ ...open, world: { ...open.world, frames: ['id', 'r180'] } })).toBe(false);
    expect(isValidState({ ...open, world: { ...open.world, out: [] } })).toBe(false);
    expect(isValidState({ ...open, lead: [1.5] })).toBe(false);
    expect(isValidState({ ...open, lead: [0] })).toBe(false); // more entries than turns played
    expect(isValidState({ ...lockTurn(open), lead: [0] })).toBe(true); // open-ended games keep the record (plain: it only offers to settle)
    expect(isValidState({ ...lockTurn(newGame(1, FIELD_EXERCISE, 'normal', 24)), lead: [0] })).toBe(false); // a turn limit keeps none
    expect(isValidState({ ...lockTurn({ ...open, quick: true }), lead: [0] })).toBe(true);
    expect(isValidState({ ...open, world: { ...open.world, turn: MAX_TURNS + 1 } })).toBe(false);
    expect(newGame(1, FIELD_EXERCISE, 'normal', 24).turnLimit).toBe(24);
  });

  it('stalemate rule: no progress for the trailing side means stalled; a comeback or a change of lead restarts the count', () => {
    expect(stalled(0, 0)).toBe(true);
    expect(stalled(0, STALL_MARGIN)).toBe(true);
    expect(stalled(0, STALL_MARGIN + 1)).toBe(false); // someone pulled ahead: count from here
    expect(stalled(300, 500)).toBe(true); // the leader extends its lead
    expect(stalled(-300, -280)).toBe(true); // the trailing side gains less than the margin
    expect(stalled(-300, -200)).toBe(false); // a real comeback
    expect(stalled(100, -100)).toBe(false); // the lead changed hands
    // Only the two posts: nothing can change, and from CONTACT_TURN the rule counts; the game ends
    // as a draw STALL_TURNS turns later.
    // Plain open end: the game goes on; from the same point the player may end it on strength.
    const plain = newGame(1, FIELD_EXERCISE, 'easy', null);
    let p: RcState = { ...plain, world: withoutUnits(plain.world, plain.world.entities.filter((e) => e.kind !== 'command-post').map((e) => e.id)) };
    while (p.world.turn < CONTACT_TURN + STALL_TURNS - 1) p = lockTurn(p);
    expect(canSettle(p)).toBe(false);
    expect(settle(p)).toBe(p);
    p = lockTurn(p);
    expect(p.phase).toBe('plan');
    expect(canSettle(p)).toBe(true);
    for (let i = 0; i < 3; i++) p = lockTurn(p);
    expect(p).toMatchObject({ phase: 'plan' });
    expect(canSettle(p)).toBe(true);
    const settled = settle(p);
    expect(settled).toMatchObject({ phase: 'finished', result: 'draw', settled: true, conceded: false });
    expect(isValidState(JSON.parse(JSON.stringify(settled)))).toBe(true);
    expect(isValidState({ ...settled, phase: 'plan', result: null })).toBe(false); // settled only when finished
    expect(isValidState({ ...settled, conceded: true })).toBe(false);
    expect(isValidState({ ...settled, lead: [] })).toBe(false); // settled only after a full stalemate record
    expect(settle(settled)).toBe(settled);
    // Quick match: the stalemate rule decides.
    const base = newGame(1, FIELD_EXERCISE, 'easy', null, true);
    expect(base.quick).toBe(true);
    expect(newGame(1, FIELD_EXERCISE, 'easy', 24, true).quick).toBe(false); // quick only with open end
    let s: RcState = { ...base, world: withoutUnits(base.world, base.world.entities.filter((e) => e.kind !== 'command-post').map((e) => e.id)) };
    while (s.phase === 'plan' && s.world.turn < CONTACT_TURN - 1) s = lockTurn(s);
    expect(s.lead).toEqual([]);
    while (s.phase === 'plan') s = lockTurn(s);
    expect(s).toMatchObject({ phase: 'finished', result: 'draw' });
    expect(s.world.turn).toBe(CONTACT_TURN + STALL_TURNS);
    expect(stalemateTurns(s)).toBe(STALL_TURNS);
  });

  it('mobile units start with the return-when-out-of-contact doctrine; v4 saves keep their old behaviour', () => {
    const s = newGame(1);
    for (const e of s.world.entities.filter((u) => u.kind !== 'command-post')) expect(e.doctrine).toEqual(PLAYER_DOCTRINE);
    const v4 = JSON.parse(JSON.stringify({ ...lockTurn(planDoctrine(s, own(s).find((u) => u.kind === 'rifles')!.id, { ...DEFAULT_DOCTRINE, holdFire: true })!), v: 4 })) as Record<string, unknown>;
    // Strip the field as a version-4 save would not have it.
    const strip = (o: unknown): unknown => (isRecord(o) ? Object.fromEntries(Object.entries(o).filter(([k]) => k !== 'lostContact').map(([k, v]) => [k, strip(v)])) : Array.isArray(o) ? o.map(strip) : o);
    const migrated = migrateState(strip(v4), 4)!;
    expect(migrated.v).toBe(12);
    expect(isValidState(migrated)).toBe(true);
    const rifle = own(migrated).find((u) => u.kind === 'rifles')!;
    expect(rifle.doctrine?.lostContact).toBe('keep');
    // Units without any doctrine in the save play on as before too ('keep'); 'regroup' is for new games.
    for (const u of own(migrated).filter((u) => u.kind !== 'command-post' && u.kind !== 'rifles')) expect(u.doctrine).toEqual({ ...PLAYER_DOCTRINE, lostContact: 'keep' });
    expect(migrated.lead).toEqual([]);
    expect(migrateState({ ...(strip(v4) as Record<string, unknown>), v: 7 }, 4)).toBeUndefined();
  });

  it('version-7 saves (before the map editor) play on: no player-made map, no draft', () => {
    const s = lockTurn(newGame(2, FIELD_EXERCISE, 'normal', 24));
    const v7 = JSON.parse(JSON.stringify({ ...s, v: 7 })) as Record<string, unknown>;
    delete v7.map;
    delete v7.edit;
    const migrated = migrateState(v7, 7)!;
    expect(migrated).toMatchObject({ v: 12, random: null, endless: false, opponents: 1, map: null, edit: null, scenario: 'field-exercise' });
    expect(isValidState(migrated)).toBe(true);
    expect(migrateState({ ...v7, v: 9 }, 7)).toBeUndefined();
    expect(isValidState(v7)).toBe(false);
  });

  it('version-6 saves (open end always had the stalemate rule) play on as a plain open end', () => {
    const s = lockTurn(newGame(2, FIELD_EXERCISE, 'normal', null, true));
    const v6 = JSON.parse(JSON.stringify({ ...s, v: 6, lead: [5] })) as Record<string, unknown>;
    delete v6.quick;
    const migrated = migrateState(v6, 6)!;
    expect(migrated).toMatchObject({ v: 12, random: null, endless: false, opponents: 1, quick: false, lead: [], turnLimit: null, map: null, edit: null });
    expect(isValidState(migrated)).toBe(true);
    expect(migrateState({ ...v6, v: 5 }, 6)).toBeUndefined();
    expect(isValidState({ ...newGame(2, FIELD_EXERCISE, 'normal', 12), quick: true })).toBe(false);
    expect(isValidState({ ...lockTurn(newGame(2, FIELD_EXERCISE, 'normal', 12)), lead: [0] })).toBe(false);
    expect(migrated.settled).toBe(false);
    // Neither a quick match nor a turn limit can be settled (the rule or the limit decides there).
    expect(isValidState({ ...migrated, quick: true, settled: true, phase: 'finished', result: 'won' })).toBe(false);
  });

  it('plans repairs and sales against the world they leave: paid once, a sold structure takes no more jobs, the refund pays nothing this turn', () => {
    const s = newGame(1);
    const yard = own(s).find((e) => e.kind === 'muster')!;
    const rifle = own(s).find((e) => e.kind === 'rifles')!;
    const free = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].map(([dx, dy]) => [yard.x + dx!, yard.y + dy!] as const).find(([x, y]) => passable(s.world.map, RULESET, x, y, 'ground') && !s.world.entities.some((e) => e.x === x && e.y === y))!;
    Object.assign(rifle, { x: free[0], y: free[1], hp: 20 });
    const price = Math.ceil((RULESET.archetypes.rifles!.cost * (RULESET.archetypes.rifles!.hp - 20)) / RULESET.archetypes.rifles!.hp / 2);
    const repaired = planOrder(s, yard.id, { type: 'repair', target: rifle.id })!;
    expect(plannedSupply(repaired)).toBe(300 - price);
    expect(orderRefusal(repaired, yard.id, { type: 'repair', target: rifle.id })).toBe('cannot-repair'); // already planned: full health then
    const sold = planOrder(repaired, yard.id, { type: 'sell' })!;
    expect(plannedSupply(sold)).toBe(300 - price); // the refund arrives with the turn
    expect(orderRefusal(sold, yard.id, { type: 'produce', kind: 'rifles' })).toBe('cannot-produce');
    expect(orderRefusal(sold, yard.id, { type: 'sell' })).toBe('cannot-sell'); // planned once
    // Its cell stays taken while planning: the engine tears it down after the whole batch (review of PR #14).
    const post = commandPost(s.world, PLAYER)!;
    expect(orderRefusal(sold, post.id, { type: 'build', kind: 'relay-mast', x: yard.x, y: yard.y })).toBe('not-buildable');
    expect(plannedSaleRefund(sold, yard.id)).toBe(Math.floor(RULESET.archetypes.muster!.cost / 2));
    const queued = planOrder(planOrder(s, yard.id, { type: 'produce', kind: 'rifles' })!, yard.id, { type: 'sell' })!;
    expect(plannedSaleRefund(queued, yard.id)).toBe(Math.floor(RULESET.archetypes.muster!.cost / 2) + RULESET.archetypes.rifles!.cost);
    expect(lockTurn(queued).world.supply?.[PLAYER]).toBe(300 + Math.floor(RULESET.archetypes.muster!.cost / 2) + 20);
    const after = lockTurn(sold);
    expect(after.world.entities.some((e) => e.id === yard.id)).toBe(false);
    expect(unitById(after, rifle.id)?.hp).toBe(RULESET.archetypes.rifles!.hp);
    expect(isValidState(JSON.parse(JSON.stringify(after)))).toBe(true);
    expect(orderRefusal(s, commandPost(s.world, PLAYER)!.id, { type: 'sell' })).toBe('cannot-sell');
  });

  it('a Relay Mast planned for sale still carries the network while planning (as in the engine, which tears it down after the batch)', () => {
    const s = newGame(1);
    const yard = own(s).find((e) => e.kind === 'muster')!;
    const post = commandPost(s.world, PLAYER)!;
    // A mast inside the post's coverage, and the yard moved to a free cell covered only through the mast.
    const before = computeNetwork(s.world, RULESET, PLAYER).coverage;
    const free = (x: number, y: number) => passable(s.world.map, RULESET, x, y, 'ground') && !s.world.entities.some((e) => e.x === x && e.y === y);
    let placed = false;
    for (let mx = 0; mx < s.world.map.w && !placed; mx++) {
      for (let my = 0; my < s.world.map.h && !placed; my++) {
        if (before[cellOf(s.world.map, mx, my)] !== 1 || !free(mx, my) || (mx === post.x && my === post.y)) continue;
        const trial = structuredClone(s);
        const mast = { ...structuredClone(yard), id: trial.world.nextId++, kind: 'relay-mast', x: mx, y: my, hp: RULESET.archetypes['relay-mast']!.hp };
        delete (mast as { queue?: unknown }).queue;
        trial.world.entities.push(mast);
        const withMast = computeNetwork(trial.world, RULESET, PLAYER).coverage;
        const target = [...withMast.keys()].find((c) => withMast[c] === 1 && before[c] !== 1 && free(c % s.world.map.w, Math.floor(c / s.world.map.w)));
        if (target === undefined) continue;
        const moved = trial.world.entities.find((e) => e.id === yard.id)!;
        Object.assign(moved, { x: target % s.world.map.w, y: Math.floor(target / s.world.map.w) });
        trial.world.entities.sort((a, b) => a.id - b.id);
        delete trial.world.intel;
        const sale = planOrder(trial, mast.id, { type: 'sell' });
        expect(sale).toBeDefined();
        expect(orderRefusal(sale!, yard.id, { type: 'produce', kind: 'rifles' })).toBeNull();
        expect(orderRefusal(sale!, mast.id, { type: 'produce', kind: 'rifles' })).toBe('cannot-produce');
        placed = true;
      }
    }
    expect(placed).toBe(true);
  });

  it('settling decides on strength: the side ahead wins, whoever settles', () => {
    const base = newGame(1, FIELD_EXERCISE, 'easy', null);
    const enemyUnits = base.world.entities.filter((e) => e.side === OPPONENT && e.kind !== 'command-post').map((e) => e.id);
    const ownUnits = base.world.entities.filter((e) => e.side === PLAYER && e.kind !== 'command-post').map((e) => e.id);
    const stalled = (world: RcState['world']): RcState => ({ ...base, world: { ...world, turn: STALL_TURNS }, log: Array.from({ length: STALL_TURNS }, (_, turn) => ({ turn, plans: [[], []] })), lead: Array.from({ length: STALL_TURNS + 1 }, () => 0) });
    expect(settle(stalled(withoutUnits(base.world, enemyUnits)))).toMatchObject({ result: 'won', settled: true });
    expect(settle(stalled(withoutUnits(base.world, ownUnits)))).toMatchObject({ result: 'lost', settled: true });
    expect(settleResult(stalled(base.world))).toBe('draw');
  });

  it('starts in the planning phase with one Command Post per side', () => {
    const s = newGame(5);
    expect(s.phase).toBe('plan');
    expect(s.seed).toBe(5);
    expect(s.world.turn).toBe(0);
    expect(commandPost(s.world, PLAYER)).toBeDefined();
    expect(commandPost(s.world, OPPONENT)).toBeDefined();
    expect(own(s)).toHaveLength(10); // 9 units and the Muster Yard
    expect(sideValue(s.world, PLAYER)).toBe(sideValue(s.world, OPPONENT));
    expect(isValidState(s)).toBe(true);
  });
});

describe('planning', () => {
  it('adds, replaces and cancels one order per unit', () => {
    const s0 = newGame(1);
    const rifle = own(s0).find((e) => e.kind === 'rifles')!;
    const s1 = planOrder(s0, rifle.id, { type: 'move', x: 5, y: 5 })!;
    expect(draftFor(s1, rifle.id)).toEqual({ type: 'move', x: 5, y: 5 });
    const s2 = planOrder(s1, rifle.id, { type: 'hold' })!;
    expect(s2.draft).toEqual([{ side: PLAYER, unit: rifle.id, order: { type: 'hold' } }]);
    expect(cancelOrder(s2, rifle.id).draft).toEqual([]);
    expect(s0.draft).toEqual([]);
  });

  it('rejects orders for enemy units, immobile units, unknown units and after the end', () => {
    const s = newGame(1);
    expect(planOrder(s, enemy(s)[0]!.id, { type: 'hold' })).toBeUndefined();
    expect(planOrder(s, commandPost(s.world, PLAYER)!.id, { type: 'move', x: 1, y: 1 })).toBeUndefined();
    expect(planOrder(s, 999, { type: 'hold' })).toBeUndefined();
    expect(planOrder(concede(s), own(s)[1]!.id, { type: 'hold' })).toBeUndefined();
  });
});

describe('command network (I3a)', () => {
  it('the Command Post gives 4 order slots; a fifth new order is refused, replacing one is free', () => {
    let s = newGame(1);
    expect(orderSlots(s)).toBe(4);
    const units = own(s).filter((e) => e.kind !== 'command-post');
    for (const u of units.slice(0, 4)) s = planOrder(s, u.id, { type: 'hold' })!;
    expect(s.draft).toHaveLength(4);
    expect(orderRefusal(s, units[4]!.id, { type: 'hold' })).toBe('no-slots');
    expect(planOrder(s, units[4]!.id, { type: 'hold' })).toBeUndefined();
    expect(orderRefusal(s, units[0]!.id, { type: 'move', x: units[0]!.x, y: units[0]!.y - 1 })).toBeNull();
  });

  it('units outside the coverage cannot receive orders and keep their last order', () => {
    const s = structuredClone(newGame(1));
    const rifle = s.world.entities.find((e) => e.side === PLAYER && e.kind === 'rifles')!;
    rifle.x = 9;
    rifle.y = 9;
    rifle.order = { type: 'move', x: 9, y: 2 };
    expect(orderRefusal(s, rifle.id, { type: 'hold' })).toBe('out-of-contact');
    // Player units return into coverage after a turn without contact (doctrine default) …
    const after = lockTurn(s);
    expect(unitById(after, rifle.id)!.order).toEqual({ type: 'regroup' });
    expect(after.events.some((e) => e.t === 'order-ended' && e.id === rifle.id && e.reason === 'lost-contact')).toBe(true);
    expect(unitById(after, rifle.id)!.y).toBeLessThan(9);
    // … unless told to carry on.
    const keep = structuredClone(s);
    unitById(keep, rifle.id)!.doctrine = { ...PLAYER_DOCTRINE, lostContact: 'keep' };
    expect(unitById(lockTurn(keep), rifle.id)!.order).toEqual({ type: 'move', x: 9, y: 2 });
  });

  it('a Mast Truck set up for a turn extends the coverage', () => {
    let s = newGame(1);
    const truck = own(s).find((e) => e.kind === 'mast-truck')!;
    s = planOrder(s, truck.id, { type: 'deploy' })!;
    const before = orderSlots(s);
    s = lockTurn(s);
    expect(unitById(s, truck.id)!.deploy).toBe(RULESET.ticksPerTurn);
    expect(orderSlots(s)).toBe(before);
  });

  it('the opponent obeys coverage and order slots and gets its relay set up by turn 3 (B1)', () => {
    for (const seed of [1, 2, 3]) {
      let s = newGame(seed);
      let setUp = false;
      for (let turn = 0; turn < 6 && s.phase === 'plan'; turn++) {
        const plan = ai(s.world, OPPONENT);
        expect(plan.length).toBeLessThanOrEqual(4);
        for (const c of plan) expect(validate(s.world, c)).toBe(true);
        s = lockTurn(s);
        const truck = enemy(s).find((e) => e.kind === 'mast-truck');
        if (truck?.deploy === RULESET.ticksPerTurn) setUp = true;
        if (turn === 2) expect(setUp).toBe(true);
      }
      // Once set up, it stays inside its own coverage and keeps working.
      const truck = enemy(s).find((e) => e.kind === 'mast-truck');
      if (truck) expect(computeNetwork(s.world, RULESET, OPPONENT).nodes).toContain(truck.id);
    }
  });

  it('the opponent only spends order slots on orders that will be accepted (N8)', () => {
    const s = structuredClone(newGame(1));
    // Put every opponent unit but one out of contact: the plan must still only hold valid orders.
    for (const e of s.world.entities) if (e.side === OPPONENT && e.kind !== 'command-post' && e.kind !== 'rifles') Object.assign(e, { x: e.x - 6, y: e.y + 6 });
    s.world.entities.sort((a, b) => a.id - b.id);
    for (const c of ai(s.world, OPPONENT)) expect(validate(s.world, c)).toBe(true);
  });

  it('migrates a real version-1 save with a full draft: drafts are re-checked against the new limits (N5)', () => {
    // Version 1: base ruleset, no Mast Truck (nor EW units), five planned orders (no slot limit back then).
    const entities = FIELD_EXERCISE.scenario.entities.filter((e) => !['mast-truck', 'jammer', 'tracer', 'muster'].includes(e.kind));
    const world = createWorld({ ...FIELD_EXERCISE.scenario, entities, seed: 9 }, BASE_RULESET);
    const mobile = world.entities.filter((e) => e.side === PLAYER && e.kind !== 'command-post');
    const v1 = {
      v: 1,
      seed: 9,
      scenario: 'field-exercise',
      turnLimit: 12,
      world,
      phase: 'plan',
      draft: mobile.map((e) => ({ side: PLAYER, unit: e.id, order: { type: 'hold' } })),
      events: [],
      log: [],
      result: null,
      conceded: false
    };
    expect(v1.draft).toHaveLength(5);
    const migrated = migrateState(JSON.parse(JSON.stringify(v1)), 1)!;
    expect(migrated.v).toBe(12);
    expect(migrated.draft.length).toBeLessThanOrEqual(orderSlots(migrated));
    expect(migrated.draft.every((c) => orderRefusal({ ...migrated, draft: [] }, c.unit, c.order) === null)).toBe(true);
    expect(isValidState(migrated)).toBe(true);
  });

  it('migrates a version-1 save (no network) to the strategy ruleset', () => {
    const v1 = { ...structuredClone(newGame(3)), v: 1 } as Record<string, unknown>;
    (v1.world as Record<string, unknown>).ruleset = 'base-1';
    const migrated = migrateState(v1, 1);
    expect(migrated?.v).toBe(12);
    expect(migrated?.world.ruleset).toBe(RULESET.id);
    expect(migrateState(v1, 2)).toBeUndefined();
    expect(migrateState(null, 1)).toBeUndefined();
    expect(migrateState({ ...v1, world: { ...(v1.world as object), map: { w: 1, h: 1, terrain: '.' } } }, 1)).toBeUndefined();
  });
});

describe('doctrines (I3b)', () => {
  it('planDoctrine re-issues the current order with the new doctrine; a later order keeps it', () => {
    let s = newGame(1);
    const rifle = own(s).find((e) => e.kind === 'rifles')!;
    const d = { ...DEFAULT_DOCTRINE, priority: 'armor' as const };
    s = planDoctrine(s, rifle.id, d)!;
    expect(s.draft).toEqual([{ side: PLAYER, unit: rifle.id, order: { type: 'hold' }, doctrine: d }]);
    expect(doctrineFor(s, rifle.id)).toEqual(d);
    s = planOrder(s, rifle.id, { type: 'move', x: rifle.x, y: rifle.y - 1 })!;
    expect(s.draft[0]!.doctrine).toEqual(d);
    expect(doctrineRefusal(s, rifle.id, { ...d, retreatBelow: 40 as never })).toBe('bad-order');
    s = lockTurn(s);
    expect(unitById(s, rifle.id)!.doctrine).toEqual(d);
    expect(doctrineFor(s, rifle.id)).toEqual(d);
  });

  it('the opponent leaves fighters below its retreat threshold alone (no wasted slots)', () => {
    const s = structuredClone(newGame(1));
    const hurt = s.world.entities.find((e) => e.side === OPPONENT && e.kind === 'rifles')!;
    hurt.hp = 5;
    let world = s.world;
    for (let turn = 0; turn < 3; turn++) {
      const plan = ai(world, OPPONENT);
      expect(plan.some((c) => c.unit === hurt.id)).toBe(false);
      world = lockTurn({ ...s, world, draft: [] }).world;
      if (!world.entities.some((e) => e.id === hurt.id)) break;
    }
  });

  it('the opponent gives its fighters a retreat doctrine', () => {
    // Without Supply there is nothing to spend on, so every slot goes to the units.
    const plan = ai({ ...newGame(1).world, supply: [0, 0] }, OPPONENT);
    const fighters = plan.filter((c) => c.order.type === 'attack' || (c.order.type === 'move' && unitById(newGame(1), c.unit)?.kind !== 'mast-truck'));
    expect(fighters.length).toBeGreaterThan(0);
    for (const c of fighters) expect(c.doctrine?.retreatBelow).toBe(25);
  });

  it('drafts with doctrines and the new orders survive validation as plain JSON', () => {
    let s = newGame(1);
    const rifle = own(s).find((e) => e.kind === 'rifles')!;
    const post = commandPost(s.world, PLAYER)!;
    s = planOrder(s, rifle.id, { type: 'escort', target: post.id }, { ...DEFAULT_DOCTRINE, holdFire: true })!;
    expect(isValidState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(isValidState({ ...s, draft: [{ ...s.draft[0]!, doctrine: { retreatBelow: 10 } }] })).toBe(false);
  });
});

describe('resolving a turn', () => {
  it('applies the locked plan, advances one turn, logs both plans and clears the draft', () => {
    const s0 = newGame(3);
    const rifle = own(s0).find((e) => e.kind === 'rifles')!;
    const s1 = lockTurn(planOrder(s0, rifle.id, { type: 'move', x: rifle.x, y: rifle.y - 3 })!);
    expect(s1.world.turn).toBe(1);
    expect(s1.draft).toEqual([]);
    expect(s1.log).toHaveLength(1);
    expect(s1.log[0]!.plans[0]).toEqual([{ side: PLAYER, unit: rifle.id, order: { type: 'move', x: rifle.x, y: rifle.y - 3 } }]);
    expect(unitById(s1, rifle.id)!.y).toBeLessThan(rifle.y);
    expect(s1.events.length).toBeGreaterThan(0);
    expect(isValidState(s1)).toBe(true);
  });

  it('can be replayed exactly from the seed and the log', () => {
    const s = selfPlay(11);
    expect(worldHash(replay(11, s.log))).toBe(worldHash(s.world));
  });

  it('the opponent plan never depends on the player draft (P8)', () => {
    fc.assert(
      fc.property(fc.nat(1000), fc.array(fc.record({ unit: fc.integer({ min: 1, max: 6 }), x: fc.nat(11), y: fc.nat(11) }), { maxLength: 6 }), (seed, orders) => {
        let s = newGame(seed);
        const before = canonicalJson(ai(s.world, OPPONENT));
        for (const o of orders) s = planOrder(s, o.unit, { type: 'move', x: o.x, y: o.y }) ?? s;
        expect(canonicalJson(ai(s.world, OPPONENT))).toBe(before);
        // Locking with any draft records the same opponent plan.
        expect(canonicalJson(lockTurn(s).log[0]!.plans[1])).toBe(before);
      }),
      { numRuns: 50 }
    );
  });

  it('scripted self-play always ends within the turn limit with a valid state', () => {
    for (const seed of [1, 2, 3]) {
      const s = selfPlay(seed);
      expect(s.phase).toBe('finished');
      expect(s.world.turn).toBeLessThanOrEqual(FIELD_EXERCISE.turnLimit);
      expect(isValidState(s)).toBe(true);
      // Symmetric start + mirror-consistent engine + same AI on both sides ⇒ a symmetric result.
      expect(s.result).toBe('draw');
    }
  });

  it('does nothing once finished', () => {
    const s = concede(newGame(1));
    expect(lockTurn(s)).toBe(s);
    expect(concede(s)).toBe(s);
    expect(s).toMatchObject({ phase: 'finished', result: 'lost', conceded: true });
  });
});

describe('outcome', () => {
  const s = newGame(1);
  const cp = (side: number) => commandPost(s.world, side)!.id;
  it('destroying a Command Post decides the game at once', () => {
    expect(outcome(s.world, 12)).toBeNull();
    expect(outcome(withoutUnits(s.world, [cp(OPPONENT)]), 12)).toBe('won');
    expect(outcome(withoutUnits(s.world, [cp(PLAYER)]), 12)).toBe('lost');
    expect(outcome(withoutUnits(s.world, [cp(PLAYER), cp(OPPONENT)]), 12)).toBe('draw');
  });

  it('at the turn limit the remaining value decides', () => {
    const atLimit = { ...s.world, turn: 12 };
    expect(outcome(atLimit, 12)).toBe('draw');
    const weaker = enemy(s).find((e) => e.kind === 'warden')!.id;
    expect(outcome(withoutUnits(atLimit, [weaker]), 12)).toBe('won');
    const mine = own(s).find((e) => e.kind === 'warden')!.id;
    expect(outcome(withoutUnits(atLimit, [mine]), 12)).toBe('lost');
    expect(outcome({ ...s.world, turn: 11 }, 12)).toBeNull();
  });

  it('values units by cost scaled with remaining health; the Command Post counts 300', () => {
    const w = structuredClone(s.world);
    const before = sideValue(w, PLAYER);
    const warden = w.entities.find((e) => e.side === PLAYER && e.kind === 'warden')!;
    warden.hp = 70;
    expect(sideValue(w, PLAYER)).toBe(before - 75);
    expect(sideValue(withoutUnits(s.world, [cp(PLAYER)]), PLAYER)).toBe(before - 300);
  });

  it('a won game sets the finished phase', () => {
    const s0 = newGame(1);
    const lethal = structuredClone(s0);
    const post = commandPost(lethal.world, OPPONENT)!;
    post.hp = 1;
    // Put a player rifle next to the enemy Command Post.
    const rifle = lethal.world.entities.find((e) => e.side === PLAYER && e.kind === 'rifles')!;
    rifle.x = post.x - 1;
    rifle.y = post.y + 1;
    lethal.world.entities.sort((a, b) => a.id - b.id);
    const after = lockTurn(lethal);
    expect(after.result).toBe('won');
    expect(after.phase).toBe('finished');
  });
});

describe('isValidState', () => {
  it('never throws and rejects junk and inconsistent states', () => {
    fc.assert(
      fc.property(fc.anything(), (v) => {
        expect(() => isValidState(v)).not.toThrow();
      }),
      { numRuns: 200 }
    );
    const s = newGame(1);
    const bad: unknown[] = [
      { ...s, v: 2 },
      { ...s, world: { ...s.world, intel: undefined } },
      { ...s, seed: -1 },
      { ...s, scenario: 'nope' },
      { ...s, turnLimit: 0 },
      { ...s, phase: 'resolve' },
      { ...s, world: { ...s.world, sides: 3 } },
      { ...s, world: null },
      { ...s, draft: [{ side: OPPONENT, unit: 7, order: { type: 'hold' } }] },
      { ...s, draft: [{ side: PLAYER, unit: 2, order: { type: 'hold' } }, { side: PLAYER, unit: 2, order: { type: 'hold' } }] },
      { ...s, draft: [{ side: PLAYER, unit: 2, order: { type: 'fly' } }] },
      { ...s, events: [{ t: 'move' }] },
      { ...s, log: [{ turn: 0, plans: [[]] }] },
      { ...s, conceded: 'no' },
      { ...s, result: 'won' },
      { ...s, phase: 'finished' }
    ];
    // Saves that do not match the scenario (manipulated or from another version) are rejected too.
    const huge = structuredClone(s);
    huge.world.map = { w: 128, h: 128, terrain: '.'.repeat(128 * 128) };
    const proto = structuredClone(s);
    proto.world.entities[1]!.kind = 'constructor';
    const foreign = structuredClone(s);
    foreign.world.entities[1]!.kind = 'tower-laser';
    const crowded = structuredClone(s);
    crowded.world.entities.push({ ...structuredClone(crowded.world.entities[1]!), id: 99, x: 5, y: 5 });
    crowded.world.nextId = 100;
    const otherRuleset = structuredClone(s);
    otherRuleset.world.ruleset = 'other';
    const reshaped = structuredClone(s);
    reshaped.world.map = { ...reshaped.world.map, terrain: `~${reshaped.world.map.terrain.slice(1)}` };
    bad.push(
      huge,
      proto,
      foreign,
      crowded,
      otherRuleset,
      reshaped,
      { ...s, draft: [{ side: PLAYER, unit: 2, order: { type: 'move', x: 12, y: 0 } }] },
      { ...s, draft: [{ side: PLAYER, unit: 2, order: { type: 'hold', extra: 1 } }] }
    );
    for (const b of bad) expect(isValidState(b)).toBe(false);
    expect(isValidState(JSON.parse(JSON.stringify(lockTurn(s))))).toBe(true);
    expect(isValidState(concede(s))).toBe(true);
  });

  it('plain JSON round-trips through isValidState after arbitrary planning', () => {
    const s = planOrder(newGame(2), 2, { type: 'move', x: 3, y: 9 }) as RcState;
    const copy = JSON.parse(JSON.stringify(s)) as RcState;
    expect(copy).toEqual(s);
    expect(isValidState(copy)).toBe(true);
    const cmds: Command[] = copy.draft;
    expect(cmds).toHaveLength(1);
  });
});

describe('information model (I3c, D7)', () => {
  /** Enemy ids the opponent's side holds any report on. */
  const knownTo = (world: World, side: number) => new Set((world.intel?.[side] ?? []).map((r) => r.id));

  it('the player sees only reported enemies; their orders and doctrines are never revealed', () => {
    const s = newGame(1);
    const pic = picture(s.world);
    const shownEnemies = pic.world.entities.filter((e) => e.side === OPPONENT);
    // At the start only the enemy structures are known, from before the battle (ghosts).
    expect(shownEnemies.map((e) => e.kind)).toEqual(['command-post', 'muster']);
    for (const e of shownEnemies) expect(pic.ghosts.get(e.id)).toBe(0);
    // Own units in contact are shown exactly as they are.
    for (const e of own(s).filter((u) => !pic.ghosts.has(u.id))) expect(pic.world.entities).toContainEqual(e);
    // A spotted enemy is shown at its true position, but without its orders.
    const spotted = structuredClone(s);
    const foe = spotted.world.entities.find((e) => e.side === OPPONENT && e.kind === 'rifles')!;
    const rifle = spotted.world.entities.find((e) => e.side === PLAYER && e.kind === 'rifles')!;
    Object.assign(foe, { x: rifle.x, y: rifle.y - 2, order: { type: 'move', x: 0, y: 0 }, doctrine: { ...DEFAULT_DOCTRINE, holdFire: true } });
    spotted.world.intel = initialIntel(spotted.world, RULESET);
    const shown = picture(spotted.world).world.entities.find((e) => e.id === foe.id)!;
    expect(shown).toMatchObject({ x: foe.x, y: foe.y, hp: foe.hp, order: { type: 'hold' } });
    expect(shown.doctrine).toBeUndefined();
  });

  it('the turn summary only carries events the player could know about', () => {
    let s = newGame(2);
    for (let i = 0; i < 4 && s.phase === 'plan'; i++) {
      const before = s;
      s = lockTurn(s);
      const all = resolveTurn(before.world, RULESET, s.log.at(-1)!.plans).events;
      expect(all.length).toBeGreaterThanOrEqual(s.events.length);
      // Every event happened, except muzzle flashes (reports only): those name a real unit of another side.
      for (const ev of s.events) {
        if (ev.t === 'flash') expect(s.world.entities.find((e) => e.id === ev.id)?.side).not.toBe(PLAYER);
        else expect(all).toContainEqual(ev);
      }
      // No movement of an enemy the player cannot see is reported.
      const seen = new Set((s.world.intel?.[PLAYER] ?? []).filter((r) => r.live).map((r) => r.id));
      const lastMoves = s.events.filter((e) => e.t === 'move' && e.tick === s.world.tick && unitById(s, e.id)?.side === OPPONENT);
      for (const m of lastMoves) expect(seen.has((m as { id: number }).id)).toBe(true);
    }
  });

  it('the opponent plans with what its side knows: unseen player units do not change its plan', () => {
    fc.assert(
      fc.property(fc.nat(1000), fc.integer({ min: 0, max: 11 }), fc.integer({ min: 0, max: 11 }), (seed, x, y) => {
        const s = newGame(seed);
        const before = canonicalJson(ai(s.world, OPPONENT));
        // Move a player unit the opponent has no report on to any free cell it does not observe.
        const hidden = own(s).find((e) => e.kind !== 'command-post' && !knownTo(s.world, OPPONENT).has(e.id));
        if (!hidden) return;
        const moved = structuredClone(s.world);
        const unit = moved.entities.find((e) => e.id === hidden.id)!;
        const free = !moved.entities.some((e) => e.x === x && e.y === y) && validate(moved, { side: PLAYER, unit: unit.id, order: { type: 'move', x, y } });
        if (!free) return;
        Object.assign(unit, { x, y });
        moved.intel = initialIntel(moved, RULESET);
        if (knownTo(moved, OPPONENT).has(unit.id)) return; // now in the opponent's sight: allowed to differ
        moved.intel = s.world.intel!; // the opponent’s knowledge is what it was
        expect(canonicalJson(ai(moved, OPPONENT))).toBe(before);
      }),
      { numRuns: 60 }
    );
  });

  it('with nothing in sight the opponent moves its fighters towards the enemy post (easy: straight at it; normal: to a rally point)', () => {
    // Without Supply nothing is spent, so the slots go to the units.
    const w = { ...newGame(1).world, supply: [0, 0] };
    const post = commandPost(w, PLAYER)!;
    // Easy heads for the nearest known enemy position: a structure it knows from the start.
    const known = w.entities.filter((e) => e.side === PLAYER && ['command-post', 'muster'].includes(e.kind));
    const easy = ai(w, OPPONENT, 'easy');
    const nearestKnown = (x: number, y: number) => Math.min(...known.map((k) => (k.x - x) ** 2 + (k.y - y) ** 2));
    const easyMoves = easy.filter((c) => c.order.type === 'move' && unitById(newGame(1), c.unit)?.kind !== 'mast-truck');
    expect(easyMoves.length).toBeGreaterThan(0);
    for (const c of easyMoves) {
      const unit = w.entities.find((e) => e.id === c.unit)!;
      if (c.order.type === 'move') expect(nearestKnown(c.order.x, c.order.y)).toBeLessThan(nearestKnown(unit.x, unit.y));
    }
    const normal = ai(w, OPPONENT, 'normal');
    const moves = normal.filter((c) => c.order.type === 'move');
    expect(moves.length).toBeGreaterThan(0);
    for (const c of moves) {
      const unit = w.entities.find((e) => e.id === c.unit)!;
      if (c.order.type !== 'move' || unit.kind === 'mast-truck') continue;
      expect((c.order.x - post.x) ** 2 + (c.order.y - post.y) ** 2).toBeLessThan((unit.x - post.x) ** 2 + (unit.y - post.y) ** 2);
    }
    expect(normal.some((c) => c.order.type === 'attack')).toBe(false);
  });

  it('orders on enemies out of sight are refused with a reason', () => {
    const s = newGame(1);
    const rifle = own(s).find((e) => e.kind === 'rifles')!;
    const foe = enemy(s).find((e) => e.kind === 'rifles')!;
    expect(orderRefusal(s, rifle.id, { type: 'attack', target: foe.id })).toBe('not-visible');
  });

  it('migrates a version-2 save (no fog): reports start from what each side sees, the summary is dropped', () => {
    const s = lockTurn(newGame(5));
    const v2 = JSON.parse(JSON.stringify({ ...s, v: 2, world: { ...s.world, ruleset: 'strategy-1', intel: undefined } })) as Record<string, unknown>;
    const migrated = migrateState(v2, 2)!;
    expect(migrated.v).toBe(12);
    expect(migrated.world.ruleset).toBe(RULESET.id);
    expect(migrated.events).toEqual([]);
    expect(migrated.world.intel).toEqual(initialIntel(s.world, RULESET));
    expect(isValidState(migrated)).toBe(true);
    expect(migrateState({ ...v2, v: 3 }, 2)).toBeUndefined();
  });
});

describe('review of PR #8', () => {
  /** Mid-game state: k turns in which the player gives random orders (the opponent is scripted). */
  const arbMidGame = fc
    .record({
      seed: fc.nat(1000),
      turns: fc.array(fc.array(fc.record({ unit: fc.integer({ min: 1, max: 7 }), x: fc.nat(11), y: fc.nat(11), kind: fc.constantFrom('move', 'patrol', 'regroup') }), { maxLength: 4 }), {
        minLength: 1,
        maxLength: 5
      })
    })
    .map(({ seed, turns }) => {
      let s = newGame(seed);
      for (const plan of turns) {
        if (s.phase !== 'plan') break;
        for (const o of plan) {
          const order = o.kind === 'move' ? { type: 'move' as const, x: o.x, y: o.y } : o.kind === 'patrol' ? { type: 'patrol' as const, x: o.x, y: o.y, rx: o.y, ry: o.x } : { type: 'regroup' as const };
          s = planOrder(s, o.unit, order) ?? s;
        }
        s = lockTurn(s);
      }
      return s;
    });

  it('the opponent plan does not change when player units it does not see move or get other orders (mid-game)', () => {
    // A pool of mid-games (each costs up to five resolved turns), drawn afresh on every run like
    // the rest of the property, probed 120 times: the same number of checks as one game per run at
    // about half the cost (timing review, 2026-10-14). Stale reports are pinned down by a fixed
    // engine test as well (observe.test.ts, review of PR #36). Every probe is a relevant one: a
    // unit the opponent has no live report of, moved to a free cell it does not observe (games
    // without such a move are not drawn), so the number of checks never depends on the draw
    // (it once fell to 29 of a required 31; orchestrator, 2026-10-18).
    const probesOf = (s: RcState) => {
      const intel = s.world.intel?.[OPPONENT] ?? [];
      const hidden = own(s).filter((e) => e.kind !== 'command-post' && !intel.some((r) => r.id === e.id && r.live));
      const observed = observedCells(s.world, RULESET, OPPONENT);
      const { w, h } = s.world.map;
      const probes: { unit: number; x: number; y: number }[] = [];
      for (const unit of hidden) {
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            if (observed[y * w + x] === 1 || s.world.entities.some((e) => e.x === x && e.y === y)) continue;
            if (validate(s.world, { side: PLAYER, unit: unit.id, order: { type: 'move', x, y } })) probes.push({ unit: unit.id, x, y });
          }
        }
      }
      return probes;
    };
    const games = fc.sample(arbMidGame.map((s) => ({ s, probes: probesOf(s) })).filter((g) => g.probes.length > 0), 30);
    let checked = 0;
    fc.assert(
      fc.property(fc.nat(games.length - 1), fc.nat(100_000), fc.constantFrom('hold', 'regroup', 'move'), (g, pick, kind) => {
        const { s, probes } = games[g]!;
        const probe = probes[pick % probes.length]!;
        const before = canonicalJson(ai(s.world, OPPONENT));
        const moved = structuredClone(s.world);
        const unit = moved.entities.find((e) => e.id === probe.unit)!;
        Object.assign(unit, { x: probe.x, y: probe.y, order: kind === 'move' ? { type: 'move', x: 0, y: 0 } : { type: kind } });
        checked++;
        expect(canonicalJson(ai(moved, OPPONENT))).toBe(before);
      }),
      { numRuns: 120 }
    );
    expect(checked).toBe(120);
  });

  it('rejects saves with more reports or ids than the scenario has entities (hostile saves)', () => {
    const s = lockTurn(newGame(1));
    expect(isValidState(s)).toBe(true);
    const flooded = structuredClone(s);
    const ghost = { id: 1, side: OPPONENT, kind: 'rifles', x: 0, y: 0, hp: 1, tick: 0, live: false };
    flooded.world.intel![PLAYER] = Array.from({ length: 50_000 }, (_, i) => ({ ...ghost, id: i + 100 }));
    flooded.world.nextId = 60_000;
    expect(isValidState(flooded)).toBe(false);
    const bigId = structuredClone(s);
    bigId.world.nextId = 1_000_000;
    expect(isValidState(bigId)).toBe(false);
  });

  it('migration keeps a doctrine planned in a version-2 save', () => {
    const s = newGame(5);
    const rifle = own(s).find((e) => e.kind === 'rifles')!;
    const d = { ...DEFAULT_DOCTRINE, holdFire: true };
    const planned = planDoctrine(s, rifle.id, d)!;
    const v2 = JSON.parse(JSON.stringify({ ...planned, v: 2, world: { ...planned.world, ruleset: 'strategy-1', intel: undefined } })) as Record<string, unknown>;
    const migrated = migrateState(v2, 2)!;
    expect(migrated.draft).toEqual([{ side: PLAYER, unit: rifle.id, order: { type: 'hold' }, doctrine: d }]);
  });

  it('remembers the last order sent to a unit (shown as unconfirmed while out of contact)', () => {
    let s = newGame(2);
    const rifle = own(s).find((e) => e.kind === 'rifles')!;
    expect(lastSentOrder(s, rifle.id)).toBeUndefined();
    s = lockTurn(planOrder(s, rifle.id, { type: 'move', x: rifle.x, y: 0 })!);
    s = lockTurn(s);
    expect(lastSentOrder(s, rifle.id)).toEqual({ type: 'move', x: rifle.x, y: 0 });
  });
});

describe('electronic warfare (I4)', () => {
  const ewWorld = (jammerAt: { x: number; y: number }) =>
    createWorld(
      {
        map: FIELD_EXERCISE.scenario.map,
        sides: 2,
        seed: 1,
        entities: [
          { side: 1, kind: 'command-post', x: 10, y: 1 },
          { side: 1, kind: 'jammer', ...jammerAt },
          { side: 1, kind: 'tracer', x: 11, y: 2 },
          { side: 1, kind: 'mast-truck', x: 11, y: 3 },
          { side: 0, kind: 'relay-mast', x: 6, y: 3 },
          { side: 0, kind: 'command-post', x: 1, y: 10 }
        ]
      },
      RULESET
    );

  it('the opponent drives its jammer to a covered cell within 3 of a known enemy relay and sets it up there', () => {
    const plan = ai(ewWorld({ x: 9, y: 0 }), OPPONENT, 'hard');
    const move = plan.find((c) => c.unit === 2)?.order;
    expect(move?.type).toBe('move');
    if (move?.type !== 'move') return;
    expect((move.x - 6) ** 2 + (move.y - 3) ** 2).toBeLessThanOrEqual(9);
    const there = ai(ewWorld({ x: move.x, y: move.y }), OPPONENT, 'hard');
    expect(there.find((c) => c.unit === 2)?.order).toEqual({ type: 'deploy' });
  });

  it('the opponent keeps its tracer with its relay truck', () => {
    const plan = ai({ ...ewWorld({ x: 9, y: 0 }), supply: [0, 0] }, OPPONENT, 'hard');
    expect(plan.find((c) => c.unit === 3)?.order).toEqual({ type: 'escort', target: 4 });
  });

  it('both sides start with a jammer and a tracer; the scenario stays symmetric', () => {
    const s = newGame(1);
    for (const side of [PLAYER, OPPONENT]) {
      expect(s.world.entities.filter((e) => e.side === side && (e.kind === 'jammer' || e.kind === 'tracer')).map((e) => e.kind).sort()).toEqual(['jammer', 'tracer']);
    }
  });
});

describe('save bounds (review of PR #8, round 2)', () => {
  it('rejects saves with oversized turn summaries or plans', () => {
    const s = lockTurn(newGame(3));
    expect(isValidState(s)).toBe(true);
    const n = FIELD_EXERCISE.scenario.entities.length;
    const event = { t: 'bump', tick: 1, id: 2 };
    expect(isValidState({ ...s, events: Array.from({ length: n * RULESET.ticksPerTurn * 12 + 1 }, () => event) })).toBe(false);
    const bigPlan = Array.from({ length: n + 1 }, () => ({ side: PLAYER, unit: 2, order: { type: 'hold' } }));
    expect(isValidState({ ...s, log: [{ turn: 0, plans: [bigPlan, []] }] })).toBe(false);
  });
});



describe('several sides (docs/design/strategy.md § 9.4)', () => {
  const corners = SCENARIOS.find((s) => s.id === 'four-corners')!;

  it('a four-base map offers 1 to 3 opponents; the empty seats hold neutral posts; two-side maps offer one', () => {
    expect(opponentCounts(corners)).toEqual([1, 2, 3]);
    expect(opponentCounts(FIELD_EXERCISE)).toEqual([1]);
    for (const n of [1, 2, 3]) {
      const s = newGame(1, corners, 'normal', 12, false, null, n);
      expect(s.opponents).toBe(n);
      expect(s.world.sides).toBe(n + 1);
      expect(s.world.entities.filter((e) => e.side === NEUTRAL)).toHaveLength(3 - n);
      expect(s.world.ruleset).toBe(SIDES_RULESET.id);
      expect(isValidState(JSON.parse(JSON.stringify(s)))).toBe(true);
    }
    // An undeclared count falls back to one; a two-side map keeps the two-side rules.
    expect(newGame(1, FIELD_EXERCISE, 'normal', 12, false, null, 3)).toMatchObject({ opponents: 1, world: { sides: 2, ruleset: RULESET.id } });
  });

  it('every opponent plans and fights; a game with three opponents ends and stays a valid save every turn', () => {
    let s = newGame(2, corners, 'normal', 30, false, null, 3);
    for (let i = 0; i < 30 && s.phase === 'plan'; i++) {
      s = lockTurn(s);
      expect(s.log.at(-1)!.plans).toHaveLength(4);
      expect(isValidState(JSON.parse(JSON.stringify(s))), `turn ${s.world.turn}`).toBe(true);
    }
    expect(s.phase).toBe('finished');
    // Opponents gave orders (each plans for itself).
    for (const side of [1, 2, 3]) expect(s.log.some((t) => (t.plans[side] ?? []).length > 0), `side ${side}`).toBe(true);
  });

  it('the result: lost when the player is out, won when every opponent is out, on strength against the strongest opponent left', () => {
    const s = newGame(1, corners, 'normal', 12, false, null, 2);
    const without = (sides: number[]) => ({ ...s.world, entities: s.world.entities.filter((e) => !sides.includes(e.side)), out: sides.filter((x) => x !== NEUTRAL).sort() });
    expect(outcome(without([0]), 12)).toBe('lost');
    expect(outcome(without([1]), 12)).toBeNull(); // one opponent left
    expect(outcome(without([1, 2]), 12)).toBe('won');
    expect(outcome(without([0, 1, 2]), 12)).toBe('draw');
    // At the turn limit: ahead of every opponent wins; behind the strongest loses.
    const atLimit = { ...s.world, turn: 12 };
    expect(outcome(atLimit, 12)).toBe('draw'); // all start equal
    const strong = structuredClone(atLimit);
    strong.supply![2] = 10_000;
    expect(outcome(strong, 12)).toBe('lost');
    const ahead = structuredClone(atLimit);
    ahead.supply![0] = 10_000;
    expect(outcome(ahead, 12)).toBe('won');
  });

  it('infantry next to a neutral post takes it over at the end of the turn and the player is told', () => {
    let s = newGame(1, corners, 'normal', 12, false, null, 2);
    const post = s.world.entities.find((e) => e.side === NEUTRAL)!;
    const rifle = s.world.entities.find((e) => e.side === PLAYER && e.kind === 'rifles')!;
    const spot = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]].map(([dx, dy]) => [post.x + dx!, post.y + dy!] as const).find(([x, y]) => x >= 0 && y >= 0 && x < 16 && y < 16 && !s.world.entities.some((e) => e.x === x && e.y === y) && passable(s.world.map, SIDES_RULESET, x, y, 'ground'))!;
    s = structuredClone(s);
    Object.assign(s.world.entities.find((e) => e.id === rifle.id)!, { x: spot[0], y: spot[1] });
    s.world.intel = initialIntel(s.world, SIDES_RULESET);
    s = lockTurn(s);
    expect(s.world.entities.find((e) => e.id === post.id)?.side).toBe(PLAYER);
    expect(s.events.some((e) => e.t === 'captured' && e.to === PLAYER && e.id === post.id)).toBe(true);
  });

  it('after the player takes a post, its own units no longer fire on it (regression of the PR #22 blocker, in the game)', () => {
    let s = newGame(1, corners, 'normal', 30, false, null, 2);
    const post = s.world.entities.find((e) => e.side === NEUTRAL)!;
    const free = (x: number, y: number) => x >= 0 && y >= 0 && x < 16 && y < 16 && !s.world.entities.some((e) => e.x === x && e.y === y) && passable(s.world.map, SIDES_RULESET, x, y, 'ground');
    const around = [[-1, 0], [0, -1], [-1, -1], [1, 0], [0, 1], [1, -1], [-1, 1], [1, 1]].map(([dx, dy]) => [post.x + dx!, post.y + dy!] as const).filter(([x, y]) => free(x, y));
    s = structuredClone(s);
    const rifle = s.world.entities.find((e) => e.side === PLAYER && e.kind === 'rifles')!;
    const lancer = s.world.entities.find((e) => e.side === PLAYER && e.kind === 'lancer')!;
    Object.assign(rifle, { x: around[0]![0], y: around[0]![1] });
    Object.assign(lancer, { x: around[1]![0], y: around[1]![1], order: { type: 'attack', target: post.id } });
    s.world.intel = initialIntel(s.world, SIDES_RULESET);
    s = lockTurn(s);
    expect(s.world.entities.find((e) => e.id === post.id)?.side).toBe(PLAYER);
    const hp = s.world.entities.find((e) => e.id === post.id)!.hp;
    for (let i = 0; i < 3 && s.phase === 'plan'; i++) {
      s = lockTurn(s);
      expect(s.events.some((e) => e.t === 'fire' && e.target === post.id && unitById(s, e.id)?.side === PLAYER)).toBe(false);
    }
    // Nobody else reached it in these turns: its health is what the capture left.
    expect(s.world.entities.find((e) => e.id === post.id)?.hp).toBe(hp);
  });

  it('the opponent goes for the nearest enemy post it knows of; the strongest opponent is the one with most strength', () => {
    const s = newGame(1, corners, 'normal', 30, false, null, 3);
    // Seat 1 (top left) is as close to the player (bottom left) as to seat 2 (top right); seat 2 to seats 1 and 3.
    const posts = (side: number) => s.world.entities.find((e) => e.side === side && e.kind === 'command-post')!;
    const target = (side: number) => objectiveOf(observe(s.world, SIDES_RULESET, side), SIDES_RULESET)!;
    const d = (a: Entity, b: Entity) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
    for (const side of [1, 2, 3]) {
      const chosen = target(side);
      const others = [0, 1, 2, 3].filter((x) => x !== side).map(posts);
      expect(d(chosen, posts(side))).toBe(Math.min(...others.map((p) => d(p, posts(side)))));
    }
    // Without the far ones known, it still picks among what it knows: drop all but the farthest from the observation.
    const obs = observe(s.world, SIDES_RULESET, 1);
    const far = posts(3);
    obs.world.entities = obs.world.entities.filter((e) => e.kind !== 'command-post' || e.side === 1 || e.id === far.id);
    expect(objectiveOf(obs, SIDES_RULESET)?.id).toBe(far.id);
    const w = structuredClone(s.world);
    w.supply = [0, 10, 900, 20];
    expect(strongestOpponent(w)).toBe(2);
    w.supply = [0, 950, 900, 20];
    expect(strongestOpponent(w)).toBe(1);
  });

  it('target choice: a known defence makes a post a worse target, a damaged one a better, a post under attack stays the target; no side is preferred', () => {
    const s = newGame(1, corners, 'normal', 30, false, null, 3);
    const post = (side: number) => s.world.entities.find((e) => e.side === side && e.kind === 'command-post')!;
    // Seat 1 (top left) is as far from the player (bottom left) as from seat 2 (top right).
    const base = observe(s.world, SIDES_RULESET, 1);
    const pick = (edit: (obs: typeof base) => void) => {
      const obs = structuredClone(base);
      edit(obs);
      return objectiveOf(obs, SIDES_RULESET)?.side;
    };
    let id = 10_000;
    const guards = (obs: typeof base, side: number, n: number) => {
      const p = post(side);
      for (let i = 0; i < n; i++) obs.world.entities.push({ ...structuredClone(s.world.entities.find((e) => e.kind === 'warden')!), id: id++, side, x: p.x + (i % 3) - 1, y: p.y + (side === 0 ? -2 : 2) });
    };
    // Defended: the other one is chosen, whichever side it is.
    expect(pick((obs) => guards(obs, 0, 3))).toBe(2);
    expect(pick((obs) => guards(obs, 2, 3))).toBe(0);
    // Damaged: preferred.
    expect(pick((obs) => (obs.world.entities.find((e) => e.id === post(0).id)!.hp = 60))).toBe(0);
    expect(pick((obs) => (obs.world.entities.find((e) => e.id === post(2).id)!.hp = 60))).toBe(2);
    // Under attack by the side's own fighters: it stays the target despite a guard more.
    for (const target of [0, 2]) {
      expect(
        pick((obs) => {
          guards(obs, target, 1);
          for (const e of obs.world.entities) if (e.side === 1 && archetypeOf(SIDES_RULESET, e.kind)?.weapon && (archetypeOf(SIDES_RULESET, e.kind)?.speed ?? 0) > 0) e.order = { type: 'attack', target: post(target).id };
        })
      ).toBe(target);
    }
  });

  it('a neutral post is a target to take over: an opponent next to one goes for it and takes it within the first turns', () => {
    let s = newGame(1, corners, 'normal', 30, false, null, 2);
    const neutral = s.world.entities.find((e) => e.side === NEUTRAL)!;
    // Seat 2 (top right) is as far from seat 1 as from the empty seat below it, which nobody defends.
    expect(objectiveOf(observe(s.world, SIDES_RULESET, 2), SIDES_RULESET)?.id).toBe(neutral.id);
    // Without infantry, or a yard to train some, a neutral post is no target (nobody could take it).
    const bare = observe(s.world, SIDES_RULESET, 2);
    bare.world.entities = bare.world.entities.filter((e) => e.side !== 2 || !['rifles', 'lancer', 'muster'].includes(e.kind));
    expect(objectiveOf(bare, SIDES_RULESET)?.side).toBe(1);
    const yard = observe(s.world, SIDES_RULESET, 2);
    yard.world.entities = yard.world.entities.filter((e) => e.side !== 2 || !['rifles', 'lancer'].includes(e.kind));
    expect(objectiveOf(yard, SIDES_RULESET)?.id).toBe(neutral.id);
    for (let i = 0; i < 10 && s.phase === 'plan'; i++) s = lockTurn(s);
    const taken = s.world.entities.find((e) => e.id === neutral.id);
    expect(taken?.side, 'taken over, not destroyed').toBeGreaterThan(PLAYER);
  });

  it('a damaged own post with hostile infantry near gets a guard next to it', () => {
    const s = structuredClone(newGame(1, corners, 'normal', 30, false, null, 3));
    const w = s.world;
    const post = w.entities.find((e) => e.side === 1 && e.kind === 'command-post')!;
    const next = (e: Entity) => Math.max(Math.abs(e.x - post.x), Math.abs(e.y - post.y)) <= 1;
    const free = (x: number, y: number) => x >= 0 && y >= 0 && x < 16 && y < 16 && !w.entities.some((e) => e.x === x && e.y === y) && passable(w.map, SIDES_RULESET, x, y, 'ground');
    // Nobody of its own next to it; a hostile rifle squad two cells off.
    for (const e of w.entities.filter((e) => e.side === 1 && e !== post && next(e) && (archetypeOf(SIDES_RULESET, e.kind)?.speed ?? 0) > 0)) {
      const [x, y] = [[6, 1], [6, 2], [6, 3], [5, 3]].find(([x, y]) => free(x!, y!))!;
      Object.assign(e, { x, y });
    }
    const raider = w.entities.find((e) => e.side === 0 && e.kind === 'rifles')!;
    const [rx, ry] = [[post.x + 2, post.y + 2], [post.x + 2, post.y], [post.x, post.y + 2]].find(([x, y]) => free(x!, y!))!;
    Object.assign(raider, { x: rx, y: ry });
    w.intel = initialIntel(w, SIDES_RULESET);
    const guardOrders = (hp: number) => {
      post.hp = hp;
      return planAi(observe(w, SIDES_RULESET, 1), SIDES_RULESET, 'normal').filter((c) => c.order.type === 'move' && Math.max(Math.abs(c.order.x - post.x), Math.abs(c.order.y - post.y)) <= 1);
    };
    expect(guardOrders(150)).toHaveLength(1);
    // Healthy post: no guard needed.
    expect(guardOrders(400)).toHaveLength(0);
  });

  it('fighters cut off from the net away from the objective make the set-up relay truck move to reach them', () => {
    const s = structuredClone(newGame(1, corners, 'normal', 30, false, null, 3));
    const w = s.world;
    const side = 1;
    const truck = w.entities.find((e) => e.side === side && e.kind === 'mast-truck')!;
    Object.assign(truck, { order: { type: 'deploy' }, deploy: SIDES_RULESET.ticksPerTurn });
    const truckOrders = () => planAi(observe(w, SIDES_RULESET, side), SIDES_RULESET, 'normal').filter((c) => c.unit === truck.id);
    w.intel = initialIntel(w, SIDES_RULESET);
    expect(truckOrders()).toHaveLength(0);
    const coverage = computeNetwork(w, SIDES_RULESET, side).coverage;
    const posts = w.entities.filter((e) => e.kind === 'command-post' && e.side !== side);
    const home = w.entities.find((e) => e.side === side && e.kind === 'command-post')!;
    const cells: [number, number][] = [];
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      if (coverage[cellOf(w.map, x, y)] === 1 || w.entities.some((e) => e.x === x && e.y === y) || !passable(w.map, SIDES_RULESET, x, y, 'ground')) continue;
      if (posts.some((p) => (p.x - x) ** 2 + (p.y - y) ** 2 <= 49)) continue;
      cells.push([x, y]);
    }
    cells.sort((a, b) => (a[0] - home.x) ** 2 + (a[1] - home.y) ** 2 - ((b[0] - home.x) ** 2 + (b[1] - home.y) ** 2));
    const fighters = w.entities.filter((e) => e.side === side && (e.kind === 'rifles' || e.kind === 'lancer' || e.kind === 'warden'));
    expect(fighters.length).toBeGreaterThanOrEqual(3);
    fighters.slice(0, 3).forEach((f, i) => Object.assign(f, { x: cells[i]![0], y: cells[i]![1] }));
    w.intel = initialIntel(w, SIDES_RULESET);
    expect(truckOrders().map((c) => c.order.type)).toEqual(['move']);
  });

  it('saves: v8 migrates to v9 with one opponent; a v9 save must match its map, count, rules and frames', () => {
    const v8 = JSON.parse(JSON.stringify({ ...newGame(4), v: 8 })) as Record<string, unknown>;
    delete v8.opponents;
    expect(migrateState(v8, 8)).toMatchObject({ v: 12, random: null, endless: false, opponents: 1 });
    expect(migrateState({ ...v8, v: 9 }, 8)).toBeUndefined();
    const s = newGame(1, corners, 'normal', 12, false, null, 2);
    expect(isValidState({ ...s, opponents: 3 })).toBe(false);
    expect(isValidState({ ...newGame(1), opponents: 2 })).toBe(false);
    expect(isValidState({ ...s, world: { ...s.world, frames: ['id', 'id', 'id'] } })).toBe(false);
    expect(isValidState({ ...s, world: { ...s.world, ruleset: RULESET.id } })).toBe(false);
    expect(isValidState({ ...s, world: { ...s.world, teams: [0, 1, 1] } })).toBe(false);
    // An opponent's post turned neutral (not one of the map's empty seats) is refused: in the world
    // (its reports agreeing) and, separately, only in an old report of it (a ghost may keep a stale
    // owner, but never claim a neutral post that is not one of the map's).
    const crafted = structuredClone(s);
    const post = crafted.world.entities.find((e) => e.side === 1 && e.kind === 'command-post')!;
    post.side = NEUTRAL;
    for (const list of crafted.world.intel ?? []) for (const r of list) if (r.id === post.id) r.side = NEUTRAL;
    expect(isValidState(crafted)).toBe(false);
    const ghost = structuredClone(s);
    const report = ghost.world.intel![0]!.find((r) => r.id === post.id)!;
    report.side = NEUTRAL;
    report.live = false;
    expect(isValidState(ghost)).toBe(false);
    const fine = structuredClone(s);
    fine.world.intel![0]!.find((r) => r.id === post.id)!.live = false;
    expect(isValidState(fine)).toBe(true);
  });
});


describe('hot-seat (docs/design/strategy.md § 9.4, D10)', () => {
  const corners = SCENARIOS.find((x) => x.id === 'four-corners')!;
  /** The person planning gives the orders the AI would (a stand-in for a person's plan). */
  const plan = (s: RcState, level: Difficulty = 'normal'): RcState => {
    let next = s;
    for (const c of planAi(observe(s.world, rulesOf(s), s.planning), rulesOf(s), level)) next = planOrder(next, c.unit, c.order, c.doctrine) ?? next;
    return next;
  };
  const valid = (s: RcState) => isValidState(JSON.parse(JSON.stringify(s)));
  const game = (seats: Seat[], opponents = 3, limit: number | null = 30) => newGame(7, corners, 'normal', limit, false, null, opponents, seats);

  it('the seats: side 0 is always a person, the default is the computer; several persons have no quick match', () => {
    expect(newGame(1, corners, 'normal', null, true, null, 3).seats).toEqual(['person', 'computer', 'computer', 'computer']);
    const s = newGame(1, corners, 'normal', null, true, null, 3, ['computer', 'person', 'computer', 'person']);
    expect(s.seats).toEqual(['person', 'person', 'computer', 'person']);
    expect(isHotSeat(s)).toBe(true);
    expect(s.quick).toBe(false);
    expect(canSettle({ ...s, lead: Array.from({ length: STALL_TURNS + 1 }, () => 0) })).toBe(false);
    expect(valid(s)).toBe(true);
  });

  it('a lock hands the device on: final for that person, nothing resolved, nothing playable until the next person confirms; the last lock resolves all plans at once', () => {
    let s = game(['person', 'person', 'computer', 'person']);
    s = plan(s);
    const aPlan = s.draft;
    expect(aPlan.length).toBeGreaterThan(0);
    s = lockTurn(s);
    expect(s).toMatchObject({ planning: 1, handover: true, draft: [], log: [] });
    expect(s.locked[0]).toEqual(aPlan);
    expect(s.world.turn).toBe(0);
    expect(valid(s)).toBe(true);
    // Behind the hand-over nothing can be planned, locked or given up.
    const unit = s.world.entities.find((e) => e.side === 1 && e.kind === 'rifles')!;
    expect(orderRefusal(s, unit.id, { type: 'hold' })).toBe('finished');
    expect(lockTurn(s)).toBe(s);
    expect(concede(s)).toBe(s);
    s = confirmHandover(s);
    expect(s.handover).toBe(false);
    // B plans its own side only; A's units are not B's to order.
    const aUnit = s.world.entities.find((e) => e.side === 0 && e.kind === 'rifles')!;
    expect(planOrder(s, aUnit.id, { type: 'hold' })).toBeUndefined();
    s = plan(s);
    const bPlan = s.draft;
    expect(bPlan.every((c) => c.side === 1)).toBe(true);
    s = confirmHandover(lockTurn(s));
    expect(s.planning).toBe(3);
    s = plan(s);
    const dPlan = s.draft;
    const before = s.world;
    s = lockTurn(s);
    expect(s.log).toHaveLength(1);
    const plans = s.log[0]!.plans;
    expect(plans[0]).toEqual(aPlan);
    expect(plans[1]).toEqual(bPlan);
    expect(plans[3]).toEqual(dPlan);
    expect(plans[2]).toEqual(planAi(observe(before, SIDES_RULESET, 2), SIDES_RULESET, 'normal'));
    // Each person gets their own summary: A now (after the hand-over), B and D when it is their turn.
    const r = resolveTurn(before, SIDES_RULESET, plans);
    expect(s).toMatchObject({ planning: 0, handover: true, events: r.reported![0], locked: [[], [], [], []] });
    expect(s.inbox).toEqual([[], r.reported![1], [], r.reported![3]]);
    expect(valid(s)).toBe(true);
    s = lockTurn(confirmHandover(s));
    expect(s).toMatchObject({ planning: 1, events: r.reported![1] });
    expect(s.inbox[1]).toEqual([]);
  });

  it('giving up retires only that side: the others play on, its plan is gone, everyone is told with the next summary, and the log replays it', () => {
    let s = game(['person', 'person', 'computer', 'person']);
    s = lockTurn(plan(s));
    s = plan(confirmHandover(s));
    s = concede(s);
    expect(s.phase).toBe('plan');
    expect(s.world.out).toEqual([1]);
    expect(s.world.entities.some((e) => e.side === 1)).toBe(false);
    expect(s).toMatchObject({ planning: 3, handover: true, retired: [1], draft: [] });
    expect(s.locked[1]).toEqual([]);
    expect(valid(s)).toBe(true);
    s = lockTurn(plan(confirmHandover(s)));
    expect(s.log[0]).toMatchObject({ retired: [1] });
    expect(s.log[0]!.plans[1]).toEqual([]);
    expect(s.events[0]).toMatchObject({ t: 'eliminated', side: 1 });
    expect(s.inbox[3]![0]).toMatchObject({ t: 'eliminated', side: 1 });
    expect(personsLeft(s)).toEqual([0, 3]);
    expect(canonicalJson(replay(7, s.log, corners, 3))).toBe(canonicalJson(s.world));
    expect(valid(s)).toBe(true);
    // The person planning last gives up: the turn is resolved at once.
    let t = lockTurn(plan(game(['person', 'person', 'computer', 'computer'])));
    t = concede(confirmHandover(t));
    expect(t.log).toHaveLength(1);
    expect(t.log[0]).toMatchObject({ retired: [1] });
    expect(t).toMatchObject({ planning: 0, handover: false });
  });

  it('the game ends when at most one side is left or no person is; the strongest side left wins (a tie: draw); nothing of any side is shown afterwards', () => {
    // Two persons on a two-side map: giving up ends it, the other wins.
    let s = newGame(1, FIELD_EXERCISE, 'normal', 24, false, null, 1, ['person', 'person']);
    expect(isHotSeat(s)).toBe(true);
    s = concede(confirmHandover(lockTurn(plan(s))));
    expect(s).toMatchObject({ phase: 'finished', winner: 0, result: 'won', conceded: true, events: [], draft: [], handover: false });
    expect(valid(s)).toBe(true);
    // The last person gives up while computers are left: the strongest computer side wins.
    let c = game(['person', 'person', 'computer', 'computer']);
    c = concede(c);
    expect(c.phase).toBe('plan');
    c = concede(confirmHandover(c));
    expect(c.phase).toBe('finished');
    expect(c.winner === 2 || c.winner === 3 || c.winner === null).toBe(true);
    expect(valid(c)).toBe(true);
    // At the turn limit the strongest side wins; equal strength is a draw.
    let d = game(['person', 'person', 'computer', 'computer'], 3, 1);
    d = lockTurn(confirmHandover(lockTurn(d)));
    expect(d.phase).toBe('finished');
    expect(d.inbox.every((e) => e.length === 0) && d.locked.every((p) => p.length === 0)).toBe(true);
    expect(valid(d)).toBe(true);
  });

  it('a person who is out is skipped: the device goes from A straight to C in the next turns (review of PR #25)', () => {
    let s = game(['person', 'person', 'person', 'computer']);
    s = lockTurn(plan(s));
    s = concede(confirmHandover(s)); // B gives up; C plans
    expect(s.planning).toBe(2);
    s = lockTurn(plan(confirmHandover(s))); // turn carried out
    expect(s).toMatchObject({ planning: 0, handover: true });
    s = lockTurn(plan(confirmHandover(s)));
    expect(s).toMatchObject({ planning: 2, handover: true });
    expect(s.inbox[1]).toEqual([]);
    expect(valid(s)).toBe(true);
  });

  it('no person left ends the game at once (computers do not play on alone), the strongest computer side winning (review of PR #25)', () => {
    let s = game(['person', 'person', 'computer', 'computer']);
    s = confirmHandover(lockTurn(plan(s)));
    // Both persons' posts are gone by the end of this turn: both are out, two computers are left.
    s = structuredClone(s);
    s.world.entities = s.world.entities.filter((e) => !(e.kind === 'command-post' && (e.side === 0 || e.side === 1)));
    s = lockTurn(s);
    expect(s.world.out).toEqual([0, 1]);
    expect(s.phase).toBe('finished');
    const strength = [2, 3].map((side) => sideValue(s.world, side));
    expect(s.winner).toBe(strength[0]! > strength[1]! ? 2 : strength[1]! > strength[0]! ? 3 : null);
    expect(valid(s)).toBe(true);
  });

  it('at the turn limit the strongest side wins and equal strength is a draw (review of PR #25)', () => {
    // Two persons on a point-symmetric map who give no orders stay equal: a draw.
    const even = newGame(1, FIELD_EXERCISE, 'normal', 1, false, null, 1, ['person', 'person']);
    const tied = lockTurn(confirmHandover(lockTurn(even)));
    expect(sideValue(tied.world, 0)).toBe(sideValue(tied.world, 1));
    expect(tied).toMatchObject({ phase: 'finished', winner: null, result: 'draw' });
    // The same with more Supply for B: B wins.
    const rich = structuredClone(even);
    rich.world.supply![1] = 900;
    const won = lockTurn(confirmHandover(lockTurn(rich)));
    expect(won).toMatchObject({ phase: 'finished', winner: 1, result: 'lost' });
  });

  it('a hot-seat game is a valid save at every step, also mid-hand-over, and stays so when finished', () => {
    let s = game(['person', 'person', 'person', 'person'], 3, 6);
    for (let i = 0; i < 100 && s.phase === 'plan'; i++) {
      s = s.handover ? confirmHandover(s) : lockTurn(plan(s));
      expect(valid(s), `step ${i}`).toBe(true);
    }
    expect(s.phase).toBe('finished');
    expect(s.winner === null || (s.winner >= 0 && s.winner <= 3)).toBe(true);
  });

  it('saves: v9 migrates to v10 as a single-player game; a crafted hot-seat save is refused', () => {
    const v9 = JSON.parse(JSON.stringify({ ...newGame(4, corners, 'normal', 12, false, null, 2), v: 9 })) as Record<string, unknown>;
    for (const k of ['seats', 'planning', 'handover', 'locked', 'inbox', 'retired', 'winner', 'endless', 'random']) delete v9[k];
    expect(migrateState(v9, 9)).toMatchObject({ v: 12, random: null, endless: false, seats: ['person', 'computer', 'computer'], planning: 0, handover: false, locked: [[], [], []], inbox: [[], [], []], retired: [], winner: null });
    expect(migrateState({ ...v9, v: 10 }, 9)).toBeUndefined();
    const solo = newGame(1, corners, 'normal', 12, false, null, 3);
    const hot = lockTurn(plan(game(['person', 'person', 'computer', 'person'])));
    expect(valid(hot)).toBe(true);
    const bad: [string, RcState][] = [
      ['side 0 a computer', { ...hot, seats: ['computer', 'person', 'computer', 'person'] }],
      ['seats not one per side', { ...hot, seats: ['person', 'person'] }],
      ['planning a computer side', { ...hot, planning: 2 }],
      ['single player planning another side', { ...solo, planning: 1 }],
      ['single player behind a hand-over', { ...solo, handover: true }],
      ['a locked plan for a side after the one planning', { ...hot, locked: [hot.locked[0]!, [], [], hot.locked[0]!.map((c) => ({ ...c, side: 3 }))] }],
      ['a locked plan for a computer', { ...hot, locked: [hot.locked[0]!, [], hot.locked[0]!.map((c) => ({ ...c, side: 2 })), []] }],
      ['a locked plan of another side', { ...hot, locked: [hot.locked[0]!.map((c) => ({ ...c, side: 1 })), [], [], []] }],
      ['a waiting summary for a side before the one planning', { ...hot, inbox: [[{ t: 'income', tick: 1, side: 0, amount: 1 }], [], [], []] as RcState['inbox'] }],
      ['a draft of another side', { ...hot, draft: hot.locked[0]! }],
      ['a winner in a running game', { ...hot, winner: 1 }],
      ['a winner in a single-player game', { ...solo, phase: 'finished', result: 'won', winner: 0 }],
      ['a retired side that is not out', { ...hot, retired: [1] }],
      ['a quick match with several persons', { ...hot, turnLimit: null, quick: true }],
      ['a finished hot-seat game holding a plan', { ...hot, phase: 'finished', result: 'draw', winner: null, handover: false, locked: hot.seats.map(() => []), draft: hot.locked[0]!.map((c) => ({ ...c, side: 1 })) }],
      ['a finished hot-seat game holding a summary', { ...hot, phase: 'finished', result: 'draw', winner: null, handover: false, locked: hot.seats.map(() => []), events: [{ t: 'income', tick: 1, side: 1, amount: 1 }] as RcState['events'] }]
    ];
    for (const [why, state] of bad) expect(valid(state), why).toBe(false);
    expect(valid({ ...hot, phase: 'finished', result: 'draw', winner: null, handover: false, locked: hot.seats.map(() => []), draft: [], events: [] }), 'the same finished save, empty').toBe(true);
    // A person who is out has no plan and no waiting summary.
    const gone = concede(confirmHandover(hot));
    expect(valid(gone)).toBe(true);
    expect(valid({ ...gone, locked: gone.locked.map((p, side) => (side === 1 ? hot.locked[0]!.map((c) => ({ ...c, side: 1 })) : p)) })).toBe(false);
    expect(valid({ ...gone, inbox: gone.inbox.map((e, side) => (side === 1 ? [{ t: 'income', tick: 1, side: 1, amount: 1 }] : e)) as RcState['inbox'] })).toBe(false);
  });
});

describe('deposits that never run dry (owner decision 2026-10-14, state v11)', () => {
  const valid = (s: RcState) => isValidState(JSON.parse(JSON.stringify(s)));
  const deposits = (s: RcState) => s.world.map.deposits ?? [];

  it('the game option makes every deposit endless: Extractors yield every turn and nothing runs down; the save and the replay keep it', () => {
    let s = newGame(3, RIDGE_VALLEY, 'normal', 24, false, null, 1, [], true);
    expect(s.endless).toBe(true);
    expect(deposits(s).length).toBeGreaterThan(0);
    expect(deposits(s).every((d) => d.endless === true)).toBe(true);
    const start = JSON.stringify(deposits(s));
    for (let t = 0; t < 12 && s.phase === 'plan'; t++) {
      for (const c of planAi(observe(s.world, rulesOf(s), PLAYER), rulesOf(s), 'normal')) s = planOrder(s, c.unit, c.order, c.doctrine) ?? s;
      s = lockTurn(s);
      expect(valid(s)).toBe(true);
    }
    // Both sides built Extractors, yet every deposit holds what it held at the start.
    expect(s.world.entities.filter((e) => e.kind === 'extractor').length).toBeGreaterThan(0);
    expect(JSON.stringify(deposits(s))).toBe(start);
    expect(worldHash(replay(s.seed, s.log, RIDGE_VALLEY, 1, true))).toBe(worldHash(s.world));
    // Without the option the same game runs its deposits down.
    let plain = newGame(3, RIDGE_VALLEY, 'normal', 24, false, null, 1, [], false);
    expect(plain.endless).toBe(false);
    for (let t = 0; t < 12 && plain.phase === 'plan'; t++) {
      for (const c of planAi(observe(plain.world, rulesOf(plain), PLAYER), rulesOf(plain), 'normal')) plain = planOrder(plain, c.unit, c.order, c.doctrine) ?? plain;
      plain = lockTurn(plain);
    }
    expect(deposits(plain).some((d) => d.left < 300)).toBe(true);
  });

  it('the opponent builds on an endless deposit whatever its amount reads (review of PR #36)', () => {
    const s = newGame(5, FIELD_EXERCISE, 'normal', 12, false, null, 1, [], true);
    const drained = { ...s.world, map: { ...s.world.map, deposits: deposits(s).map((d) => ({ ...d, left: 0 })) } };
    const builds = (w: World) => planAi(observe(w, rulesOf(s), OPPONENT), rulesOf(s), 'normal').filter((c) => c.order.type === 'build' && c.order.kind === 'extractor');
    expect(builds(s.world).length).toBeGreaterThan(0);
    expect(builds(drained)).toEqual(builds(s.world));
  });

  it('a save must agree with its option: the flag, every deposit and its amount; v10 saves migrate with the option off', () => {
    const on = newGame(5, FIELD_EXERCISE, 'normal', 12, false, null, 1, [], true);
    const off = newGame(5, FIELD_EXERCISE, 'normal', 12, false, null, 1, [], false);
    expect(valid(on) && valid(off)).toBe(true);
    const withDeposits = (s: RcState, f: (d: NonNullable<World['map']['deposits']>[number]) => object): RcState => ({ ...s, world: { ...s.world, map: { ...s.world.map, deposits: deposits(s).map((d) => ({ ...d, ...f(d) })) } } });
    expect(valid({ ...on, endless: false })).toBe(false);
    expect(valid({ ...off, endless: true })).toBe(false);
    expect(valid(withDeposits(on, () => ({ left: 299 })))).toBe(false); // an endless deposit never runs down
    expect(valid(withDeposits(off, () => ({ endless: true })))).toBe(false);
    expect(valid({ ...on, endless: 'yes' as never })).toBe(false);
    // Version 10: no option; deposits run dry as they did.
    const v10 = JSON.parse(JSON.stringify({ ...off, v: 10 })) as Record<string, unknown>;
    delete v10.endless;
    delete v10.random;
    expect(migrateState(v10, 10)).toMatchObject({ v: 12, random: null, endless: false });
    expect(migrateState({ ...v10, v: 11 }, 10)).toBeUndefined();
    expect(migrateState(JSON.parse(JSON.stringify({ ...on, v: 10 })), 10)).toBeUndefined(); // endless deposits in a v10 save: crafted
    // A player-made map with its own sizes: rich and endless deposits are its own, with the option off.
    const base = fromScenario(FIELD_EXERCISE, 'Sizes');
    const sized = { ...base, deposits: base.deposits.map((d, i) => (i % 2 === 0 ? { ...d, size: 'endless' as const } : { ...d, size: 'rich' as const })) };
    const custom = newGame(5, FIELD_EXERCISE, 'normal', 12, false, sized);
    expect(valid(custom)).toBe(true);
    const byCell = <T extends { x: number; y: number }>(list: readonly T[]) => [...list].sort((a, b) => a.y - b.y || a.x - b.x);
    expect(byCell(deposits(custom)).map((d) => [d.left, d.endless ?? false])).toEqual(byCell(sized.deposits).map((d) => [d.size === 'rich' ? 600 : 300, d.size === 'endless']));
    expect(valid(withDeposits(custom, (d) => (d.endless ? { endless: undefined, left: 300 } : {})))).toBe(false);
  });
});

describe('planning ledger, stalemate pressure, save bounds (mutation run on rules.ts, 2026-10-15)', () => {
  const cost = (kind: string) => RULESET.archetypes[kind]!.cost;

  it('plans production and placement against the Supply and cells they leave; a cancelled job gives both back', () => {
    const s = newGame(1);
    const yard = own(s).find((e) => e.kind === 'muster')!;
    const post = commandPost(s.world, PLAYER)!;
    const a = planOrder(s, yard.id, { type: 'produce', kind: 'rifles' })!;
    const b = planOrder(a, yard.id, { type: 'produce', kind: 'lancer' })!;
    expect(plannedSupply(b)).toBe(300 - cost('rifles') - cost('lancer'));
    expect(plannedJobs(b, yard.id).map((c) => (c.order as { kind: string }).kind)).toEqual(['rifles', 'lancer']);
    // The planned jobs fill the yard's queue (MAX_QUEUE = 2): a third is refused while planning.
    expect(orderRefusal(b, yard.id, { type: 'produce', kind: 'rifles' })).not.toBeNull();
    expect(orderRefusal(a, yard.id, { type: 'produce', kind: 'rifles' })).toBeNull();
    // Planned production counts towards what a sale of the yard would bring.
    expect(plannedSaleRefund(b, yard.id)).toBe(Math.floor(cost('muster') / 2) + cost('rifles') + cost('lancer'));
    // A placement takes its cell (and its price) while planning; a second one there is refused.
    const cell = (() => {
      for (let y = 0; y < s.world.map.h; y++) for (let x = 0; x < s.world.map.w; x++) if (planOrder(b, post.id, { type: 'build', kind: 'relay-mast', x, y })) return { x, y };
      throw new Error('no free covered cell');
    })();
    const c = planOrder(b, post.id, { type: 'build', kind: 'relay-mast', ...cell })!;
    expect(plannedSupply(c)).toBe(300 - cost('rifles') - cost('lancer') - cost('relay-mast'));
    expect(orderRefusal(c, post.id, { type: 'build', kind: 'relay-mast', ...cell })).toBe('not-buildable');
    // A planned sale costs nothing; a hold is no job.
    expect(plannedSupply(planOrder(c, yard.id, { type: 'sell' })!)).toBe(plannedSupply(c));
    // Cancelling the first production returns its price, the second stays planned.
    const d = cancelJob(c, yard.id, 0);
    expect(plannedJobs(d, yard.id).map((x) => (x.order as { kind: string }).kind)).toEqual(['lancer']);
    expect(plannedSupply(d)).toBe(300 - cost('lancer') - cost('relay-mast'));
    expect(cancelJob(d, yard.id, 5)).toBe(d);
  });

  it("a hit on the leader's Command Post restarts the stalemate count; a hit on the trailing side's does not", () => {
    // Open end, the record running at the real lead (so it would go on); a player squad next to the
    // opponent's post fires on it by itself (out of contact; structures first, the post the only one).
    const shelling = (playerLeads: boolean) => {
      const s = lockTurn(lockTurn(newGame(3, FIELD_EXERCISE, 'normal', null, true)));
      const post = commandPost(s.world, OPPONENT)!;
      const squad = s.world.entities.find((e) => e.side === PLAYER && e.kind === 'rifles')!;
      const spot = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: post.x + dx!, y: post.y + dy! })).find((p) => passable(s.world.map, RULESET, p.x, p.y, 'ground') && !s.world.entities.some((e) => e.x === p.x && e.y === p.y))!;
      Object.assign(squad, spot, { order: { type: 'hold' }, doctrine: { ...PLAYER_DOCTRINE, priority: 'structures', lostContact: 'keep' } });
      const otherStructure = (e: Entity, side: number) => e.side === side && e.kind !== 'command-post' && (RULESET.archetypes[e.kind]?.speed ?? 0) === 0;
      // The opponent loses its yard (the post is the squad's only structure in reach); to make the
      // opponent the leader, the player loses its yard and every unit but the squad as well.
      s.world.entities = s.world.entities.filter((e) => !otherStructure(e, OPPONENT) && (playerLeads || e.side !== PLAYER || e.kind === 'command-post' || e.id === squad.id));
      s.world.intel = initialIntel(s.world, RULESET);
      const now = sideValue(s.world, PLAYER) - sideValue(s.world, OPPONENT);
      expect(Math.sign(now)).toBe(playerLeads ? 1 : -1);
      const next = lockTurn({ ...s, lead: [now, now, now] });
      expect(next.world.entities.find((e) => e.id === post.id)!.hp).toBeLessThan(RULESET.archetypes['command-post']!.hp);
      return next.lead;
    };
    // The opponent leads: its post is shelled, so the count starts anew (one entry).
    expect(shelling(false)).toHaveLength(1);
    // The player leads: shelling the trailing side's post is no pressure; the record goes on.
    expect(shelling(true)).toHaveLength(4);
  });

  it('migrations refuse a save whose version does not match the one they migrate from', () => {
    for (const from of [3, 5]) {
      const old = JSON.parse(JSON.stringify({ ...newGame(2), v: from })) as Record<string, unknown>;
      expect(migrateState({ ...old, v: from + 1 }, from)).toBeUndefined();
      expect(migrateState('save', from)).toBeUndefined();
    }
  });

  it('refuses hostile saves: report lists and ids beyond the scenario, oversized summaries, foreign kinds, too many shells, malformed logs', () => {
    const s = lockTurn(newGame(1));
    expect(isValidState(s)).toBe(true);
    const n = s.world.entities.length * 4;
    const bad: [string, (x: RcState) => void][] = [
      ['a report id beyond the scenario', (x) => { x.world.intel![PLAYER]!.push({ id: 9_999, side: OPPONENT, kind: 'rifles', x: 0, y: 0, hp: 1, tick: 0, live: false }); }],
      ['a summary of a million events', (x) => { x.events = Array.from({ length: 1_000_000 }, () => ({ t: 'income', tick: 1, side: 0, amount: 1 })); }],
      ['a kind the scenario cannot have', (x) => { x.world.entities[1]!.kind = 'kite'; }],
      ['a flood of shells', (x) => { x.world.projectiles = Array.from({ length: n * 10 }, (_, i) => ({ id: 1000 + i, side: OPPONENT, x: 0, y: 0, tx: 1, ty: 1, ticks: 1, kind: 'howitzer' }) as never); }],
      ['a log entry with an empty "retired" list', (x) => { x.log[0] = { ...x.log[0]!, retired: [] }; }],
      ['a log entry with too few plans', (x) => { x.log[0] = { ...x.log[0]!, plans: [x.log[0]!.plans[0]!] }; }]
    ];
    for (const [label, corrupt] of bad) {
      const x = structuredClone(s);
      corrupt(x);
      expect(() => isValidState(x), label).not.toThrow();
      expect(isValidState(x), label).toBe(false);
    }
  });
});

describe('tower walls (owner review 2026-10-18: no more units fed into a known tower wall)', () => {
  /** Field Exercise with Gun Towers around the player's post, known to the opponent (as at the start: structures are known). */
  const walled = (cells: readonly (readonly [number, number])[]) => {
    const w = structuredClone(newGame(1).world);
    const post = w.entities.find((e) => e.side === PLAYER && e.kind === 'command-post')!;
    for (const [dx, dy] of cells) {
      const x = post.x + dx, y = post.y + dy;
      if (x < 0 || y < 0 || x >= w.map.w || y >= w.map.h || !passable(w.map, RULESET, x, y, 'ground') || w.entities.some((e) => e.x === x && e.y === y)) continue;
      w.entities.push({ ...post, id: w.nextId++, kind: 'tower-gun', hp: RULESET.archetypes['tower-gun']!.hp, x, y });
    }
    w.intel = initialIntel(w, RULESET);
    return { w, post };
  };
  it('the rally point stands back beyond the reach of the known towers around the post', () => {
    const open = walled([]);
    const plain = assaultPlan(observe(open.w, RULESET, OPPONENT), RULESET, 'normal')!;
    const { w, post } = walled([[2, -2], [3, -1], [3, 0], [2, -3], [1, -3], [3, -3]]);
    const towers = w.entities.filter((e) => e.kind === 'tower-gun');
    expect(towers.length).toBeGreaterThanOrEqual(3);
    const plan = assaultPlan(observe(w, RULESET, OPPONENT), RULESET, 'normal')!;
    const far = (p: { x: number; y: number }) => Math.hypot(p.x - post.x, p.y - post.y);
    expect(far(plan.rally)).toBeGreaterThan(far(plain.rally));
    const reach = RULESET.archetypes['tower-gun']!.weapon!.range + 1;
    expect(towers.every((t) => Math.hypot(t.x - plan.rally.x, t.y - plan.rally.y) > reach)).toBe(true);
  });

  it('the storm waits for a known tower wall: a tower weighs twice its price among the post\'s defenders (review of PR #60)', () => {
    // Only towers defend the post (the player's fighters are taken off); the opponent's force has gathered.
    const setup = (cells: readonly (readonly [number, number])[], towers = cells.length) => {
      const { w } = walled(cells);
      const keep = new Set(w.entities.filter((e) => e.kind === 'tower-gun').slice(0, towers).map((e) => e.id));
      w.entities = w.entities.filter((e) => e.side !== PLAYER || (e.kind === 'tower-gun' ? keep.has(e.id) : (RULESET.archetypes[e.kind]?.speed ?? 0) === 0));
      w.turn = 10;
      w.intel = initialIntel(w, RULESET);
      return { ...assaultPlan(observe(w, RULESET, OPPONENT), RULESET, 'normal')!, towers: w.entities.filter((e) => e.kind === 'tower-gun').length };
    };
    const bare = setup([]);
    expect(bare.storming).toBe(true); // nothing defends the post: the gathered force goes
    const two = setup([[3, 0], [3, -1], [3, 1], [2, -2], [3, -2], [2, 2]], 2);
    expect(two.towers).toBe(2);
    const towerValue = 2 * RULESET.archetypes['tower-gun']!.cost;
    const ours = two.all.reduce((sum, f) => sum + (RULESET.archetypes[f.kind]!.cost * f.hp) / RULESET.archetypes[f.kind]!.hp, 0);
    // At their price the two towers would not hold the storm back; weighed double they do.
    expect(ours).toBeGreaterThanOrEqual(towerValue * 1.3);
    expect(ours).toBeLessThan(2 * towerValue * 1.3);
    expect(two.storming).toBe(false);
  });
});

describe('opponent economy and easy fighters (mutation run on ai.ts, 2026-10-15)', () => {
  const plan = (world: World, level: Difficulty) => planAi(observe(world, RULESET, OPPONENT), RULESET, level);
  const jobs = (cmds: readonly Command[]) => cmds.filter((c) => c.order.type === 'produce' || c.order.type === 'build').map((c) => (c.order.type === 'build' || c.order.type === 'produce' ? c.order.kind : ''));
  const fresh = () => structuredClone(newGame(1).world);
  const setSupply = (w: World, n: number) => { w.supply![OPPONENT] = n; return w; };

  it('easy only trains Rifle Squads, one per idle yard, and only with a cushion of 150 left; it never builds', () => {
    const cushion = 150 + RULESET.archetypes.rifles!.cost;
    expect(jobs(plan(setSupply(fresh(), cushion - 1), 'easy'))).toEqual([]);
    expect(jobs(plan(setSupply(fresh(), cushion), 'easy'))).toEqual(['rifles']);
    expect(jobs(plan(setSupply(fresh(), 5_000), 'easy'))).toEqual(['rifles']); // one yard, one squad: no building
    const busy = setSupply(fresh(), 5_000);
    busy.entities.find((e) => e.side === OPPONENT && e.kind === 'muster')!.queue = [{ kind: 'rifles', left: 1 }];
    expect(jobs(plan(busy, 'easy'))).toEqual([]);
  });

  it('defence towers (owner decision 2026-10-16): an outnumbered post gets a Gun Tower towards the threat; hard at one fighter, normal at three, easy never; one per guarded asset', () => {
    /**
     * The opponent's post with `kinds` of player fighters placed 4–6 cells from it, all known to the
     * opponent, and `defenders` of its own fighters left (the others are taken off the map).
     */
    const threatened = (kinds: readonly string[], defenders = 0, supply = 2_000) => {
      const w = setSupply(fresh(), supply);
      const post = w.entities.find((e) => e.side === OPPONENT && e.kind === 'command-post')!;
      const fighters = w.entities.filter((e) => e.side === OPPONENT && (RULESET.archetypes[e.kind]?.weapon && (RULESET.archetypes[e.kind]?.speed ?? 0) > 0));
      const gone = new Set(fighters.slice(defenders).map((e) => e.id));
      w.entities = w.entities.filter((e) => !gone.has(e.id));
      const spots: { x: number; y: number }[] = [];
      for (let r = 4; r <= 6 && spots.length < kinds.length; r++) {
        for (let dy = -r; dy <= r && spots.length < kinds.length; dy++) {
          for (let dx = -r; dx <= r && spots.length < kinds.length; dx++) {
            const x = post.x + dx, y = post.y + dy;
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || x < 0 || y < 0 || x >= w.map.w || y >= w.map.h) continue;
            if (!passable(w.map, RULESET, x, y, 'ground') || w.entities.some((e) => e.x === x && e.y === y) || spots.some((p) => p.x === x && p.y === y)) continue;
            spots.push({ x, y });
          }
        }
      }
      const players = w.entities.filter((e) => e.side === PLAYER && e.kind !== 'command-post' && e.kind !== 'muster');
      kinds.forEach((kind, i) => Object.assign(players[i]!, { kind, hp: RULESET.archetypes[kind]!.hp, x: spots[i]!.x, y: spots[i]!.y }));
      w.intel = initialIntel(w, RULESET);
      return { w, post };
    };
    const towers = (cmds: readonly Command[]) => cmds.filter((c) => c.order.type === 'build' && c.order.kind.startsWith('tower-')).map((c) => c.order as { kind: string; x: number; y: number });
    // No threat: no tower, whatever the Supply.
    expect(towers(plan(setSupply(fresh(), 5_000), 'hard'))).toEqual([]);
    // One fighter against a post without defenders: hard builds a Gun Tower 2 cells from the post (not next to it or a yard).
    const one = threatened(['rifles']);
    const [tower] = towers(plan(one.w, 'hard'));
    expect(tower?.kind).toBe('tower-gun');
    expect(Math.max(Math.abs(tower!.x - one.post.x), Math.abs(tower!.y - one.post.y))).toBe(2);
    expect(towers(plan(one.w, 'normal'))).toEqual([]);
    expect(towers(plan(one.w, 'easy'))).toEqual([]);
    // Normal waits for three; armour gets a Gun Tower too (Laser Towers measured worse).
    expect(towers(plan(threatened(['rifles', 'lancer']).w, 'normal'))).toEqual([]);
    expect(towers(plan(threatened(['rifles', 'lancer', 'rifles']).w, 'normal')).map((t) => t.kind)).toEqual(['tower-gun']);
    expect(towers(plan(threatened(['warden']).w, 'hard')).map((t) => t.kind)).toEqual(['tower-gun']);
    // Not when own fighters near the post match the threat; not without the Supply; not when a tower already guards it.
    expect(towers(plan(threatened(['rifles'], 99).w, 'hard'))).toEqual([]);
    expect(towers(plan(threatened(['rifles'], 0, RULESET.archetypes['tower-gun']!.cost - 1).w, 'hard'))).toEqual([]);
    const guarded = threatened(['rifles']);
    guarded.w.entities.push({ ...guarded.post, id: guarded.w.nextId++, kind: 'tower-gun', hp: 150, x: tower!.x, y: tower!.y });
    expect(towers(plan(guarded.w, 'hard'))).toEqual([]);
  });

  it('a tower never walls in the own army: not in the only pass towards the enemy post (Ridge Valley stall, 2026-10-17)', () => {
    // A ridge at x = 8 with one gap at (8, 3), two cells from the opponent's post at (10, 3); a player squad beyond it.
    const terrain = Array.from({ length: 7 }, (_, y) => Array.from({ length: 14 }, (_, x) => (x === 8 && y !== 3 ? '^' : '.')).join('')).join('');
    const w = createWorld({ map: { w: 14, h: 7, terrain }, sides: 2, seed: 1, entities: [
      { side: 0, kind: 'command-post', x: 1, y: 3 },
      { side: 0, kind: 'rifles', x: 6, y: 2 },
      { side: 1, kind: 'command-post', x: 10, y: 3 }
    ] }, RULESET);
    w.intel = initialIntel(w, RULESET);
    const builds = planAi(observe(w, RULESET, 1), RULESET, 'hard').filter((c) => c.order.type === 'build').map((c) => c.order as { kind: string; x: number; y: number });
    expect(builds.map((b) => b.kind)).toEqual(['tower-gun']); // the post is threatened and alone
    expect(builds[0]).not.toMatchObject({ x: 8, y: 3 }); // the gap is the nearest cell to the threat, but it is the way out
  });

  it('normal places an Extractor on the nearest free deposit in cover first, never on one a known enemy fighter can reach', () => {
    const w = fresh();
    const first = plan(w, 'normal').find((c) => c.order.type === 'build');
    expect(first?.order).toMatchObject({ type: 'build', kind: 'extractor' });
    const at = first!.order as { x: number; y: number };
    // A player squad next to that deposit (and known to the opponent): it goes elsewhere or waits.
    const danger = structuredClone(w);
    const squad = danger.entities.find((e) => e.side === PLAYER && e.kind === 'rifles')!;
    const spot = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]].map(([dx, dy]) => ({ x: at.x + dx!, y: at.y + dy! })).find((p) => passable(danger.map, RULESET, p.x, p.y, 'ground') && !danger.entities.some((e) => e.x === p.x && e.y === p.y))!;
    Object.assign(squad, spot);
    danger.intel = initialIntel(danger, RULESET);
    expect(danger.intel[OPPONENT]!.some((r) => r.id === squad.id && r.live)).toBe(true);
    const builds = plan(danger, 'normal').filter((c) => c.order.type === 'build' && c.order.kind === 'extractor').map((c) => c.order as { x: number; y: number });
    expect(builds.some((b) => b.x === at.x && b.y === at.y)).toBe(false);
  });

  it('normal builds a Motor Pool from turn 6 (not before), and with 800 Supply banked another yard, at most four', () => {
    // No deposits on this copy of the map: no Extractor competes for the Supply or the order slots.
    const pool = (turn: number, supply: number) => {
      const w = setSupply(fresh(), supply);
      w.turn = turn;
      w.map = { ...w.map, deposits: [] };
      return jobs(plan(w, 'normal'));
    };
    expect(pool(5, 200)).not.toContain('motor-pool');
    expect(pool(6, 200)).toContain('motor-pool');
    // With a Motor Pool standing and Supply piling up: another Barracks (one of each, then the other).
    const rich = setSupply(fresh(), 900);
    rich.turn = 10;
    rich.map = { ...rich.map, deposits: [] };
    const yard = rich.entities.find((e) => e.side === OPPONENT && e.kind === 'muster')!;
    const spot = (() => {
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
        const x = yard.x + dx, y = yard.y + dy;
        if (Math.max(Math.abs(dx), Math.abs(dy)) >= 2 && passable(rich.map, RULESET, x, y, 'ground') && !rich.entities.some((e) => e.x === x && e.y === y)) return { x, y };
      }
      throw new Error('no cell');
    })();
    rich.entities.push({ ...structuredClone(yard), id: rich.nextId++, kind: 'motor-pool', hp: RULESET.archetypes['motor-pool']!.hp, ...spot });
    rich.intel = initialIntel(rich, RULESET);
    expect(jobs(plan(rich, 'normal'))).toContain('muster');
    expect(jobs(plan(setSupply(structuredClone(rich), 700), 'normal'))).not.toContain('muster');
    // Four yards stand already: no fifth.
    const full = structuredClone(rich);
    const cells: { x: number; y: number }[] = [];
    for (let y = 0; y < full.map.h && cells.length < 2; y++) for (let x = 0; x < full.map.w && cells.length < 2; x++) if (y < 3 && passable(full.map, RULESET, x, y, 'ground') && !full.entities.some((e) => e.x === x && e.y === y)) cells.push({ x, y });
    for (const [i, c] of cells.entries()) full.entities.push({ ...structuredClone(yard), id: full.nextId++, kind: i === 0 ? 'muster' : 'motor-pool', ...c });
    full.intel = initialIntel(full, RULESET);
    expect(full.entities.filter((e) => e.side === OPPONENT && RULESET.archetypes[e.kind]?.production).length).toBe(4);
    expect(jobs(plan(full, 'normal')).filter((k) => k === 'muster' || k === 'motor-pool')).toEqual([]);
  });

  it('easy fighters attack the nearest spotted enemy out of their range', () => {
    // No Supply: no production takes an order slot.
    const w = setSupply(fresh(), 0);
    const squad = w.entities.find((e) => e.side === OPPONENT && e.kind === 'rifles')!;
    const near = w.entities.find((e) => e.side === PLAYER && e.kind === 'rifles')!;
    // Put a player squad three cells from the opponent's squad: in its sight, out of its range
    // (a holding squad with an enemy in range fires by itself and gets no order).
    const spot = [[3, 0], [-3, 0], [0, 3], [0, -3]].map(([dx, dy]) => ({ x: squad.x + dx!, y: squad.y + dy! })).find((p) => passable(w.map, RULESET, p.x, p.y, 'ground') && !w.entities.some((e) => e.x === p.x && e.y === p.y))!;
    Object.assign(near, spot);
    w.intel = initialIntel(w, RULESET);
    const orders = plan(w, 'easy');
    expect(orders.find((c) => c.unit === squad.id)?.order).toEqual({ type: 'attack', target: near.id });
  });
});

describe('random maps (I6c, state v12)', () => {
  const valid = (s: RcState) => isValidState(JSON.parse(JSON.stringify(s)));
  const random = (w: number, h: number, seed: number) => newGame(1, FIELD_EXERCISE, 'normal', 12, false, generateMap(w, h, seed, `Random ${w}×${h} · No. ${seed}`), 1, [], false, { w, h, seed });

  it('a game on a generated map keeps its recipe as a label; the stored map is what is played', () => {
    const s = random(20, 14, 4711);
    expect(s).toMatchObject({ scenario: 'custom', random: { w: 20, h: 14, seed: 4711 } });
    expect(s.map).toEqual(generateMap(20, 14, 4711, 'Random 20×14 · No. 4711'));
    expect(valid(s)).toBe(true);
    expect(valid(lockTurn(s))).toBe(true);
    // Only sizes offered in the setup, matching the map; a 32-bit seed; a recipe needs its map.
    expect(valid({ ...s, random: { w: 22, h: 14, seed: 4711 } })).toBe(false);
    expect(valid({ ...s, random: { w: 16, h: 12, seed: 4711 } })).toBe(false);
    expect(valid({ ...s, random: { w: 20, h: 14, seed: -1 } })).toBe(false);
    expect(valid({ ...s, random: { w: 20, h: 14, seed: 2 ** 32 } })).toBe(false);
    expect(valid({ ...s, random: { w: 20, h: 14, seed: 1.5 } })).toBe(false);
    expect(valid({ ...s, random: [20, 14, 4711] as never })).toBe(false);
    expect(valid({ ...s, random: null })).toBe(true); // a player-made map that happens to look generated
    expect(valid({ ...newGame(1), random: { w: 20, h: 14, seed: 1 } })).toBe(false);
    expect(RANDOM_SIZES.every(([w, h]) => valid(random(w, h, 7)))).toBe(true);
  });

  it('a save stays loadable when the generator changes: the recipe is never regenerated (review of PR #48)', () => {
    const s = random(16, 12, 99);
    // Simulate a changed generator: the stored map is no longer what this recipe generates today.
    const other = generateMap(16, 12, 100, s.map!.name);
    expect(other).not.toEqual(s.map);
    const old = JSON.parse(JSON.stringify({ ...newGame(1, FIELD_EXERCISE, 'normal', 12, false, other, 1, [], false, { w: 16, h: 12, seed: 100 }), random: { w: 16, h: 12, seed: 99 } })) as unknown;
    expect(isValidState(old)).toBe(true);
    expect(valid(lockTurn(old as RcState))).toBe(true);
    // A hand-edited map that is still a valid map of that size also loads.
    expect(valid({ ...s, map: { ...s.map!, name: 'renamed' } })).toBe(true);
  });

  it('property: any seed × any offered size gives a game that survives save, reload and a turn', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 ** 32 - 1 }), fc.integer({ min: 0, max: RANDOM_SIZES.length - 1 }), (seed, i) => {
        const [w, h] = RANDOM_SIZES[i]!;
        const s = random(w, h, seed);
        const loaded = JSON.parse(JSON.stringify(s)) as unknown;
        expect(isValidState(loaded)).toBe(true);
        expect(migrateState(loaded, 12)).toBeUndefined(); // current version: nothing to migrate
        const next = lockTurn(loaded as RcState);
        expect(valid(next)).toBe(true);
        expect(next.random).toEqual({ w, h, seed });
      }),
      { numRuns: 24 },
    );
  });

  it('v11 saves migrate without a random map', () => {
    const v11 = JSON.parse(JSON.stringify({ ...newGame(3), v: 11 })) as Record<string, unknown>;
    delete v11.random;
    expect(migrateState(v11, 11)).toMatchObject({ v: 12, random: null });
    expect(migrateState({ ...v11, v: 12 }, 11)).toBeUndefined();
  });
});

describe('storms against a ringed post (2026-10-21)', () => {
  /**
   * A plain 20×9 map: the player's post (by default at (1, 4)) with pieces on its neighbours
   * (`ring`, but for the `open` cells), the opponent's post (by default at (18, 4)) and its fighters. Only structures are known at the start,
   * so a ring of squads is not (a ring of towers is).
   */
  const world = (turn: number, ring: string, opponent: readonly { kind: string; x: number; y: number }[], open: readonly (readonly [number, number])[] = [], [px, py, ox, oy] = [1, 4, 18, 4]) => {
    const entities = [
      { side: PLAYER, kind: 'command-post', x: px, y: py },
      { side: OPPONENT, kind: 'command-post', x: ox, y: oy },
      ...opponent.map((u) => ({ side: OPPONENT, ...u }))
    ];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = px + dx, y = py + dy;
        if ((dx || dy) && x >= 0 && y >= 0 && x < 20 && y < 9 && !open.some(([ax, ay]) => ax === x && ay === y)) entities.push({ side: PLAYER, kind: ring, x, y });
      }
    }
    const w = createWorld({ map: { w: 20, h: 9, terrain: '.'.repeat(180) }, sides: 2, entities, seed: 1 }, RULESET);
    w.turn = turn;
    w.intel = initialIntel(w, RULESET);
    const obs = observe(w, RULESET, OPPONENT);
    const post = obs.world.entities.find((e) => e.side === PLAYER && e.kind === 'command-post')!;
    const at = (x: number, y: number) => obs.world.entities.find((e) => e.x === x && e.y === y)!;
    return { approach: approachCells(obs, RULESET, post), at, w };
  };
  const ESCALATE = 60;
  const r = (p: { x: number; y: number }) => Math.max(Math.abs(p.x - 1), Math.abs(p.y - 4));

  it('before the opponent stops waiting a fighter heads for the post, whatever it cannot see around it', () => {
    const { approach, at } = world(ESCALATE - 1, 'rifles', [{ kind: 'rifles', x: 10, y: 4 }]);
    expect(approach(at(10, 4))).toEqual({ x: 1, y: 4 });
  });

  it('later, a fighter far off heads for the farthest free cell of the outer rings it cannot see (a ring may be two deep), in its frame', () => {
    // The player's post in the bottom right corner region: the first cell in the opponent's frame (a
    // half turn) lies next to the post, so a tie-break that ignores the distance would pick a near one.
    const { approach, at, w } = world(ESCALATE, 'rifles', [{ kind: 'rifles', x: 9, y: 4 }, { kind: 'rifles', x: 10, y: 4 }], [], [18, 7, 1, 1]);
    const dist = (p: { x: number; y: number }) => Math.max(Math.abs(p.x - 18), Math.abs(p.y - 7));
    const first = approach(at(9, 4));
    expect(dist(first)).toBe(APPROACH_RADIUS);
    // Ties by the side's frame: the first free cell of the outermost ring as the opponent sees the map.
    const order = (p: { x: number; y: number }) => frameIndexIn(w.map, frameOf(w, OPPONENT), cellOf(w.map, p.x, p.y));
    const outermost: { x: number; y: number }[] = [];
    for (let y = 0; y < 9; y++) for (let x = 0; x < 20; x++) if (dist({ x, y }) === APPROACH_RADIUS) outermost.push({ x, y });
    expect(first).toEqual(outermost.sort((a, b) => order(a) - order(b))[0]);
    // Each fighter claims a cell of its own.
    const second = approach(at(10, 4));
    expect(dist(second)).toBe(APPROACH_RADIUS);
    expect(second).not.toEqual(first);
  });

  it('later, a cell the side sees goes first, nearest first, never one next to the post', () => {
    // A relay mast carries the cover to x 7, where an Outrider sees the post's surroundings; one cell next to the post is free.
    const { approach, at } = world(ESCALATE, 'rifles', [{ kind: 'relay-mast', x: 13, y: 4 }, { kind: 'outrider', x: 7, y: 4 }], [[2, 3]]);
    const goal = approach(at(7, 4));
    expect(r(goal)).toBe(2);
  });

  it('later, a fighter within APPROACH_RADIUS still heads for the post', () => {
    const { approach, at } = world(ESCALATE, 'rifles', [{ kind: 'rifles', x: 1 + APPROACH_RADIUS, y: 4 }]);
    expect(approach(at(1 + APPROACH_RADIUS, 4))).toEqual({ x: 1, y: 4 });
  });

  it('a fighter close to a post walled in by known towers stays where it is rather than step to a cell no nearer', () => {
    const { approach, at } = world(ESCALATE, 'tower-gun', [{ kind: 'rifles', x: 3, y: 4 }]);
    expect(approach(at(3, 4))).toEqual({ x: 3, y: 4 });
  });
});

describe('teams (owner decisions 2026-10-24)', () => {
  const corners = SCENARIOS.find((x) => x.id === 'four-corners')!;
  const post = (w: World, side: number) => w.entities.find((e) => e.side === side && e.kind === 'command-post')!;
  /** Plays `turns` turns with every side planned by the AI; returns the states and every engine event. */
  const play = (s0: RcState, turns: number) => {
    let s = s0;
    const states: RcState[] = [];
    for (let t = 0; t < turns && s.phase === 'plan'; t++) {
      for (const c of planAi(observe(s.world, rulesOf(s), PLAYER), rulesOf(s), 'normal')) s = planOrder(s, c.unit, c.order, c.doctrine) ?? s;
      s = lockTurn(s);
      states.push(s);
    }
    return { s, states };
  };

  it('maps with four bases offer 2 against 1 with two opponents and 2 against 2, 3 against 1 and 1 against 3 with three; two-side maps none', () => {
    expect(teamShapes(corners, 1)).toEqual([]);
    expect(teamShapes(corners, 2)).toEqual(['2v1-next', '2v1-across']);
    expect(teamShapes(corners, 3)).toEqual(['2v2-next', '2v2-across', '3v1', '1v3']);
    expect(teamShapes(FIELD_EXERCISE, 1)).toEqual([]);
    const four = customSpec(generateMap(16, 12, 3, '', 4));
    expect(teamShapes(four, 3)).toEqual(teamShapes(corners, 3));
    // "Next" is a corner beside the player, "across" the opposite one.
    const s = newGame(1, corners, 'normal', 12, false, null, 2, [], false, null, '2v1-next');
    const d = (a: number, b: number) => Math.hypot(post(s.world, a).x - post(s.world, b).x, post(s.world, a).y - post(s.world, b).y);
    expect(d(0, 1)).toBeLessThan(d(0, 2));
  });

  it('a team game sets the world\'s teams (also with several persons); a shape the map does not offer for the count gives free-for-all', () => {
    for (const shape of ['2v2-next', '2v2-across', '3v1', '1v3'] as const) {
      const s = newGame(1, corners, 'normal', 12, false, null, 3, [], false, null, shape);
      expect(s.world.teams).toEqual([...TEAM_LAYOUTS[shape]]);
      expect(teamShapeOf(s.world)).toBe(shape);
      expect(isValidState(JSON.parse(JSON.stringify(s)))).toBe(true);
    }
    expect(newGame(1, corners, 'normal', 12, false, null, 2, [], false, null, '2v2-next').world.teams).toBeUndefined();
    expect(newGame(1, FIELD_EXERCISE, 'normal', 12, false, null, 1, [], false, null, '2v1-next').world.teams).toBeUndefined();
    expect(newGame(1, corners, 'normal', 12, false, null, 3, ['person', 'person'], false, null, '2v2-next').world.teams).toEqual([0, 0, 1, 1]);
    expect(() => initialWorld(corners, 1, 2, false, '3v1')).toThrow(RangeError);
  });

  it('a crafted save is refused: teams that are no offered shape, teams on a two-side map', () => {
    const s = newGame(1, corners, 'normal', 12, false, null, 3, [], false, null, '2v2-next');
    const bad: [string, (x: RcState) => void][] = [
      ['teams that are no shape', (x) => { x.world.teams = [0, 1, 1, 0]; }],
      ['a shape for another count', (x) => { x.world.teams = [0, 0, 1]; }]
    ];
    for (const [label, corrupt] of bad) {
      const x = structuredClone(s);
      corrupt(x);
      expect(isValidState(x), label).toBe(false);
    }
    const two = structuredClone(newGame(1));
    two.world.teams = [0, 1];
    expect(isValidState(two)).toBe(false);
  });

  it('allies never fire on each other, every turn is a valid save, and the log replays to the same world', () => {
    for (const shape of ['2v2-next', '3v1'] as const) {
      const s0 = newGame(4, corners, 'normal', 20, false, null, 3, [], false, null, shape);
      const team = (id: number, w: World) => teamOf(w, w.entities.find((e) => e.id === id)?.side ?? -1);
      let world = s0.world;
      for (let t = 0; t < 14; t++) {
        const rules = rulesOf(s0);
        const plans = Array.from({ length: world.sides }, (_, side) => (world.out?.includes(side) ? [] : planAi(observe(world, rules, side), rules, 'normal')));
        const r = resolveTurn(world, rules, plans);
        for (const e of r.events) if (e.t === 'fire') expect(team(e.id, world) === team(e.target, world) && team(e.id, world) >= 0, `${shape} turn ${t}`).toBe(false);
        world = r.world;
      }
      const { s, states } = play(s0, 14);
      for (const x of states) expect(isValidState(JSON.parse(JSON.stringify(x))), `${shape} turn ${x.world.turn}`).toBe(true);
      expect(canonicalJson(replay(s.seed, s.log, corners, 3, false, shape))).toBe(canonicalJson(s.world));
    }
  }, 120_000);

  it('the result: won when every hostile side is out (also with the ally out), lost when the player is out (also when its team wins); strength counts the allies still in', () => {
    const s = newGame(1, corners, 'normal', 12, false, null, 3, [], false, null, '2v2-next');
    const without = (sides: number[]) => {
      const w = structuredClone(s.world);
      w.entities = w.entities.filter((e) => !sides.includes(e.side));
      w.out = [...sides].sort();
      return w;
    };
    expect(outcome(without([2, 3]), null)).toBe('won');
    expect(outcome(without([1, 2, 3]), null)).toBe('won');
    expect(outcome(without([0, 2, 3]), null)).toBe('draw');
    expect(outcome(without([0]), null)).toBe('lost');
    expect(outcome(without([1]), null)).toBeNull();
    // At the turn limit a team counts as its strongest side (owner decision 2026-10-25: not the sum,
    // so a team does not win on numbers alone): the player's team against the strongest hostile team.
    const w = structuredClone(s.world);
    w.turn = 12;
    expect(outcome(w, 12)).toBe('draw');
    w.supply![1] = (w.supply![1] ?? 0) + 10;
    expect(teamValue(w, PLAYER)).toBe(sideValue(w, 1));
    expect(teamValue(w, PLAYER)).toBeGreaterThan(sideValue(w, 0));
    expect(outcome(w, 12)).toBe('won');
    w.supply![3] = (w.supply![3] ?? 0) + 20;
    expect(opponentValue(w)).toBe(sideValue(w, 3));
    expect(outcome(w, 12)).toBe('lost');
    // A weaker side does not add to its team's strength: more Supply for side 2 changes nothing.
    w.supply![2] = (w.supply![2] ?? 0) + 15;
    expect(opponentValue(w)).toBe(sideValue(w, 3));
    // An ally that is out counts nothing, even when it was the strongest.
    const lone = without([1]);
    lone.supply![1] = (lone.supply![1] ?? 0) + 1000;
    lone.supply![3] = (lone.supply![3] ?? 0) + 10;
    lone.turn = 12;
    expect(teamValue(lone, PLAYER)).toBe(sideValue(lone, 0));
    expect(outcome(lone, 12)).toBe('lost');
    // Without teams nothing changes: the player's own strength against the strongest opponent.
    const ffa = newGame(1, corners, 'normal', 12, false, null, 3).world;
    expect(teamValue(ffa, PLAYER)).toBe(sideValue(ffa, PLAYER));
  });
});

describe('Bastion: a map made for teams (owner decision 2026-10-24)', () => {
  const post = (w: World, side: number) => w.entities.find((e) => e.side === side && e.kind === 'command-post')!;
  const lone = (shape: '1v3' | '3v1') => [0, 1, 2, 3].find((side) => TEAM_LAYOUTS[shape].filter((t) => t === TEAM_LAYOUTS[shape][side]).length === 1)!;

  it('offers only 1 against 3 and 3 against 1, with three opponents; no free-for-all', () => {
    expect(teamsOnly(BASTION)).toBe(true);
    expect(opponentCounts(BASTION)).toEqual([3]);
    expect(teamShapes(BASTION, 3)).toEqual(['1v3', '3v1']);
    expect(() => initialWorld(BASTION, 1, 3)).toThrow(RangeError);
    // A new game without a shape (or with free-for-all, another count or one it does not offer) starts with its first shape.
    expect(teamShapeOf(newGame(1, BASTION).world)).toBe('1v3');
    expect(teamShapeOf(newGame(1, BASTION, 'normal', 12, false, null, 3, [], false, null, '2v2-next').world)).toBe('1v3');
    const s = newGame(1, BASTION, 'normal', 12, false, null, 3, [], false, null, '1v3');
    expect(isValidState(JSON.parse(JSON.stringify(s)))).toBe(true);
    // A save without teams, or with a shape the map does not offer, is refused.
    const ffa = structuredClone(s);
    delete ffa.world.teams;
    expect(isValidState(ffa)).toBe(false);
    const other = structuredClone(s);
    other.world.teams = [0, 0, 1, 1];
    expect(isValidState(other)).toBe(false);
  });

  it('the lone side holds the plateau: the player in 1 against 3, an opponent in 3 against 1; it starts richer; every base can reach every other', () => {
    for (const shape of ['1v3', '3v1'] as const) {
      const s = newGame(1, BASTION, 'normal', 12, false, null, 3, [], false, null, shape);
      const w = s.world;
      const alone = lone(shape);
      expect(alone, shape).toBe(shape === '1v3' ? 0 : 2);
      expect(post(w, alone)).toMatchObject({ x: 9, y: 1 });
      expect(w.supply![alone]).toBe(1500);
      for (let side = 0; side < 4; side++) if (side !== alone) expect(w.supply![side]).toBe(300);
      // The plateau's deposits never run dry; the ridges leave two passes.
      expect(w.map.deposits!.filter((d) => d.y < 5).every((d) => d.endless === true)).toBe(true);
      const rules = rulesOf(s);
      for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) {
        expect(findPath(w.map, rules, cellOf(w.map, post(w, a).x, post(w, a).y), cellOf(w.map, post(w, b).x, post(w, b).y), { layer: 'ground', side: a }), `${shape} ${a}-${b}`).toBeDefined();
      }
      // Every unit starts inside its side's radio cover.
      for (let side = 0; side < 4; side++) {
        const cover = computeNetwork(w, rules, side).coverage;
        expect(w.entities.filter((e) => e.side === side && cover[cellOf(w.map, e.x, e.y)] !== 1).map((e) => `${e.kind}@${e.x},${e.y}`), `${shape} side ${side}`).toEqual([]);
      }
    }
  });

  it('plays: every turn a valid save, allies never fire on each other, the log replays to the same world', () => {
    for (const shape of ['1v3', '3v1'] as const) {
      let s = newGame(2, BASTION, 'normal', 12, false, null, 3, [], false, null, shape);
      while (s.phase === 'plan') {
        for (const c of planAi(observe(s.world, rulesOf(s), PLAYER), rulesOf(s), 'normal')) s = planOrder(s, c.unit, c.order, c.doctrine) ?? s;
        s = lockTurn(s);
        expect(isValidState(JSON.parse(JSON.stringify(s))), `${shape} turn ${s.world.turn}`).toBe(true);
      }
      expect(canonicalJson(replay(s.seed, s.log, BASTION, 3, false, shape))).toBe(canonicalJson(s.world));
    }
  }, 120_000);

  it('on strength the lone side is weighed against the strongest single opponent, not the three together (owner decision 2026-10-25)', () => {
    const s = newGame(1, BASTION, 'normal', 12, false, null, 3, [], false, null, '1v3');
    const w = structuredClone(s.world);
    w.turn = 12;
    const three = sideValue(w, 1) + sideValue(w, 2) + sideValue(w, 3);
    expect(sideValue(w, 0)).toBeLessThan(three);
    expect(opponentValue(w)).toBe(Math.max(sideValue(w, 1), sideValue(w, 2), sideValue(w, 3)));
    expect(outcome(w, 12)).toBe('won');
    // The same game the other way round: the player is one of the three and its team loses on strength.
    const other = structuredClone(newGame(1, BASTION, 'normal', 12, false, null, 3, [], false, null, '3v1').world);
    other.turn = 12;
    expect(outcome(other, 12)).toBe('lost');
  });

  it('a computer alone against several holds in front of its own post and never storms out (measured on Bastion)', () => {
    const s = newGame(1, BASTION, 'normal', null, false, null, 3, [], false, null, '3v1');
    const w = s.world;
    const rules = rulesOf(s);
    // In 3 against 1 side 2 stands alone; the three are not outnumbered.
    expect([0, 1, 2, 3].map((side) => outnumbered(w, side))).toEqual([false, false, true, false]);
    const home = post(w, 2);
    for (const turn of [0, 30, 90]) {
      const late = { ...structuredClone(w), turn };
      const plan = assaultPlan(observe(late, rules, 2), rules, 'hard')!;
      expect(plan.storming, `turn ${turn}`).toBe(false);
      expect(Math.max(Math.abs(plan.rally.x - home.x), Math.abs(plan.rally.y - home.y)), `turn ${turn}`).toBeLessThanOrEqual(4);
    }
    // A side of the three rallies towards the plateau, the lone side's rally point lies towards its own post.
    const d2 = (a: { x: number; y: number }, b: { x: number; y: number }) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
    const theirs = assaultPlan(observe(w, rules, 0), rules, 'hard')!;
    expect(d2(theirs.rally, home)).toBeLessThan(d2(post(w, 0), home));
    const ours = assaultPlan(observe(w, rules, 2), rules, 'hard')!;
    expect(d2(ours.rally, ours.objective)).toBeGreaterThan(d2(ours.rally, home));
  });

  it('outnumbered: only with teams, alone (no ally still in) against two or more', () => {
    const corners = SCENARIOS.find((x) => x.id === 'four-corners')!;
    expect([0, 1, 2, 3].some((side) => outnumbered(newGame(1, corners, 'normal', 12, false, null, 3).world, side))).toBe(false);
    const two = newGame(1, corners, 'normal', 12, false, null, 3, [], false, null, '2v2-next').world;
    expect([0, 1, 2, 3].some((side) => outnumbered(two, side))).toBe(false);
    // Its ally out, side 0 stands alone against two; against one it is not outnumbered.
    expect(outnumbered({ ...two, out: [1] }, 0)).toBe(true);
    expect(outnumbered({ ...two, out: [1, 3] }, 0)).toBe(false);
    expect(outnumbered({ ...two, out: [1] }, 2)).toBe(false);
    const lone = newGame(1, corners, 'normal', 12, false, null, 3, [], false, null, '1v3').world;
    expect([0, 1, 2, 3].map((side) => outnumbered(lone, side))).toEqual([true, false, false, false]);
  });
});

describe('teams in hot-seat (owner decision 2026-10-24)', () => {
  const corners = SCENARIOS.find((x) => x.id === 'four-corners')!;
  const out = (s0: RcState, sides: number[]): RcState => {
    let w = s0.world;
    for (const side of sides) w = retire(w, side).world;
    return { ...s0, world: w };
  };
  /** Locks the turn of every person in turn (each confirms the hand-over first). */
  const lockAll = (s0: RcState): RcState => {
    let s = s0;
    for (let k = 0; k < 4 && s.world.turn === s0.world.turn && s.phase === 'plan'; k++) {
      if (s.handover) s = confirmHandover(s);
      s = lockTurn(s);
    }
    return s;
  };

  it('two persons together against two computers: allied persons share sight; the game ends when one team is left and names its survivors', () => {
    const s = newGame(1, corners, 'normal', 30, false, null, 3, ['person', 'person', 'computer', 'computer'], false, null, '2v2-next');
    expect(isHotSeat(s)).toBe(true);
    expect(s.world.teams).toEqual([0, 0, 1, 1]);
    expect(isValidState(JSON.parse(JSON.stringify(s)))).toBe(true);
    // The opponents are out: both persons win.
    const won = lockAll(out(s, [2, 3]));
    expect(won.phase).toBe('finished');
    expect(winnersOf(won)).toEqual([0, 1]);
    expect(won.result).toBe('won');
    // Player A out, its ally B still in when the opponents fall: only B wins, A has lost.
    const lone = lockAll(out(s, [0, 2, 3]));
    expect(lone.phase).toBe('finished');
    expect(winnersOf(lone)).toEqual([1]);
    expect(lone.result).toBe('lost');
    // The team of the computers is left: they win, both persons have lost.
    const lost = lockAll(out(s, [0, 1]));
    expect(lost.phase).toBe('finished');
    expect(winnersOf(lost)).toEqual([2, 3]);
    expect(lost.result).toBe('lost');
  });

  it('giving up: a person whose team is all that is left is out of the win; at the limit the stronger team wins', () => {
    const s = newGame(1, corners, 'normal', 30, false, null, 3, ['person', 'person', 'computer', 'computer'], false, null, '2v2-next');
    // Both opponents gone; A gives up: B wins alone.
    const after = concede(out(s, [2, 3]));
    expect(after.phase).toBe('finished');
    expect(winnersOf(after)).toEqual([1]);
    expect(after.result).toBe('lost');
    // At the turn limit: the team whose strongest side is stronger wins.
    const late = structuredClone(s);
    late.world.turn = 29;
    late.world.supply![1] = (late.world.supply![1] ?? 0) + 100;
    const end = lockAll(late);
    expect(end.phase).toBe('finished');
    expect(winnersOf(end)).toEqual([0, 1]);
    expect(end.result).toBe('won');
  });
});
