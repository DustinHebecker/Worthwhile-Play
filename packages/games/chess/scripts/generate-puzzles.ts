/**
 * Regenerates `src/puzzle-data.ts` (the shipped, solver-verified chess puzzles). Run from the
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
 * Positions are ORIGINAL: they are harvested from games the built-in engine plays against
 * itself (seeded, varied strength pairings, so the weaker side's mistakes create tactics).
 * No external puzzle database is used. Every candidate is verified:
 *  - mate in n: exhaustive mate solver (no faster mate, exactly one first move);
 *  - best move: deep search, the best move leads every alternative by BEST_MOVE_GAP and a
 *    smaller search agrees; the line is then extended move by move with the engine's best reply
 *    while the next position again has a unique clearly best move (stopping rule: at most
 *    MAX_LINE_MOVES moves of the person, stop once the lead is decisive (DECISIVE_LEAD) unless
 *    it is a forced mate; see `extendBestLine` in src/ai.ts).
 * Selection: games 0 … BASE_GAMES − 1 give the original categories in game order (the first 32
 * best-move puzzles keep their positions and indices, so saved games still find their puzzle;
 * their lines are extended where the rule allows). Further games 'BASE_GAMES …' only add
 * best-move puzzles whose line has at least two moves, so a good share of the category is
 * multi-move.
 * Deterministic: the same code always produces the same file.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRng } from '@wp/game-core';
import {
  BudgetExceeded,
  LEVELS,
  MATE,
  MateSolver,
  chooseMove,
  MAX_LINE_MOVES,
  uniqueBestMove,
  verifyBestMovePuzzle,
  verifyMatePuzzle,
  type BestMovePuzzle,
  type Level,
  type MatePuzzle
} from '../src/ai';
import { inCheck, legalMoves, moveTo, moveToUci, parseFen, replay, START_FEN, toFen } from '../src/rules';

const PER_CATEGORY = 32;
/** Additional multi-move best-move lines (from games after the base games). */
const EXTRA_LINES = Number(process.env.CHESS_PUZZLE_EXTRA ?? 32);
/** Games whose harvest forms the original categories (unchanged since single-move puzzles). */
const BASE_GAMES = 120;
const MAX_GAMES = Number(process.env.CHESS_PUZZLE_GAMES ?? 180);
/** In extra games: puzzles from one game are at least this many plies apart (variety). */
const EXTRA_SPACING = 16;
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

/** One harvested puzzle with its origin (game index, ply) for a deterministic merge. */
type Found = { game: number; ply: number } & ({ kind: 'mate'; puzzle: MatePuzzle } | { kind: 'best'; puzzle: BestMovePuzzle });

/**
 * Plays one seeded self-play game and returns verified puzzle positions in it. Base games: at
 * most one per category (as always). Extra games: only best-move lines of two or more moves,
 * at most two per game, EXTRA_SPACING plies apart.
 */
function harvest(game: number): Found[] {
  const found: Found[] = [];
  const base = game < BASE_GAMES;
  const rng = createRng(0xc4e55 + game * 7919);
  const [white, black] = PAIRINGS[game % PAIRINGS.length]!;
  const moves: string[] = [];
  const history: number[] = [];
  const taken = new Set<string>();
  let lastExtra = -EXTRA_SPACING;
  for (let ply = 0; ply < 160; ply++) {
    const g = replay(START_FEN, moves)!;
    if (g.status.kind !== 'playing') break;
    const pos = g.pos;
    const fen = toFen(pos);
    const choice = chooseMove(pos, pos.side === 1 ? white : black, rng, history);
    if (ply >= 8) {
      // Mates: only where a quick search already smells blood (keeps the harvest fast).
      if (base && choice.score > 400) {
        try {
          const solver = new MateSolver(400_000);
          let n = solver.distance(parseFen(fen)!, 3);
          if (n === 0 && choice.score > 600 && !taken.has('mate4') && new MateSolver(1_000_000).canMate(parseFen(fen)!, 4)) n = 4;
          if (n > 0 && !taken.has(`mate${n}`)) {
            const puzzle = verifyMatePuzzle(fen, n, new MateSolver(2_000_000));
            if (puzzle) {
              found.push({ game, ply, kind: 'mate', puzzle });
              taken.add(`mate${n}`);
            }
          }
        } catch (error) {
          if (!(error instanceof BudgetExceeded)) throw error;
        }
      }
      // Best move: a quiet-looking position (not in check, not a recapture) with one clearly best move.
      const last = g.moves[g.moves.length - 1];
      const wanted = base ? !taken.has('best') : found.length < 2 && ply - lastExtra >= EXTRA_SPACING;
      if (wanted && ply >= 12 && !inCheck(pos) && Math.abs(choice.score) < MATE - 1000) {
        const candidate = uniqueBestMove(parseFen(fen)!, { ...LEVELS.strong, nodes: 8000, margin: 0, temperature: 0 });
        const puzzle = candidate ? verifyBestMovePuzzle(fen) : null;
        const move = puzzle ? legalMoves(parseFen(fen)!).find((m) => moveToUci(m) === puzzle.line[0]) : undefined;
        const recapture = last !== undefined && move !== undefined && moveTo(move) === moveTo(last);
        if (puzzle && move !== undefined && !recapture && (base || puzzle.line.length > 1)) {
          found.push({ game, ply, kind: 'best', puzzle });
          taken.add('best');
          lastExtra = ply;
        }
      }
    }
    history.push(pos.hashLo, pos.hashHi);
    moves.push(moveToUci(choice.move));
  }
  return found;
}

