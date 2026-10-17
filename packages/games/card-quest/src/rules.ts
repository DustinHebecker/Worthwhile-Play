import { createRng, createRngFromState, isArrayOf, isInt, isOneOf, isRecord, isUint32 } from '@wp/game-core';
import type { BaseKind, Cond, Family, ItemCard, MonsterCard, Mod, Penalty, Slot, Trait } from './cards';
import { HANDS, baseId } from './cards';
import { WORLD_IDS, allSets, defOf, instanceSet, isLootType, worldDecks, type WorldId } from './worlds';

/*
 * Rules of Lootlings (design docs/design/card-quest.md § 5). Pure functions over plain-JSON state:
 * `step(state, seat, action)` returns the next state or `null` for an illegal action. No clock, no
 * Math.random — all chance (shuffles, die, random discards) comes from the persisted seeded generator.
 */

export const STATE_VERSION = 2;
export const TARGETS = [6, 8, 10, 12] as const;
export const ROUND_LIMITS = [0, 20, 30, 40] as const;
export const DIFFICULTIES = ['easy', 'normal', 'sharp'] as const;
export const PERSONALITIES = ['cautious', 'opportunist', 'grudge', 'showoff'] as const;
export const MAX_OPPONENTS = 5;
export const HAND_LIMIT = 5;
export const START_CARDS = 4;
/** Value points per level when selling. */
export const SELL_RATE = 10;
/** A flee roll (die + bonuses) of at least this escapes. */
export const FLEE_TARGET = 5;
export const LOG_LIMIT = 60;
/** Reputation (design § 5.6): 0–5 stars, everyone starts with 3. */
export const REP_MAX = 5;
export const REP_START = 3;
/** Most favours one player can be owed at a time. */
export const FAVOUR_LIMIT = 5;

export type Difficulty = (typeof DIFFICULTIES)[number];
export type Personality = (typeof PERSONALITIES)[number];
export type Target = (typeof TARGETS)[number];
export type RoundLimit = (typeof ROUND_LIMITS)[number];

export interface Settings {
  worlds: WorldId[];
  /** Computer players, 1–5. */
  opponents: number;
  target: Target;
  /** 0 = no round limit. */
  roundLimit: RoundLimit;
  difficulty: Difficulty;
  /** Coach hints (design § 7.1). */
  coach: boolean;
}

export interface Upgrade {
  item: string;
  card: string;
}

export interface Player {
  level: number;
  hand: string[];
  /** Items on the table that count. */
  equipped: string[];
  /** Items on the table that do not count (carried). */
  pack: string[];
  upgrades: Upgrade[];
  origins: string[];
  professions: string[];
  /** Played Patchwork Ancestry / Second Job cards. */
  doubles: string[];
  /** Penalty for the player's next fight (curses). */
  malus: number;
  /** Computer personality; `null` for the person (seat 0). */
  personality: Personality | null;
  /** Reputation, 0–REP_MAX (public). */
  rep: number;
  /** Seats that owe this player a favour (one entry per favour, oldest first). */
  favours: number[];
  /** Harm received from each seat (curses, interference, broken deals; public, read by grudge-holders). */
  harm: number[];
}

/** The fixed shapes of an offer (design § 5.6): help for loot, an item or a favour; a called favour; pay to stay out. */
export type Terms =
  | { t: 'loot'; n: 1 | 2 }
  | { t: 'most' }
  | { t: 'item'; item: string }
  | { t: 'favour' }
  | { t: 'free' }
  | { t: 'stay'; card: string };

export interface Offer {
  to: number;
  terms: Terms;
}

export interface FightMonster {
  card: string;
  boosters: string[];
}

export interface Fight {
  monsters: FightMonster[];
  /** One-shots played for the fighter. */
  hero: string[];
  /** One-shots played for the monsters. */
  against: string[];
  /** Flee bonus from one-shots. */
  flee: number;
  /** Seat whose reaction it is. */
  actor: number;
  /** Consecutive passes; the window closes when every player has passed in a row. */
  passes: number;
  /** Die results of the flee rolls so far (one per monster). */
  rolls: number[];
  /** Seat helping the fighter (its table strength counts for the fighter), or null. */
  helper: number | null;
  /** What the helper was promised. */
  deal: Terms | null;
  /** The fighter's open offer; while it is open, its addressee must accept or decline. */
  offer: Offer | null;
  /** Seats the fighter has already made an offer to in this fight. */
  asked: number[];
  /** Seats paid to stay out of this fight. */
  stayOut: number[];
  /** A helper who changed sides (its table strength counts for the monsters), or null. */
  turncoat: number | null;
}

export type Phase = 'setup' | 'prepare' | 'after' | 'fight' | 'flee' | 'end' | 'over';

export type LogEvent =
  | { e: 'turn'; seat: number }
  | { e: 'open'; seat: number; card: string }
  | { e: 'rummage'; seat: number }
  | { e: 'challenge'; seat: number; card: string }
  | { e: 'boost'; seat: number; card: string; monster: string }
  | { e: 'reinforce'; seat: number; card: string; monster: string }
  | { e: 'oneshot'; seat: number; card: string; side: 'hero' | 'monster' }
  | { e: 'escape'; seat: number; card: string }
  | { e: 'curse'; seat: number; card: string; target: number }
  | { e: 'won'; seat: number; levels: number; loot: number }
  | { e: 'lost'; seat: number }
  | { e: 'flee'; seat: number; monster: string; roll: number; total: number; ok: boolean }
  | { e: 'penalty'; seat: number; p: Penalty['t']; card?: string; n?: number }
  | { e: 'equip'; seat: number; card: string }
  | { e: 'sell'; seat: number; count: number; levels: number }
  | { e: 'play'; seat: number; card: string }
  | { e: 'upgrade'; seat: number; card: string; item: string }
  | { e: 'give'; seat: number; to: number; count: number }
  | { e: 'discard'; seat: number; count: number }
  | { e: 'offer'; seat: number; to: number; t: Terms['t']; n?: number; card?: string }
  | { e: 'accept'; seat: number; to: number }
  | { e: 'decline'; seat: number; to: number }
  | { e: 'switch'; seat: number; to: number; card: string }
  | { e: 'kept'; seat: number; to: number; t: Terms['t']; n?: number; card?: string }
  | { e: 'broken'; seat: number; to: number; why: 'switch' | 'stay' | 'favour' }
  | { e: 'void'; seat: number; to: number; card: string }
  | { e: 'win'; seats: number[] };

export interface CardQuestState {
  v: number;
  seed: number;
  rng: number;
  phase: Phase;
  settings: Settings;
  encounter: string[];
  loot: string[];
  encounterDiscard: string[];
  lootDiscard: string[];
  players: Player[];
  active: number;
  starter: number;
  round: number;
  fight: Fight | null;
  /** Number of applied actions (also seeds computer decisions). */
  counter: number;
  log: LogEvent[];
  /** Number of log events ever written (the log keeps only the last LOG_LIMIT). */
  logSeq: number;
  /** `logSeq` at the person's last action: later events are new to them. */
  seen: number;
  winners: number[];
  /** Coach hints already shown (ids). */
  hints: string[];
  /**
   * `logSeq` up to which the person has acknowledged the cards that hit them without a fight (traps found around the
   * corner, curses from others; the view shows them until "Continue"). Absent in older saves.
   */
  revealed?: number;
}

export type Action =
  | { a: 'start'; settings: Settings }
  | { a: 'equip'; card: string }
  | { a: 'unequip'; card: string }
  | { a: 'sell'; cards: string[] }
  | { a: 'play'; card: string }
  | { a: 'upgrade'; card: string; item: string }
  | { a: 'curse'; card: string; target: number }
  | { a: 'open' }
  | { a: 'challenge'; card: string }
  | { a: 'rummage' }
  | { a: 'boost'; card: string; monster: number }
  | { a: 'reinforce'; card: string; monster: string }
  | { a: 'oneshot'; card: string; side: 'hero' | 'monster' }
  | { a: 'offer'; to: number; terms: Terms }
  | { a: 'accept' }
  | { a: 'decline' }
  | { a: 'pass' }
  | { a: 'roll' }
  | { a: 'end'; give: string[] };

