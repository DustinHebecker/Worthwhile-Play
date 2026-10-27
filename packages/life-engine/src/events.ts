import type { Rng } from '@wp/game-core';
import type { LifeCore, Scheduled, Sex, StatId } from './state';
import { STATS, clampStat, isFlagId } from './state';
import { ageInYears } from './time';
import { balanceOf, book, isAccountId, transfer } from './ledger';

/**
 * Declarative life events (design § 5.14): data with conditions, a monthly chance and choices with
 * effects. The engine draws, the player chooses; nothing here depends on timers.
 */
export type Cond =
  | { all: Cond[] }
  | { any: Cond[] }
  | { not: Cond }
  | { age: { min?: number; max?: number } }
  | { flag: string }
  | { stat: StatId; min?: number; max?: number }
  | { sex: Sex }
  | { profile: string }
  | { balance: string; min?: number; max?: number }
  | { counter: string; min?: number; max?: number }
  /** Months since the month stored in a counter (false while the counter is unset). */
  | { since: string; min?: number; max?: number };

export type Effect =
  | { stat: StatId; add: number }
  | { set: string }
  | { clear: string }
  | { count: string; add: number }
  | { book: { account: string; cents: number; category: string } }
  | { transfer: { from: string; to: string; cents: number } }
  | { setCount: string; value: number }
  /** Stores the current month in a counter (for `since` conditions). */
  | { mark: string }
  /** A child is born: `children` + 1 and `child.<n>.born` = this month (n = 1, 2, …). */
  | { birth: true }
  | { schedule: string; inMonths: number }
  /** A chance outcome: the first entry whose condition holds gives the probability (ppm). */
  | { roll: { when?: Cond; ppm: number }[]; win: Effect[]; lose: Effect[] }
  | { die: true };

export interface Choice {
  id: string;
  when?: Cond;
  effects: Effect[];
}

export interface EventDef {
  id: string;
  /** Message id for texts shared by variants of one event (default: `id`). */
  textId?: string;
  /** Chance per month in parts per million, an integer (annual values are converted when authored). */
  chancePpm: number;
  when?: Cond;
  /** At most once per life. */
  once?: boolean;
  /** Months after it happened before it can happen again. */
  cooldownMonths?: number;
  /** Ids of the parameters that justify the chance and effects (sources). */
  params?: string[];
  choices: Choice[];
}

export const PPM = 1_000_000;

function inRange(v: number, min?: number, max?: number): boolean {
  return (min === undefined || v >= min) && (max === undefined || v <= max);
}

/** Evaluates a condition. Unknown shapes are false; never throws. */
export function holds(state: LifeCore, cond: Cond | undefined): boolean {
  if (cond === undefined) return true;
  try {
    if ('all' in cond) return cond.all.every((c) => holds(state, c));
    if ('any' in cond) return cond.any.some((c) => holds(state, c));
    if ('not' in cond) return !holds(state, cond.not);
    if ('age' in cond) return inRange(ageInYears(state.month), cond.age.min, cond.age.max);
    if ('flag' in cond) return state.flags.includes(cond.flag);
    if ('stat' in cond) return inRange(state.stats[cond.stat], cond.min, cond.max);
    if ('sex' in cond) return state.sex === cond.sex;
    if ('profile' in cond) return state.profileId === cond.profile;
    if ('balance' in cond) return inRange(balanceOf(state.ledger, cond.balance), cond.min, cond.max);
    if ('counter' in cond) return inRange(Object.hasOwn(state.counters, cond.counter) ? (state.counters[cond.counter] as number) : 0, cond.min, cond.max);
    if ('since' in cond) return Object.hasOwn(state.counters, cond.since) && inRange(state.month - (state.counters[cond.since] as number), cond.min, cond.max);
  } catch {
    return false;
  }
  return false;
}

/** Events that may be drawn in the current month. */
export function eligible(defs: readonly EventDef[], state: LifeCore): EventDef[] {
  return defs.filter((d) => {
    if (!state.alive || d.chancePpm <= 0) return false;
    const last = Object.hasOwn(state.lastSeen, d.id) ? state.lastSeen[d.id] : undefined;
    if (last !== undefined && (d.once === true || state.month - last < (d.cooldownMonths ?? 0))) return false;
    return holds(state, d.when);
  });
}

/**
 * Draws this month's events: due scheduled events first, then each eligible event once with its
 * chance. Exactly one uniform per eligible event in definition order, so a run is reproducible.
 */
export function drawEvents<S extends LifeCore>(defs: readonly EventDef[], state: S, rng: Rng): S {
  const due = state.scheduled.filter((s) => s.month <= state.month);
  const later = state.scheduled.filter((s) => s.month > state.month);
  const byId = new Map(defs.map((d) => [d.id, d]));
  const drawn: string[] = [];
  for (const s of due) if (byId.has(s.eventId) && holds(state, byId.get(s.eventId)?.when)) drawn.push(s.eventId);
  for (const d of eligible(defs, state)) {
    const u = rng.next();
    if (u * PPM < d.chancePpm && !drawn.includes(d.id)) drawn.push(d.id);
  }
  if (drawn.length === 0 && due.length === 0) return state;
  const lastSeen = { ...state.lastSeen };
  for (const id of drawn) lastSeen[id] = state.month;
  return {
    ...state,
    scheduled: later,
    lastSeen,
    pending: [...state.pending, ...drawn.map((eventId) => ({ eventId, month: state.month }))]
  };
}

