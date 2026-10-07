// @ts-nocheck
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameInstance } from '@wp/game-core';
import { createTestContext, type TestContext } from '@wp/testing';
import game from '../src/index';
import { findSolution, legalMoves, placeAt, progressOf, slideRange, type SlidingBlocksState } from '../src/rules';

let open: { ctx: TestContext; instance: GameInstance<SlidingBlocksState> }[] = [];

function start(seed = 0, difficulty = 'easy', locale: 'en' | 'ar' = 'en') {
  const ctx = createTestContext(game as never, locale);
  const instance = game.create(ctx.context);
  instance.newGame({ seed, difficulty });
  open.push({ ctx, instance });
  return { ctx, instance, root: ctx.context.root };
}

afterEach(() => {
  for (const { instance } of open) instance.dispose();
  open = [];
  vi.useRealTimers();
});

const q = <T extends HTMLElement = HTMLElement>(root: HTMLElement, testId: string) => {
  const el = root.querySelector<T>(`[data-testid="${testId}"]`);
  if (!el) throw new Error(`missing ${testId}`);
  return el;
};
const key = (el: HTMLElement, k: string, extra: KeyboardEventInit = {}) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...extra }));
const pointer = (el: HTMLElement, type: string, x: number, y: number) => {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  el.dispatchEvent(event);
};
const movesShown = (root: HTMLElement) => Number(q(root, 'moves').dataset.value);
const live = async (root: HTMLElement) => {
  await new Promise((resolve) => setTimeout(resolve, 40));
  return q(root, 'announcer').textContent;
};

/** Clicks the cell that slides block `id` by `delta` (far end ahead, near end behind). */
function tapMove(root: HTMLElement, state: SlidingBlocksState, id: number, delta: number) {
  const block = state.puzzle.blocks[id]!;
  const { row, col } = placeAt(block, progressOf(state).positions[id]!);
  const pos = block.orient === 'h' ? col : row;
  const target = delta > 0 ? pos + block.len - 1 + delta : pos + delta;
  const blockEl = q(root, `block-${id}`);
  if (blockEl.getAttribute('aria-pressed') !== 'true') blockEl.click();
  q(root, block.orient === 'h' ? `cell-${row}-${target}` : `cell-${target}-${col}`).click();
}

describe('rendering', () => {
  it('draws a 6 × 6 board, the exit in the star block’s row and every block with its data attributes', () => {
    const { root, instance } = start(0);
    const state = instance.serialize();
    expect(root.querySelectorAll('.sb-cell')).toHaveLength(36);
    const board = q(root, 'sb-board');
    expect(board.getAttribute('dir')).toBe('ltr');
    expect(board.getAttribute('aria-label')).toBe('Puzzle board, 6 by 6 squares');
    expect(q(root, 'sb-exit').style.gridRow).toBe(String(state.puzzle.blocks[0]!.row + 1));
    expect(q(root, 'sb-exit').getAttribute('aria-label')).toBe('Exit');
    state.puzzle.blocks.forEach((block, id) => {
      const el = q(root, `block-${id}`);
      expect(el.dataset.row).toBe(String(block.row));
      expect(el.dataset.col).toBe(String(block.col));
      expect(el.dataset.len).toBe(String(block.len));
      expect(el.dataset.orient).toBe(block.orient);
      expect(el.textContent).toBe(id === 0 ? '★' : String(id));
      expect(el.tabIndex).toBe(id === 0 ? 0 : -1);
      expect(el.getAttribute('aria-pressed')).toBe('false');
    });
    const star = q(root, 'block-0');
    expect(star.dataset.target).toBe('true');
    const { row, col } = state.puzzle.blocks[0]!;
    expect(star.getAttribute('aria-label')).toBe(`Star block, slides left and right: row ${row + 1}, columns ${col + 1} to ${col + 2}`);
    expect(q(root, 'status').hidden).toBe(true);
    expect(movesShown(root)).toBe(0);
    expect(q<HTMLButtonElement>(root, 'undo').disabled).toBe(true);
    expect(q<HTMLButtonElement>(root, 'restart').disabled).toBe(true);
    for (const dir of ['up', 'down', 'left', 'right']) expect(q<HTMLButtonElement>(root, `slide-${dir}`).disabled).toBe(true);
  });

  it('keeps the board left-to-right in a right-to-left language', () => {
    const { root } = start(0, 'easy', 'ar');
    expect(root.querySelector('.wp-sliding-blocks')?.getAttribute('dir')).toBe('rtl');
    expect(q(root, 'sb-board').getAttribute('dir')).toBe('ltr');
  });
});

