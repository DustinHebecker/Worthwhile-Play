/**
 * Chess rules: pure, DOM-free, written from scratch (no third-party engine).
 *
 * Board: 64 squares, a1 = 0, b1 = 1, …, h1 = 7, a2 = 8, …, h8 = 63
 * (file = sq & 7, rank = sq >> 3). Pieces are small integers: white pawn…king
 * = 1…6, black pieces are the negatives. A `Position` is mutable so the search
 * (ai.ts) can make and unmake moves without allocating boards; every exported
 * game-level helper works on copies.
 *
 * Moves are integers: from | to << 6 | promotion << 12 | flag << 15.
 * Legal moves are pseudo-legal moves that do not leave the mover's king attacked.
 * Correctness is verified by perft against published reference node counts.
 *
 * Draw rules are applied AUTOMATICALLY (no claim needed): stalemate, threefold
 * repetition (same placement, side to move, castling rights and en-passant
 * possibility), the fifty-move rule (100 half-moves without pawn move or capture,
 * unless the last move mates) and insufficient material (K v K, K+minor v K,
 * bishops only, all on one square colour). Automatic threefold/fifty-move draws
 * keep the interface simple (no claim button to miss) and stop endless shuffling;
 * this matches how most online chess sites handle them.
 */
import { createRng, isArrayOf, isInt, isOneOf, isRecord, isUint32 } from '@wp/game-core';
import { BEST_MOVE_PUZZLES, MATE_PUZZLES } from './puzzle-data';

/* ------------------------------------------------------------------------ */
/* Pieces, squares, moves                                                     */
/* ------------------------------------------------------------------------ */

export const PAWN = 1;
export const KNIGHT = 2;
export const BISHOP = 3;
export const ROOK = 4;
export const QUEEN = 5;
export const KING = 6;

export type Side = 1 | -1;
export const WHITE: Side = 1;
export const BLACK: Side = -1;
export type Color = 'w' | 'b';

export const CASTLE_WK = 1;
export const CASTLE_WQ = 2;
export const CASTLE_BK = 4;
export const CASTLE_BQ = 8;

export const FLAG_NONE = 0;
export const FLAG_DOUBLE = 1;
export const FLAG_EP = 2;
export const FLAG_CASTLE_K = 3;
export const FLAG_CASTLE_Q = 4;

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const fileOf = (sq: number): number => sq & 7;
export const rankOf = (sq: number): number => sq >> 3;
export const squareName = (sq: number): string => 'abcdefgh'[sq & 7]! + String((sq >> 3) + 1);
export function parseSquare(name: string): number {
  if (!/^[a-h][1-8]$/.test(name)) return -1;
  return (name.charCodeAt(0) - 97) + (name.charCodeAt(1) - 49) * 8;
}
export const colorOfSide = (side: Side): Color => (side === WHITE ? 'w' : 'b');
export const sideOfColor = (color: Color): Side => (color === 'w' ? WHITE : BLACK);

export const encodeMove = (from: number, to: number, promo = 0, flag = FLAG_NONE): number => from | (to << 6) | (promo << 12) | (flag << 15);
export const moveFrom = (move: number): number => move & 63;
export const moveTo = (move: number): number => (move >> 6) & 63;
export const movePromo = (move: number): number => (move >> 12) & 7;
export const moveFlag = (move: number): number => (move >> 15) & 7;

/* ------------------------------------------------------------------------ */
/* Precomputed tables                                                         */
/* ------------------------------------------------------------------------ */

/** Direction deltas as [file, rank]: 0–3 orthogonal (N, S, E, W), 4–7 diagonal (NE, NW, SE, SW). */
const DIRS: readonly (readonly [number, number])[] = [
  [0, 1], [0, -1], [1, 0], [-1, 0],
  [1, 1], [-1, 1], [1, -1], [-1, -1]
];

const onBoard = (f: number, r: number) => f >= 0 && f < 8 && r >= 0 && r < 8;

function jumps(deltas: readonly (readonly [number, number])[]): readonly Int8Array[] {
  return Array.from({ length: 64 }, (_, sq) => {
    const out: number[] = [];
    for (const [df, dr] of deltas) if (onBoard(fileOf(sq) + df, rankOf(sq) + dr)) out.push(sq + df + dr * 8);
    return Int8Array.from(out);
  });
}

export const KNIGHT_TARGETS = jumps([[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]]);
export const KING_TARGETS = jumps(DIRS);
/** RAYS[sq * 8 + dir]: squares from `sq` (exclusive) to the edge in direction `dir`. */
export const RAYS: readonly Int8Array[] = Array.from({ length: 64 * 8 }, (_, i) => {
  const sq = i >> 3;
  const [df, dr] = DIRS[i & 7]!;
  const out: number[] = [];
  let f = fileOf(sq) + df;
  let r = rankOf(sq) + dr;
  while (onBoard(f, r)) {
    out.push(f + r * 8);
    f += df;
    r += dr;
  }
  return Int8Array.from(out);
});

/** Castling rights that survive a move touching this square. */
const CASTLE_KEEP = Array.from({ length: 64 }, (_, sq) => {
  let keep = 15;
  if (sq === 0) keep &= ~CASTLE_WQ;
  if (sq === 7) keep &= ~CASTLE_WK;
  if (sq === 4) keep &= ~(CASTLE_WK | CASTLE_WQ);
  if (sq === 56) keep &= ~CASTLE_BQ;
  if (sq === 63) keep &= ~CASTLE_BK;
  if (sq === 60) keep &= ~(CASTLE_BK | CASTLE_BQ);
  return keep;
});

