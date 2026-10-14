import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  archetypeOf,
  BASE_RULESET,
  canonicalJson,
  cellOf,
  computeNetwork,
  createWorld,
  observe,
  observedCells,
  passable,
  resolveTurn,
  revealedEmitters,
  STRATEGY_RULESET,
  type Scenario,
  type World
} from '../src';
import { arbScenario, open } from './helpers';

const rs = STRATEGY_RULESET;
const worldOf = (map: Scenario['map'], entities: Scenario['entities']): World => createWorld({ map, sides: 2, entities, seed: 1 }, rs);
const asText = (o: ReturnType<typeof observe>) =>
  canonicalJson({ world: o.world, ghosts: [...o.ghosts], coverage: [...o.network.coverage], slots: o.network.slots, nodes: o.network.nodes, jammed: [...o.jammed] });

describe('observe (AI input, § 11)', () => {
  it('holds own units as they are and enemies only as reported, without their orders', () => {
    const w = worldOf(open(20, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'rifles', x: 3, y: 0, order: { type: 'move', x: 9, y: 0 } },
      { side: 1, kind: 'rifles', x: 6, y: 0, order: { type: 'move', x: 0, y: 0 } },
      { side: 1, kind: 'warden', x: 15, y: 0 },
      { side: 1, kind: 'command-post', x: 19, y: 0 }
    ]);
    const o = observe(w, rs, 0);
    expect(o.world.entities.find((e) => e.id === 2)).toEqual(w.entities.find((e) => e.id === 2));
    expect(o.world.entities.find((e) => e.id === 3)).toMatchObject({ x: 6, order: { type: 'hold' } });
    expect(o.world.entities.some((e) => e.id === 4)).toBe(false); // the Warden is not seen
    expect(o.ghosts.get(5)).toBe(0); // the enemy post is known from before the battle
    expect(o.world.intel?.[1]).toEqual([]);
    expect([...o.network.coverage]).toEqual([...computeNetwork(w, rs, 0).coverage]);
  });

  it('without fog knows every enemy, still without orders', () => {
    const w = createWorld({ map: open(10, 1), sides: 2, seed: 1, entities: [
      { side: 0, kind: 'rifles', x: 0, y: 0 },
      { side: 1, kind: 'rifles', x: 9, y: 0, order: { type: 'move', x: 0, y: 0 } }
    ] }, BASE_RULESET);
    const o = observe(w, BASE_RULESET, 0);
    expect(o.world.entities.find((e) => e.id === 2)).toMatchObject({ x: 9, order: { type: 'hold' } });
    expect(o.ghosts.size).toBe(0);
  });

  it('P8: changing enemy units a side does not observe never changes its observation', () => {
    fc.assert(
      fc.property(arbScenario, fc.nat(1000), fc.nat(99), ({ world, plans }, pick, cell) => {
        let w: World = { ...world, ruleset: rs.id };
        delete w.intel;
        for (const plan of plans.slice(0, 2)) w = resolveTurn(w, rs, [plan]).world;
        for (const side of [0, 1]) {
          const reported = new Set((w.intel?.[side] ?? []).map((r) => r.id));
          const hidden = w.entities.filter((e) => e.side !== side && !reported.has(e.id));
          if (hidden.length === 0) continue;
          const before = asText(observe(w, rs, side));
          const changed = structuredClone(w);
          const unit = changed.entities.find((e) => e.id === hidden[pick % hidden.length]!.id)!;
          unit.order = { type: 'move', x: cell % w.map.w, y: Math.floor(cell / w.map.w) % w.map.h };
          unit.hp = Math.max(1, unit.hp - 1);
          // Its position may change too, as long as it stays unobserved (and its cell free) and
          // it is not a working EW unit (a side feels jamming); unseen enemy shots are invisible.
          const observed = observedCells(w, rs, side);
          const tx = cell % w.map.w;
          const ty = Math.floor(cell / w.map.w) % w.map.h;
          const free = passable(w.map, rs, tx, ty, archetypeOf(rs, unit.kind)?.layer ?? 'ground') && !changed.entities.some((e) => e.x === tx && e.y === ty);
          if (free && observed[cellOf(w.map, tx, ty)] !== 1 && !archetypeOf(rs, unit.kind)?.ew && !revealedEmitters(w, rs, side).has(unit.id)) {
            unit.x = tx;
            unit.y = ty;
          }
          changed.projectiles.push({ id: changed.nextId++, side: unit.side, kind: 'howitzer', x: 0, y: 0, ticks: 2 });
          expect(asText(observe(changed, rs, side))).toBe(before);
          // Presence too (PR #29 review): the unseen unit not there at all changes nothing either.
          const without = structuredClone(w);
          without.entities = without.entities.filter((e) => e.id !== unit.id || revealedEmitters(w, rs, side).has(e.id) || !!archetypeOf(rs, e.kind)?.ew);
          expect(asText(observe(without, rs, side))).toBe(before);
        }
      }),
      { numRuns: 150 }
    );
  });
});

