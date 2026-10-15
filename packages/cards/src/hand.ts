import type { Translator } from '@wp/game-core';
import { cardLabel } from './messages';
import type { Card, SuitSet } from './model';
import { renderCard } from './render';
import type { CardColors, CardStyle } from './svg';

export interface HandOptions {
  t: Translator;
  /** Accessible name of the hand (default: `cards.hand`, "Cards in hand"). */
  label?: string;
  suits?: SuitSet;
  colors?: CardColors;
  /** Overlap the cards (default `true`). Without fan they wrap side by side with a gap. */
  fan?: boolean;
  /** Card face style; default 'index' in a fan (big index in both top corners), else 'full'. */
  style?: CardStyle;
  /** Cards are buttons (roving tabindex, Enter/Space, click/tap) when `true`. Default `false`. */
  selectable?: boolean;
  /**
   * Indices shown as selected (raised, `aria-pressed="true"`). When given, every card button
   * exposes `aria-pressed`, i.e. selection is a toggle (e.g. choosing the two cards to put away).
   * Leave it out when a press means "play this card".
   */
  selected?: readonly number[];
  /** Indices that cannot be chosen now (`aria-disabled`, dimmed; still focusable so they can be read). */
  disabled?: readonly number[];
  /** Called with the index and card on click, tap, Enter or Space (not for disabled cards). */
  onSelect?: (index: number, card: Card | null) => void;
}

export interface HandView {
  readonly element: HTMLElement;
  /** Re-renders with new cards and/or options; keeps keyboard focus on the same index when possible. */
  update(cards: readonly (Card | null)[], options?: Partial<HandOptions>): void;
  /** Moves the roving focus to a card (clamped). */
  focusCard(index: number): void;
  destroy(): void;
}

/** Minimum width of the uncovered strip of each card in a fan (CSS px). */
export const MIN_STRIP = 44;
/** Fan step as a share of the card width, when that is more than `MIN_STRIP`. */
const STEP_RATIO = 0.56;

/**
 * Renders a hand of cards (`null` = face down, e.g. an opponent's hand).
 *
 * Fan and hit areas: cards are grid items whose columns are one "step" wide; each card is wider
 * than its column and is covered by the next card, which comes later in the DOM and is therefore
 * on top for both painting and hit testing. So a tap always hits the card whose uncovered strip
 * is under the pointer, without any coordinate maths. The step is never below 44 px, so every
 * card keeps a ≥ 44 × (card height) target. When the hand does not fit in one row at that step,
 * it is split into balanced rows (measured with a ResizeObserver), e.g. 10 Skat cards at 360 px
 * become two rows of five. In RTL the grid runs right to left and cards overlap the other way;
 * 'index' faces show the index in both top corners, so the uncovered strip always shows it.
 *
 * Keyboard: one card is in the tab order (roving tabindex). Arrow keys move in visual
 * direction (mirrored in RTL), Up/Down move to the previous/next card, Home/End jump to the ends,
 * Enter/Space press the focused card.
 */
