import { pairKey, type Compiled } from './compile';
import {
  chapterKey, clueOnKey, comboKey, deduceKey, endingKey, enterKey, hintKey, hotspotKey, itemOnKey, lineKey, optionKey, verbKey
} from './text';
import type { Action, AdventureState, Cond, Effect, GameEvent, Hotspot, RefusalReason, Rule, StepResult, Verb } from './types';

/** Text keys kept in `state.log` (display only). */
export const LOG_MAX = 50;
/** Hint tiers per goal. */
export const HINT_TIERS = 3;
/** Scene changes in one step (onEnter rules may move on). Further moves are ignored; the content checker reports such loops. */
export const MAX_HOPS = 8;

/** Own-property read of a state record (`flags`, `hints`): never an inherited `Object.prototype` member. */
const own = (record: Readonly<Record<string, number>>, key: string): number => (Object.hasOwn(record, key) ? (record[key] as number) : 0);

// ── Conditions ──────────────────────────────────────────────────────────────────────────────────

export function holds(c: Cond, s: AdventureState): boolean {
  if ('all' in c) return c.all.every((x) => holds(x, s));
  if ('any' in c) return c.any.some((x) => holds(x, s));
  if ('not' in c) return !holds(c.not, s);
  if ('flag' in c) {
    const v = own(s.flags, c.flag);
    if (c.eq === undefined && c.gte === undefined && c.lte === undefined) return v !== 0;
    return (c.eq === undefined || v === c.eq) && (c.gte === undefined || v >= c.gte) && (c.lte === undefined || v <= c.lte);
  }
  if ('has' in c) return s.items.includes(c.has);
  if ('used' in c) return s.used.includes(c.used);
  if ('knows' in c) return s.clues.includes(c.knows);
  if ('visited' in c) return s.visited.includes(c.visited);
  if ('in' in c) return s.scene === c.in;
  return s.goalsDone.includes(c.goal);
}

const firstMatch = (rules: readonly Rule[] | undefined, s: AdventureState): number =>
  rules ? rules.findIndex((r) => r.when === undefined || holds(r.when, s)) : -1;

// ── Effects (mutate the step's private working copy) ───────────────────────────────────────────

interface Work {
  readonly c: Compiled;
  readonly s: AdventureState;
  readonly text: string[];
  readonly events: GameEvent[];
}

const setFlag = (w: Work, id: string, value: number): void => {
  const v = Math.max(0, Math.min(w.c.flags.get(id) ?? 0, value));
  if (v === 0) delete w.s.flags[id];
  else w.s.flags[id] = v;
};

function apply(w: Work, effects: readonly Effect[] | undefined, hops = 0): void {
  for (const e of effects ?? []) {
    const { s } = w;
    if ('set' in e) setFlag(w, e.set, e.to);
    else if ('add' in e) setFlag(w, e.add, own(s.flags, e.add) + e.by);
    else if ('give' in e) {
      if (!s.items.includes(e.give) && !s.used.includes(e.give)) {
        s.items.push(e.give);
        w.events.push({ type: 'gained', item: e.give });
      }
    } else if ('take' in e) {
      const i = s.items.indexOf(e.take);
      if (i >= 0) {
        s.items.splice(i, 1);
        s.used.push(e.take);
        if (s.selected === e.take) s.selected = null;
        w.events.push({ type: 'used', item: e.take });
      }
    } else if ('learn' in e) {
      if (!s.clues.includes(e.learn)) {
        s.clues.push(e.learn);
        w.events.push({ type: 'learned', clue: e.learn });
      }
    } else if ('go' in e) enter(w, e.go, hops + 1);
    else {
      const node = w.c.dialogues.get(e.dialogue)?.nodes[0];
      if (node) {
        s.dialogue = { id: e.dialogue, node: node.id };
        w.text.push(lineKey(e.dialogue, node.id));
        w.events.push({ type: 'dialogue', id: e.dialogue, node: node.id });
      }
    }
  }
}

/** Moves to a scene and runs its first matching onEnter rule. */
function enter(w: Work, scene: string, hops: number): void {
  if (hops > MAX_HOPS) return;
  const { s } = w;
  s.scene = scene;
  if (!s.visited.includes(scene)) s.visited.push(scene);
  w.events.push({ type: 'moved', scene });
  const rules = w.c.scenes.get(scene)?.onEnter;
  const n = firstMatch(rules, s);
  if (n >= 0) {
    w.text.push(enterKey(scene, n));
    apply(w, rules?.[n]?.then, hops);
  }
}

/** Goals done, chapter ends and the ending, checked after every successful action. */
function settle(w: Work): void {
  const { c, s } = w;
  for (const g of c.adv.goals) {
    if (!s.goalsDone.includes(g.id) && holds(g.done, s)) {
      s.goalsDone.push(g.id);
      w.events.push({ type: 'goal', goal: g.id });
    }
  }
  for (let ch = c.adv.chapters[s.chapter]; ch && holds(ch.done, s); ch = c.adv.chapters[s.chapter]) {
    s.chapter++;
    w.text.push(chapterKey(ch.id));
    w.events.push({ type: 'chapter', chapter: ch.id });
  }
  const ending = c.adv.endings.find((e) => holds(e.when, s));
  if (ending) {
    s.ended = ending.id;
    s.dialogue = null;
    w.text.push(endingKey(ending.id));
    w.events.push({ type: 'ended', ending: ending.id });
  }
}

