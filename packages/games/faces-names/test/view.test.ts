// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { GameContext, GameInstance, GameModule, GameResult } from '@wp/game-core';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@wp/localization';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { NAMES } from '../src/names';
import { correctOption, standoutOptions, type FacesNamesState, type Question } from '../src/rules';

const instances: GameInstance<FacesNamesState>[] = [];

function setup(options: { seed?: number; difficulty?: string; locale?: SupportedLocale } = {}) {
  const ctx = createTestContext(game as GameModule<unknown>, options.locale ?? 'en');
  const finished: GameResult[] = [];
  const context: GameContext = { ...ctx.context, finished: (r) => finished.push(r) };
  const instance = game.create(context);
  instances.push(instance);
  const root = context.root;
  const el = <T extends HTMLElement = HTMLElement>(id: string) => root.querySelector<T>(`[data-testid="${id}"]`);
  const click = (id: string) => (el(id) as HTMLButtonElement).click();
  const key = (k: string, target: EventTarget = document.body, code = '') =>
    target.dispatchEvent(new KeyboardEvent('keydown', { key: k, code, bubbles: true, cancelable: true }));
  const state = () => instance.serialize();
  const toTest = () => {
    while (state().phase === 'study') click('fn-next');
  };
  if (options.seed !== undefined) instance.newGame({ seed: options.seed, ...(options.difficulty ? { difficulty: options.difficulty } : {}) });
  return { ctx, context, instance, root, el, click, key, state, finished, toTest };
}

