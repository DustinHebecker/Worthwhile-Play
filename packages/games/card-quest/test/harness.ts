import { decide } from '../src/ai';
import { actorOf, DEFAULT_SETTINGS, newGame, observe, step, type CardQuestState, type Player, type Settings } from '../src/rules';
import { worldDecks } from '../src/worlds';

/** Plays a whole game with computer players in every seat (seat 0 uses the AI too). */
export function selfPlay(seed: number, settings: Partial<Settings> = {}, maxActions = 20_000): { state: CardQuestState; actions: number } {
  let s = newGame(seed);
  s = step(s, 0, { a: 'start', settings: { ...DEFAULT_SETTINGS, ...settings } })!;
  let actions = 0;
  while (s.phase !== 'over' && actions < maxActions) {
    const seat = actorOf(s);
    const action = decide(observe(s, seat), s.settings.difficulty);
    const next = step(s, seat, action);
    if (!next) throw new Error(`illegal AI action ${JSON.stringify(action)} in phase ${s.phase} (seat ${seat})`);
    s = next;
    actions++;
  }
  return { state: s, actions };
}


export const start = (seed: number, settings: Partial<Settings> = {}): CardQuestState => step(newGame(seed), 0, { a: 'start', settings: { ...DEFAULT_SETTINGS, ...settings } })!;

/** A state for focused rule tests: seat `active` on turn in `phase`, hands and table as given. */
export function arranged(patch: (s: CardQuestState) => void, settings: Partial<Settings> = { opponents: 2 }): CardQuestState {
  const s = start(1, settings);
  // Put every card back into the piles, then deal what the test wants.
  const all = worldDecks(s.settings.worlds);
  s.encounter = [...all.encounter];
  s.loot = [...all.loot];
  s.encounterDiscard = [];
  s.lootDiscard = [];
  for (const p of s.players) Object.assign(p, { level: 1, hand: [], equipped: [], pack: [], upgrades: [], origins: [], professions: [], doubles: [], malus: 0 });
  s.active = 0;
  s.phase = 'prepare';
  s.fight = null;
  patch(s);
  return s;
}

/** Moves a card from wherever it is in the piles to a target list. */
export function take(s: CardQuestState, card: string, to: string[]): void {
  for (const pile of [s.encounter, s.loot]) {
    const i = pile.indexOf(card);
    if (i >= 0) {
      pile.splice(i, 1);
      to.push(card);
      return;
    }
  }
  throw new Error(`card ${card} not in a pile`);
}

export const me = (s: CardQuestState): Player => s.players[0]!;
