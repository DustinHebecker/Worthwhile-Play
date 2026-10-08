/**
 * Computer opponent, written from scratch: knowledge-based evaluation + alpha-beta search
 * + human-like move choice. Pure and deterministic: the same game state (including the
 * stored PRNG state) always yields the same move, because the search is limited by a
 * NODE budget, never by wall-clock time.
 *
 * Search: negamax alpha-beta with principal-variation search, iterative deepening,
 * quiescence search (captures and promotions), check extension, null-move pruning,
 * late-move reductions, a small transposition table (cleared before every decision so
 * the result never depends on earlier searches), and move ordering by hash move,
 * MVV-LVA, two killer moves per ply and a history table.
 *
 * Evaluation (white's point of view, tapered between middlegame and endgame by the
 * remaining non-pawn material) is a sum of named knowledge terms; see `TERMS`. Each
 * strength level switches a subset of them on. The same terms explain moves ("Why?").
 *
 * Move choice: the root search scores every move whose value lies within `margin`
 * centipawns of the best one exactly; one of those candidates is drawn with a seeded
 * softmax at the level's `temperature`. Lower levels sometimes decide with a one-ply
 * "glance" (they look at the position right after their move and do not consider the
 * reply), the typical human oversight of a hanging piece or a defended target; such a
 * glance is only accepted when the full search confirms it loses at most `blunderCap`.
 */
import { createRngFromState, type Rng } from '@wp/game-core';
import {
  BISHOP,
  BLACK,
  FLAG_CASTLE_K,
  FLAG_CASTLE_Q,
  FLAG_EP,
  KING,
  KING_TARGETS,
  KNIGHT,
  KNIGHT_TARGETS,
  PAWN,
  QUEEN,
  RAYS,
  ROOK,
  WHITE,
  fileOf,
  hasLegalMove,
  inCheck,
  isComputerTurn,
  legalMoves,
  makeMove,
  makeNullMove,
  moveFlag,
  moveFrom,
  movePromo,
  moveTo,
  moveToUci,
  parseFen,
  pseudoMoves,
  puzzleOf,
  rankOf,
  replayState,
  unmakeMove,
  unmakeNullMove,
  uciToMove,
  type ChessState,
  type Difficulty,
  type Position,
  type Side
} from './rules';

/* ------------------------------------------------------------------------ */
/* Evaluation                                                                 */
/* ------------------------------------------------------------------------ */

export const TERMS = [
  'material',
  'placement',
  'development',
  'castling',
  'centre',
  'kingSafety',
  'pawnStructure',
  'passedPawns',
  'mobility',
  'bishopPair',
  'rooks',
  'outposts',
  'threats',
  'kingActivity',
  'mopUp',
  'tempo'
] as const;
export type Term = (typeof TERMS)[number];

const T_MATERIAL = 0;
const T_PLACEMENT = 1;
const T_DEVELOPMENT = 2;
const T_CASTLING = 3;
const T_CENTRE = 4;
const T_KING_SAFETY = 5;
const T_PAWNS = 6;
const T_PASSED = 7;
const T_MOBILITY = 8;
const T_BISHOP_PAIR = 9;
const T_ROOKS = 10;
const T_OUTPOSTS = 11;
const T_THREATS = 12;
const T_KING_ACTIVITY = 13;
const T_MOP_UP = 14;
const T_TEMPO = 15;
const TERM_COUNT = TERMS.length;
/** Extra feature bit: scale down scores of material balances that are known to be drawish. */
export const FEATURE_SCALING = 1 << TERM_COUNT;

export const featureMask = (terms: readonly Term[], scaling = false): number =>
  terms.reduce((mask, term) => mask | (1 << TERMS.indexOf(term)), scaling ? FEATURE_SCALING : 0);
export const ALL_FEATURES = featureMask(TERMS, true);

/** Piece values [type] for middlegame and endgame (centipawns). */
export const VALUE_MG = [0, 100, 320, 330, 500, 950, 0] as const;
export const VALUE_EG = [0, 120, 300, 320, 530, 950, 0] as const;
/** Values used for exchanges and explanations. */
export const PIECE_VALUE = [0, 100, 320, 330, 500, 950, 20000] as const;
const PHASE_WEIGHT = [0, 0, 1, 1, 2, 4, 0] as const;
const MAX_PHASE = 24;

const centreDistance = (sq: number): number => Math.max(Math.abs(fileOf(sq) * 2 - 7), Math.abs(rankOf(sq) * 2 - 7)) >> 1; // 0 (centre) … 3 (edge)
const centreManhattan = (sq: number): number => {
  const f = fileOf(sq);
  const r = rankOf(sq);
  return (f < 4 ? 3 - f : f - 4) + (r < 4 ? 3 - r : r - 4); // 0 … 6
};
const kingDistance = (a: number, b: number): number => Math.max(Math.abs(fileOf(a) - fileOf(b)), Math.abs(rankOf(a) - rankOf(b)));

/** Placement tables (white's view, a1 = 0), built from simple formulas instead of tuned tables. */
const PLACEMENT_MG: readonly Int16Array[] = [];
const PLACEMENT_EG: readonly Int16Array[] = [];
(() => {
  const mg: Int16Array[] = [];
  const eg: Int16Array[] = [];
  for (let type = 0; type <= KING; type++) {
    const m = new Int16Array(64);
    const e = new Int16Array(64);
    for (let sq = 0; sq < 64; sq++) {
      const f = fileOf(sq);
      const r = rankOf(sq);
      const centre = 3 - centreDistance(sq); // 0 … 3
      switch (type) {
        case PAWN:
          m[sq] = (r - 1) * 2 + (f >= 2 && f <= 5 ? (r - 1) * 3 : 0);
          e[sq] = (r - 1) * 6;
          break;
        case KNIGHT:
          m[sq] = centre * 10 - 15 + (r === 0 ? -5 : 0);
          e[sq] = centre * 8 - 12;
          break;
        case BISHOP:
          m[sq] = centre * 4 - 4 + (f === r || f + r === 7 ? 6 : 0);
          e[sq] = centre * 4 - 6;
          break;
        case ROOK:
          m[sq] = (f >= 2 && f <= 5 ? 4 : 0) - (f === 0 || f === 7 ? 2 : 0);
          e[sq] = 0;
          break;
        case QUEEN:
          m[sq] = centre * 2 - 3;
          e[sq] = centre * 5 - 8;
          break;
        case KING:
          // Middlegame: stay home near a corner; the endgame part lives in the kingActivity term.
          m[sq] = r === 0 ? [20, 30, 10, 0, 0, 10, 30, 20][f]! : r === 1 ? 0 : -20 - r * 5;
          e[sq] = 0;
          break;
      }
    }
    mg.push(m);
    eg.push(e);
  }
  (PLACEMENT_MG as Int16Array[]).push(...mg);
  (PLACEMENT_EG as Int16Array[]).push(...eg);
})();

const PASSED_MG = [0, 5, 10, 15, 25, 45, 70, 0] as const;
const PASSED_EG = [0, 10, 15, 25, 45, 75, 120, 0] as const;
const SAFETY_WEIGHT = [0, 0, 2, 2, 3, 5, 0] as const;

/* Scratch buffers (module level, fully re-initialised on every call). */
const ATT = new Uint8Array(128); // attack counts [s * 64 + sq]
const PAWN_ATT = new Uint8Array(128);
const MIN_ATT = new Uint8Array(128); // lowest attacking piece type (7 = none)
const PAWN_MIN = new Int8Array(16); // lowest rank of a pawn of side s on file f (8 = none)
const PAWN_MAX = new Int8Array(16); // highest rank (-1 = none)
const PAWN_COUNT = new Int8Array(16);
const MG = new Float64Array(TERM_COUNT);
const EG = new Float64Array(TERM_COUNT);
const PIECES = new Int8Array(32);
/** NEAR[k * 64 + t] = 1 if t is the king square k or adjacent to it. */
const NEAR = (() => {
  const near = new Uint8Array(64 * 64);
  for (let k = 0; k < 64; k++) for (let t = 0; t < 64; t++) if (kingDistance(k, t) <= 1) near[k * 64 + t] = 1;
  return near;
})();
const ZONE_UNITS = new Int32Array(2); // attack units of side s against the enemy king zone
const ZONE_ATTACKERS = new Int32Array(2);
const MOBILITY = new Int8Array(64); // per piece square

