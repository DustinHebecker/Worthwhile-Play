import type { Layer } from '@wp/strategy-engine';
import type { EnemyKind } from './ruleset';

/** A route: a spawn cell followed by waypoints; the last point is the goal (reaching it = a leak). */
export interface Route {
  readonly layer: Layer;
  readonly points: readonly (readonly [number, number])[];
}

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
  waves: [
    [{ groups: [g('walker', 8, 10)] }],
    [{ groups: [g('walker', 10, 8), g('runner', 6, 12, 40)] }, { groups: [g('runner', 6, 12), g('walker', 10, 8, 40)] }],
    [{ groups: [g('swarm', 16, 3), g('walker', 6, 10, 60)] }],
    [{ groups: [g('brute', 2, 40), g('walker', 8, 8, 20)] }, { groups: [g('walker', 8, 8), g('brute', 2, 40, 30)] }],
    [{ groups: [g('glider', 6, 16, 0, 1), g('runner', 8, 8, 20)] }],
    [{ groups: [g('swarm', 12, 3), g('raider', 3, 24, 20), g('brute', 2, 40, 50)] }]
  ],
  startCredits: 300,
  income: [120, 130, 140, 150, 160]
};

/**
 * The twelve waves of the full maps. Every slot names its groups as [kind, count, every, at]; `lanes`
 * are the ground routes and `air` the air routes the groups are spread over (round robin in
 * authoring order). The second variant of a slot sends every group to the next lane instead (one-lane
 * maps: the groups start in reverse order), so the seed changes where or when the pressure comes,
 * never how much there is. Waves 4, 8 and 12 mix
 * archetypes that need different answers; wave 12 brings the Siege crawler.
 */
type G = readonly [EnemyKind, number, number, number];
const TWELVE: readonly (readonly G[])[] = [
  [['walker', 10, 8, 0]],
  [['walker', 10, 8, 0], ['runner', 8, 10, 40]],
  [['swarm', 24, 3, 0], ['walker', 6, 10, 70]],
  [['brute', 1, 40, 0], ['runner', 10, 8, 20], ['walker', 10, 8, 60]],
  [['glider', 6, 16, 0], ['walker', 12, 8, 30]],
  [['raider', 4, 20, 0], ['swarm', 16, 3, 40], ['brute', 2, 40, 80]],
  [['runner', 18, 5, 0], ['glider', 6, 14, 30]],
  [['brute', 5, 30, 0], ['swarm', 24, 3, 40], ['raider', 3, 24, 90]],
  [['glider', 10, 12, 0], ['walker', 16, 6, 20], ['runner', 10, 6, 80]],
  [['brute', 6, 24, 0], ['raider', 6, 16, 30], ['glider', 6, 14, 60]],
  [['swarm', 40, 2, 0], ['brute', 4, 30, 40], ['runner', 12, 5, 100]],
  [['crawler', 1, 1, 60], ['brute', 4, 30, 0], ['raider', 6, 16, 20], ['glider', 8, 12, 40], ['swarm', 20, 3, 120]]
];

function twelve(lanes: readonly number[], air: readonly number[], percent = 100): WaveDef[][] {
  const assign = (shift: number): WaveDef[] =>
    TWELVE.map((slot) => {
      let lane = shift;
      let sky = shift;
      return {
        groups: slot.map(([kind, count, every, at]) => {
          const route = kind === 'glider' ? air[sky++ % air.length]! : lanes[lane++ % lanes.length]!;
          return g(kind, kind === 'crawler' ? count : Math.ceil((count * percent) / 100), every, at, route);
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
  waves: twelve([0, 1], [2]),
  startCredits: 300,
  income: [70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120]
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
  waves: twelve([0], [1], 130),
  startCredits: 300,
  income: [65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115]
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
  waves: twelve([0, 1], [2, 3]),
  // Two entries need two defences from the start.
  startCredits: 350,
  income: [70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120]
};

export const MAPS: readonly TdMap[] = [TRAINING, FORK, BEND, TWIN];

export const DEFAULT_MAP = TRAINING.id;

export const mapById = (id: string): TdMap | undefined => MAPS.find((m) => m.id === id);
