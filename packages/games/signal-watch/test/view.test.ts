// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameContext, GameInstance, GameModule } from '@wp/game-core';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@wp/localization';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { SHOW_MS } from '../src/view';
import { generateSequence, GLYPHS, isValidSignalState, type SignalState } from '../src/rules';

const instances: GameInstance<SignalState>[] = [];

function setup(options: { reducedMotion?: boolean; locale?: SupportedLocale; seed?: number; difficulty?: string } = {}) {
  const ctx = createTestContext(game as GameModule<unknown>, options.locale ?? 'en');
  const context: GameContext = { ...ctx.context, reducedMotion: options.reducedMotion ?? true };
  const instance = game.create(context);
  instances.push(instance);
  const root = context.root;
  const el = (id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`) as HTMLElement;
  const button = (id: string) => el(id) as HTMLButtonElement;
  if (options.seed !== undefined) instance.newGame({ seed: options.seed, ...(options.difficulty ? { difficulty: options.difficulty } : {}) });
  const stimulus = () => ({ symbol: el('sw-stimulus').dataset.symbol, index: Number(el('sw-stimulus').dataset.index) });
  return { ctx, context, instance, root, el, button, stimulus };
}

/** Advances fake time to just before the onset of stimulus `index + 1`. */
const intervalOf = (state: SignalState, index: number) => generateSequence(state.seed, state.difficulty)[index]?.intervalMs as number;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  for (const instance of instances.splice(0)) instance.dispose();
  vi.useRealTimers();
});

describe('Signal Watch view', () => {
  it('shows the session length and the target before the start', () => {
    const g = setup({ seed: 1, difficulty: 'medium' });
    expect(g.el('sw-intro').hidden).toBe(false);
    expect(g.el('sw-length').textContent).toBe('Session length: about 4 minutes (160 symbols).');
    expect(g.el('sw-intro').textContent).toContain('Respond only to this target: Filled triangle, point up');
    expect(g.el('sw-intro').textContent).toContain('similar-looking');
    expect(g.el('sw-status').textContent).toBe('Start whenever you are ready.');
    expect(g.button('sw-respond').hidden).toBe(true);
    expect(g.instance.serialize()).toMatchObject({ phase: 'ready', index: 0, difficulty: 'medium' });
    const short = setup({ seed: 1 });
    expect(short.el('sw-length').textContent).toBe('Session length: about 2 minutes (80 symbols).');
    expect(short.el('sw-intro').textContent).not.toContain('similar-looking');
  });

  it('nothing happens until the player starts (no autoplay)', () => {
    const g = setup({ seed: 1 });
    vi.advanceTimersByTime(60_000);
    expect(g.instance.serialize()).toMatchObject({ phase: 'ready', index: 0 });
  });

  it('presents the seeded stream one symbol at a time and saves after each stimulus', () => {
    const g = setup({ seed: 8 });
    const sequence = generateSequence(8, 'short');
    g.button('sw-start').click();
    const savesAtStart = g.ctx.saveRequests();
    expect(g.stimulus()).toEqual({ symbol: sequence[0]?.symbol, index: 0 });
    expect(g.el('sw-stimulus').textContent).toBe(GLYPHS[sequence[0]?.symbol ?? 'up']);
    expect(g.el('sw-stimulus').getAttribute('aria-label')).toMatch(/^Symbol: /);
    expect(g.el('sw-status').textContent).toBe('Symbol 1 of 80');
    for (let i = 0; i < 5; i++) {
      vi.advanceTimersByTime((sequence[i]?.intervalMs as number) - 1);
      expect(g.stimulus().index).toBe(i);
      vi.advanceTimersByTime(1);
      expect(g.stimulus()).toEqual({ symbol: sequence[i + 1]?.symbol, index: i + 1 });
    }
    expect(g.ctx.saveRequests()).toBe(savesAtStart + 5);
    expect(g.instance.serialize()).toMatchObject({ phase: 'running', index: 5 });
  });

  it('announces each symbol name in a polite live region', () => {
    const g = setup({ seed: 8 });
    const sequence = generateSequence(8, 'short');
    g.button('sw-start').click();
    vi.advanceTimersByTime(50);
    const live = g.root.querySelector('[aria-live="polite"]') as HTMLElement;
    const names: Record<string, string> = { circle: 'Circle', square: 'Square', diamond: 'Diamond', star: 'Star' };
    expect(live.textContent).toBe(names[sequence[0]?.symbol as string]);
  });

  it('without reduced motion, the symbol is followed by a blank gap; with reduced motion it simply swaps', () => {
    const g = setup({ seed: 8, reducedMotion: false });
    g.button('sw-start').click();
    expect(g.stimulus().symbol).not.toBe('');
    vi.advanceTimersByTime(SHOW_MS);
    expect(g.stimulus()).toEqual({ symbol: '', index: 0 });
    expect(g.el('sw-stimulus').getAttribute('aria-label')).toBe('No symbol shown');
    const r = setup({ seed: 8 });
    r.button('sw-start').click();
    vi.advanceTimersByTime(SHOW_MS);
    expect(r.stimulus().symbol).not.toBe('');
  });

  it('records the reaction time within the response window, once per stimulus', () => {
    const g = setup({ seed: 8 });
    g.button('sw-start').click();
    vi.advanceTimersByTime(321);
    const saves = g.ctx.saveRequests();
    g.button('sw-respond').click();
    expect(g.ctx.saveRequests()).toBe(saves + 1);
    expect(g.instance.serialize().responses).toEqual([{ index: 0, rtMs: 321 }]);
    expect(g.el('sw-ack').textContent).toBe('Response noted.');
    expect(g.button('sw-respond').getAttribute('aria-disabled')).toBe('true');
    vi.advanceTimersByTime(100);
    g.button('sw-respond').click();
    expect(g.instance.serialize().responses).toHaveLength(1);
    expect(g.ctx.saveRequests()).toBe(saves + 1);
    // The window stays open during the blank gap until the next onset.
    vi.advanceTimersByTime(intervalOf(g.instance.serialize(), 0) - 421);
    expect(g.stimulus().index).toBe(1);
    expect(g.el('sw-ack').textContent).toBe('');
    expect(g.button('sw-respond').getAttribute('aria-disabled')).toBe('false');
    vi.advanceTimersByTime(intervalOf(g.instance.serialize(), 1) - 1);
    g.button('sw-respond').click();
    expect(g.instance.serialize().responses).toEqual([
      { index: 0, rtMs: 321 },
      { index: 1, rtMs: intervalOf(g.instance.serialize(), 1) - 1 }
    ]);
  });

  it('responds to Space and Enter on the page, and to pointer presses', () => {
    const g = setup({ seed: 8 });
    g.button('sw-start').click();
    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    document.body.dispatchEvent(space);
    expect(space.defaultPrevented).toBe(true);
    expect(g.instance.serialize().responses.map((r) => r.index)).toEqual([0]);
    vi.advanceTimersByTime(intervalOf(g.instance.serialize(), 0));
    g.button('sw-respond').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(g.instance.serialize().responses.map((r) => r.index)).toEqual([0, 1]);
    vi.advanceTimersByTime(intervalOf(g.instance.serialize(), 1));
    const down = new MouseEvent('pointerdown', { bubbles: true, button: 0 });
    g.button('sw-respond').dispatchEvent(down);
    expect(g.instance.serialize().responses.map((r) => r.index)).toEqual([0, 1, 2]);
    vi.advanceTimersByTime(intervalOf(g.instance.serialize(), 2));
    // Secondary button, other keys and repeats are ignored.
    g.button('sw-respond').dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 2 }));
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', repeat: true, bubbles: true }));
    expect(g.instance.serialize().responses).toHaveLength(3);
  });

  it('ignores keys typed into fields or on buttons outside the game', () => {
    const g = setup({ seed: 8 });
    g.button('sw-start').click();
    const input = document.body.appendChild(document.createElement('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    const outside = document.body.appendChild(document.createElement('button'));
    outside.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(g.instance.serialize().responses).toEqual([]);
    input.remove();
    outside.remove();
  });

  it('pause holds the session at the current stimulus; continue re-presents it', () => {
    const g = setup({ seed: 8 });
    g.button('sw-start').click();
    vi.advanceTimersByTime(intervalOf(g.instance.serialize(), 0) + 200);
    g.button('sw-respond').click();
    const mid = g.instance.serialize();
    expect(mid).toMatchObject({ index: 1, responses: [{ index: 1, rtMs: 200 }] });
    g.instance.pause();
    expect(g.el('sw-status').textContent).toBe('Paused. Continue whenever you are ready. Symbol 2 of 80');
    expect(g.button('sw-continue').hidden).toBe(false);
    expect(g.button('sw-respond').hidden).toBe(true);
    expect(g.stimulus()).toEqual({ symbol: '', index: 1 });
    vi.advanceTimersByTime(60_000);
    g.instance.resume();
    vi.advanceTimersByTime(60_000);
    expect(g.instance.serialize()).toEqual(mid);
    // Responses are ignored while held.
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(g.instance.serialize()).toEqual(mid);
    g.button('sw-continue').click();
    expect(g.stimulus()).toEqual({ symbol: generateSequence(8, 'short')[1]?.symbol, index: 1 });
    expect(g.el('sw-ack').textContent).toBe('Response noted.');
    vi.advanceTimersByTime(intervalOf(mid, 1));
    expect(g.instance.serialize()).toMatchObject({ index: 2, responses: mid.responses });
  });

  it('continue is ignored while the host keeps the game paused', () => {
    const g = setup({ seed: 8 });
    g.button('sw-start').click();
    g.instance.pause();
    g.button('sw-continue').click();
    expect(g.button('sw-continue').hidden).toBe(false);
    vi.advanceTimersByTime(10_000);
    expect(g.instance.serialize().index).toBe(0);
  });

  it('restores a mid-session save at the same index, waiting for continue', () => {
    const g = setup({ seed: 8 });
    g.button('sw-start').click();
    vi.advanceTimersByTime(intervalOf(g.instance.serialize(), 0) + intervalOf(g.instance.serialize(), 1) + 10);
    g.button('sw-respond').click();
    const saved = JSON.parse(JSON.stringify(g.instance.serialize())) as SignalState;
    expect(isValidSignalState(saved)).toBe(true);
    g.instance.dispose();

    const r = setup();
    r.instance.restore(saved);
    expect(r.instance.serialize()).toEqual(saved);
    expect(r.stimulus()).toEqual({ symbol: '', index: 2 });
    expect(r.button('sw-continue').hidden).toBe(false);
    vi.advanceTimersByTime(30_000);
    expect(r.instance.serialize()).toEqual(saved);
    r.button('sw-continue').click();
    expect(r.stimulus().index).toBe(2);
    r.button('sw-respond').click();
    expect(r.instance.serialize().responses).toEqual(saved.responses);
    vi.advanceTimersByTime(intervalOf(saved, 2));
    expect(r.instance.serialize().index).toBe(3);
  });

  it('finishes once with factual stats and a calm summary', () => {
    const g = setup({ seed: 12 });
    const sequence = generateSequence(12, 'short');
    g.button('sw-start').click();
    for (let i = 0; i < sequence.length; i++) {
      vi.advanceTimersByTime(250);
      // Answer every target and the very first non-target.
      if (sequence[i]?.target || i === 0) g.button('sw-respond').click();
      vi.advanceTimersByTime((sequence[i]?.intervalMs as number) - 250);
    }
    expect(g.instance.serialize()).toMatchObject({ phase: 'finished', index: 80 });
    expect(g.ctx.results).toEqual([{ outcome: 'completed', stats: { hits: 10, misses: 0, falseAlarms: 1, meanRtMs: 250 } }]);
    const summary = g.el('sw-summary');
    expect(summary.hidden).toBe(false);
    expect(summary.textContent).toContain('Targets answered: 10 of 10');
    expect(summary.textContent).toContain('Targets missed: 0');
    expect(summary.textContent).toContain('Responses to other symbols: 1');
    expect(summary.textContent).toContain('Mean reaction time on targets: 250 ms');
    expect(summary.textContent).not.toMatch(/record|best|beat/i);
    expect(g.el('sw-status').textContent).toBe('Session complete.');
    vi.advanceTimersByTime(60_000);
    expect(g.ctx.results).toHaveLength(1);

    const r = setup();
    r.instance.restore(g.instance.serialize());
    expect(r.ctx.results).toEqual([]);
    expect(r.el('sw-summary').textContent).toContain('Targets answered: 10 of 10');
  });

  it('omits the mean reaction time when no target was answered', () => {
    const g = setup({ seed: 12 });
    const sequence = generateSequence(12, 'short');
    g.button('sw-start').click();
    vi.advanceTimersByTime(sequence.reduce((sum, s) => sum + s.intervalMs, 0));
    expect(g.ctx.results).toEqual([{ outcome: 'completed', stats: { hits: 0, misses: 10, falseAlarms: 0 } }]);
    expect(g.el('sw-summary').textContent).toContain('No reaction time this time');
  });

  it('newGame and reset return to the ready state and stop the stream', () => {
    const g = setup({ seed: 8 });
    g.button('sw-start').click();
    vi.advanceTimersByTime(5_000);
    g.instance.reset();
    expect(g.instance.serialize()).toEqual({ seed: 8, difficulty: 'short', phase: 'ready', index: 0, responses: [] });
    vi.advanceTimersByTime(5_000);
    expect(g.instance.serialize().phase).toBe('ready');
    g.instance.newGame({ seed: 9, difficulty: 'long' });
    expect(g.instance.serialize()).toEqual({ seed: 9, difficulty: 'long', phase: 'ready', index: 0, responses: [] });
    expect(g.el('sw-intro').hidden).toBe(false);
  });

  it('renders in every locale (Arabic right-to-left) without missing keys', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const g = setup({ seed: 2, locale, difficulty: 'long' });
      g.button('sw-start').click();
      g.button('sw-respond').click();
      g.instance.pause();
      expect(g.ctx.missingKeys, locale).toEqual([]);
      if (locale === 'ar') expect(g.root.firstElementChild?.getAttribute('dir')).toBe('rtl');
    }
  });
});
