import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { createRng } from '@wp/game-core';
import {
  ALL_FEATURES,
  LEVELS,
  MATE,
  TERMS,
  analyse,
  attackMaps,
  chooseMove,
  computerReply,
  evaluate,
  evaluateTerms,
  explainMove,
  featureMask,
  glance,
  playTurn,
  quickEvaluate,
  suggestMove,
  DECISIVE_LEAD,
  MAX_LINE_MOVES,
  PUZZLE_LEVEL,
  evaluatePosition,
  extendBestLine,
  uniqueBestMove,
  verifyBestMovePuzzle,
  type Level
} from '../src/ai';
import { START_FEN, createGame, isValidState, legalMoves, makeMove, moveFrom, moveToUci, parseFen, parseSquare, replay, startPosition, toFen, type ChessState } from '../src/rules';

const pos = (fen: string) => {
  const p = parseFen(fen);
  if (!p) throw new Error(`bad FEN ${fen}`);
  return p;
};

/** The same position with colours swapped and the board mirrored top-to-bottom. */
function mirrorFen(fen: string): string {
  const [placement, side, castling, ep, half, full] = fen.split(' ') as [string, string, string, string, string, string];
  const swap = (text: string) => text.replace(/[a-zA-Z]/g, (c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()));
  const rows = placement.split('/').reverse().map(swap).join('/');
  const rights = castling === '-' ? '-' : ['K', 'Q', 'k', 'q'].filter((c) => swap(castling).includes(c)).join('');
  const target = ep === '-' ? '-' : ep[0]! + String(9 - Number(ep[1]));
  return `${rows} ${side === 'w' ? 'b' : 'w'} ${rights} ${target} ${half} ${full}`;
}

const terms = (fen: string) => evaluateTerms(pos(fen));
const fast: Level = { ...LEVELS.strong, nodes: 30_000 };
const vsComputer = (moves: string[], extra: Partial<ChessState> = {}): ChessState => ({
  ...createGame({ seed: 7, difficulty: 'strong', opponent: 'computer', humanColor: 'w' }),
  moves,
  ...extra
});

