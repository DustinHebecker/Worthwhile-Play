import { beforeAll, describe, expect, it } from 'vitest';
import type { Translator } from '@wp/game-core';
import { capitalName } from '@wp/learning-content';
import { COMMON_MESSAGES, SUPPORTED_LOCALES, createTranslator } from '@wp/localization';
import { CONTENT_LOADERS, preloadContent, withContent, type ContentText } from '../src/content';
import { atlasSync, loadAtlas } from '../src/data';
import game from '../src/index';
import { messages } from '../src/messages';

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

/** Characters that exist only in Traditional Chinese (their simplified forms differ); none may appear in zh-Hans. */
const TRADITIONAL_ONLY = '國東島灣漢華爾蘭羅亞馬門龍與為這個們來時會說長區號關雲陽運達觀過貝爾維納魯薩蘇聯' ;

const content: Record<string, ContentText> = {};
beforeAll(async () => {
  await loadAtlas();
  for (const l of SUPPORTED_LOCALES) content[l] = await CONTENT_LOADERS[l]();
});

describe('Atlas Explorer content (ADR 0011)', () => {
  type Lang = Parameters<typeof capitalName>[1];
  /** The deck's name of a city that is a capital in the *Capitals* deck, else undefined (then the content names it). */
  const deckName = (cityId: string, l: string) => {
    const c = atlasSync().city(cityId);
    return c?.capital ? capitalName(c.country, l as Lang) : undefined;
  };

  it('names every listed city without a deck name, every feature and every sea in all 16 locales, trimmed', () => {
    const atlas = atlasSync();
    for (const l of SUPPORTED_LOCALES) {
      const ids = [...atlas.cities.filter((c) => !deckName(c.id, l)).map((c) => c.id), ...atlas.features.map((f) => f.id), ...atlas.seas.map((s) => s.id)].sort();
      const names = content[l]!.names;
      expect(Object.keys(names).sort(), l).toEqual(ids);
      for (const [id, name] of Object.entries(names)) {
        expect(name.trim(), `${l}.${id}`).toBe(name);
        expect(name.length, `${l}.${id}`).toBeGreaterThan(0);
      }
    }
  });

  it('takes capitals from the Capitals deck where it has them, the same ones in every locale', () => {
    const capitals = atlasSync().cities.filter((c) => c.capital);
    const fromDeck = capitals.filter((c) => deckName(c.id, 'en')).map((c) => c.id);
    expect(fromDeck.length).toBeGreaterThanOrEqual(50);
    for (const l of SUPPORTED_LOCALES) expect(capitals.filter((c) => deckName(c.id, l)).map((c) => c.id), l).toEqual(fromDeck);
  });

  it('names every UN sub-region used by a country, with the same ids in every locale', () => {
    const subs = [...new Set(atlasSync().countries.map((c) => c.sub))].sort();
    for (const l of SUPPORTED_LOCALES) expect(Object.keys(content[l]!.subs).sort(), l).toEqual(Object.keys(content.en!.subs).sort());
    for (const s of subs) expect(content.en!.subs[s], s).toBeTruthy();
  });

  it('has the same insight ids in every locale, each about a known place, without digits', () => {
    const atlas = atlasSync();
    const known = new Set([...atlas.cities.map((c) => c.id), ...atlas.features.map((f) => f.id), ...atlas.countries.map((c) => c.id)]);
    const ids = Object.keys(content.en!.insights).sort();
    expect(ids.length).toBeGreaterThanOrEqual(20);
    for (const id of ids) expect(known.has(id), id).toBe(true);
    for (const l of SUPPORTED_LOCALES) {
      expect(Object.keys(content[l]!.insights).sort(), l).toEqual(ids);
      for (const [id, text] of Object.entries(content[l]!.insights)) {
        expect(text, `${l}.${id}`).not.toMatch(/\p{Nd}/u);
        expect(text.trim().length, `${l}.${id}`).toBeGreaterThan(4);
      }
    }
  });

  it('writes Simplified Chinese in zh-Hans', () => {
    const all = JSON.stringify(content['zh-Hans']) + JSON.stringify(messages['zh-Hans']);
    for (const ch of TRADITIONAL_ONLY) expect(all.includes(ch), ch).toBe(false);
  });
});

