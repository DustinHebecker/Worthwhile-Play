// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameInstance } from '@wp/game-core';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { createInitialState, edgesOf, isBridgesState, type BridgesState, type Island } from '../src/rules';

let running: GameInstance<BridgesState>[] = [];
beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  for (const instance of running) instance.dispose();
  running = [];
  document.body.innerHTML = '';
  vi.useRealTimers();
});

type Locale = Parameters<typeof createTestContext>[1];

function setup(seed = 11, difficulty?: string, locale: Locale = 'en') {
  const ctx = createTestContext(game as never, locale);
  const instance = game.create(ctx.context);
  running.push(instance);
  instance.newGame(difficulty === undefined ? { seed } : { seed, difficulty });
  return { ctx, instance, root: ctx.context.root };
}

/**
 * Crossing puzzle on the easy 7 × 7 board:   . . T . .
 *                                            L . + . R
 *                                            X . B . Y
 * Solution: T–B 1, L–X 1, R–Y 1, X–B 1, B–Y 1 (L–R would cross T–B).
 */
const CROSS: Island[] = [[0, 2, 1], [2, 0, 1], [2, 4, 1], [4, 0, 2], [4, 2, 3], [4, 4, 2]];
const crossState = (): BridgesState => ({
  seed: 9,
  difficulty: 'easy',
  size: 7,
  islands: JSON.parse(JSON.stringify(CROSS)) as Island[],
  solution: [1, 0, 1, 1, 1, 1],
  bridges: [0, 0, 0, 0, 0, 0],
  history: [],
  moves: 0,
  checks: 0,
  lastCheck: null
});

function setupState(state: BridgesState, locale: Locale = 'en') {
  expect(isBridgesState(state)).toBe(true);
  const ctx = createTestContext(game as never, locale);
  const instance = game.create(ctx.context);
  running.push(instance);
  instance.restore(state);
  return { ctx, instance, root: ctx.context.root };
}

const byId = <T extends HTMLElement = HTMLElement>(root: HTMLElement, id: string) => root.querySelector<T>(`[data-testid="${id}"]`) as T;
const island = (root: HTMLElement, r: number, c: number) => byId<HTMLButtonElement>(root, `island-${r}-${c}`);
const bridge = (root: HTMLElement, r1: number, c1: number, r2: number, c2: number) => byId(root, `bridge-${r1}-${c1}-${r2}-${c2}`);
const key = (el: HTMLElement, k: string, init: KeyboardEventInit = {}) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }));
const live = (root: HTMLElement) => {
  vi.advanceTimersByTime(100);
  return byId(root, 'br-live').textContent;
};
const tapPair = (root: HTMLElement, a: [number, number], b: [number, number]) => {
  island(root, a[0], a[1]).click();
  island(root, b[0], b[1]).click();
};

