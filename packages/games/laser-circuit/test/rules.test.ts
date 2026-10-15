import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { metadata } from '../src/metadata';
import { LEVELS, type LevelSource } from '../src/levels';
import {
  ANGLES,
  BLUE,
  COLOUR_LETTERS,
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  DIRS,
  GREEN,
  LEGACY_LEVEL_SETS,
  LEVEL_SETS,
  LevelFormatError,
  MAX_HEIGHT,
  MAX_LEVEL,
  MAX_MOVES,
  MAX_PER_KIND,
  MAX_UNDO,
  PIECE_KINDS,
  PRIMARIES,
  RED,
  UNPOLARISED,
  WHITE,
  angleDegrees,
  boardOf,
  boardWith,
  brightness,
  canClear,
  canPlace,
  canRotate,
  canUndo,
  chooseLevel,
  clearBoard,
  colourFromLetter,
  colourLetter,
  componentIntensity,
  createInitialState,
  evaluate,
  evaluateState,
  exits,
  getLevel,
  intensityOf,
  isColour,
  isLaserState,
  isSelectable,
  isSolved,
  laserLight,
  levelCount,
  levelOf,
  linear,
  migrateLaserState,
  neighbour,
  opposite,
  orientationCount,
  parseLevel,
  parseToken,
  pieceAt,
  pieceElement,
  placePiece,
  polarisationAngle,
  polarisations,
  polariserTransmission,
  reflect,
  remaining,
  removePiece,
  resetState,
  rotatePiece,
  toDifficulty,
  traceBeams,
  undo,
  type Board,
  type Dir,
  type Element,
  type LaserState,
  type LevelSet,
  type Light,
  type Orientation,
  type Piece,
  type PieceKind,
  type Polarisation
} from '../src/rules';
import { interpretSave } from '@wp/persistence';
import game from '../src/index';
import legacyTraces from './fixtures/legacy-traces.json';
import { letterOf, oracleLight, oracleSolved, oracleTrace, parseSolution, readGrid, solveByDecision, solveByLight, solveExhaustively, type DecisionSearch } from './oracle';
import { ALL, HARD_MAX_NODES, applySolution, pieceCount, stateOf, usesOptics } from './helpers';

/* ---------- Helpers ---------- */

const boardFrom = (rows: readonly string[]): Board => {
  const grid = rows.map((row) => row.trim().split(/\s+/));
  return { width: grid[0]!.length, height: grid.length, cells: grid.flat().map(parseToken) };
};
const litLetters = (board: Board) => traceBeams(board).lit.map(colourLetter);
const at = (board: Board, row: number, col: number) => row * board.width + col;

/** Number of expert levels. */
const EXPERT_LEVELS = LEVELS.expert.length;

/** Rotates a board 90° clockwise (directions turn with it, mirrors flip between / and \). */
function rotateBoard(board: Board): Board {
  const { width, height } = board;
  const cells: Element[] = new Array<Element>(width * height);
  board.cells.forEach((element, cell) => {
    const r = Math.floor(cell / width);
    const c = cell % width;
    const target = c * height + (height - 1 - r);
    let turned: Element = element;
    if (element.kind === 'emitter' || element.kind === 'gate') turned = { ...element, dir: ((element.dir + 1) % 4) as Dir };
    if (element.kind === 'mirror' || element.kind === 'splitter') turned = { ...element, orient: element.orient === 0 ? 1 : 0 };
    cells[target] = turned;
  });
  return { width: height, height: width, cells };
}

const TOKENS = ['.', '#', 'X', '/', '\\', 'S/', 'S\\', '^R', '>G', 'vB', '<W', '>Y', '^M', 'vC', 'FR', 'FG', 'FB', 'FY', 'FM', 'FC', 'TR', 'TG', 'TB', 'TY', 'TM', 'TC', 'TW', 'D^', 'D>', 'Dv', 'D<', '@1', '@2'];
/** Optical elements and targets that ask for an intensity or a polarisation. */
const OPTICS_TOKENS = ['P0', 'P45', 'P90', 'P135', 'N', '-R', '-G', '-B', '-Y', 'TR2', 'TW4', 'TG1', 'TR:45', 'TC2:90', 'TW8:0', 'TB:135'];
const tokenArb = fc.oneof(
  { weight: 6, arbitrary: fc.constant('.') },
  { weight: 1, arbitrary: fc.constantFrom('D^', 'D>', 'Dv', 'D<', '@1', '@1', '@2') },
  { weight: 2, arbitrary: fc.constantFrom(...OPTICS_TOKENS) },
  { weight: 3, arbitrary: fc.constantFrom('/', '\\', 'S/', 'S\\') },
  { weight: 2, arbitrary: fc.constantFrom(...TOKENS) }
);
const rowsArb = fc
  .tuple(fc.integer({ min: 1, max: 7 }), fc.integer({ min: 1, max: 7 }))
  .chain(([w, h]) => fc.array(fc.array(tokenArb, { minLength: w, maxLength: w }), { minLength: h, maxLength: h }))
  .map((grid) => grid.map((row) => row.join(' ')));

/* ---------- Colours ---------- */

describe('colours', () => {
  it('maps every mask to its letter and back', () => {
    expect(COLOUR_LETTERS).toEqual(['', 'R', 'G', 'Y', 'B', 'M', 'C', 'W']);
    expect([RED, GREEN, BLUE, WHITE]).toEqual([1, 2, 4, 7]);
    expect(PRIMARIES).toEqual([1, 2, 4]);
    for (let mask = 0; mask <= 7; mask++) expect(colourFromLetter(colourLetter(mask))).toBe(mask);
    expect(colourLetter(RED | BLUE)).toBe('M');
    expect(colourLetter(RED | GREEN)).toBe('Y');
    expect(colourLetter(GREEN | BLUE)).toBe('C');
    expect(colourLetter(8)).toBe('');
    expect(colourLetter(-1)).toBe('');
    expect(colourFromLetter('Q')).toBe(0);
    expect(colourFromLetter('')).toBe(0);
    expect(colourFromLetter('r')).toBe(0);
  });

  it('accepts only the seven non-empty colour masks', () => {
    expect([0, 1, 7, 8, 1.5, '1', null].map(isColour)).toEqual([false, true, true, false, false, false, false]);
  });
});

/* ---------- Geometry ---------- */

describe('directions and mirrors', () => {
  it('has opposite directions', () => {
    expect(DIRS.map(opposite)).toEqual([2, 3, 0, 1]);
  });

  it('finds neighbours without wrapping around the edges', () => {
    // 3 wide, 2 high: cells 0 1 2 / 3 4 5
    expect(DIRS.map((d) => neighbour(3, 2, 4, d))).toEqual([1, 5, -1, 3]);
    expect(DIRS.map((d) => neighbour(3, 2, 0, d))).toEqual([-1, 1, 3, -1]);
    expect(DIRS.map((d) => neighbour(3, 2, 2, d))).toEqual([-1, -1, 5, 1]);
    expect(DIRS.map((d) => neighbour(3, 2, 3, d))).toEqual([0, 4, -1, -1]);
  });

  it('reflects like real mirrors: / swaps up↔right and down↔left, \\ swaps up↔left and down↔right', () => {
    expect(DIRS.map((d) => reflect(d, 0))).toEqual([1, 0, 3, 2]);
    expect(DIRS.map((d) => reflect(d, 1))).toEqual([3, 2, 1, 0]);
  });

  it('reflection is an involution that always turns by 90° (property)', () => {
    fc.assert(
      fc.property(fc.constantFrom(...DIRS), fc.constantFrom<Orientation>(0, 1), (dir, orient) => {
        const out = reflect(dir, orient);
        expect(reflect(out, orient)).toBe(dir);
        expect(out % 2).not.toBe(dir % 2);
        // The two orientations send a beam to opposite sides.
        expect(reflect(dir, orient === 0 ? 1 : 0)).toBe(opposite(out));
      })
    );
  });

  it('lists where light leaves each element', () => {
    const light = (colour: number): Light => laserLight(colour);
    const half = (colour: number): Light => ({ ...laserLight(colour), level: 1 });
    expect(exits({ kind: 'empty' }, 1, light(5))).toEqual([{ dir: 1, light: light(5) }]);
    expect(exits({ kind: 'mirror', orient: 0 }, 1, light(2))).toEqual([{ dir: 0, light: light(2) }]);
    expect(exits({ kind: 'mirror', orient: 1 }, 1, light(2))).toEqual([{ dir: 2, light: light(2) }]);
    expect(exits({ kind: 'splitter', orient: 1 }, 0, light(7))).toEqual([{ dir: 0, light: half(7) }, { dir: 3, light: half(7) }]);
    expect(exits({ kind: 'filter', colour: RED | BLUE }, 2, light(WHITE))).toEqual([{ dir: 2, light: light(RED | BLUE) }]);
    expect(exits({ kind: 'filter', colour: RED }, 2, light(GREEN))).toEqual([]);
    expect(exits({ kind: 'gate', dir: 1 }, 1, light(6))).toEqual([{ dir: 1, light: light(6) }]);
    for (const dir of [0, 2, 3] as Dir[]) expect(exits({ kind: 'gate', dir: 1 }, dir, light(6))).toEqual([]);
    for (const element of [{ kind: 'blocker' }, { kind: 'sensor' }, { kind: 'target', colour: 1 }, { kind: 'emitter', dir: 0, colour: 1 }, { kind: 'portal', pair: 1 }] as Element[]) {
      expect(exits(element, 1, light(WHITE))).toEqual([]);
    }
  });
});

