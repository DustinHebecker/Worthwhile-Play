import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  BASE_RULESET,
  canBeNeutral,
  canonicalJson,
  computeNetwork,
  createWorld,
  frameCell,
  frameDirs,
  frameIndexIn,
  FRAMES,
  frameVector,
  hostile,
  incomeOf,
  isValidWorld,
  NEUTRAL,
  observe,
  resolveTurn,
  revealedEmitters,
  runTicks,
  STRATEGY_RULESET,
  teamOf,
  validateCommand,
  worldHash,
  type Command,
  type Frame,
  type Order,
  type Ruleset,
  type Scenario,
  type SimEvent,
  type World
} from '../src';
import { arbWorld, open, transformCommands, transformWorld } from './helpers';

/**
 * Several sides (ADR 0009 amendment, docs/design/strategy.md § 9.4): teams and hostility,
 * neutral Command Posts, per-side frames, and the engine invariants for 3–8 sides.
 */
const RUNS = { numRuns: 60 };
/** See the fingerprint test below (computed with the engine of main at 30f9646). */
const TWO_SIDE_FINGERPRINT = '72b5b82d';
const play = (world: World, plans: readonly Command[][], rs = BASE_RULESET): World => plans.reduce((w, plan) => resolveTurn(w, rs, [plan]).world, world);

describe('teams and hostility', () => {
  it('free-for-all by default; teams make sides allies; neutral is hostile to everyone but never an ally', () => {
    const ffa = {};
    expect(hostile(ffa, 0, 1)).toBe(true);
    expect(hostile(ffa, 2, 2)).toBe(false);
    const teams = { teams: [0, 1, 0, 1] };
    expect(hostile(teams, 0, 2)).toBe(false);
    expect(hostile(teams, 1, 3)).toBe(false);
    expect(hostile(teams, 0, 3)).toBe(true);
    for (const w of [ffa, teams]) {
      expect(hostile(w, 0, NEUTRAL)).toBe(true);
      expect(hostile(w, NEUTRAL, 3)).toBe(true);
      expect(hostile(w, NEUTRAL, NEUTRAL)).toBe(false);
      expect(teamOf(w, NEUTRAL)).toBe(NEUTRAL);
    }
    expect(teamOf(teams, 2)).toBe(0);
    expect(teamOf(ffa, 2)).toBe(2);
  });

  it('allies do not fire on each other, do not jam each other and cannot be ordered to attack each other', () => {
    const scenario = { map: open(6, 3), sides: 3, entities: [{ side: 0, kind: 'rifles', x: 1, y: 1 }, { side: 2, kind: 'rifles', x: 2, y: 1 }, { side: 1, kind: 'rifles', x: 5, y: 1 }], seed: 1 };
    const allied = createWorld({ ...scenario, teams: [0, 1, 0] }, BASE_RULESET);
    const after = resolveTurn(allied, BASE_RULESET, [[]]).world;
    expect(after.entities.filter((e) => e.side !== 1).map((e) => e.hp)).toEqual([40, 40]);
    expect(validateCommand(allied, BASE_RULESET, { side: 0, unit: 1, order: { type: 'attack', target: 2 } })).toEqual({ ok: false, reason: 'bad-target' });
    // Without teams the same neighbours fight.
    const ffa = resolveTurn(createWorld(scenario, BASE_RULESET), BASE_RULESET, [[]]).world;
    expect(ffa.entities.filter((e) => e.side !== 1).some((e) => e.hp < 40)).toBe(true);
    // An allied jammer does not cut the own network; a hostile one does (set up: it works).
    const cover = (jammer: boolean, teams?: number[]) => {
      const w = createWorld({ map: open(9, 3), sides: 2, entities: [{ side: 0, kind: 'command-post', x: 0, y: 1 }, ...(jammer ? [{ side: 1, kind: 'jammer', x: 3, y: 1 }] : [])], seed: 1, ...(teams && { teams }) }, STRATEGY_RULESET);
      if (jammer) w.entities[1]!.deploy = STRATEGY_RULESET.ticksPerTurn;
      return computeNetwork(w, STRATEGY_RULESET, 0).coverage.reduce((n, v) => n + v, 0);
    };
    expect(cover(true, [0, 0])).toBe(cover(false));
    expect(cover(true)).toBeLessThan(cover(false));
  });

  it('allies are spared by splash, and an allied jammer is not located like an enemy one', () => {
    // A shell aimed at side 2's squad lands next to side 1's: spared when allied with the shooter.
    const shell = (teams?: number[]) => {
      // Unarmed structures, so only the shells do damage.
      const w = createWorld({ map: open(8, 3), sides: 3, entities: [{ side: 0, kind: 'howitzer', x: 0, y: 1 }, { side: 2, kind: 'muster', x: 5, y: 1 }, { side: 1, kind: 'muster', x: 6, y: 1 }], seed: 1, ...(teams && { teams }) }, BASE_RULESET);
      const after = play(w, [[{ side: 0, unit: 1, order: { type: 'attack', target: 2 } }], [], []]);
      return after.entities.find((e) => e.side === 1)?.hp ?? 0;
    };
    expect(shell([0, 0, 1])).toBe(200);
    expect(shell()).toBeLessThan(200);
    // A working jammer of an ally near the side's units is not located as an emitter; an enemy one is.
    const located = (teams?: number[]) => {
      const w = createWorld({ map: open(12, 3), sides: 2, entities: [{ side: 0, kind: 'command-post', x: 0, y: 1 }, { side: 0, kind: 'rifles', x: 1, y: 1 }, { side: 1, kind: 'jammer', x: 8, y: 1 }], seed: 1, ...(teams && { teams }) }, STRATEGY_RULESET);
      w.entities[2]!.deploy = STRATEGY_RULESET.ticksPerTurn;
      return revealedEmitters(w, STRATEGY_RULESET, 0).has(3);
    };
    expect(located()).toBe(true);
    expect(located([0, 0])).toBe(false);
  });
});

