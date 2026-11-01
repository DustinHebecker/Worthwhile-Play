import type { Route } from '@wp/td-core';

/**
 * Maps of "Hold the Line" (strategy/TD hybrid, docs/design/tower-defense.md § 16). Seven columns,
 * so cells keep 44 px on a phone. Every map is point-symmetric: side 1 (top) is side 0 (bottom)
 * turned by 180°, which keeps both seats equal (the engine breaks ties in each side's own frame).
 * Road `=`, build pads `b`, rock `^`.
 */
export interface DuelMap {
  readonly id: string;
  readonly w: number;
  readonly h: number;
  readonly rows: readonly string[];
  /** Route of each side's attack wave (index = side), from its spawn to the opposing core. */
  readonly lanes: readonly [Route, Route];
  /** Rows each side may build on: side 0 from `split + 1` down, side 1 from `split - 1` up. */
  readonly split: number;
  /** The mode this map is played in (one map per mode for now). */
  readonly mode: 'vs-small' | 'external-small';
}

/**
 * Two lanes: your waves go up the left edge to the opponent's core at the top; the opponent's come
 * down the right edge to yours at the bottom. They never meet; your towers only fire at theirs.
 */
export const DUEL: DuelMap = {
  id: 'duel',
  w: 7,
  h: 17,
  rows: [
    'bbb=bb=',
    '====bb=',
    '=bbbbb=',
    '=b^bbb=',
    '=bbbb^=',
    '=bbbbb=',
    '=b^bbb=',
    '=bbbbb=',
    '=bb^bb=',
    '=bbbbb=',
    '=bbb^b=',
    '=bbbbb=',
    '=^bbbb=',
    '=bbb^b=',
    '=bbbbb=',
    '=bb====',
    '=bb=bbb'
  ],
  lanes: [
    { layer: 'ground', points: [[0, 16], [0, 1], [3, 1], [3, 0]] },
    { layer: 'ground', points: [[6, 0], [6, 15], [3, 15], [3, 16]] }
  ],
  split: 8,
  mode: 'vs-small'
};

/**
 * External Small (design § 13.2, § 17): an outside force comes in at the middle of the map and splits
 * into two equal halves, one down the winding road to your core at the bottom, one up the mirrored
 * road to the opponent's core at the top. Lane `i` carries the units that attack side `1 - i`
 * (so the opponent's towers never shoot at the half that comes for you, and the other way round).
 * Two entry cells, one per half, keep the halves from waiting on each other.
 */
export const CROSSING: DuelMap = {
  id: 'crossing',
  w: 7,
  h: 17,
  rows: [
    'bbb=bbb',
    'bbb===b',
    'bb^bb=b',
    'b=====b',
    'b=bbb^b',
    'b=bbbbb',
    'b====bb',
    'bbbb=bb',
    '^b=^=b^',
    'bb=bbbb',
    'bb====b',
    'bbbbb=b',
    'b^bbb=b',
    'b=====b',
    'b=bb^bb',
    'b===bbb',
    'bbb=bbb'
  ],
  lanes: [
    { layer: 'ground', points: [[4, 8], [4, 6], [1, 6], [1, 3], [5, 3], [5, 1], [3, 1], [3, 0]] },
    { layer: 'ground', points: [[2, 8], [2, 10], [5, 10], [5, 13], [1, 13], [1, 15], [3, 15], [3, 16]] }
  ],
  split: 8,
  mode: 'external-small'
};

export const MAPS: readonly DuelMap[] = [DUEL, CROSSING];
export const mapForMode = (mode: DuelMap['mode']): DuelMap => MAPS.find((m) => m.mode === mode)!;
export const mapById = (id: string): DuelMap | undefined => MAPS.find((m) => m.id === id);

/** Whether `side` may build on (x, y): a pad in its own half. */
export function ownPad(map: DuelMap, side: number, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= map.w || y >= map.h || map.rows[y]![x] !== 'b') return false;
  return side === 0 ? y > map.split : y < map.split;
}
