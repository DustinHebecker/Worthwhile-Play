import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { ageInYears, dateOf, isBirthday, isCalendar, monthAtAge, monthOf } from '../src';

const calendar = fc.record({ birthYear: fc.integer({ min: 1800, max: 2300 }), birthMonth: fc.integer({ min: 1, max: 12 }) });

describe('calendar', () => {
  it('maps months to dates across year ends', () => {
    const c = { birthYear: 2008, birthMonth: 11 };
    expect(dateOf(c, 0)).toEqual({ year: 2008, month: 11 });
    expect(dateOf(c, 1)).toEqual({ year: 2008, month: 12 });
    expect(dateOf(c, 2)).toEqual({ year: 2009, month: 1 });
    expect(dateOf(c, 14)).toEqual({ year: 2010, month: 1 });
  });

  it('dateOf and monthOf are inverse', () => {
    fc.assert(fc.property(calendar, fc.integer({ min: 0, max: 130 * 12 }), (c, m) => {
      const d = dateOf(c, m);
      expect(d.month).toBeGreaterThanOrEqual(1);
      expect(d.month).toBeLessThanOrEqual(12);
      expect(monthOf(c, d)).toBe(m);
    }));
  });

  it('counts completed years of age and birthdays', () => {
    expect(ageInYears(0)).toBe(0);
    expect(ageInYears(11)).toBe(0);
    expect(ageInYears(12)).toBe(1);
    expect(monthAtAge(18)).toBe(216);
    expect(isBirthday(216)).toBe(true);
    expect(isBirthday(217)).toBe(false);
    fc.assert(fc.property(fc.integer({ min: 0, max: 130 }), (y) => ageInYears(monthAtAge(y)) === y && (y === 0 || ageInYears(monthAtAge(y) - 1) === y - 1)));
  });

  it('validates calendars without throwing', () => {
    expect(isCalendar({ birthYear: 2000, birthMonth: 1 })).toBe(true);
    expect(isCalendar({ birthYear: 2000, birthMonth: 13 })).toBe(false);
    expect(isCalendar({ birthYear: 2000.5, birthMonth: 1 })).toBe(false);
    fc.assert(fc.property(fc.anything(), (v) => { isCalendar(v); }));
  });
});
