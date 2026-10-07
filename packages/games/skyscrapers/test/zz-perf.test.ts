import { it } from 'vitest';
import { generatePuzzle } from '../src/rules';
import { oracleCount } from './oracle';
it('perf', () => {
  for (const d of ['easy','medium','hard'] as const) {
    let max = 0, total = 0;
    for (let s = 0; s < 20; s++) {
      const p = generatePuzzle(s * 7919 + 13, d);
      const t0 = performance.now();
      const c = oracleCount(p.size, p.clues, p.givens);
      const dt = performance.now() - t0;
      if (c !== 1) throw new Error('oracle count ' + c);
      max = Math.max(max, dt); total += dt;
    }
    console.log(d, 'oracle avg', (total/20).toFixed(1), 'max', max.toFixed(1));
  }
}, 600000);
