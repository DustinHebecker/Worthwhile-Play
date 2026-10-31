/** Test helpers shared by the rules and expert-level tests. */
import { expect } from 'vitest';
import { LEVELS, type LevelSource } from '../src/levels';
import { LEVEL_SETS, PIECE_KINDS, levelOf, placePiece, rotatePiece, type LaserState, type Level, type LevelSet } from '../src/rules';
import { PIECE_TOKENS, kindOfToken, parseSolution } from './oracle';

/** Every level with its set and index. */
export const ALL = LEVEL_SETS.flatMap((set) => LEVELS[set].map((source: LevelSource, index: number) => ({ set, index, source })));

export const stateOf = (set: LevelSet, level: number): LaserState => ({ seed: level, difficulty: set, level, pieces: [], moves: 0, undo: [] });

export const pieceCount = (source: LevelSource) => PIECE_KINDS.reduce((sum, kind) => sum + ((source.inventory as Readonly<Record<string, number | undefined>>)[kind] ?? 0), 0);

/**
 * The original 24 levels (and their ids) from before the optical diodes, portals and optics:
 * "easy", "medium" and the first eight "hard" levels of state version 1.
 */
export const ORIGINAL: Readonly<Record<LevelSet, number>> = { intro: 8, easy: 8, medium: 8, hard: 0, expert: 0 };
export const isOriginal = (set: LevelSet, index: number) => index < ORIGINAL[set];

/** Pieces other than mirrors, splitters and blockers. */
export const OPTICAL_KINDS = PIECE_KINDS.filter((kind) => kind !== 'mirror' && kind !== 'splitter' && kind !== 'blocker');

/** True when a level uses the optics of the expert set (polarisers, ND filters, chromatic blockers, placeable filters, intensity or polarisation targets). */
export const usesOptics = (level: Level): boolean =>
  OPTICAL_KINDS.some((kind) => level.inventory[kind] > 0) ||
  level.cells.some((cell) => cell.kind === 'polariser' || cell.kind === 'neutral' || cell.kind === 'absorber' || (cell.kind === 'target' && (cell.level !== undefined || cell.pol !== undefined)));

/**
 * The largest exact-search tree among the hard levels (the old expert set): every expert level
 * must need a bigger search. `levels.slow.test.ts` checks the value against the hard levels.
 */
export const HARD_MAX_NODES = 1_727_855;

/** Applies an oracle solution through the game's own actions (place, then turn into the solution's orientation). */
export function applySolution(state: LaserState, solution: string): LaserState {
  let s = state;
  for (const { row, col, token } of parseSolution(solution)) {
    const cell = row * levelOf(s).width + col;
    const kind = kindOfToken(token);
    const before = s;
    s = placePiece(s, cell, kind);
    expect(s).not.toBe(before);
    const turns = (PIECE_TOKENS[kind] as readonly string[]).indexOf(token);
    for (let i = 0; i < turns; i++) s = rotatePiece(s, cell);
  }
  return s;
}
