import { describe, expect, it } from 'vitest';
import { gameLocales, validateMetadata } from '@wp/game-core';
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
    // Each game in the locales it ships (all 16, or `metadata.locales` for a preview game, ADR 0003 amendment).
    for (const { metadata } of GAMES) expect(validateMetadata(metadata, gameLocales(metadata)), metadata.id).toEqual([]);
  });

  it("lists the games in the owner's order: the large games first, then the favourite small games", () => {
    const ids = GAMES.map((g) => g.metadata.id);
    expect(ids.slice(0, 14)).toEqual([
      'relay-command',
      'card-quest',
      'nonogram',
      'node-conquest',
      'chess',
      'minesweeper',
      'word-guess',
      'stack-duel',
      'skyscrapers',
      'lights-out',
      'sokoban',
      'laser-circuit',
      'circuit-puzzle',
      'memory'
    ]);
  });

  it('translates every declared difficulty in every locale the game ships', () => {
    for (const { metadata } of GAMES) {
      for (const difficulty of metadata.difficulties ?? []) {
        for (const locale of gameLocales(metadata)) expect(metadata.messages[locale]?.[`difficulty.${difficulty}`], `${metadata.id}/${locale}/${difficulty}`).toBeTruthy();
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

  it('per-locale catalogue modules hold exactly that locale for every registered game that ships it', async () => {
    for (const locale of SUPPORTED_LOCALES) {
      const shipping = GAMES.filter((g) => gameLocales(g.metadata).includes(locale));
      const { games } = await LOCALE_LOADERS[locale]();
      expect(Object.keys(games).sort(), locale).toEqual(shipping.map((g) => g.metadata.id).sort());
      for (const entry of shipping) expect(games[entry.metadata.id], `${entry.metadata.id}/${locale}`).toBe(entry.metadata.messages[locale]);
    }
  });
});

describe('learning page strings (loaded with the UI locale)', () => {
  it('are complete and placeholder-consistent for all 16 locales', () => {
    expect(auditCatalogues(LEARNING_UI_MESSAGES, SUPPORTED_LOCALES)).toEqual([]);
    expect(Object.keys(LEARNING_UI_MESSAGES).sort()).toEqual([...SUPPORTED_LOCALES].sort());
  });
});
