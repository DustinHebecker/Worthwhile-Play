import { beforeAll, describe, expect, it } from 'vitest';
import { SUPPORTED_LOCALES } from '@wp/localization';
import { CONTENT_LOADERS } from '../src/content';
import type { LocaleContent } from '../src/content/types';
import { WORLDS } from '../src/worlds';

/** Length limits per field (design § 6.2), checked in every locale so cards fit at 360 px. */
const NAME_MAX = 32;
const FLAVOUR_MAX = 90;

const ids = Object.values(WORLDS).flatMap((w) => w.cards.map((c) => c.id));
const loaded: Record<string, LocaleContent> = {};

beforeAll(async () => {
  for (const locale of SUPPORTED_LOCALES) loaded[locale] = await CONTENT_LOADERS[locale]();
});

describe('card texts per locale', () => {
  it.each(SUPPORTED_LOCALES)('%s: one name and flavour line for every card, nothing else, within the length limits', (locale) => {
    const content = loaded[locale]!;
    expect(Object.keys(content).sort()).toEqual([...ids].sort());
    for (const id of ids) {
      const { name, flavour } = content[id]!;
      expect(name.trim(), `${locale} ${id}`).not.toBe('');
      expect(flavour.trim(), `${locale} ${id}`).not.toBe('');
      expect(name.length, `${locale} ${id} name`).toBeLessThanOrEqual(NAME_MAX);
      expect(flavour.length, `${locale} ${id} flavour`).toBeLessThanOrEqual(FLAVOUR_MAX);
      const isMonster = Object.values(WORLDS).some((w) => w.cards.some((c) => c.id === id && c.type === 'monster'));
      const blunder = content[id]!.blunder;
      if (isMonster) {
        expect(blunder?.trim(), `${locale} ${id} blunder`).toBeTruthy();
        expect(blunder!.length, `${locale} ${id} blunder`).toBeLessThanOrEqual(FLAVOUR_MAX);
      } else expect(blunder, `${locale} ${id} has a blunder but is no monster`).toBeUndefined();
      // Plain text only: never markup.
      expect(`${name}${flavour}${blunder ?? ''}`, `${locale} ${id}`).not.toMatch(/[<>]/);
    }
  });

  it('card names are unique within each locale (so the log and the table stay unambiguous)', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const names = ids.map((id) => loaded[locale]![id]!.name);
      expect(new Set(names).size, locale).toBe(names.length);
    }
  });

  it('Portuguese is Brazilian (no European-only spellings)', () => {
    const text = JSON.stringify(loaded.pt);
    for (const word of ['facto', 'equipa', 'telemóvel', 'autocarro', 'casa de banho']) expect(text).not.toContain(word);
  });
});
