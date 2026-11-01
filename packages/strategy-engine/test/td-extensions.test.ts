import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  absorb,
  auraEffects,
  BASE_ARCHETYPES,
  BASE_RULESET,
  canonicalJson,
  coolDown,
  createWorld,
  invalidExtensions,
  isValidWorld,
  lineCells,
  marked,
  markOf,
  MAX_HASTE,
  removeEntities,
  resolveTurn,
  runTicks,
  spawnUnits,
  STRATEGY_RULESET,
  strongerHeal,
  validExtensions,
  worldHash,
  type Archetype,
  type Command,
  type Entity,
  type Ruleset,
  type SimEvent,
  type SpawnSpec,
  type WeaponSpec,
  type World
} from '../src';
import { arbWorld, mapOf, mirrorCommands, mirrorWorld, open } from './helpers';

// Tower Defense extensions E0–E3 (ADR 0009 amendment, docs/design/tower-defense.md § 15.5).

const A = BASE_ARCHETYPES;
const weapon = (spec: Partial<WeaponSpec>): WeaponSpec => ({ ...(A['tower-gun']!.weapon as WeaponSpec), ...spec });
const archetype = (id: string, spec: Partial<Archetype>): Archetype => ({ ...(A['tower-gun'] as Archetype), id, weapon: null, ...spec });
const ALL = { infantry: 100, light: 100, heavy: 100, structure: 100, air: 100 };

/** Extension archetypes on top of the base ruleset. */
const EXTRA: Record<string, Archetype> = {
  prism: archetype('prism', { weapon: weapon({ damage: 10, range: 5, delivery: 'beam', beamRamp: 4, beamMaxStacks: 3, pierce: true, vs: { ...ALL, air: 0 } }) }),
  'prism-air': archetype('prism-air', { weapon: weapon({ damage: 10, range: 5, delivery: 'beam', pierce: true, vs: ALL }) }),
  laser: archetype('laser', { weapon: weapon({ damage: 10, range: 5, delivery: 'beam', vs: ALL }) }),
  gun: archetype('gun', { weapon: weapon({ damage: 10, range: 5, cooldown: 4, vs: ALL }) }),
  rapid: archetype('rapid', { weapon: weapon({ damage: 10, range: 5, vs: ALL }) }),
  amp25: archetype('amp25', { aura: { radius: 2, cooldownPct: 25 } }),
  amp50: archetype('amp50', { aura: { radius: 2, cooldownPct: 50 } }),
  repair: archetype('repair', { aura: { radius: 2, heal: { hp: 5, every: 2 } } }),
  'repair-big': archetype('repair-big', { aura: { radius: 2, heal: { hp: 12, every: 4 } } }),
  corroder: archetype('corroder', { weapon: weapon({ damage: 10, range: 5, vs: ALL, effect: { kind: 'marked', ticks: 3, amount: 50 } }) }),
  emp: archetype('emp', { weapon: weapon({ damage: 1, range: 5, cooldown: 20, vs: ALL, effect: { kind: 'disabled', ticks: 4 } }) }),
  blackout: archetype('blackout', { weapon: weapon({ damage: 0, range: 5, cooldown: 20, delivery: 'ballistic', flight: 1, splash: 1, vs: ALL, effect: { kind: 'disabled', ticks: 4 } }) }),
  walker: { ...(A['rifles'] as Archetype), id: 'walker', hp: 100, speed: 0, weapon: null },
  glider: { ...(A['kite'] as Archetype), id: 'glider', hp: 100, speed: 0, comms: null },
  'warden-shielded': { ...(A['warden'] as Archetype), id: 'warden-shielded', hp: 100, speed: 0, weapon: null, shield: { hp: 30, regenDelay: 3 } }
};
const RS: Ruleset = { ...BASE_RULESET, id: 'td-ext-test', archetypes: { ...BASE_ARCHETYPES, ...EXTRA } };
const FOG: Ruleset = { ...STRATEGY_RULESET, id: 'td-ext-fog', archetypes: { ...STRATEGY_RULESET.archetypes, ...EXTRA } };

const world = (map: ReturnType<typeof open>, entities: { side: number; kind: string; x: number; y: number }[], rs: Ruleset = RS): World =>
  createWorld({ map, sides: 2, entities, seed: 1 }, rs);
const byId = (w: World, id: number): Entity | undefined => w.entities.find((e) => e.id === id);
const hitsOf = (events: readonly SimEvent[], id: number) => events.filter((e): e is Extract<SimEvent, { t: 'hit' }> => e.t === 'hit' && e.id === id);
const attack = (unit: number, target: number): Command => ({ side: 0, unit, order: { type: 'attack', target } });

