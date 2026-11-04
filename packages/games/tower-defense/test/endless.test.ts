import { describe, expect, it } from 'vitest';
import { ENEMIES } from '@wp/td-core';
import { MAPS, TRAINING } from '../src/maps';
import {
  applyCommand,
  ENDLESS_PERCENT,
  ENDLESS_WAVES,
  endGame,
  incomeAfter,
  isValidState,
  MAX_CREDITS,
  MAX_GROUP,
  MAX_WAVE_TICKS,
  migrateState,
  newGame,
  resolveWave,
  retryWave,
  startWave,
  stepWave,
  waveCount,
  waveDef,
  waveSchedule,
  wavesHeld,
  wearAfter,
  WEAR_FROM,
  type TdState
} from '../src/rules';
import game from '../src/index';

/** Endless (owner 2026-11-04; design § 15.11). */
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const units = (s: TdState, wave: number) => waveSchedule(s, wave).length;
const threat = (s: TdState, wave: number) => waveSchedule(s, wave).reduce((n, p) => n + ENEMIES[p.kind].threat, 0);
/** An endless game at the build of wave `wave` with a large core (to look at what a wave does without losing). */
const at = (wave: number, core = 1000, mapId = TRAINING.id): TdState => {
  const s = newGame(5, 'standard', mapId, 'endless');
  return { ...s, wave, core, log: Array.from({ length: wave + 1 }, () => []) };
};

describe('endless: the game', () => {
  it('is an option; without it a game is the one of the map’s waves, as before', () => {
    expect(newGame(5, 'standard', TRAINING.id)).toEqual(newGame(5, 'standard', TRAINING.id, 'waves'));
    expect(newGame(5, 'standard', TRAINING.id)).not.toHaveProperty('length');
    const e = newGame(5, 'standard', TRAINING.id, 'endless');
    expect(e.length).toBe('endless');
    expect(waveCount(e)).toBe(ENDLESS_WAVES);
    expect(waveCount(newGame(5))).toBe(TRAINING.waves.length);
    // The map's own waves are the same in both.
    for (let w = 0; w < TRAINING.waves.length; w++) expect(waveSchedule(e, w)).toEqual(waveSchedule(newGame(5), w));
  });

  it('settings: chosen on the start screen and read back from a save', () => {
    const specs = Array.isArray(game.settings) ? game.settings : [];
    expect(specs.some((x) => x.kind === 'choice' && x.id === 'length')).toBe(true);
    expect(game.settingsOf?.(newGame(5, 'standard', 'fork', 'endless'))).toEqual({ map: 'fork', length: 'endless', difficulty: 'standard' });
    expect(game.settingsOf?.(newGame(5, 'hard', 'fork'))).toEqual({ map: 'fork', length: 'waves', difficulty: 'hard' });
  });

  it('after the map’s last wave the game goes on (never won), with income past the table', () => {
    for (const map of MAPS) {
      const last = map.waves.length - 1;
      const done = resolveWave(startWave(at(last, 1000, map.id))).state;
      expect(done.phase, map.id).toBe('build');
      expect(done.wave).toBe(last + 1);
      expect(isValidState(done)).toBe(true);
      const income = map.income;
      expect(incomeAfter(done, income.length)).toBe(incomeAfter(done, income.length - 1) + 5);
      expect(incomeAfter(done, income.length + 3)).toBe(incomeAfter(done, income.length - 1) + 20);
    }
  });
});

describe('endless: generated waves', () => {
  it('repeat the last four authored waves, larger every time, one more Siege crawler every third wave', () => {
    for (const map of MAPS) {
      const s = at(0, 1000, map.id);
      const n = map.waves.length;
      for (let k = n; k < ENDLESS_WAVES; k++) {
        const extra = k - n + 1;
        const def = waveDef(s, k)!;
        const slot = n - 1 - ((k - n) % 4);
        const base = map.waves[slot]![s.variants[slot]!]!;
        // Every authored group comes back, as large as the growth says (at most MAX_GROUP).
        for (const [i, grp] of base.groups.entries()) {
          const want = grp.kind === 'crawler' ? grp.count + Math.floor(extra / 3) : Math.ceil((grp.count * (100 + extra * ENDLESS_PERCENT)) / 100);
          expect(def.groups[i]!.count, `${map.id} wave ${k + 1}`).toBe(want);
        }
        expect(def.groups.filter((g) => g.kind === 'crawler').reduce((m, g) => m + g.count, 0)).toBeGreaterThanOrEqual(Math.floor(extra / 3));
        // Four waves later the same authored wave comes back with more units and threat.
        if (k + 4 < ENDLESS_WAVES) {
          expect(units(s, k + 4), `${map.id} wave ${k + 5}`).toBeGreaterThanOrEqual(units(s, k));
          expect(threat(s, k + 4), `${map.id} wave ${k + 5}`).toBeGreaterThan(threat(s, k));
        }
      }
      expect(waveDef(s, ENDLESS_WAVES + 5)).toBeDefined();
    }
  });

  it('a Siege crawler comes along from the third generated wave even where the repeated wave has none', () => {
    const s = at(0);
    const n = TRAINING.waves.length;
    expect(waveSchedule(s, n + 2).filter((p) => p.kind === 'crawler').length).toBeGreaterThanOrEqual(1);
  });
});

