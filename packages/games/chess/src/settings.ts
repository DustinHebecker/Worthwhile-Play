import { isOneOf, isRecord, normalizeSeed, type NewGameOptions, type SettingSpec, type SettingValue, type SettingsEnv } from '@wp/game-core';
import { COLOR_CHOICES, DEFAULT_DIFFICULTY, DIFFICULTIES, MATE_LENGTHS, colorChoiceOf, type ChessState, type GameOptions } from './rules';

/** What to play: the two ways to play a game, and the two puzzle modes. */
export const GAMES = ['computer', 'human', 'best', 'mate'] as const;
export type GameChoice = (typeof GAMES)[number];

/** The in-game menu choices older versions remembered (preference `menu`), used as start-screen defaults. */
export const OLD_MENU_PREFERENCE = 'menu';

/** What to play for an opponent and a mode (a state's, or the old menu's). */
const gameChoice = (opponent: unknown, mode: unknown): GameChoice => (mode === 'best' || mode === 'mate' ? mode : opponent === 'human' ? 'human' : 'computer');

/**
 * Start-screen settings (ADR 0017): what to play; against the computer the person's colour and its strength;
 * for "mate in N" the number of moves. Until the start screen remembers its own choices, the defaults follow what
 * older versions remembered from the in-game menu.
 */
export function chessSettings(env?: Pick<SettingsEnv, 'preferences'>): readonly SettingSpec[] {
  const old = env?.preferences?.get(OLD_MENU_PREFERENCE);
  const menu = isRecord(old) ? old : {};
  return [
    { kind: 'choice', id: 'game', labelKey: 'menu.legend', valueKey: 'game', values: GAMES, default: gameChoice(menu.opponent, menu.mode) },
    { kind: 'choice', id: 'color', labelKey: 'yourColor', valueKey: 'color', values: COLOR_CHOICES, default: isOneOf(menu.humanColor, COLOR_CHOICES) ? menu.humanColor : 'w', when: { game: ['computer'] } },
    { kind: 'difficulty', labelKey: 'strength', when: { game: ['computer'] } },
    { kind: 'choice', id: 'mateN', labelKey: 'mateN', valueKey: 'mate', values: MATE_LENGTHS, default: isOneOf(menu.mateN, MATE_LENGTHS) ? menu.mateN : 1, when: { game: ['mate'] } }
  ];
}

/** The start-screen settings a game was started with (for saves from before the host kept them). */
export function chessSettingsOf(state: ChessState): Record<string, SettingValue> {
  return { game: gameChoice(state.opponent, state.mode), color: colorChoiceOf(state), difficulty: state.difficulty, mateN: state.mateN };
}

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
