import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  BASE_RULESET,
  createWorld,
  DEADLOCK_TICKS,
  DEFAULT_DOCTRINE,
  findPath,
  isValidWorld,
  resolveTurn,
  runTicks,
  STALL_TICKS,
  STRATEGY_RULESET,
  UNREACHABLE_TICKS,
  type Command,
  type Doctrine,
  type Order,
  type Scenario,
  type SimEvent,
  type World
} from '../src';
import { mapOf, open } from './helpers';

const rs = STRATEGY_RULESET;
const worldOf = (map: Scenario['map'], entities: Scenario['entities']): World => createWorld({ map, sides: 2, entities, seed: 1 }, rs);
const unit = (w: World, id: number) => w.entities.find((e) => e.id === id)!;
const doctrine = (d: Partial<Doctrine>): Doctrine => ({ ...DEFAULT_DOCTRINE, ...d });
const ended = (events: readonly SimEvent[], id?: number) =>
  events.flatMap((e) => (e.t === 'order-ended' && (id === undefined || e.id === id) ? [e.reason] : []));

/** Runs whole turns; the first turn carries `first`. Returns the world and all events. */
function play(w: World, n: number, first: Command[] = []): { world: World; events: SimEvent[] } {
  let world = w;
  const events: SimEvent[] = [];
  for (let i = 0; i < n; i++) {
    const r = resolveTurn(world, rs, [i === 0 ? first : []]);
    events.push(...r.events);
    world = r.world;
  }
  return { world, events };
}

describe('review findings on PR #7 (first round)', () => {
  it('B1: a set-up relay given a travelling order packs up; the world always stays valid', () => {
    const w = worldOf(open(12, 3), [
      { side: 0, kind: 'command-post', x: 0, y: 1 },
      { side: 0, kind: 'mast-truck', x: 2, y: 1 },
      { side: 0, kind: 'rifles', x: 3, y: 1 }
    ]);
    const deployed = play(w, 1, [{ side: 0, unit: 2, order: { type: 'deploy' } }]).world;
    for (const order of [
      { type: 'escort', target: 3 },
      { type: 'patrol', x: 2, y: 1, rx: 2, ry: 1 }
    ] as const) {
      const after = resolveTurn(deployed, rs, [[{ side: 0, unit: 2, order }]]).world;
      expect(unit(after, 2).deploy ?? 0).toBe(0);
      expect(isValidWorld(JSON.parse(JSON.stringify(after)), rs)).toBe(true);
    }
    const regrouped = resolveTurn(deployed, rs, [[{ side: 0, unit: 2, order: { type: 'regroup' } }]]);
    expect(unit(regrouped.world, 2)).toMatchObject({ order: { type: 'hold' }, deploy: rs.ticksPerTurn });
    expect(ended(regrouped.events, 2)).toEqual(['regrouped']);
  });

  it('B2: move + seek cover ends in cover and stays there', () => {
    const w = worldOf(mapOf('.....', '....f', '.....'), [{ side: 0, kind: 'rifles', x: 0, y: 1 }]);
    Object.assign(unit(w, 1), { doctrine: doctrine({ seekCover: true }), order: { type: 'move', x: 3, y: 1 } });
    const { world, events } = play(w, 10);
    expect([unit(world, 1).x, unit(world, 1).y]).toEqual([4, 1]);
    expect(ended(events, 1)).toEqual(['arrived']);
  });

  it('B2: a set-up relay with seek cover stays where it was set up', () => {
    const w = worldOf(mapOf('.....', '..f..', '.....'), [{ side: 0, kind: 'command-post', x: 0, y: 1 }, { side: 0, kind: 'mast-truck', x: 1, y: 1 }]);
    Object.assign(unit(w, 2), { doctrine: doctrine({ seekCover: true }), order: { type: 'deploy' }, deploy: rs.ticksPerTurn });
    expect(unit(play(w, 3).world, 2)).toMatchObject({ x: 1, deploy: rs.ticksPerTurn });
  });

  it('B3: a fresh order to a damaged unit with a retreat doctrine is followed', () => {
    const w = worldOf(open(14, 1), [{ side: 0, kind: 'command-post', x: 0, y: 0 }, { side: 0, kind: 'rifles', x: 3, y: 0 }]);
    Object.assign(unit(w, 2), { hp: 10, doctrine: doctrine({ retreatBelow: 75 }) });
    const { world, events } = play(w, 1, [{ side: 0, unit: 2, order: { type: 'move', x: 5, y: 0 } }]);
    expect(unit(world, 2).x).toBe(5);
    expect(ended(events, 2)).toEqual(['arrived']);
  });

  it('B3: a hit that takes the unit below the threshold sends it back, with an event', () => {
    const w = worldOf(open(14, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'rifles', x: 8, y: 0 },
      { side: 1, kind: 'warden', x: 11, y: 0 }
    ]);
    Object.assign(unit(w, 2), { hp: 21, doctrine: doctrine({ retreatBelow: 50 }), order: { type: 'hold' } });
    const r = runTicks(w, rs, [], 3);
    expect(ended(r.events, 2)).toContain('retreat');
    expect(unit(r.world, 2).x).toBeLessThan(8);
  });

  it('B4: regroup reaches a free covered cell around blockers; in a dead end it ends as unreachable', () => {
    const wide = worldOf(mapOf(...Array.from({ length: 5 }, () => '.'.repeat(16))), [
      { side: 0, kind: 'command-post', x: 0, y: 2 },
      { side: 0, kind: 'rifles', x: 5, y: 2 },
      { side: 0, kind: 'outrider', x: 9, y: 2 }
    ]);
    unit(wide, 3).order = { type: 'regroup' };
    const a = play(wide, 4);
    expect(unit(a.world, 3).x ** 2 + (unit(a.world, 3).y - 2) ** 2).toBeLessThanOrEqual(25);
    expect(ended(a.events, 3)).toEqual(['regrouped']);
    const corridor = worldOf(open(16, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'rifles', x: 5, y: 0 },
      { side: 0, kind: 'outrider', x: 9, y: 0 }
    ]);
    unit(corridor, 3).order = { type: 'regroup' };
    const b = play(corridor, 4);
    expect(ended(b.events, 3)).toEqual(['unreachable']);
    expect(b.events.filter((e) => e.t === 'bump' && e.id === 3).length).toBeLessThanOrEqual(UNREACHABLE_TICKS);
  });

  it('B5: a patrol whose end is held turns around next to it, without bumping', () => {
    const w = worldOf(open(8, 1), [{ side: 0, kind: 'outrider', x: 0, y: 0 }, { side: 0, kind: 'rifles', x: 6, y: 0 }]);
    unit(w, 1).order = { type: 'patrol', x: 6, y: 0, rx: 0, ry: 0 };
    const { world, events } = play(w, 8);
    const visited = new Set(events.flatMap((e) => (e.t === 'move' && e.id === 1 ? [e.x] : [])));
    expect([visited.has(5), visited.has(6), visited.has(0)]).toEqual([true, false, true]);
    expect(events.filter((e) => e.t === 'bump')).toEqual([]);
    expect(unit(world, 1).order.type).toBe('patrol');
  });

  it('an escort whose charge cannot be reached ends as unreachable after a turn, with an event', () => {
    const w = worldOf(mapOf('...~..'), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'rifles', x: 1, y: 0 },
      { side: 0, kind: 'kite', x: 5, y: 0 }
    ]);
    const { world, events } = play(w, 2, [{ side: 0, unit: 2, order: { type: 'escort', target: 3 } }]);
    expect(unit(world, 2).order).toEqual({ type: 'hold' });
    expect(ended(events, 2)).toEqual(['unreachable']);
  });

  it('hitAt may not lie in the future', () => {
    const w = worldOf(open(3, 1), [{ side: 0, kind: 'rifles', x: 0, y: 0 }]);
    unit(w, 1).hitAt = 1e12;
    expect(isValidWorld(w, rs)).toBe(false);
  });
});

