import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { canonicalJson, worldHash, type Command, type World } from '@wp/strategy-engine';
import { planAi } from '../src/ai';
import {
  cancelOrder,
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
    expect(own(s)).toHaveLength(6);
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
      { ...s, v: 2 },
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
