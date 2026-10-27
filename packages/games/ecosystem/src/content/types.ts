/**
 * Wording of Pond & Meadow in one UI locale (design § 17.1, ADR 0011), keyed by the ids in `habitats.ts`,
 * `challenges.ts`, `goals.ts` and `cld.ts`. Writing rules: plain words; common names only (no Latin names in the main
 * texts; an "about" line may add one); no digits in stories (numbers come from the model); neutral management words.
 */

/** Plural forms containing `{n}`, by `Intl.PluralRules` category (`other` is required). */
export type PluralForms = Readonly<Partial<Record<Intl.LDMLPluralRule, string>>> & { readonly other: string };

export interface SpeciesText {
  readonly name: string;
  /** What it eats, who eats it and what it does in the model (one or two sentences). */
  readonly about: string;
}

export interface ChallengeText {
  readonly title: string;
  /** The situation: what changes (one or two sentences). */
  readonly situation: string;
  /** "Think about…": names the stocks to watch without giving the answer. */
  readonly think: string;
  /** Why the model did what it did (≤ 4 sentences). */
  readonly explain: string;
  /** "In real ponds/meadows, also…" (one sentence). */
  readonly real: string;
}

export interface GoalText {
  readonly story: string;
  /** The target in words. */
  readonly target: string;
  /** One sentence pointing at the loop (shown with the diagram). */
  readonly hint: string;
  /** The general explanation for the review. */
  readonly explain: string;
  /** Why each reference plan works, by plan key. */
  readonly plans: Readonly<Record<string, string>>;
}

export interface ContentText {
  /** "{n} weeks" in the plural forms of the locale. */
  readonly weeks: PluralForms;
  readonly species: Readonly<Record<string, SpeciesText>>;
  readonly challenges: Readonly<Record<string, ChallengeText>>;
  readonly goals: Readonly<Record<string, GoalText>>;
  /** One-line descriptions of the loops, by loop key. */
  readonly loops: Readonly<Record<string, string>>;
}
