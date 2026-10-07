// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { COMMON_MESSAGES, SUPPORTED_LOCALES, createTranslator, type SupportedLocale } from '@wp/localization';
import { messages } from '../src/messages';
import { metadata } from '../src/metadata';
import { CLUE_TYPES, DIFFICULTIES, NAME_COUNT, VOCABULARY, ATTRIBUTE_KINDS, generatePuzzle, type Clue, type Puzzle } from '../src/rules';
import { capitalizeFirst, categoryLabel, clueText, itemLabel, subjectPhrase } from '../src/text';

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

const translator = (locale: SupportedLocale) => {
  const missing: string[] = [];
  const t = createTranslator({ locale, sources: [messages, COMMON_MESSAGES], onMissing: (key) => missing.push(key) });
  return { t, missing };
};

const PUZZLE: Pick<Puzzle, 'kinds' | 'vocab'> = {
  kinds: ['person', 'floor', 'pet', 'drink'],
  vocab: [[0, 1, 2], [0, 1, 2], [0, 3, 5], [1, 2, 4]]
};

describe('clue templates', () => {
  it('exist for every clue type in all locales with exactly the expected placeholders', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const catalogue = messages[locale];
      expect(catalogue, locale).toBeDefined();
      for (const type of CLUE_TYPES) {
        const template = catalogue?.[`clue.${type}`];
        expect(template, `${locale} clue.${type}`).toBeTruthy();
        expect(placeholders(template ?? ''), `${locale} clue.${type}`).toEqual(type === 'eitherOr' ? ['a', 'b', 'c'] : ['a', 'b']);
      }
      expect(placeholders(catalogue?.['subject.person'] ?? '')).toEqual(['name']);
      expect(placeholders(catalogue?.['subject.floor'] ?? '')).toEqual(['n']);
      expect(placeholders(catalogue?.['floor.item'] ?? '')).toEqual(['n']);
    }
  });

  it('has every vocabulary label and subject phrase in all locales, without placeholders', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const catalogue = messages[locale] ?? {};
      for (let i = 0; i < NAME_COUNT; i++) expect(catalogue[`name.${i}`], `${locale} name.${i}`).toBeTruthy();
      for (const kind of ['person', 'floor', ...ATTRIBUTE_KINDS]) expect(catalogue[`category.${kind}`], `${locale} ${kind}`).toBeTruthy();
      for (const kind of ATTRIBUTE_KINDS) {
        const subjects = new Set<string>();
        for (const id of VOCABULARY[kind]) {
          expect(catalogue[`item.${kind}.${id}`], `${locale} item.${kind}.${id}`).toBeTruthy();
          const subject = catalogue[`subject.${kind}.${id}`] ?? '';
          expect(subject, `${locale} subject.${kind}.${id}`).toBeTruthy();
          expect(placeholders(subject)).toEqual([]);
          subjects.add(subject);
        }
        expect(subjects.size, `${locale} ${kind} subjects distinct`).toBe(VOCABULARY[kind].length);
      }
      const names = new Set(Array.from({ length: NAME_COUNT }, (_, i) => catalogue[`name.${i}`]));
      expect(names.size, `${locale} names distinct`).toBe(NAME_COUNT);
    }
  });

  it('French names start with a consonant (no elision before "de"/"que")', () => {
    for (let i = 0; i < NAME_COUNT; i++) expect(messages.fr?.[`name.${i}`]).toMatch(/^[^AEIOUYÉÈaeiouy]/);
    for (const kind of ATTRIBUTE_KINDS) for (const id of VOCABULARY[kind]) expect(messages.fr?.[`subject.${kind}.${id}`]).toMatch(/^la personne /);
  });

  it('Korean phrases end with a final consonant so the fixed particles 은/이/과 fit', () => {
    const ko = messages.ko ?? {};
    for (const kind of ATTRIBUTE_KINDS) for (const id of VOCABULARY[kind]) expect(ko[`subject.${kind}.${id}`]).toMatch(/사람$/);
    expect(ko['subject.floor']).toMatch(/사람$/);
    expect(ko['subject.person']).toMatch(/님$/);
  });
});

