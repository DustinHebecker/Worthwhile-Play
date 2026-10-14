// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { GameContext, GameInstance, GameModule } from '@wp/game-core';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { generateSequence, ITEM_COUNT, type DistractorState } from '../src/rules';

const instances: GameInstance<DistractorState>[] = [];

function setup(options: { reducedMotion?: boolean; seed?: number; difficulty?: string; locale?: 'en' | 'ar' } = {}) {
  const ctx = createTestContext(game as GameModule<unknown>, options.locale ?? 'en');
  const finished: unknown[] = [];
  const context: GameContext = { ...ctx.context, reducedMotion: options.reducedMotion ?? true, finished: (r) => finished.push(r) };
  const instance = game.create(context);
  instances.push(instance);
  const root = context.root;
  const el = (id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  const click = (id: string) => (el(id) as HTMLButtonElement).click();
  if (options.seed !== undefined) instance.newGame({ seed: options.seed, ...(options.difficulty ? { difficulty: options.difficulty } : {}) });
  return { ctx, context, instance, root, el, click, finished };
}

afterEach(() => {
  for (const instance of instances.splice(0)) instance.dispose();
});

describe('Stay on Task view', () => {
  it('explains the task, the length and the extras before the start; nothing runs on its own', () => {
    const g = setup({ seed: 1 });
    expect(g.el('dc-intro')?.hidden).toBe(false);
    expect(g.el('dc-length')?.textContent).toBe('Session: 40 numbers, about 3 minutes at your own pace.');
    expect(g.el('dc-intro')?.textContent).toContain('part of the exercise');
    expect(g.el('dc-status')?.textContent).toBe('Start whenever you are ready.');
    expect(g.el('dc-distractor')).toBeNull();
    expect(g.instance.serialize()).toMatchObject({ phase: 'ready', index: 0 });
  });

  it('shows the seeded numbers, saves after every answer and shows extras in their slot', () => {
    const g = setup({ seed: 9, difficulty: 'busy' });
    const sequence = generateSequence(9, 'busy');
    g.click('dc-start');
    const saves = g.ctx.saveRequests();
    for (let i = 0; i < 12; i++) {
      const item = g.el('dc-item') as HTMLElement;
      expect(item.dataset.index).toBe(String(i));
      expect(item.textContent).toBe(String(sequence[i]?.value));
      expect(item.getAttribute('aria-label')).toBe(`Number ${sequence[i]?.value}`);
      expect(g.el('dc-status')?.textContent).toBe(`Number ${i + 1} of ${ITEM_COUNT}`);
      const extra = g.el('dc-distractor');
      if (sequence[i]?.distractor) {
        expect(extra?.dataset.index).toBe(String(i));
        expect(extra?.dataset.kind).toBe(sequence[i]?.distractor?.kind);
        expect(extra?.tagName).toBe('BUTTON');
      } else expect(extra).toBeNull();
      g.click(`dc-answer-${sequence[i]?.correct}`);
    }
    expect(g.ctx.saveRequests()).toBe(saves + 12);
    expect(g.instance.serialize()).toMatchObject({ index: 12, answers: sequence.slice(0, 12).map((s) => s.correct) });
  });

  it('a tap on an extra is counted, saved and answered with a neutral note', () => {
    const g = setup({ seed: 9, difficulty: 'busy' });
    const sequence = generateSequence(9, 'busy');
    const at = sequence.findIndex((item) => item.distractor);
    g.click('dc-start');
    for (let i = 0; i < at; i++) g.click('dc-answer-even');
    const saves = g.ctx.saveRequests();
    g.click('dc-distractor');
    expect(g.ctx.saveRequests()).toBe(saves + 1);
    expect(g.el('dc-distractor')).toBeNull();
    expect(g.el('dc-ack')?.textContent).toBe('That was one of the extras. Back to the numbers.');
    expect(g.instance.serialize().captured).toEqual([at]);
    g.click('dc-answer-odd');
    expect(g.el('dc-ack')?.textContent).toBe('');
  });

  it('pause holds the session behind Continue without changing the logical state', () => {
    const g = setup({ seed: 2 });
    g.click('dc-start');
    g.click('dc-answer-even');
    const before = g.instance.serialize();
    g.instance.pause();
    expect(g.el('dc-continue')?.hidden).toBe(false);
    expect(g.el('dc-item')?.textContent).toBe('');
    expect(g.el('dc-status')?.textContent).toContain('Paused');
    // Answers are ignored while paused or held.
    g.click('dc-answer-odd');
    g.instance.resume();
    g.click('dc-answer-odd');
    expect(g.instance.serialize()).toEqual(before);
    g.click('dc-continue');
    expect(g.el('dc-continue')?.hidden).toBe(true);
    expect(g.el('dc-item')?.dataset.index).toBe('1');
    g.click('dc-answer-odd');
    expect(g.instance.serialize().index).toBe(2);
  });

  it('restores mid-session at the same item, including a tapped extra', () => {
    const g = setup({ seed: 9, difficulty: 'busy' });
    const sequence = generateSequence(9, 'busy');
    const at = sequence.findIndex((item) => item.distractor);
    g.click('dc-start');
    for (let i = 0; i < at; i++) g.click('dc-answer-even');
    g.click('dc-distractor');
    const saved = g.instance.serialize();
    const r = setup();
    r.instance.restore(saved);
    expect(r.el('dc-continue')?.hidden).toBe(false);
    r.click('dc-continue');
    expect(r.el('dc-item')?.dataset.index).toBe(String(at));
    expect(r.el('dc-item')?.textContent).toBe(String(sequence[at]?.value));
    expect(r.el('dc-distractor')).toBeNull(); // already tapped, stays gone
    expect(r.instance.serialize()).toEqual(saved);
  });

  it('finishes once with a factual summary and no records', () => {
    const g = setup({ seed: 5 });
    const sequence = generateSequence(5, 'calm');
    g.click('dc-start');
    for (let i = 0; i < ITEM_COUNT; i++) g.click(`dc-answer-${sequence[i]?.correct}`);
    expect(g.finished).toEqual([{ outcome: 'completed', stats: { correct: ITEM_COUNT, total: ITEM_COUNT, shown: 10, captured: 0 } }]);
    const summary = g.el('dc-summary') as HTMLElement;
    expect(summary.hidden).toBe(false);
    expect(summary.textContent).toContain('Numbers sorted correctly: 40 of 40');
    expect(summary.textContent).toContain('Extras shown: 10');
    expect(summary.textContent).toContain('Extras that caught your attention: 0');
    expect(summary.textContent?.toLowerCase()).not.toMatch(/record|best/);
    // Restoring a finished session does not report it again.
    const r = setup();
    r.instance.restore(g.instance.serialize());
    expect(r.finished).toEqual([]);
    expect(r.el('dc-summary')?.hidden).toBe(false);
  });

  it('extras are static with reduced motion and only gently fade in otherwise', () => {
    expect(setup({ seed: 1, reducedMotion: true }).root.firstElementChild?.classList.contains('wp-dc--motion')).toBe(false);
    expect(setup({ seed: 1, reducedMotion: false }).root.firstElementChild?.classList.contains('wp-dc--motion')).toBe(true);
  });

  it('uses the locale direction', () => {
    expect(setup({ seed: 1, locale: 'ar' }).root.firstElementChild?.getAttribute('dir')).toBe('rtl');
  });

  it('reset returns to the seeded start', () => {
    const g = setup({ seed: 3, difficulty: 'busy' });
    const initial = g.instance.serialize();
    g.click('dc-start');
    g.click('dc-answer-even');
    g.instance.reset();
    expect(g.instance.serialize()).toEqual(initial);
    expect(g.el('dc-intro')?.hidden).toBe(false);
  });
});
