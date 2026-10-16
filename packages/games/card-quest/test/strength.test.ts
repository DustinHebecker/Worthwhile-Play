import { describe, expect, it } from 'vitest';
import {
  displacedBy,
  fightTotals,
  fleeBonus,
  heroParts,
  holds,
  monsterLoot,
  monsterStrength,
  monsterSubject,
  playerParts,
  playerSubject,
  step,
  type CardQuestState,
  type Player,
  type Subject
} from '../src/rules';
import { arranged, me, take } from './harness';

const player = (patch: Partial<Player> = {}): Player => ({
  level: 1,
  hand: [],
  equipped: [],
  pack: [],
  upgrades: [],
  origins: [],
  professions: [],
  doubles: [],
  malus: 0,
  personality: null,
  ...patch
});

const subject = (kinds: string[], traits: string[], families: string[] = []): Subject =>
  ({ kinds: new Set(kinds), traits: new Set(traits), families: new Set(families) }) as Subject;

const sorted = <T>(set: Set<T>) => [...set].sort();

describe('conditions', () => {
  const s = subject(['digger'], ['bearded', 'loud'], ['fairytale']);
  it.each([
    [undefined, true],
    [{}, true],
    [{ kind: 'digger' }, true],
    [{ kind: 'goo' }, false],
    [{ trait: 'loud' }, true],
    [{ trait: 'wet' }, false],
    [{ family: 'fairytale' }, true],
    [{ family: 'garden' }, false],
    [{ lacks: 'bearded' }, false],
    [{ lacks: 'wet' }, true],
    [{ kind: 'digger', trait: 'wet' }, false],
    [{ kind: 'digger', family: 'fairytale', lacks: 'shiny' }, true]
  ] as const)('%j → %s', (cond, expected) => {
    expect(holds(cond as never, s)).toBe(expected);
  });
});

describe('subjects', () => {
  it('a player without an origin counts as a Bigmouth with no family', () => {
    const sub = playerSubject(player());
    expect(sorted(sub.kinds)).toEqual(['bigmouth']);
    expect(sub.families.size).toBe(0);
    expect(sub.traits.size).toBe(0);
  });

  it('origins give kinds, families and traits; equipped items and their upgrades add traits', () => {
    const sub = playerSubject(
      player({
        origins: ['kz.mine-dwarf', 'kz.ceramic-gnome'],
        equipped: ['kz.garden-hose'],
        pack: ['kz.hard-hat'],
        upgrades: [
          { item: 'kz.garden-hose', card: 'kz.turbo-attachment' },
          { item: 'kz.hard-hat', card: 'kz.lucky-rune' }
        ]
      })
    );
    expect(sorted(sub.kinds)).toEqual(['digger', 'figurine']);
    expect(sorted(sub.families)).toEqual(['fairytale', 'garden']);
    // hard hat (armoured) and its rune (ancient) are only carried: they do not count.
    expect(sorted(sub.traits)).toEqual(['bearded', 'loud', 'shiny', 'wet']);
  });

  it('monsters give their kinds and traits plus the traits of their boosters', () => {
    const sub = monsterSubject([
      { card: 'kz.cave-slime', boosters: ['kz.prize-size'] },
      { card: 'kz.lawnmower', boosters: [] }
    ]);
    expect(sorted(sub.kinds)).toEqual(['goo', 'machine']);
    expect(sorted(sub.traits)).toEqual(['huge', 'loud', 'sticky', 'wet']);
  });
});

describe('strength parts', () => {
  it('lists level, items (with mods, wearer bonuses and upgrades), origin, profession and sets exactly', () => {
    const p = player({
      level: 3,
      origins: ['kz.ceramic-gnome'],
      professions: ['kz.lawn-sentinel'],
      equipped: ['kz.garden-hose', 'kz.pointy-hat', 'kz.garden-clogs'],
      upgrades: [
        { item: 'kz.garden-hose', card: 'kz.taped-up#1' },
        { item: 'kz.garden-hose', card: 'kz.freshly-polished#1' }
      ]
    });
    // Against the Steam Drill (machine, fiery).
    expect(playerParts(p, [{ card: 'kz.steam-drill', boosters: [] }])).toEqual([
      { source: 'level', value: 3 },
      { source: 'kz.garden-hose', value: 3 + 3 + 2 + 1 },
      { source: 'kz.pointy-hat', value: 1 + 2 },
      { source: 'kz.garden-clogs', value: 1 },
      { source: 'kz.ceramic-gnome', value: 2 },
      { source: 'kz.lawn-sentinel', value: 1 }
    ]);
    // Without a fight the monster bonuses are gone; with the full gnome outfit the set counts.
    const outfit = player({ equipped: ['kz.pointy-hat', 'kz.garden-clogs', 'kz.garden-shears'], professions: ['kz.beard-barber'] });
    expect(playerParts(outfit)).toEqual([
      { source: 'level', value: 1 },
      { source: 'kz.pointy-hat', value: 1 },
      { source: 'kz.garden-clogs', value: 1 },
      { source: 'kz.garden-shears', value: 2 },
      { source: 'kz.beard-barber', value: 2 },
      { source: 'set:gnome-outfit', value: 3 }
    ]);
  });

  it('origins and professions without a bonus in this fight are not listed', () => {
    const p = player({ origins: ['kz.plastic-gnome'], professions: ['kz.night-watch'] });
    expect(playerParts(p, [{ card: 'kz.cave-slime', boosters: [] }])).toEqual([{ source: 'level', value: 1 }]);
    expect(playerParts(p, [{ card: 'kz.dust-bunny', boosters: [] }])).toEqual([
      { source: 'level', value: 1 },
      { source: 'kz.night-watch', value: 3 }
    ]);
  });

  it('only a complete set counts', () => {
    expect(playerParts(player({ equipped: ['kz.pickaxe', 'kz.lamp-helmet'] })).some((p) => p.source.startsWith('set:'))).toBe(false);
  });
});

