import { instanceIds, type CardDef, type CardEntry, type SetDef, type World } from '../cards';
import { KAMPFZWERGE } from './kampfzwerge';

/** All worlds (design § 4). Only Kampfzwerge in K1; Spaceloot follows in K3. */
export const WORLDS: Readonly<Record<string, World>> = { kz: KAMPFZWERGE };
export const WORLD_IDS = ['kz'] as const;
export type WorldId = (typeof WORLD_IDS)[number];

const BY_ID = new Map<string, CardEntry>();
const SETS: SetDef[] = [];
for (const world of Object.values(WORLDS)) {
  for (const entry of world.cards) BY_ID.set(entry.id, entry);
  SETS.push(...world.sets);
}

/** Card definition of a base id (`kz.huge`), or undefined. */
export const entryOf = (base: string): CardEntry | undefined => BY_ID.get(base);

/** Card definition of an instance id (`kz.huge#2`); throws for unknown ids (states are validated first). */
export const defOf = (instance: string): CardDef => {
  const hash = instance.indexOf('#');
  const entry = BY_ID.get(hash < 0 ? instance : instance.slice(0, hash));
  if (!entry) throw new Error(`Unknown card ${instance}`);
  return entry;
};

export const allSets = (): readonly SetDef[] => SETS;

/** All instance ids of the given worlds, split into the two piles (unshuffled, in list order). */
export function worldDecks(worlds: readonly string[]): { encounter: string[]; loot: string[] } {
  const encounter: string[] = [];
  const loot: string[] = [];
  for (const id of worlds) {
    const world = WORLDS[id];
    if (!world) continue;
    for (const entry of world.cards) {
      const pile = isLootType(entry.type) ? loot : encounter;
      pile.push(...instanceIds(entry));
    }
  }
  return { encounter, loot };
}

export const isLootType = (type: CardDef['type']): boolean =>
  type === 'item' || type === 'upgrade' || type === 'oneshot' || type === 'levelup' || type === 'double';

/** Every valid instance id of the given worlds. */
export function instanceSet(worlds: readonly string[]): Set<string> {
  const { encounter, loot } = worldDecks(worlds);
  return new Set([...encounter, ...loot]);
}
