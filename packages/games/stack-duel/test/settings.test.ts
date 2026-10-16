import { describe, expect, it } from 'vitest';
import { resolveSettings, type GamePreferences } from '@wp/game-core';
import { metadata } from '../src/metadata';
import { stackDuelSettings } from '../src/index';

const prefs = (values: Record<string, unknown>): GamePreferences => ({ get: (key) => values[key], set: () => undefined });

describe('Stack Duel start-screen settings (ADR 0017)', () => {
  it('default to the mode older versions remembered', () => {
    expect(resolveSettings(stackDuelSettings({ preferences: prefs({}) }), metadata).settings).toEqual({ mode: 'computer' });
    expect(resolveSettings(stackDuelSettings({ preferences: prefs({ mode: 'solo' }) }), metadata).settings).toEqual({ mode: 'solo' });
    expect(resolveSettings(stackDuelSettings({ preferences: prefs({ mode: 'party' }) }), metadata).settings).toEqual({ mode: 'computer' });
  });
});
