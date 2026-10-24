// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { GameMetadata } from '@wp/game-core';
import { createTranslator, type SupportedLocale } from '@wp/localization';
import { createMemoryStore } from '@wp/persistence';
import type { AppContext, UiTranslator } from '../src/app';
import { loadLocale, UI_MESSAGES } from '../src/i18n';
import { renderHome } from '../src/pages/home';

// Build-time constants normally injected by vite.config.ts.
vi.hoisted(() => {
  Object.assign(globalThis, { __WP_VERSION__: 'test', __WP_LEGAL__: { name: '', address: [], email: '' } });
});
const registry = vi.hoisted(() => ({ games: [] as { metadata: unknown }[] }));
// The real registry needs the build-time catalogue; the home page only reads `GAMES`.
vi.mock('../src/registry', () => ({ GAMES: registry.games }));

const metadata = (id: string, extra: Partial<GameMetadata> = {}): GameMetadata => ({
  id,
  stateVersion: 1,
  skills: ['planning'],
  typicalMinutes: [5, 15],
  inputMethods: ['pointer'],
  capabilities: { offline: true, audio: 'none', aiOptional: false, webgpu: 'none', network: 'none', pauseable: true },
  messages: {
    en: { title: `Title ${id}`, tagline: `Tagline ${id}`, rules: 'Rules' },
    de: { title: `Titel ${id}`, tagline: `Untertitel ${id}`, rules: 'Regeln' }
  },
  ...extra
});

function render(locale: SupportedLocale): HTMLElement {
  const t = createTranslator({ locale, sources: [UI_MESSAGES] }) as UiTranslator;
  const app = { locale, t, store: Promise.resolve(Object.assign(createMemoryStore(), { persistent: true })) } as unknown as AppContext;
  const main = document.createElement('main');
  document.body.append(main);
  renderHome(main, app);
  return main;
}

afterEach(() => {
  document.body.innerHTML = '';
  registry.games.splice(0);
});

describe('catalogue: preview games (ADR 0003 amendment 2026-10-24)', () => {
  it.each(['en', 'de', 'fr', 'ar'] as const)('shows a "Work in progress" text badge on a preview game only (%s)', async (locale) => {
    await loadLocale(locale);
    registry.games.push({ metadata: metadata('finished-game') }, { metadata: metadata('early-game', { status: 'preview', locales: ['en', 'de'] }) });
    const main = render(locale);
    const badges = main.querySelectorAll('[data-testid="preview-badge"]');
    expect(badges).toHaveLength(1);
    expect(badges[0]!.closest('[data-testid="game-card-early-game"]')).not.toBeNull();
    expect(badges[0]!.textContent).toBe(UI_MESSAGES[locale]!['game.preview']);
    expect(badges[0]!.textContent!.trim()).not.toBe('');
  });

  it('shows the title and tagline of a game that does not ship the UI locale in English, marked lang="en" dir="ltr"', async () => {
    await loadLocale('ar');
    registry.games.push({ metadata: metadata('early-game', { status: 'preview', locales: ['en', 'de'] }) });
    const card = render('ar').querySelector('[data-testid="game-card-early-game"]')!;
    const title = card.querySelector('.game-card-title [lang]')!;
    expect([title.textContent, title.getAttribute('lang'), title.getAttribute('dir')]).toEqual(['Title early-game', 'en', 'ltr']);
    const tagline = card.querySelector('.game-card-tagline')!;
    expect([tagline.textContent, tagline.getAttribute('lang'), tagline.getAttribute('dir')]).toEqual(['Tagline early-game', 'en', 'ltr']);
  });

  it('leaves shipped locales unmarked', async () => {
    await loadLocale('de');
    registry.games.push({ metadata: metadata('early-game', { status: 'preview', locales: ['en', 'de'] }) });
    const card = render('de').querySelector('[data-testid="game-card-early-game"]')!;
    expect(card.querySelector('.game-card-title')!.textContent).toContain('Titel early-game');
    expect(card.querySelector('[lang]')).toBeNull();
  });
});
