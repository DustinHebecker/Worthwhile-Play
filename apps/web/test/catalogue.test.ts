import { describe, expect, it } from 'vitest';
import { validateMetadata } from '@wp/game-core';
import { auditCatalogues, SUPPORTED_LOCALES } from '@wp/localization';
import CATALOGUE from 'virtual:wp-catalogue';
import { isCatalogueKey } from '../catalogue-plugin';
import { LEARNING_UI_MESSAGES, LOCALE_LOADERS, UI_MESSAGES } from '../src/i18n';
import { GAMES } from '../src/registry';
import { loadAllLocales } from './locales';

await loadAllLocales();

describe('UI catalogues', () => {
  it('are complete and placeholder-consistent for all 16 locales', () => {
    expect(Object.keys(UI_MESSAGES).sort()).toEqual([...SUPPORTED_LOCALES].sort());
    expect(auditCatalogues(UI_MESSAGES, SUPPORTED_LOCALES)).toEqual([]);
  });

  it('localize the legal-notice label in every language (reachable from every page)', () => {
    for (const locale of SUPPORTED_LOCALES) expect(UI_MESSAGES[locale]?.['nav.legal'].trim()).not.toBe('');
  });
});

describe('game registry', () => {
  it('has unique ids and valid metadata', () => {
    const ids = GAMES.map((g) => g.metadata.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const { metadata } of GAMES) expect(validateMetadata(metadata, SUPPORTED_LOCALES), metadata.id).toEqual([]);
  });

  it('translates every declared difficulty in every locale', () => {
    for (const { metadata } of GAMES) {
      for (const difficulty of metadata.difficulties ?? []) {
        for (const locale of SUPPORTED_LOCALES) expect(metadata.messages[locale]?.[`difficulty.${difficulty}`], `${metadata.id}/${locale}/${difficulty}`).toBeTruthy();
      }
    }
  });

  it('keeps messages out of the main catalogue module (they come per locale)', () => {
    for (const metadata of Object.values(CATALOGUE)) expect(metadata, metadata.id).not.toHaveProperty('messages');
  });

  it('lazy-loads modules whose metadata matches the catalogue, which carries only the catalogue messages of every locale', async () => {
    for (const entry of GAMES) {
      const module = await entry.load();
      const { messages, ...rest } = module.metadata;
      const { messages: catalogueMessages, ...catalogueRest } = entry.metadata;
      expect(catalogueRest, entry.metadata.id).toEqual(rest);
      for (const [locale, table] of Object.entries(messages)) {
        expect(catalogueMessages[locale], `${entry.metadata.id}/${locale}`).toEqual(Object.fromEntries(Object.entries(table).filter(([key]) => isCatalogueKey(key))));
      }
      expect(Object.keys(catalogueMessages).sort()).toEqual(Object.keys(messages).sort());
    }
  });

  it('per-locale catalogue modules hold exactly that locale for every registered game', async () => {
    const ids = GAMES.map((g) => g.metadata.id).sort();
    for (const locale of SUPPORTED_LOCALES) {
      const { games } = await LOCALE_LOADERS[locale]();
      expect(Object.keys(games).sort(), locale).toEqual(ids);
      for (const entry of GAMES) expect(games[entry.metadata.id], `${entry.metadata.id}/${locale}`).toBe(entry.metadata.messages[locale]);
    }
  });
});

describe('learning page strings (loaded with the UI locale)', () => {
  it('are complete and placeholder-consistent for all 16 locales', () => {
    expect(auditCatalogues(LEARNING_UI_MESSAGES, SUPPORTED_LOCALES)).toEqual([]);
    expect(Object.keys(LEARNING_UI_MESSAGES).sort()).toEqual([...SUPPORTED_LOCALES].sort());
  });
});
