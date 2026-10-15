/** Board panel of the classic 3×3 game. */
import { gridKeyboard, h } from '@wp/ui';
import { CELL_COUNT, SIZE, boardFromMoves, humanMark, markOfMove, outcomeOf, toMove, type ClassicState } from './rules';
import { position, setMark, svg, type PanelFactory } from './view-common';

export const createClassicPanel: PanelFactory<ClassicState, number> = (t, onMove) => {
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
      // After "New game" the host focuses this element, so play starts on the board.
      'data-autofocus': i === 0,
      onclick: () => onMove(i)
    });
    cells.push(cell);
    board.append(cell);
  }
  const strikeLine = svg('line', { x1: 0, y1: 0, x2: 0, y2: 0 });
  const strike = svg('svg', { class: 'ttt-strike', viewBox: '0 0 3 3', 'aria-hidden': 'true', focusable: 'false', 'data-testid': 'strike' });
  strike.append(strikeLine);
  board.append(strike);
  const disposeKeyboard = gridKeyboard(board, SIZE);
  const at = (i: number) => position(i, SIZE);

  return {
    element: board,
    render(state, shown, busy) {
      const cellsNow = boardFromMoves(state.moves.slice(0, shown));
      const outcome = outcomeOf(cellsNow);
      const winning = new Set<number>(outcome.kind === 'won' ? outcome.win.line : []);
      const playable = !busy && outcome.kind === 'playing';
      cells.forEach((cell, i) => {
        const mark = cellsNow[i] ?? '';
        setMark(cell, mark);
        const isWinning = winning.has(i);
        cell.classList.toggle('is-winning', isWinning);
        cell.toggleAttribute('data-winning', isWinning);
        cell.setAttribute('aria-label', mark === '' ? t('cell.empty', at(i)) : t(isWinning ? 'cell.winning' : 'cell.mark', { ...at(i), mark }));
        cell.setAttribute('aria-disabled', String(!(playable && mark === '')));
      });
      if (outcome.kind === 'won') {
        const [a, , c] = outcome.win.line;
        const from = at(a);
        const to = at(c);
        const [x1, y1, x2, y2] = [from.col - 0.5, from.row - 0.5, to.col - 0.5, to.row - 0.5];
        const ext = 0.38 / Math.hypot(x2 - x1, y2 - y1);
        strikeLine.setAttribute('x1', String(x1 - (x2 - x1) * ext));
        strikeLine.setAttribute('y1', String(y1 - (y2 - y1) * ext));
        strikeLine.setAttribute('x2', String(x2 + (x2 - x1) * ext));
        strikeLine.setAttribute('y2', String(y2 + (y2 - y1) * ext));
        strike.removeAttribute('hidden');
      } else {
        strike.setAttribute('hidden', '');
      }
      board.setAttribute('aria-busy', String(busy));
    },
    status(state, shown) {
      const cellsNow = boardFromMoves(state.moves.slice(0, shown));
      const outcome = outcomeOf(cellsNow);
      const vsComputer = state.opponent === 'computer';
      if (outcome.kind === 'won') {
        if (!vsComputer) return t('result.markWins', { mark: outcome.win.mark });
        return outcome.win.mark === humanMark(state.starter) ? t('result.youWon') : t('result.youLost');
      }
      if (outcome.kind === 'draw') return t('result.draw');
      return vsComputer ? t('turn.you', { mark: humanMark(state.starter) }) : t('turn.mark', { mark: toMove(cellsNow) });
    },
    describe(state, from) {
      return state.moves
        .slice(from)
        .map((index, n) => t('moved', { mark: markOfMove(from + n), ...at(index) }))
        .join(' ');
    },
    dispose: disposeKeyboard
  };
};
