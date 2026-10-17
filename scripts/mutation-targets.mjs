#!/usr/bin/env node
// Prints the subset of the given files (args or stdin, one per line) that stryker.config.json
// would mutate: comma-separated for `stryker run --mutate`, or with `--json` as a JSON array of such
// comma-separated groups for a CI matrix (one file per group, or `--groups N` round-robin groups). Used on pull requests so that mutation testing covers the changed logic
// instead of the whole (growing) repository, and by the weekly run to split all targets into jobs.
import { readFileSync } from 'node:fs';
import { matchesGlob } from 'node:path';

const config = JSON.parse(readFileSync(new URL('../stryker.config.json', import.meta.url), 'utf8'));
const include = config.mutate.filter((p) => !p.startsWith('!'));
const exclude = config.mutate.filter((p) => p.startsWith('!')).map((p) => p.slice(1));

const argv = process.argv.slice(2);
const json = argv.includes('--json');
const groupsAt = argv.indexOf('--groups');
const groups = groupsAt >= 0 ? Math.max(1, Number.parseInt(argv[groupsAt + 1] ?? '', 10) || 1) : 0;
const args = argv.filter((a, i) => a !== '--json' && (groupsAt < 0 || (i !== groupsAt && i !== groupsAt + 1)));
const input = args.length > 0 ? args : readFileSync(0, 'utf8').split('\n');
const targets = input
  .map((f) => f.trim())
  .filter((f) => f && include.some((p) => matchesGlob(f, p)) && !exclude.some((p) => matchesGlob(f, p)));

const unique = [...new Set(targets)].sort();
if (!json) {
  process.stdout.write(unique.join(','));
} else if (groups === 0) {
  process.stdout.write(JSON.stringify(unique));
} else {
  const buckets = Array.from({ length: Math.min(groups, unique.length) }, () => []);
  unique.forEach((file, i) => buckets[i % buckets.length].push(file));
  process.stdout.write(JSON.stringify(buckets.map((b) => b.join(','))));
}