/* ---------- Optics: polarisation and intensity ---------- */

describe('optics model', () => {
  const lightOf = (colour: number, pol: Polarisation = UNPOLARISED, level = 0): Light => ({ colour, pol, level });

  it('follows Malus’s law exactly for 45° steps: unpolarised ½, cos²(θ − φ) for polarised light', () => {
    for (const angle of ANGLES) {
      expect(polariserTransmission(UNPOLARISED, angle)).toBe(0.5);
      for (const from of ANGLES) {
        const expected = Math.cos(((angleDegrees(angle) - angleDegrees(from)) * Math.PI) / 180) ** 2;
        expect(polariserTransmission(linear(from), angle)).toBeCloseTo(expected, 12);
      }
    }
    expect(polariserTransmission(linear(0), 0)).toBe(1);
    expect(polariserTransmission(linear(0), 1)).toBe(0.5);
    expect(polariserTransmission(linear(0), 2)).toBe(0);
    expect(polariserTransmission(linear(3), 1)).toBe(0);
    expect(polarisationAngle(UNPOLARISED)).toBeUndefined();
    expect(ANGLES.map((angle) => polarisationAngle(linear(angle)))).toEqual([0, 1, 2, 3]);
  });

  it('turns unpolarised light into linear light at the polariser’s angle with half the intensity', () => {
    expect(exits({ kind: 'polariser', angle: 1 }, 1, lightOf(WHITE))).toEqual([{ dir: 1, light: lightOf(WHITE, linear(1), 1) }]);
    expect(exits({ kind: 'polariser', angle: 1 }, 2, lightOf(RED, linear(1), 2))).toEqual([{ dir: 2, light: lightOf(RED, linear(1), 2) }]);
    expect(exits({ kind: 'polariser', angle: 2 }, 0, lightOf(RED, linear(1), 2))).toEqual([{ dir: 0, light: lightOf(RED, linear(2), 3) }]);
    expect(exits({ kind: 'polariser', angle: 3 }, 0, lightOf(RED, linear(1)))).toEqual([]);
  });

  it('halves intensity at a neutral-density filter and at each splitter output, keeping colour and polarisation', () => {
    expect(exits({ kind: 'neutral' }, 3, lightOf(GREEN | BLUE, linear(2), 1))).toEqual([{ dir: 3, light: lightOf(GREEN | BLUE, linear(2), 2) }]);
    expect(exits({ kind: 'splitter', orient: 0 }, 1, lightOf(RED, linear(0)))).toEqual([
      { dir: 1, light: lightOf(RED, linear(0), 1) },
      { dir: 0, light: lightOf(RED, linear(0), 1) }
    ]);
    // Halving stops at the faintest level: such light still counts as light.
    expect(exits({ kind: 'neutral' }, 1, lightOf(RED, UNPOLARISED, MAX_LEVEL))).toEqual([{ dir: 1, light: lightOf(RED, UNPOLARISED, MAX_LEVEL) }]);
    expect(intensityOf(MAX_LEVEL)).toBe(1 / 64);
  });

  it('a chromatic blocker absorbs only its colour; a colour filter passes only its colour', () => {
    expect(exits({ kind: 'absorber', colour: RED }, 1, lightOf(WHITE, linear(3), 1))).toEqual([{ dir: 1, light: lightOf(GREEN | BLUE, linear(3), 1) }]);
    expect(exits({ kind: 'absorber', colour: RED }, 1, lightOf(RED))).toEqual([]);
    expect(exits({ kind: 'filter', colour: RED }, 1, lightOf(WHITE, linear(0), 2))).toEqual([{ dir: 1, light: lightOf(RED, linear(0), 2) }]);
    // A chromatic blocker for red is the same as a cyan filter.
    for (let colour = 1; colour <= WHITE; colour++) {
      expect(exits({ kind: 'absorber', colour: RED }, 0, lightOf(colour))).toEqual(exits({ kind: 'filter', colour: GREEN | BLUE }, 0, lightOf(colour)));
    }
  });

  it('crossed polarisers block; a third one at 45° between them lets ⅛ through (Malus twice)', () => {
    const crossed = boardFrom(['>W P0 P90 TW']);
    expect(traceBeams(crossed).lit).toEqual([0, WHITE, WHITE, 0]);
    const three = boardFrom(['>R P0 P45 P90 TR8:90']);
    const trace = traceBeams(three);
    expect(trace.lit[4]).toBe(RED);
    expect(trace.arrivals[4]).toEqual([{ dir: 1, colour: RED, pol: linear(2), level: 3 }]);
    expect(componentIntensity(trace.arrivals[4]!, RED)).toBe(1 / 8);
    expect(evaluate(three).solved).toBe(true);
    expect(evaluate(boardFrom(['>R P0 P45 P90 TR4:90'])).solved).toBe(false);
    expect(evaluate(boardFrom(['>R P0 P45 P90 TR8:0'])).solved).toBe(false);
  });

  it('a polariser and an ND filter commute: the order does not change the light', () => {
    const a = traceBeams(boardFrom(['>W N P45 TW'])).arrivals[3];
    const b = traceBeams(boardFrom(['>W P45 N TW'])).arrivals[3];
    expect(a).toEqual(b);
    expect(a).toEqual([{ dir: 1, colour: WHITE, pol: linear(1), level: 2 }]);
  });

  it('adds up the intensity of all beams reaching a target, per colour component', () => {
    // A splitter sends ½ straight on (and ½ off the board).
    expect(componentIntensity(traceBeams(boardFrom(['>R S\\ TR'])).arrivals[2]!, RED)).toBe(0.5);
    // Two lasers of different colours on one target: each component counts on its own.
    const mixed = boardFrom(['>R TM <B']);
    const both = traceBeams(mixed).arrivals[1]!;
    expect(componentIntensity(both, RED)).toBe(1);
    expect(componentIntensity(both, BLUE)).toBe(1);
    expect(componentIntensity(both, GREEN)).toBe(0);
    expect(brightness(both)).toBe(1);
    expect(evaluate(boardFrom(['>R TM1 <B'])).solved).toBe(true);
    expect(evaluate(boardFrom(['>R TM1 N <B'])).solved).toBe(false);
    // Two halves from both sides add up to a whole.
    expect(evaluate(boardFrom(['>R N TR1 N <R'])).solved).toBe(true);
    expect(evaluate(boardFrom(['>R N TR2 N <R'])).solved).toBe(false);
    expect(evaluate(boardFrom(['>R N TR . <R'])).targets[0]).toMatchObject({ intensity: 1.5, ok: true });
  });

  it('checks a target’s intensity and polarisation only when it asks for them', () => {
    expect(evaluate(boardFrom(['>R N TR'])).solved).toBe(true);
    expect(evaluate(boardFrom(['>R N TR2'])).solved).toBe(true);
    expect(evaluate(boardFrom(['>R N TR4'])).solved).toBe(false);
    expect(evaluate(boardFrom(['>R P45 TR'])).solved).toBe(true);
    expect(evaluate(boardFrom(['>R P45 TR2:45'])).solved).toBe(true);
    expect(evaluate(boardFrom(['>R P45 TR:90'])).solved).toBe(false);
    expect(evaluate(boardFrom(['>R . TR:0'])).solved).toBe(false); // unpolarised light is not polarised at 0°
    const status = evaluate(boardFrom(['>R P45 TR4:45'])).targets[0]!;
    expect(status).toMatchObject({ need: RED, needLevel: 2, needPol: 1, got: RED, intensity: 0.5, pols: [linear(1)], ok: false });
    expect(polarisations([{ dir: 1, colour: RED, pol: 3, level: 0 }, { dir: 0, colour: RED, pol: 0, level: 1 }, { dir: 2, colour: RED, pol: 3, level: 2 }])).toEqual([0, 3]);
  });

  it('agrees with the oracle’s Malus computation on random chains of polarisers and filters (property)', () => {
    const chain = fc.array(fc.constantFrom('.', 'P0', 'P45', 'P90', 'P135', 'N', '-R', '-G', 'FY', 'FC', 'S/'), { minLength: 1, maxLength: 5 });
    fc.assert(
      fc.property(fc.constantFrom('R', 'G', 'B', 'W', 'Y'), chain, (colour, tokens) => {
        const rows = [`>${colour} ${tokens.join(' ')} TW`];
        const grid = readGrid(rows);
        const end = tokens.length + 1;
        const trace = traceBeams(boardFrom(rows));
        const cell = oracleLight(grid)[0]![end]!;
        expect(colourLetter(trace.lit[end] ?? 0)).toBe(letterOf(cell.primaries));
        for (const primary of PRIMARIES) {
          const name = (['red', 'green', 'blue'] as const)[PRIMARIES.indexOf(primary)]!;
          const oracleSum = [...(cell.photons.get(name) ?? [])].reduce((sum, state) => sum + Number(state.split('|')[2]), 0);
          expect(componentIntensity(trace.arrivals[end] ?? [], primary)).toBe(oracleSum);
        }
      }),
      { numRuns: 300 }
    );
  });
});

/* ---------- Old levels are unchanged ---------- */

