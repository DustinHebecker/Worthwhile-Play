// @ts-nocheck
import type { GameMetadata, GameModule } from '@wp/game-core';
import { metadata as mastermind } from '@wp/game-mastermind/metadata';
import { metadata as memory } from '@wp/game-memory/metadata';
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
  entry(memory, () => import('@wp/game-memory')),
  entry(ticTacToe, () => import('@wp/game-tic-tac-toe'))
];

export const findGame = (id: string): GameEntry | undefined => GAMES.find((g) => g.metadata.id === id);
