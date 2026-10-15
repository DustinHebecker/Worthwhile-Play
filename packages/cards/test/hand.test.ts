// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { createTranslator } from '@wp/localization';
import { CARD_MESSAGES, renderHand, type Card } from '../src';

const t = createTranslator({ locale: 'en', sources: [CARD_MESSAGES] });
const tAr = createTranslator({ locale: 'ar', sources: [CARD_MESSAGES] });
const HAND: Card[] = ['JC', 'AS', 'TS', 'KH', '7D'];

const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
const buttons = (el: HTMLElement) => Array.from(el.querySelectorAll('button'));

afterEach(() => {
  document.body.replaceChildren();
  document.documentElement.removeAttribute('dir');
});

describe('renderHand', () => {
  it('renders a labelled group of labelled cards with decorative SVGs', () => {
    const view = renderHand(HAND, { t });
    document.body.append(view.element);
    expect(view.element.getAttribute('role')).toBe('group');
    expect(view.element.getAttribute('aria-label')).toBe('Cards in hand');
    const items = Array.from(view.element.children);
    expect(items.map((i) => i.getAttribute('aria-label'))).toEqual(['Jack of Clubs', 'Ace of Spades', '10 of Spades', 'King of Hearts', '7 of Diamonds']);
    expect(items.every((i) => i.getAttribute('role') === 'img')).toBe(true);
    expect(items.every((i) => i.querySelector('svg')?.getAttribute('aria-hidden') === 'true')).toBe(true);
    expect(buttons(view.element)).toHaveLength(0);
    // Fan by default, with compact index faces.
    expect(view.element.classList.contains('wp-hand--fan')).toBe(true);
    expect(view.element.querySelector('svg')?.classList.contains('wp-pc--index')).toBe(true);
  });

  it('labels face-down cards', () => {
    const view = renderHand([null, null], { t, label: 'Opponent' });
    expect(view.element.getAttribute('aria-label')).toBe('Opponent');
    expect(view.element.firstElementChild?.getAttribute('aria-label')).toBe('Face-down card');
  });

  it('uses a roving tabindex and moves with arrows, Home and End', () => {
    const view = renderHand(HAND, { t, selectable: true });
    document.body.append(view.element);
    const list = buttons(view.element);
    expect(list.map((b) => b.tabIndex)).toEqual([0, -1, -1, -1, -1]);
    list[0]?.focus();
    key(list[0] as Element, 'ArrowRight');
    expect(document.activeElement).toBe(list[1]);
    expect(list.map((b) => b.tabIndex)).toEqual([-1, 0, -1, -1, -1]);
    key(list[1] as Element, 'ArrowDown');
    expect(document.activeElement).toBe(list[2]);
    key(list[2] as Element, 'ArrowLeft');
    key(list[1] as Element, 'ArrowUp');
    expect(document.activeElement).toBe(list[0]);
    key(list[0] as Element, 'ArrowLeft'); // clamped
    expect(document.activeElement).toBe(list[0]);
    key(list[0] as Element, 'End');
    expect(document.activeElement).toBe(list[4]);
    key(list[4] as Element, 'Home');
    expect(document.activeElement).toBe(list[0]);
  });

  it('mirrors left/right in RTL', () => {
    document.documentElement.setAttribute('dir', 'rtl');
    const view = renderHand(HAND, { t: tAr, selectable: true });
    document.body.append(view.element);
    const list = buttons(view.element);
    list[0]?.focus();
    key(list[0] as Element, 'ArrowLeft');
    expect(document.activeElement).toBe(list[1]);
    key(list[1] as Element, 'ArrowRight');
    expect(document.activeElement).toBe(list[0]);
  });

  it('selects with click (Enter/Space are native button presses) and ignores disabled cards', () => {
    const picked: [number, Card | null][] = [];
    const view = renderHand(HAND, { t, selectable: true, disabled: [3], onSelect: (i, c) => picked.push([i, c]) });
    document.body.append(view.element);
    const list = buttons(view.element);
    expect(list.every((b) => b.type === 'button')).toBe(true);
    list[1]?.click();
    list[3]?.click();
    expect(picked).toEqual([[1, 'AS']]);
    expect(list[3]?.getAttribute('aria-disabled')).toBe('true');
    // The clicked card becomes the roving focus target.
    expect(list[3]?.tabIndex).toBe(0);
    expect(document.activeElement).toBe(list[3]);
  });

  it('exposes aria-pressed only when selection is a toggle', () => {
    const plain = renderHand(HAND, { t, selectable: true });
    expect(buttons(plain.element).some((b) => b.hasAttribute('aria-pressed'))).toBe(false);
    const toggle = renderHand(HAND, { t, selectable: true, selected: [0, 2] });
    expect(buttons(toggle.element).map((b) => b.getAttribute('aria-pressed'))).toEqual(['true', 'false', 'true', 'false', 'false']);
  });

  it('update keeps focus on the same position and destroy removes the element', () => {
    const view = renderHand(HAND, { t, selectable: true, selected: [] });
    document.body.append(view.element);
    view.focusCard(2);
    view.update(HAND.slice(0, 4), { selected: [2] });
    const list = buttons(view.element);
    expect(list).toHaveLength(4);
    expect(document.activeElement).toBe(list[2]);
    expect(list[2]?.getAttribute('aria-pressed')).toBe('true');
    view.update(HAND.slice(0, 2));
    expect(document.activeElement).toBe(buttons(view.element)[1]);
    view.destroy();
    expect(document.body.contains(view.element)).toBe(false);
  });

  it('lays a fan out on a grid whose steps are at least 44 px', () => {
    const view = renderHand(HAND, { t });
    expect(view.element.style.gridTemplateColumns).toBe('repeat(4, var(--wp-hand-step)) var(--wp-hand-card-w)');
    expect(parseInt(view.element.style.getPropertyValue('--wp-hand-step'), 10)).toBeGreaterThanOrEqual(44);
    const flat = renderHand(HAND, { t, fan: false });
    expect(flat.element.style.gridTemplateColumns).toBe('');
    expect(flat.element.querySelector('svg')?.classList.contains('wp-pc--full')).toBe(true);
  });
});
