// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { GameInstance } from '@wp/game-core';
import { SUPPORTED_LOCALES } from '@wp/localization';
import { createTestContext } from '@wp/testing';
import game from '../src/index';
import { DIFFICULTIES, FAMILIES, createInitialState, evaluate, ruleOf, type BlackBoxState, type FamilyId } from '../src/rules';

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

/** The defining formula of a linear rule, a·x + b. */
const linearFormula = (s: BlackBoxState) => `${s.params[0]}x + ${s.params[1]}`;

function openFormula(root: HTMLElement) {
  byId(root, 'bb-test').click();
  byId<HTMLInputElement>(root, 'bb-proof-formula').click();
}

function check(root: HTMLElement, text: string) {
  type(byId<HTMLInputElement>(root, 'bb-formula'), text);
  byId(root, 'bb-check-formula').click();
}

describe('Black Box formula proofs (view)', () => {
  it('offers predictions or a formula on the test step', () => {
    const { root, instance } = setup('linear');
    byId(root, 'bb-test').click();
    const predict = byId<HTMLInputElement>(root, 'bb-proof-predict');
    const formula = byId<HTMLInputElement>(root, 'bb-proof-formula');
    expect(byId(root, 'bb-proof').tagName).toBe('FIELDSET');
    expect(byId(root, 'bb-proof').querySelector('legend')!.textContent).toBe('How do you want to prove your hypothesis?');
    expect(predict.checked).toBe(true);
    expect(predict.type).toBe('radio');
    expect(predict.name).toBe(formula.name);
    expect(predict.closest('label')!.textContent).toBe('Predict outputs');
    expect(formula.closest('label')!.textContent).toBe('Enter the rule as a formula');
    expect(maybe(root, 'bb-submit')).toBeTruthy();
    expect(maybe(root, 'bb-formula')).toBeNull();

    formula.click();
    expect(instance.serialize().proofMode).toBe('formula');
    expect(byId(root, 'bb-challenge').dataset.mode).toBe('formula');
    expect(byId(root, 'bb-status').textContent).toBe('Enter the rule as a formula, then check it.');
    expect(byId<HTMLInputElement>(root, 'bb-proof-formula').checked).toBe(true);
    expect(maybe(root, 'bb-submit')).toBeNull();
    expect(byId(root, 'bb-check-formula').textContent).toBe('Check formula');
    const field = byId<HTMLInputElement>(root, 'bb-formula');
    expect(field.getAttribute('dir')).toBe('ltr');
    expect(field.getAttribute('maxlength')).toBe('200');
    expect(root.querySelector(`label[for="${field.id}"]`)!.textContent).toBe('Your formula');
    expect(field.getAttribute('aria-describedby')).toBe('bb-formula-error bb-formula-example');
    expect(root.querySelector('#bb-formula-example')!.textContent).toBe('Example: x mod 2 == 0 ? x / 2 : 3*x + 1');
    expect(byId(root, 'bb-formula-help').textContent).toContain('abs(a)');
    expect(byId(root, 'bb-formula-help').textContent).toContain('if c is true then a, otherwise b');
    // Focus stays on the chosen radio after the re-render.
    byId<HTMLInputElement>(root, 'bb-proof-predict').focus();
    byId<HTMLInputElement>(root, 'bb-proof-predict').click();
    expect(document.activeElement).toBe(byId(root, 'bb-proof-predict'));
    expect(maybe(root, 'bb-submit')).toBeTruthy();
  });

  it('shows parse errors with their position without counting them', () => {
    const { root, ctx, instance } = setup('linear');
    openFormula(root);
    const saves = ctx.saveRequests();
    check(root, '2x +');
    const error = byId(root, 'bb-formula-error');
    expect(error.hidden).toBe(false);
    expect(error.textContent).toBe('The formula is incomplete: something is missing at the end.');
    expect(byId(root, 'bb-formula').getAttribute('aria-invalid')).toBe('true');
    expect(instance.serialize().attempts).toBe(0);
    expect(instance.serialize().formula).toBe('2x +');
    expect(ctx.saveRequests()).toBe(saves + 1);
    check(root, '2 $ x');
    expect(byId(root, 'bb-formula-error').textContent).toBe('Position 3: the character “$” is not allowed.');
    check(root, 'max(x)');
    expect(byId(root, 'bb-formula-error').textContent).toBe('Position 1: wrong number of values for max(…). Expected: 2.');
    // Typing clears the error.
    type(byId<HTMLInputElement>(root, 'bb-formula'), 'max(x, 1)');
    expect(byId(root, 'bb-formula-error').hidden).toBe(true);
    expect(byId(root, 'bb-formula').getAttribute('aria-invalid')).toBe('false');
    expect(byId(root, 'bb-stats').dataset.tests).toBe('0');
  });

  it('reveals a counterexample for a wrong formula, then solves with a right one', async () => {
    const { root, ctx, instance } = setup('linear');
    const s = instance.serialize();
    openFormula(root);
    check(root, `${linearFormula(s)} + 1`);
    const after = instance.serialize();
    expect(after.attempts).toBe(1);
    expect(after.lastFormula).toEqual({ text: `${linearFormula(s)} + 1`, correct: false, input: [0] });
    expect(byId(root, 'bb-status').dataset.phase).toBe('testing');
    const truth = evaluate(ruleOf(s), [0]) as number;
    const fmt = (n: number) => String(n).replace('-', '−');
    expect(byId(root, 'bb-formula-verdict').textContent).toBe(`Not the hidden rule: for input 0 the box gives ${fmt(truth)}, your formula gives ${fmt(truth + 1)}.`);
    expect(byId(root, 'bb-formula-checked').textContent).toBe(`f(x) = ${linearFormula(s)} + 1`);
    expect(byId(root, 'bb-formula-result').querySelector('h4')!.textContent).toBe('Test 1: formula check');
    expect(rows(root)).toHaveLength(1);
    expect(byId(root, 'bb-log-row-0').dataset.source).toBe('test');
    expect(byId(root, 'bb-stats').dataset.tests).toBe('1');
    expect(byId<HTMLInputElement>(root, 'bb-formula').value).toBe(`${linearFormula(s)} + 1`);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(byId(root, 'bb-live').textContent).toBe(byId(root, 'bb-formula-verdict').textContent);

    // The same formula again is not counted.
    byId(root, 'bb-check-formula').click();
    expect(instance.serialize().attempts).toBe(1);
    expect(byId(root, 'bb-notice').textContent).toBe('You have already checked this formula. Change it first.');

    check(root, linearFormula(s));
    const done = instance.serialize();
    expect(done.solved).toBe(true);
    expect(byId(root, 'bb-status').dataset.phase).toBe('solved');
    expect(byId(root, 'bb-solved-formula').textContent).toBe(`Your formula: f(x) = ${linearFormula(s)}`);
    expect(byId(root, 'bb-rule').textContent).toMatch(/^The hidden rule: f\(x\) = /);
    expect(maybe(root, 'bb-formula-result')).toBeNull();
    expect(ctx.results).toEqual([{ outcome: 'won', stats: { experiments: 0, tests: 2, hints: 0 } }]);
    expect(document.activeElement).toBe(byId(root, 'bb-status'));
  });

  it('keeps the formula result visible after going back and drops it with the next test', () => {
    const { root, instance } = setup('square');
    const s = instance.serialize();
    openFormula(root);
    check(root, 'x^2');
    if (s.params[0] === 0) return; // x² itself would be right; the seeded rule has c ≠ 0.
    byId(root, 'bb-back').click();
    expect(byId(root, 'bb-formula-result')).toBeTruthy();
    byId(root, 'bb-test').click();
    expect(maybe(root, 'bb-formula-result')).toBeNull();
    // The choice and the text are kept for the next test.
    expect(byId<HTMLInputElement>(root, 'bb-formula').value).toBe('x^2');
  });

  it('uses the logic syntax for bit rules', () => {
    const { root, instance } = setup('gate');
    openFormula(root);
    expect(root.querySelector('#bb-formula-example')!.textContent).toBe('Example: (b1 and not b2) or b3');
    expect(byId(root, 'bb-formula-help').textContent).toContain('b1 … b4');
    check(root, 'b1 + b2');
    expect(byId(root, 'bb-formula-error').textContent).toBe('Position 4: “+” does not fit here.');
    check(root, 'b1 and not b1');
    expect(instance.serialize().attempts).toBe(1);
    expect(byId(root, 'bb-formula-checked').textContent).toBe('f = b1 and not b1');
  });

  it('explains that list rules are proven by predictions only', () => {
    const { root } = setup('sorttake');
    byId(root, 'bb-test').click();
    expect(maybe(root, 'bb-proof')).toBeNull();
    expect(byId(root, 'bb-proof-note').textContent).toBe('For this rule, predict outputs: list rules cannot be entered as a formula.');
    expect(maybe(root, 'bb-submit')).toBeTruthy();
  });

  it('restores the chosen mode and the typed formula', () => {
    const { root, instance } = setup('pairproduct');
    openFormula(root);
    type(byId<HTMLInputElement>(root, 'bb-formula'), 'x*y + ');
    const saved = instance.serialize();
    expect(saved.formula).toBe('x*y + ');
    const ctx2 = createTestContext(game as never);
    const restored = game.create(ctx2.context);
    running.push(restored);
    restored.restore(saved);
    expect(byId<HTMLInputElement>(ctx2.context.root, 'bb-formula').value).toBe('x*y + ');
    expect(byId<HTMLInputElement>(ctx2.context.root, 'bb-proof-formula').checked).toBe(true);
    expect(restored.serialize()).toEqual(saved);
  });

  it('restores a save from before formula proofs', () => {
    const { instance } = setup('linear');
    const ctx2 = createTestContext(game as never);
    const restored = game.create(ctx2.context);
    running.push(restored);
    const old: Record<string, unknown> = { ...instance.serialize() };
    delete old.proofMode;
    delete old.formula;
    delete old.lastFormula;
    expect(game.isValidState(old)).toBe(true);
    restored.restore(old as unknown as BlackBoxState);
    byId(ctx2.context.root, 'bb-test').click();
    expect(byId<HTMLInputElement>(ctx2.context.root, 'bb-proof-predict').checked).toBe(true);
    byId<HTMLInputElement>(ctx2.context.root, 'bb-proof-formula').click();
    expect(byId<HTMLInputElement>(ctx2.context.root, 'bb-formula').value).toBe('');
  });

  it('ignores the formula controls while paused', () => {
    const { root, instance } = setup('linear');
    openFormula(root);
    instance.pause();
    const before = instance.serialize();
    type(byId<HTMLInputElement>(root, 'bb-formula'), 'x');
    byId(root, 'bb-check-formula').click();
    byId<HTMLInputElement>(root, 'bb-proof-predict').click();
    expect(instance.serialize()).toEqual(before);
  });

  it('renders the formula panel in every locale without missing keys', () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const family of ['linear', 'pairselect', 'majority'] as const) {
        const { root, ctx, instance } = setup(family, locale);
        openFormula(root);
        check(root, '(');
        expect(byId(root, 'bb-formula-error').textContent!.length).toBeGreaterThan(5);
        const s = instance.serialize();
        check(root, FAMILIES[family].output === 'bool' ? '1 xor b1' : 'x + 1000');
        expect(instance.serialize().attempts).toBe(1);
        expect(byId(root, 'bb-formula-verdict').textContent).not.toMatch(/[{}]/);
        expect(byId(root, 'bb-formula-help').textContent).not.toMatch(/[{}]/);
        const example = root.querySelector('#bb-formula-example')!.textContent!;
        expect(example).not.toMatch(/[{}]/);
        expect(example.includes(String.fromCharCode(0))).toBe(false);
        void s;
        expect(ctx.missingKeys).toEqual([]);
      }
      const { root, ctx } = setup('filterref', locale);
      byId(root, 'bb-test').click();
      expect(byId(root, 'bb-proof-note').textContent!.length).toBeGreaterThan(5);
      expect(ctx.missingKeys).toEqual([]);
    }
  }, 90_000);

  it('keeps notation left-to-right in Arabic', () => {
    const { root, instance } = setup('linear', 'ar');
    openFormula(root);
    expect(root.querySelector('.wp-black-box')!.getAttribute('dir')).toBe('rtl');
    expect(byId(root, 'bb-formula').getAttribute('dir')).toBe('ltr');
    expect(root.querySelector('.bb-formula-row')!.getAttribute('dir')).toBe('ltr');
    expect(root.querySelector('#bb-formula-example .bb-notation')!.getAttribute('dir')).toBe('ltr');
    check(root, linearFormula(instance.serialize()));
    expect(byId(root, 'bb-solved-formula').querySelector('[dir="ltr"]')!.textContent).toBe(`f(x) = ${linearFormula(instance.serialize())}`);
  });
});
