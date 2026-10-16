// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from 'vitest';
import { createTestContext } from '@wp/testing';
import type { GameModule } from '@wp/game-core';
import game, { type CardQuestState } from '../src/index';
import { createRngFromState } from '@wp/game-core';
import { isValidState, step } from '../src/rules';
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
    const next = ['start', 'open', 'rummage', 'pass', 'roll', 'end'].map((id) => q(root, id)).find((b) => b && !b.disabled);
    if (!next) throw new Error(`no action button in phase ${state.phase}`);
    next.click();
  }
  return clicks;
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

  it('sentences with a verb are only filled with computer players, never with the person', () => {
    // These templates agree the verb with {name} in some languages; the person has own keys instead.
    const NPC_ONLY = ['next.fight.react', 'next.end.give', 'next.over.lost', 'act.curse', 'act.hero.other', 'fight.forecast.other.win', 'fight.forecast.other.lose'];
    const ctx = createTestContext(game as GameModule<unknown>, 'en');
    const real = ctx.context.t;
    const misuse: string[] = [];
    const spy = Object.assign((key: string, params?: Readonly<Record<string, string | number>>) => {
      if (NPC_ONLY.includes(key) && params?.name === real('you')) misuse.push(key);
      return real(key, params);
    }, { locale: real.locale, direction: real.direction });
    const instance = game.create({ ...ctx.context, t: spy } as never);
    for (const seed of [2, 3, 4]) {
      instance.newGame({ seed });
      clickThrough(ctx.context.root, instance, 3000);
    }
    expect(misuse).toEqual([]);
    instance.dispose();
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

  it('keeps the keyboard focus inside the game after a main action', () => {
    const ctx = createTestContext(game as GameModule<unknown>, 'en');
    const instance = game.create(ctx.context as never);
    instance.newGame({ seed: 5 });
    const startButton = q(ctx.context.root, 'start')!;
    startButton.focus();
    startButton.click();
    const focused = document.activeElement as HTMLElement;
    expect(ctx.context.root.contains(focused)).toBe(true);
    expect(focused.matches('button.primary, .cq-next-text')).toBe(true);
    instance.dispose();
  });

  it('equips an item from the card detail', () => {
    const ctx = createTestContext(game as GameModule<unknown>, 'en');
    const instance = game.create(ctx.context as never);
    for (let seed = 1; seed < 50; seed++) {
      instance.newGame({ seed });
      q(ctx.context.root, 'start')!.click();
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
