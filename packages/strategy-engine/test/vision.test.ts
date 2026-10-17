import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  BASE_RULESET,
  cellOf,
  createWorld,
  dist2,
  isValidWorld,
  muzzleFlashes,
  observedCells,
  resolveTurn,
  revealedEmitters,
  updateIntel,
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
const ended = (events: readonly SimEvent[], id: number) => events.flatMap((e) => (e.t === 'order-ended' && e.id === id ? [e.reason] : []));
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
          const before = w;
          const r = resolveTurn(w, rs, [plan]);
          w = r.world;
          for (let side = 0; side < w.sides; side++) {
            const observed = observedCells(w, rs, side);
            const live = (w.intel?.[side] ?? []).filter((x) => x.live).map((x) => x.id);
            const revealed = revealedEmitters(w, rs, side);
            const expected = w.entities.filter((e) => observed[cellOf(w.map, e.x, e.y)] === 1 || revealed.has(e.id)).map((e) => e.id);
            expect(live).toEqual(expected);
            // Every own unit is known to its side.
            for (const e of w.entities.filter((x) => x.side === side)) expect(report(w, side, e.id)).toBeDefined();
            // By content: another side's copy of a sale carries no refund (the seller's Supply is its own business).
            const truth = r.events.map((ev) => (ev.t === 'sold' && ev.side !== side ? JSON.stringify({ ...ev, refund: undefined }) : JSON.stringify(ev)));
            // `missing` exists in reports only (an own unit found lost long after it died unseen).
            for (const ev of r.reported?.[side] ?? []) if (ev.t !== 'missing') expect(truth).toContain(JSON.stringify(ev));
            // A `missing` names an own unit that no longer exists and that the side no longer reports.
            for (const ev of r.reported?.[side] ?? []) {
              if (ev.t !== 'missing') continue;
              expect(ev.side).toBe(side);
              // Reported before the turn (or new during it: a unit produced and lost within one turn).
              expect((before.intel?.[side]?.some((rep) => rep.id === ev.id) ?? false) || ev.id >= before.nextId).toBe(true);
              expect(r.world.entities.some((e) => e.id === ev.id)).toBe(false);
              expect(r.world.intel?.[side]?.some((rep) => rep.id === ev.id)).toBe(false);
            }
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
  /** A Field Gun with a scout that spots the target, a relay mast keeping the scout in contact. */
  const gunScene = (target: { x: number; y: number }) =>
    worldOf(open(15, 9), [
      { side: 0, kind: 'command-post', x: 0, y: 4 },
      { side: 0, kind: 'howitzer', x: 2, y: 4 },
      { side: 0, kind: 'relay-mast', x: 5, y: 4 },
      { side: 0, kind: 'outrider', x: 8, y: 6 },
      { side: 1, kind: 'rifles', x: target.x, y: target.y },
      { side: 1, kind: 'command-post', x: 14, y: 0 }
    ]);
  const gunOrders = (to: { x: number; y: number }): Command[] => [
    { side: 0, unit: 2, order: { type: 'attack', target: 5 } },
    // The scout leaves at once: the gun has to find the target with its own eyes (vision 3).
    { side: 0, unit: 4, order: { type: 'move', x: to.x, y: to.y } }
  ];

  for (const target of [{ x: 10, y: 7 }, { x: 10, y: 4 }, { x: 11, y: 8 }]) {
    it(`a Field Gun whose spotter leaves finds a firing position and fires (target at ${target.x},${target.y})`, () => {
      const w = gunScene(target);
      expect(report(w, 0, 5)?.live).toBe(true);
      const r = play(w, 5, gunOrders({ x: 1, y: 0 }));
      const gun = unit(r.world, 2);
      const launches = r.events.filter((e) => e.t === 'launch' && e.id === 2);
      expect(launches.length).toBeGreaterThan(0);
      expect(dist2(gun.x, gun.y, target.x, target.y)).toBeGreaterThanOrEqual(9);
      // Never stuck without firing: either still attacking a live target, or it is destroyed.
      expect(r.world.entities.some((e) => e.id === 5) ? gun.order : { type: 'attack', target: 5 }).toEqual({ type: 'attack', target: 5 });
    });
  }

  it('an attacker seeks a target that left sight at its last reported cell, not at its true position', () => {
    const w = worldOf(open(30, 9), [
      { side: 0, kind: 'command-post', x: 0, y: 4 },
      { side: 0, kind: 'rifles', x: 3, y: 4 },
      { side: 1, kind: 'mast-truck', x: 7, y: 4 },
      { side: 1, kind: 'command-post', x: 29, y: 8 }
    ]);
    expect(report(w, 0, 3)?.live).toBe(true);
    unit(w, 3).order = { type: 'move', x: 27, y: 0 }; // the truck drives off, out of sight
    const r = play(w, 4, [{ side: 0, unit: 2, order: { type: 'attack', target: 3 } }]);
    const ghost = report(r.world, 0, 3);
    expect(ghost === undefined || !ghost.live).toBe(true);
    // The rifles ended the order once they looked at the last reported cell and found it empty …
    expect(ended(r.events, 2)).toEqual(['lost-target']);
    // … and never followed the truck's true route (north-east, towards x = 27).
    const xs = r.events.flatMap((e) => (e.t === 'move' && e.id === 2 ? [e.x] : []));
    expect(Math.max(...xs)).toBeLessThanOrEqual(10);
  });

  it('without any report an attack order ends at once (lost-target), it does not track the true position', () => {
    const w = worldOf(open(20, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'howitzer', x: 3, y: 0 },
      { side: 1, kind: 'rifles', x: 9, y: 0 },
      { side: 1, kind: 'command-post', x: 19, y: 0 }
    ]);
    unit(w, 2).order = { type: 'attack', target: 3 }; // a save could hold this; no report exists
    expect(report(w, 0, 3)).toBeUndefined();
    const r = play(w, 1);
    expect(ended(r.events, 2)).toEqual(['lost-target']);
    expect(r.events.some((e) => e.t === 'move' && e.id === 2)).toBe(false);
  });
});

