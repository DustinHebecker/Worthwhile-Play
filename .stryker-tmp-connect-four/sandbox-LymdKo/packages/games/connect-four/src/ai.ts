/**
 * Deterministic computer opponent: depth-limited negamax with alpha-beta pruning.
 *
 * The search works on a compact, mutable copy of the board (an Int8Array of 42 cells
 * plus column heights) and only checks the four directions through a newly dropped
 * disc for wins, so even the hard level stays well below a few hundred milliseconds
 * on a phone. Moves are tried centre-first, which makes alpha-beta prune well.
 *
 * Scores are from the point of view of the side to move:
 *  - a win available right now is worth WIN_SCORE + remaining depth (sooner is better,
 *    so losses that come later are preferred to losses that come sooner);
 *  - a full board without a line is 0;
 *  - at the depth limit, `evaluate` scores open lines (threes and twos that the
 *    opponent has not blocked) and discs in the centre column.
 *
 * All moves whose exact value equals the best value are collected and one of them is
 * picked with the seeded PRNG whose state lives in the game state, so every game is
 * reproducible from seed + actions while the computer does not always play the same
 * game.
 *
 * Difficulty semantics (plies searched; an immediate win is always seen one ply further):
 *  - easy:   2 — takes wins, blocks direct threats, otherwise plays positionally.
 *  - medium: 5 — also sees most short combinations.
 *  - hard:   8 — sees double threats several moves ahead.
 */
// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { createRngFromState, type Rng } from '@wp/game-core';
import { COLS, CONNECT, LINES, ROWS, applyMove, boardOf, computerPlayer, createRound, drop, isComputerTurn, other, outcomeOf, toMove, type Board, type ConnectFourState, type Difficulty, type Player, type RoundOptions } from './rules';
export const SEARCH_DEPTH: Readonly<Record<Difficulty, number>> = stryMutAct_9fa48("0") ? {} : (stryCov_9fa48("0"), {
  easy: 2,
  medium: 5,
  hard: 8
});

/** Value of a win that is available right now (plus the remaining depth). */
export const WIN_SCORE = 1_000_000;
const INFINITE = stryMutAct_9fa48("1") ? 4 / WIN_SCORE : (stryCov_9fa48("1"), 4 * WIN_SCORE);

/** Heuristic weights for `evaluate`. */
export const THREE_WEIGHT = 50;
export const TWO_WEIGHT = 5;
export const CENTRE_WEIGHT = 3;

/** Columns in the order they are searched: centre first, then outwards (left before right). */
export const MOVE_ORDER: readonly number[] = stryMutAct_9fa48("2") ? [] : (stryCov_9fa48("2"), [3, 2, 4, 1, 5, 0, 6]);
const CENTRE_COL = stryMutAct_9fa48("3") ? (COLS - 1) * 2 : (stryCov_9fa48("3"), (stryMutAct_9fa48("4") ? COLS + 1 : (stryCov_9fa48("4"), COLS - 1)) / 2);
const LINE_COUNT = LINES.length;
const LINE_CELLS = Int8Array.from(LINES.flat());

/** Ids of the lines through each cell (at most 13 per cell). */
const CELL_LINES: readonly Int8Array[] = Array.from(stryMutAct_9fa48("5") ? {} : (stryCov_9fa48("5"), {
  length: stryMutAct_9fa48("6") ? COLS / ROWS : (stryCov_9fa48("6"), COLS * ROWS)
}), stryMutAct_9fa48("7") ? () => undefined : (stryCov_9fa48("7"), (_, cell) => Int8Array.from(LINES.flatMap(stryMutAct_9fa48("8") ? () => undefined : (stryCov_9fa48("8"), (line, id) => line.includes(cell) ? stryMutAct_9fa48("9") ? [] : (stryCov_9fa48("9"), [id]) : stryMutAct_9fa48("10") ? ["Stryker was here"] : (stryCov_9fa48("10"), []))))));

