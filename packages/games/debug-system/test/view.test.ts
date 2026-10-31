// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { GameInstance } from '@wp/game-core';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { createInitialState, passingFixes, type DebugState } from '../src/rules';

let running: GameInstance<DebugState>[] = [];
afterEach(() => {
  for (const instance of running) instance.dispose();
  running = [];
  document.body.innerHTML = '';
});

function setup(seed = 4, difficulty = 'medium', locale: Parameters<typeof createTestContext>[1] = 'en') {
  const ctx = createTestContext(game as never, locale);
  const instance = game.create(ctx.context) as GameInstance<DebugState>;
  running.push(instance);
  instance.newGame({ seed, difficulty });
  return { ctx, instance, root: ctx.context.root };
}

const byId = (root: HTMLElement, id: string) => {
  const el = root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  if (!el) throw new Error(`missing ${id}`);
  return el;
};

describe('Fix the Machine view', () => {
  it('renders rules, tests with a failing case and the step control', () => {
    const { root, instance } = setup();
    const state = instance.serialize();
    state.rules.forEach((_, i) => expect(byId(root, `ds-rule-${i}`).getAttribute('aria-label')).toContain(`Rule ${i + 1}`));
    const passes = state.tests.map((_, k) => byId(root, `ds-test-${k}`).dataset.pass);
    expect(passes).toContain('false');
    expect(byId(root, 'ds-status').dataset.phase).toBe('start');
    expect(root.querySelector('[data-testid="ds-check"]')).toBeNull();
  });

  it('steps through the run and shows applied/skipped marks', () => {
    const { root, instance, ctx } = setup();
    byId(root, 'ds-step').click();
    expect(instance.serialize().cursor).toBe(1);
    expect(byId(root, 'ds-mark-0').textContent).toMatch(/applied|skipped/);
    expect(byId(root, 'ds-mark-1').textContent).toContain('next');
    expect(byId(root, 'ds-position').dataset.cursor).toBe('1');
    expect(ctx.saveRequests()).toBe(1);
    const n = instance.serialize().rules.length;
    for (let i = 1; i < n; i++) byId(root, 'ds-step').click();
    expect(byId(root, 'ds-step').textContent).toBe('Start over');
    byId(root, 'ds-step').click();
    expect(instance.serialize().cursor).toBe(0);
    expect(instance.serialize().stepsViewed).toBe(n);
  });

  it('selects another test case', () => {
    const { root, instance } = setup();
    byId(root, 'ds-test-1').click();
    expect(instance.serialize().test).toBe(1);
    expect(byId(root, 'ds-test-1').getAttribute('aria-pressed')).toBe('true');
  });

  it('counts a wrong fix, then solves and finishes exactly once', () => {
    const { root, instance, ctx } = setup();
    const state = instance.serialize();
    const [[bi, bj]] = passingFixes(state.rules, state.tests, state.options) as [[number, number]];
    const wrong: [number, number] = bi === 0 ? [0, (bj + 1) % 4] : [0, 0];
    byId(root, `ds-rule-${wrong[0]}`).click();
    expect((byId(root, 'ds-check') as HTMLButtonElement).disabled).toBe(true);
    byId(root, `ds-fix-${wrong[1]}`).click();
    byId(root, 'ds-check').click();
    expect(byId(root, 'ds-status').dataset.phase).toBe('wrong');
    expect(byId(root, `ds-fix-${wrong[1]}`).textContent).toContain('tried');
    expect(byId(root, 'ds-stats').dataset.wrong).toBe('1');
    byId(root, `ds-rule-${bi}`).click();
    byId(root, `ds-fix-${bj}`).click();
    byId(root, 'ds-check').click();
    expect(byId(root, 'ds-status').dataset.phase).toBe('solved');
    state.tests.forEach((_, k) => expect(byId(root, `ds-test-${k}`).dataset.pass).toBe('true'));
    expect(ctx.results).toEqual([{ outcome: 'won', stats: { stepsViewed: 0, wrongPicks: 1 } }]);
    // Restoring a solved game renders it without finishing again.
    const saved = instance.serialize();
    instance.restore(saved);
    expect(ctx.results).toHaveLength(1);
    expect(byId(root, 'ds-status').dataset.phase).toBe('solved');
  });

  it('ignores input while paused and resets to the seeded start', () => {
    const { root, instance } = setup();
    const initial = instance.serialize();
    instance.pause();
    byId(root, 'ds-step').click();
    expect(instance.serialize()).toEqual(initial);
    instance.resume();
    byId(root, 'ds-step').click();
    instance.reset();
    expect(instance.serialize()).toEqual(initial);
  });

  it('newGame fully resets a used instance', () => {
    const { root, instance } = setup(4, 'hard');
    byId(root, 'ds-step').click();
    byId(root, 'ds-rule-0').click();
    instance.newGame({ seed: 4, difficulty: 'hard' });
    expect(instance.serialize()).toEqual(createInitialState(4, 'hard'));
  });

  it('renders right-to-left in Arabic', () => {
    const { root } = setup(4, 'easy', 'ar');
    expect(root.querySelector('.wp-debug-system')?.getAttribute('dir')).toBe('rtl');
    expect(root.querySelector('.ds-code')?.getAttribute('dir')).toBe('ltr');
  });
});
