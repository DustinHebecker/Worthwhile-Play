import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  cellOf,
  computeNetwork,
  createWorld,
  isCommandable,
  runTicks,
  resolveTurn,
  STRATEGY_RULESET,
  validateCommand,
  type Command,
  type Scenario,
  type World
} from '../src';
import { mapOf, open } from './helpers';

const rs = STRATEGY_RULESET;
const worldOf = (map: Scenario['map'], entities: Scenario['entities']): World => createWorld({ map, sides: 2, entities, seed: 1 }, rs);
const covered = (w: World, side: number, x: number, y: number) => computeNetwork(w, rs, side).coverage[cellOf(w.map, x, y)] === 1;
const move = (side: number, unit: number, x: number, y: number): Command => ({ side, unit, order: { type: 'move', x, y } });
const deployed = (w: World) => w.entities.map((e) => ({ ...e, deploy: rs.ticksPerTurn }));

describe('command network', () => {
  it('a source covers its radius (squared distance) and contributes its order slots', () => {
    const w = worldOf(open(14, 1), [{ side: 0, kind: 'command-post', x: 0, y: 0 }]);
    const net = computeNetwork(w, rs, 0);
    expect(covered(w, 0, 5, 0)).toBe(true);
    expect(covered(w, 0, 6, 0)).toBe(false);
    expect(net.slots).toBe(4);
    expect(net.nodes).toEqual([1]);
    expect(computeNetwork(w, rs, 1).slots).toBe(0);
  });

  it('relays extend coverage only when linked: distance within the smaller radius (D5)', () => {
    // Command post radius 5, relay mast radius 6: link needs distance ≤ 5.
    const linked = worldOf(open(20, 1), [{ side: 0, kind: 'command-post', x: 0, y: 0 }, { side: 0, kind: 'relay-mast', x: 5, y: 0 }]);
    expect(covered(linked, 0, 11, 0)).toBe(true);
    expect(computeNetwork(linked, rs, 0).nodes).toEqual([1, 2]);
    const apart = worldOf(open(20, 1), [{ side: 0, kind: 'command-post', x: 0, y: 0 }, { side: 0, kind: 'relay-mast', x: 6, y: 0 }]);
    expect(covered(apart, 0, 11, 0)).toBe(false);
    expect(computeNetwork(apart, rs, 0).nodes).toEqual([1]);
  });

  it('a relay without a connected source covers nothing; enemy nodes never count', () => {
    const w = worldOf(open(10, 1), [{ side: 0, kind: 'relay-mast', x: 0, y: 0 }, { side: 1, kind: 'command-post', x: 3, y: 0 }]);
    expect(computeNetwork(w, rs, 0).coverage.every((c) => c === 0)).toBe(true);
    expect(covered(w, 1, 0, 0)).toBe(true);
  });

  it('static relays on hills reach further', () => {
    const flat = worldOf(open(20, 1), [{ side: 0, kind: 'command-post', x: 0, y: 0 }, { side: 0, kind: 'relay-mast', x: 5, y: 0 }]);
    const hill = worldOf(mapOf('.....h..............'), [{ side: 0, kind: 'command-post', x: 0, y: 0 }, { side: 0, kind: 'relay-mast', x: 5, y: 0 }]);
    expect(covered(flat, 0, 12, 0)).toBe(false);
    expect(covered(hill, 0, 13, 0)).toBe(true);
  });

  it('mobile relays work only after a full turn of deploying, and stop when moving again', () => {
    const w = worldOf(open(20, 1), [{ side: 0, kind: 'command-post', x: 0, y: 0 }, { side: 0, kind: 'mast-truck', x: 4, y: 0 }]);
    expect(covered(w, 0, 9, 0)).toBe(false);
    const deploying = resolveTurn(w, rs, [[{ side: 0, unit: 2, order: { type: 'deploy' } }]]).world;
    expect(deploying.entities[1]!.deploy).toBe(rs.ticksPerTurn);
    expect(deploying.entities[1]!.x).toBe(4);
    expect(covered(deploying, 0, 9, 0)).toBe(true);
    const moving = runTicks(deploying, rs, [move(0, 2, 3, 0)], 1).world;
    expect(moving.entities[1]!.deploy ?? 0).toBe(0);
    expect(covered(moving, 0, 9, 0)).toBe(false);
  });

  it('only units inside coverage accept orders (validateCommand and simulation)', () => {
    const w = worldOf(open(14, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'rifles', x: 4, y: 0 },
      { side: 0, kind: 'rifles', x: 8, y: 0 }
    ]);
    expect(isCommandable(w, rs, w.entities[1]!)).toBe(true);
    expect(isCommandable(w, rs, w.entities[2]!)).toBe(false);
    expect(validateCommand(w, rs, move(0, 3, 9, 0))).toEqual({ ok: false, reason: 'out-of-contact' });
    const { world } = runTicks(w, rs, [move(0, 2, 2, 0), move(0, 3, 9, 0)], 1);
    expect(world.entities[1]!.order).toEqual({ type: 'move', x: 2, y: 0 });
    expect(world.entities[2]!.order).toEqual({ type: 'hold' });
  });

  it('applies at most the order slots per side and batch, in plan order (D4)', () => {
    const units = [1, 2, 3, 4, 5].map((x) => ({ side: 0, kind: 'rifles', x, y: 0 }));
    const w = worldOf(open(8, 3), [{ side: 0, kind: 'command-post', x: 0, y: 0 }, ...units]);
    const plan = [6, 5, 4, 3, 2].map((id) => ({ side: 0, unit: id, order: { type: 'move', x: id, y: 2 } }) as Command);
    const { world, events } = runTicks(w, rs, plan, 1);
    expect(events.filter((e) => e.t === 'order').map((e) => e.id)).toEqual([6, 5, 4, 3]);
    expect(world.entities.find((e) => e.id === 2)!.order).toEqual({ type: 'hold' });
  });

  it('the base ruleset (Tower Defense) does not gate orders', () => {
    const w = createWorld({ map: open(14, 1), sides: 2, entities: [{ side: 0, kind: 'rifles', x: 8, y: 0 }], seed: 1 }, { ...rs, commandNetwork: false });
    expect(validateCommand(w, { ...rs, commandNetwork: false }, move(0, 1, 9, 0))).toEqual({ ok: true });
  });

  it('deploy is only valid for units that need it', () => {
    const w = worldOf(open(5, 1), [{ side: 0, kind: 'command-post', x: 0, y: 0 }, { side: 0, kind: 'rifles', x: 1, y: 0 }, { side: 0, kind: 'mast-truck', x: 2, y: 0 }]);
    expect(validateCommand(w, rs, { side: 0, unit: 2, order: { type: 'deploy' } })).toEqual({ ok: false, reason: 'bad-order' });
    expect(validateCommand(w, rs, { side: 0, unit: 3, order: { type: 'deploy' } })).toEqual({ ok: true });
  });

  it('P6 monotonicity: adding a relay never shrinks coverage', () => {
    fc.assert(
      fc.property(fc.nat(9), fc.nat(9), fc.nat(9), fc.nat(9), fc.constantFrom('relay-mast', 'mast-truck', 'kite'), (cx, cy, rx, ry, kind) => {
        fc.pre(cx !== rx || cy !== ry);
        const base = worldOf(open(10, 10), [{ side: 0, kind: 'command-post', x: cx, y: cy }]);
        const more = worldOf(open(10, 10), [{ side: 0, kind: 'command-post', x: cx, y: cy }, { side: 0, kind, x: rx, y: ry }]);
        const a = computeNetwork(base, rs, 0).coverage;
        const b = computeNetwork({ ...more, entities: deployed(more) }, rs, 0).coverage;
        expect(a.every((c, i) => c <= (b[i] ?? 0))).toBe(true);
      }),
      { numRuns: 200 }
    );
  });
});