/** Heuristic value of one window holding `mine` and `theirs` discs, for the owner of `mine`. */
function windowValue(mine: number, theirs: number): number {
  if (stryMutAct_9fa48("11")) {
    {}
  } else {
    stryCov_9fa48("11");
    if (stryMutAct_9fa48("14") ? theirs !== 0 : stryMutAct_9fa48("13") ? false : stryMutAct_9fa48("12") ? true : (stryCov_9fa48("12", "13", "14"), theirs === 0)) return (stryMutAct_9fa48("17") ? mine !== 3 : stryMutAct_9fa48("16") ? false : stryMutAct_9fa48("15") ? true : (stryCov_9fa48("15", "16", "17"), mine === 3)) ? THREE_WEIGHT : (stryMutAct_9fa48("20") ? mine !== 2 : stryMutAct_9fa48("19") ? false : stryMutAct_9fa48("18") ? true : (stryCov_9fa48("18", "19", "20"), mine === 2)) ? TWO_WEIGHT : 0;
    if (stryMutAct_9fa48("23") ? mine !== 0 : stryMutAct_9fa48("22") ? false : stryMutAct_9fa48("21") ? true : (stryCov_9fa48("21", "22", "23"), mine === 0)) return (stryMutAct_9fa48("26") ? theirs !== 3 : stryMutAct_9fa48("25") ? false : stryMutAct_9fa48("24") ? true : (stryCov_9fa48("24", "25", "26"), theirs === 3)) ? stryMutAct_9fa48("27") ? +THREE_WEIGHT : (stryCov_9fa48("27"), -THREE_WEIGHT) : (stryMutAct_9fa48("30") ? theirs !== 2 : stryMutAct_9fa48("29") ? false : stryMutAct_9fa48("28") ? true : (stryCov_9fa48("28", "29", "30"), theirs === 2)) ? stryMutAct_9fa48("31") ? +TWO_WEIGHT : (stryCov_9fa48("31"), -TWO_WEIGHT) : 0;
    return 0;
  }
}

/** WINDOW_VALUE[a * 5 + b]: value of a window with `a` discs of player 1 and `b` of player 2, for player 1. */
const WINDOW_VALUE = Int16Array.from(stryMutAct_9fa48("32") ? {} : (stryCov_9fa48("32"), {
  length: 25
}), stryMutAct_9fa48("33") ? () => undefined : (stryCov_9fa48("33"), (_, i) => windowValue(Math.floor(stryMutAct_9fa48("34") ? i * 5 : (stryCov_9fa48("34"), i / 5)), stryMutAct_9fa48("35") ? i * 5 : (stryCov_9fa48("35"), i % 5))));

/**
 * Static score of a position for `player` (positive = good for `player`).
 * Every window of four that holds discs of only one side counts: three discs with an
 * empty fourth cell weigh THREE_WEIGHT, two discs TWO_WEIGHT. Each disc in the centre
 * column adds CENTRE_WEIGHT. Symmetric: evaluate(b, 1) === -evaluate(b, 2).
 * (The search keeps the same score up to date incrementally.)
 */
export function evaluate(cells: ArrayLike<number>, player: Player): number {
  if (stryMutAct_9fa48("36")) {
    {}
  } else {
    stryCov_9fa48("36");
    let score = 0;
    for (let i = 0; stryMutAct_9fa48("39") ? i >= LINE_CELLS.length : stryMutAct_9fa48("38") ? i <= LINE_CELLS.length : stryMutAct_9fa48("37") ? false : (stryCov_9fa48("37", "38", "39"), i < LINE_CELLS.length); stryMutAct_9fa48("40") ? i -= CONNECT : (stryCov_9fa48("40"), i += CONNECT)) {
      if (stryMutAct_9fa48("41")) {
        {}
      } else {
        stryCov_9fa48("41");
        let mine = 0;
        let theirs = 0;
        for (let k = 0; stryMutAct_9fa48("44") ? k >= CONNECT : stryMutAct_9fa48("43") ? k <= CONNECT : stryMutAct_9fa48("42") ? false : (stryCov_9fa48("42", "43", "44"), k < CONNECT); stryMutAct_9fa48("45") ? k-- : (stryCov_9fa48("45"), k++)) {
          if (stryMutAct_9fa48("46")) {
            {}
          } else {
            stryCov_9fa48("46");
            const cell = cells[LINE_CELLS[i + k] as number];
            if (stryMutAct_9fa48("49") ? cell !== player : stryMutAct_9fa48("48") ? false : stryMutAct_9fa48("47") ? true : (stryCov_9fa48("47", "48", "49"), cell === player)) stryMutAct_9fa48("50") ? mine-- : (stryCov_9fa48("50"), mine++);else if (stryMutAct_9fa48("53") ? cell === 0 : stryMutAct_9fa48("52") ? false : stryMutAct_9fa48("51") ? true : (stryCov_9fa48("51", "52", "53"), cell !== 0)) stryMutAct_9fa48("54") ? theirs-- : (stryCov_9fa48("54"), theirs++);
          }
        }
        stryMutAct_9fa48("55") ? score -= windowValue(mine, theirs) : (stryCov_9fa48("55"), score += windowValue(mine, theirs));
      }
    }
    for (let row = 0; stryMutAct_9fa48("58") ? row >= ROWS : stryMutAct_9fa48("57") ? row <= ROWS : stryMutAct_9fa48("56") ? false : (stryCov_9fa48("56", "57", "58"), row < ROWS); stryMutAct_9fa48("59") ? row-- : (stryCov_9fa48("59"), row++)) {
      if (stryMutAct_9fa48("60")) {
        {}
      } else {
        stryCov_9fa48("60");
        const cell = cells[stryMutAct_9fa48("61") ? row * COLS - CENTRE_COL : (stryCov_9fa48("61"), (stryMutAct_9fa48("62") ? row / COLS : (stryCov_9fa48("62"), row * COLS)) + CENTRE_COL)];
        if (stryMutAct_9fa48("65") ? cell !== player : stryMutAct_9fa48("64") ? false : stryMutAct_9fa48("63") ? true : (stryCov_9fa48("63", "64", "65"), cell === player)) stryMutAct_9fa48("66") ? score -= CENTRE_WEIGHT : (stryCov_9fa48("66"), score += CENTRE_WEIGHT);else if (stryMutAct_9fa48("69") ? cell === 0 : stryMutAct_9fa48("68") ? false : stryMutAct_9fa48("67") ? true : (stryCov_9fa48("67", "68", "69"), cell !== 0)) stryMutAct_9fa48("70") ? score += CENTRE_WEIGHT : (stryCov_9fa48("70"), score -= CENTRE_WEIGHT);
      }
    }
    return score;
  }
}