describe('E0: spawnUnits / removeEntities', () => {
  const base = () => world(mapOf('..~..', '.....'), [{ side: 0, kind: 'gun', x: 0, y: 0 }]);

  it('spawns in spec order with ids from nextId, full health and the given order', () => {
    const w = base();
    const { world: out, spawned, refused } = spawnUnits(w, RS, [
      { side: 1, kind: 'walker', x: 4, y: 0, order: { type: 'move', x: 0, y: 1 } },
      { side: 1, kind: 'glider', x: 2, y: 0 },
      { side: 1, kind: 'warden-shielded', x: 4, y: 1 }
    ]);
    expect(refused).toEqual([]);
    expect(spawned).toEqual([2, 3, 4]);
    expect(out.nextId).toBe(5);
    expect(out.entities.map((e) => [e.id, e.kind, e.hp, e.order.type])).toEqual([[1, 'gun', 150, 'hold'], [2, 'walker', 100, 'move'], [3, 'glider', 100, 'hold'], [4, 'warden-shielded', 100, 'hold']]);
    expect(byId(out, 4)?.shield).toBe(30);
    expect(byId(out, 2)).not.toHaveProperty('shield');
    expect(isValidWorld(out, RS)).toBe(true);
  });

  it('refuses bad specs with a reason and uses no id for them', () => {
    const w = base();
    const specs = [
      { side: 1, kind: 'nope', x: 1, y: 1 },
      { side: 1, kind: 'constructor', x: 1, y: 1 },
      { side: 2, kind: 'walker', x: 1, y: 1 },
      { side: -1, kind: 'walker', x: 1, y: 1 },
      { side: 0.5, kind: 'walker', x: 1, y: 1 },
      { side: 1, kind: 'walker', x: 5, y: 0 },
      { side: 1, kind: 'walker', x: -1, y: 0 },
      { side: 1, kind: 'walker', x: 1.5, y: 0 },
      { side: 1, kind: 'walker', x: 2, y: 0 },
      { side: 1, kind: 'walker', x: 0, y: 0 },
      { side: 1, kind: 'walker', x: 3, y: 0 },
      { side: 1, kind: 'walker', x: 3, y: 0 },
      { side: 1, kind: 'walker', x: 4, y: 0, order: { type: 'produce', kind: 'rifles' } },
      { side: 1, kind: 'walker', x: 4, y: 0, order: { type: 'move', x: 9, y: 0 } },
      { side: 1, kind: 'walker', x: 4, y: 0, order: { type: 'dance' } },
      null,
      { side: 1, kind: 7, x: 4, y: 0 }
    ] as unknown as SpawnSpec[];
    const { world: out, spawned, refused } = spawnUnits(w, RS, specs);
    expect(spawned).toEqual([2]);
    expect(refused).toEqual([
      { index: 0, reason: 'unknown-kind' },
      { index: 1, reason: 'unknown-kind' },
      { index: 2, reason: 'bad-side' },
      { index: 3, reason: 'bad-side' },
      { index: 4, reason: 'bad-side' },
      { index: 5, reason: 'out-of-bounds' },
      { index: 6, reason: 'out-of-bounds' },
      { index: 7, reason: 'out-of-bounds' },
      { index: 8, reason: 'impassable' },
      { index: 9, reason: 'occupied' },
      { index: 11, reason: 'occupied' },
      { index: 12, reason: 'bad-order' },
      { index: 13, reason: 'bad-order' },
      { index: 14, reason: 'bad-order' },
      { index: 15, reason: 'bad-spec' },
      { index: 16, reason: 'unknown-kind' }
    ]);
    expect(out.nextId).toBe(3);
    expect(isValidWorld(out, RS)).toBe(true);
  });

  it('checks occupation per layer: an air unit may spawn above a ground unit', () => {
    const { spawned } = spawnUnits(base(), RS, [{ side: 1, kind: 'glider', x: 0, y: 0 }]);
    expect(spawned).toEqual([2]);
  });

  it('refuses a side that is out', () => {
    const w = { ...base(), out: [1] };
    expect(spawnUnits(w, RS, [{ side: 1, kind: 'walker', x: 4, y: 0 }]).refused).toEqual([{ index: 0, reason: 'bad-side' }]);
  });

  it('is pure and deterministic', () => {
    const w = base();
    const before = canonicalJson(w);
    const specs: SpawnSpec[] = [{ side: 1, kind: 'walker', x: 4, y: 0 }];
    const a = spawnUnits(w, RS, specs);
    expect(canonicalJson(w)).toBe(before);
    expect(worldHash(spawnUnits(structuredClone(w), RS, specs).world)).toBe(worldHash(a.world));
    const r = removeEntities(a.world, [1]);
    expect(byId(a.world, 1)).toBeDefined();
    expect(r.entities.map((e) => e.id)).toEqual([2]);
  });

  it('with fog the spawning side learns of its unit, and removal drops every report of it', () => {
    const w = createWorld({ map: open(6, 3), sides: 2, entities: [{ side: 0, kind: 'command-post', x: 0, y: 1 }, { side: 1, kind: 'command-post', x: 5, y: 1 }], seed: 1 }, FOG);
    const { world: out, spawned } = spawnUnits(w, FOG, [{ side: 1, kind: 'walker', x: 4, y: 1 }]);
    expect(out.intel?.[1]?.find((r) => r.id === spawned[0])).toMatchObject({ kind: 'walker', live: false, x: 4, y: 1 });
    expect(out.intel?.[0]?.some((r) => r.id === spawned[0])).toBe(false);
    expect(isValidWorld(out, FOG)).toBe(true);
    const next = runTicks(out, FOG, [], 1).world;
    expect(next.intel?.[0]?.some((r) => r.id === spawned[0] && r.live)).toBe(true);
    const removed = removeEntities(next, [spawned[0]!, 99]);
    expect(removed.entities.some((e) => e.id === spawned[0])).toBe(false);
    expect(removed.intel?.every((list) => list.every((r) => r.id !== spawned[0]))).toBe(true);
    expect(isValidWorld(removed, FOG)).toBe(true);
    expect(next.intel?.[0]?.some((r) => r.id === spawned[0])).toBe(true);
  });

  it('a removed carrier takes its drone along; a removed drone counts as aboard again', () => {
    const w = createWorld({ map: open(6, 3), sides: 2, entities: [{ side: 0, kind: 'command-post', x: 0, y: 1 }, { side: 0, kind: 'outrider', x: 2, y: 1 }, { side: 1, kind: 'command-post', x: 5, y: 1 }], seed: 1 }, FOG);
    const launched = runTicks(w, FOG, [{ side: 0, unit: 2, order: { type: 'launch' } }], 1).world;
    const drone = byId(launched, 2)?.drone as number;
    expect(drone).toBeDefined();
    const noCarrier = removeEntities(launched, [2]);
    expect(noCarrier.entities.map((e) => e.id)).toEqual([1, 3]);
    expect(isValidWorld(noCarrier, FOG)).toBe(true);
    const noDrone = removeEntities(launched, [drone]);
    expect(byId(noDrone, 2)).not.toHaveProperty('drone');
    expect(isValidWorld(noDrone, FOG)).toBe(true);
    expect(byId(launched, 2)?.drone).toBe(drone);
  });

  it('removal keeps a world without the ids unchanged and drops no projectile', () => {
    const w = { ...base(), projectiles: [{ id: 2, side: 0, kind: 'gun', x: 1, y: 1, ticks: 2 }], nextId: 3 };
    expect(canonicalJson(removeEntities(w, [42]))).toBe(canonicalJson(w));
    expect(removeEntities(w, [1]).projectiles).toEqual(w.projectiles);
  });
});

