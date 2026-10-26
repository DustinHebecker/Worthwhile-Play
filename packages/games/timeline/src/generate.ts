/**
 * The round generator (design § 6, § 11): seeded, pure. Every item gets its own sub-seed, the pools follow the span
 * and the difficulty's tiers (with fill-up), and every compared pair is separated on the log scale relative to the
 * span's width, so no question is a coin toss.
 */
import { createRng, seedFromString, type Rng } from '@wp/game-core';
import { ALL, CURATED, ev, type Ev } from './data';
import { fairRung, gapOptions, tauFor } from './score';
import { sep, u, type Era } from './time';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Span = 'all' | Era;
export type Mode = 'when' | 'order' | 'first' | 'together';
export type RoundMode = Mode | 'mixed';

export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard'];
export const SPANS: readonly Span[] = ['all', 'deep', 'early', 'middle', 'modern'];
export const MODES: readonly RoundMode[] = ['when', 'order', 'first', 'together', 'mixed'];

/** The kinds of the items of a round (§ 6). */
export const ROUND_KINDS: Readonly<Record<RoundMode, readonly Mode[]>> = {
  when: Array<Mode>(8).fill('when'),
  order: Array<Mode>(4).fill('order'),
  first: Array<Mode>(8).fill('first'),
  together: Array<Mode>(6).fill('together'),
  mixed: ['when', 'first', 'order', 'together', 'when', 'first']
};

export const TIERS: Readonly<Record<Difficulty, readonly number[]>> = { easy: [1], medium: [1, 2], hard: [1, 2, 3] };
/** Tiers that join when the difficulty's pool is too small or after 100 failed attempts (§ 11.1). */
export const FILL: Readonly<Record<Difficulty, readonly number[]>> = { easy: [2, 3], medium: [3], hard: [] };
export const ORDER_SIZE: Readonly<Record<Difficulty, number>> = { easy: 4, medium: 5, hard: 6 };
/** Required separation of compared pairs: width(span) / k (§ 11.2). */
export const PAIR_K: Readonly<Record<Difficulty, number>> = { easy: 8, medium: 16, hard: 48 };
export const TOGETHER_K: Readonly<Record<Difficulty, number>> = { easy: 8, medium: 16, hard: 32 };
export const ATTEMPTS = 300;
export const MAX_CURATED = 2;

/** Items as created (drafts empty, nothing answered). */
export interface NewWhen {
  readonly kind: 'when';
  readonly event: string;
  readonly anchors: string[];
}
export interface NewOrder {
  readonly kind: 'order';
  readonly events: string[];
}
export interface NewFirst {
  readonly kind: 'first';
  readonly a: string;
  readonly b: string;
  readonly pair: string | null;
  readonly gaps: number[];
  readonly gapIndex: number;
}
export interface NewTogether {
  readonly kind: 'together';
  readonly focus: string;
  readonly tau: number;
  readonly options: string[];
  readonly correct: number;
}
export type NewItem = NewWhen | NewOrder | NewFirst | NewTogether;

/** Events of a span that may appear in new rounds. */
export function spanPool(span: Span): readonly Ev[] {
  return ALL.filter((e) => !e.retired && (span === 'all' || e.era === span));
}

const widthCache = new Map<Span, number>();
/** The span's width on the log scale: from its oldest `lo` to its newest `hi` (§ 11.2). */
export function spanWidth(span: Span): number {
  const hit = widthCache.get(span);
  if (hit !== undefined) return hit;
  const pool = spanPool(span);
  const w = u(Math.min(...pool.map((e) => e.lo))) - u(Math.max(...pool.map((e) => e.hi)));
  widthCache.set(span, w);
  return w;
}

/** Required separation of compared events (order, first) and of "same time" distractors from the window. */
export const pairSep = (span: Span, d: Difficulty): number => spanWidth(span) / PAIR_K[d];
export const togetherSep = (span: Span, d: Difficulty): number => spanWidth(span) / TOGETHER_K[d];

/** The window of a "same time" focus: its range widened by τ on both sides. */
export function windowOf(focus: Ev, tau: number): { lo: number; hi: number } {
  return { lo: focus.lo - tau, hi: focus.hi + tau };
}

interface Ctx {
  readonly span: Span;
  readonly d: Difficulty;
  readonly pool: readonly Ev[];
  readonly used: Set<string>;
  /** Fallback (1) in force: used events may return. */
  allowUsed: boolean;
}

