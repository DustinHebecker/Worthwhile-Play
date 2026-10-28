import { NEUTRAL, type Frame, type Scenario } from '@wp/strategy-engine';

/**
 * Hand-made, point-symmetric scenarios. Only the top half (side 1, top-right) is written down;
 * the bottom half and side 0's units are its point mirror, so both sides start equal.
 */
export interface ScenarioSpec {
  readonly id: string;
  /**
   * Default length when `newGame` is called without one (tests, replays). The app always passes
   * the length chosen in the setup (open end, 12, 24 or quick match), so this is not shown anywhere.
   */
  readonly turnLimit: number;
  /**
   * The map as authored. Two-side maps: sides 0 and 1. Maps with seats: an entity's side is its
   * seat; `scenarioFor` turns seats into sides for the chosen number of opponents.
   */
  readonly scenario: Scenario;
  /** Maps for several sides: the seats (bases) and which of them play for each opponent count. */
  readonly seats?: Seats;
  /**
   * Made asymmetric on purpose (large maps, owner request 2026-10-27): the starting places differ
   * in terrain, deposits and reach, and the player picks one (`start`). Fairness is measured (AI
   * against AI from either place), not mirrored.
   */
  readonly asymmetric?: true;
}

/**
 * Seats of a map for several sides (docs/design/strategy.md § 9.4). `frames[seat]` is how that
 * seat sees the map (so a symmetric map stays fair, ADR 0009); `layouts[n]` lists the seats that
 * play against `n` opponents, the player's first. A seat left empty keeps its Command Post as a
 * neutral post anyone can capture; its other pieces are not set up.
 */
export interface Seats {
  readonly frames: readonly Frame[];
  readonly layouts: Readonly<Record<number, readonly number[]>>;
  /**
   * Maps made for teams (asymmetric, owner decision 2026-10-24): the team shapes they offer and,
   * per shape, the seats that play (in side order, the player's first). Such a map has no
   * free-for-all; `layouts` then only declares the opponent count.
   */
  readonly teams?: Readonly<Record<string, readonly number[]>>;
}

/** The opponent counts a map offers (two-side maps: one). */
export const opponentCounts = (spec: ScenarioSpec): number[] =>
  spec.seats ? Object.keys(spec.seats.layouts).map(Number).sort((a, b) => a - b) : [1];

/**
 * The scenario for `opponents` opponents (and, on a map made for teams, the team `shape`): seats
 * become sides 0…n (the player is side 0), empty seats neutral posts.
 *
 * `start` (owner request 2026-10-27: pick the own starting place on every map) is the seat the
 * player takes; `null` is the map's default. Two-side maps: seat 1 swaps the sides (and their
 * frames). Maps with seats: on a map made for teams the player swaps places with that seat (a
 * seat of the player's own team, see `startSeats` in rules); otherwise the seats are turned round
 * the map so the player sits there and every other side keeps its place relative to the player
 * (next to, across). A start the map cannot give is `undefined`.
 */
export function scenarioFor(spec: ScenarioSpec, opponents: number, shape: string | null = null, start: number | null = null): Scenario | undefined {
  if (!spec.seats) {
    if (opponents !== 1 || (start !== null && start !== 0 && start !== 1)) return undefined;
    if (start !== 1) return spec.scenario;
    const swap = (side: number) => (side === 0 ? 1 : side === 1 ? 0 : side);
    const supply = spec.scenario.supply;
    return {
      ...spec.scenario,
      entities: spec.scenario.entities.map((e) => ({ ...e, side: swap(e.side) })),
      frames: ['r180', 'id'],
      ...(supply && { supply: [supply[1] ?? 0, supply[0] ?? 0] })
    };
  }
  const byShape = spec.seats.teams;
  const base = byShape ? (shape !== null && Object.hasOwn(byShape, shape) && byShape[shape]!.length === opponents + 1 ? byShape[shape] : undefined) : spec.seats.layouts[opponents];
  if (!base) return undefined;
  const count = spec.seats.frames.length;
  let layout: readonly number[] = base;
  if (start !== null && start !== base[0]) {
    if (!Number.isInteger(start) || start < 0 || start >= count) return undefined;
    if (byShape) {
      const at = base.indexOf(start);
      if (at < 0) return undefined;
      layout = base.map((seat, i) => (i === 0 ? start : i === at ? base[0]! : seat));
    } else {
      const turn = (((start - base[0]!) % count) + count) % count;
      layout = base.map((seat) => (seat + turn) % count);
    }
  }
  const sideOf = new Map(layout.map((seat, side) => [seat, side]));
  const entities = spec.scenario.entities.flatMap((e) => {
    const side = sideOf.get(e.side);
    if (side !== undefined) return [{ ...e, side }];
    return e.kind === 'command-post' ? [{ ...e, side: NEUTRAL }] : [];
  });
  const supply = spec.scenario.supply;
  return { ...spec.scenario, sides: layout.length, entities, frames: layout.map((seat) => spec.seats!.frames[seat] ?? 'id'), ...(supply && { supply: layout.map((seat) => supply[seat] ?? 0) }) };
}

