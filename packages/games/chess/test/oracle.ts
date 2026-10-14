/**
 * Independent mate oracle for the puzzle tests: a deliberately plain AND/OR recursion over
 * the legal move lists (no memo, no move ordering, no budget), sharing nothing with
 * `MateSolver` except the perft-verified move generator.
 */
import { hasLegalMove, inCheck, legalMoves, makeMove, unmakeMove, type Position } from '../src/rules';

/** Does `move` (by the side to move) force mate within `n` moves including itself? */
export function oracleForcesMate(pos: Position, move: number, n: number): boolean {
  const undo = makeMove(pos, move);
  let result: boolean;
  if (n === 1) {
    // Only a checking move can mate on the last move.
    result = inCheck(pos) && !hasLegalMove(pos);
  } else {
    const replies = legalMoves(pos);
    if (replies.length === 0) result = inCheck(pos);
    else {
      result = true;
      for (const reply of replies) {
        const r = makeMove(pos, reply);
        const mated = legalMoves(pos).some((next) => oracleForcesMate(pos, next, n - 1));
        unmakeMove(pos, r);
        if (!mated) {
          result = false;
          break;
        }
      }
    }
  }
  unmakeMove(pos, undo);
  return result;
}

/** All first moves that force mate within n. */
export const oracleSolutions = (pos: Position, n: number): number[] => legalMoves(pos).filter((m) => oracleForcesMate(pos, m, n));
