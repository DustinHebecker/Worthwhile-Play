/**
 * Content checker (docs/design/adventures.md § 8.3). Test-time only: games call it from their test
 * suites (`@wp/adventure-engine/check`), so it is never part of a game chunk.
 */
import { compile, type Compiled } from '../compile';
import { MAX_HOPS } from '../engine';
import { textKeys } from '../text';
import type { Adventure, Cond, Effect, Rule, Shape } from '../types';
import { canFinish, explore, openGoals, pathTo, type Exploration } from './explore';

export { abstractOf, keyOf, moves, startState, type AState, type Move } from './interpret';
export { canFinish, explore, pathTo, type Exploration } from './explore';

/** Scene view box (docs/design/adventures.md § 6). */
export const VIEW_W = 1600;
export const VIEW_H = 900;
/** 44 CSS px at the minimum scene width of 640 px. */
export const MIN_TARGET = 110;
export const DEFAULT_BUDGET = 200_000;

export type Catalogues = Readonly<Record<string, Readonly<Record<string, string>>>>;

export interface CheckOptions {
  /** Content text per locale; the first locale listed (or `en`) is the reference. */
  readonly texts?: Catalogues;
  readonly budget?: number;
}

export interface CheckReport {
  /** Problems that make the adventure unfit to ship (dead ends, unreachable endings, missing texts …). */
  readonly errors: string[];
  /** Things to look at (tiny hotspots, flags never read …). */
  readonly warnings: string[];
  readonly metrics: {
    readonly states: number;
    readonly edges: number;
    /** Actions on the shortest path to any ending (-1: none). */
    readonly shortestSolution: number;
    readonly endings: Readonly<Record<string, number>>;
  };
}

const show = (path: readonly unknown[]): string => (path.length === 0 ? '(start)' : path.map((a) => JSON.stringify(a)).join(' → '));
const PLACEHOLDER = /\{(\w+)\}/g;
const placeholders = (t: string): string => [...t.matchAll(PLACEHOLDER)].map((m) => m[1]).sort().join(',');

/** Keys a rule, an onEnter rule, a dialogue, a chapter or an ending produces — the coverage targets. */
const isRuleKey = (k: string): boolean => {
  const parts = k.split('.');
  const kind = parts[0] ?? '';
  if (kind === 'goal' || kind === 'item' || kind === 'clue') return false;
  if (kind === 'scene') return parts.length !== 3;
  if (kind === 'hs') return parts.length !== 4;
  return true;
};

function* conds(c: Cond): Generator<Cond> {
  yield c;
  if ('all' in c) for (const x of c.all) yield* conds(x);
  if ('any' in c) for (const x of c.any) yield* conds(x);
  if ('not' in c) yield* conds(c.not);
}

/** Every condition and effect of the content, for the static usage checks. */
function usage(adv: Adventure): { conds: Cond[]; effects: Effect[] } {
  const cs: Cond[] = [];
  const es: Effect[] = [];
  const addCond = (c: Cond | undefined): void => void (c && cs.push(...conds(c)));
  const rules = (list: readonly Rule[] | undefined): void =>
    list?.forEach((r) => {
      addCond(r.when);
      es.push(...(r.then ?? []));
    });
  for (const sc of adv.scenes) {
    rules(sc.onEnter);
    for (const hs of sc.hotspots) {
      addCond(hs.visible);
      Object.values(hs.on ?? {}).forEach(rules);
      Object.values(hs.items ?? {}).forEach(rules);
      Object.values(hs.clues ?? {}).forEach(rules);
    }
  }
  adv.combinations.forEach((x) => rules(x.rules));
  adv.deductions.forEach((x) => rules(x.rules));
  for (const d of adv.dialogues) for (const n of d.nodes) for (const o of n.options) {
    addCond(o.when);
    es.push(...(o.then ?? []));
  }
  for (const g of adv.goals) {
    addCond(g.active);
    addCond(g.done);
  }
  adv.chapters.forEach((ch) => addCond(ch.done));
  adv.endings.forEach((e) => addCond(e.when));
  return { conds: cs, effects: es };
}

