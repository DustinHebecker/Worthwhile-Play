import { describe, expect, it } from 'vitest';
import { resolveSettings, type SettingSpec } from '@wp/game-core';
import game from '../src/index';

/** The start screen (ADR 0017). */
describe('Hold the Line settings', () => {
  const specs = game.settings as readonly SettingSpec[];

  it('alone there is no difficulty to choose (nobody plans against you; review of PR #107)', () => {
    expect(resolveSettings(specs, game.metadata, { mode: 'external-solo' }).visible.has('difficulty')).toBe(false);
    expect(resolveSettings(specs, game.metadata, { mode: 'vs-small' }).visible.has('difficulty')).toBe(true);
    expect(resolveSettings(specs, game.metadata, { mode: 'external-small' }).visible.has('difficulty')).toBe(true);
  });

  it('a save tells its settings; saves from before the length choice are ten-round games', () => {
    const solo = { solo: true, mode: 'external-small', difficulty: 'normal', length: 'endless' };
    expect(game.settingsOf?.(solo as never)).toMatchObject({ mode: 'external-solo', length: 'endless' });
    expect(game.settingsOf?.({ mode: 'vs-small', difficulty: 'hard' } as never)).toMatchObject({ mode: 'vs-small', length: 'rounds', difficulty: 'hard' });
  });
});
