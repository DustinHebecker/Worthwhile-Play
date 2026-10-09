// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { GameInstance } from '@wp/game-core';
import { SUPPORTED_LOCALES } from '@wp/localization';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { contentFor } from '../src/content';
import { answer, createInitialState, finishReading, next, setSummary, setTextOpen, submitSummary, textOf, toggleSelfCheck, type DeepReadState } from '../src/rules';

// Per-locale content (ADR 0011): the host awaits `preload` before creating the game.
beforeAll(async () => {
  for (const locale of SUPPORTED_LOCALES) await game.preload!(locale);
});

let running: GameInstance<DeepReadState>[] = [];
afterEach(() => {
  for (const instance of running) instance.dispose();
  running = [];
  document.body.innerHTML = '';
});

type Locale = (typeof SUPPORTED_LOCALES)[number];

function setup(locale: Locale = 'en', seed = 1, difficulty = 'easy') {
  const ctx = createTestContext(game as never, locale);
  const instance = game.create(ctx.context) as GameInstance<DeepReadState>;
  running.push(instance);
  instance.newGame({ seed, difficulty });
  return { ctx, instance, root: ctx.context.root };
}

function restoreInto(state: DeepReadState, locale: Locale = 'en') {
  const ctx = createTestContext(game as never, locale);
  const instance = game.create(ctx.context) as GameInstance<DeepReadState>;
  running.push(instance);
  instance.restore(state);
  return { ctx, instance, root: ctx.context.root };
}

