/**
 * A chessboard widget shared by the game board and the variation board: 64 labelled square
 * buttons (roving tabindex + arrow keys via `gridKeyboard`), markers that never rely on colour
 * alone, optional mouse drag, a promotion chooser and the figurine move list.
 */
import type { Translator } from '@wp/game-core';
import { gridKeyboard, h } from '@wp/ui';
import { FLAG_EP, fileOf, moveFlag, moveFrom, moveTo, parseFen, rankOf, squareName, type Color, type Position } from './rules';

/** Solid glyphs for both colours (shape is identical; colour and outline differ). U+FE0E forces text presentation. */
export const GLYPH = ['', '♟︎', '♞', '♝', '♜', '♛', '♚'] as const;
/** Outline glyphs, layered on white pieces so they stay distinguishable without colour (and in forced-colours mode). */
export const OUTLINE = ['', '♙', '♘', '♗', '♖', '♕', '♔'] as const;
/** Figurines for the move list (language-independent notation). */
const FIGURINE: Record<string, string> = { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘' };

export const figurine = (san: string): string => san.replace(/[KQRBN]/g, (letter) => FIGURINE[letter] ?? letter);

/** What a board shows besides the pieces. */
export interface BoardMarks {
  pos: Position;
  orientation: Color;
  /** Selected square (only meaningful while someone may move), or -1. */
  selected: number;
  /** Legal moves of the selected piece by target square. */
  targets: ReadonlyMap<number, readonly number[]>;
  /** The last move played (-1 = none). */
  last: number;
  /** Square of a king in check / checkmated, or -1. */
  checked: number;
  /** A suggested move to mark (-1 = none). */
  hint: number;
  /** Square holding the roving tab stop. */
  cursor: number;
}

export interface BoardOptions {
  t: Translator;
  /** Accessible name of the board. */
  label: string;
  /** Prefix for test ids (`''` → `board`, `sq-e2`; `'var-'` → `var-board`, `var-sq-e2`). */
  prefix: string;
  onSquare(sq: number): void;
  onFocus(sq: number): void;
  /** Whether a mouse drag may start on this square (own piece of the side that may move). */
  canDrag(sq: number): boolean;
  /** A mouse drag ended on another square. */
  onDrop(from: number, to: number): void;
}

export interface BoardView {
  element: HTMLDivElement;
  squares: HTMLButtonElement[];
  render(marks: BoardMarks): void;
  dispose(): void;
}

export function createBoard({ t, label, prefix, onSquare, onFocus, canDrag, onDrop }: BoardOptions): BoardView {
  const squares: HTMLButtonElement[] = [];
  const element = h('div', { class: 'ch-board', role: 'group', 'aria-label': label, 'data-testid': `${prefix}board`, dir: 'ltr' });
  for (let sq = 0; sq < 64; sq++) {
    const light = (fileOf(sq) + rankOf(sq)) % 2 === 1;
    squares.push(
      h('button', {
        type: 'button',
        class: `ch-sq ${light ? 'is-light' : 'is-dark'}`,
        'data-cell': '',
        'data-testid': `${prefix}sq-${squareName(sq)}`,
        'data-square': squareName(sq),
        tabindex: -1,
        onclick: () => onSquare(sq),
        onfocus: () => onFocus(sq)
      })
    );
  }
  const disposeKeys = gridKeyboard(element, 8);

  /* Mouse drag (optional): press on a piece, release on the target square. Tap/click and keyboard work the same way. */
  let dragFrom = -1;
  const onPointerDown = (event: PointerEvent) => {
    dragFrom = -1;
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    const sq = squares.indexOf((event.target as HTMLElement).closest('[data-square]') as HTMLButtonElement);
    if (sq >= 0 && canDrag(sq)) dragFrom = sq;
  };
  const onPointerUp = (event: PointerEvent) => {
    const from = dragFrom;
    dragFrom = -1;
    if (from < 0) return;
    const el = document.elementFromPoint?.(event.clientX, event.clientY)?.closest<HTMLElement>('[data-square]');
    const to = el ? squares.indexOf(el as HTMLButtonElement) : -1;
    if (to >= 0 && to !== from) onDrop(from, to);
  };
  element.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('pointerup', onPointerUp);

  const pieceName = (piece: number) => t(`piece.${Math.abs(piece)}`);
  const colorName = (piece: number) => t(piece > 0 ? 'color.w' : 'color.b');

  function render({ pos, orientation, selected, targets, last, checked, hint, cursor }: BoardMarks): void {
    const lastFrom = last < 0 ? -1 : moveFrom(last);
    const lastTo = last < 0 ? -1 : moveTo(last);
    const hintFrom = hint < 0 ? -1 : moveFrom(hint);
    const hintTo = hint < 0 ? -1 : moveTo(hint);
    // Visual order: rank 8 at the top for white's view; mirrored for black's.
    const order: number[] = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) order.push(orientation === 'w' ? (7 - row) * 8 + col : row * 8 + (7 - col));
    }
    const sep = t('separator');
    order.forEach((sq, index) => {
      const el = squares[sq]!;
      if (element.children[index] !== el) element.insertBefore(el, element.children[index] ?? null);
      const piece = pos.board[sq]!;
      const code = piece === 0 ? '' : `${piece > 0 ? 'w' : 'b'}${' PNBRQK'[Math.abs(piece)]!}`;
      if (el.dataset.piece !== code || el.dataset.orientation !== orientation) {
        el.dataset.piece = code;
        el.dataset.orientation = orientation;
        const parts: (HTMLElement | false)[] = [];
        if (piece) {
          const type = Math.abs(piece);
          parts.push(
            h(
              'span',
              { class: `ch-piece ${piece > 0 ? 'is-white' : 'is-black'}`, 'aria-hidden': 'true' },
              h('span', { class: 'ch-fill' }, GLYPH[type]!),
              piece > 0 && h('span', { class: 'ch-outline' }, OUTLINE[type]!)
            )
          );
        }
        const row = Math.floor(index / 8);
        const col = index % 8;
        if (row === 7) parts.push(h('span', { class: 'ch-coord ch-file', 'aria-hidden': 'true' }, 'abcdefgh'[fileOf(sq)]!));
        if (col === 0) parts.push(h('span', { class: 'ch-coord ch-rank', 'aria-hidden': 'true' }, String(rankOf(sq) + 1)));
        parts.push(h('span', { class: 'ch-marker', 'aria-hidden': 'true' }));
        el.replaceChildren(...parts.filter((p): p is HTMLElement => p !== false));
      }
      const target = targets.get(sq);
      const kind = target ? (piece !== 0 || target.some((m) => moveFlag(m) === FLAG_EP) ? 'capture' : 'move') : '';
      el.toggleAttribute('data-selected', sq === selected);
      el.dataset.target = kind;
      el.toggleAttribute('data-last', sq === lastFrom || sq === lastTo);
      el.toggleAttribute('data-check', sq === checked);
      el.toggleAttribute('data-hint', sq === hintFrom || sq === hintTo);
      el.setAttribute('aria-pressed', String(sq === selected));
      const parts = [piece ? t('sq.piece', { square: squareName(sq), piece: pieceName(piece), color: colorName(piece) }) : t('sq.empty', { square: squareName(sq) })];
      if (kind) parts.push(t(kind === 'capture' ? 'sq.capture' : 'sq.target'));
      if (sq === lastFrom || sq === lastTo) parts.push(t('sq.last'));
      if (sq === checked) parts.push(t('sq.check'));
      if (sq === hintFrom || sq === hintTo) parts.push(t('sq.hint'));
      el.setAttribute('aria-label', parts.join(sep));
      el.tabIndex = sq === cursor ? 0 : -1;
    });
  }

  return {
    element,
    squares,
    render,
    dispose() {
      disposeKeys();
      element.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointerup', onPointerUp);
    }
  };
}

