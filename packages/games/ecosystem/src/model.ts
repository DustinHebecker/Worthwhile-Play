/**
 * The Pond & Meadow simulation (design § 7): an exact integer stock-and-flow model of one habitat.
 *
 * Everything is integer arithmetic on numbers below 2^53 (`+`, `−`, `*` and the exact floor division `idiv`); no
 * floats in the state, no Math.exp/log/pow and no `**`, so a save replays bit-identically in every engine. All flows
 * of a day are computed from the start-of-day snapshot, limited per source (§ 7.5) and applied together, which keeps
 * every stock non-negative and the nutrient and water balances exact.
 *
 * Deviation from the plan text, kept from the calibration prototype (Appendix B was produced with it): arrivals come
 * only for species that have lived in this habitat (`seen`) — resting eggs, seed banks and visitors from nearby — not
 * for species that were never here. Bookkeeping: `imp` counts the start amount as imported at week 0, so the balance
 * reads `total = imp − exp` (and `w = wimp − wexp`) without storing the start amount separately.
 */
import { DEAD, habitatDef, type Habitat, type HabitatDef } from './habitats';

/** Names equations, parameters and presets (§ 14); a recalibration gets a new id. */
export const MODEL_ID = 'eco-1';
export const MODEL_IDS: readonly string[] = [MODEL_ID];
export const MAX_AMOUNT = 20_000_000;
export const MAX_WEEK = 520;
export const MAX_ACTIONS = 300;
/** Bookkeeping totals (imports, exports) stay far below 2^53; validation bound. */
export const MAX_TOTAL = 35_184_372_088_832; // 2^45, written out: the model avoids the `**` operator (§ 7.1)
export const DAYS = 7;
const M = 1_000_000;

/** ⌊a / b⌋ for integers 0 ≤ a < 2^53, 0 < b < 2^53; exact (corrects the rare double-rounding of a / b). */
export function idiv(a: number, b: number): number {
  let q = Math.floor(a / b);
  if (q * b > a) q -= 1;
  else if ((q + 1) * b <= a) q += 1;
  return q;
}

/** A rate in ppm/day applied to an amount. */
export const pm = (rate: number, x: number): number => idiv(rate * x, M);
/** Monod saturation x / (k + x) in ‰ (0 when both are 0). */
export const sat = (x: number, k: number): number => (x + k === 0 ? 0 : idiv(1000 * x, k + x));
/** Thousands (keeps the squares of the steep responses small). */
export const q = (v: number): number => idiv(v, 1000);
/** Steep (Hill, n = 2) response x² / (k² + x²) in ‰, on thousands (0 when both are 0). */
export function hill(x: number, k: number): number {
  const a = q(x) * q(x);
  const c = q(k) * q(k);
  return a + c === 0 ? 0 : idiv(1000 * a, a + c);
}

export interface Sim {
  /** Weeks run since the start of this simulation (0 … 520). */
  week: number;
  /** Dissolved / soil nutrients, dead matter (u), soil water (w; 0 in the pond). */
  n: number;
  d: number;
  w: number;
  /** Adult amount per species (habitat order). */
  b: number[];
  /** Juveniles per species with a maturation delay: a ring of `delay` weekly slots ([] otherwise). */
  j: number[][];
  /** 1 once a species has lived here: it then keeps arriving by itself (resting eggs, seeds, visitors). */
  seen: number[];
  imp: number;
  exp: number;
  wimp: number;
  wexp: number;
  /** Condition levels (indices into the habitat's condition levels). */
  cond: number[];
}

export type ActionKind = 'add' | 'remove' | 'treat-algae' | 'net-algae' | 'dredge' | 'spray' | 'mow' | 'set';
export const ACTION_KINDS: readonly ActionKind[] = ['add', 'remove', 'treat-algae', 'net-algae', 'dredge', 'spray', 'mow', 'set'];
export const SHARES = [50, 90, 100] as const;
export type Share = (typeof SHARES)[number];

