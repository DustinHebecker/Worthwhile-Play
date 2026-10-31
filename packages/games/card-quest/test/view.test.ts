// @vitest-environment jsdom
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { createTestContext } from '@wp/testing';
import type { GameModule } from '@wp/game-core';
import game, { type CardQuestState } from '../src/index';
import { createRngFromState } from '@wp/game-core';
import { DEFAULT_SETTINGS, isValidState, newGame, step, type LogEvent } from '../src/rules';
import { arranged, take } from './harness';
import { personSpy } from './dom';
import { randomWorlds } from '../src/settings';
import { en } from '../src/content/en';

const q = (root: HTMLElement, id: string) => root.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`);

describe('view', () => {
  beforeAll(async () => {
    await game.preload?.('en');
    await game.preload?.('de');
  });

  it('an item with upgrades shows them below it, with the total bonus and its parts (owner feedback 2026-10-24)', () => {
    const ctx = createTestContext(game as GameModule<unknown>, 'en');
    const instance = game.create(ctx.context as never);
    const helmet = 'kz.flowerpot-helmet';
    const ups = ['kz.freshly-polished#1', 'kz.taped-up#1'];
    instance.restore(
      arranged((s) => {
        const [me, other] = s.players;
        take(s, helmet, me!.equipped);
        for (const u of ups) {
          take(s, u, []);
          me!.upgrades.push({ item: helmet, card: u });
        }
        take(s, 'kz.rubber-boots', me!.equipped);
        take(s, 'kz.mine-tea', other!.equipped);
        take(s, 'kz.turbo-attachment', []);
        other!.upgrades.push({ item: 'kz.mine-tea', card: 'kz.turbo-attachment' });
      })
    );
    const root = ctx.context.root;
    const stack = root.querySelector<HTMLElement>(`[data-testid="stack-${helmet}"]`)!;
    // The helmet (+1) with +1 and +2 attached: +4 in total, the parts below it; each upgrade is its own tile.
    expect(stack.querySelector(`[data-testid="total-${helmet}"]`)!.textContent).toBe('+4+1 +1 +2');
    const attached = stack.querySelector('.cq-attached')!;
    expect(attached.getAttribute('aria-label')).toBe('Attached to Flowerpot Helmet');
    expect([...attached.querySelectorAll<HTMLElement>('.cq-tile')].map((b) => b.dataset.card)).toEqual(ups);
    // An item without upgrades stays a plain tile with its own bonus.
    expect(root.querySelector('[data-testid="stack-kz.rubber-boots"]')).toBeNull();
    expect(root.querySelector('[data-testid="card-kz.rubber-boots"] .cq-tile-num')!.textContent).toBe('+1');
    // An upgrade's detail names its item; the item's detail names its upgrades and the total.
    attached.querySelector<HTMLButtonElement>('.cq-tile')!.click();
    expect(root.querySelector('[data-testid="detail-attached"]')!.textContent).toBe('Attached to Flowerpot Helmet');
    root.querySelector<HTMLButtonElement>(`[data-testid="card-${helmet}"]`)!.click();
    expect(root.querySelector('[data-testid="detail-total"]')!.textContent).toBe('With Freshly Polished, Fixed With Tape: +4 in total');
    // Other players' upgrades are listed with their item.
    expect(root.querySelector('[data-testid="player-1"]')!.textContent).toContain('(+ Turbo Attachment)');
    expect(ctx.missingKeys).toEqual([]);
    instance.dispose();
  });

  it('a lost fight the person helped in: the person flees too, and the log says so (owner 2026-10-27)', () => {
    const s0 = arranged((s) => {
      s.active = 1;
      s.players[0]!.level = 3;
      s.encounter.splice(s.encounter.indexOf('kz.gold-rat'), 1);
      s.encounter.push('kz.gold-rat');
    });
    let s = step(s0, 1, { a: 'open' })!;
    s = step(s, 1, { a: 'offer', to: 0, terms: { t: 'loot', n: 1 } })!;
    s = step(s, 0, { a: 'accept' })!;
    while (s.phase === 'fight') s = step(s, s.fight!.actor, { a: 'pass' })!;
    s = step(s, 1, { a: 'roll' })!;
    expect(s.phase).toBe('flee');
    const ctx = createTestContext(game as GameModule<unknown>, 'en');
    const instance = game.create(ctx.context as never);
    instance.restore(s);
    const root = ctx.context.root;
    expect(root.querySelector('.cq-next-text')!.textContent).toMatch(/^The fight is lost — as the helper you have to flee too\. Roll: \d or more escapes\.$/);
    expect(q(root, 'roll')).not.toBeNull();
    expect(root.querySelector('[data-testid="log"]')!.textContent).toContain('fight lost. You have to flee too.');
    q(root, 'roll')!.click();
    expect(instance.serialize().log.filter((e) => e.e === 'flee').map((e) => e.seat)).toEqual([1, 0]);
    expect(ctx.missingKeys).toEqual([]);
    instance.dispose();
  });

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

  it('random worlds (the default): drawn from the seed, one world or a pair, and "Another round" draws again', () => {
    const ctx = createTestContext(game as GameModule<unknown>, 'en');
    const instance = game.create(ctx.context as never);
    // A deep link without settings deals random worlds too, the same for the same seed.
    instance.newGame({ seed: 9 });
    const first = instance.serialize();
    expect(first.settings).toMatchObject({ worlds: randomWorlds(9), randomWorlds: true });
    expect(isValidState(first)).toBe(true);
    instance.newGame({ seed: 9, settings: game.settingsOf!(first) });
    expect(instance.serialize().settings.worlds).toEqual(first.settings.worlds);
    // "Another round" passes { worlds: 'random' } with a new seed: new worlds may be drawn.
    const drawn = new Set<string>();
    for (let seed = 1; seed <= 12; seed++) {
      instance.newGame({ seed, settings: game.settingsOf!(first) });
      drawn.add(instance.serialize().settings.worlds.join('+'));
    }
    expect(drawn.size).toBeGreaterThan(3);
    instance.dispose();
  });

  it('a random game names the worlds it drew; a game with picked worlds does not', () => {
    const ctx = createTestContext(game as GameModule<unknown>, 'en');
    const instance = game.create(ctx.context as never);
    const line = () => ctx.context.root.querySelector('[data-testid="worlds"]')?.textContent;
    const short: Record<string, string> = { kz: 'Kampfzwerge', sl: 'Spaceloot', of: 'Office Chaos', fd: 'Fridge Expedition', rw: 'All Aboard', bg: 'Creepy Crawlies', sc: 'Break Time', fa: 'Big Top' };
    for (const seed of [1, 2, 3, 9]) {
      instance.newGame({ seed });
      expect(line(), String(seed)).toBe(`Drawn at random: ${instance.serialize().settings.worlds.map((w) => short[w]).join(', ')}`);
    }
    instance.newGame({ seed: 9, settings: { worlds: 'pick', 'world-sl': true } });
    expect(line()).toBeUndefined();
    expect(ctx.missingKeys).toEqual([]);
    instance.dispose();
  });

  it('loads the pictures of other worlds with the game that uses them and then redraws (K3)', async () => {
    const ctx = createTestContext(game as GameModule<unknown>, 'en');
    const instance = game.create(ctx.context as never);
    instance.newGame({ seed: 3, settings: { 'world-sl': true, 'world-of': true } });
    const pictured = () => [...ctx.context.root.querySelectorAll('[data-testid="hand"] .cq-tile')].filter((t) => t.querySelector('svg.cq-il')).length;
    // The world pictures load as lazy chunks; under a busy machine that takes longer than vi.waitFor's default 1 s.
    await vi.waitFor(() => expect(pictured()).toBe(ctx.context.root.querySelectorAll('[data-testid="hand"] .cq-tile').length), { timeout: 15_000, interval: 50 });
    expect(pictured()).toBeGreaterThan(0);
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
      // No worlds chosen: random worlds (owner 2026-10-21), drawn from the seed.
      expect(s.settings.worlds).toEqual(randomWorlds(4));
      expect(game.settingsOf!(s)).toEqual({ worlds: 'random', difficulty: 'sharp', opponents: 5, roundLimit: 20 });
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
        // A curse shown at the start hides the coach switch until Continue; take a seed without one.
        found = q(ctx.context.root, 'hint') !== null && q(ctx.context.root, 'coach') !== null;
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
      expect(defaults).toEqual({ worlds: 'random', 'world-kz': true, 'world-sl': false, 'world-of': false, 'world-fd': false, 'world-rw': false, 'world-bg': false, 'world-sc': false, 'world-fa': false, difficulty: 'normal', opponents: 5, roundLimit: 30 });
      // The world toggles are only shown for "Choose".
      for (const sp of specs) if (sp.kind === 'toggle') expect(sp.when, sp.id).toEqual({ worlds: ['pick'] });
      expect(game.metadata.setupInGame).toBeUndefined();
    });

    it('offers one toggle per world for "Choose"; the ticked worlds are shuffled together, none ticked means random', () => {
      const ctx = createTestContext(game as GameModule<unknown>, 'en');
      const instance = game.create(ctx.context as never);
      for (const [ticked, worlds] of [
        [{ 'world-sl': true }, ['sl']],
        [{ 'world-kz': true, 'world-of': true }, ['kz', 'of']],
        [{ 'world-kz': true, 'world-sl': true, 'world-of': true }, ['kz', 'sl', 'of']],
        [{ 'world-fd': true, 'world-rw': true }, ['fd', 'rw']],
        [{ 'world-kz': true, 'world-sl': true, 'world-of': true, 'world-fd': true, 'world-rw': true }, ['kz', 'sl', 'of', 'fd', 'rw']],
        [{ worlds: 'pick', 'world-kz': false, 'world-sl': false, 'world-of': false }, randomWorlds(5)],
        [{ worlds: 'pick', 'world-sl': 'yes', 'world-xx': true }, randomWorlds(5)],
        [{ worlds: 'random', 'world-sl': true }, randomWorlds(5)]
      ] as const) {
        instance.newGame({ seed: 5, settings: { ...ticked, opponents: 2 } as never });
        const s = instance.serialize();
        expect(s.settings.worlds, JSON.stringify(ticked)).toEqual(worlds);
        expect(isValidState(s)).toBe(true);
        for (const card of s.players.flatMap((p) => p.hand)) expect(worlds.some((w) => card.startsWith(`${w}.`)), card).toBe(true);
        // The settings of the game read back as the same toggles.
        if (s.settings.randomWorlds) expect(game.settingsOf!(s)).toMatchObject({ worlds: 'random' });
        else expect(game.settingsOf!(s)).toMatchObject({ worlds: 'pick', ...Object.fromEntries(['kz', 'sl', 'of', 'fd', 'rw', 'bg', 'sc', 'fa'].map((w) => [`world-${w}`, (worlds as readonly string[]).includes(w)])) });
      }
      instance.dispose();
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