function fightWith(patch: (s: CardQuestState) => void, monster = 'kz.lawnmower'): CardQuestState {
  const s = arranged((s) => {
    s.encounter.splice(s.encounter.indexOf(monster), 1);
    s.encounter.push(monster);
    patch(s);
  });
  return step(s, 0, { a: 'open' })!;
}

describe('fight strength', () => {
  it('the fighter adds own one-shots and loses the curse malus; the monsters add theirs', () => {
    const s = fightWith((s) => {
      me(s).level = 4;
      me(s).malus = 2;
      take(s, 'kz.firecracker', me(s).hand);
      take(s, 'kz.mine-gas', s.players[1]!.hand);
    });
    let n = step(s, 0, { a: 'oneshot', card: 'kz.firecracker', side: 'hero' })!;
    n = step(n, 0, { a: 'pass' })!;
    n = step(n, 1, { a: 'oneshot', card: 'kz.mine-gas', side: 'monster' })!;
    expect(heroParts(n)).toEqual([
      { source: 'level', value: 4 },
      { source: 'kz.firecracker', value: 4 },
      { source: 'malus', value: -2 }
    ]);
    // Lawnmower 10 + 4 against the beardless + 5 from the gas.
    expect(monsterStrength(n, 0)).toEqual([
      { source: 'kz.lawnmower', value: 10 },
      { source: 'vs:kz.lawnmower', value: 4 }
    ]);
    expect(fightTotals(n)).toEqual({ hero: 6, monsters: 19 });
  });

  it('boosters change level and loot; loot never drops below zero', () => {
    expect(monsterLoot({ card: 'kz.lawnmower', boosters: ['kz.prize-size', 'kz.furious-fence#1'] })).toBe(3 + 2 + 1);
    expect(monsterLoot({ card: 'kz.pebble-golem', boosters: ['kz.fresh-from-garden-centre#1', 'kz.fresh-from-garden-centre#2'] })).toBe(0);
    const s = fightWith(() => undefined, 'kz.pebble-golem');
    s.fight!.monsters[0]!.boosters.push('kz.lunch-break#1');
    expect(monsterStrength(s, 0)).toEqual([
      { source: 'kz.pebble-golem', value: 1 },
      { source: 'kz.lunch-break#1', value: -3 }
    ]);
    // A monster never counts below 1.
    expect(fightTotals(s).monsters).toBe(1);
  });

  it('no fight, no totals', () => {
    expect(fightTotals(arranged(() => undefined))).toEqual({ hero: 0, monsters: 0 });
  });

  it('flee bonus = one-shots + items + origins + professions', () => {
    const s = fightWith((s) => {
      take(s, 'kz.league-slippers', me(s).equipped);
      take(s, 'kz.plastic-gnome', me(s).origins);
      take(s, 'kz.night-watch', me(s).professions);
    });
    s.fight!.flee = 3;
    expect(fleeBonus(s)).toBe(3 + 2 + 1 + 1);
  });
});

describe('slots', () => {
  const p = (equipped: string[]) => player({ equipped });
  it.each([
    ['head replaces head', ['kz.hard-hat', 'kz.leather-apron'], 'kz.pointy-hat', ['kz.hard-hat']],
    ['body replaces body', ['kz.leather-apron'], 'kz.bottlecap-mail', ['kz.leather-apron']],
    ['feet replace feet', ['kz.rubber-boots'], 'kz.garden-clogs', ['kz.rubber-boots']],
    ['a free hand is used', ['kz.pickaxe'], 'kz.shovel', []],
    ['the first one-hand item goes when both hands are busy', ['kz.pickaxe', 'kz.shovel'], 'kz.slingshot', ['kz.pickaxe']],
    ['two hands push out a two-hand item', ['kz.garden-hose'], 'kz.rake-of-reckoning', ['kz.garden-hose']],
    ['a one-hand item pushes out a two-hand item', ['kz.garden-hose'], 'kz.shovel', ['kz.garden-hose']],
    ['only one big item', ['kz.golden-hammer'], 'kz.wheelbarrow-ram', ['kz.golden-hammer']],
    ['small items never collide', ['kz.beard-comb', 'kz.fake-beard'], 'kz.lucky-charm', []],
    ['an item never displaces itself', ['kz.pickaxe', 'kz.shovel'], 'kz.pickaxe', []],
    ['not an item', ['kz.pickaxe'], 'kz.firecracker', []]
  ])('%s', (_, equipped, card, out) => {
    expect(displacedBy(p(equipped), card)).toEqual(out);
  });
});
