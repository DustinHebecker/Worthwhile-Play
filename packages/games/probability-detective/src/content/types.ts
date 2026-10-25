/**
 * Wording of the case templates in one UI locale (ADR 0010/0011), keyed by the ids in `templates.ts` and `traps.ts`.
 * Writing rules: no digits in story or clue sentences (numbers come from structured rows or `{placeholders}`);
 * hypotheses are things, places, animals or causes, never people or groups; no person names (design § 4, § 17.2).
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

export interface CheckText {
  readonly label: string;
  /** The result sentence when the check shows yes / no. */
  readonly yes: string;
  readonly no: string;
}

export interface CheckTemplateText {
  readonly title: string;
  readonly story: string;
  readonly lead: string;
  readonly hyps: Readonly<Record<string, string>>;
  /** The belief question before deciding ("How likely is a dry afternoon?"). */
  readonly question: string;
  readonly options: Readonly<Record<string, string>>;
  readonly checks: Readonly<Record<string, CheckText>>;
}

export interface TrapText {
  readonly title: string;
  /** The puzzle, with `{placeholders}` for its numbers. */
  readonly story: string;
  /** Question texts by question id (`q1`, `q2`). */
  readonly questions: Readonly<Record<string, string>>;
  /** Choice option texts by option id (may hold placeholders). */
  readonly options: Readonly<Record<string, string>>;
  /** The explanation after checking, with placeholders. */
  readonly explain: string;
  /** Labels of the explanation visual (groups, rows, columns, series), by id. */
  readonly labels: Readonly<Record<string, string>>;
}

export interface ContentText {
  readonly templates: Readonly<Record<string, TemplateText>>;
  readonly checks: Readonly<Record<string, CheckTemplateText>>;
  readonly traps: Readonly<Record<string, TrapText>>;
}
