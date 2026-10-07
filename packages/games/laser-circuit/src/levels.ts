/**
 * The original Laser Paths level set.
 *
 * Levels were designed for this project with a seeded "build the solution first" generator (lasers,
 * fixed elements and the solution pieces are laid out, targets go where the light ends up and
 * forbidden sensors into the dark, then the solution pieces become the inventory) and curated by
 * hand for variety and a gentle progression. Boards are at most 7×7 so that 44 px squares fit a
 * 360 px phone.
 *
 * Format: one string per row, squares separated by spaces:
 *   `.` empty · `#` blocker · `/` `\` mirror · `S/` `S\` beam splitter · `X` forbidden sensor ·
 *   `^R` `>G` `vB` `<W` laser pointing up/right/down/left with its colour ·
 *   `FC` colour filter · `TM` target needing that colour.
 * Colour letters: R red, G green, B blue, Y yellow (R+G), M magenta (R+B), C cyan (G+B), W white.
 *
 * `solutions` is the number of essential solutions (sets of placed pieces, each of them reached by
 * light, that solve the level). The test suite recounts it with an independent brute-force
 * solver, so an unsolvable level or a wrong count fails the tests.
 */
// @ts-nocheck

export interface LevelSource {
  readonly rows: readonly string[];
  readonly inventory: { readonly mirror?: number; readonly splitter?: number; readonly blocker?: number };
  readonly solutions: number;
}

