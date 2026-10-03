/**
 * Four in a Row rules: pure, DOM-free board logic and the serializable game state.
 *
 * The board has 7 columns and 6 rows, stored as 42 cells in row-major order with
 * row 0 at the TOP (index = row * COLS + col). Discs fall to the lowest free cell
 * of a column, i.e. to the largest free row number. Player 1 always moves first.
 *
 * The logical state stores the sequence of dropped columns rather than the board, so
 * undo is trivial and the board can never disagree with the history (or float).
 * How the computer chooses its moves lives in `ai.ts`.
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
import { isArrayOf, isInt, isOneOf, isRecord, isUint32 } from '@wp/game-core';
export type Player = 1 | 2;
export type Cell = 0 | Player;
export type Board = readonly Cell[];
export const COLS = 7;
export const ROWS = 6;
export const CELL_COUNT = stryMutAct_9fa48("287") ? COLS / ROWS : (stryCov_9fa48("287"), COLS * ROWS);
/** Discs needed in a line to win. */
export const CONNECT = 4;
export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = typeof DIFFICULTIES[number];
export const DEFAULT_DIFFICULTY: Difficulty = stryMutAct_9fa48("288") ? "" : (stryCov_9fa48("288"), 'easy');
export const OPPONENTS = ['computer', 'human'] as const;
export type Opponent = typeof OPPONENTS[number];

/** Who plays disc 1 (and therefore moves first) when playing against the computer. */
export const STARTERS = ['human', 'computer'] as const;
export type Starter = typeof STARTERS[number];
export type Line = readonly [number, number, number, number];
export const cellIndex = stryMutAct_9fa48("289") ? () => undefined : (stryCov_9fa48("289"), (() => {
  const cellIndex = (row: number, col: number): number => stryMutAct_9fa48("290") ? row * COLS - col : (stryCov_9fa48("290"), (stryMutAct_9fa48("291") ? row / COLS : (stryCov_9fa48("291"), row * COLS)) + col);
  return cellIndex;
})());
export const rowOf = stryMutAct_9fa48("292") ? () => undefined : (stryCov_9fa48("292"), (() => {
  const rowOf = (index: number): number => Math.floor(stryMutAct_9fa48("293") ? index * COLS : (stryCov_9fa48("293"), index / COLS));
  return rowOf;
})());
export const colOf = stryMutAct_9fa48("294") ? () => undefined : (stryCov_9fa48("294"), (() => {
  const colOf = (index: number): number => stryMutAct_9fa48("295") ? index * COLS : (stryCov_9fa48("295"), index % COLS);
  return colOf;
})());

/**
 * All 69 windows of four cells: 24 horizontal, 21 vertical, then 12 per diagonal
 * direction (down-right, then down-left). Each line lists its cells in walking order.
 */
