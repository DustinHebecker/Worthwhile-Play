/**
 * Laser Paths rules: pure, DOM-free logic and the serializable state.
 *
 * The board is a small grid. Fixed elements (lasers, mirrors, beam splitters, colour filters,
 * blockers, optical diodes, portals, polarisers, neutral-density filters, targets and forbidden
 * sensors) come from the level; the player places pieces from a limited inventory on empty squares
 * and turns them. The level is solved when every target receives exactly the light it asks for
 * and no forbidden sensor receives any light.
 *
 * Optics model (discrete, physically motivated, honestly simplified)
 * ------------------------------------------------------------------
 * A beam carries three things:
 * - Colour: additive RGB masks (red = 1, green = 2, blue = 4), so mixing is a bitwise OR
 *   (red + blue = magenta = 5) and an ideal colour filter is a bitwise AND.
 * - Polarisation: unpolarised, or linear at 0°, 45°, 90° or 135° (measured in the plane across
 *   the beam). Lasers here emit unpolarised light.
 * - Intensity, relative to a laser: 1, ½, ¼ … in halvings. Every element below changes intensity by
 *   a factor 1, ½ or 0, so all values stay exact powers of two. Below 1/64 the tracer stops
 *   halving (fainter light still counts as light): this keeps the state space finite.
 *
 * Elements:
 * - Mirror: turns the beam by 90°; colour, polarisation and intensity unchanged.
 * - Beam splitter (half-silvered mirror): half the intensity goes straight on, half is reflected.
 * - Colour filter: passes only its colour components, absorbs the rest (intensity of the passed
 *   components unchanged).
 * - Chromatic blocker (a dichroic absorber): absorbs one colour component, passes the others.
 * - Neutral-density filter: halves the intensity of all colours equally; colour and polarisation
 *   unchanged.
 * - Polariser at angle θ: unpolarised light leaves linearly polarised at θ with half the intensity;
 *   linear light at φ leaves at θ with intensity × cos²(θ − φ) (Malus's law): × 1 for the same
 *   angle, × ½ for 45° apart, 0 (blocked) for 90° apart.
 * - Optical diode (isolator): passes light in its arrow's direction only; light from any other
 *   side is absorbed. Real optical isolators use the Faraday effect; here it is an ideal one-way
 *   element that leaves the light unchanged.
 * - Portal: light entering one portal leaves the other portal of its pair unchanged.
 *
 * Simplifications: mirrors and splitters keep the polarisation (real mirrors keep vertical and
 * horizontal polarisation but can change diagonal ones), beams do not interfere, and light arriving
 * from several beams simply adds up.
 *
 * Targets need an exact colour. Some also need an exact intensity (per colour component, the sum of
 * all beams arriving) and/or a polarisation (an "analyser" target: all arriving light must be
 * linearly polarised at that angle). Targets without such a requirement accept any intensity and
 * any polarisation, so levels without polarisers or intensity targets behave as plain colour
 * puzzles.
 *
 * `traceBeams` is a generic, reusable beam tracer: it only needs a `Board` and knows nothing about
 * levels, inventory or game state.
 */
import { isInt, isOneOf, isRecord, isUint32, normalizeSeed } from '@wp/game-core';
import { LEVELS, type LevelSource } from './levels';

/* ---------- Colours ---------- */

export const RED = 1;
export const GREEN = 2;
export const BLUE = 4;
export const WHITE = RED | GREEN | BLUE;
/** The three primary colours, in mask order. */
export const PRIMARIES = [RED, GREEN, BLUE] as const;

/** Letter for each colour mask 0–7 ('' = no light). Letters are shown on the board in every language. */
export const COLOUR_LETTERS = ['', 'R', 'G', 'Y', 'B', 'M', 'C', 'W'] as const;
export type ColourLetter = Exclude<(typeof COLOUR_LETTERS)[number], ''>;

/** `'R'` for 1, `'M'` for 5, `''` for 0 (no light). */
export const colourLetter = (mask: number): string => COLOUR_LETTERS[mask] ?? '';

/** Mask for a colour letter, or 0 for anything else. */
export const colourFromLetter = (letter: string): number => Math.max(0, COLOUR_LETTERS.indexOf(letter as ColourLetter));

export const isColour = (value: unknown): value is number => isInt(value, 1, WHITE);

/* ---------- Polarisation and intensity ---------- */

/** Polariser angle in steps of 45°: 0 = 0°, 1 = 45°, 2 = 90°, 3 = 135°. */
export type Angle = 0 | 1 | 2 | 3;
export const ANGLES: readonly Angle[] = [0, 1, 2, 3];
export const angleDegrees = (angle: Angle): number => angle * 45;

