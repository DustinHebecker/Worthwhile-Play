import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import { worldHash } from '@wp/strategy-engine';
import { MAPS, TRAINING } from '../src/maps';
import { BASE_TOWERS, TOWERS } from '@wp/td-core';
import {
  applyCommand,
  checkCommand,
  endGame,
  incomeAfter,
  interestOf,
  isPad,
  isValidState,
  mapOf,
  MAX_WAVE_TICKS,
  STUN_BUDGET,
  newGame,
  refundOf,
  replay,
  resolveWave,
  retryWave,
  startWave,
  stepWave,
  waveSchedule,
  type BuildCommand,
  type TdState
} from '../src/rules';

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const pads = (s: TdState): [number, number][] => {
  const out: [number, number][] = [];
  for (let y = 0; y < s.world.map.h; y++) for (let x = 0; x < s.world.map.w; x++) if (isPad(s, x, y)) out.push([x, y]);
  return out;
};

/** A reasonable fixed build next to the training road. */
const SOLID: BuildCommand[] = [
  { t: 'place', kind: 'gun', x: 2, y: 2 },
  { t: 'place', kind: 'gun', x: 2, y: 4 }
];

/** Random legal build commands for a state (deterministic per rng). */
function randomBuild(s: TdState, seed: number, n: number): TdState {
  const rng = createRng(seed);
  const cells = pads(s);
  for (let i = 0; i < n; i++) {
    const towers = s.world.entities.filter((e) => e.side === 0);
    const roll = rng.int(0, 9);
    let cmd: BuildCommand;
    if (roll < 6 || towers.length === 0) {
      const [x, y] = rng.pick(cells);
      cmd = { t: 'place', kind: rng.pick(BASE_TOWERS), x, y };
    } else {
      const tower = rng.pick(towers);
      const next = TOWERS[tower.kind]!.next;
      cmd = roll < 8 && next.length > 0 ? { t: 'upgrade', id: tower.id, kind: rng.pick(next) } : roll === 8 ? { t: 'sell', id: tower.id } : { t: 'target', id: tower.id, priority: 'nearest' };
    }
    s = applyCommand(s, cmd);
  }
  return s;
}

describe('new game', () => {
  it('starts in the build phase with the difficulty credits and core', () => {
    const s = newGame(1, 'standard');
    expect(s.phase).toBe('build');
    expect(s.credits).toBe(TRAINING.startCredits);
    expect(s.core).toBe(20);
    expect(newGame(1, 'relaxed').credits).toBeGreaterThan(s.credits);
    expect(newGame(1, 'hard').core).toBeLessThan(s.core);
    expect(isValidState(s)).toBe(true);
  });

  it.each(MAPS.filter((m) => m.waves.length === 12).map((m) => m.id))('map %s: the seed varies most waves', (id) => {
    const map = MAPS.find((m) => m.id === id)!;
    expect(map.waves.filter((slot) => slot.length > 1).length).toBeGreaterThanOrEqual(8);
  });

  it('picks wave variants from the seed only', () => {
    const variants = new Set(Array.from({ length: 30 }, (_, i) => newGame(i).variants.join()));
    expect(variants.size).toBeGreaterThan(1);
    expect(newGame(7).variants).toEqual(newGame(7).variants);
  });

  it.each(MAPS.map((m) => m.id))('map %s: valid size, routes on the road, waves of known routes', (id) => {
    const map = MAPS.find((m) => m.id === id)!;
    // 7 columns keep 44 px cells on a 360 px phone.
    expect(map.w).toBe(7);
    expect(map.rows).toHaveLength(map.h);
    for (const row of map.rows) expect(row).toMatch(/^[=b^~]{7}$/);
    for (const route of map.routes) {
      for (const [x, y] of route.points) expect(x >= 0 && y >= 0 && x < map.w && y < map.h).toBe(true);
      if (route.layer === 'ground') for (const [x, y] of route.points) expect(map.rows[y]![x], `${id} ${x},${y}`).toBe('=');
      // Every route ends at the same core.
      expect(route.points.at(-1)).toEqual(map.routes[0]!.points.at(-1));
    }
    expect(map.income).toHaveLength(map.waves.length - 1);
    for (const slot of map.waves) for (const wave of slot) for (const group of wave.groups) expect(map.routes[group.route]).toBeDefined();
  });

  it.each(MAPS.map((m) => m.id))('map %s: every unit of an undefended wave reaches the core in time', (id) => {
    const map = MAPS.find((m) => m.id === id)!;
    for (let wave = 0; wave < map.waves.length; wave += 4) {
      const s = { ...newGame(1, 'standard', id), wave, core: 1000 };
      const run = startWave(s);
      const total = waveSchedule(run, wave).length;
      let ticks = 0;
      let end = run;
      while (end.phase === 'wave') {
        end = stepWave(end, 100).state;
        ticks += 100;
      }
      expect(end.stats.leaked, `${id} wave ${wave + 1}`).toBe(total);
      expect(ticks, `${id} wave ${wave + 1}`).toBeLessThan(MAX_WAVE_TICKS / 2);
    }
  });
});

