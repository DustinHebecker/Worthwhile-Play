// @vitest-environment jsdom
/**
 * The number input (design § 5, change 2026-10-25b): field, × 10ⁿ stepper, log slider and step buttons are views of
 * one value (field × 10^stepper). Each test below was written against an inconsistency found in the earlier view.
 */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createTestContext } from '@wp/testing';
import type { GameModule } from '@wp/game-core';
import game from '../src/index';
import { parseLocaleNumber } from '../src/format';
import { EXP_MAX, EXP_MIN, createInitial, currentQuestion, modelResult, rowValue, taskOf, type FermiState } from '../src/rules';

const module = game as GameModule<unknown>;
type Locale = 'en' | 'de' | 'ar' | 'ja';

beforeAll(async () => {
  for (const locale of ['en', 'de', 'ar', 'ja']) await game.preload!(locale);
});

afterEach(() => {
  document.body.innerHTML = '';
});

function mount(state: FermiState, locale: Locale = 'en') {
  const ctx = createTestContext(module, locale);
  const instance = game.create(ctx.context);
  instance.restore(state);
  const root = ctx.context.root;
  const q = <T extends HTMLElement = HTMLElement>(id: string) => root.querySelector<T>(`[data-testid="${id}"]`);
  const click = (id: string) => q(id)!.click();
  const type = (id: string, value: string) => {
    const field = q<HTMLInputElement>(id)!;
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const slide = (pos: number) => {
    const slider = q<HTMLInputElement>('fl-est-slider')!;
    slider.value = String(pos);
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const state_ = () => instance.serialize() as FermiState;
  return { instance, root, q, click, type, slide, state: state_ };
}

const free = (seed = 9) => createInitial(seed, { model: 'free' });
const shown = (m: ReturnType<typeof mount>) => {
  const v = m.q('fl-est-value');
  return v ? Number(v.dataset.value) : null;
};
/** What the saved draft means: the parsed field × 10^stepper (null when unreadable). */
const draftValue = (s: FermiState, locale: Locale): number | null => {
  const q = currentQuestion(s)!;
  const r = parseLocaleNumber(q.draft, locale);
  if (!r.ok) return null;
  const v = r.value * 10 ** q.draftExp;
  return Number.isFinite(v) && v > 0 ? v : null;
};
const close = (a: number, b: number) => Math.abs(a / b - 1) < 1e-9;

describe('number input: one value, every control derived from it', () => {
  it('×2 and ÷2 are exact: halving five times and doubling five times returns the typed value (no rounding drift)', () => {
    const m = mount(free());
    m.type('fl-est-input', '999');
    m.click('fl-est-div2');
    m.click('fl-est-mul2');
    expect(shown(m)).toBe(999);
    m.type('fl-est-input', '1');
    for (let i = 0; i < 9; i++) m.click('fl-est-div2');
    for (let i = 0; i < 9; i++) m.click('fl-est-mul2');
    expect(shown(m)).toBe(1);
    expect(m.state().questions[0]!.draft).toBe('1');
  });

  it('a cleared field leaves the slider without a value (it no longer shows the old position)', () => {
    const m = mount(free());
    m.type('fl-est-input', '500');
    m.type('fl-est-input', '');
    const slider = m.q<HTMLInputElement>('fl-est-slider')!;
    expect(slider.dataset.empty).toBe('true');
    const fresh = mount(m.state());
    expect(fresh.q<HTMLInputElement>('fl-est-slider')!.value).toBe(slider.value);
  });

  it('a slider moved while paused springs back to the value (field and slider never disagree)', () => {
    const m = mount(free());
    m.type('fl-est-input', '500');
    const slider = m.q<HTMLInputElement>('fl-est-slider')!;
    const before = slider.value;
    m.instance.pause();
    m.slide(Number(slider.min) + 1);
    expect(slider.value).toBe(before);
    expect(m.state().questions[0]!.draft).toBe('500');
  });

  it('a value too large for a number says so instead of leaving the interpretation blank', () => {
    const m = mount(free());
    m.type('fl-est-input', '1e300');
    for (let i = 0; i < 10; i++) m.click('fl-est-exp-plus');
    expect(m.q('fl-est-interp')!.querySelector('.fl-warn')).not.toBeNull();
  });

  it('a value outside the slider window pins the thumb to the end and marks it (the field allows more than the slider)', () => {
    const m = mount(free());
    const slider = m.q<HTMLInputElement>('fl-est-slider')!;
    m.type('fl-est-input', '1');
    for (let i = 0; i < Number(slider.max) + 2; i++) m.click('fl-est-exp-plus');
    expect(slider.value).toBe(slider.max);
    expect(slider.dataset.out).toBe('high');
    m.type('fl-est-input', '1');
    for (let i = 0; i < 40; i++) m.click('fl-est-exp-minus');
    expect(slider.dataset.out).toBe('low');
    // The window's ends are labelled.
    expect(m.root.querySelectorAll('.fl-slider-end')).toHaveLength(2);
  });

  it('a guided row typed in one language shows, after switching language, the value the model multiplies', () => {
    const s = createInitial(21, { difficulty: 'easy', model: 'guided' });
    const task = taskOf(currentQuestion(s)!);
    const k = task.factors.findIndex((x) => !x.fixed);
    const m = mount(s, 'en');
    m.type(`fl-row-${k}-input`, '1,500');
    const d = mount(m.state(), 'de');
    const row = d.state().questions[0]!.factors[k]!;
    expect(Number(d.q(`fl-row-${k}-value`)!.dataset.value)).toBe(rowValue(task, row));
    expect(rowValue(task, row)).toBe(1500);
  });

  it('property: random sequences of control actions keep field, stepper, slider, interpretation and draft in step, and survive save/restore', () => {
    type Action = { kind: 'type'; text: string } | { kind: 'exp'; d: 1 | -1 } | { kind: 'step'; id: 'div10' | 'div2' | 'mul2' | 'mul10' } | { kind: 'slide'; pos: number };
    const action: fc.Arbitrary<Action> = fc.oneof(
      fc
        .tuple(fc.integer({ min: 1, max: 99999 }), fc.integer({ min: 0, max: 3 }), fc.constantFrom('', 'e3', 'e-2', ' × 10^4'))
        .map(([n, dec, tail]) => ({ kind: 'type' as const, text: `${(n / 10 ** dec).toString()}${tail}` })),
      fc.constant({ kind: 'type' as const, text: '' }),
      fc.constantFrom(1 as const, -1 as const).map((d) => ({ kind: 'exp' as const, d })),
      fc.constantFrom('div10' as const, 'div2' as const, 'mul2' as const, 'mul10' as const).map((id) => ({ kind: 'step' as const, id })),
      fc.integer({ min: 0, max: 200 }).map((i) => ({ kind: 'slide' as const, pos: i / 20 }))
    );
    fc.assert(
      fc.property(fc.array(action, { maxLength: 25 }), fc.constantFrom<Locale>('en', 'de', 'ar'), (actions, locale) => {
        document.body.innerHTML = '';
        const m = mount(free(5), locale);
        const slider = m.q<HTMLInputElement>('fl-est-slider')!;
        const lo = Number(slider.min);
        for (const a of actions) {
          if (a.kind === 'type') m.type('fl-est-input', a.text);
          else if (a.kind === 'exp') m.click(a.d > 0 ? 'fl-est-exp-plus' : 'fl-est-exp-minus');
          else if (a.kind === 'step') m.click(`fl-est-${a.id}`);
          else m.slide(lo + a.pos);
          const s = m.state();
          const q = currentQuestion(s)!;
          const v = draftValue(s, locale);
          expect(m.q<HTMLInputElement>('fl-est-input')!.value).toBe(q.draft);
          expect(q.draftExp).toBeGreaterThanOrEqual(EXP_MIN);
          expect(q.draftExp).toBeLessThanOrEqual(EXP_MAX);
          expect(m.q('fl-est-exp')!.textContent).toBe(new Intl.NumberFormat(locale === 'ar' ? 'ar' : locale, { useGrouping: false }).format(q.draftExp));
          const sv = shown(m);
          if (v === null) expect(sv).toBeNull();
          else {
            expect(sv).not.toBeNull();
            expect(close(sv!, v)).toBe(true);
            const want = Math.min(lo + 10, Math.max(lo, Math.log10(v)));
            expect(Math.abs(Number(slider.value) - want)).toBeLessThanOrEqual(0.025 + 1e-9);
          }
        }
        const r = mount(m.state(), locale);
        expect(r.q<HTMLInputElement>('fl-est-input')!.value).toBe(m.q<HTMLInputElement>('fl-est-input')!.value);
        expect(r.q('fl-est-exp')!.textContent).toBe(m.q('fl-est-exp')!.textContent);
        expect(r.q<HTMLInputElement>('fl-est-slider')!.value).toBe(slider.value);
        expect(r.q('fl-est-interp')!.textContent).toBe(m.q('fl-est-interp')!.textContent);
      }),
      { numRuns: 60 }
    );
  });

  it('the guided product uses exactly what each row shows', () => {
    const s = createInitial(21, { difficulty: 'easy', model: 'guided' });
    const task = taskOf(currentQuestion(s)!);
    const m = mount(s);
    task.factors.forEach((x, k) => {
      if (x.fixed) return;
      m.type(`fl-row-${k}-input`, '2');
      m.click(`fl-row-${k}-exp-plus`);
    });
    const rows = m.state().questions[0]!.factors;
    task.factors.forEach((x, k) => {
      if (!x.fixed) expect(Number(m.q(`fl-row-${k}-value`)!.dataset.value)).toBe(rowValue(task, rows[k]!));
    });
    const result = modelResult(task, rows);
    if (result.status === 'ok') expect(close(Number(m.q('fl-product-value')!.dataset.value), result.value)).toBe(true);
  });
});
