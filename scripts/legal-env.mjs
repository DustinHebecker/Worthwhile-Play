// Parses the legal-notice (Impressum) configuration from environment values.
// Lenient on purpose: secrets are often pasted straight from an .env file, e.g.
//   HW_LEGAL_ADDRESS="Name
//   Street 1
//   12345 City"
// Accepted separators: newline or "|". A leading `KEY=` prefix and surrounding quotes are ignored.

/** @param {string | undefined} value */
export function legalLines(value) {
  let text = (value ?? '').trim();
  text = text.replace(/^[A-Z][A-Z0-9_]*\s*=\s*/, '');
  if (text.length >= 2 && (text[0] === '"' || text[0] === "'") && text.at(-1) === text[0]) text = text.slice(1, -1);
  return text
    .replace(/\\n/g, '\n')
    .split(/\r?\n|\|/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * @param {Record<string, string | undefined>} env
 * @returns {{ name: string, address: string[], email: string }}
 */
export function legalFromEnv(env) {
  const combined = legalLines(env.WP_LEGAL);
  const separateName = legalLines(env.WP_LEGAL_NAME).join(' ');
  const separateAddress = legalLines(env.WP_LEGAL_ADDRESS);
  return {
    name: separateName || (combined[0] ?? ''),
    address: separateAddress.length ? separateAddress : combined.slice(1),
    email: legalLines(env.WP_LEGAL_EMAIL).join('')
  };
}
