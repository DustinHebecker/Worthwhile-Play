import { describe, expect, it } from 'vitest';
import { decide } from '../src/ai';
import { observe, step, type CardQuestState, type Difficulty, type Personality, type Terms } from '../src/rules';
import { arranged, take } from './harness';

/*
 * Computer players and deals (design § 5.6, K2): whom a losing fighter asks and for what, how offers are answered,
 * when a helper changes sides, and the grudge-holder's payback. Seats 0–3; the fighter opens the Gold Rat (level 5,
 * 2 loot cards) at level 1 unless a test says otherwise.
 */
function fight(fighter: number, patch: (s: CardQuestState) => void = () => undefined, monster = 'kz.gold-rat'): CardQuestState {
  const s = arranged(
    (s) => {
      s.active = fighter;
      s.players.forEach((p, i) => {
        if (i > 0) p.personality = 'cautious';
      });
      s.encounter.splice(s.encounter.indexOf(monster), 1);
      s.encounter.push(monster);
      patch(s);
    },
    { opponents: 3 }
  );
  return step(s, fighter, { a: 'open' })!;
}

const ai = (s: CardQuestState, seat: number, difficulty: Difficulty = 'normal') => decide(observe(s, seat), difficulty);
const strong = (s: CardQuestState, seat: number, level = 5) => {
  s.players[seat]!.level = level;
};
const offerTo = (s: CardQuestState, to: number, terms: Terms) => step(s, s.active, { a: 'offer', to, terms })!;

describe('a losing computer fighter asks for help', () => {
  it('asks a player who owes a favour first, then the lowest level among those strong enough', () => {
    const owed = fight(1, (s) => {
      strong(s, 2, 6);
      strong(s, 3, 5);
      s.players[1]!.favours = [2];
    });
    expect(ai(owed, 1)).toEqual({ a: 'offer', to: 2, terms: { t: 'free' } });
    const lowest = fight(1, (s) => {
      strong(s, 0, 6);
      strong(s, 2, 5);
      strong(s, 3, 7);
    });
    expect(ai(lowest, 1)).toMatchObject({ a: 'offer', to: 2 });
    // Nobody is strong enough: no offer (the fighter passes or flees).
    expect(ai(fight(1), 1).a).not.toBe('offer');
  });

  it('chooses the terms by personality and situation', () => {
    const terms = (personality: Personality, patch: (s: CardQuestState) => void = () => undefined, difficulty: Difficulty = 'normal') =>
      (ai(
        fight(1, (s) => {
          s.players[1]!.personality = personality;
          strong(s, 2);
          patch(s);
        }),
        1,
        difficulty
      ) as { terms: Terms }).terms;
    expect(terms('showoff')).toEqual({ t: 'favour' });
    expect(terms('cautious')).toEqual({ t: 'loot', n: 2 });
    expect(terms('opportunist')).toEqual({ t: 'loot', n: 1 });
    expect(terms('grudge')).toEqual({ t: 'loot', n: 1 });
    // A fight that wins the game: "all but one", except on easy.
    // (Level 9 but cursed −6: still losing alone.)
    const nearlyWon = (s: CardQuestState) => Object.assign(s.players[1]!, { level: 9, malus: 6 });
    expect(terms('opportunist', nearlyWon)).toEqual({ t: 'most' });
    expect(terms('opportunist', nearlyWon, 'easy')).toEqual({ t: 'loot', n: 1 });
  });

  it('pays two cards to an opportunist only when there are at least three', () => {
    const s = fight(1, (s) => {
      s.players[1]!.personality = 'opportunist';
      strong(s, 2, 12);
    }, 'kz.collector-crow');
    expect(ai(s, 1)).toMatchObject({ terms: { t: 'loot', n: 2 } });
  });
});

