import { describe, expect, it } from 'vitest';
import {
  carrierOf,
  cellOf,
  computeNetwork,
  createWorld,
  droneState,
  isValidWorld,
  resolveTurn,
  STRATEGY_RULESET,
  validateCommand,
  withinLeash,
  worldHash,
  type Command,
  type Entity,
  type Scenario,
  type SimEvent,
  type World
} from '../src';
import { open } from './helpers';

/** Drones (owner decision 2026-10-27): the Scout Car carries a Kite. */
const rs = STRATEGY_RULESET;
const worldOf = (entities: Scenario['entities'], w = 18): World => createWorld({ map: open(w, 5), sides: 2, entities, seed: 1 }, rs);
const byId = (w: World, id: number) => w.entities.find((e) => e.id === id);
const kind = (w: World, k: string, side = 0) => w.entities.find((e) => e.kind === k && e.side === side) as Entity;
/** Plays turns; the commands of the first turn per side. */
const play = (w: World, turns: number, first: Command[] = []): { world: World; events: SimEvent[] } => {
  let world = w;
  const events: SimEvent[] = [];
  for (let i = 0; i < turns; i++) {
    const r = resolveTurn(world, rs, [i === 0 ? first.filter((c) => c.side === 0) : [], i === 0 ? first.filter((c) => c.side === 1) : []]);
    events.push(...r.events);
    world = r.world;
  }
  return { world, events };
};
const base = (extra: Scenario['entities'] = []) =>
  worldOf([{ side: 0, kind: 'command-post', x: 1, y: 2 }, { side: 0, kind: 'outrider', x: 2, y: 2 }, { side: 1, kind: 'command-post', x: 17, y: 2 }, ...extra]);
const launch = (w: World): Command => ({ side: 0, unit: kind(w, 'outrider').id, order: { type: 'launch' } });
const launched = (extra: Scenario['entities'] = []) => play(base(extra), 1, [launch(base(extra))]).world;

