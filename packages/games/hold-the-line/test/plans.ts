import { createRng } from '@wp/game-core';
import { BASE_TOWERS, TOWERS } from '@wp/td-core';
import { DUEL, ownPad } from '../src/maps';
import { applyPlan, SHOP, type HoldState, type PlanCommand } from '../src/rules';

/** Random legal plan commands for side 0 (deterministic per seed). */
export function randomPlan(s: HoldState, seed: number, n: number): HoldState {
  const rng = createRng(seed);
  const pads: [number, number][] = [];
  for (let y = 0; y < DUEL.h; y++) for (let x = 0; x < DUEL.w; x++) if (ownPad(DUEL, 0, x, y)) pads.push([x, y]);
  for (let i = 0; i < n; i++) {
    const roll = rng.int(0, 9);
    const own = s.world.entities.filter((e) => e.side === 0 && Object.hasOwn(TOWERS, e.kind));
    let cmd: PlanCommand;
    if (roll < 3) {
      const [x, y] = rng.pick(pads);
      cmd = { t: 'place', kind: rng.pick(BASE_TOWERS), x, y };
    } else if (roll < 6) cmd = { t: 'buy', kind: rng.pick(SHOP) };
    else if (roll === 6 && own.length > 0) {
      const tower = rng.pick(own);
      cmd = { t: 'upgrade', id: tower.id, kind: rng.pick(TOWERS[tower.kind]!.next.length > 0 ? TOWERS[tower.kind]!.next : ['gun']) };
    } else if (roll === 7) {
      const [x, y] = rng.pick(pads);
      cmd = { t: 'extractor', x, y };
    } else if (roll === 8) cmd = { t: 'unbuy', index: 0 };
    else cmd = { t: 'workshop' };
    s = applyPlan(s, 0, cmd);
  }
  return s;
}
