import { archetypeOf, DEFAULT_DOCTRINE, spawn, type TargetPriority, type World } from '@wp/strategy-engine';
import { BASE_TOWERS, TD_RULESET, TOWERS } from './ruleset';

/**
 * Tower commands of one side (docs/design/tower-defense.md § 5): place a level-1 tower, upgrade it
 * along its branch tree, sell it, set its target priority. Shared by Tower Defense and the hybrid.
 * Pure: inputs are never mutated.
 */

/** Targeting choices offered for towers (engine doctrine priorities that make sense here). */
export const TOWER_PRIORITIES = ['weakest', 'nearest', 'armor'] as const satisfies readonly TargetPriority[];
export type TowerPriority = (typeof TOWER_PRIORITIES)[number];

/** Refund share of credits invested before the current build phase. */
export const SELL_PERCENT = 70;

export interface TowerRecord {
  id: number;
  /** All credits put into this tower. */
  invested: number;
  /** Credits put in during the current build phase (refunded in full: nothing has happened yet). */
  fresh: number;
}

export type BuildCommand =
  | { t: 'place'; kind: string; x: number; y: number }
  | { t: 'upgrade'; id: number; kind: string }
  | { t: 'sell'; id: number }
  | { t: 'target'; id: number; priority: TowerPriority };

export type BuildRefusal = 'unknown-kind' | 'not-a-pad' | 'occupied' | 'credits' | 'no-tower' | 'not-an-upgrade' | 'priority';

/** What a side owns for building: its credits and one record per structure it paid for. */
export interface Account {
  credits: number;
  towers: TowerRecord[];
}

/** Credits a sale would return now. */
export const refundOf = (record: TowerRecord): number => record.fresh + Math.floor(((record.invested - record.fresh) * SELL_PERCENT) / 100);

/** Why `cmd` cannot be applied for `side`, or null. `canPlace` says which cells the side may build on. Never throws. */
export function checkBuild(world: World, account: Account, side: number, cmd: BuildCommand, canPlace: (x: number, y: number) => boolean): BuildRefusal | null {
  if (cmd.t === 'place') {
    if (!BASE_TOWERS.includes(cmd.kind)) return 'unknown-kind';
    if (!canPlace(cmd.x, cmd.y)) return 'not-a-pad';
    if (world.entities.some((e) => e.x === cmd.x && e.y === cmd.y)) return 'occupied';
    return (TOWERS[cmd.kind]?.price ?? Infinity) > account.credits ? 'credits' : null;
  }
  const tower = world.entities.find((e) => e.id === cmd.id && e.side === side);
  if (!tower || !account.towers.some((r) => r.id === cmd.id)) return 'no-tower';
  if (cmd.t === 'upgrade') {
    const next = (Object.hasOwn(TOWERS, tower.kind) ? TOWERS[tower.kind]?.next : undefined) ?? [];
    if (!next.includes(cmd.kind)) return 'not-an-upgrade';
    return (TOWERS[cmd.kind]?.price ?? Infinity) > account.credits ? 'credits' : null;
  }
  if (cmd.t === 'target') return (TOWER_PRIORITIES as readonly string[]).includes(cmd.priority) ? null : 'priority';
  return null;
}

export interface Built {
  world: World;
  account: Account;
  /** Change of the side's spending total: the price paid, or minus the fresh credits a sale returns in full. */
  spent: number;
}

/** Applies a checked command (call `checkBuild` first; an unchecked command may throw). */
export function applyBuild(world: World, account: Account, side: number, cmd: BuildCommand): Built {
  const w = structuredClone(world);
  const a = structuredClone(account);
  let spent = 0;
  if (cmd.t === 'place') {
    const price = TOWERS[cmd.kind]!.price;
    const id = w.nextId++;
    w.entities.push(spawn(id, side, archetypeOf(TD_RULESET, cmd.kind)!, cmd.x, cmd.y));
    a.towers.push({ id, invested: price, fresh: price });
    a.credits -= price;
    spent = price;
  } else {
    const tower = w.entities.find((e) => e.id === cmd.id)!;
    const record = a.towers.find((r) => r.id === cmd.id)!;
    if (cmd.t === 'upgrade') {
      const price = TOWERS[cmd.kind]!.price;
      const from = archetypeOf(TD_RULESET, tower.kind)!;
      const to = archetypeOf(TD_RULESET, cmd.kind)!;
      tower.kind = cmd.kind;
      tower.hp = Math.max(1, Math.floor((tower.hp * to.hp) / from.hp));
      tower.cooldown = 0;
      tower.beam = null;
      record.invested += price;
      record.fresh += price;
      a.credits -= price;
      spent = price;
    } else if (cmd.t === 'sell') {
      a.credits += refundOf(record);
      spent = -record.fresh;
      w.entities = w.entities.filter((e) => e.id !== cmd.id);
      a.towers = a.towers.filter((r) => r.id !== cmd.id);
    } else {
      tower.doctrine = { ...DEFAULT_DOCTRINE, priority: cmd.priority };
    }
  }
  return { world: w, account: a, spent };
}

/** Starts a wave: everything bought so far is no longer refunded in full. */
export const settleAccount = (account: Account): Account => ({ ...account, towers: account.towers.map((r) => ({ ...r, fresh: 0 })) });