/* Zobrist keys (two 32-bit halves), generated from a fixed seed so hashes are stable. */
const ZOBRIST = (() => {
  const rng = createRng(0x5eed_c4e5);
  const draw = () => Math.floor(rng.next() * 0x1_0000_0000) >>> 0;
  const pieces = Array.from({ length: 13 * 64 * 2 }, draw);
  return {
    pieces: Uint32Array.from(pieces),
    side: [draw(), draw()] as const,
    castling: Uint32Array.from({ length: 32 }, draw),
    ep: Uint32Array.from({ length: 16 }, draw)
  };
})();
const pieceKey = (piece: number, sq: number, half: 0 | 1): number => ZOBRIST.pieces[((piece + 6) * 64 + sq) * 2 + half]!;

/* ------------------------------------------------------------------------ */
/* Position                                                                   */
/* ------------------------------------------------------------------------ */

export interface Position {
  board: Int8Array;
  side: Side;
  castling: number;
  /** En-passant target square, or -1. Only set when an enemy pawn could capture there. */
  ep: number;
  halfmove: number;
  fullmove: number;
  /** King squares: [white, black]. */
  kings: [number, number];
  hashLo: number;
  hashHi: number;
}

export interface Undo {
  move: number;
  captured: number;
  castling: number;
  ep: number;
  halfmove: number;
  hashLo: number;
  hashHi: number;
}

export function clonePosition(pos: Position): Position {
  return { ...pos, board: Int8Array.from(pos.board), kings: [pos.kings[0], pos.kings[1]] };
}

function computeHash(pos: Position): void {
  let lo = 0;
  let hi = 0;
  for (let sq = 0; sq < 64; sq++) {
    const p = pos.board[sq]!;
    if (p !== 0) {
      lo ^= pieceKey(p, sq, 0);
      hi ^= pieceKey(p, sq, 1);
    }
  }
  if (pos.side === BLACK) {
    lo ^= ZOBRIST.side[0];
    hi ^= ZOBRIST.side[1];
  }
  lo ^= ZOBRIST.castling[pos.castling * 2]!;
  hi ^= ZOBRIST.castling[pos.castling * 2 + 1]!;
  if (pos.ep >= 0) {
    lo ^= ZOBRIST.ep[fileOf(pos.ep) * 2]!;
    hi ^= ZOBRIST.ep[fileOf(pos.ep) * 2 + 1]!;
  }
  pos.hashLo = lo >>> 0;
  pos.hashHi = hi >>> 0;
}

/** True if `sq` is attacked by any piece of `by`. */
export function isAttacked(pos: Position, sq: number, by: Side): boolean {
  const b = pos.board;
  // Pawns: a white pawn attacks diagonally upwards, so it sits diagonally below `sq`.
  const f = fileOf(sq);
  const pawnRankOffset = by === WHITE ? -8 : 8;
  const pawn = PAWN * by;
  const behind = sq + pawnRankOffset;
  if (behind >= 0 && behind < 64) {
    if (f > 0 && b[behind - 1] === pawn) return true;
    if (f < 7 && b[behind + 1] === pawn) return true;
  }
  const knight = KNIGHT * by;
  for (const t of KNIGHT_TARGETS[sq]!) if (b[t] === knight) return true;
  const king = KING * by;
  for (const t of KING_TARGETS[sq]!) if (b[t] === king) return true;
  const rook = ROOK * by;
  const bishop = BISHOP * by;
  const queen = QUEEN * by;
  for (let d = 0; d < 8; d++) {
    const ray = RAYS[sq * 8 + d]!;
    const slider = d < 4 ? rook : bishop;
    for (let i = 0; i < ray.length; i++) {
      const p = b[ray[i]!]!;
      if (p === 0) continue;
      if (p === slider || p === queen) return true;
      break;
    }
  }
  return false;
}

export const kingSquare = (pos: Position, side: Side): number => pos.kings[side === WHITE ? 0 : 1];

export function inCheck(pos: Position, side: Side = pos.side): boolean {
  return isAttacked(pos, kingSquare(pos, side), (-side) as Side);
}

/** Whether a pawn of `side` stands next to `target`'s capturing squares (i.e. an en-passant capture is pseudo-legal). */
function epCapturable(board: Int8Array, target: number, side: Side): boolean {
  // Capturing pawns of `side` stand on the rank of the pawn that just double-pushed.
  const pawnSq = target - 8 * side;
  const f = fileOf(target);
  const pawn = PAWN * side;
  return (f > 0 && board[pawnSq - 1] === pawn) || (f < 7 && board[pawnSq + 1] === pawn);
}

/* ------------------------------------------------------------------------ */
/* Move generation                                                            */
/* ------------------------------------------------------------------------ */

function addPawnMove(out: number[], from: number, to: number, flag: number): void {
  const r = rankOf(to);
  if (r === 7 || r === 0) {
    out.push(encodeMove(from, to, QUEEN, flag), encodeMove(from, to, KNIGHT, flag), encodeMove(from, to, ROOK, flag), encodeMove(from, to, BISHOP, flag));
  } else out.push(encodeMove(from, to, 0, flag));
}

