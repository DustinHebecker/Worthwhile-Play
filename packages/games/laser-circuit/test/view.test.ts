// @ts-nocheck
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestContext, type TestContext } from '@wp/testing';
import type { GameInstance, GameModule } from '@wp/game-core';
import type { SupportedLocale } from '@wp/localization';
import game from '../src/index';
import { createInitialState, placePiece, type LaserState } from '../src/rules';

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const fn of cleanup) fn();
  cleanup = [];
  document.body.innerHTML = '';
  vi.useRealTimers();
});

/**
 * Easy level 1 (seed 0):
 *   .  /  .  .  <R
 *   .  .  .  .  #
 *   .  .  .  .  .
 *   TR .  .  .  .
 *   .  .  .  .  .
 * The red beam runs left along row 1 and down column 2; a mirror / at row 4, column 2 solves it.
 */
function start(options: { seed?: number; difficulty?: string; locale?: SupportedLocale; state?: LaserState; reducedMotion?: boolean } = {}) {
  const ctx: TestContext = createTestContext(game as GameModule<unknown>, options.locale ?? 'en');
  const context = options.reducedMotion === false ? { ...ctx.context, reducedMotion: false } : ctx.context;
  const instance = game.create(context) as GameInstance<LaserState>;
  if (options.state) instance.restore(options.state);
  else instance.newGame({ seed: options.seed ?? 0, ...(options.difficulty ? { difficulty: options.difficulty } : {}) });
  cleanup.push(() => instance.dispose());
  const root = ctx.context.root;
  const q = (id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
  const cell = (r: number, c: number) => q(`cell-${r}-${c}`);
  const press = (key: string, target: HTMLElement, init: KeyboardEventInit = {}) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    return event;
  };
  return { ctx, instance, root, q, cell, press };
}

