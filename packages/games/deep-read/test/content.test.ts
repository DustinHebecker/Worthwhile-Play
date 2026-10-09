import { describe, expect, it } from 'vitest';
import { SUPPORTED_LOCALES } from '@wp/localization';
import { CONTENT, contentFor } from '../src/content';
import { TEXTS } from '../src/content/structure';
import { DIFFICULTIES, OPTION_IDS, QUESTION_TYPES, type LocaleContent, type OptionText, type QuestionText } from '../src/content/types';

const PLACEHOLDER = /\{(\w+)\}/g;

/** Every problem with one locale's content compared with the language-independent structure. */
function auditLocale(locale: string, content: LocaleContent | undefined): string[] {
  const problems: string[] = [];
  if (!content) return [`${locale}: missing content`];
  const textIds = TEXTS.map((t) => t.id);
  for (const id of Object.keys(content)) if (!textIds.includes(id)) problems.push(`${locale}: extra text "${id}"`);
  const nonEmpty = (value: unknown, where: string) => {
    if (typeof value !== 'string' || value.trim() === '') problems.push(`${locale}: empty ${where}`);
    else if (PLACEHOLDER.test(value)) problems.push(`${locale}: placeholder in ${where}`);
    PLACEHOLDER.lastIndex = 0;
  };
  for (const text of TEXTS) {
    const c = content[text.id];
    if (!c) {
      problems.push(`${locale}: missing text "${text.id}"`);
      continue;
    }
    nonEmpty(c.title, `${text.id}.title`);
    nonEmpty(c.summary, `${text.id}.summary`);
    if (c.paragraphs.length !== text.paragraphs) problems.push(`${locale}: ${text.id} has ${c.paragraphs.length} paragraphs, expected ${text.paragraphs}`);
    c.paragraphs.forEach((p, i) => nonEmpty(p, `${text.id}.p${i + 1}`));
    const questionIds = text.questions.map((q) => q.id);
    for (const id of Object.keys(c.questions)) if (!questionIds.includes(id)) problems.push(`${locale}: extra question "${text.id}.${id}"`);
    for (const q of text.questions) {
      const qc: QuestionText | undefined = c.questions[q.id];
      if (!qc) {
        problems.push(`${locale}: missing question "${text.id}.${q.id}"`);
        continue;
      }
      nonEmpty(qc.q, `${text.id}.${q.id}.q`);
      for (const option of OPTION_IDS) {
        const value: OptionText | undefined = qc[option];
        const expected = q.options.includes(option);
        if (expected !== (value !== undefined)) problems.push(`${locale}: ${text.id}.${q.id}.${option} ${expected ? 'missing' : 'unexpected'}`);
        if (value) {
          if (value.length !== 2) problems.push(`${locale}: ${text.id}.${q.id}.${option} must be [text, explanation]`);
          nonEmpty(value[0], `${text.id}.${q.id}.${option} text`);
          nonEmpty(value[1], `${text.id}.${q.id}.${option} explanation`);
        }
      }
      const keys = Object.keys(qc).filter((k) => k !== 'q');
      for (const k of keys) if (!(OPTION_IDS as readonly string[]).includes(k)) problems.push(`${locale}: ${text.id}.${q.id} has unknown key "${k}"`);
      // Distinct option texts, so no two answers look the same.
      const labels = q.options.map((o) => qc[o]?.[0]);
      if (new Set(labels).size !== labels.length) problems.push(`${locale}: ${text.id}.${q.id} has duplicate option texts`);
    }
  }
  return problems;
}