/**
 * Mutable search position. Besides the cells it keeps, per line, how many discs each
 * player has in it, and the running `evaluate` score for player 1, so a win check costs
 * at most 13 lookups and a leaf evaluation is free.
 */
class Search {
  readonly cells: Int8Array;
  /** Discs per column. */
  readonly heights = new Int8Array(COLS);
  /** counts[(player - 1) * LINE_COUNT + line]: discs of `player` in `line`. */
  readonly counts = new Int8Array(stryMutAct_9fa48("71") ? 2 / LINE_COUNT : (stryCov_9fa48("71"), 2 * LINE_COUNT));
  /** `evaluate(cells, 1)`, maintained incrementally. */
  score = 0;
  nodes = 0;
  constructor(board: Board) {
    if (stryMutAct_9fa48("72")) {
      {}
    } else {
      stryCov_9fa48("72");
      this.cells = new Int8Array(stryMutAct_9fa48("73") ? COLS / ROWS : (stryCov_9fa48("73"), COLS * ROWS));
      for (let col = 0; stryMutAct_9fa48("76") ? col >= COLS : stryMutAct_9fa48("75") ? col <= COLS : stryMutAct_9fa48("74") ? false : (stryCov_9fa48("74", "75", "76"), col < COLS); stryMutAct_9fa48("77") ? col-- : (stryCov_9fa48("77"), col++)) {
        if (stryMutAct_9fa48("78")) {
          {}
        } else {
          stryCov_9fa48("78");
          for (let row = stryMutAct_9fa48("79") ? ROWS + 1 : (stryCov_9fa48("79"), ROWS - 1); stryMutAct_9fa48("81") ? row >= 0 || board[row * COLS + col] !== 0 : stryMutAct_9fa48("80") ? false : (stryCov_9fa48("80", "81"), (stryMutAct_9fa48("84") ? row < 0 : stryMutAct_9fa48("83") ? row > 0 : stryMutAct_9fa48("82") ? true : (stryCov_9fa48("82", "83", "84"), row >= 0)) && (stryMutAct_9fa48("86") ? board[row * COLS + col] === 0 : stryMutAct_9fa48("85") ? true : (stryCov_9fa48("85", "86"), board[stryMutAct_9fa48("87") ? row * COLS - col : (stryCov_9fa48("87"), (stryMutAct_9fa48("88") ? row / COLS : (stryCov_9fa48("88"), row * COLS)) + col)] !== 0))); stryMutAct_9fa48("89") ? row++ : (stryCov_9fa48("89"), row--)) if (stryMutAct_9fa48("90")) {
            ;
          } else {
            stryCov_9fa48("90");
            this.play(col, board[row * COLS + col] as Player);
          }
        }
      }
    }
  }

  /** Row the next disc in `col` lands in (-1 if full). */
  row(col: number): number {
    if (stryMutAct_9fa48("91")) {
      {}
    } else {
      stryCov_9fa48("91");
      return stryMutAct_9fa48("92") ? ROWS - 1 + (this.heights[col] as number) : (stryCov_9fa48("92"), (stryMutAct_9fa48("93") ? ROWS + 1 : (stryCov_9fa48("93"), ROWS - 1)) - (this.heights[col] as number));
    }
  }