const mirrorRows = (top: readonly string[]): string[] => [...top, ...[...top].reverse().map((row) => [...row].reverse().join(''))];

/** Supply a fresh deposit holds (docs/design/strategy.md § 8.1). */
export const DEPOSIT_SUPPLY = 300;
/** Supply a rich deposit holds (map editor, owner decision 2026-10-14). */
export const RICH_DEPOSIT_SUPPLY = 600;

function symmetric(id: string, turnLimit: number, top: readonly string[], units: readonly { kind: string; x: number; y: number }[], deposits: readonly { x: number; y: number }[] = []): ScenarioSpec {
  const rows = mirrorRows(top);
  const w = rows[0]?.length ?? 0;
  const h = rows.length;
  const entities = [
    ...units.map((u) => ({ side: 0, kind: u.kind, x: w - 1 - u.x, y: h - 1 - u.y })),
    ...units.map((u) => ({ side: 1, kind: u.kind, x: u.x, y: u.y }))
  ];
  // Deposits are mirrored too (each side has the same reach to the same yields).
  const all = deposits.flatMap((d) => [d, { x: w - 1 - d.x, y: h - 1 - d.y }]).map((d) => ({ x: d.x, y: d.y, left: DEPOSIT_SUPPLY }));
  return { id, turnLimit, scenario: { map: { w, h, terrain: rows.join(''), deposits: all }, sides: 2, entities, seed: 0 } };
}

/** Terrain: `.` plain, `=` road, `f` forest, `h` hill, `u` urban, `s` swamp, `~` water, `^` ridge. */
export const FIELD_EXERCISE: ScenarioSpec = symmetric(
  'field-exercise',
  12,
  [
    '....ff....=.',
    '..~~ff...==.',
    '..~~...h.=..',
    '.......h=...',
    'ff....==..s.',
    'f..u==.....f'
  ],
  [
    { kind: 'command-post', x: 10, y: 1 },
    { kind: 'howitzer', x: 11, y: 0 },
    { kind: 'rifles', x: 8, y: 1 },
    { kind: 'lancer', x: 9, y: 2 },
    { kind: 'warden', x: 8, y: 3 },
    { kind: 'rifles', x: 10, y: 3 },
    { kind: 'mast-truck', x: 11, y: 2 },
    { kind: 'jammer', x: 9, y: 0 },
    { kind: 'tracer', x: 11, y: 1 },
    { kind: 'muster', x: 11, y: 3 }
  ],
  // One deposit behind each post, one on the road in the middle (contested).
  [
    { x: 7, y: 1 },
    { x: 6, y: 4 }
  ]
);

/**
 * Ridge Valley: a 20×14 map with a river down the middle (two fords), a ridge, forests and
 * hills. Each side has a Field Post and two Mast Trucks, so coverage can be pushed forward.
 */
export const RIDGE_VALLEY: ScenarioSpec = symmetric(
  'ridge-valley',
  24,
  [
    '....ff......~~....h.',
    '..^^.ff.....~~...==.',
    '..^^......h.~~..=...',
    '......f...h.....=..f',
    '=.......ff..~~..=...',
    '==.....^^....~~.=.s.',
    '..s....^^.....==...f'
  ],
  [
    { kind: 'command-post', x: 17, y: 1 },
    { kind: 'field-post', x: 17, y: 3 },
    { kind: 'mast-truck', x: 16, y: 2 },
    { kind: 'mast-truck', x: 18, y: 4 },
    { kind: 'jammer', x: 19, y: 0 },
    { kind: 'tracer', x: 18, y: 2 },
    { kind: 'howitzer', x: 19, y: 2 },
    { kind: 'rifles', x: 15, y: 1 },
    { kind: 'rifles', x: 16, y: 4 },
    { kind: 'rifles', x: 14, y: 3 },
    { kind: 'lancer', x: 15, y: 3 },
    { kind: 'lancer', x: 17, y: 5 },
    { kind: 'warden', x: 16, y: 5 },
    { kind: 'outrider', x: 14, y: 1 },
    { kind: 'muster', x: 18, y: 0 }
  ],
  // A deposit behind each post, one past the ridge, one at the ford in the middle (contested).
  [
    { x: 14, y: 0 },
    { x: 12, y: 5 },
    { x: 9, y: 6 }
  ]
);

