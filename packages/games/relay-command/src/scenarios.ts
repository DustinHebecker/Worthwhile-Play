import type { Scenario } from '@wp/strategy-engine';

/**
 * Hand-made, point-symmetric scenarios. Only the top half (side 1, top-right) is written down;
 * the bottom half and side 0's units are its point mirror, so both sides start equal.
 */
export interface ScenarioSpec {
  readonly id: string;
  readonly turnLimit: number;
  readonly scenario: Scenario;
}

const mirrorRows = (top: readonly string[]): string[] => [...top, ...[...top].reverse().map((row) => [...row].reverse().join(''))];

function symmetric(id: string, turnLimit: number, top: readonly string[], units: readonly { kind: string; x: number; y: number }[]): ScenarioSpec {
  const rows = mirrorRows(top);
  const w = rows[0]?.length ?? 0;
  const h = rows.length;
  const entities = [
    ...units.map((u) => ({ side: 0, kind: u.kind, x: w - 1 - u.x, y: h - 1 - u.y })),
    ...units.map((u) => ({ side: 1, kind: u.kind, x: u.x, y: u.y }))
  ];
  return { id, turnLimit, scenario: { map: { w, h, terrain: rows.join('') }, sides: 2, entities, seed: 0 } };
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
    { kind: 'mast-truck', x: 11, y: 2 }
  ]
);

export const SCENARIOS: readonly ScenarioSpec[] = [FIELD_EXERCISE];
