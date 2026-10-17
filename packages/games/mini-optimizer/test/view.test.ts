// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { createTestContext } from '@wp/testing';
import type { GameModule } from '@wp/game-core';
import game from '../src/index';
import { createInitial, solve, type DeliveryPlan, type MoState, type NetworkPlan, type ProductionPlan } from '../src/rules';

const module = game as GameModule<unknown>;

afterEach(() => {
  document.body.innerHTML = '';
});

function mount(state: MoState, locale: 'en' | 'ar' | 'de' = 'en') {
  const ctx = createTestContext(module, locale);
  const finished: unknown[] = [];
  const context = { ...ctx.context, finished: (r: unknown) => finished.push(r) };
  const instance = game.create(context);
  instance.restore(state);
  const root = ctx.context.root;
  const q = (id: string) => root.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
  const click = (el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
  return { ctx, instance, root, q, click, key, finished };
}

/** Enters a best plan by clicks. */
function enterBest(m: ReturnType<typeof mount>, state: MoState) {
  const best = solve(state.problem).plan;
  if (state.problem.kind === 'network') for (const i of (best as NetworkPlan).built) m.click(m.q(`link-${i}`));
  else if (state.problem.kind === 'delivery') {
    (best as DeliveryPlan).trips.forEach((trip, k) => {
      if (k > 0) m.click(m.q('depot'));
      for (const s of trip) m.click(m.q(`stop-${String.fromCharCode(65 + s)}`));
    });
  } else (best as ProductionPlan).qty.forEach((n, i) => {
    for (let k = 0; k < n; k++) m.click(m.q(`plus-${i}`));
  });
}

describe('view', () => {
  it.each(['network', 'delivery', 'production'] as const)('%s: a best plan entered by taps checks as best and reports the end once', (kind) => {
    const state = createInitial(17, 'medium', kind);
    const m = mount(state);
    // Every kind starts incomplete (production: nothing made yet).
    expect(m.q('mo-check').getAttribute('aria-disabled')).toBe('true');
    m.click(m.q('mo-check'));
    expect(m.finished).toHaveLength(0);
    enterBest(m, state);
    expect(m.q('mo-score').dataset.value).toBe(String(solve(state.problem).score));
    expect(m.q('mo-check').getAttribute('aria-disabled')).toBe('false');
    m.click(m.q('mo-check'));
    expect(m.q('mo-result').hidden).toBe(false);
    expect(m.q('mo-result-gap').dataset.value).toBe('0');
    expect(m.q('mo-result-gap').textContent).toBe('That is a best plan.');
    expect(m.finished).toHaveLength(1);
    expect(m.finished[0]).toMatchObject({ outcome: 'completed', stats: { gap: 0, checks: 1 } });
    // Further play: undo and check again never reports a second end.
    m.click(m.q('mo-undo'));
    expect(m.q('mo-result-changed')).not.toBeNull();
    m.click(m.q('mo-clear'));
    enterBest(m, (m.instance.serialize() as MoState));
    m.click(m.q('mo-check'));
    expect(m.finished).toHaveLength(1);
    expect((m.instance.serialize() as MoState).checks).toBe(2);
    expect(m.ctx.saveRequests()).toBeGreaterThan(0);
  });

  it('shows a best plan on request without changing the player\'s plan', () => {
    const state = createInitial(5, 'easy', 'network');
    const m = mount(state);
    enterBest(m, state);
    const extra = state.problem.kind === 'network' ? state.problem.links.findIndex((_, i) => !(solve(state.problem).plan as NetworkPlan).built.includes(i)) : 0;
    m.click(m.q(`link-${extra}`));
    m.click(m.q('mo-check'));
    expect(Number(m.q('mo-result-gap').dataset.value)).toBeGreaterThan(0);
    const plan = (m.instance.serialize() as MoState).plan;
    m.click(m.q('mo-reveal'));
    expect(m.root.querySelector('.wp-mini-optimizer')!.getAttribute('data-view')).toBe('best');
    expect(m.root.querySelectorAll('.mo-link.is-best').length).toBe((solve(state.problem).plan as NetworkPlan).built.length);
    // A tap on the map while a best plan is shown switches back instead of editing.
    m.click(m.q(`link-${extra}`));
    expect(m.root.querySelector('.wp-mini-optimizer')!.getAttribute('data-view')).toBe('yours');
    expect((m.instance.serialize() as MoState).plan).toEqual(plan);
    expect((m.instance.serialize() as MoState).revealed).toBe(true);
  });

  it('announces what is missing instead of checking an incomplete plan', () => {
    const m = mount(createInitial(3, 'easy', 'delivery'));
    m.click(m.q('stop-A'));
    m.click(m.q('mo-check'));
    expect((m.instance.serialize() as MoState).checks).toBe(0);
    expect(m.finished).toHaveLength(0);
  });

  it('roads can be built with the keyboard and from the list view', () => {
    const m = mount(createInitial(9, 'easy', 'network'));
    const first = m.root.querySelector<SVGGElement>('.mo-link[tabindex="0"]')!;
    m.key(first, 'ArrowRight');
    const second = m.root.querySelector<SVGGElement>('.mo-link[tabindex="0"]')!;
    expect(second).not.toBe(first);
    m.key(second, ' ');
    expect(second.getAttribute('aria-pressed')).toBe('true');
    const box = m.q(`list-link-${second.dataset.link}`) as HTMLInputElement;
    expect(box.checked).toBe(true);
    box.dispatchEvent(new Event('change'));
    expect(m.q(`link-${second.dataset.link}`).getAttribute('aria-pressed')).toBe('false');
  });

  it('quantities follow arrow keys, Home and End; meters name over-used stock in words', () => {
    const state = createInitial(9, 'easy', 'production');
    const m = mount(state);
    const qty = m.q('qty-0');
    m.key(qty, 'ArrowUp');
    m.key(qty, '+');
    expect(qty.getAttribute('aria-valuenow')).toBe('2');
    m.key(qty, 'End');
    expect(qty.getAttribute('aria-valuenow')).toBe(qty.getAttribute('aria-valuemax'));
    for (let i = 1; i < 3; i++) m.key(m.q(`qty-${i}`), 'End');
    expect(m.q('meter-wood').textContent).toMatch(/⚠ Wood: \d+ of \d+ \(\d+ too many\)/);
    m.key(qty, 'Home');
    expect(qty.getAttribute('aria-valuenow')).toBe('0');
  });

  it('delivery: the list view adds and removes customers; trips are listed with load and distance', () => {
    const m = mount(createInitial(2, 'medium', 'delivery'), 'de');
    m.click(m.q('list-add-A'));
    m.click(m.q('depot'));
    m.click(m.q('stop-B'));
    expect(m.q('stop-B').dataset.trip).toBe('2');
    expect(m.root.querySelector('.mo-tripline')!.textContent).toMatch(/^Tour 1: Lager → A → Lager · \d+ von \d+ Paketen · \d+ km$/);
    m.click(m.q('list-remove-A'));
    expect(m.q('stop-A').dataset.trip).toBe('0');
    expect(m.q('stop-B').dataset.trip).toBe('1');
  });

  it('renders right-to-left text around a left-to-right map whose arrow keys follow its visual order', () => {
    const m = mount(createInitial(1, 'hard', 'network'), 'ar');
    expect(m.root.querySelector('.wp-mini-optimizer')!.getAttribute('dir')).toBe('rtl');
    const items = [...m.root.querySelectorAll<SVGGElement>('.mo-link')];
    const first = m.root.querySelector<SVGGElement>('.mo-link[tabindex="0"]')!;
    m.key(first, 'ArrowRight');
    const next = m.root.querySelector<SVGGElement>('.mo-link[tabindex="0"]')!;
    m.key(next, 'ArrowLeft');
    expect(m.root.querySelector('.mo-link[tabindex="0"]')).toBe(first);
    expect(items).toContain(next);
    expect(next).not.toBe(first);
  });

  it('production: an empty plan is not checked; the status says why', () => {
    const m = mount(createInitial(4, 'easy', 'production'));
    expect(m.q('mo-status').textContent).toContain('Nothing made yet');
    m.click(m.q('plus-0'));
    expect(m.q('mo-status').textContent).not.toContain('Nothing made yet');
    expect(m.q('mo-check').getAttribute('aria-disabled')).toBe('false');
  });
});
