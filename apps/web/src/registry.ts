import type { GameMetadata, GameModule } from '@wp/game-core';
import { metadata as blackBox } from '@wp/game-black-box/metadata';
import { metadata as bridges } from '@wp/game-bridges/metadata';
import { metadata as constraintGrid } from '@wp/game-constraint-grid/metadata';
import { metadata as connectFour } from '@wp/game-connect-four/metadata';
import { metadata as graphDetective } from '@wp/game-graph-detective/metadata';
import { metadata as laserCircuit } from '@wp/game-laser-circuit/metadata';
import { metadata as lightsOut } from '@wp/game-lights-out/metadata';
import { metadata as logicPath } from '@wp/game-logic-path/metadata';
import { metadata as mastermind } from '@wp/game-mastermind/metadata';
import { metadata as memory } from '@wp/game-memory/metadata';
import { metadata as minimalProof } from '@wp/game-minimal-proof/metadata';
import { metadata as minesweeper } from '@wp/game-minesweeper/metadata';
import { metadata as nonogram } from '@wp/game-nonogram/metadata';
import { metadata as riverCrossing } from '@wp/game-river-crossing/metadata';
import { metadata as sequenceMemory } from '@wp/game-sequence-memory/metadata';
import { metadata as skyscrapers } from '@wp/game-skyscrapers/metadata';
import { metadata as slidingBlocks } from '@wp/game-sliding-blocks/metadata';
import { metadata as sokoban } from '@wp/game-sokoban/metadata';
import { metadata as spatialMemory } from '@wp/game-spatial-memory/metadata';
import { metadata as ticTacToe } from '@wp/game-tic-tac-toe/metadata';

export interface GameEntry {
  /** Lightweight metadata (incl. translated title/tagline/rules), bundled with the shell. */
  metadata: GameMetadata;
  /** Lazily loads the game code, so each game is its own chunk and can be launched directly. */
  load: () => Promise<GameModule<unknown>>;
}

const entry = <S>(metadata: GameMetadata, load: () => Promise<{ default: GameModule<S> }>): GameEntry => ({
  metadata,
  load: async () => (await load()).default as GameModule<unknown>
});

/** Catalogue order = order of this list. Adding a game: one line here + a package under packages/games. */
export const GAMES: readonly GameEntry[] = [
  entry(mastermind, () => import('@wp/game-mastermind')),
  entry(blackBox, () => import('@wp/game-black-box')),
  entry(graphDetective, () => import('@wp/game-graph-detective')),
  entry(logicPath, () => import('@wp/game-logic-path')),
  entry(constraintGrid, () => import('@wp/game-constraint-grid')),
  entry(minimalProof, () => import('@wp/game-minimal-proof')),
  entry(nonogram, () => import('@wp/game-nonogram')),
  entry(skyscrapers, () => import('@wp/game-skyscrapers')),
  entry(bridges, () => import('@wp/game-bridges')),
  entry(minesweeper, () => import('@wp/game-minesweeper')),
  entry(lightsOut, () => import('@wp/game-lights-out')),
  entry(sokoban, () => import('@wp/game-sokoban')),
  entry(slidingBlocks, () => import('@wp/game-sliding-blocks')),
  entry(riverCrossing, () => import('@wp/game-river-crossing')),
  entry(laserCircuit, () => import('@wp/game-laser-circuit')),
  entry(memory, () => import('@wp/game-memory')),
  entry(sequenceMemory, () => import('@wp/game-sequence-memory')),
  entry(spatialMemory, () => import('@wp/game-spatial-memory')),
  entry(connectFour, () => import('@wp/game-connect-four')),
  entry(ticTacToe, () => import('@wp/game-tic-tac-toe'))
];

export const findGame = (id: string): GameEntry | undefined => GAMES.find((g) => g.metadata.id === id);
