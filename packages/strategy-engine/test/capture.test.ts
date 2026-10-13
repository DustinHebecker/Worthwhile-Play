import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  canonicalJson,
  createWorld,
  isValidWorld,
  NEUTRAL,
  observe,
  resolveTurn,
  STRATEGY_RULESET,
  validateCommand,
  worldHash,
  type Command,
  type Frame,
  type Ruleset,
  type Scenario,
  type SimEvent,
  type World
} from '../src';
import { arbWorld, open, transformCommands, transformWorld } from './helpers';

/** Capture and elimination (docs/design/strategy.md § 9.4, ADR 0009 amendment). */
const CAPTURE: Ruleset = { ...STRATEGY_RULESET, id: 'strategy-capture-test', capture: true };
const POST_HP = 400;

/** Posts: side 0 left, side 1 right, side 2 (if any) bottom middle; plus `extra`. */
function worldOf(sides: number, extra: Scenario['entities'], options: { teams?: number[] } = {}): World {
  const posts = [{ side: 0, kind: 'command-post', x: 0, y: 0 }, { side: 1, kind: 'command-post', x: 10, y: 0 }, { side: 2, kind: 'command-post', x: 5, y: 6 }].slice(0, sides);
  return createWorld({ map: open(11, 7), sides, entities: [...posts, ...extra], seed: 1, supply: Array.from({ length: sides }, () => 100), ...(options.teams && { teams: options.teams }) }, CAPTURE);
}
const at = (w: World, x: number, y: number) => w.entities.find((e) => e.x === x && e.y === y);
const turn = (w: World, plan: Command[] = []) => resolveTurn(w, CAPTURE, [plan]);
const events = (r: { events: readonly SimEvent[] }, t: SimEvent['t']) => r.events.filter((e) => e.t === t);

describe('capture', () => {
  it('a neutral post goes to the one side with infantry next to it, at the end of the turn, keeping its damage', () => {
    const w = worldOf(2, [{ side: NEUTRAL, kind: 'command-post', x: 5, y: 3 }, { side: 0, kind: 'rifles', x: 4, y: 3 }]);
    const r = turn(w);
    const post = at(r.world, 5, 3)!;
    expect(post.side).toBe(0);
    expect(post.hp).toBeLessThan(POST_HP); // the rifle squad fired on it during the turn
    expect(events(r, 'captured')).toEqual([{ t: 'captured', tick: r.world.tick, id: post.id, kind: 'command-post', x: 5, y: 3, from: NEUTRAL, to: 0 }]);
    expect(isValidWorld(r.world, CAPTURE)).toBe(true);
    // The new owner knows its post; it now earns for it (two posts: 40 a turn).
    expect(r.world.intel![0]!.find((e) => e.id === post.id)?.side).toBe(0);
    const before = r.world.supply![0]!;
    expect(turn(r.world).world.supply![0]).toBe(before + 40);
  });

  it('only infantry claims; a disabled squad or a vehicle does not', () => {
    const vehicle = turn(worldOf(2, [{ side: NEUTRAL, kind: 'command-post', x: 5, y: 3 }, { side: 0, kind: 'outrider', x: 4, y: 3 }])).world;
    expect(at(vehicle, 5, 3)!.side).toBe(NEUTRAL);
    const w = worldOf(2, [{ side: NEUTRAL, kind: 'command-post', x: 5, y: 3 }, { side: 0, kind: 'rifles', x: 4, y: 3 }]);
    at(w, 4, 3)!.status = [{ kind: 'disabled', ticks: 99 }];
    expect(at(turn(w).world, 5, 3)!.side).toBe(NEUTRAL);
  });

  it('two hostile claimants: contested, nobody takes it (no tie-break by side)', () => {
    const r = turn(worldOf(2, [{ side: NEUTRAL, kind: 'command-post', x: 5, y: 3 }, { side: 0, kind: 'rifles', x: 4, y: 3 }, { side: 1, kind: 'rifles', x: 6, y: 3 }]));
    expect(at(r.world, 5, 3)!.side).toBe(NEUTRAL);
    expect(events(r, 'captured')).toEqual([]);
  });

  it('an owned post only below a quarter of its health and with none of its owner\'s units next to it', () => {
    const make = (hp: number, defender: boolean) => {
      const w = worldOf(3, [{ side: 1, kind: 'rifles', x: 5, y: 5 }, ...(defender ? [{ side: 2, kind: 'outrider', x: 6, y: 6 }] : [])]);
      at(w, 5, 6)!.hp = hp;
      return turn(w).world;
    };
    expect(at(make(200, false), 5, 6)!.side).toBe(2); // half health: holds
    expect(at(make(99, true), 5, 6)!.side).toBe(2); // a defender next to it
    const taken = make(99, false);
    expect(at(taken, 5, 6)!.side).toBe(1);
  });

  it('allies do not claim each other\'s posts and count as defenders', () => {
    const w = worldOf(3, [{ side: 1, kind: 'rifles', x: 5, y: 5 }], { teams: [0, 1, 1] });
    at(w, 5, 6)!.hp = 50;
    expect(at(turn(w).world, 5, 6)!.side).toBe(2);
    const w2 = worldOf(3, [{ side: 0, kind: 'rifles', x: 5, y: 5 }, { side: 1, kind: 'rifles', x: 6, y: 6 }], { teams: [0, 1, 1] });
    at(w2, 5, 6)!.hp = 50;
    expect(at(turn(w2).world, 5, 6)!.side).toBe(2);
  });
});

