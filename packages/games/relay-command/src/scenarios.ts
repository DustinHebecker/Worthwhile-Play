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
}

/** The opponent counts a map offers (two-side maps: one). */
export const opponentCounts = (spec: ScenarioSpec): number[] =>
  spec.seats ? Object.keys(spec.seats.layouts).map(Number).sort((a, b) => a - b) : [1];

/** The scenario for `opponents` opponents: seats become sides 0…n (the player is side 0), empty seats neutral posts. */
export function scenarioFor(spec: ScenarioSpec, opponents: number): Scenario | undefined {
  if (!spec.seats) return opponents === 1 ? spec.scenario : undefined;
  const layout = spec.seats.layouts[opponents];
  if (!layout) return undefined;
  const sideOf = new Map(layout.map((seat, side) => [seat, side]));
  const entities = spec.scenario.entities.flatMap((e) => {
    const side = sideOf.get(e.side);
    if (side !== undefined) return [{ ...e, side }];
    return e.kind === 'command-post' ? [{ ...e, side: NEUTRAL }] : [];
  });
  return { ...spec.scenario, sides: layout.length, entities, frames: layout.map((seat) => spec.seats!.frames[seat] ?? 'id') };
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

export const SCENARIOS: readonly ScenarioSpec[] = [FIELD_EXERCISE, CROSSROADS, RIDGE_VALLEY, MARSH_DELTA, FOUR_CORNERS];