export type ChoiceRefusal = 'not-pending' | 'unknown-event' | 'unknown-choice' | 'not-available';

/** The choices of a pending event that the player can take now. */
export function availableChoices(defs: readonly EventDef[], state: LifeCore, eventId: string): Choice[] {
  const def = defs.find((d) => d.id === eventId);
  if (def === undefined) return [];
  return def.choices.filter((c) => holds(state, c.when));
}

function applyEffect<S extends LifeCore>(state: S, e: Effect, rng: Rng): S {
  if ('roll' in e) {
    const ppm = e.roll.find((r) => holds(state, r.when))?.ppm ?? 0;
    const branch = rng.next() * PPM < ppm ? e.win : e.lose;
    let next = state;
    for (const inner of branch) next = applyEffect(next, inner, rng);
    return next;
  }
  if ('setCount' in e) return { ...state, counters: { ...state.counters, [e.setCount]: e.value } };
  if ('mark' in e) return { ...state, counters: { ...state.counters, [e.mark]: state.month } };
  if ('birth' in e) {
    const n = (Object.hasOwn(state.counters, 'children') ? (state.counters.children as number) : 0) + 1;
    return { ...state, counters: { ...state.counters, children: n, [`child.${n}.born`]: state.month } };
  }
  if ('stat' in e) return { ...state, stats: { ...state.stats, [e.stat]: clampStat(state.stats[e.stat] + e.add) } };
  if ('set' in e) return state.flags.includes(e.set) ? state : { ...state, flags: [...state.flags, e.set].sort() };
  if ('clear' in e) return { ...state, flags: state.flags.filter((f) => f !== e.clear) };
  if ('count' in e) {
    const now = Object.hasOwn(state.counters, e.count) ? (state.counters[e.count] as number) : 0;
    return { ...state, counters: { ...state.counters, [e.count]: now + e.add } };
  }
  if ('book' in e) return { ...state, ledger: book(state.ledger, e.book.account, e.book.cents, e.book.category) };
  if ('transfer' in e) return { ...state, ledger: transfer(state.ledger, e.transfer.from, e.transfer.to, e.transfer.cents) };
  if ('schedule' in e) {
    const entry: Scheduled = { eventId: e.schedule, month: state.month + e.inMonths };
    const scheduled = [...state.scheduled, entry].sort((a, b) => a.month - b.month || (a.eventId < b.eventId ? -1 : a.eventId > b.eventId ? 1 : 0));
    return { ...state, scheduled };
  }
  return { ...state, alive: false };
}

/**
 * Resolves the oldest pending event with a choice. Never throws; refusals leave the state unchanged.
 * `rng` decides chance outcomes (`roll`); callers pass the stream of this month and event.
 */
export function choose<S extends LifeCore>(defs: readonly EventDef[], state: S, eventId: string, choiceId: string, rng: Rng):
  { ok: true; state: S } | { ok: false; reason: ChoiceRefusal } {
  const head = state.pending[0];
  if (head === undefined || head.eventId !== eventId) return { ok: false, reason: 'not-pending' };
  const def = defs.find((d) => d.id === eventId);
  if (def === undefined) return { ok: false, reason: 'unknown-event' };
  const choice = def.choices.find((c) => c.id === choiceId);
  if (choice === undefined) return { ok: false, reason: 'unknown-choice' };
  if (!holds(state, choice.when)) return { ok: false, reason: 'not-available' };
  let next: S = { ...state, pending: state.pending.slice(1) };
  for (const e of choice.effects) next = applyEffect(next, e, rng);
  return { ok: true, state: next };
}

export type EventIssue = { id: string; problem: string };

function flatEffects(effects: readonly Effect[]): Effect[] {
  return effects.flatMap((e) => ('roll' in e ? [e, ...flatEffects(e.win), ...flatEffects(e.lose)] : [e]));
}

function hasRoll(effects: readonly Effect[]): boolean {
  return flatEffects(effects).some((e) => 'roll' in e);
}