/** Candidates for a subject at an attempt: the difficulty's tiers, then the fill tiers (§ 11.1). */
function candidates(c: Ctx, attempt: number, need: number): Ev[] {
  const tiers = [...TIERS[c.d]];
  const fill = FILL[c.d];
  const free = (e: Ev) => (c.allowUsed || !c.used.has(e.id)) && tiers.includes(e.tier);
  let list = c.pool.filter(free);
  let f = 0;
  // Fill-up: when too small, and one more fill tier after every 100 failed attempts.
  while (f < fill.length && (list.length < need || attempt >= 100 * (f + 1))) {
    tiers.push(fill[f]!);
    f++;
    list = c.pool.filter(free);
  }
  return list;
}

/** Greedy seeded draw of `n` events with every pair separated by at least `min` decades. */
function drawSeparated(rng: Rng, list: readonly Ev[], n: number, min: number): Ev[] | null {
  const chosen: Ev[] = [];
  for (const e of rng.shuffle(list)) {
    if (chosen.every((x) => sep(x, e) >= min)) chosen.push(e);
    if (chosen.length === n) return chosen;
  }
  return null;
}

const isSorted = (list: readonly Ev[]): boolean => list.every((e, i) => i === 0 || list[i - 1]!.y <= e.y);

function makeOrder(rng: Rng, c: Ctx, n: number): NewOrder | null {
  const min = pairSep(c.span, c.d);
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const set = drawSeparated(rng, candidates(c, attempt, n), n, min);
    if (!set) continue;
    let shown = rng.shuffle(set);
    if (isSorted(shown)) shown = [...shown].reverse();
    return { kind: 'order', events: shown.map((e) => e.id) };
  }
  return null;
}

function eligiblePairs(c: Ctx): typeof CURATED {
  const tiers = [...TIERS[c.d], ...FILL[c.d]];
  const ok = (id: string) => {
    const e = ev(id);
    return !!e && !e.retired && c.pool.includes(e) && tiers.includes(e.tier) && (c.allowUsed || !c.used.has(id));
  };
  const min = pairSep(c.span, c.d);
  return CURATED.filter((p) => ok(p.older) && ok(p.newer) && sep(ev(p.older)!, ev(p.newer)!) >= min);
}

function makeFirst(rng: Rng, c: Ctx, curatedLeft: boolean): NewFirst | null {
  const min = pairSep(c.span, c.d);
  let pair: { a: Ev; b: Ev; id: string | null } | null = null;
  if (curatedLeft && rng.next() < 0.5) {
    const pairs = eligiblePairs(c);
    if (pairs.length) {
      const p = rng.pick(pairs);
      pair = { a: ev(p.older)!, b: ev(p.newer)!, id: p.id };
    }
  }
  for (let attempt = 0; !pair && attempt < ATTEMPTS; attempt++) {
    const two = drawSeparated(rng, candidates(c, attempt, 2), 2, min);
    if (two) pair = { a: two[0]!, b: two[1]!, id: null };
  }
  if (!pair) return null;
  const [a, b] = rng.next() < 0.5 ? [pair.a, pair.b] : [pair.b, pair.a];
  let gaps: number[] = [];
  let gapIndex = -1;
  if (c.d !== 'easy') {
    const [earlier, later] = a.y < b.y ? [a, b] : [b, a];
    const rung = fairRung(c.d, earlier, later);
    if (rung !== null) {
      const o = gapOptions(c.d, rung, rng.int(0, 3));
      gaps = o.values;
      gapIndex = o.index;
    }
  }
  return { kind: 'first', a: a.id, b: b.id, pair: pair.id, gaps, gapIndex };
}

/** Options of a "same time" item: tiers of the difficulty plus the first fill tier (§ 10.2). */
function optionPool(c: Ctx, focus: Ev): Ev[] {
  const tiers = [...TIERS[c.d], ...FILL[c.d].slice(0, 1)];
  return c.pool.filter((e) => e.id !== focus.id && tiers.includes(e.tier));
}

