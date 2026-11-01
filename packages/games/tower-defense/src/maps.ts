import type { EnemyKind, Route } from '@wp/td-core';

export type { Route } from '@wp/td-core';

/** `count` units of `kind`, the first at wave tick `at`, then one every `every` ticks. */
export interface SpawnGroup {
  readonly kind: EnemyKind;
  readonly count: number;
  readonly every: number;
  readonly at: number;
  readonly route: number;
}

export interface WaveDef {
  readonly groups: readonly SpawnGroup[];
}

export interface TdMap {
  readonly id: string;
  readonly w: number;
  readonly h: number;
  /** Row-major terrain codes of the TD ruleset (rows joined). */
  readonly rows: readonly string[];
  readonly routes: readonly Route[];
  /** Per wave slot, one or more authored variants; the seed picks one per slot. */
  readonly waves: readonly (readonly WaveDef[])[];
  readonly startCredits: number;
  /** Credits at the start of each build phase after the first (index = wave just survived). */
  readonly income: readonly number[];
}

const g = (kind: EnemyKind, count: number, every: number, at = 0, route = 0): SpawnGroup => ({ kind, count, every, at, route });

/**
 * Training ground: one winding road from the top to the bottom, six short waves introducing
 * every archetype. Road `=`, build pads `b`, rock `^`.
 */
export const TRAINING: TdMap = {
  id: 'training',
  w: 7,
  h: 13,
  rows: [
    'bbb=bbb',
    'bbb=bbb',
    'b^b=bb^',
    'b===bbb',
    'b=bbbbb',
    'b=bb^bb',
    'b=====b',
    'bbbbb=b',
    'b^bbb=b',
    'bb====b',
    'bb=bbbb',
    'b^=bb^b',
    'bb=bbbb'
  ],
  routes: [
    {
      layer: 'ground',
      points: [
        [3, 0],
        [3, 3],
        [1, 3],
        [1, 6],
        [5, 6],
        [5, 9],
        [2, 9],
        [2, 12]
      ]
    },
    {
      layer: 'air',
      points: [
        [3, 0],
        [2, 12]
      ]
    }
  ],
  // Eight short waves, one new kind at a time, each first met in small numbers (owner playtest
  // 2026-11-01: more waves, a gentler climb).
  waves: [
    [{ groups: [g('walker', 6, 12)] }],
    [{ groups: [g('walker', 8, 10)] }],
    [{ groups: [g('walker', 8, 10), g('runner', 4, 14, 50)] }, { groups: [g('runner', 4, 14), g('walker', 8, 10, 40)] }],
    [{ groups: [g('swarm', 12, 3), g('walker', 4, 10, 60)] }],
    [{ groups: [g('brute', 1, 40), g('walker', 8, 9, 20)] }, { groups: [g('walker', 8, 9), g('brute', 1, 40, 40)] }],
    [{ groups: [g('glider', 4, 18, 0, 1), g('runner', 6, 10, 20)] }],
    [{ groups: [g('swarm', 12, 3), g('raider', 2, 24, 30), g('walker', 6, 10, 60)] }],
    [{ groups: [g('brute', 2, 40), g('raider', 2, 24, 30), g('swarm', 12, 3, 70)] }]
  ],
  startCredits: 300,
  income: [110, 115, 120, 125, 130, 135, 140]
};

/**
 * The twenty waves of the full maps (owner playtest 2026-11-01: twelve were too few and climbed too
 * fast). Every slot names its groups as [kind, count, every, at]; `lanes` are the ground routes and
 * `air` the air routes the groups are spread over (round robin in authoring order). The second
 * variant of a slot sends every group to the next lane instead (one-lane maps: the groups start in
 * reverse order), so the seed changes where or when the pressure comes, never how much there is.
 * New kinds come one at a time and few at first: Runners (3), Swarms (5), a Brute (7), Gliders (8),
 * Raiders (11), Shield bearers (12), Menders (14); waves 10, 15 and 20 mix kinds that need
 * different answers, and wave 20 brings the Siege crawler (Menders never beside it: a repaired
 * crawler decides the game on its own).
 */
type G = readonly [EnemyKind, number, number, number];
const FULL: readonly (readonly G[])[] = [
  [['walker', 6, 12, 0]],
  [['walker', 8, 10, 0]],
  [['walker', 8, 10, 0], ['runner', 4, 14, 50]],
  [['runner', 8, 10, 0], ['walker', 6, 10, 40]],
  [['swarm', 16, 3, 0], ['walker', 4, 10, 60]],
  [['walker', 10, 8, 0], ['swarm', 12, 3, 50]],
  [['brute', 1, 40, 0], ['walker', 10, 8, 20]],
  [['glider', 4, 16, 0], ['walker', 10, 8, 30]],
  [['runner', 12, 6, 0], ['glider', 4, 16, 30]],
  [['brute', 2, 40, 0], ['swarm', 16, 3, 30], ['runner', 6, 8, 80]],
  [['raider', 2, 24, 0], ['walker', 14, 7, 30]],
  [['shielder', 3, 20, 0], ['runner', 10, 7, 40]],
  [['brute', 3, 32, 0], ['glider', 6, 14, 20], ['swarm', 16, 3, 60]],
  [['mender', 2, 30, 20], ['walker', 16, 6, 0], ['raider', 2, 24, 60]],
  [['shielder', 5, 16, 0], ['brute', 3, 32, 30], ['runner', 10, 6, 80]],
  [['swarm', 30, 2, 0], ['glider', 8, 12, 30], ['raider', 3, 20, 70]],
  [['brute', 5, 28, 0], ['shielder', 5, 16, 20], ['mender', 2, 30, 50], ['walker', 12, 6, 90]],
  [['raider', 5, 18, 0], ['glider', 10, 12, 20], ['runner', 16, 5, 60]],
  [['brute', 6, 24, 0], ['shielder', 6, 16, 30], ['mender', 3, 30, 60], ['swarm', 24, 3, 100]],
  [['crawler', 1, 1, 60], ['brute', 4, 30, 0], ['raider', 4, 18, 20], ['glider', 8, 12, 40], ['swarm', 20, 3, 120], ['shielder', 4, 16, 160]]
];

