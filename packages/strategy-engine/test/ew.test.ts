import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  cellOf,
  computeNetwork,
  createWorld,
  EMITTER_EXPOSURE,
  isValidWorld,
  resolveTurn,
  revealedEmitters,
  STRATEGY_RULESET,
  validateCommand,
  type Command,
  type Scenario,
  type SimEvent,
  type World
} from '../src';
import { DEFAULT_DOCTRINE } from '../src';
import { open } from './helpers';

const rs = STRATEGY_RULESET;
const worldOf = (map: Scenario['map'], entities: Scenario['entities']): World => createWorld({ map, sides: 2, entities, seed: 1 }, rs);
const unit = (w: World, id: number) => w.entities.find((e) => e.id === id)!;
/** Marks the given units as set up (a full turn of deploying). */
const setUp = (w: World, ...ids: number[]): World => {
  const c = structuredClone(w);
  for (const id of ids) Object.assign(unit(c, id), { order: { type: 'hold' }, deploy: rs.ticksPerTurn });
  delete c.intel; // rebuilt from the new state on the next tick
  return c;
};
const covered = (w: World, side: number, x: number, y: number) => computeNetwork(w, rs, side).coverage[cellOf(w.map, x, y)] === 1;
const play = (w: World, n: number, first: Command[] = []): { world: World; events: SimEvent[] } => {
  let world = w;
  const events: SimEvent[] = [];
  for (let i = 0; i < n; i++) {
    const r = resolveTurn(world, rs, [i === 0 ? first : []]);
    events.push(...r.events);
    world = r.world;
  }
  return { world, events };
};