describe('content structure', () => {
  it('has twelve texts with unique ids, four per difficulty, ordered easy → hard', () => {
    expect(TEXTS).toHaveLength(12);
    expect(new Set(TEXTS.map((t) => t.id)).size).toBe(12);
    for (const d of DIFFICULTIES) expect(TEXTS.filter((t) => t.difficulty === d)).toHaveLength(4);
    const order = TEXTS.map((t) => DIFFICULTIES.indexOf(t.difficulty));
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('keeps the ids and gold answers that existing saves reference (append-only)', () => {
    // Saves store text, question and option ids; these first six texts shipped in the first release.
    const shipped: Record<string, string> = {
      'city-trees': 'abcb',
      bees: 'abcb',
      lighthouse: 'acbcb',
      'time-zones': 'bacac',
      repair: 'cabcba',
      library: 'dbacab'
    };
    for (const [id, golds] of Object.entries(shipped)) {
      const text = TEXTS.find((t) => t.id === id);
      expect(text?.questions.map((q) => q.gold).join(''), id).toBe(golds);
      expect(text?.questions.map((q) => q.id), id).toEqual([...golds].map((_, i) => `q${i + 1}`));
    }
  });

  it('gives easy texts 4 questions, medium 5 and hard 6', () => {
    const expected = { easy: 4, medium: 5, hard: 6 } as const;
    for (const text of TEXTS) expect(text.questions, text.id).toHaveLength(expected[text.difficulty]);
  });

  it('has well-formed questions: unique ids, known type, 3–4 distinct options, gold among options, valid support paragraph', () => {
    for (const text of TEXTS) {
      expect(new Set(text.questions.map((q) => q.id)).size, text.id).toBe(text.questions.length);
      expect(text.questions[0]?.type, `${text.id} starts with the main idea`).toBe('main');
      for (const q of text.questions) {
        const where = `${text.id}.${q.id}`;
        expect(QUESTION_TYPES, where).toContain(q.type);
        expect(q.options.length, where).toBeGreaterThanOrEqual(3);
        expect(q.options.length, where).toBeLessThanOrEqual(4);
        expect(new Set(q.options).size, where).toBe(q.options.length);
        expect(q.options, where).toEqual(OPTION_IDS.slice(0, q.options.length));
        expect(q.options, where).toContain(q.gold);
        if (q.support !== undefined) {
          expect(Number.isInteger(q.support), where).toBe(true);
          expect(q.support, where).toBeGreaterThanOrEqual(1);
          expect(q.support, where).toBeLessThanOrEqual(text.paragraphs);
        }
      }
    }
  });

  it('covers every question type and spreads gold answers over positions', () => {
    const types = new Set(TEXTS.flatMap((t) => t.questions.map((q) => q.type)));
    expect([...types].sort()).toEqual([...QUESTION_TYPES].sort());
    const hard = TEXTS.filter((t) => t.difficulty === 'hard').flatMap((t) => t.questions.map((q) => q.type));
    for (const type of ['structure', 'contradiction', 'evidence']) expect(hard).toContain(type);
    const golds = TEXTS.flatMap((t) => t.questions.map((q) => q.gold));
    for (const id of ['a', 'b', 'c']) expect(golds.filter((g) => g === id).length).toBeGreaterThanOrEqual(5);
  });
});

describe('content in all 16 locales', () => {
  it('provides exactly the supported locales', () => {
    expect(Object.keys(CONTENT).sort()).toEqual([...SUPPORTED_LOCALES].sort());
  });

  it.each([...SUPPORTED_LOCALES])('%s matches the id structure with non-empty strings', (locale) => {
    expect(auditLocale(locale, CONTENT[locale])).toEqual([]);
  });

  it('detects structural drift (auditor self-test)', () => {
    const en = CONTENT.en as LocaleContent;
    const broken = JSON.parse(JSON.stringify(en)) as Record<string, { paragraphs: string[]; questions: Record<string, Record<string, unknown>> }>;
    broken['bees']!.paragraphs.pop();
    delete broken['library']!.questions['q6']!['b'];
    broken['repair']!.questions['q1']!['q'] = ' ';
    broken['city-trees']!.questions['q2']!['d'] = ['x', 'y'];
    const problems = auditLocale('xx', broken as unknown as LocaleContent);
    expect(problems).toContain('xx: bees has 3 paragraphs, expected 4');
    expect(problems).toContain('xx: library.q6.b missing');
    expect(problems).toContain('xx: empty repair.q1.q');
    expect(problems).toContain('xx: city-trees.q2.d unexpected');
  });

  it('keeps Cyrillic texts free of stray Latin letters inside words', () => {
    for (const locale of ['ru', 'uk']) {
      const json = JSON.stringify(CONTENT[locale]);
      expect(json.match(/[а-яёіїєґ][a-z]|[a-z][а-яёіїєґ]/gi), locale).toBeNull();
    }
  });

  it('keeps the bundled content reasonably small', () => {
    const bytes = Object.values(CONTENT).reduce((sum, c) => sum + new TextEncoder().encode(JSON.stringify(c)).length, 0);
    expect(bytes).toBeLessThan(1200 * 1024);
  });

  it('falls back to English for unknown locales', () => {
    expect(contentFor('xx')).toBe(CONTENT.en);
    expect(contentFor('de')).toBe(CONTENT.de);
  });
});
