import type { Cond, EventDef } from '../events';
import { PPM } from '../events';

/**
 * First event pack of the Germany-calibrated profile (E2 slice): childhood scenes, the school
 * recommendation gate with its detours (owner request: a refused recommendation blocks the direct
 * route to university, never the goal), training and study, first jobs, job loss and job finding,
 * moving out, and two health events with support options.
 *
 * Monthly chances are derived from annual or stock figures offline and noted next to each value.
 * Texts live in the game (`event.<id>.*`, `choice.<id>.<choice>`).
 */
const age = (min: number, max = min): Cond => ({ age: { min, max } });
const flag = (f: string): Cond => ({ flag: f });
const all = (...c: Cond[]): Cond => ({ all: c });
const qual = (min: number, max = min): Cond => ({ counter: 'qual', min, max });

/** Life satisfaction effect of unemployment beyond the income loss: −0.67 on 0–10 (SOEP) = −67 ‰. */
const UNEMPLOYMENT_SATISFACTION = 67;

/**
 * Monthly job loss in ppm from the steady state s = f·u / (1 − u) with the monthly job-finding rate
 * f = 0.07 and the unemployment rate u by qualification: none 0.209 → 18496; vocational 0.045 → 3298;
 * tertiary 0.029 → 2091.
 */
const LAYOFF_PPM = { none: 18_496, vocational: 3_298, tertiary: 2_091 } as const;
const LAYOFF_PARAMS = ['de.labour.job-finding-monthly-insured', 'de.labour.unemployment.no-qualification', 'de.labour.unemployment.vocational', 'de.labour.unemployment.tertiary', 'de.wellbeing.unemployment-life-satisfaction'];

const loseJob = [
  { clear: 'work.employed' }, { clear: 'work.part-time' }, { set: 'work.unemployed' },
  { setCount: 'ui.left', value: 12 }, { stat: 'satisfaction' as const, add: -UNEMPLOYMENT_SATISFACTION }, { stat: 'security' as const, add: -100 }
];
const startJob = (partTime: boolean) => [
  { clear: 'work.unemployed' }, { clear: 'work.training' }, { clear: 'work.study' }, { clear: 'work.school' },
  { set: 'work.employed' }, ...(partTime ? [{ set: 'work.part-time' }] : [{ clear: 'work.part-time' }]),
  { setCount: 'ui.left', value: 0 }
];

