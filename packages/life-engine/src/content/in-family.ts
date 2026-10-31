import type { Cond, Effect, EventDef } from '../events';
import { PPM } from '../events';
import { LIFE_TABLES } from '../params/lifetables';
import { IN_PARAMS } from '../params/in';
import { paramValue } from '../params/check';

/**
 * Family pack of the India-calibrated profile (E4b): marriage mostly arranged with the family
 * (about 95 % of marriages involve the family in choosing the spouse), a self-chosen partner, the
 * expectation to stop paid work after marriage (women) or to provide (men), children with the
 * maternity benefit where the job has social security, rare separation, and the death of a parent.
 * Family patterns vary widely by region and setting; texts describe them neutrally and never tie
 * them to a community. Dowry is deliberately not modelled (design § 10).
 */
const v = (id: string): number => paramValue(IN_PARAMS, id);
const age = (min: number, max?: number): Cond => ({ age: max === undefined ? { min } : { min, max } });
const flag = (f: string): Cond => ({ flag: f });
const not = (c: Cond): Cond => ({ not: c });
const all = (...c: Cond[]): Cond => ({ all: c });
const female: Cond = { sex: 'female' };
const male: Cond = { sex: 'male' };
const MARRIED = flag('rel.married');
const STUDYING: Cond = { any: [flag('work.study'), flag('work.school'), flag('work.training')] };

/**
 * Proposals of a match by the family. Women: half are married by 19.2 (NFHS-5), legal minimum 18;
 * 23.3 % marry before 18, which the game does not play, so from 18 about (0.5 − 0.233)/(1 − 0.233)
 * = 35 % marry within 14.4 months → 1 − 0.652^(1/14.4) ≈ 29300 ppm per month (later 10000). Men:
 * legal minimum 21, median ≈ 24.5 (assumption) → 1 − 0.5^(1/42) ≈ 16400 ppm (later 8000). Offers
 * wait while the person is in education (median 22.8 for women with 12+ years of schooling).
 */
const MATCH = [
  [female, 18, 24, 29_300], [female, 25, 40, 10_000], [male, 21, 29, 16_400], [male, 30, 45, 8_000]
] as const;
const MATCH_PARAMS = ['in.family.age-first-marriage-women', 'in.model.age-first-marriage-men', 'in.family.family-involved-spouse-choice', 'in.family.child-marriage-women'];

const marry: Effect[] = [{ set: 'rel.partner' }, { set: 'rel.married' }, { mark: 'rel.since' }, { mark: 'rel.married-since' }, { clear: 'rel.separated' }];

/**
 * Separation or divorce: 0.24 % of ever-married people are divorced and 0.61 % of married people
 * separated (Census 2011, under-reported: upper bands about twice). Stock ≈ 0.85–1.7 % over a
 * marriage of about 25 years → 0.0085…0.017 / 300 months ≈ 28–57 ppm; 40 ppm per month.
 */
const SEPARATION_PPM = 40;
const SEPARATION_PARAMS = ['in.family.divorced-share', 'in.family.separated-share'];
const separate: Effect[] = [
  { clear: 'rel.partner' }, { clear: 'rel.married' }, { clear: 'child.trying' }, { set: 'rel.separated' }, { mark: 'rel.separated-at' },
  { stat: 'satisfaction', add: -80 }, { stat: 'relationships', add: -60 }, { stat: 'security', add: -60 }
];

/** Monthly conception chance by age (biology; the same values as for Germany, Dunson et al. 2004). */
const CONCEPTION = [[19, 26, 190_000], [27, 34, 155_000], [35, 39, 130_000], [40, 44, 60_000]] as const;
const CONCEPTION_PARAMS = ['de.family.conception-failure-12m-19-26', 'de.family.conception-failure-12m-27-34', 'de.family.conception-failure-12m-35-39'];
const CHILD_WISH_PPM = Math.round(v('in.model.child-wish-monthly') * PPM);
const MATERNITY_PARAMS = ['in.family.maternity-benefit-months', 'in.family.maternity-benefit-months-later', 'in.labour.female-lfpr'];
const leaveWork: Effect[] = [{ clear: 'work.employed' }, { clear: 'work.part-time' }, { clear: 'work.social-security' }, { clear: 'health.insured' }, { clear: 'work.parental-leave' }, { set: 'work.home-parent' }];

