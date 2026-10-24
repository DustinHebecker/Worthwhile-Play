/**
 * Seeded case generators (design § 5, § 6.3–6.5, § 7.2, § 8; content doc § 2–5).
 *
 * Calibration by construction: in clue cases the truth is drawn from the base rate and each clue's result given the
 * truth, and the interest filter `accept` reads only the evidence (it throws if it is handed the truth), so among
 * accepted cases the truth is distributed exactly as the posterior says. In checks cases the filter reads only the
 * parameters (no results, no truth), because the player sees only the results of the checks they run.
 */
import { createRng, normalizeSeed, seedFromString, type Rng } from '@wp/game-core';
import {
  analyseChecks,
  cmp,
  countingBoard,
  decideNow,
  drawIndex,
  frac,
  gapPp,
  likelihood,
  myopicValue,
  normalise,
  posteriors,
  reduced,
  roundKinds,
  roundPercents,
  startDraft,
  sub,
  weightsAfter,
  type CaseKind,
  type CaseState,
  type CheckCase,
  type CheckParams,
  type Clue,
  type ClueCase,
  type ClueEvidence,
  type Frac,
  type Mode,
  type PdState,
  type TrapCase
} from './rules';
import {
  CHECK_TEMPLATES,
  CLUE_TEMPLATES,
  hypsFor,
  optionsFor,
  templateById,
  type CheckSpec,
  type CheckTemplate,
  type ClueSpec,
  type ClueTemplate,
  type Difficulty,
  type Tier
} from './templates';
import { TRAP_TEMPLATES, type TrapTemplate } from './traps';

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

function drawPrior(rng: Rng, t: ClueTemplate, difficulty: Difficulty, hyps: number): { priorDen: number; prior: number[] } {
  const o = t.prior;
  if (hyps === 3) {
    if (o?.triples) {
      const a = rng.pick(o.triples.first);
      const c = rng.pick(o.triples.third);
      return { priorDen: 100, prior: [a, 100 - a - c, c] };
    }
    return { priorDen: 100, prior: [...rng.pick(TRIPLES)] };
  }
  const [den, grid] = difficulty === 'easy' ? [10, o?.easy ?? EASY_PRIOR] : difficulty === 'medium' ? [100, o?.medium ?? MEDIUM_PRIOR] : [1000, o?.hard ?? HARD_PRIOR];
  const a = rng.pick(grid);
  return { priorDen: den, prior: [a, den - a] };
}

/* ---------- Clue numbers (content doc § 2.2, § 2.3) ---------- */

type Pair = [number, number];

/** All (fav, oth) pairs of a strength class at a difficulty. */
function pairs(cls: 'strong' | 'weak' | 'rate', difficulty: Difficulty): Pair[] {
  const out: Pair[] = [];
  const add = (favs: number[], oths: number[], ok: (f: number, o: number) => boolean) => {
    for (const f of favs) for (const o of oths) if (ok(f, o)) out.push([f, o]);
  };
  if (difficulty === 'easy') {
    if (cls === 'strong') add([7, 8, 9], [1, 2, 3], () => true);
    else add([5, 6, 7], [2, 3, 4], (f, o) => f - o >= 2);
    return out;
  }
  const step = difficulty === 'medium' ? 5 : 1;
  if (cls === 'rate') {
    if (difficulty === 'medium') add(range(5, 25, 5), range(5, 25, 5), (f, o) => f - o >= 10);
    else add(range(1, 15), range(1, 15), (f, o) => f >= 2 * o);
  } else if (cls === 'strong') {
    const [fl, fh, ol, oh] = difficulty === 'medium' ? [60, 95, 5, 30] : [55, 99, 1, 30];
    add(range(fl, fh, step), range(ol, oh, step), (f, o) => f >= 2.5 * o);
  } else {
    const [fl, fh, ol, oh, dl, dh] = difficulty === 'medium' ? [40, 80, 20, 60, 15, 35] : [35, 85, 15, 65, 10, 30];
    add(range(fl, fh, step), range(ol, oh, step), (f, o) => f - o >= dl && f - o <= dh);
  }
  return out;
}

