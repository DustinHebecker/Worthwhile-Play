import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { actorOf, FAVOUR_LIMIT, fightTotals, isValidState, legalActions, migrateState, observe, step, STATE_VERSION, type CardQuestState, type Terms } from '../src/rules';
import { decide } from '../src/ai';
import { arranged, take } from './harness';

/*
 * K2 (design § 5.6): offers with fixed terms, helping, paying to stay out, Change Sides, favours and reputation.
 * Seat 0 fights the Gold Rat (level 5, 2 loot cards) at level 1; seat 1 (level 4, Hard Hat: strength 6) could help.
 */
function ratFight(patch: (s: CardQuestState) => void = () => undefined): CardQuestState {
  const s = arranged((s) => {
    s.players[1]!.level = 4;
    take(s, 'kz.hard-hat', s.players[1]!.equipped);
    s.encounter.splice(s.encounter.indexOf('kz.gold-rat'), 1);
    s.encounter.push('kz.gold-rat');
    patch(s);
  });
  return step(s, 0, { a: 'open' })!;
}

const BOOSTER = 'kz.prize-size';
const offer = (s: CardQuestState, to: number, terms: Terms) => step(s, s.active, { a: 'offer', to, terms });
/** Everyone passes until the fight is decided. */
function passAll(s: CardQuestState): CardQuestState {
  let n = s;
  while (n.phase === 'fight') n = step(n, n.fight!.actor, { a: 'pass' })!;
  return n;
}

describe('offers and helping', () => {
  it('a help offer waits for its addressee; accepting adds the helper’s table strength', () => {
    const s = ratFight();
    expect(fightTotals(s)).toEqual({ hero: 1, monsters: 5 });
    const asked = offer(s, 1, { t: 'loot', n: 1 })!;
    expect(asked.fight!.actor).toBe(1);
    expect(legalActions(asked, 1)).toEqual([{ a: 'accept' }, { a: 'decline' }]);
    // Nothing else moves while the offer is open.
    expect(step(asked, 1, { a: 'pass' })).toBeNull();
    expect(step(asked, 0, { a: 'accept' })).toBeNull();
    expect(step(asked, 2, { a: 'accept' })).toBeNull();
    const helped = step(asked, 1, { a: 'accept' })!;
    expect(helped.fight).toMatchObject({ helper: 1, deal: { t: 'loot', n: 1 }, offer: null, actor: 0 });
    expect(fightTotals(helped).hero).toBe(1 + 6);
    expect(isValidState(helped)).toBe(true);
  });

  it('a won fight pays the helper and raises both reputations; the helper gets no level', () => {
    const helped = step(offer(ratFight(), 1, { t: 'loot', n: 1 })!, 1, { a: 'accept' })!;
    const before = helped.players.map((p) => p.hand.length);
    const done = passAll(helped);
    expect(done.players[0]!.level).toBe(2);
    expect(done.players[1]!.level).toBe(4);
    expect(done.players[1]!.hand.length - before[1]!).toBe(1);
    expect(done.players[0]!.hand.length - before[0]!).toBe(1);
    expect(done.players.slice(0, 2).map((p) => p.rep)).toEqual([4, 4]);
    expect(done.log.some((e) => e.e === 'kept' && e.seat === 1 && e.to === 0 && e.n === 1)).toBe(true);
    expect(isValidState(done)).toBe(true);
  });

  it('“all but one” leaves the fighter one loot card', () => {
    const done = passAll(step(offer(ratFight(), 1, { t: 'most' })!, 1, { a: 'accept' })!);
    expect(done.log.some((e) => e.e === 'kept' && e.n === 1)).toBe(true);
  });

  it('an item deal hands over the named equipped item (its upgrades are discarded)', () => {
    const s = ratFight((s) => take(s, 'kz.pickaxe', s.players[0]!.equipped));
    const done = passAll(step(offer(s, 1, { t: 'item', item: 'kz.pickaxe' })!, 1, { a: 'accept' })!);
    expect(done.players[0]!.equipped).not.toContain('kz.pickaxe');
    expect(done.players[1]!.hand).toContain('kz.pickaxe');
    expect(isValidState(done)).toBe(true);
    // Only equipped items can be promised.
    expect(offer(ratFight(), 1, { t: 'item', item: 'kz.shovel' })).toBeNull();
  });

  it('a declined offer returns the turn to the fighter, and nobody is asked twice in one fight', () => {
    const declined = step(offer(ratFight(), 1, { t: 'loot', n: 2 })!, 1, { a: 'decline' })!;
    expect(declined.fight).toMatchObject({ helper: null, offer: null, actor: 0, asked: [1] });
    expect(offer(declined, 1, { t: 'most' })).toBeNull();
    expect(offer(declined, 2, { t: 'most' })).not.toBeNull();
    expect(offer(declined, 0, { t: 'most' })).toBeNull();
  });

  it('only the fighter makes offers, one helper at most, and junk terms are refused', () => {
    const s = ratFight();
    expect(step(s, 1, { a: 'offer', to: 2, terms: { t: 'loot', n: 1 } })).toBeNull();
    expect(offer(s, 1, { t: 'loot', n: 3 } as never)).toBeNull();
    expect(offer(s, 1, { t: 'bribe' } as never)).toBeNull();
    expect(offer(s, 7, { t: 'loot', n: 1 })).toBeNull();
    const helped = step(offer(s, 1, { t: 'loot', n: 1 })!, 1, { a: 'accept' })!;
    expect(offer(helped, 2, { t: 'loot', n: 1 })).toBeNull();
  });

  it('a lost fight pays nothing and changes no reputation', () => {
    const s = ratFight((s) => {
      s.players[1]!.level = 1;
      s.lootDiscard.push(...s.players[1]!.equipped.splice(0));
    });
    const done = passAll(step(offer(s, 1, { t: 'loot', n: 1 })!, 1, { a: 'accept' })!);
    expect(done.phase).toBe('flee');
    expect(done.players.map((p) => p.rep)).toEqual([3, 3, 3]);
  });
});