describe('endless: the wear-down', () => {
  it('costs 1, 2, 3, … from wave 51 on, and nothing in a game of the map’s waves', () => {
    const e = at(0);
    expect(wearAfter(e, WEAR_FROM - 1)).toBe(0);
    expect([0, 1, 2, 9].map((i) => wearAfter(e, WEAR_FROM + i))).toEqual([1, 2, 3, 10]);
    expect(wearAfter(newGame(5), WEAR_FROM + 3)).toBe(0);
    // Whatever the core (at most 30), it is gone before the last possible wave.
    let core = 30;
    let wave = WEAR_FROM;
    while (core > 0) core -= wearAfter(e, wave++);
    expect(wave).toBeLessThanOrEqual(ENDLESS_WAVES);
  });

  it('a core it empties ends the game for good: ended, worn down, nothing to retry; the end is a valid save', () => {
    const s = at(WEAR_FROM + 2, 3);
    // Make the wave itself harmless: no units (a wave of nothing), so only the wear-down acts.
    const t = startWave(s);
    t.run!.pending = [];
    const done = resolveWave(t).state;
    expect(done.phase).toBe('ended');
    expect(done.worn).toBe(true);
    expect(done.core).toBe(0);
    expect(wavesHeld(done)).toBe(WEAR_FROM + 3);
    expect(retryWave(done)).toBe(done);
    expect(isValidState(clone(done))).toBe(true);
  });

  it('a core it does not empty: the wear is taken and the game goes on', () => {
    const s = at(WEAR_FROM, 20);
    const t = startWave(s);
    t.run!.pending = [];
    const done = resolveWave(t).state;
    expect(done.phase).toBe('build');
    expect(done.core).toBe(19);
  });

  it('a core that falls in battle: lost, retry or end as ever; waves held count the ones before', () => {
    const s = at(30, 1);
    const lost = resolveWave(startWave(s)).state;
    expect(lost.phase).toBe('lost');
    expect(wavesHeld(lost)).toBe(30);
    const ended = endGame(lost);
    expect(ended.phase).toBe('ended');
    expect(ended.worn).toBeUndefined();
    expect(isValidState(clone(ended))).toBe(true);
    expect(retryWave(lost).phase).toBe('build');
  });
});

describe('endless: saves', () => {
  it('rejects what cannot happen', () => {
    const e = at(12);
    expect(isValidState(clone(e))).toBe(true);
    const bad: ((s: TdState) => void)[] = [
      (s) => ((s as { length: unknown }).length = 'forever'),
      (s) => (s.wave = ENDLESS_WAVES),
      (s) => (s.log = Array.from({ length: ENDLESS_WAVES + 1 }, () => [])),
      (s) => (s.phase = 'won'),
      (s) => (s.worn = true),
      (s) => ((s as { worn: unknown }).worn = false),
      (s) => (s.credits = 1_000_001)
    ];
    for (const [i, f] of bad.entries()) {
      const t = clone(e);
      f(t);
      expect(isValidState(t), `case ${i}`).toBe(false);
    }
    // Not endless: no wave past the map's, never worn.
    const w = newGame(5);
    expect(isValidState({ ...clone(w), wave: TRAINING.waves.length, log: Array.from({ length: TRAINING.waves.length + 1 }, () => []) })).toBe(false);
    expect(isValidState({ ...clone(w), phase: 'ended', worn: true })).toBe(false);
    // A checkpoint of the other length.
    const started = startWave(at(3));
    expect(isValidState(clone(started))).toBe(true);
    const mixed = clone(started);
    delete (mixed.checkpoint as { length?: unknown }).length;
    expect(isValidState(mixed)).toBe(false);
  });

  it('state version 2 saves load as they are (games of the map’s waves); one claiming endless does not', () => {
    const v2 = resolveWave(startWave(newGame(5, 'standard', 'fork'))).state;
    expect(migrateState(clone(v2), 2)).toEqual(v2);
    expect(migrateState({ ...clone(v2), length: 'endless' }, 2)).toBeUndefined();
    expect(migrateState({ junk: 1 }, 2)).toBeUndefined();
  });
});

