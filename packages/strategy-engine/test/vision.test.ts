import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  BASE_RULESET,
  cellOf,
  createWorld,
  isValidWorld,
  observedCells,
  resolveTurn,
  STRATEGY_RULESET,
  validateCommand,
  type Command,
  type Report,
  type Scenario,
  type SimEvent,
  type World
} from '../src';
import { arbScenario, open } from './helpers';

const rs = STRATEGY_RULESET;
const worldOf = (map: Scenario['map'], entities: Scenario['entities']): World => createWorld({ map, sides: 2, entities, seed: 1 }, rs);
const unit = (w: World, id: number) => w.entities.find((e) => e.id === id)!;
const report = (w: World, side: number, id: number): Report | undefined => w.intel?.[side]?.find((r) => r.id === id);

/** Runs whole turns; the first turn carries `first`. Returns the world and side-filtered events. */
function play(w: World, n: number, first: Command[] = []): { world: World; events: SimEvent[]; reported: SimEvent[][] } {
  let world = w;
  const events: SimEvent[] = [];
  const reported: SimEvent[][] = [[], []];
  for (let i = 0; i < n; i++) {
    const r = resolveTurn(world, rs, [i === 0 ? first : []]);
    events.push(...r.events);
    r.reported?.forEach((list, side) => reported[side]?.push(...list));
    world = r.world;
  }
  return { world, events, reported };
}