describe('E1: piercing beam', () => {
  it('lineCells: exact cells, through the target, stops at the first refused cell', () => {
    expect(lineCells(0, 0, 2, 1, (x) => x <= 4)).toEqual([[1, 1], [2, 1], [3, 2], [4, 2]]);
    expect(lineCells(0, 0, 0, -2, (_, y) => y >= -3)).toEqual([[0, -1], [0, -2], [0, -3]]);
    expect(lineCells(3, 3, 3, 3, () => true)).toEqual([]);
    expect(lineCells(0, 0, 3, 3, (x) => x < 3)).toEqual([[1, 1], [2, 2]]);
    expect(lineCells(0, 0, 3, 1, (x) => x <= 3)).toEqual([[1, 0], [2, 1], [3, 1]]);
  });

  it('lineCells is symmetric under every grid symmetry and always passes through the target', () => {
    fc.assert(
      fc.property(fc.integer({ min: -6, max: 6 }), fc.integer({ min: -6, max: 6 }), fc.integer({ min: 1, max: 12 }), (dx, dy, n) => {
        fc.pre(dx !== 0 || dy !== 0);
        const take = (cells: [number, number][]) => cells;
        const line = (fx: number, fy: number, swap: boolean) => {
          const [ax, ay] = swap ? [dy * fx, dx * fy] : [dx * fx, dy * fy];
          let k = 0;
          return take(lineCells(0, 0, ax, ay, () => k++ < n));
        };
        const ref = line(1, 1, false);
        expect(line(1, 1, true)).toEqual(ref.map(([x, y]) => [y, x]));
        for (const [fx, fy] of [[1, -1], [-1, 1], [-1, -1]] as const) {
          expect(line(fx, fy, false)).toEqual(ref.map(([x, y]) => [x * fx + 0, y * fy + 0]));
          expect(line(fx, fy, true)).toEqual(ref.map(([x, y]) => [y * fx + 0, x * fy + 0]));
        }
        const all = lineCells(0, 0, dx, dy, (x, y) => Math.max(Math.abs(x), Math.abs(y)) <= Math.max(Math.abs(dx), Math.abs(dy)));
        expect(all.at(-1)).toEqual([dx, dy]);
        // One cell per step of the major axis: never a cell twice.
        expect(new Set(all.map(([x, y]) => `${x},${y}`)).size).toBe(all.length);
      })
    );
  });

  // Row: prism at 0; enemies at 1, 2, 3, 5 (range edge) and 6 (beyond); own walker at 4.
  const row = () =>
    world(open(8, 1), [
      { side: 0, kind: 'prism', x: 0, y: 0 },
      { side: 1, kind: 'walker', x: 1, y: 0 },
      { side: 1, kind: 'walker', x: 2, y: 0 },
      { side: 1, kind: 'walker', x: 3, y: 0 },
      { side: 0, kind: 'walker', x: 4, y: 0 },
      { side: 1, kind: 'walker', x: 5, y: 0 },
      { side: 1, kind: 'walker', x: 6, y: 0 }
    ]);

  it('hits every hostile unit on the line once up to the range, never the own side; one fire event', () => {
    const w = row();
    const { world: out, events } = runTicks(w, RS, [attack(1, 3)], 1);
    expect(events.filter((e) => e.t === 'fire')).toEqual([{ t: 'fire', tick: 1, id: 1, target: 3 }]);
    expect(out.entities.map((e) => [e.id, e.hp])).toEqual([[1, 150], [2, 90], [3, 90], [4, 90], [5, 100], [6, 90], [7, 100]]);
    expect(events.filter((e) => e.t === 'hit').map((e) => (e as { id: number }).id)).toEqual([2, 3, 4, 6]);
    expect(canonicalJson(byId(w, 2))).toBe(canonicalJson(row().entities[1]));
  });

  it('the ramp applies to the primary target only', () => {
    const { world: out } = runTicks(row(), RS, [attack(1, 3)], 3);
    // Primary: 10 + 14 + 18; the others 10 each shot.
    expect(byId(out, 3)?.hp).toBe(100 - 42);
    expect(byId(out, 2)?.hp).toBe(70);
    expect(byId(out, 6)?.hp).toBe(70);
  });

  it('respects the vs row per layer and cover, and stops at the map edge', () => {
    const w = world(mapOf('.f...'), [
      { side: 0, kind: 'prism', x: 0, y: 0 },
      { side: 1, kind: 'glider', x: 1, y: 0 },
      { side: 1, kind: 'walker', x: 1, y: 0 },
      { side: 1, kind: 'walker', x: 3, y: 0 },
      { side: 1, kind: 'glider', x: 4, y: 0 }
    ]);
    const { world: out } = runTicks(w, RS, [attack(1, 4)], 1);
    expect(out.entities.map((e) => [e.id, e.hp])).toEqual([[1, 150], [2, 100], [3, 93], [4, 90], [5, 100]]);
    const air = runTicks({ ...w, entities: w.entities.map((e) => (e.id === 1 ? { ...e, kind: 'prism-air' } : e)) }, RS, [attack(1, 4)], 1).world;
    // The air unit above the forest gets its cover too, as a beam's target always has.
    expect(air.entities.map((e) => e.hp)).toEqual([150, 93, 93, 90, 90]);
  });

  it('follows diagonal lines and leaves units off the line alone', () => {
    const w = world(open(6, 6), [
      { side: 0, kind: 'prism', x: 0, y: 0 },
      { side: 1, kind: 'walker', x: 2, y: 1 },
      { side: 1, kind: 'walker', x: 4, y: 2 },
      { side: 1, kind: 'walker', x: 1, y: 0 },
      { side: 1, kind: 'walker', x: 3, y: 2 }
    ]);
    const { world: out } = runTicks(w, RS, [attack(1, 2)], 1);
    expect(out.entities.map((e) => e.hp)).toEqual([150, 90, 90, 100, 90]);
  });

  it('the shooter\'s hill range bonus lengthens the line', () => {
    const w = world(mapOf('h.......'), [{ side: 0, kind: 'prism', x: 0, y: 0 }, { side: 1, kind: 'walker', x: 1, y: 0 }, { side: 1, kind: 'walker', x: 6, y: 0 }, { side: 1, kind: 'walker', x: 7, y: 0 }]);
    expect(runTicks(w, RS, [attack(1, 2)], 1).world.entities.map((e) => e.hp)).toEqual([150, 90, 90, 100]);
  });

  it('without pierce only the target is hit (unchanged beam)', () => {
    const w = row();
    const plain = { ...w, entities: w.entities.map((e) => (e.id === 1 ? { ...e, kind: 'laser' } : e)) };
    const { world: out } = runTicks(plain, RS, [attack(1, 3)], 1);
    expect(out.entities.map((e) => e.hp)).toEqual([150, 100, 90, 100, 100, 100, 100]);
  });
});