export const DEFAULT_SETTINGS: Settings = { worlds: ['kz'], opponents: 3, target: 10, roundLimit: 0, difficulty: 'normal', coach: true };

/* ---------------------------------------------------------------- setup */

const emptyPlayer = (personality: Personality | null, seats: number): Player => ({
  level: 1,
  hand: [],
  equipped: [],
  pack: [],
  upgrades: [],
  origins: [],
  professions: [],
  doubles: [],
  malus: 0,
  personality,
  rep: REP_START,
  favours: [],
  harm: Array.from({ length: seats }, () => 0)
});

/** A game before the deal (phase `setup`); the `start` action deals it. The view deals at once (ADR 0017). */
export function newGame(seed: number, settings: Settings = DEFAULT_SETTINGS): CardQuestState {
  const s = seed >>> 0;
  return {
    v: STATE_VERSION,
    seed: s,
    rng: createRng(s).state(),
    phase: 'setup',
    settings: cloneSettings(settings),
    encounter: [],
    loot: [],
    encounterDiscard: [],
    lootDiscard: [],
    players: [],
    active: 0,
    starter: 0,
    round: 0,
    fight: null,
    counter: 0,
    log: [],
    logSeq: 0,
    seen: 0,
    winners: [],
    hints: []
  };
}

const cloneSettings = (s: Settings): Settings => ({ ...s, worlds: [...s.worlds] });

export function isValidSettings(value: unknown): value is Settings {
  if (!isRecord(value)) return false;
  return (
    isArrayOf(value.worlds, (w): w is WorldId => isOneOf(w, WORLD_IDS)) &&
    value.worlds.length >= 1 &&
    new Set(value.worlds).size === value.worlds.length &&
    isInt(value.opponents, 1, MAX_OPPONENTS) &&
    isOneOf(value.target, TARGETS) &&
    isOneOf(value.roundLimit, ROUND_LIMITS) &&
    isOneOf(value.difficulty, DIFFICULTIES) &&
    typeof value.coach === 'boolean'
  );
}

function deal(state: CardQuestState, settings: Settings): void {
  const rng = createRngFromState(state.rng);
  const decks = worldDecks(settings.worlds);
  state.encounter = rng.shuffle(decks.encounter);
  state.loot = rng.shuffle(decks.loot);
  const count = settings.opponents + 1;
  state.players = [];
  for (let seat = 0; seat < count; seat++) {
    state.players.push(emptyPlayer(seat === 0 ? null : (PERSONALITIES[rng.int(0, PERSONALITIES.length - 1)] as Personality), count));
  }
  for (let i = 0; i < START_CARDS; i++) {
    for (const p of state.players) {
      p.hand.push(state.encounter.pop() as string);
      p.hand.push(state.loot.pop() as string);
    }
  }
  state.starter = rng.int(0, count - 1);
  state.active = state.starter;
  state.round = 1;
  state.rng = rng.state();
  state.settings = cloneSettings(settings);
  state.phase = 'prepare';
  log(state, { e: 'turn', seat: state.active });
}

/* ---------------------------------------------------------------- helpers */

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function log(state: CardQuestState, event: LogEvent): void {
  state.log.push(event);
  state.logSeq++;
  if (state.log.length > LOG_LIMIT) state.log.splice(0, state.log.length - LOG_LIMIT);
}

const remove = (list: string[], card: string): boolean => {
  const i = list.indexOf(card);
  if (i < 0) return false;
  list.splice(i, 1);
  return true;
};

function draw(state: CardQuestState, pile: 'encounter' | 'loot'): string | undefined {
  const discard = pile === 'encounter' ? 'encounterDiscard' : 'lootDiscard';
  if (state[pile].length === 0 && state[discard].length > 0) {
    const rng = createRngFromState(state.rng);
    state[pile] = rng.shuffle(state[discard]);
    state[discard] = [];
    state.rng = rng.state();
  }
  return state[pile].pop();
}

/** Puts a card onto the discard pile it belongs to. */
function discard(state: CardQuestState, card: string): void {
  const type = defOf(card).type;
  const loot = type === 'item' || type === 'upgrade' || type === 'oneshot' || type === 'levelup' || type === 'double';
  (loot ? state.lootDiscard : state.encounterDiscard).push(card);
}

export const seatCount = (state: CardQuestState): number => state.players.length;

/** The seat that must act now, or -1 (setup and finished games: the person; over: nobody). */
export function actorOf(state: CardQuestState): number {
  switch (state.phase) {
    case 'setup':
      return 0;
    case 'over':
      return -1;
    case 'fight':
      return state.fight?.actor ?? state.active;
    default:
      return state.active;
  }
}

/* ---------------------------------------------------------------- strength */

export interface Subject {
  kinds: Set<BaseKind>;
  traits: Set<Trait>;
  families: Set<Family>;
}

export const holds = (cond: Cond | undefined, subject: Subject): boolean => {
  if (!cond) return true;
  if (cond.kind && !subject.kinds.has(cond.kind)) return false;
  if (cond.trait && !subject.traits.has(cond.trait)) return false;
  if (cond.family && !subject.families.has(cond.family)) return false;
  if (cond.lacks && subject.traits.has(cond.lacks)) return false;
  return true;
};

const modsTotal = (mods: readonly Mod[] | undefined, subject: Subject): number =>
  (mods ?? []).reduce((sum, m) => (holds(m.when, subject) ? sum + m.bonus : sum), 0);

export function playerSubject(player: Player): Subject {
  const kinds = new Set<BaseKind>();
  const traits = new Set<Trait>();
  const families = new Set<Family>();
  for (const id of player.origins) {
    const def = defOf(id);
    if (def.type !== 'origin') continue;
    kinds.add(def.kind);
    if (def.family) families.add(def.family);
    for (const t of def.traits) traits.add(t);
  }
  if (kinds.size === 0) kinds.add('bigmouth');
  for (const id of player.equipped) {
    const def = defOf(id);
    if (def.type === 'item') for (const t of def.traits ?? []) traits.add(t);
  }
  for (const u of player.upgrades) {
    const def = defOf(u.card);
    if (def.type === 'upgrade' && player.equipped.includes(u.item)) for (const t of def.traits ?? []) traits.add(t);
  }
  return { kinds, traits, families };
}

export function monsterSubject(monsters: readonly FightMonster[]): Subject {
  const kinds = new Set<BaseKind>();
  const traits = new Set<Trait>();
  for (const m of monsters) {
    const def = defOf(m.card) as MonsterCard;
    kinds.add(def.kind);
    for (const t of def.traits) traits.add(t);
    for (const b of m.boosters) {
      const bd = defOf(b);
      if (bd.type === 'booster') for (const t of bd.traits ?? []) traits.add(t);
    }
  }
  return { kinds, traits, families: new Set() };
}

/** One line of a strength breakdown: `source` is a card id, `level`, `malus`, `set:<id>` or `class:<card>`. */
export interface Part {
  source: string;
  value: number;
}

const EMPTY_SUBJECT: Subject = { kinds: new Set(), traits: new Set(), families: new Set() };