describe('elimination', () => {
  it('a side that owns no post at the end of a turn is out: its pieces go, every side is told, it gives no more orders', () => {
    const w = worldOf(3, [{ side: 1, kind: 'rifles', x: 5, y: 5 }, { side: 2, kind: 'outrider', x: 2, y: 6 }]);
    at(w, 5, 6)!.hp = 50;
    const r = turn(w);
    expect(r.world.out).toEqual([2]);
    expect(r.world.entities.filter((e) => e.side === 2)).toEqual([]);
    expect(events(r, 'eliminated')).toEqual([{ t: 'eliminated', tick: r.world.tick, side: 2 }]);
    for (const side of [0, 1, 2]) expect(r.reported![side]!.some((e) => e.t === 'eliminated' && e.side === 2)).toBe(true);
    expect(r.world.intel![2]).toEqual([]);
    // No report names the side that is out (also not side 0's old report of the post it lost).
    for (const side of [0, 1]) expect(r.world.intel![side]!.some((rep) => rep.side === 2)).toBe(false);
    expect(isValidWorld(r.world, CAPTURE)).toBe(true);
    // The captured post stays (now side 1's); side 2 is out for good.
    const post = at(r.world, 5, 6)!;
    expect(validateCommand(r.world, CAPTURE, { side: 1, unit: post.id, order: { type: 'hold' } }).ok).toBe(true);
    expect(turn(r.world).world.out).toEqual([2]);
  });

  it('the same turn: a side whose own post is captured while it captures another one plays on (elimination after all captures)', () => {
    // Side 2's post falls to side 1 while side 2 takes the neutral post.
    const w = worldOf(3, [{ side: NEUTRAL, kind: 'command-post', x: 2, y: 3 }, { side: 2, kind: 'rifles', x: 2, y: 4 }, { side: 1, kind: 'rifles', x: 5, y: 5 }]);
    at(w, 5, 6)!.hp = 50;
    const r = turn(w);
    expect(at(r.world, 5, 6)!.side).toBe(1);
    expect(at(r.world, 2, 3)!.side).toBe(2);
    expect(r.world.out ?? []).toEqual([]);
    expect(r.world.entities.some((e) => e.side === 2 && e.kind === 'rifles')).toBe(true);
  });

  it('without capture in the ruleset nothing changes hands and nobody is removed (the two-side game)', () => {
    const w = createWorld({ map: open(11, 7), sides: 2, entities: [{ side: 0, kind: 'command-post', x: 0, y: 0 }, { side: 1, kind: 'command-post', x: 10, y: 0 }, { side: 1, kind: 'rifles', x: 1, y: 1 }], seed: 1, supply: [100, 100] }, STRATEGY_RULESET);
    w.entities[0]!.hp = 10;
    const after = resolveTurn(w, STRATEGY_RULESET, [[]]).world;
    expect(after.out).toBeUndefined();
    expect(after.entities.filter((e) => e.side === 0).every((e) => e.kind === 'command-post' ? e.side === 0 : true)).toBe(true);
  });
});

describe('what a capture reveals', () => {
  it('a third side with only an old report of the post learns nothing: its report keeps the old owner, no event', () => {
    const w = worldOf(3, [{ side: NEUTRAL, kind: 'command-post', x: 8, y: 6 }, { side: 1, kind: 'rifles', x: 8, y: 5 }]);
    // Side 0 (far left) knows the neutral post from the start (structures are known) but does not see it.
    expect(w.intel![0]!.find((r) => r.x === 8 && r.y === 6)?.side).toBe(NEUTRAL);
    const r = turn(w);
    expect(at(r.world, 8, 6)!.side).toBe(1);
    expect(r.world.intel![0]!.find((rep) => rep.x === 8 && rep.y === 6)?.side).toBe(NEUTRAL);
    expect(r.reported![0]!.some((e) => e.t === 'captured')).toBe(false);
    expect(observe(r.world, CAPTURE, 0).world.entities.find((e) => e.x === 8 && e.y === 6)?.side).toBe(NEUTRAL);
    // The capturer and a side that sees the cell are told.
    expect(r.reported![1]!.some((e) => e.t === 'captured')).toBe(true);
    expect(isValidWorld(r.world, CAPTURE)).toBe(true);
  });

  it('the old owner is told, also out of sight', () => {
    const w = worldOf(3, [{ side: 1, kind: 'rifles', x: 5, y: 5 }, { side: 2, kind: 'command-post', x: 10, y: 6 }]);
    at(w, 5, 6)!.hp = 50;
    const r = turn(w);
    expect(r.reported![2]!.some((e) => e.t === 'captured' && e.from === 2 && e.to === 1)).toBe(true);
    expect(r.world.intel![2]!.find((rep) => rep.x === 5 && rep.y === 6)?.side).toBe(1);
  });
});