describe('favours', () => {
  it('a favour deal is owed; calling it in costs nothing; refusing it breaks the word', () => {
    const done = passAll(step(offer(ratFight(), 1, { t: 'favour' })!, 1, { a: 'accept' })!);
    expect(done.players[1]!.favours).toEqual([0]);
    // Later seat 1 fights and calls the favour in from seat 0.
    const later = ratFight((s) => {
      s.players[0]!.favours = [1];
      s.players[1]!.level = 4;
    });
    expect(offer(later, 2, { t: 'free' })).toBeNull();
    const called = offer(later, 1, { t: 'free' })!;
    const honoured = passAll(step(called, 1, { a: 'accept' })!);
    expect(honoured.players[0]!.favours).toEqual([]);
    expect(honoured.players.slice(0, 2).map((p) => p.rep)).toEqual([4, 4]);
    const refused = step(called, 1, { a: 'decline' })!;
    expect(refused.players[0]!.favours).toEqual([]);
    expect(refused.players[1]!.rep).toBe(1);
    expect(refused.players[0]!.harm[1]).toBe(1);
    expect(refused.log.some((e) => e.e === 'broken' && e.why === 'favour')).toBe(true);
  });
});

describe('Change Sides', () => {
  const helpedWithCard = (holder: number) =>
    step(
      offer(
        ratFight((s) => take(s, 'kz.change-sides#1', s.players[holder]!.hand)),
        1,
        { t: 'loot', n: 2 }
      )!,
      1,
      { a: 'accept' }
    )!;

  it('the helper switches: its strength counts for the monsters, the deal is void, reputation −2', () => {
    const helped = helpedWithCard(1);
    expect(fightTotals(helped)).toEqual({ hero: 7, monsters: 5 });
    const helperTurn = step(helped, 0, { a: 'pass' })!;
    expect(helperTurn.fight!.actor).toBe(1);
    const switched = step(helperTurn, 1, { a: 'oneshot', card: 'kz.change-sides#1', side: 'monster' });
    expect(switched).not.toBeNull();
    expect(switched!.fight).toMatchObject({ helper: null, deal: null, turncoat: 1 });
    expect(fightTotals(switched!)).toEqual({ hero: 1, monsters: 5 + 6 });
    expect(switched!.players[1]!.rep).toBe(1);
    expect(switched!.players[0]!.harm[1]).toBe(1);
    expect(isValidState(switched)).toBe(true);
    // A turncoat cannot be asked again in this fight.
    const back = step(step(switched!, 1, { a: 'pass' })!, 2, { a: 'pass' })!;
    expect(back.fight!.actor).toBe(0);
    expect(offer(back, 1, { t: 'favour' })).toBeNull();
  });

  it('only the helper can play it, and only for the monsters', () => {
    const notHelper = step(step(helpedWithCard(2), 0, { a: 'pass' })!, 1, { a: 'pass' })!;
    expect(notHelper.fight!.actor).toBe(2);
    expect(step(notHelper, 2, { a: 'oneshot', card: 'kz.change-sides#1', side: 'monster' })).toBeNull();
    const helper = step(helpedWithCard(1), 0, { a: 'pass' })!;
    expect(step(helper, 1, { a: 'oneshot', card: 'kz.change-sides#1', side: 'hero' })).toBeNull();
  });
});

