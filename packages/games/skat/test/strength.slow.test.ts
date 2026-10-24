import { describe, expect, it } from 'vitest';
import { createRng } from '@wp/game-core';
import { advance, chooseAction, viewFor } from '../src/ai';
import { applyAction, legalCards, newDeal, newGame, nextDeal, playKind, startSeries, toAct, type Action, type DealState, type Difficulty, type Seat, type SkatState } from '../src/rules';

/**
 * Strength measurements on fixed seeds (deterministic). Every deal is played with seat 0 as declarer at 18
 * (the others pass), so the comparison isolates card play. "random" is a scripted baseline that plays a random
 * legal card (its declaration is made by the easy rules). The full report with more deals is in the final notes;
 * these smaller runs guard the ordering.
 */
type Level = Difficulty | 'random';

function forcedDeal(dealSeed: number, declarer: Level, defenders: Level): { won: boolean; points: number } | null {
  const { deal } = newDeal(2, dealSeed);
  deal.bids = ['pass', 'pass', 18];
  let s: SkatState = { v: 1, seed: dealSeed, difficulty: 'normal', options: { series: 0, scoring: 'simple', ramsch: false }, stage: 'play', rng: 1, list: [], deal };
  const rng = createRng(dealSeed ^ 0x5555);
  for (let step = 0; step < 60; step++) {
    const d = s.deal as DealState;
    if (d.result) break;
    const seat = toAct(d) as Seat;
    const level = seat === 0 ? declarer : defenders;
    const action: Action =
      level === 'random' && d.contract
        ? { type: 'play', card: rng.pick(legalCards(d.hands[seat], d.trick, playKind(d) ?? 'grand')) }
        : chooseAction(viewFor(d, seat, level === 'random' ? 'easy' : level), dealSeed * 31 + step);
    s = applyAction(s, seat, action) as SkatState;
  }
  const r = s.deal?.result;
  return r?.type === 'game' ? { won: r.valuation.won, points: r.declarerPoints } : null;
}

function winRate(declarer: Level, defenders: Level, deals: number): number {
  let won = 0;
  let n = 0;
  for (let i = 0; i < deals; i++) {
    const r = forcedDeal(7000 + i, declarer, defenders);
    if (!r) continue;
    n++;
    if (r.won) won++;
  }
  return won / n;
}

describe('computer strength (fixed seeds)', () => {
  it('normal card play beats the random baseline from both sides', () => {
    const vsRandomDefence = winRate('normal', 'random', 30);
    const randomVsNormal = winRate('random', 'normal', 30);
    expect(vsRandomDefence).toBeGreaterThan(0.7);
    expect(randomVsNormal).toBeLessThan(0.45);
  }, 120_000);

  it('stronger defenders let the declarer win less often (easy > hard)', () => {
    expect(winRate('normal', 'easy', 30)).toBeGreaterThan(winRate('normal', 'hard', 30));
  }, 180_000);

  it('a series between computer players ends with every game scored', () => {
    let s = startSeries(newGame(99, 'normal', { series: 3, scoring: 'seeger', ramsch: false }));
    for (let g = 0; g < 3; g++) {
      s = advance(s, { 0: 'normal', 1: 'normal', 2: 'normal' }).state;
      if (g < 2) s = nextDeal(s) as SkatState;
    }
    expect(s.stage).toBe('over');
    expect(s.list).toHaveLength(3);
  }, 60_000);
});
