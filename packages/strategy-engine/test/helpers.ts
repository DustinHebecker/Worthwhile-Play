import fc from 'fast-check';
import { BASE_RULESET, createWorld, type Command, type Doctrine, type GameMap, type Order, type Projectile, type Scenario, type World } from '../src';

/** Map from rows of terrain characters. */
export const mapOf = (...rows: string[]): GameMap => ({ w: rows[0]?.length ?? 0, h: rows.length, terrain: rows.join('') });

export const open = (w: number, h: number): GameMap => ({ w, h, terrain: '.'.repeat(w * h) });

export const worldOf = (map: GameMap, entities: Scenario['entities'], seed = 1): World =>
  createWorld({ map, sides: 2, entities, seed }, BASE_RULESET);

/** Point mirror (x → w-1-x, y → h-1-y) with sides 0 and 1 swapped. Entity ids are kept. */
export function mirrorWorld(w: World): World {
  const mx = (x: number) => w.map.w - 1 - x;
  const my = (y: number) => w.map.h - 1 - y;
  const ms = (s: number) => (s === 0 ? 1 : s === 1 ? 0 : s);
  const mirrorOrder = (o: Order): Order =>
    o.type === 'move'
      ? { type: 'move', x: mx(o.x), y: my(o.y) }
      : o.type === 'patrol'
        ? { type: 'patrol', x: mx(o.x), y: my(o.y), rx: mx(o.rx), ry: my(o.ry) }
        : o;
  return {
    ...structuredClone(w),
    map: { ...w.map, terrain: [...w.map.terrain].reverse().join('') },
    entities: w.entities.map((e) => ({
      ...structuredClone(e),
      side: ms(e.side),
      x: mx(e.x),
      y: my(e.y),
      order: mirrorOrder(e.order),
      // Progress keys below the cell count are cells (mirrored); above it, target ids (kept).
      ...(e.stall && { stall: { ...e.stall, goal: e.stall.goal < w.map.w * w.map.h ? w.map.w * w.map.h - 1 - e.stall.goal : e.stall.goal } }),
      ...(e.prev !== undefined && { prev: w.map.w * w.map.h - 1 - e.prev })
    })),
    projectiles: w.projectiles.map((p): Projectile => ({ ...p, side: ms(p.side), x: mx(p.x), y: my(p.y) })),
    ...(w.intel && {
      intel: w.intel.map((_, side) => (w.intel?.[ms(side)] ?? []).map((r) => ({ ...r, side: ms(r.side), x: mx(r.x), y: my(r.y) })))
    })
  };
}

export const mirrorCommands = (w: World, commands: readonly Command[]): Command[] =>
  commands.map((c) => {
    const mx = (x: number) => w.map.w - 1 - x;
    const my = (y: number) => w.map.h - 1 - y;
    const o = c.order;
    const order: Order =
      o.type === 'move'
        ? { type: 'move', x: mx(o.x), y: my(o.y) }
        : o.type === 'patrol'
          ? { type: 'patrol', x: mx(o.x), y: my(o.y), rx: mx(o.rx), ry: my(o.ry) }
          : o;
    return { ...c, side: c.side === 0 ? 1 : 0, order };
  });

const KINDS = ['rifles', 'lancer', 'outrider', 'warden', 'howitzer', 'kite', 'tower-gun', 'tower-artillery', 'tower-laser', 'tower-emp', 'command-post', 'mast-truck', 'field-post', 'relay-mast', 'jammer', 'tracer'];
const TERRAIN = ['.', '.', '.', '=', 'f', 'h', 'u', 's', '~', '^'];

/** Random small valid world with two sides plus commands for a few turns. */
export const arbScenario = fc
  .record({
    w: fc.integer({ min: 4, max: 10 }),
    h: fc.integer({ min: 4, max: 10 }),
    seed: fc.integer({ min: 0, max: 0xffff }),
    terrain: fc.array(fc.constantFrom(...TERRAIN), { minLength: 100, maxLength: 100 }),
    units: fc.array(fc.record({ side: fc.integer({ min: 0, max: 1 }), kind: fc.constantFrom(...KINDS), cell: fc.nat(99) }), { maxLength: 14 }),
    orders: fc.array(
      fc.record({
        turn: fc.nat(3),
        unit: fc.integer({ min: 1, max: 14 }),
        type: fc.constantFrom('hold', 'move', 'attack', 'deploy', 'escort', 'patrol', 'regroup'),
        doctrine: fc.option(
          fc.record({
            retreatBelow: fc.constantFrom(0, 25, 50, 75),
            priority: fc.constantFrom('weakest', 'nearest', 'armor', 'infantry', 'structures', 'emitters'),
            seekCover: fc.boolean(),
            holdFire: fc.boolean()
          }),
          { nil: undefined }
        ),
        x: fc.nat(9),
        y: fc.nat(9),
        target: fc.integer({ min: 1, max: 14 })
      }),
      { maxLength: 20 }
    )
  })
  .map(({ w, h, seed, terrain, units, orders }) => {
    const map: GameMap = { w, h, terrain: terrain.slice(0, w * h).join('') };
    const used = new Set<string>();
    const entities: { side: number; kind: string; x: number; y: number }[] = [];
    for (const u of units) {
      const x = u.cell % w;
      const y = Math.floor(u.cell / w) % h;
      const air = u.kind === 'kite';
      const ch = map.terrain[y * w + x];
      if (!air && (ch === '~' || ch === '^')) continue;
      const key = `${air}:${x},${y}`;
      if (used.has(key)) continue;
      used.add(key);
      entities.push({ side: u.side, kind: u.kind, x, y });
    }
    const world = worldOf(map, entities, seed);
    const plans: Command[][] = [[], [], [], []];
    for (const o of orders) {
      const unit = world.entities.find((e) => e.id === o.unit);
      const side = unit?.side ?? 0;
      const order: Order =
        o.type === 'move'
          ? { type: 'move', x: o.x % w, y: o.y % h }
          : o.type === 'attack'
            ? { type: 'attack', target: o.target }
            : o.type === 'deploy'
              ? { type: 'deploy' }
              : o.type === 'escort'
                ? { type: 'escort', target: o.target }
                : o.type === 'patrol'
                  ? { type: 'patrol', x: o.x % w, y: o.y % h, rx: o.y % w, ry: o.x % h }
                  : o.type === 'regroup'
                    ? { type: 'regroup' }
                    : { type: 'hold' };
      plans[o.turn]?.push(o.doctrine ? { side, unit: o.unit, order, doctrine: o.doctrine as Doctrine } : { side, unit: o.unit, order });
    }
    return { world, plans };
  });
