// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { GameInstance } from '@wp/game-core';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { CONTENT } from '../src/content';
import { createInitialState, itemById, phaseOf, ROUND_SIZE, type AmbiguityState } from '../src/rules';

let running: GameInstance<AmbiguityState>[] = [];
afterEach(() => {
  for (const instance of running) instance.dispose();
  running = [];
  document.body.innerHTML = '';
});

function setup(options: { seed?: number; difficulty?: string; locale?: Parameters<typeof createTestContext>[1] } = {}) {
  const ctx = createTestContext(game as never, options.locale ?? 'en');
  const instance = game.create(ctx.context);
  running.push(instance);
  instance.newGame({ seed: options.seed ?? 7, ...(options.difficulty ? { difficulty: options.difficulty } : {}) });
  return { ctx, instance, root: ctx.context.root };
}

const byId = <T extends HTMLElement = HTMLElement>(root: HTMLElement, id: string) => {
  const el = root.querySelector<T>(`[data-testid="${id}"]`);
  if (!el) throw new Error(`missing ${id}`);
  return el;
};
const maybe = (root: HTMLElement, id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
const goldOf = (state: AmbiguityState) => itemById(state.items[state.index] as string)!;

/** Answers the current item through the DOM: ticks `dims`, checks, chooses `reply`. */
function answer(root: HTMLElement, dims: readonly string[], reply = 'clear') {
  for (const dim of dims) byId(root, `ad-dim-${dim}`).click();
  byId(root, 'ad-check').click();
  byId(root, `ad-reply-${reply}`).click();
}

describe('Ambiguity Detector view', () => {
  it('shows the situation, the request and the five everyday dimensions on easy', () => {
    const { root, instance } = setup();
    const state = instance.serialize();
    const id = state.items[0] as string;
    expect(byId(root, 'ad-message').dataset.item).toBe(id);
    expect(byId(root, 'ad-context').textContent).toBe(CONTENT.en![id]!.context);
    expect(byId(root, 'ad-text').textContent).toBe(CONTENT.en![id]!.text);
    expect(byId(root, 'ad-progress').textContent).toBe('Message 1 of 6 · Easy');
    expect(root.querySelectorAll('[data-testid^="ad-dim-"]')).toHaveLength(5);
    expect(maybe(root, 'ad-dim-purpose')).toBeNull();
    expect(byId(root, 'ad-dim-what').hasAttribute('data-autofocus')).toBe(true);
    expect(maybe(root, 'ad-feedback')).toBeNull();
    expect(maybe(root, 'ad-replies')).toBeNull();
  });

  it('offers all ten dimensions on medium and hard', () => {
    expect(setup({ difficulty: 'medium' }).root.querySelectorAll('[data-testid^="ad-dim-"]')).toHaveLength(10);
    expect(setup({ difficulty: 'hard' }).root.querySelectorAll('[data-testid^="ad-dim-"]')).toHaveLength(10);
  });

  it('ticks dimensions, saves and keeps the tick after a re-render', () => {
    const { root, instance, ctx } = setup({ difficulty: 'medium' });
    byId(root, 'ad-dim-scope').click();
    byId(root, 'ad-dim-when').click();
    expect(ctx.saveRequests()).toBe(2);
    expect(instance.serialize().answers[0]?.ticked).toEqual(['when', 'scope']);
    expect(byId<HTMLInputElement>(root, 'ad-dim-scope').checked).toBe(true);
    expect(byId<HTMLInputElement>(root, 'ad-dim-what').checked).toBe(false);
  });

  it('reveals hits, misses and false alarms with symbols and explanations', () => {
    const { root, instance, ctx } = setup({ difficulty: 'hard', seed: 3 });
    const item = goldOf(instance.serialize());
    const hit = item.missing[0]!;
    const missed = item.missing.slice(1);
    const extra = item.given[0]!;
    byId(root, `ad-dim-${hit}`).click();
    byId(root, `ad-dim-${extra}`).click();
    byId(root, 'ad-check').click();
    const text = CONTENT.en![item.id]!;
    const hitRow = byId(root, `ad-row-${hit}`);
    expect(hitRow.dataset.verdict).toBe('hit');
    expect(hitRow.textContent).toContain('✓');
    expect(hitRow.textContent).toContain('Found');
    expect(hitRow.textContent).toContain(text.ask[hit]!);
    for (const dim of missed) {
      expect(byId(root, `ad-row-${dim}`).dataset.verdict).toBe('miss');
      expect(byId(root, `ad-row-${dim}`).textContent).toContain('✗');
      expect(byId(root, `ad-row-${dim}`).textContent).toContain('Overlooked');
    }
    const extraRow = byId(root, `ad-row-${extra}`);
    expect(extraRow.dataset.verdict).toBe('extra');
    expect(extraRow.textContent).toContain('!');
    expect(extraRow.textContent).toContain(text.given[extra]!);
    expect(byId(root, 'ad-counts').textContent).toBe(`Found: 1 · Overlooked: ${missed.length} · Not missing: 1`);
    // Other given dimensions are listed as already known.
    const restGiven = item.given.slice(1);
    if (restGiven.length) expect(byId(root, 'ad-given').querySelectorAll('li')).toHaveLength(restGiven.length);
    expect(byId<HTMLInputElement>(root, `ad-dim-${hit}`).disabled).toBe(true);
    expect(maybe(root, 'ad-check')).toBeNull();
    expect(ctx.saveRequests()).toBe(3);
    expect(document.activeElement?.id).toBe('ad-feedback-heading');
  });

  it('explains a ticked dimension that is neither missing nor given as not essential', () => {
    const { root, instance } = setup({ difficulty: 'medium', seed: 12 });
    const item = goldOf(instance.serialize());
    const other = ['what', 'when', 'who', 'where', 'format', 'audience', 'scope', 'priority', 'criterion', 'purpose'].find(
      (dim) => !item.missing.includes(dim as never) && !item.given.includes(dim as never)
    )!;
    byId(root, `ad-dim-${other}`).click();
    byId(root, 'ad-check').click();
    expect(byId(root, `ad-row-${other}`).textContent).toContain('Not essential for this request.');
  });

  it('shows the own question next to the model questions, ungraded', () => {
    const { root, instance } = setup();
    const area = byId<HTMLTextAreaElement>(root, 'ad-note');
    area.value = '  Which one do you mean?  ';
    area.dispatchEvent(new Event('input', { bubbles: true }));
    expect(instance.serialize().answers[0]?.note).toBe('  Which one do you mean?  ');
    byId(root, 'ad-check').click();
    expect(byId(root, 'ad-yours').textContent).toBe('Your question: Which one do you mean?');
  });

  it('remembers the choice to hide the own-question field', () => {
    const { root, ctx } = setup();
    byId(root, 'ad-note-option').click();
    expect(maybe(root, 'ad-note')).toBeNull();
    expect(ctx.preferences.get('ownQuestion')).toBe(false);
    const instance2 = game.create(ctx.context);
    running.push(instance2);
    instance2.newGame({ seed: 1 });
    expect(ctx.context.root.querySelector('[data-testid="ad-note"]')).toBeNull();
    expect(byId<HTMLInputElement>(ctx.context.root, 'ad-note-option').checked).toBe(false);
  });

  it('ignores a malformed preference', () => {
    const { ctx } = setup();
    ctx.preferences.set('ownQuestion', 'nope');
    const instance = game.create(ctx.context);
    running.push(instance);
    instance.newGame({ seed: 1 });
    expect(ctx.context.root.querySelector('[data-testid="ad-note"]')).not.toBeNull();
  });

  it('reveals the best reply with explanations after a choice', () => {
    const { root, instance } = setup({ seed: 5 });
    const item = goldOf(instance.serialize());
    byId(root, 'ad-check').click();
    const buttons = byId(root, 'ad-replies').querySelectorAll('button');
    expect(buttons).toHaveLength(3);
    byId(root, 'ad-reply-vague').click();
    expect(instance.serialize().answers[0]?.reply).toBe('vague');
    expect(byId(root, 'ad-replies').querySelectorAll('button')).toHaveLength(0);
    expect(byId(root, 'ad-reply-vague').dataset.chosen).toBe('true');
    expect(byId(root, 'ad-reply-vague').textContent).toContain('Your choice');
    expect(byId(root, 'ad-reply-vague').textContent).toContain('✗');
    expect(byId(root, 'ad-reply-clear').textContent).toContain('✓');
    expect(byId(root, 'ad-reply-clear').textContent).toContain('Best reply');
    expect(byId(root, `ad-reply-${item.third}`).textContent).toContain(CONTENT.en![item.id]!.replies[item.third]!);
    expect(document.activeElement?.getAttribute('data-testid')).toBe('ad-next');
  });

  it('plays a full round, shows a calm summary and finishes exactly once', () => {
    const { root, instance, ctx } = setup({ difficulty: 'medium', seed: 21 });
    for (let i = 0; i < ROUND_SIZE; i++) {
      const state = instance.serialize();
      expect(byId(root, 'ad-progress').dataset.index).toBe(String(i));
      // Find everything except the first gap; tick nothing extra.
      answer(root, goldOf(state).missing.slice(1), i % 2 === 0 ? 'clear' : 'vague');
      expect(byId(root, 'ad-next').textContent).toBe(i === ROUND_SIZE - 1 ? 'Show summary' : 'Next message');
      expect(ctx.results).toHaveLength(0);
      byId(root, 'ad-next').click();
    }
    expect(phaseOf(instance.serialize())).toBe('summary');
    expect(ctx.results).toEqual([expect.objectContaining({ outcome: 'completed' })]);
    expect(ctx.results[0]?.stats?.bestReplies).toBe(3);
    expect(ctx.results[0]?.stats?.overlooked).toBe(6);
    expect(byId(root, 'ad-summary')).toBeTruthy();
    expect(byId(root, 'ad-sum-found').textContent).toMatch(/^Missing information found: \d+ of \d+$/);
    expect(byId(root, 'ad-overlooked').textContent).toMatch(/^Overlooked most often: /);

    const saved = instance.serialize();
    const ctx2 = createTestContext(game as never, 'en');
    const restored = game.create(ctx2.context);
    running.push(restored);
    restored.restore(saved);
    expect(ctx2.results).toHaveLength(0);
    expect(byId(ctx2.context.root, 'ad-summary')).toBeTruthy();
  });

  it('says so when nothing was overlooked', () => {
    const { root, instance } = setup({ seed: 2 });
    for (let i = 0; i < ROUND_SIZE; i++) {
      answer(root, goldOf(instance.serialize()).missing);
      byId(root, 'ad-next').click();
    }
    expect(byId(root, 'ad-overlooked').textContent).toBe('You found every missing piece of information in this round.');
  });

  it('restores every phase exactly', () => {
    const { root, instance } = setup({ difficulty: 'hard', seed: 9 });
    const states: AmbiguityState[] = [instance.serialize()];
    byId(root, 'ad-dim-who').click();
    states.push(instance.serialize());
    byId(root, 'ad-check').click();
    states.push(instance.serialize());
    byId(root, 'ad-reply-redundant').click();
    states.push(instance.serialize());
    byId(root, 'ad-next').click();
    states.push(instance.serialize());
    for (const state of states) {
      const ctx = createTestContext(game as never, 'en');
      const restored = game.create(ctx.context);
      running.push(restored);
      restored.restore(state);
      expect(restored.serialize()).toEqual(state);
      expect(byId(ctx.context.root, 'ad-progress').dataset.index).toBe(String(state.index));
      const phase = phaseOf(state);
      expect(maybe(ctx.context.root, 'ad-check') !== null).toBe(phase === 'tick');
      expect(maybe(ctx.context.root, 'ad-feedback') !== null).toBe(phase === 'feedback' || phase === 'replied');
      expect(maybe(ctx.context.root, 'ad-next') !== null).toBe(phase === 'replied');
    }
  });

  it('ignores input while paused', () => {
    const { root, instance } = setup();
    const before = instance.serialize();
    instance.pause();
    byId(root, 'ad-dim-what').click();
    byId(root, 'ad-check').click();
    expect(instance.serialize()).toEqual(before);
    instance.resume();
    byId(root, 'ad-dim-what').click();
    expect(instance.serialize().answers[0]?.ticked).toEqual(['what']);
  });

  it('resets to the seeded start and starts over on newGame', () => {
    const { root, instance } = setup({ seed: 4 });
    answer(root, ['what']);
    instance.reset();
    expect(instance.serialize()).toEqual(createInitialState(4, 'easy'));
    answer(root, ['when']);
    instance.newGame({ seed: 8, difficulty: 'hard' });
    expect(instance.serialize()).toEqual(createInitialState(8, 'hard'));
  });

  it('renders the item texts in the UI language and right-to-left for Arabic', () => {
    const de = setup({ locale: 'de' });
    const id = de.instance.serialize().items[0] as string;
    expect(byId(de.root, 'ad-text').textContent).toBe(CONTENT.de![id]!.text);
    const ar = setup({ locale: 'ar' });
    expect(ar.root.querySelector('.wp-ambiguity-detector')?.getAttribute('dir')).toBe('rtl');
    expect(ar.ctx.missingKeys).toEqual([]);
  });
});
