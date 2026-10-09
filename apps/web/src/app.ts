import type { Translator } from '@wp/game-core';
import {
  createTranslator,
  isSupportedLocale,
  LOCALE_DEFINITIONS,
  localeDirection,
  readUiLocale,
  writeUiLocale,
  type SupportedLocale
} from '@wp/localization';
import { createIndexedDbDeckStore, createIndexedDbLearningStore, createIndexedDbStore, type DeckStore, type LearningStore, type SaveStore } from '@wp/persistence';
import { announce, clear, h } from '@wp/ui';
import { APP_NAME } from './config';
import { loadLocale, UI_MESSAGES, type UiKey } from './i18n';
import { renderAbout } from './pages/about';
import type * as DeckPages from './pages/decks';
import { renderGamePage } from './pages/game';
import { renderHome } from './pages/home';
import { renderLegal } from './pages/legal';
import { renderNotFound } from './pages/not-found';
import { renderSettings } from './pages/settings';
import { applyPendingUpdateIfIdle, setupPwa } from './pwa';
import { routeHref, startRouter, type Route } from './router';

export type UiTranslator = Translator & ((key: UiKey, params?: Readonly<Record<string, string | number>>) => string);

export interface AppContext {
  locale: SupportedLocale;
  t: UiTranslator;
  store: Promise<SaveStore & { persistent: boolean }>;
  /** Learning decks imported by the user (separate from saves; never deleted together with them). */
  decks: Promise<DeckStore>;
  /** Spaced-repetition records ("Items worth reviewing"); separate from saves and decks. */
  learning: Promise<LearningStore>;
  navigate: (path: string) => void;
  /** Loads the locale's messages, then switches to it and re-renders (never shows keys or English meanwhile). */
  setLocale: (locale: SupportedLocale) => Promise<void>;
  announce: (message: string) => void;
}

/** A page renders into `main` and may return a cleanup function (e.g. to flush a running game). */
export type Page = (main: HTMLElement, app: AppContext) => void | (() => void | Promise<void>);

const storage = (): Storage | undefined => {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
};

const noopStorage = { getItem: () => null, setItem: () => undefined };

