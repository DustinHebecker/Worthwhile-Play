import { describe, expect, it } from 'vitest';
import { resolveSettings, type GamePreferences } from '@wp/game-core';
import { metadata } from '../src/metadata';
import { connectFourSettings } from '../src/settings';

const prefs = (values: Record<string, unknown>): GamePreferences => ({ get: (key) => values[key], set: () => undefined });
const start = (values: Record<string, unknown>) => resolveSettings(connectFourSettings({ preferences: prefs(values) }), metadata);

describe('Four in a Row start-screen settings (ADR 0017)', () => {
  it('default to the board variant older versions remembered', () => {
    expect(start({}).settings).toMatchObject({ size: '7x6', goal: 4, rule: 'classic' });
    expect(start({ variant: { size: '9x7', connect: 5, pullOut: true } }).settings).toMatchObject({ size: '9x7', goal: 5, rule: 'pullOut' });
    expect(start({ variant: { size: '10x10', connect: 5, pullOut: true } }).settings).toMatchObject({ size: '7x6', goal: 4, rule: 'classic' });
  });

  it('preselects the game\'s own default strength', () => {
    expect(start({}).difficulty).toBe('easy');
  });
});
