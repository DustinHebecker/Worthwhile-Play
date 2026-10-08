import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  CASTLE_BK,
  CASTLE_BQ,
  CASTLE_WK,
  CASTLE_WQ,
  START_FEN,
  applyMove,
  canUndo,
  createGame,
  inCheck,
  insufficientMaterial,
  isAttacked,
  isComputerTurn,
  isValidState,
  legalMoves,
  makeMove,
  moveFlag,
  moveToUci,
  outcomeOf,
  parseFen,
  parseSan,
  parseSquare,
  perft,
  replay,
  repetitionKey,
  resign,
  squareName,
  startPosition,
  toFen,
  toSan,
  uciToMove,
  undo,
  unmakeMove,
  FLAG_EP,
  type ChessState
} from '../src/rules';

const pos = (fen: string) => {
  const p = parseFen(fen);
  if (!p) throw new Error(`bad FEN ${fen}`);
  return p;
};
const ucis = (fen: string) => legalMoves(pos(fen)).map(moveToUci).sort();
const sans = (fen: string) => {
  const p = pos(fen);
  return legalMoves(p).map((m) => toSan(p, m)).sort();
};
const play = (moves: string[], start = START_FEN) => replay(start, moves);
const game = (moves: string[], extra: Partial<ChessState> = {}): ChessState => ({
  ...createGame({ seed: 1, difficulty: 'beginner', opponent: 'human', humanColor: 'w' }),
  moves,
  ...extra
});