/** One logged change, applied at the start of `week` (before that week runs). */
export interface Action {
  week: number;
  kind: ActionKind;
  species?: string;
  share?: Share;
  cuttings?: 'remove' | 'leave';
  cond?: number;
  level?: number;
}

/** Which actions exist in which habitat. */
export const HABITAT_ACTIONS: Readonly<Record<Habitat, readonly ActionKind[]>> = {
  pond: ['add', 'remove', 'treat-algae', 'net-algae', 'dredge', 'set'],
  meadow: ['add', 'remove', 'spray', 'mow', 'set']
};

/* ---------- Construction and bookkeeping ---------- */

export const emptyRing = (hab: HabitatDef, i: number): number[] => new Array<number>(hab.species[i]!.delay).fill(0);

/** A fresh simulation (week 0, default conditions); every given amount counts as imported at the start. */
export function makeSim(habitat: Habitat, start: { n: number; d: number; w?: number; b: Readonly<Record<string, number>> }): Sim {
  const hab = habitatDef(habitat);
  const b = hab.species.map((s) => start.b[s.id] ?? 0);
  const s: Sim = {
    week: 0,
    n: start.n,
    d: start.d,
    w: start.w ?? 0,
    b,
    j: hab.species.map((_, i) => emptyRing(hab, i)),
    seen: hab.species.map((sp) => (start.b[sp.id] !== undefined ? 1 : 0)),
    imp: 0,
    exp: 0,
    wimp: start.w ?? 0,
    wexp: 0,
    cond: hab.conditions.map(() => 0)
  };
  s.imp = total(s);
  return s;
}

export const cloneSim = (s: Sim): Sim => ({
  week: s.week,
  n: s.n,
  d: s.d,
  w: s.w,
  b: [...s.b],
  j: s.j.map((r) => [...r]),
  seen: [...s.seen],
  imp: s.imp,
  exp: s.exp,
  wimp: s.wimp,
  wexp: s.wexp,
  cond: [...s.cond]
});

/** Amount of species `i`: adults plus juveniles (what the chart and the scene show). */
export function pop(s: Sim, i: number): number {
  let v = s.b[i]!;
  const r = s.j[i]!;
  for (let k = 0; k < r.length; k++) v += r[k]!;
  return v;
}

/** All nutrients in the system: pools plus every living stock. */
export function total(s: Sim): number {
  let t = s.n + s.d;
  for (let i = 0; i < s.b.length; i++) t += pop(s, i);
  return t;
}

/** Exact nutrient and water balance (§ 7.3). */
export const balanced = (s: Sim): boolean => total(s) === s.imp - s.exp && s.w === s.wimp - s.wexp;

/* ---------- Environment and weather ---------- */

export interface Env {
  light: number;
  input: number;
  flow: number;
  rain: number;
}

const condValue = (hab: HabitatDef, s: Sim, c: number, fallback: number): number => (c < 0 ? fallback : hab.conditions[c]!.values[s.cond[c]!]!);

export function envOf(hab: HabitatDef, s: Sim, override?: Partial<Env>): Env {
  return {
    light: override?.light ?? condValue(hab, s, hab.lightCond, 1000),
    input: override?.input ?? condValue(hab, s, hab.inputCond, 0),
    flow: override?.flow ?? condValue(hab, s, hab.flowCond, 0),
    rain: override?.rain ?? condValue(hab, s, hab.rainCond, 0)
  };
}

/** Weekly weather factor ‰ in [700, 1300] (stream 0 = light, 1 = rain); a pure function of seed and week (§ 7.6). */
export function weatherFactor(seed: number, week: number, stream: number): number {
  let s = (seed ^ Math.imul(week + 1, 0x9e3779b1) ^ Math.imul(stream + 1, 0x85ebca6b)) >>> 0;
  s = (s + 0x6d2b79f5) >>> 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const h = (t ^ (t >>> 14)) >>> 0;
  return 700 + (h % 601);
}

/* ---------- One day (§ 7.4) ---------- */

