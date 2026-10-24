import type { Calendar, Month } from './time';
import { isCalendar } from './time';
import type { Ledger } from './ledger';
import { isLedger } from './ledger';

/**
 * Core state of one life (grows with each engine increment). Plain JSON; integer values only.
 * Stats are per mille (0–1000) so they stay exact and comparable across saves.
 */
export const STATS = ['health', 'mental', 'energy', 'satisfaction', 'relationships', 'meaning', 'security', 'freedom'] as const;
export type StatId = (typeof STATS)[number];
export const STAT_MAX = 1000;

export type Sex = 'female' | 'male';

export interface PendingEvent {
  eventId: string;
  /** Month the event was drawn or scheduled for. */
  month: Month;
}

export interface Scheduled {
  eventId: string;
  month: Month;
}

export interface LifeCore {
  month: Month;
  calendar: Calendar;
  sex: Sex;
  profileId: string;
  alive: boolean;
  stats: Record<StatId, number>;
  /** Sorted, unique. */
  flags: string[];
  /** Small integer counters (e.g. children, job changes); key → value. */
  counters: Record<string, number>;
  ledger: Ledger;
  /** Events waiting for the player's choice, oldest first. */
  pending: PendingEvent[];
  /** Events scheduled by earlier choices, sorted by month then id. */
  scheduled: Scheduled[];
  /** Event id → month it last happened (for `once` and cooldowns). */
  lastSeen: Record<string, Month>;
}

const FLAG = /^[a-z][a-z0-9-]*(?:\.[a-z0-9-]+)*$/;
export const isFlagId = (v: unknown): v is string => typeof v === 'string' && v.length <= 60 && FLAG.test(v);

const isMonth = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 150 * 12;
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export function clampStat(v: number): number {
  return Math.max(0, Math.min(STAT_MAX, Math.round(v)));
}

/** Validates untrusted data (saves). Never throws. */
export function isLifeCore(value: unknown): value is LifeCore {
  try {
    if (!isRecord(value)) return false;
    const s = value;
    if (!isMonth(s.month) || !isCalendar(s.calendar) || (s.sex !== 'female' && s.sex !== 'male')) return false;
    if (typeof s.profileId !== 'string' || !FLAG.test(s.profileId) || typeof s.alive !== 'boolean') return false;
    if (!isRecord(s.stats) || Object.keys(s.stats).length !== STATS.length) return false;
    for (const id of STATS) {
      const v = s.stats[id];
      if (!Number.isInteger(v) || (v as number) < 0 || (v as number) > STAT_MAX) return false;
    }
    if (!Array.isArray(s.flags) || !s.flags.every(isFlagId)) return false;
    for (let i = 1; i < s.flags.length; i++) if (!((s.flags[i - 1] as string) < (s.flags[i] as string))) return false;
    if (!isRecord(s.counters)) return false;
    for (const [k, v] of Object.entries(s.counters)) if (!isFlagId(k) || !Number.isSafeInteger(v)) return false;
    if (!isLedger(s.ledger)) return false;
    const isEntry = (e: unknown): boolean => isRecord(e) && isFlagId(e.eventId) && isMonth(e.month);
    if (!Array.isArray(s.pending) || s.pending.length > 64 || !s.pending.every(isEntry)) return false;
    if (!Array.isArray(s.scheduled) || s.scheduled.length > 256 || !s.scheduled.every(isEntry)) return false;
    if (!isRecord(s.lastSeen)) return false;
    for (const [k, v] of Object.entries(s.lastSeen)) if (!isFlagId(k) || !isMonth(v)) return false;
    return true;
  } catch {
    return false;
  }
}
