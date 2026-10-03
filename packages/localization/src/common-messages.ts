import type { LocalizedCatalogues } from './translate';

/**
 * Shared game vocabulary, available to every game translator under `common.*`.
 * Games add their own keys in their own namespace (metadata.messages).
 */
export const COMMON_MESSAGES = {
  en: {
    'common.newGame': 'New game',
    'common.restart': 'Restart',
    'common.undo': 'Undo',
    'common.hint': 'Hint',
    'common.check': 'Check',
    'common.difficulty': 'Difficulty',
    'common.moves': 'Moves',
    'common.yourTurn': 'Your turn',
    'common.opponentTurn': 'Opponent’s turn',
    'common.thinking': 'Thinking…',
    'common.opponent': 'Opponent',
    'common.opponent.human': 'Another person (same device)',
    'common.opponent.computer': 'Computer',
    'common.won': 'You won.',
    'common.lost': 'You lost.',
    'common.draw': 'Draw.',
    'common.solved': 'Solved.',
    'common.player': 'Player {n}',
    'common.paused': 'Paused'
  },
  de: {
    'common.newGame': 'Neues Spiel',
    'common.restart': 'Neu starten',
    'common.undo': 'Rückgängig',
    'common.hint': 'Hinweis',
    'common.check': 'Prüfen',
    'common.difficulty': 'Schwierigkeit',
    'common.moves': 'Züge',
    'common.yourTurn': 'Du bist am Zug',
    'common.opponentTurn': 'Gegner ist am Zug',
    'common.thinking': 'Denkt nach …',
    'common.opponent': 'Gegner',
    'common.opponent.human': 'Andere Person (gleiches Gerät)',
    'common.opponent.computer': 'Computer',
    'common.won': 'Du hast gewonnen.',
    'common.lost': 'Du hast verloren.',
    'common.draw': 'Unentschieden.',
    'common.solved': 'Gelöst.',
    'common.player': 'Spieler {n}',
    'common.paused': 'Pausiert'
  }
} as const satisfies LocalizedCatalogues;