/** Pseudo-legal moves (may leave the king in check). With `capturesOnly`, only captures and promotions. */
export function pseudoMoves(pos: Position, capturesOnly = false, out: number[] = []): number[] {
  const b = pos.board;
  const side = pos.side;
  for (let from = 0; from < 64; from++) {
    const piece = b[from]! * side;
    if (piece <= 0) continue;
    switch (piece) {
      case PAWN: {
        const up = 8 * side;
        const one = from + up;
        const r = rankOf(from);
        const startRank = side === WHITE ? 1 : 6;
        const lastRank = side === WHITE ? 7 : 0;
        if (b[one] === 0 && (!capturesOnly || rankOf(one) === lastRank)) {
          addPawnMove(out, from, one, FLAG_NONE);
          if (r === startRank && !capturesOnly && b[one + up] === 0) out.push(encodeMove(from, one + up, 0, FLAG_DOUBLE));
        }
        const f = fileOf(from);
        for (let df = -1; df <= 1; df += 2) {
          if (f + df < 0 || f + df > 7) continue;
          const to = one + df;
          if (b[to]! * side < 0) addPawnMove(out, from, to, FLAG_NONE);
          else if (to === pos.ep) out.push(encodeMove(from, to, 0, FLAG_EP));
        }
        break;
      }
      case KNIGHT:
        for (const to of KNIGHT_TARGETS[from]!) {
          const t = b[to]! * side;
          if (t < 0 || (t === 0 && !capturesOnly)) out.push(encodeMove(from, to));
        }
        break;
      case KING: {
        for (const to of KING_TARGETS[from]!) {
          const t = b[to]! * side;
          if (t < 0 || (t === 0 && !capturesOnly)) out.push(encodeMove(from, to));
        }
        if (!capturesOnly) genCastling(pos, from, out);
        break;
      }
      default: {
        const first = piece === BISHOP ? 4 : 0;
        const last = piece === ROOK ? 4 : 8;
        for (let d = first; d < last; d++) {
          const ray = RAYS[from * 8 + d]!;
          for (let i = 0; i < ray.length; i++) {
            const to = ray[i]!;
            const t = b[to]! * side;
            if (t > 0) break;
            if (t < 0) {
              out.push(encodeMove(from, to));
              break;
            }
            if (!capturesOnly) out.push(encodeMove(from, to));
          }
        }
      }
    }
  }
  return out;
}

function genCastling(pos: Position, from: number, out: number[]): void {
  const side = pos.side;
  const home = side === WHITE ? 4 : 60;
  if (from !== home) return;
  const b = pos.board;
  const enemy = (-side) as Side;
  const kRight = side === WHITE ? CASTLE_WK : CASTLE_BK;
  const qRight = side === WHITE ? CASTLE_WQ : CASTLE_BQ;
  const rook = ROOK * side;
  if (pos.castling & kRight && b[home + 1] === 0 && b[home + 2] === 0 && b[home + 3] === rook) {
    if (!isAttacked(pos, home, enemy) && !isAttacked(pos, home + 1, enemy) && !isAttacked(pos, home + 2, enemy)) {
      out.push(encodeMove(home, home + 2, 0, FLAG_CASTLE_K));
    }
  }
  if (pos.castling & qRight && b[home - 1] === 0 && b[home - 2] === 0 && b[home - 3] === 0 && b[home - 4] === rook) {
    if (!isAttacked(pos, home, enemy) && !isAttacked(pos, home - 1, enemy) && !isAttacked(pos, home - 2, enemy)) {
      out.push(encodeMove(home, home - 2, 0, FLAG_CASTLE_Q));
    }
  }
}

function togglePiece(pos: Position, piece: number, sq: number): void {
  pos.hashLo = (pos.hashLo ^ pieceKey(piece, sq, 0)) >>> 0;
  pos.hashHi = (pos.hashHi ^ pieceKey(piece, sq, 1)) >>> 0;
}