describe('labels and sentences', () => {
  const { t } = translator('en');

  it('labels items and categories', () => {
    expect(itemLabel(t, PUZZLE, 0, 2)).toBe('David');
    expect(itemLabel(t, PUZZLE, 1, 0)).toBe('Floor 1');
    expect(itemLabel(t, PUZZLE, 1, 2)).toBe('Floor 3');
    expect(itemLabel(t, PUZZLE, 2, 1)).toBe('Fish');
    expect(itemLabel(t, PUZZLE, 3, 2)).toBe('Water');
    expect(categoryLabel(t, PUZZLE, 0)).toBe('Name');
    expect(categoryLabel(t, PUZZLE, 1)).toBe('Floor');
    expect(categoryLabel(t, PUZZLE, 3)).toBe('Drink');
  });

  it('builds subject phrases', () => {
    expect(subjectPhrase(t, PUZZLE, { cat: 0, item: 1 })).toBe('Clara');
    expect(subjectPhrase(t, PUZZLE, { cat: 1, item: 1 })).toBe('the person on floor 2');
    expect(subjectPhrase(t, PUZZLE, { cat: 2, item: 2 })).toBe('the person with the turtle');
    expect(subjectPhrase(t, PUZZLE, { cat: 3, item: 0 })).toBe('the coffee drinker');
  });

  it('renders every clue type as a capitalised sentence', () => {
    const r = (clue: Clue) => clueText(t, PUZZLE, clue);
    expect(r({ type: 'same', a: { cat: 0, item: 0 }, b: { cat: 2, item: 0 } })).toBe('Ben is the person with the cat.');
    expect(r({ type: 'notSame', a: { cat: 1, item: 0 }, b: { cat: 3, item: 1 } })).toBe('The person on floor 1 is not the milk drinker.');
    expect(r({ type: 'directlyAbove', a: { cat: 2, item: 1 }, b: { cat: 0, item: 2 } })).toBe('The person with the fish lives exactly one floor above David.');
    expect(r({ type: 'above', a: { cat: 0, item: 1 }, b: { cat: 0, item: 0 } })).toBe('Clara lives on a higher floor than Ben.');
    expect(r({ type: 'nextTo', a: { cat: 3, item: 2 }, b: { cat: 2, item: 2 } })).toBe('The water drinker and the person with the turtle live on neighbouring floors.');
    expect(r({ type: 'eitherOr', a: { cat: 0, item: 2 }, b: { cat: 1, item: 0 }, c: { cat: 1, item: 2 } })).toBe('David is either the person on floor 1 or the person on floor 3.');
  });

  it('uses locale-specific phrases (German, Korean, Arabic)', () => {
    const de = translator('de').t;
    expect(clueText(de, PUZZLE, { type: 'directlyAbove', a: { cat: 2, item: 0 }, b: { cat: 0, item: 1 } })).toBe('Die Person mit der Katze wohnt genau eine Etage höher als Clara.');
    const ko = translator('ko').t;
    expect(clueText(ko, PUZZLE, { type: 'same', a: { cat: 0, item: 0 }, b: { cat: 2, item: 0 } })).toBe('벤 님은 고양이를 키우는 사람입니다.');
    const ar = translator('ar').t;
    expect(clueText(ar, PUZZLE, { type: 'notSame', a: { cat: 0, item: 0 }, b: { cat: 3, item: 0 } })).toBe('بن وشارب القهوة شخصان مختلفان.');
  });

  it('capitalises the first letter only, locale-aware, and leaves caseless scripts alone', () => {
    expect(capitalizeFirst('the cat', 'en')).toBe('The cat');
    expect(capitalizeFirst('istanbul', 'tr')).toBe('İstanbul');
    expect(capitalizeFirst('человек', 'ru')).toBe('Человек');
    expect(capitalizeFirst('养猫的人', 'zh-Hans')).toBe('养猫的人');
    expect(capitalizeFirst('', 'en')).toBe('');
    expect(capitalizeFirst('4. katta', 'tr')).toBe('4. katta');
    expect(capitalizeFirst('éa', 'fr')).toBe('Éa');
  });

  it('renders every generated clue in every locale without missing keys or leftover placeholders', () => {
    const puzzles = DIFFICULTIES.flatMap((d) => [1, 2, 3, 4, 5, 6].map((seed) => generatePuzzle(seed * 101, d)));
    for (const locale of SUPPORTED_LOCALES) {
      const { t: tl, missing } = translator(locale);
      for (const p of puzzles) {
        for (const clue of p.clues) {
          const text = clueText(tl, p, clue);
          expect(text).not.toMatch(/[{}]/);
          expect(text.length).toBeGreaterThan(5);
        }
        for (let c = 0; c < p.kinds.length; c++) for (let i = 0; i < p.size; i++) expect(itemLabel(tl, p, c, i)).not.toMatch(/[{}.]/);
      }
      expect(missing, locale).toEqual([]);
    }
  });

  it('metadata declares difficulties easy → hard with labels', () => {
    expect(metadata.difficulties).toEqual(['easy', 'medium', 'hard']);
    expect(metadata.id).toBe('constraint-grid');
    expect(messages.en?.title).toBe('Logic Grid');
    expect(messages.de?.title).toBe('Logikgitter');
    for (const locale of SUPPORTED_LOCALES) for (const d of DIFFICULTIES) expect(messages[locale]?.[`difficulty.${d}`]).toBeTruthy();
  });
});
