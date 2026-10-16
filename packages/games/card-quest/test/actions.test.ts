import { describe, expect, it } from 'vitest';
import { legalActions, step, type Action, type CardQuestState } from '../src/rules';
import { arranged, me, take } from './harness';

/** The person (seat 0) on turn in `phase` with the given cards. */
function calm(phase: 'prepare' | 'after' | 'end', patch: (s: CardQuestState) => void = () => undefined, settings = {}): CardQuestState {
  return arranged((s) => {
    s.phase = phase;
    patch(s);
  }, { opponents: 2, ...settings });
}

const ok = (s: CardQuestState, seat: number, a: Action) => {
  const n = step(s, seat, a);
  expect(n, JSON.stringify(a)).not.toBeNull();
  return n!;
};
const no = (s: CardQuestState, seat: number, a: Action) => expect(step(s, seat, a), JSON.stringify(a)).toBeNull();

describe('outside fights only the active player acts, and only in calm phases', () => {
  const s = calm('prepare', (s) => {
    take(s, 'kz.pickaxe', me(s).hand);
    take(s, 'kz.shovel', s.players[1]!.hand);
  });
  it('another seat cannot equip, open or end', () => {
    no(s, 1, { a: 'equip', card: 'kz.shovel' });
    no(s, 1, { a: 'open' });
    no(s, 1, { a: 'end', give: [] });
  });
  it('calm actions are refused in a fight', () => {
    const f = arranged((s) => {
      take(s, 'kz.pickaxe', me(s).hand);
      take(s, 'kz.hard-hat', me(s).equipped);
      take(s, 'kz.senior-gnome#1', me(s).hand);
      take(s, 'kz.taped-up#1', me(s).hand);
      take(s, 'kz.gold-nugget', me(s).hand);
      take(s, 'kz.allotment-map', me(s).hand);
      s.encounter.splice(s.encounter.indexOf('kz.pebble-golem'), 1);
      s.encounter.push('kz.pebble-golem');
    });
    const n = ok(f, 0, { a: 'open' });
    no(n, 0, { a: 'equip', card: 'kz.pickaxe' });
    no(n, 0, { a: 'unequip', card: 'kz.hard-hat' });
    no(n, 0, { a: 'play', card: 'kz.senior-gnome#1' });
    no(n, 0, { a: 'upgrade', card: 'kz.taped-up#1', item: 'kz.hard-hat' });
    no(n, 0, { a: 'sell', cards: ['kz.gold-nugget', 'kz.allotment-map'] });
  });
  it('setup and finished games refuse game actions', () => {
    const over = structuredClone(s);
    over.phase = 'over';
    no(over, 0, { a: 'open' });
    expect(legalActions(over, 0)).toEqual([]);
  });
});

describe('equipment', () => {
  it('equips from hand or pack, moving displaced items to the pack; unequip moves to the pack', () => {
    const s = calm('prepare', (s) => {
      take(s, 'kz.hard-hat', me(s).equipped);
      take(s, 'kz.pointy-hat', me(s).hand);
    });
    const a = ok(s, 0, { a: 'equip', card: 'kz.pointy-hat' });
    expect(me(a)).toMatchObject({ hand: [], equipped: ['kz.pointy-hat'], pack: ['kz.hard-hat'] });
    const b = ok(a, 0, { a: 'equip', card: 'kz.hard-hat' });
    expect(me(b)).toMatchObject({ equipped: ['kz.hard-hat'], pack: ['kz.pointy-hat'] });
    const c = ok(b, 0, { a: 'unequip', card: 'kz.hard-hat' });
    expect(me(c)).toMatchObject({ equipped: [], pack: ['kz.pointy-hat', 'kz.hard-hat'] });
    no(c, 0, { a: 'unequip', card: 'kz.hard-hat' });
    no(c, 0, { a: 'equip', card: 'kz.firecracker' });
    no(c, 0, { a: 'equip', card: 'kz.shovel' });
  });

  it('upgrades attach to an equipped item only', () => {
    const s = calm('after', (s) => {
      take(s, 'kz.hard-hat', me(s).equipped);
      take(s, 'kz.shovel', me(s).pack);
      take(s, 'kz.taped-up#1', me(s).hand);
      take(s, 'kz.firecracker', me(s).hand);
    });
    no(s, 0, { a: 'upgrade', card: 'kz.taped-up#1', item: 'kz.shovel' });
    no(s, 0, { a: 'upgrade', card: 'kz.firecracker', item: 'kz.hard-hat' });
    const n = ok(s, 0, { a: 'upgrade', card: 'kz.taped-up#1', item: 'kz.hard-hat' });
    expect(me(n).upgrades).toEqual([{ item: 'kz.hard-hat', card: 'kz.taped-up#1' }]);
    expect(me(n).hand).toEqual(['kz.firecracker']);
  });

  it('losing an item discards its upgrades too', () => {
    const s = calm('prepare', (s) => {
      take(s, 'kz.hard-hat', s.players[1]!.equipped);
      take(s, 'kz.taped-up#1', s.players[1]!.upgrades as unknown as string[]);
      s.players[1]!.upgrades = [{ item: 'kz.hard-hat', card: 'kz.taped-up#1' }];
      take(s, 'kz.wrong-hat', me(s).hand);
    });
    const n = ok(s, 0, { a: 'curse', card: 'kz.wrong-hat', target: 1 });
    expect(n.players[1]!.upgrades).toEqual([]);
    expect(n.lootDiscard).toEqual(['kz.hard-hat', 'kz.taped-up#1']);
  });
});

