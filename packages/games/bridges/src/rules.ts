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
import { createRng, isInt, isOneOf, isRecord, isUint32, type Rng } from '@wp/game-core';

/**
 * Pure, DOM-free rules for Bridges (Hashiwokakero).
 *
 * Generation pipeline (spec "Puzzle generation"): a seeded random bridge network is grown
 * on the grid → island numbers are derived from it → the propagation solver below, which
 * never looks at the network, must determine every bridge by logic alone → otherwise the
 * attempt is discarded and a derived seed is tried. A complete solve by sound deductions
 * proves the solution is unique; the tests re-check uniqueness with an independent
 * backtracking oracle.
 *
 * Islands never touch each other, not even diagonally (Chebyshev distance ≥ 2). That keeps
 * puzzles readable and lets every island get a 44 px touch target on a 360 px phone even on
 * the 11 × 11 board, where a grid cell is only about 30 px wide.
 */

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = typeof DIFFICULTIES[number];
export const DEFAULT_DIFFICULTY: Difficulty = stryMutAct_9fa48("0") ? "" : (stryCov_9fa48("0"), 'easy');

/** Board edge length per difficulty (square boards). */
export const SIZES: Readonly<Record<Difficulty, number>> = stryMutAct_9fa48("1") ? {} : (stryCov_9fa48("1"), {
  easy: 7,
  medium: 9,
  hard: 11
});

/** Inclusive island-count range per difficulty. */
export const ISLAND_RANGE: Readonly<Record<Difficulty, readonly [number, number]>> = stryMutAct_9fa48("2") ? {} : (stryCov_9fa48("2"), {
  easy: stryMutAct_9fa48("3") ? [] : (stryCov_9fa48("3"), [8, 12]),
  medium: stryMutAct_9fa48("4") ? [] : (stryCov_9fa48("4"), [15, 20]),
  hard: stryMutAct_9fa48("5") ? [] : (stryCov_9fa48("5"), [22, 30])
});

/** Most bridges between one pair of islands. */
export const MAX_BRIDGES = 2;

/** Random networks tried before the frozen fallback puzzle is used. */
export const MAX_ATTEMPTS = 600;

/** Upper bound for counters in untrusted saves. */
export const MAX_COUNTER = 1_000_000;

/** Undo entries kept in the save (oldest are dropped). */
export const MAX_HISTORY = 400;

/** One island: `[row, column, number of bridges it needs]`. */
export type Island = [number, number, number];
export interface Puzzle {
  size: number;
  /** Islands in row-major order. */
  islands: Island[];
}

/** A place where bridges may be built: two islands in one line with no island between. */
export interface Edge {
  /** Island indices, `a < b`; `b` is to the right of or below `a`. */
  a: number;
  b: number;
  horizontal: boolean;
}
export interface BridgesState {
  seed: number;
  difficulty: Difficulty;
  size: number;
  islands: Island[];
  /** Bridges per edge (`edgesOf(islands)` order) of the unique solution. */
  solution: number[];
  /** Player's bridges per edge (0, 1 or 2). */
  bridges: number[];
  /** Undo stack of `[edgeIndex, previousCount]`. */
  history: [number, number][];
  /** Bridge changes made (undo is not counted). */
  moves: number;
  /** Times "Check" was used. */
  checks: number;
  /** Wrong bridges reported by the last check, or `null` once the board changed. */
  lastCheck: number | null;
}
export type Direction = 'up' | 'down' | 'left' | 'right';
export const DIRECTIONS: readonly Direction[] = stryMutAct_9fa48("6") ? [] : (stryCov_9fa48("6"), [stryMutAct_9fa48("7") ? "" : (stryCov_9fa48("7"), 'up'), stryMutAct_9fa48("8") ? "" : (stryCov_9fa48("8"), 'down'), stryMutAct_9fa48("9") ? "" : (stryCov_9fa48("9"), 'left'), stryMutAct_9fa48("10") ? "" : (stryCov_9fa48("10"), 'right')]);
const STEP: Readonly<Record<Direction, readonly [number, number]>> = stryMutAct_9fa48("11") ? {} : (stryCov_9fa48("11"), {
  up: stryMutAct_9fa48("12") ? [] : (stryCov_9fa48("12"), [stryMutAct_9fa48("13") ? +1 : (stryCov_9fa48("13"), -1), 0]),
  down: stryMutAct_9fa48("14") ? [] : (stryCov_9fa48("14"), [1, 0]),
  left: stryMutAct_9fa48("15") ? [] : (stryCov_9fa48("15"), [0, stryMutAct_9fa48("16") ? +1 : (stryCov_9fa48("16"), -1)]),
  right: stryMutAct_9fa48("17") ? [] : (stryCov_9fa48("17"), [0, 1])
});
export function toDifficulty(value: unknown): Difficulty {
  if (stryMutAct_9fa48("18")) {
    {}
  } else {
    stryCov_9fa48("18");
    return isOneOf(value, DIFFICULTIES) ? value : DEFAULT_DIFFICULTY;
  }
}

// --- Geometry ------------------------------------------------------------------------------

/**
 * All edges between line-neighbours (the nearest island to the right and below each island),
 * ordered by `a`, the horizontal edge of an island first.
 */
export function edgesOf(size: number, islands: readonly Island[]): Edge[] {
  if (stryMutAct_9fa48("19")) {
    {}
  } else {
    stryCov_9fa48("19");
    const at = new Map<number, number>();
    islands.forEach(stryMutAct_9fa48("21") ? () => undefined : (stryCov_9fa48("21"), ([r, c], i) => at.set(stryMutAct_9fa48("22") ? r * size - c : (stryCov_9fa48("22"), (stryMutAct_9fa48("23") ? r / size : (stryCov_9fa48("23"), r * size)) + c), i)));
    const edges: Edge[] = stryMutAct_9fa48("24") ? ["Stryker was here"] : (stryCov_9fa48("24"), []);
    islands.forEach(([r, c], a) => {
      if (stryMutAct_9fa48("26")) {
        {}
      } else {
        stryCov_9fa48("26");
        for (let cc = stryMutAct_9fa48("27") ? c - 1 : (stryCov_9fa48("27"), c + 1); stryMutAct_9fa48("30") ? cc >= size : stryMutAct_9fa48("29") ? cc <= size : stryMutAct_9fa48("28") ? false : (stryCov_9fa48("28", "29", "30"), cc < size); stryMutAct_9fa48("31") ? cc-- : (stryCov_9fa48("31"), cc++)) {
          if (stryMutAct_9fa48("32")) {
            {}
          } else {
            stryCov_9fa48("32");
            const b = at.get(stryMutAct_9fa48("33") ? r * size - cc : (stryCov_9fa48("33"), (stryMutAct_9fa48("34") ? r / size : (stryCov_9fa48("34"), r * size)) + cc));
            if (stryMutAct_9fa48("37") ? b === undefined : stryMutAct_9fa48("36") ? false : stryMutAct_9fa48("35") ? true : (stryCov_9fa48("35", "36", "37"), b !== undefined)) {
              if (stryMutAct_9fa48("38")) {
                {}
              } else {
                stryCov_9fa48("38");
                edges.push(stryMutAct_9fa48("40") ? {} : (stryCov_9fa48("40"), {
                  a,
                  b,
                  horizontal: stryMutAct_9fa48("41") ? false : (stryCov_9fa48("41"), true)
                }));
                break;
              }
            }
          }
        }
        for (let rr = stryMutAct_9fa48("42") ? r - 1 : (stryCov_9fa48("42"), r + 1); stryMutAct_9fa48("45") ? rr >= size : stryMutAct_9fa48("44") ? rr <= size : stryMutAct_9fa48("43") ? false : (stryCov_9fa48("43", "44", "45"), rr < size); stryMutAct_9fa48("46") ? rr-- : (stryCov_9fa48("46"), rr++)) {
          if (stryMutAct_9fa48("47")) {
            {}
          } else {
            stryCov_9fa48("47");
            const b = at.get(stryMutAct_9fa48("48") ? rr * size - c : (stryCov_9fa48("48"), (stryMutAct_9fa48("49") ? rr / size : (stryCov_9fa48("49"), rr * size)) + c));
            if (stryMutAct_9fa48("52") ? b === undefined : stryMutAct_9fa48("51") ? false : stryMutAct_9fa48("50") ? true : (stryCov_9fa48("50", "51", "52"), b !== undefined)) {
              if (stryMutAct_9fa48("53")) {
                {}
              } else {
                stryCov_9fa48("53");
                edges.push(stryMutAct_9fa48("55") ? {} : (stryCov_9fa48("55"), {
                  a,
                  b,
                  horizontal: stryMutAct_9fa48("56") ? true : (stryCov_9fa48("56"), false)
                }));
                break;
              }
            }
          }
        }
      }
    });
    return edges;
  }
}

/** True when a horizontal and a vertical edge would cross between their end points. */
export function edgesCross(islands: readonly Island[], e: Edge, f: Edge): boolean {
  if (stryMutAct_9fa48("57")) {
    {}
  } else {
    stryCov_9fa48("57");
    if (stryMutAct_9fa48("60") ? e.horizontal !== f.horizontal : stryMutAct_9fa48("59") ? false : stryMutAct_9fa48("58") ? true : (stryCov_9fa48("58", "59", "60"), e.horizontal === f.horizontal)) return stryMutAct_9fa48("61") ? true : (stryCov_9fa48("61"), false);
    const h = e.horizontal ? e : f;
    const v = e.horizontal ? f : e;
    const [hr, hc1] = islands[h.a] as Island;
    const hc2 = (islands[h.b] as Island)[1];
    const [vr1, vc] = islands[v.a] as Island;
    const vr2 = (islands[v.b] as Island)[0];
    return stryMutAct_9fa48("64") ? vr1 < hr && hr < vr2 && hc1 < vc || vc < hc2 : stryMutAct_9fa48("63") ? false : stryMutAct_9fa48("62") ? true : (stryCov_9fa48("62", "63", "64"), (stryMutAct_9fa48("66") ? vr1 < hr && hr < vr2 || hc1 < vc : stryMutAct_9fa48("65") ? true : (stryCov_9fa48("65", "66"), (stryMutAct_9fa48("68") ? vr1 < hr || hr < vr2 : stryMutAct_9fa48("67") ? true : (stryCov_9fa48("67", "68"), (stryMutAct_9fa48("71") ? vr1 >= hr : stryMutAct_9fa48("70") ? vr1 <= hr : stryMutAct_9fa48("69") ? true : (stryCov_9fa48("69", "70", "71"), vr1 < hr)) && (stryMutAct_9fa48("74") ? hr >= vr2 : stryMutAct_9fa48("73") ? hr <= vr2 : stryMutAct_9fa48("72") ? true : (stryCov_9fa48("72", "73", "74"), hr < vr2)))) && (stryMutAct_9fa48("77") ? hc1 >= vc : stryMutAct_9fa48("76") ? hc1 <= vc : stryMutAct_9fa48("75") ? true : (stryCov_9fa48("75", "76", "77"), hc1 < vc)))) && (stryMutAct_9fa48("80") ? vc >= hc2 : stryMutAct_9fa48("79") ? vc <= hc2 : stryMutAct_9fa48("78") ? true : (stryCov_9fa48("78", "79", "80"), vc < hc2)));
  }
}

/** For each edge, the indices of the edges it crosses (ascending). */
export function crossingsOf(islands: readonly Island[], edges: readonly Edge[]): number[][] {
  if (stryMutAct_9fa48("81")) {
    {}
  } else {
    stryCov_9fa48("81");
    const result: number[][] = edges.map(stryMutAct_9fa48("82") ? () => undefined : (stryCov_9fa48("82"), () => stryMutAct_9fa48("83") ? ["Stryker was here"] : (stryCov_9fa48("83"), [])));
    for (let i = 0; stryMutAct_9fa48("86") ? i >= edges.length : stryMutAct_9fa48("85") ? i <= edges.length : stryMutAct_9fa48("84") ? false : (stryCov_9fa48("84", "85", "86"), i < edges.length); stryMutAct_9fa48("87") ? i-- : (stryCov_9fa48("87"), i++)) {
      if (stryMutAct_9fa48("88")) {
        {}
      } else {
        stryCov_9fa48("88");
        for (let j = stryMutAct_9fa48("89") ? i - 1 : (stryCov_9fa48("89"), i + 1); stryMutAct_9fa48("92") ? j >= edges.length : stryMutAct_9fa48("91") ? j <= edges.length : stryMutAct_9fa48("90") ? false : (stryCov_9fa48("90", "91", "92"), j < edges.length); stryMutAct_9fa48("93") ? j-- : (stryCov_9fa48("93"), j++)) {
          if (stryMutAct_9fa48("94")) {
            {}
          } else {
            stryCov_9fa48("94");
            if (stryMutAct_9fa48("96") ? false : stryMutAct_9fa48("95") ? true : (stryCov_9fa48("95", "96"), edgesCross(islands, edges[i] as Edge, edges[j] as Edge))) {
              if (stryMutAct_9fa48("97")) {
                {}
              } else {
                stryCov_9fa48("97");
                if (stryMutAct_9fa48("98")) {
                  ;
                } else {
                  stryCov_9fa48("98");
                  (result[i] as number[]).push(j);
                }
                if (stryMutAct_9fa48("99")) {
                  ;
                } else {
                  stryCov_9fa48("99");
                  (result[j] as number[]).push(i);
                }
              }
            }
          }
        }
      }
    }
    return result;
  }
}

/** Edge indices incident to each island. */
export function incidence(islandCount: number, edges: readonly Edge[]): number[][] {
  if (stryMutAct_9fa48("100")) {
    {}
  } else {
    stryCov_9fa48("100");
    const result: number[][] = Array.from(stryMutAct_9fa48("101") ? {} : (stryCov_9fa48("101"), {
      length: islandCount
    }), stryMutAct_9fa48("102") ? () => undefined : (stryCov_9fa48("102"), () => stryMutAct_9fa48("103") ? ["Stryker was here"] : (stryCov_9fa48("103"), [])));
    edges.forEach((e, i) => {
      if (stryMutAct_9fa48("105")) {
        {}
      } else {
        stryCov_9fa48("105");
        stryMutAct_9fa48("106") ? result[e.a].push(i) : (stryCov_9fa48("106"), result[e.a]?.push(i));
        stryMutAct_9fa48("107") ? result[e.b].push(i) : (stryCov_9fa48("107"), result[e.b]?.push(i));
      }
    });
    return result;
  }
}

