import { createRng } from '@wp/game-core';
import { archetypeOf } from '@wp/strategy-engine';
import { BASE_TOWERS, ENEMIES, TD_RULESET, TOWERS, type Family } from '@wp/td-core';
import { applyCommand, checkCommand, isPad, mapOf, newGame, resolveWave, startWave, stepWave, type BuildCommand, type Difficulty, type TdState } from '../src/rules';

/**
 * Balance bots (docs/design/tower-defense.md § 11.3). They play through the same build commands as
 * a person. The planner is greedy with a one-wave look-ahead: while the next wave would still get
 * through, it tries placing each allowed family on the best pads and every allowed upgrade, keeps
 * the action that saves the most threat per credit, and stops when nothing helps.
 */

/** Road cells every route passes (ground and air waypoints joined by straight steps). */
function routeCells(s: TdState): [number, number][] {
  const out: [number, number][] = [];
  for (const route of mapOf(s).routes) {
    const pts = route.points;
    for (let i = 1; i < pts.length; i++) {
      let [x, y] = pts[i - 1]!;
      const [tx, ty] = pts[i]!;
      while (x !== tx || y !== ty) {
        out.push([x, y]);
        x += Math.sign(tx - x);
        y += Math.sign(ty - y);
      }
      out.push([tx, ty]);
    }
  }
  return out;
}

/** Free pads ranked by how many route cells lie within `range` (ties: row-major order). */
function rankedPads(s: TdState, range: number, minRange: number): [number, number][] {
  const cells = routeCells(s);
  const scored: [number, number, number][] = [];
  for (let y = 0; y < s.world.map.h; y++) {
    for (let x = 0; x < s.world.map.w; x++) {
      if (!isPad(s, x, y) || s.world.entities.some((e) => e.x === x && e.y === y)) continue;
      const n = cells.filter(([cx, cy]) => {
        const d = (cx - x) ** 2 + (cy - y) ** 2;
        return d <= range * range && d >= minRange * minRange;
      }).length;
      scored.push([n, x, y]);
    }
  }
  return scored.sort((a, b) => b[0] - a[0] || a[2] - b[2] || a[1] - b[1]).map(([, x, y]) => [x, y]);
}

export interface Outcome {
  state: TdState;
  /** Threat that got through in the evaluated wave (the whole core when the game would be lost). */
  loss: number;
}

/**
 * Threat the next wave lets through, each leak weighted by the share of health it kept, measured
 * with an unbreakable core: a lost wave is still graded, and wearing a Siege crawler down counts as
 * progress before it is stopped.
 */
const evaluate = (s: TdState, bound = Infinity): number => {
  // In chunks, so that a candidate that can no longer be chosen stops early: once its loss reaches
  // `bound` the exact rest does not matter (planBuild's choice is the same; it only saves time).
  let run = startWave({ ...s, core: 1_000_000 });
  let loss = 0;
  while (run.phase === 'wave' && loss < bound) {
    const step = stepWave(run, CHUNK);
    run = step.state;
    for (const l of step.leaks) loss += (ENEMIES[l.kind].threat * l.hp) / (archetypeOf(TD_RULESET, l.kind)?.hp ?? 1);
  }
  return loss;
};
/** Ticks simulated between two checks of the bound. */
const CHUNK = 64;

export interface PlannerOptions {
  families?: readonly Family[];
  /** Only this branch is ever chosen (single-branch monoculture). */
  branch?: 'a' | 'b';
  /** Pads tried per family and step. */
  pads?: number;
  /** Most actions per build phase. */
  steps?: number;
}

export function planBuild(s: TdState, options: PlannerOptions = {}): TdState {
  const families = options.families ?? (BASE_TOWERS as readonly Family[]);
  const padsPerFamily = options.pads ?? 3;
  let loss = evaluate(s);
  for (let step = 0; step < (options.steps ?? 10) && loss > 0; step++) {
    const candidates: BuildCommand[] = [];
    for (const family of families) {
      const weapon = archetypeOf(TD_RULESET, family)?.weapon;
      if (!weapon) continue;
      for (const [x, y] of rankedPads(s, weapon.range, weapon.minRange).slice(0, padsPerFamily)) candidates.push({ t: 'place', kind: family, x, y });
    }
    for (const e of s.world.entities) {
      if (e.side !== 0) continue;
      for (const kind of TOWERS[e.kind]?.next ?? []) {
        const def = TOWERS[kind]!;
        if (families.includes(def.family) && (!options.branch || def.branch === null || def.branch === options.branch)) candidates.push({ t: 'upgrade', id: e.id, kind });
      }
    }
    // The action that saves the most threat per credit (improvements below 0.01 are rounding noise).
    let best: { s: TdState; loss: number; value: number } | null = null;
    for (const cmd of candidates) {
      if (checkCommand(s, cmd) !== null) continue;
      const next = applyCommand(s, cmd);
      const price = Math.max(1, s.credits - next.credits);
      // Only a loss below this can be chosen: an improvement, and a better value than the best so far.
      const l = evaluate(next, Math.min(loss - 0.01, best ? loss - best.value * price : Infinity));
      const value = (loss - l) / price;
      if (loss - l > 0.01 && (!best || value > best.value)) best = { s: next, loss: l, value };
    }
    if (!best) break;
    s = best.s;
    loss = best.loss;
  }
  return s;
}

/** Random legal builds (deterministic per seed): spends most credits on random families and pads. */
export function randomBuild(s: TdState, seed: number): TdState {
  const rng = createRng(seed);
  for (let i = 0; i < 12; i++) {
    const pads = rankedPads(s, 0, 0);
    if (pads.length === 0) break;
    const [x, y] = rng.pick(pads);
    const next = applyCommand(s, { t: 'place', kind: rng.pick(BASE_TOWERS), x, y });
    s = next;
  }
  return s;
}

export type Bot = (s: TdState, wave: number) => TdState;

/**
 * Plays a game with `bot` building before every wave: to its end, or until `stop` says the build
 * phase reached is all the caller needs to know (tests stop once their condition is decided).
 */
export function play(mapId: string, difficulty: Difficulty, seed: number, bot: Bot, stop: (s: TdState) => boolean = () => false): TdState {
  let s = newGame(seed, difficulty, mapId);
  while (s.phase === 'build' && !stop(s)) {
    s = bot(s, s.wave);
    s = resolveWave(startWave(s)).state;
  }
  return s;
}
