import { describe, expect, it } from 'vitest';
import {
  BASE_RULESET,
  createWorld,
  DEFAULT_DOCTRINE,
  incomeOfSide,
  isValidWorld,
  MAX_QUEUE,
  MAX_SUPPLY,
  observe,
  resolveTurn,
  STRATEGY_RULESET,
  UNKNOWN_LEFT,
  validateCommand,
  type Command,
  type Scenario,
  type World
} from '../src';
import { open } from './helpers';

const net = STRATEGY_RULESET;
const worldOf = (map: Scenario['map'], entities: Scenario['entities'], supply?: readonly number[]): World =>
  createWorld({ map, sides: 2, entities, seed: 1, ...(supply && { supply }) }, net);
const unit = (w: World, id: number) => w.entities.find((e) => e.id === id)!;
const turn = (w: World, plans: Command[][] = [[], []]) => resolveTurn(w, net, plans);

/** A 12×3 field: post at the left, a deposit at x=3 (in coverage) and one at x=10 (outside). */
const field = (extra: Scenario['entities'] = [], supply?: readonly number[]) =>
  worldOf({ ...open(12, 3), deposits: [{ x: 10, y: 1, left: 300 }, { x: 3, y: 1, left: 40 }] }, [{ side: 0, kind: 'command-post', x: 0, y: 1 }, { side: 1, kind: 'command-post', x: 11, y: 0 }, ...extra], supply);

