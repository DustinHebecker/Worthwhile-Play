import type { GameContext, GameInstance, GameResult, NewGameOptions } from '@wp/game-core';
import { isOneOf, normalizeSeed } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import { playTurn, startRound } from './ai';
import {
  COLS,
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  OPPONENTS,
  ROWS,
  STARTERS,
  boardFromMoves,
  canUndo,
  cellIndex,
  dropRow,
  humanPlayer,
  isLegalMove,
  outcomeOf,
  playerOfMove,
  toMove,
  undo,
  type Cell,
  type ConnectFourState,
  type Outcome,
  type Player,
  type RoundOptions
} from './rules';
import './styles.css';

/** Short pause before the computer's reply becomes visible (skipped with reduced motion). */
export const COMPUTER_REVEAL_MS = 400;

const cloneState = (state: ConnectFourState): ConnectFourState => ({ ...state, moves: [...state.moves] });

const optionsOf = (state: ConnectFourState): RoundOptions => ({
  seed: state.seed,
  difficulty: state.difficulty,
  opponent: state.opponent,
  starter: state.starter
});

/** Disc shapes differ by form (solid vs ring), not only by colour; see styles.css. */
const discElement = () => h('span', { class: 'c4-disc', 'aria-hidden': 'true' });

export function createConnectFour(context: GameContext): GameInstance<ConnectFourState> {
  const { t, root } = context;
  const rtl = t.direction === 'rtl';
  let state: ConnectFourState = startRound({ seed: 0, difficulty: DEFAULT_DIFFICULTY, opponent: 'computer', starter: 'human' });
  /** Number of moves currently drawn; lags behind `state.moves` only while the computer's reply is being revealed. */
  let shown = 0;
  let revealTimer: ReturnType<typeof setTimeout> | undefined;
  let pendingAnnouncement = '';

  /* ---------- DOM ---------- */
  const select = (name: string, values: readonly string[], label: (value: string) => string, onChange: (value: string) => void) => {
    const el = h('select', { 'data-testid': `option-${name}`, onchange: () => onChange(el.value) });
    for (const value of values) el.append(h('option', { value }, label(value)));
    return el;
  };
  const opponentSelect = select('opponent', OPPONENTS, (v) => t(`common.opponent.${v}`), (v) => {
    if (isOneOf(v, OPPONENTS)) changeOptions({ ...optionsOf(state), opponent: v });
  });
  const starterSelect = select('starter', STARTERS, (v) => t(`starter.${v}`), (v) => {
    if (isOneOf(v, STARTERS)) changeOptions({ ...optionsOf(state), starter: v });
  });
  const strengthSelect = select('strength', DIFFICULTIES, (v) => t(`difficulty.${v}`), (v) => {
    if (isOneOf(v, DIFFICULTIES)) changeOptions({ ...optionsOf(state), difficulty: v });
  });
  const field = (label: string, control: HTMLSelectElement) => h('label', { class: 'c4-field' }, h('span', {}, label), control);
  const starterField = field(t('starter'), starterSelect);
  const strengthField = field(t('strength'), strengthSelect);

  const undoButton = h('button', { type: 'button', 'data-testid': 'undo', onclick: () => onUndo() }, t('common.undo'));
  const restartButton = h('button', { type: 'button', 'data-testid': 'restart', onclick: () => changeOptions(optionsOf(state)) }, t('restart'));

  const statusDisc = h('span', { class: 'c4-cell c4-status-disc', 'data-player': '', 'aria-hidden': 'true' }, discElement());
  const statusText = h('span', { 'data-testid': 'status' });
  const status = h('p', { class: 'wp-status c4-status' }, statusDisc, statusText);
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'announcer' });

  const columns: HTMLButtonElement[] = [];
  /** cells[index] for index = row * COLS + col (row 0 at the top). */
  const cells: HTMLSpanElement[] = [];
  const board = h('div', { class: 'c4-board', role: 'group', 'aria-label': t('board'), 'data-testid': 'board' });
  for (let col = 0; col < COLS; col++) {
    const column = h('button', {
      type: 'button',
      class: 'c4-column',
      'data-column': col,
      'data-testid': `column-${col}`,
      tabindex: col === Math.floor(COLS / 2) ? 0 : -1,
      onclick: () => onColumn(col)
    });
    for (let row = 0; row < ROWS; row++) {
      const cell = h('span', { class: 'c4-cell', 'data-testid': `cell-${row}-${col}`, 'data-disc': '' });
      cells[cellIndex(row, col)] = cell;
      column.append(cell);
    }
    columns.push(column);
    board.append(column);
  }

  /** Roving tabindex over the columns: Left/Right follow the visual order (mirrored in RTL), Home/End jump to the ends. */
  const onKey = (event: KeyboardEvent) => {
    const from = columns.indexOf(document.activeElement as HTMLButtonElement);
    if (from < 0) return;
    const step = rtl ? -1 : 1;
    const targets: Record<string, number> = {
      ArrowLeft: from - step,
      ArrowRight: from + step,
      Home: 0,
      End: COLS - 1
    };
    const target = targets[event.key];
    if (target === undefined) return;
    event.preventDefault();
    focusColumn(Math.min(COLS - 1, Math.max(0, target)));
  };
  board.addEventListener('keydown', onKey);

  const focusColumn = (col: number) => {
    columns.forEach((column, i) => (column.tabIndex = i === col ? 0 : -1));
    columns[col]?.focus();
  };

  const container = h(
    'div',
    { class: `wp-connect-four${context.reducedMotion ? ' c4-reduced' : ''}`, dir: t.direction },
    h('div', { class: 'c4-toolbar' }, field(t('common.opponent'), opponentSelect), starterField, strengthField),
    status,
    board,
    h('div', { class: 'c4-actions' }, undoButton, restartButton),
    live
  );
  root.append(container);

  /* ---------- Rendering ---------- */
  const discName = (disc: Player, winning: boolean) => (winning ? t('disc.winning', { disc: t(`disc.${disc}`) }) : t(`disc.${disc}`));

  /** Column description from the bottom up, e.g. "Column 3, from the bottom: filled, hollow." */
  const columnLabel = (discs: readonly Cell[], col: number, winning: ReadonlySet<number>): string => {
    const names: string[] = [];
    for (let row = ROWS - 1; row >= 0; row--) {
      const disc = discs[cellIndex(row, col)];
      if (!disc) break;
      names.push(discName(disc, winning.has(cellIndex(row, col))));
    }
    if (names.length === 0) return t('column.empty', { col: col + 1 });
    return t(names.length === ROWS ? 'column.full' : 'column.discs', { col: col + 1, discs: names.join(t('separator')) });
  };

  const statusFor = (outcome: Outcome, next: Player, revealing: boolean): string => {
    if (revealing) return t('common.thinking');
    const vsComputer = state.opponent === 'computer';
    if (outcome.kind === 'won') {
      if (!vsComputer) return t(`result.wins.${outcome.win.player}`);
      return outcome.win.player === humanPlayer(state.starter) ? t('result.won') : t('result.lost');
    }
    if (outcome.kind === 'draw') return t('result.draw');
    return vsComputer ? t(`turn.you.${humanPlayer(state.starter)}`) : t(`turn.${next}`);
  };

  const render = () => {
    const revealing = shown < state.moves.length;
    const visible = state.moves.slice(0, shown);
    const discs = boardFromMoves(visible);
    const outcome = outcomeOf(discs);
    const winning = new Set<number>(outcome.kind === 'won' ? outcome.win.cells : []);
    const next = toMove(discs);
    const playable = !revealing && outcome.kind === 'playing';
    const lastCol = visible[visible.length - 1];
    const lastIndex = lastCol === undefined ? -1 : cellIndex(dropRow(discs, lastCol) + 1, lastCol);

    discs.forEach((disc, i) => {
      const cell = cells[i] as HTMLSpanElement;
      const value = disc === 0 ? '' : String(disc);
      if (cell.dataset.disc !== value) {
        cell.dataset.disc = value;
        cell.style.setProperty('--c4-fall', String(Math.floor(i / COLS) + 1));
        cell.replaceChildren(...(disc ? [discElement()] : []));
      }
      const isWinning = winning.has(i);
      cell.classList.toggle('is-winning', isWinning);
      cell.toggleAttribute('data-winning', isWinning);
      cell.toggleAttribute('data-last', i === lastIndex);
      cell.classList.remove('is-next');
    });

    columns.forEach((column, col) => {
      const open = playable && isLegalMove(discs, col);
      column.setAttribute('aria-label', columnLabel(discs, col, winning));
      column.setAttribute('aria-disabled', String(!open));
      if (open) cells[cellIndex(dropRow(discs, col), col)]?.classList.add('is-next');
    });

    const shownDisc = outcome.kind === 'won' ? outcome.win.player : outcome.kind === 'playing' ? next : 0;
    statusDisc.dataset.player = shownDisc ? String(shownDisc) : '';
    statusDisc.hidden = shownDisc === 0;
    statusText.textContent = statusFor(outcome, next, revealing);
    container.dataset.outcome = outcome.kind;
    container.dataset.turn = String(next);
    container.dataset.opponent = state.opponent;
    board.setAttribute('aria-busy', String(revealing));

    opponentSelect.value = state.opponent;
    starterSelect.value = state.starter;
    strengthSelect.value = state.difficulty;
    starterField.hidden = state.opponent !== 'computer';
    strengthField.hidden = state.opponent !== 'computer';
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

  /** Spoken description of `moves[from..]`. */
  const describeMoves = (moves: readonly number[], from: number) =>
    moves
      .slice(from)
      .map((col, n) => t(`moved.${playerOfMove(from + n)}`, { col: col + 1 }))
      .join(' ');

  /* ---------- Transitions ---------- */
  const resultOf = (outcome: Outcome): GameResult => {
    const stats = { moves: state.moves.length };
    if (outcome.kind === 'draw') return { outcome: 'draw', stats };
    if (state.opponent === 'human' || outcome.kind !== 'won') return { outcome: 'completed', stats };
    return { outcome: outcome.win.player === humanPlayer(state.starter) ? 'won' : 'lost', stats };
  };

  const commit = (next: ConnectFourState, announcement: string, revealFrom?: number) => {
    const wasPlaying = outcomeOf(boardFromMoves(state.moves)).kind === 'playing';
    state = next;
    context.requestSave();
    const outcome = outcomeOf(boardFromMoves(state.moves));
    if (wasPlaying && outcome.kind !== 'playing') context.finished(resultOf(outcome));
    pendingAnnouncement = announcement;
    cancelReveal();
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
    if (shown < state.moves.length) return;
    const current = boardFromMoves(state.moves);
    if (outcomeOf(current).kind !== 'playing') return;
    if (!isLegalMove(current, col)) {
      announce(live, t('column.isFull', { col: col + 1 }));
      return;
    }
    const before = state.moves.length;
    const next = playTurn(state, col);
    const replied = next.moves.length > before + 1;
    commit(next, describeMoves(next.moves, before), replied ? before + 1 : undefined);
  };

  const onUndo = () => {
    if (shown < state.moves.length || !canUndo(state)) return;
    commit(undo(state), t('undone'));
  };

  function changeOptions(options: RoundOptions) {
    const next = startRound(options);
    commit(next, `${t('newRound')} ${describeMoves(next.moves, 0)}`.trim());
  }

  /* ---------- Instance ---------- */
  return {
    newGame(options: NewGameOptions) {
      const difficulty = isOneOf(options.difficulty, DIFFICULTIES) ? options.difficulty : DEFAULT_DIFFICULTY;
      cancelReveal();
      pendingAnnouncement = '';
      // Opponent and "who starts" are in-game preferences and carry over to a new game.
      state = startRound({ seed: normalizeSeed(options.seed), difficulty, opponent: state.opponent, starter: state.starter });
      showAll();
    },
    restore(saved: ConnectFourState) {
      cancelReveal();
      pendingAnnouncement = '';
      state = cloneState(saved);
      showAll();
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
      showAll();
    },
    dispose() {
      cancelReveal();
      board.removeEventListener('keydown', onKey);
      clear(root);
    }
  };
}