describe('the levels from before the optics trace exactly as before', () => {
  /** Light of every level before the optics, traced on the empty board and on every solution (pinned before the change). */
  const fixture = legacyTraces as Record<string, { rows: string[]; boards: { pieces: string; lit: string; sides: string }[] }>;

  it('pins every original, medium and hard level', () => {
    expect(Object.keys(fixture)).toHaveLength(ALL.filter((l) => l.set !== 'expert').length);
  });

  for (const [key, entry] of Object.entries(fixture)) {
    it(key, () => {
      const found = ALL.find((l) => l.source.rows.join('|') === entry.rows.join('|'));
      expect(found, 'level still exists with the same rows').toBeDefined();
      const level = getLevel(found!.set, found!.index);
      // Old set ids: easy → intro, medium → easy, hard → medium, expert → hard.
      expect(found!.set).toBe(LEGACY_LEVEL_SETS[key.split('/')[0]!]);
      expect(found!.index).toBe(Number(key.split('/')[1]));
      for (const { pieces, lit, sides } of entry.boards) {
        const cells = [...level.cells];
        if (pieces) for (const p of parseSolution(pieces)) cells[p.row * level.width + p.col] = parseToken(p.token);
        const trace = traceBeams({ width: level.width, height: level.height, cells });
        expect(trace.lit.join('')).toBe(lit);
        expect(trace.sides.join('')).toBe(sides);
      }
    });
  }
});

/* ---------- Migration of old saves ---------- */

describe('migrating state version 1', () => {
  const v1 = (difficulty: string, level: number, pieces: Piece[] = []) => ({ seed: 7, difficulty, level, pieces, moves: pieces.length, undo: [] });

  it('moves every old set to its new name, keeping level, pieces and undo', () => {
    const oldEasy = v1('easy', 7, [{ cell: 0, kind: 'mirror', orient: 1 }]);
    expect(migrateLaserState(oldEasy, 1)).toEqual({ ...oldEasy, difficulty: 'intro' });
    expect(migrateLaserState(v1('medium', 5, [{ cell: 1, kind: 'blocker', orient: 0 }]), 1)).toMatchObject({ difficulty: 'easy', level: 5 });
    expect(migrateLaserState(v1('hard', 11), 1)).toMatchObject({ difficulty: 'medium', level: 11 });
    expect(migrateLaserState(v1('expert', 7), 1)).toMatchObject({ difficulty: 'hard', level: 7 });
    for (const [old, set] of Object.entries(LEGACY_LEVEL_SETS)) {
      const migrated = migrateLaserState(v1(old, 0), 1);
      expect(migrated?.difficulty).toBe(set);
      expect(isLaserState(migrated)).toBe(true);
      // The board the player sees is the same one as before.
      expect(levelOf(migrated!).cells).toEqual(parseLevel(LEVELS[set][0]!).cells);
    }
  });

  it('refuses what it cannot migrate', () => {
    expect(migrateLaserState(v1('easy', 0), 2)).toBeUndefined();
    expect(migrateLaserState(v1('intro', 0), 1)).toBeUndefined();
    expect(migrateLaserState(v1('extreme', 0), 1)).toBeUndefined();
    expect(migrateLaserState(v1('toString', 0), 1)).toBeUndefined();
    expect(migrateLaserState(v1('easy', 8), 1)).toBeUndefined();
    expect(migrateLaserState(v1('expert', 8), 1)).toBeUndefined();
    expect(migrateLaserState({ ...v1('easy', 0), difficulty: 3 }, 1)).toBeUndefined();
    expect(migrateLaserState(null, 1)).toBeUndefined();
    expect(migrateLaserState('state', 1)).toBeUndefined();
    const throwing = { get difficulty(): string { throw new Error('boom'); } };
    expect(migrateLaserState(throwing, 1)).toBeUndefined();
  });

  it('restores an old save of an introductory level through the shared save loader', () => {
    const save = { schemaVersion: 1, gameId: 'laser-circuit', stateVersion: 1, updatedAt: '2026-01-01T00:00:00.000Z', seed: 7, difficulty: 'easy', state: v1('easy', 7, [{ cell: 0, kind: 'mirror', orient: 0 }]) };
    const loaded = interpretSave(save, game);
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(loaded.migrated).toBe(true);
    expect(loaded.save.state).toMatchObject({ difficulty: 'intro', level: 7, pieces: [{ cell: 0, kind: 'mirror', orient: 0 }] });
    // An old "expert" save becomes a hard one.
    const expert = interpretSave({ ...save, difficulty: 'expert', state: v1('expert', 3) }, game);
    expect(expert.status === 'ok' && expert.save.state.difficulty).toBe('hard');
    // A current save is not migrated.
    const current = interpretSave({ ...save, stateVersion: 2, state: createInitialState(3, 'expert') }, game);
    expect(current.status === 'ok' && current.migrated).toBe(false);
  });
});

/* ---------- Beam tracing ---------- */