/** Bridges currently attached to each island. */
export function degrees(islandCount: number, edges: readonly Edge[], counts: readonly number[]): number[] {
  if (stryMutAct_9fa48("108")) {
    {}
  } else {
    stryCov_9fa48("108");
    const result = (stryMutAct_9fa48("109") ? new Array() : (stryCov_9fa48("109"), new Array<number>(islandCount))).fill(0);
    if (stryMutAct_9fa48("110")) {
      ;
    } else {
      stryCov_9fa48("110");
      edges.forEach((e, i) => {
        if (stryMutAct_9fa48("111")) {
          {}
        } else {
          stryCov_9fa48("111");
          const k = stryMutAct_9fa48("112") ? counts[i] && 0 : (stryCov_9fa48("112"), counts[i] ?? 0);
          result[e.a] = stryMutAct_9fa48("113") ? (result[e.a] as number) - k : (stryCov_9fa48("113"), (result[e.a] as number) + k);
          result[e.b] = stryMutAct_9fa48("114") ? (result[e.b] as number) - k : (stryCov_9fa48("114"), (result[e.b] as number) + k);
        }
      });
    }
    return result;
  }
}

/** Union–find over islands joined by edges whose count is positive. Returns a root per island. */
function componentRoots(islandCount: number, edges: readonly Edge[], counts: readonly number[]): number[] {
  if (stryMutAct_9fa48("115")) {
    {}
  } else {
    stryCov_9fa48("115");
    const parent = Array.from(stryMutAct_9fa48("116") ? {} : (stryCov_9fa48("116"), {
      length: islandCount
    }), stryMutAct_9fa48("117") ? () => undefined : (stryCov_9fa48("117"), (_, i) => i));
    const find = (x: number): number => {
      if (stryMutAct_9fa48("118")) {
        {}
      } else {
        stryCov_9fa48("118");
        while (stryMutAct_9fa48("120") ? parent[x] === x : stryMutAct_9fa48("119") ? false : (stryCov_9fa48("119", "120"), parent[x] !== x)) {
          if (stryMutAct_9fa48("121")) {
            {}
          } else {
            stryCov_9fa48("121");
            parent[x] = parent[parent[x] as number] as number;
            x = parent[x] as number;
          }
        }
        return x;
      }
    };
    edges.forEach((e, i) => {
      if (stryMutAct_9fa48("123")) {
        {}
      } else {
        stryCov_9fa48("123");
        if (stryMutAct_9fa48("127") ? (counts[i] ?? 0) <= 0 : stryMutAct_9fa48("126") ? (counts[i] ?? 0) >= 0 : stryMutAct_9fa48("125") ? false : stryMutAct_9fa48("124") ? true : (stryCov_9fa48("124", "125", "126", "127"), (stryMutAct_9fa48("128") ? counts[i] && 0 : (stryCov_9fa48("128"), counts[i] ?? 0)) > 0)) parent[find(e.a)] = find(e.b);
      }
    });
    return parent.map(stryMutAct_9fa48("129") ? () => undefined : (stryCov_9fa48("129"), (_, i) => find(i)));
  }
}

/** True when all islands form one group through bridges with a positive count. */
export function isConnected(islandCount: number, edges: readonly Edge[], counts: readonly number[]): boolean {
  if (stryMutAct_9fa48("130")) {
    {}
  } else {
    stryCov_9fa48("130");
    if (stryMutAct_9fa48("134") ? islandCount > 1 : stryMutAct_9fa48("133") ? islandCount < 1 : stryMutAct_9fa48("132") ? false : stryMutAct_9fa48("131") ? true : (stryCov_9fa48("131", "132", "133", "134"), islandCount <= 1)) return stryMutAct_9fa48("135") ? false : (stryCov_9fa48("135"), true);
    const roots = componentRoots(islandCount, edges, counts);
    return stryMutAct_9fa48("136") ? roots.some(r => r === roots[0]) : (stryCov_9fa48("136"), roots.every(stryMutAct_9fa48("137") ? () => undefined : (stryCov_9fa48("137"), r => stryMutAct_9fa48("140") ? r !== roots[0] : stryMutAct_9fa48("139") ? false : stryMutAct_9fa48("138") ? true : (stryCov_9fa48("138", "139", "140"), r === roots[0]))));
  }
}

/** Index of an edge whose bridges would cross a bridge already built, or -1. */
export function blockingEdge(islands: readonly Island[], edges: readonly Edge[], counts: readonly number[], edge: number): number {
  if (stryMutAct_9fa48("141")) {
    {}
  } else {
    stryCov_9fa48("141");
    const e = edges[edge];
    if (stryMutAct_9fa48("144") ? false : stryMutAct_9fa48("143") ? true : stryMutAct_9fa48("142") ? e : (stryCov_9fa48("142", "143", "144"), !e)) return stryMutAct_9fa48("145") ? +1 : (stryCov_9fa48("145"), -1);
    for (let i = 0; stryMutAct_9fa48("148") ? i >= edges.length : stryMutAct_9fa48("147") ? i <= edges.length : stryMutAct_9fa48("146") ? false : (stryCov_9fa48("146", "147", "148"), i < edges.length); stryMutAct_9fa48("149") ? i-- : (stryCov_9fa48("149"), i++)) {
      if (stryMutAct_9fa48("150")) {
        {}
      } else {
        stryCov_9fa48("150");
        if (stryMutAct_9fa48("153") ? (counts[i] ?? 0) > 0 || edgesCross(islands, e, edges[i] as Edge) : stryMutAct_9fa48("152") ? false : stryMutAct_9fa48("151") ? true : (stryCov_9fa48("151", "152", "153"), (stryMutAct_9fa48("156") ? (counts[i] ?? 0) <= 0 : stryMutAct_9fa48("155") ? (counts[i] ?? 0) >= 0 : stryMutAct_9fa48("154") ? true : (stryCov_9fa48("154", "155", "156"), (stryMutAct_9fa48("157") ? counts[i] && 0 : (stryCov_9fa48("157"), counts[i] ?? 0)) > 0)) && edgesCross(islands, e, edges[i] as Edge))) return i;
      }
    }
    return stryMutAct_9fa48("158") ? +1 : (stryCov_9fa48("158"), -1);
  }
}

/** True when `counts` is a complete, valid answer: numbers met, no crossings, one group. */
export function isSolution(puzzle: Puzzle, counts: readonly number[]): boolean {
  if (stryMutAct_9fa48("159")) {
    {}
  } else {
    stryCov_9fa48("159");
    const edges = edgesOf(puzzle.size, puzzle.islands);
    if (stryMutAct_9fa48("162") ? counts.length !== edges.length && !counts.every(k => isInt(k, 0, MAX_BRIDGES)) : stryMutAct_9fa48("161") ? false : stryMutAct_9fa48("160") ? true : (stryCov_9fa48("160", "161", "162"), (stryMutAct_9fa48("164") ? counts.length === edges.length : stryMutAct_9fa48("163") ? false : (stryCov_9fa48("163", "164"), counts.length !== edges.length)) || (stryMutAct_9fa48("165") ? counts.every(k => isInt(k, 0, MAX_BRIDGES)) : (stryCov_9fa48("165"), !(stryMutAct_9fa48("166") ? counts.some(k => isInt(k, 0, MAX_BRIDGES)) : (stryCov_9fa48("166"), counts.every(stryMutAct_9fa48("167") ? () => undefined : (stryCov_9fa48("167"), k => isInt(k, 0, MAX_BRIDGES))))))))) return stryMutAct_9fa48("168") ? true : (stryCov_9fa48("168"), false);
    const deg = degrees(puzzle.islands.length, edges, counts);
    if (stryMutAct_9fa48("171") ? false : stryMutAct_9fa48("170") ? true : stryMutAct_9fa48("169") ? puzzle.islands.every(([,, need], i) => deg[i] === need) : (stryCov_9fa48("169", "170", "171"), !(stryMutAct_9fa48("172") ? puzzle.islands.some(([,, need], i) => deg[i] === need) : (stryCov_9fa48("172"), puzzle.islands.every(stryMutAct_9fa48("173") ? () => undefined : (stryCov_9fa48("173"), ([,, need], i) => stryMutAct_9fa48("176") ? deg[i] !== need : stryMutAct_9fa48("175") ? false : stryMutAct_9fa48("174") ? true : (stryCov_9fa48("174", "175", "176"), deg[i] === need))))))) return stryMutAct_9fa48("177") ? true : (stryCov_9fa48("177"), false);
    for (let i = 0; stryMutAct_9fa48("180") ? i >= edges.length : stryMutAct_9fa48("179") ? i <= edges.length : stryMutAct_9fa48("178") ? false : (stryCov_9fa48("178", "179", "180"), i < edges.length); stryMutAct_9fa48("181") ? i-- : (stryCov_9fa48("181"), i++)) {
      if (stryMutAct_9fa48("182")) {
        {}
      } else {
        stryCov_9fa48("182");
        if (stryMutAct_9fa48("185") ? counts[i] as number > 0 || blockingEdge(puzzle.islands, edges, counts, i) >= 0 : stryMutAct_9fa48("184") ? false : stryMutAct_9fa48("183") ? true : (stryCov_9fa48("183", "184", "185"), (stryMutAct_9fa48("188") ? counts[i] as number <= 0 : stryMutAct_9fa48("187") ? counts[i] as number >= 0 : stryMutAct_9fa48("186") ? true : (stryCov_9fa48("186", "187", "188"), counts[i] as number > 0)) && (stryMutAct_9fa48("191") ? blockingEdge(puzzle.islands, edges, counts, i) < 0 : stryMutAct_9fa48("190") ? blockingEdge(puzzle.islands, edges, counts, i) > 0 : stryMutAct_9fa48("189") ? true : (stryCov_9fa48("189", "190", "191"), blockingEdge(puzzle.islands, edges, counts, i) >= 0)))) return stryMutAct_9fa48("192") ? true : (stryCov_9fa48("192"), false);
      }
    }
    return isConnected(puzzle.islands.length, edges, counts);
  }
}

/** The line-neighbour of island `from` in a direction, or -1. */
export function neighbourIn(size: number, islands: readonly Island[], from: number, dir: Direction): number {
  if (stryMutAct_9fa48("193")) {
    {}
  } else {
    stryCov_9fa48("193");
    const island = islands[from];
    if (stryMutAct_9fa48("196") ? false : stryMutAct_9fa48("195") ? true : stryMutAct_9fa48("194") ? island : (stryCov_9fa48("194", "195", "196"), !island)) return stryMutAct_9fa48("197") ? +1 : (stryCov_9fa48("197"), -1);
    const [dr, dc] = STEP[dir];
    let r = stryMutAct_9fa48("198") ? island[0] - dr : (stryCov_9fa48("198"), island[0] + dr);
    let c = stryMutAct_9fa48("199") ? island[1] - dc : (stryCov_9fa48("199"), island[1] + dc);
    while (stryMutAct_9fa48("201") ? r >= 0 && c >= 0 && r < size || c < size : stryMutAct_9fa48("200") ? false : (stryCov_9fa48("200", "201"), (stryMutAct_9fa48("203") ? r >= 0 && c >= 0 || r < size : stryMutAct_9fa48("202") ? true : (stryCov_9fa48("202", "203"), (stryMutAct_9fa48("205") ? r >= 0 || c >= 0 : stryMutAct_9fa48("204") ? true : (stryCov_9fa48("204", "205"), (stryMutAct_9fa48("208") ? r < 0 : stryMutAct_9fa48("207") ? r > 0 : stryMutAct_9fa48("206") ? true : (stryCov_9fa48("206", "207", "208"), r >= 0)) && (stryMutAct_9fa48("211") ? c < 0 : stryMutAct_9fa48("210") ? c > 0 : stryMutAct_9fa48("209") ? true : (stryCov_9fa48("209", "210", "211"), c >= 0)))) && (stryMutAct_9fa48("214") ? r >= size : stryMutAct_9fa48("213") ? r <= size : stryMutAct_9fa48("212") ? true : (stryCov_9fa48("212", "213", "214"), r < size)))) && (stryMutAct_9fa48("217") ? c >= size : stryMutAct_9fa48("216") ? c <= size : stryMutAct_9fa48("215") ? true : (stryCov_9fa48("215", "216", "217"), c < size)))) {
      if (stryMutAct_9fa48("218")) {
        {}
      } else {
        stryCov_9fa48("218");
        const hit = islands.findIndex(stryMutAct_9fa48("219") ? () => undefined : (stryCov_9fa48("219"), ([ir, ic]) => stryMutAct_9fa48("222") ? ir === r || ic === c : stryMutAct_9fa48("221") ? false : stryMutAct_9fa48("220") ? true : (stryCov_9fa48("220", "221", "222"), (stryMutAct_9fa48("224") ? ir !== r : stryMutAct_9fa48("223") ? true : (stryCov_9fa48("223", "224"), ir === r)) && (stryMutAct_9fa48("226") ? ic !== c : stryMutAct_9fa48("225") ? true : (stryCov_9fa48("225", "226"), ic === c)))));
        if (stryMutAct_9fa48("230") ? hit < 0 : stryMutAct_9fa48("229") ? hit > 0 : stryMutAct_9fa48("228") ? false : stryMutAct_9fa48("227") ? true : (stryCov_9fa48("227", "228", "229", "230"), hit >= 0)) return hit;
        stryMutAct_9fa48("231") ? r -= dr : (stryCov_9fa48("231"), r += dr);
        stryMutAct_9fa48("232") ? c -= dc : (stryCov_9fa48("232"), c += dc);
      }
    }
    return stryMutAct_9fa48("233") ? +1 : (stryCov_9fa48("233"), -1);
  }
}

