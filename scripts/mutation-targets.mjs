#!/usr/bin/env node
// Prints the subset of the given files (args or stdin, one per line) that stryker.config.json
// would mutate, comma-separated for `stryker run --mutate`. Used on pull requests so that
// mutation testing covers the changed logic instead of the whole (growing) repository.
import { readFileSync } from 'node:fs';
import { matchesGlob } from 'node:path';

const config = JSON.parse(readFileSync(new URL('../stryker.config.json', import.meta.url), 'utf8'));
const include = config.mutate.filter((p) => !p.startsWith('!'));
const exclude = config.mutate.filter((p) => p.startsWith('!')).map((p) => p.slice(1));

const input = process.argv.length > 2 ? process.argv.slice(2) : readFileSync(0, 'utf8').split('\n');
const targets = input
  .map((f) => f.trim())
  .filter((f) => f && include.some((p) => matchesGlob(f, p)) && !exclude.some((p) => matchesGlob(f, p)));

process.stdout.write([...new Set(targets)].sort().join(','));