describe('answering an offer', () => {
  const asked = (personality: Personality, terms: Terms, patch: (s: CardQuestState) => void = () => undefined) =>
    offerTo(
      fight(0, (s) => {
        s.players[1]!.personality = personality;
        strong(s, 1);
        take(s, 'kz.firecracker', s.players[0]!.hand);
        take(s, 'kz.cave-slime', s.players[0]!.hand);
        patch(s);
      }),
      1,
      terms
    );

  it('cautious players take one card, opportunists want two, a bad reputation costs one more', () => {
    expect(ai(asked('cautious', { t: 'loot', n: 1 }), 1)).toEqual({ a: 'accept' });
    expect(ai(asked('opportunist', { t: 'loot', n: 1 }), 1)).toEqual({ a: 'decline' });
    expect(ai(asked('opportunist', { t: 'loot', n: 2 }), 1)).toEqual({ a: 'accept' });
    expect(ai(asked('cautious', { t: 'loot', n: 1 }, (s) => (s.players[0]!.rep = 1)), 1)).toEqual({ a: 'decline' });
    expect(ai(asked('cautious', { t: 'loot', n: 2 }, (s) => (s.players[0]!.rep = 1)), 1)).toEqual({ a: 'accept' });
    expect(ai(asked('cautious', { t: 'favour' }), 1)).toEqual({ a: 'accept' });
  });

  it('refuses when its help would not suffice, and refuses a leader unless cautious', () => {
    expect(ai(asked('cautious', { t: 'loot', n: 2 }, (s) => (s.players[1]!.level = 1)), 1)).toEqual({ a: 'decline' });
    expect(ai(asked('showoff', { t: 'loot', n: 2 }, (s) => (s.players[0]!.level = 7)), 1)).toEqual({ a: 'decline' });
    expect(ai(asked('cautious', { t: 'loot', n: 2 }, (s) => (s.players[0]!.level = 7)), 1)).toEqual({ a: 'accept' });
  });

  it('an opportunist holding Change Sides gladly helps a leader (to switch later), but not on easy', () => {
    const plotting = (s: CardQuestState) => {
      s.players[0]!.level = 7;
      take(s, 'kz.change-sides#1', s.players[1]!.hand);
    };
    expect(ai(asked('opportunist', { t: 'loot', n: 1 }, plotting), 1)).toEqual({ a: 'accept' });
    // On easy nobody plots: an opportunist refuses a leader.
    expect(ai(asked('opportunist', { t: 'loot', n: 1 }, plotting), 1, 'easy')).toEqual({ a: 'decline' });
  });

  it('a card for staying out: a worthwhile one is taken, junk is not, and never when the fight wins the game', () => {
    expect(ai(asked('cautious', { t: 'stay', card: 'kz.firecracker' }), 1)).toEqual({ a: 'accept' });
    expect(ai(asked('cautious', { t: 'stay', card: 'kz.cave-slime' }), 1)).toEqual({ a: 'decline' });
    expect(ai(asked('cautious', { t: 'stay', card: 'kz.cave-slime' }), 1, 'easy')).toEqual({ a: 'accept' });
    expect(ai(asked('cautious', { t: 'stay', card: 'kz.firecracker' }, (s) => (s.players[0]!.level = 9)), 1)).toEqual({ a: 'decline' });
    // Items count by their bonus: a +1 item is not enough, a +2 item is (even one the computer could not wear).
    const item = (card: string) => asked('cautious', { t: 'stay', card }, (s) => take(s, card, s.players[0]!.hand));
    expect(ai(item('kz.pointy-hat'), 1)).toEqual({ a: 'decline' });
    expect(ai(item('kz.lamp-helmet'), 1)).toEqual({ a: 'accept' });
  });

  it('a favour owed is honoured, unless it hands the fighter the game (the cautious keep their word anyway)', () => {
    const called = (personality: Personality, level: number) => asked(personality, { t: 'free' }, (s) => {
      s.players[0]!.favours = [1];
      s.players[0]!.level = level;
    });
    expect(ai(called('opportunist', 3), 1)).toEqual({ a: 'accept' });
    expect(ai(called('opportunist', 9), 1)).toEqual({ a: 'decline' });
    expect(ai(called('cautious', 9), 1)).toEqual({ a: 'accept' });
    expect(ai(called('opportunist', 9), 1, 'easy')).toEqual({ a: 'accept' });
  });
});

describe('changing sides and paying back', () => {
  /** Seat 1 helps seat 0 for one loot card and holds Change Sides; now it is seat 1's turn in the window. */
  function helping(personality: Personality, fighterLevel: number): CardQuestState {
    const s = fight(0, (s) => {
      s.players[0]!.level = fighterLevel;
      s.players[1]!.personality = personality;
      strong(s, 1, 4);
      take(s, 'kz.change-sides#1', s.players[1]!.hand);
    });
    return step(step(offerTo(s, 1, { t: 'loot', n: 1 }), 1, { a: 'accept' })!, 0, { a: 'pass' })!;
  }

  it('an opportunist or grudge-holder switches when the fighter leads by two levels; a cautious helper does not', () => {
    expect(ai(helping('opportunist', 6), 1)).toEqual({ a: 'oneshot', card: 'kz.change-sides#1', side: 'monster' });
    expect(ai(helping('grudge', 6), 1)).toMatchObject({ a: 'oneshot' });
    expect(ai(helping('opportunist', 5), 1)).toEqual({ a: 'pass' });
    expect(ai(helping('cautious', 6), 1)).toEqual({ a: 'pass' });
  });

  it('a grudge-holder interferes with someone who harmed it, even when that one is no leader', () => {
    const s = fight(0, (s) => {
      s.players[0]!.level = 3;
      take(s, 'kz.pickaxe', s.players[0]!.equipped);
      take(s, 'kz.hard-hat', s.players[0]!.equipped);
      s.players[1]!.level = 4;
      s.players[1]!.personality = 'grudge';
      take(s, 'kz.furious-fence#1', s.players[1]!.hand);
    }, 'kz.cave-slime');
    const turn = step(s, 0, { a: 'pass' })!;
    expect(ai(turn, 1)).toEqual({ a: 'pass' });
    const harmed = { ...turn, players: turn.players.map((p, i) => (i === 1 ? { ...p, harm: [1, 0, 0, 0] } : p)) };
    expect(ai(harmed, 1)).toMatchObject({ a: 'boost', card: 'kz.furious-fence#1' });
  });

  it('a booster against the fighter counts as harm; one that weakens the monster does not', () => {
    const s = fight(0, (s) => {
      take(s, 'kz.furious-fence#1', s.players[1]!.hand);
      take(s, 'kz.lunch-break#1', s.players[2]!.hand);
    });
    const one = step(step(s, 0, { a: 'pass' })!, 1, { a: 'boost', card: 'kz.furious-fence#1', monster: 0 })!;
    expect(one.players[0]!.harm).toEqual([0, 1, 0, 0]);
    const two = step(step(one, 1, { a: 'pass' })!, 2, { a: 'boost', card: 'kz.lunch-break#1', monster: 0 });
    expect(two).not.toBeNull();
    expect(two!.players[0]!.harm).toEqual([0, 1, 0, 0]);
  });
});
