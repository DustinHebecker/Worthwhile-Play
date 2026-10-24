import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createInitial } from '../src/generate';
import { MOTIFS } from '../src/motifs/index';
import {
  EMPTY,
  apply,
  canUndo,
  initialPosition,
  isPeelState,
  isSolved,
  isStuck,
  legalMoves,
  parseMove,
  play,
  position,
  preview,
  replay,
  resetState,
  restart,
  settingsOf,
  stationLines,
  toDifficulty,
  undo,
  undoTo,
  type PeelState
} from '../src/rules';
import { gridArb, pictureOf, stateOf } from './helpers';
import { exposedCells, front, launch } from './reference';

const cellsOf = (rows: string[]) => rows.join('').split('');
const xy = (i: number, w: number) => [i % w, Math.floor(i / w)];
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

describe('track and fronts (design § 4.2)', () => {
  it('has 2W + 2H stations in the documented order, starting at the bottom-left corner', () => {
    const lines = stationLines(3, 2);
    expect(lines).toHaveLength(10);
    // Bottom: columns 0..2 scanning upwards; right: rows 1, 0 leftwards; top: columns 2..0 downwards; left: rows 0, 1.
    expect(lines).toEqual([
      [3, 0], [4, 1], [5, 2],
      [5, 4, 3], [2, 1, 0],
      [2, 5], [1, 4], [0, 3],
      [0, 1, 2], [3, 4, 5]
    ]);
  });

  it('skips transparent and removed cells; a station without cells has no front', () => {
    const lines = stationLines(3, 1);
    expect(front(cellsOf(['.a.']), lines[0]!)).toBe(-1);
    expect(front(cellsOf(['.a.']), lines[1]!)).toBe(1);
    expect(front(cellsOf(['..b']), lines[4]!)).toBe(2);
  });

  it('a corner pixel is the front of two stations', () => {
    const cells = cellsOf(['ab', 'cd']);
    const lines = stationLines(2, 2);
    const fronts = lines.map((l) => front(cells, l));
    expect(fronts.filter((f) => f === 0)).toHaveLength(2);
    expect(exposedCells(cells, 2, 2)).toEqual([0, 1, 2, 3]);
  });

  it('exposed equals a brute-force scan from all four sides (property)', () => {
    fc.assert(
      fc.property(gridArb(6, 6), ({ w, h, cells }) => {
        const brute = new Set<number>();
        const first = (idx: number[]) => idx.find((i) => cells[i] !== EMPTY);
        for (let x = 0; x < w; x++) {
          const col = Array.from({ length: h }, (_, y) => y * w + x);
          for (const f of [first(col), first([...col].reverse())]) if (f !== undefined) brute.add(f);
        }
        for (let y = 0; y < h; y++) {
          const row = Array.from({ length: w }, (_, x) => y * w + x);
          for (const f of [first(row), first([...row].reverse())]) if (f !== undefined) brute.add(f);
        }
        expect(exposedCells(cells, w, h)).toEqual([...brute].sort((a, b) => a - b));
      }),
      { numRuns: 300 }
    );
  });
});

