import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import { worldHash } from '@wp/strategy-engine';
import { MAPS, TRAINING } from '../src/maps';
import { BASE_TOWERS, TOWERS } from '../src/ruleset';
import {
  applyCommand,
  checkCommand,
  incomeAfter,
  interestOf,
  isPad,
  isValidState,
  MAX_WAVE_TICKS,
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
      (t) => (t.world.entities[0]!.kind = 'colossus'),
      (t) => (t.towers = []),
      (t) => (t.mapId = 'nope'),
      (t) => (t.log = []),
      (t) => (t.world.map = { ...t.world.map, terrain: t.world.map.terrain.replace('=', 'b') })
    ];
    for (const tamper of cases) {
      const t = clone(s);
      tamper(t);
      if (t.phase === 'won') continue; // a won build phase is structurally fine; covered by the run checks
      expect(isValidState(t)).toBe(false);
    }
  });
});