/** Index of the edge joining islands `x` and `y` (either order), or -1. */
export function edgeBetween(edges: readonly Edge[], x: number, y: number): number {
  if (stryMutAct_9fa48("234")) {
    {}
  } else {
    stryCov_9fa48("234");
    return edges.findIndex(stryMutAct_9fa48("235") ? () => undefined : (stryCov_9fa48("235"), e => stryMutAct_9fa48("238") ? e.a === x && e.b === y && e.a === y && e.b === x : stryMutAct_9fa48("237") ? false : stryMutAct_9fa48("236") ? true : (stryCov_9fa48("236", "237", "238"), (stryMutAct_9fa48("240") ? e.a === x || e.b === y : stryMutAct_9fa48("239") ? false : (stryCov_9fa48("239", "240"), (stryMutAct_9fa48("242") ? e.a !== x : stryMutAct_9fa48("241") ? true : (stryCov_9fa48("241", "242"), e.a === x)) && (stryMutAct_9fa48("244") ? e.b !== y : stryMutAct_9fa48("243") ? true : (stryCov_9fa48("243", "244"), e.b === y)))) || (stryMutAct_9fa48("246") ? e.a === y || e.b === x : stryMutAct_9fa48("245") ? false : (stryCov_9fa48("245", "246"), (stryMutAct_9fa48("248") ? e.a !== y : stryMutAct_9fa48("247") ? true : (stryCov_9fa48("247", "248"), e.a === y)) && (stryMutAct_9fa48("250") ? e.b !== x : stryMutAct_9fa48("249") ? true : (stryCov_9fa48("249", "250"), e.b === x)))))));
  }
}

/**
 * Keyboard focus target: the closest island in a direction. Islands in the same line win;
 * otherwise the one with the smallest distance along the direction plus twice the sideways
 * offset (ties: lower index). Returns -1 when there is none.
 */
export function nearestIsland(islands: readonly Island[], from: number, dir: Direction): number {
  if (stryMutAct_9fa48("251")) {
    {}
  } else {
    stryCov_9fa48("251");
    const origin = islands[from];
    if (stryMutAct_9fa48("254") ? false : stryMutAct_9fa48("253") ? true : stryMutAct_9fa48("252") ? origin : (stryCov_9fa48("252", "253", "254"), !origin)) return stryMutAct_9fa48("255") ? +1 : (stryCov_9fa48("255"), -1);
    const [dr, dc] = STEP[dir];
    let best = stryMutAct_9fa48("256") ? +1 : (stryCov_9fa48("256"), -1);
    let bestScore = Infinity;
    islands.forEach(([r, c], i) => {
      if (stryMutAct_9fa48("258")) {
        {}
      } else {
        stryCov_9fa48("258");
        const along = stryMutAct_9fa48("259") ? (r - origin[0]) * dr - (c - origin[1]) * dc : (stryCov_9fa48("259"), (stryMutAct_9fa48("260") ? (r - origin[0]) / dr : (stryCov_9fa48("260"), (stryMutAct_9fa48("261") ? r + origin[0] : (stryCov_9fa48("261"), r - origin[0])) * dr)) + (stryMutAct_9fa48("262") ? (c - origin[1]) / dc : (stryCov_9fa48("262"), (stryMutAct_9fa48("263") ? c + origin[1] : (stryCov_9fa48("263"), c - origin[1])) * dc)));
        if (stryMutAct_9fa48("267") ? along > 0 : stryMutAct_9fa48("266") ? along < 0 : stryMutAct_9fa48("265") ? false : stryMutAct_9fa48("264") ? true : (stryCov_9fa48("264", "265", "266", "267"), along <= 0)) return;
        const side = Math.abs((stryMutAct_9fa48("270") ? dr === 0 : stryMutAct_9fa48("269") ? false : stryMutAct_9fa48("268") ? true : (stryCov_9fa48("268", "269", "270"), dr !== 0)) ? stryMutAct_9fa48("271") ? c + origin[1] : (stryCov_9fa48("271"), c - origin[1]) : stryMutAct_9fa48("272") ? r + origin[0] : (stryCov_9fa48("272"), r - origin[0]));
        const score = stryMutAct_9fa48("273") ? along - 2 * side : (stryCov_9fa48("273"), along + (stryMutAct_9fa48("274") ? 2 / side : (stryCov_9fa48("274"), 2 * side)));
        if (stryMutAct_9fa48("278") ? score >= bestScore : stryMutAct_9fa48("277") ? score <= bestScore : stryMutAct_9fa48("276") ? false : stryMutAct_9fa48("275") ? true : (stryCov_9fa48("275", "276", "277", "278"), score < bestScore)) {
          if (stryMutAct_9fa48("279")) {
            {}
          } else {
            stryCov_9fa48("279");
            bestScore = score;
            best = i;
          }
        }
      }
    });
    return best;
  }
}

// --- Logic solver --------------------------------------------------------------------------

export interface SolveOptions {
  /** Use the connectivity (isolation) rule (default `true`). */
  connectivity?: boolean;
}
export interface SolveResult {
  /** Lower bound of bridges per edge after propagation. */
  min: number[];
  /** Upper bound of bridges per edge after propagation. */
  max: number[];
  /** Every edge determined (and the result is a valid solution). */
  solved: boolean;
  /** The clues admit no solution (detected without guessing). */
  contradiction: boolean;
}

/**
 * Propagation solver (no guessing). Keeps bounds `[min, max]` per edge and applies until
 * nothing changes:
 *  - capacity: an island's remaining need forces / limits each of its edges;
 *  - crossing: a certain bridge forbids every edge it crosses;
 *  - isolation: a bridge that would leave a group of islands with no free capacity (while
 *    other islands remain) is impossible, and such a closed group is a contradiction.
 * Every rule only removes values that occur in no solution, so a full solve is unique.
 */
export function solve(puzzle: Puzzle, options: SolveOptions = {}): SolveResult {
  if (stryMutAct_9fa48("280")) {
    {}
  } else {
    stryCov_9fa48("280");
    const {
      islands
    } = puzzle;
    const n = islands.length;
    const edges = edgesOf(puzzle.size, islands);
    const cross = crossingsOf(islands, edges);
    const inc = incidence(n, edges);
    const need = islands.map(stryMutAct_9fa48("281") ? () => undefined : (stryCov_9fa48("281"), island => island[2]));
    const min = edges.map(stryMutAct_9fa48("282") ? () => undefined : (stryCov_9fa48("282"), () => 0));
    const max = edges.map(stryMutAct_9fa48("283") ? () => undefined : (stryCov_9fa48("283"), e => stryMutAct_9fa48("284") ? Math.max(MAX_BRIDGES, need[e.a] as number, need[e.b] as number) : (stryCov_9fa48("284"), Math.min(MAX_BRIDGES, need[e.a] as number, need[e.b] as number))));
    const fail = stryMutAct_9fa48("285") ? () => undefined : (stryCov_9fa48("285"), (() => {
      const fail = (): SolveResult => stryMutAct_9fa48("286") ? {} : (stryCov_9fa48("286"), {
        min,
        max,
        solved: stryMutAct_9fa48("287") ? true : (stryCov_9fa48("287"), false),
        contradiction: stryMutAct_9fa48("288") ? false : (stryCov_9fa48("288"), true)
      });
      return fail;
    })());
    let changed = stryMutAct_9fa48("289") ? false : (stryCov_9fa48("289"), true);
    while (stryMutAct_9fa48("290") ? false : (stryCov_9fa48("290"), changed)) {
      if (stryMutAct_9fa48("291")) {
        {}
      } else {
        stryCov_9fa48("291");
        changed = stryMutAct_9fa48("292") ? true : (stryCov_9fa48("292"), false);

        // Capacity.
        for (let i = 0; stryMutAct_9fa48("295") ? i >= n : stryMutAct_9fa48("294") ? i <= n : stryMutAct_9fa48("293") ? false : (stryCov_9fa48("293", "294", "295"), i < n); stryMutAct_9fa48("296") ? i-- : (stryCov_9fa48("296"), i++)) {
          if (stryMutAct_9fa48("297")) {
            {}
          } else {
            stryCov_9fa48("297");
            const list = inc[i] as number[];
            let sumMin = 0;
            let sumMax = 0;
            for (const e of list) {
              if (stryMutAct_9fa48("298")) {
                {}
              } else {
                stryCov_9fa48("298");
                stryMutAct_9fa48("299") ? sumMin -= min[e] as number : (stryCov_9fa48("299"), sumMin += min[e] as number);
                stryMutAct_9fa48("300") ? sumMax -= max[e] as number : (stryCov_9fa48("300"), sumMax += max[e] as number);
              }
            }
            const target = need[i] as number;
            if (stryMutAct_9fa48("303") ? sumMin > target && sumMax < target : stryMutAct_9fa48("302") ? false : stryMutAct_9fa48("301") ? true : (stryCov_9fa48("301", "302", "303"), (stryMutAct_9fa48("306") ? sumMin <= target : stryMutAct_9fa48("305") ? sumMin >= target : stryMutAct_9fa48("304") ? false : (stryCov_9fa48("304", "305", "306"), sumMin > target)) || (stryMutAct_9fa48("309") ? sumMax >= target : stryMutAct_9fa48("308") ? sumMax <= target : stryMutAct_9fa48("307") ? false : (stryCov_9fa48("307", "308", "309"), sumMax < target)))) return fail();
            for (const e of list) {
              if (stryMutAct_9fa48("310")) {
                {}
              } else {
                stryCov_9fa48("310");
                const lo = stryMutAct_9fa48("311") ? target + (sumMax - (max[e] as number)) : (stryCov_9fa48("311"), target - (stryMutAct_9fa48("312") ? sumMax + (max[e] as number) : (stryCov_9fa48("312"), sumMax - (max[e] as number))));
                const hi = stryMutAct_9fa48("313") ? target + (sumMin - (min[e] as number)) : (stryCov_9fa48("313"), target - (stryMutAct_9fa48("314") ? sumMin + (min[e] as number) : (stryCov_9fa48("314"), sumMin - (min[e] as number))));
                if (stryMutAct_9fa48("318") ? lo <= (min[e] as number) : stryMutAct_9fa48("317") ? lo >= (min[e] as number) : stryMutAct_9fa48("316") ? false : stryMutAct_9fa48("315") ? true : (stryCov_9fa48("315", "316", "317", "318"), lo > (min[e] as number))) {
                  if (stryMutAct_9fa48("319")) {
                    {}
                  } else {
                    stryCov_9fa48("319");
                    min[e] = lo;
                    changed = stryMutAct_9fa48("320") ? false : (stryCov_9fa48("320"), true);
                  }
                }
                if (stryMutAct_9fa48("324") ? hi >= (max[e] as number) : stryMutAct_9fa48("323") ? hi <= (max[e] as number) : stryMutAct_9fa48("322") ? false : stryMutAct_9fa48("321") ? true : (stryCov_9fa48("321", "322", "323", "324"), hi < (max[e] as number))) {
                  if (stryMutAct_9fa48("325")) {
                    {}
                  } else {
                    stryCov_9fa48("325");
                    max[e] = hi;
                    changed = stryMutAct_9fa48("326") ? false : (stryCov_9fa48("326"), true);
                  }
                }
              }
            }
          }
        }

        // Crossing.
        for (let e = 0; stryMutAct_9fa48("329") ? e >= edges.length : stryMutAct_9fa48("328") ? e <= edges.length : stryMutAct_9fa48("327") ? false : (stryCov_9fa48("327", "328", "329"), e < edges.length); stryMutAct_9fa48("330") ? e-- : (stryCov_9fa48("330"), e++)) {
          if (stryMutAct_9fa48("331")) {
            {}
          } else {
            stryCov_9fa48("331");
            if (stryMutAct_9fa48("335") ? min[e] as number <= (max[e] as number) : stryMutAct_9fa48("334") ? min[e] as number >= (max[e] as number) : stryMutAct_9fa48("333") ? false : stryMutAct_9fa48("332") ? true : (stryCov_9fa48("332", "333", "334", "335"), min[e] as number > (max[e] as number))) return fail();
            if (stryMutAct_9fa48("338") ? min[e] as number !== 0 : stryMutAct_9fa48("337") ? false : stryMutAct_9fa48("336") ? true : (stryCov_9fa48("336", "337", "338"), min[e] as number === 0)) continue;
            for (const f of cross[e] as number[]) {
              if (stryMutAct_9fa48("339")) {
                {}
              } else {
                stryCov_9fa48("339");
                if (stryMutAct_9fa48("343") ? min[f] as number <= 0 : stryMutAct_9fa48("342") ? min[f] as number >= 0 : stryMutAct_9fa48("341") ? false : stryMutAct_9fa48("340") ? true : (stryCov_9fa48("340", "341", "342", "343"), min[f] as number > 0)) return fail();
                if (stryMutAct_9fa48("347") ? max[f] as number <= 0 : stryMutAct_9fa48("346") ? max[f] as number >= 0 : stryMutAct_9fa48("345") ? false : stryMutAct_9fa48("344") ? true : (stryCov_9fa48("344", "345", "346", "347"), max[f] as number > 0)) {
                  if (stryMutAct_9fa48("348")) {
                    {}
                  } else {
                    stryCov_9fa48("348");
                    max[f] = 0;
                    changed = stryMutAct_9fa48("349") ? false : (stryCov_9fa48("349"), true);
                  }
                }
              }
            }
          }
        }
        if (stryMutAct_9fa48("352") ? changed && options.connectivity === false : stryMutAct_9fa48("351") ? false : stryMutAct_9fa48("350") ? true : (stryCov_9fa48("350", "351", "352"), changed || (stryMutAct_9fa48("354") ? options.connectivity !== false : stryMutAct_9fa48("353") ? false : (stryCov_9fa48("353", "354"), options.connectivity === (stryMutAct_9fa48("355") ? true : (stryCov_9fa48("355"), false)))))) continue;

        // Connectivity: groups of islands already joined by certain bridges.
        const roots = componentRoots(n, edges, min);
        const groupSize = (stryMutAct_9fa48("356") ? new Array() : (stryCov_9fa48("356"), new Array<number>(n))).fill(0);
        const free = (stryMutAct_9fa48("357") ? new Array() : (stryCov_9fa48("357"), new Array<number>(n))).fill(0);
        for (let i = 0; stryMutAct_9fa48("360") ? i >= n : stryMutAct_9fa48("359") ? i <= n : stryMutAct_9fa48("358") ? false : (stryCov_9fa48("358", "359", "360"), i < n); stryMutAct_9fa48("361") ? i-- : (stryCov_9fa48("361"), i++)) {
          if (stryMutAct_9fa48("362")) {
            {}
          } else {
            stryCov_9fa48("362");
            const root = roots[i] as number;
            let used = 0;
            for (const e of inc[i] as number[]) stryMutAct_9fa48("363") ? used -= min[e] as number : (stryCov_9fa48("363"), used += min[e] as number);
            groupSize[root] = stryMutAct_9fa48("364") ? (groupSize[root] as number) - 1 : (stryCov_9fa48("364"), (groupSize[root] as number) + 1);
            free[root] = stryMutAct_9fa48("365") ? (free[root] as number) + (need[i] as number) + used : (stryCov_9fa48("365"), (stryMutAct_9fa48("366") ? (free[root] as number) - (need[i] as number) : (stryCov_9fa48("366"), (free[root] as number) + (need[i] as number))) - used);
          }
        }
        if (stryMutAct_9fa48("369") ? groupSize[roots[0] as number] !== n : stryMutAct_9fa48("368") ? false : stryMutAct_9fa48("367") ? true : (stryCov_9fa48("367", "368", "369"), groupSize[roots[0] as number] === n)) continue;
        // A group that cannot take another bridge is cut off from the other groups.
        for (let i = 0; stryMutAct_9fa48("372") ? i >= n : stryMutAct_9fa48("371") ? i <= n : stryMutAct_9fa48("370") ? false : (stryCov_9fa48("370", "371", "372"), i < n); stryMutAct_9fa48("373") ? i-- : (stryCov_9fa48("373"), i++)) if (stryMutAct_9fa48("376") ? roots[i] === i || free[i] === 0 : stryMutAct_9fa48("375") ? false : stryMutAct_9fa48("374") ? true : (stryCov_9fa48("374", "375", "376"), (stryMutAct_9fa48("378") ? roots[i] !== i : stryMutAct_9fa48("377") ? true : (stryCov_9fa48("377", "378"), roots[i] === i)) && (stryMutAct_9fa48("380") ? free[i] !== 0 : stryMutAct_9fa48("379") ? true : (stryCov_9fa48("379", "380"), free[i] === 0)))) return fail();
        // Isolation: building `max` bridges must leave the joined group some free capacity.
        for (let e = 0; stryMutAct_9fa48("383") ? e >= edges.length : stryMutAct_9fa48("382") ? e <= edges.length : stryMutAct_9fa48("381") ? false : (stryCov_9fa48("381", "382", "383"), e < edges.length); stryMutAct_9fa48("384") ? e-- : (stryCov_9fa48("384"), e++)) {
          if (stryMutAct_9fa48("385")) {
            {}
          } else {
            stryCov_9fa48("385");
            const top = max[e] as number;
            const low = min[e] as number;
            if (stryMutAct_9fa48("388") ? top !== low : stryMutAct_9fa48("387") ? false : stryMutAct_9fa48("386") ? true : (stryCov_9fa48("386", "387", "388"), top === low)) continue;
            const ra = roots[(edges[e] as Edge).a] as number;
            const rb = roots[(edges[e] as Edge).b] as number;
            const joinedSize = stryMutAct_9fa48("389") ? (groupSize[ra] as number) - (ra === rb ? 0 : groupSize[rb] as number) : (stryCov_9fa48("389"), (groupSize[ra] as number) + ((stryMutAct_9fa48("392") ? ra !== rb : stryMutAct_9fa48("391") ? false : stryMutAct_9fa48("390") ? true : (stryCov_9fa48("390", "391", "392"), ra === rb)) ? 0 : groupSize[rb] as number));
            const joinedFree = stryMutAct_9fa48("393") ? (free[ra] as number) + (ra === rb ? 0 : free[rb] as number) + 2 * (top - low) : (stryCov_9fa48("393"), (stryMutAct_9fa48("394") ? (free[ra] as number) - (ra === rb ? 0 : free[rb] as number) : (stryCov_9fa48("394"), (free[ra] as number) + ((stryMutAct_9fa48("397") ? ra !== rb : stryMutAct_9fa48("396") ? false : stryMutAct_9fa48("395") ? true : (stryCov_9fa48("395", "396", "397"), ra === rb)) ? 0 : free[rb] as number))) - (stryMutAct_9fa48("398") ? 2 / (top - low) : (stryCov_9fa48("398"), 2 * (stryMutAct_9fa48("399") ? top + low : (stryCov_9fa48("399"), top - low)))));
            if (stryMutAct_9fa48("402") ? joinedSize < n || joinedFree === 0 : stryMutAct_9fa48("401") ? false : stryMutAct_9fa48("400") ? true : (stryCov_9fa48("400", "401", "402"), (stryMutAct_9fa48("405") ? joinedSize >= n : stryMutAct_9fa48("404") ? joinedSize <= n : stryMutAct_9fa48("403") ? true : (stryCov_9fa48("403", "404", "405"), joinedSize < n)) && (stryMutAct_9fa48("407") ? joinedFree !== 0 : stryMutAct_9fa48("406") ? true : (stryCov_9fa48("406", "407"), joinedFree === 0)))) {
              if (stryMutAct_9fa48("408")) {
                {}
              } else {
                stryCov_9fa48("408");
                max[e] = stryMutAct_9fa48("409") ? top + 1 : (stryCov_9fa48("409"), top - 1);
                changed = stryMutAct_9fa48("410") ? false : (stryCov_9fa48("410"), true);
              }
            }
          }
        }
      }
    }
    const fixed = stryMutAct_9fa48("411") ? min.some((v, e) => v === max[e]) : (stryCov_9fa48("411"), min.every(stryMutAct_9fa48("412") ? () => undefined : (stryCov_9fa48("412"), (v, e) => stryMutAct_9fa48("415") ? v !== max[e] : stryMutAct_9fa48("414") ? false : stryMutAct_9fa48("413") ? true : (stryCov_9fa48("413", "414", "415"), v === max[e]))));
    const solved = stryMutAct_9fa48("418") ? fixed || isConnected(n, edges, min) : stryMutAct_9fa48("417") ? false : stryMutAct_9fa48("416") ? true : (stryCov_9fa48("416", "417", "418"), fixed && isConnected(n, edges, min));
    return stryMutAct_9fa48("419") ? {} : (stryCov_9fa48("419"), {
      min,
      max,
      solved,
      contradiction: stryMutAct_9fa48("422") ? fixed || !solved : stryMutAct_9fa48("421") ? false : stryMutAct_9fa48("420") ? true : (stryCov_9fa48("420", "421", "422"), fixed && (stryMutAct_9fa48("423") ? solved : (stryCov_9fa48("423"), !solved)))
    });
  }
}

