import type { Cond, Effect, EventDef } from '../events';
import { PPM } from '../events';

/**
 * Second event pack of the Germany-calibrated profile (E3): partnership, separation, children and
 * parental leave, job changes and promotions, the death of a parent and care for a parent.
 * Monthly chances come from docs/design/many-lives-research/family.md § 11 (derivations there);
 * values marked UNVERIFIED in the notes are calibration starting points and say so in `params`.
 * Family forms are diverse: no event assumes the sex of the partner or who takes parental leave.
 */
const age = (min: number, max?: number): Cond => ({ age: max === undefined ? { min } : { min, max } });
const flag = (f: string): Cond => ({ flag: f });
const not = (c: Cond): Cond => ({ not: c });
const all = (...c: Cond[]): Cond => ({ all: c });
const since = (counter: string, min: number, max?: number): Cond => (max === undefined ? { since: counter, min } : { since: counter, min, max });
const PARTNERED: Cond = { any: [flag('rel.partner')] };
const TOGETHER: Cond = { any: [flag('rel.cohabiting'), flag('rel.married')] };
const HAS_CHILDREN: Cond = { counter: 'children', min: 1 };
/** Within 24 months after a job loss the separation risk is about 1.6–1.8 times higher (SOEP). */
const STRAIN: Cond = since('job.lost-at', 0, 24);
const STRAIN_FACTOR = 1.6;

const PARTNER_PARAMS = ['de.family.single-share-20-29', 'de.family.single-share-40-54', 'de.family.repartnered-share'];
const DIVORCE_PARAMS = ['de.family.divorce-total-rate', 'de.family.divorce-rate-peak', 'de.family.unemployment-separation-ratio'];
const COHAB_PARAMS = ['de.family.cohab-separated-5y', 'de.family.cohab-married-5y', 'de.family.unemployment-separation-ratio'];
const FERTILITY_PARAMS = ['de.family.fertility-25-29', 'de.family.fertility-30-34', 'de.family.fertility-35-39', 'de.family.fertility-40-44', 'de.family.second-child-progression'];
const CONCEPTION_PARAMS = ['de.family.conception-failure-12m-19-26', 'de.family.conception-failure-12m-27-34', 'de.family.conception-failure-12m-35-39'];
const LEAVE_PARAMS = ['de.family.mother-leave-year1', 'de.family.mother-leave-year2', 'de.family.father-elterngeld-share', 'de.family.parental-allowance-rate'];
const CAREER_PARAMS = ['de.labour.employer-change-rate', 'de.labour.internal-move-rate', 'de.labour.wage-growth-changers', 'de.labour.wage-growth-stayers'];
const CARE_PARAMS = ['de.care.carer-share-18-49', 'de.care.carer-share-50-65', 'de.care.hours-per-day-50-65', 'de.care.leave-employment-share'];
const PARENT_DEATH_PARAMS = ['de.health.parent-death-own-40'];

// --- Separation ------------------------------------------------------------------------------------

const separate: Effect[] = [
  { clear: 'rel.partner' }, { clear: 'rel.cohabiting' }, { clear: 'rel.married' }, { clear: 'child.trying' }, { mark: 'rel.separated-at' },
  { stat: 'satisfaction', add: -80 }, { stat: 'relationships', add: -60 }, { stat: 'security', add: -40 }
];
const separationChoices = (withChildren: boolean) => withChildren
  ? [
    { id: 'children-with-me', effects: [...separate, { clear: 'children.with-other' }, { clear: 'children.shared' }, { stat: 'energy' as const, add: -40 }] },
    { id: 'shared', effects: [...separate, { set: 'children.shared' }, { clear: 'children.with-other' }] },
    { id: 'children-with-other', effects: [...separate, { set: 'children.with-other' }, { clear: 'children.shared' }, { stat: 'relationships' as const, add: -40 }] }
  ]
  : [
    { id: 'friends', effects: [...separate, { stat: 'relationships' as const, add: 40 }] },
    { id: 'work', effects: [...separate, { stat: 'meaning' as const, add: 20 }, { stat: 'energy' as const, add: -30 }] },
    { id: 'time-alone', effects: [...separate, { stat: 'mental' as const, add: 20 }] }
  ];