describe('evaluation', () => {
  it('is balanced in the start position apart from the side to move’s tempo', () => {
    const t = terms(START_FEN);
    for (const term of TERMS) expect(t[term], term).toBe(term === 'tempo' ? 10 : 0);
    expect(evaluate(startPosition())).toBe(10);
  });

  it('is colour-symmetric (property over random positions)', () => {
    fc.assert(
      fc.property(fc.array(fc.nat(), { maxLength: 40 }), (choices) => {
        const p = startPosition();
        for (const c of choices) {
          const legal = legalMoves(p);
          if (legal.length === 0) break;
          makeMove(p, legal[c % legal.length]!);
        }
        const mirrored = pos(mirrorFen(toFen(p)));
        // (+ 0 normalises -0.)
        expect(evaluate(mirrored) + 0).toBe(evaluate(p) + 0);
        expect(quickEvaluate(mirrored) + 0).toBe(quickEvaluate(p) + 0);
        expect(evaluate(p, featureMask(['material'])) + 0).toBe(evaluate(mirrored, featureMask(['material'])) + 0);
      }),
      // The example is a CI counterexample: a tapered score ending in .5 once rounded differently per colour.
      { numRuns: 60, examples: [[[1369190316, 2029470155, 125136451, 482959727, 826866478, 51055678, 699105058, 2026852746, 1500952465, 946868968]]] }
    );
  });

  it('counts material with tapered piece values', () => {
    expect(terms('4k3/8/8/8/8/8/8/3QK3 w - - 0 1').material).toBeCloseTo(950 * 4 / 24 + 950 * 20 / 24);
    expect(terms('4k3/8/8/8/8/8/P7/4K3 w - - 0 1').material).toBe(120);
    expect(terms('4k3/p7/8/8/8/8/8/4K3 w - - 0 1').material).toBe(-120);
  });

  it('penalises doubled, isolated and backward pawns and rewards connected ones', () => {
    expect(terms('4k3/8/8/8/8/2P5/2P5/4K3 w - - 0 1').pawnStructure).toBeLessThan(terms('4k3/8/8/8/8/8/2PP4/4K3 w - - 0 1').pawnStructure);
    expect(terms('4k3/8/8/8/8/8/P1P5/4K3 w - - 0 1').pawnStructure).toBeLessThan(terms('4k3/8/8/8/8/8/1PP5/4K3 w - - 0 1').pawnStructure);
    expect(terms('4k3/8/8/8/8/8/1PP5/4K3 w - - 0 1').pawnStructure).toBeGreaterThan(0);
    // d2 is backward: c3 is ahead and the stop square d3 is covered by a black pawn on e4.
    expect(terms('4k3/8/8/8/4p3/2P5/3P4/4K3 w - - 0 1').pawnStructure).toBeLessThan(terms('4k3/8/8/8/4p3/3P4/2P5/4K3 w - - 0 1').pawnStructure);
  });

  it('values passed pawns by advancement, more in the endgame, less when blocked', () => {
    const e3 = terms('4k3/8/8/8/8/4P3/8/4K3 w - - 0 1').passedPawns;
    const e6 = terms('4k3/8/4P3/8/8/8/8/4K3 w - - 0 1').passedPawns;
    expect(e3).toBeGreaterThan(0);
    expect(e6).toBeGreaterThan(e3);
    expect(terms('8/4k3/4P3/8/8/8/8/4K3 w - - 0 1').passedPawns).toBeLessThan(terms('8/2k5/4P3/8/8/8/8/4K3 w - - 0 1').passedPawns);
    // Not passed: an enemy pawn on an adjacent file ahead.
    expect(terms('4k3/3p4/8/8/8/4P3/8/4K3 w - - 0 1').passedPawns).toBe(0); // the pawns block each other's paths
    // Rule of the square: an unstoppable pawn against a lone king.
    expect(terms('8/8/8/P7/8/8/8/4K2k w - - 0 1').passedPawns).toBeGreaterThan(terms('8/8/3k4/P7/8/8/8/4K3 w - - 0 1').passedPawns + 200);
  });

  it('knows the bishop pair, rooks on open files and the seventh rank, and outposts', () => {
    expect(terms('4k3/8/8/8/8/8/8/2B1KB2 w - - 0 1').bishopPair).toBeGreaterThan(0);
    expect(terms('4k3/8/8/8/8/8/8/2B1KN2 w - - 0 1').bishopPair).toBe(0);
    expect(terms('4k3/pppp4/8/8/8/8/PPP5/3RK3 w - - 0 1').rooks).toBeGreaterThan(terms('4k3/pppp4/8/8/8/8/PPPP4/3RK3 w - - 0 1').rooks);
    expect(terms('4k3/R7/8/8/8/8/8/4K3 w - - 0 1').rooks).toBeGreaterThan(terms('4k3/8/R7/8/8/8/8/4K3 w - - 0 1').rooks);
    // Knight on d5, protected by e4, with no black c/e pawn able to chase it.
    expect(terms('4k3/pp3pp1/3p4/3N4/4P3/8/8/4K3 w - - 0 1').outposts).toBeGreaterThan(0);
    expect(terms('4k3/pp2ppp1/3p4/3N4/4P3/8/8/4K3 w - - 0 1').outposts).toBe(0);
  });

  it('rewards development, castling, centre control and a pawn shield', () => {
    const after = (moves: string[]) => evaluateTerms(replay(START_FEN, moves)!.pos);
    expect(after(['g1f3']).development).toBeGreaterThan(0);
    expect(after(['e2e4']).centre).toBeGreaterThan(0);
    // Early queen sortie with sleeping minor pieces.
    expect(after(['e2e4', 'e7e5', 'd1h5']).development).toBeLessThan(after(['e2e4', 'e7e5', 'g1f3']).development);
    const castled = terms('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R4RK1 b kq - 0 1');
    const walked = terms('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R4K1R b kq - 0 1');
    expect(castled.castling).toBeGreaterThan(walked.castling);
    expect(terms('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w - - 0 1').castling).toBeLessThan(terms('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQ - 0 1').castling);
    // Kingside shelter with and without the g-pawn.
    expect(terms('r2qk2r/8/8/8/8/8/5PPP/3Q1RK1 w - - 0 1').kingSafety).toBeGreaterThan(terms('r2qk2r/8/8/8/8/8/5P1P/3Q1RK1 w - - 0 1').kingSafety);
  });

  it('feels pressure on the king zone', () => {
    const danger = terms('6k1/5ppp/7Q/6N1/8/3B4/5PPP/6K1 b - - 0 1').kingSafety;
    expect(danger).toBeGreaterThan(terms('6k1/5ppp/8/8/8/3B4/5PPP/3Q2K1 b - - 0 1').kingSafety);
  });

  it('activates the king and drives a lone king to the edge in the endgame', () => {
    expect(terms('7k/8/8/8/3K4/8/P7/8 w - - 0 1').kingActivity).toBeGreaterThan(terms('7k/8/8/8/8/8/P7/K7 w - - 0 1').kingActivity);
    expect(terms('k7/8/2K5/8/8/8/8/7Q w - - 0 1').mopUp).toBeGreaterThan(terms('8/8/8/3k4/8/8/7Q/K7 w - - 0 1').mopUp);
    expect(terms('8/8/8/3k4/8/8/7Q/K7 w - - 0 1').mopUp).toBeGreaterThan(0);
  });

  it('sees threats against pieces', () => {
    expect(terms('4k3/8/8/3p4/4N3/8/8/4K3 w - - 0 1').threats).toBeLessThan(0);
    expect(terms('4k3/8/8/8/4N3/8/8/4K3 w - - 0 1').threats).toBe(0);
    const maps = attackMaps(pos('4k3/8/8/3p4/4N3/8/8/4K3 w - - 0 1'));
    expect(maps.attacks[1]![parseSquare('e4')]).toBe(1);
    expect(maps.lowest[1]![parseSquare('e4')]).toBe(1);
    expect(maps.attacks[0]![parseSquare('d6')]).toBe(1);
  });

  it('recognises dead and drawish material', () => {
    expect(evaluate(pos('4k3/8/8/8/8/8/8/4KN2 w - - 0 1'))).toBe(0);
    expect(evaluate(pos('4k3/8/8/8/8/8/8/3BKB2 w - - 0 1'))).toBe(0);
    const rookVsBishop = Math.abs(evaluate(pos('4k3/8/8/8/8/8/2b5/R3K3 w - - 0 1')));
    const rookAlone = Math.abs(evaluate(pos('4k3/8/8/8/8/8/8/R3K3 w - - 0 1')));
    expect(rookVsBishop).toBeLessThan(60);
    expect(rookAlone).toBeGreaterThan(450);
    expect(Math.abs(evaluate(pos('4k3/8/8/8/8/8/8/1NN1K3 w - - 0 1')))).toBeLessThan(100);
    // Without the scaling feature the raw advantage remains.
    expect(Math.abs(evaluate(pos('4k3/8/8/8/8/8/2b5/R3K3 w - - 0 1'), ALL_FEATURES & ~(1 << TERMS.length)))).toBeGreaterThan(100);
  });
});

