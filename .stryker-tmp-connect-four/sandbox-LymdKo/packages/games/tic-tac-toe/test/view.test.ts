// @ts-nocheck
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameInstance, GameModule } from '@wp/game-core';
import type { SupportedLocale } from '@wp/localization';
import { createTestContext, type TestContext } from '@wp/testing';
import game from '../src/index';
import { COMPUTER_REVEAL_MS } from '../src/view';
import { isValidState, type TicTacToeState } from '../src/rules';

let instances: GameInstance<TicTacToeState>[] = [];

function mount(options: { reducedMotion?: boolean; locale?: SupportedLocale } = {}) {
  const ctx: TestContext = createTestContext(game as GameModule<unknown>, options.locale ?? 'en');
  const context = { ...ctx.context, reducedMotion: options.reducedMotion ?? true };
  const instance = game.create(context);
  instances.push(instance);
  const root = context.root;
  const cell = (i: number) => root.querySelector<HTMLButtonElement>(`[data-testid="cell-${i}"]`)!;
  const marks = () => Array.from({ length: 9 }, (_, i) => cell(i).dataset.mark).join(',');
  const status = () => root.querySelector('[data-testid="status"]')!.textContent;
  const select = (name: string, value: string) => {
    const el = root.querySelector<HTMLSelectElement>(`[data-testid="option-${name}"]`)!;
    el.value = value;
    el.dispatchEvent(new Event('change'));
  };
  const button = (id: string) => root.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`)!;
  return { ctx, instance, root, cell, marks, status, select, button };
}

afterEach(() => {
  for (const instance of instances) instance.dispose();
  instances = [];
  vi.useRealTimers();
});

describe('tic-tac-toe view', () => {
  it('renders nine cells with marks, labels and a status', () => {
    const { instance, cell, marks, status, root } = mount();
    instance.newGame({ seed: 1, difficulty: 'perfect' });
    expect(root.querySelectorAll('[data-cell]')).toHaveLength(9);
    expect(marks()).toBe(',,,,,,,,');
    expect(cell(0).getAttribute('aria-label')).toBe('Row 1, column 1: empty');
    expect(cell(5).getAttribute('aria-label')).toBe('Row 2, column 3: empty');
    expect(status()).toBe('Your turn — you play X');
    expect(cell(0).tabIndex).toBe(0);
    expect(cell(1).tabIndex).toBe(-1);
  });

  it('plays the computer’s reply in the same step and saves', () => {
    const { ctx, instance, cell, marks } = mount();
    instance.newGame({ seed: 9, difficulty: 'perfect' });
    cell(0).click();
    const state = instance.serialize();
    expect(state.moves).toHaveLength(2);
    expect(state.moves[0]).toBe(0);
    expect(cell(0).dataset.mark).toBe('X');
    expect(cell(state.moves[1]!).dataset.mark).toBe('O');
    expect(marks().split(',').filter(Boolean)).toHaveLength(2);
    expect(cell(0).getAttribute('aria-label')).toBe('Row 1, column 1: X');
    expect(cell(0).getAttribute('aria-disabled')).toBe('true');
    expect(ctx.saveRequests()).toBe(1);
    expect(isValidState(state)).toBe(true);
  });

  it('ignores clicks on occupied cells', () => {
    const { ctx, instance, cell } = mount();
    instance.newGame({ seed: 9 });
    cell(4).click();
    const before = instance.serialize();
    cell(4).click();
    expect(instance.serialize()).toEqual(before);
    expect(ctx.saveRequests()).toBe(1);
  });

  it('supports two people on one device, with undo of single moves', () => {
    const { instance, cell, status, select, button, root } = mount();
    instance.newGame({ seed: 1 });
    select('opponent', 'human');
    expect(root.querySelector<HTMLElement>('[data-testid="option-starter"]')!.closest('label')!.hidden).toBe(true);
    expect(status()).toBe('X to move');
    expect(button('undo').disabled).toBe(true);
    cell(4).click();
    expect(status()).toBe('O to move');
    cell(0).click();
    expect(instance.serialize().moves).toEqual([4, 0]);
    expect(button('undo').disabled).toBe(false);
    button('undo').click();
    expect(instance.serialize().moves).toEqual([4]);
    expect(cell(0).dataset.mark).toBe('');
    expect(status()).toBe('O to move');
  });

  it('highlights the winning line with more than colour and reports the result once', () => {
    const { ctx, instance, cell, status, select, root, button } = mount();
    instance.newGame({ seed: 1 });
    select('opponent', 'human');
    for (const i of [0, 3, 1, 4, 2]) cell(i).click();
    expect(status()).toBe('X wins with three in a row.');
    for (const i of [0, 1, 2]) {
      expect(cell(i).hasAttribute('data-winning')).toBe(true);
      expect(cell(i).classList.contains('is-winning')).toBe(true);
      expect(cell(i).getAttribute('aria-label')).toBe(`Row 1, column ${i + 1}: X, winning line`);
    }
    expect(cell(3).hasAttribute('data-winning')).toBe(false);
    const strike = root.querySelector('[data-testid="strike"]')!;
    expect(strike.hasAttribute('hidden')).toBe(false);
    expect(strike.querySelector('line')!.getAttribute('y1')).toBe('0.5');
    expect(ctx.results).toEqual([{ outcome: 'completed', stats: { moves: 5 } }]);
    expect(button('undo').disabled).toBe(true);
    // Further clicks do nothing.
    cell(8).click();
    expect(instance.serialize().moves).toHaveLength(5);

    // Restoring a finished game re-renders it without reporting it again.
    const saved = instance.serialize();
    const other = mount();
    other.instance.restore(saved);
    expect(other.status()).toBe('X wins with three in a row.');
    expect(other.cell(2).hasAttribute('data-winning')).toBe(true);
    expect(other.ctx.results).toEqual([]);
  });

  it('reports draws', () => {
    const { ctx, instance, cell, status, select } = mount();
    instance.newGame({ seed: 1 });
    select('opponent', 'human');
    for (const i of [0, 1, 2, 4, 3, 5, 7, 6, 8]) cell(i).click();
    expect(status()).toBe('Draw — the board is full.');
    expect(ctx.results).toEqual([{ outcome: 'draw', stats: { moves: 9 } }]);
  });

  it('reports a loss against the computer from the person’s perspective', () => {
    const { ctx, instance, cell, status } = mount();
    instance.newGame({ seed: 3, difficulty: 'perfect' });
    // Keep playing the lowest free cell; perfect play beats this quickly.
    for (let guard = 0; guard < 5 && ctx.results.length === 0; guard++) {
      const free = instance.serialize().moves;
      const next = [0, 1, 2, 3, 4, 5, 6, 7, 8].find((i) => !free.includes(i))!;
      cell(next).click();
    }
    expect(ctx.results).toHaveLength(1);
    expect(ctx.results[0]!.outcome).toBe('lost');
    expect(status()).toBe('The computer got three in a row.');
  });

  it('lets the computer open when it starts, and undo takes back a move pair', () => {
    const { instance, cell, select, button, status } = mount();
    instance.newGame({ seed: 11, difficulty: 'easy' });
    select('starter', 'computer');
    const opened = instance.serialize();
    expect(opened.starter).toBe('computer');
    expect(opened.moves).toHaveLength(1);
    expect(cell(opened.moves[0]!).dataset.mark).toBe('X');
    expect(status()).toBe('Your turn — you play O');
    expect(button('undo').disabled).toBe(true);
    const free = [0, 1, 2, 3, 4, 5, 6, 7, 8].find((i) => !opened.moves.includes(i))!;
    cell(free).click();
    expect(instance.serialize().moves).toHaveLength(3);
    button('undo').click();
    expect(instance.serialize().moves).toEqual(opened.moves);
  });

  it('starts a fresh seeded round when options change, keeping them in the state', () => {
    const { instance, cell, select, button } = mount();
    instance.newGame({ seed: 21, difficulty: 'medium' });
    cell(4).click();
    select('strength', 'perfect');
    expect(instance.serialize()).toEqual({ seed: 21, difficulty: 'perfect', opponent: 'computer', starter: 'human', moves: [], rng: 21 });
    cell(4).click();
    button('restart').click();
    expect(instance.serialize().moves).toEqual([]);
    expect(instance.serialize().difficulty).toBe('perfect');
  });

  it('reset returns to the seeded start, and newGame keeps opponent preferences', () => {
    const { instance, cell, select } = mount();
    instance.newGame({ seed: 2, difficulty: 'easy' });
    select('opponent', 'human');
    const start = instance.serialize();
    cell(0).click();
    instance.reset();
    expect(instance.serialize()).toEqual(start);
    instance.newGame({ seed: 3, difficulty: 'nonsense' });
    expect(instance.serialize()).toEqual({ seed: 3, difficulty: 'medium', opponent: 'human', starter: 'human', moves: [], rng: 3 });
  });

  it('delays only the drawing of the computer’s reply; the logical state is complete at once', () => {
    vi.useFakeTimers();
    const { instance, cell, marks, status, button, root } = mount({ reducedMotion: false });
    instance.newGame({ seed: 4, difficulty: 'perfect' });
    cell(4).click();
    const state = instance.serialize();
    expect(state.moves).toHaveLength(2);
    expect(isValidState(state)).toBe(true);
    expect(marks().split(',').filter(Boolean)).toEqual(['X']);
    expect(status()).toBe('The computer is thinking…');
    expect(button('undo').disabled).toBe(true);
    expect(root.querySelector('[data-testid="board"]')!.getAttribute('aria-busy')).toBe('true');
    // Input is ignored while the reply is being revealed.
    cell(state.moves[1] === 0 ? 1 : 0).click();
    expect(instance.serialize()).toEqual(state);
    vi.advanceTimersByTime(COMPUTER_REVEAL_MS);
    expect(marks().split(',').filter(Boolean)).toEqual(['X', 'O']);
    expect(status()).toBe('Your turn — you play X');
  });

  it('pause shows the full state immediately', () => {
    vi.useFakeTimers();
    const { instance, cell, marks } = mount({ reducedMotion: false });
    instance.newGame({ seed: 4 });
    cell(4).click();
    expect(marks().split(',').filter(Boolean)).toHaveLength(1);
    instance.pause();
    expect(marks().split(',').filter(Boolean)).toHaveLength(2);
    instance.resume();
    vi.runAllTimers();
    expect(marks().split(',').filter(Boolean)).toHaveLength(2);
  });

  it('announces moves through a live region', async () => {
    vi.useFakeTimers();
    const { instance, cell, select, root } = mount();
    instance.newGame({ seed: 1 });
    select('opponent', 'human');
    cell(4).click();
    vi.runAllTimers();
    const live = root.querySelector('[data-testid="announcer"]')!;
    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.textContent).toBe('X in row 2, column 2. O to move');
  });

  it('moves focus with arrow keys (roving tabindex)', () => {
    const { instance, cell } = mount();
    instance.newGame({ seed: 1 });
    cell(0).focus();
    cell(0).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(cell(1));
    cell(1).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(cell(4));
    expect(cell(4).tabIndex).toBe(0);
    expect(cell(0).tabIndex).toBe(-1);
  });

  it('lays out right-to-left locales while keeping the board grid fixed', () => {
    const { instance, root, status } = mount({ locale: 'ar' });
    instance.newGame({ seed: 1 });
    expect(root.querySelector('.wp-tic-tac-toe')!.getAttribute('dir')).toBe('rtl');
    expect(root.querySelector('[data-testid="board"]')!.getAttribute('dir')).toBe('ltr');
    expect(status()).toBe('دورك — أنت تلعب X');
  });

  it('restores a mid-game state exactly', () => {
    const { instance, cell } = mount();
    instance.newGame({ seed: 8, difficulty: 'easy' });
    cell(4).click();
    const saved = instance.serialize();
    const other = mount();
    other.instance.restore(saved);
    expect(other.instance.serialize()).toEqual(saved);
    expect(other.marks()).toBe(Array.from({ length: 9 }, (_, i) => cell(i).dataset.mark).join(','));
  });
});
