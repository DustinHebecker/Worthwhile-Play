/**
 * Game shell: options (variant, opponent, who starts / role, strength), status line, undo / new round,
 * live region and the delayed reveal of the computer's reply. The board of the chosen variant is drawn by
 * its panel (view-classic.ts, view-nested.ts, view-order-chaos.ts).
 */
import type { GameContext, GameInstance, GameResult, NewGameOptions } from '@wp/game-core';
import { isOneOf, isRecord, normalizeSeed } from '@wp/game-core';
import { announce, clear, h } from '@wp/ui';
import { playTurn, startRound } from './ai';
import { playNestedTurn, startNestedRound } from './nested-ai';
import { playOcTurn, startOcRound } from './order-chaos-ai';
import {
  DEFAULT_DIFFICULTY,
  DIFFICULTIES,
  OPPONENTS,
  STARTERS,
  boardFromMoves,
  canUndo,
  humanMark,
  isLegalMove,
  outcomeOf,
  undo,
  type Difficulty,
  type Opponent,
  type Starter
} from './rules';
import { canUndoNested, isNestedLegal, nestedFromMoves, nestedOutcome, undoNested } from './nested';
import { ROLES, canUndoOc, isOcCellFree, ocBoardFromMoves, ocOutcome, undoOc, type Role } from './order-chaos';
import { VARIANTS, type TicTacToeState, type Variant } from './state';
import type { Panel } from './view-common';
import { createClassicPanel } from './view-classic';
import { createNestedPanel } from './view-nested';
import { createOrderChaosPanel } from './view-order-chaos';
import './styles.css';

/** Short pause before the computer's reply becomes visible (skipped with reduced motion). */
export const COMPUTER_REVEAL_MS = 350;

/** Per-device options remembered in `context.preferences` (never game state). */
export const PREFERENCES_KEY = 'setup';

export interface Setup {
  variant: Variant;
  opponent: Opponent;
  /** Who plays X in the classic and nested games against the computer. */
  starter: Starter;
  /** The person's role in Order & Chaos against the computer. */
  role: Role;
}

const DEFAULT_SETUP: Setup = { variant: 'classic', opponent: 'computer', starter: 'human', role: 'order' };

/** Reads remembered options, accepting each valid field and ignoring anything else. */
export function readSetup(value: unknown): Setup {
  const setup = { ...DEFAULT_SETUP };
  if (!isRecord(value)) return setup;
  if (isOneOf(value.variant, VARIANTS)) setup.variant = value.variant;
  if (isOneOf(value.opponent, OPPONENTS)) setup.opponent = value.opponent;
  if (isOneOf(value.starter, STARTERS)) setup.starter = value.starter;
  if (isOneOf(value.role, ROLES)) setup.role = value.role;
  return setup;
}

/** A fresh round of the chosen variant, including the computer's opening move if it starts. */
export function startVariant(setup: Setup, seed: number, difficulty: Difficulty): TicTacToeState {
  const { opponent, starter, role } = setup;
  switch (setup.variant) {
    case 'classic':
      return startRound({ seed, difficulty, opponent, starter });
    case 'nested':
      return startNestedRound({ seed, difficulty, opponent, starter });
    case 'order-chaos':
      return startOcRound({ seed, difficulty, opponent, role });
  }
}

const clone = (state: TicTacToeState): TicTacToeState => JSON.parse(JSON.stringify(state)) as TicTacToeState;

/** Is the game still running after its first `shown` moves? */
function isRunning(state: TicTacToeState, shown = state.moves.length): boolean {
  switch (state.variant) {
    case 'classic':
      return outcomeOf(boardFromMoves(state.moves.slice(0, shown))).kind === 'playing';
    case 'nested':
      return nestedOutcome(nestedFromMoves(state.moves.slice(0, shown))).kind === 'playing';
    case 'order-chaos':
      return ocOutcome(ocBoardFromMoves(state.moves.slice(0, shown))).kind === 'playing';
  }
}

/** Result reported to the host when a game has ended. */
export function resultOf(state: TicTacToeState): GameResult {
  const stats = { moves: state.moves.length };
  const vsComputer = state.opponent === 'computer';
  switch (state.variant) {
    case 'classic': {
      const outcome = outcomeOf(boardFromMoves(state.moves));
      if (outcome.kind === 'draw') return { outcome: 'draw', stats };
      if (!vsComputer || outcome.kind !== 'won') return { outcome: 'completed', stats };
      return { outcome: outcome.win.mark === humanMark(state.starter) ? 'won' : 'lost', stats };
    }
    case 'nested': {
      const outcome = nestedOutcome(nestedFromMoves(state.moves));
      if (outcome.kind === 'draw') return { outcome: 'draw', stats };
      if (!vsComputer || outcome.kind !== 'won') return { outcome: 'completed', stats };
      return { outcome: outcome.mark === humanMark(state.starter) ? 'won' : 'lost', stats };
    }
    case 'order-chaos': {
      const outcome = ocOutcome(ocBoardFromMoves(state.moves));
      if (!vsComputer || outcome.kind === 'playing') return { outcome: 'completed', stats };
      return { outcome: outcome.kind === state.role ? 'won' : 'lost', stats };
    }
  }
}

