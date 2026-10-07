// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameInstance } from '@wp/game-core';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { isSolved, kindOf, rotateCCW, rotateCW, rotationOf, type CircuitState } from '../src/rules';

let running: GameInstance<CircuitState>[] = [];
afterEach(() => {
  for (const instance of running) instance.dispose();
  running = [];
  document.body.innerHTML = '';
  vi.useRealTimers();
});

function setup(seed = 11, difficulty?: string, locale: Parameters<typeof createTestContext>[1] = 'en') {
  const ctx = createTestContext(game as never, locale);
  const instance = game.create(ctx.context) as GameInstance<CircuitState>;
  running.push(instance);
  instance.newGame(difficulty === undefined ? { seed } : { seed, difficulty });
  return { ctx, instance, root: ctx.context.root };
}

const byId = (root: HTMLElement, id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`) as HTMLElement;
const tile = (root: HTMLElement, r: number, c: number) => byId(root, `tile-${r}-${c}`);
const key = (el: HTMLElement, k: string, shiftKey = false) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, shiftKey, bubbles: true, cancelable: true }));

/** Clicks every tile until it matches the generated solution. */
function solveByClicks(root: HTMLElement, s: CircuitState) {
  for (let i = 0; i < s.masks.length; i++) {
    const el = tile(root, Math.floor(i / s.size), i % s.size);
    for (let k = 0; k < 4 && Number(el.dataset.mask) !== s.solution[i]; k++) el.click();
  }
}

describe('Circuit view', () => {
  it('renders tiles with type, rotation and power attributes', () => {
    const { root, instance } = setup(5);
    const s = instance.serialize();
    const tiles = root.querySelectorAll<HTMLElement>('[data-cell]');
    expect(tiles).toHaveLength(25);
    s.masks.forEach((m, i) => {
      const el = tiles[i] as HTMLElement;
      expect(el.dataset.type).toBe(kindOf(m));
      expect(el.dataset.rot).toBe(String(rotationOf(m)));
      expect(['true', 'false']).toContain(el.dataset.powered);
    });
    expect(tile(root, 2, 2).dataset.powered).toBe('true'); // the source
    expect(tile(root, 2, 2).getAttribute('aria-label')).toContain('power source');
    expect(byId(root, 'cp-board').getAttribute('aria-label')).toBe('Circuit board, 5 by 5');
    expect(byId(root, 'cp-board').getAttribute('dir')).toBe('ltr');
    expect(tile(root, 0, 0).tabIndex).toBe(0);
    expect(tile(root, 0, 1).tabIndex).toBe(-1);
    expect(byId(root, 'cp-status').textContent).toMatch(/^Powered: \d+ of 25 · Loose ends: \d+ · Moves: 0$/);
    expect((byId(root, 'cp-undo') as HTMLButtonElement).disabled).toBe(true);
  });

  it('uses the difficulty for the board size', () => {
    expect(setup(1, 'medium').root.querySelectorAll('[data-cell]')).toHaveLength(49);
    expect(setup(1, 'hard').root.querySelectorAll('[data-cell]')).toHaveLength(81);
    expect(setup(1, 'bogus').root.querySelectorAll('[data-cell]')).toHaveLength(25);
  });

  it('click turns clockwise, right-click turns back, undo reverts; each change saves', () => {
    const { root, instance, ctx } = setup(8);
    const m0 = instance.serialize().masks[1] as number;
    tile(root, 0, 1).click();
    expect(instance.serialize().masks[1]).toBe(rotateCW(m0));
    expect(Number(tile(root, 0, 1).dataset.mask)).toBe(rotateCW(m0));
    tile(root, 0, 1).dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    tile(root, 0, 1).dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    expect(instance.serialize().masks[1]).toBe(rotateCCW(m0));
    expect(instance.serialize().moves).toBe(3);
    expect(ctx.saveRequests()).toBe(3);
    byId(root, 'cp-undo').click();
    expect(instance.serialize().masks[1]).toBe(m0);
    expect(instance.serialize().moves).toBe(2);
    expect(ctx.saveRequests()).toBe(4);
  });

  it('keyboard: Space/Enter turn, Shift+Space turns back, L locks, arrows move', () => {
    const { root, instance } = setup(9);
    const el = tile(root, 0, 0);
    el.focus();
    const m0 = instance.serialize().masks[0] as number;
    key(el, ' ');
    expect(instance.serialize().masks[0]).toBe(rotateCW(m0));
    key(el, ' ', true);
    expect(instance.serialize().masks[0]).toBe(m0);
    key(el, 'Enter');
    expect(instance.serialize().masks[0]).toBe(rotateCW(m0));
    key(el, 'l');
    expect(tile(root, 0, 0).dataset.locked).toBe('true');
    expect(tile(root, 0, 0).getAttribute('aria-label')).toContain('locked');
    key(el, ' ');
    expect(instance.serialize().masks[0]).toBe(rotateCW(m0));
    key(el, 'L');
    expect(instance.serialize().locked[0]).toBe(false);
    key(el, 'ArrowRight');
    expect(document.activeElement).toBe(tile(root, 0, 1));
    key(tile(root, 0, 1), 'x');
    expect(instance.serialize().moves).toBe(3);
  });

  it('long press turns counter-clockwise without an extra click turn', () => {
    vi.useFakeTimers();
    const { root, instance } = setup(4);
    const el = tile(root, 1, 1);
    const m0 = instance.serialize().masks[6] as number;
    const down = new MouseEvent('pointerdown', { bubbles: true, clientX: 5, clientY: 5 }) as unknown as PointerEvent;
    Object.defineProperty(down, 'pointerType', { value: 'touch' });
    el.dispatchEvent(down);
    vi.advanceTimersByTime(500);
    expect(instance.serialize().masks[6]).toBe(rotateCCW(m0));
    el.click(); // the click that follows the lift is swallowed
    expect(instance.serialize().masks[6]).toBe(rotateCCW(m0));
    el.click();
    expect(instance.serialize().masks[6]).toBe(m0);
  });

  it('pause blocks input; resume allows it again', () => {
    const { root, instance } = setup(3);
    instance.pause();
    tile(root, 0, 0).click();
    expect(instance.serialize().moves).toBe(0);
    instance.resume();
    tile(root, 0, 0).click();
    expect(instance.serialize().moves).toBe(1);
  });

  it('solving reports completion once, freezes the board and survives restore', () => {
    const { root, instance, ctx } = setup(31);
    solveByClicks(root, instance.serialize());
    const solved = instance.serialize();
    expect(isSolved(solved)).toBe(true);
    expect(ctx.results).toEqual([{ outcome: 'completed', stats: { moves: solved.moves } }]);
    expect(byId(root, 'cp-status').dataset.status).toBe('solved');
    expect([...root.querySelectorAll<HTMLElement>('[data-cell]')].every((el) => el.dataset.powered === 'true' && el.dataset.loose === '0')).toBe(true);
    tile(root, 0, 0).click();
    expect(instance.serialize()).toEqual(solved);

    const again = setup(99);
    again.instance.restore(solved);
    expect(again.ctx.results).toEqual([]);
    expect(byId(again.root, 'cp-status').dataset.status).toBe('solved');
  });

  it('newGame on a used instance starts fresh; reset returns to the seeded start', () => {
    const { root, instance } = setup(12);
    const initial = instance.serialize();
    tile(root, 0, 0).click();
    instance.reset();
    expect(instance.serialize()).toEqual(initial);
    tile(root, 0, 0).click();
    instance.newGame({ seed: 12 });
    expect(instance.serialize()).toEqual(initial);
  });

  it('marks loose ends and lays the board out left-to-right in Arabic', () => {
    const { root } = setup(2, 'easy', 'ar');
    expect(root.querySelector('.wp-circuit-puzzle')?.getAttribute('dir')).toBe('rtl');
    expect(byId(root, 'cp-board').getAttribute('dir')).toBe('ltr');
    const loose = [...root.querySelectorAll<HTMLElement>('[data-cell]')].filter((el) => el.dataset.loose !== '0');
    expect(loose.length).toBeGreaterThan(0);
    for (const el of loose) expect(el.querySelectorAll('.cp-loose').length).toBe(Number(el.dataset.loose));
  });
});
