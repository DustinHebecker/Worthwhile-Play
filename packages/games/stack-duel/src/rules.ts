/**
 * Stack Duel rules (pure, DOM-free).
 *
 * Players alternately drop the next piece onto a shared tower standing on a small platform.
 * A drop is resolved synchronously by the physics (fixed steps until every body sleeps, or
 * a step cap); only settled poses are stored, so the game can be closed at any moment.
 *
 * - Duel (vs computer or two people on one device): whoever's drop makes any piece fall
 *   below the platform loses. After `MAX_DUEL_PIECES` standing pieces the round is a draw.
 * - Solo "tower challenge": reach the target height with a limited number of pieces;
 *   a falling piece ends the attempt.
 *
 * Step cap: if the bodies have not all fallen asleep after `MAX_STEPS` (10 simulated
 * seconds), the poses at that moment are stored as the settled state (velocities are
 * dropped; the next simulation starts from rest). A drop that makes a piece fall is
 * simulated `TAIL_STEPS` further (for the animation) and then stopped.
 */
import { createRng, createRngFromState, isInt, isOneOf, isRecord, isUint32, type Rng } from '@wp/game-core';
import { World } from './physics';
import { KIND_COUNT, PIECE_KINDS, PIECE_WEIGHTS, rotatePoint } from './pieces';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'easy';

export const MODES = ['computer', 'human', 'solo'] as const;
export type Mode = (typeof MODES)[number];

/** Half the width of the platform top (world units). */
export const PLATFORM_HALF = 2.5;
export const PLATFORM_DEPTH = 0.8;
/** The held piece's centre may move this far from the middle. */
export const X_LIMIT = 3;
/** Positions snap to a grid of 1/X_GRID_DIVISIONS units (keeps saves short and keyboard steps exact). */
export const X_GRID_DIVISIONS = 20;
/** Rotation steps of 15°; `rot` is stored as 0 … ROT_STEPS-1 (counter-clockwise). */
export const ROT_STEPS = 24;
/** Gap between the tower top and the lowest point of the held piece when it is released. */
export const DROP_GAP = 0.5;
/** A body whose centre is below this height has fallen off the platform. */
export const FALL_Y = -1;
export const MAX_STEPS = 600;
export const TAIL_STEPS = 45;
/** Animation frames are recorded every this many physics steps (1/30 s). */
export const RECORD_EVERY = 2;
export const MAX_DUEL_PIECES = 40;

/**
 * Solo targets, balanced with a greedy one-step look-ahead builder (seeds 1–10): it reaches
 * them in roughly 8/10 (easy), 5/10 (medium) and 2–3/10 (hard) attempts; a careful person
 * can do better since there is no time limit.
 */
export interface SoloGoal {
  readonly height: number;
  readonly pieces: number;
}

export const SOLO_GOALS: Readonly<Record<Difficulty, SoloGoal>> = {
  easy: { height: 6, pieces: 12 },
  medium: { height: 6.5, pieces: 12 },
  hard: { height: 7, pieces: 14 }
};

/** A settled piece: kind index, centre-of-mass position and angle (radians, CCW). */
export interface Placed {
  k: number;
  x: number;
  y: number;
  a: number;
}

export interface Cursor {
  x: number;
  rot: number;
}

export type Result =
  /** `by` = index of the player whose drop made a piece fall (always 0 in solo). */
  | { kind: 'fell'; by: 0 | 1 }
  | { kind: 'height' }
  | { kind: 'short' }
  | { kind: 'full' };

export interface StackDuelState {
  seed: number;
  difficulty: Difficulty;
  mode: Mode;
  /** Settled pieces in drop order (piece i was placed by player i % 2 in a duel). */
  bodies: Placed[];
  /** Kind of the held piece and of the next one (preview). */
  queue: [number, number];
  /** Piece generator state after drawing `bodies.length + 2` pieces. */
  rng: number;
  cursor: Cursor;
  result: Result | null;
}

/* ---------------- Piece sequence ---------------- */

/** Weighted draw of the next piece kind. */
export function drawKind(rng: Rng, difficulty: Difficulty): number {
  const weights = PIECE_WEIGHTS[difficulty];
  let total = 0;
  for (const w of weights) total += w;
  let r = rng.next() * total;
  for (let k = 0; k < weights.length; k++) {
    r -= weights[k]!;
    if (r < 0) return k;
  }
  return weights.length - 1;
}

