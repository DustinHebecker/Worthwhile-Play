// @ts-nocheck
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameInstance } from '@wp/game-core';
import { SUPPORTED_LOCALES } from '@wp/localization';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { cellPosition, pairs, truthTable, type ConstraintGridState } from '../src/rules';

let running: GameInstance<ConstraintGridState>[] = [];
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
const cells = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>('[data-cell]')];
const marks = (root: HTMLElement) => cells(root).map((el) => el.dataset.mark);
const key = (el: HTMLElement, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
const testIdOf = (s: ConstraintGridState, k: number) => {
  const { a, b, i, j } = cellPosition(s.kinds.length, s.size, k);
  return `cell-${a}-${b}-${i}-${j}`;
};

describe('Constraint Grid view', () => {
  it('renders clues, one grid per category pair, labels and roving tab stops', () => {
    const { root, instance } = setup(5);
    const s = instance.serialize();
    expect(s.kinds).toHaveLength(3);
    expect(cells(root)).toHaveLength(27);
    expect(root.querySelectorAll('[role="grid"]')).toHaveLength(3);
    expect(byId(root, 'block-0-1').getAttribute('aria-labelledby')).toBe('cg-block-0');
    expect(root.querySelector('#cg-block-0')?.textContent).toBe('Name × Floor');
    expect(marks(root).every((m) => m === 'unknown')).toBe(true);
    const first = byId(root, 'cell-0-1-0-0');
    expect(first.tabIndex).toBe(0);
    expect(byId(root, 'cell-0-1-0-1').tabIndex).toBe(-1);
    expect(byId(root, 'cell-0-2-0-0').tabIndex).toBe(0);
    expect(first.getAttribute('role')).toBe('gridcell');
    expect(first.getAttribute('aria-label')).toMatch(/^\S+ and Floor 1: open$/);
    for (let i = 0; i < s.clues.length; i++) {
      const clue = byId(root, `clue-${i}`);
      expect(clue.dataset.used).toBe('false');
      expect(clue.getAttribute('aria-pressed')).toBe('false');
      expect(clue.textContent).toMatch(/^[A-Z].+\.$/);
    }
    expect(byId(root, `clue-${s.clues.length}`)).toBeNull();
    expect(byId(root, 'cg-status').textContent).toBe('✓ placed: 0 of 9');
    expect(byId<HTMLInputElement>(root, 'cg-auto').checked).toBe(true);
    expect(byId<HTMLButtonElement>(root, 'cg-undo').disabled).toBe(true);
    expect(byId(root, 'cg-check-result').hidden).toBe(true);
  });

  it('uses the difficulty for the size', () => {
    expect(cells(setup(1, 'medium').root)).toHaveLength(3 * 16);
    const hard = setup(1, 'hard');
    expect(cells(hard.root)).toHaveLength(6 * 25);
    expect(hard.root.querySelectorAll('[role="grid"]')).toHaveLength(6);
    expect(byId(hard.root, 'cell-2-3-4-4')).not.toBeNull();
    expect(cells(setup(1, 'bogus').root)).toHaveLength(27);
  });

  it('cycles a cell by tap: empty → ✗ → ✓ (with auto-✗) → empty, saving each change', () => {
    const { root, instance, ctx } = setup(8);
    const cell = byId(root, 'cell-0-2-1-1');
    cell.click();
    expect(cell.dataset.mark).toBe('no');
    expect(cell.textContent).toBe('✗');
    expect(document.activeElement).toBe(cell);
    expect(cell.tabIndex).toBe(0);
    expect(byId(root, 'cell-0-2-0-0').tabIndex).toBe(-1);
    cell.click();
    expect(cell.dataset.mark).toBe('yes');
    expect(cell.textContent).toBe('✓');
    expect(cell.getAttribute('aria-label')).toMatch(/: ✓ confirmed$/);
    // Auto-✗ filled the rest of row 1 and column 1 of that block.
    for (const id of ['cell-0-2-1-0', 'cell-0-2-1-2', 'cell-0-2-0-1', 'cell-0-2-2-1']) expect(byId(root, id).dataset.mark).toBe('no');
    expect(byId(root, 'cell-0-2-0-0').dataset.mark).toBe('unknown');
    expect(byId(root, 'cell-0-1-1-1').dataset.mark).toBe('unknown');
    cell.click();
    expect(cell.dataset.mark).toBe('unknown');
    expect(ctx.saveRequests()).toBe(3);
    expect(instance.serialize().moves).toBe(3);
    expect(byId(root, 'cg-status').textContent).toBe('✓ placed: 0 of 9');
  });

  it('auto-✗ can be switched off and the choice is saved and kept for new games', () => {
    const { root, instance, ctx } = setup(8);
    const box = byId<HTMLInputElement>(root, 'cg-auto');
    box.click();
    expect(instance.serialize().autoExclude).toBe(false);
    expect(ctx.saveRequests()).toBe(1);
    const cell = byId(root, 'cell-0-1-0-0');
    cell.click();
    cell.click();
    expect(marks(root).filter((m) => m !== 'unknown')).toEqual(['yes']);
    instance.newGame({ seed: 9 });
    expect(instance.serialize().autoExclude).toBe(false);
    expect(byId<HTMLInputElement>(root, 'cg-auto').checked).toBe(false);
    instance.reset();
    expect(instance.serialize().autoExclude).toBe(false);
  });

  it('keyboard: arrows move within a grid, Space/Enter cycle, Delete clears', () => {
    const { root } = setup(3);
    const first = byId(root, 'cell-0-1-0-0');
    first.focus();
    key(first, 'ArrowRight');
    const second = byId(root, 'cell-0-1-0-1');
    expect(document.activeElement).toBe(second);
    expect(second.tabIndex).toBe(0);
    expect(first.tabIndex).toBe(-1);
    key(second, ' ');
    expect(second.dataset.mark).toBe('no');
    key(second, 'Enter');
    expect(second.dataset.mark).toBe('yes');
    key(second, 'Delete');
    expect(second.dataset.mark).toBe('unknown');
    key(second, 'Enter');
    key(second, 'Backspace');
    expect(second.dataset.mark).toBe('unknown');
    key(second, 'ArrowDown');
    expect(document.activeElement).toBe(byId(root, 'cell-0-1-1-1'));
    // Unhandled keys and modifier combinations do nothing (this cell was auto-✗ by the earlier ✓).
    const below = byId(root, 'cell-0-1-1-1');
    expect(below.dataset.mark).toBe('no');
    key(below, 'q');
    below.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', ctrlKey: true, bubbles: true }));
    expect(below.dataset.mark).toBe('no');
  });

  it('highlights the row and column of the focused cell', () => {
    const { root } = setup(3);
    const cell = byId(root, 'cell-0-1-1-1');
    cell.focus();
    expect(byId(root, 'cell-0-1-1-0').classList.contains('is-peer')).toBe(true);
    expect(byId(root, 'cell-0-1-0-1').classList.contains('is-peer')).toBe(true);
    expect(byId(root, 'cell-0-1-0-0').classList.contains('is-peer')).toBe(false);
    expect(cell.classList.contains('is-peer')).toBe(false);
    expect(byId(root, 'cell-0-2-1-1').classList.contains('is-peer')).toBe(false);
    cell.blur();
    expect(byId(root, 'cell-0-1-1-0').classList.contains('is-peer')).toBe(false);
  });

  it('ticks off clues (struck through) and saves', () => {
    const { root, instance, ctx } = setup(4);
    const clue = byId(root, 'clue-0');
    clue.click();
    expect(clue.dataset.used).toBe('true');
    expect(clue.getAttribute('aria-pressed')).toBe('true');
    expect(instance.serialize().used[0]).toBe(true);
    clue.click();
    expect(clue.dataset.used).toBe('false');
    expect(ctx.saveRequests()).toBe(2);
  });

  it('undo reverts the last change including auto-✗ marks', () => {
    const { root, ctx } = setup(6);
    byId(root, 'cell-0-1-0-0').click();
    byId(root, 'cell-0-1-0-0').click();
    expect(marks(root).filter((m) => m === 'no')).toHaveLength(4);
    byId(root, 'cg-undo').click();
    expect(marks(root).filter((m) => m !== 'unknown')).toEqual(['no']);
    byId(root, 'cg-undo').click();
    expect(marks(root).every((m) => m === 'unknown')).toBe(true);
    expect(byId<HTMLButtonElement>(root, 'cg-undo').disabled).toBe(true);
    expect(ctx.saveRequests()).toBe(4);
  });

  it('check reports only the number of contradictions', () => {
    const { root, instance } = setup(6);
    const s = instance.serialize();
    byId(root, 'cg-check').click();
    expect(byId(root, 'cg-check-result').textContent).toBe('No contradictions so far.');
    const truth = truthTable(s);
    byId(root, testIdOf(s, truth.indexOf(true))).click(); // ✗ on a true pair
    expect(byId(root, 'cg-check-result').hidden).toBe(true);
    byId(root, 'cg-check').click();
    expect(byId(root, 'cg-check-result').textContent).toBe('Marks that contradict the solution: 1.');
    expect(instance.serialize().checks).toBe(2);
  });

  it('solving finishes once, locks the board and survives restore without finishing again', () => {
    const { root, instance, ctx } = setup(12, 'medium');
    const s = instance.serialize();
    truthTable(s).forEach((t, k) => {
      if (t) {
        const cell = byId(root, testIdOf(s, k));
        while (cell.dataset.mark !== 'yes') cell.click();
      }
    });
    expect(byId(root, 'cg-status').dataset.status).toBe('solved');
    expect(byId(root, 'cg-status').textContent).toMatch(/^Solved! Moves: \d+\.$/);
    expect(ctx.results).toHaveLength(1);
    expect(ctx.results[0]?.outcome).toBe('completed');
    expect(ctx.results[0]?.stats).toEqual({ moves: instance.serialize().moves, checks: 0 });
    const before = instance.serialize();
    byId(root, 'cell-0-1-0-0').click();
    expect(instance.serialize()).toEqual(before);
    expect(root.querySelector('[role="grid"]')?.getAttribute('aria-readonly')).toBe('true');
    expect(root.querySelector<HTMLElement>('.cg-controls')?.hidden).toBe(true);

    const ctx2 = createTestContext(game as never);
    const restored = game.create(ctx2.context);
    running.push(restored);
    restored.restore(before);
    expect(ctx2.results).toHaveLength(0);
    expect(byId(ctx2.context.root, 'cg-status').dataset.status).toBe('solved');
  });

  it('restores marks, used clues and options exactly', () => {
    const { root, instance } = setup(21, 'hard');
    byId(root, 'cell-1-3-2-4').click();
    byId(root, 'cell-0-2-0-0').click();
    byId(root, 'cell-0-2-0-0').click();
    byId(root, 'clue-1').click();
    byId(root, 'cg-auto').click();
    const saved = instance.serialize();
    const ctx2 = createTestContext(game as never);
    const restored = game.create(ctx2.context);
    running.push(restored);
    restored.restore(saved);
    expect(restored.serialize()).toEqual(saved);
    const root2 = ctx2.context.root;
    expect(marks(root2)).toEqual(marks(root));
    expect(byId(root2, 'cell-1-3-2-4').dataset.mark).toBe('no');
    expect(byId(root2, 'cell-0-2-0-0').dataset.mark).toBe('yes');
    expect(byId(root2, 'clue-1').dataset.used).toBe('true');
    expect(byId<HTMLInputElement>(root2, 'cg-auto').checked).toBe(false);
    expect(byId<HTMLButtonElement>(root2, 'cg-undo').disabled).toBe(false);
  });

  it('ignores input while paused', () => {
    const { root, instance, ctx } = setup(2);
    instance.pause();
    byId(root, 'cell-0-1-0-0').click();
    key(byId(root, 'cell-0-1-0-0'), ' ');
    byId(root, 'clue-0').click();
    byId(root, 'cg-check').click();
    byId(root, 'cg-undo').click();
    byId(root, 'cg-auto').click();
    expect(byId<HTMLInputElement>(root, 'cg-auto').checked).toBe(true);
    expect(ctx.saveRequests()).toBe(0);
    instance.resume();
    byId(root, 'cell-0-1-0-0').click();
    expect(ctx.saveRequests()).toBe(1);
  });

  it('new game on a used instance fully resets', () => {
    const { root, instance } = setup(2);
    byId(root, 'cell-0-1-0-0').click();
    byId(root, 'clue-0').click();
    instance.newGame({ seed: 2 });
    const s = instance.serialize();
    expect(s.marks.every((m) => m === 0)).toBe(true);
    expect(s.used.every((u) => !u)).toBe(true);
    expect(s.moves).toBe(0);
    expect(marks(root).every((m) => m === 'unknown')).toBe(true);
    expect(root.querySelectorAll('.wp-constraint-grid')).toHaveLength(1);
  });

  it('announces changes politely', () => {
    vi.useFakeTimers();
    const { root } = setup(2);
    byId(root, 'cell-0-1-0-0').click();
    vi.advanceTimersByTime(100);
    expect(byId(root, 'cg-live').textContent).toMatch(/: ✗ ruled out$/);
    byId(root, 'cg-undo').click();
    vi.advanceTimersByTime(100);
    expect(byId(root, 'cg-live').textContent).toBe('Last change undone.');
  });

  it('renders in every locale, right-to-left for Arabic', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const { root, ctx } = setup(7, 'hard', locale);
      expect(ctx.missingKeys, locale).toEqual([]);
      const wrapper = root.querySelector<HTMLElement>('.wp-constraint-grid');
      expect(wrapper?.getAttribute('lang')).toBe(locale);
      expect(wrapper?.getAttribute('dir')).toBe(locale === 'ar' ? 'rtl' : 'ltr');
      expect(root.textContent).not.toMatch(/\{\w+\}/);
    }
  });

  it('every grid pair has N header labels per axis', () => {
    const { root, instance } = setup(9, 'hard');
    const s = instance.serialize();
    for (const [a, b] of pairs(s.kinds.length)) {
      const grid = byId(root, `block-${a}-${b}`);
      expect(grid.querySelectorAll('[role="columnheader"]')).toHaveLength(5);
      expect(grid.querySelectorAll('[role="rowheader"]')).toHaveLength(5);
      expect(grid.querySelectorAll('[role="row"]')).toHaveLength(6);
    }
  });
});