/** True when the solver alone determines all bridges of the puzzle. */
export function isLogicSolvable(puzzle: Puzzle): boolean {
  if (stryMutAct_9fa48("424")) {
    {}
  } else {
    stryCov_9fa48("424");
    return solve(puzzle).solved;
  }
}

// --- Generation ----------------------------------------------------------------------------

/** murmur3 32-bit finaliser: a bijective avalanche mix. */
function fmix32(value: number): number {
  if (stryMutAct_9fa48("425")) {
    {}
  } else {
    stryCov_9fa48("425");
    let h = value >>> 0;
    h = Math.imul(h ^ h >>> 16, 0x85ebca6b);
    h = Math.imul(h ^ h >>> 13, 0xc2b2ae35);
    return (h ^ h >>> 16) >>> 0;
  }
}

/**
 * Deterministic per-attempt seed: the seed is mixed before the attempt number is added, so
 * neighbouring seeds do not share attempt sequences.
 */
export function attemptSeed(seed: number, attempt: number): number {
  if (stryMutAct_9fa48("426")) {
    {}
  } else {
    stryCov_9fa48("426");
    return fmix32(stryMutAct_9fa48("427") ? fmix32(seed) + attempt - 1 : (stryCov_9fa48("427"), (stryMutAct_9fa48("428") ? fmix32(seed) - attempt : (stryCov_9fa48("428"), fmix32(seed) + attempt)) + 1));
  }
}
export interface Network {
  size: number;
  /** Island positions `[row, column]` in placement order. */
  positions: [number, number][];
  /** Bridges as `[islandA, islandB, count]` (placement indices). */
  links: [number, number, number][];
}

/** Probability that a newly built bridge is double. */
const DOUBLE_CHANCE = 0.35;
/** Probability of adding a loop-closing bridge between already placed line-neighbours. */
const LOOP_CHANCE = 0.3;

/**
 * Grows a random connected bridge network: starting from one island, repeatedly extends a
 * bridge of length ≥ 2 from an existing island to a new island. Bridges never cross or pass
 * through islands, and islands never touch (not even diagonally). Afterwards some extra
 * bridges between line-neighbours close loops.
 */
