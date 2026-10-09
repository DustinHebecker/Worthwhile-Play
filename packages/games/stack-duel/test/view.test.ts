// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameInstance, GameModule } from '@wp/game-core';
import type { SupportedLocale } from '@wp/localization';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { X_LIMIT, isValidState, type StackDuelState } from '../src/rules';
import { FINE_STEP, MOVE_STEP, visibleFrames } from '../src/view';

let instances: GameInstance<StackDuelState>[] = [];

function mount(options: { reducedMotion?: boolean; locale?: SupportedLocale } = {}) {
  const ctx = createTestContext(game as GameModule<unknown>, options.locale ?? 'en');
  const context = { ...ctx.context, reducedMotion: options.reducedMotion ?? true };
  const instance = game.create(context);
  instances.push(instance);
  const root = context.root;
  const $ = <T extends Element = HTMLElement>(id: string) => root.querySelector(`[data-testid="${id}"]`) as T;
  const click = (id: string) => $<HTMLButtonElement>(id).click();
  const key = (k: string, extra: KeyboardEventInit = {}) => $('board').dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...extra }));
  const select = (value: string) => {
    const el = $<HTMLSelectElement>('option-mode');
    el.value = value;
    el.dispatchEvent(new Event('change'));
  };
  const text = (id: string) => $(id).textContent ?? '';
  return { ctx, instance, root, $, click, key, select, text };
}

afterEach(() => {
  for (const i of instances) i.dispose();
  instances = [];
  vi.useRealTimers();
});