  /** True if `player` would complete a line of four by dropping into `col`. */
  winsNow(col: number, player: Player): boolean {
    if (stryMutAct_9fa48("94")) {
      {}
    } else {
      stryCov_9fa48("94");
      const row = this.row(col);
      if (stryMutAct_9fa48("98") ? row >= 0 : stryMutAct_9fa48("97") ? row <= 0 : stryMutAct_9fa48("96") ? false : stryMutAct_9fa48("95") ? true : (stryCov_9fa48("95", "96", "97", "98"), row < 0)) return stryMutAct_9fa48("99") ? true : (stryCov_9fa48("99"), false);
      const offset = stryMutAct_9fa48("100") ? (player - 1) / LINE_COUNT : (stryCov_9fa48("100"), (stryMutAct_9fa48("101") ? player + 1 : (stryCov_9fa48("101"), player - 1)) * LINE_COUNT);
      for (const line of CELL_LINES[row * COLS + col] as Int8Array) if (stryMutAct_9fa48("104") ? this.counts[offset + line] !== CONNECT - 1 : stryMutAct_9fa48("103") ? false : stryMutAct_9fa48("102") ? true : (stryCov_9fa48("102", "103", "104"), this.counts[stryMutAct_9fa48("105") ? offset - line : (stryCov_9fa48("105"), offset + line)] === (stryMutAct_9fa48("106") ? CONNECT + 1 : (stryCov_9fa48("106"), CONNECT - 1)))) return stryMutAct_9fa48("107") ? false : (stryCov_9fa48("107"), true);
      return stryMutAct_9fa48("108") ? true : (stryCov_9fa48("108"), false);
    }
  }
  play(col: number, player: Player): void {
    if (stryMutAct_9fa48("109")) {
      {}
    } else {
      stryCov_9fa48("109");
      this.update(stryMutAct_9fa48("111") ? this.row(col) * COLS - col : (stryCov_9fa48("111"), (stryMutAct_9fa48("112") ? this.row(col) / COLS : (stryCov_9fa48("112"), this.row(col) * COLS)) + col), col, player, 1);
      this.heights[col] = stryMutAct_9fa48("113") ? (this.heights[col] as number) - 1 : (stryCov_9fa48("113"), (this.heights[col] as number) + 1);
    }
  }
  unplay(col: number): void {
    if (stryMutAct_9fa48("114")) {
      {}
    } else {
      stryCov_9fa48("114");
      this.heights[col] = stryMutAct_9fa48("115") ? (this.heights[col] as number) + 1 : (stryCov_9fa48("115"), (this.heights[col] as number) - 1);
      const cell = stryMutAct_9fa48("116") ? this.row(col) * COLS - col : (stryCov_9fa48("116"), (stryMutAct_9fa48("117") ? this.row(col) / COLS : (stryCov_9fa48("117"), this.row(col) * COLS)) + col);
      if (stryMutAct_9fa48("118")) {
        ;
      } else {
        stryCov_9fa48("118");
        this.update(cell, col, this.cells[cell] as Player, stryMutAct_9fa48("119") ? +1 : (stryCov_9fa48("119"), -1));
      }
    }
  }
  private update(cell: number, col: number, player: Player, delta: 1 | -1): void {
    if (stryMutAct_9fa48("120")) {
      {}
    } else {
      stryCov_9fa48("120");
      this.cells[cell] = (stryMutAct_9fa48("124") ? delta <= 0 : stryMutAct_9fa48("123") ? delta >= 0 : stryMutAct_9fa48("122") ? false : stryMutAct_9fa48("121") ? true : (stryCov_9fa48("121", "122", "123", "124"), delta > 0)) ? player : 0;
      const counts = this.counts;
      for (const line of CELL_LINES[cell] as Int8Array) {
        if (stryMutAct_9fa48("125")) {
          {}
        } else {
          stryCov_9fa48("125");
          const one = counts[line] as number;
          const two = counts[LINE_COUNT + line] as number;
          const before = WINDOW_VALUE[one * 5 + two] as number;
          if (stryMutAct_9fa48("128") ? player !== 1 : stryMutAct_9fa48("127") ? false : stryMutAct_9fa48("126") ? true : (stryCov_9fa48("126", "127", "128"), player === 1)) counts[line] = stryMutAct_9fa48("129") ? one - delta : (stryCov_9fa48("129"), one + delta);else counts[stryMutAct_9fa48("130") ? LINE_COUNT - line : (stryCov_9fa48("130"), LINE_COUNT + line)] = stryMutAct_9fa48("131") ? two - delta : (stryCov_9fa48("131"), two + delta);
          stryMutAct_9fa48("132") ? this.score -= (WINDOW_VALUE[(counts[line] as number) * 5 + (counts[LINE_COUNT + line] as number)] as number) - before : (stryCov_9fa48("132"), this.score += stryMutAct_9fa48("133") ? (WINDOW_VALUE[(counts[line] as number) * 5 + (counts[LINE_COUNT + line] as number)] as number) + before : (stryCov_9fa48("133"), (WINDOW_VALUE[(counts[line] as number) * 5 + (counts[LINE_COUNT + line] as number)] as number) - before));
        }
      }
      if (stryMutAct_9fa48("136") ? col !== CENTRE_COL : stryMutAct_9fa48("135") ? false : stryMutAct_9fa48("134") ? true : (stryCov_9fa48("134", "135", "136"), col === CENTRE_COL)) stryMutAct_9fa48("137") ? this.score -= (player === 1 ? CENTRE_WEIGHT : -CENTRE_WEIGHT) * delta : (stryCov_9fa48("137"), this.score += stryMutAct_9fa48("138") ? (player === 1 ? CENTRE_WEIGHT : -CENTRE_WEIGHT) / delta : (stryCov_9fa48("138"), ((stryMutAct_9fa48("141") ? player !== 1 : stryMutAct_9fa48("140") ? false : stryMutAct_9fa48("139") ? true : (stryCov_9fa48("139", "140", "141"), player === 1)) ? CENTRE_WEIGHT : stryMutAct_9fa48("142") ? +CENTRE_WEIGHT : (stryCov_9fa48("142"), -CENTRE_WEIGHT)) * delta));
    }
  }

