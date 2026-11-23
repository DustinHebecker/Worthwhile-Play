import { VERBS, type Adventure, type Combination, type Cond, type Deduction, type Dialogue, type DialogueNode, type Effect, type Hotspot, type Rule, type Scene, type Verb } from './types';

/** Lower-case letters, digits and hyphens, 1–48 characters (no dots: text keys are dot-separated). */
export const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,47}$/;
/**
 * A valid id. Names of `Object.prototype` members (`constructor`) are refused: ids are keys of plain
 * objects in the state (`flags`, `hints`), where such a name would resolve to the inherited member.
 */
export const isId = (v: unknown): v is string => typeof v === 'string' && ID_PATTERN.test(v) && !Object.prototype.hasOwnProperty.call(Object.prototype, v);
export const MAX_FLAG = 1000;

/** An adventure with lookup tables. Built once per adventure; the engine functions take it instead of the raw data. */
export interface Compiled {
  readonly adv: Adventure;
  readonly scenes: ReadonlyMap<string, Scene>;
  /** Hotspot by `scene/hotspot`. */
  readonly hotspots: ReadonlyMap<string, Hotspot>;
  readonly items: ReadonlySet<string>;
  readonly clues: ReadonlySet<string>;
  readonly flags: ReadonlyMap<string, number>;
  /** Combination / deduction by the sorted pair `a+b`. */
  readonly combinations: ReadonlyMap<string, Combination>;
  readonly deductions: ReadonlyMap<string, Deduction>;
  readonly dialogues: ReadonlyMap<string, Dialogue>;
  /** Dialogue node by `dialogue/node`. */
  readonly nodes: ReadonlyMap<string, DialogueNode>;
  readonly goals: ReadonlySet<string>;
  readonly endings: ReadonlySet<string>;
}

export const pairKey = (a: string, b: string): string => (a < b ? `${a}+${b}` : `${b}+${a}`);

/**
 * Indexes an adventure and checks what the engine relies on: well-formed unique ids and references,
 * flag ranges. Throws on invalid authored content (it is bundled, never user input). The full content
 * checker (reachability, dead ends, translations) is a separate test-time tool.
 */
