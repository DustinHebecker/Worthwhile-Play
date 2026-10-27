/** Brute-force solution counting (design § 10.1). Pure. */
import { beamNet, isBar, mobileLevel, type BeamScene, type MobileNode } from './statics';

/** Number of empty weight slots (`{ kg: 0 }` placeholders are not used: empty hooks are `null` children). */
export function emptySlots(node: MobileNode): number {
  if (!isBar(node)) return 0;
  return node.bar.hooks.reduce((n, h) => n + (h.child === null ? 1 : emptySlots(h.child)), 0);
}

/** Fills the empty hooks depth-first with `kgs` (in order), marking them as placed by the player. */
export function fillSlots(node: MobileNode, kgs: readonly (number | null)[]): MobileNode {
  let i = 0;
  const walk = (n: MobileNode): MobileNode => {
    if (!isBar(n)) return n;
    return {
      bar: {
        ...n.bar,
        hooks: n.bar.hooks.map((h) => {
          if (h.child === null) {
            const kg = kgs[i++] ?? null;
            return { pos: h.pos, child: kg === null ? null : { kg, free: true } };
          }
          return { pos: h.pos, child: walk(h.child) };
        })
      }
    };
  };
  return walk(node);
}

function permutations(items: readonly number[]): number[][] {
  if (items.length <= 1) return [items.slice()];
  const out: number[][] = [];
  const seen = new Set<number>();
  items.forEach((x, i) => {
    if (seen.has(x)) return;
    seen.add(x);
    for (const rest of permutations([...items.slice(0, i), ...items.slice(i + 1)])) out.push([x, ...rest]);
  });
  return out;
}

/** Distinct assignments (up to equal masses) of the tray to the empty hooks that make every bar level. */
export function countHangSolutions(empty: MobileNode, tray: readonly number[]): number {
  if (emptySlots(empty) !== tray.length) return 0;
  return permutations(tray).filter((p) => mobileLevel(fillSlots(empty, p))).length;
}

/** Hooks (≠ axle, ≤ 3 weights already) where one weight of `kg` levels the beam. */
export function beamHookSolutions(scene: BeamScene, kg: number): number[] {
  const out: number[] = [];
  for (let hook = -scene.half; hook <= scene.half; hook++) {
    if (scene.weights.filter((w) => w.hook === hook).length >= 3) continue;
    if (beamNet({ ...scene, weights: [...scene.weights, { kg, hook }] }) === 0) out.push(hook);
  }
  return out;
}

/** Holes where the axle levels the beam. */
export function beamAxleSolutions(scene: BeamScene): number[] {
  const out: number[] = [];
  for (let a = -scene.half; a <= scene.half; a++) if (beamNet({ ...scene, axle: a }) === 0) out.push(a);
  return out;
}
