import { describe, expect, it } from 'vitest';
import { createRngFromState } from '@wp/game-core';
import fc from 'fast-check';
import { BASE_KINDS, TRAITS, instanceIds, type MonsterCard } from '../src/cards';
import {
  DEFAULT_SETTINGS,
  FLEE_TARGET,
  HAND_LIMIT,
  START_CARDS,
  charityTarget,
  displacedBy,
  equipmentFits,
  fightTotals,
  isValidState,
  legalActions,
  newGame,
  observe,
  playerParts,
  step,
  sum,
  type Action,
  type CardQuestState,
  type Player,
} from '../src/rules';
import { KAMPFZWERGE } from '../src/worlds/kampfzwerge';
import { defOf, worldDecks } from '../src/worlds';
import { arranged, me, start, take } from './harness';


describe('Kampfzwerge content', () => {
  it('has 142 cards: 76 encounter and 66 loot in the designed composition (K2 added 2 Change Sides)', () => {
    const decks = worldDecks(['kz']);
    expect(decks.encounter).toHaveLength(76);
    expect(decks.loot).toHaveLength(66);
    const count = (type: string) => KAMPFZWERGE.cards.filter((c) => c.type === type).reduce((a, c) => a + (c.copies ?? 1), 0);
    expect(count('monster')).toBe(36);
    expect(count('booster')).toBe(10);
    expect(count('curse')).toBe(14);
    expect(count('origin') + count('profession')).toBe(10);
    expect(count('item')).toBe(34);
    expect(count('upgrade')).toBe(6);
    expect(count('oneshot')).toBe(16);
    expect(count('levelup')).toBe(6);
    expect(count('double')).toBe(4);
  });

  it('has unique ids and instance ids', () => {
    const ids = KAMPFZWERGE.cards.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const instances = KAMPFZWERGE.cards.flatMap(instanceIds);
    expect(new Set(instances).size).toBe(142);
  });

  it('uses at least 5 base kinds and 8 traits among monsters and refers to every base kind (prepared for other worlds)', () => {
    const monsters = KAMPFZWERGE.cards.filter((c): c is MonsterCard & { id: string } => c.type === 'monster');
    expect(new Set(monsters.map((m) => m.kind)).size).toBeGreaterThanOrEqual(5);
    expect(new Set(monsters.flatMap((m) => m.traits)).size).toBeGreaterThanOrEqual(8);
    const referenced = new Set<string>();
    for (const c of KAMPFZWERGE.cards) {
      const mods = 'mods' in c ? (c.mods ?? []) : [];
      for (const m of mods) if (m.when?.kind) referenced.add(m.when.kind);
      if (c.type === 'monster' || c.type === 'origin') referenced.add(c.kind);
    }
    for (const kind of BASE_KINDS) expect(referenced, kind).toContain(kind);
  });

  it('only uses traits and kinds of the shared vocabulary', () => {
    for (const c of KAMPFZWERGE.cards) {
      const traits = 'traits' in c ? (c.traits ?? []) : [];
      for (const t of traits) expect(TRAITS).toContain(t);
    }
  });

  it('every set lists existing items that can be worn together', () => {
    for (const set of KAMPFZWERGE.sets) {
      const p: Player = { level: 1, hand: [], equipped: [...set.items], pack: [], upgrades: [], origins: [], professions: [], doubles: [], malus: 0, personality: null, rep: 3, favours: [], harm: [0] };
      expect(equipmentFits(p), set.id).toBe(true);
      expect(playerParts(p).some((x) => x.source === `set:${set.id}`)).toBe(true);
    }
  });
});