describe('information follows the network (D7)', () => {
  it('only units in coverage report what they see; units out of contact still see for themselves', () => {
    // Command post covers x ≤ 5. Rifles at 4 (in coverage) see x ≤ 8; rifles at 12 (out of contact) see the enemy at 14.
    const w = worldOf(open(20, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'rifles', x: 4, y: 0 },
      { side: 0, kind: 'rifles', x: 12, y: 0 },
      { side: 1, kind: 'warden', x: 14, y: 0 },
      { side: 1, kind: 'command-post', x: 19, y: 0 }
    ]);
    expect(report(w, 0, 4)).toBeUndefined();
    // The enemy's fixed installations are known from the start (as ghosts).
    expect(report(w, 0, 5)).toMatchObject({ live: false, x: 19, kind: 'command-post' });
    expect(report(w, 0, 2)).toMatchObject({ live: true, x: 4 });
    // Own unit out of contact: known only by its starting position.
    expect(report(w, 0, 3)).toMatchObject({ live: false, x: 12, tick: 0 });
    // The out-of-contact rifles fight what they see themselves.
    const { world, events, reported } = play(w, 1);
    expect(events.some((e) => e.t === 'fire' && e.id === 3 && e.target === 4)).toBe(true);
    expect(reported[0]!.some((e) => e.t === 'fire' && e.id === 3)).toBe(false);
    expect(report(world, 0, 4)).toBeUndefined();
  });

  it('an enemy is remembered as a ghost where it was last reported, until that cell is seen empty', () => {
    const w = worldOf(open(20, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 1, kind: 'rifles', x: 8, y: 0 },
      { side: 1, kind: 'command-post', x: 19, y: 0 },
      { side: 0, kind: 'outrider', x: 3, y: 0 }
    ]);
    expect(report(w, 0, 2)).toMatchObject({ live: true, x: 8 });
    // Our scout loses contact (drives back out of sight of anything): its sightings stop.
    const blind = structuredClone(w);
    unit(blind, 4).x = 1; // still in coverage, but x = 8 is beyond its vision now (1 + 6 = 7)
    unit(blind, 2).order = { type: 'move', x: 12, y: 0 };
    const away = play(blind, 1).world;
    expect(unit(away, 2).x).toBeGreaterThan(8);
    expect(report(away, 0, 2)).toMatchObject({ live: false, x: 8, tick: 0 });
    // A ghost is not a target.
    expect(validateCommand(away, rs, { side: 0, unit: 4, order: { type: 'attack', target: 2 } })).toEqual({ ok: false, reason: 'not-visible' });
    // Looking at the cell again finds it empty: the ghost is dropped (the enemy is beyond sight).
    const look = structuredClone(away);
    unit(look, 4).x = 4;
    unit(look, 2).order = { type: 'hold' };
    const after = play(look, 1).world;
    expect(observedCells(after, rs, 0)[cellOf(after.map, 8, 0)]).toBe(1);
    expect(report(after, 0, 2)?.live ?? false).toBe(observedCells(after, rs, 0)[cellOf(after.map, unit(after, 2).x, 0)] === 1);
    expect(report(after, 0, 2)?.x).not.toBe(8);
  });

  it('an own unit out of contact is shown at its last report and reports again on return', () => {
    const w = worldOf(open(20, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'outrider', x: 3, y: 0 },
      { side: 1, kind: 'command-post', x: 19, y: 0 }
    ]);
    const out = play(w, 1, [{ side: 0, unit: 2, order: { type: 'move', x: 14, y: 0 } }]).world;
    const ghost = report(out, 0, 2)!;
    expect(unit(out, 2).x).toBeGreaterThan(5);
    expect(ghost.x).not.toBe(unit(out, 2).x);
    expect(ghost.live).toBe(false);
    expect(ghost.x).toBeLessThanOrEqual(5);
    // Standing order: come back. It is written directly, as the unit cannot be reached.
    unit(out, 2).order = { type: 'regroup' };
    const back = play(out, 2).world;
    expect(report(back, 0, 2)).toMatchObject({ live: true, x: unit(back, 2).x });
  });

  it('destruction is known only where it was observed', () => {
    // Side 0's out-of-contact rifles at 12 are destroyed by the enemy; side 0 does not see it.
    const w = worldOf(open(20, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'rifles', x: 12, y: 0 },
      { side: 1, kind: 'warden', x: 14, y: 0 },
      { side: 1, kind: 'command-post', x: 19, y: 0 }
    ]);
    unit(w, 2).hp = 1;
    const { world, events, reported } = play(w, 1);
    expect(events.some((e) => e.t === 'destroyed' && e.id === 2)).toBe(true);
    expect(reported[0]!.some((e) => e.t === 'destroyed' && e.id === 2)).toBe(false);
    expect(reported[1]!.some((e) => e.t === 'destroyed' && e.id === 2)).toBe(true);
    expect(report(world, 0, 2)).toMatchObject({ live: false, x: 12 });
    expect(report(world, 1, 2)).toBeUndefined();
    expect(isValidWorld(JSON.parse(JSON.stringify(world)), rs)).toBe(true);
  });

  it('only spotted enemies can be ordered as targets', () => {
    const w = worldOf(open(20, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'howitzer', x: 3, y: 0 },
      { side: 1, kind: 'rifles', x: 9, y: 0 },
      { side: 1, kind: 'command-post', x: 19, y: 0 }
    ]);
    expect(validateCommand(w, rs, { side: 0, unit: 2, order: { type: 'attack', target: 3 } })).toEqual({ ok: false, reason: 'not-visible' });
    const spotted = worldOf(open(20, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'howitzer', x: 3, y: 0 },
      { side: 1, kind: 'rifles', x: 9, y: 0 },
      { side: 1, kind: 'command-post', x: 19, y: 0 },
      { side: 0, kind: 'outrider', x: 5, y: 0 }
    ]);
    expect(validateCommand(spotted, rs, { side: 0, unit: 2, order: { type: 'attack', target: 3 } })).toEqual({ ok: true });
  });

  it('artillery fires beyond its own sight only at targets a reporting unit spots', () => {
    const blind = worldOf(open(20, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'howitzer', x: 3, y: 0 },
      { side: 1, kind: 'rifles', x: 9, y: 0 },
      { side: 1, kind: 'command-post', x: 19, y: 0 }
    ]);
    expect(play(blind, 1).events.some((e) => e.t === 'launch' && e.id === 2)).toBe(false);
    const spotter = worldOf(open(20, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'howitzer', x: 3, y: 0 },
      { side: 1, kind: 'rifles', x: 9, y: 0 },
      { side: 1, kind: 'command-post', x: 19, y: 0 },
      { side: 0, kind: 'outrider', x: 5, y: 0 }
    ]);
    expect(play(spotter, 1).events.some((e) => e.t === 'launch' && e.id === 2)).toBe(true);
    // Without fog the same howitzer fires at once.
    const open20 = createWorld({ map: open(20, 1), sides: 2, seed: 1, entities: [
      { side: 0, kind: 'howitzer', x: 3, y: 0 },
      { side: 1, kind: 'rifles', x: 9, y: 0 }
    ] }, BASE_RULESET);
    expect(open20.intel).toBeUndefined();
    expect(resolveTurn(open20, BASE_RULESET, [[]]).events.some((e) => e.t === 'launch')).toBe(true);
  });

  it('a side is not told about enemy movements it cannot see', () => {
    const w = worldOf(open(20, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 1, kind: 'outrider', x: 15, y: 0 },
      { side: 1, kind: 'command-post', x: 19, y: 0 }
    ]);
    const { events, reported } = play(w, 1, [{ side: 1, unit: 2, order: { type: 'move', x: 12, y: 0 } }]);
    expect(events.some((e) => e.t === 'move' && e.id === 2)).toBe(true);
    expect(reported[0]!.some((e) => 'id' in e && e.id === 2)).toBe(false);
    expect(reported[1]!.some((e) => e.t === 'move' && e.id === 2)).toBe(true);
  });
});

