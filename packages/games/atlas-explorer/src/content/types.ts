/**
 * Per-locale content of Atlas Explorer (ADR 0011, design § 13): curated names of cities (other than the capitals of the
 * *Capitals* deck, which come from `capitalName`), rivers, lakes, mountain ranges, deserts, plateaus, basins and seas;
 * the names of the UN sub-regions; and short insight sentences shown in reviews. Writing rules: the conventional
 * exonym of the language, everyday short forms, Brazilian Portuguese, Simplified Chinese; no digits in sentences.
 */
export interface ContentText {
  /** City, feature and sea names by id. */
  readonly names: Readonly<Record<string, string>>;
  /** UN M49 sub-region names by id (e.g. `eastern-africa`). */
  readonly subs: Readonly<Record<string, string>>;
  /** One factual sentence per place id (optional per place, same ids in every locale). */
  readonly insights: Readonly<Record<string, string>>;
}
