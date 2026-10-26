/**
 * Per-locale content of Sense of Time (ADR 0011, design § 17.1): per event its title (shown before answering; never
 * its date) and its note (one sentence shown after answering); per curated pair its insight sentence.
 */
export interface ContentText {
  /** Event id → [title, note]. */
  readonly events: Readonly<Record<string, readonly [string, string]>>;
  /** Curated pair id → insight. */
  readonly pairs: Readonly<Record<string, string>>;
}