describe('view', () => {
  it('renders the board with elements, light and the inventory', () => {
    const { root, q, cell } = start();
    expect(root.querySelectorAll('[data-testid^="cell-"]')).toHaveLength(25);
    expect(cell(0, 4).dataset.element).toBe('emitter');
    expect(cell(0, 4).dataset.lit).toBe('');
    expect(cell(0, 3).dataset.element).toBe('empty');
    expect(cell(0, 3).dataset.lit).toBe('R');
    expect(cell(0, 1).dataset.element).toBe('mirror');
    expect(cell(0, 1).dataset.placed).toBe('false');
    expect(cell(4, 1).dataset.lit).toBe('R');
    expect(cell(1, 4).dataset.element).toBe('blocker');
    expect(cell(3, 0).dataset.element).toBe('target');
    expect(cell(3, 0).dataset.lit).toBe('');
    expect(cell(3, 0).getAttribute('aria-label')).toBe('Row 4, column 1: target – needs red, receives no light');
    expect(cell(0, 4).getAttribute('aria-label')).toBe('Row 1, column 5: laser (red), pointing left');
    expect(cell(0, 3).getAttribute('aria-label')).toBe('Row 1, column 4: empty, light: red');
    expect(cell(0, 1).getAttribute('aria-label')).toBe('Row 1, column 2: fixed mirror, tilted like /');
    expect(q('inv-mirror').dataset.count).toBe('1');
    expect(q('inv-mirror').getAttribute('aria-pressed')).toBe('true');
    expect(q('inv-mirror').getAttribute('aria-label')).toBe('Mirror: 1 left');
    expect(root.querySelector('[data-testid="inv-splitter"]')).toBeNull();
    expect(q('level-status').textContent).toBe('Level 1 of 8');
    expect(q('targets').textContent).toBe('Targets correct: 0 of 1');
    expect(q('moves').dataset.value).toBe('0');
    expect(q('status').hidden).toBe(true);
    expect(q('undo')).toHaveProperty('disabled', true);
    expect(q('clear')).toHaveProperty('disabled', true);
    expect(q('mode-remove')).toHaveProperty('disabled', true);
    expect(q('board').getAttribute('dir')).toBe('ltr');
  });

  it('draws beams as lines with one pattern lane per primary colour', () => {
    const { cell } = start({ difficulty: 'medium', seed: 1 });
    // Medium level 2: a white laser in the bottom row enters a yellow filter (white below it, yellow above).
    const lines = (r: number, c: number) => [...cell(r, c).querySelectorAll('.lc-beam')].map((l) => l.getAttribute('class'));
    expect(cell(5, 2).dataset.element).toBe('emitter');
    expect(cell(4, 2).dataset.lit).toBe('W');
    expect(lines(4, 2).sort()).toEqual(['lc-beam lc-beam-b', 'lc-beam lc-beam-g', 'lc-beam lc-beam-g', 'lc-beam lc-beam-r', 'lc-beam lc-beam-r']);
    expect(cell(3, 2).dataset.lit).toBe('Y');
    expect(lines(3, 2).sort()).toEqual(['lc-beam lc-beam-g', 'lc-beam lc-beam-g', 'lc-beam lc-beam-r', 'lc-beam lc-beam-r']);
    expect(cell(1, 0).querySelectorAll('.lc-beam')).toHaveLength(0);
  });

  it('makes a square the first focusable element (the host focuses it on a new game)', () => {
    const { root, cell } = start();
    expect(root.querySelector('button, [tabindex="0"], input, select')).toBe(cell(0, 0));
  });

  it('places, turns, removes and undoes by tapping', () => {
    const { q, cell, ctx } = start();
    cell(2, 1).click();
    expect(cell(2, 1).dataset.element).toBe('mirror');
    expect(cell(2, 1).dataset.placed).toBe('true');
    expect(cell(2, 1).dataset.orient).toBe('0');
    expect(cell(2, 0).dataset.lit).toBe('R');
    expect(cell(3, 1).dataset.lit).toBe('');
    expect(cell(2, 1).getAttribute('aria-label')).toBe('Row 3, column 2: your mirror, tilted like /');
    expect(q('inv-mirror').dataset.count).toBe('0');
    expect(q('moves').dataset.value).toBe('1');
    expect(ctx.saveRequests()).toBe(1);

    cell(2, 1).click();
    expect(cell(2, 1).dataset.orient).toBe('1');
    expect(cell(2, 2).dataset.lit).toBe('R');
    expect(ctx.saveRequests()).toBe(2);

    // No mirror left: tapping another empty square changes nothing.
    cell(4, 4).click();
    expect(cell(4, 4).dataset.element).toBe('empty');
    expect(ctx.saveRequests()).toBe(2);

    q('mode-remove').click();
    expect(q('mode-remove').getAttribute('aria-pressed')).toBe('true');
    expect(q('inv-mirror').getAttribute('aria-pressed')).toBe('false');
    cell(2, 1).click();
    expect(cell(2, 1).dataset.element).toBe('empty');
    expect(q('inv-mirror').dataset.count).toBe('1');
    expect(q('mode-remove').getAttribute('aria-pressed')).toBe('false');
    expect(q('moves').dataset.value).toBe('3');

    q('undo').click();
    expect(cell(2, 1).dataset.orient).toBe('1');
    expect(q('moves').dataset.value).toBe('2');
    q('clear').click();
    expect(cell(2, 1).dataset.element).toBe('empty');
    expect(q('moves').dataset.value).toBe('0');
    q('undo').click();
    expect(cell(2, 1).dataset.element).toBe('mirror');
    expect(ctx.saveRequests()).toBe(6);
  });

  it('refuses to change fixed squares', () => {
    const { cell, ctx, q } = start();
    cell(0, 1).click();
    cell(0, 4).click();
    expect(cell(0, 1).dataset.orient).toBe('0');
    expect(ctx.saveRequests()).toBe(0);
    expect(q('moves').dataset.value).toBe('0');
  });

  it('finishes once when solved and locks the board', () => {
    const { cell, q, ctx, root } = start();
    cell(3, 1).click();
    expect(cell(3, 0).dataset.lit).toBe('R');
    expect(cell(3, 0).getAttribute('aria-label')).toBe('Row 4, column 1: target – needs red and receives it');
    expect(ctx.results).toEqual([{ outcome: 'completed', stats: { moves: 1 } }]);
    expect(q('status').hidden).toBe(false);
    expect(q('status').textContent).toBe('Solved: every target receives its colour and no forbidden sensor is lit. Moves: 1.');
    expect((root.firstElementChild as HTMLElement).dataset.solved).toBe('true');
    expect(q('undo')).toHaveProperty('disabled', true);
    expect(q('inv-mirror')).toHaveProperty('disabled', true);
    cell(3, 1).click();
    expect(cell(3, 1).dataset.orient).toBe('0');
    expect(ctx.results).toHaveLength(1);
    expect(ctx.saveRequests()).toBe(1);
  });

  it('does not report a restored solved game as finished again', () => {
    const solved = placePiece(createInitialState(0), 16, 'mirror');
    const { ctx, q } = start({ state: solved });
    expect(q('status').dataset.state).toBe('solved');
    expect(ctx.results).toEqual([]);
  });

  it('warns when a forbidden sensor is lit', () => {
    // Easy level 3 (seed 2): green laser along row 3; a mirror \ at row 3, column 2 sends it down onto the sensor.
    const { cell, q } = start({ seed: 2 });
    expect(cell(3, 1).dataset.element).toBe('sensor');
    cell(2, 1).click();
    cell(2, 1).click();
    expect(cell(3, 1).dataset.lit).toBe('G');
    expect(q('status').dataset.state).toBe('warning');
    expect(q('status').textContent).toBe('A forbidden sensor is lit – keep the light away from it.');
    expect(cell(3, 1).getAttribute('aria-label')).toBe('Row 4, column 2: forbidden sensor, lit (green)');
  });

  it('supports the keyboard: arrows, P, R, Delete, number keys and undo', () => {
    // Easy level 8 (seed 7): one mirror and one splitter.
    const { cell, q, press, ctx } = start({ seed: 7 });
    cell(0, 0).focus();
    press('ArrowRight', cell(0, 0));
    expect(document.activeElement).toBe(cell(0, 1));
    press('ArrowDown', cell(0, 1));
    expect(document.activeElement).toBe(cell(1, 1));
    expect(press('p', cell(1, 1)).defaultPrevented).toBe(true);
    expect(cell(1, 1).dataset.element).toBe('mirror');
    press('2', cell(1, 1));
    expect(q('inv-splitter').getAttribute('aria-pressed')).toBe('true');
    press('P', cell(1, 1));
    expect(cell(1, 1).dataset.element).toBe('mirror');
    press('r', cell(1, 1));
    expect(cell(1, 1).dataset.orient).toBe('1');
    press('Delete', cell(1, 1));
    expect(cell(1, 1).dataset.element).toBe('empty');
    press('u', cell(1, 1));
    expect(cell(1, 1).dataset.orient).toBe('1');
    press('z', cell(1, 1), { ctrlKey: true });
    expect(cell(1, 1).dataset.orient).toBe('0');
    press('p', cell(0, 0));
    expect(cell(0, 0).dataset.element).toBe('splitter');
    press('Backspace', cell(0, 0));
    expect(cell(0, 0).dataset.element).toBe('empty');
    press('1', cell(0, 0));
    expect(q('inv-mirror').getAttribute('aria-pressed')).toBe('true');
    expect(ctx.saveRequests()).toBe(7);
  });

  it('takes a piece back with a long press or a right click', () => {
    vi.useFakeTimers();
    const { cell, ctx } = start({ seed: 7 });
    cell(0, 0).click();
    expect(cell(0, 0).dataset.element).toBe('mirror');
    cell(0, 0).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'touch' }));
    vi.advanceTimersByTime(600);
    expect(cell(0, 0).dataset.element).toBe('empty');
    // The click that ends the long press must not place a new piece.
    cell(0, 0).click();
    expect(cell(0, 0).dataset.element).toBe('empty');
    cell(0, 0).click();
    // The selection moved on to the splitter when the only mirror was placed.
    expect(cell(0, 0).dataset.element).toBe('splitter');
    // A short press is a normal tap (it turns the splitter).
    cell(0, 0).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'touch' }));
    vi.advanceTimersByTime(200);
    cell(0, 0).dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    cell(0, 0).click();
    vi.advanceTimersByTime(600);
    expect(cell(0, 0).dataset.element).toBe('splitter');
    expect(cell(0, 0).dataset.orient).toBe('1');
    // Sliding the finger away cancels the long press; a mouse never starts one.
    cell(0, 0).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'touch', clientX: 10, clientY: 10 }));
    cell(0, 0).dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 40, clientY: 10 }));
    vi.advanceTimersByTime(600);
    cell(0, 0).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'mouse' }));
    vi.advanceTimersByTime(600);
    expect(cell(0, 0).dataset.element).toBe('splitter');
    const menu = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    cell(0, 0).dispatchEvent(menu);
    expect(menu.defaultPrevented).toBe(true);
    expect(cell(0, 0).dataset.element).toBe('empty');
    expect(ctx.saveRequests()).toBe(5);
  });

  it('chooses another level from the list', () => {
    const { q, cell } = start();
    const select = q('level-select') as HTMLSelectElement;
    expect(select.options).toHaveLength(8);
    expect(select.options[2]!.textContent).toBe('Level 3');
    select.value = '4';
    q('level-play').click();
    expect(q('level-status').textContent).toBe('Level 5 of 8');
    expect(cell(0, 3).dataset.element).toBe('emitter');
  });

  it('ignores input while paused', () => {
    const { instance, cell, ctx } = start();
    instance.pause();
    cell(2, 1).click();
    expect(cell(2, 1).dataset.element).toBe('empty');
    instance.resume();
    cell(2, 1).click();
    expect(cell(2, 1).dataset.element).toBe('mirror');
    expect(ctx.saveRequests()).toBe(1);
  });

  it('starts fresh on newGame and restores an exact state', () => {
    const { instance, cell, q } = start({ seed: 7 });
    cell(0, 0).click();
    const saved = instance.serialize();
    instance.newGame({ seed: 3, difficulty: 'hard' });
    expect(q('level-status').textContent).toBe('Level 4 of 8');
    expect(instance.serialize()).toEqual(createInitialState(3, 'hard'));
    instance.restore(saved);
    expect(cell(0, 0).dataset.element).toBe('mirror');
    expect(instance.serialize()).toEqual(saved);
  });

  it('renders right-to-left text with a left-to-right board, and animates beams only without reduced motion', () => {
    const { root, q } = start({ locale: 'ar' });
    const container = root.firstElementChild as HTMLElement;
    expect(container.getAttribute('dir')).toBe('rtl');
    expect(q('board').getAttribute('dir')).toBe('ltr');
    expect(container.classList.contains('lc-reduced')).toBe(true);
    const moving = start({ reducedMotion: false });
    expect((moving.root.firstElementChild as HTMLElement).classList.contains('lc-reduced')).toBe(false);
  });
});