describe('setup and dealing', () => {
  it('starts on the setup screen and deals 4 + 4 cards per player on start', () => {
    const setup = newGame(5);
    expect(setup.phase).toBe('setup');
    expect(isValidState(setup)).toBe(true);
    const s = start(5, { opponents: 5 });
    expect(s.players).toHaveLength(6);
    for (const p of s.players) expect(p.hand).toHaveLength(2 * START_CARDS);
    expect(s.players[0]!.personality).toBeNull();
    expect(s.players.slice(1).every((p) => p.personality !== null)).toBe(true);
    expect(isValidState(s)).toBe(true);
  });

  it('rejects invalid settings', () => {
    expect(step(newGame(1), 0, { a: 'start', settings: { ...DEFAULT_SETTINGS, opponents: 6 } })).toBeNull();
    expect(step(newGame(1), 0, { a: 'start', settings: { ...DEFAULT_SETTINGS, target: 7 as never } })).toBeNull();
  });

  it('is deterministic for a seed', () => {
    expect(start(77)).toEqual(start(77));
    expect(start(77)).not.toEqual(start(78));
  });
});

describe('fights', () => {
  it('wins when strictly stronger: levels and loot', () => {
    const s = arranged((s) => {
      s.encounter.splice(s.encounter.indexOf('kz.pebble-golem'), 1);
      s.encounter.push('kz.pebble-golem');
      me(s).level = 3;
    });
    let n = step(s, 0, { a: 'open' })!;
    expect(n.phase).toBe('fight');
    expect(fightTotals(n)).toEqual({ hero: 3, monsters: 1 });
    for (let i = 0; i < 3; i++) n = step(n, n.fight!.actor, { a: 'pass' })!;
    expect(n.phase).toBe('end');
    expect(me(n).level).toBe(4);
    expect(me(n).hand).toHaveLength(1);
    expect(isValidState(n)).toBe(true);
  });

  it('ties go to the monster and lead to fleeing', () => {
    const s = arranged((s) => {
      s.encounter.splice(s.encounter.indexOf('kz.dust-bunny'), 1);
      s.encounter.push('kz.dust-bunny');
      me(s).level = 2;
    });
    let n = step(s, 0, { a: 'open' })!;
    for (let i = 0; i < 3; i++) n = step(n, n.fight!.actor, { a: 'pass' })!;
    expect(n.phase).toBe('flee');
    n = step(n, 0, { a: 'roll' })!;
    expect(n.phase).toBe('end');
    const flee = n.log.find((e) => e.e === 'flee');
    expect(flee && flee.e === 'flee' && flee.ok === flee.total >= FLEE_TARGET).toBe(true);
  });

  it('the window closes only after every player passed in a row; a played card resets it', () => {
    const s = arranged((s) => {
      s.encounter.splice(s.encounter.indexOf('kz.pebble-golem'), 1);
      s.encounter.push('kz.pebble-golem');
      me(s).level = 5;
      take(s, 'kz.furious-fence#1', s.players[1]!.hand);
    });
    let n = step(s, 0, { a: 'open' })!;
    n = step(n, 0, { a: 'pass' })!;
    expect(n.fight!.actor).toBe(1);
    n = step(n, 1, { a: 'boost', card: 'kz.furious-fence#1', monster: 0 })!;
    expect(n.fight!.passes).toBe(0);
    expect(fightTotals(n).monsters).toBe(6);
    n = step(n, 1, { a: 'pass' })!;
    n = step(n, 2, { a: 'pass' })!;
    expect(n.phase).toBe('fight');
    n = step(n, 0, { a: 'pass' })!;
    expect(n.phase).toBe('flee');
  });

  it('only the actor may act in a window', () => {
    const s = arranged((s) => {
      s.encounter.splice(s.encounter.indexOf('kz.pebble-golem'), 1);
      s.encounter.push('kz.pebble-golem');
    });
    const n = step(s, 0, { a: 'open' })!;
    expect(step(n, 1, { a: 'pass' })).toBeNull();
  });

  it('kind and trait bonuses apply against matching monsters (Garden Hose vs fiery)', () => {
    const s = arranged((s) => {
      take(s, 'kz.garden-hose', me(s).equipped);
      s.encounter.splice(s.encounter.indexOf('kz.steam-drill'), 1);
      s.encounter.push('kz.steam-drill');
    });
    expect(sum(playerParts(me(s)))).toBe(1 + 3);
    const n = step(s, 0, { a: 'open' })!;
    expect(fightTotals(n).hero).toBe(1 + 3 + 3);
  });

  it('monster bonuses hit players by origin family and missing traits (Lawnmower vs beardless)', () => {
    const s = arranged((s) => {
      s.encounter.splice(s.encounter.indexOf('kz.lawnmower'), 1);
      s.encounter.push('kz.lawnmower');
    });
    expect(fightTotals(step(s, 0, { a: 'open' })!).monsters).toBe(14);
    const bearded = arranged((s) => {
      take(s, 'kz.fake-beard', me(s).equipped);
      s.encounter.splice(s.encounter.indexOf('kz.lawnmower'), 1);
      s.encounter.push('kz.lawnmower');
    });
    expect(fightTotals(step(bearded, 0, { a: 'open' })!).monsters).toBe(10);
  });

  it('an escape one-shot ends the own fight without loot or Blunder', () => {
    const s = arranged((s) => {
      take(s, 'kz.side-tunnel#1', me(s).hand);
      s.encounter.splice(s.encounter.indexOf('kz.shed-thing'), 1);
      s.encounter.push('kz.shed-thing');
    });
    let n = step(s, 0, { a: 'open' })!;
    n = step(n, 0, { a: 'oneshot', card: 'kz.side-tunnel#1', side: 'hero' })!;
    expect(n.phase).toBe('end');
    expect(me(n).level).toBe(1);
    expect(n.encounterDiscard).toContain('kz.shed-thing');
  });

  it('reinforcements add a monster from the hand', () => {
    const s = arranged((s) => {
      me(s).level = 9;
      s.encounter.splice(s.encounter.indexOf('kz.pebble-golem'), 1);
      s.encounter.push('kz.pebble-golem');
      take(s, 'kz.come-in-pairs#1', s.players[1]!.hand);
      take(s, 'kz.cave-slime', s.players[1]!.hand);
    });
    let n = step(s, 0, { a: 'open' })!;
    n = step(n, 0, { a: 'pass' })!;
    n = step(n, 1, { a: 'reinforce', card: 'kz.come-in-pairs#1', monster: 'kz.cave-slime' })!;
    expect(n.fight!.monsters).toHaveLength(2);
    expect(fightTotals(n).monsters).toBe(3);
  });

  it('the winning level only comes from a fight', () => {
    const s = arranged((s) => {
      me(s).level = 9;
      take(s, 'kz.senior-gnome#1', me(s).hand);
    }, { opponents: 1, target: 10 });
    expect(step(s, 0, { a: 'play', card: 'kz.senior-gnome#1' })).toBeNull();
  });
});

