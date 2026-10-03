// @ts-nocheck
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { createTestContext, type TestContext } from '@wp/testing';
import type { SupportedLocale } from '@wp/localization';
import type { GameInstance, GameModule } from '@wp/game-core';
import game from '../src/index';
import { createInitialState, currentBoard, minPresses, pressCell, solve, type LightsOutState } from '../src/rules';

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const fn of cleanup) fn();
  cleanup = [];
  document.body.innerHTML = '';
});

function start(options: { seed?: number; difficulty?: string; locale?: SupportedLocale; state?: LightsOutState } = {}) {
  const ctx: TestContext = createTestContext(game as GameModule<unknown>, options.locale ?? 'en');
  const instance = game.create(ctx.context) as GameInstance<LightsOutState>;
  if (options.state) instance.restore(options.state);
  else instance.newGame({ seed: options.seed ?? 1, ...(options.difficulty ? { difficulty: options.difficulty } : {}) });
  cleanup.push(() => instance.dispose());
  const root = ctx.context.root;
  const q = (id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  const cells = () => [...root.querySelectorAll<HTMLButtonElement>('[data-testid^="cell-"]')];
  const lights = () => cells().map((c) => (c.dataset.on === 'true' ? 1 : 0));
  return { ctx, instance, root, q, cells, lights };
}

describe('view', () => {
  it('renders an n×n grid per difficulty that mirrors the logical board', () => {
    for (const [difficulty, size] of [['easy', 3], ['medium', 5], ['hard', 7]] as const) {
      const { cells, lights, instance, q } = start({ seed: 9, difficulty });
      expect(cells()).toHaveLength(size * size);
      expect(q(`cell-${size - 1}-${size - 1}`)).not.toBeNull();
      expect(lights()).toEqual(createInitialState(9, difficulty).start);
      expect(instance.serialize().difficulty).toBe(difficulty);
    }
    expect(start({ difficulty: 'bogus' }).instance.serialize().difficulty).toBe('easy');
  });

  it('shows on/off by glyph and label, not colour alone', () => {
    const { cells } = start({ seed: 4 });
    for (const [i, cell] of cells().entries()) {
      const on = cell.dataset.on === 'true';
      const row = Math.floor(i / 3) + 1;
      const col = (i % 3) + 1;
      expect(cell.getAttribute('aria-label')).toBe(`Row ${row}, column ${col}: ${on ? 'on' : 'off'}`);
      expect(cell.querySelector('svg')!.classList.contains(on ? 'lo-bulb-on' : 'lo-bulb-off')).toBe(true);
      expect(cell.querySelectorAll('svg line')).toHaveLength(on ? 8 : 0);
    }
  });

  it('a click toggles the cross, counts the move, saves and announces', () => {
    const { q, lights, ctx, instance } = start({ seed: 2 });
    const before = lights();
    q('cell-1-1')!.click();
    const after = lights();
    expect(after.map((v, i) => v !== before[i])).toEqual([false, true, false, true, true, true, false, true, false]);
    expect(instance.serialize().presses).toEqual([4]);
    expect(ctx.saveRequests()).toBe(1);
    expect(q('moves')!.textContent).toBe('Moves: 1');
    expect(q('lights-on')!.textContent).toBe(`Lights on: ${after.filter(Boolean).length}`);
    expect(q('cell-1-1')!.tabIndex).toBe(0);
    expect(q('cell-0-0')!.tabIndex).toBe(-1);
  });

  it('undo restores the previous board and is disabled when there is nothing to undo', () => {
    const { q, lights, ctx } = start({ seed: 3 });
    const initial = lights();
    expect((q('undo') as HTMLButtonElement).disabled).toBe(true);
    q('cell-0-2')!.click();
    expect((q('undo') as HTMLButtonElement).disabled).toBe(false);
    q('undo')!.click();
    expect(lights()).toEqual(initial);
    expect(ctx.saveRequests()).toBe(2);
    expect(q('moves')!.textContent).toBe('Moves: 0');
  });

  it('hint highlights one cell of a shortest solution and is counted once', () => {
    const { q, root, ctx, instance } = start({ seed: 6, difficulty: 'medium' });
    q('hint')!.click();
    const marked = [...root.querySelectorAll<HTMLElement>('[data-hint="true"]')];
    expect(marked).toHaveLength(1);
    const state = instance.serialize();
    const expected = solve(state.start, 5)!.presses[0]!;
    expect(marked[0]!.dataset.testid).toBe(`cell-${Math.floor(expected / 5)}-${expected % 5}`);
    expect(marked[0]!.getAttribute('aria-label')).toMatch(/\(suggested by the hint\)$/);
    expect(q('hint-text')!.hidden).toBe(false);
    expect(q('hint-text')!.textContent).toBe(`Hint: press row ${Math.floor(expected / 5) + 1}, column ${(expected % 5) + 1}.`);
    expect(q('hints-used')!.textContent).toBe('Hints used: 1');
    q('hint')!.click();
    expect(instance.serialize().hints).toBe(1);
    expect(ctx.saveRequests()).toBe(1);
    marked[0]!.click();
    expect(root.querySelectorAll('[data-hint="true"]')).toHaveLength(0);
    expect(q('hint-text')!.hidden).toBe(true);
  });

  it('solving calls finished once with stats, then locks the board', () => {
    const { q, ctx, instance, root } = start({ seed: 12 });
    const s0 = instance.serialize();
    const solution = solve(s0.start, 3)!.presses;
    q('hint')!.click();
    for (const cell of solution) q(`cell-${Math.floor(cell / 3)}-${cell % 3}`)!.click();
    expect(ctx.results).toEqual([{ outcome: 'won', stats: { moves: solution.length, hints: 1, minimum: minPresses(s0.start, 3) } }]);
    expect(root.querySelector('.wp-lights-out')!.getAttribute('data-solved')).toBe('true');
    expect(q('status')!.hidden).toBe(false);
    expect(q('status')!.textContent).toBe(`All lights are off. Moves: ${solution.length}. Fewest possible: ${solution.length}.`);
    expect((q('hint') as HTMLButtonElement).disabled).toBe(true);
    expect((q('undo') as HTMLButtonElement).disabled).toBe(true);
    q('cell-0-0')!.click();
    expect(instance.serialize().presses).toHaveLength(solution.length);
    expect(ctx.results).toHaveLength(1);
    expect(q('cell-0-0')!.getAttribute('aria-disabled')).toBe('true');
  });

  it('restoring a solved game does not report it finished again', () => {
    let s = createInitialState(12);
    for (const cell of solve(s.start, 3)!.presses) s = pressCell(s, cell);
    const { ctx, q } = start({ state: s });
    expect(ctx.results).toEqual([]);
    expect(q('status')!.hidden).toBe(false);
  });

  it('restore renders the exact saved board, hint and counters', () => {
    const s = { ...pressCell(pressCell(createInitialState(30, 'hard'), 0), 48), hints: 3, hint: 24 };
    const { lights, q, instance } = start({ state: s });
    expect(lights()).toEqual(currentBoard(s));
    expect(q('cell-3-3')!.dataset.hint).toBe('true');
    expect(q('moves')!.textContent).toBe('Moves: 2');
    expect(q('hints-used')!.textContent).toBe('Hints used: 3');
    expect(instance.serialize()).toEqual(s);
  });

  it('newGame on a used instance starts over, switching grid size if needed', () => {
    const { q, instance, cells } = start({ seed: 1 });
    q('cell-0-0')!.click();
    q('hint')!.click();
    instance.newGame({ seed: 2, difficulty: 'hard' });
    expect(cells()).toHaveLength(49);
    expect(instance.serialize()).toEqual(createInitialState(2, 'hard'));
    expect(q('moves')!.textContent).toBe('Moves: 0');
    expect(q('hint-text')!.hidden).toBe(true);
  });

  it('ignores input while paused', () => {
    const { q, instance } = start({ seed: 1 });
    instance.pause();
    q('cell-0-0')!.click();
    q('hint')!.click();
    expect(instance.serialize().presses).toEqual([]);
    expect(instance.serialize().hints).toBe(0);
    instance.resume();
    q('cell-0-0')!.click();
    expect(instance.serialize().presses).toEqual([0]);
  });

  it('supports arrow-key navigation with a roving tabindex', () => {
    const { q } = start({ seed: 1, difficulty: 'medium' });
    const first = q('cell-0-0')!;
    first.focus();
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(q('cell-0-1'));
    q('cell-0-1')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(q('cell-1-1'));
    expect(q('cell-1-1')!.tabIndex).toBe(0);
  });

  it('renders in every locale, keeping the board left-to-right in RTL', () => {
    const { root, q } = start({ locale: 'ar' });
    expect(root.querySelector('.wp-lights-out')!.getAttribute('dir')).toBe('rtl');
    expect(q('board')!.getAttribute('dir')).toBe('ltr');
    expect(q('cell-0-0')!.getAttribute('aria-label')).toMatch(/^الصف 1، العمود 1: /);
  });

  it('dispose removes the DOM', () => {
    const { instance, root } = start();
    instance.dispose();
    expect(root.childElementCount).toBe(0);
    cleanup = [];
  });
});
