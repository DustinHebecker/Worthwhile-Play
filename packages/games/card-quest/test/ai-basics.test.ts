import { describe, expect, it } from 'vitest';
import { decide } from '../src/ai';
import { observe, step, type CardQuestState } from '../src/rules';
import { arranged, me, take } from './harness';

/*
 * Basic contracts of the computer players that tuning must keep: they use what clearly helps (better items,
 * free levels, doubles), challenge only what they can beat, give away what they value least, win their own
 * fights with one-shots when that suffices, escape from harsh losses, and never act out of turn.
 * Seat 0 is the computer under test here (its personality is set explicitly).
 */
const ai = (s: CardQuestState, seat = 0) => decide(observe(s, seat), s.settings.difficulty);

function calm(phase: 'prepare' | 'after' | 'end', patch: (s: CardQuestState) => void, personality: 'cautious' | 'opportunist' | 'grudge' | 'showoff' = 'cautious') {
  return arranged((s) => {
    s.phase = phase;
    me(s).personality = personality;
    patch(s);
  });
}

describe('computer players in calm phases', () => {
  it('play doubles, windfalls and level-ups first', () => {
    for (const card of ['kz.patchwork-ancestry#1', 'kz.tool-shed', 'kz.senior-gnome#1']) {
      expect(ai(calm('prepare', (s) => take(s, card, me(s).hand)))).toEqual({ a: 'play', card });
    }
  });

  it('take an origin or profession only into an empty slot', () => {
    expect(ai(calm('prepare', (s) => take(s, 'kz.mine-dwarf', me(s).hand)))).toEqual({ a: 'play', card: 'kz.mine-dwarf' });
    expect(ai(calm('prepare', (s) => take(s, 'kz.night-watch', me(s).hand)))).toEqual({ a: 'play', card: 'kz.night-watch' });
    const full = calm('prepare', (s) => {
      take(s, 'kz.forest-dwarf', me(s).origins);
      take(s, 'kz.mine-dwarf', me(s).hand);
    });
    expect(ai(full)).toEqual({ a: 'open' });
  });

  it('equip the item that adds the most strength, never one that adds nothing', () => {
    const s = calm('prepare', (s) => {
      take(s, 'kz.shovel', me(s).hand);
      take(s, 'kz.rake-of-reckoning', me(s).hand);
      take(s, 'kz.gold-nugget', me(s).equipped);
    });
    expect(ai(s)).toEqual({ a: 'equip', card: 'kz.rake-of-reckoning' });
    const worse = calm('prepare', (s) => {
      take(s, 'kz.rake-of-reckoning', me(s).equipped);
      take(s, 'kz.shovel', me(s).hand);
    });
    expect(ai(worse)).not.toEqual({ a: 'equip', card: 'kz.shovel' });
  });

  it('attach upgrades to the strongest equipped item', () => {
    const s = calm('prepare', (s) => {
      take(s, 'kz.hard-hat', me(s).equipped);
      take(s, 'kz.wheelbarrow-ram', me(s).equipped);
      take(s, 'kz.taped-up#1', me(s).hand);
    });
    expect(ai(s)).toEqual({ a: 'upgrade', card: 'kz.taped-up#1', item: 'kz.wheelbarrow-ram' });
  });

  it('sell carried items when they are worth a level', () => {
    const s = calm('end', (s) => {
      take(s, 'kz.rake-of-reckoning', me(s).equipped);
      take(s, 'kz.gold-nugget', me(s).pack);
      take(s, 'kz.allotment-map', me(s).pack);
    });
    expect(ai(s)).toEqual({ a: 'sell', cards: ['kz.gold-nugget', 'kz.allotment-map'] });
  });

  it('curse the leader by personality; the cautious do not', () => {
    const patch = (s: CardQuestState) => {
      take(s, 'kz.mine-collapse', me(s).hand);
      s.players[2]!.level = 4;
    };
    expect(ai(calm('prepare', patch, 'opportunist'))).toEqual({ a: 'curse', card: 'kz.mine-collapse', target: 2 });
    expect(ai(calm('prepare', patch, 'cautious'))).toEqual({ a: 'open' });
  });

  it('challenge a monster from the hand only with a safe margin, otherwise rummage', () => {
    const strong = calm('after', (s) => {
      me(s).level = 6;
      take(s, 'kz.pebble-golem', me(s).hand);
      take(s, 'kz.shed-thing', me(s).hand);
    });
    expect(ai(strong)).toEqual({ a: 'challenge', card: 'kz.pebble-golem' });
    const weak = calm('after', (s) => {
      take(s, 'kz.cave-slime', me(s).hand);
    });
    expect(ai(weak)).toEqual({ a: 'rummage' });
  });

  it('give away the cards worth least to them, and no curses to another player', () => {
    const s = calm('end', (s) => {
      me(s).level = 3;
      for (const c of ['kz.cave-slime', 'kz.mine-collapse', 'kz.firecracker', 'kz.side-tunnel#1', 'kz.mine-gas', 'kz.bottled-thunderstorm#1', 'kz.pebble-golem']) take(s, c, me(s).hand);
    });
    const action = ai(s);
    expect(action).toEqual({ a: 'end', give: ['kz.cave-slime', 'kz.pebble-golem'] });
  });
});

