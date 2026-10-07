import type { GameContext, GameInstance, GameResult, NewGameOptions } from '@wp/game-core';
import { isOneOf, normalizeSeed } from '@wp/game-core';
import { announce, clear, gridKeyboard, h } from '@wp/ui';
import { playTurn, startRound } from './ai';
import {
  CELL_COUNT,
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  OPPONENTS,
  SIZE,
  STARTERS,
  boardFromMoves,
  canUndo,
  humanMark,
  isLegalMove,
  markOfMove,
  outcomeOf,
  toMove,
  undo,
  type Mark,
  type Outcome,
  type RoundOptions,
  type TicTacToeState
} from './rules';
import './styles.css';

/** Short pause before the computer's reply becomes visible (skipped with reduced motion). */
export const COMPUTER_REVEAL_MS = 350;

const SVG_NS = 'http://www.w3.org/2000/svg';

function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value));
  return el;
}

/** Shape-based glyphs, so X and O differ by form and not only by colour. */
function glyph(mark: Mark): SVGSVGElement {
  const root = svg('svg', { viewBox: '0 0 100 100', class: 'ttt-glyph', 'aria-hidden': 'true', focusable: 'false' });
  if (mark === 'X') {
    root.append(svg('line', { x1: 24, y1: 24, x2: 76, y2: 76 }), svg('line', { x1: 76, y1: 24, x2: 24, y2: 76 }));
  } else {
    root.append(svg('circle', { cx: 50, cy: 50, r: 28 }));
  }
  return root;
}

const cloneState = (state: TicTacToeState): TicTacToeState => ({ ...state, moves: [...state.moves] });

const optionsOf = (state: TicTacToeState): RoundOptions => ({
  seed: state.seed,
  difficulty: state.difficulty,
  opponent: state.opponent,
  starter: state.starter
});

