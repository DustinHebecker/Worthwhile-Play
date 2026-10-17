// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from 'vitest';
import { createTestContext } from '@wp/testing';
import type { GameModule, Translator } from '@wp/game-core';
import game, { type CardQuestState } from '../src/index';
import { createRngFromState } from '@wp/game-core';
import { DEFAULT_SETTINGS, isValidState, newGame, step, type LogEvent } from '../src/rules';
import { arranged, take } from './harness';
import { en } from '../src/content/en';

const q = (root: HTMLElement, id: string) => root.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`);

/** Plays the person's side through the DOM with the simplest choices until the game ends or `limit` clicks. */
function clickThrough(root: HTMLElement, instance: { serialize(): CardQuestState }, limit: number): number {
  let clicks = 0;
  for (; clicks < limit; clicks++) {
    const state = instance.serialize();
    if (state.phase === 'over') break;
    const end = q(root, 'end');
    if (end?.disabled) {
      // Give-away mode: select hand cards until the button is enabled.
      for (const tile of root.querySelectorAll<HTMLButtonElement>('[data-testid="hand"] .cq-tile[aria-pressed="false"]')) {
        tile.click();
        if (!q(root, 'end')!.disabled) break;
      }
      q(root, 'end')!.click();
      continue;
    }
    const next = ['reveal-continue', 'open', 'rummage', 'pass', 'accept', 'roll', 'end'].map((id) => q(root, id)).find((b) => b && !b.disabled);
    if (!next) throw new Error(`no action button in phase ${state.phase}`);
    next.click();
  }
  return clicks;
}

/** Deal log lines whose plain form agrees its verbs with {name} and {to}: the person gets `.you` / `.toYou` keys. */
const DEAL_KEYS = [
  'log.offer.help', 'log.offer.free', 'log.offer.stay', 'log.accept', 'log.decline', 'log.switch', 'log.kept.loot', 'log.kept.item',
  'log.kept.favour', 'log.kept.free', 'log.broken.switch', 'log.broken.stay', 'log.broken.favour', 'log.void'
];

/** A translator that records keys filled with the person where only computer players fit (verb agreement, case). */
function personSpy(real: Translator, npcOnly: readonly string[], misuse: string[]): Translator {
  const you = real('you');
  return Object.assign((key: string, params?: Readonly<Record<string, string | number>>) => {
    if ((npcOnly.includes(key) || DEAL_KEYS.includes(key)) && params?.name === you) misuse.push(`${key} {name}`);
    if (params?.to === you || params?.target === you) misuse.push(`${key} {to}`);
    return real(key, params);
  }, { locale: real.locale, direction: real.direction });
}

describe('view', () => {
  beforeAll(async () => {
    await game.preload?.('en');
    await game.preload?.('de');
  });

  for (const locale of ['en', 'de'] as const) {
    it(`plays a whole game through the DOM (${locale})`, () => {
      const ctx = createTestContext(game as GameModule<unknown>, locale);
      const instance = game.create(ctx.context as never);
      instance.newGame({ seed: 11 });
      clickThrough(ctx.context.root, instance, 3000);
      const state = instance.serialize();
      expect(state.phase).toBe('over');
      expect(isValidState(state)).toBe(true);
      expect(ctx.results).toHaveLength(1);
      expect(ctx.missingKeys).toEqual([]);
      instance.dispose();
    });
  }

  // One game per test (split for the time budget under load): these templates agree the verb with {name} in some
  // languages; the person has own keys instead.
  for (const seed of [2, 3, 4]) {
    it(`sentences with a verb are only filled with computer players, never with the person (seed ${seed})`, () => {
      const NPC_ONLY = ['next.fight.react', 'next.end.give', 'next.over.lost', 'act.curse', 'act.hero.other', 'fight.forecast.other.win', 'fight.forecast.other.lose'];
      const ctx = createTestContext(game as GameModule<unknown>, 'en');
      const real = ctx.context.t;
      const misuse: string[] = [];
      const spy = personSpy(real, NPC_ONLY, misuse);
      const instance = game.create({ ...ctx.context, t: spy } as never);
      instance.newGame({ seed });
      clickThrough(ctx.context.root, instance, 3000);
      expect(misuse).toEqual([]);
      instance.dispose();
    });
  }

  it('deal, give-away and curse lines use the forms for the person, in every combination', () => {
    const combos: [number, number][] = [[0, 1], [1, 0], [1, 2]];
    for (const [seat, to] of combos) {
      const ctx = createTestContext(game as GameModule<unknown>, 'de');
      const misuse: string[] = [];
      const instance = game.create({ ...ctx.context, t: personSpy(ctx.context.t, [], misuse) } as never);
      const s = arranged(() => undefined);
      const card = 'kz.pickaxe';
      const events: LogEvent[] = [
        { e: 'offer', seat, to, t: 'loot', n: 1 }, { e: 'offer', seat, to, t: 'free' }, { e: 'offer', seat, to, t: 'stay', card },
        { e: 'accept', seat, to }, { e: 'decline', seat, to }, { e: 'switch', seat, to, card: 'kz.change-sides#1' },
        { e: 'kept', seat, to, t: 'loot', n: 2 }, { e: 'kept', seat, to, t: 'item', card }, { e: 'kept', seat, to, t: 'favour' },
        { e: 'kept', seat, to, t: 'free' }, { e: 'broken', seat, to, why: 'switch' }, { e: 'broken', seat, to, why: 'stay' },
        { e: 'broken', seat, to, why: 'favour' }, { e: 'void', seat, to, card }, { e: 'give', seat, to, count: 2 },
        { e: 'curse', seat, card: 'kz.wrong-hat', target: to }
      ];
      instance.restore({ ...s, log: events, logSeq: events.length, seen: events.length });
      const text = ctx.context.root.querySelector('[data-testid="log"]')!.textContent!;
      expect(misuse, `${seat}→${to}`).toEqual([]);
      expect(text).not.toMatch(/\{|Du schuldet|an Du|auf Du|mit Du|von Du|gegen Du/);
      expect(ctx.missingKeys).toEqual([]);
      instance.dispose();
    }
  });

  describe('the Blunder sentence in the log', () => {
    /** The given seat lost against the Cave Slime and must roll; the die will show 1. */
    function caught(seat: number, wearsShoes: boolean): CardQuestState {
      const s = arranged((s) => {
        s.active = seat;
        if (wearsShoes) take(s, 'kz.league-slippers', s.players[seat]!.equipped);
        s.encounter.splice(s.encounter.indexOf('kz.cave-slime'), 1);
        s.encounter.push('kz.cave-slime');
      });
      let n = step(s, seat, { a: 'open' })!;
      for (let i = 0; i < 3; i++) n = step(n, n.fight!.actor, { a: 'pass' })!;
      for (let st = 1; ; st++) if (createRngFromState(st).int(1, 6) === 1) return { ...n, rng: st };
    }
    const sentence = en['kz.cave-slime']!.blunder!;
    const pageText = (state: CardQuestState, act: (root: HTMLElement) => void) => {
      const ctx = createTestContext(game as GameModule<unknown>, 'en');
      const instance = game.create(ctx.context as never);
      instance.restore(state);
      act(ctx.context.root);
      const text = ctx.context.root.textContent ?? '';
      instance.dispose();
      return text;
    };

    it('appears when the person is caught and loses what it says', () => {
      expect(pageText(caught(0, true), (root) => q(root, 'roll')!.click())).toContain(sentence);
    });
    it('does not appear when the slot was empty', () => {
      expect(pageText(caught(0, false), (root) => q(root, 'roll')!.click())).not.toContain(sentence);
    });
    it('does not appear when the Blunder only partly hit (level lost, but no shoes to lose)', () => {
      const s = arranged((s) => {
        s.players[0]!.level = 3;
        s.encounter.splice(s.encounter.indexOf('kz.runaway-cart'), 1);
        s.encounter.push('kz.runaway-cart');
      });
      let n = step(s, 0, { a: 'open' })!;
      for (let i = 0; i < 3; i++) n = step(n, n.fight!.actor, { a: 'pass' })!;
      for (let st = 1; ; st++) if (createRngFromState(st).int(1, 6) === 1) { n = { ...n, rng: st }; break; }
      const after = step(n, 0, { a: 'roll' })!;
      expect(after.players[0]!.level).toBe(2);
      expect(pageText(after, () => undefined)).not.toContain(en['kz.runaway-cart']!.blunder!);
    });

    it('does not appear for a computer player (it speaks to "you")', () => {
      const s = step(caught(1, true), 1, { a: 'roll' })!;
      expect(s.log.some((e) => e.e === 'flee' && !e.ok)).toBe(true);
      expect(pageText(s, () => undefined)).not.toContain(sentence);
    });
  });

  describe('reading cards while choosing (B1)', () => {
    const mount = (state: CardQuestState) => {
      const ctx = createTestContext(game as GameModule<unknown>, 'en');
      const instance = game.create(ctx.context as never);
      instance.restore(state);
      return { root: ctx.context.root, instance };
    };
    const giveAway = () =>
      arranged((s) => {
        s.phase = 'end';
        for (const c of ['kz.cave-slime', 'kz.firecracker', 'kz.pickaxe', 'kz.mine-collapse', 'kz.tool-shed', 'kz.lunch-break#1', 'kz.shovel']) take(s, c, s.players[0]!.hand);
      });

    it('give-away: the info button opens the card without choosing it; Select chooses it; tapping a tile only toggles', () => {
      const { root, instance } = mount(giveAway());
      q(root, 'end')!.click();
      const info = q(root, 'info-kz.cave-slime')!;
      info.click();
      expect(q(root, 'detail')!.textContent).toContain(en['kz.cave-slime']!.name);
      expect(document.activeElement).toBe(q(root, 'detail'));
      expect(q(root, 'info-kz.cave-slime')!.getAttribute('aria-controls')).toBe('cq-detail');
      const tile = () => root.querySelector<HTMLButtonElement>('[data-testid="hand"] .cq-tile[data-card="kz.cave-slime"]')!;
      expect(tile().getAttribute('aria-pressed')).toBe('false');
      q(root, 'act-pick')!.click();
      expect(tile().getAttribute('aria-pressed')).toBe('true');
      q(root, 'detail-close')!.click();
      expect(q(root, 'detail')).toBeNull();
      // Focus returns to the card, never to "Give away".
      expect(document.activeElement).toBe(q(root, 'info-kz.cave-slime'));
      // A tile tap toggles and opens nothing.
      const other = () => root.querySelector<HTMLButtonElement>('[data-testid="hand"] .cq-tile[data-card="kz.firecracker"]')!;
      other().click();
      expect(other().getAttribute('aria-pressed')).toBe('true');
      expect(q(root, 'detail')).toBeNull();
      expect(instance.serialize().players[0]!.hand).toHaveLength(7);
      instance.dispose();
    });

    it('sell: hand, carried and equipped items and one-shots get an info button, other cards do not', () => {
      const s = arranged((s) => {
        take(s, 'kz.gold-nugget', s.players[0]!.hand);
        take(s, 'kz.firecracker', s.players[0]!.hand);
        take(s, 'kz.cave-slime', s.players[0]!.hand);
        take(s, 'kz.hard-hat', s.players[0]!.pack);
        take(s, 'kz.shovel', s.players[0]!.equipped);
      });
      const { root, instance } = mount(s);
      q(root, 'sell-mode')!.click();
      for (const c of ['kz.gold-nugget', 'kz.firecracker', 'kz.hard-hat', 'kz.shovel']) expect(q(root, `info-${c}`), c).not.toBeNull();
      expect(q(root, 'info-kz.cave-slime')).toBeNull();
      q(root, 'info-kz.shovel')!.click();
      expect(q(root, 'detail')!.textContent).toContain(en['kz.shovel']!.name);
      q(root, 'act-pick')!.click();
      expect(root.querySelector('[data-testid="mine"] .cq-tile[data-card="kz.shovel"]')!.getAttribute('aria-pressed')).toBe('true');
      instance.dispose();
    });

    it('moving on to the give-away step (after Rummage) closes a detail left open from playing', () => {
      // The person's action (act) clears the selection before the give-away mode starts.
      const s = arranged((s) => {
        s.phase = 'after';
        for (const c of ['kz.cave-slime', 'kz.firecracker', 'kz.pickaxe', 'kz.mine-collapse', 'kz.tool-shed', 'kz.shovel']) take(s, c, s.players[0]!.hand);
      });
      const { root, instance } = mount(s);
      root.querySelector<HTMLButtonElement>('[data-testid="hand"] .cq-tile[data-card="kz.pickaxe"]')!.click();
      expect(q(root, 'detail')).not.toBeNull();
      q(root, 'rummage')!.click();
      // Too many cards now: still the play mode until "End turn" asks which ones to give away.
      expect(q(root, 'end')!.disabled).toBe(false);
      q(root, 'end')!.click();
      expect(q(root, 'end')!.disabled).toBe(true);
      expect(q(root, 'detail')).toBeNull();
      instance.dispose();
    });
  });

  it('shows the illustration small on the tile and large in the card detail (B2)', () => {
    const s = arranged((s) => take(s, 'kz.garden-hose', s.players[0]!.hand));
    const ctx = createTestContext(game as GameModule<unknown>, 'en');
    const instance = game.create(ctx.context as never);
    instance.restore(s);
    const tile = ctx.context.root.querySelector<HTMLButtonElement>('[data-testid="hand"] .cq-tile[data-card="kz.garden-hose"]')!;
    expect(tile.querySelector('.cq-art-il svg.cq-il')).not.toBeNull();
    expect(q(ctx.context.root, 'detail-pic')).toBeNull();
    tile.click();
    expect(q(ctx.context.root, 'detail-pic')!.querySelector('svg.cq-il[aria-hidden="true"]')).not.toBeNull();
    instance.dispose();
  });

  describe('owner feedback 2026-10-17', () => {
    const mount = (state: CardQuestState) => {
      const ctx = createTestContext(game as GameModule<unknown>, 'en');
      const instance = game.create(ctx.context as never);
      instance.restore(state);
      return { root: ctx.context.root, instance };
    };

    it('with too many cards the person may still equip before giving away; Cancel returns to play', () => {
      const s = arranged((s) => {
        s.phase = 'end';
        for (const c of ['kz.cave-slime', 'kz.firecracker', 'kz.pickaxe', 'kz.mine-collapse', 'kz.tool-shed', 'kz.shovel', 'kz.hard-hat']) take(s, c, s.players[0]!.hand);
      });
      const { root, instance } = mount(s);
      expect(q(root, 'next')!.textContent).toContain('cards to give away (hand limit 5): 2');
      root.querySelector<HTMLButtonElement>('[data-testid="hand"] .cq-tile[data-card="kz.hard-hat"]')!.click();
      q(root, 'act-equip')!.click();
      expect(instance.serialize().players[0]!.equipped).toContain('kz.hard-hat');
      q(root, 'end')!.click();
      expect(q(root, 'end')!.textContent).toContain('1');
      expect(q(root, 'end')!.disabled).toBe(true);
      q(root, 'give-cancel')!.click();
      expect(q(root, 'end')!.disabled).toBe(false);
      root.querySelector<HTMLButtonElement>('[data-testid="hand"] .cq-tile[data-card="kz.pickaxe"]')!.click();
      q(root, 'act-equip')!.click();
      // Exactly at the hand limit now: End turn ends the turn at once.
      q(root, 'end')!.click();
      expect(instance.serialize().log.some((e) => e.e === 'turn' && e.seat === 1)).toBe(true);
      instance.dispose();
    });

    it('a trap found around the corner is shown with picture, rules and what it took, until Continue', () => {
      const s = arranged((s) => {
        take(s, 'kz.hard-hat', s.players[0]!.equipped);
        s.encounter.splice(s.encounter.indexOf('kz.wrong-hat'), 1);
        s.encounter.push('kz.wrong-hat');
      });
      const { root, instance } = mount(s);
      q(root, 'open')!.focus();
      q(root, 'open')!.click();
      const reveal = q(root, 'reveal')!;
      expect(reveal.textContent).toContain(en['kz.wrong-hat']!.name);
      expect(reveal.querySelector('svg.cq-il')).not.toBeNull();
      expect(reveal.querySelector('.cq-rules')!.textContent).toContain('Hits you at once');
      expect(q(root, 'reveal-result')!.textContent).toContain(en['kz.hard-hat']!.name);
      expect(q(root, 'rummage')).toBeNull();
      expect(document.activeElement).toBe(q(root, 'reveal-continue'));
      q(root, 'reveal-continue')!.click();
      expect(q(root, 'reveal')).toBeNull();
      expect(q(root, 'rummage')).not.toBeNull();
      instance.dispose();
    });
  });

  describe('reveals survive a reload and are not skipped (owner feedback 2026-10-17, review)', () => {
    /** The person's turn after the computer seats cursed them twice: two reveals waiting. */
    const cursedTwice = (): CardQuestState => {
      const s = arranged((s) => take(s, 'kz.hard-hat', s.players[0]!.equipped));
      const events: LogEvent[] = [
        { e: 'curse', seat: 1, card: 'kz.wrong-hat', target: 0 },
        { e: 'penalty', seat: 0, p: 'slot', card: 'kz.hard-hat' },
        { e: 'curse', seat: 2, card: 'kz.beard-in-hedge', target: 0 },
        { e: 'penalty', seat: 0, p: 'level', n: 0 }
      ];
      return { ...s, log: [...s.log, ...events], logSeq: s.logSeq + events.length, seen: s.logSeq };
    };
    const mount = (state: CardQuestState) => {
      const ctx = createTestContext(game as GameModule<unknown>, 'en');
      const instance = game.create(ctx.context as never);
      instance.restore(state);
      return { root: ctx.context.root, instance, ctx };
    };

    it('curses from others are shown one after the other, each until Continue', () => {
      const { root, instance } = mount(cursedTwice());
      expect(q(root, 'reveal')!.textContent).toContain(`Brumbo curses you: ${en['kz.wrong-hat']!.name}`);
      expect(q(root, 'reveal-result')!.textContent).toContain(en['kz.hard-hat']!.name);
      expect(q(root, 'next')!.textContent).toContain('A card hit you');
      expect(q(root, 'hand')).toBeNull();
      q(root, 'reveal-continue')!.click();
      expect(q(root, 'reveal')!.textContent).toContain(`Pippa curses you: ${en['kz.beard-in-hedge']!.name}`);
      q(root, 'reveal-continue')!.click();
      expect(q(root, 'reveal')).toBeNull();
      expect(q(root, 'open')).not.toBeNull();
      instance.dispose();
    });

    it('a reload during a reveal shows it again; after Continue it stays gone', () => {
      const first = mount(cursedTwice());
      first.root.querySelector<HTMLButtonElement>('[data-testid="reveal-continue"]')!.click();
      const saved = first.instance.serialize();
      expect(isValidState(saved)).toBe(true);
      expect(first.ctx.saveRequests()).toBeGreaterThan(0);
      first.instance.dispose();
      const second = mount(saved);
      expect(q(second.root, 'reveal')!.textContent).toContain('Pippa curses you');
      q(second.root, 'reveal-continue')!.click();
      const done = second.instance.serialize();
      second.instance.dispose();
      const third = mount(done);
      expect(q(third.root, 'reveal')).toBeNull();
      third.instance.dispose();
    });

    it('a finished game shows its end, not a reveal of the curse that came last', () => {
      const s = cursedTwice();
      const over = { ...s, phase: 'over' as const, winners: [1], log: [...s.log, { e: 'win' as const, seats: [1] }], logSeq: s.logSeq + 1 };
      const { root, instance } = mount(over);
      expect(q(root, 'reveal')).toBeNull();
      expect(q(root, 'next')!.textContent).toContain('won');
      instance.dispose();
    });

    it('a held-down Enter (key repeat) does not skip a reveal', () => {
      const { root, instance } = mount(cursedTwice());
      const press = (repeat: boolean) => {
        const event = new KeyboardEvent('keydown', { key: 'Enter', repeat, bubbles: true, cancelable: true });
        q(root, 'reveal-continue')!.dispatchEvent(event);
        return event.defaultPrevented;
      };
      expect(press(true)).toBe(true);
      expect(press(false)).toBe(false);
      instance.dispose();
    });
  });

  describe('offers and deals (K2)', () => {
    const mount = (state: CardQuestState) => {
      const ctx = createTestContext(game as GameModule<unknown>, 'en');
      const instance = game.create(ctx.context as never);
      instance.restore(state);
      return { root: ctx.context.root, instance, ctx };
    };
    /** The person fights the Gold Rat (level 5) at level 1; seat 1 (strength 6) could help. */
    const ratFight = () =>
      step(
        arranged((s) => {
          s.players[1]!.level = 4;
          s.players[1]!.personality = 'cautious';
          take(s, 'kz.hard-hat', s.players[1]!.equipped);
          s.encounter.splice(s.encounter.indexOf('kz.gold-rat'), 1);
          s.encounter.push('kz.gold-rat');
        }),
        0,
        { a: 'open' }
      )!;

    it('the person asks for help through the form; the answer and the helper appear', () => {
      const { root, instance } = mount(ratFight());
      expect(root.textContent).toContain('Reputation 3/5');
      const who = root.querySelector<HTMLSelectElement>('[data-testid="help-who"]')!;
      expect(who.options.length).toBe(2);
      const terms = root.querySelector<HTMLSelectElement>('[data-testid="help-terms"]')!;
      expect([...terms.options].map((o) => o.textContent)).toContain('2 loot cards');
      q(root, 'help-ask')!.click();
      const s = instance.serialize();
      // The computer answered at once (a cautious player takes one loot card); the offer never stays open for it.
      expect(s.fight?.offer ?? null).toBeNull();
      expect(s.log.some((e) => e.e === 'offer' && e.seat === 0)).toBe(true);
      expect(s.fight?.helper).toBe(1);
      expect(q(root, 'helper')!.textContent).toContain('Brumbo');
      instance.dispose();
    });

    it('an offer to the person waits for Accept or Decline', () => {
      const s = arranged((s) => {
        s.active = 1;
        s.players[0]!.level = 4;
        take(s, 'kz.hard-hat', s.players[0]!.equipped);
        s.encounter.splice(s.encounter.indexOf('kz.gold-rat'), 1);
        s.encounter.push('kz.gold-rat');
      });
      const opened = step(s, 1, { a: 'open' })!;
      const asked = step(opened, 1, { a: 'offer', to: 0, terms: { t: 'loot', n: 1 } })!;
      const { root, instance } = mount(asked);
      expect(q(root, 'next')!.textContent).toContain('offers 1 loot card');
      // Repeated next to the answers (on a phone the "next" box is far above); both answers weigh the same.
      expect(q(root, 'offer-text')!.textContent).toContain('offers 1 loot card');
      expect(q(root, 'decline')!.classList.contains('primary')).toBe(true);
      expect(q(root, 'pass')).toBeNull();
      q(root, 'accept')!.click();
      const after = instance.serialize();
      expect(after.log.some((e) => e.e === 'accept' && e.seat === 0)).toBe(true);
      expect(isValidState(after)).toBe(true);
      instance.dispose();
    });
  });

  it('keeps the keyboard focus inside the game after a main action', () => {
    const ctx = createTestContext(game as GameModule<unknown>, 'en');
    const instance = game.create(ctx.context as never);
    for (let seed = 1; seed < 50; seed++) {
      instance.newGame({ seed });
      const main = ['open', 'rummage', 'pass', 'roll', 'end'].map((id) => q(ctx.context.root, id)).find((b) => b && !b.disabled);
      if (!main) continue;
      main.focus();
      main.click();
      const focused = document.activeElement as HTMLElement;
      expect(ctx.context.root.contains(focused)).toBe(true);
      expect(focused.matches('button.primary, .cq-next-text')).toBe(true);
      instance.dispose();
      return;
    }
    throw new Error('no seed with a main action for the person');
  });

  describe('start screen (ADR 0017)', () => {
    it('a new game starts at once with the chosen settings, no setup of its own', () => {
      const ctx = createTestContext(game as GameModule<unknown>, 'en');
      const instance = game.create(ctx.context as never);
      instance.newGame({ seed: 4, difficulty: 'sharp', settings: { opponents: 5, target: 6, roundLimit: 20 } });
      const s = instance.serialize();
      expect(s.phase).not.toBe('setup');
      expect(s.players).toHaveLength(6);
      // The target is always level 10 now (owner decision); a passed target is ignored.
      expect(s.settings).toMatchObject({ difficulty: 'sharp', opponents: 5, target: 10, roundLimit: 20, coach: true });
      expect(game.settingsOf!(s)).toEqual({ difficulty: 'sharp', opponents: 5, roundLimit: 20 });
      expect(q(ctx.context.root, 'start')).toBeNull();
      expect(q(ctx.context.root, 'setup-opponents')).toBeNull();
      instance.dispose();
    });

    it('junk settings fall back to the defaults', () => {
      const ctx = createTestContext(game as GameModule<unknown>, 'en');
      const instance = game.create(ctx.context as never);
      instance.newGame({ seed: 4, difficulty: 'godlike', settings: { opponents: 9, target: 7, roundLimit: 'x', coach: 'yes' } as never });
      expect(instance.serialize().settings).toMatchObject({ difficulty: 'normal', opponents: 3, target: 10, roundLimit: 0, coach: true });
      instance.dispose();
    });

    it('a save from before the start screen that is still in the setup is dealt with its settings', () => {
      const ctx = createTestContext(game as GameModule<unknown>, 'en');
      const instance = game.create(ctx.context as never);
      const old = newGame(8, { ...DEFAULT_SETTINGS, opponents: 2, target: 8 });
      instance.restore(old);
      const s = instance.serialize();
      expect(s.phase).not.toBe('setup');
      expect(s.players).toHaveLength(3);
      expect(s.settings.target).toBe(8);
      expect(isValidState(s)).toBe(true);
      expect(ctx.saveRequests()).toBeGreaterThan(0);
      // Restoring the same old save again deals the very same game.
      const again = game.create(createTestContext(game as GameModule<unknown>, 'en').context as never);
      again.restore(old);
      expect(again.serialize()).toEqual(s);
      again.dispose();
      instance.dispose();
    });

    it('coach tips are switched during play without ending the game, and new games remember it', () => {
      const ctx = createTestContext(game as GameModule<unknown>, 'en');
      const instance = game.create(ctx.context as never);
      let found = false;
      for (let seed = 1; seed < 60 && !found; seed++) {
        instance.newGame({ seed });
        found = q(ctx.context.root, 'hint') !== null;
      }
      expect(found).toBe(true);
      const before = instance.serialize();
      const saves = ctx.saveRequests();
      const box = ctx.context.root.querySelector<HTMLInputElement>('[data-testid="coach"]')!;
      expect(box.checked).toBe(true);
      box.checked = false;
      box.dispatchEvent(new Event('change'));
      const after = instance.serialize();
      expect(ctx.saveRequests()).toBeGreaterThan(saves);
      expect(ctx.preferences.get('coach')).toBe(false);
      expect(q(ctx.context.root, 'hint')).toBeNull();
      expect(after.settings.coach).toBe(false);
      expect({ ...after, settings: before.settings }).toEqual(before);
      expect(isValidState(after)).toBe(true);
      instance.newGame({ seed: 3 });
      expect(instance.serialize().settings.coach).toBe(false);
      instance.dispose();
    });

    it('new games take the coach choice from the old setup preference until the switch was used', () => {
      for (const own of [undefined, 'yes', 1]) {
        const ctx = createTestContext(game as GameModule<unknown>, 'en');
        ctx.preferences.set('setup', { coach: false });
        if (own !== undefined) ctx.preferences.set('coach', own);
        const instance = game.create(ctx.context as never);
        instance.newGame({ seed: 2 });
        expect(instance.serialize().settings.coach, String(own)).toBe(false);
        instance.dispose();
      }
      const ctx = createTestContext(game as GameModule<unknown>, 'en');
      ctx.preferences.set('setup', { coach: false });
      ctx.preferences.set('coach', true);
      const instance = game.create(ctx.context as never);
      instance.newGame({ seed: 2 });
      expect(instance.serialize().settings.coach).toBe(true);
      instance.dispose();
    });

    it('declares its settings with the setup older versions remembered as defaults', () => {
      const specs = typeof game.settings === 'function' ? game.settings({ preferences: { get: () => ({ opponents: 5, target: 12, roundLimit: 30, coach: false }), set: () => undefined } } as never) : game.settings!;
      const defaults = Object.fromEntries(specs.map((sp) => [sp.kind === 'difficulty' ? 'difficulty' : sp.id, sp.default]));
      expect(defaults).toEqual({ difficulty: 'normal', opponents: 5, roundLimit: 30 });
      expect(game.metadata.setupInGame).toBeUndefined();
    });
  });

  it('equips an item from the card detail', () => {
    const ctx = createTestContext(game as GameModule<unknown>, 'en');
    const instance = game.create(ctx.context as never);
    for (let seed = 1; seed < 50; seed++) {
      instance.newGame({ seed });
      const s = instance.serialize();
      if (s.active !== 0 || s.phase !== 'prepare') continue;
      const item = ctx.context.root.querySelector<HTMLButtonElement>('[data-testid="hand"] .cq-tile[data-type="item"]');
      if (!item) continue;
      item.click();
      q(ctx.context.root, 'act-equip')!.click();
      expect(instance.serialize().players[0]!.equipped).toContain(item.dataset.card);
      instance.dispose();
      return;
    }
    throw new Error('no seed with an item in the first hand');
  });
});