describe('review findings on PR #7 (second round): temporary blockers never end orders', () => {
  it('a column behind an escort keeps its orders and keeps moving', () => {
    const w = worldOf(open(26, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'mast-truck', x: 3, y: 0 },
      { side: 0, kind: 'rifles', x: 2, y: 0 },
      { side: 0, kind: 'outrider', x: 1, y: 0 }
    ]);
    const { world, events } = play(w, 8, [
      { side: 0, unit: 2, order: { type: 'move', x: 23, y: 0 } },
      { side: 0, unit: 3, order: { type: 'escort', target: 2 } },
      { side: 0, unit: 4, order: { type: 'move', x: 20, y: 0 } }
    ]);
    expect(ended(events, 4)).toEqual(['arrived']);
    expect(unit(world, 4).x).toBe(20);
  });

  it('an attack order behind an escort is kept', () => {
    const w = worldOf(open(20, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'mast-truck', x: 4, y: 0 },
      { side: 0, kind: 'rifles', x: 3, y: 0 },
      { side: 0, kind: 'lancer', x: 1, y: 0 },
      { side: 1, kind: 'command-post', x: 19, y: 0 }
    ]);
    // The far post is not spotted (fog), so the standing order is written directly: a unit keeps
    // chasing a target it was ordered to attack while it was visible.
    unit(w, 4).order = { type: 'attack', target: 5 };
    const r = play(w, 2, [
      { side: 0, unit: 2, order: { type: 'move', x: 14, y: 0 } },
      { side: 0, unit: 3, order: { type: 'escort', target: 2 } }
    ]);
    expect(ended(r.events, 4)).toEqual([]);
    expect(unit(r.world, 4).order).toEqual({ type: 'attack', target: 5 });
  });

  it('a follower behind a briefly disabled unit keeps its order and arrives', () => {
    const w = worldOf(open(16, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'rifles', x: 3, y: 0 },
      { side: 0, kind: 'outrider', x: 2, y: 0 }
    ]);
    Object.assign(unit(w, 2), { order: { type: 'move', x: 15, y: 0 }, status: [{ kind: 'disabled', ticks: 3 }] });
    const { world, events } = play(w, 6, [{ side: 0, unit: 3, order: { type: 'move', x: 14, y: 0 } }]);
    expect(ended(events, 3)).toEqual(['arrived']);
    expect(unit(world, 3).x).toBe(14);
  });

  it('a follower behind a slow, slowed unit in a swamp keeps its order', () => {
    const w = worldOf(mapOf('.ssssssssssssssssss.'), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'rifles', x: 2, y: 0 },
      { side: 0, kind: 'outrider', x: 1, y: 0 }
    ]);
    Object.assign(unit(w, 2), { order: { type: 'move', x: 19, y: 0 }, status: [{ kind: 'slowed', ticks: 60 }] });
    const { world, events } = play(w, 10, [{ side: 0, unit: 3, order: { type: 'move', x: 18, y: 0 } }]);
    expect(ended(events, 3)).toEqual([]);
    expect(unit(world, 3).order).toEqual({ type: 'move', x: 18, y: 0 });
    expect(unit(world, 3).x).toBeGreaterThan(2);
  });

  it('oncoming traffic in a two-lane corridor passes on the free lane', () => {
    const w = worldOf(open(16, 2), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'command-post', x: 15, y: 1 },
      { side: 0, kind: 'outrider', x: 2, y: 0 },
      { side: 0, kind: 'outrider', x: 13, y: 0 }
    ]);
    const { world, events } = play(w, 6, [
      { side: 0, unit: 3, order: { type: 'move', x: 13, y: 0 } },
      { side: 0, unit: 4, order: { type: 'move', x: 2, y: 0 } }
    ]);
    expect(ended(events)).toEqual(['arrived', 'arrived']);
    expect([unit(world, 3).x, unit(world, 4).x]).toEqual([13, 2]);
  });

  it('a column does not stop early when the unit on its destination drives on', () => {
    const w = worldOf(open(20, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'rifles', x: 4, y: 0 },
      { side: 0, kind: 'rifles', x: 3, y: 0 }
    ]);
    unit(w, 2).order = { type: 'move', x: 12, y: 0 };
    const { world, events } = play(w, 6, [{ side: 0, unit: 3, order: { type: 'move', x: 8, y: 0 } }]);
    expect(ended(events, 3)).toEqual(['arrived']);
    expect(unit(world, 3).x).toBe(8);
  });

  it('a destination held by a unit that stays ends the move next to it, with an event', () => {
    const w = worldOf(open(10, 1), [{ side: 0, kind: 'command-post', x: 0, y: 0 }, { side: 0, kind: 'rifles', x: 6, y: 0 }, { side: 0, kind: 'outrider', x: 1, y: 0 }]);
    const { world, events } = play(w, 3, [{ side: 0, unit: 3, order: { type: 'move', x: 6, y: 0 } }]);
    expect(ended(events, 3)).toEqual(['occupied']);
    expect(unit(world, 3).x).toBe(5);
  });
});

