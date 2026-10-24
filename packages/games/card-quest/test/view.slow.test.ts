// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from 'vitest';
import { createTestContext } from '@wp/testing';
import type { GameModule } from '@wp/game-core';
import game from '../src/index';
import { isValidState } from '../src/rules';
import { clickThrough, personSpy } from './dom';

/*
 * Whole games through the DOM. Slow (seconds each), so mutation testing skips this file (ADR 0021); CI runs it.
 */
describe('view (whole games)', () => {
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

});
