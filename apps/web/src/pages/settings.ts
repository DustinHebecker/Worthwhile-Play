import { LOCALE_DEFINITIONS, isSupportedLocale, readContentLanguages, writeContentLanguages } from '@wp/localization';
import { h } from '@wp/ui';
import type { Page } from '../app';
import { SESSION_NOTE_KEY } from '../config';

/** A small list of common learning languages; content languages are not limited to the 16 UI locales. */
const CONTENT_LANGUAGES = ['ar', 'cs', 'da', 'de', 'el', 'en', 'es', 'fi', 'fr', 'he', 'hi', 'hu', 'id', 'it', 'ja', 'ko', 'nl', 'no', 'pl', 'pt', 'ro', 'ru', 'sv', 'sw', 'th', 'tr', 'uk', 'vi', 'zh-Hans'];

const safeStorage = (): Storage | undefined => {
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
    if (isSupportedLocale(uiSelect.value)) app.setLocale(uiSelect.value);
    document.getElementById('ui-language')?.focus();
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
    await refreshSaves();
  });
  void refreshSaves();

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
      h('div', { class: 'field' }, savesInfo, clearButton)
    )
  );
};
