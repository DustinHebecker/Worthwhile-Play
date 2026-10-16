import { describe, expect, it } from 'vitest';
import { resolveSettings, type GamePreferences } from '@wp/game-core';
import { metadata } from '../src/metadata';
import { chessSettings, chessSettingsOf } from '../src/settings';
import { createGame } from '../src/rules';

const prefs = (values: Record<string, unknown>): GamePreferences => ({ get: (key) => values[key], set: () => undefined });
const defaults = (values: Record<string, unknown>) => resolveSettings(chessSettings({ preferences: prefs(values) }), metadata).settings;

describe('chess start-screen settings (ADR 0017)', () => {
  it('default to the in-game menu choices older versions remembered', () => {
    expect(defaults({})).toEqual({ game: 'computer', color: 'w' });
    expect(defaults({ menu: { opponent: 'human', humanColor: 'b', mode: 'play', mateN: 3 } })).toEqual({ game: 'human' });
    expect(defaults({ menu: { opponent: 'computer', humanColor: 'random', mode: 'play', mateN: 3 } })).toEqual({ game: 'computer', color: 'random' });
    expect(defaults({ menu: { opponent: 'computer', humanColor: 'b', mode: 'mate', mateN: 3 } })).toEqual({ game: 'mate', mateN: 3 });
    expect(defaults({ menu: { opponent: 7, humanColor: 'pink', mode: 'x', mateN: 9 } })).toEqual({ game: 'computer', color: 'w' });
    expect(defaults({ menu: 'junk' })).toEqual({ game: 'computer', color: 'w' });
  });

  it('settingsOf reads an older save: two people, a random colour, a puzzle', () => {
    const human = createGame({ seed: 4, difficulty: 'strong', opponent: 'human', humanColor: 'w', puzzle: 0 });
    expect(chessSettingsOf(human)).toMatchObject({ game: 'human', difficulty: 'strong' });
    const random = createGame({ seed: 4, difficulty: 'intermediate', opponent: 'computer', humanColor: 'random', puzzle: 0 });
    expect(chessSettingsOf(random)).toMatchObject({ game: 'computer', color: 'random', difficulty: 'intermediate' });
    const mate = createGame({ seed: 4, difficulty: 'beginner', opponent: 'computer', humanColor: 'w', mode: 'mate', mateN: 2, puzzle: 1 });
    expect(chessSettingsOf(mate)).toMatchObject({ game: 'mate', mateN: 2 });
  });
});
