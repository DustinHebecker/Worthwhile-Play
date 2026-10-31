/**
 * The original Crate Pusher level set (no level is taken from an existing collection).
 *
 * The first 8 levels of easy, medium and hard were drawn for this project and their starting
 * positions chosen with the help of a reverse ("pull") search from the solved position, then
 * curated by hand. Everything after them (and all of expert) was made by the project's own
 * offline generator (`test/level-generator.ts`, never shipped): random rooms, an exhaustive pull
 * search for the deepest start, hill climbing for expert, then curation against near-duplicates.
 * New levels are only ever appended, so the level number stored in a save keeps its meaning.
 * Every level is at most 7 × 9 tiles so that the board fits a 360 px phone with 44 px tiles.
 *
 * Format: XSB-style glyphs, rows separated by `|`:
 *   `#` wall, ` ` floor, `.` goal, `$` crate, `*` crate on goal, `@` player, `+` player on goal.
 *
 * `minPushes` is the fewest pushes that solve the level. The test suite re-derives it with an
 * independent breadth-first solver, so a wrong value (or an unsolvable level) fails the tests.
 */
export interface LevelSource {
  readonly map: string;
  readonly minPushes: number;
}

export const LEVELS = {
  /** One or two crates in small rooms. */
  easy: [
    { map: '#######|#   # #|# # $@#|#  .# #|##    #| ######', minPushes: 2 },
    { map: ' #####| #   #|##   #|#+$ ##|##  #| ####', minPushes: 5 },
    { map: '#####|#.  ##|#    #|#@$  #|# #  #|######', minPushes: 5 },
    { map: '#######|#   # #|# #   #|#  #$ #|#. .$@#|#######', minPushes: 5 },
    { map: '######|#  ..#|#@$  #|## #$#|#    #|######', minPushes: 6 },
    { map: '#######|#.    #|### # #|  # $ #|  #$#.#|  #@  #|  #####', minPushes: 7 },
    { map: '#######|#   ..#|#  ## #|# $ $@#|##   ##| #####', minPushes: 11 },
    { map: '#######|#.  @ #|#  $$ #|# # .##|###   #|  #####', minPushes: 12 },
    // Generated (see test/level-generator.ts): 8 more, appended so saved level numbers stay valid.
    { map: '#######|#.    #|#    ##|#.    #|#@$ $ #|# ##  #|#######', minPushes: 12 },
    { map: '   ####|####@ #|# $ $ #|#     #|#.    #|#.    #|#######', minPushes: 13 },
    { map: '#######|# @## #|# $ $ #|#     #|#     #|##  ..#| ######', minPushes: 13 },
    { map: '####|#  ####|# $#  #|#. #  #|#   $@#|#.   ##|######', minPushes: 14 },
    { map: ' ######| # . .#|##$   #|#  #  #|#@$   #|#     #|#######', minPushes: 14 },
    { map: '#######|#.  @ #|#   $##|# #   #|#.#$  #|# #   #|#######', minPushes: 14 },
    { map: '#######|#  # .#|#.  # #|#  $# #|##$   #| #@   #| ######', minPushes: 15 },
    { map: '  #####|  # ..#|###   #|#     #|# $$ ##|# @# #|######', minPushes: 16 }
  ],
  /** Two or three crates; the order of pushes starts to matter. */
  medium: [
    { map: '######|#  @ ##|# $$#.#|# #   #|##    #|#    .#|#######', minPushes: 12 },
    { map: '#######|#   #.#|#   $@#|## #  #|#.  $##|#     #|#######', minPushes: 13 },
    { map: '  #####|  #   #| ##   #|## $ ##|#  #$ #|#. .@ #|#######', minPushes: 14 },
    { map: '#######|# #   #|#@$   #|# .#$##|#     #|# .   #|#######', minPushes: 15 },
    { map: '#######|# #@#.#|# $$  #|#   $ #|#  #  #|#. . ##|######', minPushes: 16 },
    { map: '#######|#  # @#|#   .$#|# $   #|# ##$.#|# .   #|#######', minPushes: 16 },
    { map: '#######|#. ##.#|# $$ .#|#@$ # #|##    #| ###  #|   ####', minPushes: 17 },
    { map: '######|#.#  ##|#+$  .#|# $$  #|###   #|#     #|#######', minPushes: 17 },
    // Generated (see test/level-generator.ts): 8 more, appended so saved level numbers stay valid.
    { map: '#######|# #   #|# $$  #|#@$   #|# ##  #|#.    #|#   ..#|#######', minPushes: 17 },
    { map: '#######|#.#. .#|#     #|#   # #|#  $  #|#  $$##|# # @#|######', minPushes: 18 },
    { map: '#######|#   ..#|#.    #|# ##  #|#@$   #|##$$  #|#     #|#######', minPushes: 19 },
    { map: '#####|#  @###|# $$$ #|###   #|#     #|#.   .#|#.    #|#######', minPushes: 20 },
    { map: '#######|#   # #|#$  $@#|# $##.#|#  #  #|#     #|#.  . #|#######', minPushes: 21 },
    { map: ' #####|##.. ##|#@$ $ #|# #  ##|##  $##|##    #|#.    #|#######', minPushes: 22 },
    { map: '  #####|###  @#|# ##$$#|#   $.#|#     #|#     #|#.. # #|#######', minPushes: 23 },
    { map: '#######|#. .  #|#    .#|#   $ #|# ##$ #|##@$  #| ###  #|   ####', minPushes: 24 }
  ],
  /** Three to five crates in larger rooms. */
  hard: [
    { map: ' ######|## @  #|#.$$###|# # $ #|#  .  #|#     #|#. #  #|#######', minPushes: 19 },
    { map: '#######|#   ..#|# ##  #|#     #|# $$ ##|#$ #  #|#+#   #|#######', minPushes: 19 },
    { map: '#######|#   ..#|# $#  #|#$ #  #|#+$$  #|## #  #|#  .  #|#######', minPushes: 22 },
    { map: '#######|#   # #|#  #. #|##  . #|# $ $ #|#  $# #|#  .$$#|#.  #+#|#######', minPushes: 23 },
    { map: '######|#   .##|#   # #|## $  #|## $$ #|# $# ##|# @...#|#######', minPushes: 25 },
    { map: '#######|#  .  #|##$ ###|#   $@#|#. $$ #|#.  $##|# .   #|#.#  ##|######', minPushes: 26 },
    { map: ' ######|##.   #|#  $. #|#.$@#.#|# $#  #|# $   #|#  # ##|######', minPushes: 28 },
    { map: ' ######|##... #|# #  .#|#   @ #|## $$##|#  #  #|# $$  #|##    #| ######', minPushes: 29 },
    // Generated (see test/level-generator.ts): 8 more, appended so saved level numbers stay valid.
    { map: '#######|#. .  #|#  #$##|#     #|#   $##|# .  ##|# $.$ #|#   $+#|#######', minPushes: 29 },
    { map: '#####|#.  ###|# . . #|#  #. #|##  $ #|# # $ #|# $$ $#|#    +#|#######', minPushes: 30 },
    { map: '######|#   .##|##$   #| #  . #| #  . #|##$   #|#  $#$#|# . $+#|#######', minPushes: 31 },
    { map: '######|#.   #|#  . #|# .$ #|#  #$##|#..#@ #|##$$$ #| #    #| ######', minPushes: 32 },
    { map: '#######|#   #+#|# $ $$#|### $ #|##  $ #|# .   #|# . # #|# ..  #|#######', minPushes: 32 },
    { map: '#######|#     #|##    #|# ## .#|#.  $##|#   $@#|# $#$ #|#.$. .#|#######', minPushes: 33 },
    { map: '#######|#+  ..#|#$$  ##|#.$#  #|#   $ #|#  $# #|# #  .#|#######', minPushes: 34 },
    { map: '#######|#. $. #|# $  $#|#.##. #|#@$   #|# $ # #|###  .#|  #####', minPushes: 35 }
  ],
  /** Four to six crates and the longest solutions: generated by hill climbing (see test/level-generator.ts). */
  expert: [
    { map: ' ######| #  ..#| # #  #|## . .#|# $#  #|# @ $ #|# $$ ##|##.$ #| #####', minPushes: 36 },
    { map: '######|#    ##|#  $$ #|# $  .#|# ##$ #|#.. $ #|#$#...#|#@##  #|#######', minPushes: 37 },
    { map: '#######|#@$.  #|##$$#.#|# .   #|# .$..#|# $ $ #|##  # #|#    ##|######', minPushes: 38 },
    { map: '#######|#... .#|#  #$##|#.$   #|#.$$  #|#$$  ##|#@#   #|#######', minPushes: 39 },
    { map: '  ####|### @##|#  $$ #|##   $#|#  $# #|# . # #|#. $# #|#..  .#|#######', minPushes: 40 },
    { map: '#######|#   $+#|#  $$ #|### $##|### $ #|# .   #|### . #| #  ..#| ######', minPushes: 41 },
    { map: '#######|#.  @ #|#.. $##|#.$$ #|##.# ##|#  $  #|#  $  #|# #   #|#######', minPushes: 41 },
    { map: '#######|#..+ .#|# #$$.#|# $  ##|##$ # #|# $   #|#.  $ #|# #   #|#######', minPushes: 42 },
    { map: '#######|#. .@.#|#$# $ #|# ## ##|#     #|# $   #|# $##.#|# $ .##|######', minPushes: 43 },
    { map: '######|#.#  ##|# # ..#|#.# .##|# #$  #|# $   #|#$$$$ #|#@#  .#|#######', minPushes: 44 },
    { map: ' #####| #.$ ##|## .$.#|#  $$ #|# .. .#|#  #  #|## $$##| ## @ #|  #####', minPushes: 45 },
    { map: '#######|# #.  #|#. . ##|#  $  #|##   ##|### $##|# $$$ #|#..@  #|#######', minPushes: 47 },
    { map: '#######|#   # #|#  $$ #|#.    #|#  # .#|# $##.#|#$$.$.#|#+  # #|#######', minPushes: 48 },
    { map: ' ######|##  $.#|#   $@#|#  #$ #|## # .#|#  #$ #|#  # .#|#   #.#|#######', minPushes: 61 }
  ]
} as const satisfies Readonly<Record<string, readonly LevelSource[]>>;
