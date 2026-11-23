import type { Adventure, Rule, Verb } from './types';

/**
 * Text keys are derived from the structure (docs/design/adventures.md § 3.2), never written by hand:
 *
 *   scene.<scene>.name | .desc | .enter.<n>
 *   hs.<scene>.<hotspot>.name | .desc | .<verb>.<n> | .item.<item>.<n> | .clue.<clue>.<n>
 *   item.<item>.name | .desc          clue.<clue>
 *   combo.<a>.<b>.<n>  (a < b)        deduce.<a>.<b>.<n>  (a < b)
 *   dlg.<dialogue>.<node> | dlg.<dialogue>.<node>.<option>
 *   goal.<goal>.title | .hint.1-3     chapter.<chapter>     ending.<ending>
 *
 * `<n>` is the index of the rule in its list. Ids contain no dots, so keys are unambiguous.
 */
export const sceneKey = (scene: string, part: 'name' | 'desc'): string => `scene.${scene}.${part}`;
export const enterKey = (scene: string, n: number): string => `scene.${scene}.enter.${n}`;
export const hotspotKey = (scene: string, hs: string, part: 'name' | 'desc'): string => `hs.${scene}.${hs}.${part}`;
export const verbKey = (scene: string, hs: string, verb: Verb, n: number): string => `hs.${scene}.${hs}.${verb}.${n}`;
export const itemOnKey = (scene: string, hs: string, item: string, n: number): string => `hs.${scene}.${hs}.item.${item}.${n}`;
export const clueOnKey = (scene: string, hs: string, clue: string, n: number): string => `hs.${scene}.${hs}.clue.${clue}.${n}`;
export const itemKey = (item: string, part: 'name' | 'desc'): string => `item.${item}.${part}`;
export const clueKey = (clue: string): string => `clue.${clue}`;
const pair = (a: string, b: string): string => (a < b ? `${a}.${b}` : `${b}.${a}`);
export const comboKey = (a: string, b: string, n: number): string => `combo.${pair(a, b)}.${n}`;
export const deduceKey = (a: string, b: string, n: number): string => `deduce.${pair(a, b)}.${n}`;
export const lineKey = (dialogue: string, node: string): string => `dlg.${dialogue}.${node}`;
export const optionKey = (dialogue: string, node: string, option: string): string => `dlg.${dialogue}.${node}.${option}`;
export const goalKey = (goal: string): string => `goal.${goal}.title`;
export const hintKey = (goal: string, tier: number): string => `goal.${goal}.hint.${tier}`;
export const chapterKey = (chapter: string): string => `chapter.${chapter}`;
export const endingKey = (ending: string): string => `ending.${ending}`;

/** Every text key the adventure can show, in a stable order (the reference for translation completeness). */
export function textKeys(adv: Adventure): string[] {
  const keys: string[] = [];
  const rules = (list: readonly Rule[] | undefined, key: (n: number) => string): void => list?.forEach((_, n) => keys.push(key(n)));
  for (const scene of adv.scenes) {
    keys.push(sceneKey(scene.id, 'name'), sceneKey(scene.id, 'desc'));
    rules(scene.onEnter, (n) => enterKey(scene.id, n));
    for (const hs of scene.hotspots) {
      keys.push(hotspotKey(scene.id, hs.id, 'name'), hotspotKey(scene.id, hs.id, 'desc'));
      for (const [verb, list] of Object.entries(hs.on ?? {})) rules(list, (n) => verbKey(scene.id, hs.id, verb as Verb, n));
      for (const [item, list] of Object.entries(hs.items ?? {})) rules(list, (n) => itemOnKey(scene.id, hs.id, item, n));
      for (const [clue, list] of Object.entries(hs.clues ?? {})) rules(list, (n) => clueOnKey(scene.id, hs.id, clue, n));
    }
  }
  for (const item of adv.items) keys.push(itemKey(item.id, 'name'), itemKey(item.id, 'desc'));
  for (const clue of adv.clues) keys.push(clueKey(clue.id));
  for (const c of adv.combinations) rules(c.rules, (n) => comboKey(c.items[0], c.items[1], n));
  for (const d of adv.deductions) rules(d.rules, (n) => deduceKey(d.clues[0], d.clues[1], n));
  for (const d of adv.dialogues) for (const node of d.nodes) {
    keys.push(lineKey(d.id, node.id));
    for (const o of node.options) keys.push(optionKey(d.id, node.id, o.id));
  }
  for (const g of adv.goals) keys.push(goalKey(g.id), hintKey(g.id, 1), hintKey(g.id, 2), hintKey(g.id, 3));
  for (const c of adv.chapters) keys.push(chapterKey(c.id));
  for (const e of adv.endings) keys.push(endingKey(e.id));
  return keys;
}
