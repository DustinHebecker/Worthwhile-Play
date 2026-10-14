/**
 * The original Robot Program level set, drawn for this project.
 *
 * Map glyphs: `#` wall, `.` floor, `G` goal, `*` star (must be visited before the goal counts),
 * `^ > v <` robot facing up/right/down/left. The board edge acts as a wall. At most 7×7.
 *
 * `limit` is the maximum program length (tokens) the player may build; `minimal` is the
 * length of the shortest program in the difficulty's language. An independent brute-force
 * oracle in the test suite re-derives `minimal` and checks it is within `limit`.
 * Medium limits are below the shortest program without Repeat, hard limits below the
 * shortest program without the conditional, so each tier needs its new concept.
 */
export interface LevelSource {
  readonly map: readonly string[];
  readonly limit: number;
  readonly minimal: number;
}

export const LEVELS: Readonly<Record<'easy' | 'medium' | 'hard', readonly LevelSource[]>> = {
  /** Forward and turns only. */
  easy: [
    { map: ['.....', '>...G', '.....'], limit: 6, minimal: 4 },
    { map: ['#G.', '#.#', '..#', '>.#'], limit: 7, minimal: 5 },
    { map: ['...G', '....', '^...'], limit: 8, minimal: 6 },
    { map: ['G#..', '.#..', '.#..', '...^'], limit: 10, minimal: 8 },
    { map: ['*..', '...', '^.G'], limit: 10, minimal: 8 },
    { map: ['....', '.##.', '>.#G'], limit: 12, minimal: 10 },
    { map: ['..#..', '..#..', '^.#.G', '.....'], limit: 12, minimal: 10 },
    { map: ['*.G', '.#.', '^.*'], limit: 14, minimal: 12 }
  ],
  /** Adds Repeat. */
  medium: [
    { map: ['.......', '>.....G', '.......'], limit: 5, minimal: 3 },
    { map: ['.....G.', '.......', '.......', '>......'], limit: 7, minimal: 5 },
    { map: ['v####', '..###', '#*.##', '##..#', '###*G'], limit: 7, minimal: 5 },
    { map: ['#####G', '####..', '###..#', '##..##', '#..###', '>.####'], limit: 7, minimal: 5 },
    { map: ['*.*.*.G', '.#.#.#.', '^......'], limit: 8, minimal: 6 },
    { map: ['>......', '######.', 'G......'], limit: 10, minimal: 8 },
    { map: ['###.###', '##...##', '#..#..#', '..###..', '>#####G'], limit: 12, minimal: 10 },
    { map: ['*...*', '.###.', '.###.', '.###.', '^G..*'], limit: 13, minimal: 11 }
  ],
  /** Adds "if wall ahead: turn right, else forward". */
  hard: [
    { map: ['>....', '####.', 'G....'], limit: 6, minimal: 4 },
    { map: ['>...#..', '###.#.#', '..#....', '.#####.', '......G'], limit: 8, minimal: 6 },
    { map: ['>....', '####.', '.....', '.####', '....G'], limit: 9, minimal: 7 },
    { map: ['*.....v', '.#####.', '.......', '.#####.', 'G.....*'], limit: 11, minimal: 9 },
    { map: ['v......', '.#####.', '.#...#.', '.#.#.#.', '.#G#...', '.####.#', '......#'], limit: 11, minimal: 9 },
    { map: ['>......', '######.', '.....#.', '.###.#.', '.#G..#.', '.#####.', '.......'], limit: 12, minimal: 10 },
    { map: ['>..#...', '##.#.#.', '#..#.#.', '#.##.#.', '#....#G'], limit: 12, minimal: 10 },
    { map: ['*.....*', '.#####.', '.#...#.', '.#.G.#.', '.#.#.#.', '.#...#.', '^.....*'], limit: 13, minimal: 11 }
  ]
};
