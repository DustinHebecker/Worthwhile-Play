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

export const MAPS: readonly TdMap[] = [TRAINING];

export const mapById = (id: string): TdMap | undefined => MAPS.find((m) => m.id === id);