const bbox = (s: Shape): { x0: number; y0: number; x1: number; y1: number } => {
  if ('points' in s) {
    const xs = s.points.map((p) => p[0]);
    const ys = s.points.map((p) => p[1]);
    return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
  }
  return { x0: s.x, y0: s.y, x1: s.x + s.w, y1: s.y + s.h };
};

function staticChecks(c: Compiled, opts: CheckOptions, errors: string[], warnings: string[]): void {
  const { adv } = c;
  // Hotspot geometry.
  for (const sc of adv.scenes) for (const hs of sc.hotspots) {
    const b = bbox(hs.shape);
    const where = `hotspot ${sc.id}/${hs.id}`;
    if ('points' in hs.shape && hs.shape.points.length < 3) errors.push(`${where}: a polygon needs at least 3 points`);
    if (b.x0 < 0 || b.y0 < 0 || b.x1 > VIEW_W || b.y1 > VIEW_H) errors.push(`${where}: outside the ${VIEW_W}×${VIEW_H} view box`);
    if (b.x1 - b.x0 < MIN_TARGET || b.y1 - b.y0 < MIN_TARGET) warnings.push(`${where}: smaller than ${MIN_TARGET}×${MIN_TARGET} (the renderer pads its hit area)`);
  }
  // Flags and items: written/given somewhere and read/used somewhere.
  const { conds: cs, effects: es } = usage(adv);
  const startFlags = new Set(Object.keys(adv.start.flags ?? {}));
  for (const f of c.flags.keys()) {
    const written = startFlags.has(f) || es.some((e) => ('set' in e && e.set === f) || ('add' in e && e.add === f));
    const read = cs.some((x) => 'flag' in x && x.flag === f);
    if (!written) errors.push(`flag "${f}" is never set`);
    if (!read) warnings.push(`flag "${f}" is never read`);
  }
  const startItems = new Set(adv.start.items ?? []);
  for (const item of c.items) {
    if (!startItems.has(item) && !es.some((e) => 'give' in e && e.give === item)) errors.push(`item "${item}" is never given`);
    const usedSomewhere =
      adv.combinations.some((x) => x.items.includes(item)) ||
      adv.scenes.some((sc) => sc.hotspots.some((hs) => hs.items?.[item] !== undefined)) ||
      cs.some((x) => ('has' in x && x.has === item) || ('used' in x && x.used === item));
    if (!usedSomewhere) warnings.push(`item "${item}" is never used`);
  }
  for (const clue of c.clues) if (!es.some((e) => 'learn' in e && e.learn === clue)) errors.push(`clue "${clue}" is never learned`);
  // Dialogue nodes reachable from the first node.
  for (const d of adv.dialogues) {
    const seen = new Set<string>([d.nodes[0]?.id ?? '']);
    const queue = [...seen];
    while (queue.length > 0) {
      const node = d.nodes.find((n) => n.id === queue.pop());
      for (const o of node?.options ?? []) {
        if (o.next === null || seen.has(o.next)) continue;
        seen.add(o.next);
        queue.push(o.next);
      }
    }
    for (const n of d.nodes) if (!seen.has(n.id)) errors.push(`dialogue ${d.id}/${n.id} cannot be reached from its first node`);
  }
  // Texts.
  if (opts.texts) {
    const keys = textKeys(adv);
    const locales = Object.keys(opts.texts);
    const ref = opts.texts.en ?? opts.texts[locales[0] ?? ''];
    for (const locale of locales) {
      const cat = opts.texts[locale] ?? {};
      for (const k of keys) {
        const t = cat[k];
        if (t === undefined || t.trim() === '') errors.push(`${locale}: missing text "${k}"`);
        else if (ref?.[k] !== undefined && placeholders(t) !== placeholders(ref[k])) errors.push(`${locale}: placeholders of "${k}" differ from the reference`);
      }
      const known = new Set(keys);
      for (const k of Object.keys(cat)) if (!known.has(k)) errors.push(`${locale}: unused text "${k}"`);
    }
  }
}

