/**
 * Seeded case generator of mode "Clue by clue" (design § 5, § 6.3–6.5, content doc § 2).
 *
 * Calibration by construction: the truth is drawn from the base rate and each clue's result given the truth; the
 * interest filter `accept` reads only the evidence (typed without the truth), so among accepted cases the truth is
 * distributed exactly as the posterior says.
 */
import { createRng, normalizeSeed, seedFromString, type Rng } from '@wp/game-core';
import {
  ROUND_LENGTH,
  cmp,
  countingBoard,
  drawIndex,
  frac,
  gapPp,
  likelihood,
  normalise,
  posteriors,
  reduced,
  weightsAfter,
  startDraft,
  type Clue,
  type ClueCase,
  type ClueEvidence,
  type Frac,
  type Mode,
  type PdState
} from './rules';
import { CLUE_TEMPLATES, hypsFor, type ClueSpec, type ClueTemplate, type Difficulty, type Tier } from './templates';

export const MAX_ATTEMPTS = 200;

const range = (lo: number, hi: number, step = 1): number[] => {
  const out: number[] = [];
  for (let x = lo; x <= hi; x += step) out.push(x);
  return out;
};

/* ---------- Base rates (content doc § 2.1) ---------- */

const EASY_PRIOR = [2, 3, 4, 6, 7, 8];
const MEDIUM_PRIOR = range(5, 95, 5).filter((x) => x !== 50);
const HARD_PRIOR = [10, 20, 25, 40, 50, 100, 200, 300, 400, 600, 700, 800];
/** Triples of multiples of 5, each ≥ 5, sum 100. */
const TRIPLES: readonly number[][] = range(5, 90, 5).flatMap((a) => range(5, 95 - a - 5, 5).map((b) => [a, b, 100 - a - b])).filter((t) => t[2]! >= 5);

function drawPrior(rng: Rng, difficulty: Difficulty, hyps: number): { priorDen: number; prior: number[] } {
  if (hyps === 3) return { priorDen: 100, prior: [...rng.pick(TRIPLES)] };
  if (difficulty === 'easy') {
    const a = rng.pick(EASY_PRIOR);
    return { priorDen: 10, prior: [a, 10 - a] };
  }
  if (difficulty === 'medium') {
    const a = rng.pick(MEDIUM_PRIOR);
    return { priorDen: 100, prior: [a, 100 - a] };
  }
  // Either hypothesis may be the rare one.
  const a = rng.pick(HARD_PRIOR);
  return { priorDen: 1000, prior: rng.int(0, 1) === 0 ? [a, 1000 - a] : [1000 - a, a] };
}

/* ---------- Clue numbers (content doc § 2.2, § 2.3) ---------- */

/** All (fav, oth) pairs of a strength class at a difficulty. */
function pairs(cls: 'strong' | 'weak', difficulty: Difficulty): [number, number][] {
  const out: [number, number][] = [];
  if (difficulty === 'easy') {
    const [favs, oths] = cls === 'strong' ? [[7, 8, 9], [1, 2, 3]] : [[5, 6, 7], [2, 3, 4]];
    for (const f of favs) for (const o of oths) if (cls === 'strong' || f - o >= 2) out.push([f, o]);
    return out;
  }
  const step = difficulty === 'medium' ? 5 : 1;
  if (cls === 'strong') {
    const [fl, fh, ol, oh] = difficulty === 'medium' ? [60, 95, 5, 30] : [55, 99, 1, 30];
    for (const f of range(fl, fh, step)) for (const o of range(ol, oh, step)) if (f >= 2.5 * o) out.push([f, o]);
    return out;
  }
  const [fl, fh, ol, oh, dl, dh] = difficulty === 'medium' ? [40, 80, 20, 60, 15, 35] : [35, 85, 15, 65, 10, 30];
  for (const f of range(fl, fh, step)) for (const o of range(ol, oh, step)) if (f - o >= dl && f - o <= dh) out.push([f, o]);
  return out;
}

