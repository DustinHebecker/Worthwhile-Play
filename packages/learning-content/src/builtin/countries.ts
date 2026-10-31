/**
 * "Flags & countries": generated at runtime, nothing is bundled.
 * - Country names come from the user's browser (Unicode CLDR data via `Intl.DisplayNames`)
 *   in any content language the browser knows.
 * - Flags are Unicode regional-indicator sequences drawn by the system emoji font.
 *
 * The list is a fixed set of 60 widely recognised, undisputed UN member states with
 * distinct flags (ISO 3166-1 alpha-2 codes). Disputed or partially recognised
 * territories are deliberately not included.
 */
export const COUNTRY_CODES = [
  'AR', 'AT', 'AU', 'BE', 'BR', 'CA', 'CH', 'CL', 'CN', 'CO', 'CZ', 'DE', 'DK', 'EE', 'EG', 'ES', 'FI', 'FR', 'GB', 'GH',
  'GR', 'HR', 'HU', 'ID', 'IE', 'IN', 'IS', 'IT', 'JM', 'JP', 'KE', 'KR', 'LT', 'LV', 'MA', 'MN', 'MX', 'NG', 'NL', 'NO',
  'NP', 'NZ', 'PE', 'PH', 'PK', 'PL', 'PT', 'RO', 'RU', 'SA', 'SE', 'SN', 'TH', 'TN', 'TR', 'UA', 'US', 'UY', 'VN', 'ZA'
] as const;
export type CountryCode = (typeof COUNTRY_CODES)[number];

export function isCountryCode(value: unknown): value is CountryCode {
  return typeof value === 'string' && (COUNTRY_CODES as readonly string[]).includes(value);
}

/** Flag emoji for an ISO 3166-1 alpha-2 code (two regional indicator symbols). */
export function flagEmoji(code: string): string {
  return [...code.toUpperCase()].map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join('');
}

const displayNames = new Map<string, Intl.DisplayNames | null>();

function regionNames(language: string): Intl.DisplayNames | null {
  if (!displayNames.has(language)) {
    let names: Intl.DisplayNames | null = null;
    try {
      names = new Intl.DisplayNames([language], { type: 'region', fallback: 'code' });
    } catch {
      names = null;
    }
    displayNames.set(language, names);
  }
  return displayNames.get(language) ?? null;
}

/** Country name in `language` from the platform's CLDR data; the code itself if unavailable. */
export function countryName(code: string, language: string): string {
  try {
    return regionNames(language)?.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/** True when the platform has region names for this language (not only a fallback to the default locale). */
export function hasCountryNames(language: string): boolean {
  try {
    return Intl.DisplayNames.supportedLocalesOf([language]).length > 0;
  } catch {
    return false;
  }
}