describe('search', { timeout: 60_000 }, () => {
  it('finds mate in one at every level', () => {
    for (const level of ['beginner', 'intermediate', 'strong'] as const) {
      for (let seed = 1; seed <= 4; seed++) {
        const p = pos('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1');
        expect(moveToUci(chooseMove(p, LEVELS[level], createRng(seed)).move), level).toBe('a1a8');
      }
    }
  });

  it('finds a mate in two with a queen sacrifice at the strong level', () => {
    const p = pos('r1b2k1r/ppp1bppp/8/1B1Q4/5q2/2P5/PPP2PPP/R3R1K1 w - - 1 1');
    const choice = chooseMove(p, LEVELS.strong, createRng(3));
    expect(moveToUci(choice.move)).toBe('d5d8');
    expect(choice.score).toBeGreaterThan(MATE - 10);
  });

  it('defends against mate in one', () => {
    // Black threatens Qxg2#/Qh2#; the knight must cover or the king flee.
    const p = pos('6k1/8/8/8/8/5q1p/5PPP/6K1 w - - 0 1');
    const choice = chooseMove(p, LEVELS.strong, createRng(1));
    const after = replay(toFen(p), [moveToUci(choice.move)])!;
    expect(legalMoves(after.pos).some((m) => replay(toFen(after.pos), [moveToUci(m)])!.status.kind === 'checkmate')).toBe(false);
  });

  it('takes a hanging queen and saves its own attacked piece at the strong level', () => {
    expect(moveToUci(chooseMove(pos('4k3/8/8/3q4/8/8/3R4/4K3 w - - 0 1'), LEVELS.strong, createRng(1)).move)).toBe('d2d5');
    for (let seed = 1; seed <= 3; seed++) {
      const choice = chooseMove(pos('4k3/8/8/3p4/4N3/8/8/4K3 w - - 0 1'), LEVELS.strong, createRng(seed));
      expect(moveFrom(choice.move)).toBe(parseSquare('e4'));
    }
    // Does not grab a defended pawn with the queen.
    const greedy = chooseMove(pos('4k3/2p5/3p4/8/8/8/8/3QK3 w - - 0 1'), LEVELS.strong, createRng(2));
    expect(moveToUci(greedy.move)).not.toBe('d1d6');
  });

  it('returns exact candidate scores, best first, within the margin', () => {
    const a = analyse(startPosition(), { ...fast, nodes: 8000 }, [], 30);
    expect(a.candidates.length).toBeGreaterThan(1);
    const best = a.candidates[0]!.score;
    for (const c of a.candidates) expect(c.score).toBeGreaterThanOrEqual(best - 30);
    expect([...a.candidates].sort((x, y) => y.score - x.score)).toEqual(a.candidates);
    expect(a.depth).toBeGreaterThanOrEqual(2);
    expect(a.nodes).toBeLessThanOrEqual(8001);
    // A single legal move needs no search.
    const forced = analyse(pos('k7/8/2K5/8/8/8/8/1R6 b - - 0 1'), fast);
    expect(forced.candidates.map((c) => moveToUci(c.move))).toEqual(['a8a7']);
    expect(forced.nodes).toBe(0);
  });

  it('is deterministic for the same state and seed', () => {
    const state = vsComputer(['e2e4', 'e7e5', 'g1f3'], { humanColor: 'b', difficulty: 'intermediate' });
    expect(computerReply(state)).toEqual(computerReply(state));
    const a = chooseMove(startPosition(), LEVELS.beginner, createRng(99));
    const b = chooseMove(startPosition(), LEVELS.beginner, createRng(99));
    expect(a).toEqual(b);
  });

  it('only ever plays legal moves (property, all levels)', () => {
    fc.assert(
      fc.property(fc.array(fc.nat(), { maxLength: 30 }), fc.nat(), fc.constantFrom('beginner', 'intermediate', 'strong'), (choices, seed, level) => {
        const p = startPosition();
        for (const c of choices) {
          const legal = legalMoves(p);
          if (legal.length === 0) return;
          makeMove(p, legal[c % legal.length]!);
        }
        if (legalMoves(p).length === 0) return;
        const choice = chooseMove(p, { ...LEVELS[level as 'strong'], nodes: Math.min(LEVELS[level as 'strong'].nodes, 3000) }, createRng(seed));
        expect(legalMoves(p)).toContain(choice.move);
      }),
      { numRuns: 25 }
    );
  });

  it('plays a whole game against itself without illegal moves or half turns', () => {
    let state: ChessState = { ...createGame({ seed: 5, difficulty: 'beginner', opponent: 'computer', humanColor: 'w' }) };
    for (let i = 0; i < 12; i++) {
      const g = replay(state.start, state.moves)!;
      if (g.status.kind !== 'playing') break;
      const human = chooseMove(g.pos, { ...LEVELS.beginner, nodes: 500 }, createRng(i));
      state = playTurn(state, moveToUci(human.move));
      expect(isValidState(state)).toBe(true);
    }
    expect(state.moves.length).toBeGreaterThan(10);
    expect(state.rng).not.toBe(5);
  });

  it('refuses to move for the person or illegally', () => {
    expect(() => playTurn(vsComputer(['e2e4']), 'e7e5')).toThrow();
    expect(() => playTurn(vsComputer([]), 'e2e5')).toThrow();
    expect(computerReply(vsComputer([]))).toEqual(vsComputer([]));
    expect(() => chooseMove(pos('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1'), LEVELS.strong, createRng(1))).toThrow();
  });
});

