import type { Cond, Effect, EventDef } from '../events';
import { PPM } from '../events';
import { IN_AVERAGE_LIVING } from '../profiles/in';

/**
 * First event pack of the India-calibrated profile (E4a): school type, the pressure to leave school
 * early, the board exams and streams, entrance-exam coaching and the drop year, college, casual and
 * regular work with or without social security, graduate unemployment, finding a room off the
 * street, and hospital bills with or without insurance.
 *
 * Monthly chances are derived from annual or stock figures offline and noted next to each value.
 * Texts live in the game (`event.<id>.*`, `choice.<id>.<choice>`). Family life follows in E4b.
 */
const age = (min: number, max = min): Cond => ({ age: { min, max } });
const flag = (f: string): Cond => ({ flag: f });
const not = (c: Cond): Cond => ({ not: c });
const all = (...c: Cond[]): Cond => ({ all: c });
const qual = (min: number, max = min): Cond => ({ counter: 'qual', min, max });

/** Life satisfaction effect of unemployment, transferred from the German SOEP estimate (−0.67 on 0–10). */
const UNEMPLOYMENT_SATISFACTION = 67;

/**
 * Monthly job loss in ppm from the steady state s = f·u / (1 − u) with the assumed monthly
 * job-finding rate f and the PLFS unemployment rate u by education: up to secondary f = 0.1,
 * u = 0.044 → 4603; higher secondary or diploma f = 0.1, u = 0.086 → 9409; graduates f = 0.05,
 * u = 0.13 → 7471.
 */
const LAYOFF_PPM = { casual: 4_603, regular: 9_409, graduate: 7_471 } as const;
const FIND_PPM = { other: 100_000, graduate: 50_000 } as const;

/**
 * Seat at an elite public engineering institute: 1.2 % of the candidates overall. With coaching
 * (share c = 0.27) the odds are assumed to be three times higher: base = 0.012 / (1 − c + 3c) = 7792,
 * with coaching 23377 ppm.
 */
const SEAT_PPM = { coached: 23_377, base: 7_792 } as const;

/** Regular employees with social security (and employer health cover): 1 − 0.534 = 46.6 %. */
const SOCIAL_SECURITY_PPM = 466_000;

/** A catastrophic hospital bill: two months of average living costs at start prices (assumption). */
export const HOSPITAL_BILL_PAISE = Math.round(2 * IN_AVERAGE_LIVING * 100);

const leaveEducation: Effect[] = [{ clear: 'work.unemployed' }, { clear: 'work.training' }, { clear: 'work.study' }, { clear: 'work.school' }];
const startCasual: Effect[] = [...leaveEducation, { set: 'work.employed' }, { stat: 'satisfaction', add: UNEMPLOYMENT_SATISFACTION }, { stat: 'security', add: 40 }];
const startRegular: Effect[] = [
  ...leaveEducation, { set: 'work.employed' }, { stat: 'satisfaction', add: UNEMPLOYMENT_SATISFACTION }, { stat: 'security', add: 60 },
  { roll: [{ ppm: SOCIAL_SECURITY_PPM }], win: [{ set: 'work.social-security' }, { set: 'health.insured' }, { stat: 'security', add: 60 }], lose: [] }
];
const loseJob: Effect[] = [
  { mark: 'job.lost-at' }, { clear: 'work.employed' }, { clear: 'work.part-time' }, { clear: 'work.social-security' }, { clear: 'health.insured' },
  { set: 'work.unemployed' }, { stat: 'satisfaction', add: -UNEMPLOYMENT_SATISFACTION }, { stat: 'security', add: -100 }
];
const FIND_PARAMS = ['in.model.job-finding-monthly-other', 'in.labour.regular-no-social-security', 'de.wellbeing.unemployment-life-satisfaction'];
const LAYOFF_PARAMS = ['in.model.job-finding-monthly-other', 'in.model.job-finding-monthly-graduate', 'in.labour.unemployment.secondary', 'in.labour.unemployment.higher-secondary', 'in.labour.unemployment.tertiary'];

