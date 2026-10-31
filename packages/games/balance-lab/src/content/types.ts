// Type only (erased at build time): the English file is the reference for the keys.
import type { content as en } from './en';

/** A key of the in-game texts (buttons, task texts, outcomes, explanations, screen-reader descriptions). */
export type ContentKey = keyof typeof en;

/** The in-game texts of one UI locale; placeholders in braces are filled by the view. */
export type BalanceContent = Readonly<Record<ContentKey, string>>;
