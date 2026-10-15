import { describe, expect, it } from 'vitest';
import { auditCatalogues, createTranslator, SUPPORTED_LOCALES, type SupportedLocale } from '@wp/localization';
import { CARD_MESSAGES, cardLabel, deck32, deck52, rankIndex, rankName, suitName, withCardMessages } from '../src';

const translator = (locale: SupportedLocale, missing: string[] = []) =>
  createTranslator({ locale, sources: [CARD_MESSAGES], onMissing: (key) => missing.push(`${locale}:${key}`) });

describe('card messages', () => {
  it('are complete in all 16 locales', () => {
    expect(Object.keys(CARD_MESSAGES).sort()).toEqual([...SUPPORTED_LOCALES].sort());
    expect(auditCatalogues(CARD_MESSAGES, SUPPORTED_LOCALES)).toEqual([]);
  });

  it('every card label template keeps its {rank} placeholder', () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const [key, value] of Object.entries(CARD_MESSAGES[locale])) {
        if (key.startsWith('cards.of.')) expect(value, `${locale} ${key}`).toContain('{rank}');
      }
    }
  });

  it('give every card a distinct label in every locale and both suit sets', () => {
    const missing: string[] = [];
    for (const locale of SUPPORTED_LOCALES) {
      const t = translator(locale, missing);
      const french = deck52().map((c) => cardLabel(c, t));
      const german = deck32().map((c) => cardLabel(c, t, 'german'));
      expect(new Set(french).size, locale).toBe(52);
      expect(new Set(german).size, locale).toBe(32);
      for (const label of [...french, ...german]) expect(label).not.toMatch(/[{}]|cards\./);
      // Corner letters are short and distinct per set.
      for (const set of ['french', 'german'] as const) {
        const letters = (['J', 'Q', 'K', 'A'] as const).map((r) => rankIndex(r, t, set));
        expect(new Set(letters).size, `${locale} ${set}`).toBe(4);
        for (const letter of letters) expect(letter.length, `${locale} ${set} ${letter}`).toBeLessThanOrEqual(2);
      }
    }
    expect(missing).toEqual([]);
  });

  it('reads naturally in English and German', () => {
    const en = translator('en');
    const de = translator('de');
    expect(cardLabel('QH', en)).toBe('Queen of Hearts');
    expect(cardLabel('TS', en)).toBe('10 of Spades');
    expect(cardLabel('7D', en, 'german')).toBe('7 of Bells');
    expect(cardLabel(null, en)).toBe('Face-down card');
    expect(cardLabel('JC', de)).toBe('Kreuz Bube');
    expect(cardLabel('QC', de, 'german')).toBe('Eichel Ober');
    expect(cardLabel('JS', de, 'german')).toBe('Grün Unter');
    expect(cardLabel('AD', de, 'german')).toBe('Schellen Ass');
    expect(suitName('H', de, 'german')).toBe('Rot');
    expect(rankName('K', translator('fr'))).toBe('Roi');
    expect(cardLabel('QH', translator('ru'))).toBe('Дама червей');
    expect(cardLabel('AS', translator('ja'))).toBe('スペードのエース');
  });

  it('corner letters fall back to J Q K A / U O K A without a translator', () => {
    expect(['J', 'Q', 'K', 'A', 'T', '7'].map((r) => rankIndex(r as never))).toEqual(['J', 'Q', 'K', 'A', '10', '7']);
    expect(['J', 'Q'].map((r) => rankIndex(r as never, undefined, 'german'))).toEqual(['U', 'O']);
    expect(rankIndex('J', translator('de'))).toBe('B');
  });

  it('withCardMessages merges per locale and lets game keys win', () => {
    const merged = withCardMessages({ en: { title: 'Game', 'cards.hand': 'Your hand' }, de: { title: 'Spiel' } });
    expect(merged.en?.title).toBe('Game');
    expect(merged.en?.['cards.hand']).toBe('Your hand');
    expect(merged.de?.['cards.suit.H']).toBe('Herz');
    expect(Object.keys(merged)).toHaveLength(16);
  });
});