const byId = <T extends HTMLElement = HTMLElement>(root: HTMLElement, id: string) => {
  const el = root.querySelector<T>(`[data-testid="${id}"]`);
  if (!el) throw new Error(`missing ${id}`);
  return el;
};
const maybe = (root: HTMLElement, id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`);

const choose = (root: HTMLElement, option: string) => {
  byId(root, `dr-radio-${option}`).click();
  byId(root, 'dr-check').click();
};

describe('Deep Read view', () => {
  it('shows the text with numbered paragraphs, then the first question after "done reading"', () => {
    const { root, instance } = setup();
    const textId = instance.serialize().textId;
    const content = contentFor('en')[textId]!;
    expect(byId(root, 'dr-title').textContent).toBe(content.title);
    expect(byId(root, 'dr-title').hasAttribute('data-autofocus')).toBe(true);
    expect(root.querySelectorAll('[data-para]')).toHaveLength(content.paragraphs.length);
    expect(byId(root, 'dr-para-2').textContent).toContain(content.paragraphs[1]!);
    expect(maybe(root, 'dr-question')).toBeNull();

    byId(root, 'dr-done-reading').click();
    expect(maybe(root, 'dr-text')).toBeNull();
    expect(byId(root, 'dr-progress').textContent).toBe(`Question 1 of ${textOf(instance.serialize()).questions.length}`);
    expect(byId(root, 'dr-type').textContent).toBe('Main idea');
    expect(byId(root, 'dr-question').querySelector('h4')?.textContent).toBe(content.questions.q1!.q);
    expect(root.querySelectorAll('input[type="radio"]')).toHaveLength(textOf(instance.serialize()).questions[0]!.options.length);
  });

  it('asks for a choice before checking, without changing the state', () => {
    const { root, instance, ctx } = setup();
    byId(root, 'dr-done-reading').click();
    const saves = ctx.saveRequests();
    const before = instance.serialize();
    byId(root, 'dr-check').click();
    expect(byId(root, 'dr-notice').hidden).toBe(false);
    expect(byId(root, 'dr-notice').textContent).toBe('Choose an answer first.');
    expect(instance.serialize()).toEqual(before);
    expect(ctx.saveRequests()).toBe(saves);
  });

  it('shows correct/incorrect with a symbol and word, every explanation and the supporting paragraph', () => {
    const { root, instance, ctx } = setup();
    byId(root, 'dr-done-reading').click();
    const s = instance.serialize();
    const q = textOf(s).questions[0]!;
    const wrong = q.options.find((o) => o !== q.gold)!;
    const saves = ctx.saveRequests();
    choose(root, wrong);
    expect(ctx.saveRequests()).toBe(saves + 1);
    expect(instance.serialize().answers).toEqual([wrong]);

    const feedback = byId(root, 'dr-feedback');
    expect(feedback.dataset.correct).toBe('false');
    expect(feedback.dataset.answer).toBe(wrong);
    expect(byId(root, 'dr-verdict').textContent).toContain('✗');
    expect(byId(root, 'dr-verdict').textContent).toContain('Not quite.');
    const content = contentFor('en')[s.textId]!.questions[q.id]!;
    for (const id of q.options) {
      const item = byId(root, `dr-explain-${id}`);
      expect(item.textContent).toContain(content[id]![0]);
      expect(item.textContent).toContain(content[id]![1]);
      expect(item.dataset.gold).toBe(String(id === q.gold));
      expect(item.dataset.chosen).toBe(String(id === wrong));
    }
    expect(byId(root, `dr-explain-${q.gold}`).textContent).toContain('Best answer');
    expect(byId(root, `dr-explain-${wrong}`).textContent).toContain('Your answer');
    expect(byId(root, 'dr-see').textContent).toBe(`Supporting passage: paragraph ${q.support}.`);
    expect(maybe(root, 'dr-looked-back')).toBeNull();
    expect(byId(root, 'dr-next').textContent).toBe('Next question');
  });

  it('marks a correct answer with a check mark', () => {
    const { root, instance } = setup();
    byId(root, 'dr-done-reading').click();
    choose(root, textOf(instance.serialize()).questions[0]!.gold);
    expect(byId(root, 'dr-feedback').dataset.correct).toBe('true');
    expect(byId(root, 'dr-verdict').textContent).toContain('✓');
    expect(byId(root, 'dr-verdict').textContent).toContain('Correct.');
  });

  it('lets the text be re-opened and notes answers given with it open, without penalty wording', () => {
    const { root, instance } = setup();
    byId(root, 'dr-done-reading').click();
    expect(byId(root, 'dr-toggle-text').getAttribute('aria-expanded')).toBe('false');
    byId(root, 'dr-toggle-text').click();
    expect(byId(root, 'dr-toggle-text').getAttribute('aria-expanded')).toBe('true');
    expect(maybe(root, 'dr-text')).not.toBeNull();
    expect(byId(root, 'dr-open-note').textContent).toContain('the result only notes it');
    choose(root, 'a');
    expect(instance.serialize().lookedBack).toEqual([true]);
    expect(byId(root, 'dr-looked-back').textContent).toBe('Answered with the text open.');
  });

  it('"show paragraph" opens the text and highlights the supporting paragraph (not by colour only)', () => {
    const { root, instance } = setup();
    byId(root, 'dr-done-reading').click();
    choose(root, 'a');
    const support = textOf(instance.serialize()).questions[0]!.support!;
    byId(root, 'dr-show-para').click();
    expect(instance.serialize().textOpen).toBe(true);
    expect(instance.serialize().lookedBack).toEqual([false]);
    const para = byId(root, `dr-para-${support}`);
    expect(para.dataset.support).toBe('true');
    expect(para.querySelector('.dr-pnum')?.textContent).toBe(`◆ ${support}`);
    expect(document.activeElement).toBe(para);
    expect(root.querySelectorAll('[data-support="true"]')).toHaveLength(1);
  });

  it('plays a whole text, writes a sentence, self-checks and finishes exactly once', () => {
    const { root, instance, ctx } = setup('en', 5, 'hard');
    byId(root, 'dr-done-reading').click();
    const questions = textOf(instance.serialize()).questions;
    questions.forEach((q, i) => {
      choose(root, i === 0 ? questions[0]!.options.find((o) => o !== q.gold)! : q.gold);
      expect(byId(root, 'dr-next').textContent).toBe(i === questions.length - 1 ? 'Continue' : 'Next question');
      byId(root, 'dr-next').click();
    });
    expect(instance.serialize().phase).toBe('summary');
    byId(root, 'dr-compare').click();
    expect(byId(root, 'dr-notice').textContent).toBe('Write a sentence first, or skip this step.');
    expect(instance.serialize().phase).toBe('summary');

    const field = byId<HTMLTextAreaElement>(root, 'dr-summary-field');
    field.value = 'Test both plans fairly.';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    expect(byId(root, 'dr-count').textContent).toBe('23 of 240 characters');
    expect(instance.serialize().summary).toBe('Test both plans fairly.');
    byId(root, 'dr-compare').click();

    expect(byId(root, 'dr-yours').textContent).toBe('Test both plans fairly.');
    expect(byId(root, 'dr-model').textContent).toBe(contentFor('en')[instance.serialize().textId]!.summary);
    byId(root, 'dr-check-2').click();
    expect(instance.serialize().selfCheck).toEqual([false, true, false]);
    expect(ctx.results).toHaveLength(0);
    byId(root, 'dr-finish').click();

    expect(ctx.results).toEqual([{ outcome: 'completed', stats: { correct: questions.length - 1, questions: questions.length, lookedBack: 0, selfCheck: 1 } }]);
    expect(byId(root, 'dr-score').textContent).toBe(`Correct answers: ${questions.length - 1} of ${questions.length}`);
    expect(byId(root, 'dr-self-count').textContent).toBe('Self-check: 1 of 3 points ticked');
    expect(byId(root, 'dr-review-0').dataset.correct).toBe('false');
    expect(byId(root, 'dr-review-1').dataset.correct).toBe('true');
    expect(byId(root, 'dr-review-0').textContent).toContain('Best answer');
  });

  it('skipping the sentence finishes once and says so on the summary screen', () => {
    const { root, instance, ctx } = setup();
    byId(root, 'dr-done-reading').click();
    for (let i = 0; i < textOf(instance.serialize()).questions.length; i++) {
      choose(root, 'b');
      byId(root, 'dr-next').click();
    }
    byId(root, 'dr-skip').click();
    expect(instance.serialize().phase).toBe('done');
    expect(ctx.results).toHaveLength(1);
    expect(byId(root, 'dr-no-sentence').textContent).toBe('You skipped the one-sentence summary.');
    expect(maybe(root, 'dr-model')).toBeNull();
  });

  it('restores every phase exactly, renders it and never reports a finish again', () => {
    const r = createInitialState(9, 'medium');
    const q = finishReading(r);
    const fb = answer(setTextOpen(q, true), 'a');
    let s = fb;
    while (s.phase === 'questions') s = next(s.answers.length > s.cursor ? s : answer(s, 'b'));
    const summary = setSummary(s, 'Draft');
    const compare = toggleSelfCheck(submitSummary(summary), 0);
    const done = { ...compare, phase: 'done' as const };
    const marks: Array<[DeepReadState, string]> = [[r, 'dr-reading'], [q, 'dr-question'], [fb, 'dr-feedback'], [summary, 'dr-summary'], [compare, 'dr-compare-panel'], [done, 'dr-done']];
    for (const [state, testId] of marks) {
      const { instance, root, ctx } = restoreInto(JSON.parse(JSON.stringify(state)) as DeepReadState);
      expect(instance.serialize(), state.phase).toEqual(state);
      expect(maybe(root, testId), testId).not.toBeNull();
      expect(ctx.results).toHaveLength(0);
    }
    const restoredSummary = restoreInto(summary).root;
    expect(byId<HTMLTextAreaElement>(restoredSummary, 'dr-summary-field').value).toBe('Draft');
    const restoredFeedback = restoreInto(fb).root;
    expect(maybe(restoredFeedback, 'dr-text')).not.toBeNull();
    expect(byId(restoredFeedback, 'dr-looked-back')).not.toBeNull();
  });

  it('keeps a save valid across UI languages (ids only) and renders the localized text', () => {
    const { instance, root } = setup('en');
    byId(root, 'dr-done-reading').click();
    choose(root, 'a');
    const saved = instance.serialize();
    const german = restoreInto(saved, 'de');
    expect(german.instance.serialize()).toEqual(saved);
    expect(contentFor('de')[saved.textId]!.title, 'German content is loaded, not the fallback').not.toBe(contentFor('en')[saved.textId]!.title);
    expect(byId(german.root, 'dr-title').textContent).toBe(contentFor('de')[saved.textId]!.title);
    expect(byId(german.root, 'dr-feedback').textContent).toContain(contentFor('de')[saved.textId]!.questions.q1!.a![1]);
  });

  it('renders right-to-left for Arabic', () => {
    const { root } = setup('ar');
    const container = root.querySelector<HTMLElement>('.wp-deep-read')!;
    expect(container.getAttribute('dir')).toBe('rtl');
    expect(container.getAttribute('lang')).toBe('ar');
  });

  it('remembers the text size as a device preference and clamps it', () => {
    const { root, ctx } = setup();
    const container = () => root.querySelector<HTMLElement>('.wp-deep-read')!;
    expect(container().classList.contains('dr-size-0')).toBe(true);
    expect(byId<HTMLButtonElement>(root, 'dr-smaller').disabled).toBe(true);
    byId(root, 'dr-larger').click();
    byId(root, 'dr-larger').click();
    expect(container().classList.contains('dr-size-2')).toBe(true);
    expect(byId<HTMLButtonElement>(root, 'dr-larger').disabled).toBe(true);
    expect(ctx.preferences.get('textSize')).toBe(2);
    byId(root, 'dr-smaller').click();
    expect(ctx.preferences.get('textSize')).toBe(1);

    const again = createTestContext(game as never, 'en');
    again.preferences.set('textSize', 1);
    const instance = game.create(again.context);
    running.push(instance as GameInstance<DeepReadState>);
    instance.newGame({ seed: 1 });
    expect(again.context.root.querySelector('.wp-deep-read')!.classList.contains('dr-size-1')).toBe(true);

    const bad = createTestContext(game as never, 'en');
    bad.preferences.set('textSize', 9);
    const other = game.create(bad.context);
    running.push(other as GameInstance<DeepReadState>);
    other.newGame({ seed: 1 });
    expect(bad.context.root.querySelector('.wp-deep-read')!.classList.contains('dr-size-0')).toBe(true);
  });

  it('ignores input while paused', () => {
    const { root, instance } = setup();
    instance.pause();
    byId(root, 'dr-done-reading').click();
    expect(instance.serialize().phase).toBe('reading');
    instance.resume();
    byId(root, 'dr-done-reading').click();
    expect(instance.serialize().phase).toBe('questions');
  });

  it('newGame on a used instance starts fresh, and reset returns to the seeded start', () => {
    const { root, instance } = setup('en', 4);
    const initial = instance.serialize();
    byId(root, 'dr-done-reading').click();
    choose(root, 'a');
    instance.reset();
    expect(instance.serialize()).toEqual(initial);
    expect(maybe(root, 'dr-reading')).not.toBeNull();
    byId(root, 'dr-done-reading').click();
    instance.newGame({ seed: 4, difficulty: 'hard' });
    expect(instance.serialize()).toEqual(createInitialState(4, 'hard'));
    expect(root.querySelectorAll('.wp-deep-read')).toHaveLength(1);
  });

  it('renders the first question in every locale without missing keys', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const { root, ctx } = setup(locale);
      byId(root, 'dr-done-reading').click();
      choose(root, 'a');
      expect(ctx.missingKeys, locale).toEqual([]);
      expect(byId(root, 'dr-verdict').textContent?.trim().length).toBeGreaterThan(2);
    }
  }, 90_000);
});
