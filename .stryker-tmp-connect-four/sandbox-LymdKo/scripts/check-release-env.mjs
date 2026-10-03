// @ts-nocheck
// Guards public releases: the legal notice (Impressum) must contain the provider details.
// Values come from the environment or an untracked .env.production.local; never from Git.
// Accepted: WP_LEGAL="Name|Street|City|Country" or WP_LEGAL_NAME + WP_LEGAL_ADDRESS.
import { loadEnv } from 'vite';

const env = { ...loadEnv('production', process.cwd(), 'WP_'), ...process.env };
const lines = (value) => (value ?? '').split('|').map((l) => l.trim()).filter(Boolean);
const combined = lines(env.WP_LEGAL);
const name = env.WP_LEGAL_NAME?.trim() || combined[0];
const address = env.WP_LEGAL_ADDRESS?.trim() ? lines(env.WP_LEGAL_ADDRESS) : combined.slice(1);
if (!name || address.length < 2) {
  console.error('Release blocked: set WP_LEGAL="Name|Street|Postal code City|Country" (or WP_LEGAL_NAME + WP_LEGAL_ADDRESS). See docs/deployment.md. Values are never printed.');
  process.exit(1);
}
console.log('Release environment OK (legal notice configured).');
