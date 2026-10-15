/** Text of one card in one locale: a transcreated name (≤ 26 characters) and a short flavour line (≤ 70). */
export interface CardText {
  readonly name: string;
  readonly flavour: string;
}

/** All card texts of one locale, keyed by base card id (`kz.lawnmower`). */
export type LocaleContent = Readonly<Record<string, CardText>>;
