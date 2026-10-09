import './styles.css';
import type { GameContext, GameInstance, LearningRating, NewGameOptions } from '@wp/game-core';
import { browserSpeech, pickText, type CardSide, type Speech } from '@wp/learning-content';
import { announce, clear, h } from '@wp/ui';
import { deckItemIds, faceResolver, hasAllItems, isBuiltinReviewDeck, sessionLanguages, userDeck, type CardFaces, type FaceResolver } from './decks';
import {
  availableCounts,
  BUILTIN_REVIEW_DECKS,
  currentCard,
  DEFAULT_DECK,
  DIRECTION_CHOICES,
  isFinished,
  matchesAnswer,
  rate,
  RATINGS,
  recordDeckOf,
  restart,
  reveal,
  reviewsOf,
  startSession,
  summary,
  type DirectionChoice,
  type Mode,
  type ReviewState
} from './rules';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
let instanceCounter = 0;

/** Per-device preferences: the deck and direction of the next session. */
export const DECK_PREFERENCE = 'deck';
export const DIRECTION_PREFERENCE = 'direction';

const DECK_LABEL: Readonly<Record<(typeof BUILTIN_REVIEW_DECKS)[number], string>> = { 'first-words': 'deck.firstWords', flags: 'deck.flags' };
const RATING_SYMBOL: Readonly<Record<LearningRating, string>> = { again: '↺', hard: '≈', good: '✓' };

/** Renders one card side (symbol, image, text in any combination). */
export function renderSide(side: CardSide, description: string): HTMLElement {
  const face = h('div', { class: 'wp-review__face' });
  if (side.image) face.append(h('img', { class: 'wp-review__image', src: side.image, alt: description, draggable: 'false' }));
  if (side.symbol) face.append(h('span', { class: 'wp-review__symbol', role: 'img', 'aria-label': description }, side.symbol));
  if (side.text) face.append(h('span', { class: 'wp-review__text', lang: side.lang, dir: 'auto' }, side.text));
  return face;
}

