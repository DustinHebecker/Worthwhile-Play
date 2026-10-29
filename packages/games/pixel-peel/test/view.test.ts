// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestContext } from '@wp/testing';
import type { GameInstance, GameModule } from '@wp/game-core';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@wp/localization';
import game from '../src/index';
import { createInitial } from '../src/generate';
import { exposed, initialPosition, play, position, type PeelState } from '../src/rules';
import { createPixelPeel, inkFor, peelOf, type PeelMode } from '../src/view';
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
    expect(q('pp-title').textContent).toBe(`Red fox · ${s.picture.palette.length} colours`);
    const total = s.picture.rows.join('').replace(/\./g, '').length;
    expect(q('pp-left').textContent).toBe(`Pixels left: ${total} of ${total}`);
    expect(root.querySelectorAll('[data-testid^="pp-lane-box-"]')).toHaveLength(4);
    expect(root.querySelectorAll('[data-testid^="pp-slot-free-"]:not([hidden])')).toHaveLength(5);
    expect(q('pp-canvas').getAttribute('role')).toBe('img');
    expect(s.picture.w).toBe(32);
    expect(q('pp-canvas').getAttribute('aria-label')).toContain(`Picture “Red fox”, 32 × ${s.picture.h} pixels`);
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

  it('pointing previews; leaving another shooter does not clear the preview, leaving this one does', () => {
    const { q } = start({ difficulty: 'medium' });
    const mouse = (type: string) => Object.assign(new Event(type), { pointerType: 'mouse' });
    q('pp-lane-0').dispatchEvent(mouse('pointerenter'));
    const preview = q('pp-canvas').dataset.preview;
    expect(preview).not.toBe('');
    q('pp-lane-1').dispatchEvent(mouse('pointerleave'));
    expect(q('pp-canvas').dataset.preview).toBe(preview);
    q('pp-lane-0').dispatchEvent(mouse('pointerleave'));
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
    vi.useFakeTimers();
    doomed.q('pp-stuck-hint').click();
    // Off the witness path the hint needs a search: a busy state first, the answer one frame later.
    expect(doomed.status()).toBe('Checking…');
    expect(doomed.q('pp-status').getAttribute('aria-busy')).toBe('true');
    vi.advanceTimersByTime(50);
    expect(doomed.q('pp-status').hasAttribute('aria-busy')).toBe(false);
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

  it('announces the move result and the stuck state together in one message', () => {
    const { q, ctx } = start({ state: ringState() });
    vi.useFakeTimers();
    q('pp-lane-1').click();
    vi.advanceTimersByTime(100);
    const said = q('pp-live').textContent ?? '';
    expect(said).toMatch(/waits in place 1/);
    expect(said).toContain('No move left. Undo a move, or start this picture again.');
    expect(q('pp-stuck').hidden).toBe(false);
    expect(ctx.results).toEqual([]);
  });

  it('a solved save that was not yet reported is reported once on restore', () => {
    let s = createInitial(5, 'easy', 'koala');
    for (const m of s.witness) s = play(s, m);
    expect(s.reported).toBe(false);
    const first = start({ state: s });
    expect(first.q('pp-reveal').hidden).toBe(false);
    expect(first.ctx.results).toHaveLength(1);
    expect(first.ctx.results[0]!.outcome).toBe('completed');
    expect(first.ctx.saveRequests()).toBeGreaterThan(0);
    const saved = first.instance.serialize();
    expect(saved.reported).toBe(true);
    first.instance.dispose();
    const again = start({ state: saved });
    expect(again.ctx.results).toEqual([]);
  });

  it('"Confirm before launch": a press anywhere outside the game cancels the selection', () => {
    const { q, instance } = start({ prefs: { display: { animation: true, allSymbols: false, confirm: true } } });
    q('pp-lane-0').click();
    expect(q('pp-lane-0').classList.contains('is-selected')).toBe(true);
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(q('pp-lane-0').classList.contains('is-selected')).toBe(false);
    q('pp-lane-0').click();
    expect(instance.serialize().moves).toEqual([]);
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
    const fronts = [0, 1, 2, 3].map((i) => q(`pp-lane-${i}`));
    expect(fronts.map((b) => b.tabIndex)).toEqual([0, -1, -1, -1]);
    fronts[0]!.focus();
    fronts[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.activeElement).toBe(fronts[1]);
    expect(fronts.map((b) => b.tabIndex)).toEqual([-1, 0, -1, -1]);
    fronts[1]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(document.activeElement).toBe(fronts[3]);
    expect(q('pp-canvas').dataset.preview).not.toBe('');
    fronts[3]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(q('pp-canvas').dataset.preview).toBe('');
    const legal = fronts.findIndex((b) => b.getAttribute('aria-disabled') === 'false');
    fronts[legal]!.click();
    expect(instance.serialize().moves).toEqual([`L${legal}`]);
    root.firstElementChild!.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
    expect(instance.serialize().moves).toEqual([]);
  });

  it('on a touch screen "Confirm before launch" is on by default; a remembered choice wins', () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({ matches: query.includes('coarse'), media: query, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
    try {
      const touch = start();
      expect((touch.q('pp-option-confirm') as HTMLInputElement).checked).toBe(true);
      touch.q('pp-lane-0').click();
      expect(touch.instance.serialize().moves).toEqual([]);
      expect(touch.q('pp-canvas').dataset.spotlight).not.toBe('');
      touch.instance.dispose();
      const chosen = start({ prefs: { display: { confirm: false } } });
      expect((chosen.q('pp-option-confirm') as HTMLInputElement).checked).toBe(false);
      chosen.q('pp-lane-0').click();
      expect(chosen.instance.serialize().moves).toEqual(['L0']);
    } finally {
      window.matchMedia = original;
    }
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
    expect(ctx.preferences.get('display')).toEqual({ peel: 'slow', allSymbols: true, confirm: false, large: false, wholeLanes: null });
    expect(instance.serialize()).toEqual(before);
    expect(ctx.saveRequests()).toBe(saves);
    // Reduced motion: Peeling shows Off and cannot be changed, with the reason.
    for (const mode of ['slow', 'quick', 'off']) expect((q(`pp-option-peel-${mode}`) as HTMLInputElement).disabled).toBe(true);
    expect((q('pp-option-peel-off') as HTMLInputElement).checked).toBe(true);
    expect(q('pp-peel-reduced').hidden).toBe(false);
    expect(q('pp-peel-reduced').textContent).toBe('Off, because your device asks for reduced motion.');
  });

  it('the colours overview lists every colour by name with counts', () => {
    const { root, instance } = start({ motif: 'llama' });
    const s = instance.serialize();
    const rows = root.querySelectorAll('[data-testid^="pp-colour-"]');
    expect(rows).toHaveLength(s.picture.palette.length);
    const counts = [...rows].map((r) => r.querySelector('.pp-colour-count')!.textContent);
    for (const c of counts) expect(c).toMatch(/^left \d+ · at the edge now \d+ · shots waiting \d+$/);
    // At the start every pixel is left and every shot waits: the numbers add up to the picture.
    const total = s.picture.rows.join('').replace(/\./g, '').length;
    expect(counts.reduce((a, c) => a + Number(/^left (\d+)/.exec(c!)![1]), 0)).toBe(total);
    expect(counts.reduce((a, c) => a + Number(/shots waiting (\d+)$/.exec(c!)![1]), 0)).toBe(total);
  });

  it('a previewed shooter puts its colour in the spotlight; "Show" lights up one colour from the list', () => {
    const { q, instance } = start({ difficulty: 'medium', motif: 'koala' });
    const s = instance.serialize();
    expect(q('pp-canvas').dataset.spotlight).toBe('');
    const front = q('pp-lane-0');
    front.focus();
    expect(q('pp-canvas').dataset.spotlight).toBe(front.dataset.colour);
    front.blur();
    expect(q('pp-canvas').dataset.spotlight).toBe('');
    const key = s.picture.palette[2]!.key;
    const show = q(`pp-show-${key}`);
    expect(show.getAttribute('aria-pressed')).toBe('false');
    expect(show.getAttribute('aria-label')).toMatch(/^Show .+ in the picture$/);
    show.click();
    expect(show.getAttribute('aria-pressed')).toBe('true');
    expect(q('pp-canvas').dataset.spotlight).toBe(key);
    // A preview takes the spotlight while it lasts; the shown colour comes back afterwards.
    front.focus();
    expect(q('pp-canvas').dataset.spotlight).toBe(front.dataset.colour);
    front.blur();
    expect(q('pp-canvas').dataset.spotlight).toBe(key);
    show.click();
    expect(show.getAttribute('aria-pressed')).toBe('false');
    expect(q('pp-canvas').dataset.spotlight).toBe('');
    expect(instance.serialize()).toEqual(s);
  });

  it('long lanes show 7 shooters behind the front until "Show whole lanes"', () => {
    const { q, root, ctx, instance } = start({ difficulty: 'hard', motif: 'winter-village' });
    const s = instance.serialize();
    const visibleChips = (i: number) => q(`pp-lane-box-${i}`).querySelectorAll('.pp-chip:not([hidden])').length;
    const toggle = q('pp-lanes-toggle');
    expect(toggle.hidden).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    const hiddenCount = s.lanes.reduce((a, lane) => a + Math.max(0, lane.length - 1 - 7), 0);
    expect(toggle.textContent).toBe(`Show whole lanes (+${hiddenCount})`);
    s.lanes.forEach((lane, i) => expect(visibleChips(i)).toBe(Math.min(7, lane.length - 1)));
    toggle.click();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.textContent).toBe('Show fewer shooters');
    s.lanes.forEach((lane, i) => expect(visibleChips(i)).toBe(lane.length - 1));
    expect(ctx.preferences.get('display')).toMatchObject({ wholeLanes: true });
    // Chips are built when first shown, in lane order.
    expect(root.querySelectorAll('.pp-chip')).toHaveLength(s.lanes.reduce((a, lane) => a + lane.length - 1, 0));
    s.lanes.forEach((_, i) => {
      const order = [...q(`pp-lane-box-${i}`).querySelectorAll<HTMLElement>('.pp-chip')].map((c) => Number(c.dataset.index));
      expect(order).toEqual([...order].sort((a, b) => a - b));
    });
  });

  it('chips built on demand: after restoring a game in progress, undoing back to the start shows each lane in order', () => {
    let s = createInitial(5, 'hard', 'market-stall');
    for (const m of s.witness.slice(0, 30)) s = play(s, m);
    const { q, instance } = start({ state: s });
    const check = () => {
      const now = instance.serialize();
      const pos = position(now);
      now.lanes.forEach((lane, i) => {
        const k = pos.laneFront[i]!;
        const shown = [...q(`pp-lane-box-${i}`).querySelectorAll<HTMLElement>('.pp-chip:not([hidden])')].map((c) => Number(c.dataset.index));
        const expected: number[] = [];
        for (let j = k + 1; j < Math.min(lane.length, k + 8); j++) expected.push(j);
        expect(shown, `lane ${i} after ${now.moves.length} moves`).toEqual(expected);
      });
    };
    check();
    for (let k = 0; k < 30; k++) {
      q('pp-undo').click();
      check();
    }
    expect(instance.serialize().moves).toEqual([]);
  });

  it('Large view: a scrollable, focusable picture region with symbols on the edge pixels', () => {
    const { q, ctx, instance } = start({ difficulty: 'hard', motif: 'red-fox' });
    const before = instance.serialize();
    const board = q('pp-board');
    expect(board.hasAttribute('role')).toBe(false);
    // Small cells (8 px in a layout-less test DOM): no symbols on the picture.
    expect(Number(q('pp-canvas').dataset.cell)).toBeLessThan(10);
    expect(q('pp-canvas').dataset.symbols).toBe('none');
    const large = q('pp-option-large') as HTMLInputElement;
    large.checked = true;
    large.dispatchEvent(new Event('change'));
    expect(board.classList.contains('is-large')).toBe(true);
    expect(board.getAttribute('role')).toBe('region');
    expect(board.getAttribute('tabindex')).toBe('0');
    expect(board.getAttribute('aria-label')).toBe('Picture, large view: scroll or use the arrow keys');
    expect(q('pp-canvas').dataset.cell).toBe('14');
    expect(q('pp-canvas').dataset.symbols).toBe('edge');
    const all = q('pp-option-allSymbols') as HTMLInputElement;
    all.checked = true;
    all.dispatchEvent(new Event('change'));
    expect(q('pp-canvas').dataset.symbols).toBe('all');
    expect(ctx.preferences.get('display')).toMatchObject({ large: true, allSymbols: true });
    expect(instance.serialize()).toEqual(before);
    const fit = q('pp-option-fit') as HTMLInputElement;
    fit.checked = true;
    fit.dispatchEvent(new Event('change'));
    expect(board.hasAttribute('role')).toBe(false);
  });

  it('the display preferences are read back on the next start', () => {
    const { q } = start({ prefs: { display: { animation: true, allSymbols: false, confirm: false, large: true, wholeLanes: true } } });
    expect((q('pp-option-large') as HTMLInputElement).checked).toBe(true);
    expect((q('pp-option-wholeLanes') as HTMLInputElement).checked).toBe(true);
    expect(q('pp-board').classList.contains('is-large')).toBe(true);
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
    expect(q('pp-title').textContent).toMatch(/^Your picture · \d+ colours$/);
  });
});

