import { describe, expect, it } from 'vitest';
import { BASE_ARCHETYPES, BASE_RULESET, computeDamage, createWorld, resolveTurn, runTicks, validateCommand, type Command, type World } from '../src';
import { mapOf, open, worldOf } from './helpers';

const rs = BASE_RULESET;
const A = BASE_ARCHETYPES;
const unit = (w: World, id: number) => w.entities.find((e) => e.id === id);
const move = (side: number, id: number, x: number, y: number): Command => ({ side, unit: id, order: { type: 'move', x, y } });

describe('createWorld', () => {
  it('assigns ids, full hp and hold orders', () => {
    const w = worldOf(open(4, 4), [{ side: 0, kind: 'rifles', x: 0, y: 0 }, { side: 1, kind: 'kite', x: 0, y: 0 }]);
    expect(w.entities.map((e) => [e.id, e.hp, e.order.type])).toEqual([[1, 40, 'hold'], [2, 20, 'hold']]);
    expect(w.nextId).toBe(3);
  });

  it('rejects invalid scenarios', () => {
    const bad = (s: Partial<Parameters<typeof createWorld>[0]>) => () =>
      createWorld({ map: open(2, 2), sides: 2, entities: [], seed: 1, ...s }, rs);
    expect(bad({ map: { w: 2, h: 2, terrain: '...' } })).toThrow();
    expect(bad({ map: { w: 2, h: 1, terrain: '.X' } })).toThrow();
    expect(bad({ entities: [{ side: 0, kind: 'nope', x: 0, y: 0 }] })).toThrow();
    expect(bad({ entities: [{ side: 2, kind: 'rifles', x: 0, y: 0 }] })).toThrow();
    expect(bad({ map: mapOf('~.'), entities: [{ side: 0, kind: 'rifles', x: 0, y: 0 }] })).toThrow();
    expect(bad({ entities: [{ side: 0, kind: 'rifles', x: 0, y: 0 }, { side: 1, kind: 'warden', x: 0, y: 0 }] })).toThrow();
  });
});

describe('commands', () => {
  const w = worldOf(open(4, 4), [
    { side: 0, kind: 'rifles', x: 0, y: 0 },
    { side: 1, kind: 'tower-gun', x: 3, y: 3 },
    { side: 1, kind: 'command-post', x: 3, y: 0 }
  ]);
  it('validates ownership, mobility, bounds and targets', () => {
    expect(validateCommand(w, rs, move(0, 1, 3, 3))).toEqual({ ok: true });
    expect(validateCommand(w, rs, move(0, 9, 3, 3))).toEqual({ ok: false, reason: 'unknown-unit' });
    expect(validateCommand(w, rs, move(1, 1, 3, 3))).toEqual({ ok: false, reason: 'not-yours' });
    expect(validateCommand(w, rs, move(1, 2, 0, 0))).toEqual({ ok: false, reason: 'immobile' });
    expect(validateCommand(w, rs, move(0, 1, 4, 0))).toEqual({ ok: false, reason: 'out-of-bounds' });
    const wet = worldOf(mapOf('..~'), [{ side: 0, kind: 'rifles', x: 0, y: 0 }]);
    expect(validateCommand(wet, rs, move(0, 1, 2, 0))).toEqual({ ok: false, reason: 'impassable' });
    const proto = structuredClone(w);
    proto.entities[0]!.kind = 'constructor';
    expect(validateCommand(proto, rs, move(0, 1, 1, 1))).toEqual({ ok: false, reason: 'unknown-unit' });
    expect(validateCommand(w, rs, { side: 1, unit: 2, order: { type: 'attack', target: 1 } })).toEqual({ ok: true });
    expect(validateCommand(w, rs, { side: 1, unit: 3, order: { type: 'attack', target: 1 } })).toEqual({ ok: false, reason: 'no-weapon' });
    expect(validateCommand(w, rs, { side: 0, unit: 1, order: { type: 'attack', target: 1 } })).toEqual({ ok: false, reason: 'bad-target' });
    expect(validateCommand(w, rs, { side: 1, unit: 2, order: { type: 'hold' } })).toEqual({ ok: true });
    expect(validateCommand(w, rs, { side: 0, unit: 1, order: { type: 'dance' } as never })).toEqual({ ok: false, reason: 'bad-order' });
  });

  it('skips invalid commands during simulation', () => {
    const { world, events } = runTicks(w, rs, [move(1, 1, 3, 0)], 1);
    expect(unit(world, 1)?.order).toEqual({ type: 'hold' });
    expect(events.filter((e) => e.t === 'order')).toEqual([]);
  });
});

