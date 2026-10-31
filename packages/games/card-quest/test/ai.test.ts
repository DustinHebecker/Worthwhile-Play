import { describe, expect, it } from 'vitest';
import { decide } from '../src/ai';
import { advance } from '../src/driver';
import { actorOf, DEFAULT_SETTINGS, fightTotals, newGame, observe, step, type CardQuestState } from '../src/rules';
import { worldDecks } from '../src/worlds';
import { selfPlay } from './harness';

function fightOf(heroLevel: number, monster: string, interferer: string[], opts: { difficulty?: 'easy' | 'normal' | 'sharp'; target?: 6 | 8 | 10 | 12 } = {}): CardQuestState {
  const s = step(newGame(1), 0, { a: 'start', settings: { ...DEFAULT_SETTINGS, opponents: 1, difficulty: opts.difficulty ?? 'normal', target: opts.target ?? 10 } })!;
  const all = worldDecks(['kz']);
  s.encounter = all.encounter.filter((c) => c !== monster && !interferer.includes(c));
  s.loot = all.loot.filter((c) => !interferer.includes(c));
  s.encounterDiscard = [];
  s.lootDiscard = [];
  for (const p of s.players) Object.assign(p, { level: 1, hand: [], equipped: [], pack: [], upgrades: [], origins: [], professions: [], doubles: [], malus: 0 });
  s.players[0]!.level = heroLevel;
  s.players[1]!.hand = [...interferer];
  s.players[1]!.personality = 'opportunist';
  s.encounter.push(monster);
  s.active = 0;
  s.phase = 'prepare';
  return step(step(s, 0, { a: 'open' })!, 0, { a: 'pass' })!;
}

describe('computer players', () => {
  it('stop a fight that would win the game when their cards suffice', () => {
    const s = fightOf(9, 'kz.pebble-golem', ['kz.prize-size']);
    expect(fightTotals(s).hero).toBeGreaterThan(fightTotals(s).monsters);
    const action = decide(observe(s, 1), 'normal');
    expect(action).toEqual({ a: 'boost', card: 'kz.prize-size', monster: 0 });
  });

  it('do not waste cards when they cannot change the outcome', () => {
    const s = fightOf(9, 'kz.pebble-golem', ['kz.lunch-break#1']);
    expect(decide(observe(s, 1), 'sharp')).toEqual({ a: 'pass' });
  });

  it('decide only from their observation: hidden cards elsewhere do not change the decision', () => {
    const s = fightOf(5, 'kz.cave-slime', ['kz.furious-fence#1']);
    const other = structuredClone(s);
    const hidden = other.encounter.splice(0, 3);
    other.players[0]!.hand.push(...hidden);
    expect(decide(observe(s, 1), 'normal')).toEqual(decide(observe(other, 1), 'normal'));
  });

  it('always propose legal actions and finish games (all difficulties, 2–6 players)', () => {
    for (const difficulty of ['easy', 'normal', 'sharp'] as const) {
      for (let opponents = 1; opponents <= 5; opponents++) {
        const { state } = selfPlay(opponents * 101 + difficulty.length, { opponents, difficulty, target: 8 });
        expect(state.phase).toBe('over');
      }
    }
  });

  it('advance stops exactly when the person has to decide', () => {
    let s = step(newGame(21), 0, { a: 'start', settings: { ...DEFAULT_SETTINGS, opponents: 5 } })!;
    s = advance(s);
    const actor = actorOf(s);
    expect(actor).toBe(0);
  });
});