const markAttack = (base: number, t: number, type: number): void => {
  ATT[base + t] = ATT[base + t]! + 1;
  if (type < MIN_ATT[base + t]!) MIN_ATT[base + t] = type;
};

/** Fills attack maps, pawn tables, the piece list, mobility and king-zone pressure. Returns the piece count. */
function scan(b: Int8Array, kings: readonly [number, number]): number {
  ATT.fill(0);
  PAWN_ATT.fill(0);
  MIN_ATT.fill(7);
  PAWN_MIN.fill(8);
  PAWN_MAX.fill(-1);
  PAWN_COUNT.fill(0);
  ZONE_UNITS.fill(0);
  ZONE_ATTACKERS.fill(0);
  let n = 0;
  // Pass 1: pawns, kings, piece list.
  for (let sq = 0; sq < 64; sq++) {
    const p = b[sq]!;
    if (p === 0) continue;
    PIECES[n++] = sq;
    const s = p > 0 ? 0 : 1;
    const type = p > 0 ? p : -p;
    const base = s * 64;
    if (type === PAWN) {
      const f = sq & 7;
      const r = sq >> 3;
      const idx = s * 8 + f;
      PAWN_COUNT[idx] = PAWN_COUNT[idx]! + 1;
      if (r < PAWN_MIN[idx]!) PAWN_MIN[idx] = r;
      if (r > PAWN_MAX[idx]!) PAWN_MAX[idx] = r;
      const ahead = s === 0 ? sq + 8 : sq - 8;
      if (f > 0) {
        markAttack(base, ahead - 1, PAWN);
        PAWN_ATT[base + ahead - 1] = 1;
      }
      if (f < 7) {
        markAttack(base, ahead + 1, PAWN);
        PAWN_ATT[base + ahead + 1] = 1;
      }
    } else if (type === KING) {
      const targets = KING_TARGETS[sq]!;
      for (let i = 0; i < targets.length; i++) markAttack(base, targets[i]!, KING);
    }
  }
  // Pass 2: pieces — attacks, mobility (safe from enemy pawns, not own-occupied), king-zone hits.
  for (let i = 0; i < n; i++) {
    const sq = PIECES[i]!;
    const p = b[sq]!;
    const type = p > 0 ? p : -p;
    if (type === PAWN || type === KING) continue;
    const s = p > 0 ? 0 : 1;
    const base = s * 64;
    const enemyPawns = (1 - s) * 64;
    const enemyKing = kings[1 - s]! * 64;
    let mobility = 0;
    let hitsZone = false;
    if (type === KNIGHT) {
      const targets = KNIGHT_TARGETS[sq]!;
      for (let j = 0; j < targets.length; j++) {
        const t = targets[j]!;
        markAttack(base, t, KNIGHT);
        const q = b[t]!;
        if ((q === 0 || (q > 0) !== (p > 0)) && !PAWN_ATT[enemyPawns + t]) mobility++;
        if (NEAR[enemyKing + t]) hitsZone = true;
      }
    } else {
      const first = type === BISHOP ? 4 : 0;
      const last = type === ROOK ? 4 : 8;
      for (let d = first; d < last; d++) {
        const ray = RAYS[sq * 8 + d]!;
        for (let j = 0; j < ray.length; j++) {
          const t = ray[j]!;
          markAttack(base, t, type);
          const q = b[t]!;
          if ((q === 0 || (q > 0) !== (p > 0)) && !PAWN_ATT[enemyPawns + t]) mobility++;
          if (NEAR[enemyKing + t]) hitsZone = true;
          if (q !== 0) break;
        }
      }
    }
    MOBILITY[sq] = mobility;
    if (hitsZone) {
      ZONE_ATTACKERS[s] = ZONE_ATTACKERS[s]! + 1;
      ZONE_UNITS[s]! += SAFETY_WEIGHT[type]!;
    }
  }
  return n;
}

/** Material + placement only (tapered), side-to-move view: a cheap first estimate for lazy evaluation. */
export function quickEvaluate(pos: Position): number {
  const b = pos.board;
  let mg = 0;
  let eg = 0;
  let phase = 0;
  for (let sq = 0; sq < 64; sq++) {
    const p = b[sq]!;
    if (p === 0) continue;
    if (p > 0) {
      mg += VALUE_MG[p]! + PLACEMENT_MG[p]![sq]!;
      eg += VALUE_EG[p]! + PLACEMENT_EG[p]![sq]!;
      phase += PHASE_WEIGHT[p]!;
    } else {
      mg -= VALUE_MG[-p]! + PLACEMENT_MG[-p]![sq ^ 56]!;
      eg -= VALUE_EG[-p]! + PLACEMENT_EG[-p]![sq ^ 56]!;
      phase += PHASE_WEIGHT[-p]!;
    }
  }
  if (phase > MAX_PHASE) phase = MAX_PHASE;
  const score = Math.round((mg * phase + eg * (MAX_PHASE - phase)) / MAX_PHASE);
  return pos.side === WHITE ? score : -score;
}

/** Number of attackers per square for each side and the cheapest attacker type (7 = none). */
export function attackMaps(pos: Position): { attacks: [number[], number[]]; lowest: [number[], number[]] } {
  scan(pos.board, pos.kings);
  return {
    attacks: [Array.from(ATT.subarray(0, 64)), Array.from(ATT.subarray(64))],
    lowest: [Array.from(MIN_ATT.subarray(0, 64)), Array.from(MIN_ATT.subarray(64))]
  };
}

const isPassed = (s: number, f: number, r: number): boolean => {
  const opp = (1 - s) * 8;
  for (let nf = f > 0 ? f - 1 : 0; nf <= (f < 7 ? f + 1 : 7); nf++) {
    if (PAWN_COUNT[opp + nf] === 0) continue;
    if (s === 0 ? PAWN_MAX[opp + nf]! > r : PAWN_MIN[opp + nf]! < r) return false;
  }
  return true;
};

/** Whether an enemy pawn on an adjacent file could still advance to attack (s, f, r). */
const pawnCanAttack = (s: number, f: number, r: number): boolean => {
  const opp = (1 - s) * 8;
  if (f > 0 && PAWN_COUNT[opp + f - 1]! > 0 && (s === 0 ? PAWN_MAX[opp + f - 1]! > r : PAWN_MIN[opp + f - 1]! < r)) return true;
  if (f < 7 && PAWN_COUNT[opp + f + 1]! > 0 && (s === 0 ? PAWN_MAX[opp + f + 1]! > r : PAWN_MIN[opp + f + 1]! < r)) return true;
  return false;
};

/** Relative rank of the most backward own pawn on file f (8 = none). */
const rearPawn = (s: number, f: number): number => {
  const idx = s * 8 + f;
  if (PAWN_COUNT[idx] === 0) return 8;
  return s === 0 ? PAWN_MIN[idx]! : 7 - PAWN_MAX[idx]!;
};

/**
 * Static evaluation in centipawns from the point of view of the side to move.
 * If `terms` is given, it receives each term's tapered value from WHITE's point of view
 * (before drawish-material scaling).
 */
