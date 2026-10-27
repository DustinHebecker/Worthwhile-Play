import { DE_PARAMS } from '../params/de';
import { WORLD_PARAMS } from '../params/world';
import { paramValue } from '../params/check';
import { seriesById } from '../params/series';
import type { Living, Profile, Qualification } from '../profile';
import type { Sex } from '../state';

const v = (id: string): number => paramValue(DE_PARAMS, id);
const cents = (euros: number): number => Math.round(euros * 100);

/** Average full-time gross monthly pay by qualification (Destatis, April 2025). */
const PAY_BY_QUALIFICATION: Record<Qualification, number> = {
  none: v('de.earnings.no-qualification'),
  vocational: v('de.earnings.apprenticeship'),
  bachelor: v('de.earnings.bachelor'),
  master: v('de.earnings.master')
};

/**
 * Age profile of pay: the averages by qualification cover all ages, so the age factor is
 * normalised. Anchors: under 30 = a, 30–49 = 1.57·a, 50+ = 1.63·a (Destatis SES 2022 ratios), placed
 * at ages 22, 40 and 55 and interpolated linearly. With workforce shares of roughly 20/45/35 % the
 * weighted mean is 1 when a = 1 / (0.2 + 0.45·1.57 + 0.35·1.63) ≈ 0.677 (simplification).
 */
const A = 1 / (0.2 + 0.45 * v('de.earnings.age-ratio-30-49') + 0.35 * v('de.earnings.age-ratio-50-plus'));
const AGE_ANCHORS: readonly (readonly [number, number])[] = [
  [16, 0.6 * A],
  [22, A],
  [40, v('de.earnings.age-ratio-30-49') * A],
  [55, v('de.earnings.age-ratio-50-plus') * A]
];

export function ageFactor(age: number): number {
  const first = AGE_ANCHORS[0] as readonly [number, number];
  const last = AGE_ANCHORS[AGE_ANCHORS.length - 1] as readonly [number, number];
  if (age <= first[0]) return first[1];
  if (age >= last[0]) return last[1];
  for (let i = 1; i < AGE_ANCHORS.length; i++) {
    const [x1, y1] = AGE_ANCHORS[i] as readonly [number, number];
    const [x0, y0] = AGE_ANCHORS[i - 1] as readonly [number, number];
    if (age <= x1) return y0 + ((y1 - y0) * (age - x0)) / (x1 - x0);
  }
  return last[1];
}

/**
 * Adjusted gender pay gap (6 %, Destatis): women earn 0.94 of comparable men. Scaled around the
 * average with a female share of 0.47 among employees, so the qualification averages stay the mean.
 */
const GAP = v('de.labour.gender-pay-gap-adjusted');
const MEN = 1 / (0.53 + 0.47 * (1 - GAP));
const SEX_FACTOR: Record<Sex, number> = { male: MEN, female: MEN * (1 - GAP) };

/** Income tax 2026 (§ 32a EStG), simplified to its linear-progressive zones; annual euros → euros. */
export function incomeTaxDe(taxable: number): number {
  const a = v('de.tax.income.allowance');
  const b = v('de.tax.income.zone1-end');
  const c = v('de.tax.income.zone2-end');
  const d = v('de.tax.income.rich-threshold');
  const r0 = v('de.tax.income.rate-entry');
  const r1 = v('de.tax.income.rate-zone2-start');
  const r2 = v('de.tax.income.rate-top');
  const r3 = v('de.tax.income.rate-rich');
  // Tax of a zone with the marginal rate rising linearly from rs to re over [from, to], up to x.
  const zone = (x: number, from: number, to: number, rs: number, re: number): number => {
    const y = Math.min(x, to) - from;
    return y <= 0 ? 0 : y * (rs + ((re - rs) * y) / (2 * (to - from)));
  };
  let tax = zone(taxable, a, b, r0, r1) + zone(taxable, b, c, r1, r2);
  if (taxable > c) tax += (Math.min(taxable, d) - c) * r2;
  if (taxable > d) tax += (taxable - d) * r3;
  // Solidarity surcharge only above the exemption limit (the transition zone is left out).
  if (tax > v('de.tax.solidarity-exemption')) tax *= 1 + v('de.tax.solidarity-rate');
  return tax;
}