describe('one launch (design § 4.3)', () => {
  it('worked example: {a, 3} on aba / bba hits stations 2, 4, 7; then {b, 3} hits 0, 1, 4', () => {
    const first = launch(cellsOf(['aba', 'bba']), 3, 2, { c: 'a', n: 3 });
    expect(first.hits.map((h) => h.station)).toEqual([2, 4, 7]);
    expect(first.hits.map((h) => xy(h.cell, 3))).toEqual([[2, 1], [2, 0], [0, 0]]);
    expect(first.left).toBe(0);
    expect(first.cells.join('')).toBe('.b.bb.');
    const second = launch(first.cells, 3, 2, { c: 'b', n: 3 });
    expect(second.hits.map((h) => h.station)).toEqual([0, 1, 4]);
    expect(second.cells.every((c) => c === EMPTY)).toBe(true);
  });

  it('a ring around one pixel: the inner colour finds nothing until the ring is gone', () => {
    const ring = cellsOf(['aaa', 'aba', 'aaa']);
    expect(launch(ring, 3, 3, { c: 'b', n: 1 })).toMatchObject({ hits: [], left: 1 });
    const peeled = launch(ring, 3, 3, { c: 'a', n: 8 });
    expect(peeled.left).toBe(0);
    expect(launch(peeled.cells, 3, 3, { c: 'b', n: 1 }).hits.map((h) => h.cell)).toEqual([4]);
  });

  it('keeps lapping while it hits: a column of the same colour goes in one launch', () => {
    const r = launch(cellsOf(['a', 'a', 'a', 'a']), 1, 4, { c: 'a', n: 9 });
    expect(r.hits).toHaveLength(4);
    expect(r.left).toBe(5);
  });

  it('launch properties on random grids and shooters', () => {
    fc.assert(
      fc.property(gridArb(8, 8), fc.constantFrom('a', 'b', 'c'), fc.integer({ min: 1, max: 30 }), ({ w, h, cells }, c, n) => {
        const before = cells.slice();
        const r = launch(cells, w, h, { c, n });
        // Pure: the input is untouched.
        expect(cells).toEqual(before);
        expect(r.hits.length).toBeLessThanOrEqual(n);
        expect(r.left).toBe(n - r.hits.length);
        // Every removed cell had colour c and was the front of its station at the moment it was hit.
        const lines = stationLines(w, h);
        const walk = cells.slice();
        for (const hit of r.hits) {
          expect(walk[hit.cell]).toBe(c);
          expect(front(walk, lines[hit.station]!)).toBe(hit.cell);
          walk[hit.cell] = EMPTY;
        }
        expect(walk).toEqual(r.cells);
        // Laps stop exactly after a lap without hits: with shots left, nothing of colour c is exposed any more.
        if (r.left > 0) expect(exposedCells(r.cells, w, h).some((i) => r.cells[i] === c)).toBe(false);
        // Stations fire at most once per lap: hits within a lap have strictly increasing stations.
        let lap = 0;
        let last = -1;
        for (const hit of r.hits) {
          if (hit.station <= last) lap++;
          last = hit.station;
        }
        expect(lap).toBeLessThanOrEqual(r.hits.length);
        // Copy independence: launching on a copy gives the same result.
        expect(launch(cells.slice(), w, h, { c, n })).toEqual(r);
      }),
      { numRuns: 400 }
    );
  });

  it('a shooter without shots hits nothing', () => {
    expect(launch(cellsOf(['a']), 1, 1, { c: 'a', n: 0 })).toMatchObject({ hits: [], left: 0 });
  });
});

