import { describe, expect, it } from 'vitest';
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
  type Settings
} from '../src/rules';
import { KAMPFZWERGE } from '../src/worlds/kampfzwerge';
import { defOf, worldDecks } from '../src/worlds';

const start = (seed: number, settings: Partial<Settings> = {}): CardQuestState => step(newGame(seed), 0, { a: 'start', settings: { ...DEFAULT_SETTINGS, ...settings } })!;

/** A state for focused rule tests: seat `active` on turn in `phase`, hands and table as given. */
function arranged(patch: (s: CardQuestState) => void, settings: Partial<Settings> = { opponents: 2 }): CardQuestState {
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
function take(s: CardQuestState, card: string, to: string[]): void {
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

const me = (s: CardQuestState): Player => s.players[0]!;

describe('Kampfzwerge content', () => {
  it('has 140 cards: 76 encounter and 64 loot in the designed composition', () => {
    const decks = worldDecks(['kz']);
    expect(decks.encounter).toHaveLength(76);
    expect(decks.loot).toHaveLength(64);
    const count = (type: string) => KAMPFZWERGE.cards.filter((c) => c.type === type).reduce((a, c) => a + (c.copies ?? 1), 0);
    expect(count('monster')).toBe(36);
    expect(count('booster')).toBe(10);
    expect(count('curse')).toBe(14);
    expect(count('origin') + count('profession')).toBe(10);
    expect(count('item')).toBe(34);
    expect(count('upgrade')).toBe(6);
    expect(count('oneshot')).toBe(14);
    expect(count('levelup')).toBe(6);
    expect(count('double')).toBe(4);
  });

  it('has unique ids and instance ids', () => {
    const ids = KAMPFZWERGE.cards.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    const instances = KAMPFZWERGE.cards.flatMap(instanceIds);
    expect(new Set(instances).size).toBe(140);
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
      const p: Player = { level: 1, hand: [], equipped: [...set.items], pack: [], upgrades: [], origins: [], professions: [], doubles: [], malus: 0, personality: null };
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

describe('validation', () => {
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
          s.players.forEach((p, i) => {
            if (i !== seat) for (const c of p.hand) expect(text.includes(`"${c}"`), `seat ${seat} sees ${c}`).toBe(false);
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
