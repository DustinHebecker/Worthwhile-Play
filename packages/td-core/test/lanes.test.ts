import { describe, expect, it } from 'vitest';
import { createWorld, spawn, archetypeOf, type World } from '@wp/strategy-engine';
import { chebyshev, removeWalkers, STUN_BUDGET, tickLanes, type LaneRun, type Route } from '../src/lanes';
import { TD_RULESET } from '../src/ruleset';

/** A straight road down column 2 of a 5 × 8 map, plus an air route along it. */
const ROWS = ['bb=bb', 'bb=bb', 'bb=bb', 'bb=bb', 'bb=bb', 'bb=bb', 'bb=bb', 'bb=bb'];
const ROUTES: Route[] = [
  { layer: 'ground', points: [[2, 0], [2, 7]] },
  { layer: 'air', points: [[2, 0], [2, 7]] },
  { layer: 'ground', points: [[2, 7], [2, 0]] }
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