describe('equipment, selling, curses, end of turn', () => {
  it('equipping a two-handed item moves both one-handed items to the pack', () => {
    const s = arranged((s) => {
      take(s, 'kz.pickaxe', me(s).equipped);
      take(s, 'kz.shovel', me(s).equipped);
      take(s, 'kz.garden-hose', me(s).hand);
    });
    expect(displacedBy(me(s), 'kz.garden-hose')).toEqual(['kz.pickaxe', 'kz.shovel']);
    const n = step(s, 0, { a: 'equip', card: 'kz.garden-hose' })!;
    expect(me(n).equipped).toEqual(['kz.garden-hose']);
    expect(me(n).pack).toEqual(['kz.pickaxe', 'kz.shovel']);
    expect(isValidState(n)).toBe(true);
  });

  it('sells 10 value points for one level, never to the winning level', () => {
    const s = arranged((s) => {
      take(s, 'kz.gold-nugget', me(s).hand);
      take(s, 'kz.allotment-map', me(s).hand);
    });
    const n = step(s, 0, { a: 'sell', cards: ['kz.gold-nugget', 'kz.allotment-map'] })!;
    expect(me(n).level).toBe(2);
    expect(step(s, 0, { a: 'sell', cards: ['kz.gold-nugget'] })).toBeNull();
  });

  it('curses hit another player immediately', () => {
    const s = arranged((s) => {
      take(s, 'kz.wrong-hat', me(s).hand);
      take(s, 'kz.hard-hat', s.players[1]!.equipped);
    });
    const n = step(s, 0, { a: 'curse', card: 'kz.wrong-hat', target: 1 })!;
    expect(n.players[1]!.equipped).toEqual([]);
    expect(step(s, 0, { a: 'curse', card: 'kz.wrong-hat', target: 0 })).toBeNull();
  });

  it('surplus cards go to the lowest-level other player', () => {
    const s = arranged((s) => {
      me(s).level = 3;
      s.players[2]!.level = 2;
      for (let i = 0; i < HAND_LIMIT + 2; i++) me(s).hand.push(s.loot.pop()!);
      s.phase = 'end';
    });
    expect(charityTarget(s)).toBe(1);
    const give = me(s).hand.slice(0, 2);
    expect(step(s, 0, { a: 'end', give: give.slice(0, 1) })).toBeNull();
    const n = step(s, 0, { a: 'end', give })!;
    expect(n.players[1]!.hand).toEqual(give);
    expect(n.active).toBe(1);
  });

  it('an optional round limit ends the game with the highest level', () => {
    const s = arranged((s) => {
      s.round = 20;
      s.active = 2;
      s.starter = 0;
      s.phase = 'end';
      s.players[1]!.level = 4;
    }, { opponents: 2, roundLimit: 20 });
    const n = step(s, 2, { a: 'end', give: [] })!;
    expect(n.phase).toBe('over');
    expect(n.winners).toEqual([1]);
    expect(isValidState(n)).toBe(true);
  });
});