/** Crossroads: a small 16×12 town fight — the roads meet in the town, where the contested deposit lies. */
export const CROSSROADS: ScenarioSpec = symmetric(
  'crossroads',
  16,
  [
    '..ff....=.....h.',
    '.ff.....=.......',
    '.....uu.=..ff...',
    '~~...uu.=====...',
    '~~..uuu.=...h...',
    '====uu=u=..s....'
  ],
  [
    { kind: 'command-post', x: 13, y: 1 },
    { kind: 'muster', x: 14, y: 2 },
    { kind: 'howitzer', x: 15, y: 0 },
    { kind: 'rifles', x: 11, y: 1 },
    { kind: 'rifles', x: 12, y: 3 },
    { kind: 'lancer', x: 10, y: 2 },
    { kind: 'outrider', x: 13, y: 4 },
    { kind: 'warden', x: 11, y: 4 },
    { kind: 'mast-truck', x: 15, y: 3 },
    { kind: 'tracer', x: 14, y: 0 }
  ],
  [
    { x: 11, y: 0 },
    { x: 6, y: 4 }
  ]
);

/**
 * Marsh Delta: 20×12, channels of water cut the middle; a causeway road crosses it, a second
 * road runs along the far side. Everyone starts inside the own radio cover; two outriders per side
 * are there to scout the far deposits.
 */
export const MARSH_DELTA: ScenarioSpec = symmetric(
  'marsh-delta',
  24,
  [
    '..ss...~~.....f..=..',
    '.s.....~~....ff..=..',
    '...=...~~.h......=f.',
    '..f=..=====....===..',
    '..f=..=..~~~...=..s.',
    '~~.=..=..~..~~.=....'
  ],
  [
    { kind: 'command-post', x: 18, y: 1 },
    { kind: 'field-post', x: 16, y: 3 },
    { kind: 'muster', x: 19, y: 0 },
    { kind: 'mast-truck', x: 17, y: 2 },
    { kind: 'mast-truck', x: 14, y: 4 },
    { kind: 'jammer', x: 19, y: 1 },
    { kind: 'tracer', x: 19, y: 2 },
    { kind: 'howitzer', x: 18, y: 0 },
    { kind: 'rifles', x: 15, y: 1 },
    { kind: 'rifles', x: 14, y: 2 },
    { kind: 'rifles', x: 14, y: 3 },
    { kind: 'lancer', x: 16, y: 4 },
    { kind: 'lancer', x: 17, y: 5 },
    { kind: 'warden', x: 18, y: 4 },
    { kind: 'outrider', x: 14, y: 0 },
    { kind: 'outrider', x: 16, y: 0 }
  ],
  [
    { x: 19, y: 3 },
    { x: 11, y: 0 },
    { x: 10, y: 5 },
    { x: 4, y: 5 }
  ]
);

/**
 * A square map with four bases, the same under a quarter turn: only the bottom-left quarter
 * (seat 0) is written down, the other seats are it turned clockwise (seat 1 top left, seat 2
 * top right, seat 3 bottom right). `rows` are the quarter's rows from the centre line down.
 */
function fourBases(id: string, turnLimit: number, rows: readonly string[], units: readonly { kind: string; x: number; y: number }[], deposits: readonly { x: number; y: number }[]): ScenarioSpec {
  const half = rows.length;
  const n = 2 * half;
  // Clockwise quarter turn and its powers (seat k = seat 0 turned k times).
  const turn = (x: number, y: number, k: number): [number, number] => {
    let p: [number, number] = [x, y];
    for (let i = 0; i < k; i++) p = [n - 1 - p[1], p[0]];
    return p;
  };
  const terrain: string[] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      // Which quarter-turn of seat 0's quarter holds (x, y): turn it back into that quarter.
      let k = 0;
      let [bx, by] = [x, y];
      while (!(bx < half && by >= half)) {
        [bx, by] = [by, n - 1 - bx];
        k++;
      }
      void k;
      terrain.push(rows[by - half]?.[bx] ?? '.');
    }
  }
  const entities = [0, 1, 2, 3].flatMap((seat) => units.map((u) => {
    const [x, y] = turn(u.x, u.y, seat);
    return { side: seat, kind: u.kind, x, y };
  }));
  const all = [0, 1, 2, 3].flatMap((seat) => deposits.map((d) => {
    const [x, y] = turn(d.x, d.y, seat);
    return { x, y, left: DEPOSIT_SUPPLY };
  }));
  return {
    id,
    turnLimit,
    scenario: { map: { w: n, h: n, terrain: terrain.join(''), deposits: all }, sides: 4, entities, seed: 0 },
    // Seat k sees the map turned back k quarters, so the quarter turn carries each seat's view
    // onto the next one's. One opponent sits across; with two, the fourth base is a neutral post.
    seats: { frames: ['id', 'r270', 'r180', 'r90'], layouts: { 1: [0, 2], 2: [0, 1, 2], 3: [0, 1, 2, 3] } }
  };
}

