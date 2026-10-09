/**
 * Regenerates `src/puzzle-data.ts` (the shipped, verified chess puzzles). Run from the
 * repository root (Vite's module runner executes the TypeScript directly):
 *
 *   node -e "import('vite').then(({ runnerImport }) => runnerImport('./packages/games/chess/scripts/generate-puzzles.ts'))"
 *
 * Faster, same result: run shards in parallel, then merge (selection is by game index, so the
 * output does not depend on how the games were split):
 *
 *   for i in 0 1 2 3; do CHESS_PUZZLE_SHARD=$i/4 CHESS_PUZZLE_OUT=/tmp/chess-$i.json node -e "…same…" & done; wait
 *   CHESS_PUZZLE_MERGE=/tmp/chess-0.json,/tmp/chess-1.json,/tmp/chess-2.json,/tmp/chess-3.json node -e "…same…"
 *
 * FROZEN BASE: saved games refer to a puzzle by its index in its category, so shipped puzzles
 * never move. All mate-in-N puzzles and the first FROZEN_BEST best-move positions are taken
 * from the current file unchanged (they were harvested from self-play games 0–119 by the first
 * version of this script; its mate harvester is in the git history). For the frozen best-move
 * positions only the LINE is recomputed (the first move must stay the same, otherwise the
 * script fails).
 *
 * NEW LINES: further positions are ORIGINAL, harvested from games the built-in engine plays
 * against itself (seeded, varied strength pairings, so the weaker side's mistakes create
 * tactics), starting at game FIRST_GAME. No external puzzle database is used. Only lines with
 * at least two moves of the person are added (so a good share of the category is multi-move).
 * Every best-move line is verified by `verifyBestMovePuzzle` (src/ai.ts): the first move leads
 * every alternative by BEST_MOVE_GAP in a deep search and a smaller search agrees; the line is
 * then extended with the engine's best reply while the next position again has a unique clearly
 * best move. Stopping rule (`extendBestLine`): at most MAX_LINE_MOVES moves of the person, stop
 * once the person's lead after the reply is decisive (DECISIVE_LEAD) unless it is a forced mate,
 * and stop when the game ends or no unique clearly best move exists.
 * Deterministic and idempotent: the same code and base always produce the same file.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRng } from '@wp/game-core';
import { LEVELS, MATE, MAX_LINE_MOVES, chooseMove, uniqueBestMove, verifyBestMovePuzzle, type BestMovePuzzle, type Level } from '../src/ai';
import { BEST_MOVE_PUZZLES, MATE_PUZZLES } from '../src/puzzle-data';
import { inCheck, legalMoves, moveTo, moveToUci, parseFen, replay, START_FEN, toFen } from '../src/rules';

/** Best-move puzzles whose positions are frozen (indices 0 … FROZEN_BEST − 1). */
const FROZEN_BEST = 32;
/** New multi-move lines appended after the frozen ones. */
const EXTRA_LINES = Number(process.env.CHESS_PUZZLE_EXTRA ?? 32);
/** Games 0 … FIRST_GAME − 1 produced the frozen base. */
const FIRST_GAME = 120;
const MAX_GAMES = Number(process.env.CHESS_PUZZLE_GAMES ?? 180);
/** Puzzles from one game are at least this many plies apart (variety). */
const SPACING = 16;
const target = new URL('../src/puzzle-data.ts', import.meta.url);

const fast = (level: Level, nodes: number): Level => ({ ...level, nodes });
/** Strength pairings: a weaker side makes the mistakes, a stronger side punishes them. */
const PAIRINGS: readonly [Level, Level][] = [
  [fast(LEVELS.strong, 6000), LEVELS.beginner],
  [LEVELS.beginner, fast(LEVELS.strong, 6000)],
  [fast(LEVELS.intermediate, 6000), LEVELS.beginner],
  [LEVELS.beginner, fast(LEVELS.intermediate, 6000)],
  [fast(LEVELS.strong, 6000), fast(LEVELS.intermediate, 4000)]
];

/** One harvested line with its origin (game index, ply) for a deterministic merge. */
type Found = { game: number; ply: number; kind: 'best'; puzzle: BestMovePuzzle };

/**
 * Plays one seeded self-play game and returns verified best-move lines of two or more moves in
 * it: quiet-looking positions (not in check, not a recapture), at most two per game, SPACING
 * plies apart.
 */