describe('penalties and boundaries', () => {
  it('a hand-card penalty discards exactly n cards from the hand', () => {
    const s = arranged((s) => {
      for (let i = 0; i < 4; i++) s.players[1]!.hand.push(s.loot.pop()!);
      take(s, 'kz.neighbour-complaint', me(s).hand);
    });
    const n = step(s, 0, { a: 'curse', card: 'kz.neighbour-complaint', target: 1 })!;
    expect(n.players[1]!.hand).toHaveLength(2);
    expect(n.lootDiscard).toHaveLength(2);
    expect(isValidState(n)).toBe(true);
  });

  it('a slot penalty takes only the item of that slot; a best-item penalty takes the strongest anywhere', () => {
    const s = arranged((s) => {
      take(s, 'kz.flowerpot-helmet', s.players[1]!.equipped);
      take(s, 'kz.wheelbarrow-ram', s.players[1]!.equipped);
      take(s, 'kz.wrong-hat', me(s).hand);
      take(s, 'kz.fence-dispute', me(s).hand);
    });
    const hat = step(s, 0, { a: 'curse', card: 'kz.wrong-hat', target: 1 })!;
    expect(hat.players[1]!.equipped).toEqual(['kz.wheelbarrow-ram']);
    const best = step(s, 0, { a: 'curse', card: 'kz.fence-dispute', target: 1 })!;
    expect(best.players[1]!.equipped).toEqual(['kz.flowerpot-helmet']);
  });

  it('the round limit ends the game only after the last round', () => {
    const at = (round: number) =>
      arranged((s) => {
        s.round = round;
        s.active = 2;
        s.starter = 0;
        s.phase = 'end';
      }, { opponents: 2, roundLimit: 20 });
    expect(step(at(19), 2, { a: 'end', give: [] })!.phase).toBe('prepare');
    expect(step(at(20), 2, { a: 'end', give: [] })!.phase).toBe('over');
  });

  it('surplus goes to the first lowest player after the active one on ties', () => {
    const s = arranged((s) => {
      me(s).level = 3;
      s.players[1]!.level = 2;
      s.players[2]!.level = 2;
    });
    expect(charityTarget(s)).toBe(1);
    s.active = 1;
    s.players[1]!.level = 3;
    expect(charityTarget(s)).toBe(2);
    s.players[0]!.level = 2;
    expect(charityTarget(s)).toBe(2);
  });

  it('only boosters boost and flee one-shots only help the fighter', () => {
    const s = arranged((s) => {
      s.encounter.splice(s.encounter.indexOf('kz.pebble-golem'), 1);
      s.encounter.push('kz.pebble-golem');
      take(s, 'kz.firecracker', me(s).hand);
      take(s, 'kz.shiny-distraction#1', me(s).hand);
    });
    const n = step(s, 0, { a: 'open' })!;
    expect(step(n, 0, { a: 'boost', card: 'kz.firecracker', monster: 0 })).toBeNull();
    expect(step(n, 0, { a: 'oneshot', card: 'kz.shiny-distraction#1', side: 'monster' })).toBeNull();
    expect(step(n, 0, { a: 'oneshot', card: 'kz.shiny-distraction#1', side: 'hero' })!.fight!.flee).toBe(3);
  });

  it('a monster without escape applies its Blunder on the roll', () => {
    const s = arranged((s) => {
      me(s).level = 3;
      s.encounter.splice(s.encounter.indexOf('kz.last-shift-ghost'), 1);
      s.encounter.push('kz.last-shift-ghost');
    });
    let n = step(s, 0, { a: 'open' })!;
    for (let i = 0; i < 3; i++) n = step(n, n.fight!.actor, { a: 'pass' })!;
    n = step(n, 0, { a: 'roll' })!;
    expect(me(n).level).toBe(2);
    expect(n.log.some((e) => e.e === 'flee' && !e.ok)).toBe(true);
  });
});