const PAIRS = new Map<string, Pair[]>();
const pairsOf = (cls: 'strong' | 'weak' | 'rate', d: Difficulty) => {
  const key = `${cls}:${d}`;
  let p = PAIRS.get(key);
  if (!p) PAIRS.set(key, (p = pairs(cls, d)));
  return p;
};

const TIER_RANGE: Record<Tier, [number, number]> = { hi: [55, 95], mid: [25, 60], lo: [2, 30] };
const TIER_GAP: Record<string, number> = { 'hi:mid': 10, 'mid:lo': 10, 'hi:lo': 20 };

function drawTiers(rng: Rng, tiers: readonly [Tier, Tier, Tier]): number[] {
  for (;;) {
    const v = tiers.map((t) => rng.int(...TIER_RANGE[t]));
    if (tiers.every((ti, i) => tiers.every((tj, j) => v[i]! >= v[j]! + (TIER_GAP[`${ti}:${tj}`] ?? -1000)))) return v;
  }
}

/** A rare sign for three hypotheses: each in [1, 15], the favoured one at least twice each other. */
function drawRateTiers(rng: Rng, tiers: readonly [Tier, Tier, Tier]): number[] {
  const hi = tiers.indexOf('hi');
  for (;;) {
    const v = tiers.map(() => rng.int(1, 15));
    if (v.every((x, i) => i === hi || v[hi]! >= 2 * x)) return v;
  }
}

const withFav = ([f, o]: Pair, fav: 0 | 1): number[] => (fav === 0 ? [f, o] : [o, f]);

function drawNumbers(rng: Rng, spec: ClueSpec, difficulty: Difficulty, hyps: number): { den: number; num: number[] } {
  const den = difficulty === 'easy' ? 10 : 100;
  switch (spec.kind) {
    case 'echo':
      return { den, num: Array(hyps).fill(den) };
    case 'neutral': {
      const x = difficulty === 'easy' ? rng.int(3, 7) : difficulty === 'medium' ? rng.pick(range(20, 80, 5)) : rng.int(10, 90);
      return { den, num: Array(hyps).fill(x) };
    }
    case 'fixed':
      return { den, num: spec.nums[difficulty].slice(0, hyps) };
    case 'search': {
      const d = difficulty === 'easy' ? rng.pick([6, 7, 8]) : difficulty === 'medium' ? rng.pick(range(50, 90, 5)) : rng.int(50, 90);
      return { den, num: Array.from({ length: hyps }, (_, h) => (h === spec.fav ? d : 0)) };
    }
    case 'rate':
      if (hyps === 3 && spec.tiers) return { den, num: drawRateTiers(rng, spec.tiers) };
      if (difficulty === 'easy') {
        const e = spec.easy ?? { fav: [3], oth: [1] };
        return { den, num: withFav([rng.pick(e.fav), rng.pick(e.oth)], spec.fav) };
      }
      return { den, num: withFav(rng.pick(pairsOf('rate', difficulty)), spec.fav) };
    case 'normal':
      if (hyps === 3 && spec.tiers) return { den, num: drawTiers(rng, spec.tiers) };
      return { den, num: withFav(rng.pick(pairsOf(spec.cls, difficulty)), spec.fav) };
  }
}

/* ---------- Interest filters (design § 6.4): evidence only ---------- */

const maxOf = (p: readonly Frac[]): Frac => p.reduce((m, x) => (cmp(x, m) > 0 ? x : m));
const leader = (p: readonly Frac[]): number => p.reduce((best, x, i) => (cmp(x, p[best]!) > 0 ? i : best), 0);
const informative = (clue: Clue) => !likelihood(clue).every((x, _, l) => x === l[0]);