/** Strength of a player's own table (level, equipment, origin, profession, sets), against the given monsters. */
export function playerParts(player: Player, monsters: readonly FightMonster[] = []): Part[] {
  const self = playerSubject(player);
  const foe = monsters.length > 0 ? monsterSubject(monsters) : EMPTY_SUBJECT;
  const parts: Part[] = [{ source: 'level', value: player.level }];
  for (const id of player.equipped) {
    const def = defOf(id) as ItemCard;
    let value = def.bonus + modsTotal(def.mods, foe) + modsTotal(def.self, self);
    for (const u of player.upgrades) if (u.item === id) value += (defOf(u.card) as { bonus: number }).bonus;
    parts.push({ source: id, value });
  }
  for (const id of player.origins) {
    const def = defOf(id);
    if (def.type === 'origin') {
      const value = modsTotal(def.mods, foe);
      if (value !== 0) parts.push({ source: id, value });
    }
  }
  for (const id of player.professions) {
    const def = defOf(id);
    if (def.type !== 'profession') continue;
    let value = modsTotal(def.mods, foe);
    if (def.perClass) value += def.perClass.bonus * player.equipped.filter((e) => (defOf(e) as ItemCard).cls === def.perClass!.cls).length;
    if (value !== 0) parts.push({ source: id, value });
  }
  const bases = new Set(player.equipped.map(baseId));
  for (const set of allSets()) if (set.items.every((i) => bases.has(i))) parts.push({ source: `set:${set.id}`, value: set.bonus });
  return parts;
}

/** Strength parts of the fighter in the current fight (table + one-shots − curse malus). */
export function heroParts(state: CardQuestState): Part[] {
  const fight = state.fight;
  const player = state.players[state.active] as Player;
  const parts = playerParts(player, fight?.monsters ?? []);
  if (fight && fight.helper !== null) parts.push({ source: `help:${fight.helper}`, value: tableStrength(state, fight.helper) });
  for (const id of fight?.hero ?? []) parts.push({ source: id, value: (defOf(id) as { bonus: number }).bonus });
  if (player.malus > 0) parts.push({ source: 'malus', value: -player.malus });
  return parts;
}

/** Table strength of a helper or turncoat against the current monsters (level, equipment, origin, profession, sets). */
export function tableStrength(state: CardQuestState, seat: number): number {
  return sum(playerParts(state.players[seat] as Player, state.fight?.monsters ?? []));
}

/** Strength of one monster in the fight against the fighter (min 1). */
export function monsterStrength(state: CardQuestState, index: number): Part[] {
  const fight = state.fight as Fight;
  const m = fight.monsters[index] as FightMonster;
  const def = defOf(m.card) as MonsterCard;
  const parts: Part[] = [{ source: m.card, value: def.level }];
  const vs = modsTotal(def.mods, playerSubject(state.players[state.active] as Player));
  if (vs !== 0) parts.push({ source: `vs:${m.card}`, value: vs });
  for (const b of m.boosters) parts.push({ source: b, value: (defOf(b) as { level: number }).level });
  return parts;
}

export const sum = (parts: readonly Part[]): number => parts.reduce((a, p) => a + p.value, 0);

export function fightTotals(state: CardQuestState): { hero: number; monsters: number } {
  const fight = state.fight;
  if (!fight) return { hero: 0, monsters: 0 };
  const hero = sum(heroParts(state));
  let monsters = 0;
  fight.monsters.forEach((_, i) => {
    monsters += Math.max(1, sum(monsterStrength(state, i)));
  });
  for (const id of fight.against) monsters += (defOf(id) as { bonus: number }).bonus;
  if (fight.turncoat !== null) monsters += tableStrength(state, fight.turncoat);
  return { hero, monsters };
}

/** Loot count of one monster with its boosters (never below 0). */
export function monsterLoot(m: FightMonster): number {
  const def = defOf(m.card) as MonsterCard;
  return Math.max(0, def.loot + m.boosters.reduce((a, b) => a + (defOf(b) as { loot: number }).loot, 0));
}

/** Flee bonus of the fighter (items, origins, professions, one-shots), without the monster's own modifier. */
export function fleeBonus(state: CardQuestState): number {
  const p = state.players[state.active] as Player;
  let bonus = state.fight?.flee ?? 0;
  for (const id of [...p.equipped, ...p.origins, ...p.professions]) {
    const def = defOf(id) as { flee?: number };
    bonus += def.flee ?? 0;
  }
  return bonus;
}

/* ---------------------------------------------------------------- equipment */

const itemDef = (id: string): ItemCard | undefined => {
  const def = defOf(id);
  return def.type === 'item' ? def : undefined;
};

/** Equipped items that would have to move to the pack to equip `card`. */
export function displacedBy(player: Player, card: string): string[] {
  const def = itemDef(card);
  if (!def) return [];
  const out: string[] = [];
  const others = player.equipped.filter((e) => e !== card);
  if (def.slot === 'head' || def.slot === 'body' || def.slot === 'feet') out.push(...others.filter((e) => itemDef(e)?.slot === def.slot));
  if (def.slot === 'hand') {
    let used = others.reduce((a, e) => a + (itemDef(e)?.slot === 'hand' ? (itemDef(e)?.hands ?? 1) : 0), 0);
    for (const e of others) {
      if (used + (def.hands ?? 1) <= HANDS) break;
      const d = itemDef(e);
      if (d?.slot === 'hand' && !out.includes(e)) {
        out.push(e);
        used -= d.hands ?? 1;
      }
    }
  }
  if (def.big) for (const e of others) if (itemDef(e)?.big && !out.includes(e)) out.push(e);
  return out;
}

const ownTurnCalm = (state: CardQuestState, seat: number) =>
  seat === state.active && (state.phase === 'prepare' || state.phase === 'after' || state.phase === 'end');

const capOf = (player: Player, of: 'origin' | 'profession') => 1 + player.doubles.filter((d) => (defOf(d) as { of?: string }).of === of).length;

/** Removes an equipped (or packed) item and its upgrades to the discard piles. */
function loseItem(state: CardQuestState, player: Player, item: string): void {
  if (!remove(player.equipped, item)) remove(player.pack, item);
  discard(state, item);
  for (const u of player.upgrades.filter((x) => x.item === item)) discard(state, u.card);
  player.upgrades = player.upgrades.filter((x) => x.item !== item);
}

const itemBonus = (player: Player, item: string) =>
  (itemDef(item)?.bonus ?? 0) + player.upgrades.filter((u) => u.item === item).reduce((a, u) => a + (defOf(u.card) as { bonus: number }).bonus, 0);

/** The equipped item with the highest bonus (first on ties), optionally within a slot. */
function bestItem(player: Player, slot?: Slot): string | undefined {
  let best: string | undefined;
  for (const e of player.equipped) {
    if (slot && itemDef(e)?.slot !== slot) continue;
    if (best === undefined || itemBonus(player, e) > itemBonus(player, best)) best = e;
  }
  return best;
}

/** Applies a curse effect or one Blunder line to a player. */
function applyPenalty(state: CardQuestState, seat: number, penalty: Penalty): void {
  const player = state.players[seat] as Player;
  switch (penalty.t) {
    case 'level': {
      const before = player.level;
      player.level = Math.max(1, player.level - penalty.n);
      log(state, { e: 'penalty', seat, p: 'level', n: before - player.level });
      return;
    }
    case 'slot':
    case 'best': {
      const item = bestItem(player, penalty.t === 'slot' ? penalty.slot : undefined);
      if (item) {
        loseItem(state, player, item);
        log(state, { e: 'penalty', seat, p: penalty.t, card: item });
      } else log(state, { e: 'penalty', seat, p: penalty.t, n: 0 });
      return;
    }
    case 'cards': {
      const rng = createRngFromState(state.rng);
      let lost = 0;
      for (let i = 0; i < penalty.n && player.hand.length > 0; i++) {
        const card = player.hand.splice(rng.int(0, player.hand.length - 1), 1)[0] as string;
        discard(state, card);
        lost++;
      }
      state.rng = rng.state();
      log(state, { e: 'penalty', seat, p: 'cards', n: lost });
      return;
    }
    case 'malus':
      player.malus += penalty.n;
      log(state, { e: 'penalty', seat, p: 'malus', n: penalty.n });
      return;
    case 'origin':
    case 'profession': {
      const list = penalty.t === 'origin' ? player.origins : player.professions;
      const lost = list.splice(0, list.length);
      for (const c of lost) discard(state, c);
      log(state, { e: 'penalty', seat, p: penalty.t, n: lost.length });
      return;
    }
  }
}

/* ---------------------------------------------------------------- turn flow */