function harvest(game: number): Found[] {
  const found: Found[] = [];
  const rng = createRng(0xc4e55 + game * 7919);
  const [white, black] = PAIRINGS[game % PAIRINGS.length]!;
  const moves: string[] = [];
  const history: number[] = [];
  let last = -SPACING;
  for (let ply = 0; ply < 160; ply++) {
    const g = replay(START_FEN, moves)!;
    if (g.status.kind !== 'playing') break;
    const pos = g.pos;
    const fen = toFen(pos);
    const choice = chooseMove(pos, pos.side === 1 ? white : black, rng, history);
    const previous = g.moves[g.moves.length - 1];
    if (found.length < 2 && ply - last >= SPACING && ply >= 12 && !inCheck(pos) && Math.abs(choice.score) < MATE - 1000) {
      const candidate = uniqueBestMove(parseFen(fen)!, { ...LEVELS.strong, nodes: 8000, margin: 0, temperature: 0 });
      const puzzle = candidate ? verifyBestMovePuzzle(fen) : null;
      const move = puzzle ? legalMoves(parseFen(fen)!).find((m) => moveToUci(m) === puzzle.line[0]) : undefined;
      const recapture = previous !== undefined && move !== undefined && moveTo(move) === moveTo(previous);
      if (puzzle && move !== undefined && !recapture && puzzle.line.length > 1) {
        found.push({ game, ply, kind: 'best', puzzle });
        last = ply;
      }
    }
    history.push(pos.hashLo, pos.hashHi);
    moves.push(moveToUci(choice.move));
  }
  return found;
}

const started = Date.now();
function log(message: string) {
  console.log(`[${Math.round((Date.now() - started) / 1000)} s] ${message}`);
}

const shard = process.env.CHESS_PUZZLE_SHARD; // "i/k": harvest games g with g % k === i into CHESS_PUZZLE_OUT
const merge = process.env.CHESS_PUZZLE_MERGE; // comma-separated shard files to combine
let all: Found[] = [];
if (merge) {
  all = merge.split(',').flatMap((file) => JSON.parse(readFileSync(file, 'utf8')) as Found[]);
} else {
  const [index, count] = shard ? shard.split('/').map(Number) : [0, 1];
  for (let game = FIRST_GAME + ((index! - FIRST_GAME) % count! + count!) % count!; game < MAX_GAMES; game += count!) {
    all.push(...harvest(game));
    log(`game ${game}: ${all.length} lines so far`);
  }
  if (shard) {
    writeFileSync(process.env.CHESS_PUZZLE_OUT!, JSON.stringify(all));
    process.exit(0);
  }
}

/** Placement + side only: the same picture never appears twice. */
const keyOf = (fen: string) => fen.split(' ').slice(0, 2).join(' ');
const seen = new Set<string>(MATE_PUZZLES.map((p) => keyOf(p.fen)));
// Frozen best-move positions: same position and first move, line recomputed.
const best: BestMovePuzzle[] = BEST_MOVE_PUZZLES.slice(0, FROZEN_BEST).map((old) => {
  const puzzle = verifyBestMovePuzzle(old.fen);
  if (!puzzle || puzzle.line[0] !== old.line[0]) throw new Error(`Frozen puzzle no longer verifies: ${old.fen}`);
  seen.add(keyOf(old.fen));
  return puzzle;
});
log('frozen best-move lines recomputed');
// New lines: by game, then ply (only games of this harvest, only multi-move lines).
all.sort((a, b) => a.game - b.game || a.ply - b.ply);
let extra = 0;
for (const item of all) {
  if (item.game < FIRST_GAME || item.kind !== 'best' || item.puzzle.line.length < 3 || extra >= EXTRA_LINES) continue;
  const key = keyOf(item.puzzle.fen);
  if (seen.has(key)) continue;
  seen.add(key);
  best.push(item.puzzle);
  extra++;
}

const mateRows = MATE_PUZZLES.map((p) => `  { fen: '${p.fen}', n: ${p.n}, line: [${p.line.map((m) => `'${m}'`).join(', ')}] }`).join(',\n');
const bestRows = best.map((p) => `  { fen: '${p.fen}', line: [${p.line.map((m) => `'${m}'`).join(', ')}] }`).join(',\n');

writeFileSync(
  target,
  `/**
 * GENERATED by scripts/generate-puzzles.ts — do not edit by hand.
 * Original positions from the built-in engine's self-play, verified by the exhaustive mate
 * solver and deep search (and re-verified in test/puzzle-data.test.ts). Saved games refer to
 * puzzles by index: existing entries never move, new ones are appended.
 */
import type { BestMovePuzzle, MatePuzzle } from './ai';

export const MATE_PUZZLES: readonly MatePuzzle[] = [
${mateRows}
];

export const BEST_MOVE_PUZZLES: readonly BestMovePuzzle[] = [
${bestRows}
];
`
);
const lengths = Array.from({ length: MAX_LINE_MOVES }, (_, i) => best.filter((p) => p.line.length === 2 * i + 1).length);
log(`wrote ${MATE_PUZZLES.length} mates (unchanged) and ${best.length} best-move puzzles (moves per line 1/2/3: ${lengths.join('/')})`);
