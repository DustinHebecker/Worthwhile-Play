import { describe, expect, it } from 'vitest';
import { SUPPORTED_LOCALES } from '@wp/game-core';
import { NAME_SYSTEMS, defaultSystem, noteLabel, noteWithOctave, resolveSystem, spokenNote } from '../src/notes';
import type { Spelled } from '../src/spelling';

/** The 21 single-accidental spellings: 7 letters × ♭ ♮ ♯. */
const ALL: Spelled[] = [];
for (let l = 0; l < 7; l++) for (const a of [-1, 0, 1] as const) ALL.push({ l, a, o: 4 });

describe('note names (design § 18.2)', () => {
  it('German: B means B♭ and H means B; never "Hes"', () => {
    const german = ALL.map((s) => noteLabel(s, 'german', 'de'));
    expect(german).toEqual(['Ces', 'C', 'Cis', 'Des', 'D', 'Dis', 'Es', 'E', 'Eis', 'Fes', 'F', 'Fis', 'Ges', 'G', 'Gis', 'As', 'A', 'Ais', 'B', 'H', 'His']);
    expect(german).not.toContain('Hes');
    expect(new Set(german).size).toBe(21);
    expect(noteLabel({ l: 6, a: -1 }, 'german', 'pl')).toBe('B');
    expect(noteLabel({ l: 6, a: 0 }, 'german', 'pl')).toBe('H');
  });

  it('letters put the sign after the letter, Chinese before it', () => {
    expect(noteLabel({ l: 0, a: 1 }, 'letters', 'en')).toBe('C♯');
    expect(noteLabel({ l: 6, a: -1 }, 'letters', 'en')).toBe('B♭');
    expect(noteLabel({ l: 6, a: 0 }, 'letters', 'ja')).toBe('B');
    expect(noteLabel({ l: 0, a: 1 }, 'letters', 'zh-Hans')).toBe('♯C');
    expect(noteLabel({ l: 6, a: -1 }, 'letters', 'zh-Hans')).toBe('♭B');
  });

  it('fixed do in the locale script', () => {
    expect(noteLabel({ l: 1, a: 0 }, 'solfege', 'fr')).toBe('Ré');
    expect(noteLabel({ l: 3, a: 1 }, 'solfege', 'pt')).toBe('Fá♯');
    expect(noteLabel({ l: 4, a: 0 }, 'solfege', 'ru')).toBe('Соль');
    expect(noteLabel({ l: 6, a: -1 }, 'solfege', 'uk')).toBe('Сі♭');
    expect(noteLabel({ l: 4, a: 0 }, 'solfege', 'ar')).toBe('صول');
    expect(noteLabel({ l: 0, a: 0 }, 'solfege', 'en')).toBe('Do');
    expect(noteLabel({ l: 3, a: 0 }, 'solfege', 'ja')).toBe('ファ');
  });

  it('every system gives 21 distinct names in every locale, and no fallback "#"/"b" signs', () => {
    for (const locale of SUPPORTED_LOCALES)
      for (const system of NAME_SYSTEMS) {
        const names = ALL.map((s) => noteLabel(s, system, locale));
        expect(new Set(names).size, `${locale} ${system}`).toBe(21);
        for (const n of names) expect(n).not.toMatch(/#|(?<=[A-G])b\b/);
      }
  });

  it('locale defaults', () => {
    expect(defaultSystem('en')).toBe('letters');
    expect(defaultSystem('de')).toBe('german');
    expect(defaultSystem('pl')).toBe('german');
    expect(defaultSystem('fr')).toBe('solfege');
    expect(defaultSystem('ar')).toBe('solfege');
    expect(defaultSystem('zh-Hans')).toBe('letters');
    expect(defaultSystem('xx')).toBe('letters');
    expect(resolveSystem('auto', 'it')).toBe('solfege');
    expect(resolveSystem('letters', 'it')).toBe('letters');
    for (const l of SUPPORTED_LOCALES) expect(NAME_SYSTEMS).toContain(defaultSystem(l));
  });

  it('octave numbers use the locale digits', () => {
    expect(noteWithOctave({ l: 0, a: 1, o: 4 }, 'letters', 'en')).toBe('C♯4');
    expect(noteWithOctave({ l: 6, a: 0, o: 4 }, 'german', 'de')).toBe('H4');
    expect(noteWithOctave({ l: 0, a: 0, o: 4 }, 'solfege', 'ar')).toBe(`دو${new Intl.NumberFormat('ar').format(4)}`);
  });
});

describe('spoken names (design § 18.3)', () => {
  it('reads accidentals as words in each language', () => {
    const cs: Spelled = { l: 0, a: 1, o: 4 };
    expect(spokenNote(cs, 'en', 'letters')).toBe('C sharp 4');
    expect(spokenNote(cs, 'de', 'german')).toBe('Cis 4');
    expect(spokenNote(cs, 'fr', 'solfege')).toBe('do dièse 4');
    expect(spokenNote(cs, 'es', 'solfege')).toBe('do sostenido 4');
    expect(spokenNote(cs, 'it', 'solfege')).toBe('do diesis 4');
    expect(spokenNote(cs, 'pt', 'solfege')).toBe('dó sustenido 4');
    expect(spokenNote(cs, 'ru', 'solfege')).toBe('до-диез 4');
    expect(spokenNote(cs, 'ja', 'letters')).toBe('C シャープ 4');
    expect(spokenNote(cs, 'zh-Hans', 'letters')).toBe('升C 4');
    expect(spokenNote(cs, 'hi', 'letters')).toBe('C शार्प 4');
    expect(spokenNote(cs, 'ar', 'solfege')).toBe(`دو دييز ${new Intl.NumberFormat('ar').format(4)}`);
  });

  it('Dutch letters are spoken with the Dutch suffix names', () => {
    expect(spokenNote({ l: 6, a: -1, o: 4 }, 'nl', 'letters')).toBe('bes 4');
    expect(spokenNote({ l: 2, a: -1, o: 4 }, 'nl', 'letters')).toBe('es 4');
    expect(spokenNote({ l: 5, a: -1, o: 4 }, 'nl', 'letters')).toBe('as 4');
    expect(spokenNote({ l: 3, a: 1, o: 4 }, 'nl', 'letters')).toBe('fis 4');
    expect(spokenNote({ l: 6, a: 0, o: 4 }, 'nl', 'letters', false)).toBe('b');
  });

  it('German B and H are spoken as written', () => {
    expect(spokenNote({ l: 6, a: -1, o: 3 }, 'de', 'german')).toBe('B 3');
    expect(spokenNote({ l: 6, a: 0, o: 3 }, 'de', 'german')).toBe('H 3');
  });
});
