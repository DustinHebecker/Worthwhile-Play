// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from 'vitest';
import { createTestContext } from '@wp/testing';
import type { GameModule } from '@wp/game-core';
import game, { type CardQuestState } from '../src/index';
import { isValidState } from '../src/rules';

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
