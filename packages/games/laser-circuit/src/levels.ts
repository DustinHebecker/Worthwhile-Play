/**
 * The Laser Paths level sets.
 *
 * Levels were designed for this project with a seeded "build the solution first" generator (lasers,
 * fixed elements and the solution pieces are laid out, targets go where the light ends up and
 * forbidden sensors into the dark, then the solution pieces become the inventory) and curated by
 * hand for variety and a gentle progression. Boards are at most 7 wide so that 44 px squares fit a
 * 360 px phone.
 *
 * The later medium levels (9–12) and the hard levels came from a second seeded generator in the
 * same spirit, with optical diodes and portals on the solution's light path and bigger
 * inventories. It makes the solution unique by adding forbidden sensors, optical diodes or extra
 * targets that only alternative solutions would violate (found with the exact solver in
 * `test/oracle.ts`). Each such level notes its generator seed, how many pieces it needs and how
 * many nodes the exact solver's search tree has (a rough measure of how much there is to try).
 *
 * The expert levels come from `test/generator.ts` (reproducible from the seed noted on each level):
 * the player also places colour filters, chromatic blockers, neutral-density filters and
 * polarisers, and targets may ask for an exact intensity or polarisation (see the optics model in
 * `rules.ts`).
 *
 * The sets were renamed one step up in state version 2 (old easy = `intro`, old medium = `easy`,
 * old hard = `medium`, old expert = `hard`); levels and their order are unchanged.
 *
 * Format: one string per row, squares separated by spaces:
 *   `.` empty · `#` blocker · `/` `\` mirror · `S/` `S\` beam splitter · `X` forbidden sensor ·
 *   `^R` `>G` `vB` `<W` laser pointing up/right/down/left with its colour ·
 *   `FC` colour filter · `-R` chromatic blocker absorbing that colour · `N` neutral-density filter ·
 *   `P0` `P45` `P90` `P135` polariser · `TM` target needing that colour, `TR4` … exactly ¼ of a
 *   laser's intensity, `TG:45` … only light polarised at 45°, `TW2:90` both ·
 *   `D^` `D>` `Dv` `D<` optical diode letting light through only in the arrow's direction ·
 *   `@1` `@2` `@3` portal (light entering one portal leaves the other one of the same number).
 * Colour letters: R red, G green, B blue, Y yellow (R+G), M magenta (R+B), C cyan (G+B), W white.
 *
 * `solutions` is the number of essential solutions (sets of placed pieces, each of them reached by
 * light, that solve the level). The test suite recounts it with an independent brute-force
 * solver, so an unsolvable level or a wrong count fails the tests.
 */
export interface LevelSource {
  readonly rows: readonly string[];
  readonly inventory: {
    readonly mirror?: number;
    readonly splitter?: number;
    readonly blocker?: number;
    readonly polariser?: number;
    readonly neutral?: number;
    readonly filterR?: number;
    readonly filterG?: number;
    readonly filterB?: number;
    readonly minusR?: number;
    readonly minusG?: number;
    readonly minusB?: number;
  };
  readonly solutions: number;
}

