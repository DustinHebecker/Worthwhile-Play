import type { Difficulty, PipeDef, PuzzleDef, TankDef } from './rules';

/*
 * Original Flow Lab puzzles. Tanks are lettered A, B, C … in order; valves are numbered 1, 2, 3 …
 * in pipe order. `minChanges` is verified by the independent brute-force oracle in test/oracle.ts.
 * Easy runs long enough for every valve setting to settle; medium and hard need valve changes
 * between ticks (no single fixed setting solves them).
 */
const T = (cap: number, level: number, col: number, row: number): TankDef => ({ cap, level, col, row });
const P = (from: number, to: number, rate: number, extra: Pick<PipeDef, 'delay' | 'float'> = {}): PipeDef => ({ from, to, rate, ...extra });

export const PUZZLES: Readonly<Record<Difficulty, readonly PuzzleDef[]>> = {
  easy: [
    { id: 'e1', ticks: 10, tanks: [T(8, 6, 0, 0), T(3, 0, 1, 0), T(8, 0, 2, 0), T(4, 0, 1, 1)], pipes: [P(0, 1, 2), P(1, 2, 1), P(1, 3, 1)], targets: [{ tank: 2, level: 5 }], minChanges: 2 },
    { id: 'e2', ticks: 10, tanks: [T(9, 9, 0, 0), T(4, 0, 1, 0), T(9, 0, 1, 1), T(9, 0, 2, 0)], pipes: [P(0, 1, 3), P(1, 3, 1), P(0, 2, 2), P(2, 3, 1)], targets: [{ tank: 3, level: 5 }], minChanges: 3 },
    { id: 'e3', ticks: 10, tanks: [T(7, 7, 1, 0), T(5, 0, 0, 1), T(5, 0, 2, 1), T(9, 0, 1, 1)], pipes: [P(0, 1, 2), P(0, 2, 1), P(1, 3, 1), P(2, 3, 2)], targets: [{ tank: 3, level: 2 }], minChanges: 3 },
    { id: 'e4', ticks: 12, tanks: [T(5, 5, 0, 0), T(5, 5, 2, 0), T(6, 0, 1, 0), T(4, 0, 1, 1)], pipes: [P(0, 2, 1), P(1, 2, 2), P(2, 3, 1)], targets: [{ tank: 2, level: 6 }], minChanges: 2 },
    { id: 'e5', ticks: 10, tanks: [T(8, 8, 0, 0), T(2, 0, 1, 0), T(6, 0, 2, 0), T(6, 0, 1, 1)], pipes: [P(0, 1, 2), P(1, 2, 2), P(0, 3, 1), P(3, 2, 1)], targets: [{ tank: 2, level: 2 }], minChanges: 3 },
    { id: 'e6', ticks: 12, tanks: [T(10, 10, 0, 1), T(3, 0, 1, 0), T(3, 0, 1, 1), T(10, 0, 2, 1)], pipes: [P(0, 1, 3), P(0, 2, 1), P(1, 3, 1), P(2, 3, 2)], targets: [{ tank: 3, level: 5 }], minChanges: 3 },
    { id: 'e7', ticks: 10, tanks: [T(6, 6, 0, 0), T(4, 4, 0, 1), T(5, 0, 1, 0), T(5, 0, 1, 1), T(8, 0, 2, 0)], pipes: [P(0, 2, 2), P(1, 3, 2), P(2, 4, 1), P(3, 4, 1), P(1, 2, 1)], targets: [{ tank: 4, level: 7 }], minChanges: 4 },
    { id: 'e8', ticks: 10, tanks: [T(8, 8, 0, 0), T(4, 0, 1, 0), T(4, 0, 2, 0), T(8, 0, 2, 1), T(3, 0, 1, 1)], pipes: [P(0, 1, 2), P(1, 2, 2), P(2, 3, 1), P(1, 4, 1), P(4, 3, 1)], targets: [{ tank: 3, level: 7 }], minChanges: 3 }
  ],
  medium: [
    { id: 'm1', ticks: 4, tanks: [T(8, 8, 0, 0), T(9, 0, 1, 0), T(9, 0, 1, 1)], pipes: [P(0, 1, 2), P(0, 2, 1)], targets: [{ tank: 1, level: 4 }, { tank: 2, level: 2 }], minChanges: 2 },
    { id: 'm2', ticks: 5, tanks: [T(9, 9, 0, 0), T(4, 0, 1, 0), T(9, 0, 2, 0)], pipes: [P(0, 1, 3), P(1, 2, 2)], targets: [{ tank: 1, level: 4 }, { tank: 2, level: 5 }], noSpill: true, minChanges: 4 },
    { id: 'm3', ticks: 5, tanks: [T(6, 6, 0, 0), T(6, 6, 0, 1), T(9, 0, 1, 0), T(9, 0, 1, 1)], pipes: [P(0, 2, 2), P(1, 3, 2), P(0, 3, 1)], targets: [{ tank: 2, level: 5 }, { tank: 3, level: 5 }], minChanges: 3 },
    { id: 'm4', ticks: 4, tanks: [T(10, 10, 1, 0), T(5, 0, 0, 1), T(5, 0, 1, 1), T(5, 0, 2, 1)], pipes: [P(0, 1, 2), P(0, 2, 1), P(0, 3, 3)], targets: [{ tank: 1, level: 4 }, { tank: 2, level: 1 }, { tank: 3, level: 5 }], noSpill: true, minChanges: 3 },
    { id: 'm5', ticks: 6, tanks: [T(8, 8, 0, 0), T(3, 0, 1, 0), T(9, 0, 2, 0)], pipes: [P(0, 1, 2), P(1, 2, 1), P(1, 0, 1)], targets: [{ tank: 0, level: 5 }, { tank: 2, level: 3 }], minChanges: 4 },
    { id: 'm6', ticks: 5, tanks: [T(7, 7, 0, 0), T(7, 0, 1, 0), T(7, 0, 2, 0), T(7, 0, 1, 1)], pipes: [P(0, 1, 2), P(1, 2, 2), P(1, 3, 1)], targets: [{ tank: 2, level: 3 }, { tank: 3, level: 1 }], minChanges: 4 },
    { id: 'm7', ticks: 6, tanks: [T(6, 6, 0, 0), T(6, 0, 1, 0), T(6, 0, 1, 1)], pipes: [P(0, 1, 2), P(1, 2, 1), P(2, 0, 1)], targets: [{ tank: 0, level: 3 }, { tank: 1, level: 2 }, { tank: 2, level: 1 }], minChanges: 4 },
    { id: 'm8', ticks: 6, tanks: [T(9, 9, 0, 0), T(4, 0, 1, 0), T(4, 0, 1, 1), T(9, 0, 2, 0)], pipes: [P(0, 1, 2), P(0, 2, 1), P(1, 3, 1), P(2, 3, 2)], targets: [{ tank: 1, level: 0 }, { tank: 3, level: 6 }], noSpill: true, minChanges: 5 }
  ],
  hard: [
    { id: 'h1', ticks: 5, tanks: [T(8, 8, 0, 0), T(6, 0, 1, 0), T(8, 0, 2, 0)], pipes: [P(0, 1, 2, { delay: 2 }), P(1, 2, 1)], targets: [{ tank: 1, level: 3 }, { tank: 2, level: 3 }], minChanges: 3 },
    { id: 'h2', ticks: 6, tanks: [T(9, 9, 0, 0), T(5, 0, 1, 0), T(9, 0, 2, 0)], pipes: [P(0, 1, 2, { float: { tank: 1, at: 4 } }), P(1, 2, 1)], targets: [{ tank: 0, level: 3 }, { tank: 1, level: 5 }, { tank: 2, level: 1 }], minChanges: 3 },
    { id: 'h3', ticks: 6, tanks: [T(8, 8, 0, 0), T(8, 0, 1, 0), T(5, 0, 1, 1)], pipes: [P(0, 1, 3, { delay: 2 }), P(0, 2, 1), P(2, 1, 1)], targets: [{ tank: 1, level: 4 }, { tank: 2, level: 3 }], noSpill: true, minChanges: 3 },
    { id: 'h4', ticks: 6, tanks: [T(10, 10, 0, 0), T(6, 0, 1, 0), T(6, 0, 2, 0), T(6, 0, 1, 1)], pipes: [P(0, 1, 2), P(1, 2, 2, { float: { tank: 2, at: 4 } }), P(1, 3, 1)], targets: [{ tank: 2, level: 5 }, { tank: 3, level: 1 }], minChanges: 5 },
    { id: 'h5', ticks: 6, tanks: [T(9, 9, 0, 0), T(4, 0, 1, 0), T(9, 0, 2, 0), T(4, 0, 1, 1)], pipes: [P(0, 1, 2, { delay: 2 }), P(1, 2, 2), P(0, 3, 1), P(3, 2, 1, { delay: 2 })], targets: [{ tank: 1, level: 3 }, { tank: 2, level: 3 }, { tank: 3, level: 1 }], minChanges: 5 },
    { id: 'h6', ticks: 7, tanks: [T(8, 8, 0, 0), T(6, 0, 1, 0), T(6, 0, 1, 1)], pipes: [P(0, 1, 2, { float: { tank: 1, at: 3 } }), P(1, 2, 1), P(2, 0, 1, { delay: 2 })], targets: [{ tank: 0, level: 5 }, { tank: 1, level: 2 }, { tank: 2, level: 1 }], minChanges: 5 },
    { id: 'h7', ticks: 7, tanks: [T(10, 10, 0, 0), T(5, 0, 1, 0), T(5, 0, 2, 0), T(10, 0, 2, 1)], pipes: [P(0, 1, 3, { float: { tank: 2, at: 3 } }), P(1, 2, 2, { delay: 2 }), P(2, 3, 1)], targets: [{ tank: 3, level: 3 }, { tank: 1, level: 3 }], noSpill: true, minChanges: 5 },
    { id: 'h8', ticks: 6, tanks: [T(9, 9, 0, 0), T(5, 0, 1, 0), T(5, 0, 1, 1), T(9, 0, 2, 0)], pipes: [P(0, 1, 2, { float: { tank: 3, at: 5 } }), P(0, 2, 1, { delay: 2 }), P(1, 3, 2), P(2, 3, 1)], targets: [{ tank: 1, level: 4 }, { tank: 2, level: 0 }, { tank: 3, level: 5 }], minChanges: 5 }
  ]
};
