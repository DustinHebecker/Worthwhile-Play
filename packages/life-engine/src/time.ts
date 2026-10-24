/**
 * Calendar of one life. The engine ticks monthly (owner decision O17); a month is an integer index
 * counted from the birth month (0). All arithmetic is integer, so dates never drift.
 */
export const MONTHS_PER_YEAR = 12;

/** Months since birth: 0 is the birth month. */
export type Month = number;

/** Where a life sits on the in-game calendar: year and month (1–12) of birth. */
export interface Calendar {
  birthYear: number;
  birthMonth: number;
}

export interface CalendarDate {
  year: number;
  /** 1–12 */
  month: number;
}

export function isCalendar(value: unknown): value is Calendar {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Record<string, unknown>;
  return Number.isInteger(c.birthYear) && (c.birthYear as number) >= 1800 && (c.birthYear as number) <= 2300
    && Number.isInteger(c.birthMonth) && (c.birthMonth as number) >= 1 && (c.birthMonth as number) <= 12;
}

/** The calendar date of month `m` of a life (m ≥ 0, integer). */
export function dateOf(calendar: Calendar, m: Month): CalendarDate {
  const index = calendar.birthYear * MONTHS_PER_YEAR + (calendar.birthMonth - 1) + m;
  return { year: Math.floor(index / MONTHS_PER_YEAR), month: (index % MONTHS_PER_YEAR) + 1 };
}

/** The month of a life that falls on the given calendar date (negative before birth). */
export function monthOf(calendar: Calendar, date: CalendarDate): Month {
  return (date.year - calendar.birthYear) * MONTHS_PER_YEAR + (date.month - calendar.birthMonth);
}

/** Completed years of age in month `m`. */
export function ageInYears(m: Month): number {
  return Math.floor(m / MONTHS_PER_YEAR);
}

/** The first month in which the person is `years` old. */
export function monthAtAge(years: number): Month {
  return years * MONTHS_PER_YEAR;
}

/** True in the month of a birthday (also the birth month itself). */
export function isBirthday(m: Month): boolean {
  return m % MONTHS_PER_YEAR === 0;
}
