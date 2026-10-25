import type { Param } from './params/types';
import type { EconomySeries } from './economy';
import type { Sex } from './state';

/** Highest completed qualification, stored in the counter `qual`. */
export const QUALIFICATIONS = ['none', 'vocational', 'bachelor', 'master'] as const;
export type Qualification = (typeof QUALIFICATIONS)[number];

/** Living situation and lifestyle level (counter `lifestyle`: 0 frugal, 1 average, 2 comfortable). */
export type Living = 'parents' | 'frugal' | 'average' | 'comfortable';

/** A start household (design § 3): what the person is born into. Flags and counters seed the life. */
export interface HouseholdStart {
  id: string;
  /** Percentile of the parents' household income in the profile (1–99). */
  incomePercentile: number;
  flags: readonly string[];
  /** Start values for stats that differ from the neutral 500 (per mille). */
  stats?: Readonly<Partial<Record<'health' | 'mental' | 'security' | 'relationships', number>>>;
  /** Parameter ids that justify this household's description. */
  params: readonly string[];
}

/**
 * A fictionalised region profile calibrated on one country (owner decisions O9, O21). All money is
 * in cents of the local currency at the prices of the start year; the economy indices scale it.
 */
export interface Profile {
  id: string;
  /** Calibration country (ISO 3166 alpha-2), shown openly in the game. */
  region: string;
  currency: string;
  /** In-game calendar year of birth for every life of this profile. */
  birthYear: number;
  params: readonly Param[];
  economy: EconomySeries;
  households: readonly HouseholdStart[];
  /** Gross monthly pay, full-time unless `partTime`, at start prices (cents). */
  grossPay(q: Qualification, age: number, sex: Sex, partTime: boolean): number;
  /** Net monthly pay after simplified income tax and social contributions (cents). */
  netPay(grossCents: number): number;
  /** Monthly cost of living at start prices (cents). */
  livingCost(living: Living): number;
  /** Basic income support for one adult incl. housing, at start prices (cents per month). */
  basicSupport(atParents: boolean): number;
  /** Support during training or study (cents per month at start prices) and whether it is public. */
  educationSupport(parentsLowIncome: boolean): { cents: number; category: 'student-grant' | 'family-support' };
  /** Unemployment insurance: share of the last net pay and months of entitlement. */
  unemploymentInsurance: { replacement: number; months: number };
}