export function evaluate(pos: Position, features: number = ALL_FEATURES, terms?: Float64Array | number[]): number {
  const b = pos.board;
  MG.fill(0);
  EG.fill(0);
  const count = scan(b, pos.kings);

  let phase = 0;
  let nonPawnW = 0;
  let nonPawnB = 0;
  let pawnsW = 0;
  let pawnsB = 0;
  let bishopsW = 0;
  let bishopsB = 0;
  let knightsW = 0;
  let knightsB = 0;
  let queensW = 0;
  let queensB = 0;
  let bishopColourW = 0;
  let bishopColourB = 0;
  let minors = 0;
  let majorsOrPawns = 0;
  for (let i = 0; i < count; i++) {
    const sq = PIECES[i]!;
    const p = b[sq]!;
    const type = p > 0 ? p : -p;
    phase += PHASE_WEIGHT[type]!;
    if (type === PAWN || type === ROOK || type === QUEEN) majorsOrPawns++;
    if (type === KNIGHT || type === BISHOP) minors++;
    if (p > 0) {
      if (type === PAWN) pawnsW++;
      else if (type !== KING) nonPawnW += PIECE_VALUE[type]!;
      if (type === BISHOP) {
        bishopsW++;
        bishopColourW |= ((sq & 7) + (sq >> 3)) % 2 === 0 ? 2 : 1;
      } else if (type === KNIGHT) knightsW++;
      else if (type === QUEEN) queensW++;
    } else {
      if (type === PAWN) pawnsB++;
      else if (type !== KING) nonPawnB += PIECE_VALUE[type]!;
      if (type === BISHOP) {
        bishopsB++;
        bishopColourB |= ((sq & 7) + (sq >> 3)) % 2 === 0 ? 2 : 1;
      } else if (type === KNIGHT) knightsB++;
      else if (type === QUEEN) queensB++;
    }
  }
  // Dead positions (same rule as the game): K v K, K+minor v K, same-coloured bishops only.
  if (majorsOrPawns === 0 && (minors <= 1 || (knightsW + knightsB === 0 && ((bishopColourW | bishopColourB) === 1 || (bishopColourW | bishopColourB) === 2)))) {
    if (terms) for (let i = 0; i < TERM_COUNT; i++) terms[i] = 0;
    return 0;
  }
  if (phase > MAX_PHASE) phase = MAX_PHASE;
  const nonPawn = [nonPawnW, nonPawnB];
  const pawns = [pawnsW, pawnsB];
  const queens = [queensW, queensB];

  const onPawns = (features & (1 << T_PAWNS)) !== 0;
  const onPassed = (features & (1 << T_PASSED)) !== 0;
  const onCentre = (features & (1 << T_CENTRE)) !== 0;
  const onMobility = (features & (1 << T_MOBILITY)) !== 0;
  const onDevelopment = (features & (1 << T_DEVELOPMENT)) !== 0;
  const onRooks = (features & (1 << T_ROOKS)) !== 0;
  const onOutposts = (features & (1 << T_OUTPOSTS)) !== 0;
  const onThreats = (features & (1 << T_THREATS)) !== 0;
  const onKingActivity = (features & (1 << T_KING_ACTIVITY)) !== 0;

  for (let i = 0; i < count; i++) {
    const sq = PIECES[i]!;
    const p = b[sq]!;
    const s = p > 0 ? 0 : 1;
    const o = 1 - s;
    const sign = s === 0 ? 1 : -1;
    const type = p > 0 ? p : -p;
    const f = sq & 7;
    const r = sq >> 3;
    const rr = s === 0 ? r : 7 - r; // relative rank
    const rsq = s === 0 ? sq : sq ^ 56; // mirrored square for tables

    MG[T_MATERIAL]! += sign * VALUE_MG[type]!;
    EG[T_MATERIAL]! += sign * VALUE_EG[type]!;
    MG[T_PLACEMENT]! += sign * PLACEMENT_MG[type]![rsq]!;
    EG[T_PLACEMENT]! += sign * PLACEMENT_EG[type]![rsq]!;

    if (type === PAWN) {
      const own = s * 8;
      if (onPawns) {
        if (PAWN_COUNT[own + f]! > 1 && rearPawn(s, f) === rr) {
          // Doubled: counted once per extra pawn (on the rear pawn of the file).
          MG[T_PAWNS]! -= sign * 10 * (PAWN_COUNT[own + f]! - 1);
          EG[T_PAWNS]! -= sign * 20 * (PAWN_COUNT[own + f]! - 1);
        }
        const left = f > 0 ? PAWN_COUNT[own + f - 1]! : 0;
        const right = f < 7 ? PAWN_COUNT[own + f + 1]! : 0;
        if (left === 0 && right === 0) {
          MG[T_PAWNS]! -= sign * 10;
          EG[T_PAWNS]! -= sign * 15;
        } else if (PAWN_ATT[s * 64 + sq] || (f > 0 && b[sq - 1] === p) || (f < 7 && b[sq + 1] === p)) {
          MG[T_PAWNS]! += sign * (3 + rr * 2);
          EG[T_PAWNS]! += sign * (2 + rr * 2);
        } else {
          // Backward: neighbours are all further advanced and the stop square is covered by an enemy pawn.
          const support = (f > 0 && rearPawn(s, f - 1) <= rr) || (f < 7 && rearPawn(s, f + 1) <= rr);
          if (!support && PAWN_ATT[o * 64 + (s === 0 ? sq + 8 : sq - 8)]) {
            MG[T_PAWNS]! -= sign * 8;
            EG[T_PAWNS]! -= sign * 10;
          }
        }
      }
      if (onPassed && isPassed(s, f, r)) {
        let mg: number = PASSED_MG[rr]!;
        let eg: number = PASSED_EG[rr]!;
        const front = s === 0 ? sq + 8 : sq - 8;
        if (b[front] !== 0) {
          mg >>= 1;
          eg >>= 1;
        }
        if (PAWN_ATT[s * 64 + sq]) eg += 10;
        // The defending king wants to be near the stop square; so does the attacking one (less important).
        eg += (kingDistance(pos.kings[o]!, front) * 5 - kingDistance(pos.kings[s]!, front) * 2) * (rr >= 3 ? rr - 2 : 1);
        // Rule of the square against a lone king.
        if (nonPawn[o] === 0) {
          const promo = s === 0 ? 56 + f : f;
          const tempo = pos.side === (s === 0 ? WHITE : BLACK) ? 0 : 1;
          if (kingDistance(pos.kings[o]!, promo) - tempo > 7 - rr) eg += 300;
        }
        MG[T_PASSED]! += sign * mg;
        EG[T_PASSED]! += sign * eg;
      }
      if (onCentre && (sq === 27 || sq === 28 || sq === 35 || sq === 36)) MG[T_CENTRE]! += sign * 12;
      continue;
    }

    if (type === KING) {
      if (onKingActivity) EG[T_KING_ACTIVITY]! += sign * (6 - centreManhattan(sq)) * 6;
      continue;
    }

    if (onMobility) {
      const n = MOBILITY[sq]!;
      if (type === KNIGHT) {
        MG[T_MOBILITY]! += sign * (n - 4) * 4;
        EG[T_MOBILITY]! += sign * (n - 4) * 4;
      } else if (type === BISHOP) {
        MG[T_MOBILITY]! += sign * (n - 6) * 5;
        EG[T_MOBILITY]! += sign * (n - 6) * 5;
      } else if (type === ROOK) {
        MG[T_MOBILITY]! += sign * (n - 6) * 2;
        EG[T_MOBILITY]! += sign * (n - 6) * 4;
      } else {
        MG[T_MOBILITY]! += sign * (n - 12);
        EG[T_MOBILITY]! += sign * (n - 12) * 2;
      }
    }

    if (onDevelopment && rr === 0 && ((type === KNIGHT && (f === 1 || f === 6)) || (type === BISHOP && (f === 2 || f === 5)))) MG[T_DEVELOPMENT]! -= sign * 15;

    if (type === ROOK && onRooks) {
      if (PAWN_COUNT[s * 8 + f] === 0) {
        if (PAWN_COUNT[o * 8 + f] === 0) {
          MG[T_ROOKS]! += sign * 20;
          EG[T_ROOKS]! += sign * 8;
        } else {
          MG[T_ROOKS]! += sign * 10;
          EG[T_ROOKS]! += sign * 5;
        }
      }
      if (rr === 6) {
        const enemyKingRr = s === 0 ? pos.kings[o]! >> 3 : 7 - (pos.kings[o]! >> 3);
        const seventh = s === 0 ? 48 : 8;
        let enemyPawnsOn7 = false;
        for (let nf = 0; nf < 8; nf++) if (b[seventh + nf] === -sign * PAWN) enemyPawnsOn7 = true;
        if (enemyKingRr === 7 || enemyPawnsOn7) {
          MG[T_ROOKS]! += sign * 15;
          EG[T_ROOKS]! += sign * 25;
        }
      }
    }

    if ((type === KNIGHT || type === BISHOP) && onOutposts && rr >= 3 && rr <= 5 && PAWN_ATT[s * 64 + sq] && !pawnCanAttack(s, f, r)) {
      MG[T_OUTPOSTS]! += sign * (type === KNIGHT ? 22 : 10);
      EG[T_OUTPOSTS]! += sign * (type === KNIGHT ? 12 : 5);
    }

    if (onThreats) {
      // This piece is attacked by an enemy pawn, by a cheaper piece, or hangs undefended.
      const by = o * 64 + sq;
      if (ATT[by]) {
        let threat = 0;
        if (PAWN_ATT[by]) threat = 35;
        else if (PIECE_VALUE[MIN_ATT[by]!]! < PIECE_VALUE[type]!) threat = 20;
        else if (!ATT[s * 64 + sq]) threat = 15;
        MG[T_THREATS]! -= sign * threat;
        EG[T_THREATS]! -= sign * threat;
      }
    }
  }

  if (features & (1 << T_BISHOP_PAIR)) {
    if (bishopsW >= 2) {
      MG[T_BISHOP_PAIR]! += 25;
      EG[T_BISHOP_PAIR]! += 45;
    }
    if (bishopsB >= 2) {
      MG[T_BISHOP_PAIR]! -= 25;
      EG[T_BISHOP_PAIR]! -= 45;
    }
  }

  for (let s = 0; s < 2; s++) {
    const o = 1 - s;
    const sign = s === 0 ? 1 : -1;
    const k = pos.kings[s]!;
    const kf = k & 7;
    const krr = s === 0 ? k >> 3 : 7 - (k >> 3);
    const backRank = s === 0 ? 0 : 56;

    if (onDevelopment) {
      // Early queen sortie while minor pieces still sleep; centre pawns blocked on their start squares.
      let sleeping = 0;
      if (b[backRank + 1] === KNIGHT * sign) sleeping++;
      if (b[backRank + 6] === KNIGHT * sign) sleeping++;
      if (b[backRank + 2] === BISHOP * sign) sleeping++;
      if (b[backRank + 5] === BISHOP * sign) sleeping++;
      if (queens[s]! > 0 && b[backRank + 3] !== QUEEN * sign && sleeping >= 2) MG[T_DEVELOPMENT]! -= sign * 20;
      const pawnRank = s === 0 ? 8 : 48;
      const blockRank = s === 0 ? 16 : 40;
      for (let f = 3; f <= 4; f++) if (b[pawnRank + f] === PAWN * sign && b[blockRank + f] !== 0) MG[T_DEVELOPMENT]! -= sign * 15;
    }

    if (features & (1 << T_CASTLING)) {
      const rights = s === 0 ? pos.castling & 3 : (pos.castling >> 2) & 3;
      if (krr === 0 && (kf >= 6 || kf <= 2)) {
        let v = 25;
        // A rook trapped in the corner by its own king.
        if ((kf >= 6 && b[backRank + 7] === ROOK * sign) || (kf >= 1 && kf <= 2 && (b[backRank] === ROOK * sign || b[backRank + 1] === ROOK * sign))) v -= 30;
        MG[T_CASTLING]! += sign * v;
      } else if (k === backRank + 4) {
        MG[T_CASTLING]! += sign * (rights === 0 ? -25 : rights === 3 ? 12 : 6);
      } else MG[T_CASTLING]! -= sign * 25;
    }

    if (features & (1 << T_KING_SAFETY)) {
      let shelter = 0;
      if (krr <= 1 && (kf <= 2 || kf >= 5)) {
        for (let f = kf > 0 ? kf - 1 : 0; f <= (kf < 7 ? kf + 1 : 7); f++) {
          const nearest = rearPawn(s, f);
          if (nearest === 8) {
            shelter -= 15;
            if (PAWN_COUNT[o * 8 + f] === 0) shelter -= 10;
            continue;
          }
          const step = nearest - krr;
          if (step === 1) shelter += 10;
          else if (step === 2) shelter += 5;
          else if (step <= 0) shelter -= 8;
          else shelter -= 5;
        }
      } else if (krr > 1) shelter -= 20 + krr * 5;
      let units = ZONE_UNITS[o]!;
      const attackers = ZONE_ATTACKERS[o]!;
      let danger = 0;
      if (attackers >= 2 || (attackers === 1 && queens[o]! > 0 && units >= 5)) {
        const targets = KING_TARGETS[k]!;
        for (let j = 0; j < targets.length; j++) if (ATT[o * 64 + targets[j]!] && !ATT[s * 64 + targets[j]!]) units++;
        danger = Math.min(450, units * units * 2);
        if (queens[o] === 0) danger >>= 1;
      }
      MG[T_KING_SAFETY]! += sign * (shelter - danger);
    }

    if (onCentre) MG[T_CENTRE]! += sign * (ATT[s * 64 + 27]! + ATT[s * 64 + 28]! + ATT[s * 64 + 35]! + ATT[s * 64 + 36]!) * 4;

    if (features & (1 << T_MOP_UP) && pawns[o] === 0 && nonPawn[s]! - nonPawn[o]! >= 400) {
      const enemyKing = pos.kings[o]!;
      EG[T_MOP_UP]! += sign * (centreManhattan(enemyKing) * 10 + (7 - kingDistance(k, enemyKing)) * 6);
    }
  }

  if (features & (1 << T_TEMPO)) {
    MG[T_TEMPO]! += pos.side === WHITE ? 10 : -10;
    EG[T_TEMPO]! += pos.side === WHITE ? 5 : -5;
  }

  let score = 0;
  for (let i = 0; i < TERM_COUNT; i++) {
    const v = (MG[i]! * phase + EG[i]! * (MAX_PHASE - phase)) / MAX_PHASE;
    if (terms) terms[i] = v;
    if (i === T_MATERIAL || (features & (1 << i)) !== 0) score += v;
  }
  score = Math.round(score);

  if (features & FEATURE_SCALING) {
    const strong = score > 0 ? 0 : 1;
    const weak = 1 - strong;
    const strongKnights = strong === 0 ? knightsW : knightsB;
    if (pawns[strong] === 0 && nonPawn[strong]! - nonPawn[weak]! <= 350) score = Math.trunc(score / 8);
    else if (pawns[strong] === 0 && nonPawn[weak] === 0 && strongKnights === 2 && nonPawn[strong] === 2 * PIECE_VALUE[KNIGHT]) score = Math.trunc(score / 8);
    else if (bishopsW === 1 && bishopsB === 1 && nonPawnW === PIECE_VALUE[BISHOP] && nonPawnB === PIECE_VALUE[BISHOP] && bishopColourW !== bishopColourB)
      score = Math.trunc(score / 2);
  }
  return pos.side === WHITE ? score : -score;
}

