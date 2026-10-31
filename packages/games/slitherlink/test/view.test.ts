// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameInstance } from '@wp/game-core';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { LINE, NO_CLUE, edgeCount, edgeInfo, type SlitherlinkState } from '../src/rules';

let running: GameInstance<SlitherlinkState>[] = [];
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

const byId = <T extends HTMLElement = HTMLElement>(root: HTMLElement, id: string) => root.querySelector<T>(`[data-testid="${id}"]`) as T;
const edgeId = (n: number, e: number) => {
  const info = edgeInfo(n, e);
  return `edge-${info.horizontal ? 'h' : 'v'}-${info.r}-${info.c}`;
};
const key = (el: HTMLElement, k: string, init: KeyboardEventInit = {}) =>
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }));
const live = (root: HTMLElement) => {
  vi.advanceTimersByTime(100);
  return byId(root, 'sl-live').textContent;
};

describe('Loop view', () => {
  it('renders every edge, clue and dot with test ids and labels', () => {
    const { root, instance } = setup(11);
    const s = instance.serialize();
    expect(root.querySelectorAll('.sl-edge')).toHaveLength(edgeCount(5));
    expect(root.querySelectorAll('.sl-dot')).toHaveLength(36);
    expect(byId(root, 'edge-h-5-4')).not.toBeNull();
    expect(byId(root, 'edge-v-4-5')).not.toBeNull();
    expect(byId(root, 'edge-h-0-0').dataset.state).toBe('unknown');
    expect(byId(root, 'edge-h-0-0').getAttribute('aria-label')).toBe('Side from point 1, 1 to point 1, 2: empty');
    s.clues.forEach((k, i) => {
      const el = byId(root, `clue-${Math.floor(i / 5)}-${i % 5}`);
      if (k === NO_CLUE) expect(el).toBeNull();
      else expect(el.dataset.value).toBe(String(k));
    });
    expect(byId(root, 'dot-0-0').tabIndex).toBe(0);
    expect(byId(root, 'dot-0-1').tabIndex).toBe(-1);
    expect(byId(root, 'dot-0-0').getAttribute('aria-label')).toBe('Point 1, 1. Up: edge of the grid. Right: empty. Down: empty. Left: edge of the grid.');
    expect(byId<HTMLButtonElement>(root, 'sl-undo').disabled).toBe(true);
    expect(byId(root, 'sl-status').dataset.status).toBe('playing');
  });

  it('cycles an edge on tap, saves and announces', () => {
    const { root, ctx } = setup(11);
    const edge = byId(root, 'edge-h-0-0');
    edge.click();
    expect(edge.dataset.state).toBe('line');
    expect(ctx.saveRequests()).toBe(1);
    expect(live(root)).toBe('Side from point 1, 1 to point 1, 2: line');
    edge.click();
    expect(edge.dataset.state).toBe('cross');
    edge.click();
    expect(edge.dataset.state).toBe('unknown');
    expect(byId<HTMLButtonElement>(root, 'sl-undo').disabled).toBe(false);
    byId(root, 'sl-undo').click();
    expect(edge.dataset.state).toBe('cross');
  });

  it('toggles a cross on right click', () => {
    const { root, instance } = setup(11);
    const edge = byId(root, 'edge-v-1-2');
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    edge.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(edge.dataset.state).toBe('cross');
    edge.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    expect(edge.dataset.state).toBe('unknown');
    expect(instance.serialize().moves).toBe(2);
  });

  it('plays with the keyboard: arrows move, Shift+arrow or Space+arrow cycles, Ctrl+Z undoes', () => {
    const { root } = setup(11);
    const dot = byId(root, 'dot-0-0');
    dot.focus();
    key(dot, 'ArrowRight', { shiftKey: true });
    expect(byId(root, 'edge-h-0-0').dataset.state).toBe('line');
    key(dot, 'ArrowUp', { shiftKey: true });
    expect(live(root)).toBe('There is no line in that direction.');
    key(dot, 'ArrowRight');
    expect(document.activeElement).toBe(byId(root, 'dot-0-1'));
    expect(byId(root, 'dot-0-1').tabIndex).toBe(0);
    expect(dot.tabIndex).toBe(-1);
    const next = byId(root, 'dot-0-1');
    key(next, ' ');
    expect(next.getAttribute('aria-pressed')).toBe('true');
    key(next, 'ArrowDown');
    expect(byId(root, 'edge-v-0-1').dataset.state).toBe('line');
    expect(next.getAttribute('aria-pressed')).toBe('false');
    key(next, 'Enter');
    key(next, 'Escape');
    expect(next.getAttribute('aria-pressed')).toBe('false');
    key(next, 'z', { ctrlKey: true });
    expect(byId(root, 'edge-v-0-1').dataset.state).toBe('unknown');
    key(next, 'ArrowLeft');
    key(byId(root, 'dot-0-0'), 'ArrowLeft');
    expect(document.activeElement).toBe(byId(root, 'dot-0-0'));
  });

  it('mirrors left and right in RTL', () => {
    const { root } = setup(11, undefined, 'ar');
    expect(root.querySelector('.wp-slitherlink')?.getAttribute('dir')).toBe('rtl');
    const dot = byId(root, 'dot-0-1');
    dot.focus();
    key(dot, 'ArrowRight');
    expect(document.activeElement).toBe(byId(root, 'dot-0-0'));
    key(byId(root, 'dot-0-0'), 'ArrowLeft', { shiftKey: true });
    expect(byId(root, 'edge-h-0-0').dataset.state).toBe('line');
  });

  it('shows ✓ on met clues, reports checks and finishes once', () => {
    const { root, instance, ctx } = setup(5);
    const s = instance.serialize();
    byId(root, 'sl-check').click();
    expect(byId(root, 'sl-check-result').textContent).toBe('No wrong marks so far.');
    expect(instance.serialize().checks).toBe(1);
    // Draw the whole loop.
    const lines = s.solution.flatMap((m, e) => (m === LINE ? [e] : []));
    const wrong = s.solution.findIndex((m) => m !== LINE);
    byId(root, edgeId(5, wrong)).click();
    byId(root, 'sl-check').click();
    expect(byId(root, 'sl-check-result').textContent).toBe('Wrong marks: 1.');
    byId(root, edgeId(5, wrong)).click();
    byId(root, edgeId(5, wrong)).click();
    for (const e of lines) byId(root, edgeId(5, e)).click();
    expect(byId(root, 'sl-status').dataset.status).toBe('solved');
    expect(ctx.results).toEqual([{ outcome: 'completed', stats: { moves: lines.length + 3, checks: 2 } }]);
    for (const el of root.querySelectorAll<HTMLElement>('.sl-clue')) {
      expect(el.dataset.status).toBe('done');
      expect(el.querySelector('.sl-badge')?.textContent).toBe('✓');
    }
    expect(root.querySelector<HTMLElement>('.sl-controls')?.hidden).toBe(true);
    // Locked: further taps change nothing.
    byId(root, edgeId(5, lines[0] as number)).click();
    expect(ctx.results).toHaveLength(1);
    // Restoring a finished game does not finish again.
    const ctx2 = createTestContext(game as never);
    const again = game.create(ctx2.context);
    running.push(again);
    again.restore(instance.serialize());
    expect(ctx2.results).toEqual([]);
    expect(byId(ctx2.context.root, 'sl-status').dataset.status).toBe('solved');
  });

  it('marks impossible clues with "!" and explains an unclosed but satisfied board', () => {
    const { root, instance } = setup(5);
    const s = instance.serialize();
    const i = s.clues.findIndex((k) => k !== NO_CLUE && k < 4);
    const r = Math.floor(i / 5);
    const c = i % 5;
    const clue = byId(root, `clue-${r}-${c}`);
    for (const id of [`edge-h-${r}-${c}`, `edge-h-${r + 1}-${c}`, `edge-v-${r}-${c}`, `edge-v-${r}-${c + 1}`]) byId(root, id).click();
    expect(clue.dataset.status).toBe('over');
    expect(clue.querySelector('.sl-badge')?.textContent).toBe('!');
    expect(clue.getAttribute('aria-label')).toContain('can no longer be met');
  });

  it('ignores input while paused and resets to the seeded start', () => {
    const { root, instance, ctx } = setup(11);
    instance.pause();
    byId(root, 'edge-h-0-0').click();
    expect(byId(root, 'edge-h-0-0').dataset.state).toBe('unknown');
    instance.resume();
    byId(root, 'edge-h-0-0').click();
    expect(byId(root, 'edge-h-0-0').dataset.state).toBe('line');
    instance.reset();
    expect(byId(root, 'edge-h-0-0').dataset.state).toBe('unknown');
    expect(ctx.saveRequests()).toBe(2);
  });

  it('renders the hard board and a new game replaces the old one', () => {
    const { root, instance } = setup(3, 'hard');
    expect(root.querySelectorAll('.sl-edge')).toHaveLength(edgeCount(10));
    expect(byId(root, 'sl-board').dataset.size).toBe('10');
    instance.newGame({ seed: 4, difficulty: 'medium' });
    expect(root.querySelectorAll('.sl-edge')).toHaveLength(edgeCount(7));
    expect(root.querySelectorAll('.wp-slitherlink')).toHaveLength(1);
  });
});