  /** Negamax value for `player` to move; the previous move did not end the game. */
  negamax(depth: number, alpha: number, beta: number, player: Player): number {
    if (stryMutAct_9fa48("143")) {
      {}
    } else {
      stryCov_9fa48("143");
      stryMutAct_9fa48("144") ? this.nodes-- : (stryCov_9fa48("144"), this.nodes++);
      let canMove = stryMutAct_9fa48("145") ? true : (stryCov_9fa48("145"), false);
      for (const col of MOVE_ORDER) {
        if (stryMutAct_9fa48("146")) {
          {}
        } else {
          stryCov_9fa48("146");
          if (stryMutAct_9fa48("150") ? this.row(col) >= 0 : stryMutAct_9fa48("149") ? this.row(col) <= 0 : stryMutAct_9fa48("148") ? false : stryMutAct_9fa48("147") ? true : (stryCov_9fa48("147", "148", "149", "150"), this.row(col) < 0)) continue;
          canMove = stryMutAct_9fa48("151") ? false : (stryCov_9fa48("151"), true);
          if (stryMutAct_9fa48("153") ? false : stryMutAct_9fa48("152") ? true : (stryCov_9fa48("152", "153"), this.winsNow(col, player))) return stryMutAct_9fa48("154") ? WIN_SCORE - depth : (stryCov_9fa48("154"), WIN_SCORE + depth);
        }
      }
      if (stryMutAct_9fa48("157") ? false : stryMutAct_9fa48("156") ? true : stryMutAct_9fa48("155") ? canMove : (stryCov_9fa48("155", "156", "157"), !canMove)) return 0;
      if (stryMutAct_9fa48("160") ? depth !== 0 : stryMutAct_9fa48("159") ? false : stryMutAct_9fa48("158") ? true : (stryCov_9fa48("158", "159", "160"), depth === 0)) return (stryMutAct_9fa48("163") ? player !== 1 : stryMutAct_9fa48("162") ? false : stryMutAct_9fa48("161") ? true : (stryCov_9fa48("161", "162", "163"), player === 1)) ? this.score : stryMutAct_9fa48("164") ? +this.score : (stryCov_9fa48("164"), -this.score);
      const opponent = other(player);
      // Forced moves: any move that leaves an immediate win for the opponent scores the
      // minimum, -(WIN_SCORE + depth - 1). With one threat only the block can do better;
      // with two or more threats nothing can. Skipping the other moves keeps the value exact.
      let threat = stryMutAct_9fa48("165") ? +1 : (stryCov_9fa48("165"), -1);
      for (const col of MOVE_ORDER) {
        if (stryMutAct_9fa48("166")) {
          {}
        } else {
          stryCov_9fa48("166");
          if (stryMutAct_9fa48("169") ? this.row(col) < 0 && !this.winsNow(col, opponent) : stryMutAct_9fa48("168") ? false : stryMutAct_9fa48("167") ? true : (stryCov_9fa48("167", "168", "169"), (stryMutAct_9fa48("172") ? this.row(col) >= 0 : stryMutAct_9fa48("171") ? this.row(col) <= 0 : stryMutAct_9fa48("170") ? false : (stryCov_9fa48("170", "171", "172"), this.row(col) < 0)) || (stryMutAct_9fa48("173") ? this.winsNow(col, opponent) : (stryCov_9fa48("173"), !this.winsNow(col, opponent))))) continue;
          if (stryMutAct_9fa48("177") ? threat < 0 : stryMutAct_9fa48("176") ? threat > 0 : stryMutAct_9fa48("175") ? false : stryMutAct_9fa48("174") ? true : (stryCov_9fa48("174", "175", "176", "177"), threat >= 0)) return stryMutAct_9fa48("178") ? +(WIN_SCORE + depth - 1) : (stryCov_9fa48("178"), -(stryMutAct_9fa48("179") ? WIN_SCORE + depth + 1 : (stryCov_9fa48("179"), (stryMutAct_9fa48("180") ? WIN_SCORE - depth : (stryCov_9fa48("180"), WIN_SCORE + depth)) - 1)));
          threat = col;
        }
      }
      let best = stryMutAct_9fa48("181") ? +INFINITE : (stryCov_9fa48("181"), -INFINITE);
      for (const col of MOVE_ORDER) {
        if (stryMutAct_9fa48("182")) {
          {}
        } else {
          stryCov_9fa48("182");
          if (stryMutAct_9fa48("185") ? this.row(col) < 0 && threat >= 0 && col !== threat : stryMutAct_9fa48("184") ? false : stryMutAct_9fa48("183") ? true : (stryCov_9fa48("183", "184", "185"), (stryMutAct_9fa48("188") ? this.row(col) >= 0 : stryMutAct_9fa48("187") ? this.row(col) <= 0 : stryMutAct_9fa48("186") ? false : (stryCov_9fa48("186", "187", "188"), this.row(col) < 0)) || (stryMutAct_9fa48("190") ? threat >= 0 || col !== threat : stryMutAct_9fa48("189") ? false : (stryCov_9fa48("189", "190"), (stryMutAct_9fa48("193") ? threat < 0 : stryMutAct_9fa48("192") ? threat > 0 : stryMutAct_9fa48("191") ? true : (stryCov_9fa48("191", "192", "193"), threat >= 0)) && (stryMutAct_9fa48("195") ? col === threat : stryMutAct_9fa48("194") ? true : (stryCov_9fa48("194", "195"), col !== threat)))))) continue;
          if (stryMutAct_9fa48("196")) {
            ;
          } else {
            stryCov_9fa48("196");
            this.play(col, player);
          }
          const value = stryMutAct_9fa48("197") ? +this.negamax(depth - 1, -beta, -alpha, opponent) : (stryCov_9fa48("197"), -this.negamax(stryMutAct_9fa48("198") ? depth + 1 : (stryCov_9fa48("198"), depth - 1), stryMutAct_9fa48("199") ? +beta : (stryCov_9fa48("199"), -beta), stryMutAct_9fa48("200") ? +alpha : (stryCov_9fa48("200"), -alpha), opponent));
          if (stryMutAct_9fa48("201")) {
            ;
          } else {
            stryCov_9fa48("201");
            this.unplay(col);
          }
          if (stryMutAct_9fa48("205") ? value <= best : stryMutAct_9fa48("204") ? value >= best : stryMutAct_9fa48("203") ? false : stryMutAct_9fa48("202") ? true : (stryCov_9fa48("202", "203", "204", "205"), value > best)) best = value;
          if (stryMutAct_9fa48("209") ? best <= alpha : stryMutAct_9fa48("208") ? best >= alpha : stryMutAct_9fa48("207") ? false : stryMutAct_9fa48("206") ? true : (stryCov_9fa48("206", "207", "208", "209"), best > alpha)) alpha = best;
          if (stryMutAct_9fa48("213") ? alpha < beta : stryMutAct_9fa48("212") ? alpha > beta : stryMutAct_9fa48("211") ? false : stryMutAct_9fa48("210") ? true : (stryCov_9fa48("210", "211", "212", "213"), alpha >= beta)) break;
        }
      }
      return best;
    }
  }
}
export interface Analysis {
  /** All columns with the best value, ascending. */
  best: number[];
  /** The best value for the side to move. */
  value: number;
  /** Positions visited (for performance tests). */
  nodes: number;
}