/* ---------- Generated battles: corridors, crowds and open ground, with units in coverage ---------- */

const MAPS = [
  { w: 14, h: 1 },
  { w: 14, h: 2 },
  { w: 10, h: 6 },
  { w: 8, h: 8 }
];
const MOBILE = ['rifles', 'lancer', 'outrider', 'warden', 'howitzer', 'mast-truck', 'kite', 'jammer', 'tracer'];

const arbOrder = (w: number, h: number) =>
  fc.oneof(
    fc.record({ type: fc.constant('move' as const), x: fc.nat(w - 1), y: fc.nat(h - 1) }),
    fc.record({ type: fc.constant('patrol' as const), x: fc.nat(w - 1), y: fc.nat(h - 1), rx: fc.nat(w - 1), ry: fc.nat(h - 1) }),
    fc.record({ type: fc.constant('escort' as const), target: fc.integer({ min: 1, max: 14 }) }),
    fc.record({ type: fc.constant('attack' as const), target: fc.integer({ min: 1, max: 14 }) }),
    fc.constant({ type: 'regroup' as const }),
    fc.constant({ type: 'hold' as const }),
    fc.constant({ type: 'deploy' as const })
  );

/**
 * Two posts at opposite ends, up to six mobile units per side placed near their own post (so in
 * coverage), some standing orders written straight into the world (as if given earlier, now
 * possibly out of contact), and commands for several turns.
 */