describe('observe: own shells (backlog of PR #21)', () => {
  it('keeps an own shell only while its landing cell is observed: a shot fired out of contact does not tell where the target stood', () => {
    const w = worldOf(open(30, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'howitzer', x: 20, y: 0 },
      { side: 1, kind: 'command-post', x: 29, y: 0 }
    ]);
    const seen = cellOf(w.map, 2, 0);
    const unseen = cellOf(w.map, 25, 0);
    const observed = observedCells(w, rs, 0);
    expect([observed[seen], observed[unseen]]).toEqual([1, 0]);
    w.projectiles.push({ id: w.nextId++, side: 0, kind: 'howitzer', x: 2, y: 0, ticks: 2 });
    w.projectiles.push({ id: w.nextId++, side: 0, kind: 'howitzer', x: 25, y: 0, ticks: 2 });
    const o = observe(w, rs, 0);
    expect(o.world.projectiles.map((p) => p.x)).toEqual([2]);
    // Its id is not given away by the id counter either.
    expect(o.world.nextId).toBe(w.nextId - 1);
    // Without fog every own shell is known.
    expect(observe({ ...w, ruleset: BASE_RULESET.id }, BASE_RULESET, 0).world.projectiles).toHaveLength(2);
  });

  it('P8 for shells: where an own shell lands in a cell the side does not observe never changes its observation', () => {
    fc.assert(
      fc.property(arbScenario, fc.nat(999), ({ world, plans }, cell) => {
        let w: World = { ...world, ruleset: rs.id };
        delete w.intel;
        for (const plan of plans.slice(0, 2)) w = resolveTurn(w, rs, [plan]).world;
        for (const side of [0, 1]) {
          const observed = observedCells(w, rs, side);
          const unseen = [...observed.keys()].filter((c) => observed[c] !== 1);
          if (unseen.length < 2) continue;
          const at = (c: number) => ({ x: c % w.map.w, y: Math.floor(c / w.map.w) });
          const a = structuredClone(w);
          const b = structuredClone(w);
          a.projectiles.push({ id: a.nextId++, side, kind: 'howitzer', ...at(unseen[cell % unseen.length]!), ticks: 2 });
          b.projectiles.push({ id: b.nextId++, side, kind: 'howitzer', ...at(unseen[(cell + 1) % unseen.length]!), ticks: 2 });
          expect(asText(observe(a, rs, side))).toBe(asText(observe(b, rs, side)));
        }
      }),
      { numRuns: 100 }
    );
  });
});

describe('observe: felt jamming (review of PR #10, N1)', () => {
  it('marks jammed cells only within reach of the own connected nodes', () => {
    const w = worldOf(open(20, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 1, kind: 'jammer', x: 6, y: 0 },
      { side: 1, kind: 'command-post', x: 19, y: 0 }
    ]);
    Object.assign(w.entities.find((e) => e.id === 2)!, { order: { type: 'hold' }, deploy: rs.ticksPerTurn });
    const o = observe(w, rs, 0);
    // Cells 3..5 are within the post's reach (5) and jammed (jammer radius 3 → 3..9); 6..9 are beyond reach.
    expect([...o.jammed.slice(0, 10)]).toEqual([0, 0, 0, 1, 1, 1, 0, 0, 0, 0]);
    expect(o.network.coverage[4]).toBe(0);
  });
});