/** Polarisation of a beam: 0 = unpolarised, 1–4 = linear at angle 0–3 (0°, 45°, 90°, 135°). */
export type Polarisation = 0 | 1 | 2 | 3 | 4;
export const UNPOLARISED: Polarisation = 0;
export const linear = (angle: Angle): Polarisation => (angle + 1) as Polarisation;
/** The angle of linear polarisation, or undefined for unpolarised light. */
export const polarisationAngle = (pol: Polarisation): Angle | undefined => (pol === 0 ? undefined : ((pol - 1) as Angle));

/** Intensity is 2^-level of a laser's; light is not halved beyond this level (1/64). */
export const MAX_LEVEL = 6;
export const intensityOf = (level: number): number => 2 ** -level;
const dimmer = (level: number, halvings: number): number => Math.min(MAX_LEVEL, level + halvings);

/**
 * Fraction of the intensity a polariser at `angle` lets through (Malus's law, exact for 45° steps):
 * ½ for unpolarised light, cos²(θ − φ) for light polarised at φ.
 */
export function polariserTransmission(pol: Polarisation, angle: Angle): 1 | 0.5 | 0 {
  if (pol === 0) return 0.5;
  const apart = (pol - 1 - angle + 4) % 4;
  return apart === 0 ? 1 : apart === 2 ? 0 : 0.5;
}

/** The light state of one beam (several colours travelling together). */
export interface Light {
  readonly colour: number;
  readonly pol: Polarisation;
  /** Intensity 2^-level of a laser's. */
  readonly level: number;
}

/** Unpolarised full-intensity light of `colour`, as a laser emits it. */
export const laserLight = (colour: number): Light => ({ colour, pol: 0, level: 0 });

/* ---------- Directions and geometry ---------- */

/** Travel directions: 0 = up (north), 1 = right (east), 2 = down (south), 3 = left (west). */
export type Dir = 0 | 1 | 2 | 3;
export const DIRS: readonly Dir[] = [0, 1, 2, 3];
const ROW_STEP = [-1, 0, 1, 0] as const;
const COL_STEP = [0, 1, 0, -1] as const;

export const opposite = (dir: Dir): Dir => ((dir + 2) % 4) as Dir;

/** Orientation of a mirror or splitter: 0 = `/`, 1 = `\`. */
export type Orientation = 0 | 1;

/**
 * Direction of a beam travelling `dir` after bouncing off a mirror.
 * `/` swaps up↔right and down↔left; `\` swaps up↔left and down↔right.
 */
export function reflect(dir: Dir, orient: Orientation): Dir {
  return (orient === 0 ? dir ^ 1 : 3 - dir) as Dir;
}

/** The neighbouring cell index in `dir`, or -1 when that leaves the board. */
export function neighbour(width: number, height: number, cell: number, dir: Dir): number {
  const row = Math.floor(cell / width) + ROW_STEP[dir];
  const col = (cell % width) + COL_STEP[dir];
  if (row < 0 || row >= height || col < 0 || col >= width) return -1;
  return row * width + col;
}

/* ---------- Board elements and the beam tracer ---------- */

export type Element =
  | { readonly kind: 'empty' }
  /** Light source: sends unpolarised light of `colour` out of its square in `dir`. Absorbs light that hits it. */
  | { readonly kind: 'emitter'; readonly dir: Dir; readonly colour: number }
  /** Turns the beam by 90°. */
  | { readonly kind: 'mirror'; readonly orient: Orientation }
  /** Half-silvered mirror: half the intensity continues straight on, half is reflected. */
  | { readonly kind: 'splitter'; readonly orient: Orientation }
  /** Lets through only the parts of the light contained in `colour`, in any direction. */
  | { readonly kind: 'filter'; readonly colour: number }
  /** Chromatic blocker: absorbs the colour components in `colour` and passes the rest. */
  | { readonly kind: 'absorber'; readonly colour: number }
  /** Neutral-density filter: halves the intensity of every colour. */
  | { readonly kind: 'neutral' }
  /** Linear polariser with its transmission axis at `angle`. */
  | { readonly kind: 'polariser'; readonly angle: Angle }
  /** Absorbs all light. */
  | { readonly kind: 'blocker' }
  /**
   * Absorbs light; must end up receiving exactly `colour`, and when given, exactly intensity
   * 2^-`level` in each of its colour components and only light linearly polarised at `pol`.
   */
  | { readonly kind: 'target'; readonly colour: number; readonly level?: number; readonly pol?: Angle }
  /** Absorbs light; must receive none. */
  | { readonly kind: 'sensor' }
  /** Optical diode: light travelling `dir` passes straight through; light from any other side is absorbed. */
  | { readonly kind: 'gate'; readonly dir: Dir }
  /**
   * Portal of pair `pair` (1–3). Light that enters it comes out of the other portal of the same
   * pair, still travelling the same way. Both portals count as lit.
   */
  | { readonly kind: 'portal'; readonly pair: number };

