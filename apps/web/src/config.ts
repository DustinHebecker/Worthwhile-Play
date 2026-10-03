/** Build-time configuration injected by vite.config.ts (`define`). */
declare const __WP_LEGAL__: { name: string; address: string[]; email: string };
declare const __WP_VERSION__: string;

export const REPOSITORY_URL = 'https://github.com/DustinHebecker/Worthwhile-Play';
export const ROADMAP_URL = `${REPOSITORY_URL}/blob/main/docs/ROADMAP.md`;
export const APP_NAME = 'Worthwhile Play';
export const APP_VERSION = __WP_VERSION__;

/**
 * Provider details for the legal notice (Impressum). Never stored in Git:
 * injected at release build time from the environment (WP_LEGAL_*). Empty in
 * development/CI builds, in which case the page says so explicitly.
 */
export const LEGAL = __WP_LEGAL__;
export const hasLegalDetails = (): boolean => LEGAL.name.trim() !== '' && LEGAL.address.length > 0;

export const SESSION_NOTE_MINUTES = 20;
export const SESSION_NOTE_KEY = 'worthwhile-play:session-note';