describe('paying to stay out', () => {
  it('the card changes hands at once; interfering anyway breaks the deal', () => {
    const s = ratFight((s) => {
      s.players[0]!.level = 6;
      take(s, 'kz.firecracker', s.players[0]!.hand);
      take(s, BOOSTER, s.players[2]!.hand);
    });
    const paid = step(offer(s, 2, { t: 'stay', card: 'kz.firecracker' })!, 2, { a: 'accept' })!;
    expect(paid.players[2]!.hand).toContain('kz.firecracker');
    expect(paid.players[0]!.hand).not.toContain('kz.firecracker');
    expect(paid.fight!.stayOut).toEqual([2]);
    expect(isValidState(paid)).toBe(true);
    const atTwo = step(step(paid, 0, { a: 'pass' })!, 1, { a: 'pass' })!;
    expect(atTwo.fight!.actor).toBe(2);
    const boosted = step(atTwo, 2, { a: 'boost', card: BOOSTER, monster: 0 })!;
    expect(boosted.players[2]!.rep).toBe(1);
    expect(boosted.fight!.stayOut).toEqual([]);
    expect(boosted.log.some((e) => e.e === 'broken' && e.why === 'stay' && e.seat === 2)).toBe(true);
  });
});

describe('reputation and saves', () => {
  it('reputation stays within 0–REP_MAX', () => {
    let s = ratFight((s) => {
      s.players[0]!.rep = 5;
      s.players[1]!.rep = 0;
    });
    s = passAll(step(offer(s, 1, { t: 'loot', n: 1 })!, 1, { a: 'accept' })!);
    expect(s.players.slice(0, 2).map((p) => p.rep)).toEqual([5, 1]);
  });

  it('reputation, favours and harm are public in the observation', () => {
    const s = ratFight((s) => {
      s.players[1]!.rep = 2;
      s.players[1]!.favours = [0];
    });
    const obs = observe(s, 2);
    expect(obs.players[1]).toMatchObject({ rep: 2, favours: [0] });
  });

  it('rejects inconsistent deal state in a save', () => {
    const helped = step(offer(ratFight(), 1, { t: 'loot', n: 1 })!, 1, { a: 'accept' })!;
    expect(isValidState({ ...helped, fight: { ...helped.fight!, helper: 0 } })).toBe(false);
    expect(isValidState({ ...helped, fight: { ...helped.fight!, deal: null } })).toBe(false);
    expect(isValidState({ ...helped, fight: { ...helped.fight!, asked: [] } })).toBe(false);
    expect(isValidState({ ...helped, players: helped.players.map((p, i) => (i === 1 ? { ...p, rep: 6 } : p)) })).toBe(false);
    expect(isValidState({ ...helped, players: helped.players.map((p, i) => (i === 1 ? { ...p, harm: [0] } : p)) })).toBe(false);
  });

  it('migrates a version-1 save: reputation 3, no favours, Change Sides shuffled into the loot pile', () => {
    const v2 = ratFight();
    const v1 = JSON.parse(JSON.stringify(v2)) as Record<string, unknown> & CardQuestState;
    v1.v = 1;
    for (const p of v1.players as unknown as Record<string, unknown>[]) {
      delete p.rep;
      delete p.favours;
      delete p.harm;
    }
    for (const k of ['helper', 'deal', 'offer', 'asked', 'stayOut', 'turncoat']) delete (v1.fight as unknown as Record<string, unknown>)[k];
    v1.loot = v1.loot.filter((c) => !c.startsWith('kz.change-sides'));
    expect(isValidState(v1)).toBe(false);
    const migrated = migrateState(v1, 1)!;
    expect(migrated.v).toBe(STATE_VERSION);
    expect(isValidState(migrated)).toBe(true);
    expect(migrated.players.map((p) => p.rep)).toEqual([3, 3, 3]);
    expect(migrated.loot.filter((c) => c.startsWith('kz.change-sides'))).toHaveLength(2);
    expect(migrated.rng).toBe(v2.rng);
    expect(migrateState({ junk: true }, 1)).toBeUndefined();
    expect(migrateState(v1, 7)).toBeUndefined();
  });
});

