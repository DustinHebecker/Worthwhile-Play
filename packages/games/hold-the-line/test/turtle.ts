import { TOWERS } from '@wp/td-core';
import { padsNear } from '../src/ai';
import { applyPlan, checkPlan, mapOf, type HoldState, type PlanCommand } from '../src/rules';

/** The path of tower kinds from a base tower to `top` (level 1, 2, 3). */
export function pathTo(top: string): string[] {
  for (const [base, def] of Object.entries(TOWERS)) {
    if (def.level !== 1) continue;
    for (const mid of def.next) if (TOWERS[mid]!.next.includes(top) || mid === top) return mid === top ? [base, mid] : [base, mid, top];
  }
  throw new RangeError(`No path to ${top}`);
}

/**
 * A plain all-out defence (review of PR #107): every own pad, nearest the incoming road first, gets a
 * tower of the kinds in `mix` in turn (level 3 kinds; each built and upgraded along its path), as far
 * as the credits go. It buys no units. Returns the commands, applied in order to `s`.
 */
export function turtlePlan(s: HoldState, side: number, mix: readonly string[]): PlanCommand[] {
  const plan: PlanCommand[] = [];
  let t = s;
  const apply = (cmd: PlanCommand): boolean => {
    if (checkPlan(t, side, cmd) !== null) return false;
    t = applyPlan(t, side, cmd);
    plan.push(cmd);
    return true;
  };
  const paths = mix.map(pathTo);
  const pads = padsNear(t, side, mapOf(t).lanes[1 - side]!, 3);
  pads.forEach(([x, y], i) => apply({ t: 'place', kind: paths[i % paths.length]![0]!, x, y }));
  // Upgrade every tower along the path of its slot in the mix (towers that survived keep theirs).
  for (let pass = 0; pass < 2; pass++) {
    for (const e of t.world.entities) {
      if (e.side !== side || !Object.hasOwn(TOWERS, e.kind)) continue;
      const path = paths.find((p) => p.includes(e.kind));
      const next = path?.[path.indexOf(e.kind) + 1];
      if (next) apply({ t: 'upgrade', id: e.id, kind: next });
    }
  }
  return plan;
}
