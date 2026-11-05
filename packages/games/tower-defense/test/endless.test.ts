import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ENEMIES } from '@wp/td-core';
import { MAPS, TRAINING } from '../src/maps';
import {
  applyCommand,
  ENDLESS_PERCENT,
  ENDLESS_WAVES,
  endGame,
  HEAD_START_RAMP,
  incomeAfter,
  isValidState,
  MAX_CREDITS,
  MAX_CRAWLERS,
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
  /** The compound factor of generated wave `extra` (1-based) in per mille, as the rules compute it. */
  const factorOf = (extra: number) => {
    let f = 1000;
    for (let i = 0; i < extra; i++) f = Math.floor((f * (100 + ENDLESS_PERCENT)) / 100);
    return f;
  };

  it('repeat the last four authored waves, each ENDLESS_PERCENT larger than the one before (compound)', () => {
    expect(ENDLESS_PERCENT).toBe(6);
    expect([1, 2, 10].map(factorOf)).toEqual([1060, 1123, 1786]);
    // Only the Training ground starts its growth further on (its last waves are small).
    expect(MAPS.filter((m) => m.endlessHeadStart).map((m) => [m.id, m.endlessHeadStart])).toEqual([['training', 34]]);
    for (const map of MAPS) {
      const s = at(0, 1000, map.id);
      const n = map.waves.length;
      for (let k = n; k < ENDLESS_WAVES; k += 7) {
        const def = waveDef(s, k)!;
        const slot = n - 1 - ((k - n) % 4);
        const base = map.waves[slot]![s.variants[slot]!]!;
        const steps = k - n + 1 + Math.min(map.endlessHeadStart ?? 0, (k - n + 1) * HEAD_START_RAMP);
        expect(def.groups.map((g) => g.count), `${map.id} wave ${k + 1}`).toEqual(base.groups.map((g) => (g.kind === 'crawler' ? g.count : Math.ceil((g.count * factorOf(steps)) / 1000))));
        // Four waves later the same authored wave comes back larger, in units and in threat (until every
        // cap is reached, far beyond what a defence holds; then it stays at that size).
        if (k + 4 < 70) {
          expect(units(s, k + 4), `${map.id} wave ${k + 5}`).toBeGreaterThanOrEqual(units(s, k));
          expect(threat(s, k + 4), `${map.id} wave ${k + 5}`).toBeGreaterThan(threat(s, k));
        }
      }
    }
  });

  it('a head start is caught up over the first generated waves: no cliff after the map’s last wave (review of PR #115)', () => {
    expect(HEAD_START_RAMP).toBe(3);
    for (const map of MAPS) {
      const s = at(0, 1000, map.id);
      const n = map.waves.length;
      // The first generated wave is at most half again the last authored one, in units and in threat.
      expect(units(s, n), map.id).toBeLessThanOrEqual(Math.ceil(units(s, n - 1) * 1.5));
      expect(threat(s, n), map.id).toBeLessThanOrEqual(Math.ceil(threat(s, n - 1) * 1.5));
    }
    // From the wave the Training ground has caught up its head start on, it grows as any map.
    const caught = TRAINING.waves.length + Math.ceil(TRAINING.endlessHeadStart! / HEAD_START_RAMP) - 1;
    const def = (k: number) => waveDef(at(0), k)!.groups.filter((g) => g.kind !== 'crawler').map((g) => g.count);
    const base = TRAINING.waves.length - 1 - ((caught - TRAINING.waves.length) % 4);
    expect(def(caught)).toEqual(TRAINING.waves[base]![at(0).variants[base]!]!.groups.filter((g) => g.kind !== 'crawler').map((g) => Math.ceil((g.count * factorOf(caught - TRAINING.waves.length + 1 + TRAINING.endlessHeadStart!)) / 1000)));
  });

  it('what outgrows a group comes as Brutes of the same health on a ground road, what outgrows those as Siege crawlers; both bounded', () => {
    const s = at(0, 1000, 'fork');
    const n = MAPS.find((m) => m.id === 'fork')!.waves.length;
    // Early generated waves: nothing outgrows MAX_GROUP yet, so no conversion.
    const early = waveSchedule(s, n);
    const plain = waveDef(s, n)!.groups.reduce((m, g) => m + Math.max(1, g.count), 0);
    expect(early.length).toBe(plain);
    // Late: every group of the generated wave is at most MAX_GROUP, Brutes and Siege crawlers carry the rest.
    const late = waveSchedule(s, 100);
    const perGroup = new Map<string, number>();
    for (const p of late) if (p.kind !== 'brute' && p.kind !== 'crawler') perGroup.set(`${p.kind}/${p.route}`, (perGroup.get(`${p.kind}/${p.route}`) ?? 0) + 1);
    for (const count of perGroup.values()) expect(count).toBeLessThanOrEqual(MAX_GROUP * 3);
    const crawlers = late.filter((p) => p.kind === 'crawler');
    expect(crawlers.length).toBeGreaterThan(0);
    for (const road of new Set(crawlers.map((p) => p.route))) expect(crawlers.filter((p) => p.route === road).length).toBeLessThanOrEqual(2 * MAX_CRAWLERS);
    // Converted units walk ground roads only.
    const fork = MAPS.find((m) => m.id === 'fork')!;
    for (const p of late.filter((x) => x.kind === 'brute' || x.kind === 'crawler')) expect(fork.routes[p.route]!.layer).toBe('ground');
    // The threat keeps growing wave on wave of the same authored slot, also past the conversion.
    expect(threat(s, 64)).toBeGreaterThan(threat(s, 60));
    expect(threat(s, 104)).toBeGreaterThanOrEqual(threat(s, 100));
  });
});