describe('E2: auras', () => {
  /** Ticks on which tower 1 fired during `n` ticks next to the given supports. */
  const fireTicks = (supports: { kind: string; x: number; side?: number }[], n: number, prep?: (w: World) => void): number[] => {
    const w = world(open(9, 3), [{ side: 0, kind: 'gun', x: 2, y: 1 }, { side: 1, kind: 'warden', x: 6, y: 1 }, ...supports.map((s) => ({ side: s.side ?? 0, kind: s.kind, x: s.x, y: 0 }))]);
    byId(w, 2)!.hp = 140;
    prep?.(w);
    return runTicks(w, RS, [], n).events.filter((e) => e.t === 'fire' && e.id === 1).map((e) => e.tick);
  };

  it('coolDown: integer accumulator, extra steps, surplus carried, capped, dropped when idle or outside an aura', () => {
    const e = { cooldown: 4 } as unknown as Entity;
    coolDown(e, 25);
    expect([e.cooldown, e.haste]).toEqual([3, 25]);
    coolDown(e, 25);
    coolDown(e, 25);
    expect([e.cooldown, e.haste]).toEqual([1, 75]);
    coolDown(e, 25);
    expect([e.cooldown, e.haste]).toEqual([0, 100]);
    e.cooldown = 4;
    coolDown(e, 25);
    expect([e.cooldown, e.haste]).toEqual([2, 25]);
    const idle = { cooldown: 0, haste: 100 } as unknown as Entity;
    coolDown(idle, 25);
    expect(idle.cooldown).toBe(0);
    expect(idle).not.toHaveProperty('haste');
    const f = { cooldown: 3, haste: 80 } as unknown as Entity;
    coolDown(f, 250);
    expect([f.cooldown, f.haste]).toEqual([0, 130]);
    const g = { cooldown: 1 } as unknown as Entity;
    coolDown(g, 1000);
    expect([g.cooldown, g.haste]).toEqual([0, 1000]);
    g.cooldown = 1;
    coolDown(g, 1000);
    expect([g.cooldown, g.haste]).toEqual([0, 1099]);
    const h = { cooldown: 2, haste: 40 } as unknown as Entity;
    coolDown(h, 0);
    expect(h.cooldown).toBe(1);
    expect(h).not.toHaveProperty('haste');
  });

  it('a cooldown aura makes a neighbouring tower fire faster; the strongest applies, auras do not stack', () => {
    const plain = fireTicks([], 24);
    expect(plain).toEqual([1, 5, 9, 13, 17, 21]);
    const amp50 = fireTicks([{ kind: 'amp50', x: 3 }], 24);
    // 4 ticks at +50 %: 8/3 ticks on average (intervals 3, 3, 2, ...); at +25 %: 3.2.
    expect(amp50).toEqual([1, 4, 7, 9, 12, 15, 17, 20, 23]);
    const amp25 = fireTicks([{ kind: 'amp25', x: 3 }], 24);
    expect(amp25).toEqual([1, 5, 8, 11, 14, 17, 21, 24]);
    expect(fireTicks([{ kind: 'amp50', x: 3 }, { kind: 'amp25', x: 1 }], 24)).toEqual(amp50);
    expect(fireTicks([{ kind: 'amp50', x: 3 }, { kind: 'amp50', x: 1 }], 24)).toEqual(amp50);
  });

  it('only the own side within the radius, never a disabled source or a site', () => {
    const plain = fireTicks([], 24);
    expect(fireTicks([{ kind: 'amp50', x: 5 }], 24)).toEqual(plain);
    expect(fireTicks([{ kind: 'amp50', x: 3, side: 1 }], 24)).toEqual(plain);
    expect(fireTicks([{ kind: 'amp50', x: 3 }], 24, (w) => void (byId(w, 3)!.status = [{ kind: 'disabled', ticks: 30 }]))).toEqual(plain);
    expect(fireTicks([{ kind: 'amp50', x: 3 }], 24, (w) => void (byId(w, 3)!.build = 5))).toEqual(plain);
    // The radius is Euclidean: (4, 0) is √5 > 2 away from the tower at (2, 1).
    expect(fireTicks([{ kind: 'amp50', x: 4 }], 24)).toEqual(plain);
  });

  it('auraEffects: a source never helps itself; strongest heal by rate, then size, then lower id', () => {
    const ent = (id: number, kind: string, x: number, side = 0) => ({ id, kind, x, y: 0, side }) as Entity;
    const archOf = (e: Entity) => RS.archetypes[e.kind] as Archetype;
    const effects = auraEffects([ent(1, 'repair', 0), ent(2, 'repair-big', 1), ent(3, 'gun', 2), ent(4, 'gun', 1, 1)], archOf, () => true);
    // Rates 12/4 > 5/2: the big repair aura wins on the gun; the two auras heal each other.
    expect(effects.get(3)).toEqual({ cooldownPct: 0, heal: { hp: 12, every: 4, by: 2 } });
    expect(effects.get(1)?.heal?.by).toBe(2);
    expect(effects.get(2)?.heal?.by).toBe(1);
    expect(effects.has(4)).toBe(false);
    // The same in the other entity order: a weaker aura met later never replaces a stronger one.
    const reversed = auraEffects([ent(2, 'repair-big', 1), ent(1, 'repair', 0), ent(3, 'gun', 2)], archOf, () => true);
    expect(reversed.get(3)?.heal?.by).toBe(2);
    const same = auraEffects([ent(5, 'repair', 0), ent(3, 'gun', 1), ent(4, 'repair', 2)], archOf, () => true);
    expect(same.get(3)?.heal?.by).toBe(4);
    const tie = auraEffects([ent(1, 'repair', 0), ent(3, 'gun', 1), { ...ent(2, 'repair', 2), kind: 'r10' }], (e) => (e.kind === 'r10' ? archetype('r10', { aura: { radius: 2, heal: { hp: 10, every: 4 } } }) : archOf(e)), () => true);
    expect(tie.get(3)?.heal).toEqual({ hp: 10, every: 4, by: 2 });
    expect(auraEffects([ent(1, 'repair', 0), ent(3, 'gun', 1)], archOf, () => false).size).toBe(0);
  });

  it('strongerHeal: rate first, then the larger pulse, then the lower source id; a strict order', () => {
    const h = (hp: number, every: number, by: number) => ({ hp, every, by });
    expect(strongerHeal(h(12, 4, 9), h(5, 2, 1))).toBe(true);
    expect(strongerHeal(h(5, 2, 1), h(12, 4, 9))).toBe(false);
    expect(strongerHeal(h(1, 1, 9), h(10, 20, 1))).toBe(true);
    expect(strongerHeal(h(10, 20, 1), h(1, 1, 9))).toBe(false);
    expect(strongerHeal(h(10, 4, 9), h(5, 2, 1))).toBe(true);
    expect(strongerHeal(h(5, 2, 1), h(10, 4, 9))).toBe(false);
    expect(strongerHeal(h(5, 2, 1), h(5, 2, 2))).toBe(true);
    expect(strongerHeal(h(5, 2, 2), h(5, 2, 1))).toBe(false);
    expect(strongerHeal(h(5, 2, 1), h(5, 2, 1))).toBe(false);
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 30 }), fc.integer({ min: 1, max: 30 }), fc.integer({ min: 1, max: 30 }), fc.integer({ min: 1, max: 30 }), fc.nat(5), fc.nat(5), (ah, ae, bh, be, ab, bb) => {
        const a = h(ah, ae, ab);
        const b = h(bh, be, bb);
        const same = ah === bh && ae === be && ab === bb;
        // Exactly one of two different auras is stronger (the choice never depends on the order).
        expect(strongerHeal(a, b) !== strongerHeal(b, a)).toBe(!same);
        if (ah * be > bh * ae) expect(strongerHeal(a, b)).toBe(true);
      })
    );
  });

  it('the radius bound is inclusive', () => {
    const ent = (id: number, kind: string, x: number) => ({ id, kind, x, y: 0, side: 0 }) as Entity;
    const effects = auraEffects([ent(1, 'amp50', 0), ent(2, 'gun', 2), ent(3, 'gun', 3)], (e) => RS.archetypes[e.kind] as Archetype, () => true);
    expect([...effects.keys()]).toEqual([2]);
  });

  const healWorld = (supports: { kind: string; x: number }[]) => {
    const w = world(open(6, 1), [{ side: 0, kind: 'gun', x: 2, y: 0 }, ...supports.map((s) => ({ side: 0, kind: s.kind, x: s.x, y: 0 }))]);
    byId(w, 1)!.hp = 130;
    return w;
  };

  it('a repair aura heals every `every` ticks up to the maximum, with a repaired event', () => {
    const { world: out, events } = runTicks(healWorld([{ kind: 'repair', x: 3 }]), RS, [], 8);
    expect(events.filter((e) => e.t === 'repaired')).toEqual([2, 4, 6, 8].map((tick, i) => ({ t: 'repaired', tick, id: 1, by: 2, hp: i < 3 ? 5 : 5 })));
    expect(byId(out, 1)?.hp).toBe(150);
    const capped = runTicks(healWorld([{ kind: 'repair-big', x: 3 }]), RS, [], 12);
    expect(capped.events.filter((e) => e.t === 'repaired').map((e) => (e as { hp: number }).hp)).toEqual([12, 8]);
    expect(byId(capped.world, 1)?.hp).toBe(150);
  });

  it('repair auras do not stack, do not heal their source, and stop while disabled', () => {
    const both = runTicks(healWorld([{ kind: 'repair', x: 3 }, { kind: 'repair-big', x: 1 }]), RS, [], 4).events.filter((e) => e.t === 'repaired' && e.id === 1);
    expect(both.map((e) => [e.tick, (e as { hp: number }).hp])).toEqual([[4, 12]]);
    const self = healWorld([{ kind: 'repair', x: 5 }]);
    byId(self, 2)!.hp = 100;
    expect(byId(runTicks(self, RS, [], 6).world, 2)?.hp).toBe(100);
    const off = healWorld([{ kind: 'repair', x: 3 }]);
    byId(off, 2)!.status = [{ kind: 'disabled', ticks: 3 }];
    expect(runTicks(off, RS, [], 6).events.filter((e) => e.t === 'repaired').map((e) => e.tick)).toEqual([4, 6]);
  });

  it('never heals a unit destroyed in the same tick', () => {
    const w = world(open(6, 1), [{ side: 0, kind: 'walker', x: 2, y: 0 }, { side: 0, kind: 'repair', x: 3, y: 0 }, { side: 1, kind: 'gun', x: 0, y: 0 }]);
    byId(w, 1)!.hp = 5;
    const { world: out, events } = runTicks({ ...w, tick: 1 }, RS, [], 1);
    expect(byId(out, 1)).toBeUndefined();
    expect(events.some((e) => e.t === 'repaired')).toBe(false);
  });
});