export function growNetwork(rng: Rng, size: number, target: number): Network {
  if (stryMutAct_9fa48("429")) {
    {}
  } else {
    stryCov_9fa48("429");
    const islandAt = new Int16Array(stryMutAct_9fa48("430") ? size / size : (stryCov_9fa48("430"), size * size)).fill(stryMutAct_9fa48("431") ? +1 : (stryCov_9fa48("431"), -1));
    const bridgeAt = new Uint8Array(stryMutAct_9fa48("432") ? size / size : (stryCov_9fa48("432"), size * size));
    const positions: [number, number][] = stryMutAct_9fa48("433") ? ["Stryker was here"] : (stryCov_9fa48("433"), []);
    const links: [number, number, number][] = stryMutAct_9fa48("434") ? ["Stryker was here"] : (stryCov_9fa48("434"), []);
    const inside = stryMutAct_9fa48("435") ? () => undefined : (stryCov_9fa48("435"), (() => {
      const inside = (r: number, c: number) => stryMutAct_9fa48("438") ? r >= 0 && c >= 0 && r < size || c < size : stryMutAct_9fa48("437") ? false : stryMutAct_9fa48("436") ? true : (stryCov_9fa48("436", "437", "438"), (stryMutAct_9fa48("440") ? r >= 0 && c >= 0 || r < size : stryMutAct_9fa48("439") ? true : (stryCov_9fa48("439", "440"), (stryMutAct_9fa48("442") ? r >= 0 || c >= 0 : stryMutAct_9fa48("441") ? true : (stryCov_9fa48("441", "442"), (stryMutAct_9fa48("445") ? r < 0 : stryMutAct_9fa48("444") ? r > 0 : stryMutAct_9fa48("443") ? true : (stryCov_9fa48("443", "444", "445"), r >= 0)) && (stryMutAct_9fa48("448") ? c < 0 : stryMutAct_9fa48("447") ? c > 0 : stryMutAct_9fa48("446") ? true : (stryCov_9fa48("446", "447", "448"), c >= 0)))) && (stryMutAct_9fa48("451") ? r >= size : stryMutAct_9fa48("450") ? r <= size : stryMutAct_9fa48("449") ? true : (stryCov_9fa48("449", "450", "451"), r < size)))) && (stryMutAct_9fa48("454") ? c >= size : stryMutAct_9fa48("453") ? c <= size : stryMutAct_9fa48("452") ? true : (stryCov_9fa48("452", "453", "454"), c < size)));
      return inside;
    })());
    const crowded = (r: number, c: number) => {
      if (stryMutAct_9fa48("455")) {
        {}
      } else {
        stryCov_9fa48("455");
        for (let dr = stryMutAct_9fa48("456") ? +1 : (stryCov_9fa48("456"), -1); stryMutAct_9fa48("459") ? dr > 1 : stryMutAct_9fa48("458") ? dr < 1 : stryMutAct_9fa48("457") ? false : (stryCov_9fa48("457", "458", "459"), dr <= 1); stryMutAct_9fa48("460") ? dr-- : (stryCov_9fa48("460"), dr++)) {
          if (stryMutAct_9fa48("461")) {
            {}
          } else {
            stryCov_9fa48("461");
            for (let dc = stryMutAct_9fa48("462") ? +1 : (stryCov_9fa48("462"), -1); stryMutAct_9fa48("465") ? dc > 1 : stryMutAct_9fa48("464") ? dc < 1 : stryMutAct_9fa48("463") ? false : (stryCov_9fa48("463", "464", "465"), dc <= 1); stryMutAct_9fa48("466") ? dc-- : (stryCov_9fa48("466"), dc++)) {
              if (stryMutAct_9fa48("467")) {
                {}
              } else {
                stryCov_9fa48("467");
                if (stryMutAct_9fa48("470") ? inside(r + dr, c + dc) || islandAt[(r + dr) * size + c + dc] !== -1 : stryMutAct_9fa48("469") ? false : stryMutAct_9fa48("468") ? true : (stryCov_9fa48("468", "469", "470"), inside(stryMutAct_9fa48("471") ? r - dr : (stryCov_9fa48("471"), r + dr), stryMutAct_9fa48("472") ? c - dc : (stryCov_9fa48("472"), c + dc)) && (stryMutAct_9fa48("474") ? islandAt[(r + dr) * size + c + dc] === -1 : stryMutAct_9fa48("473") ? true : (stryCov_9fa48("473", "474"), islandAt[stryMutAct_9fa48("475") ? (r + dr) * size + c - dc : (stryCov_9fa48("475"), (stryMutAct_9fa48("476") ? (r + dr) * size - c : (stryCov_9fa48("476"), (stryMutAct_9fa48("477") ? (r + dr) / size : (stryCov_9fa48("477"), (stryMutAct_9fa48("478") ? r - dr : (stryCov_9fa48("478"), r + dr)) * size)) + c)) + dc)] !== (stryMutAct_9fa48("479") ? +1 : (stryCov_9fa48("479"), -1)))))) return stryMutAct_9fa48("480") ? false : (stryCov_9fa48("480"), true);
              }
            }
          }
        }
        return stryMutAct_9fa48("481") ? true : (stryCov_9fa48("481"), false);
      }
    };
    const addIsland = (r: number, c: number) => {
      if (stryMutAct_9fa48("482")) {
        {}
      } else {
        stryCov_9fa48("482");
        islandAt[stryMutAct_9fa48("483") ? r * size - c : (stryCov_9fa48("483"), (stryMutAct_9fa48("484") ? r / size : (stryCov_9fa48("484"), r * size)) + c)] = positions.length;
        positions.push(stryMutAct_9fa48("486") ? [] : (stryCov_9fa48("486"), [r, c]));
      }
    };
    const lay = (a: number, b: number) => {
      if (stryMutAct_9fa48("487")) {
        {}
      } else {
        stryCov_9fa48("487");
        const [r1, c1] = positions[a] as [number, number];
        const [r2, c2] = positions[b] as [number, number];
        const dr = Math.sign(stryMutAct_9fa48("488") ? r2 + r1 : (stryCov_9fa48("488"), r2 - r1));
        const dc = Math.sign(stryMutAct_9fa48("489") ? c2 + c1 : (stryCov_9fa48("489"), c2 - c1));
        for (let r = stryMutAct_9fa48("490") ? r1 - dr : (stryCov_9fa48("490"), r1 + dr), c = stryMutAct_9fa48("491") ? c1 - dc : (stryCov_9fa48("491"), c1 + dc); stryMutAct_9fa48("493") ? r !== r2 && c !== c2 : stryMutAct_9fa48("492") ? false : (stryCov_9fa48("492", "493"), (stryMutAct_9fa48("495") ? r === r2 : stryMutAct_9fa48("494") ? false : (stryCov_9fa48("494", "495"), r !== r2)) || (stryMutAct_9fa48("497") ? c === c2 : stryMutAct_9fa48("496") ? false : (stryCov_9fa48("496", "497"), c !== c2))); stryMutAct_9fa48("498") ? r -= dr : (stryCov_9fa48("498"), r += dr), stryMutAct_9fa48("499") ? c -= dc : (stryCov_9fa48("499"), c += dc)) bridgeAt[stryMutAct_9fa48("500") ? r * size - c : (stryCov_9fa48("500"), (stryMutAct_9fa48("501") ? r / size : (stryCov_9fa48("501"), r * size)) + c)] = 1;
        links.push(stryMutAct_9fa48("503") ? [] : (stryCov_9fa48("503"), [a, b, (stryMutAct_9fa48("507") ? rng.next() >= DOUBLE_CHANCE : stryMutAct_9fa48("506") ? rng.next() <= DOUBLE_CHANCE : stryMutAct_9fa48("505") ? false : stryMutAct_9fa48("504") ? true : (stryCov_9fa48("504", "505", "506", "507"), rng.next() < DOUBLE_CHANCE)) ? 2 : 1]));
      }
    };
    addIsland(rng.int(0, stryMutAct_9fa48("509") ? size + 1 : (stryCov_9fa48("509"), size - 1)), rng.int(0, stryMutAct_9fa48("510") ? size + 1 : (stryCov_9fa48("510"), size - 1)));
    const budget = stryMutAct_9fa48("511") ? target / 80 : (stryCov_9fa48("511"), target * 80);
    for (let tries = 0; stryMutAct_9fa48("513") ? tries < budget || positions.length < target : stryMutAct_9fa48("512") ? false : (stryCov_9fa48("512", "513"), (stryMutAct_9fa48("516") ? tries >= budget : stryMutAct_9fa48("515") ? tries <= budget : stryMutAct_9fa48("514") ? true : (stryCov_9fa48("514", "515", "516"), tries < budget)) && (stryMutAct_9fa48("519") ? positions.length >= target : stryMutAct_9fa48("518") ? positions.length <= target : stryMutAct_9fa48("517") ? true : (stryCov_9fa48("517", "518", "519"), positions.length < target))); stryMutAct_9fa48("520") ? tries-- : (stryCov_9fa48("520"), tries++)) {
      if (stryMutAct_9fa48("521")) {
        {}
      } else {
        stryCov_9fa48("521");
        const from = rng.int(0, stryMutAct_9fa48("522") ? positions.length + 1 : (stryCov_9fa48("522"), positions.length - 1));
        const [dr, dc] = STEP[rng.pick(DIRECTIONS)];
        const length = rng.int(2, stryMutAct_9fa48("523") ? size + 1 : (stryCov_9fa48("523"), size - 1));
        const [r0, c0] = positions[from] as [number, number];
        const r = stryMutAct_9fa48("524") ? r0 - dr * length : (stryCov_9fa48("524"), r0 + (stryMutAct_9fa48("525") ? dr / length : (stryCov_9fa48("525"), dr * length)));
        const c = stryMutAct_9fa48("526") ? c0 - dc * length : (stryCov_9fa48("526"), c0 + (stryMutAct_9fa48("527") ? dc / length : (stryCov_9fa48("527"), dc * length)));
        if (stryMutAct_9fa48("530") ? (!inside(r, c) || bridgeAt[r * size + c] !== 0) && crowded(r, c) : stryMutAct_9fa48("529") ? false : stryMutAct_9fa48("528") ? true : (stryCov_9fa48("528", "529", "530"), (stryMutAct_9fa48("532") ? !inside(r, c) && bridgeAt[r * size + c] !== 0 : stryMutAct_9fa48("531") ? false : (stryCov_9fa48("531", "532"), (stryMutAct_9fa48("533") ? inside(r, c) : (stryCov_9fa48("533"), !inside(r, c))) || (stryMutAct_9fa48("535") ? bridgeAt[r * size + c] === 0 : stryMutAct_9fa48("534") ? false : (stryCov_9fa48("534", "535"), bridgeAt[stryMutAct_9fa48("536") ? r * size - c : (stryCov_9fa48("536"), (stryMutAct_9fa48("537") ? r / size : (stryCov_9fa48("537"), r * size)) + c)] !== 0)))) || crowded(r, c))) continue;
        let clear = stryMutAct_9fa48("538") ? false : (stryCov_9fa48("538"), true);
        for (let k = 1; stryMutAct_9fa48("540") ? k < length || clear : stryMutAct_9fa48("539") ? false : (stryCov_9fa48("539", "540"), (stryMutAct_9fa48("543") ? k >= length : stryMutAct_9fa48("542") ? k <= length : stryMutAct_9fa48("541") ? true : (stryCov_9fa48("541", "542", "543"), k < length)) && clear); stryMutAct_9fa48("544") ? k-- : (stryCov_9fa48("544"), k++)) {
          if (stryMutAct_9fa48("545")) {
            {}
          } else {
            stryCov_9fa48("545");
            const at = stryMutAct_9fa48("546") ? (r0 + dr * k) * size + c0 - dc * k : (stryCov_9fa48("546"), (stryMutAct_9fa48("547") ? (r0 + dr * k) * size - c0 : (stryCov_9fa48("547"), (stryMutAct_9fa48("548") ? (r0 + dr * k) / size : (stryCov_9fa48("548"), (stryMutAct_9fa48("549") ? r0 - dr * k : (stryCov_9fa48("549"), r0 + (stryMutAct_9fa48("550") ? dr / k : (stryCov_9fa48("550"), dr * k)))) * size)) + c0)) + (stryMutAct_9fa48("551") ? dc / k : (stryCov_9fa48("551"), dc * k)));
            if (stryMutAct_9fa48("554") ? islandAt[at] !== -1 && bridgeAt[at] !== 0 : stryMutAct_9fa48("553") ? false : stryMutAct_9fa48("552") ? true : (stryCov_9fa48("552", "553", "554"), (stryMutAct_9fa48("556") ? islandAt[at] === -1 : stryMutAct_9fa48("555") ? false : (stryCov_9fa48("555", "556"), islandAt[at] !== (stryMutAct_9fa48("557") ? +1 : (stryCov_9fa48("557"), -1)))) || (stryMutAct_9fa48("559") ? bridgeAt[at] === 0 : stryMutAct_9fa48("558") ? false : (stryCov_9fa48("558", "559"), bridgeAt[at] !== 0)))) clear = stryMutAct_9fa48("560") ? true : (stryCov_9fa48("560"), false);
          }
        }
        if (stryMutAct_9fa48("563") ? false : stryMutAct_9fa48("562") ? true : stryMutAct_9fa48("561") ? clear : (stryCov_9fa48("561", "562", "563"), !clear)) continue;
        if (stryMutAct_9fa48("564")) {
          ;
        } else {
          stryCov_9fa48("564");
          addIsland(r, c);
        }
        lay(from, stryMutAct_9fa48("566") ? positions.length + 1 : (stryCov_9fa48("566"), positions.length - 1));
      }
    }

    // Close some loops between line-neighbours that are not yet joined.
    const linked = new Set(links.map(stryMutAct_9fa48("567") ? () => undefined : (stryCov_9fa48("567"), ([a, b]) => stryMutAct_9fa48("568") ? `` : (stryCov_9fa48("568"), `${stryMutAct_9fa48("569") ? Math.max(a, b) : (stryCov_9fa48("569"), Math.min(a, b))}-${stryMutAct_9fa48("570") ? Math.min(a, b) : (stryCov_9fa48("570"), Math.max(a, b))}`))));
    for (let a = 0; stryMutAct_9fa48("573") ? a >= positions.length : stryMutAct_9fa48("572") ? a <= positions.length : stryMutAct_9fa48("571") ? false : (stryCov_9fa48("571", "572", "573"), a < positions.length); stryMutAct_9fa48("574") ? a-- : (stryCov_9fa48("574"), a++)) {
      if (stryMutAct_9fa48("575")) {
        {}
      } else {
        stryCov_9fa48("575");
        for (const dir of ['right', 'down'] as const) {
          if (stryMutAct_9fa48("576")) {
            {}
          } else {
            stryCov_9fa48("576");
            const [dr, dc] = STEP[dir];
            const [r0, c0] = positions[a] as [number, number];
            let r = stryMutAct_9fa48("577") ? r0 - dr : (stryCov_9fa48("577"), r0 + dr);
            let c = stryMutAct_9fa48("578") ? c0 - dc : (stryCov_9fa48("578"), c0 + dc);
            let free = stryMutAct_9fa48("579") ? false : (stryCov_9fa48("579"), true);
            while (stryMutAct_9fa48("581") ? inside(r, c) || islandAt[r * size + c] === -1 : stryMutAct_9fa48("580") ? false : (stryCov_9fa48("580", "581"), inside(r, c) && (stryMutAct_9fa48("583") ? islandAt[r * size + c] !== -1 : stryMutAct_9fa48("582") ? true : (stryCov_9fa48("582", "583"), islandAt[stryMutAct_9fa48("584") ? r * size - c : (stryCov_9fa48("584"), (stryMutAct_9fa48("585") ? r / size : (stryCov_9fa48("585"), r * size)) + c)] === (stryMutAct_9fa48("586") ? +1 : (stryCov_9fa48("586"), -1)))))) {
              if (stryMutAct_9fa48("587")) {
                {}
              } else {
                stryCov_9fa48("587");
                if (stryMutAct_9fa48("590") ? bridgeAt[r * size + c] === 0 : stryMutAct_9fa48("589") ? false : stryMutAct_9fa48("588") ? true : (stryCov_9fa48("588", "589", "590"), bridgeAt[stryMutAct_9fa48("591") ? r * size - c : (stryCov_9fa48("591"), (stryMutAct_9fa48("592") ? r / size : (stryCov_9fa48("592"), r * size)) + c)] !== 0)) free = stryMutAct_9fa48("593") ? true : (stryCov_9fa48("593"), false);
                stryMutAct_9fa48("594") ? r -= dr : (stryCov_9fa48("594"), r += dr);
                stryMutAct_9fa48("595") ? c -= dc : (stryCov_9fa48("595"), c += dc);
              }
            }
            if (stryMutAct_9fa48("598") ? false : stryMutAct_9fa48("597") ? true : stryMutAct_9fa48("596") ? inside(r, c) : (stryCov_9fa48("596", "597", "598"), !inside(r, c))) continue;
            const b = islandAt[r * size + c] as number;
            if (stryMutAct_9fa48("601") ? !free && linked.has(`${Math.min(a, b)}-${Math.max(a, b)}`) : stryMutAct_9fa48("600") ? false : stryMutAct_9fa48("599") ? true : (stryCov_9fa48("599", "600", "601"), (stryMutAct_9fa48("602") ? free : (stryCov_9fa48("602"), !free)) || linked.has(stryMutAct_9fa48("603") ? `` : (stryCov_9fa48("603"), `${stryMutAct_9fa48("604") ? Math.max(a, b) : (stryCov_9fa48("604"), Math.min(a, b))}-${stryMutAct_9fa48("605") ? Math.min(a, b) : (stryCov_9fa48("605"), Math.max(a, b))}`)))) continue;
            if (stryMutAct_9fa48("609") ? rng.next() >= LOOP_CHANCE : stryMutAct_9fa48("608") ? rng.next() <= LOOP_CHANCE : stryMutAct_9fa48("607") ? false : stryMutAct_9fa48("606") ? true : (stryCov_9fa48("606", "607", "608", "609"), rng.next() < LOOP_CHANCE)) {
              if (stryMutAct_9fa48("610")) {
                {}
              } else {
                stryCov_9fa48("610");
                linked.add(stryMutAct_9fa48("612") ? `` : (stryCov_9fa48("612"), `${stryMutAct_9fa48("613") ? Math.max(a, b) : (stryCov_9fa48("613"), Math.min(a, b))}-${stryMutAct_9fa48("614") ? Math.min(a, b) : (stryCov_9fa48("614"), Math.max(a, b))}`));
                if (stryMutAct_9fa48("615")) {
                  ;
                } else {
                  stryCov_9fa48("615");
                  lay(a, b);
                }
              }
            }
          }
        }
      }
    }
    return stryMutAct_9fa48("616") ? {} : (stryCov_9fa48("616"), {
      size,
      positions,
      links
    });
  }
}

