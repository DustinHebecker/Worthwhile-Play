import { beforeAll, describe, expect, it } from 'vitest';
import { bcp47Tag } from '@wp/game-core';
import { SUPPORTED_LOCALES } from '@wp/localization';
import { CHALLENGE_IDS } from '../src/challenges';
import { LOOP_KEYS } from '../src/cld';
import { CONTENT_LOADERS, type ContentText } from '../src/content';
import { GOALS } from '../src/goals';
import { ALL_SPECIES } from '../src/habitats';
import { messages } from '../src/messages';

const content: Record<string, ContentText> = {};
beforeAll(async () => {
  for (const l of SUPPORTED_LOCALES) content[l] = await CONTENT_LOADERS[l]();
});

const strings = (c: ContentText): string[] => [
  ...Object.values(c.species).flatMap((s) => [s.name, s.about]),
  ...Object.values(c.challenges).flatMap((x) => [x.title, x.situation, x.think, x.explain, x.real]),
  ...Object.values(c.goals).flatMap((g) => [g.story, g.target, g.hint, g.explain, ...Object.values(g.plans)]),
  ...Object.values(c.loops)
];
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

describe('content of every locale', () => {
  it('has every species, challenge, goal, plan and loop, with non-empty texts', () => {
    for (const l of SUPPORTED_LOCALES) {
      const c = content[l]!;
      expect(Object.keys(c.species).sort(), l).toEqual([...ALL_SPECIES].sort());
      expect(Object.keys(c.challenges).sort(), l).toEqual([...CHALLENGE_IDS].sort());
      expect(Object.keys(c.goals).sort(), l).toEqual(GOALS.map((g) => g.id).sort());
      for (const g of GOALS) expect(Object.keys(c.goals[g.id]!.plans).sort(), `${l} ${g.id}`).toEqual(g.plans.map((p) => p.key).sort());
      expect(Object.keys(c.loops).sort(), l).toEqual([...LOOP_KEYS].sort());
      for (const s of strings(c)) expect(s.trim().length, l).toBeGreaterThan(0);
    }
  });

  it('keeps the placeholders of the goal targets; stories and challenge texts hold no digits', () => {
    for (const l of SUPPORTED_LOCALES) {
      const c = content[l]!;
      for (const g of GOALS) expect(placeholders(c.goals[g.id]!.target), `${l} ${g.id}`).toBe(placeholders(content.en!.goals[g.id]!.target));
      for (const s of strings(c).filter((x) => !x.includes('{'))) {
        expect(/\{|\}/.test(s), `${l}: ${s}`).toBe(false);
        expect(/[0-9]/.test(s.replace(/[BR][1-3]/g, '')), `${l}: ${s}`).toBe(false);
      }
    }
  });

  it('gives "{n} weeks" for every plural category of the locale', () => {
    for (const l of SUPPORTED_LOCALES) {
      const forms = content[l]!.weeks;
      for (const cat of new Intl.PluralRules(bcp47Tag(l)).resolvedOptions().pluralCategories) {
        expect(forms[cat], `${l} ${cat}`).toBeDefined();
        expect(forms[cat], `${l} ${cat}`).toContain('{n}');
      }
    }
  });

  it('is translated: other locales differ from English in nearly every text (names of the game aside)', () => {
    const en = strings(content.en!);
    for (const l of SUPPORTED_LOCALES.filter((x) => x !== 'en')) {
      const s = strings(content[l]!);
      const same = s.filter((x, i) => x === en[i]);
      expect(same, l).toEqual([]);
      const ui = messages[l]!;
      const sameUi = Object.entries(messages.en!).filter(([k, v]) => ui[k] === v && !/^[\s●○{}·:…\-–—+‖|0-9a-z.,()%]*$/u.test(v));
      expect(sameUi.map(([k]) => k), l).toEqual([]);
    }
  });

  it('uses common names in the main texts (no species ids or Latin names); question stems name the species', () => {
    for (const l of SUPPORTED_LOCALES) {
      const c = content[l]!;
      for (const x of Object.values(c.challenges)) for (const s of [x.situation, x.explain]) expect(/Daphnia|cyanobacter|Lemna|Potamogeton/i.test(s), `${l}: ${s}`).toBe(false);
    }
  });

  it('writes Simplified Chinese and Brazilian Portuguese', () => {
    const traditional = /[們這個來時於與國學會說經爲為體後發開關點長門東車書見華歲電語麼對過還讓應當動種現實從無頭聽愛覺]/;
    for (const s of [...strings(content['zh-Hans']!), ...Object.values(messages['zh-Hans']!)]) expect(traditional.test(s), s).toBe(false);
    const pt = [...strings(content.pt!), ...Object.values(messages.pt!)].join(' ');
    for (const word of ['facto', 'equipa', 'telemóvel', 'autocarro', 'ecrã', 'relva']) expect(pt).not.toContain(word);
  });
});
