import { createRng } from '@wp/game-core';
import type { Economy } from './economy';
import { isEconomy, nextEconomyYear, startEconomy } from './economy';
import { balanceOf, book, openLedger } from './ledger';
import { LIFE_TABLES } from './params/lifetables';
import type { Living, Profile, Qualification } from './profile';
import { QUALIFICATIONS } from './profile';
import type { RngFor } from './sim';
import type { LifeCore, Sex } from './state';
import { STATS, clampStat, isLifeCore } from './state';
import { ageInYears, dateOf, isBirthday } from './time';

/** One line of a life's history, written on each birthday from the own-finances age and at the end. */
export interface YearRecord {
  age: number;
  /** Money at the end of the year (cents, nominal). */
  cash: number;
  /** Price index then (to show money in start-year prices). */
  prices: number;
  /** Own monthly income (all positive budget items, cents, nominal) in the last month. */
  income: number;
  /** The stats in the order of STATS. */
  stats: number[];
}

/** A life: the core plus the economy it lives in, how it started and its yearly history. */
export interface LifeState extends LifeCore {
  seed: number;
  householdId: string;
  economy: Economy;
  /** Yearly history (absent in saves from before it existed). */
  years?: YearRecord[];
}

export const YEARS_LIMIT = 130;

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

/** Ages (completed years) of the children under 18 (counters `child.<n>.born`). */
export function childAges(s: LifeCore): number[] {
  const ages: number[] = [];
  for (let n = 1; n <= counter(s, 'children'); n++) {
    const born = s.counters[`child.${n}.born`];
    if (born === undefined) continue;
    const age = Math.floor((s.month - born) / 12);
    if (age < 18) ages.push(age);
  }
  return ages;
}

/** The person lives together with a partner (cohabiting or married). */
export const livesWithPartner = (s: LifeCore): boolean => has(s, 'rel.cohabiting') || has(s, 'rel.married');

/**
 * The household budget of the current month (design § 5.5), the person's own share: with a partner,
 * shared costs and child benefit are split in half. Empty before own finances.
 */
export function budget(s: LifeState, profile: Profile): BudgetItem[] {
  const age = ageInYears(s.month);
  if (age < OWN_FINANCES_AGE || !s.alive) return [];
  const items: BudgetItem[] = [];
  const atParents = has(s, 'home.parents');
  const prices = s.economy.priceIndex;
  const partner = livesWithPartner(s);
  if (has(s, 'work.parental-leave') && counter(s, 'leave.left') > 0) {
    // Parental allowance replaces the pay during the leave (computed from the last net pay at start prices).
    const lastNet = Math.round(counter(s, 'work.last-net') / prices);
    items.push({ category: 'parental-allowance', cents: Math.round(profile.parentalAllowance(lastNet) * prices) });
  } else if (has(s, 'work.employed')) {
    const gross = Math.round(profile.grossPay(qualificationOf(s), age, s.sex, has(s, 'work.part-time')) * s.economy.wageIndex * (1 + counter(s, 'work.raise-permille') / 1000));
    // Tax schedules and benefit levels move with prices (no bracket creep in the model): taxes are
    // computed at start prices and scaled back.
    items.push({ category: 'salary', cents: Math.round(profile.netPay(Math.round(gross / prices)) * prices) });
  } else if (has(s, 'work.unemployed') && counter(s, 'ui.left') > 0) {
    items.push({ category: 'unemployment-insurance', cents: Math.round(counter(s, 'work.last-net') * profile.unemploymentInsurance.replacement) });
  } else if (has(s, 'work.training') || has(s, 'work.study')) {
    const support = profile.educationSupport(has(s, 'parents.low-income'));
    items.push({ category: support.category, cents: Math.round(support.cents * prices) });
  } else if (has(s, 'work.home-parent') && partner) {
    // Caring for the children at home while the partner earns: no own income, no benefit.
  } else if (age >= 18 && !has(s, 'work.retired')) {
    items.push({ category: 'basic-support', cents: Math.round(profile.basicSupport(atParents) * prices) });
  }
  const kids = childAges(s);
  if (kids.length > 0) {
    if (has(s, 'children.with-other')) {
      for (const a of kids) items.push({ category: 'child-support', cents: -Math.round(profile.childSupport(a) * prices) });
    } else {
      const share = partner || has(s, 'children.shared') ? 0.5 : 1;
      items.push({ category: 'child-benefit', cents: Math.round(kids.length * profile.childBenefit() * share * prices) });
      const cost = kids.reduce((sum, a) => sum + profile.childCost(a), 0);
      items.push({ category: 'children', cents: -Math.round(cost * share * prices) });
    }
  }
  // Living with the parents without own income: the parents carry the costs.
  if (atParents && items.length === 0) return items;
  const living: Living = atParents ? 'parents' : (LIFESTYLES[Math.max(0, Math.min(2, counter(s, 'lifestyle')))] as Living);
  const share = partner && !atParents ? profile.coupleLivingShare : 1;
  items.push({ category: 'living', cents: -Math.round(profile.livingCost(living) * share * prices) });
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
        const dead = { ...s, alive: false, flags: [...new Set([...s.flags, 'died.natural'])].sort() };
        return { ...dead, years: recordYear(dead, 0) };
      }
    }
    const items = budget(s, profile);
    let ledger = s.ledger;
    for (const item of items) if (item.cents !== 0) ledger = book(ledger, 'cash', item.cents, item.category);
    const counters = { ...s.counters };
    const salary = items.find((i) => i.category === 'salary');
    if (salary !== undefined) counters['work.last-net'] = salary.cents;
    if (has(s, 'work.unemployed') && counter(s, 'ui.left') > 0) counters['ui.left'] = counter(s, 'ui.left') - 1;
    if (has(s, 'work.parental-leave') && counter(s, 'leave.left') > 0) counters['leave.left'] = counter(s, 'leave.left') - 1;
    const next = { ...s, ledger, counters };
    if (age >= OWN_FINANCES_AGE && isBirthday(s.month)) {
      return { ...next, years: recordYear(next, items.reduce((a, i) => a + Math.max(0, i.cents), 0)) };
    }
    return next;
  };
}

/** Appends this year's record (bounded). */
function recordYear(s: LifeState, income: number): YearRecord[] {
  const record: YearRecord = {
    age: ageInYears(s.month),
    cash: balanceOf(s.ledger, 'cash'),
    prices: s.economy.priceIndex,
    income,
    stats: STATS.map((id) => s.stats[id])
  };
  return [...(s.years ?? []), record].slice(-YEARS_LIMIT);
}

function isYearRecord(v: unknown): v is YearRecord {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return Number.isInteger(r.age) && (r.age as number) >= 0 && (r.age as number) <= 150
    && Number.isSafeInteger(r.cash) && Number.isSafeInteger(r.income)
    && typeof r.prices === 'number' && Number.isFinite(r.prices) && r.prices > 0
    && Array.isArray(r.stats) && r.stats.length === STATS.length
    && r.stats.every((x) => Number.isInteger(x) && (x as number) >= 0 && (x as number) <= 1000);
}

export function isLifeState(value: unknown): value is LifeState {
  if (!isLifeCore(value)) return false;
  const s = value as unknown as Record<string, unknown>;
  return Number.isSafeInteger(s.seed) && typeof s.householdId === 'string' && /^[a-z0-9-]{1,40}$/.test(s.householdId) && isEconomy(s.economy)
    && (s.years === undefined || (Array.isArray(s.years) && s.years.length <= YEARS_LIMIT && s.years.every(isYearRecord)));
}