export function compile(adv: Adventure): Compiled {
  const errors: string[] = [];
  const fail = (msg: string): void => void errors.push(msg);
  const unique = <T extends { id: string }>(list: readonly T[], kind: string): Map<string, T> => {
    const map = new Map<string, T>();
    for (const x of list) {
      if (!isId(x.id)) fail(`${kind} id "${x.id}" is not a valid id`);
      if (map.has(x.id)) fail(`duplicate ${kind} id "${x.id}"`);
      map.set(x.id, x);
    }
    return map;
  };
  if (!isId(adv.id)) fail(`adventure id "${adv.id}" is not a valid id`);
  if (!Number.isInteger(adv.contentVersion) || adv.contentVersion < 1) fail('contentVersion must be a positive integer');

  const scenes = unique(adv.scenes, 'scene');
  const items = new Set(unique(adv.items, 'item').keys());
  const clues = new Set(unique(adv.clues, 'clue').keys());
  const dialogues = unique(adv.dialogues, 'dialogue');
  const goals = new Set(unique(adv.goals, 'goal').keys());
  unique(adv.chapters, 'chapter');
  const endings = new Set(unique(adv.endings, 'ending').keys());
  const flags = new Map<string, number>();
  for (const [id, { max }] of Object.entries(adv.flags)) {
    if (!isId(id)) fail(`flag id "${id}" is not a valid id`);
    if (!Number.isInteger(max) || max < 1 || max > MAX_FLAG) fail(`flag "${id}" max must be an integer 1…${MAX_FLAG}`);
    flags.set(id, max);
  }

  const cond = (c: Cond, where: string): void => {
    if ('all' in c) return c.all.forEach((x) => cond(x, where));
    if ('any' in c) return c.any.forEach((x) => cond(x, where));
    if ('not' in c) return cond(c.not, where);
    if ('flag' in c) {
      const max = flags.get(c.flag);
      if (max === undefined) return fail(`${where}: unknown flag "${c.flag}"`);
      for (const v of [c.eq, c.gte, c.lte]) if (v !== undefined && (!Number.isInteger(v) || v < 0 || v > max)) fail(`${where}: flag "${c.flag}" compared with ${v} outside 0…${max}`);
      return;
    }
    if ('has' in c || 'used' in c) {
      const id = 'has' in c ? c.has : c.used;
      if (!items.has(id)) fail(`${where}: unknown item "${id}"`);
      return;
    }
    if ('knows' in c) return void (clues.has(c.knows) || fail(`${where}: unknown clue "${c.knows}"`));
    if ('visited' in c || 'in' in c) {
      const id = 'visited' in c ? c.visited : c.in;
      if (!scenes.has(id)) fail(`${where}: unknown scene "${id}"`);
      return;
    }
    if ('goal' in c) return void (goals.has(c.goal) || fail(`${where}: unknown goal "${c.goal}"`));
    fail(`${where}: unknown condition ${JSON.stringify(c)}`);
  };
  const effect = (e: Effect, where: string): void => {
    if ('set' in e || 'add' in e) {
      const id = 'set' in e ? e.set : e.add;
      const n = 'set' in e ? e.to : e.by;
      const max = flags.get(id);
      if (max === undefined) return fail(`${where}: unknown flag "${id}"`);
      if (!Number.isInteger(n) || ('set' in e ? n < 0 || n > max : n === 0 || Math.abs(n) > max)) fail(`${where}: bad value ${n} for flag "${id}"`);
      return;
    }
    if ('give' in e || 'take' in e) {
      const id = 'give' in e ? e.give : e.take;
      if (!items.has(id)) fail(`${where}: unknown item "${id}"`);
      return;
    }
    if ('learn' in e) return void (clues.has(e.learn) || fail(`${where}: unknown clue "${e.learn}"`));
    if ('go' in e) return void (scenes.has(e.go) || fail(`${where}: unknown scene "${e.go}"`));
    if ('dialogue' in e) return void (dialogues.has(e.dialogue) || fail(`${where}: unknown dialogue "${e.dialogue}"`));
    fail(`${where}: unknown effect ${JSON.stringify(e)}`);
  };
  const rules = (list: readonly Rule[], where: string): void =>
    list.forEach((r, n) => {
      if (r.when) cond(r.when, `${where}[${n}]`);
      r.then?.forEach((e) => effect(e, `${where}[${n}]`));
    });

  const hotspots = new Map<string, Hotspot>();
  for (const scene of adv.scenes) {
    if (!isId(scene.region)) fail(`scene "${scene.id}": region "${scene.region}" is not a valid id`);
    unique(scene.hotspots, `hotspot in scene "${scene.id}"`);
    if (scene.onEnter) rules(scene.onEnter, `scene ${scene.id} onEnter`);
    for (const hs of scene.hotspots) {
      const where = `hotspot ${scene.id}/${hs.id}`;
      hotspots.set(`${scene.id}/${hs.id}`, hs);
      if (hs.visible) cond(hs.visible, where);
      for (const [verb, list] of Object.entries(hs.on ?? {})) {
        if (!VERBS.includes(verb as Verb)) fail(`${where}: unknown verb "${verb}"`);
        rules(list, `${where} ${verb}`);
      }
      for (const [item, list] of Object.entries(hs.items ?? {})) {
        if (!items.has(item)) fail(`${where}: unknown item "${item}"`);
        rules(list, `${where} item ${item}`);
      }
      for (const [clue, list] of Object.entries(hs.clues ?? {})) {
        if (!clues.has(clue)) fail(`${where}: unknown clue "${clue}"`);
        rules(list, `${where} clue ${clue}`);
      }
    }
  }

  const pairs = <T extends { rules: readonly Rule[] }>(list: readonly T[], get: (x: T) => readonly [string, string], known: ReadonlySet<string>, kind: string): Map<string, T> => {
    const map = new Map<string, T>();
    for (const x of list) {
      const [a, b] = get(x);
      if (!known.has(a) || !known.has(b) || a === b) fail(`${kind} ${a}+${b}: needs two different known ids`);
      const key = pairKey(a, b);
      if (map.has(key)) fail(`duplicate ${kind} ${key}`);
      map.set(key, x);
      rules(x.rules, `${kind} ${key}`);
    }
    return map;
  };
  const combinations = pairs(adv.combinations, (c) => c.items, items, 'combination');
  const deductions = pairs(adv.deductions, (d) => d.clues, clues, 'deduction');

  const nodes = new Map<string, DialogueNode>();
  for (const d of adv.dialogues) {
    if (d.nodes.length === 0) fail(`dialogue "${d.id}" has no nodes`);
    const ids = unique(d.nodes, `node in dialogue "${d.id}"`);
    for (const node of d.nodes) {
      nodes.set(`${d.id}/${node.id}`, node);
      if (node.options.length === 0) fail(`dialogue ${d.id}/${node.id} has no options`);
      unique(node.options, `option in ${d.id}/${node.id}`);
      for (const o of node.options) {
        const where = `dialogue ${d.id}/${node.id}/${o.id}`;
        if (o.when) cond(o.when, where);
        o.then?.forEach((e) => {
          if ('dialogue' in e || 'go' in e) fail(`${where}: dialogue options cannot start dialogues or change scenes`);
          effect(e, where);
        });
        if (o.next !== null && !ids.has(o.next)) fail(`${where}: unknown next node "${o.next}"`);
      }
      if (!node.options.some((o) => o.when === undefined)) fail(`dialogue ${d.id}/${node.id}: needs at least one unconditional option`);
    }
  }

  for (const g of adv.goals) {
    cond(g.active, `goal ${g.id} active`);
    cond(g.done, `goal ${g.id} done`);
  }
  for (const c of adv.chapters) cond(c.done, `chapter ${c.id}`);
  for (const e of adv.endings) cond(e.when, `ending ${e.id}`);
  if (adv.endings.length === 0) fail('an adventure needs at least one ending');

  if (!scenes.has(adv.start.scene)) fail(`start scene "${adv.start.scene}" is unknown`);
  for (const i of adv.start.items ?? []) if (!items.has(i)) fail(`start item "${i}" is unknown`);
  for (const [f, v] of Object.entries(adv.start.flags ?? {})) {
    const max = flags.get(f);
    if (max === undefined || !Number.isInteger(v) || v < 0 || v > max) fail(`start flag "${f}"=${v} is invalid`);
  }

  if (errors.length > 0) throw new Error(`Invalid adventure "${adv.id}":\n- ${errors.join('\n- ')}`);
  return { adv, scenes, hotspots, items, clues, flags, combinations, deductions, dialogues, nodes, goals, endings };
}
