// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createTestContext } from '@wp/testing';
import { interpretSave } from '@wp/persistence';
import type { GameInstance, GameModule } from '@wp/game-core';
import game from '../src/index';
import { position, presentCount, type PeelState } from '../src/rules';

HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;

/** Envelopes written by the v1 code before the v2 rework (design v2 § 8). */
const fixture = (name: string): unknown => JSON.parse(readFileSync(`${__dirname}/fixtures/${name}.json`, 'utf8'));
const NAMES = ['v1-easy-red-fox', 'v1-hard-winter-village', 'v1-solved-koala'];

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const fn of cleanup) fn();
  cleanup = [];
  document.body.innerHTML = '';
});

function load(name: string) {
  const result = interpretSave(fixture(name), game as GameModule<PeelState>);
  if (result.status !== 'ok') throw new Error(`${name}: ${JSON.stringify(result)}`);
  return result;
}

function restore(state: PeelState) {
  const ctx = createTestContext(game as GameModule<unknown>, 'en');
  const instance = game.create(ctx.context) as GameInstance<PeelState>;
  instance.restore(state);
  cleanup.push(() => instance.dispose());
  const q = (id: string) => ctx.context.root.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
  return { ctx, instance, q };
}

describe('v1 saves (design v2 § 8)', () => {
  it('stateVersion is 2; every v1 fixture loads as ok and migrated', () => {
    expect(game.metadata.stateVersion).toBe(2);
    for (const name of NAMES) {
      const raw = fixture(name) as { stateVersion: number };
      expect(raw.stateVersion).toBe(1);
      const r = load(name);
      expect(r.migrated, name).toBe(true);
      expect(r.save.stateVersion).toBe(2);
    }
  });

  it('migrateState is the identity from v1 and refuses anything else', () => {
    const raw = fixture('v1-easy-red-fox') as { state: unknown };
    expect(game.migrateState!(raw.state, 1)).toBe(raw.state);
    expect(game.migrateState!(raw.state, 0)).toBeUndefined();
    expect(game.migrateState!(raw.state, 3)).toBeUndefined();
  });

  it('an older client meeting a v2 save reports newer-version', () => {
    const raw = fixture('v1-easy-red-fox') as Record<string, unknown>;
    const v1Module = { ...game, metadata: { ...game.metadata, stateVersion: 1 } } as GameModule<PeelState>;
    expect(interpretSave({ ...raw, stateVersion: 2 }, v1Module)).toMatchObject({ status: 'corrupt', reason: 'newer-version' });
  });

  for (const name of ['v1-easy-red-fox', 'v1-hard-winter-village']) {
    it(`${name}: the restored view shows the same position, and Undo works`, () => {
      const { save } = load(name);
      const state = save.state;
      const pos = position(state);
      const { q, instance } = restore(state);
      expect(q('pp-left').dataset.left).toBe(String(presentCount(pos)));
      pos.lanes.forEach((lane, i) => {
        const front = lane[pos.laneFront[i]!];
        if (front) expect(q(`pp-lane-${i}`).dataset.shots).toBe(String(front.n));
      });
      expect(state.picture.w).toBeLessThanOrEqual(24);
      q('pp-undo').click();
      expect(instance.serialize().moves).toEqual(state.moves.slice(0, -1));
    });
  }

  it('the solved v1 fixture shows the reveal without a second finished()', () => {
    const { save } = load('v1-solved-koala');
    const { q, ctx } = restore(save.state);
    expect(q('pp-reveal').hidden).toBe(false);
    expect(q('pp-reveal-title').textContent).toBe('Koala');
    expect(ctx.results).toEqual([]);
  });
});