describe('Bridges view', () => {
  it('renders islands, bridge slots and accessible names', () => {
    const { root, instance } = setup(11);
    const s = instance.serialize();
    const islands = root.querySelectorAll<HTMLElement>('.br-island');
    expect(islands).toHaveLength(s.islands.length);
    s.islands.forEach(([r, c, need]) => {
      const el = island(root, r, c);
      expect(el.dataset.need).toBe(String(need));
      expect(el.dataset.have).toBe('0');
      expect(el.dataset.state).toBe('open');
      expect(el.getAttribute('aria-pressed')).toBe('false');
      expect(el.getAttribute('aria-label')).toBe(`Island at row ${r + 1}, column ${c + 1}: needs ${need}, has 0, ${need} still missing. Bridges: none.`);
      expect(el.textContent).toBe(String(need));
    });
    const edges = edgesOf(s.size, s.islands);
    expect(root.querySelectorAll('.br-bridge')).toHaveLength(edges.length);
    for (const e of edges) {
      const [r1, c1] = s.islands[e.a] as Island;
      const [r2, c2] = s.islands[e.b] as Island;
      const el = bridge(root, r1, c1, r2, c2);
      expect(el.dataset.count).toBe('0');
      expect(el.dataset.orientation).toBe(e.horizontal ? 'horizontal' : 'vertical');
      expect(el.getAttribute('aria-hidden')).toBe('true');
    }
    expect(byId(root, 'br-board').getAttribute('aria-label')).toBe(`Island map, 7 by 7, ${s.islands.length} islands`);
    expect(byId(root, 'br-board').dataset.size).toBe('7');
    expect(byId(root, 'br-status').textContent).toBe(`Complete islands: 0 of ${s.islands.length}`);
    expect(byId<HTMLButtonElement>(root, 'br-undo').disabled).toBe(true);
    expect(byId(root, 'br-check-result').hidden).toBe(true);
    // Exactly one island is in the tab order.
    expect([...islands].filter((el) => el.tabIndex === 0)).toHaveLength(1);
  });

  it('cycles bridges with tap-then-tap and updates counts, badges and saves', () => {
    const { root, ctx, instance } = setupState(crossState());
    tapPair(root, [4, 0], [4, 2]);
    expect(bridge(root, 4, 0, 4, 2).dataset.count).toBe('1');
    expect(live(root)).toBe('Bridges between row 5, column 1 and row 5, column 3: 1');
    expect(island(root, 4, 0).dataset.have).toBe('1');
    expect(island(root, 4, 0).querySelector('.br-badge')?.textContent).toBe('1');
    expect(island(root, 4, 2).querySelector('.br-badge')?.textContent).toBe('2');
    expect(ctx.saveRequests()).toBe(1);
    expect(instance.serialize().moves).toBe(1);
    tapPair(root, [4, 2], [4, 0]);
    expect(bridge(root, 4, 0, 4, 2).dataset.count).toBe('2');
    expect(island(root, 4, 0).dataset.state).toBe('done');
    expect(island(root, 4, 0).querySelector('.br-badge')?.textContent).toBe('✓');
    expect(island(root, 4, 0).getAttribute('aria-label')).toBe('Island at row 5, column 1: needs 2, has 2, complete. Bridges: right 2.');
    tapPair(root, [4, 0], [4, 2]);
    expect(bridge(root, 4, 0, 4, 2).dataset.count).toBe('0');
    expect(island(root, 4, 0).querySelector('.br-badge')?.textContent).toBe('');
    expect(ctx.saveRequests()).toBe(3);
    expect(byId<HTMLButtonElement>(root, 'br-undo').disabled).toBe(false);
  });

  it('selects, deselects and re-selects islands', () => {
    const { root, ctx } = setupState(crossState());
    island(root, 0, 2).click();
    expect(island(root, 0, 2).getAttribute('aria-pressed')).toBe('true');
    expect(live(root)).toBe('Island at row 1, column 3 selected. Now choose an island in the same row or column.');
    island(root, 0, 2).click();
    expect(island(root, 0, 2).getAttribute('aria-pressed')).toBe('false');
    expect(live(root)).toBe('Selection cleared.');
    // T and X are not in line: the selection moves to X.
    island(root, 0, 2).click();
    island(root, 4, 0).click();
    expect(island(root, 0, 2).getAttribute('aria-pressed')).toBe('false');
    expect(island(root, 4, 0).getAttribute('aria-pressed')).toBe('true');
    island(root, 2, 0).click();
    expect(bridge(root, 2, 0, 4, 0).dataset.count).toBe('1');
    expect(root.querySelectorAll('[aria-pressed="true"]')).toHaveLength(0);
    expect(ctx.saveRequests()).toBe(1);
  });

  it('refuses a bridge that would cross another and explains why', () => {
    const { root, instance } = setupState(crossState());
    tapPair(root, [2, 0], [2, 4]);
    expect(bridge(root, 2, 0, 2, 4).dataset.count).toBe('1');
    const before = instance.serialize();
    tapPair(root, [0, 2], [4, 2]);
    expect(live(root)).toBe('Not possible: this bridge would cross another bridge.');
    expect(bridge(root, 0, 2, 4, 2).dataset.count).toBe('0');
    expect(instance.serialize()).toEqual(before);
    // Over-full islands are allowed but flagged with "!".
    tapPair(root, [2, 0], [4, 0]);
    expect(island(root, 2, 0).dataset.state).toBe('over');
    expect(island(root, 2, 0).querySelector('.br-badge')?.textContent).toBe('!');
    expect(island(root, 2, 0).getAttribute('aria-label')).toContain('too many bridges');
  });

  it('plays with the keyboard: arrows move, Shift+arrow and Enter-then-arrow build, Escape and Ctrl+Z', () => {
    const { root, instance } = setupState(crossState());
    const t = island(root, 0, 2);
    t.focus();
    key(t, 'ArrowDown');
    expect(document.activeElement).toBe(island(root, 4, 2));
    expect(island(root, 4, 2).tabIndex).toBe(0);
    expect(t.tabIndex).toBe(-1);
    key(island(root, 4, 2), 'ArrowLeft', { shiftKey: true });
    expect(bridge(root, 4, 0, 4, 2).dataset.count).toBe('1');
    // Enter activates the button (a click), then an arrow builds in that direction.
    island(root, 4, 2).click();
    expect(island(root, 4, 2).getAttribute('aria-pressed')).toBe('true');
    key(island(root, 4, 2), 'ArrowRight');
    expect(bridge(root, 4, 2, 4, 4).dataset.count).toBe('1');
    expect(island(root, 4, 2).getAttribute('aria-pressed')).toBe('false');
    expect(document.activeElement).toBe(island(root, 4, 2));
    // No neighbour below.
    key(island(root, 4, 2), 'ArrowDown', { shiftKey: true });
    expect(live(root)).toBe('There is no island in that direction.');
    island(root, 4, 2).click();
    key(island(root, 4, 2), 'Escape');
    expect(island(root, 4, 2).getAttribute('aria-pressed')).toBe('false');
    expect(live(root)).toBe('Selection cleared.');
    key(island(root, 4, 2), 'z', { ctrlKey: true });
    expect(bridge(root, 4, 2, 4, 4).dataset.count).toBe('0');
    expect(live(root)).toBe('Last change undone.');
    expect(instance.serialize().bridges).toEqual([0, 0, 0, 0, 1, 0]);
    // Other modifiers and unrelated keys do nothing.
    key(island(root, 4, 2), 'ArrowRight', { altKey: true });
    key(island(root, 4, 2), 'q');
    expect(document.activeElement).toBe(island(root, 4, 2));
    expect(instance.serialize().bridges).toEqual([0, 0, 0, 0, 1, 0]);
    // Moving focus where there is no island keeps it in place.
    key(island(root, 4, 2), 'ArrowDown');
    expect(document.activeElement).toBe(island(root, 4, 2));
  });

  it('mirrors left and right in right-to-left layouts', () => {
    const { root } = setupState(crossState(), 'ar');
    expect(root.querySelector('.wp-bridges')?.getAttribute('dir')).toBe('rtl');
    const b = island(root, 4, 2);
    b.focus();
    key(b, 'ArrowLeft');
    expect(document.activeElement).toBe(island(root, 4, 4));
    key(island(root, 4, 4), 'ArrowRight', { shiftKey: true });
    expect(bridge(root, 4, 2, 4, 4).dataset.count).toBe('1');
    expect(island(root, 4, 4).getAttribute('aria-label')).toContain('يمين 1');
  });

  it('undoes with the button and checks without revealing positions', () => {
    const { root, instance } = setupState(crossState());
    byId(root, 'br-check').click();
    expect(byId(root, 'br-check-result').textContent).toBe('No wrong bridges so far.');
    expect(byId(root, 'br-check-result').hidden).toBe(false);
    expect(live(root)).toBe('No wrong bridges so far.');
    tapPair(root, [2, 0], [2, 4]);
    expect(byId(root, 'br-check-result').hidden).toBe(true);
    byId(root, 'br-check').click();
    expect(byId(root, 'br-check-result').textContent).toBe('Wrong bridges: 1.');
    expect(instance.serialize().checks).toBe(2);
    byId(root, 'br-undo').click();
    expect(bridge(root, 2, 0, 2, 4).dataset.count).toBe('0');
    expect(byId<HTMLButtonElement>(root, 'br-undo').disabled).toBe(true);
  });

  it('tells when every number is met but the islands are split', () => {
    const state: BridgesState = {
      seed: 1,
      difficulty: 'easy',
      size: 7,
      islands: [[0, 0, 1], [0, 2, 1], [2, 0, 2], [2, 2, 2]],
      solution: [0, 1, 1, 1],
      bridges: [0, 0, 0, 0],
      history: [],
      moves: 0,
      checks: 0,
      lastCheck: null
    };
    const { root, ctx } = setupState(state);
    tapPair(root, [0, 0], [0, 2]);
    tapPair(root, [2, 0], [2, 2]);
    tapPair(root, [2, 0], [2, 2]);
    expect(byId(root, 'br-status').textContent).toBe('Every number is met, but the islands do not form one connected group yet.');
    expect(ctx.results).toEqual([]);
  });

  it('finishes once when solved, then ignores input; a restored solved game stays quiet', () => {
    const { root, ctx, instance } = setupState(crossState());
    tapPair(root, [0, 2], [4, 2]);
    tapPair(root, [2, 0], [4, 0]);
    tapPair(root, [2, 4], [4, 4]);
    tapPair(root, [4, 0], [4, 2]);
    expect(ctx.results).toEqual([]);
    byId(root, 'br-check').click();
    tapPair(root, [4, 2], [4, 4]);
    expect(ctx.results).toEqual([{ outcome: 'completed', stats: { moves: 5, checks: 1 } }]);
    expect(byId(root, 'br-status').dataset.status).toBe('solved');
    expect(byId(root, 'br-status').textContent).toBe('All islands connected! Moves: 5.');
    expect(live(root)).toBe('All islands connected! Moves: 5.');
    expect(root.querySelector('.br-controls')?.hasAttribute('hidden')).toBe(true);
    expect(root.querySelector('.br-help')?.hasAttribute('hidden')).toBe(true);
    const solved = instance.serialize();
    island(root, 0, 2).click();
    expect(island(root, 0, 2).getAttribute('aria-pressed')).toBe('false');
    key(island(root, 4, 2), 'ArrowUp', { shiftKey: true });
    key(island(root, 4, 2), 'z', { ctrlKey: true });
    expect(instance.serialize()).toEqual(solved);
    expect(ctx.results).toHaveLength(1);

    const again = setupState(solved);
    expect(again.ctx.results).toEqual([]);
    expect(byId(again.root, 'br-status').dataset.status).toBe('solved');
  });

  it('builds by dragging from island to island and ignores the trailing click', () => {
    const { root, instance } = setupState(crossState());
    const from = island(root, 2, 0);
    const to = island(root, 4, 0);
    const original = document.elementFromPoint;
    document.elementFromPoint = () => to.querySelector('.br-disc');
    try {
      from.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 1, clientY: 1 }));
      from.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: 1, clientY: 50 }));
      expect(bridge(root, 2, 0, 4, 0).dataset.count).toBe('1');
      expect(document.activeElement === to || to.tabIndex === 0).toBe(true);
      from.click();
      // The click right after the drag was swallowed, the next one selects.
      expect(from.getAttribute('aria-pressed')).toBe('false');
      from.click();
      expect(from.getAttribute('aria-pressed')).toBe('true');
      // A press and release on the same island is a plain tap.
      from.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
      document.elementFromPoint = () => from;
      from.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
      from.click();
      expect(from.getAttribute('aria-pressed')).toBe('false');
      // Releasing outside any island does nothing; a cancelled drag does nothing.
      from.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
      document.elementFromPoint = () => byId(root, 'br-board');
      from.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
      from.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
      from.dispatchEvent(new MouseEvent('pointercancel', { bubbles: true }));
      document.elementFromPoint = () => to;
      from.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
      expect(instance.serialize().bridges).toEqual([0, 0, 1, 0, 0, 0]);
    } finally {
      document.elementFromPoint = original;
    }
  });

  it('ignores input while paused', () => {
    const { root, instance } = setupState(crossState());
    instance.pause();
    tapPair(root, [2, 0], [4, 0]);
    key(island(root, 4, 0), 'ArrowRight', { shiftKey: true });
    byId(root, 'br-check').click();
    expect(instance.serialize()).toEqual(crossState());
    instance.resume();
    tapPair(root, [2, 0], [4, 0]);
    expect(instance.serialize().bridges).toEqual([0, 0, 1, 0, 0, 0]);
    instance.pause();
    byId(root, 'br-undo').click();
    expect(instance.serialize().bridges).toEqual([0, 0, 1, 0, 0, 0]);
  });

  it('starts new games of any difficulty, resets to the seeded start and reuses the instance', () => {
    const { root, ctx, instance } = setup(11, 'hard');
    expect(byId(root, 'br-board').dataset.size).toBe('11');
    expect(instance.serialize()).toEqual(createInitialState(11, 'hard'));
    instance.newGame({ seed: 4, difficulty: 'nonsense' });
    expect(instance.serialize()).toEqual(createInitialState(4, 'easy'));
    const s = instance.serialize();
    const e = edgesOf(s.size, s.islands)[0]!;
    const [r1, c1] = s.islands[e.a] as Island;
    const [r2, c2] = s.islands[e.b] as Island;
    tapPair(root, [r1, c1], [r2, c2]);
    const saves = ctx.saveRequests();
    instance.reset();
    expect(instance.serialize()).toEqual(createInitialState(4, 'easy'));
    expect(ctx.saveRequests()).toBe(saves + 1);
    expect(root.querySelectorAll('.wp-bridges')).toHaveLength(1);
    instance.newGame({ seed: 5, difficulty: 'medium' });
    expect(byId(root, 'br-board').dataset.size).toBe('9');
    expect(root.querySelectorAll('.br-island')).toHaveLength(instance.serialize().islands.length);
  });

  it('renders without missing keys and with translated labels in every locale', () => {
    for (const locale of ['de', 'ar', 'zh-Hans', 'hi'] as const) {
      const { ctx, root } = setupState(crossState(), locale);
      tapPair(root, [2, 0], [4, 0]);
      byId(root, 'br-check').click();
      key(island(root, 2, 0), 'ArrowUp', { shiftKey: true });
      expect(ctx.missingKeys).toEqual([]);
    }
  });
});