describe('E3: marked and shielded', () => {
  it('marked raises all damage by the strongest mark', () => {
    const e = { status: [{ kind: 'marked', ticks: 2, amount: 20 }, { kind: 'marked', ticks: 0, amount: 90 }, { kind: 'slowed', ticks: 3 }] } as unknown as Entity;
    expect(markOf(e)).toBe(20);
    expect(markOf({ status: [{ kind: 'marked', ticks: 2 }] } as unknown as Entity)).toBe(0);
    expect(marked(7, 50)).toBe(10);
    expect(marked(7, 0)).toBe(7);
    const w = world(open(6, 1), [{ side: 0, kind: 'corroder', x: 0, y: 0 }, { side: 1, kind: 'walker', x: 3, y: 0 }]);
    const { world: out, events } = runTicks(w, RS, [], 3);
    expect(hitsOf(events, 2).map((h) => h.damage)).toEqual([10, 15, 15]);
    expect(byId(out, 2)?.status).toEqual([{ kind: 'marked', ticks: 3, amount: 50 }]);
    expect(isValidWorld(out, RS)).toBe(true);
  });

  it('a mark ends after its ticks', () => {
    const w = world(open(6, 1), [{ side: 0, kind: 'gun', x: 0, y: 0 }, { side: 1, kind: 'walker', x: 3, y: 0 }]);
    byId(w, 2)!.status = [{ kind: 'marked', ticks: 2, amount: 100 }];
    const { events, world: out } = runTicks(w, RS, [], 6);
    expect(hitsOf(events, 2).map((h) => h.damage)).toEqual([20, 10]);
    expect(byId(out, 2)?.status).toEqual([]);
  });

  it('marks merge: the stronger mark wins with its duration, equal marks keep the longer one', () => {
    const merge = (existing: { ticks: number; amount: number }, effect: { ticks: number; amount: number }) => {
      const corroder = archetype('c2', { weapon: weapon({ damage: 1, range: 5, vs: ALL, effect: { kind: 'marked', ...effect } }) });
      const rs = { ...RS, archetypes: { ...RS.archetypes, c2: corroder } };
      const w = world(open(6, 1), [{ side: 0, kind: 'c2', x: 0, y: 0 }, { side: 1, kind: 'walker', x: 3, y: 0 }], rs);
      byId(w, 2)!.status = [{ kind: 'marked', ...existing }];
      return byId(runTicks(w, rs, [], 1).world, 2)?.status;
    };
    expect(merge({ ticks: 5, amount: 20 }, { ticks: 9, amount: 10 })).toEqual([{ kind: 'marked', ticks: 4, amount: 20 }]);
    expect(merge({ ticks: 5, amount: 20 }, { ticks: 2, amount: 50 })).toEqual([{ kind: 'marked', ticks: 2, amount: 50 }]);
    expect(merge({ ticks: 5, amount: 20 }, { ticks: 9, amount: 20 })).toEqual([{ kind: 'marked', ticks: 9, amount: 20 }]);
    expect(merge({ ticks: 5, amount: 20 }, { ticks: 3, amount: 20 })).toEqual([{ kind: 'marked', ticks: 4, amount: 20 }]);
  });

  it('absorb: beam first at ×3/2, then other damage; depends only on the sums', () => {
    expect(absorb(30, 0, 10)).toEqual({ shield: 20, hp: 0 });
    expect(absorb(30, 0, 40)).toEqual({ shield: 0, hp: 10 });
    expect(absorb(30, 10, 0)).toEqual({ shield: 15, hp: 0 });
    expect(absorb(30, 20, 0)).toEqual({ shield: 0, hp: 0 });
    expect(absorb(30, 21, 0)).toEqual({ shield: 0, hp: 1 });
    expect(absorb(30, 10, 20)).toEqual({ shield: 0, hp: 5 });
    expect(absorb(30, 10, 15)).toEqual({ shield: 0, hp: 0 });
    expect(absorb(3, 1, 0)).toEqual({ shield: 2, hp: 0 });
    expect(absorb(1, 1, 0)).toEqual({ shield: 0, hp: 0 });
    expect(absorb(2, 2, 0)).toEqual({ shield: 0, hp: 0 });
    expect(absorb(2, 3, 0)).toEqual({ shield: 0, hp: 1 });
    expect(absorb(0, 4, 5)).toEqual({ shield: 0, hp: 9 });
    fc.assert(
      fc.property(fc.nat(200), fc.nat(200), fc.nat(200), (s, b, o) => {
        const r = absorb(s, b, o);
        expect(r.shield === 0 || r.hp === 0).toBe(true);
        expect(r.shield).toBeGreaterThanOrEqual(0);
        expect(r.shield).toBeLessThanOrEqual(s);
        expect(r.hp).toBeGreaterThanOrEqual(0);
        expect(r.hp).toBeLessThanOrEqual(b + o);
        // Shield points spent never exceed what the damage could take, and match it while the shield holds.
        if (r.shield > 0) expect(s - r.shield).toBe(Math.floor((3 * b) / 2) + o);
        if (b === 0) expect(r).toEqual({ shield: Math.max(0, s - o), hp: Math.max(0, o - s) });
        if (o === 0 && r.hp > 0) expect(Math.floor((3 * (b - r.hp)) / 2)).toBeGreaterThanOrEqual(s);
      })
    );
  });

  const shielded = (shooter: string) => world(open(6, 1), [{ side: 0, kind: shooter, x: 0, y: 0 }, { side: 1, kind: 'warden-shielded', x: 3, y: 0 }]);

  it('a shield absorbs damage before health and the hit event says how much', () => {
    const { world: out, events } = runTicks(shielded('gun'), RS, [], 1);
    expect(byId(out, 2)).toMatchObject({ hp: 100, shield: 20, shieldAt: 1, hitAt: 1 });
    expect(hitsOf(events, 2)).toEqual([{ t: 'hit', tick: 1, id: 2, side: 1, damage: 0, shield: 10 }]);
    // 10 per shot every tick: the fourth shot breaks through.
    const later = runTicks(shielded('rapid'), RS, [], 4);
    expect(hitsOf(later.events, 2).map((h) => [h.damage, h.shield])).toEqual([[0, 10], [0, 10], [0, 10], [10, undefined]]);
    expect(isValidWorld(later.world, RS)).toBe(true);
  });

  it('beam damage counts ×3/2 against the shield', () => {
    const { world: out, events } = runTicks(shielded('laser'), RS, [], 2);
    expect(hitsOf(events, 2).map((h) => [h.damage, h.shield])).toEqual([[0, 15], [0, 15]]);
    expect(byId(out, 2)?.shield).toBe(0);
    const third = runTicks(out, RS, [], 1);
    expect(hitsOf(third.events, 2).map((h) => h.damage)).toEqual([10]);
  });

  it('the shield regenerates in full after regenDelay ticks without damage', () => {
    const w = shielded('gun');
    byId(w, 2)!.shield = 4;
    byId(w, 2)!.shieldAt = 0;
    w.entities = w.entities.filter((e) => e.id === 2);
    const ticks = runTicks(w, RS, [], 2);
    expect(byId(ticks.world, 2)?.shield).toBe(4);
    const full = runTicks(w, RS, [], 3).world;
    expect(byId(full, 2)?.shield).toBe(30);
    expect(byId(full, 2)).not.toHaveProperty('shieldAt');
    // Without a record of the last damage the shield comes back at once.
    const fresh = structuredClone(w);
    delete byId(fresh, 2)!.shieldAt;
    delete byId(fresh, 2)!.shield;
    expect(byId(runTicks(fresh, RS, [], 1).world, 2)?.shield).toBe(30);
  });

  it('an EMP hit strips the shield and blocks regeneration while disabled', () => {
    // The direct EMP hits on tick 1, the Blackout shell lands on tick 2 (and deals the minimum 1).
    for (const [kind, d] of [['emp', 0], ['blackout', 1]] as const) {
      const w = shielded(kind);
      const one = runTicks(w, RS, [], 1 + d).world;
      expect(byId(one, 2)).toMatchObject({ hp: 100, shield: 0, shieldAt: 1 + d, status: [{ kind: 'disabled', ticks: 4 }] });
      // Disabled for the next four ticks (regenDelay 3 alone would allow the third); back after them.
      const at = (n: number) => byId(runTicks(w, RS, [], n + d).world, 2)?.shield;
      expect([at(4), at(5), at(6)]).toEqual([0, 0, 30]);
    }
  });

  it('a shielded unit that is marked takes the raised damage on its shield', () => {
    const w = shielded('gun');
    byId(w, 2)!.status = [{ kind: 'marked', ticks: 3, amount: 50 }];
    expect(hitsOf(runTicks(w, RS, [], 1).events, 2)).toEqual([{ t: 'hit', tick: 1, id: 2, side: 1, damage: 0, shield: 15 }]);
  });
});