/** Puzzle (row-major islands with derived numbers) and its bridges per edge. */
export function puzzleFromNetwork(network: Network): {
  puzzle: Puzzle;
  solution: number[];
} {
  if (stryMutAct_9fa48("617")) {
    {}
  } else {
    stryCov_9fa48("617");
    const {
      size,
      positions,
      links
    } = network;
    const order = stryMutAct_9fa48("618") ? positions.map((_, i) => i) : (stryCov_9fa48("618"), positions.map(stryMutAct_9fa48("619") ? () => undefined : (stryCov_9fa48("619"), (_, i) => i)).sort((x, y) => {
      if (stryMutAct_9fa48("620")) {
        {}
      } else {
        stryCov_9fa48("620");
        const [r1, c1] = positions[x] as [number, number];
        const [r2, c2] = positions[y] as [number, number];
        return stryMutAct_9fa48("621") ? r1 * size + c1 + (r2 * size + c2) : (stryCov_9fa48("621"), (stryMutAct_9fa48("622") ? r1 * size - c1 : (stryCov_9fa48("622"), (stryMutAct_9fa48("623") ? r1 / size : (stryCov_9fa48("623"), r1 * size)) + c1)) - (stryMutAct_9fa48("624") ? r2 * size - c2 : (stryCov_9fa48("624"), (stryMutAct_9fa48("625") ? r2 / size : (stryCov_9fa48("625"), r2 * size)) + c2)));
      }
    }));
    const rank = stryMutAct_9fa48("626") ? new Array() : (stryCov_9fa48("626"), new Array<number>(positions.length));
    order.forEach(stryMutAct_9fa48("628") ? () => undefined : (stryCov_9fa48("628"), (placed, i) => rank[placed] = i));
    const need = (stryMutAct_9fa48("629") ? new Array() : (stryCov_9fa48("629"), new Array<number>(positions.length))).fill(0);
    for (const [a, b, k] of links) {
      if (stryMutAct_9fa48("630")) {
        {}
      } else {
        stryCov_9fa48("630");
        need[rank[a] as number] = stryMutAct_9fa48("631") ? (need[rank[a] as number] as number) - k : (stryCov_9fa48("631"), (need[rank[a] as number] as number) + k);
        need[rank[b] as number] = stryMutAct_9fa48("632") ? (need[rank[b] as number] as number) - k : (stryCov_9fa48("632"), (need[rank[b] as number] as number) + k);
      }
    }
    const islands = order.map((placed, i): Island => {
      if (stryMutAct_9fa48("633")) {
        {}
      } else {
        stryCov_9fa48("633");
        const [r, c] = positions[placed] as [number, number];
        return stryMutAct_9fa48("634") ? [] : (stryCov_9fa48("634"), [r, c, need[i] as number]);
      }
    });
    const edges = edgesOf(size, islands);
    const solution = edges.map(stryMutAct_9fa48("635") ? () => undefined : (stryCov_9fa48("635"), () => 0));
    for (const [a, b, k] of links) solution[edgeBetween(edges, rank[a] as number, rank[b] as number)] = k;
    return stryMutAct_9fa48("636") ? {} : (stryCov_9fa48("636"), {
      puzzle: stryMutAct_9fa48("637") ? {} : (stryCov_9fa48("637"), {
        size,
        islands
      }),
      solution
    });
  }
}

/**
 * Original fallback puzzles (produced once by this generator and frozen; checked by the
 * tests to be unique and logic-solvable). Used only if every seeded attempt fails.
 */
export const FALLBACK: Readonly<Record<Difficulty, {
  islands: Island[];
  solution: number[];
}>> = stryMutAct_9fa48("638") ? {} : (stryCov_9fa48("638"), {
  easy: stryMutAct_9fa48("639") ? {} : (stryCov_9fa48("639"), {
    islands: stryMutAct_9fa48("640") ? [] : (stryCov_9fa48("640"), [stryMutAct_9fa48("641") ? [] : (stryCov_9fa48("641"), [0, 0, 2]), stryMutAct_9fa48("642") ? [] : (stryCov_9fa48("642"), [0, 2, 3]), stryMutAct_9fa48("643") ? [] : (stryCov_9fa48("643"), [0, 5, 3]), stryMutAct_9fa48("644") ? [] : (stryCov_9fa48("644"), [2, 0, 2]), stryMutAct_9fa48("645") ? [] : (stryCov_9fa48("645"), [2, 3, 2]), stryMutAct_9fa48("646") ? [] : (stryCov_9fa48("646"), [5, 1, 1]), stryMutAct_9fa48("647") ? [] : (stryCov_9fa48("647"), [5, 3, 4]), stryMutAct_9fa48("648") ? [] : (stryCov_9fa48("648"), [5, 5, 3])]),
    solution: stryMutAct_9fa48("649") ? [] : (stryCov_9fa48("649"), [1, 1, 2, 1, 1, 1, 1, 2])
  }),
  medium: stryMutAct_9fa48("650") ? {} : (stryCov_9fa48("650"), {
    islands: stryMutAct_9fa48("651") ? [] : (stryCov_9fa48("651"), [stryMutAct_9fa48("652") ? [] : (stryCov_9fa48("652"), [0, 3, 1]), stryMutAct_9fa48("653") ? [] : (stryCov_9fa48("653"), [1, 0, 2]), stryMutAct_9fa48("654") ? [] : (stryCov_9fa48("654"), [1, 6, 1]), stryMutAct_9fa48("655") ? [] : (stryCov_9fa48("655"), [1, 8, 2]), stryMutAct_9fa48("656") ? [] : (stryCov_9fa48("656"), [3, 8, 4]), stryMutAct_9fa48("657") ? [] : (stryCov_9fa48("657"), [4, 0, 4]), stryMutAct_9fa48("658") ? [] : (stryCov_9fa48("658"), [4, 3, 5]), stryMutAct_9fa48("659") ? [] : (stryCov_9fa48("659"), [4, 6, 2]), stryMutAct_9fa48("660") ? [] : (stryCov_9fa48("660"), [6, 1, 2]), stryMutAct_9fa48("661") ? [] : (stryCov_9fa48("661"), [6, 3, 3]), stryMutAct_9fa48("662") ? [] : (stryCov_9fa48("662"), [6, 5, 4]), stryMutAct_9fa48("663") ? [] : (stryCov_9fa48("663"), [6, 7, 2]), stryMutAct_9fa48("664") ? [] : (stryCov_9fa48("664"), [8, 1, 2]), stryMutAct_9fa48("665") ? [] : (stryCov_9fa48("665"), [8, 5, 4]), stryMutAct_9fa48("666") ? [] : (stryCov_9fa48("666"), [8, 8, 4])]),
    solution: stryMutAct_9fa48("667") ? [] : (stryCov_9fa48("667"), [1, 0, 2, 0, 1, 2, 2, 2, 1, 1, 1, 1, 1, 2, 1, 1, 2])
  }),
  hard: stryMutAct_9fa48("668") ? {} : (stryCov_9fa48("668"), {
    islands: stryMutAct_9fa48("669") ? [] : (stryCov_9fa48("669"), [stryMutAct_9fa48("670") ? [] : (stryCov_9fa48("670"), [0, 5, 3]), stryMutAct_9fa48("671") ? [] : (stryCov_9fa48("671"), [0, 8, 3]), stryMutAct_9fa48("672") ? [] : (stryCov_9fa48("672"), [0, 10, 1]), stryMutAct_9fa48("673") ? [] : (stryCov_9fa48("673"), [1, 0, 3]), stryMutAct_9fa48("674") ? [] : (stryCov_9fa48("674"), [1, 2, 2]), stryMutAct_9fa48("675") ? [] : (stryCov_9fa48("675"), [2, 6, 1]), stryMutAct_9fa48("676") ? [] : (stryCov_9fa48("676"), [2, 8, 3]), stryMutAct_9fa48("677") ? [] : (stryCov_9fa48("677"), [2, 10, 1]), stryMutAct_9fa48("678") ? [] : (stryCov_9fa48("678"), [3, 1, 3]), stryMutAct_9fa48("679") ? [] : (stryCov_9fa48("679"), [3, 3, 2]), stryMutAct_9fa48("680") ? [] : (stryCov_9fa48("680"), [4, 9, 1]), stryMutAct_9fa48("681") ? [] : (stryCov_9fa48("681"), [5, 1, 3]), stryMutAct_9fa48("682") ? [] : (stryCov_9fa48("682"), [5, 5, 6]), stryMutAct_9fa48("683") ? [] : (stryCov_9fa48("683"), [5, 7, 1]), stryMutAct_9fa48("684") ? [] : (stryCov_9fa48("684"), [7, 0, 3]), stryMutAct_9fa48("685") ? [] : (stryCov_9fa48("685"), [7, 2, 4]), stryMutAct_9fa48("686") ? [] : (stryCov_9fa48("686"), [7, 5, 6]), stryMutAct_9fa48("687") ? [] : (stryCov_9fa48("687"), [7, 9, 2]), stryMutAct_9fa48("688") ? [] : (stryCov_9fa48("688"), [8, 7, 2]), stryMutAct_9fa48("689") ? [] : (stryCov_9fa48("689"), [9, 5, 2]), stryMutAct_9fa48("690") ? [] : (stryCov_9fa48("690"), [10, 0, 1]), stryMutAct_9fa48("691") ? [] : (stryCov_9fa48("691"), [10, 2, 3]), stryMutAct_9fa48("692") ? [] : (stryCov_9fa48("692"), [10, 7, 6]), stryMutAct_9fa48("693") ? [] : (stryCov_9fa48("693"), [10, 9, 2])]),
    solution: stryMutAct_9fa48("694") ? [] : (stryCov_9fa48("694"), [1, 2, 1, 1, 0, 2, 1, 0, 1, 1, 2, 1, 1, 2, 1, 1, 0, 1, 1, 2, 1, 1, 2, 0, 2, 0, 2, 2])
  })
});
export interface Generated {
  puzzle: Puzzle;
  solution: number[];
  /** Attempt that succeeded, or -1 for the fallback. */
  attempt: number;
}

/** One candidate for `seed`: a grown network turned into a puzzle, or `null` if rejected. */
export function candidate(seed: number, difficulty: Difficulty): {
  puzzle: Puzzle;
  solution: number[];
} | null {
  if (stryMutAct_9fa48("695")) {
    {}
  } else {
    stryCov_9fa48("695");
    const size = SIZES[difficulty];
    const [lo, hi] = ISLAND_RANGE[difficulty];
    const rng = createRng(seed);
    const network = growNetwork(rng, size, rng.int(lo, hi));
    if (stryMutAct_9fa48("699") ? network.positions.length >= lo : stryMutAct_9fa48("698") ? network.positions.length <= lo : stryMutAct_9fa48("697") ? false : stryMutAct_9fa48("696") ? true : (stryCov_9fa48("696", "697", "698", "699"), network.positions.length < lo)) return null;
    const result = puzzleFromNetwork(network);
    // Difficulty analysis: easy puzzles must yield to counting alone (no connectivity reasoning).
    if (stryMutAct_9fa48("702") ? false : stryMutAct_9fa48("701") ? true : stryMutAct_9fa48("700") ? solve(result.puzzle, {
      connectivity: difficulty !== 'easy'
    }).solved : (stryCov_9fa48("700", "701", "702"), !solve(result.puzzle, stryMutAct_9fa48("703") ? {} : (stryCov_9fa48("703"), {
      connectivity: stryMutAct_9fa48("706") ? difficulty === 'easy' : stryMutAct_9fa48("705") ? false : stryMutAct_9fa48("704") ? true : (stryCov_9fa48("704", "705", "706"), difficulty !== (stryMutAct_9fa48("707") ? "" : (stryCov_9fa48("707"), 'easy')))
    })).solved)) return null;
    return result;
  }
}

/** The seeded puzzle for a difficulty: unique and solvable without guessing. */
export function generatePuzzle(seed: number, difficulty: Difficulty, maxAttempts = MAX_ATTEMPTS): Generated {
  if (stryMutAct_9fa48("708")) {
    {}
  } else {
    stryCov_9fa48("708");
    for (let attempt = 0; stryMutAct_9fa48("711") ? attempt >= maxAttempts : stryMutAct_9fa48("710") ? attempt <= maxAttempts : stryMutAct_9fa48("709") ? false : (stryCov_9fa48("709", "710", "711"), attempt < maxAttempts); stryMutAct_9fa48("712") ? attempt-- : (stryCov_9fa48("712"), attempt++)) {
      if (stryMutAct_9fa48("713")) {
        {}
      } else {
        stryCov_9fa48("713");
        const found = candidate(attemptSeed(seed >>> 0, attempt), difficulty);
        if (stryMutAct_9fa48("715") ? false : stryMutAct_9fa48("714") ? true : (stryCov_9fa48("714", "715"), found)) return stryMutAct_9fa48("716") ? {} : (stryCov_9fa48("716"), {
          ...found,
          attempt
        });
      }
    }
    const fallback = FALLBACK[difficulty];
    return stryMutAct_9fa48("717") ? {} : (stryCov_9fa48("717"), {
      puzzle: stryMutAct_9fa48("718") ? {} : (stryCov_9fa48("718"), {
        size: SIZES[difficulty],
        islands: fallback.islands.map(stryMutAct_9fa48("719") ? () => undefined : (stryCov_9fa48("719"), i => [...i] as Island))
      }),
      solution: stryMutAct_9fa48("720") ? [] : (stryCov_9fa48("720"), [...fallback.solution]),
      attempt: stryMutAct_9fa48("721") ? +1 : (stryCov_9fa48("721"), -1)
    });
  }
}

// --- Game state ----------------------------------------------------------------------------

export function createInitialState(seed: number, difficulty: Difficulty = DEFAULT_DIFFICULTY): BridgesState {
  if (stryMutAct_9fa48("722")) {
    {}
  } else {
    stryCov_9fa48("722");
    const generated = generatePuzzle(seed >>> 0, difficulty);
    return stryMutAct_9fa48("723") ? {} : (stryCov_9fa48("723"), {
      seed: seed >>> 0,
      difficulty,
      size: SIZES[difficulty],
      islands: generated.puzzle.islands,
      solution: generated.solution,
      bridges: generated.solution.map(stryMutAct_9fa48("724") ? () => undefined : (stryCov_9fa48("724"), () => 0)),
      history: stryMutAct_9fa48("725") ? ["Stryker was here"] : (stryCov_9fa48("725"), []),
      moves: 0,
      checks: 0,
      lastCheck: null
    });
  }
}
export const puzzleOf = stryMutAct_9fa48("726") ? () => undefined : (stryCov_9fa48("726"), (() => {
  const puzzleOf = (state: Pick<BridgesState, 'size' | 'islands'>): Puzzle => stryMutAct_9fa48("727") ? {} : (stryCov_9fa48("727"), {
    size: state.size,
    islands: state.islands
  });
  return puzzleOf;
})());

