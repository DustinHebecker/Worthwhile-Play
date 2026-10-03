import type { Deck } from '../deck';

/**
 * Language-neutral symbol deck used by classic Memory (image ↔ same image).
 * Uses widely supported Unicode emoji only; no third-party artwork is bundled.
 * `alt` is an English accessibility description; games translate it via their own messages if needed.
 */
const SYMBOLS: ReadonlyArray<[string, string]> = [
  ['🍎', 'apple'], ['🌙', 'moon'], ['⭐', 'star'], ['🌵', 'cactus'], ['🐢', 'turtle'], ['🎈', 'balloon'],
  ['🔑', 'key'], ['⚓', 'anchor'], ['🌻', 'sunflower'], ['🐙', 'octopus'], ['🎲', 'die'], ['🌲', 'tree'],
  ['🚲', 'bicycle'], ['🍄', 'mushroom'], ['🦉', 'owl'], ['🔔', 'bell'], ['🌈', 'rainbow'], ['🐝', 'bee'],
  ['🍋', 'lemon'], ['☂️', 'umbrella'], ['🐳', 'whale'], ['🎻', 'violin'], ['🔭', 'telescope'], ['🦋', 'butterfly']
];

export const SYMBOL_DECK: Deck = {
  schemaVersion: 1,
  id: 'symbols',
  title: { en: 'Symbols', de: 'Symbole' },
  license: 'Unicode emoji (no artwork bundled)',
  items: SYMBOLS.map(([symbol, alt]) => ({ id: alt.replace(/\s+/g, '-'), front: { symbol, alt }, back: { symbol, alt } }))
};
