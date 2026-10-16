// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { hostSettings, resolveSettings, type GameModule } from '@wp/game-core';
import { createTestContext } from '@wp/testing';
import game from '../src/index';

const start = (options: unknown) => {
  const ctx = createTestContext(game as GameModule<unknown>, 'de');
  if (options !== undefined) ctx.preferences.set('options', options);
  return resolveSettings(hostSettings(game as GameModule<unknown>, ctx.settingsEnv), game.metadata).settings;
};

describe('Word Guess start-screen defaults (ADR 0017)', () => {
  it('follow the word language and strict mode older versions remembered, else the UI language', () => {
    expect(start(undefined)).toEqual({ language: 'de', strict: false });
    expect(start({ language: 'en', strict: true, layout: 'large' })).toEqual({ language: 'en', strict: true });
    expect(start({ language: 'xx', strict: 'yes', layout: 'large' })).toEqual({ language: 'de', strict: false });
  });
});