// ── State creation ──────────────────────────────────────────────────────────────────────────────

export function initialState(c: Compiled, seed: number): AdventureState {
  const { adv } = c;
  const s: AdventureState = {
    v: 1,
    content: adv.contentVersion,
    seed: seed >>> 0,
    scene: adv.start.scene,
    selected: null,
    flags: {},
    items: [...(adv.start.items ?? [])],
    used: [],
    clues: [],
    visited: [],
    goalsDone: [],
    dialogue: null,
    hints: {},
    chapter: 0,
    log: [],
    actions: 0,
    ended: null
  };
  for (const [f, v] of Object.entries(adv.start.flags ?? {})) if (v !== 0) s.flags[f] = v;
  const w: Work = { c, s, text: [], events: [] };
  enter(w, adv.start.scene, 0);
  settle(w);
  s.log = w.text.slice(-LOG_MAX);
  return s;
}

// ── Queries ─────────────────────────────────────────────────────────────────────────────────────

const visibleHotspot = (c: Compiled, s: AdventureState, id: string): Hotspot | undefined => {
  const hs = c.hotspots.get(`${s.scene}/${id}`);
  return hs && (hs.visible === undefined || holds(hs.visible, s)) ? hs : undefined;
};

export const visibleHotspots = (c: Compiled, s: AdventureState): Hotspot[] =>
  (c.scenes.get(s.scene)?.hotspots ?? []).filter((hs) => hs.visible === undefined || holds(hs.visible, s));

/** Goals that are active and not done, in authored order (journal "open questions", hint panel). */
export const activeGoals = (c: Compiled, s: AdventureState): string[] =>
  c.adv.goals.filter((g) => !s.goalsDone.includes(g.id) && holds(g.active, s)).map((g) => g.id);

const canTravel = (c: Compiled, s: AdventureState, scene: string): boolean =>
  scene !== s.scene && s.visited.includes(scene) && c.scenes.get(scene)?.map !== false && c.scenes.get(s.scene)?.map !== false;

const isPerson = (hs: Hotspot): boolean => hs.on?.talk !== undefined || hs.clues !== undefined;

/**
 * Everything the player can try now — the single source of truth for the view, the content checker
 * and the fuzzers (docs/design/adventures.md § 3.1). Trying may still be refused with an explanation
 * ("nothing happens"), which leaves the state unchanged.
 */
export function available(c: Compiled, s: AdventureState): Action[] {
  if (s.ended !== null) return [];
  const hints: Action[] = activeGoals(c, s).filter((g) => own(s.hints, g) < HINT_TIERS).map((goal) => ({ a: 'hint', goal }));
  if (s.dialogue) {
    const node = c.nodes.get(`${s.dialogue.id}/${s.dialogue.node}`);
    return [...(node?.options ?? []).filter((o) => o.when === undefined || holds(o.when, s)).map((o): Action => ({ a: 'choose', option: o.id })), ...hints];
  }
  const out: Action[] = [];
  const spots = visibleHotspots(c, s);
  for (const hs of spots) {
    out.push({ a: 'examine', hs: hs.id });
    for (const verb of ['take', 'use', 'talk'] as const) if (hs.on?.[verb]) out.push({ a: verb, hs: hs.id });
  }
  for (const item of s.items) for (const hs of spots) out.push({ a: 'useItem', item, hs: hs.id });
  for (const clue of s.clues) for (const hs of spots) if (isPerson(hs)) out.push({ a: 'present', clue, hs: hs.id });
  for (let i = 0; i < s.items.length; i++) for (let j = i + 1; j < s.items.length; j++) out.push({ a: 'combine', x: s.items[i] as string, y: s.items[j] as string });
  for (let i = 0; i < s.clues.length; i++) for (let j = i + 1; j < s.clues.length; j++) out.push({ a: 'deduce', x: s.clues[i] as string, y: s.clues[j] as string });
  for (const scene of s.visited) if (canTravel(c, s, scene)) out.push({ a: 'travel', scene });
  out.push({ a: 'select', item: null }, ...s.items.map((item): Action => ({ a: 'select', item })), ...hints);
  return out;
}

// ── Step ────────────────────────────────────────────────────────────────────────────────────────

const refuse = (state: AdventureState, reason: RefusalReason): StepResult => ({ state, out: { ok: false, reason } });

/**
 * Applies one player action. Pure: the input state is never mutated. Never throws for any action
 * (also malformed or unavailable ones): those are refused with a reason and the state unchanged.
 */