export const LINES: readonly Line[] = (() => {
  if (stryMutAct_9fa48("296")) {
    {}
  } else {
    stryCov_9fa48("296");
    const lines: Line[] = stryMutAct_9fa48("297") ? ["Stryker was here"] : (stryCov_9fa48("297"), []);
    const directions: readonly (readonly [number, number])[] = stryMutAct_9fa48("298") ? [] : (stryCov_9fa48("298"), [stryMutAct_9fa48("299") ? [] : (stryCov_9fa48("299"), [0, 1]), stryMutAct_9fa48("300") ? [] : (stryCov_9fa48("300"), [1, 0]), stryMutAct_9fa48("301") ? [] : (stryCov_9fa48("301"), [1, 1]), stryMutAct_9fa48("302") ? [] : (stryCov_9fa48("302"), [1, stryMutAct_9fa48("303") ? +1 : (stryCov_9fa48("303"), -1)])]);
    for (const [dr, dc] of directions) {
      if (stryMutAct_9fa48("304")) {
        {}
      } else {
        stryCov_9fa48("304");
        for (let row = 0; stryMutAct_9fa48("307") ? row >= ROWS : stryMutAct_9fa48("306") ? row <= ROWS : stryMutAct_9fa48("305") ? false : (stryCov_9fa48("305", "306", "307"), row < ROWS); stryMutAct_9fa48("308") ? row-- : (stryCov_9fa48("308"), row++)) {
          if (stryMutAct_9fa48("309")) {
            {}
          } else {
            stryCov_9fa48("309");
            for (let col = 0; stryMutAct_9fa48("312") ? col >= COLS : stryMutAct_9fa48("311") ? col <= COLS : stryMutAct_9fa48("310") ? false : (stryCov_9fa48("310", "311", "312"), col < COLS); stryMutAct_9fa48("313") ? col-- : (stryCov_9fa48("313"), col++)) {
              if (stryMutAct_9fa48("314")) {
                {}
              } else {
                stryCov_9fa48("314");
                const endRow = stryMutAct_9fa48("315") ? row - dr * (CONNECT - 1) : (stryCov_9fa48("315"), row + (stryMutAct_9fa48("316") ? dr / (CONNECT - 1) : (stryCov_9fa48("316"), dr * (stryMutAct_9fa48("317") ? CONNECT + 1 : (stryCov_9fa48("317"), CONNECT - 1)))));
                const endCol = stryMutAct_9fa48("318") ? col - dc * (CONNECT - 1) : (stryCov_9fa48("318"), col + (stryMutAct_9fa48("319") ? dc / (CONNECT - 1) : (stryCov_9fa48("319"), dc * (stryMutAct_9fa48("320") ? CONNECT + 1 : (stryCov_9fa48("320"), CONNECT - 1)))));
                if (stryMutAct_9fa48("323") ? (endRow >= ROWS || endCol < 0) && endCol >= COLS : stryMutAct_9fa48("322") ? false : stryMutAct_9fa48("321") ? true : (stryCov_9fa48("321", "322", "323"), (stryMutAct_9fa48("325") ? endRow >= ROWS && endCol < 0 : stryMutAct_9fa48("324") ? false : (stryCov_9fa48("324", "325"), (stryMutAct_9fa48("328") ? endRow < ROWS : stryMutAct_9fa48("327") ? endRow > ROWS : stryMutAct_9fa48("326") ? false : (stryCov_9fa48("326", "327", "328"), endRow >= ROWS)) || (stryMutAct_9fa48("331") ? endCol >= 0 : stryMutAct_9fa48("330") ? endCol <= 0 : stryMutAct_9fa48("329") ? false : (stryCov_9fa48("329", "330", "331"), endCol < 0)))) || (stryMutAct_9fa48("334") ? endCol < COLS : stryMutAct_9fa48("333") ? endCol > COLS : stryMutAct_9fa48("332") ? false : (stryCov_9fa48("332", "333", "334"), endCol >= COLS)))) continue;
                if (stryMutAct_9fa48("335")) {
                  ;
                } else {
                  stryCov_9fa48("335");
                  lines.push([0, 1, 2, 3].map(k => cellIndex(row + dr * k, col + dc * k)) as unknown as Line);
                }
              }
            }
          }
        }
      }
    }
    return lines;
  }
})();
export function emptyBoard(): Cell[] {
  if (stryMutAct_9fa48("336")) {
    {}
  } else {
    stryCov_9fa48("336");
    return Array.from(stryMutAct_9fa48("337") ? {} : (stryCov_9fa48("337"), {
      length: CELL_COUNT
    }), stryMutAct_9fa48("338") ? () => undefined : (stryCov_9fa48("338"), () => 0 as Cell));
  }
}
export const other = stryMutAct_9fa48("339") ? () => undefined : (stryCov_9fa48("339"), (() => {
  const other = (player: Player): Player => (stryMutAct_9fa48("342") ? player !== 1 : stryMutAct_9fa48("341") ? false : stryMutAct_9fa48("340") ? true : (stryCov_9fa48("340", "341", "342"), player === 1)) ? 2 : 1;
  return other;
})());

/** Player of the n-th move (0-based): player 1 moves first, then the players alternate. */
export const playerOfMove = stryMutAct_9fa48("343") ? () => undefined : (stryCov_9fa48("343"), (() => {
  const playerOfMove = (moveIndex: number): Player => (stryMutAct_9fa48("346") ? moveIndex % 2 !== 0 : stryMutAct_9fa48("345") ? false : stryMutAct_9fa48("344") ? true : (stryCov_9fa48("344", "345", "346"), (stryMutAct_9fa48("347") ? moveIndex * 2 : (stryCov_9fa48("347"), moveIndex % 2)) === 0)) ? 1 : 2;
  return playerOfMove;
})());
export function countDiscs(board: Board): {
  1: number;
  2: number;
} {
  if (stryMutAct_9fa48("348")) {
    {}
  } else {
    stryCov_9fa48("348");
    let one = 0;
    let two = 0;
    for (const cell of board) {
      if (stryMutAct_9fa48("349")) {
        {}
      } else {
        stryCov_9fa48("349");
        if (stryMutAct_9fa48("352") ? cell !== 1 : stryMutAct_9fa48("351") ? false : stryMutAct_9fa48("350") ? true : (stryCov_9fa48("350", "351", "352"), cell === 1)) stryMutAct_9fa48("353") ? one-- : (stryCov_9fa48("353"), one++);else if (stryMutAct_9fa48("356") ? cell !== 2 : stryMutAct_9fa48("355") ? false : stryMutAct_9fa48("354") ? true : (stryCov_9fa48("354", "355", "356"), cell === 2)) stryMutAct_9fa48("357") ? two-- : (stryCov_9fa48("357"), two++);
      }
    }
    return stryMutAct_9fa48("358") ? {} : (stryCov_9fa48("358"), {
      1: one,
      2: two
    });
  }
}

