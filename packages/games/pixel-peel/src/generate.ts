import { createRng, normalizeSeed, type Rng } from '@wp/game-core';
import { MOTIFS, findMotif } from './motifs/index';
import type { Motif } from './motifs/types';
import { EMPTY, exposedCells, initialPosition, launch, replay, toDifficulty, type Difficulty, type Move, type PeelState, type Picture, type Shooter } from './rules';
import { obviousPlay, solve } from './solver';

/**
 * The generator (design § 9.2). It peels the picture once in a fixed, seeded way so that every shooter is used up
 * exactly when launched (`peelPlan`), deals those shooters into lanes in that order (the base deal, solvable by
 * construction), and on medium and hard moves some late shooters forward. A perturbed candidate is kept only when the
 * solver finds a solution, which becomes the stored witness. All randomness comes from one `createRng(seed)` in a
 * fixed draw order; budgets count nodes, never time.
 */

export interface Level {
  lanes: number;
  slots: number;
  /** Shots aimed for per shooter. */
  pack: readonly [number, number];
  /** Shooters moved forward in their lanes. */
  moves: readonly [number, number];
  attempts: number;
  /** Solver budget per candidate (expanded nodes). */
  budget: number;
}

export const LEVELS: Readonly<Record<Difficulty, Level>> = {
  easy: { lanes: 2, slots: 5, pack: [14, 30], moves: [0, 0], attempts: 0, budget: 0 },
  medium: { lanes: 3, slots: 3, pack: [10, 24], moves: [6, 10], attempts: 8, budget: 4000 },
  hard: { lanes: 3, slots: 2, pack: [12, 28], moves: [10, 14], attempts: 12, budget: 4000 }
};

export const pictureOf = (motif: Motif): Picture => ({
  w: (motif.rows[0] ?? '').length,
  h: motif.rows.length,
  rows: [...motif.rows],
  palette: Object.entries(motif.palette).map(([key, [hex, name]]) => ({ key, hex, name })),
  backdrop: motif.backdrop
});

/** Shooters in an order in which each launch is used up exactly (the "peel plan"). */
export function peelPlan(picture: Picture, pack: readonly [number, number], rng: Rng): Shooter[] {
  const { w, h } = picture;
  let cells = picture.rows.join('').split('');
  const order: Shooter[] = [];
  const keys = picture.palette.map((p) => p.key);
  while (cells.some((c) => c !== EMPTY)) {
    const a = rng.int(pack[0], pack[1]);
    const onEdge = new Set(exposedCells(cells, w, h).map((i) => cells[i]));
    const options = keys
      .filter((c) => onEdge.has(c))
      .map((c) => ({ c, result: launch(cells, w, h, { c, n: a }) }))
      .filter((o) => o.result.hits.length > 0);
    const good = options.filter((o) => o.result.hits.length >= pack[0]);
    let chosen = options[0]!;
    if (good.length > 0) {
      let r = rng.int(1, good.reduce((sum, o) => sum + o.result.hits.length, 0));
      for (const o of good) {
        r -= o.result.hits.length;
        if (r <= 0) {
          chosen = o;
          break;
        }
      }
    } else for (const o of options) if (o.result.hits.length > chosen.result.hits.length) chosen = o;
    order.push({ c: chosen.c, n: chosen.result.hits.length });
    cells = chosen.result.cells;
  }
  return order;
}

interface Dealt extends Shooter {
  /** Position in the peel plan (late = covered for long). */
  w: number;
}

/** Order-preserving deal: each shooter to a lane drawn by `rng`, lane lengths within 2 of the shortest. */
export function deal(order: readonly Shooter[], lanes: number, rng: Rng): { lanes: Dealt[][]; witness: Move[] } {
  const out: Dealt[][] = Array.from({ length: lanes }, () => []);
  const witness: Move[] = [];
  order.forEach((s, w) => {
    const shortest = Math.min(...out.map((l) => l.length));
    const allowed = out.map((l, i) => (l.length + 1 <= shortest + 2 ? i : -1)).filter((i) => i >= 0);
    const lane = rng.pick(allowed);
    out[lane]!.push({ ...s, w });
    witness.push(`L${lane}`);
  });
  return { lanes: out, witness };
}

