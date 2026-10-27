/** Language-neutral data types of Sense of Time (design § 5, § 18). */

export type Category = 'earth' | 'science' | 'tech' | 'culture' | 'explore' | 'everyday' | 'history';
export type Region = 'africa' | 'americas' | 'asia' | 'europe' | 'oceania' | 'world';

/** One event as its sources state the date (design § 5.1). */
export interface EventData {
  readonly id: string;
  readonly cat: Category;
  readonly region: Region;
  /** 1 = widely known (easy), 2 = known to many (medium), 3 = less known (hard). */
  readonly tier: 1 | 2 | 3;
  /** A point with an accepted range, or a span that lasted from `lo` to `hi`. */
  readonly kind: 'point' | 'span';
  /** `year`: astronomical years (n BCE = 1 − n); `ago`: years before 1950. */
  readonly unit: 'year' | 'ago';
  /** The central value of a point (absent for spans). */
  readonly at?: number;
  /** The older end (for `ago` the larger number). */
  readonly lo: number;
  /** The newer end. */
  readonly hi: number;
  /** Bibliographic references for the date (original language). */
  readonly sources: readonly string[];
  /** ISO date of the last check against the sources. */
  readonly checked: string | null;
  /** Withdrawn: stays valid in saves, never used in new rounds. */
  readonly retired?: boolean;
}

/** A curated "surprising pair" (design § 9.3); the insight sentence is per locale. */
export interface CuratedPair {
  readonly id: string;
  readonly older: string;
  readonly newer: string;
}