describe('electronic warfare (I4, § 6)', () => {
  // Side 0: post at 0, mast truck at 5 (relay radius 5 → covers up to x = 10). Side 1: jammer at 8.
  const scene = () =>
    worldOf(open(20, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'mast-truck', x: 5, y: 0 },
      { side: 0, kind: 'rifles', x: 9, y: 0 },
      { side: 1, kind: 'jammer', x: 8, y: 0 },
      { side: 1, kind: 'command-post', x: 19, y: 0 },
      { side: 0, kind: 'tracer', x: 1, y: 0 }
    ]);

  it('a set-up jammer cuts enemy relays and coverage within its radius; packed up it does nothing', () => {
    const relayOnly = setUp(scene(), 2);
    expect(covered(relayOnly, 0, 9, 0)).toBe(true);
    expect(computeNetwork(relayOnly, rs, 0).nodes).toContain(2);
    const jammed = setUp(scene(), 2, 4);
    expect(computeNetwork(jammed, rs, 0).nodes).not.toContain(2); // the mast at 5 is within 3 of the jammer
    expect(covered(jammed, 0, 9, 0)).toBe(false);
    expect(validateCommand(jammed, rs, { side: 0, unit: 3, order: { type: 'hold' } })).toEqual({ ok: false, reason: 'out-of-contact' });
    // The own side's network is never jammed by its own jammer.
    expect(covered(jammed, 1, 19, 0)).toBe(true);
    // A disabled jammer does nothing.
    const stunned = structuredClone(jammed);
    unit(stunned, 4).status = [{ kind: 'disabled', ticks: 3 }];
    expect(computeNetwork(stunned, rs, 0).nodes).toContain(2);
  });

  it('a jammer next to a Command Post silences it: no coverage, no orders', () => {
    const w = setUp(
      worldOf(open(12, 1), [
        { side: 0, kind: 'command-post', x: 0, y: 0 },
        { side: 1, kind: 'jammer', x: 2, y: 0 },
        { side: 1, kind: 'command-post', x: 11, y: 0 }
      ]),
      2
    );
    const net = computeNetwork(w, rs, 0);
    expect(net.slots).toBe(0);
    expect(net.coverage.every((c) => c === 0)).toBe(true);
  });

  it('burn-through: a Tracer within 2 of the jammed relay restores it and the cells around it', () => {
    const w = setUp(scene(), 2, 4);
    expect(covered(w, 0, 6, 0)).toBe(false);
    unit(w, 6).x = 4; // tracer next to the mast truck
    expect(computeNetwork(w, rs, 0).nodes).toContain(2);
    // Only cells within the burn-through radius are freed; the rest of the jam field stays cut off.
    expect(covered(w, 0, 6, 0)).toBe(true);
    expect(covered(w, 0, 9, 0)).toBe(false);
  });

  it('a working jammer gives itself away within EMITTER_EXPOSURE, even out of sight', () => {
    const w = setUp(
      worldOf(open(20, 1), [
        { side: 0, kind: 'command-post', x: 0, y: 0 },
        { side: 1, kind: 'jammer', x: EMITTER_EXPOSURE, y: 0 },
        { side: 1, kind: 'command-post', x: 19, y: 0 }
      ]),
      2
    );
    expect(revealedEmitters(w, rs, 0).has(2)).toBe(true);
    const packed = structuredClone(w);
    delete unit(packed, 2).deploy;
    expect(revealedEmitters(packed, rs, 0).has(2)).toBe(false);
    const far = structuredClone(w);
    unit(far, 2).x = EMITTER_EXPOSURE + 1;
    expect(revealedEmitters(far, rs, 0).has(2)).toBe(false);
    // Revealed means reported: after a tick the side holds a live report and may target it.
    const after = play(w, 1).world;
    expect(after.intel?.[0]?.find((r) => r.id === 2)?.live).toBe(true);
  });

  it('a Tracer locates enemy relays and posts within its radius', () => {
    const w = setUp(
      worldOf(open(24, 1), [
        { side: 0, kind: 'command-post', x: 0, y: 0 },
        { side: 0, kind: 'tracer', x: 4, y: 0 },
        { side: 1, kind: 'relay-mast', x: 12, y: 0 },
        { side: 1, kind: 'command-post', x: 17, y: 0 },
        { side: 1, kind: 'rifles', x: 11, y: 0 }
      ])
    );
    const found = revealedEmitters(w, rs, 0);
    expect(found.has(3)).toBe(true); // mast at distance 8
    expect(found.has(4)).toBe(false); // post at distance 13
    expect(found.has(5)).toBe(false); // rifles are no emitter
  });

  it("the 'emitters' priority shoots a jammer before nearer rifles", () => {
    const w = setUp(
      worldOf(open(12, 3), [
        { side: 0, kind: 'command-post', x: 0, y: 1 },
        { side: 0, kind: 'warden', x: 3, y: 1 },
        { side: 1, kind: 'rifles', x: 4, y: 1 },
        { side: 1, kind: 'jammer', x: 6, y: 1 },
        { side: 1, kind: 'command-post', x: 11, y: 1 }
      ]),
      4
    );
    unit(w, 2).doctrine = { ...DEFAULT_DOCTRINE, priority: 'emitters' };
    const fire = play(w, 1).events.find((e) => e.t === 'fire' && e.id === 2);
    expect(fire && 'target' in fire ? fire.target : undefined).toBe(4);
  });

  it('a jammer is set up with a deploy order like a mast truck; the world stays valid', () => {
    const w = worldOf(open(12, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'jammer', x: 2, y: 0 },
      { side: 1, kind: 'command-post', x: 11, y: 0 }
    ]);
    expect(validateCommand(w, rs, { side: 0, unit: 2, order: { type: 'deploy' } })).toEqual({ ok: true });
    expect(validateCommand(w, rs, { side: 0, unit: 1, order: { type: 'deploy' } })).toEqual({ ok: false, reason: 'bad-order' });
    const after = play(w, 1, [{ side: 0, unit: 2, order: { type: 'deploy' } }]).world;
    expect(unit(after, 2).deploy).toBe(rs.ticksPerTurn);
    expect(isValidWorld(JSON.parse(JSON.stringify(after)), rs)).toBe(true);
  });

  it('P6: adding a working enemy jammer never grows coverage; adding an own Tracer never shrinks it', () => {
    fc.assert(
      fc.property(fc.nat(9), fc.nat(9), fc.nat(9), fc.nat(9), fc.nat(9), fc.nat(9), (rx, ry, jx, jy, tx, ty) => {
        const cells = new Set([`0,0`, `${rx},${ry}`, `${jx},${jy}`, `${tx},${ty}`]);
        fc.pre(cells.size === 4);
        const base: Scenario['entities'] = [
          { side: 0, kind: 'command-post', x: 0, y: 0 },
          { side: 0, kind: 'relay-mast', x: rx, y: ry }
        ];
        const before = computeNetwork(worldOf(open(10, 10), base), rs, 0).coverage;
        const jammed = setUp(worldOf(open(10, 10), [...base, { side: 1, kind: 'jammer', x: jx, y: jy }]), 3);
        const withJam = computeNetwork(jammed, rs, 0).coverage;
        expect(withJam.every((c, i) => c <= (before[i] ?? 0))).toBe(true);
        const traced = setUp(worldOf(open(10, 10), [...base, { side: 1, kind: 'jammer', x: jx, y: jy }, { side: 0, kind: 'tracer', x: tx, y: ty }]), 3);
        const withTracer = computeNetwork(traced, rs, 0).coverage;
        expect(withJam.every((c, i) => c <= (withTracer[i] ?? 0))).toBe(true);
      }),
      { numRuns: 300 }
    );
  });
});