describe('selection and tap input', () => {
  it('a tap selects and deselects a block and enables only its axis buttons', async () => {
    const { root, instance } = start(0);
    const blocks = instance.serialize().puzzle.blocks;
    const vertical = blocks.findIndex((b) => b.orient === 'v');
    const el = q(root, `block-${vertical}`);
    el.click();
    expect(el.getAttribute('aria-pressed')).toBe('true');
    expect(el.tabIndex).toBe(0);
    expect(await live(root)).toBe(`Block ${vertical} selected, slides up and down.`);
    expect(q<HTMLButtonElement>(root, 'slide-up').disabled).toBe(false);
    expect(q<HTMLButtonElement>(root, 'slide-down').disabled).toBe(false);
    expect(q<HTMLButtonElement>(root, 'slide-left').disabled).toBe(true);
    el.click();
    expect(el.getAttribute('aria-pressed')).toBe('false');
    expect(await live(root)).toBe('Selection cleared.');
  });

  it('tapping a cell without a selection explains what to do', async () => {
    const { root, ctx } = start(0);
    q(root, 'cell-0-0').click();
    expect(await live(root)).toBe('Select a block first, then tap where it should go.');
    expect(ctx.saveRequests()).toBe(0);
  });

  it('tapping a cell off the selected block’s line or behind an obstacle does not move', async () => {
    const { root, instance, ctx } = start(0);
    const state = instance.serialize();
    q(root, 'block-0').click();
    const { row } = state.puzzle.blocks[0]!;
    q(root, `cell-${(row + 1) % 6}-0`).click();
    expect(await live(root)).toBe('Tap a square in the selected block’s row.');
    // Beyond the star block's range to the right.
    const { max } = slideRange(state.puzzle.blocks, progressOf(state).positions, 0);
    const col = state.puzzle.blocks[0]!.col + 1 + max + 1;
    if (col < 6) {
      q(root, `cell-${row}-${col}`).click();
      expect(await live(root)).toBe('Blocked: that way is not free.');
    }
    expect(ctx.saveRequests()).toBe(0);
    expect(instance.serialize()).toEqual(state);
  });

  it('solving by taps reports moves vs optimum once, and locks the board', async () => {
    const { root, instance, ctx } = start(0);
    const initial = instance.serialize();
    const path = findSolution(initial.puzzle.blocks)!;
    path.forEach((m, i) => {
      tapMove(root, instance.serialize(), m.id, m.delta);
      expect(movesShown(root)).toBe(i + 1);
    });
    expect(ctx.saveRequests()).toBe(path.length);
    expect(ctx.results).toEqual([{ outcome: 'completed', stats: { moves: path.length, optimum: initial.puzzle.optimum } }]);
    const status = q(root, 'status');
    expect(status.hidden).toBe(false);
    expect(status.textContent).toBe(`Solved – the star block is out. Your moves: ${path.length}. Fewest possible: ${initial.puzzle.optimum}.`);
    expect(root.querySelector('.wp-sliding-blocks')?.getAttribute('data-solved')).toBe('true');
    expect(q(root, 'block-0').dataset.col).toBe('4');
    expect(await live(root)).toContain('Fewest possible');
    // Locked: no undo, no restart, no selection, no further saves or results.
    expect(q<HTMLButtonElement>(root, 'undo').disabled).toBe(true);
    expect(q<HTMLButtonElement>(root, 'restart').disabled).toBe(true);
    q(root, 'block-1').click();
    expect(q(root, 'block-1').getAttribute('aria-pressed')).toBe('false');
    key(q(root, 'block-0'), 'u');
    expect(ctx.saveRequests()).toBe(path.length);
    expect(ctx.results).toHaveLength(1);

    // Restoring a solved game shows it solved without finishing again.
    const solved = instance.serialize();
    const ctx2 = createTestContext(game as never);
    const restored = game.create(ctx2.context);
    open.push({ ctx: ctx2, instance: restored });
    restored.restore(solved);
    expect(restored.serialize()).toEqual(solved);
    expect(q(ctx2.context.root, 'status').hidden).toBe(false);
    expect(ctx2.results).toEqual([]);
  });

  it('shows no optimum before the puzzle is solved', () => {
    const { root, instance } = start(1, 'medium');
    const m = legalMoves(instance.serialize().puzzle.blocks, progressOf(instance.serialize()).positions)[0]!;
    tapMove(root, instance.serialize(), m.id, m.delta);
    expect(root.textContent).not.toContain('Fewest possible');
    expect(q(root, 'moves').textContent).toBe('Moves: 1');
  });
});

