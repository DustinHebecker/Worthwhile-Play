import { describe, expect, it } from 'vitest';
import { resolveSettings, type GamePreferences } from '@wp/game-core';
import { metadata } from '../src/metadata';
import { pokerSettings } from '../src/settings';

const prefs = (values: Record<string, unknown>): GamePreferences => ({ get: (key) => values[key], set: () => undefined });
const start = (values: Record<string, unknown>) => resolveSettings(pokerSettings({ preferences: prefs(values) }), metadata).settings;

describe('Poker start-screen settings (ADR 0017)', () => {
  it('default to the number of opponents older versions remembered', () => {
    expect(start({})).toEqual({ opponents: 3 });
    expect(start({ opponents: 5 })).toEqual({ opponents: 5 });
    expect(start({ opponents: 9 })).toEqual({ opponents: 3 });
  });
});
