/*
 * Card illustrations (design § 7.3, owner feedback B2): one original, code-drawn picture per card that shows what
 * the name says and carries its own gag. Static SVG markup (no text, no user data), 160 × 120 view box, colours
 * from `.il-*` classes (styles.css; forced colours too). Cards without an illustration fall back to the pictogram
 * kit (art.ts).
 */
import { ENCOUNTER } from './encounter';
import { ITEMS1 } from './items1';
import { ITEMS2 } from './items2';
import { LOOT } from './loot';
import { MONSTERS1 } from './monsters1';
import { MONSTERS2 } from './monsters2';
import { SAMPLE } from './sample';

const ILLUSTRATIONS: Readonly<Record<string, string>> = { ...SAMPLE, ...MONSTERS1, ...MONSTERS2, ...ITEMS1, ...ITEMS2, ...ENCOUNTER, ...LOOT };

/** SVG markup of a card's illustration, or `undefined` if the card has none yet. */
export function illustration(base: string): string | undefined {
  const inner = ILLUSTRATIONS[base];
  return inner === undefined ? undefined : `<svg viewBox="0 0 160 120" aria-hidden="true" focusable="false" class="cq-il">${inner}</svg>`;
}

/** Base ids that have an illustration (for tests). */
export const illustratedCards = (): string[] => Object.keys(ILLUSTRATIONS);
