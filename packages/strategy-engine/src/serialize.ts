import { isArrayOf, isInt, isOneOf, isRecord, isUint32, seedFromString } from '@wp/game-core';
import { DEADLOCK_TICKS, STALL_TICKS, UNREACHABLE_TICKS } from './sim';
import { archetypeOf, canBeNeutral, isValidDoctrine, MAX_SIDES, needsDeploy } from './world';
import { FRAMES } from './grid';
import { MAX_QUEUE, MAX_SUPPLY, NEUTRAL, STATUS_KINDS, type Deposit, type Entity, type Frame, type Order, type Projectile, type QueueItem, type Report, type Ruleset, type Status, type World } from './types';

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
    case 'produce':
      return isKind(v.kind);
    case 'build':
      return isKind(v.kind) && isInt(v.x, 0, w - 1) && isInt(v.y, 0, h - 1);
    case 'repair':
      return isInt(v.target, 1, MAX_ID);
    case 'sell':
    case 'launch':
    case 'recall':
      return Object.keys(v).length === 1;
    default:
      return false;
  }
};

const isKind = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 64;

/** Orders a unit can stand under (`produce`, `build`, `repair`, `sell` and `launch` are one-shot commands, never standing orders). */
const isStandingOrder = (v: unknown, w: number, h: number): v is Order => isValidOrder(v, w, h) && !isOneShotOrder(v);