describe('endless: review of PR #114', () => {
  it('the end of an endless game has its own neutral result text in every language (not "Solved.")', async () => {
    const { messages } = await import('../src/messages');
    for (const [locale, table] of Object.entries(messages)) expect((table as Record<string, string>)['result.completed'], locale).toBeTruthy();
    expect((messages.en as Record<string, string>)['result.completed']).not.toMatch(/solved/i);
  });

  it('a wave that reaches the bound with shells in flight ends exactly there: resolved, a valid save, time up', () => {
    // A Fork game with an artillery piece firing at the first units.
    let s = newGame(5, 'standard', 'fork', 'endless');
    s = applyCommand(s, { t: 'place', kind: 'artillery', x: 2, y: 3 });
    let t = startWave({ ...s, core: 1000 });
    while (t.phase === 'wave' && t.world.projectiles.length === 0) t = stepWave(t, 1).state;
    expect(t.world.projectiles.length).toBeGreaterThan(0);
    const late = clone(t);
    late.run!.tick = MAX_WAVE_TICKS - 1;
    expect(isValidState(clone(late))).toBe(true);
    const step = stepWave(late, 1);
    expect(step.timeUp).toBe(true);
    expect(step.state.phase).not.toBe('wave');
    expect(step.state.world.projectiles).toEqual([]);
    expect(isValidState(clone(step.state))).toBe(true);
    // Before the bound nothing is cut short.
    expect(stepWave(t, 1).timeUp).toBe(false);
  });

  it('the last possible wave ends the game even with core left (a crafted save; the wear-down gets there first in play)', () => {
    const t = startWave(at(ENDLESS_WAVES - 1, 1000));
    t.run!.pending = [];
    const done = resolveWave(t).state;
    expect(done.phase).toBe('ended');
    expect(done.worn).toBe(true);
    expect(done.core).toBeGreaterThan(0);
    expect(wavesHeld(done)).toBe(ENDLESS_WAVES);
    expect(isValidState(clone(done))).toBe(true);
  });

  it('credits stop at the cap: bounties during the wave and income after it', () => {
    const rich = { ...at(2), credits: MAX_CREDITS - 1 };
    const t = startWave(applyCommand(rich, { t: 'place', kind: 'gun', x: 2, y: 2 }));
    const done = resolveWave(t).state;
    expect(done.stats.killed).toBeGreaterThan(0);
    expect(done.credits).toBe(MAX_CREDITS);
    expect(isValidState(clone(done))).toBe(true);
  });

  it('generated waves, pinned: Training wave 9 repeats wave 8 with 15 % more units; Hard sends at most MAX_GROUP per group', () => {
    const s = at(0);
    const n = TRAINING.waves.length;
    const base = TRAINING.waves[n - 1]![s.variants[n - 1]!]!;
    const def = waveDef(s, n)!;
    expect(def.groups.map((g) => g.count)).toEqual(base.groups.map((g) => (g.kind === 'crawler' ? g.count : Math.ceil((g.count * 115) / 100))));
    // Long into an endless game on Hard: groups that would be larger send MAX_GROUP (after the difficulty, not before).
    const hard = newGame(5, 'hard', 'fork', 'endless');
    const big = waveDef(hard, 55)!.groups.filter((g) => g.kind !== 'crawler' && Math.ceil((g.count * 120) / 100) > MAX_GROUP);
    expect(big.length).toBeGreaterThan(0);
    const schedule = waveSchedule(hard, 55);
    const want = waveDef(hard, 55)!.groups.reduce((n, g) => n + Math.min(MAX_GROUP, Math.max(1, Math.ceil((g.count * 120) / 100))), 0);
    expect(schedule.length).toBe(want);
    // The map's own waves are never capped.
    const own = waveDef(hard, 19)!.groups;
    expect(waveSchedule(hard, 19).length).toBe(own.reduce((n, g) => n + Math.max(1, Math.ceil((g.count * 120) / 100)), 0));
  });
});