describe('strength levels', { timeout: 60_000 }, () => {
  it('differ in budget, knowledge, candidate width, randomness and oversights', () => {
    const { beginner, intermediate, strong } = LEVELS;
    expect(beginner.nodes).toBeLessThan(intermediate.nodes);
    expect(intermediate.nodes).toBeLessThan(strong.nodes);
    expect(beginner.margin).toBeGreaterThan(intermediate.margin);
    expect(intermediate.margin).toBeGreaterThan(strong.margin);
    expect(beginner.temperature).toBeGreaterThan(intermediate.temperature);
    expect(intermediate.temperature).toBeGreaterThan(strong.temperature);
    expect(beginner.glance).toBeGreaterThan(intermediate.glance);
    expect(strong.glance).toBe(0);
    // Knowledge: each level's terms include the weaker level's terms.
    expect(beginner.features & ~intermediate.features).toBe(0);
    expect(intermediate.features & ~strong.features).toBe(0);
    expect(beginner.features & featureMask(['kingSafety'])).toBe(0);
    expect(intermediate.features & featureMask(['outposts', 'threats'])).toBe(0);
    expect(strong.features).toBe(ALL_FEATURES);
  });

  it('beginners sometimes decide with a glance; the strong level never does', () => {
    const p = replay(START_FEN, ['e2e4', 'e7e5', 'g1f3', 'b8c6'])!.pos;
    const modes = Array.from({ length: 12 }, (_, seed) => chooseMove(p, LEVELS.beginner, createRng(seed)).mode);
    expect(modes).toContain('glance');
    expect(modes).toContain('search');
    for (let seed = 0; seed < 3; seed++) expect(chooseMove(p, { ...LEVELS.strong, nodes: 4000 }, createRng(seed)).mode).toBe('search');
  });

  it('a glance looks only one ply ahead: it may capture a defended pawn with the queen', () => {
    const g = glance(pos('4k3/2p5/3p4/8/8/8/8/3QK3 w - - 0 1'), LEVELS.beginner.features);
    expect(moveToUci(g[0]!.move)).toBe('d1d6');
    expect(g[0]!.score).toBeGreaterThan(g[1]!.score - 1);
    // Mate is still recognised in a glance.
    expect(moveToUci(glance(pos('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1'), LEVELS.beginner.features)[0]!.move)).toBe('a1a8');
  });

  it('never plays an oversight that loses more than its cap', () => {
    // The defended-pawn grab loses the queen (far beyond any cap), so even beginners avoid it.
    for (let seed = 0; seed < 10; seed++) {
      const choice = chooseMove(pos('4k3/2p5/3p4/8/8/8/8/3QK3 w - - 0 1'), LEVELS.beginner, createRng(seed));
      expect(moveToUci(choice.move)).not.toBe('d1d6');
    }
  });

  it('varies its opening moves between games but keeps them sensible', () => {
    const firsts = new Set(Array.from({ length: 8 }, (_, seed) => moveToUci(chooseMove(startPosition(), { ...LEVELS.strong, nodes: 15_000 }, createRng(seed)).move)));
    expect(firsts.size).toBeGreaterThan(1);
    for (const m of firsts) expect(['e2e4', 'd2d4', 'g1f3', 'b1c3', 'c2c4', 'e2e3', 'd2d3', 'c2c3', 'g2g3']).toContain(m);
  });
});

