import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  BUMP_LIMIT,
  createWorld,
  DEFAULT_DOCTRINE,
  isValidWorld,
  resolveTurn,
  runTicks,
  STRATEGY_RULESET,
  type Command,
  type Doctrine,
  type Scenario,
  type World
} from '../src';
import { arbScenario, mapOf, open } from './helpers';

const rs = STRATEGY_RULESET;
const worldOf = (map: Scenario['map'], entities: Scenario['entities']): World => createWorld({ map, sides: 2, entities, seed: 1 }, rs);
const unit = (w: World, id: number) => w.entities.find((e) => e.id === id)!;
const doctrine = (d: Partial<Doctrine>): Doctrine => ({ ...DEFAULT_DOCTRINE, ...d });
const turns = (w: World, n: number, first: Command[] = []): { world: World; bumps: number } => {
  let world = w;
  let bumps = 0;
  for (let i = 0; i < n; i++) {
    const r = resolveTurn(world, rs, [i === 0 ? first : []]);
    bumps += r.events.filter((e) => e.t === 'bump').length;
    world = r.world;
  }
  return { world, bumps };
};

describe('review findings on PR #7', () => {
  it('B1: a set-up relay given a travelling order packs up; the world always stays valid', () => {
    const w = worldOf(open(12, 3), [
      { side: 0, kind: 'command-post', x: 0, y: 1 },
      { side: 0, kind: 'mast-truck', x: 2, y: 1 },
      { side: 0, kind: 'rifles', x: 3, y: 1 }
    ]);
    const deployed = turns(w, 1, [{ side: 0, unit: 2, order: { type: 'deploy' } }]).world;
    expect(unit(deployed, 2).deploy).toBe(rs.ticksPerTurn);
    for (const order of [
      { type: 'escort', target: 3 },
      { type: 'patrol', x: 2, y: 1, rx: 2, ry: 1 }
    ] as const) {
      const after = resolveTurn(deployed, rs, [[{ side: 0, unit: 2, order }]]).world;
      expect(unit(after, 2).deploy ?? 0).toBe(0);
      expect(isValidWorld(JSON.parse(JSON.stringify(after)), rs)).toBe(true);
    }
    // Regroup inside coverage is just "hold": the relay may stay set up, and the world is valid.
    const regrouped = resolveTurn(deployed, rs, [[{ side: 0, unit: 2, order: { type: 'regroup' } }]]).world;
    expect(unit(regrouped, 2)).toMatchObject({ order: { type: 'hold' }, deploy: rs.ticksPerTurn });
    expect(isValidWorld(JSON.parse(JSON.stringify(regrouped)), rs)).toBe(true);
  });

  it('B2: move + seek cover ends in cover and stays there (no oscillation)', () => {
    const w = worldOf(mapOf('.....', '....f', '.....'), [{ side: 0, kind: 'rifles', x: 0, y: 1 }]);
    unit(w, 1).doctrine = doctrine({ seekCover: true });
    unit(w, 1).order = { type: 'move', x: 3, y: 1 };
    const { world } = turns(w, 10);
    expect([unit(world, 1).x, unit(world, 1).y]).toEqual([4, 1]);
    expect(unit(world, 1).order).toEqual({ type: 'hold' });
    const later = turns(world, 3).world;
    expect([unit(later, 1).x, unit(later, 1).y]).toEqual([4, 1]);
  });

  it('B2: a set-up relay with seek cover stays where it was set up', () => {
    const w = worldOf(mapOf('.....', '..f..', '.....'), [{ side: 0, kind: 'command-post', x: 0, y: 1 }, { side: 0, kind: 'mast-truck', x: 1, y: 1 }]);
    Object.assign(unit(w, 2), { doctrine: doctrine({ seekCover: true }), order: { type: 'deploy' }, deploy: rs.ticksPerTurn });
    const { world } = turns(w, 3);
    expect([unit(world, 2).x, unit(world, 2).deploy]).toEqual([1, rs.ticksPerTurn]);
  });

  it('B3: a fresh order to a damaged unit with a retreat doctrine is followed', () => {
    const w = worldOf(open(14, 1), [{ side: 0, kind: 'command-post', x: 0, y: 0 }, { side: 0, kind: 'rifles', x: 3, y: 0 }]);
    Object.assign(unit(w, 2), { hp: 10, doctrine: doctrine({ retreatBelow: 75 }) });
    const after = resolveTurn(w, rs, [[{ side: 0, unit: 2, order: { type: 'move', x: 5, y: 0 } }]]).world;
    // It arrives (then holds) instead of the doctrine swallowing the order.
    expect(unit(after, 2).x).toBe(5);
    expect(unit(after, 2).order).toEqual({ type: 'hold' });
  });

  it('B3: retreat triggers when a hit takes the unit below the threshold', () => {
    const w = worldOf(open(14, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'rifles', x: 8, y: 0 },
      { side: 1, kind: 'warden', x: 11, y: 0 }
    ]);
    Object.assign(unit(w, 2), { hp: 21, doctrine: doctrine({ retreatBelow: 50 }), order: { type: 'hold' } });
    const after = runTicks(w, rs, [], 3).world;
    expect(unit(after, 2).hp).toBeLessThan(20);
    expect(['regroup', 'hold']).toContain(unit(after, 2).order.type);
    expect(unit(after, 2).x).toBeLessThan(8);
  });

  it('B4: regroup reaches a free covered cell around blockers, or gives up to hold', () => {
    for (const h of [1, 5]) {
      const rows = Array.from({ length: h }, () => '.'.repeat(16));
      const y = Math.floor(h / 2);
      const w = worldOf(mapOf(...rows), [
        { side: 0, kind: 'command-post', x: 0, y },
        { side: 0, kind: 'rifles', x: 5, y },
        { side: 0, kind: 'outrider', x: 9, y }
      ]);
      unit(w, 3).order = { type: 'regroup' };
      const { world } = turns(w, 10);
      const o = unit(world, 3);
      expect(o.order).toEqual({ type: 'hold' });
      if (h > 1) expect(o.x ** 2 + (o.y - y) ** 2).toBeLessThanOrEqual(25);
    }
  });

  it('B5: a patrol whose end is occupied turns around next to it', () => {
    const w = worldOf(open(8, 1), [{ side: 0, kind: 'outrider', x: 0, y: 0 }, { side: 0, kind: 'rifles', x: 6, y: 0 }]);
    unit(w, 1).order = { type: 'patrol', x: 6, y: 0, rx: 0, ry: 0 };
    const visited = new Set<number>();
    let world = w;
    let bumps = 0;
    for (let i = 0; i < 8; i++) {
      const r = resolveTurn(world, rs, [[]]);
      bumps += r.events.filter((e) => e.t === 'bump').length;
      for (const e of r.events) if (e.t === 'move' && e.id === 1) visited.add(e.x);
      world = r.world;
    }
    expect(visited.has(5)).toBe(true);
    expect(visited.has(6)).toBe(false);
    expect(visited.has(0)).toBe(true);
    expect(bumps).toBe(0);
    expect(unit(world, 1).order.type).toBe('patrol');
  });

  it('an escort whose charge cannot be reached falls back to hold', () => {
    const w = worldOf(mapOf('..~..'), [{ side: 0, kind: 'rifles', x: 0, y: 0 }, { side: 0, kind: 'kite', x: 4, y: 0 }]);
    const { world } = turns(w, 1, [{ side: 0, unit: 1, order: { type: 'escort', target: 2 } }]);
    expect(unit(world, 1).order).toEqual({ type: 'hold' });
  });

  it('hitAt may not lie in the future', () => {
    const w = worldOf(open(3, 1), [{ side: 0, kind: 'rifles', x: 0, y: 0 }]);
    unit(w, 1).hitAt = 1e12;
    expect(isValidWorld(w, rs)).toBe(false);
  });
});