/** Side to move on a board reached by legal play. */
export function toMove(board: Board): Player {
  if (stryMutAct_9fa48("359")) {
    {}
  } else {
    stryCov_9fa48("359");
    const counts = countDiscs(board);
    return (stryMutAct_9fa48("362") ? counts[1] !== counts[2] : stryMutAct_9fa48("361") ? false : stryMutAct_9fa48("360") ? true : (stryCov_9fa48("360", "361", "362"), counts[1] === counts[2])) ? 1 : 2;
  }
}

/** Row a disc dropped into `col` lands in, or -1 if the column is full or does not exist. */
export function dropRow(board: Board, col: number): number {
  if (stryMutAct_9fa48("363")) {
    {}
  } else {
    stryCov_9fa48("363");
    if (stryMutAct_9fa48("366") ? (!Number.isInteger(col) || col < 0) && col >= COLS : stryMutAct_9fa48("365") ? false : stryMutAct_9fa48("364") ? true : (stryCov_9fa48("364", "365", "366"), (stryMutAct_9fa48("368") ? !Number.isInteger(col) && col < 0 : stryMutAct_9fa48("367") ? false : (stryCov_9fa48("367", "368"), (stryMutAct_9fa48("369") ? Number.isInteger(col) : (stryCov_9fa48("369"), !Number.isInteger(col))) || (stryMutAct_9fa48("372") ? col >= 0 : stryMutAct_9fa48("371") ? col <= 0 : stryMutAct_9fa48("370") ? false : (stryCov_9fa48("370", "371", "372"), col < 0)))) || (stryMutAct_9fa48("375") ? col < COLS : stryMutAct_9fa48("374") ? col > COLS : stryMutAct_9fa48("373") ? false : (stryCov_9fa48("373", "374", "375"), col >= COLS)))) return stryMutAct_9fa48("376") ? +1 : (stryCov_9fa48("376"), -1);
    for (let row = stryMutAct_9fa48("377") ? ROWS + 1 : (stryCov_9fa48("377"), ROWS - 1); stryMutAct_9fa48("380") ? row < 0 : stryMutAct_9fa48("379") ? row > 0 : stryMutAct_9fa48("378") ? false : (stryCov_9fa48("378", "379", "380"), row >= 0); stryMutAct_9fa48("381") ? row++ : (stryCov_9fa48("381"), row--)) if (stryMutAct_9fa48("384") ? board[cellIndex(row, col)] !== 0 : stryMutAct_9fa48("383") ? false : stryMutAct_9fa48("382") ? true : (stryCov_9fa48("382", "383", "384"), board[cellIndex(row, col)] === 0)) return row;
    return stryMutAct_9fa48("385") ? +1 : (stryCov_9fa48("385"), -1);
  }
}
export function isLegalMove(board: Board, col: number): boolean {
  if (stryMutAct_9fa48("386")) {
    {}
  } else {
    stryCov_9fa48("386");
    return stryMutAct_9fa48("390") ? dropRow(board, col) < 0 : stryMutAct_9fa48("389") ? dropRow(board, col) > 0 : stryMutAct_9fa48("388") ? false : stryMutAct_9fa48("387") ? true : (stryCov_9fa48("387", "388", "389", "390"), dropRow(board, col) >= 0);
  }
}

/** Columns that still have room, ascending. */
export function legalMoves(board: Board): number[] {
  if (stryMutAct_9fa48("391")) {
    {}
  } else {
    stryCov_9fa48("391");
    const moves: number[] = stryMutAct_9fa48("392") ? ["Stryker was here"] : (stryCov_9fa48("392"), []);
    for (let col = 0; stryMutAct_9fa48("395") ? col >= COLS : stryMutAct_9fa48("394") ? col <= COLS : stryMutAct_9fa48("393") ? false : (stryCov_9fa48("393", "394", "395"), col < COLS); stryMutAct_9fa48("396") ? col-- : (stryCov_9fa48("396"), col++)) if (stryMutAct_9fa48("399") ? board[col] !== 0 : stryMutAct_9fa48("398") ? false : stryMutAct_9fa48("397") ? true : (stryCov_9fa48("397", "398", "399"), board[col] === 0)) if (stryMutAct_9fa48("400")) {
      ;
    } else {
      stryCov_9fa48("400");
      moves.push(col);
    }
    return moves;
  }
}