/**
 * Death of a parent by own age, from the profile's life table: the mother is assumed 22 and the
 * father 27 years older (assumptions). Both alive: the sum of both monthly risks, averaged over the
 * band; one parent left: the mean of the two.
 */
const PARENT_BANDS = [[16, 29], [30, 39], [40, 49], [50, 59], [60, 74], [75, 120]] as const;
function parentRisk(min: number, max: number): readonly [number, number] {
  const table = LIFE_TABLES.IN;
  const q = (row: readonly number[], a: number): number => row[Math.min(a, row.length - 1)] ?? PPM;
  let both = 0;
  let one = 0;
  for (let a = min; a <= max; a++) {
    const m = q(table?.female ?? [], a + v('in.model.parent-age-mother'));
    const f = q(table?.male ?? [], a + v('in.model.parent-age-father'));
    both += m + f;
    one += (m + f) / 2;
  }
  const n = max - min + 1;
  return [Math.min(PPM, Math.round(both / n)), Math.min(PPM, Math.round(one / n))];
}
export const PARENT_DEATH_IN = PARENT_BANDS.map(([min, max]) => [min, max, ...parentRisk(min, max)] as const);
const grief: Effect[] = [{ count: 'parents.lost', add: 1 }, { stat: 'satisfaction', add: -60 }, { stat: 'mental', add: -40 }];

