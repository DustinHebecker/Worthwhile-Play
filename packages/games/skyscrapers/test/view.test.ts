// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameInstance } from '@wp/game-core';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { SIDES, type SkyscrapersState } from '../src/rules';

let running: GameInstance<SkyscrapersState>[] = [];
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
const values = (root: HTMLElement) => cells(root).map((el) => Number(el.dataset.value));
const key = (el: HTMLElement, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
const openCells = (s: SkyscrapersState) => s.givens.map((g, i) => (g === 0 ? i : -1)).filter((i) => i >= 0);

describe('Skyscrapers view', () => {
  it('renders grid, clues on four sides, pad and accessible names', () => {
    const { root, instance } = setup(5);
    const s = instance.serialize();
    expect(cells(root)).toHaveLength(16);
    expect(values(root)).toEqual(s.givens);
    const board = byId(root, 'sk-board');
    expect(board.getAttribute('role')).toBe('grid');
    expect(board.getAttribute('dir')).toBe('ltr');
    expect(board.getAttribute('aria-label')).toBe('Skyscraper grid, 4 by 4');
    for (const side of SIDES) {
      for (let i = 0; i < 4; i++) {
        const el = byId(root, `clue-${side}-${i}`);
        const v = s.clues[side][i] as number;
        expect(el.dataset.value).toBe(String(v));
        expect(el.textContent).toBe(v === 0 ? '' : String(v));
        if (v !== 0) expect(el.getAttribute('aria-label')).toMatch(new RegExp(`^(Row|Column) ${i + 1}, seen from the ${side}: ${v} visible$`));
        else expect(el.getAttribute('aria-hidden')).toBe('true');
      }
    }
    const open = openCells(s)[0] as number;
    const given = s.givens.findIndex((g) => g !== 0);
    const cellEl = cells(root)[open] as HTMLElement;
    expect(cellEl.getAttribute('aria-label')).toBe(`Row ${Math.floor(open / 4) + 1}, column ${(open % 4) + 1}: empty`);
    expect(cellEl.tabIndex).toBe(0);
    expect(cellEl.getAttribute('aria-selected')).toBe('true');
    expect(cells(root)[given]?.getAttribute('aria-label')).toMatch(/\(given\)$/);
    expect(cells(root)[given]?.dataset.given).toBe('true');
    expect([1, 2, 3, 4].map((d) => byId(root, `sk-pad-${d}`).getAttribute('aria-label'))).toEqual(['Height 1', 'Height 2', 'Height 3', 'Height 4']);
    expect(byId(root, 'sk-pad-5')).toBeNull();
    expect(byId(root, 'sk-notes').getAttribute('aria-pressed')).toBe('false');
    expect(byId(root, 'sk-check-result').hidden).toBe(true);
    expect(byId(root, 'sk-status').textContent).toBe(`Filled cells: ${s.givens.filter((g) => g).length} of 16`);
    expect(root.textContent).toContain('1–4');
  });

  it('uses the difficulty for the board size', () => {
    expect(cells(setup(1, 'medium').root)).toHaveLength(25);
    expect(cells(setup(1, 'hard').root)).toHaveLength(36);
    expect(cells(setup(1, 'bogus').root)).toHaveLength(16);
  });

  it('selects a cell by tap and enters heights from the pad, saving each change', () => {
    const { root, instance, ctx } = setup(8, 'medium');
    const s = instance.serialize();
    const [a, b] = openCells(s) as [number, number];
    cells(root)[b]?.click();
    expect(cells(root)[b]?.classList.contains('is-selected')).toBe(true);
    expect(cells(root)[a]?.classList.contains('is-selected')).toBe(false);
    expect(document.activeElement).toBe(cells(root)[b]);
    byId(root, 'sk-pad-3').click();
    expect(cells(root)[b]?.dataset.value).toBe('3');
    expect(instance.serialize().cells[b]).toBe(3);
    expect(instance.serialize().moves).toBe(1);
    expect(ctx.saveRequests()).toBe(1);
    // Selecting does not save; erasing does.
    cells(root)[a]?.click();
    expect(ctx.saveRequests()).toBe(1);
    cells(root)[b]?.click();
    byId(root, 'sk-erase').click();
    expect(cells(root)[b]?.dataset.value).toBe('0');
    expect(ctx.saveRequests()).toBe(2);
  });

  it('adds pencil notes in notes mode', () => {
    const { root, instance } = setup(8, 'medium');
    const a = openCells(instance.serialize())[0] as number;
    cells(root)[a]?.click();
    byId(root, 'sk-notes').click();
    expect(byId(root, 'sk-notes').getAttribute('aria-pressed')).toBe('true');
    expect(byId(root, 'sk-pad-2').getAttribute('aria-label')).toBe('Note 2');
    byId(root, 'sk-pad-2').click();
    byId(root, 'sk-pad-5').click();
    const el = cells(root)[a] as HTMLElement;
    expect(el.dataset.notes).toBe('2,5');
    expect(el.dataset.value).toBe('0');
    expect([...el.querySelectorAll('.sk-note')].map((n) => n.textContent)).toEqual(['', '2', '', '', '5']);
    expect(el.getAttribute('aria-label')).toMatch(/empty, notes 2, 5$/);
    expect(instance.serialize().pencil).toBe(true);
  });

  it('supports keyboard: digits, N for notes, Backspace, arrows', () => {
    const { root, instance } = setup(21, 'hard');
    const s = instance.serialize();
    const a = openCells(s)[0] as number;
    const el = cells(root)[a] as HTMLElement;
    el.focus();
    key(el, '4');
    expect(el.dataset.value).toBe('4');
    key(el, '7'); // out of range for 6×6
    expect(el.dataset.value).toBe('4');
    key(el, 'Backspace');
    expect(el.dataset.value).toBe('0');
    key(el, 'n');
    key(el, '6');
    expect(el.dataset.notes).toBe('6');
    key(el, 'Delete');
    expect(el.dataset.notes).toBe('');
    expect(instance.serialize().pencil).toBe(true);
    key(el, 'N');
    expect(instance.serialize().pencil).toBe(false);
    // Arrow keys move focus and selection (board is LTR).
    const target = a % 6 < 5 ? a + 1 : a - 1;
    key(el, a % 6 < 5 ? 'ArrowRight' : 'ArrowLeft');
    expect(document.activeElement).toBe(cells(root)[target]);
    expect(cells(root)[target]?.classList.contains('is-selected')).toBe(true);
    // Modifier shortcuts are left to the browser.
    const other = cells(root)[target] as HTMLElement;
    other.dispatchEvent(new KeyboardEvent('keydown', { key: '1', ctrlKey: true, bubbles: true }));
    expect(other.dataset.value).toBe(String(s.givens[target]));
  });

  it('marks repeated digits only after Check, with text and a pattern', () => {
    const { root, instance } = setup(8, 'medium');
    const s = instance.serialize();
    const open = openCells(s);
    // Two open cells in one row.
    const row = open.find((i) => open.some((j) => j !== i && Math.floor(j / 5) === Math.floor(i / 5))) as number;
    const twin = open.find((j) => j !== row && Math.floor(j / 5) === Math.floor(row / 5)) as number;
    for (const i of [row, twin]) {
      cells(root)[i]?.click();
      byId(root, `sk-pad-${s.solution[row]}`).click();
    }
    expect(root.querySelectorAll('.is-repeated')).toHaveLength(0);
    byId(root, 'sk-check').click();
    const result = byId(root, 'sk-check-result');
    expect(result.hidden).toBe(false);
    expect(result.textContent).toBe('Wrong digits: 1. Repeated in a row or column (marked with !): 2.');
    expect(cells(root)[row]?.classList.contains('is-repeated')).toBe(true);
    expect(cells(root)[twin]?.querySelector('.sk-flag')?.textContent).toBe('!');
    expect(cells(root)[twin]?.getAttribute('aria-label')).toMatch(/repeated in its row or column$/);
    expect(instance.serialize().checks).toBe(1);
    // Any change removes the marks.
    byId(root, 'sk-erase').click();
    expect(root.querySelectorAll('.is-repeated')).toHaveLength(0);
    expect(result.hidden).toBe(true);
    byId(root, 'sk-check').click();
    expect(result.textContent).toBe('No wrong or repeated digits so far.');
  });

  it('ignores input on given cells and while paused', () => {
    const { root, instance, ctx } = setup(3, 'easy');
    const s = instance.serialize();
    const given = s.givens.findIndex((g) => g !== 0);
    cells(root)[given]?.click();
    byId(root, `sk-pad-${(s.solution[given] as number) % 4 + 1}`).click();
    expect(instance.serialize()).toEqual(s);
    const open = openCells(s)[0] as number;
    cells(root)[open]?.click();
    instance.pause();
    byId(root, 'sk-pad-1').click();
    byId(root, 'sk-notes').click();
    byId(root, 'sk-check').click();
    key(cells(root)[open] as HTMLElement, '2');
    expect(instance.serialize()).toEqual(s);
    expect(ctx.saveRequests()).toBe(0);
    instance.resume();
    byId(root, 'sk-pad-1').click();
    expect(instance.serialize().cells[open]).toBe(1);
  });

  it('finishes exactly once when solved and stays finished after restore', () => {
    const { root, instance, ctx } = setup(4, 'easy');
    const s = instance.serialize();
    for (const i of openCells(s)) {
      cells(root)[i]?.click();
      byId(root, `sk-pad-${s.solution[i]}`).click();
    }
    expect(ctx.results).toEqual([{ outcome: 'completed', stats: { moves: openCells(s).length, checks: 0 } }]);
    expect(byId(root, 'sk-status').dataset.status).toBe('solved');
    expect(byId(root, 'sk-status').textContent).toBe(`Solved! Moves: ${openCells(s).length}.`);
    expect(byId(root, 'sk-board').getAttribute('aria-readonly')).toBe('true');
    expect(root.querySelector<HTMLElement>('.sk-controls')?.hidden).toBe(true);
    // Further input does nothing.
    cells(root)[openCells(s)[0] as number]?.click();
    byId(root, 'sk-erase').click();
    expect(ctx.results).toHaveLength(1);

    const saved = instance.serialize();
    const ctx2 = createTestContext(game as never);
    const restored = game.create(ctx2.context);
    running.push(restored);
    restored.restore(saved);
    expect(ctx2.results).toEqual([]);
    expect(values(ctx2.context.root)).toEqual(s.solution);
  });

  it('restores entries, notes, pencil mode and check marks exactly', () => {
    const { root, instance } = setup(8, 'medium');
    const s = instance.serialize();
    const [a, b] = openCells(s) as [number, number];
    cells(root)[a]?.click();
    byId(root, 'sk-pad-2').click();
    byId(root, 'sk-notes').click();
    cells(root)[b]?.click();
    byId(root, 'sk-pad-4').click();
    byId(root, 'sk-check').click();
    const saved = instance.serialize();

    const ctx2 = createTestContext(game as never);
    const restored = game.create(ctx2.context);
    running.push(restored);
    restored.restore(saved);
    const root2 = ctx2.context.root;
    expect(restored.serialize()).toEqual(saved);
    expect(cells(root2)[a]?.dataset.value).toBe('2');
    expect(cells(root2)[b]?.dataset.notes).toBe('4');
    expect(byId(root2, 'sk-notes').getAttribute('aria-pressed')).toBe('true');
    expect(byId(root2, 'sk-check-result').textContent).toBe(byId(root, 'sk-check-result').textContent);
  });

  it('resets to the seeded start and starts fresh games on a used instance', () => {
    const { root, instance, ctx } = setup(8, 'medium');
    const initial = instance.serialize();
    const a = openCells(initial)[0] as number;
    cells(root)[a]?.click();
    byId(root, 'sk-pad-1').click();
    instance.reset();
    expect(instance.serialize()).toEqual(initial);
    expect(ctx.saveRequests()).toBe(2);
    instance.newGame({ seed: 99, difficulty: 'hard' });
    expect(cells(root)).toHaveLength(36);
    expect(instance.serialize().moves).toBe(0);
    expect(root.querySelectorAll('.wp-skyscrapers')).toHaveLength(1);
  });

  it('renders in Arabic with an RTL container but an LTR board', () => {
    const { root, ctx } = setup(2, 'easy', 'ar');
    expect(ctx.missingKeys).toEqual([]);
    expect(root.querySelector('.wp-skyscrapers')?.getAttribute('dir')).toBe('rtl');
    expect(byId(root, 'sk-board').getAttribute('dir')).toBe('ltr');
  });
});