const arbDoctrine: fc.Arbitrary<Doctrine> = fc.record({
  retreatBelow: fc.constantFrom(0, 25, 50, 75),
  priority: fc.constantFrom('weakest', 'nearest', 'armor', 'infantry', 'structures', 'emitters'),
  seekCover: fc.boolean(),
  holdFire: fc.boolean()
});

/**
 * An order with all its parameters; a patrol is the same order whichever leg it is on (turning
 * at an end is part of patrolling, not a change).
 */
const orderKey = (o: Order): string => {
  if (o.type !== 'patrol') return JSON.stringify(o);
  const ends = [`${o.x},${o.y}`, `${o.rx},${o.ry}`].sort();
  return `patrol:${ends.join('|')}`;
};

const arbBattle = fc
  .record({
    map: fc.constantFrom(...MAPS),
    terrain: fc.array(fc.constantFrom('.', '.', '.', '=', 'f', 's'), { minLength: 112, maxLength: 112 }),
    units: fc.array(fc.record({ side: fc.nat(1), kind: fc.constantFrom(...MOBILE), dx: fc.nat(3), dy: fc.nat(3) }), { minLength: 4, maxLength: 12 }),
    standing: fc.array(fc.record({ unit: fc.integer({ min: 1, max: 14 }), order: arbOrder(14, 8), doctrine: fc.option(arbDoctrine, { nil: undefined }) }), { maxLength: 6 }),
    seed: fc.nat(1000)
  })
  .chain(({ map, terrain, units, standing, seed }) => {
    const { w, h } = map;
    const posts = [
      { x: 0, y: 0 },
      { x: w - 1, y: h - 1 }
    ];
    const used = new Set(posts.map((p) => `${p.x},${p.y}`));
    const usedAir = new Set<string>();
    const entities: Scenario['entities'][number][] = posts.map((p, side) => ({ side, kind: 'command-post', ...p }));
    for (const u of units) {
      const post = posts[u.side]!;
      const x = Math.min(w - 1, Math.max(0, post.x + (u.side === 0 ? u.dx : -u.dx)));
      const y = Math.min(h - 1, Math.max(0, post.y + (u.side === 0 ? u.dy : -u.dy)));
      const key = `${x},${y}`;
      const air = `air:${key}`;
      if (u.kind === 'kite' ? usedAir.has(air) : used.has(key)) continue;
      if (u.kind === 'kite') usedAir.add(air);
      else used.add(key);
      entities.push({ side: u.side, kind: u.kind, x, y });
    }
    const t = terrain.slice(0, w * h);
    for (const key of used) {
      const [x, y] = key.split(',').map(Number) as [number, number];
      t[y * w + x] = '.';
    }
    const world: World = createWorld({ map: { w, h, terrain: t.join('') }, sides: 2, entities, seed }, rs);
    const clampOrder = (o: Order): Order =>
      o.type === 'move'
        ? { type: 'move', x: o.x % w, y: o.y % h }
        : o.type === 'patrol'
          ? { type: 'patrol', x: o.x % w, y: o.y % h, rx: o.rx % w, ry: o.ry % h }
          : o;
    for (const s of standing) {
      const e = world.entities.find((x) => x.id === s.unit);
      if (!e || e.kind === 'command-post') continue;
      const order = clampOrder(s.order);
      // Only orders a player could have given earlier.
      if (order.type === 'deploy' && e.kind !== 'mast-truck' && e.kind !== 'jammer') continue;
      if ((order.type === 'escort' || order.type === 'attack') && !world.entities.some((x) => x.id === order.target)) continue;
      e.order = order;
      if (s.doctrine) e.doctrine = s.doctrine;
    }
    const mobileIds = world.entities.filter((e) => e.kind !== 'command-post').map((e) => e.id);
    const arbCommand = fc
      .record({ unit: fc.constantFrom(...mobileIds), order: arbOrder(w, h), doctrine: fc.option(arbDoctrine, { nil: undefined }) })
      .map(({ unit, order, doctrine }) => {
        const side = world.entities.find((e) => e.id === unit)!.side;
        return (doctrine ? { side, unit, order: clampOrder(order), doctrine } : { side, unit, order: clampOrder(order) }) as Command;
      });
    return fc.record({
      world: fc.constant(world),
      plans: fc.array(fc.array(arbCommand, { maxLength: 6 }), { minLength: 3, maxLength: 3 })
    });
  });

