import type { GameContext, GameInstance, GameResult, NewGameOptions } from '@wp/game-core';
import { isOneOf, normalizeSeed } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import { computerReply, evaluatePosition, explainMove, playTurn, puzzleHint, puzzleTurn, suggestMove, type Evaluation, type Reason } from './ai';
import { GLYPH, OUTLINE, createBoard, createPromotion, figurine, renderMoveList } from './board';
import {
  COLOR_CHOICES,
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  FLAG_CASTLE_K,
  FLAG_CASTLE_Q,
  FLAG_EP,
  PAWN,
  canUndo,
  colorChoiceOf,
  colorOfSide,
  createGame,
  createVariation,
  kingSquare,
  legalMoves,
  makeMove,
  moveFlag,
  moveFrom,
  movePromo,
  moveTo,
  moveToUci,
  MATE_LENGTHS,
  MODES,
  OPPONENTS,
  nextSeed,
  parseFen,
  puzzleOf,
  puzzlesFor,
  replay,
  resign,
  squareName,
  stateOutcome,
  toFen,
  toSan,
  undo,
  variationFlip,
  variationPlay,
  variationReset,
  variationStep,
  variationView,
  type ChessState,
  type Color,
  type ColorChoice,
  type GameOptions,
  type Outcome,
  type Position,
  type Replay,
  type Variation
} from './rules';
import './styles.css';

export { figurine } from './board';

/** Short pause before the computer's reply becomes visible (skipped with reduced motion). */
export const COMPUTER_REVEAL_MS = 450;

/** What the menu offers: the two ways to play a game, and the two puzzle modes. */
export const CHOICES = ['computer', 'human', 'best', 'mate'] as const;
export type Choice = (typeof CHOICES)[number];
/** Small symbols next to the menu labels (decorative; the text carries the meaning). */
const CHOICE_ICON: Record<Choice, string> = { computer: '⚙︎', human: '♔♚', best: '★', mate: '#' };
/** Colour choices: outline king, solid king, a die for "random". */
const COLOR_ICON: Record<ColorChoice, string> = { w: OUTLINE[6], b: GLYPH[6], random: '⚄︎' };
/** The menu entry describing a game. */
export const choiceOf = (state: ChessState): Choice => (state.mode === 'play' ? state.opponent : state.mode);
/** Unique radio-group names when several boards share one document. */
let instanceCount = 0;

const cloneVariation = (v: Variation): Variation => ({ ...v, moves: [...v.moves] });
const cloneState = (state: ChessState): ChessState => ({
  ...state,
  moves: [...state.moves],
  ...(state.variation ? { variation: cloneVariation(state.variation) } : {})
});
const optionsOf = (state: ChessState): GameOptions => ({
  seed: state.seed,
  difficulty: state.difficulty,
  opponent: state.opponent,
  humanColor: colorChoiceOf(state),
  start: state.start,
  mode: state.mode,
  mateN: state.mateN,
  puzzle: state.puzzle
});

/** Starts a game, including the computer's first move when it plays white. */
export const startGame = (options: GameOptions): ChessState => computerReply(createGame(options));

const isOver = (outcome: Outcome) => outcome.kind !== 'playing';
/** Bidirectional isolation for numbers and notation inside translated (possibly RTL) sentences. */
const isolate = (text: string) => `⁦${text}⁩`;

/** "+1.25" / "−0.40" (pawns, White's view) or "#3" / "#−3" for a forced mate. */
export function formatEvaluation(evaluation: Pick<Evaluation, 'white' | 'mate'>): string {
  if (evaluation.mate !== 0) return `#${evaluation.mate < 0 ? '−' : ''}${Math.abs(evaluation.mate)}`;
  const pawns = evaluation.white / 100;
  return `${pawns < 0 ? '−' : '+'}${Math.abs(pawns).toFixed(2)}`;
}