export type ElementKind = Element['kind'];

export interface Board {
  readonly width: number;
  readonly height: number;
  /** Row-major, `width * height` entries. */
  readonly cells: readonly Element[];
}

/** Light that entered a square: travelling `dir`, with this colour, polarisation and intensity. */
export interface Arrival extends Light {
  readonly dir: Dir;
}

export interface BeamTrace {
  readonly width: number;
  readonly height: number;
  /**
   * Light crossing each side of each square: `sides[cell * 4 + dir]` is the colour mask of all
   * light that passes through the side of `cell` facing `dir` (in either direction). Drawing a
   * line from the square's centre to every lit side draws all beams.
   */
  readonly sides: number[];
  /** Brightest light crossing each side, as an intensity level (0 = full); -1 when dark. */
  readonly sideLevels: number[];
  /** Colour mask of all light that enters each square (mixed additively). */
  readonly lit: number[];
  /**
   * Every distinct beam state that enters each square. A beam state (direction, polarisation,
   * intensity) appears once per colour component, so summing intensities per component is exact.
   */
  readonly arrivals: Arrival[][];
}

/**
 * Directions in which light travelling `dir` leaves an element it has entered, together with the
 * light that survives. Absorbing elements return no exits. A portal also returns none here: its
 * light leaves from the *other* portal of the pair, which `traceBeams` handles.
 */
export function exits(element: Element, dir: Dir, light: Light): { dir: Dir; light: Light }[] {
  switch (element.kind) {
    case 'empty':
      return [{ dir, light }];
    case 'mirror':
      return [{ dir: reflect(dir, element.orient), light }];
    case 'splitter': {
      const half = { ...light, level: dimmer(light.level, 1) };
      return [{ dir, light: half }, { dir: reflect(dir, element.orient), light: half }];
    }
    case 'filter':
    case 'absorber': {
      const colour = element.kind === 'filter' ? light.colour & element.colour : light.colour & ~element.colour;
      return colour === 0 ? [] : [{ dir, light: { ...light, colour } }];
    }
    case 'neutral':
      return [{ dir, light: { ...light, level: dimmer(light.level, 1) } }];
    case 'polariser': {
      const passed = polariserTransmission(light.pol, element.angle);
      if (passed === 0) return [];
      return [{ dir, light: { colour: light.colour, pol: linear(element.angle), level: dimmer(light.level, passed === 1 ? 0 : 1) } }];
    }
    case 'gate':
      return element.dir === dir ? [{ dir, light }] : [];
    default:
      return [];
  }
}

const LEVELS_PER_POL = MAX_LEVEL + 1;
/** Index of a beam state (square, direction, polarisation, intensity level) in the tracer's tables. */
const stateIndex = (cell: number, dir: Dir, light: Light) => ((cell * 4 + dir) * 5 + light.pol) * LEVELS_PER_POL + light.level;

/**
 * Traces all laser beams on a board and returns which light reaches which square.
 *
 * Beams travel orthogonally, one square at a time, from every emitter. Each square's element
 * decides where entering light goes next (see `exits`). Light of several colours in the same state
 * is handled together as one colour mask, and light arriving at a square from several beams mixes
 * additively (bitwise OR).
 *
 * Light entering a portal reappears in the other portal of its pair and leaves it in the same
 * direction (a portal without a partner absorbs).
 *
 * The tracer is a work-list fixpoint over beam states (square, travel direction, polarisation,
 * intensity level): it remembers which colours have already been in each state and only
 * propagates colours that are new. There are 5 polarisations and 7 intensity levels (halving stops
 * at 1/64) and a mask has only three bits, so each state is expanded at most three times and
 * tracing always terminates — also for beams caught in mirror, splitter or portal loops. The result
 * is the least fixpoint, so it does not depend on the order in which work is processed or of the
 * emitters.
 */
