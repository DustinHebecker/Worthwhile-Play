import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { computerReply } from '../src/ai';
import {
  START_FEN,
  colorChoiceOf,
  createGame,
  createVariation,
  isValidState,
  isValidVariation,
  legalMoves,
  moveToUci,
  nextSeed,
  outcomeOf,
  puzzlesFor,
  randomColor,
  replay,
  toFen,
  variationFlip,
  variationPlay,
  variationReset,
  variationStep,
  variationView,
  type ChessState,
  type Variation
} from '../src/rules';

const game = (extra: Partial<Parameters<typeof createGame>[0]> = {}): ChessState =>
  createGame({ seed: 7, difficulty: 'beginner', opponent: 'computer', humanColor: 'w', ...extra });

describe('random colour', () => {
  it('draws the colour deterministically from the seed, with both colours occurring', () => {
    const colours = Array.from({ length: 40 }, (_, seed) => randomColor(seed));
    expect(colours).toEqual(Array.from({ length: 40 }, (_, seed) => randomColor(seed)));
    expect(colours.filter((c) => c === 'w').length).toBeGreaterThan(8);
    expect(colours.filter((c) => c === 'b').length).toBeGreaterThan(8);
    expect(new Set(colours)).toEqual(new Set(['w', 'b']));
  });

  it('stores the drawn colour and remembers that it was random (against the computer only)', () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const state = game({ seed, humanColor: 'random' });
      expect(state.humanColor).toBe(randomColor(seed));
      expect(state.colorRandom).toBe(true);
      expect(colorChoiceOf(state)).toBe('random');
      // Valid once the computer made its opening move (when it plays White).
      expect(isValidState(computerReply(state))).toBe(true);
    }
    const fixed = game({ humanColor: 'b' });
    expect(fixed.colorRandom).toBeUndefined();
    expect('colorRandom' in fixed).toBe(false);
    expect(colorChoiceOf(fixed)).toBe('b');
    // Two players and puzzles: no "random" flag (the colour does not matter / comes from the puzzle).
    expect('colorRandom' in game({ opponent: 'human', humanColor: 'random' })).toBe(false);
    const puzzle = game({ humanColor: 'random', mode: 'mate', mateN: 1 });
    expect('colorRandom' in puzzle).toBe(false);
    expect(puzzle.humanColor).toBe(puzzlesFor('mate', 1)[0]!.fen.split(' ')[1]);
  });

  it('validates the random flag against the seed', () => {
    const state = computerReply(game({ seed: 11, humanColor: 'random' }));
    expect(isValidState(state)).toBe(true);
    const other = state.humanColor === 'w' ? 'b' : 'w';
    expect(isValidState({ ...state, humanColor: other })).toBe(false);
    expect(isValidState({ ...state, colorRandom: false })).toBe(false);
    expect(isValidState({ ...state, colorRandom: 'yes' })).toBe(false);
    expect(isValidState({ ...state, opponent: 'human' })).toBe(false);
    expect(isValidState({ ...state, unknown: 1 })).toBe(false);
    // Saves from before the option existed (no flag) still restore.
    const { colorRandom: _flag, ...old } = state;
    expect(isValidState(old)).toBe(true);
  });

  it('derives fresh, deterministic seeds for games started from the menu', () => {
    expect(nextSeed(5)).toBe(nextSeed(5));
    expect(nextSeed(5)).not.toBe(5);
    expect(nextSeed(5)).not.toBe(nextSeed(6));
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 0xffff_ffff }), (seed) => {
        const next = nextSeed(seed);
        return Number.isInteger(next) && next >= 0 && next <= 0xffff_ffff;
      })
    );
  });
});

