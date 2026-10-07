// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { createTestContext, type TestContext } from '@wp/testing';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@wp/localization';
import type { GameInstance, GameModule } from '@wp/game-core';
import game from '../src/index';
import { RESTART, createInitialState, type SokobanState } from '../src/rules';
import { SOLUTIONS } from './solutions';

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const fn of cleanup) fn();
  cleanup = [];
  document.body.innerHTML = '';
});

/** Easy level 1 (seed 0): '#######|#   # #|# # $@#|#  .# #|##    #| ######' */
function start(options: { seed?: number; difficulty?: string; locale?: SupportedLocale; state?: SokobanState } = {}) {
  const ctx: TestContext = createTestContext(game as GameModule<unknown>, options.locale ?? 'en');
  const instance = game.create(ctx.context) as GameInstance<SokobanState>;
  if (options.state) instance.restore(options.state);
  else instance.newGame({ seed: options.seed ?? 0, ...(options.difficulty ? { difficulty: options.difficulty } : {}) });
  cleanup.push(() => instance.dispose());
  const root = ctx.context.root;
  const q = (id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
  const kind = (r: number, c: number) => q(`tile-${r}-${c}`).dataset.kind;
  const press = (key: string, init: KeyboardEventInit = {}, target: HTMLElement = q('board')) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    return event;
  };
  const value = (id: string) => Number(q(id).dataset.value);
  return { ctx, instance, root, q, kind, press, value };
}

const KEY_FOR: Record<string, string> = { u: 'ArrowUp', d: 'ArrowDown', l: 'ArrowLeft', r: 'ArrowRight' };