/** Four Corners: 16×16, four bases in the corners, a lake and roads to a contested middle. */
export const FOUR_CORNERS: ScenarioSpec = fourBases(
  'four-corners',
  24,
  [
    '..f...=.',
    '.ff..==.',
    '....=...',
    '~~..=.h.',
    '~...=...',
    '..=====.',
    '..u.....',
    '........'
  ],
  [
    { kind: 'command-post', x: 2, y: 13 },
    { kind: 'muster', x: 3, y: 14 },
    { kind: 'rifles', x: 4, y: 12 },
    { kind: 'rifles', x: 5, y: 13 },
    { kind: 'lancer', x: 3, y: 12 },
    { kind: 'outrider', x: 5, y: 11 },
    { kind: 'mast-truck', x: 1, y: 14 },
    { kind: 'howitzer', x: 0, y: 15 },
    { kind: 'warden', x: 6, y: 12 }
  ],
  [
    { x: 6, y: 14 },
    { x: 7, y: 9 }
  ]
);

/**
 * Bastion (owner decision 2026-10-24: 1 against 3 is played mainly on asymmetric maps, the lone side
 * with better resources and a base that is easier to hold): 20×14, made for teams of three against
 * one. The lone base (seat 0) holds a plateau walled by ridges with two passes and two rich deposits;
 * three bases below (seats 1–3) have one plain deposit each, and two more lie in the open middle.
 * 1 against 3: the player holds the plateau; 3 against 1: the player is the left base below, its
 * allies the others, and the lone opponent holds the plateau.
 */
export const BASTION: ScenarioSpec = {
  id: 'bastion',
  turnLimit: 24,
  scenario: {
    map: {
      w: 20,
      h: 14,
      terrain: [
        '....^..........^....',
        '....^..........^....',
        '....^..........^....',
        '....^..........^....',
        '....^..........^....',
        '....^^^.^^^^.^^^....',
        '...ff..=....=..ff...',
        '..f....=....=....f..',
        '....h..======..h....',
        '........=..=........',
        '..ff....=..=....ff..',
        '....................',
        '....................',
        '....................'
      ].join(''),
      deposits: [
        { x: 6, y: 2, left: DEPOSIT_SUPPLY, endless: true },
        { x: 13, y: 2, left: DEPOSIT_SUPPLY, endless: true },
        { x: 9, y: 4, left: DEPOSIT_SUPPLY, endless: true },
        { x: 4, y: 13, left: DEPOSIT_SUPPLY },
        { x: 12, y: 13, left: DEPOSIT_SUPPLY },
        { x: 15, y: 13, left: DEPOSIT_SUPPLY },
        { x: 5, y: 8, left: DEPOSIT_SUPPLY },
        { x: 14, y: 8, left: DEPOSIT_SUPPLY }
      ]
    },
    sides: 4,
    // The lone base starts with five times the Supply of each base below.
    supply: [1500, 300, 300, 300],
    entities: [
      // Seat 0: the plateau.
      { side: 0, kind: 'command-post', x: 9, y: 1 },
      { side: 0, kind: 'muster', x: 10, y: 1 },
      { side: 0, kind: 'mast-truck', x: 12, y: 1 },
      { side: 0, kind: 'rifles', x: 8, y: 3 },
      { side: 0, kind: 'rifles', x: 11, y: 3 },
      { side: 0, kind: 'lancer', x: 9, y: 3 },
      { side: 0, kind: 'warden', x: 10, y: 3 },
      { side: 0, kind: 'howitzer', x: 9, y: 2 },
      // Seats 1–3: the bases below (left, middle, right).
      ...[2, 10, 17].flatMap((px, i) => [
        { side: i + 1, kind: 'command-post', x: px, y: 12 },
        { side: i + 1, kind: 'muster', x: px === 17 ? 16 : px + 1, y: 12 },
        { side: i + 1, kind: 'mast-truck', x: px, y: 13 },
        { side: i + 1, kind: 'rifles', x: px - 1, y: 11 },
        { side: i + 1, kind: 'rifles', x: px + 1, y: 11 },
        { side: i + 1, kind: 'lancer', x: px, y: 11 }
      ])
    ],
    seed: 0
  },
  seats: { frames: ['id', 'id', 'id', 'id'], layouts: { 3: [0, 1, 2, 3] }, teams: { '1v3': [0, 1, 2, 3], '3v1': [1, 2, 0, 3] } }
};

