import type { GameMetadata, GameModule } from '@wp/game-core';
import CATALOGUE from 'virtual:wp-catalogue';

export interface GameEntry {
  /**
   * Catalogue metadata bundled with the shell: everything from the game's metadata, but only the messages the
   * shell renders before the game is loaded (title, tagline, rules, difficulty labels; see catalogue-plugin.ts).
   * The complete metadata is `(await load()).metadata`.
   */
  metadata: GameMetadata;
  /** Lazily loads the game code, so each game is its own chunk and can be launched directly. */
  load: () => Promise<GameModule<unknown>>;
}

const entry = <S>(id: string, load: () => Promise<{ default: GameModule<S> }>): GameEntry => {
  const metadata = (CATALOGUE as Record<string, GameMetadata | undefined>)[id];
  if (!metadata) throw new Error(`Game "${id}" is missing from the catalogue (add @wp/game-${id} to apps/web/package.json).`);
  return { metadata, load: async () => (await load()).default as GameModule<unknown> };
};

/** Catalogue order = order of this list. Adding a game: one line here + a package under packages/games. */
export const GAMES: readonly GameEntry[] = [
  entry('mastermind', () => import('@wp/game-mastermind')),
  entry('black-box', () => import('@wp/game-black-box')),
  entry('rule-discovery', () => import('@wp/game-rule-discovery')),
  entry('graph-detective', () => import('@wp/game-graph-detective')),
  entry('logic-path', () => import('@wp/game-logic-path')),
  entry('systems-puzzle', () => import('@wp/game-systems-puzzle')),
  entry('debug-system', () => import('@wp/game-debug-system')),
  entry('constraint-grid', () => import('@wp/game-constraint-grid')),
  entry('minimal-proof', () => import('@wp/game-minimal-proof')),
  entry('nonogram', () => import('@wp/game-nonogram')),
  entry('skyscrapers', () => import('@wp/game-skyscrapers')),
  entry('bridges', () => import('@wp/game-bridges')),
  entry('minesweeper', () => import('@wp/game-minesweeper')),
  entry('lights-out', () => import('@wp/game-lights-out')),
  entry('sokoban', () => import('@wp/game-sokoban')),
  entry('sliding-blocks', () => import('@wp/game-sliding-blocks')),
  entry('river-crossing', () => import('@wp/game-river-crossing')),
  entry('laser-circuit', () => import('@wp/game-laser-circuit')),
  entry('circuit-puzzle', () => import('@wp/game-circuit-puzzle')),
  entry('memory', () => import('@wp/game-memory')),
  entry('review', () => import('@wp/game-review')),
  entry('sequence-memory', () => import('@wp/game-sequence-memory')),
  entry('spatial-memory', () => import('@wp/game-spatial-memory')),
  entry('signal-watch', () => import('@wp/game-signal-watch')),
  entry('distractor-control', () => import('@wp/game-distractor-control')),
  entry('connect-four', () => import('@wp/game-connect-four')),
  entry('tic-tac-toe', () => import('@wp/game-tic-tac-toe')),
  entry('node-conquest', () => import('@wp/game-node-conquest')),
  entry('relay-command', () => import('@wp/game-relay-command')),
  entry('slitherlink', () => import('@wp/game-slitherlink')),
  entry('chess', () => import('@wp/game-chess')),
  entry('word-guess', () => import('@wp/game-word-guess')),
  entry('stack-duel', () => import('@wp/game-stack-duel')),
  entry('n-back', () => import('@wp/game-n-back')),
  entry('visual-search', () => import('@wp/game-visual-search')),
  entry('prospective-memory', () => import('@wp/game-prospective-memory')),
  entry('association', () => import('@wp/game-association')),
  entry('ambiguity-detector', () => import('@wp/game-ambiguity-detector')),
  entry('audience-switch', () => import('@wp/game-audience-switch')),
  entry('deep-read', () => import('@wp/game-deep-read')),
  entry('faces-names', () => import('@wp/game-faces-names'))
];

export const findGame = (id: string): GameEntry | undefined => GAMES.find((g) => g.metadata.id === id);