function endFight(state: CardQuestState): void {
  const fight = state.fight;
  if (fight) {
    for (const m of fight.monsters) {
      discard(state, m.card);
      for (const b of m.boosters) discard(state, b);
    }
    for (const c of [...fight.hero, ...fight.against]) discard(state, c);
  }
  (state.players[state.active] as Player).malus = 0;
  state.fight = null;
  state.phase = state.phase === 'over' ? 'over' : 'end';
}

function startFight(state: CardQuestState, monster: string): void {
  state.fight = {
    monsters: [{ card: monster, boosters: [] }],
    hero: [],
    against: [],
    flee: 0,
    actor: state.active,
    passes: 0,
    rolls: [],
    helper: null,
    deal: null,
    offer: null,
    asked: [],
    stayOut: [],
    turncoat: null
  };
  state.phase = 'fight';
}

function resolveFight(state: CardQuestState): void {
  const fight = state.fight as Fight;
  const totals = fightTotals(state);
  const player = state.players[state.active] as Player;
  if (totals.hero > totals.monsters) {
    let levels = 0;
    let loot = 0;
    for (const m of fight.monsters) {
      levels += (defOf(m.card) as MonsterCard).levels;
      loot += monsterLoot(m);
    }
    player.level = Math.min(state.settings.target, player.level + levels);
    const drawn: string[] = [];
    for (let i = 0; i < loot; i++) {
      const card = draw(state, 'loot');
      if (card === undefined) break;
      drawn.push(card);
    }
    log(state, { e: 'won', seat: state.active, levels, loot: drawn.length });
    player.hand.push(...payHelper(state, drawn));
    if (player.level >= state.settings.target) {
      state.winners = [state.active];
      state.phase = 'over';
      log(state, { e: 'win', seats: [state.active] });
    }
    endFight(state);
    return;
  }
  log(state, { e: 'lost', seat: state.active });
  fight.actor = state.active;
  state.phase = 'flee';
}

/** Pays the helper what the deal promised (from the drawn loot, an item or a favour); returns the fighter's share. */
function payHelper(state: CardQuestState, drawn: string[]): string[] {
  const fight = state.fight as Fight;
  if (fight.helper === null || !fight.deal) return drawn;
  const fighter = state.players[state.active] as Player;
  const helper = state.players[fight.helper] as Player;
  const deal = fight.deal;
  let mine = drawn;
  const kept: LogEvent = { e: 'kept', seat: fight.helper, to: state.active, t: deal.t };
  if (deal.t === 'loot' || deal.t === 'most') {
    const n = deal.t === 'loot' ? Math.min(deal.n, drawn.length) : Math.max(0, drawn.length - 1);
    helper.hand.push(...drawn.slice(0, n));
    mine = drawn.slice(n);
    kept.n = n;
  } else if (deal.t === 'item') {
    // The promised item may have been cursed away during the fight: then the deal is void (nobody's fault).
    if (!remove(fighter.equipped, deal.item)) {
      log(state, { e: 'void', seat: fight.helper, to: state.active, card: deal.item });
      return mine;
    }
    for (const u of fighter.upgrades.filter((x) => x.item === deal.item)) discard(state, u.card);
    fighter.upgrades = fighter.upgrades.filter((x) => x.item !== deal.item);
    helper.hand.push(deal.item);
    kept.card = deal.item;
  } else if (deal.t === 'favour') {
    helper.favours.push(state.active);
    if (helper.favours.length > FAVOUR_LIMIT) helper.favours.shift();
  }
  log(state, kept);
  addRep(helper, 1);
  addRep(fighter, 1);
  return mine;
}

const addRep = (p: Player, delta: number) => {
  p.rep = Math.max(0, Math.min(REP_MAX, p.rep + delta));
};

/** A broken deal: reputation −2 for the breaker, one more grudge for the one let down. */
function breakDeal(state: CardQuestState, seat: number, to: number, why: 'switch' | 'stay' | 'favour'): void {
  addRep(state.players[seat] as Player, -2);
  hurt(state, to, seat);
  log(state, { e: 'broken', seat, to, why });
}

/** Records harm done by `by` to `seat` (public; grudge-holders remember it). */
function hurt(state: CardQuestState, seat: number, by: number): void {
  const harm = state.players[seat]?.harm;
  if (harm && by !== seat && by < harm.length) harm[by] = Math.min(999, (harm[by] ?? 0) + 1);
}

/** Interference against the fighter: counts as harm and breaks a deal to stay out. */
function interfered(state: CardQuestState, seat: number): void {
  const fight = state.fight;
  if (!fight || seat === state.active) return;
  hurt(state, state.active, seat);
  const i = fight.stayOut.indexOf(seat);
  if (i >= 0) {
    fight.stayOut.splice(i, 1);
    breakDeal(state, seat, state.active, 'stay');
  }
}

function nextTurn(state: CardQuestState): void {
  const count = seatCount(state);
  state.active = (state.active + 1) % count;
  if (state.active === state.starter) {
    state.round++;
    const limit = state.settings.roundLimit;
    if (limit > 0 && state.round > limit) {
      const top = Math.max(...state.players.map((p) => p.level));
      state.winners = state.players.flatMap((p, i) => (p.level === top ? [i] : []));
      state.phase = 'over';
      log(state, { e: 'win', seats: state.winners });
      return;
    }
  }
  state.phase = 'prepare';
  log(state, { e: 'turn', seat: state.active });
}

/** Who receives the surplus cards at the end of a turn: the lowest-level other player, or nobody (−1) if the active player is lowest. */
export function charityTarget(state: CardQuestState): number {
  const me = state.players[state.active] as Player;
  const count = seatCount(state);
  let target = -1;
  let low = me.level;
  for (let k = 1; k < count; k++) {
    const seat = (state.active + k) % count;
    const p = state.players[seat] as Player;
    if (p.level < low) {
      low = p.level;
      target = seat;
    }
  }
  return target;
}

export const surplus = (state: CardQuestState): number => Math.max(0, (state.players[state.active] as Player).hand.length - HAND_LIMIT);

/* ---------------------------------------------------------------- step */

/** Applies an action of `seat`; returns the new state or `null` when the action is not legal now. */
export function step(state: CardQuestState, seat: number, action: Action): CardQuestState | null {
  if (actorOf(state) !== seat && !(action.a === 'curse' && canCurseNow(state, seat))) return null;
  const s = clone(state);
  const ok = apply(s, seat, action);
  if (!ok) return null;
  s.counter++;
  return s;
}

/** Curses may be played by the actor of a fight window, or by the active player outside fights. */
function canCurseNow(state: CardQuestState, seat: number): boolean {
  if (state.phase === 'fight') return state.fight?.actor === seat;
  return ownTurnCalm(state, seat);
}

