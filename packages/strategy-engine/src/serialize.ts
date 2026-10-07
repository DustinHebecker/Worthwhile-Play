import { isArrayOf, isInt, isOneOf, isRecord, isUint32, seedFromString } from '@wp/game-core';
import { STATUS_KINDS, type Entity, type Order, type Projectile, type Ruleset, type Status, type World } from './types';

const MAX_DIM = 128;
const MAX_ID = 0x7fff_ffff;

const isOrder = (v: unknown): v is Order => {
  if (!isRecord(v)) return false;
  switch (v.type) {
    case 'hold':
      return Object.keys(v).length === 1;
    case 'move':
      return isInt(v.x, 0, MAX_DIM) && isInt(v.y, 0, MAX_DIM);
    case 'attack':
      return isInt(v.target, 1, MAX_ID);
    default:
      return false;
  }
};

const isStatus = (v: unknown): v is Status => isRecord(v) && isOneOf(v.kind, STATUS_KINDS) && isInt(v.ticks, 1, 10_000);

/**
 * Structural validation of untrusted world data (saves). Never throws. With a ruleset it also
 * checks that every archetype and terrain code is known.
 */
export function isValidWorld(value: unknown, ruleset?: Ruleset): value is World {
  try {
    if (!isRecord(value) || value.v !== 1 || typeof value.ruleset !== 'string') return false;
    if (!isInt(value.tick, 0) || !isInt(value.turn, 0) || !isUint32(value.rng) || !isInt(value.sides, 1, 8) || !isInt(value.nextId, 1, MAX_ID)) return false;
    const map = value.map;
    if (!isRecord(map) || !isInt(map.w, 1, MAX_DIM) || !isInt(map.h, 1, MAX_DIM) || typeof map.terrain !== 'string') return false;
    const w = map.w;
    const h = map.h;
    if (map.terrain.length !== w * h) return false;
    if (ruleset && [...map.terrain].some((ch) => !(ch in ruleset.terrain))) return false;
    const sides = value.sides;
    const nextId = value.nextId;
    const inMap = (x: unknown, y: unknown): boolean => isInt(x, 0, w - 1) && isInt(y, 0, h - 1);
    const isEntity = (e: unknown): e is Entity =>
      isRecord(e) &&
      isInt(e.id, 1, nextId - 1) &&
      isInt(e.side, 0, sides - 1) &&
      typeof e.kind === 'string' &&
      (!ruleset || e.kind in ruleset.archetypes) &&
      inMap(e.x, e.y) &&
      isInt(e.hp, 1) &&
      isInt(e.mp, 0, 10_000) &&
      isInt(e.cooldown, 0, 10_000) &&
      isOrder(e.order) &&
      isArrayOf(e.status, isStatus) &&
      (e.beam === null || (isRecord(e.beam) && isInt(e.beam.target, 1, MAX_ID) && isInt(e.beam.stacks, 0, 1000)));
    const isProjectile = (p: unknown): p is Projectile =>
      isRecord(p) &&
      isInt(p.id, 1, nextId - 1) &&
      isInt(p.side, 0, sides - 1) &&
      typeof p.kind === 'string' &&
      (!ruleset || p.kind in ruleset.archetypes) &&
      inMap(p.x, p.y) &&
      isInt(p.ticks, 1, 10_000);
    if (!isArrayOf(value.entities, isEntity) || !isArrayOf(value.projectiles, isProjectile)) return false;
    const entities = value.entities;
    for (let i = 1; i < entities.length; i++) if ((entities[i] as Entity).id <= (entities[i - 1] as Entity).id) return false;
    if (ruleset) {
      const cells = new Set<string>();
      for (const e of entities) {
        const layer = ruleset.archetypes[e.kind]?.layer;
        const key = `${layer}:${e.x},${e.y}`;
        if (cells.has(key)) return false;
        cells.add(key);
      }
    }
    return true;
  } catch {
    return false;
  }
}

/** JSON with recursively sorted object keys: identical logical worlds give identical strings. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (isRecord(value)) {
    const keys = Object.keys(value).filter((k) => value[k] !== undefined).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/** 32-bit FNV-1a hash of the canonical world, for determinism checks and golden replays. */
export const worldHash = (world: World): number => seedFromString(canonicalJson(world));
