import { describe, expect, it } from 'vitest';
import { BASE_RULESET, canonicalJson, isValidWorld, worldHash, type World } from '../src';
import { open, worldOf } from './helpers';

const rs = BASE_RULESET;

/** A world that uses every optional structure: statuses, beams, orders and projectiles. */
function rich(): World {
  const w = worldOf(open(5, 4), [
    { side: 0, kind: 'tower-laser', x: 0, y: 0 },
    { side: 1, kind: 'rifles', x: 3, y: 0, order: { type: 'move', x: 4, y: 3 } },
    { side: 1, kind: 'kite', x: 3, y: 0, order: { type: 'attack', target: 1 } }
  ]);
  w.entities[0]!.beam = { target: 2, stacks: 1 };
  w.entities[1]!.status = [{ kind: 'slowed', ticks: 2 }];
  w.projectiles = [{ id: 4, side: 0, kind: 'tower-artillery', x: 1, y: 1, ticks: 1 }];
  w.nextId = 5;
  return w;
}

type Corruption = [string, (w: World & Record<string, unknown>) => void];
const any = (v: unknown) => v as never;

const CORRUPTIONS: Corruption[] = [
  ['version', (w) => void (w.v = any(2))],
  ['ruleset id type', (w) => void (w.ruleset = any(1))],
  ['tick', (w) => void (w.tick = 1.5)],
  ['turn', (w) => void (w.turn = -1)],
  ['rng', (w) => void (w.rng = -1)],
  ['sides 0', (w) => void (w.sides = 0)],
  ['sides 9', (w) => void (w.sides = 9)],
  ['nextId', (w) => void (w.nextId = 4)],
  ['map missing', (w) => void (w.map = any(null))],
  ['map w', (w) => void (w.map = { ...w.map, w: 0 })],
  ['map h', (w) => void (w.map = { ...w.map, h: 129 })],
  ['map terrain type', (w) => void (w.map = any({ ...w.map, terrain: 5 }))],
  ['terrain length', (w) => void (w.map = { ...w.map, terrain: `${w.map.terrain}.` })],
  ['terrain code', (w) => void (w.map = { ...w.map, terrain: `X${w.map.terrain.slice(1)}` })],
  ['entities type', (w) => void (w.entities = any({}))],
  ['projectiles type', (w) => void (w.projectiles = any(null))],
  ['entity id 0', (w) => void (w.entities[0]!.id = 0)],
  ['entity id ≥ nextId', (w) => void (w.entities[2]!.id = 5)],
  ['entity order of ids', (w) => void w.entities.reverse()],
  ['entity side', (w) => void (w.entities[0]!.side = 2)],
  ['entity kind type', (w) => void (w.entities[0]!.kind = any(3))],
  ['entity x', (w) => void (w.entities[0]!.x = -1)],
  ['entity y', (w) => void (w.entities[0]!.y = 4)],
  ['entity hp', (w) => void (w.entities[0]!.hp = 0)],
  ['entity mp', (w) => void (w.entities[0]!.mp = -1)],
  ['entity cooldown', (w) => void (w.entities[0]!.cooldown = 10_001)],
  ['entity null', (w) => void (w.entities[0] = any(null))],
  ['order null', (w) => void (w.entities[0]!.order = any(null))],
  ['hold with extras', (w) => void (w.entities[0]!.order = any({ type: 'hold', x: 1 }))],
  ['move x', (w) => void (w.entities[1]!.order = any({ type: 'move', x: -1, y: 0 }))],
  ['move y', (w) => void (w.entities[1]!.order = any({ type: 'move', x: 0, y: 'a' }))],
  ['attack target', (w) => void (w.entities[2]!.order = any({ type: 'attack', target: 0 }))],
  ['status kind', (w) => void (w.entities[1]!.status = any([{ kind: 'asleep', ticks: 2 }]))],
  ['status ticks', (w) => void (w.entities[1]!.status = [{ kind: 'slowed', ticks: 0 }])],
  ['status null', (w) => void (w.entities[1]!.status = any([null]))],
  ['beam target', (w) => void (w.entities[0]!.beam = { target: 0, stacks: 1 })],
  ['beam stacks', (w) => void (w.entities[0]!.beam = { target: 2, stacks: -1 })],
  ['beam type', (w) => void (w.entities[0]!.beam = any(7))],
  ['projectile id', (w) => void (w.projectiles[0]!.id = 5)],
  ['projectile side', (w) => void (w.projectiles[0]!.side = -1)],
  ['projectile kind', (w) => void (w.projectiles[0]!.kind = 'nope')],
  ['projectile cell', (w) => void (w.projectiles[0]!.y = 4)],
  ['projectile ticks', (w) => void (w.projectiles[0]!.ticks = 0)],
  ['same ground cell', (w) => void (w.entities[1]!.x = 0)],
  ['entity kind unknown', (w) => void (w.entities[2]!.kind = 'unknown')]
];

describe('isValidWorld', () => {
  it('accepts a rich valid world, with and without a ruleset', () => {
    expect(isValidWorld(rich(), rs)).toBe(true);
    expect(isValidWorld(rich())).toBe(true);
    // Ground and air units may share a cell.
    expect(rich().entities[1]).toMatchObject({ x: 3, y: 0 });
  });

  it.each(CORRUPTIONS)('rejects a corrupted %s', (_, corrupt) => {
    const w = rich() as World & Record<string, unknown>;
    corrupt(w);
    expect(isValidWorld(w, rs)).toBe(false);
  });

  it('checks archetypes and cell occupancy only when a ruleset is given', () => {
    const w = rich();
    w.entities[2]!.kind = 'unknown';
    expect(isValidWorld(w)).toBe(true);
  });
});

describe('canonical hashing', () => {
  it('ignores key order and undefined values but not content', () => {
    expect(canonicalJson({ b: 1, a: [2, { d: undefined, c: 'x' }] })).toBe('{"a":[2,{"c":"x"}],"b":1}');
    expect(canonicalJson(undefined)).toBe('null');
    const w = rich();
    const reordered = JSON.parse(JSON.stringify(w, Object.keys(w).reverse())) as World;
    expect(worldHash({ ...reordered, map: w.map, entities: w.entities, projectiles: w.projectiles })).toBe(worldHash(w));
    expect(worldHash({ ...w, tick: 1 })).not.toBe(worldHash(w));
  });
});
