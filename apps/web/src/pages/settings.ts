import { LOCALE_DEFINITIONS, isSupportedLocale, readContentLanguages, writeContentLanguages } from '@wp/localization';
import { exportLibrary, importLibrary, LIBRARY_IMPORT_MAX_BYTES, libraryExportToJson, parseLibraryExport } from '@wp/persistence';
import { clear, h } from '@wp/ui';
import type { Page } from '../app';
import { SESSION_NOTE_KEY } from '../config';
import { loadLearningRecords, removeUserDeckRecords } from '../lib/learning';
import { clearPreferences, createPreferences } from '../lib/preferences';
import { findGame } from '../registry';
import { gameTranslator } from './shared';

/** A small list of common learning languages; content languages are not limited to the 16 UI locales. */
const CONTENT_LANGUAGES = ['ar', 'cs', 'da', 'de', 'el', 'en', 'es', 'fi', 'fr', 'he', 'hi', 'hu', 'id', 'it', 'ja', 'ko', 'nl', 'no', 'pl', 'pt', 'ro', 'ru', 'sv', 'sw', 'th', 'tr', 'uk', 'vi', 'zh-Hans'];

export const safeStorage = (): Storage | undefined => {
  try {
    return localStorage;
  } catch {
    return undefined;
  }
};

export function sessionNoteEnabled(): boolean {
  return safeStorage()?.getItem(SESSION_NOTE_KEY) !== 'off';
}

