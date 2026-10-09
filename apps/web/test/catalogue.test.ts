import { describe, expect, it } from 'vitest';
import { validateMetadata } from '@wp/game-core';
import { auditCatalogues, SUPPORTED_LOCALES } from '@wp/localization';
import { UI_MESSAGES } from '../src/i18n/ui';
import { isCatalogueKey } from '../catalogue-plugin';
import { GAMES } from '../src/registry';

describe('UI catalogues', () => {
  it('are complete and placeholder-consistent for all 16 locales', () => {
    expect(auditCatalogues(UI_MESSAGES, SUPPORTED_LOCALES)).toEqual([]);
  });

  it('localize the legal-notice label in every language (reachable from every page)', () => {
    for (const locale of SUPPORTED_LOCALES) expect(UI_MESSAGES[locale]['nav.legal'].trim()).not.toBe('');
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

  it('lazy-loads modules whose metadata matches the catalogue, which carries only the catalogue messages', async () => {
    for (const entry of GAMES) {
      const module = await entry.load();
      const { messages, ...rest } = module.metadata;
      const { messages: catalogueMessages, ...catalogueRest } = entry.metadata;
      expect(catalogueRest, entry.metadata.id).toEqual(rest);
      for (const [locale, table] of Object.entries(messages)) {
        expect(catalogueMessages[locale], `${entry.metadata.id}/${locale}`).toEqual(Object.fromEntries(Object.entries(table).filter(([key]) => isCatalogueKey(key))));
      }
      expect(Object.keys(catalogueMessages)).toEqual(Object.keys(messages));
    }
  });
});

describe('learning page strings (lazily loaded with the deck pages)', () => {
  it('are complete and placeholder-consistent for all 16 locales', async () => {
    const { LEARNING_UI_MESSAGES } = await import('../src/i18n/learning');
    expect(auditCatalogues(LEARNING_UI_MESSAGES, SUPPORTED_LOCALES)).toEqual([]);
    expect(Object.keys(LEARNING_UI_MESSAGES).sort()).toEqual([...SUPPORTED_LOCALES].sort());
  });
});