/** Loads the messages of the UI locale (and the English fallback), then renders the app. */
export async function startApp(root: HTMLElement): Promise<void> {
  let locale = await loadLocale(readUiLocale(storage() ?? noopStorage, navigator.languages ?? [navigator.language]));
  let localeRequest = 0;
  let route: Route = { name: 'home' };
  let cleanup: void | (() => void | Promise<void>);

  const main = h('main', { id: 'main', tabindex: '-1' });
  const live = h('p', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
  const nav = h('nav');
  const footer = h('footer', { class: 'app-footer' });
  const header = h('header', { class: 'app-header' });

  const app: AppContext = {
    locale,
    t: undefined as unknown as UiTranslator,
    store: createIndexedDbStore(),
    decks: createIndexedDbDeckStore(),
    learning: createIndexedDbLearningStore(),
    navigate: (path) => navigate(path),
    setLocale: async (next) => {
      // Only the latest choice wins when the user switches again while a locale is still loading.
      const request = ++localeRequest;
      const loaded = await loadLocale(next).catch(() => undefined);
      if (request !== localeRequest || loaded !== next) return;
      locale = next;
      writeUiLocale(storage() ?? noopStorage, next);
      applyLocale();
      await render(route);
      const name = LOCALE_DEFINITIONS.find((d) => d.code === next)?.nativeName ?? next;
      app.announce(app.t('lang.changed', { language: name }));
    },
    announce: (message) => announce(live, message)
  };

  const applyLocale = () => {
    app.locale = locale;
    app.t = createTranslator({
      locale,
      sources: [UI_MESSAGES],
      onMissing: import.meta.env.DEV ? (key) => console.warn(`[i18n] missing "${key}" in ${locale}`) : undefined
    }) as UiTranslator;
    document.documentElement.lang = locale;
    document.documentElement.dir = localeDirection(locale);
  };

  const renderChrome = () => {
    const { t } = app;
    clear(header);
    clear(nav);
    clear(footer);
    nav.setAttribute('aria-label', t('nav.main'));
    const link = (r: Route, label: string) => {
      const active = r.name === route.name || (r.name === 'home' && route.name === 'game') || (r.name === 'decks' && (route.name === 'deck' || route.name === 'deck-import'));
      return h('a', { href: routeHref(r), 'aria-current': active ? 'page' : undefined }, label);
    };
    nav.append(link({ name: 'home' }, t('nav.home')), link({ name: 'decks' }, t('nav.decks')), link({ name: 'settings' }, t('nav.settings')), link({ name: 'about' }, t('nav.about')));
    header.append(
      h('a', { class: 'skip-link', href: '#main' }, t('nav.skip')),
      h('a', { class: 'brand', href: '/' }, h('img', { class: 'brand-mark', src: '/logo.png', alt: '', width: 40, height: 40 }), h('span', {}, APP_NAME)),
      nav,
      languageMenu()
    );
    const pwaSlot = h('div', { class: 'pwa-slot', 'aria-live': 'polite' });
    footer.append(
      h('span', {}, t('footer.privacy')),
      pwaSlot,
      // Legal notice must be reachable from every page, in every language.
      h('a', { href: '/legal', 'data-testid': 'legal-link' }, t('nav.legal'))
    );
    setupPwa(pwaSlot, t);
  };

  /** Visible language switcher in the header on every page (same pattern as Home Workout). */
  const languageMenu = () => {
    const { t } = app;
    const current = LOCALE_DEFINITIONS.find((d) => d.code === locale)?.nativeName ?? locale;
    const select = h('select', { id: 'header-language', 'data-testid': 'header-language' },
      ...LOCALE_DEFINITIONS.map((d) => h('option', { value: d.code, selected: d.code === locale, lang: d.code }, d.nativeName))
    );
    const menu = h('details', { class: 'language-menu', 'data-testid': 'language-menu' },
      h('summary', { 'aria-label': `${t('settings.uiLanguage')}: ${current}` },
        h('span', { class: 'language-icon', 'aria-hidden': 'true' }, '文/A'),
        h('span', { class: 'language-current', lang: locale }, current)
      ),
      h('div', { class: 'language-menu-panel' },
        h('label', { for: 'header-language' }, h('span', {}, t('settings.uiLanguage')), select),
        h('a', { href: '/settings' }, `${t('settings.contentTitle')} ${t.direction === 'rtl' ? '←' : '→'}`)
      )
    );
    select.addEventListener('change', () => {
      if (!isSupportedLocale(select.value)) return;
      // The page re-renders in the new language; reopen the menu and keep focus on the select there.
      void app.setLocale(select.value).then(() => {
        const next = document.getElementById('header-language');
        next?.closest('details')?.setAttribute('open', '');
        next?.focus();
      });
    });
    menu.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.open) {
        menu.open = false;
        menu.querySelector('summary')?.focus();
      }
    });
    return menu;
  };
  document.addEventListener('click', (event) => {
    const open = header.querySelector<HTMLDetailsElement>('details.language-menu[open]');
    if (open && !open.contains(event.target as Node)) open.open = false;
  });

  const lazyPage = (m: HTMLElement, a: AppContext, show: (pages: typeof DeckPages) => void) => {
    const target = route;
    import('./pages/decks')
      .then((pages) => {
        if (route !== target) return; // navigated away meanwhile
        show(pages);
        document.title = `${m.querySelector('h1')?.textContent ?? ''} · ${APP_NAME}`;
      })
      .catch((error: unknown) => {
        console.error(error);
        m.append(h('p', { role: 'alert' }, a.t('error.generic')));
      });
  };

  const pages: Record<Route['name'], Page> = {
    home: renderHome,
    game: (m, a) => renderGamePage(m, a, route as Extract<Route, { name: 'game' }>),
    about: renderAbout,
    settings: renderSettings,
    // The deck library (import parser, built-in vocabulary) is a separate chunk, loaded on first use.
    decks: (m, a) => lazyPage(m, a, (pages) => pages.renderDecks(m, a)),
    deck: (m, a) => lazyPage(m, a, (pages) => pages.renderDeck(m, a, (route as Extract<Route, { name: 'deck' }>).id)),
    'deck-import': (m, a) => lazyPage(m, a, (pages) => pages.renderDeckImport(m, a)),
    legal: renderLegal,
    'not-found': renderNotFound
  };

  const render = async (next: Route) => {
    const previous = cleanup;
    cleanup = undefined;
    try {
      await previous?.();
    } catch (error) {
      console.error(error);
    }
    route = next;
    applyPendingUpdateIfIdle();
    renderChrome();
    clear(main);
    try {
      cleanup = pages[next.name](main, app);
    } catch (error) {
      console.error(error);
      main.append(h('p', { role: 'alert' }, app.t('error.generic')));
    }
    document.title = next.name === 'home' ? `${APP_NAME} – ${app.t('app.tagline')}` : `${main.querySelector('h1')?.textContent ?? ''} · ${APP_NAME}`;
  };

  applyLocale();
  root.append(header, main, footer, live);
  const navigate = startRouter((r) => void render(r));
}