export function newState(seed: number, difficulty: Difficulty, mode: Mode): StackDuelState {
  const rng = createRng(seed);
  const first = drawKind(rng, difficulty);
  const second = drawKind(rng, difficulty);
  return { seed: seed >>> 0, difficulty, mode, bodies: [], queue: [first, second], rng: rng.state(), cursor: { x: 0, rot: 0 }, result: null };
}

/* ---------------- Geometry helpers ---------------- */

export const angleOf = (rot: number): number => (rot * 2 * Math.PI) / ROT_STEPS;

/** Wraps an angle into [-π, π). */
export function normalizeAngle(a: number): number {
  const turn = 2 * Math.PI;
  return a - turn * Math.floor((a + Math.PI) / turn);
}

export const snapX = (x: number): number => {
  const clamped = Math.max(-X_LIMIT, Math.min(X_LIMIT, x));
  return Math.round(clamped * X_GRID_DIVISIONS) / X_GRID_DIVISIONS;
};

export const wrapRot = (rot: number): number => ((Math.round(rot) % ROT_STEPS) + ROT_STEPS) % ROT_STEPS;

/** World-space outline of a placed piece. */
export function outlineOf(p: Placed): [number, number][] {
  return PIECE_KINDS[p.k]!.outline.map((pt) => {
    const [x, y] = rotatePoint(pt, p.a);
    return [p.x + x, p.y + y];
  });
}

export const hasFallen = (p: Placed): boolean => p.y < FALL_Y;

/** Highest point of the standing tower (0 = bare platform). */
export function towerHeight(bodies: readonly Placed[]): number {
  let top = 0;
  for (const b of bodies) {
    if (hasFallen(b)) continue;
    for (const [, y] of outlineOf(b)) if (y > top) top = y;
  }
  return top;
}

/** Pose where the held piece hangs before it is released. */
export function spawnPose(bodies: readonly Placed[], kind: number, cursor: Cursor): Placed {
  const a = angleOf(wrapRot(cursor.rot));
  let low = Infinity;
  for (const pt of PIECE_KINDS[kind]!.outline) low = Math.min(low, rotatePoint(pt, a)[1]);
  return { k: kind, x: snapX(cursor.x), y: towerHeight(bodies) + DROP_GAP - low, a };
}

/* ---------------- Simulation ---------------- */

export interface DropOutcome {
  /** All bodies after the drop (old ones in order, the new piece last). */
  bodies: Placed[];
  /** Indices of bodies that ended below the platform. */
  fallen: number[];
  steps: number;
  /** True when everything fell asleep before the step cap (or a piece fell). */
  settled: boolean;
  /** Recorded poses (x, y, a per body, flattened) every RECORD_EVERY steps, if requested. */
  frames?: number[][];
}

export interface SimOptions {
  maxSteps?: number;
  record?: boolean;
  /** Stop as soon as a piece falls (used by the computer player; no tail for animation). */
  stopOnFall?: boolean;
}

export function platformParts(): [number, number][][] {
  return [
    [
      [-PLATFORM_HALF, -PLATFORM_DEPTH],
      [PLATFORM_HALF, -PLATFORM_DEPTH],
      [PLATFORM_HALF, 0],
      [-PLATFORM_HALF, 0]
    ]
  ];
}

/** Builds a world with the platform and the settled bodies (all asleep, at rest). */
export function buildWorld(bodies: readonly Placed[], awake = false): World {
  const world = new World();
  world.add({ parts: platformParts(), x: 0, y: 0, a: 0, isStatic: true });
  for (const b of bodies) world.add({ parts: PIECE_KINDS[b.k]!.parts, x: b.x, y: b.y, a: b.a, asleep: !awake });
  world.prime();
  return world;
}

const snapshot = (world: World, kinds: readonly number[]): Placed[] =>
  kinds.map((k, i) => {
    const b = world.bodies[i + 1]!;
    return { k, x: b.x, y: b.y, a: normalizeAngle(b.a) };
  });

/** Largest displacement of any body between two snapshots of the same bodies. */
export function maxDisplacement(before: readonly Placed[], after: readonly Placed[]): number {
  let worst = 0;
  for (let i = 0; i < before.length; i++) {
    const a = before[i]!;
    const b = after[i]!;
    worst = Math.max(worst, Math.abs(b.x - a.x), Math.abs(b.y - a.y), Math.abs(normalizeAngle(b.a - a.a)));
  }
  return worst;
}

/** A settled snapshot is accepted once a cold restart from it moves nothing more than this … */
export const VERIFY_TOLERANCE = 0.01;
/** … within this many steps (or until everything sleeps again). */
export const VERIFY_STEPS = 60;