/** Each term's tapered contribution from WHITE's point of view (all terms, for explanations/tests). */
export function evaluateTerms(pos: Position): Record<Term, number> {
  const values = new Float64Array(TERM_COUNT);
  evaluate(pos, ALL_FEATURES, values);
  return Object.fromEntries(TERMS.map((term, i) => [term, values[i]!])) as Record<Term, number>;
}

/* ------------------------------------------------------------------------ */
/* Search                                                                     */
/* ------------------------------------------------------------------------ */

export const MATE = 30_000;
const INF = 32_000;
const MAX_PLY = 64;
const MATE_BOUND = MATE - 1000;
/** Largest plausible sum of the non-material terms (lazy evaluation bound). */
const LAZY_MARGIN = 400;

export interface Level {
  /** Node budget per decision (deterministic stand-in for a time limit). */
  nodes: number;
  maxDepth: number;
  /** Maximum quiescence depth (captures followed beyond the horizon). */
  qDepth: number;
  features: number;
  /** Moves within this many centipawns of the best are candidates. */
  margin: number;
  /** Softmax temperature for choosing among candidates (centipawns). */
  temperature: number;
  /** Probability of deciding with a one-ply glance instead of the full search. */
  glance: number;
  /** A glance is only played if the full search says it loses at most this much. */
  blunderCap: number;
  nullMove: boolean;
}

export const LEVELS: Readonly<Record<Difficulty, Level>> = {
  beginner: {
    nodes: 4_000,
    maxDepth: 2,
    qDepth: 2,
    features: featureMask(['material', 'placement', 'development', 'castling', 'centre', 'mobility', 'tempo']),
    margin: 90,
    temperature: 45,
    glance: 0.3,
    blunderCap: 350,
    nullMove: false
  },
  intermediate: {
    nodes: 12_000,
    maxDepth: 4,
    qDepth: 6,
    features: featureMask(
      ['material', 'placement', 'development', 'castling', 'centre', 'kingSafety', 'pawnStructure', 'passedPawns', 'mobility', 'bishopPair', 'rooks', 'kingActivity', 'mopUp', 'tempo'],
      true
    ),
    margin: 35,
    temperature: 15,
    glance: 0.1,
    blunderCap: 160,
    nullMove: true
  },
  strong: {
    nodes: 28_000,
    maxDepth: 32,
    qDepth: 16,
    features: ALL_FEATURES,
    margin: 6,
    temperature: 2,
    glance: 0,
    blunderCap: 0,
    nullMove: true
  }
};