describe('Atlas Explorer UI texts', () => {
  /** Catalogue and start-screen messages plus the in-game texts of a locale: every text the game shows by key. */
  const all = (l: string): Record<string, string> => ({ ...messages[l], ...content[l]!.text });

  it('keep the catalogue and start-screen texts in the messages, the in-game texts in the content, nothing twice', () => {
    const catalogue = (k: string) => ['title', 'tagline', 'rules'].includes(k) || /^(difficulty|mode|region)\./.test(k);
    for (const l of SUPPORTED_LOCALES) {
      expect(Object.keys(messages[l]!).filter((k) => !catalogue(k)), l).toEqual([]);
      expect(Object.keys(content[l]!.text).filter(catalogue), l).toEqual([]);
    }
    for (const key of ['mode.label', 'mode.hint', 'mode.route', 'region.label', 'region.oceania', 'difficulty.hard']) expect(messages.en![key], key).toBeDefined();
  });

  it('ship all 16 locales with the English keys and the same placeholders', () => {
    for (const table of [(l: string) => messages[l]!, (l: string): Record<string, string> => content[l]!.text]) {
      const en = table('en');
      for (const l of SUPPORTED_LOCALES) {
        const cat = table(l);
        expect(Object.keys(cat).sort(), l).toEqual(Object.keys(en).sort());
        for (const k of Object.keys(en)) {
          expect(cat[k]!.trim().length, `${l}.${k}`).toBeGreaterThan(0);
          expect(placeholders(cat[k]!), `${l}.${k}`).toEqual(placeholders(en[k]!));
        }
      }
    }
  });

  it('are translated (only symbols and format patterns may equal English)', () => {
    const en = all('en');
    for (const l of SUPPORTED_LOCALES.filter((x) => x !== 'en')) {
      const texts = all(l);
      const same = Object.keys(en).filter((k) => texts[k] === en[k] && /\p{L}{3,}/u.test(en[k]!.replace(/\{\w+\}/g, '')));
      // Words shared with English in some languages (e.g. "Region", "Normal", "Winter", "Mode").
      const allowed = new Set(['region.label', 'pref.normal', 'answer.winter', 'mode.label', 'kindOf.plateau', 'region.asia', 'region.europe', 'region.oceania', 'region.africa', 'kindOf.point', 'kindOf.capital', 'kindOf.country', 'pref.mi', 'pref.unit', 'pref.km', 'mystery.search', 'kindOf.basin']);
      expect(same.filter((k) => !allowed.has(k)), l).toEqual([]);
    }
  });

  it('state the data source, its date and the neutrality rule in the rules of every locale', () => {
    for (const l of SUPPORTED_LOCALES) {
      const rules = messages[l]!.rules!;
      expect(rules, l).toContain('Natural Earth');
      expect(rules, l).toContain('5.1.2');
      expect(content[l]!.text['note.data'], l).toContain('2022');
    }
  });
});

describe('withContent', () => {
  /** A host translator over the catalogue messages that records the keys it was asked for. */
  function hostTranslator(locale: string): Translator & { asked: string[] } {
    const asked: string[] = [];
    const t = (key: string, params?: Readonly<Record<string, string | number>>) => {
      asked.push(key);
      const text = messages[locale]?.[key] ?? key;
      return params ? text.replace(/\{(\w+)\}/g, (m, n: string) => (n in params ? String(params[n]) : m)) : text;
    };
    return Object.assign(t, { locale, direction: locale === 'ar' ? ('rtl' as const) : ('ltr' as const), asked });
  }

  it('reads in-game keys from the content of the locale and the rest from the host', async () => {
    await preloadContent('ar');
    const host = hostTranslator('ar');
    const t = withContent(host);
    expect(t.locale).toBe('ar');
    expect(t.direction).toBe('rtl');
    expect(t('progress', { n: 2, total: 6 })).toBe(content.ar!.text.progress.replace('{n}', '2').replace('{total}', '6'));
    expect(t('region.asia')).toBe(messages.ar!['region.asia']);
    expect(host.asked).toEqual(['region.asia']);
    // A missing parameter stays visible as its placeholder (like the host's translator).
    expect(t('progress', { n: 1 })).toBe(content.ar!.text.progress.replace('{n}', '1'));
    expect(t('progress')).toBe(content.ar!.text.progress);
    // Unknown keys go to the host (which reports missing keys in tests).
    expect(t('common.close')).toBe('common.close');
    expect(host.asked).toEqual(['region.asia', 'common.close']);
  });

  it('gives, through the host translator, every text of every locale exactly once and without a missing key', async () => {
    const keys = Object.keys({ ...messages.en, ...content.en!.text });
    expect(keys.length).toBe(Object.keys(messages.en!).length + Object.keys(content.en!.text).length);
    for (const l of SUPPORTED_LOCALES) {
      await game.preload!(l);
      // The host's translator of the game: its messages, then the shared ones; missing keys are reported.
      const missing: string[] = [];
      const t = withContent(createTranslator({ locale: l, sources: [messages, COMMON_MESSAGES], onMissing: (key) => missing.push(key) }));
      const expected: Record<string, string> = { ...messages[l], ...content[l]!.text };
      for (const key of keys) expect(t(key), `${l}.${key}`).toBe(expected[key]);
      expect(missing, l).toEqual([]);
    }
  });

  it('falls back to the English content for a locale without content', async () => {
    await preloadContent('xx');
    expect(withContent(hostTranslator('xx'))('action.next')).toBe(content.en!.text['action.next']);
  });
});