describe('generated battles (strategy ruleset): validity, explained order changes, bounded blocking', () => {
  it('every tick: valid world after a JSON round-trip; every automatic order change has an event; blocking is bounded', () => {
    const stats = { move: 0, patrol: 0, escort: 0, attack: 0, regroup: 0, bumps: 0, ended: 0 };
    const reasons = new Set<string>();
    fc.assert(
      fc.property(arbBattle, ({ world, plans }) => {
        let w = world;
        const streak = new Map<number, number>();
        // Per unit and move order: how often it entered each cell (no endless back-and-forth).
        const visits = new Map<number, { key: string; cells: Map<number, number> }>();
        for (const plan of [...plans, [], [], []]) {
          for (let tick = 0; tick < rs.ticksPerTurn; tick++) {
            const before = new Map(w.entities.map((e) => [e.id, orderKey(e.order)]));
            const r = runTicks(w, rs, tick === 0 ? plan : [], 1);
            const explained = new Set(r.events.flatMap((e) => (e.t === 'order' || e.t === 'order-ended' ? [e.id] : [])));
            for (const e of r.world.entities) {
              const was = before.get(e.id);
              if (was !== undefined && was !== orderKey(e.order)) expect(explained.has(e.id), `order of ${e.id} changed silently`).toBe(true);
            }
            for (const ev of r.events) {
              if (ev.t !== 'move') continue;
              const mover = r.world.entities.find((e) => e.id === ev.id);
              if (mover?.order.type !== 'move') continue;
              const key = orderKey(mover.order);
              let v = visits.get(ev.id);
              if (!v || v.key !== key) visits.set(ev.id, (v = { key, cells: new Map() }));
              const cell = ev.y * w.map.w + ev.x;
              v.cells.set(cell, (v.cells.get(cell) ?? 0) + 1);
              expect(v.cells.get(cell), `unit ${ev.id} keeps returning to ${ev.x},${ev.y}`).toBeLessThan(4);
            }
            const bumped = new Set(r.events.flatMap((e) => (e.t === 'bump' ? [e.id] : [])));
            for (const e of r.world.entities) streak.set(e.id, bumped.has(e.id) ? (streak.get(e.id) ?? 0) + 1 : 0);
            for (const id of bumped) expect(streak.get(id) ?? 0).toBeLessThanOrEqual(DEADLOCK_TICKS);
            const accepted = new Set(r.events.flatMap((ev) => (ev.t === 'order' ? [ev.id] : [])));
            if (tick === 0) {
              for (const c of plan) if (accepted.has(c.unit) && c.order.type in stats) stats[c.order.type as keyof typeof stats]++;
            }
            for (const ev of r.events) {
              if (ev.t === 'bump') stats.bumps++;
              if (ev.t === 'order-ended') {
                stats.ended++;
                reasons.add(ev.reason);
              }
            }
            expect(isValidWorld(JSON.parse(JSON.stringify(r.world)), rs)).toBe(true);
            w = r.world;
          }
        }
      }),
      { numRuns: 150, seed: 20261009 }
    );
    // The generator must actually exercise movement, blocking and every order kind.
    for (const [key, min] of Object.entries({ move: 60, patrol: 40, escort: 20, attack: 20, regroup: 20, bumps: 100, ended: 60 })) {
      expect(stats[key as keyof typeof stats], key).toBeGreaterThanOrEqual(min);
    }
    for (const reason of ['arrived', 'occupied', 'unreachable', 'lost-target', 'regrouped', 'retreat']) expect(reasons, reason).toContain(reason);
  });
});