function dynamicChecks(c: Compiled, x: Exploration, errors: string[], warnings: string[]): CheckReport['metrics'] {
  const { adv } = c;
  if (x.overflow) {
    const [from, action] = x.overflow;
    errors.push(`scene-change loop: an action leads through more than ${MAX_HOPS} onEnter scene changes (the engine stops there): ${show([...pathTo(x, from), action])}`);
  }
  if (x.truncated) errors.push(`state budget exceeded: more than ${x.states.length} reachable states — split the content into chapters or simplify a puzzle`);
  const finish = canFinish(x);
  const endings: Record<string, number> = Object.fromEntries(adv.endings.map((e) => [e.id, -1]));
  x.states.forEach((s, i) => {
    if (s.ended !== null && (endings[s.ended] ?? -1) < 0) endings[s.ended] = pathTo(x, i).length;
  });
  for (const [id, len] of Object.entries(endings)) if (len < 0) errors.push(`ending "${id}" is unreachable`);
  const lengths = Object.values(endings).filter((n) => n >= 0);
  if (!x.truncated) {
    const dead = finish.findIndex((ok) => !ok);
    if (dead >= 0) {
      const count = finish.filter((ok) => !ok).length;
      errors.push(`dead end: ${count} reachable state(s) can no longer reach an ending; shortest way into one: ${show(pathTo(x, dead))}`);
    }
  }
  // Coverage.
  const reached = (pick: (s: (typeof x.states)[number]) => readonly string[]): Set<string> => new Set(x.states.flatMap(pick));
  const scenes = reached((s) => s.visited);
  const items = reached((s) => [...s.items, ...s.used]);
  const clues = reached((s) => s.clues);
  const goals = reached((s) => s.goalsDone);
  for (const sc of adv.scenes) if (!scenes.has(sc.id)) errors.push(`scene "${sc.id}" is unreachable`);
  for (const i of c.items) if (!items.has(i)) errors.push(`item "${i}" can never be obtained`);
  for (const cl of c.clues) if (!clues.has(cl)) errors.push(`clue "${cl}" can never be learned`);
  for (const g of adv.goals) if (!goals.has(g.id)) warnings.push(`goal "${g.id}" is never done`);
  for (const k of textKeys(adv)) if (isRuleKey(k) && !x.fired.has(k)) errors.push(`never shown: "${k}" (its rule, option or chapter can never fire)`);
  // Hints: every state where the player acts on their own has an open goal.
  const noGoal = x.states.findIndex((s) => s.ended === null && s.dialogue === null && openGoals(c, s).length === 0);
  if (noGoal >= 0) errors.push(`no open goal (so no hint) after: ${show(pathTo(x, noGoal))}`);
  return { states: x.states.length, edges: x.edges.reduce((n, e) => n + e.length, 0), shortestSolution: lengths.length > 0 ? Math.min(...lengths) : -1, endings };
}

/**
 * Checks an adventure: content structure (via `compile`), texts, geometry, usage, and an exhaustive
 * exploration with an independent interpreter — completable, every ending reachable, no dead ends,
 * full coverage, an open goal (hint) in every state.
 */
export function checkAdventure(adv: Adventure, opts: CheckOptions = {}): CheckReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  let c: Compiled;
  try {
    c = compile(adv);
  } catch (e) {
    return { errors: [(e as Error).message], warnings, metrics: { states: 0, edges: 0, shortestSolution: -1, endings: {} } };
  }
  staticChecks(c, opts, errors, warnings);
  const metrics = dynamicChecks(c, explore(c, opts.budget ?? DEFAULT_BUDGET), errors, warnings);
  return { errors, warnings, metrics };
}
