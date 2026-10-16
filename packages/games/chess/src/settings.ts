import { isOneOf, normalizeSeed, type NewGameOptions, type SettingSpec } from '@wp/game-core';
import { COLOR_CHOICES, DEFAULT_DIFFICULTY, DIFFICULTIES, MATE_LENGTHS, type GameOptions } from './rules';

/** What to play: the two ways to play a game, and the two puzzle modes. */
export const GAMES = ['computer', 'human', 'best', 'mate'] as const;
export type GameChoice = (typeof GAMES)[number];

/**
 * Start-screen settings (ADR 0017): what to play; against the computer the person's colour and its strength;
 * for "mate in N" the number of moves.
 */
export const settings: readonly SettingSpec[] = [
  { kind: 'choice', id: 'game', labelKey: 'menu.legend', valueKey: 'game', values: GAMES, default: 'computer' },
  { kind: 'choice', id: 'color', labelKey: 'yourColor', valueKey: 'color', values: COLOR_CHOICES, default: 'w', when: { game: ['computer'] } },
  { kind: 'difficulty', labelKey: 'strength', when: { game: ['computer'] } },
  { kind: 'choice', id: 'mateN', labelKey: 'mateN', valueKey: 'mate', values: MATE_LENGTHS, default: 1, when: { game: ['mate'] } }
];

/** Game options from untrusted start options (invalid or missing values fall back to the defaults). */
export function gameOptions(options: Pick<NewGameOptions, 'seed' | 'difficulty' | 'settings'>): GameOptions {
  const seed = normalizeSeed(options.seed);
  const chosen = options.settings ?? {};
  const game: GameChoice = isOneOf(chosen.game, GAMES) ? chosen.game : 'computer';
  const mateN = Number(chosen.mateN);
  return {
    seed,
    difficulty: isOneOf(options.difficulty, DIFFICULTIES) ? options.difficulty : DEFAULT_DIFFICULTY,
    opponent: game === 'human' ? 'human' : 'computer',
    humanColor: isOneOf(chosen.color, COLOR_CHOICES) ? chosen.color : 'w',
    mode: game === 'best' || game === 'mate' ? game : 'play',
    mateN: isOneOf(mateN, MATE_LENGTHS) ? mateN : 1,
    // In the puzzle modes the seed picks the puzzle.
    puzzle: seed
  };
}
