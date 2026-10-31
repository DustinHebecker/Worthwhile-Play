/**
 * The original River Crossing puzzle set: 8 puzzles per difficulty, ordered by their optimum.
 *
 * Everything here is declarative data — entities, the boat, and rules — evaluated by the pure
 * checker in `rules.ts`; no puzzle has code of its own. Some puzzles reuse classic structures
 * (the folklore "keep the goose from the seeds" ferry, "never outnumbered", the weight-limited
 * raft), always with this project's own theming and several new rule combinations (boat
 * rules, battery-limited robots, crossing limits, mixed weight and company rules).
 *
 * `minCrossings` is the fewest crossings that solve the puzzle. The test suite re-derives it
 * with an independent breadth-first solver (`test/oracle.ts`), so a wrong value fails the tests.
 */
import type { Difficulty, EntityDef, PuzzleDef } from './rules';

type Extra = Omit<EntityDef, 'id' | 'kind' | 'n'>;

/** A single entity whose id is its kind. */
const one = (kind: EntityDef['kind'], extra: Extra = {}): EntityDef => ({ id: kind, kind, ...extra });
/** Numbered entities `<kind>-1 … <kind>-count`. */
const many = (kind: EntityDef['kind'], count: number, extra: Extra = {}): EntityDef[] =>
  Array.from({ length: count }, (_, i) => ({ id: `${kind}-${i + 1}`, kind, n: i + 1, ...extra }));
const ids = (kind: string, count: number): string[] => Array.from({ length: count }, (_, i) => `${kind}-${i + 1}`);

const ROW = { rower: true } as const;

/** "Never outnumbered": rangers must not be outnumbered by monkeys wherever there are rangers. */
const monkeys = (count: number) => ({ kind: 'outnumber', group: ids('ranger', count), by: ids('monkey', count) }) as const;

/** Chef/apprentice teams: an apprentice may share a bank with another chef only while their own chef is there. */
const loyalApprentices = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    kind: 'apart' as const,
    a: `apprentice-${i + 1}`,
    b: ids('chef', count).filter((_, j) => j !== i),
    unless: [`chef-${i + 1}`]
  }));

