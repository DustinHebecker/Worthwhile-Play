/**
 * Regenerates `src/puzzle-data.ts` (the shipped, solver-verified chess puzzles). Run from the
 * repository root (Vite's module runner executes the TypeScript directly):
 *
 *   node -e "import('vite').then(({ runnerImport }) => runnerImport('./packages/games/chess/scripts/generate-puzzles.ts'))"
 *
 * Positions are ORIGINAL: they are harvested from games the built-in engine plays against
 * itself (seeded, varied strength pairings, so the weaker side's mistakes create tactics).
 * No external puzzle database is used. Every candidate is verified:
 *  - mate in n: exhaustive mate solver (no faster mate, exactly one first move);
 *  - best move: deep search, the best move leads every alternative by BEST_MOVE_GAP and a
 *    smaller search agrees.
 * Deterministic: the same code always produces the same file.
 */
import { writeFileSync } from 'node:fs';
import { createRng } from '@wp/game-core';
import {
  BudgetExceeded,
  LEVELS,
  MATE,
  MateSolver,
  chooseMove,
  verifyBestMovePuzzle,
  verifyMatePuzzle,
  type BestMovePuzzle,
  type Level,
  type MatePuzzle
} from '../src/ai';
import { inCheck, legalMoves, moveTo, moveToUci, parseFen, replay, START_FEN, toFen } from '../src/rules';

const PER_CATEGORY = 32;
const MAX_GAMES = Number(process.env.CHESS_PUZZLE_GAMES ?? 600);
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

const mates: MatePuzzle[][] = [[], [], [], []];
const best: BestMovePuzzle[] = [];
const seen = new Set<string>();
/** Placement + side only: the same picture never appears twice. */
const keyOf = (fen: string) => fen.split(' ').slice(0, 2).join(' ');
const full = () => mates.every((list) => list.length >= PER_CATEGORY) && best.length >= PER_CATEGORY;

const started = Date.now();
for (let game = 0; game < MAX_GAMES && !full(); game++) {
  const rng = createRng(0xc4e55 + game * 7919);
  const [white, black] = PAIRINGS[game % PAIRINGS.length]!;
  const moves: string[] = [];
  const history: number[] = [];
  let bestTaken = false;
  const mateTaken = [false, false, false, false];
  for (let ply = 0; ply < 160; ply++) {
    const g = replay(START_FEN, moves)!;
    if (g.status.kind !== 'playing') break;
    const pos = g.pos;
    const fen = toFen(pos);
    const choice = chooseMove(pos, pos.side === 1 ? white : black, rng, history);

    if (ply >= 8 && !seen.has(keyOf(fen))) {
      // Mates: only where a quick search already smells blood (keeps the harvest fast).
      if (choice.score > 400) {
        const solver = new MateSolver(400_000);
        try {
          const n = solver.distance(parseFen(fen)!, 4);
          if (n > 0 && !mateTaken[n - 1] && mates[n - 1]!.length < PER_CATEGORY) {
            const puzzle = verifyMatePuzzle(fen, n, solver);
            if (puzzle) {
              mates[n - 1]!.push(puzzle);
              mateTaken[n - 1] = true;
              seen.add(keyOf(fen));
              log(`mate in ${n}: ${fen}`);
            }
          }
        } catch (error) {
          if (!(error instanceof BudgetExceeded)) throw error;
        }
      }
      // Best move: a quiet-looking position (not in check, not a recapture) with one clearly best move.
      const last = g.moves[g.moves.length - 1];
      const recapture = last !== undefined && moveTo(choice.move) === moveTo(last);
      if (!bestTaken && best.length < PER_CATEGORY && ply >= 12 && !inCheck(pos) && !recapture && Math.abs(choice.score) < MATE - 1000) {
        const candidate = verifyBestMovePuzzle(fen, { ...LEVELS.strong, nodes: 8000, margin: 0, temperature: 0 });
        if (candidate) {
          const puzzle = verifyBestMovePuzzle(fen);
          const reply = puzzle ? legalMoves(parseFen(fen)!).find((m) => moveToUci(m) === puzzle.move) : undefined;
          if (puzzle && reply !== undefined && !(last !== undefined && moveTo(reply) === moveTo(last))) {
            best.push(puzzle);
            bestTaken = true;
            seen.add(keyOf(fen));
            log(`best move ${puzzle.move}: ${fen}`);
          }
        }
      }
    }
    history.push(pos.hashLo, pos.hashHi);
    moves.push(moveToUci(choice.move));
  }
  if (game % 10 === 9) log(`after game ${game + 1}: mates ${mates.map((l) => l.length).join('/')}, best ${best.length}`);
}

function log(message: string) {
  console.log(`[${Math.round((Date.now() - started) / 1000)} s] ${message}`);
}

const mateRows = mates
  .flat()
  .map((p) => `  { fen: '${p.fen}', n: ${p.n}, line: [${p.line.map((m) => `'${m}'`).join(', ')}] }`)
  .join(',\n');
const bestRows = best.map((p) => `  { fen: '${p.fen}', move: '${p.move}' }`).join(',\n');

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
log(`wrote ${mates.map((l) => l.length).join('/')} mates and ${best.length} best-move puzzles`);