describe('follow-ups from the review of PR #7 (round 3)', () => {
  const endTicks = (events: readonly SimEvent[], id: number) => events.flatMap((e) => (e.t === 'order-ended' && e.id === id ? [[e.tick, e.reason] as const] : []));

  it('a new order resets the dead-end counter: it gets a full turn before it ends as unreachable', () => {
    const w = worldOf(mapOf('...^......'), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'rifles', x: 1, y: 0 }
    ]);
    unit(w, 2).order = { type: 'move', x: 6, y: 0 };
    const stuck = runTicks(w, rs, [], 4).world;
    expect(unit(stuck, 2).stuck).toBe(4);
    const r = runTicks(stuck, rs, [{ side: 0, unit: 2, order: { type: 'move', x: 7, y: 0 } }], 8);
    expect(endTicks(r.events, 2)).toEqual([[4 + UNREACHABLE_TICKS, 'unreachable']]);
  });

  it('a unit already holding in coverage does not report a retreat on every hit', () => {
    const w = worldOf(open(8, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'warden', x: 2, y: 0 },
      { side: 1, kind: 'warden', x: 4, y: 0 },
      { side: 1, kind: 'command-post', x: 7, y: 0 }
    ]);
    Object.assign(unit(w, 2), { hp: 40, doctrine: doctrine({ retreatBelow: 75 }) });
    const { events } = play(w, 1);
    expect(events.filter((e) => e.t === 'hit' && e.id === 2).length).toBeGreaterThan(1);
    expect(ended(events, 2)).toEqual([]);
  });

  it('a damaged unit out of coverage still retreats once', () => {
    const w = worldOf(open(14, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'warden', x: 9, y: 0 },
      { side: 1, kind: 'warden', x: 11, y: 0 },
      { side: 1, kind: 'command-post', x: 13, y: 0 }
    ]);
    Object.assign(unit(w, 2), { hp: 120, doctrine: doctrine({ retreatBelow: 75 }) });
    const reasons = ended(play(w, 2).events, 2);
    expect(reasons.filter((r) => r === 'retreat')).toHaveLength(1);
  });

  it('a patrol turns before an end taken by a unit that is not holding (escort)', () => {
    const w = worldOf(open(10, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'rifles', x: 1, y: 0 },
      { side: 0, kind: 'lancer', x: 6, y: 0 },
      { side: 0, kind: 'warden', x: 7, y: 0 }
    ]);
    unit(w, 2).order = { type: 'patrol', x: 6, y: 0, rx: 1, ry: 0 };
    unit(w, 3).order = { type: 'escort', target: 4 };
    const { world, events } = play(w, 4);
    expect(ended(events, 2)).toEqual([]);
    expect(unit(world, 2).order.type).toBe('patrol');
    // It went back towards the far end at least once.
    const xs = events.flatMap((e) => (e.t === 'move' && e.id === 2 ? [e.x] : []));
    expect(xs.indexOf(5)).toBeGreaterThanOrEqual(0);
    expect(xs.slice(xs.indexOf(5)).some((x) => x < 5)).toBe(true);
  });

  it('a destination taken by a unit that stays (escort) ends a move as occupied, not blocked', () => {
    const w = worldOf(open(10, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'rifles', x: 3, y: 0 },
      { side: 0, kind: 'lancer', x: 6, y: 0 },
      { side: 0, kind: 'warden', x: 7, y: 0 }
    ]);
    unit(w, 3).order = { type: 'escort', target: 4 };
    const { events } = play(w, 2, [{ side: 0, unit: 2, order: { type: 'move', x: 6, y: 0 } }]);
    expect(ended(events, 2)).toEqual(['occupied']);
  });

  it('a convoy unit whose held destination lies behind a held cell ends as occupied, not unreachable', () => {
    const w = worldOf(open(8, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'rifles', x: 2, y: 0 },
      { side: 0, kind: 'rifles', x: 4, y: 0 },
      { side: 0, kind: 'rifles', x: 5, y: 0 }
    ]);
    const { events } = play(w, 2, [{ side: 0, unit: 2, order: { type: 'move', x: 5, y: 0 } }]);
    expect(ended(events, 2)).toEqual(['occupied']);
  });
});

describe('review of PR #8: no endless back-and-forth', () => {
  it('a Warden passing two escorting squads arrives instead of oscillating (fuzz map)', () => {
    const terrain = 'f.f=f.^f...==.f..f....^f.=^=...^f^....=.^......=f.^....f....^..=';
    const w = worldOf({ w: 8, h: 8, terrain }, [
      { side: 0, kind: 'rifles', x: 1, y: 5 },
      { side: 0, kind: 'rifles', x: 2, y: 5 },
      { side: 0, kind: 'warden', x: 7, y: 6 }
    ]);
    unit(w, 1).order = { type: 'escort', target: 2 };
    unit(w, 2).order = { type: 'escort', target: 1 };
    unit(w, 3).order = { type: 'move', x: 1, y: 6 };
    const { events } = play(w, 8);
    const visits = new Map<string, number>();
    for (const e of events) if (e.t === 'move' && e.id === 3) visits.set(`${e.x},${e.y}`, (visits.get(`${e.x},${e.y}`) ?? 0) + 1);
    expect(Math.max(...visits.values())).toBeLessThan(4);
    expect(ended(events, 3)).toEqual(['arrived']);
  });
});

describe('review of PR #8 (round 2): no endless waiting or back-and-forth', () => {
  it('a Warden that cannot get past a two-cell patrol ends its order (blocked) instead of pacing for ever', () => {
    const w = worldOf(mapOf('ff=....=.f', '.^=...f^..', '.....=^=f^'), [
      { side: 0, kind: 'warden', x: 2, y: 1 },
      { side: 0, kind: 'mast-truck', x: 2, y: 0 },
      { side: 0, kind: 'howitzer', x: 3, y: 1 }
    ]);
    unit(w, 1).order = { type: 'move', x: 0, y: 0 };
    unit(w, 2).order = { type: 'patrol', x: 3, y: 0, rx: 2, ry: 0 };
    unit(w, 3).order = { type: 'escort', target: 2 };
    const { events } = play(w, 8);
    const end = events.find((e) => e.t === 'order-ended' && e.id === 1);
    expect(end).toBeDefined();
    expect(end!.tick).toBeLessThanOrEqual(STALL_TICKS + 2 * rs.ticksPerTurn);
    expect(['arrived', 'blocked']).toContain((end as { reason: string }).reason);
  });

  it('progress resets the count: a slow unit crossing a swamp is never ended', () => {
    const w = worldOf(mapOf('.ssssssssssssssssss.'), [{ side: 0, kind: 'rifles', x: 0, y: 0 }]);
    Object.assign(unit(w, 1), { order: { type: 'move', x: 19, y: 0 }, status: [{ kind: 'slowed', ticks: 200 }] });
    // One swamp cell per 8 ticks (speed halved to 1, cost 8): 18 cells take 24 turns.
    const { events } = play(w, 26);
    expect(ended(events, 1)).toEqual(['arrived']);
  });
});