/**
 * Highland Line: 48×32, asymmetric (owner request 2026-10-27). Side 0 holds the lowland town in
 * the south-west: open ground, three deposits close by. Side 1 holds a plateau in the north-east
 * behind a ridge with two passes: hills for range and radio, two deposits. A river with three
 * bridges runs between them; four deposits lie out on the way.
 */
export const HIGHLAND_LINE: ScenarioSpec = {
  id: 'highland-line',
  turnLimit: 48,
  asymmetric: true,
  scenario: {
    map: {
      w: 48,
      h: 32,
      terrain: [
        '...............~~............^..................',
        '...............~~~...........^..................',
        '................~~...........^.......hh.........',
        '................~~~.....f....=.======...........',
        '.................~~....fff..=^==.h..===.........',
        '.................~~~..fffff==^..................',
        '..................~~...fff==.^^.....h.......hh..',
        '..s...............~~~...f==...^^........=.......',
        '.sss...............~~~..==.....^^.......=.......',
        'sssss............========.......^^......=hh.....',
        '.sss...........===..~~~..........^^.....=.....=.',
        '..s...........==.....~~~..........^^^^^^=^^^^^=^',
        '.............==.......~~~.............===.....=.',
        '.....f.....===.........~~~~..........==.......=.',
        '...fffff..==.............~~~.......===........=.',
        '..fffffff.=...............~~~.....==hh.....f.==.',
        '...fffff.==................~~~~..==hhh...ffff=..',
        '.....f...=..fff..............~~~.=......fffff=f.',
        '.........=.fffff...........=======.......fff==..',
        '........==..fff............=....~~~........f=...',
        '........=................===.....~~~~......==...',
        '........=...............==.........~~~~....=....',
        '........=..............==hh..........~~~~.==....',
        '.....uuu=..u.........===.h.............~~~=.....',
        '.....uuu=......=========..............=====~~~..',
        '........========.......======s........=.....~~~~',
        '........=.....uu.....s....ss===========.......~~',
        '..........uuu......sssss...sss..................',
        '....uu....uuu.....sssssss.......fffff...........',
        '....uu.............sssss.......fffffff..........',
        '.....................s..........fffff...........',
        '................................................'
      ].join(''),
      deposits: [
        { x: 3, y: 24, left: DEPOSIT_SUPPLY },
        { x: 12, y: 24, left: DEPOSIT_SUPPLY },
        { x: 8, y: 30, left: DEPOSIT_SUPPLY },
        { x: 44, y: 2, left: DEPOSIT_SUPPLY },
        { x: 36, y: 8, left: DEPOSIT_SUPPLY },
        { x: 22, y: 4, left: DEPOSIT_SUPPLY },
        { x: 26, y: 23, left: DEPOSIT_SUPPLY },
        { x: 33, y: 27, left: DEPOSIT_SUPPLY },
        { x: 44, y: 14, left: DEPOSIT_SUPPLY }
      ]
    },
    sides: 2,
    entities: [
      { side: 0, kind: 'command-post', x: 5, y: 26 },
      { side: 0, kind: 'muster', x: 4, y: 25 },
      { side: 0, kind: 'howitzer', x: 3, y: 26 },
      { side: 0, kind: 'jammer', x: 6, y: 29 },
      { side: 0, kind: 'tracer', x: 2, y: 27 },
      { side: 0, kind: 'mast-truck', x: 7, y: 25 },
      { side: 0, kind: 'mast-truck', x: 8, y: 27 },
      { side: 0, kind: 'field-post', x: 7, y: 23 },
      { side: 0, kind: 'rifles', x: 9, y: 24 },
      { side: 0, kind: 'rifles', x: 8, y: 28 },
      { side: 0, kind: 'rifles', x: 6, y: 22 },
      { side: 0, kind: 'lancer', x: 9, y: 26 },
      { side: 0, kind: 'lancer', x: 4, y: 23 },
      { side: 0, kind: 'warden', x: 7, y: 27 },
      { side: 0, kind: 'outrider', x: 8, y: 24 },
      { side: 1, kind: 'command-post', x: 41, y: 4 },
      { side: 1, kind: 'muster', x: 42, y: 3 },
      { side: 1, kind: 'howitzer', x: 43, y: 4 },
      { side: 1, kind: 'jammer', x: 41, y: 2 },
      { side: 1, kind: 'tracer', x: 39, y: 3 },
      { side: 1, kind: 'mast-truck', x: 38, y: 5 },
      { side: 1, kind: 'mast-truck', x: 44, y: 7 },
      { side: 1, kind: 'field-post', x: 40, y: 7 },
      { side: 1, kind: 'rifles', x: 37, y: 4 },
      { side: 1, kind: 'rifles', x: 39, y: 6 },
      { side: 1, kind: 'rifles', x: 43, y: 8 },
      { side: 1, kind: 'lancer', x: 42, y: 6 },
      { side: 1, kind: 'lancer', x: 38, y: 3 },
      { side: 1, kind: 'warden', x: 40, y: 5 },
      { side: 1, kind: 'outrider', x: 37, y: 6 }
    ],
    seed: 0
  }
};

