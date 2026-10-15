import { bcp47Tag, type GameContext, type GameInstance, type NewGameOptions } from '@wp/game-core';
import { announce, clear, gridKeyboard, h } from '@wp/ui';
import {
  DIRS,
  PIECE_KINDS,
  PRIMARIES,
  angleDegrees,
  boardOf,
  brightness,
  canClear,
  canUndo,
  chooseLevel,
  clearBoard,
  colourFromLetter,
  colourLetter,
  createInitialState,
  evaluate,
  intensityOf,
  isSelectable,
  levelCount,
  levelOf,
  orientationCount,
  pieceAt,
  pieceElement,
  placePiece,
  polarisationAngle,
  polarisations,
  remaining,
  removePiece,
  resetState,
  rotatePiece,
  toDifficulty,
  traceBeams,
  undo,
  type Angle,
  type Arrival,
  type Board,
  type BeamTrace,
  type Element as BoardElement,
  type Evaluation,
  type LaserState,
  type Level,
  type Orientation,
  type PieceKind,
  type Polarisation
} from './rules';
import './styles.css';

const SVG_NS = 'http://www.w3.org/2000/svg';
type SvgAttrs = Record<string, string | number>;

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: SvgAttrs, ...children: (SVGElement | string)[]): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value));
  for (const child of children) el.append(child);
  return el;
}

/** Lane offset per primary so that mixed light shows as parallel lines (red, green, blue). */
const LANE: Readonly<Record<number, number>> = { 1: -9, 2: 0, 4: 9 };
const PRIMARY_CLASS: Readonly<Record<number, string>> = { 1: 'lc-beam-r', 2: 'lc-beam-g', 4: 'lc-beam-b' };
/** Side midpoints of a 100×100 square, by direction (up, right, down, left). */
const SIDE_X = [50, 100, 50, 0] as const;
const SIDE_Y = [0, 50, 100, 50] as const;

/** Beam half-segments for one square: centre → each lit side, one line per primary colour. */
function beamLines(trace: BeamTrace, cell: number): SVGElement[] {
  const lines: SVGElement[] = [];
  for (const dir of DIRS) {
    const mask = trace.sides[cell * 4 + dir] ?? 0;
    for (const primary of PRIMARIES) {
      if ((mask & primary) === 0) continue;
      const lane = LANE[primary] ?? 0;
      const vertical = dir % 2 === 0;
      // Fainter light is drawn thinner (½ thinner, ¼ and below thinnest), never only lighter.
      const dim = Math.min(2, Math.max(0, trace.sideLevels[cell * 4 + dir] ?? 0));
      // All half-segments of one primary meet at (50 + lane, 50 + lane), so turns stay connected.
      lines.push(
        svg('line', {
          class: `lc-beam ${PRIMARY_CLASS[primary]}`,
          'data-dim': dim,
          x1: 50 + lane,
          y1: 50 + lane,
          x2: vertical ? 50 + lane : SIDE_X[dir],
          y2: vertical ? SIDE_Y[dir] : 50 + lane
        })
      );
    }
  }
  return lines;
}

/** Arrow heads of a laser, by direction; they stick out of the laser's body towards the beam. */
const ARROW_POINTS = ['50,3 68,27 32,27', '97,50 73,68 73,32', '50,97 32,73 68,73', '3,50 27,32 27,68'] as const;
const DIAGONAL: Readonly<Record<Orientation, SvgAttrs>> = { 0: { x1: 18, y1: 82, x2: 82, y2: 18 }, 1: { x1: 18, y1: 18, x2: 82, y2: 82 } };

const label = (text: string, extra = '') => svg('text', { x: 50, y: 52, class: `lc-letter ${extra}`.trim(), 'text-anchor': 'middle', 'dominant-baseline': 'central' }, text);
const smallText = (x: number, y: number, text: string, extra = '') =>
  svg('text', { x, y, class: `lc-small ${extra}`.trim(), 'text-anchor': 'middle', 'dominant-baseline': 'central' }, text);

/** An intensity as a fraction of a laser's: 1, ½, ¼, ⅛, 1/16 … (other sums as n/64). */
export function fractionText(value: number): string {
  const symbols: Readonly<Record<number, string>> = { 1: '1', 0.5: '½', 0.25: '¼', 0.125: '⅛' };
  const symbol = symbols[value];
  if (symbol) return symbol;
  if (Number.isInteger(1 / value)) return `1/${1 / value}`;
  let numerator = Math.round(value * 64);
  let denominator = 64;
  while (numerator % 2 === 0 && denominator > 1) {
    numerator /= 2;
    denominator /= 2;
  }
  return `${numerator}/${denominator}`;
}