export function traceBeams(board: Board): BeamTrace {
  const { width, height, cells } = board;
  const size = width * height;
  const sides = new Array<number>(size * 4).fill(0);
  const sideLevels = new Array<number>(size * 4).fill(-1);
  const lit = new Array<number>(size).fill(0);
  const arrivals: Arrival[][] = Array.from({ length: size }, () => []);
  /** Colours already propagated in each beam state. */
  const seen = new Uint8Array(size * 4 * 5 * LEVELS_PER_POL);
  /** Pending light: square entered, direction of travel, light. */
  const queue: [number, Dir, Light][] = [];

  const markSide = (index: number, light: Light) => {
    sides[index] = (sides[index] ?? 0) | light.colour;
    const before = sideLevels[index] ?? -1;
    if (before < 0 || light.level < before) sideLevels[index] = light.level;
  };

  /** Light leaves `cell` through its `dir` side. */
  const leave = (cell: number, dir: Dir, light: Light) => {
    markSide(cell * 4 + dir, light);
    const next = neighbour(width, height, cell, dir);
    if (next >= 0) queue.push([next, dir, light]);
  };

  /** The other portal of each portal's pair (-1 when it has none). */
  const partner = new Map<number, number>();
  const firstOfPair = new Map<number, number>();
  cells.forEach((element, cell) => {
    if (element.kind === 'emitter' && element.colour > 0) leave(cell, element.dir, laserLight(element.colour & WHITE));
    if (element.kind !== 'portal') return;
    const first = firstOfPair.get(element.pair);
    if (first === undefined) firstOfPair.set(element.pair, cell);
    else if (!partner.has(first)) {
      partner.set(first, cell);
      partner.set(cell, first);
    }
  });

  while (queue.length > 0) {
    const [cell, dir, light] = queue.pop() as [number, Dir, Light];
    const index = stateIndex(cell, dir, light);
    const fresh = light.colour & ~(seen[index] ?? 0);
    if (fresh === 0) continue;
    seen[index] = (seen[index] ?? 0) | fresh;
    const entering: Light = { colour: fresh, pol: light.pol, level: light.level };
    markSide(cell * 4 + opposite(dir), entering);
    lit[cell] = (lit[cell] ?? 0) | fresh;
    arrivals[cell]!.push({ dir, ...entering });
    const element = cells[cell] as Element;
    if (element.kind === 'portal') {
      const other = partner.get(cell);
      if (other !== undefined) {
        lit[other] = (lit[other] ?? 0) | fresh;
        arrivals[other]!.push({ dir, ...entering });
        leave(other, dir, entering);
      }
      continue;
    }
    for (const out of exits(element, dir, entering)) leave(cell, out.dir, out.light);
  }
  return { width, height, sides, sideLevels, lit, arrivals };
}

/** Total intensity of colour component `primary` in a list of arrivals (exact: sums of powers of two). */
export function componentIntensity(arrivals: readonly Arrival[], primary: number): number {
  return arrivals.reduce((sum, arrival) => sum + ((arrival.colour & primary) !== 0 ? intensityOf(arrival.level) : 0), 0);
}

/** The brightest colour component's total intensity (0 when dark). */
export const brightness = (arrivals: readonly Arrival[]): number => Math.max(0, ...PRIMARIES.map((primary) => componentIntensity(arrivals, primary)));

/** The distinct polarisations among arrivals, sorted. */
export const polarisations = (arrivals: readonly Arrival[]): Polarisation[] => [...new Set(arrivals.map((arrival) => arrival.pol))].sort();

export interface TargetStatus {
  readonly cell: number;
  /** Required colour mask. */
  readonly need: number;
  /** Required intensity level (exact 2^-level per colour component), if any. */
  readonly needLevel?: number;
  /** Required linear polarisation, if any. */
  readonly needPol?: Angle;
  /** Received colour mask (0 = dark). */
  readonly got: number;
  /** Total intensity of the brightest received colour component. */
  readonly intensity: number;
  /** Distinct received polarisations. */
  readonly pols: readonly Polarisation[];
  /** Colour, intensity and polarisation all as required. */
  readonly ok: boolean;
}

export interface Evaluation {
  readonly targets: readonly TargetStatus[];
  /** Number of targets receiving exactly what they need. */
  readonly correct: number;
  /** Forbidden sensors that receive light. */
  readonly litSensors: readonly number[];
  /** Every target correct, no forbidden sensor lit, and at least one target on the board. */
  readonly solved: boolean;
}

/** Whether light received by a target meets all of its requirements. */
export function targetSatisfied(target: Extract<Element, { kind: 'target' }>, got: number, arrivals: readonly Arrival[]): boolean {
  if (got !== target.colour) return false;
  if (target.level !== undefined) {
    const wanted = intensityOf(target.level);
    if (PRIMARIES.some((primary) => (target.colour & primary) !== 0 && componentIntensity(arrivals, primary) !== wanted)) return false;
  }
  if (target.pol !== undefined && arrivals.some((arrival) => arrival.pol !== linear(target.pol as Angle))) return false;
  return true;
}

