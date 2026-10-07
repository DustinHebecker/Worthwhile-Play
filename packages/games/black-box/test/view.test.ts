// @ts-nocheck
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { GameInstance } from '@wp/game-core';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { DIFFICULTIES, createInitialState, evaluate, ruleOf, type BlackBoxState, type FamilyId } from '../src/rules';

let running: GameInstance<BlackBoxState>[] = [];
afterEach(() => {
  for (const instance of running) instance.dispose();
  running = [];
  document.body.innerHTML = '';
});

function seedFor(family: FamilyId): { seed: number; difficulty: string } {
  for (let seed = 1; seed < 5000; seed++) {
    for (const difficulty of DIFFICULTIES) if (createInitialState(seed, difficulty).family === family) return { seed, difficulty };
  }
  throw new Error(`no seed for ${family}`);
}

function setup(family: FamilyId = 'linear', locale: Parameters<typeof createTestContext>[1] = 'en') {
  const ctx = createTestContext(game as never, locale);
  const instance = game.create(ctx.context);
  running.push(instance);
  instance.newGame(seedFor(family));
  return { ctx, instance, root: ctx.context.root };
}

const byId = <T extends HTMLElement = HTMLElement>(root: HTMLElement, id: string) => {
  const el = root.querySelector<T>(`[data-testid="${id}"]`);
  if (!el) throw new Error(`missing ${id}`);
  return el;
};
const maybe = (root: HTMLElement, id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
const type = (field: HTMLInputElement, value: string) => {
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
};
const rows = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>('[data-testid^="bb-log-row-"]')];

/** Fills every prediction with the true output (or a wrong one for `wrong` indices). */
function predictAll(root: HTMLElement, state: BlackBoxState, wrong: readonly number[] = []) {
  state.challenge!.inputs.forEach((input, i) => {
    const out = evaluate(ruleOf(state), input);
    const isWrong = wrong.includes(i);
    if (typeof out === 'number' && state.family.match(/gate|majority/)) {
      byId(root, `bb-predict-${i}-${isWrong ? 1 - out : out}`).click();
    } else if (typeof out === 'number') {
      type(byId<HTMLInputElement>(root, `bb-predict-${i}`), String(isWrong ? out + 1 : out));
    } else {
      type(byId<HTMLInputElement>(root, `bb-predict-${i}`), isWrong ? (out.length ? '' : '0') : out.join(' '));
    }
  });
}