/** Returns a new board with `player`'s disc dropped into `col`. Throws on an illegal move. */
export function drop(board: Board, col: number, player: Player): Cell[] {
  if (stryMutAct_9fa48("401")) {
    {}
  } else {
    stryCov_9fa48("401");
    const row = dropRow(board, col);
    if (stryMutAct_9fa48("405") ? row >= 0 : stryMutAct_9fa48("404") ? row <= 0 : stryMutAct_9fa48("403") ? false : stryMutAct_9fa48("402") ? true : (stryCov_9fa48("402", "403", "404", "405"), row < 0)) throw new RangeError(stryMutAct_9fa48("407") ? `` : (stryCov_9fa48("407"), `Illegal move ${col}`));
    const next = stryMutAct_9fa48("408") ? [] : (stryCov_9fa48("408"), [...board]);
    next[cellIndex(row, col)] = player;
    return next;
  }
}

/** Every line of four fully occupied by one player, in `LINES` order. */
export function fours(board: Board): {
  player: Player;
  line: Line;
}[] {
  if (stryMutAct_9fa48("409")) {
    {}
  } else {
    stryCov_9fa48("409");
    const found: {
      player: Player;
      line: Line;
    }[] = stryMutAct_9fa48("410") ? ["Stryker was here"] : (stryCov_9fa48("410"), []);
    for (const line of LINES) {
      if (stryMutAct_9fa48("411")) {
        {}
      } else {
        stryCov_9fa48("411");
        const [a, b, c, d] = line;
        const owner = board[a];
        if (stryMutAct_9fa48("414") ? owner && owner === board[b] && owner === board[c] || owner === board[d] : stryMutAct_9fa48("413") ? false : stryMutAct_9fa48("412") ? true : (stryCov_9fa48("412", "413", "414"), (stryMutAct_9fa48("416") ? owner && owner === board[b] || owner === board[c] : stryMutAct_9fa48("415") ? true : (stryCov_9fa48("415", "416"), (stryMutAct_9fa48("418") ? owner || owner === board[b] : stryMutAct_9fa48("417") ? true : (stryCov_9fa48("417", "418"), owner && (stryMutAct_9fa48("420") ? owner !== board[b] : stryMutAct_9fa48("419") ? true : (stryCov_9fa48("419", "420"), owner === board[b])))) && (stryMutAct_9fa48("422") ? owner !== board[c] : stryMutAct_9fa48("421") ? true : (stryCov_9fa48("421", "422"), owner === board[c])))) && (stryMutAct_9fa48("424") ? owner !== board[d] : stryMutAct_9fa48("423") ? true : (stryCov_9fa48("423", "424"), owner === board[d])))) found.push(stryMutAct_9fa48("426") ? {} : (stryCov_9fa48("426"), {
          player: owner,
          line
        }));
      }
    }
    return found;
  }
}
export interface Win {
  player: Player;
  /** All cells belonging to any of the winner's lines of four, ascending. */
  cells: number[];
}

/**
 * The winner and all cells of their completed lines, or `null`. On boards reached by
 * legal play at most one player can have a line; otherwise the owner of the first line
 * in `LINES` order is reported.
 */
export function findWin(board: Board): Win | null {
  if (stryMutAct_9fa48("427")) {
    {}
  } else {
    stryCov_9fa48("427");
    const all = fours(board);
    const first = all[0];
    if (stryMutAct_9fa48("430") ? false : stryMutAct_9fa48("429") ? true : stryMutAct_9fa48("428") ? first : (stryCov_9fa48("428", "429", "430"), !first)) return null;
    const cells = new Set<number>();
    for (const {
      player,
      line
    } of all) if (stryMutAct_9fa48("433") ? player !== first.player : stryMutAct_9fa48("432") ? false : stryMutAct_9fa48("431") ? true : (stryCov_9fa48("431", "432", "433"), player === first.player)) for (const i of line) if (stryMutAct_9fa48("434")) {
      ;
    } else {
      stryCov_9fa48("434");
      cells.add(i);
    }
    return stryMutAct_9fa48("435") ? {} : (stryCov_9fa48("435"), {
      player: first.player,
      cells: stryMutAct_9fa48("436") ? [...cells] : (stryCov_9fa48("436"), (stryMutAct_9fa48("437") ? [] : (stryCov_9fa48("437"), [...cells])).sort(stryMutAct_9fa48("438") ? () => undefined : (stryCov_9fa48("438"), (x, y) => stryMutAct_9fa48("439") ? x + y : (stryCov_9fa48("439"), x - y))))
    });
  }
}
export type Outcome = {
  kind: 'playing';
} | {
  kind: 'won';
  win: Win;
} | {
  kind: 'draw';
};
export function outcomeOf(board: Board): Outcome {
  if (stryMutAct_9fa48("440")) {
    {}
  } else {
    stryCov_9fa48("440");
    const win = findWin(board);
    if (stryMutAct_9fa48("442") ? false : stryMutAct_9fa48("441") ? true : (stryCov_9fa48("441", "442"), win)) return stryMutAct_9fa48("443") ? {} : (stryCov_9fa48("443"), {
      kind: stryMutAct_9fa48("444") ? "" : (stryCov_9fa48("444"), 'won'),
      win
    });
    return (stryMutAct_9fa48("447") ? legalMoves(board).length !== 0 : stryMutAct_9fa48("446") ? false : stryMutAct_9fa48("445") ? true : (stryCov_9fa48("445", "446", "447"), legalMoves(board).length === 0)) ? stryMutAct_9fa48("448") ? {} : (stryCov_9fa48("448"), {
      kind: stryMutAct_9fa48("449") ? "" : (stryCov_9fa48("449"), 'draw')
    }) : stryMutAct_9fa48("450") ? {} : (stryCov_9fa48("450"), {
      kind: stryMutAct_9fa48("451") ? "" : (stryCov_9fa48("451"), 'playing')
    });
  }
}

