/** DOM helpers shared by the three board panels. */
import type { Translator } from '@wp/game-core';
import type { Mark } from './rules';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value));
  return el;
}

/** Shape-based glyphs, so X and O differ by form and not only by colour. */
export function glyph(mark: Mark): SVGSVGElement {
  const root = svg('svg', { viewBox: '0 0 100 100', class: 'ttt-glyph', 'aria-hidden': 'true', focusable: 'false' });
  if (mark === 'X') {
    root.append(svg('line', { x1: 24, y1: 24, x2: 76, y2: 76 }), svg('line', { x1: 76, y1: 24, x2: 24, y2: 76 }));
  } else {
    root.append(svg('circle', { cx: 50, cy: 50, r: 28 }));
  }
  return root;
}

/** Sets the mark of a cell element (data-mark + glyph), redrawing only on change. */
export function setMark(el: HTMLElement, mark: Mark | ''): void {
  if (el.dataset.mark === mark) return;
  el.dataset.mark = mark;
  el.replaceChildren(...(mark ? [glyph(mark)] : []));
}

/** 1-based row and column of `index` on a grid with `size` columns. */
export const position = (index: number, size: number) => ({ row: Math.floor(index / size) + 1, col: (index % size) + 1 });

/** What a board panel offers to the game shell. */
export interface Panel<S> {
  readonly element: HTMLElement;
  /** Draws the first `shown` moves of `state`. `busy` while the computer's reply is still being revealed. */
  render(state: S, shown: number, busy: boolean): void;
  /** Status line for the first `shown` moves. */
  status(state: S, shown: number): string;
  /** Spoken description of the moves from index `from` on. */
  describe(state: S, from: number): string;
  dispose(): void;
}

export type PanelFactory<S, M> = (t: Translator, onMove: (move: M) => void) => Panel<S>;