export const LEVELS = {
  /** 5×5, one laser, one or two pieces. */
  easy: [
    {
      rows: [
        '.  /  .  .  <R',
        '.  .  .  .  #',
        '.  .  .  .  .',
        'TR .  .  .  .',
        '.  .  .  .  .'
      ],
      inventory: { mirror: 1 },
      solutions: 1
    },
    {
      rows: [
        '.  .  .  .  .',
        '.  .  .  .  .',
        '.  .  .  .  .',
        '\\  .  .  .  <G',
        '#  .  TG #  .'
      ],
      inventory: { mirror: 1 },
      solutions: 1
    },
    {
      rows: [
        '.  .  .  .  .',
        '.  #  .  .  .',
        '>G .  .  .  .',
        '.  X  .  .  #',
        '.  .  TG .  .'
      ],
      inventory: { mirror: 1 },
      solutions: 1
    },
    {
      rows: [
        '.  .  .  #  .',
        '>G .  .  .  .',
        '.  .  .  .  .',
        '.  .  .  .  .',
        '.  .  .  .  TG'
      ],
      inventory: { splitter: 1 },
      solutions: 1
    },
    {
      rows: [
        '.  .  .  vG TG',
        '.  .  .  .  .',
        '.  .  .  #  .',
        '.  .  .  .  .',
        '.  .  .  /  .'
      ],
      inventory: { mirror: 2 },
      solutions: 1
    },
    {
      rows: [
        '.  .  vR .  TR',
        'X  .  \\  .  .',
        '.  .  .  TR .',
        '.  .  .  .  .',
        '.  .  .  .  .'
      ],
      inventory: { mirror: 1, splitter: 1 },
      solutions: 1
    },
    {
      rows: [
        '#  .  .  vB .',
        '.  .  .  .  .',
        '.  .  .  .  TB',
        'TB .  .  .  .',
        '.  .  .  .  .'
      ],
      inventory: { splitter: 2 },
      solutions: 1
    },
    {
      rows: [
        '.  .  .  .  .',
        '.  .  .  .  .',
        '.  .  .  .  .',
        'TR .  .  #  .',
        'X  TR ^R .  .'
      ],
      inventory: { mirror: 1, splitter: 1 },
      solutions: 1
    }
  ],
  /** 6×6: colour filters, white light, and blockers that keep light away from where it must not go. */
  medium: [
    {
      rows: [
        '\\  .  .  .  .  .',
        '.  .  .  .  .  .',
        'FR .  .  .  X  #',
        '.  .  TR .  .  .',
        '.  .  .  .  .  .',
        '^W X  .  .  .  .'
      ],
      inventory: { mirror: 2 },
      solutions: 1
    },
    {
      rows: [
        '.  .  FC .  .  .',
        'TY .  .  .  .  .',
        '.  .  .  TY .  .',
        '.  .  .  .  #  .',
        '.  .  FY X  .  .',
        '.  .  ^W .  .  .'
      ],
      inventory: { mirror: 1, splitter: 1 },
      solutions: 1
    },
    {
      rows: [
        '.  TW .  X  .  .',
        '.  .  .  .  .  .',
        '>W .  \\  .  .  #',
        '.  .  .  TW #  X',
        '.  .  #  /  .  .',
        '.  .  .  ^R .  .'
      ],
      inventory: { mirror: 1, splitter: 1 },
      solutions: 1
    },
    {
      rows: [
        '.  .  #  .  .  .',
        '.  .  \\  X  .  .',
        '#  .  .  #  .  .',
        '.  .  FC .  .  .',
        '.  .  .  .  .  .',
        'TR TR ^R .  .  .'
      ],
      inventory: { splitter: 3 },
      solutions: 1
    },
    {
      rows: [
        '.  .  .  #  .  \\',
        '.  X  .  TW .  /',
        '.  .  .  .  .  #',
        'X  .  .  .  .  .',
        '.  .  .  .  TG FC',
        '>W .  .  .  FC ^G'
      ],
      inventory: { mirror: 3 },
      solutions: 1
    },
    {
      rows: [
        '#  .  .  .  .  .',
        '>B .  .  .  /  .',
        '.  .  .  .  .  .',
        '.  .  X  .  .  .',
        '>R .  TB .  .  .',
        '.  .  .  .  .  #'
      ],
      inventory: { splitter: 2, blocker: 1 },
      solutions: 1
    },
    {
      rows: [
        '.  .  X  vB .  .',
        '.  .  .  .  .  #',
        '.  TB .  .  .  <W',
        '.  .  .  .  .  .',
        '.  .  .  .  .  .',
        '.  X  .  .  TB .'
      ],
      inventory: { splitter: 2, blocker: 1 },
      solutions: 1
    },
    {
      rows: [
        '.  .  .  .  .  .',
        '.  .  .  .  .  .',
        '.  .  .  .  .  TW',
        '.  .  .  S\\ #  .',
        '>W .  .  S/ X  .',
        '.  .  .  .  .  .'
      ],
      inventory: { splitter: 2, blocker: 1 },
      solutions: 1
    }
  ],
  /** 7×7: several lasers, colour mixing on targets, three or four pieces and exactly one solution. */
  hard: [
    {
      rows: [
        '.  TB .  .  .  X  .',
        '>B .  #  .  .  .  .',
        '.  .  TM .  X  .  .',
        '>W FM .  .  .  .  /',
        '.  .  X  .  .  .  .',
        '.  .  .  .  .  .  .',
        '.  #  ^R .  .  .  .'
      ],
      inventory: { mirror: 2, blocker: 1 },
      solutions: 1
    },
    {
      rows: [
        '.  .  .  .  .  .  <W',
        '.  .  .  .  .  .  .',
        '.  .  .  .  .  .  .',
        '.  .  .  /  FM .  <G',
        '#  .  .  TM .  .  .',
        'X  .  X  .  .  TM .',
        '.  .  X  .  TM .  .'
      ],
      inventory: { mirror: 1, splitter: 2 },
      solutions: 1
    },
    {
      rows: [
        '.  .  vB .  FY X  .',
        '.  #  .  .  .  .  .',
        '.  .  .  .  .  .  TR',
        '.  .  .  .  .  .  .',
        'TB .  .  .  .  .  .',
        '.  #  S/ .  .  #  .',
        '.  .  TM .  ^R .  X'
      ],
      inventory: { mirror: 1, splitter: 2 },
      solutions: 1
    },
    {
      rows: [
        '>B \\  .  vR .  TY .',
        '>G .  .  .  .  .  .',
        'TB .  .  .  .  X  .',
        '.  .  .  TY .  .  .',
        '.  .  .  .  .  .  .',
        '.  .  .  .  .  .  .',
        '#  .  .  .  .  .  .'
      ],
      inventory: { mirror: 2, splitter: 1 },
      solutions: 1
    },
    {
      rows: [
        '.  .  .  .  .  .  FB',
        '.  .  .  X  .  .  .',
        'TM .  .  /  .  .  /',
        '.  .  .  .  .  .  <G',
        '.  .  .  FM .  .  .',
        '.  .  .  .  .  .  X',
        '^R TM #  ^W .  X  .'
      ],
      inventory: { mirror: 2, splitter: 1 },
      solutions: 1
    },
    {
      rows: [
        '.  X  .  vB .  .  .',
        '.  .  .  .  .  S\\ <R',
        '>R .  .  .  \\  .  .',
        '.  .  .  .  .  .  .',
        '.  TM TR .  FM X  .',
        '.  .  .  .  .  X  .',
        '#  .  .  .  FR .  .'
      ],
      inventory: { mirror: 2, splitter: 1 },
      solutions: 1
    },
    {
      rows: [
        '>G .  .  FB .  .  .',
        'FR .  .  .  \\  .  .',
        '>B /  .  .  .  .  TC',
        '.  .  .  .  TC .  .',
        '.  .  TG .  .  X  .',
        '.  .  .  .  #  .  X',
        '.  .  .  .  ^B .  X'
      ],
      inventory: { mirror: 2, splitter: 2 },
      solutions: 1
    },
    {
      rows: [
        'X  .  TR vW .  .  .',
        '/  .  .  .  .  .  <R',
        '.  .  .  .  .  TW .',
        '.  .  .  .  .  .  .',
        '.  .  .  #  .  .  .',
        '.  .  .  .  X  .  .',
        'TW .  .  .  .  .  .'
      ],
      inventory: { splitter: 4 },
      solutions: 1
    }
  ]
} as const satisfies Readonly<Record<string, readonly LevelSource[]>>;
