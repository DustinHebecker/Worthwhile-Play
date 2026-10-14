// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { createTestContext, type TestContext } from '@wp/testing';
import { COMMON_MESSAGES, createTranslator } from '@wp/localization';
import type { GameInstance, GameModule } from '@wp/game-core';
import type { SupportedLocale } from '@wp/localization';
import game from '../src/index';
import { metadata } from '../src/metadata';
import { TICK, getPuzzle, type FlowState } from '../src/rules';
import { eventTexts, goalTexts, pipeGeometry, tankName } from '../src/view';

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const fn of cleanup) fn();
  cleanup = [];
  document.body.innerHTML = '';
});

/** Seed 0 → easy puzzle 1: A 6/8 → (valve 1) B 0/3 → (valve 2) C 0/8, B → (valve 3) D 0/4; goal C = 5. */
function start(options: { seed?: number; difficulty?: string; locale?: SupportedLocale; state?: FlowState } = {}) {
  const ctx: TestContext = createTestContext(game as GameModule<unknown>, options.locale ?? 'en');
  const instance = game.create(ctx.context) as GameInstance<FlowState>;
  if (options.state) instance.restore(options.state);
  else instance.newGame({ seed: options.seed ?? 0, ...(options.difficulty ? { difficulty: options.difficulty } : {}) });
  cleanup.push(() => instance.dispose());
  const root = ctx.context.root;
  const q = (id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
  const level = (tank: string) => q(`tank-${tank}`).getAttribute('data-level');
  const press = (key: string) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    q('fl-step').dispatchEvent(event);
    return event;
  };
  return { ctx, instance, root, q, level, press, status: () => q('fl-status').textContent ?? '' };
}

const t = createTranslator({ locale: 'en', sources: [metadata.messages, COMMON_MESSAGES] });