/** One-shot economy commands: carried out at once, the unit's standing order stays. */
export const isOneShotOrder = (o: Order): boolean => o.type === 'produce' || o.type === 'build' || o.type === 'repair' || o.type === 'sell' || o.type === 'launch';

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
  if (!isInt(value.tick, 0) || !isInt(value.turn, 0) || !isUint32(value.rng) || !isInt(value.sides, 1, MAX_SIDES) || !isInt(value.nextId, 1, MAX_ID)) return false;
  const map = value.map;
  if (!isRecord(map) || !isInt(map.w, 1, MAX_DIM) || !isInt(map.h, 1, MAX_DIM) || typeof map.terrain !== 'string') return false;
  const w = map.w;
  const h = map.h;
  if (map.terrain.length !== w * h) return false;
  if (ruleset && [...map.terrain].some((ch) => !Object.hasOwn(ruleset.terrain, ch))) return false;
  if (map.deposits !== undefined && !validDeposits(map.deposits, w, h)) return false;
  // Economy: Supply per side exactly on economy rulesets.
  if (ruleset && (ruleset.economy ? !isArrayOf(value.supply, (v) => isInt(v, 0, MAX_SUPPLY)) || value.supply.length !== value.sides : value.supply !== undefined)) return false;
  if (!ruleset && value.supply !== undefined && !isArrayOf(value.supply, (v) => isInt(v, 0, MAX_SUPPLY))) return false;
  const sides = value.sides;
  if (value.teams !== undefined && (!isArrayOf(value.teams, (t) => isInt(t, 0, MAX_SIDES - 1)) || value.teams.length !== sides)) return false;
  if (value.frames !== undefined && (!isArrayOf(value.frames, (f): f is Frame => (FRAMES as readonly unknown[]).includes(f)) || value.frames.length !== sides)) return false;
  // Sides that are out (capture rulesets): ascending, distinct, and without pieces (checked below).
  if (value.out !== undefined && (!isArrayOf(value.out, (v) => isInt(v, 0, sides - 1)) || value.out.some((v, i, a) => i > 0 && v <= (a[i - 1] as number)))) return false;
  const out = new Set((value.out as number[] | undefined) ?? []);
  // A neutral Command Post (no playing side): only kinds that may stand neutral; projectiles never.
  const sideOf = (side: unknown, kind: unknown): boolean => isInt(side, 0, sides - 1) || (side === NEUTRAL && (!ruleset || canBeNeutral(archetypeOf(ruleset, kind as string))));
  const tick = value.tick;
  const nextId = value.nextId;
  const inMap = (x: unknown, y: unknown): boolean => isInt(x, 0, w - 1) && isInt(y, 0, h - 1);
  const isEntity = (e: unknown): e is Entity =>
    isRecord(e) &&
    isInt(e.id, 1, nextId - 1) &&
    typeof e.kind === 'string' &&
    sideOf(e.side, e.kind) &&
    // A neutral post holds, without doctrine, set-up, queue or site (it takes no orders).
    (e.side !== NEUTRAL || (isRecord(e.order) && e.order.type === 'hold' && e.doctrine === undefined && e.deploy === undefined && e.queue === undefined && e.build === undefined)) &&
    !out.has(e.side as number) &&
    (!ruleset || Object.hasOwn(ruleset.archetypes, e.kind)) &&
    inMap(e.x, e.y) &&
    isInt(e.hp, 1, ruleset ? (archetypeOf(ruleset, e.kind as string)?.hp ?? 0) : Number.MAX_SAFE_INTEGER) &&
    isInt(e.mp, 0, 10_000) &&
    isInt(e.cooldown, 0, 10_000) &&
    isStandingOrder(e.order, w, h) &&
    isArrayOf(e.status, isStatus) &&
    (e.queue === undefined || validQueue(e, ruleset)) &&
    (e.build === undefined || validBuild(e, ruleset)) &&
    (e.beam === null || (isRecord(e.beam) && isInt(e.beam.target, 1, MAX_ID) && isInt(e.beam.stacks, 0, 1000))) &&
    (e.deploy === undefined || validDeploy(e, ruleset)) &&
    validDroneFields(e, ruleset) &&
    (e.doctrine === undefined || isValidDoctrine(e.doctrine)) &&
    (e.hitAt === undefined || isInt(e.hitAt, 0, tick)) &&
    (e.bumps === undefined || isInt(e.bumps, 0, DEADLOCK_TICKS)) &&
    (e.stuck === undefined || isInt(e.stuck, 0, UNREACHABLE_TICKS)) &&
    (e.prev === undefined || isInt(e.prev, 0, w * h - 1)) &&
    (e.noContact === undefined || isInt(e.noContact, 0, ruleset ? ruleset.ticksPerTurn : 1000)) &&
    (e.stall === undefined ||
      (isRecord(e.stall) && isInt(e.stall.goal, 0, w * h + MAX_ID) && typeof e.stall.best === 'number' && Number.isFinite(e.stall.best) && e.stall.best >= 0 && e.stall.best <= 100 * MAX_DIM * MAX_DIM && isInt(e.stall.ticks, 0, STALL_TICKS)));
  const isProjectile = (p: unknown): p is Projectile =>
    isRecord(p) &&
    isInt(p.id, 1, nextId - 1) &&
    isInt(p.side, 0, sides - 1) &&
    !out.has(p.side as number) &&
    typeof p.kind === 'string' &&
    (!ruleset || Object.hasOwn(ruleset.archetypes, p.kind)) &&
    inMap(p.x, p.y) &&
    isInt(p.ticks, 1, 10_000);
  if (!isArrayOf(value.entities, isEntity) || !isArrayOf(value.projectiles, isProjectile)) return false;
  const entities = value.entities;
  for (let i = 1; i < entities.length; i++) if ((entities[i] as Entity).id <= (entities[i - 1] as Entity).id) return false;
  if (!validDroneLinks(entities, ruleset)) return false;
  if (ruleset && (ruleset.fog ? value.intel === undefined : value.intel !== undefined)) return false;
  if (value.intel !== undefined && !validIntel(value.intel, entities, { w, h, sides, tick, nextId }, ruleset)) return false;
  // A side that is out knows nothing any more.
  if (Array.isArray(value.intel) && [...out].some((side) => (value.intel as unknown[][])[side]?.length !== 0)) return false;
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

const MAX_DEPOSIT = 1_000_000;

/** Deposits: inside the map, sorted by cell without duplicates, with a non-negative remainder. */
function validDeposits(v: unknown, w: number, h: number): v is Deposit[] {
  if (!isArrayOf(v, (d): d is Deposit => isRecord(d) && isInt(d.x, 0, w - 1) && isInt(d.y, 0, h - 1) && isInt(d.left, 0, MAX_DEPOSIT) && (d.endless === undefined || d.endless === true))) return false;
  for (let i = 1; i < v.length; i++) if ((v[i] as Deposit).y * w + (v[i] as Deposit).x <= (v[i - 1] as Deposit).y * w + (v[i - 1] as Deposit).x) return false;
  return true;
}

