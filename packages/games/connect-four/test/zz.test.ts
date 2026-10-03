import { it } from 'vitest';
import { analyse } from '../src/ai';
import { emptyBoard } from '../src/rules';
it('x', () => { throw new Error(JSON.stringify([1,2,3,4,5,6,7,8].map(d => { const a = analyse(emptyBoard(), d); return [d, a.best, a.value, a.nodes]; }))); });
