/**
 * Card model of Lootlings (design: docs/design/card-quest.md § 3, § 5, § 6).
 *
 * Cards are language-free structure; names and flavour live per locale in `content/<locale>.ts`.
 * Rules read only this structure. Every effect is expressed in the small closed vocabulary below,
 * so cards of different worlds interact through base kinds, traits and item classes — never by name.
 */

/** Base kinds (§ 3.1): every monster and every origin has exactly one. A player without an origin counts as `bigmouth`. */
export const BASE_KINDS = ['digger', 'figurine', 'machine', 'goo', 'crawler', 'critter', 'bigmouth', 'greens', 'spook'] as const;
export type BaseKind = (typeof BASE_KINDS)[number];

/** Traits (§ 3.2) of monsters, items, upgrades and origins. */
export const TRAITS = [
  'fiery',
  'cold',
  'wet',
  'sticky',
  'smelly',
  'loud',
  'tiny',
  'huge',
  'flying',
  'armoured',
  'shiny',
  'sleepy',
  'bureaucratic',
  'bearded',
  'ancient',
  'electric'
] as const;
export type Trait = (typeof TRAITS)[number];

/** Item classes (§ 3.3). */
export const ITEM_CLASSES = ['tool', 'weapon', 'clothing', 'gadget', 'food', 'junk'] as const;
export type ItemClass = (typeof ITEM_CLASSES)[number];

/**
 * Origin families: the two feuding groups of origins inside each world (Kampfzwerge: fairy-tale dwarves vs garden
 * gnomes; Spaceloot: ship's crew vs aliens; Office: office vs home office; Fridge: fresh food vs leftovers; Railway:
 * passengers vs railway staff).
 */
export const FAMILIES = ['fairytale', 'garden', 'crew', 'alien', 'office', 'remote', 'fresh', 'leftover', 'passenger', 'railstaff', 'worm', 'insect', 'pupil', 'teacher', 'circus', 'funfair'] as const;
export type Family = (typeof FAMILIES)[number];

export const SLOTS = ['head', 'body', 'feet', 'hand', 'small'] as const;
export type Slot = (typeof SLOTS)[number];

/** Number of hands a player has; a two-handed item uses both. */
export const HANDS = 2;

/**
 * A condition on the other side of a fight. All given fields must hold.
 * - Against a monster: its kind and traits (incl. traits added by boosters).
 * - Against a player: the kinds/families/traits of their origins and the traits of their equipment.
 */
export interface Cond {
  readonly kind?: BaseKind;
  readonly trait?: Trait;
  readonly family?: Family;
  /** Holds when the subject does NOT have this trait. */
  readonly lacks?: Trait;
}

/** "+bonus (when …)": a bonus that applies only when the condition holds (no condition = always). */
export interface Mod {
  readonly when?: Cond;
  readonly bonus: number;
}

/** What happens to a player who loses a fight and fails to flee (§ 5.3), or who is cursed. */
export type Penalty =
  | { readonly t: 'level'; readonly n: number }
  | { readonly t: 'slot'; readonly slot: Slot }
  | { readonly t: 'best' }
  | { readonly t: 'cards'; readonly n: number }
  | { readonly t: 'malus'; readonly n: number }
  | { readonly t: 'origin' }
  | { readonly t: 'profession' };

export interface MonsterCard {
  readonly type: 'monster';
  readonly level: number;
  readonly kind: BaseKind;
  readonly traits: readonly Trait[];
  /** Loot cards drawn after defeating it. */
  readonly loot: number;
  /** Levels gained for defeating it (1, or 2 for the biggest). */
  readonly levels: 1 | 2;
  /** Bonuses of the monster against the fighting player (conditions on the player). */
  readonly mods?: readonly Mod[];
  /** Added to the flee roll (negative = harder to escape). */
  readonly flee?: number;
  /** Cannot be fled from: losing always means the Blunder. */
  readonly noFlee?: boolean;
  /** The Blunder (applied in order). */
  readonly blunder: readonly Penalty[];
}

export interface BoosterCard {
  readonly type: 'booster';
  /** Change of the monster's level (may be negative). */
  readonly level: number;
  /** Change of the monster's loot count (may be negative; the total never drops below 0). */
  readonly loot: number;
  readonly traits?: readonly Trait[];
}