const TT_BITS = 16;
const TT_SIZE = 1 << TT_BITS;
const TT_KEY = new Uint32Array(TT_SIZE);
const TT_LOCK = new Uint32Array(TT_SIZE);
const TT_MOVE = new Int32Array(TT_SIZE);
const TT_SCORE = new Int32Array(TT_SIZE);
const TT_DEPTH = new Int8Array(TT_SIZE);
const TT_FLAG = new Uint8Array(TT_SIZE); // 0 empty, 1 exact, 2 lower, 3 upper
const EXACT = 1;
const LOWER = 2;
const UPPER = 3;

/** Swaps the best remaining move (highest key; ties by lower move number) to index `i` and returns it. */
function pickNext(moves: number[], keys: Int32Array, i: number): number {
  let best = i;
  for (let j = i + 1; j < moves.length; j++) {
    if (keys[j]! > keys[best]! || (keys[j] === keys[best] && moves[j]! < moves[best]!)) best = j;
  }
  if (best !== i) {
    const m = moves[i]!;
    moves[i] = moves[best]!;
    moves[best] = m;
    const k = keys[i]!;
    keys[i] = keys[best]!;
    keys[best] = k;
  }
  return moves[i]!;
}

class Search {
  nodes = 0;
  stopped = false;
  readonly killers = new Int32Array(MAX_PLY * 2);
  readonly history = new Int32Array(64 * 64);
  /** Hash pairs of the game so far plus the current search path. */
  readonly hashes: number[];
  constructor(
    readonly pos: Position,
    readonly level: Level,
    history: readonly number[],
    readonly limit: number
  ) {
    this.hashes = [...history];
    TT_FLAG.fill(0);
  }

  private isRepetition(): boolean {
    const { hashLo, hashHi, halfmove } = this.pos;
    const h = this.hashes;
    const stop = Math.max(0, h.length - 2 * halfmove);
    for (let i = h.length - 4; i >= stop; i -= 4) if (h[i] === hashLo && h[i + 1] === hashHi) return true;
    return false;
  }

  private push(): void {
    this.hashes.push(this.pos.hashLo, this.pos.hashHi);
  }

  private pop(): void {
    this.hashes.length -= 2;
  }

  private orderScore(move: number, ttMove: number, ply: number): number {
    if (move === ttMove) return 1 << 30;
    const b = this.pos.board;
    const victim = Math.abs(b[moveTo(move)]!) || (moveFlag(move) === FLAG_EP ? PAWN : 0);
    const promo = movePromo(move);
    if (victim || promo) return (1 << 28) + victim * 16 + promo * 8 - Math.abs(b[moveFrom(move)]!);
    if (move === this.killers[ply * 2]) return (1 << 27) + 2;
    if (move === this.killers[ply * 2 + 1]) return (1 << 27) + 1;
    return this.history[moveFrom(move) * 64 + moveTo(move)]!;
  }

  /** Moves with ordering keys; `next` picks the best remaining one (selection sort, cheap with early cut-offs). */
  private order(moves: number[], ttMove: number, ply: number): Int32Array {
    const keys = new Int32Array(moves.length);
    for (let i = 0; i < moves.length; i++) keys[i] = this.orderScore(moves[i]!, ttMove, ply);
    return keys;
  }

  quiesce(alpha: number, beta: number, ply: number, qply: number): number {
    this.nodes++;
    if (this.nodes >= this.limit) this.stopped = true;
    // Lazy evaluation: far outside the window, material and placement decide alone.
    const quick = quickEvaluate(this.pos);
    if (quick - LAZY_MARGIN >= beta) return quick - LAZY_MARGIN;
    if (qply > 0 && quick + LAZY_MARGIN + 950 <= alpha) return quick + LAZY_MARGIN;
    const standPat = evaluate(this.pos, this.level.features);
    if (standPat >= beta) return standPat;
    if (standPat > alpha) alpha = standPat;
    if (qply >= this.level.qDepth || ply >= MAX_PLY - 1) return standPat;
    const side = this.pos.side;
    let best = standPat;
    const moves = pseudoMoves(this.pos, true);
    const keys = this.order(moves, 0, ply);
    for (let i = 0; i < moves.length; i++) {
      const move = pickNext(moves, keys, i);
      // Delta pruning: even winning the captured piece cannot raise alpha.
      const victim = Math.abs(this.pos.board[moveTo(move)]!) || (moveFlag(move) === FLAG_EP ? PAWN : 0);
      if (!movePromo(move) && standPat + PIECE_VALUE[victim]! + 200 < alpha) continue;
      const undo = makeMove(this.pos, move);
      if (inCheck(this.pos, side)) {
        unmakeMove(this.pos, undo);
        continue;
      }
      const score = -this.quiesce(-beta, -alpha, ply + 1, qply + 1);
      unmakeMove(this.pos, undo);
      if (this.stopped) return 0;
      if (score > best) best = score;
      if (score > alpha) alpha = score;
      if (alpha >= beta) break;
    }
    return best;
  }

  negamax(depth: number, alpha: number, beta: number, ply: number, allowNull: boolean): number {
    const pos = this.pos;
    if (ply > 0) {
      if (pos.halfmove >= 100 || this.isRepetition()) return 0;
      // Mate distance pruning.
      alpha = Math.max(alpha, -MATE + ply);
      beta = Math.min(beta, MATE - ply - 1);
      if (alpha >= beta) return alpha;
    }
    const checked = inCheck(pos);
    if (checked && ply < MAX_PLY - 8) depth++;
    if (depth <= 0 || ply >= MAX_PLY - 1) return this.quiesce(alpha, beta, ply, 0);
    this.nodes++;
    if (this.nodes >= this.limit) {
      this.stopped = true;
      return 0;
    }

    const slot = pos.hashLo & (TT_SIZE - 1);
    let ttMove = 0;
    if (TT_FLAG[slot] && TT_KEY[slot] === pos.hashLo && TT_LOCK[slot] === pos.hashHi) {
      ttMove = TT_MOVE[slot]!;
      if (ply > 0 && TT_DEPTH[slot]! >= depth) {
        let s = TT_SCORE[slot]!;
        if (s > MATE_BOUND) s -= ply;
        else if (s < -MATE_BOUND) s += ply;
        const flag = TT_FLAG[slot];
        if (flag === EXACT || (flag === LOWER && s >= beta) || (flag === UPPER && s <= alpha)) return s;
      }
    }

    const pvNode = beta - alpha > 1;
    if (allowNull && this.level.nullMove && !pvNode && !checked && depth >= 3 && this.hasPieces(pos.side) && quickEvaluate(pos) >= beta) {
      const undo = makeNullMove(pos);
      this.push();
      const score = -this.negamax(depth - 3, -beta, -beta + 1, ply + 1, false);
      this.pop();
      unmakeNullMove(pos, undo);
      if (this.stopped) return 0;
      if (score >= beta && score < MATE_BOUND) return beta;
    }

    const side = pos.side;
    const alphaStart = alpha;
    let best = -INF;
    let bestMove = 0;
    let legal = 0;
    const moves = pseudoMoves(pos);
    const keys = this.order(moves, ttMove, ply);
    for (let i = 0; i < moves.length; i++) {
      const move = pickNext(moves, keys, i);
      const quiet = pos.board[moveTo(move)] === 0 && !movePromo(move) && moveFlag(move) !== FLAG_EP;
      const undo = makeMove(pos, move);
      if (inCheck(pos, side)) {
        unmakeMove(pos, undo);
        continue;
      }
      legal++;
      this.push();
      let score: number;
      if (legal === 1) score = -this.negamax(depth - 1, -beta, -alpha, ply + 1, true);
      else {
        const givesCheck = inCheck(pos);
        const reduce = depth >= 3 && legal > 3 && quiet && !checked && !givesCheck ? 1 : 0;
        score = -this.negamax(depth - 1 - reduce, -alpha - 1, -alpha, ply + 1, true);
        if (score > alpha && (reduce || score < beta)) score = -this.negamax(depth - 1, -beta, -alpha, ply + 1, true);
      }
      this.pop();
      unmakeMove(pos, undo);
      if (this.stopped) return 0;
      if (score > best) {
        best = score;
        bestMove = move;
      }
      if (score > alpha) alpha = score;
      if (alpha >= beta) {
        if (quiet) {
          if (this.killers[ply * 2] !== move) {
            this.killers[ply * 2 + 1] = this.killers[ply * 2]!;
            this.killers[ply * 2] = move;
          }
          this.history[moveFrom(move) * 64 + moveTo(move)]! += depth * depth;
        }
        break;
      }
    }
    if (legal === 0) return checked ? -MATE + ply : 0;

    let stored = best;
    if (stored > MATE_BOUND) stored += ply;
    else if (stored < -MATE_BOUND) stored -= ply;
    TT_KEY[slot] = pos.hashLo;
    TT_LOCK[slot] = pos.hashHi;
    TT_MOVE[slot] = bestMove;
    TT_SCORE[slot] = stored;
    TT_DEPTH[slot] = depth;
    TT_FLAG[slot] = best >= beta ? LOWER : best <= alphaStart ? UPPER : EXACT;
    return best;
  }

