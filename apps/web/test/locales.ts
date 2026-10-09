import { SUPPORTED_LOCALES } from '@wp/localization';
import { loadLocale } from '../src/i18n';

/** Loads the shell messages of every locale (in the app only the UI locale and English are loaded). */
export async function loadAllLocales(): Promise<void> {
  await Promise.all(SUPPORTED_LOCALES.map((locale) => loadLocale(locale)));
}