/** Solved when every number is met, nothing crosses and all islands form one group. */
export function isSolved(state: Pick<BridgesState, 'size' | 'islands' | 'bridges'>): boolean {
  if (stryMutAct_9fa48("728")) {
    {}
  } else {
    stryCov_9fa48("728");
    return isSolution(puzzleOf(state), state.bridges);
  }
}

/** Bridges each island currently has. */
export function islandDegrees(state: Pick<BridgesState, 'size' | 'islands' | 'bridges'>): number[] {
  if (stryMutAct_9fa48("729")) {
    {}
  } else {
    stryCov_9fa48("729");
    return degrees(state.islands.length, edgesOf(state.size, state.islands), state.bridges);
  }
}

/** Number of islands whose bridge count equals their number. */
export function satisfiedCount(state: Pick<BridgesState, 'size' | 'islands' | 'bridges'>): number {
  if (stryMutAct_9fa48("730")) {
    {}
  } else {
    stryCov_9fa48("730");
    const deg = islandDegrees(state);
    return stryMutAct_9fa48("731") ? state.islands.length : (stryCov_9fa48("731"), state.islands.filter(stryMutAct_9fa48("732") ? () => undefined : (stryCov_9fa48("732"), ([,, need], i) => stryMutAct_9fa48("735") ? deg[i] !== need : stryMutAct_9fa48("734") ? false : stryMutAct_9fa48("733") ? true : (stryCov_9fa48("733", "734", "735"), deg[i] === need))).length);
  }
}

/** The next count when cycling: 0 → 1 → 2 → 0. */
export const nextCount = stryMutAct_9fa48("736") ? () => undefined : (stryCov_9fa48("736"), (() => {
  const nextCount = (count: number): number => stryMutAct_9fa48("737") ? (count + 1) * (MAX_BRIDGES + 1) : (stryCov_9fa48("737"), (stryMutAct_9fa48("738") ? count - 1 : (stryCov_9fa48("738"), count + 1)) % (stryMutAct_9fa48("739") ? MAX_BRIDGES - 1 : (stryCov_9fa48("739"), MAX_BRIDGES + 1)));
  return nextCount;
})());
export type BridgeOutcome = 'ok' | 'finished' | 'noEdge' | 'blocked';

/** Why `cycleBridge` would refuse (or `ok`). */
export function cycleOutcome(state: BridgesState, edge: number): BridgeOutcome {
  if (stryMutAct_9fa48("740")) {
    {}
  } else {
    stryCov_9fa48("740");
    if (stryMutAct_9fa48("742") ? false : stryMutAct_9fa48("741") ? true : (stryCov_9fa48("741", "742"), isSolved(state))) return stryMutAct_9fa48("743") ? "" : (stryCov_9fa48("743"), 'finished');
    const edges = edgesOf(state.size, state.islands);
    if (stryMutAct_9fa48("746") ? (!Number.isInteger(edge) || edge < 0) && edge >= edges.length : stryMutAct_9fa48("745") ? false : stryMutAct_9fa48("744") ? true : (stryCov_9fa48("744", "745", "746"), (stryMutAct_9fa48("748") ? !Number.isInteger(edge) && edge < 0 : stryMutAct_9fa48("747") ? false : (stryCov_9fa48("747", "748"), (stryMutAct_9fa48("749") ? Number.isInteger(edge) : (stryCov_9fa48("749"), !Number.isInteger(edge))) || (stryMutAct_9fa48("752") ? edge >= 0 : stryMutAct_9fa48("751") ? edge <= 0 : stryMutAct_9fa48("750") ? false : (stryCov_9fa48("750", "751", "752"), edge < 0)))) || (stryMutAct_9fa48("755") ? edge < edges.length : stryMutAct_9fa48("754") ? edge > edges.length : stryMutAct_9fa48("753") ? false : (stryCov_9fa48("753", "754", "755"), edge >= edges.length)))) return stryMutAct_9fa48("756") ? "" : (stryCov_9fa48("756"), 'noEdge');
    if (stryMutAct_9fa48("759") ? state.bridges[edge] as number === 0 || blockingEdge(state.islands, edges, state.bridges, edge) >= 0 : stryMutAct_9fa48("758") ? false : stryMutAct_9fa48("757") ? true : (stryCov_9fa48("757", "758", "759"), (stryMutAct_9fa48("761") ? state.bridges[edge] as number !== 0 : stryMutAct_9fa48("760") ? true : (stryCov_9fa48("760", "761"), state.bridges[edge] as number === 0)) && (stryMutAct_9fa48("764") ? blockingEdge(state.islands, edges, state.bridges, edge) < 0 : stryMutAct_9fa48("763") ? blockingEdge(state.islands, edges, state.bridges, edge) > 0 : stryMutAct_9fa48("762") ? true : (stryCov_9fa48("762", "763", "764"), blockingEdge(state.islands, edges, state.bridges, edge) >= 0)))) return stryMutAct_9fa48("765") ? "" : (stryCov_9fa48("765"), 'blocked');
    return stryMutAct_9fa48("766") ? "" : (stryCov_9fa48("766"), 'ok');
  }
}

/** Cycles the bridges on an edge (0 → 1 → 2 → 0). Returns the same object when refused. */
export function cycleBridge(state: BridgesState, edge: number): BridgesState {
  if (stryMutAct_9fa48("767")) {
    {}
  } else {
    stryCov_9fa48("767");
    if (stryMutAct_9fa48("770") ? cycleOutcome(state, edge) === 'ok' : stryMutAct_9fa48("769") ? false : stryMutAct_9fa48("768") ? true : (stryCov_9fa48("768", "769", "770"), cycleOutcome(state, edge) !== (stryMutAct_9fa48("771") ? "" : (stryCov_9fa48("771"), 'ok')))) return state;
    const previous = state.bridges[edge] as number;
    const bridges = stryMutAct_9fa48("772") ? [] : (stryCov_9fa48("772"), [...state.bridges]);
    bridges[edge] = nextCount(previous);
    const history: [number, number][] = stryMutAct_9fa48("773") ? [] : (stryCov_9fa48("773"), [...state.history, stryMutAct_9fa48("774") ? [] : (stryCov_9fa48("774"), [edge, previous])]);
    if (stryMutAct_9fa48("778") ? history.length <= MAX_HISTORY : stryMutAct_9fa48("777") ? history.length >= MAX_HISTORY : stryMutAct_9fa48("776") ? false : stryMutAct_9fa48("775") ? true : (stryCov_9fa48("775", "776", "777", "778"), history.length > MAX_HISTORY)) history.splice(0, stryMutAct_9fa48("780") ? history.length + MAX_HISTORY : (stryCov_9fa48("780"), history.length - MAX_HISTORY));
    return stryMutAct_9fa48("781") ? {} : (stryCov_9fa48("781"), {
      ...state,
      bridges,
      history,
      moves: stryMutAct_9fa48("782") ? state.moves - 1 : (stryCov_9fa48("782"), state.moves + 1),
      lastCheck: null
    });
  }
}
export const canUndo = stryMutAct_9fa48("783") ? () => undefined : (stryCov_9fa48("783"), (() => {
  const canUndo = (state: BridgesState): boolean => stryMutAct_9fa48("786") ? state.history.length > 0 || !isSolved(state) : stryMutAct_9fa48("785") ? false : stryMutAct_9fa48("784") ? true : (stryCov_9fa48("784", "785", "786"), (stryMutAct_9fa48("789") ? state.history.length <= 0 : stryMutAct_9fa48("788") ? state.history.length >= 0 : stryMutAct_9fa48("787") ? true : (stryCov_9fa48("787", "788", "789"), state.history.length > 0)) && (stryMutAct_9fa48("790") ? isSolved(state) : (stryCov_9fa48("790"), !isSolved(state))));
  return canUndo;
})());

/** Reverts the latest bridge change. */
export function undo(state: BridgesState): BridgesState {
  if (stryMutAct_9fa48("791")) {
    {}
  } else {
    stryCov_9fa48("791");
    if (stryMutAct_9fa48("794") ? false : stryMutAct_9fa48("793") ? true : stryMutAct_9fa48("792") ? canUndo(state) : (stryCov_9fa48("792", "793", "794"), !canUndo(state))) return state;
    const history = stryMutAct_9fa48("795") ? state.history : (stryCov_9fa48("795"), state.history.slice(0, stryMutAct_9fa48("796") ? +1 : (stryCov_9fa48("796"), -1)));
    const [edge, previous] = state.history[state.history.length - 1] as [number, number];
    const bridges = stryMutAct_9fa48("797") ? [] : (stryCov_9fa48("797"), [...state.bridges]);
    bridges[edge] = previous;
    return stryMutAct_9fa48("798") ? {} : (stryCov_9fa48("798"), {
      ...state,
      bridges,
      history,
      lastCheck: null
    });
  }
}

/** Edges carrying more bridges than the solution. */
export function wrongBridges(state: Pick<BridgesState, 'bridges' | 'solution'>): number {
  if (stryMutAct_9fa48("799")) {
    {}
  } else {
    stryCov_9fa48("799");
    return stryMutAct_9fa48("800") ? state.bridges.length : (stryCov_9fa48("800"), state.bridges.filter(stryMutAct_9fa48("801") ? () => undefined : (stryCov_9fa48("801"), (k, e) => stryMutAct_9fa48("805") ? k <= (state.solution[e] as number) : stryMutAct_9fa48("804") ? k >= (state.solution[e] as number) : stryMutAct_9fa48("803") ? false : stryMutAct_9fa48("802") ? true : (stryCov_9fa48("802", "803", "804", "805"), k > (state.solution[e] as number)))).length);
  }
}

/** Counts wrong bridges without revealing where they are. */
export function check(state: BridgesState): BridgesState {
  if (stryMutAct_9fa48("806")) {
    {}
  } else {
    stryCov_9fa48("806");
    if (stryMutAct_9fa48("808") ? false : stryMutAct_9fa48("807") ? true : (stryCov_9fa48("807", "808"), isSolved(state))) return state;
    return stryMutAct_9fa48("809") ? {} : (stryCov_9fa48("809"), {
      ...state,
      checks: stryMutAct_9fa48("810") ? state.checks - 1 : (stryCov_9fa48("810"), state.checks + 1),
      lastCheck: wrongBridges(state)
    });
  }
}

// --- Validation ----------------------------------------------------------------------------

const isCounter = stryMutAct_9fa48("811") ? () => undefined : (stryCov_9fa48("811"), (() => {
  const isCounter = (value: unknown): value is number => isInt(value, 0, MAX_COUNTER);
  return isCounter;
})());