describe('computer players and deals', () => {
  const ai = (s: CardQuestState, seat: number, difficulty: 'easy' | 'normal' | 'sharp' = 'normal') => decide(observe(s, seat), difficulty);

  it('a losing computer fighter asks someone whose help suffices', () => {
    const own = arranged((x) => {
      x.active = 2;
      x.players[2]!.personality = 'opportunist';
      x.players[1]!.level = 4;
      take(x, 'kz.hard-hat', x.players[1]!.equipped);
      x.encounter.splice(x.encounter.indexOf('kz.gold-rat'), 1);
      x.encounter.push('kz.gold-rat');
    });
    const opened = step(own, 2, { a: 'open' })!;
    const action = ai(opened, 2);
    expect(action).toMatchObject({ a: 'offer', to: 1 });
    expect(step(opened, 2, action)).not.toBeNull();
  });

  it('answers: a card for staying out is taken; help that hands over the game is refused; a grudge refuses', () => {
    const stay = offer(ratFight((s) => take(s, 'kz.firecracker', s.players[0]!.hand)), 1, { t: 'stay', card: 'kz.firecracker' })!;
    expect(ai(stay, 1)).toEqual({ a: 'accept' });
    const winning = offer(ratFight((s) => (s.players[0]!.level = 9)), 1, { t: 'loot', n: 2 })!;
    expect(ai(winning, 1)).toEqual({ a: 'decline' });
    const fair = offer(ratFight((s) => (s.players[1]!.personality = 'cautious')), 1, { t: 'loot', n: 2 })!;
    expect(ai(fair, 1)).toEqual({ a: 'accept' });
    const grudge = offer(ratFight((s) => {
      s.players[1]!.personality = 'grudge';
      s.players[1]!.harm[0] = 2;
    }), 1, { t: 'loot', n: 2 })!;
    expect(ai(grudge, 1)).toEqual({ a: 'decline' });
  });

  it('a helper with Change Sides switches when the fighter would win the game (not on easy)', () => {
    const s = ratFight((s) => {
      s.players[0]!.level = 9;
      take(s, 'kz.change-sides#1', s.players[1]!.hand);
    });
    // Force the deal (the computer itself would not help a game-winning fight).
    const helped = step(offer(s, 1, { t: 'loot', n: 1 })!, 1, { a: 'accept' })!;
    const turn = step(helped, 0, { a: 'pass' })!;
    expect(ai(turn, 1, 'normal')).toEqual({ a: 'oneshot', card: 'kz.change-sides#1', side: 'monster' });
    expect(ai(turn, 1, 'easy')).toEqual({ a: 'pass' });
  });
});