describe('what a side learns (review of PR #8)', () => {
  it('a side always learns of losing its own Command Post, even with nobody left to see it', () => {
    const w = worldOf(open(10, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 1, kind: 'warden', x: 2, y: 0 },
      { side: 1, kind: 'command-post', x: 9, y: 0 }
    ]);
    unit(w, 1).hp = 1;
    const r = play(w, 1);
    expect(r.world.entities.some((e) => e.id === 1)).toBe(false);
    expect(r.reported[0]!.some((e) => e.t === 'destroyed' && e.id === 1)).toBe(true);
    expect(report(r.world, 0, 1)).toBeUndefined();
  });

  it('shots from unseen shooters are not reported (their ids would reveal them); the hits are', () => {
    const w = worldOf(open(20, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'rifles', x: 3, y: 0 },
      { side: 1, kind: 'howitzer', x: 9, y: 0 },
      { side: 1, kind: 'outrider', x: 7, y: 0 }, // in side 1's coverage, spots the rifles
      { side: 1, kind: 'command-post', x: 12, y: 0 }
    ]);
    expect(report(w, 0, 3)).toBeUndefined();
    const r = play(w, 1);
    expect(r.events.some((e) => e.t === 'launch' && e.id === 3)).toBe(true);
    expect(r.reported[0]!.some((e) => (e.t === 'launch' || e.t === 'fire') && e.id === 3)).toBe(false);
    expect(r.reported[0]!.some((e) => e.t === 'hit' && e.id === 2)).toBe(true);
  });

  it('an attack command on an id the side does not see is always not-visible (no hint whether it still exists)', () => {
    const w = worldOf(open(20, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'rifles', x: 3, y: 0 },
      { side: 1, kind: 'rifles', x: 15, y: 0 },
      { side: 1, kind: 'command-post', x: 19, y: 0 }
    ]);
    const v = (target: number) => validateCommand(w, rs, { side: 0, unit: 2, order: { type: 'attack', target } });
    expect(v(3)).toEqual({ ok: false, reason: 'not-visible' });
    expect(v(99)).toEqual({ ok: false, reason: 'not-visible' });
    expect(v(1)).toEqual({ ok: false, reason: 'bad-target' }); // own unit
  });
});