describe('traceBeams', () => {
  it('sends a laser in a straight line to the edge of the board', () => {
    const board = boardFrom(['>R . .', '. . .']);
    const trace = traceBeams(board);
    expect(trace.lit).toEqual([0, 1, 1, 0, 0, 0]);
    // Sides crossed: emitter right side, middle left+right, last left+right (leaves the board).
    expect(trace.sides.slice(0, 12)).toEqual([0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1]);
    expect(trace.sides.slice(12)).toEqual(new Array(12).fill(0));
    expect([trace.width, trace.height]).toEqual([3, 2]);
  });

  it('turns at mirrors and passes and turns at splitters', () => {
    const mirrored = boardFrom(['. . .', '>G / .', '. . .']);
    expect(litLetters(mirrored)).toEqual(['', 'G', '', '', 'G', '', '', '', '']);
    const down = boardFrom(['. . .', '>G \\ .', '. . .']);
    expect(litLetters(down)).toEqual(['', '', '', '', 'G', '', '', 'G', '']);
    const split = boardFrom(['. . .', '>B S/ .', '. . .']);
    expect(litLetters(split)).toEqual(['', 'B', '', '', 'B', 'B', '', '', '']);
  });

  it('is stopped by blockers, sensors, targets and other lasers, which still receive the light', () => {
    for (const stop of ['#', 'X', 'TR', '^G']) {
      const board = boardFrom([`>R ${stop} .`]);
      expect(traceBeams(board).lit).toEqual([0, 1, 0]);
    }
    // Two lasers facing each other light each other.
    expect(traceBeams(boardFrom(['>R <G'])).lit).toEqual([GREEN, RED]);
  });

  it('lets a filter pass only the colours it contains', () => {
    for (let colour = 1; colour <= 7; colour++) {
      for (let filter = 1; filter <= 6; filter++) {
        const board = boardFrom([`>${colourLetter(colour)} F${colourLetter(filter)} .`]);
        expect(traceBeams(board).lit).toEqual([0, colour, colour & filter]);
      }
    }
  });

  it('mixes light arriving at a target additively (complete colour table)', () => {
    for (let a = 1; a <= 7; a++) {
      for (let b = 1; b <= 7; b++) {
        const board = boardFrom([`>${colourLetter(a)} . TW . <${colourLetter(b)}`]);
        expect(traceBeams(board).lit[2]).toBe(a | b);
      }
    }
  });

  it('terminates on beams caught in a mirror loop', () => {
    // The splitter feeds a closed square of mirrors; light circles forever in the physical world.
    const board = boardFrom(['. / . \\', '>R S\\ . .', '. \\ . /']);
    const trace = traceBeams(board);
    expect(trace.lit[at(board, 0, 1)]).toBe(RED);
    expect(trace.lit[at(board, 2, 3)]).toBe(RED);
    expect(trace.lit.every((mask) => mask >= 0 && mask <= 7)).toBe(true);
  });

  it('lets light through a one-way gate only in the direction of its arrow', () => {
    // Along the arrow: passes on unchanged.
    expect(litLetters(boardFrom(['>W D> . .']))).toEqual(['', 'W', 'W', 'W']);
    // Against the arrow: the gate receives the light and absorbs it.
    const against = boardFrom(['. . D> <R']);
    expect(litLetters(against)).toEqual(['', '', 'R', '']);
    const trace = traceBeams(against);
    expect(trace.sides[2 * 4 + 1]).toBe(RED);
    expect(trace.sides[2 * 4 + 3]).toBe(0);
    // From the side: absorbed as well.
    expect(litLetters(boardFrom(['vG . .', 'D> . .', '. . .']))).toEqual(['', '', '', 'G', '', '', '', '', '']);
    // A splitter below a gate: only the branch that matches the gate gets through.
    expect(litLetters(boardFrom(['. . .', '. D^ .', '>B S/ .']))).toEqual(['', 'B', '', '', 'B', '', '', 'B', 'B']);
    expect(litLetters(boardFrom(['. . .', '. Dv .', '>B S/ .']))).toEqual(['', '', '', '', 'B', '', '', 'B', 'B']);
  });

  it('sends light that enters a portal out of its twin in the same direction', () => {
    const board = boardFrom(['>R . @1 . .', '. . . . .', '. @1 . . TR']);
    const trace = traceBeams(board);
    // Both portals receive the light; it leaves the twin travelling right.
    expect(litLetters(board)).toEqual(['', 'R', 'R', '', '', '', '', '', '', '', '', 'R', 'R', 'R', 'R']);
    expect(trace.sides[at(board, 0, 2) * 4 + 3]).toBe(RED);
    expect(trace.sides[at(board, 0, 2) * 4 + 1]).toBe(0);
    expect(trace.sides[at(board, 2, 1) * 4 + 1]).toBe(RED);
    expect(trace.sides[at(board, 2, 1) * 4 + 3]).toBe(0);
    expect(evaluate(board).solved).toBe(true);
    // Pairs are kept apart by their number; a portal without a twin absorbs.
    expect(litLetters(boardFrom(['>G @1 . @2 .']))).toEqual(['', 'G', '', '', '']);
    expect(litLetters(boardFrom(['>G @2 . . @1 . @2 .']))).toEqual(['', 'G', '', '', '', '', 'G', 'G']);
    // A third portal with the same number has no twin.
    expect(litLetters(boardFrom(['>G . @1 @1 @1', '. . . . .']))).toEqual(['', 'G', 'G', 'G', 'G', '', '', '', '', '']);
  });

  it('terminates on light circling through portals and splitters', () => {
    const rows = ['>W S\\ . .', '. . . .', '. @1 . .', '. . . .', '. @1 . .'];
    const board = boardFrom(rows);
    const trace = traceBeams(board);
    // The splitter sends light down into portal 1 at (2,1); it reappears at (4,1) and leaves the board.
    expect(trace.lit[at(board, 4, 1)]).toBe(WHITE);
    // Light jumps: the squares between the two portals stay dark.
    expect(trace.lit[at(board, 3, 1)]).toBe(0);
    expect(litLetters(board)).toEqual(oracleTrace(readGrid(rows)).flat().map(letterOf));
    // A real loop: the twin sends the beam back into the first portal, forever.
    const loop = boardFrom(['>R \\ . .', '. @1 . .', '. . . .', '. . . .']);
    expect(traceBeams(loop).lit[at(loop, 1, 1)]).toBe(RED);
    const pingPong = boardFrom(['. . . .', '>B @1 . @1', '. . . .']);
    expect(litLetters(pingPong)).toEqual(['', '', '', '', '', 'B', '', 'B', '', '', '', '']);
  });

  it('only lasers create light (filters and targets carry a colour but emit nothing)', () => {
    expect(traceBeams(boardFrom(['FR TG', 'FB TW'])).lit).toEqual([0, 0, 0, 0]);
  });

  it('ignores a dark laser and is deterministic', () => {
    const dark: Board = { width: 2, height: 1, cells: [{ kind: 'emitter', dir: 1, colour: 0 }, { kind: 'empty' }] };
    expect(traceBeams(dark).lit).toEqual([0, 0]);
    const board = boardFrom(['vR . vB', '. . .', '>G . TW']);
    expect(traceBeams(board)).toEqual(traceBeams(board));
    expect(litLetters(board)).toEqual(['', '', '', 'R', '', 'B', 'R', 'G', 'C']);
  });

  it('agrees with the independent photon-walk oracle on random boards (property)', () => {
    fc.assert(
      fc.property(rowsArb, (rows) => {
        const board = boardFrom(rows);
        const oracle = oracleTrace(readGrid(rows)).flat().map(letterOf);
        expect(litLetters(board)).toEqual(oracle);
        expect(evaluate(board).solved).toBe(oracleSolved(readGrid(rows)));
      }),
      { numRuns: 400 }
    );
  });

  it('always terminates with masks in range and consistent sides (property)', () => {
    fc.assert(
      fc.property(rowsArb, (rows) => {
        const board = boardFrom(rows);
        const trace = traceBeams(board);
        expect(trace.lit).toHaveLength(board.cells.length);
        expect(trace.sides).toHaveLength(board.cells.length * 4);
        expect(trace.sides.every((mask) => mask >= 0 && mask <= 7)).toBe(true);
        // A side shared by two squares carries the same light on both of them.
        board.cells.forEach((_, cell) => {
          for (const dir of DIRS) {
            const next = neighbour(board.width, board.height, cell, dir);
            if (next >= 0) expect(trace.sides[cell * 4 + dir]).toBe(trace.sides[next * 4 + opposite(dir)]);
          }
        });
        // Light entering a square crossed one of its sides.
        trace.lit.forEach((mask, cell) => {
          const crossed = DIRS.reduce<number>((acc, dir) => acc | (trace.sides[cell * 4 + dir] ?? 0), 0);
          expect(mask & ~crossed).toBe(0);
        });
      }),
      { numRuns: 300 }
    );
  });

  it('a gate passes a beam in its direction unchanged and absorbs it from every other side (property)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 5 }), fc.integer({ min: 1, max: 5 }), fc.constantFrom(...DIRS), fc.constantFrom(...DIRS), fc.integer({ min: 1, max: 7 }), (row, col, dir, gateDir, colour) => {
        const cells: Element[] = new Array<Element>(49).fill({ kind: 'empty' });
        const gate = row * 7 + col;
        cells[neighbour(7, 7, gate, opposite(dir))] = { kind: 'emitter', dir, colour };
        cells[gate] = { kind: 'gate', dir: gateDir };
        const trace = traceBeams({ width: 7, height: 7, cells });
        expect(trace.lit[gate]).toBe(colour);
        expect(trace.lit[neighbour(7, 7, gate, dir)]).toBe(dir === gateDir ? colour : 0);
        for (const side of DIRS) expect(trace.sides[gate * 4 + side]).toBe(side === opposite(dir) || (side === dir && dir === gateDir) ? colour : 0);
      })
    );
  });

  it('a portal pair acts like a laser on the twin shining on in the same direction (property)', () => {
    const ray = (from: number, dir: Dir) => {
      const cells: number[] = [];
      for (let c = neighbour(7, 7, from, dir); c >= 0; c = neighbour(7, 7, c, dir)) cells.push(c);
      return cells;
    };
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 48 }), fc.integer({ min: 0, max: 48 }), fc.constantFrom(...DIRS), fc.integer({ min: 1, max: 7 }), (a, b, dir, colour) => {
        const laser = neighbour(7, 7, a, opposite(dir));
        fc.pre(a !== b && laser >= 0 && laser !== b && !ray(b, dir).includes(a) && !ray(b, dir).includes(laser));
        const cells: Element[] = new Array<Element>(49).fill({ kind: 'empty' });
        cells[laser] = { kind: 'emitter', dir, colour };
        cells[a] = { kind: 'portal', pair: 2 };
        cells[b] = { kind: 'portal', pair: 2 };
        const lit = traceBeams({ width: 7, height: 7, cells }).lit;
        const expected = new Array<number>(49).fill(0);
        for (const cell of [a, b, ...ray(b, dir)]) expected[cell] = colour;
        expect(lit).toEqual(expected);
      })
    );
  });

  it('is invariant under rotating the board by 90° (property)', () => {
    fc.assert(
      fc.property(rowsArb, (rows) => {
        // Portals pair in reading order, so a third portal of a number would change partner when turned.
        for (const portal of ['@1', '@2']) fc.pre(rows.join(' ').split(/\s+/).filter((t) => t === portal).length <= 2);
        const board = boardFrom(rows);
        const rotated = rotateBoard(board);
        const before = traceBeams(board).lit;
        const after = traceBeams(rotated).lit;
        before.forEach((mask, cell) => {
          const r = Math.floor(cell / board.width);
          const c = cell % board.width;
          expect(after[c * board.height + (board.height - 1 - r)]).toBe(mask);
        });
      }),
      { numRuns: 200 }
    );
  });

  it('reflects a single beam by the mirror law and leaves the straight path dark (property)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        fc.constantFrom(...DIRS),
        fc.constantFrom<Orientation>(0, 1),
        fc.integer({ min: 1, max: 7 }),
        (row, col, dir, orient, colour) => {
          // A 7×7 board; the mirror sits at (row, col), the laser one step before it.
          const cells: Element[] = new Array<Element>(49).fill({ kind: 'empty' });
          const mirror = row * 7 + col;
          const laser = neighbour(7, 7, mirror, opposite(dir));
          cells[laser] = { kind: 'emitter', dir, colour };
          cells[mirror] = { kind: 'mirror', orient };
          const trace = traceBeams({ width: 7, height: 7, cells });
          const out = reflect(dir, orient);
          expect(trace.sides[mirror * 4 + out]).toBe(colour);
          expect(trace.sides[mirror * 4 + dir]).toBe(0);
          const turned = neighbour(7, 7, mirror, out);
          const straight = neighbour(7, 7, mirror, dir);
          expect(trace.lit[turned]).toBe(colour);
          expect(trace.lit[straight]).toBe(0);
        }
      )
    );
  });

  it('a splitter sends the full beam both straight on and sideways (property)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 1, max: 5 }),
        fc.constantFrom(...DIRS),
        fc.constantFrom<Orientation>(0, 1),
        fc.integer({ min: 1, max: 7 }),
        (row, col, dir, orient, colour) => {
          const cells: Element[] = new Array<Element>(49).fill({ kind: 'empty' });
          const splitter = row * 7 + col;
          cells[neighbour(7, 7, splitter, opposite(dir))] = { kind: 'emitter', dir, colour };
          cells[splitter] = { kind: 'splitter', orient };
          const trace = traceBeams({ width: 7, height: 7, cells });
          const out = reflect(dir, orient);
          expect(trace.sides[splitter * 4 + dir]).toBe(colour);
          expect(trace.sides[splitter * 4 + out]).toBe(colour);
          expect(trace.sides[splitter * 4 + opposite(out)]).toBe(0);
          // Exactly two branches leave the splitter, each reaching the board edge.
          const branchCells = trace.lit.filter((mask, cell) => mask !== 0 && cell !== splitter).length;
          const length = (d: Dir) => {
            let n = 0;
            for (let c = neighbour(7, 7, splitter, d); c >= 0; c = neighbour(7, 7, c, d)) n++;
            return n;
          };
          expect(branchCells).toBe(length(dir) + length(out));
        }
      )
    );
  });
});