describe('variation board', () => {
  const fen = toFen(replay(START_FEN, ['e2e4', 'e7e5'])!.pos);

  it('plays legal moves for both sides and keeps the rest of the line when stepping', () => {
    let v = createVariation(fen, 'b');
    expect(v).toEqual({ fen, moves: [], cursor: 0, orientation: 'b' });
    v = variationPlay(v, 'g1f3');
    v = variationPlay(v, 'b8c6');
    v = variationPlay(v, 'f1b5');
    expect(v.moves).toEqual(['g1f3', 'b8c6', 'f1b5']);
    expect(v.cursor).toBe(3);
    expect(variationView(v).sans).toEqual(['Nf3', 'Nc6', 'Bb5']);
    v = variationStep(v, -2);
    expect(v.cursor).toBe(1);
    expect(v.moves).toHaveLength(3);
    expect(variationView(v).moves).toHaveLength(1);
    // The same move as the stored next one just steps forward …
    const same = variationPlay(v, 'b8c6');
    expect(same.moves).toEqual(['g1f3', 'b8c6', 'f1b5']);
    expect(same.cursor).toBe(2);
    // … a different one replaces the rest of the line.
    const other = variationPlay(v, 'g8f6');
    expect(other.moves).toEqual(['g1f3', 'g8f6']);
    expect(other.cursor).toBe(2);
    expect(variationStep(v, -9).cursor).toBe(0);
    expect(variationStep(v, 9).cursor).toBe(3);
    expect(variationReset(v)).toEqual({ fen, moves: [], cursor: 0, orientation: 'b' });
    expect(variationFlip(v).orientation).toBe('w');
    expect(variationFlip(variationFlip(v))).toEqual(v);
    // Pure: the input is never changed.
    expect(v.moves).toEqual(['g1f3', 'b8c6', 'f1b5']);
    expect(v.cursor).toBe(1);
  });

  it('rejects illegal moves and moves after the end of the line', () => {
    const v = createVariation(fen, 'w');
    expect(() => variationPlay(v, 'e4e5')).toThrow();
    expect(() => variationPlay(v, 'e7e6')).toThrow(); // black is not to move
    const mated = ['f1c4', 'b8c6', 'd1h5', 'g8f6', 'h5f7'].reduce(variationPlay, v);
    expect(variationView(mated).status.kind).toBe('checkmate');
    expect(() => variationPlay(mated, 'e8e7')).toThrow();
  });

  it('validates untrusted variations thoroughly without throwing', () => {
    const v = variationPlay(createVariation(fen, 'w'), 'g1f3');
    expect(isValidVariation(v)).toBe(true);
    const bad: unknown[] = [
      null,
      'x',
      [],
      { ...v, extra: 1 },
      { ...v, fen: 'nonsense' },
      { ...v, fen: 42 },
      { ...v, moves: ['g1f4'] },
      { ...v, moves: ['zz'] },
      { ...v, moves: 'g1f3' },
      { ...v, cursor: 2 },
      { ...v, cursor: -1 },
      { ...v, cursor: 0.5 },
      { ...v, orientation: 'white' },
      { fen: v.fen, moves: v.moves, cursor: v.cursor }
    ];
    for (const value of bad) expect(isValidVariation(value), JSON.stringify(value)).toBe(false);
    expect(isValidVariation({ ...v, cursor: 0 })).toBe(true);
    expect(isValidVariation(createVariation(fen, 'b'))).toBe(true);
  });

  it('is an optional state field that never changes the game itself', () => {
    const state = game({ opponent: 'human' });
    const withVariation: ChessState = { ...state, variation: variationPlay(createVariation(START_FEN, 'w'), 'd2d4') };
    expect(isValidState(withVariation)).toBe(true);
    expect(isValidState(state)).toBe(true); // older saves without the field
    expect(outcomeOf(withVariation)).toEqual(outcomeOf(state));
    expect(isValidState({ ...state, variation: { ...withVariation.variation!, moves: ['d2d5'] } })).toBe(false);
    expect(isValidState({ ...state, variation: undefined })).toBe(false);
    expect(isValidState({ ...state, variation: null })).toBe(false);
    // Also in puzzles, and in finished games.
    const puzzle = createGame({ seed: 1, difficulty: 'beginner', opponent: 'computer', humanColor: 'w', mode: 'mate', mateN: 2 });
    expect(isValidState({ ...puzzle, variation: createVariation(puzzle.start, 'w') })).toBe(true);
  });

  it('property: any walk of plays, steps, resets and flips keeps a valid variation', () => {
    fc.assert(
      fc.property(fc.array(fc.tuple(fc.integer({ min: 0, max: 9 }), fc.nat()), { maxLength: 30 }), (actions) => {
        let v: Variation = createVariation(fen, 'w');
        for (const [kind, n] of actions) {
          if (kind <= 5) {
            const game = variationView(v);
            const legal = legalMoves(game.pos);
            if (game.status.kind === 'playing' && legal.length > 0) v = variationPlay(v, moveToUci(legal[n % legal.length]!));
          } else if (kind === 6) v = variationStep(v, -1 - (n % 3));
          else if (kind === 7) v = variationStep(v, 1 + (n % 3));
          else if (kind === 8) v = variationFlip(v);
          else if (n % 5 === 0) v = variationReset(v);
          if (!isValidVariation(v) || v.cursor < 0 || v.cursor > v.moves.length) return false;
        }
        return JSON.parse(JSON.stringify(v)) !== null && isValidVariation(JSON.parse(JSON.stringify(v)));
      }),
      { numRuns: 40 }
    );
  });
});

describe('best-move lines in the state', () => {
  it('stores the line with the engine replies; an odd number of moves means solved', () => {
    const list = puzzlesFor('best', 1);
    const index = list.findIndex((p) => p.line.length >= 3);
    expect(index).toBeGreaterThanOrEqual(0);
    const ref = list[index]!;
    const state = createGame({ seed: 1, difficulty: 'beginner', opponent: 'human', humanColor: 'w', mode: 'best', puzzle: index });
    expect(outcomeOf(state).kind).toBe('playing');
    const mid = { ...state, moves: ref.line.slice(0, 2) };
    expect(isValidState(mid)).toBe(true);
    expect(outcomeOf(mid).kind).toBe('playing');
    const done = { ...state, moves: [...ref.line] };
    expect(isValidState(done)).toBe(true);
    expect(outcomeOf(done).kind).toBe('solved');
    // A save from the single-move era (only the first move) is still valid and counts as solved.
    const legacy = { ...state, moves: ref.line.slice(0, 1) };
    expect(isValidState(legacy)).toBe(true);
    expect(outcomeOf(legacy).kind).toBe('solved');
    // Anything off the stored line is rejected.
    const pos = replay(ref.fen, ref.line.slice(0, 1))!.pos;
    const wrongReply = legalMoves(pos).map(moveToUci).find((m) => m !== ref.line[1])!;
    expect(isValidState({ ...state, moves: [ref.line[0]!, wrongReply] })).toBe(false);
    expect(isValidState({ ...state, moves: [...ref.line, 'a1a1'] })).toBe(false);
  });
});