describe('build commands', () => {
  it('places a tower on a pad and charges its price', () => {
    const s = applyCommand(newGame(1), { t: 'place', kind: 'gun', x: 2, y: 2 });
    expect(s.world.entities).toHaveLength(1);
    expect(s.credits).toBe(TRAINING.startCredits - TOWERS.gun!.price);
    expect(s.log[0]).toHaveLength(1);
  });

  it('refuses illegal placements without changing the state', () => {
    const s = newGame(1);
    expect(checkCommand(s, { t: 'place', kind: 'gun', x: 3, y: 0 })).toBe('not-a-pad');
    expect(checkCommand(s, { t: 'place', kind: 'gun', x: 1, y: 2 })).toBe('not-a-pad');
    expect(checkCommand(s, { t: 'place', kind: 'gatling', x: 2, y: 2 })).toBe('unknown-kind');
    expect(checkCommand(s, { t: 'place', kind: 'constructor', x: 2, y: 2 })).toBe('unknown-kind');
    const one = applyCommand(s, { t: 'place', kind: 'gun', x: 2, y: 2 });
    expect(checkCommand(one, { t: 'place', kind: 'gun', x: 2, y: 2 })).toBe('occupied');
    const poor = { ...s, credits: 50 };
    expect(checkCommand(poor, { t: 'place', kind: 'gun', x: 2, y: 2 })).toBe('credits');
    expect(applyCommand(poor, { t: 'place', kind: 'gun', x: 2, y: 2 })).toBe(poor);
  });

  it('upgrades only along the branch tree and the branch choice is final', () => {
    let s = applyCommand({ ...newGame(1), credits: 2000 }, { t: 'place', kind: 'gun', x: 2, y: 2 });
    const id = s.world.entities[0]!.id;
    expect(checkCommand(s, { t: 'upgrade', id, kind: 'gatling-2' })).toBe('not-an-upgrade');
    s = applyCommand(s, { t: 'upgrade', id, kind: 'cannon' });
    expect(s.world.entities[0]!.kind).toBe('cannon');
    expect(checkCommand(s, { t: 'upgrade', id, kind: 'gatling' })).toBe('not-an-upgrade');
    s = applyCommand(s, { t: 'upgrade', id, kind: 'cannon-2' });
    expect(s.world.entities[0]!.kind).toBe('cannon-2');
    expect(TOWERS['cannon-2']!.next).toEqual([]);
  });

  it('every family has two exclusive branches of two levels', () => {
    for (const base of BASE_TOWERS) {
      const def = TOWERS[base]!;
      expect(def.level).toBe(1);
      expect(def.next).toHaveLength(2);
      const branches = def.next.map((k) => TOWERS[k]!);
      expect(branches.map((b) => b.branch).sort()).toEqual(['a', 'b']);
      for (const b of branches) {
        expect(b.family).toBe(def.family);
        expect(b.next).toHaveLength(1);
        expect(TOWERS[b.next[0]!]!.level).toBe(3);
      }
    }
  });

  it('refunds everything bought in this build phase and 70 % of older investments', () => {
    const s0 = newGame(1);
    let s = applyCommand(s0, { t: 'place', kind: 'gun', x: 2, y: 2 });
    const id = s.world.entities[0]!.id;
    expect(applyCommand(s, { t: 'sell', id }).credits).toBe(s0.credits);
    s = resolveWave(startWave(s)).state;
    expect(s.phase).toBe('build');
    const record = s.towers.find((r) => r.id === id)!;
    expect(refundOf(record)).toBe(Math.floor((TOWERS.gun!.price * 70) / 100));
    const sold = applyCommand(s, { t: 'sell', id });
    expect(sold.credits).toBe(s.credits + refundOf(record));
    expect(sold.world.entities.some((e) => e.id === id)).toBe(false);
  });

  it('sets a target priority as the tower doctrine', () => {
    let s = applyCommand(newGame(1), { t: 'place', kind: 'gun', x: 2, y: 2 });
    const id = s.world.entities[0]!.id;
    s = applyCommand(s, { t: 'target', id, priority: 'armor' });
    expect(s.world.entities[0]!.doctrine?.priority).toBe('armor');
  });

  it('accepts no build command during a wave', () => {
    const s = startWave(newGame(1));
    expect(checkCommand(s, { t: 'place', kind: 'gun', x: 2, y: 2 })).toBe('phase');
  });
});