describe('endless: the wear-down', () => {
  it('costs 1, 2, 3, … from wave 101 on, and nothing in a game of the map’s waves', () => {
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

describe('endless: state version 3 saves (review of PR #115)', () => {
  // Real mid-wave saves of main 52ecec5 (linear growth); see the fixture's `source`.
  const fixture = JSON.parse(readFileSync(new URL('./fixtures/v3-endless-mid-wave.json', import.meta.url), 'utf8')) as { saves: { name: string; state: TdState }[] };
  const save = (name: string): TdState => clone(fixture.saves.find((x) => x.name === name)!.state);

  it('a running generated wave restarts from its lock: the save is kept, never deleted', () => {
    const fork = save('fork-w21-t120');
    // As it is, it holds more units than the new plan of its wave (the host would delete it).
    expect(fork.run!.pending.length + fork.run!.walkers.length).toBeGreaterThan(waveSchedule(fork, fork.wave).length);
    expect(isValidState(fork)).toBe(false);
    for (const name of ['fork-w21-t120', 'training-w9-t120']) {
      const old = save(name);
      const migrated = migrateState(clone(old), 3)!;
      expect(isValidState(migrated), name).toBe(true);
      expect(migrated).toMatchObject({ phase: 'build', run: null, checkpoint: null, length: 'endless', wave: old.wave, credits: old.checkpoint!.credits, towers: old.checkpoint!.towers });
      expect(migrated.log).toEqual(old.log);
      expect(migrated.stats.retries).toBe(old.stats.retries);
      // It plays on under the new plan.
      expect(startWave(migrated).run!.pending).toEqual(waveSchedule(migrated, migrated.wave));
    }
  });

  it('every other version 3 save loads as it is', () => {
    const build = clone(at(30));
    expect(migrateState(clone(build), 3)).toEqual(build);
    // A running authored wave (its plan did not change), endless or not.
    for (const s of [stepWave(startWave(at(3)), 50).state, stepWave(startWave(newGame(5, 'standard', 'fork')), 50).state]) {
      expect(s.phase).toBe('wave');
      expect(migrateState(clone(s), 3)).toEqual(s);
    }
    const lost = { ...clone(at(30)), core: 0, phase: 'lost' as const };
    expect(migrateState(clone(lost), 3)).toEqual(lost);
    expect(migrateState({ junk: 1 }, 3)).toBeUndefined();
    expect(migrateState(null, 3)).toBeUndefined();
    expect(migrateState({ ...save('fork-w21-t120'), checkpoint: null }, 3)).toBeUndefined();
    expect(migrateState({ ...save('fork-w21-t120'), mapId: 'nowhere' }, 3)).toBeUndefined();
    expect(migrateState(clone(build), 4)).toBeUndefined();
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

  it('the cap applies after the difficulty, to generated waves only (the map’s own waves are never capped)', () => {
    const hard = newGame(5, 'hard', 'fork', 'endless');
    const n = MAPS.find((m) => m.id === 'fork')!.waves.length;
    // A generated wave on Hard where a group grows past MAX_GROUP only through the difficulty (×1.2).
    let k = n;
    while (!waveDef(hard, k)!.groups.some((g) => g.count <= MAX_GROUP && Math.ceil((g.count * 120) / 100) > MAX_GROUP)) k++;
    const g = waveDef(hard, k)!.groups.find((x) => x.count <= MAX_GROUP && Math.ceil((x.count * 120) / 100) > MAX_GROUP)!;
    expect(waveSchedule(hard, k).filter((p) => p.kind === g.kind && p.route === g.route).length).toBeLessThanOrEqual(MAX_GROUP * waveDef(hard, k)!.groups.filter((x) => x.kind === g.kind && x.route === g.route).length);
    const own = waveDef(hard, n - 1)!.groups;
    expect(waveSchedule(hard, n - 1).length).toBe(own.reduce((m, x) => m + Math.max(1, Math.ceil((x.count * 120) / 100)), 0));
  });
});