describe('save validation', () => {
  it('rejects pieces of a side that is out, an unsorted out list, and a live report with the wrong owner', () => {
    const w = worldOf(3, [{ side: 1, kind: 'rifles', x: 5, y: 5 }]);
    at(w, 5, 6)!.hp = 50;
    const r = turn(w).world;
    expect(isValidWorld({ ...r, out: [2, 2] }, CAPTURE)).toBe(false);
    expect(isValidWorld({ ...r, out: [5] }, CAPTURE)).toBe(false);
    expect(isValidWorld({ ...r, out: [1, 2] }, CAPTURE)).toBe(false); // side 1 still has pieces
    const live = structuredClone(r);
    const report = live.intel![1]!.find((rep) => rep.live && rep.kind === 'command-post' && rep.x === 5);
    if (report) {
      report.side = 2;
      expect(isValidWorld(live, CAPTURE)).toBe(false);
    }
  });
});

describe('capture keeps the engine invariants', () => {
  const play = (world: World, plans: readonly Command[][]): World => plans.reduce((w, plan) => resolveTurn(w, CAPTURE, [plan]).world, world);
  const FOUR: Frame[] = ['id', 'r270', 'r180', 'r90'];
  const quarter = (n: number) => (x: number, y: number) => [n - 1 - y, x] as const;
  const next = (s: number) => (s + 1) % 4;

  it('P1 determinism and valid saves with captures and eliminations (3 and 4 sides, neutral posts)', () => {
    for (const sides of [3, 4]) {
      fc.assert(
        fc.property(arbWorld({ sides, neutral: true, supply: 300, ruleset: CAPTURE }), ({ world, plans }) => {
          const a = play(world, plans);
          expect(worldHash(a)).toBe(worldHash(play(structuredClone(world), structuredClone(plans))));
          expect(isValidWorld(a, CAPTURE)).toBe(true);
        }),
        { numRuns: 40 }
      );
    }
  });

  it('P6: the order of four sides\' plans does not change captures or eliminations', () => {
    fc.assert(
      fc.property(arbWorld({ sides: 4, neutral: true, supply: 300, ruleset: CAPTURE }), fc.array(fc.nat(3), { minLength: 4, maxLength: 4 }), ({ world, plans }, keys) => {
        const order = [0, 1, 2, 3].sort((a, b) => (keys[a] ?? 0) - (keys[b] ?? 0) || a - b);
        const bySides = (plan: readonly Command[], sides: readonly number[]) => sides.flatMap((s) => plan.filter((c) => c.side === s));
        expect(canonicalJson(play(world, plans.map((p) => bySides(p, order))))).toBe(canonicalJson(play(world, plans.map((p) => bySides(p, [0, 1, 2, 3])))));
      }),
      { numRuns: 60 }
    );
  });

  it('P4 under a quarter turn with captures: four sides around neutral posts, infantry next to them', () => {
    fc.assert(
      fc.property(fc.array(fc.record({ side: fc.integer({ min: 0, max: 3 }), x: fc.integer({ min: 1, max: 5 }), y: fc.integer({ min: 1, max: 5 }) }), { maxLength: 6 }), fc.array(fc.record({ x: fc.integer({ min: 1, max: 5 }), y: fc.integer({ min: 1, max: 5 }), hp: fc.integer({ min: 1, max: 400 }) }), { maxLength: 3 }), (squads, posts) => {
        const used = new Set(['0,0', '6,0', '6,6', '0,6']);
        const entities: { side: number; kind: string; x: number; y: number }[] = [{ side: 0, kind: 'command-post', x: 0, y: 0 }, { side: 1, kind: 'command-post', x: 6, y: 0 }, { side: 2, kind: 'command-post', x: 6, y: 6 }, { side: 3, kind: 'command-post', x: 0, y: 6 }];
        const put = (side: number, kind: string, x: number, y: number) => {
          if (used.has(`${x},${y}`)) return;
          used.add(`${x},${y}`);
          entities.push({ side, kind, x, y });
        };
        for (const p of posts) put(NEUTRAL, 'command-post', p.x, p.y);
        for (const s of squads) put(s.side, 'rifles', s.x, s.y);
        const w = createWorld({ map: open(7, 7), sides: 4, frames: FOUR, entities, seed: 1, supply: [100, 100, 100, 100] }, CAPTURE);
        posts.forEach((p) => {
          const e = w.entities.find((q) => q.x === p.x && q.y === p.y && q.side === NEUTRAL);
          if (e) e.hp = p.hp;
        });
        const plans: Command[][] = [[], []];
        const direct = transformWorld(play(w, plans), quarter(7), next);
        const turned = play(transformWorld(w, quarter(7), next), plans.map((p) => transformCommands(p, quarter(7), next)));
        expect(canonicalJson(turned)).toBe(canonicalJson(direct));
      }),
      { numRuns: 200 }
    );
  });
});