export const EVENTS_IN: readonly EventDef[] = [
  // --- School ----------------------------------------------------------------------------------------
  {
    id: 'school.start-in', chancePpm: PPM, once: true, when: age(6),
    params: ['in.education.government-school-share', 'in.education.spend-government-school', 'in.education.spend-private-school'],
    choices: [
      { id: 'government', effects: [{ set: 'school.government' }] },
      { id: 'private', when: not(flag('parents.low-income')), effects: [{ set: 'school.private' }, { stat: 'security', add: 20 }] }
    ]
  },
  {
    id: 'child.first-day-in', textId: 'child.first-day', chancePpm: PPM, once: true, when: age(6),
    choices: [
      { id: 'curious', effects: [{ stat: 'meaning', add: 30 }, { set: 'trait.curious' }] },
      { id: 'sporty', effects: [{ stat: 'health', add: 30 }, { set: 'trait.sporty' }] },
      { id: 'friendly', effects: [{ stat: 'relationships', add: 30 }, { set: 'trait.social' }] }
    ]
  },
  {
    // Secondary dropout 14.1 % a year (UDISE+ 2023-24) → 1 − 0.859^(1/12) = 12586 ppm in grades 9–10.
    id: 'school.leave-pressure', chancePpm: 12_586, cooldownMonths: 12, when: all(age(14, 15), flag('school.government'), not(flag('school.left'))),
    params: ['in.education.secondary-dropout-rate'],
    choices: [
      { id: 'stay', effects: [{ stat: 'meaning', add: 20 }, { stat: 'security', add: -40 }] },
      { id: 'leave', effects: [{ set: 'school.left' }, { stat: 'meaning', add: -30 }, { stat: 'security', add: 30 }] }
    ]
  },
  {
    id: 'school.left-work', chancePpm: PPM, once: true, when: all(age(16), flag('school.left')),
    choices: [{ id: 'look', effects: [{ set: 'work.unemployed' }] }]
  },
  {
    id: 'school.board-exams', chancePpm: PPM, once: true, when: all(age(16), not(flag('school.left'))),
    params: ['in.education.higher-education-ger'],
    choices: [
      { id: 'science', effects: [{ set: 'work.school' }, { set: 'school.science' }] },
      { id: 'commerce-arts', effects: [{ set: 'work.school' }, { set: 'school.commerce-arts' }] },
      { id: 'vocational', effects: [{ set: 'work.training' }, { schedule: 'training.done-in', inMonths: 24 }] },
      { id: 'work', effects: [{ set: 'school.left' }, { set: 'work.unemployed' }] }
    ]
  },
  {
    id: 'school.coaching', chancePpm: PPM, once: true, when: all(age(16, 17), flag('school.science'), flag('work.school')),
    params: ['in.education.coaching-share', 'in.education.residential-coaching-cost', 'in.education.residential-coaching-hostel'],
    choices: [
      { id: 'residential', when: not(flag('parents.low-income')), effects: [{ set: 'school.coaching' }, { stat: 'energy', add: -80 }, { stat: 'relationships', add: -40 }] },
      { id: 'local', effects: [{ set: 'school.coaching' }, { stat: 'energy', add: -40 }, { stat: 'security', add: -30 }] },
      { id: 'self-study', effects: [{ stat: 'meaning', add: 10 }] }
    ]
  },
  {
    id: 'school.final-exams-science', textId: 'school.final-exams-in', chancePpm: PPM, once: true, when: all(age(18), flag('work.school'), flag('school.science')),
    choices: [{ id: 'done', effects: [{ clear: 'work.school' }, { set: 'school.higher-secondary' }, { setCount: 'qual', value: 1 }, { schedule: 'exam.entrance', inMonths: 1 }] }]
  },
  {
    id: 'school.final-exams-other', textId: 'school.final-exams-in', chancePpm: PPM, once: true, when: all(age(18), flag('work.school'), not(flag('school.science'))),
    choices: [{ id: 'done', effects: [{ clear: 'work.school' }, { set: 'school.higher-secondary' }, { setCount: 'qual', value: 1 }, { schedule: 'school.choose-path-in', inMonths: 1 }] }]
  },
  // --- Entrance exams, college, training -------------------------------------------------------------
  {
    id: 'exam.entrance', chancePpm: 0,
    params: ['in.education.elite-tech-seat-odds', 'in.education.coaching-share', 'in.model.coaching-odds-ratio'],
    choices: [{
      id: 'sit',
      effects: [{ set: 'exam.taken' }, {
        roll: [{ when: flag('school.coaching'), ppm: SEAT_PPM.coached }, { ppm: SEAT_PPM.base }],
        win: [{ set: 'study.elite' }, { set: 'work.study' }, { stat: 'meaning', add: 60 }, { schedule: 'study.end-in', inMonths: 48 }],
        lose: [{ set: 'exam.missed' }, { schedule: 'school.choose-path-in', inMonths: 1 }]
      }]
    }]
  },
  {
    id: 'school.choose-path-in', chancePpm: 0,
    params: ['in.education.higher-education-ger'],
    choices: [
      { id: 'college', effects: [{ set: 'work.study' }, { schedule: 'study.end-in', inMonths: 36 }] },
      { id: 'private-college', when: not(flag('parents.low-income')), effects: [{ set: 'work.study' }, { set: 'study.private' }, { schedule: 'study.end-in', inMonths: 48 }] },
      { id: 'drop-year', when: all(flag('exam.missed'), not(flag('exam.repeated'))), effects: [{ set: 'exam.repeated' }, { set: 'school.coaching' }, { stat: 'energy', add: -60 }, { schedule: 'exam.entrance', inMonths: 12 }] },
      { id: 'vocational', effects: [{ set: 'work.training' }, { schedule: 'training.done-in', inMonths: 24 }] },
      { id: 'work', effects: [{ set: 'work.unemployed' }] }
    ]
  },
  {
    id: 'training.done-in', chancePpm: 0,
    choices: [{ id: 'done', effects: [{ setCount: 'qual', value: 1 }, { set: 'qual.vocational' }, { clear: 'work.training' }, { set: 'work.unemployed' }] }]
  },
  {
    id: 'study.end-in', chancePpm: 0,
    choices: [
      { id: 'placement', when: flag('study.elite'), effects: [{ setCount: 'qual', value: 2 }, { set: 'qual.bachelor' }, ...leaveEducation, { set: 'work.employed' }, { set: 'work.social-security' }, { set: 'health.insured' }, { stat: 'security', add: 120 }] },
      { id: 'next', effects: [{ setCount: 'qual', value: 2 }, { set: 'qual.bachelor' }, { schedule: 'study.next-in', inMonths: 1 }] }
    ]
  },
  {
    id: 'study.next-in', chancePpm: 0,
    choices: [
      { id: 'master', effects: [{ schedule: 'study.master-end-in', inMonths: 24 }] },
      { id: 'job', effects: [{ clear: 'work.study' }, { set: 'work.unemployed' }] }
    ]
  },
  {
    id: 'study.master-end-in', chancePpm: 0,
    choices: [{ id: 'done', effects: [{ setCount: 'qual', value: 3 }, { set: 'qual.master' }, { clear: 'work.study' }, { set: 'work.unemployed' }] }]
  },
  // --- Labour market ---------------------------------------------------------------------------------
  {
    id: 'job.found-in-casual', textId: 'job.found-in', chancePpm: FIND_PPM.other, cooldownMonths: 1, when: all(flag('work.unemployed'), qual(0)), params: FIND_PARAMS,
    choices: [{ id: 'take', effects: startCasual }, { id: 'keep-looking', effects: [] }]
  },
  {
    id: 'job.found-in-regular', textId: 'job.found-in', chancePpm: FIND_PPM.other, cooldownMonths: 1, when: all(flag('work.unemployed'), qual(1)), params: FIND_PARAMS,
    choices: [{ id: 'take', effects: startRegular }, { id: 'keep-looking', effects: [] }]
  },
  {
    id: 'job.found-in-graduate', textId: 'job.found-in', chancePpm: FIND_PPM.graduate, cooldownMonths: 1, when: all(flag('work.unemployed'), qual(2, 3)),
    params: ['in.model.job-finding-monthly-graduate', 'in.labour.unemployment.graduate-youth', ...FIND_PARAMS],
    choices: [{ id: 'take', effects: startRegular }, { id: 'keep-looking', effects: [] }]
  },
  {
    id: 'job.lost-in-casual', textId: 'job.lost-in', chancePpm: LAYOFF_PPM.casual, cooldownMonths: 6, when: all(flag('work.employed'), qual(0)), params: LAYOFF_PARAMS,
    choices: [{ id: 'accept', effects: loseJob }]
  },
  {
    id: 'job.lost-in-regular', textId: 'job.lost-in', chancePpm: LAYOFF_PPM.regular, cooldownMonths: 6, when: all(flag('work.employed'), qual(1)), params: LAYOFF_PARAMS,
    choices: [{ id: 'accept', effects: loseJob }]
  },
  {
    id: 'job.lost-in-graduate', textId: 'job.lost-in', chancePpm: LAYOFF_PPM.graduate, cooldownMonths: 6, when: all(flag('work.employed'), qual(2, 3)), params: LAYOFF_PARAMS,
    choices: [{ id: 'accept', effects: loseJob }]
  },
  // --- Home --------------------------------------------------------------------------------------------
  {
    id: 'home.room', chancePpm: PPM, cooldownMonths: 12, when: all(flag('home.street'), flag('work.employed'), { age: { min: 16 } }),
    params: ['in.housing.houseless-share', 'in.housing.slum-share-urban'],
    choices: [
      { id: 'rent', effects: [{ clear: 'home.street' }, { clear: 'home.parents' }, { setCount: 'lifestyle', value: 0 }, { stat: 'security', add: 100 }, { stat: 'freedom', add: 60 }] },
      { id: 'stay', effects: [{ stat: 'relationships', add: 20 }] }
    ]
  },
  {
    id: 'home.move-out-in', textId: 'home.move-out', chancePpm: PPM, cooldownMonths: 36, when: all(flag('home.parents'), not(flag('home.street')), { age: { min: 21, max: 34 } }),
    choices: [
      { id: 'frugal', effects: [{ clear: 'home.parents' }, { setCount: 'lifestyle', value: 0 }, { stat: 'freedom', add: 80 }] },
      { id: 'average', effects: [{ clear: 'home.parents' }, { setCount: 'lifestyle', value: 1 }, { stat: 'freedom', add: 100 }] },
      { id: 'comfortable', effects: [{ clear: 'home.parents' }, { setCount: 'lifestyle', value: 2 }, { stat: 'freedom', add: 100 }, { stat: 'satisfaction', add: 20 }] },
      { id: 'stay', effects: [{ stat: 'relationships', add: 10 }] }
    ]
  },
  // --- Health ------------------------------------------------------------------------------------------
  {
    // Households with catastrophic health spending: 16.5 % a year → 1 − 0.835^(1/12) = 14915 ppm.
    id: 'health.hospital', chancePpm: 14_915, cooldownMonths: 12, when: all({ age: { min: 18 } }, not(flag('home.parents'))),
    params: ['in.health.catastrophic-spending-share', 'in.model.hospital-bill-months', 'in.health.insurance-coverage', 'in.health.out-of-pocket-share'],
    choices: [
      { id: 'insurance', when: flag('health.insured'), effects: [{ stat: 'health', add: -30 }, { stat: 'security', add: 20 }] },
      { id: 'pay', effects: [{ book: { account: 'cash', cents: -HOSPITAL_BILL_PAISE, category: 'health', real: true } }, { stat: 'health', add: -30 }, { stat: 'security', add: -60 }] }
    ]
  }
];