describe('waves', () => {
  it('an undefended wave leaks every unit and costs core integrity by threat', () => {
    const s = resolveWave(startWave(newGame(1))).state;
    const spawned = waveSchedule(newGame(1), 0).length;
    expect(s.stats.leaked).toBe(spawned);
    expect(s.stats.killed).toBe(0);
    expect(s.core).toBe(20 - spawned);
    expect(s.phase).toBe('build');
    expect(s.wave).toBe(1);
  });

  it('defended waves give bounties and the wave income', () => {
    let s = newGame(1);
    for (const c of SOLID) s = applyCommand(s, c);
    const before = s.credits;
    s = resolveWave(startWave(s)).state;
    expect(s.stats.killed).toBeGreaterThan(0);
    expect(s.credits).toBeGreaterThan(before + TRAINING.income[0]! - 1);
  });

  it('pays 10 % interest on the credits left unspent at the start of a wave', () => {
    const s0 = newGame(1);
    const income = incomeAfter(s0, 0);
    // Undefended: no bounties, so the gain is exactly income + interest on all start credits.
    const s1 = resolveWave(startWave(s0)).state;
    expect(s1.credits - s0.credits).toBe(income + interestOf(s0.credits));
    expect(interestOf(s0.credits)).toBe(Math.floor(s0.credits / 10));
    // Spending everything earns no interest.
    const spent = applyCommand(applyCommand(s0, { t: 'place', kind: 'gun', x: 2, y: 2 }), { t: 'place', kind: 'gun', x: 2, y: 4 });
    const s2 = resolveWave(startWave(spent)).state;
    expect(interestOf(spent.credits)).toBe(10);
    expect(s2.credits - spent.credits).toBeGreaterThanOrEqual(income + 10);
    expect(interestOf(-5)).toBe(0);
  });

  it('a lost wave can be retried from its locked build', () => {
    let s = newGame(1, 'hard');
    while (s.phase === 'build') s = resolveWave(startWave(s)).state;
    expect(s.phase).toBe('lost');
    expect(s.core).toBe(0);
    // A lost game is a valid save (review of PR #97: it was discarded on reload).
    expect(s.run).toBeNull();
    expect(s.world.entities.some((e) => e.side === 1)).toBe(false);
    expect(isValidState(clone(s))).toBe(true);
    // Ending the game is final.
    const ended = endGame(s);
    expect(ended.phase).toBe('ended');
    expect(isValidState(clone(ended))).toBe(true);
    expect(retryWave(ended)).toBe(ended);
    const retry = retryWave(s);
    expect(retry.phase).toBe('build');
    expect(retry.wave).toBe(s.checkpoint!.wave);
    expect(retry.stats.retries).toBe(1);
    expect(isValidState(retry)).toBe(true);
  });

  it('a good build wins the training map', () => {
    let s = newGame(3, 'standard');
    const plan: BuildCommand[][] = [
      [
        { t: 'place', kind: 'gun', x: 2, y: 2 },
        { t: 'place', kind: 'gun', x: 2, y: 4 }
      ],
      [{ t: 'place', kind: 'laser', x: 2, y: 5 }],
      [{ t: 'place', kind: 'artillery', x: 3, y: 5 }],
      [{ t: 'upgrade', id: 1, kind: 'cannon' }],
      [{ t: 'place', kind: 'specialist', x: 4, y: 7 }],
      [
        { t: 'upgrade', id: 5, kind: 'interceptor' },
        { t: 'place', kind: 'gun', x: 4, y: 8 }
      ]
    ];
    for (const cmds of plan) {
      for (const c of cmds) s = applyCommand(s, c);
      if (s.phase === 'build') s = resolveWave(startWave(s)).state;
    }
    expect(s.phase).toBe('won');
  });
});