export const EVENTS_DE: readonly EventDef[] = [
  // --- Childhood scenes (compressed, O3) ----------------------------------------------------------
  {
    id: 'child.first-day', chancePpm: PPM, once: true, when: age(6),
    choices: [
      { id: 'curious', effects: [{ stat: 'meaning', add: 30 }, { set: 'trait.curious' }] },
      { id: 'sporty', effects: [{ stat: 'health', add: 30 }, { set: 'trait.sporty' }] },
      { id: 'friendly', effects: [{ stat: 'relationships', add: 30 }, { set: 'trait.social' }] }
    ]
  },
  {
    id: 'school.recommendation', chancePpm: PPM, once: true, when: age(10),
    params: ['de.education.gymnasium-rec-academic-parent', 'de.education.gymnasium-rec-manual-parent'],
    choices: [{
      id: 'wait',
      effects: [{
        roll: [{ when: flag('parents.tertiary'), ppm: 645_000 }, { ppm: 226_000 }],
        win: [{ set: 'school.recommended' }, { set: 'school.academic-track' }],
        lose: [{ set: 'school.not-recommended' }, { set: 'school.middle-track' }]
      }]
    }]
  },
  // --- After the middle school (16): training, detour to the university entrance, or work ----------
  {
    id: 'school.after-middle', chancePpm: PPM, once: true, when: all(age(16), flag('school.middle-track')),
    choices: [
      { id: 'training', effects: [{ set: 'work.training' }, { schedule: 'training.done', inMonths: 36 }] },
      { id: 'detour', effects: [{ set: 'work.school' }, { stat: 'energy', add: -50 }, { schedule: 'school.entrance-detour', inMonths: 24 }] },
      { id: 'work', effects: [{ set: 'work.unemployed' }] }
    ]
  },
  {
    id: 'school.entrance-detour', chancePpm: 0,
    choices: [{ id: 'done', effects: [{ clear: 'work.school' }, { set: 'school.entrance' }, { schedule: 'school.choose-path', inMonths: 1 }] }]
  },
  {
    id: 'school.final-exams', chancePpm: PPM, once: true, when: all(age(18), flag('school.academic-track')),
    choices: [{ id: 'done', effects: [{ set: 'school.entrance' }, { schedule: 'school.choose-path', inMonths: 1 }] }]
  },
  {
    id: 'school.choose-path', chancePpm: 0,
    choices: [
      { id: 'study', effects: [{ set: 'work.study' }, { schedule: 'study.end', inMonths: 36 }] },
      { id: 'training', effects: [{ set: 'work.training' }, { schedule: 'training.done', inMonths: 36 }] },
      { id: 'work', effects: [{ set: 'work.unemployed' }] }
    ]
  },
  // --- Training and study --------------------------------------------------------------------------
  {
    id: 'training.done', chancePpm: 0,
    choices: [
      { id: 'stay', effects: [{ setCount: 'qual', value: 1 }, { set: 'qual.vocational' }, ...startJob(false), { stat: 'security', add: 80 }] },
      { id: 'study-later', when: flag('school.entrance'), effects: [{ setCount: 'qual', value: 1 }, { set: 'qual.vocational' }, { clear: 'work.training' }, { set: 'work.study' }, { schedule: 'study.end', inMonths: 36 }] }
    ]
  },
  {
    id: 'study.end', chancePpm: 0,
    params: ['de.education.bachelor-dropout-university'],
    choices: [{
      id: 'exams',
      effects: [{
        roll: [{ ppm: 650_000 }],
        win: [{ setCount: 'qual', value: 2 }, { set: 'qual.bachelor' }, { schedule: 'study.next', inMonths: 1 }],
        lose: [{ clear: 'work.study' }, { set: 'study.dropped-out' }, { stat: 'satisfaction', add: -40 }, { schedule: 'study.dropout-path', inMonths: 1 }]
      }]
    }]
  },
  {
    id: 'study.next', chancePpm: 0,
    choices: [
      { id: 'master', effects: [{ schedule: 'study.master-end', inMonths: 24 }] },
      { id: 'job', effects: [{ clear: 'work.study' }, { set: 'work.unemployed' }] }
    ]
  },
  {
    id: 'study.master-end', chancePpm: 0,
    choices: [{ id: 'done', effects: [{ setCount: 'qual', value: 3 }, { set: 'qual.master' }, { clear: 'work.study' }, { set: 'work.unemployed' }] }]
  },
  {
    id: 'study.dropout-path', chancePpm: 0,
    choices: [
      { id: 'training', effects: [{ set: 'work.training' }, { schedule: 'training.done', inMonths: 36 }] },
      { id: 'work', effects: [{ set: 'work.unemployed' }] }
    ]
  },
  // --- Labour market -------------------------------------------------------------------------------
  {
    id: 'job.found', chancePpm: 70_000, cooldownMonths: 1, when: all(flag('work.unemployed'), { counter: 'ui.left', min: 1 }),
    params: ['de.labour.job-finding-monthly-insured', 'de.wellbeing.unemployment-life-satisfaction'],
    choices: [
      { id: 'full-time', effects: [...startJob(false), { stat: 'satisfaction', add: UNEMPLOYMENT_SATISFACTION }, { stat: 'security', add: 100 }] },
      { id: 'part-time', effects: [...startJob(true), { stat: 'satisfaction', add: UNEMPLOYMENT_SATISFACTION }, { stat: 'security', add: 60 }, { stat: 'freedom', add: 40 }] },
      { id: 'keep-looking', effects: [] }
    ]
  },
  {
    id: 'job.found-long-term', chancePpm: 25_000, cooldownMonths: 1, when: all(flag('work.unemployed'), { counter: 'ui.left', max: 0 }),
    params: ['de.labour.job-finding-monthly-basic-support'],
    choices: [
      { id: 'full-time', effects: [...startJob(false), { stat: 'satisfaction', add: UNEMPLOYMENT_SATISFACTION }, { stat: 'security', add: 100 }] },
      { id: 'part-time', effects: [...startJob(true), { stat: 'satisfaction', add: UNEMPLOYMENT_SATISFACTION }, { stat: 'security', add: 60 }] },
      { id: 'keep-looking', effects: [] }
    ]
  },
  {
    id: 'job.lost-unskilled', chancePpm: LAYOFF_PPM.none, cooldownMonths: 6, when: all(flag('work.employed'), qual(0)), params: LAYOFF_PARAMS,
    choices: [{ id: 'accept', effects: loseJob }]
  },
  {
    id: 'job.lost-vocational', chancePpm: LAYOFF_PPM.vocational, cooldownMonths: 6, when: all(flag('work.employed'), qual(1)), params: LAYOFF_PARAMS,
    choices: [{ id: 'accept', effects: loseJob }]
  },
  {
    id: 'job.lost-graduate', chancePpm: LAYOFF_PPM.tertiary, cooldownMonths: 6, when: all(flag('work.employed'), qual(2, 3)), params: LAYOFF_PARAMS,
    choices: [{ id: 'accept', effects: loseJob }]
  },
  // --- Home ----------------------------------------------------------------------------------------
  {
    id: 'home.move-out', chancePpm: PPM, cooldownMonths: 24, when: all(flag('home.parents'), { age: { min: 19, max: 34 } }),
    choices: [
      { id: 'frugal', effects: [{ clear: 'home.parents' }, { setCount: 'lifestyle', value: 0 }, { stat: 'freedom', add: 80 }] },
      { id: 'average', effects: [{ clear: 'home.parents' }, { setCount: 'lifestyle', value: 1 }, { stat: 'freedom', add: 100 }] },
      { id: 'comfortable', effects: [{ clear: 'home.parents' }, { setCount: 'lifestyle', value: 2 }, { stat: 'freedom', add: 100 }, { stat: 'satisfaction', add: 20 }] },
      { id: 'stay', effects: [{ stat: 'relationships', add: 10 }] }
    ]
  },
  // --- Health (support is always offered; no punishment framing) ---------------------------------
  {
    // Sick leave for mental-health reasons: 7 % of employees per year → 1 − 0.93^(1/12) = 6029 ppm.
    id: 'health.mental-strain', chancePpm: 6_029, cooldownMonths: 12, when: all(flag('work.employed'), { age: { min: 18 } }),
    params: ['de.health.mental-sick-leave-incidence', 'de.health.mental-sick-leave-days-per-case'],
    choices: [
      { id: 'support', effects: [{ stat: 'mental', add: 60 }, { stat: 'energy', add: 40 }, { set: 'health.had-support' }] },
      { id: 'sick-leave', effects: [{ stat: 'mental', add: 40 }, { stat: 'energy', add: 80 }, { stat: 'security', add: -20 }] },
      { id: 'carry-on', effects: [{ stat: 'mental', add: -60 }, { stat: 'energy', add: -60 }] }
    ]
  },
  {
    // New accident pensions: 0.237 per 1000 full-time workers per year → ≈ 20 ppm per month.
    id: 'health.work-accident', chancePpm: 20, once: true, when: flag('work.employed'),
    params: ['de.health.accident-pension-rate'],
    choices: [
      { id: 'rehab', effects: [{ stat: 'health', add: -150 }, { set: 'health.reduced-capacity' }, { stat: 'security', add: -50 }] },
      { id: 'part-time', effects: [{ stat: 'health', add: -150 }, { set: 'health.reduced-capacity' }, { set: 'work.part-time' }] }
    ]
  }
];