describe('moves, slots and stuck (design § 4.4, § 4.5)', () => {
  // 4 × 3: a ring of a around two b. Lane 0: b1 then a10; lane 1: b1. One slot.
  const ringRows = ['aaaa', 'abba', 'aaaa'];
  const ring = () => stateOf(ringRows, [[{ c: 'b', n: 1 }, { c: 'a', n: 10 }], [{ c: 'b', n: 1 }]], 1);

  it('parks a lane front that hits nothing in the lowest free slot', () => {
    const pos = initialPosition(ring());
    const p = preview(pos, 'L0');
    expect(p).toMatchObject({ legal: true, parks: true, slot: 0, left: 1 });
    const next = apply(pos, 'L0');
    expect(next.slots).toEqual([{ c: 'b', n: 1, lane: 0, index: 0 }]);
    expect(next.laneFront).toEqual([1, 0]);
    expect(next.parks).toBe(1);
  });

  it('a lane launch with shots left and no free slot is illegal', () => {
    const pos = apply(initialPosition(ring()), 'L1');
    expect(preview(pos, 'L0')).toMatchObject({ legal: false, reason: 'noSlot', left: 1 });
  });

  it('a slot relaunch without hits is illegal; with hits it keeps its slot or frees it', () => {
    const state = ring();
    let pos = apply(initialPosition(state), 'L0');
    expect(preview(pos, 'S0')).toMatchObject({ legal: false, reason: 'nothing' });
    pos = apply(pos, 'L0');
    expect(preview(pos, 'S0')).toMatchObject({ legal: true, left: 0, slot: -1 });
    pos = apply(pos, 'S0');
    expect(pos.slots).toEqual([null]);
  });

  it('a relaunch with shots left returns to the same slot', () => {
    // Three b inside a ring of a. b3 parks; a2 opens the bottom of column 1; b3 then hits one b and keeps its slot.
    const state = stateOf(['aaaaa', 'abbba', 'aaaaa'], [[{ c: 'b', n: 3 }], [{ c: 'a', n: 2 }, { c: 'a', n: 10 }]], 2);
    let pos = apply(initialPosition(state), 'L0');
    expect(pos.slots).toEqual([{ c: 'b', n: 3, lane: 0, index: 0 }, null]);
    pos = apply(pos, 'L1');
    expect(preview(pos, 'S0')).toMatchObject({ legal: true, left: 2, slot: 0 });
    pos = apply(pos, 'S0');
    expect(pos.slots).toEqual([{ c: 'b', n: 2, lane: 0, index: 0 }, null]);
    expect(pos.parks).toBe(1);
    expect(pos.launches).toBe(3);
  });

  it('an empty lane, an empty slot and a malformed move are not legal', () => {
    const state = ring();
    const pos = replay(initialPosition(state), ['L1'])!;
    expect(preview(pos, 'L1')).toMatchObject({ legal: false, reason: 'empty' });
    expect(preview(initialPosition(state), 'S0')).toMatchObject({ legal: false, reason: 'empty' });
    for (const bad of ['L9', 'S7', 'X0', '', 'L', 'L01']) expect(preview(pos, bad).legal).toBe(false);
    expect(parseMove(42)).toBeUndefined();
  });

  it('an illegal play returns the same object', () => {
    const state = ring();
    expect(play(state, 'S0')).toBe(state);
    expect(play(state, 'L7')).toBe(state);
    const moved = play(state, 'L1');
    expect(moved).not.toBe(state);
    expect(play(moved, 'L0')).toBe(moved);
  });

  it('detects a stuck position: every slot full of unreachable colours, no lane front used up', () => {
    const state = ring();
    const pos = position(play(state, 'L1'));
    expect(legalMoves(pos)).toEqual([]);
    expect(isStuck(pos)).toBe(true);
    expect(isSolved(pos)).toBe(false);
    // The witness avoids it.
    expect(isSolved(replay(initialPosition(state), state.witness)!)).toBe(true);
  });

  it('the invariant holds after every move: shots per colour equal present cells of that colour', () => {
    const state = createInitial(5, 'hard', 'tiger');
    let pos = initialPosition(state);
    for (const move of state.witness) {
      pos = apply(pos, move);
      const counts = new Map<string, number>();
      for (const c of pos.cells) if (c !== EMPTY) counts.set(c, (counts.get(c) ?? 0) + 1);
      const shots = new Map<string, number>();
      pos.lanes.forEach((lane, i) => lane.slice(pos.laneFront[i]).forEach((s) => shots.set(s.c, (shots.get(s.c) ?? 0) + s.n)));
      for (const s of pos.slots) if (s) shots.set(s.c, (shots.get(s.c) ?? 0) + s.n);
      expect(shots).toEqual(counts);
    }
    expect(isSolved(pos)).toBe(true);
  });
});