// Stock indices of a flow: nutrients, dead matter, water, then species i at 3 + i.
const N = 0;
const D = 1;
const W = 2;
const IMPORT = -1;
const OUT = -2;
const WOUT = -3;
const EAT = 1000;
const MAX_FLOWS = 256;
const FS = new Int32Array(MAX_FLOWS);
const FT = new Int32Array(MAX_FLOWS);
const FA = new Float64Array(MAX_FLOWS);
let nf = 0;
const flow = (from: number, to: number, amt: number): void => {
  if (amt > 0) {
    FS[nf] = from;
    FT[nf] = to;
    FA[nf] = amt;
    nf++;
  }
};

/** One model day: flows from the start-of-day snapshot, limited per source, applied together (mutates `s`). */
export function stepDay(s: Sim, hab: HabitatDef, env: Env, wLight = 1000, wRain = 1000): void {
  const sp = hab.species;
  const nS = sp.length;
  const b = s.b;
  nf = 0;
  // 1. Producers.
  const L = idiv(env.light * wLight, 1000);
  for (let i = 0; i < nS; i++) {
    const p = sp[i]!;
    const B = b[i]!;
    if (!p.producer || B === 0) continue;
    let lf = L;
    if (p.kL > 0) {
      let shade = 0;
      const sb = p.shadedBy;
      for (let k = 0; k < sb.length; k++) shade += idiv(sb[k]![1] * b[sb[k]![0]]!, 1000);
      lf = p.hill ? idiv(L * hill(p.kL, shade) /* = k²/(k²+S²) */, 1000) : idiv(L * p.kL, p.kL + shade);
    }
    let r = p.mu;
    const ib = p.inhibitedBy;
    for (let k = 0; k < ib.length; k++) r = idiv(r * ib[k]![1], ib[k]![1] + b[ib[k]![0]]!);
    r = idiv(r * Math.min(lf, 1300), 1000);
    if (p.space >= 0) {
      let used = 0;
      for (let k = 0; k < nS; k++) if (sp[k]!.space === p.space) used += b[k]!;
      r = idiv(r * Math.max(0, 1000 - idiv(1000 * used, hab.space[p.space]!)), 1000);
    }
    if (hab.meadow) r = idiv(r * hill(s.w, p.kW), 1000);
    const rFix = p.fix ? idiv(idiv(r * p.fix, 1000) * p.kFix, p.kFix + s.n) : 0;
    r = idiv(r * sat(s.n, p.k), 1000);
    const up = pm(r, B);
    const fx = pm(rFix, B);
    flow(N, 3 + i, up);
    flow(IMPORT, 3 + i, fx);
    if (hab.meadow && p.water) flow(W, WOUT, idiv((up + fx) * p.water, 1000));
  }
  // 2. Consumers (Holling type II, preferences, hiding places, refuges).
  for (let c = 0; c < nS; c++) {
    const e = sp[c]!;
    const C = b[c]!;
    if (e.producer || C === 0) continue;
    let total = 0;
    const om = OMEGA;
    for (let k = 0; k < e.eats.length; k++) {
      const f = e.eats[k]![0];
      const pref = e.eats[k]![1];
      const x = f === DEAD ? s.d : Math.max(0, b[f]! - sp[f]!.hide);
      let wi = idiv(pref * x, 1000);
      if (e.refuge && e.refuge[0] === f) wi = idiv(wi * e.refuge[2], e.refuge[2] + b[e.refuge[1]]!);
      om[k] = wi;
      total += wi;
    }
    if (total === 0) continue;
    const Q = pm(idiv(e.mu * total, e.k + total), C);
    for (let k = 0; k < e.eats.length; k++) {
      const f = e.eats[k]![0];
      flow(f === DEAD ? D : 3 + f, EAT + c, idiv(Q * om[k]!, total));
    }
  }
  // 3. Losses of every present species.
  for (let i = 0; i < nS; i++) {
    const B = b[i]!;
    if (B === 0) continue;
    const p = sp[i]!;
    flow(3 + i, N, pm(p.resp, B));
    flow(3 + i, D, pm(p.mort, B) + (p.m2 ? idiv(pm(p.m2, B) * B, M) : 0));
    if (p.suspended && env.flow) flow(3 + i, OUT, pm(env.flow, B));
  }
  // 4. Pools.
  flow(D, N, pm(hab.decay, s.d));
  flow(D, OUT, pm(hab.burial, s.d));
  if (env.flow) flow(N, OUT, pm(env.flow, s.n));
  if (hab.leach) flow(N, OUT, pm(hab.leach, s.n));
  if (hab.meadow) flow(W, WOUT, pm(hab.evap, s.w));
  // 5. Limit every source and route.
  const nStock = 3 + nS;
  const sum = SUM;
  for (let k = 0; k < nStock; k++) sum[k] = 0;
  for (let f = 0; f < nf; f++) if (FS[f]! >= 0) sum[FS[f]!] = sum[FS[f]!]! + FA[f]!;
  const have = HAVE;
  have[N] = s.n;
  have[D] = s.d;
  have[W] = s.w;
  for (let i = 0; i < nS; i++) have[3 + i] = b[i]!;
  const delta = DELTA;
  for (let k = 0; k < nStock; k++) delta[k] = 0;
  const eaten = EATEN;
  for (let c = 0; c < nS; c++) eaten[c] = 0;
  for (let f = 0; f < nf; f++) {
    const from = FS[f]!;
    const to = FT[f]!;
    let a = FA[f]!;
    if (from === IMPORT) s.imp += a;
    else {
      if (sum[from]! > have[from]!) a = idiv(a * have[from]!, sum[from]!);
      delta[from] = delta[from]! - a;
    }
    if (to === OUT) s.exp += a;
    else if (to === WOUT) s.wexp += a;
    else if (to >= EAT) eaten[to - EAT] = eaten[to - EAT]! + a;
    else delta[to] = delta[to]! + a;
  }
  const slotWeek = s.week;
  for (let c = 0; c < nS; c++) {
    const e = eaten[c]!;
    if (e === 0) continue;
    const p = sp[c]!;
    const a = idiv(e * p.assim, 1000);
    delta[D] = delta[D]! + e - a;
    const ring = s.j[c]!;
    if (p.delay) ring[slotWeek % p.delay] = ring[slotWeek % p.delay]! + a;
    else delta[3 + c] = delta[3 + c]! + a;
  }
  // 6. Inputs (runoff, fertiliser, deposition; rain).
  if (env.input) {
    delta[N] = delta[N]! + env.input;
    s.imp += env.input;
  }
  if (hab.meadow) {
    const rain = idiv(env.rain * wRain, 1000);
    delta[W] = delta[W]! + rain;
    s.wimp += rain;
  }
  // 7. Apply.
  s.n += delta[N]!;
  s.d += delta[D]!;
  s.w += delta[W]!;
  for (let i = 0; i < nS; i++) b[i] = b[i]! + delta[3 + i]!;
  if (hab.meadow && s.w > hab.wMax) {
    s.wexp += s.w - hab.wMax;
    s.w = hab.wMax;
  }
  // 8. Local extinction: a population this small is gone (its adults become dead matter).
  for (let i = 0; i < nS; i++) {
    if (b[i]! > 0 && pop(s, i) < sp[i]!.min) {
      s.d += b[i]!;
      b[i] = 0;
    }
  }
}
const OMEGA = new Float64Array(8);
const SUM = new Float64Array(16);
const HAVE = new Float64Array(16);
const DELTA = new Float64Array(16);
const EATEN = new Float64Array(16);

