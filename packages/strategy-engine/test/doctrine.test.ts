import { describe, expect, it } from 'vitest';
import {
  BASE_RULESET,
  createWorld,
  DEFAULT_DOCTRINE,
  isValidWorld,
  resolveTurn,
  runTicks,
  STRATEGY_RULESET,
  validateCommand,
  type Command,
  type Doctrine,
  type Scenario,
  type World
} from '../src';
import { mapOf, open } from './helpers';

const net = STRATEGY_RULESET;
const base = BASE_RULESET;
const worldOf = (map: Scenario['map'], entities: Scenario['entities']): World => createWorld({ map, sides: 2, entities, seed: 1 }, net);
const unit = (w: World, id: number) => w.entities.find((e) => e.id === id)!;
const doctrine = (d: Partial<Doctrine>): Doctrine => ({ ...DEFAULT_DOCTRINE, ...d });

describe('doctrines (D6)', () => {
  it('a doctrine is set together with an order, costs the same slot and persists out of contact', () => {
    const w = worldOf(open(14, 1), [{ side: 0, kind: 'command-post', x: 0, y: 0 }, { side: 0, kind: 'rifles', x: 3, y: 0 }]);
    const cmd: Command = { side: 0, unit: 2, order: { type: 'move', x: 12, y: 0 }, doctrine: doctrine({ retreatBelow: 50, priority: 'armor' }) };
    const { world, events } = resolveTurn(w, net, [[cmd]]);
    expect(events.filter((e) => e.t === 'order')).toHaveLength(1);
    expect(unit(world, 2).doctrine).toEqual(doctrine({ retreatBelow: 50, priority: 'armor' }));
    // Later turns: out of contact, the doctrine stays.
    const later = resolveTurn(resolveTurn(world, net, [[]]).world, net, [[]]).world;
    expect(unit(later, 2).doctrine).toEqual(doctrine({ retreatBelow: 50, priority: 'armor' }));
  });

  it('retreat: a hit that takes the unit below the threshold switches it to regroup, back into coverage', () => {
    const w = worldOf(open(16, 1), [
      { side: 0, kind: 'command-post', x: 0, y: 0 },
      { side: 0, kind: 'rifles', x: 10, y: 0 },
      { side: 1, kind: 'warden', x: 13, y: 0 }
    ]);
    const u = unit(w, 2);
    u.doctrine = doctrine({ retreatBelow: 50 });
    u.order = { type: 'move', x: 15, y: 0 };
    u.hp = 21;
    const { world, events } = resolveTurn(w, net, [[]]);
    expect(events.some((e) => e.t === 'hit' && e.id === 2)).toBe(true);
    expect(['regroup', 'hold']).toContain(unit(world, 2).order.type);
    expect(unit(world, 2).x).toBeLessThan(10);
  });

  it('regroup walks to the nearest covered cell and then holds', () => {
    const w = worldOf(open(16, 1), [{ side: 0, kind: 'command-post', x: 0, y: 0 }, { side: 0, kind: 'outrider', x: 9, y: 0 }]);
    unit(w, 2).order = { type: 'regroup' };
    const after = resolveTurn(resolveTurn(w, net, [[]]).world, net, [[]]).world;
    expect(unit(after, 2).x).toBe(5);
    expect(unit(after, 2).order).toEqual({ type: 'hold' });
  });

  it('target priority picks armour over weaker infantry, or simply the nearest', () => {
    const w = worldOf(open(6, 3), [
      { side: 0, kind: 'tower-gun', x: 0, y: 1 },
      { side: 1, kind: 'rifles', x: 3, y: 1 },
      { side: 1, kind: 'warden', x: 1, y: 0 }
    ]);
    unit(w, 2).hp = 5;
    const fire = (d: Partial<Doctrine>) => {
      const copy = structuredClone(w);
      unit(copy, 1).doctrine = doctrine(d);
      const ev = runTicks(copy, base, [], 1).events.find((e) => e.t === 'fire');
      return ev && ev.t === 'fire' ? ev.target : undefined;
    };
    expect(fire({})).toBe(2);
    expect(fire({ priority: 'armor' })).toBe(3);
    expect(fire({ priority: 'nearest' })).toBe(3);
    expect(fire({ priority: 'infantry' })).toBe(2);
    expect(fire({ priority: 'structures' })).toBe(2);
  });

  it('return fire only: holds fire until hit, then answers for a turn', () => {
    const w = worldOf(open(5, 1), [{ side: 0, kind: 'warden', x: 0, y: 0 }, { side: 1, kind: 'lancer', x: 3, y: 0 }]);
    unit(w, 1).doctrine = doctrine({ holdFire: true });
    unit(w, 2).doctrine = doctrine({ holdFire: true });
    const quiet = runTicks(w, base, [], 6);
    expect(quiet.events.filter((e) => e.t === 'fire')).toEqual([]);
    unit(w, 2).doctrine = DEFAULT_DOCTRINE;
    const fight = runTicks(w, base, [], 4);
    const shooters = fight.events.filter((e) => e.t === 'fire').map((e) => e.t === 'fire' && [e.tick, e.id]);
    expect(shooters[0]).toEqual([1, 2]);
    expect(shooters).toContainEqual([2, 1]);
  });

  it('seek cover: a holding unit steps onto an adjacent forest or building cell', () => {
    const w = worldOf(mapOf('...', '..f', '...'), [{ side: 0, kind: 'rifles', x: 1, y: 1 }]);
    unit(w, 1).doctrine = doctrine({ seekCover: true });
    const { world } = runTicks(w, base, [], 6);
    expect([unit(world, 1).x, unit(world, 1).y]).toEqual([2, 1]);
    // Without the doctrine it stays put.
    unit(w, 1).doctrine = DEFAULT_DOCTRINE;
    expect(unit(runTicks(w, base, [], 6).world, 1).x).toBe(1);
  });

  it('escort follows a friendly unit within two cells and stops when it is gone', () => {
    const w = worldOf(open(14, 1), [{ side: 0, kind: 'outrider', x: 10, y: 0 }, { side: 0, kind: 'rifles', x: 0, y: 0 }]);
    const after = resolveTurn(w, base, [[{ side: 0, unit: 2, order: { type: 'escort', target: 1 } }]]).world;
    expect(Math.abs(unit(after, 2).x - 10)).toBeGreaterThan(2);
    let world = after;
    for (let i = 0; i < 3; i++) world = resolveTurn(world, base, [[]]).world;
    expect((unit(world, 2).x - 10) ** 2).toBeLessThanOrEqual(4);
    const gone = resolveTurn({ ...world, entities: world.entities.filter((e) => e.id !== 1) }, base, [[]]).world;
    expect(unit(gone, 2).order).toEqual({ type: 'hold' });
  });

  it('patrol alternates between its two ends', () => {
    const w = worldOf(open(8, 1), [{ side: 0, kind: 'outrider', x: 0, y: 0 }]);
    let world = resolveTurn(w, base, [[{ side: 0, unit: 1, order: { type: 'patrol', x: 6, y: 0, rx: 0, ry: 0 } }]]).world;
    const seen = new Set<number>();
    for (let i = 0; i < 8; i++) {
      world = resolveTurn(world, base, [[]]).world;
      seen.add(unit(world, 1).x);
    }
    expect(seen.has(0) || seen.has(1)).toBe(true);
    expect(seen.has(6) || seen.has(5)).toBe(true);
    expect(unit(world, 1).order.type).toBe('patrol');
  });

  it('validates new orders and doctrines', () => {
    const w = worldOf(open(6, 1), [{ side: 0, kind: 'rifles', x: 0, y: 0 }, { side: 1, kind: 'rifles', x: 5, y: 0 }, { side: 0, kind: 'command-post', x: 2, y: 0 }]);
    const v = (c: Command) => validateCommand(w, base, c);
    expect(v({ side: 0, unit: 1, order: { type: 'escort', target: 3 } })).toEqual({ ok: true });
    expect(v({ side: 0, unit: 1, order: { type: 'escort', target: 2 } })).toEqual({ ok: false, reason: 'bad-target' });
    expect(v({ side: 0, unit: 1, order: { type: 'escort', target: 1 } })).toEqual({ ok: false, reason: 'bad-target' });
    expect(v({ side: 0, unit: 1, order: { type: 'patrol', x: 4, y: 0, rx: 0, ry: 0 } })).toEqual({ ok: true });
    expect(v({ side: 0, unit: 1, order: { type: 'patrol', x: 6, y: 0, rx: 0, ry: 0 } })).toEqual({ ok: false, reason: 'out-of-bounds' });
    expect(v({ side: 0, unit: 1, order: { type: 'regroup' } })).toEqual({ ok: true });
    expect(v({ side: 0, unit: 3, order: { type: 'regroup' } })).toEqual({ ok: false, reason: 'immobile' });
    expect(v({ side: 0, unit: 1, order: { type: 'hold' }, doctrine: { ...DEFAULT_DOCTRINE, retreatBelow: 33 as never } })).toEqual({ ok: false, reason: 'bad-order' });
    const bad = structuredClone(w);
    unit(bad, 1).doctrine = { ...DEFAULT_DOCTRINE, priority: 'tallest' as never };
    expect(isValidWorld(bad, base)).toBe(false);
    const ok = structuredClone(w);
    ok.tick = 5;
    unit(ok, 1).doctrine = doctrine({ seekCover: true });
    unit(ok, 1).hitAt = 3;
    unit(ok, 1).order = { type: 'patrol', x: 4, y: 0, rx: 0, ry: 0 };
    expect(isValidWorld(ok, base)).toBe(true);
  });
});
