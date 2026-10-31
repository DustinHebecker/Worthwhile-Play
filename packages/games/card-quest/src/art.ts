import type { BaseKind, CardDef } from './cards';
import { baseId } from './cards';
import { defOf } from './worlds';

/*
 * Pictogram construction kit (design § 7.3): every picture is drawn in code from a few parts — a silhouette per
 * base kind (or per item slot / card type) plus eyes, mouth and an accessory chosen from the card id. Original
 * shapes only; colours come from CSS classes (light, dark and forced colours), shapes alone tell kinds apart.
 * Returns static SVG markup (no text, no user data).
 */

const hash = (s: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h >>> 0;
};

const BODY: Record<BaseKind, string> = {
  // Diggers: stout body, big beard, pointy cap.
  digger: '<path class="b" d="M14 40c0-12 4-20 10-20s10 8 10 20z"/><path class="a" d="M17 22l7-14 7 14z"/><path class="d" d="M18 30c2 8 10 8 12 0l-3 10h-6z"/>',
  // Knick-knacks: figure on a base plate, tall hat.
  figurine: '<rect class="d" x="12" y="38" width="24" height="5" rx="2"/><path class="b" d="M16 38c0-10 3-16 8-16s8 6 8 16z"/><path class="a" d="M18 23l6-17 6 17z"/>',
  // Tin Things: box with wheels and an antenna.
  machine: '<rect class="b" x="11" y="17" width="26" height="20" rx="3"/><circle class="d" cx="17" cy="40" r="4"/><circle class="d" cx="31" cy="40" r="4"/><path class="k" d="M24 17V9"/><circle class="a" cx="24" cy="8" r="2.5"/>',
  // Goo: dripping blob.
  goo: '<path class="b" d="M9 38c0-14 6-24 15-24s15 10 15 24c-3 0-3 4-6 4s-3-4-6-4-3 5-6 5-3-5-6-5-3 4-6 0z"/>',
  // Crawlers: oval body with six legs and feelers.
  crawler: '<path class="k" d="M12 26l-6-4M12 31H5M12 36l-6 4M36 26l6-4M36 31h7M36 36l6 4M20 18l-4-8M28 18l4-8"/><ellipse class="b" cx="24" cy="30" rx="12" ry="12"/>',
  // Critters: round body with ears and a tail.
  critter: '<path class="k" d="M36 34c6 0 8-6 6-10"/><circle class="b" cx="24" cy="29" r="12"/><circle class="b" cx="15" cy="17" r="5"/><circle class="b" cx="33" cy="17" r="5"/>',
  // Bigmouths: head with a very big mouth.
  bigmouth: '<rect class="b" x="12" y="10" width="24" height="30" rx="11"/><path class="d" d="M15 31h18c0 6-4 9-9 9s-9-3-9-9z"/>',
  // Greens: leafy shape with a stem.
  greens: '<path class="k" d="M24 44V26"/><path class="b" d="M24 28C12 28 8 18 10 8c8 0 14 6 14 14 0-8 6-14 14-14 2 10-2 20-14 20z"/>',
  // Spooks: ghost with wavy hem.
  spook: '<path class="b" d="M11 42V22c0-9 6-14 13-14s13 5 13 14v20l-4-4-4 4-5-4-5 4-4-4z"/>'
};

const EYES = [
  '<circle class="e" cx="20" cy="26" r="2.2"/><circle class="e" cx="28" cy="26" r="2.2"/>',
  '<circle class="e" cx="20" cy="25" r="3"/><circle class="e" cx="28" cy="25" r="1.6"/>',
  '<path class="k" d="M17 25h5M26 25h5"/>',
  '<circle class="e" cx="24" cy="25" r="3"/>'
];

const ACCESSORY = [
  '',
  '<path class="k" d="M18 22l4 1M30 22l-4 1"/>',
  '<rect class="a" x="17" y="23" width="14" height="4" rx="2"/>',
  '<path class="a" d="M33 12l4-4 2 6z"/>'
];

const SLOT_ICON: Record<string, string> = {
  head: '<path class="b" d="M10 32c0-12 6-20 14-20s14 8 14 20z"/><rect class="d" x="7" y="31" width="34" height="5" rx="2"/>',
  body: '<path class="b" d="M14 12l-8 8 5 6 3-3v19h20V23l3 3 5-6-8-8h-6c0 3-2 5-4 5s-4-2-4-5z"/>',
  feet: '<path class="b" d="M16 8h10v22l12 4c3 1 4 4 3 8H12z"/>',
  hand: '<path class="d" d="M22 14h4v30h-4z"/><path class="b" d="M12 8h24v8H12z"/>',
  hand2: '<path class="d" d="M22 10h4v34h-4z"/><path class="b" d="M10 6h28l-4 10H14z"/><path class="k" d="M14 16v6M20 16v6M28 16v6M34 16v6"/>',
  small: '<path class="b" d="M14 18h20l4 24H10z"/><path class="k" d="M18 18c0-6 12-6 12 0"/>'
};

const TYPE_ICON: Partial<Record<CardDef['type'], string>> = {
  booster: '<circle class="b" cx="24" cy="24" r="16"/><path class="e" d="M22 14h4v8h8v4h-8v8h-4v-8h-8v-4h8z"/>',
  reinforcement: '<circle class="b" cx="17" cy="28" r="10"/><circle class="b" cx="31" cy="22" r="10"/><path class="e" d="M29 20h4M14 26h4"/>',
  windfall: '<path class="b" d="M12 20h24l3 22H9z"/><path class="k" d="M17 20c0-8 14-8 14 0"/><circle class="a" cx="24" cy="31" r="5"/>',
  curse: '<circle class="b" cx="24" cy="24" r="16"/><path class="k" d="M24 8l-4 10 7 4-5 9 3 9"/>',
  profession: '<path class="b" d="M24 6l14 6v12c0 9-6 15-14 18-8-3-14-9-14-18V12z"/><path class="k" d="M18 24l4 4 8-9"/>',
  upgrade: '<path class="b" d="M10 34l18-18 4 4-18 18z"/><path class="a" d="M30 8l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
  oneshot: '<path class="b" d="M24 6l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z"/>',
  levelup: '<path class="b" d="M8 40h10V30h10V20h10V10"/><path class="e" d="M30 8h10v10"/>',
  double: '<circle class="b" cx="18" cy="24" r="11"/><circle class="a" cx="30" cy="24" r="11"/>'
};

/** SVG markup of a card's pictogram (48 × 48 view box). */
export function pictogram(card: string): string {
  const def = defOf(card);
  let inner: string;
  if (def.type === 'monster' || def.type === 'origin') {
    const h = hash(baseId(card));
    inner = BODY[def.kind] + EYES[h % EYES.length] + ACCESSORY[(h >>> 4) % ACCESSORY.length];
  } else if (def.type === 'item') {
    inner = SLOT_ICON[def.slot === 'hand' && def.hands === 2 ? 'hand2' : def.slot] ?? '';
  } else inner = TYPE_ICON[def.type] ?? '';
  return `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" class="cq-pic cq-pic-${def.type}">${inner}</svg>`;
}

/** Silhouette of a base kind (for the kind label of a card). */
export function kindIcon(kind: BaseKind): string {
  return `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" class="cq-kind">${BODY[kind]}</svg>`;
}
