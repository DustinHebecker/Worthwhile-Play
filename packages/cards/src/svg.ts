import type { Translator } from '@wp/game-core';
import { cardLabel, rankIndex } from './messages';
import { rankOf, suitOf, type Card, type Rank, type Suit, type SuitSet } from './model';

/**
 * Card faces drawn in code. All shapes are original and deliberately plain: geometric pips,
 * abstract court emblems (crown, coronet, chevrons) instead of figures, and a dotted back.
 *
 * Coordinates: viewBox 0 0 250 350 (5:7). Pips are authored in a 100×100 box.
 * Colours come from CSS custom properties (`cards.css`) through classes and `currentColor`;
 * the presentation attributes are only fallbacks for when the stylesheet is missing.
 */
export const CARD_WIDTH = 250;
export const CARD_HEIGHT = 350;

export type CardStyle = 'full' | 'index';
export type CardColors = 'two' | 'four';

export interface CardMarkupOptions {
  /** Pictures and names: 'french' (default) or 'german'. */
  suits?: SuitSet;
  /** 'two' (default for French: black/red) or 'four' (default for German: every suit its own colour). */
  colors?: CardColors;
  /**
   * 'full' (default): corner indices top-left and bottom-right (rotated) plus the pip layout.
   * 'index': a compact face for overlapping fans — large rank + suit in both top corners (so the
   * visible strip shows it in LTR and RTL fans) and one big pip below.
   */
  style?: CardStyle;
  /** Translator for localized corner letters and the accessible name. */
  t?: Translator;
  /**
   * Accessible name. Default: `cardLabel(card, t)` when `t` is given. `false` makes the SVG decorative
   * (`aria-hidden`), e.g. when a surrounding button carries the name.
   */
  label?: string | false;
  /** Extra classes on the root element. */
  className?: string;
}

const circle = (cx: number, cy: number, r: number) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
const CUT = 'class="wp-pc-cut" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"';

const HEART = '<path d="M50 90C30 74 6 56 6 32C6 17 17 7 30 7C39 7 46 12 50 20C54 12 61 7 70 7C83 7 94 17 94 32C94 56 70 74 50 90Z"/>';

/** Pip artwork per suit set and suit, in a 100×100 box, filled with currentColor. */
const PIPS: Readonly<Record<SuitSet, Readonly<Record<Suit, string>>>> = {
  french: {
    S: '<path d="M50 4C62 22 92 38 92 60C92 74 82 82 71 82C63 82 57 78 53 72C54 82 58 90 66 96H34C42 90 46 82 47 72C43 78 37 82 29 82C18 82 8 74 8 60C8 38 38 22 50 4Z"/>',
    H: HEART,
    D: '<path d="M50 4C60 20 72 36 88 50C72 64 60 80 50 96C40 80 28 64 12 50C28 36 40 20 50 4Z"/>',
    C: circle(50, 27, 19) + circle(28, 56, 19) + circle(72, 56, 19) + circle(50, 50, 12) +
      '<path d="M46 56C46 74 42 87 32 96H68C58 87 54 74 54 56Z"/>'
  },
  german: {
    // Acorn: stalk, scaled cap and nut, separated by a gap so the silhouette reads without colour.
    C: '<rect x="45" y="3" width="10" height="16" rx="4"/>' +
      '<path d="M16 44C16 26 31 15 50 15C69 15 84 26 84 44Z"/>' +
      '<path d="M25 50H75C75 74 64 92 50 97C36 92 25 74 25 50Z"/>' +
      `<path ${CUT} stroke-width="4" d="M30 30L40 42M46 21L56 36M62 24L72 37"/>`,
    // Leaf: pointed blade with a short stalk and cut-out veins.
    S: '<path d="M50 3C70 18 91 37 88 60C86 77 71 87 55 88V97H45V88C29 87 14 77 12 60C9 37 30 18 50 3Z"/>' +
      `<path ${CUT} stroke-width="4" d="M50 18V84M50 40L35 29M50 40L65 29M50 58L29 46M50 58L71 46M50 75L35 66M50 75L65 66"/>`,
    H: HEART,
    // Bell: round body with a ring, a band and a slot.
    D: '<circle cx="50" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="6"/>' +
      circle(50, 56, 37) +
      `<path ${CUT} stroke-width="5" d="M15 50Q50 62 85 50M50 76V92"/>` +
      `<circle class="wp-pc-cut-fill" fill="#fff" cx="50" cy="76" r="6"/>`
  }
};