describe('termination and validity invariants (strategy ruleset)', () => {
  /** Random scenarios where every relay truck starts set up, so packing up is exercised too. */
  const withDeployed = arbScenario.map(({ world, plans }) => {
    const w: World = { ...world, ruleset: rs.id };
    for (const e of w.entities) if (e.kind === 'mast-truck' || e.kind === 'field-post') Object.assign(e, { order: { type: 'deploy' }, deploy: rs.ticksPerTurn });
    return { world: w, plans };
  });

  it('every turn yields a world the validator accepts (also after JSON round-trip)', () => {
    fc.assert(
      fc.property(withDeployed, ({ world, plans }) => {
        let w = world;
        for (const plan of [...plans, [], []]) {
          w = resolveTurn(w, rs, [plan]).world;
          expect(isValidWorld(JSON.parse(JSON.stringify(w)), rs)).toBe(true);
        }
      }),
      { numRuns: 150 }
    );
  });

  it(`no unit bumps more than ${'BUMP_LIMIT'} ticks in a row: blocked orders give up instead of hanging`, () => {
    fc.assert(
      fc.property(withDeployed, ({ world, plans }) => {
        let w = world;
        const streak = new Map<number, number>();
        for (const plan of [...plans, [], [], [], []]) {
          const r = resolveTurn(w, rs, [plan]);
          for (let t = w.tick + 1; t <= r.world.tick; t++) {
            const bumped = new Set(r.events.flatMap((e) => (e.tick === t && e.t === 'bump' ? [e.id] : [])));
            for (const e of r.world.entities) streak.set(e.id, bumped.has(e.id) ? (streak.get(e.id) ?? 0) + 1 : 0);
            for (const id of bumped) expect(streak.get(id) ?? 0).toBeLessThanOrEqual(BUMP_LIMIT);
          }
          w = r.world;
        }
      }),
      { numRuns: 150 }
    );
  });
});
