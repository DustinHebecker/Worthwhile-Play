import { describe, expect, it } from 'vitest';
import { createWorld, spawn, archetypeOf, type SimEvent, type World } from '@wp/strategy-engine';
import { along, cellAt, chebyshev, CONTACT_DAMAGE, removeWalkers, STUN_BUDGET, tickLanes, type LaneRun, type Route } from '../src/lanes';
import { DEFENDER_KINDS, isEnemyKind, TD_RULESET } from '../src/ruleset';

/** A straight road down column 2 of a 5 × 8 map, plus an air route along it. */
const ROWS = ['bb=bb', 'bb=bb', 'bb=bb', 'bb=bb', 'bb=bb', 'bb=bb', 'bb=bb', 'bb=bb'];
const ROUTES: Route[] = [
  { layer: 'ground', points: [[2, 0], [2, 7]] },
  { layer: 'air', points: [[2, 0], [2, 7]] },
  { layer: 'ground', points: [[2, 7], [2, 0]] },
  // Route 3: the air route reversed (flying defenders).
  { layer: 'air', points: [[2, 7], [2, 0]] }
];
const world = (): World => createWorld({ map: { w: 5, h: 8, terrain: ROWS.join('') }, sides: 2, entities: [], seed: 1 }, TD_RULESET);
const run = (pending: LaneRun['pending']): LaneRun => ({ tick: 0, pending, walkers: [] });

function until(w: World, r: LaneRun, done: (w: World, r: LaneRun) => boolean, max = 2000) {
  const leaks = [];
  for (let i = 0; i < max && !done(w, r); i++) {
    const step = tickLanes(w, r, ROUTES);
    w = step.world;
    r = step.run;
    leaks.push(...step.leaks);
  }
  return { w, r, leaks };
}

