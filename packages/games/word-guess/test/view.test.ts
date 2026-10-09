// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { createTestContext, type TestContext } from '@wp/testing';
import type { SupportedLocale } from '@wp/localization';
import type { GameInstance, GameModule } from '@wp/game-core';
import game from '../src/index';
import { answerOf, createInitialState, type WordGuessState } from '../src/rules';
import { wordList } from '../src/words';

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const fn of cleanup) fn();
  cleanup = [];
  document.body.innerHTML = '';
});

function start(options: { seed?: number; difficulty?: string; locale?: SupportedLocale; state?: WordGuessState } = {}) {
  const ctx: TestContext = createTestContext(game as GameModule<unknown>, options.locale ?? 'en');
  const instance = game.create(ctx.context) as GameInstance<WordGuessState>;
  if (options.state) instance.restore(options.state);
  else instance.newGame({ seed: options.seed ?? 1, ...(options.difficulty ? { difficulty: options.difficulty } : {}) });
  cleanup.push(() => instance.dispose());
  const root = ctx.context.root;
  const q = (id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  const press = (key: string, target: EventTarget = document.body) =>
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  const typeKeys = (word: string) => [...word].forEach((l) => press(l));
  const click = (word: string) => [...word].forEach((l) => q(`wg-key-${l}`)!.click());
  return { ctx, instance, root, q, press, typeKeys, click };
}

const withAnswer = (word: string, base = createInitialState(0)): WordGuessState => {
  const list = wordList(base.language, word.length === 6 ? 6 : 5);
  // Only for rendering tests: a state whose answer is `word` (skips the seed consistency of isValidState).
  return { ...base, answer: list.indexOf(word) };
};

describe('view', () => {
  it('renders an empty grid sized by difficulty and a keyboard for the word language', () => {
    for (const [difficulty, rows, cols] of [['easy', 7, 5], ['medium', 6, 5], ['hard', 6, 6]] as const) {
      const { root, q } = start({ difficulty });
      expect(root.querySelectorAll('[data-testid^="wg-row-"]')).toHaveLength(rows);
      expect(q('wg-row-0')!.querySelectorAll('.wg-tile')).toHaveLength(cols);
      expect(q('wg-status')!.textContent).toBe(`Tries left: ${rows} of ${rows}`);
    }
    const { root } = start();
    expect(root.querySelectorAll('[data-testid^="wg-key-"]')).toHaveLength(26);
  });

  it('types with the physical keyboard, deletes with Backspace and saves each change', () => {
    const { q, press, typeKeys, instance, ctx } = start();
    typeKeys('Ab1');
    expect(instance.serialize().input).toBe('ab');
    expect(q('wg-tile-0-0')!.dataset.letter).toBe('a');
    expect(q('wg-tile-0-1')!.textContent).toBe('B');
    press('Backspace');
    expect(instance.serialize().input).toBe('a');
    expect(ctx.saveRequests()).toBe(3);
    // Modifier shortcuts and typing into form fields are left alone.
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', ctrlKey: true, bubbles: true }));
    press('c', q('wg-language')!);
    expect(instance.serialize().input).toBe('a');
  });

  it('ignores typing aimed at elements outside the game', () => {
    const { press, instance } = start();
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    press('a', outside);
    expect(instance.serialize().input).toBe('');
  });

  it('submits with Enter, marks letters by symbol and text, and announces the feedback', async () => {
    const { q, typeKeys, press, root } = start({ state: withAnswer('crane') });
    typeKeys('eerie');
    press('Enter');
    expect(q('wg-tile-0-2')!.dataset.mark).toBe('near');
    expect(q('wg-tile-0-4')!.dataset.mark).toBe('hit');
    expect(q('wg-tile-0-0')!.dataset.mark).toBe('miss');
    expect(q('wg-tile-0-4')!.querySelector('.wg-symbol')!.textContent).toBe('●');
    expect(q('wg-tile-0-2')!.querySelector('.wg-symbol')!.textContent).toBe('◐');
    expect(q('wg-tile-0-0')!.querySelector('.wg-symbol')!.textContent).toBe('✕');
    expect(q('wg-key-e')!.getAttribute('aria-label')).toBe('E: right place');
    expect(q('wg-key-r')!.dataset.mark).toBe('near');
    expect(q('wg-key-i')!.getAttribute('aria-label')).toBe('I: not in the word');
    expect(root.querySelector('.wg-grid .sr-only')!.textContent).toContain('Letter 3 R: in the word, elsewhere');
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(q('wg-live')!.textContent).toContain('Guess 1: Letter 1 E: not in the word');
  });

  it('explains short guesses without using a try', async () => {
    const { q, typeKeys, press, instance } = start();
    typeKeys('abc');
    press('Enter');
    expect(q('wg-message')!.hidden).toBe(false);
    expect(q('wg-message')!.textContent).toBe('Enter 5 letters first.');
    expect(instance.serialize().guesses).toEqual([]);
  });

  it('enforces strict mode with a clear message', () => {
    const { q, click, instance } = start({ state: { ...withAnswer('crane'), strict: true } });
    click('cqqqq');
    q('wg-enter')!.click();
    click('qcqqq');
    q('wg-enter')!.click();
    expect(q('wg-message')!.textContent).toBe('Strict mode: letter 1 must be C.');
    expect(instance.serialize().guesses).toHaveLength(1);
  });

  it('finishes once on a win, shows the word and hides the keyboard', () => {
    const { q, click, ctx, instance } = start({ seed: 77, difficulty: 'medium' });
    const answer = answerOf(instance.serialize());
    click(answer);
    q('wg-enter')!.click();
    expect(ctx.results).toEqual([{ outcome: 'won', stats: { tries: 1 } }]);
    expect(q('wg-answer')!.dataset.word).toBe(answer);
    expect(q('wg-answer')!.textContent).toBe(`The word was ${answer.toUpperCase()}.`);
    expect(q('wg-status')!.textContent).toBe('Found with 1 of 6 tries.');
    expect(q('wg-keyboard')).toBeNull();
    // Restoring a finished game does not report it again.
    const again = start({ state: instance.serialize() });
    expect(again.ctx.results).toEqual([]);
    expect(again.q('wg-answer')).not.toBeNull();
  });

  it('reports a loss after the last try', () => {
    let state = createInitialState(3, 'medium');
    const wrong = answerOf(state) === 'qqqqq' ? 'zzzzz' : 'qqqqq';
    state = { ...state, guesses: Array.from({ length: 5 }, () => wrong) };
    const { click, q, ctx } = start({ state });
    click(wrong);
    q('wg-enter')!.click();
    expect(ctx.results).toEqual([{ outcome: 'lost', stats: { tries: 6 } }]);
    expect(q('wg-status')!.dataset.status).toBe('lost');
    expect(q('wg-answer')).not.toBeNull();
  });

  it('defaults the word language to the UI language and offers a QWERTZ keyboard with umlauts', () => {
    const { q, instance } = start({ locale: 'de' });
    expect(instance.serialize().language).toBe('de');
    expect(q('wg-key-ä')).not.toBeNull();
    expect(q('wg-key-ü')!.textContent).toBe('Ü');
    const rows = [...q('wg-keyboard')!.querySelectorAll('.wg-krow')].map((r) => [...r.querySelectorAll('[data-testid^="wg-key-"]')].map((k) => k.getAttribute('data-testid')!.slice(7)).join(''));
    expect(rows).toEqual(['qwertzuiopü', 'asdfghjklöä', 'yxcvbnm']);
    expect(start({ locale: 'fr' }).instance.serialize().language).toBe('en');
  });

  it('switches the word language from the options and keeps it for the next game', () => {
    const { q, instance, ctx } = start({ seed: 5 });
    const select = q('wg-language') as HTMLSelectElement;
    select.value = 'de';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(instance.serialize()).toEqual(createInitialState(5, 'easy', { language: 'de', strict: false, layout: 'familiar' }));
    expect(ctx.saveRequests()).toBe(1);
    instance.newGame({ seed: 6, difficulty: 'hard' });
    expect(instance.serialize().language).toBe('de');
    expect(instance.serialize().difficulty).toBe('hard');
  });

  it('switches to the large alphabetical keyboard and toggles strict mode', () => {
    const { q, instance } = start({ locale: 'de' });
    const layout = q('wg-layout') as HTMLSelectElement;
    layout.value = 'large';
    layout.dispatchEvent(new Event('change', { bubbles: true }));
    expect(instance.serialize().layout).toBe('large');
    expect(q('wg-keyboard')!.classList.contains('wg-layout-large')).toBe(true);
    const keys = [...q('wg-keyboard')!.querySelectorAll('[data-testid^="wg-key-"]')].map((k) => k.getAttribute('data-testid')!.slice(7)).join('');
    expect(keys).toBe('abcdefghijklmnopqrstuvwxyzäöü');
    const strict = q('wg-strict') as HTMLInputElement;
    strict.checked = true;
    strict.dispatchEvent(new Event('change', { bubbles: true }));
    expect(instance.serialize().strict).toBe(true);
  });

  it('keeps the word grid left-to-right inside an Arabic (RTL) interface', () => {
    const { root, q } = start({ locale: 'ar' });
    expect(root.querySelector('.wp-word-guess')!.getAttribute('dir')).toBe('rtl');
    expect(q('wg-grid')!.getAttribute('dir')).toBe('ltr');
    expect(q('wg-keyboard')!.getAttribute('dir')).toBe('ltr');
  });

  it('ignores input while paused and resets to the seeded start', () => {
    const { typeKeys, instance, q } = start({ seed: 9 });
    const initial = instance.serialize();
    instance.pause();
    typeKeys('ab');
    q('wg-key-c')!.click();
    expect(instance.serialize()).toEqual(initial);
    instance.resume();
    typeKeys('ab');
    instance.reset();
    expect(instance.serialize()).toEqual(initial);
  });

  it('lets Enter activate a focused on-screen button instead of submitting', () => {
    const { q, press, instance } = start();
    const back = q('wg-back')!;
    back.focus();
    press('Enter', back);
    expect(instance.serialize().guesses).toEqual([]);
  });
});