function initialPositionState(): PeelState {
  const s = createInitial(2, 'easy', 'tiger');
  expect(initialPosition(s).cells.length).toBe(s.picture.w * s.picture.h);
  return s;
}

/** A fake frame scheduler and clock (the view's injectable options): frames run only when a test steps them. */
function fakeFrames() {
  let time = 1000;
  let id = 0;
  const queue = new Map<number, (t: number) => void>();
  const step = (ms: number) => {
    time += ms;
    const callbacks = [...queue.values()];
    queue.clear();
    for (const cb of callbacks) cb(time);
  };
  return {
    options: { frame: (cb: (t: number) => void) => (queue.set(++id, cb), id), cancelFrame: (h: number) => void queue.delete(h), now: () => time },
    step,
    /** Steps 16 ms frames until nothing is scheduled (or `limit` ms passed). */
    runOut(limit = 30_000) {
      for (let t = 0; t < limit && queue.size > 0; t += 16) step(16);
    },
    get scheduled() {
      return queue.size;
    }
  };
}

/** A game with motion allowed (the test context has reduced motion) and the fake frames. */
function startMotion(options: { peel?: PeelMode; state?: PeelState; motif?: string; difficulty?: string; seed?: number; reducedMotion?: boolean } = {}) {
  const ctx = createTestContext(game as GameModule<unknown>, 'en');
  ctx.preferences.set('display', { confirm: false, ...(options.peel ? { peel: options.peel } : {}) });
  const frames = fakeFrames();
  const context = { ...ctx.context, reducedMotion: options.reducedMotion ?? false };
  const instance = createPixelPeel(context, frames.options);
  if (options.state) instance.restore(options.state);
  else instance.newGame({ seed: options.seed ?? 1, difficulty: options.difficulty ?? 'easy', settings: { motif: options.motif ?? 'red-fox' } });
  cleanup.push(() => instance.dispose());
  const root = ctx.context.root;
  const q = (id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
  const press = (move: string) => q(move.startsWith('L') ? `pp-lane-${move.slice(1)}` : `pp-slot-${move.slice(1)}`).click();
  const peeling = () => Number(q('pp-board').dataset.peeling);
  const pending = () => Number(q('pp-board').dataset.pending);
  return { ctx, instance, root, q, frames, press, peeling, pending };
}

describe('slow peeling (design v3 § 3)', () => {
  it('the stored preference: peel when valid, the v2 animation: false as Off, else Slow', () => {
    expect(peelOf({ peel: 'quick' })).toBe('quick');
    expect(peelOf({ peel: 'off', animation: true })).toBe('off');
    expect(peelOf({ animation: false })).toBe('off');
    expect(peelOf({ animation: true })).toBe('slow');
    expect(peelOf({})).toBe('slow');
    expect(peelOf({ peel: 'fast', animation: false })).toBe('off');
    expect(peelOf({ peel: 'fast' })).toBe('slow');
    for (const junk of [undefined, null, 3, 'slow', [], { peel: 1 }]) expect(peelOf(junk)).toBe('slow');
  });

  it('Slow is the default; an old record with animation: false starts with Off and is saved without animation', () => {
    const fresh = startMotion();
    expect((fresh.q('pp-option-peel-slow') as HTMLInputElement).checked).toBe(true);
    expect(fresh.q('pp-peel-reduced').hidden).toBe(true);
    fresh.instance.dispose();
    const ctx = createTestContext(game as GameModule<unknown>, 'en');
    ctx.preferences.set('display', { animation: false, allSymbols: false, confirm: false });
    const instance = createPixelPeel({ ...ctx.context, reducedMotion: false }, fakeFrames().options);
    instance.newGame({ seed: 1, difficulty: 'easy', settings: { motif: 'red-fox' } });
    cleanup.push(() => instance.dispose());
    const q = (id: string) => ctx.context.root.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
    expect((q('pp-option-peel-off') as HTMLInputElement).checked).toBe(true);
    const box = q('pp-option-allSymbols') as HTMLInputElement;
    box.checked = true;
    box.dispatchEvent(new Event('change'));
    expect(ctx.preferences.get('display')).toEqual({ peel: 'off', allSymbols: true, confirm: false, large: false, wholeLanes: null });
  });

  it('launches are committed and saved before any frame runs; they queue and peel one after the other', () => {
    const { instance, ctx, frames, press, peeling, pending, q } = startMotion();
    const witness = instance.serialize().witness;
    const saves = ctx.saveRequests();
    press(witness[0]!);
    press(witness[1]!);
    expect(instance.serialize().moves).toEqual(witness.slice(0, 2));
    expect(ctx.saveRequests()).toBe(saves + 2);
    expect(peeling()).toBe(2);
    const committedHits = pending();
    expect(committedHits).toBeGreaterThan(0);
    expect(q('pp-finish-peeling').hidden).toBe(false);
    expect(q('pp-finish-peeling').getAttribute('aria-label')).toBe('Finish peeling (2)');
    expect(q('pp-finish-peeling').textContent).toBe('Finish peeling2');
    // The text and the numbers describe the committed position at once.
    expect(q('pp-status').textContent).toMatch(/removed \d+/);
    frames.step(16);
    expect(pending()).toBeLessThanOrEqual(committedHits);
    frames.runOut();
    expect(peeling()).toBe(0);
    expect(pending()).toBe(0);
    expect(q('pp-finish-peeling').hidden).toBe(true);
    expect(frames.scheduled).toBe(0);
    expect(instance.serialize().moves).toEqual(witness.slice(0, 2));
  });

  it('input is never blocked: a launch while peeling queues, the preview works, Finish peeling ends it at once', () => {
    const { instance, frames, press, peeling, pending, q } = startMotion();
    const witness = instance.serialize().witness;
    press(witness[0]!);
    frames.step(16);
    const lane = q(witness[1]!.startsWith('L') ? `pp-lane-${witness[1]!.slice(1)}` : `pp-slot-${witness[1]!.slice(1)}`);
    lane.focus();
    expect(q('pp-canvas').dataset.preview).not.toBe('');
    expect(peeling()).toBe(1);
    press(witness[1]!);
    press(witness[2]!);
    expect(instance.serialize().moves).toEqual(witness.slice(0, 3));
    expect(peeling()).toBe(3);
    q('pp-finish-peeling').click();
    expect(peeling()).toBe(0);
    expect(pending()).toBe(0);
    expect(frames.scheduled).toBe(0);
  });

  it('Undo, Start again, Hint and pause finish the queue first', () => {
    const { instance, press, peeling, pending, q } = startMotion();
    const witness = instance.serialize().witness;
    press(witness[0]!);
    press(witness[1]!);
    q('pp-undo').click();
    expect(peeling()).toBe(0);
    expect(pending()).toBe(0);
    expect(instance.serialize().moves).toEqual(witness.slice(0, 1));
    press(witness[1]!);
    q('pp-restart').click();
    expect(peeling()).toBe(0);
    expect(instance.serialize().moves).toEqual([]);
    q('pp-undo').click();
    press(witness[2]!);
    expect(peeling()).toBe(1);
    q('pp-hint').click();
    expect(peeling()).toBe(0);
    press(witness[3]!);
    expect(peeling()).toBe(1);
    instance.pause();
    expect(peeling()).toBe(0);
    instance.resume();
  });

  it('switching Peeling to Quick or Off mid-queue finishes it at once; with Off nothing ever queues', () => {
    const { instance, frames, press, peeling, q, ctx } = startMotion();
    const witness = instance.serialize().witness;
    press(witness[0]!);
    expect(peeling()).toBe(1);
    const quick = q('pp-option-peel-quick') as HTMLInputElement;
    quick.checked = true;
    quick.dispatchEvent(new Event('change'));
    expect(peeling()).toBe(0);
    expect(ctx.preferences.get('display')).toMatchObject({ peel: 'quick' });
    // Quick: the short animation, no queue.
    press(witness[1]!);
    expect(peeling()).toBe(0);
    frames.runOut();
    const off = q('pp-option-peel-off') as HTMLInputElement;
    off.checked = true;
    off.dispatchEvent(new Event('change'));
    press(witness[2]!);
    expect(peeling()).toBe(0);
    expect(frames.scheduled).toBe(0);
    // Back to Slow: from the next launch.
    const slow = q('pp-option-peel-slow') as HTMLInputElement;
    slow.checked = true;
    slow.dispatchEvent(new Event('change'));
    press(witness[3]!);
    expect(peeling()).toBe(1);
  });

  it('reduced motion forces Off: no queue, no frames', () => {
    const { instance, frames, press, peeling, q } = startMotion({ peel: 'slow', reducedMotion: true });
    expect((q('pp-option-peel-off') as HTMLInputElement).checked).toBe(true);
    expect((q('pp-option-peel-slow') as HTMLInputElement).disabled).toBe(true);
    press(instance.serialize().witness[0]!);
    expect(peeling()).toBe(0);
    expect(frames.scheduled).toBe(0);
  });

  it('finishing the picture while peeling calls finished() once at the last move; the reveal shows after the queue', () => {
    let s = createInitial(4, 'medium', 'koala');
    const last = s.witness.length - 1;
    for (const m of s.witness.slice(0, last - 1)) s = play(s, m);
    const { ctx, instance, frames, press, peeling, q } = startMotion({ state: s });
    press(s.witness[last - 1]!);
    press(s.witness[last]!);
    expect(ctx.results).toHaveLength(1);
    expect(instance.serialize().reported).toBe(true);
    expect(peeling()).toBe(2);
    expect(q('pp-reveal').hidden).toBe(true);
    frames.runOut();
    expect(q('pp-reveal').hidden).toBe(false);
    expect(document.activeElement).toBe(q('pp-reveal-title'));
    expect(ctx.results).toHaveLength(1);
  });

  it('a restored game shows the committed picture without replaying old launches', () => {
    let s = createInitial(1, 'easy', 'red-fox');
    for (const m of s.witness.slice(0, 5)) s = play(s, m);
    const { peeling, pending, frames } = startMotion({ state: s });
    expect(peeling()).toBe(0);
    expect(pending()).toBe(0);
    expect(frames.scheduled).toBe(0);
  });

  it('dispose while peeling stops the frames', () => {
    const { instance, press, frames } = startMotion();
    press(instance.serialize().witness[0]!);
    expect(frames.scheduled).toBe(1);
    instance.dispose();
    expect(frames.scheduled).toBe(0);
  });
});