describe('properties', () => {
  const arbGame = fc.record({ seed: fc.integer({ min: 0, max: 2 ** 31 }), build: fc.integer({ min: 0, max: 1000 }), n: fc.integer({ min: 0, max: 6 }) });

  it('P1 determinism: same seed and commands give the same state', () => {
    fc.assert(
      fc.property(arbGame, ({ seed, build, n }) => {
        const a = resolveWave(startWave(randomBuild(newGame(seed), build, n))).state;
        const b = resolveWave(startWave(randomBuild(newGame(seed), build, n))).state;
        expect(worldHash(a.world)).toBe(worldHash(b.world));
        expect(a).toEqual(b);
      }),
      { numRuns: 15 }
    );
  });

  it('P2 chunking: playback speed never changes the result', () => {
    fc.assert(
      fc.property(arbGame, fc.integer({ min: 1, max: 40 }), ({ seed, build, n }, chunk) => {
        const start = startWave(randomBuild(newGame(seed), build, n));
        let chunked = start;
        while (chunked.phase === 'wave') chunked = stepWave(chunked, chunk).state;
        expect(chunked).toEqual(resolveWave(start).state);
      }),
      { numRuns: 15 }
    );
  });

  it('P3 save and restore at any tick continues exactly', () => {
    fc.assert(
      fc.property(arbGame, fc.integer({ min: 0, max: 400 }), ({ seed, build, n }, at) => {
        const start = startWave(randomBuild(newGame(seed), build, n));
        const mid = stepWave(start, at).state;
        const restored = clone(mid);
        expect(isValidState(restored)).toBe(true);
        expect(resolveWave(restored).state).toEqual(resolveWave(mid).state);
      }),
      { numRuns: 15 }
    );
  });

  it('P4 conservation: spawned = killed + leaked + alive, credits never negative', () => {
    fc.assert(
      fc.property(arbGame, ({ seed, build, n }) => {
        let s = startWave(randomBuild(newGame(seed), build, n));
        const total = waveSchedule(s, s.wave).length;
        const base = { killed: s.stats.killed, leaked: s.stats.leaked };
        while (s.phase === 'wave') {
          s = stepWave(s, 7).state;
          const alive = s.world.entities.filter((e) => e.side === 1).length;
          const pending = s.run?.pending.length ?? 0;
          expect(s.stats.killed - base.killed + s.stats.leaked - base.leaked + alive + pending).toBe(total);
          expect(s.credits).toBeGreaterThanOrEqual(0);
        }
      }),
      { numRuns: 10 }
    );
  });

  it('P5 termination: every wave ends well before the safety bound', () => {
    fc.assert(
      fc.property(arbGame, ({ seed, build, n }) => {
        let s = randomBuild(newGame(seed, 'relaxed'), build, n);
        while (s.phase === 'build') {
          const started = startWave(s);
          let ticks = 0;
          s = started;
          while (s.phase === 'wave') {
            s = stepWave(s, 50).state;
            ticks += 50;
          }
          expect(ticks).toBeLessThan(MAX_WAVE_TICKS / 2);
        }
      }),
      { numRuns: 6 }
    );
  });

  it('P6 replay from the log reproduces the game', () => {
    fc.assert(
      fc.property(arbGame, ({ seed, build, n }) => {
        let s = newGame(seed, 'relaxed');
        for (let wave = 0; wave < 3 && s.phase === 'build'; wave++) {
          s = randomBuild(s, build + wave, n);
          if (wave < 2) s = resolveWave(startWave(s)).state;
        }
        expect(replay(seed, 'relaxed', s.mapId, s.log)).toEqual(s);
      }),
      { numRuns: 8 }
    );
  });

  it('a unit can be stopped for at most STUN_BUDGET ticks per wave, so stop-only builds cannot stall a wave', () => {
    // Only EMP towers around the first road cells: they deal 1 damage, so everything walks through eventually.
    let s = { ...newGame(1, 'relaxed'), credits: 5000 };
    for (const [x, y] of [[2, 0], [4, 0], [2, 1], [4, 1], [2, 2], [4, 2]] as const) s = applyCommand(s, { t: 'place', kind: 'specialist', x, y });
    for (const tower of s.world.entities) s = applyCommand(s, { t: 'upgrade', id: tower.id, kind: 'blackout' });
    let run = startWave(s);
    let ticks = 0;
    while (run.phase === 'wave') {
      run = stepWave(run, 10).state;
      ticks += 10;
      for (const w of run.run?.walkers ?? []) expect(w.stun ?? 0).toBeLessThanOrEqual(STUN_BUDGET);
    }
    expect(ticks).toBeLessThan(MAX_WAVE_TICKS / 4);
  });

  describe('stop budget, tick by tick', () => {
    /** A running wave with one walker on the road, no towers. */
    const running = (): TdState => {
      let s = startWave(newGame(1));
      while ((s.run?.walkers.length ?? 0) === 0) s = stepWave(s, 1).state;
      return clone(s);
    };
    const stop = (s: TdState, stun: number | undefined, ticks = 10): TdState => {
      const t = clone(s);
      const walker = t.run!.walkers[0]!;
      if (stun === undefined) delete walker.stun;
      else walker.stun = stun;
      t.world.entities.find((e) => e.id === walker.id)!.status = [{ kind: 'disabled', ticks }];
      return t;
    };
    const after = (s: TdState) => {
      const next = stepWave(s, 1).state;
      const walker = next.run!.walkers.find((w) => w.id === s.run!.walkers[0]!.id)!;
      const unit = next.world.entities.find((e) => e.id === walker.id)!;
      return { stun: walker.stun, stopped: unit.status.some((st) => st.kind === 'disabled') };
    };

    it('counts every stopped tick from the first one', () => {
      expect(after(stop(running(), undefined))).toEqual({ stun: 1, stopped: true });
      expect(after(stop(running(), 5))).toEqual({ stun: 6, stopped: true });
    });

    it('a unit that is not stopped spends nothing of its budget', () => {
      const s = running();
      expect(after(s)).toEqual({ stun: undefined, stopped: false });
      const t = clone(s);
      t.run!.walkers[0]!.stun = 7;
      expect(after(t)).toEqual({ stun: 7, stopped: false });
    });

    it('the last tick of the budget still stops; after it every stop is shaken off', () => {
      expect(after(stop(running(), STUN_BUDGET - 1))).toEqual({ stun: STUN_BUDGET, stopped: true });
      expect(after(stop(running(), STUN_BUDGET))).toEqual({ stun: STUN_BUDGET, stopped: false });
    });

    it('shaking off a stop keeps a slow, and a slow alone spends nothing of the budget', () => {
      const t = stop(running(), STUN_BUDGET);
      const unit = t.world.entities.find((e) => e.id === t.run!.walkers[0]!.id)!;
      unit.status = [{ kind: 'slowed', ticks: 10 }, { kind: 'disabled', ticks: 10 }];
      const next = stepWave(t, 1).state;
      const status = next.world.entities.find((e) => e.id === unit.id)!.status.map((st) => st.kind);
      expect(status).toEqual(['slowed']);
      const slowOnly = clone(running());
      slowOnly.world.entities.find((e) => e.id === slowOnly.run!.walkers[0]!.id)!.status = [{ kind: 'slowed', ticks: 10 }];
      expect(stepWave(slowOnly, 1).state.run!.walkers[0]!.stun).toBeUndefined();
    });

    it('only the stopped unit spends its budget when several are on the road', () => {
      let s = startWave(newGame(1));
      while ((s.run?.walkers.length ?? 0) < 2) s = stepWave(s, 1).state;
      const t = clone(s);
      const second = t.run!.walkers[1]!;
      t.world.entities.find((e) => e.id === second.id)!.status = [{ kind: 'disabled', ticks: 10 }];
      const next = stepWave(t, 1).state;
      expect(next.run!.walkers.find((w) => w.id === second.id)!.stun).toBe(1);
      expect(next.run!.walkers.find((w) => w.id === t.run!.walkers[0]!.id)!.stun).toBeUndefined();
    });

    it('a spent stop (no ticks left) costs nothing', () => {
      expect(after(stop(running(), undefined, 0)).stun).toBeUndefined();
    });

    it('the budget is six seconds of stopping', () => {
      expect(STUN_BUDGET).toBe(6 * 8);
    });

    it('saves accept a budget between 1 and STUN_BUDGET only', () => {
      const s = running();
      const withStun = (v: unknown): boolean => {
        const t = clone(s) as unknown as { run: { walkers: Record<string, unknown>[] } };
        t.run.walkers[0]!.stun = v;
        return isValidState(t);
      };
      expect(isValidState(s)).toBe(true);
      expect(withStun(1)).toBe(true);
      expect(withStun(STUN_BUDGET)).toBe(true);
      for (const bad of [0, -1, STUN_BUDGET + 1, 1.5, '3', null]) expect(withStun(bad), String(bad)).toBe(false);
    });
  });

  it('rejects every malformed part of a running wave', () => {
    let base = startWave(newGame(1, 'standard', 'fork'));
    while ((base.run?.walkers.length ?? 0) < 2) base = stepWave(base, 1).state;
    base = clone(base);
    expect(isValidState(base)).toBe(true);
    type Run = { tick: unknown; pending: Record<string, unknown>[]; walkers: Record<string, unknown>[] };
    const tampered = (change: (run: Run, t: TdState) => void): boolean => {
      const t = clone(base);
      change(t.run as unknown as Run, t);
      return isValidState(t);
    };
    const routes = mapOf(base).routes;
    const firstLegs = routes[base.run!.walkers[0]!.route]!.points.length;
    // Valid edge values stay valid.
    expect(tampered((r) => (r.walkers[0]!.leg = firstLegs - 1))).toBe(true);
    expect(tampered((r) => (r.pending[0]!.route = routes.length - 1))).toBe(true);
    const bad: [string, (run: Run, t: TdState) => void][] = [
      ['run missing', (_r, t) => ((t as { run: unknown }).run = null)],
      ['run not an object', (_r, t) => ((t as { run: unknown }).run = 5)],
      ['tick negative', (r) => (r.tick = -1)],
      ['tick beyond the bound', (r) => (r.tick = MAX_WAVE_TICKS + 1)],
      ['pending entry not an object', (r) => (r.pending[0] = 7 as never)],
      ['pending time negative', (r) => (r.pending[0]!.at = -1)],
      ['pending kind not a string', (r) => (r.pending[0]!.kind = 3)],
      ['pending kind unknown', (r) => (r.pending[0]!.kind = 'gun')],
      ['pending route negative', (r) => (r.pending[0]!.route = -1)],
      ['pending route beyond the map', (r) => (r.pending[0]!.route = routes.length)],
      ['walker not an object', (r) => (r.walkers[0] = 'x' as never)],
      ['walker id zero', (r) => (r.walkers[0]!.id = 0)],
      ['walker route beyond the map', (r) => (r.walkers[0]!.route = routes.length)],
      ['walker route negative', (r) => (r.walkers[0]!.route = -1)],
      ['walker leg zero', (r) => (r.walkers[0]!.leg = 0)],
      ['walker leg past the goal', (r) => (r.walkers[0]!.leg = firstLegs)],
      ['a unit without its walker', (r) => r.walkers.pop()],
      ['a walker for another unit', (r) => (r.walkers[0]!.id = 9999)],
      ['two walkers for one unit', (r) => (r.walkers[1]!.id = r.walkers[0]!.id)]
    ];
    for (const [name, change] of bad) expect(tampered(change), name).toBe(false);
  });

  it('a crafted running wave with more units than its schedule is rejected', () => {
    const s = clone(stepWave(startWave(newGame(1)), 5).state);
    expect(isValidState(s)).toBe(true);
    s.run!.pending = Array.from({ length: 1000 }, () => ({ at: 0, kind: 'walker' as const, route: 0 }));
    expect(isValidState(s)).toBe(false);
  });

  it('P7 isValidState never throws and rejects junk and tampered saves', () => {
    fc.assert(
      fc.property(fc.anything(), (v) => {
        expect(() => isValidState(v)).not.toThrow();
      }),
      { numRuns: 300 }
    );
    const s = applyCommand(newGame(1), { t: 'place', kind: 'gun', x: 2, y: 2 });
    expect(isValidState(clone(s))).toBe(true);
    const cases: ((t: TdState) => void)[] = [
      (t) => (t.credits = -1),
      (t) => (t.phase = 'won' as never),
      (t) => (t.world.entities[0]!.kind = 'crawler'),
      (t) => (t.towers = []),
      (t) => (t.mapId = 'nope'),
      (t) => (t.log = []),
      (t) => (t.world.map = { ...t.world.map, terrain: t.world.map.terrain.replace('=', 'b') }),
      // Review of PR #97: a duplicate record (a sale of the other tower then crashed), a tower on the
      // road, a checkpoint of another game, a target command without a tower id.
      (t) => {
        t.world.entities.push({ ...t.world.entities[0]!, id: t.world.nextId, x: 2, y: 4 });
        t.world.nextId++;
        t.towers.push({ ...t.towers[0]! });
      },
      (t) => {
        t.world.entities[0]!.x = 3;
        t.world.entities[0]!.y = 2;
      },
      (t) => (t.checkpoint = { ...clone(newGame(1)), mapId: 'fork' } as never),
      (t) => (t.checkpoint = clone(newGame(2)) as never),
      (t) => t.log[0]!.push({ t: 'target', priority: 'nearest' } as never)
    ];
    for (const tamper of cases) {
      const t = clone(s);
      tamper(t);
      if (t.phase === 'won') continue; // a won build phase is structurally fine; covered by the run checks
      expect(isValidState(t)).toBe(false);
    }
  });
});
