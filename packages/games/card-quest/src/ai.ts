import { createRng, type Rng } from '@wp/game-core';
import type { ItemCard, MonsterCard } from './cards';
import {
  FLEE_TARGET,
  charityTarget,
  fightTotals,
  playerParts,
  stateFromObservation,
  step,
  sum,
  surplus,
  type Action,
  type CardQuestState,
  type Difficulty,
  type Observation,
  type Personality,
  type Player
} from './rules';
import { defOf } from './worlds';

/*
 * Computer players (design § 5.7). They decide from `observe(state, seat)` only — their own hand and the
 * public table — and use `step` on a state rebuilt from that observation for "what if" checks.
 * Personalities are weights for one heuristic. Tie-breaks use a generator seeded from public facts.
 */

interface Style {
  /** Minimum strength margin before challenging a monster from the hand. */
  challengeMargin: number;
  /** Interferes with the leader (not only with someone about to win). */
  stopsLeader: boolean;
  /** Also interferes with anyone just to slow them down (cheap interference only). */
  meddles: boolean;
  /** Plays curses outside fights. */
  curses: boolean;
}

const STYLES: Record<Personality, Style> = {
  cautious: { challengeMargin: 4, stopsLeader: false, meddles: false, curses: false },
  opportunist: { challengeMargin: 2, stopsLeader: true, meddles: true, curses: true },
  grudge: { challengeMargin: 3, stopsLeader: true, meddles: false, curses: true },
  showoff: { challengeMargin: 1, stopsLeader: true, meddles: false, curses: true }
};

/** Most cards a computer player spends to stop one fight. */
const MAX_INTERFERENCE: Record<Difficulty, number> = { easy: 1, normal: 2, sharp: 3 };

const strengthOf = (p: Player, monsters: CardQuestState['fight'] = null) => sum(playerParts(p, monsters?.monsters ?? []));

/** Decides the next action of the observing seat. Always returns an action that is legal in the full state. */
export function decide(obs: Observation, difficulty: Difficulty): Action {
  const state = stateFromObservation(obs);
  const seat = obs.seat;
  const me = state.players[seat] as Player;
  const style = STYLES[me.personality ?? 'cautious'];
  const rng = createRng((obs.counter * 0x9e3779b1 + seat * 0x85ebca6b) >>> 0);
  switch (state.phase) {
    case 'prepare':
    case 'after':
    case 'end': {
      const calm = calmAction(state, seat, style, difficulty, rng);
      if (calm) return calm;
      if (state.phase === 'prepare') return { a: 'open' };
      if (state.phase === 'after') return challengeOrRummage(state, seat, style, difficulty);
      return { a: 'end', give: giveAway(state, seat) };
    }
    case 'fight':
      return (seat === state.active ? fighterAction(state, seat) : interferenceAction(state, seat, style, difficulty, rng)) ?? { a: 'pass' };
    case 'flee':
      return { a: 'roll' };
    default:
      return { a: 'pass' };
  }
}

/* ---------------------------------------------------------------- calm phases */

