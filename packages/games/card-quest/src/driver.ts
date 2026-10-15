import { decide } from './ai';
import { actorOf, legalActions, observe, step, type Action, type CardQuestState } from './rules';

/** Seat of the person. All other seats are computer players. */
export const HUMAN = 0;

/** Whether a computer player must act now. */
export const computerToAct = (state: CardQuestState): boolean => {
  const actor = actorOf(state);
  return actor > HUMAN && state.phase !== 'setup' && state.phase !== 'over';
};

/** One action of the computer player whose turn it is (from its own observation), or `null` if none is due. */
export function computerStep(state: CardQuestState): { state: CardQuestState; seat: number; action: Action } | null {
  if (!computerToAct(state)) return null;
  const seat = actorOf(state);
  const action = decide(observe(state, seat), state.settings.difficulty);
  const next = step(state, seat, action);
  if (next) return { state: next, seat, action };
  // Never expected (tested); keeps a game moving if a heuristic ever proposes something illegal.
  const fallback = legalActions(state, seat).find((a) => a.a === 'pass' || a.a === 'open' || a.a === 'rummage' || a.a === 'roll' || a.a === 'end');
  const forced = fallback && step(state, seat, fallback);
  return forced && fallback ? { state: forced, seat, action: fallback } : null;
}

/** Whether the person can do something in the current fight window other than passing. */
export function humanCanReact(state: CardQuestState): boolean {
  return legalActions(state, HUMAN).some((a) => a.a !== 'pass');
}

/**
 * The person's trivial step, applied without asking: passing in another player's fight window when no card
 * of theirs could be played there.
 */
export function humanAutoPass(state: CardQuestState): CardQuestState | null {
  if (state.phase !== 'fight' || actorOf(state) !== HUMAN || state.active === HUMAN || humanCanReact(state)) return null;
  return step(state, HUMAN, { a: 'pass' });
}

/** Runs computer actions and the person's automatic passes until the person must decide (or the game ends). */
export function advance(state: CardQuestState, maxActions = 10_000): CardQuestState {
  let s = state;
  for (let i = 0; i < maxActions; i++) {
    const auto = humanAutoPass(s);
    if (auto) {
      s = auto;
      continue;
    }
    const next = computerStep(s);
    if (!next) return s;
    s = next.state;
  }
  return s;
}