/** Replays a list of dropped columns. Throws if a column overflows. */
export function boardFromMoves(moves: readonly number[]): Cell[] {
  if (stryMutAct_9fa48("452")) {
    {}
  } else {
    stryCov_9fa48("452");
    let board = emptyBoard();
    moves.forEach((col, n) => {
      if (stryMutAct_9fa48("454")) {
        {}
      } else {
        stryCov_9fa48("454");
        board = drop(board, col, playerOfMove(n));
      }
    });
    return board;
  }
}

/* ------------------------------------------------------------------------ */
/* Game state                                                                 */
/* ------------------------------------------------------------------------ */

/** Serialized logical state. Plain JSON. */
export interface ConnectFourState {
  /** Seed of the current game (uint32). A fresh round restarts the PRNG from it. */
  seed: number;
  /** Computer strength. Kept in human-vs-human mode so switching back restores it. */
  difficulty: Difficulty;
  opponent: Opponent;
  /** Who plays disc 1 and moves first against the computer. Ignored in human-vs-human mode. */
  starter: Starter;
  /** Columns in the order discs were dropped; move n belongs to `playerOfMove(n)`. */
  moves: number[];
  /** PRNG state for the computer's tie-breaking (uint32). */
  rng: number;
}
export interface RoundOptions {
  seed: number;
  difficulty: Difficulty;
  opponent: Opponent;
  starter: Starter;
}

/** An empty board for the given options. The computer's opening move (if any) is added by `ai.ts`. */
export function createRound({
  seed,
  difficulty,
  opponent,
  starter
}: RoundOptions): ConnectFourState {
  if (stryMutAct_9fa48("455")) {
    {}
  } else {
    stryCov_9fa48("455");
    return stryMutAct_9fa48("456") ? {} : (stryCov_9fa48("456"), {
      seed,
      difficulty,
      opponent,
      starter,
      moves: stryMutAct_9fa48("457") ? ["Stryker was here"] : (stryCov_9fa48("457"), []),
      rng: seed
    });
  }
}

/** Player number of the person at the device in a game against the computer. */
export const humanPlayer = stryMutAct_9fa48("458") ? () => undefined : (stryCov_9fa48("458"), (() => {
  const humanPlayer = (starter: Starter): Player => (stryMutAct_9fa48("461") ? starter !== 'human' : stryMutAct_9fa48("460") ? false : stryMutAct_9fa48("459") ? true : (stryCov_9fa48("459", "460", "461"), starter === (stryMutAct_9fa48("462") ? "" : (stryCov_9fa48("462"), 'human')))) ? 1 : 2;
  return humanPlayer;
})());
export const computerPlayer = stryMutAct_9fa48("463") ? () => undefined : (stryCov_9fa48("463"), (() => {
  const computerPlayer = (starter: Starter): Player => other(humanPlayer(starter));
  return computerPlayer;
})());
export const boardOf = stryMutAct_9fa48("464") ? () => undefined : (stryCov_9fa48("464"), (() => {
  const boardOf = (state: ConnectFourState): Cell[] => boardFromMoves(state.moves);
  return boardOf;
})());
export const outcomeOfState = stryMutAct_9fa48("465") ? () => undefined : (stryCov_9fa48("465"), (() => {
  const outcomeOfState = (state: ConnectFourState): Outcome => outcomeOf(boardOf(state));
  return outcomeOfState;
})());