function calmAction(state: CardQuestState, seat: number, style: Style, difficulty: Difficulty, rng: Rng): Action | null {
  const me = state.players[seat] as Player;
  const legal = (a: Action) => step(state, seat, a) !== null;
  for (const c of me.hand) {
    const type = defOf(c).type;
    if ((type === 'double' || type === 'windfall' || type === 'levelup') && legal({ a: 'play', card: c })) return { a: 'play', card: c };
    if ((type === 'origin' && me.origins.length === 0) || (type === 'profession' && me.professions.length === 0)) {
      if (legal({ a: 'play', card: c })) return { a: 'play', card: c };
    }
  }
  // Equip the item that raises the table strength most.
  const base = strengthOf(me);
  let best: { card: string; gain: number } | null = null;
  for (const c of [...me.hand, ...me.pack]) {
    if (defOf(c).type !== 'item') continue;
    const next = step(state, seat, { a: 'equip', card: c });
    if (!next) continue;
    const gain = strengthOf(next.players[seat] as Player) - base;
    if (gain > 0 && (!best || gain > best.gain)) best = { card: c, gain };
  }
  if (best) return { a: 'equip', card: best.card };
  // Upgrades onto the strongest item.
  for (const c of me.hand) {
    if (defOf(c).type !== 'upgrade' || me.equipped.length === 0) continue;
    const item = [...me.equipped].sort((a, b) => (defOf(b) as ItemCard).bonus - (defOf(a) as ItemCard).bonus)[0] as string;
    if (legal({ a: 'upgrade', card: c, item })) return { a: 'upgrade', card: c, item };
  }
  // Sell what is of no use: carried items and items that would not raise the strength.
  const junk = [...me.pack, ...me.hand.filter((c) => defOf(c).type === 'item')];
  if (junk.length > 0) {
    const sell: Action = { a: 'sell', cards: junk };
    if (legal(sell)) return sell;
  }
  // Curses on the leader (outside fights), by personality.
  if (style.curses && state.phase !== 'end') {
    const leader = leaderOf(state, seat);
    const cursed = me.hand.find((c) => defOf(c).type === 'curse');
    const worthIt = leader >= 0 && ((state.players[leader] as Player).level >= me.level || difficulty === 'sharp');
    if (cursed && worthIt && (difficulty !== 'easy' || rng.next() < 0.5)) {
      const a: Action = { a: 'curse', card: cursed, target: leader };
      if (legal(a)) return a;
    }
  }
  return null;
}

function challengeOrRummage(state: CardQuestState, seat: number, style: Style, difficulty: Difficulty): Action {
  const me = state.players[seat] as Player;
  const margin = style.challengeMargin + (difficulty === 'easy' ? 0 : 1);
  let pick: { card: string; level: number } | null = null;
  for (const c of me.hand) {
    const def = defOf(c);
    if (def.type !== 'monster') continue;
    const trial = step(state, seat, { a: 'challenge', card: c });
    if (!trial) continue;
    const t = fightTotals(trial);
    // Winning the game needs a fight: be bolder then.
    const wins = me.level + def.levels >= state.settings.target;
    if (t.hero - t.monsters >= (wins ? 1 : margin) && (!pick || def.level > pick.level)) pick = { card: c, level: def.level };
  }
  return pick ? { a: 'challenge', card: pick.card } : { a: 'rummage' };
}

/** Value of keeping a card (higher = keep). */
function keepValue(state: CardQuestState, seat: number, card: string): number {
  const def = defOf(card);
  const me = state.players[seat] as Player;
  switch (def.type) {
    case 'oneshot':
      return 4 + def.bonus + (def.escape ? 3 : 0) + (def.flee ?? 0);
    case 'item': {
      const next = step(state, seat, { a: 'equip', card });
      return next ? Math.max(1, strengthOf(next.players[seat] as Player) - strengthOf(me)) : 1;
    }
    case 'curse':
      return 3;
    case 'booster':
      return def.level > 0 ? 3 : 2;
    case 'monster':
      return 1;
    default:
      return 5;
  }
}

function giveAway(state: CardQuestState, seat: number): string[] {
  const me = state.players[seat] as Player;
  const n = surplus(state);
  // When the surplus goes to another player, never hand them curses or boosters they could use against us.
  const toOther = charityTarget(state) >= 0;
  const score = (c: string) => keepValue(state, seat, c) + (toOther && ['curse', 'booster', 'oneshot'].includes(defOf(c).type) ? 10 : 0);
  return [...me.hand].sort((a, b) => score(a) - score(b) || (a < b ? -1 : 1)).slice(0, n);
}

/* ---------------------------------------------------------------- fights */

/** Single actions of `seat` in the current fight window that change the outcome, with their resulting margin. */
function fightCandidates(state: CardQuestState, seat: number, side: 'hero' | 'monster'): { action: Action; next: CardQuestState }[] {
  const me = state.players[seat] as Player;
  const out: { action: Action; next: CardQuestState }[] = [];
  const add = (action: Action) => {
    const next = step(state, seat, action);
    if (next && next.phase === 'fight') out.push({ action, next });
  };
  for (const c of me.hand) {
    const def = defOf(c);
    if (def.type === 'oneshot' && !def.escape && def.bonus > 0) add({ a: 'oneshot', card: c, side });
    if (def.type === 'booster' && (side === 'monster' ? def.level > 0 : def.level < 0)) state.fight?.monsters.forEach((_, i) => add({ a: 'boost', card: c, monster: i }));
    if (def.type === 'curse' && side === 'monster') add({ a: 'curse', card: c, target: state.active });
    if (def.type === 'reinforcement' && side === 'monster') for (const m of me.hand) if (defOf(m).type === 'monster') add({ a: 'reinforce', card: c, monster: m });
  }
  return out;
}

