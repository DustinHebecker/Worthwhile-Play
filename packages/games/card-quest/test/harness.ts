import { decide } from '../src/ai';
import { actorOf, DEFAULT_SETTINGS, newGame, observe, step, type CardQuestState, type Settings } from '../src/rules';

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

