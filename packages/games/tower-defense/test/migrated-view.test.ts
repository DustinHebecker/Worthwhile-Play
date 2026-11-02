// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { isValidState, migrateState, newGame, waveCount, wavesShown, type TdState } from '../src/rules';

/** A game saved under state version 1 (twelve waves on Fork, six on Training) and already won. */
function wonV1(mapId: string, slots: number): unknown {
  const s = JSON.parse(JSON.stringify(newGame(4, 'standard', mapId))) as Record<string, unknown> & { variants: number[]; log: unknown[] };
  s.variants = s.variants.slice(0, slots);
  s.phase = 'won';
  s.wave = slots - 1;
  s.log = Array.from({ length: slots }, () => []);
  return s;
}

describe('a game won before the longer wave plans (review of PR #106)', () => {
  it.each([
    ['fork', 12],
    ['training', 6]
  ] as const)('%s: shows the %i waves it held, not the new total', (mapId, held) => {
    const migrated = migrateState(wonV1(mapId, held), 1) as TdState;
    expect(isValidState(migrated)).toBe(true);
    expect(waveCount(migrated)).toBeGreaterThan(held);
    expect(wavesShown(migrated)).toBe(held);
    const ctx = createTestContext(game as never);
    const instance = game.create(ctx.context);
    instance.restore(migrated);
    const root = ctx.context.root;
    expect(root.querySelector('[data-testid="wave"]')!.textContent).toContain(`${held} `);
    expect(root.querySelector('[data-testid="wave"]')!.textContent).not.toContain(String(waveCount(migrated)));
    // "All 12 waves held. Core integrity left: 20" — the count of waves is the one it held.
    expect(root.querySelector('[data-testid="status"]')!.textContent).toContain(`${held} waves`);
    expect(root.querySelector('[data-testid="status"]')!.textContent).not.toContain(`${waveCount(migrated)} waves`);
    instance.dispose();
  });

  it('a game in progress shows the map’s total', () => {
    const s = newGame(1, 'standard', 'fork');
    expect(wavesShown(s)).toBe(waveCount(s));
    expect(wavesShown({ ...s, phase: 'lost' })).toBe(waveCount(s));
  });
});
