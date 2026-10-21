// Report-only variant of stryker.config.json for the weekly sample (ADR 0021): same settings,
// but no break threshold, so a low score is reported in the job summary instead of failing the run.
// Usage: pnpm mutation stryker.report.config.mjs --mutate <files>
import { readFileSync } from 'node:fs';

const base = JSON.parse(readFileSync(new URL('./stryker.config.json', import.meta.url), 'utf8'));
delete base.$schema;

export default { ...base, thresholds: { ...base.thresholds, break: null } };