/* ---------- Evaluation ---------- */

describe('evaluate', () => {
  it('needs every target exactly right and every forbidden sensor dark', () => {
    const board = boardFrom(['>R TR', '>B TM']);
    const result = evaluate(board);
    expect(result.targets).toEqual([
      { cell: 1, need: RED, got: RED, intensity: 1, pols: [UNPOLARISED], ok: true },
      { cell: 3, need: RED | BLUE, got: BLUE, intensity: 1, pols: [UNPOLARISED], ok: false }
    ]);
    expect(result.correct).toBe(1);
    expect(result.solved).toBe(false);
    expect(evaluate(boardFrom(['>R TR', '>B TB'])).solved).toBe(true);
  });

  it('fails while a forbidden sensor receives light', () => {
    const lit = evaluate(boardFrom(['>R TR', '>B X']));
    expect(lit.litSensors).toEqual([3]);
    expect(lit.correct).toBe(1);
    expect(lit.solved).toBe(false);
    const dark = evaluate(boardFrom(['>R TR', '. X']));
    expect(dark.litSensors).toEqual([]);
    expect(dark.solved).toBe(true);
  });

  it('does not count too much light as correct, and needs at least one target', () => {
    expect(evaluate(boardFrom(['>R TY <G'])).solved).toBe(true);
    expect(evaluate(boardFrom(['>W TY .'])).solved).toBe(false);
    expect(evaluate(boardFrom(['>R . .'])).solved).toBe(false);
    expect(evaluate(boardFrom(['>R . X'])).solved).toBe(false);
  });
});

/* ---------- Level format ---------- */

describe('parseToken and parseLevel', () => {
  it('reads every token', () => {
    expect(parseToken('.')).toEqual({ kind: 'empty' });
    expect(parseToken('#')).toEqual({ kind: 'blocker' });
    expect(parseToken('X')).toEqual({ kind: 'sensor' });
    expect(parseToken('/')).toEqual({ kind: 'mirror', orient: 0 });
    expect(parseToken('\\')).toEqual({ kind: 'mirror', orient: 1 });
    expect(parseToken('S/')).toEqual({ kind: 'splitter', orient: 0 });
    expect(parseToken('S\\')).toEqual({ kind: 'splitter', orient: 1 });
    expect(parseToken('^R')).toEqual({ kind: 'emitter', dir: 0, colour: RED });
    expect(parseToken('>G')).toEqual({ kind: 'emitter', dir: 1, colour: GREEN });
    expect(parseToken('vB')).toEqual({ kind: 'emitter', dir: 2, colour: BLUE });
    expect(parseToken('<W')).toEqual({ kind: 'emitter', dir: 3, colour: WHITE });
    expect(parseToken('FC')).toEqual({ kind: 'filter', colour: GREEN | BLUE });
    expect(parseToken('TM')).toEqual({ kind: 'target', colour: RED | BLUE });
    expect(parseToken('D^')).toEqual({ kind: 'gate', dir: 0 });
    expect(parseToken('D>')).toEqual({ kind: 'gate', dir: 1 });
    expect(parseToken('Dv')).toEqual({ kind: 'gate', dir: 2 });
    expect(parseToken('D<')).toEqual({ kind: 'gate', dir: 3 });
    expect(parseToken('@1')).toEqual({ kind: 'portal', pair: 1 });
    expect(parseToken('@3')).toEqual({ kind: 'portal', pair: 3 });
  });

  it('reads the optics tokens', () => {
    expect(parseToken('N')).toEqual({ kind: 'neutral' });
    expect(ANGLES.map((angle) => parseToken(`P${angle * 45}`))).toEqual(ANGLES.map((angle) => ({ kind: 'polariser', angle })));
    expect(parseToken('-R')).toEqual({ kind: 'absorber', colour: RED });
    expect(parseToken('-C')).toEqual({ kind: 'absorber', colour: GREEN | BLUE });
    expect(parseToken('TR2')).toEqual({ kind: 'target', colour: RED, level: 1 });
    expect(parseToken('TW1')).toEqual({ kind: 'target', colour: WHITE, level: 0 });
    expect(parseToken('TG64')).toEqual({ kind: 'target', colour: GREEN, level: 6 });
    expect(parseToken('TM:135')).toEqual({ kind: 'target', colour: RED | BLUE, pol: 3 });
    expect(parseToken('TC4:0')).toEqual({ kind: 'target', colour: GREEN | BLUE, level: 2, pol: 0 });
    expect(() => parseToken('TR3')).toThrow(/intensity/);
    expect(() => parseToken('TR128')).toThrow(/intensity/);
    expect(() => parseToken('TR:30')).toThrow(/polarisation/);
    expect(() => parseToken('-W')).toThrow(/white chromatic blocker/);
    for (const bad of ['P', 'P30', 'P180', 'NN', 'N1', '-', '-Q', 'TR:', 'TR2:', 'TR:45:90', 'T:45']) expect(() => parseToken(bad), bad).toThrow(LevelFormatError);
  });

  it('rejects unknown tokens and a white filter', () => {
    for (const bad of ['', '?', 'S', 'S|', 'T', 'TQ', 'TRR', 'Q1', 'xR', '>', '>Z', 'F', 'R', 'D', 'DR', 'D^^', 'D>R', '@', '@0', '@a', '@11', '@4', '@9']) expect(() => parseToken(bad), bad).toThrow(LevelFormatError);
    expect(() => parseToken('@4')).toThrow(/portal pair 4 is out of range/);
    expect(() => parseToken('D?')).toThrow(/unknown token "D\?"/);
    expect(() => parseToken('FW')).toThrow(/white filter/);
    expect(() => parseToken('ZR')).toThrow(/unknown token "ZR"/);
    expect(() => parseToken('TQ')).toThrow(/unknown token "TQ"/);
    expect(new LevelFormatError('x').name).toBe('LevelFormatError');
  });

  const valid: LevelSource = { rows: ['>R . TR'], inventory: { mirror: 1 }, solutions: 1 };
  const withRows = (...rows: string[]): LevelSource => ({ ...valid, rows });

  it('parses a valid level with its inventory', () => {
    const level = parseLevel({ rows: ['>R . .', '. . TR'], inventory: { mirror: 1, splitter: 2 }, solutions: 1 });
    expect([level.width, level.height]).toEqual([3, 2]);
    expect(level.inventory).toEqual({ mirror: 1, splitter: 2, blocker: 0, polariser: 0, neutral: 0, filterR: 0, filterG: 0, filterB: 0, minusR: 0, minusG: 0, minusB: 0 });
    expect(parseLevel({ rows: ['>R . .', '. . TR2'], inventory: { neutral: 1, polariser: 2, minusB: 1 }, solutions: 1 }).inventory).toMatchObject({ neutral: 1, polariser: 2, minusB: 1, mirror: 0 });
    expect(() => parseLevel({ rows: ['>R . .', '. . TR'], inventory: { laser: 1 } as LevelSource['inventory'], solutions: 1 })).toThrow(/unknown piece "laser"/);
    expect(level.cells[5]).toEqual({ kind: 'target', colour: RED });
  });

  it('rejects malformed levels', () => {
    expect(() => parseLevel(withRows('>R TR'))).toThrow(/between 2×2 and 7×9/);
    expect(() => parseLevel(withRows('>R', 'TR'))).toThrow(/between/);
    expect(() => parseLevel(withRows(...new Array(MAX_HEIGHT + 1).fill('vR . TR')))).toThrow(/between/);
    expect(parseLevel(withRows(...new Array(MAX_HEIGHT - 1).fill('vR . .'), '. . TR')).height).toBe(MAX_HEIGHT);
    expect(() => parseLevel(withRows('>R . . . . . . TR', '. . . . . . . .'))).toThrow(/between/);
    expect(() => parseLevel(withRows('>R . .', '. TR'))).toThrow(/different lengths/);
    expect(() => parseLevel(withRows('. . .', '. . TR'))).toThrow(/no laser/);
    expect(() => parseLevel(withRows('>R . .', '. . X'))).toThrow(/no target/);
    expect(() => parseLevel({ ...withRows('vR . .', '. . TR'), inventory: {} })).toThrow(/inventory is empty/);
    expect(() => parseLevel({ ...withRows('vR . .', '. . TR'), inventory: { mirror: MAX_PER_KIND + 1 } })).toThrow(/bad mirror count/);
    expect(parseLevel({ ...withRows('vR . .', '. . TR'), inventory: { mirror: MAX_PER_KIND } }).inventory.mirror).toBe(9);
    expect(() => parseLevel(withRows('vR @1 .', '. . TR'))).toThrow(/portals must come in pairs/);
    expect(() => parseLevel(withRows('vR @1 @1', '@1 . TR'))).toThrow(/portals must come in pairs/);
    expect(() => parseLevel(withRows('vR @1 @2', '@1 . TR'))).toThrow(/portals must come in pairs/);
    expect(parseLevel(withRows('>R @1 @2', '@1 @2 TB')).cells.filter((c) => c.kind === 'portal')).toHaveLength(4);
    expect(() => parseLevel({ ...withRows('vR . .', '. . TR'), inventory: { blocker: -1 } })).toThrow(/bad blocker count/);
    expect(() => parseLevel({ ...withRows('vR . .', '. . TR'), inventory: { splitter: 0.5 } })).toThrow(/bad splitter count/);
    expect(() => parseLevel(withRows('>R . TR', '. . .'))).toThrow(/solved without any piece/);
    expect(parseLevel(withRows('vR . .', '. . TR')).width).toBe(3);
    expect(parseLevel(withRows('  vR .  ', ' .   TR')).cells.map((c) => c.kind)).toEqual(['emitter', 'empty', 'empty', 'target']);
    expect(parseLevel({ ...withRows('vR . .', '. . TR'), inventory: { blocker: 4 } }).inventory.blocker).toBe(4);
  });
});

