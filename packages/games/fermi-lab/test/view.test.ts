// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createTestContext } from '@wp/testing';
import type { GameModule } from '@wp/game-core';
import game from '../src/index';
import { RECENT_KEY, createInitial, currentQuestion, taskOf, type FermiState } from '../src/rules';

const module = game as GameModule<unknown>;

beforeAll(async () => {
  for (const locale of ['en', 'de', 'ar', 'ja', 'ru']) await game.preload!(locale);
});

afterEach(() => {
  document.body.innerHTML = '';
});

function mount(state: FermiState, locale: 'en' | 'de' | 'ar' | 'ja' | 'ru' = 'en') {
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
  it('plays a guided round through the DOM: the question opens in the model, then review, summary; finished once', () => {
    const m = mount(createInitial(21, { difficulty: 'easy', model: 'guided' }));
    for (let i = 0; i < 5; i++) {
      const task = taskOf(currentQuestion(m.state())!);
      expect(m.q('fl-question')!.dataset.task).toBe(task.id);
      // No first-guess step: the guided model is shown right away.
      expect(m.root.querySelector('.wp-fermi-lab')!.getAttribute('data-phase')).toBe('model');
      expect(m.q('fl-est-input')).toBeNull();
      expect(m.q('fl-keep-guess')).toBeNull();
      // Fill every open row with the reference value: the model reproduces the reference product.
      task.factors.forEach((x, k) => {
        if (!x.fixed) m.type(`fl-row-${k}-input`, String(x.value));
      });
      expect(m.q('fl-product')!.dataset.status).toBe('ok');
      m.click('fl-use-model');
      expect(m.q('fl-verdict')!.dataset.band).toBe('x2');
      expect(m.q('fl-compare')!.querySelectorAll('[data-testid^="fl-effect-"]').length).toBeGreaterThan(0);
      expect(m.q('fl-sensitivity')).not.toBeNull();
      expect(m.q('fl-sources')!.textContent!.length).toBeGreaterThan(10);
      m.click(i < 4 ? 'fl-next' : 'fl-summary');
    }
    expect(m.q('fl-summary-list')!.children).toHaveLength(5);
    expect(m.q('fl-model-help')).toBeNull();
    expect(m.finished).toHaveLength(1);
    expect(m.finished[0]).toMatchObject({ outcome: 'completed', stats: { questions: 5, withinFactor3: 5, modelsUsed: 5 } });
    // A restored summary never reports a second end.
    const again = mount(m.state());
    expect(again.finished).toHaveLength(0);
    expect(m.ctx.saveRequests()).toBeGreaterThan(0);
  });

  it('plays a free round: estimate, then straight to the review with the reference model; the tip suggests guided', () => {
    const m = mount(createInitial(4, { model: 'free' }));
    for (let i = 0; i < 5; i++) {
      const task = taskOf(currentQuestion(m.state())!);
      m.click('fl-guess'); // nothing typed: no commit
      expect(m.state().questions[i]!.phase).toBe('estimate');
      m.type('fl-est-input', String(task.answer.central * 1.1));
      m.click('fl-guess');
      expect(m.state().questions[i]).toMatchObject({ phase: 'review', modelUsed: false, factors: [] });
      expect(m.q('fl-rows')).toBeNull();
      expect(Number(m.q('fl-answer')!.dataset.value) / (task.answer.central * 1.1)).toBeCloseTo(1, 9);
      // The reference model is explained, without "your value" columns.
      expect(m.q('fl-compare')!.querySelectorAll('[data-testid^="fl-cmp-"]')).toHaveLength(task.factors.length);
      expect(m.q('fl-compare')!.querySelectorAll('[data-testid^="fl-effect-"]')).toHaveLength(0);
      m.click(i < 4 ? 'fl-next' : 'fl-summary');
    }
    expect(m.q('fl-tip')!.dataset.tip).toBe('guided');
    expect(m.finished[0]).toMatchObject({ stats: { modelsUsed: 0 } });
  });

  it('refuses an incomplete guided model', () => {
    const m = mount(createInitial(4));
    expect(m.q('fl-use-model')!.getAttribute('aria-disabled')).toBe('true');
    m.click('fl-use-model');
    expect(m.state().questions[0]!.phase).toBe('model');
  });

  it('step buttons, the slider and Enter edit and commit the free estimate', () => {
    const m = mount(createInitial(9, { model: 'free' }));
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
    expect(m.state().questions[0]!.phase).toBe('review');
  });

  it('moves the power of ten to the stepper when doubling would overflow the field (the saved draft is cut at 32 characters)', () => {
    const m = mount(createInitial(9, { model: 'free' }));
    m.type('fl-est-input', '5e31');
    for (let i = 0; i < 6; i++) m.click('fl-est-exp-minus');
    m.click('fl-est-mul2');
    expect(Number(m.q('fl-est-value')!.dataset.value) / 1e26).toBeCloseTo(1, 9);
    expect(m.state().questions[0]!).toMatchObject({ draft: '1', draftExp: 26 });
    const r = mount(m.state());
    expect(Number(r.q('fl-est-value')!.dataset.value) / 1e26).toBeCloseTo(1, 9);
  });

  it('restores a half-typed estimate and a half-built guided model', () => {
    const m = mount(createInitial(13, { model: 'free' }));
    m.type('fl-est-input', '4,5');
    const r = mount(m.state(), 'de');
    expect((r.q('fl-est-input') as HTMLInputElement).value).toBe('4,5');
    expect(r.q('fl-est-value')!.dataset.value).toBe('4.5');
    const model = createInitial(13);
    const m2 = mount(model);
    const open = taskOf(currentQuestion(model)!).factors.findIndex((x) => !x.fixed);
    m2.type(`fl-row-${open}-input`, '7');
    const r2 = mount(m2.state());
    expect((r2.q(`fl-row-${open}-input`) as HTMLInputElement).value).toBe('7');
  });

  it.each(['en', 'de', 'ar', 'ja'] as const)('renders every phase of both paths in %s without missing keys, RTL for Arabic', (locale) => {
    const g = mount(createInitial(5), locale);
    expect(g.root.querySelector('.wp-fermi-lab')!.getAttribute('dir')).toBe(locale === 'ar' ? 'rtl' : 'ltr');
    expect(g.q('fl-question')!.textContent!.length).toBeGreaterThan(10);
    expect(g.q('fl-product')).not.toBeNull();
    expect(g.ctx.missingKeys).toEqual([]);
    const m = mount(createInitial(5, { model: 'free' }), locale);
    m.type('fl-est-input', '1000');
    m.click('fl-guess');
    expect(m.q('fl-explain')!.textContent!.length).toBeGreaterThan(30);
    // Numeric axes stay left to right.
    expect(m.q('fl-scale')!.querySelector('svg')!.getAttribute('direction')).toBe('ltr');
    // So do quantities in scientific notation ("8.2 × 10⁹", owner decision 2026-10-24).
    const nums = [...m.root.querySelectorAll('.fl-num')];
    expect(nums.length).toBeGreaterThan(0);
    for (const n of nums) expect(n.getAttribute('dir')).toBe('ltr');
    expect(m.ctx.missingKeys).toEqual([]);
  });

  it('remembers the shown tasks on this device (not in the save) and the next round avoids them', () => {
    const ctx = createTestContext(module, 'en');
    const instance = game.create(ctx.context);
    const opts = { seed: 77, difficulty: 'easy', settings: { category: 'all', model: 'free' } };
    instance.newGame(opts);
    const first = instance.serialize() as FermiState;
    const shown = first.questions.map((q) => q.taskId);
    expect(ctx.preferences.get(RECENT_KEY)).toEqual([shown[0]]);
    expect(JSON.stringify(first)).not.toContain(RECENT_KEY);
    // The player sees all five questions.
    for (const id of shown.slice(1)) {
      instance.restore({ ...first, index: shown.indexOf(id) });
    }
    expect(ctx.preferences.get(RECENT_KEY)).toEqual(shown);
    instance.newGame(opts);
    const second = (instance.serialize() as FermiState).questions.map((q) => q.taskId);
    expect(second.filter((id) => shown.includes(id))).toEqual([]);
    instance.dispose();
  });

  it('ignores a missing or broken memory', () => {
    for (const junk of [undefined, 'x', 42, { a: 1 }, ['nope', null], null]) {
      const ctx = createTestContext(module, 'en');
      ctx.preferences.set(RECENT_KEY, junk);
      const instance = game.create(ctx.context);
      instance.newGame({ seed: 5 });
      expect(instance.serialize()).toEqual(createInitial(5));
      instance.dispose();
    }
    const ctx = createTestContext(module, 'en');
    const { preferences: _unused, ...withoutPreferences } = ctx.context;
    const instance = game.create(withoutPreferences);
    instance.newGame({ seed: 5 });
    expect(instance.serialize()).toEqual(createInitial(5));
    instance.dispose();
  });

  it('writes count words and "times" in the plural form of the number shown (Russian: год, года, лет; раз, раза)', () => {
    const base = createInitial(4, { model: 'free' });
    const state: FermiState = { ...base, questions: base.questions.map((q, i) => (i === 0 ? { ...q, taskId: 'lifetime-sleep', windowLo: -1 } : q)) };
    const m = mount(state, 'ru');
    const unit = () => m.root.querySelector('.fl-field-unit')!.textContent;
    expect(unit()).toBe('года');
    for (const [typed, form] of [['1', 'год'], ['3', 'года'], ['5', 'лет'], ['21', 'год'], ['1,5', 'года']] as const) {
      m.type('fl-est-input', typed);
      expect(unit(), typed).toBe(form);
      expect(m.q('fl-est-value')!.textContent, typed).toContain(form);
    }
    m.type('fl-est-input', '125');
    m.click('fl-guess');
    expect(m.q('fl-answer')!.textContent).toContain('лет');
    expect(m.q('fl-direction')!.textContent).toContain('В 5 раз больше.');
    m.instance.dispose();
    const en = mount({ ...state, questions: state.questions.map((q, i) => (i === 0 ? { ...q, phase: 'review', answer: 50 } : q)) }, 'en');
    expect(en.q('fl-direction')!.textContent).toContain('2 times too high.');
    expect(en.q('fl-answer')!.textContent).toContain('50 years');
    expect(en.ctx.missingKeys).toEqual([]);
  });
});
