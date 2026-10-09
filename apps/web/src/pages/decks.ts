import {
  BUILTIN_DECK_IDS,
  isBuiltinDeckId,
  builtinDeck,
  deckToJson,
  importDeck,
  IMPORT_LIMITS,
  learningDeckId,
  localDay,
  pickText,
  reviewCounts,
  resolveContentLanguages,
  type BuiltinDeckId,
  type CardSide,
  type Deck,
  type ImportResult,
  type LearningRecord
} from '@wp/learning-content';
import { createTranslator, readContentLanguages } from '@wp/localization';
import { append, clear, h } from '@wp/ui';
import type { AppContext, Page } from '../app';
import { APP_NAME } from '../config';
import { LEARNING_UI_MESSAGES, type LearningUiKey } from '../i18n/learning';
import type { UiKey } from '../i18n/ui';
import { deckLanguages, importErrorText, importWarningText, loadUserDecks, newDeckId, type StoredDeck } from '../lib/decks';
import { loadLearningRecords } from '../lib/learning';
import { createPreferences } from '../lib/preferences';
import { safeStorage } from './settings';

/** Memory's preference key for the chosen cards (see packages/games/memory/src/view.ts). */
const MEMORY_CARDS_PREFERENCE = 'cards';
const PREVIEW_ROWS = 200;
const IMPORT_PREVIEW_ROWS = 20;

const BUILTIN_TEXT: Readonly<Record<BuiltinDeckId, { title: UiKey; about: UiKey }>> = {
  symbols: { title: 'decks.symbols', about: 'decks.symbols.about' },
  'first-words': { title: 'decks.firstWords', about: 'decks.firstWords.about' },
  flags: { title: 'decks.flags', about: 'decks.flags.about' }
};

/** Memory variants offered for each built-in deck (own decks always play front ↔ back). */
const BUILTIN_PLAY: Readonly<Record<BuiltinDeckId, readonly { choice: string; label: UiKey }[]>> = {
  symbols: [{ choice: 'symbols', label: 'decks.play' }],
  'first-words': [
    { choice: 'picture-word', label: 'decks.playPictureWord' },
    { choice: 'word-translation', label: 'decks.playWordTranslation' }
  ],
  flags: [{ choice: 'flag-country', label: 'decks.playFlags' }]
};

const contentChoice = () => {
  const storage = safeStorage();
  return storage ? readContentLanguages(storage) : { learning: undefined, translation: undefined };
};

const builtinDecks = (app: AppContext): Deck[] => {
  const languages = resolveContentLanguages(contentChoice(), app.locale);
  return BUILTIN_DECK_IDS.map((id) => builtinDeck(id, languages));
};

type LearningT = (key: LearningUiKey, params?: Readonly<Record<string, string | number>>) => string;
/** Translator for the "Items worth reviewing" strings (a catalogue that lives in this lazily loaded chunk). */
const lt = (app: AppContext): LearningT => createTranslator({ locale: app.locale, sources: [LEARNING_UI_MESSAGES] }) as LearningT;

/** "Items worth reviewing" counts of a deck, or undefined if the deck is not reviewable (symbols). */
function deckReview(app: AppContext, deck: Deck, records: readonly LearningRecord[], today = localDay()): { due: number; seen: number } | undefined {
  const key = learningDeckId(deck.id, resolveContentLanguages(contentChoice(), app.locale));
  return key === undefined ? undefined : reviewCounts(records, key, deck.items.map((item) => item.id), today);
}

const reviewHref = (deck: Deck) => `/games/review?deck=${encodeURIComponent(deck.id)}`;

/** Short, honest explanation of the schedule (shown on the library and deck pages). */
const scheduleDetails = (app: AppContext) =>
  h('details', { class: 'rules review-how', 'data-testid': 'review-how' }, h('summary', {}, lt(app)('review.howTitle')), h('p', {}, lt(app)('review.howText')));

const languageName = (app: AppContext, tag: string) => {
  try {
    return new Intl.DisplayNames([app.locale], { type: 'language' }).of(tag) ?? tag;
  } catch {
    return tag;
  }
};

/** "Pictures ↔ Japanese" / "German ↔ English" / "Language not specified". */
function languagesLabel(app: AppContext, deck: Deck): string {
  const { t } = app;
  const { front, back, pictures } = deckLanguages(deck);
  const list = (tags: string[]) => tags.map((tag) => languageName(app, tag)).join(', ');
  const frontText = front.length ? list(front) : pictures.front ? t('decks.pictures') : '';
  const backText = back.length ? list(back) : pictures.back ? t('decks.pictures') : '';
  if (!frontText && !backText) return t('decks.noLanguage');
  return [frontText || t('decks.noLanguage'), backText || t('decks.noLanguage')].join(' ↔ ');
}