/** One event per duration band, risk factor and children/no children; texts are shared (`textId`). */
function separationEvents(kind: 'divorce' | 'cohab', bands: readonly (readonly [number, number | undefined, number])[]): EventDef[] {
  const out: EventDef[] = [];
  const counter = kind === 'divorce' ? 'rel.married-since' : 'rel.cohab-since';
  const base: Cond = kind === 'divorce' ? flag('rel.married') : all(flag('rel.cohabiting'), not(flag('rel.married')));
  for (const [i, [min, max, ppm]] of bands.entries()) {
    for (const strain of [false, true]) {
      for (const kids of [false, true]) {
        out.push({
          id: `rel.${kind}-${i}${strain ? '-strain' : ''}${kids ? '-kids' : ''}`,
          textId: `rel.${kind}${kids ? '-kids' : ''}`,
          chancePpm: Math.round(ppm * (strain ? STRAIN_FACTOR : 1)),
          cooldownMonths: 12,
          when: all(base, since(counter, min, max), strain ? STRAIN : not(STRAIN), kids ? HAS_CHILDREN : { counter: 'children', max: 0 }),
          params: kind === 'divorce' ? DIVORCE_PARAMS : COHAB_PARAMS,
          choices: separationChoices(kids)
        });
      }
    }
  }
  return out;
}

/**
 * Divorce hazard among still-married couples by marriage duration (months): Destatis duration
 * profile 2015 scaled to the 2024 total divorce rate of 28 % (family.md § 2a); 26+ years UNVERIFIED.
 */
const DIVORCE_BANDS = [
  [0, 11, 175], [12, 23, 930], [24, 47, 1_200], [48, 107, 1_600], [108, 167, 1_300], [168, 227, 1_050], [228, 299, 850], [300, undefined, 400]
] as const;
/** Cohabiting couples: > 90 % intact after a year, ≈ 30 % separated within 5 years (family.md § 2b). */
const COHAB_BANDS = [[0, 11, 4_000], [12, 59, 7_500], [60, undefined, 5_000]] as const;

// --- Children -----------------------------------------------------------------------------------

/** Monthly conception probability of a couple trying, by age (Dunson et al. 2004; 40–44 Leridon, derived). */
const CONCEPTION = [[19, 26, 190_000], [27, 34, 155_000], [35, 39, 130_000], [40, 44, 60_000]] as const;

// --- Parents ------------------------------------------------------------------------------------

/**
 * Death of a parent by own age: monthly risk derived from the Destatis life table 2022/24, mothers
 * 29 and fathers 32 years older than the person (family.md § 10); first value: both parents alive.
 */
const PARENT_DEATH = [[16, 29, 659, 329], [30, 39, 2_132, 1_066], [40, 49, 5_275, 2_637], [50, 59, 17_145, 8_573], [60, 74, 64_846, 32_423], [75, 120, 300_000, 300_000]] as const;

const grief: Effect[] = [{ count: 'parents.lost', add: 1 }, { clear: 'care.active' }, { stat: 'satisfaction', add: -60 }, { stat: 'mental', add: -40 }];