describe('undo and restart (design § 4.6)', () => {
  it('undo restores the previous position exactly; restart keeps the moves for one undo', () => {
    const s0 = createInitial(3, 'medium', 'koala');
    const s1 = play(s0, s0.witness[0]!);
    const s2 = play(s1, s1.witness[1]!);
    expect(position(undo(s2))).toEqual(position(s1));
    const r = restart(s2);
    expect(r.moves).toEqual([]);
    expect(r.restartUndo).toEqual(s2.moves);
    expect(undo(r).moves).toEqual(s2.moves);
    expect(undo(r).restartUndo).toBeNull();
    // Any new move discards restartUndo.
    expect(play(r, r.witness[0]!).restartUndo).toBeNull();
    expect(restart(s0)).toBe(s0);
    expect(undo(s0)).toBe(s0);
    expect(canUndo(s0)).toBe(false);
  });

  it('undoTo goes back to a move number; out of range changes nothing', () => {
    let s = createInitial(4, 'easy', 'llama');
    for (const m of s.witness.slice(0, 4)) s = play(s, m);
    expect(undoTo(s, 2).moves).toEqual(s.moves.slice(0, 2));
    expect(undoTo(s, 4)).toBe(s);
    expect(undoTo(s, -1)).toBe(s);
    expect(undoTo(s, 1.5)).toBe(s);
  });

  it('after the picture is solved, undo and restart are not offered', () => {
    let s = createInitial(8, 'easy', 'red-fox');
    for (const m of s.witness) s = play(s, m);
    expect(isSolved(position(s))).toBe(true);
    expect(canUndo(s)).toBe(false);
    expect(undo(s)).toBe(s);
    expect(restart(s)).toBe(s);
  });

  it('arbitrary sequences of moves, undos and restarts never throw and stay valid (property)', () => {
    const base = createInitial(11, 'hard', 'elephant');
    fc.assert(
      fc.property(fc.array(fc.oneof(fc.constantFrom('undo', 'restart', 'witness'), fc.constantFrom('L0', 'L1', 'L2', 'S0', 'S1')), { maxLength: 40 }), (ops) => {
        let s = base;
        for (const op of ops) {
          const before = s;
          if (op === 'undo') s = undo(s);
          else if (op === 'restart') s = restart(s);
          else if (op === 'witness') s = play(s, s.witness[s.moves.length] ?? 'L0');
          else {
            s = play(s, op);
            if (s !== before) expect(position(undo(s))).toEqual(position(before));
          }
          expect(isPeelState(clone(s))).toBe(true);
        }
      }),
      { numRuns: 60 }
    );
  });

  it('reset keeps the picture and lanes and clears the moves', () => {
    const s = play(createInitial(2, 'easy', 'fjord'), 'L0');
    const r = resetState({ ...s, restartUndo: null });
    expect(r.moves).toEqual([]);
    expect(r.lanes).toEqual(s.lanes);
    expect(r.reported).toBe(false);
  });
});

