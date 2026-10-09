import { it } from 'vitest';
import { chooseDrop } from '../src/ai';
import { buildWorld, drop, newState, runWorld, maxDisplacement, type Difficulty } from '../src/rules';

it('probe', () => {
  for (const d of ['easy', 'medium', 'hard'] as Difficulty[]) {
    let unsettled = 0, drops = 0, worstWake = 0, wakeFalls = 0; const lens: number[] = []; let maxThink = 0, sumThink = 0, maxDrop = 0, sumSteps = 0;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      let s = newState(seed, d, 'human');
      while (!s.result) {
        if (s.bodies.length) {
          const w = buildWorld(s.bodies, true);
          const r = runWorld(w, s.bodies.map((b) => b.k), { maxSteps: 120 });
          if (r.fallen.length) wakeFalls++;
          worstWake = Math.max(worstWake, maxDisplacement(s.bodies, r.bodies));
        }
        const t0 = performance.now();
        const c = chooseDrop(s);
        const t1 = performance.now();
        const r = drop(s, c)!;
        maxDrop = Math.max(maxDrop, performance.now() - t1);
        maxThink = Math.max(maxThink, t1 - t0); sumThink += t1 - t0;
        drops++; if (!r.outcome.settled) unsettled++; sumSteps += r.outcome.steps;
        s = r.state;
      }
      lens.push(s.bodies.length);
    }
    console.log(`${d}: lens ${lens.join(',')} unsettled ${unsettled}/${drops} avgSteps ${(sumSteps/drops).toFixed(0)} worstWake ${worstWake.toFixed(4)} wakeFalls ${wakeFalls} think avg ${(sumThink/drops).toFixed(1)} max ${maxThink.toFixed(0)} drop max ${maxDrop.toFixed(1)}`);
  }
}, 600000);