describe('squares and FEN', () => {
  it('names squares from a1 = 0 to h8 = 63', () => {
    expect(squareName(0)).toBe('a1');
    expect(squareName(7)).toBe('h1');
    expect(squareName(8)).toBe('a2');
    expect(squareName(63)).toBe('h8');
    expect(parseSquare('e4')).toBe(28);
    expect(parseSquare('h8')).toBe(63);
    expect(parseSquare('i1')).toBe(-1);
    expect(parseSquare('a9')).toBe(-1);
  });

  it('round-trips FEN strings', () => {
    for (const fen of [
      START_FEN,
      'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1',
      '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1',
      'rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3',
      '4k3/8/8/8/8/8/8/4K3 b - - 37 80'
    ]) {
      expect(toFen(pos(fen))).toBe(fen);
    }
  });

  it('drops an en-passant square that no pawn can use and castling rights without king/rook', () => {
    expect(toFen(pos('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1'))).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
    expect(toFen(pos('4k3/8/8/8/8/8/8/4K3 w KQkq - 0 1'))).toBe('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
    expect(toFen(pos('r3k3/8/8/8/8/8/8/4K2R w KQkq - 0 1'))).toBe('r3k3/8/8/8/8/8/8/4K2R w Kq - 0 1');
  });

  it('rejects malformed or impossible FEN without throwing', () => {
    for (const bad of [
      '',
      'nonsense',
      42,
      null,
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP w KQkq - 0 1',
      'rnbqkbnr/pppppppp/9/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNRR w KQkq - 0 1',
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQ1BNR w kq - 0 1',
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKKNR w kq - 0 1',
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR x KQkq - 0 1',
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQxq - 0 1',
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq e4 0 1',
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - x 1',
      'Pnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNp w KQkq - 0 1',
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBXR w KQkq - 0 1',
      // Side NOT to move is in check.
      '4k3/8/8/8/8/8/8/4K2r b - - 0 1',
      'x'.repeat(200)
    ]) {
      expect(parseFen(bad as string), String(bad)).toBeNull();
    }
    expect(parseFen('4k3/8/8/8/8/8/8/4K2r w - - 0 1')).not.toBeNull();
    expect(parseFen('4k3/8/8/8/8/8/8/4K3 w - -')).not.toBeNull();
  });
});

describe('move generation', () => {
  it('generates the 20 opening moves', () => {
    expect(ucis(START_FEN)).toHaveLength(20);
    expect(sans(START_FEN)).toContain('Nf3');
    expect(sans(START_FEN)).toContain('e4');
  });

  it('allows castling only with rights, a free path and no attacked king squares', () => {
    const free = 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1';
    expect(ucis(free)).toEqual(expect.arrayContaining(['e1g1', 'e1c1']));
    // No rights.
    expect(ucis('r3k2r/8/8/8/8/8/8/R3K2R w - - 0 1')).not.toContain('e1g1');
    expect(ucis('r3k2r/8/8/8/8/8/8/R3K2R w Q - 0 1')).not.toContain('e1g1');
    expect(ucis('r3k2r/8/8/8/8/8/8/R3K2R w Q - 0 1')).toContain('e1c1');
    // Blocked path (b1 occupied blocks only the queenside).
    expect(ucis('r3k2r/8/8/8/8/8/8/RN2K2R w KQkq - 0 1')).not.toContain('e1c1');
    expect(ucis('r3k2r/8/8/8/8/8/8/RN2K2R w KQkq - 0 1')).toContain('e1g1');
    // Through check: f1 attacked by a rook on f8.
    expect(ucis('r3kr2/8/8/8/8/8/8/R3K2R w KQq - 0 1')).not.toContain('e1g1');
    // Into check: g1 attacked.
    expect(ucis('r3k1r1/8/8/8/8/8/8/R3K2R w KQq - 0 1')).not.toContain('e1g1');
    // Out of check.
    expect(ucis('r3k3/8/8/8/8/8/8/R3K2Rr w KQq - 0 1'.replace('K2Rr', 'K2R'))).toContain('e1g1');
    expect(ucis('r3k3/8/8/8/4r3/8/8/R3K2R w KQq - 0 1')).not.toContain('e1g1');
    expect(ucis('r3k3/8/8/8/4r3/8/8/R3K2R w KQq - 0 1')).not.toContain('e1c1');
    // b1 attacked does not prevent queenside castling (the king does not cross it).
    expect(ucis('1r2k3/8/8/8/8/8/8/R3K3 w Q - 0 1')).toContain('e1c1');
    // d1 attacked does.
    expect(ucis('3rk3/8/8/8/8/8/8/R3K3 w Q - 0 1')).not.toContain('e1c1');
    // Black castles too.
    expect(ucis('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1')).toEqual(expect.arrayContaining(['e8g8', 'e8c8']));
  });

  it('moves the rook when castling and loses the rights after king or rook moves or rook captures', () => {
    const p = pos('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    makeMove(p, uciToMove(p, 'e1g1'));
    expect(toFen(p)).toBe('r3k2r/8/8/8/8/8/8/R4RK1 b kq - 1 1');
    makeMove(p, uciToMove(p, 'e8c8'));
    expect(toFen(p)).toBe('2kr3r/8/8/8/8/8/8/R4RK1 w - - 2 2');

    const q = pos('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    makeMove(q, uciToMove(q, 'a1a8'));
    expect(q.castling).toBe(CASTLE_WK | CASTLE_BK);
    const q2 = pos('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1');
    makeMove(q2, uciToMove(q2, 'h8h1'));
    expect(q2.castling).toBe(CASTLE_WQ | CASTLE_BQ);

    const k = pos('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1');
    makeMove(k, uciToMove(k, 'e8e7'));
    expect(k.castling).toBe(CASTLE_WK | CASTLE_WQ);
    const r = pos('r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1');
    makeMove(r, uciToMove(r, 'h8h7'));
    expect(r.castling).toBe(CASTLE_WK | CASTLE_WQ | CASTLE_BQ);
    expect(CASTLE_BK).toBe(4);
  });

  it('handles en passant: only immediately, and never when it exposes the king', () => {
    const after = play(['e2e4', 'a7a6', 'e4e5', 'd7d5'])!;
    expect(legalMoves(after.pos).map(moveToUci)).toContain('e5d6');
    const ep = uciToMove(after.pos, 'e5d6');
    expect(moveFlag(ep)).toBe(FLAG_EP);
    expect(toSan(after.pos, ep)).toBe('exd6');
    makeMove(after.pos, ep);
    expect(toFen(after.pos)).toBe('rnbqkbnr/1pp1pppp/p2P4/8/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 3');
    // One move later the right is gone.
    const late = play(['e2e4', 'a7a6', 'e4e5', 'd7d5', 'h2h3', 'h7h6'])!;
    expect(legalMoves(late.pos).map(moveToUci)).not.toContain('e5d6');
    // Horizontal pin: capturing en passant would open the rank to the rook.
    expect(ucis('8/8/8/KPp4r/8/8/8/7k w - c6 0 1')).not.toContain('b5c6');
    expect(ucis('8/8/8/1Pp4r/K7/8/8/7k w - c6 0 1')).toContain('b5c6');
  });

  it('generates all four promotions and writes them in SAN', () => {
    const fen = '8/P6k/8/8/8/8/8/K7 w - - 0 1';
    expect(ucis(fen).filter((m) => m.startsWith('a7'))).toEqual(['a7a8b', 'a7a8n', 'a7a8q', 'a7a8r']);
    expect(sans(fen)).toEqual(expect.arrayContaining(['a8=Q', 'a8=N', 'a8=R', 'a8=B']));
    const p = pos('1r5k/P7/8/8/8/8/8/K7 w - - 0 1');
    const capture = uciToMove(p, 'a7b8n');
    expect(toSan(p, capture)).toBe('axb8=N');
    makeMove(p, capture);
    expect(toFen(p)).toBe('1N5k/8/8/8/8/8/8/K7 b - - 0 1');
  });

  it('never leaves the own king in check', () => {
    // Pinned knight cannot move.
    expect(ucis('4k3/8/8/8/4r3/8/4N3/4K3 w - - 0 1').some((m) => m.startsWith('e2'))).toBe(false);
    // Back-rank check with no escape: no legal move at all.
    expect(ucis('4k3/8/8/8/8/8/3PPP2/r3K3 w - - 0 1')).toEqual([]);
    // In check: only moves that resolve it (block, capture or step away).
    expect(ucis('4r1k1/8/8/8/8/8/8/2B1K3 w - - 0 1')).toEqual(['c1e3', 'e1d1', 'e1d2', 'e1f1', 'e1f2']);
  });

  it('detects attacks by every piece type', () => {
    const p = pos('4k3/8/8/3p4/8/5n2/8/R3K2B w - - 0 1');
    expect(isAttacked(p, parseSquare('e4'), -1)).toBe(true); // pawn d5
    expect(isAttacked(p, parseSquare('c4'), -1)).toBe(true);
    expect(isAttacked(p, parseSquare('d4'), -1)).toBe(true); // knight f3
    expect(isAttacked(p, parseSquare('a8'), 1)).toBe(true); // rook a1
    expect(isAttacked(p, parseSquare('f3'), 1)).toBe(true); // bishop h1 hits the knight
    expect(isAttacked(p, parseSquare('e4'), 1)).toBe(false); // … which blocks the diagonal
    expect(isAttacked(p, parseSquare('d2'), 1)).toBe(true); // king e1
    expect(isAttacked(p, parseSquare('e3'), 1)).toBe(false);
  });

  it('make/unmake restores the exact position and hash (property)', () => {
    fc.assert(
      fc.property(fc.array(fc.nat(), { maxLength: 40 }), (choices) => {
        const p = startPosition();
        for (const c of choices) {
          const legal = legalMoves(p);
          if (legal.length === 0) break;
          const move = legal[c % legal.length]!;
          const fen = toFen(p);
          const hash = [p.hashLo, p.hashHi];
          const undoInfo = makeMove(p, move);
          // Incremental hash equals a fresh hash of the same position.
          const fresh = parseFen(toFen(p))!;
          if (p.ep === fresh.ep) expect([p.hashLo, p.hashHi]).toEqual([fresh.hashLo, fresh.hashHi]);
          unmakeMove(p, undoInfo);
          expect(toFen(p)).toBe(fen);
          expect([p.hashLo, p.hashHi]).toEqual(hash);
          makeMove(p, move);
        }
      }),
      { numRuns: 60 }
    );
  });

  it('agrees with perft at depth 2 after random openings (make/unmake consistency)', () => {
    fc.assert(
      fc.property(fc.array(fc.nat(), { minLength: 1, maxLength: 12 }), (choices) => {
        const p = startPosition();
        for (const c of choices) {
          const legal = legalMoves(p);
          if (legal.length === 0) break;
          makeMove(p, legal[c % legal.length]!);
        }
        const fresh = parseFen(toFen(p))!;
        expect(perft(p, 2)).toBe(perft(fresh, 2));
      }),
      { numRuns: 25 }
    );
  });
});

describe('notation', () => {
  it('disambiguates by file, rank, or both', () => {
    expect(sans('4k3/8/8/8/8/8/4K3/R6R w - - 0 1')).toEqual(expect.arrayContaining(['Rad1', 'Rhd1']));
    expect(sans('4k3/R7/8/8/8/8/8/R3K3 w - - 0 1')).toEqual(expect.arrayContaining(['R1a4', 'R7a4']));
    expect(sans('k7/8/8/8/8/2Q1Q3/8/2Q1K3 w - - 0 1')).toEqual(expect.arrayContaining(['Qc3d2', 'Qed2', 'Q1d2']));
    expect(sans('4k3/8/8/8/8/8/8/1N2KN2 w - - 0 1')).toEqual(expect.arrayContaining(['Nbd2', 'Nfd2', 'Nc3', 'Ng3']));
  });

  it('marks check and checkmate and writes castling', () => {
    const fool = play(['f2f3', 'e7e5', 'g2g4'])!;
    const mate = uciToMove(fool.pos, 'd8h4');
    expect(toSan(fool.pos, mate)).toBe('Qh4#');
    expect(sans('4k3/8/8/8/8/8/8/R3K3 w - - 0 1')).toContain('Ra8+');
    expect(sans('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1')).toEqual(expect.arrayContaining(['O-O', 'O-O-O']));
  });

  it('parses SAN leniently and round-trips every legal move (property)', () => {
    expect(moveToUci(parseSan(startPosition(), 'Nf3'))).toBe('g1f3');
    expect(parseSan(startPosition(), 'Nf4')).toBe(0);
    expect(parseSan(startPosition(), 'x'.repeat(20))).toBe(0);
    const castle = pos('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    expect(moveToUci(parseSan(castle, '0-0'))).toBe('e1g1');
    expect(moveToUci(parseSan(castle, 'O-O-O+'))).toBe('e1c1');
    expect(moveToUci(parseSan(pos('8/P6k/8/8/8/8/8/K7 w - - 0 1'), 'a8Q'))).toBe('a7a8q');
    fc.assert(
      fc.property(fc.array(fc.nat(), { maxLength: 30 }), (choices) => {
        const p = startPosition();
        for (const c of choices) {
          const legal = legalMoves(p);
          if (legal.length === 0) break;
          for (const m of legal) {
            expect(parseSan(p, toSan(p, m, legal))).toBe(m);
            expect(uciToMove(p, moveToUci(m))).toBe(m);
          }
          makeMove(p, legal[c % legal.length]!);
        }
      }),
      { numRuns: 15 }
    );
  });

  it('rejects malformed or illegal UCI', () => {
    const p = startPosition();
    expect(uciToMove(p, 'e2e5')).toBe(0);
    expect(uciToMove(p, 'e2e4x')).toBe(0);
    expect(uciToMove(p, 'z2e4')).toBe(0);
    expect(uciToMove(p, 'e2e4')).not.toBe(0);
  });
});

describe('end of game', () => {
  it('recognises checkmate (fool’s mate) and check', () => {
    const g = play(['f2f3', 'e7e5', 'g2g4', 'd8h4'])!;
    expect(g.status).toEqual({ kind: 'checkmate', winner: 'b' });
    expect(g.sans).toEqual(['f3', 'e5', 'g4', 'Qh4#']);
    const check = play(['e2e4', 'f7f6', 'd1h5'])!;
    expect(check.status).toEqual({ kind: 'playing', check: true });
    expect(inCheck(check.pos)).toBe(true);
    expect(play(['e2e4'])!.status).toEqual({ kind: 'playing', check: false });
  });

  it('recognises stalemate', () => {
    expect(replay('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1', [])!.status).toEqual({ kind: 'draw', reason: 'stalemate' });
    const g = replay('7k/8/4Q1K1/8/8/8/8/8 w - - 0 1', ['e6f7'])!;
    expect(g.status).toEqual({ kind: 'draw', reason: 'stalemate' });
  });

  it('draws automatically on the third repetition', () => {
    const shuffle = ['g1f3', 'g8f6', 'f3g1', 'f6g8'];
    expect(play([...shuffle])!.status.kind).toBe('playing');
    const twice = play([...shuffle, ...shuffle.slice(0, 3)])!;
    expect(twice.status.kind).toBe('playing');
    expect(play([...shuffle, ...shuffle])!.status).toEqual({ kind: 'draw', reason: 'threefold' });
    expect(play([...shuffle, ...shuffle])!.keys[0]).toBe(repetitionKey(startPosition()));
  });

  it('treats positions with different castling rights as different', () => {
    // The kings go out and back: castling rights are lost, so the start position never repeats.
    const walk = ['e2e4', 'e7e5', 'e1e2', 'e8e7', 'e2e1', 'e7e8'];
    const g = play([...walk, 'g1f3', 'g8f6', 'f3g1', 'f6g8', 'g1f3', 'g8f6', 'f3g1'])!;
    expect(g.status.kind).toBe('playing');
    expect(play([...walk, 'g1f3', 'g8f6', 'f3g1', 'f6g8', 'g1f3', 'g8f6', 'f3g1', 'f6g8'])!.status).toEqual({ kind: 'draw', reason: 'threefold' });
  });

  it('counts an en-passant square in repetitions only when the capture is legal', () => {
    expect(repetitionKey(pos('8/8/8/1Pp4r/K7/8/8/7k w - c6 0 1'))).toBe('8/8/8/1Pp4r/K7/8/8/7k w - c6');
    // Pinned: the capture is impossible, so the position equals the one without the ep square.
    expect(repetitionKey(pos('8/8/8/KPp4r/8/8/8/7k w - c6 0 1'))).toBe('8/8/8/KPp4r/8/8/8/7k w - -');
    expect(toFen(play(['e2e4'])!.pos)).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
  });

  it('applies the fifty-move rule, unless the last move mates', () => {
    expect(replay('4k3/8/8/8/8/8/8/R3K3 w - - 99 80', ['a1a2'])!.status).toEqual({ kind: 'draw', reason: 'fiftyMove' });
    expect(replay('4k3/8/8/8/8/8/8/R3K3 w - - 98 80', ['a1a2'])!.status.kind).toBe('playing');
    // A pawn move resets the counter.
    expect(replay('4k3/8/8/8/8/8/P7/R3K3 w - - 99 80', ['a2a3'])!.status.kind).toBe('playing');
    expect(replay('6k1/5ppp/8/8/8/8/8/R5K1 w - - 99 80', ['a1a8'])!.status).toEqual({ kind: 'checkmate', winner: 'w' });
  });

  it('recognises insufficient material', () => {
    const dead = ['4k3/8/8/8/8/8/8/4K3 w - - 0 1', '4k3/8/8/8/8/8/8/4KN2 w - - 0 1', '4kb2/8/8/8/8/8/8/4K3 w - - 0 1', '2b1k3/8/8/8/8/8/8/4KB2 w - - 0 1', '4k3/8/8/8/8/8/8/3BKB2 w - - 0 1'];
    for (const fen of dead) expect(insufficientMaterial(pos(fen)), fen).toBe(true);
    const alive = ['4k3/8/8/8/8/8/8/4KNN1 w - - 0 1', '4k3/8/8/8/8/8/8/2B1KB2 w - - 0 1', '4kn2/8/8/8/8/8/8/4KB2 w - - 0 1', '4k3/8/8/8/8/8/P7/4K3 w - - 0 1', '4k3/8/8/8/8/8/8/R3K3 w - - 0 1', '4k3/8/8/8/8/8/8/3QK3 w - - 0 1', '2b1k3/8/8/8/8/8/8/2B1K3 w - - 0 1'];
    for (const fen of alive) expect(insufficientMaterial(pos(fen)), fen).toBe(false);
    expect(replay('k7/8/8/8/8/8/5r2/4K3 w - - 0 1', ['e1f2'])!.status).toEqual({ kind: 'draw', reason: 'insufficient' });
  });
});

describe('game state', () => {
  it('replays only legal histories and nothing after the end', () => {
    expect(replay(START_FEN, ['e2e5'])).toBeNull();
    expect(replay('bad', [])).toBeNull();
    expect(replay(START_FEN, ['f2f3', 'e7e5', 'g2g4', 'd8h4', 'a2a3'])).toBeNull();
    expect(replay(START_FEN, [42 as unknown as string])).toBeNull();
  });

  it('validates states thoroughly without throwing', () => {
    const ok = game(['e2e4', 'e7e5']);
    expect(isValidState(ok)).toBe(true);
    expect(isValidState({ ...ok, moves: ['e2e4', 'e2e4'] })).toBe(false);
    expect(isValidState({ ...ok, moves: ['E2E4'] })).toBe(false);
    expect(isValidState({ ...ok, extra: 1 })).toBe(false);
    expect(isValidState({ ...ok, seed: -1 })).toBe(false);
    expect(isValidState({ ...ok, rng: 2 ** 32 })).toBe(false);
    expect(isValidState({ ...ok, difficulty: 'grandmaster' })).toBe(false);
    expect(isValidState({ ...ok, opponent: 'robot' })).toBe(false);
    expect(isValidState({ ...ok, humanColor: 'red' })).toBe(false);
    expect(isValidState({ ...ok, resigned: 'x' })).toBe(false);
    expect(isValidState({ ...ok, start: 'nope' })).toBe(false);
    expect(isValidState({ ...ok, start: 5 })).toBe(false);
    expect(isValidState({ ...ok, moves: 'e2e4' })).toBe(false);
    expect(isValidState({ ...ok, moves: Array.from({ length: 1201 }, () => 'g1f3') })).toBe(false);
    // Resigning after the game already ended is impossible.
    expect(isValidState(game(['f2f3', 'e7e5', 'g2g4', 'd8h4'], { resigned: 'w' }))).toBe(false);
    expect(isValidState(game(['e2e4'], { resigned: 'b' }))).toBe(true);
    // Against the computer: never half a turn, and only the person resigns.
    const vs = { opponent: 'computer' as const, humanColor: 'w' as const };
    expect(isValidState(game(['e2e4', 'e7e5'], vs))).toBe(true);
    expect(isValidState(game(['e2e4'], vs))).toBe(false);
    expect(isValidState(game([], { ...vs, humanColor: 'b' }))).toBe(false);
    expect(isValidState(game(['e2e4'], { ...vs, humanColor: 'b' }))).toBe(true);
    expect(isValidState(game(['e2e4', 'e7e5'], { ...vs, resigned: 'b' }))).toBe(false);
    expect(isValidState(game(['e2e4', 'e7e5'], { ...vs, resigned: 'w' }))).toBe(true);
    // A finished game against the computer may end on the computer's move.
    expect(isValidState(game(['f2f3', 'e7e5', 'g2g4', 'd8h4'], vs))).toBe(true);
  });

  it('applies moves, resigns and reports outcomes', () => {
    const s = applyMove(game([]), 'e2e4');
    expect(s.moves).toEqual(['e2e4']);
    expect(() => applyMove(s, 'e2e4')).toThrow();
    expect(() => applyMove(game(['f2f3', 'e7e5', 'g2g4', 'd8h4']), 'a2a3')).toThrow();
    expect(outcomeOf(s)).toEqual({ kind: 'playing', check: false, turn: 'b' });
    const r = resign(s);
    expect(r.resigned).toBe('b');
    expect(outcomeOf(r)).toEqual({ kind: 'resigned', winner: 'w' });
    expect(resign(r)).toBe(r);
    const vs = game(['e2e4', 'e7e5'], { opponent: 'computer' });
    expect(resign(vs).resigned).toBe('w');
    expect(outcomeOf(game(['f2f3', 'e7e5', 'g2g4', 'd8h4']))).toEqual({ kind: 'checkmate', winner: 'b' });
    expect(isComputerTurn(game(['e2e4'], { opponent: 'computer' }))).toBe(true);
    expect(isComputerTurn(game(['e2e4']))).toBe(false);
    expect(isComputerTurn(game(['f2f3', 'e7e5', 'g2g4', 'd8h4'], { opponent: 'computer', humanColor: 'b' }))).toBe(false);
  });

  it('undoes one ply between people and a full turn against the computer', () => {
    expect(canUndo(game([]))).toBe(false);
    expect(undo(game(['e2e4', 'e7e5'])).moves).toEqual(['e2e4']);
    const vs = { opponent: 'computer' as const };
    expect(undo(game(['e2e4', 'e7e5', 'g1f3', 'b8c6'], vs)).moves).toEqual(['e2e4', 'e7e5']);
    // The person plays black: the computer's opening move stays.
    const black = { opponent: 'computer' as const, humanColor: 'b' as const };
    expect(canUndo(game(['e2e4'], black))).toBe(false);
    expect(undo(game(['e2e4'], black)).moves).toEqual(['e2e4']);
    expect(undo(game(['e2e4', 'e7e5', 'g1f3'], black)).moves).toEqual(['e2e4']);
    // Not after the end.
    expect(canUndo(game(['f2f3', 'e7e5', 'g2g4', 'd8h4']))).toBe(false);
    expect(canUndo(game(['e2e4'], { resigned: 'b' }))).toBe(false);
    // Custom start with black to move against the computer playing black.
    const custom = { ...black, start: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1' };
    expect(canUndo(game([], custom))).toBe(false);
    expect(undo(game(['e7e5', 'g1f3'], custom)).moves).toEqual([]);
  });
});