const PAIRS = new Map<string, [number, number][]>();
const pairsOf = (cls: 'strong' | 'weak', d: Difficulty) => {
  const key = `${cls}:${d}`;
  let p = PAIRS.get(key);
  if (!p) PAIRS.set(key, (p = pairs(cls, d)));
  return p;
};

const TIER_RANGE: Record<Tier, [number, number]> = { hi: [55, 95], mid: [25, 60], lo: [2, 30] };

function drawTiers(rng: Rng, tiers: readonly [Tier, Tier, Tier]): number[] {
  for (;;) {
    const v = tiers.map((t) => rng.int(...TIER_RANGE[t]));
    const ok = tiers.every((ti, i) =>
      tiers.every((tj, j) => (ti === 'hi' && tj === 'mid' ? v[i]! >= v[j]! + 10 : ti === 'mid' && tj === 'lo' ? v[i]! >= v[j]! + 10 : ti === 'hi' && tj === 'lo' ? v[i]! >= v[j]! + 20 : true))
    );
    if (ok) return v;
  }
}

function drawNumbers(rng: Rng, spec: ClueSpec, difficulty: Difficulty, hyps: number): { den: number; num: number[] } {
  const den = difficulty === 'easy' ? 10 : 100;
  if (spec.kind === 'echo') return { den, num: Array(hyps).fill(den) };
  if (spec.kind === 'neutral') {
    const x = difficulty === 'easy' ? rng.int(3, 7) : difficulty === 'medium' ? rng.pick(range(20, 80, 5)) : rng.int(10, 90);
    return { den, num: Array(hyps).fill(x) };
  }
  if (hyps === 3 && spec.tiers) return { den, num: drawTiers(rng, spec.tiers) };
  const [f, o] = rng.pick(pairsOf(spec.cls, difficulty));
  return { den, num: spec.fav === 0 ? [f, o] : [o, f] };
}

/* ---------- Interest filters (design § 6.4): evidence only ---------- */

const pp = (x: number) => frac(x);
const maxOf = (p: readonly Frac[]): Frac => p.reduce((m, x) => (cmp(x, m) > 0 ? x : m));
const leader = (p: readonly Frac[]): number => p.reduce((best, x, i) => (cmp(x, p[best]!) > 0 ? i : best), 0);

export function accept(c: Omit<ClueCase, 'truth' | 'answers' | 'draft'> | ClueEvidence, difficulty: Difficulty): boolean {
  if ('truth' in c) throw new Error('accept must not see the truth');
  const steps = posteriors(c);
  const n = c.clues.length;
  if (steps.slice(1).some((p) => cmp(maxOf(p), frac(97, 100)) > 0)) return false;
  if (cmp(maxOf(steps[n]!), frac(c.hyps === 3 ? 40 : 55, 100)) < 0) return false;
  if (!steps.slice(1).some((p, k) => cmp(gapPp(p, steps[k]!), pp(15)) >= 0)) return false;
  if (difficulty !== 'easy') {
    const need = pp(difficulty === 'medium' ? 10 : 15);
    if (!c.clues.some((clue, k) => cmp(gapPp(normalise(likelihood(clue)), steps[k + 1]!), need) >= 0)) return false;
  }
  if (difficulty === 'hard') {
    const lead = leader(steps[n]!);
    const informative = (clue: Clue) => !likelihood(clue).every((x, _, l) => x === l[0]);
    const lowers = c.clues.some((clue, k) => informative(clue) && cmp(steps[k + 1]![lead]!, steps[k]![lead]!) < 0);
    const changes = steps.slice(1).some((p) => leader(p) !== lead);
    if (!lowers && !changes) return false;
  }
  const board = countingBoard(c, difficulty === 'easy' ? 100 : difficulty === 'medium' ? 10_000 : 100_000);
  return board !== null;
}

