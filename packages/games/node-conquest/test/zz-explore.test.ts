import { it } from 'vitest';
import { getMap, MAPS_PER_SET, createGame, isValidState } from '../src/rules';
it('explore', () => {
  for (const f of [2, 3, 4] as const) for (let i = 0; i < MAPS_PER_SET; i++) for (const l of [1, 2] as const) {
    const m = getMap(f, i, l);
    if (m.center <= 0) console.log('nocenter', f, i, l, m.center);
  }
  const s = createGame(3, { map: 7 });
  console.log('map7 valid?', s.map, s.owner.length);
});