const margin = (state: CardQuestState) => {
  const t = fightTotals(state);
  return t.hero - t.monsters;
};

/** Greedy: the shortest sequence (≤ limit) of own cards that moves the margin across `goal`; returns its first action. */
function planTo(state: CardQuestState, seat: number, side: 'hero' | 'monster', limit: number): Action | null {
  const reached = (s: CardQuestState) => (side === 'hero' ? margin(s) > 0 : margin(s) <= 0);
  let current = state;
  let first: Action | null = null;
  for (let i = 0; i < limit; i++) {
    const options = fightCandidates(current, seat, side);
    if (options.length === 0) return null;
    // Prefer a single card that suffices with the smallest overshoot; else the biggest swing.
    const sufficient = options.filter((o) => reached(o.next));
    const pick =
      sufficient.length > 0
        ? sufficient.sort((a, b) => Math.abs(margin(a.next)) - Math.abs(margin(b.next)))[0]!
        : options.sort((a, b) => (side === 'hero' ? margin(b.next) - margin(a.next) : margin(a.next) - margin(b.next)))[0]!;
    first ??= pick.action;
    current = pick.next;
    if (reached(current)) return first;
  }
  return null;
}

function fighterAction(state: CardQuestState, seat: number): Action | null {
  if (margin(state) > 0) return null;
  const me = state.players[seat] as Player;
  const plan = planTo(state, seat, 'hero', me.hand.length);
  if (plan) return plan;
  const fight = state.fight!;
  const harsh = fight.monsters.some((m) => {
    const def = defOf(m.card) as MonsterCard;
    return def.noFlee || def.blunder.some((p) => p.t === 'level' || p.t === 'best');
  });
  const escape = me.hand.find((c) => {
    const def = defOf(c);
    return def.type === 'oneshot' && def.escape;
  });
  if (escape && harsh) return { a: 'oneshot', card: escape, side: 'hero' };
  // Improve the flee roll when it is not already certain.
  const fleeCard = me.hand.find((c) => {
    const def = defOf(c);
    return def.type === 'oneshot' && (def.flee ?? 0) > 0;
  });
  const canFlee = fight.monsters.some((m) => !(defOf(m.card) as MonsterCard).noFlee);
  if (fleeCard && canFlee && fight.flee < FLEE_TARGET) return { a: 'oneshot', card: fleeCard, side: 'hero' };
  return null;
}

/** The other player with the highest level (lowest seat on ties), or -1. */
function leaderOf(state: CardQuestState, seat: number): number {
  let leader = -1;
  state.players.forEach((p, i) => {
    if (i !== seat && (leader < 0 || p.level > (state.players[leader] as Player).level)) leader = i;
  });
  return leader;
}

function interferenceAction(state: CardQuestState, seat: number, style: Style, difficulty: Difficulty, rng: Rng): Action | null {
  if (margin(state) <= 0) return null;
  const hero = state.players[state.active] as Player;
  const gain = state.fight!.monsters.reduce((a, m) => a + (defOf(m.card) as MonsterCard).levels, 0);
  const winsGame = hero.level + gain >= state.settings.target;
  const top = Math.max(...state.players.map((p) => p.level));
  const leads = hero.level >= top && hero.level > (state.players[seat] as Player).level;
  let want = winsGame || (style.stopsLeader && leads) || (style.meddles && rng.next() < 0.35);
  if (difficulty === 'easy') want = winsGame && rng.next() < 0.6;
  if (!want) return null;
  const limit = winsGame ? MAX_INTERFERENCE[difficulty] + 1 : MAX_INTERFERENCE[difficulty];
  return planTo(state, seat, 'monster', limit);
}
