import { isInt, isRecord, isUint32 } from '@wp/game-core';
import { isId, type Compiled } from './compile';
import { HINT_TIERS, LOG_MAX } from './engine';
import type { AdventureState } from './types';

const STATE_KEYS = 'actions,chapter,clues,content,dialogue,ended,flags,goalsDone,hints,items,log,scene,seed,selected,used,v,visited';
const TEXT_KEY = /^[a-z0-9][a-z0-9.-]{0,199}$/;

const isIdList = (v: unknown, known: ReadonlySet<string> | ReadonlyMap<string, unknown>): v is string[] =>
  Array.isArray(v) && v.length <= known.size && v.every((x) => isId(x) && known.has(x)) && new Set(v).size === v.length;

/**
 * Structural validation of an untrusted saved state against the adventure it belongs to (ids known,
 * flags within range, no duplicates, consistent dialogue/scene). Never throws.
 */
export function isValidAdventureState(c: Compiled, value: unknown): value is AdventureState {
  try {
    if (!isRecord(value) || Object.keys(value).sort().join(',') !== STATE_KEYS) return false;
    const s = value;
    if (s.v !== 1 || s.content !== c.adv.contentVersion || !isUint32(s.seed)) return false;
    if (typeof s.scene !== 'string' || !c.scenes.has(s.scene)) return false;
    if (!isIdList(s.items, c.items) || !isIdList(s.used, c.items) || s.items.some((i) => (s.used as string[]).includes(i))) return false;
    if (!(s.selected === null || (typeof s.selected === 'string' && s.items.includes(s.selected)))) return false;
    if (!isIdList(s.clues, c.clues) || !isIdList(s.visited, c.scenes) || !s.visited.includes(s.scene)) return false;
    if (!isIdList(s.goalsDone, c.goals)) return false;
    if (!isRecord(s.flags) || !Object.entries(s.flags).every(([f, n]) => c.flags.has(f) && isInt(n, 1, c.flags.get(f)))) return false;
    if (!isRecord(s.hints) || !Object.entries(s.hints).every(([g, n]) => c.goals.has(g) && isInt(n, 1, HINT_TIERS))) return false;
    if (s.dialogue !== null) {
      if (!isRecord(s.dialogue) || Object.keys(s.dialogue).sort().join(',') !== 'id,node') return false;
      if (typeof s.dialogue.id !== 'string' || typeof s.dialogue.node !== 'string' || !c.nodes.has(`${s.dialogue.id}/${s.dialogue.node}`)) return false;
    }
    if (!isInt(s.chapter, 0, c.adv.chapters.length) || !isInt(s.actions, 0)) return false;
    if (!(s.ended === null || (typeof s.ended === 'string' && c.endings.has(s.ended)))) return false;
    if (s.ended !== null && s.dialogue !== null) return false;
    return Array.isArray(s.log) && s.log.length <= LOG_MAX && s.log.every((k) => typeof k === 'string' && TEXT_KEY.test(k));
  } catch {
    return false;
  }
}

/** JSON with object keys sorted recursively (stable across engines and insertion orders). */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .filter((k) => value[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

/** FNV-1a (32 bit) over the canonical JSON: a compact fingerprint for replays and golden walkthroughs. */
export function stateHash(state: AdventureState): number {
  let h = 0x811c9dc5;
  const text = canonicalJson(state);
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}