/**
 * Lake Country: 48×32, asymmetric, three bases round a lake (owner request 2026-10-27). Seat 0
 * holds the west behind a belt of forest, far from both others, with the most deposits near it.
 * Seats 1 (north-east, hills) and 2 (south-east, town) sit close to each other across a river
 * with one bridge. A causeway leads to a rich deposit on the island.
 */
export const LAKE_COUNTRY: ScenarioSpec = {
  id: 'lake-country',
  turnLimit: 48,
  asymmetric: true,
  scenario: {
    map: {
      w: 48,
      h: 32,
      terrain: [
        '................................................',
        '................................................',
        '..............................................h.',
        '................fff..........fff.......hh.......',
        '...sss.........fffff===================.........',
        '..sssss.........fff==........fff......====......',
        '...sss....f.......==................h....=......',
        '.........fff....===......................=.hh...',
        '.........fff...==........................=......',
        '.........fff..==h......~..............h..=......',
        '..........f...=h...~~~~~~~~~.............=......',
        '.............==...~~~~~~~~~~~............=......',
        '.............=...~~~~~~~~~~~~~...........=......',
        '.............=..~~~~~~~~~~~~~~~..........=......',
        '............==..~~~~~~~...~~~~~..........=......',
        '........=====..~~~~~~~.....~~~~~.........=......',
        '.....====.......~~~~~~~...~~~~~.~~~~~~~~~=~~~~~~',
        '.........==.....~~~~~~~~=~~~~~~..........=......',
        '..........==.....~~~~~~~=~~~~~...........=......',
        '...........=......h~~~~~=~~~~............=....s.',
        '...........==....hhh~~~~=~~~.............=...sss',
        '..........f.==....h....~=................=...sss',
        '.........fff.==.........=................=...sss',
        '.........fff..==........=................=....s.',
        '.........fff...==.......=.......sss......=uu....',
        '..........f.....===.....=......sssss.....=......',
        '..............sss.==....=.......sss...uuu=......',
        '.............sssss.==...=.....fff.....====......',
        '..............sss...===================....uu...',
        '..............................fff....u.....uu...',
        '................................................',
        '................................................'
      ].join(''),
      deposits: [
        { x: 3, y: 12, left: DEPOSIT_SUPPLY },
        { x: 4, y: 21, left: DEPOSIT_SUPPLY },
        { x: 45, y: 3, left: DEPOSIT_SUPPLY },
        { x: 36, y: 2, left: DEPOSIT_SUPPLY },
        { x: 45, y: 30, left: DEPOSIT_SUPPLY },
        { x: 35, y: 30, left: DEPOSIT_SUPPLY },
        { x: 24, y: 15, left: RICH_DEPOSIT_SUPPLY },
        { x: 24, y: 2, left: DEPOSIT_SUPPLY },
        { x: 22, y: 30, left: DEPOSIT_SUPPLY },
        { x: 19, y: 8, left: DEPOSIT_SUPPLY },
        { x: 20, y: 24, left: DEPOSIT_SUPPLY }
      ]
    },
    sides: 3,
    supply: [150, 300, 300],
    entities: [
      { side: 0, kind: 'command-post', x: 5, y: 16 },
      { side: 0, kind: 'muster', x: 4, y: 15 },
      { side: 0, kind: 'howitzer', x: 1, y: 16 },
      { side: 0, kind: 'jammer', x: 1, y: 15 },
      { side: 0, kind: 'tracer', x: 1, y: 17 },
      { side: 0, kind: 'mast-truck', x: 2, y: 16 },
      { side: 0, kind: 'field-post', x: 9, y: 16 },
      { side: 0, kind: 'mast-truck', x: 9, y: 15 },
      { side: 0, kind: 'rifles', x: 9, y: 17 },
      { side: 0, kind: 'rifles', x: 8, y: 16 },
      { side: 0, kind: 'rifles', x: 8, y: 15 },
      { side: 0, kind: 'lancer', x: 8, y: 17 },
      { side: 0, kind: 'lancer', x: 8, y: 14 },
      { side: 0, kind: 'warden', x: 8, y: 18 },
      { side: 0, kind: 'outrider', x: 8, y: 13 },
      { side: 1, kind: 'command-post', x: 41, y: 5 },
      { side: 1, kind: 'muster', x: 42, y: 4 },
      { side: 1, kind: 'howitzer', x: 44, y: 2 },
      { side: 1, kind: 'jammer', x: 43, y: 2 },
      { side: 1, kind: 'tracer', x: 44, y: 3 },
      { side: 1, kind: 'mast-truck', x: 42, y: 1 },
      { side: 1, kind: 'field-post', x: 38, y: 8 },
      { side: 1, kind: 'mast-truck', x: 38, y: 7 },
      { side: 1, kind: 'rifles', x: 39, y: 8 },
      { side: 1, kind: 'rifles', x: 37, y: 6 },
      { side: 1, kind: 'rifles', x: 40, y: 9 },
      { side: 1, kind: 'lancer', x: 39, y: 7 },
      { side: 1, kind: 'lancer', x: 38, y: 6 },
      { side: 1, kind: 'warden', x: 40, y: 8 },
      { side: 1, kind: 'outrider', x: 37, y: 5 },
      { side: 2, kind: 'command-post', x: 41, y: 27 },
      { side: 2, kind: 'muster', x: 42, y: 28 },
      { side: 2, kind: 'howitzer', x: 44, y: 30 },
      { side: 2, kind: 'jammer', x: 43, y: 30 },
      { side: 2, kind: 'tracer', x: 44, y: 29 },
      { side: 2, kind: 'mast-truck', x: 42, y: 31 },
      { side: 2, kind: 'field-post', x: 38, y: 24 },
      { side: 2, kind: 'mast-truck', x: 38, y: 25 },
      { side: 2, kind: 'rifles', x: 39, y: 24 },
      { side: 2, kind: 'rifles', x: 37, y: 26 },
      { side: 2, kind: 'rifles', x: 40, y: 23 },
      { side: 2, kind: 'lancer', x: 39, y: 25 },
      { side: 2, kind: 'lancer', x: 38, y: 26 },
      { side: 2, kind: 'warden', x: 40, y: 24 },
      { side: 2, kind: 'outrider', x: 37, y: 27 }
    ],
    seed: 0
  },
  seats: { frames: ['id', 'id', 'id'], layouts: { 1: [0, 1], 2: [0, 1, 2] } }
};