describe('ghost of an enemy that died unseen (review of PR #8, N8)', () => {
  it('disappears as soon as its last reported cell is observed, like one that drove away', () => {
    const w = worldOf(open(20, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 1, kind: 'rifles', x: 15, y: 0 },
      { side: 1, kind: 'command-post', x: 19, y: 0 }
    ]);
    // Side 0 remembers the rifles at (3, 0), a cell its post observes now.
    w.intel![0] = [...w.intel![0]!, { id: 2, side: 1, kind: 'rifles', x: 3, y: 0, hp: 40, tick: 0, live: false }].sort((a, b) => a.id - b.id);
    const died = structuredClone(w);
    const dead = died.entities.find((e) => e.id === 2)!;
    died.entities = died.entities.filter((e) => e.id !== 2);
    updateIntel(died, rs, [dead]);
    expect(report(died, 0, 2)).toBeUndefined();
    const alive = structuredClone(w);
    updateIntel(alive, rs, []);
    expect(report(alive, 0, 2)).toBeUndefined();
  });
});

describe('own units lost out of contact (owner report after PR #14)', () => {
  it('a unit destroyed unseen stays a ghost until its last cell is observed again; then it is reported missing and dropped', () => {
    // Own post far left; own squad out of coverage at (9,1), next to an enemy squad that kills it.
    const w = worldOf(open(12, 3), [
      { side: 0, kind: 'command-post', x: 0, y: 1 },
      { side: 1, kind: 'command-post', x: 11, y: 2 },
      { side: 0, kind: 'rifles', x: 9, y: 1 },
      { side: 1, kind: 'lancer', x: 10, y: 1 }
    ]);
    unit(w, 3).hp = 1;
    const first = play(w, 2);
    expect(first.world.entities.some((e) => e.id === 3)).toBe(false); // destroyed
    expect(report(first.world, 0, 3)).toBeDefined(); // unseen: still a ghost
    expect(first.reported[0]!.some((e) => e.t === 'missing')).toBe(false);
    // A Radio Mast brings the cell into sight: the ghost goes, and the loss is told once.
    const later = structuredClone(first.world);
    later.entities.push({ ...structuredClone(later.entities[0]!), id: later.nextId++, kind: 'relay-mast', x: 5, y: 1, hp: rs.archetypes['relay-mast']!.hp });
    later.entities.sort((a, b) => a.id - b.id);
    const second = play(later, 1);
    expect(report(second.world, 0, 3)).toBeUndefined();
    expect(second.reported[0]!.filter((e) => e.t === 'missing')).toEqual([expect.objectContaining({ t: 'missing', id: 3, side: 0, kind: 'rifles', x: 9, y: 1 })]);
    expect(second.reported[1]!.some((e) => e.t === 'missing')).toBe(false);
  });

  it('a unit killed unseen elsewhere while its last reported cell is in sight is told missing, never vanishing silently', () => {
    const w = worldOf(open(12, 3), [
      { side: 0, kind: 'command-post', x: 0, y: 1 },
      { side: 1, kind: 'command-post', x: 11, y: 2 },
      { side: 0, kind: 'rifles', x: 9, y: 1 },
      { side: 1, kind: 'lancer', x: 10, y: 1 }
    ]);
    unit(w, 3).hp = 1;
    // The side last heard of the squad at (3,1), a cell its post sees.
    w.intel = w.intel!.map((list, side) => (side === 0 ? list.map((r) => (r.id === 3 ? { ...r, x: 3, y: 1, live: false } : r)) : list));
    const r = play(w, 2);
    expect(r.world.entities.some((e) => e.id === 3)).toBe(false);
    expect(report(r.world, 0, 3)).toBeUndefined();
    expect(r.reported[0]!.filter((e) => e.t === 'missing' || (e.t === 'destroyed' && e.id === 3))).toEqual([expect.objectContaining({ t: 'missing', id: 3 })]);
  });

  it('a unit alive out of contact keeps its ghost (the side cannot know where it went)', () => {
    const w = worldOf(open(12, 3), [
      { side: 0, kind: 'command-post', x: 0, y: 1 },
      { side: 1, kind: 'command-post', x: 11, y: 2 },
      { side: 0, kind: 'rifles', x: 9, y: 1 }
    ]);
    const r = play(w, 1);
    expect(report(r.world, 0, 3)).toBeDefined();
  });
});