describe('view', () => {
  it('renders the puzzle, goal, tanks with levels and closed valves', () => {
    const { q, level, root, status } = start();
    expect(q('fl-puzzle').textContent).toBe('Puzzle 1 of 8');
    expect(q('fl-tick').textContent).toBe('Tick 0 of 10');
    expect([...q('fl-goal').querySelectorAll('li')].map((li) => li.textContent)).toEqual(['Tank C: exactly 5 L', 'Checked after tick 10.']);
    expect(level('A')).toBe('6');
    expect(level('B')).toBe('0');
    expect(q('tank-A').textContent).toContain('6/8 L');
    expect(root.querySelectorAll('[data-testid^="valve-"]')).toHaveLength(3);
    expect(q('valve-1').dataset.open).toBe('false');
    expect(q('valve-1').getAttribute('aria-label')).toBe('Valve 1: from A to B, 2 L per tick, closed');
    expect(status()).toBe('Set the valves, then press Step or Run to end.');
    expect(q('fl-undo')).toHaveProperty('disabled', true);
    expect(q('fl-reset')).toHaveProperty('disabled', true);
    expect(root.querySelector('pattern')).not.toBeNull();
  });

  it('toggles valves, steps, and explains overflow in words', () => {
    const { q, level, ctx, status } = start();
    q('valve-1').click();
    expect(q('valve-1').dataset.open).toBe('true');
    expect(q('valve-1').getAttribute('aria-pressed')).toBe('true');
    expect(ctx.saveRequests()).toBe(1);
    q('fl-step').click();
    expect(level('A')).toBe('4');
    expect(level('B')).toBe('2');
    expect(q('fl-tick').dataset.value).toBe('1');
    expect(q('fl-events').textContent).toBe('No overflow.');
    expect(status()).toBe('Tick 1 done. The valves stay as they are.');
    q('fl-step').click();
    expect(level('B')).toBe('3');
    expect(q('fl-events').textContent).toBe('Tank B overflowed: 1 L lost.');
    expect(q('fl-stats').dataset.spilled).toBe('1');
    expect(q('tank-B').classList.contains('fl-overflowed')).toBe(true);
    expect(ctx.saveRequests()).toBe(3);
  });

  it('locks valves on easy once the water runs, and explains why', () => {
    const { q, status, instance, ctx } = start();
    q('valve-1').click();
    q('fl-step').click();
    const before = instance.serialize();
    q('valve-2').click();
    expect(instance.serialize()).toEqual(before);
    expect(q('fl-status').dataset.state).toBe('blocked');
    expect(status()).toContain('locked');
    expect(q('valve-2').getAttribute('aria-disabled')).toBe('true');
    expect(ctx.saveRequests()).toBe(2);
  });

  it('solving reports ticks, changes and the minimum once; the minimum is hidden before', () => {
    const { q, ctx, status, instance } = start();
    q('valve-1').click();
    q('valve-2').click();
    expect(status()).not.toContain('Fewest');
    q('fl-run').click();
    expect(q('fl-tick').dataset.value).toBe('10');
    expect(q('tank-C').getAttribute('data-level')).toBe('5');
    expect(q('fl-status').dataset.state).toBe('solved');
    expect(status()).toBe('Solved after 10 ticks with 2 valve changes. Fewest possible: 2.');
    expect(ctx.results).toEqual([{ outcome: 'completed', stats: { ticks: 10, changes: 2, minimal: 2 } }]);
    expect(q('fl-step')).toHaveProperty('disabled', true);
    expect(q('fl-undo')).toHaveProperty('disabled', true);
    q('fl-step').click();
    q('valve-1').click();
    expect(ctx.results).toHaveLength(1);
    // Restoring a solved game does not report it again.
    const again = start({ state: instance.serialize() });
    expect(again.q('fl-status').dataset.state).toBe('solved');
    expect(again.ctx.results).toEqual([]);
  });

  it('shows a calm retry hint when all ticks pass without reaching the goal', () => {
    const { q, status, ctx } = start();
    q('fl-run').click();
    expect(q('fl-status').dataset.state).toBe('failed');
    expect(status()).toContain('not met');
    expect(q('fl-events').textContent).toBe('Nothing moved.');
    expect(ctx.results).toEqual([]);
    q('fl-undo').click();
    expect(q('fl-tick').dataset.value).toBe('9');
    q('fl-reset').click();
    expect(q('fl-tick').dataset.value).toBe('0');
  });

  it('undo and reset take back valve changes', () => {
    const { q, instance } = start({ difficulty: 'medium', seed: 0 });
    q('valve-1').click();
    q('fl-step').click();
    q('valve-2').click();
    expect(instance.serialize().actions).toEqual([0, TICK, 1]);
    q('fl-undo').click();
    expect(instance.serialize().actions).toEqual([0, TICK]);
    expect(q('valve-2').dataset.open).toBe('false');
    q('fl-reset').click();
    expect(instance.serialize().actions).toEqual([]);
    expect(q('valve-1').dataset.open).toBe('false');
  });

  it('medium lets valves change between ticks', () => {
    const { q, status } = start({ difficulty: 'medium', seed: 0 });
    expect(q('fl-tick').textContent).toBe('Tick 0 of 4');
    q('valve-1').click();
    q('fl-step').click();
    expect(status()).toBe('Tick 1 done. Change valves or keep going.');
    q('valve-1').click();
    expect(q('valve-1').dataset.open).toBe('false');
    expect(q('fl-stats').dataset.changes).toBe('2');
  });

  it('supports keyboard shortcuts', () => {
    const { q, press, instance } = start({ difficulty: 'medium', seed: 0 });
    expect(press('1').defaultPrevented).toBe(true);
    expect(q('valve-1').dataset.open).toBe('true');
    press('s');
    press('2');
    expect(instance.serialize().actions).toEqual([0, TICK, 1]);
    press('u');
    expect(instance.serialize().actions).toEqual([0, TICK]);
    press('r');
    expect(q('fl-tick').dataset.value).toBe('4');
    expect(press('9').defaultPrevented).toBe(false);
    expect(press('x').defaultPrevented).toBe(false);
  });

  it('ignores input while paused', () => {
    const { q, instance } = start();
    instance.pause();
    q('valve-1').click();
    q('fl-step').click();
    expect(instance.serialize().actions).toEqual([]);
    instance.resume();
    q('valve-1').click();
    expect(instance.serialize().actions).toEqual([0]);
  });

  it('chooses another puzzle from the picker', () => {
    const { q, instance, ctx } = start();
    const select = q('fl-puzzle-select') as HTMLSelectElement;
    expect(select.options).toHaveLength(8);
    expect(select.options[2]?.textContent).toBe('Puzzle 3');
    select.value = '6';
    q('fl-puzzle-play').click();
    expect(q('fl-puzzle').textContent).toBe('Puzzle 7 of 8');
    expect(instance.serialize().puzzle).toBe(6);
    expect(q('tank-E')).not.toBeNull();
    expect(ctx.saveRequests()).toBe(1);
    q('fl-puzzle-play').click();
    expect(ctx.saveRequests()).toBe(1);
    instance.reset();
    expect(instance.serialize()).toEqual({ seed: 0, difficulty: 'easy', puzzle: 0, actions: [] });
  });

  it('newGame on a used instance fully resets', () => {
    const { q, instance } = start();
    q('valve-1').click();
    instance.newGame({ seed: 3, difficulty: 'hard' });
    expect(instance.serialize()).toEqual({ seed: 3, difficulty: 'hard', puzzle: 3, actions: [] });
    expect(q('fl-puzzle').textContent).toBe('Puzzle 4 of 8');
  });

  it('hard puzzles show float switches and slow pipes, and report a held valve', () => {
    // Hard puzzle 2: valve 1 (A → B) has a float switch in B at 4 L.
    const { q, root } = start({ difficulty: 'hard', seed: 1 });
    expect(root.querySelector('.fl-float-label')?.textContent).toBe('F4');
    expect(q('valve-1').getAttribute('aria-label')).toContain('float switch shuts it while tank B holds 4 L or more');
    q('valve-1').click();
    q('fl-step').click();
    q('fl-step').click();
    expect(q('tank-B').getAttribute('data-level')).toBe('4');
    expect(q('valve-1').dataset.held).toBe('true');
    q('fl-step').click();
    expect(q('fl-events').textContent).toBe('A float switch kept valve 1 shut.');
    const slow = start({ difficulty: 'hard', seed: 0 });
    expect(slow.root.querySelector('.fl-slow')).not.toBeNull();
    slow.q('valve-1').click();
    slow.q('fl-step').click();
    expect(slow.q('valve-1').getAttribute('aria-label')).toContain('2 L in the pipe');
  });

  it('renders right-to-left in Arabic while the schematic keeps its geometry', () => {
    const { root, q } = start({ locale: 'ar' });
    const container = root.firstElementChild as HTMLElement;
    expect(container.getAttribute('dir')).toBe('rtl');
    expect(q('fl-schematic').getAttribute('dir')).toBe('ltr');
    expect(q('fl-step').textContent).toBe('خطوة');
  });
});

