// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS } from '@wp/localization';
import { startApp } from '../src/app';
import { UI_MESSAGES } from '../src/i18n';

// Build-time constants normally injected by vite.config.ts.
vi.hoisted(() => {
  Object.assign(globalThis, { __WP_VERSION__: 'test', __WP_LEGAL__: { name: '', address: [], email: '' } });
});

// The service-worker registration (virtual:pwa-register) only exists in the Vite build.
vi.mock('../src/pwa', () => ({ setupPwa: () => undefined, applyPendingUpdateIfIdle: () => undefined }));

const flush = async () => {
  for (let i = 0; i < 20; i++) await new Promise((r) => setTimeout(r, 0));
};
const navText = () => document.querySelector('nav a')?.textContent;

describe('app bootstrap and language switching (per-locale message chunks)', () => {
  it('loads the stored UI locale before the first render, then switches only once the new locale is loaded', async () => {
    window.scrollTo = () => undefined;
    localStorage.setItem(STORAGE_KEYS.uiLocale, 'de');
    const root = document.createElement('div');
    document.body.append(root);

    await startApp(root);
    expect(Object.keys(UI_MESSAGES).sort()).toEqual(['de', 'en']);
    expect(document.documentElement.lang).toBe('de');
    expect(navText()).toBe(UI_MESSAGES.de?.['nav.home']);
    expect(document.querySelector('[data-testid="game-card-memory"] .game-card-title')?.textContent).not.toMatch(/^title\b/);

    const select = document.querySelector<HTMLSelectElement>('[data-testid="header-language"]')!;
    select.value = 'ja';
    select.dispatchEvent(new Event('change'));
    // Still fully German while Japanese loads: no keys, no English.
    expect(document.documentElement.lang).toBe('de');
    expect(navText()).toBe(UI_MESSAGES.de?.['nav.home']);
    await vi.waitFor(() => expect(document.documentElement.lang).toBe('ja'));
    await flush();
    expect(navText()).toBe(UI_MESSAGES.ja?.['nav.home']);
    expect(localStorage.getItem(STORAGE_KEYS.uiLocale)).toBe('ja');

    // Rapid switching: the last choice wins.
    for (const next of ['ar', 'ko']) {
      const current = document.querySelector<HTMLSelectElement>('[data-testid="header-language"]')!;
      current.value = next;
      current.dispatchEvent(new Event('change'));
    }
    await vi.waitFor(() => expect(document.documentElement.lang).toBe('ko'));
    await flush();
    expect(document.documentElement.lang).toBe('ko');
    expect(document.documentElement.dir).toBe('ltr');
    expect(navText()).toBe(UI_MESSAGES.ko?.['nav.home']);
  });
});