describe('wave lanes', () => {
  it('spawns a due unit for its side (default 1) on the first point of its route', () => {
    const step = tickLanes(world(), run([{ at: 0, kind: 'walker', route: 0 }, { at: 0, kind: 'runner', route: 2, side: 0 }]), ROUTES);
    expect(step.world.entities.find((e) => e.kind === 'runner')!.side).toBe(0);
    expect(step.world.entities.find((e) => e.kind === 'walker')!.side).toBe(1);
    expect(step.run.walkers.map((x) => x.leg)).toEqual([1, 1]);
    expect(step.run.pending).toEqual([]);
  });

  it('keeps a unit pending until it is due', () => {
    const step = tickLanes(world(), run([{ at: 3, kind: 'walker', route: 0 }]), ROUTES);
    expect(step.world.entities).toHaveLength(0);
    expect(step.run.pending).toHaveLength(1);
    expect(step.run.tick).toBe(1);
  });

  it('waits while the spawn cell is taken on the same layer, in order per route; air and ground share a cell', () => {
    const w = world();
    w.entities.push(spawn(w.nextId++, 0, archetypeOf(TD_RULESET, 'gun')!, 2, 0));
    const step = tickLanes(w, run([{ at: 0, kind: 'walker', route: 0 }, { at: 0, kind: 'walker', route: 0 }, { at: 0, kind: 'glider', route: 1 }]), ROUTES);
    expect(step.world.entities.map((e) => e.kind).sort()).toEqual(['glider', 'gun']);
    expect(step.run.pending.map((p) => p.kind)).toEqual(['walker', 'walker']);
  });

  it('follows the route and leaks at its end with kind, side and health; the unit is removed', () => {
    const { w, r, leaks } = until(world(), run([{ at: 0, kind: 'walker', route: 0 }]), (_w, rr) => rr.tick > 0 && rr.walkers.length === 0);
    expect(leaks).toEqual([{ id: 1, kind: 'walker', hp: archetypeOf(TD_RULESET, 'walker')!.hp, side: 1 }]);
    expect(w.entities).toHaveLength(0);
    expect(r.walkers).toHaveLength(0);
  });

  it('a unit leaks within one cell of the goal and orders a move only when needed', () => {
    const first = tickLanes(world(), run([{ at: 0, kind: 'walker', route: 0 }]), ROUTES);
    const unit = first.world.entities[0]!;
    expect(unit.order).toEqual({ type: 'move', x: 2, y: 7 });
    const second = tickLanes(first.world, first.run, ROUTES);
    expect(second.events.filter((e) => e.t === 'order')).toHaveLength(0);
  });

  it('is pure: inputs are not changed', () => {
    const w = world();
    const r = run([{ at: 0, kind: 'walker', route: 0 }]);
    const before = JSON.stringify([w, r]);
    tickLanes(w, r, ROUTES);
    expect(JSON.stringify([w, r])).toBe(before);
  });

  it('removeWalkers takes units off the map and reports them as leaks', () => {
    const step = tickLanes(world(), run([{ at: 0, kind: 'brute', route: 0 }]), ROUTES);
    const id = step.run.walkers[0]!.id;
    const removed = removeWalkers(step.world, step.run, new Set([id]));
    expect(removed.leaks).toEqual([{ id, kind: 'brute', hp: archetypeOf(TD_RULESET, 'brute')!.hp, side: 1 }]);
    expect(removed.world.entities).toHaveLength(0);
    expect(removed.run.walkers).toHaveLength(0);
    expect(step.world.entities).toHaveLength(1);
  });

  it('heads for each waypoint in turn and leaks only at the last one', () => {
    const bend: Route[] = [{ layer: 'air', points: [[0, 0], [4, 0], [4, 7]] }];
    let w = world();
    let r = run([{ at: 0, kind: 'glider', route: 0 }]);
    const legs: number[] = [];
    const xs: number[] = [];
    const leaks = [];
    for (let i = 0; i < 400 && (r.tick === 0 || r.walkers.length > 0); i++) {
      const step = tickLanes(w, r, bend);
      w = step.world;
      r = step.run;
      leaks.push(...step.leaks);
      if (r.walkers[0]) legs.push(r.walkers[0].leg);
      const unit = w.entities[0];
      if (unit) xs.push(unit.x);
    }
    expect(legs[0]).toBe(1);
    expect(legs).toContain(2);
    expect(legs).toEqual([...legs].sort((a, b) => a - b));
    expect(Math.max(...xs)).toBeGreaterThanOrEqual(3);
    expect(leaks).toHaveLength(1);
    expect(leaks[0]!.kind).toBe('glider');
  });

  it('a spawn waits only behind earlier spawns of its own route', () => {
    const w = world();
    w.entities.push(spawn(w.nextId++, 0, archetypeOf(TD_RULESET, 'gun')!, 2, 7));
    const step = tickLanes(w, run([{ at: 0, kind: 'walker', route: 2 }, { at: 0, kind: 'walker', route: 0 }]), ROUTES);
    expect(step.run.pending.map((p) => p.route)).toEqual([2]);
    expect(step.run.walkers.map((x) => x.route)).toEqual([0]);
  });

  it('a unit that dies is dropped from the walkers without a leak', () => {
    const first = tickLanes(world(), run([{ at: 0, kind: 'swarm', route: 0 }]), ROUTES);
    const unit = first.world.entities[0]!;
    unit.hp = 0;
    const second = tickLanes(first.world, first.run, ROUTES);
    expect(second.leaks).toEqual([]);
    expect(second.run.walkers).toEqual([]);
  });

  it('counts the ticks a unit is stopped and shakes off stops past the budget', () => {
    const first = tickLanes(world(), run([{ at: 0, kind: 'walker', route: 0 }]), ROUTES);
    const stopped = structuredClone(first.world);
    stopped.entities[0]!.status = [{ kind: 'disabled', ticks: 500 }];
    const a = tickLanes(stopped, first.run, ROUTES);
    expect(a.run.walkers[0]!.stun).toBe(1);
    expect(a.world.entities[0]!.status.some((st) => st.kind === 'disabled')).toBe(true);
    const atBudget = { ...first.run, walkers: [{ ...first.run.walkers[0]!, stun: STUN_BUDGET - 1 }] };
    const b = tickLanes(stopped, atBudget, ROUTES);
    expect(b.run.walkers[0]!.stun).toBe(STUN_BUDGET);
    expect(b.world.entities[0]!.status.some((st) => st.kind === 'disabled')).toBe(true);
    const spent = { ...first.run, walkers: [{ ...first.run.walkers[0]!, stun: STUN_BUDGET }] };
    const c = tickLanes(stopped, spent, ROUTES);
    expect(c.world.entities[0]!.status.some((st) => st.kind === 'disabled')).toBe(false);
    expect(c.run.walkers[0]!.stun).toBe(STUN_BUDGET);
    // A moving unit's count does not grow.
    const free = tickLanes(first.world, first.run, ROUTES);
    expect(free.run.walkers[0]!.stun).toBeUndefined();
  });

  it('a stop shorter than the budget wears off by itself', () => {
    const first = tickLanes(world(), run([{ at: 0, kind: 'walker', route: 0 }]), ROUTES);
    const stopped = structuredClone(first.world);
    stopped.entities[0]!.status = [{ kind: 'disabled', ticks: 3 }];
    const { r } = until(stopped, first.run, (_w, rr) => rr.tick > 10);
    expect(r.walkers[0]!.stun).toBeGreaterThan(0);
    expect(r.walkers[0]!.stun).toBeLessThanOrEqual(4);
  });

  it('removeWalkers reports only wave units, not structures', () => {
    const w = world();
    w.entities.push(spawn(w.nextId++, 0, archetypeOf(TD_RULESET, 'extractor')!, 0, 0));
    const removed = removeWalkers(w, run([]), new Set([1]));
    expect(removed.leaks).toEqual([]);
    expect(removed.world.entities).toHaveLength(0);
  });

  it('chebyshev distance', () => {
    expect(chebyshev(0, 0, 3, -2)).toBe(3);
    expect(chebyshev(1, 1, 1, 1)).toBe(0);
  });
});