export function evaluate(board: Board, trace: BeamTrace = traceBeams(board)): Evaluation {
  const targets: TargetStatus[] = [];
  const litSensors: number[] = [];
  board.cells.forEach((element, cell) => {
    const got = trace.lit[cell] ?? 0;
    const arrivals = trace.arrivals[cell] ?? [];
    if (element.kind === 'target') {
      targets.push({
        cell,
        need: element.colour,
        ...(element.level === undefined ? {} : { needLevel: element.level }),
        ...(element.pol === undefined ? {} : { needPol: element.pol }),
        got,
        intensity: brightness(arrivals),
        pols: polarisations(arrivals),
        ok: targetSatisfied(element, got, arrivals)
      });
    } else if (element.kind === 'sensor' && got !== 0) litSensors.push(cell);
  });
  const correct = targets.filter((target) => target.ok).length;
  return { targets, correct, litSensors, solved: targets.length > 0 && correct === targets.length && litSensors.length === 0 };
}

/* ---------- Difficulties and level sets ---------- */

/**
 * Level sets. The ids are what a save stores. `intro` holds the original first eight levels: no
 * longer offered for new games (they were too easy), but kept so that old saves still play.
 */
export const LEVEL_SETS = ['intro', 'easy', 'medium', 'hard', 'expert'] as const;
export type LevelSet = (typeof LEVEL_SETS)[number];

/** Difficulties offered for new games (`metadata.difficulties`). */
export const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
export const DEFAULT_DIFFICULTY: Difficulty = 'easy';
export const toDifficulty = (value: unknown): Difficulty => (isOneOf(value, DIFFICULTIES) ? value : DEFAULT_DIFFICULTY);
export const isSelectable = (set: LevelSet): set is Difficulty => isOneOf(set, DIFFICULTIES);

/**
 * Level set ids of state version 1, when every set was one step easier in name: the old "easy"
 * set is now `intro`, old "medium" is now `easy`, old "hard" is `medium`, old "expert" is `hard`.
 */
export const LEGACY_LEVEL_SETS: Readonly<Record<string, LevelSet>> = { easy: 'intro', medium: 'easy', hard: 'medium', expert: 'hard' };

/* ---------- Pieces ---------- */

/** Pieces the player can place. */
export const PIECE_KINDS = ['mirror', 'splitter', 'blocker', 'polariser', 'neutral', 'filterR', 'filterG', 'filterB', 'minusR', 'minusG', 'minusB'] as const;
export type PieceKind = (typeof PIECE_KINDS)[number];

/** How many orientations a piece has: mirrors and splitters 2 (`/`, `\`), polarisers 4 (45° steps), others 1. */
export const orientationCount = (kind: PieceKind): number => (kind === 'polariser' ? 4 : kind === 'mirror' || kind === 'splitter' ? 2 : 1);

/** The board element a placed piece becomes. */
export function pieceElement(kind: PieceKind, orient: number): Element {
  switch (kind) {
    case 'mirror':
    case 'splitter':
      return { kind, orient: orient === 1 ? 1 : 0 };
    case 'polariser':
      return { kind, angle: (orient & 3) as Angle };
    case 'neutral':
    case 'blocker':
      return { kind };
    case 'filterR':
    case 'filterG':
    case 'filterB':
      return { kind: 'filter', colour: colourFromLetter(kind.charAt(6)) };
    case 'minusR':
    case 'minusG':
    case 'minusB':
      return { kind: 'absorber', colour: colourFromLetter(kind.charAt(5)) };
  }
}

/** Widest supported board (7 squares of 44 px fit a 360 px phone). */
export const MAX_SIDE = 7;
/** Tallest supported board (taller boards scroll with the page, never sideways). */
export const MAX_HEIGHT = 9;
/** Most pieces of one kind in an inventory. */
export const MAX_PER_KIND = 9;
/** Portal pairs are numbered 1 to this. */
export const MAX_PORTAL_PAIRS = 3;

export interface Level {
  readonly width: number;
  readonly height: number;
  readonly cells: readonly Element[];
  readonly inventory: Readonly<Record<PieceKind, number>>;
}

export class LevelFormatError extends Error {
  override name = 'LevelFormatError';
}

const ARROWS: Readonly<Record<string, Dir>> = { '^': 0, '>': 1, v: 2, '<': 3 };
const POLARISER_TOKEN = /^P(0|45|90|135)$/;
const TARGET_TOKEN = /^T([RGBYMCW])(\d+)?(?::(\d+))?$/;

/**
 * Reads one level token:
 * `.` empty · `#` blocker · `/` `\` mirror · `S/` `S\` splitter · `X` forbidden sensor ·
 * `^R` `>G` `vB` `<W` laser (arrow + colour letter) · `FR` colour filter · `-R` chromatic blocker
 * (absorbs that colour) · `N` neutral-density filter · `P0` `P45` `P90` `P135` polariser ·
 * `TM` target (+ colour letter, optionally + required intensity denominator `TR4` = exactly ¼,
 * optionally + `:angle` for a required polarisation, `TR:45`, `TW2:90`) ·
 * `D^` `D>` `Dv` `D<` optical diode (+ arrow) · `@1` `@2` `@3` portal (+ pair number).
 */