function apply(s: CardQuestState, seat: number, action: Action): boolean {
  const player = s.players[seat];
  if (action.a === 'start') {
    if (s.phase !== 'setup' || !isValidSettings(action.settings)) return false;
    deal(s, action.settings);
    return true;
  }
  if (!player || s.phase === 'setup' || s.phase === 'over') return false;
  // An open offer waits for its addressee: only Accept or Decline.
  if (s.fight?.offer && action.a !== 'accept' && action.a !== 'decline') return false;
  switch (action.a) {
    case 'equip': {
      if (!ownTurnCalm(s, seat)) return false;
      const def = itemDef(action.card);
      if (!def) return false;
      if (!remove(player.hand, action.card) && !remove(player.pack, action.card)) return false;
      for (const d of displacedBy(player, action.card)) {
        remove(player.equipped, d);
        player.pack.push(d);
      }
      player.equipped.push(action.card);
      log(s, { e: 'equip', seat, card: action.card });
      return true;
    }
    case 'unequip': {
      if (!ownTurnCalm(s, seat) || !remove(player.equipped, action.card)) return false;
      player.pack.push(action.card);
      return true;
    }
    case 'sell': {
      if (!ownTurnCalm(s, seat) || action.cards.length === 0 || new Set(action.cards).size !== action.cards.length) return false;
      const extra = player.professions.reduce((a, p) => a + ((defOf(p) as { sell?: number }).sell ?? 0), 0);
      let total = 0;
      for (const c of action.cards) {
        const def = defOf(c);
        if (def.type !== 'item' && def.type !== 'oneshot') return false;
        if (!player.hand.includes(c) && !player.pack.includes(c) && !player.equipped.includes(c)) return false;
        total += def.value + extra;
      }
      const levels = Math.min(Math.floor(total / SELL_RATE), s.settings.target - 1 - player.level);
      if (levels < 1) return false;
      for (const c of action.cards) {
        if (remove(player.hand, c)) discard(s, c);
        else loseItem(s, player, c);
      }
      player.level += levels;
      log(s, { e: 'sell', seat, count: action.cards.length, levels });
      return true;
    }
    case 'play': {
      if (!ownTurnCalm(s, seat) || !player.hand.includes(action.card)) return false;
      const def = defOf(action.card);
      if (def.type === 'levelup') {
        if (player.level >= s.settings.target - 1) return false;
        player.level++;
      } else if (def.type === 'windfall') {
        for (let i = 0; i < def.loot; i++) {
          const c = draw(s, 'loot');
          if (c !== undefined) player.hand.push(c);
        }
      } else if (def.type === 'origin' || def.type === 'profession') {
        const list = def.type === 'origin' ? player.origins : player.professions;
        if (list.length >= capOf(player, def.type)) discard(s, list.shift() as string);
        list.push(action.card);
      } else if (def.type === 'double') {
        if (player.doubles.some((d) => (defOf(d) as { of?: string }).of === def.of)) return false;
        player.doubles.push(action.card);
      } else return false;
      remove(player.hand, action.card);
      if (def.type === 'levelup' || def.type === 'windfall') discard(s, action.card);
      log(s, { e: 'play', seat, card: action.card });
      return true;
    }
    case 'upgrade': {
      if (!ownTurnCalm(s, seat) || !player.hand.includes(action.card) || defOf(action.card).type !== 'upgrade') return false;
      if (!player.equipped.includes(action.item)) return false;
      remove(player.hand, action.card);
      player.upgrades.push({ item: action.item, card: action.card });
      log(s, { e: 'upgrade', seat, card: action.card, item: action.item });
      return true;
    }
    case 'curse': {
      const def = defOf(action.card);
      const target = s.players[action.target];
      if (def.type !== 'curse' || !target || action.target === seat || !player.hand.includes(action.card)) return false;
      remove(player.hand, action.card);
      log(s, { e: 'curse', seat, card: action.card, target: action.target });
      if (s.fight && action.target === s.active) interfered(s, seat);
      else hurt(s, action.target, seat);
      applyPenalty(s, action.target, def.effect);
      discard(s, action.card);
      if (s.fight) s.fight.passes = 0;
      return true;
    }
    case 'open': {
      if (s.phase !== 'prepare' || seat !== s.active) return false;
      const card = draw(s, 'encounter');
      if (card === undefined) {
        s.phase = 'after';
        return true;
      }
      log(s, { e: 'open', seat, card });
      const def = defOf(card);
      if (def.type === 'monster') startFight(s, card);
      else if (def.type === 'curse') {
        applyPenalty(s, seat, def.effect);
        discard(s, card);
        s.phase = 'after';
      } else {
        player.hand.push(card);
        s.phase = 'after';
      }
      return true;
    }
    case 'challenge': {
      if (s.phase !== 'after' || seat !== s.active || defOf(action.card).type !== 'monster' || !remove(player.hand, action.card)) return false;
      log(s, { e: 'challenge', seat, card: action.card });
      startFight(s, action.card);
      return true;
    }
    case 'rummage': {
      if (s.phase !== 'after' || seat !== s.active) return false;
      const card = draw(s, 'encounter');
      if (card !== undefined) player.hand.push(card);
      log(s, { e: 'rummage', seat });
      s.phase = 'end';
      return true;
    }
    case 'boost': {
      const fight = s.fight;
      const def = defOf(action.card);
      if (s.phase !== 'fight' || !fight || def.type !== 'booster' || !fight.monsters[action.monster] || !remove(player.hand, action.card)) return false;
      fight.monsters[action.monster]!.boosters.push(action.card);
      fight.passes = 0;
      if (def.level > 0) interfered(s, seat);
      log(s, { e: 'boost', seat, card: action.card, monster: fight.monsters[action.monster]!.card });
      return true;
    }
    case 'reinforce': {
      const fight = s.fight;
      if (s.phase !== 'fight' || !fight || defOf(action.card).type !== 'reinforcement' || defOf(action.monster).type !== 'monster') return false;
      if (!player.hand.includes(action.card) || !player.hand.includes(action.monster)) return false;
      remove(player.hand, action.card);
      remove(player.hand, action.monster);
      discard(s, action.card);
      fight.monsters.push({ card: action.monster, boosters: [] });
      fight.passes = 0;
      interfered(s, seat);
      log(s, { e: 'reinforce', seat, card: action.card, monster: action.monster });
      return true;
    }
    case 'oneshot': {
      const fight = s.fight;
      const def = defOf(action.card);
      if (s.phase !== 'fight' || !fight || def.type !== 'oneshot' || !player.hand.includes(action.card)) return false;
      if (def.escape) {
        if (seat !== s.active || action.side !== 'hero') return false;
        remove(player.hand, action.card);
        discard(s, action.card);
        log(s, { e: 'escape', seat, card: action.card });
        endFight(s);
        return true;
      }
      if (def.turncoat) {
        // Change Sides: only the helper, onto the monsters' side; the deal is void.
        // Only the helper, only for the monsters, and one change of sides per fight.
        if (seat !== fight.helper || action.side !== 'monster' || fight.turncoat !== null) return false;
        remove(player.hand, action.card);
        fight.against.push(action.card);
        fight.turncoat = seat;
        fight.helper = null;
        fight.deal = null;
        fight.passes = 0;
        log(s, { e: 'switch', seat, to: s.active, card: action.card });
        breakDeal(s, seat, s.active, 'switch');
        return true;
      }
      if (def.flee && action.side !== 'hero') return false;
      if (action.side === 'monster') interfered(s, seat);
      remove(player.hand, action.card);
      (action.side === 'hero' ? fight.hero : fight.against).push(action.card);
      if (def.flee) fight.flee += def.flee;
      fight.passes = 0;
      log(s, { e: 'oneshot', seat, card: action.card, side: action.side });
      return true;
    }
    case 'offer': {
      const fight = s.fight;
      const { to, terms } = action;
      if (!canOffer(s, seat, to, terms) || !fight) return false;
      fight.offer = { to, terms: clone(terms) };
      fight.asked.push(to);
      fight.actor = to;
      log(s, { e: 'offer', seat, to, t: terms.t, ...(terms.t === 'loot' ? { n: terms.n } : {}), ...(terms.t === 'item' ? { card: terms.item } : {}), ...(terms.t === 'stay' ? { card: terms.card } : {}) });
      return true;
    }
    case 'accept':
    case 'decline': {
      const fight = s.fight;
      const offer = fight?.offer;
      if (s.phase !== 'fight' || !fight || !offer || seat !== offer.to) return false;
      const fighter = s.players[s.active] as Player;
      if (action.a === 'accept') {
        if (offer.terms.t === 'stay') {
          remove(fighter.hand, offer.terms.card);
          player.hand.push(offer.terms.card);
          fight.stayOut.push(seat);
        } else {
          fight.helper = seat;
          fight.deal = offer.terms;
          if (offer.terms.t === 'free') fighter.favours.splice(fighter.favours.indexOf(seat), 1);
        }
        log(s, { e: 'accept', seat, to: s.active });
      } else {
        log(s, { e: 'decline', seat, to: s.active });
        // Refusing a favour one owes breaks the deal it came from; the debt is gone either way.
        if (offer.terms.t === 'free') {
          fighter.favours.splice(fighter.favours.indexOf(seat), 1);
          breakDeal(s, seat, s.active, 'favour');
        }
      }
      fight.offer = null;
      fight.actor = s.active;
      fight.passes = 0;
      return true;
    }
    case 'pass': {
      const fight = s.fight;
      if (s.phase !== 'fight' || !fight) return false;
      fight.passes++;
      if (fight.passes >= seatCount(s)) resolveFight(s);
      else fight.actor = (fight.actor + 1) % seatCount(s);
      return true;
    }
    case 'roll': {
      const fight = s.fight;
      if (s.phase !== 'flee' || !fight || seat !== s.active) return false;
      const index = fight.rolls.length;
      const m = fight.monsters[index] as FightMonster;
      const def = defOf(m.card) as MonsterCard;
      const rng = createRngFromState(s.rng);
      const roll = rng.int(1, 6);
      s.rng = rng.state();
      const total = roll + fleeBonus(s) + (def.flee ?? 0);
      const ok = !def.noFlee && total >= FLEE_TARGET;
      fight.rolls.push(roll);
      log(s, { e: 'flee', seat, monster: m.card, roll, total, ok });
      if (!ok) for (const p of def.blunder) applyPenalty(s, seat, p);
      if (fight.rolls.length >= fight.monsters.length) endFight(s);
      return true;
    }
    case 'end': {
      if (s.phase !== 'end' || seat !== s.active) return false;
      const need = surplus(s);
      if (action.give.length !== need || new Set(action.give).size !== need || !action.give.every((c) => player.hand.includes(c))) return false;
      if (need > 0) {
        const to = charityTarget(s);
        for (const c of action.give) {
          remove(player.hand, c);
          if (to >= 0) (s.players[to] as Player).hand.push(c);
          else discard(s, c);
        }
        log(s, to >= 0 ? { e: 'give', seat, to, count: need } : { e: 'discard', seat, count: need });
      }
      nextTurn(s);
      return true;
    }
  }
  return false;
}

