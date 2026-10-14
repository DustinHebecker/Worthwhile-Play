import type { BulletId, SummaryId, VersionId } from '../pieces';

/**
 * Wording of one piece in one UI locale, keyed by the ids in `pieces.ts` (ADR 0010).
 * - `sentences[s1…]`: the source text, one entry per sentence, in text order.
 * - `bullets` / `summaries` / `versions`: the candidates; `bulletNotes` and `summaryNotes` explain the
 *   distractors that need a piece-specific reason (the others use shared messages).
 * - `task` says who has to act on the `oneLiner`; `details[d1…d6]` are the details they might need.
 * - `versionNote` explains what the `invented` version gets wrong.
 */
export interface PieceText {
  readonly title: string;
  readonly context: string;
  readonly sentences: Readonly<Record<string, string>>;
  readonly bullets: Readonly<Record<BulletId, string>>;
  readonly bulletNotes: Readonly<Record<'distort' | 'dup' | 'subtle', string>>;
  readonly summaries: Readonly<Record<SummaryId, string>>;
  readonly summaryNotes: Readonly<Record<'drops' | 'adds' | 'subtle', string>>;
  readonly task: string;
  readonly oneLiner: string;
  readonly details: Readonly<Record<string, string>>;
  readonly versions: Readonly<Record<VersionId, string>>;
  readonly versionNote: string;
}

export type ContentText = Readonly<Record<string, PieceText>>;
