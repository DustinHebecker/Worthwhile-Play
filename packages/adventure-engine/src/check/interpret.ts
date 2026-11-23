/**
 * An independent, minimal interpreter of adventure content for the content checker
 * (docs/design/adventures.md § 8.3: "no generator validating itself"). It deliberately shares no
 * logic with `engine.ts` — only the content types, the indexes built by `compile` and the text-key
 * scheme. A property test checks that both agree on every reachable state of the fixtures.
 *
 * It works on the abstract state: everything that can change what the player can do or reach.
 * Display-only parts (log, action count, revealed hints, the selected item, the seed) are left out.
 */
import type { Compiled } from '../compile';
import {
  chapterKey, clueOnKey, comboKey, deduceKey, endingKey, enterKey, itemOnKey, lineKey, optionKey, verbKey
} from '../text';
import type { Action, AdventureState, Cond, Effect, Rule } from '../types';

export interface AState {
  scene: string;
  flags: Record<string, number>;
  items: string[];
  used: string[];
  clues: string[];
  visited: string[];
  goalsDone: string[];
  dialogue: { id: string; node: string } | null;
  chapter: number;
  ended: string | null;
}

export interface Move {
  readonly action: Action;
  readonly next: AState;
  /** Text keys of the rules that fired (for coverage). */
  readonly fired: readonly string[];
}

/** Scene changes per action, as specified for the engine (MAX_HOPS). */
const HOPS = 8;

export const abstractOf = (s: AdventureState): AState => ({
  scene: s.scene,
  flags: { ...s.flags },
  items: [...s.items],
  used: [...s.used],
  clues: [...s.clues],
  visited: [...s.visited],
  goalsDone: [...s.goalsDone],
  dialogue: s.dialogue ? { ...s.dialogue } : null,
  chapter: s.chapter,
  ended: s.ended
});

/** Canonical key of an abstract state (flags sorted; lists keep their order, which the engine keeps too). */
export const keyOf = (s: AState): string =>
  JSON.stringify([s.scene, Object.keys(s.flags).sort().map((f) => [f, s.flags[f]]), s.items, s.used, s.clues, s.visited, s.goalsDone, s.dialogue && [s.dialogue.id, s.dialogue.node], s.chapter, s.ended]);

const flagOf = (s: AState, f: string): number => (Object.hasOwn(s.flags, f) ? (s.flags[f] as number) : 0);

export function test(c: Cond, s: AState): boolean {
  const kind = Object.keys(c).find((k) => k !== 'eq' && k !== 'gte' && k !== 'lte');
  const v = (c as Record<string, unknown>)[kind ?? ''];
  switch (kind) {
    case 'all':
      return (v as Cond[]).reduce<boolean>((ok, x) => ok && test(x, s), true);
    case 'any':
      return (v as Cond[]).reduce<boolean>((ok, x) => ok || test(x, s), false);
    case 'not':
      return !test(v as Cond, s);
    case 'flag': {
      const { eq, gte, lte } = c as { eq?: number; gte?: number; lte?: number };
      const n = flagOf(s, v as string);
      if (eq === undefined && gte === undefined && lte === undefined) return n > 0;
      return !(eq !== undefined && n !== eq) && !(gte !== undefined && n < gte) && !(lte !== undefined && n > lte);
    }
    case 'has':
      return s.items.indexOf(v as string) >= 0;
    case 'used':
      return s.used.indexOf(v as string) >= 0;
    case 'knows':
      return s.clues.indexOf(v as string) >= 0;
    case 'visited':
      return s.visited.indexOf(v as string) >= 0;
    case 'in':
      return s.scene === v;
    case 'goal':
      return s.goalsDone.indexOf(v as string) >= 0;
    default:
      throw new Error(`checker: unknown condition ${JSON.stringify(c)}`);
  }
}

const clone = (s: AState): AState => abstractOf(s as unknown as AdventureState);

class Run {
  readonly fired: string[] = [];
  constructor(readonly c: Compiled, readonly s: AState) {}

  rule(rules: readonly Rule[] | undefined, key: (n: number) => string): boolean {
    for (let n = 0; n < (rules?.length ?? 0); n++) {
      const r = rules?.[n] as Rule;
      if (r.when && !test(r.when, this.s)) continue;
      this.fired.push(key(n));
      this.effects(r.then ?? [], 0);
      return true;
    }
    return false;
  }

  effects(list: readonly Effect[], depth: number): void {
    for (const e of list) this.effect(e, depth);
  }

  effect(e: Effect, depth: number): void {
    const s = this.s;
    const [kind] = Object.keys(e);
    const max = (f: string): number => this.c.flags.get(f) ?? 0;
    const setFlag = (f: string, n: number): void => {
      const v = n < 0 ? 0 : n > max(f) ? max(f) : n;
      if (v > 0) s.flags[f] = v;
      else delete s.flags[f];
    };
    switch (kind) {
      case 'set':
        return setFlag((e as { set: string }).set, (e as { to: number }).to);
      case 'add': {
        const f = (e as { add: string }).add;
        return setFlag(f, flagOf(s, f) + (e as { by: number }).by);
      }
      case 'give': {
        const item = (e as { give: string }).give;
        if (s.items.indexOf(item) < 0 && s.used.indexOf(item) < 0) s.items.push(item);
        return;
      }
      case 'take': {
        const item = (e as { take: string }).take;
        const at = s.items.indexOf(item);
        if (at < 0) return;
        s.items = s.items.filter((x) => x !== item);
        s.used.push(item);
        return;
      }
      case 'learn': {
        const clue = (e as { learn: string }).learn;
        if (s.clues.indexOf(clue) < 0) s.clues.push(clue);
        return;
      }
      case 'go':
        return this.enter((e as { go: string }).go, depth + 1);
      case 'dialogue': {
        const id = (e as { dialogue: string }).dialogue;
        const first = this.c.dialogues.get(id)?.nodes[0]?.id;
        if (first !== undefined) {
          s.dialogue = { id, node: first };
          this.fired.push(lineKey(id, first));
        }
        return;
      }
      default:
        throw new Error(`checker: unknown effect ${JSON.stringify(e)}`);
    }
  }