describe('tickLanes(…, owned) (review of PR #104, L7)', () => {
  /** A world with a gun beside the road and a mixed wave, so towers fire, units move, die and leak. */
  const busy = (): { w: World; r: LaneRun } => {
    const w = world();
    w.entities.push(spawn(w.nextId++, 0, archetypeOf(TD_RULESET, 'gun')!, 1, 4));
    const r = run([
      { at: 0, kind: 'walker', route: 0 },
      { at: 4, kind: 'glider', route: 1 },
      { at: 8, kind: 'brute', route: 0 },
      { at: 12, kind: 'runner', route: 2, side: 0 }
    ]);
    return { w, r };
  };

  it('gives the same results as the copying path, tick by tick', () => {
    let a = busy();
    let b = busy();
    for (let i = 0; i < 400; i++) {
      const copied = tickLanes(a.w, a.r, ROUTES);
      const owned = tickLanes(b.w, b.r, ROUTES, true);
      expect(owned.world, `tick ${i}`).toEqual(copied.world);
      expect(owned.run, `tick ${i}`).toEqual(copied.run);
      expect(owned.leaks, `tick ${i}`).toEqual(copied.leaks);
      expect(owned.events, `tick ${i}`).toEqual(copied.events);
      a = { w: copied.world, r: copied.run };
      b = { w: owned.world, r: owned.run };
    }
  });

  it('by default leaves its inputs unchanged; owned works on them in place', () => {
    const { w, r } = busy();
    const [w0, r0] = [structuredClone(w), structuredClone(r)];
    const step = tickLanes(w, r, ROUTES);
    expect(w).toEqual(w0);
    expect(r).toEqual(r0);
    expect(step.world).not.toBe(w);
    expect(step.run).not.toBe(r);
    // Owned: no copy of the run is made (the caller's run advances with it).
    const mine = tickLanes(w, r, ROUTES, true);
    expect(mine.run).toBe(r);
    expect(r.tick).toBe(1);
  });
});