/** True when islands are row-major, in range, need 1–8 and never touch (Chebyshev ≥ 2). */
export function isValidLayout(size: number, islands: unknown): islands is Island[] {
  if (stryMutAct_9fa48("812")) {
    {}
  } else {
    stryCov_9fa48("812");
    if (stryMutAct_9fa48("815") ? (!Array.isArray(islands) || islands.length < 2) && islands.length > size * size : stryMutAct_9fa48("814") ? false : stryMutAct_9fa48("813") ? true : (stryCov_9fa48("813", "814", "815"), (stryMutAct_9fa48("817") ? !Array.isArray(islands) && islands.length < 2 : stryMutAct_9fa48("816") ? false : (stryCov_9fa48("816", "817"), (stryMutAct_9fa48("818") ? Array.isArray(islands) : (stryCov_9fa48("818"), !Array.isArray(islands))) || (stryMutAct_9fa48("821") ? islands.length >= 2 : stryMutAct_9fa48("820") ? islands.length <= 2 : stryMutAct_9fa48("819") ? false : (stryCov_9fa48("819", "820", "821"), islands.length < 2)))) || (stryMutAct_9fa48("824") ? islands.length <= size * size : stryMutAct_9fa48("823") ? islands.length >= size * size : stryMutAct_9fa48("822") ? false : (stryCov_9fa48("822", "823", "824"), islands.length > (stryMutAct_9fa48("825") ? size / size : (stryCov_9fa48("825"), size * size)))))) return stryMutAct_9fa48("826") ? true : (stryCov_9fa48("826"), false);
    let previous = stryMutAct_9fa48("827") ? +1 : (stryCov_9fa48("827"), -1);
    for (const island of islands) {
      if (stryMutAct_9fa48("828")) {
        {}
      } else {
        stryCov_9fa48("828");
        if (stryMutAct_9fa48("831") ? !Array.isArray(island) && island.length !== 3 : stryMutAct_9fa48("830") ? false : stryMutAct_9fa48("829") ? true : (stryCov_9fa48("829", "830", "831"), (stryMutAct_9fa48("832") ? Array.isArray(island) : (stryCov_9fa48("832"), !Array.isArray(island))) || (stryMutAct_9fa48("834") ? island.length === 3 : stryMutAct_9fa48("833") ? false : (stryCov_9fa48("833", "834"), island.length !== 3)))) return stryMutAct_9fa48("835") ? true : (stryCov_9fa48("835"), false);
        const [r, c, need] = island as unknown[];
        if (stryMutAct_9fa48("838") ? (!isInt(r, 0, size - 1) || !isInt(c, 0, size - 1)) && !isInt(need, 1, 4 * MAX_BRIDGES) : stryMutAct_9fa48("837") ? false : stryMutAct_9fa48("836") ? true : (stryCov_9fa48("836", "837", "838"), (stryMutAct_9fa48("840") ? !isInt(r, 0, size - 1) && !isInt(c, 0, size - 1) : stryMutAct_9fa48("839") ? false : (stryCov_9fa48("839", "840"), (stryMutAct_9fa48("841") ? isInt(r, 0, size - 1) : (stryCov_9fa48("841"), !isInt(r, 0, stryMutAct_9fa48("842") ? size + 1 : (stryCov_9fa48("842"), size - 1)))) || (stryMutAct_9fa48("843") ? isInt(c, 0, size - 1) : (stryCov_9fa48("843"), !isInt(c, 0, stryMutAct_9fa48("844") ? size + 1 : (stryCov_9fa48("844"), size - 1)))))) || (stryMutAct_9fa48("845") ? isInt(need, 1, 4 * MAX_BRIDGES) : (stryCov_9fa48("845"), !isInt(need, 1, stryMutAct_9fa48("846") ? 4 / MAX_BRIDGES : (stryCov_9fa48("846"), 4 * MAX_BRIDGES)))))) return stryMutAct_9fa48("847") ? true : (stryCov_9fa48("847"), false);
        const at = stryMutAct_9fa48("848") ? r * size - c : (stryCov_9fa48("848"), (stryMutAct_9fa48("849") ? r / size : (stryCov_9fa48("849"), r * size)) + c);
        if (stryMutAct_9fa48("853") ? at > previous : stryMutAct_9fa48("852") ? at < previous : stryMutAct_9fa48("851") ? false : stryMutAct_9fa48("850") ? true : (stryCov_9fa48("850", "851", "852", "853"), at <= previous)) return stryMutAct_9fa48("854") ? true : (stryCov_9fa48("854"), false);
        previous = at;
      }
    }
    const list = islands as Island[];
    for (let i = 0; stryMutAct_9fa48("857") ? i >= list.length : stryMutAct_9fa48("856") ? i <= list.length : stryMutAct_9fa48("855") ? false : (stryCov_9fa48("855", "856", "857"), i < list.length); stryMutAct_9fa48("858") ? i-- : (stryCov_9fa48("858"), i++)) {
      if (stryMutAct_9fa48("859")) {
        {}
      } else {
        stryCov_9fa48("859");
        for (let j = stryMutAct_9fa48("860") ? i - 1 : (stryCov_9fa48("860"), i + 1); stryMutAct_9fa48("863") ? j >= list.length : stryMutAct_9fa48("862") ? j <= list.length : stryMutAct_9fa48("861") ? false : (stryCov_9fa48("861", "862", "863"), j < list.length); stryMutAct_9fa48("864") ? j-- : (stryCov_9fa48("864"), j++)) {
          if (stryMutAct_9fa48("865")) {
            {}
          } else {
            stryCov_9fa48("865");
            const [r1, c1] = list[i] as Island;
            const [r2, c2] = list[j] as Island;
            if (stryMutAct_9fa48("869") ? Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2)) >= 2 : stryMutAct_9fa48("868") ? Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2)) <= 2 : stryMutAct_9fa48("867") ? false : stryMutAct_9fa48("866") ? true : (stryCov_9fa48("866", "867", "868", "869"), (stryMutAct_9fa48("870") ? Math.min(Math.abs(r1 - r2), Math.abs(c1 - c2)) : (stryCov_9fa48("870"), Math.max(Math.abs(stryMutAct_9fa48("871") ? r1 + r2 : (stryCov_9fa48("871"), r1 - r2)), Math.abs(stryMutAct_9fa48("872") ? c1 + c2 : (stryCov_9fa48("872"), c1 - c2))))) < 2)) return stryMutAct_9fa48("873") ? true : (stryCov_9fa48("873"), false);
          }
        }
      }
    }
    return stryMutAct_9fa48("874") ? false : (stryCov_9fa48("874"), true);
  }
}
const isCountList = stryMutAct_9fa48("875") ? () => undefined : (stryCov_9fa48("875"), (() => {
  const isCountList = (value: unknown, length: number): value is number[] => stryMutAct_9fa48("878") ? Array.isArray(value) && value.length === length || value.every(k => isInt(k, 0, MAX_BRIDGES)) : stryMutAct_9fa48("877") ? false : stryMutAct_9fa48("876") ? true : (stryCov_9fa48("876", "877", "878"), (stryMutAct_9fa48("880") ? Array.isArray(value) || value.length === length : stryMutAct_9fa48("879") ? true : (stryCov_9fa48("879", "880"), Array.isArray(value) && (stryMutAct_9fa48("882") ? value.length !== length : stryMutAct_9fa48("881") ? true : (stryCov_9fa48("881", "882"), value.length === length)))) && (stryMutAct_9fa48("883") ? value.some(k => isInt(k, 0, MAX_BRIDGES)) : (stryCov_9fa48("883"), value.every(stryMutAct_9fa48("884") ? () => undefined : (stryCov_9fa48("884"), k => isInt(k, 0, MAX_BRIDGES))))));
  return isCountList;
})());

/** Structural validation of untrusted saves. Never throws. */
export function isBridgesState(value: unknown): value is BridgesState {
  if (stryMutAct_9fa48("885")) {
    {}
  } else {
    stryCov_9fa48("885");
    try {
      if (stryMutAct_9fa48("886")) {
        {}
      } else {
        stryCov_9fa48("886");
        if (stryMutAct_9fa48("889") ? false : stryMutAct_9fa48("888") ? true : stryMutAct_9fa48("887") ? isRecord(value) : (stryCov_9fa48("887", "888", "889"), !isRecord(value))) return stryMutAct_9fa48("890") ? true : (stryCov_9fa48("890"), false);
        const v = value;
        if (stryMutAct_9fa48("893") ? !isUint32(v.seed) && !isOneOf(v.difficulty, DIFFICULTIES) : stryMutAct_9fa48("892") ? false : stryMutAct_9fa48("891") ? true : (stryCov_9fa48("891", "892", "893"), (stryMutAct_9fa48("894") ? isUint32(v.seed) : (stryCov_9fa48("894"), !isUint32(v.seed))) || (stryMutAct_9fa48("895") ? isOneOf(v.difficulty, DIFFICULTIES) : (stryCov_9fa48("895"), !isOneOf(v.difficulty, DIFFICULTIES))))) return stryMutAct_9fa48("896") ? true : (stryCov_9fa48("896"), false);
        const size = SIZES[v.difficulty];
        if (stryMutAct_9fa48("899") ? v.size !== size && !isValidLayout(size, v.islands) : stryMutAct_9fa48("898") ? false : stryMutAct_9fa48("897") ? true : (stryCov_9fa48("897", "898", "899"), (stryMutAct_9fa48("901") ? v.size === size : stryMutAct_9fa48("900") ? false : (stryCov_9fa48("900", "901"), v.size !== size)) || (stryMutAct_9fa48("902") ? isValidLayout(size, v.islands) : (stryCov_9fa48("902"), !isValidLayout(size, v.islands))))) return stryMutAct_9fa48("903") ? true : (stryCov_9fa48("903"), false);
        const islands = v.islands as Island[];
        const edges = edgesOf(size, islands);
        if (stryMutAct_9fa48("906") ? !isCountList(v.solution, edges.length) && !isCountList(v.bridges, edges.length) : stryMutAct_9fa48("905") ? false : stryMutAct_9fa48("904") ? true : (stryCov_9fa48("904", "905", "906"), (stryMutAct_9fa48("907") ? isCountList(v.solution, edges.length) : (stryCov_9fa48("907"), !isCountList(v.solution, edges.length))) || (stryMutAct_9fa48("908") ? isCountList(v.bridges, edges.length) : (stryCov_9fa48("908"), !isCountList(v.bridges, edges.length))))) return stryMutAct_9fa48("909") ? true : (stryCov_9fa48("909"), false);
        const bridges = v.bridges as number[];
        for (let e = 0; stryMutAct_9fa48("912") ? e >= edges.length : stryMutAct_9fa48("911") ? e <= edges.length : stryMutAct_9fa48("910") ? false : (stryCov_9fa48("910", "911", "912"), e < edges.length); stryMutAct_9fa48("913") ? e-- : (stryCov_9fa48("913"), e++)) {
          if (stryMutAct_9fa48("914")) {
            {}
          } else {
            stryCov_9fa48("914");
            if (stryMutAct_9fa48("917") ? bridges[e] as number > 0 || blockingEdge(islands, edges, bridges, e) >= 0 : stryMutAct_9fa48("916") ? false : stryMutAct_9fa48("915") ? true : (stryCov_9fa48("915", "916", "917"), (stryMutAct_9fa48("920") ? bridges[e] as number <= 0 : stryMutAct_9fa48("919") ? bridges[e] as number >= 0 : stryMutAct_9fa48("918") ? true : (stryCov_9fa48("918", "919", "920"), bridges[e] as number > 0)) && (stryMutAct_9fa48("923") ? blockingEdge(islands, edges, bridges, e) < 0 : stryMutAct_9fa48("922") ? blockingEdge(islands, edges, bridges, e) > 0 : stryMutAct_9fa48("921") ? true : (stryCov_9fa48("921", "922", "923"), blockingEdge(islands, edges, bridges, e) >= 0)))) return stryMutAct_9fa48("924") ? true : (stryCov_9fa48("924"), false);
          }
        }
        if (stryMutAct_9fa48("927") ? !Array.isArray(v.history) && v.history.length > MAX_HISTORY : stryMutAct_9fa48("926") ? false : stryMutAct_9fa48("925") ? true : (stryCov_9fa48("925", "926", "927"), (stryMutAct_9fa48("928") ? Array.isArray(v.history) : (stryCov_9fa48("928"), !Array.isArray(v.history))) || (stryMutAct_9fa48("931") ? v.history.length <= MAX_HISTORY : stryMutAct_9fa48("930") ? v.history.length >= MAX_HISTORY : stryMutAct_9fa48("929") ? false : (stryCov_9fa48("929", "930", "931"), v.history.length > MAX_HISTORY)))) return stryMutAct_9fa48("932") ? true : (stryCov_9fa48("932"), false);
        for (const entry of v.history as unknown[]) {
          if (stryMutAct_9fa48("933")) {
            {}
          } else {
            stryCov_9fa48("933");
            if (stryMutAct_9fa48("936") ? (!Array.isArray(entry) || entry.length !== 2 || !isInt(entry[0], 0, edges.length - 1)) && !isInt(entry[1], 0, MAX_BRIDGES) : stryMutAct_9fa48("935") ? false : stryMutAct_9fa48("934") ? true : (stryCov_9fa48("934", "935", "936"), (stryMutAct_9fa48("938") ? (!Array.isArray(entry) || entry.length !== 2) && !isInt(entry[0], 0, edges.length - 1) : stryMutAct_9fa48("937") ? false : (stryCov_9fa48("937", "938"), (stryMutAct_9fa48("940") ? !Array.isArray(entry) && entry.length !== 2 : stryMutAct_9fa48("939") ? false : (stryCov_9fa48("939", "940"), (stryMutAct_9fa48("941") ? Array.isArray(entry) : (stryCov_9fa48("941"), !Array.isArray(entry))) || (stryMutAct_9fa48("943") ? entry.length === 2 : stryMutAct_9fa48("942") ? false : (stryCov_9fa48("942", "943"), entry.length !== 2)))) || (stryMutAct_9fa48("944") ? isInt(entry[0], 0, edges.length - 1) : (stryCov_9fa48("944"), !isInt(entry[0], 0, stryMutAct_9fa48("945") ? edges.length + 1 : (stryCov_9fa48("945"), edges.length - 1)))))) || (stryMutAct_9fa48("946") ? isInt(entry[1], 0, MAX_BRIDGES) : (stryCov_9fa48("946"), !isInt(entry[1], 0, MAX_BRIDGES))))) return stryMutAct_9fa48("947") ? true : (stryCov_9fa48("947"), false);
          }
        }
        if (stryMutAct_9fa48("950") ? (!isCounter(v.moves) || !isCounter(v.checks)) && v.history.length > v.moves : stryMutAct_9fa48("949") ? false : stryMutAct_9fa48("948") ? true : (stryCov_9fa48("948", "949", "950"), (stryMutAct_9fa48("952") ? !isCounter(v.moves) && !isCounter(v.checks) : stryMutAct_9fa48("951") ? false : (stryCov_9fa48("951", "952"), (stryMutAct_9fa48("953") ? isCounter(v.moves) : (stryCov_9fa48("953"), !isCounter(v.moves))) || (stryMutAct_9fa48("954") ? isCounter(v.checks) : (stryCov_9fa48("954"), !isCounter(v.checks))))) || (stryMutAct_9fa48("957") ? v.history.length <= v.moves : stryMutAct_9fa48("956") ? v.history.length >= v.moves : stryMutAct_9fa48("955") ? false : (stryCov_9fa48("955", "956", "957"), v.history.length > v.moves)))) return stryMutAct_9fa48("958") ? true : (stryCov_9fa48("958"), false);
        if (stryMutAct_9fa48("961") ? v.lastCheck !== null || !isInt(v.lastCheck, 0, edges.length) : stryMutAct_9fa48("960") ? false : stryMutAct_9fa48("959") ? true : (stryCov_9fa48("959", "960", "961"), (stryMutAct_9fa48("963") ? v.lastCheck === null : stryMutAct_9fa48("962") ? true : (stryCov_9fa48("962", "963"), v.lastCheck !== null)) && (stryMutAct_9fa48("964") ? isInt(v.lastCheck, 0, edges.length) : (stryCov_9fa48("964"), !isInt(v.lastCheck, 0, edges.length))))) return stryMutAct_9fa48("965") ? true : (stryCov_9fa48("965"), false);
        const puzzle = stryMutAct_9fa48("966") ? {} : (stryCov_9fa48("966"), {
          size,
          islands
        });
        const solution = v.solution as number[];
        if (stryMutAct_9fa48("969") ? false : stryMutAct_9fa48("968") ? true : stryMutAct_9fa48("967") ? isSolution(puzzle, solution) : (stryCov_9fa48("967", "968", "969"), !isSolution(puzzle, solution))) return stryMutAct_9fa48("970") ? true : (stryCov_9fa48("970"), false);
        const solved = solve(puzzle);
        return stryMutAct_9fa48("973") ? solved.solved || solved.min.every((k, e) => k === solution[e]) : stryMutAct_9fa48("972") ? false : stryMutAct_9fa48("971") ? true : (stryCov_9fa48("971", "972", "973"), solved.solved && (stryMutAct_9fa48("974") ? solved.min.some((k, e) => k === solution[e]) : (stryCov_9fa48("974"), solved.min.every(stryMutAct_9fa48("975") ? () => undefined : (stryCov_9fa48("975"), (k, e) => stryMutAct_9fa48("978") ? k !== solution[e] : stryMutAct_9fa48("977") ? false : stryMutAct_9fa48("976") ? true : (stryCov_9fa48("976", "977", "978"), k === solution[e]))))));
      }
    } catch {
      if (stryMutAct_9fa48("979")) {
        {}
      } else {
        stryCov_9fa48("979");
        return stryMutAct_9fa48("980") ? true : (stryCov_9fa48("980"), false);
      }
    }
  }
}