// King: a pointed crown (shared by both suit sets).
const KING = '<path d="M-38 20V-14L-19 2L0-22L19 2L38-14V20Z"/>' + circle(-38, -20, 5) + circle(0, -28, 6) + circle(38, -20, 5);

/** Abstract court emblems, centred on 0,0, about 80 units wide. */
const EMBLEMS: Readonly<Record<SuitSet, Readonly<Record<'J' | 'Q' | 'K', string>>>> = {
  french: {
    // Jack: a chevron cap with a knob.
    J: '<path d="M-36 18L0-18L36 18H21L0-3L-21 18Z"/>' + circle(0, -26, 7),
    // Queen: a coronet with rounded tips.
    Q: '<path d="M-34 20L-30-2H30L34 20Z"/>' + circle(-24, -12, 7) + circle(0, -17, 8) + circle(24, -12, 7),
    K: KING
  },
  german: {
    // Unter ("lower"): a chevron pointing down.
    J: '<path d="M-36-18L0 18L36-18H21L0 3L-21-18Z"/>' + circle(0, 26, 7),
    // Ober ("upper"): a double chevron pointing up.
    Q: '<path d="M-36 4L0-26L36 4H22L0-12L-22 4Z"/><path d="M-36 26L0-4L36 26H22L0 10L-22 26Z"/>',
    K: KING
  }
};

const n = (value: number) => String(Math.round(value * 100) / 100);

function pip(set: SuitSet, suit: Suit, cx: number, cy: number, size: number, flip = false): string {
  const s = size / 100;
  const rotate = flip ? ` rotate(180 ${n(cx)} ${n(cy)})` : '';
  return `<g transform="${rotate.trim()} translate(${n(cx - size / 2)} ${n(cy - size / 2)}) scale(${n(s)})">${PIPS[set][suit]}</g>`;
}

const COL = { L: 80, M: 125, R: 170 } as const;
const TOP = 80;
const BOTTOM = 270;
const MID = 175;
const ROW4 = [80, 143.3, 206.7, 270] as const;

/** Pip positions for 2–10 (x, y); pips below the middle are drawn upside down. */
function pipLayout(count: number): [number, number][] {
  const sides = (ys: readonly number[]) => ys.flatMap((y) => [[COL.L, y], [COL.R, y]] as [number, number][]);
  switch (count) {
    case 2: return [[COL.M, TOP], [COL.M, BOTTOM]];
    case 3: return [[COL.M, TOP], [COL.M, MID], [COL.M, BOTTOM]];
    case 4: return sides([TOP, BOTTOM]);
    case 5: return [...sides([TOP, BOTTOM]), [COL.M, MID]];
    case 6: return sides([TOP, MID, BOTTOM]);
    case 7: return [...sides([TOP, MID, BOTTOM]), [COL.M, (TOP + MID) / 2]];
    case 8: return [...sides([TOP, MID, BOTTOM]), [COL.M, (TOP + MID) / 2], [COL.M, (MID + BOTTOM) / 2]];
    case 9: return [...sides(ROW4), [COL.M, MID]];
    case 10: return [...sides(ROW4), [COL.M, 112], [COL.M, 238]];
    default: return [];
  }
}

const escapeXml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

const PIP_COUNT: Partial<Record<Rank, number>> = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, T: 10 };

function cornerIndex(text: string, set: SuitSet, suit: Suit, x: number, textY: number, fontSize: number, pipY: number, pipSize: number): string {
  const narrow = text.length > 1 ? ' letter-spacing="-3"' : '';
  const size = text.length > 1 ? fontSize * 0.86 : fontSize;
  return `<text class="wp-pc-index" x="${n(x)}" y="${n(textY)}" font-size="${n(size)}"${narrow} text-anchor="middle" font-weight="700" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans', sans-serif" fill="currentColor">${escapeXml(text)}</text>` +
    pip(set, suit, x, pipY, pipSize);
}

function courtPanel(set: SuitSet, suit: Suit, rank: 'J' | 'Q' | 'K'): string {
  const emblem = EMBLEMS[set][rank];
  return `<rect class="wp-pc-court" x="54" y="50" width="142" height="250" rx="10" fill="none" stroke="currentColor" stroke-width="3"/>` +
    `<g transform="translate(125 108)">${emblem}</g>` +
    pip(set, suit, 125, MID, 66) +
    `<g transform="rotate(180 125 175) translate(125 108)">${emblem}</g>`;
}