const deckTitle = (app: AppContext, deck: Deck) => (isBuiltinDeckId(deck.id) ? app.t(BUILTIN_TEXT[deck.id as BuiltinDeckId].title) : pickText(deck.title, app.locale));

function deckCard(app: AppContext, deck: Deck, stored?: StoredDeck, due = 0): HTMLElement {
  const { t } = app;
  const about = isBuiltinDeckId(deck.id) ? t(BUILTIN_TEXT[deck.id as BuiltinDeckId].about) : deck.description ? pickText(deck.description, app.locale) : '';
  return h('li', {},
    h('a', { class: 'game-card deck-card', href: `/decks/${deck.id}`, 'data-testid': `deck-card-${deck.id}` },
      h('span', { class: 'game-card-title', dir: 'auto' }, deckTitle(app, deck)),
      about ? h('span', { class: 'game-card-tagline' }, about) : null,
      h('span', { class: 'badges' },
        h('span', { class: 'badge', 'data-testid': 'deck-count' }, t('decks.cards', { count: deck.items.length })),
        h('span', { class: 'badge' }, languagesLabel(app, deck)),
        stored ? h('span', { class: 'badge' }, t('decks.imported', { date: formatDate(app, stored.importedAt) })) : null,
        due > 0 ? h('span', { class: 'badge review-badge', 'data-testid': 'deck-due' }, lt(app)('review.due', { count: due })) : null
      )
    )
  );
}

const formatDate = (app: AppContext, iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : new Intl.DateTimeFormat(app.locale, { dateStyle: 'medium' }).format(date);
};

const backLink = (app: AppContext) => h('nav', { class: 'breadcrumb' }, h('a', { href: '/decks' }, `${app.t.direction === 'rtl' ? '→' : '←'} ${app.t('decks.all')}`));

// --- /decks -------------------------------------------------------------------------------

export const renderDecks: Page = (main, app) => {
  const { t } = app;
  const ownList = h('ul', { class: 'game-grid', role: 'list', 'data-testid': 'own-decks' });
  const ownStatus = h('p', { class: 'wp-muted', 'data-testid': 'own-decks-empty', hidden: true }, t('decks.ownEmpty'));
  const storageNote = h('p', { class: 'notice', hidden: true }, t('decks.storageUnavailable'));
  const builtinList = h('ul', { class: 'game-grid', role: 'list', 'data-testid': 'builtin-decks' });
  const reviewList = h('ul', { class: 'review-list', role: 'list', 'data-testid': 'review-overview' });
  const reviewNone = h('p', { class: 'wp-muted', 'data-testid': 'review-none', hidden: true }, lt(app)('review.none'));
  main.append(
    h('section', { class: 'decks' },
      h('h1', {}, t('decks.title')),
      h('p', { class: 'lead' }, t('decks.intro')),
      h('p', {}, h('a', { class: 'wp-button primary', href: '/decks/import', 'data-testid': 'import-deck' }, t('decks.import'))),
      storageNote,
      h('section', { class: 'review-overview', 'aria-labelledby': 'review-title' },
        h('h2', { id: 'review-title' }, lt(app)('review.title')),
        h('p', { class: 'wp-muted' }, lt(app)('review.intro')),
        reviewNone,
        reviewList,
        scheduleDetails(app)
      ),
      h('h2', {}, t('decks.own')),
      ownStatus,
      ownList,
      h('h2', {}, t('decks.builtin')),
      h('p', { class: 'wp-muted' }, t('decks.languageHint'), ' ', h('a', { href: '/settings' }, t('nav.settings'))),
      builtinList
    )
  );
  const builtins = builtinDecks(app);
  builtinList.append(...builtins.map((deck) => deckCard(app, deck)));
  void (async () => {
    const store = await app.decks;
    storageNote.hidden = store.persistent;
    const [own, records] = await Promise.all([loadUserDecks(store), loadLearningRecords(app.learning)]);
    const today = localDay();
    const dueOf = (deck: Deck) => deckReview(app, deck, records, today)?.due ?? 0;
    ownStatus.hidden = own.length > 0;
    ownList.append(...own.map((stored) => deckCard(app, stored.deck, stored, dueOf(stored.deck))));
    clear(builtinList);
    builtinList.append(...builtins.map((deck) => deckCard(app, deck, undefined, dueOf(deck))));
    // Neutral overview: decks with cards whose suggested day has arrived, each with a "Review" link.
    const due = [...own.map((stored) => stored.deck), ...builtins].map((deck) => ({ deck, due: dueOf(deck) })).filter((entry) => entry.due > 0);
    reviewNone.hidden = due.length > 0;
    reviewList.append(
      ...due.map(({ deck, due: count }) =>
        h('li', { 'data-testid': `review-item-${deck.id}` },
          h('span', { dir: 'auto', class: 'review-deck' }, deckTitle(app, deck)),
          h('span', { class: 'wp-muted' }, lt(app)('review.due', { count })),
          h('a', { class: 'wp-button', href: reviewHref(deck), 'aria-label': lt(app)('review.actionLabel', { title: deckTitle(app, deck) }), 'data-testid': `review-${deck.id}` }, lt(app)('review.action'))
        )
      )
    );
  })();
};

