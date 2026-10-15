/**
 * Board panel of Order & Chaos: a 6×6 board plus two toggle buttons choosing the symbol to place.
 *
 * Keyboard: arrow keys move on the board; X or O places that symbol on the focused cell at once;
 * Enter/Space places the chosen symbol.
 */
import { gridKeyboard, h } from '@wp/ui';
import type { Mark } from './rules';
import { OC_CELLS, OC_SIZE, ocBoardFromMoves, ocOutcome, roleOfMove, type OcMove, type OrderChaosState } from './order-chaos';
import { glyph, position, setMark, type PanelFactory } from './view-common';

const at = (i: number) => position(i, OC_SIZE);

export const createOrderChaosPanel: PanelFactory<OrderChaosState, OcMove> = (t, onMove) => {
  let symbol: Mark = 'X';

  const symbolButton = (mark: Mark) =>
    h('button', { type: 'button', class: 'ttt-symbol', 'data-testid': `symbol-${mark}`, 'data-mark': mark, onclick: () => choose(mark) }, glyph(mark), h('span', {}, t('oc.place', { mark })));
  const symbolX = symbolButton('X');
  const symbolO = symbolButton('O');
  const symbols = h('div', { class: 'ttt-symbols', role: 'group', 'aria-label': t('oc.symbol') }, symbolX, symbolO);

  const cells: HTMLButtonElement[] = [];
  const board = h('div', { class: 'ttt-board ttt-oc-board', role: 'group', 'aria-label': t('oc.board'), dir: 'ltr', 'data-testid': 'oc-board' });
  for (let i = 0; i < OC_CELLS; i++) {
    const cell = h('button', {
      type: 'button',
      class: 'ttt-cell',
      'data-cell': '',
      'data-testid': `oc-cell-${i}`,
      'data-mark': '',
      tabindex: i === 0 ? 0 : -1,
      'data-autofocus': i === 0,
      onclick: () => onMove({ cell: i, mark: symbol })
    });
    cells.push(cell);
    board.append(cell);
  }
  const disposeKeys = gridKeyboard(board, OC_SIZE);
  const onKey = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const key = event.key.toUpperCase();
    if (key !== 'X' && key !== 'O') return;
    const index = cells.indexOf(event.target as HTMLButtonElement);
    if (index < 0) return;
    event.preventDefault();
    choose(key);
    onMove({ cell: index, mark: key });
  };
  board.addEventListener('keydown', onKey);
  const hint = h('p', { class: 'ttt-keys' }, t('oc.keys'));
  const element = h('div', { class: 'ttt-oc', 'data-testid': 'order-chaos' }, symbols, board, hint);

  function choose(mark: Mark) {
    symbol = mark;
    symbolX.setAttribute('aria-pressed', String(mark === 'X'));
    symbolO.setAttribute('aria-pressed', String(mark === 'O'));
    board.dataset.symbol = mark;
  }
  choose('X');

  return {
    element,
    render(state, shown, busy) {
      const cellsNow = ocBoardFromMoves(state.moves.slice(0, shown));
      const outcome = ocOutcome(cellsNow);
      const winning = new Set<number>(outcome.kind === 'order' ? outcome.five.cells : []);
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
      board.setAttribute('aria-busy', String(busy));
      symbolX.disabled = !playable;
      symbolO.disabled = !playable;
    },
    status(state, shown) {
      const outcome = ocOutcome(ocBoardFromMoves(state.moves.slice(0, shown)));
      const vsComputer = state.opponent === 'computer';
      if (outcome.kind !== 'playing') {
        const reason = outcome.kind === 'order' ? t('oc.result.order', { mark: outcome.five.mark }) : t('oc.result.chaos');
        if (!vsComputer) return reason;
        return `${t(outcome.kind === state.role ? 'oc.youWon' : 'oc.youLost')} ${reason}`;
      }
      if (vsComputer) return t(state.role === 'order' ? 'oc.turn.youOrder' : 'oc.turn.youChaos');
      return t(roleOfMove(shown) === 'order' ? 'oc.turn.order' : 'oc.turn.chaos');
    },
    describe(state, from) {
      return state.moves
        .slice(from)
        .map(({ cell, mark }) => t('moved', { mark, ...at(cell) }))
        .join(' ');
    },
    dispose() {
      board.removeEventListener('keydown', onKey);
      disposeKeys();
    }
  };
};