describe('view', () => {
  it('renders every tile with its kind, including outside space', () => {
    const { root, kind, q } = start();
    expect(root.querySelectorAll('[data-testid^="tile-"]')).toHaveLength(7 * 6);
    expect(kind(0, 0)).toBe('wall');
    expect(kind(1, 1)).toBe('floor');
    expect(kind(2, 5)).toBe('player');
    expect(kind(2, 4)).toBe('box');
    expect(kind(3, 3)).toBe('goal');
    expect(kind(5, 0)).toBe('outside');
    expect(q('tile-5-0').getAttribute('aria-hidden')).toBe('true');
    expect(q('tile-2-4').getAttribute('aria-label')).toBe('Row 3, column 5: crate');
    expect(q('level-status').textContent).toBe('Level 1 of 8');
    expect(q('board').getAttribute('dir')).toBe('ltr');
    expect(q('status').hidden).toBe(true);
  });

  it('makes the board the first focusable element (the host focuses it on a new game)', () => {
    const { root, q } = start();
    expect(root.querySelector('button, [tabindex="0"], input, select')).toBe(q('board'));
  });

  it('arrow keys and W A S D move the player and push crates', () => {
    const { press, kind, value, ctx, q } = start();
    const event = press('ArrowLeft');
    expect(event.defaultPrevented).toBe(true);
    expect(kind(2, 3)).toBe('box');
    expect(kind(2, 4)).toBe('player');
    expect(value('moves')).toBe(1);
    expect(value('pushes')).toBe(1);
    press('d', { code: 'KeyD' });
    expect(kind(2, 5)).toBe('player');
    press('s', { code: 'KeyS' });
    expect(kind(3, 5)).toBe('player');
    expect(value('moves')).toBe(3);
    expect(ctx.saveRequests()).toBe(3);
    expect(q('pushes').textContent).toBe('Pushes: 1');
  });

  it('a blocked move changes nothing and requests no save', () => {
    const { press, ctx, instance } = start();
    const before = instance.serialize();
    press('ArrowRight');
    expect(instance.serialize()).toEqual(before);
    expect(ctx.saveRequests()).toBe(0);
  });

  it('the on-screen D-pad moves the player', () => {
    const { q, kind, value } = start();
    q('move-down').click();
    expect(kind(3, 5)).toBe('player');
    q('move-up').click();
    q('move-left').click();
    expect(kind(2, 3)).toBe('box');
    expect(value('moves')).toBe(3);
  });

  it('tapping a free square walks there; tapping an adjacent crate pushes it', () => {
    const { q, kind, value, instance } = start();
    q('tile-4-2').click();
    expect(kind(4, 2)).toBe('player');
    expect(value('moves')).toBe(5);
    expect(instance.serialize().history).toEqual(['ddlll']);
    // Walk back next to the crate and tap it.
    q('tile-2-5').click();
    q('tile-2-4').click();
    expect(kind(2, 3)).toBe('box');
    expect(value('pushes')).toBe(1);
    // Walls, the player itself and unreachable squares do nothing.
    const before = instance.serialize();
    q('tile-0-0').click();
    q('tile-2-4').click();
    expect(instance.serialize()).toEqual(before);
  });

  it('undo (button, Backspace, U, Ctrl+Z) takes back steps', () => {
    const { q, press, value, instance } = start();
    for (const key of ['ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowLeft']) press(key);
    expect(value('moves')).toBe(4);
    q('undo').click();
    press('Backspace');
    press('u');
    expect(value('moves')).toBe(1);
    press('z', { ctrlKey: true });
    expect(value('moves')).toBe(0);
    expect((q('undo') as HTMLButtonElement).disabled).toBe(true);
    // Other shortcuts with Ctrl are left to the browser.
    const e = press('ArrowLeft', { ctrlKey: true });
    expect(e.defaultPrevented).toBe(false);
    expect(instance.serialize().history).toEqual([]);
  });

  it('restart is undoable', () => {
    const { q, press, kind, value, instance } = start();
    expect((q('restart') as HTMLButtonElement).disabled).toBe(true);
    press('ArrowLeft');
    press('ArrowRight');
    q('restart').click();
    expect(kind(2, 4)).toBe('box');
    expect(kind(2, 5)).toBe('player');
    expect(value('moves')).toBe(0);
    expect(instance.serialize().history).toEqual(['L', 'r', RESTART]);
    q('undo').click();
    expect(kind(2, 3)).toBe('box');
    expect(value('moves')).toBe(2);
  });

  it('keys typed into the level list or with Alt are ignored', () => {
    const { q, press, value } = start();
    press('ArrowLeft', {}, q('level-select'));
    press('ArrowLeft', { altKey: true });
    expect(value('moves')).toBe(0);
  });

  it('chooses another level of the same difficulty from the level list', () => {
    const { q, press, instance, ctx } = start({ seed: 3, difficulty: 'medium' });
    expect(q('level-status').textContent).toBe('Level 4 of 8');
    expect((q('level-select') as HTMLSelectElement).value).toBe('3');
    press('ArrowDown');
    (q('level-select') as HTMLSelectElement).value = '6';
    q('level-play').click();
    expect(instance.serialize()).toEqual({ seed: 3, difficulty: 'medium', level: 6, history: [] });
    expect(q('level-status').textContent).toBe('Level 7 of 8');
    expect(ctx.saveRequests()).toBe(2);
    // reset() goes back to the seeded level.
    instance.reset();
    expect(instance.serialize()).toEqual(createInitialState(3, 'medium'));
  });

  it('solving reports completion exactly once and locks the board', () => {
    const { press, ctx, q, value, instance } = start();
    for (const ch of SOLUTIONS.easy[0]) press(KEY_FOR[ch.toLowerCase()]!);
    expect(ctx.results).toEqual([{ outcome: 'completed', stats: { moves: 14, pushes: 2 } }]);
    expect(q('status').hidden).toBe(false);
    expect(q('status').textContent).toBe('Solved: every crate is on a goal. Moves: 14. Pushes: 2 (fewest possible: 2).');
    expect(q('tile-3-3').dataset.kind).toBe('box-on-goal');
    expect(value('goals')).toBe(1);
    expect((q('move-up') as HTMLButtonElement).disabled).toBe(true);
    expect((q('undo') as HTMLButtonElement).disabled).toBe(true);
    expect((q('restart') as HTMLButtonElement).disabled).toBe(true);
    const solved = instance.serialize();
    press('ArrowUp');
    q('tile-1-1').click();
    expect(instance.serialize()).toEqual(solved);
    expect(ctx.results).toHaveLength(1);

    // Restoring a solved game shows it solved without reporting completion again.
    const again = start({ state: solved });
    expect(again.ctx.results).toEqual([]);
    expect(again.q('status').textContent).toContain('Solved');
  });

  it('marks a crate that can no longer reach a goal and explains what to do', async () => {
    const { press, q } = start();
    for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowUp', 'ArrowRight']) press(key);
    expect(q('status').hidden).toBe(true);
    press('ArrowUp');
    expect(q('tile-1-3').dataset.kind).toBe('box');
    expect(q('tile-1-3').dataset.stuck).toBe('true');
    expect(q('tile-1-3').getAttribute('aria-label')).toBe('Row 2, column 4: crate that can no longer reach a goal');
    expect(q('status').dataset.state).toBe('stuck');
    expect(q('status').textContent).toContain('can no longer reach a goal');
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(q('announcer').textContent).toBe('Crate pushed. Crates on goals: 0 of 1. You are at row 3, column 4. A crate marked with ! can no longer reach a goal. Undo or restart the level.');
    q('undo').click();
    expect(q('status').hidden).toBe(true);
    expect(q('tile-2-3').dataset.stuck).toBe('false');
  });

  it('ignores input while paused and restores exactly', () => {
    const { press, instance, value, q } = start({ seed: 13, difficulty: 'hard' });
    press('ArrowDown');
    const mid = instance.serialize();
    instance.pause();
    press('ArrowUp');
    q('move-left').click();
    q('undo').click();
    expect(instance.serialize()).toEqual(mid);
    instance.resume();
    press('ArrowUp');
    expect(mid.history).toEqual(['d']);
    expect(value('moves')).toBe(2);
    const copy = instance.serialize();
    copy.history.push('x');
    expect(instance.serialize().history).not.toContain('x');
  });

  it('renders in every locale, right-to-left for Arabic, with the board kept left-to-right', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const { root, ctx, q } = start({ locale, seed: 5, difficulty: 'hard' });
      expect(ctx.missingKeys).toEqual([]);
      const container = root.firstElementChild as HTMLElement;
      expect(container.getAttribute('dir')).toBe(locale === 'ar' ? 'rtl' : 'ltr');
      expect(q('board').getAttribute('dir')).toBe('ltr');
    }
  });

  it('newGame on a used instance starts fresh with the new difficulty', () => {
    const { press, instance, kind } = start();
    press('ArrowLeft');
    instance.newGame({ seed: 2, difficulty: 'hard' });
    expect(instance.serialize()).toEqual(createInitialState(2, 'hard'));
    // Hard level 3: '#######|#   ..#|# $#  #|#$ #  #|#+$$  #|## #  #|#  .  #|#######'
    expect(kind(4, 1)).toBe('player-on-goal');
    instance.newGame({ seed: 2, difficulty: 'nonsense' });
    expect(instance.serialize().difficulty).toBe('easy');
  });
});