describe('muzzle flash (owner decision 2026-10-17)', () => {
  /**
   * Side 0 holds x ≤ 5 (post at 0, a Rifle Squad at 4 seeing x ≤ 8). Side 1's post at 13 covers its
   * Scout Car at 9 (which sees the squad) and an Artillery Gun at 11: 7 cells from the squad, inside
   * its range, outside everything side 0 sees.
   */
  const field = () =>
    worldOf(open(20, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'rifles', x: 4, y: 0 },
      { side: 1, kind: 'outrider', x: 9, y: 0 },
      { side: 1, kind: 'howitzer', x: 11, y: 0 },
      { side: 1, kind: 'command-post', x: 13, y: 0 }
    ]);

  it('a gun out of sight that shells a unit in coverage is placed where it fired from, as a last-known position', () => {
    const w = field();
    const gun = w.entities.find((e) => e.kind === 'howitzer')!;
    expect(observedCells(w, rs, 0)[cellOf(w.map, gun.x, gun.y)]).toBe(0);
    expect(report(w, 0, gun.id)).toBeUndefined();
    const { world, events } = play(w, 2);
    expect(events.some((e) => e.t === 'launch' && e.id === gun.id && e.x === 4)).toBe(true);
    expect(report(world, 0, gun.id)).toMatchObject({ kind: 'howitzer', side: 1, x: 11, live: false });
    // The gun's own side learns nothing new from it; the scout that spotted for it stays unknown to side 0.
    expect(report(world, 0, w.entities.find((e) => e.kind === 'outrider')!.id)).toBeUndefined();
    // The report is a position, not a sighting: the gun is not observed.
    expect(observedCells(world, rs, 0)[cellOf(world.map, 11, 0)]).toBe(0);
  });

  it('a unit out of contact tells nothing: no radio, no report of who fires at it (D7)', () => {
    const w = field();
    // The post covers x ≤ 5: the squad at 6 is out of contact; the gun at 12 still reaches it.
    w.entities.find((e) => e.kind === 'rifles')!.x = 6;
    const gun = w.entities.find((e) => e.kind === 'howitzer')!;
    gun.x = 12;
    const { world, events } = play({ ...w, intel: undefined }, 2);
    expect(events.some((e) => e.t === 'launch' && e.id === gun.id)).toBe(true);
    expect(report(world, 0, gun.id)).toBeUndefined();
  });

  it('the shooter is named only to the side it fired at, and only for shots at its units', () => {
    const w = field();
    const gun = w.entities.find((e) => e.kind === 'howitzer')!;
    const at = (side: number, events: SimEvent[]) => muzzleFlashes(w, rs, side, [], events);
    expect([...at(0, [{ t: 'launch', tick: 1, id: gun.id, x: 4, y: 0 }])]).toEqual([gun.id]);
    expect([...at(0, [{ t: 'launch', tick: 1, id: gun.id, x: 3, y: 0 }])]).toEqual([]); // an empty cell
    expect([...at(1, [{ t: 'launch', tick: 1, id: gun.id, x: 4, y: 0 }])]).toEqual([]); // its own side
    const squad = w.entities.find((e) => e.kind === 'rifles')!;
    const scout = w.entities.find((e) => e.kind === 'outrider')!;
    expect([...at(0, [{ t: 'fire', tick: 1, id: scout.id, target: squad.id }])]).toEqual([scout.id]);
    expect([...at(1, [{ t: 'fire', tick: 1, id: squad.id, target: scout.id }])]).toEqual([squad.id]);
    expect([...at(0, [{ t: 'fire', tick: 1, id: squad.id, target: scout.id }])]).toEqual([]);
    expect([...at(0, [{ t: 'hit', tick: 1, id: squad.id, side: 0, damage: 5 }])]).toEqual([]);
    expect([...muzzleFlashes(w, rs, 0, [], undefined)]).toEqual([]);
  });
});