/* ---------- One case ---------- */

function clueCount(difficulty: Difficulty, hyps: number): number {
  return difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : hyps === 3 ? 3 : 4;
}

function attempt(rng: Rng, t: ClueTemplate, difficulty: Difficulty): { evidence: ClueEvidence; truth: number } {
  const hyps = hypsFor(t, difficulty);
  const { priorDen, prior } = drawPrior(rng, difficulty, hyps);
  const normal = t.clues.filter((c) => c.kind === 'normal');
  const count = clueCount(difficulty, hyps);
  const special = difficulty === 'hard' && t.clues.some((c) => c.kind === 'neutral');
  const picked = rng.shuffle(normal).slice(0, special ? count - 1 : count);
  const specs: ClueSpec[] = [...picked];
  const specialAt = special ? rng.int(1, count - 1) : -1;
  const truth = drawIndex(prior, rng);
  const clues: Clue[] = specs.map((spec) => {
    const { den, num } = drawNumbers(rng, spec, difficulty, hyps);
    const result = drawIndex([den - num[truth]!, num[truth]!], rng) as 0 | 1;
    return { id: spec.id, den, num, result };
  });
  if (special) {
    // An echo repeats an earlier clue that was seen (content doc § 2.4); otherwise the neutral clue.
    const echo = t.clues.find((c): c is Extract<ClueSpec, { kind: 'echo' }> => c.kind === 'echo');
    const before = clues.slice(0, specialAt);
    const echoed = echo ? before.find((c) => c.id === echo.of && c.result === 1) : undefined;
    const spec = echoed && echo ? echo : t.clues.find((c) => c.kind === 'neutral')!;
    const { den, num } = drawNumbers(rng, spec, difficulty, hyps);
    const result = spec.kind === 'echo' ? 1 : (drawIndex([den - num[truth]!, num[truth]!], rng) as 0 | 1);
    clues.splice(specialAt, 0, { id: spec.id, den, num, result });
  }
  return { evidence: { template: t.id, hyps, priorDen, prior, clues }, truth };
}

/** Builds one case; after MAX_ATTEMPTS rejections, the last evidence is kept and its truth drawn from the exact posterior. */
export function generateCase(seed: number, t: ClueTemplate, difficulty: Difficulty): ClueCase & { attempts: number } {
  const rng = createRng(seed);
  let last: ClueEvidence | null = null;
  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    const { evidence, truth } = attempt(rng, t, difficulty);
    if (accept(evidence, difficulty)) return { ...finish(evidence, truth), attempts: i };
    last = evidence;
  }
  const truth = drawIndex(reduced(weightsAfter(last!, last!.clues.length)).map(Number), rng);
  return { ...finish(last!, truth), attempts: MAX_ATTEMPTS + 1 };
}

function finish(evidence: ClueEvidence, truth: number): ClueCase {
  const c: ClueCase = { kind: 'clues', ...evidence, truth, answers: [], draft: [] };
  c.draft = startDraft(c, 0);
  return c;
}

/* ---------- A round (design § 5) ---------- */

export function eligible(difficulty: Difficulty): ClueTemplate[] {
  return CLUE_TEMPLATES.filter((t) => !t.retired && t.levels.includes(difficulty)).sort((a, b) => (a.id < b.id ? -1 : 1));
}

export function createRound(seedIn: number, difficulty: Difficulty, mode: Mode = 'clues'): PdState {
  const seed = normalizeSeed(seedIn);
  const rng = createRng(seed);
  const templates = rng.shuffle(eligible(difficulty)).slice(0, ROUND_LENGTH);
  const cases = templates.map((t, i) => {
    const { attempts: _attempts, ...c } = generateCase(seedFromString(`${seed}:${i}`), t, difficulty);
    return c;
  });
  return { v: 1, seed, difficulty, mode, cases, index: 0, reported: false };
}
