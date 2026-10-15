import './cards.css';
import type { Card } from './model';
import { cardSvgMarkup, type CardMarkupOptions } from './svg';

export type CardRenderOptions = CardMarkupOptions;

/**
 * Renders one card (`null` = face down) as an `<svg>` element. Size it with CSS
 * (`width` on the element or `--wp-card-w` on a parent; the height follows the 5:7 ratio).
 * Importing this module loads `cards.css`.
 */
export function renderCard(card: Card | null, options: CardRenderOptions = {}, doc: Document = document): SVGSVGElement {
  const template = doc.createElement('template');
  template.innerHTML = cardSvgMarkup(card, options);
  return template.content.firstElementChild as SVGSVGElement;
}