describe('no leaks between opponents in the events a side is told (review of PR #21)', () => {
  const FOG: Ruleset = { ...BASE_RULESET, id: 'fog-test', fog: true };
  it('a side that sees a shooter does not learn the id or cell of a third side\'s unseen target', () => {
    // Side 0's squad sees side 1's gun (2 cells off, inside its minimum range); side 1's scout
    // spots side 2's squad far beyond side 0's sight, and the gun shells it.
    const w = createWorld(
      { map: open(16, 3), sides: 3, entities: [{ side: 0, kind: 'rifles', x: 2, y: 1 }, { side: 1, kind: 'howitzer', x: 4, y: 1 }, { side: 1, kind: 'outrider', x: 8, y: 1 }, { side: 2, kind: 'warden', x: 10, y: 1 }], seed: 1 },
      FOG
    );
    let world = w;
    const told: SimEvent[] = [];
    for (let i = 0; i < 3; i++) {
      const r = resolveTurn(world, FOG, [i === 0 ? [{ side: 1, unit: 2, order: { type: 'attack', target: 4 } }] : []]);
      told.push(...r.reported![0]!);
      world = r.world;
    }
    // The gun did fire at side 2's unit, and side 0 saw the gun.
    expect(world.entities.find((e) => e.id === 4)!.hp).toBeLessThan(140);
    const mentions = (e: SimEvent) => ('target' in e && e.target === 4) || ('id' in e && e.id === 4) || ('x' in e && e.x === 10 && e.y === 1);
    expect(told.filter(mentions)).toEqual([]);
  });

  it('direct fire: a side that sees a squad firing does not learn of the third side\'s unseen target', () => {
    const FOG2: Ruleset = { ...BASE_RULESET, id: 'fog-test', fog: true };
    // Side 0 (x=1, sight 4) sees side 1's squad at x=5, not side 2's at x=7 that it fires on.
    const w = createWorld({ map: open(12, 3), sides: 3, entities: [{ side: 0, kind: 'rifles', x: 1, y: 1 }, { side: 1, kind: 'rifles', x: 5, y: 1 }, { side: 2, kind: 'rifles', x: 7, y: 1 }], seed: 1 }, FOG2);
    const r = resolveTurn(w, FOG2, [[{ side: 1, unit: 2, order: { type: 'attack', target: 3 } }]]);
    expect(r.events.some((e) => e.t === 'fire' && e.id === 2 && e.target === 3)).toBe(true);
    expect(r.reported![0]!.filter((e) => (e.t === 'fire' && e.target === 3) || ('id' in e && e.id === 3))).toEqual([]);
  });

  it('an own shell towards a cell the side no longer observes is told nowhere: not in the reports, not in observe() (review of PR #28)', () => {
    const FOG3: Ruleset = { ...BASE_RULESET, id: 'fog-test', fog: true };
    // Side 0's gun (sight 3) shells side 1's warden that side 0's squad spots; the warden kills the
    // squad in the same tick, so at the end of it side 0 no longer sees the warden's cell.
    const w = createWorld({ map: open(9, 3), sides: 2, entities: [{ side: 0, kind: 'howitzer', x: 0, y: 1 }, { side: 0, kind: 'rifles', x: 5, y: 1 }, { side: 1, kind: 'warden', x: 6, y: 1 }], seed: 1 }, FOG3);
    w.entities[1]!.hp = 1;
    const r = runTicks(w, FOG3, [{ side: 0, unit: 1, order: { type: 'attack', target: 3 } }], 1);
    expect(r.world.entities.some((e) => e.id === 2)).toBe(false);
    const shot = r.events.find((e) => e.t === 'launch' && e.id === 1);
    expect(shot).toMatchObject({ x: 6, y: 1 });
    expect(r.reported![0]!.some((e) => e.t === 'launch')).toBe(false);
    expect(observe(r.world, FOG3, 0).world.projectiles).toEqual([]);
    expect(JSON.stringify(r.reported![0])).not.toContain('"x":6,"y":1');
    // The same shot while the squad survives (the cell observed): told, and the shell is known.
    const seen = structuredClone(w);
    seen.entities[1]!.hp = 40;
    const s = runTicks(seen, FOG3, [{ side: 0, unit: 1, order: { type: 'attack', target: 3 } }], 1);
    expect(s.reported![0]!.some((e) => e.t === 'launch' && e.id === 1)).toBe(true);
    expect(observe(s.world, FOG3, 0).world.projectiles).toHaveLength(1);
  });

  it('two sides are told exactly what they were told before several sides existed (fingerprint of every report list, review of PR #21)', () => {
    // Fixed random two-side worlds (seeded sample), every turn's report lists and the final world.
    // The expected fingerprint was produced by the engine before teams, neutral posts and the shot
    // filter (main at 30f9646): own shots (the shooter dying in the same tick, the target slipping
    // out of sight) and shots at own units must still be told as before. Since the PR #28 review an
    // own shell towards a cell the side does not observe is no longer told; none of these sampled
    // worlds has one, so the fingerprint stands.
    let h = 0x811c9dc5;
    const feed = (text: string) => {
      for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0;
    };
    for (const { world, plans } of fc.sample(arbWorld({ sides: 2, supply: 300 }), { numRuns: 400, seed: 7 })) {
      let w = world;
      for (const plan of plans) {
        const r = resolveTurn(w, STRATEGY_RULESET, [plan]);
        feed(canonicalJson(r.reported));
        w = r.world;
      }
      feed(canonicalJson(w));
    }
    expect(h.toString(16)).toBe(TWO_SIDE_FINGERPRINT);
  });

  it('property: every shot told to a side names an own unit or one the side knows of (3 sides)', () => {
    fc.assert(
      fc.property(arbWorld({ sides: 3, supply: 300 }), ({ world, plans }) => {
        let w = world;
        for (const plan of plans) {
          const own = new Set(w.entities.filter((e) => e.side === 0).map((e) => e.id));
          const r = resolveTurn(w, STRATEGY_RULESET, [plan]);
          const known = new Set([...own, ...r.world.intel![0]!.map((rep) => rep.id), ...r.reported![0]!.filter((e) => e.t === 'destroyed').map((e) => (e as { id: number }).id)]);
          for (const e of r.reported![0]!) if (e.t === 'fire') expect(known.has(e.target), `fire at ${e.target}`).toBe(true);
          w = r.world;
        }
      }),
      { numRuns: 150 }
    );
  });
});

