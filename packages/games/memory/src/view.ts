import './styles.css';
import type { GameContext, GameInstance, NewGameOptions } from '@wp/game-core';
import { pickText, resolveContentLanguages, SYMBOL_DECK, type CardSide } from '@wp/learning-content';
import { announce, clear, gridKeyboard, h } from '@wp/ui';
import { BUILTIN_CHOICES, builtinDeal, choiceOf, faceResolver, parseChoice, userDeck, type CardChoice, type CardFace, type FaceResolver } from './decks';
import {
  BOARD,
  cardView,
  deal,
  dismiss,
  hasPendingMismatch,
  isFinished,
  matchedPairs,
  MIN_PAIRS,
  select,
  toDifficulty,
  type CardView,
  type Difficulty,
  type MemoryEvent,
  type MemoryState
} from './rules';
import { browserSpeech, type Speech } from './speech';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
let instanceCounter = 0;

/** Preference key for the chosen cards (a `CardChoice`), remembered for fresh games on this device. */
export const CARDS_PREFERENCE = 'cards';

const CHOICE_LABEL: Readonly<Record<(typeof BUILTIN_CHOICES)[number], string>> = {
  symbols: 'cards.symbols',
  'picture-word': 'cards.pictureWord',
  'word-translation': 'cards.wordTranslation',
  'flag-country': 'cards.flags'
};

/**
 * Renders one side of a learning item generically, so that symbol, image, text (and
 * combinations) decks all work with the same view.
 */
export function renderSide(side: CardSide, description: string): HTMLElement {
  const face = h('span', { class: 'wp-memory__face' });
  if (side.image) face.append(h('img', { class: 'wp-memory__image', src: side.image, alt: description, draggable: 'false' }));
  if (side.symbol) face.append(h('span', { class: 'wp-memory__symbol', role: 'img', 'aria-label': description }, side.symbol));
  if (side.text) face.append(h('span', { class: 'wp-memory__text', lang: side.lang, dir: 'auto' }, side.text));
  // Audio sides are not played yet (bundled audio packs are a later increment); text can be read aloud.
  return face;
}