export const PUZZLES: Readonly<Record<Difficulty, readonly PuzzleDef[]>> = {
  easy: [
    {
      id: 'parcels',
      entities: [one('courier', ROW), ...many('parcel', 2)],
      capacity: 2,
      rules: [],
      minCrossings: 3
    },
    {
      id: 'parrots',
      entities: [one('keeper', ROW), ...many('parrot', 2), one('crackers')],
      capacity: 3,
      rules: [
        { kind: 'boatApart', a: 'parrot-1', b: 'parrot-2' },
        { kind: 'apart', a: 'parrot-1', b: ['parrot-2', 'crackers'], unless: ['keeper'] },
        { kind: 'apart', a: 'parrot-2', b: ['crackers'], unless: ['keeper'] }
      ],
      minCrossings: 3
    },
    {
      id: 'scouts',
      entities: [...many('scout', 2, { rower: true, weight: 40 }), one('coach', { rower: true, weight: 80 })],
      capacity: 2,
      maxWeight: 80,
      rules: [],
      minCrossings: 5
    },
    {
      id: 'swim',
      entities: [...many('teacher', 2, ROW), ...many('child', 2, ROW)],
      capacity: 2,
      rules: [{ kind: 'needs', who: ids('child', 2), any: ids('teacher', 2) }],
      minCrossings: 5
    },
    {
      id: 'monkeys-small',
      entities: [...many('ranger', 2, ROW), ...many('monkey', 2, ROW)],
      capacity: 2,
      rules: [monkeys(2)],
      minCrossings: 5
    },
    {
      id: 'robots-small',
      entities: [...many('robot', 2, { rower: true, trips: 3 }), ...many('crate', 2)],
      capacity: 2,
      rules: [],
      minCrossings: 5
    },
    {
      id: 'garden',
      entities: [one('gardener', ROW), one('dog'), one('goose'), one('seeds')],
      capacity: 2,
      rules: [
        { kind: 'apart', a: 'goose', b: ['dog', 'seeds'], unless: ['gardener'] }
      ],
      minCrossings: 7
    },
    {
      id: 'family-raft',
      entities: [
        { id: 'hiker-1', kind: 'hiker', n: 1, rower: true, weight: 90 },
        { id: 'hiker-2', kind: 'hiker', n: 2, rower: true, weight: 70 },
        one('child', { rower: true, weight: 30 }),
        one('dog', { weight: 20 }),
        one('backpack', { weight: 10 })
      ],
      capacity: 3,
      maxWeight: 100,
      rules: [],
      minCrossings: 7
    }
  ],
  medium: [
    {
      id: 'lab',
      entities: [one('researcher', ROW), one('assistant', ROW), one('cat'), one('mouse'), one('cheese')],
      capacity: 2,
      rules: [
        { kind: 'boatApart', a: 'cat', b: 'mouse' },
        { kind: 'apart', a: 'mouse', b: ['cat', 'cheese'], unless: ['researcher', 'assistant'] }
      ],
      minCrossings: 7
    },
    {
      id: 'swim-big',
      entities: [...many('teacher', 2, ROW), { id: 'child-1', kind: 'child', n: 1, rower: true }, ...many('child', 3).slice(1)],
      capacity: 2,
      rules: [{ kind: 'needs', who: ids('child', 3), any: ids('teacher', 2) }],
      minCrossings: 7
    },
    {
      id: 'robots',
      entities: [
        { id: 'robot-1', kind: 'robot', n: 1, rower: true, trips: 5 },
        { id: 'robot-2', kind: 'robot', n: 2, rower: true, trips: 3 },
        ...many('crate', 3)
      ],
      capacity: 2,
      rules: [],
      minCrossings: 7
    },
    {
      id: 'chefs-small',
      entities: [...many('chef', 3, ROW), ...many('apprentice', 3)],
      capacity: 3,
      rules: loyalApprentices(3),
      minCrossings: 7
    },
    {
      id: 'raft',
      entities: [...many('scout', 2, { rower: true, weight: 40 }), ...many('coach', 2, { rower: true, weight: 80 })],
      capacity: 2,
      maxWeight: 80,
      rules: [],
      minCrossings: 9
    },
    {
      id: 'canoe',
      entities: [
        { id: 'hiker-1', kind: 'hiker', n: 1, rower: true, weight: 90 },
        { id: 'hiker-2', kind: 'hiker', n: 2, rower: true, weight: 60 },
        one('child', { rower: true, weight: 40 }),
        one('dog', { weight: 40 }),
        one('cat', { weight: 20 })
      ],
      capacity: 2,
      maxWeight: 100,
      rules: [{ kind: 'apart', a: 'dog', b: ['cat'], unless: ['hiker-1', 'hiker-2', 'child'] }],
      minCrossings: 9
    },
    {
      id: 'compass',
      entities: [one('navigator', ROW), one('sailor', ROW), one('magnet'), one('compass'), one('puppy'), one('map')],
      capacity: 2,
      rules: [
        { kind: 'apart', a: 'magnet', b: ['compass'], unless: ['navigator'] },
        { kind: 'apart', a: 'puppy', b: ['map'], unless: ['sailor'] }
      ],
      minCrossings: 9
    },
    {
      id: 'monkeys-four',
      entities: [...many('ranger', 4, ROW), ...many('monkey', 4, ROW)],
      capacity: 3,
      rules: [monkeys(4)],
      minCrossings: 9
    }
  ],
  hard: [
    {
      id: 'lab-night',
      entities: [one('researcher', ROW), one('assistant', ROW), one('cat'), one('mouse'), one('cheese'), one('owl')],
      capacity: 2,
      maxCrossings: 9,
      rules: [
        { kind: 'apart', a: 'mouse', b: ['cat'], unless: ['researcher'] },
        { kind: 'apart', a: 'mouse', b: ['cheese'], unless: ['researcher', 'assistant'] },
        { kind: 'apart', a: 'mouse', b: ['owl'], unless: ['assistant'] },
        { kind: 'boatApart', a: 'cat', b: 'owl' }
      ],
      minCrossings: 9
    },
    {
      id: 'farm',
      entities: [one('keeper', ROW), one('cat'), one('rooster'), one('fox'), one('dog'), one('hay')],
      capacity: 2,
      rules: [
        { kind: 'apart', a: 'rooster', b: ['fox'], unless: ['dog', 'keeper'] },
        { kind: 'apart', a: 'cat', b: ['dog'], unless: ['keeper'] },
        { kind: 'boatApart', a: 'rooster', b: 'dog' }
      ],
      minCrossings: 11
    },
    {
      id: 'monkeys-fuel',
      entities: [...many('ranger', 3, ROW), ...many('monkey', 3, ROW)],
      capacity: 2,
      maxCrossings: 11,
      rules: [monkeys(3)],
      minCrossings: 11
    },
    {
      id: 'chefs',
      entities: [...many('chef', 3, ROW), ...many('apprentice', 3, ROW)],
      capacity: 2,
      rules: loyalApprentices(3),
      minCrossings: 11
    },
    {
      id: 'robots-big',
      entities: [
        { id: 'robot-1', kind: 'robot', n: 1, rower: true, trips: 5 },
        { id: 'robot-2', kind: 'robot', n: 2, rower: true, trips: 5 },
        { id: 'robot-3', kind: 'robot', n: 3, rower: true, trips: 3 },
        ...many('crate', 4)
      ],
      capacity: 2,
      rules: [],
      minCrossings: 11
    },
    {
      id: 'monkeys-five',
      entities: [...many('ranger', 5, ROW), ...many('monkey', 5, ROW)],
      capacity: 3,
      rules: [monkeys(5)],
      minCrossings: 11
    },
    {
      id: 'oars',
      entities: [...many('ranger', 3, ROW), { id: 'monkey-1', kind: 'monkey', n: 1, rower: true }, ...many('monkey', 3).slice(1)],
      capacity: 2,
      rules: [monkeys(3)],
      minCrossings: 13
    },
    {
      id: 'raft-long',
      entities: [...many('scout', 2, { rower: true, weight: 40 }), ...many('coach', 3, { rower: true, weight: 80 })],
      capacity: 2,
      maxWeight: 80,
      maxCrossings: 13,
      rules: [],
      minCrossings: 13
    }
  ]
};