// --- /decks/<id> --------------------------------------------------------------------------

function renderSideCell(side: CardSide): HTMLElement {
  const cell = h('td', {});
  if (side.image) cell.append(h('img', { class: 'deck-image', src: side.image, alt: side.alt ?? '', loading: 'lazy' }));
  if (side.symbol) cell.append(h('span', { class: 'deck-symbol', role: side.alt ? 'img' : undefined, 'aria-label': side.alt }, side.symbol), ' ');
  if (side.text) cell.append(h('span', { lang: side.lang, dir: 'auto' }, side.text));
  if (side.audio) cell.append(' ', h('span', { class: 'wp-muted' }, '♪'));
  return cell;
}

function previewTable(app: AppContext, deck: Deck, rows: number): HTMLElement {
  const { t } = app;
  const shown = deck.items.slice(0, rows);
  return h('div', { class: 'deck-preview' },
    h('table', { 'data-testid': 'deck-preview' },
      h('thead', {}, h('tr', {}, h('th', { scope: 'col' }, '#'), h('th', { scope: 'col' }, t('decks.front')), h('th', { scope: 'col' }, t('decks.back')))),
      h('tbody', {}, ...shown.map((item, i) => h('tr', {}, h('td', { class: 'wp-muted' }, i + 1), renderSideCell(item.front), renderSideCell(item.back))))
    ),
    deck.items.length > rows ? h('p', { class: 'wp-muted' }, t('decks.previewMore', { shown: rows, count: deck.items.length })) : null
  );
}

async function playMemory(app: AppContext, choice: string): Promise<void> {
  createPreferences(safeStorage(), 'memory').set(MEMORY_CARDS_PREFERENCE, choice);
  const store = await app.store;
  const existing = await store.read('memory').catch(() => undefined);
  // Never replace an unfinished game silently.
  if (existing !== undefined && !confirm(app.t('decks.replaceGame'))) {
    app.navigate('/games/memory');
    return;
  }
  app.navigate('/games/memory?new=1');
}