describe('neutral Command Posts', () => {
  const neutralWorld = () =>
    createWorld(
      { map: open(7, 3), sides: 2, entities: [{ side: 0, kind: 'command-post', x: 0, y: 1 }, { side: NEUTRAL, kind: 'command-post', x: 3, y: 1 }, { side: 1, kind: 'command-post', x: 6, y: 1 }, { side: 0, kind: 'rifles', x: 2, y: 1 }], seed: 1, supply: [100, 100] },
      STRATEGY_RULESET
    );

  it('only Command Posts can stand neutral; the world validates', () => {
    const w = neutralWorld();
    expect(isValidWorld(w, STRATEGY_RULESET)).toBe(true);
    expect(isValidWorld(JSON.parse(JSON.stringify(w)), STRATEGY_RULESET)).toBe(true);
    expect(() => createWorld({ map: open(4, 1), sides: 2, entities: [{ side: NEUTRAL, kind: 'rifles', x: 0, y: 0 }], seed: 1 }, BASE_RULESET)).toThrow(RangeError);
    expect(() => createWorld({ map: open(4, 1), sides: 2, entities: [{ side: -2, kind: 'command-post', x: 0, y: 0 }], seed: 1 }, BASE_RULESET)).toThrow(RangeError);
    const bad = structuredClone(w);
    bad.entities[3]!.side = NEUTRAL;
    expect(isValidWorld(bad, STRATEGY_RULESET)).toBe(false);
  });

  it('takes no orders, earns nothing, covers nothing, never moves or fires — and can be fired on', () => {
    let w = neutralWorld();
    const post = w.entities.find((e) => e.side === NEUTRAL)!;
    expect(validateCommand(w, STRATEGY_RULESET, { side: NEUTRAL, unit: post.id, order: { type: 'hold' } })).toEqual({ ok: false, reason: 'not-yours' });
    // It is no node of anybody's network.
    for (const side of [0, 1]) expect(computeNetwork(w, STRATEGY_RULESET, side).nodes).not.toContain(post.id);
    const supply = [...w.supply!];
    for (let i = 0; i < 3; i++) w = resolveTurn(w, STRATEGY_RULESET, [[]]).world;
    // Income goes to the two posts' owners only (20 a turn each).
    expect(w.supply).toEqual(supply.map((s) => s + 3 * 20));
    expect(incomeOf(w, STRATEGY_RULESET, w.entities.find((e) => e.side === NEUTRAL)!, computeNetwork(w, STRATEGY_RULESET, 0))).toBe(0);
    const after = w.entities.find((e) => e.side === NEUTRAL)!;
    expect([after.x, after.y]).toEqual([3, 1]);
    // The rifle squad next to it fires on it on its own.
    expect(after.hp).toBeLessThan(400);
    expect(w.entities.find((e) => e.kind === 'rifles')!.hp).toBe(40);
    expect(isValidWorld(w, STRATEGY_RULESET)).toBe(true);
  });

  it('is reported to every side as a neutral structure, never as anybody\'s own', () => {
    const w = neutralWorld();
    for (const side of [0, 1]) {
      const report = w.intel![side]!.find((r) => r.kind === 'command-post' && r.x === 3);
      expect(report?.side).toBe(NEUTRAL);
      expect(observe(w, STRATEGY_RULESET, side).world.entities.some((e) => e.side === NEUTRAL)).toBe(true);
    }
  });
});