const typeNote = (input: HTMLInputElement, text: string) => {
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

afterEach(() => {
  for (const instance of instances.splice(0)) instance.dispose();
});

describe('Faces & Names view', () => {
  it('shows the first person with a described face, name, age, job and detail; nothing advances on its own', () => {
    const g = setup({ seed: 1 });
    const s = g.state();
    const p = s.people[0] as FacesNamesState['people'][number];
    expect(g.el('fn-status')?.textContent).toBe('Person 1 of 4');
    expect(g.el('fn-study')?.hidden).toBe(false);
    expect(g.el('fn-test')?.hidden).toBe(true);
    expect(g.el('fn-name')?.textContent).toBe(p.name);
    expect(NAMES.en).toContain(p.name);
    expect(g.root.textContent).toContain(`Age: ${p.age}`);
    expect(g.el('fn-job')?.textContent).toMatch(/^Job: /);
    expect(g.el('fn-context')?.textContent).toMatch(/^from /);
    const label = g.el('fn-face')?.getAttribute('aria-label') ?? '';
    expect(label).toMatch(/^Face: .*face, .*(hair|head|cap|headscarf)/);
    expect(g.el('fn-face')?.getAttribute('role')).toBe('img');
    expect(g.el('fn-face')?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(g.el('fn-face')?.querySelectorAll('svg *').length).toBeGreaterThan(10);
    expect(g.el('fn-next')?.hasAttribute('data-autofocus')).toBe(true);
    expect(g.el('fn-next')?.textContent).toBe('Next person');
    expect((g.el('fn-back') as HTMLButtonElement).disabled).toBe(true);
    expect(g.state()).toEqual(s);
  });

  it('describes hair with its colour and never mentions skin', () => {
    const g = setup({ seed: 2, difficulty: 'hard' });
    for (let i = 0; i < 8; i++) {
      const label = g.el('fn-face')?.getAttribute('aria-label') ?? '';
      expect(label).not.toMatch(/skin/i);
      const face = (g.state().people[i] as FacesNamesState['people'][number]).face;
      if (!['bald', 'headscarf', 'cap'].includes(face.hair)) expect(label).toMatch(/hair \((black|dark brown|brown|red|blond|grey)\)|in a bun \(/);
      g.click('fn-next');
    }
  });

  it('lets the person pick what stands out (toggle) and write a note; both are saved', () => {
    const g = setup({ seed: 3 });
    const options = standoutOptions(g.state().people, 0);
    const chips = g.root.querySelectorAll('[data-testid^="fn-standout-"]');
    expect(chips.length).toBe(options.length);
    const first = g.el(`fn-standout-${options[0]}`) as HTMLButtonElement;
    expect(first.getAttribute('aria-pressed')).toBe('false');
    const saves = g.ctx.saveRequests();
    first.click();
    expect(g.state().standout[0]).toBe(options[0]);
    expect(g.el(`fn-standout-${options[0]}`)?.getAttribute('aria-pressed')).toBe('true');
    expect(g.el(`fn-standout-${options[0]}`)?.textContent).toContain('✓');
    expect(g.ctx.saveRequests()).toBeGreaterThan(saves);
    g.click(`fn-standout-${options[0]}`);
    expect(g.state().standout[0]).toBeNull();
    const note = g.el('fn-note') as HTMLInputElement;
    expect(note.maxLength).toBe(120);
    typeNote(note, 'Sarah\t→ Sahara');
    expect(g.state().notes[0]).toBe('Sarah → Sahara');
    note.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    expect(g.state().index).toBe(1);
    expect(note.value).toBe('');
    g.click('fn-back');
    expect(note.value).toBe('Sarah → Sahara');
  });

  it('starts mixed questions after the last person, answers by click or number key, and keeps the feedback', () => {
    const g = setup({ seed: 4 });
    for (let i = 0; i < 3; i++) g.click('fn-next');
    expect(g.el('fn-next')?.textContent).toBe('Start the questions');
    g.click('fn-next');
    expect(g.el('fn-test')?.hidden).toBe(false);
    expect(g.el('fn-status')?.textContent).toBe('Question 1 of 12');
    const s = g.state();
    const q = s.questions[0] as Question;
    expect(g.root.querySelectorAll('[data-testid^="fn-option-"]').length).toBe(4);
    expect(g.el('fn-feedback')?.hidden).toBe(true);
    expect(g.el('fn-continue')?.hidden).toBe(true);
    const correct = correctOption(s.people, q);
    const wrong = (correct + 1) % 4;
    g.key(String(wrong + 1));
    expect(g.state().answers).toEqual([wrong]);
    expect(g.el(`fn-option-${wrong}`)?.dataset.result).toBe('wrong');
    expect(g.el(`fn-option-${wrong}`)?.textContent).toContain('✗');
    expect(g.el(`fn-option-${correct}`)?.dataset.result).toBe('correct');
    expect(g.el(`fn-option-${correct}`)?.textContent).toContain('✓');
    expect(g.el('fn-feedback')?.textContent).toMatch(/^✗ Not quite\. The answer is: /);
    expect(g.el('fn-continue')?.hidden).toBe(false);
    // Further keys and clicks do not change the answer.
    g.key(String(correct + 1));
    g.click(`fn-option-${correct}`);
    expect(g.state().answers).toEqual([wrong]);
    g.click('fn-continue');
    expect(g.el('fn-status')?.textContent).toBe('Question 2 of 12');
    const q2 = g.state().questions[1] as Question;
    g.click(`fn-option-${correctOption(s.people, q2)}`);
    expect(g.el('fn-feedback')?.textContent).toMatch(/^✓ Correct: /);
  });

  it('shows the face as the cue for name and job questions, the name for face questions with described face options', () => {
    const g = setup({ seed: 5, difficulty: 'medium' });
    g.toTest();
    const seen = new Set<string>();
    while (g.state().phase === 'test' && seen.size < 3) {
      const s = g.state();
      const q = s.questions[s.index] as Question;
      seen.add(q.type);
      const cue = g.el('fn-cue') as HTMLElement;
      if (q.type === 'face') {
        expect(cue.textContent).toBe(s.people[q.person]?.name);
        expect(g.el('fn-question')?.textContent).toBe(`Which face belongs to ${s.people[q.person]?.name}?`);
        expect(g.el('fn-option-0')?.getAttribute('aria-label')).toMatch(/^Face 1: .*face/);
        expect(g.el('fn-option-0')?.querySelector('svg')).not.toBeNull();
      } else {
        expect(cue.getAttribute('role')).toBe('img');
        expect(cue.getAttribute('aria-label')).toMatch(/^Face: /);
        expect(cue.querySelector('svg')).not.toBeNull();
        expect(g.el('fn-option-0')?.getAttribute('aria-label')).toMatch(/^1: /);
        expect(g.el('fn-question')?.textContent).toBe(q.type === 'name' ? 'What is this person’s name?' : 'What does this person do?');
      }
      g.click('fn-option-0');
      g.click('fn-continue');
    }
    expect(seen.size).toBe(3);
  });

  it('offers "Show my note" only when there is a note, records its use, and shows the note', () => {
    const g = setup({ seed: 6 });
    typeNote(g.el('fn-note') as HTMLInputElement, 'sunny Sahara');
    g.toTest();
    const s = g.state();
    const withNote = s.questions.findIndex((q) => q.person === 0);
    for (let i = 0; i < withNote; i++) {
      expect(g.el('fn-hint')?.hidden).toBe(true);
      g.click('fn-option-0');
      g.click('fn-continue');
    }
    expect(g.el('fn-hint')?.hidden).toBe(false);
    expect(g.el('fn-hint')?.textContent).toBe('Show my note');
    expect(g.el('fn-hint-text')?.hidden).toBe(true);
    g.click('fn-hint');
    expect(g.state().hints[withNote]).toBe(true);
    expect(g.el('fn-hint')?.hidden).toBe(true);
    expect(g.el('fn-hint-text')?.textContent).toBe('Your note: sunny Sahara');
    g.click('fn-option-0');
    expect(g.el('fn-hint-text')?.hidden).toBe(false);
  });

  it('restores an answered question with its feedback, and an unanswered one without', () => {
    const g = setup({ seed: 7 });
    g.toTest();
    g.click('fn-option-2');
    const saved = g.state();
    const before = g.el('fn-feedback')?.textContent;
    const h = setup({});
    h.instance.restore(saved);
    expect(h.state()).toEqual(saved);
    expect(h.el('fn-status')?.textContent).toBe('Question 1 of 12');
    expect(h.el('fn-feedback')?.hidden).toBe(false);
    expect(h.el('fn-feedback')?.textContent).toBe(before);
    expect(h.el('fn-option-2')?.dataset.chosen).toBe('true');
    expect(h.el('fn-continue')?.hidden).toBe(false);
    h.click('fn-continue');
    const k = setup({});
    k.instance.restore(h.state());
    expect(k.el('fn-feedback')?.hidden).toBe(true);
    expect(k.el('fn-status')?.textContent).toBe('Question 2 of 12');
  });

  it('restores mid-study at the same person with the note and feature', () => {
    const g = setup({ seed: 8 });
    g.click('fn-next');
    typeNote(g.el('fn-note') as HTMLInputElement, 'tall tree');
    const feature = standoutOptions(g.state().people, 1)[1];
    g.click(`fn-standout-${feature}`);
    const h = setup({});
    h.instance.restore(g.state());
    expect(h.el('fn-status')?.textContent).toBe('Person 2 of 4');
    expect((h.el('fn-note') as HTMLInputElement).value).toBe('tall tree');
    expect(h.el(`fn-standout-${feature}`)?.getAttribute('aria-pressed')).toBe('true');
  });

  it('finishes once with a calm summary per person; a restored summary does not finish again', () => {
    const g = setup({ seed: 9 });
    typeNote(g.el('fn-note') as HTMLInputElement, 'my link');
    g.toTest();
    for (let i = 0; i < 12; i++) {
      g.click('fn-option-0');
      if (i === 11) expect(g.el('fn-continue')?.textContent).toBe('Show summary');
      g.click('fn-continue');
    }
    expect(g.state().phase).toBe('finished');
    expect(g.finished).toHaveLength(1);
    expect(g.finished[0]?.outcome).toBe('completed');
    expect(g.finished[0]?.stats?.total).toBe(12);
    expect(g.el('fn-summary')?.hidden).toBe(false);
    expect(g.el('fn-status')?.textContent).toBe('Session complete.');
    expect(g.el('fn-score')?.textContent).toMatch(/^Correct answers: \d+ of 12$/);
    expect(g.el('fn-summary-person-0')?.textContent).toContain('Your note: my link');
    expect(g.el('fn-summary-person-0')?.textContent).toMatch(/Name: (correct|not this time)/);
    expect(g.root.querySelectorAll('[data-testid^="fn-summary-person-"]').length).toBe(4);
    expect(g.root.textContent).not.toMatch(/\bbrain\b|\bIQ\b|great job|well done/i);
    g.click('fn-continue');
    expect(g.finished).toHaveLength(1);
    const h = setup({});
    h.instance.restore(g.state());
    expect(h.finished).toHaveLength(0);
    expect(h.el('fn-summary')?.hidden).toBe(false);
  });

  it('ignores number keys while typing a note or from outside the game', () => {
    const g = setup({ seed: 10 });
    g.toTest();
    const outside = document.createElement('button');
    document.body.append(outside);
    g.key('1', outside);
    const input = document.createElement('input');
    g.root.append(input);
    g.key('1', input);
    g.key('9');
    expect(g.state().answers).toEqual([]);
    g.key('', document.body, 'Numpad2');
    expect(g.state().answers).toEqual([1]);
    outside.remove();
  });

  it('moves between options with the arrow keys (roving tabindex)', () => {
    const g = setup({ seed: 11 });
    g.toTest();
    const first = g.el('fn-option-0') as HTMLButtonElement;
    first.focus();
    g.key('ArrowRight', first);
    expect(document.activeElement).toBe(g.el('fn-option-1'));
    expect((g.el('fn-option-1') as HTMLButtonElement).tabIndex).toBe(0);
    g.key('End', document.activeElement as HTMLElement);
    expect(document.activeElement).toBe(g.el('fn-option-3'));
    g.key('ArrowDown', document.activeElement as HTMLElement);
    expect(document.activeElement).toBe(g.el('fn-option-0'));
  });

  it('keeps the names of a session when the UI language changes, and uses the locale’s names for new sessions', () => {
    const g = setup({ seed: 12 });
    const saved = g.state();
    const h = setup({ locale: 'ja' });
    h.instance.restore(saved);
    expect(h.el('fn-name')?.textContent).toBe(saved.people[0]?.name);
    h.instance.newGame({ seed: 12 });
    expect(NAMES.ja).toContain(h.el('fn-name')?.textContent);
  });

  it('plays through in every UI language without missing keys, right-to-left in Arabic', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const g = setup({ seed: 13, locale, difficulty: 'hard' });
      expect(g.root.querySelector('.wp-fn')?.getAttribute('dir')).toBe(locale === 'ar' ? 'rtl' : 'ltr');
      typeNote(g.el('fn-note') as HTMLInputElement, 'x');
      g.root.querySelector<HTMLElement>('[data-testid^="fn-standout-"]')?.click();
      g.toTest();
      while (g.state().phase === 'test') {
        if (!g.el('fn-hint')?.hidden) g.click('fn-hint');
        g.click('fn-option-1');
        g.click('fn-continue');
      }
      expect(g.el('fn-summary')?.textContent?.length).toBeGreaterThan(100);
      expect(g.ctx.missingKeys, locale).toEqual([]);
      expect(g.root.textContent).not.toMatch(/\{[a-z]+\}/);
    }
  });
});
