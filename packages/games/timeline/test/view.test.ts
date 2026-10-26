// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createTestContext } from '@wp/testing';
import type { GameModule } from '@wp/game-core';
import { ev } from '../src/data';
import game from '../src/index';
import { correctOrder, createRound, currentItem, earlierOf, isSummary, next, skip, type FirstItem, type Item, type OrderItem, type TimelineState, type TogetherItem, type WhenItem } from '../src/rules';
import type { Difficulty, RoundMode } from '../src/generate';

const module = game as GameModule<unknown>;
type Locale = 'en' | 'de' | 'ar' | 'ja';
const LOCALES: readonly Locale[] = ['en', 'de', 'ar', 'ja'];

beforeAll(async () => {
  for (const locale of LOCALES) await game.preload!(locale);
});

afterEach(() => {
  document.body.innerHTML = '';
});

const wait = (ms = 40) => new Promise((r) => setTimeout(r, ms));

function mount(state: TimelineState, locale: Locale = 'en') {
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
  const pick = (id: string) => {
    const r = q(id) as HTMLInputElement;
    r.checked = true;
    r.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const key = (id: string, k: string) => {
    q(id)!.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
    q(id)?.dispatchEvent(new KeyboardEvent('keyup', { key: k, bubbles: true }));
  };
  const state_ = () => instance.serialize() as TimelineState;
  const phase = () => q('tl-root')!.dataset.phase;
  return { ctx, instance, root, q, click, type, pick, key, finished, state: state_, phase };
}

/** A round whose current item is of `kind`. */
function roundWith(kind: Item['kind'], d: Difficulty = 'medium', mode: RoundMode = 'mixed', pred: (i: Item) => boolean = () => true): TimelineState {
  for (let seed = 1; seed < 500; seed++) {
    let s = createRound(seed, d, mode, 'all');
    while (!isSummary(s) && (currentItem(s)!.kind !== kind || !pred(currentItem(s)!))) s = next(skip(s));
    if (!isSummary(s)) return s;
  }
  throw new Error(`no ${kind} item`);
}

describe('"When was it?"', () => {
  it('types a year inside the range: the means line, then the verdict, the dates, the note and the sources', async () => {
    const s = roundWith('when', 'easy', 'when', (i) => ev((i as WhenItem).event)!.lo >= 1000);
    const it_ = currentItem(s) as WhenItem;
    const e = ev(it_.event)!;
    const m = mount(s);
    expect(m.phase()).toBe('when-question');
    expect(m.q('tl-means')!.dataset.state).toBe('empty');
    expect(m.q('tl-check')!.getAttribute('aria-disabled')).toBe('true');
    m.click('tl-check');
    expect(m.phase()).toBe('when-question');
    await wait();
    expect(m.q('tl-announcer')!.textContent).toBe('Place the marker or type a year first.');
    m.type('tl-year', String(e.y));
    expect(m.q('tl-means')!.textContent).toBe(`= ${e.y}`);
    expect((m.state().items[m.state().index] as WhenItem).draft).toMatchObject({ y: e.y, unit: 'ce', text: String(e.y) });
    const saves = m.ctx.saveRequests();
    m.click('tl-check');
    expect(m.ctx.saveRequests()).toBeGreaterThan(saves);
    expect(m.phase()).toBe('when-review');
    expect(m.q('tl-verdict')!.dataset.band).toBe('0');
    expect(m.q('tl-verdict')!.textContent).toBe('●●● Within the accepted range');
    expect(m.q('tl-your-answer')!.textContent).toContain(String(e.y));
    expect(m.q('tl-date')!.textContent!.length).toBeGreaterThan(8);
    expect(m.root.querySelector('details')!.textContent).toMatch(/Wikipedia|Britannica|https?:|[A-Z]/);
    expect(m.root.querySelector('[lang="en"][dir="ltr"]')).not.toBeNull();
    expect(m.q('tl-mark-target')).not.toBeNull();
    expect(m.q('tl-mark-guess')).not.toBeNull();
    expect(document.activeElement?.id).toBe('tl-review-heading');
  });

  it('explains invalid input, keeps the last valid answer and re-reads the number when the unit changes', () => {
    const m = mount(roundWith('when', 'medium', 'when'));
    m.type('tl-year', 'abc');
    expect(m.q('tl-means')!.dataset.state).toBe('invalid');
    expect(m.q('tl-means')!.textContent).toBe('Please type a number, such as 1450.');
    m.type('tl-year', '2500');
    // CE is the default unit: 2500 is after the end of the timeline.
    expect(m.q('tl-means')!.textContent).toBe('That is after 2020 — the timeline ends there.');
    expect(m.q('tl-means')!.dataset.state).toBe('invalid');
    m.type('tl-year', '66');
    const unit = m.q('tl-unit') as HTMLSelectElement;
    unit.value = 'ma';
    unit.dispatchEvent(new Event('change', { bubbles: true }));
    expect(m.q('tl-means')!.textContent).toBe('= 66 million years ago');
    expect((m.q('tl-unit') as HTMLSelectElement).value).toBe('ma');
    expect((m.q('tl-year') as HTMLInputElement).value).toBe('66');
    // The card was drawn again: the unit field is a new element.
    const unit2 = m.q('tl-unit') as HTMLSelectElement;
    unit2.value = 'bce';
    unit2.dispatchEvent(new Event('change', { bubbles: true }));
    expect(m.q('tl-means')!.textContent).toBe('= 66 BCE');
    expect((m.state().items[m.state().index] as WhenItem).draft.y).toBe(-65);
  });

  it('offers a slider with a value text, moves it by keyboard and announces the result after the key is released', async () => {
    const m = mount(roundWith('when', 'medium', 'when'));
    const slider = m.q('tl-slider')!;
    expect(slider.getAttribute('role')).toBe('slider');
    expect(slider.getAttribute('tabindex')).toBe('0');
    expect(slider.getAttribute('aria-valuetext')).toBe('No answer yet.');
    m.key('tl-slider', 'ArrowRight');
    const y = (m.state().items[m.state().index] as WhenItem).draft.y;
    expect(y).not.toBeNull();
    expect(m.q('tl-slider')!.getAttribute('aria-valuetext')).not.toBe('No answer yet.');
    expect(m.q('tl-axis-live')!.textContent).toMatch(/^Your answer: /);
    expect(m.q('tl-means')!.textContent).toMatch(/^= /);
    m.key('tl-slider', 'Home');
    expect((m.state().items[m.state().index] as WhenItem).draft.y!).toBeLessThan(y!);
    m.key('tl-slider', 'End');
    expect((m.state().items[m.state().index] as WhenItem).draft.y!).toBeLessThanOrEqual(2020);
    // Zoom keys change the window, not the answer.
    const before = m.q('tl-axis-shows')!.textContent;
    const draft = (m.state().items[m.state().index] as WhenItem).draft.y;
    m.key('tl-slider', '+');
    expect(m.q('tl-axis-shows')!.textContent).not.toBe(before);
    expect((m.state().items[m.state().index] as WhenItem).draft.y).toBe(draft);
    await wait();
  });

  it('gives away neither the date nor the correctness before the review', () => {
    for (const kind of ['when', 'order', 'first', 'together'] as const) {
      const s = roundWith(kind, 'medium');
      const m = mount(s);
      const html = m.root.innerHTML;
      expect(html, kind).not.toMatch(/data-band|data-inside|tl-verdict|tl-mark-target|tl-range"|tl-window"/);
      const item = currentItem(s)!;
      if (kind === 'when') expect(m.q('tl-card')!.textContent).not.toContain(m.q('tl-date')?.textContent ?? '§');
      if (kind === 'order') {
        // Cards carry no dates and no order hints.
        for (const id of (item as OrderItem).events) expect(html).not.toContain(`"${id}"`);
      }
      document.body.innerHTML = '';
    }
  });
});

describe('"Put in order"', () => {
  it('moves cards with buttons and with the keyboard pick-up pattern, announcing every step', async () => {
    const s = roundWith('order', 'easy', 'order');
    const m = mount(s);
    const n = (currentItem(s) as OrderItem).events.length;
    expect(m.q('tl-up-0')!.hasAttribute('disabled')).toBe(true);
    expect(m.q(`tl-down-${n - 1}`)!.hasAttribute('disabled')).toBe(true);
    const first = (currentItem(s) as OrderItem).draft[0]!;
    m.click('tl-down-0');
    expect((m.state().items[m.state().index] as OrderItem).draft[1]).toBe(first);
    await wait();
    expect(m.q('tl-announcer')!.textContent).toMatch(new RegExp(`position 2 of ${n}\\.$`));
    expect(document.activeElement?.id).toBe('tl-down-1');
    // Space picks up, the arrow keys move, Space places.
    m.key('tl-handle-1', ' ');
    await wait();
    expect(m.q('tl-announcer')!.textContent).toMatch(/^Picked up/);
    expect(m.q('tl-handle-1')!.getAttribute('aria-pressed')).toBe('true');
    m.key('tl-handle-1', 'ArrowUp');
    expect((m.state().items[m.state().index] as OrderItem).draft[0]).toBe(first);
    expect(document.activeElement?.id).toBe('tl-handle-0');
    m.key('tl-handle-0', ' ');
    await wait();
    expect(m.q('tl-announcer')!.textContent).toMatch(/placed at position 1/);
    // Escape returns a picked card to where it was.
    m.key('tl-handle-0', 'Enter');
    m.key('tl-handle-0', 'ArrowDown');
    m.key('tl-handle-1', 'Escape');
    expect((m.state().items[m.state().index] as OrderItem).draft[0]).toBe(first);
  });

  it('reviews the right order, each card’s place and the gaps', () => {
    const s = roundWith('order', 'medium', 'order');
    const item = currentItem(s) as OrderItem;
    const order = correctOrder(item.events);
    // Put the cards in the right order with the buttons.
    const m = mount(s);
    for (let target = 0; target < order.length; target++) {
      let at = (m.state().items[m.state().index] as OrderItem).draft.indexOf(order[target]!);
      while (at > target) m.click(`tl-up-${at--}`);
    }
    m.click('tl-check');
    expect(m.phase()).toBe('order-review');
    expect(m.q('tl-verdict')!.textContent).toBe('●●● All in the right order');
    expect(m.q('tl-order-answer')!.children).toHaveLength(order.length);
    expect(m.q('tl-order-answer')!.textContent).toContain('✓ in the right place');
    expect(m.q('tl-order-correct')!.children).toHaveLength(order.length);
    expect(m.q('tl-gap-large')!.textContent).toMatch(/^Largest gap/);
    expect(m.root.querySelectorAll('[data-testid="tl-mark-number"]')).toHaveLength(order.length);
  });
});

describe('"Which came first?" and "Same time?"', () => {
  it('asks the gap on medium when fair and reviews both dates, the gap and the insight', async () => {
    const s = roundWith('first', 'medium', 'first', (i) => (i as FirstItem).gaps.length > 0);
    const item = currentItem(s) as FirstItem;
    const m = mount(s);
    expect(m.q('tl-gap')).not.toBeNull();
    m.pick(`tl-first-${earlierOf(item)}`);
    m.click('tl-check');
    await wait();
    expect(m.q('tl-announcer')!.textContent).toBe('Choose about how much time lies between them.');
    m.pick('tl-gap-0');
    m.click('tl-check');
    expect(m.phase()).toBe('first-review');
    expect(m.q('tl-verdict')!.textContent).toMatch(/^●●● Right: /);
    expect(m.q('tl-date-a')).not.toBeNull();
    expect(m.q('tl-date-b')).not.toBeNull();
    expect(m.q('tl-between')!.textContent).toMatch(/^Between them lie about /);
    expect(m.q('tl-gap-result')!.textContent).toMatch(/^(●●●|●○○|○○○) Your estimate/);
  });

  it('chooses an option in "Same time?" and explains every option in words', () => {
    const s = roundWith('together', 'medium', 'together');
    const item = currentItem(s) as TogetherItem;
    const m = mount(s);
    expect(m.root.querySelector('#tl-item-heading')!.textContent).toContain(':');
    m.pick(`tl-opt-${item.correct}`);
    m.click('tl-check');
    expect(m.phase()).toBe('together-review');
    expect(m.q('tl-verdict')!.textContent).toMatch(/^●●● Right: /);
    expect(m.q('tl-window-line')!.textContent).toMatch(/^The window: /);
    const lines = m.q('tl-option-lines')!.children;
    expect(lines).toHaveLength(3);
    expect([...lines].filter((li) => (li as HTMLElement).dataset.inside === 'yes')).toHaveLength(1);
    expect(m.q('tl-window')).not.toBeNull();
  });
});

describe('summary, finish and preferences', () => {
  it('skips through a mixed round: summary, tip, finished once (never again after restore)', () => {
    const m = mount(createRound(3, 'medium', 'mixed', 'all'));
    let guard = 0;
    while (m.q('tl-skip') && guard++ < 20) {
      m.click('tl-skip');
      m.click(m.q('tl-next') ? 'tl-next' : 'tl-summary-btn');
    }
    expect(m.phase()).toBe('summary');
    expect(m.q('tl-summary-list')!.children).toHaveLength(6);
    expect(m.q('tl-tip')!.textContent!.length).toBeGreaterThan(20);
    expect(m.finished).toHaveLength(1);
    expect(m.finished[0]).toMatchObject({ outcome: 'completed', stats: { items: 6, answered: 0 } });
    expect(m.state().reported).toBe(true);
    expect(mount(m.state()).finished).toHaveLength(0);
  });

  it('remembers the axis view (squeezed or even) as a preference', () => {
    const m = mount(roundWith('when'));
    const linear = m.q('tl-view-linear') as HTMLInputElement;
    linear.checked = true;
    linear.dispatchEvent(new Event('change', { bubbles: true }));
    expect(m.ctx.preferences.get('axis')).toBe('linear');
    const again = createTestContext(module, 'en');
    again.preferences.set('axis', 'linear');
    const inst = game.create(again.context);
    inst.restore(roundWith('when'));
    expect((again.context.root.querySelector('[data-testid="tl-view-linear"]') as HTMLInputElement).checked).toBe(true);
  });

  it('ignores input while paused', () => {
    const m = mount(roundWith('order', 'easy', 'order'));
    const before = m.state();
    m.instance.pause();
    m.click('tl-down-0');
    m.click('tl-skip');
    expect(m.state()).toEqual(before);
    m.instance.resume();
    m.click('tl-down-0');
    expect(m.state()).not.toEqual(before);
  });
});

describe('locales (en, de, ar, ja)', () => {
  it('renders every kind and phase without missing keys; the timeline stays left-to-right', () => {
    for (const locale of LOCALES) {
      for (const kind of ['when', 'order', 'first', 'together'] as const) {
        const m = mount(roundWith(kind, 'medium'), locale);
        expect(m.q('tl-root')!.getAttribute('dir')).toBe(locale === 'ar' ? 'rtl' : 'ltr');
        expect(m.q('tl-axis')!.getAttribute('dir')).toBe('ltr');
        m.click('tl-skip');
        expect(m.phase(), `${locale}/${kind}`).toBe(`${kind}-review`);
        expect(m.q('tl-verdict')!.textContent!.length).toBeGreaterThan(3);
        expect(m.root.textContent).not.toMatch(/\{\w+\}|undefined|NaN/);
        expect(m.ctx.missingKeys, `${locale}/${kind}`).toEqual([]);
        document.body.innerHTML = '';
      }
    }
  });
});