export function parseToken(token: string): Element {
  switch (token) {
    case '.':
      return { kind: 'empty' };
    case '#':
      return { kind: 'blocker' };
    case 'X':
      return { kind: 'sensor' };
    case 'N':
      return { kind: 'neutral' };
    case '/':
    case '\\':
      return { kind: 'mirror', orient: token === '/' ? 0 : 1 };
    case 'S/':
    case 'S\\':
      return { kind: 'splitter', orient: token === 'S/' ? 0 : 1 };
  }
  const polariser = POLARISER_TOKEN.exec(token);
  if (polariser) return { kind: 'polariser', angle: (Number(polariser[1]) / 45) as Angle };
  const target = TARGET_TOKEN.exec(token);
  if (target) return parseTarget(token, target);
  const [head = '', letter = '', ...rest] = token;
  if (head === 'D' && rest.length === 0 && ARROWS[letter] !== undefined) return { kind: 'gate', dir: ARROWS[letter] };
  if (head === '@' && rest.length === 0 && /^[1-9]$/.test(letter)) {
    const pair = Number(letter);
    if (pair > MAX_PORTAL_PAIRS) throw new LevelFormatError(`portal pair ${pair} is out of range`);
    return { kind: 'portal', pair };
  }
  const colour = colourFromLetter(letter);
  if (rest.length > 0 || colour === 0) throw new LevelFormatError(`unknown token "${token}"`);
  const dir = ARROWS[head];
  if (dir !== undefined) return { kind: 'emitter', dir, colour };
  if (head === 'F' || head === '-') {
    if (colour === WHITE) throw new LevelFormatError(head === 'F' ? 'a white filter would let everything through' : 'a white chromatic blocker would be a blocker');
    return { kind: head === 'F' ? 'filter' : 'absorber', colour };
  }
  throw new LevelFormatError(`unknown token "${token}"`);
}

function parseTarget(token: string, [, letter = '', denominator, degrees]: RegExpExecArray): Element {
  const colour = colourFromLetter(letter);
  let level: number | undefined;
  if (denominator !== undefined) {
    level = Math.log2(Number(denominator));
    if (!isInt(level, 0, MAX_LEVEL)) throw new LevelFormatError(`target intensity in "${token}" must be 1, 1/2, 1/4 … 1/${2 ** MAX_LEVEL}`);
  }
  let pol: Angle | undefined;
  if (degrees !== undefined) {
    const angle = Number(degrees) / 45;
    if (!isOneOf(angle, ANGLES)) throw new LevelFormatError(`target polarisation in "${token}" must be 0, 45, 90 or 135`);
    pol = angle;
  }
  return { kind: 'target', colour, ...(level === undefined ? {} : { level }), ...(pol === undefined ? {} : { pol }) };
}

/**
 * Parses and validates a level: a rectangle of whitespace-separated tokens, at most 7 wide and 9
 * tall, with at least one laser, at least one target, portals only in complete pairs and a
 * non-empty inventory, not already solved without pieces.
 */
export function parseLevel(source: LevelSource): Level {
  const grid = source.rows.map((row) => row.trim().split(/\s+/));
  const height = grid.length;
  const width = grid[0]?.length ?? 0;
  if (height < 2 || width < 2 || height > MAX_HEIGHT || width > MAX_SIDE) throw new LevelFormatError('board must be between 2×2 and 7×9');
  if (grid.some((row) => row.length !== width)) throw new LevelFormatError('rows have different lengths');
  const cells = grid.flat().map(parseToken);
  if (!cells.some((cell) => cell.kind === 'emitter')) throw new LevelFormatError('level has no laser');
  if (!cells.some((cell) => cell.kind === 'target')) throw new LevelFormatError('level has no target');
  const portals = new Map<number, number>();
  for (const cell of cells) if (cell.kind === 'portal') portals.set(cell.pair, (portals.get(cell.pair) ?? 0) + 1);
  if ([...portals.values()].some((count) => count !== 2)) throw new LevelFormatError('portals must come in pairs');
  const counts = source.inventory as Readonly<Record<string, number | undefined>>;
  for (const kind of Object.keys(counts)) if (!isOneOf(kind, PIECE_KINDS)) throw new LevelFormatError(`unknown piece "${kind}"`);
  const inventory = Object.fromEntries(PIECE_KINDS.map((kind) => [kind, 0])) as Record<PieceKind, number>;
  for (const kind of PIECE_KINDS) {
    const count = counts[kind] ?? 0;
    if (!isInt(count, 0, MAX_PER_KIND)) throw new LevelFormatError(`bad ${kind} count`);
    inventory[kind] = count;
  }
  if (PIECE_KINDS.every((kind) => inventory[kind] === 0)) throw new LevelFormatError('inventory is empty');
  const level: Level = { width, height, cells, inventory };
  if (evaluate(level).solved) throw new LevelFormatError('level is solved without any piece');
  return level;
}

