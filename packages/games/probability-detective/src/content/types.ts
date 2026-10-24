/**
 * Wording of the case templates in one UI locale (ADR 0010/0011), keyed by the ids in `templates.ts`.
 * Writing rules: no digits in story or clue sentences (numbers come from structured rows); hypotheses are things,
 * places, animals or causes, never people or groups; no person names (design § 4, § 17.2).
 */
export interface ClueText {
  /** Short name of the observation ("Wrapped in blue paper"). */
  readonly label: string;
  /** The observation when the clue shows. */
  readonly seen: string;
  /** The observation when it does not show (neutral and echo clues always show; repeat `seen`). */
  readonly notSeen: string;
}

export interface TemplateText {
  readonly title: string;
  readonly story: string;
  /** Lead line of the base rates ("Parcels on this street come from:"). */
  readonly lead: string;
  readonly hyps: Readonly<Record<string, string>>;
  readonly clues: Readonly<Record<string, ClueText>>;
}

export interface ContentText {
  readonly templates: Readonly<Record<string, TemplateText>>;
}
