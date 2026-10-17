// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestContext } from '@wp/testing';
import type { GameInstance, GameModule } from '@wp/game-core';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@wp/localization';
import game from '../src/index';
import { createInitial } from '../src/generate';
import { exposed, initialPosition, play, position, type PeelState } from '../src/rules';
import { inkFor } from '../src/view';
import { stateOf } from './helpers';

HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const fn of cleanup) fn();
  cleanup = [];
  document.body.innerHTML = '';
  vi.useRealTimers();
});

function start(options: { state?: PeelState; locale?: SupportedLocale; seed?: number; difficulty?: string; motif?: string; prefs?: Record<string, unknown> } = {}) {
  const ctx = createTestContext(game as GameModule<unknown>, options.locale ?? 'en');
  for (const [k, v] of Object.entries(options.prefs ?? {})) ctx.preferences.set(k, v);
  const instance = game.create(ctx.context) as GameInstance<PeelState>;
  if (options.state) instance.restore(options.state);
  else instance.newGame({ seed: options.seed ?? 1, difficulty: options.difficulty ?? 'easy', settings: { motif: options.motif ?? 'red-fox' } });
  cleanup.push(() => instance.dispose());
  const root = ctx.context.root;
  const q = (id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
  const status = () => q('pp-status').textContent ?? '';
  return { ctx, instance, root, q, status };
}

/** 4 × 3 ring of a around two b; lane 0: b1 then a10; lane 1: b1; one slot. Lane 1 first gets stuck. */
const ringState = () => stateOf(['aaaa', 'abba', 'aaaa'], [[{ c: 'b', n: 1 }, { c: 'a', n: 10 }], [{ c: 'b', n: 1 }]], 1);

describe('view', () => {
  it('renders the title, pixels left, the lanes, the free slots and the canvas summary', () => {
    const { q, root, instance } = start();
    const s = instance.serialize();
    expect(q('pp-title').textContent).toBe('Red fox');
    const total = s.picture.rows.join('').replace(/\./g, '').length;
    expect(q('pp-left').textContent).toBe(`Pixels left: ${total} of ${total}`);
    expect(root.querySelectorAll('[data-testid^="pp-lane-box-"]')).toHaveLength(2);
    expect(root.querySelectorAll('[data-testid^="pp-slot-free-"]:not([hidden])')).toHaveLength(5);
    expect(q('pp-canvas').getAttribute('role')).toBe('img');
    expect(q('pp-canvas').getAttribute('aria-label')).toContain('Picture “Red fox”, 16 × 16 pixels');
    expect(q('pp-lane-0').getAttribute('aria-label')).toMatch(/^Lane 1, front: \w[\w ]*, \w+, shots: \d+$/);
  });

  it('marks exactly the exposed cells (symbols shown there) for tests', () => {
    const { q, instance } = start({ motif: 'tiger' });
    const s = instance.serialize();
    const ex = exposed(position(s)).map((c) => `${c % s.picture.w},${Math.floor(c / s.picture.w)}`);
    expect(q('pp-canvas').dataset.exposed).toBe(ex.join(' '));
  });

  it('previews a legal move on focus, with hatched cells and text', () => {
    const { q, status, instance } = start();
    const s = instance.serialize();
    q('pp-lane-0').focus();
    expect(status()).toMatch(/: removes \d+ and is used up\.$|: removes \d+, then waits/);
    const hits = q('pp-canvas').dataset.preview!.split(' ').filter(Boolean);
    expect(hits.length).toBeGreaterThan(0);
    expect(instance.serialize()).toEqual(s);
    q('pp-lane-0').blur();
    expect(q('pp-canvas').dataset.preview).toBe('');
  });

  it('an illegal move stays focusable with aria-disabled, explains why and changes nothing', () => {
    const state = play(ringState(), 'L1');
    const { q, status, ctx, instance, root } = start({ state });
    vi.useFakeTimers();
    const lane = q('pp-lane-0');
    expect(lane.getAttribute('aria-disabled')).toBe('true');
    const saves = ctx.saveRequests();
    lane.click();
    vi.advanceTimersByTime(100);
    expect(status()).toContain('no free waiting place');
    expect(q('pp-live').textContent).toContain('no free waiting place');
    expect(ctx.saveRequests()).toBe(saves);
    expect(instance.serialize()).toEqual(state);
    expect(root.querySelector('[data-testid="pp-slot-0"]')!.getAttribute('aria-disabled')).toBe('true');
  });

  it('launches on click, announces the result and requests a save', () => {
    const { q, ctx, instance } = start();
    vi.useFakeTimers();
    const before = instance.serialize();
    q('pp-lane-0').click();
    vi.advanceTimersByTime(100);
    expect(instance.serialize().moves).toEqual(['L0']);
    expect(ctx.saveRequests()).toBeGreaterThan(0);
    expect(q('pp-live').textContent).toMatch(/removed \d+|waits in place/);
    expect(q('pp-undo').hasAttribute('disabled')).toBe(false);
    q('pp-undo').click();
    expect(instance.serialize()).toEqual(before);
  });

  it('parking shows the shooter in its waiting place; undo after a park restores the lane', () => {
    const { q, root, instance } = start({ state: ringState() });
    q('pp-lane-0').click();
    expect(root.querySelector('[data-testid="pp-slot-0"]')!.hasAttribute('hidden')).toBe(false);
    expect(q('pp-slots-heading').textContent).toBe('Waiting places: 0 of 1 free');
    expect(q('pp-slot-0').getAttribute('aria-label')).toBe('Waiting place 1: cream, triangle, shots: 1');
    q('pp-undo').click();
    expect(instance.serialize().moves).toEqual([]);
    expect(q('pp-slot-0').hidden).toBe(true);
    expect(q('pp-lane-0').getAttribute('aria-label')).toContain('cream');
  });

  it('restart clears the moves and the next undo brings them back', () => {
    const { q, instance, status } = start();
    q('pp-lane-0').click();
    q('pp-lane-1').click();
    const moves = instance.serialize().moves;
    q('pp-restart').click();
    expect(instance.serialize().moves).toEqual([]);
    expect(status()).toContain('Started again');
    q('pp-undo').click();
    expect(instance.serialize().moves).toEqual(moves);
  });

  it('shows the stuck panel calmly, without finishing the game', () => {
    const { q, ctx } = start({ state: play(ringState(), 'L1') });
    expect(q('pp-stuck').hidden).toBe(false);
    expect(q('pp-stuck').textContent).toContain('No move left');
    expect(ctx.results).toEqual([]);
    q('pp-stuck-undo').click();
    expect(q('pp-stuck').hidden).toBe(true);
  });

  it('the hint marks a shooter on the witness path, and offers an undo target on a doomed one', () => {
    const fresh = start({ state: ringState() });
    fresh.q('pp-hint').click();
    const marked = fresh.root.querySelectorAll('[data-hint="true"]');
    expect(marked).toHaveLength(1);
    expect(marked[0]!.textContent).toContain('Hint');
    expect(fresh.status()).toMatch(/^Hint: lane \d, /);
    fresh.instance.dispose();

    const doomed = start({ state: play(ringState(), 'L1') });
    doomed.q('pp-stuck-hint').click();
    expect(doomed.status()).toBe('From here the picture cannot be finished. Going back to the start works.');
    const back = doomed.q('pp-undo-to');
    expect(back.parentElement!.hidden).toBe(false);
    expect(back.textContent).toBe('Back to the start');
    back.click();
    expect(doomed.instance.serialize().moves).toEqual([]);
    expect(doomed.root.querySelectorAll('[data-hint="true"]')).toHaveLength(0);
  });

  it('playing the stored witness through the buttons reveals the picture and finishes once', () => {
    const { q, ctx, instance } = start({ motif: 'koala', difficulty: 'medium', seed: 4 });
    for (const move of instance.serialize().witness) q(move.startsWith('L') ? `pp-lane-${move.slice(1)}` : `pp-slot-${move.slice(1)}`).click();
    expect(q('pp-reveal').hidden).toBe(false);
    expect(q('pp-reveal-title').textContent).toBe('Koala');
    expect(q('pp-reveal-stats').textContent).toMatch(/^Peeled in \d+ launches, \d+ of them parking\.$/);
    expect(document.activeElement).toBe(q('pp-reveal-title'));
    expect(ctx.results).toHaveLength(1);
    expect(ctx.results[0]!.outcome).toBe('completed');
    expect(instance.serialize().reported).toBe(true);
  });

  it('restoring a solved game shows the reveal again without a second finished()', () => {
    let s = createInitial(3, 'easy', 'elephant');
    for (const m of s.witness) s = play(s, m);
    const { q, ctx } = start({ state: { ...s, reported: true } });
    expect(q('pp-reveal').hidden).toBe(false);
    expect(q('pp-reveal-title').textContent).toBe('African elephant');
    expect(ctx.results).toEqual([]);
  });

  it('keyboard: arrows move between lane fronts (one tab stop), Ctrl+Z undoes, Esc clears the preview', () => {
    const { q, instance, root } = start({ difficulty: 'medium' });
    const fronts = [0, 1, 2].map((i) => q(`pp-lane-${i}`));
    expect(fronts.map((b) => b.tabIndex)).toEqual([0, -1, -1]);
    fronts[0]!.focus();
    fronts[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(fronts[1]);
    expect(fronts.map((b) => b.tabIndex)).toEqual([-1, 0, -1]);
    fronts[1]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(document.activeElement).toBe(fronts[2]);
    expect(q('pp-canvas').dataset.preview).not.toBe('');
    fronts[2]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(q('pp-canvas').dataset.preview).toBe('');
    fronts[2]!.click();
    expect(instance.serialize().moves).toEqual(['L2']);
    root.firstElementChild!.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
    expect(instance.serialize().moves).toEqual([]);
  });

  it('"Confirm before launch": the first press previews, the second launches', () => {
    const { q, instance, status } = start({ prefs: { display: { animation: true, allSymbols: false, confirm: true } } });
    q('pp-lane-0').click();
    expect(instance.serialize().moves).toEqual([]);
    expect(status()).toContain('Press again to launch.');
    expect(q('pp-lane-0').classList.contains('is-selected')).toBe(true);
    q('pp-lane-0').click();
    expect(instance.serialize().moves).toEqual(['L0']);
  });

  it('display options are per-device preferences and never change the game state', () => {
    const { q, ctx, instance } = start();
    const before = instance.serialize();
    const saves = ctx.saveRequests();
    const box = q('pp-option-allSymbols') as HTMLInputElement;
    box.checked = true;
    box.dispatchEvent(new Event('change'));
    expect(ctx.preferences.get('display')).toEqual({ animation: true, allSymbols: true, confirm: false });
    expect(instance.serialize()).toEqual(before);
    expect(ctx.saveRequests()).toBe(saves);
    // Reduced motion: animation is off and cannot be switched on.
    expect((q('pp-option-animation') as HTMLInputElement).disabled).toBe(true);
  });

  it('the colours overview lists every colour by name with counts', () => {
    const { root, instance } = start({ motif: 'llama' });
    const s = instance.serialize();
    const rows = root.querySelectorAll('[data-testid^="pp-colour-"]');
    expect(rows).toHaveLength(s.picture.palette.length);
    expect(rows[0]!.textContent).toMatch(/Cream.*left: \d+ · reachable now: \d+ · shooters: \d+/);
  });

  it('pause blocks input; reset returns to the seeded start', () => {
    const { q, instance } = start();
    const initial = instance.serialize();
    instance.pause();
    q('pp-lane-0').click();
    expect(instance.serialize().moves).toEqual([]);
    instance.resume();
    q('pp-lane-0').click();
    instance.reset();
    expect(instance.serialize()).toEqual(initial);
  });

  it('renders in every locale without missing keys; the picture stays left-to-right in RTL', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const { ctx, root, q, instance } = start({ locale, motif: 'fjord' });
      expect(ctx.missingKeys, locale).toEqual([]);
      expect(q('pp-title').textContent).not.toBe('');
      if (locale === 'ar') {
        expect(root.querySelector('.wp-pixel-peel')!.getAttribute('dir')).toBe('rtl');
        expect(q('pp-canvas').parentElement!.getAttribute('dir')).toBe('ltr');
      }
      instance.dispose();
    }
  });

  it('chooses black or white symbols by contrast', () => {
    expect(inkFor('#ffffff')).toBe('#000000');
    expect(inkFor('#f6ead2')).toBe('#000000');
    expect(inkFor('#241c18')).toBe('#ffffff');
    expect(inkFor('#2f6fb3')).toBe('#ffffff');
  });

  it('a save of an unknown motif keeps working with a generic title', () => {
    const s = { ...initialPositionState(), motif: 'gone-motif' };
    const { q } = start({ state: s });
    expect(q('pp-title').textContent).toBe('Your picture');
  });
});

function initialPositionState(): PeelState {
  const s = createInitial(2, 'easy', 'tiger');
  expect(initialPosition(s).cells.length).toBe(s.picture.w * s.picture.h);
  return s;
}