const levelCache = new Map<string, Level>();

export const levelCount = (set: LevelSet): number => LEVELS[set].length;

/** The parsed level `index` of a level set (cached). Throws for an index out of range. */
export function getLevel(set: LevelSet, index: number): Level {
  const source = LEVELS[set][index];
  if (!source) throw new RangeError(`No level ${index} in ${set}`);
  const key = `${set}/${index}`;
  let level = levelCache.get(key);
  if (!level) {
    level = parseLevel(source);
    levelCache.set(key, level);
  }
  return level;
}

/* ---------- Game state ---------- */

export interface Piece {
  cell: number;
  kind: PieceKind;
  /** 0–1 for mirrors and splitters (`/`, `\`), 0–3 for polarisers (× 45°), always 0 otherwise. */
  orient: number;
}

/** A previous position, restored by Undo. */
export interface Snapshot {
  /** Sorted by cell. */
  pieces: Piece[];
  moves: number;
}

export interface LaserState {
  seed: number;
  /** Level set (a difficulty, or `intro` for the original first levels of old saves). */
  difficulty: LevelSet;
  /** Index of the level within its set. */
  level: number;
  /** Placed pieces, sorted by cell. */
  pieces: Piece[];
  /** Placements, turns and removals since the level (or the last "clear board") started. */
  moves: number;
  /** Earlier positions, oldest first. */
  undo: Snapshot[];
}

/** Undo depth kept in a save (older steps are dropped). */
export const MAX_UNDO = 300;
export const MAX_MOVES = 1_000_000;

export function createInitialState(seed: number, difficulty: LevelSet = DEFAULT_DIFFICULTY): LaserState {
  const normalized = normalizeSeed(seed);
  return { seed: normalized, difficulty, level: normalized % levelCount(difficulty), pieces: [], moves: 0, undo: [] };
}

/** The seeded starting state again (the seed's level, empty board). */
export const resetState = (state: LaserState): LaserState => createInitialState(state.seed, state.difficulty);

export const levelOf = (state: LaserState): Level => getLevel(state.difficulty, state.level);

/** The level with the placed pieces put on it. */
export function boardWith(level: Level, pieces: readonly Piece[]): Board {
  const cells = [...level.cells];
  for (const piece of pieces) cells[piece.cell] = pieceElement(piece.kind, piece.orient);
  return { width: level.width, height: level.height, cells };
}

export const boardOf = (state: LaserState): Board => boardWith(levelOf(state), state.pieces);

export const evaluateState = (state: LaserState): Evaluation => evaluate(boardOf(state));

export const isSolved = (state: LaserState): boolean => evaluateState(state).solved;

export const pieceAt = (state: LaserState, cell: number): Piece | undefined => state.pieces.find((piece) => piece.cell === cell);

/** Pieces of `kind` still in the inventory. */
export const remaining = (state: LaserState, kind: PieceKind): number =>
  levelOf(state).inventory[kind] - state.pieces.filter((piece) => piece.kind === kind).length;

/** Records the current position for Undo and applies `pieces`/`moves`. */
function commit(state: LaserState, pieces: Piece[], moves: number): LaserState {
  const undo = [...state.undo, { pieces: state.pieces, moves: state.moves }].slice(-MAX_UNDO);
  return { ...state, pieces: [...pieces].sort((a, b) => a.cell - b.cell), moves: Math.min(moves, MAX_MOVES), undo };
}

/** True when a piece of `kind` can be placed on `cell` right now. */
export function canPlace(state: LaserState, cell: number, kind: PieceKind): boolean {
  const level = levelOf(state);
  return (
    level.cells[cell]?.kind === 'empty' &&
    !pieceAt(state, cell) &&
    remaining(state, kind) > 0 &&
    !isSolved(state)
  );
}

/** Places a piece of `kind` (turned `/`, or a polariser at 0°) on an empty square. Same object when not possible. */
export function placePiece(state: LaserState, cell: number, kind: PieceKind): LaserState {
  if (!canPlace(state, cell, kind)) return state;
  return commit(state, [...state.pieces, { cell, kind, orient: 0 }], state.moves + 1);
}

