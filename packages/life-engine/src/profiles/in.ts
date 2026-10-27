import { IN_PARAMS } from '../params/in';
import { WORLD_PARAMS } from '../params/world';
import { paramValue } from '../params/check';
import { seriesById } from '../params/series';
import type { Living, Profile, Qualification } from '../profile';
import type { Sex } from '../state';

const v = (id: string): number => paramValue(IN_PARAMS, id);
const w = (id: string): number => paramValue(WORLD_PARAMS, id);
const paise = (rupees: number): number => Math.round(rupees * 100);

/**
 * Monthly gross pay by qualification (PLFS 2023-24, urban). Without a further qualification the
 * person works casually: the daily wage times the days of work per month. With higher secondary or a
 * diploma (`vocational`) or a degree the person works for a regular salary: the urban average splits
 * into secondary-level pay s and graduate pay p·s with the graduate premium p and an assumed graduate
 * share g, so that s = average / (1 − g + g·p).
 */
const G = v('in.model.graduate-share-regular-urban');
const P = v('in.earnings.graduate-premium');
const SECONDARY = v('in.earnings.regular-urban') / (1 - G + G * P);
const PAY_BY_QUALIFICATION: Record<Qualification, number> = {
  none: v('in.earnings.casual-urban-daily') * v('in.model.casual-days-per-month'),
  vocational: SECONDARY,
  bachelor: SECONDARY * P,
  master: SECONDARY * P * v('in.model.postgraduate-premium')
};

/**
 * Pay by sex, raw (no adjusted gap is available): regular urban men 26,105 and women 19,879 against
 * the average 24,434; casual women 364 against the average 516 a day, casual men at the average.
 */
const REGULAR_SEX: Record<Sex, number> = {
  male: v('in.earnings.regular-urban-men') / v('in.earnings.regular-urban'),
  female: v('in.earnings.regular-urban-women') / v('in.earnings.regular-urban')
};
const CASUAL_SEX: Record<Sex, number> = {
  male: 1,
  female: v('in.earnings.casual-urban-daily-women') / v('in.earnings.casual-urban-daily')
};

/**
 * Age profile: pay rises from a at 22 to r·a at 47 and stays flat (IER 2024: earnings rise to about
 * 45–50, then flatten; the ratio r is an assumption). a normalises the mean over working ages 22–60
 * to 1: (25·(1 + r)/2 + 13·r) / 38 = 1/a. At 16 the pay is 0.6·a (simplification, as for Germany).
 */
const R = v('in.model.age-earnings-peak-ratio');
const A = 38 / (25 * (1 + R) / 2 + 13 * R);
export function ageFactorIn(age: number): number {
  if (age <= 16) return 0.6 * A;
  if (age < 22) return (0.6 + (0.4 * (age - 16)) / 6) * A;
  if (age < 47) return (1 + ((R - 1) * (age - 22)) / 25) * A;
  return R * A;
}

/**
 * Income tax, new regime FY 2025-26, simplified: standard deduction, slabs, zero tax up to the rebate
 * limit with marginal relief just above it, 4 % cess. Surcharges above ₹50 lakh are left out.
 * Annual rupees → annual rupees.
 */
export function incomeTaxIn(annualGross: number): number {
  const taxable = Math.max(0, annualGross - v('in.tax.income.standard-deduction'));
  if (taxable <= v('in.tax.income.rebate-limit')) return 0;
  const slabs: readonly (readonly [number, number])[] = [
    [v('in.tax.income.slab1-end'), 0],
    [v('in.tax.income.slab2-end'), v('in.tax.income.rate-slab2')],
    [v('in.tax.income.slab3-end'), v('in.tax.income.rate-slab3')],
    [v('in.tax.income.slab4-end'), v('in.tax.income.rate-slab4')],
    [v('in.tax.income.slab5-end'), v('in.tax.income.rate-slab5')],
    [v('in.tax.income.slab6-end'), v('in.tax.income.rate-slab6')],
    [Infinity, v('in.tax.income.rate-top')]
  ];
  let tax = 0;
  let from = 0;
  for (const [to, rate] of slabs) {
    if (taxable > from) tax += (Math.min(taxable, to) - from) * rate;
    from = to;
  }
  // Marginal relief: the tax never exceeds the income above the rebate limit.
  tax = Math.min(tax, taxable - v('in.tax.income.rebate-limit'));
  return tax * (1 + v('in.tax.income.cess'));
}

/**
 * A single adult's budget from per-person spending (HCES 2023-24 MPCE): a household of n persons
 * needs 1 + 0.5 + 0.3·(n − 2) single budgets (OECD-modified scale, two adults and children), so one
 * adult alone needs about n / that times the per-person spending.
 */