function checkCond(c: unknown, path: string, issues: EventIssue[], id: string): void {
  if (typeof c !== 'object' || c === null) { issues.push({ id, problem: `${path}: not a condition` }); return; }
  const o = c as Record<string, unknown>;
  const keys = Object.keys(o);
  const kind = ['all', 'any', 'not', 'age', 'flag', 'stat', 'sex', 'profile', 'balance', 'counter', 'since'].find((k) => keys.includes(k));
  if (kind === undefined) { issues.push({ id, problem: `${path}: unknown condition` }); return; }
  if (kind === 'all' || kind === 'any') {
    if (!Array.isArray(o[kind]) || (o[kind] as unknown[]).length === 0) issues.push({ id, problem: `${path}.${kind}: empty` });
    else (o[kind] as unknown[]).forEach((x, i) => checkCond(x, `${path}.${kind}[${i}]`, issues, id));
  } else if (kind === 'not') checkCond(o.not, `${path}.not`, issues, id);
  else if (kind === 'stat' && !(STATS as readonly unknown[]).includes(o.stat)) issues.push({ id, problem: `${path}: unknown stat` });
  else if ((kind === 'flag' || kind === 'counter' || kind === 'since') && !isFlagId(o[kind])) issues.push({ id, problem: `${path}: bad id` });
  else if (kind === 'balance' && !isAccountId(o.balance)) issues.push({ id, problem: `${path}: bad account` });
}

/** Content checker for event definitions (test-time). Never throws. */
export function checkEvents(defs: readonly EventDef[], knownParams: ReadonlySet<string>): EventIssue[] {
  const issues: EventIssue[] = [];
  const ids = new Set<string>();
  try {
    for (const d of defs) {
      if (!isFlagId(d.id)) issues.push({ id: String(d.id), problem: 'bad id' });
      if (d.textId !== undefined && !isFlagId(d.textId)) issues.push({ id: String(d.id), problem: 'bad text id' });
      if (ids.has(d.id)) issues.push({ id: d.id, problem: 'duplicate id' });
      ids.add(d.id);
    }
    for (const d of defs) {
      if (!Number.isInteger(d.chancePpm) || d.chancePpm < 0 || d.chancePpm > PPM) issues.push({ id: d.id, problem: 'chance outside 0…1e6 ppm' });
      if (d.cooldownMonths !== undefined && (!Number.isInteger(d.cooldownMonths) || d.cooldownMonths < 0)) issues.push({ id: d.id, problem: 'bad cooldown' });
      if (d.when !== undefined) checkCond(d.when, 'when', issues, d.id);
      for (const p of d.params ?? []) if (!knownParams.has(p)) issues.push({ id: d.id, problem: `unknown parameter ${p}` });
      const random = (d.chancePpm > 0 && d.chancePpm < PPM) || d.choices.some((c) => hasRoll(c.effects));
      if (random && (d.params ?? []).length === 0) issues.push({ id: d.id, problem: 'random event without a source parameter' });
      if (!Array.isArray(d.choices) || d.choices.length === 0) { issues.push({ id: d.id, problem: 'no choices' }); continue; }
      const choiceIds = new Set<string>();
      let unconditional = false;
      for (const c of d.choices) {
        if (!isFlagId(c.id) || choiceIds.has(c.id)) issues.push({ id: d.id, problem: `bad or duplicate choice ${String(c.id)}` });
        choiceIds.add(c.id);
        if (c.when === undefined) unconditional = true;
        else checkCond(c.when, `choice ${c.id}`, issues, d.id);
        for (const e of flatEffects(c.effects)) {
          if ('roll' in e) {
            if (e.roll.length === 0 || e.roll.some((r) => !Number.isInteger(r.ppm) || r.ppm < 0 || r.ppm > PPM)) issues.push({ id: d.id, problem: 'bad roll' });
            for (const r of e.roll) if (r.when !== undefined) checkCond(r.when, `roll in ${c.id}`, issues, d.id);
          }
          if ('setCount' in e && (!isFlagId(e.setCount) || !Number.isSafeInteger(e.value))) issues.push({ id: d.id, problem: 'bad counter effect' });
          if ('mark' in e && !isFlagId(e.mark)) issues.push({ id: d.id, problem: 'bad counter effect' });
          if ('schedule' in e && (!ids.has(e.schedule) || !Number.isInteger(e.inMonths) || e.inMonths < 1)) issues.push({ id: d.id, problem: `bad schedule ${e.schedule}` });
          if ('stat' in e && (!(STATS as readonly string[]).includes(e.stat) || !Number.isInteger(e.add))) issues.push({ id: d.id, problem: 'bad stat effect' });
          if (('set' in e && !isFlagId(e.set)) || ('clear' in e && !isFlagId(e.clear))) issues.push({ id: d.id, problem: 'bad flag' });
          if ('count' in e && (!isFlagId(e.count) || !Number.isInteger(e.add))) issues.push({ id: d.id, problem: 'bad counter effect' });
          if ('book' in e && (!isAccountId(e.book.account) || !isAccountId(e.book.category) || !Number.isSafeInteger(e.book.cents))) issues.push({ id: d.id, problem: 'bad booking' });
          if ('transfer' in e && (!isAccountId(e.transfer.from) || !isAccountId(e.transfer.to) || !Number.isSafeInteger(e.transfer.cents))) issues.push({ id: d.id, problem: 'bad transfer' });
        }
      }
      // A pending event must always be resolvable: at least one choice without a condition.
      if (!unconditional) issues.push({ id: d.id, problem: 'no unconditional choice (could block the life)' });
    }
  } catch {
    issues.push({ id: '(input)', problem: 'unreadable definitions' });
  }
  return issues;
}