/** Extra units per wave in the second half of a full map, in percent (wave 20: 2.5 × the authored count). */
export const LATE_PERCENT = 15;

function full(lanes: readonly number[], air: readonly number[], percent = 100): WaveDef[][] {
  const assign = (shift: number): WaveDef[] =>
    FULL.map((slot, index) => {
      let lane = shift;
      let sky = shift;
      // The second half climbs: LATE_PERCENT more units per wave after wave 10.
      const late = 100 + Math.max(0, index - 9) * LATE_PERCENT;
      return {
        groups: slot.map(([kind, count, every, at]) => {
          const route = kind === 'glider' ? air[sky++ % air.length]! : lanes[lane++ % lanes.length]!;
          return g(kind, kind === 'crawler' ? count : Math.ceil((count * percent * late) / 10000), every, at, route);
        })
      };
    });
  const a = assign(0);
  // With several lanes the second variant swaps them; with one lane it reverses the order in
  // which the groups start (same units, different timing), so the seed matters on every map.
  const swapped = assign(1);
  const reordered = a.map((wave) => {
    const starts = wave.groups.map((grp) => grp.at).reverse();
    return { groups: wave.groups.map((grp, i) => ({ ...grp, at: starts[i]! })) };
  });
  return a.map((wave, i) => {
    const key = JSON.stringify(wave);
    const other = [swapped[i]!, reordered[i]!].find((v) => JSON.stringify(v) !== key);
    return other ? [wave, other] : [wave];
  });
}

/** Credits at the start of each build phase of a full map (after waves 1–19): a steady climb. */
const INCOME: readonly number[] = Array.from({ length: 19 }, (_, i) => 70 + 5 * i);

/** Fork: the road splits into two lanes around a rocky middle and joins again before the core. */
export const FORK: TdMap = {
  id: 'fork',
  w: 7,
  h: 15,
  rows: [
    'bbb=bbb',
    'bbb=bbb',
    'b=====b',
    'b=b^b=b',
    'b=bbb=b',
    'b=b^b=b',
    'b=bbb=b',
    'b=b^b=b',
    'b=bbb=b',
    'b=====b',
    'bbb=bbb',
    'b^b=b^b',
    'bbb=bbb',
    'bbb=bbb',
    'bbb=bbb'
  ],
  routes: [
    { layer: 'ground', points: [[3, 0], [3, 2], [1, 2], [1, 9], [3, 9], [3, 14]] },
    { layer: 'ground', points: [[3, 0], [3, 2], [5, 2], [5, 9], [3, 9], [3, 14]] },
    { layer: 'air', points: [[3, 0], [3, 14]] }
  ],
  waves: full([0, 1], [2]),
  startCredits: 300,
  income: INCOME
};

/** Long bend: a long serpentine with straight runs for the long-range towers. */
export const BEND: TdMap = {
  id: 'bend',
  w: 7,
  h: 17,
  rows: [
    '=bbbbbb',
    '=bbbbbb',
    '=======',
    'bbbbbb=',
    'b^bb^b=',
    'bbbbbb=',
    '=======',
    '=bbbbbb',
    '=b^b^bb',
    '=bbbbbb',
    '=======',
    'bbbbbb=',
    'bb^bbb=',
    'bbbbbb=',
    'bbb====',
    'bbb=bbb',
    'bbb=bbb'
  ],
  routes: [
    { layer: 'ground', points: [[0, 0], [0, 2], [6, 2], [6, 6], [0, 6], [0, 10], [6, 10], [6, 14], [3, 14], [3, 16]] },
    { layer: 'air', points: [[0, 0], [3, 16]] }
  ],
  // The long road gives towers more time, so more units come.
  waves: full([0], [1], 160),
  startCredits: 300,
  income: INCOME.map((n) => n - 5)
};

/** Twin approach: two entries at the top corners, the roads meet in the middle; gliders come from both. */
export const TWIN: TdMap = {
  id: 'twin',
  w: 7,
  h: 15,
  rows: [
    '=bbbbb=',
    '=bbbbb=',
    '=b^b^b=',
    '=bbbbb=',
    '=bbbbb=',
    '====bb=',
    'bbb=bb=',
    'bbb=b^=',
    'bbb====',
    'bbb=bbb',
    'b^b=b^b',
    'bbb=bbb',
    'bbb=bbb',
    'bbb=bbb',
    'bbb=bbb'
  ],
  routes: [
    { layer: 'ground', points: [[0, 0], [0, 5], [3, 5], [3, 14]] },
    { layer: 'ground', points: [[6, 0], [6, 8], [3, 8], [3, 14]] },
    { layer: 'air', points: [[0, 0], [3, 14]] },
    { layer: 'air', points: [[6, 0], [3, 14]] }
  ],
  waves: full([0, 1], [2, 3]),
  // Two entries need two defences from the start.
  startCredits: 350,
  income: INCOME
};

export const MAPS: readonly TdMap[] = [TRAINING, FORK, BEND, TWIN];

export const DEFAULT_MAP = TRAINING.id;

export const mapById = (id: string): TdMap | undefined => MAPS.find((m) => m.id === id);