export function createTicTacToe(context: GameContext): GameInstance<TicTacToeState> {
  const { t, root } = context;
  let state: TicTacToeState = startRound({ seed: 0, difficulty: DEFAULT_DIFFICULTY, opponent: 'computer', starter: 'human' });
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
  const opponentSelect = select('opponent', OPPONENTS, (v) => t(`opponent.${v}`), (v) => {
    if (isOneOf(v, OPPONENTS)) changeOptions({ ...optionsOf(state), opponent: v });
  });
  const starterSelect = select('starter', STARTERS, (v) => t(`starter.${v}`), (v) => {
    if (isOneOf(v, STARTERS)) changeOptions({ ...optionsOf(state), starter: v });
  });
  const strengthSelect = select('strength', DIFFICULTIES, (v) => t(`difficulty.${v}`), (v) => {
    if (isOneOf(v, DIFFICULTIES)) changeOptions({ ...optionsOf(state), difficulty: v });
  });
  const field = (label: string, control: HTMLSelectElement) => h('label', { class: 'ttt-field' }, h('span', {}, label), control);
  const starterField = field(t('starter'), starterSelect);
  const strengthField = field(t('strength'), strengthSelect);

  const undoButton = h('button', { type: 'button', 'data-testid': 'undo', onclick: () => onUndo() }, t('undo'));
  const restartButton = h('button', { type: 'button', 'data-testid': 'restart', onclick: () => changeOptions(optionsOf(state)) }, t('restart'));

  const status = h('p', { class: 'wp-status ttt-status', 'data-testid': 'status' });
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'announcer' });

  const cells: HTMLButtonElement[] = [];
  const board = h('div', { class: 'ttt-board', role: 'group', 'aria-label': t('board'), dir: 'ltr', 'data-testid': 'board' });
  for (let i = 0; i < CELL_COUNT; i++) {
    const cell = h('button', {
      type: 'button',
      class: 'ttt-cell',
      'data-cell': '',
      'data-testid': `cell-${i}`,
      'data-mark': '',
      tabindex: i === 0 ? 0 : -1,
      onclick: () => onCell(i)
    });
    cells.push(cell);
    board.append(cell);
  }
  const strikeLine = svg('line', { x1: 0, y1: 0, x2: 0, y2: 0 });
  const strike = svg('svg', { class: 'ttt-strike', viewBox: '0 0 3 3', 'aria-hidden': 'true', focusable: 'false', 'data-testid': 'strike' });
  strike.append(strikeLine);
  board.append(strike);
  const disposeKeyboard = gridKeyboard(board, SIZE);

  const container = h(
    'div',
    { class: `wp-tic-tac-toe${context.reducedMotion ? ' ttt-reduced' : ''}`, dir: t.direction },
    h('div', { class: 'ttt-toolbar' }, field(t('opponent'), opponentSelect), starterField, strengthField),
    status,
    board,
    h('div', { class: 'ttt-actions' }, undoButton, restartButton),
    live
  );
  root.append(container);

  /* ---------- Rendering ---------- */
  const position = (index: number) => ({ row: Math.floor(index / SIZE) + 1, col: (index % SIZE) + 1 });

  const statusText = (outcome: Outcome, nextMark: Mark, revealing: boolean): string => {
    if (revealing) return t('thinking');
    const vsComputer = state.opponent === 'computer';
    if (outcome.kind === 'won') {
      if (!vsComputer) return t('result.markWins', { mark: outcome.win.mark });
      return outcome.win.mark === humanMark(state.starter) ? t('result.youWon') : t('result.youLost');
    }
    if (outcome.kind === 'draw') return t('result.draw');
    return vsComputer ? t('turn.you', { mark: humanMark(state.starter) }) : t('turn.mark', { mark: nextMark });
  };

  const render = () => {
    const revealing = shown < state.moves.length;
    const cellsNow = boardFromMoves(state.moves.slice(0, shown));
    const outcome = outcomeOf(cellsNow);
    const winning = new Set<number>(outcome.kind === 'won' ? outcome.win.line : []);
    const nextMark = toMove(cellsNow);
    const playable = !revealing && outcome.kind === 'playing';

    cells.forEach((cell, i) => {
      const mark = cellsNow[i] ?? '';
      if (cell.dataset.mark !== mark) {
        cell.dataset.mark = mark;
        cell.replaceChildren(...(mark ? [glyph(mark)] : []));
      }
      const { row, col } = position(i);
      const isWinning = winning.has(i);
      cell.classList.toggle('is-winning', isWinning);
      cell.toggleAttribute('data-winning', isWinning);
      cell.setAttribute('aria-label', mark === '' ? t('cell.empty', { row, col }) : t(isWinning ? 'cell.winning' : 'cell.mark', { row, col, mark }));
      cell.setAttribute('aria-disabled', String(!(playable && mark === '')));
    });

    if (outcome.kind === 'won') {
      const [a, , c] = outcome.win.line;
      const from = position(a);
      const to = position(c);
      const [x1, y1, x2, y2] = [from.col - 0.5, from.row - 0.5, to.col - 0.5, to.row - 0.5];
      const len = Math.hypot(x2 - x1, y2 - y1);
      const ext = 0.38 / len;
      strikeLine.setAttribute('x1', String(x1 - (x2 - x1) * ext));
      strikeLine.setAttribute('y1', String(y1 - (y2 - y1) * ext));
      strikeLine.setAttribute('x2', String(x2 + (x2 - x1) * ext));
      strikeLine.setAttribute('y2', String(y2 + (y2 - y1) * ext));
      strike.removeAttribute('hidden');
    } else {
      strike.setAttribute('hidden', '');
    }

    status.textContent = statusText(outcome, nextMark, revealing);
    container.dataset.outcome = outcome.kind;
    container.dataset.turn = nextMark;
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
    if (pendingAnnouncement) announce(live, `${pendingAnnouncement} ${status.textContent ?? ''}`.trim());
    pendingAnnouncement = '';
  };

  /** Spoken description of `moves[from..]`. */
  const describeMoves = (moves: readonly number[], from: number) =>
    moves
      .slice(from)
      .map((index, n) => t('moved', { mark: markOfMove(from + n), ...position(index) }))
      .join(' ');

  /* ---------- Transitions ---------- */
  const resultOf = (outcome: Outcome): GameResult => {
    const stats = { moves: state.moves.length };
    if (outcome.kind === 'draw') return { outcome: 'draw', stats };
    if (state.opponent === 'human' || outcome.kind !== 'won') return { outcome: 'completed', stats };
    return { outcome: outcome.win.mark === humanMark(state.starter) ? 'won' : 'lost', stats };
  };

  const commit = (next: TicTacToeState, announcement: string, revealFrom?: number) => {
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

  const onCell = (index: number) => {
    if (shown < state.moves.length) return;
    const current = boardFromMoves(state.moves);
    if (outcomeOf(current).kind !== 'playing' || !isLegalMove(current, index)) return;
    const before = state.moves.length;
    const next = playTurn(state, index);
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
    restore(saved: TicTacToeState) {
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
      disposeKeyboard();
      clear(root);
    }
  };
}
