import { isArrayOf, isInt, isOneOf, isRecord, isUint32, seedFromString } from '@wp/game-core';
import { DEADLOCK_TICKS, STALL_TICKS, UNREACHABLE_TICKS } from './sim';
import { archetypeOf, isValidDoctrine, needsDeploy } from './world';
import { STATUS_KINDS, type Entity, type Order, type Projectile, type Report, type Ruleset, type Status, type World } from './types';

const MAX_DIM = 128;
const MAX_ID = 0x7fff_ffff;

/** Structural check of an order; move targets must lie on a `w`×`h` map. Never throws. */
export const isValidOrder = (v: unknown, w: number, h: number): v is Order => {
  if (!isRecord(v)) return false;
  switch (v.type) {
    case 'hold':
      return Object.keys(v).length === 1;
    case 'move':
      return isInt(v.x, 0, w - 1) && isInt(v.y, 0, h - 1);
    case 'attack':
      return isInt(v.target, 1, MAX_ID);
    case 'deploy':
    case 'regroup':
      return Object.keys(v).length === 1;
    case 'escort':
      return isInt(v.target, 1, MAX_ID);
    case 'patrol':
      return isInt(v.x, 0, w - 1) && isInt(v.y, 0, h - 1) && isInt(v.rx, 0, w - 1) && isInt(v.ry, 0, h - 1);
    default:
      return false;
  }
};

const isStatus = (v: unknown): v is Status => isRecord(v) && isOneOf(v.kind, STATUS_KINDS) && isInt(v.ticks, 1, 10_000);

/**
 * Deploy progress is only meaningful on units that need deploying, at most one turn of ticks,
 * and only while deploying or holding (a node must not keep working while it travels).
 */
function validDeploy(e: Record<string, unknown>, ruleset: Ruleset | undefined): boolean {
  if (!ruleset) return isInt(e.deploy, 0, 1000);
  const type = isRecord(e.order) ? e.order.type : undefined;
  return needsDeploy(archetypeOf(ruleset, e.kind as string)) && isInt(e.deploy, 0, ruleset.ticksPerTurn) && (type === 'deploy' || type === 'hold');
}

/**
 * Structural validation of untrusted world data (saves). Never throws. With a ruleset it also
 * checks that every archetype and terrain code is known. Every guard checks the type before
 * accessing a property, so no try/catch is needed (and none hides a broken guard).
 */