/** Plays a (pseudo-legal) move in place and returns the information needed to take it back. */
export function makeMove(pos: Position, move: number): Undo {
  const b = pos.board;
  const from = moveFrom(move);
  const to = moveTo(move);
  const flag = moveFlag(move);
  const promo = movePromo(move);
  const side = pos.side;
  const piece = b[from]!;
  const undo: Undo = { move, captured: b[to]!, castling: pos.castling, ep: pos.ep, halfmove: pos.halfmove, hashLo: pos.hashLo, hashHi: pos.hashHi };

  // Remove old ep / castling from the hash.
  if (pos.ep >= 0) {
    pos.hashLo = (pos.hashLo ^ ZOBRIST.ep[fileOf(pos.ep) * 2]!) >>> 0;
    pos.hashHi = (pos.hashHi ^ ZOBRIST.ep[fileOf(pos.ep) * 2 + 1]!) >>> 0;
  }
  pos.hashLo = (pos.hashLo ^ ZOBRIST.castling[pos.castling * 2]!) >>> 0;
  pos.hashHi = (pos.hashHi ^ ZOBRIST.castling[pos.castling * 2 + 1]!) >>> 0;

  if (undo.captured !== 0) togglePiece(pos, undo.captured, to);
  togglePiece(pos, piece, from);
  b[from] = 0;
  const placed = promo ? promo * side : piece;
  b[to] = placed;
  togglePiece(pos, placed, to);

  if (flag === FLAG_EP) {
    const capSq = to - 8 * side;
    undo.captured = b[capSq]!;
    togglePiece(pos, undo.captured, capSq);
    b[capSq] = 0;
  } else if (flag === FLAG_CASTLE_K || flag === FLAG_CASTLE_Q) {
    const rookFrom = flag === FLAG_CASTLE_K ? to + 1 : to - 2;
    const rookTo = flag === FLAG_CASTLE_K ? to - 1 : to + 1;
    const rook = b[rookFrom]!;
    b[rookFrom] = 0;
    b[rookTo] = rook;
    togglePiece(pos, rook, rookFrom);
    togglePiece(pos, rook, rookTo);
  }
  if (piece * side === KING) pos.kings[side === WHITE ? 0 : 1] = to;

  pos.castling &= CASTLE_KEEP[from]! & CASTLE_KEEP[to]!;
  pos.ep = -1;
  if (flag === FLAG_DOUBLE) {
    const target = (from + to) >> 1;
    if (epCapturable(b, target, (-side) as Side)) pos.ep = target;
  }
  pos.halfmove = piece * side === PAWN || undo.captured !== 0 ? 0 : pos.halfmove + 1;
  if (side === BLACK) pos.fullmove++;
  pos.side = (-side) as Side;

  pos.hashLo = (pos.hashLo ^ ZOBRIST.side[0] ^ ZOBRIST.castling[pos.castling * 2]!) >>> 0;
  pos.hashHi = (pos.hashHi ^ ZOBRIST.side[1] ^ ZOBRIST.castling[pos.castling * 2 + 1]!) >>> 0;
  if (pos.ep >= 0) {
    pos.hashLo = (pos.hashLo ^ ZOBRIST.ep[fileOf(pos.ep) * 2]!) >>> 0;
    pos.hashHi = (pos.hashHi ^ ZOBRIST.ep[fileOf(pos.ep) * 2 + 1]!) >>> 0;
  }
  return undo;
}

export function unmakeMove(pos: Position, undo: Undo): void {
  const b = pos.board;
  const move = undo.move;
  const from = moveFrom(move);
  const to = moveTo(move);
  const flag = moveFlag(move);
  const side = (-pos.side) as Side;
  pos.side = side;
  const moved = b[to]!;
  const piece = movePromo(move) ? PAWN * side : moved;
  b[from] = piece;
  if (flag === FLAG_EP) {
    b[to] = 0;
    b[to - 8 * side] = undo.captured;
  } else {
    b[to] = undo.captured;
    if (flag === FLAG_CASTLE_K || flag === FLAG_CASTLE_Q) {
      const rookFrom = flag === FLAG_CASTLE_K ? to + 1 : to - 2;
      const rookTo = flag === FLAG_CASTLE_K ? to - 1 : to + 1;
      b[rookFrom] = b[rookTo]!;
      b[rookTo] = 0;
    }
  }
  if (piece * side === KING) pos.kings[side === WHITE ? 0 : 1] = from;
  if (side === BLACK) pos.fullmove--;
  pos.castling = undo.castling;
  pos.ep = undo.ep;
  pos.halfmove = undo.halfmove;
  pos.hashLo = undo.hashLo;
  pos.hashHi = undo.hashHi;
}

/** Passes the move to the opponent (null move, used by the search). */
export function makeNullMove(pos: Position): Undo {
  const undo: Undo = { move: 0, captured: 0, castling: pos.castling, ep: pos.ep, halfmove: pos.halfmove, hashLo: pos.hashLo, hashHi: pos.hashHi };
  if (pos.ep >= 0) {
    pos.hashLo = (pos.hashLo ^ ZOBRIST.ep[fileOf(pos.ep) * 2]!) >>> 0;
    pos.hashHi = (pos.hashHi ^ ZOBRIST.ep[fileOf(pos.ep) * 2 + 1]!) >>> 0;
  }
  pos.ep = -1;
  pos.side = (-pos.side) as Side;
  pos.hashLo = (pos.hashLo ^ ZOBRIST.side[0]) >>> 0;
  pos.hashHi = (pos.hashHi ^ ZOBRIST.side[1]) >>> 0;
  pos.halfmove++;
  return undo;
}

export function unmakeNullMove(pos: Position, undo: Undo): void {
  pos.side = (-pos.side) as Side;
  pos.ep = undo.ep;
  pos.halfmove = undo.halfmove;
  pos.hashLo = undo.hashLo;
  pos.hashHi = undo.hashHi;
}

/** All legal moves for the side to move (the position is left unchanged). */
export function legalMoves(pos: Position, capturesOnly = false): number[] {
  const side = pos.side;
  const out: number[] = [];
  for (const move of pseudoMoves(pos, capturesOnly)) {
    const undo = makeMove(pos, move);
    if (!inCheck(pos, side)) out.push(move);
    unmakeMove(pos, undo);
  }
  return out;
}

export function hasLegalMove(pos: Position): boolean {
  const side = pos.side;
  for (const move of pseudoMoves(pos)) {
    const undo = makeMove(pos, move);
    const ok = !inCheck(pos, side);
    unmakeMove(pos, undo);
    if (ok) return true;
  }
  return false;
}

