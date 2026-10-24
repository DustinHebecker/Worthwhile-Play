import fc from 'fast-check';
import { initialPosition, type PeelState, type Picture, type Shooter } from '../src/rules';
import { solve } from '../src/solver';

const HEXES = ['#d9682b', '#f6ead2', '#241c18', '#2f6fb3', '#6fb352', '#c8322b', '#ffe45c', '#8e9499'];
const NAMES = ['orange', 'cream', 'black', 'blue', 'green', 'red', 'yellow', 'grey'];

/** A picture from rows; palette keys in order of first appearance (or `keys`). */
export function pictureOf(rows: string[], keys?: string): Picture {
  const ks = keys ?? [...new Set(rows.join('').replace(/\./g, ''))].join('');
  return {
    w: rows[0]!.length,
    h: rows.length,
    rows,
    palette: [...ks].map((key, i) => ({ key, hex: HEXES[i]!, name: NAMES[i]! })),
    backdrop: '#9cc3d5'
  };
}

/** A full state from rows and lanes; the witness is found by the solver unless given. */
export function stateOf(rows: string[], lanes: Shooter[][], slots: number, witness?: string[], motif = 'red-fox'): PeelState {
  const picture = pictureOf(rows);
  const found = witness ?? (() => {
    const r = solve(initialPosition({ picture, lanes, slots }), 100_000);
    if (!('solution' in r)) throw new Error('fixture is not solvable');
    return r.solution;
  })();
  return { seed: 1, difficulty: 'easy', choice: motif, motif, picture, lanes, slots, witness: found, moves: [], restartUndo: null, reported: false };
}

/** Random small grids of `.` and up to `colours` keys. */
export const gridArb = (maxW = 8, maxH = 8, colours = 3) =>
  fc
    .record({ w: fc.integer({ min: 1, max: maxW }), h: fc.integer({ min: 1, max: maxH }) })
    .chain(({ w, h }) => fc.array(fc.constantFrom('.', ...'abcdefgh'.slice(0, colours).split('')), { minLength: w * h, maxLength: w * h }).map((cells) => ({ w, h, cells })));

/**
 * A random tiny puzzle (≤ 5 × 4, ≤ 6 shooters, 2 lanes, 1–2 slots): the shots of each colour are split into small
 * shooters, dealt into the two lanes. Not necessarily solvable.
 */
export const puzzleArb = fc
  .record({ w: fc.integer({ min: 2, max: 5 }), h: fc.integer({ min: 2, max: 4 }), slots: fc.integer({ min: 1, max: 2 }), seed: fc.integer({ min: 0, max: 0xffff }) })
  .chain(({ w, h, slots, seed }) =>
    // Colours by ring depth (outer rings cover inner ones, as in real pictures), with some noise and holes.
    fc.tuple(fc.array(fc.constantFrom('a', 'b', 'c'), { minLength: 3, maxLength: 3 }), fc.array(fc.constantFrom('', '', '', '', '.', 'a', 'b', 'c'), { minLength: w * h, maxLength: w * h })).map(([ringColour, noise]) => {
      const cells = noise.map((n, i) => {
        const x = i % w;
        const y = Math.floor(i / w);
        return n || (ringColour[Math.min(2, x, y, w - 1 - x, h - 1 - y)] as string);
      });
      const rows: string[] = [];
      for (let y = 0; y < h; y++) rows.push(cells.slice(y * w, (y + 1) * w).join(''));
      // A small deterministic shuffle from the seed (fast-check controls the seed, so shrinking stays meaningful).
      let s = seed;
      const next = (n: number) => {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return s % n;
      };
      const shooters: Shooter[] = [];
      // Inner colours first (the reverse of a peel order), then a few random swaps: many such puzzles need parking,
      // and with one slot some cannot be finished at all.
      const order = [...new Set([...ringColour].reverse().concat(['a', 'b', 'c']))];
      for (const c of order) {
        let count = cells.filter((x) => x === c).length;
        while (count > 0) {
          const n = Math.max(1, Math.min(count, count <= 3 ? 1 + next(count) : Math.ceil(count / 2) + next(2)));
          shooters.push({ c, n });
          count -= n;
        }
      }
      for (let k = next(3); k > 0 && shooters.length > 1; k--) {
        const i = next(shooters.length);
        const j = next(shooters.length);
        [shooters[i], shooters[j]] = [shooters[j]!, shooters[i]!];
      }
      const lanes: Shooter[][] = [[], []];
      // Biased towards lane 0, so the order inside a lane matters more often.
      shooters.forEach((sh) => lanes[next(3) === 0 ? 1 : 0]!.push(sh));
      return { rows, lanes, slots, shooters: shooters.length };
    })
  )
  .filter((p) => p.shooters >= 1 && p.shooters <= 6);

/**
 * A tiny nested puzzle: a ring of `a` around a core of `b`/`c` (3–5 × 3–4), the core split into one-shot shooters
 * that stand in front of the ring's shooters in their lanes. With few slots many of these cannot be finished.
 */
export const nestedArb = fc
  .record({
    w: fc.integer({ min: 3, max: 5 }),
    h: fc.integer({ min: 3, max: 4 }),
    slots: fc.integer({ min: 1, max: 2 }),
    core: fc.array(fc.constantFrom('b', 'c', '.'), { minLength: 6, maxLength: 6 }),
    ringParts: fc.integer({ min: 1, max: 2 }),
    lanesOf: fc.array(fc.integer({ min: 0, max: 2 }), { minLength: 8, maxLength: 8 })
  })
  .map(({ w, h, slots, core, ringParts, lanesOf }) => {
    const rows: string[] = [];
    let k = 0;
    for (let y = 0; y < h; y++) {
      let row = '';
      for (let x = 0; x < w; x++) row += x === 0 || y === 0 || x === w - 1 || y === h - 1 ? 'a' : (core[k++ % core.length] as string);
      rows.push(row);
    }
    const cells = rows.join('');
    const shooters: Shooter[] = [];
    for (const c of 'bc') for (let i = 0; i < cells.split(c).length - 1; i++) shooters.push({ c, n: 1 });
    const ring = cells.split('a').length - 1;
    const first = ringParts === 1 ? ring : Math.ceil(ring / 2);
    shooters.push({ c: 'a', n: first });
    if (ring - first > 0) shooters.push({ c: 'a', n: ring - first });
    const lanes: Shooter[][] = [[], []];
    shooters.forEach((s, i) => lanes[(lanesOf[i] ?? 0) === 2 ? 1 : 0]!.push(s));
    return { rows, lanes, slots, shooters: shooters.length };
  })
  .filter((p) => p.shooters <= 6);