/**
 * Searches `depth` plies (>= 1) for the side to move and returns every optimal column.
 * Each root move is searched with a window that still proves ties exactly.
 * Throws if the game is already over.
 */
export function analyse(board: Board, depth: number): Analysis {
  if (stryMutAct_9fa48("214")) {
    {}
  } else {
    stryCov_9fa48("214");
    if (stryMutAct_9fa48("217") ? outcomeOf(board).kind === 'playing' : stryMutAct_9fa48("216") ? false : stryMutAct_9fa48("215") ? true : (stryCov_9fa48("215", "216", "217"), outcomeOf(board).kind !== (stryMutAct_9fa48("218") ? "" : (stryCov_9fa48("218"), 'playing')))) throw new RangeError(stryMutAct_9fa48("220") ? "" : (stryCov_9fa48("220"), 'No move: the game is over'));
    if (stryMutAct_9fa48("223") ? !Number.isInteger(depth) && depth < 1 : stryMutAct_9fa48("222") ? false : stryMutAct_9fa48("221") ? true : (stryCov_9fa48("221", "222", "223"), (stryMutAct_9fa48("224") ? Number.isInteger(depth) : (stryCov_9fa48("224"), !Number.isInteger(depth))) || (stryMutAct_9fa48("227") ? depth >= 1 : stryMutAct_9fa48("226") ? depth <= 1 : stryMutAct_9fa48("225") ? false : (stryCov_9fa48("225", "226", "227"), depth < 1)))) throw new RangeError(stryMutAct_9fa48("229") ? "" : (stryCov_9fa48("229"), 'Depth must be a positive integer'));
    const search = new Search(board);
    const player = toMove(board);
    const legal = stryMutAct_9fa48("230") ? MOVE_ORDER : (stryCov_9fa48("230"), MOVE_ORDER.filter(stryMutAct_9fa48("231") ? () => undefined : (stryCov_9fa48("231"), col => stryMutAct_9fa48("235") ? search.row(col) < 0 : stryMutAct_9fa48("234") ? search.row(col) > 0 : stryMutAct_9fa48("233") ? false : stryMutAct_9fa48("232") ? true : (stryCov_9fa48("232", "233", "234", "235"), search.row(col) >= 0))));
    const wins = stryMutAct_9fa48("236") ? legal : (stryCov_9fa48("236"), legal.filter(stryMutAct_9fa48("237") ? () => undefined : (stryCov_9fa48("237"), col => search.winsNow(col, player))));
    if (stryMutAct_9fa48("241") ? wins.length <= 0 : stryMutAct_9fa48("240") ? wins.length >= 0 : stryMutAct_9fa48("239") ? false : stryMutAct_9fa48("238") ? true : (stryCov_9fa48("238", "239", "240", "241"), wins.length > 0)) return stryMutAct_9fa48("242") ? {} : (stryCov_9fa48("242"), {
      best: stryMutAct_9fa48("243") ? wins : (stryCov_9fa48("243"), wins.sort(stryMutAct_9fa48("244") ? () => undefined : (stryCov_9fa48("244"), (a, b) => stryMutAct_9fa48("245") ? a + b : (stryCov_9fa48("245"), a - b)))),
      value: stryMutAct_9fa48("246") ? WIN_SCORE - depth : (stryCov_9fa48("246"), WIN_SCORE + depth),
      nodes: 1
    });
    let bestValue = stryMutAct_9fa48("247") ? +INFINITE : (stryCov_9fa48("247"), -INFINITE);
    let best: number[] = stryMutAct_9fa48("248") ? ["Stryker was here"] : (stryCov_9fa48("248"), []);
    for (const col of legal) {
      if (stryMutAct_9fa48("249")) {
        {}
      } else {
        stryCov_9fa48("249");
        if (stryMutAct_9fa48("250")) {
          ;
        } else {
          stryCov_9fa48("250");
          search.play(col, player);
        } // Window (bestValue - 1, ∞): a result above bestValue - 1 is exact, so ties are found.
        const value = stryMutAct_9fa48("251") ? +search.negamax(depth - 1, -INFINITE, 1 - bestValue, other(player)) : (stryCov_9fa48("251"), -search.negamax(stryMutAct_9fa48("252") ? depth + 1 : (stryCov_9fa48("252"), depth - 1), stryMutAct_9fa48("253") ? +INFINITE : (stryCov_9fa48("253"), -INFINITE), stryMutAct_9fa48("254") ? 1 + bestValue : (stryCov_9fa48("254"), 1 - bestValue), other(player)));
        if (stryMutAct_9fa48("255")) {
          ;
        } else {
          stryCov_9fa48("255");
          search.unplay(col);
        }
        if (stryMutAct_9fa48("259") ? value <= bestValue : stryMutAct_9fa48("258") ? value >= bestValue : stryMutAct_9fa48("257") ? false : stryMutAct_9fa48("256") ? true : (stryCov_9fa48("256", "257", "258", "259"), value > bestValue)) {
          if (stryMutAct_9fa48("260")) {
            {}
          } else {
            stryCov_9fa48("260");
            bestValue = value;
            best = stryMutAct_9fa48("261") ? [] : (stryCov_9fa48("261"), [col]);
          }
        } else if (stryMutAct_9fa48("264") ? value !== bestValue : stryMutAct_9fa48("263") ? false : stryMutAct_9fa48("262") ? true : (stryCov_9fa48("262", "263", "264"), value === bestValue)) {
          if (stryMutAct_9fa48("265")) {
            {}
          } else {
            stryCov_9fa48("265");
            if (stryMutAct_9fa48("266")) {
              ;
            } else {
              stryCov_9fa48("266");
              best.push(col);
            }
          }
        }
      }
    }
    return stryMutAct_9fa48("267") ? {} : (stryCov_9fa48("267"), {
      best: stryMutAct_9fa48("268") ? best : (stryCov_9fa48("268"), best.sort(stryMutAct_9fa48("269") ? () => undefined : (stryCov_9fa48("269"), (a, b) => stryMutAct_9fa48("270") ? a + b : (stryCov_9fa48("270"), a - b)))),
      value: bestValue,
      nodes: stryMutAct_9fa48("271") ? search.nodes - 1 : (stryCov_9fa48("271"), search.nodes + 1)
    });
  }
}

