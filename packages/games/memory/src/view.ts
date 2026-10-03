import './styles.css';
import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import type { CardSide } from '@wp/learning-content';
import { announce, clear, gridKeyboard, h } from '@wp/ui';
import { DEFAULT_DECK_ID, findItem, getDeck, type DeckEntry } from './decks';
import {
  BOARD,
  cardView,
  deal,
  dismiss,
  hasPendingMismatch,
  isFinished,
  matchedPairs,
  select,
  toDifficulty,
  type CardView,
  type MemoryEvent,
  type MemoryState
} from './rules';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/**
 * Renders one side of a learning item generically, so that symbol, image, text (and
 * combinations) decks all work with the same view.
 */
export function renderSide(side: CardSide, description: string): HTMLElement {
  const face = h('span', { class: 'wp-memory__face' });
  if (side.image) face.append(h('img', { class: 'wp-memory__image', src: side.image, alt: description, draggable: 'false' }));
  if (side.symbol) face.append(h('span', { class: 'wp-memory__symbol', role: 'img', 'aria-label': description }, side.symbol));
  if (side.text) face.append(h('span', { class: 'wp-memory__text', lang: side.lang }, side.text));
  // TODO(audio): sides with `audio` (audio↔word decks) need a play control and a
  // speech-synthesis fallback for `lang`; ignored until the shared audio package exists.
  return face;
}