describe('drones', () => {
  it('a drone keeps radio contact through its carrier (owner review 2026-10-27): beyond the net it relays while the car stands in coverage', () => {
    const w = launched();
    const at = (world: World, id: number, x: number) => {
      const copy = structuredClone(world);
      Object.assign(copy.entities.find((e) => e.id === id)!, { x });
      return copy;
    };
    const drone = kind(w, 'kite');
    const car = kind(w, 'outrider');
    // The post (radius 5) covers x <= 6. The drone 6 cells out is beyond the post's reach for a
    // relay of radius 3, yet linked to its car at x = 2: it is a node and covers 3 cells around it.
    const out = at(w, drone.id, 7);
    const net = computeNetwork(out, rs, 0);
    expect(net.nodes).toContain(drone.id);
    expect(net.coverage[cellOf(out.map, 10, 2)]).toBe(1);
    expect(net.coverage[cellOf(out.map, 11, 2)]).toBe(0);
    // The car itself out of coverage: no link, and the drone is cut off as any relay would be.
    const lost = at(at(out, car.id, 8), drone.id, 12);
    const cut = computeNetwork(lost, rs, 0);
    expect(cut.nodes).not.toContain(drone.id);
    expect(cut.coverage[cellOf(lost.map, 12, 2)]).toBe(0);
    // An enemy drone never joins the own net, and a drone without its car (not the car's) has no link.
    expect(computeNetwork(out, rs, 1).nodes).not.toContain(drone.id);
    const orphan = structuredClone(out);
    delete orphan.entities.find((e) => e.id === car.id)!.drone;
    expect(computeNetwork(orphan, rs, 0).nodes).not.toContain(drone.id);
  });

  it('a Scout Car launches its drone with one order: it takes off above the car and escorts it; the car keeps its order', () => {
    const w = base();
    const car = kind(w, 'outrider');
    expect(droneState(rs, car)).toBe('aboard');
    expect(validateCommand(w, rs, launch(w))).toEqual({ ok: true });
    const { world, events } = play(w, 1, [launch(w)]);
    const drone = kind(world, 'kite');
    const after = byId(world, car.id)!;
    expect(drone).toMatchObject({ x: 2, y: 2, carrier: car.id, order: { type: 'escort', target: car.id } });
    expect(after.drone).toBe(drone.id);
    expect(after.order).toEqual({ type: 'hold' });
    expect(droneState(rs, after)).toBe('flying');
    expect(carrierOf(world, drone)?.id).toBe(car.id);
    expect(events).toContainEqual(expect.objectContaining({ t: 'drone-launched', id: drone.id, by: car.id, side: 0 }));
    expect(isValidWorld(world, rs)).toBe(true);
    // Only one drone: a second launch is refused, and only Scout Cars carry one.
    expect(validateCommand(world, rs, launch(world))).toEqual({ ok: false, reason: 'cannot-launch' });
    expect(validateCommand(w, rs, { side: 0, unit: kind(w, 'command-post').id, order: { type: 'launch' } })).toEqual({ ok: false, reason: 'cannot-launch' });
    expect(droneState(rs, kind(w, 'command-post'))).toBeUndefined();
  });

  it('takes off from a free neighbouring cell when another drone hovers above the car', () => {
    const w = structuredClone(base([{ side: 0, kind: 'kite', x: 2, y: 2 }]));
    const { world } = play(w, 1, [launch(w)]);
    const drone = world.entities.find((e) => e.kind === 'kite' && e.carrier !== undefined)!;
    expect(Math.max(Math.abs(drone.x - 2), Math.abs(drone.y - 2))).toBe(1);
  });

  it('flies anywhere within 5 cells of its carrier; a destination beyond is refused (leash)', () => {
    const w = launched();
    const drone = kind(w, 'kite');
    const move = (x: number, y: number): Command => ({ side: 0, unit: drone.id, order: { type: 'move', x, y } });
    expect(withinLeash(w, rs, drone, 7, 2)).toBe(true);
    expect(validateCommand(w, rs, move(7, 2))).toEqual({ ok: true });
    expect(validateCommand(w, rs, move(8, 2))).toEqual({ ok: false, reason: 'leash' });
    expect(validateCommand(w, rs, { side: 0, unit: drone.id, order: { type: 'patrol', x: 3, y: 2, rx: 8, ry: 2 } })).toEqual({ ok: false, reason: 'leash' });
    const { world } = play(w, 2, [move(7, 2)]);
    expect(byId(world, drone.id)).toMatchObject({ x: 7, y: 2 });
    // Anything that is not a drone has no leash.
    expect(withinLeash(w, rs, kind(w, 'outrider'), 17, 4)).toBe(true);
  });

  it('follows when its carrier drives off, and a move beyond the leash ends ("leash")', () => {
    let w = launched();
    const drone = kind(w, 'kite');
    const car = kind(w, 'outrider');
    w = play(w, 2, [{ side: 0, unit: drone.id, order: { type: 'move', x: 6, y: 2 } }]).world;
    expect(byId(w, drone.id)).toMatchObject({ x: 6, y: 2 });
    // The car drives away to the left edge; the drone's position x=6 is then 6 cells away.
    const { world, events } = play(w, 3, [{ side: 0, unit: car.id, order: { type: 'move', x: 0, y: 4 } }]);
    const d = byId(world, drone.id)!;
    const c = byId(world, car.id)!;
    expect((d.x - c.x) ** 2 + (d.y - c.y) ** 2).toBeLessThanOrEqual(25);
    expect(events.some((e) => e.t === 'drone-docked')).toBe(false);
    // A move that would cross the leash ends with its own reason: the drone sets out for the edge
    // of its leash while the car drives the other way.
    const far = play(launched(), 2, [
      { side: 0, unit: car.id, order: { type: 'move', x: 0, y: 4 } },
      { side: 0, unit: drone.id, order: { type: 'move', x: 7, y: 2 } }
    ]);
    expect(far.events).toContainEqual(expect.objectContaining({ t: 'order-ended', id: drone.id, reason: 'leash' }));
  });

  it('lands on its carrier when recalled: aboard again, no report of it stays behind, and it can take off again', () => {
    let w = launched();
    const drone = kind(w, 'kite');
    const car = kind(w, 'outrider');
    w = play(w, 1, [{ side: 0, unit: drone.id, order: { type: 'move', x: 5, y: 2 } }]).world;
    expect(validateCommand(w, rs, { side: 0, unit: car.id, order: { type: 'recall' } })).toEqual({ ok: false, reason: 'bad-order' });
    const { world, events } = play(w, 1, [{ side: 0, unit: drone.id, order: { type: 'recall' } }]);
    expect(byId(world, drone.id)).toBeUndefined();
    expect(byId(world, car.id)?.drone).toBeUndefined();
    expect(droneState(rs, byId(world, car.id)!)).toBe('aboard');
    expect(events).toContainEqual(expect.objectContaining({ t: 'drone-docked', id: drone.id, by: car.id }));
    expect(world.intel?.[0]?.some((r) => r.id === drone.id)).toBe(false);
    expect(isValidWorld(world, rs)).toBe(true);
    expect(validateCommand(world, rs, launch(world))).toEqual({ ok: true });
  });

  it('a lost drone is replaced for free two turn ends later; a drone falls with its carrier', () => {
    // The drone flies within reach of an enemy Gun Tower that cannot reach the car, and is shot down.
    const start = base([{ side: 1, kind: 'tower-gun', x: 7, y: 2 }]);
    const car = kind(start, 'outrider');
    let { world: w, events } = play(start, 1, [launch(start)]);
    const drone = { id: (events.find((e) => e.t === 'drone-launched') as { id: number }).id };
    ({ world: w, events } = play(w, 1, [{ side: 0, unit: drone.id, order: { type: 'move', x: 5, y: 2 } }]));
    for (let turn = 2; byId(w, drone.id) && turn < 10; turn++) ({ world: w, events } = play(w, 1));
    expect(byId(w, drone.id)).toBeUndefined();
    expect(events).toContainEqual(expect.objectContaining({ t: 'destroyed', id: drone.id }));
    const supply = w.supply?.[0];
    // Lost in this turn: one turn end counted already, ready after the next.
    expect(byId(w, car.id)?.rebuild).toBe(1);
    expect(droneState(rs, byId(w, car.id)!)).toBe('rebuilding');
    expect(validateCommand(w, rs, launch(w))).toEqual({ ok: false, reason: 'cannot-launch' });
    const next = play(w, 1);
    expect(next.events).toContainEqual(expect.objectContaining({ t: 'drone-ready', id: car.id, side: 0 }));
    expect(byId(next.world, car.id)?.rebuild).toBeUndefined();
    expect(next.world.supply?.[0]).toBeGreaterThanOrEqual(supply ?? 0); // free
    expect(isValidWorld(next.world, rs)).toBe(true);

    // The carrier destroyed: its drone falls in the same tick (a tank drives up, it cannot hit the drone).
    let v = launched([{ side: 1, kind: 'warden', x: 10, y: 2, order: { type: 'move', x: 4, y: 2 } }]);
    const drone2 = kind(v, 'kite');
    const car2 = kind(v, 'outrider');
    for (let i = 0; i < 10 && byId(v, car2.id); i++) v = play(v, 1).world;
    expect(byId(v, car2.id)).toBeUndefined();
    expect(byId(v, drone2.id)).toBeUndefined();
    expect(isValidWorld(v, rs)).toBe(true);
  });

  it('is fired on only when nothing else is in reach (no free decoy), unless ordered', () => {
    // A Gun Tower with both the car and its drone in reach shoots the car.
    let w = launched([{ side: 1, kind: 'tower-gun', x: 4, y: 2 }]);
    const drone = kind(w, 'kite');
    const car = kind(w, 'outrider');
    const tower = kind(w, 'tower-gun', 1);
    const fire = play(w, 1).events.filter((e) => e.t === 'fire' && e.id === tower.id);
    expect(fire.length).toBeGreaterThan(0);
    // It shoots the car (and after it the post), never the drone above it.
    expect(fire[0]).toMatchObject({ target: car.id });
    expect(fire.some((e) => e.t === 'fire' && e.target === drone.id)).toBe(false);
    // Ordered at the drone, a unit fires at it.
    w = launched([{ side: 1, kind: 'rifles', x: 4, y: 3 }, { side: 1, kind: 'command-post', x: 8, y: 2 }]);
    const rifles = kind(w, 'rifles', 1);
    const ordered = play(w, 1, [{ side: 1, unit: rifles.id, order: { type: 'attack', target: kind(w, 'kite').id } }]).events;
    expect(ordered.some((e) => e.t === 'fire' && e.id === rifles.id && e.target === kind(w, 'kite').id)).toBe(true);
    expect(drone.id).toBeGreaterThan(0);
  });

  it('a launch is reported like a new unit; a landing and a replacement only to the owner', () => {
    // The enemy post at (6, 2) sees the car's cell.
    const start = base([{ side: 1, kind: 'command-post', x: 6, y: 2 }]);
    const up = resolveTurn(start, rs, [[launch(start)], []]);
    const launchedBy = (side: number) => up.reported?.[side]?.some((e) => e.t === 'drone-launched') ?? false;
    expect(launchedBy(0)).toBe(true);
    expect(launchedBy(1)).toBe(true);
    // Far from any enemy, the launch is the owner's alone.
    const far = base();
    const alone = resolveTurn(far, rs, [[launch(far)], []]);
    expect(alone.reported?.[0]?.some((e) => e.t === 'drone-launched')).toBe(true);
    expect(alone.reported?.[1]?.some((e) => e.t === 'drone-launched')).toBe(false);
    // Landing, in sight of the enemy post: told to the owner only.
    const drone = kind(up.world, 'kite');
    const down = resolveTurn(up.world, rs, [[{ side: 0, unit: drone.id, order: { type: 'recall' } }], []]);
    expect(down.events.some((e) => e.t === 'drone-docked')).toBe(true);
    expect(down.reported?.[0]?.some((e) => e.t === 'drone-docked')).toBe(true);
    expect(down.reported?.[1]?.some((e) => e.t === 'drone-docked')).toBe(false);
    // A replacement: told to the owner only.
    const lost = structuredClone(up.world);
    const car = kind(lost, 'outrider');
    lost.entities = lost.entities.filter((e) => e.kind !== 'kite');
    delete car.drone;
    car.rebuild = 1;
    if (lost.intel) lost.intel = lost.intel.map((l) => l.filter((r) => r.kind !== 'kite'));
    const ready = resolveTurn(lost, rs, [[], []]);
    expect(ready.reported?.[0]?.some((e) => e.t === 'drone-ready' && e.id === car.id)).toBe(true);
    expect(ready.reported?.[1]?.some((e) => e.t === 'drone-ready')).toBe(false);
  });

  it('everything but artillery and tanks can hit it', () => {
    // The enemy sees the drone (its post covers its Rifle Squad), and nobody is in range of anything yet.
    const w = launched([
      { side: 1, kind: 'command-post', x: 8, y: 2 },
      { side: 1, kind: 'rifles', x: 5, y: 0 },
      { side: 1, kind: 'warden', x: 5, y: 4 },
      { side: 1, kind: 'howitzer', x: 12, y: 4 }
    ]);
    const drone = kind(w, 'kite');
    const attack = (k: string) => validateCommand(w, rs, { side: 1, unit: kind(w, k, 1).id, order: { type: 'attack', target: drone.id } });
    expect(attack('rifles')).toEqual({ ok: true });
    expect(attack('warden')).toEqual({ ok: false, reason: 'bad-target' });
    expect(attack('howitzer')).toEqual({ ok: false, reason: 'bad-target' });
    for (const k of Object.keys(rs.archetypes)) {
      const weapon = rs.archetypes[k]?.weapon;
      if (!weapon) continue;
      expect(weapon.vs.air > 0, k).toBe(!['warden', 'howitzer', 'tower-artillery'].includes(k));
    }
  });

  it('artillery fires at what the drone spots, with its own range', () => {
    // An Artillery Gun sees 3 cells; the enemy stands 6 away, within its range of 7.
    const setup = (fly: boolean) => {
      let w = worldOf([
        { side: 0, kind: 'command-post', x: 1, y: 2 },
        { side: 0, kind: 'outrider', x: 2, y: 2 },
        { side: 0, kind: 'howitzer', x: 3, y: 2 },
        { side: 1, kind: 'command-post', x: 17, y: 2 },
        { side: 1, kind: 'rifles', x: 9, y: 2, order: { type: 'hold' } }
      ]);
      if (!fly) return play(w, 4).events;
      w = play(w, 1, [launch(w)]).world;
      return play(w, 3, [{ side: 0, unit: kind(w, 'kite').id, order: { type: 'move', x: 6, y: 2 } }]).events;
    };
    const gun = (events: SimEvent[]) => events.filter((e) => e.t === 'launch' && e.x === 9 && e.y === 2).length;
    expect(gun(setup(false))).toBe(0);
    const events = setup(true);
    expect(gun(events)).toBeGreaterThan(0);
    expect(events).toContainEqual(expect.objectContaining({ t: 'destroyed', kind: 'rifles' }));
  });

  it('every step names the cell it left (turn replay), also for a drone that follows its car', () => {
    const w = launched();
    const drone = kind(w, 'kite');
    const { events } = play(w, 2, [{ side: 0, unit: drone.id, order: { type: 'move', x: 6, y: 2 } }]);
    const steps = events.filter((e): e is Extract<SimEvent, { t: 'move' }> => e.t === 'move' && e.id === drone.id);
    expect(steps.length).toBeGreaterThan(0);
    let at = { x: drone.x, y: drone.y };
    for (const s of steps) {
      expect({ x: s.fx, y: s.fy }).toEqual(at);
      at = { x: s.x, y: s.y };
    }
    expect(at).toEqual({ x: 6, y: 2 });
  });

  it('launches in one batch get the same ids whatever order the plans come in', () => {
    const w = worldOf([
      { side: 0, kind: 'command-post', x: 1, y: 2 },
      { side: 0, kind: 'outrider', x: 2, y: 2 },
      { side: 0, kind: 'outrider', x: 3, y: 1 },
      { side: 1, kind: 'command-post', x: 16, y: 2 },
      { side: 1, kind: 'outrider', x: 15, y: 2 }
    ]);
    const cars = w.entities.filter((e) => e.kind === 'outrider');
    const commands = cars.map((c): Command => ({ side: c.side, unit: c.id, order: { type: 'launch' } }));
    const a = resolveTurn(w, rs, [commands.filter((c) => c.side === 0), commands.filter((c) => c.side === 1)]).world;
    const b = resolveTurn(w, rs, [[...commands.filter((c) => c.side === 0)].reverse(), commands.filter((c) => c.side === 1)]).world;
    expect(worldHash(a)).toBe(worldHash(b));
    expect(a.entities.filter((e) => e.kind === 'kite')).toHaveLength(3);
  });

  it('saves with broken drone links are refused', () => {
    const w = launched();
    const drone = kind(w, 'kite');
    const car = kind(w, 'outrider');
    const edit = (f: (c: World) => void) => {
      const c = structuredClone(w);
      f(c);
      return isValidWorld(c, rs);
    };
    expect(edit(() => undefined)).toBe(true);
    expect(edit((c) => (byId(c, car.id)!.drone = 999))).toBe(false);
    expect(edit((c) => delete byId(c, car.id)!.drone)).toBe(false);
    expect(edit((c) => (byId(c, drone.id)!.carrier = kind(c, 'command-post').id))).toBe(false);
    expect(edit((c) => (byId(c, car.id)!.rebuild = 1))).toBe(false); // in the air and being replaced
    expect(edit((c) => {
      delete byId(c, car.id)!.drone;
      c.entities = c.entities.filter((e) => e.id !== drone.id);
      if (c.intel) c.intel = c.intel.map((l) => l.filter((r) => r.id !== drone.id));
      byId(c, car.id)!.rebuild = 3; // beyond its rebuild time
    })).toBe(false);
    expect(edit((c) => (kind(c, 'command-post').rebuild = 1))).toBe(false); // not a carrier
    expect(edit((c) => (kind(c, 'command-post').drone = drone.id))).toBe(false);
    expect(edit((c) => (kind(c, 'outrider').carrier = car.id))).toBe(false); // a ground unit on a leash
    // Without a ruleset only the shape is checked.
    expect(isValidWorld(w)).toBe(true);
  });
});