/* ---------- The level sets ---------- */

describe('level sets', () => {
  /**
   * The original 24 levels (and their ids) from before the optical diodes, portals and optics:
   * "easy", "medium" and the first eight "hard" levels of state version 1.
   */
  const ORIGINAL: Readonly<Record<LevelSet, number>> = { intro: 8, easy: 8, medium: 8, hard: 0, expert: 0 };
  const isOriginal = (set: LevelSet, index: number) => index < ORIGINAL[set];
  const searches = new Map<LevelSource, DecisionSearch>();
  /** The exact decision search for a level (computed once per test run). */
  const decide = (source: LevelSource) => {
    let result = searches.get(source);
    if (!result) {
      result = solveByDecision(source.rows, source.inventory);
      searches.set(source, result);
    }
    return result;
  };
  /** Levels whose solution is checked here; the expert levels have their own test file (they take longest). */
  const CHECKED = ALL.filter((l) => l.set !== 'expert');

  it('offers four difficulties, keeps the introductory set for old saves, and matches the metadata', () => {
    expect(metadata.difficulties).toEqual([...DIFFICULTIES]);
    expect(DIFFICULTIES).toEqual(['easy', 'medium', 'hard', 'expert']);
    expect(LEVEL_SETS).toEqual(['intro', ...DIFFICULTIES]);
    expect(LEVEL_SETS.every((set) => isSelectable(set) === (set !== 'intro'))).toBe(true);
    expect(metadata.stateVersion).toBe(2);
    expect(levelCount('intro')).toBe(8);
    expect(levelCount('easy')).toBe(8);
    expect(levelCount('medium')).toBe(12);
    expect(levelCount('hard')).toBe(8);
    expect(levelCount('expert')).toBe(EXPERT_LEVELS);
    expect(EXPERT_LEVELS).toBeGreaterThanOrEqual(8);
  });

  it('labels every difficulty with the honest board size and piece range', () => {
    const range = (set: LevelSet) => {
      const counts = LEVELS[set].map(pieceCount);
      const [min, max] = [Math.min(...counts), Math.max(...counts)];
      return min === max ? `${min}` : `${min}–${max}`;
    };
    for (const set of DIFFICULTIES) {
      const level = getLevel(set, 0);
      const label = metadata.messages.en![`difficulty.${set}`]!;
      expect(label).toContain(`${level.width}×${level.height}`);
      expect(label).toContain(`${range(set)} pieces`);
    }
  });

  it('parses every level, fits a phone (≤ 7 wide) and grows with difficulty', () => {
    const sizes: Record<LevelSet, [number, number]> = { intro: [5, 5], easy: [6, 6], medium: [7, 7], hard: [7, 9], expert: [7, 9] };
    const pieces: Record<LevelSet, [number, number]> = { intro: [1, 2], easy: [2, 3], medium: [3, 6], hard: [7, 8], expert: [6, 9] };
    for (const { set, index, source } of ALL) {
      const level = getLevel(set, index);
      expect([level.width, level.height]).toEqual(sizes[set]);
      const count = PIECE_KINDS.reduce((sum, kind) => sum + level.inventory[kind], 0);
      expect(count).toBe(pieceCount(source));
      expect(count).toBeGreaterThanOrEqual(pieces[set][0]);
      expect(count).toBeLessThanOrEqual(pieces[set][1]);
      // Diodes and portals appear only in the newer levels, the optics only in the expert set.
      const special = level.cells.some((cell) => cell.kind === 'gate' || cell.kind === 'portal');
      if (set !== 'expert') expect(special).toBe(!isOriginal(set, index));
      expect(usesOptics(level)).toBe(set === 'expert');
      expect(getLevel(set, index)).toBe(level);
    }
  });

  it('has no duplicate boards', () => {
    const keys = ALL.map(({ source }) => source.rows.join('|'));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('throws for a level index out of range', () => {
    expect(() => getLevel('intro', 8)).toThrow(RangeError);
    expect(() => getLevel('intro', -1)).toThrow(/No level -1 in intro/);
    expect(() => getLevel('expert', EXPERT_LEVELS)).toThrow(/No level/);
  });

  describe('every level is solvable and has the recorded number of solutions (independent oracle)', { timeout: 120_000 }, () => {
    for (const { set, index, source } of CHECKED) {
      it(`${set} ${index + 1}`, () => {
        // The original levels are counted by the light-guided search; the big newer ones by the exact decision search.
        const search = isOriginal(set, index) ? undefined : decide(source);
        if (search) expect(search.complete).toBe(true);
        const solutions = search ? search.solutions : solveByLight(source.rows, source.inventory);
        expect(solutions.length).toBe(source.solutions);
        if (set === 'medium' || set === 'hard') expect(solutions.length).toBe(1);
        else expect(solutions.length).toBeLessThanOrEqual(2);
        for (const solution of solutions) {
          // The solution needs the whole inventory: every piece matters.
          expect(parseSolution(solution)).toHaveLength(pieceCount(source));
          // Playing it with the game's own actions solves the level.
          const solved = applySolution(stateOf(set, index), solution);
          expect(isSolved(solved)).toBe(true);
          expect(PIECE_KINDS.every((kind) => remaining(solved, kind) === 0)).toBe(true);
        }
        expect(isSolved(stateOf(set, index))).toBe(false);
      });
    }
  });

  it('light-guided search finds exactly what exhaustive enumeration finds (intro and easy)', { timeout: 120_000 }, () => {
    for (const { source } of ALL.filter((l) => l.set === 'intro' || l.set === 'easy')) {
      expect(solveExhaustively(source.rows, source.inventory)).toEqual(solveByLight(source.rows, source.inventory));
    }
  });

  it('the exact decision search finds exactly what the light-guided search finds (original levels)', { timeout: 120_000 }, () => {
    for (const { set, index, source } of ALL) {
      if (!isOriginal(set, index)) continue;
      const search = decide(source);
      expect(search.complete).toBe(true);
      expect(search.solutions).toEqual(solveByLight(source.rows, source.inventory));
    }
  });

  it('the decision search agrees with the light-guided search on small random puzzles with diodes, portals and optics (property)', { timeout: 60_000 }, () => {
    const puzzleArb = fc
      .tuple(
        fc.array(
          fc.array(
            fc.oneof(
              { weight: 8, arbitrary: fc.constant('.') },
              { weight: 3, arbitrary: fc.constantFrom('#', 'X', 'D^', 'D>', 'Dv', 'D<', '@1', 'TR', 'TM', 'TB', 'FM', 'P0', 'P45', 'N', '-R', 'TR2', 'TW4', 'TR:0', 'TB2:45', 'TM:90') }
            ),
            { minLength: 4, maxLength: 4 }
          ),
          { minLength: 4, maxLength: 4 }
        ),
        fc.constantFrom('>R', '>M', 'vB', '<W'),
        fc.integer({ min: 0, max: 3 }),
        fc.record({
          mirror: fc.integer({ min: 0, max: 2 }),
          splitter: fc.integer({ min: 0, max: 1 }),
          blocker: fc.integer({ min: 0, max: 1 }),
          polariser: fc.integer({ min: 0, max: 1 }),
          neutral: fc.integer({ min: 0, max: 1 }),
          filterR: fc.integer({ min: 0, max: 1 }),
          minusB: fc.integer({ min: 0, max: 1 })
        })
      )
      .map(([grid, laser, row, inventory]) => {
        const copy: string[][] = grid.map((r) => [...r]);
        copy[row]![laser === '>R' || laser === '>M' ? 0 : laser === '<W' ? 3 : 1] = laser;
        return { rows: copy.map((r) => r.join(' ')), inventory };
      });
    fc.assert(
      fc.property(puzzleArb, ({ rows, inventory }) => {
        const search = solveByDecision(rows, inventory);
        expect(search.complete).toBe(true);
        expect(search.solutions).toEqual(solveByLight(rows, inventory));
      }),
      { numRuns: 120 }
    );
  });

  it('the newer levels need more pieces and a bigger exact search than the original medium levels', { timeout: 120_000 }, () => {
    const medium = ALL.filter((l) => l.set === 'medium');
    const original = medium.filter((l) => isOriginal('medium', l.index));
    const added = medium.filter((l) => !isOriginal('medium', l.index));
    const hard = ALL.filter((l) => l.set === 'hard');
    const maxOriginalNodes = Math.max(...original.map((l) => decide(l.source).nodes));
    const maxOriginalPieces = Math.max(...original.map((l) => pieceCount(l.source)));
    for (const { source } of [...added, ...hard]) {
      expect(decide(source).nodes).toBeGreaterThan(maxOriginalNodes);
      expect(pieceCount(source)).toBeGreaterThan(maxOriginalPieces);
    }
    for (const { source } of hard) expect(pieceCount(source)).toBeGreaterThan(Math.max(...added.map((l) => pieceCount(l.source))));
    // The expert test file compares its search trees with this bound.
    expect(Math.max(...hard.map((l) => decide(l.source).nodes))).toBe(HARD_MAX_NODES);
  });
});

/* ---------- Game state ---------- */

describe('game state', () => {
  it('chooses the level from the seed and difficulty', () => {
    expect(createInitialState(0)).toEqual({ seed: 0, difficulty: DEFAULT_DIFFICULTY, level: 0, pieces: [], moves: 0, undo: [] });
    expect(createInitialState(13, 'medium').level).toBe(1);
    expect(createInitialState(13, 'easy').level).toBe(5);
    expect(createInitialState(11, 'medium').level).toBe(11);
    expect(createInitialState(10, 'hard').level).toBe(2);
    expect(createInitialState(EXPERT_LEVELS + 3, 'expert').level).toBe(3);
    expect(createInitialState(13, 'intro').level).toBe(5);
    expect(createInitialState(-1).seed).toBe(0xffffffff);
    expect(createInitialState(-1).level).toBe(0xffffffff % 8);
    expect(toDifficulty('medium')).toBe('medium');
    expect(toDifficulty('expert')).toBe('expert');
    // The introductory set is not offered for new games any more.
    expect(toDifficulty('intro')).toBe('easy');
    expect(toDifficulty('extreme')).toBe('easy');
    expect(toDifficulty(undefined)).toBe('easy');
  });

  it('is deterministic for every seed (property)', () => {
    fc.assert(
      fc.property(fc.nat(), fc.constantFrom(...LEVEL_SETS), (seed, difficulty) => {
        expect(createInitialState(seed, difficulty)).toEqual(createInitialState(seed, difficulty));
        expect(createInitialState(seed, difficulty).level).toBe(seed % LEVELS[difficulty].length);
      })
    );
  });

  // Easy level 1: '.  /  .  .  <R' / '.  .  .  .  #' / ... / 'TR . . . .' — one mirror.
  const easy1 = stateOf('intro', 0);
  const mirrorCell = 3 * 5 + 1;

  it('places a piece only on empty squares while the inventory lasts', () => {
    expect(remaining(easy1, 'mirror')).toBe(1);
    expect(remaining(easy1, 'splitter')).toBe(0);
    expect(canPlace(easy1, 4, 'mirror')).toBe(false); // the laser
    expect(canPlace(easy1, 1, 'mirror')).toBe(false); // a fixed mirror
    expect(canPlace(easy1, -1, 'mirror')).toBe(false);
    expect(canPlace(easy1, 25, 'mirror')).toBe(false);
    expect(canPlace(easy1, 2.5, 'mirror')).toBe(false);
    expect(canPlace(easy1, 0, 'splitter')).toBe(false);
    expect(placePiece(easy1, 4, 'mirror')).toBe(easy1);
    const placed = placePiece(easy1, 0, 'mirror');
    expect(placed.pieces).toEqual([{ cell: 0, kind: 'mirror', orient: 0 }]);
    expect(placed.moves).toBe(1);
    expect(placed.undo).toEqual([{ pieces: [], moves: 0 }]);
    expect(remaining(placed, 'mirror')).toBe(0);
    expect(canPlace(placed, 2, 'mirror')).toBe(false);
    expect(placePiece(placed, 2, 'mirror')).toBe(placed);
    expect(pieceAt(placed, 0)).toEqual({ cell: 0, kind: 'mirror', orient: 0 });
    expect(pieceAt(placed, 2)).toBeUndefined();
    expect(easy1.pieces).toEqual([]);
  });

  it('keeps pieces sorted, never on the same square twice', () => {
    let s = stateOf('medium', 7); // four splitters
    s = placePiece(s, 30, 'splitter');
    s = placePiece(s, 10, 'splitter');
    s = placePiece(s, 20, 'splitter');
    expect(s.pieces.map((p) => p.cell)).toEqual([10, 20, 30]);
    expect(placePiece(s, 20, 'splitter')).toBe(s);
    expect(remaining(s, 'splitter')).toBe(1);
  });

  it('turns mirrors and splitters, but not blockers', () => {
    const placed = placePiece(easy1, 0, 'mirror');
    const turned = rotatePiece(placed, 0);
    expect(pieceAt(turned, 0)?.orient).toBe(1);
    expect(turned.moves).toBe(2);
    expect(turned.undo).toEqual([{ pieces: [], moves: 0 }, { pieces: placed.pieces, moves: 1 }]);
    expect(rotatePiece(rotatePiece(turned, 0), 0)).toMatchObject({ pieces: turned.pieces, moves: 4 });
    expect(pieceAt(rotatePiece(turned, 0), 0)?.orient).toBe(0);
    expect(rotatePiece(placed, 2)).toBe(placed);
    const medium = placePiece(stateOf('easy', 5), 1, 'blocker'); // a level with a blocker
    expect(medium.pieces).toEqual([{ cell: 1, kind: 'blocker', orient: 0 }]);
    expect(rotatePiece(medium, 1)).toBe(medium);
  });

  it('solves easy level 1 with a mirror tilted like / and then locks the board', () => {
    const solved = placePiece(easy1, mirrorCell, 'mirror');
    expect(isSolved(solved)).toBe(true);
    expect(evaluateState(solved)).toMatchObject({ correct: 1, solved: true });
    expect(rotatePiece(solved, mirrorCell)).toBe(solved);
    expect(removePiece(solved, mirrorCell)).toBe(solved);
    expect(clearBoard(solved)).toBe(solved);
    expect(undo(solved)).toBe(solved);
    expect(canUndo(solved)).toBe(false);
    expect(canClear(solved)).toBe(false);
    expect(canPlace(stateOf('intro', 5), 0, 'mirror')).toBe(true);
    // Turning it the other way breaks the solution again.
    const wrong = rotatePiece(placePiece(easy1, mirrorCell + 1, 'mirror'), mirrorCell + 1);
    expect(isSolved(wrong)).toBe(false);
  });

  it('removes pieces back into the inventory', () => {
    const placed = placePiece(easy1, 0, 'mirror');
    const removed = removePiece(placed, 0);
    expect(removed.pieces).toEqual([]);
    expect(removed.moves).toBe(2);
    expect(remaining(removed, 'mirror')).toBe(1);
    expect(removePiece(removed, 0)).toBe(removed);
    expect(removePiece(placed, 1)).toBe(placed);
    const two = placePiece(placePiece(stateOf('intro', 7), 0, 'mirror'), 1, 'splitter');
    expect(removePiece(two, 0).pieces).toEqual([{ cell: 1, kind: 'splitter', orient: 0 }]);
  });

  it('clears the board and undoes step by step, including the clearing', () => {
    let s = stateOf('intro', 7); // mirror + splitter
    s = placePiece(s, 0, 'mirror');
    s = placePiece(s, 1, 'splitter');
    s = rotatePiece(s, 1);
    expect(canClear(s)).toBe(true);
    const cleared = clearBoard(s);
    expect(cleared.pieces).toEqual([]);
    expect(cleared.moves).toBe(0);
    expect(canClear(cleared)).toBe(false);
    expect(clearBoard(cleared)).toBe(cleared);
    const back = undo(cleared);
    expect(back.pieces).toEqual(s.pieces);
    expect(back.moves).toBe(3);
    const twice = undo(back);
    expect(twice.pieces).toEqual([{ cell: 0, kind: 'mirror', orient: 0 }, { cell: 1, kind: 'splitter', orient: 0 }]);
    expect(twice.moves).toBe(2);
    expect(undo(undo(twice))).toMatchObject({ pieces: [], moves: 0, undo: [] });
    expect(canUndo(stateOf('intro', 7))).toBe(false);
    expect(undo(easy1)).toBe(easy1);
  });

  it(`keeps at most ${MAX_UNDO} undo steps`, () => {
    let s = placePiece(stateOf('intro', 7), 0, 'mirror');
    for (let i = 0; i < MAX_UNDO + 5; i++) s = rotatePiece(s, 0);
    expect(s.undo).toHaveLength(MAX_UNDO);
    expect(s.moves).toBe(MAX_UNDO + 6);
    expect(s.undo[0]!.moves).toBe(6);
    expect(isLaserState(s)).toBe(true);
  });

  it('caps the move counter', () => {
    const s = { ...placePiece(stateOf('intro', 7), 0, 'mirror'), moves: MAX_MOVES };
    expect(rotatePiece(s, 0).moves).toBe(MAX_MOVES);
  });

  it('switches levels with an empty board and resets to the seeded level', () => {
    const s = placePiece(stateOf('easy', 2), 0, 'mirror');
    const other = chooseLevel(s, 5);
    expect(other).toEqual({ ...s, level: 5, pieces: [], moves: 0, undo: [] });
    expect(chooseLevel(other, 5)).toBe(other);
    expect(chooseLevel(s, 2)).toEqual({ ...s, pieces: [], moves: 0, undo: [] });
    expect(chooseLevel(s, 8)).toBe(s);
    expect(chooseLevel(s, -1)).toBe(s);
    expect(chooseLevel({ ...stateOf('intro', 1), moves: 3 }, 1).moves).toBe(0);
    expect(chooseLevel({ ...stateOf('intro', 1), pieces: [{ cell: 0, kind: 'mirror', orient: 0 }] }, 1).pieces).toEqual([]);
    expect(chooseLevel({ ...stateOf('intro', 1), undo: [{ pieces: [], moves: 0 }] }, 1).undo).toEqual([]);
    const seeded = createInitialState(11, 'medium');
    expect(resetState(chooseLevel(placePiece(seeded, 0, 'mirror'), 0))).toEqual(seeded);
  });

  it('builds the board with the pieces on it', () => {
    const s = rotatePiece(placePiece(placePiece(stateOf('easy', 5), 1, 'blocker'), 2, 'splitter'), 2);
    const board = boardOf(s);
    expect(board.cells[0]).toEqual({ kind: 'blocker' }); // a fixed blocker of the level
    expect(board.cells[1]).toEqual({ kind: 'blocker' });
    expect(board.cells[2]).toEqual({ kind: 'splitter', orient: 1 });
    expect(boardWith(levelOf(s), [])).toEqual({ width: 6, height: 6, cells: levelOf(s).cells });
    expect(levelOf(s).cells[1]).toEqual({ kind: 'empty' });
  });

  it('knows how each piece turns and what it becomes on the board', () => {
    expect(PIECE_KINDS.map(orientationCount)).toEqual([2, 2, 1, 4, 1, 1, 1, 1, 1, 1, 1]);
    expect(pieceElement('mirror', 1)).toEqual({ kind: 'mirror', orient: 1 });
    expect(pieceElement('splitter', 0)).toEqual({ kind: 'splitter', orient: 0 });
    expect(pieceElement('blocker', 0)).toEqual({ kind: 'blocker' });
    expect(pieceElement('polariser', 3)).toEqual({ kind: 'polariser', angle: 3 });
    expect(pieceElement('neutral', 0)).toEqual({ kind: 'neutral' });
    expect(pieceElement('filterG', 0)).toEqual({ kind: 'filter', colour: GREEN });
    expect(pieceElement('minusB', 0)).toEqual({ kind: 'absorber', colour: BLUE });
    const kinds: PieceKind[] = [...PIECE_KINDS];
    expect(kinds.map((kind) => colourLetter(Math.max(0, colourFromLetter(kind.slice(-1)))))).toEqual(['', '', '', '', '', 'R', 'G', 'B', 'R', 'G', 'B']);
  });

  it('turns a polariser in 45° steps, and has nothing to turn on filters', () => {
    const { set, index } = ALL.find((l) => l.set === 'expert' && (l.source.inventory.polariser ?? 0) > 0)!;
    const level = getLevel(set, index);
    const cell = level.cells.findIndex((element) => element.kind === 'empty');
    let s = placePiece(stateOf(set, index), cell, 'polariser');
    expect(pieceAt(s, cell)).toEqual({ cell, kind: 'polariser', orient: 0 });
    expect(canRotate(s, cell)).toBe(true);
    const angles = [0];
    for (let i = 0; i < 4; i++) {
      s = rotatePiece(s, cell);
      angles.push(pieceAt(s, cell)!.orient);
    }
    expect(angles).toEqual([0, 1, 2, 3, 0]);
    expect(boardOf(rotatePiece(s, cell)).cells[cell]).toEqual({ kind: 'polariser', angle: 1 });
    expect(isLaserState(s)).toBe(true);
    for (const kind of PIECE_KINDS.filter((k) => orientationCount(k) === 1 && level.inventory[k] > 0)) {
      const other = level.cells.findIndex((element, c) => element.kind === 'empty' && c !== cell);
      const placed = placePiece(s, other, kind);
      expect(pieceAt(placed, other)?.kind).toBe(kind);
      expect(canRotate(placed, other)).toBe(false);
      expect(rotatePiece(placed, other)).toBe(placed);
    }
    expect(canRotate(s, -1)).toBe(false);
  });

  it('random play keeps the state valid and the inventory respected (property)', () => {
    const action = fc.record({
      type: fc.constantFrom('place', 'rotate', 'remove', 'clear', 'undo'),
      cell: fc.integer({ min: -1, max: 49 }),
      kind: fc.constantFrom(...PIECE_KINDS)
    });
    fc.assert(
      fc.property(fc.constantFrom(...LEVEL_SETS), fc.nat(), fc.array(action, { maxLength: 40 }), (difficulty, seed, actions) => {
        let s = createInitialState(seed, difficulty);
        for (const a of actions) {
          if (a.type === 'place') s = placePiece(s, a.cell, a.kind);
          else if (a.type === 'rotate') s = rotatePiece(s, a.cell);
          else if (a.type === 'remove') s = removePiece(s, a.cell);
          else if (a.type === 'clear') s = clearBoard(s);
          else s = undo(s);
          expect(isLaserState(JSON.parse(JSON.stringify(s)))).toBe(true);
          for (const kind of PIECE_KINDS) expect(remaining(s, kind)).toBeGreaterThanOrEqual(0);
        }
      }),
      { numRuns: 150 }
    );
  });
});

/* ---------- Validation ---------- */

describe('isLaserState', () => {
  const base = (): LaserState => rotatePiece(placePiece(placePiece(stateOf('intro', 7), 0, 'mirror'), 1, 'splitter'), 1);

  it('accepts real states', () => {
    expect(isLaserState(base())).toBe(true);
    expect(isLaserState(createInitialState(99, 'medium'))).toBe(true);
    expect(isLaserState(placePiece(stateOf('easy', 5), 1, 'blocker'))).toBe(true);
  });

  it('rejects broken or tampered states', () => {
    const s = base();
    const bad: unknown[] = [
      null,
      [],
      'state',
      { ...s, seed: -1 },
      { ...s, seed: 2 ** 32 },
      { ...s, difficulty: 'extreme' },
      { ...s, level: 8 },
      { ...s, level: -1 },
      { ...s, level: 1.5 },
      { ...s, pieces: 'none' },
      { ...s, pieces: [{ cell: 0, kind: 'mirror', orient: 0, extra: 1 }] },
      { ...s, pieces: [{ cell: 0, kind: 'mirror' }] },
      { ...s, pieces: [null] },
      { ...s, pieces: [{ cell: 0, kind: 'laser', orient: 0 }] },
      { ...s, pieces: [{ cell: 0, kind: 'mirror', orient: 2 }] },
      { ...s, pieces: [{ cell: 0, kind: 'polariser', orient: 0 }] },
      { ...s, pieces: [{ cell: 0, kind: 'neutral', orient: 0 }] },
      { ...s, difficulty: 'toString' },
      { ...s, pieces: [{ cell: 25, kind: 'mirror', orient: 0 }] },
      { ...s, pieces: [{ cell: -1, kind: 'mirror', orient: 0 }] },
      // Intro level 8, last row 'X  TR ^R .  .': cell 20 is a forbidden sensor.
      { ...s, pieces: [{ cell: 20, kind: 'mirror', orient: 0 }] },
      { ...s, pieces: [{ cell: 1, kind: 'splitter', orient: 0 }, { cell: 0, kind: 'mirror', orient: 0 }] },
      { ...s, pieces: [{ cell: 0, kind: 'mirror', orient: 0 }, { cell: 0, kind: 'splitter', orient: 0 }] },
      { ...s, pieces: [{ cell: 0, kind: 'mirror', orient: 0 }, { cell: 1, kind: 'mirror', orient: 0 }] },
      { ...s, pieces: [{ cell: 0, kind: 'blocker', orient: 0 }] },
      { ...stateOf('easy', 5), pieces: [{ cell: 1, kind: 'blocker', orient: 1 }] },
      { ...s, moves: -1 },
      { ...s, moves: MAX_MOVES + 1 },
      { ...s, moves: '3' },
      { ...s, undo: 'none' },
      { ...s, undo: [null] },
      { ...s, undo: [{ pieces: [], moves: -1 }] },
      { ...s, undo: [{ pieces: [{ cell: 18, kind: 'mirror', orient: 0 }], moves: 1 }] },
      { ...s, undo: [{ moves: 1 }] },
      { ...s, undo: new Array(MAX_UNDO + 1).fill({ pieces: [], moves: 0 }) }
    ];
    for (const value of bad) expect(isLaserState(value), JSON.stringify(value)?.slice(0, 120)).toBe(false);
    const { moves: _moves, ...noMoves } = s;
    expect(isLaserState(noMoves)).toBe(false);
    expect(isLaserState({ ...s, undo: new Array(MAX_UNDO).fill({ pieces: [], moves: 0 }) })).toBe(true);
  });

  it('never throws on arbitrary data (property)', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        expect(() => isLaserState(value)).not.toThrow();
        expect(isLaserState(value)).toBe(false);
      }),
      { numRuns: 300 }
    );
    const throwing = { get seed(): number { throw new Error('boom'); } };
    expect(isLaserState(throwing)).toBe(false);
  });
});