/**
 * Runs a world with the given kinds until it is settled, a piece falls (plus tail) or the cap is hit.
 *
 * "Settled" means: every body fell asleep, and a cold restart from that snapshot (all bodies
 * awake, zero velocity, re-primed contacts — what the next drop will meet) moves no body by more
 * than VERIFY_TOLERANCE within VERIFY_STEPS. The snapshot taken before the restart is stored.
 * If the restart moves things more, the simulation simply goes on from the restarted world.
 * This keeps saved towers stable when the game is resumed and the next piece touches them.
 */
export function runWorld(initial: World, kinds: readonly number[], options: SimOptions = {}): DropOutcome {
  const maxSteps = options.maxSteps ?? MAX_STEPS;
  let world = initial;
  const frames: number[][] | undefined = options.record ? [] : undefined;
  const record = () => {
    if (!frames) return;
    const f: number[] = [];
    for (let i = 1; i < world.bodies.length; i++) {
      const b = world.bodies[i]!;
      f.push(b.x, b.y, b.a);
    }
    frames.push(f);
  };
  record();
  let steps = 0;
  let fellAt = -1;
  let accepted: Placed[] | undefined;
  let verifyFrom: Placed[] | undefined;
  let verifyStart = 0;
  let verifyFrames = 0;
  while (steps < maxSteps) {
    world.step();
    steps++;
    if (steps % RECORD_EVERY === 0) record();
    if (fellAt < 0) {
      for (let i = 1; i < world.bodies.length; i++) {
        if (world.bodies[i]!.y < FALL_Y) {
          fellAt = steps;
          break;
        }
      }
      if (fellAt >= 0 && options.stopOnFall) break;
    }
    if (fellAt >= 0) {
      if (steps - fellAt >= TAIL_STEPS) break;
      continue;
    }
    if (verifyFrom) {
      if (!world.allAsleep() && steps - verifyStart < VERIFY_STEPS) continue;
      if (maxDisplacement(verifyFrom, snapshot(world, kinds)) <= VERIFY_TOLERANCE) {
        accepted = verifyFrom;
        if (frames) frames.length = verifyFrames;
        break;
      }
      verifyFrom = undefined;
    }
    if (world.allAsleep()) {
      verifyFrom = snapshot(world, kinds);
      verifyStart = steps;
      verifyFrames = frames ? frames.length : 0;
      world = buildWorld(verifyFrom, true);
    }
  }
  const bodies = accepted ?? snapshot(world, kinds);
  if (frames) {
    const f: number[] = [];
    for (const b of bodies) f.push(b.x, b.y, b.a);
    frames.push(f);
  }
  const fallen: number[] = [];
  bodies.forEach((b, i) => {
    if (hasFallen(b)) fallen.push(i);
  });
  const outcome: DropOutcome = { bodies, fallen, steps, settled: accepted !== undefined || fellAt >= 0 };
  if (frames) outcome.frames = frames;
  return outcome;
}

/** Simulates releasing `kind` at `cursor` above the settled `bodies`. */
export function simulateDrop(bodies: readonly Placed[], kind: number, cursor: Cursor, options: SimOptions = {}): DropOutcome {
  const world = buildWorld(bodies);
  const pose = spawnPose(bodies, kind, cursor);
  world.add({ parts: PIECE_KINDS[kind]!.parts, x: pose.x, y: pose.y, a: pose.a });
  return runWorld(world, [...bodies.map((b) => b.k), kind], options);
}

/* ---------------- Turns ---------------- */

/** Index of the player to move: always 0 in solo, alternating in a duel. */
export const playerToMove = (state: StackDuelState): 0 | 1 => (state.mode === 'solo' ? 0 : ((state.bodies.length % 2) as 0 | 1));

export const isOver = (state: StackDuelState): boolean => state.result !== null;

export const piecesLeft = (state: StackDuelState): number =>
  state.mode === 'solo' ? SOLO_GOALS[state.difficulty].pieces - state.bodies.length : MAX_DUEL_PIECES - state.bodies.length;

function judge(state: StackDuelState, bodies: readonly Placed[], fell: boolean, by: 0 | 1): Result | null {
  if (fell) return { kind: 'fell', by };
  if (state.mode === 'solo') {
    const goal = SOLO_GOALS[state.difficulty];
    if (towerHeight(bodies) >= goal.height) return { kind: 'height' };
    if (bodies.length >= goal.pieces) return { kind: 'short' };
    return null;
  }
  return bodies.length >= MAX_DUEL_PIECES ? { kind: 'full' } : null;
}

export interface DropResult {
  state: StackDuelState;
  outcome: DropOutcome;
}

