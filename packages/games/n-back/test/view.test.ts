// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameContext, GameInstance, GameModule, SettingValue } from '@wp/game-core';
import type { SupportedLocale } from '@wp/localization';
import { createTestContext } from '@wp/testing';
import game, { nBackSettings } from '../src/index';
import { blockLength, generateBlock, GLYPHS, matchMask, SHAPES, TIMED_ITEM_MS, type Difficulty, type NBackState } from '../src/rules';

const instances: GameInstance<NBackState>[] = [];

function setup(options: { locale?: SupportedLocale; seed?: number; difficulty?: Difficulty; settings?: Record<string, SettingValue>; begin?: boolean } = {}) {
  const ctx = createTestContext(game as GameModule<unknown>, options.locale ?? 'en');
  const context: GameContext = ctx.context;
  const instance = game.create(context);
  instances.push(instance);
  const root = context.root;
  const el = (id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`) as HTMLElement;
  const click = (id: string) => el(id).click();
  if (options.seed !== undefined)
    instance.newGame({ seed: options.seed, ...(options.difficulty ? { difficulty: options.difficulty } : {}), ...(options.settings ? { settings: options.settings } : {}), ...(options.begin ? { begin: true } : {}) });
  const state = () => instance.serialize();
  const activeCells = () => [...root.querySelectorAll<HTMLElement>('[data-state="active"]')].map((c) => Number(c.dataset.testid?.slice('nb-cell-'.length)));
  return { ctx, context, instance, root, el, click, state, activeCells };
}

const press = (key: string, target: EventTarget = document.body, code?: string) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key, code: code ?? '', bubbles: true, cancelable: true }));

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  for (const instance of instances.splice(0)) instance.dispose();
  vi.useRealTimers();
});

describe('N-back view: intro and options', () => {
  it('explains the task before the start and waits (no autoplay)', () => {
    const g = setup({ seed: 1, difficulty: 'n2' });
    expect(g.el('nb-intro').hidden).toBe(false);
    expect(g.el('nb-task').textContent).toBe('Compare each item with the item 2 back in the series.');
    expect(g.el('nb-length').textContent).toContain('22 items');
    expect(g.el('nb-intro').textContent).not.toContain('look-alikes');
    expect(g.el('nb-start').hasAttribute('data-autofocus')).toBe(true);
    expect(g.el('nb-play').hidden).toBe(true);
    vi.advanceTimersByTime(60_000);
    expect(g.state()).toMatchObject({ phase: 'ready', index: 0 });
    expect(setup({ seed: 1, difficulty: 'n3' }).el('nb-intro').textContent).toContain('look-alikes');
  });

  it('takes variant and pace from the start-screen settings; junk falls back to the defaults', () => {
    const g = setup({ seed: 1, settings: { variant: 'dual', pace: 'timed' } });
    expect(g.state()).toMatchObject({ variant: 'dual', pace: 'timed', phase: 'ready' });
    expect(g.el('nb-intro').textContent).toContain('Pausing stops the clock');
    // No option controls inside the game any more (ADR 0017).
    expect(g.root.querySelector('[data-testid^="nb-variant-"], [data-testid^="nb-pace-"]')).toBeNull();
    expect(setup({ seed: 1, settings: { variant: 'letters', pace: 7 } }).state()).toMatchObject({ variant: 'position', pace: 'self' });
    expect(setup({ seed: 1 }).state()).toMatchObject({ variant: 'position', pace: 'self' });
  });

  it('begins the block at once after the host\'s Start (begin), without the intro', () => {
    const g = setup({ seed: 5, difficulty: 'n2', begin: true });
    expect(g.state()).toMatchObject({ phase: 'running', index: 0 });
    expect(g.el('nb-intro').hidden).toBe(true);
    expect(g.el('nb-play').hidden).toBe(false);
    expect(g.activeCells()).toEqual([generateBlock(5, 'n2')[0]?.position]);
    // Nothing more to remind of at N = 2 and the player's own pace.
    expect(g.el('nb-reminder').hidden).toBe(true);
  });

  it('keeps the intro\'s notes on look-alikes (N = 3) and the timed pace visible during the block', () => {
    const g = setup({ seed: 5, difficulty: 'n3', settings: { pace: 'timed' }, begin: true });
    expect(g.el('nb-reminder').hidden).toBe(false);
    expect(g.el('nb-reminder').textContent).toContain('look-alikes');
    expect(g.el('nb-reminder').textContent).toContain('Timed pace');
  });

  it('declares variant and pace; their defaults follow the options older versions remembered', () => {
    const ctx = createTestContext(game as GameModule<unknown>, 'en');
    expect(nBackSettings(ctx.settingsEnv).map((s) => [s.kind === 'choice' ? s.id : s.kind, s.kind === 'choice' ? s.default : undefined])).toEqual([
      ['variant', 'position'],
      ['pace', 'self']
    ]);
    ctx.preferences.set('options', { variant: 'symbol', pace: 'timed' });
    expect(nBackSettings(ctx.settingsEnv).map((s) => (s.kind === 'choice' ? s.default : undefined))).toEqual(['symbol', 'timed']);
    ctx.preferences.set('options', { variant: 'letters', pace: 7 });
    expect(nBackSettings(ctx.settingsEnv).map((s) => (s.kind === 'choice' ? s.default : undefined))).toEqual(['position', 'self']);
    expect(game.metadata.messages.en?.['pace.timed']).toBe('Calm timed (3 s per item)');
  });
});

describe('N-back view: self-paced play', () => {
  it('shows the seeded item as a marked cell with a text description', () => {
    const g = setup({ seed: 5, difficulty: 'n2' });
    const block = generateBlock(5, 'n2');
    g.click('nb-start');
    expect(g.activeCells()).toEqual([block[0]?.position]);
    expect(g.el('nb-item').textContent).toMatch(/^Item 1: /);
    expect(g.el('nb-item').dataset.position).toBe(String(block[0]?.position));
    expect(g.el('nb-status').textContent).toBe('Item 1 of 22');
    expect(g.el('nb-prompt').textContent).toBe('Nothing to compare yet. Remember this item.');
    expect(g.el('nb-next').hidden).toBe(false);
    expect(g.el('nb-match').hidden).toBe(true);
    expect(document.activeElement).toBe(g.el('nb-next'));
    // Self-paced: nothing moves on its own.
    vi.advanceTimersByTime(60_000);
    expect(g.state().index).toBe(0);
    g.click('nb-next');
    g.click('nb-next');
    expect(g.el('nb-match').hidden).toBe(false);
    expect(g.el('nb-no-match').hidden).toBe(false);
    expect(g.el('nb-next').hidden).toBe(true);
    expect(g.el('nb-prompt').textContent).toBe('Same as 2 back?');
    expect(g.el('nb-keys').textContent).toContain('M or Space');
    g.click('nb-match');
    g.click('nb-no-match');
    expect(g.state()).toMatchObject({ index: 4, answers: [0, 0, 1, 0] });
    expect(g.activeCells()).toEqual([block[4]?.position]);
  });

  it('answers with the keyboard: M / Space = match, N / J = no match', () => {
    const g = setup({ seed: 3, difficulty: 'n1' });
    g.click('nb-start');
    press('Enter');
    expect(g.state().index).toBe(1);
    press('m');
    press(' ');
    press('n');
    press('j');
    press('x');
    // Physical key codes work with non-Latin layouts too.
    press('ь', document.body, 'KeyM');
    expect(g.state().answers).toEqual([0, 1, 1, 0, 0, 1]);
    // Key repeat and modifier shortcuts are ignored.
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', repeat: true, bubbles: true }));
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', ctrlKey: true, bubbles: true }));
    expect(g.state().index).toBe(6);
    // Space on a focused button is left to the button itself.
    press(' ', g.el('nb-no-match'));
    expect(g.state().index).toBe(6);
  });

  it('dual variant: toggles both claims and confirms with Next (A, L, Enter)', () => {
    const g = setup({ seed: 4, difficulty: 'n1', settings: { variant: 'dual', pace: 'self' } });
    const block = generateBlock(4, 'n1');
    g.click('nb-start');
    const cell = g.el(`nb-cell-${block[0]?.position}`);
    expect(cell.textContent).toBe(GLYPHS[SHAPES[block[0]?.symbol ?? 0] ?? 'circle']);
    g.click('nb-next');
    expect(g.el('nb-same-position').hidden).toBe(false);
    expect(g.el('nb-match').hidden).toBe(true);
    g.click('nb-same-position');
    expect(g.el('nb-same-position').getAttribute('aria-pressed')).toBe('true');
    expect(g.state().pending).toBe(1);
    g.click('nb-next');
    press('l');
    press('a');
    press('a');
    expect(g.state().pending).toBe(2);
    press('Enter');
    expect(g.state()).toMatchObject({ index: 3, answers: [0, 1, 2], pending: 0 });
    expect(g.el('nb-same-position').getAttribute('aria-pressed')).toBe('false');
  });

  it('symbol variant shows a large shape instead of the grid', () => {
    const g = setup({ seed: 6, settings: { variant: 'symbol', pace: 'self' } });
    const block = generateBlock(6, 'n1');
    g.click('nb-start');
    const shape = SHAPES[block[0]?.symbol ?? 0] ?? 'circle';
    expect(g.el('nb-shape').hidden).toBe(false);
    expect(g.el('nb-shape').textContent).toBe(GLYPHS[shape]);
    expect(g.el('nb-item').dataset.symbol).toBe(shape);
    expect(g.el('nb-item').textContent).toBe(`Item 1: ${shape}`);
    expect(g.root.querySelector<HTMLElement>('.wp-nb__grid')?.hidden).toBe(true);
  });

  it('restores mid-block at the same item and finishes once with a factual summary', () => {
    const g = setup({ seed: 8, difficulty: 'n2' });
    const block = generateBlock(8, 'n2');
    g.click('nb-start');
    g.click('nb-next');
    g.click('nb-next');
    g.click(matchMask(block, 2, 2) & 1 ? 'nb-match' : 'nb-no-match');
    const saved = g.state();
    g.instance.dispose();

    const r = setup();
    r.instance.restore(saved);
    expect(r.state()).toEqual(saved);
    expect(r.activeCells()).toEqual([block[3]?.position]);
    expect(r.el('nb-item').dataset.index).toBe('3');
    expect(r.el('nb-match').hidden).toBe(false);

    while (r.state().phase === 'running') r.click(matchMask(block, r.state().index, 2) & 1 ? 'nb-match' : 'nb-no-match');
    expect(r.state().index).toBe(blockLength('n2'));
    expect(r.ctx.results).toHaveLength(1);
    expect(r.ctx.results[0]).toMatchObject({ outcome: 'completed', stats: { n: 2, misses: 0, falseAlarms: 0 } });
    expect(r.el('nb-summary').hidden).toBe(false);
    expect(r.el('nb-summary').textContent).toContain('Matches missed: 0');
    expect(r.el('nb-summary').textContent).toContain('d′');
    expect(r.el('nb-status').textContent).toBe('Block complete.');
    // Nothing starts by itself afterwards, and restoring a finished block does not finish again.
    vi.advanceTimersByTime(60_000);
    const done = r.state();
    const again = setup();
    again.instance.restore(done);
    expect(again.ctx.results).toHaveLength(0);
    expect(again.el('nb-summary').hidden).toBe(false);
  });

  it('reset returns to the seeded start with the same options', () => {
    const g = setup({ seed: 9, settings: { variant: 'symbol', pace: 'self' } });
    const initial = g.state();
    g.click('nb-start');
    g.click('nb-next');
    g.instance.reset();
    expect(g.state()).toEqual(initial);
  });

  it('keeps the grid left-to-right in RTL locales', () => {
    const g = setup({ seed: 1, locale: 'ar' });
    expect(g.root.querySelector('.wp-nb')?.getAttribute('dir')).toBe('rtl');
    expect(g.root.querySelector('.wp-nb__grid')?.getAttribute('dir')).toBe('ltr');
    expect(g.ctx.missingKeys).toEqual([]);
  });
});

describe('N-back view: optional timed pace', () => {
  it('closes an unanswered item after the calm interval as "no match"', () => {
    const g = setup({ seed: 2, difficulty: 'n1', settings: { variant: 'position', pace: 'timed' } });
    g.click('nb-start');
    vi.advanceTimersByTime(TIMED_ITEM_MS - 1);
    expect(g.state().index).toBe(0);
    vi.advanceTimersByTime(1);
    expect(g.state()).toMatchObject({ index: 1, answers: [0] });
    // An answer moves on at once and restarts the interval.
    vi.advanceTimersByTime(1000);
    g.click('nb-match');
    expect(g.state()).toMatchObject({ index: 2, answers: [0, 1] });
    vi.advanceTimersByTime(TIMED_ITEM_MS - 1);
    expect(g.state().index).toBe(2);
    vi.advanceTimersByTime(1);
    expect(g.state().index).toBe(3);
  });

  it('records the toggled dual claims when the interval ends', () => {
    const g = setup({ seed: 2, difficulty: 'n1', settings: { variant: 'dual', pace: 'timed' } });
    g.click('nb-start');
    vi.advanceTimersByTime(TIMED_ITEM_MS);
    g.click('nb-same-shape');
    vi.advanceTimersByTime(TIMED_ITEM_MS);
    expect(g.state()).toMatchObject({ index: 2, answers: [0, 2], pending: 0 });
  });

  it('stops on pause and waits for Continue; a restore also waits', () => {
    const g = setup({ seed: 2, difficulty: 'n1', settings: { variant: 'position', pace: 'timed' } });
    g.click('nb-start');
    vi.advanceTimersByTime(1000);
    g.instance.pause();
    vi.advanceTimersByTime(60_000);
    expect(g.state().index).toBe(0);
    g.instance.resume();
    vi.advanceTimersByTime(60_000);
    expect(g.state().index).toBe(0);
    expect(g.el('nb-continue').hidden).toBe(false);
    expect(g.el('nb-next').hidden).toBe(true);
    expect(g.el('nb-prompt').textContent).toBe('Paused. Continue whenever you are ready.');
    press('Enter');
    expect(g.state().index).toBe(0);
    g.click('nb-continue');
    expect(g.el('nb-continue').hidden).toBe(true);
    vi.advanceTimersByTime(TIMED_ITEM_MS);
    expect(g.state().index).toBe(1);

    const saved = g.state();
    const r = setup();
    r.instance.restore(saved);
    expect(r.el('nb-continue').hidden).toBe(false);
    expect(r.el('nb-item').dataset.index).toBe('1');
    vi.advanceTimersByTime(60_000);
    expect(r.state()).toEqual(saved);
  });

  it('a self-paced block ignores input while the host has paused it', () => {
    const g = setup({ seed: 2, difficulty: 'n1' });
    g.click('nb-start');
    g.instance.pause();
    g.click('nb-next');
    expect(g.state().index).toBe(0);
    g.instance.resume();
    expect(g.el('nb-continue').hidden).toBe(true);
    g.click('nb-next');
    expect(g.state().index).toBe(1);
  });
});