/** Number of leaf nodes of the legal move tree at `depth` (move-generator verification). */
export function perft(pos: Position, depth: number): number {
  if (depth === 0) return 1;
  const side = pos.side;
  let nodes = 0;
  for (const move of pseudoMoves(pos)) {
    const undo = makeMove(pos, move);
    if (!inCheck(pos, side)) nodes += depth === 1 ? 1 : perft(pos, depth - 1);
    unmakeMove(pos, undo);
  }
  return nodes;
}

/* ------------------------------------------------------------------------ */
/* FEN                                                                        */
/* ------------------------------------------------------------------------ */

const PIECE_CHARS = ' pnbrqk';

export function pieceChar(piece: number): string {
  const c = PIECE_CHARS[Math.abs(piece)] ?? ' ';
  return piece > 0 ? c.toUpperCase() : c;
}

/** Parses and validates a FEN. Returns null for anything that is not a legal-looking position. Never throws. */
export function parseFen(fen: unknown): Position | null {
  if (typeof fen !== 'string' || fen.length > 120) return null;
  const parts = fen.trim().split(/\s+/);
  if (parts.length < 4 || parts.length > 6) return null;
  const [placement, sideText, castlingText, epText, halfText = '0', fullText = '1'] = parts as [string, string, string, string, string?, string?];
  const rows = placement.split('/');
  if (rows.length !== 8) return null;
  const board = new Int8Array(64);
  const kings: [number, number] = [-1, -1];
  for (let i = 0; i < 8; i++) {
    const rank = 7 - i;
    let file = 0;
    for (const ch of rows[i]!) {
      if (ch >= '1' && ch <= '8') {
        file += Number(ch);
        continue;
      }
      const type = PIECE_CHARS.indexOf(ch.toLowerCase());
      if (type <= 0 || file > 7) return null;
      const piece = ch === ch.toLowerCase() ? -type : type;
      const sq = rank * 8 + file;
      if (type === PAWN && (rank === 0 || rank === 7)) return null;
      if (type === KING) {
        const k = piece > 0 ? 0 : 1;
        if (kings[k] !== -1) return null;
        kings[k] = sq;
      }
      board[sq] = piece;
      file++;
    }
    if (file !== 8) return null;
  }
  if (kings[0] < 0 || kings[1] < 0) return null;
  if (sideText !== 'w' && sideText !== 'b') return null;
  const side: Side = sideText === 'w' ? WHITE : BLACK;
  if (!/^(-|K?Q?k?q?)$/.test(castlingText) || castlingText === '') return null;
  let castling = 0;
  if (castlingText.includes('K') && board[4] === KING && board[7] === ROOK) castling |= CASTLE_WK;
  if (castlingText.includes('Q') && board[4] === KING && board[0] === ROOK) castling |= CASTLE_WQ;
  if (castlingText.includes('k') && board[60] === -KING && board[63] === -ROOK) castling |= CASTLE_BK;
  if (castlingText.includes('q') && board[60] === -KING && board[56] === -ROOK) castling |= CASTLE_BQ;
  let ep = -1;
  if (epText !== '-') {
    const sq = parseSquare(epText);
    if (sq < 0 || rankOf(sq) !== (side === WHITE ? 5 : 2)) return null;
    // Keep the target only if it is consistent and a capture is pseudo-possible.
    const pawnSq = sq - 8 * side;
    if (board[pawnSq] === -PAWN * side && board[sq] === 0 && board[sq + 8 * side] === 0 && epCapturable(board, sq, side)) ep = sq;
  }
  if (!/^\d{1,4}$/.test(halfText) || !/^\d{1,4}$/.test(fullText)) return null;
  const fullmove = Math.max(1, Number(fullText));
  const pos: Position = { board, side, castling, ep, halfmove: Number(halfText), fullmove, kings, hashLo: 0, hashHi: 0 };
  // The side that just moved must not be in check.
  if (inCheck(pos, (-side) as Side)) return null;
  computeHash(pos);
  return pos;
}

export function toFen(pos: Position): string {
  const rows: string[] = [];
  for (let rank = 7; rank >= 0; rank--) {
    let row = '';
    let empty = 0;
    for (let file = 0; file < 8; file++) {
      const p = pos.board[rank * 8 + file]!;
      if (p === 0) {
        empty++;
        continue;
      }
      if (empty) row += String(empty);
      empty = 0;
      row += pieceChar(p);
    }
    if (empty) row += String(empty);
    rows.push(row);
  }
  let castling = '';
  if (pos.castling & CASTLE_WK) castling += 'K';
  if (pos.castling & CASTLE_WQ) castling += 'Q';
  if (pos.castling & CASTLE_BK) castling += 'k';
  if (pos.castling & CASTLE_BQ) castling += 'q';
  const ep = pos.ep >= 0 ? squareName(pos.ep) : '-';
  return `${rows.join('/')} ${pos.side === WHITE ? 'w' : 'b'} ${castling || '-'} ${ep} ${pos.halfmove} ${pos.fullmove}`;
}

export const startPosition = (): Position => parseFen(START_FEN)!;

/**
 * Key for repetition detection: placement, side, castling rights and the en-passant
 * square only if an en-passant capture is actually legal.
 */
