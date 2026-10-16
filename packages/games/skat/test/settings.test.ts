import { describe, expect, it } from 'vitest';
import { resolveSettings, type GamePreferences } from '@wp/game-core';
import { metadata } from '../src/metadata';
import { skatSettings } from '../src/settings';

const prefs = (values: Record<string, unknown>): GamePreferences => ({ get: (key) => values[key], set: () => undefined });
const start = (values: Record<string, unknown>) => resolveSettings(skatSettings({ preferences: prefs(values) }), metadata);

describe('Skat start-screen settings (ADR 0017)', () => {
  it('preselect the game\'s own default strength (normal)', () => {
    expect(start({}).difficulty).toBe('normal');
  });

  it('default to the series options older versions remembered', () => {
    expect(start({}).settings).toEqual({ series: 6, scoring: 'simple', ramsch: false });
    expect(start({ options: { series: 12, scoring: 'seeger', ramsch: true } }).settings).toEqual({ series: 12, scoring: 'seeger', ramsch: true });
    expect(start({ options: { series: 7, scoring: 'x', ramsch: 'yes' } }).settings).toEqual({ series: 6, scoring: 'simple', ramsch: false });
  });
});