/** Releases the held piece at `cursor`. Returns the unchanged state (and no outcome) when the round is over. */
export function drop(state: StackDuelState, cursor: Cursor = state.cursor, options: SimOptions = {}): DropResult | undefined {
  if (state.result !== null) return undefined;
  const by = playerToMove(state);
  const kind = state.queue[0];
  const clean = { x: snapX(cursor.x), rot: wrapRot(cursor.rot) };
  const outcome = simulateDrop(state.bodies, kind, clean, { maxSteps: options.maxSteps ?? MAX_STEPS, record: options.record === true });
  const rng = createRngFromState(state.rng);
  const nextKind = drawKind(rng, state.difficulty);
  const result = judge(state, outcome.bodies, outcome.fallen.length > 0, by);
  return {
    state: {
      ...state,
      bodies: outcome.bodies,
      queue: [state.queue[1], nextKind],
      rng: rng.state(),
      cursor: { x: 0, rot: 0 },
      result
    },
    outcome
  };
}

export function withCursor(state: StackDuelState, cursor: Cursor): StackDuelState {
  return { ...state, cursor: { x: snapX(cursor.x), rot: wrapRot(cursor.rot) } };
}

export function cloneState(state: StackDuelState): StackDuelState {
  return {
    ...state,
    bodies: state.bodies.map((b) => ({ ...b })),
    queue: [state.queue[0], state.queue[1]],
    cursor: { ...state.cursor },
    result: state.result ? { ...state.result } : null
  };
}

/* ---------------- Validation ---------------- */

const isFiniteIn = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

const isKind = (v: unknown): v is number => isInt(v, 0, KIND_COUNT - 1);

function isPlaced(v: unknown): v is Placed {
  return (
    isRecord(v) &&
    Object.keys(v).length === 4 &&
    isKind(v.k) &&
    isFiniteIn(v.x, -100, 100) &&
    isFiniteIn(v.y, -10000, 1000) &&
    isFiniteIn(v.a, -Math.PI, Math.PI)
  );
}

function isResult(v: unknown): v is Result {
  if (v === null) return true;
  if (!isRecord(v)) return false;
  if (v.kind === 'fell') return Object.keys(v).length === 2 && (v.by === 0 || v.by === 1);
  return Object.keys(v).length === 1 && (v.kind === 'height' || v.kind === 'short' || v.kind === 'full');
}

/** Structural and cross-field validation of untrusted data. Never throws. */
export function isValidState(value: unknown): value is StackDuelState {
  try {
    if (!isRecord(value)) return false;
    const s = value;
    if (!isUint32(s.seed) || !isOneOf(s.difficulty, DIFFICULTIES) || !isOneOf(s.mode, MODES)) return false;
    if (!isUint32(s.rng)) return false;
    if (!Array.isArray(s.queue) || s.queue.length !== 2 || !s.queue.every(isKind)) return false;
    if (!isRecord(s.cursor) || !isFiniteIn(s.cursor.x, -X_LIMIT, X_LIMIT) || !isInt(s.cursor.rot, 0, ROT_STEPS - 1)) return false;
    const solo = s.mode === 'solo';
    const cap = solo ? SOLO_GOALS[s.difficulty].pieces : MAX_DUEL_PIECES;
    if (!Array.isArray(s.bodies) || s.bodies.length > cap || !s.bodies.every(isPlaced)) return false;
    if (!isResult(s.result)) return false;
    const bodies = s.bodies as Placed[];
    const result = s.result as Result | null;

    // The piece sequence must be exactly what the seed produces.
    const rng = createRng(s.seed);
    for (const b of bodies) if (drawKind(rng, s.difficulty) !== b.k) return false;
    if (drawKind(rng, s.difficulty) !== s.queue[0] || drawKind(rng, s.difficulty) !== s.queue[1]) return false;
    if (rng.state() !== s.rng) return false;

    const anyFallen = bodies.some(hasFallen);
    if (result === null) return !anyFallen && bodies.length < cap && !(solo && towerHeight(bodies) >= SOLO_GOALS[s.difficulty].height);
    if (result.kind === 'fell') {
      if (!anyFallen || bodies.length === 0) return false;
      return result.by === (solo ? 0 : (bodies.length - 1) % 2);
    }
    if (anyFallen) return false;
    if (result.kind === 'full') return !solo && bodies.length === MAX_DUEL_PIECES;
    if (!solo) return false;
    if (result.kind === 'height') return towerHeight(bodies) >= SOLO_GOALS[s.difficulty].height;
    return bodies.length === cap && towerHeight(bodies) < SOLO_GOALS[s.difficulty].height;
  } catch {
    return false;
  }
}
