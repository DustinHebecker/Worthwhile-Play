/**
 * The original Crate Pusher level set (no level is taken from an existing collection).
 *
 * Rooms were drawn for this project and the starting positions chosen with the help of a
 * reverse ("pull") search from the solved position, then curated by hand. Every level is
 * at most 7 tiles wide so that the board fits a 360 px phone with 44 px tiles.
 *
 * Format: XSB-style glyphs, rows separated by `|`:
 *   `#` wall, ` ` floor, `.` goal, `$` crate, `*` crate on goal, `@` player, `+` player on goal.
 *
 * `minPushes` is the fewest pushes that solve the level. The test suite re-derives it with an
 * independent breadth-first solver, so a wrong value (or an unsolvable level) fails the tests.
 */
// @ts-nocheck

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
    { map: '#######|#.  @ #|#  $$ #|# # .##|###   #|  #####', minPushes: 12 }
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
    { map: '######|#.#  ##|#+$  .#|# $$  #|###   #|#     #|#######', minPushes: 17 }
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
    { map: ' ######|##... #|# #  .#|#   @ #|## $$##|#  #  #|# $$  #|##    #| ######', minPushes: 29 }
  ]
} as const satisfies Readonly<Record<string, readonly LevelSource[]>>;