describe('isPeelState (never throws)', () => {
  const valid = createInitial(21, 'medium', 'tiger');

  it('accepts generated states and rejects junk without throwing', () => {
    expect(isPeelState(clone(valid))).toBe(true);
    fc.assert(
      fc.property(fc.anything(), (v) => {
        expect(() => isPeelState(v)).not.toThrow();
        expect(isPeelState(v)).toBe(false);
      }),
      { numRuns: 300 }
    );
  });

  const mutations: [string, (s: PeelState) => unknown][] = [
    ['broken invariant', (s) => ({ ...s, lanes: s.lanes.map((l, i) => (i === 0 ? [{ ...l[0]!, n: l[0]!.n + 1 }, ...l.slice(1)] : l)) })],
    ['bad row length', (s) => ({ ...s, picture: { ...s.picture, rows: [s.picture.rows[0]!.slice(1), ...s.picture.rows.slice(1)] } })],
    ['unknown palette key', (s) => ({ ...s, picture: { ...s.picture, rows: [`z${s.picture.rows[0]!.slice(1)}`, ...s.picture.rows.slice(1)] } })],
    ['witness that does not solve', (s) => ({ ...s, witness: s.witness.slice(0, -1) })],
    ['illegal move in moves', (s) => ({ ...s, moves: ['S4'] })],
    ['illegal move in restartUndo', (s) => ({ ...s, restartUndo: ['S4'] })],
    ['restartUndo with moves', (s) => ({ ...s, moves: [s.witness[0]], restartUndo: [s.witness[0]] })],
    ['more than 6 slots', (s) => ({ ...s, slots: 7 })],
    ['zero slots', (s) => ({ ...s, slots: 0 })],
    ['more than 4 lanes', (s) => ({ ...s, lanes: [...s.lanes, [], [], []] })],
    ['bad hex', (s) => ({ ...s, picture: { ...s.picture, palette: s.picture.palette.map((p, i) => (i === 0 ? { ...p, hex: 'red' } : p)) } })],
    ['bad backdrop', (s) => ({ ...s, picture: { ...s.picture, backdrop: '#12345' } })],
    ['unknown colour name', (s) => ({ ...s, picture: { ...s.picture, palette: s.picture.palette.map((p, i) => (i === 0 ? { ...p, name: 'fuchsia' } : p)) } })],
    ['duplicate palette key', (s) => ({ ...s, picture: { ...s.picture, palette: [...s.picture.palette, s.picture.palette[0]] } })],
    ['reported while unsolved', (s) => ({ ...s, reported: true })],
    ['bad difficulty', (s) => ({ ...s, difficulty: 'expert' })],
    ['bad seed', (s) => ({ ...s, seed: -1 })],
    ['bad choice', (s) => ({ ...s, choice: 'Red Fox!' })],
    ['picture too small', (s) => ({ ...s, picture: { ...s.picture, w: 3 } })],
    ['zero shots', (s) => ({ ...s, lanes: [[{ c: s.lanes[0]![0]!.c, n: 0 }], ...s.lanes.slice(1)] })],
    ['too many moves', (s) => ({ ...s, moves: Array.from({ length: 2501 }, () => 'L0') })],
    ['a side of 65', (s) => ({ ...s, picture: { ...s.picture, w: 65, rows: s.picture.rows.map((r) => r.padEnd(65, '.')) } })],
    ['21 palette entries', (s) => ({ ...s, picture: { ...s.picture, palette: [...s.picture.palette, ...'abcdefghijklmnopqrstuvwxyz'.split('').filter((k) => !s.picture.palette.some((p) => p.key === k)).map((key) => ({ key, hex: '#123456', name: 'black' }))].slice(0, 21) } })],
    ['161 shooters', (s) => {
      const c = s.lanes[0]![0]!.c;
      const cells = s.picture.rows.join('').split(c).length - 1;
      const extra = Array.from({ length: 161 }, () => ({ c, n: 1 }));
      return { ...s, lanes: [extra, ...s.lanes.map((l) => l.filter((x) => x.c !== c))], _cells: cells };
    }],
    ['missing field', (s) => {
      const { witness: _w, ...rest } = s;
      return rest;
    }]
  ];
  for (const [name, mutate] of mutations) {
    it(`rejects a save with ${name}`, () => {
      expect(isPeelState(mutate(clone(valid)))).toBe(false);
    });
  }

  it('accepts a solved and reported state', () => {
    let s = valid;
    for (const m of s.witness) s = play(s, m);
    expect(isPeelState({ ...s, reported: true })).toBe(true);
  });
});

describe('settings', () => {
  it('settingsOf tells the difficulty and the start-screen choice', () => {
    // Three choices here; generator.slow.test.ts starts every motif at every difficulty.
    for (const choice of ['any', MOTIFS[0]!.id, MOTIFS[MOTIFS.length - 1]!.id]) {
      for (const d of ['easy', 'medium', 'hard'] as const) {
        const s = createInitial(7, d, choice);
        expect(settingsOf(s)).toEqual({ difficulty: d, motif: choice });
        if (choice !== 'any') expect(s.motif).toBe(choice);
      }
    }
  });

  it('treats unknown input as the defaults', () => {
    expect(toDifficulty('expert')).toBe('easy');
    const s = createInitial(7, 'nope', 'unicorn');
    expect(s.difficulty).toBe('easy');
    expect(s.choice).toBe('any');
    expect(createInitial(7, 'easy', 'any')).toEqual(s);
  });

  it('a hand-made picture validates with its own palette', () => {
    const p = pictureOf(['aaaa', 'abba', 'aaaa', 'aaaa']);
    expect(p.palette.map((x) => x.key)).toEqual(['a', 'b']);
  });
});