/* ---------------------------------------------------------------- legal actions */

/** All legal actions of `seat` now (sell is offered as "everything sellable" only; used by tests and the AI). */
export function legalActions(state: CardQuestState, seat: number): Action[] {
  const out: Action[] = [];
  const player = state.players[seat];
  if (!player || state.phase === 'setup' || state.phase === 'over') return out;
  const tryAdd = (action: Action) => {
    if (step(state, seat, action)) out.push(action);
  };
  const others = state.players.map((_, i) => i).filter((i) => i !== seat);
  for (const c of player.hand) {
    const type = defOf(c).type;
    if (type === 'curse') for (const t of others) tryAdd({ a: 'curse', card: c, target: t });
  }
  if (actorOf(state) !== seat) return out;
  switch (state.phase) {
    case 'prepare':
    case 'after':
    case 'end': {
      for (const c of [...player.hand, ...player.pack]) if (itemDef(c)) tryAdd({ a: 'equip', card: c });
      for (const c of player.equipped) tryAdd({ a: 'unequip', card: c });
      for (const c of player.hand) {
        const type = defOf(c).type;
        if (type === 'levelup' || type === 'windfall' || type === 'origin' || type === 'profession' || type === 'double') tryAdd({ a: 'play', card: c });
        if (type === 'upgrade') for (const item of player.equipped) tryAdd({ a: 'upgrade', card: c, item });
      }
      const sellable = [...player.hand, ...player.pack].filter((c) => {
        const t = defOf(c).type;
        return t === 'item' || t === 'oneshot';
      });
      if (sellable.length > 0) tryAdd({ a: 'sell', cards: sellable });
      if (state.phase === 'prepare') out.push({ a: 'open' });
      if (state.phase === 'after') {
        out.push({ a: 'rummage' });
        for (const c of player.hand) if (defOf(c).type === 'monster') out.push({ a: 'challenge', card: c });
      }
      if (state.phase === 'end') out.push({ a: 'end', give: player.hand.slice(0, surplus(state)) });
      break;
    }
    case 'fight': {
      const fight = state.fight as Fight;
      for (const c of player.hand) {
        const def = defOf(c);
        if (def.type === 'booster') fight.monsters.forEach((_, i) => tryAdd({ a: 'boost', card: c, monster: i }));
        if (def.type === 'oneshot') {
          tryAdd({ a: 'oneshot', card: c, side: 'hero' });
          tryAdd({ a: 'oneshot', card: c, side: 'monster' });
        }
        if (def.type === 'reinforcement') for (const m of player.hand) if (defOf(m).type === 'monster') tryAdd({ a: 'reinforce', card: c, monster: m });
      }
      if (fight.offer) {
        out.length = 0;
        out.push({ a: 'accept' }, { a: 'decline' });
        break;
      }
      // Checked directly (no state copy per shape): offers change nothing until answered.
      if (seat === state.active) for (const to of others) for (const terms of offerTerms(player, to)) if (canOffer(state, seat, to, terms)) out.push({ a: 'offer', to, terms });
      out.push({ a: 'pass' });
      break;
    }
    case 'flee':
      out.push({ a: 'roll' });
      break;
  }
  return out;
}

/** Whether the fighter `seat` may make this offer now (the only check `step` applies to an offer). */
export function canOffer(state: CardQuestState, seat: number, to: number, terms: unknown): terms is Terms {
  const fight = state.fight;
  const player = state.players[seat];
  if (state.phase !== 'fight' || !fight || !player || fight.offer || seat !== state.active || actorOf(state) !== seat) return false;
  if (!isInt(to, 0, seatCount(state) - 1) || to === seat || fight.asked.includes(to) || to === fight.turncoat || !isValidTerms(terms)) return false;
  if (terms.t === 'stay') return player.hand.includes(terms.card) && !fight.stayOut.includes(to) && to !== fight.helper;
  if (fight.helper !== null) return false;
  if (terms.t === 'item') return player.equipped.includes(terms.item);
  if (terms.t === 'free') return player.favours.includes(to);
  return true;
}

/** Every offer shape the fighter could make to `to` (legality: `canOffer`). */
export function offerTerms(player: Player, to: number): Terms[] {
  const out: Terms[] = [{ t: 'loot', n: 1 }, { t: 'loot', n: 2 }, { t: 'most' }, { t: 'favour' }];
  for (const item of player.equipped) out.push({ t: 'item', item });
  if (player.favours.includes(to)) out.push({ t: 'free' });
  for (const card of new Set(player.hand)) out.push({ t: 'stay', card });
  return out;
}

const isValidTerms = (v: unknown): v is Terms => {
  if (!isRecord(v)) return false;
  switch (v.t) {
    case 'loot':
      return v.n === 1 || v.n === 2;
    case 'most':
    case 'favour':
    case 'free':
      return true;
    case 'item':
      return isStr(v.item);
    case 'stay':
      return isStr(v.card);
    default:
      return false;
  }
};

/* ---------------------------------------------------------------- observation (what a seat may know) */

export interface Observation {
  seat: number;
  phase: Phase;
  settings: Settings;
  active: number;
  round: number;
  counter: number;
  hand: string[];
  handCounts: number[];
  players: Omit<Player, 'hand'>[];
  fight: Fight | null;
  encounterCount: number;
  lootCount: number;
  encounterDiscard: string[];
  lootDiscard: string[];
  winners: number[];
}

/** What `seat` may see: its own hand, the public table, pile sizes and discards — never other hands or pile orders. */
export function observe(state: CardQuestState, seat: number): Observation {
  return clone({
    seat,
    phase: state.phase,
    settings: state.settings,
    active: state.active,
    round: state.round,
    counter: state.counter,
    hand: state.players[seat]?.hand ?? [],
    handCounts: state.players.map((p) => p.hand.length),
    players: state.players.map(({ hand: _hand, ...rest }) => rest),
    fight: state.fight,
    encounterCount: state.encounter.length,
    lootCount: state.loot.length,
    encounterDiscard: state.encounterDiscard,
    lootDiscard: state.lootDiscard,
    winners: state.winners
  });
}

