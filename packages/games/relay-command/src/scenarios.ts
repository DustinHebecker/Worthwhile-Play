import type { Scenario } from '@wp/strategy-engine';

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
  readonly scenario: Scenario;
}

const mirrorRows = (top: readonly string[]): string[] => [...top, ...[...top].reverse().map((row) => [...row].reverse().join(''))];

/** Supply a fresh deposit holds (docs/design/strategy.md § 8.1). */
export const DEPOSIT_SUPPLY = 300;

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

export const SCENARIOS: readonly ScenarioSpec[] = [FIELD_EXERCISE, CROSSROADS, RIDGE_VALLEY, MARSH_DELTA];
