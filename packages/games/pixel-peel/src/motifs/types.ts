/**
 * The data format of a Pixel Peel motif (design § 6.1). A motif is pure data: adding or redrawing one is a new file
 * in this folder plus one line in `index.ts`; the tests iterate over `MOTIFS` and check every rule of design § 6.2.
 */

/** The 16 UI locales (same list and order as `@wp/localization`; games depend only on `@wp/game-core`). */
export const LOCALES = ['de', 'en', 'nl', 'es', 'fr', 'ru', 'zh-Hans', 'ko', 'ja', 'ar', 'pt', 'it', 'pl', 'tr', 'uk', 'hi'] as const;
export type Locale = (typeof LOCALES)[number];

/** A text in every UI locale; a missing locale is a compile error. */
export type Localized = Readonly<Record<Locale, string>>;

/**
 * The fixed colour vocabulary, translated once in the message catalogues (`colour.<name>`). Reusing a name is a
 * data-only change; a new name needs a translation in every locale.
 */
export { COLOUR_NAMES, type ColourName } from '../art/types';
import type { ColourName } from '../art/types';

export type MotifGroup = 'season' | 'landscape' | 'animal';

export interface Motif {
  /** `[a-z0-9-]{2,32}`, unique, never `any`. Saves keep a full copy of the picture, so renaming loses only the title. */
  readonly id: string;
  readonly group: MotifGroup;
  /** Shown in the start-screen list and on the reveal (at most 32 characters). */
  readonly title: Localized;
  /** One factual line on the reveal: where this is found (broad terms for animals' native ranges). */
  readonly place: Localized;
  /** `#rrggbb` behind transparent and removed pixels. */
  readonly backdrop: string;
  /**
   * Palette keys are single lowercase letters (so object order is insertion order = symbol order); values are
   * `[#rrggbb, colour name]`.
   */
  readonly palette: Readonly<Record<string, readonly [string, ColourName]>>;
  /** Exactly H strings of W characters: palette keys, or `.` for transparent. Row 0 is the top. */
  readonly rows: readonly string[];
}