describe('validation of the extension fields', () => {
  const valid = () => {
    const w = world(open(6, 1), [{ side: 0, kind: 'gun', x: 0, y: 0 }, { side: 1, kind: 'warden-shielded', x: 3, y: 0 }]);
    w.tick = 5;
    return w;
  };

  it('accepts well-formed fields', () => {
    const w = valid();
    Object.assign(byId(w, 2)!, { shield: 0, shieldAt: 5, status: [{ kind: 'marked', ticks: 3, amount: 0 }] });
    byId(w, 1)!.haste = MAX_HASTE;
    expect(isValidWorld(w, RS)).toBe(true);
    expect(isValidWorld(w)).toBe(true);
    delete byId(w, 2)!.shield;
    expect(isValidWorld(w, RS)).toBe(true);
  });

  const cases: [string, (w: World) => void][] = [
    ['shield above the maximum', (w) => void (byId(w, 2)!.shield = 31)],
    ['negative shield', (w) => void (byId(w, 2)!.shield = -1)],
    ['fractional shield', (w) => void (byId(w, 2)!.shield = 1.5)],
    ['shield on an unshielded kind', (w) => void (byId(w, 1)!.shield = 1)],
    ['shieldAt on an unshielded kind', (w) => void (byId(w, 1)!.shieldAt = 1)],
    ['shieldAt in the future', (w) => void (byId(w, 2)!.shieldAt = 6)],
    ['shieldAt not a number', (w) => void (byId(w, 2)!.shieldAt = '1' as never)],
    ['haste above MAX_HASTE', (w) => void (byId(w, 1)!.haste = MAX_HASTE + 1)],
    ['fractional haste', (w) => void (byId(w, 1)!.haste = 0.5)],
    ['negative haste', (w) => void (byId(w, 1)!.haste = -1)],
    ['marked without amount', (w) => void (byId(w, 1)!.status = [{ kind: 'marked', ticks: 2 }])],
    ['marked amount too high', (w) => void (byId(w, 1)!.status = [{ kind: 'marked', ticks: 2, amount: 1001 }])],
    ['amount on slowed', (w) => void (byId(w, 1)!.status = [{ kind: 'slowed', ticks: 2, amount: 5 }])],
    ['unknown status', (w) => void (byId(w, 1)!.status = [{ kind: 'shielded', ticks: 2 } as never])]
  ];
  it.each(cases)('rejects %s', (_, change) => {
    const w = valid();
    change(w);
    expect(isValidWorld(w, RS)).toBe(false);
  });

  it('rejects out-of-range values without a ruleset as well', () => {
    const w = valid();
    byId(w, 2)!.shield = 2_000_000;
    expect(isValidWorld(w)).toBe(false);
  });

  it('never throws on arbitrary extension field values', () => {
    fc.assert(
      fc.property(fc.constantFrom('shield', 'shieldAt', 'haste'), fc.anything(), fc.anything(), fc.boolean(), (field, value, amount, withRuleset) => {
        const w = valid();
        (byId(w, 2) as unknown as Record<string, unknown>)[field] = value;
        byId(w, 1)!.status = [{ kind: 'marked', ticks: 1, amount } as never];
        expect(() => isValidWorld(w, withRuleset ? RS : undefined)).not.toThrow();
      })
    );
  });

  it('checks archetype extensions; createWorld refuses malformed ones', () => {
    for (const a of Object.values(RS.archetypes)) expect(validExtensions(a)).toBe(true);
    expect(invalidExtensions(BASE_RULESET)).toEqual([]);
    expect(invalidExtensions(STRATEGY_RULESET)).toEqual([]);
    const bad: Archetype[] = [
      archetype('a', { weapon: weapon({ pierce: true }) }),
      archetype('b', { weapon: weapon({ delivery: 'beam', pierce: 'yes' as never }) }),
      archetype('c', { weapon: weapon({ effect: { kind: 'marked', ticks: 3 } }) }),
      archetype('d', { weapon: weapon({ effect: { kind: 'marked', ticks: 3, amount: 0 } }) }),
      archetype('e', { weapon: weapon({ effect: { kind: 'slowed', ticks: 3, amount: 5 } }) }),
      archetype('f', { aura: { radius: -1, cooldownPct: 10 } }),
      archetype('g', { aura: { radius: 2 } }),
      archetype('h', { aura: { radius: 2, cooldownPct: 0 } }),
      archetype('i', { aura: { radius: 2, heal: { hp: 0, every: 2 } } }),
      archetype('j', { aura: { radius: 2, heal: { hp: 3, every: 0 } } }),
      archetype('k', { aura: { radius: 2, heal: null as never } }),
      archetype('l', { shield: { hp: 0, regenDelay: 3 } }),
      archetype('m', { shield: { hp: 10, regenDelay: 0 } }),
      archetype('n', { shield: 'x' as never }),
      archetype('o', { aura: 'x' as never })
    ];
    for (const a of bad) expect(validExtensions(a), a.id).toBe(false);
    expect(validExtensions(archetype('p', { weapon: weapon({ delivery: 'beam', pierce: false }) }))).toBe(true);
    expect(validExtensions(archetype('q', { weapon: weapon({ pierce: false }) }))).toBe(true);
    expect(validExtensions(archetype('r', { aura: { radius: 0, heal: { hp: 1, every: 1 } } }))).toBe(true);
    const broken: Ruleset = { ...RS, archetypes: { ...RS.archetypes, a: bad[0]!, c: bad[2]! } };
    expect(invalidExtensions(broken)).toEqual(['a', 'c']);
    expect(() => createWorld({ map: open(2, 1), sides: 2, entities: [], seed: 1 }, broken)).toThrow(/'a', 'c'/);
  });
});