describe('setup and save validation for several sides', () => {
  const base = { map: open(5, 2), entities: [{ side: 0, kind: 'command-post', x: 0, y: 0 }], seed: 1 };
  it('createWorld checks sides, teams and frames', () => {
    expect(() => createWorld({ ...base, sides: 0 }, BASE_RULESET)).toThrow(RangeError);
    expect(() => createWorld({ ...base, sides: 9 }, BASE_RULESET)).toThrow(RangeError);
    expect(() => createWorld({ ...base, sides: 8 }, BASE_RULESET)).not.toThrow();
    expect(() => createWorld({ ...base, sides: 2, teams: [0] }, BASE_RULESET)).toThrow(RangeError);
    expect(() => createWorld({ ...base, sides: 2, teams: [0, 8] }, BASE_RULESET)).toThrow(RangeError);
    expect(() => createWorld({ ...base, sides: 2, teams: [0, 1.5] }, BASE_RULESET)).toThrow(RangeError);
    expect(createWorld({ ...base, sides: 2, teams: [3, 3] }, BASE_RULESET).teams).toEqual([3, 3]);
    expect(() => createWorld({ ...base, sides: 2, frames: ['id'] }, BASE_RULESET)).toThrow(RangeError);
    expect(() => createWorld({ ...base, sides: 2, frames: ['id', 'r45' as Frame] }, BASE_RULESET)).toThrow(RangeError);
    expect(createWorld({ ...base, sides: 2, frames: ['id', 'fy'] }, BASE_RULESET).frames).toEqual(['id', 'fy']);
    expect(() => createWorld({ ...base, sides: 2, entities: [{ side: NEUTRAL, kind: 'command-post', x: 0, y: 0, order: { type: 'move', x: 1, y: 0 } }] }, BASE_RULESET)).toThrow(RangeError);
  });

  it('only immobile, unarmed command sources may stand neutral', () => {
    const arch = BASE_RULESET.archetypes['command-post']!;
    expect(canBeNeutral(arch)).toBe(true);
    expect(canBeNeutral(BASE_RULESET.archetypes['field-post'])).toBe(false); // a source, but it drives
    expect(canBeNeutral(BASE_RULESET.archetypes['relay-mast'])).toBe(false); // immobile, but a relay
    expect(canBeNeutral({ ...arch, speed: 1 })).toBe(false);
    expect(canBeNeutral({ ...arch, weapon: BASE_RULESET.archetypes.rifles!.weapon! })).toBe(false);
    expect(canBeNeutral(undefined)).toBe(false);
  });

  it('isValidWorld checks teams, frames, neutral kinds and what a neutral post may carry', () => {
    const w = createWorld({ map: open(7, 3), sides: 2, teams: [0, 1], frames: ['id', 'r180'], entities: [{ side: 0, kind: 'command-post', x: 0, y: 1 }, { side: NEUTRAL, kind: 'command-post', x: 3, y: 1 }, { side: 1, kind: 'command-post', x: 6, y: 1 }], seed: 1, supply: [0, 0] }, STRATEGY_RULESET);
    expect(isValidWorld(w, STRATEGY_RULESET)).toBe(true);
    const bad = (change: (c: World) => void) => {
      const c = structuredClone(w);
      change(c);
      return isValidWorld(c, STRATEGY_RULESET);
    };
    expect(bad((c) => (c.teams = [0]))).toBe(false);
    expect(bad((c) => (c.teams = [0, 8]))).toBe(false);
    expect(bad((c) => (c.frames = ['id']))).toBe(false);
    expect(bad((c) => (c.frames = ['id', 'r45' as Frame]))).toBe(false);
    const neutral = (c: World) => c.entities.find((e) => e.side === NEUTRAL)!;
    expect(bad((c) => (neutral(c).order = { type: 'move', x: 1, y: 1 }))).toBe(false);
    expect(bad((c) => (neutral(c).doctrine = { retreatBelow: 0, priority: 'weakest', seekCover: false, holdFire: false, lostContact: 'keep' }))).toBe(false);
    expect(bad((c) => (neutral(c).deploy = 1))).toBe(false);
    // A neutral entity of any other kind, in the world or in a report.
    // (Everything else about the entity stays consistent, so only the neutral rule can reject it.)
    const asKind = (c: World, kind: string) => {
      const e = neutral(c);
      e.kind = kind;
      e.hp = 50;
      for (const list of c.intel ?? []) for (const r of list) if (r.id === e.id) Object.assign(r, { kind, hp: 50 });
    };
    expect(bad((c) => asKind(c, 'command-post'))).toBe(true);
    expect(bad((c) => asKind(c, 'relay-mast'))).toBe(false);
    expect(
      bad((c) => {
        const r = c.intel![0]!.find((rep) => rep.side === NEUTRAL)!;
        c.entities = c.entities.filter((e) => e.id !== r.id);
        r.kind = 'rifles';
        r.hp = 1;
        r.live = false;
      })
    ).toBe(false);
  });

  it('observe() carries teams and frames: the observation judges allies and ties like the world', () => {
    const w = createWorld({ map: open(6, 3), sides: 3, teams: [0, 1, 0], frames: ['id', 'fx', 'r180'], entities: [{ side: 0, kind: 'rifles', x: 1, y: 1 }, { side: 2, kind: 'rifles', x: 2, y: 1 }, { side: 1, kind: 'rifles', x: 5, y: 1 }], seed: 1 }, BASE_RULESET);
    const obs = observe(w, BASE_RULESET, 0);
    expect(obs.world.teams).toEqual([0, 1, 0]);
    expect(obs.world.frames).toEqual(['id', 'fx', 'r180']);
    const attackAlly: Command = { side: 0, unit: 1, order: { type: 'attack', target: 2 } };
    expect(validateCommand(obs.world, BASE_RULESET, attackAlly)).toEqual(validateCommand(w, BASE_RULESET, attackAlly));
  });
});