function faceBody(card: Card, set: SuitSet, style: CardStyle, t: Translator | undefined): string {
  const rank = rankOf(card);
  const suit = suitOf(card);
  const index = rankIndex(rank, t, set);
  const count = PIP_COUNT[rank];
  if (style === 'index') {
    const corners = cornerIndex(index, set, suit, 44, 82, 74, 122, 50) + cornerIndex(index, set, suit, 206, 82, 74, 122, 50);
    if (rank === 'J' || rank === 'Q' || rank === 'K') {
      return corners + `<g transform="translate(125 205) scale(0.8)">${EMBLEMS[set][rank]}</g>` + pip(set, suit, 125, 280, 72);
    }
    return corners + pip(set, suit, 125, 250, rank === 'A' ? 120 : 100);
  }
  const corners = cornerIndex(index, set, suit, 28, 50, 44, 74, 30);
  const body = count !== undefined
    ? pipLayout(count).map(([x, y]) => pip(set, suit, x, y, 52, y > MID)).join('')
    : rank === 'A'
      ? pip(set, suit, 125, 175, 120)
      : courtPanel(set, suit, rank as 'J' | 'Q' | 'K');
  return `${corners}<g transform="rotate(180 125 175)">${corners}</g>${body}`;
}

/** Neutral back: inset border, a field of small diamonds and a ring in the centre. */
function backBody(): string {
  const dots: string[] = [];
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 7; col++) {
      const x = 35 + col * 30 + (row % 2) * 15;
      const y = 38 + row * 30.5;
      if (x > 220) continue;
      if (Math.hypot(x - 125, y - 175) < 52) continue;
      dots.push(`M${n(x)} ${n(y - 7)}L${n(x + 7)} ${n(y)}L${n(x)} ${n(y + 7)}L${n(x - 7)} ${n(y)}Z`);
    }
  }
  return `<rect class="wp-pc-back-line" x="14" y="14" width="222" height="322" rx="8" fill="none" stroke="#9fc3b5" stroke-width="4"/>` +
    `<path class="wp-pc-back-dots" fill="#9fc3b5" d="${dots.join('')}"/>` +
    `<circle class="wp-pc-back-line" cx="125" cy="175" r="38" fill="none" stroke="#9fc3b5" stroke-width="5"/>` +
    `<path class="wp-pc-back-dots" fill="#9fc3b5" d="M125 151L134 175L125 199L116 175ZM101 175L125 166L149 175L125 184Z"/>`;
}

/** Default colour mode for a suit set. */
export const defaultColors = (set: SuitSet): CardColors => (set === 'german' ? 'four' : 'two');

/**
 * SVG markup of one card (`null` = face down). Pure string, no DOM needed; `renderCard` wraps it
 * into an element. The root carries `role="img"` and `aria-label`, or `aria-hidden="true"` when
 * there is no label; the drawing itself is always in an `aria-hidden` group.
 */
export function cardSvgMarkup(card: Card | null, options: CardMarkupOptions = {}): string {
  const set = options.suits ?? 'french';
  const colors = options.colors ?? defaultColors(set);
  const style = options.style ?? 'full';
  const label = options.label === false ? undefined : options.label ?? (options.t ? cardLabel(card, options.t, set) : undefined);
  const classes = ['wp-pc', `wp-pc--${set}`, `wp-pc--${colors}`, `wp-pc--${style}`];
  if (card === null) classes.push('wp-pc--back');
  else classes.push(`wp-pc-s-${suitOf(card)}`);
  if (options.className) classes.push(options.className);
  const a11y = label === undefined ? 'aria-hidden="true"' : `role="img" aria-label="${escapeXml(label)}"`;
  const face = card === null
    ? `<rect class="wp-pc-backface" x="1.5" y="1.5" width="247" height="347" rx="14" fill="#2f5d50" stroke="#45463f" stroke-width="3"/>${backBody()}`
    : `<rect class="wp-pc-face" x="1.5" y="1.5" width="247" height="347" rx="14" fill="#fff" stroke="#9a9890" stroke-width="3"/>` +
      `<g class="wp-pc-ink" fill="currentColor">${faceBody(card, set, style, options.t)}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" class="${escapeXml(classes.join(' '))}" ${a11y} focusable="false"><g aria-hidden="true">${face}</g></svg>`;
}
