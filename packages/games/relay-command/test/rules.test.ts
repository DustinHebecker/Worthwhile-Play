import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng, isRecord } from '@wp/game-core';
import { BASE_RULESET, NEUTRAL, archetypeOf, canonicalJson, cellOf, findPath, observe, passable, DEFAULT_DOCTRINE, computeNetwork, createWorld, initialIntel, observedCells, resolveTurn, validateCommand, worldHash, type Command, type Entity, type Order, type World } from '@wp/strategy-engine';
import { DIFFICULTIES, objectiveOf, planAi, type Difficulty } from '../src/ai';
import {
  cancelOrder,
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
  MAX_TURNS,
  STALL_TURNS,
  TURN_LIMITS,
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
} from '../src/rules';
import { FIELD_EXERCISE, opponentCounts, RIDGE_VALLEY, type ScenarioSpec, SCENARIOS } from '../src/scenarios';
import { fromScenario } from '../src/maps';

/** A side's plan from its own observation (default: the game's default level). */
/** Fingerprint of AI-vs-AI plans on the two-side maps before increment 4 (see the test). */
const TWO_SIDE_AI_FINGERPRINT = '965772b3';
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
  for (const spec of SCENARIOS) {
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
    expect(migrated.v).toBe(11);
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
    expect(migrated).toMatchObject({ v: 11, endless: false, opponents: 1, map: null, edit: null, scenario: 'field-exercise' });
    expect(isValidState(migrated)).toBe(true);
    expect(migrateState({ ...v7, v: 9 }, 7)).toBeUndefined();
    expect(isValidState(v7)).toBe(false);
  });

  it('version-6 saves (open end always had the stalemate rule) play on as a plain open end', () => {
    const s = lockTurn(newGame(2, FIELD_EXERCISE, 'normal', null, true));
    const v6 = JSON.parse(JSON.stringify({ ...s, v: 6, lead: [5] })) as Record<string, unknown>;
    delete v6.quick;
    const migrated = migrateState(v6, 6)!;
    expect(migrated).toMatchObject({ v: 11, endless: false, opponents: 1, quick: false, lead: [], turnLimit: null, map: null, edit: null });
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
    expect(migrated.v).toBe(11);
    expect(migrated.draft.length).toBeLessThanOrEqual(orderSlots(migrated));
    expect(migrated.draft.every((c) => orderRefusal({ ...migrated, draft: [] }, c.unit, c.order) === null)).toBe(true);
    expect(isValidState(migrated)).toBe(true);
  });

  it('migrates a version-1 save (no network) to the strategy ruleset', () => {
    const v1 = { ...structuredClone(newGame(3)), v: 1 } as Record<string, unknown>;
    (v1.world as Record<string, unknown>).ruleset = 'base-1';
    const migrated = migrateState(v1, 1);
    expect(migrated?.v).toBe(11);
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
      for (const ev of s.events) expect(all).toContainEqual(ev);
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
    expect(migrated.v).toBe(11);
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
    // engine test as well (observe.test.ts, review of PR #36).
    const games = fc.sample(arbMidGame, 30);
    let checked = 0;
    fc.assert(
      fc.property(fc.nat(games.length - 1), fc.nat(1000), fc.nat(143), fc.constantFrom('hold', 'regroup', 'move'), (g, pick, cell, kind) => {
        const s = games[g]!;
        const intel = s.world.intel?.[OPPONENT] ?? [];
        const hidden = own(s).filter((e) => e.kind !== 'command-post' && !intel.some((r) => r.id === e.id && r.live));
        if (hidden.length === 0) return;
        const before = canonicalJson(ai(s.world, OPPONENT));
        const moved = structuredClone(s.world);
        const unit = moved.entities.find((e) => e.id === hidden[pick % hidden.length]!.id)!;
        const x = cell % 12;
        const y = Math.floor(cell / 12);
        const observed = observedCells(s.world, RULESET, OPPONENT);
        const free = !moved.entities.some((e) => e.x === x && e.y === y) && validate(moved, { side: PLAYER, unit: unit.id, order: { type: 'move', x, y } });
        if (!free || observed[y * 12 + x] === 1) return;
        Object.assign(unit, { x, y, order: kind === 'move' ? { type: 'move', x: 0, y: 0 } : { type: kind } });
        checked++;
        expect(canonicalJson(ai(moved, OPPONENT))).toBe(before);
      }),
      { numRuns: 120 }
    );
    expect(checked).toBeGreaterThan(30);
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

describe('opponent levels (I5)', () => {
  /** A game length: a turn limit, open end (`null`) or a quick match. */
  type Length = number | null | 'quick';
  const start = (seed: number, spec: ScenarioSpec, difficulty: Difficulty, limit: Length): RcState =>
    newGame(seed, spec, difficulty, limit === 'quick' ? null : limit, limit === 'quick');
  /**
   * Symmetric random opening on `spec`: `pairs` unit pairs (a player unit and its mirror image)
   * nudged by a mirrored displacement of up to `reach` cells. The engine draws no randomness, so
   * varied openings are the only way to get more than one game per pairing.
   */
  function opening(spec: ScenarioSpec, seed: number, pairs: number, reach: number, limit: Length, difficulty: Difficulty): RcState {
    const s = start(seed, spec, difficulty, limit);
    const rng = createRng(seed * 7919 + 13);
    const { w, h } = s.world.map;
    const movable = s.world.entities.filter((e) => e.side === PLAYER && e.kind !== 'command-post');
    const free = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && passable(s.world.map, RULESET, x, y, 'ground') && !s.world.entities.some((e) => e.x === x && e.y === y);
    for (let k = 0; k < pairs; k++) {
      const u = movable[rng.int(0, movable.length - 1)]!;
      const m = s.world.entities.find((e) => e.side === OPPONENT && e.x === w - 1 - u.x && e.y === h - 1 - u.y)!;
      const nx = u.x + rng.int(-reach, reach);
      const ny = u.y + rng.int(-reach, reach);
      if (!free(nx, ny) || !free(w - 1 - nx, h - 1 - ny)) continue;
      Object.assign(u, { x: nx, y: ny });
      Object.assign(m, { x: w - 1 - nx, y: h - 1 - ny });
    }
    s.world.intel = initialIntel(s.world, RULESET);
    return s;
  }
  /** The player side is played by an AI at level `a` (or not at all), the opponent at the game's level. */
  function play(s: RcState, a: Difficulty | 'passive', cap = 40): RcState {
    for (let i = 0; i < cap && s.phase === 'plan'; i++) {
      if (a !== 'passive') for (const c of ai(s.world, PLAYER, a)) s = planOrder(s, c.unit, c.order, c.doctrine) ?? s;
      s = lockTurn(s);
    }
    return s;
  }
  /** Wins of `a` and of `b` over `n` openings, each played from both sides of the map (24 turns). */
  function margin(spec: ScenarioSpec, a: Difficulty, b: Difficulty, n: number, pairs: number, reach: number): { a: number; b: number; draws: number } {
    const out = { a: 0, b: 0, draws: 0 };
    for (let seed = 0; seed < n; seed++) {
      for (const [r, win, loss] of [
        [play(opening(spec, seed, pairs, reach, 24, b), a).result, 'won', 'lost'],
        [play(opening(spec, seed, pairs, reach, 24, a), b).result, 'lost', 'won']
      ] as const) {
        if (r === win) out.a++;
        else if (r === loss) out.b++;
        else out.draws++;
      }
    }
    return out;
  }
  const MODES: readonly Length[] = [24, 'quick'];

  /**
   * The level-against-level margins are measured on these two maps only (each one is a long
   * suite; the cheaper suites below run on every map). Newer maps are covered by the passive,
   * produce-only, termination and resumability suites.
   */
  const MARGIN_MAPS: readonly ScenarioSpec[] = [FIELD_EXERCISE, RIDGE_VALLEY];
  // Timeouts of the long suites: measured under `pnpm coverage` (CI runs with coverage, about
  // 1.3–2× slower than a plain run): beat easy 63 s locally (133 s in CI), hard vs normal 46 s,
  // passive 109 s, resumable 28 s, produce-only 11 s — each well under half its limit locally.

  it('normal and hard beat easy by a clear margin over randomised openings on Field Exercise and Ridge Valley', () => {
    for (const spec of MARGIN_MAPS) {
      const hard = margin(spec, 'hard', 'easy', 10, 2, 2);
      const normal = margin(spec, 'normal', 'easy', 10, 2, 2);
      expect(hard.a, `${spec.id} hard vs easy ${JSON.stringify(hard)}`).toBeGreaterThanOrEqual(hard.b + 8);
      expect(normal.a, `${spec.id} normal vs easy ${JSON.stringify(normal)}`).toBeGreaterThanOrEqual(normal.b + 8);
    }
  }, 600_000); // 2 maps x 2 levels x 20 AI-vs-AI games of 24 turns: 154 s under coverage on a loaded 4-core machine (2026-10-14), kept under half of this

  it('hard beats normal on Field Exercise by at least 4 games; over Field Exercise and Ridge Valley it wins at least as often as it loses', () => {
    // The two share the plan of attack; hard adds breadth, focus fire, pulling back and jamming.
    // Measured since PR #13 (escorts yield in passes; storms find a way past held rings):
    // Field Exercise 8-4, Ridge Valley 6-6 over 2x6 openings, so no ordering is claimed for Ridge Valley.
    const total = { a: 0, b: 0, draws: 0 };
    for (const spec of MARGIN_MAPS) {
      const r = margin(spec, 'hard', 'normal', 6, 2, 2);
      total.a += r.a;
      total.b += r.b;
      total.draws += r.draws;
      if (spec === FIELD_EXERCISE) expect(r.a, `${spec.id} hard vs normal ${JSON.stringify(r)}`).toBeGreaterThanOrEqual(r.b + 4);
    }
    expect(total.a, `hard vs normal over both margin maps ${JSON.stringify(total)}`).toBeGreaterThanOrEqual(total.b);
  }, 300_000);

  /** Random player moves in a resolved first turn (the reviewer's "mild opening"), then nothing. */
  function firstTurnMoves(spec: ScenarioSpec, seed: number, limit: Length, difficulty: Difficulty): RcState {
    let s = start(seed, spec, difficulty, limit);
    const rng = createRng(seed * 31 + 7);
    const units = s.world.entities.filter((e) => e.side === PLAYER && (RULESET.archetypes[e.kind]?.speed ?? 0) > 0);
    for (let k = 0; k < 4; k++) {
      const u = units[rng.int(0, units.length - 1)]!;
      s = planOrder(s, u.id, { type: 'move', x: Math.max(0, Math.min(s.world.map.w - 1, u.x + rng.int(-4, 4))), y: Math.max(0, Math.min(s.world.map.h - 1, u.y + rng.int(-4, 4))) }) ?? s;
    }
    return lockTurn(s);
  }
  /** Longest game the tests below accept for their strategies (measured: 42 turns); not a bound for every strategy. */
  const GAME_BOUND = 60;

  it('a passive player loses at normal and hard on every map, with a turn limit and open end: from the unperturbed start, nudged openings and first-turn moves; every game ends within the bound', () => {
    for (const spec of SCENARIOS) {
      for (const limit of [...MODES, null]) {
        // Plain open end (no stalemate rule; measured longest 39 turns): not a bound for every strategy —
        // a player who only produces, or two mirrored AIs, can stall; the player can then end on strength.
        const bound = GAME_BOUND;
        for (const level of ['normal', 'hard'] as const) {
          const label = (kind: string, games: RcState[]) => `${spec.id} limit=${limit} ${level} ${kind}: ${games.map((g) => `${g.result}@${g.world.turn}`).join(',')}`;
          const unperturbed = [play(start(0, spec, level, limit), 'passive', bound)];
          const nudged = Array.from({ length: 4 }, (_, seed) => play(opening(spec, seed, 2, 2, limit, level), 'passive', bound));
          const moved = Array.from({ length: 4 }, (_, seed) => play(firstTurnMoves(spec, seed + 100, limit, level), 'passive', bound));
          for (const [kind, games] of [['start', unperturbed], ['nudged', nudged]] as const) {
            expect(games.every((g) => g.phase === 'finished' && g.result === 'lost'), label(kind, games)).toBe(true);
          }
          // First-turn moves can leave a player well placed: it wins some (on Field Exercise, at both levels).
          expect(moved.every((g) => g.phase === 'finished'), label('moved', moved)).toBe(true);
          expect(moved.filter((g) => g.result === 'lost').length, label('moved', moved)).toBeGreaterThanOrEqual(3);
        }
      }
    }
  }, 600_000);

  it('every game stays a valid, resumable save after every turn: every map, every length, passive and playing', () => {
    for (const spec of SCENARIOS) {
      for (const limit of [...TURN_LIMITS, 'quick'] as const) {
        for (const player of ['passive', 'normal'] as const) {
          let s = start(3, spec, 'hard', limit);
          for (let i = 0; i < GAME_BOUND && s.phase === 'plan'; i++) {
            if (player !== 'passive') for (const c of ai(s.world, PLAYER, player)) s = planOrder(s, c.unit, c.order, c.doctrine) ?? s;
            s = lockTurn(s);
            const saved = JSON.parse(JSON.stringify(s)) as unknown;
            expect(isValidState(saved), `${spec.id} limit=${limit} ${player} turn ${s.world.turn}`).toBe(true);
          }
          if (typeof limit === 'number') expect(s.lead).toEqual([]);
        }
      }
    }
  }, 600_000);

  it('a player who only produces with the normal template and never moves loses, and AI-vs-AI quick matches end within the bound', () => {
    // Narrow on purpose: a stronger turtle (Extractors on every deposit, then a Motor Pool and
    // heavier units) can out-produce the opponent and win on strength (design notes, I6d).

    for (const spec of SCENARIOS) {
      for (const level of ['normal', 'hard'] as const) {
        let s = opening(spec, 1, 2, 2, 'quick', level);
        for (let i = 0; i < GAME_BOUND && s.phase === 'plan'; i++) {
          for (const c of ai(s.world, PLAYER, 'normal')) if (c.order.type === 'produce') s = planOrder(s, c.unit, c.order) ?? s;
          s = lockTurn(s);
        }
        expect(s, `${spec.id} ${level} produce-only`).toMatchObject({ phase: 'finished', result: 'lost' });
      }
      for (const [a, b] of [['hard', 'normal'], ['normal', 'normal'], ['easy', 'easy']] as const) {
        const g = play(opening(spec, 2, 2, 2, 'quick', b), a, GAME_BOUND);
        expect(g.phase, `${spec.id} ${a} vs ${b} quick match, turn ${g.world.turn}`).toBe('finished');
      }
    }
  }, 600_000);

  it('the same level on both sides from the scripted start gives a symmetric draw (no side bias)', () => {
    for (const level of DIFFICULTIES) expect(play(newGame(1, FIELD_EXERCISE, level, 12), level).result).toBe('draw');
  });

  it('new games keep the chosen level; saves without one (version 3) play on at normal', () => {
    expect(newGame(1, FIELD_EXERCISE, 'hard').difficulty).toBe('hard');
    const v3 = JSON.parse(JSON.stringify({ ...newGame(2), v: 3 })) as Record<string, unknown>;
    delete v3.difficulty;
    expect(migrateState(v3, 3)?.difficulty).toBe('normal');
    expect(isValidState({ ...newGame(2), difficulty: 'impossible' })).toBe(false);
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

  it('every seat plans alike: on the map turned a quarter, the next seat\'s plan is the turned plan (AI uses its seat\'s frame)', () => {
    // Quarter turn of Four Corners carries seat k onto seat k+1; the map itself is the same.
    const n = 16;
    const at = (x: number, y: number): [number, number] => [n - 1 - y, x];
    const cell = (c: number) => {
      const [x, y] = at(c % n, Math.floor(c / n));
      return y * n + x;
    };
    const next = (side: number) => (side === NEUTRAL ? NEUTRAL : (side + 1) % 4);
    const order = (o: Order): Order => {
      if (o.type === 'move' || o.type === 'build') {
        const [x, y] = at(o.x, o.y);
        return { ...o, x, y };
      }
      if (o.type === 'patrol') {
        const [x, y] = at(o.x, o.y);
        const [rx, ry] = at(o.rx, o.ry);
        return { ...o, x, y, rx, ry };
      }
      return o;
    };
    const turned = (w: World): World => {
      const perm = <T,>(list: readonly T[]): T[] => {
        const out = [...list];
        list.forEach((v, s) => (out[next(s)] = v));
        return out;
      };
      return {
        ...structuredClone(w),
        map: { ...w.map, deposits: (w.map.deposits ?? []).map((d) => ({ ...d, x: at(d.x, d.y)[0], y: at(d.x, d.y)[1] })).sort((a, b) => a.y * n + a.x - (b.y * n + b.x)) },
        ...(w.supply && { supply: perm(w.supply) }),
        ...(w.out && { out: w.out.map(next).sort((a, b) => a - b) }),
        entities: w.entities.map((e) => ({
          ...structuredClone(e),
          side: next(e.side),
          x: at(e.x, e.y)[0],
          y: at(e.x, e.y)[1],
          order: order(e.order),
          ...(e.stall && { stall: { ...e.stall, goal: e.stall.goal < n * n ? cell(e.stall.goal) : e.stall.goal } }),
          ...(e.prev !== undefined && { prev: cell(e.prev) })
        })),
        projectiles: w.projectiles.map((p) => ({ ...p, side: next(p.side), x: at(p.x, p.y)[0], y: at(p.x, p.y)[1] })),
        ...(w.intel && { intel: perm(w.intel.map((list) => list.map((r) => ({ ...r, side: next(r.side), x: at(r.x, r.y)[0], y: at(r.x, r.y)[1] })))) })
      };
    };
    const rules = SIDES_RULESET;
    for (const level of ['normal', 'hard'] as const) {
      let s = newGame(1, corners, level, 30, false, null, 3);
      for (let t = 0; t < 12 && s.phase === 'plan'; t++) {
        const r = turned(s.world);
        for (let side = 0; side < 4; side++) {
          if (s.world.out?.includes(side)) continue;
          const plan = planAi(observe(s.world, rules, side), rules, level).map((c) => ({ ...c, side: next(c.side), order: order(c.order) }));
          expect(planAi(observe(r, rules, next(side)), rules, level), `${level} turn ${t} seat ${side}`).toEqual(plan);
        }
        s = lockTurn(s);
      }
    }
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

  it('two-side maps keep their measured AI exactly: plans of AI-vs-AI games match the fingerprint from before increment 4 (PR #24 review)', () => {
    // Produced by the AI of main at 080fab6 (before increment 4): every change for several sides
    // must leave the one-opponent games on the two-side maps byte-identical.
    let h = 0x811c9dc5;
    const feed = (text: string) => {
      for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0;
    };
    for (const spec of SCENARIOS.filter((x) => !x.seats)) {
      for (const [mine, theirs] of [['hard', 'normal'], ['normal', 'hard']] as const) {
        let s = newGame(3, spec, theirs, 24);
        while (s.phase === 'plan') {
          for (const c of ai(s.world, PLAYER, mine)) s = planOrder(s, c.unit, c.order, c.doctrine) ?? s;
          s = lockTurn(s);
        }
        feed(canonicalJson(s.log));
      }
    }
    expect(h.toString(16)).toBe(TWO_SIDE_AI_FINGERPRINT);
  }, 300_000);

  it('saves: v8 migrates to v9 with one opponent; a v9 save must match its map, count, rules and frames', () => {
    const v8 = JSON.parse(JSON.stringify({ ...newGame(4), v: 8 })) as Record<string, unknown>;
    delete v8.opponents;
    expect(migrateState(v8, 8)).toMatchObject({ v: 11, endless: false, opponents: 1 });
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

  // Taken before hot-seat (main at f2ee871: 'cdaa78b6'); updated when a side stopped being told
  // where its own shells land in cells it does not observe (PR #28): first `observe()` (the AI on
  // Four Corners plans differently in a few turns: '4af64ac7'), then the reports (the player's turn
  // summaries lose such `launch` events; no plan changes: 'fe0a5277'); then when a side stopped
  // being told of a shot by its own unit out of contact at an enemy it never had reported (gate
  // find, 2026-10-14: the summaries lose such `fire` events; world, log and result unchanged:
  // '83a1b8af'). The two-side AI plans are unchanged, see their own fingerprint.
  it('one person is the single-player game, byte for byte: every map and opponent count matches the fingerprint taken before hot-seat (main at f2ee871)', () => {
    let h = 0x811c9dc5;
    const feed = (text: string) => {
      for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0;
    };
    for (const spec of SCENARIOS) {
      for (const n of opponentCounts(spec)) {
        let s = newGame(5, spec, 'normal', 12, false, null, n);
        expect(isHotSeat(s)).toBe(false);
        while (s.phase === 'plan') {
          s = plan(s, 'hard');
          s = lockTurn(s);
          expect(s.handover).toBe(false);
          feed(canonicalJson({ world: s.world, events: s.events, entry: s.log.at(-1), lead: s.lead, result: s.result }));
        }
      }
    }
    expect(h.toString(16)).toBe('83a1b8af');
  }, 300_000);

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
    for (const k of ['seats', 'planning', 'handover', 'locked', 'inbox', 'retired', 'winner', 'endless']) delete v9[k];
    expect(migrateState(v9, 9)).toMatchObject({ v: 11, endless: false, seats: ['person', 'computer', 'computer'], planning: 0, handover: false, locked: [[], [], []], inbox: [[], [], []], retired: [], winner: null });
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
    expect(migrateState(v10, 10)).toMatchObject({ v: 11, endless: false });
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