describe('stack duel view', () => {
  it('renders the board, the held stone, controls, status and the next-stone preview', () => {
    const { instance, root, $, text } = mount();
    instance.newGame({ seed: 1, difficulty: 'easy' });
    const s = instance.serialize();
    expect($('board').getAttribute('role')).toBe('group');
    expect($('board').tabIndex).toBe(0);
    expect($('board').getAttribute('aria-label')).toMatch(/^Tower with 0 stones, 0\.0 high\. Held stone: .+, at 0\.00 from the middle, turned 0°\.$/);
    expect($('held').querySelectorAll('.sd-piece')).toHaveLength(1);
    expect($('guide').hasAttribute('hidden')).toBe(false);
    expect(text('status')).toMatch(/^Your turn — place the /);
    expect(text('progress')).toBe('Height 0.0 · 0 stones');
    expect(text('next')).toMatch(/^Next stone: /);
    for (const id of ['move-left', 'move-right', 'rotate-ccw', 'rotate-cw', 'drop']) expect($<HTMLButtonElement>(id).disabled).toBe(false);
    expect($('move-left').getAttribute('aria-label')).toBe('Move left');
    expect($('goal-line').hasAttribute('hidden')).toBe(true);
    expect(root.querySelectorAll('[data-testid^="piece-"]')).toHaveLength(0);
    expect(s.mode).toBe('computer');
  });

  it('moves and turns the held stone with the keyboard (Shift for fine steps) and saves', () => {
    const { ctx, instance, key } = mount();
    instance.newGame({ seed: 1, difficulty: 'easy' });
    const saves = ctx.saveRequests();
    key('ArrowRight');
    expect(instance.serialize().cursor).toEqual({ x: MOVE_STEP, rot: 0 });
    key('ArrowLeft', { shiftKey: true });
    expect(instance.serialize().cursor.x).toBeCloseTo(MOVE_STEP - FINE_STEP, 12);
    key('q');
    expect(instance.serialize().cursor.rot).toBe(1);
    key('e');
    key('E');
    expect(instance.serialize().cursor.rot).toBe(23);
    key('ArrowUp');
    expect(instance.serialize().cursor.rot).toBe(22);
    key('Home');
    expect(instance.serialize().cursor.x).toBe(-X_LIMIT);
    key('Home');
    key('End');
    expect(instance.serialize().cursor.x).toBe(X_LIMIT);
    expect(ctx.saveRequests()).toBeGreaterThan(saves + 4);
    // Modified keys are left to the browser.
    key('ArrowLeft', { ctrlKey: true });
    expect(instance.serialize().cursor.x).toBe(X_LIMIT);
  });

  it('drops with Enter and plays the computer reply in the same step', () => {
    const { ctx, instance, key, root, text } = mount();
    instance.newGame({ seed: 4, difficulty: 'easy' });
    key('Enter');
    const s = instance.serialize();
    expect(s.bodies).toHaveLength(2);
    expect(isValidState(JSON.parse(JSON.stringify(s)))).toBe(true);
    expect(root.querySelectorAll('[data-testid^="piece-"]')).toHaveLength(2);
    const pose = root.querySelector('[data-testid="piece-0"]')!.getAttribute('data-pose');
    expect(pose).toBe(`${s.bodies[0]!.x.toFixed(3)},${s.bodies[0]!.y.toFixed(3)},${s.bodies[0]!.a.toFixed(3)}`);
    expect(ctx.saveRequests()).toBeGreaterThan(0);
    expect(text('progress')).toMatch(/· 2 stones$/);
  });

  it('uses the buttons and lets two people take turns', () => {
    const { instance, click, select, text } = mount();
    instance.newGame({ seed: 4, difficulty: 'easy' });
    select('human');
    expect(instance.serialize().mode).toBe('human');
    expect(text('status')).toMatch(/^Player 1: place the /);
    click('move-right');
    click('rotate-ccw');
    expect(instance.serialize().cursor).toEqual({ x: MOVE_STEP, rot: 1 });
    click('rotate-cw');
    click('move-left');
    expect(instance.serialize().cursor).toEqual({ x: 0, rot: 0 });
    click('drop');
    expect(instance.serialize().bodies).toHaveLength(1);
    expect(text('status')).toMatch(/^Player 2: place the /);
    // The mode survives a new game from the host.
    instance.newGame({ seed: 5, difficulty: 'medium' });
    expect(instance.serialize().mode).toBe('human');
    expect(instance.serialize().difficulty).toBe('medium');
    select('nonsense');
    expect(instance.serialize().mode).toBe('human');
  });

  it('reports the end exactly once, disables the controls and does not re-report on restore', () => {
    const { ctx, instance, key, $, text } = mount();
    instance.newGame({ seed: 4, difficulty: 'easy' });
    key('End');
    key('Enter');
    expect(instance.serialize().result).toEqual({ kind: 'fell', by: 0 });
    expect(ctx.results).toHaveLength(1);
    expect(ctx.results[0]!.outcome).toBe('lost');
    expect(text('status')).toBe('A stone fell after your drop — the computer wins this round.');
    expect($<HTMLButtonElement>('drop').disabled).toBe(true);
    key('Enter');
    key('ArrowLeft');
    expect(ctx.results).toHaveLength(1);
    expect(instance.serialize().cursor.x).toBe(0);
    const saved = instance.serialize();
    const other = mount();
    other.instance.restore(saved);
    expect(other.ctx.results).toHaveLength(0);
    expect(other.text('status')).toBe(text('status'));
    expect(other.instance.serialize()).toEqual(saved);
  });

  it('phrases two-player and solo endings', () => {
    const duel = mount();
    duel.instance.newGame({ seed: 4, difficulty: 'easy' });
    duel.select('human');
    duel.key('Enter');
    duel.key('End');
    duel.key('Enter');
    expect(duel.text('status')).toBe('A stone fell after player 2’s drop — player 1 wins.');
    expect(duel.ctx.results.at(-1)!.outcome).toBe('completed');

    const solo = mount();
    solo.instance.newGame({ seed: 4, difficulty: 'easy' });
    solo.select('solo');
    expect(solo.$('goal-line').hasAttribute('hidden')).toBe(false);
    expect(solo.text('progress')).toBe('Height 0.0 of 6.0 · 12 stones left');
    expect(solo.text('status')).toMatch(/^Place the /);
    solo.key('End');
    solo.key('Enter');
    expect(solo.text('status')).toBe('A stone fell off the platform — the challenge is over.');
    expect(solo.ctx.results.at(-1)!.outcome).toBe('lost');
  });

  it('formats numbers for the locale', () => {
    const { instance, key, $ } = mount({ locale: 'de' });
    instance.newGame({ seed: 1, difficulty: 'easy' });
    key('ArrowRight');
    expect($('board').getAttribute('aria-label')).toContain('0,25 von der Mitte');
  });

  it('follows a pointer drag across the board', () => {
    const { instance, $ } = mount();
    instance.newGame({ seed: 1, difficulty: 'easy' });
    const svgEl = $('board').querySelector('svg')!;
    svgEl.getBoundingClientRect = () => ({ left: 100, top: 0, width: 200, height: 210, right: 300, bottom: 210, x: 100, y: 0, toJSON: () => ({}) });
    const vb = (svgEl.getAttribute('viewBox') ?? '').split(' ').map(Number);
    const at = (clientX: number) => vb[0]! + ((clientX - 100) / 200) * vb[2]!;
    $('board').dispatchEvent(new MouseEvent('pointerdown', { clientX: 250, bubbles: true }));
    expect(instance.serialize().cursor.x).toBeCloseTo(Math.round(at(250) * 20) / 20, 9);
    $('board').dispatchEvent(new MouseEvent('pointermove', { clientX: 150, bubbles: true }));
    expect(instance.serialize().cursor.x).toBeCloseTo(Math.round(at(150) * 20) / 20, 9);
    $('board').dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
    $('board').dispatchEvent(new MouseEvent('pointermove', { clientX: 290, bubbles: true }));
    expect(instance.serialize().cursor.x).toBeCloseTo(Math.round(at(150) * 20) / 20, 9);
  });

  const pointer = (type: string, pointerType: string, init: MouseEventInit = {}) => {
    const event = new MouseEvent(type, { bubbles: true, cancelable: true, ...init });
    Object.defineProperty(event, 'pointerType', { value: pointerType });
    return event;
  };

  it('drops with a mouse click on the board, but never on a touch tap or another mouse button', () => {
    const { instance, $ } = mount();
    instance.newGame({ seed: 1, difficulty: 'easy' });
    $('board').dispatchEvent(pointer('pointerdown', 'touch'));
    $('board').dispatchEvent(pointer('pointerup', 'touch'));
    expect(instance.serialize().bodies).toHaveLength(0);
    $('board').dispatchEvent(pointer('pointerdown', 'mouse', { button: 2 }));
    $('board').dispatchEvent(pointer('pointerup', 'mouse', { button: 2 }));
    expect(instance.serialize().bodies).toHaveLength(0);
    // A release without a press on the board (e.g. a drag that started elsewhere) does nothing either.
    $('board').dispatchEvent(pointer('pointerup', 'mouse'));
    expect(instance.serialize().bodies).toHaveLength(0);
    $('board').dispatchEvent(pointer('pointerdown', 'mouse'));
    $('board').dispatchEvent(pointer('pointercancel', 'mouse'));
    expect(instance.serialize().bodies).toHaveLength(0);
    $('board').dispatchEvent(pointer('pointerdown', 'mouse'));
    $('board').dispatchEvent(pointer('pointerup', 'mouse'));
    // The person's stone and the computer's reply.
    expect(instance.serialize().bodies).toHaveLength(2);
  });

  it('turns the stone with the mouse wheel, one 15° step per notch, accumulating small trackpad deltas', () => {
    const { instance, $ } = mount();
    instance.newGame({ seed: 1, difficulty: 'easy' });
    const wheel = (deltaY: number, init: WheelEventInit = {}) => {
      const event = new WheelEvent('wheel', { deltaY, bubbles: true, cancelable: true, ...init });
      $('board').dispatchEvent(event);
      return event;
    };
    const rot0 = instance.serialize().cursor.rot;
    expect(wheel(100).defaultPrevented).toBe(true);
    expect(instance.serialize().cursor.rot).toBe((rot0 + 22) % 24);
    wheel(-50);
    expect(instance.serialize().cursor.rot).toBe((rot0 + 23) % 24);
    for (let i = 0; i < 4; i++) wheel(-12);
    expect(instance.serialize().cursor.rot).toBe((rot0 + 23) % 24);
    wheel(-2);
    expect(instance.serialize().cursor.rot).toBe(rot0);
    wheel(3, { deltaMode: 1 });
    expect(instance.serialize().cursor.rot).toBe(rot0);
    wheel(1, { deltaMode: 1 });
    expect(instance.serialize().cursor.rot).toBe((rot0 + 23) % 24);
    // ctrl + wheel stays the browser's page zoom.
    expect(wheel(500, { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(instance.serialize().cursor.rot).toBe((rot0 + 23) % 24);
  });

  it('animates the recorded drop without changing the logical state, and catches up on pause', () => {
    vi.useFakeTimers();
    const { instance, key, root, $ } = mount({ reducedMotion: false });
    instance.newGame({ seed: 4, difficulty: 'easy' });
    key('Enter');
    const container = root.querySelector<HTMLElement>('.wp-stack-duel')!;
    expect(container.dataset.animating).toBe('true');
    expect(instance.serialize().bodies).toHaveLength(2);
    expect($<HTMLButtonElement>('drop').disabled).toBe(true);
    key('ArrowLeft');
    expect(instance.serialize().cursor.x).toBe(0); // ignored while the drop plays
    vi.advanceTimersByTime(200);
    expect(container.dataset.animating).toBe('true');
    instance.pause();
    expect(container.dataset.animating).toBe('false');
    expect($<HTMLButtonElement>('drop').disabled).toBe(false);
    key('Enter');
    expect(container.dataset.animating).toBe('true');
    vi.advanceTimersByTime(30_000);
    expect(container.dataset.animating).toBe('false');
    expect(root.querySelectorAll('[data-testid^="piece-"]')).toHaveLength(instance.serialize().bodies.length);
  });

  it('skips trailing frames that no longer move', () => {
    expect(visibleFrames([])).toBe(0);
    expect(visibleFrames([[0, 0, 0]])).toBe(1);
    expect(visibleFrames([[0, 0, 0], [0, 0, 0], [0, 0, 0]])).toBe(1);
    expect(visibleFrames([[1, 0, 0], [0.5, 0, 0], [0.001, 0, 0], [0, 0, 0]])).toBe(3);
    expect(visibleFrames([[0, 0, 0], [0, 0.01, 0], [0, 0, 0]])).toBe(3);
    expect(visibleFrames([[0, 0, 0, 5, 5, 5], [0, 0, 0, 1, 1, 1], [0, 0, 0, 1, 1, 1]])).toBe(2);
  });

  it('restarts the round with the same seed', () => {
    const { instance, key, click } = mount();
    instance.newGame({ seed: 9, difficulty: 'hard' });
    const initial = instance.serialize();
    key('Enter');
    click('restart');
    expect(instance.serialize()).toEqual(initial);
  });

  it('renders right-to-left text while keeping the controls in physical order', () => {
    const { instance, root } = mount({ locale: 'ar' });
    instance.newGame({ seed: 1, difficulty: 'easy' });
    expect(root.querySelector('.wp-stack-duel')!.getAttribute('dir')).toBe('rtl');
    expect(root.querySelector('.sd-controls')!.getAttribute('dir')).toBe('ltr');
  });
});