describe('progress along the route (STALL_TICKS)', () => {
  it('a long detour around a lake counts as progress (the route gets shorter), so the order is kept', () => {
    // From (0,0) to (0,4): the lake forces a walk to x = 11 and back, moving away in straight line.
    const w = worldOf(mapOf('............', '~~~~~~~~~~~.', '~~~~~~~~~~~.', '~~~~~~~~~~~.', '............'), [{ side: 0, kind: 'rifles', x: 0, y: 0 }]);
    unit(w, 1).order = { type: 'move', x: 0, y: 4 };
    const { events } = play(w, 12);
    expect(ended(events, 1)).toEqual(['arrived']);
  });

  it('an order whose route has not got shorter for STALL_TICKS searches ends as blocked', () => {
    const w = worldOf(open(10, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'rifles', x: 1, y: 0 }
    ]);
    // Pretend the unit was a little closer before (best route cost 30, now 32) and has not got closer since.
    Object.assign(unit(w, 2), { order: { type: 'move', x: 9, y: 0 }, mp: 4, stall: { goal: 9, best: 30, ticks: STALL_TICKS - 1 } });
    const r = runTicks(w, rs, [], 1);
    expect(ended(r.events, 2)).toEqual(['blocked']);
    expect(isValidWorld(JSON.parse(JSON.stringify(r.world)), rs)).toBe(true);
    // A new order starts afresh.
    const again = runTicks(w, rs, [{ side: 0, unit: 2, order: { type: 'move', x: 9, y: 0 } }], 1);
    expect(ended(again.events, 2)).toEqual([]);
  });
});

describe('review of PR #9', () => {
  /** 40×7, a wall row at y = 3 with gaps at x = 1 and x = gap. */
  const gapMap = (gap: number) => {
    const rows = Array.from({ length: 7 }, () => '.'.repeat(40).split(''));
    for (let x = 0; x < 40; x++) if (x !== 1 && x !== gap) rows[3]![x] = '^';
    return mapOf(...rows.map((r) => r.join('')));
  };

  for (const gap of [12, 20, 38]) {
    it(`a long forced detour (near gap taken, far gap at x = ${gap}) is progress: the unit arrives`, () => {
      const w = worldOf(gapMap(gap), [
        { side: 0, kind: 'rifles', x: 6, y: 0 },
        { side: 0, kind: 'outrider', x: 1, y: 0 }
      ]);
      unit(w, 1).order = { type: 'move', x: 6, y: 6 };
      unit(w, 2).order = { type: 'move', x: 1, y: 3 }; // settles in the near gap and holds there
      // Up to ~70 cells at one cell per two ticks: allow 26 turns.
      const { world, events } = play(w, 26);
      expect(ended(events, 2)).toEqual(['arrived']);
      expect(ended(events, 1)).toEqual(['arrived']);
      expect(unit(world, 1)).toMatchObject({ x: 6, y: 6 });
    });
  }
});

describe('review of PR #9: attacking targets whose own cell cannot be reached', () => {
  it('a Lancer attacking a reported Command Post ringed by holding Rifles closes in and fires (fog)', () => {
    const w = worldOf(open(24, 3), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'lancer', x: 2, y: 0 },
      { side: 1, kind: 'command-post', x: 23, y: 0 },
      { side: 1, kind: 'rifles', x: 22, y: 0 },
      { side: 1, kind: 'rifles', x: 22, y: 1 },
      { side: 1, kind: 'rifles', x: 23, y: 1 }
    ]);
    unit(w, 2).order = { type: 'attack', target: 3 }; // the post is known from before the battle
    const { events } = play(w, 8);
    expect(ended(events, 2)).not.toContain('unreachable');
    expect(events.some((e) => e.t === 'fire' && e.id === 2)).toBe(true);
  });

  it('a Field Gun facing a target across a river drives to the shore and fires (no fog)', () => {
    const map = mapOf('........~.....', '........~.....', '........~.....');
    let world = createWorld({ map, sides: 2, seed: 1, entities: [
      { side: 0, kind: 'howitzer', x: 1, y: 1 },
      { side: 1, kind: 'rifles', x: 12, y: 1 }
    ] }, BASE_RULESET);
    world.entities[0]!.order = { type: 'attack', target: 2 };
    const events: SimEvent[] = [];
    for (let i = 0; i < 6; i++) {
      const r = resolveTurn(world, BASE_RULESET, [[]]);
      events.push(...r.events);
      world = r.world;
    }
    expect(ended(events, 1)).not.toContain('unreachable');
    expect(events.some((e) => e.t === 'launch' && e.id === 1)).toBe(true);
  });
});