describe('Black Box view', () => {
  it('renders the domain, an empty log and the experiment panel', () => {
    const { root } = setup('linear');
    expect(byId(root, 'bb-domain').textContent).toBe('Input: a whole number x from 0 to 20. Output: a whole number.');
    expect(byId(root, 'bb-status').dataset.phase).toBe('experimenting');
    expect(byId(root, 'bb-log-empty')).toBeTruthy();
    expect(byId<HTMLInputElement>(root, 'bb-input-0').value).toBe('0');
    expect(byId(root, 'bb-input').getAttribute('role')).toBe('group');
    expect(byId(root, 'bb-stats').textContent).toBe('Experiments: 0 · Hypothesis tests: 0');
    expect(byId(root, 'bb-dec-0').getAttribute('aria-label')).toBe('Decrease x');
  });

  it('runs experiments into the log and refuses duplicates', () => {
    const { root, ctx, instance } = setup('square');
    const s = instance.serialize();
    type(byId<HTMLInputElement>(root, 'bb-input-0'), '4');
    expect(ctx.saveRequests()).toBe(1);
    byId(root, 'bb-run').click();
    expect(rows(root)).toHaveLength(1);
    const expected = evaluate(ruleOf(s), [4]) as number;
    expect(byId(root, 'bb-log-row-0').dataset.input).toBe('4');
    expect(byId(root, 'bb-log-row-0').dataset.output).toBe(String(expected));
    expect(byId(root, 'bb-notice').textContent).toBe(`Input 4 gives ${String(expected).replace('-', '−')}.`);
    expect(ctx.saveRequests()).toBe(2);
    byId(root, 'bb-run').click();
    expect(rows(root)).toHaveLength(1);
    expect(byId(root, 'bb-notice').textContent).toContain('Already in the log, row 1');
    expect(byId(root, 'bb-log-row-0').classList.contains('is-highlight')).toBe(true);
    expect(ctx.saveRequests()).toBe(2);
    byId(root, 'bb-inc-0').click();
    expect(byId<HTMLInputElement>(root, 'bb-input-0').value).toBe('5');
    byId(root, 'bb-dec-0').click();
    byId(root, 'bb-dec-0').click();
    expect(instance.serialize().draft).toEqual([3]);
    expect(byId(root, 'bb-stats').textContent).toBe('Experiments: 1 · Hypothesis tests: 0');
  });

  it('blocks running while a field holds an invalid number', () => {
    const { root, instance } = setup('mod');
    type(byId<HTMLInputElement>(root, 'bb-input-0'), '25');
    expect(byId(root, 'bb-input-0').getAttribute('aria-invalid')).toBe('true');
    byId(root, 'bb-run').click();
    expect(rows(root)).toHaveLength(0);
    expect(byId(root, 'bb-notice').textContent).toBe('Enter whole numbers from 0 to 20.');
    expect(instance.serialize().draft).toEqual([0]);
  });

  it('submits the experiment form with Enter', () => {
    const { root } = setup('linear');
    const form = byId<HTMLFormElement>(root, 'bb-experiment');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(rows(root)).toHaveLength(1);
  });

  it('toggles bits for boolean rules', () => {
    const { root, instance } = setup('majority');
    expect(byId(root, 'bb-domain').textContent).toBe('Input: 4 bits, each 0 or 1. Output: 0 or 1.');
    const bit = byId(root, 'bb-input-2');
    expect(bit.getAttribute('aria-pressed')).toBe('false');
    expect(bit.getAttribute('aria-label')).toBe('Bit b3');
    bit.click();
    expect(byId(root, 'bb-input-2').getAttribute('aria-pressed')).toBe('true');
    expect(byId(root, 'bb-input-2').textContent).toBe('1');
    expect(instance.serialize().draft).toEqual([0, 0, 1, 0]);
    byId(root, 'bb-run').click();
    expect(byId(root, 'bb-log-row-0').dataset.input).toBe('0,0,1,0');
  });

  it('edits list inputs element by element', () => {
    const { root, instance } = setup('filterconst');
    expect(root.querySelectorAll('[data-testid^="bb-input-"]')).toHaveLength(5);
    type(byId<HTMLInputElement>(root, 'bb-input-3'), '8');
    expect(instance.serialize().draft[3]).toBe(8);
    byId(root, 'bb-run').click();
    expect(byId(root, 'bb-log-row-0').dataset.input).toBe(instance.serialize().draft.join(','));
  });

  it('runs a failed hypothesis test, reveals outputs and allows another one', () => {
    const { root, ctx, instance } = setup('affinemod');
    byId(root, 'bb-run').click();
    byId(root, 'bb-test').click();
    expect(byId(root, 'bb-status').dataset.phase).toBe('testing');
    expect(maybe(root, 'bb-run')).toBeNull();
    const s = instance.serialize();
    const n = s.challenge!.inputs.length;
    expect(root.querySelectorAll('[data-testid^="bb-challenge-"]')).toHaveLength(n);
    expect(byId(root, 'bb-predict-0').getAttribute('aria-label')).toBe(`Prediction for input ${s.challenge!.inputs[0]![0]}`);
    byId(root, 'bb-submit').click();
    expect(byId(root, 'bb-notice').textContent).toBe('Enter a prediction for every input first.');
    predictAll(root, s, [1]);
    byId(root, 'bb-submit').click();
    expect(ctx.results).toEqual([]);
    expect(byId(root, 'bb-status').dataset.phase).toBe('experimenting');
    expect(byId(root, 'bb-attempt-row-1').dataset.correct).toBe('false');
    expect(byId(root, 'bb-attempt-row-0').dataset.correct).toBe('true');
    expect(byId(root, 'bb-attempt').textContent).toContain(`Test 1: ${n - 1} of ${n} predictions right.`);
    expect(rows(root)).toHaveLength(1 + n);
    expect(rows(root).slice(1).every((r) => r.dataset.source === 'test')).toBe(true);
    expect(byId(root, 'bb-stats').textContent).toBe('Experiments: 1 · Hypothesis tests: 1');
    byId(root, 'bb-test').click();
    expect(maybe(root, 'bb-attempt')).toBeNull();
  });

  it('solves with correct predictions and reports once', () => {
    const { root, ctx, instance } = setup('linear');
    byId(root, 'bb-hint').click();
    expect(byId(root, 'bb-hint-text').textContent).toBe('Kind of rule: Linear function: f(x) = a·x + b');
    byId(root, 'bb-test').click();
    predictAll(root, instance.serialize());
    byId(root, 'bb-submit').click();
    expect(byId(root, 'bb-status').dataset.phase).toBe('solved');
    expect(byId(root, 'bb-rule').textContent).toMatch(/^The hidden rule: f\(x\) = /);
    expect(ctx.results).toEqual([{ outcome: 'won', stats: { experiments: 0, tests: 1, hints: 1 } }]);
    const saved = instance.serialize();

    const ctx2 = createTestContext(game as never);
    const restored = game.create(ctx2.context);
    running.push(restored);
    restored.restore(saved);
    expect(ctx2.results).toEqual([]);
    expect(byId(ctx2.context.root, 'bb-status').dataset.phase).toBe('solved');
    expect(restored.serialize()).toEqual(saved);
  });

  it('handles boolean and list predictions', () => {
    for (const family of ['gate', 'sorttake'] as const) {
      const { root, ctx, instance } = setup(family);
      byId(root, 'bb-test').click();
      const s = instance.serialize();
      predictAll(root, s);
      byId(root, 'bb-submit').click();
      expect(ctx.results).toHaveLength(1);
      expect(instance.serialize().solved).toBe(true);
    }
  });

  it('treats an empty list field as the empty list on submit', () => {
    const { root, instance } = setup('filterconst');
    byId(root, 'bb-test').click();
    const s = instance.serialize();
    s.challenge!.inputs.forEach((input, i) => {
      type(byId<HTMLInputElement>(root, `bb-predict-${i}`), '');
      void input;
    });
    expect(instance.serialize().challenge!.predictions.every((p) => p === null)).toBe(true);
    byId(root, 'bb-submit').click();
    const after = instance.serialize();
    expect(after.attempts).toBe(1);
    expect(after.lastAttempt!.predictions.every((p) => Array.isArray(p) && p.length === 0)).toBe(true);
  });

  it('marks invalid list text and keeps it unanswered', () => {
    const { root, instance } = setup('sorttake');
    byId(root, 'bb-test').click();
    type(byId<HTMLInputElement>(root, 'bb-predict-0'), '1 2 x');
    expect(byId(root, 'bb-predict-0').getAttribute('aria-invalid')).toBe('true');
    expect(instance.serialize().challenge!.predictions[0]).toBeNull();
    type(byId<HTMLInputElement>(root, 'bb-predict-0'), '1 2');
    expect(instance.serialize().challenge!.predictions[0]).toEqual([1, 2]);
  });

  it('goes back to experimenting without counting the test', () => {
    const { root, instance } = setup('step');
    byId(root, 'bb-test').click();
    byId(root, 'bb-back').click();
    expect(instance.serialize().challenge).toBeNull();
    expect(instance.serialize().attempts).toBe(0);
    expect(maybe(root, 'bb-run')).toBeTruthy();
  });

  it('restores an open test with its typed predictions', () => {
    const { root, instance } = setup('pairselect');
    byId(root, 'bb-input-1').click();
    byId(root, 'bb-test').click();
    type(byId<HTMLInputElement>(root, 'bb-predict-0'), '4');
    const saved = instance.serialize();
    const ctx2 = createTestContext(game as never);
    const restored = game.create(ctx2.context);
    running.push(restored);
    restored.restore(saved);
    expect(byId<HTMLInputElement>(ctx2.context.root, 'bb-predict-0').value).toBe('4');
    expect(restored.serialize()).toEqual(saved);
  });

  it('ignores input while paused and resets to the seeded start', () => {
    const { root, instance } = setup('linear');
    const initial = instance.serialize();
    instance.pause();
    byId(root, 'bb-run').click();
    byId(root, 'bb-test').click();
    expect(instance.serialize()).toEqual(initial);
    instance.resume();
    byId(root, 'bb-run').click();
    expect(rows(root)).toHaveLength(1);
    instance.reset();
    expect(instance.serialize()).toEqual(initial);
    expect(rows(root)).toHaveLength(0);
  });

  it('starts a fresh game on newGame and uses the difficulty', () => {
    const { root, instance } = setup('linear');
    byId(root, 'bb-run').click();
    instance.newGame({ seed: 4, difficulty: 'hard' });
    expect(instance.serialize()).toEqual(createInitialState(4, 'hard'));
    expect(rows(root)).toHaveLength(0);
    instance.newGame({ seed: 4, difficulty: 'unknown' });
    expect(instance.serialize().difficulty).toBe('easy');
  });

  it('renders right-to-left for Arabic with notation kept left-to-right', () => {
    const { root } = setup('pairproduct', 'ar');
    const container = root.querySelector<HTMLElement>('.wp-black-box')!;
    expect(container.getAttribute('dir')).toBe('rtl');
    expect(byId(root, 'bb-input').getAttribute('dir')).toBe('ltr');
    expect(byId(root, 'bb-run').textContent).toBe('أجرِ التجربة');
  });
});
