/**
 * Note-name systems per locale (design § 18.2, § 18.3). Pure and tested; the German B/H rule lives only here.
 *
 * - `letters`: C D E F G A B with ♯/♭ after the letter (before it in Chinese: ♯C, ♭B — 升C, 降B).
 * - `german`: C D E F G A H, with B meaning B♭; Cis Dis Eis Fis Gis Ais His, Ces Des Es Fes Ges As B (de and pl).
 * - `solfege`: fixed do in the locale's script (Do Ré Mi … in French, До Ре Ми … in Russian), with ♯/♭ after it.
 */
import { bcp47Tag } from '@wp/game-core';
import type { Spelled } from './spelling';

export const NAME_SYSTEMS = ['letters', 'german', 'solfege'] as const;
export type NameSystem = (typeof NAME_SYSTEMS)[number];
/** The display preference: `auto` follows the locale. */
export const NAME_PREFS = ['auto', ...NAME_SYSTEMS] as const;
export type NamePref = (typeof NAME_PREFS)[number];

/** Locale defaults (design § 18.2). ja and ko could switch to do-re-mi in one line here after native review. */
const DEFAULTS: Readonly<Record<string, NameSystem>> = {
  en: 'letters', nl: 'letters', hi: 'letters', ja: 'letters', ko: 'letters', 'zh-Hans': 'letters',
  de: 'german', pl: 'german',
  es: 'solfege', fr: 'solfege', it: 'solfege', pt: 'solfege', ru: 'solfege', uk: 'solfege', tr: 'solfege', ar: 'solfege'
};

export const defaultSystem = (locale: string): NameSystem => DEFAULTS[locale] ?? 'letters';

export const resolveSystem = (pref: NamePref, locale: string): NameSystem => (pref === 'auto' ? defaultSystem(locale) : pref);

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
const GERMAN_NATURAL = ['C', 'D', 'E', 'F', 'G', 'A', 'H'] as const;
const GERMAN_SHARP = ['Cis', 'Dis', 'Eis', 'Fis', 'Gis', 'Ais', 'His'] as const;
const GERMAN_FLAT = ['Ces', 'Des', 'Es', 'Fes', 'Ges', 'As', 'B'] as const;

const LATIN_SOLFEGE = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
/** Fixed-do syllables in each locale's script; locales not listed use the Latin syllables. */
const SOLFEGE: Readonly<Record<string, readonly string[]>> = {
  fr: ['Do', 'Ré', 'Mi', 'Fa', 'Sol', 'La', 'Si'],
  pt: ['Dó', 'Ré', 'Mi', 'Fá', 'Sol', 'Lá', 'Si'],
  ru: ['До', 'Ре', 'Ми', 'Фа', 'Соль', 'Ля', 'Си'],
  uk: ['До', 'Ре', 'Мі', 'Фа', 'Соль', 'Ля', 'Сі'],
  ar: ['دو', 'ري', 'مي', 'فا', 'صول', 'لا', 'سي'],
  ja: ['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ'],
  ko: ['도', '레', '미', '파', '솔', '라', '시']
};
const solfege = (locale: string) => SOLFEGE[locale] ?? LATIN_SOLFEGE;

const SIGN = { 1: '♯', [-1]: '♭', 0: '' } as Record<number, string>;

/** The visible name of a pitch class spelling (without octave), e.g. "C♯", "Fis", "H", "Ré♭", "♯C". */
export function noteLabel(s: Pick<Spelled, 'l' | 'a'>, system: NameSystem, locale: string): string {
  if (system === 'german') return (s.a === 1 ? GERMAN_SHARP : s.a === -1 ? GERMAN_FLAT : GERMAN_NATURAL)[s.l]!;
  const base = system === 'solfege' ? solfege(locale)[s.l]! : LETTERS[s.l]!;
  const sign = SIGN[s.a]!;
  return system === 'letters' && locale === 'zh-Hans' ? `${sign}${base}` : `${base}${sign}`;
}

const formatters = new Map<string, Intl.NumberFormat>();
/** A whole number in the locale's digits. */
export function formatInt(n: number, locale: string): string {
  let f = formatters.get(locale);
  if (!f) formatters.set(locale, (f = new Intl.NumberFormat(bcp47Tag(locale), { maximumFractionDigits: 0, useGrouping: false })));
  return f.format(n);
}

/** The visible name with the octave number: "C♯4" (octave digits in the locale's numbering). */
export const noteWithOctave = (s: Spelled, system: NameSystem, locale: string): string => `${noteLabel(s, system, locale)}${formatInt(s.o, locale)}`;

/** Words for ♯ and ♭ per locale, and how they join the name: after it with a space or a hyphen, or before it. */
const SPOKEN: Readonly<Record<string, { sharp: string; flat: string; join: 'space' | 'hyphen' | 'prefix' }>> = {
  en: { sharp: 'sharp', flat: 'flat', join: 'space' },
  de: { sharp: 'Kreuz', flat: 'be', join: 'space' },
  nl: { sharp: 'kruis', flat: 'mol', join: 'space' },
  es: { sharp: 'sostenido', flat: 'bemol', join: 'space' },
  fr: { sharp: 'dièse', flat: 'bémol', join: 'space' },
  it: { sharp: 'diesis', flat: 'bemolle', join: 'space' },
  pt: { sharp: 'sustenido', flat: 'bemol', join: 'space' },
  ru: { sharp: 'диез', flat: 'бемоль', join: 'hyphen' },
  uk: { sharp: 'дієз', flat: 'бемоль', join: 'hyphen' },
  pl: { sharp: 'krzyżyk', flat: 'bemol', join: 'space' },
  tr: { sharp: 'diyez', flat: 'bemol', join: 'space' },
  ar: { sharp: 'دييز', flat: 'بيمول', join: 'space' },
  ja: { sharp: 'シャープ', flat: 'フラット', join: 'space' },
  ko: { sharp: '샤프', flat: '플랫', join: 'space' },
  'zh-Hans': { sharp: '升', flat: '降', join: 'prefix' },
  hi: { sharp: 'शार्प', flat: 'फ़्लैट', join: 'space' }
};

/** Dutch spoken names: cis, des, es, as, bes … (B natural stays "b"). */
const dutch = (s: Pick<Spelled, 'l' | 'a'>): string => {
  const letter = LETTERS[s.l]!.toLowerCase();
  if (s.a === 1) return `${letter}is`;
  if (s.a === -1) return letter === 'e' || letter === 'a' ? `${letter}s` : `${letter}es`;
  return letter;
};

/**
 * The name for screen readers, in words (design § 18.3): "C sharp 4", "Cis 4", "do dièse 4", "до-диез 4", "升C 4",
 * "cis 4" (Dutch letters), with the octave in the locale's digits. Without `octave` the number is left out.
 */
export function spokenNote(s: Spelled, locale: string, system: NameSystem, octave = true): string {
  const parts = SPOKEN[locale] ?? SPOKEN.en!;
  let name: string;
  if (system === 'german') name = noteLabel(s, 'german', locale);
  else if (system === 'letters' && locale === 'nl') name = dutch(s);
  else {
    const base = system === 'solfege' ? (solfege(locale)[s.l]!).toLocaleLowerCase(bcp47Tag(locale)) : LETTERS[s.l]!;
    const word = s.a === 1 ? parts.sharp : s.a === -1 ? parts.flat : '';
    name = !word ? base : parts.join === 'prefix' ? `${word}${base}` : parts.join === 'hyphen' ? `${base}-${word}` : `${base} ${word}`;
  }
  return octave ? `${name} ${formatInt(s.o, locale)}` : name;
}