describe('frames', () => {
  it('frameIndexIn and frameCell are inverse bijections for every frame and map size', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 9 }), fc.integer({ min: 1, max: 9 }), fc.constantFrom(...FRAMES), (w, h, frame) => {
        const seen = new Set<number>();
        for (let c = 0; c < w * h; c++) {
          const i = frameIndexIn({ w, h }, frame, c);
          expect(i).toBeGreaterThanOrEqual(0);
          expect(i).toBeLessThan(w * h);
          seen.add(i);
          expect(frameCell({ w, h }, frame, i)).toBe(c);
        }
        expect(seen.size).toBe(w * h);
      })
    );
  });

  it('turning the map by a frame and back is the identity on vectors; the default frames keep the two-side order', () => {
    for (const f of FRAMES) for (const [dx, dy] of frameDirs('id')) {
      const back: Record<Frame, Frame> = { id: 'id', r90: 'r270', r180: 'r180', r270: 'r90', fx: 'fx', fy: 'fy' };
      const [x, y] = frameVector(f, dx, dy);
      expect(frameVector(back[f], x, y)).toEqual([dx, dy]);
    }
    expect(frameDirs('r180')).toEqual(frameDirs('id').map(([dx, dy]) => [-dx, -dy]));
    expect(frameIndexIn({ w: 5, h: 4 }, 'r180', 3)).toBe(20 - 1 - 3);
  });
});