describe('view helpers', () => {
  it('names tanks with letters', () => {
    expect([0, 1, 4].map(tankName)).toEqual(['A', 'B', 'E']);
  });

  it('describes goals including the no-overflow rule', () => {
    expect(goalTexts(t, getPuzzle('medium', 1))).toEqual(['Tank B: exactly 4 L', 'Tank C: exactly 5 L', 'No water may overflow.', 'Checked after tick 5.']);
  });

  it('describes tick events', () => {
    expect(eventTexts(t, null)).toEqual([]);
    expect(eventTexts(t, { moved: [0, 0], spills: [0, 0], held: [] })).toEqual(['Nothing moved.']);
    expect(eventTexts(t, { moved: [1, 0], spills: [0, 0], held: [] })).toEqual(['No overflow.']);
    expect(eventTexts(t, { moved: [1, 0], spills: [0, 2], held: [1] })).toEqual(['Tank B overflowed: 2 L lost.', 'A float switch kept valve 2 shut.']);
  });

  it('offsets pipes that run both ways between the same tanks', () => {
    const puzzle = getPuzzle('medium', 4);
    const there = pipeGeometry(puzzle, 0);
    const back = pipeGeometry(puzzle, 2);
    expect(Math.abs(there.vy - back.vy)).toBeGreaterThanOrEqual(44);
    const plain = pipeGeometry(puzzle, 1);
    expect(plain.y1).toBeCloseTo(plain.y2);
  });
});
