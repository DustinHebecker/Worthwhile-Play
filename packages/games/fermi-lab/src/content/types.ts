import type { CountedWord } from '../units';

/** Plural forms by `Intl.PluralRules` category (`other` is required). */
export type PluralForms = Readonly<Partial<Record<Intl.LDMLPluralRule, string>>> & { readonly other: string };

/** Sentences about "{n} times too high/low": the number `{n}` decides the form ("1 vez", "5 раз", "2 раза"). */
export interface RatioText {
  /** Review: "{n} times too high." */
  readonly high: PluralForms;
  readonly low: PluralForms;
  /** Summary row: "{n} times too high" (no full stop). */
  readonly rowHigh: PluralForms;
  readonly rowLow: PluralForms;
  /** Summary: "On average your answers were {n} times too high." */
  readonly biasHigh: PluralForms;
  readonly biasLow: PluralForms;
}

/**
 * Wording of the tasks in one UI locale (ADR 0010/0011), keyed by the ids in `tasks.ts`.
 * - `factors[id]`: the name of a reference factor (ids are shared between tasks when the meaning is the same).
 * - `tasks[id]`: a short `title` (for the summary), the `question` and the `explain`ation shown after answering.
 * - `counts[word]`: the word shown after a number ("40,000 grains", "1 day", "21 год", "5 лет"), one form per plural
 *   category of the locale, without the number (the view shows the number separately). The per-unit form ("g/grain")
 *   stays in the UI catalogue as `u.<word>`.
 * - `ratios`: the "times too high/low" sentences with `{n}`, one form per plural category ("one"/"two" may spell the
 *   number out, as in Arabic "بمرتين").
 */
export interface TaskText {
  readonly title: string;
  readonly question: string;
  readonly explain: string;
}

export interface ContentText {
  readonly counts: Readonly<Record<CountedWord, PluralForms>>;
  readonly ratios: RatioText;
  readonly factors: Readonly<Record<string, string>>;
  readonly tasks: Readonly<Record<string, TaskText>>;
}