describe('engine invariants for several sides', () => {
  it('P1 determinism with 3 to 8 sides, neutral posts included; every world stays valid', () => {
    for (const sides of [3, 4, 5, 8]) {
      fc.assert(
        fc.property(arbWorld({ sides, neutral: true, supply: 300 }), ({ world, plans }) => {
          const a = play(world, plans, STRATEGY_RULESET);
          expect(worldHash(a)).toBe(worldHash(play(structuredClone(world), structuredClone(plans), STRATEGY_RULESET)));
          expect(isValidWorld(a, STRATEGY_RULESET)).toBe(true);
        }),
        { numRuns: 25 }
      );
    }
  });

  /** Quarter turn clockwise on an n×n map, and the side permutation that goes with it (k → k+1). */
  const turn = (n: number) => (x: number, y: number) => [n - 1 - y, x] as const;
  const next = (sides: number) => (s: number) => (s + 1) % sides;
  // Side k sees the map turned back k quarters: then a quarter turn of the world carries side k's
  // view onto side k+1's (frame of k+1 after the turn = frame of k before it).
  const FOUR: Frame[] = ['id', 'r270', 'r180', 'r90'];

  it('P4 under a quarter turn: four sides with turned frames on a square map evolve as the turned image (sides moved on by one)', () => {
    fc.assert(
      fc.property(arbWorld({ sides: 4, square: true, frames: FOUR }), ({ world, plans }) => {
        const n = world.map.w;
        const direct = transformWorld(play(world, plans), turn(n), next(4));
        const turned = play(transformWorld(world, turn(n), next(4)), plans.map((p) => transformCommands(p, turn(n), next(4))));
        expect(canonicalJson(turned)).toBe(canonicalJson(direct));
      }),
      RUNS
    );
  });

  it('P4 under a quarter turn with the command network, fog and economy (neutral posts included)', () => {
    fc.assert(
      fc.property(arbWorld({ sides: 4, square: true, frames: FOUR, neutral: true, supply: 300 }), ({ world, plans }) => {
        const n = world.map.w;
        const direct = transformWorld(play(world, plans, STRATEGY_RULESET), turn(n), next(4));
        const turned = play(transformWorld(world, turn(n), next(4)), plans.map((p) => transformCommands(p, turn(n), next(4))), STRATEGY_RULESET);
        // Sites placed by two sides in one batch on cells with the same index in their frames get
        // ids by side number (§ ADR 0009, contested placements), so ids are compared by position.
        expect(canonicalJson(canonicalIds(turned))).toBe(canonicalJson(canonicalIds(direct)));
      }),
      RUNS
    );
  });

  // Targeted: the random worlds above rarely hit a tie, so tie-breaks get their own cases.
  const square = (n: number, sides: number, frames: Frame[], extra: Scenario['entities'] = []) =>
    createWorld(
      {
        map: open(n, n),
        sides,
        frames,
        entities: [{ side: 0, kind: 'command-post', x: 0, y: 0 }, { side: 1, kind: 'command-post', x: n - 1, y: 0 }, { side: 2, kind: 'command-post', x: n - 1, y: n - 1 }, { side: 3, kind: 'command-post', x: 0, y: n - 1 }, ...extra],
        seed: 1,
        supply: [600, 600, 600, 600]
      },
      STRATEGY_RULESET
    );

  it('P4 tie-breaks under a quarter turn: one side placing several sites keeps exact symmetry, ids included', () => {
    fc.assert(
      fc.property(fc.array(fc.record({ kind: fc.constantFrom('relay-mast', 'muster'), x: fc.integer({ min: 0, max: 3 }), y: fc.integer({ min: 0, max: 3 }) }), { minLength: 2, maxLength: 4 }), fc.nat(3), (sites, side) => {
        const w = square(7, 4, FOUR);
        const plan = sites.map((p): Command => ({ side, unit: side + 1, order: { type: 'build', kind: p.kind, x: p.x, y: p.y } }));
        const direct = transformWorld(resolveTurn(w, STRATEGY_RULESET, [plan]).world, turn(7), next(4));
        const turned = resolveTurn(transformWorld(w, turn(7), next(4)), STRATEGY_RULESET, [transformCommands(plan, turn(7), next(4))]).world;
        expect(canonicalJson(turned)).toBe(canonicalJson(direct));
      }),
      { numRuns: 200 }
    );
  });

  it('P4 tie-breaks under a quarter turn: paths with several equally good ways stay symmetric', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5 }), fc.integer({ min: 1, max: 5 }), fc.integer({ min: 0, max: 6 }), fc.integer({ min: 0, max: 6 }), fc.nat(3), (ux, uy, gx, gy, side) => {
        const w = square(7, 4, FOUR, [{ side, kind: 'outrider', x: ux, y: uy }]);
        const unit = w.entities.find((e) => e.kind === 'outrider')!;
        const plans = [[{ side, unit: unit.id, order: { type: 'move', x: gx, y: gy } } as Command], [], []];
        const direct = transformWorld(play(w, plans, STRATEGY_RULESET), turn(7), next(4));
        const turned = play(transformWorld(w, turn(7), next(4)), plans.map((p) => transformCommands(p, turn(7), next(4))), STRATEGY_RULESET);
        expect(canonicalJson(turned)).toBe(canonicalJson(direct));
      }),
      { numRuns: 200 }
    );
  });

  it('P4 tie-breaks under a quarter turn: a yard delivers onto the symmetric neighbour (neighbour order turns with the frame)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5 }), fc.integer({ min: 1, max: 5 }), fc.nat(3), fc.array(fc.integer({ min: 0, max: 7 }), { maxLength: 5 }), (yx, yy, side, blocks) => {
        const dirs: [number, number][] = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [-1, -1], [1, -1]];
        const walls = [...new Set(blocks)].map((i) => ({ side, kind: 'relay-mast', x: yx + dirs[i]![0], y: yy + dirs[i]![1] })).filter((m) => m.x >= 0 && m.y >= 0 && m.x < 7 && m.y < 7 && !(m.x === 0 && m.y === 0) && !(m.x === 6 && m.y === 0) && !(m.x === 6 && m.y === 6) && !(m.x === 0 && m.y === 6));
        const w = square(7, 4, FOUR, [{ side, kind: 'muster', x: yx, y: yy }, ...walls]);
        const yard = w.entities.find((e) => e.kind === 'muster')!;
        const plans = [[{ side, unit: yard.id, order: { type: 'produce', kind: 'rifles' } } as Command], [], []];
        const direct = transformWorld(play(w, plans, STRATEGY_RULESET), turn(7), next(4));
        const turned = play(transformWorld(w, turn(7), next(4)), plans.map((p) => transformCommands(p, turn(7), next(4))), STRATEGY_RULESET);
        expect(canonicalJson(turned)).toBe(canonicalJson(direct));
      }),
      { numRuns: 200 }
    );
  });

  it('P4 tie-breaks under a quarter turn with walls and cover: detours, firing positions and seeking cover', () => {
    // Walls make equally long detours around them (a tie only the frame decides); forest next to a
    // holding squad that seeks cover gives it a choice of cells; an attacker picks among firing cells.
    const cell = fc.record({ x: fc.integer({ min: 0, max: 6 }), y: fc.integer({ min: 0, max: 6 }) });
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('.', '.', '.', '^', 'f', 'f'), { minLength: 49, maxLength: 49 }),
        fc.array(fc.record({ side: fc.integer({ min: 0, max: 3 }), kind: fc.constantFrom('rifles', 'outrider', 'warden'), at: cell, order: fc.constantFrom('move', 'attack', 'cover'), to: cell, target: fc.nat(7) }), { minLength: 1, maxLength: 6 }),
        (terrain, units) => {
          const used = new Set<string>();
          const entities: { side: number; kind: string; x: number; y: number }[] = [];
          for (const u of units) {
            if (terrain[u.at.y * 7 + u.at.x] === '^' || used.has(`${u.at.x},${u.at.y}`)) continue;
            used.add(`${u.at.x},${u.at.y}`);
            entities.push({ side: u.side, kind: u.kind, x: u.at.x, y: u.at.y });
          }
          if (entities.length === 0) return;
          const w = createWorld({ map: { w: 7, h: 7, terrain: terrain.join('') }, sides: 4, frames: FOUR, entities, seed: 1 }, BASE_RULESET);
          const plan: Command[] = w.entities.map((e, i) => {
            const u = units[i % units.length]!;
            const doctrine = { retreatBelow: 0, priority: 'nearest', seekCover: u.order === 'cover', holdFire: false, lostContact: 'keep' } as const;
            const order: Order = u.order === 'move' ? { type: 'move', x: u.to.x, y: u.to.y } : u.order === 'attack' ? { type: 'attack', target: (u.target % w.entities.length) + 1 } : { type: 'hold' };
            return { side: e.side, unit: e.id, order, doctrine };
          });
          const plans = [plan, [], []];
          const direct = transformWorld(play(w, plans), turn(7), next(4));
          const turned = play(transformWorld(w, turn(7), next(4)), plans.map((p) => transformCommands(p, turn(7), next(4))));
          expect(canonicalJson(turned)).toBe(canonicalJson(direct));
        }
      ),
      { numRuns: 400 }
    );
  });

  it('P4 under a left-right mirror: two sides with mirrored frames', () => {
    const flip = (w: number) => (x: number, y: number) => [w - 1 - x, y] as const;
    fc.assert(
      fc.property(arbWorld({ sides: 2, frames: ['id', 'fx'] }), ({ world, plans }) => {
        const direct = transformWorld(play(world, plans), flip(world.map.w), (s) => 1 - s);
        const mirrored = play(transformWorld(world, flip(world.map.w), (s) => 1 - s), plans.map((p) => transformCommands(p, flip(world.map.w), (s) => 1 - s)));
        expect(canonicalJson(mirrored)).toBe(canonicalJson(direct));
      }),
      RUNS
    );
  });

  it('P6 plan order: any order of the sides\' commands in the batch gives the same world (4 sides, economy)', () => {
    fc.assert(
      fc.property(arbWorld({ sides: 4, neutral: true, supply: 300 }), fc.array(fc.nat(3), { minLength: 4, maxLength: 4 }), ({ world, plans }, keys) => {
        const order = [0, 1, 2, 3].sort((a, b) => (keys[a] ?? 0) - (keys[b] ?? 0) || a - b);
        const bySides = (plan: readonly Command[], sides: readonly number[]) => sides.flatMap((s) => plan.filter((c) => c.side === s));
        const base = play(world, plans.map((p) => bySides(p, [0, 1, 2, 3])), STRATEGY_RULESET);
        expect(canonicalJson(play(world, plans.map((p) => bySides(p, order)), STRATEGY_RULESET))).toBe(canonicalJson(base));
      }),
      RUNS
    );
  });

  it('no leaks: what a side observes does not change when a third side\'s unseen units change', () => {
    fc.assert(
      fc.property(arbWorld({ sides: 3, supply: 300 }), fc.nat(), ({ world, plans }, pick) => {
        const w = play(world, plans, STRATEGY_RULESET);
        const third = w.entities.filter((e) => e.side === 2 && !w.intel![0]!.some((r) => r.id === e.id));
        if (third.length === 0) return;
        const changed = structuredClone(w);
        const target = changed.entities.find((e) => e.id === third[pick % third.length]!.id)!;
        target.hp = Math.max(1, target.hp - 1);
        expect(canonicalJson(observe(changed, STRATEGY_RULESET, 0))).toBe(canonicalJson(observe(w, STRATEGY_RULESET, 0)));
      }),
      RUNS
    );
  });
});

/** Ids renumbered by position (see properties.test.ts, contested placements). */
function canonicalIds(w: World): World {
  const order = [...w.entities].sort((a, b) => a.y - b.y || a.x - b.x || a.kind.localeCompare(b.kind));
  const map = new Map(order.map((e, i) => [e.id, i + 1]));
  const id = (n: number) => map.get(n) ?? -n;
  const entities = w.entities
    .map((e) => ({ ...e, id: id(e.id), ...('target' in e.order ? { order: { ...e.order, target: id((e.order as { target: number }).target) } } : {}) }))
    .sort((a, b) => a.id - b.id);
  const intel = w.intel?.map((list) => list.map((r) => ({ ...r, id: id(r.id) })).sort((a, b) => a.id - b.id));
  return { ...w, entities, nextId: 0, ...(intel && { intel }) } as World;
}
