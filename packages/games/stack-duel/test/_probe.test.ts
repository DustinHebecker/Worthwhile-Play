import { it } from 'vitest';
import { chooseDrop } from '../src/ai';
import { drop, newState, towerHeight, type Difficulty } from '../src/rules';

it('probe solo', () => {
  for (const d of ['easy', 'medium', 'hard'] as Difficulty[]) {
    const res: string[] = [];
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      let s = newState(seed, d, 'solo');
      while (!s.result) s = drop(s, chooseDrop({ ...s, difficulty: 'hard' }, 'high'))!.state;
      res.push(`${s.result.kind}:${s.bodies.length}:${towerHeight(s.bodies).toFixed(1)}`);
    }
    console.log(d, res.join(' '));
  }
}, 600000);