describe('selling', () => {
  const s = calm('end', (s) => {
    me(s).level = 2;
    take(s, 'kz.gold-nugget', me(s).hand);
    take(s, 'kz.mine-gas', me(s).hand);
    take(s, 'kz.hard-hat', me(s).pack);
    take(s, 'kz.bottlecap-mail', me(s).equipped);
    take(s, 'kz.cave-slime', me(s).hand);
  });

  it('counts value from hand, pack and equipment and discards what was sold', () => {
    const n = ok(s, 0, { a: 'sell', cards: ['kz.gold-nugget', 'kz.mine-gas', 'kz.hard-hat', 'kz.bottlecap-mail'] });
    // 8 + 3 + 3 + 5 = 19 → one level.
    expect(me(n)).toMatchObject({ level: 3, hand: ['kz.cave-slime'], pack: [], equipped: [] });
    expect(n.lootDiscard.sort()).toEqual(['kz.bottlecap-mail', 'kz.gold-nugget', 'kz.hard-hat', 'kz.mine-gas']);
    expect(n.log.at(-1)).toEqual({ e: 'sell', seat: 0, count: 4, levels: 1 });
  });

  it('refuses empty, duplicate, foreign, unsellable and too cheap sales', () => {
    no(s, 0, { a: 'sell', cards: [] });
    no(s, 0, { a: 'sell', cards: ['kz.gold-nugget', 'kz.gold-nugget', 'kz.mine-gas'] });
    no(s, 0, { a: 'sell', cards: ['kz.gold-nugget', 'kz.mine-gas', 'kz.cave-slime'] });
    no(s, 0, { a: 'sell', cards: ['kz.gold-nugget', 'kz.pickaxe'] });
    no(s, 0, { a: 'sell', cards: ['kz.gold-nugget'] });
  });

  it('a treasure accountant adds value per item, and twenty points give two levels', () => {
    const t = structuredClone(s);
    take(t, 'kz.treasure-accountant', me(t).professions);
    // 8 + 2 = 10 → one level only with the accountant.
    expect(me(ok(t, 0, { a: 'sell', cards: ['kz.gold-nugget'] })).level).toBe(3);
    const n = ok(t, 0, { a: 'sell', cards: ['kz.gold-nugget', 'kz.mine-gas', 'kz.hard-hat', 'kz.bottlecap-mail'] });
    expect(me(n).level).toBe(4);
  });

  it('never sells up to the winning level', () => {
    const t = structuredClone(s);
    me(t).level = t.settings.target - 1;
    no(t, 0, { a: 'sell', cards: ['kz.gold-nugget', 'kz.mine-gas'] });
  });
});