  enter(scene: string, depth: number): void {
    if (depth > HOPS) return;
    this.s.scene = scene;
    if (this.s.visited.indexOf(scene) < 0) this.s.visited.push(scene);
    const rules = this.c.scenes.get(scene)?.onEnter ?? [];
    for (let n = 0; n < rules.length; n++) {
      const r = rules[n] as Rule;
      if (r.when && !test(r.when, this.s)) continue;
      this.fired.push(enterKey(scene, n));
      this.effects(r.then ?? [], depth);
      return;
    }
  }

  /** Goals, chapters, ending — after every successful action. */
  settle(): void {
    const { c, s } = this;
    let before = -1;
    while (before !== s.goalsDone.length) {
      before = s.goalsDone.length;
      for (const g of c.adv.goals) if (s.goalsDone.indexOf(g.id) < 0 && test(g.done, s)) s.goalsDone.push(g.id);
    }
    while (s.chapter < c.adv.chapters.length) {
      const ch = c.adv.chapters[s.chapter];
      if (!ch || !test(ch.done, s)) break;
      this.fired.push(chapterKey(ch.id));
      s.chapter += 1;
    }
    for (const e of c.adv.endings) {
      if (!test(e.when, s)) continue;
      s.ended = e.id;
      s.dialogue = null;
      this.fired.push(endingKey(e.id));
      break;
    }
  }
}

export function startState(c: Compiled): { state: AState; fired: string[] } {
  const flags: Record<string, number> = {};
  for (const [f, n] of Object.entries(c.adv.start.flags ?? {})) if (n > 0) flags[f] = n;
  const s: AState = { scene: c.adv.start.scene, flags, items: [...(c.adv.start.items ?? [])], used: [], clues: [], visited: [], goalsDone: [], dialogue: null, chapter: 0, ended: null };
  const run = new Run(c, s);
  run.enter(c.adv.start.scene, 0);
  run.settle();
  return { state: s, fired: run.fired };
}

const shown = (c: Compiled, s: AState): string[] =>
  (c.scenes.get(s.scene)?.hotspots ?? []).filter((h) => !h.visible || test(h.visible, s)).map((h) => h.id);

/**
 * Every successful action from `s` with its result. Examining without rules, selecting and hints
 * never change the abstract state and are left out; refused actions have no move.
 */
export function moves(c: Compiled, s: AState): Move[] {
  if (s.ended !== null) return [];
  const out: Move[] = [];
  const attempt = (action: Action, body: (run: Run) => boolean): void => {
    const run = new Run(c, clone(s));
    if (!body(run)) return;
    run.settle();
    out.push({ action, next: run.s, fired: run.fired });
  };
  if (s.dialogue) {
    const { id, node } = s.dialogue;
    for (const o of c.nodes.get(`${id}/${node}`)?.options ?? []) {
      if (o.when && !test(o.when, s)) continue;
      attempt({ a: 'choose', option: o.id }, (run) => {
        run.fired.push(optionKey(id, node, o.id));
        run.effects(o.then ?? [], 0);
        run.s.dialogue = o.next === null ? null : { id, node: o.next };
        if (o.next !== null) run.fired.push(lineKey(id, o.next));
        return true;
      });
    }
    return out;
  }
  const spots = shown(c, s);
  for (const hsId of spots) {
    const hs = c.hotspots.get(`${s.scene}/${hsId}`);
    for (const verb of ['examine', 'take', 'use', 'talk'] as const) {
      const rules = hs?.on?.[verb];
      if (rules) attempt({ a: verb, hs: hsId }, (run) => run.rule(rules, (n) => verbKey(s.scene, hsId, verb, n)));
    }
    for (const item of s.items) {
      const rules = hs?.items?.[item];
      if (rules) attempt({ a: 'useItem', item, hs: hsId }, (run) => run.rule(rules, (n) => itemOnKey(s.scene, hsId, item, n)));
    }
    for (const clue of s.clues) {
      const rules = hs?.clues?.[clue];
      if (rules) attempt({ a: 'present', clue, hs: hsId }, (run) => run.rule(rules, (n) => clueOnKey(s.scene, hsId, clue, n)));
    }
  }
  for (const combo of c.adv.combinations) {
    const [x, y] = combo.items;
    if (s.items.indexOf(x) >= 0 && s.items.indexOf(y) >= 0) attempt({ a: 'combine', x, y }, (run) => run.rule(combo.rules, (n) => comboKey(x, y, n)));
  }
  for (const ded of c.adv.deductions) {
    const [x, y] = ded.clues;
    if (s.clues.indexOf(x) >= 0 && s.clues.indexOf(y) >= 0) attempt({ a: 'deduce', x, y }, (run) => run.rule(ded.rules, (n) => deduceKey(x, y, n)));
  }
  if (c.scenes.get(s.scene)?.map !== false) {
    for (const scene of s.visited) {
      if (scene === s.scene || c.scenes.get(scene)?.map === false) continue;
      attempt({ a: 'travel', scene }, (run) => {
        run.enter(scene, 0);
        return true;
      });
    }
  }
  return out;
}

/** Goals that are active and not done (independent of `activeGoals` in the engine). */
export const openGoals = (c: Compiled, s: AState): string[] =>
  c.adv.goals.filter((g) => s.goalsDone.indexOf(g.id) < 0 && test(g.active, s)).map((g) => g.id);