export function repetitionKey(pos: Position): string {
  const fields = toFen(pos).split(' ');
  let ep = '-';
  if (pos.ep >= 0 && legalMoves(pos).some((m) => moveFlag(m) === FLAG_EP)) ep = fields[3]!;
  return `${fields[0]} ${fields[1]} ${fields[2]} ${ep}`;
}

/* ------------------------------------------------------------------------ */
/* Notation                                                                   */
/* ------------------------------------------------------------------------ */

export function moveToUci(move: number): string {
  const promo = movePromo(move);
  return squareName(moveFrom(move)) + squareName(moveTo(move)) + (promo ? PIECE_CHARS[promo]! : '');
}

/** The legal move matching a UCI-like string such as `e2e4` or `e7e8q`, or 0. */
export function uciToMove(pos: Position, uci: string): number {
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) return 0;
  const from = parseSquare(uci.slice(0, 2));
  const to = parseSquare(uci.slice(2, 4));
  const promo = uci.length === 5 ? PIECE_CHARS.indexOf(uci[4]!) : 0;
  return legalMoves(pos).find((m) => moveFrom(m) === from && moveTo(m) === to && movePromo(m) === promo) ?? 0;
}

const SAN_LETTERS = ' NBRQK';
export const SAN_PIECE = ['', '', 'N', 'B', 'R', 'Q', 'K'] as const;

/** Standard algebraic notation of a legal move (with +/# suffix). */
export function toSan(pos: Position, move: number, legal: readonly number[] = legalMoves(pos)): string {
  const from = moveFrom(move);
  const to = moveTo(move);
  const flag = moveFlag(move);
  const type = Math.abs(pos.board[from]!);
  let san: string;
  if (flag === FLAG_CASTLE_K) san = 'O-O';
  else if (flag === FLAG_CASTLE_Q) san = 'O-O-O';
  else {
    const capture = pos.board[to] !== 0 || flag === FLAG_EP;
    if (type === PAWN) {
      san = capture ? `${'abcdefgh'[fileOf(from)]!}x${squareName(to)}` : squareName(to);
      const promo = movePromo(move);
      if (promo) san += `=${SAN_PIECE[promo]!}`;
    } else {
      const rivals = legal.filter((m) => m !== move && moveTo(m) === to && Math.abs(pos.board[moveFrom(m)]!) === type);
      let dis = '';
      if (rivals.length > 0) {
        const sameFile = rivals.some((m) => fileOf(moveFrom(m)) === fileOf(from));
        const sameRank = rivals.some((m) => rankOf(moveFrom(m)) === rankOf(from));
        if (!sameFile) dis = 'abcdefgh'[fileOf(from)]!;
        else if (!sameRank) dis = String(rankOf(from) + 1);
        else dis = squareName(from);
      }
      san = `${SAN_PIECE[type]!}${dis}${capture ? 'x' : ''}${squareName(to)}`;
    }
  }
  const undo = makeMove(pos, move);
  if (inCheck(pos)) san += hasLegalMove(pos) ? '+' : '#';
  unmakeMove(pos, undo);
  return san;
}