/* ---------- One week (§ 7.6) ---------- */

export interface RunOptions {
  /** The game's seed (weather). */
  seed?: number;
  /** Changeable weather (explore only). */
  weather?: boolean;
  /** Preset generation only: model values that no condition level offers (e.g. the poor meadow's low input). */
  override?: Partial<Env>;
}

/** One model week: arrivals, seven days, maturation (mutates `s`). */
export function stepWeek(s: Sim, hab: HabitatDef, opts: RunOptions = {}): void {
  const wl = opts.weather ? weatherFactor(opts.seed ?? 0, s.week, 0) : 1000;
  const wr = opts.weather ? weatherFactor(opts.seed ?? 0, s.week, 1) : 1000;
  const sp = hab.species;
  for (let i = 0; i < sp.length; i++) {
    const a = sp[i]!.arrive;
    if (a > 0 && s.seen[i] === 1) {
      s.b[i] = s.b[i]! + a;
      s.imp += a;
    }
  }
  const env = envOf(hab, s, opts.override);
  for (let k = 0; k < DAYS; k++) stepDay(s, hab, env, wl, wr);
  for (let i = 0; i < sp.length; i++) {
    const D = sp[i]!.delay;
    if (!D) continue;
    const slot = (s.week + 1) % D;
    s.b[i] = s.b[i]! + s.j[i]![slot]!;
    s.j[i]![slot] = 0;
  }
  s.week += 1;
}