export interface PromotionView {
  element: HTMLDivElement;
  first: HTMLButtonElement;
}

/** The "promote to" chooser (queen, rook, bishop, knight) with cancel; Escape cancels. */
export function createPromotion(t: Translator, prefix: string, onPick: (type: number) => void, onCancel: () => void): PromotionView {
  const buttons = [5, 4, 3, 2].map((type) =>
    h(
      'button',
      { type: 'button', class: 'ch-promo', 'data-testid': `${prefix}promote-${'  nbrq'[type]!}`, 'aria-label': t(`piece.${type}`), onclick: () => onPick(type) },
      h('span', { class: 'ch-glyph', 'aria-hidden': 'true' }, GLYPH[type]!),
      h('span', { class: 'ch-promo-label' }, t(`piece.${type}`))
    )
  );
  const element = h(
    'div',
    { class: 'ch-dialog', role: 'dialog', 'aria-modal': 'false', 'aria-label': t('promotion'), 'data-testid': `${prefix}promotion`, hidden: true },
    h('p', {}, t('promotion')),
    h('div', { class: 'ch-promo-row' }, ...buttons),
    h('button', { type: 'button', 'data-testid': `${prefix}promote-cancel`, onclick: () => onCancel() }, t('cancel'))
  );
  element.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  });
  return { element, first: buttons[0]! };
}

/**
 * Fills a move list (figurine notation, numbered from the start position). With `current`, the
 * ply shown on the board is marked (`aria-current` + a frame); later plies are marked as ahead.
 */
export function renderMoveList(list: HTMLElement, startFen: string, sans: readonly string[], emptyText: string, prefix = '', current?: number): void {
  const items: HTMLElement[] = [];
  const startPos = parseFen(startFen);
  const blackFirst = startPos?.side === -1;
  let number = startPos?.fullmove ?? 1;
  const ply = (i: number) =>
    h(
      'span',
      {
        class: `ch-ply${current !== undefined && i === current - 1 ? ' is-current' : ''}${current !== undefined && i >= current ? ' is-ahead' : ''}`,
        'data-testid': `${prefix}ply-${i}`,
        'aria-current': current !== undefined && i === current - 1 ? 'step' : undefined
      },
      figurine(sans[i]!)
    );
  for (let i = 0; i < sans.length; ) {
    const li = h('li', { value: number, class: 'ch-move' });
    li.append(h('span', { class: 'ch-num' }, `${number}.`));
    if (i === 0 && blackFirst) {
      li.append(h('span', { class: 'ch-ply' }, '…'), ply(i));
      i += 1;
    } else {
      li.append(ply(i));
      if (i + 1 < sans.length) li.append(ply(i + 1));
      i += 2;
    }
    items.push(li);
    number++;
  }
  list.replaceChildren(...items);
  if (items.length === 0) list.append(h('li', { class: 'ch-empty' }, emptyText));
  list.scrollTop = list.scrollHeight;
}
