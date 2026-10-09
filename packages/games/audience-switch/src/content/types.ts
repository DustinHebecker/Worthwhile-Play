/**
 * Wording of one scenario in one UI locale, keyed by the ids in `scenarios.ts`.
 * - `facts[factId]`: the fact card text.
 * - `reasons['<audience>.<factId>']`: why that audience needs (`must`) or does not need (`leave`) the fact.
 *   A plain `'<factId>'` key is a reason shared by every audience (e.g. a myth nobody needs).
 *   Optional facts use the shared `reason.optional` message.
 * - `messages['<audience>.<messageId>']`: the three candidate messages for that audience.
 */
export interface ScenarioText {
  readonly title: string;
  readonly situation: string;
  readonly facts: Readonly<Record<string, string>>;
  readonly reasons: Readonly<Record<string, string>>;
  readonly messages: Readonly<Record<string, string>>;
}

export type ContentText = Readonly<Record<string, ScenarioText>>;
