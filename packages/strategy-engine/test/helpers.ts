import fc from 'fast-check';
import { BASE_RULESET, createWorld, NEUTRAL, STRATEGY_RULESET, type Command, type Doctrine, type Frame, type GameMap, type Order, type Projectile, type Ruleset, type Scenario, type World } from '../src';

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
        : o.type === 'build'
          ? { type: 'build', kind: o.kind, x: mx(o.x), y: my(o.y) }
          : o;
  const deposits = w.map.deposits?.map((d) => ({ x: mx(d.x), y: my(d.y), left: d.left })).sort((a, b) => a.y * w.map.w + a.x - (b.y * w.map.w + b.x));
  return {
    ...structuredClone(w),
    map: { ...w.map, terrain: [...w.map.terrain].reverse().join(''), ...(deposits && { deposits }) },
    ...(w.supply && { supply: w.supply.map((_, side) => w.supply?.[ms(side)] ?? 0) }),
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
          : o.type === 'build'
            ? { type: 'build', kind: o.kind, x: mx(o.x), y: my(o.y) }
            : o;
    return { ...c, side: c.side === 0 ? 1 : 0, order };
  });

const KINDS = ['rifles', 'lancer', 'outrider', 'warden', 'howitzer', 'kite', 'tower-gun', 'tower-artillery', 'tower-laser', 'tower-emp', 'command-post', 'mast-truck', 'field-post', 'relay-mast', 'jammer', 'tracer', 'muster', 'motor-pool', 'extractor'];
const PRODUCTS = ['rifles', 'lancer', 'warden', 'howitzer', 'outrider', 'mast-truck'];
const STRUCTURES = ['muster', 'motor-pool', 'extractor', 'relay-mast'];
const TERRAIN = ['.', '.', '.', '=', 'f', 'h', 'u', 's', '~', '^'];

/** Random small valid world with two sides plus commands for a few turns. */
export const arbScenario = arbWorld({ sides: 2 });

/**
 * Random small valid world plus commands for a few turns: `sides` playing sides (units spread
 * over them), optionally square, with the given teams and frames.
 */