/** Adds a monster from the player's hand to a fight. */
export interface ReinforcementCard {
  readonly type: 'reinforcement';
}

/** An encounter card that is kept and later played on one's own turn to draw loot. */
export interface WindfallCard {
  readonly type: 'windfall';
  readonly loot: number;
}

export interface CurseCard {
  readonly type: 'curse';
  readonly effect: Penalty;
}

export interface OriginCard {
  readonly type: 'origin';
  readonly kind: BaseKind;
  readonly family?: Family;
  readonly traits: readonly Trait[];
  /** Bonuses against monsters. */
  readonly mods?: readonly Mod[];
  readonly flee?: number;
}

export interface ProfessionCard {
  readonly type: 'profession';
  /** Bonuses against monsters. */
  readonly mods?: readonly Mod[];
  /** +bonus for every equipped item of this class. */
  readonly perClass?: { readonly cls: ItemClass; readonly bonus: number };
  readonly flee?: number;
  /** Extra value points per sold item. */
  readonly sell?: number;
}

export interface ItemCard {
  readonly type: 'item';
  readonly slot: Slot;
  /** Hands used (hand items only). */
  readonly hands?: 1 | 2;
  /** A big item: at most one big item can be equipped. */
  readonly big?: boolean;
  readonly bonus: number;
  readonly value: number;
  readonly cls: ItemClass;
  readonly traits?: readonly Trait[];
  /** Extra bonuses against monsters. */
  readonly mods?: readonly Mod[];
  /** Extra bonuses depending on the wearer (conditions on the wearer's origin). */
  readonly self?: readonly Mod[];
  readonly flee?: number;
  /** Set mark (§ 5.4). */
  readonly set?: string;
}

/** Permanently attached to one equipped item. */
export interface UpgradeCard {
  readonly type: 'upgrade';
  readonly bonus: number;
  readonly traits?: readonly Trait[];
}

/** Played in a fight for either side (or, with `escape`, by the fighter to leave the fight). */
export interface OneShotCard {
  readonly type: 'oneshot';
  readonly bonus: number;
  readonly value: number;
  /** Flee bonus for the fighter (only usable by or for the fighter). */
  readonly flee?: number;
  /** Ends the fighter's own fight at once: no loot, no Blunder. */
  readonly escape?: boolean;
  /** Change Sides: the helper switches to the monsters' side (deal void, reputation −2). */
  readonly turncoat?: boolean;
}

export interface LevelUpCard {
  readonly type: 'levelup';
}

/** Patchwork Ancestry (`origin`) or Second Job (`profession`): allows a second card of that kind. */
export interface DoubleCard {
  readonly type: 'double';
  readonly of: 'origin' | 'profession';
}

export type CardDef =
  | MonsterCard
  | BoosterCard
  | ReinforcementCard
  | WindfallCard
  | CurseCard
  | OriginCard
  | ProfessionCard
  | ItemCard
  | UpgradeCard
  | OneShotCard
  | LevelUpCard
  | DoubleCard;

export type CardType = CardDef['type'];

export const ENCOUNTER_TYPES: readonly CardType[] = ['monster', 'booster', 'reinforcement', 'windfall', 'curse', 'origin', 'profession'];
export const LOOT_TYPES: readonly CardType[] = ['item', 'upgrade', 'oneshot', 'levelup', 'double'];

/** One entry of a world's card list: a card definition with its id and number of copies. */
export type CardEntry = CardDef & { readonly id: string; readonly copies?: number };

export interface SetDef {
  readonly id: string;
  /** Item ids (base ids) of the set. */
  readonly items: readonly string[];
  readonly bonus: number;
}

export interface World {
  readonly id: string;
  readonly cards: readonly CardEntry[];
  readonly sets: readonly SetDef[];
}

/** Base id of a card instance: `kz.huge#2` → `kz.huge`. */
export const baseId = (instance: string): string => {
  const hash = instance.indexOf('#');
  return hash < 0 ? instance : instance.slice(0, hash);
};

/** Instance ids of an entry: `id` for a single copy, `id#1 … id#n` for several. */
export const instanceIds = (entry: CardEntry): string[] => {
  const copies = entry.copies ?? 1;
  return copies === 1 ? [entry.id] : Array.from({ length: copies }, (_, i) => `${entry.id}#${i + 1}`);
};
