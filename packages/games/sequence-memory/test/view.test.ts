// @ts-nocheck
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameContext, GameInstance, GameModule } from '@wp/game-core';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@wp/localization';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { GAP_MS, LEAD_MS, LIT_MS } from '../src/view';
import { expectedAnswer, ROUNDS, type SequenceState } from '../src/rules';

const instances: GameInstance<SequenceState>[] = [];

function setup(options: { reducedMotion?: boolean; locale?: SupportedLocale; seed?: number; difficulty?: string } = {}) {
  const ctx = createTestContext(game as GameModule<unknown>, options.locale ?? 'en');
  const context: GameContext = { ...ctx.context, reducedMotion: options.reducedMotion ?? true };
  const instance = game.create(context);
  instances.push(instance);
  const root = context.root;
  const el = (id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`) as HTMLElement;
  const button = (id: string) => el(id) as HTMLButtonElement;
  const tile = (i: number) => button(`tile-${i}`);
  const litTiles = () => [...root.querySelectorAll<HTMLElement>('[data-state="lit"]')].map((e) => Number(e.dataset.testid?.slice(5)));
  if (options.seed !== undefined) instance.newGame({ seed: options.seed, ...(options.difficulty ? { difficulty: options.difficulty } : {}) });
  return { ctx, instance, root, el, button, tile, litTiles };
}

type Setup = ReturnType<typeof setup>;

/** Step-mode presentation through the DOM; returns the tiles seen, in order. */
function watchInStepMode(g: Setup): number[] {
  const seen: number[] = [];
  g.button('seq-start').click();
  for (let guard = 0; !g.button('seq-next').hidden && guard < 20; guard++) {
    seen.push(...g.litTiles());
    g.button('seq-next').click();
  }
  return seen;
}

function answer(g: Setup, correct: boolean) {
  const state = g.instance.serialize();
  const tiles = expectedAnswer(state.sequence, state.difficulty);
  if (!correct) tiles.reverse();
  for (const t of tiles) g.tile(t).click();
}

afterEach(() => {
  for (const instance of instances.splice(0)) instance.dispose();
  vi.useRealTimers();
});

describe('Sequence Memory view', () => {
  it('renders a 3×3 grid with position labels, kept left-to-right even in Arabic', () => {
    const g = setup({ seed: 1, locale: 'ar' });
    const board = g.el('seq-board');
    expect(board.getAttribute('dir')).toBe('ltr');
    expect(board.parentElement?.getAttribute('dir')).toBe('rtl');
    expect(board.querySelectorAll('[data-cell]')).toHaveLength(9);
    expect(g.tile(0).getAttribute('aria-label')).toBe('المربع 1، أعلى اليسار');
    expect(g.ctx.missingKeys).toEqual([]);
  });

  it('defaults to Step mode with reduced motion and Auto mode otherwise', () => {
    expect(setup({ seed: 1 }).instance.serialize().presentation).toBe('step');
    expect(setup({ seed: 1, reducedMotion: false }).instance.serialize().presentation).toBe('auto');
  });

  it('presents the sequence step by step, then switches to recall', () => {
    const g = setup({ seed: 5 });
    const { sequence } = g.instance.serialize();
    expect(g.button('seq-next').hidden).toBe(true);
    expect(g.el('seq-status').textContent).toContain('length 3');
    expect(g.litTiles()).toEqual([]);
    g.button('seq-start').click();
    expect(g.litTiles()).toEqual([sequence[0]]);
    expect(g.tile(sequence[0] as number).textContent).toBe('●');
    expect(g.el('seq-status').textContent).toBe('Tile 1 of 3');
    expect(g.button('seq-start').textContent).toBe('Start over');
    g.button('seq-next').click();
    g.button('seq-next').click();
    expect(g.litTiles()).toEqual([sequence[2]]);
    expect(g.button('seq-next').textContent).toBe('Start answering');
    const saves = g.ctx.saveRequests();
    g.button('seq-next').click();
    expect(g.instance.serialize().phase).toBe('recalling');
    expect(g.ctx.saveRequests()).toBe(saves + 1);
    expect(g.litTiles()).toEqual([]);
    expect(g.button('seq-start').hidden).toBe(true);
    expect(g.button('seq-next').hidden).toBe(true);
    expect(g.button('seq-undo').hidden).toBe(false);
    expect(g.button('seq-undo').disabled).toBe(true);
  });

  it('ignores taps while the sequence is shown', () => {
    const g = setup({ seed: 5 });
    g.button('seq-start').click();
    const before = g.instance.serialize();
    g.tile(0).click();
    g.tile(8).click();
    expect(g.instance.serialize()).toEqual(before);
    expect(g.tile(0).getAttribute('aria-disabled')).toBe('true');
  });

  it('restores during the presentation by restarting it from the first tile', () => {
    const g = setup({ seed: 9 });
    g.button('seq-start').click();
    g.button('seq-next').click();
    const saved = g.instance.serialize();
    expect(saved.phase).toBe('showing');

    const h = setup();
    h.instance.restore(saved);
    expect(h.instance.serialize()).toEqual(saved);
    expect(h.litTiles()).toEqual([]);
    expect(h.button('seq-start').hidden).toBe(false);
    expect(h.button('seq-start').textContent).toBe('Show sequence');
    expect(h.button('seq-next').hidden).toBe(true);
    h.button('seq-start').click();
    expect(h.litTiles()).toEqual([saved.sequence[0]]);
    expect(watchInStepMode(h)).toEqual(saved.sequence);
  });

  it('persists partial input during recall and restores it', () => {
    const g = setup({ seed: 12 });
    watchInStepMode(g);
    const { sequence } = g.instance.serialize();
    const saves = g.ctx.saveRequests();
    g.tile(sequence[0] as number).click();
    expect(g.ctx.saveRequests()).toBe(saves + 1);
    const saved = g.instance.serialize();
    expect(saved.input).toEqual([sequence[0]]);

    const h = setup();
    h.instance.restore(saved);
    const entered = h.tile(sequence[0] as number);
    expect(entered.dataset.state).toBe('entered');
    expect(entered.textContent).toBe('1');
    expect(entered.getAttribute('aria-label')).toContain('your entry 1');
    expect(h.el('seq-status').textContent).toContain('(1 of 3)');
    h.button('seq-undo').click();
    expect(h.instance.serialize().input).toEqual([]);
    expect(entered.dataset.state).toBe('idle');
  });

  it('shows feedback without colour alone and starts the next round on request', () => {
    const g = setup({ seed: 3 });
    watchInStepMode(g);
    const { sequence } = g.instance.serialize();
    answer(g, true);
    expect(g.instance.serialize().phase).toBe('feedback');
    expect(g.tile(sequence[0] as number).textContent).toBe('1✓');
    expect(g.tile(sequence[2] as number).dataset.state).toBe('ok');
    expect(g.el('seq-status').textContent).toBe('Correct. Next sequence length: 4.');
    expect(g.button('seq-continue').hidden).toBe(false);
    g.button('seq-continue').click();
    const next = g.instance.serialize();
    expect(next).toMatchObject({ round: 1, span: 4, phase: 'showing' });
    expect(g.el('seq-round').textContent).toBe('Round 2 of 12');
    // The presentation of the new round starts right away.
    expect(g.litTiles()).toEqual([next.sequence[0]]);
  });

  it('marks a wrong round and shortens the next sequence', () => {
    const g = setup({ seed: 3 });
    watchInStepMode(g);
    answer(g, false);
    expect(g.instance.serialize().history).toEqual([{ span: 3, correct: false }]);
    expect(g.el('seq-status').textContent).toContain('Next sequence length: 2.');
    expect(g.root.querySelectorAll('[data-state="ok"]')).toHaveLength(1); // the middle tile stays in place
    expect(g.root.querySelectorAll('[data-state="miss"]')).toHaveLength(2);
  });

  it('checks the reverse order in the Backwards variant', () => {
    const g = setup({ seed: 4, difficulty: 'backwards' });
    expect(g.el('seq-status').textContent).toContain('reverse order');
    const seen = watchInStepMode(g);
    for (const t of [...seen].reverse()) g.tile(t).click();
    expect(g.instance.serialize().history).toEqual([{ span: 3, correct: true }]);
  });

  it('finishes once after 12 rounds with a calm summary, also not again on restore', () => {
    const g = setup({ seed: 8 });
    for (let round = 0; round < ROUNDS; round++) {
      if (round > 0) g.button('seq-continue').click();
      watchInStepMode(g);
      answer(g, round % 3 !== 2);
    }
    const state = g.instance.serialize();
    expect(state.phase).toBe('finished');
    expect(g.ctx.results).toEqual([{ outcome: 'completed', stats: { maxSpan: 7, correctRounds: 8, rounds: 12 } }]);
    expect(g.el('seq-summary').hidden).toBe(false);
    expect(g.el('seq-summary').textContent).toContain('Longest sequence recalled correctly: 7');
    expect(g.el('seq-summary').textContent).toContain('Correct rounds: 8 of 12 (67%)');
    expect(g.button('seq-continue').hidden).toBe(true);

    const h = setup();
    h.instance.restore(state);
    expect(h.ctx.results).toEqual([]);
    expect(h.el('seq-summary').hidden).toBe(false);
  });

  it('runs the automatic presentation with timers and enters recall at its end', () => {
    vi.useFakeTimers();
    const g = setup({ seed: 6, reducedMotion: false });
    const { sequence } = g.instance.serialize();
    expect(g.button('seq-mode-auto').getAttribute('aria-pressed')).toBe('true');
    g.button('seq-start').click();
    expect(g.button('seq-next').hidden).toBe(true);
    expect(g.litTiles()).toEqual([]);
    vi.advanceTimersByTime(LEAD_MS);
    const seen: number[] = [];
    for (let i = 0; i < sequence.length; i++) {
      seen.push(...g.litTiles());
      vi.advanceTimersByTime(LIT_MS);
      expect(g.litTiles()).toEqual([]);
      expect(g.instance.serialize().phase).toBe('showing');
      vi.advanceTimersByTime(GAP_MS);
    }
    expect(seen).toEqual(sequence);
    expect(g.instance.serialize().phase).toBe('recalling');
  });

  it('pausing or closing during the automatic presentation keeps the state at "showing"', () => {
    vi.useFakeTimers();
    const g = setup({ seed: 6, reducedMotion: false });
    g.button('seq-start').click();
    vi.advanceTimersByTime(LEAD_MS + LIT_MS);
    const before = g.instance.serialize();
    g.instance.pause();
    vi.advanceTimersByTime(10_000);
    expect(g.instance.serialize()).toEqual(before);
    expect(g.litTiles()).toEqual([]);
    expect(g.button('seq-start').textContent).toBe('Show sequence');
    g.instance.resume();
    g.instance.dispose();
    vi.advanceTimersByTime(10_000);
    expect(before.phase).toBe('showing');
  });

  it('switches presentation mode, persists it and keeps it for a new game', () => {
    vi.useFakeTimers();
    const g = setup({ seed: 2, reducedMotion: false });
    g.button('seq-start').click();
    const saves = g.ctx.saveRequests();
    g.button('seq-mode-step').click();
    expect(g.ctx.saveRequests()).toBe(saves + 1);
    expect(g.instance.serialize().presentation).toBe('step');
    expect(g.button('seq-mode-step').getAttribute('aria-pressed')).toBe('true');
    // Switching restarts the presentation; no timer continues in the background.
    vi.advanceTimersByTime(10_000);
    expect(g.litTiles()).toEqual([]);
    g.instance.newGame({ seed: 99 });
    expect(g.instance.serialize()).toMatchObject({ presentation: 'step', round: 0, phase: 'showing', seed: 99 });
    g.instance.reset();
    expect(g.instance.serialize().presentation).toBe('step');
  });

  it('newGame on a used instance fully resets the session', () => {
    const g = setup({ seed: 3 });
    watchInStepMode(g);
    answer(g, true);
    g.instance.newGame({ seed: 3 });
    expect(g.instance.serialize()).toEqual(setup({ seed: 3 }).instance.serialize());
    expect(g.button('seq-continue').hidden).toBe(true);
    expect(g.root.querySelectorAll('[data-state="idle"]')).toHaveLength(9);
  });

  it('has no missing translation keys through a full round in every locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const g = setup({ seed: 1, locale });
      watchInStepMode(g);
      answer(g, false);
      g.button('seq-continue').click();
      expect(g.ctx.missingKeys, locale).toEqual([]);
    }
  });
});
