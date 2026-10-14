// Guards public releases: the legal notice (Impressum) must contain the provider details.
// Values come from the environment or an untracked .env.production.local; never from Git.
import { loadEnv } from 'vite';
import { legalFromEnv } from './legal-env.mjs';

const legal = legalFromEnv({ ...loadEnv('production', process.cwd(), 'WP_'), ...process.env });
if (!legal.name || legal.address.length < 2) {
  console.error('Release blocked: set WP_LEGAL to the provider name and postal address (lines separated by newlines or "|"). See docs/deployment.md. Values are never printed.');
  process.exit(1);
}
console.log(`Release environment OK (legal notice: name + ${legal.address.length} address lines).`);