function makeTogether(rng: Rng, c: Ctx): NewTogether | null {
  const delta = togetherSep(c.span, c.d);
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const list = candidates(c, attempt, 1);
    if (!list.length) return null;
    const focus = rng.pick(list);
    const tau = tauFor(focus.y);
    const w = windowOf(focus, tau);
    const opts = optionPool(c, focus);
    const inside = opts.filter((e) => e.hi >= w.lo && e.lo <= w.hi);
    const outside = opts.filter((e) => sep(e, w) >= delta);
    if (!inside.length || outside.length < 2) continue;
    const right = rng.pick(inside);
    const others = rng.shuffle(outside).slice(0, 2);
    const options = rng.shuffle([right, ...others]);
    return { kind: 'together', focus: focus.id, tau, options: options.map((e) => e.id), correct: options.indexOf(right) };
  }
  return null;
}

/** Reference events on the axis of a "when" item (§ 7.4): tier 1, never overlapping the target. */
export function anchorsFor(rng: Rng, target: Ev, d: Difficulty): string[] {
  if (d === 'hard') return [];
  const refs = ALL.filter((e) => !e.retired && e.tier === 1 && e.id !== target.id && sep(e, target) > 0);
  const tu = u(target.y);
  const byDist = [...refs].sort((p, q) => Math.abs(u(p.y) - tu) - Math.abs(u(q.y) - tu) || (p.id < q.id ? -1 : 1));
  if (d === 'medium') return byDist.slice(0, 1).map((e) => e.id);
  const older = refs.filter((e) => e.hi < target.lo).sort((p, q) => q.y - p.y)[0];
  const newer = refs.filter((e) => e.lo > target.hi).sort((p, q) => p.y - q.y)[0];
  const chosen = [older, newer].filter((e): e is Ev => !!e);
  const rest = refs.filter((e) => !chosen.includes(e) && chosen.every((x) => Math.abs(u(x.y) - u(e.y)) >= 0.3));
  while (chosen.length < 3 && rest.length) {
    const far = rng.pick(rest);
    chosen.push(far);
    rest.splice(rest.indexOf(far), 1);
  }
  return chosen.map((e) => e.id);
}

function makeWhen(rng: Rng, c: Ctx): NewWhen | null {
  const list = candidates(c, 0, 1);
  if (!list.length) return null;
  const target = rng.pick(list);
  return { kind: 'when', event: target.id, anchors: anchorsFor(rng, target, c.d) };
}

/** The events an item is about (they are not reused as subjects in the same round, § 6). */
export function subjects(item: NewItem): string[] {
  switch (item.kind) {
    case 'when':
      return [item.event];
    case 'order':
      return [...item.events];
    case 'first':
      return [item.a, item.b];
    case 'together':
      return [item.focus];
  }
}

export interface Generated {
  readonly items: NewItem[];
  /** Fallbacks used per item index (§ 11.3): 1 = used events allowed, 2 = one card fewer, 3 = a "when" item instead. */
  readonly fallbacks: readonly { readonly index: number; readonly level: 1 | 2 | 3 }[];
}

/** Generates the items of a round (deterministic in its arguments). */
export function generateRound(seed: number, d: Difficulty, mode: RoundMode, span: Span): Generated {
  const c: Ctx = { span, d, pool: spanPool(span), used: new Set(), allowUsed: false };
  const items: NewItem[] = [];
  const fallbacks: { index: number; level: 1 | 2 | 3 }[] = [];
  let curated = 0;
  ROUND_KINDS[mode].forEach((kind, index) => {
    const sub = seedFromString(`${seed}:${index}`);
    const make = (allowUsed: boolean, size?: number): NewItem | null => {
      const rng = createRng(sub);
      c.allowUsed = allowUsed;
      switch (kind) {
        case 'when':
          return makeWhen(rng, c);
        case 'order':
          return makeOrder(rng, c, size ?? ORDER_SIZE[d]);
        case 'first':
          return makeFirst(rng, c, curated < MAX_CURATED);
        case 'together':
          return makeTogether(rng, c);
      }
    };
    let item = make(false);
    if (!item) {
      item = make(true);
      if (item) fallbacks.push({ index, level: 1 });
    }
    for (let n = ORDER_SIZE[d] - 1; !item && kind === 'order' && n >= 3; n--) {
      item = make(true, n);
      if (item) fallbacks.push({ index, level: 2 });
    }
    if (!item) {
      c.allowUsed = true;
      item = makeWhen(createRng(sub), c)!;
      fallbacks.push({ index, level: 3 });
    }
    c.allowUsed = false;
    if (item.kind === 'first' && item.pair) curated++;
    for (const id of subjects(item)) c.used.add(id);
    items.push(item);
  });
  return { items, fallbacks };
}