/** A state rebuilt from an observation with unknown cards hidden; lets the AI reuse `step` for "what if" checks. */
export function stateFromObservation(obs: Observation): CardQuestState {
  return {
    v: STATE_VERSION,
    seed: 0,
    rng: 0,
    phase: obs.phase,
    settings: clone(obs.settings),
    encounter: [],
    loot: [],
    encounterDiscard: [...obs.encounterDiscard],
    lootDiscard: [...obs.lootDiscard],
    players: obs.players.map((p, i) => ({ ...clone(p), hand: i === obs.seat ? [...obs.hand] : [] })),
    active: obs.active,
    starter: 0,
    round: obs.round,
    fight: clone(obs.fight),
    counter: obs.counter,
    log: [],
    logSeq: 0,
    seen: 0,
    winners: [...obs.winners],
    hints: []
  };
}

/* ---------------------------------------------------------------- validation */

const PHASES: readonly Phase[] = ['setup', 'prepare', 'after', 'fight', 'flee', 'end', 'over'];
const isStr = (v: unknown): v is string => typeof v === 'string';

function isValidPlayer(v: unknown, known: Set<string>, seats: number): v is Player {
  if (!isRecord(v)) return false;
  const cards = (x: unknown) => isArrayOf(x, isStr) && x.every((c) => known.has(c));
  return (
    isInt(v.level, 1, 99) &&
    cards(v.hand) &&
    cards(v.equipped) &&
    cards(v.pack) &&
    cards(v.origins) &&
    cards(v.professions) &&
    cards(v.doubles) &&
    isArrayOf(v.upgrades, (u): u is Upgrade => isRecord(u) && isStr(u.item) && isStr(u.card) && known.has(u.card)) &&
    isInt(v.malus, 0, 999) &&
    (v.personality === null || isOneOf(v.personality, PERSONALITIES)) &&
    isInt(v.rep, 0, REP_MAX) &&
    isArrayOf(v.favours, (x): x is number => isInt(x, 0, seats - 1)) &&
    v.favours.length <= FAVOUR_LIMIT &&
    isArrayOf(v.harm, (x): x is number => isInt(x, 0, 999)) &&
    v.harm.length === seats
  );
}

function isValidFight(v: unknown, known: Set<string>, seats: number): v is Fight {
  if (!isRecord(v)) return false;
  const cards = (x: unknown) => isArrayOf(x, isStr) && x.every((c) => known.has(c));
  return (
    isArrayOf(v.monsters, (m): m is FightMonster => isRecord(m) && isStr(m.card) && known.has(m.card) && cards(m.boosters)) &&
    v.monsters.length >= 1 &&
    cards(v.hero) &&
    cards(v.against) &&
    isInt(v.flee, 0, 999) &&
    isInt(v.actor, 0, seats - 1) &&
    isInt(v.passes, 0, seats) &&
    isArrayOf(v.rolls, (r): r is number => isInt(r, 1, 6)) &&
    v.rolls.length <= v.monsters.length &&
    (v.helper === null || isInt(v.helper, 0, seats - 1)) &&
    (v.turncoat === null || isInt(v.turncoat, 0, seats - 1)) &&
    (v.helper === null ? v.deal === null : isValidTerms(v.deal) && v.deal.t !== 'stay') &&
    (v.offer === null || (isRecord(v.offer) && isInt(v.offer.to, 0, seats - 1) && isValidTerms(v.offer.terms))) &&
    isArrayOf(v.asked, (x): x is number => isInt(x, 0, seats - 1)) &&
    new Set(v.asked).size === v.asked.length &&
    isArrayOf(v.stayOut, (x): x is number => isInt(x, 0, seats - 1)) &&
    v.stayOut.every((x) => (v.asked as number[]).includes(x))
  );
}

/** Who is who in a fight: the fighter never helps, switches or is asked; an open offer is to someone asked. */
function fightSeatsConsistent(state: CardQuestState): boolean {
  const f = state.fight as Fight;
  const a = state.active;
  if (f.helper === a || f.turncoat === a || f.asked.includes(a) || (f.helper !== null && f.helper === f.turncoat)) return false;
  if (f.helper !== null && !f.asked.includes(f.helper)) return false;
  if (f.offer && (!f.asked.includes(f.offer.to) || f.actor !== f.offer.to || state.phase !== 'fight')) return false;
  // An open offer must still be payable: the offered card in the fighter's hand, the called-in favour owed.
  const fighter = state.players[a] as Player;
  if (f.offer?.terms.t === 'stay' && !fighter.hand.includes(f.offer.terms.card)) return false;
  if (f.offer?.terms.t === 'free' && !fighter.favours.includes(f.offer.to)) return false;
  return true;
}

/** Structural and semantic validation of an untrusted save. Never throws. */
export function isValidState(value: unknown): value is CardQuestState {
  try {
    return check(value);
  } catch {
    return false;
  }
}

function check(v: unknown): v is CardQuestState {
  if (!isRecord(v) || v.v !== STATE_VERSION || !isUint32(v.seed) || !isUint32(v.rng) || !isOneOf(v.phase, PHASES)) return false;
  if (!isValidSettings(v.settings)) return false;
  const known = instanceSet(v.settings.worlds);
  const piles = ['encounter', 'loot', 'encounterDiscard', 'lootDiscard'] as const;
  for (const p of piles) if (!isArrayOf(v[p], isStr) || !(v[p] as string[]).every((c) => known.has(c))) return false;
  if (!isArrayOf(v.players, (p): p is Player => isValidPlayer(p, known, (v.players as unknown[]).length))) return false;
  if (!isInt(v.counter, 0) || !isArrayOf(v.log, isRecord) || !isArrayOf(v.hints, isStr) || !isArrayOf(v.winners, (w): w is number => isInt(w, 0, 5))) return false;
  if (!isInt(v.round, 0, 100000) || !isInt(v.logSeq, 0) || !isInt(v.seen, 0) || v.seen > v.logSeq || v.log.length > Math.min(LOG_LIMIT, v.logSeq)) return false;
  if (v.revealed !== undefined && !(isInt(v.revealed, 0) && v.revealed <= v.logSeq)) return false;
  if (!v.log.every((e) => isValidEvent(e, instanceSet((v.settings as Settings).worlds), (v.players as unknown[]).length))) return false;
  const state = v as unknown as CardQuestState;
  if (state.phase === 'setup') {
    return state.players.length === 0 && state.fight === null && piles.every((p) => state[p].length === 0);
  }
  const seats = state.settings.opponents + 1;
  if (state.players.length !== seats || !isInt(state.active, 0, seats - 1) || !isInt(state.starter, 0, seats - 1) || state.round < 1) return false;
  if (state.players[0]!.personality !== null || state.players.slice(1).some((p) => p.personality === null)) return false;
  const inFight = state.phase === 'fight' || state.phase === 'flee';
  if (inFight ? !isValidFight(state.fight, known, seats) || !fightSeatsConsistent(state) : state.fight !== null) return false;
  // A fight window has no flee rolls yet; while fleeing, at least one monster is still to roll for.
  if (state.phase === 'fight' && state.fight!.rolls.length !== 0) return false;
  if (state.phase === 'flee' && state.fight!.rolls.length >= state.fight!.monsters.length) return false;
  // Piles hold only cards of their kind.
  if ([...state.encounter, ...state.encounterDiscard].some((c) => isLootType(defOf(c).type))) return false;
  if ([...state.loot, ...state.lootDiscard].some((c) => !isLootType(defOf(c).type))) return false;
  if (state.players.some((p) => p.hand.some((c) => !known.has(c)))) return false;
  // Card conservation: every card of the chosen worlds exactly once.
  const seen: string[] = [...state.encounter, ...state.loot, ...state.encounterDiscard, ...state.lootDiscard];
  for (const p of state.players) {
    seen.push(...p.hand, ...p.equipped, ...p.pack, ...p.origins, ...p.professions, ...p.doubles, ...p.upgrades.map((u) => u.card));
    if (p.upgrades.some((u) => !p.equipped.includes(u.item) && !p.pack.includes(u.item))) return false;
    if (p.equipped.some((c) => defOf(c).type !== 'item') || p.pack.some((c) => defOf(c).type !== 'item')) return false;
    if (p.origins.some((c) => defOf(c).type !== 'origin') || p.professions.some((c) => defOf(c).type !== 'profession')) return false;
    if (p.doubles.some((c) => defOf(c).type !== 'double') || p.upgrades.some((u) => defOf(u.card).type !== 'upgrade')) return false;
    if (p.origins.length > capOf(p, 'origin') || p.professions.length > capOf(p, 'profession')) return false;
    if (!equipmentFits(p)) return false;
    if (p.level > state.settings.target) return false;
  }
  if (state.fight) {
    for (const m of state.fight.monsters) {
      seen.push(m.card, ...m.boosters);
      if (defOf(m.card).type !== 'monster' || m.boosters.some((b) => defOf(b).type !== 'booster')) return false;
    }
    seen.push(...state.fight.hero, ...state.fight.against);
    if ([...state.fight.hero, ...state.fight.against].some((c) => defOf(c).type !== 'oneshot')) return false;
  }
  if (seen.length !== known.size || new Set(seen).size !== seen.length) return false;
  // A win must be a reached target (or a round limit), never a crafted claim.
  if (state.phase === 'over') {
    if (state.winners.length === 0 || new Set(state.winners).size !== state.winners.length) return false;
    // The game's last event announces exactly these winners.
    const last = state.log[state.log.length - 1];
    if (!last || last.e !== 'win' || last.seats.join() !== state.winners.join()) return false;
    const reached = state.winners.every((w) => state.players[w]!.level >= state.settings.target);
    const limited = state.settings.roundLimit > 0 && state.round > state.settings.roundLimit;
    if (!reached && !limited) return false;
    if (limited && !reached) {
      const top = Math.max(...state.players.map((p) => p.level));
      if (state.winners.some((w) => state.players[w]!.level !== top)) return false;
    }
  } else {
    if (state.winners.length > 0) return false;
    if (state.players.some((p) => p.level >= state.settings.target)) return false;
  }
  return true;
}