const started = Date.now();
const shard = process.env.CHESS_PUZZLE_SHARD; // "i/k": harvest games g with g % k === i into CHESS_PUZZLE_OUT
const merge = process.env.CHESS_PUZZLE_MERGE; // comma-separated shard files to combine
let all: Found[] = [];
if (merge) {
  all = merge.split(',').flatMap((file) => JSON.parse(readFileSync(file, 'utf8')) as Found[]);
} else {
  const [index, count] = shard ? shard.split('/').map(Number) : [0, 1];
  for (let game = index!; game < MAX_GAMES; game += count!) {
    all.push(...harvest(game));
    log(`game ${game}: ${all.length} puzzles so far`);
  }
  if (shard) {
    writeFileSync(process.env.CHESS_PUZZLE_OUT!, JSON.stringify(all));
    process.exit(0);
  }
}

// Deterministic selection: by game, then ply; the same position never twice. The base games
// fill the original categories first, then extra games add multi-move best-move lines.
all.sort((a, b) => a.game - b.game || a.ply - b.ply);
const mates: MatePuzzle[][] = [[], [], [], []];
const best: BestMovePuzzle[] = [];
const seen = new Set<string>();
/** Placement + side only: the same picture never appears twice. */
const keyOf = (fen: string) => fen.split(' ').slice(0, 2).join(' ');
for (const item of all) {
  if (item.game >= BASE_GAMES) continue;
  const key = keyOf(item.puzzle.fen);
  if (seen.has(key)) continue;
  const list = item.kind === 'best' ? best : mates[item.puzzle.n - 1]!;
  if (list.length >= PER_CATEGORY) continue;
  seen.add(key);
  (list as unknown[]).push(item.puzzle);
}
let extra = 0;
for (const item of all) {
  if (item.game < BASE_GAMES || item.kind !== 'best' || extra >= EXTRA_LINES) continue;
  const key = keyOf(item.puzzle.fen);
  if (seen.has(key)) continue;
  seen.add(key);
  best.push(item.puzzle);
  extra++;
}

function log(message: string) {
  console.log(`[${Math.round((Date.now() - started) / 1000)} s] ${message}`);
}

const mateRows = mates
  .flat()
  .map((p) => `  { fen: '${p.fen}', n: ${p.n}, line: [${p.line.map((m) => `'${m}'`).join(', ')}] }`)
  .join(',\n');
const bestRows = best.map((p) => `  { fen: '${p.fen}', line: [${p.line.map((m) => `'${m}'`).join(', ')}] }`).join(',\n');

writeFileSync(
  target,
  `/**
 * GENERATED by scripts/generate-puzzles.ts — do not edit by hand.
 * Original positions from the built-in engine's self-play, verified by the exhaustive mate
 * solver and deep search (and re-verified in test/puzzles.test.ts).
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
log(`wrote ${mates.map((l) => l.length).join('/')} mates and ${best.length} best-move puzzles (moves per line 1/2/3: ${lengths.join('/')})`);