export const EVENTS_DE_FAMILY: readonly EventDef[] = [
  // --- Partnership ------------------------------------------------------------------------------
  ...([[18, 29, 15_000], [30, 39, 11_000], [40, 54, 7_000], [55, 69, 3_500], [70, 120, 1_200]] as const).map(([min, max, ppm], i): EventDef => ({
    // Starting a steady partnership; calibration values (family.md § 11 #1, UNVERIFIED levels).
    id: `rel.meet-${i}`, textId: 'rel.meet', chancePpm: ppm, cooldownMonths: 6,
    when: all(age(min, max), not(PARTNERED)), params: PARTNER_PARAMS,
    choices: [
      { id: 'together', effects: [{ set: 'rel.partner' }, { mark: 'rel.since' }, { stat: 'relationships', add: 80 }, { stat: 'satisfaction', add: 40 }] },
      { id: 'not-now', effects: [{ stat: 'freedom', add: 20 }] }
    ]
  })),
  ...([[0, 35, 20_000], [36, undefined, 8_000]] as const).map(([min, max, ppm], i): EventDef => ({
    id: `rel.move-in-${i}`, textId: 'rel.move-in', chancePpm: ppm, cooldownMonths: 6,
    when: all(flag('rel.partner'), not(TOGETHER), since('rel.since', min, max)), params: COHAB_PARAMS,
    choices: [
      { id: 'move-in', effects: [{ set: 'rel.cohabiting' }, { mark: 'rel.cohab-since' }, { clear: 'home.parents' }, { stat: 'relationships', add: 40 }, { stat: 'freedom', add: -20 }] },
      { id: 'own-places', effects: [{ stat: 'freedom', add: 20 }] }
    ]
  })),
  ...([[0, 59, 10_000], [60, undefined, 4_000]] as const).map(([min, max, ppm], i): EventDef => ({
    id: `rel.marry-${i}`, textId: 'rel.marry', chancePpm: ppm, cooldownMonths: 12,
    when: all(flag('rel.cohabiting'), not(flag('rel.married')), since('rel.cohab-since', min, max)), params: COHAB_PARAMS,
    choices: [
      { id: 'marry', effects: [{ set: 'rel.married' }, { mark: 'rel.married-since' }, { stat: 'security', add: 40 }, { stat: 'satisfaction', add: 30 }] },
      { id: 'as-we-are', effects: [] }
    ]
  })),
  ...separationEvents('cohab', COHAB_BANDS),
  ...separationEvents('divorce', DIVORCE_BANDS),

  // --- Children ---------------------------------------------------------------------------------
  {
    id: 'child.wish', chancePpm: 40_000, cooldownMonths: 24,
    when: all(TOGETHER, age(22, 42), { counter: 'children', max: 3 }, not(flag('child.trying')), not(flag('child.expected')), not(flag('child.no-plan'))),
    params: FERTILITY_PARAMS,
    choices: [
      { id: 'try', effects: [{ set: 'child.trying' }, { mark: 'child.trying-since' }] },
      { id: 'later', effects: [] },
      { id: 'no-children', effects: [{ set: 'child.no-plan' }, { stat: 'freedom', add: 20 }] }
    ]
  },
  ...CONCEPTION.map(([min, max, ppm], i): EventDef => ({
    id: `child.expected-${i}`, textId: 'child.expected', chancePpm: ppm, cooldownMonths: 1,
    when: all(flag('child.trying'), age(min, max), TOGETHER), params: CONCEPTION_PARAMS,
    choices: [{ id: 'happy', effects: [{ clear: 'child.trying' }, { set: 'child.expected' }, { schedule: 'child.born', inMonths: 9 }, { stat: 'meaning', add: 40 }] }]
  })),
  {
    id: 'child.not-yet', chancePpm: PPM, cooldownMonths: 12,
    when: all(flag('child.trying'), since('child.trying-since', 12)), params: CONCEPTION_PARAMS,
    choices: [
      { id: 'keep-trying', effects: [{ stat: 'mental', add: -20 }] },
      { id: 'medical-advice', effects: [{ stat: 'security', add: 10 }, { stat: 'energy', add: -20 }] },
      { id: 'stop', effects: [{ clear: 'child.trying' }, { stat: 'freedom', add: 20 }, { stat: 'satisfaction', add: -30 }] }
    ]
  },
  {
    id: 'child.born', chancePpm: 0, params: LEAVE_PARAMS,
    choices: [
      { id: 'leave-12', when: flag('work.employed'), effects: [{ birth: true }, { clear: 'child.expected' }, { set: 'work.parental-leave' }, { setCount: 'leave.left', value: 12 }, { stat: 'meaning', add: 80 }, { stat: 'relationships', add: 40 }, { stat: 'energy', add: -60 }] },
      { id: 'leave-2', when: flag('work.employed'), effects: [{ birth: true }, { clear: 'child.expected' }, { set: 'work.parental-leave' }, { setCount: 'leave.left', value: 2 }, { stat: 'meaning', add: 60 }, { stat: 'energy', add: -60 }] },
      { id: 'partner-leave', when: TOGETHER, effects: [{ birth: true }, { clear: 'child.expected' }, { stat: 'meaning', add: 50 }, { stat: 'energy', add: -50 }] },
      { id: 'welcome', effects: [{ birth: true }, { clear: 'child.expected' }, { stat: 'meaning', add: 70 }, { stat: 'energy', add: -70 }] }
    ]
  },
  {
    id: 'child.leave-ends', chancePpm: PPM, cooldownMonths: 1,
    when: all(flag('work.parental-leave'), { counter: 'leave.left', max: 0 }), params: LEAVE_PARAMS,
    choices: [
      { id: 'full-time', effects: [{ clear: 'work.parental-leave' }, { clear: 'work.part-time' }, { stat: 'security', add: 20 }, { stat: 'energy', add: -30 }] },
      { id: 'part-time', effects: [{ clear: 'work.parental-leave' }, { set: 'work.part-time' }, { stat: 'relationships', add: 20 }] },
      { id: 'at-home', when: TOGETHER, effects: [{ clear: 'work.parental-leave' }, { clear: 'work.employed' }, { clear: 'work.part-time' }, { set: 'work.home-parent' }, { stat: 'relationships', add: 30 }, { stat: 'security', add: -40 }] }
    ]
  },
  {
    // Back to work from caring at home: most mothers are employed again by the child's third year (IW 2026).
    id: 'child.back-to-work', chancePpm: 40_000, cooldownMonths: 12,
    when: all(flag('work.home-parent')), params: LEAVE_PARAMS,
    choices: [
      { id: 'search', effects: [{ clear: 'work.home-parent' }, { set: 'work.unemployed' }, { setCount: 'ui.left', value: 0 }] },
      { id: 'stay-home', when: TOGETHER, effects: [{ stat: 'freedom', add: -10 }] },
      { id: 'later', effects: [] }
    ]
  },

  // --- Career -----------------------------------------------------------------------------------
  ...([[20, 34, 7_000], [35, 49, 5_500], [50, 66, 2_500]] as const).map(([min, max, ppm], i): EventDef => ({
    // External job change ≈ 8.5 %/year (SOEP), falling with age (age split UNVERIFIED).
    id: `job.offer-elsewhere-${i}`, textId: 'job.offer-elsewhere', chancePpm: ppm, cooldownMonths: 12,
    when: all(flag('work.employed'), not(flag('work.parental-leave')), age(min, max)), params: CAREER_PARAMS,
    choices: [
      { id: 'switch', effects: [{ count: 'work.raise-permille', add: 50 }, { mark: 'job.since' }, { stat: 'security', add: -40 }, { stat: 'meaning', add: 20 }, { stat: 'energy', add: -20 }] },
      { id: 'stay', effects: [{ stat: 'security', add: 10 }] }
    ]
  })),
  ...([[20, 39, 3_400], [40, 54, 2_000], [55, 66, 800]] as const).map(([min, max, ppm], i): EventDef => ({
    // Internal moves ≈ 4.1 %/year (SOEP); pay step of a promotion UNVERIFIED (+7.5 % assumed).
    id: `job.promotion-${i}`, textId: 'job.promotion', chancePpm: ppm, cooldownMonths: 24,
    when: all(flag('work.employed'), not(flag('work.parental-leave')), age(min, max)), params: CAREER_PARAMS,
    choices: [
      { id: 'accept', effects: [{ count: 'work.raise-permille', add: 75 }, { stat: 'energy', add: -50 }, { stat: 'security', add: 30 }, { stat: 'meaning', add: 20 }, { stat: 'freedom', add: -20 }] },
      { id: 'decline', effects: [{ stat: 'freedom', add: 10 }] }
    ]
  })),

  // --- Parents ----------------------------------------------------------------------------------
  ...PARENT_DEATH.flatMap(([min, max, both, one], i): EventDef[] => [0, 1].map((lost) => ({
    id: `family.parent-dies-${i}-${lost}`, textId: 'family.parent-dies', chancePpm: lost === 0 ? both : one, cooldownMonths: 3,
    when: all(age(min, max), { counter: 'parents.lost', min: lost, max: lost }), params: PARENT_DEATH_PARAMS,
    choices: [
      { id: 'family', effects: [...grief, { stat: 'relationships', add: 30 }] },
      { id: 'time-off', effects: [...grief, { stat: 'energy', add: 30 }, { stat: 'security', add: -20 }] },
      { id: 'carry-on', effects: [...grief, { stat: 'mental', add: -30 }] }
    ]
  }))),
  ...([[18, 49, 850], [50, 65, 2_500], [66, 80, 800]] as const).map(([min, max, ppm], i): EventDef => ({
    // Onset of caring for a parent: prevalence ÷ an assumed 4–5-year episode (episode length UNVERIFIED).
    id: `care.parent-${i}`, textId: 'care.parent', chancePpm: ppm, cooldownMonths: 24,
    when: all(age(min, max), { counter: 'parents.lost', max: 1 }, not(flag('care.active'))), params: CARE_PARAMS,
    choices: [
      { id: 'reduce-hours', when: flag('work.employed'), effects: [{ set: 'care.active' }, { set: 'work.part-time' }, { stat: 'relationships', add: 50 }, { stat: 'security', add: -30 }, { stat: 'energy', add: -20 }] },
      { id: 'alongside', effects: [{ set: 'care.active' }, { stat: 'relationships', add: 40 }, { stat: 'energy', add: -80 }, { stat: 'mental', add: -40 }] },
      { id: 'share', effects: [{ set: 'care.active' }, { stat: 'relationships', add: 20 }, { stat: 'energy', add: -30 }] }
    ]
  }))
];
