// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createLocaleContent } from '@wp/game-core';
import { defineAdventureGame, initialState, compile, plainArt, type Catalogue } from '../src';
import { WATCHTOWER } from './fixture';
import { FIXTURE_METADATA, fixtureGame } from './game';

describe('defineAdventureGame', () => {
  const content = createLocaleContent<Catalogue>({ en: () => Promise.resolve({}) });

  it('refuses metadata whose stateVersion differs from the content version', () => {
    expect(() => defineAdventureGame({ metadata: { ...FIXTURE_METADATA, stateVersion: 2 }, adventure: WATCHTOWER, art: plainArt, content })).toThrow(
      'adventure "watchtower": metadata.stateVersion must equal contentVersion'
    );
  });

  it('refuses invalid content at definition time', () => {
    expect(() => defineAdventureGame({ metadata: FIXTURE_METADATA, adventure: { ...WATCHTOWER, endings: [] }, art: plainArt, content })).toThrow('at least one ending');
  });

  it('validates saves against the content and preloads through the content store', async () => {
    const game = fixtureGame();
    expect(game.isValidState(initialState(compile(WATCHTOWER), 1))).toBe(true);
    expect(game.isValidState({ ...initialState(compile(WATCHTOWER), 1), scene: 'moon' })).toBe(false);
    await expect(game.preload?.('de')).resolves.toBeUndefined();
    expect(game.metadata).toBe(FIXTURE_METADATA);
  });
});