export const EVENTS_IN_FAMILY: readonly EventDef[] = [
  // --- Marriage ---------------------------------------------------------------------------------
  ...MATCH.map(([sex, min, max, ppm], i): EventDef => ({
    id: `rel.match-in-${i}`, textId: 'rel.match-in', chancePpm: ppm, cooldownMonths: 3,
    when: all(sex, age(min, max), not(MARRIED), not(STUDYING)), params: MATCH_PARAMS,
    choices: [
      { id: 'agree', effects: [...marry, { set: 'rel.arranged' }, { stat: 'relationships', add: 60 }, { stat: 'security', add: 40 }, { stat: 'freedom', add: -30 }] },
      { id: 'meet-first', effects: [...marry, { set: 'rel.arranged' }, { stat: 'relationships', add: 70 }, { stat: 'security', add: 30 }, { stat: 'freedom', add: -15 }] },
      { id: 'decline', effects: [{ stat: 'relationships', add: -30 }, { stat: 'freedom', add: 30 }] }
    ]
  })),
  {
    // About 5 % choose their spouse without the family (IHDS-II): a rare own choice.
    id: 'rel.own-choice', chancePpm: 2_000, cooldownMonths: 24, when: all(age(18, 40), not(MARRIED)),
    params: ['in.family.family-involved-spouse-choice'],
    choices: [
      { id: 'marry', effects: [...marry, { stat: 'relationships', add: 40 }, { stat: 'satisfaction', add: 40 }, { stat: 'freedom', add: 20 }, { stat: 'security', add: -30 }] },
      { id: 'wait', effects: [{ stat: 'freedom', add: 10 }] }
    ]
  },
  {
    // Female labour force participation 41.7 % against 78.8 % for men (PLFS 2023-24).
    id: 'work.after-marriage', chancePpm: PPM, once: true, when: all(female, MARRIED, flag('work.employed'), { since: 'rel.married-since', min: 0, max: 12 }),
    params: ['in.labour.female-lfpr', 'in.labour.male-lfpr'],
    choices: [
      { id: 'continue', effects: [{ stat: 'freedom', add: 20 }, { stat: 'energy', add: -30 }, { stat: 'relationships', add: -20 }] },
      { id: 'stop', effects: [...leaveWork, { stat: 'relationships', add: 20 }, { stat: 'security', add: -30 }, { stat: 'freedom', add: -40 }] }
    ]
  },
  {
    id: 'rel.provider', chancePpm: PPM, once: true, when: all(male, MARRIED, { since: 'rel.married-since', min: 0, max: 12 }),
    params: ['in.labour.male-lfpr', 'in.labour.female-lfpr'],
    choices: [
      { id: 'work-more', effects: [{ stat: 'energy', add: -40 }, { stat: 'security', add: 30 }, { stat: 'relationships', add: -10 }] },
      { id: 'share', effects: [{ stat: 'relationships', add: 20 }, { stat: 'freedom', add: 10 }, { stat: 'security', add: -10 }] }
    ]
  },
  {
    id: 'rel.separation-in', chancePpm: SEPARATION_PPM, cooldownMonths: 12, when: all(MARRIED, { counter: 'children', max: 0 }), params: SEPARATION_PARAMS,
    choices: [
      { id: 'family', effects: [...separate, { stat: 'relationships', add: 30 }] },
      { id: 'work', effects: [...separate, { stat: 'meaning', add: 20 }, { stat: 'energy', add: -30 }] },
      { id: 'time-alone', effects: [...separate, { stat: 'mental', add: 20 }] }
    ]
  },
  {
    id: 'rel.separation-in-kids', chancePpm: SEPARATION_PPM, cooldownMonths: 12, when: all(MARRIED, { counter: 'children', min: 1 }), params: SEPARATION_PARAMS,
    choices: [
      { id: 'children-with-me', effects: [...separate, { clear: 'children.with-other' }, { stat: 'energy', add: -40 }] },
      { id: 'children-with-other', effects: [...separate, { set: 'children.with-other' }, { stat: 'relationships', add: -40 }] }
    ]
  },

  // --- Children ---------------------------------------------------------------------------------
  {
    id: 'child.wish-in', textId: 'child.wish', chancePpm: CHILD_WISH_PPM, cooldownMonths: 12,
    when: all(MARRIED, age(19, 42), { counter: 'children', max: 3 }, not(flag('child.trying')), not(flag('child.expected')), not(flag('child.no-plan'))),
    params: ['in.model.child-wish-monthly', 'in.family.fertility-rate'],
    choices: [
      { id: 'try', effects: [{ set: 'child.trying' }, { mark: 'child.trying-since' }] },
      { id: 'later', effects: [] },
      { id: 'no-children', effects: [{ set: 'child.no-plan' }, { stat: 'freedom', add: 20 }, { stat: 'relationships', add: -20 }] }
    ]
  },
  ...CONCEPTION.map(([min, max, ppm], i): EventDef => ({
    id: `child.expected-in-${i}`, textId: 'child.expected', chancePpm: ppm, cooldownMonths: 1,
    when: all(flag('child.trying'), age(min, max), MARRIED), params: CONCEPTION_PARAMS,
    choices: [{ id: 'happy', effects: [{ clear: 'child.trying' }, { set: 'child.expected' }, { schedule: 'child.born-in', inMonths: 9 }, { stat: 'meaning', add: 40 }] }]
  })),
  {
    id: 'child.not-yet-in', textId: 'child.not-yet', chancePpm: PPM, cooldownMonths: 12,
    when: all(flag('child.trying'), { since: 'child.trying-since', min: 12 }), params: CONCEPTION_PARAMS,
    choices: [
      { id: 'keep-trying', effects: [{ stat: 'mental', add: -20 }] },
      { id: 'medical-advice', effects: [{ stat: 'security', add: 10 }, { stat: 'energy', add: -20 }] },
      { id: 'stop', effects: [{ clear: 'child.trying' }, { stat: 'freedom', add: 20 }, { stat: 'satisfaction', add: -30 }] }
    ]
  },
  {
    id: 'child.born-in', chancePpm: 0, params: MATERNITY_PARAMS,
    choices: [
      {
        id: 'maternity', when: all(female, flag('work.employed'), flag('work.social-security'), { counter: 'children', max: 1 }),
        effects: [{ birth: true }, { clear: 'child.expected' }, { set: 'work.parental-leave' }, { setCount: 'leave.left', value: v('in.family.maternity-benefit-months') }, { stat: 'meaning', add: 80 }, { stat: 'energy', add: -60 }]
      },
      {
        id: 'maternity-short', when: all(female, flag('work.employed'), flag('work.social-security'), { counter: 'children', min: 2 }),
        effects: [{ birth: true }, { clear: 'child.expected' }, { set: 'work.parental-leave' }, { setCount: 'leave.left', value: v('in.family.maternity-benefit-months-later') }, { stat: 'meaning', add: 70 }, { stat: 'energy', add: -60 }]
      },
      { id: 'stop-work', when: all(flag('work.employed'), MARRIED), effects: [{ birth: true }, { clear: 'child.expected' }, ...leaveWork, { stat: 'meaning', add: 70 }, { stat: 'relationships', add: 30 }, { stat: 'security', add: -40 }] },
      { id: 'welcome', effects: [{ birth: true }, { clear: 'child.expected' }, { stat: 'meaning', add: 70 }, { stat: 'energy', add: -70 }] }
    ]
  },
  {
    id: 'child.leave-ends-in', chancePpm: PPM, cooldownMonths: 1,
    when: all(flag('work.parental-leave'), { counter: 'leave.left', max: 0 }), params: MATERNITY_PARAMS,
    choices: [
      { id: 'return', effects: [{ clear: 'work.parental-leave' }, { stat: 'security', add: 20 }, { stat: 'energy', add: -30 }] },
      { id: 'stop', when: MARRIED, effects: [...leaveWork, { stat: 'relationships', add: 30 }, { stat: 'security', add: -40 }] }
    ]
  },
  {
    id: 'child.back-to-work-in', chancePpm: Math.round(v('in.model.return-to-work-monthly') * PPM), cooldownMonths: 12,
    when: flag('work.home-parent'), params: ['in.model.return-to-work-monthly', 'in.labour.female-lfpr'],
    choices: [
      { id: 'search', effects: [{ clear: 'work.home-parent' }, { set: 'work.unemployed' }] },
      { id: 'stay-home', when: MARRIED, effects: [{ stat: 'freedom', add: -10 }] },
      { id: 'later', effects: [] }
    ]
  },
  {
    // Without a partner's income nobody carries the costs: caring at home ends with the marriage.
    id: 'child.alone-in', chancePpm: PPM, cooldownMonths: 1, when: all(flag('work.home-parent'), not(MARRIED)),
    choices: [{ id: 'search', effects: [{ clear: 'work.home-parent' }, { set: 'work.unemployed' }, { stat: 'security', add: -40 }] }]
  },

  // --- Parents ----------------------------------------------------------------------------------
  ...PARENT_DEATH_IN.flatMap(([min, max, both, one], i): EventDef[] => [0, 1].map((lost) => ({
    id: `family.parent-dies-in-${i}-${lost}`, textId: 'family.parent-dies', chancePpm: lost === 0 ? both : one, cooldownMonths: 3,
    when: all(age(min, max), { counter: 'parents.lost', min: lost, max: lost }),
    params: ['in.health.life-expectancy', 'in.model.parent-age-mother', 'in.model.parent-age-father'],
    choices: [
      { id: 'family', effects: [...grief, { stat: 'relationships', add: 30 }] },
      { id: 'time-off', effects: [...grief, { stat: 'energy', add: 30 }, { stat: 'security', add: -20 }] },
      { id: 'carry-on', effects: [...grief, { stat: 'mental', add: -30 }] }
    ]
  })))
];