  private hasPieces(side: Side): boolean {
    const b = this.pos.board;
    for (let sq = 0; sq < 64; sq++) {
      const t = b[sq]! * side;
      if (t > PAWN && t < KING) return true;
    }
    return false;
  }

  /**
   * Scores root moves: exact values for every move within `margin` of the best,
   * `null` for moves proven worse than that.
   */
  root(moves: readonly number[], depth: number, margin: number): Map<number, number> | null {
    const pos = this.pos;
    const scores = new Map<number, number>();
    let best = -INF;
    for (const move of moves) {
      const undo = makeMove(pos, move);
      this.push();
      let score: number;
      if (best === -INF) score = -this.negamax(depth - 1, -INF, INF, 1, true);
      else {
        const floor = Math.max(-INF + 1, best - margin - 1);
        score = -this.negamax(depth - 1, -floor - 1, -floor, 1, true);
        if (score > floor && !this.stopped) score = -this.negamax(depth - 1, -INF, -floor, 1, true);
        else score = -INF; // proven outside the candidate window
      }
      this.pop();
      unmakeMove(pos, undo);
      if (this.stopped) return null;
      if (score > -INF) scores.set(move, score);
      if (score > best) best = score;
    }
    return scores;
  }
}

export interface Analysis {
  /** Candidate moves with exact scores (centipawns, side to move), best first. */
  candidates: { move: number; score: number }[];
  depth: number;
  nodes: number;
}

/** Iterative-deepening search returning the candidate list of the deepest completed iteration. */
export function analyse(pos: Position, level: Level, history: readonly number[] = [], margin = level.margin): Analysis {
  const work = { ...pos, board: Int8Array.from(pos.board), kings: [pos.kings[0], pos.kings[1]] as [number, number] };
  const search = new Search(work, level, [...history, pos.hashLo, pos.hashHi], level.nodes);
  let order = legalMoves(work);
  let result: Analysis = { candidates: order.map((move) => ({ move, score: 0 })), depth: 0, nodes: 0 };
  if (order.length <= 1) return result;
  for (let depth = 1; depth <= level.maxDepth; depth++) {
    const scores = search.root(order, depth, margin);
    if (!scores) break;
    const candidates = [...scores].map(([move, score]) => ({ move, score })).sort((a, b) => b.score - a.score || a.move - b.move);
    result = { candidates, depth, nodes: search.nodes };
    // Next iteration: candidates first (best first), then the rest in previous order.
    const rest = order.filter((m) => !scores.has(m));
    order = [...candidates.map((c) => c.move), ...rest];
    if (candidates[0]!.score > MATE_BOUND) break; // forced mate found
  }
  const best = result.candidates[0]?.score ?? 0;
  result.candidates = result.candidates.filter((c) => c.score >= best - margin);
  result.nodes = search.nodes;
  return result;
}

/** Score of one specific root move (side-to-move view) with a small budget. */
function scoreMove(pos: Position, move: number, level: Level, history: readonly number[], depth: number): number {
  const work = { ...pos, board: Int8Array.from(pos.board), kings: [pos.kings[0], pos.kings[1]] as [number, number] };
  const search = new Search(work, level, [...history, pos.hashLo, pos.hashHi], level.nodes);
  makeMove(work, move);
  search.hashes.push(work.hashLo, work.hashHi);
  const score = -search.negamax(depth - 1, -INF, INF, 1, true);
  return search.stopped ? -INF : score;
}

/** The one-ply "glance": static value right after each move (mates recognised), best first. */
export function glance(pos: Position, features: number): { move: number; score: number }[] {
  const work = { ...pos, board: Int8Array.from(pos.board), kings: [pos.kings[0], pos.kings[1]] as [number, number] };
  return legalMoves(work)
    .map((move) => {
      const undo = makeMove(work, move);
      let score: number;
      if (!hasLegalMove(work)) score = inCheck(work) ? MATE - 1 : 0;
      else score = -evaluate(work, features);
      unmakeMove(work, undo);
      return { move, score };
    })
    .sort((a, b) => b.score - a.score || a.move - b.move);
}

function softmaxPick(candidates: readonly { move: number; score: number }[], temperature: number, rng: Rng): number {
  const best = candidates[0]!.score;
  if (temperature <= 0 || candidates.length === 1) return candidates[0]!.move;
  const weights = candidates.map((c) => Math.exp((c.score - best) / temperature));
  const total = weights.reduce((a, b) => a + b, 0);
  let x = rng.next() * total;
  for (let i = 0; i < candidates.length; i++) {
    x -= weights[i]!;
    if (x < 0) return candidates[i]!.move;
  }
  return candidates[candidates.length - 1]!.move;
}

export interface Choice {
  move: number;
  /** How the move was chosen: by the full search or by a one-ply glance. */
  mode: 'search' | 'glance';
  score: number;
  depth: number;
  nodes: number;
}

/**
 * Chooses a move for the side to move at `level`. `history` holds hashLo/hashHi pairs of
 * earlier positions of the game (for repetition awareness). Throws if there is no legal move.
 */
export function chooseMove(pos: Position, level: Level, rng: Rng, history: readonly number[] = []): Choice {
  const legal = legalMoves(pos);
  if (legal.length === 0) throw new RangeError('No legal move');
  const opening = pos.fullmove <= 4;
  // A little more variety in the first moves, so games do not all look alike.
  const margin = opening ? Math.max(level.margin, 20) : level.margin;
  const temperature = opening ? Math.max(level.temperature, 10) : level.temperature;
  const analysis = analyse(pos, level, history, margin);
  const roll = rng.next();
  if (roll < level.glance && analysis.candidates[0]!.score < MATE_BOUND) {
    const glanced = glance(pos, level.features);
    const pick = glanced[0]!;
    const known = analysis.candidates.find((c) => c.move === pick.move);
    const full = known ? known.score : scoreMove(pos, pick.move, level, history, Math.max(1, analysis.depth));
    if (full > -INF && analysis.candidates[0]!.score - full <= level.blunderCap) {
      return { move: pick.move, mode: 'glance', score: full, depth: 1, nodes: analysis.nodes };
    }
  }
  const move = softmaxPick(analysis.candidates, temperature, rng);
  const score = analysis.candidates.find((c) => c.move === move)!.score;
  return { move, mode: 'search', score, depth: analysis.depth, nodes: analysis.nodes };
}

/** Hash pairs of the start position and every position before the last one in a game. */
function gameHistory(state: ChessState): { pos: Position; history: number[] } {
  const pos = parseFen(state.start)!;
  const history: number[] = [];
  for (const uci of state.moves) {
    history.push(pos.hashLo, pos.hashHi);
    makeMove(pos, uciToMove(pos, uci));
  }
  return { pos, history };
}

/**
 * If it is the computer's turn, appends its move and the advanced PRNG state.
 * Afterwards a game against the computer is finished or waits for the person.
 */
export function computerReply(state: ChessState): ChessState {
  if (!isComputerTurn(state)) return state;
  const { pos, history } = gameHistory(state);
  const rng = createRngFromState(state.rng);
  const choice = chooseMove(pos, LEVELS[state.difficulty], rng, history);
  return { ...state, moves: [...state.moves, moveToUci(choice.move)], rng: rng.state() };
}

