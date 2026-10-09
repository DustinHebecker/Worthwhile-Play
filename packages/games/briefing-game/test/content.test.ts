import { describe, expect, it } from 'vitest';
import { SUPPORTED_LOCALES } from '@wp/localization';
import { CONTENT, contentFor } from '../src/content';
import { messages } from '../src/messages';
import { ACTIONS, DECISIONS, REASON_KINDS, SITUATIONS, SLOTS } from '../src/situations';

const PLACEHOLDER = /\{(\w+)\}/g;

/** Multi-digit numbers (10 and above), with thousands separators removed, sorted. */
const numbers = (s: string) =>
  (s.replace(/(\d)[\s.,  '’](?=\d{3}\b)/g, '$1').match(/\d+/g) ?? [])
    .map(Number)
    .filter((n) => n >= 10)
    .sort((a, b) => a - b);

describe('situation content', () => {
  it('exists for all 16 UI locales and nothing else', () => {
    expect(Object.keys(CONTENT).sort()).toEqual([...SUPPORTED_LOCALES].sort());
  });

  it('falls back to English for an unknown locale', () => {
    expect(contentFor('xx')).toBe(CONTENT.en);
    expect(contentFor('de')).toBe(CONTENT.de);
  });

  it('has the same situation, card, decision and action ids in every locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const content = CONTENT[locale]!;
      expect(Object.keys(content).sort(), locale).toEqual(SITUATIONS.map((s) => s.id).sort());
      for (const def of SITUATIONS) {
        const text = content[def.id]!;
        expect(Object.keys(text.cards).sort(), `${locale}/${def.id} cards`).toEqual(def.cards.map((c) => c.id).sort());
        expect(Object.keys(text.decisions).sort(), `${locale}/${def.id} decisions`).toEqual([...DECISIONS].sort());
        expect(Object.keys(text.actions).sort(), `${locale}/${def.id} actions`).toEqual([...ACTIONS].sort());
      }
    }
  });

  it('has no empty or untrimmed strings and no placeholders', () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const def of SITUATIONS) {
        const text = CONTENT[locale]![def.id]!;
        const all = [text.title, text.situation, text.recipient, ...Object.values(text.cards), ...Object.values(text.decisions), ...Object.values(text.actions)];
        for (const value of all) {
          expect(value.trim(), `${locale}/${def.id}`).not.toBe('');
          expect(value, `${locale}/${def.id}`).toBe(value.trim());
          expect(value.match(PLACEHOLDER), `${locale}/${def.id}: ${value}`).toBeNull();
        }
      }
    }
  });

  it('gives every card, decision and action a distinct text within a situation', () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const def of SITUATIONS) {
        const text = CONTENT[locale]![def.id]!;
        const all = [...Object.values(text.cards), ...Object.values(text.decisions), ...Object.values(text.actions)];
        expect(new Set(all).size, `${locale}/${def.id}`).toBe(all.length);
      }
    }
  });

  it('is not an untranslated copy of English', () => {
    for (const locale of SUPPORTED_LOCALES) {
      if (locale === 'en') continue;
      for (const def of SITUATIONS) {
        const text = CONTENT[locale]![def.id]!;
        const en = CONTENT.en![def.id]!;
        expect(text.situation, `${locale}/${def.id}`).not.toBe(en.situation);
        const same = Object.keys(en.cards).filter((k) => text.cards[k] === en.cards[k]);
        expect(same, `${locale}/${def.id} cards`).toEqual([]);
        expect(DECISIONS.filter((k) => text.decisions[k] === en.decisions[k]), `${locale}/${def.id}`).toEqual([]);
        expect(ACTIONS.filter((k) => text.actions[k] === en.actions[k]), `${locale}/${def.id}`).toEqual([]);
      }
    }
  });

  it('keeps the numbers of every text in every translation', () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const def of SITUATIONS) {
        const text = CONTENT[locale]![def.id]!;
        const en = CONTENT.en![def.id]!;
        const pairs: [string, string, string][] = [
          ['situation', text.situation, en.situation],
          ...Object.keys(en.cards).map((k): [string, string, string] => [k, text.cards[k] ?? '', en.cards[k]!]),
          ...DECISIONS.map((k): [string, string, string] => [k, text.decisions[k] ?? '', en.decisions[k]!]),
          ...ACTIONS.map((k): [string, string, string] => [k, text.actions[k] ?? '', en.actions[k]!])
        ];
        for (const [key, value, reference] of pairs) expect(numbers(value), `${locale}/${def.id}/${key}: ${value}`).toEqual(numbers(reference));
      }
    }
  });
});

describe('UI messages', () => {
  it('name every slot, explain it and give a reason text for every card kind', () => {
    for (const slot of SLOTS) {
      expect(messages.en![`section.${slot}`]).toBeTruthy();
      expect(messages.en![`guide.${slot}`]).toBeTruthy();
    }
    for (const kind of REASON_KINDS) expect(messages.en![`reason.${kind}`]).toBeTruthy();
    for (const d of DECISIONS) expect(messages.en![`decisionKind.${d}`]).toBeTruthy();
    for (const a of ACTIONS) expect(messages.en![`actionKind.${a}`]).toBeTruthy();
  });

  it('use every card kind in the situation data', () => {
    const used = new Set(SITUATIONS.flatMap((s) => s.cards.map((c) => c.kind)));
    expect([...used].sort()).toEqual([...REASON_KINDS].sort());
  });
});