export function arbWorld(options: { sides: number; square?: boolean; teams?: number[]; frames?: Frame[]; neutral?: boolean; supply?: number; ruleset?: Ruleset }) {
  return fc
  .record({
    w: fc.integer({ min: 4, max: 10 }),
    h: fc.integer({ min: 4, max: 10 }),
    seed: fc.integer({ min: 0, max: 0xffff }),
    terrain: fc.array(fc.constantFrom(...TERRAIN), { minLength: 100, maxLength: 100 }),
    units: fc.array(fc.record({ side: fc.integer({ min: options.neutral ? -1 : 0, max: options.sides - 1 }), kind: fc.constantFrom(...KINDS), cell: fc.nat(99) }), { maxLength: 14 }),
    deposits: fc.array(fc.record({ cell: fc.nat(99), left: fc.integer({ min: 0, max: 60 }) }), { maxLength: 4 }),
    orders: fc.array(
      fc.record({
        turn: fc.nat(3),
        unit: fc.integer({ min: 1, max: 14 }),
        type: fc.constantFrom('hold', 'move', 'attack', 'deploy', 'escort', 'patrol', 'regroup', 'produce', 'build', 'repair', 'sell'),
        kind: fc.constantFrom(...PRODUCTS, ...STRUCTURES),
        doctrine: fc.option(
          fc.record({
            retreatBelow: fc.constantFrom(0, 25, 50, 75),
            priority: fc.constantFrom('weakest', 'nearest', 'armor', 'infantry', 'structures', 'emitters'),
            seekCover: fc.boolean(),
            holdFire: fc.boolean(),
            lostContact: fc.constantFrom('regroup', 'keep')
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
  .map(({ w, h: rawH, seed, terrain, units, orders, deposits }) => {
    const h = options.square ? w : rawH;
    const terrainRow = terrain.slice(0, w * w * h > 0 ? w * h : 0).join('');
    const cells = new Map<number, { x: number; y: number; left: number }>();
    for (const d of deposits) {
      const x = d.cell % w;
      const y = Math.floor(d.cell / w) % h;
      const ch = terrainRow[y * w + x];
      if (ch === '~' || ch === '^') continue;
      cells.set(y * w + x, { x, y, left: d.left });
    }
    const map: GameMap = { w, h, terrain: terrainRow, ...(cells.size > 0 && { deposits: [...cells.values()] }) };
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
    const world = createWorld(
      {
        map,
        sides: options.sides,
        // Neutral only for Command Posts; any other kind drawn as neutral joins side 0.
        entities: entities.map((e) => (e.side === NEUTRAL && e.kind !== 'command-post' ? { ...e, side: 0 } : e)),
        seed,
        ...(options.teams && { teams: options.teams }),
        ...(options.frames && { frames: options.frames }),
        ...(options.supply !== undefined && { supply: Array.from({ length: options.sides }, () => options.supply as number) })
      },
      options.ruleset ?? (options.supply !== undefined ? STRATEGY_RULESET : BASE_RULESET)
    );
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
                    : o.type === 'produce'
                      ? { type: 'produce', kind: o.kind }
                      : o.type === 'build'
                        ? { type: 'build', kind: o.kind, x: o.x % w, y: o.y % h }
                        : o.type === 'repair'
                          ? { type: 'repair', target: o.target }
                          : o.type === 'sell'
                            ? { type: 'sell' }
                            : { type: 'hold' };
      plans[o.turn]?.push(o.doctrine ? { side, unit: o.unit, order, doctrine: o.doctrine as Doctrine } : { side, unit: o.unit, order });
    }
    return { world, plans };
  });
}

/**
 * A world carried over by a map symmetry: `at` maps a cell's coordinates, `side` permutes the
 * sides (neutral stays neutral). Ids are kept; terrain, deposits, orders, reports, supply,
 * projectiles and stored cell keys follow. For square maps when `at` turns the map.
 */
export function transformWorld(w: World, at: (x: number, y: number) => readonly [number, number], side: (s: number) => number): World {
  const cells = w.map.w * w.map.h;
  const cell = (c: number): number => {
    const [x, y] = at(c % w.map.w, Math.floor(c / w.map.w));
    return y * w.map.w + x;
  };
  const order = (o: Order): Order => {
    if (o.type === 'move') {
      const [x, y] = at(o.x, o.y);
      return { type: 'move', x, y };
    }
    if (o.type === 'patrol') {
      const [x, y] = at(o.x, o.y);
      const [rx, ry] = at(o.rx, o.ry);
      return { type: 'patrol', x, y, rx, ry };
    }
    if (o.type === 'build') {
      const [x, y] = at(o.x, o.y);
      return { type: 'build', kind: o.kind, x, y };
    }
    return o;
  };
  const terrain: string[] = new Array<string>(cells);
  for (let c = 0; c < cells; c++) terrain[cell(c)] = w.map.terrain[c] ?? '.';
  const deposits = w.map.deposits?.map((d) => {
    const [x, y] = at(d.x, d.y);
    return { x, y, left: d.left };
  }).sort((a, b) => a.y * w.map.w + a.x - (b.y * w.map.w + b.x));
  const bySide = <T>(list: readonly T[]): T[] => {
    const out = [...list];
    list.forEach((v, s) => (out[side(s)] = v));
    return out;
  };
  return {
    ...structuredClone(w),
    map: { ...w.map, terrain: terrain.join(''), ...(deposits && { deposits }) },
    ...(w.supply && { supply: bySide(w.supply) }),
    ...(w.teams && { teams: bySide(w.teams) }),
    ...(w.out && { out: w.out.map(side).sort((a, b) => a - b) }),
    entities: w.entities.map((e) => {
      const [x, y] = at(e.x, e.y);
      return {
        ...structuredClone(e),
        side: e.side === NEUTRAL ? NEUTRAL : side(e.side),
        x,
        y,
        order: order(e.order),
        ...(e.stall && { stall: { ...e.stall, goal: e.stall.goal < cells ? cell(e.stall.goal) : e.stall.goal } }),
        ...(e.prev !== undefined && { prev: cell(e.prev) })
      };
    }),
    projectiles: w.projectiles.map((p): Projectile => {
      const [x, y] = at(p.x, p.y);
      return { ...p, side: side(p.side), x, y };
    }),
    ...(w.intel && {
      intel: bySide(w.intel.map((list) => list.map((r) => {
        const [x, y] = at(r.x, r.y);
        return { ...r, side: r.side === NEUTRAL ? NEUTRAL : side(r.side), x, y };
      })))
    })
  };
}

/** Commands carried over by the same symmetry as `transformWorld`. */
export const transformCommands = (commands: readonly Command[], at: (x: number, y: number) => readonly [number, number], side: (s: number) => number): Command[] =>
  commands.map((c) => {
    const o = c.order;
    let order: Order = o;
    if (o.type === 'move' || o.type === 'build') {
      const [x, y] = at(o.x, o.y);
      order = { ...o, x, y };
    } else if (o.type === 'patrol') {
      const [x, y] = at(o.x, o.y);
      const [rx, ry] = at(o.rx, o.ry);
      order = { type: 'patrol', x, y, rx, ry };
    }
    return { ...c, side: side(c.side), order };
  });