describe('playing cards on the own turn', () => {
  it('level-up cards raise the level but never to the target', () => {
    const s = calm('prepare', (s) => {
      take(s, 'kz.senior-gnome#1', me(s).hand);
    });
    const n = ok(s, 0, { a: 'play', card: 'kz.senior-gnome#1' });
    expect(me(n).level).toBe(2);
    expect(n.lootDiscard).toEqual(['kz.senior-gnome#1']);
    me(s).level = s.settings.target - 1;
    no(s, 0, { a: 'play', card: 'kz.senior-gnome#1' });
  });

  it('windfalls draw loot cards into the hand', () => {
    const s = calm('after', (s) => {
      take(s, 'kz.tool-shed', me(s).hand);
    });
    const top = s.loot.slice(-2).reverse();
    const n = ok(s, 0, { a: 'play', card: 'kz.tool-shed' });
    expect(me(n).hand).toEqual(top);
    expect(n.encounterDiscard).toEqual(['kz.tool-shed']);
  });

  it('a second origin replaces the first unless a Patchwork Ancestry allows two', () => {
    const s = calm('prepare', (s) => {
      take(s, 'kz.mine-dwarf', me(s).origins);
      take(s, 'kz.plastic-gnome', me(s).hand);
      take(s, 'kz.patchwork-ancestry#1', me(s).hand);
      take(s, 'kz.patchwork-ancestry#2', me(s).hand);
    });
    const replaced = ok(s, 0, { a: 'play', card: 'kz.plastic-gnome' });
    expect(me(replaced).origins).toEqual(['kz.plastic-gnome']);
    expect(replaced.encounterDiscard).toEqual(['kz.mine-dwarf']);
    const double = ok(s, 0, { a: 'play', card: 'kz.patchwork-ancestry#1' });
    no(double, 0, { a: 'play', card: 'kz.patchwork-ancestry#2' });
    const both = ok(double, 0, { a: 'play', card: 'kz.plastic-gnome' });
    expect(me(both).origins).toEqual(['kz.mine-dwarf', 'kz.plastic-gnome']);
  });

  it('a Second Job allows two professions', () => {
    const s = calm('prepare', (s) => {
      take(s, 'kz.night-watch', me(s).professions);
      take(s, 'kz.second-job#1', me(s).doubles);
      take(s, 'kz.mine-foreman', me(s).hand);
    });
    expect(me(ok(s, 0, { a: 'play', card: 'kz.mine-foreman' })).professions).toEqual(['kz.night-watch', 'kz.mine-foreman']);
  });

  it('cards that are not played this way are refused', () => {
    const s = calm('prepare', (s) => {
      take(s, 'kz.firecracker', me(s).hand);
      take(s, 'kz.cave-slime', me(s).hand);
    });
    no(s, 0, { a: 'play', card: 'kz.firecracker' });
    no(s, 0, { a: 'play', card: 'kz.cave-slime' });
    no(s, 0, { a: 'play', card: 'kz.tool-shed' });
  });
});