const normalizeSan = (san: string) => san.replace(/[+#!?]/g, '').replace(/0/g, 'O').replace('=', '');

/** The legal move written as `san` (tolerates missing/extra check marks, `0-0`, and `e8Q`), or 0. */
export function parseSan(pos: Position, san: string): number {
  if (typeof san !== 'string' || san.length > 12) return 0;
  const wanted = normalizeSan(san.trim());
  const legal = legalMoves(pos);
  return legal.find((m) => normalizeSan(toSan(pos, m, legal)) === wanted) ?? 0;
}

export const sanLetters = SAN_LETTERS;

/* ------------------------------------------------------------------------ */
/* Game status                                                                */
/* ------------------------------------------------------------------------ */

export type DrawReason = 'stalemate' | 'threefold' | 'fiftyMove' | 'insufficient';
export type Status =
  | { kind: 'playing'; check: boolean }
  | { kind: 'checkmate'; winner: Color }
  | { kind: 'draw'; reason: DrawReason };

/** Dead positions recognised automatically: K v K, K+minor v K, and bishops-only on one square colour. */
export function insufficientMaterial(pos: Position): boolean {
  let minors = 0;
  let knights = 0;
  let lightBishops = 0;
  let darkBishops = 0;
  for (let sq = 0; sq < 64; sq++) {
    const type = Math.abs(pos.board[sq]!);
    if (type === 0 || type === KING) continue;
    if (type === PAWN || type === ROOK || type === QUEEN) return false;
    minors++;
    if (type === KNIGHT) knights++;
    else if ((fileOf(sq) + rankOf(sq)) % 2 === 0) darkBishops++;
    else lightBishops++;
  }
  if (minors <= 1) return true;
  return knights === 0 && (lightBishops === 0 || darkBishops === 0);
}

/** Status of `pos` given how often each repetition key has occurred (including `pos`). */
export function statusOf(pos: Position, repetitions: number): Status {
  const check = inCheck(pos);
  if (!hasLegalMove(pos)) return check ? { kind: 'checkmate', winner: colorOfSide((-pos.side) as Side) } : { kind: 'draw', reason: 'stalemate' };
  if (insufficientMaterial(pos)) return { kind: 'draw', reason: 'insufficient' };
  if (pos.halfmove >= 100) return { kind: 'draw', reason: 'fiftyMove' };
  if (repetitions >= 3) return { kind: 'draw', reason: 'threefold' };
  return { kind: 'playing', check };
}

export interface Replay {
  /** Position after all moves. */
  pos: Position;
  /** Internal move integers in order. */
  moves: number[];
  /** SAN of each move. */
  sans: string[];
  /** Repetition keys of the start position and after each move. */
  keys: string[];
  status: Status;
}

/**
 * Replays UCI moves from a FEN. Returns null if the FEN is invalid, a move is illegal,
 * or a move follows the end of the game. Never throws.
 */
export function replay(startFen: string, uciMoves: readonly string[]): Replay | null {
  const pos = parseFen(startFen);
  if (!pos) return null;
  const keys = [repetitionKey(pos)];
  const counts = new Map<string, number>([[keys[0]!, 1]]);
  let status = statusOf(pos, 1);
  const moves: number[] = [];
  const sans: string[] = [];
  for (const uci of uciMoves) {
    if (status.kind !== 'playing' || typeof uci !== 'string') return null;
    const move = uciToMove(pos, uci);
    if (!move) return null;
    sans.push(toSan(pos, move));
    makeMove(pos, move);
    moves.push(move);
    const key = repetitionKey(pos);
    keys.push(key);
    const n = (counts.get(key) ?? 0) + 1;
    counts.set(key, n);
    status = statusOf(pos, n);
  }
  return { pos, moves, sans, keys, status };
}

/* ------------------------------------------------------------------------ */
/* Serializable game state                                                    */
/* ------------------------------------------------------------------------ */

export const DIFFICULTIES = ['beginner', 'intermediate', 'strong'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'beginner';
export const OPPONENTS = ['computer', 'human'] as const;
export type Opponent = (typeof OPPONENTS)[number];
export const COLORS = ['w', 'b'] as const;
export const MAX_MOVES = 1200;
/** Play a game, solve "find the best move" puzzles, or solve "mate in N" puzzles. */
export const MODES = ['play', 'best', 'mate'] as const;
export type Mode = (typeof MODES)[number];
export const MATE_LENGTHS = [1, 2, 3, 4] as const;

/** A shipped puzzle: start position and the expected main line (best move, or the mating line). */
export interface PuzzleRef {
  fen: string;
  line: readonly string[];
}

/** The shipped puzzles of a category (empty for 'play'). */
export function puzzlesFor(mode: Mode, mateN: number): readonly PuzzleRef[] {
  if (mode === 'best') return BEST_MOVE_PUZZLES.map((p) => ({ fen: p.fen, line: [p.move] }));
  if (mode === 'mate') return MATE_PUZZLES.filter((p) => p.n === mateN).map((p) => ({ fen: p.fen, line: p.line }));
  return [];
}

/** The puzzle a state is about, or undefined in play mode. */
export const puzzleOf = (state: ChessState): PuzzleRef | undefined => puzzlesFor(state.mode, state.mateN)[state.puzzle];

export interface ChessState {
  /** Seed of this game (uint32); the computer's PRNG restarts from it. */
  seed: number;
  difficulty: Difficulty;
  opponent: Opponent;
  /** The person's colour against the computer (ignored for two people). */
  humanColor: Color;
  /** Start position as FEN (normally the standard start). */
  start: string;
  /** Moves in UCI-like notation (`e2e4`, `e7e8q`); the board is rebuilt by replaying them. */
  moves: string[];
  /** PRNG state for the computer's human-like move choice (uint32). */
  rng: number;
  /** Colour that resigned, or '' if nobody did. */
  resigned: '' | Color;
  mode: Mode;
  /** Length of the mates in 'mate' mode (1–4); kept as a preference in the other modes. */
  mateN: number;
  /** Index of the current puzzle in its category (0 in play mode). */
  puzzle: number;
}

export interface GameOptions {
  seed: number;
  difficulty: Difficulty;
  opponent: Opponent;
  humanColor: Color;
  start?: string;
  mode?: Mode;
  mateN?: number;
  /** Puzzle index; taken modulo the category size. */
  puzzle?: number;
}

/**
 * A fresh game or puzzle. In the puzzle modes the start position, the person's colour and
 * the opponent (the engine defends) come from the puzzle.
 */
export function createGame({ seed, difficulty, opponent, humanColor, start = START_FEN, mode = 'play', mateN = 1, puzzle = 0 }: GameOptions): ChessState {
  const base = { seed, difficulty, opponent, humanColor, start, moves: [], rng: seed, resigned: '' as const, mode, mateN, puzzle: 0 };
  const list = puzzlesFor(mode, mateN);
  if (list.length === 0) return { ...base, mode: 'play' };
  const index = ((puzzle % list.length) + list.length) % list.length;
  const fen = list[index]!.fen;
  return { ...base, opponent: 'computer', start: fen, humanColor: fen.split(' ')[1] === 'b' ? 'b' : 'w', puzzle: index };
}

export type Outcome =
  | { kind: 'playing'; check: boolean; turn: Color }
  | { kind: 'checkmate'; winner: Color }
  | { kind: 'draw'; reason: DrawReason }
  | { kind: 'resigned'; winner: Color }
  /** A "find the best move" puzzle after its (correct) move. */
  | { kind: 'solved' };

/** Outcome including puzzle completion. */
export function stateOutcome(state: ChessState, game: Replay): Outcome {
  if (state.mode === 'best' && game.moves.length > 0) return { kind: 'solved' };
  return outcomeOfReplay(game, state.resigned);
}

export function outcomeOfReplay(game: Replay, resigned: '' | Color): Outcome {
  if (game.status.kind === 'playing') {
    if (resigned) return { kind: 'resigned', winner: resigned === 'w' ? 'b' : 'w' };
    return { kind: 'playing', check: game.status.check, turn: colorOfSide(game.pos.side) };
  }
  return game.status;
}

/** Replays a state that is known to be valid. */
export function replayState(state: ChessState): Replay {
  const game = replay(state.start, state.moves);
  if (!game) throw new RangeError('Invalid chess state');
  return game;
}

export const outcomeOf = (state: ChessState): Outcome => stateOutcome(state, replayState(state));

/** True when the engine (playing to win, not as a puzzle defender) must move. */
export function isComputerTurn(state: ChessState, game: Replay = replayState(state)): boolean {
  if (state.opponent !== 'computer' || state.mode !== 'play') return false;
  return outcomeOfReplay(game, state.resigned).kind === 'playing' && colorOfSide(game.pos.side) !== state.humanColor;
}

/** Adds one legal move (UCI). Throws if illegal or the game is over. */
export function applyMove(state: ChessState, uci: string): ChessState {
  const game = replayState(state);
  if (stateOutcome(state, game).kind !== 'playing') throw new RangeError('The game is already over');
  if (!uciToMove(game.pos, uci)) throw new RangeError(`Illegal move ${uci}`);
  return { ...state, moves: [...state.moves, uci] };
}

/** The side to move resigns (or, against the computer, the person). */
export function resign(state: ChessState): ChessState {
  const game = replayState(state);
  if (state.mode !== 'play' || stateOutcome(state, game).kind !== 'playing') return state;
  const loser = state.opponent === 'computer' ? state.humanColor : colorOfSide(game.pos.side);
  return { ...state, resigned: loser };
}

/** Index of the first move the person made against the computer (0 if they play white from the start position). */
function firstHumanPly(state: ChessState): number {
  const pos = parseFen(state.start);
  return pos && colorOfSide(pos.side) === state.humanColor ? 0 : 1;
}

export function canUndo(state: ChessState): boolean {
  if (outcomeOf(state).kind !== 'playing') return false;
  if (state.opponent === 'human') return state.moves.length > 0;
  return state.moves.length > firstHumanPly(state);
}

/** Takes back the last move; against the computer, the person's last move together with the reply. */
export function undo(state: ChessState): ChessState {
  if (!canUndo(state)) return state;
  const moves = [...state.moves];
  if (state.opponent === 'human') moves.pop();
  else {
    const first = firstHumanPly(state);
    // Remove plies until the removed one was the person's (their moves are at first, first + 2, …).
    let removed = moves.length - 1;
    moves.pop();
    while ((removed - first) % 2 !== 0) {
      removed--;
      moves.pop();
    }
  }
  return { ...state, moves };
}

const UCI_PATTERN = /^[a-h][1-8][a-h][1-8][qrbn]?$/;

/** Thorough validation of untrusted data, including a full legal replay. Never throws. */
export function isValidState(value: unknown): value is ChessState {
  try {
    if (!isRecord(value) || Object.keys(value).length !== 11) return false;
    const { seed, difficulty, opponent, humanColor, start, moves, rng, resigned, mode, mateN, puzzle } = value;
    if (!isOneOf(mode, MODES) || !isInt(mateN, 1, 4) || !isInt(puzzle, 0, 9999)) return false;
    if (!isUint32(seed) || !isUint32(rng)) return false;
    if (!isOneOf(difficulty, DIFFICULTIES) || !isOneOf(opponent, OPPONENTS) || !isOneOf(humanColor, COLORS)) return false;
    if (resigned !== '' && !isOneOf(resigned, COLORS)) return false;
    if (typeof start !== 'string') return false;
    if (!isArrayOf(moves, (m): m is string => typeof m === 'string' && UCI_PATTERN.test(m)) || moves.length > MAX_MOVES) return false;
    const game = replay(start, moves);
    if (!game) return false;
    if (resigned !== '' && game.status.kind !== 'playing') return false;
    if (opponent === 'computer' && resigned !== '' && resigned !== humanColor) return false;
    if (mode !== 'play') {
      // Puzzles: the shipped position, the person moves first, nobody resigns, and the
      // line never exceeds the puzzle (a best-move puzzle stores only its correct move).
      const ref = puzzlesFor(mode, mateN)[puzzle];
      if (!ref || start !== ref.fen || opponent !== 'computer' || resigned !== '') return false;
      if (humanColor !== colorOfSide(parseFen(start)!.side) || moves.length > ref.line.length) return false;
      if (mode === 'best') return moves.length === 0 || moves[0] === ref.line[0];
    } else if (puzzle !== 0) return false;
    // Against the computer there is never "half a turn": the reply is part of the person's move.
    if (opponent === 'computer' && resigned === '' && game.status.kind === 'playing' && colorOfSide(game.pos.side) !== humanColor) return false;
    return true;
  } catch {
    return false;
  }
}
