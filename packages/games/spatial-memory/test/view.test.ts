// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameContext, GameInstance, GameModule } from '@wp/game-core';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@wp/localization';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { revealMs } from '../src/view';
import { expectedCells, gridSide, ROUNDS, type PatternState } from '../src/rules';

const instances: GameInstance<PatternState>[] = [];

function setup(options: { reducedMotion?: boolean; locale?: SupportedLocale; seed?: number; difficulty?: string } = {}) {
  const ctx = createTestContext(game as GameModule<unknown>, options.locale ?? 'en');
  const context: GameContext = { ...ctx.context, reducedMotion: options.reducedMotion ?? true };
  const instance = game.create(context);
  instances.push(instance);
  const root = context.root;
  const el = (id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`) as HTMLElement;
  const button = (id: string) => el(id) as HTMLButtonElement;
  const cell = (i: number) => button(`cell-${i}`);
  const cellsIn = (state: string) => [...root.querySelectorAll<HTMLElement>(`[data-state="${state}"]`)].map((e) => Number(e.dataset.testid?.slice(5)));
  if (options.seed !== undefined) instance.newGame({ seed: options.seed, ...(options.difficulty ? { difficulty: options.difficulty } : {}) });
  return { ctx, instance, root, el, button, cell, cellsIn };
}

type Setup = ReturnType<typeof setup>;

/** Shows and hides the pattern in Step mode; returns the cells seen. */
function watch(g: Setup): number[] {
  g.button('pm-show').click();
  const seen = g.cellsIn('shown');
  g.button('pm-memorised').click();
  return seen;
}

function answer(g: Setup, correct: boolean) {
  const state = g.instance.serialize();
  const expected = expectedCells(state.pattern, gridSide(state.size), state.difficulty);
  const cells = correct ? expected : expected.slice(1);
  for (const c of cells) g.cell(c).click();
  g.button('pm-done').click();
}

afterEach(() => {
  for (const instance of instances.splice(0)) instance.dispose();
  vi.useRealTimers();
});

describe('Pattern Memory view', () => {
  it('renders a 4×4 grid with row/column labels, kept left-to-right even in Arabic', () => {
    const g = setup({ seed: 1, locale: 'ar' });
    const board = g.el('pm-board');
    expect(board.getAttribute('dir')).toBe('ltr');
    expect(board.parentElement?.getAttribute('dir')).toBe('rtl');
    expect(board.querySelectorAll('[data-cell]')).toHaveLength(16);
    expect(g.cell(5).getAttribute('aria-label')).toBe('الصف 2، العمود 2');
    expect(g.ctx.missingKeys).toEqual([]);
  });

  it('defaults to Step mode with reduced motion and Auto mode otherwise', () => {
    expect(setup({ seed: 1 }).instance.serialize().presentation).toBe('step');
    expect(setup({ seed: 1, reducedMotion: false }).instance.serialize().presentation).toBe('auto');
  });

  it('shows the pattern on request, then hides it when the player is ready', () => {
    const g = setup({ seed: 5 });
    const { pattern } = g.instance.serialize();
    expect(g.cellsIn('shown')).toEqual([]);
    expect(g.button('pm-memorised').hidden).toBe(true);
    expect(g.el('pm-status').textContent).toContain('3 cells');
    g.button('pm-show').click();
    expect(g.cellsIn('shown')).toEqual(pattern);
    expect(g.cell(pattern[0] as number).textContent).toBe('●');
    expect(g.cell(pattern[0] as number).getAttribute('aria-label')).toContain('part of the pattern');
    expect(g.button('pm-show').hidden).toBe(true);
    expect(g.button('pm-memorised').hidden).toBe(false);
    const saves = g.ctx.saveRequests();
    g.button('pm-memorised').click();
    expect(g.instance.serialize().phase).toBe('recalling');
    expect(g.ctx.saveRequests()).toBe(saves + 1);
    expect(g.cellsIn('shown')).toEqual([]);
    expect(g.button('pm-memorised').hidden).toBe(true);
    expect(g.button('pm-done').hidden).toBe(false);
    expect(g.button('pm-done').disabled).toBe(true);
    expect(g.el('pm-status').textContent).toContain('0 of 3 marked');
  });

  it('ignores taps while the pattern is shown', () => {
    const g = setup({ seed: 5 });
    g.button('pm-show').click();
    const before = g.instance.serialize();
    g.cell(0).click();
    g.cell(15).click();
    expect(g.instance.serialize()).toEqual(before);
    expect(g.cell(0).getAttribute('aria-disabled')).toBe('true');
  });

  it('restores during "showing" with the Show pattern button, pattern hidden', () => {
    const g = setup({ seed: 9 });
    g.button('pm-show').click();
    const saved = g.instance.serialize();
    expect(saved.phase).toBe('showing');

    const h = setup();
    h.instance.restore(saved);
    expect(h.instance.serialize()).toEqual(saved);
    expect(h.cellsIn('shown')).toEqual([]);
    expect(h.button('pm-show').hidden).toBe(false);
    expect(h.button('pm-memorised').hidden).toBe(true);
    expect(watch(h)).toEqual(saved.pattern);
  });

  it('toggles marks, persists partial selections and restores them', () => {
    const g = setup({ seed: 12 });
    watch(g);
    const saves = g.ctx.saveRequests();
    g.cell(3).click();
    g.cell(10).click();
    expect(g.ctx.saveRequests()).toBe(saves + 2);
    g.cell(10).click();
    expect(g.instance.serialize().marks).toEqual([3]);
    g.cell(10).click();
    const saved = g.instance.serialize();
    expect(saved.marks).toEqual([3, 10]);

    const h = setup();
    h.instance.restore(saved);
    expect(h.cellsIn('marked')).toEqual([3, 10]);
    expect(h.cell(3).textContent).toBe('●');
    expect(h.cell(3).getAttribute('aria-label')).toBe('Row 1, column 4, marked');
    expect(h.el('pm-status').textContent).toContain('2 of 3 marked');
    expect(h.button('pm-done').disabled).toBe(false);
  });

  it('does not mark more cells than the pattern has', () => {
    const g = setup({ seed: 12 });
    watch(g);
    for (const c of [0, 1, 2, 3]) g.cell(c).click();
    expect(g.instance.serialize().marks).toEqual([0, 1, 2]);
    expect(g.cell(3).dataset.state).toBe('idle');
  });

  it('shows feedback with symbols and starts the next round on request', () => {
    const g = setup({ seed: 3 });
    watch(g);
    const { pattern } = g.instance.serialize();
    answer(g, true);
    expect(g.instance.serialize().phase).toBe('feedback');
    expect(g.cellsIn('hit')).toEqual(pattern);
    expect(g.cell(pattern[0] as number).textContent).toBe('✓');
    expect(g.el('pm-status').textContent).toBe('Correct. Next pattern size: 4.');
    expect(g.el('pm-legend').hidden).toBe(false);
    expect(g.button('pm-next').hidden).toBe(false);
    g.button('pm-next').click();
    const next = g.instance.serialize();
    expect(next).toMatchObject({ round: 1, size: 4, phase: 'showing' });
    expect(g.el('pm-round').textContent).toBe('Round 2 of 10');
    // The pattern of the new round appears right away.
    expect(g.cellsIn('shown')).toEqual(next.pattern);
  });

  it('marks misses (○) and wrong marks (✗) and shrinks the next pattern', () => {
    const g = setup({ seed: 3 });
    watch(g);
    const { pattern } = g.instance.serialize();
    const outsider = [0, 1, 2, 3, 4].find((c) => !pattern.includes(c)) as number;
    g.cell(pattern[1] as number).click();
    g.cell(outsider).click();
    g.button('pm-done').click();
    expect(g.instance.serialize().history).toEqual([{ size: 3, correct: false }]);
    expect(g.el('pm-status').textContent).toBe('Not quite: 1 of 3 cells found. Next pattern size: 2.');
    expect(g.cellsIn('hit')).toEqual([pattern[1]]);
    expect(g.cellsIn('miss')).toEqual([pattern[0], pattern[2]]);
    expect(g.cellsIn('wrong')).toEqual([outsider]);
    expect(g.cell(pattern[0] as number).textContent).toBe('○');
    expect(g.cell(outsider).textContent).toBe('✗');
  });

  it('asks for the rotated pattern in the Rotated variant and shows the arrow hint', () => {
    const g = setup({ seed: 4, difficulty: 'rotated' });
    expect(g.el('pm-rotate-hint').hidden).toBe(false);
    expect(g.el('pm-rotate-hint').textContent).toContain('↻');
    expect(g.el('pm-status').textContent).toContain('clockwise');
    const seen = watch(g);
    for (const c of seen) g.cell((c % 4) * 4 + (3 - Math.floor(c / 4))).click();
    g.button('pm-done').click();
    expect(g.instance.serialize().history).toEqual([{ size: 3, correct: true }]);
    expect(setup({ seed: 4 }).el('pm-rotate-hint').hidden).toBe(true);
  });

  it('grows the grid to 5×5 when the pattern reaches 6 cells', () => {
    const g = setup({ seed: 2 });
    for (let round = 0; round < 3; round++) {
      if (round > 0) g.button('pm-next').click();
      else g.button('pm-show').click();
      g.button('pm-memorised').click();
      answer(g, true);
    }
    g.button('pm-next').click();
    expect(g.instance.serialize().size).toBe(6);
    expect(g.el('pm-board').querySelectorAll('[data-cell]')).toHaveLength(25);
    expect(g.el('pm-board').style.getPropertyValue('--pm-side')).toBe('5');
    expect(g.cellsIn('shown')).toHaveLength(6);
  });

  it('finishes once after 10 rounds with a calm summary, also not again on restore', () => {
    const g = setup({ seed: 8 });
    for (let round = 0; round < ROUNDS; round++) {
      if (round > 0) {
        g.button('pm-next').click();
        g.button('pm-memorised').click();
      } else watch(g);
      answer(g, round % 3 !== 2);
    }
    const state = g.instance.serialize();
    expect(state.phase).toBe('finished');
    expect(g.ctx.results).toEqual([{ outcome: 'completed', stats: { maxSize: 6, correctRounds: 7, rounds: 10 } }]);
    expect(g.el('pm-summary').hidden).toBe(false);
    expect(g.el('pm-summary').textContent).toContain('Largest pattern recalled correctly: 6 cells');
    expect(g.el('pm-summary').textContent).toContain('Correct rounds: 7 of 10 (70%)');
    expect(g.button('pm-next').hidden).toBe(true);

    const h = setup();
    h.instance.restore(state);
    expect(h.ctx.results).toEqual([]);
    expect(h.el('pm-summary').hidden).toBe(false);
  });

  it('hides the pattern automatically in Auto mode', () => {
    vi.useFakeTimers();
    const g = setup({ seed: 6, reducedMotion: false });
    expect(g.button('pm-mode-auto').getAttribute('aria-pressed')).toBe('true');
    g.button('pm-show').click();
    expect(g.cellsIn('shown')).toHaveLength(3);
    expect(g.button('pm-memorised').hidden).toBe(false);
    vi.advanceTimersByTime(revealMs(3) - 1);
    expect(g.instance.serialize().phase).toBe('showing');
    vi.advanceTimersByTime(1);
    expect(g.instance.serialize().phase).toBe('recalling');
    expect(g.cellsIn('shown')).toEqual([]);
    expect(revealMs(3)).toBe(2400);
  });

  it('pausing or closing while the pattern is shown keeps the state at "showing"', () => {
    vi.useFakeTimers();
    const g = setup({ seed: 6, reducedMotion: false });
    g.button('pm-show').click();
    const before = g.instance.serialize();
    g.instance.pause();
    vi.advanceTimersByTime(10_000);
    expect(g.instance.serialize()).toEqual(before);
    expect(g.cellsIn('shown')).toEqual([]);
    expect(g.button('pm-show').hidden).toBe(false);
    g.instance.resume();
    g.instance.dispose();
    vi.advanceTimersByTime(10_000);
  });

  it('switches the hiding mode, persists it and keeps it for a new game', () => {
    vi.useFakeTimers();
    const g = setup({ seed: 2, reducedMotion: false });
    g.button('pm-show').click();
    const saves = g.ctx.saveRequests();
    g.button('pm-mode-step').click();
    expect(g.ctx.saveRequests()).toBe(saves + 1);
    expect(g.instance.serialize().presentation).toBe('step');
    expect(g.button('pm-mode-step').getAttribute('aria-pressed')).toBe('true');
    vi.advanceTimersByTime(10_000);
    expect(g.instance.serialize().phase).toBe('showing');
    g.instance.newGame({ seed: 99 });
    expect(g.instance.serialize()).toMatchObject({ presentation: 'step', round: 0, phase: 'showing', seed: 99 });
    g.instance.reset();
    expect(g.instance.serialize().presentation).toBe('step');
  });

  it('newGame on a used instance fully resets the session and the grid', () => {
    const g = setup({ seed: 2 });
    for (let round = 0; round < 3; round++) {
      if (round > 0) g.button('pm-next').click();
      else g.button('pm-show').click();
      g.button('pm-memorised').click();
      answer(g, true);
    }
    g.button('pm-next').click();
    g.instance.newGame({ seed: 3 });
    expect(g.instance.serialize()).toEqual(setup({ seed: 3 }).instance.serialize());
    expect(g.button('pm-next').hidden).toBe(true);
    expect(g.root.querySelectorAll('[data-state="idle"]')).toHaveLength(16);
  });

  it('has no missing translation keys through a full round in every locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const g = setup({ seed: 1, locale, difficulty: 'rotated' });
      watch(g);
      g.cell(0).click();
      answer(g, false);
      g.button('pm-next').click();
      expect(g.ctx.missingKeys, locale).toEqual([]);
    }
  });
});