/** True when it is the computer's turn in an unfinished game against the computer. */
export function isComputerTurn(state: ConnectFourState): boolean {
  if (stryMutAct_9fa48("466")) {
    {}
  } else {
    stryCov_9fa48("466");
    if (stryMutAct_9fa48("469") ? state.opponent === 'computer' : stryMutAct_9fa48("468") ? false : stryMutAct_9fa48("467") ? true : (stryCov_9fa48("467", "468", "469"), state.opponent !== (stryMutAct_9fa48("470") ? "" : (stryCov_9fa48("470"), 'computer')))) return stryMutAct_9fa48("471") ? true : (stryCov_9fa48("471"), false);
    const board = boardOf(state);
    return stryMutAct_9fa48("474") ? outcomeOf(board).kind === 'playing' || toMove(board) === computerPlayer(state.starter) : stryMutAct_9fa48("473") ? false : stryMutAct_9fa48("472") ? true : (stryCov_9fa48("472", "473", "474"), (stryMutAct_9fa48("476") ? outcomeOf(board).kind !== 'playing' : stryMutAct_9fa48("475") ? true : (stryCov_9fa48("475", "476"), outcomeOf(board).kind === (stryMutAct_9fa48("477") ? "" : (stryCov_9fa48("477"), 'playing')))) && (stryMutAct_9fa48("479") ? toMove(board) !== computerPlayer(state.starter) : stryMutAct_9fa48("478") ? true : (stryCov_9fa48("478", "479"), toMove(board) === computerPlayer(state.starter))));
  }
}

/** Adds one move to the state (no computer reply). Throws on an illegal or post-game move. */
export function applyMove(state: ConnectFourState, col: number): ConnectFourState {
  if (stryMutAct_9fa48("480")) {
    {}
  } else {
    stryCov_9fa48("480");
    const board = boardOf(state);
    if (stryMutAct_9fa48("483") ? outcomeOf(board).kind === 'playing' : stryMutAct_9fa48("482") ? false : stryMutAct_9fa48("481") ? true : (stryCov_9fa48("481", "482", "483"), outcomeOf(board).kind !== (stryMutAct_9fa48("484") ? "" : (stryCov_9fa48("484"), 'playing')))) throw new RangeError(stryMutAct_9fa48("486") ? "" : (stryCov_9fa48("486"), 'The game is already over'));
    if (stryMutAct_9fa48("487")) {
      ;
    } else {
      stryCov_9fa48("487");
      drop(board, col, toMove(board));
    }
    return stryMutAct_9fa48("488") ? {} : (stryCov_9fa48("488"), {
      ...state,
      moves: stryMutAct_9fa48("489") ? [] : (stryCov_9fa48("489"), [...state.moves, col])
    });
  }
}

/**
 * Undo is offered only while the game is still running.
 * Against the computer it needs at least one move by the person.
 */
export function canUndo(state: ConnectFourState): boolean {
  if (stryMutAct_9fa48("490")) {
    {}
  } else {
    stryCov_9fa48("490");
    if (stryMutAct_9fa48("493") ? outcomeOfState(state).kind === 'playing' : stryMutAct_9fa48("492") ? false : stryMutAct_9fa48("491") ? true : (stryCov_9fa48("491", "492", "493"), outcomeOfState(state).kind !== (stryMutAct_9fa48("494") ? "" : (stryCov_9fa48("494"), 'playing')))) return stryMutAct_9fa48("495") ? true : (stryCov_9fa48("495"), false);
    if (stryMutAct_9fa48("498") ? state.opponent !== 'human' : stryMutAct_9fa48("497") ? false : stryMutAct_9fa48("496") ? true : (stryCov_9fa48("496", "497", "498"), state.opponent === (stryMutAct_9fa48("499") ? "" : (stryCov_9fa48("499"), 'human')))) return stryMutAct_9fa48("503") ? state.moves.length <= 0 : stryMutAct_9fa48("502") ? state.moves.length >= 0 : stryMutAct_9fa48("501") ? false : stryMutAct_9fa48("500") ? true : (stryCov_9fa48("500", "501", "502", "503"), state.moves.length > 0);
    const firstHumanMove = (stryMutAct_9fa48("506") ? state.starter !== 'human' : stryMutAct_9fa48("505") ? false : stryMutAct_9fa48("504") ? true : (stryCov_9fa48("504", "505", "506"), state.starter === (stryMutAct_9fa48("507") ? "" : (stryCov_9fa48("507"), 'human')))) ? 0 : 1;
    return stryMutAct_9fa48("511") ? state.moves.length <= firstHumanMove : stryMutAct_9fa48("510") ? state.moves.length >= firstHumanMove : stryMutAct_9fa48("509") ? false : stryMutAct_9fa48("508") ? true : (stryCov_9fa48("508", "509", "510", "511"), state.moves.length > firstHumanMove);
  }
}

