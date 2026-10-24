import { createRng } from '@wp/game-core';
import { STATS, openLedger, type LifeCore, type RngFor } from '../src';

export function life(over: Partial<LifeCore> = {}): LifeCore {
  return {
    month: 216,
    calendar: { birthYear: 2008, birthMonth: 3 },
    sex: 'female',
    profileId: 'de',
    alive: true,
    stats: Object.fromEntries(STATS.map((s) => [s, 500])) as LifeCore['stats'],
    flags: [],
    counters: {},
    ledger: openLedger({ cash: 1_000_00 }),
    pending: [],
    scheduled: [],
    lastSeen: {},
    ...over
  };
}

/** Test stand-in for keyed draws: an independent seeded Rng per (month, stream). */
export function testRngFor(seed: number): RngFor {
  return (month, stream) => {
    let h = seed >>> 0;
    for (const ch of `${month}|${stream}`) h = Math.imul(h ^ ch.charCodeAt(0), 0x9e3779b1) >>> 0;
    return createRng(h);
  };
}
