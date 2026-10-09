// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameContext, GameInstance, GameModule } from '@wp/game-core';
import type { SupportedLocale } from '@wp/localization';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { CONFIGS, generateRound, NOT_THERE, TRIALS, type SearchState, type Trial } from '../src/rules';

const instances: GameInstance<SearchState>[] = [];

function setup(options: { locale?: SupportedLocale; seed?: number; difficulty?: string } = {}) {
  const ctx = createTestContext(game as GameModule<unknown>, options.locale ?? 'en');
  const context: GameContext = ctx.context;
  const instance = game.create(context);
  instances.push(instance);
  const root = context.root;
  const el = (id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`) as HTMLElement;
  const button = (id: string) => el(id) as HTMLButtonElement;
  const items = () => [...root.querySelectorAll<HTMLButtonElement>('[data-item]')];
  if (options.seed !== undefined) instance.newGame({ seed: options.seed, ...(options.difficulty ? { difficulty: options.difficulty } : {}) });
  const trial = (): Trial => {
    const s = instance.serialize();
    return generateRound(s.seed, s.difficulty).trials[Number(el('vs-board').dataset.trial)] as Trial;
  };
  const key = (k: string, target: Element = document.activeElement ?? root) =>
    target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  return { ctx, instance, root, el, button, items, trial, key };
}

const signature = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>('[data-item]')].map((b) => `${b.dataset.cell}:${b.dataset.shape}:${b.dataset.fill}:${b.dataset.tilt}:${b.querySelector('svg')?.getAttribute('style') ?? ''}`);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
});

afterEach(() => {
  for (const instance of instances.splice(0)) instance.dispose();
  vi.useRealTimers();
});

describe('Visual Search view', () => {
  it('introduces the target and waits for the start (no autoplay)', () => {
    const g = setup({ seed: 1 });
    const target = generateRound(1, 'feature').target;
    expect(g.el('vs-intro').hidden).toBe(false);
    expect(g.el('vs-intro-target').textContent).toContain('Your target this round:');
    expect(g.el('vs-intro').textContent).toContain('The target is on every board.');
    expect(g.button('vs-start').hasAttribute('data-autofocus')).toBe(true);
    expect(g.el('vs-intro').querySelector('svg')).not.toBeNull();
    expect(g.el('vs-intro-target').textContent).toContain(target.tilt === 'tilted' ? 'tilted 45°' : 'straight');
    vi.advanceTimersByTime(600_000);
    expect(g.instance.serialize()).toEqual({ seed: 1, difficulty: 'feature', phase: 'ready', answers: [] });
    const medium = setup({ seed: 1, difficulty: 'conjunction' });
    expect(medium.el('vs-intro').textContent).toContain('"Not there"');
  });

  it('shows a board of labelled shape buttons with roving tabindex', () => {
    const g = setup({ seed: 2, difficulty: 'similar' });
    g.button('vs-start').click();
    const trial = g.trial();
    const items = g.items();
    expect(items).toHaveLength(trial.setSize);
    expect(document.activeElement).toBe(items[0]);
    expect(items.filter((b) => b.tabIndex === 0)).toHaveLength(1);
    expect(g.el('vs-board').querySelectorAll('.wp-vs__cell')).toHaveLength(CONFIGS.similar.cols * CONFIGS.similar.rows);
    expect(g.el('vs-board').getAttribute('aria-label')).toBe(`Board 1 of ${TRIALS} (shapes: ${trial.setSize})`);
    expect(items[0]?.getAttribute('aria-label')).toMatch(/^(Bar|Triangle|Cross), (solid|outline only|striped), (straight|tilted 45°); row \d, column \d$/);
    expect(g.el('vs-status').textContent).toBe(`Board 1 of ${TRIALS}`);
    expect(g.el('vs-find').textContent).toMatch(/^Find: /);
    expect(g.button('vs-not-there').hidden).toBe(false);
    expect(g.button('vs-next').hidden).toBe(true);
    // No hint about which one is the target before answering.
    expect(items.some((b) => b.dataset.revealed)).toBe(false);
  });

  it('hides "Not there" on feature search, where the target is always present', () => {
    const g = setup({ seed: 2 });
    g.button('vs-start').click();
    expect(g.button('vs-not-there').hidden).toBe(true);
    g.key('n');
    expect(g.instance.serialize().answers).toEqual([]);
  });

  it('selecting the target reveals it, saves, and waits for "Next board"', () => {
    const g = setup({ seed: 3, difficulty: 'conjunction' });
    g.button('vs-start').click();
    let trial = g.trial();
    // Find a board with the target: answer "Not there" until one comes.
    while (!trial.present) {
      g.button('vs-not-there').click();
      g.button('vs-next').click();
      trial = g.trial();
    }
    const saves = g.ctx.saveRequests();
    vi.advanceTimersByTime(2500);
    g.items()[trial.targetIndex]?.click();
    expect(g.ctx.saveRequests()).toBe(saves + 1);
    const state = g.instance.serialize();
    expect(state.answers.at(-1)).toEqual({ pick: trial.targetIndex, ms: 2500 });
    expect(g.el('vs-feedback').textContent).toBe('Correct: that is the target.');
    const target = g.items()[trial.targetIndex] as HTMLButtonElement;
    expect(target.dataset.revealed).toBe('target');
    expect(target.classList.contains('is-chosen')).toBe(true);
    expect(target.getAttribute('aria-label')).toMatch(/\(the target\) \(your choice\)$/);
    expect(g.items().every((b) => b.getAttribute('aria-disabled') === 'true')).toBe(true);
    expect(document.activeElement).toBe(g.button('vs-next'));
    expect(g.button('vs-not-there').hidden).toBe(true);
    // Clicking again during the review does nothing.
    g.items()[0]?.click();
    expect(g.instance.serialize()).toEqual(state);
    g.button('vs-next').click();
    expect(Number(g.el('vs-board').dataset.trial)).toBe(state.answers.length);
    expect(document.activeElement).toBe(g.items()[0]);
    expect(g.el('vs-feedback').textContent).toBe('');
  });

  it('explains misses neutrally and marks the target', () => {
    const g = setup({ seed: 4, difficulty: 'similar' });
    g.button('vs-start').click();
    let trial = g.trial();
    while (!trial.present) {
      g.items()[0]?.click();
      expect(g.el('vs-feedback').textContent).toBe('The target was not on this board.');
      g.button('vs-next').click();
      trial = g.trial();
    }
    g.button('vs-not-there').click();
    expect(g.el('vs-feedback').textContent).toBe('The target was there. It is marked with a dashed frame.');
    expect(g.items()[trial.targetIndex]?.classList.contains('is-target')).toBe(true);
    expect(g.instance.serialize().answers.at(-1)?.pick).toBe(NOT_THERE);
  });

  it('keyboard: arrows move over items (RTL-aware), Enter/click selects, N answers "Not there"', () => {
    const g = setup({ seed: 5, difficulty: 'conjunction' });
    g.button('vs-start').click();
    const items = g.items();
    g.key('ArrowRight');
    expect(document.activeElement).toBe(items[1]);
    expect(items[1]?.tabIndex).toBe(0);
    expect(items[0]?.tabIndex).toBe(-1);
    g.key('ArrowLeft');
    expect(document.activeElement).toBe(items[0]);
    g.key('End');
    expect(document.activeElement).toBe(items.at(-1));
    g.key('Home');
    expect(document.activeElement).toBe(items[0]);
    g.key('ArrowDown');
    const cols = CONFIGS.conjunction.cols;
    const downRow = Math.floor(Number((document.activeElement as HTMLElement).dataset.cell) / cols);
    expect(downRow).toBeGreaterThan(Math.floor(Number(items[0]?.dataset.cell) / cols));
    g.key('ArrowUp');
    expect(document.activeElement).toBe(items[0]);
    g.key('N');
    expect(g.instance.serialize().answers).toEqual([{ pick: NOT_THERE, ms: 0 }]);
    // N during the review is ignored.
    g.key('n');
    expect(g.instance.serialize().answers).toHaveLength(1);

    const rtl = setup({ seed: 5, difficulty: 'conjunction', locale: 'ar' });
    rtl.button('vs-start').click();
    expect(rtl.root.querySelector('.wp-vs')?.getAttribute('dir')).toBe('rtl');
    rtl.key('ArrowLeft');
    expect(document.activeElement).toBe(rtl.items()[1]);
    rtl.key('ArrowRight');
    expect(document.activeElement).toBe(rtl.items()[0]);
  });

  it('restores mid-round with the identical layout, and times the board from the restore', () => {
    const g = setup({ seed: 6, difficulty: 'similar' });
    g.button('vs-start').click();
    g.items()[0]?.click();
    g.button('vs-next').click();
    const layout = signature(g.root);
    const saved = g.instance.serialize();

    const h2 = setup();
    h2.instance.restore(JSON.parse(JSON.stringify(saved)) as SearchState);
    expect(h2.instance.serialize()).toEqual(saved);
    expect(h2.el('vs-board').dataset.trial).toBe('1');
    expect(signature(h2.root)).toEqual(layout);
    expect(h2.el('vs-intro').hidden).toBe(true);
    vi.advanceTimersByTime(1200);
    h2.items()[0]?.click();
    expect(h2.instance.serialize().answers[1]).toEqual({ pick: 0, ms: 1200 });
  });

  it('a board interrupted by a pause is stored without a time', () => {
    const g = setup({ seed: 7, difficulty: 'conjunction' });
    g.button('vs-start').click();
    vi.advanceTimersByTime(1000);
    g.instance.pause();
    vi.advanceTimersByTime(60_000);
    g.instance.resume();
    expect(g.el('vs-board').dataset.trial).toBe('0');
    g.items()[0]?.click();
    expect(g.instance.serialize().answers[0]?.ms).toBeNull();
    g.button('vs-next').click();
    vi.advanceTimersByTime(700);
    g.items()[0]?.click();
    expect(g.instance.serialize().answers[1]?.ms).toBe(700);
  });

  it('finishes once with a neutral summary and an explanation; a restored finished round does not finish again', () => {
    const g = setup({ seed: 8, difficulty: 'conjunction' });
    g.button('vs-start').click();
    for (let i = 0; i < TRIALS; i++) {
      const trial = g.trial();
      vi.advanceTimersByTime(1000 + i * 100);
      if (trial.present) g.items()[trial.targetIndex]?.click();
      else g.button('vs-not-there').click();
      if (i < TRIALS - 1) g.button('vs-next').click();
    }
    expect(g.ctx.results).toHaveLength(1);
    const result = g.ctx.results[0];
    expect(result?.outcome).toBe('completed');
    expect(result?.stats).toMatchObject({ correct: TRIALS, total: TRIALS, wrongItem: 0, missed: 0, falseFind: 0 });
    expect(Object.keys(result?.stats ?? {})).toEqual(expect.arrayContaining(['medianMs8', 'medianMs16']));
    const summary = g.el('vs-summary');
    expect(summary.hidden).toBe(false);
    expect(summary.textContent).toContain(`Correct answers: ${TRIALS} of ${TRIALS}`);
    expect(summary.textContent).toContain('Conjunction search');
    expect(summary.textContent).toMatch(/Shapes on the board: 8\. Median search time \(correct answers\): \d+\.\d s/);
    expect(summary.textContent).not.toMatch(/record|best|brain/i);
    expect(g.button('vs-next').hidden).toBe(true);
    expect(document.activeElement).toBe(summary);
    expect(g.instance.serialize().phase).toBe('finished');

    const h2 = setup();
    h2.instance.restore(g.instance.serialize());
    expect(h2.ctx.results).toHaveLength(0);
    expect(h2.el('vs-summary').hidden).toBe(false);
    expect(h2.el('vs-board').closest('.wp-vs__play')?.hasAttribute('hidden')).toBe(true);
  });

  it('feature-search summary explains pop-out and omits "Not there" lines', () => {
    const g = setup({ seed: 9 });
    g.button('vs-start').click();
    for (let i = 0; i < TRIALS; i++) {
      g.items()[0]?.click();
      if (i < TRIALS - 1) g.button('vs-next').click();
    }
    const text = g.el('vs-summary').textContent ?? '';
    expect(text).toContain('Feature search');
    expect(text).not.toContain('"Not there" although');
    expect(g.ctx.results).toHaveLength(1);
  });

  it('newGame on a used instance starts fresh; reset returns to the seeded start', () => {
    const g = setup({ seed: 10, difficulty: 'similar' });
    g.button('vs-start').click();
    g.items()[0]?.click();
    g.instance.newGame({ seed: 11, difficulty: 'feature' });
    expect(g.instance.serialize()).toEqual({ seed: 11, difficulty: 'feature', phase: 'ready', answers: [] });
    expect(g.el('vs-intro').hidden).toBe(false);
    expect(g.el('vs-board').closest('.wp-vs__play')?.hasAttribute('hidden')).toBe(true);
    g.button('vs-start').click();
    g.items()[0]?.click();
    g.instance.reset();
    expect(g.instance.serialize()).toEqual({ seed: 11, difficulty: 'feature', phase: 'ready', answers: [] });
    expect(g.el('vs-feedback').textContent).toBe('');
  });

  it('uses no colour-only cues: revealed marks use line style classes and labels', () => {
    const g = setup({ seed: 12, difficulty: 'similar' });
    g.button('vs-start').click();
    const trial = g.trial();
    const wrong = trial.present ? (trial.targetIndex + 1) % trial.setSize : 0;
    g.items()[wrong]?.click();
    const chosen = g.items()[wrong] as HTMLButtonElement;
    expect(chosen.classList.contains('is-chosen')).toBe(true);
    expect(chosen.getAttribute('aria-label')).toMatch(/\(your choice\)$/);
    if (trial.present) {
      expect(g.items()[trial.targetIndex]?.classList.contains('is-target')).toBe(true);
      expect(g.el('vs-feedback').textContent).toBe('That was a different shape. The target is marked with a dashed frame.');
    }
  });
});