describe('vision properties', () => {
  const asFog = (world: World): World => {
    const w: World = { ...world, ruleset: rs.id };
    delete w.intel;
    return w;
  };

  it('live reports are exactly the entities in observed cells; reported events are a subset of all events', () => {
    fc.assert(
      fc.property(arbScenario, ({ world, plans }) => {
        let w = asFog(world);
        for (const plan of plans) {
          const r = resolveTurn(w, rs, [plan]);
          w = r.world;
          for (let side = 0; side < w.sides; side++) {
            const observed = observedCells(w, rs, side);
            const live = (w.intel?.[side] ?? []).filter((x) => x.live).map((x) => x.id);
            const expected = w.entities.filter((e) => observed[cellOf(w.map, e.x, e.y)] === 1).map((e) => e.id);
            expect(live).toEqual(expected);
            // Every own unit is known to its side.
            for (const e of w.entities.filter((x) => x.side === side)) expect(report(w, side, e.id)).toBeDefined();
            for (const ev of r.reported?.[side] ?? []) expect(r.events).toContain(ev);
          }
          expect(isValidWorld(JSON.parse(JSON.stringify(w)), rs)).toBe(true);
        }
      }),
      { numRuns: 80 }
    );
  });

  it('rejects corrupted intel', () => {
    const w = play(
      worldOf(open(12, 1), [
        { side: 0, kind: 'command-post', x: 0, y: 0 },
        { side: 0, kind: 'rifles', x: 3, y: 0 },
        { side: 1, kind: 'rifles', x: 6, y: 0 },
        { side: 1, kind: 'command-post', x: 11, y: 0 }
      ]),
      1
    ).world;
    expect(isValidWorld(w, rs)).toBe(true);
    const corruptions: ((x: World) => void)[] = [
      (x) => void delete x.intel,
      (x) => void x.intel!.pop(),
      (x) => void (x.intel![0] = x.intel![0]!.filter((r) => r.id !== 2)), // own unit forgotten
      (x) => void (x.intel![0]![0]!.x = 5), // live report off the entity
      (x) => void (x.intel![0]![0]!.tick = x.tick + 1),
      (x) => void (x.intel![0]![0]!.kind = 'constructor'),
      (x) => void x.intel![0]!.reverse(),
      (x) => void (x.intel![0]![0]!.live = 'yes' as never),
      (x) => void x.intel![1]!.push({ id: 99, side: 0, kind: 'rifles', x: 1, y: 0, hp: 40, tick: 0, live: false })
    ];
    for (const corrupt of corruptions) {
      const copy = structuredClone(w);
      corrupt(copy);
      expect(isValidWorld(copy, rs)).toBe(false);
    }
    const noFog = structuredClone(w);
    expect(isValidWorld(noFog, BASE_RULESET)).toBe(false);
  });
});

describe('attack orders under fog', () => {
  it('a gun ordered to attack a target in range but out of sight closes in until it sees it, then fires', () => {
    // Field Gun: range 7, vision 3. The rifles at distance 6 are in range but nobody sees them.
    const w = worldOf(open(20, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'howitzer', x: 3, y: 0 },
      { side: 1, kind: 'rifles', x: 9, y: 0 },
      { side: 1, kind: 'command-post', x: 19, y: 0 }
    ]);
    unit(w, 2).order = { type: 'attack', target: 3 }; // written directly: given while it was spotted
    expect(report(w, 0, 3)).toBeUndefined();
    const r = play(w, 3);
    const launch = r.events.find((e) => e.t === 'launch' && e.id === 2);
    expect(launch).toBeDefined();
    const at = r.events.filter((e) => e.t === 'move' && e.id === 2 && e.tick < launch!.tick).at(-1);
    expect(at && 'x' in at ? 9 - at.x : 0).toBeLessThanOrEqual(3);
  });
});
