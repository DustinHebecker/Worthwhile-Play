/**
 * Board panel of "Board in board": a compact overview of all nine small boards plus a zoomed view of one
 * small board with full-size (≥ 44 px) cells. The forced board opens automatically; with a free choice the
 * player taps (or selects with the keyboard) a small board in the overview.
 *
 * Keyboard: arrow keys move inside the overview or the zoomed board, Enter/Space opens a board or plays a
 * cell, Escape returns from the zoomed board to the overview, and the digits 1–9 open small board 1–9.
 */
import { gridKeyboard, h } from '@wp/ui';
import { humanMark, markOfMove, SIZE, type Mark } from './rules';
import {
  NESTED_CELLS,
  SMALL_BOARDS,
  boardOfCell,
  cellOfCell,
  emptyNestedPosition,
  globalIndex,
  nestedFromMoves,
  nestedOutcome,
  playNested,
  playableBoards,
  type NestedPosition,
  type NestedState
} from './nested';
import { position, setMark, type PanelFactory } from './view-common';

const at = (i: number) => position(i, SIZE);

export const createNestedPanel: PanelFactory<NestedState, number> = (t, onMove) => {
  /** Small board shown in the zoomed view (UI only; derived again from the position after each move). */
  let zoom = 4;
  let lastPly = -1;
  let last: { state: NestedState; shown: number; busy: boolean } | undefined;

  /* ---------- Overview ---------- */
  const overview = h('div', { class: 'ttt-overview', role: 'group', 'aria-label': t('nested.board'), dir: 'ltr', 'data-testid': 'overview' });
  const minis: HTMLButtonElement[] = [];
  const miniCells: HTMLElement[] = [];
  const claimMarks: HTMLElement[] = [];
  const hereTags: HTMLElement[] = [];
  for (let b = 0; b < SMALL_BOARDS; b++) {
    const grid = h('span', { class: 'ttt-mini-grid', 'aria-hidden': 'true' });
    for (let i = 0; i < 9; i++) {
      const cell = h('span', { class: 'ttt-mini-cell', 'data-testid': `mini-cell-${globalIndex(b, i)}`, 'data-mark': '' });
      miniCells.push(cell);
      grid.append(cell);
    }
    const claim = h('span', { class: 'ttt-mini-claim', 'aria-hidden': 'true', 'data-mark': '' });
    const here = h('span', { class: 'ttt-here', 'aria-hidden': 'true', hidden: true }, t('nested.here'));
    const mini = h(
      'button',
      { type: 'button', class: 'ttt-mini', 'data-board': '', 'data-testid': `board-${b}`, tabindex: b === 4 ? 0 : -1, onclick: () => open(b) },
      grid,
      claim,
      here
    );
    minis.push(mini);
    claimMarks.push(claim);
    hereTags.push(here);
    overview.append(mini);
  }
  const disposeOverviewKeys = gridKeyboard(overview, SIZE, '[data-board]');

  /* ---------- Zoomed small board ---------- */
  const zoomTitle = h('p', { class: 'ttt-zoom-title', 'data-testid': 'zoom-title' });
  const zoomNote = h('p', { class: 'ttt-zoom-note', 'data-testid': 'zoom-note', hidden: true });
  const zoomBoard = h('div', { class: 'ttt-board ttt-zoom-board', role: 'group', dir: 'ltr', 'data-testid': 'zoom-board' });
  const zoomCells: HTMLButtonElement[] = [];
  for (let i = 0; i < 9; i++) {
    const cell = h('button', {
      type: 'button',
      class: 'ttt-cell',
      'data-cell': '',
      'data-testid': `zoom-cell-${i}`,
      'data-mark': '',
      tabindex: i === 0 ? 0 : -1,
      'data-autofocus': i === 0,
      onclick: () => onMove(globalIndex(zoom, i))
    });
    zoomCells.push(cell);
    zoomBoard.append(cell);
  }
  const disposeZoomKeys = gridKeyboard(zoomBoard, SIZE);
  const zoomPanel = h('div', { class: 'ttt-zoom' }, zoomTitle, zoomBoard, zoomNote);

  const element = h('div', { class: 'ttt-nested', 'data-testid': 'nested' }, overview, zoomPanel);

  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && zoomBoard.contains(event.target as Node)) {
      event.preventDefault();
      focusMini(zoom);
      return;
    }
    if (/^[1-9]$/.test(event.key) && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      open(Number(event.key) - 1);
    }
  };
  element.addEventListener('keydown', onKey);

  const focusMini = (b: number) => {
    for (const mini of minis) mini.tabIndex = -1;
    const mini = minis[b];
    if (!mini) return;
    mini.tabIndex = 0;
    mini.focus();
  };

  /** Moves the roving tab stop of the zoomed board to its first empty cell (or the first cell). */
  const resetZoomFocus = () => {
    const target = zoomCells.find((c) => c.dataset.mark === '') ?? zoomCells[0];
    for (const cell of zoomCells) cell.tabIndex = cell === target ? 0 : -1;
    return target;
  };

  function open(b: number) {
    zoom = b;
    if (last) draw(last.state, last.shown, last.busy);
    resetZoomFocus()?.focus();
  }

  const positionAt = (state: NestedState, shown: number): NestedPosition => nestedFromMoves(state.moves.slice(0, shown));

  const miniLabel = (b: number, pos: NestedPosition, playable: boolean): string => {
    const claim = pos.claims[b];
    if (claim === 'X' || claim === 'O') return t('nested.mini.claimed', { ...at(b), mark: claim });
    if (claim === 'draw') return t('nested.mini.full', at(b));
    return t(playable && pos.forced === b ? 'nested.mini.openHere' : 'nested.mini.open', at(b));
  };

  function draw(state: NestedState, shown: number, busy: boolean) {
    const pos = positionAt(state, shown);
    const outcome = nestedOutcome(pos);
    const playable = busy ? [] : playableBoards(pos);
    if (pos.ply !== lastPly) {
      // After a move, follow the game: open the forced board, or keep the current one while it is playable.
      lastPly = pos.ply;
      if (pos.forced !== null) zoom = pos.forced;
      else if (!playable.includes(zoom) && playable.length > 0) zoom = playable.includes(4) ? 4 : (playable[0] ?? zoom);
      resetZoomFocus();
    }
    const winning = new Set<number>(outcome.kind === 'won' ? outcome.line : []);

    for (let g = 0; g < NESTED_CELLS; g++) {
      const cell = miniCells[g];
      if (cell) setMark(cell, pos.cells[g] ?? '');
    }
    for (let b = 0; b < SMALL_BOARDS; b++) {
      const mini = minis[b]!;
      const claim = pos.claims[b] ?? '';
      const claimMark = claimMarks[b]!;
      const mark: Mark | '' = claim === 'X' || claim === 'O' ? claim : '';
      setMark(claimMark, mark);
      mini.dataset.claim = claim;
      const isTarget = playable.length === 1 && playable[0] === b && pos.forced === b;
      const isFree = playable.length > 1 && playable.includes(b);
      mini.classList.toggle('is-target', isTarget);
      mini.classList.toggle('is-free', isFree);
      mini.toggleAttribute('data-target', isTarget);
      hereTags[b]!.hidden = !isTarget;
      mini.classList.toggle('is-winning', winning.has(b));
      mini.toggleAttribute('data-winning', winning.has(b));
      mini.setAttribute('aria-current', String(b === zoom));
      mini.setAttribute('aria-label', miniLabel(b, pos, playable.length > 0));
    }

    const zoomPlayable = playable.includes(zoom);
    zoomBoard.setAttribute('aria-label', t('nested.small', at(zoom)));
    zoomBoard.setAttribute('aria-busy', String(busy));
    zoomBoard.dataset.board = String(zoom);
    zoomBoard.classList.toggle('is-target', zoomPlayable);
    zoomTitle.textContent = t(zoomPlayable ? 'nested.zoomTitle.play' : 'nested.zoomTitle', at(zoom));
    zoomNote.hidden = zoomPlayable || outcome.kind !== 'playing' || busy;
    zoomNote.textContent = t('nested.viewOnly');
    zoomCells.forEach((cell, i) => {
      const g = globalIndex(zoom, i);
      const mark = pos.cells[g] ?? '';
      setMark(cell, mark);
      cell.dataset.global = String(g);
      cell.setAttribute('aria-label', mark === '' ? t('cell.empty', at(i)) : t('cell.mark', { ...at(i), mark }));
      cell.setAttribute('aria-disabled', String(!(zoomPlayable && mark === '')));
    });
    // The claim of the zoomed board is visible there too (not only in the overview).
    zoomPanel.dataset.claim = pos.claims[zoom] ?? '';
  }

  return {
    element,
    render(state, shown, busy) {
      last = { state, shown, busy };
      draw(state, shown, busy);
    },
    status(state, shown) {
      const pos = positionAt(state, shown);
      const outcome = nestedOutcome(pos);
      const vsComputer = state.opponent === 'computer';
      if (outcome.kind === 'won') {
        if (!vsComputer) return t('nested.result.markWins', { mark: outcome.mark });
        return t(outcome.mark === humanMark(state.starter) ? 'nested.result.youWon' : 'nested.result.youLost');
      }
      if (outcome.kind === 'draw') return t('nested.result.draw');
      const turn = vsComputer ? t('turn.you', { mark: humanMark(state.starter) }) : t('turn.mark', { mark: pos.toMove });
      const where = pos.forced === null ? t('nested.where.free') : t('nested.where.forced', at(pos.forced));
      // Two lines: whose turn, then where to play.
      return `${turn}\n${where}`;
    },
    describe(state, from) {
      let pos = from === 0 ? emptyNestedPosition() : positionAt(state, from);
      const parts: string[] = [];
      state.moves.slice(from).forEach((g, n) => {
        const b = boardOfCell(g);
        const mark = markOfMove(from + n);
        const big = at(b);
        parts.push(t('nested.moved', { mark, brow: big.row, bcol: big.col, ...at(cellOfCell(g)) }));
        const before = pos.claims[b];
        pos = playNested(pos, g);
        const claim = pos.claims[b];
        if (before === '' && (claim === 'X' || claim === 'O')) parts.push(t('nested.claimed', { mark: claim, brow: big.row, bcol: big.col }));
        else if (before === '' && claim === 'draw') parts.push(t('nested.full', { brow: big.row, bcol: big.col }));
      });
      return parts.join(' ');
    },
    dispose() {
      element.removeEventListener('keydown', onKey);
      disposeOverviewKeys();
      disposeZoomKeys();
    }
  };
};
