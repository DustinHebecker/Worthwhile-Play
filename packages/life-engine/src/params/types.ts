/**
 * Every number the model uses is a parameter with a source, a data year, a region and an
 * uncertainty band (design § 13). Region profiles are collections of parameters.
 */

/** How far the license of a source has been reviewed (docs/third-party.md). */
export type LicenseStatus =
  | 'open'            // e.g. CC BY 4.0, DL-DE-BY 2.0, public domain: figures may be used with attribution
  | 'cite-figures'    // copyrighted publication; we only cite aggregated figures
  | 'non-commercial'  // NC terms: must not be used until compatibility with the project license is cleared
  | 'unchecked';

export interface Source {
  id: string;
  /** Author(s) or publisher and title, as cited. */
  citation: string;
  year: number;
  url: string;
  license: string;
  licenseStatus: LicenseStatus;
}

/** Verification status of a single value (see the research notes). */
export type ParamStatus = 'verified' | 'secondary' | 'unverified';

export interface Param {
  id: string;
  value: number;
  unit: string;
  sourceId: string;
  /** Data year (or the last year of a period). */
  year: number;
  /** ISO 3166 alpha-2 calibration country, or 'world'. */
  region: string;
  /** Plausible range used for sensitivity runs and calibration tolerances; contains `value`. */
  band: readonly [number, number];
  status: ParamStatus;
  note?: string;
}

export const UNITS = [
  'share',          // fraction 0–1
  'rate-per-year',  // fraction per year (0.02 = 2 %)
  'years',
  'months',
  'count',
  'ratio',
  'points-0-10',
  'sd',             // standard deviations (effect sizes)
  'local-currency-per-month',
  'local-currency-per-year',
  'local-currency',
  'local-currency-per-m2',
  'hours-per-week'
] as const;
export type Unit = (typeof UNITS)[number];
