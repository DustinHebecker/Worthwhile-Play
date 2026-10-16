// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { hostSettings, resolveSettings, type GameModule } from '@wp/game-core';
import { createTestContext } from '@wp/testing';
import game from '../src/index';

const start = (cards: unknown) => {
  const ctx = createTestContext(game as GameModule<unknown>, 'en');
  if (cards !== undefined) ctx.preferences.set('cards', cards);
  return resolveSettings(hostSettings(game as GameModule<unknown>, ctx.settingsEnv), game.metadata).settings;
};

describe('Memory start-screen settings (ADR 0017)', () => {
  it('default to the cards older versions remembered, while they are still on offer', () => {
    expect(start(undefined)).toEqual({ cards: 'symbols' });
    expect(start('flag-country')).toEqual({ cards: 'flag-country' });
    // An imported deck that is gone (or junk) falls back to the symbols.
    expect(start('own:user-gone')).toEqual({ cards: 'symbols' });
    expect(start(42)).toEqual({ cards: 'symbols' });
  });
});