const N = v('in.model.household-size');
const SINGLE = N / (1 + w('world.household.equivalence-second-adult') + w('world.household.equivalence-child') * (N - 2));
const LIVING: Record<Living, number> = {
  // A young adult in the family home contributes half of the per-person urban spending (assumption).
  parents: 0.5 * v('in.living.mpce-urban'),
  // Frugal: the rural per-person spending level as a single budget.
  frugal: v('in.living.mpce-rural') * SINGLE,
  // Average: urban per-person spending as a single budget.
  average: v('in.living.mpce-urban') * SINGLE,
  // Comfortable: average scaled by the income ratio of the middle-40 average to its threshold.
  comfortable: v('in.living.mpce-urban') * SINGLE * (v('in.income.middle40-average') / v('in.income.middle40-threshold'))
};

/** Monthly average living costs at start prices (rupees), for event amounts. */
export const IN_AVERAGE_LIVING = LIVING.average;

/** Yearly school spending per pupil, weighted by the government-school share (CMS:E 2025). */
const SCHOOL_SPEND = v('in.education.government-school-share') * v('in.education.spend-government-school')
  + (1 - v('in.education.government-school-share')) * v('in.education.spend-private-school');

export const PROFILE_IN: Profile = {
  id: 'in',
  region: 'IN',
  currency: 'INR',
  birthYear: 2026,
  params: IN_PARAMS,
  // No real-wage series yet: wages follow prices (IER 2024 reports regular salaries flat in real terms 2019–24).
  economy: { cpi: seriesById('in.macro.cpi-annual') },
  households: [
    {
      id: 'street',
      incomePercentile: 1,
      flags: ['parents.houseless', 'parents.low-income', 'parents.no-degree', 'home.street'],
      stats: { security: 200, health: 400 },
      params: ['in.housing.houseless-share', 'in.income.extreme-poverty-rate', 'in.earnings.casual-urban-daily', 'in.education.secondary-dropout-rate']
    },
    {
      id: 'upper-middle',
      incomePercentile: 92,
      flags: ['parents.salaried', 'parents.tertiary'],
      stats: { security: 650 },
      params: ['in.income.top10-threshold', 'in.earnings.regular-urban', 'in.earnings.graduate-premium', 'in.education.spend-private-school-urban']
    },
    {
      id: 'wealthy',
      incomePercentile: 99,
      flags: ['parents.tertiary', 'parents.wealthy'],
      stats: { security: 800, health: 600 },
      params: ['in.income.top1-threshold', 'in.wealth.top1-threshold', 'in.education.private-mbbs-fee-deemed']
    }
  ],
  grossPay(q, age, sex, partTime) {
    const sexFactor = q === 'none' ? CASUAL_SEX[sex] : REGULAR_SEX[sex];
    return paise(PAY_BY_QUALIFICATION[q] * ageFactorIn(age) * sexFactor * (partTime ? 0.5 : 1));
  },
  netPay(grossCents) {
    // Provident-fund contributions are savings, not a loss; they come with the pension step.
    const gross = grossCents / 100;
    return paise(Math.max(0, gross - incomeTaxIn(gross * 12) / 12));
  },
  livingCost(living) {
    return paise(LIVING[living]);
  },
  // No general cash minimum income; food rations (public distribution) are in kind and not modelled.
  basicSupport() {
    return 0;
  },
  // Scholarships depend on criteria the model does not have; the family carries the costs.
  educationSupport() {
    return { cents: 0, category: 'family-support' };
  },
  // No unemployment insurance for most workers.
  unemploymentInsurance: { replacement: 0, months: 0 },
  coupleLivingShare: (1 + w('world.household.equivalence-second-adult')) / 2,
  childCost(age) {
    // A child's share of spending (0.3 of a single budget) plus school spending from age 6.
    return paise(w('world.household.equivalence-child') * LIVING.average + (age >= 6 ? SCHOOL_SPEND / 12 : 0));
  },
  childBenefit() {
    return 0;
  },
  // No statutory minimum: maintenance is set by courts; modelled as half the child's cost (assumption).
  childSupport(age) {
    return Math.round(this.childCost(age) / 2);
  },
  // Maternity benefit: full pay for 26 weeks in establishments with 10+ employees (the event offers
  // it with social security only, as a proxy for such an employer).
  parentalAllowance(lastNetCents) {
    return lastNetCents;
  },
  parentalLeaveMonths: v('in.family.maternity-benefit-months'),
  // WID pre-tax income per adult (not equivalised household income as for Germany); the bottom-50
  // average stands in for the 25th percentile.
  incomeDistribution: [[25, v('in.income.bottom50-average')], [50, v('in.income.middle40-threshold')], [90, v('in.income.top10-threshold')], [99, v('in.income.top1-threshold')]],
  // WID wealth per adult; the bottom-50 average stands in for the 25th percentile.
  wealthDistribution: [[25, v('in.wealth.bottom50-average')], [50, v('in.wealth.middle40-threshold')], [90, v('in.wealth.top10-threshold')], [99, v('in.wealth.top1-threshold')]]
};
