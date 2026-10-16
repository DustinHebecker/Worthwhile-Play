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
    it('does not appear for a computer player (it speaks to "you")', () => {
      const s = step(caught(1, true), 1, { a: 'roll' })!;
      expect(s.log.some((e) => e.e === 'flee' && !e.ok)).toBe(true);
      expect(pageText(s, () => undefined)).not.toContain(sentence);
    });
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
