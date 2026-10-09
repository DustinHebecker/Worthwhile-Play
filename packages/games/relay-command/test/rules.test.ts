import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { BASE_RULESET, canonicalJson, DEFAULT_DOCTRINE, computeNetwork, createWorld, validateCommand, worldHash, type Command, type World } from '@wp/strategy-engine';
import { planAi } from '../src/ai';
import {
  cancelOrder,
  doctrineFor,
  doctrineRefusal,
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
  PLAYER,
  planOrder,
  replay,
  RULESET,
  sideValue,
  unitById,
  type RcState
} from '../src/rules';
import { FIELD_EXERCISE } from '../src/scenarios';

const own = (s: RcState) => s.world.entities.filter((e) => e.side === PLAYER);
const enemy = (s: RcState) => s.world.entities.filter((e) => e.side === OPPONENT);
const validate = (world: World, c: Command) => validateCommand(world, RULESET, c).ok;
const withoutUnits = (world: World, ids: readonly number[]): World => ({ ...world, entities: world.entities.filter((e) => !ids.includes(e.id)) });

/** Plays a whole game with the scripted AI on both sides. */
function selfPlay(seed: number): RcState {
  let s = newGame(seed);
  for (let i = 0; i < 100 && s.phase === 'plan'; i++) {
    for (const c of planAi(s.world, RULESET, PLAYER)) s = planOrder(s, c.unit, c.order) ?? s;
    s = lockTurn(s);
  }
  return s;
}

describe('Field Exercise scenario', () => {
  it('is point-symmetric in terrain and units', () => {
    const { map, entities } = FIELD_EXERCISE.scenario;
    expect(map.terrain).toBe([...map.terrain].reverse().join(''));
    const mirror = (e: (typeof entities)[number]) => `${1 - e.side}:${e.kind}:${map.w - 1 - e.x},${map.h - 1 - e.y}`;
    expect(new Set(entities.map(mirror))).toEqual(new Set(entities.map((e) => `${e.side}:${e.kind}:${e.x},${e.y}`)));
  });

  it('starts in the planning phase with one Command Post per side', () => {
    const s = newGame(5);
    expect(s.phase).toBe('plan');
    expect(s.seed).toBe(5);
    expect(s.world.turn).toBe(0);
    expect(commandPost(s.world, PLAYER)).toBeDefined();
    expect(commandPost(s.world, OPPONENT)).toBeDefined();
    expect(own(s)).toHaveLength(7);
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
    const after = lockTurn(s);
    expect(unitById(after, rifle.id)!.order).toEqual({ type: 'move', x: 9, y: 2 });
    expect(unitById(after, rifle.id)!.y).toBeLessThan(9);
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

  it('the opponent obeys coverage and order slots and gets its relay set up within 4 turns (B1)', () => {
    for (const seed of [1, 2, 3]) {
      let s = newGame(seed);
      let setUp = false;
      for (let turn = 0; turn < 6 && s.phase === 'plan'; turn++) {
        const plan = planAi(s.world, RULESET, OPPONENT);
        expect(plan.length).toBeLessThanOrEqual(4);
        for (const c of plan) expect(validate(s.world, c)).toBe(true);
        s = lockTurn(s);
        const truck = enemy(s).find((e) => e.kind === 'mast-truck');
        if (truck?.deploy === RULESET.ticksPerTurn) setUp = true;
        if (turn === 3) expect(setUp).toBe(true);
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
    for (const c of planAi(s.world, RULESET, OPPONENT)) expect(validate(s.world, c)).toBe(true);
  });

  it('migrates a real version-1 save with a full draft: drafts are re-checked against the new limits (N5)', () => {
    // Version 1: base ruleset, no Mast Truck, five planned orders (no slot limit back then).
    const entities = FIELD_EXERCISE.scenario.entities.filter((e) => e.kind !== 'mast-truck');
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
    expect(migrated.v).toBe(2);
    expect(migrated.draft.length).toBeLessThanOrEqual(orderSlots(migrated));
    expect(migrated.draft.every((c) => orderRefusal({ ...migrated, draft: [] }, c.unit, c.order) === null)).toBe(true);
    expect(isValidState(migrated)).toBe(true);
  });

  it('migrates a version-1 save (no network) to the strategy ruleset', () => {
    const v1 = { ...structuredClone(newGame(3)), v: 1 } as Record<string, unknown>;
    (v1.world as Record<string, unknown>).ruleset = 'base-1';
    const migrated = migrateState(v1, 1);
    expect(migrated?.v).toBe(2);
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

  it('the opponent gives its fighters a retreat doctrine', () => {
    const plan = planAi(newGame(1).world, RULESET, OPPONENT);
    const attacks = plan.filter((c) => c.order.type === 'attack');
    expect(attacks.length).toBeGreaterThan(0);
    for (const c of attacks) expect(c.doctrine?.retreatBelow).toBe(25);
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
        const before = canonicalJson(planAi(s.world, RULESET, OPPONENT));
        for (const o of orders) s = planOrder(s, o.unit, { type: 'move', x: o.x, y: o.y }) ?? s;
        expect(canonicalJson(planAi(s.world, RULESET, OPPONENT))).toBe(before);
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
      { ...s, v: 3 },
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
