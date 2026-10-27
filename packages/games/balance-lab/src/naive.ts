/**
 * Naive rules (design § 10.2): the tempting shortcuts a predict item should sometimes catch out. Used only to select
 * predict items, never to decide an outcome.
 */
import { bodyCentre, bodyRight, isBar, mobileMass, sideOf, type BeamScene, type MobileBar, type Side, type StackScene } from './statics';

/** "The side with more kilograms goes down" — distances ignored; weights at the axle count for neither side. */
export function naiveBeam(scene: BeamScene): Side {
  let diff = 0;
  for (const w of scene.weights) diff += w.hook > scene.axle ? w.kg : w.hook < scene.axle ? -w.kg : 0;
  return sideOf(diff);
}

/** The same rule for one mobile bar, with each hook's total mass. */
export function naiveBar(bar: MobileBar): Side {
  let diff = 0;
  for (const h of bar.hooks) {
    const m = mobileMass(h.child);
    diff += h.pos > bar.string ? m : h.pos < bar.string ? -m : 0;
  }
  return sideOf(diff);
}

export type StackAnswer = 'stands' | 'left' | 'right';

/**
 * "It stands if every block's middle lies over what it rests on" (a local check that ignores what rests on top),
 * and "a block entirely past the table edge must fall". The first local failure from the bottom gives the direction.
 */
export function naiveStack(scene: StackScene): StackAnswer {
  for (let k = 0; k < scene.bodies.length; k++) {
    const b = scene.bodies[k]!;
    if (b.left >= 0) return 'right';
    const lo = k === 0 ? Number.NEGATIVE_INFINITY : scene.bodies[k - 1]!.left;
    const hi = k === 0 ? 0 : bodyRight(scene.bodies[k - 1]!);
    const c = bodyCentre(b);
    if (c > hi) return 'right';
    if (c < lo) return 'left';
  }
  return 'stands';
}

export const isBarNode = isBar;