/** A generator state whose next die roll (1–6) is `roll`. */
const stateRolling = (roll: number): number => {
  for (let st = 1; ; st++) if (createRngFromState(st).int(1, 6) === roll) return st;
};

/** The person lost against the Dust Bunny (level 2 vs level 2) and must roll; their table and hand are known. */
function lostAgainstBunny(): CardQuestState {
  const s = arranged((s) => {
    me(s).level = 2;
    take(s, 'kz.firecracker', me(s).hand);
    s.encounter.splice(s.encounter.indexOf('kz.dust-bunny'), 1);
    s.encounter.push('kz.dust-bunny');
  });
  let n = step(s, 0, { a: 'open' })!;
  for (let i = 0; i < 3; i++) n = step(n, n.fight!.actor, { a: 'pass' })!;
  expect(n.phase).toBe('flee');
  return n;
}

describe('fleeing', () => {
  it('a high roll escapes without the Blunder', () => {
    const n = lostAgainstBunny();
    n.rng = stateRolling(6);
    const after = step(n, 0, { a: 'roll' })!;
    const flee = after.log.find((e) => e.e === 'flee');
    expect(flee).toMatchObject({ e: 'flee', roll: 6, total: 6, ok: true });
    expect(me(after).hand).toEqual(['kz.firecracker']);
    expect(me(after).level).toBe(2);
    expect(after.log.some((e) => e.e === 'penalty')).toBe(false);
    expect(after.phase).toBe('end');
  });

  it('a low roll is caught and takes the Blunder', () => {
    const n = lostAgainstBunny();
    n.rng = stateRolling(1);
    const after = step(n, 0, { a: 'roll' })!;
    expect(after.log.find((e) => e.e === 'flee')).toMatchObject({ roll: 1, ok: false });
    expect(me(after).hand).toEqual([]);
    expect(after.log.some((e) => e.e === 'penalty' && e.p === 'cards')).toBe(true);
  });

  it('flee bonuses count: a roll of 3 escapes with +2 from items', () => {
    const n = lostAgainstBunny();
    take(n, 'kz.allotment-map', me(n).equipped);
    n.rng = stateRolling(3);
    const after = step(n, 0, { a: 'roll' })!;
    expect(after.log.find((e) => e.e === 'flee')).toMatchObject({ roll: 3, total: 5, ok: true });
  });

  it('only the fighter rolls, and only while fleeing', () => {
    const n = lostAgainstBunny();
    expect(step(n, 1, { a: 'roll' })).toBeNull();
    const calm = arranged(() => undefined);
    expect(step(calm, 0, { a: 'roll' })).toBeNull();
  });
});

