import { it } from 'vitest';
import { chooseDrop } from '../src/ai';
import { buildWorld, drop, newState, spawnPose, type Difficulty } from '../src/rules';
import { PIECE_KINDS } from '../src/pieces';

it('probe', () => {
  let shown = 0;
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
    let s = newState(seed, 'medium' as Difficulty, 'human');
    while (!s.result && shown < 3) {
      const c = chooseDrop(s);
      const r = drop(s, c)!;
      if (!r.outcome.settled) {
        shown++;
        console.log('seed', seed, 'n', s.bodies.length, PIECE_KINDS[s.queue[0]]!.id, JSON.stringify(c));
        (globalThis as any).__dbg = true;
        // trace velocities
        const w = buildWorld(s.bodies);
        const p = spawnPose(s.bodies, s.queue[0], c);
        w.add({ parts: PIECE_KINDS[s.queue[0]]!.parts, x: p.x, y: p.y, a: p.a });
        for (let i = 0; i < 600; i++) {
          w.step();
          if (i % 50 === 49) console.log(i, w.bodies.slice(1).map((b, j) => (Math.hypot(b.vx, b.vy) > 0.03 || Math.abs(b.w) > 0.05) ? `${j}:${PIECE_KINDS[(j < s.bodies.length ? s.bodies[j]!.k : s.queue[0])]!.id}:v${Math.hypot(b.vx,b.vy).toFixed(3)}w${b.w.toFixed(3)}y${b.y.toFixed(2)}` : '').filter(Boolean).join(' '));
        }
        (globalThis as any).__dbg = false;
        drop(s, c);
      }
      s = r.state;
    }
  }
}, 600000);