describe('review of PR #9 (round 2): the no-reversal rule never trades a way around units for a blocked one', () => {
  it('the reviewer\'s 8×9 world: Warden 2 arrives instead of bumping until blocked', () => {
    const map = mapOf('^~~=~^~f', 'ff.~^fh.', '=.f.=h=^', 'f...^^=.', 'hs..^f..', 'f.=hh...', 's=f~f.~.', '=~~^..f.', '.^h.^.^=');
    let world = createWorld({ map, sides: 2, seed: 1, entities: [
      { side: 1, kind: 'mast-truck', x: 3, y: 0, order: { type: 'move', x: 5, y: 7 } },
      { side: 0, kind: 'warden', x: 7, y: 3, order: { type: 'move', x: 1, y: 3 } },
      { side: 0, kind: 'warden', x: 7, y: 4, order: { type: 'move', x: 3, y: 5 } },
      { side: 0, kind: 'mast-truck', x: 5, y: 2, order: { type: 'escort', target: 3 } },
      { side: 0, kind: 'outrider', x: 7, y: 7, order: { type: 'move', x: 0, y: 5 } }
    ] }, BASE_RULESET);
    for (const e of world.entities) e.doctrine = doctrine({ holdFire: true });
    const events: SimEvent[] = [];
    for (let i = 0; i < 6; i++) {
      const r = resolveTurn(world, BASE_RULESET, [[]]);
      events.push(...r.events);
      world = r.world;
    }
    expect(ended(events, 2)).toEqual(['arrived']);
  });

  it('property: a single moving unit among units that stay always arrives when its destination is free and reachable', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 4, max: 10 }),
        fc.integer({ min: 3, max: 8 }),
        fc.array(fc.constantFrom('.', '.', '.', '=', 'f', 's', '^', '~'), { minLength: 80, maxLength: 80 }),
        fc.array(fc.nat(79), { minLength: 1, maxLength: 10 }),
        fc.nat(79),
        fc.nat(79),
        (w, h, terrain, holders, from, to) => {
          const n = w * h;
          const t = terrain.slice(0, n);
          const start = from % n;
          const goal = to % n;
          t[start] = '.';
          t[goal] = '.';
          const map = { w, h, terrain: t.join('') };
          const used = new Set([start, goal]);
          const entities: Scenario['entities'][number][] = [{ side: 0, kind: 'rifles', x: start % w, y: Math.floor(start / w), order: { type: 'move', x: goal % w, y: Math.floor(goal / w) } }];
          for (const c of holders) {
            const cell = c % n;
            if (used.has(cell) || t[cell] === '^' || t[cell] === '~') continue;
            used.add(cell);
            entities.push({ side: 0, kind: 'rifles', x: cell % w, y: Math.floor(cell / w) });
          }
          fc.pre(start !== goal);
          let world = createWorld({ map, sides: 2, seed: 1, entities }, BASE_RULESET);
          const blockedCells = new Set(world.entities.slice(1).map((e) => e.y * w + e.x));
          fc.pre(findPath(map, BASE_RULESET, start, goal, { layer: 'ground', side: 0, blocked: blockedCells }) !== undefined);
          const events: SimEvent[] = [];
          for (let i = 0; i < 20 && !events.some((e) => e.t === 'order-ended'); i++) {
            const r = resolveTurn(world, BASE_RULESET, [[]]);
            events.push(...r.events);
            world = r.world;
          }
          expect(ended(events, 1)).toEqual(['arrived']);
        }
      ),
      { numRuns: 300 }
    );
  });
});

describe('review of PR #9 (round 2, N-b)', () => {
  it('two attackers pacing in step around each other out of range end their orders in time', () => {
    // A point-symmetric duel: each step of one is mirrored by the other, so neither gets closer.
    let world = createWorld({ map: open(8, 9), sides: 2, seed: 1, entities: [
      { side: 0, kind: 'outrider', x: 3, y: 3, order: { type: 'attack', target: 2 } },
      { side: 1, kind: 'outrider', x: 4, y: 5, order: { type: 'attack', target: 1 } }
    ] }, BASE_RULESET);
    const events: SimEvent[] = [];
    for (let i = 0; i < 10; i++) {
      const r = resolveTurn(world, BASE_RULESET, [[]]);
      events.push(...r.events);
      world = r.world;
    }
    // Either they fight (one fires) or their orders end; never pacing for ever with neither.
    const fired = events.some((e) => e.t === 'fire');
    const endedBoth = ended(events, 1).length > 0 && ended(events, 2).length > 0;
    expect(fired || endedBoth).toBe(true);
    // An attacker that cannot close in is told apart from one blocked by units.
    for (const id of [1, 2]) for (const reason of ended(events, id)) expect(['outpaced', 'lost-target']).toContain(reason);
  });
});