/**
 * Employee social contributions, simplified: half of pension + unemployment insurance up to the
 * pension ceiling, the rest of the employee total (health, care) up to the health ceiling.
 */
export function socialContributionsDe(gross: number): number {
  const pensionPart = (v('de.social.pension-rate') + v('de.social.unemployment-rate')) / 2;
  const healthPart = v('de.social.employee-total-rate') - pensionPart;
  return pensionPart * Math.min(gross, v('de.social.pension-ceiling')) + healthPart * Math.min(gross, v('de.social.health-ceiling'));
}

const LIVING: Record<Living, number> = {
  // Young adult living with the parents: the official needs level for this case (basic support).
  parents: v('de.benefit.standard-rate-young-adult'),
  // Frugal: the basic-support level for a single adult incl. average housing costs.
  frugal: v('de.benefit.standard-rate-single') + v('de.benefit.average-housing-costs'),
  // Average: consumption of single households (Destatis).
  average: v('de.living.consumption-single'),
  // Comfortable: average scaled by the income ratio P75/P50 (equivalised net income).
  comfortable: v('de.living.consumption-single') * (v('de.income.equivalised-net-p75') / v('de.income.equivalised-net-p50'))
};

export const PROFILE_DE: Profile = {
  id: 'de',
  region: 'DE',
  currency: 'EUR',
  birthYear: 2026,
  params: DE_PARAMS,
  economy: { cpi: seriesById('de.macro.cpi-annual'), realWages: seriesById('de.earnings.real-wage-annual') },
  households: [
    {
      id: 'basic-support',
      incomePercentile: 8,
      flags: ['parents.basic-support', 'parents.low-income', 'parents.no-degree'],
      stats: { security: 300 },
      params: ['de.benefit.standard-rate-single', 'de.benefit.households', 'de.income.poverty-rate', 'de.education.university-entry-non-academic-parents']
    },
    {
      id: 'middle',
      incomePercentile: 50,
      flags: ['parents.vocational'],
      params: ['de.income.equivalised-net-p50', 'de.earnings.apprenticeship', 'de.education.university-entry-non-academic-parents']
    }
  ],
  grossPay(q, age, sex, partTime) {
    return cents(PAY_BY_QUALIFICATION[q] * ageFactor(age) * SEX_FACTOR[sex] * (partTime ? 0.5 : 1));
  },
  netPay(grossCents) {
    const gross = grossCents / 100;
    const social = socialContributionsDe(gross);
    const tax = incomeTaxDe((gross - social) * 12) / 12;
    return cents(Math.max(0, gross - social - tax));
  },
  livingCost(living) {
    return cents(LIVING[living]);
  },
  basicSupport(atParents) {
    return cents(atParents ? v('de.benefit.standard-rate-young-adult') : v('de.benefit.standard-rate-single') + v('de.benefit.average-housing-costs'));
  },
  educationSupport(parentsLowIncome) {
    return { cents: cents(v('de.education.student-grant-max')), category: parentsLowIncome ? 'student-grant' : 'family-support' };
  },
  unemploymentInsurance: { replacement: v('de.labour.ui-replacement-rate'), months: v('de.labour.ui-duration-under-50') },
  // OECD-modified scale: a couple needs 1 + 0.5 = 1.5 single budgets, each partner pays half.
  coupleLivingShare: (1 + paramValue(WORLD_PARAMS, 'world.household.equivalence-second-adult')) / 2,
  childCost(age) {
    return cents(age < 6 ? v('de.family.child-cost-age-0-6') : age < 12 ? v('de.family.child-cost-age-6-11') : v('de.family.child-cost-age-12-17'));
  },
  childBenefit() {
    return cents(v('de.family.child-benefit'));
  },
  childSupport(age) {
    return cents(age < 6 ? v('de.family.child-support-0-5') : age < 12 ? v('de.family.child-support-6-11') : v('de.family.child-support-12-17'));
  },
  parentalAllowance(lastNetCents) {
    const raw = lastNetCents * v('de.family.parental-allowance-rate');
    return Math.round(Math.min(cents(v('de.family.parental-allowance-max')), Math.max(cents(v('de.family.parental-allowance-min')), raw)));
  },
  parentalLeaveMonths: v('de.family.parental-allowance-months') - 2
};