describe('curses', () => {
  const s = calm('prepare', (s) => {
    take(s, 'kz.rain-on-party', me(s).hand);
    take(s, 'kz.identity-crisis', me(s).hand);
    take(s, 'kz.forgot-password', me(s).hand);
    take(s, 'kz.mine-collapse', me(s).hand);
    take(s, 'kz.firecracker', me(s).hand);
    take(s, 'kz.mine-dwarf', s.players[1]!.origins);
    take(s, 'kz.night-watch', s.players[1]!.professions);
    s.players[1]!.level = 3;
  });
  it('apply their effect and are discarded', () => {
    expect(ok(s, 0, { a: 'curse', card: 'kz.rain-on-party', target: 1 }).players[1]!.malus).toBe(3);
    const o = ok(s, 0, { a: 'curse', card: 'kz.identity-crisis', target: 1 });
    expect(o.players[1]!.origins).toEqual([]);
    expect(o.encounterDiscard).toEqual(['kz.mine-dwarf', 'kz.identity-crisis']);
    expect(ok(s, 0, { a: 'curse', card: 'kz.forgot-password', target: 1 }).players[1]!.professions).toEqual([]);
    const l = ok(s, 0, { a: 'curse', card: 'kz.mine-collapse', target: 1 });
    expect(l.players[1]!.level).toBe(2);
    expect(l.log.at(-1)).toEqual({ e: 'penalty', seat: 1, p: 'level', n: 1 });
  });
  it('a level curse never goes below level 1 and logs what was really lost', () => {
    const t = structuredClone(s);
    t.players[1]!.level = 1;
    const l = ok(t, 0, { a: 'curse', card: 'kz.mine-collapse', target: 1 });
    expect(l.players[1]!.level).toBe(1);
    expect(l.log.at(-1)).toEqual({ e: 'penalty', seat: 1, p: 'level', n: 0 });
  });
  it('are refused on oneself, on unknown seats, as non-curses and from outside the hand', () => {
    no(s, 0, { a: 'curse', card: 'kz.rain-on-party', target: 0 });
    no(s, 0, { a: 'curse', card: 'kz.rain-on-party', target: 7 });
    no(s, 0, { a: 'curse', card: 'kz.firecracker', target: 1 });
    no(s, 0, { a: 'curse', card: 'kz.muddy-boots', target: 1 });
    no(s, 1, { a: 'curse', card: 'kz.rain-on-party', target: 2 });
  });
  it('in a fight only the seat whose reaction it is may curse, and it reopens the window', () => {
    const f = arranged((s) => {
      me(s).level = 5;
      s.encounter.splice(s.encounter.indexOf('kz.pebble-golem'), 1);
      s.encounter.push('kz.pebble-golem');
      take(s, 'kz.rain-on-party', s.players[1]!.hand);
      take(s, 'kz.muddy-boots', s.players[2]!.hand);
    });
    let n = ok(f, 0, { a: 'open' });
    n = ok(n, 0, { a: 'pass' });
    no(n, 2, { a: 'curse', card: 'kz.muddy-boots', target: 0 });
    n = ok(n, 1, { a: 'pass' });
    expect(n.fight!.passes).toBe(2);
    n = ok(n, 2, { a: 'curse', card: 'kz.muddy-boots', target: 0 });
    expect(n.fight!.passes).toBe(0);
    expect(me(n).malus).toBe(2);
  });
  it('the malus of a fight is cleared when the fight ends', () => {
    const f = arranged((s) => {
      me(s).level = 5;
      me(s).malus = 2;
      s.encounter.splice(s.encounter.indexOf('kz.pebble-golem'), 1);
      s.encounter.push('kz.pebble-golem');
    });
    let n = ok(f, 0, { a: 'open' });
    for (let i = 0; i < 3; i++) n = ok(n, n.fight!.actor, { a: 'pass' });
    expect(me(n).malus).toBe(0);
    expect(me(n).level).toBe(6);
  });
});

describe('opening, challenging, rummaging', () => {
  it('an opened curse hits the opener; other cards go to the hand', () => {
    const s = calm('prepare', (s) => {
      s.encounter.splice(s.encounter.indexOf('kz.mine-collapse'), 1);
      s.encounter.push('kz.mine-collapse');
      me(s).level = 3;
    });
    const n = ok(s, 0, { a: 'open' });
    expect(n.phase).toBe('after');
    expect(me(n).level).toBe(2);
    expect(n.encounterDiscard).toEqual(['kz.mine-collapse']);
    const t = calm('prepare', (s) => {
      s.encounter.splice(s.encounter.indexOf('kz.mine-dwarf'), 1);
      s.encounter.push('kz.mine-dwarf');
    });
    const m = ok(t, 0, { a: 'open' });
    expect(me(m).hand).toEqual(['kz.mine-dwarf']);
    expect(m.log.at(-1)).toEqual({ e: 'open', seat: 0, card: 'kz.mine-dwarf' });
  });

  it('open only once, in prepare; rummage and challenge only after it', () => {
    const s = calm('prepare', (s) => {
      take(s, 'kz.cave-slime', me(s).hand);
    });
    no(s, 0, { a: 'rummage' });
    no(s, 0, { a: 'challenge', card: 'kz.cave-slime' });
    const a = structuredClone(s);
    a.phase = 'after';
    no(a, 0, { a: 'open' });
    no(a, 0, { a: 'challenge', card: 'kz.lawnmower' });
    const c = ok(a, 0, { a: 'challenge', card: 'kz.cave-slime' });
    expect(c.phase).toBe('fight');
    expect(c.fight!.monsters).toEqual([{ card: 'kz.cave-slime', boosters: [] }]);
    const top = a.encounter.at(-1)!;
    const r = ok(a, 0, { a: 'rummage' });
    expect(r.phase).toBe('end');
    expect(me(r).hand).toEqual(['kz.cave-slime', top]);
    no(r, 0, { a: 'rummage' });
  });

  it('an empty encounter pile reshuffles the discards; with nothing left the turn goes on', () => {
    const s = calm('prepare', (s) => {
      s.encounterDiscard = [...s.encounter];
      s.encounter = [];
    });
    const n = ok(s, 0, { a: 'open' });
    expect(n.encounterDiscard.length + n.encounter.length + me(n).hand.length + (n.fight ? 1 : 0)).toBe(76);
    const empty = calm('prepare', (s) => {
      s.players[1]!.hand.push(...s.encounter);
      s.encounter = [];
    });
    const e = ok(empty, 0, { a: 'open' });
    expect(e.phase).toBe('after');
  });
});

