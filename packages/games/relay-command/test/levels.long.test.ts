import { describe, expect, it } from 'vitest';
import { createRng } from '@wp/game-core';
import { initialIntel, observe, passable, type World } from '@wp/strategy-engine';
import { DIFFICULTIES, planAi, type Difficulty } from '../src/ai';
import { isValidState, lockTurn, migrateState, newGame, OPPONENT, planOrder, PLAYER, RULESET, TURN_LIMITS, type RcState } from '../src/rules';
import { FIELD_EXERCISE, RIDGE_VALLEY, SCENARIOS, type ScenarioSpec } from '../src/scenarios';

/** A side's plan from its own observation (default: the game's default level). */
const ai = (world: World, side: number, difficulty: Difficulty = 'normal') => planAi(observe(world, RULESET, side), RULESET, difficulty);

// The long AI measurement suites (level margins, passive player, resumability, produce-only):
// minutes each, so they live in their own file. CI runs it like every other test file; a local
// mutation sandbox (a git-ignored `vitest.mut-*.config.ts`) can exclude it by name, so that each
// mutant of rules.ts or ai.ts does not cost minutes (mutation scores are then a lower bound).

describe('opponent levels (I5)', () => {
  /** A game length: a turn limit, open end (`null`) or a quick match. */
  type Length = number | null | 'quick';
  const start = (seed: number, spec: ScenarioSpec, difficulty: Difficulty, limit: Length): RcState =>
    newGame(seed, spec, difficulty, limit === 'quick' ? null : limit, limit === 'quick');
  /**
   * Symmetric random opening on `spec`: `pairs` unit pairs (a player unit and its mirror image)
   * nudged by a mirrored displacement of up to `reach` cells. The engine draws no randomness, so
   * varied openings are the only way to get more than one game per pairing.
   */
  function opening(spec: ScenarioSpec, seed: number, pairs: number, reach: number, limit: Length, difficulty: Difficulty): RcState {
    const s = start(seed, spec, difficulty, limit);
    const rng = createRng(seed * 7919 + 13);
    const { w, h } = s.world.map;
    const movable = s.world.entities.filter((e) => e.side === PLAYER && e.kind !== 'command-post');
    const free = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && passable(s.world.map, RULESET, x, y, 'ground') && !s.world.entities.some((e) => e.x === x && e.y === y);
    for (let k = 0; k < pairs; k++) {
      const u = movable[rng.int(0, movable.length - 1)]!;
      const m = s.world.entities.find((e) => e.side === OPPONENT && e.x === w - 1 - u.x && e.y === h - 1 - u.y)!;
      const nx = u.x + rng.int(-reach, reach);
      const ny = u.y + rng.int(-reach, reach);
      if (!free(nx, ny) || !free(w - 1 - nx, h - 1 - ny)) continue;
      Object.assign(u, { x: nx, y: ny });
      Object.assign(m, { x: w - 1 - nx, y: h - 1 - ny });
    }
    s.world.intel = initialIntel(s.world, RULESET);
    return s;
  }
  /** The player side is played by an AI at level `a` (or not at all), the opponent at the game's level. */
  function play(s: RcState, a: Difficulty | 'passive', cap = 40): RcState {
    for (let i = 0; i < cap && s.phase === 'plan'; i++) {
      if (a !== 'passive') for (const c of ai(s.world, PLAYER, a)) s = planOrder(s, c.unit, c.order, c.doctrine) ?? s;
      s = lockTurn(s);
    }
    return s;
  }
  /**
   * Wins of `a` and of `b` over `n` different openings (24 turns), `a` on the player's side for even
   * seeds and on the opponent's for odd ones. One game per opening: the maps are point-symmetric and
   * the AI deterministic, so the same opening played from the other side is its exact mirror image
   * and adds no information (review of PR #55: the former "2 x 6" pairs were 6 samples).
   */
  function margin(spec: ScenarioSpec, a: Difficulty, b: Difficulty, n: number, pairs: number, reach: number): { a: number; b: number; draws: number } {
    const out = { a: 0, b: 0, draws: 0 };
    for (let seed = 0; seed < n; seed++) {
      const aIsPlayer = seed % 2 === 0;
      const r = aIsPlayer ? play(opening(spec, seed, pairs, reach, 24, b), a).result : play(opening(spec, seed, pairs, reach, 24, a), b).result;
      const [win, loss] = aIsPlayer ? ['won', 'lost'] : ['lost', 'won'];
      if (r === win) out.a++;
      else if (r === loss) out.b++;
      else out.draws++;
    }
    return out;
  }
  const MODES: readonly Length[] = [24, 'quick'];

  /**
   * The level-against-level margins are measured on these two maps only (each one is a long
   * suite; the cheaper suites below run on every map). Newer maps are covered by the passive,
   * produce-only, termination and resumability suites.
   */
  const MARGIN_MAPS: readonly ScenarioSpec[] = [FIELD_EXERCISE, RIDGE_VALLEY];
  // Timeouts of the long suites: measured under `pnpm coverage` (CI runs with coverage, about
  // 1.3–2× slower than a plain run): beat easy 63 s locally (133 s in CI), hard vs normal 46 s,
  // passive 109 s, resumable 28 s, produce-only 11 s — each well under half its limit locally.

  it('normal and hard beat easy by a clear margin over randomised openings on Field Exercise and Ridge Valley', () => {
    for (const spec of MARGIN_MAPS) {
      const hard = margin(spec, 'hard', 'easy', 20, 2, 2);
      const normal = margin(spec, 'normal', 'easy', 20, 2, 2);
      // 20 openings each (measured 2026-10-17: 20-0 for both levels on both maps).
      expect(hard.a, `${spec.id} hard vs easy ${JSON.stringify(hard)}`).toBeGreaterThanOrEqual(hard.b + 16);
      expect(normal.a, `${spec.id} normal vs easy ${JSON.stringify(normal)}`).toBeGreaterThanOrEqual(normal.b + 16);
    }
  }, 600_000); // 2 maps x 2 levels x 20 AI-vs-AI games of 24 turns: 154 s under coverage on a loaded 4-core machine (2026-10-14), kept under half of this

  it('hard beats normal on Field Exercise by at least 4 games and on Ridge Valley; over both by at least 4', () => {
    // The two share the plan of attack; hard adds breadth, focus fire, pulling back and jamming.
    // Measured since PR #13 (escorts yield in passes; storms find a way past held rings):
    // Field Exercise 8-4, Ridge Valley 6-6 over 2x6 openings (mirror pairs: 6 samples each).
    // With defence towers, over 12 different openings (2026-10-17): Field Exercise 8-4, Ridge Valley 7-5;
    // over 30 openings Field Exercise 22-8 and Ridge Valley 20-10 (without towers 23-7 and 20-10).
    const total = { a: 0, b: 0, draws: 0 };
    for (const spec of MARGIN_MAPS) {
      const r = margin(spec, 'hard', 'normal', 12, 2, 2);
      total.a += r.a;
      total.b += r.b;
      total.draws += r.draws;
      if (spec === FIELD_EXERCISE) expect(r.a, `${spec.id} hard vs normal ${JSON.stringify(r)}`).toBeGreaterThanOrEqual(r.b + 4);
      else expect(r.a, `${spec.id} hard vs normal ${JSON.stringify(r)}`).toBeGreaterThan(r.b);
    }
    expect(total.a, `hard vs normal over both margin maps ${JSON.stringify(total)}`).toBeGreaterThanOrEqual(total.b + 4);
  }, 300_000);

  /** Random player moves in a resolved first turn (the reviewer's "mild opening"), then nothing. */
  function firstTurnMoves(spec: ScenarioSpec, seed: number, limit: Length, difficulty: Difficulty): RcState {
    let s = start(seed, spec, difficulty, limit);
    const rng = createRng(seed * 31 + 7);
    const units = s.world.entities.filter((e) => e.side === PLAYER && (RULESET.archetypes[e.kind]?.speed ?? 0) > 0);
    for (let k = 0; k < 4; k++) {
      const u = units[rng.int(0, units.length - 1)]!;
      s = planOrder(s, u.id, { type: 'move', x: Math.max(0, Math.min(s.world.map.w - 1, u.x + rng.int(-4, 4))), y: Math.max(0, Math.min(s.world.map.h - 1, u.y + rng.int(-4, 4))) }) ?? s;
    }
    return lockTurn(s);
  }
  /** Longest game the tests below accept for their strategies (measured: 42 turns); not a bound for every strategy. */
  const GAME_BOUND = 60;

  it('a passive player loses at normal and hard on every map, with a turn limit and open end: from the unperturbed start, nudged openings and first-turn moves; every game ends within the bound', () => {
    for (const spec of SCENARIOS) {
      for (const limit of [...MODES, null]) {
        // Plain open end (no stalemate rule; measured longest 39 turns): not a bound for every strategy —
        // a player who only produces, or two mirrored AIs, can stall; the player can then end on strength.
        const bound = GAME_BOUND;
        for (const level of ['normal', 'hard'] as const) {
          const label = (kind: string, games: RcState[]) => `${spec.id} limit=${limit} ${level} ${kind}: ${games.map((g) => `${g.result}@${g.world.turn}`).join(',')}`;
          const unperturbed = [play(start(0, spec, level, limit), 'passive', bound)];
          const nudged = Array.from({ length: 4 }, (_, seed) => play(opening(spec, seed, 2, 2, limit, level), 'passive', bound));
          const moved = Array.from({ length: 4 }, (_, seed) => play(firstTurnMoves(spec, seed + 100, limit, level), 'passive', bound));
          for (const [kind, games] of [['start', unperturbed], ['nudged', nudged]] as const) {
            expect(games.every((g) => g.phase === 'finished' && g.result === 'lost'), label(kind, games)).toBe(true);
          }
          // First-turn moves can leave a player well placed: it wins some (on Field Exercise, at both levels).
          expect(moved.every((g) => g.phase === 'finished'), label('moved', moved)).toBe(true);
          expect(moved.filter((g) => g.result === 'lost').length, label('moved', moved)).toBeGreaterThanOrEqual(3);
        }
      }
    }
  }, 600_000);

  it('every game stays a valid, resumable save after every turn: every map, every length, passive and playing', () => {
    for (const spec of SCENARIOS) {
      for (const limit of [...TURN_LIMITS, 'quick'] as const) {
        for (const player of ['passive', 'normal'] as const) {
          let s = start(3, spec, 'hard', limit);
          for (let i = 0; i < GAME_BOUND && s.phase === 'plan'; i++) {
            if (player !== 'passive') for (const c of ai(s.world, PLAYER, player)) s = planOrder(s, c.unit, c.order, c.doctrine) ?? s;
            s = lockTurn(s);
            const saved = JSON.parse(JSON.stringify(s)) as unknown;
            expect(isValidState(saved), `${spec.id} limit=${limit} ${player} turn ${s.world.turn}`).toBe(true);
          }
          if (typeof limit === 'number') expect(s.lead).toEqual([]);
        }
      }
    }
  }, 600_000);

  it('a player who only produces with the normal template and never moves loses, and AI-vs-AI quick matches end within the bound', () => {
    // Narrow on purpose: a stronger turtle (Extractors on every deposit, then a Motor Pool and
    // heavier units) can out-produce the opponent and win on strength (design notes, I6d).

    for (const spec of SCENARIOS) {
      for (const level of ['normal', 'hard'] as const) {
        let s = opening(spec, 1, 2, 2, 'quick', level);
        for (let i = 0; i < GAME_BOUND && s.phase === 'plan'; i++) {
          for (const c of ai(s.world, PLAYER, 'normal')) if (c.order.type === 'produce') s = planOrder(s, c.unit, c.order) ?? s;
          s = lockTurn(s);
        }
        expect(s, `${spec.id} ${level} produce-only`).toMatchObject({ phase: 'finished', result: 'lost' });
      }
      for (const [a, b] of [['hard', 'normal'], ['normal', 'normal'], ['easy', 'easy']] as const) {
        const g = play(opening(spec, 2, 2, 2, 'quick', b), a, GAME_BOUND);
        expect(g.phase, `${spec.id} ${a} vs ${b} quick match, turn ${g.world.turn}`).toBe('finished');
      }
    }
  }, 600_000);

  it('the same level on both sides from the scripted start gives a symmetric draw (no side bias)', () => {
    for (const level of DIFFICULTIES) expect(play(newGame(1, FIELD_EXERCISE, level, 12), level).result).toBe('draw');
  });

  it('new games keep the chosen level; saves without one (version 3) play on at normal', () => {
    expect(newGame(1, FIELD_EXERCISE, 'hard').difficulty).toBe('hard');
    const v3 = JSON.parse(JSON.stringify({ ...newGame(2), v: 3 })) as Record<string, unknown>;
    delete v3.difficulty;
    expect(migrateState(v3, 3)?.difficulty).toBe('normal');
    expect(isValidState({ ...newGame(2), difficulty: 'impossible' })).toBe(false);
  });
});