export const LEVELS = {
  /**
   * 5×5, one laser, one or two pieces. The original first level set ("easy" in state version 1): no
   * longer offered for new games, kept so that saves of these levels still load and play.
   */
  intro: [
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
  /** 6×6: colour filters, white light, and blockers that keep light away from where it must not go. ("medium" in state version 1.) */
  easy: [
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
  /** 7×7: several lasers, colour mixing on targets, three to six pieces and exactly one solution; levels 9–12 add optical diodes and portals. ("hard" in state version 1.) */
  medium: [
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
    },
    {
      // generator seed 111; 6 pieces; exact solver: 200583 search nodes
      rows: [
        '.  .  .  .  .  .  TB',
        '>R .  #  .  @1 .  .',
        '.  .  .  X  .  .  .',
        'TR .  .  .  #  @1 .',
        '>B .  .  D> .  .  TR',
        '.  .  .  .  .  D> .',
        '.  .  .  .  .  .  X'
      ],
      inventory: { mirror: 5, splitter: 1 },
      solutions: 1
    },
    {
      // generator seed 717; 6 pieces; exact solver: 257198 search nodes
      rows: [
        '.  .  .  .  .  .  .',
        '.  .  .  @1 D< .  .',
        'TW .  .  Dv .  .  .',
        '.  X  .  .  .  .  .',
        'X  .  D< .  D< .  <W',
        'TR @1 X  .  .  .  .',
        '.  #  TW .  .  ^R .'
      ],
      inventory: { mirror: 5, splitter: 1 },
      solutions: 1
    },
    {
      // generator seed 753; 6 pieces; exact solver: 280853 search nodes
      rows: [
        'TB TG .  vG .  .  .',
        '.  D^ .  .  .  .  TB',
        '.  .  .  .  .  D^ .',
        '.  .  X  .  .  .  .',
        '#  .  .  X  @1 .  .',
        '.  @1 .  .  .  .  .',
        '.  .  .  .  X  ^B .'
      ],
      inventory: { mirror: 5, splitter: 1 },
      solutions: 1
    },
    {
      // generator seed 1316; 5 pieces; exact solver: 439578 search nodes
      rows: [
        '#  .  vB .  .  TB .',
        '.  .  Dv @1 .  .  .',
        '.  .  .  .  .  X  .',
        '.  .  Dv .  @1 .  TR',
        '.  .  .  .  .  .  .',
        '.  .  .  .  .  Dv .',
        '.  .  .  ^R .  TR .'
      ],
      inventory: { mirror: 4, splitter: 1 },
      solutions: 1
    }
  ],
  /** 7×9 (wider would not fit a phone): seven or eight pieces, portals, optical diodes and exactly one solution. ("expert" in state version 1.) */
  hard: [
    {
      // generator seed 3040; 7 pieces; exact solver: 413466 search nodes
      rows: [
        '.  .  .  .  .  X  TG',
        '.  .  @1 X  .  X  .',
        '>G .  .  .  .  .  .',
        '.  X  .  Dv D^ .  TG',
        '.  #  .  TG D^ @1 .',
        '>G .  FY D> .  X  .',
        '.  X  Dv .  X  .  .',
        'TG .  .  .  X  .  .',
        'X  .  .  #  .  .  .'
      ],
      inventory: { mirror: 5, splitter: 2 },
      solutions: 1
    },
    {
      // generator seed 6183; 7 pieces; exact solver: 416663 search nodes
      rows: [
        '.  .  .  .  TW vR .',
        '#  .  X  .  TR Dv X',
        'X  D^ .  .  .  .  .',
        '.  .  .  .  X  .  .',
        '.  .  @1 .  FB .  .',
        'X  .  .  .  .  .  .',
        '#  D^ X  .  .  .  X',
        '.  .  .  X  .  @1 .',
        '.  .  ^W .  .  .  TW'
      ],
      inventory: { mirror: 6, splitter: 1 },
      solutions: 1
    },
    {
      // generator seed 4190; 8 pieces; exact solver: 424412 search nodes
      rows: [
        '.  .  .  .  .  vW .',
        '>B .  D> .  .  .  .',
        'TB .  .  FB X  .  X',
        '.  @1 .  Dv TB @1 TG',
        '.  Dv .  .  #  X  .',
        'TW .  .  X  .  .  D^',
        '.  X  .  #  X  .  .',
        '.  .  .  .  .  D^ .',
        '.  .  .  .  .  ^G .'
      ],
      inventory: { mirror: 7, splitter: 1 },
      solutions: 1
    },
    {
      // generator seed 3001; 7 pieces; exact solver: 516795 search nodes
      rows: [
        '.  vG .  .  .  vW .',
        '.  Dv FM .  X  .  X',
        'TG .  TW .  .  .  .',
        'TW .  .  #  X  .  X',
        '.  D^ .  .  TR .  .',
        'X  .  @1 .  #  .  X',
        '.  .  D< .  .  .  X',
        '.  @1 .  X  .  D> TW',
        '.  ^R .  .  .  .  .'
      ],
      inventory: { mirror: 5, splitter: 2 },
      solutions: 1
    },
    {
      // generator seed 6177; 7 pieces; exact solver: 882264 search nodes
      rows: [
        '.  .  TB .  .  X  .',
        '.  FC .  .  .  .  <B',
        '.  .  X  .  .  .  .',
        '.  D> .  .  D> D> .',
        '.  TW X  #  @1 .  .',
        '.  @1 .  X  X  D^ TW',
        '>W .  .  .  .  .  X',
        '.  .  X  .  .  .  .',
        '.  .  .  .  .  .  .'
      ],
      inventory: { mirror: 6, splitter: 1 },
      solutions: 1
    },
    {
      // generator seed 3053; 7 pieces; exact solver: 987840 search nodes
      rows: [
        '.  .  .  X  vG .  .',
        '.  .  .  .  .  .  .',
        '.  .  .  @1 Dv FC .',
        'X  .  .  .  .  TW .',
        'X  .  .  .  Dv .  <W',
        'TG .  @1 X  .  X  TG',
        '.  #  .  X  .  #  .',
        '.  .  Dv .  .  X  .',
        '.  .  TG .  .  .  .'
      ],
      inventory: { mirror: 5, splitter: 2 },
      solutions: 1
    },
    {
      // generator seed 5166; 7 pieces; exact solver: 1414628 search nodes
      rows: [
        'X  TB TB .  X  .  TR',
        '.  D^ FM X  @1 X  .',
        '>R .  .  D> .  X  .',
        '.  .  D^ X  #  X  .',
        '.  D^ .  .  X  .  .',
        'TB .  .  .  .  .  <B',
        '.  TR .  .  .  .  .',
        '.  @1 .  .  .  X  .',
        '.  .  ^R .  .  .  .'
      ],
      inventory: { mirror: 5, splitter: 2 },
      solutions: 1
    },
    {
      // generator seed 4120; 7 pieces; exact solver: 1727855 search nodes
      rows: [
        '.  .  .  .  TB .  .',
        '.  .  .  .  .  X  .',
        '.  .  .  X  TR .  .',
        '.  .  X  @1 .  .  .',
        '.  #  X  .  #  .  TM',
        '.  .  @1 .  .  D^ .',
        'X  D^ X  X  FB .  <R',
        '.  .  .  .  .  .  .',
        '.  ^R .  .  .  ^B #'
      ],
      inventory: { mirror: 5, splitter: 2 },
      solutions: 1
    }
  ],
  /** 7×9: placeable filters and polarisers, targets that need an exact intensity or polarisation. */
  expert: [
    {
      // generator seed 10283; 6 pieces; exact solver: 2054738 search nodes
      rows: [
        '.   .   .   .   TY2  X   TY2',
        '>W  D>  D>  .   .    .   .',
        '.   .   .   .   .    .   .',
        'X   .   .   .   .    .   .',
        'X   X   .   .   .    .   .',
        '.   .   .   .   .    .   .',
        '.   .   .   .   .    #   X',
        '.   D<  D<  D<  .    .   .',
        'TB  .   .   .   .    ^W  .'
      ],
      inventory: { mirror: 3, splitter: 1, filterB: 1, minusB: 1 },
      solutions: 1
    },
    {
      // generator seed 20194; 6 pieces; exact solver: 2240517 search nodes
      rows: [
        'X    .   .   .   .   .    .',
        'X    .   .   .   .   .    X',
        '.    .   .   .   .   .    .',
        '>C   .   .   .   .   TB4  X',
        'TC2  .   X   .   .   .    TB4',
        '.    Dv  .   .   .   .    .',
        '.    .   .   .   .   D^   .',
        'TG2  .   .   .   X   D^   .',
        '.    .   .   X   .   ^B   #'
      ],
      inventory: { mirror: 2, splitter: 2, neutral: 1, filterG: 1 },
      solutions: 1
    },
    {
      // generator seed 20101; 6 pieces; exact solver: 2327349 search nodes
      rows: [
        '.   .   .    X     X     .   .',
        '.   .   .    .     .     .   TB8',
        'X   X   #    .     .     .   .',
        '#   .   TM2  .     .     .   .',
        '.   .   .    .     .     .   .',
        '.   .   .    FM    .     .   .',
        '.   .   .    .     .     X   .',
        '.   .   .    .     .     X   .',
        '.   .   ^M   TM16  P135  .   .'
      ],
      inventory: { mirror: 2, splitter: 2, neutral: 1, minusR: 1 },
      solutions: 1
    },
    {
      // generator seed 20219; 6 pieces; exact solver: 2652305 search nodes
      rows: [
        '.   .      vW  X   .   .   X',
        '.   TW8:0  .   X   .   .   .',
        'D^  .      Dv  .   .   .   .',
        'D^  .      Dv  .   .   .   .',
        '.   TW4:0  .   .   X   .   X',
        'D^  #      Dv  .   .   .   X',
        '.   D<     .   .   .   .   #',
        'X   .      .   .   .   .   .',
        'X   #      .   .   .   .   .'
      ],
      inventory: { mirror: 3, splitter: 1, polariser: 1, neutral: 1 },
      solutions: 1
    },
    {
      // generator seed 10556; 7 pieces; exact solver: 2752990 search nodes
      rows: [
        '.    .   .    .   .    X   .',
        '.    .   .    .   .    X   .',
        '.    .   .    .   #    .   P45',
        '.    .   .    .   TR8  .   .',
        '.    D^  TM8  .   D<   .   <M',
        '.    .   D<   .   .    .   .',
        'TM2  .   .    .   .    X   .',
        'X    .   .    .   .    .   .',
        '.    .   X    .   .    .   .'
      ],
      inventory: { mirror: 3, splitter: 2, neutral: 1, filterR: 1 },
      solutions: 1
    },
    {
      // generator seed 130; 6 pieces; exact solver: 3439529 search nodes
      rows: [
        '.   .   .   .   X   .   .',
        '>M  D>  D>  .   .   .   X',
        '.   #   .   .   .   .   TR4:45',
        '.   .   .   .   Dv  X   .',
        '.   X   .   .   .   .   TR4:135',
        '.   .   .   .   .   .   .',
        '.   .   .   .   .   #   .',
        '.   .   .   .   .   .   .',
        '.   .   .   .   X   .   .'
      ],
      inventory: { mirror: 2, splitter: 1, polariser: 2, filterR: 1 },
      solutions: 1
    },
    {
      // generator seed 10011; 7 pieces; exact solver: 4700212 search nodes
      rows: [
        '.    .   .   .   .   .    .',
        '#    X   .   .   .   X    .',
        'TR4  .   .   .   .   X    .',
        '.    D>  D>  D>  D>  .    TR8:90',
        '.    .   D>  D>  D>  .    X',
        'D^   .   .   X   .   TR4  .',
        '.    D<  D<  D<  D<  .    <W',
        '.    .   .   .   .   .    .',
        '.    .   .   .   .   .    .'
      ],
      inventory: { mirror: 2, splitter: 2, polariser: 1, neutral: 1, filterR: 1 },
      solutions: 1
    },
    {
      // generator seed 20065; 6 pieces; exact solver: 7977191 search nodes
      rows: [
        'TW4  .    .   .   .   .   .',
        'D^   .    .   .   X   X   .',
        '.    .    .   .   .   .   <W',
        '.    X    .   .   .   .   .',
        '.    .    .   .   .   .   X',
        '.    X    .   .   .   .   .',
        '.    .    .   .   .   .   X',
        '.    X    .   .   D>  D>  TR4',
        '#    TW4  .   .   .   X   .'
      ],
      inventory: { mirror: 2, splitter: 2, neutral: 1, filterR: 1 },
      solutions: 1
    }
  ]
} as const satisfies Readonly<Record<string, readonly LevelSource[]>>;
