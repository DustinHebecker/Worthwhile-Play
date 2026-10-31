import type { GameContext, GameInstance, GameResult, NewGameOptions } from '@wp/game-core';
import { normalizeSeed } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import { playTurn, startRound } from './ai';
import {
  canPull,
  canUndo,
  cellIndex,
  dropMove,
  dropRow,
  geometryOf,
  humanPlayer,
  isComputerTurn,
  isLegalMove,
  isPull,
  moveColumn,
  moveLimit,
  playerOfMove,
  pullMove,
  replay,
  undo,
  type Cell,
  type ConnectFourState,
  type Game,
  type Geometry,
  type Move,
  type Outcome,
  type Player,
  type RoundOptions
} from './rules';
import { roundOptions } from './settings';
import './styles.css';

/** Short pause before the computer's reply becomes visible (skipped with reduced motion). */
export const COMPUTER_REVEAL_MS = 400;

const ACTIONS = ['drop', 'pull'] as const;
type Action = (typeof ACTIONS)[number];

const cloneState = (state: ConnectFourState): ConnectFourState => ({ ...state, variant: { ...state.variant }, moves: [...state.moves] });

const optionsOf = (state: ConnectFourState): RoundOptions => ({
  seed: state.seed,
  difficulty: state.difficulty,
  opponent: state.opponent,
  starter: state.starter,
  variant: { ...state.variant }
});

/** Disc shapes differ by form (solid vs ring), not only by colour; see styles.css. */
const discElement = () => h('span', { class: 'c4-disc', 'aria-hidden': 'true' });