export function createReview(context: GameContext, speech: Speech | undefined = browserSpeech()): GameInstance<ReviewState> {
  const { root, t, learning } = context;
  const uid = `wp-review-${++instanceCounter}`;
  let state: ReviewState | undefined;
  let faces: FaceResolver | undefined;
  let paused = false;
  let launch = context.launch?.deck;
  let wantedDirection: DirectionChoice = (DIRECTION_CHOICES as readonly unknown[]).includes(context.preferences?.get(DIRECTION_PREFERENCE))
    ? (context.preferences?.get(DIRECTION_PREFERENCE) as DirectionChoice)
    : 'forward';

  const today = () => {
    try {
      return learning?.today() ?? '';
    } catch {
      return '';
    }
  };
  const recordsOf = (deckKey: string) => {
    try {
      return learning?.list(deckKey) ?? [];
    } catch {
      return [];
    }
  };
  const send = (reviews: Parameters<NonNullable<typeof learning>['record']>[0]) => {
    if (reviews.length === 0) return;
    try {
      learning?.record(reviews);
    } catch {
      /* records are best effort; the session itself is saved */
    }
  };
  const languageName = (tag: string | undefined): string => {
    if (!tag) return '';
    try {
      return new Intl.DisplayNames([t.locale], { type: 'language' }).of(tag) ?? tag;
    } catch {
      return tag;
    }
  };

  // --- Elements ---------------------------------------------------------------------------
  const deckSelect = h('select', { id: `${uid}-deck`, 'data-testid': 'review-deck' });
  const directionSelect = h('select', { id: `${uid}-direction`, 'data-testid': 'review-direction' },
    ...DIRECTION_CHOICES.map((d) => h('option', { value: d }, t(`direction.${d}`)))
  );
  const modeSelect = h('select', { id: `${uid}-mode`, 'data-testid': 'review-mode' });
  const modeField = h('div', { class: 'wp-review__field' }, h('label', { for: `${uid}-mode` }, t('options.mode')), modeSelect);
  const languagesEl = h('p', { class: 'wp-review__muted', 'data-testid': 'review-languages' });
  const options = h('div', { class: 'wp-review__options' },
    h('div', { class: 'wp-review__fields' },
      h('div', { class: 'wp-review__field' }, h('label', { for: `${uid}-deck` }, t('options.deck')), deckSelect),
      h('div', { class: 'wp-review__field' }, h('label', { for: `${uid}-direction` }, t('options.direction')), directionSelect),
      modeField
    ),
    languagesEl,
    h('p', { class: 'wp-review__muted' }, t('options.hint'))
  );
  const noticeEl = h('p', { class: 'wp-review__notice', role: 'status', 'data-testid': 'review-notice', hidden: true });
  const practiceNote = h('p', { class: 'wp-review__notice', 'data-testid': 'review-practice-only', hidden: true }, t('practiceOnly'));

  const missingNew = h('button', { type: 'button', 'data-testid': 'review-missing-new' }, t('missing.new'));
  const missingEl = h('div', { class: 'wp-review__panel', role: 'alert', 'data-testid': 'review-missing', hidden: true }, h('p', {}, t('missing.text')), missingNew);

  const learnNew = h('button', { type: 'button', class: 'primary', 'data-testid': 'review-learn-new' });
  const practise = h('button', { type: 'button', 'data-testid': 'review-practice' }, t('empty.practice'));
  const emptyEl = h('section', { class: 'wp-review__panel', 'data-testid': 'review-empty', 'aria-labelledby': `${uid}-empty`, hidden: true },
    h('h2', { id: `${uid}-empty`, tabindex: '-1' }, t('empty.title')),
    h('p', {}, t('empty.text')),
    h('div', { class: 'wp-review__buttons' }, learnNew, practise),
    h('p', { class: 'wp-review__muted' }, t('empty.stop'))
  );

  const progressEl = h('p', { class: 'wp-review__progress', 'data-testid': 'review-progress' });
  const promptEl = h('div', { class: 'wp-review__side wp-review__side--prompt', 'data-testid': 'review-prompt' });
  const answerEl = h('div', { class: 'wp-review__side wp-review__side--answer', 'data-testid': 'review-answer', tabindex: '-1', hidden: true });
  const cardEl = h('div', { class: 'wp-review__card', role: 'group', 'aria-label': t('card.label') },
    h('p', { class: 'wp-review__caption', 'aria-hidden': 'true' }, t('card.question')),
    promptEl,
    answerEl
  );
  const typedInput = h('input', { type: 'text', id: `${uid}-typed`, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', dir: 'auto', maxlength: 300, 'data-testid': 'review-typed' });
  const typedField = h('div', { class: 'wp-review__typed' }, h('label', { for: `${uid}-typed` }, t('typed.label')), typedInput);
  const revealButton = h('button', { type: 'submit', class: 'primary', 'data-testid': 'review-reveal', 'data-autofocus': '' }, t('reveal'));
  const revealForm = h('form', { class: 'wp-review__reveal', novalidate: true }, typedField, revealButton);
  const typedResult = h('p', { class: 'wp-review__typed-result', 'data-testid': 'review-typed-result', hidden: true });
  const rateButtons = RATINGS.map((rating) =>
    h('button', { type: 'button', class: `wp-review__rate wp-review__rate--${rating}`, 'data-rating': rating, 'data-testid': `review-rate-${rating}` },
      h('span', { 'aria-hidden': 'true', class: 'wp-review__rate-symbol' }, RATING_SYMBOL[rating]),
      h('span', {}, t(`rate.${rating}`))
    )
  );
  const rateEl = h('div', { class: 'wp-review__rating', role: 'group', 'aria-labelledby': `${uid}-rate`, hidden: true },
    h('p', { id: `${uid}-rate`, class: 'wp-review__muted' }, t('rate.prompt')),
    h('div', { class: 'wp-review__buttons' }, ...rateButtons)
  );
  const speakButton = h('button', { type: 'button', class: 'wp-review__speak', 'data-testid': 'review-speak', hidden: true }, h('span', { 'aria-hidden': 'true' }, '🔊 '), t('speak'));
  const sessionEl = h('div', { class: 'wp-review__session', 'data-testid': 'review-session', hidden: true }, progressEl, cardEl, revealForm, typedResult, rateEl, speakButton);

  const summaryEl = h('section', { class: 'wp-review__panel', 'data-testid': 'review-summary', 'aria-labelledby': `${uid}-summary`, hidden: true });
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status' });
  const schedule = h('details', { class: 'wp-review__schedule' }, h('summary', {}, t('schedule.title')), h('p', {}, t('schedule.text')));
  const container = h('div', { class: `wp-review${context.reducedMotion ? '' : ' wp-review--motion'}`, dir: t.direction },
    options, noticeEl, practiceNote, missingEl, emptyEl, sessionEl, summaryEl, schedule, live
  );

  // --- Content ----------------------------------------------------------------------------
  const facesOf = (s: ReviewState): CardFaces | undefined => {
    const card = currentCard(s);
    return card && faces ? faces(card) : undefined;
  };

  const renderDeckOptions = (selected: string) => {
    clear(deckSelect);
    deckSelect.append(...BUILTIN_REVIEW_DECKS.map((id) => h('option', { value: id, selected: id === selected }, t(DECK_LABEL[id]))));
    const own = context.userDecks?.list() ?? [];
    if (own.length > 0) {
      deckSelect.append(
        h('optgroup', { label: t('deck.own') },
          ...own.map((deck) => h('option', { value: deck.id, selected: deck.id === selected }, t('deck.ownItem', { title: pickText(deck.title, t.locale), count: deck.itemCount })))
        )
      );
    }
    // A saved session's deck that is gone stays selected (as a placeholder) until a new session starts.
    if (!Array.from(deckSelect.options).some((o) => o.value === selected)) deckSelect.append(h('option', { value: selected, selected: true, disabled: true }, '—'));
  };

  const renderModeOptions = (s: ReviewState) => {
    clear(modeSelect);
    modeField.hidden = !learning;
    if (!learning) return;
    const ids = deckItemIds(s.deckId, context.userDecks) ?? [];
    const counts = availableCounts(ids, recordsOf(recordDeckOf(s)), s.direction, today());
    const label: Record<Mode, string> = { review: t('mode.review', { count: counts.due }), new: t('mode.new', { count: counts.unseen }), practice: t('mode.practice') };
    modeSelect.append(...(['review', 'new', 'practice'] as const).map((m) => h('option', { value: m, selected: m === s.mode }, label[m])));
    learnNew.textContent = t('empty.new', { count: counts.unseen });
    learnNew.hidden = counts.unseen === 0;
  };

  const languagesText = (s: ReviewState): string => {
    if (s.deckId === 'first-words') return t('languages.words', { learning: languageName(s.languages.learning), translation: languageName(s.languages.translation) });
    if (s.deckId === 'flags') return t('languages.countries', { language: languageName(s.languages.countries) });
    return '';
  };

  const renderSummary = (s: ReviewState) => {
    const counts = summary(s);
    clear(summaryEl);
    summaryEl.append(
      h('h2', { id: `${uid}-summary`, tabindex: '-1' }, t('summary.title')),
      h('p', { 'data-testid': 'review-summary-counts' }, t('summary.counts', { cards: counts.cards, good: counts.good, hard: counts.hard, again: counts.again })),
      h('p', { class: 'wp-review__muted' }, s.mode === 'practice' ? t('summary.practice') : t('summary.saved'))
    );
  };

  const speakTarget = (s: ReviewState): { text: string; lang: string } | undefined => {
    const f = facesOf(s);
    const side = f ? (s.revealed ? f.answer.side : f.prompt.side) : undefined;
    return side?.text && side.lang ? { text: side.text, lang: side.lang } : undefined;
  };

  const updateSpeak = () => {
    const target = state ? speakTarget(state) : undefined;
    const available = Boolean(target && speech?.canSpeak(target.lang));
    speakButton.hidden = !available || sessionEl.hidden;
    if (available && target) speakButton.setAttribute('aria-label', t('speak.label', { text: target.text }));
  };

  /** Updates everything from the state; `fresh` re-renders the card faces. */
  const render = () => {
    if (!state) return;
    const s = state;
    renderDeckOptions(s.deckId);
    directionSelect.value = s.direction;
    renderModeOptions(s);
    const text = faces ? languagesText(s) : '';
    languagesEl.textContent = text;
    languagesEl.hidden = text === '';
    practiceNote.hidden = Boolean(learning);

    const missing = faces === undefined;
    const empty = !missing && s.cards.length === 0;
    const done = !missing && isFinished(s);
    missingEl.hidden = !missing;
    emptyEl.hidden = !empty;
    summaryEl.hidden = !done;
    sessionEl.hidden = missing || empty || done;
    if (done) renderSummary(s);

    const f = facesOf(s);
    clear(promptEl);
    clear(answerEl);
    if (!sessionEl.hidden && f) {
      const card = currentCard(s);
      const total = s.cards.length;
      clear(progressEl);
      progressEl.append(t('progress', { n: s.index + 1, total }));
      if (card?.repeat) progressEl.append(' ', h('span', { class: 'wp-review__badge', 'data-testid': 'review-repeat' }, t('progress.repeat')));
      promptEl.append(renderSide(f.prompt.side, f.prompt.description));
      answerEl.hidden = !s.revealed;
      if (s.revealed) answerEl.append(h('p', { class: 'wp-review__caption', 'aria-hidden': 'true' }, t('card.answer')), renderSide(f.answer.side, f.answer.description));
      const canType = Boolean(f.answer.side.text);
      revealForm.hidden = s.revealed;
      typedField.hidden = !canType;
      rateEl.hidden = !s.revealed;
      typedResult.hidden = !(s.revealed && s.typed !== null);
      if (s.revealed && s.typed !== null) {
        const ok = matchesAnswer(s.typed, f.answer.side.text ?? '');
        typedResult.dataset.match = String(ok);
        typedResult.textContent = `${t('typed.yours', { answer: s.typed })} ${ok ? '✓' : '≠'} ${t(ok ? 'typed.match' : 'typed.differ')}`;
      }
    }
    updateSpeak();
    if (!container.isConnected || container.parentElement !== root) {
      clear(root);
      root.append(container);
    }
  };

  const showNotice = (text: string) => {
    noticeEl.textContent = text;
    noticeEl.hidden = text === '';
  };

  const focusCurrent = () => {
    if (!state) return;
    if (!summaryEl.hidden) summaryEl.querySelector<HTMLElement>('h2')?.focus();
    else if (!emptyEl.hidden) emptyEl.querySelector<HTMLElement>('h2')?.focus();
    else if (!rateEl.hidden) answerEl.focus();
    else if (!typedField.hidden) typedInput.focus();
    else revealButton.focus();
  };

  const announceCard = () => {
    if (!state) return;
    const f = facesOf(state);
    if (isFinished(state)) announce(live, `${t('summary.title')}. ${summaryEl.querySelector('[data-testid="review-summary-counts"]')?.textContent ?? ''}`);
    else if (state.cards.length === 0) announce(live, t('empty.title'));
    else if (f) announce(live, state.revealed ? t('announce.revealed', { answer: f.answer.description }) : t('announce.card', { n: state.index + 1, total: state.cards.length, prompt: f.prompt.description }));
  };

  // --- Sessions -------------------------------------------------------------------------------
  /** Starts a session on `deckId` (falls back to First words if that deck is not available). */
  const start = (seed: number, deckId: string, direction: DirectionChoice, mode: Mode) => {
    let deck = deckId;
    let notice = '';
    let ids = deckItemIds(deck, context.userDecks);
    if (!ids || ids.length === 0) {
      deck = DEFAULT_DECK;
      ids = deckItemIds(deck, context.userDecks) ?? [];
      notice = t('deck.fallback');
    }
    const { languages, learningFallback } = sessionLanguages(deck, context.contentLanguages, t.locale);
    if (learningFallback) notice = t('languages.fallback', { language: languageName(context.contentLanguages?.learning) });
    const key = recordDeckOf({ deckId: deck, languages });
    state = startSession({ seed, deckId: deck, languages, direction, mode: learning ? mode : 'practice', itemIds: ids, records: recordsOf(key), today: today() });
    faces = faceResolver(state, t, context.userDecks);
    typedInput.value = '';
    showNotice(notice);
    render();
    context.requestSave();
  };

  const onReveal = (event: Event) => {
    event.preventDefault();
    if (!state || paused || state.revealed) return;
    const next = reveal(state, typedField.hidden ? undefined : typedInput.value);
    if (next === state) return;
    state = next;
    render();
    focusCurrent();
    announceCard();
    context.requestSave();
  };

  const onRate = (event: MouseEvent) => {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-rating]');
    if (!button || !state || paused) return;
    const wasFinished = isFinished(state);
    const result = rate(state, button.dataset.rating as LearningRating, today(), recordDeckOf(state));
    if (result.state === state) return;
    state = result.state;
    if (result.review) send([result.review]);
    typedInput.value = '';
    render();
    focusCurrent();
    announceCard();
    context.requestSave();
    if (!wasFinished && isFinished(state)) {
      const counts = summary(state);
      context.finished({ outcome: 'completed', stats: { cards: counts.cards, good: counts.good, hard: counts.hard, again: counts.again } });
    }
  };

  const restartWith = (changes: { deck?: string; direction?: DirectionChoice; mode?: Mode }) => {
    if (!state || paused) return;
    start(state.seed, changes.deck ?? state.deckId, changes.direction ?? state.direction, changes.mode ?? (learning ? 'review' : 'practice'));
  };

  const onDeck = () => {
    if (!state || deckSelect.value === state.deckId) return;
    context.preferences?.set(DECK_PREFERENCE, deckSelect.value);
    restartWith({ deck: deckSelect.value });
    deckSelect.focus();
  };
  const onDirection = () => {
    const value = directionSelect.value as DirectionChoice;
    if (!state || !(DIRECTION_CHOICES as readonly string[]).includes(value) || value === state.direction) return;
    wantedDirection = value;
    context.preferences?.set(DIRECTION_PREFERENCE, value);
    restartWith({ direction: value, mode: state.mode });
    directionSelect.focus();
  };
  const onMode = () => {
    const value = modeSelect.value as Mode;
    if (!state || value === state.mode) return;
    restartWith({ mode: value });
    modeSelect.focus();
  };
  const onLearnNew = () => {
    restartWith({ mode: 'new' });
    focusCurrent();
  };
  const onPractise = () => {
    restartWith({ mode: 'practice' });
    focusCurrent();
  };
  const onMissingNew = () => {
    if (!state || paused) return;
    context.preferences?.set(DECK_PREFERENCE, DEFAULT_DECK);
    start(state.seed, DEFAULT_DECK, state.direction, learning ? 'review' : 'practice');
    focusCurrent();
  };
  const onSpeak = () => {
    const target = state ? speakTarget(state) : undefined;
    if (target) speech?.speak(target.text, target.lang);
  };

  const disposeVoices = speech?.onVoicesChanged(updateSpeak);
  revealForm.addEventListener('submit', onReveal);
  rateEl.addEventListener('click', onRate);
  deckSelect.addEventListener('change', onDeck);
  directionSelect.addEventListener('change', onDirection);
  modeSelect.addEventListener('change', onMode);
  learnNew.addEventListener('click', onLearnNew);
  practise.addEventListener('click', onPractise);
  missingNew.addEventListener('click', onMissingNew);
  speakButton.addEventListener('click', onSpeak);

  /** Deck for a new session: the link that opened the game, else the remembered one, else First words. */
  const chosenDeck = (): string => {
    const fromLaunch = launch;
    launch = undefined;
    for (const candidate of [fromLaunch, context.preferences?.get(DECK_PREFERENCE)]) {
      if (typeof candidate === 'string' && (isBuiltinReviewDeck(candidate) || userDeck(context.userDecks, candidate))) {
        if (candidate === fromLaunch) context.preferences?.set(DECK_PREFERENCE, candidate);
        return candidate;
      }
    }
    return DEFAULT_DECK;
  };

  return {
    newGame(opts: NewGameOptions) {
      start(opts.seed, chosenDeck(), wantedDirection, learning ? 'review' : 'practice');
    },
    restore(saved: ReviewState) {
      state = clone(saved);
      faces = hasAllItems(state, context.userDecks) ? faceResolver(state, t, context.userDecks) : undefined;
      // Ratings of this session are sent again: the records ignore what they already have, and anything that was
      // lost when the page closed before the records were written is completed.
      if (faces) send(reviewsOf(state, recordDeckOf(state)));
      typedInput.value = '';
      showNotice('');
      render();
    },
    serialize() {
      if (!state) throw new Error('No session in progress');
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
      // The same session from its first card. Its ratings were already recorded once and are not counted again.
      state = restart(state);
      typedInput.value = '';
      render();
      context.requestSave();
    },
    dispose() {
      disposeVoices?.();
      revealForm.removeEventListener('submit', onReveal);
      rateEl.removeEventListener('click', onRate);
      deckSelect.removeEventListener('change', onDeck);
      directionSelect.removeEventListener('change', onDirection);
      modeSelect.removeEventListener('change', onMode);
      learnNew.removeEventListener('click', onLearnNew);
      practise.removeEventListener('click', onPractise);
      missingNew.removeEventListener('click', onMissingNew);
      speakButton.removeEventListener('click', onSpeak);
      clear(root);
      state = undefined;
    }
  };
}