/**
 * Two Valleys: 48×32, asymmetric (owner request 2026-10-27, the third hand-built large map). A ridge
 * splits the map; three passes cross it. Side 0 holds the wide southern valley: a town by a lake,
 * the passes in the middle and the east close by. Side 1 holds a narrow north-western valley behind
 * a side ridge: two ways out (the west pass and a gap to the open north-east), its deposits close at
 * hand; three more lie in the open north-east steppe, three in the south-west.
 */
export const TWO_VALLEYS: ScenarioSpec = {
  id: 'two-valleys',
  turnLimit: 48,
  asymmetric: true,
  scenario: {
    map: {
      w: 48,
      h: 32,
      terrain: [
        '..................^.............................',
        '..................^.............................',
        '......f...........^......hhh....................',
        '....fffff.........^.....hhhhh...................',
        '...fffffff........^......hhh.....s..............',
        '....fffff.........^...........sssssss...........',
        '......f..............======..sssssssss..........',
        '.....====.....========..=.=====ssssss...........',
        '.....=..=======...^.....=.....=====.............',
        '..uuu=.....hhh....^.....==........====..fffff...',
        '.uuuu==...hhhhh...^......=...........====fffff..',
        '..uuu.=....hhh....^^.....=..............====f...',
        '......=............^.....=.................==...',
        '......=............^.....=..................=...',
        '......=^^^^^^^.....^.....=..................=...',
        '^^^^^^=......^^^^^^......=^^^^^^^^..........=...',
        '......=...........^^^^^^^=^......^^^^^^.....=^^^',
        '......=..................=............^^^^^^=...',
        '......=..................=..................=...',
        '......=..................=..................=...',
        '......===................=.................==h..',
        '........===.............==................h=hhh.',
        '..........===...........=.~~~~~...........==hh..',
        '..........f.===........==~~~~~~~..........=.....',
        '.......fffffff===......=~~~~~~~~~.....u..==.....',
        '......fffffffff.===...==.~~~~~~~....uuuuu=......',
        '.......fffffff....===.=...~~~~~....uuuuu==......',
        '..........f.........========........=====.......',
        '.................hhh.......==========.u.........',
        '................hhhhh...........................',
        '.................hhh............................',
        '................................................'
      ].join(''),
      deposits: [
        { x: 2, y: 3, left: DEPOSIT_SUPPLY },
        { x: 9, y: 12, left: DEPOSIT_SUPPLY },
        { x: 13, y: 4, left: DEPOSIT_SUPPLY },
        { x: 30, y: 4, left: DEPOSIT_SUPPLY },
        { x: 36, y: 12, left: DEPOSIT_SUPPLY },
        { x: 46, y: 6, left: DEPOSIT_SUPPLY },
        { x: 43, y: 30, left: DEPOSIT_SUPPLY },
        { x: 34, y: 23, left: DEPOSIT_SUPPLY },
        { x: 45, y: 24, left: DEPOSIT_SUPPLY },
        { x: 15, y: 27, left: DEPOSIT_SUPPLY },
        { x: 22, y: 22, left: DEPOSIT_SUPPLY },
        { x: 3, y: 28, left: DEPOSIT_SUPPLY }
      ]
    },
    sides: 2,
    entities: [
      { side: 0, kind: 'command-post', x: 40, y: 27 },
      { side: 0, kind: 'muster', x: 41, y: 28 },
      { side: 0, kind: 'howitzer', x: 42, y: 30 },
      { side: 0, kind: 'jammer', x: 43, y: 29 },
      { side: 0, kind: 'tracer', x: 41, y: 31 },
      { side: 0, kind: 'mast-truck', x: 44, y: 28 },
      { side: 0, kind: 'field-post', x: 37, y: 24 },
      { side: 0, kind: 'mast-truck', x: 37, y: 25 },
      { side: 0, kind: 'rifles', x: 38, y: 24 },
      { side: 0, kind: 'rifles', x: 36, y: 26 },
      { side: 0, kind: 'rifles', x: 39, y: 23 },
      { side: 0, kind: 'lancer', x: 38, y: 25 },
      { side: 0, kind: 'lancer', x: 37, y: 26 },
      { side: 0, kind: 'warden', x: 39, y: 24 },
      { side: 0, kind: 'outrider', x: 36, y: 27 },
      { side: 1, kind: 'command-post', x: 5, y: 6 },
      { side: 1, kind: 'muster', x: 4, y: 5 },
      { side: 1, kind: 'howitzer', x: 2, y: 4 },
      { side: 1, kind: 'jammer', x: 3, y: 3 },
      { side: 1, kind: 'tracer', x: 1, y: 5 },
      { side: 1, kind: 'mast-truck', x: 4, y: 2 },
      { side: 1, kind: 'field-post', x: 8, y: 9 },
      { side: 1, kind: 'mast-truck', x: 7, y: 9 },
      { side: 1, kind: 'rifles', x: 8, y: 8 },
      { side: 1, kind: 'rifles', x: 6, y: 10 },
      { side: 1, kind: 'rifles', x: 9, y: 7 },
      { side: 1, kind: 'lancer', x: 7, y: 8 },
      { side: 1, kind: 'lancer', x: 6, y: 9 },
      { side: 1, kind: 'warden', x: 8, y: 7 },
      { side: 1, kind: 'outrider', x: 5, y: 10 }
    ],
    seed: 0
  }
};

export const SCENARIOS: readonly ScenarioSpec[] = [FIELD_EXERCISE, CROSSROADS, RIDGE_VALLEY, MARSH_DELTA, FOUR_CORNERS, BASTION, HIGHLAND_LINE, LAKE_COUNTRY, TWO_VALLEYS];