describe('illegal actions are refused', () => {
  const fight = () =>
    step(
      arranged((s) => {
        me(s).level = 9;
        s.encounter.splice(s.encounter.indexOf('kz.pebble-golem'), 1);
        s.encounter.push('kz.pebble-golem');
        take(s, 'kz.come-in-pairs#1', me(s).hand);
        take(s, 'kz.cave-slime', me(s).hand);
        take(s, 'kz.firecracker', me(s).hand);
        take(s, 'kz.side-tunnel#1', s.players[1]!.hand);
        take(s, 'kz.pickaxe', s.players[1]!.hand);
      }),
      0,
      { a: 'open' }
    )!;

  it('reinforce needs a reinforcement card and a monster, both in the hand', () => {
    const n = fight();
    expect(step(n, 0, { a: 'reinforce', card: 'kz.firecracker', monster: 'kz.cave-slime' })).toBeNull();
    expect(step(n, 0, { a: 'reinforce', card: 'kz.come-in-pairs#1', monster: 'kz.firecracker' })).toBeNull();
    expect(step(n, 0, { a: 'reinforce', card: 'kz.come-in-pairs#1', monster: 'kz.lawnmower' })).toBeNull();
    expect(step(n, 0, { a: 'reinforce', card: 'kz.come-in-pairs#1', monster: 'kz.cave-slime' })).not.toBeNull();
  });

  it('one-shots must be one-shots in the hand; escaping is only for the fighter', () => {
    const n = fight();
    expect(step(n, 0, { a: 'oneshot', card: 'kz.cave-slime', side: 'hero' })).toBeNull();
    expect(step(n, 0, { a: 'oneshot', card: 'kz.mine-gas', side: 'hero' })).toBeNull();
    const other = step(n, 0, { a: 'pass' })!;
    expect(step(other, 1, { a: 'oneshot', card: 'kz.side-tunnel#1', side: 'hero' })).toBeNull();
    expect(step(other, 1, { a: 'oneshot', card: 'kz.pickaxe', side: 'monster' })).toBeNull();
  });

  it('ending the turn only in the end phase, giving cards from the own hand only', () => {
    expect(step(fight(), 0, { a: 'end', give: [] })).toBeNull();
    const s = arranged((s) => {
      for (let i = 0; i < 6; i++) me(s).hand.push(s.loot.pop()!);
      s.phase = 'end';
    });
    expect(step(s, 0, { a: 'end', give: [s.loot[0]!] })).toBeNull();
    expect(step(s, 0, { a: 'end', give: [me(s).hand[0]!, me(s).hand[0]!] })).toBeNull();
    expect(step(s, 1, { a: 'end', give: [me(s).hand[0]!] })).toBeNull();
    expect(step(s, 0, { a: 'end', give: [me(s).hand[0]!] })).not.toBeNull();
  });
});

