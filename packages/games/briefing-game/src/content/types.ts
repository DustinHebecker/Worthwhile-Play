/**
 * Wording of one situation in one UI locale, keyed by the ids in `situations.ts`.
 * - `recipient`: who the briefing is for (shown as "Briefing for: …").
 * - `cards[cardId]`: the statement card text.
 * - `decisions[decisionId]` / `actions[actionId]`: the step-2 options.
 */
export interface SituationText {
  readonly title: string;
  readonly situation: string;
  readonly recipient: string;
  readonly cards: Readonly<Record<string, string>>;
  readonly decisions: Readonly<Record<string, string>>;
  readonly actions: Readonly<Record<string, string>>;
}

export type ContentText = Readonly<Record<string, SituationText>>;