describe('K2 review fixes', () => {
  it('an item deal whose item is cursed away during the fight stays a valid save and lapses without reputation change', () => {
    const s = ratFight((s) => {
      take(s, 'kz.pickaxe', s.players[0]!.equipped);
      take(s, 'kz.broken-pickaxe', s.players[2]!.hand);
    });
    let n = step(offer(s, 1, { t: 'item', item: 'kz.pickaxe' })!, 1, { a: 'accept' })!;
    n = step(step(n, 0, { a: 'pass' })!, 1, { a: 'pass' })!;
    const cursed = step(n, 2, { a: 'curse', card: 'kz.broken-pickaxe', target: 0 })!;
    expect(cursed.players[0]!.equipped).not.toContain('kz.pickaxe');
    expect(isValidState(cursed)).toBe(true);
    const done = passAll(cursed);
    expect(done.players.slice(0, 2).map((p) => p.rep)).toEqual([3, 3]);
    expect(done.log.some((e) => e.e === 'void' && e.seat === 1 && e.to === 0 && e.card === 'kz.pickaxe')).toBe(true);
    expect(done.log.some((e) => e.e === 'kept')).toBe(false);
    expect(isValidState(done)).toBe(true);
  });

  it('only one change of sides per fight', () => {
    const s = ratFight((s) => {
      take(s, 'kz.change-sides#1', s.players[1]!.hand);
      take(s, 'kz.change-sides#2', s.players[2]!.hand);
      s.players[2]!.level = 5;
    });
    let n = step(offer(s, 1, { t: 'loot', n: 1 })!, 1, { a: 'accept' })!;
    n = step(step(n, 0, { a: 'pass' })!, 1, { a: 'oneshot', card: 'kz.change-sides#1', side: 'monster' })!;
    n = step(step(n, 1, { a: 'pass' })!, 2, { a: 'pass' })!;
    expect(n.fight!.actor).toBe(0);
    n = step(offer(n, 2, { t: 'loot', n: 2 })!, 2, { a: 'accept' })!;
    n = step(n, 0, { a: 'pass' })!;
    n = step(n, 1, { a: 'pass' })!;
    expect(n.fight!.actor).toBe(2);
    expect(step(n, 2, { a: 'oneshot', card: 'kz.change-sides#2', side: 'monster' })).toBeNull();
  });

  it('rejects open offers a crafted save could not pay', () => {
    const stay = offer(ratFight((s) => take(s, 'kz.firecracker', s.players[0]!.hand)), 1, { t: 'stay', card: 'kz.firecracker' })!;
    expect(isValidState(stay)).toBe(true);
    expect(isValidState({ ...stay, players: stay.players.map((p, i) => (i === 0 ? { ...p, hand: p.hand.filter((c) => c !== 'kz.firecracker') } : i === 1 ? { ...p, hand: [...p.hand, 'kz.firecracker'] } : p)) })).toBe(false);
    const free = offer(ratFight((s) => (s.players[0]!.favours = [1])), 1, { t: 'free' })!;
    expect(isValidState(free)).toBe(true);
    expect(isValidState({ ...free, players: free.players.map((p, i) => (i === 0 ? { ...p, favours: [2] } : p)) })).toBe(false);
  });

  it('a player is owed at most FAVOUR_LIMIT favours; the oldest goes first', () => {
    const s = ratFight((s) => (s.players[1]!.favours = [2, 2, 2, 2, 2]));
    const done = passAll(step(offer(s, 1, { t: 'favour' })!, 1, { a: 'accept' })!);
    expect(done.players[1]!.favours).toEqual([2, 2, 2, 2, 0]);
    expect(FAVOUR_LIMIT).toBe(5);
  });
});

describe('version-1 saves written by the K1 code', () => {
  const saves = JSON.parse(readFileSync(join(__dirname, 'fixtures/v1-saves.json'), 'utf8')) as Record<string, unknown>;

  for (const [phase, save] of Object.entries(saves)) {
    it(`migrate and play on to the end (${phase})`, () => {
      expect(isValidState(save)).toBe(false);
      let s = migrateState(save, 1)!;
      expect(s, phase).toBeDefined();
      expect(isValidState(s)).toBe(true);
      expect(s.players.every((p) => p.rep === 3 && p.favours.length === 0)).toBe(true);
      if (s.phase !== 'setup') {
        const at = s.loot.flatMap((c, i) => (c.startsWith('kz.change-sides') ? [i] : []));
        expect(at).toHaveLength(2);
        expect(at[1]! - at[0]!).toBeGreaterThan(1);
      }
      if (s.phase === 'setup') s = step(s, 0, { a: 'start', settings: s.settings })!;
      for (let i = 0; i < 20_000 && s.phase !== 'over'; i++) {
        const seat = actorOf(s);
        s = step(s, seat, decide(observe(s, seat), s.settings.difficulty))!;
      }
      expect(s.phase).toBe('over');
      expect(isValidState(s)).toBe(true);
    });
  }
});

describe('saved reveal position', () => {
  it('accepts an absent or in-range revealed position and rejects anything else', () => {
    const s = ratFight();
    expect(isValidState({ ...s, revealed: undefined })).toBe(true);
    expect(isValidState({ ...s, revealed: 0 })).toBe(true);
    expect(isValidState({ ...s, revealed: s.logSeq })).toBe(true);
    for (const bad of [s.logSeq + 1, -1, 1.5, '3', null]) expect(isValidState({ ...s, revealed: bad as never }), String(bad)).toBe(false);
  });
});
