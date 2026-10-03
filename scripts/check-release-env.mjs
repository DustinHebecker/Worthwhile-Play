// Guards public releases: the legal notice (Impressum) must contain the provider details.
// Values come from the environment or an untracked .env.production.local; never from Git.
import { loadEnv } from 'vite';

const env = { ...loadEnv('production', process.cwd(), 'WP_'), ...process.env };
const missing = [];
if (!env.WP_LEGAL_NAME?.trim()) missing.push('WP_LEGAL_NAME');
if ((env.WP_LEGAL_ADDRESS ?? '').split('|').filter((l) => l.trim()).length < 2) missing.push('WP_LEGAL_ADDRESS (pipe-separated, at least street and city lines)');
if (missing.length) {
  console.error(`Release blocked: set ${missing.join(', ')} (see docs/deployment.md). Values are never printed.`);
  process.exit(1);
}
console.log('Release environment OK (legal notice configured).');
