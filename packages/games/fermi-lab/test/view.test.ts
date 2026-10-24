// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createTestContext } from '@wp/testing';
import type { GameModule } from '@wp/game-core';
import game from '../src/index';
import { commitGuess, createInitial, currentQuestion, taskOf, type FermiState } from '../src/rules';

const module = game as GameModule<unknown>;

beforeAll(async () => {
  for (const locale of ['en', 'de', 'ar', 'ja']) await game.preload!(locale);
});

afterEach(() => {
  document.body.innerHTML = '';
});

function mount(state: FermiState, locale: 'en' | 'de' | 'ar' | 'ja' = 'en') {
  const ctx = createTestContext(module, locale);
  const finished: unknown[] = [];
  const context = { ...ctx.context, finished: (r: unknown) => finished.push(r) };
  const instance = game.create(context);
  instance.restore(state);
  const root = ctx.context.root;
  const q = (id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  const click = (id: string) => q(id)!.click();
  const type = (id: string, value: string) => {
    const field = q(id) as HTMLInputElement;
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const state_ = () => instance.serialize() as FermiState;
  return { ctx, instance, root, q, click, type, finished, state: state_ };
}

describe('view', () => {
  it('plays a guided round through the DOM: guess, model, review, summary; finished once', () => {
    const m = mount(createInitial(21, { difficulty: 'easy', model: 'guided' }));
    for (let i = 0; i < 5; i++) {
      const task = taskOf(currentQuestion(m.state())!);
      expect(m.q('fl-question')!.dataset.task).toBe(task.id);
      m.type('fl-est-input', String(task.answer.central));
      expect(m.q('fl-est-value')?.dataset.value).toBe(String(task.answer.central));
      m.click('fl-guess');
      expect(m.root.querySelector('.wp-fermi-lab')!.getAttribute('data-phase')).toBe('model');
      // Fill every open row with the reference value: the model reproduces the reference product.
      task.factors.forEach((x, k) => {
        if (!x.fixed) m.type(`fl-row-${k}-input`, String(x.value));
      });
      expect(m.q('fl-product')!.dataset.status).toBe('ok');
      m.click('fl-use-model');
      expect(m.q('fl-verdict')!.dataset.band).toBe('x2');
      expect(m.q('fl-sensitivity')).not.toBeNull();
      expect(m.q('fl-sources')!.textContent!.length).toBeGreaterThan(10);
      m.click(i < 4 ? 'fl-next' : 'fl-summary');
    }
    expect(m.q('fl-summary-list')!.children).toHaveLength(5);
    expect(m.finished).toHaveLength(1);
    expect(m.finished[0]).toMatchObject({ outcome: 'completed', stats: { questions: 5, withinFactor3: 5, modelsUsed: 5 } });
    // A restored summary never reports a second end.
    const again = mount(m.state());
    expect(again.finished).toHaveLength(0);
    expect(m.ctx.saveRequests()).toBeGreaterThan(0);
  });

  it('keeps the first guess when asked and refuses an incomplete model', () => {
    const m = mount(createInitial(4));
    m.click('fl-guess'); // nothing typed: no commit
    expect(m.state().questions[0]!.phase).toBe('estimate');
    m.type('fl-est-input', '12');
    m.click('fl-est-exp-plus');
    expect(m.state().questions[0]!.draftExp).toBe(1);
    m.click('fl-guess');
    expect(m.state().questions[0]!.firstGuess).toBe(120);
    expect(m.q('fl-use-model')!.getAttribute('aria-disabled')).toBe('true');
    m.click('fl-use-model');
    expect(m.state().questions[0]!.phase).toBe('model');
    m.click('fl-keep-guess');
    expect(m.state().questions[0]).toMatchObject({ phase: 'review', answer: 120, modelUsed: false });
    expect(m.q('fl-answer')!.dataset.value).toBe('120');
    expect(m.q('fl-compare')!.textContent).not.toContain('not in your model');
  });

  it('step buttons, the slider and Enter edit and commit the estimate', () => {
    const m = mount(createInitial(9));
    m.type('fl-est-input', '3');
    m.click('fl-est-mul2');
    expect((m.q('fl-est-input') as HTMLInputElement).value).toBe('6');
    m.click('fl-est-mul10');
    expect(m.state().questions[0]!.draftExp).toBe(1);
    m.click('fl-est-div2');
    m.click('fl-est-div10');
    expect(m.q('fl-est-value')!.dataset.value).toBe('3');
    const slider = m.q('fl-est-slider') as HTMLInputElement;
    slider.value = String(Number(slider.min) + 4);
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    const expected = 10 ** (Number(slider.min) + 4);
    expect(Number(m.q('fl-est-value')!.dataset.value) / expected).toBeCloseTo(1, 5);
    m.q('fl-est-input')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(m.state().questions[0]!.phase).toBe('model');
  });

  it('moves the power of ten to the stepper when doubling would overflow the field (the saved draft is cut at 32 characters)', () => {
    const m = mount(createInitial(9));
    m.type('fl-est-input', '5e31');
    for (let i = 0; i < 6; i++) m.click('fl-est-exp-minus');
    m.click('fl-est-mul2');
    expect(Number(m.q('fl-est-value')!.dataset.value) / 1e26).toBeCloseTo(1, 9);
    expect(m.state().questions[0]!).toMatchObject({ draft: '1', draftExp: 26 });
    const r = mount(m.state());
    expect(Number(r.q('fl-est-value')!.dataset.value) / 1e26).toBeCloseTo(1, 9);
  });

  it('restores a half-typed estimate and a half-built model', () => {
    const m = mount(createInitial(13));
    m.type('fl-est-input', '4,5');
    const saved = m.state();
    const r = mount(saved, 'de');
    expect((r.q('fl-est-input') as HTMLInputElement).value).toBe('4,5');
    expect(r.q('fl-est-value')!.dataset.value).toBe('4.5');
    const model = commitGuess(createInitial(13), 50);
    const m2 = mount(model);
    const open = taskOf(currentQuestion(model)!).factors.findIndex((x) => !x.fixed);
    m2.type(`fl-row-${open}-input`, '7');
    const r2 = mount(m2.state());
    expect((r2.q(`fl-row-${open}-input`) as HTMLInputElement).value).toBe('7');
  });

  it('builds a free model with rows, units and constants', () => {
    let s = createInitial(3, { model: 'free', difficulty: 'hard', category: 'space' });
    const m = mount(s);
    m.type('fl-est-input', '1e9');
    m.click('fl-guess');
    expect(m.q('fl-product')!.dataset.status).toBe('empty');
    m.click('fl-add-row');
    m.click('fl-add-row');
    expect(m.state().questions[0]!.factors).toHaveLength(2);
    m.type('fl-row-0-input', '5');
    const unit = m.q('fl-row-0-unit') as HTMLSelectElement;
    unit.value = unit.options[1]!.value;
    unit.dispatchEvent(new Event('change', { bubbles: true }));
    expect(m.state().questions[0]!.factors[0]!.unit).toBe(unit.options[1]!.value);
    m.type('fl-row-0-name', 'my factor');
    expect(m.state().questions[0]!.factors[0]!.label).toBe('my factor');
    m.click('fl-row-1-remove');
    expect(m.state().questions[0]!.factors).toHaveLength(1);
    const chip = m.root.querySelector<HTMLElement>('[data-testid^="fl-const-"]');
    if (chip) {
      chip.click();
      expect(m.state().questions[0]!.factors.at(-1)!.ref).not.toBeNull();
    }
    s = m.state();
    expect(game.isValidState(JSON.parse(JSON.stringify(s)))).toBe(true);
  });

  it.each(['en', 'de', 'ar', 'ja'] as const)('renders every phase in %s without missing keys, RTL for Arabic', (locale) => {
    const m = mount(createInitial(5), locale);
    expect(m.root.querySelector('.wp-fermi-lab')!.getAttribute('dir')).toBe(locale === 'ar' ? 'rtl' : 'ltr');
    expect(m.q('fl-question')!.textContent!.length).toBeGreaterThan(10);
    m.type('fl-est-input', '1000');
    m.click('fl-guess');
    m.click('fl-keep-guess');
    expect(m.q('fl-explain')!.textContent!.length).toBeGreaterThan(30);
    // Numeric axes stay left to right.
    expect(m.q('fl-scale')!.querySelector('svg')!.getAttribute('direction')).toBe('ltr');
    // So do quantities in scientific notation ("8.2 × 10⁹", owner decision 2026-10-24).
    const nums = [...m.root.querySelectorAll('.fl-num')];
    expect(nums.length).toBeGreaterThan(0);
    for (const n of nums) expect(n.getAttribute('dir')).toBe('ltr');
    expect(m.ctx.missingKeys).toEqual([]);
  });
});