export function step(c: Compiled, state: AdventureState, action: Action): StepResult {
  if (state.ended !== null) return refuse(state, 'ended');
  if (!isActionShape(action)) return refuse(state, 'invalid');
  if (state.dialogue && action.a !== 'choose' && action.a !== 'hint') return refuse(state, 'in-dialogue');

  const s = structuredClone(state);
  const w: Work = { c, s, text: [], events: [] };
  const run = (rules: readonly Rule[] | undefined, key: (n: number) => string): RefusalReason | null => {
    const n = firstMatch(rules, s);
    if (n < 0) return 'nothing-happens';
    w.text.push(key(n));
    apply(w, rules?.[n]?.then);
    return null;
  };

  let refusal: RefusalReason | null = null;
  switch (action.a) {
    case 'examine':
    case 'take':
    case 'use':
    case 'talk': {
      const hs = visibleHotspot(c, s, action.hs);
      if (!hs) return refuse(state, 'not-here');
      const rules = hs.on?.[action.a];
      if (action.a === 'examine' && !rules) w.text.push(hotspotKey(s.scene, hs.id, 'desc'));
      else refusal = run(rules, (n) => verbKey(s.scene, hs.id, action.a as Verb, n));
      break;
    }
    case 'useItem': {
      if (!s.items.includes(action.item)) return refuse(state, 'not-held');
      const hs = visibleHotspot(c, s, action.hs);
      if (!hs) return refuse(state, 'not-here');
      refusal = run(hs.items?.[action.item], (n) => itemOnKey(s.scene, hs.id, action.item, n));
      break;
    }
    case 'present': {
      if (!s.clues.includes(action.clue)) return refuse(state, 'not-known');
      const hs = visibleHotspot(c, s, action.hs);
      if (!hs) return refuse(state, 'not-here');
      refusal = run(hs.clues?.[action.clue], (n) => clueOnKey(s.scene, hs.id, action.clue, n));
      break;
    }
    case 'combine': {
      if (action.x === action.y) return refuse(state, 'invalid');
      if (!s.items.includes(action.x) || !s.items.includes(action.y)) return refuse(state, 'not-held');
      const combo = c.combinations.get(pairKey(action.x, action.y));
      if (!combo) return refuse(state, 'no-combination');
      refusal = run(combo.rules, (n) => comboKey(action.x, action.y, n));
      break;
    }
    case 'deduce': {
      if (action.x === action.y) return refuse(state, 'invalid');
      if (!s.clues.includes(action.x) || !s.clues.includes(action.y)) return refuse(state, 'not-known');
      const ded = c.deductions.get(pairKey(action.x, action.y));
      if (!ded) return refuse(state, 'no-connection');
      refusal = run(ded.rules, (n) => deduceKey(action.x, action.y, n)) === null ? null : 'no-connection';
      break;
    }
    case 'choose': {
      if (!s.dialogue) return refuse(state, 'invalid');
      const { id, node } = s.dialogue;
      const option = c.nodes.get(`${id}/${node}`)?.options.find((o) => o.id === action.option);
      if (!option || (option.when !== undefined && !holds(option.when, s))) return refuse(state, 'invalid');
      w.text.push(optionKey(id, node, option.id));
      apply(w, option.then);
      if (option.next === null) s.dialogue = null;
      else {
        s.dialogue = { id, node: option.next };
        w.text.push(lineKey(id, option.next));
      }
      w.events.push({ type: 'dialogue', id, node: option.next });
      break;
    }
    case 'travel':
      if (!canTravel(c, s, action.scene)) return refuse(state, 'not-reachable');
      enter(w, action.scene, 0);
      break;
    case 'select':
      if (action.item !== null && !s.items.includes(action.item)) return refuse(state, 'not-held');
      s.selected = action.item;
      break;
    case 'hint': {
      const tier = own(s.hints, action.goal) + 1;
      if (!activeGoals(c, s).includes(action.goal) || tier > HINT_TIERS) return refuse(state, 'no-hint');
      s.hints[action.goal] = tier;
      w.text.push(hintKey(action.goal, tier));
      break;
    }
  }
  if (refusal) return refuse(state, refusal);

  settle(w);
  s.actions++;
  s.log = [...s.log, ...w.text].slice(-LOG_MAX);
  return { state: s, out: { ok: true, text: w.text, events: w.events } };
}

// ── Action shape (untrusted input) ──────────────────────────────────────────────────────────────

const str = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 64;

/** Structural check of an action; ids are checked against the state by `step`. Never throws. */
export function isActionShape(v: unknown): v is Action {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  const a = v as Record<string, unknown>;
  const keys = Object.keys(a).sort().join(',');
  switch (a.a) {
    case 'examine':
    case 'take':
    case 'use':
    case 'talk':
      return keys === 'a,hs' && str(a.hs);
    case 'useItem':
      return keys === 'a,hs,item' && str(a.item) && str(a.hs);
    case 'present':
      return keys === 'a,clue,hs' && str(a.clue) && str(a.hs);
    case 'combine':
    case 'deduce':
      return keys === 'a,x,y' && str(a.x) && str(a.y);
    case 'choose':
      return keys === 'a,option' && str(a.option);
    case 'travel':
      return keys === 'a,scene' && str(a.scene);
    case 'select':
      return keys === 'a,item' && (a.item === null || str(a.item));
    case 'hint':
      return keys === 'a,goal' && str(a.goal);
    default:
      return false;
  }
}