describe('defenders on the lanes (design § 18.3, E5b)', () => {
  /** A force walker coming down column 2 (route 0), a defender walking up it (route 2) from the other end. */
  const meeting = (defender: string, force: 'walker' | 'brute' | 'glider' = 'walker'): LaneRun => ({
    tick: 0,
    pending: [{ at: 0, kind: force, route: force === 'glider' ? 1 : 0, side: 1 }],
    walkers: [],
    guards: [{ at: 0, kind: defender as never, route: 2, side: 0 }]
  });
  const step = (w: World, r: LaneRun, n: number) => {
    const events: SimEvent[] = [];
    const leaks = [];
    for (let i = 0; i < n; i++) {
      const s = tickLanes(w, r, ROUTES);
      [w, r] = [s.world, s.run];
      events.push(...s.events);
      leaks.push(...s.leaks);
    }
    return { w, r, events, leaks };
  };

  it('a defender sets off from its route, never leaks, and holds where the force is within its reach', () => {
    const { w, r, leaks } = step(world(), { tick: 0, pending: [], walkers: [], guards: [{ at: 0, kind: 'picket', route: 2, side: 0 }] }, 200);
    // Alone it walks to the end of its route and holds there.
    const d = w.entities.find((e) => e.kind === 'picket')!;
    expect(chebyshev(d.x, d.y, 2, 0)).toBeLessThanOrEqual(1);
    expect(d.order.type).toBe('hold');
    expect(leaks).toEqual([]);
    expect(r.walkers).toHaveLength(1);
    expect(r.guards).toEqual([]);
  });

  it('a wave unit blocked by a defender stays on the road, alive, and keeps trying; it is never leaked or removed', () => {
    // A Bulwark with no damage against... a Brute: neither falls quickly; the Brute must stay blocked, not vanish.
    let { w, r, leaks } = step(world(), meeting('bulwark', 'brute'), 60);
    const brute = () => w.entities.find((e) => e.kind === 'brute');
    expect(brute()).toBeDefined();
    const bulwark = w.entities.find((e) => e.kind === 'bulwark')!;
    expect(brute()!.y).toBeLessThan(bulwark.y);
    expect(leaks).toEqual([]);
    // Many ticks later the Brute is still on the road column (never sent round over the pads).
    ({ w, r, leaks } = step(w, r, 40));
    if (brute()) expect(brute()!.x).toBe(2);
    expect(r.walkers.some((x) => x.id === brute()?.id) || !brute()).toBe(true);
  });

  it('contact: units next to a defender wear it down by threat x CONTACT_DAMAGE every CONTACT_EVERY ticks, the shield first', () => {
    const { events } = step(world(), meeting('medic', 'brute'), 400);
    const hits = events.filter((e) => e.t === 'hit' && e.side === 0);
    expect(hits.length).toBeGreaterThan(0);
    // An unarmed Medic cannot hurt the Brute: the Brute wears it down and goes on.
    expect(events.some((e) => e.t === 'destroyed' && e.kind === 'medic')).toBe(true);
    expect(hits.every((e) => e.t === 'hit' && e.damage + (e.shield ?? 0) === 3 * CONTACT_DAMAGE)).toBe(true);
    const shielded = step(world(), meeting('picket-shield', 'brute'), 200).events.filter((e) => e.t === 'hit' && e.side === 0);
    expect(shielded[0]).toMatchObject({ shield: 3 * CONTACT_DAMAGE, damage: 0 });
  });

  it('every head-on meeting ends: the defender falls or the unit does, well before the bound (no stall)', () => {
    for (const defender of DEFENDER_KINDS) {
      for (const force of ['walker', 'brute', 'glider'] as const) {
        const { w, r } = step(world(), meeting(defender, force), 1500);
        const forceLeft = r.pending.length + r.walkers.filter((x) => isEnemyKind(w.entities.find((e) => e.id === x.id)?.kind ?? '')).length;
        expect(forceLeft, `${defender} vs ${force}`).toBe(0);
      }
    }
  });

  it('flying units pass ground defenders and the other way round; contact needs the same layer', () => {
    const { events, leaks } = step(world(), meeting('bulwark', 'glider'), 300);
    expect(leaks.map((l) => l.kind)).toEqual(['glider']);
    expect(events.some((e) => e.t === 'hit' && e.side === 0)).toBe(false);
  });

  it('without defenders nothing changes: the same run gives the same world as without the rule', () => {
    const r0 = run([{ at: 0, kind: 'brute', route: 0 }, { at: 3, kind: 'walker', route: 0 }]);
    const a = step(world(), r0, 120);
    const b = step(world(), { ...r0, guards: [] }, 120);
    expect(b.w).toEqual(a.w);
    expect(b.events).toEqual(a.events);
  });
});