/** Moves `count` shooters (lane position ≥ 1, weighted towards late plan positions) forward by 1–3 places. */
export function perturb(lanes: readonly Dealt[][], count: number, rng: Rng): Dealt[][] {
  const out = lanes.map((l) => l.slice());
  for (let m = 0; m < count; m++) {
    const options: { lane: number; at: number; weight: number }[] = [];
    out.forEach((lane, i) => lane.forEach((s, at) => at >= 1 && options.push({ lane: i, at, weight: s.w + 1 })));
    if (options.length === 0) break;
    let r = rng.int(1, options.reduce((sum, o) => sum + o.weight, 0));
    let pick = options[0]!;
    for (const o of options) {
      r -= o.weight;
      if (r <= 0) {
        pick = o;
        break;
      }
    }
    const to = Math.max(0, pick.at - rng.int(1, 3));
    const lane = out[pick.lane]!;
    const [s] = lane.splice(pick.at, 1);
    lane.splice(to, 0, s!);
  }
  return out;
}

const strip = (lanes: readonly Dealt[][]): Shooter[][] => lanes.map((l) => l.map(({ c, n }) => ({ c, n })));

/** 2: the obvious play fails; 1: the solution parks at least once; 0: otherwise. */
export function quality(picture: Picture, lanes: Shooter[][], slots: number, solution: readonly Move[]): number {
  const start = initialPosition({ picture, lanes, slots });
  if (!obviousPlay(start).solved) return 2;
  return (replay(start, solution)?.parks ?? 0) > 0 ? 1 : 0;
}

export interface Generated {
  picture: Picture;
  lanes: Shooter[][];
  slots: number;
  witness: Move[];
  quality: number;
  /** Candidates whose solution was found (for tests and the implementation notes). */
  solvedCandidates: number;
  perturbed: boolean;
}

export function generate(motif: Motif, difficulty: Difficulty, rng: Rng): Generated {
  const level = LEVELS[difficulty];
  const picture = pictureOf(motif);
  const order = peelPlan(picture, level.pack, rng);
  const base = deal(order, level.lanes, rng);
  let best: Generated = { picture, lanes: strip(base.lanes), slots: level.slots, witness: base.witness, quality: -1, solvedCandidates: 0, perturbed: false };
  let solvedCandidates = 0;
  // Perturbations accumulate: each attempt builds on the last solvable candidate, so the disorder grows step by step
  // while every accepted step stays proven solvable.
  let current = base.lanes;
  for (let attempt = 0; attempt < level.attempts; attempt++) {
    const dealt = perturb(current, rng.int(level.moves[0], level.moves[1]), rng);
    const lanes = strip(dealt);
    const result = solve(initialPosition({ picture, lanes, slots: level.slots }), level.budget);
    if (!('solution' in result)) continue;
    current = dealt;
    solvedCandidates++;
    const q = quality(picture, lanes, level.slots, result.solution);
    if (q >= best.quality) best = { picture, lanes, slots: level.slots, witness: result.solution, quality: q, solvedCandidates, perturbed: true };
    if (q === 2) break;
  }
  if (best.quality < 0) best = { ...best, quality: quality(picture, best.lanes, best.slots, best.witness) };
  return { ...best, solvedCandidates };
}

/** Resolves the start-screen choice: `any` or a known motif id; anything else counts as `any`. */
export const toChoice = (value: unknown): string => (typeof value === 'string' && findMotif(value) ? value : 'any');

export function createInitial(seed: number, difficulty: unknown = 'easy', choice: unknown = 'any'): PeelState {
  const s = normalizeSeed(seed);
  const d = toDifficulty(difficulty);
  const c = toChoice(choice);
  const rng = createRng(s);
  const motif = c === 'any' ? (MOTIFS[rng.int(0, MOTIFS.length - 1)] as Motif) : (findMotif(c) as Motif);
  const g = generate(motif, d, rng);
  return {
    seed: s,
    difficulty: d,
    choice: c,
    motif: motif.id,
    picture: g.picture,
    lanes: g.lanes,
    slots: g.slots,
    witness: g.witness,
    moves: [],
    restartUndo: null,
    reported: false
  };
}