/**
 * Takes back the last move; against the computer, takes back the person's last move
 * together with the computer's reply. The PRNG is not rewound.
 */
export function undo(state: ConnectFourState): ConnectFourState {
  if (stryMutAct_9fa48("512")) {
    {}
  } else {
    stryCov_9fa48("512");
    if (stryMutAct_9fa48("515") ? false : stryMutAct_9fa48("514") ? true : stryMutAct_9fa48("513") ? canUndo(state) : (stryCov_9fa48("513", "514", "515"), !canUndo(state))) return state;
    const moves = stryMutAct_9fa48("516") ? [] : (stryCov_9fa48("516"), [...state.moves]);
    if (stryMutAct_9fa48("519") ? state.opponent !== 'human' : stryMutAct_9fa48("518") ? false : stryMutAct_9fa48("517") ? true : (stryCov_9fa48("517", "518", "519"), state.opponent === (stryMutAct_9fa48("520") ? "" : (stryCov_9fa48("520"), 'human')))) {
      if (stryMutAct_9fa48("521")) {
        {}
      } else {
        stryCov_9fa48("521");
        if (stryMutAct_9fa48("522")) {
          ;
        } else {
          stryCov_9fa48("522");
          moves.pop();
        }
      }
    } else {
      if (stryMutAct_9fa48("523")) {
        {}
      } else {
        stryCov_9fa48("523");
        const mine = humanPlayer(state.starter);
        while (stryMutAct_9fa48("525") ? moves.length > 0 || playerOfMove(moves.length - 1) !== mine : stryMutAct_9fa48("524") ? false : (stryCov_9fa48("524", "525"), (stryMutAct_9fa48("528") ? moves.length <= 0 : stryMutAct_9fa48("527") ? moves.length >= 0 : stryMutAct_9fa48("526") ? true : (stryCov_9fa48("526", "527", "528"), moves.length > 0)) && (stryMutAct_9fa48("530") ? playerOfMove(moves.length - 1) === mine : stryMutAct_9fa48("529") ? true : (stryCov_9fa48("529", "530"), playerOfMove(stryMutAct_9fa48("531") ? moves.length + 1 : (stryCov_9fa48("531"), moves.length - 1)) !== mine)))) if (stryMutAct_9fa48("532")) {
          ;
        } else {
          stryCov_9fa48("532");
          moves.pop();
        }
        if (stryMutAct_9fa48("533")) {
          ;
        } else {
          stryCov_9fa48("533");
          moves.pop();
        }
      }
    }
    return stryMutAct_9fa48("534") ? {} : (stryCov_9fa48("534"), {
      ...state,
      moves
    });
  }
}

