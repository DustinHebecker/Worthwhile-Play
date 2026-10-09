import { describe, expect, it } from 'vitest';
import { SUPPORTED_LOCALES } from '@wp/localization';
import { CONTENT, contentFor } from '../src/content';
import { messageIdsFor } from '../src/rules';
import { AUDIENCES, SCENARIOS } from '../src/scenarios';
import { messages } from '../src/messages';

const PLACEHOLDER = /\{(\w+)\}/g;

/** The exact key sets every locale must provide for one scenario, derived from the language-independent data. */
function expectedKeys(scenarioId: string) {
  const def = SCENARIOS.find((s) => s.id === scenarioId)!;
  const facts = def.facts.map((f) => f.id).sort();
  const reasons: string[] = [];
  for (const f of def.facts) {
    const tagged = def.audiences.filter((a) => f.tags[a] !== 'optional');
    // A fact that every audience should leave out may use one shared reason.
    const shared = def.audiences.every((a) => f.tags[a] === 'leave');
    if (shared) reasons.push(f.id);
    else for (const a of tagged) reasons.push(`${a}.${f.id}`);
  }
  const msgs = def.audiences.flatMap((a) => messageIdsFor(def, a).map((m) => `${a}.${m}`));
  return { facts, reasons: reasons.sort(), messages: msgs.sort() };
}

describe('scenario content', () => {
  it('exists for all 16 UI locales and nothing else', () => {
    expect(Object.keys(CONTENT).sort()).toEqual([...SUPPORTED_LOCALES].sort());
  });

  it('falls back to English for an unknown locale', () => {
    expect(contentFor('xx')).toBe(CONTENT.en);
    expect(contentFor('de')).toBe(CONTENT.de);
  });

  it('has the same scenario ids, fact ids, reason keys and message keys in every locale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const content = CONTENT[locale]!;
      expect(Object.keys(content).sort(), locale).toEqual(SCENARIOS.map((s) => s.id).sort());
      for (const def of SCENARIOS) {
        const text = content[def.id]!;
        const keys = expectedKeys(def.id);
        expect(Object.keys(text.facts).sort(), `${locale}/${def.id} facts`).toEqual(keys.facts);
        expect(Object.keys(text.reasons).sort(), `${locale}/${def.id} reasons`).toEqual(keys.reasons);
        expect(Object.keys(text.messages).sort(), `${locale}/${def.id} messages`).toEqual(keys.messages);
      }
    }
  });

  it('has no empty or untrimmed strings and no placeholders', () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const def of SCENARIOS) {
        const text = CONTENT[locale]![def.id]!;
        const all = [text.title, text.situation, ...Object.values(text.facts), ...Object.values(text.reasons), ...Object.values(text.messages)];
        for (const value of all) {
          expect(value.trim(), `${locale}/${def.id}`).not.toBe('');
          expect(value, `${locale}/${def.id}`).toBe(value.trim());
          expect(value.match(PLACEHOLDER), `${locale}/${def.id}: ${value}`).toBeNull();
        }
      }
    }
  });

  it('is not an untranslated copy of English (beyond a few shared strings)', () => {
    for (const locale of SUPPORTED_LOCALES) {
      if (locale === 'en') continue;
      for (const def of SCENARIOS) {
        const text = CONTENT[locale]![def.id]!;
        const en = CONTENT.en![def.id]!;
        expect(text.situation, `${locale}/${def.id}`).not.toBe(en.situation);
        const same = Object.keys(en.messages).filter((k) => text.messages[k] === en.messages[k]);
        expect(same, `${locale}/${def.id} messages`).toEqual([]);
      }
    }
  });

  it('keeps the numbers of each fact in every translation', () => {
    const digits = (s: string) => (s.match(/\d+/g) ?? []).map(Number).filter((n) => n >= 10).sort((a, b) => a - b);
    for (const locale of SUPPORTED_LOCALES) {
      for (const def of SCENARIOS) {
        const text = CONTENT[locale]![def.id]!;
        const en = CONTENT.en![def.id]!;
        for (const id of Object.keys(en.facts)) {
          const normalized = (text.facts[id] ?? '').replace(/(\d)[\s.,  '’](?=\d{3}\b)/g, '$1');
          const reference = (en.facts[id] ?? '').replace(/(\d),(?=\d{3}\b)/g, '$1');
          expect(digits(normalized), `${locale}/${def.id}/${id}`).toEqual(digits(reference));
        }
      }
    }
  });
});

describe('UI messages', () => {
  it('name every audience and give an opening hint for it', () => {
    for (const a of AUDIENCES) {
      expect(messages.en![`audience.${a}`]).toBeTruthy();
      expect(messages.en![`lead.${a}`]).toBeTruthy();
    }
  });
});
