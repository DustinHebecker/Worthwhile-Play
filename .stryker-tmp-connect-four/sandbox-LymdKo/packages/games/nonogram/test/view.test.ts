// @ts-nocheck
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameInstance } from '@wp/game-core';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { cluesOf, type NonogramState } from '../src/rules';

let running: GameInstance<NonogramState>[] = [];
afterEach(() => {
  for (const instance of running) instance.dispose();
  running = [];
  document.body.innerHTML = '';
  vi.useRealTimers();
});

function setup(seed = 11, difficulty?: string, locale: Parameters<typeof createTestContext>[1] = 'en') {
  const ctx = createTestContext(game as never, locale);
  const instance = game.create(ctx.context);
  running.push(instance);
  instance.newGame(difficulty === undefined ? { seed } : { seed, difficulty });
  return { ctx, instance, root: ctx.context.root };
}

const byId = <T extends HTMLElement = HTMLElement>(root: HTMLElement, id: string) => root.querySelector<T>(`[data-testid="${id}"]`) as T;
const cell = (root: HTMLElement, r: number, c: number) => byId(root, `cell-${r}-${c}`);
const states = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>('[data-cell]')].map((el) => el.dataset.state);
const key = (el: HTMLElement, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
const coords = (s: NonogramState, i: number) => [Math.floor(i / s.size), i % s.size] as const;

describe('Nonogram view', () => {
  it('renders the grid, clues and accessible names', () => {
    const { root, instance } = setup(5);
    const s = instance.serialize();
    expect(states(root)).toEqual(new Array(25).fill('unknown'));
    expect(byId(root, 'ng-board').getAttribute('role')).toBe('grid');
    expect(byId(root, 'ng-board').getAttribute('aria-label')).toBe('Puzzle grid, 5 by 5');
    expect(cell(root, 1, 2).getAttribute('aria-label')).toBe('Row 2, column 3: blank');
    const clues = cluesOf(s.solution, 5);
    for (let k = 0; k < 5; k++) {
      const row = byId(root, `row-clue-${k}`);
      const nums = [...row.querySelectorAll('.ng-num')].map((n) => Number(n.textContent));
      expect(nums).toEqual(clues.rows[k]?.length ? clues.rows[k] : [0]);
      expect(row.getAttribute('aria-label')).toBe(`Row ${k + 1}: ${clues.rows[k]?.length ? clues.rows[k]?.join(', ') : '0'}`);
      expect(byId(root, `col-clue-${k}`).getAttribute('aria-label')).toContain(`Column ${k + 1}: `);
    }
    expect(cell(root, 0, 0).tabIndex).toBe(0);
    expect(cell(root, 0, 1).tabIndex).toBe(-1);
    expect(byId(root, 'ng-mode-fill').getAttribute('aria-pressed')).toBe('true');
    expect(byId(root, 'ng-show-mistakes').hidden).toBe(true);
    expect(byId(root, 'ng-check-result').hidden).toBe(true);
    expect(byId(root, 'ng-status').textContent).toMatch(/^Rows and columns complete: \d+ of 10$/);
  });

  it('uses the difficulty for the board size', () => {
    expect(states(setup(1, 'medium').root)).toHaveLength(64);
    expect(states(setup(1, 'hard').root)).toHaveLength(100);
    expect(states(setup(1, 'bogus').root)).toHaveLength(25);
  });

  it('toggles fill on tap and cross in cross mode, saving each change', () => {
    const { root, ctx, instance } = setup();
    cell(root, 0, 0).click();
    expect(cell(root, 0, 0).dataset.state).toBe('filled');
    expect(cell(root, 0, 0).getAttribute('aria-label')).toBe('Row 1, column 1: filled');
    expect(ctx.saveRequests()).toBe(1);
    cell(root, 0, 0).click();
    expect(cell(root, 0, 0).dataset.state).toBe('unknown');
    byId(root, 'ng-mode-cross').click();
    expect(byId(root, 'ng-mode-cross').getAttribute('aria-pressed')).toBe('true');
    expect(instance.serialize().mode).toBe('cross');
    cell(root, 0, 1).click();
    expect(cell(root, 0, 1).dataset.state).toBe('crossed');
    expect(cell(root, 0, 1).textContent).toBe('✕');
    expect(instance.serialize().moves).toBe(3);
    expect(ctx.saveRequests()).toBe(4);
  });

  it('crosses with right-click', () => {
    const { root } = setup();
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    cell(root, 2, 2).dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(cell(root, 2, 2).dataset.state).toBe('crossed');
  });

  it('crosses with a long press and ignores the click that follows', () => {
    vi.useFakeTimers();
    const { root } = setup();
    const target = cell(root, 3, 1);
    const down = new MouseEvent('pointerdown', { bubbles: true, clientX: 5, clientY: 5 });
    Object.defineProperty(down, 'pointerType', { value: 'touch' });
    target.dispatchEvent(down);
    vi.advanceTimersByTime(500);
    expect(target.dataset.state).toBe('crossed');
    target.click();
    expect(target.dataset.state).toBe('crossed');
    // A short tap afterwards fills normally.
    const tap = new MouseEvent('pointerdown', { bubbles: true });
    Object.defineProperty(tap, 'pointerType', { value: 'touch' });
    target.dispatchEvent(tap);
    target.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
    vi.advanceTimersByTime(500);
    target.click();
    expect(target.dataset.state).toBe('filled');
  });

  it('supports the keyboard: Space fills, X crosses, Backspace clears, arrows move', () => {
    const { root } = setup();
    const first = cell(root, 0, 0);
    first.focus();
    key(first, ' ');
    expect(first.dataset.state).toBe('filled');
    key(first, 'x');
    expect(first.dataset.state).toBe('crossed');
    key(first, 'Backspace');
    expect(first.dataset.state).toBe('unknown');
    key(first, 'ArrowRight');
    expect(document.activeElement).toBe(cell(root, 0, 1));
    key(cell(root, 0, 1), 'ArrowDown');
    expect(document.activeElement).toBe(cell(root, 1, 1));
    key(cell(root, 1, 1), 'Enter');
    expect(cell(root, 1, 1).dataset.state).toBe('filled');
    expect(cell(root, 1, 1).tabIndex).toBe(0);
    expect(first.tabIndex).toBe(-1);
  });

  it('counts wrong cells on check, then marks them on request', () => {
    const { root, instance } = setup(12, 'medium');
    const s = instance.serialize();
    const wrong = s.solution.indexOf(0);
    const right = s.solution.indexOf(1);
    const [wr, wc] = coords(s, wrong);
    const [rr, rc] = coords(s, right);
    cell(root, wr, wc).click();
    cell(root, rr, rc).click();
    byId(root, 'ng-check').click();
    expect(byId(root, 'ng-check-result').textContent).toBe('Wrongly filled cells: 1.');
    expect(cell(root, wr, wc).classList.contains('is-wrong')).toBe(false);
    expect(byId(root, 'ng-show-mistakes').hidden).toBe(false);
    byId(root, 'ng-show-mistakes').click();
    expect(cell(root, wr, wc).classList.contains('is-wrong')).toBe(true);
    expect(cell(root, wr, wc).textContent).toBe('!');
    expect(cell(root, wr, wc).getAttribute('aria-label')).toBe(`Row ${wr + 1}, column ${wc + 1}: filled, marked as wrong`);
    expect(cell(root, rr, rc).classList.contains('is-wrong')).toBe(false);
    expect(byId(root, 'ng-show-mistakes').hidden).toBe(true);
    expect(instance.serialize()).toMatchObject({ checks: 1, mistakes: 1, marked: [wrong] });
    // Fixing it removes the mark and the stale result.
    cell(root, wr, wc).click();
    expect(cell(root, wr, wc).classList.contains('is-wrong')).toBe(false);
    expect(byId(root, 'ng-check-result').hidden).toBe(true);
    byId(root, 'ng-check').click();
    expect(byId(root, 'ng-check-result').textContent).toBe('No wrongly filled cells so far.');
  });

  it('marks satisfied clues with a check mark and text, not colour only', () => {
    const { root, instance } = setup(3);
    const s = instance.serialize();
    for (let c = 0; c < 5; c++) if (s.solution[c] === 1) cell(root, 0, c).click();
    const clue = byId(root, 'row-clue-0');
    expect(clue.dataset.done).toBe('true');
    expect(clue.classList.contains('is-done')).toBe(true);
    expect(clue.querySelector('.ng-done-mark')?.textContent).toBe('✓');
    expect(clue.getAttribute('aria-label')).toMatch(/, complete$/);
  });

  it('finishes once when solved, ignores further input, and restores without finishing again', () => {
    const { root, ctx, instance } = setup(21, 'easy');
    const s = instance.serialize();
    s.solution.forEach((v, i) => {
      if (v === 1) cell(root, ...coords(s, i)).click();
    });
    expect(ctx.results).toEqual([{ outcome: 'completed', stats: { moves: s.solution.filter((v) => v === 1).length, checks: 0, mistakes: 0 } }]);
    expect(byId(root, 'ng-status').textContent).toMatch(/^Picture complete! Moves: \d+\.$/);
    expect(byId(root, 'ng-status').dataset.status).toBe('solved');
    expect(byId(root, 'ng-board').classList.contains('is-solved')).toBe(true);
    const saved = instance.serialize();
    cell(root, 0, 0).click();
    expect(instance.serialize()).toEqual(saved);
    expect(ctx.results).toHaveLength(1);

    const other = setup(99);
    other.instance.restore(saved);
    expect(other.ctx.results).toEqual([]);
    expect(other.root.querySelector('.ng-controls')?.hasAttribute('hidden')).toBe(true);
    expect(other.instance.serialize()).toEqual(saved);
  });

  it('ignores input while paused', () => {
    const { root, ctx, instance } = setup();
    instance.pause();
    cell(root, 0, 0).click();
    byId(root, 'ng-check').click();
    byId(root, 'ng-mode-cross').click();
    expect(states(root)[0]).toBe('unknown');
    expect(ctx.saveRequests()).toBe(0);
    instance.resume();
    cell(root, 0, 0).click();
    expect(states(root)[0]).toBe('filled');
  });

  it('starts a fresh game on the same instance and resets to the seeded start', () => {
    const { root, instance } = setup(4);
    cell(root, 0, 0).click();
    instance.newGame({ seed: 4, difficulty: 'hard' });
    expect(states(root)).toEqual(new Array(100).fill('unknown'));
    expect(root.querySelectorAll('[data-testid^="row-clue-"]')).toHaveLength(10);
    const initial = instance.serialize();
    cell(root, 9, 9).click();
    instance.reset();
    expect(instance.serialize()).toEqual(initial);
    expect(states(root)[99]).toBe('unknown');
  });

  it('renders in Arabic with RTL direction', () => {
    const { root, ctx } = setup(2, 'easy', 'ar');
    expect(root.querySelector('.wp-nonogram')?.getAttribute('dir')).toBe('rtl');
    expect(cell(root, 0, 0).getAttribute('aria-label')).toBe('الصف 1، العمود 1: فارغة');
    expect(ctx.missingKeys).toEqual([]);
  });
});
