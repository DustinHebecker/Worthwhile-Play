import { describe, expect, it } from 'vitest';
import type { AiProfile, PROFILES } from '../src/ai';
import { playMatch, quantile, STALL_TICKS, type MatchResult, type Side } from './harness';

/*
 * Standoff measurements with the headless harness (seeded, deterministic): bot matches and a
 * human-like proxy player. Split from stalemate.test.ts as a *.slow.test.ts file: whole simulated
 * matches take seconds each, so mutation testing leaves them out (ADR 0021); `pnpm test` and CI run them.
 */

/* ---------- Measurements (seeded, deterministic) ---------- */

/** One match per map and seed offset; `per` matches per map. */
function series(player: Side, opponent: keyof typeof PROFILES, per: number, cap = 9000, override?: Partial<AiProfile>): MatchResult[] {
  const results: MatchResult[] = [];
  for (let i = 0; i < 7 * per; i++) results.push(playMatch(i * 101 + 108, player, opponent, cap, i % 7, override));
  return results;
}
const stalls = (rs: MatchResult[]) => rs.filter((r) => r.stalled).length;
const wins = (rs: MatchResult[], side: number) => rs.filter((r) => r.winner === side).length;

describe('standoffs: measured with a human-like proxy player and bot matches', () => {
  it('human-like play against advanced and strong opponents ends without long standoffs', () => {
    const advanced = series('human', 'advanced', 2);
    const strong = series('human', 'strong', 2);
    expect(STALL_TICKS).toBe(3000);
    expect(stalls(advanced) + stalls(strong)).toBeLessThanOrEqual(2);
    const lengths = [...advanced, ...strong].map((r) => r.ticks);
    expect(quantile(lengths, 0.5)).toBeLessThan(3000);
    // The proxy wins some and loses some: neither level is a pushover or a wall.
    expect(wins(advanced, 0)).toBeGreaterThanOrEqual(3);
    expect(wins(strong, 1)).toBeGreaterThanOrEqual(3);
  }, 60_000);

  it('concentrating opponents stall less than the same opponents without focus', () => {
    // 28 matches each against the strong level (measured: 0 standoffs with focus, 4 without).
    const withFocus = series('human', 'strong', 4);
    const without = series('human', 'strong', 4, 9000, { focus: 0 });
    expect(stalls(withFocus)).toBeLessThanOrEqual(1);
    expect(stalls(without)).toBeGreaterThanOrEqual(3);
  }, 60_000);

  it('stronger levels still beat weaker ones', () => {
    const ab = series('advanced', 'beginner', 2);
    expect(wins(ab, 0)).toBeGreaterThanOrEqual(wins(ab, 1) + 6);
    const ms = series('master', 'strong', 1);
    expect(wins(ms, 0)).toBeGreaterThan(wins(ms, 1));
  }, 60_000);
});