function exportDeck(deck: Deck): void {
  const url = URL.createObjectURL(new Blob([deckToJson(deck)], { type: 'application/json' }));
  const link = h('a', { href: url, download: `${deck.id}.json`, hidden: true });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function renderDeck(main: HTMLElement, app: AppContext, id: string): void {
  const { t } = app;
  main.append(backLink(app));
  const section = h('section', { class: 'deck-detail' });
  main.append(section);

  const show = (deck: Deck, stored?: StoredDeck) => {
    const builtin = isBuiltinDeckId(deck.id) ? (deck.id as BuiltinDeckId) : undefined;
    const plays = builtin ? BUILTIN_PLAY[builtin] : [{ choice: `own:${deck.id}`, label: 'decks.play' as UiKey }];
    const actions = h('div', { class: 'wp-row deck-actions' });
    for (const play of plays) {
      const button = h('button', { type: 'button', class: 'primary', 'data-testid': `play-${play.choice.replace(':', '-')}` }, t(play.label));
      button.addEventListener('click', () => void playMemory(app, play.choice));
      actions.append(button);
    }
    if (builtin !== 'symbols') {
      actions.append(h('a', { class: 'wp-button primary', href: reviewHref(deck), 'data-testid': 'review-deck' }, lt(app)('decks.review')));
    }
    const exportButton = h('button', { type: 'button', 'data-testid': 'export-deck' }, t('decks.export'));
    exportButton.addEventListener('click', () => exportDeck(deck));
    actions.append(exportButton);
    if (stored) {
      const remove = h('button', { type: 'button', class: 'danger', 'data-testid': 'delete-deck' }, t('decks.delete'));
      remove.addEventListener('click', async () => {
        if (!confirm(t('decks.deleteConfirm', { title: pickText(deck.title, app.locale) }))) return;
        await (await app.decks).remove(deck.id);
        // Its learning records go with it (they would only be orphans).
        await (await app.learning).removeDeck(deck.id).catch(() => undefined);
        app.announce(t('decks.deleted'));
        app.navigate('/decks');
      });
      actions.append(remove);
    }
    const about = builtin ? t(BUILTIN_TEXT[builtin].about) : deck.description ? pickText(deck.description, app.locale) : '';
    const facts = h('ul', { class: 'deck-facts' },
      h('li', { 'data-testid': 'deck-count' }, t('decks.cards', { count: deck.items.length })),
      h('li', {}, t('decks.languages', { languages: languagesLabel(app, deck) })),
      deck.license ? h('li', {}, t('decks.license', { license: deck.license })) : null,
      deck.source ? h('li', {}, t('decks.source', { source: deck.source })) : null,
      stored ? h('li', {}, t('decks.imported', { date: formatDate(app, stored.importedAt) })) : null
    );
    const reviewFacts = h('p', { class: 'wp-muted', 'data-testid': 'deck-review', hidden: true });
    if (builtin !== 'symbols') {
      void loadLearningRecords(app.learning).then((records) => {
        const counts = deckReview(app, deck, records);
        if (!counts) return;
        reviewFacts.textContent = `${lt(app)('review.due', { count: counts.due })} · ${lt(app)('review.seen', { seen: counts.seen, total: deck.items.length })}`;
        reviewFacts.hidden = false;
      });
    }
    append(section,
      h('h1', { dir: 'auto' }, deckTitle(app, deck)),
      about ? h('p', { class: 'lead' }, about) : null,
      facts,
      builtin && builtin !== 'symbols' ? h('p', { class: 'wp-muted' }, t('decks.languageHint'), ' ', h('a', { href: '/settings' }, t('nav.settings'))) : null,
      actions,
      reviewFacts,
      builtin !== 'symbols' ? scheduleDetails(app) : null,
      h('h2', {}, t('decks.preview')),
      previewTable(app, deck, PREVIEW_ROWS)
    );
    document.title = `${deckTitle(app, deck)} · ${APP_NAME}`;
  };

  const builtin = builtinDecks(app).find((d) => d.id === id);
  if (builtin) {
    show(builtin);
    return;
  }
  void loadUserDecks(app.decks).then((decks) => {
    const stored = decks.find((d) => d.id === id);
    if (stored) show(stored.deck, stored);
    else section.append(h('h1', {}, t('decks.notFoundTitle')), h('p', { 'data-testid': 'deck-not-found' }, t('decks.notFound')));
  });
}

// --- /decks/import ------------------------------------------------------------------------

export const renderDeckImport: Page = (main, app) => {
  const { t } = app;
  const fileInput = h('input', { type: 'file', id: 'deck-file', accept: '.csv,.json,.txt,text/csv,application/json,text/plain', 'data-testid': 'deck-file' });
  const textArea = h('textarea', { id: 'deck-text', rows: 8, spellcheck: 'false', dir: 'auto', 'data-testid': 'deck-text', placeholder: 'front_text,back_text\nHund,dog' });
  const nameInput = h('input', { type: 'text', id: 'deck-name', maxlength: IMPORT_LIMITS.maxTitleChars, autocomplete: 'off', 'data-testid': 'deck-name' });
  const checkButton = h('button', { type: 'submit', 'data-testid': 'deck-check' }, t('import.check'));
  const result = h('div', { class: 'import-result', 'data-testid': 'import-result' });
  let fileName = '';

  const form = h('form', { class: 'wp-stack import-form', novalidate: true },
    h('div', { class: 'field' }, h('label', { for: 'deck-file' }, t('import.file')), fileInput),
    h('div', { class: 'field' }, h('label', { for: 'deck-text' }, t('import.paste')), textArea),
    h('div', { class: 'field' }, h('label', { for: 'deck-name' }, t('import.name')), nameInput),
    h('div', { class: 'wp-row' }, checkButton)
  );

  main.append(
    backLink(app),
    h('section', { class: 'prose deck-import' },
      h('h1', {}, t('import.title')),
      h('p', { class: 'lead' }, t('import.intro')),
      h('details', { class: 'rules' },
        h('summary', {}, t('import.formatTitle')),
        h('p', {}, t('import.formatHelp')),
        h('pre', { class: 'import-example', dir: 'ltr' }, 'front_text,back_text,front_lang,back_lang\nHund,dog,de,en\nKatze,cat,de,en'),
        h('p', { class: 'wp-muted' }, t('import.limits', { items: IMPORT_LIMITS.maxItems, size: IMPORT_LIMITS.maxInputChars / 1_000_000, image: IMPORT_LIMITS.maxImageChars / 1000 }))
      ),
      form,
      result
    )
  );

  const title = (format: 'csv' | 'json') => nameInput.value.trim() || (format === 'csv' ? fileName || t('import.defaultName') : '');

  const showResult = (outcome: ImportResult) => {
    clear(result);
    const warnings = outcome.warnings.map((w) => importWarningText(t, w));
    if (!outcome.ok) {
      result.append(
        h('div', { class: 'notice import-errors', role: 'alert', 'data-testid': 'import-errors' },
          h('p', {}, h('strong', {}, t('import.errorsTitle'))),
          h('ul', {}, ...outcome.errors.slice(0, 50).map((e) => h('li', {}, importErrorText(t, e)))),
          outcome.errors.length > 50 ? h('p', {}, t('import.moreErrors', { count: outcome.errors.length - 50 })) : null
        )
      );
    }
    if (warnings.length > 0) {
      result.append(
        h('div', { class: 'notice import-warnings', role: 'status', 'data-testid': 'import-warnings' },
          h('p', {}, h('strong', {}, t('import.warningsTitle'))),
          h('ul', {}, ...warnings.slice(0, 50).map((w) => h('li', {}, w)))
        )
      );
    }
    if (!outcome.ok) {
      result.querySelector<HTMLElement>('[role="alert"]')?.setAttribute('tabindex', '-1');
      result.querySelector<HTMLElement>('[role="alert"]')?.focus();
      return;
    }
    const deck = outcome.deck;
    const save = h('button', { type: 'button', class: 'primary', 'data-testid': 'deck-save' }, t('import.save'));
    save.addEventListener('click', async () => {
      save.disabled = true;
      const store = await app.decks;
      const existing = await loadUserDecks(store);
      if (existing.length >= IMPORT_LIMITS.maxDecks) {
        app.announce(t('import.tooManyDecks', { max: IMPORT_LIMITS.maxDecks }));
        result.prepend(h('p', { class: 'notice', role: 'alert' }, t('import.tooManyDecks', { max: IMPORT_LIMITS.maxDecks })));
        save.disabled = false;
        return;
      }
      await store.put({ id: deck.id, importedAt: new Date().toISOString(), deck });
      app.announce(t('import.saved', { title: pickText(deck.title, app.locale) }));
      app.navigate(`/decks/${deck.id}`);
    });
    result.append(
      h('section', { class: 'import-preview', 'aria-labelledby': 'import-preview-title' },
        h('h2', { id: 'import-preview-title', tabindex: '-1' }, t('import.preview', { count: deck.items.length })),
        h('p', { dir: 'auto' }, h('strong', {}, pickText(deck.title, app.locale)), ' · ', languagesLabel(app, deck)),
        previewTable(app, deck, IMPORT_PREVIEW_ROWS),
        h('div', { class: 'wp-row' }, save)
      )
    );
    result.querySelector<HTMLElement>('#import-preview-title')?.focus();
  };

  const check = () => {
    const text = textArea.value;
    const format = text.replace(/^\uFEFF/, '').trimStart().startsWith('{') ? 'json' : 'csv';
    const name = title(format);
    showResult(importDeck(text, { id: newDeckId(name || 'deck'), titleLanguage: app.locale, ...(name ? { title: name } : {}) }));
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    check();
  });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    clear(result);
    if (file.size > IMPORT_LIMITS.maxInputChars) {
      showResult({ ok: false, format: undefined, errors: [{ code: 'too-large' }], warnings: [] });
      return;
    }
    try {
      textArea.value = await file.text();
    } catch {
      result.append(h('p', { class: 'notice', role: 'alert' }, t('import.fileError')));
      return;
    }
    fileName = file.name.replace(/\.(csv|json|txt)$/i, '').trim();
    check();
  });
};