describe('computer players in fights', () => {
  const fight = (patch: (s: CardQuestState) => void, monster: string) => {
    const s = arranged((s) => {
      me(s).personality = 'cautious';
      s.encounter.splice(s.encounter.indexOf(monster), 1);
      s.encounter.push(monster);
      patch(s);
    });
    return step(s, 0, { a: 'open' })!;
  };

  it('pass when already winning', () => {
    expect(ai(fight((s) => (me(s).level = 5), 'kz.pebble-golem'))).toEqual({ a: 'pass' });
  });

  it('play the smallest one-shot that wins', () => {
    const s = fight((s) => {
      me(s).level = 4;
      take(s, 'kz.mine-gas', me(s).hand);
      take(s, 'kz.gnome-superglue#1', me(s).hand);
    }, 'kz.mine-canary');
    // 4 vs 3 already wins → pass; 4 vs 5 needs +2.
    expect(ai(s)).toEqual({ a: 'pass' });
    const t = fight((s) => {
      me(s).level = 4;
      take(s, 'kz.mine-gas', me(s).hand);
      take(s, 'kz.gnome-superglue#1', me(s).hand);
    }, 'kz.tunnel-worm');
    expect(ai(t)).toEqual({ a: 'oneshot', card: 'kz.gnome-superglue#1', side: 'hero' });
  });

  it('escape from a harsh loss, or improve the flee roll', () => {
    const harsh = fight((s) => take(s, 'kz.side-tunnel#1', me(s).hand), 'kz.shed-thing');
    expect(ai(harsh)).toEqual({ a: 'oneshot', card: 'kz.side-tunnel#1', side: 'hero' });
    const flee = fight((s) => take(s, 'kz.shiny-distraction#1', me(s).hand), 'kz.shed-thing');
    expect(ai(flee)).toEqual({ a: 'oneshot', card: 'kz.shiny-distraction#1', side: 'hero' });
    const none = fight(() => undefined, 'kz.shed-thing');
    expect(ai(none)).toEqual({ a: 'pass' });
  });

  it('roll when fleeing', () => {
    let s = fight(() => undefined, 'kz.lawnmower');
    for (let i = 0; i < 3; i++) s = step(s, s.fight!.actor, { a: 'pass' })!;
    expect(ai(s)).toEqual({ a: 'roll' });
  });

  it('do not interfere with a losing fighter', () => {
    let s = fight((s) => take(s, 'kz.prize-size', s.players[1]!.hand), 'kz.lawnmower');
    s = step(s, 0, { a: 'pass' })!;
    s.players[1]!.personality = 'opportunist';
    expect(ai(s, 1)).toEqual({ a: 'pass' });
  });

  it('easy players interfere at most when the fighter would win the game', () => {
    let s = fight((s) => {
      me(s).level = 5;
      take(s, 'kz.prize-size', s.players[1]!.hand);
    }, 'kz.pebble-golem');
    s = step(s, 0, { a: 'pass' })!;
    s.players[1]!.personality = 'showoff';
    s.settings.difficulty = 'easy';
    expect(ai(s, 1)).toEqual({ a: 'pass' });
  });
});
