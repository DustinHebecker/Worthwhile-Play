/**
 * What the view needs to name things in the UI locale: translator, content, display preferences (design § 12; per
 * device, validated on read, never state) and note names in the chosen system.
 */
import type { GamePreferences, Translator } from '@wp/game-core';
import { contentFor, type ContentText } from './content';
import { formatNumber, formatPlural, ratioText } from './format';
import { NAME_PREFS, noteLabel, noteWithOctave, resolveSystem, spokenNote, type NamePref, type NameSystem } from './notes';
import { readVolume } from './audio/schedule';
import { defaultSpelling, type Spelled } from './spelling';
import type { CadenceId, ChordId, IntervalId, ScaleId } from './theory';

export interface Prefs {
  readonly volume: number;
  readonly muted: boolean;
  readonly names: NamePref;
  readonly autoplay: boolean;
  readonly countIn: boolean;
  readonly keys: 'piano' | 'buttons';
}

export const PREF_KEYS = { volume: 'volume', muted: 'muted', names: 'names', autoplay: 'autoplay', countIn: 'countIn', keys: 'keys' } as const;

/** Display preferences from the device; junk falls back to the defaults (design § 12). */
export function readPrefs(store: GamePreferences | undefined): Prefs {
  const get = (k: string): unknown => {
    try {
      return store?.get(k);
    } catch {
      return undefined;
    }
  };
  const names = get(PREF_KEYS.names);
  const keys = get(PREF_KEYS.keys);
  return {
    volume: readVolume(get(PREF_KEYS.volume)),
    muted: get(PREF_KEYS.muted) === true,
    names: (NAME_PREFS as readonly unknown[]).includes(names) ? (names as NamePref) : 'auto',
    autoplay: get(PREF_KEYS.autoplay) === true,
    countIn: get(PREF_KEYS.countIn) !== false,
    keys: keys === 'buttons' ? 'buttons' : 'piano'
  };
}

export function writePref(store: GamePreferences | undefined, key: keyof typeof PREF_KEYS, value: unknown): void {
  try {
    store?.set(PREF_KEYS[key], value);
  } catch {
    /* preferences are optional */
  }
}

export interface Env {
  readonly t: Translator;
  readonly locale: string;
  readonly c: ContentText;
  readonly system: NameSystem;
  /** Visible name without octave ("C♯", "Fis", "Ré♭"). */
  note(s: Pick<Spelled, 'l' | 'a'>): string;
  /** Visible name with octave ("C♯4"). */
  noteOct(s: Spelled): string;
  /** Screen-reader name ("C sharp 4"). */
  spoken(s: Spelled): string;
  spokenMidi(midi: number): string;
  int(n: number): string;
  semitones(n: number): string;
  cents(n: number): string;
  ivl(id: IntervalId): string;
  chord(id: ChordId): string;
  scale(id: ScaleId): string;
  cadence(id: CadenceId): string;
  ratio(p: number, q: number): string;
}

export function createEnv(t: Translator, names: NamePref): Env {
  const locale = t.locale;
  const c = contentFor(locale);
  const system = resolveSystem(names, locale);
  return {
    t,
    locale,
    c,
    system,
    note: (s) => noteLabel(s, system, locale),
    noteOct: (s) => noteWithOctave(s, system, locale),
    spoken: (s) => spokenNote(s, locale, system),
    spokenMidi: (m) => spokenNote(defaultSpelling(m), locale, system),
    int: (n) => formatNumber(n, locale),
    semitones: (n) => formatPlural(c.semitones, n, locale),
    cents: (n) => formatPlural(c.cents, Math.abs(n), locale, Number.isInteger(Math.abs(n)) ? 0 : 1),
    ivl: (id) => c.intervals[id],
    chord: (id) => c.chords[id],
    scale: (id) => c.scales[id],
    cadence: (id) => c.cadences[id].name,
    ratio: (p, q) => ratioText(p, q, locale)
  };
}