describe('movement', () => {
  it('accumulates movement points: rifles (2 MP/tick) cross a plain cell (4) every 2 ticks', () => {
    const w = worldOf(open(8, 1), [{ side: 0, kind: 'rifles', x: 0, y: 0 }]);
    const { world, events } = resolveTurn(w, rs, [[move(0, 1, 7, 0)], []]);
    expect(unit(world, 1)?.x).toBe(3);
    expect(events.filter((e) => e.t === 'move').map((e) => e.tick)).toEqual([2, 4, 6]);
    expect(world.turn).toBe(1);
    expect(world.tick).toBe(6);
  });

  it('is faster on roads and slower in forests', () => {
    const run = (row: string) => unit(resolveTurn(worldOf(mapOf(row), [{ side: 0, kind: 'rifles', x: 0, y: 0 }]), rs, [[move(0, 1, 7, 0)], []]).world, 1)?.x;
    expect(run('========')).toBe(6);
    expect(run('.fffffff')).toBe(2);
  });

  it('bumps all contenders for the same cell (symmetric, D15)', () => {
    const w = worldOf(open(3, 1), [{ side: 0, kind: 'outrider', x: 0, y: 0 }, { side: 1, kind: 'outrider', x: 2, y: 0 }]);
    const { world, events } = runTicks(w, rs, [move(0, 1, 2, 0), move(1, 2, 0, 0)], 1);
    expect(unit(world, 1)?.x).toBe(0);
    expect(unit(world, 2)?.x).toBe(2);
    expect(events.filter((e) => e.t === 'bump')).toHaveLength(2);
  });

  it('lets the lowest id of one side enter a cell its friends also want (no friendly deadlock)', () => {
    const w = worldOf(open(3, 1), [{ side: 0, kind: 'outrider', x: 0, y: 0 }, { side: 0, kind: 'outrider', x: 2, y: 0 }]);
    const { world, events } = runTicks(w, rs, [move(0, 1, 1, 0), move(0, 2, 1, 0)], 1);
    expect(events.filter((e) => e.t === 'move').map((e) => e.id)).toEqual([1]);
    expect(events.filter((e) => e.t === 'bump').map((e) => e.id)).toEqual([2]);
    expect([unit(world, 1)?.x, unit(world, 1)?.y]).toEqual([1, 0]);
    // Two friendly squads heading the same way both make progress over a turn.
    const pair = worldOf(open(8, 2), [{ side: 0, kind: 'rifles', x: 0, y: 0 }, { side: 0, kind: 'rifles', x: 0, y: 1 }]);
    const after = resolveTurn(pair, rs, [[move(0, 1, 7, 0), move(0, 2, 7, 0)]]).world;
    expect(unit(after, 1)!.x).toBeGreaterThan(0);
    expect(unit(after, 2)!.x).toBeGreaterThan(0);
  });

  it('routes around units that are not moving instead of queueing behind them', () => {
    const w = worldOf(open(5, 3), [{ side: 0, kind: 'outrider', x: 0, y: 1 }, { side: 0, kind: 'warden', x: 2, y: 1 }]);
    const { world, events } = runTicks(w, rs, [move(0, 1, 4, 1)], 6);
    expect(events.filter((e) => e.t === 'bump')).toEqual([]);
    expect([unit(world, 1)?.x, unit(world, 1)?.y]).toEqual([4, 1]);
  });

  it('never swaps units or enters an occupied cell, but air and ground layers coexist', () => {
    const w = worldOf(open(2, 1), [{ side: 0, kind: 'outrider', x: 0, y: 0 }, { side: 0, kind: 'outrider', x: 1, y: 0 }]);
    const { world } = runTicks(w, rs, [move(0, 1, 1, 0), move(0, 2, 0, 0)], 3);
    expect([unit(world, 1)?.x, unit(world, 2)?.x]).toEqual([0, 1]);
    const air = worldOf(open(2, 1), [{ side: 0, kind: 'kite', x: 0, y: 0 }, { side: 0, kind: 'warden', x: 1, y: 0 }]);
    expect(unit(runTicks(air, rs, [move(0, 1, 1, 0)], 1).world, 1)?.x).toBe(1);
  });

  it('paths around structures and stays when the goal is unreachable', () => {
    const w = worldOf(open(3, 3), [{ side: 0, kind: 'outrider', x: 0, y: 1 }, { side: 0, kind: 'command-post', x: 1, y: 1 }]);
    const { world } = runTicks(w, rs, [move(0, 1, 2, 1)], 6);
    expect([unit(world, 1)?.x, unit(world, 1)?.y]).toEqual([2, 1]);
    const island = worldOf(mapOf('.~.'), [{ side: 0, kind: 'outrider', x: 0, y: 0 }]);
    const r = runTicks(island, rs, [move(0, 1, 2, 0)], 3).world;
    expect(unit(r, 1)?.x).toBe(0);
    expect(unit(r, 1)?.mp).toBe(0);
  });
});