function canUndoState(state: TicTacToeState): boolean {
  switch (state.variant) {
    case 'classic':
      return canUndo(state);
    case 'nested':
      return canUndoNested(state);
    case 'order-chaos':
      return canUndoOc(state);
  }
}

function undoState(state: TicTacToeState): TicTacToeState {
  switch (state.variant) {
    case 'classic':
      return undo(state);
    case 'nested':
      return undoNested(state);
    case 'order-chaos':
      return undoOc(state);
  }
}

export function createTicTacToe(context: GameContext): GameInstance<TicTacToeState> {
  const { t, root } = context;
  let setup = readSetup(context.preferences?.get(PREFERENCES_KEY));
  let state: TicTacToeState = startVariant(setup, 0, DEFAULT_DIFFICULTY);
  /** Number of moves currently drawn; lags behind `state.moves` only while the computer's reply is being revealed. */
  let shown = 0;
  let revealTimer: ReturnType<typeof setTimeout> | undefined;
  let pendingAnnouncement = '';

  /* ---------- Options ---------- */
  const select = (name: string, values: readonly string[], label: (value: string) => string, onChange: (value: string) => void) => {
    const el = h('select', { 'data-testid': `option-${name}`, onchange: () => onChange(el.value) });
    for (const value of values) el.append(h('option', { value }, label(value)));
    return el;
  };
  const variantSelect = select('variant', VARIANTS, (v) => t(`variant.${v}`), (v) => {
    if (isOneOf(v, VARIANTS)) changeSetup({ ...setup, variant: v });
  });
  const opponentSelect = select('opponent', OPPONENTS, (v) => t(`opponent.${v}`), (v) => {
    if (isOneOf(v, OPPONENTS)) changeSetup({ ...setup, opponent: v });
  });
  const starterSelect = select('starter', STARTERS, (v) => t(`starter.${v}`), (v) => {
    if (isOneOf(v, STARTERS)) changeSetup({ ...setup, starter: v });
  });
  const roleSelect = select('role', ROLES, (v) => t(`role.${v}`), (v) => {
    if (isOneOf(v, ROLES)) changeSetup({ ...setup, role: v });
  });
  const strengthSelect = select('strength', DIFFICULTIES, (v) => t(`difficulty.${v}`), (v) => {
    if (!isOneOf(v, DIFFICULTIES)) return;
    context.setDifficulty?.(v);
    startFresh(startVariant(setup, state.seed, v));
  });
  const field = (label: string, control: HTMLSelectElement) => h('label', { class: 'ttt-field' }, h('span', {}, label), control);
  const starterField = field(t('starter'), starterSelect);
  const roleField = field(t('role'), roleSelect);
  const strengthField = field(t('strength'), strengthSelect);
  const hint = h('p', { class: 'ttt-hint', 'data-testid': 'variant-hint' });

  const undoButton = h('button', { type: 'button', 'data-testid': 'undo', onclick: () => onUndo() }, t('undo'));
  const restartButton = h('button', { type: 'button', 'data-testid': 'restart', onclick: () => startFresh(startVariant(setup, state.seed, state.difficulty)) }, t('restart'));

  const status = h('p', { class: 'wp-status ttt-status', 'data-testid': 'status' });
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite', role: 'status', 'data-testid': 'announcer' });
  const boardSlot = h('div', { class: 'ttt-slot' });

  const container = h(
    'div',
    { class: `wp-tic-tac-toe${context.reducedMotion ? ' ttt-reduced' : ''}`, dir: t.direction },
    h('div', { class: 'ttt-toolbar' }, field(t('variant'), variantSelect), field(t('opponent'), opponentSelect), starterField, roleField, strengthField),
    hint,
    status,
    boardSlot,
    h('div', { class: 'ttt-actions' }, undoButton, restartButton),
    live
  );
  root.append(container);

  /* ---------- Board panel of the current variant ---------- */
  let panelVariant: Variant | undefined;
  let panel: Panel<TicTacToeState> | undefined;

  const onMove = (move: unknown) => {
    if (shown < state.moves.length || !isRunning(state)) return;
    const before = state.moves.length;
    let next: TicTacToeState;
    if (state.variant === 'classic') {
      if (typeof move !== 'number' || !isLegalMove(boardFromMoves(state.moves), move)) return;
      next = playTurn(state, move);
    } else if (state.variant === 'nested') {
      if (typeof move !== 'number' || !isNestedLegal(nestedFromMoves(state.moves), move)) return;
      next = playNestedTurn(state, move);
    } else {
      if (!isRecord(move) || typeof move.cell !== 'number' || (move.mark !== 'X' && move.mark !== 'O')) return;
      if (!isOcCellFree(ocBoardFromMoves(state.moves), move.cell)) return;
      next = playOcTurn(state, { cell: move.cell, mark: move.mark });
    }
    const replied = next.moves.length > before + 1;
    commit(next, describe(next, before), replied ? before + 1 : undefined);
  };

  const ensurePanel = (): Panel<TicTacToeState> => {
    if (panel && panelVariant === state.variant) return panel;
    panel?.dispose();
    panelVariant = state.variant;
    // Each factory is typed for its own state; the shell only ever passes states of `panelVariant`.
    const factory =
      state.variant === 'classic' ? createClassicPanel : state.variant === 'nested' ? createNestedPanel : createOrderChaosPanel;
    panel = (factory as unknown as (tr: typeof t, cb: (move: unknown) => void) => Panel<TicTacToeState>)(t, onMove);
    boardSlot.replaceChildren(panel.element);
    return panel;
  };

  const describe = (s: TicTacToeState, from: number) => ensurePanel().describe(s, from);

  /* ---------- Rendering ---------- */
  const render = () => {
    const current = ensurePanel();
    const revealing = shown < state.moves.length;
    current.render(state, shown, revealing);
    status.textContent = revealing ? t('thinking') : current.status(state, shown);
    container.dataset.variant = state.variant;
    container.dataset.outcome = isRunning(state, shown) ? 'playing' : 'over';
    container.dataset.opponent = state.opponent;

    variantSelect.value = state.variant;
    opponentSelect.value = state.opponent;
    starterSelect.value = setup.starter;
    roleSelect.value = setup.role;
    strengthSelect.value = state.difficulty;
    const vsComputer = state.opponent === 'computer';
    starterField.hidden = !vsComputer || state.variant === 'order-chaos';
    roleField.hidden = !vsComputer || state.variant !== 'order-chaos';
    strengthField.hidden = !vsComputer;
    hint.textContent = t(`hint.${state.variant}`);
    undoButton.disabled = revealing || !canUndoState(state);
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

  /** Keeps the options of a state (restored or new) as the current setup. */
  const adoptSetup = (s: TicTacToeState) => {
    setup = { ...setup, variant: s.variant, opponent: s.opponent, ...(s.variant === 'order-chaos' ? { role: s.role } : { starter: s.starter }) };
  };

  /* ---------- Transitions ---------- */
  function commit(next: TicTacToeState, announcement: string, revealFrom?: number) {
    const wasPlaying = isRunning(state) && state.variant === next.variant;
    state = next;
    context.requestSave();
    if (wasPlaying && !isRunning(state)) context.finished(resultOf(state));
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
  }

  const onUndo = () => {
    if (shown < state.moves.length || !canUndoState(state)) return;
    commit(undoState(state), t('undone'));
  };

  function changeSetup(next: Setup) {
    setup = next;
    context.preferences?.set(PREFERENCES_KEY, { ...setup });
    startFresh(startVariant(setup, state.seed, state.difficulty));
  }

  /** Switches to a fresh round (same or other variant) and announces it with the computer's opening move. */
  function startFresh(fresh: TicTacToeState) {
    // The panel of a new variant must exist before its moves can be described.
    state = fresh;
    commit(fresh, `${t('newRound')} ${describe(fresh, 0)}`.trim());
  }

  /* ---------- Instance ---------- */
  return {
    newGame(options: NewGameOptions) {
      const difficulty = isOneOf(options.difficulty, DIFFICULTIES) ? options.difficulty : DEFAULT_DIFFICULTY;
      cancelReveal();
      pendingAnnouncement = '';
      // Variant, opponent, "who starts" and role are in-game preferences and carry over to a new game.
      state = startVariant(setup, normalizeSeed(options.seed), difficulty);
      showAll();
    },
    restore(saved: TicTacToeState) {
      cancelReveal();
      pendingAnnouncement = '';
      state = clone(saved);
      adoptSetup(state);
      showAll();
    },
    serialize: () => clone(state),
    pause() {
      // Never leave the display behind the logical state.
      if (revealTimer !== undefined) showAll();
    },
    resume() {},
    reset() {
      cancelReveal();
      pendingAnnouncement = '';
      state = startVariant(setup, state.seed, state.difficulty);
      context.requestSave();
      showAll();
    },
    dispose() {
      cancelReveal();
      panel?.dispose();
      clear(root);
    }
  };
}
