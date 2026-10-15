import type { GameMessages } from '@wp/game-core';
import { de } from './de';
import { en } from './en';
import type { Catalogue } from './types';

/**
 * UI messages of Lootlings in all 16 locales (metadata.messages must be complete and synchronous).
 * English is the master; German is written directly; the others are transcreated from the master.
 * Card names and flavour lines are not here: they are per-locale content chunks (src/content, ADR 0011).
 */
const catalogues: Readonly<Record<string, Catalogue>> = { en, de };

export const messages: GameMessages = catalogues;
