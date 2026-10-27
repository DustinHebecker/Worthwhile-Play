import type { QuizTopic } from '../levels';
import type { CadenceId, ChordId, ConsonanceClass, IntervalId, ScaleId } from '../theory';

/** Plural forms by `Intl.PluralRules` category (`other` is required); `{n}` is the number. */
export type PluralForms = Readonly<Partial<Record<Intl.LDMLPluralRule, string>>> & { readonly other: string };

/**
 * Music terms, explanations and tips of one UI locale (design § 18.1; ADR 0011). Standard terms only (Appendix B), no
 * song references, "often heard as" for subjective descriptions. Placeholders in braces are filled by the view.
 */
export interface ContentText {
  /** Interval names, lower case where the language does so ("major third"). */
  readonly intervals: Readonly<Record<IntervalId, string>>;
  /** Chord names ("major chord", "dominant seventh chord"). */
  readonly chords: Readonly<Record<ChordId, string>>;
  readonly scales: Readonly<Record<ScaleId, string>>;
  /** Cadence names (the options) and one-sentence explanations. */
  readonly cadences: Readonly<Record<CadenceId, { readonly name: string; readonly explain: string }>>;
  /** Consonance classes in words. */
  readonly classes: Readonly<Record<ConsonanceClass, string>>;
  /** "{n} semitones". */
  readonly semitones: PluralForms;
  /** "{n} cents" ({n} may have one decimal). */
  readonly cents: PluralForms;
  /** Wave caption: the sum of the fundamentals repeats after {n} waves of the lower note (n = 1…5). */
  readonly waveRepeat: PluralForms;
  /** Step words of scale patterns: whole tone, semitone, the augmented second (3 semitones). */
  readonly steps: { readonly whole: string; readonly half: string; readonly three: string };
  /** Contour directions in words. */
  readonly up: string;
  readonly down: string;
  /** Mix-up tips: {a} and {b} are names; the other placeholders are facts the view fills in. */
  readonly tips: {
    /** {a} {b} names, {na} {nb} "4 semitones" */
    readonly interval: string;
    /** {a} {b} names, {ta} {tb} third sizes "4 + 3" */
    readonly chord: string;
    /** {a} {b} names, {pa} {pb} step patterns */
    readonly scale: string;
    /** {a} {b} interval names, {ra} {rb} ratios "3 : 2" */
    readonly pair: string;
    /** {a} {b} cadence names */
    readonly cadence: string;
    /** {a} {b} shapes in words */
    readonly contour: string;
    /** {a} {b} note positions */
    readonly changed: string;
    readonly rhythm: string;
  };
  /** The honest line under every stability review (McDermott et al. 2016); {name} is the more stable interval. */
  readonly learned: string;
  /** Why simple ratios look calm in the wave picture. */
  readonly ratioWhy: string;
  /** One neutral closing line per topic for the summary. */
  readonly closing: Readonly<Record<QuizTopic, string>>;
}