describe('combat', () => {
  it('computes damage with the armor matrix, cover and a minimum of 1', () => {
    const gun = A['tower-gun']?.weapon;
    if (!gun) throw new Error('missing');
    expect(computeDamage(8, gun, A.rifles!, 0)).toBe(8);
    expect(computeDamage(8, gun, A.rifles!, 25)).toBe(6);
    expect(computeDamage(8, gun, A.warden!, 0)).toBe(3);
    expect(computeDamage(1, gun, A.warden!, 25)).toBe(1);
    expect(computeDamage(18, A.warden!.weapon!, A.kite!, 0)).toBe(0);
  });

  it('applies damage simultaneously so two units can destroy each other', () => {
    const w = worldOf(open(3, 1), [{ side: 0, kind: 'rifles', x: 0, y: 0 }, { side: 1, kind: 'rifles', x: 2, y: 0 }]);
    w.entities.forEach((e) => (e.hp = 6));
    const { world, events } = runTicks(w, rs, [], 1);
    expect(world.entities).toEqual([]);
    expect(events.filter((e) => e.t === 'destroyed').map((e) => e.id)).toEqual([1, 2]);
  });

  it('respects range, cooldown and target priority (lowest hp, then nearest)', () => {
    const w = worldOf(open(5, 1), [
      { side: 0, kind: 'lancer', x: 0, y: 0 },
      { side: 1, kind: 'command-post', x: 2, y: 0 },
      { side: 1, kind: 'command-post', x: 3, y: 0 },
      { side: 1, kind: 'command-post', x: 4, y: 0 }
    ]);
    unit(w, 3)!.hp = 100;
    const { world, events } = runTicks(w, rs, [], 4);
    const fires = events.filter((e) => e.t === 'fire');
    expect(fires.map((e) => [e.tick, e.t === 'fire' && e.target])).toEqual([[1, 3], [3, 3]]);
    expect(unit(world, 4)?.hp).toBe(400);
  });

  it('prefers the ordered attack target and moves into range to engage it', () => {
    const w = worldOf(open(8, 1), [{ side: 0, kind: 'outrider', x: 0, y: 0 }, { side: 1, kind: 'command-post', x: 7, y: 0 }]);
    const { world, events } = runTicks(w, rs, [{ side: 0, unit: 1, order: { type: 'attack', target: 2 } }], 6);
    expect(unit(world, 1)?.x).toBe(5);
    expect(events.some((e) => e.t === 'fire' && e.target === 2)).toBe(true);
  });

  it('lands ballistic shells on the targeted cell after the flight time: moving targets can dodge', () => {
    const w = worldOf(open(8, 2), [{ side: 0, kind: 'howitzer', x: 0, y: 0 }, { side: 1, kind: 'outrider', x: 4, y: 0 }]);
    const stay = runTicks(w, rs, [], 3);
    expect(stay.events.filter((e) => e.t === 'launch').map((e) => e.tick)).toEqual([1]);
    expect(stay.events.find((e) => e.t === 'land')?.tick).toBe(3);
    expect(unit(stay.world, 2)?.hp).toBe(45 - 25);
    const dodge = runTicks(w, rs, [move(1, 2, 7, 0)], 3);
    expect(unit(dodge.world, 2)?.x).toBe(7);
    expect(unit(dodge.world, 2)?.hp).toBe(45);
  });

  it('splash hits every enemy within the radius, never friends', () => {
    const w = worldOf(open(8, 3), [
      { side: 0, kind: 'tower-artillery', x: 0, y: 1 },
      { side: 1, kind: 'command-post', x: 4, y: 1 },
      { side: 1, kind: 'command-post', x: 4, y: 0 },
      { side: 0, kind: 'rifles', x: 5, y: 1 }
    ]);
    const { world } = runTicks(w, rs, [], 3);
    expect(unit(world, 4)?.hp).toBe(40);
    expect(unit(world, 2)?.hp).toBeLessThanOrEqual(400 - 20);
    expect(unit(world, 3)?.hp).toBeLessThanOrEqual(400 - 20);
  });

  it('stationary weapons cannot fire in a tick they moved', () => {
    const w = worldOf(open(9, 1), [{ side: 0, kind: 'howitzer', x: 0, y: 0 }, { side: 1, kind: 'command-post', x: 8, y: 0 }]);
    const { events } = runTicks(w, rs, [move(0, 1, 2, 0)], 2);
    expect(events.filter((e) => e.t === 'launch')).toEqual([]);
  });

  it('beam damage ramps up on the same target and resets when it changes', () => {
    const w = worldOf(open(5, 1), [{ side: 0, kind: 'tower-laser', x: 0, y: 0 }, { side: 1, kind: 'warden', x: 3, y: 0 }]);
    const { events } = runTicks(w, rs, [], 6);
    expect(events.filter((e) => e.t === 'hit' && e.id === 2).map((e) => e.t === 'hit' && e.damage)).toEqual([4, 7, 10, 13, 16, 16]);
  });

  it('a hill extends direct range; forest cover reduces damage', () => {
    const flat = worldOf(open(5, 1), [{ side: 0, kind: 'tower-gun', x: 0, y: 0 }, { side: 1, kind: 'rifles', x: 4, y: 0 }]);
    expect(runTicks(flat, rs, [], 1).events.some((e) => e.t === 'fire')).toBe(false);
    const hill = worldOf(mapOf('h...f'), [{ side: 0, kind: 'tower-gun', x: 0, y: 0 }, { side: 1, kind: 'rifles', x: 4, y: 0 }]);
    const hit = runTicks(hill, rs, [], 1).events.find((e) => e.t === 'hit');
    expect(hit && hit.t === 'hit' && hit.damage).toBe(6);
  });

  it('EMP disables movement and fire for exactly the effect duration', () => {
    const w = worldOf(open(6, 1), [{ side: 0, kind: 'tower-emp', x: 0, y: 0 }, { side: 1, kind: 'rifles', x: 3, y: 0 }]);
    const r = runTicks(w, rs, [move(1, 2, 5, 0)], 2);
    // Fired tick 1, lands tick 2 (flight 1): disabled for ticks 3..8.
    expect(unit(r.world, 2)?.status).toEqual([{ kind: 'disabled', ticks: 6 }]);
    const calm = { ...r.world, entities: r.world.entities.filter((e) => e.id !== 1) };
    const later = runTicks(calm, rs, [], 6);
    expect(later.events.filter((e) => e.t === 'move' && e.id === 2)).toEqual([]);
    expect(unit(later.world, 2)?.status).toEqual([]);
  });

  it('a ballistic unit ordered to attack a target inside its minimum range stays put instead of running into it', () => {
    const w = worldOf(open(12, 1), [{ side: 0, kind: 'howitzer', x: 0, y: 0 }, { side: 1, kind: 'command-post', x: 2, y: 0 }]);
    const { world, events } = runTicks(w, rs, [{ side: 0, unit: 1, order: { type: 'attack', target: 2 } }], 30);
    expect(unit(world, 1)?.x).toBe(0);
    expect(events.filter((e) => e.t === 'bump')).toEqual([]);
    expect(unit(world, 1)?.mp).toBe(0);
  });

  it('never crashes on archetype names from the object prototype chain', () => {
    const w = worldOf(open(3, 1), [{ side: 0, kind: 'rifles', x: 0, y: 0 }]);
    w.entities[0]!.kind = 'constructor';
    expect(() => runTicks(w, rs, [], 1)).toThrow(RangeError);
  });

  it('drops attack orders whose target was destroyed', () => {
    const w = worldOf(open(3, 1), [{ side: 0, kind: 'warden', x: 0, y: 0 }, { side: 1, kind: 'rifles', x: 2, y: 0 }]);
    unit(w, 2)!.hp = 1;
    const { world } = runTicks(w, rs, [{ side: 0, unit: 1, order: { type: 'attack', target: 2 } }], 1);
    expect(unit(world, 1)?.order).toEqual({ type: 'hold' });
  });
});