/** The person's move followed by the computer's reply (if playing against the computer). */
export function playTurn(state: ChessState, uci: string): ChessState {
  if (isComputerTurn(state)) throw new RangeError('It is the computer’s turn');
  const game = replayState(state);
  if (!uciToMove(game.pos, uci)) throw new RangeError(`Illegal move ${uci}`);
  return computerReply({ ...state, moves: [...state.moves, uci] });
}

/** A suggestion for the side to move (strong evaluation, no randomness, small budget). Null when the game is over. */
export function suggestMove(state: ChessState): number | null {
  const { pos, history } = gameHistory(state);
  if (!hasLegalMove(pos)) return null;
  const level: Level = { ...LEVELS.strong, margin: 0, temperature: 0 };
  return analyse(pos, level, history, 0).candidates[0]!.move;
}

/* ------------------------------------------------------------------------ */
/* Explanations                                                               */
/* ------------------------------------------------------------------------ */

export interface Reason {
  key: string;
  /** Piece type (1–6) and square for templates that name a piece. */
  piece?: number;
  square?: number;
  n?: number;
}

/** Explanation keys for evaluation terms that improved for the mover (in priority order of weight). */
const TERM_REASONS: Partial<Record<Term, string>> = {
  development: 'why.develops',
  castling: 'why.kingSafety',
  centre: 'why.centre',
  kingSafety: 'why.kingSafety',
  pawnStructure: 'why.pawnStructure',
  passedPawns: 'why.passedPawn',
  mobility: 'why.mobility',
  bishopPair: 'why.bishopPair',
  rooks: 'why.rookFile',
  outposts: 'why.outpost',
  kingActivity: 'why.kingActivity',
  mopUp: 'why.mopUp'
};

/**
 * Why `move` is a good idea for the side to move, as translatable reasons, most
 * important first (at most three). Derived from tactics (mate, captures, threats,
 * escapes) and from the change of each evaluation term.
 */
export function explainMove(input: Position, move: number): Reason[] {
  const pos = { ...input, board: Int8Array.from(input.board), kings: [input.kings[0], input.kings[1]] as [number, number] };
  const side = pos.side;
  const s = side === WHITE ? 0 : 1;
  const o = 1 - s;
  const from = moveFrom(move);
  const to = moveTo(move);
  const moverType = Math.abs(pos.board[from]!);
  const capturedType = moveFlag(move) === FLAG_EP ? PAWN : Math.abs(pos.board[to]!);
  const reasons: Reason[] = [];

  const before = new Float64Array(TERM_COUNT);
  evaluate(pos, ALL_FEATURES, before);
  const beforeMaps = attackMaps(pos);
  // Own pieces that were in danger before the move.
  const endangered = new Set<number>();
  for (let sq = 0; sq < 64; sq++) {
    const p = pos.board[sq]! * side;
    if (p <= PAWN || p === KING) continue;
    if (beforeMaps.attacks[o]![sq] && (!beforeMaps.attacks[s]![sq] || PIECE_VALUE[beforeMaps.lowest[o]![sq]!]! < PIECE_VALUE[p]!)) endangered.add(sq);
  }
  const defendedTarget = capturedType ? beforeMaps.attacks[o]![to]! > 0 : false;

  makeMove(pos, move);
  const mate = !hasLegalMove(pos) && inCheck(pos);
  if (mate) return [{ key: 'why.mate' }];
  const check = inCheck(pos);
  const after = new Float64Array(TERM_COUNT);
  evaluate(pos, ALL_FEATURES, after);
  const afterMaps = attackMaps(pos);

  if (capturedType) {
    if (!defendedTarget) reasons.push({ key: 'why.winsUndefended', piece: capturedType, square: to });
    else if (PIECE_VALUE[capturedType]! > PIECE_VALUE[moverType]!) reasons.push({ key: 'why.winsMaterial', piece: capturedType, square: to });
    else reasons.push({ key: 'why.trade', piece: capturedType, square: to });
  }
  const promo = movePromo(move);
  if (promo) reasons.push({ key: 'why.promotes', piece: promo });
  const flag = moveFlag(move);
  if (flag === FLAG_CASTLE_K || flag === FLAG_CASTLE_Q) reasons.push({ key: 'why.castles' });
  if (check) reasons.push({ key: 'why.check' });

  // New targets: enemy pieces that are now attacked and undefended or attacked by something cheaper.
  const targets: number[] = [];
  for (let sq = 0; sq < 64; sq++) {
    const p = -pos.board[sq]! * side;
    if (p <= PAWN || p === KING) continue;
    const hit = afterMaps.attacks[s]![sq]! > 0;
    const weak = !afterMaps.attacks[o]![sq] || PIECE_VALUE[afterMaps.lowest[s]![sq]!]! < PIECE_VALUE[p]!;
    const wasWeak = beforeMaps.attacks[s]![sq]! > 0 && (!beforeMaps.attacks[o]![sq] || PIECE_VALUE[beforeMaps.lowest[s]![sq]!]! < PIECE_VALUE[p]!);
    if (hit && weak && !wasWeak) targets.push(sq);
  }
  if (targets.length >= 2) reasons.push({ key: 'why.fork', n: targets.length });
  else if (targets.length === 1) {
    const sq = targets[0]!;
    reasons.push({ key: 'why.attacks', piece: Math.abs(pos.board[sq]!), square: sq });
  }

  // Escapes and defences of pieces that were in danger.
  for (const sq of endangered) {
    const now = sq === from ? to : sq;
    const p = pos.board[now]! * side;
    if (p <= PAWN) continue;
    const safe = !afterMaps.attacks[o]![now] || (afterMaps.attacks[s]![now]! > 0 && PIECE_VALUE[afterMaps.lowest[o]![now]!]! >= PIECE_VALUE[p]!);
    if (!safe) continue;
    reasons.push({ key: sq === from ? 'why.escapes' : 'why.defends', piece: p, square: now });
    break;
  }

  // Positional improvements by evaluation term (from the mover's point of view).
  const sign = side === WHITE ? 1 : -1;
  const gains = TERMS.map((term, i) => ({ term, gain: (after[i]! - before[i]!) * sign }))
    .filter(({ term, gain }) => TERM_REASONS[term] && gain >= 8)
    .sort((a, b) => b.gain - a.gain);
  for (const { term } of gains) {
    const key = TERM_REASONS[term]!;
    if (term === 'castling' && reasons.some((r) => r.key === 'why.castles')) continue;
    if (!reasons.some((r) => r.key === key)) reasons.push({ key });
  }
  if (reasons.length === 0) reasons.push({ key: 'why.solid' });
  return reasons.slice(0, 3);
}

/* ------------------------------------------------------------------------ */
/* Exhaustive mate solver (puzzles)                                           */
/* ------------------------------------------------------------------------ */

/** Thrown when a mate search exceeds its node budget. */
export class BudgetExceeded extends Error {
  constructor() {
    super('Mate search budget exceeded');
  }
}

/**
 * Exhaustive AND/OR search for forced mates: "can the side to move force checkmate
 * within n of its own moves against every defence?". Exact (no heuristics); results
 * are memoised per (position, n). Repetition and fifty-move draws are ignored, which
 * cannot matter for mates of at most a few moves.
 */
export class MateSolver {
  nodes = 0;
  private readonly memo = new Map<string, boolean>();
  constructor(readonly budget = 5_000_000) {}

  private tick(): void {
    if (++this.nodes > this.budget) throw new BudgetExceeded();
  }

  /** Whether the side to move in `pos` forces mate within `n` moves. `pos` is restored afterwards. */
  canMate(pos: Position, n: number): boolean {
    if (n <= 0) return false;
    const key = `${pos.hashLo},${pos.hashHi},${n}`;
    const known = this.memo.get(key);
    if (known !== undefined) return known;
    let result = false;
    for (const move of orderForMate(pos, legalMoves(pos))) {
      if (this.forcesMate(pos, move, n)) {
        result = true;
        break;
      }
    }
    // Monotonic: a mate within n is also a mate within n + 1.
    this.memo.set(key, result);
    return result;
  }

