import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { BASE_RULESET, canonicalJson, computeNetwork, createWorld, observe, resolveTurn, STRATEGY_RULESET, type Scenario, type World } from '../src';
import { arbScenario, open } from './helpers';

const rs = STRATEGY_RULESET;
const worldOf = (map: Scenario['map'], entities: Scenario['entities']): World => createWorld({ map, sides: 2, entities, seed: 1 }, rs);
const asText = (o: ReturnType<typeof observe>) =>
  canonicalJson({ world: o.world, ghosts: [...o.ghosts], coverage: [...o.network.coverage], slots: o.network.slots, nodes: o.network.nodes });

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
          expect(asText(observe(changed, rs, side))).toBe(before);
        }
      }),
      { numRuns: 150 }
    );
  });
});