export const renderSettings: Page = (main, app) => {
  const { t } = app;
  const storage = safeStorage();
  const languageName = (tag: string) => {
    try {
      return new Intl.DisplayNames([app.locale], { type: 'language' }).of(tag) ?? tag;
    } catch {
      return tag;
    }
  };

  const uiSelect = h('select', { id: 'ui-language', 'data-testid': 'ui-language' },
    ...LOCALE_DEFINITIONS.map((d) => h('option', { value: d.code, selected: d.code === app.locale, lang: d.code }, d.nativeName))
  );
  uiSelect.addEventListener('change', () => {
    if (!isSupportedLocale(uiSelect.value)) return;
    // Focus the select of the re-rendered settings page once the new language is shown.
    void app.setLocale(uiSelect.value).then(() => document.getElementById('ui-language')?.focus());
  });

  const content = storage ? readContentLanguages(storage) : { learning: undefined, translation: undefined };
  const contentSelect = (id: string, current: string | undefined, onChange: (value: string) => void) => {
    const select = h('select', { id },
      h('option', { value: '' }, t('settings.notSet')),
      ...CONTENT_LANGUAGES.map((tag) => h('option', { value: tag, selected: tag === current }, languageName(tag)))
    );
    select.addEventListener('change', () => {
      if (select.value) onChange(select.value);
      app.announce(t('settings.saved'));
    });
    return select;
  };

  const sessionToggle = h('input', { type: 'checkbox', id: 'session-note', checked: sessionNoteEnabled() });
  sessionToggle.addEventListener('change', () => {
    storage?.setItem(SESSION_NOTE_KEY, sessionToggle.checked ? 'on' : 'off');
    app.announce(t('settings.saved'));
  });

  const savesInfo = h('p', { class: 'wp-muted' });
  const clearButton = h('button', { type: 'button', 'data-testid': 'clear-saves' }, t('settings.clearSaves'));
  const refreshSaves = async () => {
    const keys = await (await app.store).keys();
    savesInfo.textContent = t('settings.storage', { count: keys.length });
    clearButton.disabled = keys.length === 0;
  };
  clearButton.addEventListener('click', async () => {
    if (!confirm(t('settings.clearConfirm'))) return;
    const store = await app.store;
    for (const key of await store.keys()) await store.remove(key);
    // Remembered game options (e.g. opponent count) go together with the saves.
    clearPreferences(safeStorage());
    await refreshSaves();
  });
  void refreshSaves();

  // Imported decks are kept when saved games are deleted; they have their own, confirmed control.
  const decksInfo = h('p', { class: 'wp-muted', 'data-testid': 'decks-info' });
  const clearDecksButton = h('button', { type: 'button', 'data-testid': 'clear-decks' }, t('settings.clearDecks'));
  const refreshDecks = async () => {
    const { loadUserDecks } = await import('../lib/decks');
    const count = (await loadUserDecks(app.decks)).length;
    decksInfo.textContent = t('settings.decks', { count });
    clearDecksButton.disabled = count === 0;
  };
  clearDecksButton.addEventListener('click', async () => {
    if (!confirm(t('settings.clearDecksConfirm'))) return;
    await (await app.decks).clear();
    // Learning records of imported decks would only be orphans now.
    await removeUserDeckRecords(await app.learning).catch(() => undefined);
    await refreshLearning();
    // A remembered "own deck" choice would only fall back to picture pairs; forget it with the decks.
    createPreferences(storage, 'memory').set('cards', undefined);
    await refreshDecks();
    app.announce(t('settings.decksDeleted'));
  });
  void refreshDecks();

  // Learning records ("Items worth reviewing") are separate from saves and decks, with their own confirmed control.
  const learningInfo = h('p', { class: 'wp-muted', 'data-testid': 'learning-info' });
  const clearLearningButton = h('button', { type: 'button', 'data-testid': 'clear-learning' }, t('settings.clearLearning'));
  async function refreshLearning() {
    const count = (await loadLearningRecords(app.learning)).length;
    learningInfo.textContent = t('settings.learning', { count });
    clearLearningButton.disabled = count === 0;
  }
  clearLearningButton.addEventListener('click', async () => {
    if (!confirm(t('settings.clearLearningConfirm'))) return;
    await (await app.learning).clear();
    await refreshLearning();
    app.announce(t('settings.learningDeleted'));
  });
  void refreshLearning();

  // Things players create in games (e.g. maps; ADR 0012) are kept when saved games are deleted; own confirmed controls,
  // per game and for all, plus export to a file and import from one (the file never leaves the device by itself).
  // Focus target after a per-game delete removes the button that had focus.
  const libraryInfo = h('p', { class: 'wp-muted', 'data-testid': 'library-info', tabindex: '-1' });
  const libraryGames = h('ul', { class: 'wp-muted library-games', 'data-testid': 'library-games', hidden: true });
  const clearLibraryButton = h('button', { type: 'button', 'data-testid': 'clear-library' }, t('settings.clearLibrary'));
  const exportLibraryButton = h('button', { type: 'button', 'data-testid': 'export-library' }, t('settings.libraryExport'));
  const importFile = h('input', { type: 'file', id: 'library-file', accept: '.json,application/json', 'data-testid': 'library-file' });
  const importReplace = h('input', { type: 'checkbox', id: 'library-replace', 'data-testid': 'library-replace' });
  const importStatus = h('p', { role: 'status', 'data-testid': 'library-import-status' });
  const gameTitle = (id: string) => {
    const entry = findGame(id);
    return entry ? gameTranslator(entry.metadata, app.locale)('title') : id;
  };
  const deleteGameButton = (gameId: string, title: string, count: number) => {
    const button = h('button', { type: 'button', 'data-testid': `clear-library-${gameId}`, 'aria-label': t('settings.libraryDeleteGameLabel', { game: title }) }, t('settings.libraryDeleteGame'));
    button.addEventListener('click', async () => {
      if (!confirm(t('settings.libraryDeleteGameConfirm', { game: title, count }))) return;
      try {
        await (await app.library).removeGame(gameId);
        app.announce(t('settings.libraryGameDeleted', { game: title }));
      } catch {
        app.announce(t('settings.libraryActionFailed'));
      }
      await refreshLibrary();
      libraryInfo.focus();
    });
    return button;
  };
  async function refreshLibrary() {
    const counts = await (await app.library).counts().catch(() => new Map<string, number>());
    let total = 0;
    for (const count of counts.values()) total += count;
    libraryInfo.textContent = t('settings.library', { count: total });
    const rows = [...counts].map(([id, count]) => ({ id, title: gameTitle(id), count }));
    rows.sort((a, b) => a.title.localeCompare(b.title, app.locale));
    clear(libraryGames);
    libraryGames.append(...rows.map(({ id, title, count }) =>
      h('li', {}, h('span', { class: 'library-game' }, t('settings.libraryGame', { game: title, count })), ' ', deleteGameButton(id, title, count))));
    libraryGames.hidden = rows.length === 0;
    clearLibraryButton.disabled = total === 0;
    exportLibraryButton.disabled = total === 0;
  }
  clearLibraryButton.addEventListener('click', async () => {
    if (!confirm(t('settings.clearLibraryConfirm'))) return;
    try {
      await (await app.library).clear();
      app.announce(t('settings.libraryDeleted'));
    } catch {
      app.announce(t('settings.libraryActionFailed'));
    }
    await refreshLibrary();
  });
  exportLibraryButton.addEventListener('click', async () => {
    const now = new Date();
    let text: string;
    try {
      text = libraryExportToJson(await exportLibrary(await app.library, now));
    } catch {
      app.announce(t('settings.libraryActionFailed'));
      return;
    }
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const link = h('a', { href: url, download: `worthwhile-play-own-content-${now.toISOString().slice(0, 10)}.json`, hidden: true });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  importFile.addEventListener('change', async () => {
    const file = importFile.files?.[0];
    if (!file) return;
    const show = (text: string) => {
      importStatus.textContent = text;
    };
    // A fresh message each time, so a repeated, identical result is announced again.
    show(t('settings.libraryImporting'));
    importFile.disabled = true;
    try {
      if (file.size > LIBRARY_IMPORT_MAX_BYTES) return show(t('settings.libraryImportTooLarge'));
      const parsed = parseLibraryExport(await file.text(), (id) => findGame(id) !== undefined);
      if (!parsed.ok) return show(t(parsed.problem === 'newer-version' ? 'settings.libraryImportNewer' : 'settings.libraryImportNotRecognised'));
      const result = await importLibrary(await app.library, parsed.rows, { replace: importReplace.checked });
      show(t('settings.libraryImportResult', { ...result, skipped: parsed.skipped }));
    } catch {
      show(t('settings.libraryImportFailed'));
    } finally {
      // The same file can be chosen again (e.g. after ticking "replace").
      importFile.value = '';
      importFile.disabled = false;
      await refreshLibrary();
    }
  });
  void refreshLibrary();

  main.append(
    h('section', { class: 'prose settings' },
      h('h1', {}, t('settings.title')),
      h('div', { class: 'field' }, h('label', { for: 'ui-language' }, t('settings.uiLanguage')), uiSelect),
      h('fieldset', {},
        h('legend', {}, t('settings.contentTitle')),
        h('p', { class: 'wp-muted' }, t('settings.contentHint')),
        h('div', { class: 'field' }, h('label', { for: 'learning-language' }, t('settings.learningLanguage')),
          contentSelect('learning-language', content.learning, (v) => storage && writeContentLanguages(storage, { learning: v }))),
        h('div', { class: 'field' }, h('label', { for: 'translation-language' }, t('settings.translationLanguage')),
          contentSelect('translation-language', content.translation, (v) => storage && writeContentLanguages(storage, { translation: v })))
      ),
      h('div', { class: 'field checkbox' }, sessionToggle, h('label', { for: 'session-note' }, t('settings.sessionNote'))),
      h('div', { class: 'field' }, savesInfo, clearButton),
      h('div', { class: 'field' }, decksInfo, clearDecksButton),
      h('div', { class: 'field' }, learningInfo, clearLearningButton),
      h('div', { class: 'field' }, libraryInfo, libraryGames, clearLibraryButton),
      h('fieldset', { class: 'library-transfer' },
        h('legend', {}, t('settings.libraryTransfer')),
        h('p', { class: 'wp-muted' }, t('settings.libraryTransferHint')),
        h('div', { class: 'field' }, exportLibraryButton),
        // The option comes first: choosing a file starts the import.
        h('div', { class: 'field checkbox' }, importReplace, h('label', { for: 'library-replace' }, t('settings.libraryImportReplace'))),
        h('div', { class: 'field' }, h('label', { for: 'library-file' }, t('settings.libraryImport')), importFile),
        importStatus
      )
    )
  );
};