/** Optimal columns for the side to move at the given difficulty. */
export function bestMoves(board: Board, difficulty: Difficulty): number[] {
  if (stryMutAct_9fa48("272")) {
    {}
  } else {
    stryCov_9fa48("272");
    return analyse(board, SEARCH_DEPTH[difficulty]).best;
  }
}

/** Chooses the computer's column for the side to move. Throws if the game is already over. */
export function chooseMove(board: Board, difficulty: Difficulty, rng: Rng): number {
  if (stryMutAct_9fa48("273")) {
    {}
  } else {
    stryCov_9fa48("273");
    return rng.pick(bestMoves(board, difficulty));
  }
}

/**
 * If it is the computer's turn, plays its move and advances the stored PRNG state.
 * Otherwise returns the state unchanged. After this, a game against the computer is
 * always either finished or waiting for the person — never "half a turn".
 */
export function computerReply(state: ConnectFourState): ConnectFourState {
  if (stryMutAct_9fa48("274")) {
    {}
  } else {
    stryCov_9fa48("274");
    if (stryMutAct_9fa48("277") ? false : stryMutAct_9fa48("276") ? true : stryMutAct_9fa48("275") ? isComputerTurn(state) : (stryCov_9fa48("275", "276", "277"), !isComputerTurn(state))) return state;
    const board = boardOf(state);
    const rng = createRngFromState(state.rng);
    const col = chooseMove(board, state.difficulty, rng);
    // Defensive: chooseMove only returns legal moves (property-tested); drop() throws otherwise.
    if (stryMutAct_9fa48("278")) {
      ;
    } else {
      stryCov_9fa48("278");
      drop(board, col, computerPlayer(state.starter));
    }
    return stryMutAct_9fa48("279") ? {} : (stryCov_9fa48("279"), {
      ...state,
      moves: stryMutAct_9fa48("280") ? [] : (stryCov_9fa48("280"), [...state.moves, col]),
      rng: rng.state()
    });
  }
}

/** Starts a fresh round from the seed, including the computer's opening move if it starts. */
export function startRound(options: RoundOptions): ConnectFourState {
  if (stryMutAct_9fa48("281")) {
    {}
  } else {
    stryCov_9fa48("281");
    return computerReply(createRound(options));
  }
}

/** The person's move followed by the computer's reply (if the opponent is the computer). */
export function playTurn(state: ConnectFourState, col: number): ConnectFourState {
  if (stryMutAct_9fa48("282")) {
    {}
  } else {
    stryCov_9fa48("282");
    if (stryMutAct_9fa48("284") ? false : stryMutAct_9fa48("283") ? true : (stryCov_9fa48("283", "284"), isComputerTurn(state))) throw new RangeError(stryMutAct_9fa48("286") ? "" : (stryCov_9fa48("286"), 'It is the computer’s turn'));
    return computerReply(applyMove(state, col));
  }
}