describe('legal actions', () => {
  it('lists exactly the calm actions of the active player', () => {
    const s = calm('after', (s) => {
      take(s, 'kz.hard-hat', me(s).equipped);
      take(s, 'kz.pickaxe', me(s).hand);
      take(s, 'kz.gold-nugget', me(s).pack);
      take(s, 'kz.taped-up#1', me(s).hand);
      take(s, 'kz.cave-slime', me(s).hand);
      take(s, 'kz.muddy-boots', me(s).hand);
      take(s, 'kz.senior-gnome#1', me(s).hand);
    });
    expect(legalActions(s, 0)).toEqual([
      { a: 'curse', card: 'kz.muddy-boots', target: 1 },
      { a: 'curse', card: 'kz.muddy-boots', target: 2 },
      { a: 'equip', card: 'kz.pickaxe' },
      { a: 'equip', card: 'kz.gold-nugget' },
      { a: 'unequip', card: 'kz.hard-hat' },
      { a: 'upgrade', card: 'kz.taped-up#1', item: 'kz.hard-hat' },
      { a: 'play', card: 'kz.senior-gnome#1' },
      { a: 'sell', cards: ['kz.pickaxe', 'kz.gold-nugget'] },
      { a: 'rummage' },
      { a: 'challenge', card: 'kz.cave-slime' }
    ]);
    // Outside fights others may not act at all, not even curse.
    expect(legalActions(s, 1)).toEqual([]);
  });

  it('lists the end of turn with the right number of cards to give', () => {
    const s = calm('end', (s) => {
      for (let i = 0; i < 7; i++) me(s).hand.push(s.encounter.pop()!);
      s.encounterDiscard.push(...me(s).hand.filter((c) => c.includes('curse')));
    });
    const end = legalActions(s, 0).find((a) => a.a === 'end');
    expect(end).toEqual({ a: 'end', give: me(s).hand.slice(0, 2) });
  });

  it('lists fight reactions: boosts per monster, one-shots for both sides, reinforcements, pass', () => {
    const f = arranged((s) => {
      s.encounter.splice(s.encounter.indexOf('kz.pebble-golem'), 1);
      s.encounter.push('kz.pebble-golem');
      take(s, 'kz.furious-fence#1', s.players[1]!.hand);
      take(s, 'kz.firecracker', s.players[1]!.hand);
      take(s, 'kz.come-in-pairs#1', s.players[1]!.hand);
      take(s, 'kz.cave-slime', s.players[1]!.hand);
    });
    let n = ok(f, 0, { a: 'open' });
    expect(legalActions(n, 1)).toEqual([]);
    n = ok(n, 0, { a: 'pass' });
    expect(legalActions(n, 1)).toEqual([
      { a: 'boost', card: 'kz.furious-fence#1', monster: 0 },
      { a: 'oneshot', card: 'kz.firecracker', side: 'hero' },
      { a: 'oneshot', card: 'kz.firecracker', side: 'monster' },
      { a: 'reinforce', card: 'kz.come-in-pairs#1', monster: 'kz.cave-slime' },
      { a: 'pass' }
    ]);
  });

  it('while fleeing the fighter can only roll', () => {
    const f = arranged((s) => {
      s.encounter.splice(s.encounter.indexOf('kz.lawnmower'), 1);
      s.encounter.push('kz.lawnmower');
    });
    let n = ok(f, 0, { a: 'open' });
    for (let i = 0; i < 3; i++) n = ok(n, n.fight!.actor, { a: 'pass' });
    expect(legalActions(n, 0)).toEqual([{ a: 'roll' }]);
    expect(legalActions(n, 1)).toEqual([]);
  });
});