describe('validation', () => {
  it('rejects a fight whose flee rolls are complete (it could not continue)', () => {
    const s = arranged((s) => {
      s.encounter.splice(s.encounter.indexOf('kz.dust-bunny'), 1);
      s.encounter.push('kz.dust-bunny');
    });
    let n = step(s, 0, { a: 'open' })!;
    for (let i = 0; i < 3; i++) n = step(n, n.fight!.actor, { a: 'pass' })!;
    expect(n.phase).toBe('flee');
    expect(isValidState(n)).toBe(true);
    const done = structuredClone(n);
    done.fight!.rolls = [3];
    expect(isValidState(done)).toBe(false);
    const fight = structuredClone(n);
    fight.phase = 'fight';
    fight.fight!.rolls = [3];
    expect(isValidState(fight)).toBe(false);
  });

  it('rejects crafted wins, duplicated winners and cards in the wrong pile', () => {
    const s = start(3, { opponents: 2 });
    const win = structuredClone(s);
    win.phase = 'over';
    win.players[0]!.level = win.settings.target;
    win.winners = [0];
    expect(isValidState(win)).toBe(false);
    win.log.push({ e: 'win', seats: [0] });
    win.logSeq++;
    expect(isValidState(win)).toBe(true);
    const twice = structuredClone(win);
    twice.winners = [0, 0];
    expect(isValidState(twice)).toBe(false);
    const pile = structuredClone(s);
    pile.loot.push(pile.encounter.pop()!);
    expect(isValidState(pile)).toBe(false);
  });

  it('rejects broken card conservation, unknown cards and fake wins', () => {
    const s = start(3);
    const dup = structuredClone(s);
    dup.players[0]!.hand.push(dup.players[1]!.hand[0]!);
    expect(isValidState(dup)).toBe(false);
    const unknown = structuredClone(s);
    unknown.players[0]!.hand[0] = 'kz.nope';
    expect(isValidState(unknown)).toBe(false);
    const fake = structuredClone(s);
    fake.phase = 'over';
    fake.winners = [0];
    expect(isValidState(fake)).toBe(false);
    const overLevel = structuredClone(s);
    overLevel.players[0]!.level = 99;
    expect(isValidState(overLevel)).toBe(false);
  });

  it('never throws on mutated saves', () => {
    const base = start(9);
    fc.assert(
      fc.property(fc.array(fc.tuple(fc.constantFrom('players', 'fight', 'log', 'settings', 'phase', 'encounter', 'active', 'hints'), fc.anything()), { maxLength: 3 }), (edits) => {
        const s = structuredClone(base) as unknown as Record<string, unknown>;
        for (const [k, v] of edits) s[k] = v;
        expect(() => isValidState(s)).not.toThrow();
      }),
      { numRuns: 300 }
    );
  });
});

describe('properties over random legal play', () => {
  const walk = (seed: number, picks: number[], opponents: number) => {
    let s = start(seed, { opponents });
    const states = [s];
    for (const p of picks) {
      if (s.phase === 'over') break;
      const actor = s.phase === 'fight' ? s.fight!.actor : s.active;
      const legal: Action[] = legalActions(s, actor);
      const action = legal[p % legal.length]!;
      const next = step(s, actor, action);
      expect(next, JSON.stringify(action)).not.toBeNull();
      s = next!;
      states.push(s);
    }
    return states;
  };

  it('every reachable state is valid (card conservation, slots, phases)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 ** 31 }), fc.array(fc.nat(), { minLength: 50, maxLength: 200 }), fc.integer({ min: 1, max: 5 }), (seed, picks, opp) => {
        for (const s of walk(seed, picks, opp)) expect(isValidState(s)).toBe(true);
      }),
      { numRuns: 25 }
    );
  });

  it('is deterministic: the same seed and actions give the same state', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 ** 31 }), fc.array(fc.nat(), { minLength: 20, maxLength: 120 }), (seed, picks) => {
        expect(walk(seed, picks, 3).at(-1)).toEqual(walk(seed, picks, 3).at(-1));
      }),
      { numRuns: 20 }
    );
  });

  it('an observation never contains other hands or the order of the piles', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2 ** 31 }), fc.array(fc.nat(), { minLength: 20, maxLength: 120 }), (seed, picks) => {
        const s = walk(seed, picks, 3).at(-1)!;
        for (let seat = 0; seat < s.players.length; seat++) {
          const text = JSON.stringify(observe(s, seat));
          // A card offered to stay out is shown to everyone while the offer is open (design § 5.6).
          const offered = s.fight?.offer?.terms.t === 'stay' ? s.fight.offer.terms.card : null;
          s.players.forEach((p, i) => {
            if (i !== seat) for (const c of p.hand) if (c !== offered) expect(text.includes(`"${c}"`), `seat ${seat} sees ${c}`).toBe(false);
          });
          for (const c of [...s.encounter, ...s.loot]) expect(text.includes(`"${c}"`)).toBe(false);
        }
      }),
      { numRuns: 20 }
    );
  });

  it('kinds of all piles stay in their pile type', () => {
    const s = start(4);
    for (const c of s.encounter) expect(['monster', 'booster', 'reinforcement', 'windfall', 'curse', 'origin', 'profession']).toContain(defOf(c).type);
    for (const c of s.loot) expect(['item', 'upgrade', 'oneshot', 'levelup', 'double']).toContain(defOf(c).type);
  });
});