export function accept(c: ClueEvidence, difficulty: Difficulty): boolean {
  if ('truth' in c) throw new Error('accept must not see the truth');
  const t = templateById(c.template);
  // The fixed first clue is always seen; a quick search is shown only when it found nothing (content doc § 2.2, § 3.2).
  if (t?.first && (c.clues[0]?.id !== t.first || c.clues[0].result !== 1)) return false;
  if (c.clues.some((clue) => t?.clues.find((s) => s.id === clue.id)?.kind === 'search' && clue.result === 1)) return false;
  const steps = posteriors(c);
  const n = c.clues.length;
  if (steps.slice(1).some((p) => cmp(maxOf(p), frac(97, 100)) > 0)) return false;
  if (cmp(maxOf(steps[n]!), frac(c.hyps === 3 ? 40 : 55, 100)) < 0) return false;
  if (!steps.slice(1).some((p, k) => cmp(gapPp(p, steps[k]!), frac(15)) >= 0)) return false;
  if (difficulty !== 'easy') {
    const need = frac(difficulty === 'medium' ? 10 : 15);
    if (!c.clues.some((clue, k) => cmp(gapPp(normalise(likelihood(clue)), steps[k + 1]!), need) >= 0)) return false;
  }
  if (difficulty === 'hard') {
    const lead = leader(steps[n]!);
    const lowers = c.clues.some((clue, k) => informative(clue) && cmp(steps[k + 1]![lead]!, steps[k]![lead]!) < 0);
    const changes = steps.slice(1).some((p) => leader(p) !== lead);
    if (!lowers && !changes) return false;
  }
  return countingBoard(c, difficulty === 'easy' ? 100 : difficulty === 'medium' ? 10_000 : 100_000) !== null;
}

/* ---------- One clue case ---------- */

function clueCount(t: ClueTemplate, difficulty: Difficulty, hyps: number): number {
  return difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : hyps === 3 ? (t.hardClues ?? 3) : 4;
}

const drawResult = (num: readonly number[], den: number, truth: number, rng: Rng): 0 | 1 => drawIndex([den - num[truth]!, num[truth]!], rng) as 0 | 1;

function attempt(rng: Rng, t: ClueTemplate, difficulty: Difficulty): { evidence: ClueEvidence; truth: number } {
  const hyps = hypsFor(t, difficulty);
  const { priorDen, prior } = drawPrior(rng, t, difficulty, hyps);
  const count = clueCount(t, difficulty, hyps);
  const special = difficulty === 'hard' && t.clues.some((c) => c.kind === 'neutral');
  const k = special ? count - 1 : count;
  const pool = t.clues.filter((c) => c.kind !== 'neutral' && c.kind !== 'echo');
  const first = t.first ? pool.filter((c) => c.id === t.first) : [];
  const rest = pool.filter((c) => c.id !== t.first);
  const specs: ClueSpec[] = [...first, ...(t.ordered ? rest : rng.shuffle(rest))].slice(0, k);
  const specialAt = special ? rng.int(1, count - 1) : -1;
  const drawn = specs.map((spec) => ({ spec, ...drawNumbers(rng, spec, difficulty, hyps) }));
  // Clues whose result the story fixes (the first clue is seen; a quick search found nothing): the truth is drawn
  // from the base rate conditioned on those results, which is exactly rejection sampling on them, without the waste.
  const forced = (spec: ClueSpec): 0 | 1 | null => (spec.id === t.first ? 1 : spec.kind === 'search' ? 0 : null);
  const truth = drawIndex(
    prior.map((w, h) => drawn.reduce((acc, d) => (forced(d.spec) === null ? acc : acc * (forced(d.spec) === 1 ? d.num[h]! : d.den - d.num[h]!)), w)),
    rng
  );
  const clues: Clue[] = drawn.map(({ spec, den, num }) => ({ id: spec.id, den, num, result: forced(spec) ?? drawResult(num, den, truth, rng) }));
  if (special) {
    // An echo repeats an earlier clue that was seen (content doc § 2.4); otherwise the neutral clue.
    const echo = t.clues.find((c): c is Extract<ClueSpec, { kind: 'echo' }> => c.kind === 'echo');
    const echoed = echo ? clues.slice(0, specialAt).find((c) => c.id === echo.of && c.result === 1) : undefined;
    const spec = echoed && echo ? echo : t.clues.find((c) => c.kind === 'neutral')!;
    const { den, num } = drawNumbers(rng, spec, difficulty, hyps);
    clues.splice(specialAt, 0, { id: spec.id, den, num, result: spec.kind === 'echo' ? 1 : drawResult(num, den, truth, rng) });
  }
  return { evidence: { template: t.id, hyps, priorDen, prior, clues }, truth };
}