describe('buttons, keyboard and drag', () => {
  it('slide buttons move the selected block, merge into one move, and undo/restart work', () => {
    const { root, instance, ctx } = start(2);
    const state = instance.serialize();
    const positions = progressOf(state).positions;
    const id = state.puzzle.blocks.findIndex((_, i) => i > 0 && slideRange(state.puzzle.blocks, positions, i).max >= 1);
    const block = state.puzzle.blocks[id]!;
    q(root, `block-${id}`).click();
    const forward = block.orient === 'h' ? 'slide-right' : 'slide-down';
    const back = block.orient === 'h' ? 'slide-left' : 'slide-up';
    q(root, forward).click();
    expect(instance.serialize().history).toEqual([`${id}:1`]);
    expect(ctx.saveRequests()).toBe(1);
    q(root, back).click();
    expect(instance.serialize().history).toEqual([]);
    expect(movesShown(root)).toBe(0);
    q(root, forward).click();
    q(root, 'restart').click();
    expect(instance.serialize().history).toEqual([`${id}:1`, '*']);
    expect(q(root, `block-${id}`).dataset[block.orient === 'h' ? 'col' : 'row']).toBe(String(block.orient === 'h' ? block.col : block.row));
    q(root, 'undo').click();
    expect(instance.serialize().history).toEqual([`${id}:1`]);
    expect(q(root, `block-${id}`).dataset[block.orient === 'h' ? 'col' : 'row']).toBe(String((block.orient === 'h' ? block.col : block.row) + 1));
  });

  it('arrow keys move focus between blocks; once selected they slide along the axis only', async () => {
    const { root, instance } = start(3);
    const state = instance.serialize();
    const star = q(root, 'block-0');
    star.focus();
    key(star, 'ArrowDown');
    key(document.activeElement as HTMLElement, 'ArrowUp');
    const focused = document.activeElement as HTMLElement;
    expect(focused.classList.contains('sb-block')).toBe(true);
    key(focused, 'Home');
    expect(document.activeElement).toBe(star);
    key(star, 'End');
    expect(document.activeElement).toBe(q(root, `block-${state.puzzle.blocks.length - 1}`));
    expect(q(root, `block-${state.puzzle.blocks.length - 1}`).tabIndex).toBe(0);
    expect(star.tabIndex).toBe(-1);

    const positions = progressOf(state).positions;
    const id = state.puzzle.blocks.findIndex((_, i) => slideRange(state.puzzle.blocks, positions, i).max >= 1);
    const block = state.puzzle.blocks[id]!;
    const el = q(root, `block-${id}`);
    el.click();
    key(el, block.orient === 'h' ? 'ArrowUp' : 'ArrowLeft');
    expect(await live(root)).toBe(block.orient === 'h' ? 'This block slides only left and right.' : 'This block slides only up and down.');
    key(el, block.orient === 'h' ? 'ArrowRight' : 'ArrowDown');
    expect(instance.serialize().history).toEqual([`${id}:1`]);
    expect(await live(root)).toMatch(/moved to/);
    key(el, 'Escape');
    expect(el.getAttribute('aria-pressed')).toBe('false');
    key(el, 'Backspace');
    expect(instance.serialize().history).toEqual([]);
    key(el, block.orient === 'h' ? 'ArrowRight' : 'ArrowDown');
    expect(instance.serialize().history).toEqual([]);
  });

  it('Ctrl+Z undoes; keys are ignored while paused', () => {
    const { root, instance } = start(4);
    const state = instance.serialize();
    const m = legalMoves(state.puzzle.blocks, progressOf(state).positions)[0]!;
    tapMove(root, state, m.id, m.delta);
    instance.pause();
    key(q(root, 'sb-board'), 'z', { ctrlKey: true });
    q(root, 'undo').click();
    expect(instance.serialize().history).toHaveLength(1);
    instance.resume();
    key(q(root, 'sb-board'), 'z', { ctrlKey: true });
    expect(instance.serialize().history).toHaveLength(0);
  });

  it('dragging a block snaps it to whole cells within its free range', () => {
    const { root, instance } = start(5);
    const state = instance.serialize();
    const positions = progressOf(state).positions;
    const id = state.puzzle.blocks.findIndex((_, i) => slideRange(state.puzzle.blocks, positions, i).max >= 1);
    const { max } = slideRange(state.puzzle.blocks, positions, id);
    const horizontal = state.puzzle.blocks[id]!.orient === 'h';
    const el = q(root, `block-${id}`);
    const at = (d: number) => (horizontal ? [100 + d, 100] : [100, 100 + d]) as [number, number];
    pointer(el, 'pointerdown', ...at(0));
    pointer(el, 'pointermove', ...at(20));
    expect(el.style.transform).not.toBe('');
    // Far beyond the free range: clamped to `max` cells (48 px each in jsdom's fallback).
    pointer(el, 'pointermove', ...at(1000));
    expect(el.style.transform).toContain(`${max * 48}px`);
    pointer(el, 'pointerup', ...at(1000));
    el.click(); // the click that follows a drag must not toggle the selection
    expect(el.style.transform).toBe('');
    expect(instance.serialize().history).toEqual([`${id}:${max}`]);
    expect(el.getAttribute('aria-pressed')).toBe('true');
    // A tiny wobble is a tap, not a drag.
    pointer(el, 'pointerdown', ...at(0));
    pointer(el, 'pointermove', ...at(3));
    pointer(el, 'pointerup', ...at(3));
    el.click();
    expect(el.getAttribute('aria-pressed')).toBe('false');
    expect(instance.serialize().history).toEqual([`${id}:${max}`]);
  });

  it('newGame on a used instance starts fresh; reset returns to the seeded start', () => {
    const { root, instance, ctx } = start(6);
    const initial = instance.serialize();
    const m = legalMoves(initial.puzzle.blocks, progressOf(initial).positions)[0]!;
    tapMove(root, initial, m.id, m.delta);
    instance.reset();
    expect(instance.serialize()).toEqual(initial);
    expect(ctx.saveRequests()).toBe(2);
    instance.newGame({ seed: 6, difficulty: 'hard' });
    expect(instance.serialize().difficulty).toBe('hard');
    expect(instance.serialize().history).toEqual([]);
    expect(root.querySelectorAll('.sb-block')).toHaveLength(instance.serialize().puzzle.blocks.length);
  });
});
