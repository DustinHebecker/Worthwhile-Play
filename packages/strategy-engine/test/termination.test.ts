import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  createWorld,
  DEADLOCK_TICKS,
  DEFAULT_DOCTRINE,
  isValidWorld,
  resolveTurn,
  runTicks,
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
const MOBILE = ['rifles', 'lancer', 'outrider', 'warden', 'howitzer', 'mast-truck', 'kite'];

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
const arbBattle = fc
  .record({
    map: fc.constantFrom(...MAPS),
    terrain: fc.array(fc.constantFrom('.', '.', '.', '=', 'f', 's'), { minLength: 112, maxLength: 112 }),
    units: fc.array(fc.record({ side: fc.nat(1), kind: fc.constantFrom(...MOBILE), dx: fc.nat(3), dy: fc.nat(3) }), { minLength: 4, maxLength: 12 }),
    standing: fc.array(fc.record({ unit: fc.integer({ min: 1, max: 14 }), order: arbOrder(14, 8) }), { maxLength: 6 }),
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
      if (order.type === 'deploy' && e.kind !== 'mast-truck') continue;
      if ((order.type === 'escort' || order.type === 'attack') && !world.entities.some((x) => x.id === order.target)) continue;
      e.order = order;
    }
    const mobileIds = world.entities.filter((e) => e.kind !== 'command-post').map((e) => e.id);
    const arbCommand = fc.record({ unit: fc.constantFrom(...mobileIds), order: arbOrder(w, h) }).map(({ unit, order }) => {
      const side = world.entities.find((e) => e.id === unit)!.side;
      return { side, unit, order: clampOrder(order) } as Command;
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
        for (const plan of [...plans, [], [], []]) {
          for (let tick = 0; tick < rs.ticksPerTurn; tick++) {
            const before = new Map(w.entities.map((e) => [e.id, e.order.type]));
            const r = runTicks(w, rs, tick === 0 ? plan : [], 1);
            const explained = new Set(r.events.flatMap((e) => (e.t === 'order' || e.t === 'order-ended' ? [e.id] : [])));
            for (const e of r.world.entities) {
              const was = before.get(e.id);
              if (was !== undefined && was !== e.order.type) expect(explained.has(e.id), `order of ${e.id} changed silently`).toBe(true);
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
    for (const reason of ['arrived', 'occupied', 'unreachable', 'lost-target', 'regrouped']) expect(reasons, reason).toContain(reason);
  });
});