describe('explanations and hints', { timeout: 60_000 }, () => {
  const keys = (fen: string, uci: string) => {
    const p = pos(fen);
    const move = legalMoves(p).find((m) => moveToUci(m) === uci)!;
    return explainMove(p, move).map((r) => r.key);
  };

  it('names checkmate, captures, castling and promotion', () => {
    expect(keys('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1', 'a1a8')).toEqual(['why.mate']);
    expect(keys('4k3/8/8/3q4/8/8/3R4/4K3 w - - 0 1', 'd2d5')[0]).toBe('why.winsUndefended');
    expect(keys('4k3/4p3/3q4/8/8/8/3R4/4K3 w - - 0 1', 'd2d6')[0]).toBe('why.winsMaterial');
    expect(keys('4k3/4p3/3r4/8/8/8/3R4/4K3 w - - 0 1', 'd2d6')[0]).toBe('why.trade');
    expect(keys('r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1', 'e1g1')).toContain('why.castles');
    expect(keys('7k/P7/8/8/8/8/8/K7 w - - 0 1', 'a7a8q')).toContain('why.promotes');
  });

  it('spots forks, attacks and escapes', () => {
    const fork = keys('4k3/1q3r2/8/8/4N3/8/8/4K3 w - - 0 1', 'e4d6');
    expect(fork).toEqual(expect.arrayContaining(['why.check', 'why.fork']));
    expect(keys('4k3/8/8/3p4/4N3/8/8/4K3 w - - 0 1', 'e4c3')).toContain('why.escapes');
    expect(keys('4k3/8/3r4/8/8/8/8/2B1K3 w - - 0 1', 'c1f4')).toContain('why.attacks');
  });

  it('explains quiet moves through evaluation terms', () => {
    expect(keys(START_FEN, 'g1f3')).toContain('why.develops');
    expect(keys(START_FEN, 'e2e4')).toContain('why.centre');
    expect(keys('k7/p7/8/8/8/8/P7/7K w - - 0 1', 'h1g2')).toContain('why.kingActivity');
    const explained = explainMove(startPosition(), legalMoves(startPosition())[0]!);
    expect(explained.length).toBeGreaterThan(0);
    expect(explained.length).toBeLessThanOrEqual(3);
  });

  it('suggests a legal, strong move for the person', () => {
    const state = createGame({ seed: 1, difficulty: 'beginner', opponent: 'human', humanColor: 'w', start: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1' });
    expect(moveToUci(suggestMove(state)!)).toBe('a1a8');
    expect(suggestMove({ ...state, start: '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1' })).toBeNull();
  });
});

describe('engine evaluation and best-move lines', { timeout: 60_000 }, () => {
  it('evaluates any position from White’s view and reports forced mates for either side', () => {
    const whiteMates = evaluatePosition(parseFen('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1')!)!;
    expect(moveToUci(whiteMates.move)).toBe('a1a8');
    expect(whiteMates.mate).toBe(1);
    expect(whiteMates.white).toBeGreaterThan(29_000);
    const blackMates = evaluatePosition(parseFen('r5k1/8/8/8/8/8/5PPP/6K1 b - - 0 1')!)!;
    expect(moveToUci(blackMates.move)).toBe('a8a1');
    expect(blackMates.mate).toBe(-1);
    expect(blackMates.white).toBeLessThan(-29_000);
    // Black's extra queen: clearly better for Black, no mate in sight.
    const queenUp = evaluatePosition(parseFen('4k3/8/8/8/8/8/1q6/4K3 w - - 0 1')!)!;
    expect(queenUp.mate).toBe(0);
    expect(queenUp.white).toBeLessThan(-600);
    // Same position with Black to move: the same sign (White's view), not the mover's.
    expect(evaluatePosition(parseFen('4k3/8/8/8/8/8/1q6/4K3 b - - 0 1')!)!.white).toBeLessThan(-600);
    expect(evaluatePosition(parseFen('6k1/5ppp/8/8/8/8/5PPP/r5K1 w - - 0 1')!)).toBeNull();
  });

  it('extends a best move into a line while each next move is uniquely best, and stops once the lead is decisive', () => {
    const level = { ...PUZZLE_LEVEL, nodes: 20_000 };
    // Knight fork against a lone queen: the fork, then the capture (after which nothing is clearly best: K+N v K).
    const fork = parseFen('q3k3/8/8/1N6/8/8/8/4K3 w - - 0 1')!;
    const first = uniqueBestMove(fork, level);
    expect(moveToUci(first)).toBe('b5c7');
    const line = extendBestLine(fork, first, level);
    expect(line[0]).toBe('b5c7');
    expect(line[2]).toBe('c7a8');
    expect(line).toHaveLength(3);
    expect(toFen(fork)).toBe('q3k3/8/8/1N6/8/8/8/4K3 w - - 0 1'); // input unchanged
    // With White's pawns the fork already wins decisively: the line stops after the fork.
    const decisive = parseFen('q3k3/8/8/1N6/8/8/6PP/4K3 w - - 0 1')!;
    expect(extendBestLine(decisive, uniqueBestMove(decisive, level), level)).toEqual(['b5c7']);
    // A first move must not be a quick mate (that is the other puzzle type); later moves may mate.
    expect(uniqueBestMove(parseFen('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1')!, level)).toBe(0);
    expect(moveToUci(uniqueBestMove(parseFen('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1')!, level, false))).toBe('a1a8');
    // Too few legal moves for a first move.
    expect(uniqueBestMove(parseFen('7k/8/8/8/8/8/6q1/7K w - - 0 1')!, level)).toBe(0);
    expect(MAX_LINE_MOVES).toBe(3);
    expect(DECISIVE_LEAD).toBe(500);
    // verifyBestMovePuzzle combines both (and rejects nonsense).
    expect(verifyBestMovePuzzle('q3k3/8/8/1N6/8/8/8/4K3 w - - 0 1', level)).toEqual({ fen: 'q3k3/8/8/1N6/8/8/8/4K3 w - - 0 1', line });
    expect(verifyBestMovePuzzle('bad', level)).toBeNull();
  });
});