/** Builds one clue case; after MAX_ATTEMPTS rejections, the last evidence is kept and its truth drawn from the exact posterior. */
export function generateCase(seed: number, t: ClueTemplate, difficulty: Difficulty): ClueCase & { attempts: number } {
  const rng = createRng(seed);
  let last: ClueEvidence | null = null;
  for (let i = 1; i <= MAX_ATTEMPTS; i++) {
    const { evidence, truth } = attempt(rng, t, difficulty);
    if (accept(evidence, difficulty)) return { ...finishClue(evidence, truth), attempts: i };
    last = evidence;
  }
  const truth = drawIndex(reduced(weightsAfter(last!, last!.clues.length)).map(Number), rng);
  return { ...finishClue(last!, truth), attempts: MAX_ATTEMPTS + 1 };
}

function finishClue(evidence: ClueEvidence, truth: number): ClueCase {
  const c: ClueCase = { kind: 'clues', ...evidence, truth, answers: [], draft: [] };
  c.draft = startDraft(c, 0);
  return c;
}

/* ---------- One checks case (design § 7.2, content doc § 4) ---------- */

/** All (fav, oth) pairs of a check class at a difficulty, after the check's narrowing (percent bounds). */
export function checkPairs(spec: CheckSpec, difficulty: Difficulty): Pair[] {
  const out: Pair[] = [];
  const easy = difficulty === 'easy';
  const scale = easy ? 10 : 1;
  const step = difficulty === 'medium' ? 5 : 1;
  const grid = (lo: number, hi: number) => (easy ? range(lo, hi) : range(lo, hi, step));
  let favs: number[];
  let oths: number[];
  let ok: (f: number, o: number) => boolean;
  if (spec.cls === 'weak') [favs, oths, ok] = easy ? [grid(6, 9), grid(1, 5), (f, o) => f - o >= 2] : [grid(55, 90), grid(10, 50), (f, o) => f - o >= 20 && f - o <= 50];
  else if (spec.cls === 'strong') [favs, oths, ok] = easy ? [[8, 9], [1, 2], () => true] : [grid(80, 95), grid(5, 20), () => true];
  else [favs, oths, ok] = easy ? [grid(2, 9), grid(2, 8), (f, o) => f - o >= 0 && f - o <= 1] : [grid(10, 95), grid(10, 85), (f, o) => f - o >= 0 && f - o <= 10];
  for (const f of favs)
    for (const o of oths)
      if (ok(f, o) && (spec.favMin === undefined || f * scale >= spec.favMin) && (spec.diffMax === undefined || (f - o) * scale <= spec.diffMax)) out.push([f, o]);
  return out;
}

const CHECK_PAIRS = new Map<CheckSpec, Map<Difficulty, Pair[]>>();
const checkPairsOf = (spec: CheckSpec, d: Difficulty): Pair[] => {
  let m = CHECK_PAIRS.get(spec);
  if (!m) CHECK_PAIRS.set(spec, (m = new Map()));
  let p = m.get(d);
  if (!p) m.set(d, (p = checkPairs(spec, d)));
  return p;
};

const CHECK_PRIOR: Record<Difficulty, { den: number; grid: number[] }> = {
  easy: { den: 10, grid: [3, 4, 6, 7] },
  medium: { den: 100, grid: range(20, 80, 5) },
  hard: { den: 100, grid: range(10, 90) }
};

/**
 * A fast floating-point screen of the checks filters (same rules as `acceptChecks`, with a tiny tolerance). The exact
 * filter then runs only on candidates that pass the screen.
 */