/** A queue only on a yard, at most MAX_QUEUE known producible kinds with turns left within their build time. */
function validQueue(e: Record<string, unknown>, ruleset: Ruleset | undefined): boolean {
  const yard = ruleset ? archetypeOf(ruleset, e.kind as string) : undefined;
  if (ruleset && !yard?.production) return false;
  const isItem = (q: unknown): q is QueueItem => {
    if (!isRecord(q) || !isKind(q.kind)) return false;
    if (!ruleset) return isInt(q.left, 0, 1000);
    const product = archetypeOf(ruleset, q.kind);
    return !!product && product.buildTurns > 0 && (yard?.production?.includes(q.kind) ?? false) && isInt(q.left, 0, product.buildTurns);
  };
  return isArrayOf(e.queue, isItem) && e.queue.length <= MAX_QUEUE;
}

/**
 * Drone fields: `drone` and `rebuild` only on a carrier (never both; `rebuild` within its
 * rebuild time), `carrier` on anything that can fly. Their links are checked in `validDroneLinks`.
 */
function validDroneFields(e: Record<string, unknown>, ruleset: Ruleset | undefined): boolean {
  if (e.drone === undefined && e.rebuild === undefined && e.carrier === undefined) return true;
  if (e.side === NEUTRAL) return false;
  const spec = ruleset ? archetypeOf(ruleset, e.kind as string)?.carrier : undefined;
  if (e.drone !== undefined && (!isInt(e.drone, 1, MAX_ID) || e.rebuild !== undefined || (ruleset && !spec))) return false;
  if (e.rebuild !== undefined && (!isInt(e.rebuild, 1, spec?.rebuildTurns ?? 1000) || (ruleset && !spec))) return false;
  if (e.carrier !== undefined && (!isInt(e.carrier, 1, MAX_ID) || (ruleset && archetypeOf(ruleset, e.kind as string)?.layer !== 'air'))) return false;
  return true;
}

/** A carrier's drone exists, is its kind, of its side and names it as carrier, and the other way round. */
function validDroneLinks(entities: readonly Entity[], ruleset: Ruleset | undefined): boolean {
  const byId = new Map(entities.map((e) => [e.id, e]));
  for (const e of entities) {
    if (e.drone !== undefined) {
      const d = byId.get(e.drone);
      if (!d || d.side !== e.side || d.carrier !== e.id || (ruleset && d.kind !== archetypeOf(ruleset, e.kind)?.carrier?.kind)) return false;
    }
    if (e.carrier !== undefined && byId.get(e.carrier)?.drone !== e.id) return false;
  }
  return true;
}

/** Construction only on structures that can be built, within their build time. */
function validBuild(e: Record<string, unknown>, ruleset: Ruleset | undefined): boolean {
  if (!ruleset) return isInt(e.build, 1, 1000);
  const arch = archetypeOf(ruleset, e.kind as string);
  return !!arch && arch.speed === 0 && arch.buildTurns > 0 && isInt(e.build, 1, arch.buildTurns);
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
    typeof r.kind === 'string' &&
    (isInt(r.side, 0, dims.sides - 1) || (r.side === NEUTRAL && (!ruleset || canBeNeutral(archetypeOf(ruleset, r.kind as string))))) &&
    (!ruleset || Object.hasOwn(ruleset.archetypes, r.kind)) &&
    isInt(r.x, 0, dims.w - 1) &&
    isInt(r.y, 0, dims.h - 1) &&
    isInt(r.hp, 1, ruleset ? (archetypeOf(ruleset, r.kind as string)?.hp ?? 0) : Number.MAX_SAFE_INTEGER) &&
    isInt(r.tick, 0, dims.tick) &&
    typeof r.live === 'boolean';
  for (let side = 0; side < dims.sides; side++) {
    const reports: unknown = intel[side];
    // A sparse array (holes are skipped by the element check) is refused, never read (it would throw).
    if (!isArrayOf(reports, isReport) || reports.includes(undefined as never)) return false;
    for (let i = 1; i < reports.length; i++) if ((reports[i] as Report).id <= (reports[i - 1] as Report).id) return false;
    for (const r of reports) {
      const e = byId.get(r.id);
      // A post captured out of this side's sight keeps its old owner in an old report.
      if (e && (e.kind !== r.kind || (e.side !== r.side && (r.live || !(ruleset ? canBeNeutral(archetypeOf(ruleset, e.kind)) : true))))) return false;
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
