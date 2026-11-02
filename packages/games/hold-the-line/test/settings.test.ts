import { describe, expect, it } from 'vitest';
import { resolveSettings, type SettingSpec } from '@wp/game-core';
import game from '../src/index';
import { newGame } from '../src/rules';

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

  it('migrates saves of versions 1 and 2 as they are, but only without a `waves` field (review of PR #110)', () => {
    const shop = JSON.parse(JSON.stringify(newGame(1, 'normal', 'duel', { waves: 'shop' }))) as Record<string, unknown>;
    delete shop.waves;
    expect(game.migrateState?.(shop, 2)).toEqual(shop);
    expect(game.migrateState?.(shop, 1)).toEqual(shop);
    expect(game.migrateState?.({ ...shop, waves: 'shop' }, 2)).toBeUndefined();
    expect(game.migrateState?.(JSON.parse(JSON.stringify(newGame(1, 'normal'))), 2)).toBeUndefined();
    expect(game.migrateState?.(shop, 3)).toBeUndefined();
  });
});