function screenChecks(p: CheckParams, favs: readonly number[], difficulty: Difficulty): boolean {
  const eps = 1e-9;
  const n = p.checks.length;
  const pay0 = p.options.map((o) => o.pay[0]!);
  const pay1 = p.options.map((o) => o.pay[1]!);
  const l1 = p.checks.map((c) => [c.num[0]! / c.den, c.num[1]! / c.den]);
  // Weights are P(hypothesis, observations so far); values are expected points × that mass. A state is a base-3
  // number (digit c: 0 not run, 1 result 0, 2 result 1).
  const decide = (w0: number, w1: number) => {
    let best = -Infinity;
    for (let d = 0; d < pay0.length; d++) best = Math.max(best, w0 * pay0[d]! + w1 * pay1[d]!);
    return best;
  };
  const memo = new Map<number, number>();
  const pow3 = [1, 3, 9, 27, 81];
  const runQ = (w0: number, w1: number, key: number, c: number): number => {
    let v = -p.checks[c]!.cost * (w0 + w1);
    const a0 = l1[c]![0]!;
    const a1 = l1[c]![1]!;
    if (w0 * (1 - a0) + w1 * (1 - a1) > 0) v += value(w0 * (1 - a0), w1 * (1 - a1), key + pow3[c]!);
    if (w0 * a0 + w1 * a1 > 0) v += value(w0 * a0, w1 * a1, key + 2 * pow3[c]!);
    return v;
  };
  function value(w0: number, w1: number, key: number): number {
    const hit = memo.get(key);
    if (hit !== undefined) return hit;
    let v = decide(w0, w1);
    for (let c = 0; c < n; c++) if (Math.floor(key / pow3[c]!) % 3 === 0) v = Math.max(v, runQ(w0, w1, key, c));
    memo.set(key, v);
    return v;
  }
  const w0 = p.prior[0]! / p.priorDen;
  const w1 = p.prior[1]! / p.priorDen;
  const v0 = value(w0, w1, 0);
  const d0 = decide(w0, w1);
  if (v0 - d0 < 0.5 - eps) return false;
  if (difficulty === 'easy') return true;
  const myopic = (c: number) => {
    const a0 = l1[c]![0]!;
    const a1 = l1[c]![1]!;
    return -p.checks[c]!.cost + decide(w0 * a0, w1 * a1) + decide(w0 * (1 - a0), w1 * (1 - a1)) - d0;
  };
  let negative = false;
  for (let c = 0; c < n; c++) if (myopic(c) < eps) negative = true;
  if (!negative) return false;
  if (difficulty === 'hard') {
    const strength = p.checks.map((c, i) => c.num[favs[i]!]! / c.den);
    const top = Math.max(...strength);
    for (let c = 0; c < n; c++) if (strength[c] === top && runQ(w0, w1, 0, c) >= v0 - eps) return false;
  }
  return true;
}

/** The filters of design § 7.2 (parameters only). `favs[i]` is the hypothesis check i points to. */
export function acceptChecks(p: CheckParams, favs: readonly number[], difficulty: Difficulty): boolean {
  if ('results' in p || 'truth' in p) throw new Error('acceptChecks must not see results or the truth');
  const a = analyseChecks(p);
  if (cmp(sub(a.value([]), decideNow(p, [])), frac(1, 2)) < 0) return false;
  if (difficulty === 'easy') return true;
  if (!p.checks.some((_, i) => myopicValue(p, i).n < 0n)) return false;
  if (difficulty === 'hard') {
    const strength = p.checks.map((c, i) => c.num[favs[i]!]! / c.den);
    const top = Math.max(...strength);
    const best = a.best([]);
    if (best.some((x) => x.kind === 'run' && strength[x.check] === top)) return false;
  }
  return true;
}