describe('properties with every extension in play', () => {
  // The random worlds of the engine suites on a ruleset where the base kinds use the extensions.
  const X: Ruleset = {
    ...BASE_RULESET,
    id: 'td-ext-props',
    archetypes: {
      ...BASE_ARCHETYPES,
      'tower-laser': { ...A['tower-laser']!, weapon: { ...A['tower-laser']!.weapon!, pierce: true } },
      muster: { ...A['muster']!, aura: { radius: 3, cooldownPct: 50, heal: { hp: 7, every: 3 } } },
      'relay-mast': { ...A['relay-mast']!, aura: { radius: 2, cooldownPct: 25, heal: { hp: 20, every: 5 } } },
      warden: { ...A['warden']!, shield: { hp: 30, regenDelay: 4 } },
      lancer: { ...A['lancer']!, shield: { hp: 10, regenDelay: 2 } },
      rifles: { ...A['rifles']!, weapon: { ...A['rifles']!.weapon!, effect: { kind: 'marked', ticks: 3, amount: 50 } } }
    }
  };
  const arb = arbWorld({ sides: 2, ruleset: X });
  const play = (world: World, plans: readonly Command[][]): World => plans.reduce((w, plan) => resolveTurn(w, X, [plan]).world, world);
  const RUNS = { numRuns: 120 };

  it('P1 determinism, P2 purity and P5 validity', () => {
    fc.assert(
      fc.property(arb, ({ world, plans }) => {
        const before = canonicalJson({ world, plans });
        const end = play(world, plans);
        expect(canonicalJson({ world, plans })).toBe(before);
        expect(worldHash(play(structuredClone(world), structuredClone(plans)))).toBe(worldHash(end));
        let w = world;
        for (const plan of plans) {
          w = resolveTurn(w, X, [plan]).world;
          expect(isValidWorld(w, X)).toBe(true);
          for (const e of w.entities) expect(e.hp).toBeLessThanOrEqual(X.archetypes[e.kind]?.hp ?? 0);
        }
      }),
      RUNS
    );
  });

  it('P4 mirror symmetry', () => {
    fc.assert(
      fc.property(arb, ({ world, plans }) => {
        const direct = mirrorWorld(play(world, plans));
        const mirrored = play(mirrorWorld(world), plans.map((p) => mirrorCommands(world, p)));
        expect(canonicalJson(mirrored)).toBe(canonicalJson(direct));
      }),
      RUNS
    );
  });

  it('P6 plan order', () => {
    fc.assert(
      fc.property(arb, ({ world, plans }) => {
        const bySide = (plan: readonly Command[], first: number) => [...plan.filter((c) => c.side === first), ...plan.filter((c) => c.side !== first)];
        expect(canonicalJson(play(world, plans.map((p) => bySide(p, 1))))).toBe(canonicalJson(play(world, plans.map((p) => bySide(p, 0)))));
      }),
      RUNS
    );
  });

  it('worlds without the extensions never gain an extension field or event key', () => {
    fc.assert(
      fc.property(arbWorld({ sides: 2 }), ({ world, plans }) => {
        let w = world;
        for (const plan of plans) {
          const r = resolveTurn(w, BASE_RULESET, [plan]);
          w = r.world;
          for (const e of w.entities) {
            expect(e).not.toHaveProperty('shield');
            expect(e).not.toHaveProperty('shieldAt');
            expect(e).not.toHaveProperty('haste');
            for (const s of e.status) expect(s).not.toHaveProperty('amount');
          }
          for (const ev of r.events) expect(ev).not.toHaveProperty('shield');
          expect(r.events.some((ev) => ev.t === 'repaired')).toBe(false);
        }
      }),
      { numRuns: 80 }
    );
  });

  it('spawning and removing keep random worlds valid', () => {
    fc.assert(
      fc.property(
        arb,
        fc.array(fc.record({ side: fc.integer({ min: -1, max: 2 }), kind: fc.constantFrom('rifles', 'warden', 'kite', 'tower-laser', 'nope'), x: fc.integer({ min: -1, max: 10 }), y: fc.integer({ min: -1, max: 10 }) }), { maxLength: 8 }),
        fc.array(fc.integer({ min: 0, max: 30 }), { maxLength: 5 }),
        ({ world }, specs, ids) => {
          const before = canonicalJson(world);
          const { world: w, spawned, refused } = spawnUnits(world, X, specs);
          expect(spawned.length + refused.length).toBe(specs.length);
          expect(isValidWorld(w, X)).toBe(true);
          const removed = removeEntities(w, ids);
          expect(isValidWorld(removed, X)).toBe(true);
          expect(isValidWorld(runTicks(removed, X, [], 3).world, X)).toBe(true);
          expect(canonicalJson(world)).toBe(before);
        }
      ),
      { numRuns: 100 }
    );
  });
});