/** Thorough structural validation of untrusted data. Never throws. */
export function isValidState(value: unknown): value is ConnectFourState {
  if (stryMutAct_9fa48("535")) {
    {}
  } else {
    stryCov_9fa48("535");
    if (stryMutAct_9fa48("538") ? false : stryMutAct_9fa48("537") ? true : stryMutAct_9fa48("536") ? isRecord(value) : (stryCov_9fa48("536", "537", "538"), !isRecord(value))) return stryMutAct_9fa48("539") ? true : (stryCov_9fa48("539"), false);
    if (stryMutAct_9fa48("542") ? Object.keys(value).length === 6 : stryMutAct_9fa48("541") ? false : stryMutAct_9fa48("540") ? true : (stryCov_9fa48("540", "541", "542"), Object.keys(value).length !== 6)) return stryMutAct_9fa48("543") ? true : (stryCov_9fa48("543"), false);
    const {
      seed,
      difficulty,
      opponent,
      starter,
      moves,
      rng
    } = value;
    if (stryMutAct_9fa48("546") ? !isUint32(seed) && !isUint32(rng) : stryMutAct_9fa48("545") ? false : stryMutAct_9fa48("544") ? true : (stryCov_9fa48("544", "545", "546"), (stryMutAct_9fa48("547") ? isUint32(seed) : (stryCov_9fa48("547"), !isUint32(seed))) || (stryMutAct_9fa48("548") ? isUint32(rng) : (stryCov_9fa48("548"), !isUint32(rng))))) return stryMutAct_9fa48("549") ? true : (stryCov_9fa48("549"), false);
    if (stryMutAct_9fa48("552") ? (!isOneOf(difficulty, DIFFICULTIES) || !isOneOf(opponent, OPPONENTS)) && !isOneOf(starter, STARTERS) : stryMutAct_9fa48("551") ? false : stryMutAct_9fa48("550") ? true : (stryCov_9fa48("550", "551", "552"), (stryMutAct_9fa48("554") ? !isOneOf(difficulty, DIFFICULTIES) && !isOneOf(opponent, OPPONENTS) : stryMutAct_9fa48("553") ? false : (stryCov_9fa48("553", "554"), (stryMutAct_9fa48("555") ? isOneOf(difficulty, DIFFICULTIES) : (stryCov_9fa48("555"), !isOneOf(difficulty, DIFFICULTIES))) || (stryMutAct_9fa48("556") ? isOneOf(opponent, OPPONENTS) : (stryCov_9fa48("556"), !isOneOf(opponent, OPPONENTS))))) || (stryMutAct_9fa48("557") ? isOneOf(starter, STARTERS) : (stryCov_9fa48("557"), !isOneOf(starter, STARTERS))))) return stryMutAct_9fa48("558") ? true : (stryCov_9fa48("558"), false);
    if (stryMutAct_9fa48("561") ? !isArrayOf(moves, (m): m is number => isInt(m, 0, COLS - 1)) && moves.length > CELL_COUNT : stryMutAct_9fa48("560") ? false : stryMutAct_9fa48("559") ? true : (stryCov_9fa48("559", "560", "561"), (stryMutAct_9fa48("562") ? isArrayOf(moves, (m): m is number => isInt(m, 0, COLS - 1)) : (stryCov_9fa48("562"), !isArrayOf(moves, stryMutAct_9fa48("563") ? () => undefined : (stryCov_9fa48("563"), (m): m is number => isInt(m, 0, stryMutAct_9fa48("564") ? COLS + 1 : (stryCov_9fa48("564"), COLS - 1)))))) || (stryMutAct_9fa48("567") ? moves.length <= CELL_COUNT : stryMutAct_9fa48("566") ? moves.length >= CELL_COUNT : stryMutAct_9fa48("565") ? false : (stryCov_9fa48("565", "566", "567"), moves.length > CELL_COUNT)))) return stryMutAct_9fa48("568") ? true : (stryCov_9fa48("568"), false);
    // Replay: no column may overflow and no move may follow a finished game.
    let board = emptyBoard();
    for (let n = 0; stryMutAct_9fa48("571") ? n >= moves.length : stryMutAct_9fa48("570") ? n <= moves.length : stryMutAct_9fa48("569") ? false : (stryCov_9fa48("569", "570", "571"), n < moves.length); stryMutAct_9fa48("572") ? n-- : (stryCov_9fa48("572"), n++)) {
      if (stryMutAct_9fa48("573")) {
        {}
      } else {
        stryCov_9fa48("573");
        const col = moves[n] as number;
        if (stryMutAct_9fa48("576") ? findWin(board) && !isLegalMove(board, col) : stryMutAct_9fa48("575") ? false : stryMutAct_9fa48("574") ? true : (stryCov_9fa48("574", "575", "576"), findWin(board) || (stryMutAct_9fa48("577") ? isLegalMove(board, col) : (stryCov_9fa48("577"), !isLegalMove(board, col))))) return stryMutAct_9fa48("578") ? true : (stryCov_9fa48("578"), false);
        board = drop(board, col, playerOfMove(n));
      }
    }
    // Against the computer the state is never "half a turn": the computer's reply is
    // always applied together with the person's move.
    if (stryMutAct_9fa48("581") ? opponent === 'computer' && outcomeOf(board).kind === 'playing' || toMove(board) !== humanPlayer(starter) : stryMutAct_9fa48("580") ? false : stryMutAct_9fa48("579") ? true : (stryCov_9fa48("579", "580", "581"), (stryMutAct_9fa48("583") ? opponent === 'computer' || outcomeOf(board).kind === 'playing' : stryMutAct_9fa48("582") ? true : (stryCov_9fa48("582", "583"), (stryMutAct_9fa48("585") ? opponent !== 'computer' : stryMutAct_9fa48("584") ? true : (stryCov_9fa48("584", "585"), opponent === (stryMutAct_9fa48("586") ? "" : (stryCov_9fa48("586"), 'computer')))) && (stryMutAct_9fa48("588") ? outcomeOf(board).kind !== 'playing' : stryMutAct_9fa48("587") ? true : (stryCov_9fa48("587", "588"), outcomeOf(board).kind === (stryMutAct_9fa48("589") ? "" : (stryCov_9fa48("589"), 'playing')))))) && (stryMutAct_9fa48("591") ? toMove(board) === humanPlayer(starter) : stryMutAct_9fa48("590") ? true : (stryCov_9fa48("590", "591"), toMove(board) !== humanPlayer(starter))))) return stryMutAct_9fa48("592") ? true : (stryCov_9fa48("592"), false);
    return stryMutAct_9fa48("593") ? false : (stryCov_9fa48("593"), true);
  }
}