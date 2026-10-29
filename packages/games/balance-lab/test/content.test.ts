import { beforeAll, describe, expect, it } from 'vitest';
import type { Translator } from '@wp/game-core';
import { SUPPORTED_LOCALES } from '@wp/localization';
import { CONTENT_LOADERS, contentFor, preloadContent, withContent, type BalanceContent } from '../src/content';
import { messages } from '../src/messages';

const content: Record<string, BalanceContent> = {};
beforeAll(async () => {
  for (const l of SUPPORTED_LOCALES) content[l] = await CONTENT_LOADERS[l]();
});

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

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

describe('in-game content (ADR 0011)', () => {
  it('has the English keys in every locale, non-empty, with the same placeholders', () => {
    const en = content.en!;
    for (const l of SUPPORTED_LOCALES) {
      const c = content[l]!;
      expect(Object.keys(c).sort(), l).toEqual(Object.keys(en).sort());
      for (const [key, text] of Object.entries(c)) {
        expect(text.trim().length, `${l} ${key}`).toBeGreaterThan(0);
        expect(placeholders(text), `${l} ${key}`).toBe(placeholders(en[key as keyof BalanceContent]));
      }
    }
  });

  it('is translated: other locales differ from English in nearly every text', () => {
    const en = content.en!;
    for (const l of SUPPORTED_LOCALES.filter((x) => x !== 'en')) {
      const same = Object.entries(content[l]!).filter(([k, v]) => v === en[k as keyof BalanceContent] && !/^[\s●○{}·:…\-–—×÷=+|0-9a-z.,()?]*$/u.test(v));
      expect(same.map(([k]) => k), l).toEqual([]);
    }
  });

  it('keeps the catalogue and start-screen texts in the messages, and nothing twice', () => {
    for (const key of ['title', 'tagline', 'rules', 'difficulty.easy', 'mode.label', 'bench.stack', 'tasks.hint', 'freeBench.label']) expect(messages.en![key], key).toBeDefined();
    const shared = Object.keys(content.en!).filter((key) => key in messages.en!);
    expect(shared).toEqual([]);
  });

  it('withContent reads in-game keys from the content of the locale and the rest from the host', async () => {
    await preloadContent('de');
    const host = hostTranslator('de');
    const t = withContent(host);
    expect(t.locale).toBe('de');
    expect(t.direction).toBe('ltr');
    expect(t('progress', { n: 2, total: 6, bench: t('bench.beam') })).toBe(contentFor('de').progress.replace('{n}', '2').replace('{total}', '6').replace('{bench}', messages.de!['bench.beam']!));
    expect(host.asked).toEqual(['bench.beam']);
    // A missing parameter stays visible as its placeholder (like the host's translator).
    expect(t('tray.weight')).toBe(contentFor('de')['tray.weight']);
    expect(t('tray.weight', {})).toBe(contentFor('de')['tray.weight']);
    // Unknown keys go to the host (which reports missing keys in tests).
    expect(t('common.close')).toBe('common.close');
    expect(host.asked).toEqual(['bench.beam', 'common.close']);
  });

  it('falls back to the English content for a locale without content', async () => {
    await preloadContent('xx');
    const t = withContent(hostTranslator('xx'));
    expect(t('btn.letGo')).toBe(content.en!['btn.letGo']);
  });
});
