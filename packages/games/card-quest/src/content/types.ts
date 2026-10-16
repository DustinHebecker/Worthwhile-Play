/**
 * Text of one card in one locale: a transcreated name (≤ 32 characters), a short flavour line (≤ 90) and, for
 * monsters only, a funny Blunder sentence (≤ 90) shown on the card and when the Blunder hits. The binding effect
 * is always the rule line generated from the card structure.
 */
export interface CardText {
  readonly name: string;
  readonly flavour: string;
  readonly blunder?: string;
}

/** All card texts of one locale, keyed by base card id (`kz.lawnmower`). */
export type LocaleContent = Readonly<Record<string, CardText>>;
