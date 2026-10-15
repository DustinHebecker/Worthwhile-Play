import type { en } from './en';

/** A complete UI catalogue: every key of the English master, translated. */
export type Catalogue = Readonly<Record<keyof typeof en, string>>;
