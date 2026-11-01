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
  split: 8
};

export const MAPS: readonly DuelMap[] = [DUEL];
export const mapById = (id: string): DuelMap | undefined => MAPS.find((m) => m.id === id);

/** Whether `side` may build on (x, y): a pad in its own half. */
export function ownPad(map: DuelMap, side: number, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= map.w || y >= map.h || map.rows[y]![x] !== 'b') return false;
  return side === 0 ? y > map.split : y < map.split;
}