  /** Whether `move` (legal for the side to move) forces mate within `n` moves including itself. */
  forcesMate(pos: Position, move: number, n: number): boolean {
    this.tick();
    const undo = makeMove(pos, move);
    let result: boolean;
    const replies = legalMoves(pos);
    if (replies.length === 0) result = inCheck(pos);
    else if (n <= 1) result = false;
    else {
      result = true;
      for (const reply of orderForMate(pos, replies)) {
        const r = makeMove(pos, reply);
        const ok = this.canMate(pos, n - 1);
        unmakeMove(pos, r);
        if (!ok) {
          result = false;
          break;
        }
      }
    }
    unmakeMove(pos, undo);
    return result;
  }

  /** Smallest n ≤ maxN with a forced mate in n for the side to move, or 0. */
  distance(pos: Position, maxN: number): number {
    for (let n = 1; n <= maxN; n++) if (this.canMate(pos, n)) return n;
    return 0;
  }

  /** All first moves that force mate within `n`. */
  solutions(pos: Position, n: number): number[] {
    return legalMoves(pos).filter((m) => this.forcesMate(pos, m, n));
  }

  /**
   * The defender's most stubborn reply (defender to move, attacker mates within `n` after
   * any reply): the reply after which the attacker's mate takes longest. Ties keep the
   * first reply in generation order, so the choice is deterministic.
   */
  bestDefence(pos: Position, n: number): number {
    let best = 0;
    let longest = -1;
    for (const reply of legalMoves(pos)) {
      const r = makeMove(pos, reply);
      const d = this.distance(pos, n);
      unmakeMove(pos, r);
      const length = d === 0 ? n + 1 : d;
      if (length > longest) {
        longest = length;
        best = reply;
      }
    }
    return best;
  }
}

/** Checks first, then captures, then the rest (stable): finds mates and refutations sooner. */
function orderForMate(pos: Position, moves: number[]): number[] {
  const keyed = moves.map((move) => {
    const undo = makeMove(pos, move);
    const check = inCheck(pos);
    unmakeMove(pos, undo);
    const capture = pos.board[moveTo(move)] !== 0 || moveFlag(move) === FLAG_EP;
    return { move, key: (check ? 2 : 0) + (capture ? 1 : 0) };
  });
  return keyed.sort((a, b) => b.key - a.key).map((k) => k.move);
}

/* ------------------------------------------------------------------------ */
/* Puzzle verification                                                        */
/* ------------------------------------------------------------------------ */

export interface MatePuzzle {
  fen: string;
  /** Forced mate in exactly n moves of the side to move. */
  n: number;
  /** Main line in UCI: attacker, defender (most stubborn), …, mating move (2n − 1 plies). */
  line: string[];
}

export interface BestMovePuzzle {
  fen: string;
  /** The single clearly best move (UCI). */
  move: string;
}

/** Minimum lead (centipawns) of the best move over every alternative in a best-move puzzle. */
export const BEST_MOVE_GAP = 150;

/**
 * Verifies a mate-in-n puzzle: no faster mate, exactly one first move that mates within n,
 * and returns the main line (first solution move at each turn, most stubborn defence).
 * Returns null if the position does not qualify. Throws `BudgetExceeded` if too expensive.
 */
export function verifyMatePuzzle(fen: string, n: number, solver = new MateSolver()): MatePuzzle | null {
  const pos = parseFen(fen);
  if (!pos || n < 1) return null;
  if (n > 1 && solver.canMate(pos, n - 1)) return null;
  const firsts = solver.solutions(pos, n);
  if (firsts.length !== 1) return null;
  const line: string[] = [];
  let move = firsts[0]!;
  for (let left = n; ; left--) {
    line.push(moveToUci(move));
    makeMove(pos, move);
    if (!hasLegalMove(pos)) break;
    const reply = solver.bestDefence(pos, left - 1);
    line.push(moveToUci(reply));
    makeMove(pos, reply);
    move = solver.solutions(pos, left - 1)[0]!;
  }
  return line.length === 2 * n - 1 ? { fen, n, line } : null;
}

/** The level used to judge best-move puzzles (all knowledge, wide search, no randomness). */
export const PUZZLE_LEVEL: Level = { ...LEVELS.strong, nodes: 150_000, margin: 0, temperature: 0 };

/**
 * Verifies a "find the best move" puzzle with a deep search: exactly one move lies within
 * `BEST_MOVE_GAP` of the best score, the best move is not a quick forced mate (that is the
 * other puzzle type), and a smaller search agrees on the move. Returns null otherwise.
 */
export function verifyBestMovePuzzle(fen: string, level: Level = PUZZLE_LEVEL): BestMovePuzzle | null {
  const pos = parseFen(fen);
  if (!pos || legalMoves(pos).length < 4) return null;
  const deep = analyse(pos, level, [], BEST_MOVE_GAP);
  if (deep.candidates.length !== 1 || Math.abs(deep.candidates[0]!.score) > MATE_BOUND) return null;
  const quick = analyse(pos, { ...level, nodes: Math.max(4000, level.nodes >> 2) }, [], 0);
  if (quick.candidates[0]?.move !== deep.candidates[0]!.move) return null;
  return { fen, move: moveToUci(deep.candidates[0]!.move) };
}

/* ------------------------------------------------------------------------ */
/* Puzzle play                                                                */
/* ------------------------------------------------------------------------ */

export interface PuzzleTurn {
  /** The new state (unchanged after a wrong move: wrong attempts are not stored). */
  state: ChessState;
  correct: boolean;
  /** After a wrong move: the engine's strongest answer to it (shows why it fails). */
  refutation?: number;
}

/** Runtime budget for checking alternative mating moves (a few hundred ms at most). */
const PUZZLE_SOLVER_BUDGET = 300_000;
const REFUTATION_LEVEL: Level = { ...LEVELS.strong, nodes: 20_000, margin: 0, temperature: 0 };

const onBook = (state: ChessState, line: readonly string[]) => state.moves.every((m, i) => m === line[i]);

/**
 * The person's move in a puzzle. Best move: only the verified move is correct. Mate in N:
 * the main-line move or ANY move that still forces mate within the remaining moves is
 * correct (checked with the exhaustive solver; the first move is unique by construction);
 * the engine then answers with the most stubborn defence. Throws on an illegal move.
 */
export function puzzleTurn(state: ChessState, uci: string): PuzzleTurn {
  const ref = puzzleOf(state);
  if (!ref) throw new RangeError('Not a puzzle');
  const pos = replayState(state).pos;
  const move = uciToMove(pos, uci);
  if (!move) throw new RangeError(`Illegal move ${uci}`);
  const wrong = (): PuzzleTurn => {
    const after = { ...pos, board: Int8Array.from(pos.board), kings: [pos.kings[0], pos.kings[1]] as [number, number] };
    makeMove(after, move);
    if (!hasLegalMove(after)) return { state, correct: false };
    return { state, correct: false, refutation: analyse(after, REFUTATION_LEVEL, [], 0).candidates[0]!.move };
  };
  if (state.mode === 'best') return uci === ref.line[0] ? { state: { ...state, moves: [uci] }, correct: true } : wrong();

  const k = state.moves.length;
  const left = state.mateN - k / 2;
  const book = onBook(state, ref.line) && uci === ref.line[k];
  const solver = new MateSolver(PUZZLE_SOLVER_BUDGET);
  let ok = book;
  if (!ok && k > 0) {
    try {
      ok = solver.forcesMate(pos, move, left);
    } catch (error) {
      if (!(error instanceof BudgetExceeded)) throw error;
    }
  }
  if (!ok) return wrong();
  makeMove(pos, move);
  const moves = [...state.moves, uci];
  if (!hasLegalMove(pos)) return { state: { ...state, moves }, correct: true };
  const reply = book ? ref.line[k + 1]! : moveToUci(solver.bestDefence(pos, left - 1));
  return { state: { ...state, moves: [...moves, reply] }, correct: true };
}

/** The next move of the puzzle's solution from the current position (for the hint button). */
export function puzzleHint(state: ChessState): number | null {
  const ref = puzzleOf(state);
  if (!ref) return null;
  const pos = replayState(state).pos;
  if (!hasLegalMove(pos) || (state.mode === 'best' && state.moves.length > 0)) return null;
  if (onBook(state, ref.line)) return uciToMove(pos, ref.line[state.moves.length]!) || null;
  try {
    return new MateSolver(PUZZLE_SOLVER_BUDGET).solutions(pos, state.mateN - state.moves.length / 2)[0] ?? null;
  } catch {
    return null;
  }
}