describe('economy (I6a, D8)', () => {
  it('starts each side with the ruleset supply (or the scenario\'s), keeps deposits sorted by cell, and validates both', () => {
    const w = field();
    expect(w.supply).toEqual([300, 300]);
    expect(w.map.deposits).toEqual([{ x: 3, y: 1, left: 40 }, { x: 10, y: 1, left: 300 }]);
    expect(field([], [50, 70]).supply).toEqual([50, 70]);
    expect(() => field([], [50])).toThrow();
    expect(() => worldOf({ ...open(4, 1), deposits: [{ x: 9, y: 0, left: 10 }] }, [])).toThrow();
    expect(isValidWorld(w, net)).toBe(true);
    expect(isValidWorld({ ...w, supply: undefined }, net)).toBe(false);
    expect(isValidWorld({ ...w, supply: [300] }, net)).toBe(false);
    expect(isValidWorld({ ...w, map: { ...w.map, deposits: [{ x: 10, y: 1, left: 300 }, { x: 3, y: 1, left: 40 }] } }, net)).toBe(false);
    expect(isValidWorld({ ...w, map: { ...w.map, deposits: [{ x: 3, y: 1, left: -1 }] } }, net)).toBe(false);
    // Without an economy, no supply at all.
    const plain = createWorld({ map: open(4, 1), sides: 2, entities: [], seed: 1 }, BASE_RULESET);
    expect(plain.supply).toBeUndefined();
    expect(isValidWorld({ ...plain, supply: [1, 1] }, BASE_RULESET)).toBe(false);
  });

  it('a connected post yields its income on the last tick of a turn; an Extractor only on a deposit inside coverage, running it down', () => {
    const w = field([{ side: 0, kind: 'extractor', x: 3, y: 1 }, { side: 0, kind: 'extractor', x: 10, y: 1 }]);
    expect(incomeOfSide(w, net, 0)).toBe(35);
    expect(incomeOfSide(w, net, 1)).toBe(20);
    const { world, events } = turn(w);
    expect(world.supply).toEqual([335, 320]);
    expect(world.map.deposits).toEqual([{ x: 3, y: 1, left: 25 }, { x: 10, y: 1, left: 300 }]);
    expect(events.filter((e) => e.t === 'income')).toEqual([
      { t: 'income', tick: 6, side: 0, amount: 35 },
      { t: 'income', tick: 6, side: 1, amount: 20 }
    ]);
    // The deposit yields what is left, then nothing.
    const drained = turn(turn(world).world).world;
    expect(drained.map.deposits?.[0]).toEqual({ x: 3, y: 1, left: 0 });
    expect(drained.supply?.[0]).toBe(335 + 35 + 30);
    expect(incomeOfSide(drained, net, 0)).toBe(20);
  });

  it('a yard produces into a free neighbouring cell after the build time, paid when queued; the unit follows the yard\'s doctrine', () => {
    const w = field([{ side: 0, kind: 'muster', x: 2, y: 0 }]);
    unit(w, 3).doctrine = { ...DEFAULT_DOCTRINE, holdFire: true };
    const order: Command = { side: 0, unit: 3, order: { type: 'produce', kind: 'rifles' } };
    // One turn of work: queued at the start of the turn, standing next to the yard at its end.
    const a = turn(w, [[order], []]);
    expect(a.world.supply?.[0]).toBe(300 - 40 + 20);
    expect(a.events.filter((e) => e.t === 'queued')).toEqual([{ t: 'queued', tick: 1, id: 3, kind: 'rifles' }]);
    expect(unit(a.world, 3).order).toEqual({ type: 'hold' }); // one-shot: the standing order is untouched
    expect(a.events.find((e) => e.t === 'produced')).toEqual({ t: 'produced', tick: 6, id: 4, side: 0, kind: 'rifles', x: 3, y: 0, by: 3 });
    expect(unit(a.world, 4)).toMatchObject({ kind: 'rifles', side: 0, doctrine: { ...DEFAULT_DOCTRINE, holdFire: true } });
    expect(unit(a.world, 3).queue).toBeUndefined();
    expect(a.world.nextId).toBe(5);
    expect(a.world.intel?.[0]?.some((r) => r.id === 4)).toBe(true);
    expect(isValidWorld(a.world, net)).toBe(true);
    // Two turns of work (a Warden from a Motor Pool): the head of the queue counts down first.
    const pool = field([{ side: 0, kind: 'motor-pool', x: 2, y: 0 }]);
    const p1 = turn(pool, [[{ side: 0, unit: 3, order: { type: 'produce', kind: 'warden' } }], []]);
    expect(unit(p1.world, 3).queue).toEqual([{ kind: 'warden', left: 1 }]);
    expect(p1.events.some((e) => e.t === 'produced')).toBe(false);
    const p2 = turn(p1.world);
    expect(p2.events.find((e) => e.t === 'produced')).toMatchObject({ t: 'produced', kind: 'warden', by: 3 });
  });

  it('refuses production for the wrong yard, kind, a full queue or empty pockets; a boxed-in yard waits', () => {
    const w = field([{ side: 0, kind: 'muster', x: 2, y: 0 }], [50, 300]);
    const v = (c: Command) => validateCommand(w, net, c);
    expect(v({ side: 0, unit: 3, order: { type: 'produce', kind: 'warden' } })).toEqual({ ok: false, reason: 'cannot-produce' });
    expect(v({ side: 0, unit: 1, order: { type: 'produce', kind: 'rifles' } })).toEqual({ ok: false, reason: 'cannot-produce' });
    expect(v({ side: 0, unit: 3, order: { type: 'produce', kind: 'lancer' } })).toEqual({ ok: false, reason: 'no-supply' });
    expect(v({ side: 0, unit: 3, order: { type: 'produce', kind: 'rifles' } })).toEqual({ ok: true });
    unit(w, 3).queue = Array.from({ length: MAX_QUEUE }, () => ({ kind: 'rifles', left: 1 }));
    expect(v({ side: 0, unit: 3, order: { type: 'produce', kind: 'rifles' } })).toEqual({ ok: false, reason: 'queue-full' });
    expect(isValidWorld(w, net)).toBe(true);
    unit(w, 3).queue?.push({ kind: 'rifles', left: 1 });
    expect(isValidWorld(w, net)).toBe(false);
    // Boxed in: every neighbour taken, the finished unit waits inside.
    const boxed = worldOf(open(3, 3), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'muster', x: 1, y: 1 },
      ...[[1, 0], [2, 0], [0, 1], [2, 1], [0, 2], [1, 2], [2, 2]].map(([x, y]) => ({ side: 0, kind: 'rifles', x: x as number, y: y as number }))
    ]);
    unit(boxed, 2).queue = [{ kind: 'rifles', left: 1 }];
    const after = turn(boxed).world;
    expect(unit(after, 2).queue).toEqual([{ kind: 'rifles', left: 0 }]);
    expect(after.entities).toHaveLength(boxed.entities.length);
  });

  it('a command source places a structure site on a free covered cell; it works once built, Extractors only on live deposits', () => {
    const w = field();
    const v = (c: Command) => validateCommand(w, net, c);
    const build = (kind: string, x: number, y: number): Command => ({ side: 0, unit: 1, order: { type: 'build', kind, x, y } });
    expect(v(build('extractor', 3, 1))).toEqual({ ok: true });
    expect(v(build('extractor', 4, 1))).toEqual({ ok: false, reason: 'not-buildable' }); // no deposit
    expect(v(build('muster', 3, 1))).toEqual({ ok: false, reason: 'not-buildable' }); // deposits are for Extractors
    expect(v(build('extractor', 10, 1))).toEqual({ ok: false, reason: 'not-buildable' }); // outside coverage
    expect(v(build('muster', 0, 1))).toEqual({ ok: false, reason: 'not-buildable' }); // occupied
    expect(v(build('rifles', 2, 1))).toEqual({ ok: false, reason: 'cannot-build' });
    expect(v(build('tower-gun', 2, 1))).toEqual({ ok: false, reason: 'cannot-build' }); // not buildable in strategy (buildTurns 0)
    expect(v(build('muster', 20, 1))).toEqual({ ok: false, reason: 'out-of-bounds' });
    expect(v({ ...build('muster', 2, 1), side: 1, unit: 2 })).toEqual({ ok: false, reason: 'not-buildable' });
    expect(validateCommand({ ...w, supply: [10, 10] }, net, build('extractor', 3, 1))).toEqual({ ok: false, reason: 'no-supply' });
    const a = turn(w, [[build('extractor', 3, 1), build('muster', 2, 0)], []]);
    expect(a.world.supply?.[0]).toBe(300 - 80 - 100 + 20); // the sites yield nothing yet
    const site = unit(a.world, 3);
    expect(site).toMatchObject({ kind: 'extractor', x: 3, y: 1, build: 1, hp: 120 });
    expect(a.events.filter((e) => e.t === 'site')).toHaveLength(2);
    expect(validateCommand(a.world, net, { side: 0, unit: 4, order: { type: 'produce', kind: 'rifles' } })).toEqual({ ok: false, reason: 'cannot-produce' });
    expect(isValidWorld(a.world, net)).toBe(true);
    // Both take two turns: still sites at the end of the first, finished at the end of the second
    // (income is counted before construction finishes, so the Extractor yields from the third).
    const b = turn(a.world);
    expect(unit(b.world, 3).build).toBeUndefined();
    expect(b.events.filter((e) => e.t === 'built').map((e) => e.id)).toEqual([3, 4]);
    expect(b.world.supply?.[0]).toBe(140 + 20);
    expect(turn(b.world).world.supply?.[0]).toBe(160 + 20 + 15);
    expect(validateCommand(b.world, net, { side: 0, unit: 4, order: { type: 'produce', kind: 'rifles' } })).toEqual({ ok: true });
    expect(isValidWorld(b.world, net)).toBe(true);
    // A site under construction is no network node; a Relay Mast (one turn) works from the next turn.
    const relay = turn(w, [[build('relay-mast', 4, 1)], []]).world;
    expect(observe(relay, net, 0).network.nodes).toEqual([1, 3]);
    unit(relay, 3).build = 1;
    expect(observe(relay, net, 0).network.nodes).toEqual([1]);
  });

  it('observations show only the own Supply, no enemy queues, and a deposit\'s remainder only while it is observed', () => {
    const w = field([{ side: 1, kind: 'muster', x: 9, y: 0 }]);
    unit(w, 3).queue = [{ kind: 'rifles', left: 1 }];
    const obs = observe(w, net, 0);
    expect(obs.world.supply).toEqual([300, 0]);
    expect(obs.world.entities.find((e) => e.id === 3)?.queue).toBeUndefined();
    expect(obs.world.map.deposits).toEqual([{ x: 3, y: 1, left: 40 }, { x: 10, y: 1, left: UNKNOWN_LEFT }]);
    // Enemy income is nobody's business: only the own income event is reported.
    const { reported } = turn(w);
    expect(reported?.[0]?.filter((e) => e.t === 'income')).toEqual([{ t: 'income', tick: 6, side: 0, amount: 20 }]);
    expect(reported?.[1]?.filter((e) => e.t === 'income')).toEqual([{ t: 'income', tick: 6, side: 1, amount: 20 }]);
  });

  it('produce and build are commands, never standing orders, and are refused without an economy', () => {
    const w = field();
    unit(w, 1).order = { type: 'produce', kind: 'rifles' } as never;
    expect(isValidWorld(w, net)).toBe(false);
    const plain = createWorld({ map: open(4, 1), sides: 2, entities: [{ side: 0, kind: 'command-post', x: 0, y: 0 }], seed: 1 }, BASE_RULESET);
    expect(validateCommand(plain, BASE_RULESET, { side: 0, unit: 1, order: { type: 'build', kind: 'muster', x: 1, y: 0 } })).toEqual({ ok: false, reason: 'bad-order' });
  });

  it('placements of both sides on one cell in one batch are refused for both, unpaid, whatever the command order', () => {
    const w = worldOf(open(11, 3), [{ side: 0, kind: 'command-post', x: 2, y: 1 }, { side: 1, kind: 'command-post', x: 8, y: 1 }]);
    const c0: Command = { side: 0, unit: 1, order: { type: 'build', kind: 'relay-mast', x: 5, y: 1 } };
    const c1: Command = { side: 1, unit: 2, order: { type: 'build', kind: 'relay-mast', x: 5, y: 1 } };
    for (const plans of [[[c0], [c1]], [[c1], [c0]]]) {
      const { world, events } = turn(w, plans);
      expect(world.entities).toHaveLength(2);
      expect(world.supply).toEqual([320, 320]);
      expect(events.filter((e) => e.t === 'site-blocked').map((e) => e.t === 'site-blocked' && e.side)).toEqual(plans.flat().map((c) => c.side));
    }
  });

  it('placement is judged by what the side knows; a hidden unit on the cell is found only when the order is carried out', () => {
    const w = worldOf(open(20, 3), [
      { side: 0, kind: 'command-post', x: 0, y: 1 },
      { side: 0, kind: 'relay-mast', x: 5, y: 1 },
      { side: 1, kind: 'command-post', x: 19, y: 1 },
      { side: 1, kind: 'rifles', x: 10, y: 1 }
    ]);
    const build: Command = { side: 0, unit: 1, order: { type: 'build', kind: 'relay-mast', x: 10, y: 1 } };
    // (10, 1) lies in side 0's coverage but nobody sees it: the answer must not depend on the hidden rifle.
    expect(w.intel?.[0]?.some((r) => r.id === 4)).toBe(false);
    expect(validateCommand(w, net, build)).toEqual({ ok: true });
    const empty = structuredClone(w);
    empty.entities = empty.entities.filter((e) => e.id !== 4);
    expect(validateCommand(empty, net, build)).toEqual({ ok: true });
    const { world, events, reported } = turn(w, [[build], []]);
    expect(world.entities.some((e) => e.kind === 'relay-mast' && e.x === 10)).toBe(false);
    expect(world.supply?.[0]).toBe(320);
    expect(reported?.[0]?.filter((e) => e.t === 'site-blocked')).toEqual([{ t: 'site-blocked', tick: 1, side: 0, kind: 'relay-mast', x: 10, y: 1 }]);
    expect(reported?.[1]?.some((e) => e.t === 'site-blocked')).toBe(false);
    expect(events.some((e) => e.t === 'site')).toBe(false);
  });

  it('what a yard queues is reported to its own side only, even when the yard is in sight', () => {
    const w = worldOf(open(16, 3), [{ side: 0, kind: 'command-post', x: 1, y: 1 }, { side: 1, kind: 'muster', x: 5, y: 1 }, { side: 1, kind: 'command-post', x: 9, y: 1 }]);
    const { reported } = turn(w, [[], [{ side: 1, unit: 2, order: { type: 'produce', kind: 'lancer' } }]]);
    expect(reported?.[1]?.some((e) => e.t === 'queued')).toBe(true);
    expect(reported?.[0]?.some((e) => e.t === 'queued')).toBe(false);
  });

  it('a yard ringed by units delivers two cells out; Supply is capped; a Field Post places structures only when set up', () => {
    const ring = [[1, 1], [2, 1], [3, 1], [1, 2], [3, 2], [1, 3], [2, 3], [3, 3]].map(([x, y]) => ({ side: 0, kind: 'rifles', x: x as number, y: y as number }));
    const w = worldOf(open(6, 6), [{ side: 0, kind: 'command-post', x: 5, y: 5 }, { side: 0, kind: 'muster', x: 2, y: 2 }, ...ring]);
    unit(w, 2).queue = [{ kind: 'rifles', left: 1 }];
    const produced = turn(w).events.find((e) => e.t === 'produced');
    expect(produced && produced.t === 'produced' && Math.max(Math.abs(produced.x - 2), Math.abs(produced.y - 2))).toBe(2);
    const rich = field([], [MAX_SUPPLY - 5, 0]);
    expect(turn(rich).world.supply?.[0]).toBe(MAX_SUPPLY);
    expect(isValidWorld(turn(rich).world, net)).toBe(true);
    const post = field([{ side: 0, kind: 'field-post', x: 2, y: 1 }]);
    const place: Command = { side: 0, unit: 3, order: { type: 'build', kind: 'muster', x: 2, y: 2 } };
    expect(validateCommand(post, net, place)).toEqual({ ok: false, reason: 'cannot-build' });
    unit(post, 3).deploy = net.ticksPerTurn;
    expect(validateCommand(post, net, place)).toEqual({ ok: true });
  });
});
