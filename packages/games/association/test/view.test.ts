// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { GameContext, GameInstance, GameModule, GameResult } from '@wp/game-core';
import { findWord } from '@wp/learning-content';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { answerOf, cueOf, countOf, newRound, type AssociationState, type Question } from '../src/rules';

const instances: GameInstance<AssociationState>[] = [];

function setup(options: { seed?: number; difficulty?: string; locale?: 'en' | 'ar' | 'de' } = {}) {
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
  if (options.seed !== undefined) instance.newGame({ seed: options.seed, ...(options.difficulty ? { difficulty: options.difficulty } : {}) });
  return { ctx, context, instance, root, el, click, key, state, finished };
}

const typeNote = (input: HTMLInputElement, text: string) => {
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

afterEach(() => {
  for (const instance of instances.splice(0)) instance.dispose();
});

describe('Vivid Links view', () => {
  it('shows the first pair with pictures and names; Next is the autofocus control; nothing advances on its own', () => {
    const g = setup({ seed: 1 });
    const s = g.state();
    const [a, b] = s.pairs[0] as [string, string];
    expect(g.el('as-learn')?.hidden).toBe(false);
    expect(g.el('as-recall')?.hidden).toBe(true);
    expect(g.el('as-status')?.textContent).toBe('Pair 1 of 5');
    expect(g.el('as-item-a')?.dataset.item).toBe(a);
    expect(g.el('as-item-b')?.dataset.item).toBe(b);
    expect(g.el('as-item-a')?.getAttribute('aria-label')).toBe(findWord(a)?.words.en);
    expect(g.el('as-item-a')?.textContent).toContain(findWord(a)?.emoji);
    expect(g.el('as-pair')?.getAttribute('aria-label')).toBe(`${findWord(a)?.words.en} and ${findWord(b)?.words.en}`);
    expect(g.el('as-next')?.hasAttribute('data-autofocus')).toBe(true);
    expect((g.el('as-back') as HTMLButtonElement).disabled).toBe(true);
    expect(g.el('as-next')?.textContent).toBe('Next pair');
    expect(g.state()).toEqual(s);
  });

  it('pages through pairs, keeps a note per pair (sanitized) and saves every change', () => {
    const g = setup({ seed: 2 });
    const note = g.el<HTMLInputElement>('as-note') as HTMLInputElement;
    const saves = g.ctx.saveRequests();
    typeNote(note, 'the dog\treads the book');
    expect(g.state().notes[0]).toBe('the dog reads the book');
    expect(g.ctx.saveRequests()).toBe(saves + 1);
    g.click('as-next');
    expect(g.el('as-pair')?.dataset.index).toBe('1');
    expect(note.value).toBe('');
    expect((g.el('as-back') as HTMLButtonElement).disabled).toBe(false);
    g.click('as-back');
    expect(note.value).toBe('the dog reads the book');
    expect(g.ctx.saveRequests()).toBe(saves + 3);
    for (let i = 0; i < 4; i++) g.click('as-next');
    expect(g.el('as-next')?.textContent).toBe('Done learning');
  });

  it('Enter in the note field goes to the next pair; number keys in the note field are just text', () => {
    const g = setup({ seed: 3 });
    const note = g.el<HTMLInputElement>('as-note') as HTMLInputElement;
    note.focus();
    g.key('1', note, 'Digit1');
    expect(g.state().index).toBe(0);
    g.key('Enter', note);
    expect(g.state().index).toBe(1);
  });

  it('the name toggle hides the visible names (labels stay) and is remembered as a preference', () => {
    const g = setup({ seed: 4 });
    const box = g.el<HTMLInputElement>('as-names') as HTMLInputElement;
    expect(box.checked).toBe(true);
    box.click();
    expect(g.root.querySelector('.wp-assoc')?.classList.contains('wp-assoc--no-names')).toBe(true);
    expect(g.ctx.preferences.get('names')).toBe(false);
    expect(g.el('as-item-a')?.getAttribute('aria-label')).toBeTruthy();
    // A new instance on the same device starts with names hidden.
    const second = game.create(g.context);
    instances.push(second);
    second.newGame({ seed: 4 });
    expect(g.root.querySelector<HTMLInputElement>('[data-testid="as-names"]')?.checked).toBe(false);
  });

  it('medium: counting breaks by number keys, then recall answered by number keys and arrow keys', () => {
    const g = setup({ seed: 5, difficulty: 'medium' });
    for (let i = 0; i < 8; i++) g.click('as-next');
    expect(g.el('as-filler')?.hidden).toBe(false);
    expect(g.el('as-status')?.textContent).toBe('Break 1 of 2');
    const s = g.state();
    const first = s.fillers[0];
    expect(g.el('as-filler-question')?.textContent).toBe(`How many ${first?.target}s do you see?`);
    expect(g.root.querySelectorAll('.wp-assoc__shape')).toHaveLength(10);
    expect(g.el('as-filler-shapes')?.getAttribute('aria-label')).toBe(`Shapes: ${first?.shapes.join(', ')}`);
    g.key(String(countOf(first!)), document.body, `Digit${countOf(first!)}`);
    expect(g.state().fillerAnswers).toEqual([countOf(first!)]);
    g.key('9', document.body, 'Digit9');
    expect(g.state().fillerAnswers).toHaveLength(1);
    g.click('as-count-2');
    expect(g.state().phase).toBe('recall');

    // Recall: the cue and the options as stored.
    const q = g.state().questions[0] as Question;
    expect(g.el('as-cue')?.dataset.item).toBe(cueOf(s, q));
    expect([...g.root.querySelectorAll<HTMLElement>('[data-testid^="as-option-"]')].map((b) => b.dataset.item)).toEqual(q.options);
    expect(g.el('as-option-0')?.getAttribute('aria-label')).toBe(`1: ${findWord(q.options[0] as string)?.words.en}`);
    g.key('3', document.body, 'Digit3');
    expect(g.state().answers).toEqual([q.options[2]]);
    // Keys beyond the options do nothing.
    g.key('5', document.body, 'Digit5');
    expect(g.state().answers).toHaveLength(1);
    // Arrow keys move focus (roving tabindex, wraps), Enter/click chooses the focused option.
    const opt0 = g.el('as-option-0') as HTMLButtonElement;
    opt0.focus();
    g.key('ArrowDown', opt0);
    expect(document.activeElement).toBe(g.el('as-option-1'));
    expect(g.el('as-option-1')?.tabIndex).toBe(0);
    expect(opt0.tabIndex).toBe(-1);
    g.key('ArrowUp', document.activeElement as HTMLElement);
    g.key('ArrowUp', document.activeElement as HTMLElement);
    expect(document.activeElement).toBe(g.el('as-option-3'));
    g.key('Home', document.activeElement as HTMLElement);
    expect(document.activeElement).toBe(g.el('as-option-0'));
    g.key('End', document.activeElement as HTMLElement);
    expect(document.activeElement).toBe(g.el('as-option-3'));
    const q2 = g.state().questions[1] as Question;
    (document.activeElement as HTMLButtonElement).click();
    expect(g.state().answers[1]).toBe(q2.options[3]);
    // After answering, focus moves to the first option of the next question.
    expect(document.activeElement).toBe(g.el('as-option-0'));
  });

  it('ignores keys from host controls and with modifiers', () => {
    const g = setup({ seed: 6 });
    for (let i = 0; i < 5; i++) g.click('as-next');
    const outside = document.createElement('button');
    document.body.append(outside);
    g.key('1', outside, 'Digit1');
    expect(g.state().answers).toEqual([]);
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: '1', code: 'Digit1', ctrlKey: true, bubbles: true }));
    expect(g.state().answers).toEqual([]);
    g.key('1', document.body, 'Numpad1');
    expect(g.state().answers).toHaveLength(1);
    outside.remove();
  });

  it('finishes once with a neutral summary that shows the pairs, the choices and the notes', () => {
    const g = setup({ seed: 7 });
    typeNote(g.el<HTMLInputElement>('as-note') as HTMLInputElement, 'my scene');
    for (let i = 0; i < 5; i++) g.click('as-next');
    const s = g.state();
    // Right on every question but the first.
    s.questions.forEach((q, i) => {
      const answer = answerOf(s, q);
      const choice = i === 0 ? q.options.findIndex((o) => o !== answer) : q.options.indexOf(answer);
      g.click(`as-option-${choice}`);
    });
    expect(g.finished).toEqual([{ outcome: 'completed', stats: { correct: 4, total: 5 } }]);
    expect(g.el('as-summary')?.hidden).toBe(false);
    expect(g.el('as-score')?.textContent).toBe('Pairs recalled: 4 of 5');
    expect(g.el('as-status')?.textContent).toBe('Round complete.');
    const wrongPair = (s.questions[0] as Question).pair;
    const wrongRow = g.el(`as-summary-pair-${wrongPair}`) as HTMLElement;
    expect(wrongRow.dataset.recalled).toBe('false');
    expect(wrongRow.textContent).toContain('✗');
    expect(wrongRow.textContent).toContain('Your choice:');
    const rightRow = g.el(`as-summary-pair-${(s.questions[1] as Question).pair}`) as HTMLElement;
    expect(rightRow.textContent).toContain('✓');
    expect(rightRow.textContent).toContain('Recalled');
    expect(g.el('as-summary-pair-0')?.textContent).toContain('Your note: my scene');
    expect(g.el('as-summary-pair-1')?.textContent).not.toContain('Your note');
    expect(g.el('as-summary')?.textContent).toContain('About the technique');
    // Restoring the finished round shows the summary again without finishing twice.
    const h2 = setup();
    h2.instance.restore(g.state());
    expect(h2.finished).toEqual([]);
    expect(h2.el('as-score')?.textContent).toBe('Pairs recalled: 4 of 5');
  });

  it('restores mid-recall at the same question with the same options', () => {
    const g = setup({ seed: 8, difficulty: 'hard' });
    for (let i = 0; i < 12; i++) g.click('as-next');
    for (let i = 0; i < 3; i++) g.click('as-count-3');
    g.click('as-option-0');
    g.click('as-option-1');
    const saved = g.state();
    const h2 = setup();
    h2.instance.restore(JSON.parse(JSON.stringify(saved)) as AssociationState);
    expect(h2.state()).toEqual(saved);
    expect(h2.el('as-status')?.textContent).toBe('Question 3 of 12');
    const q = saved.questions[2] as Question;
    expect(h2.el('as-cue')?.dataset.item).toBe(cueOf(saved, q));
    expect([...h2.root.querySelectorAll<HTMLElement>('[data-testid^="as-option-"]')].map((b) => b.dataset.item)).toEqual(q.options);
  });

  it('restores mid-learning at the same pair with the note', () => {
    const g = setup({ seed: 9 });
    g.click('as-next');
    typeNote(g.el<HTMLInputElement>('as-note') as HTMLInputElement, 'note two');
    const h2 = setup();
    h2.instance.restore(g.state());
    expect(h2.el('as-pair')?.dataset.index).toBe('1');
    expect(h2.el<HTMLInputElement>('as-note')?.value).toBe('note two');
  });

  it('New game on a used instance starts a fresh round; reset returns to the seeded start', () => {
    const g = setup({ seed: 10 });
    typeNote(g.el<HTMLInputElement>('as-note') as HTMLInputElement, 'x');
    g.click('as-next');
    g.instance.newGame({ seed: 11, difficulty: 'medium' });
    expect(g.state()).toEqual(newRound(11, 'medium'));
    expect(g.el<HTMLInputElement>('as-note')?.value).toBe('');
    g.click('as-next');
    g.instance.reset();
    expect(g.state()).toEqual(newRound(11, 'medium'));
    expect(g.el('as-pair')?.dataset.index).toBe('0');
  });

  it('uses the UI language for names and RTL in Arabic', () => {
    const g = setup({ seed: 12, locale: 'ar' });
    const [a] = g.state().pairs[0] as [string, string];
    expect(g.root.querySelector('.wp-assoc')?.getAttribute('dir')).toBe('rtl');
    expect(g.el('as-item-a')?.getAttribute('aria-label')).toBe(findWord(a)?.words.ar);
    const de = setup({ seed: 12, locale: 'de' });
    expect(de.el('as-item-a')?.getAttribute('aria-label')).toBe(findWord(a)?.words.de);
  });

  it('in RTL, ArrowLeft moves to the next option', () => {
    const g = setup({ seed: 13, locale: 'ar' });
    for (let i = 0; i < 5; i++) g.click('as-next');
    const opt0 = g.el('as-option-0') as HTMLButtonElement;
    opt0.focus();
    g.key('ArrowLeft', opt0);
    expect(document.activeElement).toBe(g.el('as-option-1'));
    g.key('ArrowRight', document.activeElement as HTMLElement);
    expect(document.activeElement).toBe(opt0);
  });
});
