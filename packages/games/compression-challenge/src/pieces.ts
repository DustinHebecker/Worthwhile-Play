/**
 * Language-independent content of Compression Challenge (ADR 0010): ids, kinds, difficulty levels and gold
 * answers. All wording lives in `content/<locale>.ts`, keyed by these ids, so a save stays valid when the
 * UI language changes.
 */

/** `core` carries the message, `detail` is true but not needed for the gist, `noise` is a side remark. */
export type SentenceKind = 'core' | 'detail' | 'noise';

/**
 * Candidate bullets. The three `gold*` bullets are the best summary; the distractors are
 * `minor` (true but a minor detail), `distort` (overstates or changes what the text says),
 * `dup` (a vaguer repeat of a gold point) and `subtle` (a near copy of a gold point with a number,
 * hedge or cause slightly changed — hard only).
 */
export const BULLETS = ['gold1', 'gold2', 'gold3', 'minor', 'distort', 'dup', 'subtle'] as const;
export type BulletId = (typeof BULLETS)[number];
export const GOLD_BULLETS: readonly BulletId[] = ['gold1', 'gold2', 'gold3'];
/** Bullets whose explanation is written per piece (the others use a shared message). */
export const NOTED_BULLETS = ['distort', 'dup', 'subtle'] as const;

/**
 * One-sentence summaries: exactly one is `faithful`; `vague` says nothing concrete, `drops` leaves out the
 * key decision or number, `adds` adds an unsupported claim, `subtle` changes a hedge, number or cause.
 */
export const SUMMARIES = ['faithful', 'vague', 'drops', 'adds', 'subtle'] as const;
export type SummaryId = (typeof SUMMARIES)[number];
export const NOTED_SUMMARIES = ['drops', 'adds', 'subtle'] as const;

/** Expanded versions of the one-liner: one `actionable`, one `vague`, one with `invented` or wrong facts. */
export const VERSIONS = ['actionable', 'vague', 'invented'] as const;
export type VersionId = (typeof VERSIONS)[number];

export interface SentenceDef {
  readonly id: string;
  readonly kind: SentenceKind;
  /** Lowest difficulty index (0 easy, 1 medium, 2 hard) on which the sentence is part of the text. */
  readonly level: 0 | 1 | 2;
}

export interface DetailDef {
  readonly id: string;
  /** Gold: someone acting on the one-liner needs this detail. */
  readonly needed: boolean;
}

export interface PieceDef {
  readonly id: string;
  /** Sentences in text order. */
  readonly sentences: readonly SentenceDef[];
  readonly details: readonly DetailDef[];
}

const KINDS: Readonly<Record<string, SentenceKind>> = { C: 'core', D: 'detail', N: 'noise' };

/**
 * `layout` lists one token per sentence in text order: kind letter (C/D/N) + level digit, e.g. `C0 D1 N2`.
 * Sentence ids are `s1`, `s2`, … in that order. `needed` lists the gold detail ids among `d1`–`d6`.
 */
function piece(id: string, layout: string, needed: readonly string[]): PieceDef {
  const tokens = layout.trim().split(/\s+/);
  return {
    id,
    sentences: tokens.map((token, i) => ({
      id: `s${i + 1}`,
      kind: KINDS[token[0] as string] as SentenceKind,
      level: Number(token[1]) as 0 | 1 | 2
    })),
    details: ['d1', 'd2', 'd3', 'd4', 'd5', 'd6'].map((d) => ({ id: d, needed: needed.includes(d) }))
  };
}

export const PIECES: readonly PieceDef[] = [
  // Project status update: app launch moves.
  piece('launch', 'N0 C0 C0 D0 D0 D1 N2 C0 C0 D2 N0 D1', ['d1', 'd2', 'd3']),
  // Neighbourhood notice: library closes for renovation.
  piece('library', 'N0 C0 D0 C0 D2 C0 C0 N2 D1 N0 D1', ['d1', 'd2', 'd3']),
  // Science explainer: why leaves change colour.
  piece('leaves', 'N0 C0 C0 C0 D1 C0 D2 D1 N2 D0 N0', ['d1', 'd2', 'd3']),
  // Meeting summary: club fee proposal.
  piece('club', 'N0 C0 C0 D1 C0 C0 D0 D2 N2 D1 N0', ['d1', 'd2', 'd3']),
  // Travel plan change: class trip by coach.
  piece('trip', 'N0 C0 C0 C0 D0 D0 C0 D2 N2 D1 N0', ['d1', 'd2', 'd3']),
  // Product announcement: e-bikes in a bike-sharing service.
  piece('bikes', 'N0 C0 C0 C0 D1 C0 D0 D2 N2 D1 N0', ['d1', 'd2', 'd3'])
];

export function pieceById(id: string): PieceDef | undefined {
  return PIECES.find((p) => p.id === id);
}
