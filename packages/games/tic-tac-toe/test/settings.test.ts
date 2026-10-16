import { describe, expect, it } from 'vitest';
import { resolveSettings, type GamePreferences } from '@wp/game-core';
import { metadata } from '../src/metadata';
import { ticTacToeSettings, ticTacToeSettingsOf } from '../src/settings';
import { startVariant } from '../src/view';

const prefs = (values: Record<string, unknown>): GamePreferences => ({ get: (key) => values[key], set: () => undefined });
const start = (values: Record<string, unknown>) => resolveSettings(ticTacToeSettings({ preferences: prefs(values) }), metadata);

describe('Tic-Tac-Toe start-screen settings (ADR 0017)', () => {
  it('preselect the game\'s own default strength (medium)', () => {
    expect(start({}).difficulty).toBe('medium');
  });

  it('default to the setup older versions remembered', () => {
    expect(start({ setup: { variant: 'order-chaos', opponent: 'computer', starter: 'computer', role: 'chaos' } }).settings).toEqual({ variant: 'order-chaos', opponent: 'computer', role: 'chaos' });
    expect(start({ setup: { variant: 'nested', opponent: 'human' } }).settings).toEqual({ variant: 'nested', opponent: 'human' });
    expect(start({ setup: 'junk' }).settings).toEqual({ variant: 'classic', opponent: 'computer', starter: 'human' });
  });

  it('settingsOf reads an older save', () => {
    expect(ticTacToeSettingsOf(startVariant({ variant: 'order-chaos', opponent: 'computer', starter: 'human', role: 'chaos' }, 3, 'perfect'))).toEqual({ variant: 'order-chaos', opponent: 'computer', role: 'chaos', difficulty: 'perfect' });
    expect(ticTacToeSettingsOf(startVariant({ variant: 'classic', opponent: 'human', starter: 'computer', role: 'order' }, 3, 'easy'))).toEqual({ variant: 'classic', opponent: 'human', starter: 'computer', difficulty: 'easy' });
  });
});
