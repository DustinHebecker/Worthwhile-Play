import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng, isRecord } from '@wp/game-core';
import { BASE_RULESET, canonicalJson, cellOf, findPath, observe, passable, DEFAULT_DOCTRINE, computeNetwork, createWorld, initialIntel, observedCells, resolveTurn, validateCommand, worldHash, type Command, type World } from '@wp/strategy-engine';
import { DIFFICULTIES, planAi, type Difficulty } from '../src/ai';
import {
  cancelOrder,
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
  STALL_MARGIN,
  CONTACT_TURN,
  stalled,
  stalemateTurns,
  type RcState
} from '../src/rules';
import { FIELD_EXERCISE, type ScenarioSpec, SCENARIOS } from '../src/scenarios';

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
  for (const spec of SCENARIOS) {
    it(`${spec.id} is point-symmetric in terrain and units, and the Command Posts can reach each other`, () => {
      const { map, entities } = spec.scenario;
      expect(map.terrain).toBe([...map.terrain].reverse().join(''));
      const mirror = (e: (typeof entities)[number]) => `${1 - e.side}:${e.kind}:${map.w - 1 - e.x},${map.h - 1 - e.y}`;
      expect(new Set(entities.map(mirror))).toEqual(new Set(entities.map((e) => `${e.side}:${e.kind}:${e.x},${e.y}`)));
      const w = createWorld({ ...spec.scenario, seed: 1 }, RULESET);
      const posts = w.entities.filter((e) => e.kind === 'command-post');
      expect(posts).toHaveLength(2);
      expect(findPath(w.map, RULESET, cellOf(w.map, posts[0]!.x, posts[0]!.y), cellOf(w.map, posts[1]!.x, posts[1]!.y), { layer: 'ground', side: 0 })).toBeDefined();
      expect(isValidState(newGame(3, spec))).toBe(true);
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
    expect(isValidState({ ...open, lead: [1.5] })).toBe(false);
    expect(isValidState({ ...open, lead: [0] })).toBe(false); // more entries than turns played
    expect(isValidState({ ...lockTurn(open), lead: [0] })).toBe(true);
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
    const base = newGame(1, FIELD_EXERCISE, 'easy', null);
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
    expect(migrated.v).toBe(6);
    expect(isValidState(migrated)).toBe(true);
    const rifle = own(migrated).find((u) => u.kind === 'rifles')!;
    expect(rifle.doctrine?.lostContact).toBe('keep');
    // Units without any doctrine in the save play on as before too ('keep'); 'regroup' is for new games.
    for (const u of own(migrated).filter((u) => u.kind !== 'command-post' && u.kind !== 'rifles')) expect(u.doctrine).toEqual({ ...PLAYER_DOCTRINE, lostContact: 'keep' });
    expect(migrated.lead).toEqual([]);
    expect(migrateState({ ...(strip(v4) as Record<string, unknown>), v: 6 }, 4)).toBeUndefined();
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
    expect(migrated.v).toBe(6);
    expect(migrated.draft.length).toBeLessThanOrEqual(orderSlots(migrated));
    expect(migrated.draft.every((c) => orderRefusal({ ...migrated, draft: [] }, c.unit, c.order) === null)).toBe(true);
    expect(isValidState(migrated)).toBe(true);
  });

  it('migrates a version-1 save (no network) to the strategy ruleset', () => {
    const v1 = { ...structuredClone(newGame(3)), v: 1 } as Record<string, unknown>;
    (v1.world as Record<string, unknown>).ruleset = 'base-1';
    const migrated = migrateState(v1, 1);
    expect(migrated?.v).toBe(6);
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
    expect(migrated.v).toBe(6);
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
    let checked = 0;
    fc.assert(
      fc.property(arbMidGame, fc.nat(1000), fc.nat(143), fc.constantFrom('hold', 'regroup', 'move'), (s, pick, cell, kind) => {
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
  /**
   * Symmetric random opening on `spec`: `pairs` unit pairs (a player unit and its mirror image)
   * nudged by a mirrored displacement of up to `reach` cells. The engine draws no randomness, so
   * varied openings are the only way to get more than one game per pairing.
   */
  function opening(spec: ScenarioSpec, seed: number, pairs: number, reach: number, limit: number | null, difficulty: Difficulty): RcState {
    const s = newGame(seed, spec, difficulty, limit);
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
  const MODES: readonly (number | null)[] = [24, null];

  it('normal and hard beat easy by a clear margin over randomised openings on both maps', () => {
    for (const spec of SCENARIOS) {
      const hard = margin(spec, 'hard', 'easy', 10, 2, 2);
      const normal = margin(spec, 'normal', 'easy', 10, 2, 2);
      expect(hard.a, `${spec.id} hard vs easy ${JSON.stringify(hard)}`).toBeGreaterThanOrEqual(hard.b + 8);
      expect(normal.a, `${spec.id} normal vs easy ${JSON.stringify(normal)}`).toBeGreaterThanOrEqual(normal.b + 8);
    }
  }, 180_000);

  it('hard beats normal clearly on Field Exercise; over both maps it wins at least as often as it loses', () => {
    // The two share the plan of attack; hard adds breadth, focus fire, pulling back and jamming.
    // Measured with the economy (design notes): Field Exercise 10-2, Ridge Valley 4-8 over 2x6
    // openings, so no ordering is claimed per map for Ridge Valley.
    const total = { a: 0, b: 0, draws: 0 };
    for (const spec of SCENARIOS) {
      const r = margin(spec, 'hard', 'normal', 6, 2, 2);
      total.a += r.a;
      total.b += r.b;
      total.draws += r.draws;
      if (spec === FIELD_EXERCISE) expect(r.a, `${spec.id} hard vs normal ${JSON.stringify(r)}`).toBeGreaterThanOrEqual(r.b + 6);
    }
    expect(total.a, `hard vs normal over both maps ${JSON.stringify(total)}`).toBeGreaterThanOrEqual(total.b);
  }, 300_000);

  /** Random player moves in a resolved first turn (the reviewer's "mild opening"), then nothing. */
  function firstTurnMoves(spec: ScenarioSpec, seed: number, limit: number | null, difficulty: Difficulty): RcState {
    let s = newGame(seed, spec, difficulty, limit);
    const rng = createRng(seed * 31 + 7);
    const units = s.world.entities.filter((e) => e.side === PLAYER && (RULESET.archetypes[e.kind]?.speed ?? 0) > 0);
    for (let k = 0; k < 4; k++) {
      const u = units[rng.int(0, units.length - 1)]!;
      s = planOrder(s, u.id, { type: 'move', x: Math.max(0, Math.min(s.world.map.w - 1, u.x + rng.int(-4, 4))), y: Math.max(0, Math.min(s.world.map.h - 1, u.y + rng.int(-4, 4))) }) ?? s;
    }
    return lockTurn(s);
  }
  /** Longest game the tests below accept (measured: 42 turns). */
  const GAME_BOUND = 60;

  it('a passive player loses at normal and hard on both maps, with a turn limit and open end: from the unperturbed start, nudged openings and first-turn moves; every game ends within the bound', () => {
    for (const spec of SCENARIOS) {
      for (const limit of MODES) {
        for (const level of ['normal', 'hard'] as const) {
          const label = (kind: string, games: RcState[]) => `${spec.id} limit=${limit} ${level} ${kind}: ${games.map((g) => `${g.result}@${g.world.turn}`).join(',')}`;
          const start = [play(newGame(0, spec, level, limit), 'passive', GAME_BOUND)];
          const nudged = Array.from({ length: 4 }, (_, seed) => play(opening(spec, seed, 2, 2, limit, level), 'passive', GAME_BOUND));
          const moved = Array.from({ length: 4 }, (_, seed) => play(firstTurnMoves(spec, seed + 100, limit, level), 'passive', GAME_BOUND));
          for (const [kind, games] of [['start', start], ['nudged', nudged]] as const) {
            expect(games.every((g) => g.phase === 'finished' && g.result === 'lost'), label(kind, games)).toBe(true);
          }
          // First-turn moves can leave a player well placed: measured 1 win in 8 (Field Exercise, normal).
          expect(moved.every((g) => g.phase === 'finished'), label('moved', moved)).toBe(true);
          expect(moved.filter((g) => g.result === 'lost').length, label('moved', moved)).toBeGreaterThanOrEqual(3);
        }
      }
    }
  }, 600_000);

  it('a player who only produces and never moves loses too, and AI-vs-AI games in open end all end within the bound', () => {
    for (const spec of SCENARIOS) {
      for (const level of ['normal', 'hard'] as const) {
        let s = opening(spec, 1, 2, 2, null, level);
        for (let i = 0; i < GAME_BOUND && s.phase === 'plan'; i++) {
          for (const c of ai(s.world, PLAYER, 'normal')) if (c.order.type === 'produce') s = planOrder(s, c.unit, c.order) ?? s;
          s = lockTurn(s);
        }
        expect(s, `${spec.id} ${level} produce-only`).toMatchObject({ phase: 'finished', result: 'lost' });
      }
      for (const [a, b] of [['hard', 'normal'], ['normal', 'normal'], ['easy', 'easy']] as const) {
        const g = play(opening(spec, 2, 2, 2, null, b), a, GAME_BOUND);
        expect(g.phase, `${spec.id} ${a} vs ${b} open end, turn ${g.world.turn}`).toBe('finished');
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

