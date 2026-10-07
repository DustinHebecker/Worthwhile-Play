// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameInstance } from '@wp/game-core';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { FLAGGED, REVEALED, adjacentCounts, type MinesState } from '../src/rules';

let running: GameInstance<MinesState>[] = [];
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
const cells = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>('[data-cell]')];
const states = (root: HTMLElement) => cells(root).map((el) => el.dataset.state);
const key = (el: HTMLElement, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
const at = (root: HTMLElement, i: number) => cells(root)[i] as HTMLElement;

/** Starts a game and opens cell (0,0). */
function started(seed = 11, difficulty?: string) {
  const s = setup(seed, difficulty);
  cell(s.root, 0, 0).click();
  return { ...s, state: () => s.instance.serialize() };
}

const hiddenSafe = (s: MinesState) => s.marks.findIndex((m, i) => m !== REVEALED && !(s.mines as number[]).includes(i));
const hiddenMine = (s: MinesState) => (s.mines as number[]).find((m) => s.marks[m] !== REVEALED) as number;

describe('Mine Logic view', () => {
  it('renders a covered board with accessible names and no layout yet', () => {
    const { root, instance } = setup(5);
    expect(states(root)).toEqual(new Array(64).fill('hidden'));
    const board = byId(root, 'ms-board');
    expect(board.getAttribute('role')).toBe('grid');
    expect(board.getAttribute('aria-label')).toBe('Minefield, 8 columns by 8 rows');
    expect(cell(root, 1, 2).getAttribute('aria-label')).toBe('Row 2, column 3: covered');
    expect(cell(root, 0, 0).tabIndex).toBe(0);
    expect(cell(root, 0, 1).tabIndex).toBe(-1);
    expect(byId(root, 'ms-status').dataset.status).toBe('start');
    expect(byId(root, 'ms-mines').textContent).toBe('Mines: 10');
    expect(byId(root, 'ms-flags').textContent).toBe('Flags: 0');
    expect(byId(root, 'ms-mistake').hidden).toBe(true);
    expect(byId(root, 'ms-mode-reveal').getAttribute('aria-pressed')).toBe('true');
    expect(instance.serialize().mines).toBeNull();
  });

  it('uses the difficulty for the board size', () => {
    expect(states(setup(1, 'medium').root)).toHaveLength(100);
    const hard = setup(1, 'hard').root;
    expect(states(hard)).toHaveLength(150);
    expect(byId(hard, 'ms-board').style.getPropertyValue('--ms-cols')).toBe('10');
    expect(cell(hard, 14, 9)).not.toBeNull();
    expect(states(setup(1, 'bogus').root)).toHaveLength(64);
  });

  it('opens the first cell, shows digits with data-count and saves', () => {
    const { root, ctx, state } = started(7);
    const s = state();
    expect(s.first).toBe(0);
    expect(s.mines).toHaveLength(10);
    expect(ctx.saveRequests()).toBe(1);
    const counts = adjacentCounts(8, 8, s.mines as number[]);
    s.marks.forEach((m, i) => {
      const el = at(root, i);
      if (m === REVEALED) {
        expect(el.dataset.state).toBe('revealed');
        expect(el.dataset.count).toBe(String(counts[i]));
        expect(el.textContent).toBe(counts[i] === 0 ? '' : String(counts[i]));
        expect(el.getAttribute('aria-label')).toMatch(counts[i] === 0 ? /no mines around$/ : new RegExp(`mines around: ${counts[i]}$`));
      } else {
        expect(el.dataset.state).toBe('hidden');
        expect(el.dataset.count).toBeUndefined();
      }
    });
    expect(byId(root, 'ms-status').textContent).toBe(`Safe cells left: ${54 - s.marks.filter((m) => m === REVEALED).length}`);
  });

  it('flags by right-click, flag mode and keyboard F; counts flags', () => {
    const { root, state } = started(8);
    const target = at(root, hiddenSafe(state()));
    target.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    expect(target.dataset.state).toBe('flagged');
    expect(target.querySelector('svg')).not.toBeNull();
    expect(target.getAttribute('aria-label')).toMatch(/flagged$/);
    expect(byId(root, 'ms-flags').textContent).toBe('Flags: 1');
    // The next plain click is a new press: pointerdown resets the long-press guard.
    target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' } as PointerEventInit));
    target.click(); // revealing a flagged cell does nothing
    expect(target.dataset.state).toBe('flagged');
    key(target, 'f');
    expect(target.dataset.state).toBe('hidden');
    byId(root, 'ms-mode-flag').click();
    expect(byId(root, 'ms-mode-flag').getAttribute('aria-pressed')).toBe('true');
    target.click();
    expect(target.dataset.state).toBe('flagged');
    expect(state().marks[Number(target.dataset.cell)]).toBe(FLAGGED);
  });

  it('flags on a touch long press without also acting on the following click or context menu', () => {
    vi.useFakeTimers();
    const { root, state } = started(9);
    const i = hiddenSafe(state());
    const target = at(root, i);
    target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', clientX: 5, clientY: 5 } as PointerEventInit));
    vi.advanceTimersByTime(500);
    target.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    target.click();
    expect(state().marks[i]).toBe(FLAGGED);
    // A short tap reveals; a drag cancels the long press.
    target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', clientX: 5, clientY: 5 } as PointerEventInit));
    target.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'touch', clientX: 60, clientY: 5 } as PointerEventInit));
    vi.advanceTimersByTime(500);
    expect(state().marks[i]).toBe(FLAGGED);
  });

  it('a context menu during a long press acts only once', () => {
    vi.useFakeTimers();
    const { root, state } = started(9);
    const i = hiddenSafe(state());
    const target = at(root, i);
    target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' } as PointerEventInit));
    target.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    vi.advanceTimersByTime(600);
    target.click();
    expect(state().marks[i]).toBe(FLAGGED);
  });

  it('supports keyboard navigation and Space/Enter reveals', () => {
    const { root, instance } = setup(12);
    const first = cell(root, 0, 0);
    first.focus();
    key(first, 'ArrowRight');
    expect(document.activeElement).toBe(cell(root, 0, 1));
    key(cell(root, 0, 1), ' ');
    expect(cell(root, 0, 1).dataset.state).toBe('revealed');
    expect(instance.serialize().first).toBe(1);
    // Enter follows the mode: in flag mode it flags.
    const s = instance.serialize();
    const i = hiddenSafe(s);
    byId(root, 'ms-mode-flag').click();
    key(at(root, i), 'Enter');
    expect(instance.serialize().marks[i]).toBe(FLAGGED);
    // Space always reveals (here: on a flagged cell, nothing).
    key(at(root, i), ' ');
    expect(instance.serialize().marks[i]).toBe(FLAGGED);
    // Modifier keys and other keys are ignored.
    at(root, i).dispatchEvent(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true }));
    key(at(root, i), 'q');
    expect(instance.serialize().marks[i]).toBe(FLAGGED);
  });

  it('chords a satisfied number by tapping it', () => {
    const { root, instance } = started(11, 'medium');
    let s = instance.serialize();
    const mines = s.mines as number[];
    const counts = adjacentCounts(10, 10, mines);
    const nbrs = (i: number) => [i - 11, i - 10, i - 9, i - 1, i + 1, i + 9, i + 10, i + 11].filter((n) => n >= 0 && n < 100 && Math.abs((n % 10) - (i % 10)) <= 1);
    const target = s.marks.findIndex((m, i) => m === REVEALED && (counts[i] as number) > 0 && nbrs(i).some((n) => s.marks[n] !== REVEALED && !mines.includes(n)));
    for (const n of nbrs(target)) if (mines.includes(n)) at(root, n).dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    at(root, target).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' } as PointerEventInit));
    at(root, target).click();
    s = instance.serialize();
    for (const n of nbrs(target)) expect(s.marks[n]).toBe(mines.includes(n) ? FLAGGED : REVEALED);
  });

  it('a revealed mine waits calmly for undo, which is counted', () => {
    const { root, ctx, state } = started(13);
    const m = hiddenMine(state());
    at(root, m).click();
    expect(at(root, m).dataset.state).toBe('mine');
    expect(at(root, m).classList.contains('is-exploded')).toBe(true);
    expect(at(root, m).getAttribute('aria-label')).toMatch(/: mine$/);
    expect(byId(root, 'ms-status').dataset.status).toBe('mistake');
    expect(byId(root, 'ms-mistake').hidden).toBe(false);
    expect(document.activeElement).toBe(byId(root, 'ms-undo'));
    expect(ctx.results).toEqual([]);
    // Board input is blocked meanwhile.
    const safe = hiddenSafe(state());
    at(root, safe).click();
    expect(state().marks[safe]).not.toBe(REVEALED);
    byId(root, 'ms-undo').click();
    expect(state().exploded).toBeNull();
    expect(state().undos).toBe(1);
    expect(at(root, m).dataset.state).toBe('hidden');
    expect(byId(root, 'ms-mistake').hidden).toBe(true);
    expect(document.activeElement).toBe(at(root, m));
  });

  it('showing the whole board ends the game once as "lost" and marks wrong flags', () => {
    const { root, ctx, state } = started(14);
    const wrong = hiddenSafe(state());
    at(root, wrong).dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    at(root, wrong).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' } as PointerEventInit));
    at(root, hiddenMine(state())).click();
    byId(root, 'ms-show').click();
    const s = state();
    expect(s.shown).toBe(true);
    expect(ctx.results).toEqual([{ outcome: 'lost', stats: { moves: s.moves, undos: 0 } }]);
    for (const mine of s.mines as number[]) expect(at(root, mine).dataset.state).toBe('mine');
    expect(at(root, wrong).classList.contains('is-wrong-flag')).toBe(true);
    expect(at(root, wrong).getAttribute('aria-label')).toMatch(/flagged, but safe$/);
    expect(byId(root, 'ms-status').dataset.status).toBe('shown');
    expect(byId(root, 'ms-mistake').hidden).toBe(true);
    expect(byId(root, 'ms-board').getAttribute('aria-readonly')).toBe('true');
  });

  it('clearing every safe cell wins exactly once and survives restore without re-finishing', () => {
    const { root, ctx, instance, state } = started(15);
    const mines = state().mines as number[];
    for (let i = 0; i < 64; i++) if (!mines.includes(i) && state().marks[i] !== REVEALED) at(root, i).click();
    const s = state();
    expect(ctx.results).toEqual([{ outcome: 'won', stats: { moves: s.moves, undos: 0 } }]);
    expect(byId(root, 'ms-status').dataset.status).toBe('won');
    expect(byId(root, 'ms-status').textContent).toBe(`Minefield cleared! Moves: ${s.moves}. Undone reveals: 0.`);
    for (const m of mines) expect(at(root, m).dataset.state).toBe('flagged');
    // Further taps do nothing.
    at(root, mines[0] as number).click();
    expect(state()).toEqual(s);
    // Restoring the finished game re-renders it but does not finish again.
    const ctx2 = createTestContext(game as never);
    const other = game.create(ctx2.context);
    running.push(other);
    other.restore(s);
    expect(other.serialize()).toEqual(s);
    expect(ctx2.results).toEqual([]);
    expect(byId(ctx2.context.root, 'ms-status').dataset.status).toBe('won');
    instance.dispose();
  });

  it('restores a pending mistake exactly', () => {
    const { root, state } = started(16);
    at(root, hiddenMine(state())).click();
    const saved = state();
    const ctx2 = createTestContext(game as never);
    const other = game.create(ctx2.context);
    running.push(other);
    other.restore(saved);
    expect(other.serialize()).toEqual(saved);
    expect(byId(ctx2.context.root, 'ms-mistake').hidden).toBe(false);
    expect(states(ctx2.context.root)).toEqual(states(root));
  });

  it('ignores input while paused and resets to the seeded start', () => {
    const { root, instance, ctx } = setup(17);
    instance.pause();
    cell(root, 0, 0).click();
    byId(root, 'ms-mode-flag').click();
    expect(instance.serialize().mines).toBeNull();
    expect(instance.serialize().mode).toBe('reveal');
    instance.resume();
    cell(root, 3, 3).click();
    expect(instance.serialize().first).toBe(27);
    instance.reset();
    expect(instance.serialize()).toEqual(setup(17).instance.serialize());
    expect(ctx.saveRequests()).toBe(2);
    expect(states(root).every((st) => st === 'hidden')).toBe(true);
  });

  it('newGame on a used instance starts completely fresh', () => {
    const { instance, root } = started(18);
    instance.newGame({ seed: 19, difficulty: 'medium' });
    expect(instance.serialize().mines).toBeNull();
    expect(instance.serialize().seed).toBe(19);
    expect(states(root)).toEqual(new Array(100).fill('hidden'));
  });

  it('renders right-to-left for Arabic', () => {
    const { root } = setup(20, 'easy', 'ar');
    const container = root.querySelector('.wp-minesweeper') as HTMLElement;
    expect(container.getAttribute('dir')).toBe('rtl');
    expect(container.getAttribute('lang')).toBe('ar');
  });
});