export function renderHand(cards: readonly (Card | null)[], options: HandOptions, doc: Document = document): HandView {
  let current = [...cards];
  let opts: HandOptions = { ...options };
  let focusIndex = 0;
  const element = doc.createElement('div');
  element.className = 'wp-hand';
  element.setAttribute('role', 'group');

  const items = (): HTMLElement[] => Array.from(element.children) as HTMLElement[];
  const isRtl = () => (element.closest('[dir]')?.getAttribute('dir') ?? opts.t.direction) === 'rtl';

  const render = () => {
    const { t, suits = 'french', fan = true, selectable = false, selected, disabled = [] } = opts;
    const style = opts.style ?? (fan ? 'index' : 'full');
    element.setAttribute('aria-label', opts.label ?? t('cards.hand'));
    element.classList.toggle('wp-hand--fan', fan);
    element.classList.toggle('wp-hand--selectable', selectable);
    element.replaceChildren();
    focusIndex = Math.min(Math.max(0, focusIndex), Math.max(0, current.length - 1));
    current.forEach((card, index) => {
      const svg = renderCard(card, { suits, style, label: false, t, ...(opts.colors ? { colors: opts.colors } : {}) }, doc);
      const name = cardLabel(card, t, suits);
      let item: HTMLElement;
      if (selectable) {
        item = doc.createElement('button');
        item.setAttribute('type', 'button');
        item.tabIndex = index === focusIndex ? 0 : -1;
        if (selected) item.setAttribute('aria-pressed', String(selected.includes(index)));
        if (disabled.includes(index)) item.setAttribute('aria-disabled', 'true');
      } else {
        item = doc.createElement('span');
        item.setAttribute('role', 'img');
      }
      item.className = 'wp-hand-card';
      if (selected?.includes(index)) item.classList.add('wp-hand-card--selected');
      item.dataset.index = String(index);
      item.setAttribute('aria-label', name);
      item.append(svg);
      element.append(item);
    });
    layout();
  };

  let lastWidth = -1;
  const layout = () => {
    const count = current.length;
    const fan = opts.fan ?? true;
    if (!fan || count === 0) {
      element.style.removeProperty('grid-template-columns');
      return;
    }
    const first = items()[0];
    const width = element.clientWidth;
    const cardWidth = first?.getBoundingClientRect().width ?? 0;
    let cols = count;
    let step = MIN_STRIP;
    if (width > 0 && cardWidth > 0) {
      step = Math.max(MIN_STRIP, Math.round(cardWidth * STEP_RATIO));
      const perRow = Math.max(1, Math.floor((width - cardWidth) / step) + 1);
      const rows = Math.ceil(count / perRow);
      cols = Math.ceil(count / rows);
    }
    element.style.setProperty('--wp-hand-step', `${step}px`);
    element.style.gridTemplateColumns = cols > 1 ? `repeat(${cols - 1}, var(--wp-hand-step)) var(--wp-hand-card-w)` : 'var(--wp-hand-card-w)';
  };

  const RO = (doc.defaultView as (Window & typeof globalThis) | null)?.ResizeObserver;
  const observer = RO
    ? new RO(() => {
        const width = element.clientWidth;
        if (width !== lastWidth) {
          lastWidth = width;
          layout();
        }
      })
    : undefined;
  observer?.observe(element);

  const focusCard = (index: number) => {
    const list = items();
    if (list.length === 0) return;
    focusIndex = Math.min(Math.max(0, index), list.length - 1);
    list.forEach((el, i) => {
      if (el.tagName === 'BUTTON') el.tabIndex = i === focusIndex ? 0 : -1;
    });
    list[focusIndex]?.focus();
  };

  const indexOf = (target: EventTarget | null): number => {
    const el = (target as Element | null)?.closest?.('.wp-hand-card') as HTMLElement | null;
    return el && el.parentElement === element ? Number(el.dataset.index) : -1;
  };

  const onClick = (event: MouseEvent) => {
    if (!(opts.selectable ?? false)) return;
    const index = indexOf(event.target);
    if (index < 0) return;
    focusIndex = index;
    focusCard(index);
    if ((opts.disabled ?? []).includes(index)) return;
    opts.onSelect?.(index, current[index] ?? null);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (!(opts.selectable ?? false)) return;
    const index = indexOf(event.target);
    if (index < 0) return;
    const forward = isRtl() ? 'ArrowLeft' : 'ArrowRight';
    const backward = isRtl() ? 'ArrowRight' : 'ArrowLeft';
    let next: number | undefined;
    if (event.key === forward || event.key === 'ArrowDown') next = index + 1;
    else if (event.key === backward || event.key === 'ArrowUp') next = index - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = current.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    focusCard(next);
  };

  const onFocusIn = (event: FocusEvent) => {
    const index = indexOf(event.target);
    if (index >= 0) focusIndex = index;
  };

  element.addEventListener('click', onClick);
  element.addEventListener('keydown', onKeyDown);
  element.addEventListener('focusin', onFocusIn);
  render();

  return {
    element,
    update(nextCards, nextOptions) {
      const hadFocus = element.contains(doc.activeElement);
      current = [...nextCards];
      if (nextOptions) opts = { ...opts, ...nextOptions };
      render();
      if (hadFocus) focusCard(focusIndex);
    },
    focusCard,
    destroy() {
      observer?.disconnect();
      element.removeEventListener('click', onClick);
      element.removeEventListener('keydown', onKeyDown);
      element.removeEventListener('focusin', onFocusIn);
      element.remove();
    }
  };
}