export function generateChecks(seed: number, t: CheckTemplate, difficulty: Difficulty): CheckCase & { attempts: number } {
  const rng = createRng(seed);
  const options = optionsFor(t, difficulty);
  const count = difficulty === 'easy' ? 3 : 4;
  let params: CheckParams | null = null;
  let chosen: CheckSpec[] = [];
  let attempts = 0;
  for (attempts = 1; attempts <= MAX_ATTEMPTS; attempts++) {
    const g = CHECK_PRIOR[difficulty];
    const a = rng.pick(g.grid);
    chosen = rng.shuffle(t.checks).slice(0, count);
    chosen.sort((x, y) => t.checks.indexOf(x) - t.checks.indexOf(y));
    const den = difficulty === 'easy' ? 10 : 100;
    params = {
      priorDen: g.den,
      prior: [a, g.den - a],
      checks: chosen.map((spec) => ({
        den,
        num: withFav(rng.pick(checkPairsOf(spec, difficulty)), spec.fav),
        cost: difficulty === 'easy' ? Math.min(...spec.cost) : rng.pick(spec.cost)
      })),
      options: options.map((o) => {
        const pa = rng.pick(o.a);
        return { pay: [pa, o.b === 'same' ? pa : rng.pick(o.b)] };
      })
    };
    const favs = chosen.map((c) => c.fav);
    if (screenChecks(params, favs, difficulty) && acceptChecks(params, favs, difficulty)) break;
  }
  const p = params!;
  const truth = drawIndex(p.prior, rng);
  return {
    kind: 'checks',
    template: t.id,
    priorDen: p.priorDen,
    prior: p.prior,
    checks: p.checks.map((c, i) => ({ id: chosen[i]!.id, den: c.den, num: c.num, cost: c.cost, result: drawResult(c.num, c.den, truth, rng) })),
    options: p.options.map((o, i) => ({ id: options[i]!.id, pay: o.pay })),
    truth,
    done: [],
    deciding: false,
    draft: roundPercents(normalise(p.prior)),
    choice: null,
    answer: null,
    decision: null,
    attempts
  };
}

/* ---------- One trap case ---------- */

export function generateTrap(seed: number, t: TrapTemplate, difficulty: Difficulty): TrapCase {
  const rng = createRng(seed);
  let params = t.draw(rng, difficulty);
  for (let i = 0; i < MAX_ATTEMPTS && !t.valid(params, difficulty); i++) params = t.draw(rng, difficulty);
  return { kind: 'trap', template: t.id, params, drafts: t.questions(params).map(() => null), answers: null };
}

/* ---------- A round (design § 5) ---------- */

const byId = <T extends { id: string }>(a: T, b: T) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

export function eligible(difficulty: Difficulty): ClueTemplate[] {
  return CLUE_TEMPLATES.filter((t) => !t.retired && t.levels.includes(difficulty)).sort(byId);
}
export const eligibleChecks = (difficulty: Difficulty): CheckTemplate[] => CHECK_TEMPLATES.filter((t) => !t.retired && t.levels.includes(difficulty)).sort(byId);
export const eligibleTraps = (difficulty: Difficulty): TrapTemplate[] => TRAP_TEMPLATES.filter((t) => !t.retired && t.levels.includes(difficulty)).sort(byId);

export function createRound(seedIn: number, difficulty: Difficulty, mode: Mode = 'clues'): PdState {
  const seed = normalizeSeed(seedIn);
  const rng = createRng(seed);
  const queues: Record<CaseKind, string[]> = {
    clues: rng.shuffle(eligible(difficulty)).map((t) => t.id),
    checks: rng.shuffle(eligibleChecks(difficulty)).map((t) => t.id),
    trap: rng.shuffle(eligibleTraps(difficulty)).map((t) => t.id)
  };
  const cases: CaseState[] = roundKinds(mode).map((kind, i) => {
    const id = queues[kind].shift()!;
    const sub = seedFromString(`${seed}:${i}`);
    if (kind === 'clues') {
      const { attempts: _a, ...c } = generateCase(sub, CLUE_TEMPLATES.find((t) => t.id === id)!, difficulty);
      return c;
    }
    if (kind === 'checks') {
      const { attempts: _a, ...c } = generateChecks(sub, CHECK_TEMPLATES.find((t) => t.id === id)!, difficulty);
      return c;
    }
    return generateTrap(sub, TRAP_TEMPLATES.find((t) => t.id === id)!, difficulty);
  });
  return { v: 1, seed, difficulty, mode, cases, index: 0, reported: false };
}
