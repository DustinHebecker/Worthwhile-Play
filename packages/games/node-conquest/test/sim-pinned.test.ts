import { describe, expect, it } from 'vitest';
import { controllerFor, PROFILES } from '../src/ai';
import { INTRO_MAP } from '../src/maps';
import { createGame, mapOf, stepMut, type Controller, type Difficulty, type OpponentCount } from '../src/rules';
import { humanProxy } from './harness';

/** FNV-1a (32 bit) of a string. */
function fnv(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

type Case = readonly [seed: number, map: number, player: Difficulty | 'human', opponent: Difficulty, opponents: OpponentCount, ticks: number];

/** Full simulated matches on maps without crossing lanes (0–6 and the introduction). */
const CASES: readonly Case[] = [
  [11, 0, 'advanced', 'advanced', 1, 2500],
  [12, 1, 'human', 'strong', 1, 2500],
  [13, 2, 'beginner', 'advanced', 2, 2000],
  [14, 3, 'human', 'advanced', 3, 2000],
  [15, 4, 'advanced', 'beginner', 1, 2500],
  [16, 5, 'human', 'master', 1, 1200],
  [17, 6, 'advanced', 'advanced', 2, 2000],
  [18, INTRO_MAP, 'human', 'beginner', 1, 2500]
];

/** Fingerprint of a whole match: final state, every capture and shot, and the last tick. */
function pinnedRun([seed, map, player, opponent, opponents, ticks]: Case): string {
  const s = createGame(seed, { map, difficulty: opponent, opponents });
  const m = mapOf(s);
  const bots = controllerFor([player === 'human' ? null : PROFILES[player], ...Array.from({ length: m.factions - 1 }, () => PROFILES[opponent])]);
  const human = player === 'human' ? humanProxy() : null;
  const control: Controller = (x, mm) => {
    human?.(x, mm);
    bots(x, mm);
  };
  const events: string[] = [];
  for (let i = 0; i < ticks && s.result === 'playing'; i++) {
    const e = stepMut(s, m, control);
    if (e.captures.length > 0 || e.shots.length > 0) events.push(`${s.tick}:${JSON.stringify(e)}`);
  }
  return `${fnv(JSON.stringify(s))}/${fnv(events.join('|'))}/${s.tick}`;
}

/** Recorded before crossing combat existed: maps without crossings must not change at all. */
const PINNED: readonly string[] = [
  'c3b6188c/98442a10/2424',
  '451c795c/bc814a51/1008',
  '02e13b79/e1499277/2000',
  'dd326c34/9c1b1607/1239',
  'd2f3344a/d7e704f7/2500',
  'fbe5dc21/37ff8ed1/1200',
  '26982c91/872a7823/1601',
  '0a8e6ece/d01169bf/745'
];

describe('maps without crossings simulate exactly as before crossing combat', () => {
  it('full matches on maps 0–6 and the introduction end in byte-identical states and events', () => {
    expect(CASES.map(pinnedRun)).toEqual(PINNED);
  }, 120_000);
});
