import type { GameContext, GameInstance, GameResult, NewGameOptions } from '@wp/game-core';
import { isOneOf, normalizeSeed } from '@wp/game-core';
import { announce, clear, gridKeyboard, h } from '@wp/ui';
import { computerReply, explainMove, playTurn, suggestMove, type Reason } from './ai';
import {
  COLORS,
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  FLAG_CASTLE_K,
  FLAG_CASTLE_Q,
  FLAG_EP,
  OPPONENTS,
  PAWN,
  canUndo,
  colorOfSide,
  createGame,
  fileOf,
  kingSquare,
  legalMoves,
  makeMove,
  moveFlag,
  moveFrom,
  movePromo,
  moveTo,
  moveToUci,
  outcomeOfReplay,
  parseFen,
  rankOf,
  replay,
  resign,
  squareName,
  toSan,
  undo,
  type ChessState,
  type Color,
  type GameOptions,
  type Outcome,
  type Position,
  type Replay
} from './rules';
import './styles.css';

/** Short pause before the computer's reply becomes visible (skipped with reduced motion). */
export const COMPUTER_REVEAL_MS = 450;

/** Solid glyphs for both colours (shape is identical; colour and outline differ). U+FE0E forces text presentation. */
const GLYPH = ['', '♟︎', '♞', '♝', '♜', '♛', '♚'] as const;
/** Outline glyphs, layered on white pieces so they stay distinguishable without colour (and in forced-colours mode). */
const OUTLINE = ['', '♙', '♘', '♗', '♖', '♕', '♔'] as const;
/** Figurines for the move list (language-independent notation). */
const FIGURINE: Record<string, string> = { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘' };

export const figurine = (san: string): string => san.replace(/[KQRBN]/g, (letter) => FIGURINE[letter] ?? letter);

const cloneState = (state: ChessState): ChessState => ({ ...state, moves: [...state.moves] });
const optionsOf = (state: ChessState): GameOptions => ({
  seed: state.seed,
  difficulty: state.difficulty,
  opponent: state.opponent,
  humanColor: state.humanColor,
  start: state.start
});

/** Starts a game, including the computer's first move when it plays white. */
export const startGame = (options: GameOptions): ChessState => computerReply(createGame(options));

const isOver = (outcome: Outcome) => outcome.kind !== 'playing';

export function createChess(context: GameContext): GameInstance<ChessState> {
  const { t, root } = context;
  let state: ChessState = startGame({ seed: 0, difficulty: DEFAULT_DIFFICULTY, opponent: 'computer', humanColor: 'w' });
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
  let why: { san: string; reasons: Reason[] } | null = null;
  let confirmResign = false;
  let view: Replay = replay(state.start, state.moves)!;

  /* ---------- DOM ---------- */
  const status = h('p', { class: 'wp-status ch-status', 'data-testid': 'status' });
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'announcer' });

  const squares: HTMLButtonElement[] = [];
  const board = h('div', { class: 'ch-board', role: 'group', 'aria-label': t('board'), 'data-testid': 'board', dir: 'ltr' });
  for (let sq = 0; sq < 64; sq++) {
    const light = (fileOf(sq) + rankOf(sq)) % 2 === 1;
    const button = h('button', {
      type: 'button',
      class: `ch-sq ${light ? 'is-light' : 'is-dark'}`,
      'data-cell': '',
      'data-testid': `sq-${squareName(sq)}`,
      'data-square': squareName(sq),
      tabindex: -1,
      onclick: () => onSquare(sq),
      onfocus: () => {
        cursor = sq;
      }
    });
    squares.push(button);
  }
  const disposeKeys = gridKeyboard(board, 8);

  /* Mouse drag (optional): press on a piece, release on the target square. Tap/click and keyboard work the same way. */
  let dragFrom = -1;
  const squareAt = (event: PointerEvent): number => {
    const el = document.elementFromPoint?.(event.clientX, event.clientY)?.closest<HTMLElement>('[data-square]');
    return el ? squares.indexOf(el as HTMLButtonElement) : -1;
  };
  const onPointerDown = (event: PointerEvent) => {
    dragFrom = -1;
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    const sq = squares.indexOf((event.target as HTMLElement).closest('[data-square]') as HTMLButtonElement);
    const mover = controllable();
    const piece = sq >= 0 ? view.pos.board[sq]! : 0;
    if (mover && piece !== 0 && (piece > 0 ? 'w' : 'b') === mover) dragFrom = sq;
  };
  const onPointerUp = (event: PointerEvent) => {
    const from = dragFrom;
    dragFrom = -1;
    if (from < 0 || promotion) return;
    const to = squareAt(event);
    if (to < 0 || to === from) return;
    selected = from;
    onSquare(to);
  };
  board.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointerup', onPointerUp);

  const button = (id: string, label: string, onclick: () => void) => h('button', { type: 'button', 'data-testid': id, onclick }, label);
  const undoButton = button('undo', t('common.undo'), () => onUndo());
  const hintButton = button('hint', t('common.hint'), () => onHint());
  const whyButton = button('why', t('why'), () => onWhy());
  const flipButton = button('flip', t('flip'), () => {
    orientation = orientation === 'w' ? 'b' : 'w';
    render();
    announce(live, t(orientation === 'w' ? 'flipped.w' : 'flipped.b'));
  });
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

  const promoButtons = [5, 4, 3, 2].map((type) =>
    h(
      'button',
      { type: 'button', class: 'ch-promo', 'data-testid': `promote-${'  nbrq'[type]!}`, 'aria-label': t(`piece.${type}`), onclick: () => onPromote(type) },
      h('span', { class: 'ch-glyph', 'aria-hidden': 'true' }, GLYPH[type]!),
      h('span', { class: 'ch-promo-label' }, t(`piece.${type}`))
    )
  );
  const promoCancel = button('promote-cancel', t('cancel'), () => closePromotion());
  const promoDialog = h(
    'div',
    { class: 'ch-dialog', role: 'dialog', 'aria-modal': 'false', 'aria-label': t('promotion'), 'data-testid': 'promotion', hidden: true },
    h('p', {}, t('promotion')),
    h('div', { class: 'ch-promo-row' }, ...promoButtons),
    promoCancel
  );
  promoDialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closePromotion();
    }
  });

  const explanation = h('div', { class: 'ch-explain', 'data-testid': 'explanation', 'aria-live': 'polite', hidden: true });
  const moveList = h('ol', { class: 'ch-moves', 'data-testid': 'move-list', 'aria-label': t('common.moves') });

  // Settings for the next game.
  const select = (name: string, values: readonly string[], label: (value: string) => string) => {
    const el = h('select', { 'data-testid': `option-${name}` });
    for (const value of values) el.append(h('option', { value }, label(value)));
    return el;
  };
  const opponentSelect = select('opponent', OPPONENTS, (v) => t(`common.opponent.${v}`));
  const colorSelect = select('color', COLORS, (v) => t(`color.${v}`));
  const strengthSelect = select('strength', DIFFICULTIES, (v) => t(`difficulty.${v}`));
  const field = (label: string, control: HTMLSelectElement) => h('label', { class: 'ch-field' }, h('span', {}, label), control);
  const colorField = field(t('yourColor'), colorSelect);
  const strengthField = field(t('strength'), strengthSelect);
  opponentSelect.addEventListener('change', () => {
    const computer = opponentSelect.value === 'computer';
    colorField.hidden = !computer;
    strengthField.hidden = !computer;
  });
  const startButton = button('start', t('start'), () => {
    const opponent = isOneOf(opponentSelect.value, OPPONENTS) ? opponentSelect.value : state.opponent;
    const humanColor = isOneOf(colorSelect.value, COLORS) ? colorSelect.value : state.humanColor;
    const difficulty = isOneOf(strengthSelect.value, DIFFICULTIES) ? strengthSelect.value : state.difficulty;
    settings.open = false;
    startFresh({ ...optionsOf(state), opponent, humanColor, difficulty });
  });
  const settings = h(
    'details',
    { class: 'ch-settings', 'data-testid': 'settings' },
    h('summary', {}, t('common.newGame')),
    h('div', { class: 'ch-settings-body' }, field(t('common.opponent'), opponentSelect), colorField, strengthField, startButton)
  );
  settings.addEventListener('toggle', () => {
    if (settings.open) syncSettings();
  });

  const modeLine = h('p', { class: 'ch-mode', 'data-testid': 'mode' });

  const container = h(
    'div',
    { class: `wp-chess${context.reducedMotion ? ' ch-reduced' : ''}`, dir: t.direction },
    status,
    h('div', { class: 'ch-board-wrap' }, board, promoDialog),
    h('div', { class: 'ch-actions' }, undoButton, hintButton, whyButton, flipButton, resignButton),
    resignConfirm,
    explanation,
    h('section', { class: 'ch-history', 'aria-label': t('common.moves') }, h('h3', {}, t('common.moves')), moveList),
    modeLine,
    settings,
    live
  );
  root.append(container);

  /* ---------- Helpers ---------- */
  const displayed = (): string[] => (pending ? [...state.moves, pending] : state.moves.slice(0, shown));
  const busy = () => pending !== null || shown < state.moves.length;
  const outcomeNow = () => outcomeOfReplay(view, state.resigned);
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

  const describeMoves = (from: number, moves: readonly string[]): string => {
    const game = replay(state.start, moves.slice(0, from));
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

  const statusText = (outcome: Outcome): string => {
    if (busy()) return t('common.thinking');
    switch (outcome.kind) {
      case 'checkmate':
        return t(`end.checkmate.${outcome.winner}`);
      case 'resigned':
        return t(`end.resigned.${outcome.winner === 'w' ? 'b' : 'w'}`);
      case 'draw':
        return t(`end.${outcome.reason}`);
      default: {
        const turn = state.opponent === 'computer' ? t(`turn.you.${state.humanColor}`) : t(`turn.${outcome.turn}`);
        return outcome.check ? `${t('check')} ${turn}` : turn;
      }
    }
  };

  /* ---------- Rendering ---------- */
  function render(): void {
    view = replay(state.start, displayed()) ?? replay(state.start, [])!;
    const pos = view.pos;
    const outcome = outcomeNow();
    const mover = controllable();
    const targets = new Map<number, number[]>();
    if (selected >= 0 && mover) {
      for (const m of legalMoves(pos)) {
        if (moveFrom(m) !== selected) continue;
        const list = targets.get(moveTo(m)) ?? [];
        list.push(m);
        targets.set(moveTo(m), list);
      }
    }
    const lastMove = view.moves[view.moves.length - 1];
    const lastFrom = lastMove === undefined ? -1 : moveFrom(lastMove);
    const lastTo = lastMove === undefined ? -1 : moveTo(lastMove);
    const checked = outcome.kind === 'playing' && outcome.check ? kingSquare(pos, pos.side) : outcome.kind === 'checkmate' ? kingSquare(pos, pos.side) : -1;
    const hintFrom = hint ? moveFrom(hint.move) : -1;
    const hintTo = hint ? moveTo(hint.move) : -1;

    // Visual order: rank 8 at the top for white's view; mirrored for black's.
    const order: number[] = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) order.push(orientation === 'w' ? (7 - row) * 8 + col : row * 8 + (7 - col));
    }
    const sep = t('separator');
    order.forEach((sq, index) => {
      const el = squares[sq]!;
      if (board.children[index] !== el) board.insertBefore(el, board.children[index] ?? null);
      const piece = pos.board[sq]!;
      const code = piece === 0 ? '' : `${piece > 0 ? 'w' : 'b'}${' PNBRQK'[Math.abs(piece)]!}`;
      if (el.dataset.piece !== code || el.dataset.orientation !== orientation) {
        el.dataset.piece = code;
        el.dataset.orientation = orientation;
        const parts: (HTMLElement | false)[] = [];
        if (piece) {
          const type = Math.abs(piece);
          parts.push(h('span', { class: `ch-piece ${piece > 0 ? 'is-white' : 'is-black'}`, 'aria-hidden': 'true' }, h('span', { class: 'ch-fill' }, GLYPH[type]!), piece > 0 && h('span', { class: 'ch-outline' }, OUTLINE[type]!)));
        }
        const row = Math.floor(index / 8);
        const col = index % 8;
        if (row === 7) parts.push(h('span', { class: 'ch-coord ch-file', 'aria-hidden': 'true' }, 'abcdefgh'[fileOf(sq)]!));
        if (col === 0) parts.push(h('span', { class: 'ch-coord ch-rank', 'aria-hidden': 'true' }, String(rankOf(sq) + 1)));
        parts.push(h('span', { class: 'ch-marker', 'aria-hidden': 'true' }));
        el.replaceChildren(...parts.filter((p): p is HTMLElement => p !== false));
      }
      const target = targets.has(sq);
      el.toggleAttribute('data-selected', sq === selected && mover !== null);
      el.dataset.target = target ? (piece !== 0 || targets.get(sq)!.some((m) => moveFlag(m) === FLAG_EP) ? 'capture' : 'move') : '';
      el.toggleAttribute('data-last', sq === lastFrom || sq === lastTo);
      el.toggleAttribute('data-check', sq === checked);
      el.toggleAttribute('data-hint', sq === hintFrom || sq === hintTo);
      el.setAttribute('aria-pressed', String(sq === selected && mover !== null));
      const label = [piece ? t('sq.piece', { square: squareName(sq), piece: pieceName(piece), color: colorName(piece) }) : t('sq.empty', { square: squareName(sq) })];
      if (target) label.push(t(el.dataset.target === 'capture' ? 'sq.capture' : 'sq.target'));
      if (sq === lastFrom || sq === lastTo) label.push(t('sq.last'));
      if (sq === checked) label.push(t('sq.check'));
      if (sq === hintFrom || sq === hintTo) label.push(t('sq.hint'));
      el.setAttribute('aria-label', label.join(sep));
      el.tabIndex = sq === cursor ? 0 : -1;
    });

    // Move list in figurine notation.
    const items: HTMLElement[] = [];
    const startPos = parseFen(state.start)!;
    const blackFirst = startPos.side === -1;
    const sans = view.sans;
    let number = startPos.fullmove;
    for (let i = 0; i < sans.length; ) {
      const li = h('li', { value: number, class: 'ch-move' });
      li.append(h('span', { class: 'ch-num' }, `${number}.`));
      if (i === 0 && blackFirst) {
        li.append(h('span', { class: 'ch-ply' }, '…'));
        li.append(h('span', { class: 'ch-ply', 'data-testid': `ply-${i}` }, figurine(sans[i]!)));
        i += 1;
      } else {
        li.append(h('span', { class: 'ch-ply', 'data-testid': `ply-${i}` }, figurine(sans[i]!)));
        if (i + 1 < sans.length) li.append(h('span', { class: 'ch-ply', 'data-testid': `ply-${i + 1}` }, figurine(sans[i + 1]!)));
        i += 2;
      }
      items.push(li);
      number++;
    }
    moveList.replaceChildren(...items);
    if (items.length === 0) moveList.append(h('li', { class: 'ch-empty' }, t('noMoves')));
    moveList.scrollTop = moveList.scrollHeight;

    status.textContent = statusText(outcome);
    container.dataset.outcome = outcome.kind;
    container.dataset.turn = colorOfSide(pos.side);
    container.dataset.orientation = orientation;
    board.setAttribute('aria-busy', String(busy()));

    const playing = !isOver(outcome);
    undoButton.disabled = busy() || !canUndo(state);
    hintButton.disabled = mover === null;
    const lastIsComputer = state.opponent === 'computer' && view.moves.length > 0 && !busy() && colorOfSide(view.pos.side) === state.humanColor;
    whyButton.hidden = state.opponent !== 'computer';
    whyButton.disabled = !lastIsComputer;
    resignButton.disabled = busy() || !playing;
    resignButton.hidden = confirmResign;
    resignConfirm.hidden = !confirmResign || !playing;
    promoDialog.hidden = promotion === null;

    if (hint || why) {
      explanation.hidden = false;
      const title = hint ? t('hint.title', { move: figurine(sanOf(hint.move)) }) : t('why.title', { move: why!.san });
      const reasons = (hint ? hint.reasons : why!.reasons).map((r) => h('li', {}, reasonText(r)));
      explanation.replaceChildren(h('p', { class: 'ch-explain-title' }, title), h('ul', {}, ...reasons));
    } else {
      explanation.hidden = true;
      explanation.replaceChildren();
    }

    const mode =
      state.opponent === 'computer'
        ? t('mode.computer', { color: t(`color.${state.humanColor}`), level: t(`difficulty.${state.difficulty}`) })
        : t('mode.human');
    modeLine.textContent = mode;
  }

  const sanOf = (move: number): string => toSan(view.pos, move);

  function syncSettings(): void {
    opponentSelect.value = state.opponent;
    colorSelect.value = state.humanColor;
    strengthSelect.value = state.difficulty;
    colorField.hidden = state.opponent !== 'computer';
    strengthField.hidden = state.opponent !== 'computer';
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
    why = null;
    confirmResign = false;
  };

  /** Applies a new logical state: saves, reports a natural end once, then draws (optionally revealing from `revealFrom`). */
  const commit = (next: ChessState, announcement: string, revealFrom?: number) => {
    const before = replay(state.start, state.moves);
    const wasPlaying = before ? !isOver(outcomeOfReplay(before, state.resigned)) : false;
    state = next;
    context.requestSave();
    const after = replay(state.start, state.moves)!;
    const outcome = outcomeOfReplay(after, state.resigned);
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
        promoButtons[0]!.focus();
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
    const move = suggestMove(state);
    if (move === null) return;
    why = null;
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
    why = { san: figurine(view.sans[view.sans.length - 1]!), reasons: explainMove(prior.pos, move) };
    render();
    announce(live, explanation.textContent ?? '');
  }

  function startFresh(options: GameOptions): void {
    cancelTimer();
    pending = null;
    resetTransient();
    orientation = options.opponent === 'computer' ? options.humanColor : 'w';
    const next = startGame(options);
    const intro = t('newRound');
    commit(next, `${intro} ${describeMoves(0, next.moves)}`.trim());
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
    state = next;
    orientation = state.opponent === 'computer' ? state.humanColor : 'w';
    shown = state.moves.length;
    view = replay(state.start, state.moves)!;
    focusCursor();
    syncSettings();
  };

  load(state);

  /* ---------- Instance ---------- */
  return {
    newGame(options: NewGameOptions) {
      const difficulty = isOneOf(options.difficulty, DIFFICULTIES) ? options.difficulty : DEFAULT_DIFFICULTY;
      // Opponent and colour are in-game preferences and carry over to a new game.
      load(startGame({ seed: normalizeSeed(options.seed), difficulty, opponent: state.opponent, humanColor: state.humanColor }));
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
      disposeKeys();
      board.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointerup', onPointerUp);
      clear(root);
    }
  };
}

