import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  canonicalJson,
  createWorld,
  initialIntel,
  isValidWorld,
  NEUTRAL,
  observe,
  resolveTurn,
  runTicks,
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

describe('after a capture (review of PR #22)', () => {
  it('nobody fires on the post it just took: the new owner\'s attack orders on it end at once', () => {
    // Side 1 shoots side 2's post down (lancer, inside its radio cover, ordered to attack) while its squad stands next to it.
    const w = worldOf(3, [{ side: 1, kind: 'rifles', x: 5, y: 5 }, { side: 1, kind: 'lancer', x: 7, y: 4 }]);
    at(w, 5, 6)!.hp = 90;
    const lancer = at(w, 7, 4)!;
    const r1 = turn(w, [{ side: 1, unit: lancer.id, order: { type: 'attack', target: at(w, 5, 6)!.id } }]);
    const post = at(r1.world, 5, 6)!;
    expect(post.side).toBe(1);
    expect(r1.events.some((e) => e.t === 'order' && e.id === lancer.id)).toBe(true);
    expect(r1.world.entities.find((e) => e.id === lancer.id)!.order).toEqual({ type: 'hold' });
    expect(r1.events.some((e) => e.t === 'order-ended' && e.id === lancer.id && e.reason === 'lost-target')).toBe(true);
    let world = r1.world;
    for (let i = 0; i < 3; i++) world = turn(world).world;
    expect(at(world, 5, 6)!.hp).toBe(post.hp);
  });

  it('an ally drops its attack order on a post its ally took (it sees the post) and does not fire on it', () => {
    // Sides 0 and 1 are allies; side 0's lancer (in its radio cover, in sight of the post) attacks side 2's post.
    const w = createWorld(
      { map: open(16, 7), sides: 3, teams: [0, 0, 1], entities: [{ side: 0, kind: 'command-post', x: 9, y: 2 }, { side: 1, kind: 'command-post', x: 15, y: 0 }, { side: 2, kind: 'command-post', x: 5, y: 6 }, { side: 1, kind: 'rifles', x: 5, y: 5 }, { side: 0, kind: 'lancer', x: 7, y: 4 }], seed: 1, supply: [100, 100, 100] },
      CAPTURE
    );
    at(w, 5, 6)!.hp = 50;
    const lancer = at(w, 7, 4)!;
    const r = turn(w, [{ side: 0, unit: lancer.id, order: { type: 'attack', target: at(w, 5, 6)!.id } }]);
    expect(r.events.some((e) => e.t === 'order' && e.id === lancer.id)).toBe(true);
    expect(at(r.world, 5, 6)!.side).toBe(1);
    const r2 = turn(r.world);
    expect(r2.events.some((e) => e.t === 'order-ended' && e.id === lancer.id && e.reason === 'lost-target')).toBe(true);
    expect(r2.events.some((e) => e.t === 'fire' && e.id === lancer.id)).toBe(false);
    expect(at(r2.world, 5, 6)!.hp).toBe(at(r.world, 5, 6)!.hp);
  });

  it('a capture clears the post\'s doctrine and order', () => {
    const w = worldOf(3, [{ side: 1, kind: 'rifles', x: 5, y: 5 }]);
    const post = at(w, 5, 6)!;
    post.hp = 50;
    post.doctrine = { retreatBelow: 0, priority: 'nearest', seekCover: false, holdFire: true, lostContact: 'keep' };
    const after = at(turn(w).world, 5, 6)!;
    expect(after.side).toBe(1);
    expect(after.order).toEqual({ type: 'hold' });
    expect(after.doctrine).toBeUndefined();
  });

  it('only movable units defend a post: its owner\'s mast or yard next to it does not', () => {
    const w = worldOf(3, [{ side: 1, kind: 'rifles', x: 5, y: 5 }, { side: 2, kind: 'relay-mast', x: 4, y: 6 }, { side: 2, kind: 'muster', x: 6, y: 6 }]);
    at(w, 5, 6)!.hp = 50;
    expect(at(turn(w).world, 5, 6)!.side).toBe(1);
  });

  it('exactly a quarter of its health still holds; one point less is taken', () => {
    // The claimant holds fire (it is not hit), so the post's health stays exactly as set.
    const make = (hp: number) => {
      const w = worldOf(3, [{ side: 1, kind: 'rifles', x: 5, y: 5 }]);
      w.entities.find((e) => e.kind === 'rifles')!.doctrine = { retreatBelow: 0, priority: 'nearest', seekCover: false, holdFire: true, lostContact: 'keep' };
      at(w, 5, 6)!.hp = hp;
      return at(turn(w).world, 5, 6)!;
    };
    expect(make(100)).toMatchObject({ hp: 100, side: 2 });
    expect(make(99)).toMatchObject({ hp: 99, side: 1 });
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

  it('the old owner is told, also out of sight (its other post is too far to see the lost one)', () => {
    const w = createWorld(
      { map: open(24, 7), sides: 3, entities: [{ side: 0, kind: 'command-post', x: 0, y: 0 }, { side: 1, kind: 'command-post', x: 12, y: 0 }, { side: 2, kind: 'command-post', x: 5, y: 6 }, { side: 2, kind: 'command-post', x: 23, y: 6 }, { side: 1, kind: 'rifles', x: 5, y: 5 }], seed: 1, supply: [100, 100, 100] },
      CAPTURE
    );
    at(w, 5, 6)!.hp = 50;
    const r = turn(w);
    expect(at(r.world, 5, 6)!.side).toBe(1);
    // Side 2 no longer observes (5, 6): it is told by the event and its report, not by sight.
    expect(r.world.intel![2]!.find((rep) => rep.x === 5 && rep.y === 6)).toMatchObject({ side: 1, live: false });
    expect(r.reported![2]!.some((e) => e.t === 'captured' && e.from === 2 && e.to === 1)).toBe(true);
    expect(r.world.out ?? []).toEqual([]);
  });

  it('observe() tells every side which sides are out', () => {
    const w = worldOf(3, [{ side: 1, kind: 'rifles', x: 5, y: 5 }]);
    at(w, 5, 6)!.hp = 50;
    const r = turn(w);
    for (const side of [0, 1]) expect(observe(r.world, CAPTURE, side).world.out).toEqual([2]);
  });
});

describe('no leaks through captures and eliminations (3+ sides)', () => {
  it('property: a capture is told only to the old or new owner or a side that observes the post; an elimination names only the side', () => {
    for (const sides of [3, 4]) {
      fc.assert(
        fc.property(arbWorld({ sides, neutral: true, supply: 300, ruleset: CAPTURE }), ({ world, plans }) => {
          let w = world;
          // Tick by tick: what a side may be told is judged against what it knew before or after that tick
          // (an elimination at the end of a turn drops reports of pieces the side did see that tick).
          for (const plan of plans) {
            for (let t = 0; t < CAPTURE.ticksPerTurn; t++) {
              const r = runTicks(w, CAPTURE, t === 0 ? plan : [], 1);
              for (let side = 0; side < sides; side++) {
                const knew = new Set([...(w.intel?.[side] ?? []), ...r.world.intel![side]!].map((rep) => rep.id));
                const live = new Set(r.world.intel![side]!.filter((rep) => rep.live).map((rep) => rep.id));
                const own = (id: number) => w.entities.some((u) => u.id === id && u.side === side);
                for (const e of r.reported![side]!) {
                  if (e.t === 'captured') expect(e.from === side || e.to === side || live.has(e.id), `side ${side} told of capture of ${e.id}`).toBe(true);
                  if (e.t === 'eliminated') expect(Object.keys(e).sort()).toEqual(['side', 't', 'tick']);
                  // A shot told to a side is its own, at its own unit, or at a unit it knows of.
                  if (e.t === 'fire') expect(own(e.id) || own(e.target) || knew.has(e.target), `side ${side} told of a shot at ${e.target}`).toBe(true);
                }
              }
              w = r.world;
            }
            w = { ...w, turn: w.turn + 1 };
          }
        }),
        { numRuns: 80 }
      );
    }
  });

  it('property over dense capture worlds (3 and 4 sides): captures are told only to the owners or an observer', () => {
    for (const sides of [3, 4]) {
      fc.assert(
        fc.property(arbDense(sides), ({ world, plans }) => {
          let w = world;
          for (const plan of plans) {
            for (let t = 0; t < CAPTURE.ticksPerTurn; t++) {
              const r = runTicks(w, CAPTURE, t === 0 ? plan : [], 1);
              for (let side = 0; side < sides; side++) {
                const live = new Set(r.world.intel![side]!.filter((rep) => rep.live).map((rep) => rep.id));
                for (const e of r.reported![side]!) {
                  if (e.t === 'captured') expect(e.from === side || e.to === side || live.has(e.id)).toBe(true);
                  if (e.t === 'eliminated') expect(Object.keys(e).sort()).toEqual(['side', 't', 'tick']);
                }
              }
              w = r.world;
            }
            w = { ...w, turn: w.turn + 1 };
          }
        }),
        { numRuns: 120 }
      );
    }
  });

  it('a capture next to a side that sees it is told to that side too (the post\'s cell is observed)', () => {
    // Side 2's scout watches from two cells off (a vehicle: it does not claim); side 1 is far away.
    const w = worldOf(3, [{ side: NEUTRAL, kind: 'command-post', x: 5, y: 3 }, { side: 0, kind: 'rifles', x: 4, y: 3 }, { side: 2, kind: 'outrider', x: 7, y: 3 }]);
    const r = turn(w);
    expect(at(r.world, 5, 3)!.side).toBe(0);
    expect(r.reported![2]!.some((e) => e.t === 'captured' && e.to === 0)).toBe(true);
    expect(r.reported![1]!.some((e) => e.t === 'captured')).toBe(false);
  });
});

describe('save validation', () => {
  it('an elimination removes the side\'s shells in flight; a save may not keep them, nor reports for that side', () => {
    const w = worldOf(3, [{ side: 1, kind: 'rifles', x: 5, y: 5 }]);
    at(w, 5, 6)!.hp = 50;
    w.projectiles.push({ id: w.nextId++, side: 2, kind: 'howitzer', x: 9, y: 3, ticks: 99 });
    const r = turn(w).world;
    expect(r.out).toEqual([2]);
    expect(r.projectiles.filter((p) => p.side === 2)).toEqual([]);
    expect(isValidWorld({ ...r, projectiles: [{ id: r.nextId, side: 2, kind: 'howitzer', x: 9, y: 3, ticks: 5 }], nextId: r.nextId + 1 }, CAPTURE)).toBe(false);
    const told = structuredClone(r);
    told.intel![2] = [{ ...told.intel![0]![0]!, live: false }];
    expect(isValidWorld(told, CAPTURE)).toBe(false);
  });

  it('only a post may keep a stale owner in an old report', () => {
    const w = worldOf(3, [{ side: 1, kind: 'rifles', x: 5, y: 5 }, { side: 1, kind: 'rifles', x: 9, y: 2 }]);
    const report = w.intel![0]!.find((rep) => rep.kind === 'command-post' && rep.x === 10)!;
    const stalePost = structuredClone(w);
    stalePost.intel![0]!.find((rep) => rep.id === report.id)!.side = 2;
    stalePost.intel![0]!.find((rep) => rep.id === report.id)!.live = false;
    expect(isValidWorld(stalePost, CAPTURE)).toBe(true);
    const squad = w.entities.find((e) => e.kind === 'rifles' && e.x === 9)!;
    const staleSquad = structuredClone(w);
    staleSquad.intel![0] = [...staleSquad.intel![0]!.filter((rep) => rep.id !== squad.id), { id: squad.id, side: 2, kind: 'rifles', x: 9, y: 2, hp: 40, tick: 0, live: false }].sort((a, b) => a.id - b.id);
    expect(isValidWorld(staleSquad, CAPTURE)).toBe(false);
  });

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

/**
 * Dense capture worlds (review of PR #22): small square maps, posts of random sides (neutral too)
 * at 1–160 health, mostly infantry (some disabled), random attack orders — about one capture in
 * every two worlds, so the properties below see many captures, contested posts and eliminations.
 */
const FOUR_FRAMES: Frame[] = ['id', 'r270', 'r180', 'r90'];
function arbDense(sides: number) {
  const cell = (n: number) => fc.record({ x: fc.nat(n - 1), y: fc.nat(n - 1) });
  return fc.integer({ min: 5, max: 8 }).chain((n) =>
    fc
      .record({
        posts: fc.array(fc.record({ side: fc.integer({ min: -1, max: sides - 1 }), at: cell(n), hp: fc.integer({ min: 1, max: 160 }) }), { minLength: 2, maxLength: 6 }),
        units: fc.array(fc.record({ side: fc.nat(sides - 1), kind: fc.constantFrom('rifles', 'rifles', 'rifles', 'lancer', 'outrider'), at: cell(n), disabled: fc.boolean() }), { minLength: 2, maxLength: 10 }),
        orders: fc.array(fc.record({ unit: fc.nat(30), target: fc.nat(30) }), { maxLength: 6 })
      })
      .map(({ posts, units, orders }) => {
        const used = new Set<string>();
        const entities: Scenario['entities'][number][] = [];
        const put = (e: Scenario['entities'][number]) => {
          if (used.has(`${e.x},${e.y}`)) return;
          used.add(`${e.x},${e.y}`);
          entities.push(e);
        };
        for (const p of posts) put({ side: p.side, kind: 'command-post', x: p.at.x, y: p.at.y });
        for (const u of units) put({ side: u.side, kind: u.kind, x: u.at.x, y: u.at.y });
        const world = createWorld({ map: open(n, n), sides, entities, seed: 1, supply: Array.from({ length: sides }, () => 100), ...(sides === 4 && { frames: FOUR_FRAMES }) }, CAPTURE);
        posts.forEach((p) => {
          const e = world.entities.find((q) => q.kind === 'command-post' && q.x === p.at.x && q.y === p.at.y);
          if (e) e.hp = Math.min(e.hp, p.hp);
        });
        units.forEach((u) => {
          const e = world.entities.find((q) => q.kind !== 'command-post' && q.x === u.at.x && q.y === u.at.y);
          if (e && u.disabled) e.status = [{ kind: 'disabled', ticks: 3 }];
        });
        world.intel = initialIntel(world, CAPTURE);
        const ids = world.entities.map((e) => e.id);
        const plan: Command[] = orders.flatMap((o) => {
          const unit = world.entities[o.unit % world.entities.length]!;
          return unit.side === NEUTRAL ? [] : [{ side: unit.side, unit: unit.id, order: { type: 'attack', target: ids[o.target % ids.length]! } } as Command];
        });
        return { world, plans: [plan, [], []] };
      })
  );
}

describe('dense capture worlds: invariants and no leaks', () => {
  const play = (world: World, plans: readonly Command[][]): World => plans.reduce((w, plan) => resolveTurn(w, CAPTURE, [plan]).world, world);
  const quarter = (n: number) => (x: number, y: number) => [n - 1 - y, x] as const;
  const next = (s: number) => (s + 1) % 4;

  it('the generator is dense: many captures and eliminations', () => {
    let captures = 0;
    let eliminated = 0;
    const samples = fc.sample(arbDense(4), { numRuns: 200, seed: 3 });
    for (const { world, plans } of samples) {
      let w = world;
      for (const plan of plans) {
        const r = resolveTurn(w, CAPTURE, [plan]);
        captures += r.events.filter((e) => e.t === 'captured').length;
        eliminated += r.events.filter((e) => e.t === 'eliminated').length;
        w = r.world;
      }
    }
    expect(captures / samples.length).toBeGreaterThan(0.3);
    expect(eliminated).toBeGreaterThan(0);
  });

  it('P1, valid saves and P6 (any order of the four sides\' plans)', () => {
    fc.assert(
      fc.property(arbDense(4), fc.array(fc.nat(3), { minLength: 4, maxLength: 4 }), ({ world, plans }, keys) => {
        const a = play(world, plans);
        expect(worldHash(a)).toBe(worldHash(play(structuredClone(world), structuredClone(plans))));
        expect(isValidWorld(a, CAPTURE)).toBe(true);
        const order = [0, 1, 2, 3].sort((x, y) => (keys[x] ?? 0) - (keys[y] ?? 0) || x - y);
        const bySides = (plan: readonly Command[], list: readonly number[]) => list.flatMap((s) => plan.filter((c) => c.side === s));
        expect(canonicalJson(play(world, plans.map((p) => bySides(p, order))))).toBe(canonicalJson(a));
      }),
      { numRuns: 200 }
    );
  });

  it('P4 under a quarter turn, captures and eliminations included (sides out are carried along)', () => {
    fc.assert(
      fc.property(arbDense(4), ({ world, plans }) => {
        const n = world.map.w;
        const direct = transformWorld(play(world, plans), quarter(n), next);
        const turned = play(transformWorld(world, quarter(n), next), plans.map((p) => transformCommands(p, quarter(n), next)));
        expect(canonicalJson(turned)).toBe(canonicalJson(direct));
      }),
      { numRuns: 200 }
    );
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