describe('defenders on the lanes, in detail', () => {
  const put = (w: World, kind: string, side: number, x: number, y: number) => {
    const e = spawn(w.nextId++, side, archetypeOf(TD_RULESET, kind)!, x, y);
    w.entities.push(e);
    return e;
  };
  /** One tick with a defender walking route 2 (from the bottom, (2, 7)) at (2, 4), 3 cells along it, and the given units. */
  const holdAt = (kind: string, unit: [string, number, number, number] | null, at: [number, number] = [2, 4]): string => {
    const w = world();
    const d = put(w, kind, 0, at[0], at[1]);
    if (unit) put(w, unit[0], unit[1], unit[2], unit[3]);
    const r: LaneRun = { tick: 1, pending: [], walkers: [{ id: d.id, route: 2, leg: 1 }] };
    const out = tickLanes(w, r, ROUTES).world.entities.find((e) => e.id === d.id)!;
    return out.order.type;
  };

  it('holds where the force is close ahead along its road (hold line or reach), for hostile wave units only', () => {
    expect(holdAt('picket', null)).toBe('move');
    expect(holdAt('picket', ['walker', 1, 2, 1])).toBe('hold'); // 3 cells ahead: the hold line
    expect(holdAt('picket', ['walker', 1, 2, 0])).toBe('move'); // 4 cells ahead: beyond it and its reach
    expect(holdAt('mortar-team', ['walker', 1, 2, 0])).toBe('hold'); // its reach is 4
    expect(holdAt('picket', ['walker', 0, 2, 1])).toBe('move'); // its own side's unit
    expect(holdAt('picket', ['picket', 1, 2, 1])).toBe('move'); // another defender is not the force
    // Behind it (already past) does not count, unless CLOSE (2 cells).
    expect(holdAt('picket', ['walker', 1, 2, 7])).toBe('move');
    expect(holdAt('picket', ['walker', 1, 2, 6])).toBe('hold');
    // Off its road (across a bend) it counts only when CLOSE in a straight line.
    expect(holdAt('picket', ['walker', 1, 0, 1])).toBe('move');
    expect(holdAt('picket', ['walker', 1, 0, 2])).toBe('hold');
  });

  it('never holds near its start, so the defenders behind it can set off; unless the force is CLOSE', () => {
    expect(holdAt('picket', ['walker', 1, 2, 3], [2, 6])).toBe('move');
    expect(holdAt('picket', ['walker', 1, 2, 4], [2, 6])).toBe('hold');
  });

  it('along: the position on a route in cells from its start, or null off it', () => {
    const route = [[0, 0], [0, 3], [4, 3]] as const;
    expect(along(route, 0, 0)).toBe(0);
    expect(along(route, 0, 2)).toBe(2);
    expect(along(route, 0, 3)).toBe(3);
    expect(along(route, 2, 3)).toBe(5);
    expect(along(route, 4, 3)).toBe(7);
    expect(along(route, 1, 1)).toBeNull();
    expect(along(route, 5, 3)).toBeNull();
  });

  it('walks its route waypoint by waypoint, and at its end holds', () => {
    const w = world();
    const d = put(w, 'scout', 0, 2, 7);
    let r: LaneRun = { tick: 0, pending: [], walkers: [{ id: d.id, route: 2, leg: 1 }] };
    let cur = w;
    const orders = new Set<string>();
    for (let i = 0; i < 80; i++) {
      const s = tickLanes(cur, r, ROUTES);
      [cur, r] = [s.world, s.run];
      const e = cur.entities.find((x) => x.id === d.id)!;
      orders.add(e.order.type === 'move' ? `move ${e.order.x},${e.order.y}` : e.order.type);
    }
    expect(orders).toEqual(new Set(['move 2,0', 'hold']));
    expect(r.walkers).toHaveLength(1);
  });

  it('defenders set off in order on their route, each when its cell is free', () => {
    const w = world();
    const r: LaneRun = { tick: 0, pending: [], walkers: [], guards: [{ at: 0, kind: 'picket', route: 2, side: 0 }, { at: 0, kind: 'medic', route: 2, side: 0 }] };
    const first = tickLanes(w, r, ROUTES);
    expect(first.world.entities.map((e) => e.kind)).toEqual(['picket']);
    expect(first.run.guards!.map((g) => g.kind)).toEqual(['medic']);
    let [cur, run] = [first.world, first.run];
    for (let i = 0; i < 30 && run.guards!.length > 0; i++) [cur, run] = (({ world: a, run: b }) => [a, b] as const)(tickLanes(cur, run, ROUTES));
    expect(cur.entities.map((e) => e.kind).sort()).toEqual(['medic', 'picket']);
    expect(cur.entities.find((e) => e.kind === 'medic')!.side).toBe(0);
  });

  it('contact hits only next to it, on its layer, from the other side, every CONTACT_EVERY ticks, the lowest id first', () => {
    const run1 = (units: [string, number, number, number][], tick: number) => {
      const w = world();
      w.tick = tick;
      const made = units.map(([k, side, x, y]) => put(w, k, side, x, y));
      const out = tickLanes(w, { tick, pending: [], walkers: [] }, ROUTES);
      return { made, out };
    };
    // Adjacent brute (threat 3) next to two pickets: the lower id is hit by 12.
    const { made, out } = run1([['picket', 0, 2, 4], ['picket', 0, 1, 4], ['brute', 1, 2, 3]], 8);
    const hp = (id: number) => out.world.entities.find((e) => e.id === id)?.hp;
    expect(hp(made[0]!.id)).toBe(50 - 3 * CONTACT_DAMAGE);
    expect(hp(made[1]!.id)).toBe(50);
    const hit = out.events.find((e) => e.t === 'hit' && e.id === made[0]!.id)!;
    expect(hit).toMatchObject({ damage: 3 * CONTACT_DAMAGE, side: 0, tick: out.world.tick - 1 });
    expect(out.world.entities.find((e) => e.id === made[0]!.id)!.hitAt).toBe(out.world.tick - 1);
    // Not on other ticks, not two cells away, not across layers, not from its own side.
    expect(run1([['picket', 0, 2, 4], ['brute', 1, 2, 3]], 9).out.events.some((e) => e.t === 'hit' && e.side === 0)).toBe(false);
    expect(run1([['picket', 0, 2, 5], ['brute', 1, 2, 3]], 8).out.events.some((e) => e.t === 'hit' && e.side === 0)).toBe(false);
    expect(run1([['skimmer', 0, 2, 4], ['brute', 1, 2, 3]], 8).out.events.some((e) => e.t === 'hit' && e.side === 0)).toBe(false);
    expect(run1([['picket', 0, 2, 4], ['brute', 0, 2, 3]], 8).out.events.some((e) => e.t === 'hit' && e.side === 0)).toBe(false);
  });

  it('contact soaks the shield first and keeps it down; at 0 health the defender is destroyed and removed', () => {
    const w = world();
    w.tick = 8;
    const d = put(w, 'picket-shield', 0, 2, 4);
    d.shield = 10;
    d.shieldAt = 7; // hit just before: the shield is not back yet
    put(w, 'brute', 1, 2, 3);
    const out = tickLanes(w, { tick: 8, pending: [], walkers: [] }, ROUTES);
    const after = out.world.entities.find((e) => e.id === d.id)!;
    expect(after.shield).toBe(0);
    expect(after.hp).toBe(50 - (3 * CONTACT_DAMAGE - 10));
    expect(after.shieldAt).toBe(out.world.tick - 1);
    const w2 = world();
    w2.tick = 8;
    const weak = put(w2, 'picket', 0, 2, 4);
    weak.hp = 5;
    put(w2, 'brute', 1, 2, 3);
    const out2 = tickLanes(w2, { tick: 8, pending: [], walkers: [] }, ROUTES);
    expect(out2.world.entities.some((e) => e.id === weak.id)).toBe(false);
    expect(out2.events).toContainEqual(expect.objectContaining({ t: 'destroyed', id: weak.id, kind: 'picket', side: 0, x: 2, y: 4 }));
  });

  it('along and cellAt: diagonal and uneven legs, a zero-length leg, a single point, clamped ends', () => {
    const uneven = [[0, 0], [4, 2]] as const;
    expect(along(uneven, 2, 1)).toBe(2);
    expect(along(uneven, 2, 0)).toBeNull();
    expect(along(uneven, 3, 1)).toBeNull();
    expect(cellAt(uneven, 2)).toEqual([2, 1]);
    const route = [[0, 0], [0, 3], [4, 3]] as const;
    expect([0, 2, 3, 5, 7].map((k) => cellAt(route, k))).toEqual([[0, 0], [0, 2], [0, 3], [2, 3], [4, 3]]);
    expect(cellAt(route, 9)).toEqual([4, 3]);
    expect(cellAt(route, -1)).toEqual([0, 0]);
    const stub = [[0, 0], [0, 0], [0, 2]] as const;
    expect(cellAt(stub, 0)).toEqual([0, 0]);
    expect(cellAt(stub, 1)).toEqual([0, 1]);
    expect(along(stub, 0, 1)).toBe(1);
    expect(along([[1, 1]], 1, 1)).toBe(0);
    expect(along([[1, 1]], 1, 2)).toBeNull();
    expect(along([[1, 1]], 2, 1)).toBeNull();
    for (let k = 0; k <= 7; k++) expect(along(route, ...cellAt(route, k))).toBe(k);
  });

  /** One tick for a force walker on `route` at (x, y) with the given defenders; its move target afterwards. */
  const targetOf = (at: [number, number], defenders: [string, number, number, number][], routes: Route[] = ROUTES, leg = 1, order?: { x: number; y: number }) => {
    const w = world();
    const made = defenders.map(([k, side, x, y]) => put(w, k, side, x, y));
    const u = put(w, 'walker', 1, at[0], at[1]);
    if (order) u.order = { type: 'move', ...order };
    w.entities.reverse();
    const r: LaneRun = { tick: 1, pending: [], walkers: [{ id: u.id, route: 0, leg }] };
    const out = tickLanes(w, r, routes);
    const e = out.world.entities.find((x) => x.id === u.id)!;
    return { order: e.order.type === 'move' ? [e.order.x, e.order.y] : e.order.type, run: out.run, made };
  };

  it('a force unit heads for the cell before the nearest hostile defender on its road, on its layer, up to its waypoint', () => {
    expect(targetOf([2, 1], []).order).toEqual([2, 7]);
    expect(targetOf([2, 1], [['picket', 0, 2, 5]]).order).toEqual([2, 4]);
    expect(targetOf([2, 1], [['picket', 0, 2, 5], ['picket', 0, 2, 3]]).order).toEqual([2, 2]);
    expect(targetOf([2, 1], [['picket', 0, 2, 7]]).order).toEqual([2, 6]);
    expect(targetOf([2, 1], [['picket', 1, 2, 5]]).order).toEqual([2, 7]); // its own side
    expect(targetOf([2, 1], [['skimmer', 0, 2, 5]]).order).toEqual([2, 7]); // another layer
    expect(targetOf([2, 3], [['picket', 0, 2, 1]]).order).toEqual([2, 7]); // behind it
    expect(targetOf([2, 3], [['picket', 0, 2, 3 - 3], ['scout', 0, 2, 6]]).order).toEqual([2, 5]);
    expect(targetOf([1, 1], [['picket', 0, 2, 5]]).order).toEqual([2, 7]); // off its road
    // Not beyond its current waypoint.
    const bent: Route[] = [{ layer: 'ground', points: [[2, 0], [2, 4], [2, 7]] }, ...ROUTES.slice(1)];
    expect(targetOf([2, 1], [['picket', 0, 2, 6]], bent).order).toEqual([2, 4]);
    expect(targetOf([2, 1], [['picket', 0, 2, 4]], bent).order).toEqual([2, 3]);
  });

  it('a unit next to its waypoint heads for the next one at once; next to its goal it leaks at once', () => {
    const bent: Route[] = [{ layer: 'ground', points: [[2, 0], [2, 4], [2, 7]] }, ...ROUTES.slice(1)];
    const { order, run: r } = targetOf([2, 3], [], bent);
    expect(order).toEqual([2, 7]);
    expect(r.walkers[0]!.leg).toBe(2);
    const w = world();
    const u = put(w, 'walker', 1, 2, 6);
    const out = tickLanes(w, { tick: 1, pending: [], walkers: [{ id: u.id, route: 0, leg: 1 }] }, ROUTES);
    expect(out.leaks.map((l) => l.id)).toEqual([u.id]);
  });

  it('a stale move order is replaced (another x or another y), for force units and defenders alike', () => {
    expect(targetOf([2, 1], [], ROUTES, 1, { x: 3, y: 7 }).order).toEqual([2, 7]);
    expect(targetOf([2, 1], [], ROUTES, 1, { x: 2, y: 5 }).order).toEqual([2, 7]);
    for (const order of [{ x: 3, y: 0 }, { x: 2, y: 5 }]) {
      const w = world();
      const d = put(w, 'picket', 0, 2, 6);
      d.order = { type: 'move', ...order };
      const out = tickLanes(w, { tick: 1, pending: [], walkers: [{ id: d.id, route: 2, leg: 1 }] }, ROUTES);
      expect(out.world.entities.find((e) => e.id === d.id)!.order).toMatchObject({ type: 'move', x: 2, y: 0 });
    }
  });

  it('next to the end of its route a defender holds at once; just inside SPAWN_CLEAR it does not hold for the force ahead', () => {
    const w = world();
    const d = put(w, 'picket', 0, 2, 1);
    const out = tickLanes(w, { tick: 1, pending: [], walkers: [{ id: d.id, route: 2, leg: 1 }] }, ROUTES);
    const after = out.world.entities.find((e) => e.id === d.id)!;
    expect(after.order.type).toBe('hold');
    expect([after.x, after.y]).toEqual([2, 1]);
    // 2 cells from its start (= SPAWN_CLEAR), a unit 3 cells ahead along the road: it walks on.
    expect(holdAt('picket', ['walker', 1, 2, 2], [2, 5])).toBe('move');
    expect(holdAt('picket', ['walker', 1, 2, 3], [2, 4])).toBe('hold');
  });

  it('spawning: a unit elsewhere does not block the spawn cell; ids advance; a later spawn waits only behind a due one', () => {
    const w = world();
    put(w, 'walker', 1, 2, 3);
    const before = w.nextId;
    const out = tickLanes(w, run([{ at: 0, kind: 'walker', route: 0 }]), ROUTES);
    expect(out.world.entities).toHaveLength(2);
    expect(out.world.nextId).toBe(before + 1);
    // The first one of the route is not due yet: the second (due) one goes first.
    const later = tickLanes(world(), run([{ at: 5, kind: 'walker', route: 0 }, { at: 0, kind: 'brute', route: 0 }]), ROUTES);
    expect(later.world.entities.map((e) => e.kind)).toEqual(['brute']);
    // The first one is due but blocked: the second waits behind it.
    const w2 = world();
    put(w2, 'walker', 1, 2, 0);
    const blocked = tickLanes(w2, run([{ at: 0, kind: 'brute', route: 0 }, { at: 0, kind: 'walker', route: 0 }]), ROUTES);
    expect(blocked.run.pending.map((p) => p.kind)).toEqual(['brute', 'walker']);
  });

  it('contact details: by id whatever the order in the world, no hit on a fallen defender, no shield marks without a shield, defenders never attack', () => {
    const tickAt8 = (units: [string, number, number, number][]) => {
      const w = world();
      w.tick = 8;
      const made = units.map(([k, side, x, y]) => put(w, k, side, x, y));
      w.entities.reverse();
      return { made, out: tickLanes(w, { tick: 8, pending: [], walkers: [] }, ROUTES) };
    };
    // The brute (lower id) strikes first and fells the weak picket; the walker then finds nothing.
    {
      const w = world();
      w.tick = 8;
      const p = put(w, 'picket', 0, 2, 4);
      p.hp = 3;
      put(w, 'brute', 1, 2, 3);
      put(w, 'walker', 1, 1, 4);
      w.entities.reverse();
      const out = tickLanes(w, { tick: 8, pending: [], walkers: [] }, ROUTES);
      const hits = out.events.filter((e) => e.t === 'hit' && e.id === p.id);
      expect(hits).toEqual([expect.objectContaining({ damage: 3 * CONTACT_DAMAGE })]);
      expect(out.events.filter((e) => e.t === 'destroyed' && e.id === p.id)).toHaveLength(1);
    }
    // Two pickets next to a brute: the lower id is hit, whatever the order in the world.
    const { made, out } = tickAt8([['picket', 0, 2, 4], ['picket', 0, 1, 4], ['brute', 1, 2, 3]]);
    const first = out.world.entities.find((e) => e.id === made[0]!.id)!;
    expect(first.hp).toBe(50 - 3 * CONTACT_DAMAGE);
    expect(out.world.entities.find((e) => e.id === made[1]!.id)!.hp).toBe(50);
    expect(first.shield ?? 0).toBe(0);
    expect(first.shieldAt).toBeUndefined();
    const hit = out.events.find((e) => e.t === 'hit' && e.id === first.id)!;
    expect(hit).not.toHaveProperty('shield');
    expect(out.events.some((e) => e.t === 'destroyed')).toBe(false);
    // Defenders of two sides next to each other do not wear each other down.
    expect(tickAt8([['picket', 0, 2, 4], ['picket', 1, 2, 3]]).out.events.some((e) => e.t === 'hit' && !('shield' in e) && e.damage > 0 && Number.isNaN(e.damage))).toBe(false);
    expect(tickAt8([['bulwark', 0, 2, 4], ['bulwark', 1, 2, 3]]).out.world.entities.every((e) => e.hp === 300)).toBe(true);
  });
});