export function createConnectFour(context: GameContext): GameInstance<ConnectFourState> {
  const { t, root } = context;
  const rtl = t.direction === 'rtl';
  let state: ConnectFourState = startRound(roundOptions({ seed: 0 }, 0));
  /** Number of moves currently drawn; lags behind `state.moves` only while the computer's reply is being revealed. */
  let shown = 0;
  let revealTimer: ReturnType<typeof setTimeout> | undefined;
  let pendingAnnouncement = '';
  /** What a column press does (pull-out variant only); back to "drop" after every move. */
  let action: Action = 'drop';
  /** Moves already animated; a pull-out shown beyond this lets its whole column fall one cell. */
  let animatedPly = 0;

  /* ---------- Controls ---------- */
  const undoButton = h('button', { type: 'button', 'data-testid': 'undo', onclick: () => onUndo() }, t('common.undo'));
  const restartButton = h('button', { type: 'button', 'data-testid': 'restart', onclick: () => changeOptions(optionsOf(state)) }, t('restart'));

  /* ---------- Drop / pull choice (pull-out variant) ---------- */
  const actionInputs = {} as Record<Action, HTMLInputElement>;
  const actionGroup = h('fieldset', { class: 'c4-actions-choice', 'data-testid': 'action-choice' }, h('legend', {}, t('action')));
  for (const value of ACTIONS) {
    const input = h('input', {
      type: 'radio',
      name: 'c4-action',
      value,
      'data-testid': `action-${value}`,
      onchange: () => {
        action = value;
        render();
      }
    });
    actionInputs[value] = input;
    actionGroup.append(h('label', { class: 'c4-choice' }, input, h('span', {}, t(`action.${value}`))));
  }
  const help = h('p', { class: 'c4-help', 'data-testid': 'help' });

  /* ---------- Status ---------- */
  const statusDisc = h('span', { class: 'c4-cell c4-status-disc', 'data-player': '', 'aria-hidden': 'true' }, discElement());
  const statusText = h('span', { 'data-testid': 'status' });
  const status = h('p', { class: 'wp-status c4-status' }, statusDisc, statusText);
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'announcer' });

  /* ---------- Board ---------- */
  let geo: Geometry = geometryOf(state.variant);
  let columns: HTMLButtonElement[] = [];
  /** cells[index] for index = row * cols + col (row 0 at the top). */
  let cells: HTMLSpanElement[] = [];
  const board = h('div', { class: 'c4-board', role: 'group', 'data-testid': 'board' });

  const buildBoard = () => {
    geo = geometryOf(state.variant);
    columns = [];
    cells = [];
    board.replaceChildren();
    board.style.setProperty('--c4-cols', String(geo.cols));
    board.style.setProperty('--c4-rows', String(geo.rows));
    board.dataset.size = state.variant.size;
    board.setAttribute('aria-label', t('board', { cols: geo.cols, rows: geo.rows }));
    for (let col = 0; col < geo.cols; col++) {
      const column = h('button', {
        type: 'button',
        class: 'c4-column',
        'data-column': col,
        'data-testid': `column-${col}`,
        tabindex: col === Math.floor(geo.cols / 2) ? 0 : -1,
        onclick: () => onColumn(col)
      });
      for (let row = 0; row < geo.rows; row++) {
        const cell = h('span', { class: 'c4-cell', 'data-testid': `cell-${row}-${col}`, 'data-disc': '' });
        cells[cellIndex(geo, row, col)] = cell;
        column.append(cell);
      }
      columns.push(column);
      board.append(column);
    }
  };

  /** Roving tabindex over the columns: Left/Right follow the visual order (mirrored in RTL), Home/End jump to the ends. */
  const onKey = (event: KeyboardEvent) => {
    const from = columns.indexOf(document.activeElement as HTMLButtonElement);
    if (from < 0) return;
    const step = rtl ? -1 : 1;
    const targets: Record<string, number> = {
      ArrowLeft: from - step,
      ArrowRight: from + step,
      Home: 0,
      End: geo.cols - 1
    };
    const target = targets[event.key];
    if (target === undefined) return;
    event.preventDefault();
    focusColumn(Math.min(geo.cols - 1, Math.max(0, target)));
  };
  board.addEventListener('keydown', onKey);

  const focusColumn = (col: number) => {
    columns.forEach((column, i) => (column.tabIndex = i === col ? 0 : -1));
    columns[col]?.focus();
  };

  const container = h(
    'div',
    { class: `wp-connect-four${context.reducedMotion ? ' c4-reduced' : ''}`, dir: t.direction },
    status,
    actionGroup,
    board,
    h('div', { class: 'c4-actions' }, undoButton, restartButton),
    help,
    live
  );
  root.append(container);
  buildBoard();

  /* ---------- Rendering ---------- */
  const lineName = () => t(`line.${state.variant.connect}`);
  const discName = (disc: Player, winning: boolean) => (winning ? t('disc.winning', { disc: t(`disc.${disc}`) }) : t(`disc.${disc}`));

  /** Column contents from the bottom up, e.g. "filled, hollow" (empty string for an empty column). */
  const columnDiscs = (discs: readonly Cell[], col: number, winning: ReadonlySet<number>): string[] => {
    const names: string[] = [];
    for (let row = geo.rows - 1; row >= 0; row--) {
      const disc = discs[cellIndex(geo, row, col)];
      if (!disc) break;
      names.push(discName(disc, winning.has(cellIndex(geo, row, col))));
    }
    return names;
  };

  const columnLabel = (discs: readonly Cell[], col: number, winning: ReadonlySet<number>, pullable: boolean): string => {
    const names = columnDiscs(discs, col, winning);
    const list = names.join(t('separator'));
    if (pullable) return t('column.pull', { col: col + 1, discs: list });
    if (names.length === 0) return t('column.empty', { col: col + 1 });
    return t(names.length === geo.rows ? 'column.full' : 'column.discs', { col: col + 1, discs: list });
  };

  const statusFor = (outcome: Outcome, next: Player, revealing: boolean): string => {
    if (revealing) return t('common.thinking');
    const vsComputer = state.opponent === 'computer';
    const line = lineName();
    if (outcome.kind === 'won') {
      if (!vsComputer) return t(`result.wins.${outcome.win.player}`, { line });
      return outcome.win.player === humanPlayer(state.starter) ? t('status.won', { line }) : t('status.lost', { line });
    }
    if (outcome.kind === 'draw') return t(`draw.${outcome.reason}`, { moves: moveLimit(state.variant) });
    return vsComputer ? t(`turn.you.${humanPlayer(state.starter)}`) : t(`turn.${next}`);
  };

  const render = () => {
    const revealing = shown < state.moves.length;
    const visible = state.moves.slice(0, shown);
    const game: Game = replay(state.variant, visible);
    const discs = game.cells;
    const outcome = game.outcome;
    const winning = new Set<number>(outcome.kind === 'won' ? outcome.win.cells : []);
    const next = game.turn;
    const playable = !revealing && outcome.kind === 'playing';
    const last = visible[visible.length - 1];
    const lastCol = last === undefined ? -1 : moveColumn(last);
    const lastIndex = last === undefined || isPull(last) ? -1 : cellIndex(geo, dropRow(geo, discs, lastCol) + 1, lastCol);
    // A pull-out shown for the first time: the whole column falls one cell.
    const fallingCol = last !== undefined && isPull(last) && shown > animatedPly ? lastCol : -1;
    animatedPly = Math.max(animatedPly, shown);
    const pulls = state.variant.pullOut && playable ? Array.from({ length: geo.cols }, (_, col) => canPull(geo, discs, col, next)) : [];
    const canPullAny = pulls.some(Boolean);
    if (!canPullAny) action = 'drop';
    const pulling = action === 'pull';

    discs.forEach((disc, i) => {
      const cell = cells[i] as HTMLSpanElement;
      const value = disc === 0 ? '' : String(disc);
      const col = i % geo.cols;
      if (cell.dataset.disc !== value || (col === fallingCol && disc !== 0)) {
        cell.dataset.disc = value;
        cell.style.setProperty('--c4-fall', String(col === fallingCol ? 1 : Math.floor(i / geo.cols) + 1));
        cell.replaceChildren(...(disc ? [discElement()] : []));
      }
      const isWinning = winning.has(i);
      cell.classList.toggle('is-winning', isWinning);
      cell.toggleAttribute('data-winning', isWinning);
      cell.toggleAttribute('data-last', i === lastIndex);
      cell.toggleAttribute('data-pullable', pulling && i >= (geo.rows - 1) * geo.cols && pulls[col] === true);
      cell.classList.remove('is-next');
    });

    columns.forEach((column, col) => {
      const pullable = pulling && pulls[col] === true;
      const open = playable && (pulling ? pullable : isLegalMove(state.variant, discs, dropMove(col), next));
      column.setAttribute('aria-label', columnLabel(discs, col, winning, pullable));
      column.setAttribute('aria-disabled', String(!open));
      column.toggleAttribute('data-pull-target', pullable);
      if (open && !pulling) cells[cellIndex(geo, dropRow(geo, discs, col), col)]?.classList.add('is-next');
    });

    const shownDisc = outcome.kind === 'won' ? outcome.win.player : outcome.kind === 'playing' ? next : 0;
    statusDisc.dataset.player = shownDisc ? String(shownDisc) : '';
    statusDisc.hidden = shownDisc === 0;
    statusText.textContent = statusFor(outcome, next, revealing);
    container.dataset.outcome = outcome.kind;
    container.dataset.turn = String(next);
    container.dataset.opponent = state.opponent;
    container.dataset.action = action;
    board.setAttribute('aria-busy', String(revealing));

    actionGroup.hidden = !state.variant.pullOut || outcome.kind !== 'playing';
    actionInputs.drop.checked = action === 'drop';
    actionInputs.pull.checked = action === 'pull';
    actionInputs.pull.disabled = !canPullAny;
    help.hidden = !state.variant.pullOut;
    help.textContent = state.variant.pullOut ? t('help.pullOut', { limit: moveLimit(state.variant) }) : '';

    undoButton.disabled = revealing || !canUndo(state);
  };

  const cancelReveal = () => {
    if (revealTimer !== undefined) clearTimeout(revealTimer);
    revealTimer = undefined;
  };

  /** Shows the full logical state and speaks any queued announcement. */
  const showAll = () => {
    cancelReveal();
    shown = state.moves.length;
    render();
    if (pendingAnnouncement) announce(live, `${pendingAnnouncement} ${statusText.textContent ?? ''}`.trim());
    pendingAnnouncement = '';
  };

  /** Shows a state that did not come from a move (new round, restore): no animation of old pulls; rebuilds the board if its size changed. */
  const showFresh = () => {
    action = 'drop';
    animatedPly = state.moves.length;
    if (geometryOf(state.variant) !== geo) buildBoard();
    showAll();
  };

  const describeMove = (move: Move, n: number) => t(`${isPull(move) ? 'pulled' : 'moved'}.${playerOfMove(n)}`, { col: moveColumn(move) + 1 });

  /** Spoken description of `moves[from..]`. */
  const describeMoves = (moves: readonly Move[], from: number) =>
    moves
      .slice(from)
      .map((move, n) => describeMove(move, from + n))
      .join(' ');

  /* ---------- Transitions ---------- */
  const resultOf = (outcome: Outcome): GameResult => {
    const stats = { moves: state.moves.length };
    if (outcome.kind === 'draw') return { outcome: 'draw', stats };
    if (state.opponent === 'human' || outcome.kind !== 'won') return { outcome: 'completed', stats };
    return { outcome: outcome.win.player === humanPlayer(state.starter) ? 'won' : 'lost', stats };
  };

  const commit = (next: ConnectFourState, announcement: string, revealFrom?: number) => {
    const wasPlaying = replay(state.variant, state.moves).outcome.kind === 'playing';
    const sameBoard = geometryOf(next.variant) === geo;
    state = next;
    context.requestSave();
    const outcome = replay(state.variant, state.moves).outcome;
    if (wasPlaying && outcome.kind !== 'playing') context.finished(resultOf(outcome));
    pendingAnnouncement = announcement;
    action = 'drop';
    cancelReveal();
    if (!sameBoard) buildBoard();
    if (revealFrom !== undefined && revealFrom < state.moves.length && !context.reducedMotion) {
      // The logical state already contains the computer's reply; only its drawing is delayed.
      shown = revealFrom;
      render();
      revealTimer = setTimeout(showAll, COMPUTER_REVEAL_MS);
    } else {
      showAll();
    }
  };

  const onColumn = (col: number) => {
    if (shown < state.moves.length || isComputerTurn(state)) return;
    const current = replay(state.variant, state.moves);
    if (current.outcome.kind !== 'playing') return;
    const move = action === 'pull' ? pullMove(col) : dropMove(col);
    if (!isLegalMove(state.variant, current.cells, move, current.turn)) {
      announce(live, t(action === 'pull' ? 'column.cannotPull' : 'column.isFull', { col: col + 1 }));
      return;
    }
    const before = state.moves.length;
    const next = playTurn(state, move);
    const replied = next.moves.length > before + 1;
    commit(next, describeMoves(next.moves, before), replied ? before + 1 : undefined);
  };

  const onUndo = () => {
    if (shown < state.moves.length || !canUndo(state)) return;
    commit(undo(state), t('undone'));
  };

  function changeOptions(options: RoundOptions) {
    const next = startRound(options);
    animatedPly = 0;
    commit(next, `${t('newRound')} ${describeMoves(next.moves, 0)}`.trim());
  }

  /* ---------- Instance ---------- */
  return {
    newGame(options: NewGameOptions) {
      cancelReveal();
      pendingAnnouncement = '';
      // Opponent, "who starts", strength and variant come from the host's start screen (ADR 0017).
      state = startRound(roundOptions(options, normalizeSeed(options.seed)));
      showFresh();
    },
    restore(saved: ConnectFourState) {
      cancelReveal();
      pendingAnnouncement = '';
      state = cloneState(saved);
      showFresh();
    },
    serialize: () => cloneState(state),
    pause() {
      // Never leave the display behind the logical state.
      if (revealTimer !== undefined) showAll();
    },
    resume() {},
    reset() {
      cancelReveal();
      pendingAnnouncement = '';
      state = startRound(optionsOf(state));
      context.requestSave();
      showFresh();
    },
    dispose() {
      cancelReveal();
      board.removeEventListener('keydown', onKey);
      clear(root);
    }
  };
}