export function createMemory(context: GameContext, speech: Speech | undefined = browserSpeech()): GameInstance<MemoryState> {
  const { root, t } = context;
  const uid = `wp-memory-${++instanceCounter}`;
  let state: MemoryState | undefined;
  let faces: FaceResolver | undefined;
  let lastEvent: MemoryEvent | undefined;
  let paused = false;
  let focusIndex = 0;
  let shown: CardView[] = [];
  let cards: HTMLButtonElement[] = [];
  let disposeKeyboard: (() => void) | undefined;
  let speakTarget: { text: string; lang: string } | undefined;
  const remembered = parseChoice(context.preferences?.get(CARDS_PREFERENCE));
  let choice: CardChoice = remembered ? (remembered.variant === 'own' ? `own:${remembered.deckId ?? ''}` : remembered.variant) : 'symbols';

  const languageName = (tag: string | undefined): string => {
    if (!tag) return '';
    try {
      return new Intl.DisplayNames([t.locale], { type: 'language' }).of(tag) ?? tag;
    } catch {
      return tag;
    }
  };

  // --- Elements ---------------------------------------------------------------------------
  const cardSelect = h('select', { id: `${uid}-cards`, 'data-testid': 'memory-cards', 'aria-describedby': `${uid}-hint` });
  const languagesEl = h('p', { class: 'wp-memory__languages', 'data-testid': 'memory-languages' });
  const options = h(
    'div',
    { class: 'wp-memory__options', 'data-keep': '' },
    h('div', { class: 'wp-memory__field' }, h('label', { for: `${uid}-cards` }, t('cards.label')), cardSelect),
    languagesEl,
    h('p', { class: 'wp-memory__hint', id: `${uid}-hint` }, t('cards.hint'))
  );
  const noticeEl = h('p', { class: 'wp-memory__notice', role: 'status', 'data-testid': 'memory-notice', hidden: true });
  const newGameButton = h('button', { type: 'button', 'data-testid': 'memory-missing-new' }, t('deck.newGame'));
  const missingEl = h('div', { class: 'wp-memory__missing', role: 'alert', 'data-testid': 'memory-missing', 'data-keep': '', hidden: true }, h('p', {}, t('deck.missing')), newGameButton);
  const movesEl = h('span', { 'data-testid': 'memory-moves' });
  const pairsEl = h('span', { 'data-testid': 'memory-pairs' });
  const statusEl = h('p', { class: 'wp-status wp-memory__status', 'data-testid': 'memory-status' });
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status' });
  const board = h('div', { class: 'wp-memory__board', role: 'group', 'aria-label': t('board'), 'data-testid': 'memory-board' });
  const continueButton = h('button', { type: 'button', class: 'primary', 'data-testid': 'memory-continue', hidden: true }, t('continue'));
  const speakButton = h('button', { type: 'button', class: 'wp-memory__speak', 'data-testid': 'memory-speak', 'data-keep': '', hidden: true }, h('span', { 'aria-hidden': 'true' }, '🔊 '), t('speak'));
  const container = h(
    'div',
    { class: `wp-memory${context.reducedMotion ? '' : ' wp-memory--motion'}`, dir: t.direction },
    options,
    noticeEl,
    missingEl,
    h('div', { class: 'wp-memory__info' }, movesEl, pairsEl),
    statusEl,
    board,
    h('div', { class: 'wp-memory__actions' }, continueButton, speakButton),
    live
  );

  // --- Content ----------------------------------------------------------------------------
  const describe = (s: MemoryState, position: number): CardFace => {
    const card = s.cards[position];
    return card && faces ? faces(card) : { side: {}, description: '' };
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

  const languagesText = (s: MemoryState): string => {
    switch (s.variant) {
      case 'picture-word':
        return t('languages.words', { language: languageName(s.languages.back) });
      case 'word-translation':
        return t('languages.pair', { learning: languageName(s.languages.front), translation: languageName(s.languages.back) });
      case 'flag-country':
        return t('languages.countries', { language: languageName(s.languages.back) });
      default:
        return '';
    }
  };

  const renderOptions = () => {
    const selected = state ? choiceOf(state) : choice;
    clear(cardSelect);
    cardSelect.append(...BUILTIN_CHOICES.map((c) => h('option', { value: c, selected: c === selected }, t(CHOICE_LABEL[c]))));
    const own = context.userDecks?.list() ?? [];
    if (own.length > 0) {
      cardSelect.append(
        h('optgroup', { label: t('cards.own') },
          ...own.map((deck) => {
            const value = `own:${deck.id}`;
            return h('option', { value, selected: value === selected, disabled: deck.itemCount < MIN_PAIRS }, t('cards.ownItem', { title: pickText(deck.title, t.locale), count: deck.itemCount }));
          })
        )
      );
    }
  };

  // --- Rendering --------------------------------------------------------------------------
  const setFocusIndex = (index: number) => {
    focusIndex = index;
    cards.forEach((card, i) => (card.tabIndex = i === index ? 0 : -1));
  };

  const updateSpeak = () => {
    const available = Boolean(speakTarget && speech?.canSpeak(speakTarget.lang));
    speakButton.hidden = !available;
    if (available && speakTarget) speakButton.setAttribute('aria-label', t('speak.label', { text: speakTarget.text }));
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
    updateSpeak();
  };

  const mount = () => {
    if (!state) return;
    disposeKeyboard?.();
    clear(board);
    shown = [];
    lastEvent = undefined;
    speakTarget = undefined;
    renderOptions();
    const text = languagesText(state);
    languagesEl.textContent = text;
    languagesEl.hidden = text === '';
    // A user deck that was deleted after this game was saved: explain and offer a fresh start.
    const missing = faces === undefined;
    missingEl.hidden = !missing;
    board.hidden = missing;
    statusEl.hidden = missing;
    const { columns } = BOARD[state.difficulty];
    board.style.setProperty('--wp-memory-columns', String(columns));
    cards = missing
      ? []
      : state.cards.map((_, position) =>
          h(
            'button',
            { type: 'button', class: 'wp-memory__card', 'data-cell': true, 'data-position': position, 'data-testid': `card-${position}`, tabindex: -1 },
            h('span', { class: 'wp-memory__back', 'aria-hidden': 'true' }),
            h('span', { class: 'wp-memory__front' })
          )
        );
    board.append(...cards);
    disposeKeyboard = gridKeyboard(board, columns);
    setFocusIndex(Math.min(focusIndex, Math.max(cards.length - 1, 0)));
    update();
    if (!container.isConnected || container.parentElement !== root) {
      clear(root);
      root.append(container);
    }
  };

  const showNotice = (text: string) => {
    noticeEl.textContent = text;
    noticeEl.hidden = text === '';
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

  /** The card just turned over, if it has text that could be read aloud. */
  const speakableOf = (s: MemoryState, event: MemoryEvent): { text: string; lang: string } | undefined => {
    const position = event.kind === 'first' ? event.position : event.kind === 'match' || event.kind === 'mismatch' ? event.positions[1] : undefined;
    if (position === undefined) return undefined;
    const { side } = describe(s, position);
    return side.text && side.lang ? { text: side.text, lang: side.lang } : undefined;
  };

  const apply = (next: MemoryState, event: MemoryEvent) => {
    const wasFinished = state ? isFinished(state) : false;
    state = next;
    lastEvent = event;
    speakTarget = speakableOf(next, event);
    const refocus = document.activeElement === continueButton && !hasPendingMismatch(next);
    update();
    if (refocus) cards[focusIndex]?.focus();
    announce(live, describeEvent(next, event));
    context.requestSave();
    if (!wasFinished && isFinished(next)) context.finished({ outcome: 'completed', stats: { moves: next.moves } });
  };

  const activate = (position: number) => {
    if (!state || paused || !faces) return;
    const result = select(state, position);
    if (result.event.kind === 'ignored') return;
    setFocusIndex(position);
    apply(result.state, result.event);
  };

  const proceed = () => {
    if (!state || paused || !hasPendingMismatch(state)) return;
    apply(dismiss(state), { kind: 'hid' });
  };

  // --- Dealing ------------------------------------------------------------------------------
  /** Deals cards for a choice. A user deck that is gone (or too small) falls back to picture pairs with a notice. */
  const dealFor = (seed: number, difficulty: Difficulty, wanted: CardChoice): { next: MemoryState; notice: string } => {
    const parsed = parseChoice(wanted) ?? { variant: 'symbols' as const };
    if (parsed.variant === 'own') {
      const deck = userDeck(context.userDecks, parsed.deckId ?? '');
      if (deck && deck.items.length >= MIN_PAIRS) return { next: deal(deck, difficulty, seed, { variant: 'own' }), notice: '' };
      return { next: deal(SYMBOL_DECK, difficulty, seed), notice: t('deck.fallback') };
    }
    const { deck, languages } = builtinDeal(parsed.variant, context.contentLanguages, t.locale);
    let notice = '';
    const resolved = resolveContentLanguages(context.contentLanguages, t.locale);
    if ((parsed.variant === 'picture-word' || parsed.variant === 'word-translation') && resolved.learningFallback) {
      notice = t('languages.fallback', { language: languageName(context.contentLanguages?.learning) });
    }
    return { next: deal(deck, difficulty, seed, { variant: parsed.variant, languages }), notice };
  };

  const start = (seed: number, difficulty: Difficulty, wanted: CardChoice) => {
    const { next, notice } = dealFor(seed, difficulty, wanted);
    state = next;
    faces = faceResolver(next, t, context.userDecks);
    focusIndex = 0;
    showNotice(notice);
    mount();
    context.requestSave();
  };

  /** Exactly the initial state of the current game (same seed, difficulty, deck and recorded languages). */
  const redeal = (s: MemoryState): MemoryState => {
    if (s.variant === 'own') {
      const deck = userDeck(context.userDecks, s.deckId);
      return deck && deck.items.length >= MIN_PAIRS ? deal(deck, s.difficulty, s.seed, { variant: 'own' }) : deal(SYMBOL_DECK, s.difficulty, s.seed);
    }
    // Item order (and therefore the deal) does not depend on languages; the recorded languages are kept.
    return deal(builtinDeal(s.variant, undefined, t.locale).deck, s.difficulty, s.seed, { variant: s.variant, languages: s.languages });
  };

  // --- Events -------------------------------------------------------------------------------
  // One delegated handler: cards select; any other tap inside the game ("tap anywhere")
  // or the Continue button turns a pending mismatch face down again. Controls marked
  // data-keep (card choice, read aloud) never do.
  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('[data-keep]')) return;
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
  const onChoose = () => {
    const parsed = parseChoice(cardSelect.value);
    if (!parsed || paused) return;
    choice = cardSelect.value as CardChoice;
    context.preferences?.set(CARDS_PREFERENCE, choice);
    start(state?.seed ?? 0, state?.difficulty ?? 'small', choice);
    cardSelect.focus();
  };
  const onMissingNewGame = () => {
    if (!state || paused) return;
    choice = 'symbols';
    context.preferences?.set(CARDS_PREFERENCE, choice);
    start(state.seed, state.difficulty, choice);
    cards[0]?.focus();
  };
  const onSpeak = () => {
    if (speakTarget) speech?.speak(speakTarget.text, speakTarget.lang);
  };
  const disposeVoices = speech?.onVoicesChanged(updateSpeak);
  container.addEventListener('click', onClick);
  container.addEventListener('keydown', onKeyDown);
  cardSelect.addEventListener('change', onChoose);
  newGameButton.addEventListener('click', onMissingNewGame);
  speakButton.addEventListener('click', onSpeak);

  return {
    newGame(opts: NewGameOptions) {
      start(opts.seed, toDifficulty(opts.difficulty), choice);
    },
    restore(saved: MemoryState) {
      state = clone(saved);
      faces = faceResolver(state, t, context.userDecks);
      // "New game" continues with the cards shown in the menu (unless that deck is gone).
      if (faces) choice = choiceOf(state);
      focusIndex = 0;
      showNotice('');
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
      if (!state) return;
      state = redeal(state);
      faces = faceResolver(state, t, context.userDecks);
      focusIndex = 0;
      mount();
      context.requestSave();
    },
    dispose() {
      disposeKeyboard?.();
      disposeKeyboard = undefined;
      disposeVoices?.();
      container.removeEventListener('click', onClick);
      container.removeEventListener('keydown', onKeyDown);
      cardSelect.removeEventListener('change', onChoose);
      newGameButton.removeEventListener('click', onMissingNewGame);
      speakButton.removeEventListener('click', onSpeak);
      clear(root);
      state = undefined;
      cards = [];
    }
  };
}
