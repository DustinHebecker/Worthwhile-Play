import { describe, expect, it } from 'vitest';
import { resolveSettings, type GamePreferences } from '@wp/game-core';
import { metadata } from '../src/metadata';
import { nodeConquestSettings, nodeConquestSettingsOf } from '../src/settings';
import { createGame, INTRO_MAP, MAPS_PER_SET } from '../src/rules';

const prefs = (values: Record<string, unknown>): GamePreferences => ({ get: (key) => values[key], set: () => undefined });
const start = (values: Record<string, unknown>) => resolveSettings(nodeConquestSettings({ preferences: prefs(values) }), metadata).settings;

describe('Orbit Links start-screen settings (ADR 0017)', () => {
  it('default to the opponent count older versions remembered', () => {
    expect(start({})).toEqual({ map: 'random', opponents: 1 });
    expect(start({ setup: { opponents: 3 } })).toEqual({ map: 'random', opponents: 3 });
    expect(start({ setup: { opponents: 7 } })).toEqual({ map: 'random', opponents: 1 });
  });

  it('settingsOf: the map the game number picks counts as any map; others by number; the introduction', () => {
    const seed = 20;
    const own = seed % MAPS_PER_SET;
    const other = (own + 1) % MAPS_PER_SET;
    expect(nodeConquestSettingsOf(createGame(seed, { difficulty: 'strong', map: own, opponents: 2 }))).toEqual({ difficulty: 'strong', map: 'random', opponents: 2 });
    expect(nodeConquestSettingsOf(createGame(seed, { difficulty: 'strong', map: other, opponents: 2 }))).toEqual({ difficulty: 'strong', map: String(other + 1), opponents: 2 });
    expect(nodeConquestSettingsOf(createGame(seed, { difficulty: 'beginner', map: INTRO_MAP, opponents: 1 })).map).toBe('intro');
  });
});
