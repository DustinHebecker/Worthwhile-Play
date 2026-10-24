import { createRng } from '@wp/game-core';
import type { Economy } from './economy';
import { isEconomy, nextEconomyYear, startEconomy } from './economy';
import { book, openLedger } from './ledger';
import { LIFE_TABLES } from './params/lifetables';
import type { Living, Profile, Qualification } from './profile';
import { QUALIFICATIONS } from './profile';
import type { RngFor } from './sim';
import type { LifeCore, Sex } from './state';
import { STATS, clampStat, isLifeCore } from './state';
import { ageInYears, dateOf } from './time';

/** A life: the core plus the economy it lives in and how it started. */
export interface LifeState extends LifeCore {
  seed: number;
  householdId: string;
  economy: Economy;
}

/** Age from which the person has own finances (budget booked monthly). */
export const OWN_FINANCES_AGE = 16;
/** With the "gentle" content setting, no death before this age (owner decision O23). */
export const GENTLE_MIN_DEATH_AGE = 70;
/** Childhood mortality is not played (O23): no death draws before this age. */
export const MORTALITY_FROM_AGE = 16;

const LIFESTYLES: readonly Living[] = ['frugal', 'average', 'comfortable'];

const counter = (s: LifeCore, id: string): number => (Object.hasOwn(s.counters, id) ? (s.counters[id] as number) : 0);
const has = (s: LifeCore, flag: string): boolean => s.flags.includes(flag);

export function qualificationOf(s: LifeCore): Qualification {
  return QUALIFICATIONS[Math.max(0, Math.min(QUALIFICATIONS.length - 1, counter(s, 'qual')))] as Qualification;
}

export interface NewLifeOptions {
  seed: number;
  profile: Profile;
  /** A household of the profile; random when absent. */
  householdId?: string;
  /** Content setting "gentle" (no early own death). */
  gentle?: boolean;
  rngFor: RngFor;
}

/** Starts a life at birth (owner decisions O18: sex random; O10: household random or chosen). */
export function newLife(options: NewLifeOptions): LifeState {
  const { profile, seed } = options;
  const rng = createRng(seed);
  const sex: Sex = rng.int(0, 1) === 0 ? 'female' : 'male';
  const birthMonth = rng.int(1, 12);
  const household = options.householdId === undefined
    ? rng.pick(profile.households)
    : profile.households.find((h) => h.id === options.householdId);
  if (household === undefined) throw new RangeError(`Unknown household: ${String(options.householdId)}`);
  const stats = Object.fromEntries(STATS.map((id) => [id, 500])) as LifeCore['stats'];
  for (const [id, v] of Object.entries(household.stats ?? {})) stats[id as keyof typeof stats] = clampStat(v);
  const flags = [...household.flags, 'home.parents', ...(options.gentle === true ? ['content.gentle'] : [])].sort();
  return {
    seed,
    householdId: household.id,
    month: 0,
    calendar: { birthYear: profile.birthYear, birthMonth },
    sex,
    profileId: profile.id,
    alive: true,
    stats,
    flags: [...new Set(flags)],
    counters: { lifestyle: 1 },
    ledger: openLedger(),
    pending: [],
    scheduled: [],
    lastSeen: {},
    economy: startEconomy(profile.economy, options.rngFor(0, 'economy'))
  };
}

export interface BudgetItem {
  category: string;
  /** Positive: income; negative: cost. Cents of the current month. */
  cents: number;
}

/** The household budget of the current month (design § 5.5); empty before own finances. */
export function budget(s: LifeState, profile: Profile): BudgetItem[] {
  const age = ageInYears(s.month);
  if (age < OWN_FINANCES_AGE || !s.alive) return [];
  const items: BudgetItem[] = [];
  const atParents = has(s, 'home.parents');
  const prices = s.economy.priceIndex;
  if (has(s, 'work.employed')) {
    const gross = Math.round(profile.grossPay(qualificationOf(s), age, s.sex, has(s, 'work.part-time')) * s.economy.wageIndex * (1 + counter(s, 'work.raise-permille') / 1000));
    items.push({ category: 'salary', cents: profile.netPay(gross) });
  } else if (has(s, 'work.unemployed') && counter(s, 'ui.left') > 0) {
    items.push({ category: 'unemployment-insurance', cents: Math.round(counter(s, 'work.last-net') * profile.unemploymentInsurance.replacement) });
  } else if (has(s, 'work.training') || has(s, 'work.study')) {
    const support = profile.educationSupport(has(s, 'parents.low-income'));
    items.push({ category: support.category, cents: Math.round(support.cents * prices) });
  } else if (age >= 18 && !has(s, 'work.retired')) {
    items.push({ category: 'basic-support', cents: Math.round(profile.basicSupport(atParents) * prices) });
  }
  const living: Living = atParents ? 'parents' : (LIFESTYLES[Math.max(0, Math.min(2, counter(s, 'lifestyle')))] as Living);
  items.push({ category: 'living', cents: -Math.round(profile.livingCost(living) * prices) });
  return items;
}

/** Monthly death probability in ppm for the person's age and sex (profile life table). */
export function mortalityPpm(s: LifeState, profile: Profile): number {
  const table = LIFE_TABLES[profile.region];
  if (table === undefined) return 0;
  const row = s.sex === 'female' ? table.female : table.male;
  return row[Math.min(ageInYears(s.month), row.length - 1)] ?? 1_000_000;
}

/**
 * The monthly systems of a life, in a fixed order: a new economic year in January, mortality,
 * then the budget is booked. Each system draws from its own stream.
 */
export function lifeSystems(profile: Profile): (s: LifeState, rngFor: RngFor) => LifeState {
  return (state, rngFor) => {
    let s = state;
    if (dateOf(s.calendar, s.month).month === 1 && s.month > 0) {
      s = { ...s, economy: nextEconomyYear(s.economy, profile.economy, rngFor(s.month, 'economy')) };
    }
    const age = ageInYears(s.month);
    if (age >= MORTALITY_FROM_AGE && !(has(s, 'content.gentle') && age < GENTLE_MIN_DEATH_AGE)) {
      if (rngFor(s.month, 'mortality').next() * 1_000_000 < mortalityPpm(s, profile)) {
        return { ...s, alive: false, flags: [...new Set([...s.flags, 'died.natural'])].sort() };
      }
    }
    const items = budget(s, profile);
    let ledger = s.ledger;
    for (const item of items) if (item.cents !== 0) ledger = book(ledger, 'cash', item.cents, item.category);
    const counters = { ...s.counters };
    const salary = items.find((i) => i.category === 'salary');
    if (salary !== undefined) counters['work.last-net'] = salary.cents;
    if (has(s, 'work.unemployed') && counter(s, 'ui.left') > 0) counters['ui.left'] = counter(s, 'ui.left') - 1;
    return { ...s, ledger, counters };
  };
}

export function isLifeState(value: unknown): value is LifeState {
  if (!isLifeCore(value)) return false;
  const s = value as unknown as Record<string, unknown>;
  return Number.isSafeInteger(s.seed) && typeof s.householdId === 'string' && /^[a-z0-9-]{1,40}$/.test(s.householdId) && isEconomy(s.economy);
}