const EVENT_TYPES: readonly LogEvent['e'][] = [
  'turn', 'open', 'rummage', 'challenge', 'boost', 'reinforce', 'oneshot', 'escape', 'curse', 'won', 'lost', 'flee',
  'penalty', 'equip', 'sell', 'play', 'upgrade', 'give', 'discard', 'win', 'offer', 'accept', 'decline', 'switch', 'kept', 'broken', 'void'
];
const TERMS: readonly Terms['t'][] = ['loot', 'most', 'item', 'favour', 'free', 'stay'];
const PENALTIES: readonly Penalty['t'][] = ['level', 'slot', 'best', 'cards', 'malus', 'origin', 'profession'];

/** A log event read from a save: known type, seats in range, cards of the game, small numbers. */
function isValidEvent(v: unknown, known: Set<string>, seats: number): v is LogEvent {
  if (!isRecord(v) || !isOneOf(v.e, EVENT_TYPES)) return false;
  const seat = (x: unknown) => isInt(x, 0, Math.max(0, seats - 1));
  const card = (x: unknown) => isStr(x) && known.has(x);
  const num = (x: unknown) => isInt(x, -1000, 1000);
  switch (v.e) {
    case 'turn':
    case 'rummage':
    case 'lost':
      return seat(v.seat);
    case 'open':
    case 'challenge':
    case 'equip':
    case 'play':
    case 'escape':
      return seat(v.seat) && card(v.card);
    case 'boost':
    case 'reinforce':
      return seat(v.seat) && card(v.card) && card(v.monster);
    case 'oneshot':
      return seat(v.seat) && card(v.card) && isOneOf(v.side, ['hero', 'monster'] as const);
    case 'curse':
      return seat(v.seat) && card(v.card) && seat(v.target);
    case 'won':
      return seat(v.seat) && num(v.levels) && num(v.loot);
    case 'flee':
      return seat(v.seat) && card(v.monster) && isInt(v.roll, 1, 6) && num(v.total) && typeof v.ok === 'boolean';
    case 'penalty':
      return seat(v.seat) && isOneOf(v.p, PENALTIES) && (v.card === undefined || card(v.card)) && (v.n === undefined || num(v.n));
    case 'sell':
      return seat(v.seat) && num(v.count) && num(v.levels);
    case 'upgrade':
      return seat(v.seat) && card(v.card) && card(v.item);
    case 'give':
      return seat(v.seat) && seat(v.to) && num(v.count);
    case 'discard':
      return seat(v.seat) && num(v.count);
    case 'win':
      return isArrayOf(v.seats, (x): x is number => seat(x));
    case 'offer':
    case 'kept':
      return seat(v.seat) && seat(v.to) && isOneOf(v.t, TERMS) && (v.n === undefined || num(v.n)) && (v.card === undefined || card(v.card));
    case 'accept':
    case 'decline':
      return seat(v.seat) && seat(v.to);
    case 'switch':
    case 'void':
      return seat(v.seat) && seat(v.to) && card(v.card);
    case 'broken':
      return seat(v.seat) && seat(v.to) && isOneOf(v.why, ['switch', 'stay', 'favour'] as const);
  }
}

/** Whether a player's equipped items fit the slots (one head/body/feet, two hands, one big item). */
export function equipmentFits(p: Player): boolean {
  const count: Record<string, number> = { head: 0, body: 0, feet: 0, hand: 0, big: 0 };
  for (const id of p.equipped) {
    const def = itemDef(id);
    if (!def) return false;
    if (def.slot === 'hand') count.hand = count.hand! + (def.hands ?? 1);
    else if (def.slot !== 'small') count[def.slot] = count[def.slot]! + 1;
    if (def.big) count.big = count.big! + 1;
  }
  return count.head! <= 1 && count.body! <= 1 && count.feet! <= 1 && count.hand! <= HANDS && count.big! <= 1;
}

export function migrateState(state: unknown, fromVersion: number): CardQuestState | undefined {
  const upgraded = fromVersion === 1 ? fromV1(state) : state;
  return (fromVersion === 1 || fromVersion === STATE_VERSION) && isValidState(upgraded) ? upgraded : undefined;
}

/**
 * Version 1 (K1) → 2 (K2): players get reputation, favours and harm; fights get the deal fields; the two Change
 * Sides cards join the loot pile (at seed-derived places, the generator is untouched). Never throws.
 */
function fromV1(value: unknown): unknown {
  try {
    if (!isRecord(value) || !isArrayOf(value.players, isRecord) || !isArrayOf(value.loot, isStr)) return undefined;
    const s = clone(value) as Record<string, unknown> & { players: Record<string, unknown>[]; loot: string[]; fight: Record<string, unknown> | null };
    const seats = s.players.length;
    for (const p of s.players) Object.assign(p, { rep: REP_START, favours: [], harm: Array.from({ length: seats }, () => 0) });
    if (isRecord(s.fight)) Object.assign(s.fight, { helper: null, deal: null, offer: null, asked: [], stayOut: [], turncoat: null });
    if (s.phase !== 'setup' && isArrayOf((s.settings as { worlds?: unknown } | undefined)?.worlds, isStr) && (s.settings as { worlds: string[] }).worlds.includes('kz')) {
      const seed = isUint32(s.seed) ? s.seed : 0;
      // One in each half of the pile, at seed-derived places.
      const half = Math.floor(s.loot.length / 2);
      s.loot.splice(half + (seed % (s.loot.length - half + 1)), 0, 'kz.change-sides#2');
      // Strictly in the first half, so the two never end up next to each other.
      s.loot.splice((seed >>> 8) % Math.max(1, half), 0, 'kz.change-sides#1');
    }
    s.v = STATE_VERSION;
    return s;
  } catch {
    return undefined;
  }
}