/** End points of a line through (50, cy) at `angle` (0° horizontal, counter-clockwise, as seen on the board). */
function axisLine(angle: Angle, cy: number, half: number): SvgAttrs {
  const radians = (angleDegrees(angle) * Math.PI) / 180;
  const dx = Math.round(Math.cos(radians) * half * 10) / 10;
  const dy = Math.round(Math.sin(radians) * half * 10) / 10;
  return { x1: 50 - dx, y1: cy + dy, x2: 50 + dx, y2: cy - dy };
}

/** Picture of an element. Shape and letters carry the meaning; colour only reinforces it. */
function elementGlyph(element: BoardElement, placed: boolean, got: number, targetOk = false): SVGElement[] {
  switch (element.kind) {
    case 'empty':
      return [];
    case 'emitter':
      return [
        svg('polygon', { class: 'lc-arrow', points: ARROW_POINTS[element.dir] }),
        svg('rect', { class: 'lc-emitter', x: 26, y: 26, width: 48, height: 48, rx: 10, 'data-colour': colourLetter(element.colour) }),
        label(colourLetter(element.colour), 'lc-on-dark')
      ];
    case 'mirror': {
      const shapes: SVGElement[] = [svg('line', { class: `lc-mirror${placed ? ' lc-mine' : ''}`, ...DIAGONAL[element.orient] })];
      if (!placed) shapes.push(svg('circle', { class: 'lc-bolt', cx: 50, cy: 50, r: 5 }));
      return shapes;
    }
    case 'splitter':
      return [
        svg('rect', { class: `lc-splitter-box${placed ? ' lc-mine' : ''}`, x: 30, y: 30, width: 40, height: 40, rx: 4 }),
        svg('line', { class: `lc-splitter${placed ? ' lc-mine' : ''}`, ...DIAGONAL[element.orient] }),
        ...(placed ? [] : [svg('circle', { class: 'lc-bolt', cx: 50, cy: 50, r: 5 })])
      ];
    case 'filter':
      return [
        svg('rect', { class: `lc-filter${placed ? ' lc-mine' : ''}`, x: 12, y: 12, width: 76, height: 76, rx: 6, 'data-colour': colourLetter(element.colour) }),
        label(colourLetter(element.colour))
      ];
    case 'absorber':
      // A crossed-out letter: this colour is taken out, the rest passes.
      return [
        svg('rect', { class: `lc-filter${placed ? ' lc-mine' : ''}`, x: 12, y: 12, width: 76, height: 76, rx: 6 }),
        svg('line', { class: 'lc-strike', x1: 22, y1: 78, x2: 78, y2: 22 }),
        label(`−${colourLetter(element.colour)}`, 'lc-minus')
      ];
    case 'neutral':
      return [
        svg('rect', { class: `lc-neutral${placed ? ' lc-mine' : ''}`, x: 14, y: 14, width: 72, height: 72, rx: 6 }),
        svg('path', { class: 'lc-neutral-grid', d: 'M32 14 V86 M50 14 V86 M68 14 V86 M14 32 H86 M14 50 H86 M14 68 H86' }),
        label('½')
      ];
    case 'polariser':
      return [
        svg('circle', { class: `lc-polariser${placed ? ' lc-mine' : ''}`, cx: 50, cy: 42, r: 30 }),
        svg('line', { class: `lc-polariser-axis${placed ? ' lc-mine' : ''}`, ...axisLine(element.angle, 42, 30) }),
        ...(placed ? [] : [svg('circle', { class: 'lc-bolt', cx: 50, cy: 42, r: 5 })]),
        smallText(50, 88, `${angleDegrees(element.angle)}°`)
      ];
    case 'blocker':
      return [svg('rect', { class: `lc-blocker${placed ? ' lc-mine' : ''}`, x: 16, y: 16, width: 68, height: 68, rx: placed ? 14 : 4 })];
    case 'target': {
      const ok = targetOk;
      const shapes: SVGElement[] = [
        svg('circle', { class: 'lc-target', cx: 50, cy: 50, r: 34, 'data-colour': colourLetter(element.colour) }),
        svg('circle', { class: 'lc-target-inner', cx: 50, cy: 50, r: 24 })
      ];
      // An analyser target shows the polarisation it needs as a line across it; an intensity target its fraction.
      if (element.pol !== undefined) shapes.push(svg('line', { class: 'lc-target-pol', ...axisLine(element.pol, 50, 46) }));
      shapes.push(label(colourLetter(element.colour)));
      if (element.level !== undefined) shapes.push(smallText(17, 15, fractionText(intensityOf(element.level)), 'lc-need'));
      if (ok) shapes.push(svg('path', { class: 'lc-check', d: 'M64 80 L72 88 L90 66' }));
      else if (got !== 0) shapes.push(svg('text', { class: 'lc-got', x: 84, y: 86, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, colourLetter(got)));
      return shapes;
    }
    case 'sensor':
      return [
        svg('polygon', { class: 'lc-sensor', points: '50,14 86,50 50,86 14,50' }),
        svg('path', { class: 'lc-sensor-x', d: got === 0 ? 'M40 40 L60 60 M60 40 L40 60' : 'M50 34 L50 56 M50 64 L50 68' })
      ];
    case 'gate':
      // A diode symbol (triangle against a bar) pointing the way light may pass; drawn pointing up, then turned.
      return [
        svg('g', { transform: `rotate(${element.dir * 90} 50 50)` },
          svg('path', { class: 'lc-gate-rail', d: 'M22 16 L22 84 M78 16 L78 84' }),
          svg('polygon', { class: 'lc-gate', points: '50,26 70,66 30,66' }),
          svg('line', { class: 'lc-gate-bar', x1: 28, y1: 24, x2: 72, y2: 24 })
        )
      ];
    case 'portal':
      // A hexagon (never a circle like targets) with the pair's number (never a colour letter).
      return [
        svg('polygon', { class: 'lc-portal', points: '50,10 85,30 85,70 50,90 15,70 15,30' }),
        svg('polygon', { class: 'lc-portal-inner', points: '50,22 74,36 74,64 50,78 26,64 26,36' }),
        label(String(element.pair), 'lc-portal-number')
      ];
  }
}

/** Legend lines, shown when a level contains such an element (fixed or in the inventory). */
const LEGEND_KINDS = ['gate', 'portal', 'filter', 'absorber', 'neutral', 'polariser', 'intensity', 'analyser'] as const;
type LegendKind = (typeof LEGEND_KINDS)[number];
const LEGEND_SAMPLE: Readonly<Record<LegendKind, BoardElement>> = {
  gate: { kind: 'gate', dir: 1 },
  portal: { kind: 'portal', pair: 1 },
  filter: { kind: 'filter', colour: 1 },
  absorber: { kind: 'absorber', colour: 1 },
  neutral: { kind: 'neutral' },
  polariser: { kind: 'polariser', angle: 1 },
  intensity: { kind: 'target', colour: 1, level: 2 },
  analyser: { kind: 'target', colour: 1, pol: 1 }
};

/** The legend lines an element needs (a target can need two). */
function legendKinds(element: BoardElement): LegendKind[] {
  if (element.kind === 'target') return [...(element.level !== undefined ? ['intensity' as const] : []), ...(element.pol !== undefined ? ['analyser' as const] : [])];
  return (LEGEND_KINDS as readonly string[]).includes(element.kind) ? [element.kind as LegendKind] : [];
}

/** Elements of a level, including those its inventory can place. */
function levelElements(level: Level): BoardElement[] {
  const elements = [...level.cells];
  for (const kind of PIECE_KINDS) if (level.inventory[kind] > 0) elements.push(pieceElement(kind, 0));
  return elements;
}

/** True when polarisation or intensity can matter in a level (then light descriptions mention them). */
const hasOptics = (level: Level): boolean =>
  levelElements(level).some((element) => element.kind === 'polariser' || element.kind === 'neutral' || (element.kind === 'target' && (element.level !== undefined || element.pol !== undefined)));

const ORIENT_KEY: Readonly<Record<Orientation, string>> = { 0: 'orient.slash', 1: 'orient.backslash' };
const DIR_KEY = ['dir.up', 'dir.right', 'dir.down', 'dir.left'] as const;

/** Long-press duration that takes a placed piece back (an alternative to Remove mode). */
const LONG_PRESS_MS = 550;

const cloneState = (state: LaserState): LaserState => JSON.parse(JSON.stringify(state)) as LaserState;

export function createLaserCircuit(context: GameContext): GameInstance<LaserState> {
  const { t, root } = context;
  let state = createInitialState(0);
  let paused = false;
  let builtKey = '';
  let cells: HTMLButtonElement[] = [];
  let signatures: string[] = [];
  let disposeKeyboard: () => void = () => undefined;
  let selected: PieceKind = 'mirror';
  let removeMode = false;
  let pressTimer: ReturnType<typeof setTimeout> | undefined;
  let suppressClick = false;
  let pressStart = { x: 0, y: 0 };

  const colourName = (mask: number) => (mask === 0 ? t('light.none') : t(`colour.${colourLetter(mask)}`));
  const pieceName = (kind: PieceKind) => {
    if (kind.startsWith('filter')) return t('piece.filter', { colour: colourName(colourFromLetter(kind.charAt(6))) });
    if (kind.startsWith('minus')) return t('piece.minus', { colour: colourName(colourFromLetter(kind.charAt(5))) });
    return t(`piece.${kind}`);
  };
  const angleText = (angle: Angle) => t('orient.angle', { angle: angleDegrees(angle) });
  const polText = (pol: Polarisation) => {
    const angle = polarisationAngle(pol);
    return angle === undefined ? t('light.unpolarised') : t('light.polarised', { angle: angleDegrees(angle) });
  };
  /** A colour with intensity and polarisation details. */
  const withDetails = (colour: string, details: string[]) => (details.length === 0 ? colour : t('light.details', { colour, details: details.join(t('light.separator')) }));
  /** Polarisation and intensity matter in the current level (then light descriptions mention them). */
  let optics = false;
  /** Light received by a square, described for screen readers. */
  const lightText = (got: number, arrivals: readonly Arrival[]) => {
    if (got === 0 || !optics) return colourName(got);
    const pols = polarisations(arrivals);
    return withDetails(colourName(got), [
      t('light.intensity', { value: fractionText(brightness(arrivals)) }),
      pols.length === 1 ? polText(pols[0] as Polarisation) : t('light.mixed')
    ]);
  };

  const levelStatus = h('p', { class: 'lc-level', 'data-testid': 'level-status' });
  const targetsStat = h('span', { 'data-testid': 'targets' });
  const movesStat = h('span', { 'data-testid': 'moves' });
  const stats = h('p', { class: 'lc-stats' }, targetsStat, movesStat);
  const status = h('p', { class: 'wp-status lc-status', 'data-testid': 'status', hidden: true });

  const board = h('div', {
    class: 'lc-board',
    role: 'group',
    dir: 'ltr',
    'aria-label': t('board'),
    'aria-describedby': 'lc-help-keys',
    'data-testid': 'board',
    onclick: (event: Event) => onBoardClick(event),
    oncontextmenu: (event: Event) => onContextMenu(event),
    onpointerdown: (event: Event) => onPointerDown(event as PointerEvent),
    onpointerup: () => cancelPress(),
    onpointermove: (event: Event) => onPointerMove(event as PointerEvent),
    onpointerleave: () => cancelPress(),
    onpointercancel: () => cancelPress()
  });

  const inventoryButtons = new Map<PieceKind, HTMLButtonElement>();
  const inventory = h('div', { class: 'lc-inventory', role: 'group', 'aria-label': t('inventory'), 'data-testid': 'inventory' });
  const removeButton = h('button', { type: 'button', class: 'lc-remove', 'aria-pressed': 'false', 'data-testid': 'mode-remove', onclick: () => toggleRemoveMode() }, t('action.remove'));
  const undoButton = h('button', { type: 'button', 'data-testid': 'undo', onclick: () => onUndo() }, t('common.undo'));
  const clearButton = h('button', { type: 'button', 'data-testid': 'clear', onclick: () => onClear() }, t('action.clear'));
  const actions = h('div', { class: 'lc-actions' }, removeButton, undoButton, clearButton);

  const levelSelect = h('select', { id: 'lc-level-select', 'data-testid': 'level-select' });
  const playButton = h('button', { type: 'button', 'data-testid': 'level-play', onclick: () => onChooseLevel() }, t('level.play'));
  const chooser = h('div', { class: 'wp-row lc-chooser' }, h('label', { for: 'lc-level-select' }, t('level.choose')), levelSelect, playButton);

  const help = h('div', { class: 'lc-help wp-muted' },
    h('p', { id: 'lc-help-keys' }, t('help.keys')),
    h('p', {}, t('help.touch')),
    h('p', {}, t('help.colours'))
  );
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'announcer' });
  const legend = h('ul', { class: 'lc-legend', 'aria-label': t('legend'), 'data-testid': 'legend', hidden: true });

  const container = h(
    'div',
    { class: `wp-laser-circuit${context.reducedMotion ? ' lc-reduced' : ''}`, dir: t.direction, lang: bcp47Tag(t.locale), onkeydown: (event: Event) => onKey(event as KeyboardEvent) },
    // The board comes first so the host's initial focus lands on a square.
    levelStatus,
    stats,
    status,
    board,
    inventory,
    actions,
    legend,
    chooser,
    help,
    live
  );

  const coords = (cell: number) => ({ row: Math.floor(cell / levelOf(state).width) + 1, col: (cell % levelOf(state).width) + 1 });

  /** (Re)creates squares, inventory buttons and the level list when the level changes. */
  const build = () => {
    const key = `${state.difficulty}/${state.level}`;
    if (key === builtKey) return;
    builtKey = key;
    const level = levelOf(state);
    disposeKeyboard();
    clear(board);
    board.style.setProperty('--lc-cols', String(level.width));
    cells = [];
    signatures = [];
    for (let cell = 0; cell < level.cells.length; cell++) {
      const button = h('button', {
        type: 'button',
        class: 'lc-cell',
        tabindex: cell === 0 ? 0 : -1,
        'data-cell': cell,
        'data-testid': `cell-${Math.floor(cell / level.width)}-${cell % level.width}`
      });
      cells.push(button);
      signatures.push('');
    }
    board.append(...cells);
    disposeKeyboard = gridKeyboard(board, level.width);

    clear(inventory);
    inventoryButtons.clear();
    for (const kind of PIECE_KINDS) {
      if (level.inventory[kind] === 0) continue;
      const button = h('button', { type: 'button', class: 'lc-inv', 'data-testid': `inv-${kind}`, 'data-kind': kind, onclick: () => select(kind) },
        pieceIcon(kind),
        h('span', { class: 'lc-inv-name' }, pieceName(kind)),
        h('span', { class: 'lc-inv-count', 'aria-hidden': 'true' })
      );
      inventoryButtons.set(kind, button);
      inventory.append(button);
    }
    selected = PIECE_KINDS.find((kind) => level.inventory[kind] > 0) ?? 'mirror';
    removeMode = false;

    optics = hasOptics(level);
    clear(legend);
    const present = new Set(levelElements(level).flatMap(legendKinds));
    for (const kind of LEGEND_KINDS) {
      if (!present.has(kind)) continue;
      legend.append(
        h('li', { class: 'lc-legend-item', 'data-kind': kind },
          svg('svg', { viewBox: '0 0 100 100', class: 'lc-legend-icon', 'aria-hidden': 'true', focusable: 'false' }, ...elementGlyph(LEGEND_SAMPLE[kind], false, 0)),
          h('span', {}, t(`legend.${kind}`))
        )
      );
    }
    if (optics) legend.append(h('li', { class: 'lc-legend-item lc-legend-note', 'data-kind': 'optics' }, h('span', {}, t('legend.optics'))));
    legend.hidden = legend.childElementCount === 0;

    const count = levelCount(state.difficulty);
    clear(levelSelect);
    for (let i = 0; i < count; i++) levelSelect.append(h('option', { value: i }, t('level.option', { n: i + 1 })));
    levelSelect.value = String(state.level);
  };

  const pieceIcon = (kind: PieceKind) =>
    svg('svg', { viewBox: '0 0 100 100', class: 'lc-inv-icon', 'aria-hidden': 'true', focusable: 'false' }, ...elementGlyph(pieceElement(kind, 0), true, 0));

  /** What a target needs, with intensity and polarisation when it asks for them. */
  const needText = (element: Extract<BoardElement, { kind: 'target' }>) => {
    const details: string[] = [];
    if (element.level !== undefined) details.push(t('light.intensity', { value: fractionText(intensityOf(element.level)) }));
    if (element.pol !== undefined) details.push(t('light.polarised', { angle: angleDegrees(element.pol) }));
    return withDetails(colourName(element.colour), details);
  };

  const describe = (element: BoardElement, placed: boolean, got: number, arrivals: readonly Arrival[], ok: boolean): string => {
    switch (element.kind) {
      case 'empty':
        return got === 0 ? t('el.empty') : t('el.emptyLit', { colour: lightText(got, arrivals) });
      case 'emitter':
        return t('el.emitter', { colour: colourName(element.colour), dir: t(DIR_KEY[element.dir]) });
      case 'mirror':
        return t(placed ? 'el.yourMirror' : 'el.mirror', { orient: t(ORIENT_KEY[element.orient]) });
      case 'splitter':
        return t(placed ? 'el.yourSplitter' : 'el.splitter', { orient: t(ORIENT_KEY[element.orient]) });
      case 'blocker':
        return t(placed ? 'el.yourBlocker' : 'el.blocker');
      case 'filter':
        return t(placed ? 'el.yourFilter' : 'el.filter', { colour: colourName(element.colour) });
      case 'absorber':
        return t(placed ? 'el.yourAbsorber' : 'el.absorber', { colour: colourName(element.colour) });
      case 'neutral':
        return t(placed ? 'el.yourNeutral' : 'el.neutral');
      case 'polariser':
        return t(placed ? 'el.yourPolariser' : 'el.polariser', { orient: angleText(element.angle) });
      case 'target':
        return ok ? t('el.targetOk', { need: needText(element) }) : t('el.target', { need: needText(element), got: lightText(got, arrivals) });
      case 'sensor':
        return got === 0 ? t('el.sensor') : t('el.sensorLit', { colour: colourName(got) });
      case 'gate':
        return t('el.gate', { dir: t(DIR_KEY[element.dir]) });
      case 'portal':
        return t('el.portal', { n: element.pair });
    }
  };

  const renderCells = (boardNow: Board, trace: BeamTrace, result: Evaluation) => {
    const okTargets = new Set(result.targets.filter((target) => target.ok).map((target) => target.cell));
    boardNow.cells.forEach((element, cell) => {
      const button = cells[cell] as HTMLButtonElement;
      const placed = !!pieceAt(state, cell);
      const got = trace.lit[cell] ?? 0;
      const arrivals = trace.arrivals[cell] ?? [];
      const ok = okTargets.has(cell);
      const sides = `${trace.sides.slice(cell * 4, cell * 4 + 4).join('')}/${trace.sideLevels.slice(cell * 4, cell * 4 + 4).join(',')}`;
      const light = optics ? JSON.stringify(arrivals) : '';
      const signature = `${JSON.stringify(element)}|${placed}|${got}|${ok}|${sides}|${light}|${t.locale}`;
      if (signatures[cell] === signature) return;
      signatures[cell] = signature;
      button.dataset.element = element.kind;
      button.dataset.lit = colourLetter(got);
      button.dataset.placed = String(placed);
      if ('orient' in element) button.dataset.orient = String(element.orient);
      else if (element.kind === 'polariser') button.dataset.orient = String(element.angle);
      else delete button.dataset.orient;
      if (element.kind === 'target') button.dataset.ok = String(ok);
      else delete button.dataset.ok;
      button.setAttribute('aria-label', t('cell.label', { ...coords(cell), content: describe(element, placed, got, arrivals, ok) }));
      button.replaceChildren(
        svg('svg', { viewBox: '0 0 100 100', class: 'lc-glyph', 'aria-hidden': 'true', focusable: 'false' },
          svg('g', { class: 'lc-beams' }, ...beamLines(trace, cell)),
          svg('g', { class: 'lc-element' }, ...elementGlyph(element, placed, got, ok))
        )
      );
    });
  };

  const render = () => {
    build();
    const boardNow = boardOf(state);
    const trace = traceBeams(boardNow);
    const result = evaluate(boardNow, trace);
    renderCells(boardNow, trace, result);

    levelStatus.textContent = t(state.difficulty === 'intro' ? 'level.statusIntro' : 'level.status', { n: state.level + 1, total: levelCount(state.difficulty) });
    targetsStat.textContent = t('stats.targets', { done: result.correct, total: result.targets.length });
    targetsStat.dataset.value = String(result.correct);
    movesStat.textContent = t('stats.moves', { n: state.moves });
    movesStat.dataset.value = String(state.moves);
    container.dataset.solved = String(result.solved);

    if (result.solved) {
      status.hidden = false;
      status.textContent = t('status.solved', { moves: state.moves });
    } else if (result.litSensors.length > 0) {
      status.hidden = false;
      status.textContent = t('status.sensorLit');
    } else {
      status.hidden = true;
      status.textContent = '';
    }
    status.dataset.state = result.solved ? 'solved' : result.litSensors.length > 0 ? 'warning' : 'playing';

    if (state.pieces.length === 0) removeMode = false;
    for (const [kind, button] of inventoryButtons) {
      const left = remaining(state, kind);
      button.dataset.count = String(left);
      button.setAttribute('aria-pressed', String(kind === selected && !removeMode));
      button.setAttribute('aria-label', t('inv.label', { piece: pieceName(kind), n: left }));
      button.disabled = result.solved;
      (button.querySelector('.lc-inv-count') as HTMLElement).textContent = t('inv.count', { n: left });
    }
    removeButton.setAttribute('aria-pressed', String(removeMode));
    removeButton.disabled = result.solved || state.pieces.length === 0;
    undoButton.disabled = !canUndo(state);
    clearButton.disabled = !canClear(state);
  };

  const progressText = (result: Evaluation) => {
    const parts = [t('stats.targets', { done: result.correct, total: result.targets.length }) + '.'];
    if (result.litSensors.length > 0) parts.push(t('status.sensorLit'));
    return parts.join(' ');
  };

  /** Applies a new state; returns false when nothing changed. */
  const commit = (next: LaserState, message: string): boolean => {
    if (next === state) return false;
    const wasSolved = evaluate(boardOf(state)).solved;
    state = next;
    render();
    context.requestSave();
    const result = evaluate(boardOf(state));
    if (result.solved && !wasSolved) {
      announce(live, `${message} ${t('status.solved', { moves: state.moves })}`);
      context.finished({ outcome: 'completed', stats: { moves: state.moves } });
    } else {
      announce(live, `${message} ${progressText(result)}`);
    }
    return true;
  };

  const solvedNow = () => evaluate(boardOf(state)).solved;

  const select = (kind: PieceKind) => {
    if (paused || !inventoryButtons.has(kind)) return;
    selected = kind;
    removeMode = false;
    render();
    announce(live, t('announce.selected', { piece: pieceName(kind), n: remaining(state, kind) }));
  };

  const toggleRemoveMode = () => {
    if (paused || solvedNow()) return;
    removeMode = !removeMode && state.pieces.length > 0;
    render();
    announce(live, t(removeMode ? 'announce.removeOn' : 'announce.removeOff'));
  };

  const place = (cell: number) => {
    const element = levelOf(state).cells[cell];
    if (element?.kind !== 'empty') {
      announce(live, t('announce.fixed'));
      return;
    }
    if (remaining(state, selected) === 0) {
      const other = PIECE_KINDS.find((kind) => remaining(state, kind) > 0);
      if (!other) {
        announce(live, t('announce.allPlaced'));
        return;
      }
      selected = other;
    }
    const kind = selected;
    const next = placePiece(state, cell, kind);
    // Move the selection on to a piece that is still available.
    if (remaining(next, kind) === 0) selected = PIECE_KINDS.find((other) => remaining(next, other) > 0) ?? kind;
    commit(next, t('announce.placed', { piece: pieceName(kind), ...coords(cell) }));
  };

  const rotate = (cell: number) => {
    const piece = pieceAt(state, cell);
    if (!piece) {
      announce(live, t(levelOf(state).cells[cell]?.kind === 'empty' ? 'announce.noPiece' : 'announce.fixed'));
      return;
    }
    if (orientationCount(piece.kind) === 1) {
      announce(live, piece.kind === 'blocker' ? t('announce.noTurn') : t('announce.noTurnPiece', { piece: pieceName(piece.kind) }));
      return;
    }
    const next = rotatePiece(state, cell);
    const orient = pieceAt(next, cell)?.orient ?? 0;
    const orientText = piece.kind === 'polariser' ? angleText(orient as Angle) : t(ORIENT_KEY[orient === 1 ? 1 : 0]);
    commit(next, t('announce.rotated', { piece: pieceName(piece.kind), ...coords(cell), orient: orientText }));
  };

  const remove = (cell: number) => {
    const piece = pieceAt(state, cell);
    if (!piece) {
      announce(live, t(levelOf(state).cells[cell]?.kind === 'empty' ? 'announce.noPiece' : 'announce.fixed'));
      return;
    }
    commit(removePiece(state, cell), t('announce.removed', { piece: pieceName(piece.kind), ...coords(cell) }));
  };

  /** Tap/click/Enter on a square: remove (Remove mode), turn a placed piece, or place the selected piece. */
  const activate = (cell: number) => {
    if (paused || solvedNow()) return;
    if (pieceAt(state, cell)) {
      if (removeMode) remove(cell);
      else rotate(cell);
    } else place(cell);
  };

  const cellFromEvent = (event: Event): number | null => {
    const button = (event.target as Element | null)?.closest<HTMLElement>('.lc-cell');
    if (!button || !board.contains(button)) return null;
    return Number(button.dataset.cell);
  };

  const focusCell = (cell: number) => {
    for (const button of cells) button.tabIndex = -1;
    const button = cells[cell];
    if (!button) return;
    button.tabIndex = 0;
    button.focus({ preventScroll: true });
  };

  const onBoardClick = (event: Event) => {
    const cell = cellFromEvent(event);
    if (cell === null) return;
    if (suppressClick) {
      suppressClick = false;
      return;
    }
    focusCell(cell);
    activate(cell);
  };

  const onContextMenu = (event: Event) => {
    const cell = cellFromEvent(event);
    if (cell === null || !pieceAt(state, cell)) return;
    event.preventDefault();
    cancelPress();
    if (!paused && !solvedNow()) remove(cell);
  };

  const cancelPress = () => {
    if (pressTimer !== undefined) clearTimeout(pressTimer);
    pressTimer = undefined;
  };

  const onPointerDown = (event: PointerEvent) => {
    cancelPress();
    suppressClick = false;
    if (event.button !== 0 || event.pointerType === 'mouse') return;
    const cell = cellFromEvent(event);
    if (cell === null || !pieceAt(state, cell)) return;
    pressStart = { x: event.clientX, y: event.clientY };
    pressTimer = setTimeout(() => {
      pressTimer = undefined;
      if (paused || solvedNow() || !pieceAt(state, cell)) return;
      suppressClick = true;
      remove(cell);
    }, LONG_PRESS_MS);
  };

  /** A finger that slides away is not a long press. */
  const onPointerMove = (event: PointerEvent) => {
    if (pressTimer !== undefined && Math.hypot(event.clientX - pressStart.x, event.clientY - pressStart.y) > 12) cancelPress();
  };

  const onUndo = () => {
    if (paused) return;
    commit(undo(state), t('announce.undone'));
  };

  const onClear = () => {
    if (paused) return;
    commit(clearBoard(state), t('announce.cleared'));
  };

  const onChooseLevel = () => {
    if (paused) return;
    const index = Number(levelSelect.value);
    commit(chooseLevel(state, index), t('announce.level', { n: index + 1, total: levelCount(state.difficulty) }));
  };

  const onKey = (event: KeyboardEvent) => {
    if (paused || event.altKey) return;
    const target = event.target as HTMLElement | null;
    if (target instanceof HTMLSelectElement || target instanceof HTMLInputElement) return;
    if (event.ctrlKey || event.metaKey) {
      if (event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault();
        onUndo();
      }
      return;
    }
    const key = event.key.toLowerCase();
    if (key === 'u') {
      event.preventDefault();
      onUndo();
      return;
    }
    const slot = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].indexOf(event.key);
    if (slot >= 0) {
      const kind = [...inventoryButtons.keys()][slot];
      if (kind) {
        event.preventDefault();
        select(kind);
      }
      return;
    }
    const cellButton = target?.closest?.<HTMLElement>('.lc-cell');
    if (!cellButton || !board.contains(cellButton)) return;
    const cell = Number(cellButton.dataset.cell);
    if (solvedNow()) return;
    if (key === 'p') {
      event.preventDefault();
      if (pieceAt(state, cell)) announce(live, t('announce.occupied'));
      else place(cell);
    } else if (key === 'r') {
      event.preventDefault();
      rotate(cell);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      remove(cell);
    }
  };

  const show = (next: LaserState) => {
    cancelPress();
    state = next;
    if (!container.isConnected) root.appendChild(container);
    builtKey = '';
    render();
  };

  return {
    newGame(options: NewGameOptions) {
      show(createInitialState(options.seed, toDifficulty(options.difficulty)));
    },
    restore(saved: LaserState) {
      show(cloneState(saved));
      // Keep the host's difficulty select in step with the save (old saves name their sets differently).
      if (isSelectable(state.difficulty)) context.setDifficulty?.(state.difficulty);
    },
    serialize: () => cloneState(state),
    pause() {
      paused = true;
      cancelPress();
    },
    resume() {
      paused = false;
    },
    reset() {
      show(resetState(state));
      context.requestSave();
    },
    dispose() {
      cancelPress();
      disposeKeyboard();
      clear(root);
    }
  };
}