export function isValidWorld(value: unknown, ruleset?: Ruleset): value is World {
  if (!isRecord(value) || value.v !== 1 || typeof value.ruleset !== 'string') return false;
  if (!isInt(value.tick, 0) || !isInt(value.turn, 0) || !isUint32(value.rng) || !isInt(value.sides, 1, 8) || !isInt(value.nextId, 1, MAX_ID)) return false;
  const map = value.map;
  if (!isRecord(map) || !isInt(map.w, 1, MAX_DIM) || !isInt(map.h, 1, MAX_DIM) || typeof map.terrain !== 'string') return false;
  const w = map.w;
  const h = map.h;
  if (map.terrain.length !== w * h) return false;
  if (ruleset && [...map.terrain].some((ch) => !Object.hasOwn(ruleset.terrain, ch))) return false;
  const sides = value.sides;
  const tick = value.tick;
  const nextId = value.nextId;
  const inMap = (x: unknown, y: unknown): boolean => isInt(x, 0, w - 1) && isInt(y, 0, h - 1);
  const isEntity = (e: unknown): e is Entity =>
    isRecord(e) &&
    isInt(e.id, 1, nextId - 1) &&
    isInt(e.side, 0, sides - 1) &&
    typeof e.kind === 'string' &&
    (!ruleset || Object.hasOwn(ruleset.archetypes, e.kind)) &&
    inMap(e.x, e.y) &&
    isInt(e.hp, 1, ruleset ? (archetypeOf(ruleset, e.kind as string)?.hp ?? 0) : Number.MAX_SAFE_INTEGER) &&
    isInt(e.mp, 0, 10_000) &&
    isInt(e.cooldown, 0, 10_000) &&
    isValidOrder(e.order, w, h) &&
    isArrayOf(e.status, isStatus) &&
    (e.beam === null || (isRecord(e.beam) && isInt(e.beam.target, 1, MAX_ID) && isInt(e.beam.stacks, 0, 1000))) &&
    (e.deploy === undefined || validDeploy(e, ruleset)) &&
    (e.doctrine === undefined || isValidDoctrine(e.doctrine)) &&
    (e.hitAt === undefined || isInt(e.hitAt, 0, tick)) &&
    (e.bumps === undefined || isInt(e.bumps, 0, DEADLOCK_TICKS)) &&
    (e.stuck === undefined || isInt(e.stuck, 0, UNREACHABLE_TICKS)) &&
    (e.prev === undefined || isInt(e.prev, 0, w * h - 1)) &&
    (e.stall === undefined ||
      (isRecord(e.stall) && isInt(e.stall.goal, 0, w * h + MAX_ID) && typeof e.stall.best === 'number' && Number.isFinite(e.stall.best) && e.stall.best >= 0 && e.stall.best <= 100 * MAX_DIM * MAX_DIM && isInt(e.stall.ticks, 0, STALL_TICKS)));
  const isProjectile = (p: unknown): p is Projectile =>
    isRecord(p) &&
    isInt(p.id, 1, nextId - 1) &&
    isInt(p.side, 0, sides - 1) &&
    typeof p.kind === 'string' &&
    (!ruleset || Object.hasOwn(ruleset.archetypes, p.kind)) &&
    inMap(p.x, p.y) &&
    isInt(p.ticks, 1, 10_000);
  if (!isArrayOf(value.entities, isEntity) || !isArrayOf(value.projectiles, isProjectile)) return false;
  const entities = value.entities;
  for (let i = 1; i < entities.length; i++) if ((entities[i] as Entity).id <= (entities[i - 1] as Entity).id) return false;
  if (ruleset && (ruleset.fog ? value.intel === undefined : value.intel !== undefined)) return false;
  if (value.intel !== undefined && !validIntel(value.intel, entities, { w, h, sides, tick, nextId }, ruleset)) return false;
  if (ruleset) {
    const cells = new Set<string>();
    for (const e of entities) {
      const layer = archetypeOf(ruleset, e.kind)?.layer;
      const key = `${layer}:${e.x},${e.y}`;
      if (cells.has(key)) return false;
      cells.add(key);
    }
  }
  return true;
}

/**
 * Reports per side, ids ascending. A live report is a current observation, so it must match an
 * existing entity exactly; every own unit must be known to its side (possibly as a ghost).
 */
function validIntel(
  intel: unknown,
  entities: readonly Entity[],
  dims: { w: number; h: number; sides: number; tick: number; nextId: number },
  ruleset: Ruleset | undefined
): boolean {
  if (!Array.isArray(intel) || intel.length !== dims.sides) return false;
  const byId = new Map(entities.map((e) => [e.id, e]));
  const isReport = (r: unknown): r is Report =>
    isRecord(r) &&
    isInt(r.id, 1, dims.nextId - 1) &&
    isInt(r.side, 0, dims.sides - 1) &&
    typeof r.kind === 'string' &&
    (!ruleset || Object.hasOwn(ruleset.archetypes, r.kind)) &&
    isInt(r.x, 0, dims.w - 1) &&
    isInt(r.y, 0, dims.h - 1) &&
    isInt(r.hp, 1, ruleset ? (archetypeOf(ruleset, r.kind as string)?.hp ?? 0) : Number.MAX_SAFE_INTEGER) &&
    isInt(r.tick, 0, dims.tick) &&
    typeof r.live === 'boolean';
  for (let side = 0; side < dims.sides; side++) {
    const reports: unknown = intel[side];
    if (!isArrayOf(reports, isReport)) return false;
    for (let i = 1; i < reports.length; i++) if ((reports[i] as Report).id <= (reports[i - 1] as Report).id) return false;
    for (const r of reports) {
      const e = byId.get(r.id);
      if (e && (e.side !== r.side || e.kind !== r.kind)) return false;
      if (r.live && (!e || r.tick !== dims.tick || e.x !== r.x || e.y !== r.y || e.hp !== r.hp)) return false;
    }
    const known = new Set(reports.map((r) => r.id));
    if (entities.some((e) => e.side === side && !known.has(e.id))) return false;
  }
  return true;
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