export function createMemory(context: GameContext): GameInstance<MemoryState> {
  const { root, t } = context;
  let state: MemoryState | undefined;
  let lastEvent: MemoryEvent | undefined;
  let paused = false;
  let focusIndex = 0;
  let shown: CardView[] = [];
  let cards: HTMLButtonElement[] = [];
  let disposeKeyboard: (() => void) | undefined;

  const movesEl = h('span', { 'data-testid': 'memory-moves' });
  const pairsEl = h('span', { 'data-testid': 'memory-pairs' });
  const statusEl = h('p', { class: 'wp-status wp-memory__status', 'data-testid': 'memory-status' });
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status' });
  const board = h('div', { class: 'wp-memory__board', role: 'group', 'aria-label': t('board'), 'data-testid': 'memory-board' });
  const continueButton = h('button', { type: 'button', class: 'primary', 'data-testid': 'memory-continue', hidden: true }, t('continue'));
  const container = h(
    'div',
    { class: `wp-memory${context.reducedMotion ? '' : ' wp-memory--motion'}`, dir: t.direction },
    h('div', { class: 'wp-memory__info' }, movesEl, pairsEl),
    statusEl,
    board,
    h('div', { class: 'wp-memory__actions' }, continueButton),
    live
  );

  const entry = (s: MemoryState): DeckEntry => {
    const found = getDeck(s.deckId);
    if (!found) throw new Error(`Unknown deck "${s.deckId}"`);
    return found;
  };

  const describe = (s: MemoryState, position: number): { side: CardSide; description: string } => {
    const card = s.cards[position];
    const deck = entry(s);
    const item = card && findItem(deck, card.item);
    if (!card || !item) return { side: {}, description: '' };
    const side = item[card.side];
    const description = deck.descriptionKeyPrefix ? t(`${deck.descriptionKeyPrefix}${item.id}`) : (side.text ?? side.alt ?? '');
    return { side, description };
  };

  const label = (s: MemoryState, position: number, view: CardView): string => {
    const n = position + 1;
    if (view === 'hidden') return t('card.hidden', { n });
    const content = describe(s, position).description;
    return t(view === 'matched' ? 'card.matched' : 'card.revealed', { n, content });
  };

  const statusText = (s: MemoryState): string => {
    if (isFinished(s)) return t('status.finished', { moves: s.moves });
    if (hasPendingMismatch(s)) return t('status.mismatch');
    if (s.revealed.length === 1) return t('status.first');
    if (lastEvent?.kind === 'match') return t('status.match');
    return t('status.start');
  };

  const setFocusIndex = (index: number) => {
    focusIndex = index;
    cards.forEach((card, i) => (card.tabIndex = i === index ? 0 : -1));
  };

  const update = () => {
    if (!state) return;
    const s = state;
    cards.forEach((button, position) => {
      const view = cardView(s, position);
      button.dataset.state = view;
      button.setAttribute('aria-label', label(s, position, view));
      if (view === 'matched') button.setAttribute('aria-disabled', 'true');
      else button.removeAttribute('aria-disabled');
      if (shown[position] !== view) {
        const front = button.querySelector('.wp-memory__front');
        if (front) {
          clear(front);
          // Hidden cards never carry their content in the DOM.
          if (view !== 'hidden') {
            const { side, description } = describe(s, position);
            front.append(renderSide(side, description));
          }
        }
        shown[position] = view;
      }
    });
    movesEl.textContent = t('status.moves', { moves: s.moves });
    pairsEl.textContent = t('status.pairs', { found: matchedPairs(s), total: s.itemIds.length });
    statusEl.textContent = statusText(s);
    continueButton.hidden = !hasPendingMismatch(s);
  };

  const mount = () => {
    if (!state) return;
    disposeKeyboard?.();
    clear(board);
    shown = [];
    lastEvent = undefined;
    const { columns } = BOARD[state.difficulty];
    board.style.setProperty('--wp-memory-columns', String(columns));
    cards = state.cards.map((_, position) =>
      h(
        'button',
        { type: 'button', class: 'wp-memory__card', 'data-cell': true, 'data-position': position, 'data-testid': `card-${position}`, tabindex: -1 },
        h('span', { class: 'wp-memory__back', 'aria-hidden': 'true' }),
        h('span', { class: 'wp-memory__front' })
      )
    );
    board.append(...cards);
    disposeKeyboard = gridKeyboard(board, columns);
    setFocusIndex(Math.min(focusIndex, cards.length - 1));
    update();
    if (!container.isConnected || container.parentElement !== root) {
      clear(root);
      root.append(container);
    }
  };

  const describeEvent = (s: MemoryState, event: MemoryEvent): string => {
    switch (event.kind) {
      case 'first':
        return label(s, event.position, 'revealed');
      case 'match': {
        const parts = [t('announce.match', { content: describe(s, event.positions[0]).description }), t('status.pairs', { found: matchedPairs(s), total: s.itemIds.length })];
        if (isFinished(s)) parts.push(t('status.finished', { moves: s.moves }));
        return parts.join(' ');
      }
      case 'mismatch':
        return `${t('announce.mismatch', { first: describe(s, event.positions[0]).description, second: describe(s, event.positions[1]).description })} ${t('status.mismatch')}`;
      case 'hid':
        return t('announce.hidden');
      default:
        return '';
    }
  };

  const apply = (next: MemoryState, event: MemoryEvent) => {
    const wasFinished = state ? isFinished(state) : false;
    state = next;
    lastEvent = event;
    const refocus = document.activeElement === continueButton && !hasPendingMismatch(next);
    update();
    if (refocus) cards[focusIndex]?.focus();
    announce(live, describeEvent(next, event));
    context.requestSave();
    if (!wasFinished && isFinished(next)) context.finished({ outcome: 'completed', stats: { moves: next.moves } });
  };

  const activate = (position: number) => {
    if (!state || paused) return;
    const result = select(state, position);
    if (result.event.kind === 'ignored') return;
    setFocusIndex(position);
    apply(result.state, result.event);
  };

  const proceed = () => {
    if (!state || paused || !hasPendingMismatch(state)) return;
    apply(dismiss(state), { kind: 'hid' });
  };

  // One delegated handler: cards select; any other tap inside the game ("tap anywhere")
  // or the Continue button turns a pending mismatch face down again.
  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    const cell = target?.closest<HTMLElement>('[data-cell]');
    if (cell && board.contains(cell)) activate(Number(cell.dataset.position));
    else proceed();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && state && hasPendingMismatch(state)) {
      event.preventDefault();
      proceed();
    }
  };
  container.addEventListener('click', onClick);
  container.addEventListener('keydown', onKeyDown);

  const start = (seed: number, difficulty: MemoryState['difficulty'], deckId: string) => {
    const deck = getDeck(deckId) ?? getDeck(DEFAULT_DECK_ID);
    if (!deck) throw new Error('No deck available');
    state = deal(deck.deck, difficulty, seed);
    focusIndex = 0;
    mount();
    context.requestSave();
  };

  return {
    newGame(options: NewGameOptions) {
      start(options.seed, toDifficulty(options.difficulty), DEFAULT_DECK_ID);
    },
    restore(saved: MemoryState) {
      state = clone(saved);
      focusIndex = 0;
      mount();
    },
    serialize() {
      if (!state) throw new Error('No game in progress');
      return clone(state);
    },
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    reset() {
      if (state) start(state.seed, state.difficulty, state.deckId);
    },
    dispose() {
      disposeKeyboard?.();
      disposeKeyboard = undefined;
      container.removeEventListener('click', onClick);
      container.removeEventListener('keydown', onKeyDown);
      clear(root);
      state = undefined;
      cards = [];
    }
  };
}