/* ---------- Interventions (§ 7.7) ---------- */

/** Takes `pct` % (floored) of species `i` (adults and each juvenile slot); returns the amount taken. */
function take(s: Sim, i: number, pct: number): number {
  let got = idiv(s.b[i]! * pct, 100);
  s.b[i] = s.b[i]! - got;
  const r = s.j[i]!;
  for (let k = 0; k < r.length; k++) {
    const x = idiv(r[k]! * pct, 100);
    r[k] = r[k]! - x;
    got += x;
  }
  return got;
}

const idx = (hab: HabitatDef, id: string): number => hab.species.findIndex((sp) => sp.id === id);

/** Applies one change (mutates `s`). Unknown or out-of-habitat actions change nothing (validated elsewhere). */
export function applyAction(s: Sim, hab: HabitatDef, a: Action): void {
  const toDead = (ids: readonly string[], pct: number) => {
    for (const id of ids) s.d += take(s, idx(hab, id), pct);
  };
  const toOut = (ids: readonly string[], pct: number) => {
    for (const id of ids) s.exp += take(s, idx(hab, id), pct);
  };
  switch (a.kind) {
    case 'add': {
      const i = idx(hab, a.species ?? '');
      if (i < 0) return;
      const amt = hab.species[i]!.intro;
      s.b[i] = s.b[i]! + amt;
      s.imp += amt;
      s.seen[i] = 1;
      return;
    }
    case 'remove': {
      const i = idx(hab, a.species ?? '');
      if (i < 0) return;
      s.exp += take(s, i, a.share ?? 100);
      return;
    }
    case 'treat-algae':
      if (!hab.meadow) toDead(['algae', 'bluegreen'], 90);
      return;
    case 'net-algae':
      if (!hab.meadow) toOut(['algae', 'bluegreen', 'duckweed'], 80);
      return;
    case 'dredge':
      if (!hab.meadow) {
        const x = idiv(s.d * 75, 100);
        s.d -= x;
        s.exp += x;
      }
      return;
    case 'spray':
      if (hab.meadow) toDead(['aphids', 'ladybirds'], 90);
      return;
    case 'mow':
      if (hab.meadow) (a.cuttings === 'leave' ? toDead : toOut)(['grass', 'flowers', 'clover'], 70);
      return;
    case 'set': {
      const c = a.cond ?? -1;
      const cd = hab.conditions[c];
      if (cd && Number.isInteger(a.level) && a.level! >= 0 && a.level! < cd.levels.length) s.cond[c] = a.level!;
      return;
    }
  }
}

/* ---------- Running and samples (§ 7.9) ---------- */

/** One weekly sample: [amount of every species…, nutrients, dead matter, water]. */
export function sample(s: Sim): number[] {
  const out: number[] = [];
  for (let i = 0; i < s.b.length; i++) out.push(pop(s, i));
  out.push(s.n, s.d, s.w);
  return out;
}

/**
 * A simulation in progress: the state at `sim.week` with every action of that week already applied, the samples of
 * weeks 0 … sim.week (`samples[w]` taken after week w ran, before the actions of week w + 1; `samples[0]` before any
 * action), and the number of actions applied so far.
 */
export interface Run {
  sim: Sim;
  samples: number[][];
  next: number;
}

