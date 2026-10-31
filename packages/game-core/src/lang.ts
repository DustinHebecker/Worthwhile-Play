import type { GameMetadata } from './types';

/**
 * The 16 UI locales, matching the Home Workout project. BCP-47 identifiers. Defined here so that `GameMetadata`
 * can name them (games depend only on @wp/game-core); `@wp/localization` re-exports them with the locale registry.
 */
export const SUPPORTED_LOCALES = ['de', 'en', 'nl', 'es', 'fr', 'ru', 'zh-Hans', 'ko', 'ja', 'ar', 'pt', 'it', 'pl', 'tr', 'uk', 'hi'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * The BCP-47 tag to declare for content in `locale` (`lang` attributes, speech synthesis). Internal codes stay
 * short (`pt` in storage, URLs, catalogues, file names), but our Portuguese is Brazilian, so it is declared as
 * `pt-BR`: screen readers and speech synthesis then pick a Brazilian voice. Every other tag is returned unchanged
 * (`zh-Hans` stays `zh-Hans`; an explicit `pt-PT` stays `pt-PT`).
 */
export function bcp47Tag(locale: string): string {
  return locale.toLowerCase() === 'pt' ? 'pt-BR' : locale;
}

/**
 * The UI locales a game ships (ADR 0003 amendment 2026-10-24): `metadata.locales` when declared (a preview game
 * released early in a few locales), else all 16. Never throws on malformed metadata (then all 16, as before).
 */
export function gameLocales(metadata: Pick<GameMetadata, 'locales'>): readonly SupportedLocale[] {
  return Array.isArray(metadata.locales) ? metadata.locales : SUPPORTED_LOCALES;
}

/**
 * The locale a game's own texts are shown in when the UI is in `uiLocale`: `uiLocale` when the game ships it
 * (every game without `metadata.locales`), else English — quietly, as a declared fallback, not a missing key.
 */
export function gameLocale(metadata: Pick<GameMetadata, 'locales'>, uiLocale: SupportedLocale): SupportedLocale {
  return gameLocales(metadata).includes(uiLocale) ? uiLocale : 'en';
}
