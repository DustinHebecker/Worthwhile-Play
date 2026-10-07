/**
 * Vocabulary ids shared by the rules and the message catalogue (kept tiny and dependency-free
 * so that `metadata.ts` stays light). Each id maps to `item.<kind>.<id>` (grid label) and
 * `subject.<kind>.<id>` (a full noun phrase used inside clue sentences).
 */
// @ts-nocheck

export const ATTRIBUTE_KINDS = ['pet', 'drink', 'colour'] as const;
export type AttributeKind = (typeof ATTRIBUTE_KINDS)[number];

export const VOCABULARY: Readonly<Record<AttributeKind, readonly string[]>> = {
  pet: ['cat', 'dog', 'bird', 'fish', 'rabbit', 'turtle'],
  drink: ['tea', 'coffee', 'milk', 'juice', 'water', 'cocoa'],
  colour: ['red', 'blue', 'green', 'yellow', 'black', 'white']
};

/** Number of person names available (`name.0` … `name.7`). */
export const NAME_COUNT = 8;

export const CLUE_TYPES = ['same', 'notSame', 'directlyAbove', 'above', 'nextTo', 'eitherOr'] as const;
export type ClueType = (typeof CLUE_TYPES)[number];