/** Actions sorted by week, stable (scripted actions first: pass them first). */
export const sortActions = (actions: readonly Action[]): Action[] =>
  actions
    .map((a, i) => ({ a, i }))
    .sort((x, y) => x.a.week - y.a.week || x.i - y.i)
    .map((x) => x.a);

const applyDue = (run: Run, hab: HabitatDef, actions: readonly Action[]): void => {
  while (run.next < actions.length && actions[run.next]!.week <= run.sim.week) {
    applyAction(run.sim, hab, actions[run.next]!);
    run.next++;
  }
};

/** Starts a run at the start state (its week counts as week 0 of the samples). */
export function startRun(start: Sim, hab: HabitatDef, actions: readonly Action[]): Run {
  const sim = cloneSim(start);
  sim.week = 0;
  const run: Run = { sim, samples: [sample(sim)], next: 0 };
  applyDue(run, hab, actions);
  return run;
}

/** Runs on to `toWeek` (mutates and returns `run`); `actions` must be sorted and the same list as before. */
export function extendRun(run: Run, hab: HabitatDef, actions: readonly Action[], toWeek: number, opts: RunOptions = {}): Run {
  while (run.sim.week < toWeek) {
    stepWeek(run.sim, hab, opts);
    run.samples.push(sample(run.sim));
    applyDue(run, hab, actions);
  }
  return run;
}

/** `simulate` of the design: replays sorted `actions` from `start` to `toWeek`. */
export function simulate(start: Sim, habitat: Habitat, actions: readonly Action[], toWeek: number, opts: RunOptions = {}): Run {
  const hab = habitatDef(habitat);
  const sorted = sortActions(actions);
  return extendRun(startRun(start, hab, sorted), hab, sorted, toWeek, opts);
}

/** Week `w` is calm: every species changed by at most max(1 % of its value, 200 u) since week w − 1 (§ 5.1). */
export function calmWeek(samples: readonly (readonly number[])[], w: number, nSpecies: number): boolean {
  const a = samples[w - 1];
  const c = samples[w];
  if (!a || !c) return false;
  for (let i = 0; i < nSpecies; i++) {
    const v = c[i]!;
    if (Math.abs(v - a[i]!) * 100 > Math.max(v, 20_000)) return false;
  }
  return true;
}

/** The first week ≥ from + 8 that ends 8 calm weeks in a row, or -1. */
export function settledAt(samples: readonly (readonly number[])[], from: number, nSpecies: number): number {
  let streak = 0;
  for (let w = from + 1; w < samples.length; w++) {
    streak = calmWeek(samples, w, nSpecies) ? streak + 1 : 0;
    if (streak >= 8 && w >= from + 8) return w;
  }
  return -1;
}

export const SETTLE_MAX = 156;

/**
 * "Until it settles" (§ 5.1): runs week by week from the current week, at most `SETTLE_MAX` weeks and never past
 * `limit`; returns the run and the week it settled (or -1).
 */
export function runUntilSettled(run: Run, hab: HabitatDef, actions: readonly Action[], limit: number, opts: RunOptions = {}): { run: Run; settled: number } {
  const from = run.sim.week;
  const end = Math.min(limit, from + SETTLE_MAX);
  let streak = 0;
  while (run.sim.week < end) {
    extendRun(run, hab, actions, run.sim.week + 1, opts);
    const w = run.sim.week;
    streak = calmWeek(run.samples, w, hab.species.length) ? streak + 1 : 0;
    if (streak >= 8 && w >= from + 8) return { run, settled: w };
  }
  return { run, settled: -1 };
}

/** Rotates the juvenile rings so that the state can restart at week 0 without changing when juveniles mature. */
export function rebaseWeek(s: Sim): Sim {
  const out = cloneSim(s);
  for (let i = 0; i < out.j.length; i++) {
    const r = s.j[i]!;
    const L = r.length;
    if (!L) continue;
    for (let k = 0; k < L; k++) out.j[i]![(((k - s.week) % L) + L) % L] = r[k]!;
  }
  out.week = 0;
  return out;
}