export function createChess(context: GameContext): GameInstance<ChessState> {
  const { t, root } = context;
  // Menu choices remembered on this device (opponent, colour, mode, mate length): after a reload the next
  // "New game" starts in the same kind of game. Read defensively; anything unexpected is ignored.
  const remembered = ((): Partial<GameOptions> => {
    const raw = context.preferences?.get('menu');
    if (typeof raw !== 'object' || raw === null) return {};
    const r = raw as Record<string, unknown>;
    return {
      ...(isOneOf(r.opponent, OPPONENTS) ? { opponent: r.opponent } : {}),
      ...(isOneOf(r.humanColor, COLOR_CHOICES) ? { humanColor: r.humanColor } : {}),
      ...(isOneOf(r.mode, MODES) ? { mode: r.mode } : {}),
      ...(isOneOf(r.mateN, MATE_LENGTHS) ? { mateN: r.mateN } : {})
    };
  })();
  /** The person's colour choice for games against the computer (kept while puzzles or two-player games run). */
  let colorPref: ColorChoice = remembered.humanColor ?? 'w';
  let state: ChessState = startGame({ seed: 0, difficulty: DEFAULT_DIFFICULTY, opponent: 'computer', humanColor: 'w', puzzle: 0, ...remembered });
  /** Number of plies drawn; lags behind `state.moves` only while the computer's reply is revealed. */
  let shown = 0;
  /** The person's move while the computer is still to answer (never saved; see `flushPending`). */
  let pending: string | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pendingAnnouncement = '';
  let selected = -1;
  let cursor = 12; // e2
  let orientation: Color = 'w';
  let promotion: { from: number; to: number } | null = null;
  let hint: { move: number; reasons: Reason[] } | null = null;
  /** Explanation panel: "Why?" for the computer's move, or why a puzzle attempt fails. */
  let note: { title: string; reasons: Reason[] } | null = null;
  let confirmResign = false;
  let confirmStart = false;
  let view: Replay = replay(state.start, state.moves)!;

  /* Variation board (transient UI; the line itself lives in `state.variation`). */
  let varSelected = -1;
  let varCursor = 12;
  let varPromotion: { from: number; to: number } | null = null;
  let varEngine: { evaluation: Evaluation; text: string } | null = null;
  /** Asking whether to show the engine's suggestion while a puzzle is unsolved. */
  let confirmSolution = false;
  /** The person agreed to see engine suggestions for this puzzle (reset with every new puzzle). */
  let solutionOk = false;
  let varView: Replay | null = null;

  /* ---------- DOM ---------- */
  const status = h('p', { class: 'wp-status ch-status', 'data-testid': 'status' });
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'announcer' });

  const mainBoard = createBoard({
    t,
    label: t('board'),
    prefix: '',
    onSquare: (sq) => onSquare(sq),
    onFocus: (sq) => {
      cursor = sq;
    },
    canDrag: (sq) => {
      const mover = controllable();
      const piece = view.pos.board[sq]!;
      return mover !== null && piece !== 0 && (piece > 0 ? 'w' : 'b') === mover;
    },
    onDrop: (from, to) => {
      if (promotion) return;
      selected = from;
      onSquare(to);
    }
  });
  const squares = mainBoard.squares;
  const board = mainBoard.element;

  const button = (id: string, label: string, onclick: () => void, extra: Record<string, string> = {}) => h('button', { type: 'button', 'data-testid': id, onclick, ...extra }, label);
  const undoButton = button('undo', t('common.undo'), () => onUndo());
  const hintButton = button('hint', t('common.hint'), () => onHint());
  const whyButton = button('why', t('why'), () => onWhy());
  const flipButton = button('flip', t('flip'), () => {
    orientation = orientation === 'w' ? 'b' : 'w';
    render();
    announce(live, t(orientation === 'w' ? 'flipped.w' : 'flipped.b'));
  });
  const nextButton = button('next-puzzle', t('puzzle.next'), () => startFresh({ ...optionsOf(state), puzzle: state.puzzle + 1 }));
  const variationButton = button('variation-open', t('variation.open'), () => openVariation());
  const resignButton = button('resign', t('resign'), () => {
    confirmResign = true;
    render();
    resignYes.focus();
  });
  const resignYes = button('resign-yes', t('resign.yes'), () => onResign());
  const resignNo = button('resign-no', t('resign.no'), () => {
    confirmResign = false;
    render();
    resignButton.focus();
  });
  const resignConfirm = h('div', { class: 'ch-confirm', role: 'group', 'aria-label': t('resign.confirm') }, h('span', {}, t('resign.confirm')), resignYes, resignNo);

  const promo = createPromotion(t, '', (type) => onPromote(type), () => closePromotion());
  const promoDialog = promo.element;

  const explanation = h('div', { class: 'ch-explain', 'data-testid': 'explanation', 'aria-live': 'polite', hidden: true });
  const moveList = h('ol', { class: 'ch-moves', 'data-testid': 'move-list', 'aria-label': t('common.moves') });

  /* What to play: an always-visible menu above the board. Choosing an option only changes the
     selection (radio semantics: arrow keys move the choice); "Start" begins the new game and asks
     first when an unfinished game with own moves would be replaced. */
  const groupName = `ch-${++instanceCount}`;
  const radioGroup = <V extends string>(name: string, legend: string, values: readonly V[], label: (value: V) => string, icon?: (value: V) => string) => {
    const inputs = values.map((value) =>
      h('input', { type: 'radio', class: 'ch-seg-input', name: `${groupName}-${name}`, value, 'data-testid': `${name}-${value}`, onchange: () => onMenuChange() })
    );
    const fieldset = h(
      'fieldset',
      { class: `ch-seg ch-seg-${name}`, 'data-testid': `menu-${name}` },
      h('legend', {}, legend),
      h(
        'div',
        { class: 'ch-seg-options' },
        ...values.map((value, i) =>
          h(
            'label',
            { class: 'ch-seg-option', 'data-value': value },
            inputs[i]!,
            h(
              'span',
              { class: 'ch-seg-body' },
              icon && h('span', { class: 'ch-seg-icon', 'aria-hidden': 'true' }, icon(value)),
              h('span', { class: 'ch-seg-text' }, label(value))
            )
          )
        )
      )
    );
    return {
      fieldset,
      inputs,
      value: (): V | undefined => values[inputs.findIndex((input) => input.checked)],
      set: (value: V) => inputs.forEach((input, i) => (input.checked = values[i] === value)),
      focus: () => (inputs.find((input) => input.checked) ?? inputs[0])!.focus()
    };
  };
  const modeGroup = radioGroup('mode', t('menu.legend'), CHOICES, (v) => t(v === 'best' || v === 'mate' ? `mode.${v}` : `menu.${v}`), (v) => CHOICE_ICON[v]);
  const strengthGroup = radioGroup('strength', t('strength'), DIFFICULTIES, (v) => t(`difficulty.${v}`));
  const colorGroup = radioGroup('color', t('yourColor'), COLOR_CHOICES, (v) => t(`color.${v}`), (v) => COLOR_ICON[v]);
  const mateGroup = radioGroup('mate', t('mateN'), MATE_LENGTHS.map(String), (v) => v);
  // The active game's mode carries a visible text badge (not only a colour).
  const currentBadges = modeGroup.inputs.map((input) => {
    const badge = h('span', { class: 'ch-seg-current', 'data-testid': `current-${input.value}` }, t('menu.current'));
    input.parentElement!.append(badge);
    return badge;
  });
  const startButton = h('button', { type: 'button', class: 'primary ch-start', 'data-testid': 'start', onclick: () => onStart() }, t('start'));
  const startYes = button('start-yes', t('menu.confirm.yes'), () => {
    confirmStart = false;
    startChosen();
  });
  const startNo = button('start-no', t('menu.confirm.no'), () => closeStartConfirm());
  const startConfirm = h(
    'div',
    { class: 'ch-confirm', role: 'group', 'aria-label': t('menu.confirm'), 'data-testid': 'start-confirm', hidden: true },
    h('span', {}, t('menu.confirm')),
    startYes,
    startNo
  );
  startConfirm.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeStartConfirm();
    }
  });
  const menu = h(
    'section',
    { class: 'ch-menu', 'aria-label': t('menu.legend'), 'data-testid': 'menu' },
    modeGroup.fieldset,
    h('div', { class: 'ch-menu-options' }, strengthGroup.fieldset, colorGroup.fieldset, mateGroup.fieldset, startButton),
    startConfirm
  );

  const modeLine = h('p', { class: 'ch-mode', 'data-testid': 'mode' });

  /* ---------- Variation board DOM ---------- */
  const varBoard = createBoard({
    t,
    label: t('variation.title'),
    prefix: 'var-',
    onSquare: (sq) => onVarSquare(sq),
    onFocus: (sq) => {
      varCursor = sq;
    },
    canDrag: (sq) => {
      if (!varView || varView.status.kind !== 'playing') return false;
      const piece = varView.pos.board[sq]!;
      return piece !== 0 && (piece > 0 ? 1 : -1) === varView.pos.side;
    },
    onDrop: (from, to) => {
      if (varPromotion) return;
      varSelected = from;
      onVarSquare(to);
    }
  });
  const varPromo = createPromotion(t, 'var-', (type) => onVarPromote(type), () => closeVarPromotion());
  const varStatus = h('p', { class: 'ch-status ch-var-status', 'data-testid': 'var-status' });
  const varBack = button('var-back', t('variation.back'), () => stepVariation(-1), { class: 'ch-dir ch-dir-back' });
  const varForward = button('var-forward', t('variation.forward'), () => stepVariation(1), { class: 'ch-dir ch-dir-forward' });
  const varReset = button('var-reset', t('variation.reset'), () => resetVariation());
  const varFlip = button('var-flip', t('flip'), () => flipVariation());
  const varEngineButton = button('var-engine', t('variation.engine'), () => onEngine());
  const solutionYes = button('var-solution-yes', t('variation.solution.yes'), () => {
    confirmSolution = false;
    solutionOk = true;
    showEngine();
  });
  const solutionNo = button('var-solution-no', t('cancel'), () => {
    confirmSolution = false;
    render();
    varEngineButton.focus();
  });
  const solutionConfirm = h(
    'div',
    { class: 'ch-confirm', role: 'group', 'aria-label': t('variation.solution'), 'data-testid': 'var-solution-confirm', hidden: true },
    h('span', {}, t('variation.solution')),
    solutionYes,
    solutionNo
  );
  solutionConfirm.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      solutionNo.click();
    }
  });
  const varEngineBox = h('div', { class: 'ch-explain', 'data-testid': 'var-engine-result', hidden: true });
  const varMoveList = h('ol', { class: 'ch-moves', 'data-testid': 'var-move-list', 'aria-label': t('variation.moves') });
  const varClose = h('button', { type: 'button', class: 'primary ch-var-close', 'data-testid': 'var-close', onclick: () => closeVariation() }, t('variation.close'));
  const varHeadingId = `${groupName}-var`;
  const variationSection = h(
    'section',
    { class: 'ch-variation', 'aria-labelledby': varHeadingId, 'data-testid': 'variation', hidden: true },
    h('div', { class: 'ch-var-head' }, h('h3', { id: varHeadingId }, t('variation.title')), varClose),
    h('p', { class: 'ch-var-note' }, t('variation.note')),
    varStatus,
    h('div', { class: 'ch-board-wrap' }, varBoard.element, varPromo.element),
    h('div', { class: 'ch-actions' }, varBack, varForward, varReset, varFlip, varEngineButton),
    solutionConfirm,
    varEngineBox,
    h('section', { class: 'ch-history', 'aria-label': t('variation.moves') }, h('h4', {}, t('variation.moves')), varMoveList)
  );

  const main = h(
    'div',
    { class: 'ch-main' },
    status,
    h('div', { class: 'ch-board-wrap' }, board, promoDialog),
    h('div', { class: 'ch-actions' }, undoButton, hintButton, whyButton, flipButton, resignButton, nextButton, variationButton),
    resignConfirm,
    explanation,
    h('section', { class: 'ch-history', 'aria-label': t('common.moves') }, h('h3', {}, t('common.moves')), moveList)
  );

  const container = h(
    'div',
    { class: `wp-chess${context.reducedMotion ? ' ch-reduced' : ''}`, dir: t.direction },
    menu,
    modeLine,
    h('div', { class: 'ch-stage' }, main, variationSection),
    live
  );
  root.append(container);

  /* ---------- Helpers ---------- */
  const displayed = (): string[] => (pending ? [...state.moves, pending] : state.moves.slice(0, shown));
  const busy = () => pending !== null || shown < state.moves.length;
  const outcomeNow = () => stateOutcome(state, view);
  const puzzleMode = () => state.mode !== 'play';
  /** The colour the person at the device may move now, or null. */
  const controllable = (): Color | null => {
    if (busy() || isOver(outcomeNow())) return null;
    const turn = colorOfSide(view.pos.side);
    if (state.opponent === 'computer' && turn !== state.humanColor) return null;
    return turn;
  };

  const pieceName = (piece: number) => t(`piece.${Math.abs(piece)}`);
  const colorName = (piece: number) => t(piece > 0 ? 'color.w' : 'color.b');

  const reasonText = (reason: Reason): string =>
    t(reason.key, {
      piece: reason.piece ? t(`piece.${reason.piece}`) : '',
      square: reason.square !== undefined ? squareName(reason.square) : '',
      n: reason.n ?? 0
    });

  /** Spoken description of a move played in `pos` (before the move). */
  const describe = (pos: Position, move: number): string => {
    const from = moveFrom(move);
    const to = moveTo(move);
    const piece = pos.board[from]!;
    const color = colorName(piece);
    const flag = moveFlag(move);
    let text: string;
    if (flag === FLAG_CASTLE_K) text = t('say.castleK', { color });
    else if (flag === FLAG_CASTLE_Q) text = t('say.castleQ', { color });
    else {
      const captured = flag === FLAG_EP ? PAWN : Math.abs(pos.board[to]!);
      const params = { color, piece: pieceName(piece), from: squareName(from), to: squareName(to), captured: captured ? t(`piece.${captured}`) : '' };
      text = t(captured ? 'say.capture' : 'say.move', params);
    }
    const promo = movePromo(move);
    if (promo) text += ` ${t('say.promote', { piece: t(`piece.${promo}`) })}`;
    return text;
  };

  const describeMoves = (from: number, moves: readonly string[], start = state.start): string => {
    const game = replay(start, moves.slice(0, from));
    if (!game) return '';
    const pos = game.pos;
    const parts: string[] = [];
    for (const uci of moves.slice(from)) {
      const move = legalMoves(pos).find((m) => moveToUci(m) === uci);
      if (!move) break;
      parts.push(describe(pos, move));
      makeMove(pos, move);
    }
    return parts.join(' ');
  };

  /** Moves of the person in the current best-move line: [made so far + 1, total]; total 1 for single-move puzzles. */
  const lineProgress = (): { step: number; total: number } => {
    const line = puzzleOf(state)?.line ?? [];
    return { step: Math.floor(state.moves.length / 2) + 1, total: (line.length + 1) / 2 };
  };

  const statusText = (outcome: Outcome): string => {
    if (busy()) return t('common.thinking');
    switch (outcome.kind) {
      case 'solved':
        return state.moves.length > 1 ? t('puzzle.solved.line') : t('puzzle.solved');
      case 'checkmate':
        return puzzleMode() ? t('puzzle.mated') : t(`end.checkmate.${outcome.winner}`);
      case 'resigned':
        return t(`end.resigned.${outcome.winner === 'w' ? 'b' : 'w'}`);
      case 'draw':
        return t(`end.${outcome.reason}`);
      default: {
        if (state.mode === 'best') {
          const { step, total } = lineProgress();
          const task = t(`puzzle.best.task.${state.humanColor}`);
          return total > 1 ? `${task} ${t('puzzle.step', { n: step, total })}` : task;
        }
        if (state.mode === 'mate') return t(`puzzle.mate.task.${state.humanColor}`, { left: state.mateN - state.moves.length / 2 });
        const turn = state.opponent === 'computer' ? t(`turn.you.${state.humanColor}`) : t(`turn.${outcome.turn}`);
        return outcome.check ? `${t('check')} ${turn}` : turn;
      }
    }
  };

  /** Status of a position on the variation board. */
  const varStatusText = (game: Replay, variation: Variation): string => {
    const where = variation.moves.length === 0 ? t('variation.start') : t('variation.progress', { n: variation.cursor, total: variation.moves.length });
    const s = game.status;
    let what: string;
    if (s.kind === 'checkmate') what = t(`end.checkmate.${s.winner}`);
    else if (s.kind === 'draw') what = t(`end.${s.reason}`);
    else what = s.check ? `${t('check')} ${t(`turn.${colorOfSide(game.pos.side)}`)}` : t(`turn.${colorOfSide(game.pos.side)}`);
    return `${where} ${what}`;
  };

  const targetsOf = (pos: Position, from: number): Map<number, number[]> => {
    const targets = new Map<number, number[]>();
    if (from < 0) return targets;
    for (const m of legalMoves(pos)) {
      if (moveFrom(m) !== from) continue;
      const list = targets.get(moveTo(m)) ?? [];
      list.push(m);
      targets.set(moveTo(m), list);
    }
    return targets;
  };

  /* ---------- Rendering ---------- */
  function render(): void {
    view = replay(state.start, displayed()) ?? replay(state.start, [])!;
    const pos = view.pos;
    const outcome = outcomeNow();
    const mover = controllable();
    const lastMove = view.moves[view.moves.length - 1];
    const checked = (outcome.kind === 'playing' && outcome.check) || outcome.kind === 'checkmate' ? kingSquare(pos, pos.side) : -1;
    mainBoard.render({
      pos,
      orientation,
      selected: mover ? selected : -1,
      targets: mover ? targetsOf(pos, selected) : new Map(),
      last: lastMove ?? -1,
      checked,
      hint: hint ? hint.move : -1,
      cursor
    });

    renderMoveList(moveList, state.start, view.sans, t('noMoves'));

    status.textContent = statusText(outcome);
    container.dataset.outcome = outcome.kind;
    container.dataset.turn = colorOfSide(pos.side);
    container.dataset.orientation = orientation;
    board.setAttribute('aria-busy', String(busy()));

    const playing = !isOver(outcome);
    undoButton.disabled = busy() || !canUndo(state);
    hintButton.disabled = mover === null;
    const lastIsComputer = state.opponent === 'computer' && view.moves.length > 0 && !busy() && colorOfSide(view.pos.side) === state.humanColor;
    whyButton.hidden = state.opponent !== 'computer' || puzzleMode();
    whyButton.disabled = !lastIsComputer;
    resignButton.disabled = busy() || !playing;
    resignButton.hidden = confirmResign || puzzleMode();
    nextButton.hidden = !puzzleMode();
    variationButton.hidden = state.variation !== undefined;
    resignConfirm.hidden = !confirmResign || !playing;
    promoDialog.hidden = promotion === null;
    startConfirm.hidden = !confirmStart;
    startButton.hidden = confirmStart;

    if (hint || note) {
      explanation.hidden = false;
      const title = hint ? t('hint.title', { move: figurine(sanOf(hint.move)) }) : note!.title;
      const reasons = (hint ? hint.reasons : note!.reasons).map((r) => h('li', {}, reasonText(r)));
      explanation.replaceChildren(h('p', { class: 'ch-explain-title' }, title), h('ul', {}, ...reasons));
    } else {
      explanation.hidden = true;
      explanation.replaceChildren();
    }

    const list = puzzlesFor(state.mode, state.mateN);
    const colorText = t(`color.${state.humanColor}`);
    const level = t(`difficulty.${state.difficulty}`);
    const mode = puzzleMode()
      ? `${state.mode === 'mate' ? `${t('mateN')}: ${state.mateN}` : t('mode.best')} — ${t('puzzle.number', { n: state.puzzle + 1, total: list.length })}`
      : state.opponent === 'computer'
        ? t(state.colorRandom ? 'mode.computer.random' : 'mode.computer', { color: colorText, level })
        : t('mode.human');
    modeLine.textContent = mode;
    renderVariation();
  }

  function renderVariation(): void {
    const variation = state.variation;
    container.toggleAttribute('data-variation', variation !== undefined);
    variationSection.hidden = variation === undefined;
    if (!variation) {
      varView = null;
      return;
    }
    const game = variationView(variation);
    varView = game;
    const pos = game.pos;
    const playing = game.status.kind === 'playing';
    const lastMove = game.moves[game.moves.length - 1];
    const checked = game.status.kind === 'checkmate' || (game.status.kind === 'playing' && game.status.check) ? kingSquare(pos, pos.side) : -1;
    varBoard.render({
      pos,
      orientation: variation.orientation,
      selected: playing ? varSelected : -1,
      targets: playing ? targetsOf(pos, varSelected) : new Map(),
      last: lastMove ?? -1,
      checked,
      hint: varEngine ? varEngine.evaluation.move : -1,
      cursor: varCursor
    });
    const full = replay(variation.fen, variation.moves);
    renderMoveList(varMoveList, variation.fen, full ? full.sans : [], t('noMoves'), 'var-', variation.cursor);
    varStatus.textContent = varStatusText(game, variation);
    varBack.disabled = variation.cursor === 0;
    varForward.disabled = variation.cursor >= variation.moves.length;
    varReset.disabled = variation.moves.length === 0;
    varEngineButton.disabled = !playing;
    varEngineButton.hidden = confirmSolution;
    solutionConfirm.hidden = !confirmSolution;
    varPromo.element.hidden = varPromotion === null;
    if (varEngine) {
      varEngineBox.hidden = false;
      varEngineBox.textContent = varEngine.text;
    } else {
      varEngineBox.hidden = true;
      varEngineBox.textContent = '';
    }
  }

  const sanOf = (move: number): string => toSan(view.pos, move);

  /** Shows only the options that belong to the chosen menu entry. */
  function syncMenuFields(): void {
    const choice = modeGroup.value() ?? choiceOf(state);
    strengthGroup.fieldset.hidden = choice !== 'computer';
    colorGroup.fieldset.hidden = choice !== 'computer';
    mateGroup.fieldset.hidden = choice !== 'mate';
    const active = choiceOf(state);
    modeGroup.inputs.forEach((input, i) => {
      input.parentElement!.toggleAttribute('data-active', input.value === active);
      currentBadges[i]!.hidden = input.value !== active;
    });
  }

  /** Puts the menu back to the running game's settings. */
  function syncMenu(): void {
    modeGroup.set(choiceOf(state));
    strengthGroup.set(state.difficulty);
    // Puzzles and two-player games keep the person's own colour choice for games against the computer.
    if (state.mode === 'play' && state.opponent === 'computer') colorPref = colorChoiceOf(state);
    colorGroup.set(colorPref);
    mateGroup.set(String(state.mateN));
    confirmStart = false;
    syncMenuFields();
  }

  function onMenuChange(): void {
    confirmStart = false;
    syncMenuFields();
    render();
  }

  /** Whether starting now would throw away moves the person made in an unfinished game. */
  function hasProgress(): boolean {
    const game = replay(state.start, state.moves);
    if (!game || isOver(stateOutcome(state, game))) return false;
    const twoPlayers = state.mode === 'play' && state.opponent === 'human';
    const first = colorOfSide(parseFen(state.start)!.side);
    return state.moves.some((_, i) => twoPlayers || (i % 2 === 0 ? first : first === 'w' ? 'b' : 'w') === state.humanColor);
  }

  function onStart(): void {
    // Complete a move the computer is still answering, so the check below sees it.
    if (pending !== null) flushPending();
    if (timer !== undefined) showAll();
    if (hasProgress()) {
      confirmStart = true;
      render();
      startYes.focus();
      announce(live, t('menu.confirm'));
      return;
    }
    startChosen();
  }

  function closeStartConfirm(): void {
    confirmStart = false;
    render();
    startButton.focus();
  }

  function startChosen(): void {
    const choice = modeGroup.value() ?? choiceOf(state);
    const mode = choice === 'computer' || choice === 'human' ? 'play' : choice;
    const opponent = choice === 'human' ? 'human' : choice === 'computer' ? 'computer' : state.opponent;
    if (choice === 'computer') colorPref = colorGroup.value() ?? colorPref;
    const difficulty = choice === 'computer' ? (strengthGroup.value() ?? state.difficulty) : state.difficulty;
    const mateN = mode === 'mate' ? Number(mateGroup.value() ?? state.mateN) : state.mateN;
    // A fresh seed for every start from the menu (so "random" can draw a different colour).
    const seed = nextSeed(state.seed);
    // Same puzzle category: continue with the next puzzle; otherwise let the seed pick one.
    const puzzle = mode === state.mode && mateN === state.mateN ? state.puzzle + 1 : seed;
    startFresh({ seed, opponent, humanColor: colorPref, difficulty, mode, mateN, puzzle });
    context.preferences?.set('menu', { opponent, humanColor: colorPref, mode, mateN });
    // The strength chosen here is the game's difficulty now: keep the host's select and next round in line.
    if (choice === 'computer') context.setDifficulty?.(difficulty);
    squares[cursor]?.focus();
  }

  /* ---------- Transitions ---------- */
  const cancelTimer = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };

  const resultOf = (outcome: Outcome): GameResult => {
    const stats = { moves: Math.ceil(state.moves.length / 2) };
    if (outcome.kind === 'draw') return { outcome: 'draw', stats };
    if (outcome.kind === 'playing') return { outcome: 'completed', stats };
    // A solved puzzle (best line found, or the mate delivered) counts as a win.
    if (outcome.kind === 'solved' || puzzleMode()) return { outcome: 'won', stats };
    if (state.opponent === 'human') return { outcome: 'completed', stats };
    return { outcome: outcome.winner === state.humanColor ? 'won' : 'lost', stats };
  };

  /** Shows the whole logical state and speaks any queued announcement. */
  const showAll = () => {
    cancelTimer();
    shown = state.moves.length;
    render();
    if (pendingAnnouncement) announce(live, `${pendingAnnouncement} ${status.textContent ?? ''}`.trim());
    pendingAnnouncement = '';
  };

  const resetTransient = () => {
    selected = -1;
    promotion = null;
    hint = null;
    note = null;
    confirmResign = false;
    confirmStart = false;
  };

  const resetVariationTransient = () => {
    varSelected = -1;
    varPromotion = null;
    varEngine = null;
    confirmSolution = false;
  };

  /** Applies a new logical state: saves, reports a natural end once, then draws (optionally revealing from `revealFrom`). */
  const commit = (next: ChessState, announcement: string, revealFrom?: number) => {
    const before = replay(state.start, state.moves);
    const wasPlaying = before ? !isOver(stateOutcome(state, before)) : false;
    state = next;
    context.requestSave();
    const after = replay(state.start, state.moves)!;
    const outcome = stateOutcome(state, after);
    if (wasPlaying && isOver(outcome)) context.finished(resultOf(outcome));
    pendingAnnouncement = announcement;
    cancelTimer();
    if (revealFrom !== undefined && revealFrom < state.moves.length && !context.reducedMotion) {
      // The logical state already contains the computer's reply; only drawing it is delayed.
      shown = revealFrom;
      render();
      timer = setTimeout(showAll, COMPUTER_REVEAL_MS);
    } else showAll();
  };

  /** Computes the computer's answer to the pending move (if any) right now. */
  const flushPending = () => {
    if (pending === null) return;
    const uci = pending;
    pending = null;
    cancelTimer();
    const before = state.moves.length;
    const next = playTurn(state, uci);
    commit(next, describeMoves(before, next.moves), before + 1);
  };

  const play = (move: number) => {
    const uci = moveToUci(move);
    resetTransient();
    if (puzzleMode()) {
      const before = state.moves.length;
      const pos = view.pos;
      const san = figurine(toSan(pos, move));
      const turn = puzzleTurn(state, uci);
      if (!turn.correct) {
        note = { title: t('puzzle.wrong', { move: san }), reasons: [] };
        if (turn.refutation) {
          const after = replay(state.start, [...state.moves, uci])!;
          note = {
            title: `${t('puzzle.wrong', { move: san })} ${t('puzzle.refutation', { move: figurine(toSan(after.pos, turn.refutation)) })}`,
            reasons: explainMove(after.pos, turn.refutation)
          };
        }
        render();
        announce(live, explanation.textContent ?? '');
        return;
      }
      commit(turn.state, `${t('puzzle.correct')} ${describeMoves(before, turn.state.moves)}`, turn.state.moves.length > before + 1 ? before + 1 : undefined);
      return;
    }
    if (state.opponent === 'computer' && !context.reducedMotion) {
      // Draw the person's move first, then think (the move is only saved together with the reply).
      pending = uci;
      render();
      timer = setTimeout(flushPending, 30);
      return;
    }
    const before = state.moves.length;
    const next = playTurn(state, uci);
    commit(next, describeMoves(before, next.moves));
  };

  function onSquare(sq: number): void {
    cursor = sq;
    if (promotion) return;
    const mover = controllable();
    if (!mover) return;
    const pos = view.pos;
    if (selected >= 0) {
      const options = legalMoves(pos).filter((m) => moveFrom(m) === selected && moveTo(m) === sq);
      if (options.length > 1) {
        promotion = { from: selected, to: sq };
        render();
        promo.first.focus();
        return;
      }
      if (options.length === 1) {
        play(options[0]!);
        return;
      }
    }
    const piece = pos.board[sq]!;
    const own = piece !== 0 && (piece > 0 ? 'w' : 'b') === mover;
    if (own && sq !== selected) {
      selected = sq;
      render();
      const count = legalMoves(pos).filter((m) => moveFrom(m) === sq).length;
      announce(live, t('selected', { piece: pieceName(piece), square: squareName(sq), n: count }));
    } else {
      selected = -1;
      render();
    }
  }

  function onPromote(type: number): void {
    if (!promotion) return;
    const { from, to } = promotion;
    const move = legalMoves(view.pos).find((m) => moveFrom(m) === from && moveTo(m) === to && movePromo(m) === type);
    promotion = null;
    if (move) play(move);
    else render();
    squares[to]?.focus();
  }

  function closePromotion(): void {
    if (!promotion) return;
    const to = promotion.to;
    promotion = null;
    selected = -1;
    render();
    squares[to]?.focus();
  }

  function onUndo(): void {
    if (busy() || !canUndo(state)) return;
    resetTransient();
    commit(undo(state), t('undone'));
  }

  function onResign(): void {
    confirmResign = false;
    if (busy()) return;
    resetTransient();
    commit(resign(state), '');
  }

  function onHint(): void {
    if (!controllable()) return;
    const game = replay(state.start, state.moves)!;
    const move = puzzleMode() ? puzzleHint(state) : suggestMove(state);
    if (move === null) return;
    note = null;
    hint = { move, reasons: explainMove(game.pos, move) };
    render();
    announce(live, explanation.textContent ?? '');
  }

  function onWhy(): void {
    if (busy() || state.moves.length === 0) return;
    const prior = replay(state.start, state.moves.slice(0, -1));
    if (!prior) return;
    const move = view.moves[view.moves.length - 1]!;
    hint = null;
    note = { title: t('why.title', { move: figurine(view.sans[view.sans.length - 1]!) }), reasons: explainMove(prior.pos, move) };
    render();
    announce(live, explanation.textContent ?? '');
  }

  /* ---------- Variation board ---------- */
  /** Stores a changed variation (or none) WITHOUT touching the game: only a save, never a result. */
  const setVariation = (variation: Variation | undefined) => {
    const { variation: _old, ...rest } = state;
    state = variation ? { ...rest, variation } : rest;
    context.requestSave();
    render();
  };

  /** Keyboard cursor on the variation board: the moving side's king, like on the main board. */
  const focusVariationCursor = () => {
    if (!state.variation) return;
    const pos = variationView(state.variation).pos;
    varCursor = kingSquare(pos, pos.side);
    render();
    varBoard.squares[varCursor]?.focus();
  };

  function openVariation(): void {
    // The board must show the full logical position (complete a pending computer reply first).
    if (pending !== null) flushPending();
    if (timer !== undefined) showAll();
    if (state.variation) return;
    resetVariationTransient();
    const fen = toFen(replay(state.start, state.moves)!.pos);
    setVariation(createVariation(fen, orientation));
    focusVariationCursor();
    announce(live, `${t('variation.opened')} ${varStatus.textContent ?? ''}`);
  }

  function closeVariation(): void {
    if (!state.variation) return;
    resetVariationTransient();
    setVariation(undefined);
    announce(live, t('variation.closed'));
    variationButton.focus();
  }

  const varAnnounce = () => announce(live, varStatus.textContent ?? '');

  function stepVariation(delta: number): void {
    if (!state.variation) return;
    resetVariationTransient();
    const before = state.variation;
    const next = variationStep(before, delta);
    if (next.cursor === before.cursor) return;
    let text = '';
    if (delta > 0) {
      const pos = variationView(before).pos;
      const move = legalMoves(pos).find((m) => moveToUci(m) === before.moves[before.cursor]);
      if (move !== undefined) text = describe(pos, move);
    }
    setVariation(next);
    announce(live, `${text} ${varStatus.textContent ?? ''}`.trim());
  }

  function resetVariation(): void {
    if (!state.variation) return;
    resetVariationTransient();
    setVariation(variationReset(state.variation));
    varAnnounce();
  }

  function flipVariation(): void {
    if (!state.variation) return;
    setVariation(variationFlip(state.variation));
    announce(live, t(state.variation!.orientation === 'w' ? 'flipped.w' : 'flipped.b'));
  }

  function playVariation(move: number): void {
    if (!state.variation || !varView) return;
    const text = describe(varView.pos, move);
    resetVariationTransient();
    setVariation(variationPlay(state.variation, moveToUci(move)));
    announce(live, `${text} ${varStatus.textContent ?? ''}`);
  }

  function onVarSquare(sq: number): void {
    varCursor = sq;
    if (varPromotion || !varView || varView.status.kind !== 'playing') return;
    const pos = varView.pos;
    if (varSelected >= 0) {
      const options = legalMoves(pos).filter((m) => moveFrom(m) === varSelected && moveTo(m) === sq);
      if (options.length > 1) {
        varPromotion = { from: varSelected, to: sq };
        render();
        varPromo.first.focus();
        return;
      }
      if (options.length === 1) {
        playVariation(options[0]!);
        return;
      }
    }
    const piece = pos.board[sq]!;
    const own = piece !== 0 && (piece > 0 ? 1 : -1) === pos.side;
    if (own && sq !== varSelected) {
      varSelected = sq;
      render();
      const count = legalMoves(pos).filter((m) => moveFrom(m) === sq).length;
      announce(live, t('selected', { piece: pieceName(piece), square: squareName(sq), n: count }));
    } else {
      varSelected = -1;
      render();
    }
  }

  function onVarPromote(type: number): void {
    if (!varPromotion || !varView) return;
    const { from, to } = varPromotion;
    const move = legalMoves(varView.pos).find((m) => moveFrom(m) === from && moveTo(m) === to && movePromo(m) === type);
    varPromotion = null;
    if (move) playVariation(move);
    else render();
    varBoard.squares[to]?.focus();
  }

  function closeVarPromotion(): void {
    if (!varPromotion) return;
    const to = varPromotion.to;
    varPromotion = null;
    varSelected = -1;
    render();
    varBoard.squares[to]?.focus();
  }

  /** In an unsolved puzzle the engine would give the solution away: ask first (once per puzzle). */
  function onEngine(): void {
    if (!varView || varView.status.kind !== 'playing') return;
    if (puzzleMode() && !solutionOk && !isOver(stateOutcome(state, replay(state.start, state.moves)!))) {
      confirmSolution = true;
      render();
      solutionYes.focus();
      announce(live, t('variation.solution'));
      return;
    }
    showEngine();
  }

  function showEngine(): void {
    if (!state.variation) return;
    // Repetition awareness within the variation line itself.
    const variation = state.variation;
    const pos = parseFen(variation.fen)!;
    const history: number[] = [];
    for (const uci of variation.moves.slice(0, variation.cursor)) {
      history.push(pos.hashLo, pos.hashHi);
      makeMove(pos, legalMoves(pos).find((m) => moveToUci(m) === uci)!);
    }
    const evaluation = evaluatePosition(pos, history);
    if (!evaluation) {
      render();
      return;
    }
    const move = figurine(toSan(pos, evaluation.move));
    const value = isolate(formatEvaluation(evaluation));
    const text =
      evaluation.mate !== 0
        ? t('variation.engine.mate', { move: isolate(move), color: t(evaluation.mate > 0 ? 'color.w' : 'color.b'), n: Math.abs(evaluation.mate), eval: value })
        : t('variation.engine.result', { move: isolate(move), eval: value });
    varEngine = { evaluation, text };
    render();
    announce(live, text);
    varEngineButton.focus();
  }

  /* ---------- Lifecycle ---------- */
  function startFresh(options: GameOptions): void {
    cancelTimer();
    pending = null;
    resetTransient();
    resetVariationTransient();
    solutionOk = false;
    const next = startGame(options);
    orientation = next.opponent === 'computer' ? next.humanColor : 'w';
    const intro = next.colorRandom ? `${t('newRound')} ${t('color.drawn', { color: t(`color.${next.humanColor}`) })}` : t('newRound');
    commit(next, `${intro} ${describeMoves(0, next.moves, next.start)}`.trim());
    syncMenu();
    focusCursor();
  }

  const focusCursor = () => {
    const pos = view.pos;
    const k = kingSquare(pos, pos.side);
    cursor = state.opponent === 'computer' ? kingSquare(pos, state.humanColor === 'w' ? 1 : -1) : k;
    // Start the keyboard cursor on a pawn in front of the king (a natural first move square).
    const ahead = cursor + (colorOfSide(pos.side) === 'w' ? 8 : -8);
    if (ahead >= 0 && ahead < 64 && Math.abs(pos.board[ahead]!) === PAWN) cursor = ahead;
    render();
  };

  const load = (next: ChessState) => {
    cancelTimer();
    pending = null;
    pendingAnnouncement = '';
    resetTransient();
    resetVariationTransient();
    solutionOk = false;
    state = next;
    orientation = state.opponent === 'computer' ? state.humanColor : 'w';
    shown = state.moves.length;
    view = replay(state.start, state.moves)!;
    if (state.variation) {
      const pos = variationView(state.variation).pos;
      varCursor = kingSquare(pos, pos.side);
    }
    syncMenu();
    focusCursor();
  };

  load(state);

  /* ---------- Instance ---------- */
  return {
    newGame(options: NewGameOptions) {
      const difficulty = isOneOf(options.difficulty, DIFFICULTIES) ? options.difficulty : DEFAULT_DIFFICULTY;
      // Opponent, colour and mode are in-game preferences; in the puzzle modes the seed picks the puzzle.
      const seed = normalizeSeed(options.seed);
      load(startGame({ seed, difficulty, opponent: state.opponent, humanColor: colorPref, mode: state.mode, mateN: state.mateN, puzzle: seed }));
    },
    restore(saved: ChessState) {
      load(cloneState(saved));
    },
    serialize: () => cloneState(state),
    pause() {
      // Never leave the display (or a pending move) behind the logical state.
      if (pending !== null) flushPending();
      if (timer !== undefined) showAll();
    },
    resume() {},
    reset() {
      load(startGame(optionsOf(state)));
      context.requestSave();
    },
    dispose() {
      cancelTimer();
      pending = null;
      mainBoard.dispose();
      varBoard.dispose();
      clear(root);
    }
  };
}