/** True when the placed piece on `cell` has a direction to turn (mirror, splitter, polariser). */
export const canRotate = (state: LaserState, cell: number): boolean => {
  const piece = pieceAt(state, cell);
  return !!piece && orientationCount(piece.kind) > 1 && !isSolved(state);
};

/** Turns the placed piece on `cell`: mirrors and splitters `/` ↔ `\`, polarisers by 45°. Same object when not possible. */
export function rotatePiece(state: LaserState, cell: number): LaserState {
  const piece = pieceAt(state, cell);
  if (!piece || !canRotate(state, cell)) return state;
  const turned: Piece = { ...piece, orient: (piece.orient + 1) % orientationCount(piece.kind) };
  return commit(state, state.pieces.map((p) => (p === piece ? turned : p)), state.moves + 1);
}

/** Takes the placed piece on `cell` back into the inventory. Same object when not possible. */
export function removePiece(state: LaserState, cell: number): LaserState {
  const piece = pieceAt(state, cell);
  if (!piece || isSolved(state)) return state;
  return commit(state, state.pieces.filter((p) => p !== piece), state.moves + 1);
}

export const canClear = (state: LaserState): boolean => state.pieces.length > 0 && !isSolved(state);

/** Takes every piece back and starts counting moves afresh; Undo brings the pieces back. */
export function clearBoard(state: LaserState): LaserState {
  return canClear(state) ? commit(state, [], 0) : state;
}

export const canUndo = (state: LaserState): boolean => state.undo.length > 0 && !isSolved(state);

export function undo(state: LaserState): LaserState {
  if (!canUndo(state)) return state;
  const previous = state.undo[state.undo.length - 1] as Snapshot;
  return { ...state, pieces: previous.pieces, moves: previous.moves, undo: state.undo.slice(0, -1) };
}

/** Switches to level `index` of the same set with an empty board. */
export function chooseLevel(state: LaserState, index: number): LaserState {
  if (!isInt(index, 0, levelCount(state.difficulty) - 1)) return state;
  if (index === state.level && state.pieces.length === 0 && state.undo.length === 0 && state.moves === 0) return state;
  return { ...state, level: index, pieces: [], moves: 0, undo: [] };
}

/* ---------- Validation and migration ---------- */

function isPieceList(value: unknown, level: Level): value is Piece[] {
  if (!Array.isArray(value)) return false;
  const used = new Map<PieceKind, number>();
  let previous = -1;
  for (const item of value as unknown[]) {
    if (!isRecord(item) || Object.keys(item).length !== 3) return false;
    const { cell, kind, orient } = item;
    if (!isInt(cell, previous + 1, level.cells.length - 1) || level.cells[cell]!.kind !== 'empty') return false;
    if (!isOneOf(kind, PIECE_KINDS) || !isInt(orient, 0, orientationCount(kind) - 1)) return false;
    used.set(kind, (used.get(kind) ?? 0) + 1);
    previous = cell;
  }
  return [...used].every(([kind, count]) => count <= level.inventory[kind]);
}

/** Structural and cross-field validation of untrusted saved data. Never throws. */
export function isLaserState(value: unknown): value is LaserState {
  try {
    if (!isRecord(value)) return false;
    const { seed, difficulty, level, pieces, moves, undo: history } = value;
    if (!isUint32(seed) || !isOneOf(difficulty, LEVEL_SETS)) return false;
    if (!isInt(level, 0, levelCount(difficulty) - 1)) return false;
    const parsed = getLevel(difficulty, level);
    if (!isPieceList(pieces, parsed) || !isInt(moves, 0, MAX_MOVES)) return false;
    if (!Array.isArray(history) || history.length > MAX_UNDO) return false;
    return history.every(
      (snapshot: unknown) => isRecord(snapshot) && isPieceList(snapshot.pieces, parsed) && isInt(snapshot.moves, 0, MAX_MOVES)
    );
  } catch {
    return false;
  }
}

/**
 * Upgrades a save of an older state version. Version 1 named the level sets one step easier (see
 * `LEGACY_LEVEL_SETS`); its levels and pieces are unchanged. Returns undefined when it cannot.
 */
export function migrateLaserState(value: unknown, fromVersion: number): LaserState | undefined {
  try {
    if (fromVersion !== 1 || !isRecord(value) || typeof value.difficulty !== 'string') return undefined;
    const set = Object.hasOwn(LEGACY_LEVEL_SETS, value.difficulty) ? LEGACY_LEVEL_SETS[value.difficulty] : undefined;
    if (!set) return undefined;
    const migrated: unknown = { ...value, difficulty: set };
    return isLaserState(migrated) ? migrated : undefined;
  } catch {
    return undefined;
  }
}
